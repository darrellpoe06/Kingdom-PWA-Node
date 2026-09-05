// =============================================================================
// L101 — The Real Champion: action not theory, die once live forever, and the
// solid mind of Christ. Verbatim KJV.
// =============================================================================
// Captured from Darrell's spoken testimony 2026-08-29 ("Lesson.") — a spoken
// teaching is build input (DR-0089). Yahweh sets life and death before us and we
// choose life; Jesus did it in ACTION not theory (laid His life down and took it
// up by His own power); His Crown/Nature was never truly at risk yet the
// obedience was fully real; die once, live forever; not Superman — the real
// Champion upholds all things and is solid, the same for ever; think like the
// Father, the sound Christlike mind. His 3rd/4th-dimensional frame is HIS
// testimony's language laid alongside the Word, never substituted for it
// (DR-0098). Every KJV line FETCHED from the repo's own KJV this session; a drift
// fails the build.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll101-the-real-champion-action-not-theory-die-once-live-forever-and-the-mind-of-christ'");
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
  // choose life
  'therefore choose life, that both thou and thy seed may live',
  'I have set before thee this day life and good, and death and evil',
  // action not theory
  'because I lay down my life, that I might take it again',
  'No man taketh it from me, but I lay it down of myself. I have power to lay it down, and I have power to take it again',
  'Greater love hath no man than this, that a man lay down his life for his friends',
  'Who, being in the form of God, thought it not robbery to be equal with God',
  'But made himself of no reputation, and took upon him the form of a servant',
  'he humbled himself, and became obedient unto death, even the death of the cross',
  // crown secure, obedience real
  'For I am the LORD, I change not',
  'Wherefore God also hath highly exalted him, and given him a name which is above every name',
  'That at the name of Jesus every knee should bow',
  'KING OF KINGS, AND LORD OF LORDS',
  'who for the joy that was set before him endured the cross',
  // die once, live forever
  'And as it is appointed unto men once to die, but after this the judgment',
  'Christ being raised from the dead dieth no more; death hath no more dominion over him',
  'I am he that liveth, and was dead; and, behold, I am alive for evermore',
  // not Superman — He holds all things
  'For by him were all things created, that are in heaven, and that are in earth',
  'And he is before all things, and by him all things consist',
  // solid, unchanging
  'Jesus Christ the same yesterday, and to day, and for ever',
  // think like the Father
  'Let this mind be in you, which was also in Christ Jesus',
  'But we have the mind of Christ',
  'but of power, and of love, and of a sound mind',
  'Set your affection on things above, not on things on the earth',
];

describe('L101 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Deuteronomy 30:19; John 10:18; Hebrews 13:8'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — seven movements + THE WHOLE OF IT', () => {
    const order = [
      '1) YAHWEH SETS LIFE AND DEATH BEFORE US',
      '2) JESUS DID IT IN ACTION, NOT THEORY',
      '3) HIS CROWN WAS NEVER TRULY AT RISK',
      '4) DIE ONCE, LIVE FOREVER',
      '5) NOT SUPERMAN',
      '6) HE IS SOLID',
      '7) THINK LIKE THE FATHER',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('holds the doctrine reverently (DR-0098) and honors the testimony provenance (DR-0089)', () => {
    expect(l).toContain('DR-0098');
    expect(l).toContain('spoken testimony');
    // the careful line kept, not collapsed: deity secure AND obedience real
    expect(l).toContain('Deity secure');
    expect(l).toContain('obedience real');
    // his own framing acknowledged as testimony language
    expect(l).toContain('3rd/4th-dimensional');
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    it(`quotes verbatim: "${frag.slice(0, 52)}${frag.length > 52 ? '…' : ''}"`, () => {
      expect(l).toContain(frag);
    });
  }
});

describe('every age level carries the message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };
  it('child, teen, and senior each carry the real-Champion and action-not-theory threads', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries alive for evermore`).toContain('alive for evermore');
      expect(t, `${band} carries laid it down / power`).toMatch(/lay it down|lay down his life|laid it down|took it up|take it again/i);
    }
    // teen and senior additionally carry the immutable-Nature line and the sound mind.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('For I am the LORD, I change not');
      expect(t).toContain('sound mind');
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Deuteronomy', 30, 19)).toContain('therefore choose life, that both thou and thy seed may live');
    expect(verse('John', 10, 18)).toBe('No man taketh it from me, but I lay it down of myself. I have power to lay it down, and I have power to take it again. This commandment have I received of my Father.');
    expect(verse('John', 15, 13)).toBe('Greater love hath no man than this, that a man lay down his life for his friends.');
    expect(verse('Philippians', 2, 8)).toBe('And being found in fashion as a man, he humbled himself, and became obedient unto death, even the death of the cross.');
    expect(verse('Philippians', 2, 5)).toBe('Let this mind be in you, which was also in Christ Jesus:');
    expect(verse('Malachi', 3, 6)).toContain('For I am the LORD, I change not');
    expect(verse('Revelation', 1, 18)).toContain('I am he that liveth, and was dead; and, behold, I am alive for evermore');
    expect(verse('Revelation', 19, 16)).toContain('KING OF KINGS, AND LORD OF LORDS');
    expect(verse('Romans', 6, 9)).toBe('Knowing that Christ being raised from the dead dieth no more; death hath no more dominion over him.');
    expect(verse('Colossians', 1, 17)).toBe('And he is before all things, and by him all things consist.');
    expect(verse('Hebrews', 13, 8)).toBe('Jesus Christ the same yesterday, and to day, and for ever.');
    expect(verse('1Corinthians', 2, 16)).toContain('But we have the mind of Christ');
    expect(verse('2Timothy', 1, 7)).toBe('For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.');
  });
});
