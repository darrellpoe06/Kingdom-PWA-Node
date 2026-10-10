# DR-0865 — A coloring page for every lesson, so a child too young to read it still receives it

- **Status:** accepted
- **Tier:** B (family-facing teaching content for children)
- **Date:** 2026-10-10
- **Type:** product
- **Scope:** `app/src/lib/coloring-page.js` (new, pure), `app/src/__tests__/a-coloring-page-for-every-lesson.test.js` (16 cases)
- **Principles:** WORD-FIRST (DR-0127), THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), VERIFICATION-DOCTRINE (DR-0076), TYPOGRAPHIC-THEOLOGY (CLAUDE.md Layer 0), DR-0459 (a quotation is never altered), DR-0121 (derived, never retyped)
- **Grounds:** Deuteronomy 6:7; DR-0431 (Little Learners — the littlest learners' own course, Flesch-Kincaid ≤ 1.0, read aloud, Ari in child mode); DR-0422 (L158, *How the worlds were made — for a child, Word based on the Word*, a real child-level Genesis lesson held under the 5.0 ceiling); DR-0215 (the ~25-minute Love Corner slot and **at least two parable/story beats per lesson**, funny and solemn — the story beats a child can already receive); DR-0417/DR-0418 (a new lesson ships with four full bands, child under 5.0)
- **Corrected 2026-10-10, before merge:** an earlier draft of this line also cited **DR-0427** and **DR-0423**, from their filenames rather than their contents, and both were wrong. DR-0427's "little ones" are small **TEXT**, not small children — a stylesheet floor for tiny labels at Big Print. DR-0423 (L159) is *we are all children of Yahweh*, about every person being His child by making and by adoption; it is not child-audience content. Caught by the ari-guard cited-but-unread hook (DR-0076 §8 / DR-0250). A citation is a claim that the source was read, and these two had not been.

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

- ~~**The in-app surface** — a "Color this lesson" button beside the lesson, and a printable booklet of a whole month. The library is pure and the SVG prints; the placement is the next change. **re-review: 2026-10-17**~~ **ANSWERED 2026-10-10 by DR-0866**, both halves, the same day rather than the dated one (DR-0236). That record also carries three faults in the library above that were found only by rendering the real sheets and looking at them: 214 of 236 sheets printed text off the paper, and the `hand` symbol read as an obscene gesture on 122 of them.
- **The children's spine Darrell named in the same breath** — *"Abc's 123'.... etc... Genesis - Revelation... Adam and Eve... etc... basic building blocks of Yahweh's Perspectives explicitly for the children."* That is Little Learners slice 2 and beyond, whose own `re-review: 2026-09-22` is **18 days overdue** as of today. Recorded here so the overdue date is visible rather than buried. **re-review: 2026-10-13**
