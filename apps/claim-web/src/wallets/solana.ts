// Solana wallet integration via Phantom-compatible injected provider.
// Works with Phantom, Backpack, Solflare, and any wallet that exposes
// window.solana with the de-facto standard interface.
//
// Signature is Ed25519 over UTF-8 bytes of the message, returned as
// base58 (server expects base58 in SIWS).

import bs58 from "bs58";

export type SolConnectResult =
  | { ok: true; address: string }
  | { ok: false; reason: "no_provider" | "rejected" | "unknown"; detail?: string };

export async function connectSolana(): Promise<SolConnectResult> {
  if (typeof window === "undefined" || !window.solana) {
    return { ok: false, reason: "no_provider" };
  }
  try {
    const resp = await window.solana.connect();
    const pk = resp.publicKey.toString();
    if (!pk) return { ok: false, reason: "rejected" };
    return { ok: true, address: pk };
  } catch (e) {
    const err = e as { code?: number; message?: string };
    return { ok: false, reason: "rejected", detail: err.message ?? String(e) };
  }
}

export type SolSignResult =
  | { ok: true; signature: string }
  | { ok: false; reason: "no_provider" | "rejected" | "unknown"; detail?: string };

export async function signSolanaMessage(
  message: string,
): Promise<SolSignResult> {
  if (typeof window === "undefined" || !window.solana) {
    return { ok: false, reason: "no_provider" };
  }
  try {
    const encoded = new TextEncoder().encode(message);
    const resp = await window.solana.signMessage(encoded, "utf8");
    const sig = bs58.encode(resp.signature);
    return { ok: true, signature: sig };
  } catch (e) {
    const err = e as { code?: number; message?: string };
    return { ok: false, reason: "rejected", detail: err.message ?? String(e) };
  }
}
