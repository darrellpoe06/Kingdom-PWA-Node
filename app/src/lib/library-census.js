// =============================================================================
// library-census — what the course library holds, lesson by lesson, and what
// is still to be written (DR-1262)
// =============================================================================
// Darrell 2026-10-27: "Make sure we are filling the course library perpetually
// with all levels and necessary components and information and understanding
// make sense of the management of the course records and strategies that will
// help with learning content... make sense?"
//
// MEASURED before this (DR-0076 §4), on the catalog the tests mount: 691
// lessons in 44 courses; 417 carry all five versions, 150 carry four, 124
// carry three; 676 carry an exam, 673 benefits, 642 talking points, 548 a
// run-of-show; 72 adult lessons run under 400 words. The gates that exist
// (full-levels, band-differentiation, course-band-coverage) hold NEW work to
// the standard and keep the old debt from growing (DR-0418, shrink-only);
// nothing counted the whole library in one place, nothing said which lesson
// waits for which version, and nothing in the app showed it.
//
// PURE. The census runs over the MOUNTED catalog — every course the app
// shows, never a list typed by hand — and answers, per lesson: which of the
// five versions it carries (lib/learn-organize.js lessonVersions, which
// measures real distinct text, never a key's presence) and which of the
// components a lesson is built from it has. The GAP QUEUE is derived from
// the same pass: the lessons still waiting, newest first, each naming what
// it waits for — the order the filling lane works in.
// =============================================================================
import { lessonVersions, READING_VERSIONS } from './learn-organize.js';

/** The components every lesson is built from, and how each is seen. */
export const COMPONENTS = [
  { id: 'lesson', label: 'the lesson', has: (m) => text(m.lesson) || Object.values(m.levels || {}).some(text) },
  { id: 'anchor', label: 'anchor Scripture', has: (m) => text(m.anchor?.ref) },
  { id: 'bigIdea', label: 'the big idea', has: (m) => text(m.bigIdea) },
  { id: 'quiz', label: 'an exam', has: (m) => Array.isArray(m.quiz?.questions) && m.quiz.questions.length > 0 },
  { id: 'benefits', label: 'benefits', has: (m) => Array.isArray(m.benefits) && m.benefits.length > 0 },
  { id: 'talkingPoints', label: 'talking points', has: (m) => Array.isArray(m.facilitator?.talkingPoints) && m.facilitator.talkingPoints.length > 0 },
  { id: 'howToRun', label: 'a run of show', has: (m) => text(m.facilitator?.howToRun) },
  { id: 'inApp', label: 'the in-app step', has: (m) => text(m.inApp) },
];
export const VERSION_IDS = READING_VERSIONS.map((b) => b.id);
/** Under this many adult words a lesson is a note, not a lesson (DR-0418's spirit: the full message). */
export const SHORT_WORDS = 400;

function text(v) { return typeof v === 'string' && v.trim().length > 0; }
function words(s) { return text(s) ? s.trim().split(/\s+/).length : 0; }

/** One lesson's census: what it carries and what it waits for. */
export function censusLesson(m) {
  const versions = lessonVersions(m);
  const missingVersions = VERSION_IDS.filter((v) => !versions.includes(v));
  const missingComponents = COMPONENTS.filter((c) => !c.has(m || {})).map((c) => c.id);
  const adultWords = words(m?.lesson);
  return {
    id: m?.id || '',
    title: String(m?.title || ''),
    added: m?.added || null,
    versions,
    missingVersions,
    missingComponents,
    adultWords,
    short: adultWords > 0 && adultWords < SHORT_WORDS,
    whole: missingVersions.length === 0 && missingComponents.length === 0,
  };
}

/**
 * The whole library: per course and in total, from the mounted catalog.
 * @returns {{ totals, courses, queue }}
 */
