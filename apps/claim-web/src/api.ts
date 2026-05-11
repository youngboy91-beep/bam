// Thin API client for the /claim page. The page never handles raw signal
// data from /v1/score — it only talks to session + claim routes.
//
// All requests that need a session attach Bearer from session.ts.

import type {
  AnonymousSessionResponse,
  ClaimNonceRequest,
  ClaimNonceResponse,
  ClaimSubmitRequest,
  ClaimSubmitResponse,
  SessionSnapshot,
} from "@truthlayer/shared";

declare const __API_BASE__: string;
export const API_BASE = __API_BASE__;

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function createAnonymousSession(): Promise<AnonymousSessionResponse> {
  const res = await fetch(`${API_BASE}/v1/session/anonymous`, { method: "POST" });
  return json<AnonymousSessionResponse>(res);
}

export async function getSession(token: string): Promise<SessionSnapshot> {
  const res = await fetch(`${API_BASE}/v1/session`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return json<SessionSnapshot>(res);
}

export async function requestNonce(
  body: ClaimNonceRequest,
): Promise<ClaimNonceResponse> {
  const res = await fetch(`${API_BASE}/v1/claim/nonce`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return json<ClaimNonceResponse>(res);
}

export async function submitClaim(
  token: string,
  body: ClaimSubmitRequest,
): Promise<ClaimSubmitResponse> {
  const res = await fetch(`${API_BASE}/v1/claim`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return json<ClaimSubmitResponse>(res);
}
