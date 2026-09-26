import { Hono } from "hono";
import { cors } from "hono/cors";
import auth from "./routes/auth.js";
import properties from "./routes/properties.js";
import leads from "./routes/leads.js";
import posts from "./routes/posts.js";
import ai from "./routes/ai.js";
import social from "./routes/social.js";
import tracking from "./routes/tracking.js";
import workspace from "./routes/workspace.js";
import websites from "./routes/websites.js";
import campaigns from "./routes/campaigns.js";
import content from "./routes/content.js";
import billing from "./routes/billing.js";
import reports from "./routes/reports.js";
import { createLogger } from "./lib.js";

const app = new Hono();

// Structured request logging (LOG_LEVEL=silent|error|info|debug).
app.use("*", async (c, next) => {
  const log = createLogger(c.env);
  const runId = crypto.randomUUID().slice(0, 8);
  c.set("runId", runId);
  c.set("log", log);
  const t0 = Date.now();
  log.info("start", { run_id: runId, method: c.req.method, path: c.req.path });
  try {
    await next();
    log.info("end", { run_id: runId, status: c.res.status, ms: Date.now() - t0 });
  } catch (err) {
    log.error("error", { run_id: runId, ms: Date.now() - t0, message: String((err && err.message) || err) });
    throw err;
  }
});

// Security headers on every response.
const SEC_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};
app.use("*", async (c, next) => {
  await next();
  for (const k of Object.keys(SEC_HEADERS)) c.header(k, SEC_HEADERS[k]);
});

// Restricted CORS (same-origin SPA plus local dev).
app.use("/api/*", cors({ origin: ["https://dashboard.mahmoudnabil03.workers.dev", "http://localhost:3000", "http://localhost:8787"], allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], allowHeaders: ["Content-Type", "Authorization"], maxAge: 86400 }));

app.get("/api/health", (c) => c.json({ status: "ok" }));

// Mount API route groups.
app.route("/api/auth", auth);
app.route("/api/properties", properties);
app.route("/api/leads", leads);
app.route("/api/posts", posts);
app.route("/api/ai", ai);
app.route("/api/social", social);
app.route("/api/tracking", tracking);
app.route("/api/workspace", workspace);
app.route("/api/websites", websites);
app.route("/api/campaigns", campaigns);
app.route("/api/content", content);
app.route("/api/subscription", billing);
app.route("/api/invoices", billing);
app.route("/api/payment-methods", billing);
app.route("/api/reports", reports);

// Unknown API path -> JSON 404 (so it never falls through to the SPA).
app.all("/api/*", (c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  try { c.get("log").error("unhandled", { message: String((err && err.message) || err) }); } catch {}
  return c.json({ error: err.message || "Something went wrong!" }, 500);
});

// Everything else: serve static assets, with SPA fallback to index.html
// (configured via assets.not_found_handling in wrangler.jsonc).
// Security headers are applied explicitly here because the ASSETS
// passthrough response is not mutable via context headers.
app.all("*", async (c) => {
  const res = await c.env.ASSETS.fetch(c.req.raw);
  const out = new Response(res.body, res);
  for (const k of Object.keys(SEC_HEADERS)) out.headers.set(k, SEC_HEADERS[k]);
  return out;
});

export default app;
