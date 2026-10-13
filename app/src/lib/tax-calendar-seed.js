// =============================================================================
// tax-calendar-seed — the preloaded IRS/IL tax deadlines the app ships with
// =============================================================================
// Extracted from the monolith shell (freeze: bug-fixes only) so the seed can grow
// without touching the frozen file. Review finding (2026-07-18, ANXIETY-CLARITY):
// a busy/scared parent relies on the preloaded calendar, but it was missing 3 of
// the 4 quarterly estimated-tax dates. All four are added here. Dates are month/
// day only (no year) so they read as evergreen annual deadlines.
//
// Evergreen federal/IL deadlines. Confirm specifics with a CPA (the app tracks,
// it does not file — worker-classification.js advisories, DR-0100).
export const TAX_CALENDAR_SEED = [
  { id: 'tx-est-q4-prior', month: 1, day: 15, name: 'Estimated tax — Q4 (prior year)', desc: 'Federal + IL 4th-quarter estimated payment for last year (Form 1040-ES)', entityIds: ['e-personal'], applies: true },
  { id: 'tx-1099-nec', month: 1, day: 31, name: '1099-NEC issuance', desc: "Issue a 1099-NEC to each contractor paid at/above the year's threshold ($600 for 2024-2025, $2,000 for 2026+)", entityIds: ['e-tlc'], applies: true },
  { id: 'tx-1096-paper', month: 2, day: 28, name: '1096 paper transmittal', desc: 'IRS Form 1096 for paper 1099s', entityIds: ['e-tlc'], applies: true },
  { id: 'tx-1040', month: 4, day: 15, name: 'Form 1040 due', desc: 'Joint return with Schedule C × 2, Schedule E', entityIds: ['e-personal'], applies: true },
  { id: 'tx-est-q1', month: 4, day: 15, name: 'Estimated tax — Q1', desc: 'Federal + IL 1st-quarter estimated payment (Form 1040-ES)', entityIds: ['e-personal'], applies: true },
  { id: 'tx-il-llc', month: 4, day: 30, name: 'IL LLC annual reports', desc: 'Illinois Secretary of State — $75/yr × 3 LLCs', entityIds: ['e-poeprops', 'e-poetech', 'e-tlc'], applies: true, amount: 225 },
  { id: 'tx-est-q2', month: 6, day: 15, name: 'Estimated tax — Q2', desc: 'Federal + IL 2nd-quarter estimated payment (Form 1040-ES)', entityIds: ['e-personal'], applies: true },
  { id: 'tx-est-q3', month: 9, day: 15, name: 'Estimated tax — Q3', desc: 'Federal + IL 3rd-quarter estimated payment (Form 1040-ES)', entityIds: ['e-personal'], applies: true },
  { id: 'tx-yearend', month: 12, day: 31, name: 'Year-end tax planning', desc: 'Charitable timing, Section 179, HSA, retirement max', entityIds: ['e-personal', 'e-tlc', 'e-poetech'], applies: true },
];
