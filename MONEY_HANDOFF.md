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

- **THE LIVE DATABASE IS THE SOVEREIGN SUPABASE ON THE NAS, NOT THE HOSTED PROJECT.** The deployed app has read the NAS since REPOINT-ARMED (2026-08-19, DR-0310); since 2026-10-09 the deploy workflow builds with `VITE_SUPABASE_URL` pointed at the Funnel `/sb` road (a surfaced, temporary deviation documented in `deploy-cloudflare-pages.yml`). The hosted Supabase project (`mjjlevhdufpaplypnqrv`) has not been written by the app since 2026-10-28 and must never be read as the app's current state.
- The sandbox has no route to the NAS. Read the live database from a GitHub runner over the tailnet: `scripts/live-sql.sh` (BEGIN READ ONLY, tailnet -> ssh -> docker exec psql), as `sovereign-read.yml` and `family-books-probe.yml` do (DR-1159 road 1).
- Local-first: the device snapshot (IndexedDB `poe-financial-v28`) holds the whole `data`.
- Table sync (`accounts`, `debts`, `transactions`, `rentals`, `entities`) runs only when signed in AND `data.numericSyncVerifiedAt` is set (the verify-balances walkthrough).
- Everything else (`moneyPlan`, `recurringObligations`, `inflows`, `taxCalendar`) rides one jsonb row per instance in `family_snapshots`, pushed on change once signed in. The Money -> Setup card's "Last pushed" reads the device marker written only after a push the server accepted.
- Household instance: "Poe Family" (slug `poe-family`). A second instance, "Poe Properties" (`poe-properties`, type landlord), exists; the same three users are members of both. `join_default_instance` resolves the family users to `poe-family`.

## Verified 2026-11-05 (this thread)

- PRs #2532 (one bank-verified balance across Overview / Transactions / Imported) and #2537 (Personal-only combined Safe to Spend, one Personal reserve key, Bills Due dedupe, cleared payments not re-subtracted) are merged on `main` and deployed (deploy run 2041 on `main` df80128, green).
- Synchronization: Darrell's device (Samsung Fold 7) reports "Synchronized, last pushed 2026-11-05 12:08 UTC". That marker is written only after the server accepted the push, so the push reached the LIVE (NAS) database. A read-only census of the NAS records is the verification step: `scripts/money-records-read.sql` (BEGIN READ ONLY, rounded output).
- The census could NOT run from a GitHub runner: `TS_AUTHKEY` has been rejected by Tailscale ("invalid key: API key does not exist") on every tailnet lane since 2026-10-28 (nas-health last green 2026-10-27 22:24 UTC; DR-1283 / DR-1298 / DR-1302 already record this and name the fix: a fresh Reusable + Ephemeral auth key, a value only Darrell can mint). And this repository is PUBLIC, so workflow logs are public: Money records must never be printed there. The temporary workflow was removed unrun. The fitting road is DR-1159 road 2: Darrell runs the same SQL from ConnectBot on his phone, and the output stays on his screen.
- CORRECTION: this thread first read the HOSTED project and reported it stale (newest transaction 2026-08-12, zero checkpoints, `debts` and `obligations` empty, snapshot 2026-10-28 with no `moneyPlan`). That describes the hosted fossil, not the app. Treat none of those figures as the app's state.
- Darrell's Overview on 2026-11-05: Total Outstanding Debt shown for 24 debts; Savings Progress against a $2,000 buffer. His intended Personal reserve is $10,000. The reserve the engine uses is `moneyPlan.settings.reserveByEntity.personal`, separate from `meta.bufferTarget`.
- Per Darrell, Chase 3322 is Poe Properties business checking. Its entity assignment in the live database is what the census verifies; the hosted copy had it under `e-personal`.

## Corrected 2026-11-05 (this thread; on PR #2540, held, NOT merged)

Measured before the change with the new suite `app/src/__tests__/money-loans-grace.test.js`: 8 of 11 cases red on `main` df80128. After: 15 of 15 green; the 14 Money suites together 201 green; lint clean.

