// =============================================================================
// learn-organize — the Learn catalog, findable (Darrell 2026-07-10: "can we
// better organize the learn lessons with sorts and dropdowns etc")
// =============================================================================
// 18 courses · 200+ lessons had ONE affordance: a wall of stacked buttons the
// reader scrolls past before any content. This module is the pure organizing
// layer under the picker: grouped for a native dropdown (one tap opens the
// phone's own picker UI) and sortable. Everything DERIVES from the mounted
// course descriptors — group membership from the course's own key family,
// lesson counts from the live schedules, never a hand-kept list (DR-0121).
//
// Pure + dependency-free — unit-tested in learn-organize.test.js.

import { plainWordsFor } from './learn-plain-words.js';

// EVERY ORDER THE APP KNOWS, AT THE COURSE LEVEL (DR-0686). Darrell
// 2026-09-29, two screenshots of Learn: "Can we make the top sort work to do
// all sorting options? Also the latest created lessons?" The top sort had four
// orders while the lesson list inside a course had others; now the top sort
// carries every order whose DATA exists, applied to courses:
//   - titles and lesson counts: the course descriptors themselves;
//   - "Recently added": the newest recorded day among a course's lessons
//     (m.added — a real commit day per lesson: living-lessons-dates.js, and
//     for every other course lesson-dates.js, DR-0687);
//   - "Recently opened by you" and the progress orders: this device's saved
//     places (lib/learn-resume.js) and the signed-in lesson record (progress).
// An order whose data is absent is not offered (courseSortsFor), so the list
// never holds a control that silently does nothing. Ties keep course order.
// `needs` names the data an order reads; courseSortsFor checks it.
export const COURSE_SORTS = [
  { key: 'authored', label: 'Course order' },
  { key: 'title', label: 'A to Z' },
  { key: 'title-desc', label: 'Z to A' },
  { key: 'lessons-desc', label: 'Most lessons' },
  { key: 'lessons-asc', label: 'Fewest lessons first' },
  { key: 'added-newest', label: 'Recently added', needs: 'dated' },
  { key: 'added-oldest', label: 'Oldest first', needs: 'dated-many' },
  { key: 'opened', label: 'Recently opened by you', needs: 'opened' },
  { key: 'in-progress', label: 'In progress first', needs: 'progress' },
  { key: 'not-started', label: 'Not started first', needs: 'progress' },
  { key: 'completed', label: 'Completed first', needs: 'progress' },
  { key: 'latest', label: 'Latest lessons, every course', needs: 'dated' },
];
export const DEFAULT_COURSE_SORT = 'authored';

export function courseLessonCount(course) {
  return (course && course.schedule && course.schedule.length) || 0;
}

// The Eternal-Algorithms processing family is detectable from its own keys
// (buildEternalProcessingCourses emits `eternal-…`) — a structural fact, not a
// hand-tagged list, so a new processing course joins its group automatically.
export function isDeepProcessing(course) {
  return String((course && course.key) || '').startsWith('eternal-');
}

const ISO_DAY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
/** A lesson's recorded day ('YYYY-MM-DD'), or null. Never a cohort date — `added` only. */
export function lessonAdded(m) {
  const d = m && m.added;
  return typeof d === 'string' && ISO_DAY.test(d) ? d : null;
}

/** The newest and oldest recorded days among a course's lessons; nulls when it records none. */
export function courseAddedSpan(course) {
  let newest = null;
  let oldest = null;
  for (const m of ((course && course.schedule) || [])) {
    const d = lessonAdded(m);
    if (!d) continue;
    if (!newest || d > newest) newest = d;
    if (!oldest || d < oldest) oldest = d;
  }
  return { newest, oldest };
}

// A lesson counts as done when the signed-in record says so (progress, keyed
// by lesson id) or this device finished reading it (a place marked done); it
// counts as begun when a place shows it opened and not finished.
function placeBegun(p) {
  return !!p && p.done !== true && (p.started === true || p.stage > 0 || p.step > 0 || !!p.sentenceKey);
}

/**
 * Where the reader stands in a course, from real records only:
 * { state: 'not-started' | 'in-progress' | 'completed', done, begun, lastOpened }.
 * `places` is lib/learn-resume.js listPlaces(); `progress` the lesson record.
 */
