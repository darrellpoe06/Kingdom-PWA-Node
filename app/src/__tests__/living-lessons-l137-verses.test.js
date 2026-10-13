// @vitest-environment node
// =============================================================================
// L137 — Look and Live. Verbatim KJV, and the claims this lesson may never lose.
// =============================================================================
// THE QUESTION, asked 2026-09-09. Darrell read Numbers 21:8-9 and asked whether
// the serpent on the pole could be an analogy for everyone who believes Yahweh
// being eternally healed, because they believe Him over the serpent who will
// end in eternal flames.
//
// The answer is yes, and the lesson's whole discipline is that the yes is not
// ours: Jesus drew the type Himself (John 3:14-15), one breath before John
// 3:16. This gate holds the six things the lesson teaches, each of which can
// drift into a real error:
//
//   1. THE TYPE IS HIS. If the lesson ever presents the serpent as our
//      illustration rather than the Son's own, it has lost its authority.
//   2. WHAT WAS ON THE POLE was the curse displayed as judged — "in the
//      likeness of sinful flesh" (Romans 8:3) — never the devil honoured.
//   3. THE LOOK WAS BELIEVING, and it was NOT A WORK: nobody was told to look
//      well. Grading the look is the drift this pins against.
//   4. THE REACH is every one that is bitten and no further; THE LENGTH is
//      eternal, and the picture is smaller than the Person (the brass serpent
//      healed a body for a lifetime; the Son destroys death).
//   5. THE SERPENT'S END is stated in the Word's words — tormented for ever —
//      and the lesson says plainly that his end is not an ending.
//   6. THE SERPENTS WERE NOT TAKEN AWAY, and the sign became Nehushtan.
//
// Typography (DR-0210): our authored voice says Yahweh; the KJV's own "God"
// and "the LORD" stay untouched inside every quotation, and the adversary is
// never capitalised in our voice.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll137-look-and-live-the-serpent-on-the-pole-the-son-lifted-up-and-why-believing-him-over-the-liar-is-the-whole-cure';
const start = src.indexOf(`id: '${ID}'`);
const l = (() => {
  const rest = src.slice(start);
  const nextLesson = rest.indexOf("\n  {\n    id: 'll");
  const arrayEnd = rest.indexOf('\n  },\n];');
  const ends = [nextLesson, arrayEnd].filter((i) => i > -1);
  return ends.length ? rest.slice(0, Math.min(...ends)) : rest;
})();

// The whole KJV, joined two ways: verse-by-line, and verse-by-space, so a
// quotation that runs across a verse boundary ("...shall live. And Moses
// made...") is still checked letter for letter rather than refused.
const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const { BY_LINE, BY_SPACE } = (() => {
  let byLine = '';
  let bySpace = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json') && x !== 'index.json')) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;
    for (const ch of j.chapters) { byLine += `${ch.join('\n')}\n`; bySpace += `${ch.join(' ')}\n`; }
  }
  return { BY_LINE: byLine, BY_SPACE: bySpace };
})();
const inKjv = (part) => BY_LINE.includes(part) || BY_SPACE.includes(part);

