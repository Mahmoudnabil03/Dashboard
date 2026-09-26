import { Hono } from 'hono';
import { authMiddleware, body } from '../lib.js';

const tracking = new Hono();
tracking.use('*', authMiddleware);

// ============================================
// LIST TRACKING INTEGRATIONS
// ============================================
tracking.get('/integrations', async (c) => {
  const userId = c.get('userId');
  const { results } = await c.env.DB
    .prepare('SELECT * FROM dashboard_tracking_integrations WHERE workspace_id = ? ORDER BY provider, created_at DESC')
    .bind(userId)
    .all();
  return c.json(results);
});

// ============================================
// GET SINGLE TRACKING INTEGRATION
// ============================================
tracking.get('/integrations/:id', async (c) => {
  const userId = c.get('userId');
  const row = await c.env.DB
    .prepare('SELECT * FROM dashboard_tracking_integrations WHERE id = ? AND workspace_id = ?')
    .bind(c.req.param('id'), userId)
    .first();
  if (!row) return c.json({ error: 'Integration not found' }, 404);
  return c.json(row);
});

// ============================================
// CREATE/UPDATE TRACKING INTEGRATION
// ============================================
tracking.post('/integrations', async (c) => {
  const userId = c.get('userId');
  const b = await body(c);
  
  const { provider, name, pixel_id, access_token, api_key, api_secret, config } = b;
  
  if (!provider) {
    return c.json({ error: 'Provider is required' }, 400);
  }

  const validProviders = ['meta_pixel', 'meta_capi', 'google_analytics', 'google_tag_manager', 'tiktok_pixel', 'linkedin_insight_tag', 'snapchat_pixel', 'pinterest_tag'];
  if (!validProviders.includes(provider)) {
    return c.json({ error: 'Invalid provider' }, 400);
  }

  // Upsert integration
  const row = await c.env.DB.prepare(
    `INSERT INTO dashboard_tracking_integrations (workspace_id, provider, name, pixel_id, access_token, api_key, api_secret, config, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'connected')
     ON CONFLICT(workspace_id, provider) DO UPDATE SET
       name = excluded.name,
       pixel_id = excluded.pixel_id,
       access_token = excluded.access_token,
       api_key = excluded.api_key,
       api_secret = excluded.api_secret,
       config = excluded.config,
       status = 'connected',
       updated_at = CURRENT_TIMESTAMP,
       error_message = NULL
     RETURNING *`
  ).bind(
    userId,
    provider,
    name || null,
    pixel_id || null,
    access_token || null,
    api_key || null,
    api_secret || null,
    JSON.stringify(config || {})
  ).first();

  // Log audit
  await c.env.DB.prepare(
    `INSERT INTO dashboard_audit_logs (workspace_id, user_id, action, resource_type, resource_id, metadata)
     VALUES (?, ?, 'upsert_tracking_integration', 'tracking_integration', ?, ?)`
  ).bind(userId, userId, row.id, JSON.stringify({ provider })).run();

  return c.json(row, 201);
});

// ============================================
// UPDATE TRACKING INTEGRATION
// ============================================
tracking.put('/integrations/:id', async (c) => {
  const userId = c.get('userId');
  const b = await body(c);
  
  const { name, pixel_id, access_token, api_key, api_secret, config, status } = b;

  const row = await c.env.DB.prepare(
    `UPDATE dashboard_tracking_integrations SET
       name = COALESCE(?, name),
       pixel_id = COALESCE(?, pixel_id),
       access_token = COALESCE(?, access_token),
       api_key = COALESCE(?, api_key),
       api_secret = COALESCE(?, api_secret),
       config = COALESCE(?, config),
       status = COALESCE(?, status),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND workspace_id = ?
     RETURNING *`
  ).bind(
    name || null,
    pixel_id || null,
    access_token || null,
    api_key || null,
    api_secret || null,
    config ? JSON.stringify(config) : null,
    status || null,
    c.req.param('id'),
    userId
  ).first();

  if (!row) return c.json({ error: 'Integration not found' }, 404);
  return c.json(row);
});

