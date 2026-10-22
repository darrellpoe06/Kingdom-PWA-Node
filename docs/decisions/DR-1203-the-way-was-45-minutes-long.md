# DR-1203: The way was 45 minutes long — the first lesson through the research road, and the roads Yahweh measured

**Date:** 2026-10-22
**Status:** accepted
**Tier:** A (one issue added to an existing course, all four age bands from its first commit; one baseline regenerated in its permitted direction; no code changed)
**Type:** curriculum
**Area:**
- `app/src/lib/world-issues-class.js` (`CAMPUS_ROADS_ISSUE` — the twenty-first World Issues entry)
- `app/src/lib/course-band-coverage-baseline.json` and `app/src/__tests__/course-band-coverage.test.js` (the debt pin moves 254 → 255)
- `app/src/lib/lesson-dates.json` (one derived row)

**Grounds:** Darrell sent an Instagram reel into the app's research road on 2026-10-22 at 01:23 UTC with one word on it: "Lesson" (`agent_inbox` row `d5480d79-4005-418d-b882-69f3187cc32c`, research item `ed11c486-9568-49ad-94ca-5fcd6872e577`). **This is the first lesson through the lane DR-1202 opened the same day**, and DR-1202 records Darrell's own terms for it: *"just create a lesson after research and Word first processing… I want this to be the new normal after we see how it does with this lesson."*
**Principles:** DR-0312 (a forwarded item is built Word-first, or a comparison is reported); DR-0610 / DR-1185 (one teaching, one lesson — checked before writing); DR-0076 §4 (measure, never claim) and §8 (name the method's limits; unknown is never zero); DR-0100 (three tiers — state established fact plainly, flag only what is genuinely open); DR-0098 (teach the Word, do not debate it); DR-0331 (a machine transcript rendered for meaning)

## Context

The reel argues that colleges are losing on-campus polling sites and that the pattern targets students who are not white and not conservative. It is sponsored content with a referral link. It names real institutions and real figures.

Two things had to be settled before a word was written. **First**, whether this house already teaches it. **Second**, whether its specifics are true — because a lesson that relays unverified claims about named institutions is not a lesson, it is a repost.

## What was measured

**The duplicate check, and it nearly stopped the build.** The obvious lesson — how to receive a one-sided advocacy video about voting access, taught from impartial-justice Scripture — is the **intersection of two issues this course already holds**:

| already held | by |
|---|---|
| how to receive a creator's advocacy video; claims vs interpretation; Proverbs 18:17, Exodus 23:2, Leviticus 19:15, Isaiah 10:1, Proverbs 31:8, Micah 6:8 | `wi-musk-creator-critique` |
| the vote and a just measure; Deuteronomy 1:17, Proverbs 11:1, Proverbs 20:10, Deuteronomy 16:18-20, Deuteronomy 25:13, Proverbs 18:13, Proverbs 17:15 | `wi-scotus-mail-in-voting-2026` |

Counted inside `world-issues-class.js` before writing: `vote`-words **119**, `election` **87**, Proverbs 18:17 **59**, Proverbs 11:1 **60**, Isaiah 10:1 **42**. Ten of the candidate verses were already held, in the same course — which is exactly **DR-1185's** own duplicate threshold. Written the obvious way this would have tripped the rule shipped two days earlier.

**So the free ground was counted rather than guessed at.** Across **all 44 course files**: `Deuteronomy 19:2` **0**, `Deuteronomy 19:3` **0**, `Deuteronomy 19:6` **0**, `Numbers 35:11` **0**, `Numbers 35:12` **0**, `Joshua 20:4` **0**, `Isaiah 57:14` **0**, `Isaiah 62:10` **0**, `cities of refuge` **0**, `the way is long` **0**, `prepare thee a way` **0**.

That seam is not merely free; it is the exact subject. **Yahweh established the cities of refuge and then legislated the DISTANCE to them** — "Thou shalt prepare thee a way, and divide the coasts of thy land… into three parts, that every slayer may flee thither" (Deuteronomy 19:3) — and gave the reason out loud: "because the way is long" (Deuteronomy 19:6). The right already existed; the man "was not worthy of death." Yahweh says the distance would defeat it anyway, and treats the length of the road as part of the injustice. **A remedy out of reach is, by His own reckoning, a remedy denied.** Isaiah addresses the duty to whoever has charge of the road — "take up the stumblingblock out of the way of my people" (Isaiah 57:14) — not to the people walking it.

**Then the claims were checked, one at a time, and they did not come back the same.** This is the finding that shaped the lesson:

| claim | result |
|---|---|
| N.C. A&T ~45-minute march; A&T and UNCG lost sites they had in 2024 | **documented.** Independent reporting gives about 45 minutes to Union Square; Guilford County denied both, State Board upheld (reported 3-2 on party lines) |
| colleges losing sites | **documented for North Carolina, and WIDER than the reel said** — Western Carolina, Elon, and a 3-2 vote removing N.C. State's Talley Student Center |
| Liberty keeps its precinct + a notice telling students where | **documented from Liberty's own registration pages** (Montview Alumni Ballroom) |
| UT Arlington site removed, students bused | **not supported.** The clearest record is 2024, and the attempt **failed** — 4-1 to approve 51 sites, UTA kept |
| Tarrant County lost 3 of 5 campus sites | **not supported** by that outcome |
| Tennessee Wesleyan, zip struck from 7 sites | **not found at all** in one pass |
| *omitted by the reel* | Guilford's elections director: A&T has **never** had an early site in a **midterm** since 2000; 2024 was a presidential year |

## Impact

- The twenty-first World Issues entry teaches **the distance to a right** from Scripture, on ground no course in the house held, and **names** the two issues that hold the rest rather than teaching any of it a third time.
- **The documented part is stated plainly and not hedged** (DR-0100): the removals and the 45-minute walk are reported facts, and the page says so without softening them into "some say."
- **The two failed claims are named as plainly as the ones that held**, because a page that only corrects sources it disagrees with is not checking anything. The omitted midterm fact is restored, which changes the accurate sentence from "a site they always had was taken away" to "a site they had in 2024 was not granted for 2026."
- **Motive is left undecided, on purpose.** The reel's conclusion is a claim about intent, and intent is the one thing no check could reach — "man looketh on the outward appearance, but the LORD looketh on the heart" (1 Samuel 16:7) is a statement about jurisdiction. The lesson stops where its evidence stops, which is not the same as saying the distance does not matter, because Deuteronomy 19:6 already said it does.
- **The standard is kept impartial by the text itself**: Deuteronomy 19:3 says *every* slayer may flee thither, so the Word's version falls on any hand that lengthens the way to something owed. A reader who has not chosen a party can use it; everyone is uncomfortable.
- The band debt moves only in its permitted direction: total 428 → 429, `allFour` 254 → 255, `adultOnly` 0, and the world-issues row reads `{lessons: 21, allFour: 2}`.

## Decision

**It ships as a World Issues entry on the cities-of-refuge spine, with every claim labelled, every check recorded including the negative ones, and motive left to Yahweh.**

- **The audit is the course's own gate and it passes for all 21 issues.** `auditWorldIssues()` runs five linters — claims labelled and attributed, sources cited with titles and as-of dates, at least two steelmanned perspectives, no persuasive directive in the lesson's own voice, and a screened child rendering. 9 claims labelled, 6 verifiable items with status and sources, 5 interpretations with what each rests on, 5 steelmanned perspectives including the board's and Liberty's.
- **Because three items are `documented`, the audit required accountability and both courts**, and both are carried: the duty to shorten the road put on whoever holds the allocation (Isaiah 57:14; Proverbs 3:27), the duty not to carry a failed report put on us (Exodus 23:1), and a benefit naming that judgment lands in this life partially and in the eternal court wholly (Ecclesiastes 12:14; Hebrews 9:27).
- **The sponsorship is named as advertising and used for nothing**, and the house takes no position on the product.
- **The provenance says what actually happened**, including that the research row's own reading step never completed ("the tower had not answered"), so the transcript is the whole of the research.

## Verification

- **171 cases green** across `discernment-track`, `world-issues-class`, `world-issues-verse-integrity` (108 of them) and `discernment-stages-render`; **101 more** across band-differentiation, bands-reach-the-reader, four-band-ladder, talk-together, the-plain-meaning-comes-first and course-quotation-integrity; **23** on band-coverage.
- **61 quoted spans verified verbatim** against `app/public/bible/kjv`, walking **every** string in the entry rather than only the prose a reader scrolls. Zero bright-line violations — "the LORD" appears only inside quotations — and `Yahweh` appears 27 times in our own voice.
- **Seven span failures were caught and fixed before the first commit, all mine**: I had capitalised "Man looketh…" where the corpus reads "for man looketh" (3 places), lowercased "To do justice…" where the corpus capitalises it (2 places), and spliced Deuteronomy 19:3 with an ellipsis so it was no longer a contiguous quotation (1 place, in the youth band). An altered capital inside quotation marks is an un-verbatim Scripture quote.
- **The course audit caught a real contract violation on the first splice**: my `sources` were plain strings where the gate requires objects with a `title` and an `asOf`, and it failed 28 times until every source carried both. A fact stated without a dated source does not ship.
- **`one-teaching-one-lesson-guard`: 44 courses, 676 lessons, 0 pairs found** — the machine agreeing with the manual duplicate analysis above.
- All 25 guards green; lint clean; `derive-lesson-dates` 840 of 840 dated, 0 undated, and the new row took its real commit (`f7e0fab4`) with no `working-tree` placeholder — **DR-1194's fix, merged hours earlier, working on its first new lesson.**
- The clarity corpus was regenerated and is byte-identical, so no fixture moved.

## What this does not do

- **It does not re-teach `wi-musk-creator-critique` or `wi-scotus-mail-in-voting-2026`.** Their ground is theirs and the lesson points a reader at them by name.
- **It does not rule on intent, or on anyone's standing before Yahweh.** See the Impact.
- **It does not settle Texas or Tennessee.** One pass of ordinary searching stands behind those, and "not supported by what could be found" is recorded rather than "false." **`re-review: 2026-11-05`** — if a local source settles either, the entry's status and note should move to match it, and the course's shrink-only discipline permits a status to improve.
- **It does not check the redistricting claim at all.** Texas, Florida, Missouri and Tennessee redistricting is a large, separately litigated subject that one pass cannot establish; it is carried as a labelled claim so it is not quietly dropped, and is marked unchecked. **`re-review: 2026-11-12`.**
- **It does not label the row captured.** The `agent_inbox` tagging (`lesson-captured`, `lesson-id:`, `lesson-pr:`) happens only after the push succeeds, and `lesson-published` only after a deploy run succeeds on a main SHA containing it (P62).
