import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { hashPassword, verifyPassword, body } from '../lib.js';

const auth = new Hono();

const WEEK = 60 * 60 * 24 * 7;

function makeToken(user, secret) {
  const now = Math.floor(Date.now() / 1000);
  return sign({ id: user.id, email: user.email, exp: now + WEEK }, secret, 'HS256');
}

// Register
auth.post('/register', async (c) => {
  const { email, password, name } = await body(c);
  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  const existing = await c.env.DB.prepare('SELECT id FROM dashboard_users WHERE email = ?').bind(email).first();
  if (existing) {
    return c.json({ error: 'User already exists' }, 400);
  }

  const hashed = await hashPassword(password);
  const user = await c.env.DB
    .prepare('INSERT INTO dashboard_users (email, password, name) VALUES (?, ?, ?) RETURNING id, email, name')
    .bind(email, hashed, name || null)
    .first();

  const token = await makeToken(user, c.env.JWT_SECRET);
  return c.json({ user, token }, 201);
});

// Login
auth.post('/login', async (c) => {
  const { email, password } = await body(c);

  const user = await c.env.DB.prepare('SELECT * FROM dashboard_users WHERE email = ?').bind(email).first();
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const token = await makeToken(user, c.env.JWT_SECRET);
  return c.json({ user: { id: user.id, email: user.email, name: user.name }, token });
});

export default auth;
