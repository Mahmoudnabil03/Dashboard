const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const axios = require('axios');
const querystring = require('querystring');

// ============================================
// TWITTER/X OAUTH 2.0
// ============================================

// Initiate Twitter OAuth
router.get('/twitter/auth', authMiddleware, (req, res) => {
  const authUrl = 'https://twitter.com/i/oauth2/authorize';
  const params = {
    response_type: 'code',
    client_id: process.env.TWITTER_CLIENT_ID,
    redirect_uri: process.env.TWITTER_CALLBACK_URL,
    scope: 'tweet.read tweet.write users.read offline.access',
    state: req.userId,
    code_challenge: 'challenge',
    code_challenge_method: 'plain'
  };
  
  res.json({ authUrl: `${authUrl}?${querystring.stringify(params)}` });
});

// Twitter OAuth Callback
router.get('/twitter/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const pool = req.pool;

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      querystring.stringify({
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TWITTER_CALLBACK_URL,
        client_id: process.env.TWITTER_CLIENT_ID,
        code_verifier: 'challenge'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(
            `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
          ).toString('base64')}`
        }
      }
    );

    // Get user info from Twitter
    const userInfo = await axios.get('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenResponse.data.access_token}`
      }
    });

    // Save account to database
    const result = await pool.query(
      `INSERT INTO social_accounts 
       (user_id, platform, username, access_token, refresh_token, account_data) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (user_id, platform) DO UPDATE 
       SET access_token = $4, refresh_token = $5, account_data = $6, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        state,
        'twitter',
        userInfo.data.data.username,
        tokenResponse.data.access_token,
        tokenResponse.data.refresh_token || null,
        userInfo.data.data
      ]
    );

    // Redirect back to frontend
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=twitter`);
  } catch (error) {
    console.error('Twitter OAuth error:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=twitter_auth_failed`);
  }
});

// ============================================
// INSTAGRAM OAUTH 2.0 (via Facebook)
// ============================================

// Initiate Instagram OAuth
router.get('/instagram/auth', authMiddleware, (req, res) => {
  const authUrl = 'https://api.instagram.com/oauth/authorize';
  const params = {
    client_id: process.env.INSTAGRAM_CLIENT_ID,
    redirect_uri: process.env.INSTAGRAM_CALLBACK_URL,
    scope: 'instagram_basic,instagram_manage_comments,instagram_manage_insights',
    response_type: 'code',
    state: req.userId
  };
  
  res.json({ authUrl: `${authUrl}?${querystring.stringify(params)}` });
});

// Instagram OAuth Callback
router.get('/instagram/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const pool = req.pool;

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://api.instagram.com/oauth/access_token',
      querystring.stringify({
        client_id: process.env.INSTAGRAM_CLIENT_ID,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: process.env.INSTAGRAM_CALLBACK_URL,
        code: code
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // Get long-lived access token
    const longLivedToken = await axios.get(
      `https://graph.instagram.com/access_token`,
      {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
          access_token: tokenResponse.data.access_token
        }
      }
    );

    // Get user info
    const userInfo = await axios.get(
      `https://graph.instagram.com/me`,
      {
        params: {
          fields: 'id,username,account_type',
          access_token: longLivedToken.data.access_token
        }
      }
    );

    // Save account
    await pool.query(
      `INSERT INTO social_accounts 
       (user_id, platform, username, access_token, refresh_token, account_data) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (user_id, platform) DO UPDATE 
       SET access_token = $4, refresh_token = $5, account_data = $6, updated_at = CURRENT_TIMESTAMP`,
      [
        state,
        'instagram',
        userInfo.data.username,
        longLivedToken.data.access_token,
        null,
        userInfo.data
      ]
    );

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=instagram`);
  } catch (error) {
    console.error('Instagram OAuth error:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=instagram_auth_failed`);
  }
});

// ============================================
// FACEBOOK OAUTH 2.0
// ============================================

// Initiate Facebook OAuth
router.get('/facebook/auth', authMiddleware, (req, res) => {
  const authUrl = 'https://www.facebook.com/v18.0/dialog/oauth';
  const params = {
    client_id: process.env.FACEBOOK_CLIENT_ID,
    redirect_uri: process.env.FACEBOOK_CALLBACK_URL,
    scope: 'pages_manage_posts,pages_read_engagement,pages_manage_engagement',
    response_type: 'code',
    state: req.userId
  };
  
  res.json({ authUrl: `${authUrl}?${querystring.stringify(params)}` });
});

// Facebook OAuth Callback
router.get('/facebook/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const pool = req.pool;

    // Exchange code for access token
    const tokenResponse = await axios.get(
      'https://graph.facebook.com/v18.0/oauth/access_token',
      {
        params: {
          client_id: process.env.FACEBOOK_CLIENT_ID,
          client_secret: process.env.FACEBOOK_CLIENT_SECRET,
          redirect_uri: process.env.FACEBOOK_CALLBACK_URL,
          code: code
        }
      }
    );

    // Get user pages
    const pagesResponse = await axios.get(
      `https://graph.facebook.com/me/accounts`,
      {
        params: {
          access_token: tokenResponse.data.access_token
        }
      }
    );

    // Save each page as a social account
    for (const page of pagesResponse.data.data) {
      await pool.query(
        `INSERT INTO social_accounts 
         (user_id, platform, username, access_token, refresh_token, account_data) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT (user_id, platform, username) DO UPDATE 
         SET access_token = $4, refresh_token = $5, account_data = $6, updated_at = CURRENT_TIMESTAMP`,
        [
          state,
          'facebook',
          page.name,
          page.access_token,
          tokenResponse.data.refresh_token || null,
          page
        ]
      );
    }

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=facebook`);
  } catch (error) {
    console.error('Facebook OAuth error:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=facebook_auth_failed`);
  }
});

