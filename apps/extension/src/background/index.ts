// Background service worker. Centralizes API calls so content scripts can be
// permissive-CSP'd without needing cross-origin fetch themselves, and so we
// can cache responses across tabs.

import type { ScoreRequest, ScoreResponse } from "@truthlayer/shared";
import { SCORING_VERSION } from "@truthlayer/shared";

const API_BASE = "http://localhost:8787";
const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = { at: number; data: ScoreResponse };
const cache = new Map<string, CacheEntry>();

function cacheKey(req: ScoreRequest) {
  return `${SCORING_VERSION}|${req.handle}|${req.ticker ?? ""}`;
}

async function fetchScore(req: ScoreRequest): Promise<ScoreResponse> {
  const key = cacheKey(req);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;

  const url = new URL(`${API_BASE}/v1/score`);
  url.searchParams.set("handle", req.handle);
  if (req.ticker) url.searchParams.set("ticker", req.ticker);
  if (req.tweet_id) url.searchParams.set("tweet_id", req.tweet_id);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`score fetch failed: ${res.status}`);
  const data: ScoreResponse = await res.json();
  cache.set(key, { at: Date.now(), data });
  return data;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "TL_SCORE_REQUEST") {
    fetchScore(msg.payload)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true; // keep the message channel open for the async response
  }
  return false;
});
