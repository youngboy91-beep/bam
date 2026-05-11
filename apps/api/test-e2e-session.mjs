// End-to-end smoke for the extension's session path:
//  1. extension-equivalent: POST /v1/session/anonymous
//  2. extension-equivalent: GET /v1/session with Bearer -> snapshot anonymous
//  3. GET /v1/score with Bearer works (existing flow, unchanged)
//  4. 401 on missing bearer where required (no bearer -> anonymous snapshot is OK,
//     invalid bearer -> 401)
//
// Run: node apps/api/test-e2e-session.mjs

const BASE = process.env.TL_API_BASE ?? "http://127.0.0.1:8787";

async function main() {
  // 1. Mint anonymous session
  const sessRes = await fetch(`${BASE}/v1/session/anonymous`, { method: "POST" });
  const sess = await sessRes.json();
  if (!sess.session || sess.plan !== "anonymous") {
    throw new Error("Bad anonymous session: " + JSON.stringify(sess));
  }
  console.log("1. Anonymous session minted, expires in", sess.expires_in, "sec");

  // 2. Snapshot with valid bearer -> anonymous
  const snap = await (
    await fetch(`${BASE}/v1/session`, {
      headers: { authorization: `Bearer ${sess.session}` },
    })
  ).json();
  if (snap.plan !== "anonymous") {
    throw new Error("Snapshot should be anonymous: " + JSON.stringify(snap));
  }
  console.log("2. Snapshot:", snap);

  // 3. Score with bearer works
  const score = await (
    await fetch(`${BASE}/v1/score?handle=vitalik_research&ticker=ETH`, {
      headers: { authorization: `Bearer ${sess.session}` },
    })
  ).json();
  if (score.identity_tier !== "A") {
    throw new Error("Score broken: " + JSON.stringify(score));
  }
  console.log("3. Score fetched with bearer:", score.overlay_signal, score.identity_tier);

  // 4. Invalid bearer -> 401
  const badRes = await fetch(`${BASE}/v1/session`, {
    headers: { authorization: "Bearer this-is-not-a-jwt" },
  });
  if (badRes.status !== 401) {
    throw new Error("Expected 401 on bad bearer, got " + badRes.status);
  }
  console.log("4. Invalid bearer correctly 401");

  console.log("\n\u2713 Session / extension path all green.");
}

main().catch((e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
