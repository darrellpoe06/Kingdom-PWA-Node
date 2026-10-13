// @vitest-environment node
// =============================================================================
// pm12 — Titles and fruits (DR-0664)
// =============================================================================
// Darrell sent this as a lesson on 2026-09-25 and again on 2026-09-28 (inbox
// rows a0309835 and f217103d, the same text twice). The text is written as an
// assistant's reply to him summarizing his own experience; the lesson says so,
// builds from his experience and his conclusion (ownership), and teaches the
// Word's own case first: Saul screening David by category and David answering
// with outcomes (1 Samuel 17:33-39), man looking on the outward appearance
// (1 Samuel 16:7), fruit (Matthew 7:16, 20), faithfulness in the least (Luke
// 16:10; 19:17), and the ownership that does not wait for a title (Proverbs
// 6:6-8; Nehemiah 1:11; 2:17). project-management-courses.test.js already
// holds every PM lesson to verbatim Scripture and the Word-first order; this
// file pins what is particular to pm12 and proves the verse gate catches.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PROJECT_MANAGEMENT_MODULES, PROJECT_MANAGEMENT_META } from '../lib/project-management-course.js';

const KJV = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'bible', 'kjv');
const verse = (book, ch, v) => JSON.parse(readFileSync(join(KJV, `${book}.json`), 'utf8')).chapters[ch - 1][v - 1];
const norm = (s) => String(s).replace(/\s+/g, ' ');

const m = PROJECT_MANAGEMENT_MODULES.find((x) => x.id === 'pm12-titles-and-fruits-capability-shown-in-outcomes');
const blob = () => [m.title, m.bigIdea, m.inApp, m.anchor.theme, ...m.benefits, m.levels.teen, m.levels.senior, ...m.quiz.questions.flatMap((q) => [q.q, ...q.options, q.explain])].join('\n');

// Every Scripture fragment pm12 quotes, with the verse it names.
const PM12_QUOTES = [
  ['1Samuel', 17, 33, 'Thou art not able to go against this Philistine to fight with him: for thou art but a youth, and he a man of war from his youth'],
  ['1Samuel', 17, 34, 'Thy servant kept his father’s sheep, and there came a lion, and a bear, and took a lamb out of the flock'],
  ['1Samuel', 17, 36, 'Thy servant slew both the lion and the bear'],
  ['1Samuel', 17, 37, 'The LORD that delivered me out of the paw of the lion, and out of the paw of the bear, he will deliver me out of the hand of this Philistine'],
  ['1Samuel', 17, 39, 'I cannot go with these; for I have not proved them'],
  ['1Samuel', 16, 7, 'for man looketh on the outward appearance, but the LORD looketh on the heart'],
  ['1Samuel', 16, 7, 'Look not on his countenance, or on the height of his stature'],
  ['Matthew', 7, 16, 'Ye shall know them by their fruits'],
  ['Matthew', 7, 20, 'Wherefore by their fruits ye shall know them'],
  ['Proverbs', 20, 11, 'Even a child is known by his doings, whether his work be pure, and whether it be right'],
  ['Genesis', 39, 3, 'his master saw that the LORD was with him, and that the LORD made all that he did to prosper in his hand'],
  ['Genesis', 39, 4, 'and he made him overseer over his house'],
  ['Genesis', 39, 22, 'the keeper of the prison committed to Joseph’s hand all the prisoners that were in the prison'],
  ['Luke', 16, 10, 'He that is faithful in that which is least is faithful also in much'],
  ['Luke', 19, 17, 'because thou hast been faithful in a very little, have thou authority over ten cities'],
  ['Ecclesiastes', 9, 15, 'Now there was found in it a poor wise man, and he by his wisdom delivered the city; yet no man remembered that same poor man'],
  ['Ecclesiastes', 9, 16, 'Wisdom is better than strength'],
  ['Proverbs', 6, 7, 'Which having no guide, overseer, or ruler'],
  ['Nehemiah', 1, 11, 'For I was the king’s cupbearer'],
  ['Nehemiah', 2, 17, 'come, and let us build up the wall of Jerusalem'],
  ['Colossians', 3, 23, 'And whatsoever ye do, do it heartily, as to the Lord, and not unto men'],
  ['Proverbs', 27, 2, 'Let another man praise thee, and not thine own mouth'],
  ['2Corinthians', 3, 2, 'Ye are our epistle written in our hearts, known and read of all men'],
  ['Titus', 2, 7, 'a pattern of good works'],
  ['Proverbs', 12, 24, 'The hand of the diligent shall bear rule'],
];

describe('pm12 is in the Project Management course', () => {
  it('is the twelfth lesson and the painted count is the real one', () => {
    expect(m, 'pm12 must be in the course').toBeTruthy();
    expect(PROJECT_MANAGEMENT_MODULES.indexOf(m)).toBe(11);
    expect(PROJECT_MANAGEMENT_META.weeks).toBe(PROJECT_MANAGEMENT_MODULES.length);
  });
});

describe('every quoted fragment is the verse it names', () => {
  it('each fragment is a verbatim substring of its verse in the repo KJV', () => {
    const bad = PM12_QUOTES.filter(([b, c, v, f]) => !norm(verse(b, c, v)).includes(norm(f))).map(([b, c, v, f]) => `${b} ${c}:${v} "${f}"`);
    expect(bad).toEqual([]);
  });

  it('each fragment is actually in the lesson (no stale list)', () => {
    const text = norm(blob());
    const missing = PM12_QUOTES.filter(([, , , f]) => !text.includes(norm(f))).map(([b, c, v, f]) => `${b} ${c}:${v} "${f}"`);
    expect(missing).toEqual([]);
  });

  it('PROVEN-TO-CATCH: a one-word tamper fails against the real verse', () => {
    expect(norm(verse('1Samuel', 17, 39)).includes('I cannot go with these; for I have not worn them')).toBe(false);
    expect(norm(verse('Matthew', 7, 20)).includes('Wherefore by their titles ye shall know them')).toBe(false);
    expect(norm(verse('Matthew', 7, 20)).includes('Wherefore by their fruits ye shall know them')).toBe(true);
  });
});

describe('the Word’s case first, his experience carried honestly', () => {
  it('states the framing plainly: an assistant’s reply, his experience and his point', () => {
    expect(m.bigIdea).toMatch(/written as an assistant’s reply to him/);
    expect(m.levels.senior).toMatch(/the phrasing belongs to the assistant, and the experiences and the conclusion belong to him/);
  });

  it('carries the retail example he lived, and the ownership he concluded', () => {
    for (const t of [m.bigIdea, m.levels.senior]) {
      expect(t).toMatch(/rent-to-own/);
      expect(t).toMatch(/market manager/i);
      expect(t).toMatch(/ownership/);
    }
    expect(m.levels.teen).toMatch(/The title never came/);
  });

  it('leaves out what was private: no pending job named, no employer system named', () => {
    const t = blob();
    expect(/Senior Project Manager/.test(t)).toBe(false);
    expect(/Mosaic|TeamDynamix|Siemens/.test(t)).toBe(false);
  });

  it('names the industry’s terms as THEIR vocabulary for the Word’s case', () => {
    expect(blob()).toMatch(/competency-based assessment/);
    expect(blob()).toMatch(/stakeholder engagement/);
    expect(blob()).toMatch(/the industry calls/);
  });

  it('says Yahweh in our own voice', () => {
    expect(/\bGod\b/.test(blob().replace(/"[^"]*"/g, ''))).toBe(false);
  });
});
