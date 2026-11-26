// =============================================================================
// The Learning Zone discovery page reads the curriculum and changes none of it
// =============================================================================
// Darrell 2026-11-26: the discovery page is "an additional layer, not a
// replacement" — no lesson, original title, course or department assignment may
// change; search must reach the actual curriculum and keep the finder's existing
// ranking guarantees (DR-1049, DR-1129, DR-1329); every discovery category must
// be supported by the real curriculum. Everything below runs on the REAL mounted
// catalog (learnInventory), never a fixture, so a lesson added, retitled or
// removed tomorrow is caught here.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import INDEX from '../lib/learn-discover-index.json';
import { learnInventory } from '../lib/learn-presentation/integrity.js';
import { buildLessonIndex } from '../lib/learn-organize.js';
import { plainWordsFor, COURSE_PLAIN_WORDS } from '../lib/learn-plain-words.js';
import { prepareIndex, discoverSearch, correctQuery, RESULT_LIMIT } from '../lib/learn-discover-search.js';
import { CATEGORIES, categoryMembers, MIN_SHOWN } from '../lib/learn-discover-categories.js';
import { REVIEWED, UNPLACED } from '../lib/learn-discover-reviewed.js';
import { SERIES } from '../lib/learn-discover-series.js';
import { CATEGORY_PHOTO, HERO_LESSON } from '../lib/learn-discover-photos.js';
import { RELATIONSHIP_LESSONS } from '../lib/learn-presentation/presentation.js';
import { parsePassage, wordCandidates, todaysWord } from '../lib/learn-discover-word.js';
import { stem, stems, queryStems, scriptureRefs } from '../lib/learn-discover-text.js';
import { QUERIES } from './fixtures/learn-discover-queries.js';

const INV = learnInventory();
const P = prepareIndex(INDEX);

describe('the index is the catalog, and only points at it', () => {
  // PROTECTS AGAINST LOSS, ALLOWS GROWTH. Every lesson the index knows must still be mounted with the same
  // original title and the same course; a lesson added since is welcome (the author keeps writing) and is
  // reported by the `--check` script, which asks for the index to be re-derived.
  it('finds every indexed lesson still mounted, with its own title and course', () => {
    const have = new Map();
    for (const c of INV) for (const m of c.lessons) have.set(m.id, { course: c.key, title: String(m.title || '') });
    const lost = [];
    const retitled = [];
    const moved = [];
    for (const l of INDEX.lessons) {
      const h = have.get(l.i);
      if (!h) { lost.push(l.i); continue; }
      if (h.title !== l.t) retitled.push(l.i);
      if (h.course !== INDEX.courses[l.c].k) moved.push(l.i);
    }
    expect({ lost, retitled, moved }).toEqual({ lost: [], retitled: [], moved: [] });
  });
  it('holds each lesson once', () => {
    expect(new Set(INDEX.lessons.map((l) => l.i)).size).toBe(INDEX.lessons.length);
  });
  it('never shrinks: at least the 995 lessons, 51 courses and 13 departments measured on 2026-11-26', () => {
    const inv = { lessons: INV.reduce((n, c) => n + c.lessons.length, 0), courses: INV.length, departments: new Set(INV.map((c) => c.department)).size };
    expect(inv.lessons).toBeGreaterThanOrEqual(995);
    expect(inv.courses).toBeGreaterThanOrEqual(51);
    expect(inv.departments).toBeGreaterThanOrEqual(13);
    expect(INDEX.counts.lessons).toBeGreaterThanOrEqual(995);
  });
  it('keeps every department assignment exactly as Learn has it', () => {
    const dept = new Map(INV.map((c) => [c.key, c.department]));
    for (const c of INDEX.courses) expect(c.d, c.k).toBe(dept.get(c.k));
  });
});

describe('the finder rebuilt from the index is the finder Learn uses', () => {
  it('has the same title, reference and body haystacks as buildLessonIndex over the real catalog', () => {
    const real = buildLessonIndex(INV.map((c) => ({ key: c.key, meta: c.meta, schedule: c.lessons })));
    const byId = new Map(P.finderRows.map((r) => [r.lessonId, r]));
    for (const r of real) {
      const mine = byId.get(r.lessonId);
      if (!mine) continue; // a lesson added since the index was derived
      expect(mine, r.lessonId).toBeTruthy();
      expect(mine.hayTitle).toBe(r.hayTitle);
      expect(mine.hayRef).toBe(r.hayRef);
      expect(mine.hayPlain).toBe(r.hayPlain);
      expect(mine.courseKey).toBe(r.courseKey);
    }
  });
});

