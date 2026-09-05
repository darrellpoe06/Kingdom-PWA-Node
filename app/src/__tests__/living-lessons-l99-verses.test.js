// =============================================================================
// L99 — Watch and Be Ready: no date-setting, a sober word on A.I. and prophecy,
// and the blessed hope. Verbatim KJV.
// =============================================================================
// Darrell 2026-08-29 brought a Trackstarz panel (AI, technology, end-time
// prophecy) and said "lesson." Held as teaching, not speculation (DR-0098):
// the day is the Father's alone (Matthew 24:36; Acts 1:7), so prophecy is for
// READINESS, not prediction; readiness is daily faithfulness "found so doing";
// handle the imagery soberly — wonder is allowed, a guess is not a doctrine, do
// not add or take away (2 Peter 1:20; Revelation 22:18-19; Deuteronomy 29:29);
// meet A.I./AGI with a sound mind, not fear (2 Timothy 1:7); neither deceived
// nor troubled (Matthew 24:4,6); live in the blessed hope that purifies (Titus
// 2:13; 1 John 3:3). Every KJV line FETCHED from the repo's own KJV this
// session — a drift fails the build.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll99-watch-and-be-ready-no-date-setting-and-a-sober-word-on-ai-and-prophecy'");
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
  // no man knows the day
  'But of that day and hour knoweth no man, no, not the angels of heaven, but my Father only',
  'no, not the angels which are in heaven, neither the Son, but the Father',
  'It is not for you to know the times or the seasons, which the Father hath put in his own power',
  // prophecy is for readiness
  'Watch therefore: for ye know not what hour your Lord doth come',
  'Therefore be ye also ready: for in such an hour as ye think not the Son of man cometh',
  'Watch therefore, for ye know neither the day nor the hour wherein the Son of man cometh',
  // readiness is daily faithfulness
  'Blessed is that servant, whom his lord when he cometh shall find so doing',
  'Occupy till I come',
  'the wise took oil in their vessels with their lamps',
  'they that were ready went in with him to the marriage: and the door was shut',
  // handle the imagery soberly
  'We have also a more sure word of prophecy',
  'no prophecy of the scripture is of any private interpretation',
  'If any man shall add unto these things',
  'The secret things belong unto the LORD our God',
  // A.I. — sober, not fearful
  'God hath not given us the spirit of fear; but of power, and of love, and of a sound mind',
  'fear not them which kill the body',
  'the beginning of knowledge',
  // not deceived, not troubled
  'Take heed that no man deceive you',
  'see that ye be not troubled: for all these things must come to pass, but the end is not yet',
  // the blessed hope
  'Looking for that blessed hope, and the glorious appearing of the great God and our Saviour Jesus Christ',
  'every man that hath this hope in him purifieth himself, even as he is pure',
  'Surely I come quickly',
  'let us watch and be sober',
];

describe('L99 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Matthew 24:36; Matthew 24:44; Titus 2:13'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — seven movements + THE WHOLE OF IT', () => {
    const order = [
      '1) NO MAN KNOWS THE DAY',
      '2) THE POINT OF PROPHECY IS READINESS',
      '3) READINESS IS DAILY FAITHFULNESS',
      '4) HANDLE PROPHETIC IMAGERY SOBERLY',
      '5) A.I. IN THE PICTURE',
      '6) DO NOT BE DECEIVED, AND DO NOT BE TROUBLED',
      '7) THE BLESSED HOPE',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('holds it as teaching not speculation (DR-0098) and ties to the source occasion', () => {
    expect(l).toContain('DR-0098');
    expect(l).toContain('Trackstarz');
    // the panel's own core takeaway, folded in
    expect(l).toContain('stay ready so you do not have to get ready');
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
  it('child, teen, and senior each carry no-date-setting and be-ready threads', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries no man knows the day`).toContain('knoweth no man');
      expect(t, `${band} carries be ready`).toMatch(/be ye also ready|be READY|be ready/);
    }
    // teen and senior additionally carry the do-not-force-the-text tier and the sound-mind answer.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('no prophecy of the scripture is of any private interpretation');
      expect(t).toContain('a sound mind');
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Matthew', 24, 36)).toBe('But of that day and hour knoweth no man, no, not the angels of heaven, but my Father only.');
    expect(verse('Acts', 1, 7)).toBe('And he said unto them, It is not for you to know the times or the seasons, which the Father hath put in his own power.');
    expect(verse('Matthew', 24, 44)).toBe('Therefore be ye also ready: for in such an hour as ye think not the Son of man cometh.');
    expect(verse('Matthew', 24, 46)).toContain('Blessed is that servant, whom his lord when he cometh shall find so doing');
    expect(verse('2Peter', 1, 20)).toBe('Knowing this first, that no prophecy of the scripture is of any private interpretation.');
    expect(verse('Deuteronomy', 29, 29)).toContain('The secret things belong unto the LORD our God');
    expect(verse('2Timothy', 1, 7)).toBe('For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.');
    expect(verse('Proverbs', 1, 7)).toContain('The fear of the LORD is the beginning of knowledge');
    expect(verse('Titus', 2, 13)).toBe('Looking for that blessed hope, and the glorious appearing of the great God and our Saviour Jesus Christ;');
    expect(verse('1John', 3, 3)).toContain('every man that hath this hope in him purifieth himself, even as he is pure');
    expect(verse('1Thessalonians', 5, 6)).toContain('let us watch and be sober');
  });
});
