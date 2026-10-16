// @vitest-environment node
// =============================================================================
// L248 — "His Ways Are Higher, So He Gives Us the Bread": the teaching Darrell
// SPOKE into the house on the morning of 2026-10-16, built the same session
// (a spoken teaching is build input). DR-1072.
// =============================================================================
// His sentences, carried in his order: it is not possible to think His thoughts
// on our own (Isaiah 55:8-9); that is why we have to have the bread, because
// without the bread there is no way to comprehend what He is saying; wanting
// the glory undermines understanding; He is the bread of life, you will go
// through this and eat it; suffering to reign with Him; if you think you know
// the future you cannot be in His will, yet He wants to blow your mind; raised,
// then watched and tested for the glory; meekness is strength under control;
// you comprehend because you did it before you understood it, it is never what
// I thought it was, it is always what it is; taste and see.
//
// THE WORD ANSWERS ITSELF HERE, and this gate pins it: Isaiah 55:8-9 states
// the gap, and the very next verses (55:10-11) say the higher thought comes
// down as rain that gives "bread to the eater: So shall my word be". The lesson
// is built on that sequence, so it is checked as a sequence below.
//
// WHAT THE CHECKS CAUGHT WHILE WRITING, mechanical, before commit: two
// quotations opened with the wrong case ("humble yourselves" where 1 Peter
// 5:6 reads "Humble", and "But if it die" where John 12:24 reads "but"), and
// all four bands short of their floor against a 2,590-word adult lesson (child
// 0.44, youth 0.38, teen 0.35, senior 0.38). The bands were deepened (the
// daily manna, the audience that authors your choices, Joseph's long middle,
// Paul's thorn, meekness at home and in the later decades, Habakkuk's empty
// fields) rather than the adult lesson cut. The first CI run caught one more:
// Isaiah 55:2 belongs to the appraisal course, which shares no verse with the
// rest of the catalog, so L248 does not quote it.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { fleschKincaidGrade, ourProseOnly, NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { placesMissingDirections } from '../lib/talk-together.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const verse = (book, ch, n) => {
  const p = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(p)) return null;
  const chap = JSON.parse(readFileSync(p, 'utf8')).chapters[Number(ch) - 1];
  return chap ? norm(chap[Number(n) - 1]) : null;
};
const BANDS = ['child', 'youth', 'teen', 'senior'];
const RE = /"([^"]{10,})"\s*\(([1-3]?\s?[A-Z][A-Za-z]+)\s+(\d+):([\d\-,\s]+)\)/g;
const spansOf = (L) => {
  const spans = [];
  const walk = (node, path) => {
    if (typeof node === 'string') {
      RE.lastIndex = 0;
      let g;
      while ((g = RE.exec(node))) spans.push({ path, quoted: g[1], book: g[2], ch: g[3], label: g[4].trim() });
    } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
  };
  walk(L, '');
  return spans;
};

const ID = 'll248-his-ways-are-higher-so-he-gives-the-bread';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const ALL = Object.keys(TEXTS);
const whole = ALL.map((k) => TEXTS[k]).join('\n');

const STRANDS = [
  ['the gap', 'Isaiah', 55, 8, 'For my thoughts are not your thoughts, neither are your ways my ways'],
  ['the measure of the gap', 'Isaiah', 55, 9, 'For as the heavens are higher than the earth, so are my ways higher than your ways'],
  ['the bridge comes down as bread', 'Isaiah', 55, 10, 'seed to the sower, and bread to the eater'],
  ['so shall my word be', 'Isaiah', 55, 11, 'So shall my word be that goeth forth out of my mouth'],
  ['the natural man cannot', '1 Corinthians', 2, 14, 'neither can he know them, because they are spiritually discerned'],
  ['the bread of life', 'John', 6, 35, 'I am the bread of life'],
  ['His words are spirit and life', 'John', 6, 63, 'they are spirit, and they are life'],
  ['the manna proved them', 'Exodus', 16, 4, 'that I may prove them, whether they will walk in my law, or no'],
  ['eaten before understood', 'Exodus', 16, 15, 'they wist not what it was'],
  ['not worthy of us', 'Numbers', 21, 5, 'our soul loatheth this light bread'],
  ['the hard saying', 'John', 6, 60, 'This is an hard saying; who can hear it?'],
  ['to whom shall we go', 'John', 6, 68, 'Lord, to whom shall we go? thou hast the words of eternal life'],
  ['wanting the glory blocks belief', 'John', 5, 44, 'How can ye believe, which receive honour one of another'],
  ['no glory', 'Luke', 17, 10, 'We are unprofitable servants'],
  ['nothing apart from Him', 'Galatians', 6, 3, 'when he is nothing, he deceiveth himself'],
  ['heirs in Him', 'Romans', 8, 17, 'heirs of God, and joint-heirs with Christ'],
  ['suffer to reign', '2 Timothy', 2, 12, 'If we suffer, we shall also reign with him'],
  ['the Son learned by suffering', 'Hebrews', 5, 8, 'yet learned he obedience by the things which he suffered'],
  ['good at the latter end', 'Deuteronomy', 8, 16, 'to do thee good at thy latter end'],
  ['blow your mind', '1 Corinthians', 2, 9, 'Eye hath not seen, nor ear heard'],
  ['revealed in us', 'Romans', 8, 18, 'the glory which shall be revealed in us'],
  ['if the Lord will', 'James', 4, 15, 'If the Lord will, we shall live, and do this, or that'],
  ['exalted in due time', '1 Peter', 5, 6, 'Humble yourselves therefore under the mighty hand of God, that he may exalt you in due time'],
  ['raised, then lifted up', '2 Chronicles', 26, 16, 'when he was strong, his heart was lifted up to his destruction'],
  ['understanding returned with the glory', 'Daniel', 4, 34, 'mine understanding returned unto me'],
  ['strength under control', 'Matthew', 26, 53, 'more than twelve legions of angels'],
  ['very meek', 'Numbers', 12, 3, 'Now the man Moses was very meek'],
  ['before he heareth it', 'Proverbs', 18, 13, 'He that answereth a matter before he heareth it'],
  ['when I thought to know this', 'Psalms', 73, 16, 'When I thought to know this, it was too painful for me'],
  ['taste and see', 'Psalms', 34, 8, 'O taste and see that the LORD is good'],
];

