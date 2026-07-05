# DR-0105 — The delivery lane auto-merges only Tier A; Tier B/C is held by the parameter, not by the human

- **Status:** accepted
- **Tier:** C (changes the CI delivery lane itself — automation; ships as a reviewed PR)
- **Scope:** every PR that targets `main` through the auto-open / auto-merge lane
- **Date:** 2026-07-05
- **Refines:** DR-0103 (does not supersede it — the streamlined loop stands; this tightens which PRs it auto-merges)
- **Principles:** VERIFICATION-DOCTRINE, TIER-C, RELEASE-TIERS, THREE-BRAKES, GOVERN-EXECUTE-ADVISE, EXECUTION-OUTCOME-OBSERVABILITY, DECISION-RECORDS

## Directive

Darrell, 2026-07-05, clarifying the "we don't move when I'm not pushing" streamlining (DR-0103):

> "when I said no waiting that was only for me because we have the parameters."

And, asked whether to make the tiers a system-applied parameter rather than something he must remember to apply per-PR:

> "Yes tighten that."

## The premise being corrected (stated first, per Reality-Trace)

DR-0103 removed the wait on the **human** so low-risk work would stop stalling. But as shipped it armed native auto-merge on **every** green PR on a release-lane branch unless a human applied `hold`. That put the tiers on the human's memory: a Tier B/C change (product code, schema, money, front-door, onboarding, automation) would auto-merge on green unless Darrell noticed and applied `hold` in time — re-introducing him as the bottleneck for exactly the changes that most need a soak/review, and silently dropping the RELEASE-TIERS gate when he didn't. "No waiting" was only ever about not waiting on the human for LOW-RISK work; the parameters (the tiers) must still gate the rest.

## Decision

**Auto-merge is armed only for provably Tier A changes; Tier B/C is held by the parameter, not by the human.**

1. **A deterministic tier gate — `scripts/release-tier-gate.mjs`.** Pure `classifyTier(changedPaths) → { tier, autoMerge, reasons }`. It arms auto-merge (Tier A) ONLY when **every** changed path is provably low-risk (docs / memory / tests / markdown copy). Any product code → Tier B (hold). Any high-risk path → Tier C (hold): schema/migrations, `.github/workflows/**` (the lane itself), server APIs/`infra/**`, real money, front-door/mission surfaces, COLG/church onboarding, autonomous/timer-driven automation. **Default is HOLD** — unknown or mixed ⇒ Tier B — mirroring RELEASE-TIERS flowchart rule 5 ("None of the above cleanly? → default to Tier B"). Conservative on purpose: the safe side of the error is a short soak, never a trust-bearing change slipping to main (DR-0076).

2. **The lane consults the gate at both arming points.** `auto-open-pr.yml` (on push) and `auto-merge.yml` (the check_suite/dispatch sweep) both run the gate on the PR's changed files and arm native auto-merge only for Tier A. The sweep never mutates labels (it can't fight a human); it only decides whether to arm. CI still runs on every PR and a red PR never merges regardless.

3. **`ship` is the human release; `hold` is the human hard-brake.** A held Tier B/C PR merges (on green) once a human applies the **`ship`** label — the explicit "I reviewed/soaked this, release it" governance act (GOVERN-EXECUTE-ADVISE). `hold` still keeps a PR out of the lane regardless of tier. auto-open posts a one-time comment on held PRs naming the tier, the reason, and how to release.

## Why this is consistent with DR-0103, not a reversal

DR-0103's win — the agent is not in the merge path and low-risk work lands without a human click — is fully preserved for Tier A. What changes is that the tier is now a **parameter the system applies**, not a label the human must remember. This is the integration gate deferring to verified truth (the tiers are truth about blast radius), exactly as DR-0103 framed the CI gates. The lane still moves without the human; it just no longer moves *trust-bearing* changes without a review.

## Guards (proven-to-catch)

`app/src/__tests__/release-tier-gate.test.js`: docs/memory/tests ride through (Tier A); a migration, a workflow edit, a server API, an `infra/` job, a money path, the front-door surface, COLG onboarding, and autonomous automation each HOLD (Tier C); ordinary product code and mixed doc+code hold (Tier B); an empty/unreadable change set holds; and an inversion asserts a product component is NOT in the safe set — so a future edit that silently widened the safe door fails the suite.

## Consequences

- Ordinary product PRs (Tier B) now wait for a `ship` from a steward — a deliberate, cheap review touch, not a merge click on every trivial change. Low-risk doc/memory/test churn still flows hands-off.
- This PR is itself Tier C (it edits the workflows) and is held for Darrell's review by the very rule it adds — dogfooded.
- The path patterns are a living allowlist/denylist; new high-risk surfaces are added to `TIER_C_HIGH_RISK` as they appear (each with a test), per the "every incident becomes a gate" discipline (DR-0076).
