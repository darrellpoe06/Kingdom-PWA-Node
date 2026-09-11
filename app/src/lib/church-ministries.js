// =============================================================================
// church-ministries — ONE named list of the church's ministries, and the thing
// the app organizes itself around.
// =============================================================================
// Declared by Darrell 2026-09-11, while the COLG leadership worked the app:
// "after a certain what different ministries we have and organize around
// that." It is the answer to what they were already doing on screen —
//
//   "So it looks like they've got all these different categories. They can just
//    go to the category they wanna go to... and then work that category."
//   "Now the members see bus ministry, they see different things... so I wanna
//    join the choir if I wanna do this."
//
// — and to the two places the app fell down while they watched:
//
//   "I don't see the church band."      (a real ministry with no entry anywhere)
//   "Which one is it — the church, and his choir, and his choir? We don't want
//    the choir. We want the church."    (Choir drowning the Church list)
//
// WHY A REGISTRY AND NOT ANOTHER LIST. There was already a ministries list in
// this repo — OPS_MINISTRIES in lib/ministry-ops.js — but it lived inside an
// internal staff ops surface, nothing else read it, and it was missing the
// band. A second hand-kept list is how the feedback-area list went stale twice
// (scripts/feedback-area-guard.mjs exists because of that). So this is the ONE
// list: the member-facing directory, the feedback picker's Ministries group,
// and the ops picker all derive from here.
//
// PROVENANCE, PER ENTRY. `source` says how we know this ministry exists, and
// `surface` says whether the app actually has a place for it yet. Nothing here
// is guessed: every entry traces to a live surface in this repo, to the ops
// list, or to Darrell naming it on 2026-09-11. The church office adds the rest
// — `isConfirmedRoster` stays false until they do, and the directory says so
// out loud rather than implying this is the complete roster (DR-0076: honest
// uncertainty is a required output, never papered over).
// =============================================================================

// surface: the in-app route this ministry already has, or null when the
//          ministry is named but has no surface of its own yet.
// join:    what a member is actually asking for when they tap it.
export const CHURCH_MINISTRIES = [
  {
    id: 'bus', name: 'Bus / Van Ministry',
    blurb: 'Rides to service — routes, drivers, and a pickup you can ask for.',
    surface: { view: 'church', sub: 'bus' }, feedbackKey: 'church-bus',
    join: 'Ask for a ride, or ask the coordinator about driving.',
    source: 'live surface since 2026-07-12 (Deacon Anderson, coordinator)',
  },
  {
    id: 'choir', name: 'Choir',
    blurb: 'The worship team — set lists, rehearsal, availability, the songbook.',
    surface: { view: 'church', sub: 'choir' }, feedbackKey: 'church-choir',
    join: 'Ask the director about joining the choir.',
    source: 'live surface (director hub)',
  },
  {
    id: 'band', name: 'Church Band',
    blurb: 'The musicians who play with the choir and through the service.',
    // Named by Darrell 2026-09-11 precisely BECAUSE it was missing: "I don't
    // see the church band." It has no surface yet — saying so is the honest
    // state, and it is what makes the gap visible instead of silent.
    surface: null, feedbackKey: 'church-band',
    join: 'Ask about playing with the band.',
    source: 'named by Darrell 2026-09-11 as missing from the app',
  },
  {
    id: 'media', name: 'Media / Broadcast',
    blurb: 'Cameras, sound, the stream, and the video wall.',
    surface: { view: 'church', sub: 'videowall' }, feedbackKey: 'church-videowall',
    join: 'Ask about serving on a station — every operator is taught one.',
    source: 'live surfaces + the broadcast team course (Deacon Wright founded)',
  },
  {
    id: 'ushers', name: 'Ushers',
    blurb: 'Greeting, seating, and the order of the house.',
    surface: null, feedbackKey: 'church-ministries',
    join: 'Ask about serving on the usher board.',
    source: 'OPS_MINISTRIES (lib/ministry-ops.js, 2026-07-13)',
  },
  {
    id: 'security', name: 'Security',
    blurb: 'Watching over the house while the people worship.',
    surface: null, feedbackKey: 'church-ministries',
    join: 'Ask about serving on the security team.',
    source: 'OPS_MINISTRIES (lib/ministry-ops.js, 2026-07-13)',
  },
  {
    id: 'hospitality', name: 'Hospitality',
    blurb: 'Meals, gatherings, and making room for people.',
    surface: null, feedbackKey: 'church-ministries',
    join: 'Ask about helping with hospitality.',
    source: 'OPS_MINISTRIES (lib/ministry-ops.js, 2026-07-13)',
  },
  {
    id: 'outreach', name: 'Outreach',
    blurb: 'Who the church serves and reaches next.',
    surface: null, feedbackKey: 'church-ministries',
    join: 'Ask about going out with the outreach team.',
    source: 'OPS_MINISTRIES + the church project board',
  },
  {
    id: 'new-members', name: 'New Members',
    blurb: 'The welcome for someone who just joined — the card, and what comes next.',
    // Named by Darrell 2026-09-11 as the SECOND pilot after giving: "you wanna
    // deal with the new members?... I think November would be good."
    surface: null, feedbackKey: 'church-ministries',
    join: 'Just joined? This is where the welcome starts.',
    source: 'named by Darrell 2026-09-11 as the second pilot (target November)',
  },
];

// The roster is what the church has told us SO FAR, not the whole house. Until
// the office confirms their own list, every surface that renders it says so.
export const MINISTRY_ROSTER_IS_CONFIRMED = false;
export const MINISTRY_ROSTER_NOTE =
  'These are the ministries the app knows about so far. The church office sets the real list — anything missing gets added the moment they name it.';

export const ministryById = (id) => CHURCH_MINISTRIES.find((m) => m.id === id) || null;
export const ministryName = (id) => ministryById(id)?.name || id;

// Ministries that already have a place in the app to go to, vs. the ones a
// member can only ask about today. Keeping the difference visible is the point:
// a directory that implies a surface exists when it doesn't is the painted
// number this project refuses (DR-0061 reality-trace).
export const ministriesWithSurface = () => CHURCH_MINISTRIES.filter((m) => m.surface);
export const ministriesWithoutSurface = () => CHURCH_MINISTRIES.filter((m) => !m.surface);

// The ops picker's shape ([key, label] pairs), derived so the internal staff
// list and the member-facing directory can never drift apart again.
export const opsMinistryOptions = () => [
  ['general', 'General / Platform'],
  ...CHURCH_MINISTRIES.map((m) => [m.id, m.name]),
];

// matchesMinistry — the type-to-filter predicate, shared by every surface that
// lets someone hunt for their ministry by name. Matches the name, the blurb, and
// the id, so "band", "music", "ride" and "bus" all land somewhere sensible.
export function matchesMinistry(ministry, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const hay = `${ministry.id} ${ministry.name} ${ministry.blurb} ${ministry.join}`.toLowerCase();
  return q.split(/\s+/).every((word) => hay.includes(word));
}
