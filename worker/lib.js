import { verify } from 'hono/jwt';

// ============================================
// JSON helpers for D1 TEXT columns
// ============================================
export function parseJSON(value, fallback) {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// Accept an array or a comma-separated string, always return an array.
export function toArray(value) {
  if (Array.isArray(value)) return value.filter((v) => v !== null && v !== undefined && v !== '');
  if (typeof value === 'string' && value.trim() !== '') {
    return value.split(',').map((v) => v.trim()).filter(Boolean);
  }
  return [];
}

// Row shapers: turn stored JSON text back into JS values the frontend expects.
export function parseProperty(row) {
  if (!row) return row;
  return { ...row, features: parseJSON(row.features, []), image_urls: parseJSON(row.image_urls, []) };
}

export function parsePost(row) {
  if (!row) return row;
  return { ...row, media_urls: parseJSON(row.media_urls, []), metrics: parseJSON(row.metrics, null) };
}

export function parseAccount(row) {
  if (!row) return row;
  return { ...row, account_data: parseJSON(row.account_data, null) };
}

export function parseAgent(row) {
  if (!row) return row;
  return { ...row, config: parseJSON(row.config, {}) };
}

// ============================================
// Password hashing with Web Crypto (PBKDF2-SHA256)
// Format: pbkdf2$<iterations>$<saltHex>$<hashHex>
// ============================================
const encoder = new TextEncoder();
const ITERATIONS = 100000;

function bufToHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuf(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

async function derive(password, salt, iterations) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return bufToHex(bits);
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${bufToHex(salt)}$${hash}`;
}

export async function verifyPassword(password, stored) {
  try {
    const [algo, iterStr, saltHex, hashHex] = String(stored).split('$');
    if (algo !== 'pbkdf2') return false;
    const iterations = parseInt(iterStr, 10);
    const salt = hexToBuf(saltHex);
    const hash = await derive(password, salt, iterations);
    // Constant-ish time compare.
    if (hash.length !== hashHex.length) return false;
    let diff = 0;
    for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ hashHex.charCodeAt(i);
    return diff === 0;
  } catch {
    return false;
  }
}

// ============================================
// Auth middleware (Hono)
// ============================================
export function sessionToken(c) {
  const header = c.req.header('Authorization') || '';
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (m) return m[1];
  const cookie = c.req.header('Cookie') || '';
  const found = cookie.split(';').map((s) => s.trim()).find((s) => s.startsWith('sh_token='));
  return found ? found.slice('sh_token='.length) : null;
}

export const authMiddleware = async (c, next) => {
  const token = sessionToken(c);
  if (!token) {
    return c.json({ error: 'Access denied. No token provided.' }, 401);
  }
  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    c.set('userId', payload.id);
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

// Safe JSON body parse (avoids 500s on empty/invalid bodies).
export async function body(c) {
  return c.req.json().catch(() => ({}));
}

// ============================================
// AI chat helper: Cloudflare Workers AI binding first, OpenAI fallback.
// Set AI_MODEL secret to override (default: llama-3.1-8b-instruct).
// ============================================
export async function openaiChat(env, messages, maxTokens = 500) {
  if (env.AI) {
    try {
      const model = env.AI_MODEL || "@cf/meta/llama-3.1-8b-instruct";
      const out = await env.AI.run(model, { messages, max_tokens: maxTokens });
      if (typeof out === "string") return out;
      if (out && typeof out.response === "string") return out.response;
      if (out && typeof out.result === "string") return out.result;
      if (out && out.result && typeof out.result.response === "string") return out.result.response;
      if (Array.isArray(out)) return out.map((p) => (typeof p === "string" ? p : p.response || p.text || "")).join("");
      return JSON.stringify(out);
    } catch (err) {
      if (!env.OPENAI_API_KEY) throw new Error("Workers AI error: " + (err.message || err));
    }
  }
  if (!env.OPENAI_API_KEY) {
    const err = new Error("AI not configured: bind Workers AI or set OPENAI_API_KEY");
    err.code = "NO_KEY";
    throw err;
  }
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + env.OPENAI_API_KEY,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      max_tokens: maxTokens,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error("OpenAI error " + resp.status + ": " + text);
  }
  const data = await resp.json();
  return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
}

// ============================================
// Structured logging (LOG_LEVEL=silent|error|info|debug)
// ============================================
const LOG_LEVELS = { silent: 0, error: 1, info: 2, debug: 3 };

export function createLogger(env) {
  const level = LOG_LEVELS[String((env && env.LOG_LEVEL) || "info").toLowerCase()] ?? 2;
  const emit = (lv, stage, data) => {
    if (LOG_LEVELS[lv] > level) return;
    try {
      console.log(JSON.stringify({ ts: new Date().toISOString(), level: lv, stage, ...(data || {}) }));
    } catch {
      console.log(`[${lv}] ${stage}`);
    }
  };
  return {
    debug: (stage, data) => emit("debug", stage, data),
    info: (stage, data) => emit("info", stage, data),
    error: (stage, data) => emit("error", stage, data),
  };
}

// ============================================
// Email provider abstraction (mock fallback)
// Set EMAIL_PROVIDER=resend plus RESEND_API_KEY for real sending.
// Mock mode logs to the server console and reports mocked=true.
// ============================================
export async function sendEmail(env, { to, subject, html }) {
  const provider = String((env && env.EMAIL_PROVIDER) || "mock").toLowerCase();
  if (provider === "resend" && env.RESEND_API_KEY) {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + env.RESEND_API_KEY },
      body: JSON.stringify({ from: (env.EMAIL_FROM || "noreply@socialhub.example.com"), to, subject, html }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error("Email provider error " + resp.status + ": " + text.slice(0, 200));
    }
    return { sent: true, mocked: false };
  }
  console.log(JSON.stringify({ ts: new Date().toISOString(), level: "info", stage: "email-mock", to, subject }));
  return { sent: true, mocked: true };
}

export function randomToken(bytes) {
  const buf = crypto.getRandomValues(new Uint8Array(bytes || 32));
  return Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ============================================
// D1 sliding-window rate limiter.
// Usage: app.use("/auth/*", rateLimit({ windowSec: 600, max: 20 }))
// ============================================
export function rateLimit({ windowSec, max }) {
  const win = windowSec || 600;
  const limit = max || 20;
  return async (c, next) => {
    const ip = c.req.header("CF-Connecting-IP") || (c.req.header("X-Forwarded-For") || "").split(",")[0].trim() || "unknown";
    const route = c.req.path;
    try {
      await c.env.DB.prepare("DELETE FROM dashboard_rate_events WHERE created_at < datetime('now', '-' || ? || ' seconds')").bind(win).run();
      const row = await c.env.DB.prepare(
        "SELECT COUNT(*) AS n FROM dashboard_rate_events WHERE ip = ? AND route = ? AND created_at >= datetime('now', '-' || ? || ' seconds')"
      ).bind(ip, route, win).first();
      if (row && row.n >= limit) {
        return c.json({ error: "Too many attempts. Please wait a few minutes and try again." }, 429);
      }
      await c.env.DB.prepare("INSERT INTO dashboard_rate_events (ip, route) VALUES (?, ?)").bind(ip, route).run();
    } catch (err) {
      try { c.get("log").error("ratelimit-fallback", { message: String(err.message || err) }); } catch {}
    }
    await next();
  };
}
