# DR-1063: When it happened, when it was recorded, and which one you may correct

**Date:** 2026-10-16
**Status:** accepted
**Tier:** B (how every record in the app accounts for itself in time)
**Type:** word
**Area:**
- `app/src/lib/record-stamp.js` (new — the stamp, the two kinds of "when", the correction rule)
- `scripts/stamp-carries-its-year-guard.mjs` + `scripts/stamp-year-baseline.json` (new gate, 22nd)
- `app/src/components/Choir.jsx` (Resources, Team Docs), `app/src/components/ChoirSongWorkshop.jsx` (the song pool)
- `app/src/__tests__/record-stamp.test.js` (new)

**Grounds:** Darrell, 2026-10-16, with Choir → Resources on screen showing "TLC Song List" and nothing else at all: **"We need to have dates and time stamps... so we can sort out the dates and events over time historical accuracy... make sense?... even system logs... to make sure it can be corrected... make sense?"**
**Principles:** DR-0076 §4 (measure, do not claim) and §3 (proven-to-catch); DR-0075 (perpetual improvement); DR-0330 (a surface tells the truth about its own state)

## He has asked for this before, and that is the finding

On **2026-09-22**, over a screenshot of his own working document, he said:
*"Make sure each entry automatically adds a date and time stamp to the
document... that why it reads chronological... make sense?"* That produced
`entry-stamp.js` — correct, tested, and **scoped to one surface**.

The ask was never only about that document. So he is asking a second time,
which is the most expensive way for this repository to learn anything, and the
reason this one ships as a shared primitive **with a gate on it** rather than a
third local helper.

## What was measured before anything was written

1. **The data was already there.** `choir_resources`, `choir_team_documents`,
   `choir_schedule`, messages, absences and sermons all carry `created_at`, and
   every `toXShape` already maps it to `createdAt`. **The surfaces threw it
   away** — Resources and Team Docs rendered no stamp at all.
2. **Eighteen hand-rolled formatters.** `fmtDate` / `fmtWhen` are defined
   separately in 18 components, each slightly different.
3. **Ten of them drop the year.** The song pool he photographed reads **"Added
   by mrspoe06 · Sep 6"**. Which September? A list carrying that stamp cannot be
   ordered across years — and on a record older than a year, a year-less stamp
   is not a shorter stamp, it is a **wrong** one.

That third measurement is his sentence exactly: *"sort out the dates and events
over time historical accuracy."* The defect was already on his screen.

## The distinction this record exists to hold

His second sentence — *"even system logs... to make sure it can be corrected"* —
is not a second request. It is the condition that makes the first one worth
anything.

| | what it is | correctable? |
|---|---|---|
| **When it happened** (`docDate`, `serviceDate`, `dateOf`) | a claim a **person** made, and a person can be wrong | **yes.** That is the correction. |
| **When it was recorded** (`created_at`) | the **system's witness** — when the row arrived | **never.** |

**Editing the log would destroy the only independent account of what happened
when — which is the thing that makes a correction trustworthy in the first
place.** So a corrected record shows **both**, and says it was corrected:
*"dated Oct 12, 2026 · corrected Oct 16, 2026 · logged Oct 14, 2026, 6:05 PM."*
Nothing is overwritten and nothing is hidden. That is how a record survives
being wrong — the way a ledger is kept, not the way a document is edited.

## Decision

1. **One stamp, and it always carries the year.** `stamp()` never omits it. The
   exact instant rides in a `title=`, one press away, without crowding the row.
2. **A bare calendar day does not drift.** `new Date('2026-10-12')` is UTC
   midnight, which renders as **Oct 11 in Texas**. Parsed as a calendar day
   instead. The church is in Texas.
3. **A day has no time, and 12:00 AM is not invented for it.**
4. **`whenOf(row)` returns both kinds and never collapses them** — including
   when they agree, because a stamp that appears only when something is off
   teaches people to read its presence as an accusation.
5. **`sortByWhen` is stable, and a dateless record sorts LAST.** Read as `0`, a
   missing date becomes 1970 and puts the unknown at the head of the history —
   the loudest possible wrong answer.
6. **A correction is checked: a thing cannot have happened after it was written
   down.** That is the one rule here that is not taste; accepting it silently
   would put the history out of order in a way nothing downstream could detect.
7. **There is no function that corrects the log.** The absence is the design,
   and a test has to be deliberately deleted to add one.

## The gate — narrow on purpose

`stamp-carries-its-year-guard` does **not** ban year-less dates. *"Sun, Oct 19"*
for this Sunday's service reads better without one, and BusMinistry,
ServiceProgram and MinistryOps are right to use it. It bans the **pairing**: a
year-less formatter applied to a **record's own timestamp** — history rather
than this-week.

**Shrink-only, like `lessons-gate-coverage`.** A guard that failed the whole
build on day one would simply be reverted, and a reverted guard protects
nothing. The committed baseline may lose entries and must never gain one.

## Verification

- **28 new cases**, weighted at the three things that make a history
  untrustworthy rather than merely untidy: a stamp without a year, an editable
  log, and a bare date drifting a day.
- **The gate is PROVEN TO CATCH on the real bug, not a fixture.** The exact
  formatter that shipped in `ChoirSongWorkshop.jsx` was put back and the guard
  failed by name — *"fmtWhen(c.createdAt) drops the year"* — then passed again
  on restore. The baseline is **0**, and a baseline of zero is only credible
  because the mutation was run; an always-green gate is itself a lie
  (DR-0076 §3).
- **Comments are stripped with byte offsets preserved**, so the guard cannot
  match its own documentation — the self-match that bit
  `unknown-is-not-a-no-guard` and DR-1060.
- The three surfaces he photographed are pinned by source: Resources shows a
  stamp where it showed **nothing**, Team Docs shows the document's date **and**
  the log, and the year-less formatter cannot return to the song pool.
- 22 gates green, lint clean, real build.

## What this does not do

- **It does not convert the other 50 components.** 52 render a record timestamp
  and 2 use the shared stamp. The gate stops the bleeding today; the sweep is
  its own change with its own proof, and converting 50 files unverified is how
  a good primitive gets a bad reputation. **`re-review: 2026-10-23`.**
- **No correction CONTROL is wired into a surface yet.** `validateCorrection` is
  built and proven, and the rule it enforces is the hard part — but the editor
  needs a `date_corrected_at` column and a migration, which is a schema change
  and belongs in its own record. **`re-review: 2026-10-20`.**
- **`entry-stamp.js` is left alone.** Its format is deliberately Christina's
  own (`M.D.YY`), matching what she already types into that document, and
  replacing it would split one document into two chronologies.
