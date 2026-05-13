import type { FastifyInstance } from "fastify";
import { buildClaimMessage, type ClaimNonceRequest, type ClaimNonceResponse, type ClaimSubmitRequest, type ClaimSubmitResponse } from "@truthlayer/shared";
import { verifyJwt } from "../auth/jwt.js";
import { verifySiwe } from "../auth/siwe.js";
import { verifySiws } from "../auth/siws.js";
import type { NonceStore } from "../auth/nonce.js";
import type { TwitterVerifier } from "../auth/twitter.js";
import type { IdentityStore } from "../store/identity-store.js";
import type { SessionStore } from "../store/session-store.js";

type ClaimDeps = { jwtSecret: string; nonceStore: NonceStore; identityStore: IdentityStore; sessionStore: SessionStore; twitterVerifier: TwitterVerifier };

function extractBearer(auth: string | undefined): string | null {
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

export function registerClaimRoutes(app: FastifyInstance, deps: ClaimDeps) {
  app.post<{ Body: ClaimNonceRequest; Reply: ClaimNonceResponse | { error: string } }>("/v1/claim/nonce", async (req, reply) => {
    const { handle, chain, address } = req.body ?? {} as ClaimNonceRequest;
    if (!handle || !chain || !address) { reply.status(400); return { error: "handle, chain, address are required" }; }
    const rec = deps.nonceStore.issue({ handle, chain, address });
    const message = buildClaimMessage({ handle, chain, address, nonce: rec.nonce, issuedAt: rec.issuedAt });
    return { nonce: rec.nonce, issued_at: rec.issuedAt, expires_in: 600, message };
  });

  app.post<{ Body: ClaimSubmitRequest; Reply: ClaimSubmitResponse | { error: string } }>("/v1/claim", async (req, reply) => {
    const body = req.body ?? {} as ClaimSubmitRequest;
    const { handle, chain, address, nonce, message, signature } = body;
    if (!handle || !chain || !address || !nonce || !message || !signature) { reply.status(400); return { error: "missing fields" }; }

    const token = extractBearer(req.headers.authorization);
    const claims = token ? verifyJwt(token, deps.jwtSecret) : null;
    if (!claims) { reply.status(401); return { error: "unauthenticated" }; }

    const handleOk = await deps.twitterVerifier.verifyHandle(token!, handle);
    if (!handleOk) { reply.status(403); return { error: "rejected" }; }

    const consumed = deps.nonceStore.consume(nonce);
    if (!consumed || consumed.handle !== handle.toLowerCase() || consumed.chain !== chain || consumed.address.toLowerCase() !== address.toLowerCase()) { reply.status(403); return { error: "rejected" }; }

    const expectedMessage = buildClaimMessage({ handle, chain, address, nonce, issuedAt: consumed.issuedAt });
    if (message !== expectedMessage) { reply.status(403); return { error: "rejected" }; }

    const verdict = chain === "solana" ? verifySiws({ message, signature, expectedAddress: address }) : verifySiwe({ message, signature, expectedAddress: address });
    if (!verdict.ok) { reply.status(403); return { error: "rejected" }; }

    await deps.identityStore.recordSelfOnboard({ handle, chain, address });
    await deps.sessionStore.linkHandle(claims.sub, handle);
    const links = await deps.identityStore.listLinksForHandle(handle);
    await deps.sessionStore.setWalletsCount(claims.sub, links.length);

    return { ok: true, tier: "A", handle: handle.toLowerCase(), chain, address } as ClaimSubmitResponse;
  });
}
