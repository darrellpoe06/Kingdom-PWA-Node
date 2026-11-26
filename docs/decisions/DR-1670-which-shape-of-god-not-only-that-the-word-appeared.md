# DR-1670: which shape of "God", not only that the word appeared

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** A — a reporting split; no verdict changes, no road, no secret, no write
**Type:** orchestration
**Area:** `infra/nas-lesson-builder/lesson_gates.py`, `infra/nas-loops/lesson-queue-census.py`, `infra/supabase/migrations-auto/0345-...sql`, both suites
**Pairs with:** DR-1551 (which problem, not only which gate), DR-1552 (name it, never leak it), DR-1641, DR-0210 (say Yahweh), DR-0076 §4 and §8, DR-0239
**Session note:** `docs/99-session-notes/2026-11-24-both-roads-shut-then-the-queue-named-its-rows.md`
## Context

The queue had not moved in 26 hours. One cause dominates, and one word for 25
rows decides nothing: the two things it can mean call for opposite work.

## What was measured

Run 45816352285, all 33 waiting rows, counted from the receipt:
`generic-God-not-Yahweh` **25**, `not-the-verse` 23, `span-without-reference`
13, `capitalises-the-adversary` 1 — and it has **overtaken** `not-the-verse`,
which led two days earlier (16 / 18 then).

Read from code, not assumed: the writer **is** already told the rule
(`lesson_writer.py:109-110`), so missing instruction is not the cause — the same
shape as DR-1641. And the gate (`lesson_gates.py:421`) is one bare `\bGod\b`
search: measured against it, it refuses `the God of Abraham, Isaac and Jacob`
and `God's people` exactly as it refuses `God is love`, while `the Godhead`,
`the LORD`, `the King` and `godly` all pass. CLAUDE.md says the rule is "clarity
of identity, **not a mechanical find-replace**" and keeps those titles
available. So whether `the God of Abraham` may stand in our own voice is
**undecided**, and one blanket search was deciding it by default.

## Impact

The 25 rows split into "the writer is plainly wrong" and "the gate is stricter
than its rule" — the measurement that says where the fix belongs.

## Decision

1. **Name the shape, change no verdict** — `God of <Name>`, `God's`,
   `God the <Title>`, else the standalone use, whose message is kept VERBATIM so
   its word and the cases pinning it keep their meaning.
2. **Three new vocabulary words**, census constants only, no draft prose
   (DR-1552). Migration 0345 extends `k_faults`, generated from 0336 on disk.
3. **The verdict stays Darrell's** — a count, not a ruling. Nothing here decides
   whether "the God of Abraham" is allowed in our voice.

## Verification

- **135 builder + 156 census cases green** (3 + 4 new).
- **Proven to catch three ways**: filing a construct also as the standalone use
  → 1 fails; rewording a gate clause without the census → 2; dropping the shape
  words → 3. Green when restored. The pre-existing SQL drift case caught the
  missing migration by name before it could ship.
- **No verdict moved**, pinned as an invariant: the gate's own bare `\bGod\b`
  search is the oracle and the two agree across 16 shapes. 0345 diffed against
  0336: the header and one declaration, body verbatim.
- **Ruff: no new findings** — 29/35 unchanged on the two large files, one fewer
  on each census file than `origin/main`. Not "clean"; at-or-below baseline.
- **Not claimed:** nothing is measured live; 0345 must be applied first. The
  next receipt is the proof. `re-review: 2026-12-03`.
