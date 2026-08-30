import { Hono } from 'hono';
import { authMiddleware, openaiChat, parseAgent, parseProperty, body } from '../lib.js';

const ai = new Hono();
ai.use('*', authMiddleware);

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
  const row = await c.env.DB
    .prepare('INSERT INTO ai_agents (user_id, name, description, config) VALUES (?, ?, ?, ?) RETURNING *')
    .bind(userId, name || null, description || null, JSON.stringify(config || {}))
    .first();
  return c.json(parseAgent(row), 201);
});

// LIST AGENTS
ai.get('/agents', async (c) => {
  const userId = c.get('userId');
  const { results } = await c.env.DB
    .prepare('SELECT * FROM ai_agents WHERE user_id = ?')
    .bind(userId)
    .all();
  return c.json(results.map(parseAgent));
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

// REPLY TO COMMENT (AI-generated)
ai.post('/reply-comment', async (c) => {
  const { comment, context, agentId } = await body(c);
  try {
    const reply = await openaiChat(c.env, [
      { role: 'system', content: 'You are a social media manager. Generate a professional and engaging reply to the following comment. Keep it concise and friendly.' },
      { role: 'user', content: `Comment: ${comment}\nContext: ${context || 'General social media post'}` },
    ], 150);

    if (agentId) {
      await c.env.DB.prepare(
        `INSERT INTO ai_tasks (agent_id, task_type, input_data, output_data, status, completed_at)
         VALUES (?, 'comment_reply', ?, ?, 'completed', CURRENT_TIMESTAMP)`
      ).bind(agentId, JSON.stringify({ comment, context }), JSON.stringify({ reply })).run();
    }

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

  const raw = await c.env.DB
    .prepare('SELECT * FROM properties WHERE id = ? AND user_id = ?')
    .bind(propertyId, userId)
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

export default ai;
