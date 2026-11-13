// @vitest-environment node
// L316 — Riches Make Themselves Wings (DR-1495). The Daily Upside of 2026-11-06,
// forwarded by Darrell with one word above it, Lesson (Gmail thread
// 1a1b29c5388a3be0). The shared Living Lesson gate (helpers/living-lesson-gate.js,
// DR-1477) runs on the spine below; what is particular to this lesson is its
// dangers, each proven to catch:
//  (1) A FIGURE DRESSED AS OUR OWN. Every text outside the parables that carries
//      a dollar figure, a billion, a trillion or a percentage also says it is
//      reported, or names the newsletter (DR-0100 / DR-0076: tiered).
//  (2) ADVICE OR A FORECAST. No text tells the reader to buy or sell, or says
//      the market will recover; the adult lesson and the in-app card both say
//      it is not financial advice.
//  (3) THE TRADER'S SAYING ABOUT BLOOD. The phrase is never repeated, and every
//      text that says blood also names the Lamb or the precious blood of Christ
//      (CLAUDE.md Color Theology, DR-0099).
//  (4) POLITICS IN THE WORD'S PLACE. No party and no politician from the edition
//      is named; the lesson teaches the Word, not the election (DR-0098).
//  (5) THE PROVENANCE LOST. The file names the Gmail thread and the forward day.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll316-riches-make-themselves-wings.js';
import { livingLessonGate, stringsOf } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll316-riches-make-themselves-wings',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 316,
  added: '2026-11-13',
  spine: [
    ['Proverbs 23:4', 'Labour not to be rich'],
    ['Proverbs 23:5', 'for riches certainly make themselves wings'],
    ['Luke 12:20', 'this night thy soul shall be required of thee'],
    ['Proverbs 27:24', 'For riches are not for ever'],
    ['1 Timothy 6:17', 'nor trust in uncertain riches'],
    ['Proverbs 22:7', 'the borrower is servant to the lender'],
    ['1 Peter 1:19', 'with the precious blood of Christ, as of a lamb without blemish and without spot'],
    ['Matthew 6:20', 'lay up for yourselves treasures in heaven'],
  ],
});

// --- the dangers, as pure checks ------------------------------------------
const outsideParables = (L) => stringsOf({ ...L, stories: [] });
const cut = (t) => t.slice(0, 70);

const FIGURE = /\$\s?\d|\btrillion\b|\bbillion\b|\d(?:\.\d+)?\s?(?:%|percent\b)/i;
const ATTRIBUTED = /\breport|\bDaily Upside\b|\bnewsletter\b/i;
export function unattributedFigures(L) {
  return outsideParables(L)
    .filter((t) => FIGURE.test(t) && !ATTRIBUTED.test(t))
    .map(cut);
}

const ADVICE =
  /\bbuy the dip\b|\b(?:you|we) should (?:buy|sell)\b|\btime to (?:buy|sell)\b|\bwill (?:recover|rebound|bounce back)\b|\bprices will (?:rise|come back)\b/i;
export function adviceGiven(L) {
  return stringsOf(L)
    .filter((t) => ADVICE.test(t))
    .map(cut);
}
export function disclaimerMissing(L) {
  return [
    ['lesson', L.lesson],
    ['inApp', L.inApp],
  ]
    .filter(([, t]) => !/not financial advice/i.test(String(t)))
    .map(([p]) => p);
}

export function bloodMisused(L) {
  return stringsOf(L)
    .filter((t) => /\bblood in the streets?\b/i.test(t) || (/\bblood\b/i.test(t) && !/\bLamb\b|precious blood of Christ/.test(t)))
    .map(cut);
}

const POLITICS = /\bDemocrat|\bRepublican|\bHinojosa\b|\bAbbott\b|\bDeSantis\b|\bTalarico\b|\bMusk\b|\bJohnson\b/;
export function politicsNamed(L) {
  return stringsOf(L)
    .filter((t) => POLITICS.test(t))
    .map(cut);
}

describe('L316 — the dangers particular to this lesson', () => {
  it('every market figure outside the parables is attributed to the newsletter', () => {
    expect(unattributedFigures(lesson)).toEqual([]);
    expect(
      outsideParables(lesson).some((t) => FIGURE.test(t)),
      'an empty scan cannot pass'
    ).toBe(true);
  });
  it('no advice and no forecast, and the lesson says so', () => {
    expect(adviceGiven(lesson)).toEqual([]);
    expect(disclaimerMissing(lesson)).toEqual([]);
  });
  it('blood belongs to the Lamb: the trader’s saying is never repeated', () => {
    expect(bloodMisused(lesson)).toEqual([]);
    expect(
      stringsOf(lesson).some((t) => /\bblood\b/i.test(t)),
      'an empty scan cannot pass'
    ).toBe(true);
  });
  it('no party or politician from the edition is named', () => {
    expect(politicsNamed(lesson)).toEqual([]);
  });
  it('the file cites the Gmail thread and the day Darrell forwarded it', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'lib', 'living-lessons', 'll316-riches-make-themselves-wings.js'), 'utf8');
    expect(src).toContain('1a1b29c5388a3be0');
    expect(src).toContain('2026-11-06');
  });

  it('PROVEN TO CATCH: each check names a planted defect', () => {
    const plant = (child, adult = lesson.lesson, inApp = lesson.inApp) => ({ ...lesson, lesson: adult, inApp, levels: { ...lesson.levels, child } });
    expect(unattributedFigures(plant('Stocks lost $2.5 trillion.'))).toHaveLength(1);
    expect(unattributedFigures(plant('Nvidia fell 9.2 percent.'))).toHaveLength(1);
    expect(adviceGiven(plant('Prices will recover, so you should buy now.'))).toHaveLength(1);
    expect(disclaimerMissing(plant(lesson.levels.child, 'A lesson.', 'A card.'))).toEqual(['lesson', 'inApp']);
    expect(bloodMisused(plant('There was blood in the streets.'))).toHaveLength(1);
    expect(bloodMisused(plant('The market spilled blood.'))).toHaveLength(1);
    expect(politicsNamed(plant('The Democrats did it.'))).toHaveLength(1);
  });
});
