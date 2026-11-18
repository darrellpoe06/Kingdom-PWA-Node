// =============================================================================
// church-site — what the church office publishes on its own website, read
// into the app (DR-1550)
// =============================================================================
// Darrell 2026-11-18: "The Love Corner App should be able to get the latest
// data from the website... announcements... upcoming events... Without needing
// to go to the site!!!! Pull in the new information for those using the app."
//
// The site (Weebly; read by church-site-probe.yml on 2026-11-18) publishes the
// month's calendar as one picture on /calendar.html under an "<month> <year>"
// heading, the Letters from BG as a picture named "<month>-<year>-letter", the
// current events as flyer pictures in a slideshow, and the service times as
// text on the home page. No feed, no API. The same-origin relay
// /api/church-site hands the client each page's content region and the
// pictures it names; THIS is the pure parser and the digest the surfaces
// render. Deterministic; never throws; a page that cannot be read is null,
// never a guess (DR-0076).
// =============================================================================

export const CHURCH_SITE_HOST = 'thechurchofthelivinggod.com';
export const RELAY = '/api/church-site';
export const LOAD_TIMEOUT_MS = 8000;
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MONTH_RE = new RegExp(`\\b(${MONTHS.join('|')})[\\s_-]*(20\\d\\d)\\b`, 'i');

/** True when a church record's site IS the church's own website this reader knows. */
export function siteIsTheChurchs(site) {
  try {
    const host = new URL(String(site || '')).hostname.toLowerCase();
    return host === CHURCH_SITE_HOST || host === `www.${CHURCH_SITE_HOST}`;
  } catch {
    return false;
  }
}

const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  copy: '©',
};
export function decodeEntities(s) {
  return String(s || '')
    .replace(/&#(\d+);/g, (_, n) => (Number(n) === 8203 ? '' : String.fromCodePoint(Number(n))))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => (name.toLowerCase() in ENTITIES ? ENTITIES[name.toLowerCase()] : m));
}

/** The words of a markup fragment: <br> and block ends become line breaks, tags go, entities decode, whitespace collapses. */
export function textOf(html) {
  return decodeEntities(
    String(html || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|li|tr|td)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

/** "november 2026", "11-november-2026-calendar", "october-2026-letter" → { month: 11, year: 2026, label: 'November 2026' }. */
export function monthFrom(text) {
  const m = MONTH_RE.exec(String(text || ''));
  if (!m) return null;
  const name = m[1].toLowerCase();
  const month = MONTHS.indexOf(name) + 1;
  return { month, year: Number(m[2]), label: `${name[0].toUpperCase()}${name.slice(1)} ${m[2]}` };
}

/** The app-side address of a picture the site publishes (the relay fetches it; the app only talks to poetech.us). */
export function assetSrc(path) {
  return `${RELAY}?asset=${encodeURIComponent(String(path || ''))}`;
}

/** A flyer's own words from its file name: "battle-cry-sunday-veterans-flyer-3.jpg" → "Battle Cry Sunday Veterans". */
export function flyerName(path) {
  const base = String(path || '')
    .split('/')
    .pop()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/_orig$/i, '');
  const words = base.split(/[-_]+/).filter((w) => w && !/^(flyer|img|image|photo|\d{1,3})$/i.test(w));
  return words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/**
 * One relay answer → what the page says: its headings, its paragraphs and
 * the pictures in its content, plus every upload picture the page names
 * (the relay reads those from the whole page, slideshow scripts included).
 */
export function parseChurchPage(json) {
  const html = json && typeof json.html === 'string' ? json.html : '';
  const headings = [...html.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)].map((m) => textOf(m[1])).filter(Boolean);
  const paragraphs = [...html.matchAll(/<div class="paragraph"[^>]*>([\s\S]*?)<\/div>/gi)].map((m) => textOf(m[1])).filter(Boolean);
  const pictures = [...html.matchAll(/<img[^>]+src="(\/uploads\/[^"]+)"[^>]*>/gi)]
    .map((m) => {
      const path = m[1].replace(/\?.*$/, '');
      const alt = /alt="([^"]*)"/i.exec(m[0]);
      return { path, alt: alt && alt[1] !== 'Picture' ? decodeEntities(alt[1]) : '' };
    })
    .filter((p) => !/\/published\/icons8|\/editor\/|na-logo/i.test(p.path));
  return {
    page: (json && json.page) || '',
    url: (json && json.url) || '',
    fetchedAt: (json && json.fetchedAt) || '',
    headings,
    paragraphs,
    pictures,
    images: Array.isArray(json && json.images) ? json.images.filter((s) => typeof s === 'string') : [],
  };
}

