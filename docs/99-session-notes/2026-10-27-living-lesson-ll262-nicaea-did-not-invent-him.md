# 2026-10-27 — Living Lesson ll262, "Nicaea Did Not Invent Him — The Word Said It First"

**Module id:** `ll262-nicaea-did-not-invent-him-the-word-said-it-first` (`ll262`)
**Decision record:** DR-1223
**Source:** a link sent into the research road **inside the PoeTech app** with one word over it, "Lesson."
`agent_inbox` row `0593ae29-1547-46d8-b608-34ae8b09953e` (Darrell's own phone account; it waited about
87 hours in the lesson queue). `Research item 09f6457a-f259-4569-9aec-a50d2f3073c5`.

## What the road actually returned

The whole of the reading, and it said what it was: a **youtube-asr transcript, 5,254 words**, fetched on
the NAS from its residential IP because the CI path is YouTube-IP-blocked. Two limits came with it and
both are printed in the lesson's own first paragraph rather than left for a reader to assume:

1. the captions are **a machine's hearing**, not the speaker's own text (they mishear the host's name as
   "Weston" throughout), so the hosts are named only as the source summary names them — **Wesley Huff and
   Andy Steiger** — and no sentence is put in a living person's mouth beyond what the source states;
2. the route **strips timestamps**, so a quotation can be attributed to a speaker but **never cited to a
   minute mark**. Nothing in the lesson is.

No separate "reading" document was produced; the transcript was all there was.

## The subject, and why it is taught and not debated

The video tests the popular claim that the Council of Nicaea (AD 325) invented the divinity of Jesus and
voted the canon into existence. The claim is historically false, so per DR-0098 it is **named once** in
its strongest form and then **answered from the Word** — never staged as "two views, you decide," which
the gate refuses by pattern in every band. The teaching is the simplest answer available: the
first-century documents already confess the Son's full Deity, so a council in 325 could only confess or
deny what was already written.

Eleven movements, in the adult teaching and in each band: the claim named once; John 1; Thomas's
confession and the silence that follows it; the Son as Maker and sustainer; the Father addressing the Son
as God (Psalms 45:6 assigned to the Son in Hebrews 1:8); His own testimony and the charge at His trial;
the Lamb of Yahweh worshipped in heaven; the writings already binding and already calling each other
Scripture; the history with its estimates marked; and how to stand when the claim comes.

## How it was built

1. Every verse was printed from `app/public/bible/kjv` by a scratchpad resolver **before a sentence was
   written** (61 references resolved, 57 taught). From memory this lesson would have shipped
   "Thy throne, O God, is **forever** and ever" for Hebrews 1:8, where the corpus reads "for ever and
   ever" — the verse the whole argument turns on.
2. Each external claim in the video was verified against sources outside it and tiered (DR-0100). The
   tiering, what was left out, and what could not be verified are all written down in DR-1223.
3. The draft module was run through the repository's own gate scripts (`full-levels`, `reading-level`,
   `band-differentiation`, `title-in-narrative`, `quoted-verse-is-the-verse`, `quotation-integrity`,
   `talk-together`) in the scratchpad **before it touched the catalog**. Final measurement:

   | check | measured |
   |---|---|
   | referenced spans / verbatim faults | 248 / 0 |
   | fullness child / youth / teen / senior (floors 0.5 / 0.6 / 0.6 / 0.6) | 0.65 / 0.68 / 0.74 / 0.96 |
   | authored-prose grade child / youth / teen / senior (child ceiling 5.0) | 1.3 / 5.0 / 6.7 / 7.5 |
   | reading ladder inverted | no |
   | worst band overlap (ceiling 0.5) | 0.06 |
   | places missing a direction / bands not naming the lesson | 0 / 0 |
   | elisions / recited records / lowered holy names / stray non-corpus quoted spans | 0 / 0 / 0 / 0 |
   | ASCII apostrophes in our own prose / bare statistics | 0 / 0 |

4. Three real faults the checks caught before the splice: 1 Corinthians 8:6 quoted with a lowercased
   opening "but" where the corpus reads "But"; the **senior band reading easier than the teen band**
   (ladder inverted at 6.3, now 7.5); and five spine verses pinned from the adult lesson that three bands
   carried only in part. The pins are now **generated from a measurement of all five places**, and the
   genuinely short bands had the full clause added — 2 Peter 3:16 in the child band, Deuteronomy 6:7 in
   youth and teen, Isaiah 40:8 in youth — which is better for the reader as well as for the gate.
5. Spliced after ll258 (`living-lessons-class.js`), dated in `living-lessons-dates.js`.
6. `scripts/voice-clarity-corpus.mjs --write` regenerated
   `infra/nas-voice-lite/fixtures/clarity-corpus.json` (56 pieces of 39,755). That suite compares its
   fixture byte-for-byte against the live catalog and its sample reshuffles when a lesson is added; it
   was the one red in the catalog-wide batch and it is green after the regeneration.
