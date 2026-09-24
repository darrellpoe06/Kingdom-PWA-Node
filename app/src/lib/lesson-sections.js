// =============================================================================
// lesson-sections — a long course's lessons, shelved by where in the Word
// each one stands (DR-0596)
// =============================================================================
// Darrell 2026-09-23, from the course picker on his Fold showing "Living
// Lessons from the Word · 189 lessons": "Living Lessons may need their own
// Sections...". A 189-row flat list is a scroll, not a shelf. The sections are
// NOT invented themes: every lesson opens on an anchor passage, and the FIRST
// anchor's book places the lesson in one of the Word's own divisions — Law,
// History, Wisdom & Poetry, Prophets, Gospels, Acts, Letters, Revelation — in
// canonical order. Real data (the lesson's own anchor), a rule a reader can
// check, and the Word's own shelving rather than ours (WORD-FIRST, DR-0097).
//
// Measured on the 189 Living Lessons before this shipped: first-anchor books
// span 45 of the 66; by division they fall Law 22 · History 8 · Wisdom &
// Poetry 33 · Prophets 16 · Gospels 47 · Acts 6 · Letters 56 · Revelation 1.
// A lesson whose anchor cannot be read lands in "Unplaced" rather than being
// dropped — the count on the shelf always equals the count on the course.
// =============================================================================

/** Courses at or above this many lessons render sections; shorter ones keep the flat list. */
export const SECTION_MIN_LESSONS = 30;

const DIVISIONS = [
  { key: 'law', label: 'The Law', books: ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'] },
  { key: 'history', label: 'History', books: ['Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther'] },
  { key: 'wisdom', label: 'Wisdom & Poetry', books: ['Job', 'Psalm', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song', 'Song of Solomon', 'Song of Songs'] },
  { key: 'prophets', label: 'The Prophets', books: ['Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'] },
  { key: 'gospels', label: 'The Gospels', books: ['Matthew', 'Mark', 'Luke', 'John'] },
  { key: 'acts', label: 'Acts', books: ['Acts'] },
  { key: 'letters', label: 'The Letters', books: ['Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude'] },
  { key: 'revelation', label: 'Revelation', books: ['Revelation'] },
];
const UNPLACED = { key: 'unplaced', label: 'Unplaced (anchor not read)', books: [] };

const BOOK_TO_DIVISION = new Map();
for (const d of DIVISIONS) for (const b of d.books) BOOK_TO_DIVISION.set(b.toLowerCase(), d);

/** The book of the FIRST reference in an anchor string ("Matthew 5:48; Genesis 17:1" → "Matthew"); '' when none reads. */
export function firstAnchorBook(ref) {
  const m = /^\s*([1-3]?\s?[A-Za-z]+(?:\s+of\s+[A-Za-z]+)?)\s+\d/.exec(String(ref || ''));
  return m ? m[1].replace(/\s+/g, ' ').trim() : '';
}

/** The Word's division a lesson stands in, from its first anchor; the Unplaced division when the anchor cannot be read. */
export function divisionOf(lesson) {
  const book = firstAnchorBook(lesson && lesson.anchor && lesson.anchor.ref);
  return (book && BOOK_TO_DIVISION.get(book.toLowerCase())) || UNPLACED;
}

/**
 * Shelve a schedule (course order) into sections in canonical order. Every
 * lesson appears exactly once; empty divisions are omitted; lesson order
 * inside a section is course order. Returns [{ key, label, lessons }].
 */
export function sectionLessons(schedule) {
  const buckets = new Map();
  for (const m of Array.isArray(schedule) ? schedule : []) {
    if (!m || typeof m !== 'object') continue;
    const d = divisionOf(m);
    if (!buckets.has(d.key)) buckets.set(d.key, { key: d.key, label: d.label, lessons: [] });
    buckets.get(d.key).lessons.push(m);
  }
  const out = [];
  for (const d of [...DIVISIONS, UNPLACED]) if (buckets.has(d.key)) out.push(buckets.get(d.key));
  return out;
}

/** True when a course is long enough that a flat list is a scroll rather than a shelf. */
export function wantsSections(schedule) {
  return Array.isArray(schedule) && schedule.length >= SECTION_MIN_LESSONS;
}

/** The section key that holds a lesson id, or the first section's key; '' for no sections. */
export function sectionHolding(sections, lessonId) {
  for (const s of sections) if (s.lessons.some((m) => m && m.id === lessonId)) return s.key;
  return sections.length ? sections[0].key : '';
}

export const LESSON_DIVISIONS = DIVISIONS.map((d) => ({ key: d.key, label: d.label }));
