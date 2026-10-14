# 2026-10-14 — L79: the hole closed, and the two checks that closing disarmed

**Record:** DR-1022 · **Branch:** `claude/account-backup-storage-purge-xr35o0` · **Base:** `63245eb7f` · **Tier:** B/C, pushed with `hold`

## What this session was

A backlog drain that turned into a build. The gap check added to `living-lessons-numbers-are-unique.test.js` on 2026-10-13 printed `79, 211, 212`, and 79 had been silent since 2026-08-14 — the series claimed 1 through 238 and simply skipped it. The lesson meant to fill it sat in PR #1255 on a branch whose own catalog held 81 modules against main's 238, so that file could never be merged. Only the module could be mined out of it, and this is that.

## The correction I owe first

On 2026-10-13 I deferred this lesson with the estimate "~10,000 words." That number came from the adult band's **4,347 raw words**. The coverage floors are shares of adult **prose** — `proseWords`, with quotations stripped — which is **3,240**. The real job was about 4,300 authored words across four bands. The deferral was wrong on its own arithmetic, and the lesson could have shipped a day earlier. Stated plainly rather than quietly fixed.

## What shipped

`ll79-justice-and-righteousness-travel-together` — *A Gospel With a Hole In It — Why Justice and Righteousness Travel Together*, anchored on Jeremiah 22:16 and Matthew 23:23 — spliced between ll78 and ll80. The catalog goes 238 → 239.

The mined text was one 4,347-word adult paragraph whose `FIRST,`/`SECOND,` pairs repeated four times and numbered 1, 2, 1, 2; no stories; four bands below the floor. Rebuilt into **twelve movements marked `ONE.`–`TWELVE.`, in the same order in all five places**, with two parables written because all 238 other Living Lessons carry at least two and this one had none.

| band | prose words | share | floor | FK |
| --- | --- | --- | --- | --- |
| adult | 3,240 | — | — | 7.2 |
| child | 1,977 | 0.61 | 0.50 | 4.2 |
| youth | 2,628 | 0.81 | 0.60 | 6.3 |
| teen | 2,122 | 0.65 | 0.60 | 6.3 |
| senior | 1,992 | 0.61 | 0.60 | 11.1 |

`shortBands` empty · `isInverted` false · child under the 5.0 ceiling a NEW lesson is held to · `unnamedBands` empty · differentiation worst 0.16 against 0.5 · `placesMissingDirections` empty · **248 referenced spans walked against the local KJV, zero that are not His words, zero elisions anywhere in the module**.

## The sixteen quotation defects, closed rather than ratcheted

The curriculum gate refused the assembled module with five FRESH faults, and reading it properly turned up fifteen:

- **Nine elided quotations** in reader-facing fields and **six more** in the benefits, the quiz and the facilitator's notes — spans carrying `...`, which DR-0459 forbids. Every single one had a contiguous verbatim span available, and the remedy was always to quote a little MORE of the verse rather than less. The best of them: Leviticus 25:10's "it shall be a jubile unto you" — the elision had cut out exactly the clause the surrounding prose was already asserting.
- **Six recited record ids.** The lesson and the senior band printed "DR-0076 §8" and "DR-0098" at a reader. The rules were right; the citation is our bookkeeping. The check written here is **wider than the gate** — the gate scopes the id check to reader fields on the ground that a record id is not noise to a facilitator, and this lesson holds itself to the whole module, which found two more in the quiz and the first talking point.
- **A period inside Galatians 2:14, three times.** The verse continues with a comma; `the truth of the gospel."` is not His punctuation.
- **Our ALL-CAPS emphasis inside His words, twice** — Ephesians 2:10 as "created in Christ Jesus UNTO good works", 1 John 3:7 as "he that DOETH". His text shouts neither. The emphasis moved out of the quotation marks; the verses are quoted as written.
- **The host sentence's comma inside Acts 6:1**, in the facilitator's run sheet — caught by `living-lessons-quoted-terminal`, a ratchet I had not thought about, on a span the facilitator reads ALOUD to a room.

Of the quoted spans carrying no reference, 44 are verbatim KJV and 16 are enumerated by hand as our own phrases and reported speech. Enumerated rather than waved at, because the real danger an unreferenced quotation hides is a mangled verse — and three were caught doing exactly that before the list was written.

## Eleven hollow claims, answered by authoring

The lesson's own gate failed eleven claim checks on the assembled module, and in every case the band had **quoted the verse and never said the thing in its own voice** (DR-0381):

- the wall came DOWN rather than up — only the child band said it; adult, youth, teen and senior leaned on Ephesians 2:14 to say it for them
- the last scene already shows every nation together — the same, with Revelation 7:9
- justice ranked above the offering — adult and youth, leaning on Proverbs 21:3
- the division of provenance (theirs / ours) — youth and senior
- the Greek names of the seven — the child band
- a body cannot have one member suffering alone, and feeling bad is not the deed — the senior band
- the injury granted as real and as sin — the teen band

All answered by writing prose into those bands. **Two of the eleven failures were my own check's fault**, not the lesson's: a regex listed "than sacrifice" and "all nations" while the prose that teaches those claims says "ranked above the offering" and "every nation". Widened; the prose was already right.

