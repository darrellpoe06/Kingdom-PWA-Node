// =============================================================================
// sample-markers — recognise the shipped SAMPLE household's figures, so they
// are never counted as a family's real money (Christina, 2026-11-03: "Correct
// the application logic so it uses verified financial information rather than
// sample data").
// =============================================================================
// The app starts every household from SEED_DATA (poe-financial-mvp-v28.jsx). A
// family that never replaced its income or outflow entries still carries the
// sample's: "Regional University salary (Adam) $4,200", household $2,176/mo and
// so on. Safe to Spend read those as the family's own. These signatures match
// the seed EXACTLY (id + source + who; all five outflow figures), so a family
// that edited an entry — a new amount, a new name — is never mistaken for it.
//
// Pure leaf module: no React, no storage.
// =============================================================================

const SAMPLE_SALARIES = [
  { id: 'd-uiuc', who: 'Adam', source: 'Regional University salary' },
  { id: 'd-church', who: 'Adam', source: 'Church stipend' },
  { id: 'c-state', who: 'Naomi', source: 'State (Guardianship)' },
  { id: 'c-church', who: 'Naomi', source: 'Church stipend' },
  { id: 'c-tlc', who: 'Naomi', source: 'Wellness Counseling Practice' },
];

const SAMPLE_OUTFLOWS = { rentalMortgages: 7595, propertyUtilities: 2638, household: 2176, debtService: 8155, charitableGiving: 2700 };

// The sample households themselves (?demo=…) are labeled "Sample · …" and keep
// their figures: there they ARE the household. Only a real family's records
// have the sample's leftovers ignored.
export function isSampleHousehold(data) {
  return /^Sample\b/.test(String(data?.meta?.releaseLabel || ''));
}

export function isSampleSalary(s) {
  if (!s) return false;
  return SAMPLE_SALARIES.some((x) => x.id === s.id && x.who === s.who && x.source === s.source);
}

export function isSampleOutflows(outflows) {
  if (!outflows || typeof outflows !== 'object') return false;
  const keys = Object.keys(SAMPLE_OUTFLOWS);
  return keys.every((k) => Number(outflows[k]) === SAMPLE_OUTFLOWS[k])
    && Object.keys(outflows).every((k) => keys.includes(k));
}
