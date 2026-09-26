import { Hono } from "hono";
import { authMiddleware, body } from "../lib.js";
const reports = new Hono();
reports.use("*", authMiddleware);
async function getWorkspaceId(c, userId) {
  const w = await c.env.DB.prepare("SELECT w.id FROM dashboard_workspaces w JOIN dashboard_workspace_members wm ON w.id = wm.workspace_id WHERE wm.user_id = ? LIMIT 1").bind(userId).first();
  return w ? w.id : null;
}
reports.get("/", async (c) => {
  const wid = await getWorkspaceId(c, c.get("userId"));
  if (!wid) return c.json([]);
  const r = await c.env.DB.prepare("SELECT * FROM dashboard_reports WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 100").bind(wid).all();
  return c.json(r.results || []);
});
reports.post("/", async (c) => {
  const wid = await getWorkspaceId(c, c.get("userId"));
  if (!wid) return c.json({ error: "Workspace not found" }, 404);
  const b = await body(c);
  const row = await c.env.DB.prepare("INSERT INTO dashboard_reports (workspace_id, type, name, date_range_start, date_range_end, platforms, metrics, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *").bind(wid, b.type || "social-performance", b.name || b.type || "Report", b.date_range_start || null, b.date_range_end || null, JSON.stringify(b.platforms || ["all"]), JSON.stringify(b.metrics || {}), "completed").first();
  return c.json(row, 201);
});
reports.delete("/:id", async (c) => {
  const wid = await getWorkspaceId(c, c.get("userId"));
  if (!wid) return c.json({ error: "Workspace not found" }, 404);
  const row = await c.env.DB.prepare("DELETE FROM dashboard_reports WHERE id = ? AND workspace_id = ? RETURNING id").bind(c.req.param("id"), wid).first();
  if (!row) return c.json({ error: "Report not found" }, 404);
  return c.json({ message: "Report deleted" });
});
export default reports;
