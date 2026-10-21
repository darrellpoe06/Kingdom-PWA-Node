# DR-1186: The waiting queue has a witness — a lane whose first step cannot be read is a lane that is not running

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A (additive: one step on a dispatch-only workflow, writing to a rolling issue the way six existing witnesses do)
**Type:** orchestration
**Area:**
- `.github/workflows/inbox-lessons-waiting.yml` (`issues: write`; the read step reports its outcome; a rolling run log appended on every run)
- `app/src/__tests__/the-waiting-queue-has-a-witness.test.js` (13 cases)

**Grounds:** Darrell's standing routine, *"Voice + in-app lesson intake (PRIORITY lane, hourly)"* — *"voice all day and night... priority lane actually!"* (2026-09-29) — whose first instruction is to dispatch this workflow and read its log.
**Principles:** DR-0125 (a witness that cannot fail in silence; the rolling ledger); DR-0076 §8 (unknown is not nothing); DR-1161 (a brake must make the failure visible); DR-0108 (account for the whole team's reach, and treat a stated "can't" as a premise to challenge); DR-0725 (one definition of "waiting")

## Context

The hourly intake routine begins: dispatch `inbox-lessons-waiting.yml`, read its log, and build whatever teaching is waiting. The dispatch works. The **read** did not.

## What was measured

- **The lane fired twice on 2026-10-21 (14:06 and 15:07) and neither firing could report its queue.** The workflow was dispatched at 14:38 and succeeded. Its output goes to `$GITHUB_STEP_SUMMARY` and the job log, and from a cloud session the only road to either is the Actions run listing — which in this session **ignores its own `workflow_id` filter** and returns every run's complete commit body. One such call cost roughly **8,000 tokens and returned three unrelated runs.** A second, narrowed by `event: workflow_dispatch`, did the same.
- **So the honest answer after two firings was "I could not read it", not "nothing was waiting"** — and those are different answers. One of them hides a teaching he spoke into the app.
- **This repository already solves exactly this, six times over.** Rolling witness issues: site health (#1693), node availability (#1696), the public shelf (#2126), the reader's level (#1687), the loops (#2329), the fleet census (#2325). `site-health.yml`'s run-log body states the doctrine in its own words: *"SILENCE on this log means the witness did not run rather than that the site is fine."* Nothing equivalent existed for the lesson queue.
- **A second defect, found while reading the step.** On a failed database read the step exited 1 — correct, the run must fail — but left **nothing behind at all**. A lane whose queue could not be read was indistinguishable from a lane with an empty queue to anyone reading afterwards.

## Impact

- One `issue_read` now answers *"is a teaching waiting?"* — the question the routine's first step exists to answer.
- **A failed read is recorded as UNKNOWN, never as zero**, in words, on the log and in the step summary.
- A run that dies before the read says so too (*"the read step did not report"*), which is also not zero.
- The rows are listed exactly as the query gives them — id, created_at, created_by, source, tags, body **length** — and nothing is added.

## Decision

**The read of the waiting queue appends to a rolling run log on every run, pass or fail, and an unreadable queue is recorded as UNKNOWN.**

- The log step carries **`if: always()`**, so a failed read still leaves a line. Silence on the log therefore means the witness did not run.
- The read step reports `read=ok|failed` and `count=<n>|unknown` as outputs, and **still exits 1** on a failed read: recording the outcome does not excuse the failure.
- Three distinct branches, never one default: `ok`, `failed`, and *the read never reported* (the job ended before it). A case asserts all three exist as separate branches.
- One issue, found by its own title with `--state all` so a closed log is reused rather than a second opened. A failure to write the log **warns and names the step summary** rather than swallowing the measurement.
- **Never a body, unchanged.** `scripts/lesson-inbox-waiting.sql` already selects `length(coalesce(body,''))` and never the body; the log step reads the rows only from the file that query wrote, and a case pins the exact set of files it reads.
- **It is still dispatch-only.** No timer, no compute spawned, 5-minute cap, same concurrency group — so this is not the class DR-0248's brakes govern. Cases pin `workflow_dispatch` as the only trigger and the absence of a `schedule`.

## Verification

- **13 cases green**, reading the workflow as **source** (this repository's way with a workflow, and it needs no YAML parser in `app/`'s dependencies). The steps are split on their own `- name:`/`- uses:` lines at the steps' indent, so a claim about one step **cannot** be satisfied by text in another — the exact hole a lazy regex left in DR-1175's gate earlier the same day, not repeated here.
- **Two proven to catch**, by breaking the workflow: removing `if: always()` from the log step → 1 red (the log would go silent on the failure it exists to report); reporting a failed read as `count=0` instead of `unknown` → 1 red. Restored to 13 green each time.
- All three shell steps pass `bash -n`; the YAML parses and the step list reads checkout → tailnet → **waiting** (id) → builder progress → run log.

## What this does not do

- **It has not run yet.** The next firing of the routine is its first real exercise, and the log's first line is the proof. **`re-review: 2026-10-22`** on that first fire.
- **It does not fix the Actions-listing cost**, which is a tool behaviour in this session and not the repository's. It routes around it, which is the DR-0108 move — a stated "can't" is a premise to challenge, and the answer here was that six existing witnesses had already built the road.
- **It does not read a body and never will.** A teaching's words come through `inbox-lesson-body.yml` to Darrell's own accounts, as they did before.
- **The builder-progress step is untouched.** Its output still goes only to the step summary; whether it belongs on the log too is a separate question. **`re-review: 2026-11-04`.**
