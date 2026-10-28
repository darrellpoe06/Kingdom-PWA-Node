# DR-1277 — A blank cloud value never erases a typed rent or mortgage ("it keeps updating to zero")

**Status:** accepted (built, proven to catch, held for Governor review — Tier B/C)
**Tier:** B/C (the family's real financial records; real-money data integrity)
**Date:** 2026-10-28
**Entities:** `app/src/lib/rentals-sync.js` (`mergeRemoteRentals`, new `MONEY_SYNCED_FIELDS`, the per-field mortgage overlay); `app/src/__tests__/rentals-sync.merge.test.js` (two new proven-to-catch cases)
**Grounds:** DR-0394 (the recency-aware overlay this extends), DR-0076 §3/§8 (verification; unknown never rendered or treated as a confident value), DR-0100 (speak established fact — real data loss stated plainly), DR-0075 (perpetual improvement), DR-0103 (ride the lane; `hold` is the Governor's hand)

## Context

Darrell, on his phone, 2026-10-28: the Real Estate door "keeps updating to zero instead of holding the necessary details." A screenshot earlier in the same session had shown all 11 doors carrying rent ($11,900/mo total); a later one showed the portfolio reverted to "1 of 11 · $1,000" and "10 doors with no rent entered." Typed financial figures were being wiped.

## What was measured (real data, not inference — DR-0076 §4)

A direct read of the production `rentals` table (project `PoeTech-Family-OS`, the landlord instance) on 2026-10-28: **every door carried `monthly_rent 0.00`, `mortgage_balance 0.00`, `mortgage_payment 0.00` except one** (1003 Koehn Dr: rent 680.00, P&I 225.76). Several rows had `updated_at = null`.

So two things are true at once:

1. **The cloud holds almost no financial figures.** The typed rents/mortgages are not reaching durable storage for most doors (a write/durability problem — gated on being signed in, or failing silently — tracked separately; not this DR).
2. **The merge was letting those cloud zeros win.** `mergeRemoteRentals` (DR-0394) already refused to let a *blank* remote erase a real local value — but only at **equal/unknown age** (`cmp === 0`). When a cloud row was **newer** than the device edit (a fresh insert, a structure-only write from the Properties tab, or an instance quirk — all of which stamp a recent `updated_at` while carrying `monthly_rent 0`), the overlay applied the zero and wiped the typed value. In this app `0` is "not entered", never a deliberate $0 — every "X of N entered" / `missing*` rollup keys off `> 0` — so a blank money value is never information worth propagating.

## Impact

Stops silent loss of the family's real financial figures: a cloud zero can no longer overwrite a rent or mortgage a steward actually typed, so the Real Estate portfolio stops reverting to blanks on a sync/refresh. This is the "reverts on this device" half only — the deeper durability gap (typed figures not reaching the cloud for most doors, measured above) is named in Verification and tracked separately, **not** closed here. One accepted constraint: a deliberate $0 cannot propagate cross-device (see the tradeoff below), which is in-model because vacancy is carried by `status`, not a `0` rent.

## Decision

For money fields — `rent`, `actual`, and every mortgage sub-field (`balance`, `rate`, `monthlyPI`, `escrow`) — **a blank (0 / empty) remote value never erases a real local value, at any recency.** Non-money fields keep the recency rule unchanged (a genuinely newer remote blank — e.g. a tenant name cleared on another device — is still a real clear). A newer remote carrying a *real* money value still propagates normally. The local `estimated` flag on the mortgage is still preserved.

This extends DR-0394's own principle ("a false drop costs the record itself") to the newer-remote case for the one class of field where a blank can only ever mean "unknown".

## Tradeoff (stated, per DR-0076 §8)

Because `0` is indistinguishable from "cleared to zero", this app cannot propagate a *deliberate* $0 rent across devices. That is acceptable and in-model: vacancy/no-rent is carried by `status` (`vacant`/`unrented`), not by a `0` rent, and the UI already reads `0` as "not entered". The cost of the alternative — silently wiping a landlord's typed figures — is unrecoverable.

## Verification

- `rentals-sync.merge.test.js` gains two proven-to-catch cases: a **newer** remote with blank money leaves the typed rent/mortgage intact (fails against the pre-fix code, which overlaid the zero), and a newer remote with a **real** money value still updates (no regression to normal cross-device sync). All 22 merge/partial-read cases still pass; the full rental/door/portfolio sweep is 1094 green; lint clean.
- Scope line: this DR closes the "reverts to zero on refresh" symptom. The separate durability gap (why the typed figures are not reaching the cloud in the first place — signed-in gate + silent write-failure visibility) is its own follow-up and is not claimed fixed here.

## Process

Tier B/C real-money change: shipped through the lane (DR-0103) with the `hold` label applied so it awaits Governor review rather than auto-merging to the family's live financial data. Merge = deploy (DR-0054); prove the served build after merge (DR-0107).
