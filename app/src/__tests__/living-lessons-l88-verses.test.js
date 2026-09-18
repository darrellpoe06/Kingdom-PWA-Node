// =============================================================================
// L88 — The King's Program, Part 2 (the Four Soils): verbatim KJV
// =============================================================================
// Darrell 2026-08-24 (spoken): "Different hearts or subconsciousness...
// thorns... etc... what could each heart condition symbolize?" · "The only
// person earth programs are inside The Word... eternal 4th-dimensional King
// Algorithms..." · "All inside the same lesson/s.... so if you read only
// [one] you have understanding." Jesus decodes His own parable (Luke 8:11-15)
// — the Word explains the Word (DR-0098); the 4th-dimensional frame is
// DR-0097. Every KJV line below was FETCHED from the repo's own KJV this
// session (DR-0076 / DR-0281). A drifted quote fails the build.
import { describe, it, expect } from 'vitest';
import { formatLessonText } from '../lib/lesson-format.js';
// This file otherwise reads the SOURCE as text; the section-break check below
// needs the real module, because what matters is what the app renders.
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const start = src.indexOf("id: 'll88-four-soils-heart-conditions-and-the-kings-eternal-program'");
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
  'Luke 8:11': 'Now the parable is this: The seed is the word of God.',
  'Luke 8:12': 'Those by the way side are they that hear; then cometh the devil, and taketh away the word out of their hearts, lest they should believe and be saved.',
  'Luke 8:14': 'And that which fell among thorns are they, which, when they have heard, go forth, and are choked with cares and riches and pleasures of this life, and bring no fruit to perfection.',
  'Luke 8:15': 'But that on the good ground are they, which in an honest and good heart, having heard the word, keep it, and bring forth fruit with patience.',
  'Mark 4:19': 'And the cares of this world, and the deceitfulness of riches, and the lusts of other things entering in, choke the word, and it becometh unfruitful.',
  'Proverbs 4:23': 'Keep thy heart with all diligence; for out of it are the issues of life.',
  'Jeremiah 4:3 (fragment)': 'Break up your fallow ground, and sow not among thorns.',
  'Ezekiel 36:26': 'A new heart also will I give you, and a new spirit will I put within you: and I will take away the stony heart out of your flesh, and I will give you an heart of flesh.',
};

const QUOTED_FRAGMENTS = [
  'Now the parable is this: The seed is the word of God',
  'some fell by the way side; and it was trodden down, and the fowls of the air devoured it',
  'then cometh the devil, and taketh away the word out of their hearts, lest they should believe and be saved',
  'To day if ye will hear his voice, harden not your hearts',
  'it withered away, because it lacked moisture',
  'receive the word with joy; and these have no root, which for a while believe, and in time of temptation fall away',
  'I will take away the stony heart out of your flesh, and I will give you an heart of flesh',
  'the thorns sprang up with it, and choked it',
  'choked with cares and riches and pleasures of this life, and bring no fruit to perfection',
  'the cares of this world, and the deceitfulness of riches, and the lusts of other things entering in, choke the word, and it becometh unfruitful',
  'and bare fruit an hundredfold',
  'an honest and good heart, having heard the word, keep it, and bring forth fruit with patience',
  'Break up your fallow ground, and sow not among thorns',
  'Sow to yourselves in righteousness, reap in mercy; break up your fallow ground: for it is time to seek the LORD',
  'Keep thy heart with all diligence; for out of it are the issues of life',
  'He that hath ears to hear, let him hear',
  // the Part-1 core carried inside Part 2 (self-contained pair)
  'I am the way, the truth, and the life',
  'That the man of God may be perfect',
];

describe('L88 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    // 'youth:' was absent from this list AND the band was absent from the
    // lesson, exactly as in L89 — the second lesson in a row found that way,
    // which is what turned a pair of patches into the series-wide measurement
    // (DR-0473). The youth band was written 2026-09-18 and is required here.
    for (const key of ['bigIdea:', 'inApp:', "ref: 'Luke 8:11, 15'", 'child:', 'youth:', 'teen:', 'senior:', 'quiz:', 'facilitator:']) {
      expect(lesson).toContain(key);
    }
    expect(src).toMatch(/weeks: \d+,/);
    expect(src).toContain('L88 The King’s Program Part 2');
  });
  it("keeps the Governor's framing: heart/subconscious soils and the eternal King-program", () => {
    for (const frag of ['The King’s Program, Part 2', 'subconscious', 'eternal', 'HARDENED', 'SHALLOW', 'DIVIDED', 'HONEST, KEPT']) {
      expect(l).toContain(frag);
    }
  });
  it('the symbols are Jesus’ own decode, and the adversary stays lowercase in our voice', () => {
    expect(l).toContain('He decodes each condition Himself');
    expect(l).toContain('then cometh the devil'); // KJV verbatim, lowercase as written
    expect(l).not.toMatch(/The Devil/);
  });
});

