// L322 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import { describe, it, expect } from 'vitest';
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll322-why-should-he-take-away-thy-bed.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll322-why-should-he-take-away-thy-bed',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 322,
  added: '2026-11-18',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Proverbs 22:26-27', 'why should he take away thy bed from under thee?'],
    ['Proverbs 22:7', 'the borrower is servant to the lender'],
    ['Proverbs 14:15', 'the prudent man looketh well to his going'],
    ['Luke 14:28', 'counteth the cost'],
    ['Deuteronomy 24:6', 'he taketh a man’s life to pledge'],
  ],
});

// Particular to L322: a personal money email is taught generically (DR-1547). No
// figure, rate or name from the forwarded offer may reach the lesson.
describe('L322 — the household’s particulars stay out', () => {
  it('carries no percentage, no APR figure and no dollar sign', () => {
    const all = JSON.stringify(lesson);
    expect(all).not.toMatch(/\d+(?:\.\d+)?\s*%/);
    expect(all).not.toMatch(/\$/);
    expect(all).not.toMatch(/14\.35/);
  });
});
