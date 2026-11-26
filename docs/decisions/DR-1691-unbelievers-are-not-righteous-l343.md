# DR-1691: L343 — Unbelievers Are Not Righteous

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** A (one Living Lesson in its own file; content only, no schema, no shared line touched)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll343-unbelievers-are-not-righteous.js`, its own file per DR-1468), its gate test
**Sent in by:** Darrell, spoken into the app on 2026-11-26 with the words "this is a lesson, by the way" (CLAUDE.md, Spoken Teachings Are Build Input)
**Narrative:** `docs/99-session-notes/2026-11-26-l343-unbelievers-are-not-righteous.md`
**Pairs with:** DR-0076, DR-0098, DR-0210, DR-0331, DR-1468 / DR-1477, DR-1353 (reader length)

## Context

Darrell spoke one teaching in ten movements and closed it in prayer. Built as L343 the way L342 was: scaffolded by `scripts/new-lesson.mjs` (L343 and this record reserved on origin), every quotation written as a kjv token and filled by `scripts/fill-verses.mjs` from `app/public/bible/kjv`, the shared gate in its test. His words are rendered for meaning (DR-0331); none is put in double quotes. His two pictures stay his, named as his: the way people built AI (the made thing does not define its purpose), and Mr. Miyagi's wax on, wax off from the film The Karate Kid.

## Impact

A reader meets Darrell's own word as a full lesson: that righteousness begins with believing Yahweh and is lived out by doing what He says, with the Word under each line and his prayer at the end. One lesson file and one test; no shared line edited, no schema, no other lesson moved.

## Decision

`ll343-unbelievers-are-not-righteous`, ORDER 343, ADDED 2026-11-26, title *Unbelievers Are Not Righteous — Believe Him, Then Do What He Says*, his first line as the lead. Ten movements, each taught from the Word:

1. Believing is where righteousness starts; unbelief is not righteous (Genesis 15:6; Romans 4:3; Hebrews 11:6; John 3:18).
2. Believing and not doing is not righteous either; doing does not buy grace (James 1:22; James 2:17-22; Luke 6:46; John 14:15; Ephesians 2:8-10).
3. He tests us every day (Deuteronomy 8:2; Psalms 11:5; Job 7:18; 1 Peter 1:7; James 1:2-4).
4. Made for His pleasure; His workmanship (Revelation 4:11; Psalms 149:4; Zephaniah 3:17; Genesis 6:6; Ephesians 2:10).
5. Made for family and conversation with Him (Genesis 2:18; Psalms 68:6; 1 Thessalonians 5:17; Malachi 3:16).
6. Stress builds soundness (2 Timothy 1:7; Romans 5:3-5; 1 Peter 5:10).
7. His ways are higher; many paths, THE Way (Isaiah 55:8-9; Proverbs 3:6; John 14:6).
8. One Godhead, and He says it (Deuteronomy 6:4; Matthew 28:19; 1 John 5:7; Colossians 2:9; Romans 9:20).
9. From time into eternity (2 Corinthians 4:17-18; Philippians 3:8).
10. Focus, wax on, wax off, and his prayer (Hebrews 5:14; Isaiah 53:5; 1 Peter 2:24; Revelation 22:13).

Two parables with invented people (Atlanta, Nairobi). Ten quiz questions. Facilitator notes for sixty minutes.

## What was measured

| what | measured |
| --- | --- |
| verses | 212 kjv tokens filled from the corpus; 0 verse faults in the gate and in `quoted-verse-is-the-verse` |
| length | adult 3,166 words (band 1,500 to 3,500); adult prose 1,579 |
| band shares | child 0.51, youth 0.61, teen 0.62, senior 0.61 (first build 0.39 to 0.45; each band gained taught paragraphs) |
| reading ladder | child 1.4, youth 3.6, teen 6.3, senior 7.7 |
| band overlap | worst pair 0.02 (ceiling 0.5) |
| outside the Word | none relied on: the Karate Kid line is the author's illustration (a joke, a widely known cultural reference; The Karate Kid, 1984: Miyagi trains Daniel through waxing cars), not a factual claim; Darrell 2026-11-26 |

## Verification

`living-lessons-ll343-unbelievers-are-not-righteous.test.js`: the shared gate with seven spine spans (Hebrews 11:6, James 2:20, Revelation 4:11, Ephesians 2:10, Isaiah 55:9, John 14:6, Isaiah 53:5) in the adult lesson and every band; every quotation verbatim; our voice names Yahweh; no capitalised adversary; three talk-together directions per place. Results of the catalog-wide suites are in the narrative file.

