# DR-1226: Jericho's Barred Gates — A City's Fear and One Woman's Faith (ll265)

**Date:** 2026-10-27
**Status:** accepted
**Tier:** A (additive curriculum: one new Living Lessons module, dated, with its own gate)
**Type:** curriculum
**Area:**
- `app/src/lib/living-lessons-class.js` (`ll265-jerichos-barred-gates-a-citys-fear-and-one-womans-faith`, appended after ll258)
- `app/src/lib/living-lessons-dates.js` (ll265's line, 2026-10-27, the day it was built; plus one mangled comment from ll258's commit put back on its own line)
- `app/src/__tests__/living-lessons-ll265-jerichos-barred-gates.test.js` (its gate)
- `docs/99-session-notes/2026-10-27-living-lesson-ll265-jerichos-barred-gates.md` (the build log)

**Amends:** nothing. Grounds: DR-0076 (every verse fetched verbatim from the repository's own KJV corpus; measure, don't claim; name the method's limits; proven-to-catch), DR-0098 (teach the Word, do not debate it), DR-0100 (state established fact plainly; flag the genuinely open narrowly; let the Word correct the claim while the true data under it stands), DR-0192 (the trust-but-verify pass runs BEFORE first ship on any research-sourced lesson), DR-0210 (Yahweh in our own voice; the quotation untouched), DR-0734 (`anchor.ref` names every verse the lesson stands on), DR-0795 (the three directions in every band), DR-1206 (the witness belongs to the road), DR-1219 (a waiting teaching is built, not watched).
**Sent in by:** Darrell — a link about Jericho, sent **inside the PoeTech app** down the research road, under his one word: **"Lesson."** `agent_inbox` row `b92957a6-4b8b-4b27-a5de-6f74cb6c0e54`; Research item `bc549bd8-f06e-472b-87c1-4f13c21c977e`. The row waited about ninety hours in the lesson queue (DR-1219's finding) and is built here. (The road's own identifier is named here so `grep` answers *"have we already built this?"* offline, per DR-1206 — and a research-road record names its row, never a Gmail thread it never had.)

## Context

### What the research road actually returned, and what it did not

The road returned one thing: an **auto-generated caption transcript** of a YouTube video, 5,116 words, source `youtube-asr`, fetched **on the NAS from its residential IP** because the CI path is YouTube-IP-blocked (`infra/nas-loops/services.json`, transcript-trickle). Four limits travel with it and are named in the lesson's own run sheet rather than hidden:

1. **No timestamps.** That route joins the caption segments, so nothing in this lesson is cited to a minute mark.
2. **A machine's hearing, not the man's text.** Auto-captions mis-hear. So **no wording is quoted from the speaker as his own**; his argument is described, never put in quotation marks.
3. **The speaker is nowhere identified.** The transcript names no speaker. He mentions having recorded the audiobook of *Dynasty of Slaves*, and that is the whole of what the material says about him. Accordingly this lesson calls him what he is — the man speaking in the reading — and **attaches no name, affiliation, faith label or motive to any real person**, which is the exact correction World Issues 21 had to take.
4. **No second reading.** The item's own note says the reading was "not made yet (the tower had not answered); the source below is the whole of the research." So the transcript is the entire evidential base, and it is treated as one witness to be tested.

### The material's thesis

That Jericho was a place defined by a recurring cycle of fear and destruction for thousands of years before Israel arrived: twenty-odd settlement layers under Tell es-Sultan, a very early stone tower and wall, a position at the foot of hill country the biblical text fills with large peoples, an Egypt that garrisoned the valleys and left the highlands alone, a gate barred every night, a curse over the ruins that landed on Hiel four centuries later, and Rahab as a woman who read the situation correctly and walked away from broken ground.

## SHOULD → ARE → GAPS → CLOSE (DR-0219)

**SHOULD.** A research-sourced lesson is Word-first at the sov9/sov10 standard, in all four bands, with every verse verbatim from the corpus on disk and pinned; every external claim verified, tiered and attributed; and the trust-but-verify pass run **before** first ship (DR-0192 — it had never run on this row).

**ARE.** The pass was run on this material, claim by claim, and it produced three places where the lesson must say less than the source does and one place where the Word corrects the source outright.

**GAPS, named plainly.**

1. **The dating.** Kenyon's destruction layer at roughly 1550 BC, and whether it lines up with Joshua, is the single most argued point in Levantine archaeology. The source concedes the pushback and then says the layer "is significant to the biblical dating" anyway. That is the over-claim DR-0190/DR-0192 exist to catch.
2. **The highlands.** The source's own strongest move is an argument from silence — no giant is ever connected to Jericho itself, therefore Jericho was an undefended city beneath giant country. It says so honestly ("maybe I'm reading too much between the lines"), but a lesson that adopted it would be teaching a reconstruction as Scripture.
3. **The chronology aside.** "This site either predates the flood or the flood happened much longer ago than many of us have calculated," and "Thutmose III, the pharaoh that I believe Moses fled from," are both reconstructions the Word does not make. The Word names no pharaoh there and gives Jericho no founding date.
4. **The closing application.** "She got out before the destruction reached her." The text says the opposite.

**CLOSE.** All four, in the lesson and in its gate.

## What was measured

Every verse was printed from `app/public/bible/kjv` by a scratchpad resolver **before a sentence was written**; the lesson quotes from that output and never from memory. The draft module was then run through the repository's own gate scripts in the scratchpad **before it touched the catalog**:

| check | measured |
|---|---|
| referenced spans / verbatim faults | 322 / 0 |
| fullness child / youth / teen / senior (floors 0.5 / 0.6 / 0.6 / 0.6) | 0.53 / 0.63 / 0.89 / 1.21 |
| authored-prose grade child / youth / teen / senior (child ceiling 5.0) | -0.31 / 3.20 / 5.42 / 8.56 |
| worst band overlap (ceiling 0.5) | 0.10 |
| bands not naming the lesson in their opening | none |
| places missing one of the three directions | none |
| elisions / recited records / straight apostrophes inside a quotation | 0 / 0 / 0 |
| generic "God" in our own prose, any band | 0 |
| core references absent from any band (39 checked) | 0 |

**What the checks caught while writing.** The first draft's child band measured fullness **0.42** against a 0.5 floor — short, by measurement, while reading as complete. It was written out in its own register (not padded from the adult text) to 0.53, and the youth band was carried from 0.61 to 0.63 for margin. Three references were anchored but never named in the lesson (Joshua 2:1, Joshua 2:3, Isaiah 60:11); all three were worth quoting and are now quoted, which is why DR-0734's rule is a gate and not a habit.

**Duplicate check, and what makes this lesson its own.** Jericho appears in eight existing Living Lessons and Rahab in two, so the catalog was measured rather than assumed: `ll140` carries Rahab 12 times **as a precedent for the nations counted into Judah** (Matthew 1:5 beside Caleb and Ruth); `ll190` and `ll256` use the Jerusalem-to-Jericho road for the parables; `ll75` is the unfinished conquest; `ll125` and `ll168` use the Captain outside Jericho (Joshua 5:13-14). **Nothing in the catalog teaches the city itself.** Hiel appears nowhere at all, Joshua 6:26 nowhere, Hebrews 11:30 nowhere in this frame, and Joshua 2:9-11 — Rahab's own confession about the whole population — nowhere. That gap is this lesson.

## The decision

**The lesson is built on the one contrast the material contains and the Word states outright: fear was the city's condition, and faith was one woman's turn.** Jericho heard the same report Rahab heard — she says so herself, and about everybody rather than about herself, "your terror is fallen upon us, and that all the inhabitants of the land faint because of you" (Joshua 2:9), "our hearts did melt, neither did there remain any more courage in any man" (Joshua 2:11), and it reached past her city too (Joshua 5:1). The city barred its gate; she hid two of His men under flax. Hebrews 4:2 names the difference without us having to invent one: "the word preached did not profit them, not being mixed with faith in them that heard it." That preaches with no embellishment at all, which is why none is added.

Ten movements: the gate shut every night (Joshua 2:1, 2:3, 2:5, 2:7, 2:15, 6:1) → the whole city had heard (Joshua 2:9-11, 2:24, 5:1; Exodus 15:14-16; Deuteronomy 2:25) → the same report, two answers (Joshua 2:4, 2:6; Hebrews 4:2; Romans 10:17; Hebrews 11:1, 11:6, 11:31; James 2:25-26) → what the Word says about the hill country and where it stops (Numbers 13:28, 13:31-33; Deuteronomy 1:28, 9:1-3; Joshua 14:12; Deuteronomy 29:29) → a token in the window (Joshua 2:12-13, 2:18-19, 2:21; Exodus 12:13; Joshua 6:17; Acts 16:31) → **she was not saved by leaving** (Joshua 2:15-16, 2:22; 6:20, 6:22-23, 6:25) → the walls fell by faith, not by siege (Joshua 6:2, 6:5, 6:16, 6:20; Hebrews 11:30; Proverbs 18:10-11; Psalms 20:7) → the curse and the man who tested it (Joshua 6:26; 1 Kings 16:34; Genesis 15:16; Joshua 24:11) → mercy kept coming back to that ground (2 Kings 2:19-22; Luke 10:30, 18:35-42, 19:1-10; Matthew 1:5; 2 Peter 3:9) → the practice (2 Timothy 1:7; Psalms 56:3; Joshua 1:9; Acts 17:11; Deuteronomy 6:7; Proverbs 27:17; Isaiah 60:11; Revelation 21:25).

**The four restraints are decisions, not omissions, and each is pinned.**

- **The archaeology is stated in two halves.** Established and said plainly (DR-0100 tier 1): Tell es-Sultan is genuinely among the oldest settled sites excavated anywhere, its early stone tower and defensive wall are real and were built astonishingly early, and the mound is settlement upon settlement, fortified and burned and rebuilt. Genuinely open and said narrowly (tier 2): the date of the destruction layer, and whether it aligns with Joshua, is the most argued point in that field; the principal excavators disagreed and it is unresolved. **The lesson states in its own text that it does not claim the spade proved the Book**, and the gate asserts both the naming of the dispute and the absence of any "archaeology proves the biblical date" sentence.
- **The hill country is taught as written and no further.** Numbers and Deuteronomy describe tall peoples and fortified cities; Deuteronomy 9:3 gives the answer, which is a Person crossing over first. Scripture never stations one of those peoples on Jericho's wall, never names a defender of the city, and says nothing of their origin — so the lesson says so and builds nothing on the silence (Deuteronomy 29:29). **No Nephilim framework is imported**; Genesis 6 is another lesson's ground and this record takes no side in it. The gate refuses the word and refuses any sentence placing a giant at Jericho.
- **The chronology asides are left out entirely.** No flood date, no pharaoh identified, no founding date for the city. The Word makes none of those claims here and neither does the lesson.
- **The closing application is corrected by the Word, and the true thing under it stands (DR-0100 tier 3).** The source has Rahab walking away from broken ground before the walls fell. The text has her letting the spies down and **staying** (Joshua 2:15), sending them to a mountain she did not go to (Joshua 2:16, 2:22), gathering her family into the condemned city under a scarlet line (Joshua 2:18, 2:21), waiting there through seven days of marching, and being **fetched out of the wreckage afterwards, by name and under oath** (Joshua 6:22-23, 6:25). That is a rescue, not an evacuation, and the distinction is the shape of the gospel: the token was given to her, the oath was sworn over her house, and her whole contribution was to trust it and stay under it. What survives of the source's point, and is taught: she changed sides while there was still time, and she acted instead of waiting. What is refused: the lesson is not a self-help point about leaving bad situations.

**Typographic theology, with the source conflict surfaced rather than copied through.** The material writes "Baal worship" capitalised. CLAUDE.md is senior to the source, so the false god is never capitalised here; in the event the Bethel-and-Ahab strand is carried by 1 Kings 16:34 alone and the name is not used at all. The gate asserts that no false god and no name of the adversary appears capitalised anywhere in the module.

**Two stories that teach it rather than decorate it.**
- **The Key on the Kitchen Nail** (light; Hebrews 4:2): eleven lodgers, one card, ten who read the first half and stood out in the cold all winter, and one who asked for the key on her first night. Nobody was lied to or left uninformed. That is Jericho and Rahab with no walls in it.
- **The Stake in the Grass** (solemn; Joshua 6:26): a man who buys the lot the creek has taken three times, with the flood line staked in the grass and the record nine minutes away, and whose sons pay for the floors twice — Hiel's shape, without a word of claimed curse in a modern life.

## Impact

A reader meets, in their own band, the question the lesson is for: the news already reached you, so what do you do once it is dark? A child learns that the town shut the gate and one woman opened her door, and that Rahab is in Jesus' family. A youth learns that being informed and being frightened at the same time is a different problem from not knowing. A teen learns the difference between a report and an interpretation, and why an argument from silence is still an argument from silence. A senior gets the long view: a word spoken over rubble that stood for four hundred years, and mercy that kept returning to the same cursed ground until the Lamb of Yahweh sat down to eat in a house there. Every band ends on the inversion of the whole story — a city whose gates never need barring, because there is no night in it.

### Limits, named rather than left

- **The speaker is unidentified and stays that way.** He is not named, placed, or characterised anywhere in this lesson or this record. His one self-description in the material (the *Dynasty of Slaves* audiobook) is recorded here as what the source says and was **not** used to look anybody up; attaching an identity on that basis is the World Issues 21 mistake.
- **The transcript was not independently re-fetched.** It arrived md5-verified against the database, and that is the whole chain of custody: an auto-caption text, machine-heard. Any wording in it is therefore unquotable as the man's own, and the lesson quotes none of it.
- **The archaeology is reported, not verified by us.** The excavation history (Garstang, Kenyon, the dating dispute) was **not** checked against primary excavation reports in this build; no web research was run. What the lesson asserts is deliberately confined to what is uncontested at the level of "the site is very old, it was walled, it burned repeatedly," and the dating is named as unresolved rather than resolved in either direction. The twenty-plus layers, the 70-foot mound, the 30-foot tower, the 10,000-year figure and the Egyptian garrison sizes are the speaker's figures and **appear nowhere in the lesson as facts**.
- **Egypt's posture toward the highlands is not taught at all.** It is central to the source's reconstruction and it is a historical claim we did not verify, so it is absent rather than hedged.
- **"Four hundred years" between Joshua 6:26 and 1 Kings 16:34** is given as "about" / "roughly" throughout, because it is a chronology inference from the Book's own sequence rather than a figure the Book states.
- **The number is a central assignment, and this branch will land with the sequence gapped. Named, not hidden.** `ll265` is the orchestrator's exclusive assignment to this build; 259–264 are reserved for siblings mid-build and the holds are registered and retired centrally. The consequence is measurable and is stated rather than discovered: `living-lessons-numbers-are-unique` reads `unclaimedNumbers` over the catalog's own range, so until those siblings land, this branch's tree shows **six unclaimed numbers (259–264)** against a `KNOWN_GAPS` list that is deliberately shrink-only and pins its own length at 2 — which means that one gate is **RED on this branch by design of the assignment, not by a defect in this lesson**. Nothing was done to hide it: `KNOWN_GAPS` was not grown (growing it hands back the exact property it guards), the lesson was not renumbered for cosmetic contiguity, and the red is reported with the push. It clears when the sibling lessons land. The honest cost of parallel builders is a temporarily gapped sequence; the dishonest version would have been loosening the ratchet, and that is refused here.
- **The fullness proxy is a word-share**, not a measure of coverage; a band above its floor can still be thin, and the author's eye remains the judge (the gate's own header says so).
- `npm run lesson-dates` regenerates `lesson-dates.json` for the other courses; Living Lessons keeps its own dates in `living-lessons-dates.js`, so nothing of ll265 depends on that file.

