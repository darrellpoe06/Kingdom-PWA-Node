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
// lesson's own verse and its own words arrive as big outlines to color and
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
 * The picture library — line-art pieces a child can color, each keyed to the
 * words a lesson might use and each drawn inside a 100×100 box with several
 * closed regions, so a crayon has rooms to fill, not one outline to admire.
 *
 * `place` tells the scene where a piece belongs: in the `sky` (stars, the sun,
 * a dove) or on the `ground` (a lamb, a tree, a house, the cross on its hill,
 * an open Bible on the grass). The scene draws hills, a sun and clouds around
 * them so the page is a picture, not a row of icons (Darrell, 2026-11-13: "We
 * can do way better than this"). No faces are drawn on anything: the two
 * guides' line-art for coloring is a render of the approved reference (the
 * artwork brief), never a drawing here.
 */
export const SYMBOLS = [
  { id: 'lamb', place: 'ground', words: ['lamb', 'sheep', 'shepherd', 'flock'], d: 'M20 62 c-6 -10 4 -20 12 -16 c2 -10 16 -12 20 -4 c8 -8 22 -2 20 8 c10 2 10 16 2 20 c2 10 -12 14 -18 8 c-6 8 -22 6 -24 -2 c-10 2 -16 -8 -12 -14 Z M66 48 a12 12 0 1 0 0.1 0 M59 42 q-7 -3 -5 -9 q5 1 7 6 M73 42 q7 -3 5 -9 q-5 1 -7 6 M69 46 a1.5 1.5 0 1 0 0.1 0 M30 78 l0 14 M42 78 l0 14 M54 78 l0 14 M64 76 l0 14 M20 58 q-8 -4 -6 -12' },
  { id: 'crown', place: 'ground', words: ['king', 'crown', 'reign', 'throne', 'kingdom'], d: 'M14 72 L20 34 L36 54 L50 24 L64 54 L80 34 L86 72 Z M14 72 L86 72 M14 84 L86 84 M14 72 L14 84 M86 72 L86 84 M50 62 a6 6 0 1 0 0.1 0 M30 64 a5 5 0 1 0 0.1 0 M70 64 a5 5 0 1 0 0.1 0 M50 24 a5.5 5.5 0 1 0 0.1 0 M20 34 a5.5 5.5 0 1 0 0.1 0 M80 34 a5.5 5.5 0 1 0 0.1 0 M26 78 l48 0' },
  { id: 'bread', place: 'ground', words: ['bread', 'loaf', 'loaves', 'feed', 'food', 'eat'], d: 'M18 62 l8 28 l48 0 l8 -28 Z M18 62 l64 0 M26 70 l48 0 M30 80 l40 0 M24 60 a14 10 0 0 1 28 0 M48 60 a14 10 0 0 1 28 0 M36 50 a14 10 0 0 1 28 0 M30 62 a20 24 0 0 1 40 0' },
  { id: 'water', place: 'ground', words: ['water', 'well', 'river', 'sea', 'thirst', 'drink'], d: 'M6 54 q12 -10 24 0 t24 0 t24 0 t24 0 M6 70 q12 -10 24 0 t24 0 t24 0 t24 0 M6 86 q12 -10 24 0 t24 0 t24 0 t24 0 M30 48 l40 0 l-8 12 l-24 0 Z M50 48 l0 -22 M50 26 l18 10 l-18 4 Z' },
  { id: 'lamp', place: 'ground', words: ['lamp', 'light', 'shine', 'candle', 'dark'], d: 'M30 78 l40 0 l0 12 l-40 0 Z M24 64 a26 14 0 0 0 52 0 Z M50 64 l0 -8 M50 56 c-10 -8 -4 -22 0 -26 c4 4 10 18 0 26 Z M44 44 c-2 -4 2 -8 6 -10 M20 48 l-8 -4 M80 48 l8 -4 M50 24 l0 -6 M38 30 l-4 -4 M62 30 l4 -4' },
  { id: 'tree', place: 'ground', words: ['tree', 'fruit', 'root', 'branch', 'vine', 'seed', 'grow'], d: 'M44 92 l12 0 l0 -28 l-12 0 Z M50 64 c-16 0 -28 -8 -26 -22 c-8 -6 -2 -22 10 -20 c0 -12 18 -16 24 -6 c10 -8 26 0 22 12 c10 4 8 22 -6 22 c0 10 -14 16 -24 14 Z M36 36 a3 3 0 1 0 0.1 0 M58 30 a3 3 0 1 0 0.1 0 M62 50 a3 3 0 1 0 0.1 0 M40 54 a3 3 0 1 0 0.1 0 M44 92 l-8 4 M56 92 l8 4' },
  { id: 'house', place: 'ground', words: ['house', 'home', 'build', 'door', 'family', 'temple'], d: 'M14 54 L50 22 L86 54 M22 50 l0 40 l56 0 l0 -40 M42 90 l0 -22 l16 0 l0 22 M28 60 l12 0 l0 12 l-12 0 Z M60 60 l12 0 l0 12 l-12 0 Z M66 36 l0 -10 l8 0 l0 17 M34 66 l0 -6 M28 66 l12 0 M66 66 l0 -6 M60 66 l12 0 M54 80 a2 2 0 1 0 0.1 0' },
  { id: 'heart', place: 'ground', words: ['heart', 'love', 'kind', 'mercy', 'care'], d: 'M50 86 C16 62 20 32 36 30 C44 29 50 36 50 42 C50 36 56 29 64 30 C80 32 84 62 50 86 Z M50 74 C30 60 32 44 40 42 C45 41 50 46 50 50 C50 46 55 41 60 42 C68 44 70 60 50 74 Z M50 18 l0 -8 M30 24 l-6 -6 M70 24 l6 -6' },
  { id: 'star', place: 'sky', words: ['star', 'night', 'sky', 'heaven', 'glory'], d: 'M50 14 L59 40 L86 40 L64 56 L72 82 L50 66 L28 82 L36 56 L14 40 L41 40 Z M50 34 l4 10 l10 0 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 l10 0 Z M14 18 l3 6 l6 0 l-5 4 l2 6 l-6 -4 l-6 4 l2 -6 l-5 -4 l6 0 Z M84 86 l2 5 l5 0 l-4 3 l2 5 l-5 -3 l-5 3 l2 -5 l-4 -3 l5 0 Z' },
  { id: 'fish', place: 'ground', words: ['fish', 'fishes', 'net', 'boat', 'catch'], d: 'M10 46 C26 24 58 24 72 46 C58 68 26 68 10 46 Z M72 46 l14 -12 l0 24 Z M26 40 a3 3 0 1 1 0.1 0 M36 36 q10 18 0 22 M48 34 q10 22 0 26 M40 72 C52 60 70 60 80 72 C70 84 52 84 40 72 Z M80 72 l10 -8 l0 16 Z M50 68 a2 2 0 1 1 0.1 0 M14 20 a3 3 0 1 0 0.1 0 M22 12 a2 2 0 1 0 0.1 0' },
  // An OPEN palm — four fingers of near-even height under a gentle arch.
  //
  // The first path drew a fist with one finger standing far above the rest.
  // Rendered, it read unmistakably as an obscene gesture, and it was on 122 of
  // the 236 children's sheets, because 'give', 'help', 'hold' and 'work' are
  // ordinary words. Nobody had looked at it. Every finger is now present and
  // within ten units of its neighbours, so the shape cannot read that way.
  { id: 'hand', place: 'ground', words: ['hand', 'give', 'help', 'hold', 'work'], d: 'M26 78 l0 -22 a8 8 0 0 1 8 -8 l38 0 a8 8 0 0 1 8 8 l0 22 a10 10 0 0 1 -10 10 l-34 0 a10 10 0 0 1 -10 -10 Z M30 50 l0 -20 a5 5 0 0 1 10 0 l0 20 M42 50 l0 -24 a5 5 0 0 1 10 0 l0 24 M54 50 l0 -26 a5 5 0 0 1 10 0 l0 26 M66 50 l0 -16 a5 5 0 0 1 10 0 l0 16 M26 62 l-9 5 a6 6 0 0 0 7 10 l5 -3' },
  { id: 'book', place: 'ground', words: ['book', 'word', 'read', 'scroll', 'bible', 'write'], d: 'M12 30 C26 24 40 26 50 34 L50 82 C40 74 26 72 12 78 Z M88 30 C74 24 60 26 50 34 L50 82 C60 74 74 72 88 78 Z M20 40 c10 -2 18 0 24 4 M20 50 c10 -2 18 0 24 4 M20 60 c10 -2 18 0 24 4 M56 44 c6 -4 14 -6 24 -4 M56 54 c6 -4 14 -6 24 -4 M56 64 c6 -4 14 -6 24 -4 M64 82 l0 12 l6 -4 l6 4 l0 -12' },
  { id: 'sun', place: 'sky', words: ['sun', 'day', 'morning', 'bright', 'warm'], d: 'M50 50 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0 M50 22 l0 -12 M50 90 l0 -12 M22 50 l-12 0 M90 50 l-12 0 M30 30 l-8 -8 M78 30 l8 -8 M30 70 l-8 8 M78 70 l8 8' },
  { id: 'bird', place: 'sky', words: ['bird', 'wing', 'fly', 'sparrow', 'eagle', 'dove'], d: 'M26 60 a22 16 0 1 0 44 0 a22 16 0 1 0 -44 0 Z M64 42 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 Z M86 42 l10 4 l-10 4 Z M78 38 a2 2 0 1 1 0.1 0 M36 56 c6 -18 26 -22 34 -8 c-10 10 -24 12 -34 8 Z M26 60 l-18 -10 l4 18 Z M44 76 l0 10 M56 76 l0 10 M50 62 q-10 2 -16 -2' },
  { id: 'door', place: 'ground', words: ['door', 'gate', 'enter', 'open', 'way', 'path'], d: 'M24 90 l0 -58 a26 26 0 0 1 52 0 l0 58 Z M50 32 l0 58 M60 62 a3 3 0 1 1 0.1 0 M40 62 a3 3 0 1 1 0.1 0 M14 90 l72 0 M18 96 l64 0 M30 46 a20 20 0 0 1 40 0' },
  { id: 'cross', place: 'ground', words: ['cross', 'jesus', 'saviour', 'blood', 'christ'], d: 'M42 84 l16 0 l0 -44 l18 0 l0 -14 l-18 0 l0 -14 l-16 0 l0 14 l-18 0 l0 14 l18 0 Z M6 96 Q50 70 94 96 M30 20 l-6 -8 M70 20 l6 -8 M22 34 l-10 -4 M78 34 l10 -4 M50 8 l0 -6' },
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

// =============================================================================
// THE SHEET HAS TO FIT ON THE PAPER (added 2026-10-10, same day, measured)
// =============================================================================
// The first cut of this file set the title on ONE line at font-size 44 and the
// verse at five words a line at 34. Measured across all 236 Living Lessons
// afterwards: 224 of 236 titles ran off the page, and three verse lines did
// too. The median Living Lesson title is 81 characters — about 1,850px at
// font-size 44 on a sheet 792px wide. So the library shipped a sheet that was
// unprintable for 95% of the catalog.
//
// I had generated two real sheets and read them, which caught the lowercase
// "jesus", and never once measured the WIDTH. That is the form-factor
// dimension of DR-0239, skipped. Writing it down because the lesson is the
// general one: reading a sample proves the content, never the geometry.
//
// So nothing is assumed to be one line any more. Text is WRAPPED, the size is
// chosen as the largest on a ladder that fits, and the layout FLOWS downward
// from however tall the title turned out to be.
// =============================================================================

/**
 * Glyph advance as a fraction of font size. Georgia's lowercase prose averages
 * near 0.50em and the rounded bold the title wears now near 0.56em; this is
 * set HIGHER than both so the estimate can only ever over-state a line's
 * width, never under-state it. A sheet that wraps one word early is fine; a
 * sheet that runs off the paper is not.
 *
 * It is an estimate, not a browser measurement — this file is pure and has no
 * renderer. The sheets were measured once for real with Chromium getBBox (see
 * the record), and the standing CI gate measures this model across all 236.
 */
export const EM = 0.58;

/** The paper, and the ink area inside it. US Letter at 96dpi. */
export const SHEET = { width: 792, height: 1024, margin: 70 };
export const USABLE = SHEET.width - 2 * SHEET.margin;

/** The faces the sheet is set in: a rounded bold for the title and the words, Georgia for the verse. */
export const TITLE_FONT = "'Arial Rounded MT Bold', 'Nunito', 'Arial Black', Arial, sans-serif";
export const VERSE_FONT = 'Georgia, serif';

/** The estimated rendered width of a line, in user units. */
export function lineWidth(text, size) {
  return String(text || '').length * size * EM;
}

/** Wrap on word boundaries to a character budget, never splitting a word. */
function wrapTo(words, perLine) {
  const out = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (line && next.length > perLine) { out.push(line); line = w; } else line = next;
  }
  if (line) out.push(line);
  return out;
}

