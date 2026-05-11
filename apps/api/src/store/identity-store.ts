// Identity graph storage. Interface is Postgres-ready; v1 ships with an
// in-memory implementation so the API has zero external dependencies during
// initial development.
//
// Invariants enforced here (see .kiro/steering/identity-graph.md):
//   - (identity_id, wallet_id) unique.
//   - Addresses: lowercase for EVM; Solana/TON stored in native form.
//   - A-tier requires verified signature AND verified handle; this module
//     does NOT verify either — it records the resulting link. Verification
//     is the route's responsibility.

import type { Chain, IdentityTier } from "@truthlayer/shared";

export interface IdentityLink {
  handle: string;
  chain: Chain;
  address: string;
  tier: IdentityTier;
  source: "self_onboard" | "public_proof" | "context_match" | "community" | "name_service";
  createdAt: string;
  lastVerifiedAt: string;
}

export interface IdentityStore {
  /** Record a new A-tier link from self-onboarding. Idempotent on the triple. */
  recordSelfOnboard(params: {
    handle: string;
    chain: Chain;
    address: string;
  }): IdentityLink;

  listLinksForHandle(handle: string): IdentityLink[];

  /** Detach a wallet from a handle. Propagates into overlay within bounded window. */
  detach(params: {
    handle: string;
    chain: Chain;
    address: string;
  }): boolean;

  /** For tests / dashboards. */
  totalLinks(): number;
}

function normalize(chain: Chain, address: string): string {
  // EVM chains: lowercase. Others keep native form.
  const evm = chain === "ethereum" || chain === "base" || chain === "arbitrum" || chain === "bnb";
  return evm ? address.toLowerCase() : address;
}

export function createInMemoryIdentityStore(): IdentityStore {
  // key: handle.toLowerCase() | chain | normalizedAddress
  const links = new Map<string, IdentityLink>();

  const key = (handle: string, chain: Chain, address: string) =>
    `${handle.toLowerCase()}|${chain}|${normalize(chain, address)}`;

  return {
    recordSelfOnboard({ handle, chain, address }) {
      const now = new Date().toISOString();
      const link: IdentityLink = {
        handle: handle.toLowerCase(),
        chain,
        address: normalize(chain, address),
        tier: "A",
        source: "self_onboard",
        createdAt: now,
        lastVerifiedAt: now,
      };
      links.set(key(handle, chain, address), link);
      return link;
    },
    listLinksForHandle(handle) {
      const h = handle.toLowerCase();
      return [...links.values()].filter((l) => l.handle === h);
    },
    detach({ handle, chain, address }) {
      return links.delete(key(handle, chain, address));
    },
    totalLinks: () => links.size,
  };
}
