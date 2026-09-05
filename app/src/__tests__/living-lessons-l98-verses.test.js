// =============================================================================
// L98 — The Judge of All the Earth: equal justice, real partiality named, and a
// just weight for the numbers. Verbatim KJV.
// =============================================================================
// Darrell 2026-08-29 brought a sentencing-disparity reel (Willie D Live / Danny
// Collins) and said "research then lesson," asking specifically about the 19th
// Judicial Circuit and the statistics. Researched and held in two tiers
// (DR-0076/DR-0100): Tier 1 — the documented disparity is real and named as sin
// (USSC ~13-20%; the verified Legleitner/Lloyd case: same judge, same 138.2
// points, 26 years vs time served); Tier 2 — the "4.5-6.5x" overshoots the
// average, "only difference was race" omits the cited cooperation context,
// Danny Collins is the commentator, and #NolanWells is a separate case. Word
// first, non-partisan. Every KJV line FETCHED from the repo's own KJV this
// session — a drift fails the build (this catalog's KJV reads "honor," not
// "honour," in Leviticus 19:15; the lesson matches the corpus).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll98-the-just-judge-equal-justice-and-a-just-weight-for-the-numbers'");
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
  // the Just Judge
  'Shall not the Judge of all the earth do right?',
  'he shall judge the world in righteousness',
  'there is no respect of persons with God',
  // the law for every bench
  'thou shalt not respect the person of the poor, nor honor the person of the mighty',
  'ye shall hear the small as well as the great',
  'a gift doth blind the eyes of the wise',
  // partiality is sin, named
  'It is not good to have respect of persons in judgment',
  'He that justifieth the wicked, and he that condemneth the just, even they both are abomination to the LORD',
  'God is no respecter of persons',
  // a just weight for the numbers
  'He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him',
  'Prove all things; hold fast that which is good.',
  'Thou shalt not raise a false report',
  // plead the cause
  'Open thy mouth for the dumb in the cause of all such as are appointed to destruction',
  'plead the cause of the poor and needy',
  'seek judgment, relieve the oppressed',
  'Defend the poor and fatherless: do justice to the afflicted and needy',
  'let judgment run down as waters, and righteousness as a mighty stream',
  'to do justly, and to love mercy, and to walk humbly with thy God',
  // not vengeance, one blood
  'avenge not yourselves',
  'Be not overcome of evil, but overcome evil with good',
  'hath made of one blood all nations of men',
  'The heart is deceitful above all things',
  // the final court
  'he judgeth among the gods',
  'God shall bring every work into judgment, with every secret thing',
];

describe('L98 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Genesis 18:25; Leviticus 19:15; 1 Thessalonians 5:21'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — seven movements + THE WHOLE OF IT', () => {
    const order = [
      '1) GOD IS THE JUST JUDGE',
      '2) HIS LAW COMMANDS EQUAL JUSTICE',
      '3) WHERE PARTIALITY IS REAL, IT IS SIN',
      '4) A JUST WEIGHT FOR THE NUMBERS TOO',
      '5) PLEAD THE CAUSE',
      '6) NOT VENGEANCE',
      '7) THE FINAL COURT',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('holds BOTH tiers honestly (DR-0100) and carries provenance (DR-0076)', () => {
    expect(l).toContain('DR-0100');
    expect(l).toContain('DR-0076');
    // Tier 1 — the real, verified disparity named
    expect(l).toContain('138.2');
    expect(l).toContain("19th Judicial Circuit");
    expect(l).toContain('13-20%');
    // Tier 2 — the overstatement corrected, not the injustice denied
    expect(l).toContain('overshoots');
    expect(l).toContain('inflating a true injustice');
    expect(l).toContain('separate case');
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
  it('child, teen, and senior each carry the just Judge, no-respecter, and verify-claims threads', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the just Judge`).toContain('the Judge of all the earth');
      expect(t, `${band} carries prove/verify`).toMatch(/[Pp]rove all things|make sure it is TRUE/);
    }
    // teen and senior additionally carry the named partiality-as-sin AND the verified case.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('God is no respecter of persons');
      expect(t).toContain('138.2');
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Genesis', 18, 25)).toContain('Shall not the Judge of all the earth do right?');
    expect(verse('Romans', 2, 11)).toBe('For there is no respect of persons with God.');
    // the exact spelling this catalog carries — "honor," not "honour"
    expect(verse('Leviticus', 19, 15)).toContain('nor honor the person of the mighty');
    expect(verse('Proverbs', 17, 15)).toBe('He that justifieth the wicked, and he that condemneth the just, even they both are abomination to the LORD.');
    expect(verse('Amos', 5, 24)).toBe('But let judgment run down as waters, and righteousness as a mighty stream.');
    expect(verse('Acts', 17, 26)).toContain('hath made of one blood all nations of men');
    expect(verse('Psalms', 82, 1)).toContain('he judgeth among the gods');
    expect(verse('Ecclesiastes', 12, 14)).toContain('God shall bring every work into judgment');
    expect(verse('1Thessalonians', 5, 21)).toBe('Prove all things; hold fast that which is good.');
  });
});
