# DR-1238: The outcome read stays on the runner — the fix was landed twice, and neither copy was gated

**Date:** 2026-10-27
**Status:** Accepted
**Area:** `app/src/__tests__/loop-produces-or-it-is-dark.test.js`
**Follows:** DR-1219 (readiness is not production), DR-1232 (the SQL rides stdin; the read that answers)

## Context

DR-1219 made the lesson-builder witness judge **the queue** rather than only
readiness, through `scripts/loop-produces-or-it-is-dark.mjs` — a tested function
with fifteen cases, including a proven-to-catch on the exact four days the loop
was dark.

The read that feeds it could not succeed. `scripts/live-sql.sh` requires
`NAS_SSH_KEY` and opens its **own** connection to the NAS, so it is a
RUNNER-side tool; DR-1219 called it from inside the `sh -s` heredoc already
running **on** the NAS, where it exits 10 at its first line
(`live-sql: NAS_SSH_KEY is not set`) — and `2>/dev/null || true` discarded even
that sentence.

## What was measured

Three consecutive runs of the witness read **UNKNOWN** with all three counts
null before anyone noticed: **40423587612, 40425627048, 40431353829**. The
judgement was right every time and the numbers were never fetched.

**Two independent sessions found it the same day.** DR-1232 landed the fix: a
runner step, *"Read the outcome from the runner (the road the NAS cannot walk to
itself)"*, carrying `NAS_SSH_KEY`, capturing stderr to `/tmp/outcome.err`,
merging the counts into the witness and recording `outcome_read_by: "runner"`. It
also **kept** the in-heredoc read as a documented fallback rather than deleting
it. A second branch reached the same diagnosis and was **closed unmerged** as
redundant (PR #2423), because DR-1232's integration is the better one.

**What neither copy had was a gate.** Nothing in the suite asserts where the read
runs, so the exact mistake that shipped green once can be reintroduced freely.

## The decision

The wiring is asserted, not just the judgement. Of the steps in
`lesson-builder-health.yml` that read `scripts/lesson-loop-outcome.sql`:

- at least one must run **outside** the `'sh -s'` heredoc;
- that runner-side read must carry **`NAS_SSH_KEY`**, which the NAS does not hold
  for itself;
- it must **keep its stderr** (to a file, not `/dev/null`), so a failed read says
  why on the next run instead of only "could not be read" (DR-0076 §8).

### What it deliberately does NOT assert, and why that matters

It does **not** demand a single `live-sql.sh` invocation. The workflow calls it
**four** times on purpose — the waiting-verdict probe, the rate-limit re-offer,
the runner outcome read, and the in-heredoc fallback DR-1232 chose to keep.

An earlier draft of this gate (on the closed branch) asserted *exactly one*
invocation. That was simply **wrong about the system**, and had it merged it would
have forced out a fallback someone had deliberately kept. A gate that encodes a
wrong model of the thing it guards is worse than no gate, because it is believed.
The subject here is narrowed to the **outcome** read for that reason.

It also strips comment lines before matching: this file explains the wiring in
prose, and an earlier version counted its own explanation as an invocation.

## Impact — what this obligates

Moving the outcome read back inside the heredoc, dropping the key from that step,
or silencing its stderr now fails the suite with a sentence naming the cause.

### Limits, named rather than left

- **A gate on placement is not a gate on success.** This proves the read is
  wired where it can work; it does not prove the queue was read. The live
  `queue_read_error` line and the witness's own UNKNOWN verdict remain the
  instruments for that, and whether the read now succeeds depends on `NAS_ENV`
  (`/volume1/docker/supabase/.env`) and the `supabase-db` container being
  reachable. **`re-review: 2026-10-28`** — dispatch the witness and read the
  verdict; if it is still UNKNOWN, the cause is now printed.
- The check reads the workflow as text, not as parsed YAML (the app has no YAML
  parser in its dependencies). A restructuring that changes the step indentation
  would need the splitter revisited; the synthetic cases keep the assertion
  meaningful if that happens.

## Proven to catch

Against the **real** workflow, not only synthetic strings:

| break | result |
| --- | --- |
| `NAS_SSH_KEY` stripped from the runner read step | **FAIL** — *"the runner-side read must carry NAS_SSH_KEY, which the NAS does not hold for itself"* |
| the runner read's stderr sent to `/dev/null` | **FAIL** — *"the runner-side read must keep stderr, so a failed read says WHY"* |
| restored | **19 passed** |

Two synthetic replays are kept beside them: the exact DR-1219 shape (the only
outcome read inside the heredoc), and a runner read that throws its stderr away.
A fourth case asserts the gate does **not** fire on the four deliberate
invocations, so the wrong model cannot creep back.

## The lesson, recorded plainly

DR-1219 shipped **fifteen tests on the verdict function and zero on the wiring
that feeds it.** That is why a read which could never succeed shipped green: every
test asked "does this judge correctly?" and none asked "does anything hand it the
numbers?" A tested judgement over an unfetched input is a subtler theatre than a
gate that always passes — the logic really is right, and it is still measuring
nothing.
