# DR-1299: The timeline lives in the Bible, and each lesson shows its own books on it

**Date:** 2026-11-03
**Status:** Accepted
**Tier:** A (additive surface: catalog data already in the repo drawn in two more places; no schema, no new data, no account needed)
**Type:** surface
**Area:** the Bible reader (`app/src/components/BibleReader.jsx`), lesson figures (`app/src/lib/lesson-figures.js`, `app/src/components/LessonFigures.jsx`), the road between them (`app/src/lib/bible-timeline-link.js`)
**Declared by:** Darrell, 2026-11-03, with a phone screenshot of L270's chart in the midnight theme:

> "I want this to be inside the bible we already have so users can see the timeline with or without the lesson so it's accessible to all users... also make it available in a intuitive way so it makes the data and timelines clearer in each lesson... make sense?"

**Pairs with:** DR-1296 (lesson figures: the chart L270 draws), DR-1263 (L270), DR-0076 (verify, and say what was not verified), DR-0065 (build it in the app)

## Context

DR-1296 drew the Progress of Revelation chart (all sixty-six books in the order the chart says they were written, with date and author) inside Lesson 270 only. A reader who opened the Bible itself, the Scripture room's "The Word · Full Bible KJV", had no way to see when the book in front of them was written. A reader in any other lesson had no way to see where the books that lesson quotes sit in time. The data already existed in one place, `lib/progress-of-revelation.js`. The gap was only where it was drawn.

## What was measured

- **The data and the Bible agree on every name.** All 66 book names in `PROGRESS_OF_REVELATION` resolve with the Bible's own `bookMeta`, including "Psalms" and "Song of Solomon". So every row of the chart can open its book.
- **Every Living Lesson already names its books.** `anchor.ref` is a semicolon list of references (lesson 1: `Matthew 5:48; Genesis 17:1`). The gate `every-anchor-is-named-in-the-lesson` holds the lesson to them.
- **The Bible is open to every reader.** It sits under Scripture in the church face, which a Love Corner visitor reaches with no account ("FREE TO READ, NO ACCOUNT").
- **A first 360px shot of a lesson's small chart showed two defects**, both fixed before shipping:
  - **Wrong scale.** Each part was drawn on its own years, so Genesis (1445 to 1405 BC) filled the whole width, as long as the whole Old Testament.
  - **Ambiguous numbers.** The chart's writing-order number, "3. Matthew", read as a list number over a two-row list.

## Decision

1. **One builder, three places.** `bookTimelineFigure()` draws the chart from `PROGRESS_OF_REVELATION`. L270 and the Bible draw all 66 books. Every other lesson draws only the books it quotes. L270's figure is now built by the same function, and a test pins that its rows equal the Bible's.
2. **In the Bible, for every reader:**
   - **A panel, "When each book was written — all 66 on one timeline".** It is folded until asked for, the way the themes index is. Every book is a button that opens it. The book being read is marked "reading now", and the panel scrolls to it when opened.
   - **A line under every chapter heading:** "Written 1445 to 1405 BC · Moses · On the timeline". For Job it reads "The chart gives no date · Anonymous", the chart's own words, never a made-up date.
3. **In each lesson:**
   - **A small chart of the books it quotes,** titled "When the 2 books this lesson quotes were written". Each row says its place in words ("2nd of 39 written") on the whole testament's scale, so a bar sits where it sits on the full chart.
   - **A link on it and on L270's chart:** "See all 66 books on the timeline in the Bible".
   - **Rendered only for the open lesson,** inside the same figure block DR-1296 gated for memory.
4. **The road from a lesson to the Bible** is a plain address, `?view=church&sub=scripture` with the door parameters kept, as `hrefForView` gives every surface. The wish to open the timeline rides one sessionStorage entry, which the Bible reads once on mount and clears. Storage that throws just means the Bible opens folded.

## Impact

- **Any reader can see when a book was written** while reading it, with or without a lesson, and can open any book from the chart.
- **Every Living Lesson that quotes Scripture now shows its books on the timeline.** It is the same chart, so a date in a lesson can never disagree with the Bible's.
- **The chart's honesty travels with it everywhere:** its source line, its "Unknown", "Anonymous" and "(?)", and the sentence "We did not check the chart against any other chart."
- **Honest limits:**
  - The small chart reads only a lesson's anchor references, not every verse quoted in its body. A lesson quoting a book only in its stories does not show that book. `re-review: 2026-12-01`, measured against the lessons' full quote sweep.
  - Courses other than the Living Lessons show a chart wherever their modules carry `anchor.ref`, and none where they do not.

## Verification

- **`the-timeline-lives-in-the-bible.test.jsx`: 17 tests.** Mounted and clicked against the shipped KJV on disk:
  - every chart name opens in the Bible, and L270's rows equal the Bible's;
  - lesson 1 shows Genesis and Matthew in writing order, with the chart's own date and author and "2nd of 39" / "3rd of 27";
  - L270 gets no second chart, and a lesson quoting no book gets none;
  - the lesson's link points at the Scripture room;
  - the Bible shows the line under the heading, opens to 66 buttons, marks "reading now", and a tap on Matthew opens Matthew 1;
  - Job reads "The chart gives no date";
  - arriving from a lesson opens the timeline once and clears the wish; blocked storage never breaks the Bible.
- **Proven to catch:**
  - With main's `BibleReader.jsx` restored, the 5 Bible cases fail.
  - The scale case asserts that a part drawn on its own years would fill the width (the defect found on the first shot), and that the whole testament's scale is kept.
- **Existing suites:** `lesson-figures` (with the "renders nothing" case narrowed to a lesson that quotes no book, since lesson 1 now rightly shows its books), `bible-reader-render`, `bible-reader-edition`, `living-lessons-ll270`, `ui-standards-set`, `american-spelling`, `continue-a-lesson-numbers` and `the-place-is-visible-and-continue-stays` all pass.
- **The UI standard caught one defect:** the "On the timeline" button was 32px, under the app's 36px floor. It is now 44px.
- **Measured at 360px** in a real Chromium against the dev build, in the cream and midnight themes:
  - the Bible line under the heading, the panel with 66 rows, a tap on Isaiah opening "Isaiah 1 | Written 700 to 681 BC · Isaiah", and the lesson's small chart;
  - sideways overflow 0px on every page.
- **Lint:** `npx eslint src --max-warnings 0` is clean, and `legibility-guard --health` shows no regression.
