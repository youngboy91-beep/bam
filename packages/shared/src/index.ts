// Contract between the extension and the TruthLayer API.
// Mirrors docs/scoring.md section 6. Any change here must bump SCORING_VERSION
// and be reflected in docs/scoring.md + .kiro/steering/scoring.md.

export const SCORING_VERSION = "1.0.0";

export type Chain =
  | "ethereum"
  | "solana"
  | "base"
  | "arbitrum"
  | "bnb"
  | "ton";

export type IdentityTier = "A" | "B" | "B+" | "C";

export type UiFlag = "green" | "neutral" | "yellow" | "red" | "insufficient";

export type OverlaySignal = "clean" | "caution" | "risk" | "unknown";

export interface WalletLink {
  chain: Chain;
  address: string;
  tier: IdentityTier;
  /** Only present for B+ tier. 0..1, rounded down for display. */
  confidence?: number;
}

export interface HoldsMetric {
  status: "yes" | "no" | "insufficient";
  amount_usd?: number;
  time_to_tweet_hours?: number;
  ui_flag: UiFlag;
}

export interface ShillHistoryMetric {
  calls_30d: number;
  unique_tickers_30d: number;
  serial_caller: boolean;
  ui_flag: UiFlag;
}

export interface PnlMetric {
  /** Mean of 7d PnL across valid calls. Null if insufficient data. */
  avg_pnl_7d: number | null;
  median_pnl_7d: number | null;
  calls_that_worked: number;
  total_calls: number;
  ui_flag: UiFlag;
}

export interface TokenSignals {
  age_hours: number;
  top10_pct: number | null;
  lp_status: "locked" | "unlocked" | "unknown";
  mint_authority: string | null;
}

export interface ScoreResponse {
  handle: string;
  identity_tier: IdentityTier;
  identity_confidence?: number;
  wallets: WalletLink[];
  overlay_signal: OverlaySignal;
  metrics: {
    holds: HoldsMetric;
    shill_history: ShillHistoryMetric;
    pnl: PnlMetric;
  };
  token_signals: TokenSignals;
  explanation: string;
  sources: string[];
  computed_at: string;
  insufficient_data_fields: string[];
  scoring_version: string;
}

export interface ScoreRequest {
  handle: string;
  ticker?: string;
  tweet_id?: string;
}