## The real finding: three checks keyed on the hole — and I under-counted it twice

Three checks asserted something TRUE about the hole in order to prove a claim about something else. I found the first, said "two", found the second from shard 2, and only the full suite turned up the third:

| check | what it pinned | what filling 79 did to it |
| --- | --- | --- |
| `living-lessons-order.test.jsx` | `not.toContain(79)`, and L192's `week` is not 192 | **disarmed** — every later lesson moved up one, so **L192's position became exactly 192** and the defect the test exists to catch went invisible at its own worked example |
| `continue-a-lesson-numbers.test.jsx` | "L192 sits at array position 191" | **disarmed** the same way, by the same shift |
| `the-lesson-count-is-derived.test.jsx` | `GAPS` must contain 79 | stale — the arithmetic claim was sound, the gap it named was not |

`KNOWN_GAPS` and `KNOWN_MISSING` are NOT in that table: they are shrink-only ratchets, and the second one's check "no number in the record has quietly been filled" is what demanded the entry be deleted — the convention working, for the fourth time.

All three are re-armed on evidence that cannot expire: the holes still open (211, 212), and a drifted lesson **found** rather than pinned, with `ownNumber` asserted for every one of them. A check whose evidence can expire stops meaning something while still printing green — which is the same class as a gate that always passes.

## Three decisions worth naming

1. **The date is the SLOT day, 2026-08-15, not the 2026-10-14 commit day.** Recorded on the ground the L153/L164/L189 lines stand on, and it keeps the product claim true that in number order the days never go backwards — which is what lets the app offer "By number, oldest first" as one order instead of two. It is the **only** line in `living-lessons-dates.js` that is not a commit day, and a paragraph at the head of that file says exactly that so nobody later reads it as one.
2. **The explicit movement markers STAY**, against sov39's rule for itself. `lesson-format.js` lets explicit markers win outright and switches the caps-lead heading pass off entirely; this lesson uses ALL-CAPS for in-text emphasis in dozens of places. Removing the markers would not tidy it, it would shred it. The check pins them and says why.
3. **It goes to the Governor under `hold`.** The lesson names The Church of the Living God, says the room contains people who have lived what it describes, names Dr. Manny Scott and Dr. Bruce Fields, and **dissents in print** from Scott's conclusion on multi-ethnic churches — received as testimony and not corrected as doctrine, while saying plainly it is a conclusion from experience rather than a claim the Word makes. Tier B/C. The gates are the brake; this is the hand.

## Evidence

- `living-lessons-l79-verses` — **53 green**. Proven to catch four ways, each a defect the lesson actually had: a band that stops naming its lesson; the movements landing out of order (and note what the COUNT check misses — the renderer finds a marker mid-paragraph, so a glued band still renders twelve and only the ORDER betrays it); the two caps drifts and the Galatians period; and the claim checks, eleven of which failed before the prose was written.
- `curriculum-cli --gate` **PASS** — 50 courses, 806 lessons, 56,084 spans.
- `npm run verify:gates` — **20 gates green**. `npm run lint` — clean. `npm run lesson-dates` — **806 of 806 dated, 0 undated**.
- `course-band-coverage-baseline.allFour` stays **237**, verified by regenerating it. An earlier note in this session assumed it would move to 238; it does not — that baseline measures the catalog courses, and a Living Lesson does not touch it.

## Left open

- **PR #1255 is not closed by this, and my own guess about why was wrong.** I wrote that its spoken teaching "appears to be already at `ll78`", then ran the re-review early instead of waiting for its date — and the measurement disproves it. #1255 is "L77-L79 captured teachings": L77 landed as `ll77-the-king-over-the-children-of-pride`, L79 is this lesson, and L78 landed as `ll78-the-snare-of-the-fear-of-man` carrying the fear of man, Moses, Proverbs 29:25 and 2 Timothy 1:7 — **but not the thesis Darrell actually spoke**, which the PR records in his words as "shyness can be pride, and mostly is". Checked against all 239 modules, four strands of that sitting are absent from the whole series:
  - **Exodus 4:11-14** — "the anger of the LORD was kindled against Moses", anger at what presented as modesty, the decisive case for the thesis. (4:11 appears in ll164 on another subject; 4:14 nowhere.)
  - **the Saul arc** — 1 Samuel 10:22 "hid himself among the stuff"; 13:11-13, an explanation factually true in every clause with Yahweh's timing left out; 15:23. Absent entirely.
  - **John 8:54** — "If I honour myself, my honour is nothing". Absent entirely.
  - **James 3:13** — "shew out of a good conversation his works with meekness of wisdom". Absent entirely.

  These are his own spoken words, and the covenant is that he speaks them here because they get built. So this is not a date to wait for — it is the next lesson, taken up after this push. #1255's file stays unmergeable regardless: 110 files, 4,088 additions against 6,855 deletions. `re-review: 2026-10-17` — confirm it is built and #1255 closed.
- **211 and 212** want the same look 79 got. Same date.
- Nothing here touches the live site. `#2057` still darkens every NAS-backed road and is unrelated.
