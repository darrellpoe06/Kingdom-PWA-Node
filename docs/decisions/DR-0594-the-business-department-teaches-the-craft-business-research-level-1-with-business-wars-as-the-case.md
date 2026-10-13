# DR-0594 — The Business department teaches the craft: Business Research, Level 1, with Business Wars as the case — the podcast is the doorway, the filing is the floor

- **Status:** accepted
- **Tier:** A (an additive Learn course on the existing Business shelf; no schema, no transport, no money)
- **Type:** feature
- **Date:** 2026-09-23
- **Scope:** `app/src/lib/business-research-course.js` (new — eight competencies, two bands each, 16 verified voices, a 46-entry timeline); `app/src/__tests__/business-research-course.test.js` (new — 48 pins); `app/src/lib/learn-catalog.js` (the second Business row); `app/src/lib/learn-crosslist.js` (cross-shelved under The Word & The Way, 27 measured anchors); `app/src/lib/learn-plain-words.js` (everyday words); `scripts/history-voices-witness.mjs` + `.github/workflows/history-voices-witness.yml` (the witness reads this course's voices and re-probes when the file changes); the three shrink-only baselines (band coverage 374, stage-reaches-reader 563, quotation integrity 563) and their pins (crosslist 49/712)
- **Principles:** WORD-FIRST (DR-0097), TEACH-THE-WORD-DONT-DEBATE-IT (DR-0098), SPEAK-ESTABLISHED-FACT (DR-0100), VERIFICATION-DOCTRINE (DR-0076), YAHWEH-IN-OUR-VOICE (DR-0210), THEIR-WORDS-FETCHED-NOT-REMEMBERED (DR-0580)
- **Grounds:** Darrell 2026-09-23: *"we need to use the podcast business wars as context for our business courses... Word first research 1 institution level"*.

## Context

The Business department had one course, `rent-to-own-business`: one business taught from the inside, seat by seat. It had nothing that taught a reader to find out what a business actually did — to count the cost of a claim before believing it, to open a filing, to require a second witness, to sort a reenactment from a document, to weigh a rivalry by its conduct and its numbers, to trace a correction, to keep what the Word settles apart from what the record must supply, and to write a sourced brief. Business Wars (Wondery, hosted by David Brown) retells the rivalries as drama and says so on its own page: the unauthorized, real story. That makes it the right doorway for a Level-1 research course and the wrong floor. The course teaches the walk from the one to the other.

The premise risk was named before building: a podcast-as-context course could become a summary of the podcast, which would be a retelling of a retelling and could not be verified. The design answer was to quote the podcast only from its own show page and to put every fact the course states on a record the runner could fetch: Netflix's 10-K, Blockbuster's 8-K exhibit, the Antitrust Division's findings and case page, the WTO's two dispute summaries, Disney's own release.

## What was measured

| what | measured |
| --- | --- |
| competencies (lessons) | 8, each with a big idea, an anchor passage, two stories, five benefits, a facilitator note, two quiz items |
| words across lesson + teen band + senior band | 9,022 |
| quoted Scripture spans, all `"..." (Book c:v)`, all KJV verbatim | 150 spans (148 in the modules, 2 in the Word-first frame), 0 faults; the scratchpad walk found ONE before commit — a bigIdea quoted Matthew 6:24 as "No man can serve God and mammon" where the verse reads "Ye cannot serve God and mammon" — and it was corrected before the file reached the repository |
| distinct Scripture anchors | 27 |
| reading bands | teen ≤ 6.0 FK and senior ≤ 10.0 on every lesson (measured max teen 4.9, senior 10.0); teen < senior; each band ≥ 0.6 of its lesson's words (min 0.63); 8-word shingle overlap ≤ 0.25 (max 0.16). Three senior bands first measured 10.8–11.0 and one teen band 0.58 and were rewritten by splitting sentences and adding plain words, then re-measured |
| verified outside voices | 16 (2 per lesson), 8 distinct URLs on `BUSINESS_SOURCE_HOSTS` (wondery.com, www.sec.gov, www.justice.gov, www.wto.org, thewaltdisneycompany.com), each ≥ 8 words, no elision, no verse tag |
| source verification | every voice URL and phrase probed on a GitHub runner before it was written in: `history-voices-witness` runs 35933697006, 35933806953, 35933917730, 35934034007, 35934089153, 35934134357, 35934157081; pages that answered 404 (a Coca-Cola history page, an old Netflix press link) were NOT used |
| timeline | 46 dated entries, ascending 1989 → 2018; every four-digit year in prose is on the timeline and every timeline year is in prose (zero faults both directions; five lessons first failed this gate and were repaired by adding the named year's record, never by dropping the year from the prose) |
| both-sides theatre | 0 hits for "some analysts say", "you decide", "contested"; the settled matters (false weights, fraud, wages withheld) are taught as settled — "Whether fraud is wrong is settled" — and never staged as open |
| credit | Business Wars named in 3 lessons, Wondery and David Brown in 2, and the catalog blurb; lesson 4 names the podcast as the doorway and thanks the people who built it |
| gates on the new file | 48 pins in `business-research-course.test.js`; the shared suites (crosslist 49/712, band coverage 374, stage-reaches-reader 563, quotation integrity 563, surface registry walk) 157 tests green in one run; eslint 0 warnings on the changed files |

## Impact

Without this course the department teaches one business from the inside and stops; a reader who meets a business story told as a war has no move but to believe it or dismiss it. With it the reader has eight repeatable moves and worked cases whose every date sits on a filing the reader can open. The cost is a second row on the Business shelf, three baselines moved by exactly the eight new lessons, one more file in the witness workflow's path list, and a second host list (`BUSINESS_SOURCE_HOSTS`) that relaxes ONLY the host check of the History voice gate; every other fault (elision, verse tag, short quote, missing where or why) still stands, and the test proves it.

## Decision

1. `business-research-wars` ships as the second Business course, after `rent-to-own-business`, and is cross-shelved under The Word & The Way (27 measured anchors).
2. Every competency is Word-first: the anchor passage is the warrant, quoted verbatim from the KJV with "the LORD" untouched inside quotes and "Yahweh" in our voice (DR-0210).
3. The podcast is the doorway, credited plainly; the record is the floor. The course quotes the podcast only from its own show page and states every company fact from a filing, a court's findings, a dispute summary or a company's own release, with its date and its address.
4. What the Word settles (false weights, fraud, wages withheld, two masters) is taught as settled and is not a research question; what the record must supply (a share, a date, a filing) is never claimed from a verse; where the record is silent on a motive the course says so (DR-0098, DR-0100).
5. The new file rides the existing history gates (voices, timeline, bands, quotation integrity, band coverage) through `businessResearchVoiceFaults` / `businessResearchTimelineFaults`, and its voices are probed on the runner whenever the file changes.

## Verification

- `npx vitest run src/__tests__/business-research-course.test.js` — 48/48; the proven-to-catch pins fail on the exact Matthew 6:24 misquote the scratchpad walk caught, a wrong verse tag, an unlisted host, an elided voice, a year missing from the timeline, an unnamed year, a disordered year and a both-sides phrase.
- The affected shared suites: 157 tests green in one run alongside the new file; the full suite is run before the push and its result recorded on the PR.
- Voices: the seven probe runs named above (every URL used answered 200 and every phrase was found); the file's own header cites them, and the test pins that citation.
- After merge: the course is read at Church → Learn → Business → second course on the live build; the witness workflow's push trigger re-probes the 16 voices on the merge commit; DR-0104 live review is the standing next step (site-health run, then a walk of lesson 1 and lesson 7 on a phone width).
- re-review: 2026-10-21 — measure whether any reader opened lesson 7 (the Word settles) from the Business shelf, whether the crosslist row draws readers from The Word & The Way, and whether a third Business course (the next competency level, or the next case) is asked for.
