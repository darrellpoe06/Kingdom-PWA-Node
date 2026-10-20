# DR-1126: The third pile is a worklist — the instrument that checks a figure exists, and is pointed at one lesson of 828

**Date:** 2026-10-20
**Status:** accepted
**Tier:** A (one derivation script, one gate; no surface, no schema, no money, not one word of any lesson changed)
**Type:** way

**Area:** `scripts/unchecked-claims.mjs` (new) and `app/src/__tests__/the-third-pile-is-a-worklist.test.js` (new).

**Grounds:** Darrell, 2026-10-20, reading **sov42** on his phone at step 6 of 31, where the lesson says of itself: *"THIRD PILE, WHAT WE DID NOT CHECK… WE DID NOT READ A SINGLE FULL ARTICLE"* and *"we did not telephone La Roche University, Berea College, Hampshire College, Harvard, any legislature or any department, and we reproduced none of the numbers."* His question: **"Why aren't we using the research space to do that whenever a lesson needs to? Opportunities and constraints… and what would that look like?"**
**Principles:** DR-0750 (every researched figure read back from its publisher's own page); DR-0076 §4 (measure, don't claim) and §3 (proven-to-catch); DR-0100 (state established fact plainly; under-claiming is as much a failure as over-claiming); DR-1101 / DR-1099 (the research road, and its `verified:false`); DR-0061 / P15 (reality-trace before building).

## Context

The question assumed a capability gap. The trace found a **coverage** gap, which
is a better problem to have.

**The instrument already exists.** `scripts/lesson-sources-witness.mjs` +
`lesson-sources-witness.yml` has a GitHub runner read every researched figure
back off its publisher's own front door, with a real browser's headers, and exit
1 when the page no longer says it. Its own rule: *"red means a figure no longer
stands on its source and the LESSON is corrected, never the check."* It even
treats a publisher refusing a machine (403/429/503) honestly — said, never
counted either way. And it has **no hardcoded lesson**: it is keyed by lesson id
out of `app/src/lib/lesson-sources.json`, so widening it is **data, not code**.

**The research road is a different instrument, and must not be mistaken for
this one.** `app/src/lib/research.js` says it in its own header: *"The road marks
every answer verified:false."* Vane searches our own SearxNG and answers on our
own model. Pointing it at a digest and asking "is this true?" yields a model's
summary of search results about somebody's summary of somebody's reporting —
**one remove further out than the third pile is already complaining about.**
Vane's honest output is the **sources**, not the verdict.

## What was measured

Measured 2026-10-20 on main `15141ac71`.

| | |
|---|---|
| Lessons that admit unchecked material in their own words | **9** (66 disclosures) |
| Lessons with a figure read back from its publisher | **1** (`ll207`, 4 rows, 10 figures) |
| The gap | **9 lessons** |
| Total lessons | 828 |

The nine: `sov32` (14 disclosures), `sov41` (11), **`sov42` (10 — the lesson on
his screen)**, `pm13` (7), `sov36` (7), `sov40` (7), `sov35` (6), `ll195` (3),
`ll193` (1).

**Only one of three machines can do the checking**, and the witness says so in
its own header: *"The NAS writer has no web, and the cloud sandbox cannot reach
epi.org or bls.gov; a GitHub runner can."* That single fact decides the
architecture, and it is why this record adds the counting and not the checking.

**A measurement of mine that was confidently wrong, and is now a case.** My
first count of the worklist reported **4** lessons and named **sov32** for a
disclosure that belongs to **sov42**. The catalogs hold lessons in **two record
shapes** — the JS literal (`id: 'sov32-…'`) and the JSON row (`"id":
"sov42-…"`) — and my pattern matched only the first. It did not fail. It
attributed every JSON-shaped record's disclosure to the nearest older literal
above it and answered in the house style about the wrong lesson. A pattern that
reads one shape of a two-shaped file is the quiet kind of wrong.

## Decision

**Count both sides and pin the gap; do not do the checking here.**
`unchecked-claims.mjs` derives `admits()` from the lessons' own words, `checked()`
from the file the witness actually reads, and `gap()` as the difference. The gate
pins the gap at 9 in both directions — a new lesson admitting unchecked material
is red, and a lesson gaining its sources is red with a message to lower the pin.

