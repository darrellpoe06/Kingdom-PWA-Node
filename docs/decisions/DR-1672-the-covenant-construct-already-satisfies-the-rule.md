# DR-1672: the covenant construct already satisfies the rule

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** A — one gate verdict, in our authored voice only; quoted Scripture untouched
**Type:** standard
**Area:** `infra/nas-lesson-builder/lesson_gates.py`, `lesson_writer.py`, both suites
**Pairs with:** DR-1670 (which named the shapes), DR-0210 (say Yahweh), DR-0076 §3 (the bright line), DR-0111, CLAUDE.md Typographic Theology
**Session note:** `docs/99-session-notes/2026-11-24-both-roads-shut-then-the-queue-named-its-rows.md`

## Context

DR-1670 split `generic-God-not-Yahweh` — 25 of 33 stalled rows — into shapes and
moved no verdict, leaving `the God of Abraham` as an open question for the
Governor. **That was wrong, and the stop-hook caught it:** it is not a new
bright line, the rule already decides it, and I had not read the rule closely
enough to see so.

## What was measured

DR-0210 states its own test and its own limit in one breath: prefer Yahweh **"so
the reader is never left guessing which 'god' is meant"**, and **"the point is
clarity of identity, not a mechanical find-replace"** — keeping "the Father",
"the LORD", "the Godhead", "the King" available. CLAUDE.md further forbids a
blind God→Yahweh sweep **because it would corrupt the text**.

Applying that test per shape rather than to the bare word: **allowed** is `the
God of Abraham / of Israel` — named by covenant, and unconvertible ("the Yahweh
of Abraham" is the corruption the rule warns of). **Refused** are `God's people`
(no qualifier; say "Yahweh's"), `God the Father` (the title alone is already
allowed, and clearer), and any bare `God`. Full table: the session note. One
shape satisfied the rule; the gate was over-reaching on it.

## Impact

The covenant construct stops being refused, and the writer is told the same, so
it stops avoiding a phrase that was always permitted. Some share of the 25 rows
clears; the next receipt measures which.

## Decision

1. **Allow `God of <Name>`**, refuse the other three. `GOD_SHAPES` carries a
   `refuse` flag; the allowed construct is still **subtracted** before the
   standalone check, so it can never smuggle a bare "God" past the gate.
2. **Tell the writer** (`lesson_writer.py`), with the allowed and refused forms
   named, so the fix is not gate-only.
3. **`God-of-a-name` stays in the vocabulary** — unreachable by policy, not
   dead: one boolean reverses it, and a case checks every clause the gate HOLDS
   so the words stay in step if it is ever reversed.

## Verification

- **137 builder + 157 census cases green.** Proven to catch three ways: drop the
  subtraction → 3 fail; relax a near miss → 3; revert the decision → 3 + 1.
- **Exactly one verdict moves, pinned.** The gate's historic bare `\bGod\b`
  search stays the oracle for every other shape; a case allows the one named
  divergence and refuses all others.
- **Quoted Scripture is untouched and pinned:** `our_voice()` strips every
  quoted span first, so the KJV's own "God" is never seen (DR-0076 §3).
- **Not claimed:** nothing is measured live. `re-review: 2026-12-03`.
