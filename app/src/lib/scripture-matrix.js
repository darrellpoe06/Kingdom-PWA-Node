// =============================================================================
// scripture-matrix — "the Lord's Matrix": the DERIVED web of lessons that stand
// on the SAME Scripture
// =============================================================================
// Darrell 2026-08-10, handing in the Superman/House-of-El teaching:
//   "clarify in all lesson for comprehension and comprehensive integration of
//    the Lord's Matrix!"
//
// The complaint underneath it is the same one DR-0288 answered for Healthy
// Living: a lesson read alone is a FRAGMENT. A reader can finish it fully
// informed and never see that the verse under it is load-bearing in six other
// rooms — never see the integration, and so never see His Glory in the whole.
// DR-0288 built that web for ONE course by hand-listing witnesses. This module
// generalizes it to EVERY course, and DERIVES it, so it is true by construction
// and grows as the series grows.
//
// WHY DERIVED AND NOT AUTHORED (DR-0076 — no painted data):
//   A hand-written "see also" list is a claim that rots the moment a lesson is
//   edited. This reads the ACTUAL Scripture references out of the actual lesson
//   text, so the web can never say two lessons share a verse that they do not.
//   Add a lesson tomorrow and its kin appear on their own; delete a citation and
//   the link disappears with it. Nothing to maintain, nothing to drift.
//
// HONEST ABOUT EMPTY (the DR-0288 rule, kept):
//   A lesson with no kin says so plainly rather than manufacturing company. An
//   empty matrix is a true statement about the corpus, not a rendering failure.
//
// PURE: no window, no DOM, no fetch — plain data in, plain data out, so the
// whole web is assertable in a plain test.
// =============================================================================

// A Scripture reference as it appears in lesson prose: "(Genesis 3:15)",
// "(1 Corinthians 1:23-25)", "(Matthew 27:46)". Books may carry a 1-3 prefix.
// Deliberately anchored on the PARENTHESISED citation form the lessons use, so
// stray digits in prose ("about 8% in private facilities") are never read as refs.
const REF_RE = /\(((?:[1-3]\s)?[A-Za-z]+(?:\s+of\s+[A-Za-z]+)?)\s+(\d+):(\d+)(?:-\d+)?\)/g;

// The same reference can be written several ways ("Psalm" / "Psalms"). Normalize
// so two lessons citing the same verse actually MEET in the map.
const BOOK_ALIASES = {
  psalm: 'Psalms', psalms: 'Psalms', song: 'Song of Solomon',
  songofsongs: 'Song of Solomon', revelations: 'Revelation',
};

