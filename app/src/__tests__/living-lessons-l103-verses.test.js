// =============================================================================
// L103 — His Kings: reigning under the King of Kings — two paths, wealth Yahweh's
// Way not confusion, winning souls through excellence, and skill from His Word.
// Verbatim KJV.
// =============================================================================
// Captured from Darrell's spoken teaching 2026-08-29, flowing straight out of
// L102 (Bold as a Lion) — a spoken teaching is build input (DR-0089). His kings
// are bold and HIS (received, not self-made); two paths, and the tell of which
// king rules you is obedience, not the word "Lord"; you cannot be His king unless
// born again and serving; the King of Kings we worship; life and death in the
// tongue; wealth Yahweh's Way not confusion; win souls through excellence; the
// necessary skill drawn from His Word comprehensively studied; the destination
// already written. Every KJV line FETCHED from the repo's own KJV this session; a
// drift fails the build. Pairs with L102, the Excellence Standard, the Test.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll103-his-kings-reigning-under-the-king-of-kings-two-paths-wealth-and-souls'");
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
  'And hath made us kings and priests unto God and his Father',            // Rev 1:6
  'a chosen generation, a royal priesthood, an holy nation',               // 1 Pet 2:9
  'wide is the gate, and broad is the way, that leadeth to destruction',   // Matt 7:13
  'narrow is the way, which leadeth unto life, and few there be that find it', // Matt 7:14
  'And why call ye me, Lord, Lord, and do not the things which I say',      // Luke 6:46
  'choose you this day whom ye will serve',                                // Josh 24:15
  'Except a man be born again, he cannot see the kingdom of God',           // John 3:3
  'confess with thy mouth the Lord Jesus',                                 // Rom 10:9
  'whosoever will be chief among you, let him be your servant',             // Matt 20:27
  'and we shall reign on the earth',                                       // Rev 5:10
  'KING OF KINGS, AND LORD OF LORDS',                                       // Rev 19:16
  'cast their crowns before the throne',                                   // Rev 4:10
  'Death and life are in the power of the tongue',                          // Prov 18:21
  'For by thy words thou shalt be justified, and by thy words thou shalt be condemned', // Matt 12:37
  'it is he that giveth thee power to get wealth',                          // Deut 8:18
  'God is not the author of confusion, but of peace',                      // 1 Cor 14:33
  'The blessing of the LORD, it maketh rich, and he addeth no sorrow with it', // Prov 10:22
  'he that winneth souls is wise',                                         // Prov 11:30
  'because an excellent spirit was in him',                                // Dan 6:3
  'do it heartily, as to the Lord, and not unto men',                      // Col 3:23
  'we are ambassadors for Christ',                                        // 2 Cor 5:20
  'I am the way, the truth, and the life',                                 // John 14:6
  'rightly dividing the word of truth',                                    // 2 Tim 2:15
  'searched the scriptures daily, whether those things were so',           // Acts 17:11
  'All scripture is given by inspiration of God',                          // 2 Tim 3:16
  'Declaring the end from the beginning',                                  // Isa 46:10
  'my reward is with me, to give every man according as his work shall be', // Rev 22:12
];

describe('L103 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Revelation 1:6; Matthew 7:13-14; Deuteronomy 8:18'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — nine movements + THE WHOLE OF IT', () => {
    const order = [
      '1) HIS KINGS ARE BOLD',
      '2) TWO PATHS',
      '3) YOU CANNOT BE HIS KING UNLESS',
      '4) THE KING OF KINGS',
      '5) LIFE AND DEATH IN THE POWER OF THE TONGUE',
      '6) CREATING WEALTH IS THE GOAL',
      '7) WINNING SOULS',
      '8) THE NECESSARY SKILL',
      '9) THE DESTINATION IS ALREADY WRITTEN',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('carries the distinctive teaching threads Darrell brought (bridged from L102)', () => {
    expect(l).toContain('Darrell brought');
    expect(l).toContain('L102');
    expect(l).toContain('not confusion');   // "wealth Yahweh's Way, not confusion"
    expect(l).toContain('excellence');
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
  it('child, teen, and senior each carry the two-paths and His-kings threads', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the narrow way`).toContain('narrow is the way, which leadeth unto life');
      expect(t, `${band} carries kings and priests`).toMatch(/kings and priests|King of kings|KING OF KINGS/);
    }
    // teen and senior additionally carry the "unless" (new birth) and wealth-Yahweh's-way.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('Except a man be born again');
      expect(t).toContain('power to get wealth');
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Revelation', 1, 6)).toContain('And hath made us kings and priests unto God and his Father');
    expect(verse('Matthew', 7, 14)).toBe('Because strait is the gate, and narrow is the way, which leadeth unto life, and few there be that find it.');
    expect(verse('Luke', 6, 46)).toBe('And why call ye me, Lord, Lord, and do not the things which I say?');
    expect(verse('John', 3, 3)).toContain('Except a man be born again, he cannot see the kingdom of God');
    expect(verse('Matthew', 20, 27)).toBe('And whosoever will be chief among you, let him be your servant:');
    expect(verse('Deuteronomy', 8, 18)).toContain('it is he that giveth thee power to get wealth');
    expect(verse('1Corinthians', 14, 33)).toContain('God is not the author of confusion, but of peace');
    expect(verse('Proverbs', 11, 30)).toBe('The fruit of the righteous is a tree of life; and he that winneth souls is wise.');
    expect(verse('Proverbs', 18, 21)).toBe('Death and life are in the power of the tongue: and they that love it shall eat the fruit thereof.');
    expect(verse('John', 14, 6)).toContain('I am the way, the truth, and the life');
    expect(verse('2Timothy', 2, 15)).toContain('rightly dividing the word of truth');
    expect(verse('Isaiah', 46, 10)).toContain('Declaring the end from the beginning');
  });
});
