// =============================================================================
// who-he-is — every passage in the whole Word that tells Who He Is, as data
// =============================================================================
// Darrell, 2026-09-29: "We needed a lesson wide curriculum with all ... No
// matter if He was there or not ... Clarity clarification of where when what
// how timeless timelines and Who He Is."
//
// This module is the one door every surface uses: the curriculum lessons
// (who-he-is-course.js), the timeline (WhoHeIsTimeline.jsx), and the links
// from L191, L194 and L196. The entries come from who-he-is-data.json, which
// scripts/who-he-is-generate.mjs writes from the KJV corpus by the written
// rule in who-he-is-rules.js (DR-0675). EVERY COUNT HERE IS DERIVED from the
// entries at the moment it is asked for; none is typed (DR-0076).
//
// PURE: no DOM, no fetch. Data in, data out, assertable in a plain test.
// =============================================================================
import DATA from './who-he-is-data.json';

export const WHO_HE_IS_DATA = DATA;
export const WHO_HE_IS_ERAS = DATA.eras;
export const WHO_HE_IS_ENTRIES = DATA.entries;
export const WHO_HE_IS_EDGE = DATA.edge;

const ERA = new Map(DATA.eras.map((e) => [e.id, e]));
export const eraOf = (id) => ERA.get(id) || null;
export const eraLabel = (id) => (ERA.get(id) ? ERA.get(id).label : id);

export const PRESENT_LABEL = Object.freeze({
  yes: 'He was there',
  no: 'He was not in the scene',
  'pre-incarnate': 'He was there before He came in the flesh',
});

export const HOW_LABEL = Object.freeze({
  narration: 'Told as it happened',
  letter: 'A letter',
  vision: 'A vision',
  prophecy: 'Prophecy',
  song: 'A psalm',
  type: 'A picture the New Testament names',
  law: 'The law',
  wisdom: 'Wisdom',
  poetry: 'Poetry',
});

export const RULE_LABEL = Object.freeze({
  A: 'A book that says it is about Him',
  B: 'His name or title stands in it',
  C: 'The New Testament quotes it of Him',
  D: 'The New Testament says it pictured Him or held Him',
});

// ---- counting (always derived) ---------------------------------------------
function tally(list, key) {
  const out = {};
  for (const e of list) {
    const ks = Array.isArray(key(e)) ? key(e) : [key(e)];
    for (const k of ks) out[k] = (out[k] || 0) + 1;
  }
  return out;
}

export function whoHeIsTotals(entries = DATA.entries) {
  return {
    entries: entries.length,
    verses: entries.reduce((n, e) => n + e.verses, 0),
    byEra: tally(entries, (e) => e.when.era),
    byPointsTo: tally(entries, (e) => e.when.pointsTo),
    byPresent: tally(entries, (e) => e.present),
    byHow: tally(entries, (e) => e.how.mode),
    byRule: tally(entries, (e) => e.rules),
    byTestament: tally(entries, (e) => e.testament),
    byBook: tally(entries, (e) => e.book),
    edge: DATA.edge.length,
    quotePairs: DATA.quotePairs.length,
    quotePairsApplied: DATA.quotePairs.filter((q) => q.applies).length,
  };
}

// ---- reading the line --------------------------------------------------------
// axis 'sits': where the passage happened or was spoken.
// axis 'points': where its words point in time (an entry can point to more
// than one era, so it appears on each).
export function entriesForEra(eraId, axis = 'sits', entries = DATA.entries) {
  if (axis === 'points') return entries.filter((e) => e.when.pointsTo.includes(eraId));
  return entries.filter((e) => e.when.era === eraId);
}

export function filterEntries(f = {}, entries = DATA.entries) {
  return entries.filter((e) => (
    (!f.era || e.when.era === f.era || (f.axis === 'points' && e.when.pointsTo.includes(f.era)))
    && (!f.present || e.present === f.present)
    && (!f.how || e.how.mode === f.how)
    && (!f.book || e.book === f.book)
    && (!f.testament || e.testament === f.testament)
    && (!f.rule || e.rules.includes(f.rule))
    && (!f.query || `${e.ref} ${e.keyVerse.text} ${e.what}`.toLowerCase().includes(String(f.query).toLowerCase()))
  ));
}

