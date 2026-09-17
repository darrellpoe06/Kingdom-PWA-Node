// =============================================================================
// L104 — Study Your Ways: how Yahweh weighs love — the deterministic standard,
// the two ways, and seeing them only through the Word. Verbatim KJV.
// =============================================================================
// Captured from Darrell's spoken teaching 2026-08-30 — a spoken teaching is build
// input (DR-0089). We study ourselves by our WAYS, not verbalization or feeling:
// Yahweh weighs the ways by a fixed standard He alone defines and cannot be lied
// to (the deterministic-algorithm frame, grounded in Scripture). Feelings are
// flesh and deceive; we confirm our own bias until the Word turns the mirror
// true; Yahweh — not a vote — defines good and evil, and only God is good; so
// examine your ways and see the pathways only through the Word. Every KJV line
// FETCHED from the repo's own KJV this session; a drift fails the build. Word-
// first, non-debating (DR-0098). Pairs with L102, L103, the Godhead Study.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll104-study-your-ways-how-yahweh-weighs-love-the-deterministic-standard-two-ways-and-the-word'");
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
  'If ye love me, keep my commandments',                                   // John 14:15
  'He that saith, I know him, and keepeth not his commandments, is a liar', // 1 John 2:4
  'let us not love in word, neither in tongue; but in deed and in truth',   // 1 John 3:18
  'All the ways of a man are clean in his own eyes; but the LORD weigheth the spirits', // Prov 16:2
  'Every way of a man is right in his own eyes: but the LORD pondereth the hearts', // Prov 21:2
  'I the LORD search the heart, I try the reins, even to give every man according to his ways', // Jer 17:10
  'For the work of a man shall he render unto him',                        // Job 34:11
  'God is not mocked: for whatsoever a man soweth, that shall he also reap', // Gal 6:7
  'all things are naked and opened unto the eyes of him',                  // Heb 4:13
  'that which is highly esteemed among men is abomination in the sight of God', // Luke 16:15
  'The heart is deceitful above all things, and desperately wicked',        // Jer 17:9
  'He that trusteth in his own heart is a fool',                           // Prov 28:26
  'But be ye doers of the word, and not hearers only, deceiving your own selves', // Jas 1:22
  'he is like unto a man beholding his natural face in a glass',            // Jas 1:23
  'a discerner of the thoughts and intents of the heart',                  // Heb 4:12
  'I thought on my ways, and turned my feet unto thy testimonies',          // Ps 119:59
  'I have set before you life and death, blessing and cursing',             // Deut 30:19
  'Woe unto them that call evil good, and good evil',                      // Isa 5:20
  'there is none good but one, that is, God',                              // Mark 10:18
  'There is a way which seemeth right unto a man, but the end thereof are the ways of death', // Prov 14:12
  'Examine yourselves, whether ye be in the faith; prove your own selves',   // 2 Cor 13:5
  'Let us search and try our ways, and turn again to the LORD',             // Lam 3:40
  'Consider your ways',                                                    // Hag 1:5/1:7
  'Search me, O God, and know my heart',                                  // Ps 139:23
  'and see if there be any wicked way in me',                              // Ps 139:24
  'Thy word is a lamp unto my feet, and a light unto my path',             // Ps 119:105
  'Sanctify them through thy truth: thy word is truth',                    // John 17:17
];

