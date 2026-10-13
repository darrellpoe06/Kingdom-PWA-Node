# Financial Systems — Comprehensive Review: Opportunities & Constraints (2026-07-31)

Requested by Darrell mid-session ("comprehensive review of the financial systems opportunities and constraints", plus "why is the monolith still an issue, especially since we have Ari?"), triggered by Christina's account-balance report. Run against DR-0239's seven dimensions; dimensions that cannot run from this environment are named with a why and a `re-review:` date — never silently skipped.

---

## 1. The headline finding (SHOULD → ARE → GAPS → CLOSE, DR-0219)

**SHOULD.** A manually entered Account Balance represents the current available balance on every surface unless the steward explicitly recalculates (Christina 2026-07-31; DR-0061 — a surface is a live view of real state).

**ARE (before this session's fix).** Every displayed balance came from `deriveAccountBalances` (`app/src/lib/financial-engineering.js:91`): `(openingBalance ?? balance) + Σ cleared transactions`. The manual edit (`updateAccount`, monolith) wrote the entered number into `balance` — the derivation **anchor at the start of the ledger** — so the app displayed *entered + the entire imported history*. $4,350.42 typed → $16,953 shown ($4,350.42 + ≈$12,602.58 net of imported rows). Compounding it: the accounts sync round-trip **strips `openingBalance`** (schema v1.2 has no such column — `accounts-sync.js` `fromRow`; `unionPreservingLocal` keeps the cloud row on a matching slug), so on a signed-in device the manual balance is always the anchor. Imported per-row bank balances (`t.balance`) were NOT the culprit — they are display/audit-only (`runningBalanceByTxId`, `auditBalanceContinuity`).

**GAPS.** The manual entry was never displayable as entered on a ledgered account; `openingBalance` was device-local and silently lost; the edit form pre-filled the stored anchor, not the displayed number.

**CLOSE (shipped this session, PR from `claude/account-balance-override-yaydwy`).** A manual balance edit on a ledgered account now lands as a **visible `balance-adjustment` transaction** of exactly (entered − derived-now) — `applyManualBalance` / `resolveAccountUpdates` in `financial-engineering.js` — so every surface (Accounts, Transactions, Right Now, Primary card, forecasts) lands on the entered number, on every device, because the correction lives in the synced ledger, not in a device-local field. Adjustments are excluded from In/Out/Net like transfers (`isBalanceAdjustment`, `imported-view.js`; mirrored in `ledger-integrity.js`); the edit form pre-fills the displayed balance so an unchanged save is a no-op. Proven-to-catch tests reproduce the 16,953 defect and verify the close.

## 2. The monolith — why it is still an issue, and what Ari changes

**Constraint (lived this session).** `poe-financial-mvp-v28.jsx` is frozen at **5,444 lines** (`scripts/monolith-budget.json`; DR-0078 ratchet: down only, never up). It still holds ALL numeric CRUD — `addAccount`/`updateAccount`/`addTransaction`/`commitImportedRows` — plus the whole table-sync wiring loop and the derived-totals memos. Every finance fix must thread through it under the hard ratchet: this session's one-line interception had to be reshaped (logic extracted to `financial-engineering.js`, two comments compressed) just to hold the budget. That is the freeze working as designed — it prevents growth — but the freeze **does not shrink anything by itself**. The shell shrinks only when someone does an extraction, and extractions have been incremental (BooksTransactions, BooksAccounts, Debts, Imported are peeled; the state+CRUD+sync core is not).

**Opportunity (Ari).** Monolith extraction is exactly the work Ari's agent-team model (DR-0154 project-manager, DR-0158 workflow expert / agent team lead, DR-0256 planner-first team with brakes) is suited to: mechanical, verifiable, gate-protected. Each peel is characterize-before-change (DR-0076 §5) + the 6,900-test suite + the budget guard's re-freeze downward — a peel that breaks anything fails deterministically. Concrete peel order, highest value first:
1. **The table-sync wiring loop** (monolith ~2129–2281) — self-contained, list-driven, ~150 lines.
2. **Numeric CRUD** (accounts/transactions reducers + their sync patches) into a `lib/books-crud.js` that takes `setData`/`syncs` as arguments — this is where finance bugs live, and where this session paid the tax.
3. **Derived-totals memos** (~3520–3590) into a composed hook.
Each lands as its own DR-0078-lane PR with a lowered budget number.

**CORRECTED IN-SESSION (Darrell 2026-07-31: "there is an explicit commitment to reducing the monolith").** The original draft of this section said "recommend queuing this as Ari-team work" — that framing was the DR-0111-class miss: **DR-0078's reduction is a DECIDED, standing commitment**, so a peel that is buildable now is built now (DR-0236), never re-presented as an open question. How intentions work here, recorded so it is not re-lost: a declared intention/DR **is** the authorization; the agent executes toward it and reports, and only a genuine bright line re-opens the decision. Accordingly the **first peel shipped this same session**: the accounts CRUD (add/update/toggle-legal/delete + sync patches — the exact code the balance fix threaded through) moved verbatim to `lib/books-accounts-crud.js` with its own unit suite (`books-accounts-crud.test.js`, characterize-before-change pins), and the ratchet re-froze **5,444 → 5,404**. The remaining peels (table-sync loop, transactions CRUD, derived-totals memos) continue under the same standing authorization, one lane-PR each — Ari's team runs them; nothing waits on a re-ask.

## 3. Structural constraint: the accounts sync schema silently drops fields

Schema v1.2 `accounts` carries only slug/entity/display_name/institution/type/fragment/balance/in_legal/is_primary. `toRow`/`fromRow` (`accounts-sync.js`) therefore drop **`openingBalance`, `notes`, `rate`, `minPayment`, `treatAsDebt`** on the round-trip, and the cloud row replaces the local one on a matching slug. Consequence: **debt terms set on one device (Debts tab inline rate/min editors) and account notes do not reach other devices and can be lost on the setting device after a merge.** The balance fix routed around this class by putting truth in the ledger; the remaining fields still sit in it.
- Opportunity A (doctrine): keep "durable truth lives in a synced table" and add the missing columns in a schema v1.3 migration (one migration, five columns).
- Opportunity B (interim): a field-preserving accounts merge (carry local-only fields over the incoming cloud row) — device-sticky but stops the loss.
- **Queue: `re-review: 2026-08-07`** — pick A (recommended) and ship the migration + toRow/fromRow mapping.

## 4. What is strong (keep building on it)

- **One derivation engine.** Balances derive in one place and every surface reads it (`deriveAccountBalances` → rollups, cash-on-hand, debts, forecasts, child views). This is why the fix could be one primitive.
- **Independent verification layer.** `ledger-integrity.js` recomputes in integer cents on a separate code path; `auditBalanceContinuity` proves statement completeness from the bank's own arithmetic; `reconcileAccounts` proves account-of-record. Honest-or-absent throughout.
- **The ingest overlay stays an overlay.** Bank `ledger_balance` renders beside the books figure with a delta — it never overwrites (correct per Christina's #5/#6).

## 5. Opportunities (ranked)

1. **One-tap reconcile.** The Accounts row already shows the bank-vs-books delta; add "accept bank balance" that posts the delta as a `balance-adjustment` row (the primitive this PR shipped). Small, high-trust.
2. **Ari-driven monolith peel program** (§2).
3. **Schema v1.3 account columns** (§3).
4. **Finance ingest off legacy n8n** (DR-0132 P1–P5): imported-transactions still rides the legacy `/n8n` transport name; born-Python `nas-finance-ingest` exists — continue the phased migration; route rename tracked under DR-0075.
5. **Adjustment-row register affordance:** show adjustment rows with a distinct marker in BooksTransactions so a steward can see and (by deleting the row) undo a manual set — the explicit "recalculate" Christina described, expressed in ledger terms.

## 6. Dimensions that could not run here (named, dated — DR-0239)

- **Journey walks + surface-says-truth on the LIVE app, and form-factor MEASURED:** this sandbox has no route to poetech.us (the site-health runner is the team's eye, DR-0125). `re-review: 2026-08-07` — after this PR deploys, run the DR-0104 live user-review pass (Reviewer mode) on Accounts → edit balance → Transactions → Right Now, and dispatch `site-health.yml` for the outside-in probe.
- **Delivery-context:** covered for this change (lane gates ran locally: full Vitest, lint, real build); live deploy proof lands with the PR merge (DR-0107) — verify the deploy run's `head_sha` matches `main` at merge time.

## 7. Work queue out of this review

| Item | Owner lane | Date |
| --- | --- | --- |
| Live user-review pass + site-health dispatch after merge | DR-0104 | 2026-08-07 |
| Schema v1.3: sync the dropped account fields (§3) | migration PR | 2026-08-07 |
| One-tap bank reconcile using adjustment rows | app PR | 2026-08-14 |
| Monolith peels 2–4 (table-sync loop, transactions CRUD, derived memos) — peel 1 SHIPPED this session (5,444 → 5,404) | Ari team, standing DR-0078 authorization | 2026-08-14 |
| Adjustment-row marker + undo in the register | app PR | 2026-08-14 |
