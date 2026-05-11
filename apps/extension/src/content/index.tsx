// Content script entry. Scans the X/Twitter feed for tweets, parses the author
// handle and first $TICKER mention, and mounts a TruthLayer overlay in a Shadow
// DOM anchored under each tweet.

import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import type { ScoreRequest, ScoreResponse } from "@truthlayer/shared";
import { Overlay } from "./Overlay";
import { overlayCss } from "./overlay-css";

const PROCESSED = new WeakSet<Element>();

function findTweetArticles(root: ParentNode): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>('article[data-testid="tweet"]'),
  );
}

function extractHandle(article: HTMLElement): string | null {
  // Author handle lives in the first <a> whose href starts with "/" and
  // whose text begins with "@". Twitter re-renders heavily, so try multiple.
  const anchors = article.querySelectorAll<HTMLAnchorElement>("a[href^='/']");
  for (const a of anchors) {
    const text = (a.textContent ?? "").trim();
    if (text.startsWith("@")) return text.slice(1);
  }
  return null;
}

function extractTicker(article: HTMLElement): string | null {
  const text = article.innerText ?? "";
  const m = text.match(/\$([A-Z][A-Z0-9]{1,9})\b/);
  return m?.[1] ?? null;
}

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

function mountOverlay(article: HTMLElement, score: ScoreResponse) {
  const host = document.createElement("div");
  host.setAttribute("data-truthlayer-host", "");
  host.style.cssText = "all: initial; display: block; margin-top: 10px;";

  // Insert at the end of the tweet body but before the action row if possible.
  const anchor =
    article.querySelector('div[role="group"]')?.parentElement ?? article;
  anchor.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = overlayCss;
  shadow.appendChild(style);
  const mount = document.createElement("div");
  shadow.appendChild(mount);

  createRoot(mount).render(
    <StrictMode>
      <Overlay score={score} />
    </StrictMode>,
  );
}

async function processArticle(article: HTMLElement) {
  if (PROCESSED.has(article)) return;
  PROCESSED.add(article);

  const handle = extractHandle(article);
  if (!handle) return;
  const ticker = extractTicker(article);

  const score = await requestScore({ handle, ticker: ticker ?? undefined });
  if (!score) return;
  mountOverlay(article, score);
}

function scan() {
  for (const a of findTweetArticles(document)) void processArticle(a);
}

// Twitter virtualizes the feed. Observe mutations and re-scan debounced.
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

scan();
