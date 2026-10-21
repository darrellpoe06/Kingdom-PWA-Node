# DR-1150: The LORD's release is for a neighbor — loving a mixed multitude the way He means (ll256)

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A (additive curriculum: one new Living Lessons module, dated, with its own pinned gate)
**Type:** curriculum
**Area:**
- `app/src/lib/living-lessons-class.js` (`ll256-the-lords-release-is-for-a-neighbor-loving-a-mixed-multitude-the-way-he-means`, appended after ll255)
- `app/src/lib/living-lessons-dates.js` (its line, 2026-10-21)
- `app/src/__tests__/living-lessons-ll256-the-lords-release.test.js` (its gate, 143 cases)
- `app/src/__tests__/living-lessons-order.test.jsx` (the newest-lesson day pin, which its own comment says is kept current as lessons land: 2026-10-18 → 2026-10-21)

**Grounds (his words, verbatim).** Darrell, 2026-10-21, spoken into the house:

> "Lords release is for a neighbor... the good neighbor took care of a Samaritan... we live in a mixed multitude of people here in America... our neighbors claim to be Christian and kill our children and make laws against Yahweh's Will... how do we use the Word to love our communities in the Way He means and what outcomes should we expect from the Way and paths based on how humans and the Word Works... we know Yahweh and the GodHead are always Working... lesson..."