export function censusLibrary(courses) {
  const list = Array.isArray(courses) ? courses.filter(Boolean) : [];
  const out = [];
  const totals = { courses: 0, lessons: 0, readings: 0, readingsPossible: 0, whole: 0, allVersions: 0, byVersionCount: {}, missingByVersion: {}, missingByComponent: {}, short: 0 };
  for (const v of VERSION_IDS) totals.missingByVersion[v] = 0;
  for (const c of COMPONENTS) totals.missingByComponent[c.id] = 0;
  const queue = [];
  for (const c of list) {
    const key = c.key || c.meta?.key || '';
    const title = c.meta?.title || key;
    const lessons = (c.schedule || []).filter((m) => m && m.id);
    if (!lessons.length) continue;
    const row = { key, title, lessons: lessons.length, readings: 0, whole: 0, allVersions: 0, missingByVersion: {}, missingByComponent: {}, short: 0, waiting: 0 };
    for (const v of VERSION_IDS) row.missingByVersion[v] = 0;
    for (const comp of COMPONENTS) row.missingByComponent[comp.id] = 0;
    for (const m of lessons) {
      const l = censusLesson(m);
      row.readings += l.versions.length;
      totals.byVersionCount[l.versions.length] = (totals.byVersionCount[l.versions.length] || 0) + 1;
      if (!l.missingVersions.length) row.allVersions += 1;
      if (l.whole) row.whole += 1;
      if (l.short) row.short += 1;
      for (const v of l.missingVersions) row.missingByVersion[v] += 1;
      for (const id of l.missingComponents) row.missingByComponent[id] += 1;
      if (l.missingVersions.length || l.missingComponents.length) {
        row.waiting += 1;
        queue.push({ courseKey: key, courseTitle: title, lessonId: l.id, title: l.title, added: l.added, missingVersions: l.missingVersions, missingComponents: l.missingComponents });
      }
    }
    totals.courses += 1;
    totals.lessons += row.lessons;
    totals.readings += row.readings;
    totals.readingsPossible += row.lessons * VERSION_IDS.length;
    totals.whole += row.whole;
    totals.allVersions += row.allVersions;
    totals.short += row.short;
    for (const v of VERSION_IDS) totals.missingByVersion[v] += row.missingByVersion[v];
    for (const comp of COMPONENTS) totals.missingByComponent[comp.id] += row.missingByComponent[comp.id];
    out.push(row);
  }
  totals.waiting = queue.length;
  // The lane works newest first: a lesson someone just read is the one most
  // likely to be read again in another version; an undated lesson comes last.
  queue.sort((a, b) => String(b.added || '').localeCompare(String(a.added || '')) || a.courseKey.localeCompare(b.courseKey) || a.lessonId.localeCompare(b.lessonId));
  // Courses with the most waiting first, so the table reads as a work list.
  out.sort((a, b) => (b.waiting / b.lessons) - (a.waiting / a.lessons) || b.waiting - a.waiting || a.title.localeCompare(b.title));
  return { totals, courses: out, queue };
}

const VERSION_LABEL = Object.fromEntries(READING_VERSIONS.map((b) => [b.id, b.label]));
const COMPONENT_LABEL = Object.fromEntries(COMPONENTS.map((c) => [c.id, c.label]));
const n = (x) => Number(x || 0).toLocaleString('en-US');

/** "855 lessons in 51 courses · 3,962 of 4,275 readings written · 417 whole in every version and part · 274 waiting". */
export function censusLine(census) {
  const t = census?.totals;
  if (!t || !t.lessons) return 'No lessons mounted, so there is nothing to count.';
  return `${n(t.lessons)} lessons in ${n(t.courses)} courses · ${n(t.readings)} of ${n(t.readingsPossible)} readings written · ${n(t.whole)} whole in every version and part · ${n(t.waiting)} waiting`;
}

/** What one queue entry waits for: "the Youth version; an exam". */
export function waitsFor(entry) {
  const parts = [];
  if (entry?.missingVersions?.length) parts.push(`the ${entry.missingVersions.map((v) => VERSION_LABEL[v]).join(', ')} ${entry.missingVersions.length === 1 ? 'version' : 'versions'}`);
  if (entry?.missingComponents?.length) parts.push(entry.missingComponents.map((id) => COMPONENT_LABEL[id] || id).join(', '));
  return parts.join('; ');
}

/** The totals as counts only, for a public run log or a baseline file. */
export function censusCounts(census) {
  const t = census?.totals || {};
  return {
    lessons: t.lessons || 0,
    readings: t.readings || 0,
    whole: t.whole || 0,
    allVersions: t.allVersions || 0,
    exams: (t.lessons || 0) - ((t.missingByComponent || {}).quiz || 0),
    waiting: t.waiting || 0,
  };
}
