# DR-1016: A gospel with a hole in it — L79 was a hole before it was a lesson, and the hole closing disarmed the checks keyed on it

**Date:** 2026-10-14
**Status:** accepted
**Tier:** B/C (COLG-facing and mission-identity: the lesson names The Church of the Living God, says the room contains people who have lived what it describes, names Dr. Manny Scott and Dr. Bruce Fields, and dissents in print from Scott's conclusion on multi-ethnic churches — so it reaches the Governor under `hold` rather than auto-merging into the congregation's app)
**Type:** curriculum
**Area:**
- `app/src/lib/living-lessons-class.js` (`ll79-justice-and-righteousness-travel-together` spliced between ll78 and ll80; the catalog goes 238 → 239)
- `app/src/lib/living-lessons-dates.js` (ll79's line, and the note saying why its date is the SLOT day and not the commit day — the one such line in the file)
- `app/src/__tests__/living-lessons-l79-verses.test.js` (new; 53 tests, the lesson's own gate)
- `app/src/__tests__/living-lessons-numbers-are-unique.test.js` (`KNOWN_GAPS` 79, 211, 212 → 211, 212)
- `app/src/__tests__/living-lessons-order.test.jsx`, `app/src/__tests__/continue-a-lesson-numbers.test.jsx`, `app/src/__tests__/the-lesson-count-is-derived.test.jsx` (three checks whose EVIDENCE was the open hole; re-armed, see below)
- `app/src/__tests__/living-lessons-id-collision.test.js` (`KNOWN_MISSING` 79, 211, 212 → 211, 212 — its own second check demanded it, which is the convention working)
- `app/src/lib/lesson-dates.json` (regenerated: 806 of 806 dated, 0 undated)

**Amends:** DR-0459 (its remedy applied fifteen times here rather than recorded as debt), DR-0381 (the hollow-claim class, caught in eleven places by the lesson's own gate)
**Grounds:** DR-0076 (verification doctrine — every verse fetched, every number measured), DR-0098 (teach the Word, do not debate it — the reason this lesson refuses to stage the controversy), DR-0100 (speak established fact — the injury is named as real and as sin, not hedged), DR-0210 (Yahweh in our voice, never inside a quotation), DR-0621 (hold the hand of the process — a flag is where the work starts), DR-0103 §2 (`hold` is the Governor's hand)
**Declared by:** the drain triage of 2026-10-13, which found the hole; the lesson's text mined out of PR #1255

## Concern

Living Lessons claimed 1 through 238 and never claimed 79. A number claimed twice is loud; a number claimed never is silent, and this one sat silent from 2026-08-14 until the gap check added on 2026-10-13 (`unclaimedNumbers`) printed `79, 211, 212`. The text meant to fill it was sitting in PR #1255, on a branch whose own catalog held 81 modules against main's 238 — so that file could never be merged, only the module mined out of it, and nobody had.

The lesson is also the hardest kind this house teaches: a video teaching by Dr. Manny Scott, answering a clip on evangelicalism and race and relaying his mentor Dr. Bruce Fields, reaching us as a transcription-plus-summary and never as the video. It names the first community it is taught in, it says that room contains people who have lived what it describes, and it disagrees in print with its own source's conclusion. A lesson like that cannot be shipped by habit.

## Evidence

**The hole, and what filling it cost.** The mined text was one 4,347-word adult paragraph with `FIRST,`/`SECOND,` repeated four times (numbering 1, 2, 1, 2), no stories, and four bands below the coverage floor. Rebuilt: twelve movements marked `ONE.`–`TWELVE.` in every band, in the same order in every band, and two parables written because all 238 other Living Lessons carry at least two and this one had none.

| band | prose words | share of adult | floor | FK |
| --- | --- | --- | --- | --- |
| adult | 3,240 | — | — | 7.2 |
| child | 1,977 | 0.61 | 0.50 | 4.2 |
| youth | 2,628 | 0.81 | 0.60 | 6.3 |
| teen | 2,122 | 0.65 | 0.60 | 6.3 |
| senior | 1,992 | 0.61 | 0.60 | 11.1 |

`shortBands` empty · `isInverted` false · child under the 5.0 ceiling a NEW lesson is held to · `unnamedBands` empty · differentiation worst 0.16 against a 0.5 ceiling · `placesMissingDirections` empty · 248 referenced quoted spans walked against the local KJV, **zero** that are not His words.

**A SCOPE ERROR OF MINE, CORRECTED IN THE OPEN.** On 2026-10-13 this lesson was DEFERRED with the estimate "~10,000 words", computed off the adult band's 4,347 RAW words. The floors are shares of adult **prose** (`proseWords`, quotations stripped), which is 3,240 — so the real job was ~4,300 authored words across four bands, not ten thousand. The deferral was wrong on its own arithmetic and the lesson could have shipped a day earlier.

**Sixteen defects the gates caught, none of them visible by reading.**
- **Nine elided quotations** in reader-facing fields and **six more** in the benefits, the quiz and the facilitator's notes — spans carrying `...`, which DR-0459 forbids. Every one had a contiguous verbatim span available, and in each case the remedy was to quote a little MORE of the verse: Acts 6:5's "a man full of faith and of the Holy Ghost", Galatians 3:28's "there is neither male nor female", and — best of them — Leviticus 25:10's "it shall be a jubile unto you", which is the clause the surrounding prose was already asserting and the elision had cut out.
- **Six recited record ids.** The lesson and the senior band printed "DR-0076 §8" and "DR-0098" at a reader. The rules were right every time; the citation is our bookkeeping, and a reader has no idea what DR-0098 is. This record's own check is WIDER than the gate: the gate scopes the id check to reader fields because a record id is not noise to a facilitator, and this lesson holds itself to the whole module — two more ids were found in the quiz and the facilitator's first talking point and removed.
- **Four bands that never named their own lesson.** Every band opened on "ONE. WHERE THIS CAME FROM." with the title nowhere in the opening window, so a reader inside the narrative had nothing telling him what he was in (Darrell 2026-09-17: "The title ... should stay at the top of the presentations and as well as in the actual narrative"). All four now open on the title in their own register.
- **A period inside Galatians 2:14, three times.** The verse continues with a comma; `the truth of the gospel."` is not His punctuation. The period moved outside the quotation marks.
- **Our ALL-CAPS emphasis inside His words, twice.** Ephesians 2:10 quoted as "created in Christ Jesus UNTO good works" and 1 John 3:7 as "he that DOETH". His text shouts neither. The emphasis moved OUT of the quotation and the verses are quoted as written — the same defect class the quotation gate names ("one that shouted a word His text does not").
- **The host sentence's comma inside Acts 6:1**, in the facilitator's run sheet — caught by `living-lessons-quoted-terminal`, a ratchet this session had not thought about, on a span the facilitator reads ALOUD to a room. The verse ends that clause with a period; the comma was ours and moved outside the closing quote, and the reference went in where it had been missing.
- **Eleven hollow claims (DR-0381), found by this lesson's own gate and fixed by AUTHORING, not by loosening the check.** Band after band quoted the verse and never said the thing in its own voice: the wall came DOWN (only the child band said it), the last scene already shows every nation together, justice ranked above the offering, the division of provenance, the Greek names, the body that cannot have one member suffering alone, feeling bad is not the deed, and the injury granted as real and as sin. Prose was written into adult, child, youth, teen and senior to carry each one.
- **Two defects in my own checks**, found the same way: a claim regex listed "than sacrifice" and "all nations" while the prose that teaches those claims says "ranked above the offering" and "every nation". The prose was already right; the pattern was too narrow, and widening it is the honest fix.

**THREE CHECKS KEYED ON THE OPEN HOLE AS THEIR EVIDENCE — the real finding of the day, and I under-counted it twice before the suite told me.** Each of these asserted something TRUE about the hole in order to prove a claim about something else:

| check | what it pinned | what filling 79 did to it |
| --- | --- | --- |
| `living-lessons-order.test.jsx` | `not.toContain(79)` **and** L192's `week` is not 192 | **disarmed**: every later lesson moved up one, so L192's position became exactly 192 and the defect the test exists to catch went invisible at its own worked example |
| `continue-a-lesson-numbers.test.jsx` | "L192 sits at array position 191" | **disarmed** the same way, by the same shift |
| `the-lesson-count-is-derived.test.jsx` | `GAPS` must contain 79 | stale: the arithmetic claim (count, span and holes agree) was sound; the gap it named was not |

All three are re-armed on evidence that cannot expire — the holes still open (211, 212), and a drifted lesson **found** rather than pinned, with `ownNumber` asserted for every one of them. A check whose evidence can expire stops meaning something while still printing green, which is the same class as a gate that always passes (DR-0076 §3).

Two further records of the hole are NOT in that table because they worked exactly as designed: `living-lessons-numbers-are-unique`'s `KNOWN_GAPS` and `living-lessons-id-collision`'s `KNOWN_MISSING` are shrink-only ratchets, and the second one's own check — "no number in the record has quietly been filled" — is what demanded the entry be deleted. That is the convention telling the later merge what to remove, for the fourth time.

**Verse integrity.** 248 referenced spans, zero wrong, **zero elisions anywhere in the module**. Of the quoted spans carrying no reference, 44 are verbatim KJV and the remaining 16 are enumerated by hand as our own phrases and reported speech ("a gospel with a hole in it", "you are being divisive", "we all love each other, so it is fine") — enumerated rather than waved at, so a MANGLED verse quoted without its reference cannot hide among them. Three such spans were caught doing exactly that before the list was written.

**DR-0210.** Eleven of fourteen generic "God" in our own prose became "Yahweh"; three stand with reasons given (the Church of the Living God's own proper name, and two "a God who" predicate constructions where the substitution would break the sentence). Not one word inside a quotation was touched.

## Impact

- Unresolved, the lesson is a hole the app can show: `unclaimedNumbers` printed 79 at the top of the series, the lesson Darrell's house was handed sat unmerged in a PR that cannot be merged, and the drain triage that found it had already deferred it once on a wrong number.
- The call obligates: the whole text re-measured rather than mined and dropped in; the fifteen quotation defects CLOSED rather than ratcheted as debt; the eleven hollow claims answered by writing prose; the two disarmed checks re-armed on evidence that cannot expire; and, because this is Tier B/C, the Governor's hand on it rather than the lane's.

## Decision

1. **L79 ships, and 79 comes off the gap list.** `KNOWN_GAPS` goes from `79, 211, 212` to `211, 212`. A shrink-only ratchet exists so that paying one off is always allowed; leaving a passing-but-stale allowance in place would be the quiet failure.
2. **Its date is the SLOT day, 2026-08-15, and the file says so.** The commit day is 2026-10-14. The slot day is recorded on the same ground the L153/L164/L189 lines stand on — where the course itself recorded a day, the course's day is kept — and it keeps the product claim true that in number order the days never go backwards, which is what lets the app offer "By number, oldest first" as one order instead of two. This is the only line in that file that is not a commit day, and a paragraph at its head says exactly that, so nobody later reads it as one.
3. **The explicit movement markers STAY, against sov39's own rule for itself.** `lesson-format.js` lets explicit markers win outright and switches the caps-lead heading pass off entirely. This lesson uses ALL-CAPS for in-text emphasis in dozens of places (GOSPEL, BEFORE MEN, OPEN THY MOUTH), so with the caps pass live every one of them is a candidate heading. Removing the markers here would not tidy the lesson; it would shred it. The check pins the markers rather than forbidding them, and says why.
4. **The dissent is printed, and the injury is granted.** The teaching's conclusion about multi-ethnic churches is received as testimony and not corrected as doctrine — it is earned, and this house does not lecture a man about his own scars — while the lesson states plainly that it is a conclusion from experience rather than a claim the Word makes, and answers it from Ephesians 2:14, Galatians 3:28 and Revelation 7:9: the wall came DOWN rather than up, and the last scene is already written. Both held at once: the failure is real and the Word calls it sin, and the thing that failed is still the right thing. Acts 6 is the model precisely because the remedy was redistribution of authority to the neglected group, not separation — and every name chosen was Greek.
5. **The labels are not litigated, and the lesson shows why it does not have to.** Every claim in it stands on Amos, Jeremiah, Isaiah, Zechariah, Proverbs, Matthew, Acts, Galatians, James, Deuteronomy and 1 John. A label placed on Isaiah 1:17 has been placed on Isaiah; Isaiah 5:20 is the sufficient reply. Staging the argument instead would seat man-agreement where the Word belongs, which is the one thing this platform exists to stop.
6. **It reaches the Governor under `hold`.** COLG-facing, mission-identity, and it names living people and dissents from one of them in print. The gates are the brake; this is the hand.

Not done, and said: **PR #1255 must NOT be closed, and the reason is the opposite of what this record first guessed.** The guess written here an hour before the push was that its spoken teaching on shyness-as-pride was "already in the series at ll78". The re-review was then run EARLY rather than waiting for its date, and that guess is **disproven**. #1255's own title is "L77-L79 captured teachings": its L77 is on main as `ll77-the-king-over-the-children-of-pride` (the leviathan / Job 41 material), its L79 is the lesson in this record, and its L78 landed as `ll78-the-snare-of-the-fear-of-man` — carrying the fear of man, Moses, Proverbs 29:25 and 2 Timothy 1:7, but **not the thesis Darrell actually spoke**, which the PR states in his words as "shyness can be pride, and mostly is". Measured against all 239 modules, four strands of that sitting are absent from the WHOLE series:

| spoken strand | the text | in the series |
| --- | --- | --- |
| the decisive case: anger at what presented as modesty | Exodus 4:11-14, "the anger of the LORD was kindled against Moses" | **absent** (4:11 is in ll164, on another subject; 4:14 nowhere) |
| the Saul arc, and Yahweh's timelines | 1 Samuel 10:22 "hid himself among the stuff"; 13:11-13 an explanation true in every clause with His timing left out; 15:23 | **absent entirely** |
| the Son refuses the instrument | John 8:54 "If I honour myself, my honour is nothing" | **absent entirely** |
| knowledge shown by the Ways, not announced | James 3:13 "shew out of a good conversation his works with meekness of wisdom" | **absent entirely** |

Those are Darrell's own spoken words, and this house's covenant is that he speaks them here BECAUSE they get built ("Spoken Teachings Are Build Input — Always Add It"). So the remainder is not a re-review item to read, it is a lesson to build, and it is the next thing taken up after this push rather than parked on a date. #1255's file itself stays unmergeable — 110 files, 4,088 additions against **6,855 deletions**. Separately: 211 and 212 want the look 79 got. `re-review: 2026-10-17` — confirm the shyness-as-pride lesson is built and #1255 closed, and report on 211/212.

## Outcome

- **`living-lessons-l79-verses` (53 green).** Shape, debts, ladder, title, differentiation, furniture, stories; twelve movements in order in all five places; the whole-module verbatim walk (248 spans); no ellipsis and no record id anywhere; every unreferenced quoted span either His or named as ours; twenty-two claims read from our prose with the quotations stripped, in every band.
- **Proven to catch, four ways, every one of them a defect this lesson actually had:** a band that stops naming its lesson (all four did); the movements landing out of order (the child band first assembled 1, 2, 5, 3, 4 — and note what the COUNT check does NOT catch, since the renderer finds a marker mid-paragraph and still renders twelve, so only the ORDER betrays it); the two caps-in-quotation drifts and the Galatians period, each asserted to be absent from the verse it was attached to; and the claim checks, eleven of which FAILED against the assembled lesson before the prose was written.
- **806 of 806 lessons dated, 0 undated** (`npm run lesson-dates`). 20 gates green. `npm run lint` clean. `curriculum-cli --gate` PASS: 50 courses, 806 lessons, 56,084 spans.
- The suite was run in full: **380 of 381 files green per shard before these fixes**, and the five failures it surfaced are the five recorded above (two gap records, three stale checks, one terminal comma). Re-run green after.
- `course-band-coverage-baseline.allFour` stays 237, verified by regenerating it: that baseline measures the CATALOG courses, and a Living Lesson does not move it. (An earlier note in this session assumed it would go to 238; it does not.)
- NOT proven from here: nothing in this record touches the live site, and the lesson is not reviewed on the live build until it merges (DR-0104). `#2057` still darkens every NAS-backed road and is unrelated to this.
