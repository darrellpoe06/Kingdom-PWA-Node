# DR-0689 — L201: How Long Before It Came? — David, the Prophets, and the Years from Each Promise to Jesus

- **Status:** accepted
- **Tier:** B
- **Type:** word
- **Date:** 2026-09-30
- **Scope:** `app/src/lib/living-lessons-class.js` (new lesson `ll201-how-long-before-it-came-david-the-prophets-and-the-years-from-each-promise-to-jesus`, with a dated `timeline` rendered by the existing per-lesson timeline block, DR-0580); `app/src/lib/living-lessons-dates.js` (its day); `app/src/__tests__/living-lessons-l201-verses.test.js` (new, proven-to-catch); `app/src/__tests__/living-lessons-order.test.jsx` (the newest-day pin moves to 2026-09-30); `app/src/__tests__/learn-sort-every-option.test.jsx` (the latest-lessons merge test assumed the newest real day spans two courses; L201 alone on 2026-09-30 is a true state, so it now requires some real day to hold two courses, contiguous under that day).
- **Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, SPOKEN-TEACHINGS-ARE-BUILD-INPUT, DR-NUMBER-ALLOCATION, DECISION-RECORDS (and, by record: teach the Word, do not debate it, DR-0098; speak established fact, DR-0100; render his words for meaning, DR-0331)
- **Grounds:** CLAUDE.md, Spoken Teachings Are Build Input (2026-07-03); DR-0331; DR-0098; DR-0100; DR-0076; DR-0210 (Yahweh in our voice, quoted KJV untouched); DR-0677 (counts are derived); DR-0580 (the per-lesson dated timeline); DR-0685 (the dictation fix).

## Context

At 13:00:29 UTC on 2026-09-30 Darrell spoke a lesson into Thinking Space from his phone. It saved as `public.agent_inbox` row `db1bcde6-25c8-41d3-9195-fcf91d2b724e` (source `thinking-space`; tags `lesson`, `lesson-name-ok`, `lesson-name:Darrell Poe`).

**His words, rendered for meaning (DR-0331).** He wants a lesson that gives the timeline: when David lived, exactly; when each of the prophets spoke; how long it was from each prophecy to its fulfillment (if David said a thing would happen a thousand years later, show it; if another spoke five hundred years ahead, show that); the prophets connected on one line; and where Jesus stands on it.

**Provenance, said plainly.** The body carries the same passage three times over. The last few words were cut off in the read; they end at "Jesus is saying this now" followed by a fragment that most likely began "where the implementation", which is uncertain, so the lesson does not guess at it and says so. The row arrived after the duplicate-dictation fix (DR-0685) shipped, so the repetition is a follow-up: his phone may still have been running the old cached app. **re-review: 2026-10-07**, by reading his next Thinking Space rows for repetition.

**One teaching, one lesson.** `app/src/lib` (the Living Lessons, the Who He Is course, L194, L196, L200) and `docs/decisions` were searched for the row id and for these words: none. No Living Lesson quotes Daniel 9:24-26, and none carries a prophecy-to-fulfillment interval table. Neighbors are linked, not duplicated: L200 (what the first hearers had in hand), L196 (the promises gathered), L127 (the same 480 years placing the exodus), and the Who He Is course timeline (the whole Word by era, without calendar years).

**Placement.** Living Lessons **L201**; `origin/main` at 9f7c8e54 ended at L200 and no open PR claimed L201 or DR-0689.

## What was measured

- Every quoted span was checked by the repo's `scanQuotedVerses` against `app/public/bible/kjv`: **170 quoted spans, 170 verbatim, 0 faults.**
- **The intervals are computed, not typed.** Each of the 15 prophecy rows in the lesson's `timeline` carries its spoken span and its kept span as years; the interval is (kept) minus (spoken) with no year zero, as a min to max range. The test recomputes every row and requires the timeline, the lesson's table, and the senior, teen and youth tables to print exactly those words.

