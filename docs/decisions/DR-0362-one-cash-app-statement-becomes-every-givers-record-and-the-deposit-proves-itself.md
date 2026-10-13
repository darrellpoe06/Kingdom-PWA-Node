# DR-0362 — One Cash App statement becomes every giver's record, and the deposit proves itself

**Date:** 2026-09-11 · **Status:** accepted · **Tier:** B · **Area:** money · **Principles:** VERIFICATION-DOCTRINE, APP-IS-PRIMARY, DATA-AS-EMPOWERMENT, DETERMINISTIC-FIRST, DECISION-RECORDS

> **Renumbered on merge.** Minted as DR-0361 on a concurrent branch (DR-0011's branch-per-session convention, DR-0052's renumber rule). PR #1526 merged first and keeps DR-0360, so both records on that branch shifted up one. No decision was lost; the INDEX pointer records the shift.


## Directive — spoken in the meeting, by the people who do the work

2026-09-11, a Love Corner planning meeting with the finance steward and the church office. The requirement found itself out loud, mid-sentence, when someone realized what the statement already contains:

> *"If you got person a, b, c, and let's just say they totaled a thousand dollars — instead of doing this person, this person, this person, you could just transfer the whole thousand dollars, and then on your statement, it's gonna tell you every person and what they gave."*

> *"Unless you care about the specific dates and times that they gave it to you. It tells you that too."*

> *"Each month it tells you the date, it tells you the person, and if you have a description it tells you that, and then it tells you the amount."*

The cost of not having it, in the steward's own words:

> *"the transfer, put it in Excel, then put it in my other report, then create the reports for the end of the month. So it would help me tremendously."*

And the stake, which governs every design call below:

> *"we get thousands of dollars… so applying it to the right person."*

Darrell's frame for what we are building:

> *"we're using AI to build a hard system that does the same thing over and over again. It ain't gonna do nothing different than what we programmed it to do… we can program it like a calculator, have it hardened like that. Now who gonna say a calculator messed up?"*

And the target state:

> *"the goal is to make it so that you don't have to do no report. It's already there. You can go look at the reports."*

## What is true (SHOULD / ARE / GAPS)

**SHOULD:** the file the steward already downloads should become the church's giving records and its month-end reports, with each deposit provably made of the gifts recorded against it.

**ARE — traced through the repo before writing anything:**

| Claim | Reality |
|---|---|
| There is a giving table to write this into | **Two worlds, neither one right for it.** `giving_records` (migration 0184) is live and tested — and it is the GIVER's own private ledger, RLS `created_by = auth.uid()`, with migration 0184 stating as doctrine that an instance admin cannot read it. It has **no person field at all**; identity is `created_by`. |
| The church-office side exists | **The SHAPE exists and has never been wired.** `service_offerings`, `giving_reconciliations` and `donor_giving` are fully modelled in `schema-v2.7-church.sql`, and a grep for those table names across every `.js`/`.jsx` returns **nothing**. `giving_reconciliations.claim_kind` even defines the value `'reconciled-from-online'` for exactly this import. |
| Something can split one row into many | **Nothing, anywhere.** Every importer in the repo is 1 statement row → 1 ledger row. There is no fan-out primitive. |
| There is a Cash App format | **No.** `bank-formats.js` knows eight card issuers; its `ROLES` has no concept of a **counterparty**, which is the one column a bank statement lacks and this whole feature turns on. |
| Giving can be reported by month | **No.** The only giving aggregation is year-scoped (`recordsInYear`, `summarizeGiving`). `groupByMonth` exists for the family's bank books and has never met a gift. |
| There is a name matcher | **No.** Every dedupe in the repo is content-key based. Nothing matches a human name to a person. |

**GAPS:** the destination shape was decided in SQL and abandoned; the split primitive did not exist; the format had no column for who gave; and reports had no month.

## Decisions

1. **The split is the feature, and it produces the shapes the schema already defined.** `lib/giving-batch.js` turns one payout plus its gifts into one `service_offerings`-shaped batch (`online_source: 'cashapp'`, `online_batch_id`, `online_total`) and N `giving_reconciliations`-shaped claims (`claim_kind: 'reconciled-from-online'`, `claim_status: 'pending'`). Plain objects in integer cents, so the sync layer writes rows and never does arithmetic.

