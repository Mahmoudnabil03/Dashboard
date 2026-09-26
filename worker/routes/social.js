import { Hono } from 'hono';
import { authMiddleware, parseAccount, body } from '../lib.js';

const social = new Hono();

// ---- helpers ----
function originOf(c) {
  return c.env.FRONTEND_URL || new URL(c.req.url).origin;
}

function callbackUrl(c, platform) {
  const key = `${platform.toUpperCase()}_CALLBACK_URL`;
  return c.env[key] || `${new URL(c.req.url).origin}/api/social/${platform}/callback`;
}

function configured(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

async function getWorkspaceId(c, userId) {
  const workspace = await c.env.DB.prepare(
    `SELECT w.id FROM dashboard_workspaces w
     JOIN dashboard_workspace_members wm ON w.id = wm.workspace_id
     WHERE wm.user_id = ?
     LIMIT 1`
  ).bind(userId).first();
  return workspace?.id;
}

async function upsertAccount(c, workspaceId, platform, username, accessToken, refreshToken, data) {
  await c.env.DB.prepare(
    `INSERT INTO dashboard_social_accounts (workspace_id, platform, username, access_token, refresh_token, account_data)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(workspace_id, platform) DO UPDATE SET
       username = excluded.username,
       access_token = excluded.access_token,
       refresh_token = excluded.refresh_token,
       account_data = excluded.account_data,
       updated_at = CURRENT_TIMESTAMP`
  ).bind(workspaceId, platform, username || null, accessToken || null, refreshToken || null, JSON.stringify(data || {})).run();
}

// ============================================
// LIST CONNECTED ACCOUNTS
// ============================================
social.get('/accounts', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json([]);
  
  const { results } = await c.env.DB
    .prepare('SELECT * FROM dashboard_social_accounts WHERE workspace_id = ? ORDER BY platform, created_at DESC')
    .bind(workspaceId)
    .all();
  return c.json(results.map(parseAccount));
});

// UNIFIED INBOX: comments joined with their post and connected account.
// This is intentionally read-only; sending replies continues through the
// existing /comments/reply endpoint.
social.get('/inbox', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json([]);
  
  const { results } = await c.env.DB.prepare(
    `SELECT c.*, p.content AS post_content, p.platform, p.account_id,
            s.username AS account_username
     FROM dashboard_comments c
     LEFT JOIN dashboard_posts p ON c.post_id = p.id
     LEFT JOIN dashboard_social_accounts s ON p.account_id = s.id
     WHERE c.workspace_id = ?
     ORDER BY c.replied ASC, c.created_at DESC`
  ).bind(workspaceId).all();
  return c.json(results);
});

// DISCONNECT
social.delete('/accounts/:id', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const row = await c.env.DB
    .prepare('DELETE FROM dashboard_social_accounts WHERE id = ? AND workspace_id = ? RETURNING id')
    .bind(c.req.param('id'), workspaceId)
    .first();
  if (!row) return c.json({ error: 'Account not found' }, 404);
  return c.json({ message: 'Account disconnected successfully' });
});

// ============================================
// COMMENTS FOR A POST
// ============================================
social.get('/comments/:postId', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json([]);
  
  const { results } = await c.env.DB.prepare(
    `SELECT c.*, p.content AS post_content
     FROM dashboard_comments c
     LEFT JOIN dashboard_posts p ON c.post_id = p.id
     WHERE c.post_id = ? AND c.workspace_id = ?
     ORDER BY c.created_at DESC`
  ).bind(c.req.param('postId'), workspaceId).all();
  return c.json(results);
});

