// =============================================================================
// home-studio — the redesigned Love Corner homepage: its private-preview flag
// and the pure builders every section of it reads
// =============================================================================
// The brief (Darrell 2026-11-26): redesign the church homepage from the
// approved mockup as a PRIVATE owner-device preview first; the current
// homepage stays for everyone else until he has personally approved it; the
// redesign is presentation only (zero functionality loss, no mockup text used
// as data).
//
// THE FLAG (same shape as the Learn and Institute previews, so the native app
// shell, which has no address bar, can open it with no URL):
//   • OWNER DEVICE  — the shell passes ownerDevice = the signed-in account is
//     Darrell's persona. That is the only default-on.
//   • ?homeStudio=0 — off on this device, remembered, for anyone.
//   • ?homeStudio=1 — on and remembered, but ONLY where it cannot reach the
//     public: for the owner persona, on localhost / a LAN host, or on a preview
//     build (a host that is not the family's own site, which reaches no real
//     data, preview-isolation.js). On poetech.us a stranger who types the URL
//     parameter still sees the current homepage.
//   • A remembered "on" is honoured only while the same rule holds, so a
//     second account on the owner's phone does not inherit the preview.
// Nothing about the preview changes what a non-owner's device renders.
//
// THE DATA RULE (DR-0076 §1): every builder here is pure over real inputs the
// homepage already reads (the church record, the church website digest, the
// channel's own feed, this device's saved lesson places). None of them holds
// a name, a date, a time or a flyer from the mockup; with no input they
// return an empty answer and the surface says so.
import { upcomingAnnounced } from './home-week.js';
import { isPreviewHost } from './preview-isolation.js';

export const HOME_STUDIO_FLAG_KEY = 'poe-home-studio';

