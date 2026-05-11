/// <reference types="vite/client" />

declare const __API_BASE__: string;

// Minimal shapes for wallet injected globals. We keep these loose on
// purpose — we only use a tiny subset of the API and do not want to adopt
// the whole wallet-standard typing surface.
interface EthereumProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  isMetaMask?: boolean;
}
interface SolanaProvider {
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
  signMessage(
    message: Uint8Array,
    encoding?: "utf8",
  ): Promise<{ signature: Uint8Array }>;
  isPhantom?: boolean;
  publicKey?: { toString(): string };
}

interface Window {
  ethereum?: EthereumProvider;
  solana?: SolanaProvider;
}