describe('a declared plain word keeps its seat in the window (DR-1049 / DR-1129 / DR-1329), on the real catalog', () => {
  it('every course that declared a word is reachable when that word is typed', () => {
    const words = new Set();
    for (const list of Object.values(COURSE_PLAIN_WORDS)) for (const w of list) words.add(w);
    const missing = [];
    for (const w of words) {
      const keys = new Set(discoverSearch(P, w).map((r) => r.courseKey));
      for (const c of INDEX.courses) if (plainWordsFor(c.k).includes(w) && !keys.has(c.k)) missing.push(`${c.k}: ${w}`);
    }
    expect(missing).toEqual([]);
  });
  it('the window is the size the finder uses', () => {
    expect(discoverSearch(P, 'money').length).toBe(RESULT_LIMIT);
  });
});

// Each question a person actually typed, with the words a fitting lesson carries.
// A hit is counted from the lesson's own promotional title, original title,
// theme and big idea — so a pass means the first screen is ABOUT the question.
const QUESTIONS = [
  ['Why am I always stressed?', /stress|worr|anxi|peace|fear|rest|burden|overwhelm|tired|mind/i],
  ['How can I strengthen my marriage?', /marri|husband|wife|spous|wedding|covenant|couple/i],
  ['How do I raise godly children?', /child|parent|famil|kid|son|daughter|youth|heritage|generation|little ones/i],
  ['How can I get out of debt?', /debt|loan|borrow|lend|owe|credit|payment|usury|interest|surety/i],
  ['How do I buy my first home?', /home|house|property|inspect|buy|mortgage|apprais|land|price/i],
  ['What does the Bible say about forgiveness?', /forgiv|mercy|apolog|confess|offen|pardon|reconcil|bitter/i],
  ['How do I find my purpose?', /purpose|call|gift|skill|craft|talent|vision|work|plan/i],
  ['How can I become a better leader?', /lead|shepherd|pastor|elder|serve|office|steward|follow/i],
  ['How can I grow closer to God?', /pray|spirit|worship|presence|obey|abide|seek|faith|know|holy|voice|hear/i],
];
const textOf = (id) => { const l = P.byId.get(id).raw; return `${l.p || ''} ${l.t} ${l.th || ''} ${l.b || ''}`; };

describe('natural questions reach the curriculum (measured on the real catalog)', () => {
  for (const [q, re] of QUESTIONS) {
    it(`"${q}" fills a full window and its first ten are about the question`, () => {
      const r = discoverSearch(P, q);
      expect(r.length).toBe(RESULT_LIMIT);
      const top = r.slice(0, 10);
      const about = top.filter((x) => re.test(textOf(x.lessonId))).length;
      expect(about, `${q}: ${about}/10 of the top ten match`).toBeGreaterThanOrEqual(5);
    });
  }
  it('a typed verse finds the lessons that quote it', () => {
    const r = discoverSearch(P, 'Matthew 6');
    expect(r.length).toBeGreaterThan(3);
    expect(r[0].why).toBe('verse');
  });
  it('a blank or meaningless query answers with nothing, never a wall of rows', () => {
    expect(discoverSearch(P, '')).toEqual([]);
    expect(discoverSearch(P, '   ')).toEqual([]);
    expect(discoverSearch(P, 'how do i')).toEqual([]);
  });
  it('searches the lesson content, not only titles: a body-only subject is found', () => {
    const r = discoverSearch(P, 'Why am I always stressed?');
    expect(r.some((x) => x.why === 'content' || x.why === 'topic' || x.why === 'related')).toBe(true);
  });
  it('is fast enough to run on every keystroke (well under 250 ms on this machine)', () => {
    const t = Date.now();
    for (const [q] of QUESTIONS) discoverSearch(P, q);
    expect((Date.now() - t) / QUESTIONS.length).toBeLessThan(250);
  });
});

