// Floating hover card. Appears on hover over the inline dot, hides on
// pointer leave with a small delay so the user can move across the gap.
//
// Renders identity + three metrics + the external-links block.
//
// Server-rendered strings only (no client-side thresholds).

import type {
  ScoreResponse,
  UiFlag,
  OverlaySignal,
  MetricCell as MetricCellData,
} from "@truthlayer/shared";
import {
  walletLinks,
  tokenLinks,
  socialLinks,
  type ExternalLink,
} from "./links";

interface Props {
  score: ScoreResponse;
  handle: string;
  ticker?: string;
}

const SIGNAL_LABEL: Record<OverlaySignal, string> = {
  clean: "CLEAN",
  caution: "CAUTION",
  risk: "HIGH RISK",
  unknown: "UNVERIFIED",
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

function LinkRow({ title, items }: { title: string; items: ExternalLink[] }) {
  if (items.length === 0) return null;
  return (
    <div className="tl-link-row">
      <div className="tl-link-title">{title}</div>
      <div className="tl-link-list">
        {items.map((l) => (
          <a
            key={l.label + l.href}
            className="tl-link"
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            title={l.hint}
            aria-label={l.hint}
          >
            <span className="tl-link-icon">{l.icon}</span>
            <span className="tl-link-label">{l.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export function HoverCard({ score, handle, ticker }: Props) {
  const signal = score.overlay_signal;

  const tierLabel =
    score.identity_tier === "B+" && score.identity_rank_label
      ? `B+ \u00B7 ${score.identity_rank_label}`
      : score.identity_tier;

  // Collect all external links. Per chain per wallet + token links
  // if a ticker was extracted from the tweet + social profile.
  const walletLinkGroups: { chain: string; items: ExternalLink[] }[] = [];
  for (const w of score.wallets) {
    const items = walletLinks(w);
    if (items.length > 0) walletLinkGroups.push({ chain: w.chain, items });
  }
  const tokLinks = ticker ? tokenLinks(ticker) : [];
  const social = socialLinks(handle);

  return (
    <div className="tl-card">
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
        <div className="tl-text">{score.explanation}</div>
      </div>

      {walletLinkGroups.length > 0 ||
      tokLinks.length > 0 ||
      social.length > 0 ? (
        <div className="tl-links-block">
          {walletLinkGroups.map((g) => (
            <LinkRow
              key={g.chain}
              title={`Wallet on ${g.chain}`}
              items={g.items}
            />
          ))}
          {tokLinks.length > 0 ? (
            <LinkRow title={`$${ticker}`} items={tokLinks} />
          ) : null}
          <LinkRow title="Author" items={social} />
        </div>
      ) : null}

      <div className="tl-foot">
        <span>
          Sources: {score.sources.join(" \u00B7 ") || "\u2014"}
        </span>
        <a
          className="tl-foot-link"
          href={`https://truthlayer.app/profile/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Full report &rsaquo;
        </a>
      </div>
    </div>
  );
}
