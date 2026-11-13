// =============================================================================
// kjv — read a verse off the KJV the app carries, never off memory (DR-1468)
// =============================================================================
// app/public/bible/kjv/<File>.json is { name, chapters: [[verse, ...], ...] };
// index.json maps each book's name ("Song of Solomon") to its file
// ("SongofSolomon"). A reference resolves through that index, so the book list
// is the corpus's own and not a second copy kept here.
//
//   parseRef('Romans 2:14-15')   -> { book: 'Romans', ch: 2, v1: 14, ch2: 2, v2: 15 }
//   kjvText('Romans 2:14-15')    -> the two verses, joined by one space, verbatim
// =============================================================================
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const KJV_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'app', 'public', 'bible', 'kjv');

let INDEX = null;
const index = (dir = KJV_DIR) => {
  if (!INDEX) INDEX = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
  return INDEX;
};
const squash = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/** The corpus's own name for a book, accepting "Psalm" and spacing/case slips. */
export function canonicalBook(name, dir = KJV_DIR) {
  const want = squash(name) === 'psalm' ? 'psalms' : squash(name);
  const hit = index(dir).find((b) => squash(b.name) === want || squash(b.file) === want);
  return hit ? hit.name : null;
}

/** Book C:V, Book C:V-V2, or Book C:V-C2:V2. Throws on anything else. */
export function parseRef(ref, dir = KJV_DIR) {
  const m = /^\s*((?:[1-3]\s*)?[A-Za-z][A-Za-z ]*?)\s+(\d+):(\d+)(?:\s*[-–]\s*(?:(\d+):)?(\d+))?\s*$/.exec(String(ref || ''));
  if (!m) throw new Error(`not a reference: '${ref}' (write Book C:V, Book C:V-V, or Book C:V-C:V)`);
  const book = canonicalBook(m[1], dir);
  if (!book) throw new Error(`no such book in the KJV corpus: '${m[1].trim()}'`);
  const ch = Number(m[2]);
  const v1 = Number(m[3]);
  const ch2 = m[4] ? Number(m[4]) : ch;
  const v2 = m[5] ? Number(m[5]) : v1;
  if (ch2 < ch || (ch2 === ch && v2 < v1)) throw new Error(`the range in '${ref}' runs backwards`);
  return { book, ch, v1, ch2, v2 };
}

/** The canonical spelling of a reference, as the lessons cite it. */
export function formatRef({ book, ch, v1, ch2, v2 }) {
  if (ch2 !== ch) return `${book} ${ch}:${v1}-${ch2}:${v2}`;
  return v2 !== v1 ? `${book} ${ch}:${v1}-${v2}` : `${book} ${ch}:${v1}`;
}

/** Every verse a reference names, verbatim, as an array. Throws if any is missing. */
export function kjvVerses(ref, dir = KJV_DIR) {
  const r = typeof ref === 'string' ? parseRef(ref, dir) : ref;
  const file = index(dir).find((b) => b.name === r.book).file;
  const chapters = JSON.parse(readFileSync(join(dir, `${file}.json`), 'utf8')).chapters;
  const out = [];
  for (let c = r.ch; c <= r.ch2; c += 1) {
    const chapter = chapters[c - 1];
    if (!chapter) throw new Error(`${r.book} has no chapter ${c}`);
    const from = c === r.ch ? r.v1 : 1;
    const to = c === r.ch2 ? r.v2 : chapter.length;
    for (let v = from; v <= to; v += 1) {
      if (typeof chapter[v - 1] !== 'string') throw new Error(`${r.book} ${c} has no verse ${v}`);
      out.push(chapter[v - 1]);
    }
  }
  return out;
}

/** The text of a reference: its verses joined by one space, exactly as stored. */
export function kjvText(ref, dir = KJV_DIR) {
  return kjvVerses(ref, dir).join(' ');
}
