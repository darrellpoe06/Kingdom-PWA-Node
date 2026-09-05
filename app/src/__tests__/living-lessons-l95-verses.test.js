// =============================================================================
// L95 — Know the State of Thy Flocks (Best Buy, reading the times, the fickle
// rally): verbatim KJV
// =============================================================================
// Darrell 2026-08-28 (forwarded a retail piece + "Lesson."): Best Buy beat
// earnings and raised its outlook through tariff chaos and weak sentiment — its
// "trick" was following consumers' lead wherever they wanted to go; its stock,
// up ~50%, fell 4% on the good news ("buy the hype, sell the news"). Captured
// Word-first (the Spoken-Teachings rule + DR-0089; the beat carried AS REPORTED,
// DR-0076). Every KJV line was FETCHED from the repo's own KJV this session; a
// drifted quote fails the build.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll95-know-the-state-of-thy-flocks-best-buy-and-the-fickle-rally'");
// Bound the slice to THIS lesson rather than to a fixed character window. A
// fixed window is fragile in BOTH directions: too small and it misses the end of
// the lesson (which is how adding adult-depth prose pushed `quiz:` out of view),
// too large and it sweeps into the NEXT lesson and judges someone else's prose.
const l = (() => {
  const rest = src.slice(start);
  const nextLesson = rest.indexOf("\n  {\n    id: 'll");
  const arrayEnd = rest.indexOf('\n  },\n];');
  const ends = [nextLesson, arrayEnd].filter((i) => i > -1);
  return ends.length ? rest.slice(0, Math.min(...ends)) : rest;
})();

const QUOTED_FRAGMENTS = [
  // Hard times forge good ones
  'we glory in tribulations also: knowing that tribulation worketh patience',
  'And patience, experience; and experience, hope',
  'count it all joy when ye fall into divers temptations',
  'the trying of your faith worketh patience',
  // Know the flock / read the times
  'Be thou diligent to know the state of thy flocks, and look well to thy herds',
  'had understanding of the times, to know what Israel ought to do',
  // Meet people where they are
  'I am made all things to all men, that I might by all means save some',
  'I am the good shepherd, and know my sheep, and am known of mine',
  // Presence
  'Not forsaking the assembling of ourselves together, as the manner of some is; but exhorting one another',
  // Diligence bears rule, as worship
  'Seest thou a man diligent in his business? he shall stand before kings',
  'The hand of the diligent shall bear rule: but the slothful shall be under tribute',
  'And whatsoever ye do, do it heartily, as to the Lord, and not unto men',
  // Don't chase the hype / uncertain riches
  'Labour not to be rich: cease from thine own wisdom',
  'riches certainly make themselves wings; they fly away as an eagle toward heaven',
  'nor trust in uncertain riches, but in the living God, who giveth us richly all things to enjoy',
  'Boast not thyself of to morrow; for thou knowest not what a day may bring forth',
  // Build on Yahweh
  'Except the LORD build the house, they labour in vain that build it',
  'Commit thy works unto the LORD, and thy thoughts shall be established',
];

describe('L95 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Proverbs 27:23; 1 Corinthians 9:22; Proverbs 23:5'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the spoken spine, in order (hard times → flocks → meet people → presence → diligence → not the hype → build on Yahweh)', () => {
    expect(l).toContain('THE STEWARD ABOVE IT');
    expect(l).toContain('carried as reported'); // DR-0076 honesty
    const order = [
      '1) HARD TIMES CAN FORGE GOOD ONES',
      '2) KNOW THE STATE OF THY FLOCKS',
      '3) MEET PEOPLE WHERE THEY ARE',
      '4) PRESENCE STILL MATTERS',
      '5) DILIGENCE PROSPERS AND BEARS RULE',
      '6) BUT DO NOT CHASE THE CROWD',
      '7) BUILD IT ON YAHWEH, NOT ON THE RALLY',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    it(`quotes verbatim: "${frag.slice(0, 52)}${frag.length > 52 ? '…' : ''}"`, () => {
      expect(l).toContain(frag);
    });
  }
});

describe('every age level carries the whole message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };
  it('child, teen, and senior each carry the flock, the presence, and building on Yahweh', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries knowing the flock / good shepherd`).toMatch(/state of thy flocks|good shepherd/);
      expect(t, `${band} carries presence`).toContain('Not forsaking the assembling of ourselves together');
      expect(t, `${band} carries build-on-Yahweh`).toContain('Except the LORD build the house');
    }
    // teen and senior additionally carry the fickle-rally warning.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('riches certainly make themselves wings');
      expect(t).toContain('trust in uncertain riches');
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Proverbs', 27, 23)).toBe('Be thou diligent to know the state of thy flocks, and look well to thy herds.');
    expect(verse('1Corinthians', 9, 22)).toContain('I am made all things to all men, that I might by all means save some');
    expect(verse('John', 10, 14)).toBe('I am the good shepherd, and know my sheep, and am known of mine.');
    expect(verse('Proverbs', 23, 5)).toContain('riches certainly make themselves wings; they fly away as an eagle toward heaven');
    expect(verse('Proverbs', 22, 29)).toContain('he shall stand before kings');
    expect(verse('Hebrews', 10, 25)).toContain('Not forsaking the assembling of ourselves together');
    expect(verse('Psalms', 127, 1)).toContain('Except the LORD build the house, they labour in vain that build it');
    expect(verse('Colossians', 3, 23)).toBe('And whatsoever ye do, do it heartily, as to the Lord, and not unto men;');
    expect(verse('Proverbs', 16, 3)).toBe('Commit thy works unto the LORD, and thy thoughts shall be established.');
  });
});
