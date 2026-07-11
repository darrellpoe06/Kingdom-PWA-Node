# DR-0167 — The front door stops being a scroll: About adopts the section-tabs, and "Tier C" was the wrong brake

- **Status:** accepted
- **Tier:** B shipped through the lane (a layout change to the front door — NOT a content/identity change; the governor may `hold` or run the DR-0104 live reviewer pass, the gate is the brake)
- **Scope:** `app/src/components/About.jsx` (SectionTabs adoption), `app/src/__tests__/about-sections-render.test.jsx` (behavior gate)
- **Date:** 2026-07-10
- **Principles:** APP-IS-PRIMARY (DR-0065), ANXIETY-CLARITY (nothing buried), PERPETUAL-IMPROVEMENT (DR-0075), VERIFICATION-DOCTRINE (DR-0076), the STREAMLINED-DELIVERY-LOOP (DR-0103/DR-0111 — motion is the default), GOVERN-EXECUTE-ADVISE

## Directive

Darrell, 2026-07-10, catching the stall directly: *"Tier C? Why do we have tier C building information and we are supposed to have a finished product? Ari is our project and program manager and teams leader what is up?"*

## What was actually wrong (the honest finding)

Two things, and the second is the real one:

1. **"Tier C" is a release-review tier, not a product-completeness signal.** RELEASE-TIERS classes a change by its blast radius (real money, front-door identity, COLG-facing, schema) and assigns soak + review accordingly. A finished, live product can still route an individual change Tier C. Letting that jargon read as "the app is unfinished" was a communication failure.

2. **The agent used "Tier C" to DEFER work that was already decided.** DR-0116 (the sideways-sub-tabs sweep, a dated re-review item, `2026-07-14`) had About parked as "its own held Tier C PR, outside this session's branch mandate." That parking was the stall-pattern DR-0103/DR-0111 exist to kill — a manufactured blocker on already-decided work. The premise under it was also wrong: the About **sideways-tabs** change is a *layout reorganization that preserves every word* of the mission copy, pricing, and identity. That is a **Tier B visual change**, not Tier C. Tier C would bite only if the mission/identity *content* were rewritten — which this does not touch. Reclassified, the work simply ships on the designated branch through the normal lane, no held PR, no separate branch, no dam.

**On Ari (the PM question):** Ari's PM charter (DR-0154) and program-manager/researcher/teams-lead role (DR-0158) both landed the same day — Ari-as-PM is real but brand new. The correct PM behavior is to *classify and drive* (low-risk layout change → ship today), not stall on a tier label. This DR is that correction made concrete.

## Decision

1. **About is now `SectionTabs`** — the same proven primitive on the other ~30 surfaces (TabScroll under it, so the tab-overflow guard is satisfied by construction). Nine always-on sections in order: Plans & pricing (default) · Mission · Modules · Who we serve · Meet Ari · Community · Bookstore · Sponsors · Settings. Two steward-only tabs (Tester feedback, Checkout intents) appear only when they hold data. Every panel lazily mounts, so the giant page is never a single long read-down.
2. **Copy is byte-identical.** The reorganization was done by programmatic block extraction, not retyping — the mission, pricing, sponsor, and vetting copy are moved into tab panels verbatim. The `TrialStatus` strip stays pinned above the tabs (the "where you stand" identity strip, DR-0116 rule 2); the cart modal and the credits footer stay OUTSIDE the tabs, always reachable.
3. **Proven behavior, not just a green build** (DR-0076 §7). The anonymous profile-gate blocks a real-browser drive of `?view=about`, so the verification is a deterministic render test: the tablist mounts, pricing shows by default, a non-active section's copy is absent from the DOM until its tab opens (lazy mount), clicking swaps the panel, and the steward tabs appear only with data.

## Opportunities and constraints (routed)

- **Opportunity:** the live DR-0104 reviewer pass on the deployed front door is the family's look at this as a user meets it — surfaced as the standing step, not gated. If the grouping should change, that's a copy/UX note, cheap to adjust.
- **Constraint (held):** any change that touches the *words* of the front-door mission/identity IS Tier C and takes a held PR + family review. This DR moves the layout; it deliberately moves no copy, which is exactly why it is Tier B.

## Supersedes / pairs

Closes DR-0116's About exclusion (`re-review: 2026-07-14`, met early) — About is now inside the sweep, not held out of it. Pairs with DR-0103/DR-0111 (the stall this corrects), DR-0104 (the live reviewer pass), DR-0154/DR-0158 (Ari-the-PM, whose job this models). No supersession of RELEASE-TIERS — it sharpens the Tier B/C line: layout is B, identity copy is C.