describe('sixty realistic searches (conversational, short, misspelled, everyday), on the real catalog', () => {
  const fits = (Q) => discoverSearch(P, Q.q).slice(0, 10).filter((x) => Q.expect.test(textOf(x.lessonId))).length;
  it('has at least fifty of them, across the four ways people type', () => {
    expect(QUERIES.length).toBeGreaterThanOrEqual(50);
    expect(new Set(QUERIES.map((q) => q.kind))).toEqual(new Set(['question', 'phrase', 'typo', 'concern']));
  });
  it('every one answers, and at least half of its first ten fit it (an automated floor)', () => {
    const weak = QUERIES.map((Q) => [Q.q, fits(Q)]).filter(([, n]) => n < 5);
    expect(weak).toEqual([]);
  });
  it('the mean is at least 8 of 10 (measured 9.3 on 2026-11-26; the manual review is stricter, see SEARCH-EVALUATION.md)', () => {
    const mean = QUERIES.reduce((a, Q) => a + fits(Q), 0) / QUERIES.length;
    expect(mean).toBeGreaterThanOrEqual(8);
  });
  it('the three questions that were weak now clear eight of ten by the automated floor', () => {
    for (const q of ['How do I raise godly children?', 'What does the Bible say about forgiveness?', 'How can I grow closer to God?']) {
      expect(fits(QUERIES.find((Q) => Q.q === q)), q).toBeGreaterThanOrEqual(8);
    }
  });
  it('puts a misspelling right, and never changes a word the curriculum already uses', () => {
    // "forgivness" needs no correction: the stemmer already reads it as the stem of "forgiveness".
    const ids = (q) => discoverSearch(P, q).slice(0, 10).map((r) => r.lessonId);
    expect(ids('forgivness')).toEqual(ids('forgiveness'));
    expect(correctQuery(P, 'how to get a morgage').text).toBe('how to get a mortgage');
    expect(correctQuery(P, 'raising childern').text).toBe('raising children');
    for (const w of ['forgiveness', 'marriage', 'mortgage', 'anxiety', 'landlord']) expect(correctQuery(P, w).changed).toEqual([]);
  });
});

describe('the discovery categories are supported by the real curriculum', () => {
  const M = categoryMembers(P);
  it('declares the twelve categories Darrell named', () => {
    expect(CATEGORIES.map((c) => c.label)).toEqual([
      'Faith & Spiritual Growth', 'Marriage & Relationships', 'Parenting & Family', 'Mental & Emotional Wellness',
      'Purpose & Personal Growth', 'Money & Financial Stewardship', 'Business & Entrepreneurship', 'Real Estate & Homeownership',
      'Leadership & Ministry', 'Bible Study & Scripture', 'History & Understanding Our World', 'Technology, AI & Innovation',
    ]);
  });
  it('fills every one with at least MIN_SHOWN lessons, so none is shown empty', () => {
    for (const c of CATEGORIES) expect(M.get(c.id).lessonIds.length, c.label).toBeGreaterThanOrEqual(MIN_SHOWN);
  });
  it('only lists lessons that exist, each at most once, and lets a lesson sit in several', () => {
    const per = new Map();
    for (const c of CATEGORIES) {
      const ids = M.get(c.id).lessonIds;
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) { expect(P.byId.has(id), id).toBe(true); per.set(id, (per.get(id) || 0) + 1); }
    }
    expect([...per.values()].some((n) => n > 1)).toBe(true);
  });
  it('places lessons that were read by hand, each prefix resolving to exactly one lesson', () => {
    const prefixes = new Set([...Object.values(REVIEWED).flat(), ...UNPLACED]);
    for (const pre of prefixes) {
      const hits = INDEX.lessons.filter((l) => l.i.startsWith(pre));
      expect(hits.length, `${pre} must match exactly one lesson`).toBe(1);
    }
    for (const id of Object.keys(REVIEWED)) expect(CATEGORIES.some((c) => c.id === id), id).toBe(true);
  });
  it('leaves only a handful of lessons in no category, and never forces one in', () => {
    const placed = new Set();
    for (const c of CATEGORIES) M.get(c.id).lessonIds.forEach((i) => placed.add(i));
    const none = INDEX.lessons.filter((l) => !placed.has(l.i)).map((l) => l.i);
    expect(none.length).toBeLessThanOrEqual(UNPLACED.length + 2);
    for (const pre of UNPLACED) expect(none.some((i) => i.startsWith(pre)), `${pre} was reviewed and has no fit`).toBe(true);
  });
  it('keeps a lesson that is in no category reachable by search, by its own title', () => {
    for (const pre of UNPLACED) {
      const L = INDEX.lessons.find((l) => l.i.startsWith(pre));
      const ids = discoverSearch(P, L.p || L.t).map((r) => r.lessonId);
      expect(ids, `${pre} must be found by its own title`).toContain(L.i);
    }
  });
  it('names real courses only', () => {
    const keys = new Set(INDEX.courses.map((c) => c.k));
    for (const c of CATEGORIES) for (const k of c.courses) expect(keys.has(k), `${c.id}: ${k}`).toBe(true);
  });
  it('fronts each category with an existing lesson photograph', () => {
    for (const c of CATEGORIES) {
      const id = (CATEGORY_PHOTO[c.id] || [])[0];
      expect(id, `${c.id} has no photo pick`).toBeTruthy();
      expect(P.byId.get(id) && P.byId.get(id).raw.im, `${c.id}: ${id}`).toBeTruthy();
    }
    expect(P.byId.get(HERO_LESSON).raw.im).toBeTruthy();
  });
  it('the Relationships shelf Learn Studio carries still resolves, lesson by lesson', () => {
    for (const id of RELATIONSHIP_LESSONS) expect(P.byId.has(id), id).toBe(true);
  });
});

