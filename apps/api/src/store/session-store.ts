// Session bookkeeping. The JWT itself carries the authoritative claims; this
// store holds derived counters (today's lookup usage, wallets linked, etc.)
// that are surfaced to the popup via /v1/session.
//
// In-memory for v1; swapped to Postgres + Redis counters in production.

import type { Plan } from "@truthlayer/shared";

export interface SessionRecord {
  id: string;
  plan: Plan;
  handle?: string;
  createdAt: string;
  walletsCount: number;
  usageToday: number;
  usageLimit: number | null; // null = unlimited
}

export interface SessionStore {
  create(params: { id: string; plan: Plan; usageLimit: number | null }): SessionRecord;
  get(id: string): SessionRecord | undefined;
  linkHandle(id: string, handle: string): SessionRecord | undefined;
  incrementUsage(id: string): void;
  setWalletsCount(id: string, count: number): void;
}

export function createInMemorySessionStore(): SessionStore {
  const sessions = new Map<string, SessionRecord>();

  return {
    create({ id, plan, usageLimit }) {
      const rec: SessionRecord = {
        id,
        plan,
        createdAt: new Date().toISOString(),
        walletsCount: 0,
        usageToday: 0,
        usageLimit,
      };
      sessions.set(id, rec);
      return rec;
    },
    get: (id) => sessions.get(id),
    linkHandle(id, handle) {
      const rec = sessions.get(id);
      if (!rec) return undefined;
      rec.handle = handle.toLowerCase();
      return rec;
    },
    incrementUsage(id) {
      const rec = sessions.get(id);
      if (!rec) return;
      rec.usageToday += 1;
    },
    setWalletsCount(id, count) {
      const rec = sessions.get(id);
      if (!rec) return;
      rec.walletsCount = count;
    },
  };
}
