# DR-1519: A row with no words says so

**Date:** 2026-11-17
**Status:** Accepted
**Tier:** A by the RELEASE-TIERS flowchart, read this session — additive, reversible, isolated, no new public surface, no new privacy implication (it reads fewer words, not more)
**Type:** decision
**Area:** `infra/nas-loops/lesson-queue-census.py`, `infra/supabase/migrations-auto/0331-a-row-with-no-words-says-so.sql`
**Measurement:** `docs/99-session-notes/2026-11-17-the-keyless-roads-answered-and-three-gates-caught-me.md`
**Pairs with:** DR-1516 (which left this branch out), DR-1515 (the verdicts), DR-0669 (the builder's `eligibility()`), DR-0108 (a stated "can't" is an unverified premise)

## Context

`eligibility()`'s last branch refuses a row with **no words**. DR-1516 left it
unmirrored on the stated grounds that testing it would mean reading the body
this receipt must never read — so `ready` could still be wrong, and an idle
builder with six eligible-looking rows had no explanation.

## What was measured

- **The premise was wrong, for the fourth time tonight.** PostgREST answers
  "has this row any words?" as a **filter** returning only ids — which already
  ride this road. No body is read, not even to be measured.
- **The design first on the table was a generated `body_length` column** — a
  schema change on the table holding people's teachings — for an answer a
  `where` gives for free. Reaching for the heavy instrument was the error.
- **Why it matters:** the research road can write a row before its words
  arrive. Such a row read `ready` while the builder refused it, which is how an
  idle builder came to look like a neglectful one.

## Impact

`ready` can be trusted: every branch of `eligibility()` is now mirrored except
one stated limit. Six eligible-looking rows can be told apart from six real ones.

## Decision

1. **A filter, never a column and never a projection.** `body` appears in one
   predicate and in no `select`, pinned by its own case.
2. **Its limit is published, not discovered.** `eligibility()` also refuses a
   whitespace-only body, which no PostgREST filter can express, so such a row
   still reads `ready`. **Narrower than the builder, never wider.**
3. **A refused filter leaves a row `ready`**, never `no-words`: the census must
   not invent an empty teaching, and must not die for one unanswered question.
4. **The budget brake is corrected, not left stale** — two reads and one write
   per cycle now, said where the brake is declared.

## Verification

- 72 Python cases, 8 new. A refused filter, a `None`, the Governor outranking
  `no-words`, and `no-words` outranking `deferred` and the failure classes.
- **Proven to catch:** removing `no-words` from 0331's `k_whys` fails *verdict
  no-words is missing from k_whys in 0331…*.
- **Applied to a real PostgreSQL 16:** `no-words` and `ready` published; a
  hostile `"no-words: Bishop Gwin told Mary Smith"` dropped to null with no
  name in the receipt; `anon` still refused the table.
- **A mistake caught in the act:** 0331 was first generated from 0329 by hand
  and would have silently deleted 0330's `code_sha` — the exact failure every
  header in this series warns about. The generator now derives the definition
  in force from disk. Both shas verified present after regeneration.
- **Not claimed:** nothing is exercised on the NAS yet. `re-review: 2026-11-24`.
