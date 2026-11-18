// @vitest-environment node
// L313 — Children Are a Heritage — When the School Closes, the House Still Teaches
// (DR-1491). The shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477)
// runs on the spine below; what is particular to this lesson is its dangers, each
// proven to catch:
//  (1) A REPORT DRESSED AS A FINDING. Every text that carries one of the
//      newsletter's figures names it as reported, or names 1440, in that text
//      (DR-0100 / DR-0076: tiered, never our own finding).
//  (2) SHAME ON THE ONES WHO WAIT. Every place (the adult lesson and each band)
//      that teaches on fewer children being born also says, in its own voice,
//      that no one is shamed for it.
//  (3) POLICY AND MONEY FOR A CHILD. The child band carries none of the policy
//      or money words (vouchers, immigration, billions, funding, severance).
//  (4) THE OTHER ITEMS DRAWN IN. The digest's other items are left out: none of
//      their names appears anywhere in the lesson (the Nvidia story is L310's).
//  (5) THE PROVENANCE LOST. The file names the Gmail thread and the forward time.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll313-children-are-a-heritage-when-the-school-closes-the-house.js';
import { livingLessonGate, stringsOf, textsOf, ourVoice } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll313-children-are-a-heritage-when-the-school-closes-the-house',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 313,
  added: '2026-11-13',
  spine: [
    ['Psalms 127:3', 'Lo, children are an heritage of the LORD'],
    ['Deuteronomy 6:7', 'thou shalt teach them diligently unto thy children'],
    ['Psalms 78:4', 'shewing to the generation to come the praises of the LORD'],
    ['Proverbs 22:6', 'Train up a child in the way he should go'],
    ['Luke 14:28', 'counteth the cost'],
    ['Matthew 18:14', 'that one of these little ones should perish'],
    ['Mark 10:14', 'Suffer the little children to come unto me'],
  ],
});

// --- the dangers, as pure checks ------------------------------------------
const FIGURES = /1,156|1\.4 million|2\.1 million|\$11\.5/;
export function unreportedFigures(L) {
  return stringsOf(L)
    .filter((t) => FIGURES.test(t) && !/\breport|\b1440\b/i.test(t))
    .map((t) => t.slice(0, 70));
}

const FEWER = /\bborn\b|\bbirth|\bfewer (?:children|kids|babies)\b/i;
const NO_SHAME = /\b(?:never|not|no one should ever be)\b[^.!?]{0,30}\b(?:shames?|shamed|tease)\b|\bnever a word of shame\b/i;
export function shameUnguarded(L) {
  return Object.entries(textsOf(L))
    .filter(([, t]) => FEWER.test(ourVoice(t)) && !NO_SHAME.test(ourVoice(t)))
    .map(([p]) => p);
}

export function childPolicyWords(L) {
  return String(L.levels.child).match(/\bvouchers?\b|\bimmigra\w*|\bbillions?\b|\bfunding\b|\bseverance\b/gi) || [];
}

const OTHER_ITEMS = /\bHolmes\b|\bHegseth\b|\bMassie\b|\bNvidia\b|\bCOP31\b|\bWaymo\b|\bEpstein\b/;
export function otherItemsDrawnIn(L) {
  return stringsOf(L)
    .filter((t) => OTHER_ITEMS.test(t))
    .map((t) => t.slice(0, 70));
}

describe('L313 — the dangers particular to this lesson', () => {
  it('every text carrying a figure names it as reported', () => {
    expect(unreportedFigures(lesson)).toEqual([]);
    expect(
      stringsOf(lesson).some((t) => FIGURES.test(t)),
      'an empty scan cannot pass'
    ).toBe(true);
  });
  it('every place that teaches on fewer children shames no one who waits', () => {
    expect(shameUnguarded(lesson)).toEqual([]);
    expect(
      Object.values(textsOf(lesson)).filter((t) => FEWER.test(ourVoice(t))),
      'every place teaches it'
    ).toHaveLength(5);
  });
  it('the child band carries no policy or money words', () => {
    expect(childPolicyWords(lesson)).toEqual([]);
  });
  it('the digest’s other items are left out', () => {
    expect(otherItemsDrawnIn(lesson)).toEqual([]);
  });
  it('the file cites the Gmail thread and the forward time', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'lib', 'living-lessons', 'll313-children-are-a-heritage-when-the-school-closes-the-house.js'), 'utf8');
    expect(src).toContain('1a1c5c715c76307d');
    expect(src).toContain('8:04 AM Central');
  });

  it('PROVEN TO CATCH: each check names a planted defect', () => {
    const plant = (child) => ({ ...lesson, levels: { ...lesson.levels, child } });
    expect(unreportedFigures(plant('Last year 1,156 schools closed.'))).toHaveLength(1);
    expect(shameUnguarded(plant('Fewer babies are born now, and that is their fault.'))).toEqual(['child']);
    expect(childPolicyWords(plant('Vouchers and immigration cost billions in funding.'))).toHaveLength(4);
    expect(otherItemsDrawnIn(plant('Elizabeth Holmes was in the news too.'))).toHaveLength(1);
  });
});
