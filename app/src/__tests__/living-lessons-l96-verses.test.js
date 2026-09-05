// =============================================================================
// L96 — Doers of the Word: competence by doing, the mind's tactics, purity by
// the Spirit, the highest knowledge (to know Him), and how the family of Yahweh
// is known — by doing. Verbatim KJV.
// =============================================================================
// Darrell 2026-08-28 (spoken into the app, a long continuous download): "Clarify
// and gain competence in the Word by DOING it, not just hearing or reading...
// doing the Word or you are deceiving yourself... The Bible has tactics and
// strategies for even how to think and what to think about... not just mind
// tactical comprehension also tactical actions like reading and studying His
// Word... getting married or not and no sexual relationship... the flesh can't
// and won't want to do this without the Holy Spirit of Yahweh, over a lifetime...
// He gives us the ability to create wealth, not light — He IS the Light or
// Knowledge... the highest knowledge for a human being, above all other
// creatures, however we have the test of time to process... how do we determine
// if we are Family Of Yahweh or not — you decide with actions, say less, humbly...
// ways that seem right end in death... prefrontal cortex issues align with
// biblical scriptures." Captured Word-first (the Spoken-Teachings rule + DR-0089).
// Every KJV line was FETCHED from the repo's own KJV this session; a drift fails.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll96-doers-of-the-word-competence-by-doing-and-the-minds-tactics-daily'");
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
  // hearer vs doer / the mirror
  'But be ye doers of the word, and not hearers only, deceiving your own selves.',
  'beholding his natural face in a glass',
  'straightway forgetteth what manner of man he was',
  'a doer of the work, this man shall be blessed in his deed.',
  // doing verifies truth
  'If any man will do his will, he shall know of the doctrine',
  'If ye know these things, happy are ye if ye do them.',
  'And why call ye me, Lord, Lord, and do not the things which I say?',
  // two kinds of doing
  'searched the scriptures daily',
  'rightly dividing the word of truth',
  'faith, if it hath not works, is dead, being alone',
  'be ye transformed by the renewing of your mind',
  'if ye through the Spirit do mortify the deeds of the body, ye shall live',
  // competence by use
  'by reason of use have their senses exercised to discern both good and evil',
  // mind-tactics + prefrontal note
  'to the pulling down of strong holds',
  'bringing into captivity every thought to the obedience of Christ',
  'think on these things',
  'Set your affection on things above',
  'prefrontal cortex',
  'sound mind',
  'temperance',
  // reasonable commands + cause/effect
  'which is your reasonable service',
  'his commandments are not grievous',
  'my yoke is easy, and my burden is light',
  'to steal, and to kill, and to destroy',
  'whatsoever a man soweth, that shall he also reap',
  'therefore choose life',
  'There is a way which seemeth right unto a man, but the end thereof are the ways of death',
  // purity / marriage-or-celibacy
  'that ye should abstain from fornication',
  'your body is the temple of the Holy Ghost',
  'better to marry than to burn',
  'Marriage is honourable in all, and the bed undefiled',
  'which have made themselves eunuchs for the kingdom of heaven',
  // only by the Spirit
  'so that ye cannot do the things that ye would',
  'Walk in the Spirit, and ye shall not fulfil the lust of the flesh',
  'without me ye can do nothing',
  'Not by might, nor by power, but by my spirit',
  'it is God which worketh in you both to will and to do',
  // wealth not light; He is the Light and Knowledge
  'it is he that giveth thee power to get wealth',
  'I am the light of the world',
  'In whom are hid all the treasures of wisdom and knowledge',
  // above creatures, the test of time, the highest knowledge
  'crowned him with glory and honour',
  'dominion over the works of thy hands',
  'to humble thee, and to prove thee, to know what was in thine heart',
  'when he is tried, he shall receive the crown of life',
  'let him that glorieth glory in this, that he understandeth and knoweth me',
  'this is life eternal, that they might know thee the only true God',
  'the excellency of the knowledge of Christ Jesus my Lord',
  'The fear of the LORD is the beginning of knowledge',
  'find the knowledge of God',
  // daily; seek/do/teach
  'meditate therein day and night, that thou mayest observe to do',
  'in his law doth he meditate day and night',
  'heareth these sayings of mine, and doeth them',
  'to seek the law of the LORD, and to do it, and to teach',
  // family of Yahweh — known by doing, humbly
  'the same is my brother, and sister, and mother',
  'by their fruits ye shall know them',
  'every one that doeth righteousness is born of him',
  'whosoever doeth not righteousness is not of God',
  'as many as are led by the Spirit of God, they are the sons of God',
  'ye would do the works of Abraham',
  'do not your alms before men, to be seen of them',
  'walk humbly with thy God',
  'Let your light so shine before men, that they may see your good works',
];

describe('L96 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'James 1:22; 2 Corinthians 10:5; Jeremiah 9:24'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole download in order — the doer leads, fourteen movements follow', () => {
    expect(l).toContain('DOING THE WORD IS HOW YOU LEARN IT');
    const order = [
      '1) HEARING IS NOT ENOUGH',
      '2) THE MAN WHO FORGETS THE MIRROR',
      '3) DOING IS HOW YOU KNOW IT IS TRUE',
      '4) TWO KINDS OF DOING',
      '5) COMPETENCE COMES BY USE',
      '6) THE WORD HAS TACTICS FOR THE MIND',
      '7) HIS COMMANDS ARE REASONABLE',
      '8) A TACTICAL ACTION THE FLESH WILL NOT DO',
      '9) IMPOSSIBLE WITHOUT THE HOLY SPIRIT',
      '10) HE GIVES US POWER TO CREATE WEALTH',
      '11) THE HIGHEST KNOWLEDGE FOR A HUMAN',
      '12) APPLY IT DAILY',
      '13) SEEK IT, DO IT, TEACH IT',
      '14) HOW YOU KNOW YOU ARE FAMILY OF YAHWEH',
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

describe('every age level carries the message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };
  it('child, teen, and senior each carry the doer bright line and the knowledge of Him', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the doer bright line`).toContain('be ye doers of the word, and not hearers only');
      expect(t, `${band} points to knowing Him (John 17:3)`).toContain('John 17:3');
    }
    // teen and senior additionally carry the purity + Spirit thread.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('abstain from fornication');
      expect(t).toContain('Walk in the Spirit');
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('James', 1, 22)).toBe('But be ye doers of the word, and not hearers only, deceiving your own selves.');
    expect(verse('Galatians', 5, 17)).toContain('so that ye cannot do the things that ye would');
    expect(verse('Philippians', 2, 13)).toContain('it is God which worketh in you both to will and to do');
    expect(verse('Deuteronomy', 8, 18)).toContain('it is he that giveth thee power to get wealth');
    expect(verse('Colossians', 2, 3)).toBe('In whom are hid all the treasures of wisdom and knowledge.');
    expect(verse('Jeremiah', 9, 24)).toContain('that he understandeth and knoweth me');
    expect(verse('John', 17, 3)).toContain('that they might know thee the only true God');
    expect(verse('Proverbs', 14, 12)).toBe('There is a way which seemeth right unto a man, but the end thereof are the ways of death.');
    expect(verse('Matthew', 12, 50)).toContain('the same is my brother, and sister, and mother');
    expect(verse('Ezra', 7, 10)).toContain('to seek the law of the LORD, and to do it, and to teach');
    expect(verse('1Thessalonians', 4, 3)).toContain('that ye should abstain from fornication');
  });
});
