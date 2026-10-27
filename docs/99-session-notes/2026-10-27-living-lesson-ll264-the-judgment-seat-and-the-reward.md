# 2026-10-27 — Living Lesson ll264: The Judgment Seat and the Reward

**Module id:** `ll264-the-judgment-seat-and-the-reward-salvation-settled-service-measured`
**Record:** DR-1225
**Course:** Living Lessons from the Word (`app/src/lib/living-lessons-class.js`)
**Branch:** `claude/ll264-the-judgment-seat-and-the-reward`

## The road

Darrell sent a link **inside the PoeTech app**, down the app's own research road, on 2026-10-22. The row waited about 89 hours in the lesson queue before this build.

- `agent_inbox` row: `87ec8eb8-adf6-4edd-9b5a-62f09039ac9c`
- `Research item: 4aaf4014-f348-4958-aff6-db75dfd1fd11`
- What the road returned: the whole reading, fetched on our own machines from the NAS residential IP (the CI path is YouTube-IP-blocked). **4,465 words** of auto-generated captions, **no timestamps**, **no speaker name**. The row also carried the road's own summary of the material.

Because there is no name and no minute marks, the lesson ascribes the teaching to "one speaker" and cites nothing to a timestamp. No faith label, denomination, affiliation or motive is attached to him, and the gate asserts no title was invented for him.

## The second item on the row — NOT built, and it needs its own entry

Above the link, Darrell asked for a product capability: connections between historical events and Scripture locations, plus **parallel timelines** — one for the people who lived in the Word, another for when a scroll or other corroborating find appears. That is Project Management / app feature work, not teaching. It is named in the lesson's own provenance paragraph as product work that is not being taught, it is recorded in DR-1225, and **none of it was built**. It is still owed an item of its own.

## Was there a real increment? (DR-0610)

Measured before writing, because ll65 is genuinely close.

- **ll65** (*Processed for Righteousness*) read in full: the Son as Judge (John 5:22), works AND words as the evidence, the heart as the single root, 2 Corinthians 5:10 cited twice in passing. Its frame is the **salvation verdict**.
- **ll61** carries Romans 14:12 in an accountability frame; **ll245–ll258** read, none on this subject; **DR-0171 / DR-0130** hold the two-courts frame, which is accountability for wrongdoing and lives in `economics-class.js`.

| taught anywhere in `app/src/lib` before ll264 | count |
|---|---|
| `1 Corinthians 3:15` | **0** |
| `1 Corinthians 3:11` / `3:14` | 0 |
| the *bema*, or the judgment seat traced through Acts 18 | 0 |
| rewards distinguished from salvation as a doctrine | 0 |
| `scripts/lesson-already-built.mjs` | **WEAK — terms only** |

Verdict: the increment is real and it is the one scoped — the reward/salvation boundary, pinned on the verse that states both halves. ll65 is the reason it matters, not a reason to skip it: ll65 taught well can still be misheard as works deciding the verdict.

## Verification (DR-0076 / DR-0192)

Every verse fetched from `app/public/bible/kjv` before a sentence was written. The draft was run through the repository's own gate scripts in the scratchpad before it touched the catalog.

| check | measured |
|---|---|
| referenced spans / verbatim faults | 342 / 0 |
| straight apostrophes inside a quotation | 0 |
| quoted spans not standing beside a reference | 0 |
| fullness child / youth / teen / senior | 0.59 / 0.69 / 0.64 / 0.74 |
| authored-prose grade (child ceiling 5.0) | 2.3 / 4.6 / 6.1 / 8.3 |
| worst band overlap (ceiling 0.5) | 0.05 |
| places missing a direction | none |
| elisions / recited ids / generic "God" in our voice / capitalized adversary | 0 / 0 / 0 / 0 |

**Three faults the checks caught while writing:** a misspelling inside a quotation of Matthew 25:30 ("theeth"); eleven pinned spans carrying a terminal period the house convention places outside the quote; and the child and youth bands short of their fullness floors at 0.40 and 0.46, written out rather than padded.

### What was NOT verified, and what was dropped

- **Flagged, not asserted:** the reading's claim that the Corinth platform also crowned Isthmian victors and commended war veterans. The lesson says in four of its five places that it did not verify it. The historical picture is built from the corpus instead — Matthew 27:19, John 19:13, Acts 25:10, Acts 18:12 and 18:16, the same word rendered the same way, the platform Paul's own readers had walked past.
- **Named as standing knowledge, not an on-disk measurement:** *bema* as the Greek behind "the judgment seat". There is no Strong's or lexical corpus in this repository; only the English rendering is verifiable here. Taught as a word study, never substituted into a quotation.
- **Dropped entirely:** the Ahmose son of Ibana tomb parallel and its tie to "overcoming the Israelites... in the land of Goshen". That identification is a contested minority reconstruction, not established fact. Nothing of it is in the lesson, and the gate asserts its absence.

