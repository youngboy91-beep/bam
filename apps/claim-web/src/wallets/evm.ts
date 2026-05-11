// EVM wallet integration via EIP-1193 injected provider.
//
// Deliberately avoids a heavy wagmi/viem/ethers dependency. We only need:
//   1. requestAccounts  — get the user's selected address
//   2. personal_sign    — sign the canonical TruthLayer message
//
// Both are part of the standard injected-provider contract (MetaMask,
// Rabby, Rainbow, Coinbase Wallet, Frame, OKX Wallet, etc.).

export type EvmConnectResult =
  | { ok: true; address: string }
  | { ok: false; reason: "no_provider" | "rejected" | "unknown"; detail?: string };

export async function connectEvm(): Promise<EvmConnectResult> {
  if (typeof window === "undefined" || !window.ethereum) {
    return { ok: false, reason: "no_provider" };
  }
  try {
    const accounts = (await window.ethereum.request({
      method: "eth_requestAccounts",
    })) as string[];
    if (!accounts?.[0]) return { ok: false, reason: "rejected" };
    return { ok: true, address: accounts[0].toLowerCase() };
  } catch (e) {
    const err = e as { code?: number; message?: string };
    if (err.code === 4001) return { ok: false, reason: "rejected" };
    return { ok: false, reason: "unknown", detail: err.message ?? String(e) };
  }
}

export type EvmSignResult =
  | { ok: true; signature: string }
  | { ok: false; reason: "no_provider" | "rejected" | "unknown"; detail?: string };

export async function signEvmMessage(
  address: string,
  message: string,
): Promise<EvmSignResult> {
  if (typeof window === "undefined" || !window.ethereum) {
    return { ok: false, reason: "no_provider" };
  }
  try {
    const sig = (await window.ethereum.request({
      method: "personal_sign",
      // MetaMask expects [message, address]; most other wallets accept both
      // orderings. This is the canonical order from EIP-1193 spec.
      params: [message, address],
    })) as string;
    if (!sig || !sig.startsWith("0x")) {
      return { ok: false, reason: "unknown", detail: "invalid signature shape" };
    }
    return { ok: true, signature: sig };
  } catch (e) {
    const err = e as { code?: number; message?: string };
    if (err.code === 4001) return { ok: false, reason: "rejected" };
    return { ok: false, reason: "unknown", detail: err.message ?? String(e) };
  }
}
