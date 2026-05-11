// Single-use nonces for the claim flow.
//
// Invariants (see .kiro/steering/identity-graph.md and abuse.md):
//   1. A nonce is valid for one (handle, chain, address) triple only.
//   2. A nonce is valid for a bounded, short window after issue.
//   3. A nonce is consumed on first successful claim submit; a second
//      submit with the same nonce is rejected.
//   4. Generating two nonces for the same triple in rapid succession is
//      explicitly allowed — the user may have reloaded the page — but only
//      the most recent nonce is valid.
//
// Backing store is in-memory for v1. Production swaps to Redis with the
// same interface. No business thresholds live here.

import { randomBytes } from "node:crypto";

const TEN_MINUTES_MS = 10 * 60 * 1000;

export interface NonceRecord {
  nonce: string;
  issuedAt: string; // ISO 8601
  handle: string;
  chain: string;
  address: string;
  expiresAtMs: number;
  consumed: boolean;
}

export interface NonceStore {
  issue(params: {
    handle: string;
    chain: string;
    address: string;
  }): NonceRecord;
  lookup(nonce: string): NonceRecord | undefined;
  consume(nonce: string): NonceRecord | undefined;
  // Test hook: allow the tests to inspect current state.
  _size(): number;
}

function cleanExpired(map: Map<string, NonceRecord>) {
  const now = Date.now();
  for (const [k, v] of map) if (v.expiresAtMs < now) map.delete(k);
}

export function createInMemoryNonceStore(ttlMs = TEN_MINUTES_MS): NonceStore {
  const store = new Map<string, NonceRecord>();
  // Index: triple -> current nonce string (so prior nonces for the same
  // triple get shadowed, though they remain in the store until TTL).
  const byTriple = new Map<string, string>();

  const tripleKey = (handle: string, chain: string, address: string) =>
    `${handle.toLowerCase()}|${chain}|${address.toLowerCase()}`;

  return {
    issue({ handle, chain, address }) {
      cleanExpired(store);
      const nonce = randomBytes(16).toString("hex");
      const issuedAt = new Date().toISOString();
      const rec: NonceRecord = {
        nonce,
        issuedAt,
        handle: handle.toLowerCase(),
        chain,
        address,
        expiresAtMs: Date.now() + ttlMs,
        consumed: false,
      };
      store.set(nonce, rec);
      byTriple.set(tripleKey(handle, chain, address), nonce);
      return rec;
    },
    lookup(nonce) {
      cleanExpired(store);
      return store.get(nonce);
    },
    consume(nonce) {
      cleanExpired(store);
      const rec = store.get(nonce);
      if (!rec) return undefined;
      if (rec.consumed) return undefined;
      if (rec.expiresAtMs < Date.now()) return undefined;
      // Only the latest nonce for a triple is valid; older ones are rejected.
      const latest = byTriple.get(
        tripleKey(rec.handle, rec.chain, rec.address),
      );
      if (latest !== nonce) return undefined;
      rec.consumed = true;
      return rec;
    },
    _size: () => store.size,
  };
}
