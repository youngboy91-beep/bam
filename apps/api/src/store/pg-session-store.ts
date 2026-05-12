import type { Pool } from "pg";
import type { Plan } from "@truthlayer/shared";
import type { SessionRecord, SessionStore } from "./session-store.js";

function toRec(row: any): SessionRecord {
  return {
    id: row.id, plan: row.plan as Plan, handle: row.handle ?? undefined,
    createdAt: row.created_at?.toISOString?.() ?? row.created_at,
    walletsCount: row.wallets_count ?? 0, usageToday: row.usage_today ?? 0,
    usageLimit: row.usage_limit ?? null,
  };
}

export function createPgSessionStore(pool: Pool): SessionStore {
  return {
    create({ id, plan, usageLimit }) {
      return (async () => {
        const res = await pool.query(
          `INSERT INTO sessions (id, plan, usage_limit) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING RETURNING *`,
          [id, plan, usageLimit],
        );
        return res.rows[0] ? toRec(res.rows[0]) : { id, plan: plan as Plan, createdAt: new Date().toISOString(), walletsCount: 0, usageToday: 0, usageLimit } as SessionRecord;
      })();
    },
    get(id) {
      return (async () => {
        const res = await pool.query(`SELECT * FROM sessions WHERE id = $1`, [id]);
        return res.rows[0] ? toRec(res.rows[0]) : undefined;
      })();
    },
    linkHandle(id, handle) {
      return (async () => {
        const res = await pool.query(`UPDATE sessions SET handle = $2 WHERE id = $1 RETURNING *`, [id, handle.toLowerCase()]);
        return res.rows[0] ? toRec(res.rows[0]) : undefined;
      })();
    },
    incrementUsage(id) {
      return (async () => { await pool.query(`UPDATE sessions SET usage_today = usage_today + 1 WHERE id = $1`, [id]); })();
    },
    setWalletsCount(id, count) {
      return (async () => { await pool.query(`UPDATE sessions SET wallets_count = $2 WHERE id = $1`, [id, count]); })();
    },
  };
}
