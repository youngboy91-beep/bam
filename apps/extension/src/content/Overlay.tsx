// Pure renderer. Takes server-supplied display strings and flags and draws
// them. No local thresholds, no client-side math, no decoding of numeric
// signals. If the server did not pre-render a field, we show the fallback.
//
// See .kiro/steering/scoring.md: the client MUST NOT apply any policy.

import type {
  ScoreResponse,
  UiFlag,
  OverlaySignal,
  MetricCell as MetricCellData,
} from "@truthlayer/shared";

interface Props {
  score: ScoreResponse;
}

const SIGNAL_LABEL: Record<OverlaySignal, string> = {
  clean: "CLEAN",
  caution: "CAUTION",
  risk: "HIGH RISK",
  unknown: "UNVERIFIED",
};

const SIGNAL_ICON: Record<OverlaySignal, string> = {
  clean: "\u2713",
  caution: "!",
  risk: "\u2715",
  unknown: "?",
};

const SIGNAL_ICON_CLASS: Record<OverlaySignal, string> = {
  clean: "tl-icon tl-icon-green",
  caution: "tl-icon tl-icon-yellow",
  risk: "tl-icon tl-icon-red",
  unknown: "tl-icon tl-icon-neutral",
};

function cellValueClass(flag: UiFlag): string {
  if (flag === "green") return "tl-value tl-pos";
  if (flag === "red") return "tl-value tl-neg";
  return "tl-value";
}

function Cell({ label, data }: { label: string; data: MetricCellData }) {
  return (
    <div className="tl-cell">
      <div className="tl-label">{label}</div>
      <div className={cellValueClass(data.ui_flag)}>{data.display}</div>
      {data.display_sub ? <div className="tl-sub">{data.display_sub}</div> : null}
    </div>
  );
}

export function Overlay({ score }: Props) {
  const signal = score.overlay_signal;

  // Tier label is what the server sent. For B+, the server supplies a
  // cohort-relative rank string; we never compute a percentage client-side.
  const tierLabel =
    score.identity_tier === "B+" && score.identity_rank_label
      ? `B+ \u00B7 ${score.identity_rank_label}`
      : score.identity_tier;

  return (
    <div className="tl">
      <div className="tl-head">
        <div className="tl-brand">
          <span className="tl-logo" /> TruthLayer
          <span className="tl-tier">tier {tierLabel}</span>
        </div>
        <div className={`tl-signal tl-signal-${signal}`}>
          {"\u25CF "} {SIGNAL_LABEL[signal]}
        </div>
      </div>
      <div className="tl-grid">
        <Cell label="Holds token" data={score.metrics.holds} />
        <Cell label="Shill history" data={score.metrics.shill_history} />
        <Cell label="Avg PnL after call" data={score.metrics.pnl} />
      </div>
      <div className="tl-body">
        <div className={SIGNAL_ICON_CLASS[signal]}>{SIGNAL_ICON[signal]}</div>
        <div className="tl-text">{score.explanation}</div>
      </div>
      <div className="tl-foot">
        <span>Sources: {score.sources.join(" \u00B7 ") || "\u2014"}</span>
        <a href="#" onClick={(e) => e.preventDefault()}>
          Details &rsaquo;
        </a>
      </div>
    </div>
  );
}
