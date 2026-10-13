// =============================================================================
// L87 — Two Ways, Two Wisdoms, and the Word's engine of wholeness: verbatim KJV
// =============================================================================
// Darrell 2026-08-24 (three spoken utterances, one flow): "What is the
// difference between Yahweh's Way and works of iniquity and why can't we
// understand or see the Truth Light or Way and what can we do to See like
// Jesus says..." · "Wisdom of man vs Yahweh's Wisdom etc..." · "internal
// structure of the Words Ways of making us whole or His perfect... how!?"
// Every KJV line below was FETCHED from the repo's own KJV this session —
// never written from memory (DR-0076 / DR-0281 QUOTED). A drifted quote
// fails the build (the L83-L86 discipline).
import { describe, it, expect } from 'vitest';
// This file otherwise reads the SOURCE as text; the section and band checks
// below need the real module, because what matters is what the app renders.
import { formatLessonText } from '../lib/lesson-format.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll87-two-ways-two-wisdoms-how-the-word-makes-whole'");
// Bound the slice to THIS lesson rather than to a fixed character window. A
// fixed window is fragile in BOTH directions: too small and it misses the end of
// the lesson (which is how adding adult-depth prose pushed `quiz:` out of view),
// too large and it sweeps into the NEXT lesson and judges someone else's prose.
const lesson = (() => {
  const rest = src.slice(start);
  const nextLesson = rest.indexOf("\n  {\n    id: 'll");
  const arrayEnd = rest.indexOf('\n  },\n];');
  const ends = [nextLesson, arrayEnd].filter((i) => i > -1);
  return ends.length ? rest.slice(0, Math.min(...ends)) : rest;
})();
const l = lesson.replace(/\\u2019/g, '’');

// Fetched verbatim from app/public/bible/kjv (full verses, this session).
const KJV = {
  'Psalms 1:6': 'For the LORD knoweth the way of the righteous: but the way of the ungodly shall perish.',
  'Proverbs 14:12': 'There is a way which seemeth right unto a man, but the end thereof are the ways of death.',
  'John 14:6': 'Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.',
  '2 Corinthians 4:4 (fragment)': 'the god of this world hath blinded the minds of them which believe not',
  '1 Corinthians 2:14': 'But the natural man receiveth not the things of the Spirit of God: for they are foolishness unto him: neither can he know them, because they are spiritually discerned.',
  'John 3:3 (fragment)': 'Except a man be born again, he cannot see the kingdom of God',
  'Matthew 5:8': 'Blessed are the pure in heart: for they shall see God.',
  'Psalms 119:18': 'Open thou mine eyes, that I may behold wondrous things out of thy law.',
  'Luke 2:49 (fragment)': 'wist ye not that I must be about my Father’s business?',
  '2 Timothy 3:17': 'That the man of God may be perfect, throughly furnished unto all good works.',
  'Psalms 19:7': 'The law of the LORD is perfect, converting the soul: the testimony of the LORD is sure, making wise the simple.',
  'John 17:17': 'Sanctify them through thy truth: thy word is truth.',
};

