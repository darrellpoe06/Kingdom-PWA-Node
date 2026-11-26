// =============================================================================
// lesson-library — every children's lesson, chosen by age (Kids Zone)
// =============================================================================
// Darrell 2026-11-24: "the kids zone should have all the children lessons to
// choose from correctly — we have them labeled by population young to
// seniors." Before this, the Kids door opened ONE lesson (the week's pick).
//
// GROUNDED (P15; DR-0076): the ages are the app's own — Little Ones is the
// Little Learners course (its meta: about 3 to 6), the rest are AGE_BANDS
// rows reading Living Lessons. A lesson is listed for a band ONLY when it
// carries that band's own authored level (`levels[depth]`), so a child is
// never handed words written for someone else. Living Lessons newest first (DR-1606,
// Learn opens on latest); Little Learners in its teaching order. Pure: no React, no I/O.
import { AGE_BANDS } from '../learn-framework.js';
import { LIVING_LESSONS_MODULES } from '../living-lessons-class.js';
import { LITTLE_LEARNERS_MODULES } from '../little-learners-class.js';

const bandOf = (id) => AGE_BANDS.find((b) => b.id === id) || null;

/** The children's ages, youngest first. `band` is what the lesson reads at. */
export const LIBRARY_AGES = Object.freeze(
  [
    { key: 'little', label: 'Little Ones', range: '3–6', courseKey: 'little-learners', band: 'child' },
    ...['child', 'youth', 'teen'].map((id) => {
      const b = bandOf(id);
      return { key: id, label: id === 'child' ? 'Kids' : b.label, range: b.range, courseKey: 'living-lessons', band: id, depth: b.depth || id };
    }),
  ].map((x) => Object.freeze(x))
);

/** The age a door opens the library on: Little Ones for the little door, Kids otherwise. */
export function defaultLibraryAge(door) {
  return door === 'little' ? 'little' : 'child';
}

/** "L341" from "ll341-…", "Little 3" from "lil3-…"; null when the id carries no number. */
export function lessonLabel(id) {
  const s = String(id || '');
  let m = s.match(/^ll(\d+)-/);
  if (m) return `L${m[1]}`;
  m = s.match(/^lil(\d+)-/);
  if (m) return `Little ${m[1]}`;
  return null;
}

const fold = (t) =>
  String(t || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '');

/**
 * The lessons for one age (order above), filtered by a typed search over the
 * title and the big idea. Each row is a `pick` the Kids adventure opens
 * directly: { courseKey, lessonId, title, bigIdea, label, band }.
 */
/**
 * The orders a reader can pick (DR-1657). Darrell 2026-11-25: "Show lessons in
 * chronological order as the default however let them be sorted in all options
 * available... I want to read these in order especially the living lessons."
 */
export const LIBRARY_SORTS = Object.freeze([
  { key: 'order', label: 'In order (first lesson first)' },
  { key: 'newest', label: 'Newest first' },
  { key: 'az', label: 'A to Z' },
  { key: 'za', label: 'Z to A' },
]);

export function libraryLessons(ageKey, query = '', { living = LIVING_LESSONS_MODULES, little = LITTLE_LEARNERS_MODULES, sort = 'order' } = {}) {
  const age = LIBRARY_AGES.find((a) => a.key === ageKey) || LIBRARY_AGES[1];
  const source = age.courseKey === 'little-learners' ? little || [] : (living || []).filter((m) => m && m.levels && m.levels[age.depth]);
  const q = fold(query).trim();
  const rows = source
    .filter((m) => m && m.id)
    .filter((m) => !q || fold(`${m.title} ${m.bigIdea}`).includes(q))
    .map((m) => ({
      courseKey: age.courseKey,
      lessonId: m.id,
      title: m.title || m.id,
      bigIdea: m.bigIdea || '',
      label: lessonLabel(m.id),
      band: age.band,
    }));
  // Chronological is the default for every age (DR-1657): the course's own
  // sequence, first lesson first. The other orders are the reader's choice.
  if (sort === 'newest') return rows.reverse();
  const byTitle = (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true });
  if (sort === 'az') return rows.sort(byTitle);
  if (sort === 'za') return rows.sort((a, b) => byTitle(b, a));
  return rows;
}

/** How many lessons each age holds — measured, shown on the age buttons. */
export function libraryCounts(opts) {
  return Object.fromEntries(LIBRARY_AGES.map((a) => [a.key, libraryLessons(a.key, '', opts).length]));
}
