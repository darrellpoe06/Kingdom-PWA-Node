# DR-1393: All lessons lands at the top; the Record tab opens on the record, picks a learner in one tap, never runs off the edge, and names what it waits for

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** A (navigation and the record's layout; no schema)
**Type:** surface fix
**Area:** Learn space (ChurchLearn, LearnersPanel)
**Sent in by:** Darrell, five messages and one Big Print screenshot, 2026-11-10
**Pairs with:** DR-1383 (the lesson-end doors), DR-0754 (the class record), DR-1386 (credit where it is due)

## Context

His words: "Clicking all lessons takes a user to the bottom of the page!!!!! Fix it!!!!!"; "Record doesn't open a users record!! It should!!!... it currently opened the information about it... we want the record"; with a screenshot, "the screen on the right cutting off fields"; "No 100% even after completing all lessons... Evaluation of systems"; "each user needs to have a drop-down for choosing them... so I can see my recent records or my son's without needing to scroll".

## What was measured

- **All lessons.** Two later scrolls overrode the landing at the top: the leave effect scrolls back to the row just left 60 ms after focus clears, and the newest lessons sit last; and leaving unwinds the lesson's history entry (`useHistoryValue`), after which the browser restores the list's old scroll. The sticky lessons bar was also the landing target, and a stuck sticky element never moves when scrolled to. DR-1383's gate missed it because it never waited past 60 ms.
- **Record.** The class record fold was closed and the library fold (information about the record) was open.
- **Cut off.** The course table had five columns; at Big Print the fourth and fifth ran off the right edge.
- **No 100%.** Completion is lessons with a read on the record over the course's lessons. The record could not say which lessons it was missing, so a gap could not be checked or closed. This session's database role cannot read learners' rows (row security), so the specific missing lessons were not measured here; the fix makes the screen name them.

## Decision

1. Both All lessons doors forget the row just left (`lastFocusRef = null`), land on a non-sticky anchor `#learn-all-lessons-top` above the bar, and land again when the history unwind pops (fallback one second).
2. The Record tab opens with the class record unfolded and the library folded.
3. Course by course is stacked blocks (the name, then labelled pairs that wrap), never a table.
4. Each course names the lessons not on the record yet, by number and title; on your own record each is one tap to read. More than twelve fold behind one line.
5. The Governor gets a "Whose record" picker (you first, then by latest activity) and sees one learner at a time.

## Verification

- `no-dead-end-at-the-lesson-end.test.jsx` case 4 now waits past the back-scroll and the unwind: the last landing is the top anchor and nothing scrolls back to a lesson, for both doors. Proven to catch: before the fix, it landed back on the lesson row.
- `leaving-a-lesson-lands-at-the-top.test.js`: the bar's All forgets the row and aims at the anchor, which sits just above the bar.
- `the-record-opens-on-the-record.test.jsx` (5): record open and library folded; the picker shows one learner, you first; no table, wrapping pairs; the two missing lessons named and tappable; proven to catch: a whole course says so and names nothing.
- `learners-panel.test.jsx` 19 and the record and library gates green.