2. **A deposit must prove itself, and nothing is ever adjusted to make it.** `reconcileBatch` reports the exact difference between the named gifts and the bank deposit, with a sentence naming what it means: the deposit exceeds the gifts, the gifts exceed the deposit, or nothing has been transferred yet. **There is no tolerance band** — one cent of drift is drift. A "close enough" threshold is precisely how a real missing gift hides inside rounding, and integer cents means honest arithmetic never lands off by one. A balanced report that was forced is worse than an honest one that does not balance, because only the second one gets looked at.

3. **Gifts ride the transfer that carried them.** `batchGiftsByPayout` assigns each gift to the first transfer at or after its moment — the physical rule, deterministic, same input same batches. Gifts after the last transfer are **not an error**: they are money still sitting in Cash App, and they get their own undeposited batch so they are visible rather than absent. `summarizeBatches` answers the one question a steward has before signing a month off, `allBalanced`, in one fact.

4. **The app proposes who a name is. It never decides.** A Cash App sender column holds a display name the sender chose, not a person in the directory, and the distance between those two facts is where a church's giving records get quietly wrong. So `lib/giving-donor-match.js` returns proposals that always carry `needsReview: true` and `decided: false`, every proposal names the **basis** it was proposed on in words a steward can check (confirmed before, exact name, preferred name, name order reversed, every name word matches, last name and first initial), and **a tie is reported as a tie** rather than resolved by tiebreak. Confidence is ordinal, not a percentage: inventing a number would dress a string comparison up as a measurement. This is the posture `call-to-give.js` already set for a detected cue, applied to the one field where a wrong guess costs a real person their record.

5. **Confirmations are remembered, so the work shrinks every month.** Once the office says "Bobby J." is a given member, that is an alias and every future month resolves it with no work. `reviewQueue` reports what is settled versus what still needs an answer. Storage is injected, the same shape `bank-formats.js` uses for remembered layouts — no hidden state, so the same statement always asks the same questions. This is what makes the feature worth the steward's time rather than a new monthly chore.

6. **An unidentified giver keeps his name, his money, and a mark.** He is never dropped from a report and never folded into somebody else. A **high-confidence proposal is still rendered as the raw sender name**, because a proposal rendered as a member's name is exactly how a wrong attribution becomes invisible. And every report states how much of itself is unconfirmed, on its face, so nobody signs a month off believing it settled while 8 of 30 gifts are still proposals. DR-0076 runs both ways here: never over-claim an identity, never under-report the money.

7. **Nothing touches `giving_records`.** That table is the giver's own private record by design. Reconciling the office's deposit must never become a back door into a member's private ledger — migration 0184 says any office aggregate is "a separate, consented, decided surface, never a widening of this policy." This is that separate surface.

8. **Every source row is accepted or rejected with a named reason.** `parseCashAppStatement` proves `accepted + rejected === sourceRows` on every read (the `ingest-reconcile` promise). A top-up from the church's own bank is **not** giving, money the church sent out is not giving, a refund is its own kind, a pending or failed payment never landed, and a row in a non-dollar currency is refused rather than folded into a dollar total. An unrecognised transaction type becomes kind `other` and is still **counted** — a dropped row is a missing gift that nobody would ever see go.

9. **Columns are read by NAME, never by position.** An export that adds a column in the middle would shift every field and the numbers would still look plausible, which is the worst kind of wrong. A layout we cannot read a date and an amount from returns `recognized: false` **with the headers it actually saw**, and reads nothing.

## Honest uncertainty: the exact header spelling is not yet verified

The Cash App column set here is read from its documented export, **not from one of the church's own files** — a statement was offered in the meeting and never opened. So this is stated plainly rather than papered over (DR-0076 §8): the reader is header-driven with synonyms, it reports exactly which roles it mapped, and it refuses to guess by position. The first real export either passes straight through or names the mismatch in one line.