7. `npm run lesson-dates` was not run: `app/src/lib/lesson-dates.json` holds four keys and none of them
   is a Living Lesson, because this course keeps its own recorded days in `living-lessons-dates.js`.

## The id moved three times, and the third move found a gate disagreement

Eight lesson builders ran in parallel on one machine against a main whose highest number was
ll258. This build was dispatched for **ll245** (taken for weeks -- the whole block ll245-ll258 was
already on `main`), corrected to **ll259**, then **ll260**, and finally fixed at **ll262** by central
assignment once siblings pushed branches holding ll259 (PR #2414), ll260 (PR #2415) and ll261.
Every move was measured, never guessed: `git grep` across every remote ref for
`app/src/lib/living-lessons-class.js`, and `scripts/claim-decision-number.mjs` for the record number,
which is why the record moved DR-1220 -> DR-1222 -> **DR-1223** (1220 was held by
`origin/claude/ll260-the-amarna-letters`, 1221 by the ll259 branch).

**The finding.** Trying ll260 while 259 was unclaimed in this tree turned TWO gates red by name --
`living-lessons-numbers-are-unique` ("expected [ 259 ] to deeply equal []") and
`living-lessons-id-collision`. Both measure the catalog in the tree being shipped, so neither can see
a sibling's in-flight number, and with eight parallel builders only one of them can be contiguous at a
time. The repository's own answer is a **hold**, registered in `living-lessons-id-collision.test.js`'s
`KNOWN_MISSING` with its reason and deleted by the merge that fills it, as 193, 203, 210, 236, 237 and
238 all were. 259, 260 and 261 were registered there with the PRs holding them. PR #2414 (ll259) and #2415 (ll260) have since merged and are pulled into this branch, so BOTH ENTRIES ARE DELETED HERE, which is the convention working. Only 261 is still held. That gate is green.

**The honest limit:** `living-lessons-numbers-are-unique` cannot accept a hold -- `KNOWN_GAPS` is
`[211, 212]` with `expect(KNOWN_GAPS.length).toBe(2)` and its own comment says it must not grow. So one
assertion in that file is red on this branch for the numbering alone -- it read `[259, 260, 261]` when written
and reads `[261]` now -- and it clears itself when ll261 lands. CI measured 6,923 of 6,924 cases passing with that one
assertion as the only failure. Its pin was deliberately not touched: loosening another gate's ratchet to land
your own work is the wrong trade. The fix belongs in one shared hold registry both gates read
(`re-review: 2026-11-10`, DR-1223).

## Where it sits, and what it does not duplicate

Church → Learn → Living Lessons → L259, in all four bands, with two parables ("The Deed and the Meeting",
"The Boy Who Was Teased at the Gate"), a seven-question quiz, fifteen benefits and the facilitator's run
sheet. Its anchor opens on John 1:1, so the course's section helper shelves it with the Gospels, beside
**ll39** — the hidden-Jerusalem lesson, which mentions Nicaea five times while teaching something else
(three-tier discernment about a viral geography claim) and holds one sentence of this subject:
*"Nicaea did not invent the deity of Christ; it confirmed, against a denier, what the Word had already
said."* This lesson is the direct treatment that sentence points at. ll39's discernment frame is not
re-taught and the geography claim is not re-litigated. The `ad-4th` entry in
`app/src/lib/yahweh-by-century.js` carries the same history as a *century record* — a lookup with no
bands, no stories and no quiz — and independently corroborates the canon fact (Athanasius, Festal
Letter 39). Nothing there is duplicated either.

## Suites run

The new gate (`living-lessons-ll262-nicaea-did-not-invent-him.test.js`, **84 cases**) plus
living-lessons-full-levels, order, numbers-are-unique, id-collision, stories, age-appropriateness,
research-integrity, sections, reading-level-gate, band-differentiation-gate, quotation-integrity-gate,
quoted-verse-is-the-verse, the-voice-is-heard-as-written and lesson-completeness — 184 cases — then
ledger-names-its-thread, decision-chain, ledger-integrity and ledger-uniqueness (61 cases), then
`npm run verify` whole.

**Proven to catch, on the real file:** with `is for ever and ever` altered to `is forever and ever`
throughout the ll262 module, **five cases went red**, and all 84 passed again once restored. A first
proof attempt stayed green because it altered only the first occurrence after the module id, which sits
in `bigIdea` — that miss is why the wide `scanQuotedVerses` case over `quotedTexts` (benefits, quiz,
talking points) was added to this gate rather than relied on from the catalog-wide one.
