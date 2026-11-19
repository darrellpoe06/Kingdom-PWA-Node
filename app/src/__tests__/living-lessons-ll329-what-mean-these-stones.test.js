// L329 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll329-what-mean-these-stones.js';
import { describe, it, expect } from 'vitest';
import { livingLessonGate, textsOf, ourVoice } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll329-what-mean-these-stones',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 329,
  added: '2026-11-18',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Joshua 4:6', 'What mean ye by these stones'],
    ['Deuteronomy 4:9', 'lest thou forget the things which thine eyes have seen'],
    ['Numbers 11:6', 'there is nothing at all, beside this manna'],
    ['Deuteronomy 8:18', 'it is he that giveth thee power to get wealth'],
    ['Psalms 77:11', 'I will remember the works of the LORD'],
    ['Psalms 103:2', 'forget not all his benefits'],
  ],
});

// Particular to this lesson: it is built from a forwarded newsletter recap, so
// the recap's claims are tiered in every place a reader reads, nothing of the
// forward (links, sponsors, the hosts' names) reaches the reader, and the
// earlier lessons on the same stories are named (one teaching, one lesson).
describe('L329 — the forward stays material, tiered and named', () => {
  it('the Word opens before the podcast is taught in every place: Joshua 4:6 is quoted before the word REPORTED', () => {
    for (const [place, text] of Object.entries(textsOf(lesson))) {
      const word = text.indexOf('What mean ye by these stones');
      const reported = text.search(/REPORTED|reported/);
      expect(word, `${place} quotes Joshua 4:6`).toBeGreaterThan(-1);
      if (reported > -1) expect(word, `${place} puts the Word first`).toBeLessThan(reported);
    }
  });

  it('the adult lesson and the teen and senior bands tier the recap: reported, and established', () => {
    for (const place of ['adult', 'teen', 'senior']) {
      const t = textsOf(lesson)[place];
      expect(t, place).toMatch(/reported/i);
      expect(t, place).toMatch(/established/i);
      expect(t, place).toMatch(/verif/i);
    }
  });

  it('carries no link, sponsor, address or host name from the forward', () => {
    const text = JSON.stringify(lesson);
    expect(text).not.toMatch(/https?:\/\/|www\.|@|sponsor|Corey|Grant|Napster|Pika|Neuron/i);
  });

  it('names the earlier manna lesson, so one teaching stays one lesson (DR-0610)', () => {
    expect(lesson.inApp).toMatch(/His Ways Are Higher, So He Gives the Bread/);
    expect(lesson.lesson).toMatch(/His Ways Are Higher, So He Gives the Bread/);
  });

  it('teaches one question only: the second question of the recap is named as left for its own lesson, not taught', () => {
    expect(ourVoice(lesson.lesson)).toMatch(/what kind of world we want to create/);
    expect(ourVoice(lesson.lesson)).not.toMatch(/WHAT KIND OF WORLD/);
  });

  it('PROVEN-TO-CATCH: a host name or a link planted in a copy is caught', () => {
    const planted = { ...lesson, inApp: `${lesson.inApp} Grant said so at https://example.com` };
    expect(JSON.stringify(planted)).toMatch(/https?:\/\/|Grant/);
  });
});