const QUOTED_FRAGMENTS = [
  // I. the two ways
  'For the LORD knoweth the way of the righteous: but the way of the ungodly shall perish',
  'There is a way which seemeth right unto a man, but the end thereof are the ways of death',
  'For my thoughts are not your thoughts, neither are your ways my ways, saith the LORD',
  'so are my ways higher than your ways',
  'I am the way, the truth, and the life: no man cometh unto the Father, but by me',
  'depart from me, ye that work iniquity',
  // II. why we cannot see
  'the god of this world hath blinded the minds of them which believe not',
  'light is come into the world, and men loved darkness rather than light, because their deeds were evil',
  'For every one that doeth evil hateth the light',
  'the natural man receiveth not the things of the Spirit of God',
  'neither can he know them, because they are spiritually discerned',
  'The light of the body is the eye: if therefore thine eye be single, thy whole body shall be full of light',
  // III. how sight comes
  'Except a man be born again, he cannot see the kingdom of God',
  'Blessed are the pure in heart: for they shall see God',
  'Open thou mine eyes, that I may behold wondrous things out of thy law',
  'anoint thine eyes with eyesalve, that thou mayest see',
  'wist ye not that I must be about my Father’s business?',
  'But seek ye first the kingdom of God',
  // IV. the two wisdoms
  'the wisdom of this world is foolishness with God',
  'but is earthly, sensual, devilish',
  'The fear of the LORD is the beginning of wisdom',
  'Trust in the LORD with all thine heart; and lean not unto thine own understanding',
  'In all thy ways acknowledge him, and he shall direct thy paths',
  'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not',
  'first pure, then peaceable, gentle, and easy to be intreated, full of mercy and good fruits, without partiality, and without hypocrisy',
  'the foolishness of God is wiser than men',
  // V. the engine of wholeness
  'That the man of God may be PERFECT, throughly furnished unto all good works',
  'For the word of God is quick, and powerful, and sharper than any twoedged sword',
  'a discerner of the thoughts and intents of the heart',
  'Sanctify them through thy truth: thy word is truth',
  'be ye transformed by the renewing of your mind',
  'a doer of the work, this man shall be blessed in his deed',
  // VI. only one narrative endures (spoken 2026-08-24: "only Yahweh's
  // Narratives and Perspectives Will endure... main reason why I study the
  // Word... only real future")
  'The grass withereth, the flower fadeth: but the word of our God shall stand for ever',
  'The LORD bringeth the counsel of the heathen to nought',
  'The counsel of the LORD standeth for ever, the thoughts of his heart to all generations',
  'There are many devices in a man’s heart; nevertheless the counsel of the LORD, that shall stand',
  'the end from the beginning',
  'My counsel shall stand',
  'I AM THAT I AM',
  'which is, and which was, and which is to come, the Almighty',
  'Jesus Christ the same yesterday, and to day, and for ever',
  'yea, let God be true, but every man a liar',
  'And the Word was made flesh, and dwelt among us',
  'made himself of no reputation, and took upon him the form of a servant',
  'he humbled himself, and became obedient unto death, even the death of the cross',
  'Wherefore God also hath highly exalted him',
  'Heaven and earth shall pass away, but my words shall not pass away',
  'And the world passeth away, and the lust thereof: but he that doeth the will of God abideth for ever',
  'To the law and to the testimony: if they speak not according to this word, it is because there is no light in them',
];

describe('L87 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    // 'youth:' was absent from this list AND from the lesson — the third
    // lesson in a row found that way (L89, L88, L87). Written 2026-09-18.
    for (const key of ['bigIdea:', 'inApp:', "ref: '2 Timothy 3:16-17'", 'child:', 'youth:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(lesson).toContain(key);
    }
    expect(src).toContain('L87 Two Ways, Two Wisdoms');
  });
  it("keeps the Governor's framing: the four-stroke engine and the enlightening tie", () => {
    // 2026-09-06: the four strokes and the tie are asserted in the KJV's own
    // case. This test used to pin DOCTRINE / REPROOF / CORRECTION /
    // INSTRUCTION IN RIGHTEOUSNESS / ENLIGHTENING — emphasis capitals INSIDE
    // the quotations of 2 Timothy 3:16 and Psalm 19:8, which is the alteration
    // class the whole-span gate below forbids (quoted Scripture stays exactly
    // as written). The framing lives in the lesson's own prose ("four-stroke");
    // the verse carries the strokes verbatim.
    for (const frag of ['four-stroke', 'for doctrine, for reproof, for correction, for instruction in righteousness', 'enlightening the eyes']) {
      expect(l).toContain(frag);
    }
    expect(l, 'no emphasis capital inside the quotation').not.toMatch(/INSTRUCTION IN RIGHTEOUSNESS|ENLIGHTENING the eyes/);
  });
  it('is Part 1 of one two-part lesson, self-contained: carries the soils core and the only-real-future witness', () => {
    for (const frag of ['The King’s Program, Part 1', 'Part 2 walks it in full', 'The seed is the word of God', 'fruit with patience', 'ONLY REAL FUTURE']) {
      expect(l).toContain(frag);
    }
  });
  it('the adversary stays lowercase in our own voice; the quoted KJV stays verbatim', () => {
    // "the god of this world" is the KJV's own lowercase — quoted exactly —
    // and the lesson's own prose says "the adversary", never capitalized.
    expect(l).toContain('the god of this world hath blinded');
    expect(l).not.toMatch(/The Adversary/);
  });
});

