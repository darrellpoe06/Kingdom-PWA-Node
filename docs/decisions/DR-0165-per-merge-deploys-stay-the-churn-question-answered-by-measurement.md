# DR-0165 — Per-merge deploys stay: the deploy-churn question, answered by measurement

- **Status:** accepted
- **Tier:** A (a recorded decision closing a dated re-review; no code change — the decision is to NOT change)
- **Scope:** the delivery lane's deploy cadence (DR-0125's open item #2, `re-review: 2026-07-15`, met early)
- **Date:** 2026-07-10
- **Principles:** PERPETUAL-IMPROVEMENT (DR-0075 — a justified non-change is a recorded decision with a date), VERIFICATION-DOCTRINE (DR-0076 — measure, don't estimate), DR-0103 (motion is the default), DR-0107

## The question

DR-0125 (2026-07-08) routed: *"Shrink the churn. Ten deploys/day = ten client skew windows. Options: batch quiet-stretch merges into fewer deploys, or fire the probe immediately post-deploy."* At the time, deploy windows were estimated in minutes and unmeasured.

## The measurement (why this can be decided now)

DR-0155's propagation gate has measured the REAL window on every deploy since it shipped (2026-07-10):

- 13:17Z deploy (8b97c53): **10 seconds** to the domain serving the new entry chunk as JavaScript.
- 17:14Z deploy (5691e51, the DR-0162/0163 merge): **~1 second** (the first poll answered).
- Every deploy in between: green end-to-end, no window incident filed.

The 7–12 minute windows that motivated the question were the P32 class — and DR-0155 (missing assets answer 404 no-store; nothing caches the lie) plus DR-0160/#757 (the worker story) closed it. The measured residual is seconds.

## Decision

1. **Per-merge deploys stay. No batching.** Batching would delay fixes reaching the family (against DR-0103's motion default and DR-0107's a-stale-site-is-an-outcome) to shrink a window now measured in single-digit seconds that additionally self-heals honestly (404 + the heal ladders) when it does open.
2. **The "probe immediately post-deploy" half is already structural** — verify-boot runs the propagation gate + boot-check + the controlled-navigation pass on every deploy, and site-health sweeps every ~10 minutes behind it. Nothing further to build.
3. **The number keeps being measured** — every deploy's run summary carries its window, so if the seconds ever drift back toward minutes, the drift is on the record and this decision reopens on evidence. `re-review: 2026-08-07` (a month of measurements).

## Supersedes / pairs

Closes DR-0125 opportunity #2 (`re-review: 2026-07-15`). Pairs with DR-0155 (the guard + the gate that produced the data), DR-0163 (the gate's honesty), DR-0103 (the lane's cadence stands). No supersession.
