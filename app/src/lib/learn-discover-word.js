// =============================================================================
// learn-discover-word — Today's Word, from lessons that already exist
// =============================================================================
// The Word of the day is the anchor verse of one of the curriculum's own
// lessons, chosen by the calendar day (the same verse for everyone on a day,
// a different one tomorrow), with a way into that lesson. Its text is the
// King James Version fetched verbatim from the Bible files the app already
// ships (public/bible/kjv) — never typed, never paraphrased (DR-0076). If the
// verse cannot be read, nothing is shown: a Word with no text is never drawn.
// Pure except the injected `getBook`.
// =============================================================================

const SINGLE = /^((?:[1-3] )?[A-Z][a-z]+(?: of [A-Z][a-z]+)?) (\d+):(\d+)(?:[-–](\d+))?$/;
const MAX_VERSES = 3;
const MAX_CHARS = 420;

/** "Psalm 23:1" -> { book: 'Psalms', chapter: 23, from: 1, to: 1 }, or null for anything that is not one plain passage. */
export function parsePassage(ref) {
  const m = SINGLE.exec(String(ref || '').trim());
  if (!m) return null;
  let book = m[1];
  if (book === 'Psalm') book = 'Psalms';
  const from = Number(m[3]);
  const to = m[4] ? Number(m[4]) : from;
  if (to < from || to - from + 1 > MAX_VERSES) return null;
  return { book, chapter: Number(m[2]), from, to, file: book.replace(/ /g, '') };
}

/** The lessons whose anchor is one short plain passage. */
export function wordCandidates(index) {
  return (index.lessons || []).filter((l) => parsePassage(l.r));
}

/** A whole number for a calendar day, the same everywhere on that day (local date). */
export function dayNumber(date = new Date()) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

/**
 * Today's Word, or null. `getBook(file)` resolves the shipped KJV book
 * ({ chapters: [[verse, ...], ...] }). Tries the day's pick, then the next few,
 * so one unreadable verse never leaves the card empty.
 */
export async function todaysWord(index, getBook, date = new Date()) {
  const cands = wordCandidates(index);
  if (!cands.length) return null;
  const start = dayNumber(date) % cands.length;
  for (let k = 0; k < Math.min(cands.length, 8); k += 1) {
    const l = cands[(start + k) % cands.length];
    const p = parsePassage(l.r);
    let book;
    try { book = await getBook(p.file); } catch { book = null; }
    const verses = book && Array.isArray(book.chapters) ? book.chapters[p.chapter - 1] : null;
    if (!Array.isArray(verses)) continue;
    const text = verses.slice(p.from - 1, p.to).join(' ').replace(/\s+/g, ' ').trim();
    if (!text || p.to > verses.length || text.length > MAX_CHARS) continue;
    return { lessonId: l.i, courseKey: null, ref: l.r.replace('-', '–'), text, translation: 'KJV', theme: l.th || '' };
  }
  return null;
}
