---
inclusion: always
---

# TruthLayer — Claim Flow and Session Invariants

Concrete windows, cooldowns, and rate-limit values live in
`.kiro/internal/abuse-defenses.md` and `.kiro/internal/identity-graph.md`.
Code reads them from config; it does not hard-code values.

## Canonical message

- The signed message is constructed ONLY via `buildClaimMessage` from
  `@truthlayer/shared`. Clients must not template the message locally.
- The server builds the message when issuing a nonce, stores it, and
  requires an exact equality check on submit. Any drift — extra
  whitespace, reordered fields, different ISO timestamp format — is a
  rejected claim.
- Changes to the message format require bumping `SCORING_VERSION` and
  coordinating an extension release. Old extensions must keep working
  for a bounded deprecation window.

## Nonce lifecycle

- Nonces are single-use, bounded-TTL, and scoped to the triple
  `(handle, chain, address)`.
- Issuing a fresh nonce for a triple that already has a live nonce
  invalidates the older nonce. Only the latest is valid.
- A submit that consumes a nonce marks it used atomically; replays are
  rejected with the same category-level error as any other bad claim.

## Signature verification

- EVM chains: EIP-191 `personal_sign`, signature recovers to the
  declared address (lowercased comparison).
- Solana: Ed25519 over UTF-8 bytes of the message; signature encoded as
  base58.
- Smart-contract wallets (non-65-byte EVM signatures) enter a separate
  delayed-challenge path. They do not get A-tier on first submit.

## Session model

- Extension obtains an anonymous JWT on install and on startup. No user
  action required. Refreshed when less than one day remains.
- JWT is stored in `chrome.storage.local` under `tl_session`.
- Every request from the background worker attaches
  `Authorization: Bearer <token>`. The content script never touches the
  token.
- Web `/claim` page keeps the token in `localStorage` under the same
  key. When a user claims on the web, the token upgrades from anonymous
  to account-linked; no new JWT is minted just for that transition (the
  same `sub` remains, the `plan` shifts on the server side).

## Error responses

- Claim failures return HTTP 403 with a category-level message
  ("rejected", "unauthenticated"). The server MUST NOT reveal which
  individual check failed; defense-in-depth implies silence per
  `.kiro/steering/abuse.md`.
- The web `/claim` page shows a neutral toast and keeps the user on the
  step; no retry hints that would let an attacker iterate.

## What never leaks via this flow

- No nonces observable to parties other than the requesting session.
- No enumeration of existing handles. A request for a nonce against a
  handle the user does not own proceeds normally; only the submit step
  checks handle ownership via Twitter session.
- No PII. The server only stores (handle, chain, address, tier, source,
  timestamps, proof reference). Real-world names, emails, IPs are not
  joined to the identity graph.

## Never-merge rules

- Do not accept signatures built against a client-templated message.
  Always echo back the server's `message` field.
- Do not expose nonce TTL, replay window, or rate-limit values in error
  responses or logs. Those are internal.
- Do not upgrade a session from anonymous to account-linked without a
  successful signature verification. No "trust me" paths.
