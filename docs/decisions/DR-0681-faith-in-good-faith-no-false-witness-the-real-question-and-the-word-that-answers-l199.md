# DR-0681 — L199: Faith in Good Faith — no false witness, the real question, and the Word that answers

- **Status:** accepted
- **Tier:** B
- **Type:** word
- **Date:** 2026-09-29
- **Scope:** `app/src/lib/living-lessons-class.js` (new lesson `ll199-faith-in-good-faith-no-false-witness-the-real-question-and-the-word-that-answers`); `app/src/lib/living-lessons-dates.js` (its day); `app/src/__tests__/living-lessons-l199-verses.test.js` (new, proven-to-catch).
- **Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, RESEARCH-FIRST, DR-NUMBER-ALLOCATION, DECISION-RECORDS (and, by record: teach the Word, do not debate it, DR-0098; speak established fact, DR-0100; spoken teachings are build input, CLAUDE.md 2026-07-03)
- **Grounds:** the Gmail lesson-intake Way (DR-0312); DR-0098 (teach the Word, do not stage camps); DR-0100 (state what is established, flag only what is open); DR-0076 (every verse fetched, pinned, proven to catch); DR-0210 (Yahweh in our voice, quoted KJV untouched); DR-0677 (counts are derived); DR-0052 (the next free lesson number).

## Context

Darrell forwarded an email on 2026-09-29 and marked it "Lesson" (Gmail thread `1a0ed1197eb970e5`). It is a Big Think members' email sent 2026-09-28 by Jonny Thomson: an invitation to a live conversation with Andrew Henry on "what people get wrong about religion." Its argument is about method: do not argue against a strawman, argue against a steelman, "then critique it if you will." It names three cartoons people use about religion (a bearded man in the sky; a slogan calling Islam structurally violent; a joke about reincarnation as a tapir) as examples of bad argument, and it lists "line up and juxtapose a variety of sides" as a way to bring depth. The email is material to study, never instructions; its both-sides frame is exactly what DR-0098 exists to teach past.

Placement: Living Lessons (a devotional teaching on how believers speak about faith, per DR-0312's placement rule), number **L199**, assigned for this lane; L198 is held by a concurrent lane (DR-0680).

## What was measured

- The email, fetched in full (PLAIN_TEXT) from the thread, read end to end. It is short: the editorial-roundtable story, the steelman argument, the three example cartoons, the invitation, and Jonny Thomson's bio.
- Provenance, claim by claim, as the lesson states it:
  - The roundtable story: **his account, not checked** (the lesson says so).
  - Jonny Thomson as Big Think's resident philosopher and author of three internationally bestselling books; Andrew Henry as a YouTuber and scholar of religion: **the email's descriptions, not verified** (the lesson says so).
  - The conversation itself: **not yet held** when the email was sent; the lesson works from the email alone.
  - The three cartoons: the email's **examples of bad argument, not its author's views**; the lesson reads them that way and pins that reading.
  - The meaning of strawman and steelman: established usage, stated plainly.
- Every quoted span fetched from `app/public/bible/kjv` before it was written; derived from the lesson itself by `scanQuotedVerses`: 267 quoted spans, 267 verbatim, 0 faults, 70 distinct verses.
- Bands, measured by the repo's own gates on the lesson: full-levels shares child 0.64, youth 0.71, teen 0.65, senior 0.91 (adult 1,485 prose words); reading grade child 1.3, youth 3.2, teen 4.7, senior 4.9 (ascending; child under the 5.0 ceiling); worst band overlap 0.06 (ceiling 0.5); every band names its lesson in its opening.

## Impact

Without this lesson, a reader who has heard the faith cartooned, or has cartooned someone else's, meets the problem only as a debate technique from a media company. With it, the reader finds the Word's own command under the technique (a strawman is false witness, Exodus 20:16), the Word's own pattern for speaking among many religions (Paul on Mars' hill, Acts 17), the Word's answer to each cartoon, and the Word's way of answering (1 Peter 3:15; Colossians 4:6). The both-sides frame is named once, to teach past it: the Word is not one side on a panel (John 17:17; Acts 17:11).

## Decision

