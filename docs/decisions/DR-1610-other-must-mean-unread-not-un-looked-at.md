# DR-1610: `other` must mean unread, not un-looked-at

**Date:** 2026-11-23
**Status:** Accepted
**Tier:** A — one derived field on a read-only public receipt; no road, no secret, no write, no SQL
**Type:** orchestration
**Area:** `infra/nas-loops/lesson-queue-census.py`, `infra/nas-loops/test_lesson_queue_census.py`
**Pairs with:** DR-1534 (the site), DR-1542 (the cause), DR-1551 (the problem), DR-1552 (name the span), DR-0239 (surface-says-truth), DR-0621, DR-0076 §3 and §8
**Session note:** `docs/99-session-notes/2026-11-23-the-queue-named-its-own-cause-and-the-summary-did-not.md`

## Context

Run 45266493452, the first read in four days: `Failed because -- other: 6,
rate-limited: 1, transient: 1`, the oldest waiting 11 d 8 h. The SAME receipt
named `gates refused: quotation` and `because: span-without-reference` for five
of those six rows, one line below the summary that called them `other`.

## What was measured

- **A surface contradicting itself.** `by_stall` asked `stall_of()`, which reads
  only the reason prose by `startswith` (`:462`); `gates` and `kinds` came from
  the builder's stored records. So one row published `stall: other` AND
  `gates: ["quotation"]`, and the reader then printed `other`'s job — *"the
  builder's log on the box is the next read"* — advice this receipt had already
  made false. It sent a person to the box for a trip it had made itself.
- **Nothing was missing but the asking.** No migration, no reader change: the
  SQL allowlist already publishes `STALLS | SITE_CLASSES | {"other"}`, and the
  reader already names a job for every one. The classes could always ride; the
  census never assigned them.
- **DR-1534's own limit had expired.** Its `other` for an exception-opening
  reason was written BEFORE DR-1542 gave this file an identity-safe read of the
  class, so it was obsolete, not violated — and its test is rewritten saying so.

## Impact

`other: 6` becomes `crashed: 3, gates: 3` on the live queue. Every one of the
eight waiting rows is named, and `other` goes back to meaning what it says.

## Decision

1. **When the prose names no site, the builder's STORED RECORD does.** A stored
   exception reads `crashed`; stored failed gates read `gates`; neither reads
   `other`. Still identity, never a shape — both inputs are already vocabulary.
2. **A stored exception outranks stored gates**, because `exception_of()` reads
   the row's current reason (the LAST failure) and `stored_gates()` unions every
   build a row ever had.
3. **No record, no fallback.** Absent is not "no gate failed" (DR-0076 §8).

## Verification

- **Proven to catch, twice:** the fallback neutered → 6 cases fail, including
  `by_stall` disagreeing with the row's own `stall`; the precedence flipped →
  2 fail by name. 150 cases green (8 new, 1 rewritten), ruff 0.17.3 clean,
  format-guard 0, and the 12-case JS witness on the keyless road green.
- **Pinned, because it is a coupling that bites:** `why_of()` keeps the
  one-argument call, and a case proves the fallback can never publish a
  SELF_HEALING word and turn an exhausted row into a retrying one.
- **Measured live** 2026-11-24T14:07Z, run 45410207886, census code
  `030feffb2de5`, counted on the NAS 5 min earlier: `crashed: 3, gates: 3,
  rate-limited: 1, transient: 1`. `other` is gone. Re-review satisfied early.
