import type { Plan } from "@truthlayer/shared";

export interface SessionRecord {
  id: string;
  plan: Plan;
  handle?: string;
  createdAt: string;
  walletsCount: number;
  usageToday: number;
  usageLimit: number | null;
}

export interface SessionStore {
  create(params: { id: string; plan: Plan; usageLimit: number | null }): Promise<SessionRecord>;
  get(id: string): Promise<SessionRecord | undefined>;
  linkHandle(id: string, handle: string): Promise<SessionRecord | undefined>;
  incrementUsage(id: string): Promise<void>;
  setWalletsCount(id: string, count: number): Promise<void>;
}

export function createInMemorySessionStore(): SessionStore {
  const sessions = new Map<string, SessionRecord>();
  return {
    async create({ id, plan, usageLimit }) {
      const rec: SessionRecord = { id, plan, createdAt: new Date().toISOString(), walletsCount: 0, usageToday: 0, usageLimit };
      sessions.set(id, rec);
      return rec;
    },
    async get(id) { return sessions.get(id); },
    async linkHandle(id, handle) {
      const rec = sessions.get(id);
      if (!rec) return undefined;
      rec.handle = handle.toLowerCase();
      return rec;
    },
    async incrementUsage(id) { const rec = sessions.get(id); if (rec) rec.usageToday += 1; },
    async setWalletsCount(id, count) { const rec = sessions.get(id); if (rec) rec.walletsCount = count; },
  };
}
