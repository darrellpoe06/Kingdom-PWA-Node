# DR-0780 — L214: Sons of Yahweh — whom He made, whom He begot, and whom He adopts

- **Status:** accepted
- **Tier:** A (one Living Lesson added to the series; every quotation gated verbatim; the Word left silent where it is silent)
- **Type:** feature
- **Date:** 2026-10-07
- **Scope:** `app/src/lib/living-lessons-class.js` (module `ll214-sons-of-yahweh-whom-he-made-whom-he-begot-and-whom-he-adopts`), `app/src/lib/living-lessons-dates.js`, `app/src/__tests__/living-lessons-l214-verses.test.js`
- **Principles:** SPOKEN-TEACHINGS-ARE-BUILD-INPUT (CLAUDE.md: "always add it"), DR-0098 (teach the Word, do not debate it; the Word explains the Word), DR-0076 (every verse fetched verbatim from the repo's KJV, never from memory), DR-0100 (state what is established; name the Word's own silence narrowly), the Typographic Theology (Yahweh in our voice, quoted Scripture untouched)
- **Grounds:** Darrell 2026-10-07, written into the app under one word, Lesson: *Psalms 2:7 "Thou art my Son; this day have I begotten thee" and Hebrews 1:5 "unto which of the angels said he at any time, Thou art my Son". Weren't the angels known as sons of Yahweh? Why aren't they sons of Yahweh? Why are we, and how does the Kingdom of Yahweh Family work with humanity and before humanity, the family of angels?*

## Context

The question sets two verses beside each other that seem to pull apart, and it divides into three: are the angels sons, why are people sons, and how did the family work before people. Answered as a debate between schools it would teach nothing; answered from the Word it is a structure.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| verses fetched before writing | 53 references from `app/public/bible/kjv`, word for word | the corpus read by script, not recalled |
| quoted spans in the module | 270, all verbatim against their named verse, 0 faults | `scanQuotedVerses` |
| reading level (quotes removed) | child 1.2, youth 3.3, teen 4.8, senior 6.9, adult 4.1; ascending; child under the 5.0 new-lesson ceiling | `measureLesson` |
| fullness (share of the adult prose) | child 0.63, youth 0.73, teen 0.85, senior 0.89; floors 0.5 / 0.6 | `measureFullness` |
| band differentiation (worst pair overlap) | 0.17, ceiling 0.5 | `measureDifferentiation` |
| the gates the first run caught | two intro quotations without a reference; one with the host sentence's comma inside the quote; record ids in reader-facing text | fixed before merge |

## Impact

Unresolved: a question Darrell asked stays a chat answer that nobody in the family can read, hear or quiz on. Resolved: it is L214 in Living Lessons, at four reading bands, with a quiz, a facilitator's ten points, and the Word's own words gated so a later edit cannot soften them.

## Decision

The lesson teaches three relationships that share one word: **made** (the angels and Adam: Job 1:6, Job 38:7, Genesis 6:2 read through Job, Ephesians 3:15, Luke 3:38), **begotten** (the Son alone: Psalms 2:7, Hebrews 1:5, 1:6, 1:8, 1:13, John 1:14, Colossians 1:16; the Maker and the made), and **adopted** (people through the Son who took the seed of Abraham and not the nature of angels: Hebrews 2:10-17, John 1:12, Romans 8:14-17, 8:29, Galatians 4:4-7, Ephesians 1:5, 1 John 3:1). The angels are honoured as the Word honours them (Hebrews 1:14, 1 Peter 1:12, Revelation 22:9, Hebrews 2:5, 1 Corinthians 6:3); the family before Adam is the Father, the eternal Son, the Spirit and the angels (John 1:1, Job 38:7, Colossians 1:16); one house with two kinds of children stands at Mount Sion (Ephesians 2:19, Hebrews 12:22-23, Luke 20:36, Psalms 82:6 with John 10:34-36); and the Word is left silent where it is silent (Deuteronomy 29:29): no day of the angels' making, no number, no invented story of the fall.

## Verification

- `living-lessons-l214-verses.test.js`: fields and four bands; provenance line on every surface; every quoted chapter named in the anchor; the three words in every band; Job affirmed in every band (never "angels are not sons"); Hebrews 1:5 and 2:16 verbatim; Genesis 6 read after Job; the angels not demoted; the family before man; the Word's silence stated and no invention in our prose (proven-to-catch with a planted day and fraction); every quoted span carries a reference, straight quotes, no ellipsis, no record id; 270 spans verbatim, one changed word fails; our voice (no generic "God", no capitalised adversary); the confession ends every band; talk-together in all three directions; floors, ascending grades, differentiation, title near the start, ten movements in order.
- The series-wide gates (33 files, 602 tests) green with the module in place.

## Follow-ups

- A companion on the sons who fell, if Darrell asks it; the Word's own limits on that subject are already named in movement NINE. `re-review: 2026-10-21`.
