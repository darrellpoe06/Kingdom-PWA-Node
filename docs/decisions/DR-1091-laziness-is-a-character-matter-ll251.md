# DR-1091: Laziness is a character matter — the four domains, the five marks of the sluggard, and work is worship (ll251)

**Date:** 2026-10-17
**Status:** accepted
**Tier:** A (additive curriculum: one new Living Lessons module, dated, with its own pinned gate; no data, no money, no new door)
**Type:** curriculum
**Area:**
- `app/src/lib/living-lessons-class.js` (`ll251-laziness-is-a-character-matter-the-four-domains-and-the-five-marks-of-the-sluggard`, appended after ll250)
- `app/src/lib/living-lessons-dates.js` (ll251's line, 2026-10-17)
- `app/src/__tests__/living-lessons-ll251-laziness.test.js` (its gate, new)
- `app/src/__tests__/living-lessons-order.test.jsx` (the newest-lesson day moves 2026-10-16 → 2026-10-17)
- `docs/99-session-notes/2026-10-17-ll251-laziness.md`

**Amends:** nothing.

**Grounds:** Two inputs, and the record keeps them apart on purpose.

1. **A third-party video summary, named as such.** Darrell forwarded this house a summary of a video on laziness by **Jonny Ardavanis and Hank Bowen**. It is not a teaching spoken into this house, it is not a message from Bishop Gwin, and **no teacher of ours is identified in it** (DR-0712 / DR-0719: name the teacher from the evidence, never assume one). Their points are credited to them by name on every surface and then tested against the Word.
2. **Darrell's own three words, spoken into the build 2026-10-17: "Work is worship..."** That is his framing, not the video's, and it is the deepest ground the lesson has. It is given its own movement, placed after the image-of-Yahweh ground and before the four domains, and it reframes the close.

**Principles:** WORD-FIRST, SPOKEN-TEACHINGS-ARE-BUILD-INPUT, VERIFICATION-DOCTRINE (DR-0076, including §3 proven-to-catch), TEACH-DONT-DEBATE (DR-0098), DR-0100 (state the established plainly), DR-0210 (Yahweh in our voice; every quotation untouched), DR-0418 / P60 (four bands at their floors), DR-0733 + DR-0795 (TALK ABOUT IT TOGETHER in the lesson AND every band), DR-0734 (`anchor.ref` names every verse), DR-0381 (not hollow), DR-0621 (hold the hand of the process), the Religion AND Relationship test in CLAUDE.md.

---

## Context

The video's spine is sound and is carried here: laziness is a **character and spiritual** matter rather than merely low productivity; we bear the image of a working Yahweh, so slothfulness reflects poorly on Him; work is an opportunity to love and serve the neighbour, so slothfulness fails the second great commandment; it shows up in **four domains** (physical, mental, spiritual, vocational) and a person disciplined in one is routinely slothful in another; Proverbs gives **five marks of the sluggard** (excuses — the lion in the road; craving comfort; failure to finish; self-deception, wiser in his own eyes; needing prodding, no internal initiative); the consequences cascade onto everyone who depends on him; and the remedy is repentance, heeding the warnings, studying the diligent, godly counsel, refusing tomorrow, taking inventory today, and the power of the Holy Spirit.

**Darrell's sentence goes under all of it.** If work is worship, slothfulness is not merely unproductive and not only a failure to love the neighbour — it is **worship withheld**. The hinge is Romans 12:11, where the opposite of *slothful* is not *busy* but **serving the Lord**: "Not slothful in business; fervent in spirit; serving the Lord". The movement is built on that verse and widened with Colossians 3:17 and 3:23-24, 1 Corinthians 10:31, Romans 12:1 (the body offered in daily living is called *service* — the English text, with no Greek or Hebrew word study claimed, DR-0076), Ephesians 6:6-7 (the counterfeit has a name, **eyeservice**), Exodus 20:8-11 (labour and worship-rest are one commandment, grounded in His own six days and His rest — stronger than any outside argument that work is sacred), and Psalms 90:17.

**Two corrections / guards the lesson is required to carry, and does, in all five places:**

- **The speakers' absolute is theirs, not the Word's.** They call laziness and godliness antonyms and infer "a mature Christian cannot be lazy." The Word moves the other way, and more kindly: it **commands** believers "That ye be not slothful" (Hebrews 6:12) and "Not slothful in business" (Romans 12:11). *A command addressed to believers presupposes they can fall into it — that is precisely why it is commanded.* So the lesson names slothfulness as real sin **and** says that a believer who finds it in himself is called to repentance, not having his salvation or maturity put in question. The antonym framing is attributed; the Word's framing is taught. **Not staged as two views** (DR-0098) — the text taught, with one sentence plainly named as the speakers'.
- **"Work is worship" is guarded twice.** (a) *Work is worship, and worship is never a purchase* — Ephesians 2:8-9 and Titus 3:5; the offering is a response to a finished act, never an instalment toward it. (b) *The measure is faithfulness with what is actually in your hand, not output* — Ecclesiastes 9:10; the sick, the disabled, the one out of work, the very old and the very young are not shut out of worship. A lesson on laziness that wounds the genuinely unable has failed the Relationship half of CLAUDE.md's own test.

Work-before-the-fall (Genesis 2:15) and the sweat-after (Genesis 3:19) are kept distinct and the gate asserts the order, because a reader who thinks work itself is the curse mishears the whole lesson.

## What was measured

Measured on the tree before commit, not estimated:

- **Adult prose 1,857 words** (quotations removed, the register `full-levels.mjs` scores). Bands **child 1,165 (0.63) / youth 1,524 (0.82) / teen 1,631 (0.88) / senior 2,032 (1.09)** against floors 0.50 / 0.60 / 0.60 / 0.60. `shortBands` → `[]`.
- **Reading ladder 1.14 / 3.63 / 6.98 / 10.11**, strictly rising, each rung more than a grade above the one below; the child band sits under `NEW_LESSON_CHILD_CEILING` (5.0), the ceiling a lesson written after 2026-09-15 is held to. `isInverted` → false.
- **Band differentiation worst pair 0.17** (ceiling 0.50): child~youth 0.07, youth~teen 0.08, teen~senior 0.17, child~senior 0.04.
- **386 quoted spans across every surface, 386 verbatim** against this repository's own King James corpus (`app/public/bible/kjv`), **0 faults**; 0 elisions, 0 recited record ids, 0 straight apostrophes inside a quotation, and 0 double-quoted spans anywhere in the module that are not found in the corpus.
- **Our voice names Him by covenant name in every place and never uses the generic** (`ourProseOnly` → `Yahweh` present, `God` absent, 0 hits in all five places), while every `God` / `the LORD` inside a quotation is left exactly as the corpus carries it (DR-0210's bright line).
- **TALK ABOUT IT TOGETHER:** `placesMissingDirections` → `[]`, so the lesson and each of the four bands send the reader all three ways in the lesson's own words.
- **`anchor.ref` names 56 references**, every verse the lesson stands on, so Search it out derives its links from the anchor rather than a typed list (DR-0734).
- **Twelve movements, ONE. through TWELVE., present once each and in the same order in all five places** (lesson + child + youth + teen + senior), asserted by index.

## Impact

Living Lessons gains L251, 248 modules in the catalog, the highest-numbered lesson and the newest day (2026-10-17). A reader who opens one band — the only thing a reader actually does — gets the whole message in that band's register: the provenance said plainly, Darrell's three words attributed and dated, both guards, the correction of the speakers' absolute, all four domains, all five marks on their own Proverbs texts, what it costs others, the field of the slothful, the ant, and the three directions out to a person. The `/n8n`-era pattern is untouched; nothing outside the curriculum moved.

## Decision

- Ship `ll251-…` appended after ll250, dated 2026-10-17 in `living-lessons-dates.js` (the day it was built; the forwarded summary and Darrell's three words both arrived the same day).
- **Twelve movements**, the same order in all five places: the image of a working Yahweh · **work is worship** (Darrell's, with both guards) · work as neighbour-love · what the speakers said and what the Word says · the four domains · the five marks, one movement each · what it costs and what it costs others · the remedy and the practice.
- **DR-1091 is this record's number.** DR-1090 and DR-1092 belong to other lanes in flight and are not taken here; `scripts/resolve-ledger-conflicts.mjs` was run from the worktree root after the INDEX row landed and reported the ledger whole.
- The newest-lesson day pinned in `living-lessons-order.test.jsx` moves from 2026-10-16 to 2026-10-17. That line is a live pin by design — it is how a new lesson proves it joined in order — and moving it is the only edit this record makes to an existing test.

## Verification

`living-lessons-ll251-laziness.test.js`, **198 of 198 green**: the module exists exactly once at number 251 and is the highest; the schema fields are all present; the provenance is asserted per place (Ardavanis and Bowen named, a video, not Bishop Gwin, no teacher of ours identified); "work is worship" is attributed to Darrell and dated the seventeenth of October in all five places, with "worship withheld" said plainly and Romans 12:11 quoted under it; **both guards asserted per place**; the Genesis 2:15 → 3:19 order asserted; no Greek or Hebrew word study claimed for *service*; the speakers' absolute asserted to be **attributed inside the sentence that carries it** and explicitly disclaimed as the Word's, with Hebrews 6:12 and the call to repentance beside it in every place; the four domains, the five marks on their own references, and the twelve movements in order, in all five places; the 74 pinned strands each verbatim in the verse they cite and present in the lesson; **every one of the 386 referenced spans verbatim**, no elision, no recited record, no straight apostrophe; `God` / `the LORD` left as the verses carry them; Yahweh in our voice with the generic absent; `anchor.ref` naming every strand's book and chapter plus Deuteronomy 6:7; the three TALK directions, the rhythm and the skill per place; the band floors, the title near each band's start, the differentiation ceiling and the rising ladder; and the measured numbers in the file's own header asserted against what the corpus reports, so a stale claim fails the build.

**Proven to catch (DR-0076 §3), four mutations, each run, each restored and each restoration verified byte-identical with `cmp`:**

1. **A quoted verse altered by one word** — `serving the Lord` → `serving the Father` inside the Romans 12:11 quotation in the adult lesson. **1 failed / 197 passed:** the verbatim sweep ("every referenced span is verbatim in the verse it cites") named the span and its path.
2. **ONE band's friend line stripped alone** — the teen band's `Share with a friend the unfinished item you are completing today…` sentence removed. **4 failed / 194 passed:** the catalog measure returned `[{ place: 'teen', … }]` and only teen, the per-band friend check named teen, the in-file proven-to-catch block itself went red because its own anchor was already gone, and the share pin caught the teen band dropping 0.88 → 0.87. The pooled lesson check stayed green, which is the DR-0795 defect reproduced exactly.
3. **One of the five marks dropped from one band** — the fourth mark's Proverbs 26:16 reference removed from the youth band. **1 failed / 197 passed:** `youth drops the mark of self-deception ((Proverbs 26:16))`.
4. **The works-righteousness guard deleted from one place** — the senior band's `work is worship, and worship is never a purchase` sentence removed. **2 failed / 196 passed:** `senior drops the works-righteousness guard`, plus the share pin catching 1.09 → 1.08.

Each mutation's anchor text was asserted **present exactly once** before the edit (the mutator refuses and changes nothing otherwise), so a mutation that did not mutate could not be mistaken for a pass. After each restore the suite returned to 198 of 198.

Also green in this tree: `living-lessons-numbers-are-unique.test.js` and `living-lessons-order.test.jsx` (26 of 26); `npm run lint` exits 0.

## What this does not do

- It does not adopt the video as a source of authority. Ardavanis and Bowen are credited and tested; nothing in the lesson rests on their standing, and no teacher of ours is claimed for it.
- It does not assert a Greek or Hebrew word study for *service* in Romans 12:1. The English text carries the point and no lexical claim is made, because none could be verified from a source on disk (DR-0076 §8).
- It does not regenerate `lesson-dates.json` or the course-band baseline; those are generated files and the integrating lane regenerates them once.
- It does not touch any other lesson's content, any workflow, `infra/**`, the feature registry, or DR-1090 / DR-1092.
- It does not settle how a lesson should treat a third-party video summary in general. This one names the source, credits it and tests it; whether that convention should be written into the builder brief is open. **re-review: 2026-10-24** — read L251 in the live app on a phone, in the child and senior bands, and check that the two guards land as mercy rather than as a disclaimer.