**The checked side is pinned separately,** because a silently deleted source row
does not move the gap. Measured: emptying `lesson-sources.json` turns the checked
pin red while the gap pin stays at 9. That is the pin earning its place rather
than being asserted to.

**Read both record shapes, and keep the one-shape pattern as a case.** `LESSON_ID`
matches both forms; the test holds the two parsers to genuinely disagreeing on a
fixture where one blames the record above, because that is the defect that
happened rather than one imagined.

**The chain this makes possible, for the record** — Vane finds the primary source
(asked for an institution's own page, never for a verdict) → the figure and its
URL become a row in the existing schema → the runner reads it back → red means
the lesson is corrected. The third pile then shrinks **by work rather than by
wording**, and what remains is specific instead of total.

## Impact

**What this buys.** sov42's admission stops being a confession and becomes a
counted worklist of nine, visible the day a tenth lands. The capability was never
missing; the list was. And the number that matters — lessons whose figures a
publisher's own page is read back for — is now pinned so it can only rise.

**What this does not do.**

- **It checks nothing.** Not one figure is verified by this change and not one
  word of any lesson is altered. The runner does the reading, and that is the
  next piece of work, lesson by lesson.
- **The Governor answered the one open question while this record was still
  unshipped: "ship and shrink."** A digest-built lesson ships with its third pile
  and the pile shrinks as source rows land. Recorded here rather than in a later
  record because it arrived before this one landed, so shipping it with the
  question still open would have shipped something already untrue.

  **That choice carries one failure mode blocking does not, and it is guarded.**
  "We reproduced none of the numbers" is true on the day a lesson ships; the
  moment one of its figures gains a row the runner reads back, the same sentence
  becomes false in the OTHER direction — the work was done and the page still
  confesses it was not. DR-0100: under-claiming a verified truth is as much a
  failure of truth as over-claiming an unverified one. So no lesson may both
  carry a total-denial phrase and have figures read back from a publisher,
  committed at ZERO rather than baselined (there is no such lesson today), and
  proven to catch by adding the denial to `ll207`, the one lesson that does have
  rows.
- **It does not wire the research road to the lesson lane.** Vane's only callers
  remain `ResearchTry.jsx`, its test, its library and the forwarder — measured.
  Joining it is a design with a product shape, not a tidy-up.
  **`re-review: 2026-11-20`** — whether any of the nine has gained a source row,
  and whether the research road has a second caller.
- **It cannot tell a figure that is unverifiable from one that is merely
  unchecked.** A paywalled or login-walled institution page will never be read
  back; those must be named one by one in the lesson rather than counted as debt,
  and nothing here distinguishes them yet.
- **The disclosure phrases are the ones the lessons actually use today**, not a
  general notion of hedging. A lesson that admits a gap in different words is not
  counted, and would need its phrase added.

## Verification

`app/src/__tests__/the-third-pile-is-a-worklist.test.js`, **14 cases** — 11
counting both sides and the two record shapes, plus the 3 the "ship and shrink"
decision added after the record was first drafted.
`npm run lint` exit 0. `npm run verify:gates` exit 0. Full vitest suite green
before pushing (DR-1072's standard).

Anti-theater: the walk is asserted to read more than 50 catalog files and more
than 50 disclosures, so a parse that stopped reading would show as zero and look
like success rather than pass silently.

**Proven to catch, both sides separately:**

| what was done | cases that go red |
| --- | --- |
| a tenth lesson made to admit unchecked material (a `WHAT WE DID NOT CHECK` note added to `banking-course.js`) | **1** — the gap pin |
| `lesson-sources.json` emptied | **1** — the checked pin, while the gap pin stayed at 9 |
| the total-denial phrase added to `ll207`, the one lesson that HAS rows (the ship-and-shrink failure mode, made real) | **1** — the contradiction guard (`1 failed \| 13 passed`) |

And three cases hold the two-shape defect directly: the JSON-shaped record is
attributed correctly, the single-shape pattern is shown blaming the record above
it, and the real `sovereign-ai-class.js` is asserted to contain **both** forms so
this is not a fixture-only concern.
