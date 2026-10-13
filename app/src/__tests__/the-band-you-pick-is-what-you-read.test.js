// @vitest-environment node
// =============================================================================
// THE BAND YOU PICK IS WHAT YOU READ, FROM THE FIRST WORDS (DR-0745)
// =============================================================================
// Darrell 2026-10-01, three screenshots of L206 on his Fold with Child, Senior
// and Adult picked in turn and the same adult paragraph under all three:
// "What keeps happening to the options for all ages?! The features keep
// coming and going!"
//
// The card's first paragraph was always the adult big idea; a band's own
// words began only after Start opened the guide. bandOpening() gives the card
// the picked band's own first movement when the lesson carries one.
//
// PROVEN-TO-CATCH: the L206 case fails against the old card, which read the
// big idea for every band; the adult case and the bandless case keep the big
// idea, so the fix never invents words a lesson does not carry.
import { describe, it, expect } from 'vitest';
import { openingOf, bandOpening } from '../lib/learn-framework.js';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';

const LL = buildCatalogCourseDescriptors().find((c) => (c.key || c.meta?.key) === 'living-lessons');
const L206 = LL.schedule.find((m) => /^ll206-/.test(m.id));

describe('openingOf: the first movement of a band text', () => {
  it('stops at the first spelled movement marker when the lead is long enough', () => {
    const t = 'This lesson is about a book and a king. He wrote short notes, one after another, and we put them into a lesson. Let us take them one at a time, because each one matters and each one is from the Word. ONE. KINGS SEARCH IT OUT. Did you know Yahweh hides things on purpose?';
    expect(openingOf(t)).toBe('This lesson is about a book and a king. He wrote short notes, one after another, and we put them into a lesson. Let us take them one at a time, because each one matters and each one is from the Word.');
  });
  it('stops at the first blank line', () => {
    expect(openingOf('First paragraph here.\n\nSecond paragraph.')).toBe('First paragraph here.');
  });
  it('a short lead before a marker is not cut: the marker opens the words', () => {
    expect(openingOf('Short lead. ONE. The first point is long enough to read.')).toBe('Short lead. ONE. The first point is long enough to read.');
  });
  it('a long unbroken text is cut at a sentence boundary within the limit', () => {
    const s = 'A sentence of some length that goes on for a while. ';
    const out = openingOf(s.repeat(40), 300);
    expect(out.length).toBeLessThanOrEqual(300);
    expect(out.endsWith('.')).toBe(true);
    expect(out.split('. ').length).toBeGreaterThan(2);
  });
  it('empty in, empty out', () => {
    expect(openingOf('')).toBe('');
    expect(openingOf(null)).toBe('');
  });
});

describe('bandOpening: what the card shows first', () => {
  it('L206 for a child opens in the child words, not the adult big idea', () => {
    expect(L206.levels.child).toBeTruthy();
    const o = bandOpening(L206, 'child');
    expect(o.own).toBe(true);
    expect(o.levelId).toBe('child');
    expect(o.band.label).toBe('Child');
    expect(L206.levels.child.startsWith(o.text)).toBe(true);
    expect(o.text).not.toBe(L206.bigIdea);
    expect(o.text.length).toBeGreaterThan(120);
    expect(o.text.length).toBeLessThanOrEqual(900);
  });
  it('L206 for a senior opens in the senior words; youth and teen in theirs; each differs', () => {
    const texts = ['youth', 'teen', 'senior'].map((b) => {
      const o = bandOpening(L206, b);
      expect(o.own, b).toBe(true);
      expect(L206.levels[b].startsWith(o.text), b).toBe(true);
      return o.text;
    });
    expect(new Set(texts).size).toBe(3);
  });
  it('PROVEN-TO-CATCH: the adult band keeps the big idea, and so does a lesson with no bands', () => {
    const adult = bandOpening(L206, 'adult');
    expect(adult.own).toBe(false);
    expect(adult.text).toBe(L206.bigIdea);
    const plain = { id: 'x', bigIdea: 'One idea for everyone.', lesson: 'The whole lesson.' };
    for (const b of ['child', 'youth', 'teen', 'adult', 'senior']) {
      const o = bandOpening(plain, b);
      expect(o.own, b).toBe(false);
      expect(o.text, b).toBe('One idea for everyone.');
    }
  });
  it('an explicit level override keeps the big idea (the override is the reader\'s own choice of depth, not a band)', () => {
    const o = bandOpening(L206, 'child', 'standard');
    expect(o.own).toBe(false);
    expect(o.text).toBe(L206.bigIdea);
  });
});
