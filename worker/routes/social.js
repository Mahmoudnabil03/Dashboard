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

async function upsertAccount(c, userId, platform, username, accessToken, refreshToken, data) {
  await c.env.DB.prepare(
    `INSERT INTO dashboard_social_accounts (user_id, platform, username, access_token, refresh_token, account_data)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, platform) DO UPDATE SET
       username = excluded.username,
       access_token = excluded.access_token,
       refresh_token = excluded.refresh_token,
       account_data = excluded.account_data,
       updated_at = CURRENT_TIMESTAMP`
  ).bind(userId, platform, username || null, accessToken || null, refreshToken || null, JSON.stringify(data || {})).run();
}

// ============================================
// LIST CONNECTED ACCOUNTS
// ============================================
social.get('/accounts', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { results } = await c.env.DB
    .prepare('SELECT * FROM dashboard_social_accounts WHERE user_id = ? ORDER BY platform, created_at DESC')
    .bind(userId)
    .all();
  return c.json(results.map(parseAccount));
});

// DISCONNECT
social.delete('/accounts/:id', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const row = await c.env.DB
    .prepare('DELETE FROM dashboard_social_accounts WHERE id = ? AND user_id = ? RETURNING id')
    .bind(c.req.param('id'), userId)
    .first();
  if (!row) return c.json({ error: 'Account not found' }, 404);
  return c.json({ message: 'Account disconnected successfully' });
});

// ============================================
// COMMENTS FOR A POST
// ============================================
social.get('/comments/:postId', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { results } = await c.env.DB.prepare(
    `SELECT c.*, p.content AS post_content
     FROM dashboard_comments c
     LEFT JOIN dashboard_posts p ON c.post_id = p.id
     WHERE c.post_id = ? AND c.user_id = ?
     ORDER BY c.created_at DESC`
  ).bind(c.req.param('postId'), userId).all();
  return c.json(results);
});

// REPLY TO A COMMENT (posts to the platform, then marks replied)
social.post('/comments/reply', authMiddleware, async (c) => {
  const { commentId, reply } = await body(c);
  const userId = c.get('userId');

  const comment = await c.env.DB.prepare(
    `SELECT c.*, s.access_token, s.platform, s.account_data
     FROM dashboard_comments c
     JOIN dashboard_posts p ON c.post_id = p.id
     JOIN dashboard_social_accounts s ON p.account_id = s.id
     WHERE c.id = ? AND c.user_id = ?`
  ).bind(commentId, userId).first();

  if (!comment) return c.json({ error: 'Comment not found' }, 404);

  try {
    await postReply(comment, reply);
  } catch (err) {
    return c.json({ error: `Failed to post reply: ${err.message}` }, 500);
  }

  await c.env.DB
    .prepare('UPDATE dashboard_comments SET replied = 1, ai_response = ? WHERE id = ? AND user_id = ?')
    .bind(reply, commentId, userId)
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
social.get('/:platform/auth', authMiddleware, (c) => {
  const platform = c.req.param('platform');
  const userId = c.get('userId');
  const redirectUri = callbackUrl(c, platform);
  let url;

  switch (platform) {
    case 'twitter':
      url = 'https://twitter.com/i/oauth2/authorize?' + new URLSearchParams({
        response_type: 'code',
        client_id: c.env.TWITTER_CLIENT_ID || '',
        redirect_uri: redirectUri,
        scope: 'tweet.read tweet.write users.read offline.access',
        state: String(userId),
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
        state: String(userId),
      });
      break;
    case 'facebook':
      url = 'https://www.facebook.com/v18.0/dialog/oauth?' + new URLSearchParams({
        client_id: c.env.FACEBOOK_CLIENT_ID || '',
        redirect_uri: redirectUri,
        scope: 'pages_manage_posts,pages_read_engagement,pages_manage_engagement',
        response_type: 'code',
        state: String(userId),
      });
      break;
    case 'linkedin':
      url = 'https://www.linkedin.com/oauth/v2/authorization?' + new URLSearchParams({
        response_type: 'code',
        client_id: c.env.LINKEDIN_CLIENT_ID || '',
        redirect_uri: redirectUri,
        scope: 'profile w_member_social email openid',
        state: String(userId),
      });
      break;
    default:
      return c.json({ error: 'Unsupported platform' }, 400);
  }

  return c.json({ authUrl: url });
});

// ============================================
// OAUTH: CALLBACK (provider redirects here)
// ============================================
social.get('/:platform/callback', async (c) => {
  const platform = c.req.param('platform');
  const code = c.req.query('code');
  const state = c.req.query('state'); // userId
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
    } else {
      return c.redirect(`${base}/?error=unsupported_platform`);
    }

    return c.redirect(`${base}/?connected=${platform}`);
  } catch (err) {
    return c.redirect(`${base}/?error=${platform}_auth_failed`);
  }
});

export default social;