// ============================================
// DELETE TRACKING INTEGRATION
// ============================================
tracking.delete('/integrations/:id', async (c) => {
  const userId = c.get('userId');
  const row = await c.env.DB
    .prepare('DELETE FROM dashboard_tracking_integrations WHERE id = ? AND workspace_id = ? RETURNING id, provider')
    .bind(c.req.param('id'), userId)
    .first();
  
  if (!row) return c.json({ error: 'Integration not found' }, 404);

  // Log audit
  await c.env.DB.prepare(
    `INSERT INTO dashboard_audit_logs (workspace_id, user_id, action, resource_type, resource_id, metadata)
     VALUES (?, ?, 'delete_tracking_integration', 'tracking_integration', ?, ?)`
  ).bind(userId, userId, row.id, JSON.stringify({ provider: row.provider })).run();

  return c.json({ message: 'Integration deleted successfully' });
});

// ============================================
// TEST TRACKING INTEGRATION
// ============================================
tracking.post('/integrations/:id/test', async (c) => {
  const userId = c.get('userId');
  const integration = await c.env.DB
    .prepare('SELECT * FROM dashboard_tracking_integrations WHERE id = ? AND workspace_id = ?')
    .bind(c.req.param('id'), userId)
    .first();

  if (!integration) return c.json({ error: 'Integration not found' }, 404);

  try {
    let testResult = { success: false, message: '' };

    switch (integration.provider) {
      case 'meta_pixel':
      case 'meta_capi':
        testResult = await testMetaIntegration(integration);
        break;
      case 'google_analytics':
        testResult = await testGoogleAnalytics(integration);
        break;
      case 'tiktok_pixel':
        testResult = await testTikTokPixel(integration);
        break;
      case 'linkedin_insight_tag':
        testResult = await testLinkedInInsightTag(integration);
        break;
      default:
        testResult = { success: true, message: 'Configuration saved (no test available for this provider)' };
    }

    if (testResult.success) {
      await c.env.DB.prepare(
        `UPDATE dashboard_tracking_integrations SET last_event_at = CURRENT_TIMESTAMP, error_message = NULL WHERE id = ?`
      ).bind(integration.id).run();
    } else {
      await c.env.DB.prepare(
        `UPDATE dashboard_tracking_integrations SET error_message = ? WHERE id = ?`
      ).bind(testResult.message, integration.id).run();
    }

    return c.json(testResult);
  } catch (err) {
    const msg = String(err.message || err).slice(0, 200);
    await c.env.DB.prepare(
      `UPDATE dashboard_tracking_integrations SET error_message = ? WHERE id = ?`
    ).bind(msg, integration.id).run();
    return c.json({ success: false, message: msg }, 500);
  }
});

// ============================================
// GET TRACKING EVENTS
// ============================================
tracking.get('/events', async (c) => {
  const userId = c.get('userId');
  const { integration_id, limit = '100', offset = '0' } = c.req.query();
  
  let sql = `SELECT e.*, i.provider 
             FROM dashboard_tracking_events e
             LEFT JOIN dashboard_tracking_integrations i ON e.integration_id = i.id
             WHERE e.workspace_id = ?`;
  const params = [userId];
  
  if (integration_id) {
    sql += ' AND e.integration_id = ?';
    params.push(integration_id);
  }
  
  sql += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json(results);
});

