// L323 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll323-count-the-cost-before-you-build-stewarding-a-powerful-new.js';
import { describe, it, expect } from 'vitest';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll323-count-the-cost-before-you-build-stewarding-a-powerful-new',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 323,
  added: '2026-11-18',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Luke 14:28', 'counteth the cost'],
    ['Proverbs 24:27', 'afterwards build thine house'],
    ['Proverbs 15:22', 'in the multitude of counsellors they are established'],
    ['1 Thessalonians 5:21', 'Prove all things; hold fast that which is good'],
    ['Proverbs 18:16', 'gift maketh room for him'],
    ['Proverbs 16:3', 'Commit thy works unto the LORD'],
  ],
});

// Particular to this lesson: it is built from a personal job application, so no
// personal detail of it may reach the reader (the privacy line of its intake).
describe('L323 — the application stays private', () => {
  it('names no employer, position title, job number, school, credential or date from the forward', () => {
    const text = JSON.stringify(lesson);
    expect(text).not.toMatch(/Darrell|Poe\b|@|https?:\/\/|\b(?:19|20)\d{2}\b|\$\s?\d|job (?:id|number)|announcement number/i);
  });

  it('names the earlier interview lesson it walks beside, so one teaching stays one lesson (DR-0610)', () => {
    expect(lesson.inApp).toMatch(/He Shall Stand Before Kings/);
    expect(lesson.lesson).toMatch(/He Shall Stand Before Kings/);
  });
});
