const { chromium } = require("playwright-core");
const API = "https://dashboard.mahmoudnabil03.workers.dev";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function main() {
  const email = "audit-tmp-" + Date.now() + "@example.com";
  const reg = await fetch(API + "/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email, password: "AuditTmp123!@#", name: "AuditTmp" }) }).then((r) => r.json());
  const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const out = [];
  for (const vp of [{ name: "mobile", width: 390, height: 844 }, { name: "desktop", width: 1440, height: 900 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    for (const route of ["/login", "/verify", "/forgot-password", "/reset-password", "/terms"]) {
      const page = await ctx.newPage();
      const errs = [];
      page.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
      await page.goto(API + route, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
      await sleep(1800);
      const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: window.innerWidth, h1: ((document.querySelector("h1") || {}).textContent || "").slice(0, 40) }));
      out.push(vp.name + " " + route + " overflow=" + (m.sw > m.vw + 1) + " h1=" + m.h1 + " errors=" + JSON.stringify(errs));
      await page.close();
    }
    await ctx.addInitScript((t) => { try { localStorage.setItem("token", t); } catch (e) {} }, "x");
    await ctx.close();
  }
  await browser.close();
  console.log(out.join("\n"));
  console.log("DONE " + email);
}
main().catch((e) => { console.log("FATAL " + e.message); process.exit(1); });
