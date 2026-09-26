import { Hono } from 'hono';
import { authMiddleware, body } from '../lib.js';

const websites = new Hono();
websites.use('*', authMiddleware);

async function getWorkspaceId(c, userId) {
  const workspace = await c.env.DB.prepare(
    `SELECT w.id FROM dashboard_workspaces w
     JOIN dashboard_workspace_members wm ON w.id = wm.workspace_id
     WHERE wm.user_id = ?
     LIMIT 1`
  ).bind(userId).first();
  return workspace?.id;
}

// LIST WEBSITES
websites.get('/', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json([]);
  
  const { results } = await c.env.DB
    .prepare('SELECT * FROM dashboard_websites WHERE workspace_id = ? ORDER BY created_at DESC')
    .bind(workspaceId)
    .all();
  return c.json(results);
});

// GET SINGLE WEBSITE
websites.get('/:id', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const row = await c.env.DB
    .prepare('SELECT * FROM dashboard_websites WHERE id = ? AND workspace_id = ?')
    .bind(c.req.param('id'), workspaceId)
    .first();
  if (!row) return c.json({ error: 'Website not found' }, 404);
  return c.json(row);
});

// CREATE WEBSITE
websites.post('/', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const b = await body(c);
  const { url, name } = b;
  
  if (!url) return c.json({ error: 'Website URL is required' }, 400);
  
  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return c.json({ error: 'Invalid URL format' }, 400);
  }
  
  const row = await c.env.DB.prepare(
    `INSERT INTO dashboard_websites (workspace_id, url, name, verification_status, tracking_status)
     VALUES (?, ?, ?, 'pending', 'inactive')
     RETURNING *`
  ).bind(workspaceId, url, name || null).first();
  
  return c.json(row, 201);
});

// UPDATE WEBSITE
websites.put('/:id', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const b = await body(c);
  const { url, name, verification_status, tracking_status } = b;
  
  const row = await c.env.DB.prepare(
    `UPDATE dashboard_websites SET
       url = COALESCE(?, url),
       name = COALESCE(?, name),
       verification_status = COALESCE(?, verification_status),
       tracking_status = COALESCE(?, tracking_status),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND workspace_id = ?
     RETURNING *`
  ).bind(url || null, name || null, verification_status || null, tracking_status || null, c.req.param('id'), workspaceId).first();
  
  if (!row) return c.json({ error: 'Website not found' }, 404);
  return c.json(row);
});

// DELETE WEBSITE
websites.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const row = await c.env.DB
    .prepare('DELETE FROM dashboard_websites WHERE id = ? AND workspace_id = ? RETURNING id')
    .bind(c.req.param('id'), workspaceId)
    .first();
  if (!row) return c.json({ error: 'Website not found' }, 404);
  return c.json({ message: 'Website deleted successfully' });
});

// VERIFY WEBSITE (placeholder - would check for verification meta tag/file)
websites.post('/:id/verify', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const row = await c.env.DB.prepare(
    `UPDATE dashboard_websites SET
       verification_status = 'verified',
       last_scan_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND workspace_id = ?
     RETURNING *`
  ).bind(c.req.param('id'), workspaceId).first();
  
  if (!row) return c.json({ error: 'Website not found' }, 404);
  return c.json({ ...row, verification_code: `socialhub-${row.id}-${Date.now()}` });
});

// SCAN WEBSITE (placeholder - would fetch and analyze)
websites.post('/:id/scan', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const website = await c.env.DB.prepare(
    `SELECT * FROM dashboard_websites WHERE id = ? AND workspace_id = ?`
  ).bind(c.req.param('id'), workspaceId).first();
  
  if (!website) return c.json({ error: 'Website not found' }, 404);
  
  // Simulate scan results
  const mockAnalytics = {
    visitors: Math.floor(Math.random() * 10000) + 1000,
    page_views: Math.floor(Math.random() * 50000) + 5000,
    sessions: Math.floor(Math.random() * 8000) + 800,
    bounce_rate: (Math.random() * 30 + 20).toFixed(1),
    top_pages: [
      { path: '/', views: 1250 },
      { path: '/products', views: 890 },
      { path: '/about', views: 450 },
      { path: '/contact', views: 320 },
    ],
    traffic_sources: {
      direct: 35,
      organic: 28,
      referral: 15,
      social: 12,
      paid: 10,
    },
    devices: {
      desktop: 52,
      mobile: 43,
      tablet: 5,
    },
  };
  
  const row = await c.env.DB.prepare(
    `UPDATE dashboard_websites SET
       tracking_status = 'active',
       last_scan_at = CURRENT_TIMESTAMP,
       health_status = 'healthy',
       analytics_data = ?,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND workspace_id = ?
     RETURNING *`
  ).bind(JSON.stringify(mockAnalytics), c.req.param('id'), workspaceId).first();
  
  return c.json(row);
});

export default websites;