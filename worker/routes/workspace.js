import { Hono } from 'hono';
import { authMiddleware, body } from '../lib.js';

const workspace = new Hono();
workspace.use('*', authMiddleware);

// Get current workspace (or create default)
workspace.get('/current', async (c) => {
  const userId = c.get('userId');
  
  // First check if user has a workspace membership
  let workspace = await c.env.DB.prepare(
    `SELECT w.* FROM dashboard_workspaces w
     JOIN dashboard_workspace_members wm ON w.id = wm.workspace_id
     WHERE wm.user_id = ?
     LIMIT 1`
  ).bind(userId).first();
  
  // If no workspace, create a default one for the user
  if (!workspace) {
    const result = await c.env.DB.prepare(
      `INSERT INTO dashboard_workspaces (name, slug) VALUES (?, ?) RETURNING *`
    ).bind(`Workspace ${userId}`, `workspace-${userId}-${Date.now()}`).first();
    
    workspace = result;
    
    // Add user as owner
    await c.env.DB.prepare(
      `INSERT INTO dashboard_workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'owner')`
    ).bind(workspace.id, userId).run();
  }
  
  return c.json(workspace);
});

// Update workspace
workspace.put('/current', async (c) => {
  const userId = c.get('userId');
  const b = await body(c);
  
  // Get user's workspace
  const workspace = await c.env.DB.prepare(
    `SELECT w.id FROM dashboard_workspaces w
     JOIN dashboard_workspace_members wm ON w.id = wm.workspace_id
     WHERE wm.user_id = ?
     LIMIT 1`
  ).bind(userId).first();
  
  if (!workspace) return c.json({ error: 'Workspace not found' }, 404);
  
  const allowedFields = [
    'name', 'business_category', 'website', 'description', 'logo_url',
    'timezone', 'country', 'target_audience', 'marketing_objective',
    'brand_voice', 'brand_colors', 'brand_keywords', 'brand_avoid_words',
    'preferred_language', 'content_style'
  ];
  
  const updates = [];
  const params = [];
  
  for (const field of allowedFields) {
    if (b[field] !== undefined) {
      updates.push(`${field} = ?`);
      params.push(b[field]);
    }
  }
  
  if (updates.length === 0) return c.json({ error: 'No valid fields to update' }, 400);
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(workspace.id);
  
  const row = await c.env.DB.prepare(
    `UPDATE dashboard_workspaces SET ${updates.join(', ')} WHERE id = ? RETURNING *`
  ).bind(...params).first();
  
  return c.json(row);
});

// Get workspace members
workspace.get('/members', async (c) => {
  const userId = c.get('userId');
  const workspace = await c.env.DB.prepare(
    `SELECT w.id FROM dashboard_workspaces w
     JOIN dashboard_workspace_members wm ON w.id = wm.workspace_id
     WHERE wm.user_id = ?
     LIMIT 1`
  ).bind(userId).first();
  
  if (!workspace) return c.json([]);
  
  const { results } = await c.env.DB.prepare(
    `SELECT wm.*, u.email, u.name FROM dashboard_workspace_members wm
     JOIN dashboard_users u ON wm.user_id = u.id
     WHERE wm.workspace_id = ?`
  ).bind(workspace.id).all();
  
  return c.json(results);
});

// Invite team member
workspace.post('/members/invite', async (c) => {
  const userId = c.get('userId');
  const { email, role = 'member' } = await body(c);
  
  const workspace = await c.env.DB.prepare(
    `SELECT w.id FROM dashboard_workspaces w
     JOIN dashboard_workspace_members wm ON w.id = wm.workspace_id
     WHERE wm.user_id = ? AND wm.role IN ('owner', 'admin')
     LIMIT 1`
  ).bind(userId).first();
  
  if (!workspace) return c.json({ error: 'Not authorized' }, 403);
  
  const invitedUser = await c.env.DB.prepare('SELECT id FROM dashboard_users WHERE email = ?').bind(email).first();
  if (!invitedUser) return c.json({ error: 'User not found' }, 404);
  
  const existing = await c.env.DB.prepare(
    `SELECT id FROM dashboard_workspace_members WHERE workspace_id = ? AND user_id = ?`
  ).bind(workspace.id, invitedUser.id).first();
  
  if (existing) return c.json({ error: 'User already a member' }, 400);
  
  await c.env.DB.prepare(
    `INSERT INTO dashboard_workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)`
  ).bind(workspace.id, invitedUser.id, role).run();
  
  // Log audit
  await c.env.DB.prepare(
    `INSERT INTO dashboard_audit_logs (workspace_id, user_id, action, resource_type, resource_id, metadata)
     VALUES (?, ?, 'invite_member', 'workspace_member', ?, ?)`
  ).bind(workspace.id, userId, invitedUser.id, JSON.stringify({ email, role })).run();
  
  return c.json({ message: 'Invitation sent' });
});

// Update member role
workspace.patch('/members/:id/role', async (c) => {
  const userId = c.get('userId');
  const { role } = await body(c);
  
  const workspace = await c.env.DB.prepare(
    `SELECT w.id FROM dashboard_workspaces w
     JOIN dashboard_workspace_members wm ON w.id = wm.workspace_id
     WHERE wm.user_id = ? AND wm.role = 'owner'
     LIMIT 1`
  ).bind(userId).first();
  
  if (!workspace) return c.json({ error: 'Not authorized' }, 403);
  
  const validRoles = ['owner', 'admin', 'manager', 'analyst', 'content'];
  if (!validRoles.includes(role)) return c.json({ error: 'Invalid role' }, 400);
  
  const row = await c.env.DB.prepare(
    `UPDATE dashboard_workspace_members SET role = ? WHERE id = ? AND workspace_id = ? RETURNING *`
  ).bind(role, c.req.param('id'), workspace.id).first();
  
  if (!row) return c.json({ error: 'Member not found' }, 404);
  
  return c.json(row);
});

// Remove member
workspace.delete('/members/:id', async (c) => {
  const userId = c.get('userId');
  
  const workspace = await c.env.DB.prepare(
    `SELECT w.id FROM dashboard_workspaces w
     JOIN dashboard_workspace_members wm ON w.id = wm.workspace_id
     WHERE wm.user_id = ? AND wm.role IN ('owner', 'admin')
     LIMIT 1`
  ).bind(userId).first();
  
  if (!workspace) return c.json({ error: 'Not authorized' }, 403);
  
  // Prevent removing the last owner
  const member = await c.env.DB.prepare(
    `SELECT role FROM dashboard_workspace_members WHERE id = ? AND workspace_id = ?`
  ).bind(c.req.param('id'), workspace.id).first();
  
  if (!member) return c.json({ error: 'Member not found' }, 404);
  if (member.role === 'owner') return c.json({ error: 'Cannot remove owner' }, 400);
  
  await c.env.DB.prepare(
    `DELETE FROM dashboard_workspace_members WHERE id = ? AND workspace_id = ?`
  ).bind(c.req.param('id'), workspace.id).run();
  
  return c.json({ message: 'Member removed' });
});

export default workspace;