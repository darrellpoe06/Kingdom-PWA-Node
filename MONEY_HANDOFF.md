# MONEY_HANDOFF.md - FOS Money, thread-to-thread handoff

Concise state of the Money module for the next Claude thread. No credentials,
no balances, no full account numbers. Verify anything dated before relying on it.

## Where the code lives

- Engine (pure): `app/src/lib/safe-to-spend.js` (Safe to Spend, Bills Due, lowest projected balance, per-entity scope, reserve).
- Balances: `app/src/lib/financial-engineering.js` (`deriveAccountBalances`, `latestCheckpoints`, `deriveDebts`). A `balance-checkpoint` ledger row outranks the opening anchor.
- Settings: `app/src/lib/money-plan.js` (`data.moneyPlan`; `settings.reserveByEntity.personal` is the one Personal reserve key).
- Bill confirmation / inference: `app/src/lib/bill-review.js`; confirmed bills live in `data.recurringObligations`; paid marks in `data.moneyPlan.billStatus`.
- Rental mortgages: `data.inflows.rentals[].mortgage` = `{ balance, rate, monthlyPI, escrow, estimated }`. A rental enters Debts / Bills Due only when `mortgage.balance > 0`.
- UI: `app/src/components/money/*` (Overview, ComingUp, BillReview, Setup, Sections).
- Tests (focused): `app/src/__tests__/money-*.test.js(x)`, `safe-to-spend.test.js`, `financial-engineering.test.js`. Run with `cd app && npx vitest run <file>`.

## Persistence model (matters for every "is it saved?" question)

- Local-first: the device snapshot (IndexedDB `poe-financial-v28`) holds the whole `data`.
- Table sync (Supabase `accounts`, `debts`, `transactions`, `rentals`, `entities`) runs only when signed in AND `data.numericSyncVerifiedAt` is set (the verify-balances walkthrough).
- Everything else (`moneyPlan`, `recurringObligations`, `inflows`, `taxCalendar`) rides one jsonb row per instance in `family_snapshots`, pushed on change once signed in.
- Household instance: "Poe Family". A second instance, "Poe Properties", holds the 12 rental rows. Same three users are members of both.

## Verified 2026-11-05 (this thread)

- PRs #2532 (one bank-verified balance across Overview / Transactions / Imported) and #2537 (Personal-only combined Safe to Spend, one Personal reserve key, Bills Due dedupe, cleared payments not re-subtracted) are merged on `main` and deployed (deploy run 2041 on `main` df80128, green).
- Cloud copy of the household instance is STALE relative to the work described in the Nov 2026 handoff:
  - `transactions`: newest row dated 2026-08-12; zero `balance-checkpoint` / `balance-adjustment` rows.
  - `accounts`: three Chase checking rows plus a "Test Debt" credit row, last changed 2026-10-28. No Cash App account. No First State Bank checking account.
  - `debts`: 0 rows. `obligations`: 0 rows.
  - `family_snapshots` (household): last push 2026-10-28; `moneyPlan` absent (no reserve saved to the cloud), `recurringObligations` empty, all 12 rentals carry `mortgage.balance = 0`.
- Consequence: the November balances, the Cash App rental receipt, the $10,000 reserve and the six First State Bank loans are either on one device only or not entered. Nothing in the cloud proves them.
- Entity mismatch in the cloud row: "Chase Checking 3322" is assigned to `e-personal`. Per Darrell it is Poe Properties business checking. If the device agrees with the cloud, Personal Safe to Spend includes business cash and Poe Properties has no spendable account.

## The seven questions - what the engine can answer today

| # | Question | Engine support | Blocked by |
|---|----------|----------------|------------|
| 1 | Cash available now | Yes, from checkpoints per account | No checkpoint rows exist in the cloud copy |
| 2 | Bills already paid | Yes (`billStatus`, cleared-before-checkpoint rule) | Needs confirmed bills + checkpoints |
| 3 | Due in 7 / 14 / 30 days | Yes (`PERIODS`, Bills Due states) | No confirmed bills; loans not on file |
| 4 | Income before due | Yes (`incomeSchedule`, rental inflows) | Pay dates / rent dates not set |
| 5 | Reserve untouched | Yes (`reserveByEntity.personal`) | Reserve not saved to cloud; verify "Synchronized" |
| 6 | Safe to spend today | Yes, floored at $0 below reserve | 1, 3, 5 above |
| 7 | Extra toward debt | Yes (lowest projected balance minus reserve) | 1, 3, 5 above |

## Data-model gap for the six First State Bank loans

The rental `mortgage` object has no lender, loan reference, contractual due day,
grace period, past-due amount, late fee, last-payment date, cleared flag or
paying account. The confirmed bill (`recurringObligations`) carries name,
amount, nextDue, pastDue, accountId and, for the home only, `linkedMortgageId`.
A commercial line of credit has no property, so it belongs in `debts`, not on a
rental. Which loan belongs to which property is not recorded anywhere in the
repo or the cloud (only 1003 Koehn's note names First State Bank).

## Outstanding problems

1. Current financial truth is not in the cloud: confirm on the signed-in device whether `numericSyncVerifiedAt` is set and whether Money -> Setup reads "Synchronized".
2. Chase 3322 entity assignment (Personal vs Poe Properties).
3. No Cash App or First State Bank checking accounts under Poe Properties.
4. Six First State Bank loans not on file; loan -> property mapping unknown.
5. Loan fields (lender, loan ref, due day, grace, late fee, last paid, paying account) do not exist in the record shape.

## Next unfinished task

Awaiting Darrell's approval (2026-11-05) on the record changes in "Outstanding
problems" 2-4 and on the record-shape extension in 5. No live records changed
and nothing deployed by this thread.

## References

- PR #2532, PR #2537 (merged). This handoff: branch `ccr-055dea31-qi5vfm`.
