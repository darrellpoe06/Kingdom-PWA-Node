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
import { prepareIndex, discoverSearch, RESULT_LIMIT } from '../lib/learn-discover-search.js';
import { CATEGORIES, categoryMembers, MIN_SHOWN } from '../lib/learn-discover-categories.js';
import { CATEGORY_PHOTO, HERO_LESSON } from '../lib/learn-discover-photos.js';
import { RELATIONSHIP_LESSONS } from '../lib/learn-presentation/presentation.js';
import { parsePassage, wordCandidates, todaysWord } from '../lib/learn-discover-word.js';
import { stem, stems, queryStems, scriptureRefs } from '../lib/learn-discover-text.js';

const INV = learnInventory();
const P = prepareIndex(INDEX);

describe('the index is the catalog, and only points at it', () => {
  it('holds every mounted lesson once, with its own title and course, and nothing else', () => {
    const want = new Map();
    for (const c of INV) for (const m of c.lessons) want.set(m.id, { course: c.key, title: String(m.title || '') });
    expect(INDEX.lessons.length).toBe(want.size);
    const seen = new Set();
    for (const l of INDEX.lessons) {
      const w = want.get(l.i);
      expect(w, `index holds ${l.i}, which is not a mounted lesson`).toBeTruthy();
      expect(INDEX.courses[l.c].k, `${l.i} course`).toBe(w.course);
      expect(l.t, `${l.i} original title`).toBe(w.title);
      expect(seen.has(l.i)).toBe(false);
      seen.add(l.i);
    }
  });
  it('measures the live inventory (995 lessons, 51 courses, 13 departments on 2026-11-26)', () => {
    expect(INDEX.counts.lessons).toBe(INV.reduce((n, c) => n + c.lessons.length, 0));
    expect(INDEX.counts.courses).toBe(INV.length);
    expect(INDEX.counts.departments).toBe(new Set(INV.map((c) => c.department)).size);
    expect(INDEX.counts.lessons).toBeGreaterThanOrEqual(995);
  });
  it('keeps every department assignment exactly as Learn has it', () => {
    INV.forEach((c, i) => expect(INDEX.courses[i].d, c.key).toBe(c.department));
  });
});

describe('the finder rebuilt from the index is the finder Learn uses', () => {
  it('has the same title, reference and body haystacks as buildLessonIndex over the real catalog', () => {
    const real = buildLessonIndex(INV.map((c) => ({ key: c.key, meta: c.meta, schedule: c.lessons })));
    expect(P.finderRows.length).toBe(real.length);
    const byId = new Map(P.finderRows.map((r) => [r.lessonId, r]));
    for (const r of real) {
      const mine = byId.get(r.lessonId);
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
    expect(stem('forgiveness')).toBe('forgiveness');
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
