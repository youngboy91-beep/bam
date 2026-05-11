# TruthLayer — Release Strategy (Public)

TruthLayer ships in three distinct phases. Each phase has a different audience, a different distribution channel, and a different risk profile. We do not skip phases. The rationale is operational, not marketing: each phase surfaces specific categories of bugs that the next phase depends on being resolved.

This document describes what each phase is for, what it delivers, and how we decide when to move from one to the next. It does not publish internal targets, specific thresholds, or defensive specifics. Those live in internal specs.

## Phase 1 — Private beta

**Audience.** A small group of invited users, primarily active crypto traders and contributors who agreed to provide structured feedback.

**Distribution.** The extension is shipped as an unpacked build distributed directly. It is not in any public store. Each build carries a `dev` manifest pointing at a non-production API.

**What we deliver.**

- The overlay on X/Twitter with the three signal cells.
- Self-onboarding flow for the identity graph. Beta users become the first A-tier verified nodes.
- Instrumentation to capture structured bug reports in one click.
- A community channel run directly by the founder, used for feedback and roadmap visibility.

**What we explicitly do not do.**

- No paid plans. Everyone in private beta is on a free plan with a higher usage allowance than public users will get.
- No B2B outreach. B2B conversations are pointless without a public install count.
- No public marketing. Screenshots and quotes from private beta may not be reproduced externally without explicit consent.

**Exit criteria (qualitative; numeric targets are internal).**

- The overlay renders correctly on all common tweet layouts observed in beta.
- The claim flow has been completed end-to-end by a non-trivial fraction of invited users without support intervention.
- The A-tier reference population is large enough that B+ inference can be evaluated against it.
- Zero open P0 issues.

## Phase 2 — Public launch

**Audience.** Anyone interested in using the overlay or claiming a verified identity.

**Distribution.** Chrome Web Store as the primary channel. Firefox Add-ons as a secondary channel after Chrome is stable. The extension build carries the production manifest pointing at the production API only; no development origins are permitted in a publicly-distributed build.

**What we deliver.**

- Everything in Phase 1, plus paid Pro tier over Stripe.
- Rate limits and plan enforcement are enforced server-side.
- Public documentation covering how the product works at the principle level.
- The founder channel remains the primary community home.

**Growth mechanics (public).**

The overlay itself is the growth engine. A reader sees a tweet with "no verified wallet" rendered next to it, shares the screenshot, and the shared post drives the original author to claim. Each claim creates one more reader of the extension and one more verified node in the graph. We do not rely on paid acquisition during Phase 2.

**What we explicitly do not do.**

- No partner API. The partner API exists as a codepath, but access is not offered to external partners until Phase 3.
- No mobile app. Mobile is out of scope for v1.
- No token. Paid tiers are USD only via Stripe.

**Exit criteria (qualitative).**

- The public store presence has reached a level of installs at which B2B partners treat us as a credible product rather than a prototype.
- Scoring has been stable across a scoring-version bump with no visible user impact (proof that the versioning mechanism works in production).
- Public postmortems exist for any P0 incidents, and trust has accumulated as a result.

## Phase 3 — Partner platform

**Audience.** Wallets, exchanges, screeners, and analytics products that want to consume the identity graph and signal surface on behalf of their own users.

**Distribution.** Metered API plus a partner dashboard on a dedicated subdomain. Enterprise partners receive dedicated instances under contract.

**What we deliver.**

- Public pricing tiers for Startup and Growth plans.
- Custom contracts and SLAs for Enterprise.
- Raw signal values for partners who contractually need them (never on the public consumer API).
- White-label and badge-embedding options for wallets and exchanges.

**B2B sales motion.**

Initial outreach targets three integrations that independently justify a contract: a wallet displaying our verification badge on a recipient address, an exchange displaying a tier label on a withdrawal screen, and a screener adding our social-layer column to a token page. Each of these is a discrete integration with a discrete purchase decision; we do not sell a generic "platform".

## What we do not disclose publicly

- Per-phase user-count or revenue targets.
- Internal conversion benchmarks.
- The specific providers we rely on for on-chain data, price data, social data, or identity verification.
- The defensive rules used to keep the graph honest under growth.

These are in internal specs and evolve as we learn.

## Why the three-phase sequence

Each phase tests something the next phase depends on:

- **Phase 1** tests whether the claim flow and the overlay work on real infrastructure with real users. Private distribution limits blast radius.
- **Phase 2** tests whether the server-side scoring, identity graph, and rate limiting hold under open-internet traffic and a public attack surface. Mass adoption is the only realistic load test.
- **Phase 3** tests whether the B2B contract shape is viable. B2B is only feasible after Phase 2 has generated the credibility and graph quality that partners will actually pay for.

Skipping a phase would mean relying on untested infrastructure at the next level of scrutiny. We do not do that.