describe('L104 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'John 14:15; Proverbs 16:2; Psalm 119:105'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — eight movements + THE WHOLE OF IT', () => {
    const order = [
      '1) LOVE IS PROVEN BY WAYS, NOT WORDS ALONE',
      '2) YAHWEH WEIGHS THE WAYS',
      '3) YOU CANNOT LIE TO HIM',
      '4) FEELINGS ARE FLESH',
      '5) WE DECEIVE OURSELVES UNTIL THE WORD CORRECTS',
      '6) HE DEFINES GOOD AND EVIL',
      '7) SO EXAMINE YOUR OWN WAYS',
      '8) SEE THE WAYS ONLY THROUGH THE WORD',
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
    expect(l).toContain('Darrell brought');
    expect(l).toContain('deterministic');
    expect(l).toContain('DR-0098');   // teach the Word, do not debate it
    expect(l).toContain('verbaliz');  // "verbalization" — the ways vs. words distinction
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
  it('child, teen, and senior each carry love-by-ways and the Word-as-lamp threads', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries love = keep my commandments`).toContain('keep my commandments');
      expect(t, `${band} carries the Word as lamp`).toContain('a lamp unto my feet');
    }
    // teen and senior additionally carry the weighs-the-ways standard and only-God-is-good.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('the LORD weigheth the spirits');
      expect(t).toContain('there is none good but one, that is, God');
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('John', 14, 15)).toBe('If ye love me, keep my commandments.');
    expect(verse('1John', 2, 4)).toBe('He that saith, I know him, and keepeth not his commandments, is a liar, and the truth is not in him.');
    expect(verse('Proverbs', 16, 2)).toBe('All the ways of a man are clean in his own eyes; but the LORD weigheth the spirits.');
    expect(verse('Jeremiah', 17, 10)).toContain('to give every man according to his ways');
    expect(verse('Jeremiah', 17, 9)).toContain('The heart is deceitful above all things, and desperately wicked');
    expect(verse('Galatians', 6, 7)).toBe('Be not deceived; God is not mocked: for whatsoever a man soweth, that shall he also reap.');
    expect(verse('James', 1, 22)).toBe('But be ye doers of the word, and not hearers only, deceiving your own selves.');
    expect(verse('Mark', 10, 18)).toContain('there is none good but one, that is, God');
    expect(verse('Isaiah', 5, 20)).toContain('Woe unto them that call evil good, and good evil');
    expect(verse('Haggai', 1, 5)).toContain('Consider your ways');
    expect(verse('Psalms', 119, 105)).toBe('Thy word is a lamp unto my feet, and a light unto my path.');
    expect(verse('John', 17, 17)).toBe('Sanctify them through thy truth: thy word is truth.');
  });
});

// =============================================================================
// THE TWO CHECKS THIS GATE DID NOT HAVE (added 2026-09-17, DR-0418 pass)
// =============================================================================
// Carried from L111 down through L105 the same day. The module's quotations
// arrived clean; the voice check found the generic name in our own prose in
// SEVEN places — the most of any lesson in this pass — and the finding is
// worth naming precisely, because it was not carelessness. Six of them were
// our own PARAPHRASE of Mark 10:18 ("only God is good", "the standard of good
// is God Himself") in bigIdea, a quiz option and the facilitator notes. A
// paraphrase in our voice is our voice, so it now reads "only Yahweh is
// good", which says the same thing with the covenant name — which is the
// entire point of DR-0210. The QUOTED verse ("there is none good but one,
// that is, God") is untouched, and this gate holds both halves at once.
//
// The corpus is joined with each chapter's VERSES FLOWING (space-separated
// within a chapter), so a quotation of contiguous verses — Psalms 139:23-24
// is quoted whole here — is a true substring, while a phrase stitched from
// two chapters still is not.
const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const KJV_FLOW = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json'))) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;   // index.json is not a book
    for (const ch of j.chapters) all += `${ch.join(' ')}\n`;
  }
  return all;
})();

const quotedSpans = (text) => {
  const unescaped = text.replace(/\\'/g, "'");
  const at = [...unescaped.matchAll(/"/g)].map((m) => m.index);
  const out = [];
  for (let i = 0; i + 1 < at.length; i += 2) out.push(unescaped.slice(at[i] + 1, at[i + 1]));
  return { spans: out, balanced: at.length % 2 === 0 };
};

describe('NO in-quote alteration anywhere in the lesson — the whole-span gate', () => {
  it('the double quotes are balanced, so the spans below are real quotations', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span is verbatim KJV', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length, 'the lesson should carry a substantial body of quoted Scripture').toBeGreaterThan(150);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((x) => x.trim()).filter(Boolean)) {
        if (!KJV_FLOW.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('is PROVEN-TO-CATCH — plausible drifts of this lesson\'s own hinges are not the text', () => {
    expect(KJV_FLOW.includes('All the ways of a man are clean in his own eyes')).toBe(true);
    expect(KJV_FLOW.includes('All the ways of a man are right in his own eyes')).toBe(false);
    expect(KJV_FLOW.includes('there is none good but one, that is, God')).toBe(true);
    expect(KJV_FLOW.includes('there is none good but one, that is, Yahweh')).toBe(false);
    expect(KJV_FLOW.includes('I thought on my ways, and turned my feet unto thy testimonies')).toBe(true);
    expect(KJV_FLOW.includes('I thought on my ways, and turned my feet unto thy commandments')).toBe(false);
    expect(KJV_FLOW.includes('The heart is deceitful above all things, and desperately wicked')).toBe(true);
    expect(KJV_FLOW.includes('The heart is deceitful above all things, and desperately sick')).toBe(false);
  });
});

describe('our own voice says Yahweh; the quoted verse keeps its own words (DR-0210 + DR-0076)', () => {
  it('names Him by His covenant name in our prose, and leaves the quotation alone', () => {
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    // Our prose, including every paraphrase of Mark 10:18:
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(20);
    // And the BRIGHT LINE in the other direction: the KJV's own wording is
    // never "corrected" into the covenant name inside a quotation (DR-0076).
    expect(l).toContain('there is none good but one, that is, God');
    expect(l).not.toContain('there is none good but one, that is, Yahweh');
  });
});

describe('every band is the FULL message, in that age\'s own words (DR-0418)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };

  it('youth exists beside the other three, and none is a summary', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(level(band).length, `${band} is missing or a stub`).toBeGreaterThan(1600);
    }
  });

  it('every band carries all eight movements, not a subset', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} proves love by keeping`).toContain('If ye love me, keep my commandments');
      expect(t, `${band} forbids word-only love`).toContain('not love in word, neither in tongue');
      expect(t, `${band} carries clean-in-his-own-eyes`).toContain('clean in his own eyes');
      expect(t, `${band} carries rendering according to ways`).toContain('according to the fruit of his doings');
      expect(t, `${band} says you cannot mock Him`).toContain('whatsoever a man soweth, that shall he also reap');
      expect(t, `${band} names the feelings as the bent instrument`).toContain('The heart is deceitful above all things');
      expect(t, `${band} carries the mirror that does not lie`).toContain('deceiving your own selves');
      expect(t, `${band} carries thought-on-ways-then-turned-feet`).toContain('I thought on my ways, and turned my feet');
      expect(t, `${band} leaves the definition of good to Him`).toContain('there is none good but one');
      expect(t, `${band} aims the audit inward`).toContain('prove your own selves');
      expect(t, `${band} hands the search over`).toContain('Search me, O God, and know my heart');
      expect(t, `${band} reads the path by His lamp`).toContain('Thy word is a lamp unto my feet');
    }
  });

  it('the senior band is a senior READER\'s lesson, not the facilitator\'s notes', () => {
    // It was the notes: "Teach this as the platform's core self-examination -
    // Word-first and deterministic (DR-0098; pairs with the Godhead Study,
    // L102 integrity...)". Those belong in `facilitator`.
    const senior = level('senior');
    expect(senior).not.toContain('Teach this as the platform');
    expect(senior).not.toMatch(/\bDR-\d{4}\b/);
    expect(senior).not.toMatch(/\bL10[0-9]\b/);
    expect(l, 'the facilitator notes must still exist somewhere').toContain('talkingPoints');
  });
});
