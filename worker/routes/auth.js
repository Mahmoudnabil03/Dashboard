import { Hono } from "hono";
import { sign } from "hono/jwt";
import { hashPassword, verifyPassword, body, rateLimit, sendEmail, randomToken } from "../lib.js";

const auth = new Hono();

// Throttle brute force on all auth endpoints: 20 req / 10 min per IP+route.
auth.use("*", rateLimit({ windowSec: 600, max: 20 }));

const WEEK = 60 * 60 * 24 * 7;

function makeToken(user, secret) {
  const now = Math.floor(Date.now() / 1000);
  return sign({ id: user.id, email: user.email, exp: now + WEEK }, secret, "HS256");
}

function sessionCookie(c, token, maxAge) {
  const secure = new URL(c.req.url).protocol === "https:" ? "; Secure" : "";
  c.header("Set-Cookie", "sh_token=" + token + "; HttpOnly" + secure + "; SameSite=Strict; Path=/; Max-Age=" + (maxAge || WEEK));
}

function clearSessionCookie(c) {
  const secure = new URL(c.req.url).protocol === "https:" ? "; Secure" : "";
  c.header("Set-Cookie", "sh_token=; HttpOnly" + secure + "; SameSite=Strict; Path=/; Max-Age=0");
}

function baseUrl(c) {
  return c.env.FRONTEND_URL || new URL(c.req.url).origin;
}

function isEmail(v) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

// Register (email verification required before dashboard access)
auth.post("/register", async (c) => {
  const { email, password, name } = await body(c);
  if (!isEmail(email)) return c.json({ error: "Enter a valid email address." }, 400);
  if (!password || String(password).length < 8) return c.json({ error: "Password must be at least 8 characters." }, 400);

  const existing = await c.env.DB.prepare("SELECT id FROM dashboard_users WHERE email = ?").bind(email.trim()).first();
  if (existing) return c.json({ error: "An account with this email already exists." }, 409);

  const hashed = await hashPassword(password);
  const user = await c.env.DB
    .prepare("INSERT INTO dashboard_users (email, password, name, email_verified) VALUES (?, ?, ?, 0) RETURNING id, email, name")
    .bind(email.trim(), hashed, name || null)
    .first();

  const token = randomToken(32);
  const exp = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  await c.env.DB.prepare(
    "INSERT INTO dashboard_email_tokens (user_id, email, token, purpose, expires_at) VALUES (?, ?, ?, 'verify', ?)"
  ).bind(user.id, email.trim(), token, exp).run();

  try {
    await sendEmail(c.env, {
      to: email.trim(),
      subject: "Verify your SocialHub account",
      html: "<p>Welcome to SocialHub. Verify your email within 24 hours:</p><p><a href=\"" + baseUrl(c) + "/verify?token=" + token + "\">Verify my email</a></p>",
    });
  } catch (err) {
    try { c.get("log").error("email-send", { message: String(err.message || err) }); } catch {}
  }

  return c.json({ user, requires_verification: true, message: "Account created. Check your email for a verification link." }, 201);
});

// Login (blocked until email verified)
auth.post("/login", async (c) => {
  const { email, password } = await body(c);
  if (!isEmail(email) || !password) return c.json({ error: "Enter your email and password." }, 400);

  const user = await c.env.DB.prepare("SELECT * FROM dashboard_users WHERE email = ?").bind(email.trim()).first();
  if (!user) return c.json({ error: "Invalid email or password." }, 401);

  const valid = await verifyPassword(password, user.password);
  if (!valid) return c.json({ error: "Invalid email or password." }, 401);
  if (!user.email_verified) {
    return c.json({ error: "Verify your email before signing in. Check your inbox for the link.", code: "UNVERIFIED" }, 403);
  }

  const token = await makeToken(user, c.env.JWT_SECRET);
  sessionCookie(c, token, WEEK);
  return c.json({ user: { id: user.id, email: user.email, name: user.name }, token });
});

// Current session (used by the SPA to restore cookie sessions on reload)
auth.get("/me", async (c) => {
  const header = c.req.header("Authorization") || "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  let token = m ? m[1] : null;
  if (!token) {
    const cookie = c.req.header("Cookie") || "";
    const found = cookie.split(";").map((s) => s.trim()).find((s) => s.startsWith("sh_token="));
    if (found) token = found.slice("sh_token=".length);
  }
  if (!token) return c.json({ error: "Not authenticated." }, 401);
  try {
    const { verify } = await import("hono/jwt");
    const payload = await verify(token, c.env.JWT_SECRET, "HS256");
    const user = await c.env.DB.prepare("SELECT id, email, name FROM dashboard_users WHERE id = ?").bind(payload.id).first();
    if (!user) return c.json({ error: "Not authenticated." }, 401);
    return c.json({ user });
  } catch {
    return c.json({ error: "Session expired. Please sign in again." }, 401);
  }
});

