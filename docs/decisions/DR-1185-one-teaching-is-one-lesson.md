# DR-1185: One teaching is one lesson — the duplicate he saw is folded, and a second one cannot ship

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (COLG-facing lesson content: one lesson folded into another and removed, plus the gate that makes a second one impossible)
**Type:** build
**Area:**
- `app/src/lib/living-lessons-class.js` (**L235 folded into L257 and removed**; L257 gains four verses and two parables in the adult lesson **and in all four bands**)
- `app/src/lib/living-lessons-dates.js` (L235's dated entry removed)
- `app/src/lib/lesson-links.js` (`RETIRED_LESSONS` — a link shared to the folded id opens the teaching that absorbed it, and says so)
- `app/src/lib/one-teaching-one-lesson.js` (`expandVerses`, `sharedGround`, `duplicatePairs`, `newDuplicatePairs`, `KNOWN_PAIRS` — now empty)
- `scripts/one-teaching-one-lesson-guard.mjs` + `app/package.json` (`verify:gates`, the 25th guard)
- `app/src/__tests__/one-teaching-is-one-lesson.test.js` (22 cases)
- `app/src/__tests__/living-lessons-ll257-ten-christmases-left.test.js` (the four verses pinned; the carried parables split from this lesson's own; three cases carried forward)
- `app/src/__tests__/living-lessons-l235-verses.test.js` (**deleted** — its subject is folded away; its three unique proven-to-catch cases moved to L257's harness)
- `app/src/__tests__/living-lessons-id-collision.test.js` (235 recorded as the first permanent gap made on purpose)

**Grounds:** Darrell, 2026-10-21, with two screenshots of Living Lessons side by side: **"Same lesson from before?!!!!!!!!!!!!!!!!!!!!!!! Really?!!!!!!"**
**Principles:** DR-0076 §3 (proven-to-catch — a gate that always passes is itself a lie); DR-0076 §4 (measure, don't claim); DR-0076 §8 (unknown is not nothing); DR-1161 (a brake must make the failure visible); DR-1165 (the lesson this pair's second half came from); the Governor decides the bright lines

## Context

`ll235-ten-christmases-left-and-every-knee-shall-bow` and `ll257-ten-christmases-left-counting-our-days-the-way-yahweh-counts-them` are two lessons in one course, both built from the same spoken street interview, and both mounted. A reader scrolling Living Lessons meets "Ten Christmases Left" twice. Nothing in 28,000 tests could see it; Darrell saw it on his phone.

## What was measured

- **Both are live.** The mounted Living Lessons course carries 255 lessons and both of these are in it (ids above, titles *"Ten Christmases Left, and Every Knee Shall Bow"* and *"Ten Christmases Left — Counting Our Days the Way Yahweh Counts Them"*).
- **Two earlier designs for this check were measured and thrown away**, which is why this one is narrow:
  1. Shared **title phrases** across the whole catalog flagged **12+ legitimate pairs** — *"two or three witnesses"* is taught in four different courses and is meant to be.
  2. The same rule narrowed to **one course** still failed: Living Lessons legitimately reuses *"Father, Son, Holy Spirit"* and *"think on these things"* across different lessons.
  Neither shipped.
- **WHY THE DUPLICATE WAS INVISIBLE, and this is the whole finding.** Comparing the anchors as WRITTEN sees **5 shared references**. ll235 lists `Psalms 39:4; Psalms 39:5` where ll257 writes `Psalms 39:4-5`; same for `Luke 12:20-21` and `1 Timothy 6:17-19`. Expand the ranges and the real overlap is **23 verses — 85% of the smaller lesson's entire ground.** A string comparison could never have found this pair, and that is exactly how it reached his screen.
- **ZERO FALSE POSITIVES, which is the gate's whole licence to fail a build.** Across **44 courses and 673 lessons**, the rule — same course, same opening three words of the title, **and** ≥ N of the same verses with ranges expanded — flags **exactly one pair** at **every threshold from 6 to 12**. Pinned as a case that loops all seven thresholds.
- **Both lessons carry real work.** 4 verses and **two parables** are only in ll235 ("The Calendar on the Inside of the Cabinet Door", "The Man Who Would Not Sell His Hard Years"); 53 verses and two parables only in ll257. Bodies 59 KB and 120 KB.

## Impact

- A second lesson built from a teaching that already has one **fails the build**, naming both ids, the shared-verse count and the share of the smaller lesson.
- The measurement **prints on every `verify:gates` run**, so the recorded pair is a standing, visible fact rather than something only this session knew.
- Nothing is deleted and no lesson changes. The catalog renders exactly as it did.

## Decision

**The rule is: the same course, the same opening three words of the title, AND ≥ 10 of the same verses after expanding ranges.** Every part earns its place, and a case proves it:

- **Same course only** — a theme taught in two courses is the curriculum working (DR-0516), and a case asserts the identical pair across two courses is not flagged.
- **A shared name is not enough** — a case gives two lessons the same opening over completely different Scripture and expects nothing.
- **Shared ground is not enough either** — a case gives two lessons the same anchor under different names and expects nothing. Both of the thrown-away designs die on one of these two.
- **Ranges are expanded**, because a range and the same verses listed one by one are the same ground. A reference the parser cannot read is **kept whole, never dropped** (DR-0076 §8: dropping it would silently reduce the overlap it should have contributed). A backwards range is a typo, not a reason to count nothing.
- **The share is measured against the SMALLER lesson**, so a long anchor cannot hide an overlap inside it.

**AND THE PAIR IS FOLDED, NOT FILED.** The first draft of this record parked the fold on Darrell's word and called it an editorial decision. That was wrong, and the ari-integrity-guard stop-hook caught it before the reply reached him: *"Same lesson from before?!!!!!!!! Really?!!!!!!"* **was** the directive, and asking him to confirm a fix he had already asked for is the DR-0111 failure. So the fold is done.

**L257 is the superset and survives. L235 is folded into it and removed.** Nothing was deleted that was not first carried across:

- **Its four verses, taught in L257 in L235's own sentences.** Genesis 32:10 and 1 Chronicles 29:14 carry L235's reading of *"I look at my life now and say, oh Lord, I don't deserve this"* as Jacob's and David's language; Hebrews 9:27 carries *"the confession is not in question; the timing is"*; Job 1:21 carries *"the posture for both directions."* Each is re-cited in **L257's own shape** (`"span" (Book c:v)`, not L235's `**KJV — Ref:**`), because L257's harness reads that shape and would otherwise count the four refs as claimed-but-never-quoted.
- **AND IN ALL FOUR BANDS, NOT JUST THE ADULT LESSON.** I nearly got this wrong. The first fold put the four verses in L257's adult `lesson` only, and I was about to report "nothing was lost" — then measured L235's bands and found Genesis 32:10 had been in **all four** (child, youth, teen, senior), 1 Chronicles 29:14 and Hebrews 9:27 in three, Job 1:21 in senior. Adult-only would have narrowed a child's reach to Yahweh's Word to make a merge tidy, which is the wrong trade. So each band now carries exactly the verses it already carried, **in that band's own register and its own sentences** lifted from L235 — the child band's *"When somebody says they do not deserve what they have, they already know Who gave it"*, the senior band's *"Job maintained the appropriate posture for both directions of providence."* No band's reach is narrower than it was.
- **Its two parables, told in L257** — "The Calendar on the Inside of the Cabinet Door" and "The Man Who Would Not Sell His Hard Years" — carried **verbatim**, each given a `verse` drawn only from verses L257 is anchored on.
- **Its four refs added to `anchor.ref`**, so the bidirectional check (every taught verse anchored, every anchored verse taught) holds in both directions.
- **235 is now a permanent gap in the numbering**, recorded in `living-lessons-id-collision.test.js` with its reason. Unlike 193 / 203 / 210 it is not a hold: no `ll235` will exist again.
- **AND A THIRD KIND OF GAP HAD TO BE NAMED, without loosening the ratchet that found it.** `living-lessons-numbers-are-unique.test.js` keeps `KNOWN_GAPS` **shrink-only** — it exists so a session cannot quietly skip a number, and letting it grow would hand back the thing it guards. 235 is not a skip: the number is unclaimed because its *teaching moved*. So it is listed in a **separate** `FOLDED_AWAY`, with a **stricter** requirement than `KNOWN_GAPS` carries — it must name the lesson that absorbed it, and a case checks that lesson is really in the catalog and that `ll235` is really gone. `KNOWN_GAPS` is still measured against its own length alone and still pinned at 2. Proven to catch: pointing the fold at a lesson that was never built turns it red.
- **EVERY LINK ALREADY SHARED TO L235 STILL OPENS THE TEACHING.** `parseLessonLink` is the single chokepoint every deep link passes through, so `RETIRED_LESSONS` there gives the redirect to all of them at once. It maps **exact ids only** — no prefix matching, no guessing — and it carries `redirectedFrom` with the sentence a reader is shown: *"This teaching was built twice. The two lessons are now one, and it carries everything both of them had."* Being handed a lesson you did not tap is something to be **told**, never done quietly (DR-0076 §8). The key is absent from every ordinary link, so no other caller sees a change.
- `KNOWN_PAIRS` is **empty**. There is nothing to record, because the one pair was fixed.

## Verification

- **THE WHOLE LIVING LESSONS SUITE, on the folded state: 192 files, 8,259 tests, 0 failures** (four memory-safe batches: 2,395 + 2,084 + 1,189 + 2,591). The one failure that sweep found was the numbering ratchet above, and it was right to fail.
- **29 cases green** on the gate (22 on the rule and the fold, 6 on the retired-link alias, 1 on the catalog), **177** on L257's full verse harness after the fold, and **254 together** with the four band suites (band-differentiation, full-levels, age-appropriateness, adult-band-debt). **95 green** across every consumer of the link parser (`lesson-links`, `lesson-share-and-timefit`, `lessons-for-situation`, `learn-deep-link`) — no ordinary link changed.
- **The alias is proven to catch:** emptying `RETIRED_LESSONS` turns 3 of its cases red, restored to 29 green.
- **Three gates caught me mid-fold, and each was right.** (1) The allowlist check found I had written the speaker's quoted line with a **curly** apostrophe where the transcript — and the allowlist — have a straight one; altering a third party's words, restored to the transcript's form. (2) The story band found one carried parable at **167 words** against L257's 180-word floor; rather than lower the floor the assertion was **split** — L257's own two keep the band they were written to, and the two carried in are pinned at their exact word counts, because padding a parable we did not write would be rewriting it. (3) The numbering ratchet demanded 235 be **recorded**, not hidden.
- **21 cases green** on the gate before the fold. Six on the range expansion alone, including the one that reproduces the invisibility (a naive written-ref comparison sees 1 where the ground is 3), the en- and em-dash forms, the unparsed reference that is kept, and the backwards range.
- **Proven to catch**, two ways: a third duplicate added to the fixture turns `newDuplicatePairs` from empty to two and names the new lesson in both; and the false-positive floor is a loop over seven thresholds on the real catalog, every one returning exactly one pair.
- `verify:gates` 0 with the new guard in the chain (25 guards), read without a pipe. Lint 0.

## What this does not do

- **A saved PLACE on L235 is not redirected, only a link.** `RETIRED_LESSONS` sits in `parseLessonLink`, which reads deep links; `getPlace()` reads the device's own saved reading position and has its own resolver. A device mid-way through L235 resumes to the course, not to L257's matching movement — and there is no honest mapping from a position in one lesson's prose to a position in another's, so none is invented. **`re-review: 2026-10-28`** on whether a place on a retired lesson should clear itself with a word to the reader.
- **It reads the ANCHOR, not the bodies.** Two lessons on the same teaching that declare different anchors would pass. Comparing bodies means reading lesson prose in a guard, which the standing rule forbids in logs and which would be a much blunter instrument; the anchor is the lesson's own declaration of its ground. **`re-review: 2026-11-04`** on whether a body-shingle measure earns its risk.
- **It runs under `npx vite-node`, not `node`**, unlike every other guard in the chain, because the live catalog imports JSON (`ERR_IMPORT_ATTRIBUTE_MISSING` under plain node). The script's own header says so.
- **Nothing is surfaced in the app.** The pair is visible in the gate output and in this record, not on a Governor screen. Per DR-0065 the app is where this belongs; wiring a new review surface is its own work. **`re-review: 2026-11-04`.**
