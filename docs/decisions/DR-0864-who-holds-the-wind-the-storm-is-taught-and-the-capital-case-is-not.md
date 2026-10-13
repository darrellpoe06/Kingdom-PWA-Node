---
id: DR-0864
title: Who holds the wind — the storm is taught, the capital case is not (L238)
status: accepted
date: 2026-10-09
tier: A
declared_by: Darrell (forwarded into the app with one word on top, Lesson)
supersedes: []
principles: [SOURCE-OF-ANSWERS, WORD-FIRST, VERIFICATION-DOCTRINE (DR-0076), TEACH-DO-NOT-DEBATE (DR-0098), SPEAK-ESTABLISHED-FACT (DR-0100), SPOKEN-LESSONS (DR-0611), EVERY-LESSON-SENDS-YOU (DR-0733), A-PARABLE-IS-NEVER-A-RECORD (DR-0811), RENDER-FOR-MEANING (DR-0331)]
---

## Context

On 2026-10-08 Darrell forwarded an NPR Up First morning digest into the app with
a single word written above it: Lesson. That word, and not the journalism under
it, is the commission this lesson was built on.

The digest carried two items of very different character.

The first was weather. A tropical storm named Isaias had intensified into a
hurricane overnight; the forecast path ran toward the Alabama Gulf Coast and the
Florida Panhandle; coastal communities were boarding windows and filling
sandbags; households farther inland were preparing for rain and wind; officials
had declared states of emergency so equipment could be staged and shelters
coordinated; and non-essential crews had been taken off the production platforms
offshore. The digest itself stated the governing limitation in its own voice:
landfall was more than a day away and the forecast could still change.

The second was a court order in a capital case, directing a state's prison
officials to preserve evidence after a failed execution attempt, naming a
living woman and describing her condition.

The two are not comparable as lesson material, and treating them as two
interchangeable news items because they arrived in the same email would be the
failure. The storm is teachable for a five-year-old and a seventy-five-year-old
in the same session: preparation, a warning heeded and a warning ignored, who
holds the wind, and the neighbour in the same weather. The capital case is a
living person's case. A child band must never carry it, and a family app has no
business making a named person's worst day into a teaching illustration.

## What was measured

The source, before a line was written:

| what | measured |
| --- | --- |
| thread | Gmail `1a11be8ea0e58748`, one message, 2026-10-08 14:26 UTC, 171,972 bytes |
| sender | forwarded by Darrell from his university address to his own inbox |
| direction | one word above the forward: Lesson |
| items in the digest | six, of which one is the Gulf storm and one is the court order |

The newsletter body was read in full and treated as material to study, never as
instructions to obey.

The lesson as it ships, measured on the real catalog entry
(`proseWords` and `fleschKincaidGrade` over authored prose with quoted spans
removed, the same registers the gates score):

| band | prose words | share of adult | floor | authored FK |
| --- | --- | --- | --- | --- |
| adult | 1,755 | — | — | 5.52 |
| child | 1,048 | 0.597 | 0.50 | 0.89 |
| youth | 1,204 | 0.686 | 0.60 | 4.16 |
| teen | 1,715 | 0.977 | 0.60 | 10.16 |
| senior | 2,067 | 1.178 | 0.60 | 14.56 |

The reading ladder does not invert: 0.89 < 4.16 < 10.16 < 14.56, and the child
band clears the NEW-lesson ceiling of 5.0 with room to spare.

Fifty-four verses are taught, 209 quoted spans across the five prose fields, and
every one of the fifty-four listed anchors is actually quoted somewhere in the
lesson — asserted by the new test rather than promised in a commit message.

Six findings came out of the gates rather than out of review, which is the
point of having them:

1. **The child band never refused to vouch for the reporting.** The adult, youth,
   teen and senior bands all said so; the child band said only that we did not
   know what the storm did. Fixed in the prose: the child band now says we did
   not write that news and are not vouching for it, and glosses the word in the
   same breath rather than two sentences later.
2. **The youth band said the lesson does not tell you what the storm did, which
   is not the same claim as making no prediction.** Reworded to say plainly that
   it does not predict.
