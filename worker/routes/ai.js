import { Hono } from 'hono';
import { authMiddleware, openaiChat, parseAgent, parseProperty, body } from '../lib.js';

const ai = new Hono();
ai.use('*', authMiddleware);

async function getWorkspaceId(c, userId) {
  const workspace = await c.env.DB.prepare(
    `SELECT w.id FROM dashboard_workspaces w
     JOIN dashboard_workspace_members wm ON w.id = wm.workspace_id
     WHERE wm.user_id = ?
     LIMIT 1`
  ).bind(userId).first();
  return workspace?.id;
}

// ---- helpers ----
function formatPrice(price) {
  const n = Number(price);
  if (!price || Number.isNaN(n)) return null;
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

// Deterministic fallback used when OpenAI is unavailable (no key / quota / error).
function buildTemplatePost(property, platform) {
  const price = formatPrice(property.price);
  const specs = [
    property.bedrooms ? `${property.bedrooms} bed` : null,
    property.bathrooms ? `${property.bathrooms} bath` : null,
    property.sqft ? `${Number(property.sqft).toLocaleString()} sqft` : null,
  ].filter(Boolean).join(' | ');
  const location = [property.city, property.state].filter(Boolean).join(', ');
  const feats = Array.isArray(property.features) && property.features.length
    ? `\n\n\u2728 ${property.features.slice(0, 4).join(' \u2022 ')}`
    : '';

  const hashtags = {
    twitter: '#RealEstate #ForSale #HomeForSale',
    instagram: '#realestate #dreamhome #forsale #justlisted #househunting #realtor',
    facebook: '#RealEstate #JustListed #HomeForSale',
    linkedin: '#RealEstate #Investment #Property',
  }[platform] || '#RealEstate #ForSale';

  const headline = property.status === 'sold'
    ? '\u2705 JUST SOLD!'
    : property.status === 'pending'
      ? '\u23F3 SALE PENDING'
      : '\uD83C\uDFE1 JUST LISTED!';

  return [
    headline,
    property.title || property.address || 'New listing',
    [location, specs].filter(Boolean).join(' \u2014 '),
    price ? `Offered at ${price}` : null,
    property.description ? `\n${String(property.description).slice(0, 180)}` : null,
    feats,
    `\n\uD83D\uDCE9 DM us for a private showing!`,
    `\n${hashtags}`,
  ].filter(Boolean).join('\n');
}

// CREATE AGENT
ai.post('/agents', async (c) => {
  const { name, description, config } = await body(c);
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const row = await c.env.DB
    .prepare('INSERT INTO dashboard_ai_agents (workspace_id, name, description, config) VALUES (?, ?, ?, ?) RETURNING *')
    .bind(workspaceId, name || null, description || null, JSON.stringify(config || {}))
    .first();
  return c.json(parseAgent(row), 201);
});

// LIST AGENTS
ai.get('/agents', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json([]);
  
  const { results } = await c.env.DB
    .prepare('SELECT * FROM dashboard_ai_agents WHERE workspace_id = ? ORDER BY created_at DESC')
    .bind(workspaceId)
    .all();
  return c.json(results.map(parseAgent));
});

// TOGGLE SINGLE AGENT ON/OFF
ai.patch('/agents/:id/toggle', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const id = c.req.param('id');
  const row = await c.env.DB.prepare('SELECT * FROM dashboard_ai_agents WHERE id = ? AND workspace_id = ?').bind(id, workspaceId).first();
  if (!row) return c.json({ error: 'Agent not found' }, 404);
  const next = row.is_active ? 0 : 1;
  const updated = await c.env.DB.prepare('UPDATE dashboard_ai_agents SET is_active = ? WHERE id = ? AND workspace_id = ? RETURNING *').bind(next, id, workspaceId).first();
  return c.json(parseAgent(updated));
});

// TOGGLE ALL AGENTS ON/OFF (master switch)
ai.post('/agents/toggle-all', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const { is_active } = await body(c);
  const val = is_active ? 1 : 0;
  await c.env.DB.prepare('UPDATE dashboard_ai_agents SET is_active = ? WHERE workspace_id = ?').bind(val, workspaceId).run();
  const { results } = await c.env.DB.prepare('SELECT * FROM dashboard_ai_agents WHERE workspace_id = ?').bind(workspaceId).all();
  return c.json(results.map(parseAgent));
});

