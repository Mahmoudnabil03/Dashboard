const p = require("@babel/parser");
const fs = require("fs");
const line = fs.readFileSync("src/pages/Campaigns.js", "utf8").split("\n")[212].trim();
const tests = {
  full: "function T() { return (" + line + "x</div>); }",
  noOnClick: "function T() { return (<div className=\"a\">x</div>); }",
  simpleArrow: "function T() { return (<div onClick={(e) => foo()}>x</div>); }",
  ifArrow: "function T() { return (<div onClick={(e) => { if (a) { foo(); } } }>x</div>); }"
};
for (const k of Object.keys(tests)) {
  try { p.parse(tests[k], { sourceType: "module", plugins: ["jsx"] }); console.log(k + ": OK"); }
  catch (e) { console.log(k + ": FAIL " + e.message.split("\n")[0]); }
}
