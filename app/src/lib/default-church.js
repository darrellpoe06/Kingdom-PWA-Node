// =============================================================================
// COLG_DEFAULT_CHURCH — the platform's DEFAULT CHURCH HOME (D21).
// The Church of the Living God ("The Love Corner"), Champaign IL, is the named
// FIRST community per COMMUNITY-FIRST-MISSION.md and the binding spec
// project_church_tab_directory_love_corner_default. Every user who has not set
// their own church home in Settings lands here: the unchurched get access to
// OUR church (the Father's Business anchor). This is the anchor entry of the
// multi-church PoeTech partner directory.
//
// Moved out of the monolith shell 2026-07-03 as part of the Church-module
// extraction (church home → components/ChurchHome.jsx): both the seed data in
// the shell and the ChurchHome module read this ONE record, so the default
// stays a single source of truth across the module boundary (feature modules
// may import lib/, never the shell — module-boundary-guard).
//
// PRIVACY NOTE: COLG's directory facts below (public church name, public
// address, public service times, the giving link the church already publishes)
// are PUBLIC-by-design — public information about a public institution, the
// platform's anchor community. This is a DIFFERENT category from the family's
// private financial seed that the 2026-05-28 demo-background sanitization
// guards. COLG-as-home-instance-default is established design intent
// (docs/01-architecture/task-cards/2026-05-22-counseling-subtab-inside-church.md).
// All facts verified against the COLG site + the Bishop Gwin migration brief
// (docs/99-session-notes/2026-06-03-bishop-gwin-colg-migration-brief.md):
// founded July 1946, Sunday Worship 11 AM, Wed Bible Study 1 PM + 6 PM,
// 312 E. Bradley Ave, giving runs through the church's own secure page.
// =============================================================================
const COLG_SITE = 'https://thechurchofthelivinggod.com';
export const COLG_DEFAULT_CHURCH = {
  name: 'The Church of the Living God',
  nickname: 'Also known as The Love Corner — Champaign IL',
  site: COLG_SITE,
  address: '312 E. Bradley Ave, Champaign, IL 61820',
  // Verified against the church's own printed documents (2026-07-12: the July
  // 2026 calendar + orders of service + Bible-quiz headers, all carrying the
  // official letterhead). Senior Bishop Lloyd E. Gwin, Pastor.
  pastor: 'Senior Bishop Lloyd E. Gwin',
  phone: '217-359-6920',
  officeHours: 'Mon–Fri 11:00 AM – 6:00 PM · Closed Sat & Sun',
  contactEmail: '',
  services: [
    { id: 'svc-sun',  day: 'Sunday',    time: '11:00 AM', label: 'Sunday Worship', online: true },
    { id: 'svc-wed1', day: 'Wednesday', time: '1:00 PM',  label: 'Bible Study',    online: true },
    { id: 'svc-wed2', day: 'Wednesday', time: '6:00 PM',  label: 'Bible Study',    online: true },
  ],
  // youtubeChannelId — COLG's YouTube channel (@TheLoveCorner). Resolved and
  // verified 2026-06-14 from the live-stream reference video UEtTGPaKI3k
  // (oEmbed author "The Love Corner" -> channel UC821pJh7YR5llBNnWUJj-ZA).
  // The Live Worship section embeds this CHANNEL's current broadcast via the
  // no-API-key /embed/live_stream?channel= pattern, so it auto-follows every
  // future stream with no weekly video-ID edits. Other churches set their own.
  youtubeChannelId: 'UC821pJh7YR5llBNnWUJj-ZA',
  media: { youtube: 'https://www.youtube.com/@TheLoveCorner' },
  links: {
    // Giving runs through the church's own secure page. The exact giving
    // deep-link is confirmed with the church office and swapped in (V1); the
    // site root carries the published giving link today, so the Give button is
    // accurate (no payment data touches this app).
    give: COLG_SITE,
    about: COLG_SITE,
  },
  tagline: 'Reviving Faith · Restoring Hope · Rebuilding Communities',
  // Announced events — the church's own published announcements (identity-class
  // data like the service times; announced from the pulpit in the 2026-07
  // "Celebration" service). Each renders in Parish Life with save-to-calendar.
  announcedEvents: [
    { id: 'evt-77th-assembly', name: '77th National Assembly — Positioned for Purpose', date: '2026-07-14', endDate: '2026-07-16', detail: 'South Campus Event Center, 1109 N 4th St, Champaign' },
    { id: 'evt-gospel-fest', name: 'Gospel Fest', date: '2026-08-29', detail: 'Featuring Leandrea Johnson' },
  ],
  verse: { ref: 'Psalm 34:3', text: 'O magnify the LORD with me, and let us exalt His name together.' },
  isDefaultHome: true,
};
