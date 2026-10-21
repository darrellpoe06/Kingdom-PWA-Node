# DR-1184: One teaching is one lesson — the duplicate he saw is now machine-visible, and the fold is his call

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (a gate over COLG-facing lesson content; it names an existing pair and decides nothing about it)
**Type:** build
**Area:**
- `app/src/lib/one-teaching-one-lesson.js` (`expandVerses`, `sharedGround`, `duplicatePairs`, `newDuplicatePairs`, `KNOWN_PAIRS`)
- `scripts/one-teaching-one-lesson-guard.mjs` + `app/package.json` (`verify:gates`)
- `app/src/__tests__/one-teaching-is-one-lesson.test.js` (21 cases)

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

**The existing pair is recorded, not folded, and the fold is Darrell's.** `KNOWN_PAIRS` carries it with the whole measurement and the sentence *"Folding them is Darrell's editorial call on his own teaching; nothing is deleted until he makes it."* Folding two lessons built from his own spoken word, on a COLG-facing surface, with two unique parables on each side, is an editorial and doctrinal decision — not a gate's and not mine. A case proves the recorded pair **does not excuse a second one**: with a third "Ten Christmases Left" added, the guard reports three pairs and fails on the two that are new.

**His decision, in one line, with the numbers already done:** ll257 is the superset (53 verses and 2 parables of its own against ll235's 4 and 2). Folding ll235's two parables and four verses into ll257 and retiring ll235 loses nothing and leaves one lesson. Say the word and it ships; say keep both and the record becomes a permanent entry instead of a dated one.

## Verification

- **21 cases green.** Six on the range expansion alone, including the one that reproduces the invisibility (a naive written-ref comparison sees 1 where the ground is 3), the en- and em-dash forms, the unparsed reference that is kept, and the backwards range.
- **Proven to catch**, two ways: a third duplicate added to the fixture turns `newDuplicatePairs` from empty to two and names the new lesson in both; and the false-positive floor is a loop over seven thresholds on the real catalog, every one returning exactly one pair.
- `verify:gates` 0 with the new guard in the chain (25 guards), read without a pipe. Lint 0.

## What this does not do

- **It decides nothing about the existing pair** and deletes nothing. **`re-review: 2026-10-28`** — Darrell's call, with the measurement above in hand.
- **It reads the ANCHOR, not the bodies.** Two lessons on the same teaching that declare different anchors would pass. Comparing bodies means reading lesson prose in a guard, which the standing rule forbids in logs and which would be a much blunter instrument; the anchor is the lesson's own declaration of its ground. **`re-review: 2026-11-04`** on whether a body-shingle measure earns its risk.
- **It runs under `npx vite-node`, not `node`**, unlike every other guard in the chain, because the live catalog imports JSON (`ERR_IMPORT_ATTRIBUTE_MISSING` under plain node). The script's own header says so.
- **Nothing is surfaced in the app.** The pair is visible in the gate output and in this record, not on a Governor screen. Per DR-0065 the app is where this belongs; wiring a new review surface is its own work. **`re-review: 2026-11-04`.**