// DELETE AGENT
ai.delete('/agents/:id', async (c) => {
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const row = await c.env.DB.prepare('DELETE FROM dashboard_ai_agents WHERE id = ? AND workspace_id = ? RETURNING id').bind(c.req.param('id'), workspaceId).first();
  if (!row) return c.json({ error: 'Agent not found' }, 404);
  return c.json({ message: 'Agent deleted' });
});

// GENERATE CONTENT
ai.post('/generate-content', async (c) => {
  const { topic, tone, platform } = await body(c);
  try {
    const content = await openaiChat(c.env, [
      { role: 'system', content: `You are a social media content creator. Generate content for ${platform} with a ${tone} tone.` },
      { role: 'user', content: `Generate 3 social media posts about: ${topic}` },
    ], 500);
    return c.json({ content });
  } catch (err) {
    return c.json({ error: err.message }, err.code === 'NO_KEY' ? 400 : 500);
  }
});

// REPLY TO COMMENT / CHAT (AI-generated) — respects ON/OFF toggle
ai.post('/reply-comment', async (c) => {
  const { comment, context, agentId } = await body(c);
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  // If any agent check: if agentId provided, ensure it's active; else need at least one active agent
  if (agentId) {
    const ag = await c.env.DB.prepare('SELECT is_active FROM dashboard_ai_agents WHERE id = ? AND workspace_id = ?').bind(agentId, workspaceId).first();
    if (ag && !ag.is_active) return c.json({ error: 'AI agent is OFF. Turn it on to auto-reply.' }, 403);
  } else {
    const any = await c.env.DB.prepare('SELECT id FROM dashboard_ai_agents WHERE workspace_id = ? AND is_active = 1 LIMIT 1').bind(workspaceId).first();
    if (!any) return c.json({ error: 'No active AI agent. Turn ON the AI agent to reply.' }, 403);
  }
  try {
    const reply = await openaiChat(c.env, [
      { role: 'system', content: 'You are SocialHub AI — a friendly social media manager. Reply to chats and comments concisely, helpfully, on-brand. Keep tone warm and professional.' },
      { role: 'user', content: `Comment/Chat: ${comment}\nContext: ${context || 'General social media post or WhatsApp chat'}` },
    ], 200);

    if (agentId) {
      await c.env.DB.prepare(
        `INSERT INTO dashboard_ai_tasks (agent_id, task_type, input_data, output_data, status, completed_at)
         VALUES (?, 'comment_reply', ?, ?, 'completed', CURRENT_TIMESTAMP)`
      ).bind(agentId, JSON.stringify({ comment, context }), JSON.stringify({ reply })).run();
    }

    return c.json({ reply });
  } catch (err) {
    return c.json({ error: err.message }, err.code === 'NO_KEY' ? 400 : 500);
  }
});

