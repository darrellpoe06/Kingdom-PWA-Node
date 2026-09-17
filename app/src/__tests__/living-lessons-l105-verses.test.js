// =============================================================================
// L105 — Doing the Word Rewires You: daily intake, the heart as the deep layer,
// and why experiential knowing surpasses theory. Verbatim KJV.
// =============================================================================
// Captured from Darrell's spoken questions 2026-08-30 (companion to L104) — a
// spoken teaching is build input (DR-0089). Daily, attentive intake of the Word
// is written into the deep "heart" (the below-conscious operating center) and
// renews the mind; but reading is not doing — only the DOER is built on rock, and
// doing yields an experiential knowing theory cannot. The neuroscience is held in
// two honest tiers (DR-0100/DR-0076): the documented mechanisms (attention,
// neuroplasticity, declarative vs procedural memory automating from conscious to
// deep — Hebrews 5:14's "senses exercised by use") are stated plainly, while
// Bible-specific neurochemistry is explicitly NOT fabricated. Every KJV line
// FETCHED from the repo's own KJV this session; a drift fails the build.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll105-doing-the-word-rewires-you-daily-intake-the-deep-heart-and-experiential-over-theoretical'");
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
  'searched the scriptures daily, whether those things were so',            // Acts 17:11
  'My son, attend to my words; incline thine ear unto my sayings',          // Prov 4:20
  'keep them in the midst of thine heart',                                 // Prov 4:21
  'give the more earnest heed to the things which we have heard',           // Heb 2:1
  'Thy word have I hid in mine heart, that I might not sin against thee',    // Ps 119:11
  'For as he thinketh in his heart, so is he',                             // Prov 23:7
  'of the abundance of the heart his mouth speaketh',                      // Luke 6:45
  'Keep thy heart with all diligence; for out of it are the issues of life', // Prov 4:23
  'transformed by the renewing of your mind',                              // Rom 12:2
  'which effectually worketh also in you that believe',                    // 1 Thess 2:13
  'a discerner of the thoughts and intents of the heart',                  // Heb 4:12
  'it shall not return unto me void',                                      // Isa 55:11
  'But be ye doers of the word, and not hearers only, deceiving your own selves', // Jas 1:22
  'and doeth them, I will liken him unto a wise man, which built his house upon a rock', // Matt 7:24
  'If ye know these things, happy are ye if ye do them',                    // John 13:17
  'If any man will do his will, he shall know of the doctrine',             // John 7:17
  'O taste and see that the LORD is good',                                 // Ps 34:8
  'by reason of use have their senses exercised to discern both good and evil', // Heb 5:14
  'I understand more than the ancients, because I keep thy precepts',       // Ps 119:100
  'That I may know him, and the power of his resurrection',                 // Phil 3:10
  'thou shalt meditate therein day and night, that thou mayest observe to do', // Josh 1:8
  'a doer of the work, this man shall be blessed in his deed',              // Jas 1:25
];

