const { chromium } = require("playwright-core");
const API = "https://dashboard.mahmoudnabil03.workers.dev";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function main() {
  const email = "audit-tmp-" + Date.now() + "@example.com";
  const reg = await fetch(API + "/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email, password: "AuditTmp123!@#", name: "AuditTmp" }) }).then((r) => r.json());
  if (!reg.token) { console.log("REGISTER_FAILED"); process.exit(1); }
  const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript((t) => { try { localStorage.setItem("token", t); } catch (e) {} }, reg.token);
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
  await page.goto(API + "/campaigns", { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
  await sleep(2000);
  await page.getByRole("button", { name: /new campaign/i }).first().click().catch(() => {});
  await sleep(1200);
  const info = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll("div")).filter((d) => d.textContent.indexOf("New Campaign") > -1 && d.textContent.indexOf("Campaign Name") > -1);
    const panel = all.length ? all[all.length - 1] : null;
    if (!panel) return { found: false };
    const cs = getComputedStyle(panel);
    const r = panel.getBoundingClientRect();
    const hasX = !!document.querySelector("button svg.lucide-x");
    return { found: true, bg: cs.backgroundColor, opacity: cs.opacity, z: cs.zIndex, pos: cs.position, w: Math.round(r.width), h: Math.round(r.height), hasX: hasX, bodyOverflow: getComputedStyle(document.body).overflow };
  });
  console.log("MODAL " + JSON.stringify(info));
  console.log("ERRORS " + JSON.stringify(errs));
  await browser.close();
  console.log("DONE " + email);
}
main().catch((e) => { console.log("FATAL " + e.message); process.exit(1); });
