// =============================================================================
// one-teaching-one-lesson — two lessons built from one teaching, found
// =============================================================================
// Darrell, 2026-10-21, with two screenshots of Living Lessons side by side:
// "Same lesson from before?!!!!!!!!!!!!!!!!!!!!!!! Really?!!!!!!"
//
// He was right. `ll235-ten-christmases-left-and-every-knee-shall-bow` and
// `ll257-ten-christmases-left-counting-our-days-the-way-yahweh-counts-them`
// are two lessons in one course, both built from the SAME spoken street
// interview, and both mounted. A reader scrolling the course meets "Ten
// Christmases Left" twice.
//
// TWO EARLIER DESIGNS WERE MEASURED AND THROWN AWAY, which is why this one is
// narrow on purpose:
//   1. Shared TITLE PHRASES across the whole catalog flagged 12+ legitimate
//      pairs -- "two or three witnesses" is taught in four different courses
//      and is supposed to be.
//   2. The same rule narrowed to ONE course still failed: Living Lessons
//      legitimately reuses "Father, Son, Holy Spirit" and "think on these
//      things" across different lessons.
// Neither shipped. The thing that separates a duplicate from a theme taught
// twice is not the title and not the course -- it is THE SAME GROUND OF
// SCRIPTURE under the same name.
//
// THE RULE, and every part of it earns its place:
//   · the SAME course (a theme taught in two courses is the curriculum working)
//   · the SAME distinctive opening of the title (3 words, normalised)
//   · AND >= `MIN_SHARED_VERSES` of the same verses, counted AFTER expanding
//     ranges -- because ll235 writes "Psalms 39:4; Psalms 39:5" where ll257
//     writes "Psalms 39:4-5", and comparing the strings sees 5 shared refs
//     where the real overlap is 23 verses. Expanding is what makes the rule
//     see what a reader sees.
//
// MEASURED on the live catalog, 2026-10-21: 44 courses, 673 lessons, and this
// rule flags EXACTLY ONE pair -- the real one -- at every threshold from 6 to
// 12 shared verses. Zero false positives at any of them. That is the whole
// reason it is allowed to fail a build where its two predecessors were not.
//
// Pure and dependency-free, so the rule is tested without a browser and the
// guard and the test read the same code.

/** Three words is enough to be distinctive and short enough to survive a subtitle. */
export const TITLE_WORDS = 3;
/** The threshold. Measured: 6 through 12 all flag exactly the one real pair. */
export const MIN_SHARED_VERSES = 10;

const str = (v) => String(v === null || v === undefined ? '' : v);

