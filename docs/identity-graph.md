# TruthLayer Identity Graph (Public)

The identity graph links **social identities** (X handles today; Farcaster and Lens later) to **on-chain identities** (wallets across supported chains). It is the foundation the overlay and the B2B API both read from.

The graph is built open: anyone can contribute their own link, anyone can claim a verified badge, anyone can submit a candidate link for someone else. Quality comes from the tier system — not every contribution carries equal weight.

This document describes the graph's structure and lifecycle. It does not describe the exact thresholds or heuristics used to infer, refresh, or defend it. Those live in internal specs.

## Trust tiers

| Tier | Label in UI | How it is established |
|------|-------------|-----------------------|
| **A** | verified | The user themselves proves ownership of both the handle and the wallet in a single session. |
| **B** | public proof | The handle has, in public, linked a specific wallet to itself, and that proof is still live. |
| **B+** | likely | Inferred automatically from combined independent signals. Always shown with a relative rank so the reader can weigh it. |
| **C** | unverified | Submitted but unproven. Shown de-emphasized; cannot be used as a basis for quantitative metrics. |

The overlay always renders the tier. A B+ conclusion is never silently presented as equivalent to A. A C-tier candidate is never quoted as if it were verified.

## Growth order

Strictly in this order. We do not skip phases.

1. **Seed.** A small, hand-curated set of well-known handles, used to bootstrap the system and to calibrate automated inference against known-good examples.
2. **Public-proof harvesting.** Background indexing of each handle's public statements to find explicit links they have already made. Promotes unverified candidates to B-tier.
3. **Self-onboarding at mass scale.** The product is not limited to influencers. Any user can claim their own handle-to-wallet links in a single flow, receive an A-tier verified badge, and be reflected in every overlay rendering of their posts. This is the primary growth lever.
4. **Context-match inference.** For handles that never self-onboard and never posted a public link, the system can infer likely wallets by combining several independent signals against the verified population. The result is displayed as B+ with a relative rank, never as A.
5. **Community contributions.** Any user can submit a candidate link. Submissions start as C-tier and move up only through independent corroboration.

## Mass-scale onboarding

Every crypto user, not only influencers, can prove they are who they say they are.

1. Sign in with their social account.
2. Connect one or more wallets across supported chains.
3. Sign a canonical message with each wallet that binds it to the session.
4. The link is recorded at A-tier and reflected in the overlay wherever their posts are read.

A user can attach multiple wallets to one handle with private labels (for example, trading / main / NFT). A user can detach any link at any time; detachment propagates into overlay responses within a short bounded window.

The same flow serves two purposes: the user gets an account with synced preferences; the graph gets a verified node. This is the single biggest driver of graph quality and is therefore the most important UX path in the product.

## Data model

```
identities
  id              uuid
  handle          text                              -- lowercased platform handle
  platform        text                              -- x | farcaster | lens
  display_name    text

wallets
  id              uuid
  chain           text                              -- supported chains
  address         text                              -- lowercase for EVM, native form for others
  first_seen_at   timestamptz

links
  identity_id     uuid references identities(id)
  wallet_id       uuid references wallets(id)
  tier            text                              -- 'A' | 'B' | 'B+' | 'C'
  confidence      numeric                           -- stored for B+; not exposed publicly
  source          text                              -- 'self_onboard' | 'public_proof' | 'context_match' | 'community' | 'name_service'
  proof_ref       text                              -- internal reference to the proof record
  status          text                              -- 'active' | 'pending' | 'decayed' | 'detached'
  created_at      timestamptz
  last_verified_at timestamptz
  (identity_id, wallet_id) unique
```

The public API never exposes the raw `confidence` field or the internal proof references. It exposes the tier and a relative rank label.

## Non-goals

- **Doxxing.** The graph links handles to wallets, not handles to real-world names. We never attempt to de-anonymize users who have not revealed themselves.
- **Legal identity verification.** We are not a KYC provider.
- **Permanence.** Links are not immutable. They are refreshed, decayed, and detachable on user request. An address that was A-tier yesterday because of a user's claim stops being A-tier the moment the user detaches it.
- **Cross-platform in v1.** X first. Farcaster and Lens integrations come after the X flow is stable.

## What is not in this document

Deliberately absent: the concrete thresholds for tier transitions, the specific signals used to infer B+, the time windows for re-verification, the exact rules that govern detachment propagation, and all anti-abuse heuristics. Those are in internal specs and evolve faster than this file.
