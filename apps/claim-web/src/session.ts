// Session persistence for the /claim page. Stored in localStorage under a
// single key so a user can refresh mid-flow and keep their progress.
//
// The token is an opaque JWT from the API; we never decode it client-side.

import { createAnonymousSession } from "./api";

const STORAGE_KEY = "tl_session";

export async function ensureSession(): Promise<string> {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const res = await createAnonymousSession();
  localStorage.setItem(STORAGE_KEY, res.session);
  return res.session;
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}
