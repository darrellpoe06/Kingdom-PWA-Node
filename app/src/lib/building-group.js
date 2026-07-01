// =============================================================================
// building-group.js — a BUILDING is a group of unit-DOORS (pure model)
// =============================================================================
// The durable fix for the 805 N Prospect regression (Darrell 2026-07-01).
//
// A four-plex has TWO possible shapes in the data:
//   (a) FOUR separate door records (r4..r7 = "Apt 1..4"), each its own
//       rentable door with its own tenant / notes / maintenance / photos /
//       messages / requests — the shape the seed uses and the shape Darrell
//       asked for ("restore each unit as its own door under the 805 building").
//   (b) ONE record carrying a units:N count (introduced 2026-06-18, commit
//       0006449). It bumps the DOOR COUNT but renders as one card and can hold
//       only ONE tenant / one notes set — so a four-plex collapsed to (b)
//       LOSES its per-unit records. That collapse is the reported regression:
//       805 showed as a single door reading "0 MAINT · 0 NOTES · 0 PHOTOS".
//
// This module makes (a) first-class: unit-doors carry a `building` key and are
// GROUPED under it for display, so every unit keeps its own everything and the
// building reads as one address with N doors beneath it. Grouping is a pure,
// order-preserving derivation over the real records — never a painted count.
//
// PURE: no I/O, no React. Unit-tested by building-group.test.js, which pins the
// regression guard: four unit records under one building stay FOUR doors.
// =============================================================================

import { unitsOf, isPersonalProp } from './rental-portfolio.js';

// The building a door belongs to, or null when the door stands alone. Trimmed
// so '  805 N Prospect ' and '805 N Prospect' group together; empty => alone.
export const buildingKeyOf = (r) => {
  const b = r && typeof r.building === 'string' ? r.building.trim() : '';
  return b || null;
};

// A short per-unit label for a door within its building. Prefers an explicit
// unitLabel; else derives from the trailing "Apt 3" / "Unit 4" / "#2" in the
// name; else falls back to the whole name.
export const unitLabelOf = (r) => {
  if (r && typeof r.unitLabel === 'string' && r.unitLabel.trim()) return r.unitLabel.trim();
  const name = String((r && r.name) || '').trim();
  const m = name.match(/\b(?:apt|unit|ste|suite|#)\.?\s*([\w-]+)$/i);
  if (m) return `Apt ${m[1]}`.replace(/^Apt (?=(unit|ste|suite)\b)/i, '');
  return name;
};

// Sum a set of door records into a building rollup — pure figures the building
// header shows. doorCount is the SUM of unitsOf across the group (each separate
// door contributes its own units, default 1), so four unit-doors read as four.
export function buildingRollup(units = []) {
  return (units || []).reduce(
    (a, r) => {
      a.doorCount += unitsOf(r);
      a.monthlyRent += Number(r.rent) || 0;
      a.actualRent += Number(r.actual) || 0;
      a.mortgageDebt += Number(r.mortgage && r.mortgage.balance) || 0;
      return a;
    },
    { doorCount: 0, monthlyRent: 0, actualRent: 0, mortgageDebt: 0 }
  );
}

// Group a flat list of door records into an ORDER-PRESERVING list of entries:
//   { type: 'building', key, building, units: [...], rollup }  — 2+ doors, OR
//   { type: 'single', key, rental }                            — a lone door.
// A building group is emitted at the position of its FIRST unit, so the list
// order the caller already sorted is respected. A `building` shared by exactly
// one record still renders as a (single) — grouping needs 2+ doors to matter.
export function groupDoorsByBuilding(rentals = []) {
  const list = Array.isArray(rentals) ? rentals : [];
  const order = [];            // building keys in first-seen order
  const byKey = new Map();     // key -> units[]
  const singles = [];          // { idx, rental } for lone doors

  list.forEach((r, idx) => {
    const key = buildingKeyOf(r);
    if (key) {
      if (!byKey.has(key)) { byKey.set(key, []); order.push({ key, idx }); }
      byKey.get(key).push(r);
    } else {
      singles.push({ idx, rental: r });
    }
  });

  const entries = [];
  for (const { key, idx } of order) {
    const units = byKey.get(key);
    if (units.length >= 2) {
      entries.push({ type: 'building', key, building: key, firstIdx: idx, units, rollup: buildingRollup(units) });
    } else {
      // A "building" of one is just a single door — don't manufacture a group.
      entries.push({ type: 'single', key, firstIdx: idx, rental: units[0] });
    }
  }
  for (const s of singles) entries.push({ type: 'single', key: null, firstIdx: s.idx, rental: s.rental });
  entries.sort((a, b) => a.firstIdx - b.firstIdx);
  return entries;
}

// How many DISTINCT doors a list represents — the count that must not collapse.
// (Sum of unitsOf, matching derivePortfolio's doorCount, but computed here so a
// grouping change can be guarded independently.)
export const doorCountOf = (rentals = []) =>
  (rentals || []).reduce((s, r) => s + unitsOf(r), 0);

// buildRestoreUnits — the pure payload for the "this is a multi-unit building,
// restore its units" control. Given a collapsed/seed door (`base`) and the unit
// labels a building should have, returns one door payload PER label: each a
// standalone door (units:1) sharing the base's building + address + entity, so
// the building regains its separate doors. The base itself becomes the first
// unit (caller decides whether to relabel it). idGen returns a fresh local id.
export function buildRestoreUnits(base = {}, labels = [], idGen) {
  const building = buildingKeyOf(base) || String(base.name || base.address || '').trim();
  const mk = (typeof idGen === 'function') ? idGen : (() => `r-unit-${Math.random().toString(36).slice(2, 8)}`);
  return (labels || []).map((label) => ({
    id: mk(),
    name: base.address ? `${base.address} ${label}`.trim() : `${building} ${label}`.trim(),
    address: base.address || building,
    city: base.city || '',
    state: base.state || '',
    zip: base.zip || '',
    building,
    unitLabel: label,
    tenantName: '',
    propertyType: base.propertyType || 'multi-family',
    units: 1,
    rent: 0,
    actual: 0,
    status: 'unrented',
    entityId: base.entityId || 'e-poeprops',
    mortgage: { balance: 0, rate: Number(base.mortgage && base.mortgage.rate) || 0, monthlyPI: 0, escrow: 0, estimated: true },
    notes: '',
  }));
}

// Re-export so callers can filter personal rows before grouping in one import.
export { isPersonalProp };
