# FOS Money — Phase 1.4 handoff (2026-11-17)

Source of truth for the plan, decisions and per-PR change logs:
`docs/99-session-notes/2026-11-17-fos-money-assessment-and-plan.md`.
Thread handoff: `MONEY_HANDOFF.md`.

## 1. What is complete (merged and deployed)

| PR | Phase | What changed |
|---|---|---|
| #2704 | 1.1 Income | Every expected deposit listed (7/14/30/60/90) with source, date, entity, account, frequency, status; window total labeled as such; income arriving before each bill is its own list; Safe to Spend counts confirmed income only; unconfirmed income listed apart and reconciled to the cent. |
| #2705 | 1.2 Bills | Repeating fuel/grocery/dining/household purchases are spending, not bills; no invented due dates ("Due date needed", Needs verification); six bill groups summing to the 30-day total; `lib/money-dates.js`, `lib/bill-classes.js`. |
| #2706 | 1.3a Import | `lib/snapshot-rows.js`: every money form read with its sign, running balance never the amount, Today/Yesterday, date headings, two-line rows; signs never guessed; rows shown before the day is answered; Hold holds. |
| #2707 | 1.3b Review | `lib/intake-row-review.js`: per-row add / leave out / category before Approve; suggestions from the family's own rules first, built-in rules suggest spending categories only; Approve writes exactly the reviewed rows. |

#2707 was stacked on #2706, so its squash landed on `money/phase-1-3-import`; #2715 carried that branch (tree identical to #2707's reviewed head) onto `main`.

No live financial record was changed. No migration was run.

## 2. Decisions in force (Christina, 2026-11-17)

1. Separate **Tithes / Church Giving** category: Phase 1.4. Until then the $837 church tithe is Personal → Charitable (done by hand in Transactions).
2. **Remember category corrections** made on the import card: Phase 1.4.
3. **Christiana's accounts** stay out of scope. Entities: Personal, Poe Properties, TLC Therapy Solutions.
4. Phase 1.4 **waits for** authorized database access (renewed `TS_AUTHKEY`), a **confirmed backup**, and a **tested migration**.
5. **Check #9879 ($2,200.88) ↔ $2,201 reimbursement** from Poe Properties 3322 to Personal 7206: preserved for Phase 1.4, linked with the **$0.12 difference shown**, never assumed away.
6. Darrell's preview workflow is not modified without his approval.
7. Every PR stays on `hold`; merge and deploy only with Christina's explicit approval.

## 3. Phase 1.4 scope (Ledger integrity)

Additive, nullable database columns only; no existing data rewritten.

| Need | Why (measured defect) | Change |
|---|---|---|
| Outstanding checks | `balanceFromCheckpoints` treats every row dated on/before a checkpoint as inside the bank balance; an uncleared check (#9879 before it cleared) overstated Personal cash. | `transactions.outstanding boolean`, `cleared_on date`; the balance math subtracts an outstanding row from a checkpoint until it clears. |
| Pending → posted | A pending row that later posts with a new date/description is a new dedupe key and can be subtracted twice. | `transactions.pending boolean`; a posted row matching a pending one (same account, amount, ±5 days, similar payee) replaces it. |
| Provenance | `transactionToRow` drops `pending`, `source`, `docId`; after sync the link to the original document is lost. | `transactions.source text`, `doc_id text`; sync carries them. |
| Reimbursements / inter-entity | No receivable record; `entityOverride` exists but the engine ignores it. | `transactions.reimburses_id`, economic entity honored by the engine; the $2,201 case as a test (check counted once under Poe Properties, transfer settles the receivable, never income, $0.12 shown). |
| Links to obligations | No field links a transaction to a bill or debt. | `transactions.linked_obligation_id`, `linked_debt_id` (suggested on approve, confirmable). |
| Tithes category | Decision 1. | `tithes` category ("Tithes / Church Giving"), added to `TX_CATEGORIES`, the sync allow-list (`verified-ledger-sync.js`), spending priorities, and any DB check constraint found in the census. |
| Remember corrections | Decision 2. | A rule-only save (no back-apply to past rows) wired from the import card; one hook from the app shell (its line budget is frozen, so an existing line carries the prop). |

### Preconditions (all four, before any migration)
1. `TS_AUTHKEY` renewed (a Reusable + Ephemeral key only Darrell can mint) so the runner road to the NAS works.
2. A read-only census of the live tables (`scripts/money-records-read.sql`, run by ConnectBot on the phone per DR-1159 road 2; the repository is public, so no Money record is ever printed in a workflow log).
3. A confirmed backup of the live database.
4. The migration applied first to a throwaway PostgreSQL in CI (the repo's replay lane) and proven reversible/additive.

### Next implementation steps (in order)
1. Census + backup confirmation (Christina/Darrell's hand; report what the census shows).
2. Migration file (additive columns + tithes category) and its replay test; NO apply to production until approved.
3. Engine: outstanding/pending/cleared balance math; pending→posted match; economic entity; receivable link. Tests first, including the $2,201 / $2,200.88 / $0.12 case.
4. Sync: carry the new fields.
5. UI: outstanding checks on Coming Up and the account trail; reimbursement pairing; tithes category; rule-only correction learning.
6. PR on `hold`; merge and apply the migration only with explicit approval, after the backup is confirmed.

## 4. Known items outside Phase 1.4
- `preview-isolation-probe.yml` (Darrell's) probes a hard-coded preview address and Vercel previews sit behind Deployment Protection, so it cannot pass on `money/*` branches; left for Darrell.
- `scripts/money-live-probe.mjs` expects 9 Coming Up figures; the panel shows more since earlier PRs; stale before this work.
- Phases 2–5 (connected records, debt status, safe-to-spend/savings, assistant) follow the approved plan.
