// =============================================================================
// lesson-share — what a shared lesson SAYS, and the token that lets us know
// whether the link worked
// =============================================================================
// Darrell 2026-09-30: "the shares should be a link with a short clarification
// of how to read the lessons like push play button to hear etc at the end and
// a note with title and a short summary of the lesson... not the full lesson...
// they can download it from the app however they would need an account no
// account needed for just reading it... also keep record of who does what send
// links etc... so we know they work and don't."
//
// What a lesson share sent before this (DR-0698 "What was measured"):
// lessonSharePayload (lib/lesson-links.js) handed the share sheet the title,
// the lesson's WHOLE bigIdea (some run past 600 characters) and the course
// line, with the link in a separate `url` field. The receiving app decided
// where the link landed (usually after the text), nothing told the reader how
// to use the page, and nothing recorded that a share happened or that the link
// opened.
//
// THE MESSAGE, IN ORDER (the order is the point, so the text carries the link
// itself rather than leaving placement to the receiving app):
//   1. the lesson's title (and, on a second line, the course it belongs to);
//   2. a short summary: one or two sentences of the lesson's own big idea,
//      cut at a sentence boundary, never the lesson body;
//   3. the link, carrying a share token (`s=`);
//   4. LAST, the how-to: open it with no account, press Play to hear it, and
//      downloading needs a free account.
//
// PURE. No window, no DOM, no network: the message is built and asserted in a
// plain test. Recording lives in lesson-share-record.js.
// =============================================================================

/** The query parameter a share token rides in. One letter: it is in a text message. */
export const SHARE_TOKEN_PARAM = 's';

/** A share token is 8 to 32 URL-safe characters (the database checks the same shape). */
export const SHARE_TOKEN_RE = /^[A-Za-z0-9_-]{8,32}$/;

export function isShareToken(t) {
  return typeof t === 'string' && SHARE_TOKEN_RE.test(t);
}

const TOKEN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * A fresh 12-character token. Made on the device, before the share sheet
 * opens, because the sheet has to open inside the tap: waiting on the network
 * first would lose the tap on iOS. `rand(n)` is injectable for tests.
 */
export function newShareToken(rand = null) {
  let bytes;
  if (typeof rand === 'function') bytes = rand(12);
  else if (typeof crypto !== 'undefined' && crypto && typeof crypto.getRandomValues === 'function') {
    bytes = crypto.getRandomValues(new Uint8Array(12));
  } else {
    bytes = Array.from({ length: 12 }, () => Math.floor(Math.random() * 256));
  }
  let out = '';
  for (let i = 0; i < 12; i += 1) out += TOKEN_ALPHABET[(bytes[i] || 0) % TOKEN_ALPHABET.length];
  return out;
}

/** Put the token on a link (replacing any token already there). */
export function withShareToken(url, token) {
  const u = String(url || '');
  if (!u || !isShareToken(token)) return u;
  const hashAt = u.indexOf('#');
  const base = hashAt >= 0 ? u.slice(0, hashAt) : u;
  const hash = hashAt >= 0 ? u.slice(hashAt) : '';
  const [path, query = ''] = base.split('?');
  const kept = query.split('&').filter((p) => p && !p.startsWith(`${SHARE_TOKEN_PARAM}=`));
  kept.push(`${SHARE_TOKEN_PARAM}=${token}`);
  return `${path}?${kept.join('&')}${hash}`;
}

/** Read a share token back out of a query string; '' when there is none or it is malformed. */
export function readShareToken(search) {
  try {
    const t = (new URLSearchParams(search || '').get(SHARE_TOKEN_PARAM) || '').trim();
    return isShareToken(t) ? t : '';
  } catch (_) { return ''; }
}

// --- the summary --------------------------------------------------------------

/** Plain text from the authored markup the lessons use (bold, italics, headings, links). */
export function plainText(s) {
  return String(s == null ? '' : s)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, '$1$2')
    .replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,;:!?]|$)/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();
}

