# DR-0867 — Noah joins the children's spine: grace, the door Yahweh shut, and the bow in the cloud

- **Status:** accepted
- **Tier:** B (family-facing teaching content for children)
- **Date:** 2026-10-10
- **Type:** product (lesson)
- **Scope:** `app/src/lib/little-learners-class.js` (lil8, new), `app/src/__tests__/little-learners-course.test.js` (count pinned 7 → 8), `app/src/lib/course-band-coverage-baseline.json` + `app/src/__tests__/course-band-coverage.test.js` (allFour 233 → 234), `app/src/lib/lesson-dates.json` (derived)
- **Principles:** WORD-FIRST (DR-0127), VERIFICATION-DOCTRINE (DR-0076 — every verse fetched from disk, never from memory), TYPOGRAPHIC-THEOLOGY (CLAUDE.md Layer 0 — Yahweh in our voice, the KJV's own words inside every quotation), DR-0417/DR-0418 (four full bands, child under the ceiling), DR-0733/DR-0795 (talk-together in every band)
- **Grounds:** DR-0431 (Little Learners — the littlest learners' own course, read aloud, Ari in child mode), DR-0866 / DR-0865 (the coloring page, which lil8 now also yields), and lil7 (Adam and Eve), the first lesson of this spine

## The word, as spoken

Darrell, 2026-10-10: *"Abc's 123'.... etc... Genesis - Revelation... Adam and Eve... etc... basic building blocks of Yahweh's Perspectives explicitly for the children..."*

Adam and Eve landed as lil7 the same day. Noah is the next joint in that spine.

## What was measured

Before: Little Learners carried **7** lessons. The Genesis-to-Revelation spine Darrell named had exactly one of its stations written.

## The decision

**lil8 — Noah: grace, the door Yahweh shut, and the bow in the cloud.** Five bands, written by hand, each in its own register.

Three things are taught in the order Genesis puts them, because the order *is* the doctrine:

1. **Grace comes first.** The account turns on one clause set against an entire corrupt generation — *"But Noah found grace in the eyes of the LORD."* (Genesis 6:8) — and it comes **before** a single plank is cut. He is not favoured because he built the ark; he builds the ark because he was given grace. Taught backwards, the whole account becomes a story about earning, which it is not.
2. **Yahweh shut the door Himself.** The text is careful about it: *"and the LORD shut him in."* (Genesis 7:16) Noah is not braced against the door holding the flood out. He is kept — a different kind of safety from the kind maintained by your own grip. This is the detail the child band asks about by name and the senior band dwells on.
3. **The bow is a promise He undertakes to remember.** *"I do set my bow in the cloud, and it shall be for a token of a covenant between me and the earth."* (Genesis 9:13), and the remembering is assigned where it belongs: *"And the bow shall be in the cloud; and I will look upon it, that I may remember the everlasting covenant..."* (Genesis 9:16). The burden of recollection is His, not ours.

**Every verse was fetched from `app/public/bible/kjv/Genesis.json` and pasted whole** — Genesis 6:8, 6:14, 6:19, 6:22, 7:16, 8:11, 9:13, 9:16. That is not a formality: Genesis 9:13 reads *"it shall be **for** a token"*, and from memory it would have been written "a token". In our own voice it is Yahweh; inside a quotation the KJV's own "God" and "the LORD" stand exactly as written.

## Verification

Measured on the live gates before the lesson was written into the catalog file, not asserted afterwards:

- **The read-aloud lesson band**: 2,190 characters (floor 1,000), Flesch-Kincaid **0.68** against a ceiling of 2.0.
- **The ladder rises and every band clears its floor** (shares of the lesson's own prose): child 0.66 / grade 0.50 · youth 0.96 / 4.39 · teen 1.13 / 7.36 · senior 1.05 / 10.07. child < youth < teen ≤ senior holds; child is far under the 5.0 ceiling.
- **Four real versions, not one repeated**: worst band overlap **0.02** against a ceiling of 0.25.
- **Every band names its lesson** near its start, and every band carries its own *Talk about it together* with all three directions (DR-0795).
- **All 30 quoted spans** across the five bands were checked against the KJV on disk by `scanQuotedVerses` — zero faults. No generic term appears in our own voice in any band.
- **Suites**: 60 green across `little-learners-course` and `course-four-bands-group-a`; 23 across `course-band-coverage`; plus talk-together, quotation integrity, American spelling and the verse gate. eslint clean.

## The ratchets this moved, each on purpose

- Little Learners count **7 → 8**, pinned EXACTLY rather than relaxed to a floor, so a lesson silently vanishing still turns the gate red.
- `course-band-coverage` allFour **233 → 234**, regenerated from the real catalog by `course-band-baseline-write.mjs`, never typed by hand. **adultOnly stays 0** — the figure that actually matters: not one lesson in the catalog serves a child adult prose under a child's label.

## What is NOT in this slice, with a date

- **The rest of the spine**: Abraham, Moses, David, the Lamb, the Cross, the Empty Tomb, the King returning. Noah is the second station of eight-or-so. **re-review: 2026-10-17**
- **Little Learners slice 2's letters and numbers** — D–Z and 8–20 — remain unwritten; DR-0431's own date is still the governing one for those. **re-review: 2026-10-17**
