// EVM signature verification for the claim flow.
//
// The user signs the canonical TruthLayer message (buildClaimMessage in
// @truthlayer/shared) with their wallet private key. The signature is a
// standard personal_sign over the UTF-8 bytes of that message prefixed with
// the Ethereum signed-message preamble, per EIP-191.
//
// We verify by recovering the signer's address from the signature and
// comparing it to the claimed address (lowercased).
//
// For smart-contract wallets (EIP-1271) we return "needs_challenge" so the
// caller can handle the delayed-verification path described in
// .kiro/steering/abuse.md (not implemented in this scaffold).

import { keccak256 } from "ethereum-cryptography/keccak";
import { secp256k1 } from "ethereum-cryptography/secp256k1";
import { utf8ToBytes, bytesToHex, hexToBytes } from "ethereum-cryptography/utils";

export type SiweResult =
  | { ok: true }
  | { ok: false; reason: "bad_format" | "address_mismatch" | "needs_challenge" };

function toEthSignedMessageBytes(message: string): Uint8Array {
  const msgBytes = utf8ToBytes(message);
  const prefix = `\u0019Ethereum Signed Message:\n${msgBytes.length}`;
  const prefixBytes = utf8ToBytes(prefix);
  const combined = new Uint8Array(prefixBytes.length + msgBytes.length);
  combined.set(prefixBytes, 0);
  combined.set(msgBytes, prefixBytes.length);
  return combined;
}

/**
 * Recovers the Ethereum address from a personal_sign-style signature.
 * Returns lowercase address "0x..." or null if the signature cannot be
 * parsed into a valid recovery.
 */
function recoverAddress(message: string, signatureHex: string): string | null {
  let sig = signatureHex.trim();
  if (sig.startsWith("0x") || sig.startsWith("0X")) sig = sig.slice(2);
  if (sig.length !== 130) return null; // 64 bytes r+s + 1 byte v
  const r = sig.slice(0, 64);
  const s = sig.slice(64, 128);
  const vHex = sig.slice(128, 130);
  let v = parseInt(vHex, 16);
  if (v >= 27) v -= 27;
  if (v !== 0 && v !== 1) return null;

  const sigBytes = hexToBytes(r + s);
  const msgHash = keccak256(toEthSignedMessageBytes(message));

  try {
    const sigObj = secp256k1.Signature.fromCompact(sigBytes).addRecoveryBit(v);
    const pub = sigObj.recoverPublicKey(msgHash).toRawBytes(false); // 65 bytes, 0x04 prefix
    const pubNoPrefix = pub.slice(1);
    const addrHash = keccak256(pubNoPrefix);
    const addr = addrHash.slice(-20);
    return "0x" + bytesToHex(addr).toLowerCase();
  } catch {
    return null;
  }
}

export function verifySiwe(params: {
  message: string;
  signature: string;
  expectedAddress: string;
}): SiweResult {
  // EOA signatures are exactly 65 bytes. Anything else is a smart-contract
  // wallet (EIP-1271) or malformed; treat as needs_challenge and let the
  // delayed-verification path handle it.
  const sig = params.signature.startsWith("0x")
    ? params.signature.slice(2)
    : params.signature;
  if (sig.length !== 130) return { ok: false, reason: "needs_challenge" };

  const recovered = recoverAddress(params.message, params.signature);
  if (!recovered) return { ok: false, reason: "bad_format" };

  if (recovered !== params.expectedAddress.toLowerCase()) {
    return { ok: false, reason: "address_mismatch" };
  }
  return { ok: true };
}
