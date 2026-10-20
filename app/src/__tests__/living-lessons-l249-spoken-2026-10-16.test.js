// @vitest-environment node
// =============================================================================
// L249 — "Nothing of Myself": the second teaching Darrell SPOKE into the house
// on 2026-10-16, built the same session (a spoken teaching is build input).
// DR-1081.
// =============================================================================
// His questions, carried in his order: what it means to be everything Yahweh
// wants; to be nothing, after what Jesus showed of Himself; to want no glory;
// to use His algorithms in the systematic ways He explains, the deterministic
// algorithm that guarantees the way home, unique to each walker; His way,
// documented for thousands of years and run by ordinary people who get the
// outcomes; and what it means, explicitly, to do and not do according to the
// Way, which is the Word, which is Jesus, the bread of life.
//
// THE WORD ANSWERS IN ITS OWN ORDER, and this gate pins it: Philippians 2:7
// (He emptied Himself) comes before 2:9 (wherefore, exalted), and Jesus says
// "nothing" of Himself (John 5:30) before He says it of us (John 15:5).
//
// WHAT THE CHECKS CAUGHT WHILE WRITING, mechanical, before commit: one
// quotation opened with the wrong case ("and the Word was made flesh" where
// John 1:14 reads "And"), and all four bands short of their floor (child 0.40,
// youth 0.44, teen 0.48, senior 0.58) with the senior band missing the
// children-to-parents direction. The bands were deepened (praise handed back,
// the recipe card, the doing words, the unplugged phone, the line of code,
// what deterministic does not mean) rather than the adult lesson cut.
// Matthew 7:24-27 and Luke 6:46-49 belong to the inspections course, so the
// doing is taught from James 1, Ezekiel 33, and the two sons instead.
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


const ID = 'll249-nothing-of-myself-the-way-is-the-word-and-it-works-every-time';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const ALL = Object.keys(TEXTS);
const whole = ALL.map((k) => TEXTS[k]).join('\n');

const STRANDS = [
  ['the mind of Christ', 'Philippians', 2, 5, 'Let this mind be in you, which was also in Christ Jesus'],
  ['He emptied Himself', 'Philippians', 2, 7, 'But made himself of no reputation, and took upon him the form of a servant'],
  ['obedient to the cross', 'Philippians', 2, 8, 'he humbled himself, and became obedient unto death, even the death of the cross'],
  ['wherefore, lifted', 'Philippians', 2, 9, 'Wherefore God also hath highly exalted him'],
  ['nothing of mine own self', 'John', 5, 30, 'I can of mine own self do nothing'],
  ['nothing of myself', 'John', 8, 28, 'I do nothing of myself; but as my Father hath taught me, I speak these things'],
  ['no glory of His own', 'John', 8, 50, 'And I seek not mine own glory'],
  ['the glory test', 'John', 7, 18, 'He that speaketh of himself seeketh his own glory'],
  ['His glory not given', 'Isaiah', 42, 8, 'and my glory will I not give to another'],
  ['not unto us', 'Psalms', 115, 1, 'Not unto us, O LORD, not unto us, but unto thy name give glory'],
  ['without me nothing', 'John', 15, 5, 'for without me ye can do nothing'],
  ['the seed that dies', 'John', 12, 24, 'Except a corn of wheat fall into the ground and die'],
  ['He changes not', 'Malachi', 3, 6, 'For I am the LORD, I change not'],
  ['the same for ever', 'Hebrews', 13, 8, 'Jesus Christ the same yesterday, and to day, and for ever'],
  ['shall he not do it', 'Numbers', 23, 19, 'hath he said, and shall he not do it?'],
  ['sow and reap', 'Galatians', 6, 7, 'whatsoever a man soweth, that shall he also reap'],
  ['abased and exalted', 'Luke', 14, 11, 'For whosoever exalteth himself shall be abased; and he that humbleth himself shall be exalted'],
  ['choose life', 'Deuteronomy', 30, 19, 'therefore choose life, that both thou and thy seed may live'],
  ['the old paths', 'Jeremiah', 6, 16, 'ask for the old paths, where is the good way, and walk therein'],
  ['Abraham obeyed', 'Hebrews', 11, 8, 'obeyed; and he went out, not knowing whither he went'],
  ['the cloud of witnesses', 'Hebrews', 12, 1, 'so great a cloud of witnesses'],
  ['people of the way', 'Acts', 9, 2, 'any of this way'],
  ['the one way', 'John', 14, 6, 'I am the way, the truth, and the life: no man cometh unto the Father, but by me'],
  ['your own steps', 'Psalms', 37, 23, 'The steps of a good man are ordered by the LORD'],
  ['the Word', 'John', 1, 1, 'In the beginning was the Word'],
  ['the bread', 'John', 6, 35, 'I am the bread of life'],
  ['the light', 'John', 8, 12, 'I am the light of the world'],
  ['the door', 'John', 10, 9, 'I am the door'],
  ['the shepherd', 'John', 10, 27, 'My sheep hear my voice, and I know them, and they follow me'],
  ['the resurrection', 'John', 11, 25, 'I am the resurrection, and the life'],
  ['saved by grace', 'Ephesians', 2, 8, 'For by grace are ye saved through faith'],
  ['made to walk in works', 'Ephesians', 2, 10, 'created in Christ Jesus unto good works'],
  ['doers, not hearers only', 'James', 1, 22, 'But be ye doers of the word, and not hearers only, deceiving your own selves'],
  ['blessed in the deed', 'James', 1, 25, 'this man shall be blessed in his deed'],
  ['they do them not', 'Ezekiel', 33, 32, 'for they hear thy words, but they do them not'],
  ['the son who went', 'Matthew', 21, 29, 'I will not: but afterward he repented, and went'],
  ['the son who did not', 'Matthew', 21, 30, 'I go, sir: and went not'],
  ['happy if ye do them', 'John', 13, 17, 'If ye know these things, happy are ye if ye do them'],
  ['He must increase', 'John', 3, 30, 'He must increase, but I must decrease'],
];

