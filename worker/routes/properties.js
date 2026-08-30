import { Hono } from 'hono';
import { authMiddleware, parseProperty, toArray, body } from '../lib.js';

const properties = new Hono();
properties.use('*', authMiddleware);

// CREATE
properties.post('/', async (c) => {
  const b = await body(c);
  const userId = c.get('userId');

  const row = await c.env.DB.prepare(
    `INSERT INTO dashboard_properties
      (user_id, title, address, city, state, zip, price, bedrooms, bathrooms,
       sqft, property_type, status, description, features, image_urls, listing_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`
  ).bind(
    userId,
    b.title || null,
    b.address || null,
    b.city || null,
    b.state || null,
    b.zip || null,
    b.price || null,
    b.bedrooms || null,
    b.bathrooms || null,
    b.sqft || null,
    b.property_type || 'house',
    b.status || 'available',
    b.description || null,
    JSON.stringify(toArray(b.features)),
    JSON.stringify(toArray(b.image_urls)),
    b.listing_date || null
  ).first();

  return c.json(parseProperty(row), 201);
});

// LIST (optional ?status= filter)
properties.get('/', async (c) => {
  const userId = c.get('userId');
  const status = c.req.query('status');

  let sql = 'SELECT * FROM dashboard_properties WHERE user_id = ?';
  const params = [userId];
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC';

  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json(results.map(parseProperty));
});

// SUMMARY STATS (registered before /:id — different depth, no conflict)
properties.get('/stats/summary', async (c) => {
  const userId = c.get('userId');
  const row = await c.env.DB.prepare(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available,
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) AS sold,
       COALESCE(SUM(CASE WHEN status = 'available' THEN price ELSE 0 END), 0) AS available_value
     FROM dashboard_properties WHERE user_id = ?`
  ).bind(userId).first();

  return c.json({
    total: row.total || 0,
    available: row.available || 0,
    pending: row.pending || 0,
    sold: row.sold || 0,
    available_value: row.available_value || 0,
  });
});

// GET ONE
properties.get('/:id', async (c) => {
  const userId = c.get('userId');
  const row = await c.env.DB
    .prepare('SELECT * FROM dashboard_properties WHERE id = ? AND user_id = ?')
    .bind(c.req.param('id'), userId)
    .first();
  if (!row) return c.json({ error: 'Property not found' }, 404);
  return c.json(parseProperty(row));
});

// UPDATE
properties.put('/:id', async (c) => {
  const b = await body(c);
  const userId = c.get('userId');

  const row = await c.env.DB.prepare(
    `UPDATE dashboard_properties SET
       title = ?, address = ?, city = ?, state = ?, zip = ?,
       price = ?, bedrooms = ?, bathrooms = ?, sqft = ?,
       property_type = ?, status = ?, description = ?,
       features = ?, image_urls = ?, listing_date = ?,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?
     RETURNING *`
  ).bind(
    b.title || null,
    b.address || null,
    b.city || null,
    b.state || null,
    b.zip || null,
    b.price || null,
    b.bedrooms || null,
    b.bathrooms || null,
    b.sqft || null,
    b.property_type || 'house',
    b.status || 'available',
    b.description || null,
    JSON.stringify(toArray(b.features)),
    JSON.stringify(toArray(b.image_urls)),
    b.listing_date || null,
    c.req.param('id'),
    userId
  ).first();

  if (!row) return c.json({ error: 'Property not found' }, 404);
  return c.json(parseProperty(row));
});

// UPDATE STATUS ONLY
properties.patch('/:id/status', async (c) => {
  const { status } = await body(c);
  const userId = c.get('userId');

  const row = await c.env.DB
    .prepare('UPDATE dashboard_properties SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? RETURNING *')
    .bind(status, c.req.param('id'), userId)
    .first();

  if (!row) return c.json({ error: 'Property not found' }, 404);
  return c.json(parseProperty(row));
});

// DELETE
properties.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const row = await c.env.DB
    .prepare('DELETE FROM dashboard_properties WHERE id = ? AND user_id = ? RETURNING id')
    .bind(c.req.param('id'), userId)
    .first();
  if (!row) return c.json({ error: 'Property not found' }, 404);
  return c.json({ message: 'Property deleted successfully' });
});

export default properties;
