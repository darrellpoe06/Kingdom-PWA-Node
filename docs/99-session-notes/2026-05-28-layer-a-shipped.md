# Layer A shipped — multi-user profile gate

## What's in this push

**Three profiles** in a launch-blocking picker: Darrell, Christina, Family. Profile is stored in localStorage so the picker only shows on first launch and when you tap "switch profile" in the header.

**Entity visibility** via `visibleTo` array on each entity:
- Personal (joint household): Darrell, Christina, Family
- Poe Properties LLC: Darrell only
- PoeTech LLC: Darrell only
- TLC Therapy Solutions LLC: Darrell + Christina (joint stewardship, no Family)

**What each profile sees:**
- **Darrell** — everything (all four entities, full ledger, Big Picture, Tx, Accounts).
- **Christina** — Personal + TLC. Poe Properties and PoeTech disappear from her view: not in the entity filter pills, not in the entity rollups, not in the Big Picture entity strip, and crucially not in the "All" transactions view (which now filters to her visible accounts only).
- **Family** — Personal only. A child or guest using the app sees the household budget at a roll-up level without per-business breakdown.

**Migration handled** in the storage-load useEffect: any existing saved data gets `visibleTo` backfilled with sensible defaults so the app doesn't break on first load with the new code.

## What's gated (Layer A coverage)

- Entity filter pills on Tx tab
- Tx tab "All" view filters to visible accounts only
- BooksAccounts groupings (uses entityRollups which is filtered)
- BigPictureDashboard entity strip (uses entityRollups)
- Add/Edit account form entity dropdown (uses visibleEntities)
- Header shows current profile + "tap to switch" button

## What's NOT gated yet (open in Layer A.2)

These still pull from full `data.entities` or `data.accounts`. They leak less-critical aggregate values across profiles. Worth a sweep when convenient:

- `totals` object (computed at top level from all accounts) — surfaces in BigPictureDashboard hero metrics. Christina would see total household cash flow, which includes Poe Properties rental income.
- `projection` / `rentalSnowball` — both use full data.
- BookTransactions add/edit form's account dropdown still shows all data.accounts.
- Cart / Calendar / Debts / Real Estate tabs render from full data.
- Inflows + outflows aggregation.

For shipping Christina and Family adoption, Layer A.2 is the natural follow-up: thread `visibleEntityIds` through the totals computation so the hero metrics respect the gate.

## What's NOT in this push (Layer B + C)

- **Layer B — sovereign PIN auth** via workflow 21 + session token. Layer A is UX privacy (anyone with devtools can switch profiles). Layer B makes it real security.
- **Layer C — TLC data segregation** into its own workflow + folder. Today the TLC entity is just a tax/business surface; no clinical data lives in this PWA. If Christina ever wants to track clinical metrics here, Layer C builds the firewall.

Both queued; spec lives in `docs/99-session-notes/2026-05-28-brief-multi-user-profiles.md`.

## Verifying on the phone after deploy

1. Build SHA flips in the header from `65acb2c` to whatever the new commit hash is.
2. Profile picker shows on first launch — pick "Darrell", you see everything.
3. Hit the profile button in the header → pick "Christina" → Tx tab now hides Poe Properties + PoeTech rows. BooksAccounts shows only Personal + TLC accounts.
4. Switch to "Family" → only Personal accounts appear. TLC disappears.
5. Hard-refresh — your saved profile persists, no picker.

## Files touched

- `app/src/poe-financial-mvp-v28.jsx` — currentProfile state, profile picker overlay, header switch button, visibleEntities memo, visibleEntityIds set, entityRollups filter, BookTransactions visible-aware matchesEntity, entity pill row filter, BooksAccounts entities-prop now visibleEntities, migration in storage-load.
- `docs/99-session-notes/2026-05-28-layer-a-shipped.md` — this file.

## Commit batch

```
cd C:\Users\dpoe\Kingdom-PWA-Node
git add app/src/poe-financial-mvp-v28.jsx docs/99-session-notes/2026-05-28-layer-a-shipped.md
git commit -m "Multi-user Layer A: profile picker (Darrell/Christina/Family) gates entity visibility. Personal visible to all profiles; Poe Properties + PoeTech to Darrell only; TLC to Darrell + Christina. Storage-load migration backfills visibleTo on existing saves."
git push
```
