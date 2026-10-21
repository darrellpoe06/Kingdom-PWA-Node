// =============================================================================
// lesson-completeness — is every lesson what it should be? Counted, per course
// =============================================================================
// Darrell 2026-10-21, on Revelation — Deep Processing: "None of these have two
// [stories]... make sure all lessons are what they should be... Even the verses
// of the lessons are not here in these courses... comprehensiv review... Inside
// each lesson... My family and friends and children will use them for clarity."
// And the same evening: "Qualitative and quantitative engineering... so
// comprehensive evaluation and engineering to produce perpetual data."
//
// Two things a lesson must carry, measured from the lesson itself (DR-0076):
//   stories — at least two parables or true stories (DR-0215 / DR-0855);
//   word    — the Scripture it stands on QUOTED inside the lesson text, a
//             quotation with its reference beside it, not only a reference to
//             open somewhere else (DR-0402).
// The census is pure and runs on whatever courses are mounted: the gate test
// holds it to a baseline that only shrinks, and the Learn course header shows
// the same numbers live, so the gap is visible where the lessons are read.
// =============================================================================

export const MIN_STORIES = 2;

const isStory = (s) => !!s && (s.kind === 'parable' || s.kind === 'testimony');

/** The number of real stories (parable or true story) a lesson carries. */
export function storyCount(m) {
  return Array.isArray(m && m.stories) ? m.stories.filter(isStory).length : 0;
}

// A quotation followed by its reference: "..." (Book 3:16 ...) or "..."
// (1 Corinthians 13:4, KJV). Straight or curly quotes; the book may carry a
// leading number. This is what "the verse is inside the lesson" means on the
// page: the reader can read it without leaving.
const QUOTED_REF = /["“”][^"“”]{8,}["“”][.,;:!?]?\s*\((?:[1-3]\s)?[A-Z][A-Za-z]+(?:\s(?:of\s)?[A-Z][A-Za-z]+)*\s\d+:\d+/;
// ...or the translation badge of SCRIPTURE-REFERENCE-STANDARD:
//   **KJV — Daniel 12:4:** *"But thou, O Daniel..."*
const BADGED_REF = /\*\*(?:ESV|KJV|NIV|AMP)\s+[—-]\s+(?:[1-3]\s)?[A-Z][A-Za-z]+(?:\s(?:of\s)?[A-Z][A-Za-z]+)*\s\d+:\d+[^*]*\*\*\s*\*?["“]/;

/** Every written body a lesson carries: the adult lesson and each age band. */
export function lessonBodies(m) {
  const out = [];
  if (m && typeof m.lesson === 'string') out.push(m.lesson);
  const levels = m && m.levels && typeof m.levels === 'object' ? m.levels : {};
  for (const v of Object.values(levels)) if (typeof v === 'string') out.push(v);
  return out;
}

/** True when the lesson quotes Scripture with its reference inside its own text. */
export function quotesTheWord(m) {
  return lessonBodies(m).some((b) => QUOTED_REF.test(b) || BADGED_REF.test(b));
}

/** One course's census: how many lessons, how many are short, and which. */
export function courseCompleteness(course) {
  const rows = Array.isArray(course && course.schedule) ? course.schedule : [];
  const shortOfStories = [];
  const wordOutside = [];
  for (const m of rows) {
    const id = m && (m.id || m.title);
    if (storyCount(m) < MIN_STORIES) shortOfStories.push(id);
    if (!quotesTheWord(m)) wordOutside.push(id);
  }
  return {
    key: (course && (course.key || (course.meta && course.meta.key))) || null,
    title: (course && course.meta && course.meta.title) || '',
    lessons: rows.length,
    withStories: rows.length - shortOfStories.length,
    withWord: rows.length - wordOutside.length,
    shortOfStories,
    wordOutside,
  };
}

/** The whole catalog, course by course, with the totals. */
export function catalogCompleteness(courses) {
  const list = (courses || []).map(courseCompleteness);
  const totals = list.reduce((t, c) => ({
    lessons: t.lessons + c.lessons,
    withStories: t.withStories + c.withStories,
    withWord: t.withWord + c.withWord,
  }), { lessons: 0, withStories: 0, withWord: 0 });
  return { courses: list, totals };
}

/** The course header's line, in plain words (empty for a course with no lessons). */
export function completenessLine(c) {
  if (!c || !c.lessons) return '';
  const all = (n) => (n === c.lessons ? `all ${c.lessons}` : `${n} of ${c.lessons}`);
  return `Two stories in ${all(c.withStories)} lessons · the verses quoted inside ${all(c.withWord)}`;
}
