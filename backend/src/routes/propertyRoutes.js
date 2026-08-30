const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Normalize incoming array-ish fields (accepts array or comma-separated string).
function toArray(value) {
  if (Array.isArray(value)) return value.filter((v) => v !== null && v !== '');
  if (typeof value === 'string' && value.trim() !== '') {
    return value.split(',').map((v) => v.trim()).filter(Boolean);
  }
  return [];
}

// ============================================
// CREATE PROPERTY LISTING
// ============================================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      title, address, city, state, zip, price, bedrooms, bathrooms,
      sqft, property_type, status, description, features, image_urls, listing_date,
    } = req.body;
    const pool = req.pool;

    const result = await pool.query(
      `INSERT INTO properties
       (user_id, title, address, city, state, zip, price, bedrooms, bathrooms,
        sqft, property_type, status, description, features, image_urls, listing_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        req.userId,
        title || null,
        address || null,
        city || null,
        state || null,
        zip || null,
        price || null,
        bedrooms || null,
        bathrooms || null,
        sqft || null,
        property_type || 'house',
        status || 'available',
        description || null,
        toArray(features),
        toArray(image_urls),
        listing_date || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET ALL PROPERTIES (with optional status filter)
// ============================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pool = req.pool;
    const { status } = req.query;

    let query = 'SELECT * FROM properties WHERE user_id = $1';
    const params = [req.userId];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET SINGLE PROPERTY
// ============================================
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = req.pool;
    const result = await pool.query(
      'SELECT * FROM properties WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// UPDATE PROPERTY
// ============================================
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = req.pool;
    const {
      title, address, city, state, zip, price, bedrooms, bathrooms,
      sqft, property_type, status, description, features, image_urls, listing_date,
    } = req.body;

    const result = await pool.query(
      `UPDATE properties SET
        title = $1, address = $2, city = $3, state = $4, zip = $5,
        price = $6, bedrooms = $7, bathrooms = $8, sqft = $9,
        property_type = $10, status = $11, description = $12,
        features = $13, image_urls = $14, listing_date = $15,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $16 AND user_id = $17
       RETURNING *`,
      [
        title || null,
        address || null,
        city || null,
        state || null,
        zip || null,
        price || null,
        bedrooms || null,
        bathrooms || null,
        sqft || null,
        property_type || 'house',
        status || 'available',
        description || null,
        toArray(features),
        toArray(image_urls),
        listing_date || null,
        req.params.id,
        req.userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// UPDATE STATUS ONLY (available / pending / sold)
// ============================================
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const pool = req.pool;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE properties SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DELETE PROPERTY
// ============================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = req.pool;
    const result = await pool.query(
      'DELETE FROM properties WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SUMMARY STATS (for dashboard hub)
// ============================================
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    const pool = req.pool;
    const result = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'available')::int AS available,
         COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
         COUNT(*) FILTER (WHERE status = 'sold')::int AS sold,
         COALESCE(SUM(price) FILTER (WHERE status = 'available'), 0)::float AS available_value
       FROM properties WHERE user_id = $1`,
      [req.userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
