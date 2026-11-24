# DR-1646: a misquote is in no corpus, so the exact test demoted the Word

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** B — the NAS lesson builder's pre-gate mend; no road, no secret, no schema
**Type:** orchestration
**Area:** `infra/nas-lesson-builder/lesson_gates.py`, `test_lesson_builder.py`
**Pairs with:** DR-1641 (the mend this corrects), DR-0621 (a flag is where the work starts), DR-0076 §3
**Session note:** `docs/99-session-notes/2026-11-24-both-roads-shut-then-the-queue-named-its-rows.md`

## Context

DR-1641 shipped two hours earlier with one rule: a quoted span the KJV corpus
does not hold is not Scripture, so its quotes come off. The record said plainly
that quotes must never be taken off a verse. **The exact test did exactly that**,
and the next live receipt exposed it.

## What was measured

- **The 18:05 receipt (run 45455565284):** every row still refused on
  `span-without-reference` ALSO carried `not-the-verse` — `65241324`,
  `c671009b`, `41ef8fcc`, `41f6dcbf`. So the writer's habit is to **misquote**
  Scripture, not to quote speakers.
- **A misquote is in no corpus.** Run locally against the real KJV: the verse
  *"Prove all things; hold fast that which is good"* matches; the misquote
  *"Prove all things and hold fast to that which is good"* does not. The mend
  therefore took its quotes off and printed the Word as our own prose.
- **A word RUN separates the two classes cleanly.** Longest contiguous run the
  KJV holds: misquoted verses **5** and **7** words; speakers' own sentences
  **2**, **3**, **3**. So 4 separates them with margin on both sides.

## Impact

Real Scripture stops being demoted to prose by the pass meant to protect it.
Fewer spans are mended, which is the harmless direction: a span left quoted
simply fails the gate, as it did before DR-1641.

## Decision

1. **`echoes_scripture(span, min_run=4)` replaces the exact test.** Any
   contiguous run of 4 words the KJV holds means "leave it alone". Only a span
   with no such run is mended.
2. **A span shorter than the run is asked the exact question instead**, so two
   words of Scripture (*"Jesus wept"*) stay protected.
3. **Every failure still answers "leave it"** — an unreadable corpus included.

## Verification

- **132 cases green.** Proven to catch three ways, each failing by name: the run
  test swapped back to the exact test; `min_run` raised to 12; the short-span
  fallback deleted. The misquote cases and the speaker cases are both pinned
  with the measured spans.
- **Not claimed:** the mend is STILL not shown to clear
  `span-without-reference` on a live draft. DR-1641's raised attempt budget is
  what moved the queue (10 → 3 waiting, 8 building at 17:05), not the mend. The
  next receipt after this lands is its first real test. `re-review: 2026-12-01`.
