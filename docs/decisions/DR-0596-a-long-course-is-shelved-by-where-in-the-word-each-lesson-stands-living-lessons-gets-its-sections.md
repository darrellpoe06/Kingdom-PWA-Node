# DR-0596 — A long course is shelved by where in the Word each lesson stands: Living Lessons gets its Sections, from its own anchors, in canonical order

- **Status:** accepted
- **Tier:** A (one Learn surface, one pure helper; no schema, no transport, no money)
- **Type:** feature
- **Date:** 2026-09-23
- **Scope:** `app/src/lib/lesson-sections.js` (new — the Word's eight divisions, first-anchor placement, `sectionLessons`, `wantsSections`, `sectionHolding`); `app/src/components/ChurchLearn.jsx` (the pick-a-lesson-by-title index renders sections at or above 30 lessons; shorter courses keep the flat list); `app/src/__tests__/living-lessons-sections.test.jsx` (new — 8 pins incl. proven-to-catch and a real-tree render)
- **Principles:** WORD-FIRST (DR-0097), REALITY-TRACE (DR-0061 — real data, never a painted theme), DO-NOT-RE-ASK (DR-0111 — recommend-and-proceed with a stated default), VERIFICATION-DOCTRINE (DR-0076 §4 measure, §3 proven-to-catch)
- **Grounds:** Darrell 2026-09-23, with a screenshot of the course picker on his Fold reading "WW-101 · Living Lessons from the Word · 189 lessons": *"Living Lessons may need their own Sections..."*.

## Context

The Learn tab's pick-a-lesson-by-title index lists a course's lessons in one scrolling column (45 vh tall). For an eight-lesson course that is a shelf; for Living Lessons at 189 it is a scroll with no landmarks — the reader who wants "the one on Habakkuk" or "the ones in Proverbs" has nothing to hold. The lessons carry no series or theme field (measured: none of `series`, `section`, `theme`, `tags`, `category`, `arc`, `part`, `strand` is set on any of the 189), so a typed grouping would have been invented data, which DR-0061 forbids. What every lesson DOES carry is its anchor passage, and the anchor's book places it in the Word.

**Assumption stated (DR-0111 default):** "Sections" is read as sections INSIDE the Living Lessons course (its lessons shelved), not a separate department for the course in the picker; the picker already groups courses by department. If Darrell meant the latter, the helper still stands and the picker row is one line to move.

## What was measured

| what | measured |
| --- | --- |
| lessons | 189; first-anchor books span 45 of the 66 |
| by the Word's divisions | The Law 22 · History 8 · Wisdom & Poetry 33 · The Prophets 16 · The Gospels 47 · Acts 6 · The Letters 56 · Revelation 1 — every lesson placed, none Unplaced |
| the rule | the FIRST reference's book of `anchor.ref` ("Matthew 5:48; Genesis 17:1" → Matthew); 179 of 189 anchors carry more than one reference, so the rule is stated on the shelf's own file and pinned |
| threshold | `SECTION_MIN_LESSONS = 30`: Living Lessons (189) is shelved; the next-longest courses (18, 17, 14) keep the flat list |
| the render | on the real Learn tree with Living Lessons picked: 8 `<details>` sections whose summary counts add to 189, 189 rows, exactly one section open (the one holding the last-opened lesson, else the first); the Business Research course (8) renders the unchanged flat list |
| what did not change | the heading's stated count, the Recently-opened row, the ▶ Play door on every row, the order the by-title index keeps before the finder and the cards (`learn-lesson-index-is-next`, 14 pins green) |

## Impact

A reader of the longest course sees eight named shelves in the Word's own order instead of 189 undifferentiated rows, and lands on the shelf that holds where they last were. Nothing is typed in by hand: a new lesson shelves itself by its anchor the day it is minted, and a lesson whose anchor cannot be read is shown under Unplaced rather than vanishing, so the shelf count always equals the course count. Every other course is untouched.

## Decision

1. At or above 30 lessons the by-title index renders sections; below it the flat list is unchanged.
2. Sections are the Word's divisions in canonical order — The Law, History, Wisdom & Poetry, The Prophets, The Gospels, Acts, The Letters, Revelation — and a lesson belongs to the division of its first anchor's book; unreadable anchors go to Unplaced.
3. The section holding the last-opened lesson starts open; otherwise the first.
4. The counts on the shelf are the measurement, and the test pins that they add up to the course on the real tree.

## Verification

- `npx vitest run src/__tests__/living-lessons-sections.test.jsx src/__tests__/learn-lesson-index-is-next.test.jsx src/__tests__/learn-crosslisted-in-the-picker.test.jsx` — 22/22; the proven-to-catch pins refuse a dropped unreadable anchor and a short course rendering sections.
- After merge: DR-0104 live review of Church → Learn → Living Lessons on a phone width — the eight shelves, the open one, and a tap into a lesson from a shelf.
- re-review: 2026-10-07 — ask whether the Word's divisions are the shelves Darrell wanted or whether he meant a department of its own; and whether a second axis (the lesson's minted month) would help the family find "the newest ones".