/**
 * Fit text into `maxLines` lines no wider than `width`, at the LARGEST size on
 * the ladder that manages it. Returns `{ size, lines }`.
 *
 * Nothing is ever dropped or shortened — a 164-character lesson title arrives
 * whole, just smaller. The last size on the ladder is used even if it still
 * needs more lines than asked for, because a tall sheet beats a truncated one.
 */
export function fitLines(text, { width = USABLE, maxLines = 4, sizes = [44, 38, 32, 28, 24, 20] } = {}) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return { size: sizes[sizes.length - 1], lines: [] };
  let best = null;
  for (const size of sizes) {
    const perLine = Math.max(4, Math.floor(width / (size * EM)));
    const lines = wrapTo(words, perLine);
    best = { size, lines };
    if (lines.length <= maxLines && lines.every((l) => lineWidth(l, size) <= width)) break;
  }
  return best;
}

/**
 * Break a verse into lines a child can follow, without splitting a word.
 *
 * Kept because the sheet is not the only caller and the shape is useful on its
 * own; `coloringSvg` now goes through `fitLines` so a long verse shrinks rather
 * than overflowing.
 */
export function verseLines(verse, perLine = 5) {
  const w = String(verse || '').trim().split(/\s+/).filter(Boolean);
  const out = [];
  for (let i = 0; i < w.length; i += perLine) out.push(w.slice(i, i + perLine).join(' '));
  return out;
}

