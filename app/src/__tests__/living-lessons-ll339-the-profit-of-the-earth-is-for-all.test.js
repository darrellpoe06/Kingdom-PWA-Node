// L339 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll339-the-profit-of-the-earth-is-for-all.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';
import { describe, it, expect } from 'vitest';

livingLessonGate({
  id: 'll339-the-profit-of-the-earth-is-for-all',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 339,
  added: '2026-11-23',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Ecclesiastes 5:9', 'the profit of the earth is for all'],
    ['Proverbs 22:7', 'the borrower is servant to the lender'],
    ['Proverbs 23:5', 'riches certainly make themselves wings'],
    ['Luke 10:7', 'the labourer is worthy of his hire'],
    ['Ecclesiastes 5:5', 'Better is it that thou shouldest not vow, than that thou shouldest vow and not pay.'],
    ['1 Corinthians 9:10', 'he that thresheth in hope should be partaker of his hope'],
  ],
});

// What is particular to L339 (DR-1612): a lesson about the maker of the tool
// this app is built with carries that disclosure in every place a reader reads
// (the DR-1502 precedent), every figure stays REPORTED (one newsletter, no
// filing read), no person is named, and the follow-the-money frame names the
// Business Research lesson that already teaches it rather than teaching it again.

const places = { lesson: lesson.lesson, inApp: lesson.inApp, ...lesson.levels };
const ourVoice = (t) =>
  String(t)
    .split('"')
    .filter((_, i) => i % 2 === 0)
    .join(' ');

describe('L339 — what is particular to this lesson', () => {
  it('discloses, in every teaching place, that this app is built with a tool from the company in the story', () => {
    for (const [place, text] of Object.entries(places)) {
      expect(/this app|this very application/i.test(text) && /same company|very company|that same company/i.test(text), place).toBe(true);
    }
  });

  it('keeps every figure at its weight: each place that gives a dollar figure says it is reported', () => {
    for (const [place, text] of Object.entries(places)) {
      if (!/\$\d/.test(text)) continue;
      expect(/reported/i.test(text), `${place} gives figures without saying they are reported`).toBe(true);
    }
    expect(UNCHECKED).toMatch(/not yet independently verified/);
  });

  it('names no person and no fund: the founders, the researcher and the mathematician stay unnamed', () => {
    const all = Object.values(places).join(' ') + JSON.stringify(lesson.quiz) + JSON.stringify(lesson.facilitator);
    for (const name of ['Amodei', 'Kinder', 'Alpoge', 'Menlo', 'Lightspeed', 'Spark Capital', 'Anthropic', 'Amazon', 'Google', 'Riemann']) {
      expect(ourVoice(all).includes(name), name).toBe(false);
    }
  });

  it('names the Business Research lesson on following the money instead of teaching it again', () => {
    expect(lesson.lesson).toMatch(/Business Research course already teaches how to follow the money to the oil/);
  });

  it('is proven to catch: a stripped disclosure and an unreported figure both fail the checks above', () => {
    const stripped = lesson.levels.teen.replace(/this app[^.]*\./i, '');
    expect(/this app|this very application/i.test(stripped) && /same company/i.test(stripped)).toBe(false);
    const bare = 'The shares were priced at $83.';
    expect(/\$\d/.test(bare) && !/reported/i.test(bare)).toBe(true);
  });
});
