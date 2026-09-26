import { Hono } from 'hono';
import { authMiddleware, body } from '../lib.js';

const campaigns = new Hono();
campaigns.use('*', authMiddleware);

async function getWorkspaceId(c, userId) {
  const workspace = await c.env.DB.prepare(
    `SELECT w.id FROM dashboard_workspaces w
     JOIN dashboard_workspace_members wm ON w.id = wm.workspace_id
     WHERE wm.user_id = ?
     LIMIT 1`
  ).bind(userId).first();
  return workspace?.id;
}

// LIST CAMPAIGNS
campaigns.get('/', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json([]);
  
  const { results } = await c.env.DB
    .prepare('SELECT * FROM dashboard_campaigns WHERE workspace_id = ? ORDER BY created_at DESC')
    .bind(workspaceId)
    .all();
  return c.json(results);
});

// GET SINGLE CAMPAIGN
campaigns.get('/:id', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const row = await c.env.DB
    .prepare('SELECT * FROM dashboard_campaigns WHERE id = ? AND workspace_id = ?')
    .bind(c.req.param('id'), workspaceId)
    .first();
  if (!row) return c.json({ error: 'Campaign not found' }, 404);
  return c.json(row);
});

// CREATE CAMPAIGN
campaigns.post('/', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const b = await body(c);
  const { name, objective, platform, budget, start_date, end_date, audience, creative, copy, landing_page, tracking, notes } = b;
  
  if (!name) return c.json({ error: 'Campaign name is required' }, 400);
  
  const row = await c.env.DB.prepare(
    `INSERT INTO dashboard_campaigns (workspace_id, name, objective, platform, budget, start_date, end_date, audience, creative, copy, landing_page, tracking, notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
     RETURNING *`
  ).bind(workspaceId, name, objective || null, platform || null, budget || null, start_date || null, end_date || null, audience || null, creative || null, copy || null, landing_page || null, tracking || null, notes || null).first();
  
  return c.json(row, 201);
});

// UPDATE CAMPAIGN
campaigns.put('/:id', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const b = await body(c);
  const { name, objective, platform, budget, start_date, end_date, audience, creative, copy, landing_page, tracking, notes, status } = b;
  
  const row = await c.env.DB.prepare(
    `UPDATE dashboard_campaigns SET
       name = COALESCE(?, name),
       objective = COALESCE(?, objective),
       platform = COALESCE(?, platform),
       budget = COALESCE(?, budget),
       start_date = COALESCE(?, start_date),
       end_date = COALESCE(?, end_date),
       audience = COALESCE(?, audience),
       creative = COALESCE(?, creative),
       copy = COALESCE(?, copy),
       landing_page = COALESCE(?, landing_page),
       tracking = COALESCE(?, tracking),
       notes = COALESCE(?, notes),
       status = COALESCE(?, status),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND workspace_id = ?
     RETURNING *`
  ).bind(name || null, objective || null, platform || null, budget || null, start_date || null, end_date || null, audience || null, creative || null, copy || null, landing_page || null, tracking || null, notes || null, status || null, c.req.param('id'), workspaceId).first();
  
  if (!row) return c.json({ error: 'Campaign not found' }, 404);
  return c.json(row);
});

// UPDATE CAMPAIGN STATUS
campaigns.patch('/:id/status', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const { status } = await body(c);
  const validStatuses = ['draft', 'planned', 'active', 'paused', 'completed', 'archived'];
  if (!validStatuses.includes(status)) return c.json({ error: 'Invalid status' }, 400);
  
  const row = await c.env.DB.prepare(
    `UPDATE dashboard_campaigns SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND workspace_id = ? RETURNING *`
  ).bind(status, c.req.param('id'), workspaceId).first();
  
  if (!row) return c.json({ error: 'Campaign not found' }, 404);
  return c.json(row);
});

// DELETE CAMPAIGN
campaigns.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const row = await c.env.DB
    .prepare('DELETE FROM dashboard_campaigns WHERE id = ? AND workspace_id = ? RETURNING id')
    .bind(c.req.param('id'), workspaceId)
    .first();
  if (!row) return c.json({ error: 'Campaign not found' }, 404);
  return c.json({ message: 'Campaign deleted successfully' });
});

// GET CAMPAIGN METRICS
campaigns.get('/:id/metrics', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM dashboard_campaign_metrics WHERE campaign_id = ? AND workspace_id = ? ORDER BY date DESC`
  ).bind(c.req.param('id'), workspaceId).all();
  return c.json(results);
});

// ADD/UPDATE CAMPAIGN METRICS
campaigns.post('/:id/metrics', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const b = await body(c);
  const { date, spend, reach, impressions, clicks, ctr, cpc, cpm, leads, conversions, cost_per_conversion, revenue, roas } = b;
  
  if (!date) return c.json({ error: 'Date is required' }, 400);
  
  const row = await c.env.DB.prepare(
    `INSERT INTO dashboard_campaign_metrics (campaign_id, workspace_id, date, spend, reach, impressions, clicks, ctr, cpc, cpm, leads, conversions, cost_per_conversion, revenue, roas)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(campaign_id, date) DO UPDATE SET
       spend = excluded.spend,
       reach = excluded.reach,
       impressions = excluded.impressions,
       clicks = excluded.clicks,
       ctr = excluded.ctr,
       cpc = excluded.cpc,
       cpm = excluded.cpm,
       leads = excluded.leads,
       conversions = excluded.conversions,
       cost_per_conversion = excluded.cost_per_conversion,
       revenue = excluded.revenue,
       roas = excluded.roas
     RETURNING *`
  ).bind(c.req.param('id'), workspaceId, date, spend || 0, reach || 0, impressions || 0, clicks || 0, ctr || 0, cpc || 0, cpm || 0, leads || 0, conversions || 0, cost_per_conversion || 0, revenue || 0, roas || 0).first();
  
  return c.json(row, 201);
});

export default campaigns;