// =============================================================================
// ministry-groups — the four families the Ministries landing groups the
// registry into (the Love Corner redesign, Phase 3)
// =============================================================================
// The brief (2026-11-12 §5): "Bus Ministry, Choir, and other ministry groups
// are all part of the church's ministry structure. Create a beautiful
// Ministries landing page with individual ministry cards": Music & Worship,
// Transportation, Children & Youth, Church Life. "Preserve the existing Choir
// and Bus Ministry tabs as direct-access shortcuts. Do not assume every
// ministry has an existing management system."
//
// DERIVED, NOT A SECOND LIST (DR-0677): the ministries themselves stay in
// lib/church-ministries.js, the ONE registry; this file only says which family
// each id belongs to. Every registry id belongs to exactly one family (a test
// pins it), and an id this map does not know, such as a row the office adds
// to church_ministries, lands in Church Life so nothing is ever hidden.
export const MINISTRY_GROUPS = Object.freeze([
  { key: 'music', title: 'Music & Worship', caption: 'Choir, musicians, media, rehearsals', ids: ['choir', 'music', 'band', 'media'] },
  { key: 'transport', title: 'Transportation', caption: 'Rides to service, parking', ids: ['bus', 'parking'] },
  { key: 'youth', title: 'Children & Youth', caption: 'Children, youth, college, schools', ids: ['children', 'youth', 'college', 'school-outreach'] },
  {
    key: 'life',
    title: 'Church Life',
    caption: 'Fellowship, outreach, prayer, care, serving',
    ids: [
      'hospitality',
      'outreach',
      'new-members',
      'prayer',
      'missions',
      'care',
      'counseling',
      'ushers',
      'security',
      'deacons',
      'it',
      'administration',
      'events',
    ],
  },
]);

export const DEFAULT_GROUP = 'life';

/** The family an id belongs to; an unknown id lands in Church Life, never nowhere. */
export function groupFor(id) {
  const g = MINISTRY_GROUPS.find((x) => x.ids.includes(id));
  return g ? g.key : DEFAULT_GROUP;
}

/**
 * The registry (or any list of ministries) sorted into the four families, in
 * the registry's own order inside each. Empty families are kept so the
 * landing always shows the same four doors.
 */
export function groupedMinistries(ministries = []) {
  return MINISTRY_GROUPS.map((g) => ({
    key: g.key,
    title: g.title,
    caption: g.caption,
    ministries: (ministries || []).filter((m) => groupFor(m.id) === g.key),
  }));
}