// A small star for the frame's corners, drawn around (0,0).
const CORNER_STAR = 'M0 -11 L3 -4 L11 -3 L5 2 L7 10 L0 6 L-7 10 L-5 2 L-11 -3 L-3 -4 Z';
// A cloud, drawn around (0,0), about 90 wide.
const CLOUD = 'M-40 10 a12 12 0 0 1 4 -23 a16 16 0 0 1 30 -8 a14 14 0 0 1 26 6 a11 11 0 0 1 10 25 Z';
// A flower and a tuft of grass, drawn with their base at (0,0).
const FLOWER = 'M0 0 l0 -18 M0 -26 a5 5 0 1 0 0.1 0 M-9 -31 a5 5 0 1 0 0.1 0 M9 -31 a5 5 0 1 0 0.1 0 M-9 -21 a5 5 0 1 0 0.1 0 M9 -21 a5 5 0 1 0 0.1 0 M0 -26 a3 3 0 1 0 0.1 0 M0 -10 q8 -2 10 -8';
const GRASS = 'M-10 0 q2 -10 -2 -16 M-4 0 q0 -12 4 -18 M4 0 q4 -10 0 -16 M10 0 q4 -8 2 -14';
// A far-off bird, two wing strokes, drawn around (0,0).
const BIRD = 'M-14 0 q7 -10 14 0 q7 -10 14 0';

