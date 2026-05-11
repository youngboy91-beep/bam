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

// --------------------------------------------------------------------------
// Session
// --------------------------------------------------------------------------

export type Plan =
  | "anonymous"
  | "free"
  | "pro"
  | "partner_startup"
  | "partner_growth"
  | "partner_enterprise";

export interface AnonymousSessionResponse {
  /** Opaque JWT, carried in Authorization: Bearer. */
  session: string;
  plan: "anonymous";
  /** Seconds until the session token must be refreshed. */
  expires_in: number;
}

export interface SessionSnapshot {
  plan: Plan;
  /** Present once the user linked an X handle. */
  handle?: string;
  wallets_count?: number;
  /** Today's lookup count; nulls mean server has no usage data yet. */
  usage_today?: number;
  /** null means unlimited (Pro / Partner). */
  usage_limit?: number | null;
}

// --------------------------------------------------------------------------
// Claim flow (identity graph A-tier)
// --------------------------------------------------------------------------

/** Request a nonce for signing. One nonce per (handle, address) pair. */
export interface ClaimNonceRequest {
  handle: string;
  chain: Chain;
  address: string;
}

export interface ClaimNonceResponse {
  nonce: string;
  /** ISO8601 timestamp issued by the server; must be echoed back in the signed message. */
  issued_at: string;
  /** Seconds until the nonce expires and needs to be requested again. */
  expires_in: number;
  /** Exact string the user must sign. Built by the server so client-side drift can't desynchronize the check. */
  message: string;
}

/**
 * Submit a signed canonical message. The server verifies signature,
 * handle ownership (via the Twitter OAuth session attached to the JWT),
 * and nonce validity. On success the link becomes A-tier.
 */
export interface ClaimSubmitRequest {
  handle: string;
  chain: Chain;
  address: string;
  nonce: string;
  /** Exact message returned by /claim/nonce that the user signed. */
  message: string;
  /**
   * Hex signature (0x-prefixed for EVM; base58 for Solana). The server
   * decides how to verify based on `chain`.
   */
  signature: string;
}

export interface ClaimSubmitResponse {
  ok: true;
  tier: "A";
  handle: string;
  chain: Chain;
  address: string;
}

// --------------------------------------------------------------------------
// Canonical message format
// --------------------------------------------------------------------------

/**
 * The exact string the user signs. Both the API and any client that builds
 * the message MUST use this function to avoid "off-by-one" mismatches (a
 * single extra space would invalidate the signature).
 *
 * Deliberately stable across scoring versions.
 */
export function buildClaimMessage(params: {
  handle: string;
  chain: Chain;
  address: string;
  nonce: string;
  issuedAt: string; // ISO 8601
}): string {
  return (
    `TruthLayer claim: I am @${params.handle} on platform x. ` +
    `Address ${params.address}. ` +
    `Chain ${params.chain}. ` +
    `Nonce ${params.nonce}. ` +
    `Issued at ${params.issuedAt}.`
  );
}
