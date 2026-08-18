---
id: DR-0311
title: The n8n conformance gate fails the build — active workflows conform, the rest ratchet, and the gate cannot see the box
date: 2026-08-16
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0132]
tier: B
entities: [poetech]
grounds: [VERIFICATION-DOCTRINE, MACHINERY-OVER-MEMORY, THREE-BRAKES, EXECUTION-OUTCOME-OBSERVABILITY, PERPETUAL-IMPROVEMENT]
source: 2026-08-16 session — Darrell, after the agent flagged the gate as report-only: "make the conformance gate fail the build."
---

## Context

While diagnosing why the incident push never rang the family's phones, reading
DR-0132 surfaced §4:

> *"Whatever n8n remains gets the discipline the review named: **gate** on
> `scripts/workflow-conformance.mjs` (activation, `errorWorkflow`, `headerAuth`).
> A green gate must *mean* running-and-correct."*

That was decided 2026-07-08. The script has exited 0 unconditionally since, and
its only caller ran it as `node scripts/workflow-conformance.mjs || true` inside
`daily-review.yml` — the exit code swallowed twice over. It surfaced the problem
for five weeks and never once held the line. Darrell: **"make the conformance
gate fail the build."**

## What it actually finds

Measured, not estimated (DR-0076 §4) — **92 findings across 55 workflows**:

| count | check | what it means |
|---|---|---|
| 16 | **W1** brakes | a schedule/cron trigger with neither `executionTimeout` nor `$getWorkflowStaticData` — no budget, no concurrency lock. The 2026-06-06 runaway precedent exactly. |
| 53 | **W2** errorWorkflow | no `settings.errorWorkflow`, so failures are silent. This is LESSONS P17 — wf30's ntfy push failed quietly and nobody knew. |
| 23 | **W3** auth | a webhook with neither `headerAuth` nor an in-code bearer check — an open door once activated. |

An earlier statement in-session that there were "six" was wrong: it came from a
truncated `tail -8` of the report, not from the count. Corrected here so the
record carries the real number.

## Decision — two tiers, because the risk is not uniform

**TIER 1 — an ACTIVE workflow must conform. Never grandfathered.**
An active non-conforming workflow is a *live defect*, not a latent one. No
baseline entry can excuse it. This is the check DR-0132 §4 actually asked for.

**TIER 2 — INACTIVE workflows ratchet.** Today's 92 are frozen in
`scripts/workflow-conformance-baseline.json`; a NEW finding fails the build;
repairing one must shrink the baseline (shrink-only, the shape of
`unbounded-select-baseline.json`, `lesson-quote-baseline.json`,
`monolith-budget.json`).

Failing all 92 at once would block every build and hand Darrell a wall instead
of a decision, and the original report-only note was right that an inactive
non-conforming workflow is an *activation gate*, not a live bug. The two tiers
keep both truths.

`daily-review.yml` keeps the full listing via an explicit `--report` mode that
exits 0 by design; the `|| true` is gone, because hiding an exit code is how
this gate stayed toothless.

## Proven-to-catch (DR-0076 §3)

`--selftest` covers all three checks in both directions, the errorTrigger
exemption, and both tiers — including the load-bearing case that **a baseline
entry cannot save an ACTIVE workflow**. Ten assertions, plus nine vitest pins.

Verified against the LIVE tree, not only fixtures:

- Flipping `infra/n8n/wf-ops-announce.json` to `active: true` — which is what
  Darrell intended on the NAS — produced `W2 wf-ops-announce.json [ACTIVE] …
  ACTIVE workflow must conform — never grandfathered`, real exit **1**, despite
  that key being in the baseline.
- Adding a new unauthenticated webhook produced a W3 block, real exit **1**.
- Restoring the tree: real exit **0**.

(The first measurement of that run reported `exit=0` because `$?` after a pipe
into `tail` returns *tail's* status. Caught and re-measured with the pipe
removed. Worth recording: that is DR-0310's class appearing inside the
verification of a different gate.)

## The honest limit — this gate cannot see the box

It reads the `active` flag in the **repo JSON**. Activation actually lives in
n8n's SQLite database on the NAS. That drift is documented in DR-0132's own
context — *"activation lives in n8n's SQLite DB, so 'built ≠ running' and
repo/live drift"*, with wf18 flipping inactive on a restart and staying down a
day.

**So: this gate governs WHAT WE SHIP. It does not know WHAT IS RUNNING.**

Live proof of the gap, same day: `wf-ops-announce` was imported and activated by
hand on the NAS on 2026-08-16, and its repo JSON still reads inactive — so Tier 1
reports clean on a workflow that is live and non-conforming (no `errorWorkflow`).
Stated in the script header, the test header, and the gate's own runtime output
so a green run never implies more than it measured (DR-0310).

Closing it needs the box to report its activation state back into the repo (an
export/diff loop, or the box agent of DR-0132 §1 writing state to Supabase).
Real work, not done. **re-review: 2026-09-16.**

## Not done, deliberately

- **The 92 findings are not swept.** They span live finance, photo and chat
  workflows; a mechanical edit across them is a large blast radius and belongs
  in its own reviewed pass, not folded into a gate change.
  **re-review: 2026-10-16** for W1 (16, the runaway class, highest risk),
  **2026-11-16** for W3 (23), **2027-01-16** for W2 (53, the largest and the one
  needing an error-handler ID convention first).
- **`wf-ops-announce.json` was NOT marked active in the repo.** Doing so would
  correctly fail Tier 1 on the missing `errorWorkflow`, and that cannot be
  supplied honestly: `settings.errorWorkflow` takes a workflow ID from n8n's
  database, and `99-error-workflow-global.json` carries no `id` in the repo.
  Inventing one would be fabricating data (DR-0076). The binding is a NAS-side
  step; establishing an ID convention for it is the prerequisite for clearing
  the 53 W2 findings at all.

## Files

- `scripts/workflow-conformance.mjs` — enforcing; `--report`, `--write`, `--selftest`
- `scripts/workflow-conformance-baseline.json` — 92 grandfathered, inactive only, shrink-only
- `app/src/__tests__/workflow-conformance-enforced.test.js` — 9 pins
- `.github/workflows/ci.yml` — gate + selftest run each push
- `.github/workflows/daily-review.yml` — `|| true` removed, explicit `--report`