/** A title reduced to its words: punctuation, dashes and case carry no meaning here. */
export function normalizeTitle(title) {
  return str(title).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** The distinctive opening of a title. Empty for a title with no words at all. */
export function titleOpening(title, words = TITLE_WORDS) {
  const w = normalizeTitle(title).split(' ').filter(Boolean);
  return w.slice(0, words).join(' ');
}

/**
 * Every single verse an anchor names, with ranges expanded. "1 Timothy 6:17-19"
 * and "1 Timothy 6:17; 1 Timothy 6:18; 1 Timothy 6:19" are THE SAME GROUND and
 * must count as it; comparing the written refs would miss that, which is
 * exactly how this duplicate stayed invisible.
 *
 * A reference this cannot parse is kept whole and lowercased rather than
 * dropped: an unknown form must never silently reduce the overlap it would
 * have contributed (DR-0076 §8 — unknown is not nothing).
 */
export function expandVerses(ref) {
  const out = new Set();
  for (const part of str(ref).split(/[;,]/)) {
    const t = part.trim();
    if (!t) continue;
    const m = t.match(/^(.+?)\s+(\d+):(\d+)(?:\s*[-–—]\s*(\d+))?$/);
    if (!m) { out.add(t.toLowerCase()); continue; }
    const book = m[1].trim().toLowerCase();
    const chapter = m[2];
    const lo = Number(m[3]);
    const hi = m[4] ? Number(m[4]) : lo;
    // A backwards range ("6:19-17") is a typo, not a reason to add nothing.
    const last = hi >= lo ? hi : lo;
    // A span wide enough to be a whole chapter is still counted verse by verse;
    // the cap only stops a malformed number from building a giant set.
    for (let v = lo; v <= Math.min(last, lo + 200); v += 1) out.add(`${book} ${chapter}:${v}`);
  }
  return out;
}

/** How much ground two lessons share: the verses, and the share of the smaller one. */
export function sharedGround(a, b) {
  const ra = expandVerses(a && a.anchor && a.anchor.ref);
  const rb = expandVerses(b && b.anchor && b.anchor.ref);
  let shared = 0;
  for (const v of ra) if (rb.has(v)) shared += 1;
  const smaller = Math.min(ra.size, rb.size);
  return { shared, verses: [ra.size, rb.size], pctOfSmaller: smaller ? Math.round((shared / smaller) * 100) : 0 };
}

/**
 * The pairs in ONE course that are one teaching told twice. `lessons` is a
 * course's schedule; each entry needs `id`, `title` and `anchor.ref`.
 */
export function duplicatePairsIn(lessons, { minShared = MIN_SHARED_VERSES, titleWords = TITLE_WORDS } = {}) {
  const list = (Array.isArray(lessons) ? lessons : []).filter(Boolean);
  const pre = list.map((m) => ({ m, opening: titleOpening(m.title, titleWords) }));
  const found = [];
  for (let i = 0; i < pre.length; i += 1) {
    for (let j = i + 1; j < pre.length; j += 1) {
      const A = pre[i];
      const B = pre[j];
      if (!A.opening || A.opening !== B.opening) continue;
      const g = sharedGround(A.m, B.m);
      if (g.shared < minShared) continue;
      found.push({
        opening: A.opening,
        a: str(A.m.id), b: str(B.m.id),
        titles: [str(A.m.title), str(B.m.title)],
        shared: g.shared, verses: g.verses, pctOfSmaller: g.pctOfSmaller,
      });
    }
  }
  return found;
}

/** Every such pair across a whole catalog of courses, each tagged with its course. */
export function duplicatePairs(courses, opts = {}) {
  const out = [];
  for (const c of (Array.isArray(courses) ? courses : []).filter(Boolean)) {
    const key = str((c.meta && c.meta.key) || c.key);
    for (const p of duplicatePairsIn(c.schedule || c.modules || [], opts)) out.push({ course: key, ...p });
  }
  return out;
}

/**
 * THE ONE KNOWN PAIR, and why it is here rather than fixed.
 *
 * Both lessons carry real work nobody should throw away: ll235 has 4 verses
 * ll257 does not, and TWO PARABLES of its own ("The Calendar on the Inside of
 * the Cabinet Door", "The Man Who Would Not Sell His Hard Years"); ll257 has 53
 * verses ll235 does not, and two parables of its own. Folding them is an
 * EDITORIAL decision about Yahweh's Word on a COLG-facing surface, and it is
 * Darrell's to make, not a gate's and not mine. So the gate names the pair with
 * its measurement and does not fail on it, and it fails on a SECOND one.
 *
 * `re-review: 2026-10-28` — Darrell's call, with the measurement in hand.
 */
export const KNOWN_PAIRS = Object.freeze([
  Object.freeze({
    course: 'living-lessons',
    a: 'll235-ten-christmases-left-and-every-knee-shall-bow',
    b: 'll257-ten-christmases-left-counting-our-days-the-way-yahweh-counts-them',
    why: 'Both built from the same spoken street interview. 23 verses shared, 85% of the smaller lesson; 4 verses and 2 parables are only in ll235, 53 verses and 2 parables only in ll257. Folding them is Darrell’s editorial call on his own teaching; nothing is deleted until he makes it. re-review: 2026-10-28',
  }),
]);

const pairKey = (p) => [str(p.course), ...[str(p.a), str(p.b)].sort()].join('|');

/** True when this pair is the one already recorded above. */
export function isKnown(pair, known = KNOWN_PAIRS) {
  const k = pairKey(pair);
  return (known || []).some((p) => pairKey(p) === k);
}

/** The pairs that are NOT the recorded one — the ones a build must not carry. */
export function newDuplicatePairs(courses, opts = {}) {
  return duplicatePairs(courses, opts).filter((p) => !isKnown(p, opts.known));
}
