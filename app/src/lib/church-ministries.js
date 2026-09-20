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
// The church's own published call for volunteers — the authoritative roster.
const FLYER = 'the Love Corner Experience volunteer flyer, published by the church 2026-09 ("We Need You!")';

// A NOTE ON DOUBLE-BARRELLED NAMES. Two entries carry both our word and the
// church's printed one — "Church Band / Instrumental Ministry" and "New
// Members & Membership Care". They are ONE ministry each, not two, but the
// flyer is what a volunteer is holding: someone reading "Instrumental
// Ministry" off the paper must find it in the app under that word, and a
// second near-identical entry would split one ministry's people across two
// lists. The gate that caught this reads from the FLYER, so it fails whenever
// the app drifts from what the church published — the only direction that
// matters.
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
    id: 'band', name: 'Church Band / Instrumental Ministry',
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
    id: 'new-members', name: 'New Members & Membership Care',
    blurb: 'The welcome for someone who just joined — the card, and what comes next.',
    // Named by Darrell 2026-09-11 as the SECOND pilot after giving: "you wanna
    // deal with the new members?... I think November would be good."
    surface: null, feedbackKey: 'church-ministries',
    join: 'Just joined? This is where the welcome starts.',
    source: 'named by Darrell 2026-09-11 as the second pilot (target November)',
  },
  // -------------------------------------------------------------------------
  // THE CHURCH'S OWN PUBLISHED ROSTER, 2026-09-20.
  // -------------------------------------------------------------------------
  // Darrell sent the "Love Corner Experience" volunteer flyer — the church's
  // own printed call for volunteers, QR code on it, twenty-one ministries
  // named — and asked whether the process is in place to support it TODAY.
  //
  // It was not. The app carried NINE of them. A person scans that QR, arrives
  // wanting the Prayer Ministry or Children's Ministry, and finds no such
  // thing — which reads as "they do not want me", on the one surface the
  // church printed a QR code to send them to.
  //
  // This is also the source the file has been waiting for since 2026-09-11:
  // "the church office sets the real list." A flyer the church published IS
  // the office naming it, so the roster below is confirmed and the hedge that
  // stood in for it comes down.
  {
    id: 'music', name: 'Music Ministry',
    blurb: 'Singing and leading worship — the whole music side, beyond the choir alone.',
    surface: null, feedbackKey: 'church-music',
    join: 'Ask about singing or leading worship.',
    source: FLYER,
  },
  {
    id: 'it', name: 'IT Ministry',
    blurb: 'The computers, the network and the screens that carry the service.',
    surface: null, feedbackKey: 'church-it',
    join: 'Ask about helping with the tech.',
    source: FLYER,
  },
  {
    id: 'parking', name: 'Parking & Traffic Ministry',
    blurb: 'The lot on a Sunday morning — safe arrivals, safe departures.',
    surface: null, feedbackKey: 'church-parking',
    join: 'Ask about helping in the lot.',
    source: FLYER,
  },
  {
    id: 'deacons', name: 'Deacons',
    blurb: 'Serving the congregation and supporting the pastor.',
    surface: null, feedbackKey: 'church-deacons',
    join: 'Ask a deacon about the ministry.',
    source: FLYER,
  },
  {
    id: 'prayer', name: 'Prayer Ministry',
    blurb: 'Standing in prayer for the church and for whoever asks.',
    surface: null, feedbackKey: 'church-prayer',
    join: 'Ask about joining the prayer ministry.',
    source: FLYER,
  },
  {
    id: 'missions', name: 'Missions & Evangelism',
    blurb: 'Carrying the Word beyond the building.',
    surface: null, feedbackKey: 'church-missions',
    join: 'Ask about missions and evangelism.',
    source: FLYER,
  },
  {
    id: 'children', name: "Children's Ministry",
    blurb: 'The youngest of the house — teaching, care and a safe room.',
    surface: null, feedbackKey: 'church-children',
    join: "Ask about serving with the children.",
    source: FLYER,
  },
  {
    id: 'youth', name: 'Youth Ministry',
    blurb: 'The teenagers — discipleship, activities and a place to belong.',
    surface: null, feedbackKey: 'church-youth',
    join: 'Ask about serving with the youth.',
    source: FLYER,
  },
  {
    id: 'college', name: 'College Ministry',
    blurb: 'Students away from home, kept close to the house.',
    surface: null, feedbackKey: 'church-college',
    join: 'Ask about the college ministry.',
    source: FLYER,
  },
  {
    id: 'school-outreach', name: 'School Outreach & Youth Education',
    blurb: 'Into the schools — tutoring, mentoring and the education of the young.',
    surface: null, feedbackKey: 'church-school-outreach',
    join: 'Ask about school outreach and tutoring.',
    source: FLYER,
  },
  {
    id: 'administration', name: 'Administration',
    blurb: 'The office work that keeps everything else running.',
    surface: null, feedbackKey: 'church-administration',
    join: 'Ask about helping in the office.',
    source: FLYER,
  },
  {
    id: 'events', name: 'Events & Special Programs',
    blurb: 'Programs, banquets and the days the house sets apart.',
    // NOT `church-events` — that key is Campus Rentals, a different thing
    // entirely. Pointing here would have quietly filed a volunteer's note
    // about the Christmas program into the building-rental queue.
    surface: null, feedbackKey: 'church-events-programs',
    join: 'Ask about helping with events.',
    source: FLYER,
  },
  {
    id: 'care', name: 'Care & Benevolence',
    blurb: 'Practical help for members in need — quietly, and without shame.',
    surface: null, feedbackKey: 'church-care',
    join: 'Ask about the care and benevolence ministry.',
    source: FLYER,
  },
  {
    id: 'counseling', name: 'Counseling Support',
    blurb: 'Walking alongside people through hard seasons.',
    surface: null, feedbackKey: 'church-counseling',
    join: 'Ask about counseling support.',
    source: FLYER,
  },
];

// CONFIRMED 2026-09-20 against the church's OWN published flyer. The hedge
// below stood for "we are guessing at their list"; a roster the church printed
// and put a QR code on is not a guess, it is the office naming it. Keeping the
// disclaimer up after that would be its own kind of dishonesty — understating
// what we know is as much a failure of truth as overstating it (DR-0100).
export const MINISTRY_ROSTER_IS_CONFIRMED = true;
export const MINISTRY_ROSTER_NOTE =
  'These are the ministries the church names on its own volunteer flyer. If your gift is not on the list, there is still a place for you — say so and the office will point you to it.';

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
