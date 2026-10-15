// @vitest-environment node
// =============================================================================
// L245, L246, L247 — three teachings Darrell SPOKE into the house on the night
// of 2026-10-15, built the same session (the standing rule: a spoken teaching
// is build input). One gate for the three, because they share a night, a
// standard and a proof.
// =============================================================================
//   L245  Deductive reasoning is the Word's Way: from what He said, not what
//         you thought He said. "Pay close attention to the protocols inside
//         the Word of Yahweh. You can't think His thoughts without His Word
//         and Way."
//   L246  Doing the Word comes first: understanding follows the doing, and our
//         live situations are authored as our bread (the two responsible
//         spies). "Successful based on His interpretation of the living soul's
//         way to eternal life, not feel good and glory; we get no glory, why
//         do you want it? Actions speak louder than words."
//   L247  Your ways show your god: "Don't say the opposite of what your ways
//         show; it's impossible to have a quality relationship with someone
//         who doesn't know themselves in a quantitative and qualitative way;
//         projecting truth that doesn't fit what everyone can explain and show
//         with data-driven and experiential understanding; you don't
//         understand or you don't listen to reason; the Holy Spirit gives a
//         sound mind; ask the fruit of the Spirit; show me what and how you
//         do and I'll show you your god, or Yahweh."
//
// WHAT THE CHECKS CAUGHT WHILE WRITING, mechanical, before commit: one
// capitalised mid-verse opening in L245's quiz ("To obey is better than
// sacrifice" where 1 Samuel 15:22 reads "to obey"), and L246's child band at
// 0.44 of the adult prose against a 0.50 floor (lengthened with Job, the man
// born blind, the ten spies' unmixed word, and the unprofitable servant).
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

