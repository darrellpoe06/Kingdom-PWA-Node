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
import { CAPTIONS_COVERAGE_CONCERN_PCT } from './captions-coverage.js';

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
// captionCoverageConcerns — ACCESSIBILITY reflex over the caption pipeline. The
// harvest ledger measures how many service videos carry a sovereign, timestamped
// caption track (captions-coverage.js, DR-0137). Captioning is an obligation
// (WCAG / COMMUNITY-FIRST — COLG's congregation skews elderly + HOH), not a
// nicety, so a corpus below the bar surfaces ONE concern naming the gap. It
// auto-resolves the moment coverage climbs past the bar (the detector stops
// finding it) — a live view of a real gap, never a painted list.
// ---------------------------------------------------------------------------
export function captionCoverageConcerns(captions = null) {
  const cov = captions && typeof captions === 'object' ? captions : null;
  // Need a real corpus and a real measured shortfall; below the bar AND with at
  // least one gap. No corpus yet -> nothing to caption -> no concern (honest).
  if (!cov || !cov.total || cov.gaps <= 0) return [];
  if (cov.pct >= CAPTIONS_COVERAGE_CONCERN_PCT) return [];
  return [{
    id: 'derived-captions-coverage',
    concern: `Sovereign captions cover only ${cov.captioned}/${cov.total} service videos (${cov.pct}%) — ${cov.gaps} still owe our OWN timestamped caption track. YouTube's captions don't reach the app, the in-room screens, or a re-post; captioning is a WCAG / COMMUNITY-FIRST obligation for a congregation that skews elderly and hard-of-hearing.`,
    solution: `Run the caption backfill (infra/nas-sme-pipeline/load-transcripts.py — it now emits vtt + cue_count) until coverage clears ${CAPTIONS_COVERAGE_CONCERN_PCT}%; route any no-caption videos to the Whisper-on-NAS fallback. Verify on the Harvest Ledger captions strip.`,
    status: 'open',
    area: 'Church · captions',
    whenNote: 'auto-detected · captions coverage check (captionsCoverage)',
    source: 'coverage',
    readOnly: true,
    detectedBy: 'captionsCoverage',
    created: today(),
  }];
}

// ---------------------------------------------------------------------------
// deriveDataConcerns — run every process detector over the live app data and
// return the flat list of read-through concern cards. Defensive: any detector
// throwing (bad row shape) is isolated so one bad record never blanks the board.
// ---------------------------------------------------------------------------
export function deriveDataConcerns({ transactions = [], rentals = [], debts = [], captions = null } = {}) {
  const safe = (fn) => { try { return fn() || []; } catch (e) { console.warn('[derive-concerns] detector failed', e); return []; } };
  return [
    ...safe(() => coverageConcerns(transactions)),
    ...safe(() => doorCollapseConcerns(rentals)),
    ...safe(() => shapeMismatchConcerns({ debts })),
    ...safe(() => captionCoverageConcerns(captions)),
  ];
}
