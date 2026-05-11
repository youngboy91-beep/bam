// Seed the in-memory identity graph with a few canonical A-tier claims
// so a fresh API restart comes up with something to show. Uses real
// cryptographic signatures against server-issued nonces — no backdoor.
//
// Run:   node apps/api/scripts/seed-identities.mjs
// Assumes the API is reachable at :8787 (override with TL_API_BASE).

import { keccak256 } from "ethereum-cryptography/keccak.js";
import { secp256k1 } from "ethereum-cryptography/secp256k1.js";
import { bytesToHex, utf8ToBytes } from "ethereum-cryptography/utils.js";

const BASE = process.env.TL_API_BASE ?? "http://127.0.0.1:8787";

const HANDLES = [
  "demo_trader_1",
  "demo_builder_1",
  "demo_researcher_1",
];

function derive(privKey) {
  const pub = secp256k1.getPublicKey(privKey, false).slice(1);
  return "0x" + bytesToHex(keccak256(pub).slice(-20));
}

function personalSign(message, privKey) {
  const msg = utf8ToBytes(message);
  const prefix = `\u0019Ethereum Signed Message:\n${msg.length}`;
  const combined = new Uint8Array(prefix.length + msg.length);
  combined.set(utf8ToBytes(prefix), 0);
  combined.set(msg, prefix.length);
  const hash = keccak256(combined);
  const sig = secp256k1.sign(hash, privKey);
  return (
    "0x" +
    sig.r.toString(16).padStart(64, "0") +
    sig.s.toString(16).padStart(64, "0") +
    (sig.recovery + 27).toString(16).padStart(2, "0")
  );
}

async function claimOne(handle) {
  const privKey = secp256k1.utils.randomPrivateKey();
  const address = derive(privKey);

  const session = await (
    await fetch(`${BASE}/v1/session/anonymous`, { method: "POST" })
  ).json();

  const nonce = await (
    await fetch(`${BASE}/v1/claim/nonce`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle, chain: "ethereum", address }),
    })
  ).json();

  const signature = personalSign(nonce.message, privKey);

  const res = await (
    await fetch(`${BASE}/v1/claim`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.session}`,
      },
      body: JSON.stringify({
        handle,
        chain: "ethereum",
        address,
        nonce: nonce.nonce,
        message: nonce.message,
        signature,
      }),
    })
  ).json();

  if (!res.ok) throw new Error(`claim failed for @${handle}: ${JSON.stringify(res)}`);
  console.log(`\u2713 @${handle} -> ${address} (A-tier)`);
}

async function main() {
  console.log("Seeding A-tier identities against", BASE);
  for (const h of HANDLES) {
    await claimOne(h);
  }
  console.log("\nDone. Try any of these handles in /v1/score:");
  console.log(HANDLES.map((h) => `  ${h}`).join("\n"));
}

main().catch((e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
