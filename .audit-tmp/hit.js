const { chromium } = require("playwright-core");
const API = "https://dashboard.mahmoudnabil03.workers.dev";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function main() {
  const email = "audit-tmp-" + Date.now() + "@example.com";
  const reg = await fetch(API + "/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email, password: "AuditTmp123!@#", name: "AuditTmp" }) }).then((r) => r.json());
  const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript((t) => { try { localStorage.setItem("token", t); } catch (e) {} }, reg.token);
  const page = await ctx.newPage();
  await page.goto(API + "/campaigns", { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
  await sleep(2000);
  await page.getByRole("button", { name: /new campaign/i }).first().click().catch(() => {});
  await sleep(1200);
  const info = await page.evaluate(() => {
    const el = document.elementFromPoint(30, 450);
    const path = [];
    let n = el;
    for (let i = 0; i < 5 && n; i++) { path.push(n.tagName + "." + (typeof n.className === "string" ? n.className.split(" ").slice(0, 3).join(".") : "")); n = n.parentElement; }
    const ov = Array.from(document.querySelectorAll("div.fixed.inset-0")).pop();
    const ovr = ov.getBoundingClientRect();
    return { topEl: path, overlayRect: { x: Math.round(ovr.x), y: Math.round(ovr.y), w: Math.round(ovr.width), h: Math.round(ovr.height) }, overlayZ: getComputedStyle(ov).zIndex };
  });
  console.log("HITTEST " + JSON.stringify(info));
  await browser.close();
  console.log("DONE " + email);
}
main().catch((e) => { console.log("FATAL " + e.message); process.exit(1); });
