// =============================================================================
// progress-of-revelation — the chart Darrell photographed, as data
// =============================================================================
// Darrell 2026-10-27, two photographed pages headed "The Progress of
// Revelation" from the front matter of a printed study Bible, with the note:
// "Timelines for the bible? Lesson /s Word first..."
//
// WHAT THIS IS. The sixty-six books in the order the chart believes they were
// WRITTEN (not shelf order), each with the chart's approximate writing date and
// its author, transcribed from the photographs line for line. The chart's own
// honesty is kept exactly: "Unknown", "Anonymous", "Multiple Authors",
// "Solomon primarily", and the "(?)" after Samuel (Ruth) and Ezra (Chronicles).
//
// WHAT THIS IS NOT. Not Scripture, not this house's own dating, and not a
// user's record (USER-ACCOUNTS-AND-HISTORIES-STANDARD governs those; this is
// catalog data, the same for every reader). It is one published chart's
// estimate, kept as data so the lesson that cites a date is pinned to the
// chart it cites (living-lessons-ll270 test) instead of to a number remembered
// in prose. The lesson teaches, from the Word, WHICH of these lines the Word
// itself underwrites (a book is no older than its last event and no younger
// than its first reader) and where the Word is silent. We did not compare
// this chart against other published charts (DR-0076 §8: stated, not hidden).
//
// `from`/`to` are years; `era` is 'BC' or 'AD'; `ca` marks the chart's "ca.";
// a single-year entry carries `to === from`; `queried` is the chart's "(?)".
// =============================================================================

export const PROGRESS_OF_REVELATION_SOURCE =
  'Two photographed pages headed "The Progress of Revelation", the front matter of a printed study Bible, sent into the app 2026-10-27; transcribed line for line.';

const bc = (order, book, from, to, author, extra = {}) => ({ order, testament: 'OT', book, era: 'BC', from, to, author, ...extra });
const ad = (order, book, from, to, author, extra = {}) => ({ order, testament: 'NT', book, era: 'AD', from, to, author, ...extra });

