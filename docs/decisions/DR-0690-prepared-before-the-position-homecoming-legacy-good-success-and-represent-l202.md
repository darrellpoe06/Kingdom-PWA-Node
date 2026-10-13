# DR-0690 — L202: Prepared Before the Position — Homecoming, Legacy, Good Success, and Represent

- **Status:** accepted
- **Tier:** B
- **Type:** word
- **Date:** 2026-09-30
- **Scope:** `app/src/lib/living-lessons-class.js` (new lesson `ll202-prepared-before-the-position-homecoming-legacy-good-success-and-represent`); `app/src/lib/living-lessons-dates.js` (its day); `app/src/__tests__/living-lessons-l202-verses.test.js` (new, proven-to-catch).
- **Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, SPOKEN-TEACHINGS-ARE-BUILD-INPUT, DR-NUMBER-ALLOCATION, DECISION-RECORDS (and, by record: teach the Word, do not debate it, DR-0098; speak established fact, DR-0100; render his words for meaning, DR-0331)
- **Grounds:** CLAUDE.md, Spoken Teachings Are Build Input (2026-07-03); DR-0331; DR-0098; DR-0100; DR-0076; DR-0210 (Yahweh in our voice, quoted KJV untouched); DR-0677 (counts are derived); DR-0689 and DR-0684 (the model lessons).

## Context

