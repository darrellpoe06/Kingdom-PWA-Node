---
id: DR-0270
title: World Issues Scripture quotes carry a verse-verbatim gate — a lesson that quotes the Word ships with its integrity check
status: accepted
date: 2026-08-04
tier: B
declared_by: Darrell (Ways-review directive mid-delivery: "review our Ways and documentation"; "Was the Word prioritized?")
supersedes: none
builds_on: [DR-0076 (verification doctrine — fetch verbatim, never from memory), DR-0108 (review our Ways — mandatory, documented), DR-0259 (every review lands as Ways + documentation), DR-0098 (teach the Word, do not debate it)]
principles: [VERIFICATION-DOCTRINE, WAYS-REVIEW, MACHINERY-OVER-MEMORY, WORD-FIRST]
---

## Context

While capturing the spoken prison-industrial-complex lesson (2026-08-04) as
World Issues Issue 7, the Ways review (DR-0108, run on Darrell's mid-delivery
directive) found an uneven protection: the Godhead Study catalog has carried a
verse-verbatim harness since it shipped (`scripts/fetch-godhead-verses.mjs` +
the verified artifact + `godhead-study.test.js`), while the World Issues track
quoted Scripture inline in prose with NO machine check that the quoted words
match the actual KJV text. That is precisely the "looked-fine-but-wasn't"
class DR-0076 exists to close — a misquoted verse reads as fluently as a true
one, and the stakes here are the Word itself.

## Decision

1. **The gate exists and is required.** `app/src/__tests__/world-issues-verse-integrity.test.js`
   asserts, for the prison-industrial-complex issue, that every quoted
   Scripture fragment is an EXACT substring of the cited verse in the repo's
   own KJV (`app/public/bible/kjv/`), and that every listed fragment actually
   appears in the issue content (no stale list). Elisions are represented by
   splitting into multiple fragments — never by paraphrase.
2. **The authoring convention:** a World Issues issue that quotes Scripture
   adds its (ref, fragment) pairs to the gate as part of authoring — the
   quote and its check ship in the same diff, the same way a Godhead Study
   entry ships with its fetched-verse artifact.
3. **Proven-to-catch at birth (DR-0076 §3):** on its first run the gate caught
   two real letter-level deviations in freshly authored content — Proverbs
   22:23 quoted with lowercase "for" where the verse reads "For", and Isaiah
   10:2 with lowercase "to" where the verse reads "To" — plus one
   listed-but-unquoted fragment (Luke 19:8). All were corrected to the letter
   before commit. A green check here means the quoted Word is the written Word.
4. **Carried:** extending the gate's fragment inventory to the six
   pre-existing World Issues issues is its own slice (each legacy quote may
   need a letter-level content correction best reviewed as its own diff) —
   `re-review: 2026-08-11`.

## Consequences

- The Typographic Theology and verbatim-quotation bright lines (CLAUDE.md;
  DR-0076: "The KJV's text inside any quotation is fetched verbatim and left
  EXACTLY as written") now have machinery, not memory, behind them on this
  track.
- The uneven-protection shape (one catalog gated, a sibling catalog not) is a
  Ways-review finding class worth watching elsewhere: where one surface
  earned a gate, its siblings likely need the same one.

## Links

REV-0229 (`docs/reviews/REVIEWS.md`), `app/src/__tests__/world-issues-verse-integrity.test.js`,
`app/src/lib/world-issues-class.js` (Issue 7), [DR-0076], [DR-0108], [DR-0259], [DR-0098].