describe('L248 exists, is numbered, and is dated the morning it was spoken', () => {
  it('is in the catalog exactly once, as the highest number', () => {
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    const claimed = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(claimed.filter((n) => n === 248)).toHaveLength(1);
    expect(Math.max(...claimed)).toBe(248);
    for (const n of [79, 211, 212]) expect(claimed.includes(n), `${n} is not this lesson's to fill`).toBe(false);
  });
  it('carries the spoken day, after L247', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-16');
    const before = Object.entries(LIVING_LESSONS_ADDED).find(([k]) => k.startsWith('ll247-'));
    expect(before[1] <= LIVING_LESSONS_ADDED[ID]).toBe(true);
  });
  it('names Darrell as the one who spoke it, in the adult lesson', () => {
    expect(/spoken into this house by Darrell/.test(L.lesson)).toBe(true);
  });
});

describe('L248 carries Darrell’s words in every band', () => {
  it.each([
    [/bread/i, 'the bread'],
    [/glory/i, 'the glory'],
    [/suffer/i, 'suffering to reign'],
    [/meek/i, 'meekness'],
    [/strength under control/i, 'strength under control'],
    [/never what (?:I|you|we|they) thought/i, 'never what I thought it was'],
    [/taste and see/i, 'taste and see'],
  ])('%s — %s', (re, what) => {
    for (const k of ALL) expect(re.test(TEXTS[k]), `${k} drops ${what}`).toBe(true);
  });
  it('the adult lesson keeps his hinge sentence in his words', () => {
    expect(L.lesson).toContain('Wanting the glory undermines understanding.');
    expect(L.lesson).toContain('without the bread there is no way we can comprehend what He is saying');
    expect(L.lesson).toContain('It is never what I thought it was; it is always what it is.');
  });
});

describe('L248 — the Word answers the gap in the next verse, and the lesson keeps that order', () => {
  it.each(['adult', ...BANDS])('%s quotes Isaiah 55:9 before Isaiah 55:10, and both before the bread of life', (k) => {
    const t = TEXTS[k];
    const gap = t.indexOf('(Isaiah 55:9)');
    const bridge = t.indexOf('(Isaiah 55:10)');
    const bread = t.indexOf('(John 6:35)');
    expect(gap, `${k} never quotes Isaiah 55:9`).toBeGreaterThan(-1);
    expect(bridge, `${k} never quotes Isaiah 55:10`).toBeGreaterThan(gap);
    expect(bread, `${k} never names the bread of life`).toBeGreaterThan(bridge);
  });
});

