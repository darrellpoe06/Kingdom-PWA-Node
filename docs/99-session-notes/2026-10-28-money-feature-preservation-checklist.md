# Money redesign — feature-preservation checklist (2026-10-28)

**Asked by:** Christina, 2026-10-28 — "Preserve all existing Money functionality ... nothing should be deleted, disconnected, or made inaccessible." This is the inventory taken BEFORE any change, and the ledger each item is verified against AFTER. Layer 4 working artifact; the decision is DR-1270.

**How Money is wired today.** Money is the shell's `view === 'books'` plus the `booksView` sub-tab state (`app/src/poe-financial-mvp-v28.jsx:1051`, sub-nav `:4269-4280`, mount block `:4307-4330`). The default sub-tab is `calendar` (`app/src/lib/nav-history.js` `DEFAULT_BOOKS`). The Money label, the phone dock's Money button (`lib/nav-items.jsx:48, :232`), the LifeHub Money tile (`lib/life-hub.js:84`, which calls `setView('books')` only), deep links (`?view=books&sub=…`), browser Back/Forward, HelpButton and TTSControl all key off that one pair of values.

## A. Every existing Money feature, where it lives now, where it lands

| # | Feature (component · file) | Mounted today as | Lands in the new nav | Props / data preserved | Verified after |
|---|---|---|---|---|---|
| 1 | Entities · `BooksEntities.jsx` (inline edit of name/type/notes, chips filter, BusinessRoad panel; DR-1138) | `booksView='entities'` | **Accounts → Entities** (also linked from Settings) | identical props | [x] |
| 2 | Accounts · `BooksAccounts.jsx` (add/edit/delete, Move to Legal, Treat as debt, Buffer Fund target, "looks like a debt" suggestions, reconciliation badges) | `'accounts'` | **Accounts → Accounts** (section default) | identical props | [x] |
| 3 | Debts · `Debts.jsx` + `AddDebt.jsx` + `EditDebtRow.jsx` + `DebtStatementUpload.jsx` (All Debts / Snowball plan / Payoff cascade / Kill opportunities / Add & import; TraceableNumber band) | `'debts'` | **Debt Freedom → Debts** (the planner is the section default; the legacy tab is one tap away) | identical props | [x] |
| 4 | Owed · `Obligations.jsx` (receivables/payables, aging, each door, the day's post; RLS wall 0202/0203) | `'owed'` | **Bills → Owed** | no props (self-fetching) | [x] |
| 5 | Plan · `FamilyPlan.jsx` + `LegacyProvisions.jsx` (family_plans document, trust provisions) | `'plan'` | **Goals → Plan** | no props (self-fetching) | [x] |
| 6 | Transactions · `BooksTransactions.jsx` (Upcoming/History/Evaluate, filters, sort, add/edit/delete, apply-to-payee, receipts, noise, cover-with-transfer, CSV/xlsx/OFX import, bulk import, reset/re-import, 30/60/90 forecast, All balances, Proof of the math, edit history, party learning) | `'transactions'` | **Transactions → Transactions** (section default) | identical props | [x] |
| 7 | Imported · `Imported.jsx` (period/account/category filters, grouping, running balance, LedgerEdit, auto-categorize, combine duplicates, exact-duplicate cleanup, CSV/Print reports, recurring-payments audit with keep/review/cancel) | `'imported'` (gated by `importedAllowed`, `ImportedDemoGuard`) | **Transactions → Imported** (same gate; the guard now returns to Overview) | identical props | [x] |
| 8 | Cart / Subscriptions · `Cart.jsx` (add/edit/delete, status keep/review/cancel/cancelled, true monthly cost) | `'cart'` | **Bills → Subscriptions** | identical props | [x] |
| 9 | 1099s · `Contractors1099.jsx` (outbound/inbound contractors, tax-ID vault, worker voice, Volunteers & 1099s) | `'k1099'` | **Reports → 1099s** | identical props | [x] |
| 10 | Taxes · `BooksTaxes.jsx` + `PaymentsLedgerPanel.jsx` (NAS tax archive, PDF upload, year shelf, payments table) | `'taxes'` | **Reports → Taxes** | identical props | [x] |
| 11 | Calendar · `Calendar.jsx` (recurring obligations add/edit/delete, incident log, events with reminders, tax & compliance calendar) | `'calendar'` (today's DEFAULT) | **Bills → Calendar** | identical props | [x] |
| 12 | Legal · `Legal.jsx` `LegalPlaceholder` (accounts in legal, official steps, document shelves, IP register; tier gate) | `'legal'` | **Accounts → Legal** (also Settings) | identical props | [x] |
| 13 | The ONE Upload button + panel · `BooksUploadButton.jsx` / `BooksUpload.jsx` (DR-0709) on every Books tab | header row + `BooksUploadMount` inside the PIN gate | Button stays at the right end of the Money header on EVERY section; mount stays inside the PIN gate, before any section branch | identical props | [x] |
| 14 | Financial PIN gate · `PrivateGate area="Financial"` around the whole mount | `:4308` | unchanged, wraps the whole MoneySection | — | [x] |
| 15 | Imported gate · `isImportedAllowed` + `ImportedDemoGuard` | `:635, :1297, :5052` | unchanged; guard redirects to `overview` instead of `calendar` | — | [x] |
| 16 | Deep links `?view=books&sub=<id>` for all 12 legacy subs (`VALID_BOOKS_SUBS`) | `lib/nav-history.js` | all 12 still resolve; 7 new subs added; default becomes `overview` | — | [x] |
| 17 | Help entries `books:<sub>` for every sub (`lib/help-content.js`, pinned by `help-content.test.js`) | 11 entries | 11 kept + 7 new (overview, budget, bills, goals, debt-freedom, reports, settings) | — | [x] |
| 18 | Big Picture → Money tab cross-links (`BigPictureDashboard.jsx:640-650` → accounts / transactions) | setBooksView('accounts'/'transactions') | unchanged (those subs still exist) | — | [x] |
| 19 | LifeHub Money tile (`lib/life-hub.js:84` → `setView('books')`) | lands on last sub-tab | lands on Overview (default sub); homepage file untouched | — | [x] |
| 20 | Free-tier `AdvisementBanner` hidden on books/debts; `TherapyReminder` on books/debts (`:5010, :5015`) | keyed on `booksView==='debts'` | unchanged (the legacy Debts sub keeps its id) | — | [x] |
| 21 | Forecast (top-level `view='forecast'`: Outlook / Goals (BudgetPlanner) / Scenarios / Track) | separate tab, family gate | unchanged; Reports and Goals link to it | — | [x] |
| 22 | Rentals/Properties `books.postEntry` hook (`:4333, :4370`) | `addTransaction` | unchanged | — | [x] |

## B. Data, calculations, sync — preserved untouched

- **Mutators** (shell): `addAccount/addAccounts/updateAccount/deleteAccount/toggleAccountLegal` (books-accounts-crud), `addRecurring/updateRecurring/deleteRecurring`, `addEvent/updateEvent/completeEvent/deleteEvent`, `addIncident/deleteIncident`, `addSubscription/updateSubscription/deleteSubscription`, `addContractor/updateContractor/deleteContractor`, `updateEntity`, `addTransaction/commitImportedRows/updateTransaction/recategorizePayee/deleteTransaction`, `updateRental`, `setBufferTarget`, `setPayeeEntityRules`. None change. [x]
- **Derivations**: `deriveAccountBalances`, `totals`, `computeReserves`, `bufferCurrentReal`, `computePressure`, `deriveDebts`, `projectDebt`, `projectDebtSnowball`, `projectDebtMinimumOnly`, `projectRentalSnowball`, `deriveEntityRollups`, `upcomingEvents`. None change; the new engines READ them. [x]
- **Persistence**: IndexedDB `poe-financial-v28` snapshot; `family_snapshots` jsonb; Supabase table syncs (`accounts, debts, transactions, incidents, contractors_1099, family_subscriptions, record_events, entities, rentals, budget_goals, forecast_snapshots, obligations*`). The new `data.moneyPlan` key (settings, budgets, bill statuses, goal metadata) rides the snapshot like `recurringObligations` does. No schema change. [x]
- **Imports / sync**: one-upload intake pipeline, Tx CSV/xlsx/OFX importer, bulk import, `commitImportedRows` idempotency (`imp-`/`vl-` ids), `runVerifiedLedgerSync`, transaction_noise, receipts. None change. Historical rows are never rewritten. [x]
- **Permissions**: tiers (`VIEW_TIER_REQUIREMENTS.books = foundation`), `isFamilyMember`, `importedAllowed`, `visibleTo` entity visibility, demo/reviewer no-write, RLS role wall. None change; the engine respects `visibleEntities`. [x]

## C. Defects found during the inventory (recorded, not silently fixed)

1. `budget-engine.deriveCategoryPlans` / `categorySpendMTD` count transfers, debt payments and balance adjustments as spending (`lib/budget-engine.js:244-253, :282-289`). The new Budget actuals exclude them; the legacy engine is left as is (it feeds the Forecast → Goals category rows) with a `re-review: 2026-11-15`.
2. `totals.totalConsumerDebt` and `entityRollups.debtBalance` read hand-kept `data.debts`; the Debts tab reads `deriveDebts`. The new Overview reads `deriveDebts`. Legacy unchanged, `re-review: 2026-11-15`.
3. Tx → Upcoming yields zero because `recurringObligations.nextDue` never rolls forward and detected patterns are never included (`BooksTransactions.jsx:535-559`). Bills rolls due dates forward and shows inferred patterns labeled as inferred; the Tx view is left as is (`re-review: 2026-11-15`, after Bills has been used).
4. `allAccountsCash` does not exclude `treatAsDebt` while `liveCashOnHand` does. The engine uses `liveCashOnHand` semantics.
5. `ingestData` is a hardcoded empty stub, so every bank-linked badge is dormant. Out of scope; noted.
6. `openingBalance` and per-row bank `balance` are not persisted by the sync mappers (device-local anchor). Out of scope; noted.

## D. New surfaces (additive)

Overview (Safe to Spend), Budget, Bills, Goals, Debt Freedom (+ What If), Reports hub, Settings — all under `app/src/components/money/`; engines under `app/src/lib/safe-to-spend.js`, `lib/debt-freedom.js`, `lib/what-if.js`, `lib/money-budget.js`, `lib/money-bills.js`, `lib/money-goals.js`, `lib/money-nav.js`.

## E. Verification record (2026-10-28, Phase 2, branch `ccr-acfc42eb-paa7ex`)

- **Table A ticked** by: `money-nav.test.js` (every legacy id lives in exactly one section, has a render branch in the live shell, resolves from its deep link, reaches in three taps or fewer); `money-overview-render.test.jsx` (every legacy id reaches its tab row; every new section renders real content; the phone bar shows Money's four + More); `books-upload-every-tab.test.jsx` (the one Upload on every tab, the mount inside the PIN gate); `feature-presence.test.jsx` (every pinned Books control still present); `surface-mount-integrity.test.js`; `help-content.test.js` (help for all 19 ids); `heritage-shell-navigation.test.jsx`.
- **Engines**: `safe-to-spend.test.js` 24, `debt-freedom.test.js` 23 (closed-form amortization, the published 30-year figure, hand-worked cases), `debt-engine-audit.test.js` 5 (the legacy engine's four measured defects).
- **Lint** `eslint src --max-warnings 0`: clean. **Gates** (`verify:gates`): every guard OK; the shell is 5192 lines, one under the frozen budget, re-frozen at 5192. **Build**: `vite build` green.
- **Live preview** (vite preview, Playwright, seed world): the Money tab and the homepage Money tile both open the Overview; Settings → cushion 750 → reload → the step reads Entered and the Overview shows $750 (device snapshot persistence); zero page errors on 15 captured views.
- **Cloud synchronization of `data.moneyPlan`** (verified in code, not changed): rides `family_snapshots` through `buildSnapshotPayload` and the pull merge; the push is gated by `remainderIsSeed` (recurringObligations / taxCalendar / events / capexItems), so a world whose only real edits are settings stays device-local until one of those lists holds a real row. Proposed fix (one line, awaits Christina's separate approval): count `data.moneyPlan.updatedAt` as a real-world marker in that gate. The UI reports local / pending / synchronized truthfully meanwhile.
- **Not done in Phase 2** (DR-1270 re-review 2026-11-11): switching the legacy Debts tab and the Big Picture headline to the corrected engine; the What-If simulator; bill auto-matching to ledger rows; goal kinds and account links.