| prophecy | speaker | spoken | kept in | kept | years between |
|---|---|---|---|---|---|
| Psalms 22:18 | David | c. 1010 to 970 BC | John 19:24 | AD 30 to 33 | 999 to 1,042 |
| Psalms 110:1 | David | c. 1010 to 970 BC | Acts 2:34-36 | AD 30 to 33 | 999 to 1,042 |
| 2 Samuel 7:12-13 | Nathan | c. 1003 to 970 BC | Luke 1:32; Acts 13:23 | c. 6 to 4 BC | 964 to 999 |
| 1 Kings 13:2 | a prophet from Judah at Bethel | c. 931 to 910 BC | 2 Kings 23:16 | c. 622 to 621 BC | 288 to 310 |
| Hosea 11:1 | Hosea | c. 755 to 715 BC | Matthew 2:15 | c. 4 BC | 711 to 751 |
| Micah 5:2 | Micah | c. 750 to 686 BC | Matthew 2:5-6 | c. 6 to 4 BC | 680 to 746 |
| Isaiah 53:12 | Isaiah | c. 740 to 686 BC | Mark 15:28 | AD 30 to 33 | 715 to 772 |
| Isaiah 61:1-2 | Isaiah | c. 740 to 686 BC | Luke 4:21 | AD 28 to 30 | 713 to 769 |
| Isaiah 7:14 | Isaiah | c. 735 to 732 BC | Matthew 1:22-23 | c. 6 to 4 BC | 726 to 731 |
| Jeremiah 23:5 | Jeremiah | c. 627 to 586 BC | Luke 1:32 | c. 6 to 4 BC | 580 to 623 |
| Jeremiah 31:31 | Jeremiah | c. 627 to 586 BC | Luke 22:20; Hebrews 8:8 | AD 30 to 33 | 615 to 659 |
| Jeremiah 25:11-12 | Jeremiah | c. 605 to 604 BC | Ezra 1:1; 2 Chronicles 36:21-22 | c. 539 to 538 BC | 65 to 67 |
| Daniel 9:25-26 | Daniel | c. 539 to 538 BC | Mark 1:15; Galatians 4:4 | AD 28 to 33 | 565 to 571 |
| Zechariah 9:9 | Zechariah | c. 520 to 480 BC | Matthew 21:4-5 | AD 30 to 33 | 509 to 552 |
| Malachi 3:1 | Malachi | c. 460 to 430 BC | Matthew 11:10; Mark 1:2 | AD 28 to 29 | 457 to 488 |

- **The placing rule, stated in the lesson:** a prophet's words sit within the reigns his own book names (Isaiah 1:1; Hosea 1:1; Micah 1:1; Jeremiah 1:2-3), narrowed only where a chapter carries its own date (Isaiah 7:1; Jeremiah 25:1; Daniel 9:1; Zechariah 1:1); reigns take their calendar years from the king lists. Spans stay wide where the Word leaves them wide.
- **What the Word fixes, given as the Word states it:** David's forty years (2 Samuel 5:4-5; 1 Kings 2:11), Solomon's forty (1 Kings 11:42), the 480th year (1 Kings 6:1), Jeremiah's seventy years (Jeremiah 25:11-12), seven weeks and threescore and two weeks (Daniel 9:25), the fifteenth year of Tiberius (Luke 3:1). The test pins each against the KJV file. David's span is derived from the forty years; Nathan's from the seven and a half in Hebron.
- **Derived, and pinned:** sixty-nine sevens are 483 years; counted even from the earliest royal word about Jerusalem, Cyrus's of 538 BC, they end no earlier than **55 BC**. The speakers span **580** years; every row that reaches the Messiah is kept inside **38** years of one life.
- **Outside facts, tiered per DR-0100:**

| claim | tier | basis |
|---|---|---|
| The Assyrian eponym list records an eclipse dated to June 15, 763 BC, fixing the Assyrian years | established | astronomical retrocalculation of the Bur-Sagale eclipse |
| Ahab, Jehu and Hezekiah are named in Assyrian inscriptions | established | the Kurkh Monolith, the Black Obelisk, Sennacherib's annals |
| Nebuchadnezzar took Jerusalem in 597 BC | established | the Babylonian Chronicle |
| Babylon fell to Persia in 539 BC | established | the Nabonidus Chronicle and the Cyrus Cylinder |
| Damascus fell to Assyria in 732 BC | established | Tiglath-pileser III's records (the Word: 2 Kings 16:9) |
| Tiberius became emperor in AD 14 | established | Roman record |
| Pilate governed Judea AD 26 to 36 | established | Josephus; the Pilate Stone |
| David c. 1010 to 970 BC; the divided kingdom's reigns | conventional, marked c. | the Word's reign lengths fitted to the anchors; reckonings differ by a year or two, said in the lesson |
| Herod died in 4 BC; the birth c. 6 to 4 BC | conventional, marked c. | Josephus; a minority reckoning puts Herod's death in 1 BC, which would shift the birth rows by up to three years; stated here, not staged in the lesson |
| The cross in AD 30 or AD 33 | open, flagged narrowly | the two Passover years that fit the Gospels; both carried as a range |
| Zechariah 9 to 14 and Malachi | conventional ranges | undated chapters; Persian-period placement from the text (Zechariah 1:1; Malachi 1:8; Ezra 6:15) |

- **Where the Word is reticent, the lesson stays with it.** It does not choose a calendar start for Daniel's count (the Word records more than one royal word: Ezra 1:1; Ezra 7:13; Nehemiah 2:1), and it does not bend the calendar to make Jeremiah's seventy land on a year; it gives the Word's number and the calendar distance side by side. No schools are staged (DR-0098).
- Bands, measured by the repo's gates on the lesson in place: full-levels shares child 0.51, youth 0.62, teen 0.61, senior 0.62 (adult 2,796 prose words); reading grade child 3.4, youth 4.6, teen 4.9, senior 5.4 (ascending; child under the 5.0 ceiling); worst band overlap 0.03 (ceiling 0.5); every band names its lesson in its opening.

