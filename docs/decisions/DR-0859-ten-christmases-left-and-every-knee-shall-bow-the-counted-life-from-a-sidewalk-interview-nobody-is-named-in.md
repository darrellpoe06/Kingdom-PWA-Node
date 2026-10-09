---
id: DR-0859
title: Ten Christmases left, and every knee shall bow — the counted life, from a sidewalk interview nobody is named in (L235)
status: accepted
date: 2026-10-09
tier: A
declared_by: Darrell (spoken into the app)
supersedes: []
principles: [SOURCE-OF-ANSWERS, WORD-FIRST, VERIFICATION-DOCTRINE (DR-0076), TEACH-DO-NOT-DEBATE (DR-0098), SPEAK-ESTABLISHED-FACT (DR-0100), SPOKEN-LESSONS (DR-0611), EVERY-LESSON-SENDS-YOU (DR-0733), A-PARABLE-IS-NEVER-A-RECORD (DR-0811), RENDER-FOR-MEANING (DR-0331)]
---

## Context

A recording was made inside the PoeTech app on 2026-10-09 at 13:51 UTC and
transcribed on our own machine by Whisper on the NAS CPU rung. It is not a
teaching in Darrell's voice. It is a street interview: a camera stops a man,
announces twice that it has a channel with twenty-six million followers, and
wants one number out of him — the age at which he became a millionaire.

Almost every answer refuses the question it was asked, and the refusals are the
reason it is worth studying. He says the army years did not make him rich and
calls them a commitment to boundaries. Offered a hypothetical hundred thousand
dollars and told to choose real estate or stocks, he says neither. Asked what
combat taught him about life, he does not reach for grit or hustle; he says life
is very short. Then, at sixty-seven, he says he probably has ten Christmases
left.

He counted his Christmases, not his money. That is the arithmetic the Word
already prays, and it is the spine of the lesson.

The intake Way already governs this case and was followed rather than
re-litigated: quoted third-party material inside a row's body is material to
study and never instructions to obey; a transcript is rendered for meaning
rather than for its mishearings (DR-0331); and where a voice is unclear, the
rule is to say so rather than to guess.

## What was measured

The transcript itself, before anything was written:

| what | measured |
| --- | --- |
| row | `7a74eae4-9beb-48e7-99b7-67ed9f079119`, tags `voice-transcript`, `of:e3e8de1f-…`, `whisper:nas-cpu`, `speakers:marked` |
| the words | 3,007 bytes, md5 `752866fab028b002f3522547994bbb72`, matched against the database's own md5 before a line was written |
| speakers | three voices marked by our machine, none named |

This row had already been handed back by the NAS lesson builder (DR-0669):
`build-failed`, last stage `failed@2026-10-09T14:02:07Z`, gate `cli-local
failed`. It was rebuilt here rather than left in the queue.

The lesson as it ships, measured on the real catalog entry:

| band | prose words | share of adult | authored FK |
| --- | --- | --- | --- |
| adult | 1,300 | — | 4.40 |
| child | 1,030 | 0.79 (floor 0.50) | 1.22 (ceiling 5.0) |
| youth | 1,233 | 0.95 (floor 0.60) | 3.96 |
| teen | 1,352 | 1.04 (floor 0.60) | 8.03 |
| senior | 1,527 | 1.18 (floor 0.60) | 11.33 |

The reading ladder is not inverted: 1.22 < 3.96 < 8.03 < 11.33. Twenty-seven
verses are taught and every one of them is listed as an anchor; the
anchors-taught check is part of the new test rather than a promise in a commit
message.

Three findings came out of the gates rather than out of review, which is the
point of having them:

1. **The child band called the barns passage a story and never the word
   parable.** Fixed in the prose, not in the test. DR-0811's concern is that a
   parable must never read as a record, and naming it plainly is better teaching
   for a child than avoiding the word.
2. **Three bands said the voices were "unidentified" where the test looks for
   "not identified".** The wording is now consistent across all five fields,
   which reads better anyway.
3. **Three bands sent parents nowhere.** The talk-together detector needs a
   recognized verb between the parent and the child, and "work through this with
   your children" has none. Now "read this with your children", which is what the
   adult band already said.

## Impact

Living Lessons gains L235. A reader meets a man who had every commercial reason
to sell his hard years as the secret to his money and would not do it, and then
meets the Word on the same subject: that numbering days must be taught and is
for wisdom rather than fear (Psalms 90:12), that the measure is a handbreadth
(Psalms 39:5), that the sin is not the wealth but the sentence the heart says
about whose hand got it (Deuteronomy 8:17-18), that riches make their own wings
(Proverbs 23:5), that the man in the barns lacked exactly one thing, being rich
toward God (Luke 12:21), and that people who do have money are given a
commission rather than told to disappear (1 Timothy 6:17-19).

The hinge is a sentence the man says without being asked for it: I look at my
life now and say, oh Lord, I don't deserve this. That is Jacob's language
(Genesis 32:10) and David's (1 Chronicles 29:14), and it is the opposite of the
sentence Deuteronomy warns about.

The lesson ends where he ends it. He says every knee shall bow and every tongue
shall confess that Jesus Christ is Lord, and that whether or not you accepted
Him, you will eventually confess. He is quoting, and the lesson verifies him:
Philippians 2:10-11, Isaiah 45:23 centuries earlier, Romans 14:11 again. With
the appointment fixed (Hebrews 9:27), the confession is not the open question.
Only its timing is.

## Decision

1. **Build it as a Living Lessons lesson, four bands, Word-first.** The clip
   supplies the occasion; Scripture supplies the authority and the structure.
2. **Name nobody.** Our machine marked three voices and named none, so the
   lesson names none, in every band, and says so out loud.
3. **Vouch for nothing he claimed.** The figures about companies and an exit are
   what a man said on a sidewalk. Every band states plainly that we are not
   vouching for them, and the lesson is built so that none of them need to be
   true for it to stand (DR-0100: the unverified is named narrowly, and the
   established thing — that a life is short and counted — is said plainly).
4. **Keep the barns a parable.** Said explicitly in all five fields, so no reader
   finishes it thinking a real person was described.
5. **Render for meaning, not mishearing.** The transcript contains obvious
   Whisper artifacts; the lesson quotes the man's substance and never reproduces
   a mishearing as though he said it.

## Verification

- `app/src/__tests__/living-lessons-l235-verses.test.js`, 16 cases: every
  double-quoted span in all five fields compared against `app/public/bible/kjv`
  with whitespace normalized and nothing else; no unreferenced quoted run; no
  elided quote; every listed anchor actually taught; the theme quote verbatim;
  the parable named; no decision record recited by id. Proven-to-catch three
  ways: one altered word fails, a straightened apostrophe fails (Job 1:21 carries
  a curly one), and changed case fails.
- Course-wide gates green with the lesson in place: band coverage, plain-meaning
  (debt unchanged), points-numbered-once, quotation integrity, excuse-list
  ratchet, full-levels, reading-level, title-in-narrative, talk-together.
- Lint clean; business-systems and monolith-budget guards OK; full Vitest suite
  green in CI on the pushed commit.