// REPLY TO A COMMENT (posts to the platform, then marks replied)
social.post('/comments/reply', authMiddleware, async (c) => {
  const { commentId, reply } = await body(c);
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);

  const comment = await c.env.DB.prepare(
    `SELECT c.*, s.access_token, s.platform, s.account_data
     FROM dashboard_comments c
     JOIN dashboard_posts p ON c.post_id = p.id
     JOIN dashboard_social_accounts s ON p.account_id = s.id
     WHERE c.id = ? AND c.workspace_id = ?`
  ).bind(commentId, workspaceId).first();

  if (!comment) return c.json({ error: 'Comment not found' }, 404);

  try {
    await postReply(comment, reply);
  } catch (err) {
    return c.json({ error: `Failed to post reply: ${err.message}` }, 500);
  }

  await c.env.DB
    .prepare('UPDATE dashboard_comments SET replied = 1, ai_response = ? WHERE id = ? AND workspace_id = ?')
    .bind(reply, commentId, workspaceId)
    .run();

  return c.json({ message: 'Reply sent successfully' });
});

async function postReply(comment, reply) {
  switch (comment.platform) {
    case 'twitter':
      return fetchJSON('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${comment.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reply, reply: { in_reply_to_tweet_id: comment.comment_id } }),
      });
    case 'instagram':
      return fetchJSON(`https://graph.instagram.com/${comment.comment_id}/replies?${new URLSearchParams({ message: reply, access_token: comment.access_token })}`, { method: 'POST' });
    case 'facebook':
      return fetchJSON(`https://graph.facebook.com/${comment.comment_id}/comments?${new URLSearchParams({ message: reply, access_token: comment.access_token })}`, { method: 'POST' });
    case 'whatsapp': {
      // WhatsApp Cloud API - send message to user who commented (comment_id is phone id)
      const data = typeof comment.account_data === 'string' ? JSON.parse(comment.account_data || '{}') : (comment.account_data || {});
      const phoneId = data.phone_number_id || data.id;
      return fetchJSON(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${comment.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: comment.comment_id, type: 'text', text: { body: reply } }),
      });
    }
    case 'linkedin': {
      const data = typeof comment.account_data === 'string' ? JSON.parse(comment.account_data || '{}') : (comment.account_data || {});
      return fetchJSON(`https://api.linkedin.com/v2/socialActions/${comment.comment_id}/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${comment.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: `urn:li:person:${data.id}`, message: { text: reply } }),
      });
    }
    default:
      throw new Error('Unsupported platform');
  }
}

function oauthPopupHtml(success, platform, error) {
  const payload = JSON.stringify({ type: 'oauth_callback', success, platform, error: error || null });
  return `<!doctype html><html><head><meta charset="utf-8"><title>${success ? 'Connected' : 'Failed'}</title></head><body style="font-family:sans-serif;background:#020617;color:#e2e8f0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h2 style="color:${success ? '#22c55e' : '#ef4444'}">${success ? '✓ ' + platform + ' connected!' : '✗ Connection failed'}</h2><p style="color:#94a3b8">${success ? 'You can close this window.' : (error || 'Try again')}</p></div><script>
    try { if (window.opener) window.opener.postMessage(${payload}, '*'); } catch(e) {}
    setTimeout(() => window.close(), 1200);
  <\/script></body></html>`;
}

async function fetchJSON(url, options) {
  const resp = await fetch(url, options);
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`${resp.status} ${text}`);
  }
  return resp.json().catch(() => ({}));
}

// ============================================
// OAUTH: INITIATE (returns an authorize URL for the popup)
// ============================================
social.get('/:platform/auth', authMiddleware, async (c) => {
  const platform = c.req.param('platform');
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const redirectUri = callbackUrl(c, platform);
  let url;

  switch (platform) {
    case 'twitter':
      url = 'https://twitter.com/i/oauth2/authorize?' + new URLSearchParams({
        response_type: 'code',
        client_id: c.env.TWITTER_CLIENT_ID || '',
        redirect_uri: redirectUri,
        scope: 'tweet.read tweet.write users.read offline.access',
        state: String(workspaceId),
        code_challenge: 'challenge',
        code_challenge_method: 'plain',
      });
      break;
    case 'instagram':
      url = 'https://api.instagram.com/oauth/authorize?' + new URLSearchParams({
        client_id: c.env.INSTAGRAM_CLIENT_ID || '',
        redirect_uri: redirectUri,
        scope: 'instagram_basic,instagram_manage_comments,instagram_manage_insights',
        response_type: 'code',
        state: String(workspaceId),
      });
      break;
    case 'facebook':
      url = 'https://www.facebook.com/v18.0/dialog/oauth?' + new URLSearchParams({
        client_id: c.env.FACEBOOK_CLIENT_ID || '',
        redirect_uri: redirectUri,
        scope: 'pages_manage_posts,pages_read_engagement,pages_manage_engagement',
        response_type: 'code',
        state: String(workspaceId),
      });
      break;
    case 'linkedin':
      url = 'https://www.linkedin.com/oauth/v2/authorization?' + new URLSearchParams({
        response_type: 'code',
        client_id: c.env.LINKEDIN_CLIENT_ID || '',
        redirect_uri: redirectUri,
        scope: 'profile w_member_social email openid',
        state: String(workspaceId),
      });
      break;
    case 'tiktok':
      url = 'https://www.tiktok.com/v2/auth/authorize/?' + new URLSearchParams({
        client_key: c.env.TIKTOK_CLIENT_KEY || '',
        response_type: 'code',
        scope: 'user.info.basic,video.publish,video.upload',
        redirect_uri: redirectUri,
        state: String(workspaceId),
      });
      break;
    case 'whatsapp':
      // WhatsApp Business via Meta Facebook Login
      url = 'https://www.facebook.com/v18.0/dialog/oauth?' + new URLSearchParams({
        client_id: c.env.FACEBOOK_CLIENT_ID || c.env.WHATSAPP_CLIENT_ID || '',
        redirect_uri: redirectUri,
        scope: 'whatsapp_business_messaging,whatsapp_business_management,public_profile',
        response_type: 'code',
        state: String(workspaceId),
      });
      break;
    default:
      return c.json({ error: 'Unsupported platform' }, 400);
  }

  const clientConfigured = platform === 'twitter'
    ? configured(c.env.TWITTER_CLIENT_ID)
    : platform === 'tiktok'
      ? configured(c.env.TIKTOK_CLIENT_KEY)
      : platform === 'whatsapp'
        ? configured(c.env.WHATSAPP_CLIENT_ID || c.env.FACEBOOK_CLIENT_ID)
        : platform === 'instagram'
          ? configured(c.env.INSTAGRAM_CLIENT_ID)
          : platform === 'facebook'
            ? configured(c.env.FACEBOOK_CLIENT_ID)
            : configured(c.env.LINKEDIN_CLIENT_ID);
  if (!clientConfigured) {
    const key = platform === 'tiktok' ? 'TIKTOK_CLIENT_KEY' : platform === 'whatsapp' ? 'WHATSAPP_CLIENT_ID or FACEBOOK_CLIENT_ID' : `${platform.toUpperCase()}_CLIENT_ID`;
    return c.json({ error: `OAuth is not configured for ${platform}. Add ${key} as a Worker secret. Callback URL: ${redirectUri}` }, 503);
  }

  return c.json({ authUrl: url });
});

// ============================================
// OAUTH: CALLBACK (provider redirects here)
// ============================================
social.get('/:platform/callback', async (c) => {
  const platform = c.req.param('platform');
  const code = c.req.query('code');
  const state = c.req.query('state'); // workspaceId
  const redirectUri = callbackUrl(c, platform);
  const base = originOf(c);

  try {
    if (platform === 'twitter') {
      const token = await fetchJSON('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${btoa(`${c.env.TWITTER_CLIENT_ID}:${c.env.TWITTER_CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          code, grant_type: 'authorization_code', redirect_uri: redirectUri,
          client_id: c.env.TWITTER_CLIENT_ID || '', code_verifier: 'challenge',
        }),
      });
      const me = await fetchJSON('https://api.twitter.com/2/users/me', {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      await upsertAccount(c, state, 'twitter', me.data?.username, token.access_token, token.refresh_token, me.data);
    } else if (platform === 'instagram') {
      const token = await fetchJSON('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: c.env.INSTAGRAM_CLIENT_ID || '', client_secret: c.env.INSTAGRAM_CLIENT_SECRET || '',
          grant_type: 'authorization_code', redirect_uri: redirectUri, code,
        }),
      });
      const longLived = await fetchJSON('https://graph.instagram.com/access_token?' + new URLSearchParams({
        grant_type: 'ig_exchange_token', client_secret: c.env.INSTAGRAM_CLIENT_SECRET || '', access_token: token.access_token,
      }));
      const me = await fetchJSON('https://graph.instagram.com/me?' + new URLSearchParams({
        fields: 'id,username,account_type', access_token: longLived.access_token,
      }));
      await upsertAccount(c, state, 'instagram', me.username, longLived.access_token, null, me);
    } else if (platform === 'facebook') {
      const token = await fetchJSON('https://graph.facebook.com/v18.0/oauth/access_token?' + new URLSearchParams({
        client_id: c.env.FACEBOOK_CLIENT_ID || '', client_secret: c.env.FACEBOOK_CLIENT_SECRET || '',
        redirect_uri: redirectUri, code,
      }));
      const pages = await fetchJSON('https://graph.facebook.com/me/accounts?' + new URLSearchParams({ access_token: token.access_token }));
      const page = pages.data?.[0];
      if (page) {
        await upsertAccount(c, state, 'facebook', page.name, page.access_token, token.refresh_token, page);
      }
    } else if (platform === 'linkedin') {
      const token = await fetchJSON('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code', code,
          client_id: c.env.LINKEDIN_CLIENT_ID || '', client_secret: c.env.LINKEDIN_CLIENT_SECRET || '',
          redirect_uri: redirectUri,
        }),
      });
      const me = await fetchJSON('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      await upsertAccount(c, state, 'linkedin', me.name || me.email, token.access_token, token.refresh_token, me);
    } else if (platform === 'tiktok') {
      const token = await fetchJSON('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_key: c.env.TIKTOK_CLIENT_KEY || '',
          client_secret: c.env.TIKTOK_CLIENT_SECRET || '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });
      const me = await fetchJSON('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username', {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      const profile = me.data?.user || {};
      await upsertAccount(c, state, 'tiktok', profile.username || profile.display_name || 'TikTok', token.access_token, token.refresh_token, profile);
    } else if (platform === 'whatsapp') {
      const token = await fetchJSON('https://graph.facebook.com/v18.0/oauth/access_token?' + new URLSearchParams({
        client_id: c.env.FACEBOOK_CLIENT_ID || c.env.WHATSAPP_CLIENT_ID || '', client_secret: c.env.FACEBOOK_CLIENT_SECRET || c.env.WHATSAPP_CLIENT_SECRET || '',
        redirect_uri: redirectUri, code,
      }));
      // Get WABA phone numbers
      const waba = await fetchJSON('https://graph.facebook.com/v18.0/me/businesses?' + new URLSearchParams({ access_token: token.access_token })).catch(() => ({ data: [] }));
      const debug = await fetchJSON('https://graph.facebook.com/v18.0/me?' + new URLSearchParams({ fields: 'id,name', access_token: token.access_token })).catch(() => ({ id: 'whatsapp', name: 'WhatsApp Business' }));
      // Try to get phone numbers if WABA exists
      let phoneData = debug;
      if (waba.data?.[0]?.id) {
        const phones = await fetchJSON(`https://graph.facebook.com/v18.0/${waba.data[0].id}/phone_numbers?` + new URLSearchParams({ access_token: token.access_token })).catch(() => null);
        if (phones?.data?.[0]) phoneData = { ...debug, phone_number_id: phones.data[0].id, display_phone_number: phones.data[0].display_phone_number };
      }
      await upsertAccount(c, state, 'whatsapp', phoneData.display_phone_number || phoneData.name || 'WhatsApp', token.access_token, token.refresh_token, phoneData);
    } else {
      return c.html(oauthPopupHtml(false, platform, 'Unsupported platform'), 400);
    }

    return c.html(oauthPopupHtml(true, platform), 200);
  } catch (err) {
    return c.html(oauthPopupHtml(false, platform, String(err.message || err).slice(0, 180)), 200);
  }
});