export function courseStanding(course, { places = [], progress = {} } = {}) {
  const key = course && course.key;
  const schedule = (course && course.schedule) || [];
  const mine = (Array.isArray(places) ? places : []).filter((p) => p && p.courseKey === key);
  const doneIds = new Set(mine.filter((p) => p.done === true).map((p) => p.lessonId));
  let done = 0;
  for (const m of schedule) if (m && m.id && (doneIds.has(m.id) || (progress && progress[m.id]))) done += 1;
  const begun = mine.filter(placeBegun).length;
  const lastOpened = mine.reduce((t, p) => Math.max(t, typeof p.at === 'number' ? p.at : 0), 0) || null;
  const state = schedule.length && done >= schedule.length ? 'completed' : (done || begun ? 'in-progress' : 'not-started');
  return { state, done, begun, lastOpened };
}

/** The orders this catalog can honestly offer — an order whose data is absent is left out. */
export function courseSortsFor(courses, ctx = {}) {
  const list = Array.isArray(courses) ? courses.filter(Boolean) : [];
  const dated = list.filter((c) => courseAddedSpan(c).newest).length;
  const standings = list.map((c) => courseStanding(c, ctx));
  const has = {
    dated: dated >= 1,
    // With one dated course, oldest-first is the same list as recently-added;
    // it is offered once a second course records its days.
    'dated-many': dated >= 2,
    opened: standings.some((s) => s.lastOpened),
    progress: standings.some((s) => s.state !== 'not-started'),
  };
  return COURSE_SORTS.filter((o) => !o.needs || has[o.needs]);
}

// Newest/oldest/most-recent keys, with the courses that lack the fact AFTER the
// ones that have it (in course order) — an undated course is never guessed in.
const byFact = (fact, dir) => (a, b) => {
  const fa = fact(a);
  const fb = fact(b);
  if (fa == null && fb == null) return 0;
  if (fa == null) return 1;
  if (fb == null) return -1;
  if (fa === fb) return 0;
  return (fa < fb ? -1 : 1) * dir;
};
const STANDING_RANK = {
  'in-progress': { 'in-progress': 0, 'not-started': 1, completed: 2 },
  'not-started': { 'not-started': 0, 'in-progress': 1, completed: 2 },
  completed: { completed: 0, 'in-progress': 1, 'not-started': 2 },
};
const titleOf = (c) => String(c.meta?.title || '');

export function sortCourses(list, sortKey, ctx = {}) {
  const c = [...(Array.isArray(list) ? list : [])];
  switch (sortKey) {
    case 'title':
      return c.sort((a, b) => titleOf(a).localeCompare(titleOf(b)));
    case 'title-desc':
      return c.sort((a, b) => titleOf(b).localeCompare(titleOf(a)));
    case 'lessons-desc':
      return c.sort((a, b) => courseLessonCount(b) - courseLessonCount(a));
    case 'lessons-asc':
      return c.sort((a, b) => courseLessonCount(a) - courseLessonCount(b));
    case 'added-newest':
    case 'latest':
      return c.sort(byFact((x) => courseAddedSpan(x).newest, -1));
    case 'added-oldest':
      return c.sort(byFact((x) => courseAddedSpan(x).oldest, 1));
    case 'opened':
      return c.sort(byFact((x) => courseStanding(x, ctx).lastOpened, -1));
    case 'in-progress':
    case 'not-started':
    case 'completed': {
      const rank = STANDING_RANK[sortKey];
      return c.sort((a, b) => rank[courseStanding(a, ctx).state] - rank[courseStanding(b, ctx).state]);
    }
    default:
      return c; // 'authored' — the registry's own order
  }
}

