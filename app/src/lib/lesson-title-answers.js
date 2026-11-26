// =============================================================================
// lesson-title-answers — every lesson answers the question its title asks
// =============================================================================
// Darrell 2026-11-26, from the new-look reader: "This lesson is not clear... it
// has a great title... it doesn't answer really." Then: "The titles pull people
// into the lessons!!!!!! That worked.... I just needed to feel full after
// reading the lesson." And: "Make sure the lessons are still kept however make
// sure the also addresses the questions." (DR-1687)
//
// The 976 presented lessons carry a reader-facing title (presentation-records
// .json `displayTitle`), most of them a QUESTION, written after the lessons
// were. An audit read every lesson against its title
// (docs/99-session-notes/2026-11-26-lessons-answer-their-titles-audit.md).
// Where a lesson did not answer plainly and early, and end answered, this layer
// wraps the author's text, which is shown word for word between:
//
//   THE QUESTION IN THE TITLE.  the title's question, answered plainly, first;
//   the author's lesson         unchanged (a paragraph break is placed before
//                               each of its own ALL-CAPS section leads so they
//                               read as headings; no word changes);
//   an example (optional)       one short worked example in the lesson's terms;
//   the lesson's stories        untouched, in their order;
//   BACK TO THE QUESTION.       the answer landed AFTER the stories, so the
//                               last thing read is the payoff (titleClosing).
//
// The teen and senior versions get their own opening and closing sentence in
// their own register. Additions draw only on what the lesson teaches and the
// verses it already cites; any quotation in them is checked, character for
// character, against the lesson's own text (lesson-title-answers.test.js).
//
// Layered in ChurchLearn's mount (beside withWordQuotes and withSideStories),
// so the author's rows stay byte-identical and the integrity baseline holds.
// A lesson the author has already given this opening in its own source
// (buy2-two-sets-of-weights-in-one-bag) is recognised and never doubled.
// =============================================================================

export const TITLE_LEAD = 'THE QUESTION IN THE TITLE.';
export const CLOSE_LEAD = 'BACK TO THE QUESTION.';
export const VERDICTS = ['ANSWERS-CLEARLY', 'ANSWERS-LATE-OR-BURIED', 'DOES-NOT-ANSWER', 'ANSWERS-BUT-ENDS-OPEN'];

const FILES = import.meta.glob('./lesson-title-answers/*.json', { eager: true, import: 'default' });

/** { courseKey: { lessonId: entry } } from the per-course files. */
export const TITLE_ANSWERS = Object.fromEntries(
  Object.entries(FILES).map(([path, table]) => [path.replace(/^.*\/([^/]+)\.json$/, '$1'), table]),
);

export function titleAnswerFor(courseKey, lessonId, table = TITLE_ANSWERS) {
  const e = (table[courseKey] || {})[lessonId];
  return e && typeof e === 'object' ? e : null;
}

const own = (v) => (typeof v === 'string' && v.trim() ? v : null);
/** The band the adult reader falls back to when a lesson has no adult text (LessonExperience textFor). */
export const ADULT_FALLBACK = ['senior', 'teen', 'youth', 'child'];

/**
 * Place a paragraph break before each of the author's own ALL-CAPS section
 * leads ("WHY BAN POSSESSION RATHER THAN USE? Because ...") that sits mid-
 * paragraph. Conservative: a lead is two or more capitalised words (10+
 * letters), starts after a sentence end, ends in . ? or !, and is not inside a
 * quotation. Only whitespace changes; every word stays.
 */
