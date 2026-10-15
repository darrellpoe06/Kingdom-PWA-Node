# DR-1027: The heavens declare, and the timetable stays open — the last unmined teaching in PR #1255

**Date:** 2026-10-14
**Status:** accepted
**Tier:** B (curriculum carrying a doctrinal position: the lesson states the house's held-open stance on the creation days and dissents in print from a named ministry's day-age reading)
**Type:** curriculum
**Area:**
- `app/src/lib/living-lessons-class.js` (`ll244-the-heavens-declare-and-the-timetable-is-held-open` appended after ll243; the catalog goes 240 → 241)
- `app/src/lib/living-lessons-dates.js` (ll244's line and why its day is the commit day)
- `app/src/__tests__/living-lessons-l244-verses.test.js` (new; 66 tests, the lesson's own gate)

**Amends:** nothing. DR-0459's remedy applied three times; DR-0418's floors, DR-0210's voice rule and the talk-together rule applied to a module written before any of them reached it.
**Grounds:** DR-0610 (one teaching, one lesson), DR-0076 (every verse fetched, every share measured, every absence proven), DR-0098 (teach the Word, do not debate it — the reason the timetable stays open rather than being argued), DR-0100 (state documented good plainly — their method is credited, not sniffed at), DR-0210 (Yahweh in our voice, never inside a quotation), DR-0236 (buildable now, built now), DR-0621 (hold the hand of the process)
**Declared by:** finishing the re-review that DR-1026 opened, rather than waiting for its date

## Concern

PR #1255 held four lesson commits numbered against its own 81-module catalog. Three were accounted for by 2026-10-14: L77 was already in main as `ll77`, L78 became the held `ll79` (#2166), and L80 became `ll243`. This is the fourth and last, and with it **#1255 contains nothing the series lacks.**

## Evidence

**WHAT WAS ACTUALLY ABSENT, MEASURED RATHER THAN ASSUMED.** The lesson's three-bucket frame — what Scripture STATES, what is MEASURED, what is REASONED on top — already lives in main at `ll213`. So the question was not whether the lesson was new but which half of it was. Against main at `7e6f254ca`:

| probe | hits in `app/src` |
| --- | --- |
| `radiocarbon` | **0** |
| `potassium-argon` | **0** |
| `uranium-lead` | **0** |
| `samarium` | **0** |
| `stratigraph` | **0** |
| the three-bucket frame | present, at `ll213` |

The measurement-honesty half existed nowhere: how radiocarbon actually works, that it dates a DEATH and not a rock, its ~50–60k ceiling as arithmetic about the method rather than an opinion about the earth, the longer-lived clocks usable *because* they run slower, stratigraphy as order and not age — all disciplined by Leviticus 19:35-36 and Proverbs 11:1, which make a tool carried past its range a false balance **in anybody's hand**. That symmetry is the lesson's spine and it is why the lesson refuses to arm either side.

**#1255's GATE IS DELIBERATELY NOT MINED, and both records were read before deciding.** That branch also carried `scripts/lesson-quote-guard.mjs` with a 558-line baseline, under its own **DR-0305, "The verbatim gate claimed every quoted Scripture and read one field of thirteen — the child band was the least-gated prose in the repository"** (2026-08-15), which measured 3,363 referenced quotes outside `mod.lesson` with 556 sites not matching the corpus. Two facts settle it:

1. **Its number cannot survive.** main's DR-0305 is a different and earlier decision — the audit-log delta record, 2026-08-14, merged in PR #1239 — so that record could never merge as numbered.
2. **Its finding is already closed here, and this lesson is the proof.** main reaches those fields through `quotation-integrity.mjs` and the curriculum course-quotation checks. Not an inference: building this lesson, those instruments caught faults in `levels.youth`, `levels.teen`, a quiz option and the facilitator notes — exactly the fields that record said nothing ever checked.

**THE DOCTRINAL LOAD, and why this is Tier B.** The lesson states the house position in print: the timetable is **held open**, adopting neither the day-age reading these scholars teach nor its opposite, because the Word does not make the timetable its point. That is a recorded position rather than indecision, and its purpose is pastoral — it keeps a brother reading ordinary days and a brother reading ages both inside the family. The risk the lesson names explicitly is that adopting a trusted secondary source's reading would **silently overwrite a recorded house position through a video summary**, which is how positions actually drift. The gate forbids any band quietly settling the days.

**NINE FAULTS IN THE MINED MODULE, every one fixed in the lesson rather than ratcheted:**

| fault | as found | closed |
| --- | --- | --- |
| no youth band | child, teen, senior only | authored, 0.76 of adult prose, placed between child and teen by measurement |
| three bands under floor | child 0.12, teen 0.23, senior 0.36 | 0.60 / 0.76 / 0.77 / 0.60 |
| **child band above the ceiling AND short** | FK 5.15 against a 5.0 ceiling, at a fifth of its owed length | **2.09**, having to get longer and simpler at once |
| bands not naming their lesson | 3 of 3 | all four name it |
| elided quotations | 2 in reader fields, plus 1 in `benefits[10]` that the reader-field gate does not read | closed by quoting more of the verse |
| recited record ids | 2 fields | lifted out |
| TALK directions | absent from all four places it had | authored into the lesson and all four bands |
| stories | **none** | two parables, one light and one solemn |
| generic "God" in OUR voice | 4 sites in the adult prose | Yahweh, with every quotation untouched |

**THE APOSTROPHE CLASS RECURRED A THIRD TIME, AND THIS TIME IT WAS PREDICTED FIRST.** Three straight apostrophes inside quotations — `man's heart` twice (Proverbs 16:9) and `man's blood` (Genesis 9:6) — where the corpus carries U+2019. I had fetched those verses with the curly form visible in the output, had written in this session's own prior record that this is the class that bit ll242 and ll243, said out loud that it was the risk, and then typed the straight form anyway. Prediction is not prevention. The gate caught all three; the lesson's own check now pins it, and the honest conclusion is that this class needs a mechanical fix at authoring time rather than a third resolution to be careful.

Two more of the same family: **2 Peter 3:8 capitalised** at a mid-verse opening (`"One day is with the Lord"` where the verse reads `that one day is with the Lord`) — the same class as ll242's `"Let him shew"` — and **two terminal marks belonging to the host sentence**, both in the ORIGINAL module's prose: `"be ye transformed,"` where Romans 12:2 has no comma there, and `"without excuse."` where Romans 1:20 ends with a colon.

**A CORRECTION OF MY OWN, RECORDED BECAUSE IT NEARLY BECAME AN EDIT.** Checking the senior band's cross-references, I reported that `L34` was stale — cited as "discernment in the age of AI" while `ll34` read "The Tower, the Race, and the Sovereign". It was not stale. My regex captured only the title text before the em-dash; the full title is "The Tower, the Race, and the Sovereign — **Discernment in the Age of AI**", and the citation was correct all along. All five of that band's references resolve. The near-miss is worth keeping because it is the inverse of ll243's real stale reference: a check that reads part of a field reports a difference that is not there, and I was one step from "fixing" a correct citation.

## Impact

- Unresolved: the last teaching in #1255 stays stranded, and the series keeps a hole where the honest handling of dating methods should be — which matters because the eldership is handed radiometric claims from both directions by people who have not asked what the instrument measures.
- The call obligates: a mined module is re-verified against TODAY's gates, its cross-references re-resolved against the catalog it lands in, and a recorded house position restated by the lesson rather than left for a source to supply by default.

## Decision

1. **The teaching ships as `ll244`**, and the gap list (79, 211, 212) is left alone.
2. **The timetable stays open, in every band, and the gate enforces it.** No band may settle the length of the days; every band must say the question is held open and must protect the other reading by name.
3. **The symmetry is preached both ways or not at all.** Every band must carry the wrong-instrument correction in BOTH directions — including that "carbon dating is unreliable, therefore the earth is young" swings at a tool that never made the claim.
4. **Their method is credited and their figures are not repeated as established.** The cross-checking of independent instruments is commended by name; the improbability figure, the species-replacement interval, the Flood-within-an-ice-age model and the dispersal window are labelled models.
5. **#1255's gate is not mined, for the two reasons above, and #1255 can now be closed.**

## Outcome

- **66 tests green**, proven to catch on the apostrophe class, the capitalised opening, a band trimmed below its floor, and the elision class.
- **Measured on the final tree:** adult prose 4,468 words; child 2,702 (0.60), youth 3,408 (0.76), teen 3,445 (0.77), senior 2,669 (0.60) against floors of 0.50/0.60/0.60/0.60. FK **2.09 / 7.32 / 11.44 / 17.77** — strictly rising, not inverted, child under the 5.0 ceiling it STARTED above. Band overlap worst 0.15 against a 0.5 ceiling. All four bands name the lesson; all three TALK directions in all five places; no elision, no recited record, no generic "God" in our own voice anywhere.
- **Curriculum gates PASS** — 50 courses, 808 lessons, 56,295 spans, 55,843 verbatim. `lesson-dates:check` ok — 808 of 808 dated, 0 undated. 20 gates green; lint clean.
- `re-review: 2026-10-21` — close #1255, and decide whether the straight-apostrophe class gets a mechanical guard at authoring time, since being forewarned demonstrably did not stop it.
