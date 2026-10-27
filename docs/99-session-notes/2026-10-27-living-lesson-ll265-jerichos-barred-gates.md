# 2026-10-27 — Living Lesson ll265, "Jericho's Barred Gates — A City's Fear and One Woman's Faith"

**Module id:** `ll265-jerichos-barred-gates-a-citys-fear-and-one-womans-faith` (`ll265`)
**Decision record:** DR-1226
**Course:** Living Lessons from the Word (`app/src/lib/living-lessons-class.js`), appended after ll258
**Source:** a link about Jericho that Darrell sent **inside the PoeTech app**, down the research road.
`agent_inbox` row `b92957a6-4b8b-4b27-a5de-6f74cb6c0e54`; Research item
`bc549bd8-f06e-472b-87c1-4f13c21c977e`. The row had waited roughly ninety hours in the lesson
queue (the backlog DR-1219 measured) and was built here.

## What the research road returned

One thing: an auto-generated caption transcript of a YouTube video — source `youtube-asr`, 5,116
words, fetched on the NAS from its residential IP because the CI path is YouTube-IP-blocked. The
item's own note says the second reading was never made ("the tower had not answered"), so the
transcript is the whole evidential base. Four limits travel with it and are stated in the lesson's
run sheet rather than hidden:

- **no timestamps** on that route, so nothing is cited to a minute mark;
- **a machine's hearing**, not the man's text, so no wording is quoted from him as his own;
- **the speaker is nowhere identified** — he mentions recording the audiobook of *Dynasty of
  Slaves* and that is the whole of it, so no name, affiliation, faith label or motive is attached
  to any real person (the World Issues 21 correction);
- **nothing he claims is asserted on his authority** anywhere in the lesson.

## The honest centre, which needed no embellishment

Jericho heard the same reports Rahab heard. She says so herself, and about the whole population
rather than about herself (Joshua 2:9-11), and it reached past her city too (Joshua 5:1). The city
barred its gate; she hid two of His men under flax. Hebrews 4:2 names the difference: the word did
not profit them, not being mixed with faith. Fear was the city's condition; faith was one woman's
turn. Hebrews 11:31 and James 2:25 are heaven's verdict on her, neither of them raising her
reputation as the issue, and Matthew 1:5 is where the lesson ends its mercy arc.

## The four places the lesson says less than the source does

1. **The archaeology.** Stated plainly: Tell es-Sultan is among the oldest settled sites excavated
   anywhere, its early stone tower and wall are real, and the mound is city upon city, walled and
   burned. Stated as unresolved: the date of the destruction layer and whether it aligns with
   Joshua. The lesson says in its own text that it does not claim the spade proved the Book.
2. **The hill country.** Numbers 13:28 and Deuteronomy 9:1-3 taught as written; Scripture never
   places one of those peoples on Jericho's wall, so the lesson says so and builds nothing on the
   silence (Deuteronomy 29:29). **No Nephilim frame** — Genesis 6 is a sibling's lesson and this
   one takes no side in it.
3. **The chronology asides** (a flood date, Thutmose III as the pharaoh Moses fled) are left out
   entirely rather than hedged. The Word makes neither claim here.
4. **The speaker's closing application** — that Rahab walked away from broken ground and got out
   before the walls fell — is corrected by the text, which has her **staying** under a scarlet line
   (Joshua 2:15, 2:21) and being carried out of the ruin afterwards (Joshua 6:22-23, 6:25). A
   rescue, not an evacuation. What survives and is taught: she changed sides while there was still
   time, and she acted rather than waiting.

## How it was built

1. Every verse was printed from `app/public/bible/kjv` by a scratchpad resolver **before a sentence
   was written**; the lesson quotes that output and never memory.
