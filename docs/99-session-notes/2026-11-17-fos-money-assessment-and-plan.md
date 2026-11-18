# FOS Money — Assessment and Phased Plan (2026-11-17)

Status: PLAN ONLY. Nothing implemented, nothing committed, no record changed.
Baseline measured on `main` 7938800: 7 core Money suites, 126 tests green
(safe-to-spend, money-three-accounts, money-screenshot-upload, cash-forecast,
money-coming-up-30-days, debt-freedom, money-loans-grace).

Live data was NOT read. The live database is the NAS Supabase; the sandbox has no
route to it, and the runner road is blocked while `TS_AUTHKEY` is revoked
(MONEY_HANDOFF.md, "Outstanding problems" 1b). Every finding below is from the
code, with file:line, not from the family's records.

---

## 1. What already works (reuse, do not rebuild)

| Area | Where | State |
|---|---|---|
| One calculation engine | `lib/safe-to-spend.js` `buildSafeToSpend` | 90-day day-by-day walk, lowest balance, cushion, per-entity scope, Personal-only combined Safe-to-Spend |
| Bank-verified balances | `lib/financial-engineering.js:103` `deriveAccountBalances`, `balanceTrace:189` | Checkpoint + rows after it; trail shown per account |
| Entity separation of cash | `resolveScope:172`, Overview switcher | Business cash never enters Personal Safe-to-Spend |
| Paying entity vs owing entity on bills | `obligationEvents:314-323` | `entityId` (owes) and `paidByEntityId` (pays) kept apart |
| Bill confirm / dismiss / grace / late fees / past due | `lib/bill-review.js`, `MoneyBillReview.jsx`, `obligationEvents` step 1 | Confirmed bills persist; missed payments owed now; grace kept separate from due date |
| Bills Due windows, past-due window | `comingUp` (`safe-to-spend.js:~900`) | 7/14/30, `pastDue`, `regular*` |
| Screenshot intake | `lib/books-intake-*.js`, `BooksUpload.jsx` | OCR, classify, last-4 match, entity question, checkpoint, dedupe, approve gate |
| Reserve goal vs cushion | `reserveStatus:1014`, `reserveDesignations` | $10,000 is a goal, never subtracted; designated money is the cushion |
| 30/60/90 forecast | `lib/cash-forecast.js` | Reads the engine's walk; confirmed vs estimated separated. The old "identical Now/+30/+60/+90" defect is fixed in code and pinned (`cash-forecast.test.js`) |
| Debt Freedom | `lib/debt-freedom.js`, `MoneySections.jsx:307` | Snowball, avalanche, custom order, extra monthly, lump sums, month-by-month schedule, rollover, interest totals, minimums-only comparison. Excludes a debt with unknown APR / no minimum instead of inventing one |
| Original documents | IndexedDB `poetech-books-intake`; cloud bucket `family-documents` (RLS: creator, or household when shared) | Kept; signed-URL access |
| Category learning | `data.categoryRules` via `recategorizePayee` | Exists, but only used after the fact |

## 2. Defects and gaps found (with evidence)

