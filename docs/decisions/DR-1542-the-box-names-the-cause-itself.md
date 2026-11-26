# DR-1542: The box names the cause itself, with no hand

**Date:** 2026-11-18
**Status:** Accepted
**Tier:** A — two fields on a read-only public receipt, read locally on the NAS; no road, no secret, no write
**Type:** orchestration
**Area:** `infra/nas-loops/lesson-queue-census.py`, `infra/supabase/migrations-auto/0335-the-box-names-the-cause-itself.sql`, `scripts/served-lesson-queue.py`
**Pairs with:** DR-1534 (which site), DR-1537 (the direct read for road 2), DR-1526 (ask the box before instrumenting it), DR-1522 / DR-1524 (identity, never a shape), DR-0076 §8, DR-0111
**Session note:** `docs/99-session-notes/2026-11-17-the-keyless-roads-answered-and-three-gates-caught-me.md` §12

## Context

0334 named which SITE refused a build and then answered **`other: 6`** on six
consecutive reads, 05:12 → 13:10 on 2026-11-18, the oldest row waiting 6 d 0 h.
DR-1537 built the direct read and left the answer on Darrell's ssh. His own
words that afternoon (~12:28Z, relayed from another session), on every item
parked on his hand: **"Fix it!!!!!! So we don't need anything!!!!!!!"** A step
that waits on a hand is the defect.

## What was measured

- **Six reads, one unchanged non-answer.** `other` means only "not one of the
  two classes that retry themselves": a person is wanted, never what for.
- **The cause was on the box the whole time**, in two artifacts the census can
  already read locally: the builder's stored records (`versions/<build_id>.json`,
  written at `lesson_builder.py:1251`) hold `gate_results`, and a crashed
  build's reason tag opens with the exception class name `:1029` writes.
- **Why those two may ride where prose may not.** A gate's NAME is a fixed
  word; an exception class name is matched against the INTERPRETER's own
  `BaseException` subclasses — an allowlist this repository does not maintain
  and cannot drift from. `Mary` is not an exception class.

## Impact

`other: 6` becomes the gates that refused, or the exception that crashed it, on
a receipt needing no key and nobody's hand. DR-1537 stays as the deeper read.

## Decision

1. **Two fields per build-failed row: `gates` and `exception`**, each returned
   as the allowlist's own element (a dict lookup in Python, `array_position` in
   SQL), so the row's own bytes never ride.
2. **A fault's text is never read, on either side** — it quotes the draft and
   the verse. Neither is `body` or `prompt_text`, which sit in the same record.
3. **Absent is unread, never "no cause"**: a row whose records could not be
   read carries neither key, and the reader prints `cause not stored`.

## Verification

- **Proven to catch, three ways:** a person's name in place of an exception
  class (`Mary`, `MarySmith`, `mary_smith` — refused); a record with markers in
  `body`, `prompt_text` and a fault, none reaching the census; and `verse`
  dropped from `k_gates`, failing the drift case by name. 131 cases, 18 new.
- 0335 generated from 0334 on disk, body verbatim, two declarations and two
  keys added — diffed to prove it. Ruff clean.
- **Not claimed:** nothing is measured live, and the six rows may hold no
  stored records at all — then the answer is `cause not stored`, and DR-1537's.
  **The JS vocabulary gate cannot check `EXCEPTION_NAMES`** — it is computed
  from the interpreter — so the Python case is that gate, and it runs in CI.
  **Re-reviewed 2026-11-26, SATISFIED live**: the box named `RuntimeError` itself, and the stated limit held -- two rows read `cause not stored`. Closed.
