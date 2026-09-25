import { Hono } from 'hono';
import { authMiddleware, body } from '../lib.js';

const leads = new Hono();
leads.use('*', authMiddleware);

async function getWorkspaceId(c, userId) {
  const workspace = await c.env.DB.prepare(
    `SELECT w.id FROM dashboard_workspaces w
     JOIN dashboard_workspace_members wm ON w.id = wm.workspace_id
     WHERE wm.user_id = ?
     LIMIT 1`
  ).bind(userId).first();
  return workspace?.id;
}

const VALID_STATUSES = ['new', 'contacted', 'qualified', 'closed', 'lost'];

// CREATE (manual)
leads.post('/', async (c) => {
  const b = await body(c);
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const status = VALID_STATUSES.includes(b.status) ? b.status : 'new';

  const row = await c.env.DB.prepare(
    `INSERT INTO dashboard_leads
      (workspace_id, property_id, name, email, phone, source, platform, message, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`
  ).bind(
    workspaceId,
    b.property_id || null,
    b.name || null,
    b.email || null,
    b.phone || null,
    b.source || 'manual',
    b.platform || null,
    b.message || null,
    status,
    b.notes || null
  ).first();

  return c.json(row, 201);
});

// CONVERT A COMMENT INTO A LEAD
leads.post('/from-comment', async (c) => {
  const { comment_id, property_id, name } = await body(c);
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);

  const comment = await c.env.DB.prepare(
    `SELECT c.*, p.platform AS post_platform
     FROM dashboard_comments c
     LEFT JOIN dashboard_posts p ON c.post_id = p.id
     WHERE c.id = ? AND c.workspace_id = ?`
  ).bind(comment_id, workspaceId).first();

  if (!comment) return c.json({ error: 'Comment not found' }, 404);

  const existing = await c.env.DB
    .prepare('SELECT id FROM dashboard_leads WHERE comment_id = ? AND workspace_id = ?')
    .bind(comment_id, workspaceId)
    .first();
  if (existing) {
    return c.json({ error: 'A lead already exists for this comment', leadId: existing.id }, 409);
  }

  const row = await c.env.DB.prepare(
    `INSERT INTO dashboard_leads
      (workspace_id, property_id, comment_id, name, source, platform, message, status)
     VALUES (?, ?, ?, ?, 'comment', ?, ?, 'new')
     RETURNING *`
  ).bind(
    workspaceId,
    property_id || null,
    comment_id,
    name || comment.author || 'Unknown',
    comment.post_platform || null,
    comment.content || null
  ).first();

  return c.json(row, 201);
});

// LIST (optional ?status= filter) with property info joined
leads.get('/', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json([]);
  
  const status = c.req.query('status');

  let sql = `
    SELECT l.*, p.title AS property_title, p.address AS property_address
    FROM dashboard_leads l
    LEFT JOIN dashboard_properties p ON l.property_id = p.id
    WHERE l.workspace_id = ?`;
  const params = [workspaceId];
  if (status) {
    sql += ' AND l.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY l.created_at DESC';

  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json(results);
});

// SUMMARY STATS
leads.get('/stats/summary', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ total: 0, new: 0, contacted: 0, qualified: 0, closed: 0 });
  
  const row = await c.env.DB.prepare(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS new,
       SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) AS contacted,
       SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) AS qualified,
       SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS closed
     FROM dashboard_leads WHERE workspace_id = ?`
  ).bind(workspaceId).first();

  return c.json({
    total: row.total || 0,
    new: row.new || 0,
    contacted: row.contacted || 0,
    qualified: row.qualified || 0,
    closed: row.closed || 0,
  });
});

// UPDATE (full)
leads.put('/:id', async (c) => {
  const b = await body(c);
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const status = VALID_STATUSES.includes(b.status) ? b.status : 'new';

  const row = await c.env.DB.prepare(
    `UPDATE dashboard_leads SET
       name = ?, email = ?, phone = ?, platform = ?, message = ?,
       property_id = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND workspace_id = ?
     RETURNING *`
  ).bind(
    b.name || null,
    b.email || null,
    b.phone || null,
    b.platform || null,
    b.message || null,
    b.property_id || null,
    status,
    b.notes || null,
    c.req.param('id'),
    workspaceId
  ).first();

  if (!row) return c.json({ error: 'Lead not found' }, 404);
  return c.json(row);
});

// UPDATE STATUS ONLY
leads.patch('/:id/status', async (c) => {
  const { status } = await body(c);
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  if (!VALID_STATUSES.includes(status)) {
    return c.json({ error: 'Invalid status' }, 400);
  }

  const row = await c.env.DB
    .prepare('UPDATE dashboard_leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND workspace_id = ? RETURNING *')
    .bind(status, c.req.param('id'), workspaceId)
    .first();

  if (!row) return c.json({ error: 'Lead not found' }, 404);
  return c.json(row);
});

// DELETE
leads.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const row = await c.env.DB
    .prepare('DELETE FROM dashboard_leads WHERE id = ? AND workspace_id = ? RETURNING id')
    .bind(c.req.param('id'), workspaceId)
    .first();
  if (!row) return c.json({ error: 'Lead not found' }, 404);
  return c.json({ message: 'Lead deleted successfully' });
});

export default leads;
