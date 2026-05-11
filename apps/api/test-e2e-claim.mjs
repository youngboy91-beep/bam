// End-to-end smoke test for the claim flow.
// Generates a fresh EVM keypair, goes through anonymous-session -> nonce ->
// sign -> claim, then verifies /v1/session reports the linked handle.
//
// Run: node apps/api/test-e2e-claim.mjs
// Requires the API to be reachable at :8787.

import { keccak256 } from "ethereum-cryptography/keccak.js";
import { secp256k1 } from "ethereum-cryptography/secp256k1.js";
import {
  bytesToHex,
  hexToBytes,
  utf8ToBytes,
} from "ethereum-cryptography/utils.js";

const BASE = process.env.TL_API_BASE ?? "http://127.0.0.1:8787";

function deriveAddress(privKey) {
  const pub = secp256k1.getPublicKey(privKey, false); // 65 bytes
  const pubNoPrefix = pub.slice(1);
  const addr = keccak256(pubNoPrefix).slice(-20);
  return "0x" + bytesToHex(addr);
}

function personalSign(message, privKey) {
  const msgBytes = utf8ToBytes(message);
  const prefix = `\u0019Ethereum Signed Message:\n${msgBytes.length}`;
  const combined = new Uint8Array(prefix.length + msgBytes.length);
  combined.set(utf8ToBytes(prefix), 0);
  combined.set(msgBytes, prefix.length);
  const hash = keccak256(combined);
  const sig = secp256k1.sign(hash, privKey);
  const r = sig.r.toString(16).padStart(64, "0");
  const s = sig.s.toString(16).padStart(64, "0");
  const v = (sig.recovery + 27).toString(16).padStart(2, "0");
  return "0x" + r + s + v;
}

async function main() {
  // 1. Generate keypair
  const privKey = secp256k1.utils.randomPrivateKey();
  const address = deriveAddress(privKey);
  const handle = "e2e_test_user";
  const chain = "ethereum";

  console.log("1. Generated wallet:", address);

  // 2. Anonymous session
  const sessionRes = await fetch(`${BASE}/v1/session/anonymous`, {
    method: "POST",
  });
  const session = await sessionRes.json();
  console.log("2. Anonymous session:", session.plan, "exp", session.expires_in);

  // 3. Request nonce
  const nonceRes = await fetch(`${BASE}/v1/claim/nonce`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ handle, chain, address }),
  });
  const nonceData = await nonceRes.json();
  console.log("3. Nonce:", nonceData.nonce.slice(0, 16) + "...");
  console.log("   Message:", nonceData.message);

  // 4. Sign the canonical message
  const signature = personalSign(nonceData.message, privKey);
  console.log("4. Signature (64 chars):", signature.slice(0, 66) + "...");

  // 5. Submit claim
  const claimRes = await fetch(`${BASE}/v1/claim`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${session.session}`,
    },
    body: JSON.stringify({
      handle,
      chain,
      address,
      nonce: nonceData.nonce,
      message: nonceData.message,
      signature,
    }),
  });
  const claimData = await claimRes.json();
  console.log("5. Claim response:", claimData);
  if (!claimData.ok || claimData.tier !== "A") {
    throw new Error("Claim failed: " + JSON.stringify(claimData));
  }

  // 6. Verify session reports linked handle
  const snapRes = await fetch(`${BASE}/v1/session`, {
    headers: { authorization: `Bearer ${session.session}` },
  });
  const snap = await snapRes.json();
  console.log("6. Session snapshot after claim:", snap);
  if (snap.handle !== handle.toLowerCase() || snap.wallets_count < 1) {
    throw new Error("Session not updated: " + JSON.stringify(snap));
  }

  // 7. Replay same nonce -> must be rejected
  const replayRes = await fetch(`${BASE}/v1/claim`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${session.session}`,
    },
    body: JSON.stringify({
      handle,
      chain,
      address,
      nonce: nonceData.nonce,
      message: nonceData.message,
      signature,
    }),
  });
  if (replayRes.status !== 403) {
    throw new Error("Replay should be rejected, got " + replayRes.status);
  }
  console.log("7. Replay correctly rejected (403)");

  // 8. Tampered message -> rejected
  const nonceRes2 = await fetch(`${BASE}/v1/claim/nonce`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ handle, chain, address }),
  });
  const nonceData2 = await nonceRes2.json();
  const tamperedRes = await fetch(`${BASE}/v1/claim`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${session.session}`,
    },
    body: JSON.stringify({
      handle,
      chain,
      address,
      nonce: nonceData2.nonce,
      message: nonceData2.message + " TAMPERED",
      signature: personalSign(nonceData2.message + " TAMPERED", privKey),
    }),
  });
  if (tamperedRes.status !== 403) {
    throw new Error("Tampered message should be rejected, got " + tamperedRes.status);
  }
  console.log("8. Tampered message correctly rejected (403)");

  console.log("\n\u2713 All claim flow checks passed.");
}

main().catch((e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
