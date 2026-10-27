# DR-1223: Not One Stone — a waiting research-road row becomes the house's direct treatment of AD 70, taught from His own speech and quoting no historian at all

**Date:** 2026-10-27
**Status:** accepted
**Tier:** A (one Living Lesson added, all four age bands from its first commit; one date row; one new gate, 6 of its cases proven to catch; no code changed)
**Type:** curriculum
**Area:**
- `app/src/lib/living-lessons-class.js` (`ll263-not-one-stone-the-word-jesus-spoke-over-jerusalem-and-the-year-it-came-true`)
- `app/src/lib/living-lessons-dates.js` (one row, 2026-10-27)
- `app/src/__tests__/living-lessons-ll263-not-one-stone.test.js` (the lesson's own pinned gate)
- `docs/99-session-notes/2026-10-27-living-lesson-ll263-not-one-stone.md`

**Grounds:** Darrell sent a link into the app's own **research road** with one word on it: *"Lesson."* — `agent_inbox` row `6130c486-a7c0-4a8e-978d-a37ad1533b79` (his own phone account), research item `a32f4cc4-c46b-40a0-bde1-bc2e882ce229`. The row had waited roughly **90 hours** in the in-app queue. The road fetched the video's machine-made captions on our own hardware and returned about 4,742 words with no timestamps; **the reading step never completed** ("the tower had not answered"), so those captions are the whole of the research.
**Principles:** DR-0076 §3 (proven to catch), §4 (measure, never claim), §7 (independent method), §8 (name the method's limits — unknown is never zero); DR-0100 (three tiers — state established fact plainly, flag only what is genuinely open); DR-0098 (teach the Word, do not debate it — a dispute may be NAMED to educate past it, never staged); DR-0192 (the trust-but-verify pass runs BEFORE first ship, not only when challenged); DR-0210 (Yahweh in our voice; Jesus the Lamb and Eternal Son; never inside a quotation); DR-0712 / DR-0719 (never assume who taught); DR-1206 (the witness belongs to the road); DR-0733 / DR-0795 (TALK ABOUT IT TOGETHER, in every band); DR-0734 (`anchor.ref` drives Search it out); DR-0610 / DR-1185 (one teaching, one lesson — checked before writing); P60 (all four bands bind new work the day they are required)

## Context

The material is the strongest in the 2026-10-26 intake: the fall of Jerusalem in AD 70 as the fulfilment of Jesus' own prophecy, corroborated from Josephus and Tacitus, read as covenant judgment. The house had **no direct treatment of it**. Two century-spine lessons glance at it — `ll127` *The Firsts* (7 mentions, the burned genealogical archive) and `ll140` *The People of Judah and the People of the Way* (7 mentions, the times of the Gentiles) — and `yahweh-by-century.js` carries Matthew 24:2 as a timeline row labelled history. What nothing held was the thing the Word actually puts at the centre: **His own recorded speech, and His tears while He spoke it.**

Three things had to be settled before a sentence was written. Whether this ground was already taught. What could honestly be claimed about two ancient historians this house does not hold a copy of. And how to teach a documented atrocity without either hedging it or enjoying it.

## What was measured

**The duplicate check, run across the catalog before writing (DR-1185).** Counted inside `living-lessons-class.js` on the 255 modules then present:

| already held | by | mentions |
|---|---|---|
| AD 70 closing the genealogical window | `ll127`, `ll140` | 7, 7 |
| Luke 21:24, the times of the Gentiles | `ll140` | 13 |
| Luke 19:41, Jesus weeping, in three other frames | `ll27`, `ll136`, `ll142` | 5, 7, 3 |
| Matthew 24:15, the abomination of desolation | `ll174` | 5 |
| Josephus | `ll39`, `ll170`, `ll200`, `ll201`, `ll203` | 5, 9, 10, 5, 1 |

And the free ground, counted the same way: **`Luke 19:44` 0, `Matthew 24:34` 0, `thy visitation` 0, `Luke 21:22` 0, `ninth of Av` 0, `Pella` 0, `Titus the Roman` 0.** The spine of this lesson — the clause in which **He names a missed visit rather than Rome as the cause** — was held by nothing in the house. So the lesson was built on His three speeches and **points the reader at `ll127` and `ll140` by name** for the genealogy ground and the times of the Gentiles rather than teaching either a second time.

**Every verse printed from `app/public/bible/kjv` before a sentence was written.** A scratchpad resolver printed each candidate verse; the lesson quotes from that output, never from memory. Final measurement on the assembled module, before it touched the catalog:

| check | measured |
|---|---|
| referenced spans / verbatim faults (whole module, every string) | **452 / 0** |
| uncited quotations anywhere in the module | **0** |
| `anchor.ref` verses / verses actually quoted / mismatch either direction | 89 / 89 / **0** |
| fullness child / youth / teen / senior (floors 0.5 / 0.6 / 0.6 / 0.6) | 0.54 / 0.83 / 0.89 / **1.23** |
| authored-prose grade child / youth / teen / senior (child ceiling 5.0) | 0.44 / 4.08 / 5.82 / 8.26 |
| worst band overlap, 8-shingle, quotations stripped (ceiling 0.5) | **0.12** |
| places missing a TALK direction / bands not naming the lesson | 0 / 0 |
| elisions / recited record ids / generic "God" in our voice / "the LORD" in our voice | 0 / 0 / 0 / 0 |

**The claims were checked one at a time, and two of them did not survive as the source had them.**

| the captions' claim | what shipped |
|---|---|
| Rome besieged Jerusalem in AD 70 under Titus; the city fell; the temple burned and was dismantled; sacrifice ceased; mass death; enslavement and dispersal; Gentile possession for centuries | **established — stated plainly, un-hedged** (DR-0100 tier 1) |
| Josephus is an eyewitness-adjacent Jewish commander who surrendered and wrote under Roman patronage; Tacitus a Roman senator with no stake in Judea's religion | **established — and his position is stated openly rather than whispered**, because it is honest context, not a disclaimer |
| the gold melted into the joints and soldiers prised the stones apart to recover it | **carried, credited to Josephus** — and it is the mechanism that makes "not one stone" literal rather than rhetorical |
| over a million dead, 97,000 captives, 11,000 starved in the holding areas | **attributed, never asserted** — "his count, they are debated, and this lesson reports them as his and asserts nothing" |
| Titus never gave the order to burn the temple | **labelled his claim, "questioned since antiquity, and not ours"** |
| the omens: a light at the altar, a voice in the inner court, armies in the clouds, the doors opening | **reported as what both men record, and left uninterpreted** — "It is not Scripture, the Word does not interpret it for us, and neither will we" |
| the temple burned "on the 9th of the month of Av" | **dropped.** Jewish tradition remembers the ninth; Josephus's own text gives a day in that month that is not the ninth, and this house holds no copy of either to read. An unverifiable date adds nothing the lesson needs, so no day is named at all. |
| Chuck Missler's "to the Jewish mind, prophecy is pattern" | **dropped.** A named living-or-dead real person's framework, quoted from a machine transcript, used to settle how prophecy works, is exactly the man-agreement DR-0098 forbids platforming as the authority. The Word's own limits (Deuteronomy 29:29; Matthew 24:36; Acts 1:7) do that work instead. |
| the Eusebius/Pella flight tradition | **dropped from the lesson.** Eusebius wrote two centuries later and is not an eyewitness; the captions themselves concede skeptics question how much is later church memory. Teaching it would have been the lesson's only load-bearing claim resting on a late source. |

## The decision

**It ships as Living Lesson 263, in Living Lessons from the Word, on the spine of Jesus' own three speeches — and it quotes no historian at all.**

- **Only the Word is quoted, and that is a contract, not a preference.** The only text that could be read word for word is the King James corpus on this machine. We hold no Josephus and no Tacitus. So **every double-quoted span in the entire module resolves verbatim to the corpus** — 452 of them, asserted across every string in the lesson and not only the prose a reader scrolls — and everything from the two historians is paraphrased in our own words and credited to the man who wrote it. This is deliberately a **stronger** contract than the not-Scripture allowlist a spoken-source lesson rides (cf. `ll257`): an allowlist declares which quotations are not Scripture, and this lesson declares that there are none. The gate proves the claim rather than restating it, by checking every span against the corpus itself, and a mutation case shows that one sentence of Josephus in quotation marks fails it.
- **Ten movements, identical in all five reader places.** He said it about the stones they were admiring; He wept while He said it; the warning was also a way out; He said when and why He told them early; what the historians wrote down; the Word had already said what this looks like; this is not a reason to look down on anyone; stop where the Word stops; what was still standing when the stones came down; so what do we do with it. A reader opens **one** band, so each band carries the whole spine in its own register.
- **The tears come before the siege works, in every band, and the gate asserts the order.** Luke 19:41 precedes Luke 19:44 everywhere. The order is the teaching: a prophecy of ruin can be delivered in triumph and this one was not, and the clause He actually assigns the cause to is *"because thou knewest not the time of thy visitation"* — a missed visit, never Rome.
- **The guard against contempt is installed from the Word, in every band.** Romans 11:1, 11:20-22 and 1 Corinthians 10:11-12 are pinned in all five places, and each place must name the posture it forbids. Covenant judgment taught without that guard is how this subject has fuelled cruelty for centuries; the correction is Paul's, not ours.
- **The dispute is named once, to get past it, and no camp is named.** The lesson says the passage has been read more than one way and then teaches the two columns the text itself gives: the stones, the encirclement, the flight, the sword, the captivity and the city trodden down happened within the generation He named; the darkened sun, every tribe seeing the Son of man, the angels gathering the elect and the resurrection of Daniel 12:2 did not. Then it stops. No party label appears anywhere — the gate pins the absence of *preterist*, *futurist* and *dispensational* in our own prose — and no date, year or countdown is offered. His own first answer to a question about timing was a warning about people who would answer it (Matthew 24:4-5; Luke 21:8), and the lesson says so.
- **Gravity without appetite.** The famine is one sentence in the adult lesson and the prose says out loud why it stops there: dwelling on it "would dishonour the dead and the One who wept." The **child band carries no casualty figure and no famine detail at all** — both pinned absent — while still refusing to pretend nothing happened ("Many people were hurt and many died... We do not make it fun"). Philippians 4:8 was run against our own prose here specifically, on HONORABLE and PURE.
- **Placed in Living Lessons rather than World Issues or the century spine, on purpose.** The subject is a passage of Scripture taught Word-first for a reader of any age, not a current event to be discerned and not a timeline row. Living Lessons is also the only course carrying the four-band ladder plus the parable and facilitator shape this material needs, and it sits one hop from the two lessons it cross-references.

## Impact

- The house now has its **direct treatment of AD 70**, built on the one thing nothing else held: His own words, His own deadline, and His tears. 89 verses, 452 verified spans, four bands, two parables, a seven-question quiz and a facilitator run sheet.
- **A reader in any band gets the whole spine**, including a six-year-old, who receives the prophecy, the tears, the rescue, the fulfilment and what outlasted the stones — and none of the horror.
- **The provenance names its road** (DR-1206): the row id and the research item are recorded here, in the session note, and in the facilitator's run sheet where a steward can find them, and never in the reader's prose.
- A new gate, **`living-lessons-ll263-not-one-stone.test.js`**, with six cases proven to catch.

### Limits, named rather than left

- **No primary source for Josephus or Tacitus was read.** This house holds no copy of either, the sandbox has no route to fetch one, and nothing of the sort was pretended. Every statement about what they record is reported at the level of the well-attested content of *The Jewish War* and *Histories* and is **credited, paraphrased and never quoted** — which is precisely why the lesson quotes neither. The established facts above stand on their own as some of the best-attested events of antiquity; the single-source details stand explicitly on one man's report. **`re-review: 2026-12-15`** — if a primary text is ever brought onto a machine we control, the paraphrases can be upgraded to cited quotations, and the no-historian contract in the gate would then need an explicit, verifiable exception rather than a quiet one.
- **The casualty figures are not ours.** They are reported as Josephus's count and are debated among those who read him. The lesson asserts no number and the gate pins that it never states them as its own.
- **The omens are left uninterpreted, and that is the honest stopping point**, not a hedge. That two unsympathetic writers converge on one strange list is a real feature of the record and is stated as such; what it meant is not in the Word, so it is not in the lesson.
- **The speaker in the source video is not named anywhere**, because nothing that reached us names him. No affiliation, conviction or motive is attributed to any living person — the correction that had to be made on World Issues 21 is not repeated here.
- **The ninth of Av, the Pella tradition and the Missler pattern frame were all dropped**, each for a stated reason above. A later session that wants any of them must bring a source, not a recollection.
- **The unfulfilled half is left unfulfilled.** The lesson deliberately does not resolve it, schedule it or assign it to a school of reading. Someone looking for a position on the millennium will not find one here, and that is the decision rather than an omission.
- **One judgment call about where the ids live.** The brief asked that the provenance name the row id and the research item. `quotation-integrity` forbids record ids in reader prose and a raw uuid in a lesson paragraph is noise to the reader, so both ids sit in the **facilitator's run sheet** (a steward's surface, deliberately out of that check's scope) and in this record, where `grep` looks. The reader's provenance paragraph names the road in words.

## Verification

- **452 referenced spans, 0 verbatim faults**, checked against `app/public/bible/kjv` across every string in the module, not only the prose a reader scrolls. **0 uncited quotations** anywhere in the module — the no-historian contract holds mechanically.
- **`anchor.ref` is exact in both directions**: 89 verses named, 89 verses quoted, nothing claimed that is not quoted and nothing quoted that is not claimed, so Search it out derives real links (DR-0734).
- **All four bands present from the first commit** (P60), each clearing its fullness floor, each naming its own lesson, the reading ladder ascending 0.44 → 4.08 → 5.82 → 8.26 with the child band under the 5.0 new-lesson ceiling, and the worst band overlap 0.12 against a 0.5 ceiling.
- **TALK ABOUT IT TOGETHER in all three directions on the lesson AND on each of the four bands** (DR-0733 / DR-0795), with the skill and the rhythm in each.
- **Zero bright-line violations** (DR-0210 / DR-0076): `Yahweh` appears in our own voice in all five places; the generic "God" and the title "the LORD" appear **only** inside quotations, where the corpus put them; no adversary name is capitalised anywhere; Jesus is confessed as the Lamb of Yahweh and the Eternal Son of Yahweh in every place.

### Proven to catch (DR-0076 §3)

Six mutation cases, each asserting its anchor exists before mutating it, so none of them can pass vacuously:

1. **An altered word in a quoted verse** — Matthew 24:2's "thrown down" changed to "cast down" in `bigIdea`; the check names the exact field and reference, `bigIdea :: Matthew 24:2`.
2. **A sentence of Josephus in quotation marks** — a control phrase verified ABSENT from the corpus first, then added with a citation; the corpus check names it and nothing else. This is the case that makes the no-historian claim a measurement instead of a sentence.
3. **A dropped movement** — `EIGHT. STOP WHERE THE WORD STOPS` removed from the teen band alone; the check returns `['teen']`.
4. **One band's friend line stripped** — the youth band reduced to its direction-less sentences; `hasAllThree` on the pooled module **still reads green**, which is exactly the DR-0795 hazard, while `placesMissingDirections` names `{place: 'youth', missing: ['friends']}`.
5. **A trimmed band** — the youth band cut to 500 characters; `shortBands` names `youth`.
6. **A casualty figure leaked into the child band** — "Over a million died" appended; the per-band check names `child` where it reads clean today.

Plus two corpus-reality cases carried from the house pattern: a straightened apostrophe in `Ezekiel 10:19` no longer matches the corpus, and a lowercased opening of `Matthew 24:16` no longer matches it — so the curly marks and the capitals in every quotation above are real rather than assumed.

## The number moved twice, and two assignment claims did not survive checking

Recorded because it cost a renumber in each direction, and the cause is structural.

The id assigned was **ll263**. Mid-build a correction said lesson numbers must run **contiguously**
above ll258 — `living-lessons-numbers-are-unique` pins `KNOWN_GAPS` at two entries (211, 212) and
treats any other unclaimed number between the min and the max as a hole — and told each builder to
**compute the lowest free id**. Measured then: siblings held ll259, ll261 and ll264, so the lowest free
id was **ll260**, and the build was renumbered to it. A final fixed assignment restored **ll263** and
withdrew the rule, because **five of eight parallel builders computed the same answer at once** — the
race a central register exists to prevent. The sibling on the ll264 branch had already renumbered onto
ll260 under the same instruction, so ll260 was never safely available.

Two claims in the final message were checked rather than taken on trust, and both came back against it:

- **`ll259` and `ll260` were said to have landed as #2414 and #2415.** Neither PR exists, and
  `origin/main`'s `living-lessons-dates.js` still ends at `ll258`. Nothing above ll258 has landed.
- **`DR-1224` was assigned as final, and it is held by an unlanded sibling branch**
  (`origin/claude/ll260-the-judgment-seat-and-the-reward`). `node scripts/claim-decision-number.mjs`
  reports it; a local `grep app/src/lib/` cannot see an unlanded branch at all, which is the whole
  reason that tool exists (DR-1136, DR-1147). Taking DR-1224 would have been the nineteenth collision
  of the week.

So this record stays on **DR-1223** — confirmed free on disk *and* in flight by the same tool, and this
build's first assignment — and the DR-1224 collision is **reported rather than resolved unilaterally**,
which is what the instruction itself asked for. If the central register wants this record on another
number, `node scripts/renumber-decision-record.mjs 1223 <to> --file DR-1223-not-one-stone-the-word-jesus-spoke-over-jerusalem-l263.md`
is the four-edit move DR-1021 made a tool.

**This gate asserts no contiguity and no neighbour's number**, on purpose: a pin on "nothing comes
after me" is a pin on the catalog never growing (the ll256 lesson). Holes are registered and retired
centrally; if `unclaimedNumbers` flags a lower id, that is the register's to close, not this lesson's.

## What this does not do

- **It does not re-teach `ll127` or `ll140`.** The burned genealogical archive and the times of the Gentiles belong to them; this lesson names both by title and sends the reader there.
- **It does not rule on the unfulfilled half of Matthew 24**, and it does not hand anyone a date, a chart or a camp. That is the decision, not a gap.
- **It does not label the row captured.** The `agent_inbox` tagging happens after the deploy, by exact commit, and belongs to the coordinator (P62).
