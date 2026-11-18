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

**Production, verified 2026-11-17:**
- **Deploys:** each succeeded.
  - c52cd97 (1.3a), run 44153424654, at 19:09 UTC.
  - 2b6f748 (1.3b, the final commit), run 44157360303, at 19:27 UTC.
  - Phases 1.1 and 1.2 were deployed earlier: e1c4cf6 and 826edc8.
- **Site-health** (run 44160016033, 19:35 UTC):
  - **UP. Fresh.**
  - Served build **2b6f748** = `main` tip **2b6f748**.
  - `/poetech-app/` and the bundle returned 200.
  - The sign-in road answered.
- **Two warnings in that run are not Money's:**
  - `/property-history` returned 502.
  - The Moore order-path self-check was "not measured" (an anon-key mismatch).

  Neither touches a file these PRs changed.
- **Every Money file on `main`** (`lib/`, `components/money/`, `BooksUpload.jsx`, `BooksTransactions.jsx`) is byte-identical to the reviewed heads.

## 2. Decisions in force (Christina, 2026-11-17)

1. Separate **Tithes / Church Giving** category: Phase 1.4. Until then the $837 church tithe is Personal → Charitable (done by hand in Transactions).
2. **Remember category corrections** made on the import card: Phase 1.4.
3. **Christiana's accounts** stay out of scope. Entities: Personal, Poe Properties, TLC Therapy Solutions.
4. Phase 1.4 **waits for** authorized database access (the NAS applies merged migrations itself, no key: DR-1269, corrected in DR-1525), a **confirmed backup**, and a **tested migration**.
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

### Preconditions (corrected 2026-11-18, DR-1525)
The first version of this list routed two conditions through the runner's
`TS_AUTHKEY` and a ConnectBot paste. The record already said otherwise, and
the correction is DR-1525:
1. **Applying a migration needs no key.** The NAS applies merged migrations on
   its own clock (`replay-on-clock.sh`, DR-1269), and the proof is read over
   poetech.us (DR-1398). Merging into `migrations-auto/` IS applying, so the
   approval gate is the merge.
2. **A confirmed backup is read from the house.** The `db-backup-receipt` rider
   publishes `db_backup.sh`'s own verdict; `money_readiness_receipt()`
   (migration 0334) returns it, with the schema facts, to the app
   (`lib/money-readiness.js`) and to the keyless `money-readiness.yml` witness.
   Ready = a verified dump within 36 h and a passing restore drill within 8 d.
3. **The census is the same receipt:** which Phase 1.4 columns exist, whether
   a CHECK limits categories, whether the obligations tables are live. No row
   of any financial table is read.
4. **A tested migration:** `scripts/money-migration-replay.sh` (#2725).
Christina's approval stays the gate for every migration merge.

### Next implementation steps (in order)
1. Read `money-readiness.yml` (or the app): backup verified and drilled, schema as expected.
2. Migration file (additive columns + tithes category) and its replay test; NO apply to production until approved.
3. Engine: outstanding/pending/cleared balance math; pending→posted match; economic entity; receivable link. Tests first, including the $2,201 / $2,200.88 / $0.12 case.
4. Sync: carry the new fields.
5. UI: outstanding checks on Coming Up and the account trail; reimbursement pairing; tithes category; rule-only correction learning.
6. PR on `hold`; merge and apply the migration only with explicit approval, after the backup is confirmed.

## 4. Known items outside Phase 1.4
- `preview-isolation-probe.yml` (Darrell's) probes a hard-coded preview address and Vercel previews sit behind Deployment Protection, so it cannot pass on `money/*` branches; left for Darrell.
- `scripts/money-live-probe.mjs` expects 9 Coming Up figures; the panel shows more since earlier PRs; stale before this work.
- Phases 2–5 (connected records, debt status, safe-to-spend/savings, assistant) follow the approved plan.
