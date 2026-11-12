// =============================================================================
// learning-products — one teaching, three ways to hold it: the book, the
// self-paced video course, the in-person workshop
// =============================================================================
// Darrell 2026-11-12: "We have a store... we want to have this book as a paid
// for resource... also a course without any teacher under the paid PoeTech...
// have a video of each section and walk through the sections... then have an
// in-person paid workshop costs varied on location and going rates..."
//
// ONE SOURCE, DERIVED. Every product line here is built from a registry entry
// (learn-catalog) the way the Learn tab's own list is, never a hand-typed
// catalog that drops what was built. For each course:
//   book      — a product in the Bookstore's shape (book-catalog), sized by
//               the measured fitness (course-book-fitness); a chapter-sized
//               course has no book of its own and says why;
//   course    — the self-paced walk-through: the course's sections, each with
//               its video status (lesson-video), opened by PoeTech+ for the
//               rigorous levels of a PoeTech subject (DR-1428) and free for a
//               spiritual department (the Love Corner's own, lesson-links);
//   workshop  — the in-person seat, with the recommended price and its parts
//               (workshop-pricing); the Governor opens a real event on the
//               workshop_events row, and that row's price is what is charged.
//
// THE LINE THAT HOLDS. A spiritual department's book is a FORMAT of what is
// read free in the app (as Living Lessons already is, $9.99), its course is
// free, its workshop is an offering. Nothing here locks a lesson: this module
// reads no access model (the learn-access-tiers gate stays untouched); it
// labels what a course costs and derives what is sold beside it.
//
// A SOURCE THAT HAS NOT REACHED THE APP is listed as awaiting, with the
// reason, so the Governor sees the gap as work (DR-0239 findings-are-work)
// and no product is painted over a document the app does not hold.
// =============================================================================
import { LEARN_CATALOG } from './learn-catalog.js';
import { measureCourse, FITNESS_LABEL } from './course-book-fitness.js';
import { PLUS_TIER } from './poetech-plus.js';
import { sectionLessons, wantsSections } from './lesson-sections.js';
import { sectionVideo, videoCoverage, recordingPlan } from './lesson-video.js';
import { recommendSeatPrice, knowledgeTypeFor, isSpiritualDepartment } from './workshop-pricing.js';
import { normalizeProduct } from './commerce.js';

const asStr = (v) => (typeof v === 'string' ? v : '');
const asArr = (v) => (Array.isArray(v) ? v : []);

/** Book list prices by measured size: our policy, in cents. */
export const BOOK_PRICE_BY_FITNESS = Object.freeze({ full: 1999, short: 1499, booklet: 799, chapter: 0 });

/**
 * Sources Darrell has named that are not yet in the app as a recipe. Each
 * carries why, so the drafts list says the true state (no painted product).
 */
export const AWAITING_SOURCES = Object.freeze([
  {
    id: 'src-acrobat-course-2026-11-12',
    title: 'The course document shared 2026-11-12 (Adobe Acrobat link)',
    status: 'awaiting-source',
    why: 'The document lives behind an Acrobat share link the build cannot reach; once the file is in Google Drive or the repo it becomes a recipe and its three products are derived here.',
  },
]);

/** The sections a course walks through: the Word's divisions for a long course, else one section per lesson. Pure. */
export function courseSections(rows) {
  const list = asArr(rows);
  if (wantsSections(list)) return sectionLessons(list);
  return list.map((m) => ({ key: asStr(m && m.id) || 'lesson', label: asStr(m && m.title) || 'Lesson', lessons: [m] }));
}

/** The book product for one measured course, in the Bookstore's own shape. */
export function bookProduct(measured, entry) {
  const price = BOOK_PRICE_BY_FITNESS[measured.fitness] ?? 0;
  const spiritual = isSpiritualDepartment(measured.department);
  return normalizeProduct({
    id: `prod-course-${measured.key}`,
    recipeId: `course-${measured.key}`,
    title: measured.title,
    author: 'Darrell Poe',
    subtitle: asStr(entry && entry.meta && (entry.meta.audience || entry.meta.tagline || entry.meta.subtitle)),
    blurb: `${FITNESS_LABEL[measured.fitness]} of ${measured.lessons} lessons, ${measured.words.toLocaleString()} words${measured.volumes > 1 ? `, in ${measured.volumes} volumes` : ''}.`,
    coverEmoji: spiritual ? '🕊' : '📘',
    priceCents: price,
    businesses: spiritual ? ['church'] : ['poetech', 'church'],
    status: 'draft',
    conversationEnabled: true,
    tierIncluded: ['premium', 'business'],
  });
}

/** The self-paced video course for one registry entry. */
export function courseProduct(measured, entry, rows) {
  const sections = courseSections(rows);
  const spiritual = isSpiritualDepartment(measured.department);
  return {
    id: `course-${measured.key}`,
    key: measured.key,
    title: measured.title,
    department: measured.department,
    requires: spiritual ? 'foundation' : PLUS_TIER,
    free: spiritual,
    lessons: measured.lessons,
    sections: sections.map(sectionVideo),
    coverage: videoCoverage(sections),
    owed: recordingPlan(sections),
    launch: { view: 'church', churchView: 'learn', courseKey: measured.key },
  };
}

/** The in-person workshop offer for one registry entry: a recommendation, not an event. */
export function workshopOffer(measured, { location = 'city', format = 'day', requested, capacity } = {}) {
  const rec = recommendSeatPrice({ department: measured.department, location, format, requested, capacity });
  return {
    id: `workshop-${measured.key}`,
    key: measured.key,
    title: measured.title,
    department: measured.department,
    knowledgeType: knowledgeTypeFor(measured.department),
    offering: rec.offering,
    recommendedCents: rec.cents,
    parts: rec.parts,
  };
}

/** The three products of one registry entry. `rows` may be passed by a host that already built them. */
export function productLine(entry, { rows = null, location, format, requested, capacity } = {}) {
  let list = rows;
  if (!list) {
    try {
      list = entry && entry.buildScheduleRows ? entry.buildScheduleRows() : [];
    } catch {
      list = [];
    }
  }
  const measured = measureCourse(entry, list);
  return {
    key: measured.key,
    title: measured.title,
    department: measured.department,
    measured,
    book: measured.fitness === 'chapter' ? null : bookProduct(measured, entry),
    bookWhy: measured.fitness === 'chapter' ? 'A chapter, not a book: it joins its department compilation.' : '',
    course: courseProduct(measured, entry, list),
    workshop: workshopOffer(measured, { location, format, requested, capacity }),
  };
}

/** Every registered course's product line, largest book first. */
export function catalogProductLines(catalog = LEARN_CATALOG, opts = {}) {
  return asArr(catalog)
    .map((e) => productLine(e, opts))
    .sort((a, b) => b.measured.words - a.measured.words);
}

/** The lines' books only (the ones that exist), as Bookstore drafts. */
export function derivedBookDrafts(lines) {
  return asArr(lines)
    .map((l) => l.book)
    .filter(Boolean);
}
