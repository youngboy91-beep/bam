import Fastify from "fastify";
import cors from "@fastify/cors";
import { randomBytes } from "node:crypto";
import { getMockScore } from "./mock-store.js";
import type { ScoreRequest, ScoreResponse } from "@truthlayer/shared";
import { SCORING_VERSION } from "@truthlayer/shared";
import { registerSessionRoutes } from "./routes/session.js";
import { registerClaimRoutes } from "./routes/claim.js";
import { createInMemoryNonceStore } from "./auth/nonce.js";
import { createInMemoryIdentityStore } from "./store/identity-store.js";
import { createInMemorySessionStore } from "./store/session-store.js";
import { createStubTwitterVerifier } from "./auth/twitter.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: [
    "https://x.com",
    "https://twitter.com",
    "http://localhost:5173", // /claim web app
    "http://localhost:4173",
  ],
});

// -------- wiring --------

const jwtSecret =
  process.env.TL_JWT_SECRET ??
  // Generated at startup in dev so a misconfigured dev env still works.
  // Production MUST set TL_JWT_SECRET; a warning is logged if it's missing.
  (function () {
    const generated = randomBytes(32).toString("hex");
    app.log.warn(
      "TL_JWT_SECRET not set; generated an ephemeral secret. All sessions invalidate on restart.",
    );
    return generated;
  })();

const sessionStore = createInMemorySessionStore();
const nonceStore = createInMemoryNonceStore();
const identityStore = createInMemoryIdentityStore();
const twitterVerifier = createStubTwitterVerifier();

// -------- routes --------

app.get("/health", async () => ({ ok: true }));

app.get<{ Querystring: ScoreRequest }>("/v1/score", async (req, reply) => {
  const { handle, ticker, tweet_id } = req.query;
  if (!handle) {
    return reply.status(400).send({ error: "handle is required" });
  }

  // 1. Try the fixture store first (canonical demo handles).
  const fixtureScore = getMockScore({ handle, ticker, tweet_id });
  if (fixtureScore.identity_tier !== "C") {
    return fixtureScore;
  }

  // 2. Fall back to the live identity graph. If this handle has any
  //    self-onboarded A-tier links, synthesize a "verified, no signals
  //    yet" response. The signal pipeline will replace this as adapters
  //    come online; the shape does not change.
  const links = identityStore.listLinksForHandle(handle);
  if (links.length === 0) {
    return fixtureScore; // unknown -> C / insufficient (already rendered)
  }

  const topTier = links.some((l) => l.tier === "A") ? "A" : "C";
  const insufficient = {
    ui_flag: "insufficient" as const,
    display: "insufficient data",
  };
  const response: ScoreResponse = {
    handle,
    identity_tier: topTier,
    identity_rank_label: null,
    wallets: links.map((l) => ({
      chain: l.chain,
      address: l.address,
      tier: l.tier,
    })),
    overlay_signal: topTier === "A" ? "clean" : "unknown",
    metrics: {
      holds: insufficient,
      shill_history: insufficient,
      pnl: insufficient,
    },
    token_signals: insufficient,
    explanation:
      topTier === "A"
        ? "Verified wallet linked. On-chain signals will appear once the data pipeline is live."
        : "No verified wallet for this author.",
    sources: ["tl_graph"],
    computed_at: new Date().toISOString(),
    insufficient_data_fields: [
      "metrics.holds",
      "metrics.shill_history",
      "metrics.pnl",
    ],
    scoring_version: SCORING_VERSION,
  };
  return response;
});

registerSessionRoutes(app, { jwtSecret, sessionStore });
registerClaimRoutes(app, {
  jwtSecret,
  nonceStore,
  identityStore,
  sessionStore,
  twitterVerifier,
});

// -------- start --------

const port = Number(process.env.PORT ?? 8787);
app.listen({ port, host: "0.0.0.0" }).then(() => {
  app.log.info(`TruthLayer API listening on :${port}`);
});
