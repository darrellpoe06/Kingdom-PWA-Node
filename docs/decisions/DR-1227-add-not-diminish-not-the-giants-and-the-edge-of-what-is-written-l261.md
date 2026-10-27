# DR-1227: Add not, diminish not — the giants, and the edge of what is written (ll261)

**Date:** 2026-10-26
**Status:** accepted
**Tier:** A (additive curriculum: one new Living Lessons module, dated, with its own proven-to-catch gate)
**Type:** curriculum
**Area:**
- `app/src/lib/living-lessons-class.js` (`ll261-add-not-diminish-not-the-giants-and-the-edge-of-what-is-written`, appended after ll258)
- `app/src/lib/living-lessons-dates.js` (ll261's line, with why the build day rather than an estimated send day)
- `app/src/__tests__/living-lessons-ll261-add-not-diminish-not.test.js` (its gate, 116 cases, 7 proven-to-catch)
- `app/src/lib/lesson-dates.json` (regenerated, 841 of 841 dated)

**Amends:** nothing. **Grounds:** DR-0098 (teach the Word, do not debate it — this record's own hardest requirement, and the DR whose worked example IS Genesis 6 "sons of God"), DR-0076 (every verse verbatim from the repository's own KJV; proven-to-catch gates), DR-0100 (established fact stated plainly; under-claiming is its own failure of truth), DR-0192 (the trust-but-verify pass runs BEFORE first ship on a research-sourced lesson), DR-0210 (Yahweh in our own voice; quotations untouched), DR-0097 (the Word capitalized), DR-0610 (one teaching, one lesson), DR-1206 (the witness belongs to the road), DR-0795 (all three directions in EVERY band), CLAUDE.md typographic theology (senior to the source).

## Context

Darrell sent two links **inside the PoeTech app**, hours apart, both on Genesis 6 and the giants of Canaan. They sat in the queue roughly 87 hours before this build.

- `agent_inbox` row `031a898a-b98b-484e-8d06-0962dede6316` (research item `12b9f985-c890-4ff7-a993-8743915ae972`) — a conversation between **Michael Knowles** and his guest **Tim Alberino**, arguing that the "sons of God" of Genesis 6 were a descending angelic faction, the nephilim their hybrid offspring, and a demon specifically the disembodied spirit of a dead giant, cursed to wander bodiless. The structure is drawn, by the speaker's own statement, from First Enoch and its opening section about the watchers.
- `agent_inbox` row `bee78650-c5bc-4701-9cb9-85a8faef8770` (research item `e2174686-cb1f-4898-977a-829d9ae45ba5`) — a video teaching whose **speaker the research road did not name**, who identifies himself in it as a pastor, arguing the counter-position: that Rephaim is a term of status, kingship and dread rather than stature, that Og and Goliath were fully human, and that the darkness around those nations was idolatry rather than bloodline.

What the research road actually returned, for each: a summary, and an **auto-generated YouTube caption transcript fetched on the NAS from its residential IP** (the CI path is YouTube-IP-blocked). That route carries **no timestamps**, so nothing here is cited to a minute mark, and the captions are a machine's hearing rather than either speaker's own text — which is why **no sentence is quoted from either man in the lesson**. The road's own note says the reading was never made; the transcript was the whole of it.

### Why this is ONE lesson and not two

The brief for this build named it the most consequential judgment in the intake, and it is. Two sendings arriving hours apart on the same passage, pulling opposite ways, is the exact raw material for the thing this platform exists to remove: a both-sides piece. **DR-0098 forbids it, and names Genesis 6 "sons of God" as its own worked example** — teach the passage from Scripture's own usage, through Job 1:6 and Job 38:7.

So they were built as one lesson, held to one measure, and the measure was already in the text: **"Ye shall not add unto the word which I command you, neither shall ye diminish ought from it"** (Deuteronomy 4:2). One prohibition with two directions — which are precisely the two failures that arrived. The first sending **adds** (it teaches a non-canonical book's demonology as doctrine). The second **diminishes** (it softens plain size language into borrowed status language). And our Lord names the single root of both in one sentence, spoken to men better read than either of us: **"Ye do err, not knowing the scriptures, nor the power of God"** (Matthew 22:29). Not knowing the Scriptures is how a reader adds, because a silence feels like a hole to fill. Not knowing the power is how a reader diminishes, because a plain statement starts to feel embarrassing.

The dispute is **named** — both sendings are described in the lesson's own opening, plainly — in order to educate past it by the Word. The reader is never asked to vote. It is also worth recording that the two sendings **agree** on the point most people fight over: both read the "sons of God" as heavenly beings rather than the line of Seth. Their real disagreement is about how far a claim may be carried, which is the subject of the lesson.

### What had to be got exactly right

- **Numbers 13:33.** The second sending leans hard on it: ten spies, a report the text calls evil, therefore the one verse linking the giants to Genesis 6 is a liar's word. Half of that is in the text and half is over-correction. What the Word calls an "evil report" (Numbers 13:32) and a "slander upon the land" (Numbers 14:36) is the **verdict** — "We be not able to go up against the people; for they are stronger than we" (Numbers 13:31) — and the grasshopper self-estimate. The presence of very large men is corroborated by the faithful: Caleb asked for that exact hill country (Joshua 14:12) and Moses repeated the regional saying without a tremor (Deuteronomy 9:2). So the lesson says it precisely: **the stature carries several calm witnesses; the ancestry carries one phrase inside one speech the Word itself calls evil.** A hybrid doctrine cannot stand there — and neither can a denial of giants.
- **The Enoch demonology, against ll76's own test.** `ll76-the-sky-the-speculation-and-the-test-that-works` set the house test for exactly this: do not go past where the Word will follow, and "intruding into those things which he hath not seen" (Colossians 2:18) is the named failure. First Enoch is reported in the lesson and never taught as the Word. Jude 1:14-15 honours a prophecy of Enoch; **honouring a prophecy is not a canon decision**, and doctrine rests on 2 Timothy 3:16. The claim that a demon is the spirit of a dead giant is **not in Scripture and is not taught** — while the true element inside the claim, the appointed time the spirits themselves name (Matthew 8:29; cf. 2 Peter 2:4), is kept. That split is DR-0100 tier 3 run on a doctrinal claim rather than a data claim.
- **Typography senior to the source.** Both transcripts capitalise "Watchers"; the first also capitalises "Satan" and "Lucifer". **None of it is copied through.** The watchers are lower case, and the title "the Book of the Watchers" is not used as a proper name at all (the lesson says "First Enoch, and specifically its opening section about the watchers"). Quoted Scripture is untouched: the KJV on disk already renders "satan" lower case in Job 1:6 by Darrell's own directive, and "the devil" inside Matthew 25:41 and Hebrews 2:14 stands exactly as written.

## What was measured

**The neighbours were read first, and the increment is real.** `ll29-the-unseen-realm-and-the-nations` already teaches the "sons of God" through Job 1:6 / 38:7 and already places 1 Enoch as context rather than Scripture; `ll72` is the Berean sourcing habit; `ll73` traces a borrowed name home; `ll76` set the don't-go-past-the-Word test; the `genesis-6` entry in `biblical-timeline.js` carries the house position. **None of them touches the Rephaim, Og, Goliath, Numbers 13:33, 2 Samuel 21, or what the Word does and does not say a demon is.** The whole ll240–ll258 block was also read after a mid-build correction (the coordinator's first id assignment was stale): the only hits were John 1:12 / 1 John 3:1 sonship in ll251 and ll252, and Genesis 6:22 (Noah finishing the ark) in ll250 — different teachings on the same words. `scripts/lesson-already-built.mjs` returned WEAK (terms only) for this subject, and neither video id appears anywhere in the repo.

**Verses:** every one fetched from `app/public/bible/kjv` with a scratchpad resolver before a sentence was written; the lesson quotes from that output, never from memory. The draft was run through the repository's own gate scripts **in the scratchpad, before it touched the catalog**:

| check | measured |
|---|---|
| referenced spans / verbatim faults | 323 / 0 |
| fullness child / youth / teen / senior (floors 0.5 / 0.6 / 0.6 / 0.6) | 0.54 / 0.60 / 0.72 / 0.91 |
| authored-prose grade child / youth / teen / senior (child ceiling 5.0) | 0.83 / 4.25 / 6.98 / 8.80 |
| worst band overlap (ceiling 0.5) | 0.05 |
| bands not naming the lesson in their opening | none |
| places missing a direction | none |
| elisions / recited records / generic "God" in our own prose | 0 / 0 / 0 |
| capitalised adversary or watchers in our own prose | 0 |

**What the checks caught while writing.** The first measured draft was **short in two bands** (child 0.32 against a 0.5 floor, youth 0.51 against 0.6) and its **senior band sent the reader only one of the three directions** — the elder band speaks TO the grandparent, so the upward ask and the friend line both had to be written in the form a reader who IS the elder actually meets (DR-0795's own widening). Both were fixed by writing more teaching for those readers, never by trimming the adult lesson. The draft also carried **"Book of the Watchers" capitalised three times**, copied in from the source summaries; the typography check caught all three before the splice.

**What the gate caught after the splice.** The first version of the no-both-sides check was a bare `/pick a side/`, and it **flagged the child band for saying "We are not going to pick a side"** — a check that cannot tell a refusal from an invitation is worse than none (DR-0332). It now matches the invitation form only, and carries a case proving it still fires on "Here are two views; you decide" while staying quiet on the refusal.

**External claims, verified rather than relayed (DR-0192 / DR-0100).**

- **Tier 1, stated plainly:** the widely circulated claim that a national museum destroyed thousands of giant skeletons and was forced by a court to admit it **traces to a 2014 article on a website that publishes fiction and satire**; there is **no such ruling in the public record**; the museum has denied it outright; and among the images attached to it is a photograph of a man with gigantism who died in 1904. Verified against independent fact-checks (PolitiFact, Lead Stories, Snopes), not against the agent's priors. The lesson says this flatly, because hedging a verified fact is its own failure of truth.
- **Tier 1, reported as what a book says:** First Enoch is genuinely ancient, copies were recovered among the Dead Sea Scrolls, and it is preserved in the Ethiopian canon. Said; not built on.
- **Named but NOT taught, because unverified:** the first sending's claim that "in my Father's house are many mansions" derives from First Enoch. It is not in the lesson at all.
- **Named but NOT taught, because outside the Word:** the Ugaritic `rapi'uma` lexical argument the second sending rests on, and the Plato / Atlantis and Zep Tepi parallels the first one rests on. The lesson teaches what **Scripture itself** does with the word Rephaim, which is the Word explaining the Word; an outside lexicon is not the measure here, and ll73 already holds the borrowed-parallel work.
- **No faith label, affiliation or motive is attached to either named man**, which the World Issues 21 correction made a standing rule, and the second speaker is **not named** because the road did not return a name — the lesson says so rather than guessing.

**Numbers, and what measuring them cost.** `LIVING_LESSONS_MODULES` read at 255 modules with highest **ll258** on `origin/main` at the start of the build. This lesson is **ll261**, assigned exclusively and verified held by no one else; the record is **DR-1222**, free on disk and in flight.

The route there is worth recording, because it is a measurement finding rather than an inconvenience. The build was first assigned **ll252** — taken since 2026-10-18 ("This Life Is the Curriculum", DR-1100) — caught before a line was written. It was reassigned to ll261, then to "the lowest free id", which `living-lessons-numbers-are-unique` rejected: `KNOWN_GAPS` is frozen at two, so a number out of sequence is a NEW hole and CI's `lint + vitest` went red on it by name. But **"lowest free" is not computable in parallel**: eight builders ran it against their own trees at the same moment and five got the same answer, and a local `grep app/src/lib/` cannot see a number held by an unlanded branch at all. Measured directly across every pushed branch while this was being settled: **two live branches both held ll260**. So contiguity is held centrally (the convention in `app/src/__tests__/living-lessons-id-collision.test.js`), ids are assigned exclusively, and `scripts/claim-decision-number.mjs` — which reads unlanded branches — is the instrument for checking an assignment rather than choosing one.

**Known and not hidden:** while ll259 and ll260 are mid-flight rather than merged, `unclaimedNumbers` will name them as gaps beneath this lesson. Those two holes are not this record's to fill and must not be "fixed" by taking a number a sibling already holds, which would trade a gap for a collision. They are registered and retired centrally.

## The decision

**Two sendings on one passage become ONE lesson, taught from the Word's own usage, held to one measure that cuts in both directions — never a both-sides piece.**

`ll261` is appended to Living Lessons (`app/src/lib/living-lessons-class.js`) because that is the course that carries the Word-first teaching the congregation reads, in four age bands, and because the subject is a reading discipline rather than a topic: it belongs beside ll29, ll72, ll73 and ll76, which it extends rather than restates.

Eleven movements: the measure and why it cuts both ways; who the "sons of God" are by the Word's own usage; the giants were real and shaving them down is also a lie; and the Word makes them outliers, not a race; **the edge, said out loud**; First Enoch, placed honestly; what an unclean spirit is from the Word's own account; the darkness was worship, and He said so Himself; evidence, and the trap of friendly proof; how a giant actually falls; the practice. Every band carries all eleven in its own register and closes on the same line: "for the battle is the LORD’s, and he will give you into our hands" (1 Samuel 17:47).

## Impact

A reader who has met this subject only through a video now has it from the text: the phrase settled by Scripture's own usage, the size stated as plainly as the Word states it, the outlier wording noticed, the **silence named instead of filled**, a non-canonical book placed, a demonology held to the account the Word actually gives, the darkness located in worship where Yahweh locates it, an evidence rule that is ours before it is any fact-checker's, and a giant that falls for the reason David gave. Four bands, so a child and a seasoned teacher each get the whole thing. All three talk-together directions in every band, so a reader who only ever reads one band is still sent to someone.

### Limits, named rather than left

- **The send day is known only to within a day.** The two rows waited roughly 87 hours; the recorded date is the **build day** (2026-10-26), with the reason written beside it in `living-lessons-dates.js`. An estimate dressed as a date would have been worse than an honest build day. `re-review: 2026-11-26` — if the intake ever carries an exact `created_at` into the builder's hands, the date convention for research-road lessons should be settled once rather than per lesson.
- **The second speaker is unnamed.** The research road returned no name, so the lesson says the road did not name him. If the name is recovered later, the lesson should name him plainly — `re-review: 2026-11-26`.
- **The transcripts are machine hearing.** Auto-generated captions with no timestamps. That is why **not one sentence is quoted from either man**; their positions are summarised from the road's own summary plus the transcript, and a summary can misplace emphasis even when it does not misstate. A reader who wants either man's exact words must go to the source.
- **`unclaimedNumbers` names ll259 and ll260 as gaps until those two land**, and that is the gate working rather than a defect here. The holes are not this record's to fill and are registered and retired centrally; this lesson does not renumber for contiguity. `re-review: 2026-11-02` — if either id is abandoned rather than merged, the central register closes the gap.
- **The house canon decision is still open.** `THE-ROOT-POSITIONS-AND-INQUIRY.md` records the Genesis 6 divine-beings reading at HIGH confidence and marks the 1 Enoch demon mechanism as **pending the house's formal canon decision** (`THE-CANON.md`). This lesson does not settle that and does not pretend to; it teaches what the Word says and stops, and if the canon decision later lands, this lesson needs no edit for it — which is the point of stopping at the edge.
- **The Deuteronomy 32:8 manuscript question is not reopened here.** ll29 already names it honestly. This lesson does not need it and so does not touch it.
- **What this lesson does not do:** it does not catalogue the Rephaim outside Scripture, does not adjudicate the Aramaic loan-word argument about nephilim, and does not say where unclean spirits came from. Each of those is a place the Word is reticent or the question is outside it, and the lesson says so rather than leaving a reader to assume it was covered.

## Proven to catch

`app/src/__tests__/living-lessons-ll261-add-not-diminish-not.test.js` — **116 cases, all green**, seven of which are breaks performed in the test rather than claims about it:

1. **An altered quotation.** Softening Deuteronomy 4:2 in the child band ("and do not take anything away either") makes the verbatim check name Deuteronomy 4:2. So does substituting "Yahweh" into Matthew 22:29 — the DR-0210 bright line, pinned as a break.
2. **A trimmed band.** Cutting the teen band to 600 characters makes `shortBands` report `teen`.
3. **A band that stops sending the reader anywhere.** Removing the senior band's friend line alone makes the per-band check name the senior band — while the module-pooled read still looks green, which is exactly why DR-0795 made it per-band.
4. **The generic "God" in our own voice.** Appending "Then God was glad." to the child band fires the check.
5. **A capital smuggled in from the source.** Appending "The Watchers descended on Mount Hermon." fires the typography check — the break that actually happened in the draft.
6. **A both-sides invitation.** "Here are two views; you decide" fires; "We are not going to pick a side" does not. Both directions pinned, because the first version of this check could not tell them apart.
7. **The catalog pins are deliberately one-sided.** "Is the last lesson" and "the next number is absent" are NOT pinned — L256's and L257's equivalents both broke when the catalog grew. The pins are a count (260 claimed exactly once), a floor (`>= 260`) and a uniqueness check, and they say nothing about which numbers are absent.

Also green, unchanged: `lesson-completeness`, `every-catalog-quotes-the-verse`, `every-anchor-is-named-in-the-lesson`, `four-band-ladder`, `band-differentiation-gate`, `course-band-coverage`, `a-coloring-page-for-every-lesson` (the page is derived, so this lesson got one for free), `full-context-before-the-lesson`, `lesson-dates`, `adversary-is-never-capitalized`, `one-teaching-one-lesson-guard` (0 pairs), and `derive-lesson-dates --check` (841 of 841 dated).
