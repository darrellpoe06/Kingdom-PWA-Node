// =============================================================================
// apartment.js — which doors are one apartment (DR-0963, DR-0968)
// =============================================================================
// Moved out of cloud.js unchanged (DR-0980) so screens that never touch the
// database -- the Doors board -- can ask the same question the sibling read
// asks, with no second copy to drift. cloud.js re-exports all three.
// The reasoning lives where it was written: cloud.js, above sameApartment's
// re-export.
// =============================================================================
const tidy = (v) => String(v == null ? '' : v).toLowerCase().replace(/[.,#]/g, ' ').replace(/\s+/g, ' ').trim();

// The digits-and-letters of a unit: "Apt 4" -> "4", "Unit 3B" -> "3b".
export function unitKey(unit) {
  const t = tidy(unit).replace(/\b(apartment|apt|unit|suite|ste|room|rm|no|number)\b/g, ' ').replace(/\s+/g, ' ').trim();
  return t;
}

// The street with a trailing unit designator removed, so "805 x avenue apt 4"
// and "805 x avenue" are one street once the unit is accounted for.
export function streetKey(address, unit) {
  let a = tidy(address);
  const u = unitKey(unit);
  if (!u) return a;
  // Strip a trailing "<designator> <unit>" or bare "<unit>" from the address.
  a = a.replace(new RegExp(`(?:\\b(?:apartment|apt|unit|suite|ste|room|rm|no|number)\\b\\s*)?${u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`), '').trim();
  return a.replace(/\s+/g, ' ');
}

/** Two doors are the same apartment when the street matches and the unit NUMBER matches. */
export function sameApartment(a, b) {
  const ua = unitKey(a && a.unit);
  const ub = unitKey(b && b.unit);
  if (!ua || !ub) return false;           // no unit means a whole place, never a sibling
  if (ua !== ub) return false;
  return streetKey(a && a.address, a && a.unit) === streetKey(b && b.address, b && b.unit);
}


/**
 * The building a door is in (DR-0996): its street with the unit folded out
 * (streetKey), cut at the first unit designator. The same rule as the
 * database's public.building_key (0283), so "805 North Prospect Avenue Apt 4"
 * with unit "Bed B" and "805 North Prospect Avenue" with unit "Apt 2" are one
 * building. Cleaned, never fuzzy (DR-0967). '' when it names nothing.
 */
export function buildingKey(address, unit) {
  const k = streetKey(address, unit)
    .replace(/\b(apartment|apt|unit|suite|ste|room|rm|bed|no|number)\b.*$/, '')
    .replace(/\s+/g, ' ').trim();
  return k.length >= 5 ? k : '';
}
