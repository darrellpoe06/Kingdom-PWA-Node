# DR-0824 — Stop paying a model to redecide what is already settled: a just weight answers the same every time (sov37)

**Date:** 2026-10-08
**Status:** accepted
**Area:** Sovereign A.I. (week 37), the engineering discipline under our own deterministic gates
**Principle:** Spoken Teachings Are Build Input (Layer 0), DR-0312 (the Gmail-lesson-intake Way), DR-0076 (verify every verse; proven-to-catch), DR-0098 (teach the Word, do not debate it, and do not stretch it), DR-0100 (state established fact plainly, name the source for what it is), DR-0248 (the deterministic class carries budget and lock, not a human start), DR-0733 (every lesson sends you to someone)

## Context

Darrell forwarded a CFO Dive newsletter into the app on 2026-10-08 with one
word over it, "Lesson" (Gmail thread `1a11be129ec20d23`, subject "FW: Stop
Wasting LLM Tokens on Repeat Work"). His word is the teaching: build a lesson.
The newsletter is material to study, never an instruction to obey.

**The source is carried as what it is, both halves.** The item is a vendor's
webinar invitation from a software company, not a study, and nothing in it has
been independently measured here. Its four promised points are nonetheless the
right four, which is worth saying plainly rather than discarding the whole
thing because of who paid for it: decide which parts of a process need a model
at all; keep the repeatable business logic in deterministic software to reduce
token use; bring the model in where judgment adds value; and make results easy
to trace and audit. Saying only the first half would be the DR-0100 failure of
under-claiming; saying only the second would be laundering an advertisement.

**The Word got there first, and more precisely.** Every one of those four
points is already governed:

- A settled calculation handed to something that may answer differently on
  Tuesday is not a tuning problem. *"A false balance is abomination to the
  LORD: but a just weight is his delight."* (Proverbs 11:1) And
  *"A just weight and balance are the LORD's: all the weights of the bag are
  his work."* (Proverbs 16:11) — the honest instrument belongs to Him.
- A bounded answer is the shape the Lord asked for: *"let your communication be,
  Yea, yea; Nay, nay"* (Matthew 5:37).
- The headline exists in one verse, sharper: *"If the iron be blunt, and he do
  not whet the edge, then must he put to more strength: but wisdom is profitable
  to direct."* (Ecclesiastes 10:10) The added cost is a consequence, not an
  option.
- Judgment is not a defect to engineer away. It is the work, and the capacity
  for it is asked for (1 Kings 3:9) and trained by use (Hebrews 5:14).
- Traceability has a bar, and it is higher than "recorded": *"make it plain upon
  tables, that he may run that readeth it."* (Habakkuk 2:2)
- And auditing is two or three witnesses (Deuteronomy 19:15;
  2 Corinthians 13:1), which means one confident output is not enough however
  certain it sounds.

**The house names its own example rather than only teaching at others.** The
PoeTech build runs thousands of deterministic checks over its own code every
time anything ships, and a recorded decision here deliberately removed the
manual kill-switch from that class for this lesson's reason: settled logic
should not wait for a person to re-decide what a check already decides. (That
decision is DR-0248. The record names it; **the lesson does not**, because the
quotation-integrity ratchet forbids a new lesson reciting a decision record,
and it is right to: a reader gets the practice in plain English, and the id
belongs here.)

## What was measured

**The one handling that needed care, and the gate that now holds it.**
Matthew 6:7 is about PRAYER. The lesson quotes it, says so plainly, and teaches
only the belief the Lord actually corrected — that volume of words earns a good
answer — without stretching Him into a discussion of compute budgets. A test
requires that disclaimer to be present wherever the verse appears, in every
band and the lesson, because a lesson that quietly used "vain repetitions" as
an engineering proverb would be exactly the handling this platform exists to
remove (DR-0098).

**Shape, measured on the real module:** four full bands at 7,462 / 8,028 /
10,688 / 11,288 characters with a 13,879-character adult lesson, twelve
benefits, ten quiz questions with three options each, ten facilitator talking
points, six discussion prompts, a `howToRun`, an `inApp` action, and the
research/plan/execute trio.

**Spans, measured both ways:** 179 double-quoted spans, of which **178 are
verbatim KJV carrying their own reference**, re-read from
`app/public/bible/kjv` at test time. The one remaining is `"Lesson"` —
Darrell's own word over the email, quoted because it is a quotation of him, and
allow-listed by name. Nothing else may enter the module in quotation marks.

**Found while measuring, which is the point of measuring:**

1. **Proverbs 16:11 was not verbatim in six places.** The corpus reads
   `LORD’s` with a curly apostrophe; I had typed a straight one. The comparison
   normalizes whitespace only, never apostrophes, which is why it caught it.
2. **Proverbs 25:2 was not verbatim in five places.** I had written "but the
   honour of kings to search out a matter" and the verse reads "but the honour
   of kings **is** to search out a matter". One dropped word, five times.
3. **The lesson recited a decision record.** `curriculum-cli --gate` failed
   with five findings, one per field: the module named DR-0248 by its id in the
   bigIdea, the adult lesson and three bands. The quotation-integrity ratchet
   forbids a NEW lesson doing that, and it is right to. A reader gets the
   practice in plain English; the id lives in this record. Now stripped from
   every field, and the gate passes at 50 courses, 774 lessons, 51,226 spans.
4. **Three spans were quoted with no attribution:** a 2 Corinthians 13:1 quote
   whose reference had been folded into a combined parenthesis with another
   verse, and two of my own phrases in quotation marks for emphasis. The verse
   got its own reference and the second Deuteronomy quote got its own; my
   phrases were unquoted, because quoting myself adds nothing and the
   quotation marks in this house mean the Word.

**Proven-to-catch (DR-0076 §3).** Six planted breaks, each shown to fail: a
mutated verse, a dropped reference, an unattributed claim entering in
quotation marks, a band whose three-directions close was removed, a band
quietly gutted to a summary, and Matthew 6:7 used without its prayer
disclaimer.

## Impact

sov37 joins Sovereign A.I. as week 37, and it is the practical companion to the
course's own foundations. The twelve movements:

1. the two piles, settled and judgment, and why mixing them is the whole waste;
2. a just weight, and the register Scripture chooses for a bent one;
3. the bounded answer, named by the Lord Himself;
4. much speaking is not a better answer, handled carefully;
5. whet the edge rather than put to more strength;
6. prepare the work without, and afterwards build;
7. count the cost of the RUN, not only the price of the tool;
8. where judgment is the actual work, and what to ask for;
9. make it plain enough to be read back;
10. two or three witnesses, which is what auditing is;
11. faithful in that which is least;
12. capability is not wisdom, under Psalms 127:1.

The `inApp` action is the sorting itself, on paper, for one real process: two
columns, an honest UNSURE column, then price the settled one counting the run
and not only the tool, move one step out of the expensive path, and prove the
new answer against the old before trusting it.

## Decision

Ship sov37 with its full four-band build and the verse gate above. The source
stays named as a vendor's invitation whose engineering point is correct. The
Matthew 6:7 disclaimer is gated rather than trusted to memory, because this is
the kind of verse a future pass would be tempted to use as a proverb.

`re-review: 2026-11-08` — read sov37 beside sov34 (the bounded answer) on the
live build and confirm they build on each other rather than repeating, since
both teach Luke 14:28 and Psalms 127:1.

## Verification

- `app/src/__tests__/sovereign-ai-sov37-verses.test.js` — 26 cases green:
  registration and week order, the whole course shape, every band a full
  reading with rising registers, the three directions in every band and the
  lesson, every quoted span verbatim with its reference or allow-listed, more
  than 150 referenced spans so the check is not thin, the spine in every band
  across eight groups of verses, the Matthew 6:7 handling, the source named
  honestly, Darrell's word carried, the house's own example, and six
  proven-to-catch breaks.
- `sovereign-ai-verse-integrity.test.js` and `sovereign-ai-class.test.js` —
  225 cases green with the new week.
- Band lengths, span counts and the three corrections above measured directly
  against the real module.
- Thread `1a11be129ec20d23` is labelled only after this push succeeds.