export function entryById(id) { return DATA.entries.find((e) => e.id === id) || null; }

export function booksInOrder(entries = DATA.entries) {
  const seen = [];
  for (const e of [...entries].sort((a, b) => bookIndex(a.book) - bookIndex(b.book))) if (!seen.includes(e.book)) seen.push(e.book);
  return seen;
}
const BOOK_ORDER = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'];
export const bookIndex = (b) => BOOK_ORDER.indexOf(b);

// ---- plain words: where, when, what, how, Who He Is ----------------------------
// Every line below is built from the entry's own fields; nothing is added.
export function describeEntry(e) {
  const points = e.when.pointsTo.map(eraLabel);
  const when = [
    `It sits in ${eraLabel(e.when.era)}.`,
    e.when.note || '',
    points.length ? `Its words point to ${joinList(points)}.` : '',
  ].filter(Boolean).join(' ');
  const who = e.testament === 'OT'
    ? e.basis.map((b) => `${b.ref}: ${b.reason}`).join(' ')
    : (e.titles.length ? `Named here: ${joinList(e.titles)}.` : 'No title stands in these verses; the key verse shows what they tell of Him.');
  return {
    ref: e.ref,
    where: e.where.text,
    when,
    what: e.what,
    how: e.how.text,
    present: `${PRESENT_LABEL[e.present]}: ${e.presentDetail}. ${e.presentReason}`,
    whoHeIs: who,
    keyVerse: e.keyVerse,
  };
}

function joinList(a) {
  if (a.length <= 1) return a[0] || '';
  return `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`;
}

// ---- links to the lessons that count the Gospel occasions -----------------------
// L191, L194 and L196 name their passages in their own text. A curriculum entry
// links to one of them when a reference that lesson quotes falls inside the
// entry's passage. Derived from the lesson text at the moment of asking, so a
// recount of those lessons carries its links with it.
export const LINKED_LESSON_PREFIXES = Object.freeze(['ll191-', 'll194-', 'll196-']);
const REF_IN_TEXT = /\(((?:[1-3] )?[A-Z][a-z]+(?: of [A-Z][a-z]+)?) (\d+):(\d+)(?:-(\d+))?/g;

function parseRange(ref) {
  const m = /^(.+?) (\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/.exec(ref);
  if (!m) return null;
  const c1 = Number(m[2]); const v1 = Number(m[3]);
  const c2 = m[5] ? Number(m[4] || m[2]) : c1; const v2 = m[5] ? Number(m[5]) : v1;
  return { book: m[1], a: c1 * 1000 + v1, z: c2 * 1000 + v2 };
}

const normalBook = (b) => (b === 'Psalm' ? 'Psalms' : b);

export function lessonRefs(module) {
  const text = [module.lesson, ...Object.values(module.levels || {})].join(' ');
  const out = [];
  for (const m of text.matchAll(REF_IN_TEXT)) {
    const c = Number(m[2]); const v = Number(m[3]);
    out.push({ book: normalBook(m[1]), a: c * 1000 + v, z: c * 1000 + (m[4] ? Number(m[4]) : v) });
  }
  return out;
}

export function lessonLinksFor(entry, modules) {
  const r = parseRange(entry.ref);
  if (!r) return [];
  const out = [];
  for (const m of modules || []) {
    if (!LINKED_LESSON_PREFIXES.some((p) => m.id.startsWith(p))) continue;
    if (lessonRefs(m).some((x) => x.book === r.book && x.a <= r.z && x.z >= r.a)) out.push({ id: m.id, title: m.title });
  }
  return out;
}

export function isWhoHeIsLinkedLesson(id) {
  return LINKED_LESSON_PREFIXES.some((p) => String(id || '').startsWith(p));
}
