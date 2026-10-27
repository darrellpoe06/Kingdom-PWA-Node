# 2026-10-27 — Living Lesson ll263, "Not One Stone — the Word Jesus Spoke Over Jerusalem, and the Year It Came True"

**Module id:** `ll263-not-one-stone-the-word-jesus-spoke-over-jerusalem-and-the-year-it-came-true` (`ll263`)
**Decision record:** DR-1223
**Source:** a link Darrell sent into the PoeTech app's own **research road** with one word on it — `agent_inbox`
row `6130c486-a7c0-4a8e-978d-a37ad1533b79` (his own phone account), research item
`a32f4cc4-c46b-40a0-bde1-bc2e882ce229`. The row had waited roughly **90 hours**. The road fetched the
video's machine-made captions on our own hardware and returned about 4,742 words with no timestamps;
**the reading step never completed**, so those captions are the whole of the research. The speaker in
that video is not named in anything that reached us, so the lesson names no speaker and pins no
label, affiliation or motive on anybody.

## What the material was, and what the lesson teaches instead

The captions argue that the fall of Jerusalem in AD 70 fulfilled Jesus' prophecy, corroborated from
Josephus and Tacitus, and read as covenant judgment. The house had **no direct treatment of it** —
`ll127` (*The Firsts*) and `ll140` (*The People of Judah and the People of the Way*) glance at it for
the burned genealogies and the times of the Gentiles.

So the lesson is built on the one thing nothing else held: **His own recorded speech, and His tears
while He spoke it.** Ten movements, identical in all five reader places: He said it about the stones
they were admiring; He wept while He said it; the warning was also a way out; He said when and why He
told them early; what the historians wrote down; the Word had already said what this looks like; this
is not a reason to look down on anyone; stop where the Word stops; what was still standing when the
stones came down; so what do we do with it.

## The decisions that needed care

**No historian is quoted anywhere, on purpose.** This house holds no copy of *The Jewish War* or the
*Histories*, and the sandbox has no route to fetch one. The only text that could be read word for word
is the KJV corpus on disk. So **every double-quoted span in the whole module resolves verbatim to the
corpus** (453 of them) and everything from Josephus and Tacitus is paraphrased in our own words and
credited to the man who wrote it. That is a stronger contract than the not-Scripture allowlist a
spoken-source lesson rides, and the gate proves it rather than restating it.

**Three tiers, kept distinct (DR-0100).** The siege under Titus, the fall, the burning and dismantling,
the end of sacrifice, the mass death, the enslavement and the Gentile possession are stated **plainly
and un-hedged**. Josephus's casualty figures, his claim that Titus gave no order, the factional
grain-burning and the famine are labelled **one man's report**. The omens are reported as what both
men record and left **uninterpreted**, because the Word does not interpret them.

**Gravity without appetite.** The famine is one sentence in the adult lesson, and the prose says out
loud why it stops there. The child band carries **no casualty figure and no famine detail at all**,
while still refusing to pretend nothing happened. Philippians 4:8 was run against our own prose here
specifically, on HONORABLE and PURE.

