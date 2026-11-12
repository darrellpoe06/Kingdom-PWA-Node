// =============================================================================
// course-book-fitness — which courses are a book's worth, measured, never guessed
// =============================================================================
// Darrell 2026-11-12: "how many books can we make out of my courses ... that
// would be considered appropriate for a book each?" The answer is a
// MEASUREMENT on the live registry (learn-catalog), not a hand-kept list.
//
// What is counted. A reader's book is assembled by book-corpus from each
// lesson's `lesson` text, its big idea, its benefits and its try-it note
// (lessonModuleToSource). That is what is counted here. The facilitator
// notes, the quiz and the age-band rewrites are NOT counted: they are the
// classroom's, not the book's. Measured on the registry the day this shipped,
// the curriculum export (which carries all of those) read 2.55M words while
// the book bodies read 1.98M; counting the export would have inflated every
// answer by a quarter or more.
//
// The sizes (our own policy, stated so it can be checked, not a market claim):
//   full book    >= 40,000 words  — a trade non-fiction length; splits into
//                                   volumes of about VOLUME_WORDS each
//   short book   20,000 – 39,999  — a short non-fiction or business book
//   booklet       8,000 – 19,999  — a workbook or booklet
//   chapter       <  8,000         — a chapter; it joins its department's book
// A department whose courses together reach a size is a compilation: one
// book made of several courses. Every course is placed exactly once, so the
// sum of every bucket equals the registry's count (surface-says-truth).
// =============================================================================
import { LEARN_CATALOG } from './learn-catalog.js';

export const FULL_BOOK_WORDS = 40000;
export const SHORT_BOOK_WORDS = 20000;
export const BOOKLET_WORDS = 8000;
/** A full book above this size is offered as volumes of about this many words. */
export const VOLUME_WORDS = 80000;

const asStr = (v) => (typeof v === 'string' ? v : '');
const asArr = (v) => (Array.isArray(v) ? v : []);
const words = (s) => asStr(s).split(/\s+/).filter(Boolean).length;

/** The words a reader's book draws from one lesson module. Pure. */
export function lessonBookWords(m) {
  if (!m || typeof m !== 'object') return 0;
  return words(m.lesson) + words(m.bigIdea) + asArr(m.benefits).reduce((a, b) => a + words(b), 0) + words(m.inApp);
}

/** The words a reader's book draws from a whole course. Pure. */
export function bookWords(modules) {
  return asArr(modules).reduce((a, m) => a + lessonBookWords(m), 0);
}

/** 'full' | 'short' | 'booklet' | 'chapter', from a word count. Pure. */
export function fitness(wordCount) {
  const n = Number.isFinite(wordCount) ? wordCount : 0;
  if (n >= FULL_BOOK_WORDS) return 'full';
  if (n >= SHORT_BOOK_WORDS) return 'short';
  if (n >= BOOKLET_WORDS) return 'booklet';
  return 'chapter';
}

/** How many volumes a count fills (a full book over VOLUME_WORDS splits). Pure. */
export function volumes(wordCount) {
  const n = Number.isFinite(wordCount) ? wordCount : 0;
  if (n < FULL_BOOK_WORDS) return n > 0 ? 1 : 0;
  return Math.max(1, Math.ceil(n / VOLUME_WORDS));
}

export const FITNESS_LABEL = Object.freeze({
  full: 'a full book', short: 'a short book', booklet: 'a booklet', chapter: 'a chapter',
});

/**
 * Measure one registry entry. `rows` may be passed (a test, a host that has
 * them); otherwise the entry's own schedule builder is called.
 */
export function measureCourse(entry, rows = null) {
  let modules = rows;
  if (!modules) {
    try { modules = entry && entry.buildScheduleRows ? entry.buildScheduleRows() : []; } catch { modules = []; }
  }
  const n = bookWords(modules);
  return {
    key: asStr(entry && entry.key),
    title: asStr(entry && entry.meta && entry.meta.title),
    department: asStr(entry && entry.meta && entry.meta.category),
    lessons: asArr(modules).length,
    words: n,
    fitness: fitness(n),
    volumes: volumes(n),
  };
}

/** Every registered course, measured, largest first. */
export function measureCatalog(catalog = LEARN_CATALOG) {
  return asArr(catalog).map((e) => measureCourse(e)).sort((a, b) => b.words - a.words);
}

/**
 * Department compilations: the courses of one department that are NOT a
 * book on their own (booklet, chapter), gathered into one book when together
 * they reach SHORT_BOOK_WORDS. A full or short book is never folded in (it
 * is its own title), so no words are counted twice.
 */
export function departmentCompilations(measured) {
  const by = new Map();
  for (const m of asArr(measured)) {
    if (m.fitness === 'full' || m.fitness === 'short') continue;
    const d = m.department || 'Unplaced';
    if (!by.has(d)) by.set(d, []);
    by.get(d).push(m);
  }
  const out = [];
  for (const [department, courses] of by) {
    const n = courses.reduce((a, c) => a + c.words, 0);
    const f = fitness(n);
    out.push({
      department, courses: courses.map((c) => c.key), words: n, fitness: f, volumes: volumes(n),
      // A compilation is a book when the gathered courses reach a short book;
      // below that the department stays a set of booklets and chapters.
      isBook: f === 'full' || f === 'short',
    });
  }
  return out.sort((a, b) => b.words - a.words);
}

/**
 * The answer to "how many books": standalone books (full and short courses),
 * the department compilations that reach a book, and the volume count that
 * the full books split into. Every course is counted exactly once.
 */
export function bookCount(measured) {
  const list = asArr(measured);
  const standalone = list.filter((m) => m.fitness === 'full' || m.fitness === 'short');
  const compilations = departmentCompilations(list).filter((c) => c.isBook);
  const placed = new Set([...standalone.map((m) => m.key), ...compilations.flatMap((c) => c.courses)]);
  const remainder = list.filter((m) => !placed.has(m.key));
  return {
    courses: list.length,
    standalone: standalone.map((m) => ({ key: m.key, title: m.title, words: m.words, fitness: m.fitness, volumes: m.volumes })),
    compilations,
    remainder: remainder.map((m) => ({ key: m.key, department: m.department, words: m.words })),
    titles: standalone.length + compilations.length,
    volumes: standalone.reduce((a, m) => a + m.volumes, 0) + compilations.reduce((a, c) => a + c.volumes, 0),
  };
}
