import type { FastifyInstance } from "fastify";
import { randomBytes } from "node:crypto";
import type { AnonymousSessionResponse, SessionSnapshot } from "@truthlayer/shared";
import { issueJwt, verifyJwt } from "../auth/jwt.js";
import type { SessionStore } from "../store/session-store.js";

const ONE_DAY_SEC = 24 * 60 * 60;
const ANON_USAGE_LIMIT = 100;

export function registerSessionRoutes(
  app: FastifyInstance,
  deps: { jwtSecret: string; sessionStore: SessionStore },
) {
  app.post<{ Reply: AnonymousSessionResponse }>(
    "/v1/session/anonymous",
    async () => {
      const id = "anon_" + randomBytes(12).toString("hex");
      await deps.sessionStore.create({ id, plan: "anonymous", usageLimit: ANON_USAGE_LIMIT });
      const now = Math.floor(Date.now() / 1000);
      const token = issueJwt({ sub: id, plan: "anonymous", iat: now, exp: now + 30 * ONE_DAY_SEC }, deps.jwtSecret);
      return { session: token, plan: "anonymous", expires_in: 30 * ONE_DAY_SEC };
    },
  );

  app.get<{ Reply: SessionSnapshot }>("/v1/session", async (req, reply) => {
    const auth = req.headers.authorization ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    const unauth: SessionSnapshot = { plan: "anonymous", usage_today: 0, usage_limit: null };
    if (!token) { reply.status(401); return unauth; }
    const claims = verifyJwt(token, deps.jwtSecret);
    if (!claims) { reply.status(401); return unauth; }
    const rec = await deps.sessionStore.get(claims.sub);
    if (!rec) { reply.status(401); return unauth; }
    return { plan: rec.plan, handle: rec.handle, wallets_count: rec.walletsCount, usage_today: rec.usageToday, usage_limit: rec.usageLimit };
  });
}