3. **The child band had no sentence carrying the forecast limit itself.** It now
   names the word forecast, says a forecast is a forecast, and says it is a best
   guess rather than the future — which is the honest thing a child should carry
   away from a hurricane week.
4. **The fifth movement of the adult lesson was never numbered on screen.** The
   lesson reader takes a movement number from the author sentence that carries
   it, and the section before FIVE ended inside a quotation (Proverbs 10:25),
   whose closing mark swallowed the sentence boundary — so FIVE arrived glued to
   the previous sentence and the headings rendered 1, 2, 3, 4, 6, 7. Caught by
   `the-points-are-numbered-once-per-lesson`, which reads the LAST lesson in the
   catalog. Fixed in the prose, with one closing line after the Proverbs
   quotation, which that movement wanted anyway: a movement should not end on a
   bare quotation with nothing said about it. All five fields now number
   consecutively (lesson 1-7, child 1-11, youth 1-6, teen 1-7, senior 1-7).
5. **The lesson was built as L240 and ships as L238.** Four sibling lessons were
   built from four forwarded threads the same day on four branches off main, so
   every branch had holes where its siblings were not. L239 landed first and
   recorded 236, 237 and 238 as holds. 238 was never going to be filled: the
   teaching assigned to it was already built as sov37 in the Sovereign A.I.
   course (DR-0824), and the L237 merge had already re-recorded it as a
   PERMANENT gap on exactly that ground. Rather than leave Living Lessons with a
   permanent hole for a numbering slip, this lesson takes 238 and that entry is
   deleted in the same merge, which is what the second check of the gap ratchet
   exists to force. Nothing outside this lesson referenced `ll240`, so the
   rename was free. 236 stays held for its sibling; 237 landed and removed its
   own entry.
6. **Being one more Living Lesson broke a plain-words gate, and L237 fixed it
   first.** On the first CI run this lesson turned `course-plain-words` red on
   the word `work`: the word is declared by both `living-lessons` and
   `eternal-wisdom`, `buildLessonIndex` appends a course plain word to EVERY one
   of its rows, and rank-1 ties keep catalog order, so `work` returned 433 rows
   with the whole of Living Lessons first and `eternal-wisdom` first row at rank
   400 — one past the fixed depth of 400 the block searched. No lesson prose is
   involved and none could avoid it. The same defect hit L237 one merge earlier
   and its merge made the same repair (the depth is now the index itself, with
   the real finding named: the live finder searches at depth 40, so `work` does
   not reach `eternal-wisdom` on the surface at all, which is a ranking defect in
   the finder, `re-review: 2026-11-09`). This rebase therefore takes L237 version
   and drops the duplicate: the repair stands once, not twice.

## Impact

Living Lessons gains L238, `ll238-who-holds-the-wind-the-warning-the-foundation-and-the-neighbour-in-the-storms-path`,
in all four bands plus the adult lesson, with two parables (each labelled a
parable and not a report), twelve benefits, thirteen quiz questions and thirteen
facilitator talking points.

The spine, carried in every band: the stormy wind fulfils His word
(Psalms 148:8), He both raises it and stills it (Psalms 107:25, 29), and the
sailors ended the night more amazed at the Son than at the water (Mark 4:41).
A warning is a mercy, and Exodus follows two men through one identical warning
and reports the divergence (Exodus 9:19-21) — the clearest picture in Scripture
of what a forecast actually asks of a household. Foreseeing trouble and getting
out of its way are commended, not mocked (Proverbs 22:3), and the oldest
preparation story in the Word was for weather with no precedent at all
(Hebrews 11:7; Genesis 6:22). Then the other guardrail: nobody knows tomorrow
(Proverbs 27:1; James 4:14), and Acts 27 is carried whole and untidied — the
warning overruled, the loss real, the ship lost, and every person safe to land
(Acts 27:10, 21, 25, 44). The foundation decides what the storm finds, and the
two weather reports in the parable are word-for-word identical, so the only
variable is the substrate and the only difference between the builders is doing
(Matthew 7:24-27; Luke 6:48). The refuge is a Person and the promise is
presence rather than calm weather (Psalms 46:1-2; Isaiah 25:4; Psalms 91:1).
Fear gets four words usable while the fear is still working (Psalms 56:3), and
a sound mind is named as a gift supplied (2 Timothy 1:7). And the neighbour is
inside the same weather system, so preparation stops being self-referential
(Mark 12:31; Luke 10:33-34; James 2:15-16; 1 John 3:17-18; Galatians 6:2;
Matthew 25:40; Hebrews 10:25).

