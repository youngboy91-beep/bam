// Content script entry.
//
// Mode: "inline dot + hover card". For each tweet in the feed we insert a
// single colored dot next to the author's handle. On hover/focus the dot
// surfaces a floating hover card with the full details.
//
// The feed stays visually quiet; the user controls when to see data.
//
// One shadow root per dot (mounted inline, invisible when no signal is
// ready yet). One shared shadow root for the hover card (fixed, reused).

import { createRoot, type Root } from "react-dom/client";
import { StrictMode } from "react";
import type { ScoreRequest, ScoreResponse } from "@truthlayer/shared";
import { Dot } from "./Dot";
import { HoverCard } from "./HoverCard";
import { overlayCss } from "./overlay-css";

const PROCESSED = new WeakSet<Element>();
/** Per-article cache so re-renders don't re-fetch. */
const SCORE_CACHE = new WeakMap<Element, {
  score: ScoreResponse;
  handle: string;
  ticker?: string;
}>();

// ---------------------------------------------------------------------------
// Tweet parsing
// ---------------------------------------------------------------------------

function findTweetArticles(root: ParentNode): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>('article[data-testid="tweet"]'),
  );
}

/**
 * Finds the header anchor that contains the @handle text. We insert the dot
 * right after this anchor so it sits next to the handle visually.
 */
function findHandleAnchor(article: HTMLElement): {
  anchor: HTMLAnchorElement;
  handle: string;
} | null {
  const anchors = article.querySelectorAll<HTMLAnchorElement>("a[href^='/']");
  for (const a of anchors) {
    const text = (a.textContent ?? "").trim();
    if (text.startsWith("@")) {
      return { anchor: a, handle: text.slice(1) };
    }
  }
  return null;
}

function extractTicker(article: HTMLElement): string | null {
  const text = article.innerText ?? "";
  const m = text.match(/\$([A-Z][A-Z0-9]{1,9})\b/);
  return m?.[1] ?? null;
}

// ---------------------------------------------------------------------------
// API bridge
// ---------------------------------------------------------------------------

async function requestScore(req: ScoreRequest): Promise<ScoreResponse | null> {
  try {
    const res = await chrome.runtime.sendMessage({
      type: "TL_SCORE_REQUEST",
      payload: req,
    });
    if (!res?.ok) return null;
    return res.data as ScoreResponse;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Shared hover-card host (one per page)
// ---------------------------------------------------------------------------

let cardHost: HTMLDivElement | null = null;
let cardRoot: Root | null = null;
let cardHideTimer: number | null = null;

function ensureCardHost(): { host: HTMLDivElement; root: Root } {
  if (cardHost && cardRoot) return { host: cardHost, root: cardRoot };

  const host = document.createElement("div");
  host.setAttribute("data-truthlayer-card", "");
  host.style.cssText =
    "all: initial; position: fixed; z-index: 2147483646; " +
    "top: 0; left: 0; display: none;";
  // The card itself manages hover so we don't close it when moving the
  // pointer from the dot into the card.
  host.addEventListener("pointerenter", cancelHide);
  host.addEventListener("pointerleave", scheduleHide);
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = overlayCss;
  shadow.appendChild(style);
  const mount = document.createElement("div");
  shadow.appendChild(mount);
  const root = createRoot(mount);
  cardHost = host;
  cardRoot = root;
  return { host, root };
}

function positionCard(host: HTMLDivElement, anchor: Element) {
  const r = anchor.getBoundingClientRect();
  const cardW = 400; // matches CSS
  const gap = 8;
  let left = r.left + r.width / 2 - cardW / 2;
  // keep inside viewport horizontally
  const vw = document.documentElement.clientWidth;
  if (left + cardW > vw - 16) left = vw - cardW - 16;
  if (left < 16) left = 16;
  let top = r.bottom + gap;
  // flip above the anchor if no room below
  const vh = document.documentElement.clientHeight;
  if (top + 300 > vh) top = r.top - gap - 300;
  host.style.left = `${Math.max(0, left)}px`;
  host.style.top = `${Math.max(0, top)}px`;
  host.style.display = "block";
}

function scheduleHide() {
  if (cardHideTimer) window.clearTimeout(cardHideTimer);
  cardHideTimer = window.setTimeout(() => {
    if (cardHost) cardHost.style.display = "none";
  }, 250);
}

function cancelHide() {
  if (cardHideTimer) {
    window.clearTimeout(cardHideTimer);
    cardHideTimer = null;
  }
}

function showCard(
  anchor: Element,
  score: ScoreResponse,
  handle: string,
  ticker?: string,
) {
  const { host, root } = ensureCardHost();
  cancelHide();
  root.render(
    <StrictMode>
      <HoverCard score={score} handle={handle} ticker={ticker} />
    </StrictMode>,
  );
  positionCard(host, anchor);
}

// ---------------------------------------------------------------------------
// Dot mounting
// ---------------------------------------------------------------------------

function mountDot(
  anchor: HTMLAnchorElement,
  article: HTMLElement,
  score: ScoreResponse,
  handle: string,
  ticker?: string,
) {
  // Avoid double-mounting on re-scan.
  const prev = anchor.parentElement?.querySelector("[data-truthlayer-dot]");
  if (prev) return;

  const host = document.createElement("span");
  host.setAttribute("data-truthlayer-dot", "");
  // Inline so it sits next to the handle without changing layout.
  host.style.cssText = "all: initial; display: inline-block;";
  anchor.insertAdjacentElement("afterend", host);

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = overlayCss;
  shadow.appendChild(style);
  const mount = document.createElement("span");
  shadow.appendChild(mount);

  const handleEnter = () => showCard(host, score, handle, ticker);
  const handleLeave = () => scheduleHide();

  createRoot(mount).render(
    <StrictMode>
      <Dot
        signal={score.overlay_signal}
        onPointerEnter={handleEnter}
        onPointerLeave={handleLeave}
        onClick={handleEnter}
      />
    </StrictMode>,
  );

  SCORE_CACHE.set(article, { score, handle, ticker });
}

// ---------------------------------------------------------------------------
// Per-article processing
// ---------------------------------------------------------------------------

async function processArticle(article: HTMLElement) {
  if (PROCESSED.has(article)) return;
  const parsed = findHandleAnchor(article);
  if (!parsed) return;
  PROCESSED.add(article);

  const ticker = extractTicker(article) ?? undefined;
  const score = await requestScore({ handle: parsed.handle, ticker });
  if (!score) return;
  mountDot(parsed.anchor, article, score, parsed.handle, ticker);
}

function scan() {
  for (const a of findTweetArticles(document)) void processArticle(a);
}

// ---------------------------------------------------------------------------
// Feed observer
// ---------------------------------------------------------------------------

let scheduled = false;
const observer = new MutationObserver(() => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    scan();
  });
});
observer.observe(document.body, { childList: true, subtree: true });

// Also react to scroll: the card can become mispositioned if user scrolls
// while hovering. Cheapest fix — just hide.
window.addEventListener("scroll", scheduleHide, { passive: true });
window.addEventListener("resize", scheduleHide);

scan();
