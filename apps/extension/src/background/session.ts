// Anonymous-session bootstrap for the extension.
//
// On install / startup, ensure chrome.storage.local has a valid session
// token. If missing or expired, request a new one from the API. The token
// lives in chrome.storage.local under 'tl_session' — every API call
// attaches it as Authorization: Bearer.
//
// Non-responsibilities:
//   - Pro upgrade / paid-session handling (that's done via the web account
//     page which writes back to storage; not in this file).
//   - Validating the token shape. The API is the authority.

import type { AnonymousSessionResponse } from "@truthlayer/shared";
import { API_BASE } from "./config";

const SESSION_KEY = "tl_session";
const SESSION_EXPIRES_AT_KEY = "tl_session_expires_at";

async function fetchAnonymousSession(): Promise<AnonymousSessionResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/v1/session/anonymous`, { method: "POST" });
    if (!res.ok) return null;
    return (await res.json()) as AnonymousSessionResponse;
  } catch {
    return null;
  }
}

async function writeSession(token: string, expiresAtMs: number): Promise<void> {
  await chrome.storage.local.set({
    [SESSION_KEY]: token,
    [SESSION_EXPIRES_AT_KEY]: expiresAtMs,
  });
}

export async function ensureAnonymousSession(): Promise<void> {
  const existing = await chrome.storage.local.get([SESSION_KEY, SESSION_EXPIRES_AT_KEY]);
  const expiresAt = Number(existing[SESSION_EXPIRES_AT_KEY] ?? 0);
  const needs = !existing[SESSION_KEY] || expiresAt <= Date.now() + 24 * 60 * 60 * 1000;
  // Refresh when less than one day remains, so the extension never hits a
  // hard-expired token mid-session.
  if (!needs) return;

  const s = await fetchAnonymousSession();
  if (!s) return; // keep the stale one; background fetches will fail loudly.
  const expiresAtMs = Date.now() + s.expires_in * 1000;
  await writeSession(s.session, expiresAtMs);
}
