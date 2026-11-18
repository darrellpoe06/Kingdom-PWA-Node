# DR-1537: Ask the box with a tool, not a one-liner

**Date:** 2026-11-18
**Status:** Accepted
**Tier:** A — a read-only diagnostic on the NAS; no road, no secret, no write, nothing activated
**Type:** orchestration
**Area:** `infra/nas-lesson-builder/why_the_builds_failed.py`, `infra/nas-lesson-builder/test_why_the_builds_failed.py`, `.github/workflows/ci.yml`
**Pairs with:** DR-1534 (which failure site), DR-1526 (ask the box before instrumenting it), DR-1159 (the order of roads), DR-0076 §8 (unknown is never an answer), the desktop-paste rule

## Context

DR-1534 went live and its first real read, 07:09Z run 44256161123 on census
code `ab7672790dfc`, answered: **`other: 6, transient: 1`**. The one `transient`
healed itself; the six matched none of the seven named failure sites. The
reader's own line says what comes next — *"the builder's log on the box is the
next read"* — and the tailnet key has been dead since 2026-11-04.

## What was measured

- **The instrument worked and still did not answer.** 0334's classes printed on
  live NAS data, and `65241324` read `rate-limited after 4` where every earlier
  read said `failed after 4` (DR-1534's `why_of` correction, on real rows).
- **Six reasons open with neither builder prose nor any known site**, which
  leaves `lesson_builder.py:1029` — the `<ExceptionType>: <message>` crash
  DR-1534 published as its limit — as the standing hypothesis, unproven.
- **The temptation measured and refused:** a fifth receipt could *infer* the
  site by testing the opening's shape on the box. DR-1526 recorded that exact
  move as the wrong one — building a receipt to infer what a direct read states
  outright. Road 2 of DR-1159 answers it outright.
- **What the box actually holds:** `versions/<build_id>.json`, written by
  `_store` at `lesson_builder.py:1251`, carries the writer's `error` and the
  full `gate_results` — and also `body` (the drafted lesson) and `prompt_text`
  (which quotes the teaching).

## Impact

Road 2 gets one short, quote-safe command instead of a hand-written one-liner,
and the answer it prints cannot carry a person's words.

## Decision

1. **A committed diagnostic, not a pasted one-liner.** The NAS mirror already
   carries the repo, so the command is one path and no quoting.
2. **Never a body, never a prompt, never a fault's text.** It prints the row id,
   the writer, the elapsed time, `error` to a stated cut, and the NAMES of the
   gates that did not pass with their fault COUNTS. `--faults` prints fault text
   only when asked, and its help says plainly that this is draft text.
3. **An empty or missing store exits non-zero** and says "which is not 'no
   failures'"; an unreadable file is named rather than skipped.

## Verification

- **Proven to catch:** a version that prints `body` fails
  `test_PROVEN_TO_CATCH_a_body_a_prompt_or_a_faults_text_printed` by marker.
- 10 cases green, run against a fixture holding markers in every field that
  must never print; ruff check and ruff format clean. Wired into `ci.yml` beside
  the lesson-builder proofs, so the contract is checked on every push.
- **Not claimed:** it has not been run on the NAS — only Darrell's own ssh can,
  and the output is his to read. The six rows' cause is still unnamed.
  `re-review: 2026-11-25`.
