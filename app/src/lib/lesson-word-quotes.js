// =============================================================================
// lesson-word-quotes — the verses a lesson stands on, quoted inside it
// =============================================================================
// Darrell 2026-10-21: "Even the verses of the lessons are not here in these
// courses... Inside each lesson... My family and friends and children will use
// them for clarity." The census (lib/lesson-completeness.js) found lessons that
// name their Scripture in the anchor and never quote it, so a reader had to
// leave the lesson to read it.
//
// lesson-word-quotes.json holds, per course and lesson, the anchor's verses as
// the in-app KJV gives them (app/public/bible/kjv), extracted by script, never
// typed (DR-0076); a long range is quoted for its first six verses and its
// reference says exactly which verses are shown. lesson-word-quotes.test.js
// re-reads the corpus and fails on any character that differs.
//
// withWordQuotes() opens each such lesson, and each of its age bands, with the
// Word, the way the Eternal courses do (DR-0127, the Word first).
// =============================================================================
import QUOTES from './lesson-word-quotes.json';

export const WORD_LEAD = 'The Word, read first:';

/** The quoted lines for one lesson, or [] when it has none on file. */
export function wordQuotesFor(courseKey, lessonId, table = QUOTES) {
  const list = (table[courseKey] || {})[lessonId];
  return Array.isArray(list) ? list.map((q) => `"${q.text}" (${q.ref}, KJV)`) : [];
}

function lead(body, quotes) {
  if (typeof body !== 'string' || !body.trim() || body.startsWith(WORD_LEAD)) return body;
  return `${WORD_LEAD}\n\n${quotes.join('\n\n')}\n\n${body}`;
}

/** One lesson row with its verses opening the lesson and every age band. */
export function withWordFirst(m, quotes) {
  if (!m || !quotes.length) return m;
  const levels = m.levels && typeof m.levels === 'object'
    ? Object.fromEntries(Object.entries(m.levels).map(([k, v]) => [k, lead(v, quotes)]))
    : m.levels;
  return { ...m, lesson: lead(m.lesson, quotes), ...(levels ? { levels } : {}) };
}

/** Every mounted course, its quoted lessons opened with the Word. */
export function withWordQuotes(courses, table = QUOTES) {
  return (courses || []).map((c) => {
    const key = c && (c.key || (c.meta && c.meta.key));
    if (!key || !table[key] || !Array.isArray(c.schedule)) return c;
    return { ...c, schedule: c.schedule.map((m) => withWordFirst(m, wordQuotesFor(key, m && m.id, table))) };
  });
}