// THE LATEST LESSONS, EVERY COURSE (DR-0686; "Also the latest created
// lessons?"). Every lesson in the mounted catalog that carries a recorded day,
// newest first (same day: higher lesson number first, then course order), each
// naming its HOME course so a tap opens it there. A lesson without a recorded
// day is left out and counted (and named in `undatedLessons`), never dated by
// guess (DR-0076). Since DR-0687 every course carries its days
// (lib/lesson-dates.js), so this is the whole catalog.
export function latestLessons(courses) {
  const list = Array.isArray(courses) ? courses.filter(Boolean) : [];
  const rows = [];
  const undatedLessons = [];
  let undated = 0;
  list.forEach((c, ci) => {
    (c.schedule || []).forEach((m, mi) => {
      if (!m || !m.id) return;
      const added = lessonAdded(m);
      if (!added) { undated += 1; undatedLessons.push({ courseKey: c.key, lessonId: m.id }); return; }
      const num = /^[a-z]+(\d+)-/i.exec(String(m.id));
      rows.push({ courseKey: c.key, courseTitle: titleOf(c) || String(c.key || ''), lessonId: m.id, title: String(m.title || ''), added, n: num ? Number(num[1]) : null, versions: lessonVersions(m).length, ci, mi });
    });
  });
  rows.sort((a, b) => (a.added !== b.added ? (a.added < b.added ? 1 : -1)
    : ((b.n ?? -1) - (a.n ?? -1)) || (a.ci - b.ci) || (a.mi - b.mi)));
  const courseCount = new Set(rows.map((r) => r.courseKey)).size;
  return { rows, undated, undatedLessons, courseCount };
}

/**
 * The Latest lessons header line (DR-0687): how many lessons are listed, across
 * how many courses, and any left out, with why. `reasonOf(courseKey, id)` is
 * the generator's recorded reason (lesson-dates.js undatedReason) — a lesson
 * with none is simply newer than the last time the dates were derived.
 */
export function latestCountLine({ rows, undatedLessons = [], courseCount }, reasonOf = () => null) {
  const n = rows.length;
  const where = `${courseCount} ${courseCount === 1 ? 'course' : 'courses'}, each on the day it was first added to the app`;
  if (!undatedLessons.length) return `All ${n} ${n === 1 ? 'lesson' : 'lessons'} across ${where}.`;
  const untraced = undatedLessons.filter((u) => reasonOf(u.courseKey, u.lessonId)).length;
  const fresh = undatedLessons.length - untraced;
  const parts = [];
  if (fresh) parts.push(`${fresh} too new to have ${fresh === 1 ? 'its day' : 'their days'} recorded yet`);
  if (untraced) parts.push(`${untraced} whose first day the record cannot trace`);
  return `${n} ${n === 1 ? 'lesson' : 'lessons'} across ${where} · ${undatedLessons.length} not listed: ${parts.join(', ')}.`;
}

// THE AGE VERSIONS EACH LESSON REALLY CARRIES (DR-0715; Darrell 2026-09-30:
// "is the lesson count 349 or is that with every variation based on the age
// number? I want both so it shows the scale... they will know their children
// can read the same content in their age groups cognitive language and paced
// for them too."). The reader's band picker (learn-framework.js AGE_BANDS)
// offers Child, Youth, Teen, Adult and Senior; resolveForAge serves a band its
// OWN authored text when `levels[key]` holds one, and otherwise falls back to
// another band's text. A fallback is not a version, so it is never counted:
// a band counts only when its own text is a non-empty string, and only when
// that text is not a copy of a version already counted (the adult text handed
// to a child under a child label is still one version). The Adult version is
// `levels.standard` when authored, else the top-level `lesson` (resolveForAge:
// "THE TOP-LEVEL `lesson` IS THE ADULT VERSION"). Nothing is assumed from a
// course's reputation or a band's presence as a key (DR-0076).
export const READING_VERSIONS = [
  { id: 'child', label: 'Child', key: 'child' },
  { id: 'youth', label: 'Youth', key: 'youth' },
  { id: 'teen', label: 'Teen', key: 'teen' },
  { id: 'adult', label: 'Adult', key: 'standard' },
  { id: 'senior', label: 'Senior', key: 'senior' },
];

const versionText = (v) => (typeof v === 'string' ? v.trim() : '');
// Two texts that differ only in spacing are one version. The whole texts are
// compared only when their openings already match with spaces dropped, so two
// different versions (the common case) never pay for a rewrite of the lesson.
const bare = (t) => t.replace(/\s+/g, '');
function sameVersion(a, b) {
  if (a === b) return true;
  const pa = bare(a.slice(0, 400));
  const pb = bare(b.slice(0, 400));
  const n = Math.min(pa.length, pb.length, 120);
  if (pa.slice(0, n) !== pb.slice(0, n)) return false;
  return bare(a) === bare(b);
}

// Learn re-dates its courses on every render (withLessonDates spreads each
// lesson), but a lesson's `levels` object is carried through untouched, so the
// answer is kept against that object and re-checked against the adult text.
const VERSIONS_CACHE = new WeakMap();

