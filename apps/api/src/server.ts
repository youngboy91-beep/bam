import Fastify from "fastify";
import cors from "@fastify/cors";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getMockScore } from "./mock-store.js";
import type { ScoreRequest, ScoreResponse } from "@truthlayer/shared";
import { SCORING_VERSION } from "@truthlayer/shared";
import { registerSessionRoutes } from "./routes/session.js";
import { registerClaimRoutes } from "./routes/claim.js";
import { createInMemoryNonceStore } from "./auth/nonce.js";
import { createInMemoryIdentityStore, type IdentityStore } from "./store/identity-store.js";
import { createInMemorySessionStore, type SessionStore } from "./store/session-store.js";
import { createStubTwitterVerifier } from "./auth/twitter.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = Fastify({ logger: true });

const corsOrigins = process.env.TL_CORS_ORIGINS
  ? process.env.TL_CORS_ORIGINS.split(",").map((s) => s.trim())
  : ["https://x.com", "https://twitter.com", "http://localhost:5173", "http://localhost:4173"];
await app.register(cors, { origin: corsOrigins });

const jwtSecret = process.env.TL_JWT_SECRET ?? (() => {
  const s = randomBytes(32).toString("hex");
  app.log.warn("TL_JWT_SECRET not set; generated ephemeral secret.");
  return s;
})();

let identityStore: IdentityStore;
let sessionStore: SessionStore;

if (process.env.DATABASE_URL) {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false } });
  try {
    const sql = readFileSync(resolve(__dirname, "../migrations/001_initial.sql"), "utf8");
    await pool.query(sql);
    app.log.info("Postgres connected, migrations applied.");
  } catch (e) { app.log.error("Migration failed: " + String(e)); process.exit(1); }
  const { createPgIdentityStore } = await import("./store/pg-identity-store.js");
  const { createPgSessionStore } = await import("./store/pg-session-store.js");
  identityStore = createPgIdentityStore(pool);
  sessionStore = createPgSessionStore(pool);
} else {
  app.log.warn("DATABASE_URL not set — in-memory mode (data lost on restart).");
  identityStore = createInMemoryIdentityStore();
  sessionStore = createInMemorySessionStore();
}

const nonceStore = createInMemoryNonceStore();
const twitterVerifier = createStubTwitterVerifier();

app.get("/health", async () => ({ ok: true }));

app.get<{ Querystring: ScoreRequest }>("/v1/score", async (req, reply) => {
  const { handle, ticker, tweet_id } = req.query;
  if (!handle) return reply.status(400).send({ error: "handle is required" });

  const fixtureScore = getMockScore({ handle, ticker, tweet_id });
  if (fixtureScore.identity_tier !== "C") return fixtureScore;

  const links = await identityStore.listLinksForHandle(handle);
  if (links.length === 0) return fixtureScore;

  const topTier = links.some((l) => l.tier === "A") ? "A" : "C";
  const insufficient = { ui_flag: "insufficient" as const, display: "insufficient data" };
  const response: ScoreResponse = {
    handle, identity_tier: topTier, identity_rank_label: null,
    wallets: links.map((l) => ({ chain: l.chain, address: l.address, tier: l.tier })),
    overlay_signal: topTier === "A" ? "clean" : "unknown",
    metrics: { holds: insufficient, shill_history: insufficient, pnl: insufficient },
    token_signals: insufficient,
    explanation: topTier === "A" ? "Verified wallet linked. On-chain signals coming soon." : "No verified wallet for this author.",
    sources: ["tl_graph"], computed_at: new Date().toISOString(),
    insufficient_data_fields: ["metrics.holds", "metrics.shill_history", "metrics.pnl"],
    scoring_version: SCORING_VERSION,
  };
  return response;
});

registerSessionRoutes(app, { jwtSecret, sessionStore });
registerClaimRoutes(app, { jwtSecret, nonceStore, identityStore, sessionStore, twitterVerifier });

const port = Number(process.env.PORT ?? 8787);
app.listen({ port, host: "0.0.0.0" }).then(() => { app.log.info(`TruthLayer API on :${port}`); });
