// Background service worker.
//
// Responsibilities:
//   1. Own the single path to our API. Content scripts never fetch directly.
//   2. Attach the session credential (anonymous JWT or account JWT) to every
//      request. The extension cannot score anything without a valid session
//      because all scoring is server-side.
//   3. Cache responses briefly to reduce load for repeated lookups.
//
// Non-responsibilities:
//   - No thresholds, no policy, no signal weights live here. The worker is a
//     transport: it ships requests out and caches the server's verdict.

import type { ScoreRequest, ScoreResponse } from "@truthlayer/shared";
import { SCORING_VERSION } from "@truthlayer/shared";
import { API_BASE, CACHE_TTL_MS } from "./config";

type CacheEntry = { at: number; data: ScoreResponse };
const cache = new Map<string, CacheEntry>();

/** The session credential obtained on install. Stored by the session module. */
async function getSessionToken(): Promise<string | null> {
  try {
    const s = await chrome.storage.local.get("tl_session");
    return typeof s.tl_session === "string" ? s.tl_session : null;
  } catch {
    return null;
  }
}

function cacheKey(req: ScoreRequest): string {
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

  const headers: Record<string, string> = {
    "x-client": "extension",
    "x-scoring-version": SCORING_VERSION,
  };
  const token = await getSessionToken();
  if (token) headers["authorization"] = `Bearer ${token}`;

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`score fetch failed: ${res.status}`);
  const data: ScoreResponse = await res.json();
  cache.set(key, { at: Date.now(), data });
  return data;
}

/**
 * Minimal session snapshot for the popup. In production this comes from the
 * API (/v1/session); for now we return sensible defaults backed by local
 * storage. Adding real numbers here is a server responsibility, not client.
 */
async function getSessionSnapshot() {
  const s = await chrome.storage.local.get([
    "tl_plan",
    "tl_handle",
    "tl_wallets_count",
  ]);
  const plan =
    s.tl_plan === "pro" || s.tl_plan === "free" ? s.tl_plan : "anonymous";
  return {
    plan,
    handle: typeof s.tl_handle === "string" ? s.tl_handle : undefined,
    wallets_count:
      typeof s.tl_wallets_count === "number" ? s.tl_wallets_count : undefined,
    // usage_today / usage_limit are rendered by the server once the session
    // endpoint is wired up. For now we show placeholders.
    usage_today: 0,
    usage_limit: null,
  };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "TL_SCORE_REQUEST") {
    fetchScore(msg.payload)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (msg?.type === "TL_SESSION_SNAPSHOT") {
    getSessionSnapshot()
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (msg?.type === "TL_REPORT_ISSUE_OPEN") {
    // TODO: open a scoped report form. For now just open the claim page.
    void chrome.tabs.create({ url: "https://truthlayer.app/report" });
    sendResponse({ ok: true });
    return false;
  }

  return false;
});