describe('the five Featured Series are ordered lists of real lessons, drawn from the curriculum as it is', () => {
  it('are the five Darrell named, in order', () => {
    expect(SERIES.map((s) => s.title)).toEqual(['Overcoming Anxiety', 'Building a Stronger Marriage', 'Biblical Money Management', 'Identity & Purpose', "Walking in God's Plan"]);
  });
  it('resolve every lesson, with none repeated inside a series and at least eight in each', () => {
    for (const s of SERIES) {
      expect(new Set(s.lessons).size, `${s.id} repeats a lesson`).toBe(s.lessons.length);
      expect(s.lessons.length, s.id).toBeGreaterThanOrEqual(8);
      for (const id of s.lessons) expect(P.byId.has(id), `${s.id}: ${id}`).toBe(true);
    }
  });
  it('change no course assignment: a lesson in a series still lives in its own course', () => {
    for (const s of SERIES) for (const id of s.lessons) {
      const own = INV.find((c) => c.lessons.some((m) => m.id === id));
      expect(own && own.key, id).toBe(P.byId.get(id).course.k);
    }
  });
});

describe("Today's Word is the shipped King James text, verbatim", () => {
  const getBook = async (file) => JSON.parse(readFileSync(join(__dirname, '../../public/bible/kjv', `${file}.json`), 'utf8'));
  it('has lessons whose anchor is one short plain passage', () => {
    expect(wordCandidates(INDEX).length).toBeGreaterThan(100);
  });
  it('parses plain passages and refuses lists and ranges that are too long', () => {
    expect(parsePassage('Philippians 4:8')).toMatchObject({ book: 'Philippians', chapter: 4, from: 8, to: 8 });
    expect(parsePassage('Psalm 23:1-3')).toMatchObject({ book: 'Psalms', file: 'Psalms' });
    expect(parsePassage('1 Thessalonians 5:21')).toMatchObject({ file: '1Thessalonians' });
    expect(parsePassage('Hebrews 1:1-2; 2 Peter 1:20-21')).toBeNull();
    expect(parsePassage('Psalm 119:1-40')).toBeNull();
  });
  it('returns text that is exactly the verses in the shipped file, for a run of days', async () => {
    for (let d = 0; d < 14; d += 1) {
      const w = await todaysWord(INDEX, getBook, new Date(2026, 10, 26 + d));
      expect(w, `day ${d}`).toBeTruthy();
      const p = parsePassage(w.ref.replace('–', '-'));
      const book = await getBook(p.file);
      expect(w.text).toBe(book.chapters[p.chapter - 1].slice(p.from - 1, p.to).join(' ').replace(/\s+/g, ' ').trim());
      expect(w.translation).toBe('KJV');
    }
  });
  it('is the same on one day and different on the next', async () => {
    const a = await todaysWord(INDEX, getBook, new Date(2026, 10, 26, 6));
    const b = await todaysWord(INDEX, getBook, new Date(2026, 10, 26, 21));
    const c = await todaysWord(INDEX, getBook, new Date(2026, 10, 27, 9));
    expect(a.ref).toBe(b.ref);
    expect(c.ref).not.toBe(a.ref);
  });
  it('shows nothing, never an empty Word, when the verse cannot be read', async () => {
    expect(await todaysWord(INDEX, async () => null, new Date(2026, 10, 26))).toBeNull();
  });
});

describe('the shared word rules', () => {
  it('meets one stem for the forms a reader types', () => {
    expect(stem('raise')).toBe(stem('raising'));
    expect(stem('houses')).toBe(stem('house'));
    expect(stem('children')).toBe(stem('child'));
    expect(stem('forgiveness')).toBe(stem('forgive'));
    expect(stem('forgiven')).toBe(stem('forgive'));
  });
  it('drops question words and keeps the subject', () => {
    expect(queryStems('How do I buy my first home?')).toEqual(expect.arrayContaining([stem('buy'), stem('first'), stem('home')]));
    expect(queryStems('How do I')).toEqual([]);
    expect(stems('The Word of Yahweh')).toContain('yahweh');
  });
  it('reads scripture references and normalises Psalm', () => {
    expect(scriptureRefs('see Psalm 23:1 and 1 Corinthians 13')).toEqual(['psalms 23', '1 corinthians 13']);
  });
});
