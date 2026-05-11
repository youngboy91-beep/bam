---
inclusion: always
---

# TruthLayer — Identity Graph Rules

When working on anything related to linking social handles to on-chain addresses, follow these invariants.

## Trust tiers

Always present one of four tiers in any UI or API response:

- **A (verified)** — wallet-signed message + Twitter OAuth session match, OR ENS/SNS equivalent.
- **B (public proof)** — KOL themselves posted a tx link / address screenshot / portfolio link.
- **B+ (likely, N%)** — context-match from NLP + on-chain co-activity; always display the confidence percentage.
- **C (unverified)** — community-submitted, no proof yet; always de-emphasized in UI.

Never present a lower tier as if it were a higher tier. Context-match (B+) is never silently promoted to A.

## Growth order (strict)

Features should be built in this order; do not skip ahead without explicit approval:

1. Seed curated list (`data/kol-seed.json`).
2. Public-proof scraper (tx links + ENS/SNS in bios).
3. **Self-onboarding for ANY user** (SIWE / SIWS + X OAuth). This is the mass-scale hook — the product must not be limited to influencers.
4. Context-match model for B+ inference.
5. Community submissions with upvotes.

## Data model invariants

- `(identity_id, wallet_id)` is unique in the `links` table.
- `confidence` is required for B+ links (0..1), null for A and B.
- Every link must record a `source` and a `proof_url` (or proof blob).
- Addresses are always stored lowercase for EVM chains, base58 as-is for Solana/TON.

## Privacy

- Never link a wallet to a real-world identity. Only to a platform handle.
- Do not attempt to de-anonymize anons who have not self-revealed.
- Self-onboarding is fully opt-in. A user can detach a link at any time; detachment removes it from future overlay responses within 1 hour.

## Chains in scope (ordered by priority)

Ethereum, Solana, Base, Arbitrum, BNB Chain, TON. Each new chain requires its own address-format validator and RPC provider in config.
