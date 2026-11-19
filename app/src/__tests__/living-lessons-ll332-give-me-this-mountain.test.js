// L332 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import { describe, it, expect } from 'vitest';
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll332-give-me-this-mountain.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll332-give-me-this-mountain',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 332,
  added: '2026-11-19',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Joshua 14:12', 'give me this mountain'],
    ['Joshua 14:11', 'as my strength was then, even so is my strength now'],
    ['Joshua 14:10', 'I am this day fourscore and five years old'],
    ['Joshua 14:7', 'Forty years old was I'],
    ['Numbers 14:24', 'hath followed me fully'],
    ['1 Kings 19:5', 'Arise and eat'],
  ],
});

// Particular to L332 (DR-1571): the forwarded newsletter's claims stay reported,
// its dream practice is never taught as a practice, and no person in it is named.
describe('L332 — the forward is reported, not taught as proven', () => {
  const all = JSON.stringify(lesson);
  it('names the arts finding as a correlation wherever the lesson tells it', () => {
    for (const t of [lesson.lesson, lesson.levels.youth, lesson.levels.teen, lesson.levels.senior]) expect(t).toMatch(/correlation|go together/);
  });
  it('carries no dream-incubation instruction and no name from the newsletter', () => {
    expect(all).not.toMatch(/incubat/i);
    expect(all).not.toMatch(/Aubrey|Inskeep|Joseph|Cartwright|Gilbert|Nair|Aronson|Rosand/);
  });
});
