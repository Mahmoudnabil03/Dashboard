const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create AI Agent
router.post('/agents', authMiddleware, async (req, res) => {
  try {
    const { name, description, config } = req.body;
    const pool = req.pool;

    const result = await pool.query(
      'INSERT INTO ai_agents (user_id, name, description, config) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, name, description, config]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all AI agents
router.get('/agents', authMiddleware, async (req, res) => {
  try {
    const pool = req.pool;
    const result = await pool.query(
      'SELECT * FROM ai_agents WHERE user_id = $1',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate content with AI
router.post('/generate-content', authMiddleware, async (req, res) => {
  try {
    const { topic, tone, platform } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a social media content creator. Generate content for ${platform} with a ${tone} tone.`
        },
        {
          role: "user",
          content: `Generate 3 social media posts about: ${topic}`
        }
      ],
      max_tokens: 500,
    });

    const content = completion.choices[0].message.content;
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Reply to comments
router.post('/reply-comment', authMiddleware, async (req, res) => {
  try {
    const { comment, context, agentId } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a social media manager. Generate a professional and engaging reply to the following comment. Keep it concise and friendly.`
        },
        {
          role: "user",
          content: `Comment: ${comment}\nContext: ${context || 'General social media post'}`
        }
      ],
      max_tokens: 150,
    });

    const reply = completion.choices[0].message.content;

    // Store the AI reply
    if (agentId) {
      const pool = req.pool;
      await pool.query(
        `INSERT INTO ai_tasks 
         (agent_id, task_type, input_data, output_data, status, completed_at) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [agentId, 'comment_reply', { comment, context }, { reply }, 'completed']
      );
    }

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Content suggestions
router.post('/suggestions', authMiddleware, async (req, res) => {
  try {
    const { platform, topic, targetAudience } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a social media strategist. Provide content suggestions for ${platform}.`
        },
        {
          role: "user",
          content: `Give 5 content ideas for ${topic} targeting ${targetAudience || 'general audience'}. Include hashtags and posting times.`
        }
      ],
      max_tokens: 800,
    });

    const suggestions = completion.choices[0].message.content;
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// LISTING-TO-POST GENERATOR (real estate)
// ============================================

// Formats a currency value, tolerating strings/nulls.
function formatPrice(price) {
  const n = Number(price);
  if (!price || Number.isNaN(n)) return null;
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

// Deterministic fallback used when the OpenAI call is unavailable (e.g. no API key in dev).
function buildTemplatePost(property, platform) {
  const price = formatPrice(property.price);
  const specs = [
    property.bedrooms ? `${property.bedrooms} bed` : null,
    property.bathrooms ? `${property.bathrooms} bath` : null,
    property.sqft ? `${Number(property.sqft).toLocaleString()} sqft` : null,
  ].filter(Boolean).join(' | ');
  const location = [property.city, property.state].filter(Boolean).join(', ');
  const features = Array.isArray(property.features) && property.features.length
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
    property.description ? `\n${property.description.slice(0, 180)}` : null,
    features,
    `\n\uD83D\uDCE9 DM us for a private showing!`,
    `\n${hashtags}`,
  ].filter(Boolean).join('\n');
}

router.post('/generate-listing-post', authMiddleware, async (req, res) => {
  try {
    const { propertyId, platform = 'instagram', tone = 'professional' } = req.body;
    const pool = req.pool;

    const propRes = await pool.query(
      'SELECT * FROM properties WHERE id = $1 AND user_id = $2',
      [propertyId, req.userId]
    );
    if (propRes.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    const property = propRes.rows[0];

    // Try OpenAI first; fall back to a template so the feature always returns usable copy.
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

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a real estate social media expert. Write a single ready-to-post ${platform} caption in a ${tone} tone. Include relevant emojis, a strong hook, key property details, a clear call to action, and 3-6 relevant hashtags. Keep it appropriate in length for ${platform}.`,
          },
          {
            role: 'user',
            content: `Create a ${platform} post for this property listing:\n${JSON.stringify(details, null, 2)}`,
          },
        ],
        max_tokens: 400,
      });

      return res.json({ content: completion.choices[0].message.content, source: 'ai' });
    } catch (aiError) {
      // Graceful degradation: no/invalid API key or quota issues.
      return res.json({ content: buildTemplatePost(property, platform), source: 'template' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;