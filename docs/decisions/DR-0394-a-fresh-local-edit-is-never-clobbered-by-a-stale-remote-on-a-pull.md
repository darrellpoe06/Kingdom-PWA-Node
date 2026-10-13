# DR-0394 — A fresh local edit is never clobbered by a stale remote on a pull

**Date:** 2026-09-14 · **Status:** accepted · **Tier:** B · **Area:** system · **Principles:** VERIFICATION-DOCTRINE, REALITY-TRACE, APP-IS-PRIMARY, PERPETUAL-IMPROVEMENT, DECISION-RECORDS

## Directive

Christina, relayed by Darrell 2026-09-14:

> *"all my saves are gone. The names, all my notes, the price of their rent, fix ups etc."*

And Darrell, on order of operations:

> *"After fixing what needs to be done"*

## Context (measured)

The rent/tenant/notes/fix-ups she entered lived on her device (the Real Estate tab, IndexedDB key `poe-financial-v28`) and never reached the cloud — the upload bug DR-0379 fixed. This record is the OTHER half, the one that destroys data rather than just failing to save it.

`mergeRemoteRentals` (the download side) overlaid **every** synced field with the remote value unconditionally, and discarded the local `updatedAt`:

```
for (const f of SYNCED_FIELDS) next[f] = remote[f];   // the bug
```

So when a device pulled, a **stale cloud row** (her cloud was frozen since 2026-08-07: rent 0, no notes) **overwrote her fresher local edits** ($1,150, tenant names, notes). The save effect then persisted that blanked state over her good copy on-device. The existing merge already had a blank-never-erases discipline for `FILL_FIELDS` and `STRUCTURE_FIELDS`; the money/name/notes fields — the ones that matter most — did not have it.

## Decisions

1. **The overlay is recency-aware.** A local edit stamps `updatedAt = now` (`updateRental`/`addRental` in the monolith). `mergeRemoteRentals` compares it to the remote row's `updated_at`: a **fresher local edit wins** — its synced fields and mortgage object are kept, not overwritten by an older remote row.
2. **A blank remote never erases a real local value**, even at equal/unknown age — the same discipline the location and structure fields already had, now extended to `SYNCED_FIELDS` (name, rent, actual, tenant, notes, status, …), with numeric `0` treated as blank so a stale rent of 0 cannot wipe a real one.
3. **A genuinely newer remote still overlays** — normal cross-device sync (including a deliberate clear or a real update from another device) is intact; only a STALE or BLANK remote is refused.

## Consequences

- Proven-to-catch: `rentals-sync.merge.test.js` gains the DR-0394 block — a newer local edit keeps its rent + notes against an older blank remote, and a blank remote never erases a real local value; both were **verified to FAIL** when the guard is reverted to the unconditional overlay, and the "genuinely newer remote still overlays" case guards against over-correcting. Full suite green 973 files / 14,615 tests; lint clean; monolith freeze held.
- This closes the download-side risk DR-0379 deferred (its re-review 2026-09-27 is satisfied early). Restoring Christina's data (from her device storage, if any copy survives) is now safe — the restored values will not be re-clobbered.
- **Not recovered by this change:** her already-lost edits. Recovery depends on a surviving copy in a browser/device she has not re-opened (IndexedDB `poetech-storage` → `kv` → `poe-financial-v28`); the device-local notes/fix-ups were never anywhere else. Stated plainly (DR-0100): if every copy was overwritten with blanks before this shipped, those are gone, and only the rents/names visible in the 2026-09-12 screenshot are reconstructable.
- **Not yet verified on the live build (DR-0104):** proven by test; the last proof is a real pull on the shipped build not clobbering a fresh edit — that pass is on poetech.us, which the sandbox cannot reach (P31).

## Links

`app/src/lib/rentals-sync.js` (`mergeRemoteRentals`, `isBlankValue`, `cmpUpdatedAt`), `app/src/poe-financial-mvp-v28.jsx` (`updateRental`/`addRental` stamp `updatedAt`), `app/src/__tests__/rentals-sync.merge.test.js` (proven-to-catch), [DR-0379] (the upload half, whose deferred download risk this closes), [DR-0076] (verification / no silent data loss), [DR-0100] (state the loss plainly).
