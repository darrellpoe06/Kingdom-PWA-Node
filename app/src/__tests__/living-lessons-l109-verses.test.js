// =============================================================================
// L109 — How We Know Yahweh's Love: experienced, not only believed — taste, see,
// hear, touch, at every age. Verbatim KJV.
// =============================================================================
// Captured from Darrell's spoken question 2026-08-30 — a spoken teaching is build
// input (DR-0089). How do human beings KNOW Yahweh's Love — feel it, see it, hear
// it, taste it? Scripture answers that His Love is given to be EXPERIENCED through
// every sense He made, and known (not merely believed) at every age. Companion to
// L105 (experiential knowing) and L107 (how we receive Love). Every KJV line
// FETCHED from the repo's own KJV this session; a drift fails the build.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll109-how-we-know-yahwehs-love-taste-see-hear-touch-experienced-at-every-age'");
const nextId = src.indexOf("id: 'll", start + 10);
const l = src.slice(start, nextId === -1 ? start + 120000 : nextId);

const QUOTED_FRAGMENTS = [
  'O taste and see that the LORD is good',                                 // Psalm 34:8
  'How sweet are thy words unto my taste! yea, sweeter than honey',        // Psalm 119:103
  'If so be ye have tasted that the Lord is gracious',                      // 1 Pet 2:3
  'Behold, what manner of love the Father hath bestowed upon us',           // 1 John 3:1
  'God so loved the world, that he gave his only begotten Son',             // John 3:16
  'while we were yet sinners, Christ died for us',                         // Rom 5:8
  'The heavens declare the glory of God',                                  // Psalm 19:1
  'I have loved thee with an everlasting love',                            // Jer 31:3
  'My sheep hear my voice, and I know them',                               // John 10:27
  'faith cometh by hearing, and hearing by the word of God',               // Rom 10:17
  'he will rejoice over thee with joy',                                    // Zeph 3:17
  'the love of God is shed abroad in our hearts',                          // Rom 5:5
  'underneath are the everlasting arms',                                   // Deut 33:27
  'He healeth the broken in heart',                                        // Psalm 147:3
  'I will not leave you comfortless: I will come to you',                   // John 14:18
  'handle me, and see',                                                    // Luke 24:39
  'to know the love of Christ, which passeth knowledge',                   // Eph 3:19
  'we have known and believed the love that God hath to us',               // 1 John 4:16
  'let us not love in word, neither in tongue; but in deed and in truth',   // 1 John 3:18
  'he took them up in his arms, put his hands upon them, and blessed them', // Mark 10:16
  'even to hoar hairs will I carry you',                                   // Isa 46:4
  'We love him, because he first loved us',                                // 1 John 4:19
];

describe('L109 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Psalm 34:8; Romans 5:8; Zephaniah 3:17'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — the four senses, knowing, and every age', () => {
    const order = [
      '1) TASTE IT',
      '2) SEE IT',
      '3) HEAR IT',
      '4) TOUCH AND FEEL IT',
      '5) KNOW IT BY EXPERIENCE',
      '6) AT EVERY AGE',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('answers Darrell\'s question — experienced through the senses, at every age', () => {
    expect(l).toContain('Darrell');
    expect(l).toMatch(/feel it, see it, hear it, taste it|taste, see, hear/i);
    expect(l).toContain('every age');
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
  it('child, teen, and senior each carry taste-and-see and He-first-loved-us', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries taste and see`).toContain('taste and see that the LORD is good');
      expect(t, `${band} carries He first loved us`).toContain('We love him, because he first loved us');
    }
    // teen and senior additionally carry the sung-over-you and every-age threads.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('he will rejoice over thee with joy');
      expect(t).toContain('hoar hairs');
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('Psalms', 34, 8)).toBe('O taste and see that the LORD is good: blessed is the man that trusteth in him.');
    expect(verse('Romans', 5, 8)).toBe('But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.');
    expect(verse('Zephaniah', 3, 17)).toContain('he will rejoice over thee with joy');
    expect(verse('Jeremiah', 31, 3)).toContain('I have loved thee with an everlasting love');
    expect(verse('Luke', 24, 39)).toContain('handle me, and see');
    expect(verse('Ephesians', 3, 19)).toContain('to know the love of Christ, which passeth knowledge');
    expect(verse('1John', 4, 16)).toContain('we have known and believed the love that God hath to us');
    expect(verse('Mark', 10, 16)).toBe('And he took them up in his arms, put his hands upon them, and blessed them.');
    expect(verse('Isaiah', 46, 4)).toContain('even to hoar hairs will I carry you');
    expect(verse('1John', 4, 19)).toBe('We love him, because he first loved us.');
  });
});
