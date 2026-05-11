// The minimal presence — a single colored dot inserted next to the
// author's handle in each tweet header. Four states mapped directly from
// overlay_signal. No text, no numbers, no layout changes to the tweet.

import type { OverlaySignal } from "@truthlayer/shared";

const DOT_CLASS: Record<OverlaySignal, string> = {
  clean: "tl-dot tl-dot-green",
  caution: "tl-dot tl-dot-yellow",
  risk: "tl-dot tl-dot-red",
  unknown: "tl-dot tl-dot-gray",
};

const DOT_ARIA: Record<OverlaySignal, string> = {
  clean: "TruthLayer: verified holder",
  caution: "TruthLayer: caution — check history",
  risk: "TruthLayer: high risk",
  unknown: "TruthLayer: unverified",
};

interface Props {
  signal: OverlaySignal;
  onPointerEnter?: (e: React.PointerEvent) => void;
  onPointerLeave?: (e: React.PointerEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
}

export function Dot({ signal, onPointerEnter, onPointerLeave, onClick }: Props) {
  return (
    <span
      className={DOT_CLASS[signal]}
      role="button"
      tabIndex={0}
      aria-label={DOT_ARIA[signal]}
      title={DOT_ARIA[signal]}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
    />
  );
}
