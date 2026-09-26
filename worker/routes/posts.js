import { Hono } from 'hono';
import { authMiddleware, parsePost, toArray, body } from '../lib.js';

const posts = new Hono();
posts.use('*', authMiddleware);

async function getWorkspaceId(c, userId) {
  const workspace = await c.env.DB.prepare(
    `SELECT w.id FROM dashboard_workspaces w
     JOIN dashboard_workspace_members wm ON w.id = wm.workspace_id
     WHERE wm.user_id = ?
     LIMIT 1`
  ).bind(userId).first();
  return workspace?.id;
}

// CREATE
posts.post('/', async (c) => {
  const b = await body(c);
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const status = b.scheduled_time ? 'scheduled' : 'draft';

  const row = await c.env.DB.prepare(
    `INSERT INTO dashboard_posts
      (workspace_id, account_id, property_id, content, media_urls, scheduled_time, platform, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`
  ).bind(
    workspaceId,
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
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json([]);
  
  const { results } = await c.env.DB
    .prepare('SELECT * FROM dashboard_posts WHERE workspace_id = ? ORDER BY created_at DESC')
    .bind(workspaceId)
    .all();
  return c.json(results.map(parsePost));
});

// UPDATE STATUS
posts.patch('/:id/status', async (c) => {
  const { status } = await body(c);
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const row = await c.env.DB
    .prepare('UPDATE dashboard_posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND workspace_id = ? RETURNING *')
    .bind(status, c.req.param('id'), workspaceId)
    .first();
  if (!row) return c.json({ error: 'Post not found' }, 404);
  return c.json(parsePost(row));
});

// UPDATE (full edit + reschedule)
posts.put("/:id", async (c) => {
  const b = await body(c);
  const userId = c.get("userId");
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: "Workspace not found" }, 404);
  const status = b.scheduled_time ? "scheduled" : (b.status || "draft");
  const row = await c.env.DB
    .prepare("UPDATE dashboard_posts SET content = COALESCE(?, content), platform = COALESCE(?, platform), scheduled_time = ?, status = ?, account_id = COALESCE(?, account_id), property_id = COALESCE(?, property_id), updated_at = CURRENT_TIMESTAMP WHERE id = ? AND workspace_id = ? RETURNING *")
    .bind(b.content ?? null, b.platform ?? null, b.scheduled_time ?? null, status, b.account_id ?? null, b.property_id ?? null, c.req.param("id"), workspaceId)
    .first();
  if (!row) return c.json({ error: "Post not found" }, 404);
  return c.json(parsePost(row));
});

// DELETE
posts.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const row = await c.env.DB
    .prepare('DELETE FROM dashboard_posts WHERE id = ? AND workspace_id = ? RETURNING id')
    .bind(c.req.param('id'), workspaceId)
    .first();
  if (!row) return c.json({ error: 'Post not found' }, 404);
  return c.json({ message: 'Post deleted successfully' });
});

export default posts;
