// Contract between the consumer extension and the TruthLayer public API.
//
// Invariants enforced here (see .kiro/steering/scoring.md):
//
//   1. The consumer response NEVER carries raw numeric signal values
//      (confidence decimals, raw component weights, threshold-adjacent
//      fields). Every user-facing string is pre-rendered server-side.
//   2. The client renders what the server returned. It does not apply any
//      thresholds, cutoffs, or time-based bucketing. If a display string is
//      missing, the client renders "insufficient data".
//   3. Raw signal values are available ONLY on the partner API under a
//      contractual scope. That contract lives in a separate types package
//      that is not shipped to the consumer extension.
//
// Changing any user-facing field here bumps SCORING_VERSION.

export const SCORING_VERSION = "1.0.0";

export type Chain =
  | "ethereum"
  | "solana"
  | "base"
  | "arbitrum"
  | "bnb"
  | "ton";

export type IdentityTier = "A" | "B" | "B+" | "C";

/** UI flag is the ONLY signal-class hint the client sees. */
export type UiFlag = "green" | "neutral" | "yellow" | "red" | "insufficient";

export type OverlaySignal = "clean" | "caution" | "risk" | "unknown";

export interface WalletLink {
  chain: Chain;
  /** Full address; for display the client truncates it. */
  address: string;
  tier: IdentityTier;
  // NO confidence field. Partner API surfaces raw confidence under contract.
}

/** One generic display cell the client renders verbatim. */
export interface MetricCell {
  ui_flag: UiFlag;
  /** Main display line. Pre-formatted by server. */
  display: string;
  /** Secondary line (e.g. "entered hours before tweet"). Pre-formatted. */
  display_sub?: string;
}

export interface ScoreResponse {
  handle: string;
  identity_tier: IdentityTier;
  /**
   * Cohort-relative rank label, pre-rendered server-side.
   * Example: "top quintile, trader cohort". Null for A / C / unknown tiers
   * where a rank is not meaningful.
   */
  identity_rank_label: string | null;
  wallets: WalletLink[];
  overlay_signal: OverlaySignal;
  metrics: {
    holds: MetricCell;
    shill_history: MetricCell;
    pnl: MetricCell;
  };
  token_signals: MetricCell;
  /** One-line human explanation rendered as-is. */
  explanation: string;
  /** Data-provider names for the attribution row. No internal feature names. */
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