function nonPublicHost(hostname) {
  const h = String(hostname || '').toLowerCase().trim();
  if (!h) return false;
  if (h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0' || h.endsWith('.local')) return true;
  if (/^192\.168\./.test(h) || /^10\./.test(h) || h.startsWith('100.') || h.endsWith('.ts.net')) return true;
  return isPreviewHost(h);
}

/** May this device see the redesigned homepage at all? The owner's, or a host the public cannot reach. */
export function homeStudioAllowed({ ownerDevice = false, hostname = null } = {}) {
  return ownerDevice === true || nonPublicHost(hostname);
}

export function isHomeStudioOn({ search = null, storage = null, ownerDevice = false, hostname = null } = {}) {
  let store = storage;
  try {
    if (!store && typeof window !== 'undefined') store = window.localStorage;
  } catch {
    store = null;
  }
  let host = hostname;
  try {
    if (host == null && typeof window !== 'undefined' && window.location) host = window.location.hostname;
  } catch {
    host = '';
  }
  const allowed = homeStudioAllowed({ ownerDevice, hostname: host });
  try {
    const q = search != null ? search : typeof window !== 'undefined' && window.location ? window.location.search : '';
    const v = new URLSearchParams(q || '').get('homeStudio');
    if (v === '1' || v === '0') {
      if (v === '0' || allowed) {
        try {
          store && store.setItem(HOME_STUDIO_FLAG_KEY, v);
        } catch {
          /* no storage */
        }
      }
      return v === '1' && allowed;
    }
  } catch {
    /* no URL */
  }
  try {
    const remembered = store && store.getItem(HOME_STUDIO_FLAG_KEY);
    if (remembered === '0') return false;
    if (remembered === '1') return allowed;
  } catch {
    /* no storage */
  }
  return ownerDevice === true;
}

/** Turn the preview off on this device (the owner's "show the current homepage"); ?homeStudio=1 turns it back on. */
export function setHomeStudio(on, { storage = null } = {}) {
  try {
    const store = storage || (typeof window !== 'undefined' ? window.localStorage : null);
    if (store) store.setItem(HOME_STUDIO_FLAG_KEY, on ? '1' : '0');
    return true;
  } catch {
    return false;
  }
}

/**
 * The five tabs of the approved mockup's bottom bar. Each opens a place that
 * exists today (church-tabs.jsx CHURCH_BOTTOM_NAV is the current bar and is
 * untouched): Messages and Events are the home's Worship and Times sections,
 * Learning is the Learn tab, My Corner is the new personal door.
 */
export const CHURCH_STUDIO_NAV = Object.freeze([
  { key: 'studio-home', churchView: 'home', section: null, icon: 'home', words: 'Home' },
  { key: 'studio-messages', churchView: 'home', section: 'worship', icon: 'monitor', words: 'Messages' },
  { key: 'studio-events', churchView: 'home', section: 'times', icon: 'calendar', words: 'Events' },
  { key: 'studio-learning', churchView: 'learn', section: null, icon: 'bookOpen', words: 'Learning' },
  { key: 'studio-institute', churchView: 'institute', section: null, icon: 'landmark', words: 'Institute' },
  { key: 'studio-ministries', churchView: 'ministries', section: null, icon: 'users', words: 'Ministries' },
  { key: 'studio-give', give: true, icon: 'heart', words: 'Give' },
]);

/** Everything the current homepage offers that the mockup's rows do not carry, kept as one swipeable rail (nothing is dropped). */
export const EXPLORE_CARDS = Object.freeze([
  { key: 'reading', words: "Today's reading", note: 'The Scripture reader, read aloud', icon: 'book', sub: 'scripture' },
  { key: 'lessons', words: 'Bible lessons', note: 'Courses by age and depth', icon: 'bookOpen', sub: 'learn' },
  { key: 'trivia', words: 'Trivia & challenges', note: "This week's Bible trivia", icon: 'dice', sub: 'engagement' },
  { key: 'sermon-study', words: 'Sermon study', note: 'The Word, from the message', icon: 'pencil', sub: 'pulpit' },
  { key: 'program', words: 'Order of Service', note: 'Follow the service', icon: 'bookOpen', sub: 'program' },
  { key: 'choir', words: 'Choir & Music', note: 'Choir, band, rehearsals', icon: 'volume', sub: 'choir' },
  { key: 'bus', words: 'Bus Ministry', note: 'Request a ride', icon: 'users', sub: 'bus' },
  { key: 'family', words: 'Family & community', note: 'Stronger together in Christ', icon: 'chat', sub: 'home', section: 'about' },
  { key: 'corner', words: 'My Corner', note: 'Your record, prayer, settings', icon: 'heart', sub: 'home', section: 'mycorner' },
]);

/** The seven quick doors, in the mockup's order. `sub` is a church tab or 'home' + a section of the home. */
export const STUDIO_QUICK = Object.freeze([
  { key: 'worship', words: 'Worship', icon: 'cross', sub: 'home', section: 'worship' },
  { key: 'word', words: 'The Word', icon: 'bookOpen', sub: 'pulpit', section: null },
  { key: 'institute', words: 'Institute', icon: 'landmark', sub: 'institute', section: null },
  { key: 'ministries', words: 'Ministries', icon: 'users', sub: 'ministries', section: null },
  { key: 'youth', words: 'Kids & Youth', icon: 'sparkle', sub: 'youth', section: null },
  { key: 'prayer', words: 'Prayer', icon: 'dove', sub: 'home', section: 'prayer' },
  { key: 'give', words: 'Give', icon: 'heart', sub: 'home', section: 'give' },
]);

// ---- Watch & Be Inspired -----------------------------------------------------

/** A video's larger still (the same no-key image host the feed's own thumbnail uses). */
export function hqThumb(videoId) {
  const id = String(videoId || '').trim();
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

/** A feed's ISO `published` as "Nov 23, 2026"; '' when it cannot be read, so a message with no date still shows its title. */
export function messageDate(published) {
  const t = Date.parse(String(published || ''));
  if (!Number.isFinite(t)) return '';
  try {
    return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

/** The newest message, and a short swipeable run of the ones before it. The feed is newest-first. */
export function messageCards(videos, { limit = 5 } = {}) {
  const list = (Array.isArray(videos) ? videos : []).filter((v) => v && v.videoId);
  const cap = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 5;
  return { latest: list[0] || null, more: list.slice(1, cap), total: list.length };
}

// ---- Happening at The Love Corner --------------------------------------------

const words = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !['the', 'and', 'of', 'a', 'flyer'].includes(w));

/** Two names that are the same event: every word of the shorter one is in the longer. */
export function sameEvent(a, b) {
  const x = words(a);
  const y = words(b);
  if (!x.length || !y.length) return false;
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  const set = new Set(long);
  return short.every((w) => set.has(w));
}

function shortDate(key) {
  const t = Date.parse(`${String(key || '')}T12:00:00Z`);
  if (!Number.isFinite(t)) return '';
  try {
    return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  } catch {
    return '';
  }
}

/** "Dec 31", or "Dec 29 – Jan 2" for an event that spans days. */
export function eventWhen(ev) {
  const a = shortDate(ev && ev.date);
  const b = ev && ev.endDate && ev.endDate !== ev.date ? shortDate(ev.endDate) : '';
  return b ? `${a} – ${b}` : a;
}

/**
 * What the homepage shows under "Happening at The Love Corner": the church's
 * announced events still ahead (soonest first, never the past), each given the
 * website flyer that names the same event; then the website's other current
 * flyers. At most `limit` are shown and `total` says how many exist, so
 * "View all" can name the real count. Nothing here is typed by hand.
 *   office — the church-site digest (lib/church-site.js), or null
 */
export function happeningItems({ office = null, announcedEvents = [], now = new Date(), limit = 3 } = {}) {
  const flyers = office && office.events && Array.isArray(office.events.flyers) ? office.events.flyers : [];
  const used = new Set();
  const items = [];
  for (const e of upcomingAnnounced(announcedEvents, now)) {
    const f = flyers.find((x) => !used.has(x.path) && sameEvent(x.name, e.name));
    if (f) used.add(f.path);
    items.push({ id: `event-${e.id || e.name}`, kind: 'event', name: e.name, when: eventWhen(e), detail: e.detail || '', src: f ? f.src : null, flyer: f ? { src: f.src, alt: `${e.name} flyer` } : null });
  }
  for (const f of flyers) {
    if (used.has(f.path)) continue;
    items.push({ id: `flyer-${f.path}`, kind: 'flyer', name: f.name || 'Church event', when: '', detail: '', src: f.src, flyer: { src: f.src, alt: `${f.name || 'Event'} flyer` } });
  }
  const cap = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 3;
  return { items: items.slice(0, cap), total: items.length };
}

// ---- Grow in the Word ---------------------------------------------------------

/**
 * Where this device left off in the Word: the newest lesson begun and not
 * finished, resolved against the mounted catalog so a course that no longer
 * exists offers nothing (learn-resume's own rule). `finished` counts the
 * lessons this device has read to the end. No place, nothing painted.
 *   places  — learn-resume listPlaces({ inProgress: true }), newest first
 *   titleOf — (courseKey) => the course's title, or '' when it is not mounted
 */
export function continueLearning({ places = [], finished = 0, titleOf = () => '', where = () => '', ago = () => '' } = {}) {
  for (const p of Array.isArray(places) ? places : []) {
    const title = p && p.courseKey ? titleOf(p.courseKey) : '';
    if (!title) continue;
    return { has: true, title, where: where(p), ago: ago(p.at), finished: Number(finished) || 0 };
  }
  return { has: false, title: '', where: '', ago: '', finished: Number(finished) || 0 };
}

// ---- My Corner ------------------------------------------------------------------

/**
 * The doors of My Corner, each an existing destination: a church tab, a
 * section of the home, or one of the header's own sheets. `needsSignIn` doors
 * are shown only to a signed-in member (the tab's own gate is unchanged).
 */
export const MY_CORNER_DOORS = Object.freeze([
  { key: 'record', words: 'My Record', note: 'Your place in the church family', icon: 'pencil', go: { sub: 'my-record' }, needsSignIn: true },
  { key: 'prayer', words: 'Prayer requests', note: 'Ask, or stand with someone', icon: 'dove', go: { sub: 'home', section: 'prayer' } },
  { key: 'give', words: 'Give', note: 'Tithes, offerings and giving channels', icon: 'heart', go: { sub: 'home', section: 'give' } },
  { key: 'office', words: 'Church Office', note: 'Calendar, letters and announcements', icon: 'mail', go: { sub: 'home', section: 'office' } },
  { key: 'directory', words: 'Church directory', note: 'Find your church family', icon: 'users', go: { sub: 'home', section: 'about' } },
  { key: 'members', words: 'Members', note: 'The church roll', icon: 'users', go: { sub: 'members' }, needsSignIn: true },
  { key: 'notifications', words: 'Notifications', note: 'What is new for you', icon: 'bell', event: 'lovecorner:notifications' },
  { key: 'personalize', words: 'Personalize', note: 'Theme, text size, voice', icon: 'palette', event: 'lovecorner:personalize' },
  { key: 'search', words: 'Search', note: 'Tabs and courses', icon: 'eye', event: 'lovecorner:search' },
  { key: 'all', words: 'All features', note: 'Every tab in the app', icon: 'sliders', event: 'lovecorner:menu' },
]);
