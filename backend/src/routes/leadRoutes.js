const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const VALID_STATUSES = ['new', 'contacted', 'qualified', 'closed', 'lost'];

// ============================================
// CREATE LEAD (manual entry)
// ============================================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name, email, phone, source, platform, message, property_id, status, notes,
    } = req.body;
    const pool = req.pool;

    const result = await pool.query(
      `INSERT INTO leads
       (user_id, property_id, name, email, phone, source, platform, message, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        req.userId,
        property_id || null,
        name || null,
        email || null,
        phone || null,
        source || 'manual',
        platform || null,
        message || null,
        status && VALID_STATUSES.includes(status) ? status : 'new',
        notes || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CONVERT A COMMENT INTO A LEAD
// ============================================
router.post('/from-comment', authMiddleware, async (req, res) => {
  try {
    const { comment_id, property_id, name } = req.body;
    const pool = req.pool;

    // Pull the comment (scoped to this user) to seed the lead.
    const commentRes = await pool.query(
      `SELECT c.*, p.platform AS post_platform
       FROM comments c
       LEFT JOIN posts p ON c.post_id = p.id
       WHERE c.id = $1 AND c.user_id = $2`,
      [comment_id, req.userId]
    );

    if (commentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    const comment = commentRes.rows[0];

    // Avoid creating duplicate leads for the same comment.
    const existing = await pool.query(
      'SELECT id FROM leads WHERE comment_id = $1 AND user_id = $2',
      [comment_id, req.userId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A lead already exists for this comment', leadId: existing.rows[0].id });
    }

    const result = await pool.query(
      `INSERT INTO leads
       (user_id, property_id, comment_id, name, source, platform, message, status)
       VALUES ($1,$2,$3,$4,'comment',$5,$6,'new')
       RETURNING *`,
      [
        req.userId,
        property_id || null,
        comment_id,
        name || comment.author || 'Unknown',
        comment.post_platform || null,
        comment.content || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET ALL LEADS (optional status filter) + joined property/comment info
// ============================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pool = req.pool;
    const { status } = req.query;

    let query = `
      SELECT l.*,
             p.title AS property_title,
             p.address AS property_address
      FROM leads l
      LEFT JOIN properties p ON l.property_id = p.id
      WHERE l.user_id = $1`;
    const params = [req.userId];

    if (status) {
      params.push(status);
      query += ` AND l.status = $${params.length}`;
    }
    query += ' ORDER BY l.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// UPDATE LEAD (full)
// ============================================
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = req.pool;
    const { name, email, phone, platform, message, property_id, status, notes } = req.body;

    const result = await pool.query(
      `UPDATE leads SET
         name = $1, email = $2, phone = $3, platform = $4, message = $5,
         property_id = $6, status = $7, notes = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [
        name || null,
        email || null,
        phone || null,
        platform || null,
        message || null,
        property_id || null,
        status && VALID_STATUSES.includes(status) ? status : 'new',
        notes || null,
        req.params.id,
        req.userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// UPDATE STATUS ONLY (pipeline moves)
// ============================================
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const pool = req.pool;
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      'UPDATE leads SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DELETE LEAD
// ============================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = req.pool;
    const result = await pool.query(
      'DELETE FROM leads WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json({ message: 'Lead deleted successfully' });
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
         COUNT(*) FILTER (WHERE status = 'new')::int AS new,
         COUNT(*) FILTER (WHERE status = 'contacted')::int AS contacted,
         COUNT(*) FILTER (WHERE status = 'qualified')::int AS qualified,
         COUNT(*) FILTER (WHERE status = 'closed')::int AS closed
       FROM leads WHERE user_id = $1`,
      [req.userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
