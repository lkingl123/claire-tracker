// Sanity check against a running deployment. READ-ONLY: never logs or deletes a nap.
//   npm run test:sanity                         -> checks prod (claire-tracker.vercel.app)
//   BASE=http://localhost:3000 npm run test:sanity
const BASE = (process.env.BASE || "https://claire-tracker.vercel.app").replace(/\/$/, "");

let failed = 0;
async function check(name, fn) {
  try {
    await fn();
    console.log(`  ok   ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL ${name}\n       ${e.message}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
const speak = (q) =>
  fetch(`${BASE}/api/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q }),
  });

console.log(`Sanity check: ${BASE}\n`);

await check("home page loads", async () => {
  const res = await fetch(BASE);
  assert(res.status === 200, `status ${res.status}`);
  const html = await res.text();
  assert(html.includes("Nap tracker for Claire"), "page description is not the nap tracker");
});

await check("/api/status returns today's naps", async () => {
  const res = await fetch(`${BASE}/api/status`);
  assert(res.status === 200, `status ${res.status}`);
  const j = await res.json();
  assert(typeof j.today?.napCount === "number", `bad shape: ${JSON.stringify(j)}`);
  assert(typeof j.today?.totalMinutes === "number", `bad shape: ${JSON.stringify(j)}`);
});

await check("Siri 'status' answers in plain text", async () => {
  const res = await speak("status");
  assert(res.status === 200, `status ${res.status}`);
  assert(res.headers.get("content-type")?.includes("text/plain"), "not text/plain");
  const t = await res.text();
  assert(/nap/i.test(t), `unexpected reply: ${t}`);
});

await check("Siri 'nap' with no minutes asks (and logs nothing)", async () => {
  const t = await (await speak("nap")).text();
  assert(/How long/.test(t), `unexpected reply: ${t}`);
});

await check("Alexa launch responds", async () => {
  const res = await fetch(`${BASE}/api/alexa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request: { type: "LaunchRequest" } }),
  });
  const j = await res.json();
  assert(typeof j.response?.outputSpeech?.text === "string", `bad response: ${JSON.stringify(j)}`);
});

await check("old feeding endpoints are gone", async () => {
  const res = await fetch(`${BASE}/api/cron/feed-check`);
  assert(res.status === 404, `feed-check returned ${res.status}`);
});

console.log(failed ? `\n${failed} check(s) failed` : "\nAll sanity checks passed");
process.exit(failed ? 1 : 0);
