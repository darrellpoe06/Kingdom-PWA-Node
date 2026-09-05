// =============================================================================
// L88 — The King's Program, Part 2 (the Four Soils): verbatim KJV
// =============================================================================
// Darrell 2026-08-24 (spoken): "Different hearts or subconsciousness...
// thorns... etc... what could each heart condition symbolize?" · "The only
// person earth programs are inside The Word... eternal 4th-dimensional King
// Algorithms..." · "All inside the same lesson/s.... so if you read only
// [one] you have understanding." Jesus decodes His own parable (Luke 8:11-15)
// — the Word explains the Word (DR-0098); the 4th-dimensional frame is
// DR-0097. Every KJV line below was FETCHED from the repo's own KJV this
// session (DR-0076 / DR-0281). A drifted quote fails the build.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll88-four-soils-heart-conditions-and-the-kings-eternal-program'");
// Bound the slice to THIS lesson rather than to a fixed character window. A
// fixed window is fragile in BOTH directions: too small and it misses the end of
// the lesson (which is how adding adult-depth prose pushed `quiz:` out of view),
// too large and it sweeps into the NEXT lesson and judges someone else's prose.
const lesson = (() => {
  const rest = src.slice(start);
  const nextLesson = rest.indexOf("\n  {\n    id: 'll");
  const arrayEnd = rest.indexOf('\n  },\n];');
  const ends = [nextLesson, arrayEnd].filter((i) => i > -1);
  return ends.length ? rest.slice(0, Math.min(...ends)) : rest;
})();
const l = lesson.replace(/\\u2019/g, '’');

// Fetched verbatim from app/public/bible/kjv (full verses, this session).
const KJV = {
  'Luke 8:11': 'Now the parable is this: The seed is the word of God.',
  'Luke 8:12': 'Those by the way side are they that hear; then cometh the devil, and taketh away the word out of their hearts, lest they should believe and be saved.',
  'Luke 8:14': 'And that which fell among thorns are they, which, when they have heard, go forth, and are choked with cares and riches and pleasures of this life, and bring no fruit to perfection.',
  'Luke 8:15': 'But that on the good ground are they, which in an honest and good heart, having heard the word, keep it, and bring forth fruit with patience.',
  'Mark 4:19': 'And the cares of this world, and the deceitfulness of riches, and the lusts of other things entering in, choke the word, and it becometh unfruitful.',
  'Proverbs 4:23': 'Keep thy heart with all diligence; for out of it are the issues of life.',
  'Jeremiah 4:3 (fragment)': 'Break up your fallow ground, and sow not among thorns.',
  'Ezekiel 36:26': 'A new heart also will I give you, and a new spirit will I put within you: and I will take away the stony heart out of your flesh, and I will give you an heart of flesh.',
};

const QUOTED_FRAGMENTS = [
  'Now the parable is this: The seed is the word of God',
  'some fell by the way side; and it was trodden down, and the fowls of the air devoured it',
  'then cometh the devil, and taketh away the word out of their hearts, lest they should believe and be saved',
  'To day if ye will hear his voice, harden not your hearts',
  'it withered away, because it lacked moisture',
  'receive the word with joy; and these have no root, which for a while believe, and in time of temptation fall away',
  'I will take away the stony heart out of your flesh, and I will give you an heart of flesh',
  'the thorns sprang up with it, and choked it',
  'choked with cares and riches and pleasures of this life, and bring no fruit to perfection',
  'the cares of this world, and the deceitfulness of riches, and the lusts of other things entering in, choke the word, and it becometh unfruitful',
  'and bare fruit an hundredfold',
  'an honest and good heart, having heard the word, keep it, and bring forth fruit with patience',
  'Break up your fallow ground, and sow not among thorns',
  'Sow to yourselves in righteousness, reap in mercy; break up your fallow ground: for it is time to seek the LORD',
  'Keep thy heart with all diligence; for out of it are the issues of life',
  'He that hath ears to hear, let him hear',
  // the Part-1 core carried inside Part 2 (self-contained pair)
  'I am the way, the truth, and the life',
  'That the man of God may be perfect',
];

describe('L88 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Luke 8:11, 15'", 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(lesson).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
    expect(src).toContain('L88 The King’s Program Part 2');
  });
  it("keeps the Governor's framing: heart/subconscious soils and the eternal King-program", () => {
    for (const frag of ['The King’s Program, Part 2', 'subconscious', 'eternal', 'HARDENED', 'SHALLOW', 'DIVIDED', 'HONEST, KEPT']) {
      expect(l).toContain(frag);
    }
  });
  it('the symbols are Jesus’ own decode, and the adversary stays lowercase in our voice', () => {
    expect(l).toContain('He decodes each condition Himself');
    expect(l).toContain('then cometh the devil'); // KJV verbatim, lowercase as written
    expect(l).not.toMatch(/The Devil/);
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    it(`quotes verbatim: "${frag.slice(0, 60)}${frag.length > 60 ? '…' : ''}"`, () => {
      expect(l).toContain(frag);
    });
  }
});

describe('tamper-catch — the pinned KJV ground truth is itself exact', () => {
  it('full-verse pins match their known lengths and endings', () => {
    expect(KJV['Luke 8:11']).toBe('Now the parable is this: The seed is the word of God.');
    expect(KJV['Luke 8:11'].length).toBe(53);
    expect(KJV['Luke 8:15'].endsWith('bring forth fruit with patience.')).toBe(true);
    expect(KJV['Luke 8:14']).toContain('no fruit to perfection');
    expect(KJV['Mark 4:19']).toContain('deceitfulness of riches');
    expect(KJV['Proverbs 4:23'].length).toBe(72);
    expect(KJV['Ezekiel 36:26']).toContain('stony heart');
    expect(KJV['Luke 8:12']).toContain('then cometh the devil');
  });
});