On 2026-09-30 Darrell recorded a Bible study class on his phone and sent it into Thinking Space. It saved as `public.agent_inbox` row `d2f21ba3-ab40-496d-ae62-e4a3e2ff8298` (created 19:02:42 UTC from his own phone account; source `thinking-space`; tags `lesson`, `voice`, `voice-transcribed`, `lesson-name-ok`, `lesson-name:Bishop Gwin`). The NAS transcribed it with Whisper (small) on the CPU rung into row `aed9557b-333e-4152-adbc-de0f9e695793` (created 19:31:23 UTC; tags `lesson`, `voice-transcript`, `of:d2f21ba3-…`, `whisper:nas-cpu`, `lesson-name-ok`, `lesson-name:Bishop Gwin`, `mirrored`; 16,511 characters). The words were read through `inbox-lesson-body.yml` run 36770368206 (the dotted base64, stripped and decoded; the decoded length matched the row's 16,511 characters) and read in full. His own account sent it, so no approval gate applies.

**What the recording is.** A class, not a monologue: a teacher preaching a homecoming message in homecoming week at the University of Illinois, with members of the class answering and testifying between the points. The teacher's own numbering survives in the transcript: the end of an earlier point on failure, "number three, homecoming is about legacy," a long Joshua section under legacy, "number four, God defines success," and "last point: represent." The first points are not in the recording; it begins at "He's preparing you for the one that is coming."

**How the name appears.** It does not. The transcript never says Gwin or any name for the teacher; the attribution is the `lesson-name:Bishop Gwin` tag Darrell chose. The spelling is not a guess: the repo already carries the church's own spelling, "Bishop Lloyd E. Gwin," in the Wednesday Bible Study titles of `app/src/lib/corpus-manifest.json`, and "Bishop Gwin" in `access-requests.js` and `surface-access.js`. What stays uncertain, and is said in the lesson: Whisper does not mark speakers, so which lines are the teacher's and which are the class's is read from the flow (the numbered points and the Scripture reading are the teacher's; the testimonies are the class's). Named class members (an elder, an evangelist, a woman and a student named in passing) are left unnamed in the lesson because the transcript does not say who spoke and the names are private people. One member's lines (he works in technology and is building a learning app for his son; "not just in the third dimension, in the fourth dimension") match Darrell's own voice and work; the lesson does not name him either, since the transcript does not.

**Mishearings, read by the verse (DR-0331).** "S and S 17, 9" is Exodus 17:9; "after this 32, looking for 17" is Exodus 32:17; "Luke 646" is Luke 6:46; "Matthew chapter 5 verse 6" is Matthew 5:16 (the text read is verse 16); "Joshua's son of God" is Joshua the son of Nun; "cross the joint" is the Jordan; "he's 80 ... that kind of 80" is angry; "more than Congress" is conquerors; "counted as shoe for the smaller" is sheep for the slaughter; "personalities" is principalities; "once and I lie nine always" is most likely "once an Illini, always an Illini," and the lesson says "as best the recording can be read." The teacher read a modern translation; every quotation in the lesson is the KJV from `app/public/bible/kjv`.

**One teaching, one lesson.** `app/src/lib` and `docs/decisions` were searched for both row ids and for these words: no lesson carries them. "Gwin" appears only in church and access code and in the corpus manifest. No Living Lesson quotes Psalms 145:4 or Exodus 33:11; Numbers 27:18 appears only in the Torah surveys (L132, L133). The renewed-mind design is linked to L105, Doing the Word Rewires You, not repeated.

**Placement.** Devotional, so Living Lessons: **L202**, the next after L201 (`origin/main` at 1015f14e ended at L201; the count of 201 modules is derived, DR-0677). DR-0690 was the INDEX Next ID.

## What was measured

- Every quoted span was checked by the repo's `scanQuotedVerses` against `app/public/bible/kjv`: **230 quoted spans, 230 verbatim, 0 faults**; every double-quoted span carries its reference, so no man is quoted as if he were Scripture.
- **The Word the teacher built on, pinned:** Exodus 17:9 is the first verse of the Word that names Joshua (derived in the test by scanning Genesis and Exodus); Numbers 27:19 "give him a charge in their sight"; Numbers 27:20 "that all the congregation of the children of Israel may be obedient"; Deuteronomy 31:2 "an hundred and twenty years old"; Deuteronomy 34:9 "for Moses had laid his hands upon him"; Exodus 24:13 "his minister Joshua"; Joshua 1:8 "then thou shalt have good success"; Psalms 145:4; Hebrews 13:5.
- **Outside facts, tiered per DR-0100:**

| claim | tier | basis |
|---|---|---|
| The adult brain keeps changing with practice (neuroplasticity); repeated study reshapes its connections at any age | established, stated as fact | decades of neuroscience overturning the older fixed-adult-brain view |
| AI tools make mistakes and must be checked | established, stated as fact | the tools' own disclosures; the class's rule, grounded in 1 Thessalonians 5:21 |
| University orientations warn that many entering students will not graduate | stated as what was said in the room, no rate claimed | the class member's account; no figure is put in the lesson |
| "Once an Illini, always an Illini" as the homecoming saying | flagged narrowly | read from a misheard line; the lesson says "as best the recording can be read" |

- **Where the Word is the authority, it is taught, not debated (DR-0098):** the teacher's "once a Christian, always a Christian" is taught through Romans 8:35-39 and John 10:28 as written; no schools are staged.
- Bands, measured by the repo's gates on the lesson in place: full-levels shares child 0.58, youth 0.69, teen 0.68, senior 0.80 (adult 1,869 prose words); reading grade child 1.5, youth 3.8, teen 6.2, senior 6.6 (ascending; child under the 5.0 ceiling); worst band overlap 0.06 (ceiling 0.5); every band names its lesson in its opening.

## Impact

Without this lesson, a class Darrell carried home on his phone sits as 16,511 characters of machine-heard text with the Scripture references garbled. With it, the teaching is in the app where the family and the church can study it: the teacher's own points in his own order, the Joshua passages he walked read from the KJV, the class's testimonies kept for their meaning without exposing anyone, and the one outside fact the room raised (the brain changes) stated plainly under the Word. It also records a first: a recorded Bible study, not only Darrell's own dictation, going through the NAS transcription lane into a lesson, with the attribution taken from the name he chose.

## Decision

L202, **Prepared Before the Position — Homecoming, Legacy, Good Success, and Represent**, joins Living Lessons with nine Word-first movements and a close, four authored bands, an eight-question quiz, ten facilitator talking points and ten benefits:

1. **If you are still here, He is still writing your story.** Proverbs 24:16; Micah 7:8; Philippians 1:6; Philippians 4:8.
2. **Homecoming is about legacy** (the teacher's third point). Psalms 145:4; John 4:38; Hebrews 12:1.
3. **What will we leave?** Proverbs 13:22; Psalms 78:4, 6; 2 Timothy 2:2; 1 Thessalonians 5:21.
4. **Joshua was leading before he was leading.** Exodus 17:9-10, 13; Exodus 24:12-13; Exodus 33:11; Exodus 32:17-20.
5. **The hand laid on in public.** Numbers 27:18-20; Deuteronomy 31:2-3, 7-8; Deuteronomy 34:9.
6. **Yahweh defines success** (the fourth point). Joshua 1:7-8; Psalms 1:2-3; Romans 3:4; Hebrews 13:8.
7. **Stay in the Word: the renewed mind.** Romans 12:2; Deuteronomy 6:6-7; Proverbs 4:18; Acts 17:11; beside L105.
8. **Represent** (the last point). Luke 6:46; James 1:22; Matthew 5:16; Acts 4:13; 2 Corinthians 5:17, 20.
9. **Who shall separate us?** Romans 8:35, 37-39; John 10:28.

And the close: Hebrews 13:5. Our voice says Yahweh; quoted KJV is untouched; Jesus is confessed as the Lamb of Yahweh and the Eternal Son of Yahweh. Counts are derived (DR-0677): no count line was edited.

## Verification

- `living-lessons-l202-verses.test.js`, 20 tests green: fields, number 202 after L201, date, one lesson, the L105 link; the provenance pins (the recording, Bishop Gwin, the nas-cpu rung, begins partway, the name never in the transcript, the church's spelling in `corpus-manifest.json`, the class members unnamed); every span verbatim on every surface; every quotation carries its reference; straight quotes, no elision, no record id; Exodus 17:9 derived as Joshua's first mention; the handoff verses pinned to the KJV; the mishearings absent outside the one sentence that names them; nine movements in order; the teacher's numbering kept; neuroplasticity stated as fact without a hedge; Yahweh-in-our-voice and lowercase-adversary checks; all four band gates.
- **Proven to catch**, in the suite: a planted generic name, "good success" misquoted as "great success", Numbers 27:19 re-pointed to 27:18, a dropped movement, and a named class member each fire. Separately, in `living-lessons-class.js` itself, "good success" was changed to "great success" in Joshua 1:8 and a generic name was planted in movement six: 3 tests failed (the verbatim scan, the voice check, the in-suite catch); restoring the file turned all 20 green.
- **CI caught one thing the local groups did not run:** the plain-meaning gate (`the-plain-meaning-comes-first.test.js`, DR-0521) failed the first push because "neuroplasticity" came before its plain meaning in the lesson, youth, teen and senior texts. Each sentence now gives the meaning first (the brain changes with use; the brain rewires itself), and the gate passes with no new debt.
- Gate groups green: band differentiation, course band coverage, course bands reach the reader, course quotation integrity, quotation integrity, quoted-verse-is-the-verse, reading level, title in narrative, full levels (174 tests); curriculum diversity, curriculum gates, curriculum round trip, every stage reaches the reader, learn crosslist, lesson store, id collision, living lessons order, TLC curriculum, the lesson count is derived, learn sort every option (131 tests); the series-level living-lessons suites (60 tests); L195 to L201 (177 tests).
