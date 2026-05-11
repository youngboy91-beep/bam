# TruthLayer — Abuse Resistance (Public)

This document explains **what TruthLayer defends against** and the principles those defenses follow. It deliberately does not describe specific rules, thresholds, detection windows, feature names, or models. Publishing those would tell attackers how to stay under the line. Internal specs track them and evolve faster than this file.

If the protection landscape described here sounds abstract — that is the point. Defense in depth only works if the layers are not individually known.

## What we defend against

TruthLayer surfaces reputation-weighted information about people who move real money. Anyone who benefits from a misleading tier, score, or verdict has an incentive to attack the system. We classify these into nine families:

1. **Farm-wallet claims.** Attempting to obtain a high tier using a wallet with no meaningful history.
2. **Handle rotation.** Attempting to amplify a single wallet's reputation across many social handles.
3. **Session hijacks.** Attempting to claim a wallet for a handle while transiently in control of the handle's session.
4. **Self-front-running.** Buying a token on an unlinked wallet, promoting it from a linked one, and dumping on the unlinked wallet.
5. **Sybil flooding.** Creating large numbers of synthetic handles and wallets to overwhelm the verified population and skew inference.
6. **Self-dealing price signals.** Using related wallets to transact against the attacker's own trades, inflating the appearance of profitable calls.
7. **Proof decay exploits.** Publishing a proof to achieve a tier, then quietly removing it while the reputation persists.
8. **Inference gaming.** Shaping posts or on-chain activity to mimic the statistical pattern of verified participants without having actually done the work.
9. **Smart-contract wallet exploits.** Claiming a contract-controlled wallet during a temporary window of signing authority the attacker does not durably hold.

For each family, there is a named internal response playbook that combines several independent checks. No single heuristic carries the defense alone; circumventing one layer does not defeat the others.

## Defense principles

The same principles apply across all nine families. They describe how the system thinks, not which specific rules it uses.

**Defense in depth.** Every attack class is countered by at least two independent signals. Signals are drawn from different domains — cryptographic, temporal, behavioral, network-topology — so that compromising one does not cascade. A claim passing one layer is not claimed; it is merely not rejected by that layer.

**Deterministic tiering, non-deterministic timing.** The mapping from evidence to tier is deterministic and versioned. The *when* of re-checks, cohort recomputation, and decay application is not. An attacker cannot align their actions to a verification window if the verification window is not fixed.

**Cohort-relative ranking.** Public-facing confidence is relative to a cohort, not absolute. A bot farm that manages to raise its raw signal score still has to do it faster than the cohort moves — and the cohort is a moving target.

**Prefer refusal over approximation.** If evidence is weak, we show "insufficient data" rather than a guess. Attackers cannot extract ranks by submitting many near-valid candidates; they extract silence. This is worse feedback for them than a number would be.

**Decay over punish.** A compromised or gaming account is not banned; its score decays. There is nothing to appeal against and nothing to prove offline. The attacker receives no signal about what triggered the decay, because no single input "triggered" it.

**Network-scope signals.** Many attacks require coordination: shared funders, shared timing, shared post patterns. The graph sees coordination as a topological signature and treats it with suspicion, even if every individual actor looks clean in isolation.

**Cooldowns on structural changes.** Actions that alter how a handle is represented — attaching a new wallet after detachment, shifting primary wallet, changing labels — take effect after a bounded delay. Attackers who rely on rapid rotation lose their window; legitimate users rarely notice.

**Signed and replayed on a pinned block.** For wallets under complex authorization models (multi-sig, smart-contract wallets), proof is reverified at a later block height before the claim promotes to a durable tier. A transient signing authority is not enough.

**Decoupled proofs from display.** Tier display lags proof acceptance by a bounded delay for out-of-band confirmation (email, device, re-signature). An attacker who controls a session for a short window cannot convert it into a publicly-visible badge before that window closes.

## What users experience

These defenses are designed to be invisible to legitimate users. The honest flow is:

1. Sign in.
2. Connect wallet(s).
3. Sign the binding message once per wallet.
4. A-tier badge appears, typically within a short bounded window.

If any layer fires, the user sees a clear message — "this wallet does not yet have enough history for a verified badge", "a confirmation was sent to your device", "a re-signature is required in 24 hours" — without disclosing *why* the specific layer fired. The message is always the same for a given category, so correlation between action and defense is not observable.

## What users can do if something seems wrong

- **Wait.** Many defenses resolve themselves after a bounded delay once secondary evidence accumulates.
- **Complete confirmation steps** delivered out-of-band.
- **Appeal** via the support channel. Appeals are reviewed against the internal specs; they are not a debugging tool, and resolutions do not explain which rule fired.

## What we promise

- Legitimate users reach A-tier with a single session of good-faith actions.
- The system never publishes the rules attackers would need to tune against them.
- Defenses evolve. The set of rules in place today is not the set in place next month.
- Nothing in this document is load-bearing. An attacker who memorizes it learns nothing they can use.

## Related

The attacks, layers, and thresholds are specified in internal specs maintained outside the public repository. Access is limited to the engineering team under NDA.
