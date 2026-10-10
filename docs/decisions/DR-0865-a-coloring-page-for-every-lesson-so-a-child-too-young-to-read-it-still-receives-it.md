# DR-0865 — A coloring page for every lesson, so a child too young to read it still receives it

- **Status:** accepted
- **Tier:** B (family-facing teaching content for children)
- **Date:** 2026-10-10
- **Type:** product
- **Scope:** `app/src/lib/coloring-page.js` (new, pure), `app/src/__tests__/a-coloring-page-for-every-lesson.test.js` (16 cases)
- **Principles:** WORD-FIRST (DR-0127), THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), VERIFICATION-DOCTRINE (DR-0076), TYPOGRAPHIC-THEOLOGY (CLAUDE.md Layer 0), DR-0459 (a quotation is never altered), DR-0121 (derived, never retyped)
- **Grounds:** Deuteronomy 6:7; and DR-0431 (Little Learners), DR-0427 (the little ones' text size), DR-0215 (parables and stories as curriculum design)

## The word, as spoken

Darrell, 2026-10-10, after measuring the age bands with me: *"We wanted children stories... like below 6 - 10 years old so they can also have lessons... DRs?"* Then: *"Coloring books with words inside... that reflect the same lesson..."*

## What was measured

- The **child band is not written for a six-year-old.** Its ceiling is grade 5.0 (`NEW_LESSON_CHILD_CEILING`), and the bands measured this session sit at **3.65 to 5.3** — a nine-to-eleven-year-old reader.
- The littlest have **6 lessons of their own** (Little Learners, DR-0431, Flesch-Kincaid ≤ 1.0) against a catalog of **791**. So a small child meets almost the whole catalog as a wall of words.
- Separately, and feeding the same gap: **360 youth and 248 child versions are unwritten** across those 791 lessons (child 473 written, youth 361).

## The decision

1. **Every lesson yields a coloring page, derived from the lesson itself.** Title and verse in big outlines, a handful of plain symbols, and words to trace. Nothing about a lesson is retyped here, so a lesson edited upstream changes its page (DR-0121). Measured: all 236 Living Lessons produce one.
2. **The verse is lifted VERBATIM out of the lesson's own child band** — the simplest wording the lesson already approved, and text that already passed `course-quotation-integrity`. The page composes, trims and paraphrases nothing (DR-0459, Layer 0). A lesson that quotes nothing simply gets a page with no verse rather than an invented one.
3. **The shortest real span wins**, because a small hand has to trace it.
4. **Names are never handed to a child in lowercase.** The first cut lowercased every traced word to dedupe, and L14's sheet came back asking a child to trace *"jesus"*. A coloring page is copied **by hand**, which makes it the last place in the app to teach the lowercase form. Words are matched case-insensitively and printed in the lesson's own casing, and a gate walks all 236 lessons for the fault.
5. **Honest about what it is.** Nobody drew 236 pictures. It is a fixed library of plain outline symbols chosen by the words the lesson itself uses, plus the real verse and real words. A lesson whose words match no symbol still gets a sheet.

## Verification

16 cases, proven-to-catch where it counts: the chosen verse must appear character-for-character inside the lesson (walked across all 236); every traced word must really occur in the lesson; no Name may print lowercase; the sheet's title, verse and words must render as `fill="none"` outlines or there is nothing for a crayon to do; markup is escaped so a title with punctuation cannot break the page. Two real sheets were generated and read before this shipped, which is how the lowercase-Name fault was found.

## What is NOT in this slice, with a date

- **The in-app surface** — a "Colour this lesson" button beside the lesson, and a printable booklet of a whole month. The library is pure and the SVG prints; the placement is the next change. **re-review: 2026-10-17**
- **The children's spine Darrell named in the same breath** — *"Abc's 123'.... etc... Genesis - Revelation... Adam and Eve... etc... basic building blocks of Yahweh's Perspectives explicitly for the children."* That is Little Learners slice 2 and beyond, whose own `re-review: 2026-09-22` is **18 days overdue** as of today. Recorded here so the overdue date is visible rather than buried. **re-review: 2026-10-13**
