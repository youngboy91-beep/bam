// Solana signature verification for the claim flow.
//
// Solana wallets sign a message using Ed25519. The public key IS the
// address (after base58 encoding). Verification is direct: check that
// signature(message, pubkey) holds.
//
// "SIWS" = Sign-In-With-Solana, the informal parallel to EIP-4361.

import { ed25519 } from "@noble/curves/ed25519";
import { utf8ToBytes } from "@noble/hashes/utils";
import bs58 from "bs58";

export type SiwsResult = { ok: true } | { ok: false; reason: "bad_format" | "address_mismatch" };

export function verifySiws(params: {
  message: string;
  signature: string; // base58-encoded
  expectedAddress: string; // base58-encoded pubkey
}): SiwsResult {
  let sigBytes: Uint8Array;
  let pubBytes: Uint8Array;
  try {
    sigBytes = bs58.decode(params.signature);
    pubBytes = bs58.decode(params.expectedAddress);
  } catch {
    return { ok: false, reason: "bad_format" };
  }
  if (sigBytes.length !== 64) return { ok: false, reason: "bad_format" };
  if (pubBytes.length !== 32) return { ok: false, reason: "bad_format" };

  try {
    const ok = ed25519.verify(sigBytes, utf8ToBytes(params.message), pubBytes);
    return ok ? { ok: true } : { ok: false, reason: "address_mismatch" };
  } catch {
    return { ok: false, reason: "bad_format" };
  }
}