### Where the lesson stops because the Word stops (DR-0098)

- The **talents** parable supplies the commendation (Matthew 25:21) and the reckoning (Matthew 25:19); its ending (Matthew 25:30) is quoted and then explicitly left where the text puts it, because that is not a believer losing a reward.
- **castaway** (1 Corinthians 9:27) is taught as written — a man of full assurance still trained like one with something to lose — with no doctrine built on the Word's silence.
- No **timetable** relating the two scenes is invented.

## The gate

`app/src/__tests__/living-lessons-ll264-the-judgment-seat-and-the-reward.test.js` — **173 cases, all passing.** 71 pinned spans; 342 referenced spans verified verbatim; `anchor.ref` complete.

**Proven to catch on the live catalog file**, three mutations applied to `living-lessons-class.js` itself and each restored:

| mutation | gate's answer |
|---|---|
| saving half of 1 Corinthians 3:15 removed from the **teen** band alone | `teen drops the saving` |
| one letter altered inside a quotation of Acts 18:12 | `not His words as written` |
| "Yahweh" substituted into Ephesians 2:8 | `not His words as written`; `senior drops Ephesians 2:8` |

Two more are asserted in-file: a child band trimmed to 600 characters is named short; stripping one band's friend line names that band while the pooled check still reads green (DR-0795).

## Judgment calls Darrell should know about

1. **The lesson id ll264 is assigned centrally and is deliberately NOT the lowest unclaimed number.** The numbering gate requires contiguity (`KNOWN_GAPS` is `[211, 212]`), so while ll261–ll263 sit on unlanded sibling branches the `unclaimedNumbers` check will flag ids below this one. That is expected; holds are registered and retired centrally, and this lesson holds ll264 exclusively.
   **What it cost to learn that, recorded so nobody repeats it:** this build first followed a lowest-free-id protocol and moved ll264 → ll260 → ll259 → ll260 → ll262, every step forced by a measurement — the gate answering `expected [ 259 ] to deeply equal []`, then PR #2414 taking ll259, then PR #2415 taking ll260 and PR #2412 ll261. Each move was one scripted renumber across module id, dates key, gate filename and constants, record, INDEX link, note and branch. **The structural finding: with many builders self-assigning against a contiguity gate, “lowest free” is invalidated by a sibling push seconds after it is read — contiguity and concurrent self-assignment cannot both hold.** Central assignment is the fix, and it is now what governs.
2. **The record number DR-1225 was assigned centrally and CONFIRMED by the claim script, not chosen by it.** `claim-decision-number.mjs` reported *next free decision number: DR-1225*, highest on disk DR-1224, *free on disk AND in flight*, with the only sibling number at or above it being DR-1227 (`claude/ll261-...`) — so assignment and measurement agree. The record was written as DR-1224 first and moved with `renumber-decision-record.mjs 1224 1225` on a clean tree as its own commit; `resolve-ledger-conflicts.mjs` set the pointer to DR-1226 and the ledger guard read *newest DR-1225, pointer correct*. `grep -rn "DR-1224"` over this build's files returns zero.
3. **`added` is 2026-10-27, the day the lesson JOINED the course**, not 2026-10-22 when the link was sent. The field's own definition is the day it joined, and `datesFollowNumbers` requires the days to rise with the numbers — a 10-22 date here would break against siblings numbered lower and dated later. The sending day is in the record and in the lesson prose.
4. **The Egyptian material was dropped rather than hedged.** It was the only part of the reading that would have required relaying a contested reconstruction on a teaching surface.

## Open, with dates

- `re-review: 2026-11-03` — read L264 on the live app in each band; record the first reader who can state, unprompted, the difference between losing a reward and losing salvation.
- `re-review: 2026-11-10` — verify the bema's civic-honours use from a primary source and teach it, or leave the flag standing permanently; and decide whether ll65 and ll264 should cross-link.
- `re-review: 2026-11-24` — whether a Strong's / lexicon corpus belongs on disk, which would close this class of lexical claim for every future lesson.
- **Owed:** the parallel-timelines feature item from this row, captured as its own entry.