/**
 * The picture: hills, a sun and clouds, and the lesson's own pieces placed in
 * the sky or on the ground. Returns drawable elements for a box.
 */
export function sceneElements(symbols, { x, y, w, h }) {
  const els = [];
  const bottom = y + h;
  const sky = symbols.filter((s) => s.place === 'sky');
  const ground = symbols.filter((s) => s.place !== 'sky');
  const hillTop = bottom - Math.round(h * 0.36);
  // Two overlapping hills.
  els.push({ t: 'path', d: `M${x} ${bottom} L${x} ${hillTop + h * 0.08} Q${x + w * 0.32} ${hillTop - h * 0.16} ${x + w * 0.62} ${hillTop + h * 0.04} L${x + w * 0.62} ${bottom} Z`, sw: 2.5 });
  els.push({ t: 'path', d: `M${x + w * 0.4} ${bottom} Q${x + w * 0.72} ${hillTop - h * 0.2} ${x + w} ${hillTop + h * 0.02} L${x + w} ${bottom} Z`, sw: 2.5, fill: '#fff' });
  // A path winding to the horizon, and grass and flowers at the foot.
  els.push({ t: 'path', d: `M${x + w * 0.1} ${bottom} Q${x + w * 0.3} ${bottom - h * 0.1} ${x + w * 0.5} ${hillTop + h * 0.06}`, sw: 2, dash: '7 6' });
  els.push({ t: 'path', d: FLOWER, sw: 2, transform: `translate(${x + w * 0.08},${bottom - 2})` });
  els.push({ t: 'path', d: FLOWER, sw: 2, transform: `translate(${x + w * 0.92},${bottom - 2}) scale(0.85)` });
  els.push({ t: 'path', d: GRASS, sw: 2, transform: `translate(${x + w * 0.3},${bottom - 2})` });
  els.push({ t: 'path', d: GRASS, sw: 2, transform: `translate(${x + w * 0.74},${bottom - 2})` });
  // The sun in the corner unless the lesson's own sun is in the sky, and two clouds.
  if (!sky.some((s) => s.id === 'sun')) {
    const r = Math.round(Math.min(44, h * 0.14));
    const sx = x + r + 14, sy = y + r + 10;
    els.push({ t: 'path', d: `M${sx} ${sy} m-${r} 0 a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 -${2 * r} 0`, sw: 2.5 });
    for (let i = 0; i < 8; i += 1) {
      const a = (i * Math.PI) / 4;
      els.push({ t: 'line', x1: sx + Math.cos(a) * (r + 8), y1: sy + Math.sin(a) * (r + 8), x2: sx + Math.cos(a) * (r + 20), y2: sy + Math.sin(a) * (r + 20), sw: 2.5 });
    }
  }
  if (!sky.length) {
    els.push({ t: 'path', d: BIRD, sw: 2, transform: `translate(${x + w * 0.46},${y + 30})` });
    els.push({ t: 'path', d: BIRD, sw: 2, transform: `translate(${x + w * 0.54},${y + 52}) scale(0.7)` });
  }
  els.push({ t: 'path', d: CLOUD, sw: 2.2, transform: `translate(${x + w * 0.66},${y + 44})` });
  els.push({ t: 'path', d: CLOUD, sw: 2.2, transform: `translate(${x + w * 0.86},${y + 70}) scale(0.7)` });
  // Ground pieces stand on the hills, spread across the width, as big as the room allows.
  if (ground.length) {
    const n = ground.length;
    const cell = w / n;
    const scale = Math.max(0.9, Math.min((cell - 20) / 100, (h * 0.62) / 100));
    const span = scale * 100;
    ground.forEach((s, i) => {
      const gx = x + cell * i + (cell - span) / 2;
      const gy = bottom - span - h * 0.04;
      els.push({ t: 'path', d: s.d, sw: 2.5, fill: '#fff', transform: `translate(${Math.round(gx)},${Math.round(gy)}) scale(${scale.toFixed(3)})`, id: s.id });
    });
  }
  // Sky pieces hang in the upper band.
  if (sky.length) {
    const n = sky.length;
    const cell = w * 0.5 / n;
    const scale = Math.max(0.6, Math.min((cell - 16) / 100, (h * 0.32) / 100));
    const span = scale * 100;
    sky.forEach((s, i) => {
      const gx = x + w * 0.28 + cell * i + (cell - span) / 2;
      const gy = y + 6;
      els.push({ t: 'path', d: s.d, sw: 2.5, fill: '#fff', transform: `translate(${Math.round(gx)},${Math.round(gy)}) scale(${scale.toFixed(3)})`, id: s.id });
    });
  }
  return els;
}

