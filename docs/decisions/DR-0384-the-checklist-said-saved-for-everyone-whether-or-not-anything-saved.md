# DR-0384 — The checklist said "saved for everyone" whether or not anything saved

- **Date:** 2026-09-13 (shipped in #1559; record written 2026-09-13 on Darrell's instruction to reconstruct)
- **Status:** accepted
- **Tier:** B (landlord-facing data, real property records)
- **Type:** orchestration

## The occasion

Three defects found in our own review of the previous day's tab — and then, wrongly, **parked on a question instead of fixed**. The parking was itself the process defect (DR-0111); all three were fixed in the same session with tests.

## The decisions

1. **THE SURFACE LIED ABOUT THE ONE THING IT IS FOR.** Under the dashboard sat *"Saved to this door for everyone who manages it — the same list on your phone and at your desk."* **Unconditional.** Signed out, RLS-refused, or with the write failing outright, that sentence still said *saved*. `table-sync` had always returned an honest result for every write — `{skipped:'signed-out'}`, `{skipped:'insert-error'}`, and a `deleteRow` that DETECTS an RLS-blocked zero-row delete — and `use-board-tasks` threw every one of them into `console.warn`. The store now keeps the last real outcome and publishes it (`subscribeWrites` / `useWriteState`); the line reports what actually happened and names the cause when it did not. *(This is the SURFACE-SAYS-TRUTH dimension of the comprehensive-review standard, failing in production.)*
2. **RENAMING A BEDROOM SPLIT IT IN TWO.** The merge took the stored row's `group_label` when a row existed and the template's otherwise, so a room renamed on the Rooms tab kept its old name on every task already touched and the new name on the rest — one bedroom, two groups. `property_rooms` is the record for what a room is called, so the group now always comes from the template. A task the landlord ADDED keeps the group it was added to.
3. **A DELETE THE DATABASE REFUSED LOOKED LIKE IT WORKED.** 0059's DELETE policy is owner/admin, so a `member` cannot delete; the row vanished locally and came back on the next cloud merge. `removeTask` now restores the row when `deleteRow` reports the zero-row case and says it was refused — the same resurrect bug the books hit on 2026-07-19, which is why `deleteRow` reports it at all.
4. **Nothing could ask the live database which TABLES it has.** The sovereign reader gained a `tables` argument, validated rather than escaped — the same seam and the same discipline as the `functions` argument (DR-0375).

## Proof

Proven-to-catch, each against the real code: make the save line unconditional again and **4** render tests fail; restore the row's `group_label` in the merge and the rename test fails; drop the restore in `removeTask` and the refused-delete test fails. `npm run verify`: 942 files, 13,985 tests, exit 0 — 14 new.

## Why this record is late

#1559 shipped with no decision record. Reconstructed from the commit's own detailed message and the diff. See DR-0381 and the ledger-drift note in `INDEX.md`.