// AUTO-REPLY: generate + optionally post to platform via social layer (proxy)
ai.post('/auto-reply', async (c) => {
  const { commentId, comment, context } = await body(c);
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  const any = await c.env.DB.prepare('SELECT id FROM dashboard_ai_agents WHERE workspace_id = ? AND is_active = 1 LIMIT 1').bind(workspaceId).first();
  if (!any) return c.json({ error: 'AI agent is OFF' }, 403);
  try {
    const reply = await openaiChat(c.env, [
      { role: 'system', content: 'You are SocialHub AI. Generate a concise, friendly reply to this chat/comment.' },
      { role: 'user', content: `Message: ${comment}\nContext: ${context || ''}` },
    ], 150);
    return c.json({ reply, canPost: !!commentId });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// AI CHAT ENDPOINT (for interactive chat)
ai.post('/chat', async (c) => {
  const { agent_id, message, history } = await body(c);
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);
  
  // Verify agent exists and is active
  const agent = await c.env.DB.prepare('SELECT * FROM dashboard_ai_agents WHERE id = ? AND workspace_id = ? AND is_active = 1').bind(agent_id, workspaceId).first();
  if (!agent) return c.json({ error: 'Agent not found or inactive' }, 404);
  
  try {
    // Build system prompt based on agent config
    const config = JSON.parse(agent.config || '{}');
    const tone = config.tone || 'professional';
    const systemPrompt = `You are SocialHub AI, a professional marketing assistant. 
Tone: ${tone}.
Help with: marketing strategy, campaign planning, content creation, social media management, analytics interpretation, and creative ideation.
Be concise, actionable, and professional. Use formatting for readability.`;
    
    // Build messages array with history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-10).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];
    
    const reply = await openaiChat(c.env, messages, 800);
    return c.json({ reply });
  } catch (err) {
    return c.json({ error: err.message }, err.code === 'NO_KEY' ? 400 : 500);
  }
});

// CONTENT SUGGESTIONS
ai.post('/suggestions', async (c) => {
  const { platform, topic, targetAudience } = await body(c);
  try {
    const suggestions = await openaiChat(c.env, [
      { role: 'system', content: `You are a social media strategist. Provide content suggestions for ${platform}.` },
      { role: 'user', content: `Give 5 content ideas for ${topic} targeting ${targetAudience || 'general audience'}. Include hashtags and posting times.` },
    ], 800);
    return c.json({ suggestions });
  } catch (err) {
    return c.json({ error: err.message }, err.code === 'NO_KEY' ? 400 : 500);
  }
});

// LISTING-TO-POST GENERATOR (real estate) — always returns usable copy.
ai.post('/generate-listing-post', async (c) => {
  const { propertyId, platform = 'instagram', tone = 'professional' } = await body(c);
  const userId = c.get('userId');
  const workspaceId = await getWorkspaceId(c, userId);
  if (!workspaceId) return c.json({ error: 'Workspace not found' }, 404);

  const raw = await c.env.DB
    .prepare('SELECT * FROM dashboard_properties WHERE id = ? AND workspace_id = ?')
    .bind(propertyId, workspaceId)
    .first();
  if (!raw) return c.json({ error: 'Property not found' }, 404);

  const property = parseProperty(raw);

  try {
    const details = {
      title: property.title,
      address: [property.address, property.city, property.state, property.zip].filter(Boolean).join(', '),
      price: formatPrice(property.price),
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sqft: property.sqft,
      type: property.property_type,
      status: property.status,
      description: property.description,
      features: property.features,
    };

    const content = await openaiChat(c.env, [
      { role: 'system', content: `You are a real estate social media expert. Write a single ready-to-post ${platform} caption in a ${tone} tone. Include relevant emojis, a strong hook, key property details, a clear call to action, and 3-6 relevant hashtags. Keep it appropriate in length for ${platform}.` },
      { role: 'user', content: `Create a ${platform} post for this property listing:\n${JSON.stringify(details, null, 2)}` },
    ], 400);

    return c.json({ content, source: 'ai' });
  } catch (err) {
    // Graceful degradation: no/invalid key or quota issues -> smart template.
    return c.json({ content: buildTemplatePost(property, platform), source: 'template' });
  }
});


// MODERATION: sentiment (Workers AI) plus rule-based spam flags. Never blocks;
// returns signals the UI can display next to comments/messages.
ai.post("/moderate", async (c) => {
  const { text } = await body(c);
  if (!text || !String(text).trim()) return c.json({ error: "Text is required." }, 400);
  const t = String(text);
  const lower = t.toLowerCase();

  const spamReasons = [];
  const links = (t.match(/https?:\/\/|www\.|\.xyz|\.top|\.click/g) || []).length;
  if (links >= 2) spamReasons.push("multiple links");
  const letters = t.replace(/[^A-Za-z]/g, "");
  if (letters.length > 20 && (t.replace(/[^A-Z]/g, "").length / letters.length) > 0.7) spamReasons.push("excessive caps");
  if (/(.)\1{5,}/.test(t)) spamReasons.push("repeated characters");
  const banned = ["free crypto", "double your", "guaranteed profit", "send eth", "send btc", "adult dating", "work from home scam"];
  if (banned.some((w) => lower.includes(w))) spamReasons.push("known scam phrase");
  if (/\d{10,}/.test(t.replace(/[\s-]/g, ""))) spamReasons.push("long number string");

  let sentiment = "unknown";
  let score = null;
  if (c.env.AI) {
    try {
      const out = await c.env.AI.run("@cf/huggingface/distilbert-sst-2-int8", { text: t.slice(0, 2000) });
      const top = Array.isArray(out) ? out[0] : out;
      if (top && top.label) {
        sentiment = /pos/i.test(top.label) ? "positive" : "negative";
        score = typeof top.score === "number" ? Math.round(top.score * 100) / 100 : null;
      }
    } catch (err) {
      try { c.get("log").error("moderate-ai", { message: String(err.message || err) }); } catch {}
    }
  }

  return c.json({ sentiment, score, spam: spamReasons.length > 0, spam_reasons: spamReasons });
});
export default ai;