export function breakAtLeads(text) {
  if (!own(text)) return text;
  return text.replace(/([.!?]["”’)]?) ([A-Z][A-Z,'’:-]*(?: [A-Z][A-Z,'’:-]*)+[.?!])(?= [A-Z"“])/g, (all, end, lead, offset, whole) => {
    if (lead.replace(/[^A-Z]/g, '').length < 10) return all;
    const before = whole.slice(0, offset + end.length);
    const straight = (before.match(/"/g) || []).length;
    const opens = (before.match(/“/g) || []).length;
    const closes = (before.match(/”/g) || []).length;
    if (straight % 2 === 1 || opens > closes) return all;
    return `${end}\n\n${lead}`;
  });
}

const join = (...parts) => parts.filter((p) => own(p)).join('\n\n');

/**
 * One lesson row with its title answered, or the row unchanged. The opening
 * (and any example) join the reading itself; the closing is held apart on
 * `titleClosing`, keyed by the version it belongs to ('adult' for the top-level
 * `lesson`, else the band key), because it is read AFTER the lesson's stories:
 * the last thing read is the payoff (Darrell: "I just needed to feel full").
 */
export function withTitleAnswer(m, entry) {
  if (!m || !entry || entry.verdict === 'ANSWERS-CLEARLY' || !own(entry.close)) return m;
  const levels = m.levels && typeof m.levels === 'object' ? m.levels : null;
  const adultKey = own(m.lesson) ? 'lesson' : ADULT_FALLBACK.find((k) => levels && own(levels[k])) || null;
  if (!adultKey) return m;
  const adultText = adultKey === 'lesson' ? m.lesson : levels[adultKey];
  if (adultText.startsWith(TITLE_LEAD)) return m; // the author wrote it into the lesson itself
  const adult = join(entry.open, breakAtLeads(adultText), entry.example);
  const titleClosing = { [adultKey === 'lesson' ? 'adult' : adultKey]: entry.close };
  let nextLevels = levels;
  if (levels) {
    nextLevels = { ...levels };
    for (const band of ['teen', 'senior']) {
      if (band === adultKey || !own(levels[band]) || !entry[band]) continue;
      nextLevels[band] = join(entry[band].open, levels[band]);
      if (own(entry[band].close)) titleClosing[band] = entry[band].close;
    }
    if (adultKey !== 'lesson') nextLevels[adultKey] = adult;
  }
  return { ...m, ...(adultKey === 'lesson' ? { lesson: adult } : {}), ...(nextLevels ? { levels: nextLevels } : {}), titleClosing };
}

/**
 * Which version a reading is drawn from: 'adult' (the top-level `lesson`) or a
 * band key. `level` is the band asked for ('adult' or a band key); it mirrors
 * the reader's own choice (LessonExperience textFor; learn-framework
 * resolveForAge): the band's own text, else the adult lesson, else the
 * richest band the lesson carries.
 */
export function readingKeyFor(m, level) {
  if (!m) return null;
  const levels = m.levels && typeof m.levels === 'object' ? m.levels : {};
  if (level && level !== 'adult' && own(levels[level])) return level;
  if (own(m.lesson)) return 'adult';
  return ADULT_FALLBACK.find((k) => own(levels[k])) || null;
}

/** The closing read after the stories for this version, or ''. */
export function titleClosingFor(m, level) {
  const c = m && m.titleClosing;
  if (!c) return '';
  return own(c[readingKeyFor(m, level)]) || '';
}

/** Every mounted course, each lesson answering its title. */
export function withTitleAnswers(courses, table = TITLE_ANSWERS) {
  return (courses || []).map((c) => {
    const key = c && (c.key || (c.meta && c.meta.key));
    if (!key || !table[key] || !Array.isArray(c.schedule)) return c;
    return { ...c, schedule: c.schedule.map((m) => withTitleAnswer(m, titleAnswerFor(key, m && m.id, table))) };
  });
}

// ---------------------------------------------------------------------------
// The checks every entry must pass (the gate, lesson-title-answers.test.js).
// ---------------------------------------------------------------------------
const words = (s) => (s || '').split(/\s+/).filter(Boolean).length;
const plain = (s) => String(s || '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, ' ');
const quoted = (s) => [...plain(s).matchAll(/"([^"]{4,})"/g)].map((m) => m[1].trim());
const unquoted = (s) => plain(s).replace(/"[^"]*"/g, ' ');
const SECTION_LEAD = /^[A-Z][A-Z ,'’:-]{2,90}?\. /;

/** Every problem with one entry, read against the author's own adult text. [] = sound. */
export function entryProblems(entry, authorText) {
  const out = [];
  if (!entry || typeof entry !== 'object') return ['no entry'];
  if (!VERDICTS.includes(entry.verdict)) out.push(`verdict "${entry.verdict}" is not one of ${VERDICTS.join(', ')}`);
  if (typeof entry.reason !== 'string' || entry.reason.trim().length < 15 || /\n/.test(entry.reason)) out.push('reason must be one line of 15+ characters');
  const text = plain(authorText);
  const field = (label, s, lead, lo, hi) => {
    if (typeof s !== 'string') return out.push(`${label} missing`);
    if (lead && !s.startsWith(`${lead} `)) out.push(`${label} must open "${lead}"`);
    const w = words(s);
    if (w < lo || w > hi) out.push(`${label} is ${w} words, not ${lo}-${hi}`);
    if (/\n/.test(s)) out.push(`${label} must be one paragraph`);
    for (const q of quoted(s)) if (!text.includes(q)) out.push(`${label} quotes words the lesson does not hold: "${q.slice(0, 60)}"`);
    const o = unquoted(s);
    if (/\bGod\b/.test(o)) out.push(`${label} says "God" in our voice; say Yahweh (quotes are left as written)`);
    if (/\b(Satan|Lucifer|Devil|Baal|Dragon|Adversary|Accuser|Deceiver)\b/.test(o)) out.push(`${label} capitalizes an adversary name`);
  };
  if (entry.verdict === 'ANSWERS-CLEARLY') {
    for (const k of ['open', 'example', 'close', 'teen', 'senior']) if (entry[k] != null) out.push(`ANSWERS-CLEARLY carries ${k}`);
    return out;
  }
  if (entry.verdict !== 'ANSWERS-BUT-ENDS-OPEN' || entry.open != null) field('open', entry.open, TITLE_LEAD, 25, 120);
  field('close', entry.close, CLOSE_LEAD, 25, 120);
  if (entry.example != null) {
    field('example', entry.example, null, 30, 150);
    if (!SECTION_LEAD.test(entry.example)) out.push('example must open with its own ALL-CAPS lead');
  }
  for (const band of ['teen', 'senior']) {
    const b = entry[band];
    if (!b || typeof b !== 'object') { out.push(`${band} opening/closing missing`); continue; }
    if (entry.verdict !== 'ANSWERS-BUT-ENDS-OPEN' || b.open != null) field(`${band}.open`, b.open, null, 10, 70);
    field(`${band}.close`, b.close, null, 10, 70);
  }
  return out;
}