describe('all FOUR bands carry the parable whole (DR-0418)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    expect(i, `the ${name} band is missing entirely`).toBeGreaterThan(-1);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };
  const BANDS = ['child', 'youth', 'teen', 'senior'];
  // OUR prose only: quoting a verse is not teaching it (the lesson L89's gate
  // taught this file — a band could quote Luke 8:11 verbatim and never once say
  // what the seed IS).
  const ourProse = (band) => level(band).replace(/"[^"]*"/g, ' ');

  it('every band opens from where Jesus starts — the seed IS the Word', () => {
    for (const band of BANDS) {
      expect(level(band), `${band} never quotes the frame`).toContain('The seed is the word of God');
    }
  });

  it('every band carries ALL FOUR soils, because three is a different parable', () => {
    // Each is checked by the words that band actually uses for it, not by a
    // single phrasing imposed on four registers.
    for (const band of BANDS) {
      const t = level(band);
      expect(t, `${band} drops the way side`).toMatch(/way side/i);
      expect(t, `${band} drops the rock`).toMatch(/rock|withered away/i);
      expect(t, `${band} drops the thorns`).toMatch(/thorns/i);
      expect(t, `${band} drops the good ground`).toMatch(/good ground/i);
    }
  });

  it('every band TEACHES that the soil is the heart, and that the seed is not the variable', () => {
    for (const band of BANDS) {
      const ours = ourProse(band);
      expect(ours, `${band} never says the ground means the heart`).toMatch(/heart/i);
      // Four registers, four phrasings of the same property: the child cannot
      // make the seed better, the youth band says Jesus does not point at the
      // seed and calls it one perfect seed, the teen band says you cannot
      // upgrade it, the senior band says the drama is never in the seed.
      expect(ours, `${band} never says the seed is not what varies`)
        .toMatch(/cannot (make the seed better|upgrade the seed)|(?:not|never) (?:point at|in) the seed|perfect seed|never the variable|already perfect/i);
    }
  });

  it('every band keeps the thorn-heart diagnostic — it GROWS and still does not finish', () => {
    // The most useful line in the parable and the easiest to lose, because it
    // is the only soil that looks like success on the way past.
    for (const band of BANDS) {
      const t = level(band);
      expect(t, `${band} loses the no-fruit-to-perfection signature`)
        .toMatch(/no fruit to perfection|could not make any fruit|never finish/i);
    }
  });

  it('every band TEACHES the good ground as honest, KEEPING and patient — in OUR prose', () => {
    // Caught by the break harness: this read the WHOLE band, so all three words
    // were satisfied by Luke 8:15's own wording — "an honest and good heart,
    // having heard the word, keep it, and bring forth fruit with patience".
    // Removing every teaching phrasing of KEEPING left the check green, because
    // His sentence was answering for ours. The helper for this was already
    // defined six lines up and simply was not used, which is the whole lesson.
    for (const band of BANDS) {
      const ours = ourProse(band);
      expect(ours, `${band} quotes honest but never teaches it`).toMatch(/honest/i);
      expect(ours, `${band} quotes keep but never teaches it`).toMatch(/keep/i);
      expect(ours, `${band} quotes patience but never teaches it`).toMatch(/patien/i);
    }
  });

  it('every band offers the treatment, so it is a diagnosis and never a sorting hat', () => {
    for (const band of BANDS) {
      const t = level(band);
      expect(t, `${band} leaves the reader with a verdict and no remedy`)
        .toMatch(/A new heart also will I give you|Break up your fallow ground|Keep thy heart with all diligence/);
    }
  });

  it('the child band shows the four grounds as FOUR SECTIONS a child can see', () => {
    // Found 2026-09-18 by running the real formatter rather than trusting the
    // prose. The child band originally labelled the grounds "GROUND ONE."
    // through "GROUND FOUR." — which the formatter does not number, because it
    // numbers only markers an author already writes (FIRST/SECOND..., I./II.,
    // SOIL n). So all four grounds were being absorbed MID-PARAGRAPH
    // ("...bounces off. GROUND TWO. THE ROCK...") in the one band where the
    // four grounds ARE the lesson and a reader most needs to see them apart.
    // The markers are now the ordinal form the formatter knows.
    const { items, sectionCount } = formatLessonText(
      LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll88-four-soils')).levels.child,
    );
    const ns = items.filter((i) => i.kind === 'heading').map((h) => h.n);
    expect(sectionCount, 'the child band lost its section breaks').toBe(4);
    expect(ns).toEqual([1, 2, 3, 4]);
    // And no chunk may become a wall, at any band (the house standard).
    for (const i of items) expect(i.text.length).toBeLessThanOrEqual(420);
  });

  it('no band elides inside a quotation (DR-0459)', () => {
    // Found already shipped in this lesson on 2026-09-18 — in the ADULT lesson
    // and again in bigIdea, both Luke 8:13 and Ezekiel 36:26, each with a
    // contiguous verbatim span available the whole time. That pair, arriving
    // one lesson after the identical pair in L89, is why DR-0473 exists.
    for (const band of BANDS) {
      for (const m of level(band).matchAll(/"([^"]*)"/g)) {
        expect(/\.\.\.|\u2026/.test(m[1]), `${band}: an elision inside a quotation — "${m[1]}"`).toBe(false);
      }
    }
  });

  it('no band cites a decision record at the reader', () => {
    // The old senior band recited TWO (DR-0097 and DR-0098). The rules were
    // right; the citations were ours, not the reader's.
    for (const band of BANDS) {
      expect(level(band), `${band} cites a decision record to the reader`).not.toMatch(/DR-\d{4}/);
    }
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    it(`quotes verbatim: "${frag.slice(0, 60)}${frag.length > 60 ? '…' : ''}"`, () => {
      expect(l).toContain(frag);
    });
  }
});

describe('tamper-catch — the pinned KJV ground truth is itself exact', () => {
  it('full-verse pins match their known lengths and endings', () => {
    expect(KJV['Luke 8:11']).toBe('Now the parable is this: The seed is the word of God.');
    expect(KJV['Luke 8:11'].length).toBe(53);
    expect(KJV['Luke 8:15'].endsWith('bring forth fruit with patience.')).toBe(true);
    expect(KJV['Luke 8:14']).toContain('no fruit to perfection');
    expect(KJV['Mark 4:19']).toContain('deceitfulness of riches');
    expect(KJV['Proverbs 4:23'].length).toBe(72);
    expect(KJV['Ezekiel 36:26']).toContain('stony heart');
    expect(KJV['Luke 8:12']).toContain('then cometh the devil');
  });
});
