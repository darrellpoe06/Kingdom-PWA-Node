// =============================================================================
// lesson-sorts — order the list of lessons the reader is actually looking at
// =============================================================================
// Darrell 2026-09-12: "the sort does nothing either... fix it... and give all
// options available."
//
// WHAT WAS ACTUALLY WRONG. There IS a Sort control on the Learn surface, and it
// works — but it sorts the COURSE PICKER, a collapsed <select> with 18 options
// inside it. The list filling the screen underneath is this course's own lessons
// (141 of them for Living Lessons), rendered straight from `schedule` in authored
// order with no sort at all. So changing Sort re-ordered options nobody could see
// and left every visible row exactly where it was. From the reader's chair that is
// indistinguishable from a dead control, and "it does nothing" is the correct
// report. The picker sort stays (it is genuinely useful once the dropdown is
// open); this module gives the visible list its own.
//
// EVERY OPTION IS BACKED BY REAL LESSON DATA (DR-0076). Nothing here sorts by a
// field the lessons do not carry, and nothing invents an ordering:
//   • course order / newest      — the module's own `week`
//   • title A-Z / Z-A            — the authored title
//   • Scripture                  — the anchor reference, in CANONICAL book order
//                                  (alphabetical would file 1 Corinthians before
//                                  Genesis, which is not an order anyone reads in)
//   • shortest / longest read    — MEASURED at the reader's own age band, through
//                                  learn-framework's own plan; this is the same
//                                  number the parts split on, so "shortest first"
//                                  genuinely surfaces what a child can finish
//   • recently opened            — this device's own ux-signals history
//   • not opened yet             — the complement of the same history
//
// Pure + dependency-light: the reading time and the history are INJECTED, so this
// module is unit-testable with no framework, no storage and no clock.

// The 66 books in canonical order. Real, fixed reference data — the order the
// Word is bound in, not a preference.
export const CANON_ORDER = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
  '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalm', 'Psalms', 'Proverbs', 'Ecclesiastes',
  'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea',
  'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai',
  'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians',
  'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
  '1 John', '2 John', '3 John', 'Jude', 'Revelation',
];

const CANON_RANK = new Map(CANON_ORDER.map((b, i) => [b.toLowerCase(), i]));

/**
 * Where a reference falls in the canon: [bookRank, chapter, verse].
 * An unrecognised or absent reference sorts LAST rather than first — a lesson with
 * no anchor should not head a Scripture-ordered list.
 */
export function canonKey(ref) {
  const raw = String(ref || '').trim();
  if (!raw) return [Number.MAX_SAFE_INTEGER, 0, 0];
  const m = raw.match(/^((?:[1-3]\s+)?[A-Za-z][A-Za-z\s]*?)\s+(\d+)(?::(\d+))?/);
  if (!m) return [Number.MAX_SAFE_INTEGER, 0, 0];
  const rank = CANON_RANK.get(m[1].trim().toLowerCase());
  if (rank === undefined) return [Number.MAX_SAFE_INTEGER, 0, 0];
  return [rank, Number(m[2]) || 0, Number(m[3]) || 0];
}

