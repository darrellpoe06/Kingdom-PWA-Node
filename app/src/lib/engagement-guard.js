// =============================================================================
// engagement-guard — volunteers and 1099 workers on the SAME projects, told
// apart by DATA, with receipts (Darrell 2026-07-23)
// =============================================================================
// "We have volunteers and 1099 workers working at the same time in the same
// projects — how can we differentiate between the different roles and
// administrative functions effectively and with receipts?"
//
// THE ESTABLISHED LINE (DR-0100, stated plainly): role labels don't decide —
// MONEY FLOWING decides. A volunteer serves without compensation (accountable-
// plan expense reimbursements are fine WITH receipts; anything more becomes
// taxable compensation and can create employment/1099 obligations — for a
// church it can even implicate exemption). A 1099 contractor is paid for
// services and crosses into 1099-NEC filing at the year's threshold
// (worker-classification.js holds the VERIFIED figures by year).
//
// So the guard works the way the Ways demand:
//   · ENGAGEMENT IS PER-ASSIGNMENT, not per-person — the same person can be a
//     volunteer on the choir build and a paid 1099 worker on a rental repair
//     in the same week. assignments.js already carries `type`; unknown maps
//     to 'unassigned', never guessed (DR-0076).
//   · THE RECEIPTS ARE THE REAL LEDGER — findings cite the actual Books rows
//     (contractor-ytd's token-subset payee match) by id and amount. No claim
//     without a row.
//   · Each lane gets its own ADMIN CHECKLIST — the administrative functions
//     that differ are named, not remembered.
// Pure + deterministic: the tax year is passed in, never read from the clock.

import { deriveContractorYtdPaid, isMatchableContractor } from './contractor-ytd.js';
import { NEC_THRESHOLD_BY_YEAR, NEC_THRESHOLD_LATEST_KNOWN } from './worker-classification.js';

export const ENGAGEMENTS = Object.freeze({
  volunteer: {
    label: 'Volunteer',
    moneyRule: 'No compensation. Expense reimbursements only, each with a receipt on file (accountable plan) — anything beyond becomes taxable compensation.',
    admin: [
      'Log served hours per project (insurance, grants, and the honest record).',
      'Reimbursements: receipt attached BEFORE repayment, actual expense only.',
      'No 1099, no W-2 — because no compensation. The guard watches the ledger to keep that true.',
    ],
  },
  'contractor-1099': {
    label: '1099 contractor',
    moneyRule: 'Paid for services against invoices; the year\'s payments derive from the real ledger (never hand-typed).',
    admin: [
      'W-9 on file BEFORE first payment.',
      'Track YTD from the ledger; file 1099-NEC when the year\'s verified threshold is crossed.',
      'They control how the work is done (the classification line) — direct outcomes, not methods.',
    ],
  },
  'household-w2': {
    label: 'Household employee',
    moneyRule: 'Household wages take a W-2 + Schedule H (never a 1099) once the year\'s trigger is crossed.',
    admin: ['See worker-classification.js household triggers — W-2 lane, not this board.'],
  },
  unassigned: {
    label: 'Engagement not set',
    moneyRule: 'Unknown is not a lane. Set volunteer or contractor on the assignment so the guard can watch the money.',
    admin: ['Open the assignment and choose its engagement — per assignment, not per person.'],
  },
});

// Assignment.type -> engagement lane. Explicit only; unknown stays honest.
export function engagementOf(assignment) {
  const t = String(assignment?.engagement || assignment?.type || '').toLowerCase();
  if (t === 'volunteer') return 'volunteer';
  if (t === 'contractor' || t === 'contractor-1099' || t === '1099') return 'contractor-1099';
  if (t === 'household' || t === 'household-w2') return 'household-w2';
  return 'unassigned';
}

// Split one project's crew by engagement — the same-project differentiation.
// assignments: the incident's getAssignments() output.
export function splitCrew(assignments = []) {
  const out = { volunteer: [], 'contractor-1099': [], 'household-w2': [], unassigned: [] };
  for (const a of assignments) out[engagementOf(a)].push(a);
  return out;
}

// The guard's findings, each carrying LEDGER RECEIPTS (row ids + amounts):
//  · paid-volunteer — money went to someone engaged as a volunteer (the
//    misclassification the same-project mixing makes easy). Severity: review.
//  · nec-threshold — a contractor's derived YTD crossed the year's verified
//    1099-NEC line: the filing admin function is now DUE.
// people: [{ name, engagement }] — typically derived from assignments across
// projects; transactions: the real Books rows; year: the tax year (passed in).
export function engagementFindings({ people = [], transactions = [], year }) {
  const findings = [];
  const threshold = NEC_THRESHOLD_BY_YEAR[year] ?? NEC_THRESHOLD_LATEST_KNOWN.amount;
  const thresholdApprox = !(year in NEC_THRESHOLD_BY_YEAR);
  for (const p of people) {
    if (!p || !isMatchableContractor(p)) continue; // honest-or-absent matching
    const paid = deriveContractorYtdPaid(p, transactions, year);
    if (!paid || paid.count === 0) continue;
    if (engagementOf(p) === 'volunteer') {
      findings.push({
        kind: 'paid-volunteer', name: p.name, year,
        amount: paid.ytdPaid, receipts: paid.matchedIds,
        note: `${p.name} is engaged as a VOLUNTEER but the ${year} ledger shows $${Math.round(paid.ytdPaid).toLocaleString()} paid across ${paid.count} transaction(s). Reimbursement-with-receipt is fine; compensation is not — reclassify the engagement or document the accountable-plan receipts.`,
      });
    } else if (engagementOf(p) === 'contractor-1099' && paid.ytdPaid >= threshold) {
      findings.push({
        kind: 'nec-threshold', name: p.name, year,
        amount: paid.ytdPaid, receipts: paid.matchedIds,
        note: `${p.name} crossed the ${year} 1099-NEC line ($${threshold.toLocaleString()}${thresholdApprox ? ', last verified figure' : ''}): $${Math.round(paid.ytdPaid).toLocaleString()} paid. W-9 on file + 1099-NEC at year end.`,
      });
    }
  }
  return findings;
}