// FACEBOOK DEAUTHORIZE CALLBACK
// Called when user removes app from Facebook settings
social.post('/facebook/deauthorize', async (c) => {
  const body = await c.req.text();
  const signedRequest = new URLSearchParams(body).get('signed_request');
  
  if (!signedRequest) return c.json({ error: 'No signed_request' }, 400);
  
  try {
    const [signature, payload] = signedRequest.split('.');
    const data = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );
    
    const userId = data.user_id;
    if (!userId) return c.json({ error: 'No user_id in payload' }, 400);
    
    // Delete user's Facebook/Instagram tokens
    await c.env.DB.prepare(
      `DELETE FROM dashboard_social_accounts 
       WHERE workspace_id IN (
         SELECT w.id FROM dashboard_workspaces w
         JOIN dashboard_workspace_members wm ON w.id = wm.workspace_id
         WHERE wm.user_id = ?
       ) AND platform IN ('facebook', 'instagram', 'whatsapp')`
    ).bind(userId).run();
    
    return c.json({ success: true });
  } catch (err) {
    console.error('Deauthorize error:', err);
    return c.json({ error: 'Invalid signed_request' }, 400);
  }
});

// ============================================
// FACEBOOK WEBHOOKS
// ============================================

// Verify webhook subscription (GET)
social.get('/facebook/webhook', async (c) => {
  const mode = c.req.query('hub.mode');
  const challenge = c.req.query('hub.challenge');
  const verifyToken = c.req.query('hub.verify_token');
  const expectedToken = c.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && verifyToken === expectedToken) {
    console.log('Facebook webhook verified');
    return c.text(challenge);
  }
  
  console.warn('Facebook webhook verification failed');
  return c.text('Forbidden', 403);
});