/** Every text run on the sheet, with the box it occupies, and the picture's box. The layout, in data. */
export function sheetLayout(page) {
  if (!page) return null;
  const { margin } = SHEET;
  const mid = SHEET.width / 2;
  // The title wears a bold rounded face that runs a little wider than the
  // model's Georgia-tuned advance; it is fitted to 28px less than the ink area
  // so the real render (measured in Chromium across all 309 sheets) stays
  // inside it. The gate still measures the runs against the full ink area.
  const title = fitLines(page.title, { maxLines: 4, width: USABLE - 28 });
  const verse = fitLines(page.verse, { maxLines: 6, sizes: [34, 30, 26, 22, 18] });

  const runs = [];
  let y = margin + title.size;
  const titleTop = y - title.size;
  for (const l of title.lines) {
    runs.push({ role: 'title', text: l, x: mid, y, size: title.size, anchor: 'middle', outline: true, weight: 2.6 });
    y += title.size * 1.18;
  }
  const titleBottom = y - title.size * 1.18 + title.size * 0.34;
  if (page.ref) {
    y += 22;
    runs.push({ role: 'ref', text: page.ref, x: mid, y, size: 22, anchor: 'middle', outline: false });
    y += 22;
  }
  if (verse.lines.length) {
    y += 16;
    for (const l of verse.lines) {
      y += verse.size;
      runs.push({ role: 'verse', text: l, x: mid, y, size: verse.size, anchor: 'middle', outline: true, weight: 1.2, trace: true });
      y += verse.size * 0.4;
    }
  }

  // The picture FILLS the room left between the words above it and the
  // tracing row — it does not huddle at the top of it. On a COLORING page the
  // picture is the product.
  const traceY = 880;
  const top = Math.ceil(y + 24);
  const room = Math.max(120, traceY - 36 - top);
  const scene = { x: margin, y: top, w: SHEET.width - 2 * margin, h: room };
  const symbols = page.symbols.map((s) => ({ id: s.id, d: s.d, place: s.place || 'ground' }));

  return {
    runs,
    symbols,
    scene,
    titleBox: { x: margin - 16, y: titleTop - 10, w: SHEET.width - 2 * margin + 32, h: titleBottom - titleTop + 20 },
    traceY,
    titleSize: title.size,
    verseSize: verse.size,
    contentBottom: top + room,
  };
}