// ============================================
// GET EVENT STATS
// ============================================
tracking.get('/events/stats', async (c) => {
  const userId = c.get('userId');
  const { days = '7' } = c.req.query();
  
  const row = await c.env.DB.prepare(
    `SELECT 
       COUNT(*) as total_events,
       COUNT(DISTINCT event_name) as unique_events,
       COUNT(DISTINCT integration_id) as active_integrations,
       MAX(created_at) as last_event
     FROM dashboard_tracking_events
     WHERE workspace_id = ? 
     AND created_at >= datetime('now', '-' || ? || ' days')`
  ).bind(userId, days).first();

  const eventBreakdown = await c.env.DB.prepare(
    `SELECT event_name, COUNT(*) as count
     FROM dashboard_tracking_events
     WHERE workspace_id = ? 
     AND created_at >= datetime('now', '-' || ? || ' days')
     GROUP BY event_name
     ORDER BY count DESC`
  ).bind(userId, days).all();

  const providerBreakdown = await c.env.DB.prepare(
    `SELECT i.provider, COUNT(*) as count
     FROM dashboard_tracking_events e
     JOIN dashboard_tracking_integrations i ON e.integration_id = i.id
     WHERE e.workspace_id = ? 
     AND e.created_at >= datetime('now', '-' || ? || ' days')
     GROUP BY i.provider`
  ).bind(userId, days).all();

  return c.json({
    ...row,
    events_by_type: eventBreakdown.results,
    events_by_provider: providerBreakdown.results
  });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function testMetaIntegration(integration) {
  if (!integration.pixel_id || !integration.access_token) {
    return { success: false, message: 'Missing Pixel ID or Access Token' };
  }
  
  try {
    const resp = await fetch(`https://graph.facebook.com/v18.0/${integration.pixel_id}?fields=id,name,owner_business&access_token=${integration.access_token}`);
    if (resp.ok) {
      const data = await resp.json();
      return { success: true, message: `Connected to Meta Pixel: ${data.name || integration.pixel_id}` };
    }
    return { success: false, message: `Meta API error: ${resp.status}` };
  } catch (err) {
    return { success: false, message: `Connection failed: ${err.message}` };
  }
}

async function testGoogleAnalytics(integration) {
  if (!integration.api_key || !integration.pixel_id) {
    return { success: false, message: 'Missing Measurement ID or API Key' };
  }
  
  // GA4 doesn't have a simple test endpoint without OAuth
  // We validate the format at minimum
  if (!integration.pixel_id.startsWith('G-')) {
    return { success: false, message: 'Invalid Measurement ID format (should be G-XXXXXXXXXX)' };
  }
  return { success: true, message: `GA4 Measurement ID format valid: ${integration.pixel_id}` };
}

async function testTikTokPixel(integration) {
  if (!integration.pixel_id || !integration.access_token) {
    return { success: false, message: 'Missing Pixel ID or Access Token' };
  }
  
  try {
    const resp = await fetch(`https://business-api.tiktok.com/open_api/v1.3/pixel/info/?pixel_id=${integration.pixel_id}&advertiser_id=${integration.config?.advertiser_id || ''}`, {
      headers: { 'Access-Token': integration.access_token }
    });
    if (resp.ok) {
      return { success: true, message: 'Connected to TikTok Pixel' };
    }
    return { success: false, message: `TikTok API error: ${resp.status}` };
  } catch (err) {
    return { success: false, message: `Connection failed: ${err.message}` };
  }
}

async function testLinkedInInsightTag(integration) {
  if (!integration.pixel_id) {
    return { success: false, message: 'Missing Partner ID' };
  }
  // LinkedIn Insight Tag is a JavaScript tag, no API test available
  return { success: true, message: `LinkedIn Insight Tag Partner ID saved: ${integration.pixel_id}` };
}

// ============================================
// WEBHOOK MANAGEMENT
// ============================================

// Generate/regenerate webhook verify token
tracking.post('/integrations/:id/webhook/token', async (c) => {
  const userId = c.get('userId');
  const integrationId = c.req.param('id');
  
  const integration = await c.env.DB
    .prepare('SELECT * FROM dashboard_tracking_integrations WHERE id = ? AND workspace_id = ?')
    .bind(integrationId, userId)
    .first();
  
  if (!integration) return c.json({ error: 'Integration not found' }, 404);
  
  // Only for providers that support webhooks
  const webhookProviders = ['meta_pixel', 'meta_capi', 'instagram', 'facebook'];
  if (!webhookProviders.includes(integration.provider)) {
    return c.json({ error: 'Webhooks not supported for this provider' }, 400);
  }
  
  // Generate secure random token
  const token = crypto.randomUUID().replace(/-/g, '');
  const baseUrl = c.env.FRONTEND_URL || new URL(c.req.url).origin;
  const callbackUrl = `${baseUrl.replace('/api', '')}/api/social/${integration.provider === 'meta_pixel' || integration.provider === 'meta_capi' ? 'facebook' : 'instagram'}/webhook`;
  
  await c.env.DB.prepare(
    `UPDATE dashboard_tracking_integrations SET 
       webhook_verify_token = ?,
       webhook_callback_url = ?,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(token, callbackUrl, integrationId).run();
  
  return c.json({ 
    webhook_verify_token: token,
    webhook_callback_url: callbackUrl,
    message: 'Webhook token generated successfully'
  });
});

// Get webhook configuration
tracking.get('/integrations/:id/webhook', async (c) => {
  const userId = c.get('userId');
  const integrationId = c.req.param('id');
  
  const integration = await c.env.DB
    .prepare('SELECT id, provider, webhook_verify_token, webhook_callback_url, webhook_subscribed FROM dashboard_tracking_integrations WHERE id = ? AND workspace_id = ?')
    .bind(integrationId, userId)
    .first();
  
  if (!integration) return c.json({ error: 'Integration not found' }, 404);
  
  const baseUrl = c.env.FRONTEND_URL || new URL(c.req.url).origin;
  const platform = integration.provider === 'meta_pixel' || integration.provider === 'meta_capi' ? 'facebook' : 'instagram';
  const callbackUrl = integration.webhook_callback_url || `${baseUrl.replace('/api', '')}/api/social/${platform}/webhook`;
  
  return c.json({
    ...integration,
    webhook_callback_url: callbackUrl,
    webhook_fields: integration.provider === 'meta_pixel' || integration.provider === 'meta_capi' 
      ? ['feed', 'messages', 'comments', 'leadgen']
      : ['comments', 'mentions', 'story_insights']
  });
});

// Subscribe to webhook (calls provider API to register)
tracking.post('/integrations/:id/webhook/subscribe', async (c) => {
  const userId = c.get('userId');
  const integrationId = c.req.param('id');
  
  const integration = await c.env.DB
    .prepare('SELECT * FROM dashboard_tracking_integrations WHERE id = ? AND workspace_id = ?')
    .bind(integrationId, userId)
    .first();
  
  if (!integration) return c.json({ error: 'Integration not found' }, 404);
  if (!integration.webhook_verify_token) {
    return c.json({ error: 'Generate webhook token first' }, 400);
  }
  
  const baseUrl = c.env.FRONTEND_URL || new URL(c.req.url).origin;
  const platform = integration.provider === 'meta_pixel' || integration.provider === 'meta_capi' ? 'facebook' : 'instagram';
  const callbackUrl = `${baseUrl.replace('/api', '')}/api/social/${platform}/webhook`;
  
  try {
    if (platform === 'facebook') {
      // Subscribe to Facebook page webhooks
      const resp = await fetch(`https://graph.facebook.com/v18.0/${integration.pixel_id}/subscribed_apps?access_token=${integration.access_token}&subscribed_fields=feed,messages,comments,leadgen`, {
        method: 'POST'
      });
      
      if (!resp.ok) {
        const err = await resp.text();
        return c.json({ success: false, message: `Facebook subscription failed: ${err}` }, 500);
      }
    }
    
    await c.env.DB.prepare(
      `UPDATE dashboard_tracking_integrations SET webhook_subscribed = 1, webhook_callback_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(callbackUrl, integrationId).run();
    
    return c.json({ success: true, message: 'Webhook subscribed successfully', callback_url: callbackUrl });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Unsubscribe from webhook
tracking.post('/integrations/:id/webhook/unsubscribe', async (c) => {
  const userId = c.get('userId');
  const integrationId = c.req.param('id');
  
  const integration = await c.env.DB
    .prepare('SELECT * FROM dashboard_tracking_integrations WHERE id = ? AND workspace_id = ?')
    .bind(integrationId, userId)
    .first();
  
  if (!integration) return c.json({ error: 'Integration not found' }, 404);
  
  try {
    if (integration.provider === 'meta_pixel' || integration.provider === 'meta_capi') {
      await fetch(`https://graph.facebook.com/v18.0/${integration.pixel_id}/subscribed_apps?access_token=${integration.access_token}`, {
        method: 'DELETE'
      });
    }
    
    await c.env.DB.prepare(
      `UPDATE dashboard_tracking_integrations SET webhook_subscribed = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(integrationId).run();
    
    return c.json({ success: true, message: 'Webhook unsubscribed' });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

export default tracking;