describe('L105 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of ['bigIdea:', 'inApp:', "ref: 'James 1:22; John 7:17; Joshua 1:8'", 'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(l).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
  });

  it('teaches the whole arc in order — seven movements + THE WHOLE OF IT', () => {
    const order = [
      '1) TAKE IT IN DAILY, WITH ATTENTION',
      '2) HIDE IT IN THE HEART',
      '3) IT RENEWS THE MIND',
      '4) READING IS NOT DOING',
      '5) DOING PRODUCES A KNOWING THAT READING CANNOT',
      '6) THE CREATED-DESIGN ECHO',
      '7) SO BUILD THE WAY',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('holds the neuroscience two tiers honestly (DR-0100/DR-0076) — states the documented, refuses the fabricated', () => {
    expect(l).toContain('DR-0100');
    expect(l).toContain('DR-0076');
    expect(l).toContain('neuroplasticity');
    expect(l).toContain('procedural');
    expect(l).toContain('declarative');
    // the explicit honesty boundary — no invented Bible-specific neurochemistry
    expect(l).toMatch(/not.{0,30}fabricat|refus/i);
    expect(l).toContain('created-design echo');
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
  it('child, teen, and senior each carry the doers-not-hearers and doing-yields-knowing threads', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries doer/built-on-rock`).toMatch(/doers of the word|built his house upon a rock|do them/i);
      expect(t, `${band} carries doing-yields-knowing`).toMatch(/he shall know of the doctrine|taste and see|happy are ye if ye do them/);
    }
    // teen and senior additionally carry the two-tier science and hide-in-heart.
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toContain('hid in mine heart');
      expect(t).toContain('procedural');
    }
  });
});

describe('corpus witness + tamper-catch — the pins match the repo KJV, and the ground truth is exact', () => {
  const corpus = (book) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8'));
  const verse = (book, ch, v) => corpus(book).chapters[ch - 1][v - 1];
  it('a representative set is re-read from the corpus files themselves', () => {
    expect(verse('James', 1, 22)).toBe('But be ye doers of the word, and not hearers only, deceiving your own selves.');
    expect(verse('John', 7, 17)).toBe('If any man will do his will, he shall know of the doctrine, whether it be of God, or whether I speak of myself.');
    expect(verse('Hebrews', 5, 14)).toContain('by reason of use have their senses exercised to discern both good and evil');
    expect(verse('Matthew', 7, 24)).toContain('built his house upon a rock');
    expect(verse('John', 13, 17)).toBe('If ye know these things, happy are ye if ye do them.');
    expect(verse('Psalms', 34, 8)).toContain('O taste and see that the LORD is good');
    expect(verse('Psalms', 119, 11)).toBe('Thy word have I hid in mine heart, that I might not sin against thee.');
    expect(verse('Proverbs', 23, 7)).toContain('For as he thinketh in his heart, so is he');
    expect(verse('1Thessalonians', 2, 13)).toContain('which effectually worketh also in you that believe');
    expect(verse('Joshua', 1, 8)).toContain('meditate therein day and night, that thou mayest observe to do');
    expect(verse('Psalms', 119, 100)).toBe('I understand more than the ancients, because I keep thy precepts.');
  });
});

// =============================================================================
// THE TWO CHECKS THIS GATE DID NOT HAVE (added 2026-09-17, DR-0418 pass)
// =============================================================================
// Carried from L111 down through L106 the same day. This module arrived clean
// on the span gate (197 quotations verbatim); the voice check found the
// generic name in two places, both in bands rewritten anyway.
//
// A THIRD check is added here that the earlier lessons did not need: this
// lesson makes a created-design argument from cognitive neuroscience, and a
// band that kept the claim while dropping its stated LIMIT would be worse
// than a short band. So every band must carry the boundary — that the
// specific neurochemistry of Bible-reading is not a measured result — in its
// own words (DR-0076 §8 provenance, DR-0100 tier 2: flag the genuinely open
// narrowly, and never invent a study to make a point land harder).
//
// The corpus is joined with each chapter's VERSES FLOWING (space-separated
// within a chapter), so a quotation of contiguous verses — Proverbs 4:20-21
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
    expect(KJV_FLOW.includes('by reason of use have their senses exercised')).toBe(true);
    expect(KJV_FLOW.includes('by reason of use have their senses exercised to discern good and evil')).toBe(false);
    expect(KJV_FLOW.includes('I understand more than the ancients, because I keep thy precepts')).toBe(true);
    expect(KJV_FLOW.includes('I understand more than the ancients, because I read thy precepts')).toBe(false);
    expect(KJV_FLOW.includes('be ye doers of the word, and not hearers only')).toBe(true);
    expect(KJV_FLOW.includes('be ye doers of the word, and not hearers alone')).toBe(false);
    expect(KJV_FLOW.includes('that thou mayest observe to do according to all that is written therein')).toBe(true);
    expect(KJV_FLOW.includes('that thou mayest observe to do all that is written therein')).toBe(false);
  });
});

describe('our own authored voice says Yahweh, not the generic name (DR-0210)', () => {
  it('names Him by His covenant name in every band and every note', () => {
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(5);
  });
});

describe('the science claim keeps its limit in EVERY band (DR-0076, DR-0100)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };

  it('no band claims the mechanism without also stating what is NOT measured', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      // If a band reaches for the created-design echo at all, it must carry
      // the boundary with it — an unbounded claim is the failure mode here.
      const claimsMechanism = /brain|neural|neuroscience|pathways|automatic/i.test(t);
      expect(claimsMechanism, `${band} should teach the created-design echo`).toBe(true);
      expect(t, `${band} states the science claim without its limit`)
        .toMatch(/not a measured result|has not been measured|nobody has measured|no study will be invented|not going to pretend/i);
      expect(t, `${band} must keep the Word as the authority`).toMatch(/the Word is the authority|matches what the Word said first|what the Word said first/i);
    }
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

  it('every band carries all seven movements, not a subset', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the daily searching`).toContain('searched the scriptures daily');
      expect(t, `${band} commands attention`).toContain('attend to my words');
      expect(t, `${band} carries HOW ye hear`).toContain('Take heed therefore how ye hear');
      expect(t, `${band} hides it in the heart`).toContain('hid in mine heart');
      expect(t, `${band} guards the heart as the deep layer`).toContain('Keep thy heart with all diligence');
      expect(t, `${band} names the Word as the active party`).toContain('effectually worketh also in you');
      expect(t, `${band} carries the hinge: reading is not doing`).toContain('doers of the word, and not hearers only');
      expect(t, `${band} reads the parable's real variable`).toContain('built his house upon a rock');
      expect(t, `${band} puts doing before knowing`).toContain('he shall know of the doctrine');
      expect(t, `${band} carries senses exercised by use`).toContain('senses exercised to discern both good and evil');
      expect(t, `${band} closes on meditate-in-order-to-do`).toContain('observe to do according to all that is written therein');
    }
  });

  it('the senior band is a senior READER\'s lesson, not the facilitator\'s notes', () => {
    // It was the notes: "Teach as the experiential/created-design companion to
    // L104 (Study Your Ways)", the capture date, and a list of the questions
    // to cover. Those belong in `facilitator`.
    const senior = level('senior');
    expect(senior).not.toContain('Teach as the experiential');
    expect(senior).not.toMatch(/companion to L\d+/i);
    expect(senior).not.toContain('2026-08-30');
    expect(l, 'the facilitator notes must still exist somewhere').toContain('talkingPoints');
  });
});