/** The pages as the surfaces read them. Every part is null when its page did not read; nothing is invented. */
export function digestChurchSite({ calendar = null, letters = null, events = null, home = null } = {}) {
  const out = { calendar: null, letter: null, events: null, serviceTimes: [], fetchedAt: '' };
  const stamp = (p) => {
    if (p && p.fetchedAt && (!out.fetchedAt || p.fetchedAt > out.fetchedAt)) out.fetchedAt = p.fetchedAt;
  };
  if (calendar) {
    const pic = calendar.pictures.find((p) => /calendar/i.test(p.path)) || calendar.pictures[0] || null;
    const path = pic ? pic.path : calendar.images.find((s) => /calendar/i.test(s)) || null;
    const when = monthFrom(calendar.headings.find((h) => monthFrom(h)) || '') || monthFrom(path || '');
    if (path) out.calendar = { label: when ? when.label : 'This month', month: when, path, src: assetSrc(path), sourceUrl: calendar.url };
    stamp(calendar);
  }
  if (letters) {
    const pic = letters.pictures.find((p) => /letter/i.test(p.path)) || letters.pictures[0] || null;
    const path = pic ? pic.path : letters.images.find((s) => /letter/i.test(s)) || null;
    const when = monthFrom(path || '') || monthFrom(letters.headings.find((h) => monthFrom(h)) || '');
    if (path) out.letter = { label: when ? `${when.label} letter` : 'The latest letter', month: when, path, src: assetSrc(path), sourceUrl: letters.url };
    stamp(letters);
  }
  if (events) {
    const seen = new Set();
    const flyers = [...events.pictures.map((p) => p.path), ...events.images]
      .filter((path) => {
        if (seen.has(path)) return false;
        seen.add(path);
        return true;
      })
      .map((path) => ({ path, src: assetSrc(path), name: flyerName(path) }));
    const intro = events.paragraphs.join('\n');
    if (flyers.length || intro) out.events = { intro, flyers, sourceUrl: events.url };
    stamp(events);
  }
  if (home) {
    out.serviceTimes = home.paragraphs
      .join('\n')
      .split('\n')
      .filter((l) => /\d{1,2}:\d{2}\s*(am|pm)/i.test(l) && /:/.test(l));
    stamp(home);
  }
  return out;
}

/** True when the digest has anything a surface can show. */
export function digestHasNews(d) {
  return Boolean(d && (d.calendar || d.letter || (d.events && (d.events.flyers.length || d.events.intro))));
}

async function readPage(page, fetchImpl, timeoutMs, base) {
  try {
    const res = await fetchImpl(`${base}?page=${page}`, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res || !res.ok) return null;
    return parseChurchPage(await res.json());
  } catch {
    return null;
  }
}

/** Reads the four pages through the relay in parallel; a page that fails is null in the digest. Never throws. */
export async function loadChurchSite({ fetchImpl = globalThis.fetch, timeoutMs = LOAD_TIMEOUT_MS, base = RELAY } = {}) {
  if (typeof fetchImpl !== 'function') return digestChurchSite();
  const [calendar, letters, events, home] = await Promise.all(
    ['calendar', 'letters-from-bg', 'current-events', 'home'].map((p) => readPage(p, fetchImpl, timeoutMs, base))
  );
  return digestChurchSite({ calendar, letters, events, home });
}
