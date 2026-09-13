# DR-0374 — The family rent roll syncs before the ledger verify, and an unlinked edit self-heals

**Date:** 2026-09-13 · **Status:** accepted · **Tier:** B · **Area:** system · **Principles:** REALITY-TRACE, VERIFICATION-DOCTRINE, APP-IS-PRIMARY, PERPETUAL-IMPROVEMENT, DECISION-RECORDS

## Directive

Darrell, 2026-09-13, from Christina's device (Real Estate → Properties, build E18E1B8):

> *"Christina has updated information about tenants and I don't see the updates... obviously this system is to sync or family!!!!! fix it!"*

Approved the fix approach the same turn:

> *"yes, loosen the gate and have her re-sync"*

## Context (measured, not assumed)

The cloud `rentals` table (instance `bd975d65…`) was **frozen since 2026-08-07** — 1508 Williamsburg still `$0` and still named "1508 HH", while Christina's screen showed `$1,150`, `$1,000` on 709 Commercial, and the rename to "1508 Holly Hill". **Not one** of her edits had reached the cloud; they were trapped in her browser's local storage. Verified row-by-row against the live DB, not inferred.

Root cause, traced end-to-end in `poe-financial-mvp-v28.jsx`:

1. **The whole rentals sync sits behind `data.numericSyncVerifiedAt`.** That flag is set only after the "Verify Balances" wizard runs. A member with real numeric data who never completed it gets the wizard, and the sync effect **returns before any rentals sync runs** (`:2085`), while the per-CRUD upload guards (`:3085/3098/3117`) also require the flag. So nothing syncs, in either direction.
2. **`updateRental` additionally required a pre-existing `remoteUuid`** and **silently skipped** otherwise — an edit to a door whose local row never linked to the cloud vanished with no error (a DR-0076 §8 silent failure).

The verify wizard protects the **financial ledger** (accounts / debts / transactions / balances) — it should never have gated the **property list**.

## Decisions

1. **Rentals sync is decoupled from `numericSyncVerifiedAt`.** The three rental CRUD paths (`addRental` / `updateRental` / `deleteRental`) now gate on `authSession && !isAnyDemoMode && !reviewerMode` — a signed-in family member's property/tenant/rent edits reach the shared cloud even before they walk the balance-verify wizard. The ledger tables keep the verify gate unchanged; `reviewerMode` is added to the rentals guard so the reviewer lens (DR-0241) still never writes real cloud rows.
2. **An unlinked edit self-heals instead of vanishing.** `syncRentalEdit` (in `lib/rental-write.js`, not the budget-frozen monolith, per DR-0078) routes a linked row to `updateRow` (patch only) and an **unlinked** row to a new `upsert` — resolve the cloud row by the live `(instance_id, slug)` UNIQUE index and UPDATE it, or INSERT when none exists. Resolve-then-write on purpose: that index is **partial** (`WHERE slug IS NOT NULL`), which a PostgREST `ON CONFLICT` arbiter cannot target.
3. **Recovery is by re-sync, not by hand.** No real rent figures are written to production by the agent (DR-0076 §9). Once this ships, Christina re-opens the app signed in and re-saves each updated door; the loosened gate + self-heal upsert land the edits, and Darrell's (verified, subscribed) device sees them.

## Consequences

- Proven-to-catch: `table-sync-upsert.test.js` (the existing row UPDATEs, never a blind duplicate INSERT; a resolve error is honest, never a fall-through insert) and `rental-write-selfheal.test.js` (linked → updateRow, unlinked → upsert + `onLink` stamps the id). Full suite green at 950 files / 14,171 tests; lint clean; the monolith freeze held (the logic moved to the module, so the file is net leaner).
- **Residual, scoped (DR-0075):** this closes the UPLOAD direction (the stated problem). A member who never verified still will not PULL others' edits until the download-side subscribe is likewise decoupled — a larger change, because the pull-merge overlays cloud values onto local and must not clobber an un-pushed local edit. Tracked as the follow-up; **re-review 2026-09-27**. Also unaddressed here: a diverged DELETE of an unlinked row (lower risk; Christina's issue is edits, not deletes).
- **Not yet verified on the live build (DR-0104):** the fix is proven by test and by the live DB read; the last proof is Christina re-saving on the shipped build and Darrell seeing it. That pass belongs on poetech.us — the sandbox has no route to it (P31).

## Links

`app/src/lib/table-sync.js` (`upsert`, `conflictKey`), `app/src/lib/rentals-sync.js` (`conflictKey: 'instance_id,slug'`), `app/src/lib/rental-write.js` (`syncRentalEdit`), `app/src/poe-financial-mvp-v28.jsx` (the three loosened guards), [DR-0076] (verification / honest-failure), [DR-0078] (route interdependence through a module), [DR-0241] (reviewer lens writes nothing), [DR-0075] (the residual carries a re-review date).
