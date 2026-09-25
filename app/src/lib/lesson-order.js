// =============================================================================
// lesson-order — a course's lessons in the order of their own numbers
// =============================================================================
// Darrell 2026-09-24, on Church → Learn → Living Lessons: "There's no way to see
// the list in chronological order?!!! Fix that!!!", "MD too", "They are
// numbered!!!!!!!", and then "There are dates in the lessons maybe we should
// capitalize on that somehow...".
//
// The number is the lesson's OWN: the digits in its id ("ll192-two-hours-..."
// is Lesson 192), never its position in the array. Two facts measured on
// 2026-09-24 make the difference matter: Living Lessons has no L79, and the
// authored array holds L61 before L60 and L94 before L90-L93, so a position
// read "Lesson 191" on L192.
//
// A course counts as numbered only when EVERY lesson's id carries a number and
// no two share one. Courses whose ids carry no number (Healthy Living's
// "hl-w3-…") or one shared number (Historical Research's "hr1-…", which means
// Level 1) keep the course's own order and its own week count — there is no
// lesson number to read, and inventing one would be painting.
// =============================================================================

/** The lesson's own number from its id ("ll192-…" → 192, "sov3-…" → 3); null when the id carries none. */
export function lessonNumber(lesson) {
  if (!lesson) return null;
  if (Number.isFinite(lesson.number)) return lesson.number;
  const m = /^[a-z]+(\d+)-/i.exec(String(lesson.id || ''));
  return m ? Number(m[1]) : null;
}

/** True when every lesson carries its own number and no two share one. */
export function isNumberedCourse(schedule) {
  const list = Array.isArray(schedule) ? schedule : [];
  if (!list.length) return false;
  const seen = new Set();
  for (const m of list) {
    const n = lessonNumber(m);
    if (n == null || seen.has(n)) return false;
    seen.add(n);
  }
  return true;
}

const NUMBERED = new WeakMap();
/** isNumberedCourse, remembered per schedule array (a render may ask once per row). */
function numberedSchedule(schedule) {
  if (!Array.isArray(schedule)) return false;
  if (!NUMBERED.has(schedule)) NUMBERED.set(schedule, isNumberedCourse(schedule));
  return NUMBERED.get(schedule);
}

/** The number to print beside a lesson of this schedule: its own when the course is numbered, its week otherwise. */
export function ownNumber(lesson, schedule) {
  return shownNumber(lesson, numberedSchedule(schedule));
}

/** The schedule in number order when it is numbered; as authored otherwise. */
export function inNumberOrder(schedule) {
  return numberedSchedule(schedule) ? orderLessons(schedule, 'number') : (Array.isArray(schedule) ? schedule : []);
}

/** The number a row shows: the lesson's own in a numbered course, the course's count otherwise. */
export function shownNumber(lesson, numbered) {
  return numbered ? lessonNumber(lesson) : lesson && lesson.week;
}

/** The label a row carries: "L192" for a lesson series, "Week 3" for a weekly course. */
export function numberLabel(lesson, numbered, unitCap = 'Lesson') {
  const n = shownNumber(lesson, numbered);
  if (n == null) return '';
  return unitCap === 'Lesson' ? `L${n}` : `${unitCap} ${n}`;
}

/**
 * How many lessons a course really has, and — for a numbered course — the span
 * of their own numbers and any number never used. Darrell 2026-09-25, on the
 * Living Lessons index: "We need the count correct 191 or 192?" The count
 * (191) was right and the newest row (L192) was right: Living Lessons has no
 * L79. The two only disagree when a number is unused, so the header names the
 * span and the gap instead of leaving the reader to reconcile them. Everything
 * here is read from the schedule itself — never a hand-kept figure — so it
 * stays right as each new lesson lands.
 */
export function lessonSpan(schedule) {
  const list = Array.isArray(schedule) ? schedule : [];
  const count = list.length;
  if (!numberedSchedule(list)) return { count, numbered: false, first: null, last: null, missing: [] };
  const nums = list.map(lessonNumber);
  const first = Math.min(...nums);
  const last = Math.max(...nums);
  const have = new Set(nums);
  const missing = [];
  for (let n = first; n <= last; n += 1) if (!have.has(n)) missing.push(n);
  return { count, numbered: true, first, last, missing };
}

/**
 * The count line for a course: "191 lessons · L1–L192 · no L79" when the
 * numbers run past the count, "12 lessons" otherwise. Unit words come from the
 * course (unitLabels: noun, plural, cap), so a weekly course reads "8 weeks".
 */