/** The age versions a lesson really carries, by band id, in picker order. */
export function lessonVersions(m) {
  if (!m || typeof m !== 'object') return [];
  const hasLevels = m.levels && typeof m.levels === 'object';
  if (!hasLevels) return versionText(m.lesson) ? ['adult'] : [];
  const hit = VERSIONS_CACHE.get(m.levels);
  if (hit && hit.lesson === m.lesson) return hit.ids.slice();
  const ids = measureVersions(m, m.levels);
  VERSIONS_CACHE.set(m.levels, { lesson: m.lesson, ids });
  return ids.slice();
}

function measureVersions(m, levels) {
  const textOf = (b) => versionText(levels[b.key]) || (b.id === 'adult' ? versionText(m.lesson) : '');
  // The adult text is counted first, so a band that merely repeats it is seen as the copy it is.
  const adult = READING_VERSIONS.find((b) => b.id === 'adult');
  const order = [adult, ...READING_VERSIONS.filter((b) => b !== adult)];
  const seen = [];
  const have = new Set();
  for (const b of order) {
    const t = textOf(b);
    if (!t || seen.some((s) => sameVersion(s, t))) continue;
    seen.push(t);
    have.add(b.id);
  }
  return READING_VERSIONS.filter((b) => have.has(b.id)).map((b) => b.id);
}

const YOUNGER = new Set(['child', 'youth', 'teen']);

/**
 * Every age version across a list of lessons: the total, how many of each
 * band, and how many lessons carry a child, youth or teen version of their own.
 */
export function countReadings(lessons) {
  const byBand = Object.fromEntries(READING_VERSIONS.map((b) => [b.id, 0]));
  let readings = 0;
  let lessonCount = 0;
  let younger = 0;
  for (const m of Array.isArray(lessons) ? lessons : []) {
    if (!m || !m.id) continue;
    lessonCount += 1;
    const ids = lessonVersions(m);
    for (const id of ids) { byBand[id] += 1; readings += 1; }
    if (ids.some((id) => YOUNGER.has(id))) younger += 1;
  }
  return { lessons: lessonCount, readings, byBand, younger };
}

/** The same count over every lesson of every course. */
export function catalogReadings(courses) {
  const list = Array.isArray(courses) ? courses.filter(Boolean) : [];
  return countReadings(list.flatMap((c) => c.schedule || []));
}

/** Plain count words: 2,917 rather than 2917. */
export function countWords(n) {
  return Number(n || 0).toLocaleString('en-US');
}

/**
 * The scale line: every age version counted, naming only the bands that
 * really hold at least one version.
 */
export function readingsLine({ readings, byBand }) {
  const bands = READING_VERSIONS.filter((b) => byBand && byBand[b.id] > 0).map((b) => b.label.toLowerCase());
  return `${countWords(readings)} ${readings === 1 ? 'reading' : 'readings'} counting every age version (${bands.join(', ')})`;
}

/**
 * What the second number means, in one plain sentence, and only as far as it
 * is true: "Most" when more than half the lessons carry a child, youth or teen
 * version of their own, "Some" when fewer do, and nothing when none do.
 */
export function readingsMeaning({ lessons, younger }) {
  if (!younger) return '';
  const share = younger * 2 > lessons ? 'Most' : 'Some';
  return `${share} lessons are written again for younger readers, so a child can read the same lesson in words and at a pace that fit them.`;
}

/** Each month heading's reading total: the sum of the `versions` of the rows under it. */
export function monthReadings(items) {
  const out = {};
  let key = null;
  for (const it of Array.isArray(items) ? items : []) {
    if (it && it.heading) { key = it.heading.key; out[key] = out[key] || 0; continue; }
    if (key && it) out[key] += Number(it.versions) || 0;
  }
  return out;
}

// THE SCHOOL (DR-0432; Darrell 2026-09-15: "Add the Courses as a tab with
// lessons depending on the courses as usual... making it look like a college
// and/or elementary school educational program"). Learn is one program made
// of DEPARTMENTS, and a department is DERIVED from the one registry: the
// course's own meta.category (DR-0149), with the Eternal-Algorithms family
// detected from its key. Nothing here is a hand-kept list — a course given a
// new category opens a new department on the next build, and a department
// with no course does not exist (DR-0121: never painted). A course that
// declares no category sits in General Studies, so the plain Courses tab (the
// whole catalog) can never collide with a department of the same name.
export function courseDepartment(course) {
  if (isDeepProcessing(course)) return 'The Eternal Algorithms';
  const c = course && course.meta && course.meta.category;
  return typeof c === 'string' && c.trim() ? c.trim() : 'General Studies';
}

