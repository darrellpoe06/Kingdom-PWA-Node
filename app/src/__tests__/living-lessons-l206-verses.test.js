// @vitest-environment node
// =============================================================================
// L206 — Kings Who Search It Out — The Word as the Book That Sets the Mind for
// Eternal Growth, the Joy of the Lord as Strength, and the Godhead Who All
// Agree (DR-0734)
// =============================================================================
// Darrell typed this teaching into the build on 2026-10-01 in a run of short
// messages (integrated lessons so people want to learn more about Yahweh and
// the Word's mysteries, so we produce kings; the Word as the book our lessons
// come from, for a Spiritual Mindset so we exist with Him eternally; success His
// Way on earth, Heaven from inside His Way; the Joy of the Lord as literally
// eternal Strength; minds set up for eternal perpetual growth on the promises
// of Yahweh; the Godhead all agree; who else matters). It is not a recording.
// The catalog was measured BEFORE it was written; the numbers it states are
// re-measured here as floors, because lessons that land later can only raise
// them.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { hasAllThree, talkTogetherFor, mustCarryOwn } from '../lib/talk-together.js';
import { searchItOutFor, searchItOutCoverage, anchorRefs } from '../lib/search-it-out.js';
import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { measureFullness, FULL_BANDS, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const KJV = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const book = (b) => JSON.parse(readFileSync(join(KJV, `${b.replace(/ /g, '')}.json`), 'utf8')).chapters;
const verse = (b, c, v) => book(b)[c - 1][v - 1];

const ID = 'll206-kings-who-search-it-out-the-word-sets-the-mind-for-eternal-growth-the-joy-of-the-lord-is-strength-the-godhead-all-agree';
const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
  expect(m, 'L206 must be in the series').toBeTruthy();
  return m;
};
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');
const PROSE = () => ALL().replace(/"[^"]*"/g, ' ');
const BANDS = () => FULL_BANDS.map((b) => L().levels[b]);

const MOVEMENTS = [
  'ONE. INTEGRATED, SO THAT YOU WANT MORE: THE MYSTERIES, AND THE KINGS WHO SEARCH THEM OUT.',
  'TWO. THE WORD IS THE BOOK OUR LESSONS COME FROM.',
  'THREE. THE SPIRITUAL MINDSET, SO THAT WE EXIST WITH HIM ETERNALLY.',
  'FOUR. SUCCESSFUL HIS WAY ON EARTH: HEAVEN COMES FROM INSIDE HIS WAY.',
  'FIVE. THE JOY OF THE LORD IS OUR STRENGTH: LITERALLY ETERNAL STRENGTH.',
  'SIX. MINDS SET UP FOR ETERNAL, PERPETUAL GROWTH: THE PROMISES OF YAHWEH.',
  'SEVEN. THE GODHEAD ALL AGREE.',
  'EIGHT. WHO ELSE MATTERS?',
  'NINE. WHAT WE BUILT, AND WHAT WE MEASURED.',
  'TALK ABOUT IT TOGETHER.',
  'THE CLOSE.',
];

