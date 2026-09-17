# DR-0467 — He settled the count: fifteen love verbs, and DR-0459's open question closed

- **Status:** accepted
- **Tier:** B (a correction to shipped learner-facing teaching, made on the author's own instruction)
- **Date:** 2026-09-17
- **Type:** app
- **Scope:** `app/src/lib/living-lessons-class.js` (L167 — title, bigIdea, all four bands, the adult lesson, benefits, quiz, facilitator notes, and the META roll-call), `app/src/__tests__/living-lessons-l167-verses.test.js` (the count checks corrected, two new checks added)
- **Principles:** SPOKEN-TEACHINGS-ARE-BUILD-INPUT (2026-07-03), VERIFICATION-DOCTRINE (DR-0076), TEACH-NOT-DEBATE (DR-0098), SURFACE-PREMISE-CONFLICTS, RENDER-FOR-MEANING (DR-0331), DO-THE-WORK (DR-0111)
- **Grounds:** DR-0459 (the lesson this corrects, and the record that left the question open in writing), L157 (which already shipped fifteen)

## Why this exists

Darrell, 2026-09-17:

> "Lesson 166 should have, I think, 15 love verbs. Can you correct that? If it's 15 love verbs, make sure it's accurate. Thanks."

**He is naming L167.** L166 is "Life Is Disrespectful, So Think On These Things"; the lesson that carries a love-verb count is L167, "Be a G About It". That is said here rather than silently retitling a different lesson, because acting on the number he gave while quietly changing the lesson he named would be the wrong kind of helpfulness.

**And this answers a question DR-0459 wrote down as unproven.** Its own "What is still NOT proven" section reads: *"Whether Darrell counts item ten as one or means a different split entirely. He said 'the 14 love verbs' and the fourteen-count is the only reading of 1 Corinthians 13:4-7 that lands on fourteen, so that is the reading the lesson uses and says so. But it is an inference from a number, not something he spelled out. If he means a different fourteen, the note is the thing to correct."* He has now spelled it out. The record predicted exactly this correction and named the thing to change; this is that change.

## The decision

**a. FIFTEEN IS ACCURATE, AND IT WAS VERIFIED AGAINST THE CORPUS BEFORE A WORD WAS EDITED — because he asked for it to be checked, not just changed.** 1 Corinthians 13:4-7, fetched verbatim:

> "Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up, Doth not behave itself unseemly, seeketh not her own, is not easily provoked, thinketh no evil; Rejoiceth not in iniquity, but rejoiceth in the truth; Beareth all things, believeth all things, hopeth all things, endureth all things."

Enumerated: one suffereth long · two is kind · three envieth not · four vaunteth not itself · five is not puffed up · six doth not behave itself unseemly · seven seeketh not her own · eight is not easily provoked · nine thinketh no evil · **ten rejoiceth not in iniquity · eleven rejoiceth in the truth** · twelve beareth all things · thirteen believeth all things · fourteen hopeth all things · fifteen endureth all things. **Fifteen exactly.** Fifteen is not a different list; it is this list with the two halves of the rejoicing clause given a number each.

**b. THE CORRECTION ALSO RESOLVES A REAL DISCREPANCY INSIDE THE SERIES, in the direction he chose.** L157 ("What Is Love") already shipped FIFTEEN and says so eight times. L167 shipped FOURTEEN and said so forty-four times. Two lessons in one series, teaching the same passage, reaching different totals — held together only by the honest note DR-0459 built into both. His instruction collapses that: the series now teaches fifteen in both places, and the note remains for the reader who counts fourteen.

**c. The honest note STAYS, with its polarity flipped — it is not deleted now that there is a settled number.** Every band still says the text gives a run of clauses and never numbers them itself; that **fifteen** is the count with those two halves listed apart, which is how Darrell counts them and how L157 lays them out; that **fourteen** is the count with rejoicing taken as one item facing two ways; that the words are identical either way, nothing in the teaching turns on the total, and neither count is a mistake — so use whichever you can remember and execute all of them. Keeping the note is the whole difference between teaching a number and asserting one (DR-0098), and three of the gate's checks hold it per band.

**d. THE LESSON ID IS DELIBERATELY NOT CHANGED, and this is a decision rather than an oversight.** The id is `ll171`-style slug `...execute-the-fourteen-love-verbs...`, and it is the **stable key a reader's progress is recorded against**. Renaming it would orphan the progress of anyone who has already read the lesson, to fix a string no reader ever sees. The title, every band, the bigIdea, the quiz, the facilitator notes and the META roll-call all now say fifteen; the slug stays fourteen as a key, not as a claim. Stated here so a future reader does not read the mismatch as drift.

**e. The gate now checks the TAUGHT count, not merely that a number is present.** Two new checks:
- **The tally is checked where it does its job** — immediately after the last item of the list, within ninety characters of "endureth all things", it must say fifteen and must NOT say fourteen. A check for "fifteen appears somewhere" would have passed on the honest note alone, which is precisely what the old fourteen-teaching version did.
- **Items ten and eleven must actually be the two halves, numbered apart** — between the ordinals "Ten" and "Twelve", both "rejoiceth not in iniquity" and "rejoiceth in the truth" must appear and the second must carry its own number. A band renumbered to fifteen without splitting that clause would be counting to a number its own list cannot reach, and nothing in the old gate would have noticed.

The existing ordinal check (itself the fix for DR-0459's one missed break) now runs one through **fifteen** with strictly increasing positions, and the note check now requires **both** counts named rather than just the other one.

## Verification (DR-0076)

- **1 Corinthians 13:4-7 fetched verbatim from the corpus and enumerated against it before editing**, rather than counting from memory — which is the whole of what he asked when he said "make sure it's accurate".
- **Every replacement asserted its own occurrence count before writing, and the script refused twice rather than guess.** The first refusal caught a phrase the adult band capitalises where the other three do not ("Use the fourteen love verbs" against "use the…"); the second caught the senior band's wording being "checked rather than merely admired" where teen says "rather than admired". Both were real differences between registers, and a blind global replace would have silently missed one band each time. Nothing was written to the file on either refusal.
- **All five texts verified to carry ordinals one through fifteen with strictly increasing positions**, measured after the edit.
- **L167's quotations re-audited after the edit: 161 referenced spans, 161 verbatim strictly, 0 unreferenced, 0 ellipses.** The edits touched our own prose only; this is the measurement that proves it rather than the assumption.
- **No stale title anywhere in the repo** — searched across js, jsx, json and md: zero remaining "Fourteen Love Verbs".
- **L167 still full at every band after the edit** (0.69 / 0.94 / 1.07 / 1.22, no short band) with the ladder 1.24 / 7.08 / 7.90, and none of the three shrink-only baselines moved by a single entry or count.
- **31 checks in the corrected gate; 13 breaks applied for real and each required to fail the NAMED check. 7 caught on the first pass, and the six that did not split into four bad expectations of mine and TWO REAL BLIND SPOTS the harness exposed — both of them the recurring finding of this pass in yet another face.**
  - **The ordinal check could be satisfied by the TALLY instead of the numbering.** A break that turned `Fifteen, endureth all things` into `And endureth all things` left the gate perfectly green, because the tally sentence immediately after the list ("...all things. Fifteen.") still supplies a `Fifteen.` for the search to find. The check was locating the COUNT and reporting it as the NUMBER ON AN ITEM. Each ordinal is now PAIRED WITH ITS OWN ITEM — number N must be followed within seventy characters by item N's own words, with each register's real wording accepted including the child's — and the search walks every occurrence to find the one that carries the item. A tally, a heading, or another item's number can no longer satisfy it.
  - **The count checks searched the WHOLE BAND, so the numbered list satisfied them.** Breaking "it is fifteen" out of the note left the gate green, because `Fifteen, endureth all things` and the tally still carry the word elsewhere in the band. The note is now windowed on itself — located by its own heading and read as a 900-character passage — so both counts have to be named IN THE NOTE or it is not a note. This is the same defect DR-0466 found hours earlier from the opposite direction: there a window was pinned to the first occurrence, here there was no window at all.
  - The four bad expectations were mine and are recorded as mine: the harness matches TEST NAMES and I had given it assertion messages, so four checks that fired correctly were reported as failures to catch. Re-run against the real names: **13 of 13 caught, 0 missed, 0 no-ops.**

## What is still NOT proven

- **Whether he wants L157 touched at all.** It already teaches fifteen, so nothing there contradicts him and it was left alone; that is a judgement that the lesson already agreeing with him needs no edit, not a measurement of his intent.
- **Whether "Lesson 166" was a slip for 167 or a different mental index of the series.** The correction is applied to the lesson that actually carries a love-verb count, and the mismatch is named in this record and in the reply to him rather than resolved silently. If he meant something in L166, that is a separate correction and this one does not block it.

## Files

- `app/src/lib/living-lessons-class.js` — L167 corrected to fifteen; META roll-call moved with the title
- `app/src/__tests__/living-lessons-l167-verses.test.js` — count checks corrected, two added (31 checks)
- `docs/decisions/INDEX.md` — row + pointer
