// @vitest-environment node
// L319 — What the Trust Could Not Keep (DR-1532). A news summary sent by Darrell
// into the build channel on 2026-11-18 with one word above it, Lesson. The
// shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477) runs on the
// spine below; what is particular to this lesson is its dangers, each proven to
// catch:
//  (1) A FIGURE DRESSED AS OUR OWN. Every text outside the parables that carries
//      a dollar figure, a billion, a share count or a percentage also says it is
//      reported, or names the filings or Barron's (DR-0100 / DR-0076: tiered).
//  (2) ADVICE. No text tells the reader to set up a trust or to buy or sell
//      stock; the adult lesson and the in-app card both say it is not
//      financial, tax or legal advice.
//  (3) THE UNPROVEN ACCUSATION CARRIED. The reported espionage allegation is
//      under investigation and not the teaching; no string repeats it
//      (Exodus 23:1). The children, whom the filings do not name, are never named.
//  (4) GLOATING. Every band and the adult lesson carry both the warning against
//      rejoicing at a fall and the restoration verse (Proverbs 24:17; Galatians 6:1).
//  (5) THE PROVENANCE LOST. The file names the day it was sent and its source.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll319-what-the-trust-could-not-keep.js';
import { livingLessonGate, stringsOf, textsOf } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll319-what-the-trust-could-not-keep',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 319,
  added: '2026-11-18',
  spine: [
    ['Proverbs 22:1', 'A good name is rather to be chosen than great riches'],
    ['Proverbs 13:22', 'A good man leaveth an inheritance to his children’s children'],
    ['Proverbs 4:23', 'Keep thy heart with all diligence'],
    ['Psalms 127:1', 'Except the LORD build the house, they labour in vain that build it'],
    ['Matthew 16:26', 'if he shall gain the whole world, and lose his own soul'],
    ['1 Corinthians 10:12', 'let him that thinketh he standeth take heed lest he fall'],
    ['Galatians 6:1', 'restore such an one in the spirit of meekness'],
  ],
});

// --- the dangers, as pure checks ------------------------------------------
const outsideParables = (L) => stringsOf({ ...L, stories: [] });
const cut = (t) => t.slice(0, 70);

const FIGURE = /\$\s?\d|\bbillion\b|\bmillion\b|\d{2},\d{3}|\d(?:\.\d+)?\s?(?:%|percent\b)|\bpercent\b/i;
const ATTRIBUTED = /\breport|\bfilings?\b|\bBarron/i;
export function unattributedFigures(L) {
  return outsideParables(L)
    .filter((t) => FIGURE.test(t) && !ATTRIBUTED.test(t))
    .map(cut);
}

const ADVICE =
  /\byou should (?:set up|open|start|create|fund) a (?:trust|GRAT)\b|\b(?:you|we) should (?:buy|sell)\b|\btime to (?:buy|sell)\b|\bset up a GRAT\b|\bcopy (?:his|this) (?:plan|strategy)\b(?! )/i;
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
    .filter(([, t]) => !/not financial, tax or legal advice/i.test(String(t)))
    .map(([p]) => p);
}

const ACCUSATION = /\bspy\b|\bspies\b|espionage|\bintelligence\b|\bBeijing\b|\bChin(?:a|ese)\b/i;
export function accusationCarried(L) {
  return stringsOf(L)
    .filter((t) => ACCUSATION.test(t))
    .map(cut);
}
const CHILDREN = /\bSpencer\b|\bMadison\b/;
export function childrenNamed(L) {
  return stringsOf(L)
    .filter((t) => CHILDREN.test(t))
    .map(cut);
}

export function gloatGuardMissing(L) {
  return Object.entries(textsOf(L))
    .filter(([, t]) => !String(t).includes('Rejoice not when thine enemy falleth') || !String(t).includes('restore such an one'))
    .map(([place]) => place);
}

describe('L319 — the dangers particular to this lesson', () => {
  it('every reported figure outside the parables is attributed to the filings or the reports', () => {
    expect(unattributedFigures(lesson)).toEqual([]);
    expect(
      outsideParables(lesson).some((t) => FIGURE.test(t)),
      'an empty scan cannot pass'
    ).toBe(true);
  });
  it('no advice, and the lesson and the card both say so', () => {
    expect(adviceGiven(lesson)).toEqual([]);
    expect(disclaimerMissing(lesson)).toEqual([]);
  });
  it('the unproven accusation is never carried, and the children are never named', () => {
    expect(accusationCarried(lesson)).toEqual([]);
    expect(childrenNamed(lesson)).toEqual([]);
  });
  it('the adult lesson and every band forbid gloating and teach restoration', () => {
    expect(gloatGuardMissing(lesson)).toEqual([]);
  });
  it('the file cites the day it was sent, the filings and the reporter', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'lib', 'living-lessons', 'll319-what-the-trust-could-not-keep.js'), 'utf8');
    expect(src).toContain('2026-11-18');
    expect(src).toContain('Form 4');
    expect(src).toContain('Barron');
  });

  it('PROVEN TO CATCH: each check names a planted defect', () => {
    const plant = (child, adult = lesson.lesson, inApp = lesson.inApp) => ({ ...lesson, lesson: adult, inApp, levels: { ...lesson.levels, child } });
    expect(unattributedFigures(plant('The trust held $10.5 billion.'))).toHaveLength(1);
    expect(unattributedFigures(plant('The stock grew 22,161%.'))).toHaveLength(1);
    expect(adviceGiven(plant('You should set up a trust like his.'))).toHaveLength(1);
    expect(adviceGiven(plant('Now is the time to buy.'))).toHaveLength(1);
    expect(disclaimerMissing(plant(lesson.levels.child, 'A lesson.', 'A card.'))).toEqual(['lesson', 'inApp']);
    expect(accusationCarried(plant('She was said to be a spy.'))).toHaveLength(1);
    expect(childrenNamed(plant('His son Spencer works there.'))).toHaveLength(1);
    expect(gloatGuardMissing(plant('He fell, and that is that.'))).toEqual(['child']);
  });
});
