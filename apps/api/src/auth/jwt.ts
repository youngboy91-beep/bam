// Minimal HS256 JWT issuance / verification. Zero-dependency implementation
// so the API has no transitive surface from a JWT library. In production we
// key-rotate via KID header; v1 uses a single server secret from env.
//
// Tokens carry the absolute minimum: account id, plan, a small set of
// scopes. No PII. No raw signal data. No wallet addresses.

import { createHmac, timingSafeEqual } from "node:crypto";

type JwtHeader = { alg: "HS256"; typ: "JWT" };

export interface JwtClaims {
  /** Account id (may be anonymous). */
  sub: string;
  /** Plan tier; same string set as monetization.md. */
  plan: "anonymous" | "free" | "pro" | "partner_startup" | "partner_growth" | "partner_enterprise";
  /** Optional linked X handle for account sessions. */
  handle?: string;
  /** Issued-at seconds. */
  iat: number;
  /** Expires-at seconds. */
  exp: number;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
function b64urlDecode(s: string): Buffer {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

function sign(data: string, secret: string): string {
  return b64url(createHmac("sha256", secret).update(data).digest());
}

export function issueJwt(claims: JwtClaims, secret: string): string {
  const header: JwtHeader = { alg: "HS256", typ: "JWT" };
  const body = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
  return `${body}.${sign(body, secret)}`;
}

export function verifyJwt(token: string, secret: string): JwtClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const h = parts[0];
  const p = parts[1];
  const s = parts[2];
  if (!h || !p || !s) return null;
  const expected = sign(`${h}.${p}`, secret);
  // Use timingSafeEqual to avoid timing side-channels on signature check.
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(s);
  if (expectedBuf.length !== actualBuf.length) return null;
  if (!timingSafeEqual(expectedBuf, actualBuf)) return null;

  try {
    const claims = JSON.parse(b64urlDecode(p).toString("utf8")) as JwtClaims;
    if (claims.exp && claims.exp * 1000 < Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}