**The one input that would close this:** one exported Cash App CSV (any month, sender names can stay as they are — it is the church's own account). **re-review: 2026-09-18.**

## Proof (DR-0076)

`app/src/__tests__/cashapp-giving.test.js` — **58 tests, green**, including the meeting's own $400 + $350 + $250 = one $1,000 transfer, end to end.

Five safety properties were each **proven to catch** by injecting the exact regression and confirming the failure, then restoring:

| Regression injected | Test that caught it |
|---|---|
| Silently drop an unrecognised row | an unrecognised type is COUNTED as other, never dropped |
| A $1.00 tolerance band on reconciliation | ONE CENT of drift is drift — there is no tolerance band |
| Auto-resolve an ambiguous name by tiebreak | A TIE IS REPORTED AS A TIE — never resolved by tiebreak (and the proposal test) |
| Render a high-confidence proposal as the member | a high-confidence PROPOSAL is still shown as the raw name |
| Hide unconfirmed givers from the report | 5 tests, including SUBTOTALS TIE TO THE TOTAL |

Also pinned: every sign convention a real export uses; no cent lost to floating point; a 23:50 gift keeps its own day rather than shifting out of its month; subtotals tie to the grand total on every model; the CSV carries the model's numbers to the cent.

## A silent bug found on the way, and fixed

Building on this pipeline surfaced a real defect in `DebtStatementUpload.jsx`. `planAccountImport` returns `{ txns, duplicates: Number }`; the panel read `plan.toAdd` and `plan.duplicates.length`. Those names line up only on the branch where **no** account resolved — so in the normal case, a debt with an account (the only case that dedupes at all), pressing Import handed the parent an **empty array and wrote nothing**, while the panel displayed "0 new" and a duplicate count of `undefined`. It looked exactly like a statement with no rows in it, which is why it survived: no error to see, and the only tests on that panel read source text, which agreed with itself.

Fixed by normalising once at the read, and gated by a contract test that reads **both real values** rather than scanning either module's source — the same shape of miss as P49's two-timeouts-that-must-agree, now generalised as **P52**.

### And the same shape one level up: `npm run verify` did not verify what CI verifies

DR-0361's push went red in 45 seconds on `lessons-gate-coverage` **after** a local run of 910 test files and 13,388 tests came back green. `npm run verify` was `npm run lint && vitest run`, while CI's `app — lint + vitest` job runs **13 guard scripts as separate steps** between lint and vitest. The command this repo documents as the sanctioned lane check — DR-0077 §2, quoted as "the real gate" in `REVIEWS.md`, the resume contract and the orchestrator handoff — skipped 13 of the checks that decide whether a push is red.

`verify` now chains `verify:gates` (all 13, in CI's own order) between lint and the suite, and `verify-covers-ci-guards.test.js` fails the build if CI gains a guard step that `verify` cannot reach. Proven to catch against the pre-fix script (all 13 reported missing, with `lessons-gate-coverage` named) and against a guard added to the CI job. A local green that does not predict CI is worse than no local check, because it is trusted.

## What this does NOT do, on purpose

- **No surface yet.** This is the engine: pure, deterministic, and tested. The office-facing import and review screens, and the Supabase sync that writes `service_offerings` / `giving_reconciliations` / `donor_giving`, are the next slice — same lane, same session-queue discipline as DR-0359. **re-review: 2026-09-18.**
- **No sample-data demo path yet, which Darrell asked for by name.** In the same meeting: *"the system we build don't have to have true data... but it has to have data to be able to show us that it was working correctly. Then after that, we just upload our data or import our data into it, because we've tightened up the system."* The meeting's own $400 + $350 + $250 statement is the test fixture today, which proves the engine to a reader of the suite and not to the steward. Turning that fixture into a loadable sample the office can run before handing over a real file belongs with the surface slice. **re-review: 2026-09-18.**
- **No migration.** The three tables already exist in `schema-v2.7-church.sql`. Whether they are present in the LIVE database is unverified and is the sync slice's first trace (the DR-0359 lesson: trace the live database, not the schema files). `donor_giving.method`'s CHECK does not include `cashapp`, so Cash App maps to `'online'` with the processor named in `service_offerings.online_source` — no constraint change needed.
- **No bank-side match.** Tying the batch to the actual bank deposit row (`service_offerings.transaction_id` → `transactions`) is real and belongs with the sync slice. **re-review: 2026-09-18.**
- **No automatic confirmation, ever.** Not as a later convenience either. The office confirms an identity; the app only ever narrows the question.

## Chain

DR-0358 / DR-0359 (the obligations ledger and its integer-cents, derived-status, not-entered-is-not-zero discipline, which this follows) · DR-0076 (measure don't claim; proven-to-catch; never under-claim) · DR-0061 (reality-trace) · DR-0075 (the dated re-reviews above) · migration 0184 (the giver's private record this deliberately does not touch) · `schema-v2.7-church.sql` (the shape decided and never wired) · P49 → P52 (two modules passing a shape need a test that reads both real values)
