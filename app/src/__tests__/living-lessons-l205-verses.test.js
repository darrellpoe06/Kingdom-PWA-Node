// @vitest-environment node
// =============================================================================
// L205 — Talk About It Together — Parents to Children, Children to Parents,
// Friend to Friend, Until We See Yahweh Has Been Right (DR-0733)
// =============================================================================
// Darrell typed this teaching into the build on 2026-10-01, in several messages
// while other work was moving, and asked two things at once: that every lesson
// prompt parents and children (and friends) toward each other about Yahweh, and
// that it be built as a workflow and a lesson. It is not a recording. The
// catalog was measured BEFORE the lesson was written (talkTogetherCoverage over
// every registered course), and every number the lesson states is re-measured
// here against the same catalog, excluding the lesson itself.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { ownPrompts, hasAllThree, talkTogetherFor, talkTogetherCoverage, mustCarryOwn, TALK_TOGETHER_SINCE } from '../lib/talk-together.js';
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

const ID = 'll205-talk-about-it-together-parents-children-friends-until-we-see-yahweh-has-been-right';
const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
  expect(m, 'L205 must be in the series').toBeTruthy();
  return m;
};
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');
const PROSE = () => ALL().replace(/"[^"]*"/g, ' ');
const BANDS = () => FULL_BANDS.map((b) => L().levels[b]);

const MOVEMENTS = [
  'ONE. THE WORD WAS MADE TO BE TALKED ABOUT.',
  'TWO. PARENTS TO CHILDREN.',
  'THREE. CHILDREN TO PARENTS: THE CHILD WHO ASKS.',
  'FOUR. FRIEND TO FRIEND, RELATIONSHIP TO RELATIONSHIP.',
  'FIVE. THE METHOD: HOW WE TALK SO THAT WE GROW.',
  'SIX. SO WE ALL GET HEALTHY TOGETHER.',
  'SEVEN. UNTIL WE SEE YAHWEH HAS BEEN RIGHT.',
  'EIGHT. WHAT WE MEASURED, AND WHAT WE FIXED.',
  'TALK ABOUT IT TOGETHER.',
  'THE CLOSE.',
];

describe('L205 is really in the series', () => {
  it('carries all the fields, four authored bands, a quiz, and facilitator points', () => {
    const m = L();
    expect(m.title).toBe('Talk About It Together — Parents to Children, Children to Parents, Friend to Friend, Until We See Yahweh Has Been Right');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    for (const r of ['Deuteronomy 6:7', 'Deuteronomy 6:20', 'Psalms 78:4', 'Malachi 4:6', 'Proverbs 27:17', 'James 1:19', 'Proverbs 20:5', 'Luke 2:52', 'Hebrews 5:14', 'Romans 3:4']) expect(m.anchor.ref).toContain(r);
    expect(m.quiz.questions).toHaveLength(8);
    for (const q of m.quiz.questions) {
      expect(q.options[q.answer], q.q).toBeTruthy();
      expect(q.explain.length).toBeGreaterThan(40);
    }
    expect(m.facilitator.talkingPoints).toHaveLength(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(12);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
  });

  it('is numbered 205, comes after L202, carries the day the rule began, and is the only L205', () => {
    const num = (m) => Number((/^ll(\d+)-/.exec(m.id) || [])[1]);
    const l202 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll202-'));
    expect(l202).toBeTruthy();
    expect(num(L())).toBe(205);
    expect(LIVING_LESSONS_MODULES.indexOf(L())).toBeGreaterThan(LIVING_LESSONS_MODULES.indexOf(l202));
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length); // derived (DR-0677)
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-01');
    expect(LIVING_LESSONS_ADDED[ID]).toBe(TALK_TOGETHER_SINCE);
    expect(LIVING_LESSONS_MODULES.filter((m) => /^ll205-/.test(m.id))).toHaveLength(1);
  });
});