## Impact

Without this lesson, Darrell's question sits in an inbox, and a reader who asks "how long did they wait?" gets round numbers from memory or a chart that blurs the Word's figures with a historian's. With it, the reader sees the Word's own lengths, how those lengths are fixed to the calendar and where that fit is approximate, each prophet placed by his own opening verse, and fifteen promises with the years between worked out on the page, meeting in one life. The dated timeline renders under the lesson in Learn through the existing timeline block, so the line he asked for is visible as a line.

## Decision

L201, **How Long Before It Came? — David, the Prophets, and the Years from Each Promise to Jesus**, joins Living Lessons with ten Word-first movements, four authored bands, an eight-question quiz, ten facilitator talking points and a 24-entry dated timeline (15 prophecy rows and 9 anchors):

1. **He declares the end from the beginning.** Isaiah 46:10; 2 Peter 1:21; 1 Peter 1:10-11; Deuteronomy 18:22.
2. **How we know when David lived.** 2 Samuel 5:4-5; 1 Kings 11:42; 1 Kings 6:1; 2 Kings 24:12; the outside anchors.
3. **The prophets dated themselves.** Isaiah 1:1; 6:1; Hosea 1:1; Micah 1:1; Jeremiah 26:18; Jeremiah 1:2-3; Daniel 9:1; Zechariah 1:1; Malachi 1:8; Ezra 6:15.
4. **David, a thousand years ahead.** 2 Samuel 7:12-13; Luke 1:32; Acts 13:23; Psalms 22:16, 18; John 19:24; Psalms 110:1; Matthew 22:43; Acts 2:30, 34, 36.
5. **A king named three hundred years ahead.** 1 Kings 13:1-2; 2 Kings 22:3; 23:16.
6. **Isaiah, Hosea and Micah: three men, one Child.** Isaiah 7:1, 14; Matthew 1:22; Micah 5:2; Matthew 2:5; Hosea 11:1; Matthew 2:15; Isaiah 53:5, 7, 12; Mark 15:28.
7. **Jeremiah: seventy years, a Branch, a new covenant.** Jeremiah 25:1, 11-12; Ezra 1:1; 2 Chronicles 36:21; Jeremiah 23:5; 31:31; Luke 22:20; Hebrews 8:8.
8. **Daniel read Jeremiah and was given a longer count.** Daniel 9:2, 24-26; Leviticus 25:8; Mark 1:15; Galatians 4:4.
9. **Zechariah and Malachi, the last voices before the silence.** Zechariah 9:9; Matthew 21:4; John 12:16; Malachi 3:1; Matthew 11:10, 13; Luke 3:1-2.
10. **The whole line on one page, and the day He said this day.** The derived table; Luke 4:18, 21; Isaiah 61:1; Luke 24:44.

And the close: Joshua 21:45; Habakkuk 2:3; John 20:31. Our voice says Yahweh; quoted KJV is untouched. Counts are derived (DR-0677): no count line was edited.

## Verification

- `living-lessons-l201-verses.test.js`, 26 tests green: fields, number 201 after L200, date, one lesson; every span verbatim on every surface; every quotation carries its reference; the Word's numbers pinned to the KJV; David's span derived from the forty years; all 15 intervals recomputed and matched word for word in the timeline and in four tables; the required prophecies and their keepings; timeline in order; Daniel's 483 and 55 BC derived; Jeremiah's two numbers; the speaker span and the one-life span derived; outside dates named with their basis; ten movements in order; the provenance pins (three repetitions, the lost last words); Yahweh-in-our-voice and lowercase-adversary checks; all four band gates.
- **Proven to catch**, in the suite: a planted generic name, "colt" misquoted as "horse" in Zechariah 9:9, 1 Kings 13:2 re-pointed to 13:3, a shifted date, a hand-typed interval off by one, and a dropped movement each fire. Separately, in `living-lessons-class.js` itself, Zechariah's spoken span was moved from 520 to 480 BC to 520 to 470 BC without re-deriving: 3 tests failed (the interval recomputation, the table pins, and the in-suite catch); restoring the file turned all 26 green.
- The CI layout probe first read lesson@360px at 486px on the runner (budget 460); the same commit measured locally with the same sweep read 447px, and Big Print 230px against 231px on #1866, so the reading was runner variance; the probe opens L1, not L201.
- Gate groups green: band differentiation, course band coverage, course bands reach the reader, course quotation integrity, quotation integrity, quoted-verse-is-the-verse, reading level, title in narrative, full levels (174 tests); curriculum diversity, curriculum gates, curriculum round trip, every stage reaches the reader, learn crosslist, lesson store, id collision, living lessons order, TLC curriculum, the lesson count is derived (117 tests); the series-level living-lessons suites (102 tests); L190 to L200 (257 tests).