function canonicalBook(raw) {
  const cleaned = String(raw || '').replace(/\s+/g, ' ').trim();
  const key = cleaned.toLowerCase().replace(/\s+/g, '');
  if (BOOK_ALIASES[key]) return BOOK_ALIASES[key];
  // Title-case each word, preserving a leading numeral ("1 corinthians" -> "1 Corinthians").
  return cleaned.split(' ')
    .map((w) => (/^[0-9]$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ');
}

/**
 * Every Scripture reference cited in a block of prose, normalized and deduped.
 * A range ("Genesis 28:17-19") keys on its FIRST verse, so a lesson citing the
 * range and a lesson citing the single verse are recognized as standing
 * together — which is the whole point of the web.
 */
export function extractRefs(text) {
  const out = new Set();
  if (!text || typeof text !== 'string') return [];
  for (const m of text.matchAll(REF_RE)) {
    const [, book, ch, v] = m;
    out.add(`${canonicalBook(book)} ${ch}:${v}`);
  }
  return [...out];
}

// The lesson fields that carry teaching prose. The facilitator guide is
// deliberately EXCLUDED: it is governor-only material (ChurchLearn gates it),
// so letting it create links would leak its existence into the member view.
function lessonProse(module) {
  if (!module || typeof module !== 'object') return '';
  const parts = [module.bigIdea, module.lesson, module.inApp, module.anchor?.ref];
  if (Array.isArray(module.benefits)) parts.push(...module.benefits);
  if (module.levels && typeof module.levels === 'object') parts.push(...Object.values(module.levels));
  return parts.filter((p) => typeof p === 'string').join(' \n ');
}

// Lesson objects are static module-level data, so their reference set never
// changes once computed. Without this cache, rendering a 73-lesson course would
// re-scan every lesson's prose once per CARD (73 x 73 regex passes); with it,
// each lesson is scanned once for the life of the page. Keyed weakly so nothing
// is pinned in memory.
const REFS_CACHE = new WeakMap();

/** Every distinct Scripture reference a single lesson stands on. */
export function refsForLesson(module) {
  if (module && typeof module === 'object' && REFS_CACHE.has(module)) return REFS_CACHE.get(module);
  const computed = computeRefsForLesson(module);
  if (module && typeof module === 'object') REFS_CACHE.set(module, computed);
  return computed;
}

function computeRefsForLesson(module) {
  const prose = lessonProse(module);
  const refs = new Set(extractRefs(prose));
  // anchor.ref is written bare ("Acts 4:12; Matthew 27:46"), not parenthesised,
  // so it is parsed separately rather than being missed.
  const anchor = module?.anchor?.ref;
  if (typeof anchor === 'string') {
    const parenthesised = anchor.split(';').map((s) => `(${s.trim()})`).join(' ');
    for (const r of extractRefs(parenthesised)) refs.add(r);
  }
  return [...refs];
}

/**
 * ref -> [lessonId] across a whole course (or across several courses, if the
 * caller concatenates them). Exported so a test can assert the web directly.
 */
export function buildRefIndex(modules = []) {
  const index = new Map();
  for (const m of modules) {
    for (const ref of refsForLesson(m)) {
      if (!index.has(ref)) index.set(ref, []);
      index.get(ref).push(m.id);
    }
  }
  return index;
}

/**
 * The other lessons standing on the same Scripture as `module`, strongest tie
 * first (most shared references), then by course order so the result is stable.
 *
 * Returns [] when the lesson has no kin — an honest empty, never padded.
 */
export function matrixFor(module, modules = [], { limit = 6, minShared = 1 } = {}) {
  if (!module) return [];
  const mine = new Set(refsForLesson(module));
  if (mine.size === 0) return [];
  const order = new Map(modules.map((m, i) => [m.id, i]));
  const kin = [];
  for (const other of modules) {
    if (!other || other.id === module.id) continue;
    const shared = refsForLesson(other).filter((r) => mine.has(r));
    if (shared.length >= minShared) {
      kin.push({
        id: other.id,
        title: other.title,
        week: order.get(other.id) + 1,
        shared: shared.sort(),
      });
    }
  }
  kin.sort((a, b) => (b.shared.length - a.shared.length) || (a.week - b.week));
  return kin.slice(0, limit);
}

/**
 * The one-line frame shown above the web. It is a THEOLOGICAL claim, not a
 * feature label: the reason the same verses keep surfacing under different
 * lessons is that they describe one integrated work by one Maker — which is
 * exactly what Darrell meant by "the Lord's Matrix," and what DR-0288 named
 * for the body (integrated systems, then an integrated Body, then the Kingdom).
 */
export const MATRIX_FRAME = 'This lesson is not a fragment. The verses under it are load-bearing in other rooms too — because it is one Word describing one integrated work by one Maker: "And he is before all things, and by him all things consist" (Colossians 1:17). Follow a verse across the lessons and you are not collecting trivia; you are watching His Glory from another angle.';

/** The honest sentence for a lesson whose Scripture no other lesson has reached yet. */
export const MATRIX_EMPTY = 'No other lesson in this series has stood on these verses yet — so this one opens the ground. That is a true statement about the series, not a missing link.';

/**
 * The "read this next" invitation — Darrell 2026-08-11: "Integration into other
 * lessons for better understanding if only reading one lesson... at least touch
 * something that brings users back for more."
 *
 * The Matrix already PROVES the connection; this states it as an invitation, so
 * a reader who opens exactly one lesson is handed the single strongest next
 * one and told WHY it is next — the shared Word, named. Derived from the same
 * evidence, so it can never invite someone to a connection that is not real,
 * and it re-aims itself as the series grows.
 *
 * Returns null when a lesson has no kin, so the UI shows nothing rather than a
 * hollow "explore more" (DR-0288's honest-empty rule).
 */
export function readNextInvitation(module, modules = []) {
  const [best] = matrixFor(module, modules, { limit: 1 });
  if (!best) return null;
  const refs = best.shared.slice(0, 3);
  const more = best.shared.length - refs.length;
  return {
    id: best.id,
    week: best.week,
    title: best.title,
    shared: best.shared,
    why: `It stands on the same Word as this one — ${refs.join(', ')}${more > 0 ? ` and ${more} more` : ''}.`,
  };
}

/**
 * A plain-text rendering of the web, for the Markdown export and the copy
 * blocks (which must carry the same material the screen carries).
 */
export function matrixBlockText(module, modules = [], opts = {}) {
  const kin = matrixFor(module, modules, opts);
  const head = 'THE LORD’S MATRIX — where else this Word stands';
  if (kin.length === 0) return `${head}\n${MATRIX_FRAME}\n${MATRIX_EMPTY}`;
  const lines = kin.map((k) => `• L${k.week} ${k.title} — shares ${k.shared.join(', ')}`);
  return `${head}\n${MATRIX_FRAME}\n${lines.join('\n')}`;
}