### Transactions (Task 1)
- T1. **No rows until the day is answered.** `snapshotLines` returns `[]` when `asOf` is null (`books-intake-extract.js:366`). A screenshot with no visible date shows only the balance until the day question is answered.
- T2. **Row formats silently dropped:** `($12.00)`, Unicode minus, `$-12.00`, "Today"/"Yesterday", rows under a date header (Chase's grouped layout), two-line OCR rows (description and amount on separate lines). Pattern at `:368-370` requires date + description + amount on one line.
- T3. **Rows kept but wrong:** an unsigned `$12.00` debit becomes a +$12 deposit; a trailing running balance is read as the amount.
- T4. **Whole-document approval only.** The card shows a count, not the rows; no per-row approve/edit/reject/categorize, no bulk action (`BooksUpload.jsx` ~99, ~127-135).
- T5. **Learned categories are not applied on import.** Screenshot rows never pass through `categorize()`; everything but transfer/debt-payment lands as `other`.
- T6. **`hold` does not hold** (`books-intake-pipeline.js:91` handles only `rows-only`); a later Approve writes rows with no checkpoint.
- T7. **Fields lost on sync.** `transactionToRow` (`lib/transactions-sync.js:26-47`) does not send `pending`, `source`, `docId`; after the cloud round-trip the cloud copy wins, so the link to the original document and the pending flag are lost.
- T8. **Rows hidden by entity filter.** An account created from a snapshot with no entity (`pipeline.js:233`) is hidden from "All" in Transactions (`BooksTransactions.jsx:463-467`).
- T9. **Rows only on one device** until `numericSyncVerifiedAt` is set (`poe-financial-mvp-v28.jsx:2994-3001`).
- T10. **No refund / reimbursement / deposit categories** (`categorize.js:18-22`).

### Double counting (Task 1 critical rule, Task 2)
- D1. **Outstanding checks are invisible.** Every row dated on or before a checkpoint is treated as already inside the bank balance (`balanceFromCheckpoints`, `financial-engineering.js:136-146`). A written-but-uncleared check (the $2,201 check from 7206) is NOT in the bank's available balance, so FOS overstates Personal cash by $2,201 until it clears. No "outstanding" concept exists anywhere.
- D2. **Pending → posted can be subtracted twice.** `pending` is ignored by the balance math. When the posted version arrives with a new date or description, dedupe keys differ (`bulk-statement-import.js:56-61`), and a posted row dated after the checkpoint is subtracted from an available balance that already held it.
- D3. **Economic entity ignored by the engine.** `entityOverride` exists and syncs, but `safe-to-spend.js` and `financial-engineering.js` never read it. There is no reimbursement-receivable record, so the $2,201 Poe Properties obligation to Personal cannot be traced.

### Bills (Task 3)
- B1. **Merchant purchases become bills.** `obligationEvents` step 6 (`safe-to-spend.js:~466-500`) runs `detectRecurring` over every outflow on spendable accounts with no bill-type filter. Repeated Circle K / Walmart purchases are projected forward as `inferred-bill` and counted in Bills Due and the Safe-to-Spend walk. This is the most likely main cause of the inflated ~$18,774 30-day figure.
- B2. **Debts with no due day are dated the 1st.** Step 3 (`:430-434`): `if (!day) { day = 1; assumed = true }`. Every card without a due day lands on December 1 — the reported symptom.
- B3. **Rent is assumed on the 1st** when no rent day is set (`:269-281`); mortgages assumed on `mortgageDueDay || 1`.
- B4. **No six-way classification on screen.** The engine has `obligationType` (regular / arrangement / settlement / past-due / one-time) and `kind` (`bill`, `inferred-bill`, `debt-min`, `mortgage`), but Bills Due does not separate confirmed / inferred-needs-review / historical-purchase-not-a-bill / one-time / arrangement / past-due as six groups.
- B5. **No "last payment date / next payment date / supporting document" per bill**; no link from a bill to the transactions that paid it beyond name matching (`settleOccurrences`).

### Income (Task 4)
- I1. **Mislabel — the $9,931 question.** Under each bills line, Coming Up prints "income expected before these are due: $X" (`MoneyComingUp.jsx:63`). The figure is `incomeThrough(end)` (`safe-to-spend.js:917`): the SUM of every income event from tomorrow through the window's END. It is total window income, not income that arrives before any bill. So the ~$9,931 was total 30-day expected income in the scope you were viewing (scheduled paychecks + paychecks inferred from past deposits + rent assumed on the 1st when the scope includes rentals), labeled as if it were "before bills." The exact deposits cannot be listed from here without your records; Phase 1 puts that list on screen.
- I2. **The 30-day deposits are not listed.** `income30.items` is computed but only its total is shown; only the 14-day list is itemized (`MoneyComingUp.jsx:266`).
- I3. **Inferred income is treated as guaranteed cash** in the walk (`buildSafeToSpend` sorts income events into the day-by-day balance regardless of `inferred`); only the status word changes to "estimate".
- I4. **Income events have no destination account, no frequency, no verified flag**; future-dated deposits in the ledger are in the walk but missing from the income windows (`comingUp` uses only `incomeEvents`).
- I5. **Christiana's money is not modeled at all.** Every "Christi*" reference in code is a requirement attribution, not data.
- I6. Reimbursement / loan proceeds / refund / unidentified deposit have no classification (see T10); a large unidentified deposit inferred as "paycheck" is possible only if it matches payroll words, so the risk is low, but it is not prevented structurally.

### Debts, status, documents, assistant (Tasks 7–11)
- X1. `deriveDebts` reads only debt-type accounts and rental mortgages; NOT the `data.debts` table and NOT confirmed loan bills carrying a `balance`. Six First State Bank loans entered as bills carry balance on the bill but not in Debts.
- X2. Debt records lack: original amount, due day (lives on account/settings), frequency, last/next payment, past due (lives on the bill), status, linked transactions, documents.
- X3. Debt Freedom offers Safe-to-Spend as a one-time what-if, not `extraDebtCapacity` (which protects the reserve/cushion plan) — the two can disagree.
- X4. No obligation status model (current / due soon / due today / past due / in grace / pending / paid / arrangement / needs verification) as one field; pieces exist (`billStatusOf`, `graceState`).
- X5. Documents: no account/debt/bill column on `family_documents`; statement facts overwrite the account via `sinks.updateAccount` with no old value / new value / approval history (`books-intake-pipeline.js:243-248`).
- X6. **No AI assistant exists in Money.** `use-assistant-access.js` is human-assistant access; the monolith's "Assistant" is the TLC referral workspace. LLM plumbing exists elsewhere (`lib/llm-providers.js`, `modules/office-assistant/`). Task 11 is therefore a new surface built on existing plumbing, not an improvement of an existing one.
- X7. Overview tiles for income / expenses / debt ignore the selected entity scope (`MoneyOverview.jsx:293-302`).

---

## 3. Phased plan

Every PR: built on its own branch, all Money + intake suites green, lint clean,
real build, measured before/after on a fixture household, and the PR carries the
`hold` label so the auto-merge lane cannot merge it. You merge.

### Phase 1 — Financial data accuracy

**PR 1.1 Income truth (smallest safe first slice; engine + UI only, no schema, no record changes)**
- Reuse: `incomeEvents`, `comingUp`, `MoneyComingUp`.
- Change:
  1. Rename the mislabeled line to "Income expected in the next N days: $X" and add a separate, correct figure: "Income arriving before <bill> (due <date>)" computed per bill date.
  2. Itemize every projected deposit for 7/14/30/60/90: source, amount, date, entity, destination account, frequency, status (entered / confirmed rent / inferred from N deposits / assumed date).
  3. Include future-dated ledger deposits in the income windows (already in the walk).
  4. Safe-to-Spend: the verified figure counts entered/confirmed income only; inferred income is shown as a separate "if expected-but-unconfirmed income arrives: +$X" line. (DECISION D-2.)
- Tests: new `money-income-truth.test.js` — label vs window sum, per-bill "before" math, ledger deposit inclusion, inferred excluded from verified figure, sums reconcile to the walk to the cent; render test at 412px.
- Phone: Money → Overview → Coming Up → tap "Income expected (30 days)" → each deposit listed; total equals the sum of the rows.

**PR 1.2 Bill classification**
- Step 6 projects only bill-like payees (utilities, insurance, phone, loan, mortgage, subscriptions, arrangements, family obligations). Merchant purchases (fuel, groceries, retail, restaurants) are NOT projected as bills; they stay in the measured everyday-spending budget, which already exists (`measuredEverydaySpending`). (DECISION D-3.)
- Debts and cards with no due day: no longer dated the 1st. Their minimum is listed under "Due date needed" and reserved inside the 30-day window without a fake date. (DECISION D-4.)
- Bills Due shows the six groups: confirmed recurring · inferred needs review · purchases that are not bills · one-time · arrangements · past due. Each row: payee, amount, contractual due date, grace deadline (separate), frequency, entity, paying account, last paid, next due, status, verified/inferred.
- Actions on each row reuse Bill Review: confirm, edit, dismiss ("Not a bill"), and a new "Needs review" flag.
- Tests: a household with Circle K / Walmart repeats → zero bill projections from them, everyday spending unchanged; card with no due day → no Dec-1 event, appears in "Due date needed", still reserved; 30-day total itemized by group sums to the old engine total minus the removed merchant projections.

**PR 1.3 Transaction import review**
- Parser: accept `($12.00)`, Unicode minus, `$-12.00`, Today/Yesterday, date-header grouping, two-line rows; refuse a trailing running balance as the amount; sign from section/column context, and an unsigned row with no context becomes a QUESTION, never a guessed deposit.
- Rows extracted before the day is answered are shown (greyed, "day needed") instead of hidden.
- Review card lists every row: approve / reject / edit (date, description, amount, type, category, entity) individually and in bulk; category suggested from `categoryRules` + `categorize()`; corrections become rules.
- Types: deposit, expense, transfer, debt-payment, refund, reimbursement (new categories).
- `hold` truly holds.
- Tests: OCR fixtures for each format; per-row reject not written; learned rule applied; hold writes nothing.

**PR 1.4 Ledger integrity: outstanding, pending, document links (schema change — Tier B, needs your approval, D-5)**
- Migration on `transactions`: `pending boolean`, `cleared_on date`, `outstanding boolean` (written, not yet cleared — e.g. a check), `source text`, `doc_id text`, `economic_entity` (reuse `entity_override` if present), `linked_obligation_id`, `linked_debt_id`, `reimburses_id`. Additive, nullable, no data rewritten.
- Balance math: an outstanding row is subtracted from a checkpoint balance even if dated before it, until cleared; a posted row that matches a pending row (same account, amount, ±5 days, similar payee) replaces it, never adds to it.
- The $2,201 case becomes a test: outstanding check lowers Personal now; Poe Properties expense counted once under Poe Properties; a receivable from Poe Properties to Personal listed (not assumed); the 3322 → 7206 transfer, when it arrives, is a transfer that settles the receivable, never income.
- Sync carries the new fields.

### Phase 2 — Connected records
- Reuse: `settleOccurrences`, `resolveDebt`, `family_documents`, `books-intake-cloud`.
- Add: transaction ↔ bill/debt links set on approve (suggested, confirmable); `deriveDebts` also reads confirmed loan bills with a balance and `data.debts`, one record per debt (dedupe by account/loan last-4); `family_documents` gains `account_id / debt_id / obligation_id` (additive migration); a field-change history (`money_record_changes`: record, field, old, new, document, approved_by, approved_at) — statement facts are proposed, never silently written; a Documents section on each account, debt and bill.
- Tests: $500 card payment linked once, balance changes only from statement or labeled estimate; mortgage payment not treated as full principal; statement upload proposes changes and writes history on approve.

### Phase 3 — Debt Freedom and status
- Reuse: `planDebtFreedom`, `compareStrategies`, `billStatusOf`, `graceState`, `extraDebtCapacity`.
- Add: one obligation status field (current / due soon / due today / past due / in grace / payment pending / paid / arrangement / needs verification), derived from statements and payment records, never from absence of a transaction alone; status dashboard (counts, verified past-due total, needs-verification count); "bring current" total ahead of extra payments; debt totals by type and by entity (mortgage / card / loan / other, business vs personal) with no double counting; scenario presets $100/$250/$500/$1,000/custom; extra capped by `extraDebtCapacity` after past-due catch-up and the cushion plan; missing-data list per debt.
- Tests: snowball vs avalanche ordering, rollover, interest savings; scenario cannot exceed capacity; past-due catch-up first.

### Phase 4 — Safe-to-Spend, budgets, $10,000 cushion, forecasts
- Reuse: `buildSafeToSpend`, `reserveStatus`, `cash-forecast.js`, `money-paychecks.js`.
- Add: 7/14 horizons in the forecast beside 30/60/90, per entity, missing-information list per horizon; the $10,000 checking-balance goal on Chase 7206 with milestones $3,000 / $5,000 / $7,500 / $10,000, monthly retain capacity, estimated date, effect of a spend or debt payment on that date; once reached, an opt-in "protect $10,000 as minimum cushion" switch; manually designated reserve kept separate from the goal (already modeled; the UI makes it explicit); a monthly summary screen per entity (Task 13) built from the same engine outputs, with a combined reporting view that never counts business cash as personal.
- Tests: goal never subtracted before reached; protect switch moves the cushion exactly once; reserve + goal never double counted; each summary figure equals the engine figure it reads.

### Phase 5 — Money assistant
- Reuse: `lib/llm-providers.js` road (sovereign-first), engine functions as the only source of numbers.
- Add: an "Ask" panel inside Money; the model maps the question to a fixed set of calculation calls (safe-to-spend, afford(amount), income(window), debt totals, behind-on, bring-current, payoff(strategy, extra), goal date, balance(date)) with follow-up state (a what-if spend carried into the next question); every answer renders the engine result with breakdown, source records, data date, verified/estimated, and missing information. The model never produces a number itself; a test asserts every dollar in an answer exists in the calculation output.
- Decision D-7 governs the model road.

---

## 4. Decisions needing your approval

- **D-1 Christiana.** The code has no person or pocket named Christiana. Is Christiana a separate person whose money needs its own pocket (an entity or a private account set), and which accounts are hers?
- **D-2 Inferred income.** Recommend: the verified Safe-to-Spend counts only entered/confirmed income; inferred paychecks show as a separate "+$X if it arrives" line. Effect: the headline Safe-to-Spend will likely DROP until pay schedules are entered.
- **D-3 Merchant purchases.** Recommend: never project fuel/grocery/retail repeats as bills; they live in the everyday-spending budget. Effect: Bills Due 30-day total drops by the removed projections; Safe-to-Spend is protected by the spending budget instead.
- **D-4 Debts with no due day.** Recommend: reserve their minimum inside the 30-day window under "Due date needed" (no fake date), and ask for the real date.
- **D-5 Schema change (PR 1.4, Phase 2).** Additive nullable columns on `transactions`, `family_documents`, and a new change-history table. Tier B; the NAS migration lane is red while `TS_AUTHKEY` is revoked, so these migrations cannot apply to the live database until a new key is minted.
- **D-6 Merge control.** Each PR carries the `hold` label; you merge. Confirm.
- **D-7 Assistant model (Phase 5).** Sovereign (NAS model) first with a cloud fallback, or cloud only.

## 4a. Decisions as approved (2026-11-17)

- D-1 Christiana: her own pocket, never mixed with Personal, Poe Properties or TLC. Which accounts are hers is asked when Phase 2 needs it.
- D-2 Approved: unconfirmed income shown apart, never guaranteed cash in Safe-to-Spend; recurring paychecks and schedules can be verified. (Built in PR 1.1.)
- D-3 Approved: ordinary merchant purchases count against spending budgets; real recurring subscriptions are still recognized and verified. (PR 1.2.)
- D-4 Approved with clarification: no confirmed due date → "Due date needed"; known minimums stay in planning with no fictional date and never shown as verified due on a day. (PR 1.2.)
- D-5 Additive schema approved in principle. No production migration until authorized database access is restored (`TS_AUTHKEY`), a backup is confirmed, and migration safety is tested. Darrell's work is not modified.
- D-6 Approved: every PR carries `hold` until authorized.
- D-7 NAS-hosted model first, optional cloud fallback; no financial record or document leaves for an external model without authorization each time.
- $10,000 Personal checking goal kept as a growth goal; never subtracted from Safe-to-Spend.

These are recorded here (Layer 4). A DR records them once its number is reserved on origin (`scripts/claim-decision-number.mjs --reserve`), which pushes a `reserve/dr-*` ref; this session pushes only its working branch, so the reservation is left to the next authorized push.

## 4b. Real transaction corrections (live records, not code)

Live records are on the NAS; this sandbox cannot read or write them. What each needs:

1. **Check #9879, $2,200.88, cleared Personal Chase 7206** and **the $2,201 reimbursement transfer 3322 → 7206.** The two differ by **$0.12**; reconciliation must link them with that difference shown, not assume they are equal. The link (expense belongs to Poe Properties, check counted once, transfer settles the receivable, never income) needs the `reimburses_id` / economic-entity fields of PR 1.4. Until then: the transfer row is already excluded from income by the own-account-transfer rule (pinned in `money-income-truth.test.jsx`, the $2,201 case); the check row should carry Poe Properties as its entity in Transactions (the existing `entityOverride` edit).
2. **The $837 Zelle labeled TLC was a tithe.** In the app: Money → Transactions → that row → category **Charitable** (the existing category the tithe/church rules use), entity **Personal**. A distinct "Tithes / Church Giving" label is added in PR 1.3. Open question for that row: which account did it leave? If it left a TLC account, the cash left TLC while the giving is Personal: an inter-entity item for PR 1.4, not only a category.

## 4c. PR 1.1 Income Accuracy — what changed and why (2026-11-17)

Engine (`app/src/lib/safe-to-spend.js`):
- `incomeEvents`: every projected deposit now carries `status` (confirmed / inferred / date-assumed), `statusNote`, `frequency`, `accountId` (the account the deposits actually land in), `salaryId`, and for an inferred paycheck matched to an income source a `confirm` object (the schedule the deposits show).
- `scheduledLedgerEvents` (new, extracted from `obligationEvents` step 2): one reader for deposits typed into the register ahead of time, used by the walk AND the income windows (the windows previously missed them).
- `comingUp`: `income7/14/30/60/90` each = `{ total, confirmed, unconfirmed, through, items[] }`; new `billsBefore30` = for each bill, bills due through its date and the confirmed / unconfirmed income arriving by then.
- `forScope`: the day-by-day walk counts CONFIRMED income only (`walkCash`, extracted); unconfirmed income is walked a second time into `lines.ifUnconfirmedArrives` and listed in `unconfirmedIncomeItems`. `lines.unconfirmedIncome` added. Inferred income no longer forces the "estimate" status (it no longer affects the figure); a reason line says how much is left out.
- `consolidated`: sums the new lines and windows.

Consumers:
- `money-paychecks.js`: the budget-by-paycheck still cuts periods at unconfirmed paydays (labeled inferred), so that view is unchanged.
- `cash-forecast.js` + `BooksTransactions.jsx`: projected balances exclude unconfirmed income; a line under the forecast names the unconfirmed amount by +30/+60/+90.
- `MoneyComingUp.jsx`: the mislabeled "income expected before these are due" is now "income expected in the next N days: $X ($A confirmed, $B not confirmed)"; "Expected income" lists every deposit for 7/14/30/60/90 with source, date, entity, account, frequency, status and a Confirm button; new "Income arriving before each bill"; the Safe to Spend line says it counts confirmed income only and what it would read if the rest arrives.
- `MoneyOverview.jsx`: Confirm saves `moneyPlan.settings.incomeSchedule[salaryId]` (`frequency, nextDate, amount, confirmedAt`) — the same record Money → Setup edits.

Not in 1.1 (stated, not dropped): an inferred paycheck NOT tied to an income source cannot be confirmed in one tap (it needs an income-source record); the row says so. re-review: with PR 1.3 (import review), 2026-11-24.

## 4d. PR 1.2 Bills Accuracy — what changed and why (2026-11-17)

Engine (`app/src/lib/safe-to-spend.js`):
- `payeeCategory` / `isMerchantPurchase` (new): a repeating payee whose rows (else its name, via `categorize`) read as fuel, groceries, dining or household is a purchase, not a bill. `obligationEvents` steps 6 and 6b no longer project it; it is listed in `notBills` (label, category, monthly, cadence, last paid). Subscriptions, utilities, insurance, phone are still projected, subscriptions flagged `subscription: true`.
- `monthlyAccruals`: the removed repeats stay in the plan once. Sample figures: inside the measured spending (unchanged rule). Family's own household figure: inside that figure (no longer carved out). Neither: their monthly amount is reserved day by day as `livingParts.repeatingPurchases`.
- Step 3: a debt with no due day (and a rental mortgage with no mortgage due day) is no longer dated the 1st. Its known minimum is reserved once per month from today, `dateUnknown`, `dueDate: null`, status "Needs verification", listed in `dateNeeded`. A stable key per calendar month (`occKey`) keeps a "paid" mark on it all month.
- `billClassOf` / `BILL_CLASSES` (new): confirmed · inferred-review · one-time · arrangement · past-due · due-date-needed. `windows.groups30` partitions the 30-day bills exactly.

UI: Coming Up's 30-day bills open grouped with subtotals; "date needed" in place of a date (Coming Up and the Bills tab); a "Repeating purchases (not bills)" line.

Measured on the test household: 30-day bills $675.49 → $375.49 ($300 of Circle K / Walmart purchases no longer counted as bills); the everyday-spending reserve $0 → $317.42/mo; Safe to Spend $4,824.51 → $4,811.65 (the money moved, it was not dropped).

Tests: `money-bills-accuracy.test.jsx` (12); 11 fail on the 1.1 base, all pass here. One forecast test comment updated (its numbers hold).

## 4e. PR 1.3a Transaction import accuracy — what changed and why (2026-11-17)

`lib/snapshot-rows.js` (new) reads a banking-app screenshot's rows; `books-intake-extract.js` uses it.

Measured on the OLD reader with the same text: `$-45.00`, `−82.10`, `($161.04)`, `Today …`, rows under a date heading, and two-line rows were all dropped (no row); `-45.00 4,642.18` was saved as a **+$4,642.18 deposit** (the running balance); a screen without a known day produced no rows at all.

Now:
- every money form is read with its sign; two trailing amounts are amount then running balance;
- Today / Yesterday, date headings and two-line rows are read;
- signs are never guessed: on a screen that signs any row, unsigned rows are money in; on a screen that signs none, a blocking question asks "money out / money in / hold";
- rows are shown on the review card before the day is answered ("day needed"), never written until then;
- "hold" (balance or signs question) now writes nothing (before, Approve wrote the rows);
- the review card lists the rows themselves (day, description, signed amount, pending / transfer / debt payment), not a count.

Tests: `money-import-accuracy.test.jsx` (24): the pipeline, hold and card cases fail on the old code; the format cases are shown failing on the old reader above.

Phase 1.3b (next): per-row approve / reject / edit / category on the card, learned category rules applied on import, refund / reimbursement / tithes categories. Not started in this PR.

## 4f. PR 1.3b Import review — what changed and why (2026-11-17)

`lib/intake-row-review.js` (new): every imported row can be added or left out and given a category before Approve; categories are suggested from the family's own rules first, then the built-in rules (spending categories only). `commitDoc` now writes the reviewed rows. Found and fixed: Approve used to re-read the raw extraction and wrote a row the person had left out; the built-in rules file every Zelle as "transfer", which the engine treats as never a payment, so they no longer suggest it. Tests: `money-import-review.test.jsx` (9).

## 4g. Phase 2a Loans entered as bills reach Debts (2026-11-18)

Gap X1, the part that needs no database change. Approved by Christina 2026-11-18 ("continue preparing the next phase of financial integration").

- **What changed:** `deriveDebts` (`app/src/lib/financial-engineering.js`) now also lists a confirmed bill that carries a remaining balance (`recurringObligations[].balance`) as a debt: balance, rate, monthly payment, lender, last four, past-due amount, entity. The six First State Bank loans were entered this way and never reached the Debts tab.
- **One record per debt:** the bill is skipped when the same loan is already listed: its own debt account, an account with the same last four, or the rental mortgage it pays when that mortgage has a balance. Two bills for one loan (same lender and last four) count once.
- **Safe-to-Spend does not move:** the bill already reserves the payment, so Safe-to-Spend never adds a "minimum" for a bill-sourced debt. The case that needs this: a Poe Properties loan paid from the personal account (the bill marks itself counted only in the paying pocket).
- **Debts screen:** the row says "From the bill · ending 5312 · change it on Bills" and shows the past-due amount; it offers no editor, because its numbers live on the bill.
- **Not in this slice:** the hand-kept `data.debts` list (empty in real use); transaction ↔ debt links on approve; document links and the change history (both need the additive migration, held under D-5).
- **Tests:** `money-loan-bills-in-debts.test.js` (9) and `money-loan-bills-in-debts-screen.test.jsx` (1). Proven to catch: with the Safe-to-Spend guard removed, the cross-pocket case fails.

## 6. Morning report (overnight 2026-11-17)

### Pull requests (all labeled `hold`; nothing merged or deployed)

| PR | Phase | Branch | Base | CI |
|---|---|---|---|---|
| #2704 | 1.1 Income accuracy | `ccr-a1ebb734-6nt3v4` | `main` | all green on c281ad7 |
| #2705 | 1.2 Bills accuracy | `money/phase-1-2-bills` | #2704 | all app checks green; `probe` red (preview workflow builds the wrong Vercel URL, not this code; commented on the PR) |
| #2706 | 1.3a Import accuracy | `money/phase-1-3-import` | #2705 | all app checks green on 67bd586; `probe` red (same preview-URL cause; commented) |
| #2707 | 1.3b Import review | `money/phase-1-3b-review` | #2706 | all app checks green on a3952c5; `probe` red (same preview-URL cause; commented) |

Merge order when authorized: #2704, then #2705, #2706, #2707 (each retargets to `main` when its base merges). Auto-merge: the bot armed #2704 once at 04:52:01 and it was disabled at 04:52:02 and confirmed off; the `money/*` branches are outside the auto-merge lane entirely.

### Test results
- Full local suite on the 1.3a head (1.1 + 1.2 + 1.3a): 1,979 files, 37,685 tests, all green.
- 1.3b: all Money, intake, categorize and UI-standards suites (37 files, 476 tests) green; full lint and the 41 `lint + guards` scripts green.
- Each new suite was shown failing on the code before it (proven to catch).

### Found and fixed overnight (beyond the plan)
- The `$3,200` vs `$0` unconfirmed-income question: both right (Safe to Spend's window ended on a payday one day past the 30-day list); every unconfirmed dollar is now listed with its deposit, date, account and status, and a test reconciles the two to the cent.
- New Coming Up buttons were 32px; the UI-standards test caught it; now 36px.
- Debts with no due date: a first version reserved two payments in 30 days; corrected to one per month.
- A no-due-date debt showed "Confirmed upcoming"; now "Needs verification".
- The old screenshot reader saved a $45 purchase as a +$4,642.18 deposit (running balance); fixed.
- A left-out import row was still written on Approve; fixed.

### Decisions 2026-11-17 (morning, Christina)
1. A separate Tithes / Church Giving category is added in Phase 1.4. Until then the $837 church tithe is Personal → Charitable (done by hand in Transactions; this work changes no live record).
2. Remembering category corrections made on the import card is added in Phase 1.4.
3. Christiana's accounts stay out of the current implementation; scope is Personal, Poe Properties and TLC Therapy Solutions.
4. Phase 1.4 waits for authorized database access, a confirmed backup and a tested migration.
5. The reconciliation of check #9879 ($2,200.88) with the $2,201 reimbursement from Poe Properties 3322 is preserved for Phase 1.4, with its $0.12 difference shown, never assumed away.
6. Darrell's preview workflow is not modified without his approval.

### Preview probe, verified 2026-11-17 12:22 UTC
- On push, `preview-isolation-probe.yml` probes ONE hard-coded address (`…git-money-phase-7b032e…`, the preview of an earlier Money branch, added 2026-11-10 in #2591). On every newer `money/**` branch that address is Vercel's 404, so the probe stops before loading the build under test.
- Dispatched by hand against each PR's real preview (runs 16, 17, 18, read-only, the workflow's own dispatch input): each lands on `vercel.com/login`. Vercel Deployment Protection is on, so the probe cannot measure these previews from outside at any address.
- The probe is not part of deployment. Production deploys come from `deploy-cloudflare-pages.yml` on push to `main` (backstopped by `auto-merge.yml`); the live site is checked by `site-health.yml`. Neither reads the probe. Last five deploys succeeded (latest 10:43 UTC on e6997de); last site-health run succeeded.
- None of the four PRs touches preview isolation, Supabase settings, Vercel, workflows, deploy or the service worker. All four branches merge cleanly onto `main` e6997de, and `main`'s new commits touch no Money file.

### Outstanding / needs your decision
1. **Merge authorization** for #2704 → #2707, in order.
2. **"Tithes / Church Giving" as its own category**: `charitable` is in the sync allow-list and possibly a database check; recommended with the Phase 1.4 database work. Today: file the $837 Zelle as Charitable under Personal.
3. **Saving import-card corrections as rules**: needs a one-line hook in the app shell (frozen line budget) or using the existing rule-saver, which also rewrites past rows from that payee. Recommendation: a rule-only hook in Phase 1.4.
4. **Preview probe workflow** (Darrell's): its Vercel hostname for `money/*` branches is wrong (`…git-money-phase-7b032e…` for every such branch). Not touched.
5. **Database access**: Phase 1.4 (outstanding checks, the $2,201 check ↔ $2,201 reimbursement link with its $0.12 difference, pending/posted matching, document links) needs additive columns; per your rule no migration runs until `TS_AUTHKEY` is renewed, a backup is confirmed and the migration is tested.
6. **Christiana's accounts**: needed when Phase 2 starts.

### Phone verification after deploy
Listed in each PR body. In short: Money → Overview → Coming Up (income list, income before each bill, the Safe to Spend note, the six bill groups, repeating purchases, "date needed"); Money → Upload a Chase screenshot (rows listed, signs right, add/leave out/recategorize, Hold adds nothing).

## 5. Recommended first implementation

PR 1.1 Income truth. Pure engine + UI, no migration, no stored record touched,
directly answers the $9,931 question, and removes the one mislabel that makes the
income figure look like something it is not. With D-2 approved it also stops
inferred income from being presented as verified spending money.
