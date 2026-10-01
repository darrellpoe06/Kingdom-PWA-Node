// @vitest-environment node
// The code in the Word (DR-0729). Darrell, 2026-10-01, on Numbers 27:20: the
// clause where the Word says what a command is for is "a code... find all these
// types of codes in all lessons", and "Leaders need to follow the code of
// conduct inside the Word." Every code shown is a verse the lesson quotes.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codesInQuote, findCodes, codesForLesson, codesAcross, codesSummary, kindOf, CODE_FRAME } from '../lib/word-codes.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const verse = (b, c, v) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${b}.json`), 'utf8')).chapters[c - 1][v - 1];

describe('a code is the clause where the Word says what the command is for', () => {
  it('Numbers 27:20, from the corpus, yields its code', () => {
    const codes = codesInQuote(verse('Numbers', 27, 20));
    expect(codes).toEqual([{ clause: 'that all the congregation of the children of Israel may be obedient', kind: 'that-may' }]);
  });
  it('finds the four shapes and names each', () => {
    expect(codesInQuote(verse('Matthew', 5, 16)).map((c) => c.kind)).toContain('that-may');
    expect(kindOf('so that there was neither hammer nor axe')).toBe('so-that');
    expect(kindOf('to the end that ye may know')).toBe('to-the-end');
    expect(kindOf('lest thou forget the things which thine eyes have seen')).toBe('lest');
    expect(codesInQuote(verse('Deuteronomy', 4, 9)).some((c) => c.kind === 'lest')).toBe(true);
  });
  it('a verse with no purpose clause yields none, and "lest" alone is not a clause', () => {
    expect(codesInQuote('Jesus wept.')).toEqual([]);
    expect(codesInQuote('lest.')).toEqual([]);
  });
  it('findCodes reads only quoted spans with a reference, and keeps the reference', () => {
    const text = 'Plain prose that may say anything. "And thou shalt put some of thine honour upon him, that all the congregation of the children of Israel may be obedient" (Numbers 27:20).';
    const found = findCodes(text);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ ref: 'Numbers 27:20', book: 'Numbers', chapter: 27, verses: '20', kind: 'that-may' });
  });
  it('the summary speaks plainly for none, one and many', () => {
    expect(codesSummary([])).toMatch(/None of the verses/);
    expect(codesSummary([{}])).toMatch(/^One verse/);
    expect(codesSummary([{}, {}, {}])).toMatch(/^3 verses/);
    expect(CODE_FRAME).toMatch(/code of conduct inside the Word/);
  });
});

describe('the codes are found in all lessons, including L202', () => {
  const L202 = LIVING_LESSONS_MODULES.find((m) => m.id === 'll202-prepared-before-the-position-homecoming-legacy-good-success-and-represent');
  it('L202 carries Numbers 27:20 as a code, once, with the full lesson and every band read', () => {
    const codes = codesForLesson(L202);
    const hits = codes.filter((c) => c.ref === 'Numbers 27:20');
    expect(hits).toHaveLength(1);
    expect(hits[0].clause).toBe('that all the congregation of the children of Israel may be obedient');
  });
  it('the whole catalog carries codes in the hundreds of lessons (measured 2026-10-01: 1,026 distinct in 271 of 593)', () => {
    const modules = buildCatalogCourseDescriptors().flatMap((c) => (c.schedule || []).map((s) => s.module || s)).filter((m) => m && (m.lesson || m.levels));
    const n = codesAcross(modules);
    expect(n.lessons).toBeGreaterThanOrEqual(590);
    expect(n.withCodes).toBeGreaterThanOrEqual(250);
    expect(n.codes).toBeGreaterThanOrEqual(900);
  });
  it('PROVEN TO CATCH: a lesson whose quote loses its purpose clause loses the code', () => {
    const cut = { ...L202, lesson: L202.lesson.replace(', that all the congregation of the children of Israel may be obedient', ''), levels: {} };
    expect(codesForLesson(cut).some((c) => c.ref === 'Numbers 27:20')).toBe(false);
  });
});
