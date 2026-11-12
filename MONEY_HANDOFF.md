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

## Corrected 2026-11-05 (this thread; merged in PR #2540, deployed 2026-11-06)

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

## Screenshot import (milestone 1, 2026-11-06; merged in PR #2540, deployed 2026-11-06)

**Decision (Darrell 2026-11-06):** uploaded bank screenshots, PDF statements and transaction files are the initial source of financial information. No NAS, SSH or network requests. The Books intake pipeline (DR-0709) is reused; the Books UI is unchanged except the review card.

**What exists already (measured):** Money's header row carries the one Upload button on every Money tab (`BooksUploadButton`, mounted inside the PIN gate as `BooksUploadMount` with the Money section as the hint). The file input takes any file, many at once (PNG/JPG/HEIC/PDF). Images are OCR'd sovereign-first (`books-intake-read.js`: the NAS `/books/ocr` road when it answers, else tesseract.js on the device, loaded from unpkg on first use). PDFs use pdf.js. Originals are kept in IndexedDB and copied to the household's private document shelf. Rows go through `planAccountImport` dedupe (FITID or content key), accounts are matched by last-4, uncertain facts become a stored question queue, nothing is written until a person taps Approve.

**What was missing and is now built:** a banking-app screenshot is not a statement. New document kind `account-snapshot` ("Banking app screenshot") in `books-intake-extract.js`: classifier signals (available balance, present balance, pending, the `(...7206)` last-4, "as of"); extractor reads the available/current balance (the figure may sit on the line below its label), the as-of day, the last four, and the rows in both `Nov 4` and `11/04` spellings with the year taken from the as-of day; rows under "Pending" are flagged; rows whose description is a move between the family's own accounts (Cash App, transfers) are category `transfer`. Questions (`books-intake-questions.js`): no date on the screen asks for the day (the upload day offered first, never assumed); two different balances ask which is the bank's; no balance asks rows-only or hold. Plan/commit (`books-intake-pipeline.js`): kind `snapshot` writes the new rows through `commitImportedRows`, then ONE bank-verified checkpoint row (`balanceCheckpointRow`, basis available/current, source "screenshot <file>") unless that account already has one for that day and figure. The engine then reads the balance as verified on that day (Accounts and Safe to Spend already display "verified on"). Review card (`BooksUpload.jsx`) shows "Verified balance $X as of <day> (available) · will be recorded on approval" and the button reads "Approve: verified balance + N new rows".

