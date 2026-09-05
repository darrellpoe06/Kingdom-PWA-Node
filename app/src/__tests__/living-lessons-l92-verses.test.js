// =============================================================================
// L92 — Yahweh Standardized Love (obedience, deeds, thoughts, temple): verbatim KJV
// =============================================================================
// Darrell 2026-08-28 (spoken into the app): "Yahweh standardized Love... if you
// love Me Obey Me... deterministic logic... Judge by deeds... and those deeds
// are also thought to be thoughts that were not cast down... and studying that
// never occurred... what does it mean to be His Body and Church and or Council?
// Kingdom is everywhere and nowhere... inside of us as temples of Yahweh."
// Captured Word-first (the Spoken-Teachings rule + DR-0089). Every KJV line was
// FETCHED from the repo's own KJV this session; a drifted quote fails the build.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll92-yahweh-standardized-love-obedience-deeds-thoughts-and-the-temple-kingdom'");
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

// Fetched verbatim from app/public/bible/kjv (this session).
const KJV = {
  'John 14:15': 'If ye love me, keep my commandments.',
  '1 John 5:3': 'For this is the love of God, that we keep his commandments: and his commandments are not grievous.',
  'Luke 6:46': 'And why call ye me, Lord, Lord, and do not the things which I say?',
  'Matthew 7:21': 'Not every one that saith unto me, Lord, Lord, shall enter into the kingdom of heaven; but he that doeth the will of my Father which is in heaven.',
  '1 John 3:18': 'My little children, let us not love in word, neither in tongue; but in deed and in truth.',
  'Matthew 7:20': 'Wherefore by their fruits ye shall know them.',
  '2 Corinthians 10:5 (fragment)': 'bringing into captivity every thought to the obedience of Christ',
  'Matthew 15:19 (fragment)': 'out of the heart proceed evil thoughts',
  'Proverbs 23:7 (fragment)': 'as he thinketh in his heart, so is he',
  '2 Timothy 2:15': 'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.',
  'James 4:17': 'Therefore to him that knoweth to do good, and doeth it not, to him it is sin.',
  '1 Corinthians 12:27': 'Now ye are the body of Christ, and members in particular.',
  'Matthew 18:20': 'For where two or three are gathered together in my name, there am I in the midst of them.',
  'Acts 15:28 (fragment)': 'For it seemed good to the Holy Ghost, and to us',
  'Luke 17:21': 'Neither shall they say, Lo here! or, lo there! for, behold, the kingdom of God is within you.',
  'John 18:36 (fragment)': 'My kingdom is not of this world',
};

const QUOTED_FRAGMENTS = [
  'If ye love me, keep my commandments.',
  'He that hath my commandments, and keepeth them, he it is that loveth me',
  'If a man love me, he will keep my words',
  'For this is the love of God, that we keep his commandments: and his commandments are not grievous.',
  'And why call ye me, Lord, Lord, and do not the things which I say?',
  'Not every one that saith unto me, Lord, Lord, shall enter into the kingdom of heaven; but he that doeth the will of my Father which is in heaven.',
  'so faith without works is dead also.',
  'let us not love in word, neither in tongue; but in deed and in truth.',
  'he shall reward every man according to his works',
  'render to every man according to his deeds',
  'by their fruits ye shall know them.',
  'the dead were judged out of those things which were written in the books, according to their works.',
  'Casting down imaginations, and every high thing that exalteth itself against the knowledge of God, and bringing into captivity every thought to the obedience of Christ',
  'hath committed adultery with her already in his heart',
  'out of the heart proceed evil thoughts, murders, adulteries',
  'as he thinketh in his heart, so is he',
  'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.',
  'to him that knoweth to do good, and doeth it not, to him it is sin.',
  'My people are destroyed for lack of knowledge',
  'be ye transformed by the renewing of your mind',
  'Now ye are the body of Christ, and members in particular.',
  'one body in Christ, and every one members one of another.',
  'he is the head of the body, the church',
  'upon this rock I will build my church; and the gates of hell shall not prevail against it.',
  'where two or three are gathered together in my name, there am I in the midst of them',
  'For it seemed good to the Holy Ghost, and to us',
  'fellowcitizens with the saints, and of the household of God',
  'The kingdom of God cometh not with observation',
  'the kingdom of God is within you',
  'My kingdom is not of this world',
  'righteousness, and peace, and joy in the Holy Ghost.',
  'ye are the temple of God, and that the Spirit of God dwelleth in you',
  'your body is the temple of the Holy Ghost which is in you',
  'lively stones, are built up a spiritual house',
  'an habitation of God through the Spirit.',
];

describe('L92 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'John 14:15; 2 Corinthians 10:5; Luke 17:21'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the spoken spine, in order (love standardized → deeds → thoughts → study → Body → Kingdom → temple)', () => {
    expect(l).toContain('YAHWEH STANDARDIZED LOVE');
    expect(l).toContain('DETERMINISTIC'); // Darrell's frame: if-then
    expect(l).toContain('THE DEEDS INCLUDE THE THOUGHTS NOT CAST DOWN');
    expect(l).toContain('THE STUDY THAT NEVER OCCURRED');
    expect(l).toContain('everywhere and nowhere');
    expect(l).toContain('temples of Yahweh');
    const order = [
      '1) THE DETERMINISTIC LOGIC',
      '2) JUDGED BY DEEDS',
      '3) AND THE DEEDS INCLUDE THE THOUGHTS NOT CAST DOWN',
      '4) AND THE STUDY THAT NEVER OCCURRED',
      '5) THIS OBEDIENT LIFE IS A MEMBER OF HIS BODY',
      '6) THE CHURCH, AND THE COUNCIL',
      '7) THE KINGDOM',
      '8) BECAUSE IT LIVES INSIDE US',
      '9) SO THE STANDARD REACHES ALL THE WAY IN',
      '10) THE WHOLE OF IT',
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
  it('child, teen, and senior each carry the obedience-standard, the Kingdom-within, and the temple', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the obedience standard`).toContain('If ye love me, keep my commandments');
      expect(t, `${band} carries the Kingdom-within`).toContain('the kingdom of God is within you');
      expect(t, `${band} carries the temple`).toContain('ye are the temple of God');
    }
    // teen and senior additionally carry the thoughts-captive hinge.
    for (const band of ['teen', 'senior']) {
      expect(level(band)).toContain('every thought');
      expect(level(band)).toContain('obedience of Christ');
    }
  });
});

describe('tamper-catch — the pinned KJV ground truth is itself exact', () => {
  it('full-verse pins match their known text and endings', () => {
    expect(KJV['John 14:15']).toBe('If ye love me, keep my commandments.');
    expect(KJV['Luke 6:46'].endsWith('the things which I say?')).toBe(true);
    expect(KJV['1 John 5:3']).toContain('his commandments are not grievous');
    expect(KJV['1 Corinthians 12:27']).toBe('Now ye are the body of Christ, and members in particular.');
    expect(KJV['Luke 17:21']).toContain('the kingdom of God is within you');
    expect(KJV['2 Corinthians 10:5 (fragment)']).toContain('captivity every thought');
  });
});
