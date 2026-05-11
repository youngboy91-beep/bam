import {
  SCORING_VERSION,
  type ScoreRequest,
  type ScoreResponse,
} from "@truthlayer/shared";

// Mock fixtures for the three canonical scenarios. The real scoring pipeline
// will replace this module without changing the response shape.
//
// The server pre-renders every display string so the client never applies
// thresholds, formulas, or time-bucket logic locally. See scoring.md steering.

const FIXTURES: Record<string, ScoreResponse> = {
  vitalik_research: {
    handle: "vitalik_research",
    identity_tier: "A",
    identity_rank_label: null, // A-tier doesn't need a rank.
    wallets: [
      {
        chain: "ethereum",
        address: "0xd8dA6Bf26964aF9D7eEd9e03E53415D37aA96045",
        tier: "A",
      },
    ],
    overlay_signal: "clean",
    metrics: {
      holds: {
        ui_flag: "green",
        display: "Yes \u00B7 $9.5M",
        display_sub: "long-term holder",
      },
      shill_history: {
        ui_flag: "green",
        display: "Not a shiller",
        display_sub: "organic mentions only",
      },
      pnl: {
        ui_flag: "insufficient",
        display: "insufficient data",
        display_sub: "organic mentions only",
      },
    },
    token_signals: {
      ui_flag: "green",
      display: "Established token",
      display_sub: "no risk flags",
    },
    explanation:
      "Long-term holder, no history of token shilling, wallet matches public identity via on-chain ENS.",
    sources: ["etherscan", "ens", "tl_graph"],
    computed_at: new Date().toISOString(),
    insufficient_data_fields: ["metrics.pnl"],
    scoring_version: SCORING_VERSION,
  },

  alpha_caller_x: {
    handle: "alpha_caller_x",
    identity_tier: "B+",
    identity_rank_label: "top quintile, trader cohort",
    wallets: [
      {
        chain: "ethereum",
        address: "0x0000000000000000000000000000000000000000",
        tier: "B+",
      },
    ],
    overlay_signal: "caution",
    metrics: {
      holds: {
        ui_flag: "yellow",
        display: "Yes \u00B7 $12.4K",
        display_sub: "recent entry",
      },
      shill_history: {
        ui_flag: "yellow",
        display: "Frequent caller",
        display_sub: "serial pattern detected",
      },
      pnl: {
        ui_flag: "red",
        display: "Underperforms",
        display_sub: "most recent calls below market",
      },
    },
    token_signals: {
      ui_flag: "neutral",
      display: "Established token",
      display_sub: "no immediate risk flags",
    },
    explanation:
      "Author entered the position shortly before promoting it, and historical calls have tended to underperform. Treat as a short-term signal.",
    sources: ["etherscan", "dex_trades", "tl_kol_graph"],
    computed_at: new Date().toISOString(),
    insufficient_data_fields: [],
    scoring_version: SCORING_VERSION,
  },

  moondegen_sol: {
    handle: "moondegen_sol",
    identity_tier: "B",
    identity_rank_label: null,
    wallets: [
      {
        chain: "solana",
        address: "So1anaAddress000000000000000000000000000000",
        tier: "B",
      },
    ],
    overlay_signal: "risk",
    metrics: {
      holds: {
        ui_flag: "red",
        display: "Yes \u00B7 $2.1K",
        display_sub: "front-run pattern",
      },
      shill_history: {
        ui_flag: "yellow",
        display: "Frequent caller",
        display_sub: "serial pattern detected",
      },
      pnl: {
        ui_flag: "red",
        display: "Severely underperforms",
        display_sub: "nearly all calls lost value",
      },
    },
    token_signals: {
      ui_flag: "red",
      display: "High-risk token",
      display_sub: "new launch, concentrated supply",
    },
    explanation:
      "The promoter's wallet is connected to previous rug-pulls, and the token was launched as a sniper bundle with concentrated supply.",
    sources: ["helius", "rugcheck", "tl_kol_graph"],
    computed_at: new Date().toISOString(),
    insufficient_data_fields: [],
    scoring_version: SCORING_VERSION,
  },
};

export function getMockScore(req: ScoreRequest): ScoreResponse {
  const key = req.handle.toLowerCase();
  const fixture = FIXTURES[key];
  if (fixture) return fixture;

  // Default: unknown handle -> unknown signal (C tier, no data to judge).
  const insufficient = {
    ui_flag: "insufficient" as const,
    display: "insufficient data",
  };
  return {
    handle: req.handle,
    identity_tier: "C",
    identity_rank_label: null,
    wallets: [],
    overlay_signal: "unknown",
    metrics: {
      holds: insufficient,
      shill_history: insufficient,
      pnl: insufficient,
    },
    token_signals: insufficient,
    explanation: "No verified wallet for this author. Claim to get a badge.",
    sources: [],
    computed_at: new Date().toISOString(),
    insufficient_data_fields: [
      "metrics.holds",
      "metrics.shill_history",
      "metrics.pnl",
    ],
    scoring_version: SCORING_VERSION,
  };
}
