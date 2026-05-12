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
  recordSelfOnboard(params: { handle: string; chain: Chain; address: string }): Promise<IdentityLink>;
  listLinksForHandle(handle: string): Promise<IdentityLink[]>;
  detach(params: { handle: string; chain: Chain; address: string }): Promise<boolean>;
  totalLinks(): Promise<number>;
}

function normalize(chain: Chain, address: string): string {
  const evm = ["ethereum", "base", "arbitrum", "bnb"].includes(chain);
  return evm ? address.toLowerCase() : address;
}

export function createInMemoryIdentityStore(): IdentityStore {
  const links = new Map<string, IdentityLink>();
  const key = (handle: string, chain: Chain, address: string) =>
    `${handle.toLowerCase()}|${chain}|${normalize(chain, address)}`;

  return {
    async recordSelfOnboard({ handle, chain, address }) {
      const now = new Date().toISOString();
      const link: IdentityLink = {
        handle: handle.toLowerCase(), chain, address: normalize(chain, address),
        tier: "A", source: "self_onboard", createdAt: now, lastVerifiedAt: now,
      };
      links.set(key(handle, chain, address), link);
      return link;
    },
    async listLinksForHandle(handle) {
      const h = handle.toLowerCase();
      return [...links.values()].filter((l) => l.handle === h);
    },
    async detach({ handle, chain, address }) {
      return links.delete(key(handle, chain, address));
    },
    async totalLinks() { return links.size; },
  };
}
