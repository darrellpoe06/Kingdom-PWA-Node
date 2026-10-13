# DR-0233 — Time Stewardship module: leave, hours, approvals, balances with receipts

- **Date:** 2026-07-24
- **Declared by:** Darrell (voice directive + three screenshots of the
  University of Illinois Student Affairs leave system: Submit Days, Absence
  Graph, accrual balances)
- **Status:** decided; domain core shipped, surfaces increment dated

## Decision

The platform gains a **Time Stewardship** module family: leave/PTO by type
(vacation, sick, personal, floating, **serve/ministry**, other), part-day
increments, an approval flow with receipts, computed accrual balances
(forward + accrued − used), and a team absence graph — for the family, COLG
staff/volunteers, and future client organizations across the family of apps.

## What shipped with this record

- `app/src/lib/time-stewardship.js` — pure, dependency-free domain core.
- `app/src/__tests__/time-stewardship.test.js` — 13 tests, including the
  founder-protection rule proven in the math.
- `docs/99-session-notes/2026-07-24-time-stewardship-gaps-analysis.md` —
  Ari's gaps analysis, methods, metrics, strategy, client network effects.

## Binding rules

1. **Separation of duties in the math:** no self-approval and no
   self-cancel of approved entries — including the founder. `decideTransition`
   refuses; a UI cannot ship around it.
2. **Append-only receipts:** every state change adds a receipt; balances are
   computed from entries + policy, never stored as editable numbers.
3. **The graph states facts (DR-0100):** approved entries only.
4. **Color theology (DR-0099):** no leave type paints true red.
5. **No compliance theater:** the module records time; it does not claim
   FMLA/legal compliance for any employer.
6. **Surfaces are Tier B**, ride existing tenancy/RLS rails, and land
   in-app (DR-0065). Accrual policy changes are owner-gated on the real role
   system (the DR-0232 owner-control posture).

## Re-review

Surfaces increment (Submit Days card, Approvals queue, Absence Graph,
balances block, `time_entries`/`time_policies` on table-sync): **2026-08-07**.