**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE (DR-0076; every verse copied from the repository's own KJV, never from memory; §3 proven-to-catch), TEACH-DONT-DEBATE (DR-0098), SPEAK-ESTABLISHED-FACT (DR-0100), SPOKEN-TEACHING-IS-BUILD-INPUT, DR-0331 (rendered for meaning, never his typos; quoted Scripture verbatim), DR-0733 / DR-0795 (TALK ABOUT IT TOGETHER in every place), DR-0734 (anchor.ref names every verse), DR-0381 (not hollow), DR-0210 (Yahweh in our voice, quotations untouched).
**Amends:** nothing.

---

## Context

His teaching is a chain, and the lesson keeps his seven moves distinct and in his order:

1. **THE LORD'S RELEASE IS FOR A NEIGHBOR** — Deuteronomy 15:1-3 read whole: the release is the LORD's ("because it is called the LORD's release"), it runs to the neighbor and the brother, and the Law records its boundary (15:3) without embarrassment, which is exactly why the neighbor question matters. The same chapter forbids turning the question into a closed hand (15:7-8).
2. **WHO IS MY NEIGHBOR** — Luke 10:25-37 taught whole. The lawyer, "willing to justify himself," wanted a short list; Jesus answered with a story and turned the question from *who qualifies for my care* to *who proved neighbor*. John 4:9 names the line between the peoples that the Samaritan crossed.
3. **A MIXED MULTITUDE** — the Word's own phrase (Exodus 12:38), under one law for the homeborn and the stranger (Exodus 12:49), with the stranger loved "as thyself" (Leviticus 19:33-34; 19:18), and the exiles told to seek the peace of the city (Jeremiah 29:7). A mixed people is the original setting of the command, not a new problem.
4. **A CLAIM IS NOT A FRUIT** — his hardest sentence, stated as plainly as he said it and settled by the Word rather than staged as two sides (DR-0098, DR-0100): Matthew 7:16, 7:20-21, 7:23; Titus 1:16; Proverbs 6:16-17 (hands that shed innocent blood); Isaiah 10:1-2 (woe to unrighteous decrees). Then where judging belongs: 1 Corinthians 5:11-13.
5. **LOVE IN THE WAY HE MEANS** — Matthew 22:37-40; Romans 13:8, 13:10 (love is the one debt never released, which ties back to movement one); Matthew 5:43-45; Romans 12:17-21; Matthew 5:13-16; Ephesians 4:15; 1 John 3:18. Truth and love travel together.
6. **WHAT TO EXPECT FROM THE WAY** — the honest forecast, both halves promised by the same Word: the harvest (Galatians 6:7, 6:9-10; Isaiah 55:11), how people work (Proverbs 15:1), Yahweh turning enemies (Proverbs 16:7), the peacemakers (Matthew 5:9) — and opposition (2 Timothy 3:12; John 15:18, 15:20).
7. **HE IS ALWAYS WORKING** — John 5:17, "My Father worketh hitherto, and I work," with "hitherto" given its plain meaning in the same breath.

**One line needed faithful rendering, and it is rendered in his favor.** He said "the good neighbor took care of a Samaritan." In Luke 10 it is the Samaritan who shows mercy to the wounded man. His point stands exactly as he made it — the release and the care are owed to the neighbor, and Jesus defines the neighbor by mercy shown across a mixed people — so every place says it the way the text does: *the Samaritan was the one who proved neighbor.* No correction is staged; the gate pins the faithful phrasing and fails the unfaithful one.

**His hardest sentence is carried in his words and nothing is added to it.** "Kill our children" is kept as he said it; the lesson does not name a specific practice he did not name, and it does not soften what he did name. The Word's own verdicts stand beside it (Proverbs 6:17, Isaiah 10:1-2). In the child band the same truth is carried gently ("Some do very wrong things, even to children"), with a trusted grown-up named and "He is the Judge, and we are not," and the gate holds the child band free of the word *kill* in our own prose.

## What was measured

- **Every verse copied from `app/public/bible/kjv` before a sentence was written.** 63 distinct verses quoted (65 references named, with Luke 10:25 and 10:32 cited without quotation); **303 referenced quoted spans**, every one verbatim in the verse it cites, case and marks included; every double-quoted span in a reader place stands beside its reference; **0** straight apostrophes inside a quotation (Deuteronomy 15:2 "LORD’s" and Proverbs 16:7 "man’s" carry U+2019 in this corpus); 0 elisions; 0 recited record ids in reader prose.
- **Bands against a 1,653-word adult lesson (our prose only, quotations removed):** child 0.60, youth 0.72, teen 0.74, senior 0.85; floors 0.50 / 0.60 / 0.60 / 0.60. `shortBands` empty.
- **Reading ladder (Flesch-Kincaid, our prose only):** child 1.5, youth 4.4, teen 7.8, senior 14.1 (adult 5.3); child under the 5.0 new-lesson ceiling; more than a grade between each rung; not inverted.
- **Band overlap** worst 0.07 (ceiling 0.5). Every band names its own lesson in its opening window. **All three TALK directions in all five places** (`placesMissingDirections` empty).
- **Generic "God" in our own voice: 0 in every place**, "Yahweh" present in every place; "God" and "the LORD" left exactly as the verses carry them.
- **Two parables**, 256 and 265 words, no quotation marks, each with a `verse` the lesson is anchored on (Luke 10:36-37; Isaiah 10:1-2 and Deuteronomy 15:2).

## Decision

Ship `ll256-the-lords-release-is-for-a-neighbor-loving-a-mixed-multitude-the-way-he-means` as a Living Lesson dated 2026-10-21, the day it was spoken and the day its id first lands, with its own pinned gate. His words open the adult lesson, rendered for meaning, and are quoted verbatim in this record. The seven movements run in the same order in all five places a reader reads.

**What the gate holds, beyond the verse checks:**
1. **The hard part never travels without the command to love.** Every place that quotes Matthew 7:21 also quotes Matthew 5:44 and Romans 12:21.
2. **Both promised outcomes, never one.** Every place carries Proverbs 16:7 and 2 Timothy 3:12 together, with Galatians 6:7, 6:9, Proverbs 15:1 and Matthew 5:9.
3. **The Samaritan is the one who proved neighbor**, beside "He that shewed mercy on him" (Luke 10:37), the lawyer's question (Luke 10:29) and John 4:9, in every place.
4. **Settled, not debated.** The adult lesson says the Word does not soften it and that it is settled; no reader place carries "both sides", "some say", "others believe" or "scholars debate".

## Verification

- **143 cases green** in `app/src/__tests__/living-lessons-ll256-the-lords-release.test.js`.
- `living-lessons-order.test.jsx` green with the refreshed newest-lesson pin.
- **PROVEN TO CATCH (DR-0076 §3), in-file mutations**, each asserting its anchor is present before mutating: one band's friend line stripped (names **youth** while the pooled `hasAllThree` still reads green — the DR-0795 hazard); Matthew 5:44 removed from one band (names **teen**); 2 Timothy 3:12 removed from one band (names **senior**); the youth band truncated (named short).
- **Live-file mutation**, run against `living-lessons-class.js` itself and restored byte-identical (verified with `cmp`): one word altered inside a quoted verse in the senior band → the verse-verbatim case failed, naming the path and the reference.

## What this does not do

- **It does not regenerate generated files.** `app/src/lib/lesson-dates.json` does not carry Living Lessons (they keep their own days in `living-lessons-dates.js`), so nothing there changes.
- **It does not name a practice Darrell did not name**, and it does not soften the one he did. Where the Word speaks (Proverbs 6:17; Isaiah 10:1-2) the lesson speaks; it invents nothing beyond his words and the text.
- **It does not promise that love wins applause.** The Word promises a harvest and opposition both, and the lesson teaches both as one road.
