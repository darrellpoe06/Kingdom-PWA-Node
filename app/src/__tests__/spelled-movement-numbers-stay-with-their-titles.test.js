// @vitest-environment node
// =============================================================================
// A SPELLED MOVEMENT NUMBER STAYS WITH ITS TITLE (DR-0699)
// =============================================================================
// Darrell 2026-09-30, reading L202's youth band on his phone (steps 13-14):
// "...(Hebrews 13:8). SEVEN." at the foot of one step and "5STAY IN THE WORD"
// at the head of the next. Two mechanical causes, both measured:
//   1. the sentence cutter treated the author's "SEVEN." as a sentence of its
//      own, so the heading pass saw a bare title and gave it its own running
//      count (5), which disagreed with the author's SEVEN;
//   2. the pacer could close a step right after "SEVEN.", and a quotation that
//      ends in "?" left `" (Romans 8:35).` to open a step on its own.
// Not one word of any lesson changes: only where a step breaks and which
// number is rendered beside a heading the author already wrote.
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { chunkLessonForAge } from '../lib/learn-framework.js';
import { formatLessonText, lessonSectionPlan } from '../lib/lesson-format.js';

const WORDS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
const BANDS = ['child', 'youth', 'teen', 'adult', 'senior'];
const textFor = (m, band) => (band === 'adult' ? m.lesson : (m.levels && m.levels[band]) || '');
const headingsOf = (text, band) => {
  const segs = chunkLessonForAge(text, band);
  const plan = lessonSectionPlan(segs.join(' '));
  return segs.flatMap((s) => formatLessonText(s, plan).items.filter((i) => i.kind === 'heading'));
};

describe('L202, the lesson Darrell read', () => {
  const L = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll202-'));
  for (const band of BANDS) {
    it(`${band}: the badge beside each movement is the author's own number`, () => {
      const hs = headingsOf(textFor(L, band), band);
      const spelled = hs.filter((h) => /^(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE)\. /.test(h.text));
      expect(spelled.length, band).toBe(9);
      for (const h of spelled) expect(h.n, h.text).toBe(WORDS.indexOf(h.text.split('.')[0]) + 1);
    });
  }
});

describe('every Living Lesson, every band', () => {
  it('no step ends on a bare movement number, and none opens on the tail of a quotation', () => {
    const faults = [];
    for (const m of LIVING_LESSONS_MODULES) {
      for (const band of BANDS) {
        const text = textFor(m, band);
        if (!text) continue;
        for (const s of chunkLessonForAge(text, band)) {
          if (/(?:^|[.!?]["”’)\]]*\s)(?:[A-Z]{3,} )?(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE)\.$/.test(s)) faults.push(`${m.id} ${band}: ends on "${s.slice(-12)}"`);
          if (/^["”’]\s+\(/.test(s)) faults.push(`${m.id} ${band}: opens on "${s.slice(0, 20)}"`);
        }
      }
    }
    expect(faults, faults.slice(0, 10).join('\n')).toEqual([]);
  });

  it('pacing never drops or reorders a character', () => {
    for (const m of LIVING_LESSONS_MODULES.filter((x) => /^ll(19[7-9]|20[0-2])-/.test(x.id))) {
      for (const band of BANDS) {
        const text = textFor(m, band);
        if (!text) continue;
        expect(chunkLessonForAge(text, band).join(' ').replace(/\s+/g, ' ')).toBe(text.trim().replace(/\s+/g, ' '));
      }
    }
  });

  it('PROVEN-TO-CATCH: the defect as Darrell saw it is the thing this file measures', () => {
    // Without the spelled marker, "SEVEN." and "STAY IN THE WORD." are two
    // sentences and the title takes a running count that is not 7.
    const broken = 'SEVEN, STAY IN THE WORD. People used to believe the brain stopped changing. SIX. YAHWEH DEFINES SUCCESS. Keep it in your mouth.';
    const plan = lessonSectionPlan(broken);
    const hs = formatLessonText(broken, plan).items.filter((i) => i.kind === 'heading');
    expect(hs.find((h) => h.text.startsWith('SIX.')).n).toBe(6);
    // A bare "SEVEN." at a step's end is caught by the rule above.
    expect(/(?:^|[.!?]["”’)\]]*\s)(?:[A-Z]{3,} )?(SEVEN)\.$/.test('(Hebrews 13:8). SEVEN.')).toBe(true);
  });
});
