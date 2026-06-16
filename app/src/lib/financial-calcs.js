// =============================================================================
// financial-calcs.js — pure-function exports for the financial OS audit
// =============================================================================
// Per docs/05-financial-os/CALC-INVENTORY.md, the calc engines in the MVP
// (projectDebt, projectDebtSnowball, projectDebtMinimumOnly,
// projectRentalSnowball, findExtraForTarget, frequencyToMonthly) are pure
// top-level functions and are re-exported from here so test files can
// import them without dragging in React. This file also hosts new pure
// helpers extracted from inline useMemo blocks during the audit so they
// become testable.
//
// Pass 2 of the audit (Vitest unit tests) lives in src/__tests__/.
// =============================================================================

// Re-export the calc functions from the MVP file. These are added as named
// exports there during the same audit. Importing through this lib file gives
// callers a stable surface even if internals move later.
export {
  projectDebt,
  projectDebtSnowball,
  projectDebtMinimumOnly,
  projectRentalSnowball,
  findExtraForTarget,
  frequencyToMonthly,
  computePressure,
} from '../poe-financial-mvp-v28.jsx';

// -----------------------------------------------------------------------------
// computeReserves — extracted from the inline `reserves` useMemo in the MVP
// during the FLAG-10 fix. Called by the MVP useMemo and tested directly.
//
// Returns { recurringMonthly, taxMonthly, incidentMonthly, totalMonthly }.
//
// FLAG-10 contract: incidents are NOT a perpetual monthly drain. They remain
// in `data.incidents` for record-keeping and Calendar display, but they
// contribute 0 to totalMonthly. If a future incident is genuinely a
// multi-month drain, it should be modeled as a recurring obligation with a
// defined end-date, not as a free-standing incident. A future enhancement
// will add `repayMonths` / `paidDate` to the incident model.
// -----------------------------------------------------------------------------
import { frequencyToMonthly as freqToMonthly } from '../poe-financial-mvp-v28.jsx';

export function computeReserves(data) {
  const recurringMonthly = (data.recurringObligations || [])
    .filter((r) => r.enabled && r.frequency !== 'monthly')
    .reduce((s, r) => s + freqToMonthly(r.amount, r.frequency), 0);
  const taxItemsAnnual = (data.taxCalendar || [])
    .filter((t) => t.applies && t.amount)
    .reduce((s, t) => s + t.amount, 0);
  return {
    recurringMonthly,
    taxMonthly: taxItemsAnnual / 12,
    incidentMonthly: 0, // FLAG-10: never a monthly drain
    totalMonthly: recurringMonthly + taxItemsAnnual / 12,
  };
}
