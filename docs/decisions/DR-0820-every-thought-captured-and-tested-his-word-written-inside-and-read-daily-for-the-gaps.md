# DR-0820 — Every thought captured and tested: His Word written inside, and read daily for the gaps (L220)

**Date:** 2026-10-08
**Status:** accepted
**Area:** Living Lessons (L220), mental stewardship grounded in the Word
**Principle:** Spoken Teachings Are Build Input (Layer 0), DR-0611 (spoken and sent lessons), DR-0076 (verify every verse; proven-to-catch), DR-0098 (teach the Word, do not debate it), DR-0100 (state established fact plainly, flag the open narrowly), DR-0733 (every lesson sends you to someone), DR-0331 (render his words for meaning, never his voice), DR-0818 (the sibling lesson from the same word)

## Context

Darrell sent this into the app by email on 2026-10-08. One word on top —
Lesson — and his own teaching under it (rendered for meaning, DR-0331):

> Increase in knowledge, and the importance of His Knowledge being the highest
> and the standard, not my will but His. Expect great outcomes when you lean on
> His Understanding, not on the thousands of thoughts a waking day brings.
> Using our ability to choose the thoughts — that is capturing the thoughts,
> inspecting them for what should and should not be allowed inside this mental
> space, because whatever we fill this place with will become who we are. He
> wrote His Word in there, and we must focus on that part, by reading it daily
> to see the gaps between what He said and what we believe He means. It is a
> fun activity that becomes you. The perspectives will be masterful to you when
> seen in the context of what He meant, not what you thought it meant before
> you studied to show yourself approved unto Him.

The FIRST clause of that word — His Knowledge as the highest authority and
level, in all dimensions — is already built. It is L219, shipped the same day
as DR-0818 from the same teaching spoken into the app. What L219 does not
carry is everything after that clause: the thought stream, the choosing, the
capturing, the inspecting, the gate on the mental space, His Word already
written in the deep part, and the daily reading that finds the gaps. That half
is this lesson, and the lesson says so in its own prose rather than quietly
repeating its sibling.

The teaching is not an invention. Every clause he gave has a verse under it,
and the lesson sets them down whole instead of alluding to them: not my will
but Thine (Luke 22:42); the carnal mind that is not subject and cannot be
(Romans 8:6-7); as he thinketh in his heart, so is he (Proverbs 23:7);
bringing into captivity every thought (2 Corinthians 10:5); the eight-part
Test (Philippians 4:8); keep thy heart with all diligence (Proverbs 4:23); I
will write it in their hearts (Jeremiah 31:33); thy word have I hid in mine
heart (Psalms 119:11); meditate therein day and night (Joshua 1:8; Psalms
1:2); a discerner of the thoughts and intents (Hebrews 4:12); study to shew
thyself approved (2 Timothy 2:15); be ye doers (James 1:22); and the result He
attaches to it, perfect peace to a mind stayed on Him (Isaiah 26:3).

One number needed care. He put the thought stream at about six thousand in a
waking day. Scripture gives no count at all, and researchers who measured how
often people transition from one thought to the next reported something near
that figure in 2020. So the lesson attributes the number to him, says plainly
that the Word supplies no number, and rests the teaching on the law the volume
obeys (Proverbs 23:7) rather than on the figure. That is DR-0100's three-tier
handling: state what is his, name what is open, lean on what is written.

## What was measured

Band weight, against the real adult prose (`scripts/full-levels.mjs`):

| band | prose words | ratio | floor | result |
|---|---|---|---|---|
| adult | 1,094 | — | >1,000 | pass |
| child | 569 | 0.520 | 0.50 | pass |
| youth | 659 | 0.602 | 0.60 | pass |
| teen | 752 | 0.687 | 0.60 | pass |
| senior | 897 | 0.820 | 0.60 | pass |

Reading ladder (`scripts/reading-level.mjs`, Flesch-Kincaid on our prose only,
quoted Scripture excluded): child 1.43, youth 2.96, teen 4.74, senior 5.74.
The NEW-lesson child ceiling is 5.0, and the ladder rises.

