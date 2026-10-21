# DR-1190: Learn's areas are sub-tabs, and only the lessons scroll

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A (one surface, Church → Learn; the blocks keep their place and their order, each now behind the sub-tab it belongs to; no data, no money, no new door)
**Type:** surface
**Area:**
- `app/src/components/ChurchLearn.jsx` (the area strip, the `learnArea` state, the gates on each block, the landmark bar's Find hand-off, the return to Lessons when a lesson is requested)
- `app/src/lib/feature-registry.json` (the area tabs and the course download registered; the presence walk reaches every area)
- `app/src/lib/little-learners-class.js`, `mathematics-class.js`, `rent-to-own-business-class.js`, `development-class.js` (the lesson unit declared, with the reason)
- `app/src/__tests__/feature-presence.test.jsx` (the learn-lists walk opens each area)
- the Learn suites re-pointed to open an area before reaching for what lives in it (listed under Verification)
- `docs/99-session-notes/2026-10-21-learn-areas-are-sub-tabs.md` (the build log)

**Amends:** DR-1182 on where the every-course blocks sit (they were in page flow; they are now one tap each) and DR-0631 on the continue offer's place (it was directly under the picker; it is the Continue area, counted on its tab). Grounds: Darrell's 2026-07-04 and 2026-07-05 words that built `SectionTabs` ("let's use the sliding tabs for all tabs instead of a long scroll on any tab"; "a 3rd row of sliding tabs if that tab scrolls really long"), DR-0355 (explain each area), DR-0880 (leaving a lesson lands at the top of its list), DR-1183 (nothing is open until chosen), DR-0076, DR-0219.
**Declared by:** Darrell, 2026-10-21, while DR-1182 was being verified.

## Context

**His words.** "Visual needs to look nice and we need to be using subtabs not long scrolling except on the lessons we have an option and it defaults to scroll... make sense? All other locations we expect users to be using need to be able to be seen... make sense?"

**SHOULD (DR-0219).** Church → Learn is one page with one scroll (DR-1182), and that scroll is the lessons. Everything else a reader uses — where they left off, the newest lessons, the finder and the shelf, their record, the downloads — is seen by a tap, not found by scrolling past the lessons. That is the exact pattern `SectionTabs` was built for in July (a section slides; a sub-section slides as a chip row), already used inside `CourseView` for Join, Pace, My shares, Paper and the Story library.

**ARE, before this record.** After DR-1182 the Learn page under the picker was one long column: the one list of courses (or the chosen course's index), the continue offer, the latest list when sorted that way, the finder with the whole shelf, the course header, the catalog line and download-all, the landmark bar, the Word-first lead, the class record, and the course's cards. One scroll, as asked, but a reader looking for their record or the finder read down through the whole index to get there, and the only sub-tabs on the page were `CourseView`'s own, below everything.

**GAPS.** The every-course blocks had no tab; they stacked. The finder's shelf, on the Courses tab, was a second long list in the same scroll as the first. The landmark bar's "All lessons" button scrolled to a box that sat below the whole index.

**CLOSE.** One chip row under the picker, navigation only, gating the blocks where they stand.

## What was measured

| what | before | after |
|---|---|---|
| blocks stacked in the Learn page scroll under the picker (Courses tab, course open) | 10 (index, continue, latest, finder + shelf, header, catalog line, download-all, bar, lead, record, cards) | 1 area at a time; Lessons = header + bar + lead + index + cards |
| taps to reach the finder from the top of a 255-lesson course | 0 taps, one long scroll | 1 tap (Find), or the bar's "All lessons" which opens Find and focuses the box |
| taps to reach the class record | 0 taps, scroll past the index and the shelf | 1 tap (Record) |
| areas on a department tab | — | Lessons · Continue · Latest · Find · Record · Downloads (this course's download; the catalog's as well on Courses) |
| the lessons' own scroll | the page | the page, unchanged (DR-1182): the index and the cards, with the month folds as the length control |
| self-paced courses whose cards read "Week 1 · … date TBD" | 4 (`little-learners`, `mathematics`, `rent-to-own-business`, `development`: `unitCap: 'Lesson'` in the registry, no `unit` on the META) | 0; each META declares the lesson unit. The render gate's `/(Lesson)\s*1/` had passed for months off the every-course shelf's text; it read the course's own cards the moment the shelf moved into its area |
| registered Learn controls the presence walk could not reach | 1 (the lesson shelf, after the walk's "latest" sort moved it off Lessons) | 0; the walk opens every area, with and without a course |

Two mechanics the first run taught, both pinned: a lesson requested from Latest or Find lands in Lessons at once (the course view, which reports a lesson open, is mounted only there, so waiting on its report deadlocked and the latest-row tap rendered zero cards); and the Eternal Algorithms study is not an area of its own, because a Study area hid the course's progress bar that `course-duration` pins on every department tab.

## Decision

1. **A chip row of areas under the picker,** `SectionTabs variant="sub"`, `idBase="learn-area"`, aria-label "Learn areas": **Lessons** (default; labelled by the course's unit noun, "Courses" while nothing is chosen), **Continue** (with its live count), **Latest**, **Find**, **Record**, **Downloads**. The Eternal Algorithms study stays with the lessons on its department tab (the old route's landing; the course's progress bar survives on every department tab, as `course-duration` pins). Each carries an `explain` line that says what the area is (DR-0355). It is navigation only: every block keeps its place in the page and its order, gated by `learnArea`, so the order pins of DR-0598 / DR-0631 / DR-1183 still hold inside each area.
2. **Lessons is the one that scrolls.** The course's header, the landmark bar, the Word-first lead, the by-title index and the cards; while nothing is chosen, the one list of courses (DR-1183). The month folds remain the way a long list is kept short.
3. **The sort's "Latest lessons" option opens the Latest area** (the same control, now a tap into the area instead of a block inserted above everything).
4. **The landmark bar stays on every area** (Christina's "How do I get to the rest of the lessons?"), and its "All lessons" button opens the Find area and lands the focus on the box once it mounts.
5. **A lesson opened from any area returns the reader to Lessons when it closes** (DR-0880): leaving a lesson lands at the top of its course's list, never on the box or the offer they came from.
6. **The registry knows the areas.** Each tab is a registered control, and the learn-lists presence walk opens every area, so a control that lives behind a tab is still a control the gate can see (DR-0726).

`re-review: 2026-10-28`: Darrell reads Learn on his phone: the chip row's look beside the department strip, whether Continue should also keep its chip on the bar (it does), and whether the Downloads area earns its tab.

## Impact

A reader on any tab of Learn sees the course's lessons and scrolls them; everything else they use is one tap away in a row they can see, with a line under it saying what it is. Nothing was removed; nothing is reached by scrolling past the lessons any more.

## Verification

- `feature-presence.test.jsx` walks the learn-lists surface through every area and finds every registered control, including the six area tabs.
- The Learn suites that reached for a block that now lives in an area open that area first, the way a reader does, each with its reason beside the change: see the session note for the list and the counts.
- Order pins inside the Lessons area are unchanged and still pass: picker first, index next, then the bar and the cards.
- Measured on the final tree: the counts are in the session note.