// Words that end in a full stop without ending a sentence.
const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'st', 'sr', 'jr', 'vs', 'etc', 'e.g', 'i.e', 'no', 'vol', 'ch', 'v', 'vv',
  'gen', 'ex', 'lev', 'num', 'deut', 'josh', 'judg', 'sam', 'kgs', 'chr', 'neh', 'esth', 'ps', 'prov',
  'eccl', 'isa', 'jer', 'lam', 'ezek', 'dan', 'hos', 'obad', 'mic', 'nah', 'hab', 'zeph', 'hag', 'zech',
  'mal', 'matt', 'mt', 'mk', 'lk', 'jn', 'rom', 'cor', 'gal', 'eph', 'phil', 'col', 'thess', 'tim',
  'tit', 'philem', 'heb', 'jas', 'pet', 'rev',
]);

/**
 * Split text into sentences. A stop ends a sentence only when the next word
 * starts a new one (a capital, a digit or an opening quote), and never after
 * an initialism ("A.I.", "U.S.") or a known abbreviation ("Dr.", "1 Cor.").
 */
export function sentences(text) {
  const s = plainText(text);
  if (!s) return [];
  const out = [];
  let start = 0;
  const re = /[.!?]+["”’)\]]*(?=\s+["“‘(]?[A-Z0-9])/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    const end = m.index + m[0].length;
    const before = s.slice(start, m.index + 1);
    const lastWord = (before.match(/(\S+)$/) || ['', ''])[1];
    const bare = lastWord.replace(/^["“‘(]+/, '').replace(/[.!?]+$/, '').toLowerCase();
    // "A.I." / "U.S." (letters joined by stops) or a lone initial ("John F.").
    const initialism = /^([a-z]\.)+[a-z]$/i.test(bare) || /^[a-z]$/i.test(bare);
    if (m[0][0] === '.' && (ABBREVIATIONS.has(bare) || initialism)) continue;
    out.push(s.slice(start, end).trim());
    start = end;
  }
  const rest = s.slice(start).trim();
  if (rest) out.push(rest);
  return out;
}

export const SUMMARY_MAX_CHARS = 300;

/**
 * One or two sentences of the lesson's own words, never the body. The source
 * is the lesson's big idea (what every lesson states first), else its "in the
 * app" step, else the opening of the lesson. Two sentences when they fit in
 * SUMMARY_MAX_CHARS, else one; a first sentence longer than that is cut at a
 * word boundary and marked with an ellipsis rather than sent whole.
 */
export function lessonSummary(module, { maxChars = SUMMARY_MAX_CHARS } = {}) {
  const m = module || {};
  const source = [m.bigIdea, m.summary, m.inApp, m.lesson].find((x) => plainText(x));
  const list = sentences(source || '');
  if (!list.length) return '';
  const first = list[0];
  if (first.length > maxChars) {
    const cut = first.slice(0, maxChars - 1);
    const at = cut.lastIndexOf(' ');
    return `${(at > 40 ? cut.slice(0, at) : cut).replace(/[\s,;:—–-]+$/, '')}…`;
  }
  const two = list.length > 1 ? `${first} ${list[1]}` : first;
  return two.length <= maxChars ? two : first;
}

// --- the how-to -----------------------------------------------------------------

/**
 * The how-to the message ends with. Each door says only what is true on it:
 * the Love Corner's reader has ▶ Play for a signed-out visitor and a download
 * behind an account; TLC's visitor page has neither (read aloud is off for
 * guests there, and there is no lesson download), so it promises neither.
 */
export const SHARE_HOW_TO = Object.freeze({
  church: 'How to read it: open the link, no account needed. Press ▶ Play to hear it read aloud. Downloading the lesson needs a free account in the app.',
  tlc: 'How to read it: open the link, no account needed. It opens on the lesson, free to read.',
});

const clean = (s) => String(s == null ? '' : s).trim();

/**
 * The whole message, in the order Darrell asked for: title, the course, a short
 * summary, the link, and the how-to LAST.
 */
export function lessonShareMessage({ title = '', from = '', summary = '', url = '', howTo = SHARE_HOW_TO.church } = {}) {
  const out = [clean(title)];
  if (clean(from)) out.push(clean(from));
  if (clean(summary)) out.push('', clean(summary));
  if (clean(url)) out.push('', clean(url));
  if (clean(howTo)) out.push('', clean(howTo));
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