**Four things from the captions were dropped**, each for a stated reason in DR-1223: the "ninth of Av"
date (unverifiable here, and Josephus's own text gives a different day in that month), the
Eusebius/Pella flight tradition (a source two centuries later, not an eyewitness), the Missler
pattern-versus-prediction frame (man-agreement used to settle how prophecy works — DR-0098), and any
resolution of the near/far reading. No camp is named anywhere; the gate pins the absence of
*preterist*, *futurist* and *dispensational* in our own prose.

## How it was built

1. Every verse was printed from `app/public/bible/kjv` by a scratchpad resolver **before a sentence was
   written**; the lesson quotes from that output, never from memory.
2. The adult lesson and all four bands were written in the scratchpad and run through the repository's
   own gate scripts (`full-levels`, `reading-level`, `title-in-narrative`, `band-differentiation`,
   `quotation-integrity`, `talk-together`) **before touching the catalog**. Measurement at that point:

   | check | measured |
   |---|---|
   | referenced spans / verbatim faults (whole module) | 453 / 0 |
   | uncited quotations anywhere in the module | 0 |
   | `anchor.ref` verses / verses quoted / mismatch either way | 89 / 89 / 0 |
   | fullness child / youth / teen / senior (floors 0.5 / 0.6 / 0.6 / 0.6) | 0.54 / 0.83 / 0.89 / 1.23 |
   | authored-prose grade child / youth / teen / senior (child ceiling 5.0) | 0.44 / 4.08 / 5.82 / 8.26 |
   | worst band overlap, quotations stripped (ceiling 0.5) | 0.12 |
   | places missing a TALK direction / bands not naming the lesson | 0 / 0 |
   | elisions / recited record ids / generic "God" or "the LORD" in our voice | 0 / 0 / 0 |

3. Spliced after ll258 in `living-lessons-class.js`; dated in `living-lessons-dates.js`.
4. `anchor.ref` was **generated from the module's own quoted spans** rather than typed, so Search it out
   derives real links and the two-way check cannot drift (DR-0734).

## Two things the lesson's own gate caught after the splice

**The pinned spans carried the corpus's terminal punctuation; the lesson quotes the span without it.**
64 cases went red at once. The pins were right as corpus text and wrong as pins — a quotation ending
mid-sentence has no final period, so `whole.includes(text)` failed on 24 references including the whole
spine. Fixed by **regenerating every pin from the longest span the module actually quotes of that
verse**, then re-verifying each against the corpus. The pin is now the span, not an approximation of it.

**Three band checks were written too narrowly and blamed the lesson for the instrument.** Each band
says the no-historian rule, the uninterpreted rule and the "read more than one way" acknowledgement in
its **own** words — the senior band writes "no sentence of Josephus", the teen band "taken this passage
more than one way" — and the patterns had been written against the adult lesson's phrasing only. That is
the DR-0795 lesson again: the instrument was short, not the band. Patterns widened to read all four.
The child band genuinely did lack two of the three, and gained Matthew 24:4 and a plain sentence
naming that people have read this part more than one way without picking a side for the reader.

## The number moved twice and came back: ll263 → ll260 → ll263

Worth recording, because it cost a renumber in each direction and the cause is structural rather than
anyone's slip.

The id assigned was **ll263**. Mid-build a correction arrived saying lesson numbers must run
**contiguously** above ll258 — `living-lessons-numbers-are-unique` pins `KNOWN_GAPS` at two entries
(211, 212) and treats any other unclaimed number between the min and the max as a hole — and
instructing each builder to **compute the lowest free id**. Measured at that moment: siblings held
ll259, ll261 and ll264, so the lowest free id was **ll260**, and the whole build was renumbered to it
(catalog, date row, gate filename and contents, record filename and body, branch).

A final fixed assignment then restored **ll263** and withdrew the lowest-free rule, because *five of
eight parallel builders computed the same answer at once* — which is exactly the race a central
register exists to prevent. The sibling on `claude/ll264-the-judgment-seat-and-the-reward` had already
renumbered itself onto **ll260** under the same instruction, so ll260 was never safely ours.

Two things were checked rather than taken on trust before settling, and both came back against the
message that carried them:

- **`ll259` and `ll260` were said to have landed as #2414 and #2415. Neither PR exists**, and
  `origin/main`'s `living-lessons-dates.js` still ends at `ll258`. Nothing above ll258 has landed.
- **`DR-1224` was assigned as final, and it is held by an unlanded sibling branch**
  (`origin/claude/ll260-the-judgment-seat-and-the-reward`), which `node scripts/claim-decision-number.mjs`
  reports and a local `grep` cannot see. Per the instruction's own terms — confirm, and report rather
  than pick a replacement — this record stays on **DR-1223**, which the same tool confirms is free on
  disk and in flight and which was this build's first assignment. The collision is reported, not
  resolved unilaterally.

So: **ll263**, the id first assigned; **DR-1223**, verified free. Zero residual `ll260` references.

## Suites run

Locally: `npm run lint`, `npm run verify:gates` (28 guards) and this lesson's own gate. **The full Vitest
suite was delegated to CI** on the PR head, at the coordinator's direction — nine builders were queuing
on one local mutex — and the lane cannot merge a red PR, so the suite still runs on the witness that
governs the merge.

## Where it lives for Darrell

Church → Learn → Living Lessons → L263, "Not One Stone — the Word Jesus Spoke Over Jerusalem, and the
Year It Came True", in all four bands, with two parables ("The Notch on the Third Fence Post",
"The Mason Who Trusted His Own Wall"), a seven-question quiz, and the facilitator's run sheet — which
is where the row id and research item are recorded for a steward. Its shelf is the Gospels (first
anchor Matthew 24:1).
