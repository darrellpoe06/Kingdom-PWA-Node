# DR-0813 — The Holy Spirit brings a sound mind, not confusion: His clarity, the eyes of the heart, and the Word as the only source (L217)

**Date:** 2026-10-07 · **Status:** decided; shipped as Living Lesson L217 · **Lane:** Living Lessons · **Pairs with:** DR-0331 (quoting him for meaning), DR-0076 (every verse verbatim), DR-0733 (every lesson sends you to someone), DR-0795 (every band), DR-0811 (a parable is never a record; his testimony is his own)

## Context

Darrell, 2026-10-07, spoken into the app in the same sitting as his own testimony (DR-0811), and closed, as he closes a teaching meant for the app, with one word: Lesson.

> The Holy Spirit brings a sound mind... not confusion... we get His clarity... and see with our deep parts... our hearts... have eyes... not the 3rd eye fake spiritual stuff... we only source the Word!!!!!!! Lesson

Per the standing rule (CLAUDE.md, *Spoken Teachings Are Build Input*), a word he speaks into this channel is built the same session, rendered for meaning, with every verse fetched verbatim, and he is told what it became.

## What was measured

| Fact | Where |
|---|---|
| The lesson is a full module in the house shape: id, title, bigIdea, inApp, anchor (ref + theme), ≥10 benefits, four bands (child, youth, teen, senior), a quiz of ten, ≥12 facilitator points, the adult lesson | `app/src/lib/living-lessons-class.js`, `ll217-the-holy-spirit-brings-a-sound-mind-not-confusion-his-clarity-the-eyes-of-the-heart-and-the-word-as-the-only-source` |
| Every double-quoted span is KJV, fetched from `app/public/bible/kjv` at build time and checked strictly (whitespace only, never apostrophes) | `living-lessons-l217-verses.test.js` |
| Every band carries the full message (child ≥ 0.5, others ≥ 0.6 of the adult prose, quotations removed), the reading ladder rises, the child band clears the new-lesson ceiling, every band names its lesson in its opening, no two bands are the same text | `living-lessons-full-levels.test.js`, `reading-level-gate.test.js`, `title-in-narrative-gate.test.js`, `band-differentiation-gate.test.js` |
| Every band and the lesson send the reader to someone: parents to children, children to parents, friend to friend | `talk-together.test.js` |
| The verses under his clauses | 2 Timothy 1:7; 1 Corinthians 14:33; Isaiah 26:3; Philippians 4:7; Romans 8:6 (a sound mind); John 14:26; John 16:13; James 1:5 (His clarity); Ephesians 1:17-18; Psalms 119:18; Psalms 119:130; Matthew 6:22; 2 Corinthians 4:18; Hebrews 11:1; 1 Corinthians 2:14; 1 Corinthians 2:16 (the eyes of the heart); Deuteronomy 18:10-12; Isaiah 8:19-20; Colossians 2:8; 1 John 4:1; 1 Thessalonians 5:21 (the counterfeit named and tested); Psalms 119:105; 2 Timothy 3:16-17; Proverbs 4:23; Proverbs 3:5-6 (the Word only) |

## Decision

1. His word becomes Living Lesson L217, his clauses taken in order with the Word under each, nothing added that the Word does not say and nothing of his dropped.
2. His own phrases are never dressed as Scripture: the per-lesson gate fails if any of them appears inside quotation marks.
3. The teaching that makes this lesson itself, rather than a neighbour wearing a new title, is checked per band in `living-lessons-l217-verses.test.js`, so a future edit cannot hollow it.
4. His spelling and cadence are rendered for meaning (DR-0331); his framing and his order are kept.
5. The child band (ages 6-10) forbids the counterfeit from Leviticus 19:31 ("Regard not them that have familiar spirits, neither seek after wizards, to be defiled by them: I am the LORD your God") instead of Deuteronomy 18:10-12. The first CI run on the lesson caught it: the children's content screen (`living-lessons-age-appropriateness.test.js`) keeps the word necromancer off a child's page, and the Deuteronomy list carries it. Same prohibition, the Word's own name for it, in words a child can carry; the youth, teen, senior and adult texts keep Deuteronomy 18:10-12 in full.

## Verification after merge

- Open Living Lessons, the last lessons: L217 is present with all four bands and plays through the reader; the quiz answers are the verses named in each explanation.
- Gate: `living-lessons-l217-verses.test.js` green, with the band and verbatim gates named above.
- `re-review: 2026-10-21`: a read-through of each band on a phone and a TV for feel and flow (DR-0075).

## Impact

A word he spoke on a Tuesday night is a lesson the family and the church can read, hear and discuss on Wednesday, in four registers, with every verse exact. The platform grows from his words, which is what it is for.
