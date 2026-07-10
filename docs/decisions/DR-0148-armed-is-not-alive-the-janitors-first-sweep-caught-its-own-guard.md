# DR-0148 — Armed is not alive: the janitor's first sweep caught its own guard

- **Status:** accepted
- **Tier:** A (a one-guard correction to a dispatch-only process, proven by the first run's measured outcome; supersedes one clause of DR-0146)
- **Scope:** `.github/workflows/pr-janitor.yml` (the auto-merge-armed guard removed; armed status reported, never trusted)
- **Date:** 2026-07-10
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 — proven-to-catch / anti-theater), SPEAK-ESTABLISHED-FACT, PERPETUAL-IMPROVEMENT (DR-0075), WAYS-REVIEW

## The verified trace

The janitor's first two sweeps (runs 1 and 2, 2026-07-10) completed green in ~11–14 seconds and closed **zero** of the 22+ proven-empty zombie PRs — the open-PR count read 25 afterward, unchanged. The sweep step's own timing (~1.3s, no per-branch fetches) shows every stale PR hit an early `continue`: DR-0146's guard *"auto-merge not armed (an armed PR is live by definition)"* rests on a premise that is FALSE in this repository — **the delivery lane (DR-0103) arms auto-merge on every auto-opened PR**, so every zombie is armed-but-dead and the guard skipped them all. A green run that does nothing is the exact gate theater DR-0076 forbids.

## Decision

1. **Armed is not alive.** The auto-merge-armed early-skip is removed. A PR's liveness is judged by the evidence that cannot lie: recency (idle threshold) and the runner-verified diff against main. Armed status is *reported* in the close row, never trusted as a liveness signal.
2. **The protections that remain are the real ones:** `hold` (the governor's hand), draft (stated intent), active-within-threshold, and above all **non-empty diff — real work is never auto-closed**. An armed PR carrying real changes was always safe under the diff gate and still is.
3. **Supersedes** the "auto-merge not armed" clause of DR-0146 (decision item 3). Everything else in DR-0146 stands.

## Supersedes / pairs

Supersedes one clause of DR-0146. Pairs with DR-0076 (this is a live proven-to-catch: the first run measured the guard's failure before it could masquerade as hygiene) and DR-0103 (the lane behavior — arm-on-open — that made the premise false).