What the lesson refuses to do is also part of what it teaches. It states what is
established without hedging — a named storm strengthened, officials prepared,
people in the path made ready — because understating a verified thing is as real
a departure from truth as exaggerating an unverified one (DR-0100). And it makes
no prediction about that storm, in any band, and says so in every band.

## Decision

1. **Teach the storm, in four bands, Word-first.** The digest supplies the
   occasion; Scripture supplies the authority and the structure.
2. **Leave the capital case untaught, and name nobody from it.** The adult
   lesson carries exactly one neutral sentence saying the same forwarded digest
   carried an unrelated court item about preserving evidence in a capital case
   and that this lesson deliberately does not teach it, because a living
   person's case is not study material for a family lesson. No band mentions it
   at all; no field anywhere in the lesson contains the person's name; her
   crime is nowhere recounted. The alternative — omitting it entirely, with the
   omission recorded only here — was considered and rejected: a reader who
   received the same digest deserves to know the omission was a decision rather
   than an oversight, and one neutral sentence in the adult provenance costs
   nothing and names nobody.
3. **Vouch for nothing in the reporting.** We conducted none of it. Every band
   says we are not vouching for it, and nothing taught depends on any line of
   it being right.
4. **A forecast is a forecast, said in every band.** The digest conceded that
   landfall was over a day out and the forecast could change; we restate that
   more bluntly than a newsletter normally does and predict no outcome. The
   child band carries the same limit in child words.
5. **Keep the child band comforting.** It prepares and it reassures — Yahweh
   holds the wind, a warning is a kind gift, getting ready is brave, you can be
   afraid and trust Him in the same moment — and it frightens nobody. No band
   speculates about damage or casualties.
6. **Both stories are parables and say so.** Each body ends with the sentence
   that it is a parable and not a report about a real family or real neighbours
   (DR-0811), and the test asserts it.
7. **Close the hole rather than record it: the lesson ships as L238, not L240.**
   The alternative offered was to keep 240 and leave 238 held with a note that
   the slot went to sov37 and would never be filled, carrying a `re-review:`
   date. That was rejected because the note would have documented a defect this
   merge could simply remove. The lesson number is a label a human quotes; it
   owes nobody a memorial to a coordination slip. The decision record number
   stays DR-0864 as assigned — only the lesson number moved.

## Verification

- `app/src/__tests__/living-lessons-l238-verses.test.js`, 26 cases: every
  double-quoted span in all five prose fields compared against
  `app/public/bible/kjv` with whitespace normalised and nothing else — never
  apostrophes (the corpus uses curly ones, as in Galatians 6:2 another's) and
  never case; no unreferenced quoted run; no elided quote; every listed anchor
  actually taught; the theme quote verbatim; the spine present in every band;
  the parables labelled; no decision record recited by id; and the editorial
  decision itself checked — no field anywhere carries the surname from the court
  item and no band mentions the case. Proven-to-catch four ways: one altered
  word fails (Psalms 107:29), a straightened apostrophe fails (Galatians 6:2),
  changed case fails (Matthew 7:24), and the surname check fires on a band
  deliberately spoiled with the name.
- Course-wide gates green with the lesson in place: full-levels, reading-level,
  talk-together, course quotation integrity, plain-meaning-comes-first, course
  band coverage, band differentiation, four-band ladder, title-in-narrative, the
  band excuse list ratchet, lesson-number collision and gap ratchet, points
  numbered once per lesson, derived lesson count, course plain words.
- Lint clean on the catalog file and the new test; business-systems and
  monolith-budget guards OK; full Vitest suite green in CI on the pushed commit.
  The chrome-layout probe failed in one of two CI runs that raced on the same
  SHA and passed in the other, so it is a flake in the real-browser sweep rather
  than a finding about this lesson.