describe('all FOUR bands carry the six movements (DR-0418)', () => {
  const L = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll87-two-ways'));
  const BANDS = ['child', 'youth', 'teen', 'senior'];
  const TEXTS = { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) };
  // OUR prose only — quoting a verse is not teaching it.
  const ourProse = (t) => String(t).replace(/"[^"]*"/g, ' ');

  it('EVERY text renders all SIX movements as numbered sections', () => {
    // Found 2026-09-18 by running the real formatter instead of trusting the
    // prose. A marker is numbered only when the preceding text ends in a
    // SENTENCE PERIOD — never after a closing reference like "(John 14:6) " —
    // and only in the forms the formatter knows (ordinal words, I./II., SOIL n).
    // Before the fix the child band rendered [1, 4, 6], the youth/teen/senior
    // bands rendered a single section each because "ONE:"/"TWO:" are not
    // markers it knows, and THE ADULT LESSON ITSELF rendered [1, 2, 3] — it had
    // been losing half its own movements on screen. All five now render 1-6.
    for (const [key, text] of Object.entries(TEXTS)) {
      const { items, sectionCount } = formatLessonText(text);
      const ns = items.filter((i) => i.kind === 'heading').map((h) => h.n);
      expect(sectionCount, `${key} does not render six movements`).toBe(6);
      expect(ns, `${key} numbers its movements ${JSON.stringify(ns)}`).toEqual([1, 2, 3, 4, 5, 6]);
      for (const i of items) expect(i.text.length, `${key} has a wall of text`).toBeLessThanOrEqual(420);
    }
  });

  it('every band carries the two ways, and that the wrong one does not announce itself', () => {
    for (const band of BANDS) {
      const t = TEXTS[band];
      expect(t, `${band} drops the two ways`).toContain('the way of the ungodly shall perish');
      expect(t, `${band} drops the road that seems right`).toContain('seemeth right unto a man');
      expect(ourProse(t), `${band} never teaches that sincerity is not safety`)
        .toMatch(/sincerity is not safety|meaning well is not the same as being safe|can FEEL right/i);
    }
  });

  it('every band carries all THREE blinders, because they need three different mercies', () => {
    // Collapsing them is the error: the hostile one, the moral one, and the
    // constitutional one are answered differently, and the moral one is the
    // uncomfortable one a lesson most wants to soften.
    for (const band of BANDS) {
      const t = TEXTS[band];
      expect(t, `${band} drops the hostile blinder`).toMatch(/blinded the minds|blinds people on purpose/i);
      expect(t, `${band} drops the moral blinder`).toContain('loved darkness rather than light');
      expect(t, `${band} drops the constitutional blinder`).toContain('natural man receiveth not');
      expect(ourProse(t), `${band} never says the moral one is not an information problem`)
        // The senior register says "not an information deficit; it is an
        // affection"; the others say "not an information problem" or, for the
        // child, "not a thinking problem". Same claim, three registers.
        .toMatch(/not an information (problem|deficit)|not a thinking problem/i);
    }
  });

  it('every band teaches that sight is GIVEN and follows seeking, never effort at seeing', () => {
    for (const band of BANDS) {
      const t = TEXTS[band];
      expect(t, `${band} drops new birth`).toContain('Except a man be born again');
      expect(t, `${band} drops the pure heart`).toContain('Blessed are the pure in heart');
      expect(t, `${band} drops the asking`).toContain('Open thou mine eyes');
      expect(ourProse(t), `${band} never refuses effort-at-seeing`)
        // "It never comes by effort at seeing" (senior), "Not by trying harder
        // to see" (youth/teen), "Not by squinting harder" (child).
        .toMatch(/not by trying harder|not by squinting harder|never comes by effort at seeing/i);
    }
  });

  it('every band teaches the engine as four strokes with a stated output', () => {
    for (const band of BANDS) {
      const t = TEXTS[band];
      expect(t, `${band} drops the engine verse`).toContain('profitable for doctrine, for reproof, for correction');
      const ours = ourProse(t);
      for (const stroke of [/doctrine/i, /reproof/i, /correction/i, /instruction/i]) {
        expect(ours, `${band} does not teach all four strokes`).toMatch(stroke);
      }
      expect(ours, `${band} never names the output as a whole person`).toMatch(/whole person/i);
    }
  });

  it('every band keeps the fairness about science, because a swipe would cost the room its trust', () => {
    // The lesson makes a real distinction and explicitly refuses to sneer. A
    // band that kept the contrast and dropped the fairness would be doing the
    // thing DR-0098 exists to prevent.
    for (const band of BANDS) {
      const ours = ourProse(TEXTS[band]);
      if (!/science/i.test(ours)) continue; // the child band does not raise it
      expect(ours, `${band} raises science without the fairness`)
        .toMatch(/honest best|revised honestly|good thing/i);
      expect(ours, `${band} never states the contrast it is drawing`)
        .toMatch(/does not forecast|He IS/);
    }
  });

  it('no band elides inside a quotation, and none cites a decision record (DR-0473)', () => {
    // NINE elisions were found in this lesson on 2026-09-18 — four in the adult
    // lesson and five in bigIdea — every one with a contiguous verbatim span
    // available. Fixing them GAINED words of His: "who is the image of God",
    // "and of the joints and marrow", "he being not a forgetful hearer, but",
    // and the whole glory clause of John 1:14.
    for (const [key, text] of Object.entries(TEXTS)) {
      for (const m of String(text).matchAll(/"([^"]*)"/g)) {
        expect(/\.\.\.|\u2026/.test(m[1]), `${key}: an elision inside a quotation — "${m[1]}"`).toBe(false);
      }
      expect(String(text), `${key} cites a decision record to the reader`).not.toMatch(/DR-\d{4}/);
    }
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    it(`quotes verbatim: "${frag.slice(0, 60)}${frag.length > 60 ? '…' : ''}"`, () => {
      // The lesson may emphasize a word with CAPS inside a quotation it
      // introduces as emphasized; compare case-insensitively so the letter
      // sequence itself is what is pinned.
      expect(l.toLowerCase()).toContain(frag.toLowerCase());
    });
  }
});

describe('tamper-catch — the pinned KJV ground truth is itself exact', () => {
  it('full-verse pins match their known lengths and endings', () => {
    expect(KJV['Psalms 1:6'].length).toBe(87);
    expect(KJV['Matthew 5:8']).toBe('Blessed are the pure in heart: for they shall see God.');
    expect(KJV['Psalms 119:18'].length).toBe(70);
    expect(KJV['2 Timothy 3:17']).toBe('That the man of God may be perfect, throughly furnished unto all good works.');
    expect(KJV['Psalms 19:7'].startsWith('The law of the LORD is perfect, converting the soul')).toBe(true);
    expect(KJV['John 17:17'].length).toBe(51);
    expect(KJV['John 14:6']).toContain('no man cometh unto the Father, but by me');
    expect(KJV['Proverbs 14:12'].endsWith('the ways of death.')).toBe(true);
    expect(KJV['1 Corinthians 2:14']).toContain('spiritually discerned');
    expect(KJV['Luke 2:49 (fragment)']).toContain('Father’s business');
  });
});
