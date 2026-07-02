// =============================================================================
// derive-concerns — the app's PROCESSES surface their own concerns, deterministically
// =============================================================================
// Darrell, 2026-07-01: "The ISSUES/CONCERNS tab should be NATURALLY POPULATED by
// the processes inside the app — auto-fed from real activity, never hand-entered."
//
// This is the machine half of that. Every function here reads REAL app data
// (the ledger, the rental portfolio, the debts) through a PROVEN, pure detector
// and emits a read-through concern card the moment a process finds something
// wrong — with its source, the surface it belongs to, and an honest status. No
// human types it; no painted data. A card DISAPPEARS on its own the moment the
// underlying data is fixed (the detector stops finding it), exactly like the
// feedback + audit read-through feeds already do (lib/concerns.js). That auto-
// resolve is what makes the board a live view of real state, not a static list.
//
// Each detector is the reflex a human would have applied by eye, encoded so the
// system never waits on a human to notice (DR-0086 / P15 reality-trace, DR-0076
// verification doctrine — proven-to-catch in derive-concerns.test.js):
//   • coverageConcerns   — the "April showed 2 of 296" silently-dropped-rows class
//   • doorCollapseConcerns — the 805 N Prospect four-plex-collapsed-to-one-door class
//   • shapeMismatchConcerns — a mortgage-scale balance mislabeled as a Vehicle loan
//
// PURE + DETERMINISTIC + OFFLINE + $0 (no LLM, no network). Card shape matches the
// read-through cards composeConcerns() already renders (source + readOnly), so a
// derived concern flows onto the existing ConcernsBoard with zero board changes.
// =============================================================================

import { monthCoverage } from './transaction-analysis.js';
import { groupDoorsByBuilding } from './building-group.js';
import { unitsOf, isPersonalProp } from './rental-portfolio.js';
import { hasReceiptItems, receiptVerification, categorySplit } from './receipt-itemize.js';

// Today, YYYY-MM-DD — the day the process flagged it (app runtime; Date is fine).
function today() {
  try { return new Date().toISOString().slice(0, 10); } catch (e) { return null; }
}

// ---------------------------------------------------------------------------
// coverageConcerns — DATA-COMPLETENESS reflex over the ledger. monthCoverage()
// (transaction-analysis.js, already unit-proven) fills every month in the span
// and flags any whose transaction count is anomalously low vs the median month.
// A thin month is the fingerprint of a silently-truncated import (the real
// "April showed 2 of 296" incident). One aggregate card names the thin months
// so a governor sees the gap without eyeballing twelve months by hand.
// ---------------------------------------------------------------------------
export function coverageConcerns(transactions = []) {
  const cov = monthCoverage(transactions);
  const thin = Array.isArray(cov.thin) ? cov.thin : [];
  if (thin.length === 0) return [];
  const countOf = (m) => {
    const row = (cov.months || []).find((x) => x.month === m);
    return row ? row.count : 0;
  };
  const detail = thin.map((m) => `${m} has ${countOf(m)}`).join('; ');
  const label = thin.length === 1 ? thin[0] : `${thin.length} months`;
  return [{
    id: `derived-coverage-${thin.join('_')}`,
    concern: `Banking import looks incomplete for ${label}: ${detail} transaction(s) vs a typical ${cov.median}/month. Rows may have been silently dropped — the "April showed 2 of 296" class of gap.`,
    solution: `Re-run the bank import for ${thin.join(', ')} and reconcile the row count against the statement; verify the sync page-cap isn't truncating a month.`,
    status: 'open',
    area: 'Banking import',
    whenNote: 'auto-detected · data-completeness check (monthCoverage)',
    source: 'coverage',
    readOnly: true,
    detectedBy: 'monthCoverage',
    created: today(),
  }];
}

// ---------------------------------------------------------------------------
// doorCollapseConcerns — DOOR-COUNT INTEGRITY reflex over the rental portfolio.
// A multi-unit building has two shapes (building-group.js): N separate unit-doors
// (each with its own tenant / maintenance / notes / photos) OR one record carrying
// units:N. The second shape LOSES every unit's own records — the reported 805 N
// Prospect regression. groupDoorsByBuilding() groups the real records; a `single`
// entry whose one record still carries units>=2 is a building collapsed into one
// door. Personal rows are excluded (isPersonalProp) — they never render as doors.
// ---------------------------------------------------------------------------
export function doorCollapseConcerns(rentals = []) {
  const portfolio = (rentals || []).filter((r) => r && !isPersonalProp(r));
  const entries = groupDoorsByBuilding(portfolio);
  const collapsed = entries.filter((e) => e && e.type === 'single' && e.rental && unitsOf(e.rental) >= 2);
  return collapsed.map((e) => {
    const r = e.rental;
    const n = unitsOf(r);
    const name = r.address || r.name || 'A multi-unit property';
    return {
      id: `derived-doorcollapse-${r.id || name}`,
      concern: `${name} is stored as ONE door carrying units:${n}, not ${n} separate unit-doors — the other ${n - 1} unit${n - 1 === 1 ? '' : 's'} have no records of their own (tenant, maintenance, notes, photos). This is the 805 N Prospect collapse shape.`,
      solution: `Restore each unit as its own door under the "${name}" building (Real Estate → the door's "restore units" control), so every unit keeps its own everything and the door count reads ${n}, not 1.`,
      status: 'open',
      area: 'Real Estate',
      whenNote: 'auto-detected · door-count integrity (groupDoorsByBuilding)',
      source: 'reconciliation',
      readOnly: true,
      detectedBy: 'groupDoorsByBuilding',
      created: today(),
    };
  });
}