export const PROGRESS_OF_REVELATION = [
  { order: 1, testament: 'OT', book: 'Job', era: null, from: null, to: null, author: 'Anonymous', unknownDate: true },
  bc(2, 'Genesis', 1445, 1405, 'Moses'),
  bc(3, 'Exodus', 1445, 1405, 'Moses'),
  bc(4, 'Leviticus', 1445, 1405, 'Moses'),
  bc(5, 'Numbers', 1445, 1405, 'Moses'),
  bc(6, 'Deuteronomy', 1445, 1405, 'Moses'),
  bc(7, 'Psalms', 1410, 450, 'Multiple Authors'),
  bc(8, 'Joshua', 1405, 1385, 'Joshua'),
  bc(9, 'Judges', 1043, 1043, 'Samuel', { ca: true }),
  bc(10, 'Ruth', 1030, 1010, 'Samuel', { ca: true, queried: true }),
  bc(11, 'Song of Solomon', 971, 965, 'Solomon'),
  bc(12, 'Proverbs', 971, 686, 'Solomon primarily'),
  bc(13, 'Ecclesiastes', 940, 931, 'Solomon'),
  bc(14, '1 Samuel', 931, 722, 'Anonymous'),
  bc(15, '2 Samuel', 931, 722, 'Anonymous'),
  bc(16, 'Obadiah', 850, 840, 'Obadiah'),
  bc(17, 'Joel', 835, 796, 'Joel'),
  bc(18, 'Jonah', 775, 775, 'Jonah', { ca: true }),
  bc(19, 'Amos', 750, 750, 'Amos', { ca: true }),
  bc(20, 'Micah', 735, 710, 'Micah'),
  bc(21, 'Hosea', 750, 710, 'Hosea'),
  bc(22, 'Isaiah', 700, 681, 'Isaiah'),
  bc(23, 'Nahum', 650, 650, 'Nahum', { ca: true }),
  bc(24, 'Zephaniah', 635, 625, 'Zephaniah'),
  bc(25, 'Habakkuk', 615, 605, 'Habakkuk'),
  bc(26, 'Ezekiel', 590, 570, 'Ezekiel'),
  bc(27, 'Lamentations', 586, 586, 'Jeremiah'),
  bc(28, 'Jeremiah', 586, 570, 'Jeremiah'),
  bc(29, '1 Kings', 561, 538, 'Anonymous'),
  bc(30, '2 Kings', 561, 538, 'Anonymous'),
  bc(31, 'Daniel', 536, 530, 'Daniel'),
  bc(32, 'Haggai', 520, 520, 'Haggai', { ca: true }),
  bc(33, 'Zechariah', 480, 470, 'Zechariah'),
  bc(34, 'Ezra', 457, 444, 'Ezra'),
  bc(35, '1 Chronicles', 450, 430, 'Ezra', { queried: true }),
  bc(36, '2 Chronicles', 450, 430, 'Ezra', { queried: true }),
  bc(37, 'Esther', 450, 331, 'Anonymous'),
  bc(38, 'Malachi', 433, 424, 'Malachi'),
  bc(39, 'Nehemiah', 424, 400, 'Ezra'),
  ad(1, 'James', 44, 49, 'James'),
  ad(2, 'Galatians', 49, 50, 'Paul'),
  ad(3, 'Matthew', 50, 60, 'Matthew'),
  ad(4, 'Mark', 50, 60, 'Mark'),
  ad(5, '1 Thessalonians', 51, 51, 'Paul'),
  ad(6, '2 Thessalonians', 51, 52, 'Paul'),
  ad(7, '1 Corinthians', 55, 55, 'Paul'),
  ad(8, '2 Corinthians', 55, 56, 'Paul'),
  ad(9, 'Romans', 56, 56, 'Paul'),
  ad(10, 'Luke', 60, 61, 'Luke'),
  ad(11, 'Ephesians', 60, 62, 'Paul'),
  ad(12, 'Philippians', 60, 62, 'Paul'),
  ad(13, 'Colossians', 60, 62, 'Paul'),
  ad(14, 'Philemon', 60, 62, 'Paul'),
  ad(15, 'Acts', 62, 62, 'Luke'),
  ad(16, '1 Timothy', 62, 64, 'Paul'),
  ad(17, 'Titus', 62, 64, 'Paul'),
  ad(18, '1 Peter', 64, 65, 'Peter'),
  ad(19, '2 Timothy', 66, 67, 'Paul'),
  ad(20, '2 Peter', 67, 68, 'Peter'),
  ad(21, 'Hebrews', 67, 69, 'Unknown'),
  ad(22, 'Jude', 68, 70, 'Jude'),
  ad(23, 'John', 80, 90, 'John'),
  ad(24, '1 John', 90, 95, 'John'),
  ad(25, '2 John', 90, 95, 'John'),
  ad(26, '3 John', 90, 95, 'John'),
  ad(27, 'Revelation', 94, 96, 'John'),
];

/** The chart's date for one book, as the lesson speaks it: "1445 to 1405 BC", "about 775 BC", "AD 62", "Unknown". */
export function chartDateOf(book) {
  const r = PROGRESS_OF_REVELATION.find((x) => x.book === book);
  if (!r) return null;
  if (r.unknownDate) return 'Unknown';
  const span = r.from === r.to ? String(r.from) : `${r.from} to ${r.to}`;
  if (r.era === 'AD') return `AD ${span}`;
  return `${r.ca ? 'about ' : ''}${span} BC`;
}

/** The chart's author line for one book, with its own "(?)" kept. */
export function chartAuthorOf(book) {
  const r = PROGRESS_OF_REVELATION.find((x) => x.book === book);
  return r ? `${r.author}${r.queried ? ' (?)' : ''}` : null;
}

/** The books whose writer or date the chart leaves open, exactly as it marks them. */
export function chartOpenLines() {
  return PROGRESS_OF_REVELATION
    .filter((r) => r.unknownDate || r.queried || /Unknown|Anonymous/.test(r.author))
    .map((r) => ({ book: r.book, author: chartAuthorOf(r.book), date: chartDateOf(r.book) }));
}