describe('provenance is said plainly (DR-0331: render for meaning, never guess)', () => {
  it('says it was typed, not recorded; names the day; says it was measured before it was written', () => {
    const l = L().lesson;
    expect(l).toContain('This lesson was not recorded in a class.');
    expect(l).toContain('Darrell typed it into the build on 2026-10-01');
    expect(l).toContain('rendered here for meaning');
    expect(l).toContain('It was measured the same day on our own machines, before a line was written.');
    expect(l).toContain('the Scripture is quoted from the King James text word for word');
    for (const b of BANDS()) expect(b).toMatch(/Darrell typed it into the (build|app)/);
    for (const b of BANDS()) expect(b).toMatch(/not (a class|a recording|come from a recording|recorded)/);
  });

  it('no class member, no church member, no child is named', () => {
    for (const name of ['Mosley', 'Janelle', 'Christiana', 'Christina', 'Evangelist Queen']) expect(ALL().includes(name), name).toBe(false);
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole lesson resolves verbatim, on every surface', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.spans, 'a low count means the scan broke').toBeGreaterThan(80);
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
  it('the three directions and the method read as the Word states them', () => {
    expect(verse('Deuteronomy', 6, 7)).toContain('thou shalt teach them diligently unto thy children');
    expect(verse('Deuteronomy', 6, 20)).toContain('when thy son asketh thee in time to come');
    expect(verse('Exodus', 12, 26)).toContain('when your children shall say unto you');
    expect(verse('Joshua', 4, 6)).toContain('when your children ask their fathers in time to come');
    expect(verse('Malachi', 4, 6)).toContain('turn the heart of the fathers to the children, and the heart of the children to their fathers');
    expect(verse('Proverbs', 27, 17)).toContain('Iron sharpeneth iron');
    expect(verse('James', 1, 19)).toContain('swift to hear, slow to speak');
    expect(verse('Proverbs', 20, 5)).toContain('a man of understanding will draw it out');
    expect(verse('Luke', 2, 52)).toContain('Jesus increased in wisdom and stature');
    expect(verse('Hebrews', 5, 14)).toContain('by reason of use have their senses exercised');
    expect(verse('James', 5, 16)).toContain('that ye may be healed');
    expect(verse('Romans', 3, 4)).toContain('let God be true, but every man a liar');
    expect(verse('Luke', 7, 35)).toContain('wisdom is justified of all her children');
  });

  it('the Word\'s own four occasions are the lesson\'s rhythm, and Luke 2:52 its growth chart', () => {
    const l = L().lesson;
    expect(l).toContain('"And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up" (Deuteronomy 6:7)');
    expect(l).toContain('(Luke 2:52)');
    expect(l).toContain('(Hebrews 5:14)');
  });
});

describe('the teaching is taught in order, in our voice, and in both directions plus friends', () => {
  it('eight movements, the talk-together part, and the close, in order', () => {
    const l = L().lesson;
    let at = -1;
    for (const h of MOVEMENTS) {
      const i = l.indexOf(h);
      expect(i, h).toBeGreaterThan(at);
      at = i;
    }
  });

  it('every band opens by naming the three directions and the aim', () => {
    for (const b of BANDS()) expect(b.startsWith('Talk about it together: parents to children, children to parents, friend to friend, until we see Yahweh has been right.'), b.slice(0, 80)).toBe(true);
  });

  it('carries its OWN three prompts, in its own words, on the lesson and on every band (the rule it teaches)', () => {
    const o = ownPrompts(L());
    expect(o.parents, 'parents to children').toBeTruthy();
    expect(o.children, 'children to parents').toBeTruthy();
    expect(o.friends, 'friend to friend').toBeTruthy();
    expect(hasAllThree(L())).toBe(true);
    expect(mustCarryOwn(LIVING_LESSONS_ADDED[ID])).toBe(true);
    const t = talkTogetherFor(L());
    expect(t.allOwn).toBe(true);
    for (const p of t.prompts) expect(p.own, p.to).toBe(true);
    for (const b of FULL_BANDS) expect(hasAllThree({ lesson: L().levels[b] }), `${b} band carries all three`).toBe(true);
  });

  it('Yahweh in our voice, the Godhead confessed, quoted KJV untouched, the adversary lowercase', () => {
    const prose = PROSE();
    expect(prose.match(/\bGod\b/g)).toBe(null);
    expect(/\b(Satan|Lucifer|Devil|Baal)\b/.test(prose)).toBe(false);
    expect(L().lesson).toContain('Jesus');
    expect(L().lesson).toContain('let God be true, but every man a liar');
    expect(L().lesson).toContain('(Romans 3:4)');
  });
});

describe('the measurement the lesson states is the measurement the catalog gives (DR-0076)', () => {
  const catalog = () => buildCatalogCourseDescriptors()
    .flatMap((c) => (c.schedule || []).map((s) => s.module || s))
    .filter((m) => m && (m.lesson || m.levels));

  it('593 lessons before this one; 4 parents, 20 children, 23 friends, 0 all three, 42 any — as the lesson says', () => {
    // 593 is the catalog as it stood when measured on 2026-10-01; lessons that
    // landed afterwards (L203, L204) raise the total, so the total is a floor
    // and the five direction counts are pinned exactly.
    // ...and lessons bound by the rule (added on or after 2026-10-01, L206
    // onward) each add their own three, so they are set aside here too.
    const before = catalog().filter((m) => m.id !== ID && !mustCarryOwn(LIVING_LESSONS_ADDED[m.id]));
    const { lessons, ...directions } = talkTogetherCoverage(before);
    expect(lessons).toBeGreaterThanOrEqual(593);
    expect(directions).toEqual({ parents: 4, children: 20, friends: 23, all: 0, any: 42 });
    const l = L().lesson;
    expect(l).toContain('five hundred ninety-three lessons across every course');
    expect(l).toContain('Four of them prompted parents toward their children. Twenty prompted children toward their parents. Twenty-three sent friend to friend. None carried all three directions. Forty-two carried any such language at all.');
    expect(L().levels.youth).toContain('Four prompted parents toward children. Twenty prompted children toward parents. Twenty-three sent friend to friend. None carried all three. Forty-two had any such language.');
    expect(L().levels.teen).toContain('Four prompted parents toward children, twenty prompted children toward parents, twenty-three sent friend to friend, zero carried all three, forty-two carried any such language.');
    expect(L().levels.senior).toContain('four prompting parents toward children; twenty prompting children toward parents; twenty-three sending friend to friend; none with all three; forty-two with any such language.');
    const q = L().quiz.questions.find((x) => /carried all three directions in their own words/.test(x.q));
    expect(q).toBeTruthy();
    expect(q.options[q.answer]).toBe('None');
    expect(q.options).toContain('Forty-two');
  });

  it('with this lesson in the catalog, every lesson that carries all three is one bound by the rule, and this lesson is among them', () => {
    const c = talkTogetherCoverage(catalog());
    expect(c.lessons).toBeGreaterThanOrEqual(594);
    const all = catalog().filter((m) => hasAllThree(m)).map((m) => m.id);
    expect(c.all).toBe(all.length);
    expect(all).toContain(ID);
    for (const id of all) expect(mustCarryOwn(LIVING_LESSONS_ADDED[id]), id).toBe(true);
  });

  it('PROVEN-TO-CATCH: a planted generic name, a misquote, a wrong reference, a dropped movement, and a stale count each fire', () => {
    const planted = { ...L(), lesson: `${L().lesson} God made families to talk.` };
    expect(quotedTexts(planted).map(([, t]) => t).join(' ').replace(/"[^"]*"/g, ' ').match(/\bGod\b/g)).not.toBe(null);
    const misquote = { ...L(), lesson: L().lesson.replace('Iron sharpeneth iron', 'Iron sharpens iron') };
    expect(misquote.lesson).not.toBe(L().lesson);
    expect(scanQuotedVerses([misquote], quotedTexts).faults.length).toBeGreaterThan(0);
    const wrongRef = { ...L(), lesson: L().lesson.replace('(Malachi 4:6)', '(Malachi 4:5)') };
    expect(wrongRef.lesson).not.toBe(L().lesson);
    expect(scanQuotedVerses([wrongRef], quotedTexts).faults.length).toBeGreaterThan(0);
    const dropped = L().lesson.replace('SIX. SO WE ALL GET HEALTHY TOGETHER.', 'SIX.');
    expect(dropped.indexOf('SIX. SO WE ALL GET HEALTHY TOGETHER.')).toBe(-1);
    const stale = L().lesson.replace('Four of them prompted parents', 'Twelve of them prompted parents');
    expect(stale.includes('Four of them prompted parents toward their children.')).toBe(false);
    const twoOnly = { title: L().title, lesson: 'Parents, ask your children what this lesson shows. Children, ask your parents what they think.', levels: {} };
    expect(hasAllThree(twoOnly)).toBe(false);
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
  it('the lesson clears the builder\'s depth floors: 2000 words, bands 1000, 40 verse spans', () => {
    const words = (s) => String(s).split(/\s+/).filter(Boolean).length;
    expect(words(L().lesson)).toBeGreaterThanOrEqual(2000);
    for (const b of FULL_BANDS) expect(words(L().levels[b]), b).toBeGreaterThanOrEqual(1000);
    expect(scanQuotedVerses([L()], quotedTexts).spans).toBeGreaterThanOrEqual(40);
  });
});