function byCanon(a, b) {
  const x = canonKey(a.anchor && a.anchor.ref);
  const y = canonKey(b.anchor && b.anchor.ref);
  for (let i = 0; i < 3; i += 1) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

/**
 * Every sort the list can honestly offer. `needs` names what the caller must
 * supply for the option to be real — the UI hides an option it cannot back, so a
 * sort is never offered that would silently no-op (which is the whole defect this
 * module exists to close).
 */
export const LESSON_SORTS = [
  { key: 'authored', label: 'Course order', needs: null },
  { key: 'authored-desc', label: 'Newest first', needs: null },
  { key: 'title', label: 'Title A to Z', needs: null },
  { key: 'title-desc', label: 'Title Z to A', needs: null },
  { key: 'scripture', label: 'Scripture order', needs: null },
  { key: 'time-asc', label: 'Shortest read first', needs: 'minutesOf' },
  { key: 'time-desc', label: 'Longest read first', needs: 'minutesOf' },
  { key: 'recent', label: 'Recently opened first', needs: 'openedIds' },
  { key: 'unopened', label: 'Not opened yet first', needs: 'openedIds' },
];

/** The options this caller can actually honour, given what it can supply. */
export function availableLessonSorts(ctx = {}) {
  return LESSON_SORTS.filter((s) => {
    if (!s.needs) return true;
    if (s.needs === 'minutesOf') return typeof ctx.minutesOf === 'function';
    if (s.needs === 'openedIds') return Array.isArray(ctx.openedIds);
    return false;
  });
}

/**
 * Sort a course schedule. Never mutates the input, always returns every lesson —
 * a sort is an ordering, never a filter, and dropping a row here would hide a
 * lesson from the only index that lists them all.
 *
 * ctx.minutesOf(module) -> number   real reading minutes at the reader's band
 * ctx.openedIds          -> string[] this device's lesson ids, most recent first
 */
export function sortLessons(schedule, key = 'authored', ctx = {}) {
  const list = Array.isArray(schedule) ? schedule.filter(Boolean) : [];
  const out = [...list];
  const weekOf = (m) => (Number.isFinite(m.week) ? m.week : list.indexOf(m) + 1);
  const titleOf = (m) => String(m.title || '');
  const opened = Array.isArray(ctx.openedIds) ? ctx.openedIds : null;
  // Rank by recency of opening; never-opened sorts last. Ties keep course order,
  // which is what makes "not opened yet" a usable reading plan and not a shuffle.
  const openedRank = opened
    ? new Map(opened.map((id, i) => [id, i]))
    : null;

  switch (key) {
    case 'authored-desc':
      return out.sort((a, b) => weekOf(b) - weekOf(a));
    case 'title':
      return out.sort((a, b) => titleOf(a).localeCompare(titleOf(b)));
    case 'title-desc':
      return out.sort((a, b) => titleOf(b).localeCompare(titleOf(a)));
    case 'scripture':
      return out.sort((a, b) => byCanon(a, b) || weekOf(a) - weekOf(b));
    case 'time-asc':
      if (typeof ctx.minutesOf !== 'function') return out;
      return out.sort((a, b) => ctx.minutesOf(a) - ctx.minutesOf(b) || weekOf(a) - weekOf(b));
    case 'time-desc':
      if (typeof ctx.minutesOf !== 'function') return out;
      return out.sort((a, b) => ctx.minutesOf(b) - ctx.minutesOf(a) || weekOf(a) - weekOf(b));
    case 'recent': {
      if (!openedRank) return out;
      const r = (m) => (openedRank.has(m.id) ? openedRank.get(m.id) : Number.MAX_SAFE_INTEGER);
      return out.sort((a, b) => r(a) - r(b) || weekOf(a) - weekOf(b));
    }
    case 'unopened': {
      if (!openedRank) return out;
      const isNew = (m) => (openedRank.has(m.id) ? 1 : 0);
      return out.sort((a, b) => isNew(a) - isNew(b) || weekOf(a) - weekOf(b));
    }
    default:
      return out.sort((a, b) => weekOf(a) - weekOf(b)); // 'authored'
  }
}

/** The one-line honest status under the control: what this order actually is. */
export function sortNote(key, ctx = {}) {
  switch (key) {
    case 'time-asc':
    case 'time-desc':
      return ctx.bandLabel
        ? `Reading time is measured for the ${ctx.bandLabel} pace you have chosen.`
        : 'Reading time is measured from the lesson itself.';
    case 'recent':
    case 'unopened':
      return 'Read from this device only — nothing about what you open leaves it.';
    case 'scripture':
      return 'In the order the books are bound, Genesis to Revelation.';
    default:
      return null;
  }
}