/**
 * Everything drawn on the sheet, in order, as plain data: rects, paths, lines
 * and text runs. Both renderers (the printable string and the React sheet)
 * read this one list, so they cannot drift apart.
 */
export function sheetElements(page) {
  const lay = sheetLayout(page);
  if (!lay) return [];
  const { margin, width, height } = SHEET;
  const els = [];
  // The page and its frame.
  els.push({ t: 'rect', x: 0, y: 0, w: width, h: height, fill: '#fff', sw: 0 });
  els.push({ t: 'rect', x: 20, y: 20, w: width - 40, h: height - 40, rx: 18, sw: 3 });
  els.push({ t: 'rect', x: 32, y: 32, w: width - 64, h: height - 64, rx: 12, sw: 1.5, dash: '6 6' });
  for (const [cx, cy] of [[40, 40], [width - 40, 40], [40, height - 40], [width - 40, height - 40]]) {
    els.push({ t: 'path', d: CORNER_STAR, sw: 1.8, transform: `translate(${cx},${cy})` });
  }
  // A name line for the child.
  els.push({ t: 'text', text: 'Name:', x: width - margin - 220, y: 58, size: 15, family: VERSE_FONT, fill: '#000' });
  els.push({ t: 'line', x1: width - margin - 160, y1: 60, x2: width - margin, y2: 60, sw: 1.2, dash: '3 3' });
  // The title's banner, then the runs.
  els.push({ t: 'rect', x: lay.titleBox.x, y: lay.titleBox.y, w: lay.titleBox.w, h: lay.titleBox.h, rx: 16, sw: 2.2 });
  for (const r of lay.runs) {
    if (r.role === 'title') {
      els.push({ t: 'text', text: r.text, x: r.x, y: Math.round(r.y), size: r.size, anchor: 'middle', family: TITLE_FONT, weight: 900, fill: 'none', stroke: '#000', sw: r.weight, spacing: 1, paintOrder: 'stroke' });
    } else if (r.role === 'ref') {
      els.push({ t: 'text', text: r.text, x: r.x, y: Math.round(r.y), size: r.size, anchor: 'middle', family: VERSE_FONT, weight: 700, fill: '#000' });
    } else {
      // The verse is traced: dotted letters on a dashed writing line.
      els.push({ t: 'line', x1: margin, y1: Math.round(r.y) + 5, x2: width - margin, y2: Math.round(r.y) + 5, sw: 0.8, dash: '2 4' });
      els.push({ t: 'text', text: r.text, x: r.x, y: Math.round(r.y), size: r.size, anchor: 'middle', family: VERSE_FONT, fill: 'none', stroke: '#000', sw: r.weight, dash: '3 2.5' });
    }
  }
  // The picture.
  for (const e of sceneElements(lay.symbols, lay.scene)) els.push(e);
  // The words to trace, each in its own box on a writing line.
  els.push({ t: 'text', text: 'Trace the words:', x: margin, y: lay.traceY, size: 18, family: VERSE_FONT, weight: 700, fill: '#000' });
  const boxW = 118, gap = 15;
  page.words.forEach((w, i) => {
    const bx = margin + (i % 5) * (boxW + gap);
    const by = lay.traceY + 12;
    els.push({ t: 'rect', x: bx, y: by, w: boxW, h: 60, rx: 10, sw: 1.8 });
    els.push({ t: 'line', x1: bx + 10, y1: by + 44, x2: bx + boxW - 10, y2: by + 44, sw: 0.8, dash: '2 4' });
    els.push({ t: 'text', text: w, x: bx + boxW / 2, y: by + 42, size: 28, anchor: 'middle', family: TITLE_FONT, weight: 900, fill: 'none', stroke: '#000', sw: 1.1, dash: '3 2.5' });
  });
  els.push({ t: 'text', text: 'Color it in while a grown-up reads the lesson to you.', x: width / 2, y: 976, size: 16, anchor: 'middle', family: VERSE_FONT, fill: '#000' });
  return els;
}

