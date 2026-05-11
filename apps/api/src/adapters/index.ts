// Adapter interfaces. Kept minimal and explicit: each method corresponds
// to a need the scoring pipeline has, nothing more. Concrete impls go into
// sibling files once real credentials exist.
//
// All methods return promises and may throw on upstream errors. The
// scoring layer treats failures as "insufficient data" and never fabricates.

import type { Chain } from "@truthlayer/shared";

// -- Chain adapter ----------------------------------------------------------

export interface WalletBalance {
  token: string; // symbol
  tokenAddress: string;
  amountUsd: number;
  amountRaw: string;
}

export interface WalletTx {
  hash: string;
  timestampSec: number;
  side: "buy" | "sell" | "transfer";
  token: string;
  amountUsd: number;
  counterparty: string;
}

export interface ChainAdapter {
  chain: Chain;
  getBalance(address: string, tokenAddress: string): Promise<WalletBalance | null>;
  getRecentTrades(address: string, sinceSec: number): Promise<WalletTx[]>;
}

// -- Price adapter ----------------------------------------------------------

export interface PriceFeedAdapter {
  spotUsd(tokenAddress: string, chain: Chain): Promise<number | null>;
  vwapUsd(
    tokenAddress: string,
    chain: Chain,
    atTimestampSec: number,
    windowSec: number,
  ): Promise<number | null>;
}

// -- Social adapter ---------------------------------------------------------

export interface SocialPost {
  id: string;
  createdAtSec: number;
  text: string;
  mentionedTickers: string[];
}

export interface SocialAdapter {
  recentPostsByHandle(handle: string, sinceSec: number): Promise<SocialPost[]>;
  verifyOAuthSession(oauthToken: string): Promise<{ handle: string } | null>;
}

// -- Risk adapter -----------------------------------------------------------

export interface TokenRiskReport {
  tokenAddress: string;
  chain: Chain;
  ageHours: number;
  top10HolderPctBp: number; // basis points, 0..10000
  lpLocked: boolean;
  mintAuthorityRetained: boolean;
  knownRug: boolean;
}

export interface RiskAdapter {
  reportForToken(tokenAddress: string, chain: Chain): Promise<TokenRiskReport | null>;
}

// -- Registry (constructed at startup, injected into scoring) ---------------

export interface AdapterRegistry {
  chain(chain: Chain): ChainAdapter | undefined;
  prices: PriceFeedAdapter;
  social: SocialAdapter;
  risk: RiskAdapter;
}
