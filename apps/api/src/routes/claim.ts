// Claim flow endpoints:
//   POST /v1/claim/nonce    issues a single-use nonce + canonical message
//   POST /v1/claim          verifies signature + Twitter handle, records A-tier link
//
// Defense in depth per .kiro/steering/abuse.md:
//   - nonce is single-use, bounded TTL, per-triple, only-latest-valid
//   - message is server-built; client MUST echo it back verbatim
//   - signature is verified with chain-specific verifier
//   - handle is verified via the Twitter session attached to the JWT
//   - smart-contract wallets are routed to a challenge path (TODO)
//
// What this module does NOT do:
//   - Expose any internal threshold or window value in the response.
//   - Tell the caller WHICH check failed beyond a category label.
//     ("rejected" is enough; the attacker gets no signal to iterate against.)

import type { FastifyInstance } from "fastify";
import {
  buildClaimMessage,
  type ClaimNonceRequest,
  type ClaimNonceResponse,
  type ClaimSubmitRequest,
  type ClaimSubmitResponse,
} from "@truthlayer/shared";
import { verifyJwt } from "../auth/jwt.js";
import { verifySiwe } from "../auth/siwe.js";
import { verifySiws } from "../auth/siws.js";
import type { NonceStore } from "../auth/nonce.js";
import type { TwitterVerifier } from "../auth/twitter.js";
import type { IdentityStore } from "../store/identity-store.js";
import type { SessionStore } from "../store/session-store.js";

const TEN_MINUTES_SEC = 10 * 60;

type ClaimDeps = {
  jwtSecret: string;
  nonceStore: NonceStore;
  identityStore: IdentityStore;
  sessionStore: SessionStore;
  twitterVerifier: TwitterVerifier;
};

function extractBearer(auth: string | undefined): string | null {
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

export function registerClaimRoutes(app: FastifyInstance, deps: ClaimDeps) {
  app.post<{ Body: ClaimNonceRequest; Reply: ClaimNonceResponse | { error: string } }>(
    "/v1/claim/nonce",
    async (req, reply) => {
      const { handle, chain, address } = req.body ?? ({} as ClaimNonceRequest);
      if (!handle || !chain || !address) {
        reply.status(400);
        return { error: "handle, chain, address are required" };
      }
      const rec = deps.nonceStore.issue({ handle, chain, address });
      const message = buildClaimMessage({
        handle,
        chain,
        address,
        nonce: rec.nonce,
        issuedAt: rec.issuedAt,
      });
      return {
        nonce: rec.nonce,
        issued_at: rec.issuedAt,
        expires_in: TEN_MINUTES_SEC,
        message,
      };
    },
  );

  app.post<{ Body: ClaimSubmitRequest; Reply: ClaimSubmitResponse | { error: string } }>(
    "/v1/claim",
    async (req, reply) => {
      const body = req.body ?? ({} as ClaimSubmitRequest);
      const { handle, chain, address, nonce, message, signature } = body;
      if (!handle || !chain || !address || !nonce || !message || !signature) {
        reply.status(400);
        return { error: "missing fields" };
      }

      // 1. Require a session (anonymous OK; we upgrade it to free on success).
      const token = extractBearer(req.headers.authorization);
      const claims = token ? verifyJwt(token, deps.jwtSecret) : null;
      if (!claims) {
        reply.status(401);
        return { error: "unauthenticated" };
      }

      // 2. Twitter handle must be verified. For v1 we accept the bearer
      //    session as a stand-in; real Twitter OAuth plugs in here.
      const handleOk = await deps.twitterVerifier.verifyHandle(token!, handle);
      if (!handleOk) {
        reply.status(403);
        return { error: "rejected" };
      }

      // 3. Nonce must exist, belong to the triple, and still be valid.
      const consumed = deps.nonceStore.consume(nonce);
      if (
        !consumed ||
        consumed.handle !== handle.toLowerCase() ||
        consumed.chain !== chain ||
        consumed.address.toLowerCase() !== address.toLowerCase()
      ) {
        reply.status(403);
        return { error: "rejected" };
      }

      // 4. Message must exactly match the server-built canonical form for
      //    this nonce. Reject any drift; do not trust client-built messages.
      const expectedMessage = buildClaimMessage({
        handle,
        chain,
        address,
        nonce,
        issuedAt: consumed.issuedAt,
      });
      if (message !== expectedMessage) {
        reply.status(403);
        return { error: "rejected" };
      }

      // 5. Signature must verify against the expected address on its chain.
      const verdict =
        chain === "solana"
          ? verifySiws({ message, signature, expectedAddress: address })
          : verifySiwe({ message, signature, expectedAddress: address });
      if (!verdict.ok) {
        reply.status(403);
        return { error: "rejected" };
      }

      // 6. Record the A-tier link.
      deps.identityStore.recordSelfOnboard({ handle, chain, address });

      // 7. Promote the session from anonymous -> free if it was anonymous.
      deps.sessionStore.linkHandle(claims.sub, handle);
      const links = deps.identityStore.listLinksForHandle(handle);
      deps.sessionStore.setWalletsCount(claims.sub, links.length);

      return {
        ok: true,
        tier: "A",
        handle: handle.toLowerCase(),
        chain,
        address,
      } as ClaimSubmitResponse;
    },
  );
}