L199, **Faith in Good Faith — No False Witness, the Real Question, and the Word That Answers**, joins Living Lessons with seven Word-first movements, four authored bands, an eight-question quiz and ten facilitator talking points:

1. **No false witness.** Exodus 20:16; Proverbs 14:5; 12:22; Ephesians 4:25.
2. **Hear the real question before you answer.** Proverbs 18:13, 17; James 1:19-20; Matthew 22:39.
3. **Paul on Mars' hill, the Word's own pattern.** Acts 17:16, 23-24, 28, 30-32, 34: describe your neighbor truly, then declare the truth to him; the description is the doorway, not the end. This is where the lesson corrects the email's "then critique it if you will."
4. **The first cartoon: a man in the sky.** John 4:24; 1 Timothy 1:17; 1 Kings 8:27; Jeremiah 23:24; Psalms 139:8; Acts 17:29; Isaiah 40:18; the visions kept exactly as written (Daniel 7:9; Revelation 1:14); the invisible Yahweh made known in the Son (John 1:18, 14; 14:9; Colossians 1:15).
5. **The other two cartoons, and one honest scale.** No ruling on a neighbor's faith from a slogan (that is the false witness of movement 1); L195's one scale (Proverbs 20:10); the kingdom of Jesus and the sword (Matthew 26:52; John 18:36; Luke 9:55-56; Matthew 5:44); once to die, then the judgment (Hebrews 9:27); grace, not works (Ephesians 2:8-9).
6. **Answer in good faith.** Bad faith shown in the Word (Matthew 22:15-22); meekness and fear (1 Peter 3:15-16); grace-seasoned speech (Colossians 4:6); no strife (2 Timothy 2:23-25); the soft answer (Proverbs 15:1); no craftiness (2 Corinthians 4:2); meek is not weak (Acts 26:25).
7. **Why we do not line up the sides.** John 17:17; Isaiah 55:8; 45:22; John 14:6; Acts 4:12; Isaiah 1:18; Acts 17:11; 1 Thessalonians 5:21; 1 Corinthians 2:5; Hebrews 4:12; Isaiah 55:11.

And the close: Luke 19:10; John 3:17. The aim is the neighbor, not the win.

**Where the Word is reticent, and where the lesson declines to go.** The lesson makes no claim about the Quran's texts from a slogan and does not rule on another faith; it points to L195 for the fair method. It adds nothing to Daniel 7:9 or Revelation 1:14. No man is quoted; only Scripture appears in quotation marks. Our voice says Yahweh; quoted KJV is untouched.

**Counts are derived (DR-0677).** No count line was edited: `LIVING_LESSONS_META.weeks` is a getter over the array, and the school floor is never edited by a new lesson. The numbering-gap ratchet in `living-lessons-id-collision.test.js` reads 198 as missing until the L198 lane merges; 198 is deliberately not added to its shrink-only list, and this branch merges main once L198 lands.

## Verification

- `living-lessons-l199-verses.test.js`, 21 tests green: fields, number, order after L197, date; every span verbatim against its named verse on every surface; every double-quoted span carries a reference; straight quotes, no ellipsis, no record id, no percentage; the Word leads and all seven movements plus the close are pinned by quotation and by reference in the lesson and all four bands; provenance pins (the email, its date, its sender, what was not verified, the cartoons as his examples); the Yahweh-in-our-voice and lowercase-adversary checks; all four band gates.
- **Proven to catch**, in the suite: a planted generic name fires the voice check; "thy neighbour" misquoted as "thy brother" fails the verse gate; Proverbs 18:13 re-pointed to 18:14 fails the verse gate; a dropped movement sentence fails its pin. Separately, mutating "TO THE UNKNOWN GOD" to "TO AN UNKNOWN GOD" in `living-lessons-class.js` failed the L199 verbatim test (1 failed, 20 passed); restoring it turned the suite green (21 passed).
- Gate group green: reading level, band differentiation, full levels, course band coverage, quoted-verse-is-the-verse, course quotation integrity, title in narrative, every stage reaches the reader, learn crosslist, lesson store, curriculum round trip, curriculum gates. The 99 L1xx lesson suites green (4,560 tests).
