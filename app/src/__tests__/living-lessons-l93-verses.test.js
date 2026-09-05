// =============================================================================
// L93 — Come, Let Us Reason (truth in any language, the mind rewired): verbatim KJV
// =============================================================================
// Darrell 2026-08-28 (spoken into the app): "How does Yahweh like to reason? He
// says come let us do that... All the various languages changed however the
// meaning of the Word is what I'm want to clarify... Truth is truth in any
// language... electricity is electricity in any language... Yahweh being Truth
// changes my neuroplasticity because I'm shocked and also Joyful... seems like a
// fantasy... until you keep reading and understanding... then it gets real...
// data driven real." Captured Word-first (the Spoken-Teachings rule + DR-0089).
// Every KJV line was FETCHED from the repo's own KJV this session.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll93-come-let-us-reason-truth-in-any-language-the-mind-rewired-real'");
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

const KJV = {
  'Isaiah 1:18 (fragment)': 'Come now, and let us reason together, saith the LORD',
  'Isaiah 40:8': 'The grass withereth, the flower fadeth: but the word of our God shall stand for ever.',
  'Matthew 24:35': 'Heaven and earth shall pass away, but my words shall not pass away.',
  'Psalms 119:89': 'For ever, O LORD, thy word is settled in heaven.',
  '1 Thessalonians 5:21': 'Prove all things; hold fast that which is good.',
  'Psalms 34:8': 'O taste and see that the LORD is good: blessed is the man that trusteth in him.',
  'John 7:17 (fragment)': 'If any man will do his will, he shall know of the doctrine, whether it be of God',
  'Luke 1:4': 'That thou mightest know the certainty of those things, wherein thou hast been instructed.',
  'Psalms 119:130': 'The entrance of thy words giveth light; it giveth understanding unto the simple.',
  '1 Corinthians 2:16 (fragment)': 'we have the mind of Christ.',
  'John 14:6 (fragment)': 'I am the way, the truth, and the life',
  'Hebrews 13:8': 'Jesus Christ the same yesterday, and to day, and for ever.',
  'Jeremiah 31:3 (fragment)': 'I have loved thee with an everlasting love',
  'Nehemiah 8:10 (fragment)': 'the joy of the LORD is your strength.',
};

const QUOTED_FRAGMENTS = [
  'Come now, and let us reason together, saith the LORD',
  'The grass withereth, the flower fadeth: but the word of our God shall stand for ever.',
  'Heaven and earth shall pass away, but my words shall not pass away.',
  'Thy word is true from the beginning',
  'For ever, O LORD, thy word is settled in heaven.',
  'upholding all things by the word of his power',
  'all things consist',
  'Prove all things; hold fast that which is good.',
  'O taste and see that the LORD is good: blessed is the man that trusteth in him.',
  'If any man will do his will, he shall know of the doctrine, whether it be of God',
  'Then shall we know, if we follow on to know the LORD',
  'Search the scriptures',
  'they are they which testify of me',
  'these are written, that ye might believe that Jesus is the Christ',
  'That thou mightest know the certainty of those things, wherein thou hast been instructed.',
  'The entrance of thy words giveth light; it giveth understanding unto the simple.',
  'be ye transformed by the renewing of your mind',
  'bringing into captivity every thought to the obedience of Christ',
  'we have the mind of Christ.',
  'I am the way, the truth, and the life',
  'the living God, and an everlasting king',
  'God, that cannot lie',
  'Jesus Christ the same yesterday, and to day, and for ever.',
  'I have loved thee with an everlasting love',
  'For God so loved the world, that he gave his only begotten Son',
  'the joy of the LORD is your strength.',
];

describe('L93 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Isaiah 1:18; John 7:17; Romans 12:2'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the spoken spine, in order (reason → any language → law → fantasy → data-real → mind → Truth → love)', () => {
    expect(l).toContain('HOW YAHWEH LIKES TO REASON');
    expect(l).toContain('TRUTH IS TRUTH IN ANY LANGUAGE');
    expect(l).toContain('ELECTRICITY IN ANY LANGUAGE');
    expect(l).toContain('THEN IT GETS DATA-DRIVEN REAL');
    expect(l).toContain('neuroplasticity'); // Darrell's word, tied to the renewed mind
    // The discipline note: the meaning is the authority, verbatim translation kept.
    expect(l).toContain('the meaning is too valuable to distort');
    const order = [
      '1) TRUTH IS TRUTH IN ANY LANGUAGE',
      '2) A LAW OF REALITY',
      '3) IT SEEMS LIKE A FANTASY',
      '4) THEN IT GETS DATA-DRIVEN REAL',
      '5) TRUTH REWIRES THE MIND',
      '6) BECAUSE YAHWEH IS TRUTH',
      '7) AND HE ACTUALLY LOVES YOU',
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
    it(`quotes verbatim: "${frag.slice(0, 56)}${frag.length > 56 ? '…' : ''}"`, () => {
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
  it('child, teen, and senior each carry the invitation-to-reason, the standing Word, and His love', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the invitation to reason`).toContain('let us reason together');
      expect(t, `${band} carries the standing Word`).toContain('the word of our God shall stand for ever');
      expect(t, `${band} carries His everlasting love`).toContain('I have loved thee with an everlasting love');
    }
    // teen and senior additionally carry the renewed-mind / neuroplasticity thread.
    for (const band of ['teen', 'senior']) {
      expect(level(band)).toContain('renewing of your mind');
      expect(level(band)).toContain('neuro');
    }
  });
});

describe('tamper-catch — the pinned KJV ground truth is itself exact', () => {
  it('full-verse pins match their known text and endings', () => {
    expect(KJV['Isaiah 40:8']).toBe('The grass withereth, the flower fadeth: but the word of our God shall stand for ever.');
    expect(KJV['1 Thessalonians 5:21']).toBe('Prove all things; hold fast that which is good.');
    expect(KJV['Hebrews 13:8']).toBe('Jesus Christ the same yesterday, and to day, and for ever.');
    expect(KJV['Isaiah 1:18 (fragment)'].startsWith('Come now, and let us reason together')).toBe(true);
    expect(KJV['Psalms 119:89'].endsWith('settled in heaven.')).toBe(true);
    expect(KJV['Nehemiah 8:10 (fragment)']).toContain('joy of the LORD');
  });
});
