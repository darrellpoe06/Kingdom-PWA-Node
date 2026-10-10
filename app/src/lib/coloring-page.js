// =============================================================================
// coloring-page — the same lesson, for a child too young to read it
// =============================================================================
// Darrell, 2026-10-10: "We wanted children stories... like below 6 - 10 years
// old so they can also have lessons..." and then: "Coloring books with words
// inside... that reflect the same lesson..."
//
// WHY THIS IS A REAL GAP AND NOT A NICE-TO-HAVE (measured, DR-0076 §4). The
// "child" band on the 236 Living Lessons is not written for a six-year-old:
// its ceiling is grade 5.0 (NEW_LESSON_CHILD_CEILING) and the bands measured
// 2026-10-10 sit at 3.65 to 5.3 — a nine-to-eleven-year-old reader. The
// littlest have exactly six lessons of their own (Little Learners, DR-0431,
// Flesch-Kincaid ≤ 1.0), not 236. So a child under about nine meets almost the
// whole catalog as a wall of words.
//
// A coloring page answers that without pretending the child can read: the
// lesson's own verse and its own words arrive as big outlines to colour and
// trace, so the Word goes in through the hand and the eye while a grown-up
// reads it aloud — "thou shalt teach them diligently unto thy children"
// (Deuteronomy 6:7), which is the same rhythm the Talk About It prompts ride.
//
// WHAT THIS DOES NOT CLAIM. It is not bespoke illustration; nobody drew 236
// pictures. It is honest symbol work: a small fixed library of plain shapes,
// chosen by the words the lesson itself uses, plus the real verse and real
// words in outline. Everything is DERIVED from the lesson — nothing about a
// lesson is retyped here, so a lesson edited upstream changes its page too
// (DR-0121).
//
// THE VERSE IS NEVER RETYPED, EVER. The span is lifted verbatim out of the
// lesson's own child band — text that already passed course-quotation-integrity
// — by matching the quotation marks it is already written inside. Nothing in
// this file composes, trims or paraphrases Scripture (DR-0459, Layer 0).
//
// Pure and injectable: no DOM, no fetch. The SVG is a string, so the page
// prints, downloads, and unit-tests without a browser.
// =============================================================================

/** `"quoted span" (Reference)` — the shape every band already writes verses in. */
const QUOTED = /"([^"]{8,400})"\s*\(([^)]{3,60})\)/g;

/**
 * Every verse a band quotes, verbatim, with its reference. Order is the order
 * the lesson teaches them in.
 */
export function quotedVerses(text) {
  const out = [];
  for (const m of String(text || '').matchAll(QUOTED)) {
    const words = m[1].trim();
    const ref = m[2].trim();
    if (!words || !ref) continue;
    out.push({ words, ref });
  }
  return out;
}

/** Words a small hand can trace: short, plain, and really in the lesson. */
const STOP = new Set([
  'the', 'and', 'that', 'this', 'with', 'from', 'they', 'them', 'then', 'than', 'what', 'when',
  'your', 'you', 'his', 'her', 'him', 'she', 'he', 'it', 'is', 'was', 'are', 'were', 'be', 'been',
  'but', 'for', 'not', 'all', 'one', 'two', 'can', 'did', 'does', 'had', 'has', 'have', 'how',
  'who', 'why', 'will', 'would', 'into', 'out', 'off', 'about', 'there', 'their', 'our', 'ours',
  'said', 'says', 'say', 'like', 'just', 'some', 'any', 'each', 'every', 'more', 'most', 'much',
]);

/**
 * A child traces these, so they are printed EXACTLY as the lesson writes them.
 *
 * The first cut lowercased everything to dedupe, and the sheet for L14 came
 * back asking a child to trace "jesus". That is a Layer 0 violation —
 * Yahweh, Jesus, the Holy Ghost, the Father, the Son and His pronouns are
 * always capitalised, in every artifact — and a coloring page a child copies
 * by hand is the last place to teach the lowercase form. The word is matched
 * case-insensitively and kept in the lesson's own casing.
 */
