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

// THE BUILDING A DOOR BELONGS TO, read across its siblings (Darrell 2026-10-22:
// "805 N Prospect Ave Champaign IL the building... not one of the apartments").
// Measured on the live database (building-probe): 805's five doors share one
// address and each carries its unit label, but only ONE carries the building
// label, so the per-record key above left four of them standing alone and the
// building never read as one. A door's building is therefore:
//   1. its own building label, when it has one;
//   2. else the one building label its address-siblings carry (exactly one);
//   3. else its address, when two or more doors share that address;
//   4. else none: it stands alone.
// Two different labels at one address (a complex of buildings) stay apart:
// the unlabelled doors there are not guessed into either.
const addressKeyOf = (r) => String((r && r.address) || '').toLowerCase().replace(/[.,#]/g, ' ').replace(/\s+/g, ' ').trim();

export function buildingResolver(rentals = []) {
  const byAddr = new Map(); // address key -> { count, labels: Set }
  for (const r of Array.isArray(rentals) ? rentals : []) {
    const a = addressKeyOf(r);
    if (!a) continue;
    const slot = byAddr.get(a) || { count: 0, labels: new Set() };
    slot.count += 1;
    const own = buildingKeyOf(r);
    if (own) slot.labels.add(own);
    byAddr.set(a, slot);
  }
  return (r) => {
    const own = buildingKeyOf(r);
    if (own) return own;
    const slot = byAddr.get(addressKeyOf(r));
    if (!slot) return null;
    if (slot.labels.size === 1) return [...slot.labels][0];
    if (slot.labels.size === 0 && slot.count >= 2) return String(r.address).trim();
    return null;
  };
}

// Every building of two or more doors, in first-seen order:
// [{ key, label, doors: [...] }]. The key is what a building work order links to.
export function buildingsOf(rentals = []) {
  return groupDoorsByBuilding(rentals)
    .filter((e) => e.type === 'building')
    .map((e) => ({ key: e.key, label: e.building, doors: e.units }));
}

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
  const keyOf = buildingResolver(list);

  list.forEach((r, idx) => {
    const key = keyOf(r);
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

// Default unit labels for a door count: Apt 1..N. The add-flow dropdown and
// the split panel both seed from this; every label stays editable before save.
export const defaultUnitLabels = (n) =>
  Array.from({ length: Math.max(0, Math.round(Number(n) || 0)) }, (_, i) => `Apt ${i + 1}`);

// buildNewBuildingDoors — the pure payload list for ADDING a multi-unit
// building in one save. Given the full add-form payload (`base`, the shape
// submitProp builds) and the unit labels, returns one door payload PER label:
// every door shares the address / coords / type / entity / status and carries
// the per-door rent. Building-level figures (tenant, mortgage, purchase price,
// est. value, notes) land on the FIRST door only, so portfolio totals count
// them once instead of N times.
export function buildNewBuildingDoors(base = {}, labels = []) {
  const building = (typeof base.building === 'string' && base.building.trim())
    || String(base.address || base.name || '').trim();
  const addr = String(base.address || building).trim();
  const rate = Number(base.mortgage && base.mortgage.rate) || 0;
  return (labels || []).map((label, i) => ({
    ...base,
    name: `${addr} ${label}`.trim(),
    building,
    unitLabel: label,
    units: 1,
    tenantName: i === 0 ? (base.tenantName || '') : '',
    purchasePrice: i === 0 ? (Number(base.purchasePrice) || 0) : 0,
    purchaseDate: i === 0 ? (base.purchaseDate || '') : '',
    estimatedValue: i === 0 ? (Number(base.estimatedValue) || 0) : 0,
    notes: i === 0 ? (base.notes || '') : '',
    mortgage: i === 0
      ? (base.mortgage || { balance: 0, rate: 0, monthlyPI: 0, escrow: 0, estimated: true })
      : { balance: 0, rate, monthlyPI: 0, escrow: 0, estimated: true },
  }));
}

// Re-export so callers can filter personal rows before grouping in one import.
export { isPersonalProp };

// WHAT THE BUILDING'S OWN RECORD IS MISSING, read from its doors (Darrell
// 2026-10-22: "There is only 4 apartments in the building" and "We were
// splitting apt 4 after the current tenant moves to another one of our bigger
// properties"). Measured on 805 (building-probe): five door records, four of
// them without the building label, and two of them labelled "Apt 4" (the one
// with the tenant, and the split half added 2026-08-28, unrented). So the
// building counts its APARTMENTS by distinct unit label, names the doors that
// are missing the building label so one tap can fill it in, and names the
// labels on record twice, so the split half can be named apart. Nothing is
// guessed: the caller writes only what the person confirms.
export function buildingRecordGaps(units = [], key = '') {
  const doors = Array.isArray(units) ? units : [];
  const missingLabel = doors.filter((r) => !buildingKeyOf(r) && key);
  const byLabel = new Map();
  for (const r of doors) {
    const l = unitLabelOf(r);
    const k = l.toLowerCase();
    if (!byLabel.has(k)) byLabel.set(k, { label: l, doors: [] });
    byLabel.get(k).doors.push(r);
  }
  const duplicates = [...byLabel.values()].filter((g) => g.doors.length > 1);
  return { apartments: byLabel.size, records: doors.length, missingLabel, duplicates };
}

// The name a split half is offered first: its label with the next letter
// ("Apt 4" -> "Apt 4B"), a suggestion the person can change before it is saved.
export const splitHalfLabel = (label) => {
  const l = String(label || '').trim();
  if (!l) return '';
  return /[A-Za-z]$/.test(l) && /\d[A-Za-z]$/.test(l) ? `${l.slice(0, -1)}${String.fromCharCode(l.slice(-1).toUpperCase().charCodeAt(0) + 1)}` : `${l}B`;
};
