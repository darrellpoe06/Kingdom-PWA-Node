# DR-0431 — Little Learners: reading and counting from the Word for the littlest, read aloud, redoable, no grown-up needed; and Ari in child mode

- **Status:** accepted
- **Tier:** B (family-facing teaching content for children; Ari's posture change for a child audience is the one bright line, and it is pinned)
- **Date:** 2026-09-15
- **Type:** product
- **Scope:** `app/src/lib/little-learners-class.js` (new course: six lessons, meta with a Word-first frame, session flow, helpers, child-mode tutor meta), `app/src/lib/learn-catalog.js` (the `little-learners` entry, self-paced, with the Word courses), `app/src/components/ChurchLearn.jsx` (`QuizBlock` exported; `readOptionsAloud` — the options leave the reader's mute and carry a speaker each), tests `little-learners-course.test.js` and `the-check-reads-its-choices-to-a-little-learner.test.jsx`
- **Principles:** WORD-FIRST (DR-0127), SPOKEN-TEACHINGS-ARE-BUILD-INPUT (CLAUDE.md), THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), VERIFICATION-DOCTRINE (DR-0076), TEACH-THE-WORD-DO-NOT-DEBATE-IT (DR-0098)
- **Grounds:** Deuteronomy 6:7; 2 Timothy 3:15; Proverbs 22:6; L156 (qualitative and quantitative analysis) as the adult statement of the same aim; the reader (DR-0264/0265) and the resume place (DR-0418) already in Learn

## The word, as spoken

Darrell, 2026-09-15: a Khan-Academy-type curriculum for the littlest learners inside Learn — arithmetic, reading, ABC/123, qualitative and quantitative analysis — read to them, tests they can redo any time, no adult needed; *"the Lord is to be praised; we want to make sure everybody's competent and that's the most important piece."* Then: *"To me, the reading is the Word... I want the Word to literally be what they're reading while they learn to read. And then simultaneously math that has the Word, totally Word based... the math of the Bible... all of the different sciences through the lens of Yahweh... qualitative and quantitative ways of math, like engineering."* And: *"And Ari for our children?"*

## Reality-trace (DR-0061)

- **Real data:** a new course module file in the same shape every Living Lesson uses (id, title, bigIdea, anchor, lesson, inApp, benefits, quiz, facilitator), registered in `LEARN_CATALOG`, so it rides the existing Learn tab, the reader, the resume place, the progress summary and the export with no new surface.
- **End to end:** the reader already reads a lesson aloud hands-free and highlights it; the quiz already has "Check again"; the tutor already takes a per-course meta. The three real gaps were: options a non-reader cannot hear, a tutor posture for a child, and the content itself.
- **Observed:** the Living Lessons surface on the phone, this session (Darrell's screenshots) — the same surface serves this course.

## The decision

1. **Slice 1 is six lessons, every one Word-based:** A/B/C from Adam, daily bread and cattle (Genesis 2:19; Matthew 6:11; Genesis 1:24); counting 1–7 on the days of creation with "two great lights" (Genesis 1:5–2:2); big and small with a cubit, Zacchaeus and the mustard seed (1 Samuel 17:4; Luke 19:3-4; Matthew 13:32); sort by kind and count by twos into the ark (Genesis 1:25; 6:19; 7:9; Proverbs 30:25, 28); six first words found inside their verses (Genesis 1:4-5; Psalms 100:3; 1 John 4:8); how many — five loaves, two fishes, twelve baskets, ninety-nine and one, the hairs numbered (John 6:9, 13; Luke 15:4; Matthew 10:30). Every quoted span is verbatim from the hosted KJV with its reference beside it; every lesson measures Flesch-Kincaid ≤ 1.0 in our own prose; every check has a hands-on and a redoable game.
2. **The check reads its choices.** The 2026-09-14 rule mutes an adult quiz's options from the reader because its decoys are wrong teachings. A pre-K learner cannot read, and this course's decoys are letters, numbers and animals, never a false teaching; so a module opts in with `readOptionsAloud`, its options leave the mute, and each carries a 🔊 that says just that option. The adult default is unchanged and pinned.
3. **Ari, in child mode.** The same Ari and engine, with a posture the gate pins: answer only from the lesson and the verses in it; never a link, address, number or place; very short sentences; never ask the child's name, home or family; never frighten or scold; the check is a game to redo; Yahweh for the Father, Jesus for the Son; anything else goes to a grown-up. This is a prompt posture, not a network gate: the tutor still runs on the church's own model, and the family instance's existing gates stand.
4. **No grown-up needed, a grown-up welcome.** Every `howToRun` opens with the sentence "No grown-up is needed" and then says what a grown-up beside the child can add.

## What is NOT in slice 1, with a date

- Letters D–Z, numbers 8–20, first sentences, and the sciences through His lens (Darrell's fuller list). **re-review: 2026-09-22** — slice 2 is the next six lessons on the same generator; the pace is set by this slice's use.
- A parent report beyond the course's progress summary. **re-review: 2026-09-29** — if a parent asks for more than "which lessons passed," add a per-child record.
- A separate age band below "child" in `learn-framework`. The lesson text IS the child text and resolves for every band; a "little" band is a framework change tracked here for when the corpus needs it.

## Proof

- The gate: six lessons; meta counts them; the catalog carries the course with `wordFirst`; each lesson FK ≤ 2.0, hook and hands-on present, `readOptionsAloud`, ≥ 3 questions with valid answers and short spoken options; every span verbatim (proven-to-catch); every anchor labelled; our voice names Yahweh and never capitalizes the adversary; the child-mode posture carries its rules.
- `QuizBlock`: an adult module's options stay muted; a `readOptionsAloud` module's options are unmuted with a speaker each, and the speaker speaks that option.
- The Word-first coverage gate and the catalog render gate pass with the new course.

## Re-review

- **re-review: 2026-09-22** — slice 2 (above), and Darrell's own read of slice 1 with a child in the house.
