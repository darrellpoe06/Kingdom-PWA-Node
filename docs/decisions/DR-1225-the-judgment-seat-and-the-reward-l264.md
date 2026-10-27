# DR-1225: The Judgment Seat and the Reward — Salvation Settled, Service Measured (ll264)

**Date:** 2026-10-27
**Status:** accepted
**Tier:** A (additive curriculum: one new Living Lessons module, dated, with its gate)
**Type:** curriculum
**Area:**
- `app/src/lib/living-lessons-class.js` (`ll264-the-judgment-seat-and-the-reward-salvation-settled-service-measured`, appended after ll258)
- `app/src/lib/living-lessons-dates.js` (ll264's line; the day it JOINED the course)
- `app/src/__tests__/living-lessons-ll264-the-judgment-seat-and-the-reward.test.js` (its gate, 173 cases)
- (no generated file changed: Living Lessons days are RECORDED_ELSEWHERE in `living-lessons-dates.js`, so `npm run lesson-dates` wrote 841 of 841 dated with no diff, and the course-band baseline re-ran at `allFour 255, adultOnly 0, still pinned 174` with no diff. Both were run, and both are reported as no-change rather than claimed as regenerated.)
- `docs/99-session-notes/2026-10-27-living-lesson-ll264-the-judgment-seat-and-the-reward.md` (the build log)

**Amends:** nothing. Grounds: DR-0076 (every verse fetched verbatim from the repository's own KJV; measure, don't claim; proven-to-catch; name the method's limits), DR-0098 (teach the Word, do not debate it — and stop where the Word stops), DR-0100 (speak established fact; flag the genuinely unverified narrowly), DR-0192 (the trust-but-verify pass runs BEFORE first ship on a research-sourced lesson), DR-0210 (Yahweh in our voice; Jesus confessed as the Lamb of Yahweh and the Eternal Son; quotations untouched), DR-0610 (one teaching, one lesson), DR-0733 and DR-0795 (the three directions in every band), DR-0734 (`anchor.ref` names every verse), DR-1206 (the witness belongs to the road), the standing rule that a teaching Darrell sends in is build input.

**The road, and its witness (DR-1206):** `agent_inbox` row `87ec8eb8-adf6-4edd-9b5a-62f09039ac9c`, `Research item: 4aaf4014-f348-4958-aff6-db75dfd1fd11`. Darrell sent a link **inside the PoeTech app**, down the app's own research road, on 2026-10-22; the row waited about 89 hours in the lesson queue before this build. No Gmail thread exists for it, and none is claimed.

## Context

Darrell sent a link into the app's research road with the standing one-word instruction. The road fetched the whole reading on our own machines from the NAS residential IP (the CI path is YouTube-IP-blocked) and returned **4,465 words** of auto-generated captions with **no timestamps and no speaker name**. So the material is real and substantial, and its attribution ceiling is low: a quotation from it can be ascribed to "one speaker" and to nothing more precise.

The subject is the judgment seat of Christ — the *bema* — taught as an **evaluation of a believer's service rather than of his salvation**, held distinct from the judgment of those who never belonged.

**The same row carried a SECOND, separate item, and it is deliberately not in the lesson.** Above the link Darrell asked for a product capability: connections between historical events and Scripture locations, plus parallel timelines — one timeline for the people who lived in the Word, another for when a scroll or other corroborating find appears. That is Project Management / app feature work, not teaching. It is recorded here so it is not lost, it is named in the lesson's own provenance paragraph as product work that is not being taught, and **nothing of it was built**. It needs its own item.

## SHOULD → ARE → GAPS → CLOSE (DR-0219)

**SHOULD.** One teaching, one lesson (DR-0610): a new lesson earns its place by a real increment over what the catalog already teaches, or it is not built.

**ARE (measured before writing a sentence).** The nearest neighbours were read in full, not grepped:

- **ll65** (*Processed for Righteousness — Works, Words, and the Verdict of the Son*) is the closest, and the overlap is real: it teaches the Son as Judge (John 5:22), works and words as the evidence He reads, the heart as the single root, and it cites 2 Corinthians 5:10 twice in passing.
- **ll61** carries Romans 14:12 in an accountability frame.
- **ll245–ll258** were read; none touches this subject.
- **DR-0171 / DR-0130** hold the TWO COURTS frame, which is about accountability for *wrongdoing* across an earthly and an eternal court, and `economics-class.js` teaches it there.

**GAPS, named as differences rather than as absence.** ll65's frame is the *salvation* verdict — condemned or redeemed — measured by works and words. Nothing in the catalog teaches the thing this reading is actually about, and the measurement is blunt:

| taught anywhere in `app/src/lib` before this lesson | count |
|---|---|
| `1 Corinthians 3:15` ("he himself shall be saved; yet so as by fire") | **0** |
| "suffer loss" in a lesson | 0 (only `insurance-risk-course.js`, a different sense) |
| `1 Corinthians 3:11` / `3:14` | 0 |
| the *bema* as a word, or the judgment seat traced through Acts 18 | 0 |
| rewards distinguished from salvation as a doctrine | 0 |
| `scripts/lesson-already-built.mjs` verdict | **WEAK — terms only** |

So the increment is exactly what it was scoped to be: **a reward distinguished from salvation**, pinned on the one verse that states both halves. And ll65 is the reason the increment *matters* rather than a reason to skip it — ll65 taught well could be misheard as works deciding the verdict, and this lesson draws the line the Word draws.

**CLOSE.** Built, with the doctrinal edge guarded by machinery in both directions.

## What was measured

Every verse was fetched from `app/public/bible/kjv` before a sentence was written (a scratchpad resolver printed each one; the lesson quotes from that output, never from memory). The draft was run through the repository's own gate scripts in the scratchpad **before it touched the catalog**:

| check | measured |
|---|---|
| referenced spans / verbatim faults | 342 / 0 |
| straight apostrophes inside a quotation | 0 |
| double-quoted spans not standing beside a reference | 0 |
| fullness child / youth / teen / senior (floors 0.50 / 0.60 / 0.60 / 0.60) | 0.59 / 0.69 / 0.64 / 0.74 |
| authored-prose grade child / youth / teen / senior (child ceiling 5.0) | 2.3 / 4.6 / 6.1 / 8.3 |
| worst band overlap (ceiling 0.5) | 0.05 |
| bands not naming the lesson in their opening | none |
| places missing a direction | none |
| elisions / recited record ids / generic "God" in our own voice | 0 / 0 / 0 |
| adversary names capitalized | 0 |

**What the checks caught while writing.** Three real faults, each before the splice or before the push:
1. A typo **inside a quotation** — Matthew 25:30 written as "gnashing of theeth". A quotation of the Word, misspelled, in the movement about not going past the text.
2. The **period-after-quote convention** broke eleven pinned spans: the house style puts the reference outside the quote, so a verse's terminal period is not part of the quoted span. The pins carried the period and read red until they matched what the lesson actually quotes.
3. Two bands were **short of their fullness floor** (child 0.40, youth 0.46). They were written out rather than padded — the child band gained the two-scenes point and both parables retold at its register, the youth band gained the great-white-throne distinction and the where-we-stop movement.

**Numbers claimed.** `LIVING_LESSONS_MODULES` read at 255 modules with highest ll258 before, 256 with ll264 after. `grep -rc "ll264\b" app/src/lib/` returned 0 on a fresh `origin/main` before writing; ll254–ll258 were confirmed present, so the "highest is ll258" premise was verified rather than taken on report.

## Verify, do not relay (DR-0076 / DR-0192 / DR-0100)

The source is one unnamed speaker's claims. Tiered and handled, each one named:

**Tier 1 — established, and the Word carries it; stated plainly.** That `2 Corinthians 5:10` and `Romans 14:10-12` are addressed to believers; that `1 Corinthians 3:11-15` distinguishes a burned work from a saved man; that `Revelation 20:11-15` is a different scene turning on the book of life; that Paul was arraigned before Gallio's judgment seat in Corinth (`Acts 18:12-16`); that the KJV renders the same word "the judgment seat" for Pilate's (`Matthew 27:19`, `John 19:13`), Caesar's (`Acts 25:10`) and Corinth's. All of it is in the corpus on disk and all of it is quoted from there.

**Tier 2 — genuinely unverified; flagged narrowly and NOT asserted.** The reading's claim that the Corinth platform was also where the city crowned Isthmian victors and commended its war veterans. It is plausible and it is not verified here, so **the lesson says in four of its five places that it did not verify it and does not assert it** — and the historical picture is built instead from the corpus itself, which is stronger: the same Greek word, the same English rendering, the platform Paul's own readers had walked past. The Greek word *bema* is taught as a word study and named as one; there is **no Strong's or lexical corpus in this repository**, so that lexical identification is standing knowledge rather than an on-disk measurement, and it is never substituted into a quotation.

**Tier 3 — dropped, because the claim under it is not established.** The reading offered the tomb autobiography of Ahmose son of Ibana as an ancient parallel for honours from a king's own hand, and tied those honours to "overcoming the Israelites in the northern Delta region in the land of Goshen," citing the speaker's own book. That identification is a contested minority reconstruction, not an established fact, and relaying it on a teaching surface would have laundered it. **None of it is in the lesson** — not the parallel, not the name, not the window of appearance — and the gate asserts its absence. The point it was offered to support is carried by the Word instead.

**Where the reading went further than the Word, the lesson stops (DR-0098).** Two places, both corrections of the source rather than of the reader:
- The reading used the **parable of the talents** as a picture of the seat. The commendation in it belongs here (`Matthew 25:21`), and the reckoning that opens it (`Matthew 25:19`); but that parable ends with the unprofitable servant cast into outer darkness (`Matthew 25:30`), which is not a believer losing a reward. The lesson takes the commendation, quotes the ending it will not use, and says why it stops there.
- The reading asserted that **castaway** (`1 Corinthians 9:27`) means disqualified from the prize and not from the kingdom. The surrounding verses are race and prize and crown, which is why the loss is commonly read that way; the Word does not define the term further in that place. The lesson teaches what is written — a man of full assurance still trained like one with something to lose — and builds no doctrine on the silence. It likewise refuses to supply a **timetable** relating the two scenes, because Scripture does not give one.

**The speaker.** Named only as the source names him, which is not at all. No faith label, denomination, affiliation or motive is attached to him, and the gate asserts that no title was invented for him — the correction that had to be made on World Issues 21.

## The decision

The lesson ships as a Living Lesson at the sov9/sov10 standard: ten numbered movements, two parables, all four age bands authored for their reader, a quiz, a facilitator guide, and the three directions in every place a reader reads.

**The doctrinal edge is held by machinery, not by good intentions.** This subject fails in two directions and both failures are serious, so the gate requires, **in every one of the five places separately**:

- **both halves of 1 Corinthians 3:15** — "he shall suffer loss" AND "but he himself shall be saved; yet so as by fire". A place that keeps the loss and drops the saving, or the reverse, goes red;
- the gift and the foundation already laid (`Ephesians 2:8`, `2:9`, `1 Corinthians 3:11`), so works-righteousness cannot creep in;
- the no-condemnation (`Romans 8:1`), so the reader is secured before he is sobered;
- a real reward really earned and really lost (`1 Corinthians 3:14`), plus the distinction stated in that band's own words, so works cannot be made decorative;
- Jesus confessed as **the Lamb of Yahweh** with `John 1:29` beside it, and the Eternal Son with `Hebrews 1:8`;
- both scenes, kept two, with the book of life named as the other question and the limit on the timetable stated.

Placement is **Living Lessons** because this is Word-first teaching for a general reader in four bands, and because its nearest neighbour (ll65) lives there — a reader who meets one should be able to reach the other. It is not World Issues (no current-events claim), not Economics (the two-courts accountability frame already lives there, DR-0130), and not the Godhead Study (it teaches a believer's service, not the nature of the Godhead).

The two parables teach rather than decorate:
- **The Two Lines at the Gate** (light): two lines at one fair gate, one asking whether a person has any right to be inside and one asking only what he brought, and a boy with the stamp and empty hands.
- **What the Fire Left** (solemn): two men on a slab somebody else poured, one house swept to the concrete and one scorched but standing, and both men alive on an uncracked slab. That is `1 Corinthians 3:15` as a story, both halves in it.

## Impact

A reader meets this subject sobered and secured at once, which is the thing most people have never been handed. A child learns that his place is already safe and that a cup of water counts. A youth learns to keep the two scenes apart so the fear stops leaking from one into the other. A teen learns that dropping either half of one verse produces false terror or false ease, and can say which is which. A senior — who has usually been taught one half of this well and the other hardly at all — is pointed at allocation rather than anxiety, with the particular rewards Scripture promises the long-serving. Every band sends the reader to their parents, their children and a friend with the same question: what are you building that fire would not take?

### Limits, named rather than left

- **The bema's civic-honours use is unverified and stays that way.** It is flagged in the lesson, not asserted, and the gate pins that it is flagged. Verifying it needs a primary archaeological source this session had no route to. `re-review: 2026-11-10` — either verify it from a primary source and teach it, or leave the flag standing permanently.
- **No lexical corpus on disk.** *bema* as the Greek behind "the judgment seat" cannot be verified from a repository resource, only the English rendering can. The lesson therefore leans on the KJV's own consistent rendering and names the word study as a word study. A Strong's or lexicon corpus would close this class of claim for every future lesson; it is not in scope here. `re-review: 2026-11-24`.
- **The transcript has no timestamps**, so nothing in the lesson is cited to a minute mark, and the per-minute ranges in the row's summary are not reproduced as citations.
- **The overlap with ll65 is real and was judged, not dissolved.** The increment is the reward/salvation boundary and the bema as a platform; the heart-and-evidence teaching stays ll65's. Neither record cross-links the other in the lesson text. `re-review: 2026-11-10` — read both on the live app in sequence and decide whether one should point at the other.
- **The lesson id is ll264, assigned centrally, and it is NOT the lowest unclaimed number.** `app/src/__tests__/living-lessons-numbers-are-unique.test.js` requires contiguity — `KNOWN_GAPS` is `[211, 212]` and nothing else — so while ll261–ll263 are held by unlanded sibling branches this record's lesson sits above unclaimed numbers and the gate's `unclaimedNumbers` check will say so. **That is expected and it is not this branch's to fix:** ids are registered and retired centrally, by one writer, and this lesson holds ll264 exclusively. It clears as the siblings land.
  **The finding that earned its place, because it cost four renumbers before the rule changed.** This build first followed a lowest-free-id protocol and moved ll264 → ll260 → ll259 → ll260 → ll262, each step forced by a real measurement: the gate answering `expected [ 259 ] to deeply equal []`, then a pre-push re-check finding PR #2414 holding ll259, then PR #2415 claiming ll260 and PR #2412 ll261. Every move was a scripted renumber across the module id, the dates key, the gate's filename and its `ID` constant and numeric assertions, this record, the INDEX row's link, the session note and the branch — one operation repeated, not four chances to miss a reference. **The lesson learned is structural: with many builders claiming ids in parallel against a gate that demands contiguity, “the lowest free number” is not a stable value — it is read, then invalidated by a sibling push seconds later.** Contiguity and concurrent self-assignment cannot both hold. Central assignment, which is what now governs, is the resolution; it is recorded here so the next session does not rediscover it by burning renumbers.
- **The record number is DR-1225, assigned centrally and CONFIRMED by the claim script rather than chosen by it.** `scripts/claim-decision-number.mjs` was run as a check, which is what it is for here: it reported *next free decision number: DR-1225*, highest on disk DR-1224, and *DR-1225 is free on disk AND in flight* — so the assignment and the measurement agree, and the one sibling number at or above it (DR-1227, `origin/claude/ll261-sons-of-god-taught-from-the-word`) does not collide. The record was first written as DR-1224 and moved with `scripts/renumber-decision-record.mjs 1224 1225 --file ...` on a clean tree, committed as its own change; `resolve-ledger-conflicts.mjs` then set the pointer to DR-1226 and `business-systems-guard` read *ledger whole (newest DR-1225, pointer correct)*. `grep -rn "DR-1224"` across this build's files returns zero.

## Proven to catch

`living-lessons-ll264-the-judgment-seat-and-the-reward.test.js` — **173 cases, all passing.** It checks the module exists once at its number with all four bands and the day it joined the course; that the provenance names the road, the app, the machines and the fact that no speaker name came back; that the second request is named as product work and never taught; that **71 pinned spans** are the corpus verbatim and **342 referenced spans** are verbatim in the verse each cites; that `anchor.ref` names every verse any span quotes; that the doctrinal edge holds in all five places; that the two scenes stay two; that the unverified claim is flagged and the Egyptian material absent; that the parable and the castaway stop where the Word stops; that the bands clear their floors, rise on the reading ladder and do not duplicate; and that every place carries TALK ABOUT IT TOGETHER with the skill, the rhythm, and growth measured the Word's way.

**It was proven to catch on the LIVE catalog file, not only on in-test fixtures** — three mutations applied to `living-lessons-class.js` itself, each run, each restored:

| mutation applied to the real module | gate's answer |
|---|---|
| the saving half of `1 Corinthians 3:15` removed from the **teen** band alone | `teen drops the saving` (plus 4 consequential failures) |
| one letter altered inside a quotation of `Acts 18:12` ("judgement" for "judgment") | `not His words as written` |
| "Yahweh" substituted into the quotation of `Ephesians 2:8` | `not His words as written`; `senior drops Ephesians 2:8` |

Two further in-file mutations are asserted in the gate itself: a child band trimmed to 600 characters is named short, and stripping one band's friend line names that band while the pooled check still reads green (DR-0795's hazard).

`re-review: 2026-11-03` — read L264 on the live app in each band, and record the first reader who can state, unprompted, the difference between losing a reward and losing salvation.