**Fixed 2026-11-06 after the first real upload (Darrell's Chase 7206 screen: no date, Available $4,687.18 vs Present $5,062.72):** the two questions ping-ponged. `mergeQuestions` (books-intake-pipeline.js) dropped an answered question once it was no longer asked, so answering the day erased the balance answer and vice versa. Answered questions now stay on the document. Pinned by `money-screenshot-upload.test.js` (both orders, Present too, approve writes one checkpoint to the existing account) and by `money-screenshot-review-render.test.jsx`, which drives the real panel at phone width through date, Available, Ready to confirm and Approve.

**Also fixed on the way:** `settleOccurrences` matches a confirmed bill to the bank's noisy spelling of its payee ("ZELLE PAYMENT TO BG MOM ..." settles "BG & Mom"), so a cleared payment imported from a screenshot marks the bill paid.

**Tests:** `app/src/__tests__/money-screenshot-upload.test.js` (12 cases): classify, extract (balance, day, last-4, rows, year roll, pending, Cash App = transfer), the no-date question, Personal vs Poe Properties routing (7206 vs 3322), approve writes 4 rows + 1 checkpoint and the engine reads $5,774 verified 2026-11-05 with Poe Properties at $0, re-upload adds nothing, a later screenshot records a newer checkpoint and only the missing row, an imported Zelle row settles the bill. Intake suites (books-one-upload 21, every-tab 15, bulk-import 20, bank-formats 13) and the 14 Money suites all green: 20 files, 299 tests. Lint clean.

**Not yet proven, said plainly:** real OCR on a real Fold screenshot. The tests feed the pipeline the text OCR would produce. The first real upload is the test (Money -> Upload -> the Chase 7206 screenshot). If OCR garbles the balance, the card shows what it read and the questions catch a missing day or balance; nothing is written until Approve.

## Three accounts, the trail, the windows, the forecast (2026-11-11; PR #2609 merged and deployed 2026-11-12)

**Darrell's report:** screenshots uploaded for Personal Chase 7206 ($3,183.10), Poe Properties Chase 3322 ($4,479.53) and TLC Therapy Solutions 8168 ($370.69); FOS showed Personal right and the two business balances old (about $2,540 and $38). The sandbox cannot see his phone's intake queue or the NAS ledger, so the cause was found in the code paths that can silently leave a figure old, each one closed and pinned, and the trail behind every figure is now on the surface so the live cause reads off the phone:

1. **Matching ignored the account's name.** `accountLast4` (books-intake-match.js) read only `fragment`; an account named "Chase 3322" or "TLC Therapy Solutions 8168" with no fragment never matched its screenshot, so the upload asked "which account?" or offered a new twin. The name's four digits are the fallback now; `applyLesson` uses the same reader.
2. **A new account could be born with no owner.** For a screenshot naming no known account, no entity question was asked (only for bills/receipts/pay stubs), so a created account rode Personal and business cash counted as personal spending money. `questionsFor` now asks "Whose account is this?" (blocking) when several entities exist and the page does not say; choosing an existing account settles the owner from that account (`processDoc` re-resolves the entity); a created account is born in the chosen pocket.
3. **The bank's spelling of the account.** `accountFragment` (bank-formats.js) reads "x8168", "…8168" (OCR's one-character ellipsis) and "ending in 8168"; `snapshotLast4` reads "(…7206)". `institutionOf` knows First State Bank and Cash App.
4. **Rows dated "11/07" were dropped.** `snapshotLines` read the "/07" as a year, so every m/d row from a bank that prints dates that way (TLC's) never imported. Fixed; pinned.
5. **The trail.** `balanceSources[]` now carries `checkpoints` (every bank check on file, newest first, with day, balance, basis, source), `sinceVerified` (rows after the check in force: count and net) and `laterCheckpoint` (a check dated AFTER today — a misread screenshot day — which is never used and is named in the assumptions). Coming Up's cash line shows the trail per account; Money -> Accounts shows "bank-verified <day> (<basis>) · <source>" or "not bank-verified" per cash account. An older screenshot approved later never overrides a newer check (pinned).
6. **Transactions told apart.** Screenshot rows: a deposit is a plain positive row; a move between own accounts is category `transfer`; a loan/mortgage/card payment is category `debt-payment` (`isDebtPaymentRow`), which the engine never counts as everyday spending or an inferred bill. Dedupe across re-uploads and overlapping screenshots is the proven `planAccountImport`. A confirmed bill is settled by any of its spellings (`name`, `paidAs`, `alsoPaidAs`), so a loan confirmed from the bank's row ("FIRST STATE BK LOAN PMT 5342") is marked paid by the next screenshot that shows the payment.
7. **Bills and income windows.** `windows` now carries `next30`, `regular7/14/30` (the regular bills with past-due taken out), `pastDue` (overdue, in or past grace, or a past-due balance; the due date stays the contract's) and `income7/14/30`. Coming Up shows "Bills due in the next 30 days", "Past-due obligations (apart from regular bills)" and, under each bills line, "income expected before these are due".
8. **The 30/60/90 forecast moved.** Money -> Transactions showed one figure for Now, +30, +60, +90 because it added only account-named upcoming rows. `lib/cash-forecast.js` now reads the engine's own 90-day walk at each horizon and places every item on the account that pays or receives it (a bill's paying account, a scheduled row's account, else the pocket's primary or only spendable account, else a named "not yet on an account" row); confirmed (entered, dated) and estimated (inferred, assumed, accrued) are kept apart, an "est" mark names the estimated amount, the verified day sits under each account, and the rows add up to the engine's timeline to the cent (pinned).

**Tests (new):** `money-three-accounts.test.js` (17: Tasks 1, 2, 3, 4 over the three accounts), `cash-forecast.test.js` (6), `money-three-accounts-render.test.jsx` (3, at 412px: Coming Up for Poe Properties and All entities, the Transactions forecast table). Every Money and intake suite green; lint clean.

**What the sandbox could not verify, said plainly:** whether the two business screenshots on Darrell's phone were approved, matched, or dated right. After deploy, Money -> Overview -> Coming Up -> "Current cash" opens the trail per account: it names the check in force, the rows since, any earlier checks and any check dated after today. Money -> Upload shows anything still waiting. That reading is the diagnosis; no record was changed by this thread.

## Stacked on the three-accounts PR (2026-11-11; Christina's brief; DR-1435; PR #2610 on `ccr-f178819a-g2lhs2`, held)

Built in a parallel session on the same brief and restacked on `fix/money-three-accounts` with only what that PR lacks:

1. **Reserve: the goal is not the cushion** (Christina's correction, 2026-11-11). `settings.reserveGoalByEntity[key]` is the GOAL (`DEFAULT_PERSONAL_RESERVE_GOAL` = 10000 for Personal until saved); `moneyPlan.reserveDesignations[]` (`{ id, scope, date, amount, note }`) is money actually SET ASIDE, recorded from Coming Up's "Add to reserve" (negative = taken back out); `reserveByEntity[key]` stays honored as money set aside by hand. `reserveStatus(data, settings, sc)` gives designated / goal / remaining and the `cushion` the walk protects: designated money when any is set aside, else an explicit `minCushion` for Personal, else nothing (a target is never subtracted); business pockets keep their old chain. `lines.reserve` carries it; `windows.reserveSource` = designated | household | none. `extraDebtCapacity().reserve` = `{ remaining, suggested, debtAfter }`: one pool for the reserve and extra debt, goal filled first.
2. **The rows.** `balanceTrace(data, accountId, asOf)` (financial-engineering.js) = latest checkpoint + every cleared row after its day = the displayed figure; Coming Up's `Trace` lists each row under the account beside the trail, with the fix (today's screenshot outranks the rows).
3. **Day boundary.** `deriveAccountBalances` clears a row by its local calendar day; before, a row dated tomorrow was subtracted tonight after 6pm Central.

Tests: `money-balance-trace.test.js` (5, under `TZ=America/Chicago`), `money-coming-up-30-days.test.jsx` (13: windows, goal vs set aside, designations, one pool, the panel); `safe-to-spend.test.js` and `money-functional-audit.test.js` pass their cushion explicitly. 24 Money suites, 315 green; 137 dependent files green. Merge order: #2609, then #2610 (it retargets to `main` by itself). No live record changed.

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
2. Chase 3322 and TLC 8168: read their trail in Coming Up after the 2026-11-11 PR deploys (which check is in force, whether the new screenshots were approved, whether a day was misread).
3. Cash App and First State Bank checking accounts under Poe Properties, if absent.
4. Personal reserve: save $10,000 under the `personal` key; today the Overview shows only the $2,000 buffer.
5. Six First State Bank loans and the loan -> property mapping (deferred by Darrell to a separate step).
6. Loan fields (lender, loan ref, due day, grace, late fee, last paid, paying account) do not exist in the record shape.

## Next unfinished task

2026-11-12: PR #2609 (the three-accounts work above) was merged by Darrell at
08:23 UTC as 797b0b8; deploy run 2134 succeeded and site-health run 43183461603
answered up + intact + fresh on that commit. Next is Darrell's hand on the Fold:
Money -> Overview -> Coming Up -> "Current cash" opens the trail for Chase 3322
and TLC 8168 (which check is in force, rows since, earlier checks, a check dated
after today); Money -> Upload shows anything still waiting; Money ->
Transactions shows the 30/60/90 forecast with the verified day under each
account. Report what the trail says; if a business figure is still old, the
trail names why, and that is the next fix. The six First State Bank loans and
their property mapping remain Darrell's to enter in Bills -> Review.

Earlier: PR #2540 squash-merged as be9db0d on 2026-11-06 (Darrell approved after CI run
42283312999 was green on 6832063); deploy run 2081 succeeded and site-health run
1780 answered up + intact + fresh. Milestone 2 is Darrell's hand: open FOS Money
on the Fold, Upload, the Chase 7206 screenshot, read the card, Approve. Report
what the card showed; if OCR misreads, fix the reader (`snapshotLines`,
`moneyNear` in books-intake-extract.js) before anything else. Then the other
accounts (3322, First State Bank, Cash App) the same way; the six loans in
Bills -> Review from the bank statements; the $10,000 reserve in Coming Up;
Safe to Spend compared against the verified figures. `scripts/money-census.sh`
and `scripts/money-records-read.sql` are unused and can be deleted. No live
records changed by this thread.

## References

- PR #2532, PR #2537 (merged). This handoff: branch `ccr-055dea31-qi5vfm`.