2. The draft was run through the repository's own gate scripts in the scratchpad **before it
   touched the catalog** (`full-levels`, `reading-level`, `title-in-narrative`,
   `band-differentiation`, `quotation-integrity`, `talk-together`). Final measurement:

   | check | measured |
   |---|---|
   | referenced spans / verbatim faults | 322 / 0 |
   | fullness child / youth / teen / senior (floors 0.5 / 0.6 / 0.6 / 0.6) | 0.53 / 0.63 / 0.89 / 1.21 |
   | authored-prose grade child / youth / teen / senior (child ceiling 5.0) | -0.31 / 3.20 / 5.42 / 8.56 |
   | worst band overlap (ceiling 0.5) | 0.10 |
   | bands not naming the lesson / places missing a direction | 0 / 0 |
   | elisions / recited records / straight apostrophes in a quotation | 0 / 0 / 0 |
   | generic "God" in our own prose, any band | 0 |
   | core references absent from any band (39 checked) | 0 |

   **What the measurement caught:** the first child band read as complete and measured **0.42**
   against a 0.5 floor. It was written out in its own register, not padded from the adult text, to
   0.53; the youth band was carried 0.61 → 0.63 for margin. Three references were anchored but
   never named in the lesson (Joshua 2:1, Joshua 2:3, Isaiah 60:11); all three were worth quoting
   and now are.
3. Spliced after ll258 in `living-lessons-class.js`; dated 2026-10-27 in `living-lessons-dates.js`
   (one mangled comment left by ll258's own commit was put back on its own line while there).
4. **The number.** `ll265` is the orchestrator's exclusive, central assignment; 259-264 are held for
   siblings mid-build and the holds are registered and retired centrally. Measured consequence,
   stated rather than discovered: until those siblings land, `unclaimedNumbers` reads six holes
   (259-264) against a shrink-only `KNOWN_GAPS` that pins its own length at 2, so
   `living-lessons-numbers-are-unique` is **RED on this branch by the shape of the assignment, not
   by a defect in this lesson**. `KNOWN_GAPS` was deliberately NOT grown (that would hand back the
   property it guards) and the lesson was not renumbered for cosmetic contiguity. It clears when the
   siblings land. (An earlier instruction said to take the lowest free id; this build did renumber to
   259 under it, then back to 265 when the fixed assignment replaced it. Both renumbers happened
   before any push and the worktree greps clean of every stale id.)
5. **Duplicate check.** Jericho appears in eight existing lessons and Rahab in two, so the catalog
   was measured rather than assumed: `ll140` uses Rahab as precedent for the nations counted into
   Judah; `ll190` and `ll256` use the Jerusalem-to-Jericho road for the parables; `ll75` is the
   unfinished conquest; `ll125` and `ll168` use the Captain outside Jericho. **Nothing teaches the
   city itself.** Hiel, Joshua 6:26 and Joshua 2:9-11 appear nowhere in the catalog at all.

## Suites run

`living-lessons-ll265-jerichos-barred-gates.test.js` (151 cases) and
`living-lessons-numbers-are-unique.test.js` (10 cases): **161 passed, 0 failed**, including all five
proven-to-catch breaks. Plus `npm run lint` and `npm run verify:gates` (28 guards).

**The full Vitest suite is delegated to CI** on the PR head, at the coordinator's instruction: nine
builders were running on one machine behind the `/tmp/kingdom-vitest-slots` mutex, and `ci.yml`
runs lint plus the whole suite in four shards and the lane cannot merge a red PR. The full suite was
**not** run locally and this note does not claim it was.

## Where it lives for Darrell

Church → Learn → Living Lessons → L265, "Jericho's Barred Gates — A City's Fear and One Woman's
Faith", in all four bands, with two parables ("The Key on the Kitchen Nail", "The Stake in the
Grass"), a seven-question quiz, seventeen benefits and the facilitator's run sheet. Its shelf is
Joshua (first anchor Joshua 2:5). Every band closes on Revelation 21:25 — the city whose gates never
need barring, because there is no night in it.
