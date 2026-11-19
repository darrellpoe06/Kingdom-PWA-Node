// L328 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import { describe, it, expect } from 'vitest';
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll328-faithful-in-that-which-is-least-trust-is-earned-again.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll328-faithful-in-that-which-is-least-trust-is-earned-again',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 328,
  added: '2026-11-18',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Luke 16:10', 'He that is faithful in that which is least is faithful also in much'],
    ['1 Corinthians 4:2', 'it is required in stewards, that a man be found faithful'],
    ['Matthew 25:21', 'thou hast been faithful over a few things'],
    ['James 1:22', 'be ye doers of the word, and not hearers only'],
    ['Matthew 23:23', 'these ought ye to have done, and not to leave the other undone'],
  ],
  // The church that hosted the district's hiring day is named by its own name;
  // that name is not our voice calling Yahweh by a generic title (DR-0210).
  voiceAllow: [/The Church of the Living God/g],
});

// Particular to L328: a public newsletter is taught as public record, and its
// figures stay marked as reported (DR-0076). No household detail may reach it.
describe('L328 — the newsletter stays public record, reported', () => {
  const all = JSON.stringify(lesson);
  it('marks the district figures as reported in every place that gives them', () => {
    for (const t of [lesson.lesson, lesson.levels.youth, lesson.levels.teen, lesson.levels.senior]) expect(t).toMatch(/report/i);
    expect(lesson.inApp).toMatch(/Trust but verify/);
  });
  it('never says whether any child of a household attends, and carries no thread id or link', () => {
    expect(all).not.toMatch(/\b(our|my) (son|daughter|child|grandchild|kids?) (attends|goes to)/i);
    expect(all).not.toMatch(/1a1f08ea67f4d4c6/);
    expect(all).not.toMatch(/https?:\/\//);
  });
});
