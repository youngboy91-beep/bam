import Fastify from "fastify";
import cors from "@fastify/cors";
import { getMockScore } from "./mock-store.js";
import type { ScoreRequest, ScoreResponse } from "@truthlayer/shared";

const app = Fastify({ logger: true });

await app.register(cors, {
  // Content scripts on x.com fetch from this API.
  origin: ["https://x.com", "https://twitter.com", "http://localhost:5173"],
});

app.get("/health", async () => ({ ok: true }));

app.get<{ Querystring: ScoreRequest }>("/v1/score", async (req, reply) => {
  const { handle, ticker, tweet_id } = req.query;
  if (!handle) {
    return reply.status(400).send({ error: "handle is required" });
  }

  const score: ScoreResponse = getMockScore({ handle, ticker, tweet_id });
  return score;
});

const port = Number(process.env.PORT ?? 8787);
app.listen({ port, host: "0.0.0.0" }).then(() => {
  app.log.info(`TruthLayer mock API listening on :${port}`);
});
