# DR-0104 — Review the live production push as a user (reviewer mode is always available)

- **Status:** accepted
- **Tier:** B (new steward surface; feature-branch preview soak, then merge — shipped in PR #590)
- **Scope:** every production push; the family stewards (Darrell + Christina) as reviewers
- **Date:** 2026-07-05
- **Principles:** REVIEW-LIVE-PUSH, VERIFICATION-DOCTRINE, EXECUTION-OUTCOME-OBSERVABILITY, RELEASE-TIERS, APP-IS-PRIMARY, REALITY-TRACE, DECISION-RECORDS

## Directive

Darrell, 2026-07-05:

> "We need the ability to see the updated apps from the admins side, currently we only see our version of the PoeTech App build and we need to be reviewers also so give us a users view that mimics the users identically so we can test like a review after pushing to production because our parameters make sure it is a sound build."

And, asked when the reviewer view should be usable:

> "1. Always. Document that inside PoeTech and claude. Asap. We review the live new production push."

## Decision

**Reviewer mode is a permanent, always-available steward affordance — and the family reviews every live new production push through it.** Two facets, both standing:

1. **Always available.** "Review as a user" lives in **Admin → Actions** as a permanent, preview-then-execute action (not a temporary/experimental toggle). It is never gated behind a flag, a season, or a build. Any steward, any time, can drop into the exact signed-in-user experience and step back out.

2. **The standing review pass.** After a change is pushed to production (poetech.us), the stewards do not trust it on the developer's/owner's own privileged view — they enter reviewer mode and confirm the change on the **live production build, as a user actually sees it**: a fresh user's empty world, the user's real tier, sanitized names, no steward tabs. This is EXECUTION-OUTCOME-OBSERVABILITY made a human habit: system-up ≠ product-correct, so the family observes the live product behavior on the surface the user meets, not the one the owner meets.

## How it works (the mechanism shipped in PR #590)

A per-device flag (`poe-reviewer-mode`) flips the shell's boot into the exact non-family user path — the mechanism, safety model, and evidence are the body of PR #590 and `app/src/lib/reviewer-mode.jsx`. The one law: **strictly narrowing** — the flag can only hide steward privilege, never grant any, and every write path to the steward's real data is suppressed while it is on (source-pinned by `app/src/__tests__/reviewer-mode.test.js`, proven-to-catch). RLS remains the actual data gate (DR-0060).

## Documented in two places (per the directive)

- **claude (Layer 0):** `CLAUDE.md` — the "Review the Live Production Push" binding rule, so the practice loads first, every session, and the agent proposes/performs the live user-review pass after a production push without being re-asked.
- **PoeTech (the app):** a standing-practice note in the Admin → Actions surface, next to the "Review as a user" action, stating in plain language that the family reviews every production push as a user before trusting it.

## Consequences

- The post-push review pass is a named, recurring step — the agent surfaces it after a merge/deploy the same way it surfaces tests or the reality-trace, and does not report a production change "done" until the live user-view pass is available to run.
- Pairs with RELEASE-TIERS (the soak precedes merge; this review confirms the merged reality) and DR-0076 (the live user-view is a second, independent observation method — not the owner's privileged read).
- Not a substitute for the deterministic gates: reviewer mode is human observation ON TOP OF the CI gates that "make sure it is a sound build," never in place of them.