const quotedSpans = (text) => {
  const unescaped = text.replace(/\\'/g, "'");
  const at = [...unescaped.matchAll(/"/g)].map((m) => m.index);
  const out = [];
  for (let i = 0; i + 1 < at.length; i += 2) out.push(unescaped.slice(at[i] + 1, at[i + 1]));
  return { spans: out, balanced: at.length % 2 === 0 };
};

/** Our authored voice = the text with every quotation removed. */
const ourVoiceOnly = (text) => text.replace(/"[^"]*"/g, ' ');

// Deliberately EMPTY: every double-quoted span in L137 is verbatim KJV.
const NOT_SCRIPTURE = [];

const mod = () => LIVING_LESSONS_MODULES.find((x) => x.id === ID);

describe('L137 is registered with its full shape', () => {
  it('the module exists and is in the live series', () => {
    expect(start, 'L137 must be present in the source').toBeGreaterThan(-1);
    expect(mod(), 'L137 must be in LIVING_LESSONS_MODULES').toBeTruthy();
  });

  it('the painted lesson count is the real one', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('carries the full teaching shape', () => {
    const m = mod();
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(10);
    expect(m.benefits.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(m.anchor.ref).toMatch(/Numbers 21:8-9/);
    expect(m.anchor.ref).toMatch(/John 3:14-16/);
  });

  it('every quiz question has a real answer index and a substantial explanation', () => {
    for (const q of mod().quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });

  it('every age band resolves to authored prose of its own', () => {
    const m = mod();
    for (const band of AGE_BANDS) {
      const r = resolveForAge(m, band.id);
      expect(typeof r.text === 'string' && r.text.length > 400, `${band.id} must carry real prose`).toBe(true);
    }
  });
});

describe('every quoted span is letter-for-letter KJV', () => {
  it('the quotation marks are balanced (an unclosed quote silently swallows text)', () => {
    expect(quotedSpans(l).balanced, 'unbalanced quotation marks in the L137 source').toBe(true);
  });

  it('EVERY span is verbatim Scripture', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length, 'L137 must actually contain quotations').toBeGreaterThan(100);
    const bad = [];
    for (const span of spans) {
      const parts = span.includes('...') ? span.split('...').map((p) => p.trim()) : [span];
      for (const part of parts) {
        if (!part || NOT_SCRIPTURE.includes(part)) continue;
        if (!inKjv(part)) bad.push(part);
      }
    }
    expect(bad, `non-verbatim quoted spans:\n${bad.join('\n')}`).toEqual([]);
  });

  it('the allowlist is EMPTY and stays honest', () => {
    expect(NOT_SCRIPTURE).toEqual([]);
  });
});

describe('ONE — the type is the Son’s, not ours', () => {
  it('John 3:14-15 is quoted whole, and the lesson says Jesus drew the picture first', () => {
    expect(l).toContain('And as Moses lifted up the serpent in the wilderness, even so must the Son of man be lifted up: That whosoever believeth in him should not perish, but have eternal life.');
    expect(l).toMatch(/JESUS PROPOSED IT FIRST|THE SON PROPOSED IT FIRST|Jesus said it first|Jesus drew/i);
  });

  it('John 3:16 is taught as the sentence that FOLLOWS the serpent', () => {
    expect(l).toContain('For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.');
    expect(l).toMatch(/John 3:16 is the (sentence|explanation)|sentence that FOLLOWS the serpent|follows the serpent/i);
  });

  it('LIFTED UP is defined by the Son, not by us', () => {
    expect(l).toContain('And I, if I be lifted up from the earth, will draw all men unto me.');
    expect(l).toContain('This he said, signifying what death he should die.');
    expect(l).toMatch(/The pole is the cross/);
  });
});

describe('TWO — what was on the pole: the curse displayed as judged', () => {
  it('Romans 8:3 carries the answer to why a serpent', () => {
    expect(l).toContain('in the likeness of sinful flesh');
    expect(l).toMatch(/CURE IS SHAPED LIKE THE CURSE/);
  });

  it('made sin and made a curse are both quoted, with the tree', () => {
    expect(l).toContain('he hath made him to be sin for us, who knew no sin');
    expect(l).toContain('Cursed is every one that hangeth on a tree');
  });

  it('Colossians 2:15 turns the pole into a public triumph, and the devil is NOT honoured', () => {
    expect(l).toContain('he made a shew of them openly, triumphing over them in it.');
    expect(l).toMatch(/not the devil being honoured|not the adversary honoured/i);
  });

  it('the Lamb is held beside the serpent, not replaced by it', () => {
    expect(l).toContain('Behold the Lamb of God, which taketh away the sin of the world.');
  });
});

describe('THREE — the look was believing, and it was not a work', () => {
  it('the sin in the camp is identified as a SENTENCE against Yahweh', () => {
    expect(l).toContain('And the people spake against God, and against Moses, Wherefore have ye brought us up out of Egypt to die in the wilderness?');
    expect(l).toMatch(/A SENTENCE|a sentence, not an idol|a SENTENCE — speaking against/i);
  });

  it('the liar’s voice is traced from the garden to John 8:44', () => {
    expect(l).toContain('Ye shall not surely die:');
    expect(l).toContain('he is a liar, and the father of it.');
  });

  it('Darrell’s phrase is carried and credited: believe Him over the serpent', () => {
    expect(l).toMatch(/Darrell/);
    expect(l).toMatch(/believe Him over the serpent/);
  });

  it('the Bible’s verb for faith is a look, shown across the canon', () => {
    expect(l).toContain('Look unto me, and be ye saved, all the ends of the earth: for I am God, and there is none else.');
    expect(l).toContain('They looked unto him, and were lightened');
    expect(l).toContain('Looking unto Jesus the author and finisher of our faith');
    expect(l).toMatch(/SEEING AND BELIEVING ARE ONE VERB/);
  });

  it('PROVEN-TO-CATCH: the look is never graded — nobody was told to look well', () => {
    expect(l).toMatch(/look WELL/);
    expect(l).toMatch(/THE LOOK IS NOT A WORK|The look is not a work/);
    expect(l).toContain('For by grace are ye saved through faith; and that not of yourselves: it is the gift of God');
  });
});

describe('FOUR — the reach and the length', () => {
  it('the reach is stated three ways and the other side is not softened', () => {
    expect(l).toMatch(/every one that is bitten/);
    expect(l).toMatch(/whosoever/);
    expect(l).toContain('He that believeth on him is not condemned: but he that believeth not is condemned already');
  });

  it('eternally healed is the Word’s language, and the term is set by the Healer', () => {
    expect(l).toContain('by whose stripes ye were healed.');
    expect(l).toContain('And whosoever liveth and believeth in me shall never die.');
  });

  it('the picture is smaller than the Person — the one distinction the Word keeps', () => {
    expect(l).toMatch(/picture (is|being) smaller than (the|its) Person|smaller than its fulfilment/i);
    expect(l).toContain('The last enemy that shall be destroyed is death.');
  });
});

describe('FIVE — the serpent’s end, in the Word’s words', () => {
  it('from the garden to the lake: head bruised, works destroyed, tormented for ever', () => {
    expect(l).toContain('it shall bruise thy head');
    expect(l).toContain('that he might destroy the works of the devil.');
    expect(l).toContain('that through death he might destroy him that had the power of death, that is, the devil');
    expect(l).toContain('and shall be tormented day and night for ever and ever.');
    expect(l).toContain('into everlasting fire, prepared for the devil and his angels');
  });

  it('the precision is kept: the second death is not a ceasing', () => {
    expect(l).toContain('This is the second death.');
    expect(l).toMatch(/His end is not an ending/);
  });
});

describe('SIX — what the story adds, and where it stops', () => {
  it('the serpents were NOT taken away', () => {
    expect(l).toContain('pray unto the LORD, that he take away the serpents from us.');
    expect(l).toMatch(/SERPENTS WERE NOT TAKEN AWAY|serpents were not taken away|not removed/i);
  });

  it('Nehushtan — the sign became an idol, and faith looks THROUGH the sign', () => {
    expect(l).toContain('he called it Nehushtan.');
    expect(l).toMatch(/looks THROUGH the sign|look THROUGH the sign|looks through the sign/i);
  });

  it('where the Word stops, the lesson stops — and hands the reader the test', () => {
    expect(l).toMatch(/why brass/i);
    expect(l).toMatch(/ask for the verse/i);
  });
});

describe('typography — Yahweh in our voice, the KJV untouched inside quotes (DR-0210)', () => {
  it('our authored voice never says the generic God', () => {
    const ours = ourVoiceOnly(l);
    const hits = [...ours.matchAll(/\bGod\b/g)].map((m) => ours.slice(Math.max(0, m.index - 40), m.index + 20));
    expect(hits, `generic God in our voice:\n${hits.join('\n')}`).toEqual([]);
    expect(ours).toMatch(/Yahweh/);
  });

  it('the KJV’s own God and LORD survive inside the quotations (no blind sweep)', () => {
    const { spans } = quotedSpans(l);
    expect(spans.some((s) => /\bGod\b/.test(s))).toBe(true);
    expect(spans.some((s) => /\bLORD\b/.test(s))).toBe(true);
  });

  it('the adversary is never capitalised in our voice', () => {
    const ours = ourVoiceOnly(l);
    expect(ours).not.toMatch(/\bSatan\b|\bDevil\b|\bLucifer\b/);
  });
});