## Proven to catch (DR-0076 §3)

`app/src/__tests__/living-lessons-ll265-jerichos-barred-gates.test.js` carries five separable breaks, each restored byte-identical afterwards:

| break | result |
|---|---|
| reword the child band's Joshua 2:5 quotation into modern English | red — the verbatim check names `levels.child :: Joshua 2:5` |
| substitute "Yahweh" into the quoted Joshua 2:11 (the DR-0076 bright line) | red — named by reference; the covenant name belongs in our prose and never inside His quoted words |
| trim the teen band to 600 characters | red — `shortBands` names `teen` |
| remove the senior band's friend-to-friend line alone | red — `placesMissingDirections` names `senior` / `friends`, which is DR-0795's whole point (the module pooled would still have read green) |
| add "Then God shut the gate." to the child band | red — the generic-name check fires in our own voice |

Plus the standing assertions that make the restraints enforceable rather than remembered: no `Nephilim` anywhere, no sentence placing a giant at Jericho, the dating dispute named, no "archaeology proves the biblical date" sentence, no capitalised false god or adversary anywhere in the module, all 39 core references present in **every** band, and every band closing on Revelation 21:25.

`re-review: 2026-11-10` — read ll265 on the live app in each band, and check two things specifically: whether the hill-country movement still reads as restraint rather than as a tease, and whether the archaeology paragraph in movement ten is the right length for a reader who did not come for archaeology.
