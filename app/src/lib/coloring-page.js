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
 * The symbol library — plain shapes a child can color, each keyed to words a
 * lesson might use. Paths are deliberately simple: thick outlines, big areas,
 * nothing a crayon cannot stay inside.
 */
export const SYMBOLS = [
  { id: 'lamb', words: ['lamb', 'sheep', 'shepherd', 'flock'], d: 'M24 62 a20 15 0 1 0 40 0 a20 15 0 1 0 -40 0 Z M64 52 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 Z M28 54 a7 7 0 0 1 12 -5 a7 7 0 0 1 12 0 a7 7 0 0 1 10 5 M66 44 a6 4 0 1 0 9 -4 M79 49 a1.6 1.6 0 1 1 0.1 0 M34 76 l0 10 M52 76 l0 10' },
  { id: 'crown', words: ['king', 'crown', 'reign', 'throne', 'kingdom'], d: 'M14 70 L22 32 L36 54 L50 28 L64 54 L78 32 L86 70 Z M14 70 L86 70' },
  { id: 'bread', words: ['bread', 'loaf', 'loaves', 'feed', 'food', 'eat'], d: 'M18 64 a32 22 0 0 1 64 0 Z M18 64 l0 10 a32 10 0 0 0 64 0 l0 -10 M38 48 l0 12 M58 48 l0 12' },
  { id: 'water', words: ['water', 'well', 'river', 'sea', 'thirst', 'drink'], d: 'M12 50 q12 -12 24 0 q12 12 24 0 q12 -12 24 0 M12 68 q12 -12 24 0 q12 12 24 0 q12 -12 24 0' },
  { id: 'lamp', words: ['lamp', 'light', 'shine', 'candle', 'dark'], d: 'M36 86 l28 0 l0 -34 l-28 0 Z M32 52 l36 0 M50 52 l0 -6 M50 46 c-9 -7 -3 -18 0 -22 c3 4 9 15 0 22 Z M32 30 l-8 -5 M68 30 l8 -5' },
  { id: 'tree', words: ['tree', 'fruit', 'root', 'branch', 'vine', 'seed', 'grow'], d: 'M44 82 l12 0 l0 -22 l-12 0 Z M50 60 a22 20 0 1 1 0.1 0 M50 60 l0 -22 M50 46 l-10 -8 M50 50 l10 -8' },
  { id: 'house', words: ['house', 'home', 'build', 'door', 'family', 'temple'], d: 'M16 54 L50 26 L84 54 M24 54 l0 32 l52 0 l0 -32 M42 86 l0 -20 l16 0 l0 20' },
  { id: 'heart', words: ['heart', 'love', 'kind', 'mercy', 'care'], d: 'M50 84 C18 62 20 34 36 32 C44 31 50 38 50 44 C50 38 56 31 64 32 C80 34 82 62 50 84 Z' },
  { id: 'star', words: ['star', 'night', 'sky', 'heaven', 'glory'], d: 'M50 20 L59 44 L84 44 L64 58 L72 82 L50 68 L28 82 L36 58 L16 44 L41 44 Z' },
  { id: 'fish', words: ['fish', 'fishes', 'net', 'boat', 'catch'], d: 'M14 56 C30 34 62 34 76 56 C62 78 30 78 14 56 Z M76 56 l12 -12 l0 24 Z M30 50 a3 3 0 1 1 0.1 0' },
  // An OPEN palm — four fingers of near-even height under a gentle arch.
  //
  // The first path drew a fist with one finger standing far above the rest.
  // Rendered, it read unmistakably as an obscene gesture, and it was on 122 of
  // the 236 children's sheets, because 'give', 'help', 'hold' and 'work' are
  // ordinary words. Nobody had looked at it. Every finger is now present and
  // within ten units of its neighbours, so the shape cannot read that way.
  { id: 'hand', words: ['hand', 'give', 'help', 'hold', 'work'], d: 'M26 78 l0 -22 a8 8 0 0 1 8 -8 l38 0 a8 8 0 0 1 8 8 l0 22 a10 10 0 0 1 -10 10 l-34 0 a10 10 0 0 1 -10 -10 Z M30 50 l0 -20 a5 5 0 0 1 10 0 l0 20 M42 50 l0 -24 a5 5 0 0 1 10 0 l0 24 M54 50 l0 -26 a5 5 0 0 1 10 0 l0 26 M66 50 l0 -16 a5 5 0 0 1 10 0 l0 16 M26 62 l-9 5 a6 6 0 0 0 7 10 l5 -3' },
  { id: 'book', words: ['book', 'word', 'read', 'scroll', 'bible', 'write'], d: 'M14 28 l32 6 l0 46 l-32 -6 Z M86 28 l-32 6 l0 46 l32 -6 Z M50 34 l0 46' },
  { id: 'sun', words: ['sun', 'day', 'morning', 'bright', 'warm'], d: 'M50 50 m-18 0 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0 M50 18 l0 -10 M50 92 l0 -10 M18 50 l-10 0 M92 50 l10 0 M27 27 l-7 -7 M73 27 l7 -7 M27 73 l-7 7 M73 73 l7 7' },
  { id: 'bird', words: ['bird', 'wing', 'fly', 'sparrow', 'eagle', 'dove'], d: 'M28 62 a22 18 0 1 0 44 0 a22 18 0 1 0 -44 0 Z M62 42 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0 Z M86 42 l10 4 l-10 4 Z M78 38 a2 2 0 1 1 0.1 0 M38 58 a14 10 0 0 1 24 4 a14 10 0 0 1 -24 -4 Z M28 62 l-16 -8 l2 16 Z M44 79 l0 9 M58 79 l0 9' },
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
 * near 0.50em; this is deliberately set HIGHER so the estimate can only ever
 * over-state a line's width, never under-state it. A sheet that wraps one word
 * early is fine; a sheet that runs off the paper is not.
 *
 * It is an estimate, not a browser measurement — this file is pure and has no
 * renderer. The sheets were measured once for real with Chromium getBBox (see
 * the record), and the standing CI gate measures this model across all 236.
 */
export const EM = 0.58;

/** The paper, and the ink area inside it. US Letter at 96dpi. */
export const SHEET = { width: 792, height: 1024, margin: 70 };
export const USABLE = SHEET.width - 2 * SHEET.margin;

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

/** Every text run on the sheet, with the box it occupies. The layout, in data. */
export function sheetLayout(page) {
  if (!page) return null;
  const { margin } = SHEET;
  const mid = SHEET.width / 2;
  const title = fitLines(page.title, { maxLines: 4 });
  const verse = fitLines(page.verse, { maxLines: 6, sizes: [34, 30, 26, 22, 18] });

  const runs = [];
  let y = margin + title.size;
  for (const l of title.lines) {
    runs.push({ role: 'title', text: l, x: mid, y, size: title.size, anchor: 'middle', outline: true, weight: 1.5 });
    y += title.size * 1.18;
  }
  if (page.ref) {
    y += 14;
    runs.push({ role: 'ref', text: page.ref, x: mid, y, size: 22, anchor: 'middle', outline: false });
    y += 22;
  }
  if (verse.lines.length) {
    y += 20;
    for (const l of verse.lines) {
      y += verse.size;
      runs.push({ role: 'verse', text: l, x: mid, y, size: verse.size, anchor: 'middle', outline: true, weight: 1 });
      y += verse.size * 0.34;
    }
  }

  // The symbols FILL the room left between the words above them and the
  // tracing row — they do not huddle at the top of it.
  //
  // The first cut capped the row height at 170 and the scale at 1.5, and the
  // rendered sheet came back with four small shapes in the upper third and a
  // dead white half below them. On a COLORING page the picture is the product,
  // so the shapes take the whole of whatever room the words leave, bounded
  // only by the column width and by each other.
  const traceY = 900;
  const top = Math.ceil(y + 24);
  const rows = Math.ceil(page.symbols.length / 2) || 1;
  const cols = Math.min(2, page.symbols.length) || 1;
  const room = Math.max(0, traceY - 30 - top);
  const rowH = Math.floor(room / rows);
  const colW = Math.floor((SHEET.width - 2 * margin) / cols);
  // Paths are drawn inside a 100×100 box; leave a little air on every side.
  const scale = Math.max(0.8, Math.min((rowH - 16) / 100, (colW - 24) / 100));
  const span = Math.round(scale * 100);
  const gutter = Math.floor((SHEET.width - cols * span) / (cols + 1));
  const symbols = page.symbols.map((s, i) => ({
    id: s.id,
    d: s.d,
    x: gutter + (i % cols) * (span + gutter),
    y: top + Math.floor(i / cols) * rowH + Math.floor((rowH - span) / 2),
    scale: Number(scale.toFixed(3)),
  }));

  return { runs, symbols, traceY, titleSize: title.size, verseSize: verse.size, contentBottom: top + rows * rowH };
}

/**
 * The page as a printable SVG string — outlines only, nothing filled, so every
 * stroke is something to color. US Letter at 96dpi.
 */
export function coloringSvg(page) {
  if (!page) return '';
  const lay = sheetLayout(page);
  const { margin } = SHEET;
  const text = (r) => `<text x="${r.x}" y="${Math.round(r.y)}" ${r.anchor === 'middle' ? 'text-anchor="middle" ' : ''}`
    + `font-family="Georgia, serif" font-size="${r.size}" `
    + (r.outline ? `fill="none" stroke="#000" stroke-width="${r.weight}"` : 'fill="#000"')
    + `>${esc(r.text)}</text>`;
  const sym = lay.symbols.map((s) => `<g transform="translate(${s.x},${s.y}) scale(${s.scale})" fill="none" stroke="#000" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"><path d="${s.d}"/></g>`).join('');
  const trace = page.words.map((w, i) => `<text x="${margin + (i % 5) * 130}" y="${lay.traceY + 34}" font-family="Georgia, serif" font-size="30" fill="none" stroke="#000" stroke-width="1">${esc(w)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SHEET.width}" height="${SHEET.height}" viewBox="0 0 ${SHEET.width} ${SHEET.height}" role="img" aria-label="${esc(page.title)} — a coloring page">`
    + `<rect x="0" y="0" width="${SHEET.width}" height="${SHEET.height}" fill="#fff"/>`
    + lay.runs.map(text).join('')
    + sym
    + `<text x="${margin}" y="${lay.traceY}" font-family="Georgia, serif" font-size="20" fill="#000">Trace the words:</text>`
    + trace
    + `<text x="${SHEET.width / 2}" y="990" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="#000">Color it in while a grown-up reads the lesson to you.</text>`
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
