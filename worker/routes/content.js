import { Hono } from 'hono';
import { authMiddleware, body } from '../lib.js';

const content = new Hono();
content.use('*', authMiddleware);

async function getWorkspaceId(c, userId) {
  const workspace = await c.env.DB.prepare(
    `SELECT w.id FROM dashboard_workspaces w
     JOIN dashboard_workspace_members wm ON w.id = wm.workspace_id
     WHERE wm.user_id = ?
     LIMIT 1`
  ).bind(userId).first();
  return workspace?.id;
}

// LIST CONTENT IDEAS
content.get('/', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json([]);
  
  const { status, platform } = c.req.query();
  
  let sql = 'SELECT * FROM dashboard_content_ideas WHERE workspace_id = ?';
  const params = [workspaceId];
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (platform) {
    sql += ' AND platform = ?';
    params.push(platform);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json(results);
});

// GET SINGLE CONTENT IDEA
content.get('/:id', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const row = await c.env.DB
    .prepare('SELECT * FROM dashboard_content_ideas WHERE id = ? AND workspace_id = ?')
    .bind(c.req.param('id'), workspaceId)
    .first();
  if (!row) return c.json({ error: 'Content idea not found' }, 404);
  return c.json(row);
});

// CREATE CONTENT IDEA
content.post('/', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const b = await body(c);
  const { platform, content_type, topic, hook, format, caption, creative, cta, status, scheduled_date, notes, ai_generated } = b;
  
  const row = await c.env.DB.prepare(
    `INSERT INTO dashboard_content_ideas (workspace_id, platform, content_type, topic, hook, format, caption, creative, cta, status, scheduled_date, notes, ai_generated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`
  ).bind(
    workspaceId,
    platform || null,
    content_type || null,
    topic || null,
    hook || null,
    format || null,
    caption || null,
    creative || null,
    cta || null,
    status || 'idea',
    scheduled_date || null,
    notes || null,
    ai_generated ? 1 : 0
  ).first();
  
  return c.json(row, 201);
});

// UPDATE CONTENT IDEA
content.put('/:id', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const b = await body(c);
  const { platform, content_type, topic, hook, format, caption, creative, cta, status, scheduled_date, notes, ai_generated } = b;
  
  const row = await c.env.DB.prepare(
    `UPDATE dashboard_content_ideas SET
       platform = COALESCE(?, platform),
       content_type = COALESCE(?, content_type),
       topic = COALESCE(?, topic),
       hook = COALESCE(?, hook),
       format = COALESCE(?, format),
       caption = COALESCE(?, caption),
       creative = COALESCE(?, creative),
       cta = COALESCE(?, cta),
       status = COALESCE(?, status),
       scheduled_date = COALESCE(?, scheduled_date),
       notes = COALESCE(?, notes),
       ai_generated = COALESCE(?, ai_generated),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND workspace_id = ?
     RETURNING *`
  ).bind(
    platform || null,
    content_type || null,
    topic || null,
    hook || null,
    format || null,
    caption || null,
    creative || null,
    cta || null,
    status || null,
    scheduled_date || null,
    notes || null,
    ai_generated !== undefined ? (ai_generated ? 1 : 0) : null,
    c.req.param('id'),
    workspaceId
  ).first();
  
  if (!row) return c.json({ error: 'Content idea not found' }, 404);
  return c.json(row);
});

// DELETE CONTENT IDEA
content.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const row = await c.env.DB
    .prepare('DELETE FROM dashboard_content_ideas WHERE id = ? AND workspace_id = ? RETURNING id')
    .bind(c.req.param('id'), workspaceId)
    .first();
  if (!row) return c.json({ error: 'Content idea not found' }, 404);
  return c.json({ message: 'Content idea deleted successfully' });
});

// BULK UPDATE STATUS
content.patch('/bulk/status', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const { ids, status } = await body(c);
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return c.json({ error: 'Array of IDs required' }, 400);
  }
  const validStatuses = ['idea', 'draft', 'ready', 'scheduled', 'published'];
  if (!validStatuses.includes(status)) return c.json({ error: 'Invalid status' }, 400);
  
  const placeholders = ids.map(() => '?').join(',');
  await c.env.DB.prepare(
    `UPDATE dashboard_content_ideas SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders}) AND workspace_id = ?`
  ).bind(status, ...ids, workspaceId).run();
  
  return c.json({ message: `${ids.length} content ideas updated` });
});

export default content;