---
id: DR-0058
title: Recurring system review — a deterministic daily health/leverage scan, ships inactive, with the three brakes
date: 2026-06-13
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [all]
grounds: [THREE-BRAKES, GOVERN-EXECUTE-ADVISE, EARN-AUTONOMY, DATA-DRIVEN-LIVING, EXECUTION-OUTCOME-OBSERVABILITY]
source: 2026-06-13 — Darrell, after the rigorous review: "see what we can do to get more out of these automation systems… do this process each day or however often is beneficial and not undermining."
---

## Context

The 2026-06-13 rigorous review (`2026-06-13-rigorous-review-findings.md`)
produced a severity-ranked map of the codebase + workflows. Darrell asked to
(a) extract leverage — get more out of the automation — and (b) make the review
itself recurring, "beneficial and not undermining." Recurring = timer-class
automation, so the 2026-06-06 runaway rule governs.

## Decision

Institutionalize a **deterministic, read-only daily system review** —
`.github/workflows/daily-review.yml`, running `fruit-scout` (coverage queue),
`workflow-conformance` (the W1-W4 gates as a standing check), and lint/test
status — emitting a health + leverage brief.

Binding posture (all three brakes, because it is timer-class):
- **Budget:** the checks are deterministic and free (no LLM, no spend). An LLM
  synthesis step, if ever added, MUST carry a token/$ budget.
- **Concurrency lock:** GitHub `concurrency` group — never stacks.
- **Kill-switch:** report-only by construction (changes nothing → cannot run
  away); disabling = remove the schedule.
- **Ships INACTIVE:** only `workflow_dispatch` is enabled; the daily `schedule`
  is committed COMMENTED OUT. Darrell enables it deliberately, watching the
  first runs — never self-activating on merge.

"Not undermining" is satisfied structurally: deterministic, free, read-only,
inactive-by-default, single-instance.

## The leverage ladder (cheapest-first — "more out of the automation")

1. **Idle-but-built, zero-risk, enable now:** the Synthesizer (add
   `ANTHROPIC_API_KEY`) → daily portfolio brief; `fruit-scout` → coverage queue.
2. **Deterministic gate (built here):** `workflow-conformance` turns the
   review's W1-W4 into a repeatable check — the path to safely activating idle
   workflows.
3. **Biggest latent value:** the **16 inactive cron workflows** (standup,
   digests, finance ingest, cross-verify) — already built, all OFF. Unlock by
   closing W1-W4 (brakes + errorWorkflow + auth + committed mounts). Gated on R8.
4. **Gated on R4:** the tiered-LLM orchestrator (DR-0056) + continuous execution
   (DR-0057).

## Consequences

- `daily-review.yml` ships inactive (dispatch-only); enabling the cron is
  Darrell's one-time deliberate act.
- `workflow-conformance.mjs` is reusable on demand + in CI; it currently reports
  16 brakeless crons, the W2 error-workflow gap, and the W3 open-webhook list.
- Adds roadmap R21. The cadence may run daily or less often — "however often is
  beneficial" — adjustable by the cron line.

## Links

`.github/workflows/daily-review.yml`, `scripts/workflow-conformance.mjs`,
`scripts/fruit-scout.mjs`, `2026-06-13-rigorous-review-findings.md`,
[DR-0055] (Synthesizer), [DR-0056] (orchestrator), [DR-0057] (fruit loop),
[DR-0054] (CI lane), three-brakes (`CLAUDE.md`), `EXECUTION-OUTCOME-OBSERVABILITY.md`.
