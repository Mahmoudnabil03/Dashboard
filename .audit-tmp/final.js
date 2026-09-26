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
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
  await page.goto(API + "/campaigns", { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
  await sleep(2000);
  await page.getByRole("button", { name: /new campaign/i }).first().click().catch(() => {});
  await sleep(1200);
  const info = await page.evaluate(() => {
    const ov = Array.from(document.querySelectorAll("div.fixed.inset-0")).pop();
    if (!ov) return { overlay: false };
    const panel = ov.firstElementChild;
    const cs = getComputedStyle(panel);
    const r = panel.getBoundingClientRect();
    const x = Array.from(panel.querySelectorAll("button")).find((b) => b.innerHTML.indexOf("lucide-x") > -1);
    const xr = x ? x.getBoundingClientRect() : { width: 0, height: 0 };
    return { overlay: true, panelBg: cs.backgroundColor, pw: Math.round(r.width), xFound: !!x, xw: Math.round(xr.width), xh: Math.round(xr.height) };
  });
  console.log("MODAL " + JSON.stringify(info));
  await page.evaluate(() => {
    const ov = Array.from(document.querySelectorAll("div.fixed.inset-0")).pop();
    const x = Array.from(ov.firstElementChild.querySelectorAll("button")).find((b) => b.innerHTML.indexOf("lucide-x") > -1);
    if (x) x.click();
  });
  await sleep(800);
  console.log("CLOSED_BY_X " + (await page.evaluate(() => document.body.textContent.indexOf("Campaign Name") === -1)));
  await page.getByRole("button", { name: /new campaign/i }).first().click().catch(() => {});
  await sleep(1000);
  await page.mouse.click(30, 450);
  await sleep(800);
  console.log("CLOSED_BY_BACKDROP " + (await page.evaluate(() => document.body.textContent.indexOf("Campaign Name") === -1)));
  console.log("ERRORS " + JSON.stringify(errs));
  await browser.close();
  console.log("DONE " + email);
}
main().catch((e) => { console.log("FATAL " + e.message); process.exit(1); });
