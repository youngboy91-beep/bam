---
inclusion: always
---

# TruthLayer — Identity Graph Rules (Internal-Safe Summary)

Concrete thresholds live in `.kiro/internal/identity-graph.md` (not in the
public repository). Code must read values from that spec, not hard-code them.

## Trust tiers

Always surface one of four tiers: A, B, B+, C. A is the strongest. The
rendering rules are:

- **A, B, B+** are shown in their respective styles; B+ additionally carries
  a cohort-relative rank label.
- **C** is always de-emphasized and is never used as a basis for metrics.
- Never silently upgrade a lower tier to a higher one in the response.

## Growth order (strict)

Do not reorder without explicit approval.

1. Seed — hand-curated list.
2. Public-proof indexing.
3. Self-onboarding (the mass-scale hook). The product must never be limited
   to curated influencers.
4. Context-match inference for B+.
5. Community submissions.

## Data model invariants

- `(identity_id, wallet_id)` is unique in `links`.
- `confidence` is stored for B+, null for A and B.
- Every link records a `source`. Proof material is stored in a separate
  store and referenced by ID, not inlined.
- EVM addresses stored lowercase; Solana and TON in native form.

## Privacy

- Never link a wallet to a real-world identity. Only to a platform handle.
- Detachment propagates into the overlay within the bounded window specified
  internally.
- Self-onboarding is opt-in; bulk imports of third parties are not permitted
  into any tier above C.

## Chains in scope

Ethereum, Solana, Base, Arbitrum, BNB Chain, TON. New chains require a
dedicated address-format validator and RPC provider configuration.

## Public-doc rule

- `docs/identity-graph.md` must not specify thresholds, windows, or the
  content of signal calculations. Any PR that leaks specifics is rejected.