// ============================================
// LINKEDIN OAUTH 2.0
// ============================================

// Initiate LinkedIn OAuth
router.get('/linkedin/auth', authMiddleware, (req, res) => {
  const authUrl = 'https://www.linkedin.com/oauth/v2/authorization';
  const params = {
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID,
    redirect_uri: process.env.LINKEDIN_CALLBACK_URL,
    scope: 'profile w_member_social email openid',
    state: req.userId
  };
  
  res.json({ authUrl: `${authUrl}?${querystring.stringify(params)}` });
});

// LinkedIn OAuth Callback
router.get('/linkedin/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const pool = req.pool;

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      querystring.stringify({
        grant_type: 'authorization_code',
        code: code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: process.env.LINKEDIN_CALLBACK_URL
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // Get user profile
    const profileResponse = await axios.get(
      'https://api.linkedin.com/v2/userinfo',
      {
        headers: {
          'Authorization': `Bearer ${tokenResponse.data.access_token}`
        }
      }
    );

    // Save account
    await pool.query(
      `INSERT INTO social_accounts 
       (user_id, platform, username, access_token, refresh_token, account_data) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (user_id, platform) DO UPDATE 
       SET access_token = $4, refresh_token = $5, account_data = $6, updated_at = CURRENT_TIMESTAMP`,
      [
        state,
        'linkedin',
        profileResponse.data.name || profileResponse.data.email,
        tokenResponse.data.access_token,
        tokenResponse.data.refresh_token || null,
        profileResponse.data
      ]
    );

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=linkedin`);
  } catch (error) {
    console.error('LinkedIn OAuth error:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=linkedin_auth_failed`);
  }
});

// ============================================
// GET ALL CONNECTED ACCOUNTS
// ============================================

router.get('/accounts', authMiddleware, async (req, res) => {
  try {
    const pool = req.pool;
    const result = await pool.query(
      'SELECT * FROM social_accounts WHERE user_id = $1 ORDER BY platform, created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DISCONNECT SOCIAL ACCOUNT
// ============================================

router.delete('/accounts/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.pool;

    const result = await pool.query(
      'DELETE FROM social_accounts WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({ message: 'Account disconnected successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET COMMENTS FOR A POST
// ============================================

router.get('/comments/:postId', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const pool = req.pool;

    const result = await pool.query(
      `SELECT c.*, p.content as post_content 
       FROM comments c 
       LEFT JOIN posts p ON c.post_id = p.id 
       WHERE c.post_id = $1 AND c.user_id = $2 
       ORDER BY c.created_at DESC`,
      [postId, req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// REPLY TO COMMENT
// ============================================

router.post('/comments/reply', authMiddleware, async (req, res) => {
  try {
    const { commentId, reply } = req.body;
    const pool = req.pool;

    // Get the comment and its social account
    const comment = await pool.query(
      `SELECT c.*, s.access_token, s.platform 
       FROM comments c 
       JOIN posts p ON c.post_id = p.id 
       JOIN social_accounts s ON p.account_id = s.id 
       WHERE c.id = $1 AND c.user_id = $2`,
      [commentId, req.userId]
    );

    if (comment.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Reply based on platform
    const commentData = comment.rows[0];
    let replyResult;

    switch (commentData.platform) {
      case 'twitter':
        replyResult = await replyToTwitterComment(commentData, reply);
        break;
      case 'instagram':
        replyResult = await replyToInstagramComment(commentData, reply);
        break;
      case 'facebook':
        replyResult = await replyToFacebookComment(commentData, reply);
        break;
      case 'linkedin':
        replyResult = await replyToLinkedInComment(commentData, reply);
        break;
      default:
        throw new Error('Unsupported platform');
    }

    // Update comment in database
    await pool.query(
      'UPDATE comments SET replied = TRUE, ai_response = $1 WHERE id = $2 AND user_id = $3',
      [reply, commentId, req.userId]
    );

    res.json({ message: 'Reply sent successfully', replyResult });
  } catch (error) {
    console.error('Reply error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Platform-specific reply functions
async function replyToTwitterComment(comment, reply) {
  const response = await axios.post(
    'https://api.twitter.com/2/tweets',
    {
      text: reply,
      reply: {
        in_reply_to_tweet_id: comment.comment_id
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${comment.access_token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}

async function replyToInstagramComment(comment, reply) {
  const response = await axios.post(
    `https://graph.instagram.com/${comment.comment_id}/replies`,
    {
      message: reply
    },
    {
      params: {
        access_token: comment.access_token
      }
    }
  );
  return response.data;
}

async function replyToFacebookComment(comment, reply) {
  const response = await axios.post(
    `https://graph.facebook.com/${comment.comment_id}/comments`,
    {
      message: reply
    },
    {
      params: {
        access_token: comment.access_token
      }
    }
  );
  return response.data;
}

async function replyToLinkedInComment(comment, reply) {
  const response = await axios.post(
    'https://api.linkedin.com/v2/socialActions/' + comment.comment_id + '/comments',
    {
      actor: 'urn:li:person:' + comment.account_data?.id,
      message: {
        text: reply
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${comment.access_token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}

module.exports = router;