export function departmentId(label) {
  return String(label || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// A short catalog code for a department, from its own name: the initials of
// its capitalized words ("The Word & The Way" -> WW, "Kingdom Life &
// Stewardship" -> KLS, "A.I. The Way" -> AW), or the first three letters when
// the name is one word ("Mathematics" -> MAT). Derived, so it can never drift
// from the label it abbreviates.
export function departmentCode(label) {
  // A DOTTED INITIALISM IS ITS OWN CODE (DR-0447). Darrell 2026-09-16, reading
  // the live shelf: "Should a section be call Ai - ?" — "A.I. The Way" reduced
  // to "AW", first initials of A.I. and Way, which names nothing a reader
  // recognizes. When the label already contains an initialism, those letters
  // ARE the abbreviation: "A.I. The Way" -> AI. Still derived from the label.
  const dotted = String(label || '').split(/\s+/).find((w) => /^(?:[A-Za-z]\.){2,}$/.test(w));
  if (dotted) return dotted.replace(/[^A-Za-z]/g, '').toUpperCase();
  const words = String(label || '').split(/\s+/).map((w) => w.replace(/[^A-Za-z]/g, '')).filter(Boolean);
  const sig = words.filter((w) => /^[A-Z]/.test(w) && !/^(The|A|An)$/.test(w));
  if (sig.length >= 2) return sig.map((w) => w[0]).join('').toUpperCase();
  const one = sig[0] || words[0] || 'CRS';
  return one.slice(0, 3).toUpperCase();
}

// Every department of the mounted catalog, each with its courses in authored
// order and a course code per course (department code + a number from its
// authored position, 101 upward — the catalog reads like a college's). The
// departments are ORDERED by how much they teach (total lessons, descending;
// ties keep first-seen order) — a derived order, never a hand-sorted one, so
// the Word course, which carries the most lessons, leads by weight.
// WHERE A DEPARTMENT SITS WHEN WEIGHT IS THE WRONG ANSWER (DR-0447). Darrell
// 2026-09-16: "Most people want Ai understanding built in their curriculum also
// make the tab after eternal algorithms". Ordering by lessons taught is right
// for a catalog and wrong for a department a reader is meant to FIND: A.I. The
// Way carries 35 lessons and by weight falls behind every larger shelf, at the
// scroll edge of the tab strip. So one declared adjacency — read as "place this
// department immediately after that one" — is applied over the derived order.
// It is a DECISION (a placement Darrell named), not painted data: a department
// named here that is not mounted simply has nowhere to go, and the weight order
// still decides everything else.
export const DEPARTMENT_AFTER = { 'A.I. The Way': 'The Eternal Algorithms' };

export function placeDepartments(sorted) {
  const out = [...(Array.isArray(sorted) ? sorted : [])];
  for (const [label, after] of Object.entries(DEPARTMENT_AFTER)) {
    const from = out.findIndex((d) => d && d.label === label);
    if (from < 0) continue;
    if (!out.some((d) => d && d.label === after)) continue;
    const [moved] = out.splice(from, 1);
    const anchor = out.findIndex((d) => d && d.label === after);
    out.splice(anchor + 1, 0, moved);
  }
  return out;
}

export function learnDepartments(courses) {
  const list = Array.isArray(courses) ? courses.filter(Boolean) : [];
  const byLabel = new Map();
  for (const c of list) {
    const label = courseDepartment(c);
    if (!byLabel.has(label)) byLabel.set(label, { id: departmentId(label), label, code: departmentCode(label), courses: [], lessons: 0 });
    const d = byLabel.get(label);
    d.courses.push({ ...c, code: `${d.code}-${101 + d.courses.length}`, department: label });
    d.lessons += courseLessonCount(c);
  }
  return placeDepartments([...byLabel.values()].sort((a, b) => b.lessons - a.lessons));
}

// Group + sort for the picker: one group per department (DR-0149), in the
// department order above, each sorted by the reader's chosen sort. Empty
// groups cannot exist (a department is made of its courses).
export function organizeCourses(courses, sortKey = 'authored', ctx = {}) {
  return learnDepartments(courses).map((d) => ({ label: d.label, code: d.code, courses: sortCourses(d.courses, sortKey, ctx) }));
}

// =============================================================================
// LESSON FINDER (Darrell 2026-08-18: "We need a better way to look up and
// review the available lessons... not obvious how to find a lesson unless you
// already know the course it is in") — the cross-course lesson index + search.
// Same law as the picker: everything DERIVES from the mounted course
// descriptors (DR-0121) — titles, anchors, counts all read live, never a
// hand-kept list. Pure + dependency-free; unit-tested beside the picker.
// =============================================================================

// Flatten every mounted course's live schedule into one searchable index.
// Each entry carries what the results list renders and what search matches:
// course identity, lesson identity, and a lowercase haystack of title +
// unitNounOf — the singular noun for a course's unit, from either shape.
// Exported so the fix is testable on its own and can never silently regress to
// String(anObject).
export function unitNounOf(unit) {
  if (unit && typeof unit === 'object') {
    return String(unit.noun || unit.cap || 'week');
  }
  return String(unit || 'week');
}

// big idea + anchor ref/theme + tags + the course's PLAIN WORDS.
//
// Darrell 2026-09-19: "broad connections made by simple word choices" — the
// titles he likes stay exactly as they are, and the everyday word rides
// alongside so somebody thinking `money` reaches Kingdom Economics, whose
// title contains no such word. The words are declared per course in
// learn-plain-words.js and folded into every one of that course's lessons here,
// which is what makes the connection real rather than decorative.
export function buildLessonIndex(courses) {
  const list = Array.isArray(courses) ? courses.filter(Boolean) : [];
  const out = [];
  for (const c of list) {
    const courseTitle = String(c.meta?.title || c.key || '');
    // A course's `unit` comes in TWO real shapes: a plain noun ('week'), and the
    // richer descriptor the Deep Processing courses carry
    // ({ noun: 'pattern', cap: 'Pattern', … } — eternal-algorithms-course.js).
    // String()-ing the object produced "[object Object] 1 · Deuteronomy 30:19"
    // on every one of those rows — and they are the MAJORITY of the shelf
    // (six Deep Processing courses, ~149 of 169 lessons). Caught 2026-09-11 in
    // the rendered text of a Learn render test, not by reading the code.
    const unitNoun = unitNounOf(c.meta?.unit);
    const plain = plainWordsFor(c.key).join(' ').toLowerCase();
    for (const m of (c.schedule || [])) {
      if (!m || !m.id) continue;
      const title = String(m.title || '');
      const ref = String(m.anchor?.ref || '');
      const hayBody = [
        m.bigIdea, m.anchor?.theme, Array.isArray(m.tags) ? m.tags.join(' ') : '',
      ].filter(Boolean).join(' ').toLowerCase() + (plain ? ` ${plain}` : '');
      out.push({
        courseKey: c.key,
        courseTitle,
        deep: isDeepProcessing(c),
        unitLabel: `${unitNoun.charAt(0).toUpperCase()}${unitNoun.slice(1)} ${m.week ?? ''}`.trim(),
        lessonId: m.id,
        title,
        ref,
        theme: String(m.anchor?.theme || ''),
        hayTitle: title.toLowerCase(),
        hayRef: ref.toLowerCase(),
        hayBody,
      });
    }
  }
  return out;
}

// Tokenized AND search over the index: every query token must match the entry
// somewhere (title, anchor ref, or body). Ranked so what a person types is
// what they meant: all-tokens-in-title first, then anchor-ref hits (a verse
// reference FINDS its lesson — "2 corinthians 7" works), then body matches.
// Ties keep catalog order. Empty/blank queries return [] (the finder is an
// answer to a question, never a second wall of rows).
export function searchLessons(index, query, limit = 40) {
  const tokens = String(query || '').toLowerCase().split(/[^a-z0-9:]+/).filter(Boolean);
  if (!tokens.length) return [];
  const scored = [];
  for (let i = 0; i < index.length; i++) {
    const e = index[i];
    let inTitle = 0, inRef = 0, inAny = 0;
    for (const t of tokens) {
      const hitTitle = e.hayTitle.includes(t);
      const hitRef = e.hayRef.includes(t);
      const hitBody = e.hayBody.includes(t);
      if (hitTitle) inTitle++;
      if (hitRef) inRef++;
      if (hitTitle || hitRef || hitBody) inAny++;
    }
    if (inAny < tokens.length) continue; // AND semantics: every token must land
    const rank = inTitle === tokens.length ? 3 : (inRef > 0 ? 2 : 1);
    scored.push({ rank, i, e });
  }
  scored.sort((a, b) => (b.rank - a.rank) || (a.i - b.i));
  return scored.slice(0, limit).map((s) => s.e);
}

// BROWSING NEEDS NO COURSE AND NO QUERY.
// ===========================================================================
// Christina, 2026-08-31, on the live Learn tab: "How do I get to the rest of
// the lessons?" — looking at eight weeks of one course with 401 mounted.
// Darrell, tracing it: "you must choose a course first to get to the lists
// lessons unless you type a name etc.. how can this be better?"
//
// That was the shape of the catalog, and it is exactly one line above: the
// finder answers a QUESTION, so a blank box returned nothing, and the only
// other door was a 22-option course dropdown. Both doors demand you already
// know something — a word to type, or which course holds the lesson. A reader
// who knows neither (the reader this platform is FOR) had no way in at all.
//
// So the blank state stops being a wall and becomes the shelf: every lesson in
// the app, grouped under its course, in catalog order. Typing then NARROWS what
// is already visible instead of summoning it out of nothing. Search stays
// exactly as it was — this is the state before anyone types.
//
// Grouping is derived from the index rows themselves (never a hand-kept list,
// DR-0121), and course order follows first appearance so the catalog's own
// order is what a reader sees. Pure; no DOM, no React.
//
// @param {Array} index - rows from buildLessonIndex
// @returns {Array<{courseKey, courseTitle, deep, lessons: Array}>}
export function browseLessons(index) {
  const rows = Array.isArray(index) ? index.filter((r) => r && r.lessonId) : [];
  const groups = [];
  const byKey = new Map();
  for (const r of rows) {
    let g = byKey.get(r.courseKey);
    if (!g) {
      g = { courseKey: r.courseKey, courseTitle: r.courseTitle, deep: !!r.deep, lessons: [] };
      byKey.set(r.courseKey, g);
      groups.push(g);
    }
    g.lessons.push(r);
  }
  return groups;
}

/** How many lessons a browse result holds, across every course. */
export function browseCount(groups) {
  return (Array.isArray(groups) ? groups : []).reduce((t, g) => t + ((g && g.lessons && g.lessons.length) || 0), 0);
}

// ---------------------------------------------------------------------------
// THE LAST COURSE CHOSEN ON THIS DEVICE. Darrell 2026-09-06, on the picker
// reading like a section title over one course's lessons: "have the default
// say Select a Course of 23? Then leave it on the last one?" So: a device that
// has never chosen shows the prompt, and a device that has chosen opens on
// that course. Stored per device (localStorage), like the saved place.
// ---------------------------------------------------------------------------
export const COURSE_MEMORY_KEY = 'poetech.learn.course';

const storeOrNull = () => { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (_) { return null; } };

export function rememberedCourseKey(store = storeOrNull()) {
  try { return store ? (store.getItem(COURSE_MEMORY_KEY) || null) : null; } catch (_) { return null; }
}

export function rememberCourseKey(key, store = storeOrNull()) {
  try {
    if (!store) return;
    if (key) store.setItem(COURSE_MEMORY_KEY, String(key));
    else store.removeItem(COURSE_MEMORY_KEY);
  } catch (_) { /* a full or blocked store never breaks the picker */ }
}


// THE TOP SORT, REMEMBERED ON THIS DEVICE (DR-0686) — the same guarded
// pattern as the remembered course above. An unknown stored key reads as null.
export const COURSE_SORT_MEMORY_KEY = 'poetech.learn.courseSort';

export function rememberedCourseSort(store = storeOrNull()) {
  try {
    const v = store ? store.getItem(COURSE_SORT_MEMORY_KEY) : null;
    return COURSE_SORTS.some((o) => o.key === v) ? v : null;
  } catch (_) { return null; }
}

export function rememberCourseSort(key, store = storeOrNull()) {
  try { if (store && key) store.setItem(COURSE_SORT_MEMORY_KEY, String(key)); } catch (_) { /* the pick holds for this visit */ }
}