export function traceableWords(text, limit = 5) {
  const seen = new Set();
  const out = [];
  for (const raw of String(text || '').match(/[A-Za-z]+/g) || []) {
    const key = raw.toLowerCase();
    if (raw.length < 3 || raw.length > 6 || STOP.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(raw);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * The symbol library — plain shapes a child can colour, each keyed to words a
 * lesson might use. Paths are deliberately simple: thick outlines, big areas,
 * nothing a crayon cannot stay inside.
 */
export const SYMBOLS = [
  { id: 'lamb', words: ['lamb', 'sheep', 'shepherd', 'flock'], d: 'M20 60 a18 14 0 1 1 36 0 a18 14 0 1 1 -36 0 M52 48 a9 9 0 1 1 14 6 M62 56 l6 -6 M30 74 l0 10 M46 74 l0 10' },
  { id: 'crown', words: ['king', 'crown', 'reign', 'throne', 'kingdom'], d: 'M14 70 L22 32 L36 54 L50 28 L64 54 L78 32 L86 70 Z M14 70 L86 70' },
  { id: 'bread', words: ['bread', 'loaf', 'loaves', 'feed', 'food', 'eat'], d: 'M18 64 a32 22 0 0 1 64 0 Z M18 64 l0 10 a32 10 0 0 0 64 0 l0 -10 M38 48 l0 12 M58 48 l0 12' },
  { id: 'water', words: ['water', 'well', 'river', 'sea', 'thirst', 'drink'], d: 'M12 50 q12 -12 24 0 q12 12 24 0 q12 -12 24 0 M12 68 q12 -12 24 0 q12 12 24 0 q12 -12 24 0' },
  { id: 'lamp', words: ['lamp', 'light', 'shine', 'candle', 'dark'], d: 'M40 76 l20 0 l-4 -18 l-12 0 Z M50 58 l0 -10 M50 48 a6 8 0 1 1 0.1 0 M50 30 l0 -8 M36 36 l-6 -5 M64 36 l6 -5' },
  { id: 'tree', words: ['tree', 'fruit', 'root', 'branch', 'vine', 'seed', 'grow'], d: 'M44 82 l12 0 l0 -22 l-12 0 Z M50 60 a22 20 0 1 1 0.1 0 M50 60 l0 -22 M50 46 l-10 -8 M50 50 l10 -8' },
  { id: 'house', words: ['house', 'home', 'build', 'door', 'family', 'temple'], d: 'M16 54 L50 26 L84 54 M24 54 l0 32 l52 0 l0 -32 M42 86 l0 -20 l16 0 l0 20' },
  { id: 'heart', words: ['heart', 'love', 'kind', 'mercy', 'care'], d: 'M50 84 C18 62 20 34 36 32 C44 31 50 38 50 44 C50 38 56 31 64 32 C80 34 82 62 50 84 Z' },
  { id: 'star', words: ['star', 'night', 'sky', 'heaven', 'glory'], d: 'M50 20 L59 44 L84 44 L64 58 L72 82 L50 68 L28 82 L36 58 L16 44 L41 44 Z' },
  { id: 'fish', words: ['fish', 'fishes', 'net', 'boat', 'catch'], d: 'M14 56 C30 34 62 34 76 56 C62 78 30 78 14 56 Z M76 56 l12 -12 l0 24 Z M30 50 a3 3 0 1 1 0.1 0' },
  { id: 'hand', words: ['hand', 'give', 'help', 'hold', 'work'], d: 'M34 84 l0 -28 a5 5 0 0 1 10 0 l0 -16 a5 5 0 0 1 10 0 l0 14 a5 5 0 0 1 10 0 l0 8 a5 5 0 0 1 10 0 l0 22 Z' },
  { id: 'book', words: ['book', 'word', 'read', 'scroll', 'bible', 'write'], d: 'M14 28 l32 6 l0 46 l-32 -6 Z M86 28 l-32 6 l0 46 l32 -6 Z M50 34 l0 46' },
  { id: 'sun', words: ['sun', 'day', 'morning', 'bright', 'warm'], d: 'M50 50 m-18 0 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0 M50 18 l0 -10 M50 92 l0 -10 M18 50 l-10 0 M92 50 l10 0 M27 27 l-7 -7 M73 27 l7 -7 M27 73 l-7 7 M73 73 l7 7' },
  { id: 'bird', words: ['bird', 'wing', 'fly', 'sparrow', 'eagle', 'dove'], d: 'M12 58 q20 -26 38 -4 q18 -22 38 4 M50 54 l0 14 M44 68 l12 0' },
  { id: 'door', words: ['door', 'gate', 'enter', 'open', 'way', 'path'], d: 'M26 86 l0 -56 a24 24 0 0 1 48 0 l0 56 Z M64 58 a3 3 0 1 1 0.1 0' },
  { id: 'cross', words: ['cross', 'jesus', 'saviour', 'blood', 'christ'], d: 'M42 90 l16 0 l0 -52 l20 0 l0 -14 l-20 0 l0 -14 l-16 0 l0 14 l-20 0 l0 14 l20 0 Z' },
];

/** The symbols this lesson's own words call for, most-mentioned first. */
export function symbolsFor(text, limit = 4) {
  const hay = ` ${String(text || '').toLowerCase().replace(/[^a-z]+/g, ' ')} `;
  const scored = SYMBOLS
    .map((s) => ({ s, n: s.words.reduce((t, w) => t + (hay.split(` ${w} `).length - 1) + (hay.split(` ${w}s `).length - 1), 0) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n || SYMBOLS.indexOf(a.s) - SYMBOLS.indexOf(b.s));
  const out = scored.slice(0, limit).map((x) => x.s);
  // A lesson whose words match nothing still gets a page: the book and the
  // heart are true of every lesson in this catalog.
  if (!out.length) return SYMBOLS.filter((s) => s.id === 'book' || s.id === 'heart');
  return out;
}

/**
 * The page, derived from the lesson. `{ title, ref, verse, words, symbols }`,
 * or null when the lesson carries nothing to build one from.
 *
 * The verse is the SHORTEST quoted span in the child band that is still a real
 * sentence — shortest because a small hand has to trace it, and from the child
 * band because that is the simplest wording the lesson already approved.
 */
export function coloringPage(module) {
  if (!module || typeof module !== 'object') return null;
  const child = (module.levels && module.levels.child) || '';
  const source = child || module.lesson || '';
  const verses = quotedVerses(source);
  const pick = verses
    .filter((v) => v.words.split(/\s+/).length >= 3)
    .sort((a, b) => a.words.length - b.words.length)[0] || verses[0] || null;
  const title = String(module.title || '').trim();
  if (!title) return null;
  return {
    lessonId: module.id || '',
    title,
    ref: pick ? pick.ref : '',
    verse: pick ? pick.words : '',
    words: traceableWords(source),
    symbols: symbolsFor(`${title} ${source}`),
  };
}

const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Break a verse into lines a child can follow, without splitting a word. */
export function verseLines(verse, perLine = 5) {
  const w = String(verse || '').trim().split(/\s+/).filter(Boolean);
  const out = [];
  for (let i = 0; i < w.length; i += perLine) out.push(w.slice(i, i + perLine).join(' '));
  return out;
}

/**
 * The page as a printable SVG string — outlines only, nothing filled, so every
 * stroke is something to colour. US Letter at 96dpi.
 */
export function coloringSvg(page) {
  if (!page) return '';
  const lines = verseLines(page.verse);
  const sym = page.symbols.map((s, i) => {
    const x = 70 + (i % 2) * 330;
    const y = 430 + Math.floor(i / 2) * 170;
    return `<g transform="translate(${x},${y}) scale(1.5)" fill="none" stroke="#000" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"><path d="${s.d}"/></g>`;
  }).join('');
  const verse = lines.map((l, i) => `<text x="396" y="${196 + i * 46}" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="none" stroke="#000" stroke-width="1">${esc(l)}</text>`).join('');
  const trace = page.words.map((w, i) => `<text x="70" y="${930 + i * 0}" font-family="Georgia, serif" font-size="30" fill="none" stroke="#000" stroke-width="1" transform="translate(${(i % 5) * 130},0)">${esc(w)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="792" height="1024" viewBox="0 0 792 1024" role="img" aria-label="${esc(page.title)} — a coloring page">`
    + '<rect x="0" y="0" width="792" height="1024" fill="#fff"/>'
    + `<text x="396" y="90" text-anchor="middle" font-family="Georgia, serif" font-size="44" fill="none" stroke="#000" stroke-width="1.5">${esc(page.title)}</text>`
    + `<text x="396" y="134" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#000">${esc(page.ref)}</text>`
    + verse + sym
    + '<text x="70" y="900" font-family="Georgia, serif" font-size="20" fill="#000">Trace the words:</text>'
    + trace
    + '<text x="396" y="990" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="#000">Colour it in while a grown-up reads the lesson to you.</text>'
    + '</svg>';
}