1. **A missed loan payment is owed now, not rolled to next month.** `safe-to-spend.js obligationEvents` step 1: a recurring bill whose `nextDue` has passed is counted today, overdue, keeping its due date, when the record is TRACKED — it has a grace period on file (`graceDays`) or was confirmed (`verifiedAt`) with the due date already past. A merely stale record keeps the roll-forward and is named in the assumptions. Only the latest missed cycle is counted; earlier ones are named. A planned pay date on/after today carries it instead.
2. **Grace states.** `graceDays` on the bill gives each missed occurrence `graceEndsOn` and `graceState` = `in-grace` (today <= due + grace) or `past-grace`. `billStatusOf` returns them; `BILL_DUE_STATUS_LABEL` labels them; Bills Due shows "grace ends <date>". Both states stay in Overdue so the money is reserved.
3. **Paid and cleared matches from the due date.** `settleOccurrences` opens the ledger window half a cycle before the DUE date (not today), so an October payment settles the October occurrence.
4. **Late fees owed now, once.** `lateFees` on the bill becomes one overdue line "· late fees".
5. **A Cash App transfer landing in Chase is never income.** Step 2 (future-dated ledger rows) now skips `isOwnAccountTransfer` descriptions (`CASH APP*DARRELL`, `POE PROPERT`, `TRANSFER TO`, ...), the same rule the inferred-bill pass already used.
6. **One loan, one line.** `toObligation` keeps `linkedMortgageId` for a rental bill marked "this is the mortgage on this property" (checkbox in Bills Review), so the property record's P&I line is not counted beside the confirmed loan bill. New loan fields on the bill: `lender`, `rate`, `graceDays`, `lateFees` (plus the existing `accountLast4` for the loan number, `balance` for principal, `pastDue`, `accountId` for the paying account, `rentalId` for the property).

Unchanged and verified by the same run: Personal reserve floors Safe to Spend at $0 (`reserveByEntity.personal`), entity scoping keeps Poe Properties cash out of Personal.

## How the six First State Bank loans are entered (Darrell, in the app, after the census)

Money -> Bills -> Review & confirm -> add a bill, one per loan: group "Rental property mortgage or expense"; Lender "First State Bank"; Loan number last 4; Normal payment; Actual due date = the CONTRACTUAL due date (even if passed); Grace period 15; Late fees owed now if the bank shows one; Paid from = the account actually used; Belongs to = Poe Properties; Which property; tick "This bill is the mortgage on this property". The line of credit has no property: leave the property unset and the mortgage box unticked. Nothing is pre-filled by the agent: the figures come from the bank statements.

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

1. Verify the live (NAS) Money records with the read-only census via ConnectBot; until then every "existing value" is unverified.
1b. Fleet-wide: `TS_AUTHKEY` revoked since 2026-10-28; 60+ NAS lanes (nas-health, db-migrate's sovereign replay, sovereign-read, probes) are red until Darrell mints a new Reusable + Ephemeral key and updates the repository secret. The deploy still works (its anon key falls back to the served-site road, DR-1269).
2. Chase 3322 entity assignment (Personal vs Poe Properties).
3. Cash App and First State Bank checking accounts under Poe Properties, if absent.
4. Personal reserve: save $10,000 under the `personal` key; today the Overview shows only the $2,000 buffer.
5. Six First State Bank loans and the loan -> property mapping (deferred by Darrell to a separate step).
6. Loan fields (lender, loan ref, due day, grace, late fee, last paid, paying account) do not exist in the record shape.

## Next unfinished task

Darrell runs the read-only census from ConnectBot (`scripts/money-census.sh`,
one line) and pastes the rounded rows back; present verified current records
beside the exact proposed corrections (items 2-4); wait for approval before any
record change; enter the six loans with the figures from the bank statements;
compare Safe to Spend against the verified figures; then lift the hold on PR
#2540 and delete `scripts/money-census.sh` + `scripts/money-records-read.sql`.
No live records changed and nothing deployed by this thread.

## References

- PR #2532, PR #2537 (merged). This handoff: branch `ccr-055dea31-qi5vfm`.