describe('L249 exists, is numbered, and is dated the day it was spoken', () => {
  it('is in the catalog exactly once, after L248', () => {
    expect(LIVING_LESSONS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    const claimed = LIVING_LESSONS_MODULES.map((m) => /^ll(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(claimed.filter((n) => n === 249)).toHaveLength(1);
    expect(Math.max(...claimed)).toBeGreaterThanOrEqual(249);
    for (const n of [211, 212]) expect(claimed.includes(n), `${n} is not this lesson's to fill`).toBe(false);
    // 79 IS NO LONGER A HOLE. It was one when this check was written -- the
    // comment on the original said so: "79 is #2166's held lesson". That
    // lesson (DR-1025) is on this branch and fills it, so asserting 79 is
    // UNCLAIMED now fails for a reason that has nothing to do with this
    // lesson. The question the check actually means is still asked, and more
    // strictly: 211 and 212 are still open holes nobody may fill by
    // accident, and 79 is claimed EXACTLY ONCE, by the lesson whose number
    // it is. A lesson that drifted onto 79 would make that count 2.
    expect(
        LIVING_LESSONS_MODULES.filter((m) => /^ll79-/.test(m.id)).length,
        '79 is claimed exactly once, by the lesson whose number it is',
    ).toBe(1);
  });
  it('carries the spoken day, on or after L248', () => {
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-16');
    expect(LIVING_LESSONS_ADDED['ll248-his-ways-are-higher-so-he-gives-the-bread'] <= LIVING_LESSONS_ADDED[ID]).toBe(true);
  });
  it('names Darrell as the one who spoke it, in the adult lesson, with his questions in his order', () => {
    expect(/spoken into this house by Darrell/.test(L.lesson)).toBe(true);
    expect(L.lesson).toContain('What does it mean to be everything that Yahweh wants?');
    expect(L.lesson).toContain('the deterministic algorithm that guarantees the way home');
    expect(L.lesson).toContain('What does it mean to do, and not do');
  });
});

describe('L249 carries Darrell’s words in every band', () => {
  it.each([
    [/\bnothing\b/i, 'becoming nothing'],
    [/glory/i, 'wanting no glory'],
    [/deterministic/i, 'the deterministic algorithms'],
    [/thousands of years/i, 'documented for thousands of years'],
    [/bread/i, 'the bread of life'],
    [/two sons|said yes and did not|said, "I go, sir/i, 'doing and not doing'],
  ])('%s — %s', (re, what) => {
    for (const k of ALL) expect(re.test(TEXTS[k]), `${k} drops ${what}`).toBe(true);
  });
});

describe('L249 — the Word answers in its own order', () => {
  it.each(['adult', ...BANDS])('%s quotes the emptying (Philippians 2:7) before the lifting (Philippians 2:9)', (k) => {
    const t = TEXTS[k];
    const low = t.indexOf('(Philippians 2:7)');
    const high = t.indexOf('(Philippians 2:9)');
    expect(low, `${k} never quotes Philippians 2:7`).toBeGreaterThan(-1);
    expect(high, `${k} never quotes Philippians 2:9`).toBeGreaterThan(low);
  });
  it.each(['adult', ...BANDS])('%s lets Jesus say "nothing" of Himself (John 5:30) before saying it of us (John 15:5)', (k) => {
    const t = TEXTS[k];
    const His = t.indexOf('(John 5:30)');
    const ours = t.indexOf('(John 15:5)');
    expect(His, `${k} never quotes John 5:30`).toBeGreaterThan(-1);
    expect(ours, `${k} never quotes John 15:5`).toBeGreaterThan(His);
  });
  it('grounds the sure outcome in His character, not in a method (Malachi 3:6 in every place)', () => {
    for (const k of ALL) expect(TEXTS[k].includes('(Malachi 3:6)'), `${k} drops Malachi 3:6`).toBe(true);
  });
  it('keeps salvation by grace beside the doing, in the adult lesson', () => {
    expect(L.lesson.indexOf('(Ephesians 2:8)')).toBeGreaterThan(-1);
    expect(L.lesson.indexOf('(Ephesians 2:10)')).toBeGreaterThan(L.lesson.indexOf('(Ephesians 2:8)'));
  });
});

describe('L249 — every quoted span is the verse', () => {
  it.each(STRANDS)('%s — %s %s:%s', (_why, book, ch, n, span) => {
    const v = verse(book, ch, n);
    expect(v, `${book} ${ch}:${n} resolves`).toBeTruthy();
    expect(v.includes(span), `the span is not in ${book} ${ch}:${n}`).toBe(true);
    expect(whole.includes(span), `the lesson does not carry ${book} ${ch}:${n}`).toBe(true);
  });

  const spans = L ? spansOf(L) : [];
  it('finds a substantial number of referenced spans', () => {
    expect(spans.length).toBeGreaterThan(200);
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
    for (const u of ['Wherefore God also hath highly exalted him', 'God resisteth the proud, but giveth grace unto the humble', 'the word of our God shall stand for ever']) {
    expect(whole.includes(u), `drops: ${u}`).toBe(true);
    }
  });
  it('leaves the house on the rock to the inspections course, which claims Matthew 7:24-27 and Luke 6:46-49', () => {
    for (const ref of ['(Matthew 7:24)', '(Matthew 7:26)', '(Luke 6:46)', '(Luke 6:48)']) expect(whole.includes(ref), ref).toBe(false);
    expect(JSON.stringify(L).includes('built his house upon a rock')).toBe(false);
  });
  it('the case catch stays caught', () => {
    // The first draft opened John 1:14 with a small "and"; the verse reads "And".
    expect(JSON.stringify(L).includes('"and the Word was made flesh')).toBe(false);
    expect(verse('John', 1, 14).startsWith('And the Word was made flesh')).toBe(true);
  });
});

describe('L249 — four bands, each carrying the whole message', () => {
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

describe('L249 — two stories, and Yahweh in our voice', () => {
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
    // the girl runs the old recipe exactly and gives the credit to the card
    expect(/I just did what it said/.test(light.body)).toBe(true);
    expect(/the same loaf/i.test(light.body)).toBe(true);
    // the surgeon learns the list works every time it is done, and fails every time it is not
    expect(/worked every time it was done, and it failed every time it was not/.test(solemn.body)).toBe(true);
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
