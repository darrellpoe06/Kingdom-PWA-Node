// =============================================================================
// scripture-order — put open verses in the order they happened, as far as the
// Word itself settles it; otherwise in the order of Scripture
// =============================================================================
// Darrell, 2026-09-08: "have them chronological... as much as they can be...
// so it makes sense based on their timelines and or the flow of scriptures."
//
// TWO ORDERS, AND WHICH ONE WINS. The Word's own arrangement (Genesis to
// Revelation) is the FLOW; it is fixed, uncontested, and the fallback for
// everything. A TIMELINE order differs from it only where a book sits at a
// different point in history than its position on the shelf — Job among the
// patriarchs, the prophets alongside the kings they spoke to, the letters
// beside the journeys in Acts. So a reference is ordered by ERA BAND first
// (the coarse, widely-held placement below), then by its shelf position,
// then by chapter and verse. Within a band the flow is kept, because the
// Word's own arrangement is the safest order where history does not clearly
// say otherwise.
//
// THE HONESTY RULES (DR-0076 / DR-0100 / scripture-chronology.js). Era bands
// are COARSE on purpose: "the prophets belong with the divided kingdom" is
// established; "Obadiah was written in 586 BC" is a reconstruction this app
// does not assert. Where a book's band is genuinely open, it is placed in the
// most widely held band AND named in OPEN_PLACEMENTS, so the surface can say
// "as far as the Word settles it" and mean it. Nothing here claims a date.
//
// Pure: no DOM, no fetch. The KJV index gives the shelf position.
// =============================================================================
import { BIBLE_INDEX, parseRef } from './bible-kjv.js';

/** The era bands, oldest first. Numbers are ORDER, never years. */
export const ERAS = Object.freeze([
  { id: 'beginnings', label: 'From the beginning through the patriarchs', books: ['Genesis', 'Job'] },
  { id: 'exodus', label: 'The Exodus and the wilderness', books: ['Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'] },
  { id: 'land', label: 'The land, the judges', books: ['Joshua', 'Judges', 'Ruth'] },
  { id: 'kingdom', label: 'The united kingdom', books: ['1 Samuel', '2 Samuel', '1 Chronicles', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon'] },
  { id: 'divided', label: 'The divided kingdom and the prophets to it', books: ['1 Kings', '2 Kings', '2 Chronicles', 'Obadiah', 'Joel', 'Jonah', 'Amos', 'Hosea', 'Isaiah', 'Micah', 'Nahum', 'Zephaniah', 'Habakkuk', 'Jeremiah', 'Lamentations'] },
  { id: 'exile', label: 'The exile', books: ['Ezekiel', 'Daniel'] },
  { id: 'return', label: 'The return', books: ['Ezra', 'Nehemiah', 'Esther', 'Haggai', 'Zechariah', 'Malachi'] },
  { id: 'gospels', label: 'The Gospels', books: ['Matthew', 'Mark', 'Luke', 'John'] },
  { id: 'church', label: 'Acts and the letters', books: ['Acts', 'James', 'Galatians', '1 Thessalonians', '2 Thessalonians', '1 Corinthians', '2 Corinthians', 'Romans', 'Ephesians', 'Philippians', 'Colossians', 'Philemon', '1 Timothy', 'Titus', '2 Timothy', '1 Peter', '2 Peter', 'Hebrews', 'Jude'] },
  { id: 'end', label: 'The last letters and the Revelation', books: ['1 John', '2 John', '3 John', 'Revelation'] },
]);

/** Placements the Word does not settle; carried here, never silently resolved. */
export const OPEN_PLACEMENTS = Object.freeze({
  Job: 'The book names no king and no date; its setting reads as patriarchal, which is the placement kept here.',
  Joel: 'Joel names no king; readings range from the early divided kingdom to after the return. Kept with the prophets to the kingdom.',
  Obadiah: 'Obadiah names no king; kept with the prophets to the kingdom.',
  James: 'Among the earliest letters on most readings; kept first among them.',
  Hebrews: 'Its author and date are not stated; kept with the letters.',
});

const SHELF = new Map(BIBLE_INDEX.map((b, i) => [b.name, i]));
const ERA_OF = new Map();
ERAS.forEach((e, i) => e.books.forEach((b) => ERA_OF.set(b, i)));

/** The era index for a book name, or the last era for a book not placed (never a crash). */
export function eraOf(book) {
  const i = ERA_OF.get(book);
  return i === undefined ? ERAS.length : i;
}

/** The sort key of a reference; null when it is not one this app can read. */
export function orderKey(ref) {
  const p = parseRef(ref);
  if (!p) return null;
  return [eraOf(p.book), SHELF.get(p.book) ?? 99, p.chapter, p.v1];
}

/** Negative when `a` happened (or sits) before `b`. Unparseable refs sort last, in the order given. */
export function compareRefs(a, b) {
  const ka = orderKey(a);
  const kb = orderKey(b);
  if (!ka && !kb) return 0;
  if (!ka) return 1;
  if (!kb) return -1;
  for (let i = 0; i < ka.length; i += 1) {
    if (ka[i] !== kb[i]) return ka[i] - kb[i];
  }
  return 0;
}

/** A new array, in timeline-then-flow order. Stable: equal keys keep their given order. */
export function sortRefs(refs = []) {
  return (refs || []).map((r, i) => ({ r, i }))
    .sort((x, y) => compareRefs(x.r, y.r) || x.i - y.i)
    .map((x) => x.r);
}

/** Every book of the index is placed in exactly one era — the test proves it. */
export function unplacedBooks() {
  return BIBLE_INDEX.map((b) => b.name).filter((n) => !ERA_OF.has(n));
}
