import { Hono } from "hono";
import { authMiddleware, body } from "../lib.js";
const billing = new Hono();
billing.use("*", authMiddleware);
async function getWorkspaceId(c, userId) {
  const w = await c.env.DB.prepare("SELECT w.id FROM dashboard_workspaces w JOIN dashboard_workspace_members wm ON w.id = wm.workspace_id WHERE wm.user_id = ? LIMIT 1").bind(userId).first();
  return w ? w.id : null;
}
billing.get("/subscription", async (c) => {
  const wid = await getWorkspaceId(c, c.get("userId"));
  if (!wid) return c.json({ plan: "free", status: "inactive" });
  let sub = await c.env.DB.prepare("SELECT * FROM dashboard_subscriptions WHERE workspace_id = ?").bind(wid).first();
  if (!sub) {
    sub = await c.env.DB.prepare("INSERT INTO dashboard_subscriptions (workspace_id, plan, status) VALUES (?, ?, ?) RETURNING *").bind(wid, "free", "active").first();
  }
  return c.json(sub);
});
billing.post("/subscription/subscribe", async (c) => {
  const wid = await getWorkspaceId(c, c.get("userId"));
  if (!wid) return c.json({ error: "Workspace not found" }, 404);
  const b = await body(c);
  const plan = ["free", "pro", "enterprise"].includes(b.plan) ? b.plan : "pro";
  await c.env.DB.prepare("INSERT INTO dashboard_subscriptions (workspace_id, plan, status) VALUES (?, ?, ?) ON CONFLICT(workspace_id) DO UPDATE SET plan = excluded.plan, status = excluded.status, updated_at = CURRENT_TIMESTAMP").bind(wid, plan, "active").run().catch(async () => {
    await c.env.DB.prepare("UPDATE dashboard_subscriptions SET plan = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE workspace_id = ?").bind(plan, "active", wid).run();
  });
  const row = await c.env.DB.prepare("SELECT * FROM dashboard_subscriptions WHERE workspace_id = ?").bind(wid).first();
  return c.json(row);
});
billing.post("/subscription/cancel", async (c) => {
  const wid = await getWorkspaceId(c, c.get("userId"));
  if (!wid) return c.json({ error: "Workspace not found" }, 404);
  await c.env.DB.prepare("UPDATE dashboard_subscriptions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE workspace_id = ?").bind("canceled", wid).run();
  const row = await c.env.DB.prepare("SELECT * FROM dashboard_subscriptions WHERE workspace_id = ?").bind(wid).first();
  return c.json(row);
});
billing.get("/invoices", async (c) => {
  const wid = await getWorkspaceId(c, c.get("userId"));
  if (!wid) return c.json([]);
  const r = await c.env.DB.prepare("SELECT * FROM dashboard_invoices WHERE workspace_id = ? ORDER BY created_at DESC").bind(wid).all().catch(() => ({ results: [] }));
  return c.json(r.results || []);
});
billing.get("/payment-methods", async (c) => {
  return c.json([]);
});
export default billing;