describe('L248 — every quoted span is the verse', () => {
  it.each(STRANDS)('%s — %s %s:%s', (_why, book, ch, n, span) => {
    const v = verse(book, ch, n);
    expect(v, `${book} ${ch}:${n} resolves`).toBeTruthy();
    expect(v.includes(span), `the span is not in ${book} ${ch}:${n}`).toBe(true);
    expect(whole.includes(span), `the lesson does not carry ${book} ${ch}:${n}`).toBe(true);
  });

  const spans = L ? spansOf(L) : [];
  it('finds a substantial number of referenced spans', () => {
    expect(spans.length).toBeGreaterThan(250);
  });
  it('every referenced span is verbatim in the verse it cites, case and all', () => {
    const bad = [];
    for (const s of spans) {
      const nums = [];
      for (const part of s.label.split(',')) {
        const r = part.trim().match(/^(\d+)\s*-\s*(\d+)$/);
        if (r) for (let i = Number(r[1]); i <= Number(r[2]); i += 1) nums.push(i);
        else if (part.trim()) nums.push(Number(part.trim()));
      }
      const joined = nums.map((n) => verse(s.book, s.ch, n)).join(' ');
      if (!joined || !norm(joined).includes(norm(s.quoted))) bad.push(`${s.path} :: ${s.book} ${s.ch}:${s.label} :: "${s.quoted.slice(0, 70)}"`);
    }
    expect(bad, `not His words as written:\n${bad.join('\n')}`).toEqual([]);
  });
  it('uses the corpus apostrophe inside quotations', () => {
    for (const s of spans) expect(/'/.test(s.quoted), `${s.path} carries a straight apostrophe inside a quotation`).toBe(false);
  });
  it('marks no elision and recites no record', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });
  it('leaves "God" and "satan" exactly as the verses carry them', () => {
    for (const u of ['the things which God hath prepared for them that love him', 'God left him, to try him', 'the messenger of satan to buffet me']) {
      expect(whole.includes(u), `drops: ${u}`).toBe(true);
    }
  });
  it('leaves Isaiah 55:2 to the appraisal course, which claims it as its own (appraisal-course.test.js)', () => {
    // CI caught this on the first push: the first draft quoted Isaiah 55:2 in
    // three places, and the appraisal course shares no verse with the catalog.
    expect(whole.includes('(Isaiah 55:2)')).toBe(false);
    expect(JSON.stringify(L).includes('Wherefore do ye spend money for that which is not bread')).toBe(false);
  });
  it('the two case catches stay caught', () => {
    expect(JSON.stringify(L).includes('"humble yourselves therefore')).toBe(false);
    expect(JSON.stringify(L).includes('"But if it die')).toBe(false);
    expect(verse('1 Peter', 5, 6).startsWith('Humble yourselves')).toBe(true);
    expect(verse('John', 12, 24).includes('but if it die')).toBe(true);
  });
});

describe('L248 — four bands, each carrying the whole message', () => {
  const measured = measureFullness(L);
  it.each(BANDS)('%s clears its floor', (b) => {
    expect(measured.bands[b].share).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });
  it('reports no short band, and would report one trimmed back (proven-to-catch)', () => {
    expect(shortBands(measured)).toEqual([]);
    const faked = { ...L, levels: { ...L.levels, teen: L.levels.teen.slice(0, 500) } };
    expect(shortBands(measureFullness(faked))).toContain('teen');
  });
  it('every band names its own lesson near the start', () => {
    expect(unnamedBands(L)).toEqual([]);
  });
  it('keeps the bands genuinely different', () => {
    expect(duplicatedBands(measureDifferentiation(L))).toEqual([]);
    expect(measureDifferentiation(L).worst).toBeLessThan(DIFF_CEILING);
  });
  it('sends the reader all three ways in every place', () => {
    expect(placesMissingDirections(L)).toEqual([]);
  });
  it('the ladder rises and the child band is under the ceiling', () => {
    const g = (k) => fleschKincaidGrade(ourProseOnly(TEXTS[k]));
    expect(isInverted(measureLesson(L))).toBe(false);
    expect(g('child')).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    expect(g('youth')).toBeGreaterThan(g('child') + 1);
    expect(g('teen')).toBeGreaterThan(g('youth') + 1);
    expect(g('senior')).toBeGreaterThan(g('teen') + 1);
  });
});

describe('L248 — two stories, and Yahweh in our voice', () => {
  it('carries two real stories, one light and one solemn, with no double-quoted span', () => {
    const real = (L.stories || []).filter((s) => s.kind === 'parable' || s.kind === 'testimony');
    expect(real.length).toBeGreaterThanOrEqual(2);
    const tones = L.stories.map((s) => s.tone);
    expect(tones).toContain('light');
    expect(tones).toContain('solemn');
    for (const s of L.stories) expect(String(s.body)).not.toMatch(/"/);
  });
  it('the stories teach this lesson rather than decorating it', () => {
    const [light, solemn] = ['light', 'solemn'].map((tone) => L.stories.find((s) => s.tone === tone));
    // the apprentice eats the plain bread before he understands it, then gives the credit away
    expect(/plain bread|plain loaves/i.test(light.body)).toBe(true);
    expect(/he taught me everything/i.test(light.body)).toBe(true);
    // the man who could have ruined him holds his strength under the Word
    expect(/could end this man/i.test(solemn.body)).toBe(true);
    expect(/what the Word said he should do/i.test(solemn.body)).toBe(true);
  });
  it.each(ALL)('%s names Him by covenant name and never the generic in our prose', (k) => {
    const ours = ourProseOnly(TEXTS[k]);
    expect(/\bYahweh\b/.test(ours), `${k} never names Him by covenant name`).toBe(true);
    expect(/\bGod(?:'s|’s)?\b/.test(ours), `${k} uses the generic "God" in our own voice`).toBe(false);
  });
  it('the quiz answers are not all in one position', () => {
    const at = L.quiz.questions.map((q) => q.answer);
    expect(new Set(at).size).toBeGreaterThan(1);
    for (const q of L.quiz.questions) expect(q.options[q.answer]).toBeTruthy();
  });
});