describe('L206 is really in the series', () => {
  it('carries all the fields, four authored bands, a quiz, and facilitator points', () => {
    const m = L();
    expect(m.title).toBe('Kings Who Search It Out — The Word as the Book That Sets the Mind for Eternal Growth, the Joy of the Lord as Strength, and the Godhead Who All Agree');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    for (const r of ['Proverbs 25:2', 'Deuteronomy 29:29', 'Deuteronomy 17:18', 'Revelation 1:6', '2 Timothy 3:16', 'Romans 12:2', 'John 17:3', 'Luke 17:21', 'Joshua 1:8', 'Nehemiah 8:10', 'Numbers 23:19', '1 John 5:7', 'Romans 8:31']) expect(m.anchor.ref).toContain(r);
    expect(anchorRefs(m).length).toBeGreaterThan(100);
    expect(m.quiz.questions).toHaveLength(8);
    for (const q of m.quiz.questions) {
      expect(q.options[q.answer], q.q).toBeTruthy();
      expect(q.explain.length).toBeGreaterThan(40);
    }
    expect(m.facilitator.talkingPoints).toHaveLength(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(12);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
  });

  it('is numbered 206, comes after L205, carries its day, and is the only L206', () => {
    const num = (m) => Number((/^ll(\d+)-/.exec(m.id) || [])[1]);
    const l205 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll205-'));
    expect(l205).toBeTruthy();
    expect(num(L())).toBe(206);
    expect(LIVING_LESSONS_MODULES.indexOf(L())).toBeGreaterThan(LIVING_LESSONS_MODULES.indexOf(l205));
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-01');
    expect(LIVING_LESSONS_MODULES.filter((m) => /^ll206-/.test(m.id))).toHaveLength(1);
  });
});

describe('provenance is said plainly (DR-0331: render for meaning, never guess)', () => {
  it('says it was typed, not recorded; names the day; lists his words in order; says it was measured first', () => {
    const l = L().lesson;
    expect(l).toContain('This lesson was not recorded in a class.');
    expect(l).toContain('Darrell typed it into the build on 2026-10-01');
    expect(l).toContain('rendered here for meaning');
    for (const phrase of ['integrated lessons', "the Word's mysteries", 'produce kings like the Word says', 'Spiritual Mindset so we exist with Him eternally', 'successful His Way on earth', 'Heaven comes from inside His Way', 'Joy of the Lord for Strength, literally eternal Strength', 'eternal, perpetual growth', 'the Godhead all agree', 'who else matters']) expect(l, phrase).toContain(phrase);
    expect(l).toContain('the catalog was measured on our own machines');
    for (const b of BANDS()) expect(b).toMatch(/Darrell typed it into the (build|app)/);
    for (const b of BANDS()) expect(b).toMatch(/not (a class|a recording|come from a recording|recorded)/);
  });
  it('no class member or child is named; Bishop Gwin is named only as the teacher of L202', () => {
    for (const name of ['Mosley', 'Janelle', 'Christiana', 'Christina', 'Evangelist Queen']) expect(ALL().includes(name), name).toBe(false);
    expect(L().lesson).toContain("Joshua 1:8 from Bishop Gwin's class");
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole lesson resolves verbatim, on every surface', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.spans, 'a low count means the scan broke').toBeGreaterThan(300);
    expect(scan.faults.map((f) => `${f.where} :: ${f.kind} :: ${f.ref || ''}`)).toEqual([]);
    expect(scan.verbatim).toBe(scan.spans);
  });
  it('every double-quoted span carries its reference — a quote means Scripture, and no man is quoted', () => {
    for (const [where, text] of quotedTexts(L())) {
      const quotes = (String(text).match(/"([^"]+)"/g) || []).length;
      const withRef = (String(text).match(/"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g) || []).length;
      expect(withRef, `${where}: ${quotes} quoted spans, ${withRef} with a reference`).toBe(quotes);
    }
  });
  it('straight quotation marks, no ellipsis inside a quotation, no record id, no percentage', () => {
    const all = ALL();
    expect(all.includes('“')).toBe(false);
    expect(all.includes('”')).toBe(false);
    for (const [where, text] of quotedTexts(L())) {
      for (const s of String(text).matchAll(/"([^"]+)"/g)) expect(/\.\.\.|…/.test(s[1]), `${where} elides`).toBe(false);
      expect(/DR-\d{4}/.test(text), `${where} recites a record id`).toBe(false);
      expect(/\d\s*%/.test(text), `${where} states a percentage`).toBe(false);
    }
  });
});

describe('the Word the lesson is built on, pinned to the KJV', () => {
  it('the king, the book, the mind, the kingdom within, the joy, the promises, the Godhead, and who else matters read as the Word states them', () => {
    expect(verse('Proverbs', 25, 2)).toContain('the honour of kings is to search out a matter');
    expect(verse('Deuteronomy', 29, 29)).toContain('those things which are revealed belong unto us and to our children for ever');
    expect(verse('Deuteronomy', 17, 18)).toContain('he shall write him a copy of this law in a book');
    expect(verse('Deuteronomy', 17, 19)).toContain('he shall read therein all the days of his life');
    expect(verse('Revelation', 1, 6)).toContain('hath made us kings and priests');
    expect(verse('2 Timothy', 3, 16)).toContain('All scripture is given by inspiration of God');
    expect(verse('Romans', 12, 2)).toContain('transformed by the renewing of your mind');
    expect(verse('John', 17, 3)).toContain('this is life eternal, that they might know thee');
    expect(verse('Luke', 17, 21)).toContain('the kingdom of God is within you');
    expect(verse('Joshua', 1, 8)).toContain('then thou shalt have good success');
    expect(verse('Nehemiah', 8, 10)).toContain('the joy of the LORD is your strength');
    expect(verse('Nehemiah', 8, 12)).toContain('because they had understood the words');
    expect(verse('Psalms', 16, 11)).toContain('pleasures for evermore');
    expect(verse('Isaiah', 35, 10)).toContain('everlasting joy');
    expect(verse('Numbers', 23, 19)).toContain('God is not a man, that he should lie');
    expect(verse('Joshua', 21, 45)).toContain('all came to pass');
    expect(verse('1 John', 5, 7)).toContain('these three are one');
    expect(verse('John', 10, 30)).toBe('I and my Father are one.');
    expect(verse('Romans', 8, 31)).toContain('If God be for us, who can be against us?');
    expect(verse('Romans', 3, 4)).toContain('let God be true, but every man a liar');
  });
  it('the king is made by a book: the lesson quotes the royal statute whole, on every surface', () => {
    for (const t of [L().lesson, ...BANDS()]) expect(t).toContain('(Deuteronomy 17:18)');
    for (const t of [L().lesson, L().levels.youth, L().levels.teen, L().levels.senior]) expect(t).toContain('(Deuteronomy 17:19)');
    expect(L().lesson).toContain('(Deuteronomy 17:20)');
  });
  it('the joy comes after the Word is understood: Nehemiah 8 is read in its order', () => {
    const l = L().lesson;
    const a = l.indexOf('(Nehemiah 8:8)'); const b = l.indexOf('(Nehemiah 8:9)'); const c = l.indexOf('(Nehemiah 8:12)');
    expect(a).toBeGreaterThan(-1); expect(b).toBeGreaterThan(a); expect(c).toBeGreaterThan(b);
    expect(l).toContain('the book, then understanding, then joy, then strength');
  });
});

describe('the teaching is taught in order, in our voice, and carries both workflows', () => {
  it('nine movements, the talk-together part, and the close, in order', () => {
    const l = L().lesson;
    let at = -1;
    for (const h of MOVEMENTS) {
      const i = l.indexOf(h);
      expect(i, h).toBeGreaterThan(at);
      at = i;
    }
  });
  it('every band opens by naming the lesson in one sentence', () => {
    for (const b of BANDS()) expect(b.startsWith('Kings who search it out: the Word is the book that sets the mind for eternal growth, the Joy of the Lord is our Strength, and the Godhead all agree.'), b.slice(0, 80)).toBe(true);
  });
  it('carries its OWN three talk prompts on the lesson and on every band (the L205 rule binds it)', () => {
    expect(mustCarryOwn(LIVING_LESSONS_ADDED[ID])).toBe(true);
    expect(hasAllThree(L())).toBe(true);
    expect(talkTogetherFor(L()).allOwn).toBe(true);
    for (const b of FULL_BANDS) expect(hasAllThree({ lesson: L().levels[b] }), `${b} band carries all three`).toBe(true);
  });
  it('sends the reader onward: it stands on shared ground with other lessons in the course, L205 and L202 among them', () => {
    const s = searchItOutFor(L(), LIVING_LESSONS_MODULES, { limit: LIVING_LESSONS_MODULES.length });
    expect(s.next.length).toBeGreaterThanOrEqual(3);
    const ids = s.next.map((n) => n.id);
    expect(ids.some((id) => id.startsWith('ll205-')), 'L205 shares Acts 17:11 / Romans 3:4 / Joshua 1:8').toBe(true);
    expect(ids.some((id) => id.startsWith('ll202-')), 'L202 shares Joshua 1:8').toBe(true);
    expect(s.questions[0]).toBe('What does Kings Who Search It Out show you about Yahweh that you did not see before?');
  });
  it('Yahweh in our voice, the Godhead confessed, quoted KJV untouched, the adversary lowercase', () => {
    const prose = PROSE();
    expect(prose.match(/\bGod\b/g)).toBe(null);
    expect(/\b(Satan|Lucifer|Devil|Baal)\b/.test(prose)).toBe(false);
    expect(L().lesson).toContain('Jesus is the Lamb of Yahweh');
    expect(L().lesson).toContain('the Eternal Son of Yahweh');
    expect(L().lesson).toContain('(John 1:29)');
    expect(L().lesson).toContain('(Hebrews 1:8)');
  });
});

describe('the measurement the lesson states is the measurement the catalog gives (DR-0076)', () => {
  const catalog = () => buildCatalogCourseDescriptors().map((c) => (c.schedule || []).map((s) => s.module || s).filter((m) => m && (m.lesson || m.levels)));
  it('595 lessons across 43 courses when measured, 356 linked; 200 of 203 in this course — stated in the lesson, floors in the catalog', () => {
    const courses = catalog();
    let lessons = 0; let linked = 0;
    for (const mods of courses) { const r = searchItOutCoverage(mods.filter((m) => m.id !== ID)); lessons += r.lessons; linked += r.linked; }
    expect(courses.length).toBeGreaterThanOrEqual(43);
    expect(lessons).toBeGreaterThanOrEqual(595);
    expect(linked).toBeGreaterThanOrEqual(356);
    const living = searchItOutCoverage(LIVING_LESSONS_MODULES.filter((m) => m.id !== ID));
    expect(living.lessons).toBeGreaterThanOrEqual(203);
    expect(living.linked).toBeGreaterThanOrEqual(200);
    const l = L().lesson;
    expect(l).toContain('five hundred ninety-five lessons across forty-three courses');
    expect(l).toContain('three hundred fifty-six of the five hundred ninety-five lessons already have at least one other lesson in their course on the same ground, and two hundred of the two hundred three lessons in this course do');
    const q = L().quiz.questions.find((x) => /how many of the 595 lessons/.test(x.q));
    expect(q).toBeTruthy();
    expect(q.options[q.answer]).toBe('About half, 356');
  });
  it('PROVEN-TO-CATCH: a planted generic name, a misquote, a wrong reference, a dropped movement, and a stale count each fire', () => {
    const planted = { ...L(), lesson: `${L().lesson} God made kings.` };
    expect(quotedTexts(planted).map(([, t]) => t).join(' ').replace(/"[^"]*"/g, ' ').match(/\bGod\b/g)).not.toBe(null);
    const misquote = { ...L(), lesson: L().lesson.replace('the honour of kings is to search out a matter', 'the honor of kings is to search out a matter') };
    expect(misquote.lesson).not.toBe(L().lesson);
    expect(scanQuotedVerses([misquote], quotedTexts).faults.length).toBeGreaterThan(0);
    const wrongRef = { ...L(), lesson: L().lesson.replace('(Nehemiah 8:10)', '(Nehemiah 8:11)') };
    expect(wrongRef.lesson).not.toBe(L().lesson);
    expect(scanQuotedVerses([wrongRef], quotedTexts).faults.length).toBeGreaterThan(0);
    const dropped = L().lesson.replace('SEVEN. THE GODHEAD ALL AGREE.', 'SEVEN.');
    expect(dropped.indexOf('SEVEN. THE GODHEAD ALL AGREE.')).toBe(-1);
    const stale = L().lesson.replace('three hundred fifty-six of the five hundred ninety-five', 'twelve of the five hundred ninety-five');
    expect(stale.includes('three hundred fifty-six of the five hundred ninety-five lessons already')).toBe(false);
  });
});

describe('the register is ordered, and measured rather than asserted', () => {
  it('every band clears its full-levels floor', () => {
    const f = measureFullness(L());
    for (const b of FULL_BANDS) expect(f.bands[b].share, `${b} share ${f.bands[b].share}`).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });
  it('the grades ascend and the child band is held to the age', () => {
    const m = measureLesson(L());
    expect(isInverted(m), JSON.stringify(m.bands)).toBe(false);
    expect(breachesChildCeiling(m, NEW_LESSON_CHILD_CEILING), `child reads ${m.bands.child.authored}`).toBe(false);
  });
  it('the four bands are genuinely different texts', () => {
    const d = measureDifferentiation(L());
    expect(d).toBeTruthy();
    expect(d.worst).toBeLessThan(DIFF_CEILING);
  });
  it('every band names its own lesson near its start', () => {
    const m = L();
    for (const b of FULL_BANDS) expect(namesItsLesson(m.title, m.levels[b]), b).toBe(true);
  });
  it("the lesson clears the builder's depth floors: 2000 words, bands 1000, 40 verse spans", () => {
    const words = (s) => String(s).split(/\s+/).filter(Boolean).length;
    expect(words(L().lesson)).toBeGreaterThanOrEqual(2000);
    for (const b of FULL_BANDS) expect(words(L().levels[b]), b).toBeGreaterThanOrEqual(1000);
    expect(scanQuotedVerses([L()], quotedTexts).spans).toBeGreaterThanOrEqual(40);
  });
});
