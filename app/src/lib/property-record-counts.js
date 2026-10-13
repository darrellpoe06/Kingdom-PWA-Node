// =============================================================================
// property-record-counts — the collapsed card counts what the open record holds
// =============================================================================
// Darrell, 2026-08-28, with two screenshots side by side: "Notes are not showing
// up as being inside the record before you open the record... however after
// opening the record it shows the 3 notes... need all data to be reflected in
// the apps."
//
// MEASURED. The collapsed line read "RECORDS (0 MAINT · 0 NOTES · 0 PHOTOS)"
// while the same property, opened, showed "UNIT NOTES · 3". Both were telling
// the truth about different things: the summary counted `conversationLog`
// (rendered lower down as "Tenant & vendor conversations", genuinely 0) and the
// word it used for that was "notes" — which is also the name of the OTHER store,
// `unitNotes`, that actually held the three. A label collision, and behind it a
// real gap: the summary counted three of the six stores a record carries and
// silently ignored unitNotes, rooms and equipment.
//
// A count that is only sometimes complete is worse than no count. Somebody scans
// eleven collapsed cards looking for the one with history on it, sees zeros
// everywhere, and concludes the app lost their notes.
//
// So there is ONE counter, here, and the card cannot disagree with the record
// because both read it. Adding a seventh store to a property means adding it to
// STORES below — and the test that walks a fully-populated rental fails until
// you do, which is the point.
//
// Pure + injectable: no React, no I/O, unit-testable on a plain object.
// =============================================================================

/**
 * Every array a property record keeps, with the word the OPEN record uses for
 * it. The label matters as much as the count — "notes" meaning two different
 * stores is what made the original bug invisible.
 */
export const STORES = Object.freeze([
  { key: 'unitNotes', one: 'note', many: 'notes' },
  { key: 'maintenanceLog', one: 'maintenance entry', many: 'maintenance' },
  { key: 'conversationLog', one: 'conversation', many: 'conversations' },
  { key: 'rooms', one: 'room', many: 'rooms' },
  { key: 'equipment', one: 'system', many: 'systems' },
  { key: 'photos', one: 'photo', many: 'photos' },
]);

const len = (v) => (Array.isArray(v) ? v.length : 0);

/**
 * Count every store on one rental. `photoOverride` exists because photos can
 * come from the NAS chat channel rather than the record itself — the caller
 * knows that number and it must win, so the card never under-reports pictures
 * that are really there.
 */
export function recordCounts(rental, { photoOverride = null } = {}) {
  const r = rental && typeof rental === 'object' ? rental : {};
  const counts = {};
  for (const s of STORES) counts[s.key] = len(r[s.key]);
  if (Number.isFinite(photoOverride) && photoOverride >= 0) counts.photos = photoOverride;
  const total = STORES.reduce((n, s) => n + counts[s.key], 0);
  return { ...counts, total };
}

/**
 * What the collapsed card says. Names only the stores that HAVE something —
 * "0 maint · 0 notes · 0 photos" is noise on ten cards and a lie on the
 * eleventh. A record with nothing says so in words, which is a fact about the
 * property rather than a row of zeroes to scan past.
 */
export function recordSummary(rental, opts = {}) {
  const c = recordCounts(rental, opts);
  if (c.total === 0) return 'Records — nothing filed yet';
  const parts = STORES
    .filter((s) => c[s.key] > 0)
    .map((s) => `${c[s.key]} ${c[s.key] === 1 ? s.one : s.many}`);
  return `Records — ${parts.join(' · ')}`;
}

/**
 * True when the record holds anything at all. Surfaces can use this to draw a
 * card with history differently from an empty one, so the eleven-door scan
 * stops being a reading exercise.
 */
export const hasRecords = (rental, opts = {}) => recordCounts(rental, opts).total > 0;
