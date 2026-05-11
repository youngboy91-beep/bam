import type { Pool } from "pg";
import type { Chain, IdentityTier } from "@truthlayer/shared";
import type { IdentityLink, IdentityStore } from "./identity-store.js";

function norm(chain: string, address: string): string {
  const evm = ["ethereum", "base", "arbitrum", "bnb"].includes(chain);
  return evm ? address.toLowerCase() : address;
}

export function createPgIdentityStore(pool: Pool): IdentityStore {
  return {
    recordSelfOnboard({ handle, chain, address }) {
      const h = handle.toLowerCase();
      const addr = norm(chain, address);
      return (async () => {
        const idRes = await pool.query(
          `INSERT INTO identities (handle, platform) VALUES ($1, 'x')
           ON CONFLICT (handle, platform) DO UPDATE SET handle = EXCLUDED.handle RETURNING id`,
          [h],
        );
        const wRes = await pool.query(
          `INSERT INTO wallets (chain, address) VALUES ($1, $2)
           ON CONFLICT (chain, address) DO UPDATE SET chain = EXCLUDED.chain RETURNING id`,
          [chain, addr],
        );
        await pool.query(
          `INSERT INTO links (identity_id, wallet_id, tier, source, status, last_verified_at)
           VALUES ($1, $2, 'A', 'self_onboard', 'active', now())
           ON CONFLICT (identity_id, wallet_id)
           DO UPDATE SET tier = 'A', source = 'self_onboard', status = 'active', last_verified_at = now()`,
          [idRes.rows[0].id, wRes.rows[0].id],
        );
        const now = new Date().toISOString();
        return { handle: h, chain: chain as Chain, address: addr, tier: "A" as IdentityTier, source: "self_onboard" as const, createdAt: now, lastVerifiedAt: now };
      })();
    },
    listLinksForHandle(handle) {
      const h = handle.toLowerCase();
      return (async () => {
        const res = await pool.query(
          `SELECT w.chain, w.address, l.tier, l.source, l.created_at, l.last_verified_at
           FROM links l JOIN identities i ON i.id = l.identity_id JOIN wallets w ON w.id = l.wallet_id
           WHERE i.handle = $1 AND i.platform = 'x' AND l.status = 'active'`,
          [h],
        );
        return res.rows.map((r: any) => ({
          handle: h, chain: r.chain as Chain, address: r.address,
          tier: r.tier as IdentityTier, source: r.source,
          createdAt: r.created_at, lastVerifiedAt: r.last_verified_at,
        }));
      })();
    },
    detach({ handle, chain, address }) {
      return (async () => {
        const res = await pool.query(
          `UPDATE links SET status = 'detached'
           WHERE identity_id = (SELECT id FROM identities WHERE handle = $1 AND platform = 'x')
             AND wallet_id = (SELECT id FROM wallets WHERE chain = $2 AND address = $3)
             AND status = 'active'`,
          [handle.toLowerCase(), chain, norm(chain, address)],
        );
        return (res.rowCount ?? 0) > 0;
      })();
    },
    totalLinks() {
      return (async () => {
        const res = await pool.query(`SELECT count(*)::int as c FROM links WHERE status = 'active'`);
        return res.rows[0].c;
      })();
    },
  };
}
