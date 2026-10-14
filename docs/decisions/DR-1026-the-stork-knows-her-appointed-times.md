# DR-1026: The stork knows her appointed times — a teaching stranded on a dead branch for two months, and the mining hazards it carried

**Date:** 2026-10-14
**Status:** accepted
**Tier:** A (additive curriculum: one new Living Lessons module, its own gate, and a recorded day; no existing lesson, surface or gate changes behaviour)
**Type:** curriculum
**Area:**
- `app/src/lib/living-lessons-class.js` (`ll243-the-stork-knows-her-appointed-times` appended after ll242; the catalog goes 239 → 240)
- `app/src/lib/living-lessons-dates.js` (ll243's line, with the reason its day is the COMMIT day — the opposite call from ll79's, for the same reason)
- `app/src/__tests__/living-lessons-l243-verses.test.js` (new; 52 tests, the lesson's own gate, proven to catch four ways)

**Amends:** nothing. DR-0459's remedy is applied three times here rather than recorded as debt; DR-0418's floors and DR-0210's voice rule are applied to a module written before either reached it.
**Grounds:** DR-0610 (one teaching, one lesson), DR-0621 (hold the hand of the process — a flag is where the work starts, and we never discard what does not work), DR-0076 (every verse fetched, every share measured, every absence proven rather than assumed), DR-0098 (teach the Word, do not debate it), DR-0100 (state documented good plainly), DR-0210 (Yahweh in our voice, never inside a quotation), DR-0236 (buildable now, built now), DR-1021 (the renumber tool, and why this record skips a number)
**Declared by:** running L79's `re-review: 2026-10-17` four days early, which is the second time this week that moving a re-review forward found work nobody had noticed was missing

## Concern

PR #1255 is titled "L77-L79 captured teachings" and has been open since August. Its lesson commits are numbered against **its own branch's catalog of 81 modules**, not against main's 239 — so the PR's title is not a reliable index of what it contains, and the module files can never merge. On 2026-10-13 one teaching was mined out of it by hand (ll79, held in #2166 under DR-1025). The obvious next question — what ELSE is in there — had a date on it rather than an answer.

Asking it early found two more lesson commits whose teaching is **absent from main's whole series**, and one of them is framed in Darrell's own words.

## Evidence

**THE ABSENCE WAS MEASURED, NOT ASSUMED.** Against main at `7e6f254ca`:

| probe | result |
| --- | --- |
| `stork` anywhere in `app/src` | **0 hits** |
| Jeremiah 8:7 in any lesson | **absent** (the Jeremiah 8 hits are 8:11 and 8:22, in two unrelated lessons) |
| `Earth Stewardship` / `appointed times` as a lesson | **absent** |
| `radiocarbon` / `potassium-argon` / `uranium-lead` / `samarium` / `stratigraph` | **all absent** |
| L77's teaching ("The King Over the Children of Pride") | **present** as `ll77` |
| the three-bucket discipline | **present** as `ll213` |

So of #1255's four lesson commits: L77 is in main, L78 became ll79 (held), and **two are unmined** — this one, and the dating-clocks half of its "L79 The Heavens Declare", whose three-bucket frame main already carries at ll213 but whose measurement-honesty content does not exist anywhere.

**WHAT THE 2026-08 MODULE WAS SHORT OF BY TODAY'S STANDARD.** The teaching was good; the module was not finishable as found. Measured on splice:

| fault | as found | required | how it was closed |
| --- | --- | --- | --- |
| a missing band | child, teen, senior — **no youth** | four bands | youth AUTHORED here, 0.93 of adult prose |
| bands under the floor | child 0.19, teen 0.35, senior 0.49 | 0.50 / 0.60 / 0.60 | expanded to carry every movement: 0.84 / 0.72 / 0.66 |
| straight apostrophes inside quotations | 4 (`the LORD's` ×3, `enemies' land`) | the corpus form, U+2019 | corrected; the same class that bit ll242 |
| elided quotations | 3 | none | closed by quoting MORE of the verse (DR-0459) |
| recited record ids read at a reader | 6 | none | lifted out; the prose says the thing instead |
| TALK directions | absent from **all five** places | three directions, every place | authored into the lesson and each band |
| the host sentence's punctuation inside a quoted span | 3, in the quiz and facilitator notes | the verse's own mark, or the mark outside the quote | moved out; **caught by CI, not locally — see below** |
| **stories** | **none at all** | at least 2 (Darrell 2026-07-21: "Add at least 2 stories to each 25 minute lesson") | two parables authored — one light, one solemn, the house pattern; neither contains a double quote, because the terminal ratchet records our own short dialogue tripping it by coincidence |
| stale cross-references | 2, citing #1255's own "L79" | main's numbering | corrected to L213 |

**THE STALE CROSS-REFERENCE IS THE HAZARD WORTH NAMING.** The senior band cited "L79" for the three-bucket discipline. On #1255's branch that was correct. On main, `ll79` **does not exist at all** — it is the still-held lesson of #2166, a completely different teaching about a gospel with a hole in it. A reference mined across branches does not merely go stale; it can point confidently at the wrong lesson, and nothing about reading the sentence would reveal it. The gate now pins that this module cites L213 and contains no `L79` reference anywhere.

**MY OWN WALK COULD NOT SEE THE APOSTROPHE DEFECT, and that is recorded rather than glossed.** The ad-hoc verbatim walk used while building reported `93 pairs, 0 problems` on a tree the repo's gate then failed four times over, because the walk normalises curly and straight apostrophes on BOTH sides before comparing. It was written to answer "is this span in the verse", and for that it is right; it is simply not the integrity gate, and treating a green from it as a green from the gate is exactly the looks-fine-but-isn't failure DR-0076 exists to stop. The repo's gate is the authority; the walk is a scratch tool and is now described as one.

**THE NUMBER WAS CHOSEN TO AVOID A COLLISION.** main's ledger ends at DR-1024. The held #2166 holds **DR-1025** unmerged. So this record is DR-1026 and 1025 is skipped deliberately — the first time this week a number was chosen by looking at what an open branch holds rather than by taking the next one, which is the cheap half of what DR-1021's `re-review: 2026-10-21` is about.

## Impact

- Unresolved: a teaching Darrell framed himself — earth stewardship as *"not a politics and not a sentiment, but the second half of the garden mandate"* — stays stranded on a branch that can never merge, while the series it belongs to has no lesson on the subject at all. Two months of that have already passed unnoticed.
- The call obligates: a mined module is **re-verified against today's gates, not the gates of the day it was written**, and every cross-reference in it is re-resolved against the catalog it is landing in. A module that passed in August is not thereby passing now.

## Decision

1. **The teaching ships as `ll243`, not as ll80.** main's ll80 is a different lesson; the next free number is 243 and the gap list (79, 211, 212) is left alone, because those are other work and filling one by accident would disarm the checks keyed on them.
2. **The missing band is authored, never waived.** A four-band floor applies to the module as it lands. Youth was written from scratch and placed between child and teen **by measurement** (FK 4.8 against child 2.2 and teen 7.6), not by assertion.
3. **The day recorded is the COMMIT day, 2026-10-14 — the opposite call from ll79's, for the same reason.** ll79 fills a hole INSIDE the series, so its slot day keeps "by number, oldest first" a single order. This module sits at the END, so the 2026-08-16 writing day would make 243 older than 242 while numbered after it, splitting that one order in two. The dates file carries the reasoning on the line.
4. **Every fault above is fixed in the lesson, not ratcheted as debt.** No baseline grew.
5. **#1255 has exactly ONE item left in it, and this says so with both records read rather than inferred from filenames.** That branch also carried a gate (`scripts/lesson-quote-guard.mjs` + a 558-line baseline + `lesson-quotes-outside-the-lesson-field.test.js`) under its own **DR-0305, "The verbatim gate claimed every quoted Scripture and read one field of thirteen — the child band was the least-gated prose in the repository"** (2026-08-15). Two things are true about it:
   - **Its number cannot survive.** main's DR-0305 is a different and EARLIER decision — "The audit log refreshes by delta; the front door was 402 while the database was healthy", 2026-08-14, merged in PR #1239 — so that record can never merge as numbered and would need `renumber-decision-record.mjs` (DR-1021) if anyone ever wanted it.
   - **Its FINDING is already closed on main by another route, and this lesson is the proof.** That record measured 3,363 referenced quotes outside `mod.lesson` with 556 sites not matching the corpus, and named `levels.child` as the least-gated prose in the repository — "the band that gets read to children". main reaches those fields through `scripts/quotation-integrity.mjs` and the curriculum course-quotation checks instead, which is not an inference here: building THIS lesson, faults were caught in `levels.child`, `levels.youth`, `levels.teen`, `benefits[3]`, `quiz.questions[1].options[1]` and `facilitator.talkingPoints[0]` and `[2]` — precisely the fields DR-0305 said were never checked. The child band is now among the most gated prose in the module, not the least.
   - Not claimed: that main's `recordedVerseDebt: 472` is the same measurement as that record's 556 unmatched sites. They are plausibly the same lineage under a shrink-only ratchet, but they were taken by different instruments over different field sets and this record does not assert they are one number.

   So nothing in #1255 needs mining except the lesson below.
6. **The remaining strand is named, not quietly dropped.** #1255's dating-clocks teaching (radiocarbon's ~50-60k ceiling, the longer-lived clocks, stratigraphy as order-not-age, disciplined by Leviticus 19:35-36 / Proverbs 11:1 — a tool carried past its range is a false balance in anybody's hand) is absent from main and is the next lesson out of that branch. `re-review: 2026-10-17` — build it, then close #1255, which will have nothing unmined left in it.

## Outcome

- **52 tests green**, proven to catch four ways, every case a defect this module actually had: one reverted apostrophe fails both the verbatim check and the dedicated apostrophe check; a reintroduced elision is caught; a recited record is caught; a band trimmed below its floor is caught; a band that stops sending the reader anywhere is caught.
- **Measured on the final tree:** adult prose 1,763 words; child 1,480 (0.84), youth 1,632 (0.93), teen 1,274 (0.72), senior 1,157 (0.66) against floors of 0.50/0.60/0.60/0.60. FK 2.2 / 4.8 / 7.6 / 13.9 — strictly rising, not inverted, child under the 5.0 ceiling a new lesson is held to. Band overlap max 0.10 against a 0.5 ceiling. Title named in all four bands. All three TALK directions in all five places. No elision, no recited record anywhere.
- **Curriculum gates PASS** — 50 courses, 807 lessons, 56,095 spans, 55,643 verbatim. `lesson-dates:check` ok — 807 of 807 dated, 0 undated. 20 gates green; lint clean.
- **AND THE FULL SUITE THEN FOUND THREE MORE, ALL FROM ONE ROOT CAUSE WORTH RECORDING.** Letting the whole suite finish (37 minutes, 25,391 tests) turned up three failures in two files, and every one traced to the same fact: **ll243 carried no `stories` and became the LAST module in the catalog.**
  - `living-lessons-stories` — ll243 short of its two stories, with the Darrell-declared standard behind it (DR-0215 / DR-0855; measured 2026-10-09: 146 of 228 lessons were short, and he asked "What happened to the having two stories/parables inside each lesson?!!!!!!"). **Fixed by authoring two parables**, not by touching the gate. Its proven-to-catch case failed too, for a second reason: it reads `MODULES[length - 1].stories` and that was `undefined`, so a lesson with no stories at all broke the very check meant to catch a lesson with no stories.
  - `the-points-are-numbered-once-per-lesson` — its "a single-text caller is unaffected" case also read `MODULES[length - 1]` and asserted `sectionCount > 3`. ll243's adult lesson is continuous prose with **2** sections, which is legitimate for this lesson and has nothing to do with numbering. **THIS IS THE SAME CLASS THE L79 RECORD NAMED, RECURRING:** a check keyed on position, whose evidence expires the moment anything lands after it. Three checks were disarmed that way by filling the L79 hole; two more were disarmed here by appending past them. The check now **finds** a lesson that can exercise it — it selects ll242, with 11 sections numbered 1 through 11, a strictly stronger subject than the 2-section lesson it had drifted onto. The assertions are untouched; only the subject is chosen rather than assumed.
  - The standing lesson, stated for whoever appends the next module: **"the newest lesson" is not a stable worked example.** Any check that reaches for `MODULES[length - 1]` is holding a subject that the next lesson silently replaces, and it will fail — or worse, quietly stop testing anything — on a lesson whose shape is merely different rather than wrong.
- **THE FIRST PUSH WENT RED, AND THE REASON IS WORTH MORE THAN THE FIX.** Shards 1 and 3 failed on `living-lessons-quoted-terminal.test.js` with three spans carrying the host sentence's own punctuation inside the quote — `"the poor of thy people may eat,"` where Exodus 23:11 reads a colon, `"a sabbath for the LORD."` where Leviticus 25:4 continues with one, and `"some say."`, our own phrase and our own period. All three were in the ORIGINAL module's quiz and facilitator notes rather than in the prose authored here, so they are an eighth fault class the 2026-08 module carried. **The process defect is mine:** before pushing I ran the 20 gates, the curriculum gates, this lesson's own 52 checks and six related suites — but the FULL suite was still running locally when I pushed, and that terminal gate lives in it. "The gates I thought to run" is not the same set as "the gates that exist", and the only reliable way to know the difference is to let the whole suite finish. It does now, before the second push.
- **A mistake made during the proof, and worth keeping.** The first attempt to prove the apostrophe check reverted the first match in the whole 15.6 MB file rather than inside this entry, landing a bare apostrophe in an unrelated lesson's single-quoted string and breaking the file's syntax. It was caught immediately by the parse error, restored from a copy taken first, and redone scoped to the entry. The habit that saved it was copying the good file before touching it — which is the cheap half of "characterize before you change" (DR-0076 §5).
