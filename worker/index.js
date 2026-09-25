import { Hono } from 'hono';
import { cors } from 'hono/cors';
import auth from './routes/auth.js';
import properties from './routes/properties.js';
import leads from './routes/leads.js';
import posts from './routes/posts.js';
import ai from './routes/ai.js';
import social from './routes/social.js';
import tracking from './routes/tracking.js';
import workspace from './routes/workspace.js';

const app = new Hono();

// CORS for the API (harmless same-origin; enables cross-origin dev clients).
app.use('/api/*', cors());

app.get('/api/health', (c) => c.json({ status: 'ok' }));

// Mount API route groups.
app.route('/api/auth', auth);
app.route('/api/properties', properties);
app.route('/api/leads', leads);
app.route('/api/posts', posts);
app.route('/api/ai', ai);
app.route('/api/social', social);
app.route('/api/tracking', tracking);
app.route('/api/workspace', workspace);

// Unknown API path -> JSON 404 (so it never falls through to the SPA).
app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message || 'Something went wrong!' }, 500);
});

// Everything else: serve static assets, with SPA fallback to index.html
// (configured via assets.not_found_handling in wrangler.jsonc).
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