const LESSONS = [
  {
    n: 245,
    id: 'll245-deductive-reasoning-is-the-words-way-from-what-he-said',
    prev: 'll244-',
    strands: [
      ['what He actually said', 'Genesis', 2, 16, 'Of every tree of the garden thou mayest freely eat'],
      ['the serpent distorts the premise', 'Genesis', 3, 1, 'Yea, hath God said, Ye shall not eat of every tree of the garden?'],
      ['the woman adds to the premise', 'Genesis', 3, 3, 'neither shall ye touch it'],
      ['the serpent denies the premise', 'Genesis', 3, 4, 'Ye shall not surely die'],
      ['It is written', 'Matthew', 4, 4, 'It is written, Man shall not live by bread alone'],
      ['Scripture governs Scripture', 'Matthew', 4, 7, 'It is written again'],
      ['deduction from a tense', 'Matthew', 22, 32, 'God is not the God of the dead, but of the living'],
      ['deduction from a singular noun', 'Galatians', 3, 16, 'He saith not, And to seeds, as of many; but as of one'],
      ['protocol: add not', 'Deuteronomy', 4, 2, 'Ye shall not add unto the word which I command you'],
      ['protocol: the test', 'Isaiah', 8, 20, 'To the law and to the testimony'],
      ['protocol: the Bereans', 'Acts', 17, 11, 'searched the scriptures daily, whether those things were so'],
      ['protocol: stop where He stopped', 'Deuteronomy', 29, 29, 'The secret things belong unto the LORD our God'],
      ['His thoughts are not ours', 'Isaiah', 55, 8, 'For my thoughts are not your thoughts'],
      ['the Spirit teaches in words', '1 Corinthians', 2, 13, 'comparing spiritual things with spiritual'],
      ['the promise', '1 Corinthians', 2, 16, 'But we have the mind of Christ'],
      ['Saul reasoned from his own thought', '1 Samuel', 15, 23, 'Because thou hast rejected the word of the LORD'],
    ],
    carries: [
      [/what you thought He said|what you think He said|what you thought He had said/i, 'the second half of the first sentence'],
      [/protocol|rule/i, 'the protocols'],
      [/mind of Christ/, 'the promise beside the warning'],
    ],
    stories: [/card|deed/, /sure|memory|remember/],
    untouched: ['Yea, hath God said, Ye shall not eat of every tree of the garden?', 'God is not the God of the dead, but of the living'],
  },
  {
    n: 246,
    id: 'll246-doing-the-word-comes-first-and-our-live-situations-are-bread',
    prev: 'll245-',
    strands: [
      ['doers, not hearers only', 'James', 1, 22, 'But be ye doers of the word, and not hearers only, deceiving your own selves'],
      ['do, then know', 'John', 7, 17, 'If any man will do his will, he shall know of the doctrine'],
      ['happy if ye do them', 'John', 13, 17, 'If ye know these things, happy are ye if ye do them'],
      ['understanding belongs to doers', 'Psalms', 111, 10, 'a good understanding have all they that do his commandments'],
      ['senses exercised by use', 'Hebrews', 5, 14, 'by reason of use have their senses exercised'],
      ['experience is a link', 'Romans', 5, 4, 'And patience, experience; and experience, hope'],
      ['the two responsible spies', 'Numbers', 14, 9, 'neither fear ye the people of the land; for they are bread for us'],
      ['the ten', 'Numbers', 13, 33, 'we were in our own sight as grasshoppers'],
      ['steps directed', 'Proverbs', 16, 9, 'but the LORD directeth his steps'],
      ['the wilderness was to know the heart', 'Deuteronomy', 8, 2, 'to know what was in thine heart, whether thou wouldest keep his commandments, or no'],
      ['the manna taught the Word', 'Deuteronomy', 8, 3, 'that he might make thee know that man doth not live by bread only'],
      ['Caleb at eighty-five', 'Joshua', 14, 12, 'Now therefore give me this mountain'],
      ['success by His interpretation', 'Joshua', 1, 8, 'then thou shalt have good success'],
      ['the soul is the measure', 'Matthew', 16, 26, 'if he shall gain the whole world, and lose his own soul'],
      ['no glory to another', 'Isaiah', 42, 8, 'my glory will I not give to another'],
      ['why want it', 'John', 5, 44, 'How can ye believe, which receive honour one of another'],
      ['actions speak louder than words', 'James', 2, 18, 'shew me thy faith without thy works, and I will shew thee my faith by my works'],
      ['the son who went not', 'Matthew', 21, 30, 'I go, sir: and went not'],
    ],
    carries: [
      [/bread/i, 'the bread'],
      [/glory/i, 'the glory'],
      [/actions? speak louder|what you do (says|shows|will say)/i, 'actions speak louder than words'],
      [/understand/i, 'understanding follows the doing'],
    ],
    stories: [/swim|water/, /house|bread/],
    untouched: ['neither fear ye the people of the land; for they are bread for us', 'my glory will I not give to another'],
  },
  {
    n: 247,
    id: 'll247-your-ways-show-your-god-know-yourself-in-number-and-in-kind',
    prev: 'll246-',
    strands: [
      ['by their fruits', 'Matthew', 7, 16, 'Ye shall know them by their fruits'],
      ['a fixed sign', 'Matthew', 7, 18, 'A good tree cannot bring forth evil fruit'],
      ['the fountain', 'James', 3, 11, 'Doth a fountain send forth at the same place sweet water and bitter?'],
      ['profess and deny', 'Titus', 1, 16, 'They profess that they know God; but in works they deny him'],
      ['examine yourselves', '2 Corinthians', 13, 5, 'Examine yourselves, whether ye be in the faith; prove your own selves'],
      ['consider your ways', 'Haggai', 1, 5, 'Consider your ways'],
      ['number', 'Psalms', 90, 12, 'So teach us to number our days'],
      ['count the cost', 'Luke', 14, 28, 'counteth the cost'],
      ['kind: the fruit of the Spirit', 'Galatians', 5, 22, 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith'],
      ['the works of the flesh are manifest', 'Galatians', 5, 19, 'Now the works of the flesh are manifest'],
      ['right in his own eyes', 'Proverbs', 21, 2, 'Every way of a man is right in his own eyes'],
      ['projected truth named', 'Luke', 16, 15, 'Ye are they which justify yourselves before men'],
      ['the day shall declare it', '1 Corinthians', 3, 13, 'for the day shall declare it'],
      ['the two refusals', 'Matthew', 13, 15, 'their ears are dull of hearing, and their eyes they have closed'],
      ['a sound mind', '2 Timothy', 1, 7, 'but of power, and of love, and of a sound mind'],
      ['the vine', 'John', 15, 5, 'for without me ye can do nothing'],
      ['show me', 'James', 2, 18, 'shew me thy faith without thy works, and I will shew thee my faith by my works'],
      ['his servants ye are to whom ye obey', 'Romans', 6, 16, 'his servants ye are to whom ye obey'],
      ['where your treasure is', 'Matthew', 6, 21, 'For where your treasure is, there will your heart be also'],
      ['Elijah', '1 Kings', 18, 21, 'if the LORD be God, follow him: but if baal, then follow him'],
    ],
    carries: [
      [/ways show/i, 'your ways show'],
      [/number|count/i, 'quantitative'],
      [/fruit of the Spirit/, 'the fruit of the Spirit'],
      [/sound mind/, 'the sound mind'],
      [/your god/i, 'your god'],
    ],
    stories: [/notebook|count|number/, /ledger|statement|calendar/],
    untouched: ['Ye shall know them by their fruits', 'if the LORD be God, follow him: but if baal, then follow him'],
  },
];

for (const spec of LESSONS) {
  const L = LIVING_LESSONS_MODULES.find((m) => m.id === spec.id);
  const TEXTS = { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) };
  const ALL = Object.keys(TEXTS);
  const whole = ALL.map((k) => TEXTS[k]).join('\n');

  describe(`L${spec.n} exists, is numbered, and is dated the night it was spoken`, () => {
    it('is in the catalog exactly once', () => {
      expect(LIVING_LESSONS_MODULES.filter((m) => m.id === spec.id)).toHaveLength(1);
    });
    it(`takes ${spec.n} and leaves the 79/211/212 gaps alone`, () => {
      const claimed = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
      expect(claimed.filter((n) => n === spec.n)).toHaveLength(1);
      for (const n of [79, 211, 212]) expect(claimed.includes(n), `${n} is not this lesson's to fill`).toBe(false);
    });
    it('carries the spoken day, and never precedes the lesson numbered before it', () => {
      expect(LIVING_LESSONS_ADDED[spec.id]).toBe('2026-10-15');
      const before = Object.entries(LIVING_LESSONS_ADDED).find(([k]) => k.startsWith(spec.prev));
      expect(before, `${spec.prev} is dated`).toBeTruthy();
      expect(LIVING_LESSONS_ADDED[spec.id] >= before[1]).toBe(true);
    });
    it('names Darrell as the one who spoke it, in the adult lesson', () => {
      expect(/spoken into this house by Darrell/.test(L.lesson)).toBe(true);
    });
  });

  describe(`L${spec.n} carries Darrell’s words in every band`, () => {
    it.each(spec.carries)('%s — %s', (re, what) => {
      for (const k of ALL) expect(re.test(TEXTS[k]), `${k} drops ${what}`).toBe(true);
    });
  });

  describe(`L${spec.n} — every quoted span is the verse`, () => {
    it.each(spec.strands)('%s — %s %s:%s', (_why, book, ch, n, span) => {
      const v = verse(book, ch, n);
      expect(v, `${book} ${ch}:${n} resolves`).toBeTruthy();
      expect(v.includes(span), `the span is not in ${book} ${ch}:${n}`).toBe(true);
      expect(whole.includes(span), `the lesson does not carry ${book} ${ch}:${n}`).toBe(true);
    });

    const spans = spansOf(L);
    it('finds a substantial number of referenced spans', () => {
      expect(spans.length).toBeGreaterThan(150);
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
    it('leaves "God" exactly as the verses carry it', () => {
      for (const u of spec.untouched) expect(whole.includes(u), `drops: ${u}`).toBe(true);
    });
  });

  describe(`L${spec.n} — four bands, each carrying the whole message`, () => {
    const measured = measureFullness(L);
    it.each(BANDS)('%s clears its floor', (b) => {
      expect(measured.bands[b].share).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
    });
    it('reports no short band, and would report one trimmed back (proven-to-catch)', () => {
      expect(shortBands(measured)).toEqual([]);
      const faked = { ...L, levels: { ...L.levels, senior: L.levels.senior.slice(0, 500) } };
      expect(shortBands(measureFullness(faked))).toContain('senior');
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

  describe(`L${spec.n} — two stories, and Yahweh in our voice`, () => {
    it('carries two real stories, one light and one solemn, with no double-quoted span', () => {
      const real = (L.stories || []).filter((s) => s.kind === 'parable' || s.kind === 'testimony');
      expect(real.length).toBeGreaterThanOrEqual(2);
      const tones = L.stories.map((s) => s.tone);
      expect(tones).toContain('light');
      expect(tones).toContain('solemn');
      for (const s of L.stories) expect(String(s.body)).not.toMatch(/"/);
    });
    it('the stories teach this lesson rather than decorating it', () => {
      const bodies = L.stories.map((s) => `${s.title} ${s.body}`).join(' ').toLowerCase();
      for (const re of spec.stories) expect(re.test(bodies), `neither story reaches ${re}`).toBe(true);
    });
    it.each(ALL)('%s names Him by covenant name and never the generic in our prose', (k) => {
      const ours = ourProseOnly(TEXTS[k]);
      expect(/\bYahweh\b/.test(ours), `${k} never names Him by covenant name`).toBe(true);
      expect(/\bGod(?:'s|’s)?\b/.test(ours), `${k} uses the generic "God" in our own voice`).toBe(false);
    });
  });
}

describe('the night’s catches, pinned so they cannot return', () => {
  it('L245 never capitalises the mid-verse opening of 1 Samuel 15:22', () => {
    const L = LIVING_LESSONS_MODULES.find((m) => m.id === LESSONS[0].id);
    expect(JSON.stringify(L).includes('"To obey is better than sacrifice"')).toBe(false);
    expect(verse('1Samuel', 15, 22).includes('to obey is better than sacrifice')).toBe(true);
  });
  it('L246’s child band is at least half the adult prose, which its first draft was not', () => {
    const L = LIVING_LESSONS_MODULES.find((m) => m.id === LESSONS[1].id);
    expect(measureFullness(L).bands.child.share).toBeGreaterThanOrEqual(0.5);
  });
});
