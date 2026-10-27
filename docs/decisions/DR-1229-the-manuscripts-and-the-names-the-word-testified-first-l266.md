# DR-1229: The manuscripts and the names — the Word testified first, and the one artifact everybody oversells is the one this lesson refuses to (ll266)

**Date:** 2026-10-27
**Status:** accepted
**Tier:** A (one lesson added to an existing course, all four age bands from its first commit; one derived date row; no code changed)
**Type:** curriculum
**Area:**
- `app/src/lib/living-lessons-class.js` (`ll266-the-manuscripts-and-the-names-the-word-testified-first` — the two-hundred-and-fifty-sixth module in the catalog)
- `app/src/lib/living-lessons-dates.js` (one dated row)
- `app/src/__tests__/living-lessons-ll266-the-manuscripts-and-the-names.test.js` (the lesson's own pinned gate)
- `app/src/lib/lesson-dates.json` (one derived row, regenerated)

**Grounds:** Darrell sent a conference lecture into the app's research road for a lesson — `agent_inbox` row `f64f12ab-0c70-476e-a424-0ae9e03d0d68`, from his own phone account, research item `03b89afb-d00e-45d7-a813-a74d451f896a`. It then waited **about 91 hours** in the queue, inside the dark-in-effect window DR-1219 measured. A second row supplied this lesson's **asset plan and not a word of its teaching**: `agent_inbox` row `f57f16a0-1bd9-42dd-88af-0c24f06525b1`, research item `7bf0b019-cda2-4590-a233-1a6104cbe0ce`.
**Principles:** DR-0192 (the trust-but-verify pass runs BEFORE first ship, not only when challenged); DR-0076 §3 (proven to catch), §4 (measure, never claim), §7 (independent method), §8 (name the limits; flag what was not verified); DR-0100 (three tiers — state established fact plainly, flag only what is genuinely open, never hedge a settled thing); DR-0098 (teach the Word, do not debate it — a dispute may be NAMED to educate past it); DR-0210 / DR-0076 bright line (Yahweh in our voice, never substituted into a quotation); DR-1206 (the witness belongs to the road, and a named real person gets no label the source did not state); DR-0331 (a machine transcript rendered for meaning); DR-0733 / DR-0795 (all three directions, in every band); DR-0734 (`anchor.ref` names every verse the lesson stands on)

## Context

The lecture is **Wes Huff** at the Apologetics Canada Ontario Conference, walking an audience through archaeological and manuscript corroboration of the New Testament: the fragment of John known as **P52**, **onomastic congruence** (the match between personal-name frequencies in the Gospels and the real name distribution of first-century Judea and Galilee), the **Pilate Stone** from Caesarea, and the **Alexamenos graffito** in Rome. He is named here exactly as the material names him, with no faith label, affiliation or motive attached that the source does not state — the correction World Issues 21 had to carry.

**The road answered on the primary row, and said what it could not give.** The reading is a 4,985-word `youtube-asr` transcript, fetched on the NAS because the CI path is YouTube-IP-blocked, and it carries **no timestamps** — the fetcher joins the caption segments, so a quotation can be attributed to the speaker but never cited to a minute mark. It is a machine's hearing of a man, not the man's own text, so it is rendered for meaning (DR-0331). The lesson does not repeat its mis-hearings: *anom of Canterbury* is Anselm, *Ferdinand Bower* is Ferdinand Christian Baur, *oxar rinkus* is Oxyrhynchus, and the captions' closing "the seven books that we call the New Testament" is the same speaker's own **27** from earlier in the same lecture.

**One duplicate check before a word was written.** `ll41-truth-with-a-capital-t` is built from the **same speaker and a different source and subject** — the Steven Bartlett conversation, audited clean as L41 in DR-0192 — and is a general case for faith as a truth claim rather than an artifact-by-artifact study. It is cross-referenced, not re-taught. "onomastic" appeared once in the whole of `app/src/lib/`, inside ll75's senior band and about Hebrew name-identity, not about name frequency. P52, Rylands and Sinaiticus appeared only in `yahweh-by-century.js`, which already carries `≈AD 125-175` for P52 — the same honest range this lesson teaches. The ground was free.

## What was measured

**The verification pass ran before first ship, by independent live research rather than the model's priors (DR-0192, DR-0076 §7). It came back in three tiers, and the third tier is the finding that shaped the lesson.**

### Established — stated plainly, with no hedging (tier 1)

| claim | result |
|---|---|
| P52 is Greek Papyrus 457 at the John Rylands Library, Manchester; text from John 18; written on both sides, so a codex leaf; identified 1934 by C. H. Roberts; among the earliest known fragments of any New Testament text | **documented** |
| The Caesarea block was found June 1961 in the theatre by the Italian expedition under Antonio Frova; now in the Israel Museum; its surviving letters give Pilate's office | **documented** |
| The standard reading of that title is **prefect** of Judaea, and Tacitus (*Annals*) calls Pilate a **procurator** | **documented** — and the stone's `[praef]` is itself **restored from the break**, which the lesson says out loud |
| The Alexamenos graffito: Palatine Hill, Rome, found 1857; its holding museum dates it to the Severan period, around AD 200; Greek caption to the effect that Alexamenos worships his god | **documented** |
| Bauckham's 2006 study of the Gospels as eyewitness testimony set the Gospel and Acts names against Tal Ilan's lexicon of Jewish names in Palestine (~2,500–3,000 named persons, c. 330 BC – AD 200); the congruence holds, and Egyptian material gives a different profile | **documented** |

### Genuinely contested — named NARROWLY, never smeared over the topic (tier 2)

- **P52's date, and this is the hinge of the whole lesson.** The fragment carries no date; **every** date assigned to it rests on palaeography alone. Roberts proposed the first half of the second century; Orsini and Clarysse (2012) give about **AD 125–175**; **Brent Nongbri** argued in 2005, and again in a 2020 article, that handwriting cannot sustain that precision and that defensible comparanda reach into the later second century and the third. His conclusion is **not universally accepted**, and the second-century placement remains standard. The lesson therefore teaches one sentence — *among the earliest surviving New Testament fragments, standardly placed in the second century, any tighter date resting on handwriting alone and genuinely contested* — and says in its own voice that saying it that way **costs nothing**, while overselling it costs everything.
- **The Baur anecdote.** He placed John in the second half of the second century, too late for eyewitnesses. But the tidy story that he simply imposed a Hegelian thesis-antithesis-synthesis template is **itself disputed** by specialists who credit his critical method instead, and the popular figure of **AD 160** is sharper than what he wrote. Both are named in the lesson.
- **The onomastic argument's limits**, which are as real as its force: the sample is modest by statistical standards; Ilan's lexicon treats **Palestine broadly rather than isolating Galilee**, a weakness critics have pressed directly; and congruence establishes **fit, not authorship**. Every band carries the limit, by the gate.

### Could NOT be verified — so NOT taught (DR-0076 §8)

| the lecture's claim | what happened |
|---|---|
| Codex Sinaiticus took **the hides of 260 sheep** | **not found.** No source located gives that number, and the Codex Sinaiticus project's own description says the leaves are **primarily calf skin**, secondarily sheep. The figure appears **nowhere** in this lesson, and the facilitator notes forbid asserting it. |
| **Damaris and Lydia** are Greek names attested in no inscription or literary document anywhere in the period, and **10%** of people in southern Asia Minor had wholly unique names | **not verified** in one pass. Lydia is in any case a well-known regional name used personally, which makes "attested nowhere" implausible on its face. Neither the names nor the statistic appears in this lesson. |
| P1 was dug up on **January 12th, 1897** | **day not confirmed.** The lesson names no day. |
| The Alexamenos graffito is **1,900 years old** and shows what believers did "as early as we can push it" | **overstated.** Around AD 200 is ~1,825 years, and it is not the earliest evidence of anything. The lesson says so in every band. |
| "All of them unanimously put it at the beginning of the second century" | **overstated.** Roberts' own proposal was a range, not a point. Not repeated. |

### The lesson itself, measured before the splice

272 referenced spans, **0 verbatim faults** against `app/public/bible/kjv`, walking every string in the module rather than only the prose a reader scrolls. Fullness **0.67 / 0.75 / 0.72 / 1.01** against floors 0.5 / 0.6 / 0.6 / 0.6. Authored-prose grades **child 1.59, youth 6.85, teen 10.33, senior 11.40** — the ladder rises by more than one at each step and the child band is under the 5.0 ceiling. Worst band overlap **0.24** against a 0.5 ceiling. Every band names its own lesson in its opening window; every place carries all three directions; `Yahweh` appears in our own voice in all five texts and the generic "God" appears in none of them outside quotation marks. **35 straight apostrophes were caught and converted** to the corpus form before the splice, none of them inside a quotation.

## The decision

**It ships as a Living Lesson, ten movements, Word first and evidence second — and that order is the lesson, not its arrangement.**

- **Placement: Living Lessons** (`app/src/lib/living-lessons-class.js`), because this is a Word-first teaching for the whole house across four age bands, not a current-affairs item for the World Issues discernment track and not a sovereignty piece. It takes the apologetics seat ll41 already occupies in that course, one row below it in subject and distinct from it in material.
- **The spine is the Word's own claim to be eyewitness testimony in writing**, fetched verbatim from the corpus on disk and pinned by name: Luke 1:1-4 (and its purpose clause, *certainty*), John 21:24, 2 Peter 1:16 — "For we have not followed cunningly devised fables" — and 1 John 1:1, with John 19:35, Acts 1:3, 1 Corinthians 15:6 and Acts 26:26 beside them. Matthew 24:35 and Isaiah 40:8 carry the guarantee that needs no artifact at all. **The manuscripts corroborate; the Word testifies.** The lesson's own gate asserts the first movement precedes the first mention of P52 in the text.
- **Corroboration is received in the office Yahweh's own law gives it** — the second mouth of Deuteronomy 19:15, never the first. That verse is in every band.
- **The dispute is NAMED to educate past it, never staged as a you-decide (DR-0098).** Nongbri is named, his argument stated, and its reception stated; the reader is not invited to pick a team, and the Word is not put to a vote. Where the lecture's framing was loose, the Word corrects **that framing** while the true data under it stands untouched (DR-0100 tier 3): the Caesarea stone says prefect and Tacitus said procurator, and the Gospels used the general word for a provincial ruler — "Pontius Pilate being governor of Judaea" (Luke 3:1) — which is accurate whichever Latin office the man held.
- **One doctrinally charged item in the source was deliberately not carried as the source carried it.** The lecture names a particular group in order to rebut a stake-not-a-cross claim. This lesson teaches the same ground **from the Word alone** — the plural nails in the hands (John 20:25), the notice set up over His head (Matthew 27:37), the title Pilate wrote and put on the cross in three languages (John 19:19-20) — and names no group. The Word explains the Word; a side-quarrel with a named body is not this lesson's work, and DR-0098 is satisfied by teaching the text rather than by prosecuting anybody.
- **The companion row is the ASSET PLAN and is taught nowhere.** See the section below; it is cited in this record and used for nothing else.

## What the companion row gave, and what it did not

Row `f57f16a0-1bd9-42dd-88af-0c24f06525b1` (research item `7bf0b019-cda2-4590-a233-1a6104cbe0ce`) is **not a teaching and is not taught as one.** It is a production plan for this same lecture — where to obtain artifact images, with access and copyright notes:

| artifact | source the plan names | licensing note the plan carries |
|---|---|---|
| **P52** (John Rylands 457) | University of Manchester **LUNA viewer**, Rylands Library; new high-resolution normal-light and light-table images, recto and verso | best quality available; **check the LUNA viewer's permissions statement for reuse terms** |
| **Pilate Stone** | **BAS Library** (Biblical Archaeology Society) | credited to the collection of the Israel Antiquities Authority, photo © The Israel Museum, Jerusalem; **copyrighted — publication or commercial use requires permission from the Israel Museum / IAA** |
| **Alexamenos graffito** | **BAS Library** | credited © Alinari Archives / Art Resource, NY; **copyrighted — licensing needed for publication** |
| **Codex Sinaiticus** | **codexsinaiticus.org**, the official project site; every page in standard and raking light, full transcription | **primarily for research and education; check site terms for other uses** |
| **P66** | **CSNTM**, public images from the Foundation Martin Bodmer (162 images) | via CSNTM and the Bodmer Library |
| **GA 777** | **CSNTM**, 421 images from the National Library of Greece | a 12th-century illuminated Gospels manuscript |
| **P1** (Matthew) | not a focus; Penn Museum and Wikimedia Commons often hold public-domain or CC-licensed Oxyrhynchus papyri | **verify the licence on each source page** |
| **P52**, lower-resolution fallback | **Wikimedia Commons**, public domain | the simpler option where licensing must be unambiguous |

**Its own research road returned nothing — it answered 413**, so the row carries only Darrell's own text and no fetched reading at all. That is stated plainly here because a provenance that implies a reading happened when none did is the failure DR-1206 was written against.

**What the plan would give this lesson, if the images are ever wanted:** the three artifacts the lesson teaches as objects all have an identified, named source, and **two of the three are copyright-encumbered for publication.** The practical consequence is that only P52 has a clean route to a published surface — Manchester's own high-resolution images under the viewer's stated terms, with a public-domain Wikimedia fallback — while the Pilate Stone and the Alexamenos graffito would each need written permission from the crediting institution before they could appear in the app. **No image is added in this change.** The lesson is taught entirely in words, and it teaches fine that way; this table is the record of what it would take, so the next session does not have to re-derive it.

## Impact

- **The two-hundred-and-fifty-sixth Living Lesson teaches a subject this house holds nowhere else**, and teaches it in the order that makes a believer un-rattleable: the testimony first, the corroboration second, the confidence on the promise rather than on a date.
- **The single most common error in popular apologetics is gated against in this lesson's own test.** A bare `AD 125` assertion fails by name; so does "firmly/certainly/precisely dated". Every band must carry the words *handwriting*, *Nongbri*, and the second-century placement. That is the DR-0192 finding turned into a machine check rather than a note.
- **The three unverified claims are gated OUT.** `260 sheep`, `Damaris`, a bare `10%` and `January 12` each fail the test if they ever come back, and three of the four are proven to catch on smuggled text.
- **Established facts are stated as facts.** The lesson's own voice says that manufacturing uncertainty about settled things is its own species of untruth, and the facilitator notes carry it as one of four things to guard — DR-0100's under-claiming failure, closed in the same breath as the over-claiming one.
- **The limits are in the lesson, not only in this record.** Every band says what the names argument does not prove, and every band dates the graffito honestly.
- **The band debt moves only in its permitted direction**: one more lesson, all four bands from the first commit.

### Limits, named rather than left

- **No minute marks.** The route returned no timestamps, so nothing in this lesson is cited to a time in the lecture, and no span is presented as the speaker's exact wording. Every attribution is to the speaker generally, from a machine transcript.
- **The send timestamp is not asserted.** The row's age was given as about 91 hours; this session did not read the row's own `created_at`, so the dated row carries the **build** day, 2026-10-27, and says so in its comment rather than guessing a send date.
- **The onomastic argument is corroboration, not proof**, and the lesson says that in all five texts. A reader who leaves thinking the names establish authorship has been mis-taught, and the gate refuses a band that drops the limit.
- **P52 does no load-bearing work here.** If a future study moves its date, nothing in this lesson has to be rewritten — which is the whole point of the order it teaches.
- **The three unverified claims were not run down further.** One pass of independent research each; a second pass might resolve the Sinaiticus hide count or the Asia Minor statistic. They are omitted rather than hedged, which is the DR-0076 §8 answer, not a finished investigation. `re-review: 2027-01-27` — only if a reader asks for the figures by name.
- **The Cicero line the lecture quotes is not in the lesson.** The remark about the word *cross* being kept from a citizen's body, mind, eyes and ears traces to *Pro Rabirio Perduellionis Reo* §16 rather than the speech popularly cited, and the Latin wording could not be confirmed in this pass. Rather than quote a classical text this house cannot verify on disk, the lesson makes the same point without it.

## Proven to catch

The lesson's own gate (`app/src/__tests__/living-lessons-ll266-the-manuscripts-and-the-names.test.js`) does not merely pass; six of its cases were shown to **catch the break**, on the real text:

1. **An altered quotation.** Rewriting "but my words shall not pass away" to "but my words will never go away" in the child band makes `verbatimFaults` name Matthew 24:35.
2. **Yahweh substituted into a quote** — the DR-0076 bright line. Replacing the KJV's "the word of our God shall stand for ever" with "our Yahweh" inside the quotation marks makes the same check name Isaiah 40:8. The covenant name belongs in **our** prose and nowhere inside His.
3. **A trimmed band.** Cutting the teen band to 600 characters makes `shortBands` report `teen`.
4. **A band that stops sending the reader.** Removing the youth band's friend-to-friend line alone makes `placesMissingDirections` name `youth` with `friends` missing — **while `hasAllThree` on the same module still reads green**, which is exactly the DR-0795 hazard and the reason the per-band check has to exist. Both halves are asserted in one case.
5. **The generic "God" in our own voice.** Appending "Then God was glad." to the child band makes the covenant-name check fire.
6. **Each of the four unverified claims coming back.** Smuggled text carrying `260 sheep`, `Damaris`, `10%` or `January 12` is detected, measured against **every string in the module** rather than only the prose a reader scrolls.

### The first version of the over-claim gate was WRONG, and the flag is kept rather than filed away (DR-0621)

The check that matters most in this lesson went red on its own lesson, and the red was pointing at the gate. Written as a search for the **string** `AD 125`, it fired on all six occurrences — and every one of them is a **warning against** the figure, not a claim of it: *"if your confidence was riding on AD 125, the first person who quotes Nongbri at you wins"*, *"an apologetic erected upon AD 125 collapses"*, *"do not let the room leave with AD 125 as a settled figure"*, plus a quiz distractor that exists precisely to be chosen wrongly and corrected.

**A gate that cannot tell a warning from a claim would have forced the lesson to stop warning** — the exact opposite of what DR-0192 asks for. So it was worked until it was right rather than relaxed or deleted: it now reads for the **assertion** (`is`, `was`, `dated to`, `dates to`, `comes from`, `belongs to`, with an optional `about` / `roughly` / `around` / `c.`, immediately before the figure), across the five texts a reader actually reads, and it is **proven in both directions** — three assertion forms are caught, and all four of the warnings this lesson really carries stay legal, as does the honest range "about AD 125 to 175". A second case pins that the single-year option in the quiz is a distractor and never the marked answer.

Two smaller faults were caught by the same run and fixed in the lesson rather than in the gate, which is the right direction when the gate is correct: the **child band named no library**, so a child met P52 without being told where it is (now the John Rylands Library by name), and the **teen band never used the plain word "match"** for the name congruence, so the band most likely to be quizzed on it carried the concept without the word. And the unverified-claims list carried a real regex bug — a trailing `\b` after `%`, which can never match, because a percent sign is not a word character — so the `10%` case **passed while proving nothing**. That is DR-0076 §3's own definition of a lie, found by writing the proven-to-catch case before trusting the check.

Measured, not claimed: the numbers in **What was measured** come from a scratchpad harness run against the draft before it touched the catalog, and re-run after it landed in the file.

**Verification run before push:** `npm run lint`, `npm run verify:gates` (all 28 guards) and this lesson's own test file, locally. **The full Vitest suite is delegated to CI** (`ci.yml`, four shards on the PR head), by the coordinator's call: nine builders on one machine were serializing behind a single vitest mutex. The lane cannot merge a red PR, so the suite still governs the merge — it simply runs on the witness that governs it.
