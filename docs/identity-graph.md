# TruthLayer Identity Graph

The identity graph is the core IP of TruthLayer: it links **social identities** (X/Twitter handles, later Farcaster, Lens) to **on-chain identities** (wallet addresses across supported chains).

Without a reliable graph, the overlay has nothing to say. With a reliable graph, every other feature (KOL reality check, shill history, PnL after calls) becomes possible.

## Trust tiers

| Tier | Label in UI | How it's established | Confidence |
|------|-------------|----------------------|------------|
| **A** | verified | Wallet-signed message + Twitter OAuth session, OR ENS/SNS name matching handle claims | ~100% |
| **B** | public proof | KOL has publicly posted a tx link, screenshot with full address, or linked portfolio tool showing the wallet | ~90% |
| **B+** | likely (NN%) | Context-match: NLP similarity of posts + on-chain co-activity with A-tier patterns on the same token/narrative | 60-85% (shown as % in UI) |
| **C** | unverified | Community-submitted, no on-chain or contextual proof yet | shown but de-emphasized |

The overlay **always** renders the tier so the user can decide how much weight to give the data. A KOL's rating from a B+ link is never presented as equivalent to an A-tier link.

## Growth strategy (ordered)

### Phase 1 — Seed (this repo)
~40 hand-curated entries in `data/kol-seed.json`. Covers the most-read handles across Ethereum core, Solana core, trader alpha, DeFi, NFT, research. Used to:
- Demo the overlay with real data on day 1.
- Calibrate the context-match model (phase 4) against known-good examples.

### Phase 2 — Public-proof scraper
Background job queries each handle's recent X history and extracts:
- Links to `etherscan.io/tx/0x...`, `solscan.io/tx/...`, `arbiscan.io/...`, etc.
- ENS/SNS names (`.eth`, `.sol`) in bio and pinned tweets.
- Screenshots containing full wallet addresses (OCR, later phase).

Each hit promotes a handle from C to B automatically. Human review required to promote B -> A.

### Phase 3 — Self-onboarding (MASS SCALE)
The product must work for **every crypto user**, not just top influencers. Public page at `truthlayer.app/claim`:

1. "Sign in with X" (OAuth)
2. "Connect wallet" (EIP-4361 Sign-In-With-Ethereum or SIWS for Solana)
3. Sign a canonical message: `I am @{handle} and I control {address}. Timestamp: {ts}. Nonce: {n}.`
4. We verify the signature against the address, and the OAuth session against the handle.
5. Link stored as A-tier, visible in the overlay for anyone who reads this user's tweets.

Zero friction, zero cost. Open to anyone who wants to prove they are who they say they are. A user can attach multiple wallets to one handle (trading wallet, main wallet, NFT wallet) with labels.

### Phase 4 — Context-match (B+ tier)
For handles that never self-onboard and never posted a tx link, we can still infer likely wallets:

1. For every A-tier KOL, collect their post embeddings (narrative, tokens mentioned, timing) and their wallet on-chain activity (which tokens they bought/sold and when).
2. For an unverified handle H claiming wallet W, compute:
   - Semantic similarity of H's posts to known A-tier patterns on the same tokens.
   - Temporal correlation between H's posts about token T and W's buy/sell of T.
3. If both signals pass threshold, suggest W as B+ link with a confidence score.
4. Never auto-promote to A. Only the user themselves (via phase 3) or a public proof (phase 2) can reach A.

This is the key differentiator: competitors either have curated closed lists (Nansen, Arkham) or nothing. We have a statistically-inferred open graph.

### Phase 5 — Community submissions
Any extension user can submit a link `handle -> address` with a reason. Stored as C tier. Upvotes + any on-chain proof advance it toward B.

## Data model (sketch)

```
identities
  id              uuid
  handle          text        -- x.com handle, lowercase
  platform        text        -- 'x' | 'farcaster' | 'lens'
  display_name    text

wallets
  id              uuid
  chain           text        -- 'ethereum' | 'solana' | 'base' | 'arbitrum' | 'bnb' | 'ton'
  address         text
  first_seen_at   timestamptz

links
  identity_id     uuid
  wallet_id       uuid
  tier            text        -- 'A' | 'B' | 'B+' | 'C'
  confidence      numeric     -- 0..1, null for A/B
  source          text        -- 'self_onboard' | 'ens' | 'public_tx' | 'context_match' | 'community'
  proof_url       text        -- tx hash, tweet URL, signature, etc.
  created_at      timestamptz
  (identity_id, wallet_id) unique
```

## Non-goals (MVP)

- **Doxxing.** We only link handles to addresses the user has themselves made public, or that are inferable from public context. We do not attempt to de-anonymize users who haven't revealed anything.
- **Legal identity.** We do not link wallets to real-world names. Only to handles.
- **Cross-platform for v1.** Phase 3 starts with X only; Farcaster and Lens come later.
