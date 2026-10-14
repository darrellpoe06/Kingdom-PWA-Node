# DR-1018: Shyness can be pride — a spoken teaching sat half-built for two months, and an early-run re-review is what found it

**Date:** 2026-10-14
**Status:** accepted
**Tier:** A (a Living Lesson from Darrell's own spoken teaching, shipped through the normal lane per "Spoken Teachings Are Build Input — Always Add It"; it names no third party and no congregation, so it carries no `hold`)
**Type:** curriculum
**Area:**
- `app/src/lib/living-lessons-class.js` (`ll242-shyness-can-be-pride-the-omitted-term-and-the-hidden-talent`, appended after ll241; the catalog goes 238 → 239)
- `app/src/lib/living-lessons-dates.js` (ll242 at 2026-10-14 — commit day and slot day are the same here, unlike DR-1016's)
- `app/src/__tests__/living-lessons-l242-verses.test.js` (new; 57 tests, the lesson's own gate, with the four recovered strands pinned BY VERSE)
- `app/src/__tests__/living-lessons-order.test.jsx` (the newest-lesson day advances 2026-10-13 → 2026-10-14, which the file's own comment says to keep current)
- `app/src/lib/lesson-dates.json` (regenerated: 806 of 806 dated, 0 undated)

**Amends:** DR-1016 (its "not done, and said" is now done; the guess recorded there is corrected in the ledger and discharged here — NOTE that a concurrent branch also claims 1015, 1016 and 1017, so DR-1016’s own number collides and the held PR #2166 will have to be renumbered once that branch merges; this record took 1018 to clear all three before it was ever pushed)
**Grounds:** "Spoken Teachings Are Build Input — Always Add It" (he speaks it here BECAUSE it gets built), DR-0236 (nothing waits that is buildable now), DR-0076 (every verse fetched, never remembered), DR-0381 (the hollow-claim class), DR-0621 (hold the hand of the process)
**Declared by:** Darrell, spoken into the house 2026-08-14 — "shyness can be pride, and mostly is"

## Concern

On 2026-08-14 Darrell spoke a teaching into the house in one sitting, and PR #1255 records his own framing of it in four words: *shyness can be pride, and mostly is.* Part of that sitting was built at the time — the fear of man as a snare, which is `ll78` — and the rest was not. It then sat unbuilt for two months inside a PR that could never merge, because that branch's catalog held 81 modules against main's 238.

**This is the covenant Layer 0 records, so the failure is the covenant's:** he speaks a teaching into this channel BECAUSE it gets built, and a word that goes uncaptured breaks that. Two months is not a rounding error.

## Evidence

**How the gap was actually found, which is the method worth keeping.** While writing DR-1016 an hour earlier I wrote down a guess — that #1255's spoken teaching was "already in the series at `ll78`" — and labelled it with the honest hedge, "appears to be." Then, rather than park it behind its own `re-review: 2026-10-17`, I ran the check immediately. The guess was **wrong**. #1255's title is "L77-L79 captured teachings": L77 is main's `ll77`, L79 was mined out the same day as DR-1016, and `ll78` carries the fear of man, Moses, Proverbs 29:25 and 2 Timothy 1:7 — but not the thesis.

Checked against all 239 modules, four strands of that sitting were absent from the **whole series**:

| strand | the text | before 2026-10-14 |
| --- | --- | --- |
| the anger kindled at what presented as modesty | Exodus 4:11-14 | 4:11 sat in ll164 on another subject; **4:14 nowhere** |
| the Saul arc, and Yahweh's timings | 1 Samuel 10:22; 13:11-13; 15:23 | **absent entirely** |
| the Son refuses the instrument | John 8:54 | **absent entirely** |
| knowledge shewn, not announced | James 3:13 | **absent entirely** |

A guess checked early is cheap; a guess parked behind a date is not. The dated re-review would have found this on 2026-10-17 at the earliest, three days later, and only if it was honoured.

**What the corpus handed over once the verses were fetched rather than remembered.** The lesson's spine is lexical, and it was not visible until all 35 verses were read side by side: **four men are called and all four answer with a measurement of themselves** — Moses "slow of speech, and of a slow tongue" (Exodus 4:10), Jeremiah "I cannot speak: for I am a child" (Jeremiah 1:6), Gideon "I am the least in my father's house" (Judges 6:15), Saul "the smallest of the tribes of Israel" (1 Samuel 9:21). One grammar, four times. Every statement is TRUE, every one is tendered as a reason, and every one omits the same term — which Yahweh supplies as a question rather than as encouragement, conceding the limitation entirely while refusing the inference: "Who hath made man's mouth? or who maketh the dumb, or deaf, or the seeing, or the blind? have not I the LORD?" (Exodus 4:11).

**The crux is a sequence, and it must be read in order.** 4:12 removes the obstacle by promise. 4:13 repeats the deflection anyway. 4:14 records "the anger of the LORD was kindled against Moses" — anger at speech modest in both form and tone. Responsibility for the tongue had been assumed one verse earlier, so the tongue cannot be the target; what is left is a refusal that outlived its own stated ground. That is the definition this lesson uses for pride in the opposite costume.

**Saul supplies the longitudinal case, and the Gilgal passage does the most work of anything here.** Every clause of "Because I saw that the people were scattered from me, and that thou camest not within the days appointed, and that the Philistines gathered themselves together at Michmash" (1 Samuel 13:11) verifies against the account, and he names his own interior pressure as the cause — "I forced myself therefore, and offered a burnt offering" (13:12). So **accuracy is not the standard**: the single omitted term is Yahweh's timing, which makes the structure identical to Moses's. One inventoried an instrument without its Maker; the other inventoried a crisis without its Governor. The cost is stated in the past conditional so it can be felt — "for now would the LORD have established thy kingdom upon Israel for ever" (13:13).

**The pastoral guard is Scripture's own line, and it is the sharpest point rather than the softening.** The servant's account of himself is "And I was afraid, and went and hid thy talent in the earth" (Matthew 25:25), and the fear is never contradicted. The verdict returned names something else: "Thou wicked and slothful servant" (Matthew 25:26). Not *thou fearful servant*. Wickedness and sloth are acts; the fear is left standing as the reason and is not the charge. Withheld obedience is rebuked; temperament never is.

**Measured.**

| band | prose words | share | floor | FK |
| --- | --- | --- | --- | --- |
| adult | 1,969 | — | — | 5.7 |
| child | 1,554 | 0.79 | 0.50 | 2.4 |
| youth | 1,762 | 0.89 | 0.60 | 5.9 |
| teen | 1,705 | 0.87 | 0.60 | 8.8 |
| senior | 1,704 | 0.87 | 0.60 | 11.8 |

Not inverted · child far under the 5.0 ceiling a NEW lesson is held to · `unnamedBands` empty · differentiation 0.09 against a 0.5 ceiling · `placesMissingDirections` empty · eleven movements rendered in the same order in all five places · share round-trip keeps every word · **169 referenced spans walked against the local KJV, zero that are not His words, zero elisions, zero record ids printed at a reader.**

**Five defects caught by the checks and not by reading, four of them mine.**
- **Two straight apostrophes inside quotations** — "man's mouth" and "father's house" — where the corpus carries the curly form (U+2019). A quotation differing from the corpus by one character is not the verse, and reading it aloud would never reveal it. A corpus-checked repair was written rather than hand-patching each band: it converts a straight apostrophe only when doing so makes the span match the corpus, and never touches our own prose.
- **A capital on "Let him shew"** where James 3:13 reads "...among you? let him shew". Case altered inside a quotation is precisely the class #1255's own report says its gate caught fourteen times in that sitting — so the defect recurred while building the remainder of the same teaching.
- **A phrase in quotation marks that the verse does not contain at all:** "thou fearful servant", written for contrast against Matthew 25:26. It looked like Scripture and was not, so the marks came off.
- **The teen band read EASIER than the youth band** (4.03 against 5.89) on its first pass. In this series youth sits below teen, so that was a defect in the writing rather than a number to wave at; the band was rewritten denser and the senior band raised with it rather than the ladder being loosened.
- **One genuine hollow claim (DR-0381):** the child band never said that Yahweh *concedes* the limitation and refuses only the conclusion — a load-bearing idea it was leaning on the quotation to carry. Prose was written into it. Five of the claim checks failed on first run; four of those five were my own patterns being narrower than the prose that already taught the claim, and widening a pattern to the child band's own words ("He agreed that the talking was slow") is the honest fix rather than rewriting good child prose to match a regex.

## Impact

- Unresolved: a teaching Darrell spoke stays half-built, its four scriptural strands absent from a 239-lesson series, inside a PR that cannot merge — and the covenant that makes him willing to speak into this channel at all is quietly broken.
- The call obligates: every verse fetched from the corpus rather than remembered; the pastoral line drawn where Scripture draws it rather than where it would be kinder; the four recovered strands pinned BY VERSE in the lesson's own gate so the same absence cannot recur silently; and the lesson shipped the same session the gap was found, not on the re-review date.

## Decision

1. **The remainder is built now, not on 2026-10-17.** Eleven movements marked ONE.–ELEVEN. in every band, same order in all five places, two parables, full furniture. Nothing in DR-1016's re-review needed to wait, so nothing waited.
2. **The four recovered strands are pinned by verse, in every band.** Exodus 4:14, 1 Samuel 10:22, 1 Samuel 13:11, 1 Samuel 13:13, John 8:54 and James 3:13 are asserted present in all five texts, each check first verifying that its pinned fragment is genuinely in that verse. Removing any one of them fails the build instead of going quiet for another two months — which is the actual lesson of the two months.
3. **The claim is bounded in the first two minutes of every band.** It is a claim about a SENTENCE, never a verdict on a temperament, and each band says so before pressing it.
4. **The guard is Scripture's own and is taught as the sharpest point.** Matthew 25:25 beside 25:26; withheld obedience rebuked and temperament never; Moses told to GO rather than to become eloquent; Gideon's night recorded without mockery. Trauma-shaped fear and clinical anxiety are routed to wise care **by name** in every band, before the two closing questions rather than after.
5. **Both counterfeits are named in one breath** — John 8:54 on mechanism, Proverbs 27:2 on who holds the office, 2 Corinthians 10:18 on the disqualification — because a lesson that only names hiding sends the room into the other ditch.
6. **It rides the normal lane with no `hold`.** It is Darrell's own spoken teaching, names no third party and no congregation, and Layer 0 directs that a spoken teaching ships through the normal lane the same session. DR-1016 carries `hold` because it is COLG-facing and dissents from a named living teacher; this does not, and treating the two alike would make the brake meaningless.

Not done, and said: **#1255 is now dischargeable but is not closed by this record**, because closing it is an outward action on a PR someone else opened and the remaining question is whether anything else in those 24 commits is unbuilt — this record verified four strands, not the whole branch. **211 and 212 need no look at all**, and the earlier re-review item asking for one is withdrawn: `living-lessons-id-collision.test.js` already records them as PERMANENT gaps, both lessons having been built the same day into the Sovereign A.I. course (DR-0760, DR-0761) where ids are `sov<number>`, so no `ll211` or `ll212` will ever exist. `re-review: 2026-10-21` — read #1255's remaining commits for anything else unbuilt, then close it.

## Outcome

- **`living-lessons-l242-verses` (57 green).** Shape, debts, strict ladder, title, differentiation, furniture, two stories of differing tone; eleven movements in order in all five places; the whole-module verbatim walk (169 spans); no ellipsis, no record id, every unreferenced quoted span either His or named as ours; the four recovered strands pinned by verse; twenty-four claims read from our prose with the quotations stripped, in every band.
- **Proven to catch, three ways:** a band that stops naming its lesson (the child band failed it on the first pass, two keyword hits against a threshold of three); the movements landing out of order; and the three quotation drifts, each asserted absent from the verse it was attached to, with the curly-apostrophe case asserted in the inverse direction so the check cannot pass by accident.
- 806 of 806 lessons dated · **20 gates green** · lint clean · `curriculum-cli --gate` PASS (50 courses, 806 lessons, 56,001 spans).
- NOT proven from here: nothing in this record touches the live site, and the lesson is not reviewed on the live build until it merges (DR-0104).
