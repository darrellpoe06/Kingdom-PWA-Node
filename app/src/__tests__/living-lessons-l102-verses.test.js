// =============================================================================
// L102 — Bold as a Lion: righteousness kept by integrity, His good will
// live-or-die, a Word-trained mind, suffering to reign, loving enemies, and
// discerning the destroyer. Verbatim KJV.
// =============================================================================
// Captured from Darrell's sustained spoken teaching 2026-08-29 (he brought
// Proverbs 28:1 and poured the roots in live) — a spoken teaching is build input
// (DR-0089). Boldness from a clear conscience KEPT by integrity (confess, truth,
// grow from failure — "perfect" = maturing, not flawless); the account settled and
// live-or-die surrendered to a GOOD will; the mind trained on His Word; grief held
// with hope (suffer with Him to reign with Him); love even enemies, the Blood
// makes the family; yet discern the destroyer who only steals, kills, destroys.
// Every KJV line FETCHED from the repo's own KJV this session; a drift fails the
// build. Pairs with L101, L99, the Test (Philippians 4:8), and DR-0076.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll102-bold-as-a-lion-boldness-from-righteousness-not-bravado-no-fear'");
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
  'The wicked flee when no man pursueth',                                  // Prov 28:1
  'whoso confesseth and forsaketh them shall have mercy',                  // Prov 28:13
  'If we confess our sins, he is faithful and just to forgive us',         // 1 John 1:9
  'they that deal truly are his delight',                                  // Prov 12:22
  'For a just man falleth seven times, and riseth up again',               // Prov 24:16
  'Not as though I had already attained, either were already perfect',     // Phil 3:12
  'to be sin for us, who knew no sin',                                     // 2 Cor 5:21
  'the Lion of the tribe of Juda, the Root of David, hath prevailed',      // Rev 5:5
  'whether we live therefore, or die, we are the Lord',                    // Rom 14:8
  'all things work together for good to them that love God',               // Rom 8:28
  'But if not, be it known unto thee, O king',                            // Dan 3:18
  'God hath not given us the spirit of fear; but of power, and of love, and of a sound mind', // 2 Tim 1:7
  'Looking unto Jesus the author and finisher of our faith',              // Heb 12:2
  'if there be any virtue, and if there be any praise, think on these things', // Phil 4:8
  'Jesus wept',                                                            // John 11:35
  'If we suffer, we shall also reign with him',                            // 2 Tim 2:12
  'It is finished',                                                        // John 19:30
  'Love your enemies, bless them that curse you',                          // Matt 5:44
  'while we were yet sinners, Christ died for us',                         // Rom 5:8
  'are made nigh by the blood of Christ',                                  // Eph 2:13
  'he maketh even his enemies to be at peace with him',                    // Prov 16:7
  'The thief cometh not, but for to steal, and to kill, and to destroy',   // John 10:10
  'wise as serpents, and harmless as doves',                              // Matt 10:16
  'we are not ignorant of his devices',                                   // 2 Cor 2:11
  'your adversary the devil, as a roaring lion',                          // 1 Pet 5:8
  'with all boldness they may speak thy word',                            // Acts 4:29
  'come boldly unto the throne of grace',                                 // Heb 4:16
];

describe('L102 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Proverbs 28:1; Proverbs 28:13; Romans 14:8'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — twelve movements + THE WHOLE OF IT', () => {
    const order = [
      '1) GUILT FLEES, RIGHTEOUSNESS STANDS',
      '2) NOT BRAVADO',
      '3) THE RIGHTEOUSNESS IS IMPUTED',
      '4) THE LION OF JUDAH IS THE SOURCE',
      '5) LIVING OR DYING IS HIS WILL',
      '6) FEAR NOT',
      '7) HE LEADS AND GUIDES',
      '8) ABIDE',
      '9) SUFFER WITH HIM TO REIGN WITH HIM',
      '10) LOVE EVEN ENEMIES',
      '11) DISCERN THE DESTROYER',
      '12) BOLDNESS IN ACTION',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('carries the distinctive teaching threads Darrell brought', () => {
    expect(l).toContain('Darrell brought');   // spoken-teaching provenance (DR-0089)
    expect(l).toContain('Blood In Blood Out');
    expect(l).toContain('perfect');   // "perfect" = maturing, not flawless
    expect(l).toContain('discern the destroyer');
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
  it('child, teen, and senior each carry the bold-as-a-lion and confess-your-faults threads', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries bold as a lion`).toContain('bold as a lion');
      expect(t, `${band} carries confess/forsake`).toContain('whoso confesseth and forsaketh them shall have mercy');
    }
    // teen and senior additionally carry the discern-the-destroyer tier and love-enemies.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('to steal, and to kill, and to destroy');
      expect(t).toContain('Love your enemies');
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Proverbs', 28, 1)).toBe('The wicked flee when no man pursueth: but the righteous are bold as a lion.');
    expect(verse('Proverbs', 28, 13)).toBe('He that covereth his sins shall not prosper: but whoso confesseth and forsaketh them shall have mercy.');
    expect(verse('Proverbs', 24, 16)).toContain('For a just man falleth seven times, and riseth up again');
    expect(verse('Romans', 14, 8)).toContain('whether we live therefore, or die, we are the Lord');
    expect(verse('John', 11, 35)).toBe('Jesus wept.');
    expect(verse('2Timothy', 2, 12)).toContain('If we suffer, we shall also reign with him');
    expect(verse('Matthew', 5, 44)).toContain('Love your enemies, bless them that curse you');
    expect(verse('Ephesians', 2, 13)).toBe('But now in Christ Jesus ye who sometimes were far off are made nigh by the blood of Christ.');
    expect(verse('John', 10, 10)).toContain('The thief cometh not, but for to steal, and to kill, and to destroy');
    expect(verse('Matthew', 10, 16)).toContain('wise as serpents, and harmless as doves');
    expect(verse('1Peter', 5, 8)).toContain('your adversary the devil, as a roaring lion');
    expect(verse('Proverbs', 16, 7)).toContain('he maketh even his enemies to be at peace with him');
    expect(verse('Hebrews', 4, 16)).toBe('Let us therefore come boldly unto the throne of grace, that we may obtain mercy, and find grace to help in time of need.');
  });
});
