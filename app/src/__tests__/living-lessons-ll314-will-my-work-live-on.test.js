// @vitest-environment node
// L314 — Will My Work Live On (DR-1492). The Big Think essay Darrell forwarded
// with one word above it, Lessons (Gmail thread 1a1c68295f781bbb). The shared
// Living Lesson gate (helpers/living-lesson-gate.js, DR-1477) runs on the spine
// below; what is particular to this lesson is its dangers, each proven to catch:
//  (1) THE ESSAY'S FIGURES DRESSED AS OUR FINDINGS. Every text that gives the
//      museum's years, size or the founder's age names the essay or says it is
//      reported (DR-0100 / DR-0076: tiered, never confirmed by us).
//  (2) A VERDICT ON A MAN'S HEART. The pyramid and the case to be remembered
//      are the writer's reading; wherever the lesson repeats them, the same text
//      says so (her reading, her judgment, she says, the essay calls).
//  (3) THE QUESTIONS LEFT OPEN. The essay's claim that no faith can answer the
//      three questions is the thing being taught past (DR-0098): the adult
//      lesson and every band name all three answers' anchor verses.
//  (4) THE PROVENANCE LOST. The file names the Gmail thread, and the UNCHECKED
//      note names the host that refused the read-back.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll314-will-my-work-live-on.js';
import { livingLessonGate, stringsOf, ourVoice } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll314-will-my-work-live-on',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 314,
  added: '2026-11-13',
  spine: [
    ['Ecclesiastes 2:18', 'I should leave it unto the man that shall be after me'],
    ['Psalms 49:11', 'they call their lands after their own names'],
    ['Hebrews 11:10', 'whose builder and maker is God'],
    ['Psalms 127:1', 'Except the LORD build the house, they labour in vain that build it'],
    ['1 Corinthians 3:11', 'other foundation can no man lay than that is laid, which is Jesus Christ'],
    ['Psalms 90:17', 'establish thou the work of our hands'],
    ['Deuteronomy 6:7', 'thou shalt teach them diligently unto thy children'],
    ['Ecclesiastes 12:13', 'Fear God, and keep his commandments: for this is the whole duty of man'],
  ],
});

// --- the dangers, as pure checks ------------------------------------------
const FIGURE = /\b(?:17|seventeen) years\b|\b100,000 square feet\b|\bfounder (?:who )?is 82\b|\bis 82\b/i;
const TIERED = /\bessay\b|\breport/i;
export function untieredFigures(L) {
  return stringsOf(L)
    .filter((t) => FIGURE.test(ourVoice(t)) && !TIERED.test(t))
    .map((t) => t.slice(0, 70));
}

const VERDICT = /\bpyramid\b|\bremembered among the great/i;
const HERS = /\bher (?:reading|judgment)\b|\bshe says\b|\bthe essay (?:calls|compares|ends)\b|\bthe writer (?:reached|says)\b|\bshe calls\b/i;
export function verdictsAsOurs(L) {
  return stringsOf(L)
    .filter((t) => VERDICT.test(ourVoice(t)) && !HERS.test(t))
    .map((t) => t.slice(0, 70));
}

export function questionsLeftOpen(L) {
  const answers = ['1 Corinthians 3:11', 'Deuteronomy 6:7', 'Ecclesiastes 12:13'];
  const places = { adult: L.lesson, ...L.levels };
  const out = [];
  for (const [place, text] of Object.entries(places))
    for (const ref of answers) if (!String(text).includes(`(${ref})`)) out.push(`${place} leaves ${ref} unanswered`);
  return out;
}

describe('L314 — the dangers particular to this lesson', () => {
  it('every text giving the museum’s figures says they are the essay’s, reported', () => {
    expect(untieredFigures(lesson)).toEqual([]);
    expect(
      stringsOf(lesson).some((t) => FIGURE.test(t)),
      'an empty scan cannot pass'
    ).toBe(true);
  });
  it('the pyramid and the case to be remembered stay the writer’s reading', () => {
    expect(verdictsAsOurs(lesson)).toEqual([]);
    expect(
      stringsOf(lesson).some((t) => VERDICT.test(t)),
      'an empty scan cannot pass'
    ).toBe(true);
  });
  it('the three questions are answered from the Word in the lesson and every band', () => {
    expect(questionsLeftOpen(lesson)).toEqual([]);
  });
  it('the file cites the Gmail thread, and UNCHECKED names the refused host', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'lib', 'living-lessons', 'll314-will-my-work-live-on.js'), 'utf8');
    expect(src).toContain('1a1c68295f781bbb');
    expect(UNCHECKED).toMatch(/bigthink\.com/);
  });

  it('PROVEN TO CATCH: each check names a planted defect', () => {
    const plant = (child) => ({ ...lesson, levels: { ...lesson.levels, child } });
    expect(untieredFigures(plant('The museum took 17 years to build.'))).toHaveLength(1);
    expect(verdictsAsOurs(plant('His museum is a pyramid for his own name.'))).toHaveLength(1);
    expect(questionsLeftOpen(plant('Nobody can know what lasts.'))).toEqual([
      'child leaves 1 Corinthians 3:11 unanswered',
      'child leaves Deuteronomy 6:7 unanswered',
      'child leaves Ecclesiastes 12:13 unanswered',
    ]);
  });
});
