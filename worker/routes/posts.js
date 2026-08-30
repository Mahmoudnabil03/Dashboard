import { Hono } from 'hono';
import { authMiddleware, parsePost, toArray, body } from '../lib.js';

const posts = new Hono();
posts.use('*', authMiddleware);

// CREATE
posts.post('/', async (c) => {
  const b = await body(c);
  const userId = c.get('userId');
  const status = b.scheduled_time ? 'scheduled' : 'draft';

  const row = await c.env.DB.prepare(
    `INSERT INTO dashboard_posts
      (user_id, account_id, property_id, content, media_urls, scheduled_time, platform, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`
  ).bind(
    userId,
    b.account_id || null,
    b.property_id || null,
    b.content || null,
    JSON.stringify(toArray(b.media_urls)),
    b.scheduled_time || null,
    b.platform || null,
    status
  ).first();

  return c.json(parsePost(row), 201);
});

// LIST
posts.get('/', async (c) => {
  const userId = c.get('userId');
  const { results } = await c.env.DB
    .prepare('SELECT * FROM dashboard_posts WHERE user_id = ? ORDER BY created_at DESC')
    .bind(userId)
    .all();
  return c.json(results.map(parsePost));
});

// UPDATE STATUS
posts.patch('/:id/status', async (c) => {
  const { status } = await body(c);
  const userId = c.get('userId');
  const row = await c.env.DB
    .prepare('UPDATE dashboard_posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? RETURNING *')
    .bind(status, c.req.param('id'), userId)
    .first();
  if (!row) return c.json({ error: 'Post not found' }, 404);
  return c.json(parsePost(row));
});

// DELETE
posts.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const row = await c.env.DB
    .prepare('DELETE FROM dashboard_posts WHERE id = ? AND user_id = ? RETURNING id')
    .bind(c.req.param('id'), userId)
    .first();
  if (!row) return c.json({ error: 'Post not found' }, 404);
  return c.json({ message: 'Post deleted successfully' });
});

export default posts;