// ---------------------------------------------------------------------------
// shapeMismatchConcerns — CATEGORY/SHAPE reflex over the debts. A balance the
// size of a real-estate mortgage that is labeled a vehicle/auto loan (or a debt
// whose name says "mortgage" but whose category says vehicle) is a mis-shaped
// record — the "mortgage-as-Vehicle" class. Conservative: it fires only when a
// vehicle signal AND a mortgage-scale balance (or the literal word "mortgage")
// co-occur, so an ordinary car loan never trips it.
// ---------------------------------------------------------------------------
const VEHICLE_RE = /\b(vehicle|auto|car|truck|van|motor)\b/i;
const MORTGAGE_RE = /\bmortgage\b/i;
export const MORTGAGE_SCALE = 60000; // a balance at/over this reads as real-estate, not a car

export function shapeMismatchConcerns({ debts = [] } = {}) {
  const out = [];
  for (const d of debts || []) {
    if (!d) continue;
    const label = `${d.name || ''} ${d.type || ''} ${d.category || ''}`;
    const looksVehicle = VEHICLE_RE.test(label);
    const bal = Math.abs(Number(d.balance) || 0);
    const mortgageScale = bal >= MORTGAGE_SCALE || MORTGAGE_RE.test(label);
    if (looksVehicle && mortgageScale) {
      out.push({
        id: `derived-shape-${d.id || (d.name || 'debt')}`,
        concern: `"${d.name || 'A debt'}" is labeled a vehicle/auto loan but carries a ${bal >= MORTGAGE_SCALE ? `$${bal.toLocaleString()} (mortgage-scale)` : 'mortgage-named'} balance — the "mortgage-as-Vehicle" mislabel. It will roll up under the wrong category and distort the debt picture.`,
        solution: `Re-classify "${d.name || 'this debt'}" to its true type (mortgage vs vehicle) so the snowball and the forecast count it correctly. Characterize the record before editing.`,
        status: 'open',
        area: 'Debts',
        whenNote: 'auto-detected · debt category/shape check',
        source: 'reconciliation',
        readOnly: true,
        detectedBy: 'shapeMismatch',
        created: today(),
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// receiptConcerns — RECEIPT-vs-BANK cross-check reflex over the ledger. When a
// transaction is enriched with an emailed vendor receipt (Walmart/Walgreens/…),
// the itemized detail is a SECOND source that must agree with the bank amount
// (DR-0076: the cross-reference IS the verification). This flags the two ways
// that agreement can break so a governor sees it without opening every charge:
//   • a receipt whose items do NOT reconcile to the bank debit (amount off /
//     tampered / incomplete parse) — receiptVerification() fails.
//   • a receipt where too many dollars could not be categorized from item names
//     (category uncertain) — the split's `uncertain` flag.
// Auto-resolves the moment the underlying reconciliation is fixed (detector stops
// finding it), like every other read-through concern. Pure + offline + $0.
// ---------------------------------------------------------------------------
export function receiptConcerns(transactions = []) {
  const out = [];
  for (const t of transactions || []) {
    if (!t || !t.reconciliation || !hasReceiptItems(t.reconciliation)) continue;
    const merchant = t.reconciliation.merchant || t.description || 'A charge';
    const v = receiptVerification(t.reconciliation, t.amount);
    if (!v.verified) {
      out.push({
        id: `derived-receipt-mismatch-${t.id}`,
        concern: `${merchant} (${t.date || 'undated'}) has a matched receipt whose itemized detail does NOT reconcile to the bank amount: ${v.reason}. The bank stays the source of truth for the amount — the receipt parse or the match is off.`,
        solution: `Open this charge in Books → Transactions and check the receipt items against the statement. Re-run the receipt parse for ${merchant}, or unlink the wrong receipt. Amount is trusted from the bank; only the itemization is in question.`,
        status: 'open',
        area: 'Banking import',
        whenNote: 'auto-detected · receipt cross-check (receiptVerification)',
        source: 'reconciliation',
        readOnly: true,
        detectedBy: 'receiptVerification',
        created: today(),
      });
      continue; // one card per charge; a mismatch is the more urgent signal
    }
    const split = categorySplit(t.reconciliation);
    if (split.uncertain) {
      const pct = Math.round(split.uncertainShare * 100);
      out.push({
        id: `derived-receipt-uncat-${t.id}`,
        concern: `${merchant} (${t.date || 'undated'}) reconciles to the bank, but ${pct}% of its receipt dollars could not be categorized from the item names — the category split is uncertain.`,
        solution: `Review the uncategorized items on this charge and set their category so the groceries/household/medical split is precise. This teaches future ${merchant} receipts.`,
        status: 'open',
        area: 'Banking import',
        whenNote: 'auto-detected · receipt category-completeness',
        source: 'reconciliation',
        readOnly: true,
        detectedBy: 'categorySplit',
        created: today(),
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// deriveDataConcerns — run every process detector over the live app data and
// return the flat list of read-through concern cards. Defensive: any detector
// throwing (bad row shape) is isolated so one bad record never blanks the board.
// ---------------------------------------------------------------------------
export function deriveDataConcerns({ transactions = [], rentals = [], debts = [] } = {}) {
  const safe = (fn) => { try { return fn() || []; } catch (e) { console.warn('[derive-concerns] detector failed', e); return []; } };
  return [
    ...safe(() => coverageConcerns(transactions)),
    ...safe(() => receiptConcerns(transactions)),
    ...safe(() => doorCollapseConcerns(rentals)),
    ...safe(() => shapeMismatchConcerns({ debts })),
  ];
}