// Receive real-time updates (POST)
social.post('/facebook/webhook', async (c) => {
  const body = await c.req.json();
  const verifyToken = c.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;

  // Verify X-Hub-Signature-256 if needed
  // const signature = c.req.header('X-Hub-Signature-256');
  
  try {
    if (body.object === 'page') {
      for (const entry of body.entry) {
        const pageId = entry.id;
        
        // Find workspace with this page
        const account = await c.env.DB.prepare(
          `SELECT workspace_id, access_token, account_data FROM dashboard_social_accounts 
           WHERE platform = 'facebook' AND JSON_EXTRACT(account_data, '$.id') = ?`
        ).bind(pageId).first();

        if (!account) {
          console.log(`No workspace found for page ${pageId}`);
          continue;
        }

        const accountData = JSON.parse(account.account_data || '{}');
        
        for (const change of entry.changes || []) {
          if (change.field === 'feed') {
            // New post/comment on page
            await handlePageFeedChange(c, account.workspace_id, change.value, account.access_token);
          } else if (change.field === 'messages') {
            // New message
            await handlePageMessage(c, account.workspace_id, change.value, account.access_token);
          } else if (change.field === 'comments') {
            // New comment
            await handlePageComment(c, account.workspace_id, change.value, account.access_token);
          }
        }
      }
    }
    return c.json({ success: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return c.json({ error: 'Processing failed' }, 500);
  }
});

async function handlePageFeedChange(c, workspaceId, value, accessToken) {
  // Store feed changes (new posts, etc.)
  console.log('Page feed change:', value);
}

async function handlePageMessage(c, workspaceId, value, accessToken) {
  // Store incoming messages
  console.log('Page message:', value);
}

async function handlePageComment(c, workspaceId, value, accessToken) {
  // Store new comments for inbox
  console.log('Page comment:', value);
  // Could auto-create comments in dashboard_comments table
}

// ============================================
// INSTAGRAM WEBHOOKS
// ============================================

social.get('/instagram/webhook', async (c) => {
  const mode = c.req.query('hub.mode');
  const challenge = c.req.query('hub.challenge');
  const verifyToken = c.req.query('hub.verify_token');
  const expectedToken = c.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && verifyToken === expectedToken) {
    console.log('Instagram webhook verified');
    return c.text(challenge);
  }
  return c.text('Forbidden', 403);
});

social.post('/instagram/webhook', async (c) => {
  const body = await c.req.json();
  console.log('Instagram webhook:', JSON.stringify(body));
  return c.json({ success: true });
});

export default social;
