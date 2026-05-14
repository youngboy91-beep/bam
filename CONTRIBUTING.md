# Contributing to TruthLayer

Thanks for considering a contribution. Read this first — it'll save you a round-trip in review.

## Before you start

1. **Read [`.kiro/steering/`](./.kiro/steering/)** — these are non-negotiable invariants. PRs that violate them are rejected.
2. **Open an issue first** for anything bigger than a one-line fix. We may already be working on it, or have reasons it isn't built yet.

## Workflow

```bash
# 1. Fork + clone
git clone https://github.com/YOUR-USERNAME/Truthlayer.git
cd Truthlayer

# 2. Branch
git checkout -b feat/your-thing

# 3. Install
npm install

# 4. Develop
npm run dev:all

# 5. Verify
npm run build
npm run typecheck
npm run smoke

# 6. Commit + push + open PR
```

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add B+ tier inference`
- `fix(extension): dot misaligned on quote tweets`
- `docs: clarify SIWE invariant`
- `chore(deps): bump fastify to 4.28.1`

## What we'll merge

- ✅ Bug fixes with reproduction steps
- ✅ New chain support (with verifier + tests)
- ✅ New external link providers
- ✅ Documentation improvements (without leaking thresholds)
- ✅ Performance improvements with measurements
- ✅ Accessibility fixes

## What we won't merge

- ❌ Numbers, thresholds, formulas, model weights in `docs/`
- ❌ Raw signal fields in consumer `/v1/score` response
- ❌ External URLs fetched from API instead of build-time constants
- ❌ Per-tweet React roots for hover card (one shared host only)
- ❌ Reintroducing the always-visible full-width overlay
- ❌ Invite-only consumer distribution proposals

## Code style

We use TypeScript strict mode. Prettier is enforced via `npm run typecheck`. Aim for readable code over clever — nobody on the team can hold a 12-step monad in their head.

## Testing philosophy

Smoke tests are the floor, not the ceiling. If you add new behaviour, add a smoke test. If you change scoring, bump `SCORING_VERSION`.

## Questions?

Open a [GitHub Discussion](https://github.com/miraekims/Truthlayer/discussions) or comment on an existing issue.
