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
export const authMiddleware = async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
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
// OpenAI chat helper (direct REST via fetch)
// ============================================
export async function openaiChat(env, messages, maxTokens = 500) {
  if (!env.OPENAI_API_KEY) {
    const err = new Error('OPENAI_API_KEY not configured');
    err.code = 'NO_KEY';
    throw err;
  }
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      max_tokens: maxTokens,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI error ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}
