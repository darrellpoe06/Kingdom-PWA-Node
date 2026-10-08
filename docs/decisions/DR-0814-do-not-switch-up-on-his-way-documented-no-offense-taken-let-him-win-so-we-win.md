# DR-0814 — Do not switch up on His Way: Yahweh's principles documented, no offense taken, and letting Him win so we win (L218)

**Date:** 2026-10-07 · **Status:** decided; shipped as Living Lesson L218 · **Lane:** Living Lessons · **Pairs with:** DR-0331 (quoting him for meaning), DR-0076 (every verse verbatim), DR-0733 (every lesson sends you to someone), DR-0795 (every band), DR-0811 (a parable is never a record; his testimony is his own)

## Context

Darrell, 2026-10-07, spoken into the app in the same sitting as his own testimony (DR-0811), and closed, as he closes a teaching meant for the app, with one word: Lesson.

> Don't switch up on Yahweh's Principals and Way... His Way... documented... don't take offense... let Him win... so we win... obviously... Lesson...

Per the standing rule (CLAUDE.md, *Spoken Teachings Are Build Input*), a word he speaks into this channel is built the same session, rendered for meaning, with every verse fetched verbatim, and he is told what it became.

## What was measured

| Fact | Where |
|---|---|
| The lesson is a full module in the house shape: id, title, bigIdea, inApp, anchor (ref + theme), ≥10 benefits, four bands (child, youth, teen, senior), a quiz of ten, ≥12 facilitator points, the adult lesson | `app/src/lib/living-lessons-class.js`, `ll218-do-not-switch-up-on-his-way-yahwehs-principles-documented-no-offense-taken-and-letting-him-win-so-we-win` |
| Every double-quoted span is KJV, fetched from `app/public/bible/kjv` at build time and checked strictly (whitespace only, never apostrophes) | `living-lessons-l218-verses.test.js` |
| Every band carries the full message (child ≥ 0.5, others ≥ 0.6 of the adult prose, quotations removed), the reading ladder rises, the child band clears the new-lesson ceiling, every band names its lesson in its opening, no two bands are the same text | `living-lessons-full-levels.test.js`, `reading-level-gate.test.js`, `title-in-narrative-gate.test.js`, `band-differentiation-gate.test.js` |
| Every band and the lesson send the reader to someone: parents to children, children to parents, friend to friend | `talk-together.test.js` |
| The verses under his clauses | Malachi 3:6; Hebrews 13:8; Numbers 23:19; Psalms 119:89; Isaiah 40:8; James 1:8; Ephesians 4:14; Proverbs 24:21 (do not switch up); John 14:6; Jeremiah 6:16; Isaiah 30:21; Proverbs 14:12 (His Way); Habakkuk 2:2; Deuteronomy 6:6-7; Joshua 1:8; Psalms 119:11; Matthew 7:24-25 (documented); Psalms 119:165; Proverbs 19:11; Ecclesiastes 7:9; James 1:19-20; Luke 17:1; Matthew 11:6; 1 Peter 2:23; Colossians 3:13 (no offense); Proverbs 21:30-31; 2 Chronicles 20:15; Deuteronomy 20:4; Luke 22:42; 1 Peter 5:6-7; Proverbs 16:9; 1 Corinthians 15:57; Romans 8:37; 1 John 5:4; Isaiah 54:17; Joshua 24:15 (let Him win, so we win) |

## Decision

1. His word becomes Living Lesson L218, his clauses taken in order with the Word under each, nothing added that the Word does not say and nothing of his dropped.
2. His own phrases are never dressed as Scripture: the per-lesson gate fails if any of them appears inside quotation marks.
3. The teaching that makes this lesson itself, rather than a neighbour wearing a new title, is checked per band in `living-lessons-l218-verses.test.js`, so a future edit cannot hollow it.
4. His spelling and cadence are rendered for meaning (DR-0331); his framing and his order are kept.

## Verification after merge

- Open Living Lessons, the last lessons: L218 is present with all four bands and plays through the reader; the quiz answers are the verses named in each explanation.
- Gate: `living-lessons-l218-verses.test.js` green, with the band and verbatim gates named above.
- `re-review: 2026-10-21`: a read-through of each band on a phone and a TV for feel and flow (DR-0075).

## Impact

A word he spoke on a Tuesday night is a lesson the family and the church can read, hear and discuss on Wednesday, in four registers, with every verse exact. The platform grows from his words, which is what it is for.
