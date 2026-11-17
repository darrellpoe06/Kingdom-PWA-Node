# DR-1517: The census says which code wrote it

**Date:** 2026-11-17
**Status:** Accepted
**Tier:** A (one census field, one migration, one reader line; no new road, no new secret)
**Type:** decision
**Area:** `infra/nas-loops/lesson-queue-census.py`, `infra/supabase/migrations-auto/0330-the-census-says-which-code-wrote-it.sql`, `scripts/served-lesson-queue.py`
**Measurement:** `docs/99-session-notes/2026-11-17-the-keyless-roads-answered-and-three-gates-caught-me.md`
**Pairs with:** DR-1516 (the owner check this makes readable), DR-1515 (the verdicts), DR-0076 §8 (unknown is never an answer), DR-1269 (the keyless replay road)

## Context

0329 taught the census to tell a member's row from Darrell's. Minutes later
(09:11, run 44052311035) the read came back with **four rows reading `ready`** —
and that could not be acted on.

## What was measured

- **Two worlds, one payload.** Four `ready` rows are consistent with the new
  code running and those four being Darrell's own, **or** with the old code
  still on the box and the owner check not yet in play. The census reaches the
  NAS by the services-sync pull, so at any moment its version is a question.
- **Nothing in the receipt distinguished them.** It published the *builder's*
  code sha and never its own, so a verdict arrived with no way to know what
  produced it.
- **This is DR-0076 §8 from the other side.** Not a count read as zero, but a
  **verdict read without knowing what computed it** — equally unactionable, and
  easier to miss because the field looked authoritative.

## Impact

A verdict can be read. `ready` from a sha that contains DR-1516 means *no tag
and no owner check blocks it*; `ready` from an older sha means only the former.
The reader now says which, or says it does not know.

## Decision

1. **The census publishes the mirror's HEAD** — the same value
   `replay-on-clock.sh` already reads, for the same reason.
2. **At a different depth from the builder's**, so the two shas are never
   confused: `code_sha` beside `builder.code_sha`.
3. **Absent, never faked.** `git` answering prose reads as unknown, and the
   reader prints that unknown out loud rather than passing over it.

## Verification

- 56 Python cases (7 new), 28 reader/guard cases. A short sha passes; prose,
  an empty answer and a crashed `git` all read unknown; the repo argument is
  asserted, so it cannot silently read the wrong tree.
- **Applied to a real PostgreSQL 16:** a real sha published verbatim; a planted
  `code_sha` of *"fatal: not a git repository (Mary Smith)"* came back
  **absent**, and the member name appeared nowhere in the receipt.
- **Not claimed — and this is the point of the record.** Whether the four
  `ready` rows are Darrell's own is **still unknown**, and will stay unknown
  until a census stamped with a sha containing DR-1516 answers. This record
  exists so that answer is readable when it comes. `re-review: 2026-11-24`.