/** One element as SVG markup. Every run is escaped; nothing from a lesson is markup. */
function elementSvg(e) {
  const stroke = (sw) => (sw ? ` stroke="#000" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"` : '');
  const dash = e.dash ? ` stroke-dasharray="${e.dash}"` : '';
  if (e.t === 'rect') return `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}"${e.rx ? ` rx="${e.rx}"` : ''} fill="${e.fill || 'none'}"${stroke(e.sw)}${dash}/>`;
  if (e.t === 'line') return `<line x1="${r1(e.x1)}" y1="${r1(e.y1)}" x2="${r1(e.x2)}" y2="${r1(e.y2)}"${stroke(e.sw)}${dash}/>`;
  if (e.t === 'path') return `<path d="${e.d}" fill="${e.fill || 'none'}"${stroke(e.sw)}${dash}${e.transform ? ` transform="${e.transform}"` : ''}/>`;
  if (e.t === 'text') {
    return `<text x="${r1(e.x)}" y="${e.y}"${e.anchor === 'middle' ? ' text-anchor="middle"' : ''} font-family="${e.family}" font-size="${e.size}"`
      + (e.weight ? ` font-weight="${e.weight}"` : '') + (e.spacing ? ` letter-spacing="${e.spacing}"` : '') + (e.paintOrder ? ` paint-order="${e.paintOrder}"` : '')
      + ` fill="${e.fill || 'none'}"` + (e.stroke ? ` stroke="${e.stroke}" stroke-width="${e.sw}" stroke-linejoin="round"` : '') + dash
      + `>${esc(e.text)}</text>`;
  }
  return '';
}
const r1 = (n) => Math.round(Number(n) * 10) / 10;

/**
 * The page as a printable SVG string — outlines only, nothing filled but the
 * paper itself, so every stroke is something to color. US Letter at 96dpi.
 */
export function coloringSvg(page) {
  if (!page) return '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SHEET.width}" height="${SHEET.height}" viewBox="0 0 ${SHEET.width} ${SHEET.height}" role="img" aria-label="${esc(page.title)} — a coloring page">`
    + sheetElements(page).map(elementSvg).join('')
    + '</svg>';
}

/**
 * A whole set of sheets as one printable document — the coloring book.
 *
 * DR-0865 deferred this with a date; it is the other half of what Darrell
 * asked for, because he said "coloring BOOKS", not pages. Each sheet is its
 * own printed page, in the order the lessons are taught.
 *
 * Returns an HTML document string. It is self-contained on purpose: no app
 * stylesheet, no script, nothing to load — so it prints the same from a
 * phone, a Firestick browser or a desktop, online or off.
 */
export function coloringBooklet(modules, { title = 'Coloring Book' } = {}) {
  const pages = (Array.isArray(modules) ? modules : [])
    .map((m) => coloringPage(m))
    .filter(Boolean);
  const sheets = pages.map((p) => `<div class="sheet">${coloringSvg(p)}</div>`).join('');
  return '<!doctype html><html><head><meta charset="utf-8">'
    + `<title>${esc(title)}</title>`
    + '<style>'
    + '@page{size:letter;margin:0}'
    + 'html,body{margin:0;padding:0;background:#fff}'
    + '.sheet{page-break-after:always;break-after:page;display:block}'
    + '.sheet:last-child{page-break-after:auto;break-after:auto}'
    + '.sheet svg{display:block;width:100%;height:auto}'
    + '</style></head><body>'
    + (sheets || `<p style="font-family:Georgia,serif;padding:40px">${esc(title)} — no lessons to color yet.</p>`)
    + '</body></html>';
}

/** How many real sheets a set of lessons would print. */
export function bookletCount(modules) {
  return (Array.isArray(modules) ? modules : []).filter((m) => coloringPage(m)).length;
}
