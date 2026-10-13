# DR-0819 — Proving our ways: what has actually been tried, and the standard we assess against

**Date:** 2026-10-08
**Status:** accepted
**Area:** Admin → Proving our ways; `usage_events` kind='use'; the evaluation standard
**Principle:** DR-0818 (L219, the Word under this), DR-0076 (measure, do not claim; proven-to-catch), DR-0219 (SHOULD / ARE / GAPS / CLOSE), DR-0065 (the app is the primary artifact), DR-0111 (do the work), DR-0075 (perpetual improvement with a re-review date)

## Context

Darrell, 2026-10-08, two questions in one breath:

> "Are there metrics for my family for their use of the PoeTech App and other
> builds to see if they are testing and using evaluating the functions based on
> the use so we can streamline our process for testing these applications...
> make sense? Where inside the PoeTech App is the reports and historical
> information and framework for our culturally responsive evaluation and
> assessments to make sure we are producing His Will with our ways and tools?
> Comprehensive module/s"

My first reply answered the questions and then parked the module on his word
about the criteria. The ari-guard caught it and it was right to: he had already
directed the work, and the criteria were mine to propose with a re-review date,
not to ask for. This record is the work.

## What was measured

**SHOULD / ARE / GAPS, run before building anything (DR-0219).**

**ARE, what already exists:**

- `Admin → Users and usage` (`AdminConsole.jsx` → `AccessUsageMetrics.jsx`):
  the roster with role and scope, activity and build freshness from
  `member_presence`, aggregate tab flow from `usage_flow_metrics` (migration
  0073), per-person most-used views for a steward of the space from
  `user_usage_metrics` (migration 0145, a decision Darrell already made in
  August), and platform signups.
- `Quality proof`, `Data integrity report`, `Perpetual report`,
  `System flow proof`: all real, all measuring the SYSTEM — gates, audits,
  flows, timelines.

**GAPS, measured not guessed:**

1. **Every usage number was a TAB OPENED.** `usage_events` records
   `kind = 'view'` with the tab id, and `usage_flow_metrics` filters on exactly
   that. So "Church was opened 40 times" was answerable and "has anyone ever
   tried the camera window, the pitch, the pointer" was not answerable at all.
   That second question is the testing question he asked.
2. **Nothing linked a thing we shipped to whether it had been touched since.**
   There was no registry of shipped functions anywhere.
3. **There was no evaluation framework.** A search of the whole repository and
   the app for "culturally responsive" returned **zero** matches. The nearest
   foundations — COMPREHENSIVE-REVIEW-STANDARD, QUALITY-GATEKEEPER,
   QUALITY-OF-LIFE-AS-NORTH-STAR, ENTRANCE-REVIEW — all measure product
   quality, none asks whether our ways produce His will for the people.

## Impact

- **The testing question now has an answer.** For each registered function:
  tried or not tried, how many times, by how many distinct people, when last,
  over a rolling ninety days — and how long a function has sat untried since
  the day it shipped, which is the number that actually streamlines a testing
  round.
- **The framework exists, in both places it belongs** (DR-0065): as Layer 3
  reference at `docs/00-foundations/_root/PROVING-OUR-WAYS-EVALUATION-STANDARD.md`
  and rendered on the surface where the work is.
- **It is grounded, not borrowed.** "Culturally responsive" is kept in its
  ordinary meaning — meeting a person in their own language, age, pace and
  circumstance — and grounded in the Word that got there first: every band
  carries the whole message in its own register, the rhythm is a family's
  ordinary day (Deuteronomy 6:7), and the measure itself may not move
  (Proverbs 20:10). Responsive to the person, fixed in the standard.
- **No existing number moved.** `kind='use'` rows are a different kind from
  `kind='view'`, and the 0073 rollup filters `kind = 'view'`, so every tab
  count on the Users and usage page reads exactly as it did.
- **The report cannot claim what it has not measured.** An unreadable snapshot
  is reported as unread, never as "nothing has been tried"; a day with no
  snapshot writes nothing to the history rather than a zero; and a registry row
  that is not actually wired to `noteUse` fails the build.

**Named, not fixed here:** eight functions are registered and wired. Many more
are shipped and not yet registered, so the report's claim is bounded by its
registry and the surface says so in its own "what this does not measure"
section. Registering the rest is ordinary follow-through as each is touched.
Also: question 2 of the eight is a count; the other seven are answered by
people and have no in-app capture yet. **re-review: 2026-11-08.**

## Decision

- **The standard is eight questions, each with its verse**, in
  `lib/proving-our-ways.js` and in the foundation doc: the real state
  (Proverbs 27:23); has it been tried (Luke 14:28); one measure for everyone
  (Proverbs 20:10); prove your own work (Galatians 6:4); each person in their
  own register (Deuteronomy 6:7); lean not on our own understanding
  (Proverbs 3:5); aimed at His will (Romans 12:2); faithful rather than
  impressive (1 Corinthians 4:2).
- **A function exercised is recorded as `kind='use'`** through `noteUse`,
  fire-and-forget, never throwing into a handler, a no-op when signed out. Same
  table, same ownership and the same delete-your-own-trail right as 0073.
- **Migration 0253 adds `feature_use_metrics`**, poe-family gated like 0073,
  returning counts and distinct-people counts only. It never returns a name or
  an id: per-person usage has its own decided road (0145) and the question here
  is about the function.
- **`Admin → Proving our ways`** renders the standard, the tried-or-not report
  and the daily record, beside Quality proof.
- **The registry is the honest limit of the claim**, and a test enforces that.

## Verification

- `app/src/__tests__/proving-our-ways.test.js` **15/15 green**: every
  registered function is wired; every row is whole; a function with rows reads
  tried and one without reads NOT TRIED rather than a zero; days-since-shipped;
  the summary and the longest untried; an unreadable snapshot never reading as
  nothing-tried; the all-tried line; the history newest-first with its share;
  the direction; malformed rows dropped; the standard's shape; every verse
  verbatim in the KJV corpus; and the surface naming what it does not measure.
- **Proven to catch (DR-0076 §3), three breaks, each restored after:**
  - removing `noteUse('reader.pointer')` from the app → *"every registered
    function is actually wired"* fails;
  - making `provingLine` ignore the snapshot-ok flag → *"an UNREADABLE snapshot
    never reads as nothing has been tried"* fails;
  - removing the history row filter → *"a malformed or empty row is dropped"*
    fails.
- Lint clean; `consistency-guard` and `business-systems-guard` OK; the build
  compiles the new surface.
- Not verified from here: the RPC against the live database, because this
  sandbox has no route to it. The migration is idempotent and follows 0073's
  shape exactly; the first real read on the deployed build is the evidence, and
  until that read lands the surface shows "could not be read" rather than a
  number, which is the honest state and not a failure of it.
