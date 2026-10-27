# DR-1231: The queue read runs where its key is — judging well on numbers nobody fetched is worth nothing

**Date:** 2026-10-27
**Status:** Accepted
**Area:** `.github/workflows/lesson-builder-health.yml`, `app/src/__tests__/loop-produces-or-it-is-dark.test.js`
**Follows:** DR-1219 (readiness is not production) — this fixes DR-1219's own plumbing.

## Context

DR-1219 was written yesterday because the lesson-builder witness passed for four
days while fifteen of Darrell's teachings waited up to 102 hours. The cure was to
stop judging readiness alone and judge **the queue** — three counts from the live
database: waiting, oldest wait in hours, shipped in the last day — through
`scripts/loop-produces-or-it-is-dark.mjs`, a tested function with fifteen cases
and a proven-to-catch on the exact four days.

## What was measured

The witness was dispatched on main at 2026-10-27 01:18 (run **40431353829**) to
confirm DR-1219 works on live data, ahead of its own `re-review: 2026-11-02`.

It **failed**, and it failed in the right direction: it reported

> `UNKNOWN: the queue could not be read, so nothing is being said about whether the loop produces — an unread queue is NOT an empty one`

with `"waiting": null, "oldest_wait_hours": null, "shipped_last_day": null`. The
NAS was reachable, its checkout was `aa9617999` (main's tip, so the code was
there), the unit was active and a writer was ready. **The judgement was right and
the numbers were never fetched.**

The cause is a boundary error in DR-1219's own implementation. `scripts/live-sql.sh`
requires `NAS_SSH_KEY` and **opens its own SSH connection to the NAS** — it is a
RUNNER-side tool. DR-1219 placed the call *inside the NAS ssh heredoc*, where the
script is already on the NAS and no key exists in a non-interactive shell. There
it cannot succeed by construction: it exits 10 at its first line,
`live-sql: NAS_SSH_KEY is not set`. And the call was written
`2>/dev/null || true`, so even that sentence was thrown away — the witness could
say the queue was unreadable but never why.

## The decision

1. **The queue read is its own runner step**, after the NAS status read and
   before the judge, with `NAS_SSH_KEY` in its env — the side that holds the key.
2. **Its stderr is kept**, in `/tmp/outcome.err`, and carried into the report as
   `queue_read_error`, so a failed read states its cause in the failure line
   instead of leaving a reader to guess (DR-0076 §8).
3. **The three counts are merged on the runner** and stay `None` unless the read
   returns exactly three integers. They are never defaulted to 0 — a 0 would read
   as a real measurement of an empty queue (DR-1186).

## Impact — what this obligates

The witness is `continue-on-error` on the read step only, so a read failure
produces UNKNOWN with a reason rather than aborting before the judge runs. UNKNOWN
remains a non-pass: silence still does not read as health.

### The real lesson, named plainly

DR-1219 shipped **fifteen tests on the verdict function and zero on the wiring
that feeds it.** That is why a broken read shipped green: every test asked "does
this function judge correctly?" and none asked "does anything hand it the
numbers?" A tested judgement over an unfetched input is theatre of a subtler kind
than a gate that always passes — the logic really is right, and it is still
measuring nothing.

So the gate added here is a **wiring** gate, not another judgement gate:
- exactly one step invokes `live-sql.sh`, it carries `NAS_SSH_KEY`, and it is not
  inside the ssh heredoc;
- that step captures stderr and does not send the read to `/dev/null`.

It inspects commands, not prose: its first run counted this very file's
explanatory comment as a second read, which is the same class of error one level
up, and the check now strips comment lines before looking.

### Limits, named rather than left

- The counts still have **not** been read from the live database even once. This
  record fixes the side the call runs on and proves the gate catches the old
  shape; whether the read then succeeds depends on `NAS_ENV`
  (`/volume1/docker/supabase/.env`) and the docker `supabase-db` container being
  reachable, which only a real run can show. **`re-review: 2026-10-28`** —
  dispatch the witness and read the verdict, and if it is still UNKNOWN the
  `queue_read_error` line now names the cause.
- `lesson-writers.json` and `lesson-builder.env` both read ABSENT on the NAS in
  this run. The primary `cli-local` writer is signed in and ready, so this is not
  currently blocking, but it is recorded because it is the kind of absence that
  explains a later failure.

## Proven to catch

The wiring gate was shown to fail on the real shipped shape and pass once fixed —
not only against a synthetic string:

- the read moved back inside the NAS heredoc, exactly as DR-1219 shipped it →
  *"exactly one step reads the queue: expected 2 to be 1"* and *"the read keeps
  its reason ... expected to contain `/tmp/outcome.err`"* — **2 failed, 16
  passed**;
- restored → **18 passed**.

A synthetic replay of the same shape is kept in the suite as well, so the
assertion stands even if the workflow is later restructured.
