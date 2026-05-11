import {
  SCORING_VERSION,
  type ScoreRequest,
  type ScoreResponse,
} from "@truthlayer/shared";

// Three canonical fixtures that match the reference/mockup.html scenarios.
// Real scoring pipeline will replace this module without changing the shape.

const FIXTURES: Record<string, ScoreResponse> = {
  vitalik_research: {
    handle: "vitalik_research",
    identity_tier: "A",
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
        status: "yes",
        amount_usd: 9_500_000,
        time_to_tweet_hours: 24 * 365 * 4,
        ui_flag: "green",
      },
      shill_history: {
        calls_30d: 0,
        unique_tickers_30d: 0,
        serial_caller: false,
        ui_flag: "green",
      },
      pnl: {
        avg_pnl_7d: null,
        median_pnl_7d: null,
        calls_that_worked: 0,
        total_calls: 0,
        ui_flag: "insufficient",
      },
    },
    token_signals: {
      age_hours: 24 * 365 * 10,
      top10_pct: 0.18,
      lp_status: "locked",
      mint_authority: null,
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
    identity_confidence: 0.72,
    wallets: [
      {
        chain: "ethereum",
        address: "0x0000000000000000000000000000000000000000",
        tier: "B+",
        confidence: 0.72,
      },
    ],
    overlay_signal: "caution",
    metrics: {
      holds: {
        status: "yes",
        amount_usd: 12_400,
        time_to_tweet_hours: 6,
        ui_flag: "yellow",
      },
      shill_history: {
        calls_30d: 14,
        unique_tickers_30d: 11,
        serial_caller: true,
        ui_flag: "yellow",
      },
      pnl: {
        avg_pnl_7d: -0.38,
        median_pnl_7d: -0.52,
        calls_that_worked: 3,
        total_calls: 14,
        ui_flag: "red",
      },
    },
    token_signals: {
      age_hours: 72,
      top10_pct: 0.31,
      lp_status: "locked",
      mint_authority: null,
    },
    explanation:
      "Author entered the position hours before promoting it, and historical calls underperform the market. Looks like a typical short-term pump setup.",
    sources: ["etherscan", "dex_trades", "tl_kol_graph"],
    computed_at: new Date().toISOString(),
    insufficient_data_fields: [],
    scoring_version: SCORING_VERSION,
  },

  moondegen_sol: {
    handle: "moondegen_sol",
    identity_tier: "B",
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
        status: "yes",
        amount_usd: 2_100,
        time_to_tweet_hours: 0.2,
        ui_flag: "red",
      },
      shill_history: {
        calls_30d: 28,
        unique_tickers_30d: 26,
        serial_caller: true,
        ui_flag: "yellow",
      },
      pnl: {
        avg_pnl_7d: -0.71,
        median_pnl_7d: -0.88,
        calls_that_worked: 2,
        total_calls: 28,
        ui_flag: "red",
      },
    },
    token_signals: {
      age_hours: 0.37,
      top10_pct: 0.74,
      lp_status: "unlocked",
      mint_authority: "retained",
    },
    explanation:
      "The promoter's wallet is connected to three previous rug-pulls in the last 30 days, and the token was launched as a sniper bundle with concentrated supply.",
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

  // Default: unknown handle -> clean signal with C tier (no data to judge).
  return {
    handle: req.handle,
    identity_tier: "C",
    wallets: [],
    overlay_signal: "unknown",
    metrics: {
      holds: { status: "insufficient", ui_flag: "insufficient" },
      shill_history: {
        calls_30d: 0,
        unique_tickers_30d: 0,
        serial_caller: false,
        ui_flag: "insufficient",
      },
      pnl: {
        avg_pnl_7d: null,
        median_pnl_7d: null,
        calls_that_worked: 0,
        total_calls: 0,
        ui_flag: "insufficient",
      },
    },
    token_signals: {
      age_hours: 0,
      top10_pct: null,
      lp_status: "unknown",
      mint_authority: null,
    },
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
