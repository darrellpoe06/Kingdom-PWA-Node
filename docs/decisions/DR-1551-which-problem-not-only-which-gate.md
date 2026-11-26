# DR-1551: Which problem, not only which gate

**Date:** 2026-11-18
**Status:** Accepted
**Tier:** A — one field on a read-only public receipt, read locally on the NAS; no road, no secret, no write
**Type:** orchestration
**Area:** `infra/nas-loops/lesson-queue-census.py`, `infra/supabase/migrations-auto/0336-which-problem-not-only-which-gate.sql`, `scripts/served-lesson-queue.py`
**Pairs with:** DR-1542 (the cause), DR-1534 (the site), DR-1522 / DR-1524 (identity, never a shape), DR-0621 (a flag is where the work starts), DR-0076 §8
**Session note:** `docs/99-session-notes/2026-11-17-the-keyless-roads-answered-and-three-gates-caught-me.md` §13

## Context

0335's first live read, 14:11Z run 44320331578, ended six days of `other: 6` in
a single read: `quotation` refused four of the seven waiting teachings, `verse`
three, `voice` one, and three rows had crashed with `RuntimeError`. The field
did exactly what it was written to do.

## What was measured

- **And it still did not decide the fix.** `quotation_gate`
  (`lesson_gates.py:245`) refuses FIVE different things calling for opposite
  work: a draft double-quoting a phrase of the teacher's wants the writer's
  PROMPT changed; one mis-quoting a verse wants another attempt; and a gate
  refusing what a lesson ought to be allowed to do is Darrell's call.
- **The prompt is not the gap.** `lesson_writer.py:85-90, 116` states every one
  of those rules to the writer, and `previous_failures`
  (`lesson_builder.py:814`) feeds the earlier attempt's failure lines back in —
  so these rows failed *with* that feedback in hand.
- **Two vocabularies, both already fixed.** The verse gate answers in its own
  (`unresolvable`, `shouted`, `not-the-verse`). The others answer in authored
  prose — and `lesson_gates.py:279` and `:282` interpolate a NAME into theirs.

## Impact

The reader now says `because: span-without-reference+curly-quotes` instead of
`gates refused: quotation`, which is the difference between knowing a gate
fired and knowing whose decision the fix is.

## Decision

1. **A `kinds` field per build-failed row**, eleven values: five from the
   quotation gate, three from the voice gate, three from the verse gate.
2. **Matched on prose, published as a constant.** Because a name is
   interpolated into two of those strings, the census matches the builder's own
   phrasing and emits ITS OWN kind word; 0336 refuses again by `array_position`.
3. **An unrecognised problem yields NO kind** rather than a guess, and a row
   with no stored record carries no `kinds` key at all.

## Verification

- **Proven to catch:** a problem string carrying the adversary's name publishes
  `capitalises-the-adversary` and leaks neither that name nor `yahweh` written
  in lower case, nor any fragment of the prose; and a kind dropped from
  `k_faults` fails the drift case by name. 138 census cases (7 new), ruff clean.
- 0336 generated from 0335 on disk, body verbatim, one declaration and one key
  added — diffed to prove it.
- **Re-reviewed 2026-11-26, SATISFIED live**: every row names its problem, not
  only its gate. The union limit stands, but the question it blocked — would a
  third attempt help? — is answered by OUTCOME: DR-1641 raised the budget 2→4
  and the queue extended one cycle without clearing. No. DR-1670 follows.
