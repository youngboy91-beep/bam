import type { ScoreResponse, UiFlag, OverlaySignal } from "@truthlayer/shared";

interface Props {
  score: ScoreResponse;
}

const SIGNAL_LABEL: Record<OverlaySignal, string> = {
  clean: "CLEAN",
  caution: "CAUTION",
  risk: "HIGH RISK",
  unknown: "UNVERIFIED",
};

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function formatPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${Math.round(n * 100)}%`;
}

function HoldsCell({ score }: { score: ScoreResponse }) {
  const m = score.metrics.holds;
  if (m.ui_flag === "insufficient") {
    return (
      <Cell label="Holds token" value="insufficient data" sub="no verified wallet" />
    );
  }
  if (m.status === "no") {
    return <Cell label="Holds token" value="No" sub="not in wallet" flag="green" />;
  }
  const amount = m.amount_usd ? formatUsd(m.amount_usd) : "unknown";
  const hours = m.time_to_tweet_hours ?? 0;
  let sub = "";
  if (hours < 2) sub = `entered ${Math.round(hours * 60)}m before tweet`;
  else if (hours < 24) sub = `entered ${Math.round(hours)}h before tweet`;
  else if (hours < 24 * 30) sub = `entered ${Math.round(hours / 24)}d ago`;
  else sub = `held ${Math.round(hours / 24 / 30)}mo+`;
  return (
    <Cell
      label="Holds token"
      value={`Yes \u00B7 ${amount}`}
      sub={sub}
      flag={m.ui_flag}
    />
  );
}

function ShillCell({ score }: { score: ScoreResponse }) {
  const m = score.metrics.shill_history;
  if (m.ui_flag === "insufficient") {
    return <Cell label="Shill history" value="insufficient data" sub="new account" />;
  }
  if (m.calls_30d === 0) {
    return (
      <Cell label="Shill history" value="Not a shiller" sub="0 calls / 30d" flag="green" />
    );
  }
  return (
    <Cell
      label="Shill history"
      value={`${m.calls_30d} calls / 30d`}
      sub={m.serial_caller ? "Serial caller" : `${m.unique_tickers_30d} unique tickers`}
      flag={m.ui_flag}
    />
  );
}

function PnlCell({ score }: { score: ScoreResponse }) {
  const m = score.metrics.pnl;
  if (m.ui_flag === "insufficient" || m.avg_pnl_7d === null) {
    return (
      <Cell
        label="Avg 7d PnL after call"
        value="insufficient data"
        sub={`${m.total_calls} completed calls`}
      />
    );
  }
  return (
    <Cell
      label="Avg 7d PnL after call"
      value={formatPct(m.avg_pnl_7d)}
      sub={`worked: ${m.calls_that_worked}/${m.total_calls}`}
      flag={m.ui_flag}
    />
  );
}

function Cell(props: {
  label: string;
  value: string;
  sub?: string;
  flag?: UiFlag;
}) {
  const valueClass =
    props.flag === "green"
      ? "tl-value tl-pos"
      : props.flag === "red"
        ? "tl-value tl-neg"
        : "tl-value";
  return (
    <div className="tl-cell">
      <div className="tl-label">{props.label}</div>
      <div className={valueClass}>{props.value}</div>
      {props.sub ? <div className="tl-sub">{props.sub}</div> : null}
    </div>
  );
}

export function Overlay({ score }: Props) {
  const signalClass = `tl-signal tl-signal-${score.overlay_signal}`;
  const bodyIconClass =
    score.overlay_signal === "risk"
      ? "tl-icon tl-icon-red"
      : score.overlay_signal === "caution"
        ? "tl-icon tl-icon-yellow"
        : score.overlay_signal === "clean"
          ? "tl-icon tl-icon-green"
          : "tl-icon tl-icon-neutral";
  const bodyIconChar =
    score.overlay_signal === "risk"
      ? "\u2715"
      : score.overlay_signal === "caution"
        ? "!"
        : score.overlay_signal === "clean"
          ? "\u2713"
          : "?";

  const tierLabel =
    score.identity_tier === "B+" && score.identity_confidence !== undefined
      ? `B+ \u00B7 likely ${Math.floor(score.identity_confidence * 100)}%`
      : score.identity_tier;

  return (
    <div className="tl">
      <div className="tl-head">
        <div className="tl-brand">
          <span className="tl-logo" /> TruthLayer
          <span className="tl-tier">tier {tierLabel}</span>
        </div>
        <div className={signalClass}>
          {"\u25CF "} {SIGNAL_LABEL[score.overlay_signal]}
        </div>
      </div>
      <div className="tl-grid">
        <HoldsCell score={score} />
        <ShillCell score={score} />
        <PnlCell score={score} />
      </div>
      <div className="tl-body">
        <div className={bodyIconClass}>{bodyIconChar}</div>
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
