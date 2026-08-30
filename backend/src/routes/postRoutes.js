const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Create post
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { account_id, content, media_urls, scheduled_time, platform, property_id } = req.body;
    const pool = req.pool;

    const status = scheduled_time ? 'scheduled' : 'draft';

    const result = await pool.query(
      `INSERT INTO posts 
       (user_id, account_id, property_id, content, media_urls, scheduled_time, platform, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [req.userId, account_id || null, property_id || null, content, media_urls || null, scheduled_time || null, platform, status]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all posts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pool = req.pool;
    const result = await pool.query(
      'SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update post status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const pool = req.pool;

    const result = await pool.query(
      'UPDATE posts SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete post
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.pool;

    const result = await pool.query(
      'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;