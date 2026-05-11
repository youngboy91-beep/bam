// Build deterministic external links for a wallet / token / handle.
// All URL templates are local — we never fetch them from the API (see
// .kiro/steering/release.md: links are build-time constants to prevent
// a compromised API from redirecting users).

import type { Chain, WalletLink } from "@truthlayer/shared";

export interface ExternalLink {
  label: string;       // "Etherscan"
  hint: string;        // shown in tooltip / aria-label
  href: string;
  icon: string;        // single emoji/unicode or short text; we don't ship vendor logos
  group: "wallet" | "token" | "social";
}

/** Wallet links per chain. */
export function walletLinks(wallet: WalletLink): ExternalLink[] {
  const addr = wallet.address;
  switch (wallet.chain) {
    case "ethereum":
      return [
        { label: "Etherscan", hint: "Address history on Ethereum", icon: "E",
          href: `https://etherscan.io/address/${addr}`, group: "wallet" },
        { label: "DeBank", hint: "Portfolio across chains", icon: "D",
          href: `https://debank.com/profile/${addr}`, group: "wallet" },
        { label: "Arkham", hint: "Entity lookup", icon: "A",
          href: `https://platform.arkhamintelligence.com/explorer/address/${addr}`, group: "wallet" },
        { label: "Zapper", hint: "DeFi positions", icon: "Z",
          href: `https://zapper.xyz/account/${addr}`, group: "wallet" },
      ];
    case "base":
      return [
        { label: "Basescan", hint: "Address history on Base", icon: "B",
          href: `https://basescan.org/address/${addr}`, group: "wallet" },
        { label: "DeBank", hint: "Portfolio across chains", icon: "D",
          href: `https://debank.com/profile/${addr}`, group: "wallet" },
      ];
    case "arbitrum":
      return [
        { label: "Arbiscan", hint: "Address history on Arbitrum", icon: "A",
          href: `https://arbiscan.io/address/${addr}`, group: "wallet" },
        { label: "DeBank", hint: "Portfolio across chains", icon: "D",
          href: `https://debank.com/profile/${addr}`, group: "wallet" },
      ];
    case "bnb":
      return [
        { label: "BscScan", hint: "Address history on BNB Chain", icon: "B",
          href: `https://bscscan.com/address/${addr}`, group: "wallet" },
        { label: "DeBank", hint: "Portfolio across chains", icon: "D",
          href: `https://debank.com/profile/${addr}`, group: "wallet" },
      ];
    case "solana":
      return [
        { label: "Solscan", hint: "Address history on Solana", icon: "S",
          href: `https://solscan.io/account/${addr}`, group: "wallet" },
        { label: "Birdeye", hint: "Token activity", icon: "B",
          href: `https://birdeye.so/profile/${addr}?chain=solana`, group: "wallet" },
        { label: "RugCheck", hint: "Scam / risk heuristics", icon: "R",
          href: `https://rugcheck.xyz/tokens/${addr}`, group: "wallet" },
      ];
    case "ton":
      return [
        { label: "Tonviewer", hint: "Address history on TON", icon: "T",
          href: `https://tonviewer.com/${addr}`, group: "wallet" },
      ];
    default:
      return [];
  }
}

/** Token links when a $TICKER is mentioned. Takes plain ticker text. */
export function tokenLinks(ticker: string, chain?: Chain): ExternalLink[] {
  const q = encodeURIComponent(ticker);
  const links: ExternalLink[] = [
    { label: "DEXScreener", hint: `Search ${ticker} on DEXScreener`, icon: "\u2197",
      href: `https://dexscreener.com/search?q=${q}`, group: "token" },
    { label: "GeckoTerminal", hint: `Search ${ticker} on GeckoTerminal`, icon: "\u2197",
      href: `https://www.geckoterminal.com/search?q=${q}`, group: "token" },
  ];
  if (chain === "solana") {
    links.push({
      label: "Birdeye", hint: `${ticker} on Birdeye (Solana)`, icon: "\u2197",
      href: `https://birdeye.so/find?q=${q}&chain=solana`, group: "token",
    });
  }
  return links;
}

/** Social links. Always includes the author's X profile. */
export function socialLinks(handle: string): ExternalLink[] {
  return [
    { label: "X profile", hint: `Open @${handle} on X`, icon: "@",
      href: `https://x.com/${handle}`, group: "social" },
  ];
}