Structure: `formatLessonText` finds **15 sections** in the adult lesson — the
title, the word he sent, the twelve movements ONE through TWELVE, and TALK IT
TOGETHER. Every band and the lesson send the reader in all three directions
(`hasAllThreeEverywhere` true), and no band leaves its own title unnamed
(`unnamedBands` empty).

Verses: every double-quoted span in the whole module carries a reference, and
every referenced span is contained verbatim in the in-repo KJV corpus under a
strict comparison that normalizes whitespace only.

**Proven-to-catch (DR-0076 §3).** Four real defects were caught by the gates
written for this lesson, not by reading it over:

1. The strict corpus check rejected three spans whose punctuation I had
   normalized without noticing. Proverbs 23:7 ends on a colon, not a period
   (`so is he:` — the verse continues). 2 Corinthians 10:5 and Ephesians 4:23
   each end on a semicolon. All three now quote the clause and stop, with the
   sentence punctuation outside the quotation marks.
2. One quiz explanation quoted 2 Corinthians 10:5 with an internal ellipsis
   and no reference at all. The unreferenced-span check found it; it is now a
   contiguous, referenced quote.
3. The heading probe found only 12 of the 15 sections. FOUR and EIGHT followed
   a bare `(reference)` with no sentence-ending period, so the marker was never
   cut into its own sentence; TEN's marker ran to eleven words, past the
   nine-word limit in `lesson-format.js`. All three are fixed, and the twelve
   movements are now navigable headings in the reader.
4. The band-weight gate failed the child band at 0.446 and the youth band at
   0.522 on the first pass. Both were raised with real teaching — the four
   moves named for children, a worked example of what a gap actually looks
   like for youth — not with filler.

## Impact

L220 joins Living Lessons as the 217th module, dated 2026-10-08 in
`living-lessons-dates.js` beside its sibling L219. The course's newest-lesson
ordering pin moves to it. The lesson gives the family and the church the whole
sequence Darrell asked for, in four registers:

- the posture it all sits on, not my will but His;
- why the thought stream cannot be the authority, in the Word's own words;
- the volume stated honestly, with the number attributed and the Word's silence
  named;
- capture rather than argue, then the eight-part inspection;
- the gate, and why what is inside is what comes out;
- what He already wrote in the deep part, and what we hide there on purpose;
- the daily reading, and the gaps it finds — named as good work, not a chore;
- what does the finding: the Word reads the intents under the thoughts;
- the name of the work, and the refusal to stop at hearing it;
- the four moves — NOTICE, TEST, CAPTURE, REDIRECT — short enough to run while
  standing in a kitchen, which is the only reason anyone runs them at all;
- the honest limit: most thoughts go uncaught, and that is arithmetic, not the
  method failing;
- and the peace He attaches to a mind stayed on Him, so nobody leaves weighed.

## Decision

Ship L220 with its full four-band build, a ten-question quiz, twelve benefits,
twelve facilitator talking points, its date row, and a verse-pin test that is
proven to catch. His number stays attributed to him and the Word's silence
stays stated; the teaching rests on Proverbs 23:7, not on a figure. The lesson
names L219 as the first half of the same word rather than overlapping it
silently.

`re-review: 2026-11-08` — read L220 and L219 side by side on the live build in
a month and confirm the pair reads as two halves of one teaching rather than as
two lessons that repeat each other.

## Verification

- `app/src/__tests__/living-lessons-l220-verses.test.js` — 24 cases, all green:
  registration and title, all four bands plus quiz/benefits/facilitator shape,
  band weight against the real adult prose, the rising reading ladder with the
  child ceiling, titles named per band, all three directions everywhere, every
  span referenced, every referenced span verbatim in the corpus, his own words
  never dressed as Scripture, the twelve teaching checks per band, the four
  moves present in every band, the adult spine, the honest handling of the
  number, and his framing carried rather than paraphrased away.
- `src/__tests__/lesson-dates.test.js`, `living-lessons-order.test.jsx`,
  `the-points-are-numbered-once-per-lesson.test.js` — 44 cases green with the
  new lesson and the updated newest-day pin.
- Band weight, reading ladder and section count measured directly against the
  real module, numbers in the table above.
- Thread `1a11bdb1aeb9ee21` is labelled only after this push succeeds.