// Logout (clears the httpOnly session cookie)
auth.post("/logout", async (c) => {
  clearSessionCookie(c);
  return c.json({ message: "Signed out." });
});

// Verify email address
auth.get("/verify", async (c) => {
  const token = c.req.query("token");
  if (!token) return c.json({ error: "Missing verification token." }, 400);
  const row = await c.env.DB.prepare(
    "SELECT * FROM dashboard_email_tokens WHERE token = ? AND purpose = 'verify' AND used = 0"
  ).bind(token).first();
  if (!row) return c.json({ error: "This link is invalid or has already been used." }, 400);
  if (new Date(row.expires_at).getTime() < Date.now()) return c.json({ error: "This link has expired. Request a new one." }, 400);
  await c.env.DB.prepare("UPDATE dashboard_users SET email_verified = 1 WHERE id = ?").bind(row.user_id).run();
  await c.env.DB.prepare("UPDATE dashboard_email_tokens SET used = 1 WHERE id = ?").bind(row.id).run();
  return c.json({ message: "Email verified. You can now sign in." });
});

// Resend verification email (always 200 to avoid account enumeration)
auth.post("/request-verification", async (c) => {
  const { email } = await body(c);
  if (isEmail(email)) {
    const user = await c.env.DB.prepare("SELECT id, email_verified FROM dashboard_users WHERE email = ?").bind(email.trim()).first();
    if (user && !user.email_verified) {
      const token = randomToken(32);
      const exp = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      await c.env.DB.prepare(
        "INSERT INTO dashboard_email_tokens (user_id, email, token, purpose, expires_at) VALUES (?, ?, ?, 'verify', ?)"
      ).bind(user.id, email.trim(), token, exp).run();
      try {
        await sendEmail(c.env, {
          to: email.trim(),
          subject: "Verify your SocialHub account",
          html: "<p>Verify your email within 24 hours:</p><p><a href=\"" + baseUrl(c) + "/verify?token=" + token + "\">Verify my email</a></p>",
        });
      } catch {}
    }
  }
  return c.json({ message: "If an unverified account exists for this email, a new link is on its way." });
});

// Forgot password (always 200 to avoid account enumeration)
auth.post("/forgot-password", async (c) => {
  const { email } = await body(c);
  if (isEmail(email)) {
    const user = await c.env.DB.prepare("SELECT id FROM dashboard_users WHERE email = ?").bind(email.trim()).first();
    if (user) {
      const token = randomToken(32);
      const exp = new Date(Date.now() + 3600 * 1000).toISOString();
      await c.env.DB.prepare(
        "INSERT INTO dashboard_email_tokens (user_id, email, token, purpose, expires_at) VALUES (?, ?, ?, 'reset', ?)"
      ).bind(user.id, email.trim(), token, exp).run();
      try {
        await sendEmail(c.env, {
          to: email.trim(),
          subject: "Reset your SocialHub password",
          html: "<p>Reset your password within 1 hour:</p><p><a href=\"" + baseUrl(c) + "/reset-password?token=" + token + "\">Reset password</a></p><p>If you did not request this, ignore this email.</p>",
        });
      } catch {}
    }
  }
  return c.json({ message: "If an account exists for this email, a reset link is on its way." });
});

// Reset password with token
auth.post("/reset-password", async (c) => {
  const { token, password } = await body(c);
  if (!token) return c.json({ error: "Missing reset token." }, 400);
  if (!password || String(password).length < 8) return c.json({ error: "Password must be at least 8 characters." }, 400);
  const row = await c.env.DB.prepare(
    "SELECT * FROM dashboard_email_tokens WHERE token = ? AND purpose = 'reset' AND used = 0"
  ).bind(token).first();
  if (!row) return c.json({ error: "This link is invalid or has already been used." }, 400);
  if (new Date(row.expires_at).getTime() < Date.now()) return c.json({ error: "This link has expired. Request a new one." }, 400);
  const hashed = await hashPassword(password);
  await c.env.DB.prepare("UPDATE dashboard_users SET password = ? WHERE id = ?").bind(hashed, row.user_id).run();
  await c.env.DB.prepare("UPDATE dashboard_email_tokens SET used = 1 WHERE user_id = ? AND purpose = 'reset'").bind(row.user_id).run();
  return c.json({ message: "Password updated. You can now sign in." });
});

export default auth;