export function lessonCountLabel(schedule, units = {}) {
  const { noun = 'lesson', plural = 'lessons', cap = 'Lesson' } = units;
  const s = lessonSpan(schedule);
  const head = `${s.count} ${s.count === 1 ? noun : plural}`;
  if (!s.numbered || (s.first === 1 && s.last === s.count)) return head;
  const L = (n) => numberLabel({ number: n }, true, cap);
  const span = `${L(s.first)}–${L(s.last)}`;
  if (!s.missing.length) return `${head} · ${span}`;
  const gap = s.missing.length <= 3
    ? `no ${s.missing.map(L).join(', ')}`
    : `${s.missing.length} numbers unused`;
  return `${head} · ${span} · ${gap}`;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function isoParts(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return null;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year: Number(m[1]), month, day: Number(m[3]) };
}

/** "2026-09-24" → "Sep 24, 2026"; '' for anything that is not a real ISO day. Read as a calendar day, never shifted by time zone. */
export function formatAdded(iso) {
  const p = isoParts(iso);
  return p ? `${MONTHS[p.month - 1].slice(0, 3)} ${p.day}, ${p.year}` : '';
}

/** "2026-09-24" → { key: '2026-09', label: 'September 2026' }; null when there is no day. */
export function monthOf(iso) {
  const p = isoParts(iso);
  return p ? { key: `${p.year}-${String(p.month).padStart(2, '0')}`, label: `${MONTHS[p.month - 1]} ${p.year}` } : null;
}

// The orders a reader can pick. "divisions" is offered only on a course long
// enough to be shelved by the Word's divisions (lib/lesson-sections.js).
export const LESSON_ORDERS = [
  { key: 'number', label: 'By number, first to last' },
  { key: 'newest', label: 'Newest first' },
  { key: 'divisions', label: 'By the Word’s divisions' },
];
export const DEFAULT_LESSON_ORDER = 'number';

/** The orders this course can offer: numbered → first/newest; shelved → divisions too. */
export function ordersFor({ numbered, hasSections, dated }) {
  return LESSON_ORDERS
    .filter((o) => (o.key === 'divisions' ? hasSections : numbered))
    .map((o) => (o.key === 'newest' && !dated ? { ...o, label: 'Last to first' } : o));
}

/**
 * The lessons in the picked order. 'number' → lowest number first; 'newest' →
 * latest day first, then highest number (a lesson without a day sorts by its
 * number after the dated ones). Anything else returns the list as given.
 * Never mutates the input; ties keep course order.
 */
export function orderLessons(list, order) {
  const rows = (Array.isArray(list) ? list : []).map((m, i) => ({ m, i, n: lessonNumber(m) }));
  const byNumber = (a, b) => ((a.n ?? Infinity) - (b.n ?? Infinity)) || (a.i - b.i);
  if (order === 'number') return rows.sort(byNumber).map((r) => r.m);
  if (order === 'newest') {
    return rows.sort((a, b) => {
      const da = a.m.added || '';
      const db = b.m.added || '';
      if (da !== db) return da < db ? 1 : -1;
      return -byNumber(a, b);
    }).map((r) => r.m);
  }
  return rows.map((r) => r.m);
}

/**
 * Month label rows between dated lessons: [{ heading: { key, label, count } }, lesson, …].
 * Labels only — nothing folds. A run with no days returns the lessons untouched.
 */
export function withMonthHeadings(list) {
  const rows = Array.isArray(list) ? list : [];
  if (!rows.some((m) => monthOf(m && m.added))) return rows;
  const counts = new Map();
  for (const m of rows) {
    const k = (monthOf(m.added) || { key: 'undated' }).key;
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const out = [];
  let last = null;
  for (const m of rows) {
    const mo = monthOf(m.added) || { key: 'undated', label: 'No day recorded' };
    if (mo.key !== last) { out.push({ heading: { key: `month-${mo.key}`, label: mo.label, count: counts.get(mo.key) } }); last = mo.key; }
    out.push(m);
  }
  return out;
}

// The reader's pick, per course, on this device (like the remembered course in
// learn-organize.js). Storage can be absent or throw (private window, blocked
// site data); the list then simply opens in number order.
const ORDER_STORE = 'poetech.learn.lessonOrder.v1';

export function rememberedLessonOrder(courseKey) {
  try {
    const all = JSON.parse(window.localStorage.getItem(ORDER_STORE) || '{}');
    const v = all && typeof all === 'object' ? all[courseKey] : null;
    return LESSON_ORDERS.some((o) => o.key === v) ? v : null;
  } catch {
    return null;
  }
}

export function rememberLessonOrder(courseKey, order) {
  try {
    const all = JSON.parse(window.localStorage.getItem(ORDER_STORE) || '{}');
    const next = all && typeof all === 'object' ? all : {};
    next[courseKey] = order;
    window.localStorage.setItem(ORDER_STORE, JSON.stringify(next));
  } catch {
    /* the pick holds for this visit only */
  }
}
