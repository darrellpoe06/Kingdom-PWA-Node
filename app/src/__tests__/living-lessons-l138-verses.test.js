// @vitest-environment node
// =============================================================================
// L138 — Exercised Senses. Verbatim KJV, and the claims this lesson may never lose.
// =============================================================================
// THE QUESTION, asked 2026-09-09. Darrell: why does Yahweh not give us the
// perception skills when He knows we need them — because He does not trust us
// after our tests? And: do we get that after our Ways align with the Word?
//
// The lesson answers the fear and confirms the guess, and each part can drift:
//   1. HE IS NOT WITHHOLDING — James 1:5 (liberally, upbraideth not, all men).
//      A lesson that lets distrust back in has lost the first verse.
//   2. PERCEPTION IS EXERCISED BY USE (Hebrews 5:14) — a curve, not a switch.
//   3. DO, THEN KNOW (John 7:17; Psalms 111:10; Romans 12:2) — and alignment is
//      the ROAD, never the TOLL. The toll reading is the drift this pins against.
//   4. THE TESTS ARE THE TRAINING, not a trust exam: He already discerns the
//      heart (Hebrews 4:12); "to know" is the Word's word for made visible.
//   5. INCREASE FOLLOWS USE (Luke 16:10; Matthew 25:21; Matthew 13:12).
//   6. WHAT HE KEEPS AND WHAT HE GAVE: Deuteronomy 29:29 and the Spirit given;
//      a real lack is REJECTED (Hosea 4:6), not withheld.
//   7. DILIGENCE IS EVALUATED BY YAHWEH (added the same day) — a rewarder of
//      the diligent (Hebrews 11:6), measured by HIS perspective (Isaiah 55:8),
//      aimed at His Word first (2 Timothy 2:15): we must be educated, to do.
//
// Typography (DR-0210): Yahweh in our voice; the KJV untouched inside quotes.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll138-exercised-senses-why-perception-is-grown-not-withheld-the-tests-that-train-the-eye-and-what-comes-after-your-ways-align-with-the-word';
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

describe('L138 is registered with its full shape', () => {
  it('the module exists and is in the live series', () => {
    expect(start, 'L138 must be present in the source').toBeGreaterThan(-1);
    expect(mod(), 'L138 must be in LIVING_LESSONS_MODULES').toBeTruthy();
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
    expect(m.anchor.ref).toMatch(/Hebrews 5:14/);
    expect(m.anchor.ref).toMatch(/John 7:17/);
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
  it('the quotation marks are balanced', () => {
    expect(quotedSpans(l).balanced, 'unbalanced quotation marks in the L138 source').toBe(true);
  });

  it('EVERY span is verbatim Scripture', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length, 'L138 must actually contain quotations').toBeGreaterThan(100);
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

describe('ONE — He is not withholding', () => {
  it('James 1:5 is quoted whole and its three words are taught', () => {
    expect(l).toContain('If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.');
    expect(l).toMatch(/LIBERALLY/);
    expect(l).toMatch(/UPBRAIDETH NOT/);
  });
  it('PROVEN-TO-CATCH: the lesson never teaches that He withholds out of distrust', () => {
    expect(l).toMatch(/HE IS NOT WITHHOLDING|He is not withholding|not withholding/);
    expect(l).not.toMatch(/He (withholds|is withholding) (perception|wisdom) because/i);
  });
});

describe('TWO — perception is exercised by use', () => {
  it('Hebrews 5:14 is quoted whole and the verb is taught', () => {
    expect(l).toContain('But strong meat belongeth to them that are of full age, even those who by reason of use have their senses exercised to discern both good and evil.');
    expect(l).toMatch(/EXERCISED/);
    expect(l).toMatch(/BY REASON OF USE/);
  });
  it('a curve, not a switch', () => {
    expect(l).toContain('But the path of the just is as the shining light, that shineth more and more unto the perfect day.');
    expect(l).toContain('line upon line');
    expect(l).toMatch(/not a switch|a dawn/i);
  });
});

describe('THREE — do, then know; alignment is the road, never the toll', () => {
  it('the sequence verses are present, verbs in order', () => {
    expect(l).toContain('If any man will do his will, he shall know of the doctrine');
    expect(l).toContain('a good understanding have all they that do his commandments');
    expect(l).toContain('I understand more than the ancients, because I keep thy precepts.');
    expect(l).toMatch(/DO, then KNOW|DO, THEN KNOW/);
  });
  it('Darrell’s guess is credited and confirmed', () => {
    expect(l).toMatch(/Darrell/);
    expect(l).toMatch(/Ways align with the Word/);
  });
  it('PROVEN-TO-CATCH: the toll reading is refused by name', () => {
    expect(l).toMatch(/ALIGNMENT IS NOT THE TOLL; IT IS THE ROAD/);
  });
});

describe('FOUR — the tests are the training, not a trust exam', () => {
  it('Deuteronomy 8:2 is set beside Hebrews 4:12 and Genesis 22:12', () => {
    expect(l).toContain('to prove thee, to know what was in thine heart');
    expect(l).toContain('and is a discerner of the thoughts and intents of the heart.');
    expect(l).toContain('now I know that thou fearest God');
    expect(l).toMatch(/made (it )?VISIBLE|became SEEN|was seen there|made visible/i);
  });
  it('what a test PRODUCES is quoted, and the motive is stated', () => {
    expect(l).toContain('it yieldeth the peaceable fruit of righteousness unto them which are exercised thereby.');
    expect(l).toContain('when he hath tried me, I shall come forth as gold.');
    expect(l).toContain('but he for our profit, that we might be partakers of his holiness.');
    expect(l).toMatch(/THE TEST IS THE TRAINING|The test is the training/);
  });
});

describe('FIVE — increase follows use', () => {
  it('the three after verses are present and explained as growth, not grudging', () => {
    expect(l).toContain('He that is faithful in that which is least is faithful also in much');
    expect(l).toContain('thou hast been faithful over a few things, I will make thee ruler over many things');
    expect(l).toContain('For whosoever hath, to him shall be given');
    expect(l).toMatch(/Increase follows use|increase follows use/);
  });
});

describe('SIX — what He keeps, what He gave, and whose the lack is', () => {
  it('Deuteronomy 29:29 with its purpose clause, and the scale kept honest', () => {
    expect(l).toContain('The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever, that we may do all the words of this law.');
    expect(l).toContain('now I know in part; but then shall I know even as also I am known.');
  });
  it('the Spirit is the faculty, already given', () => {
    expect(l).toContain('he will guide you into all truth');
    expect(l).toContain('they are spiritually discerned.');
    expect(l).toContain('I have called you friends; for all things that I have heard of my Father I have made known unto you.');
  });
  it('trust first, direction after', () => {
    expect(l).toContain('Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.');
    expect(l).toMatch(/TRUST FIRST|Trust first/);
  });
  it('a real lack is REJECTED, not withheld', () => {
    expect(l).toContain('My people are destroyed for lack of knowledge: because thou hast rejected knowledge');
    expect(l).toMatch(/REJECTED|Rejected, not withheld/);
  });
  it('Solomon asked and was given; the lesson ends on the ask', () => {
    expect(l).toContain('Give therefore thy servant an understanding heart');
    expect(l).toContain('lo, I have given thee a wise and an understanding heart');
  });
  it('where the Word stops, the lesson stops', () => {
    expect(l).toMatch(/ask for the verse/i);
  });
});

describe('SEVEN — diligence is evaluated by Yahweh, and it is diligence in His Word (added the same day)', () => {
  it('Darrell’s two added lines are carried, for meaning (DR-0331)', () => {
    expect(l).toMatch(/diligence is evaluated by Yahweh/i);
    expect(l).toMatch(/we must be educated/i);
    expect(l).toMatch(/Yahweh’s perspective and understanding of the Word/);
  });
  it('He evaluates diligence — a REWARDER, with outcomes attached', () => {
    expect(l).toContain('he that cometh to God must believe that he is, and that he is a rewarder of them that diligently seek him.');
    expect(l).toContain('Seest thou a man diligent in his business? he shall stand before kings; he shall not stand before mean men.');
    expect(l).toContain('The hand of the diligent shall bear rule');
    expect(l).toContain('give diligence to make your calling and election sure');
    expect(l).toMatch(/A REWARDER OF THEM THAT DILIGENTLY SEEK/);
  });
  it('the measure is HIS perspective, not ours — and haste without knowledge is named', () => {
    expect(l).toContain('For my thoughts are not your thoughts, neither are your ways my ways, saith the LORD.');
    expect(l).toContain('Also, that the soul be without knowledge, it is not good; and he that hasteth with his feet sinneth.');
  });
  it('the diligence is aimed at His Word first — study, a workman, rightly dividing', () => {
    expect(l).toContain('Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.');
    expect(l).toMatch(/STUDY. A WORKMAN. RIGHTLY DIVIDING./);
    expect(l).toContain('If thou seekest her as silver, and searchest for her as for hid treasures; Then shalt thou understand the fear of the LORD, and find the knowledge of God. For the LORD giveth wisdom: out of his mouth cometh knowledge and understanding.');
  });
  it('we must be educated — the Word names ignorance of the Word as the cause of error', () => {
    expect(l).toContain('Ye do err, not knowing the scriptures, nor the power of God.');
    expect(l).toContain('thou shalt teach them diligently unto thy children');
    expect(l).toContain('Ezra had prepared his heart to seek the law of the LORD, and to do it, and to teach in Israel statutes and judgments.');
    expect(l).toMatch(/SEEK, DO, TEACH/);
    expect(l).toContain('searched the scriptures daily, whether those things were so.');
    expect(l).toContain('gave the sense, and caused them to understand the reading.');
    expect(l).toContain('no more children, tossed to and fro, and carried about with every wind of doctrine');
    expect(l).toContain('we have the mind of Christ.');
  });
  it('PROVEN-TO-CATCH: the counterfeit is named — learning that never becomes doing', () => {
    expect(l).toContain('Ever learning, and never able to come to the knowledge of the truth.');
    expect(l).toContain('But be ye doers of the word, and not hearers only, deceiving your own selves.');
    // The lesson may never teach diligence as self-directed busyness graded by our own measure.
    expect(l).not.toMatch(/diligence (is|means) (being busy|working hard for yourself)/i);
    expect(l).toMatch(/by reason of use/);
  });
});

describe('typography — Yahweh in our voice, the KJV untouched inside quotes (DR-0210)', () => {
  it('our authored voice never says the generic God', () => {
    const ours = ourVoiceOnly(l);
    const hits = [...ours.matchAll(/\bGod\b/g)].map((m) => ours.slice(Math.max(0, m.index - 40), m.index + 20));
    expect(hits, `generic God in our voice:\n${hits.join('\n')}`).toEqual([]);
    expect(ours).toMatch(/Yahweh/);
  });
  it('the KJV’s own God and LORD survive inside the quotations', () => {
    const { spans } = quotedSpans(l);
    expect(spans.some((s) => /\bGod\b/.test(s))).toBe(true);
    expect(spans.some((s) => /\bLORD\b/.test(s))).toBe(true);
  });
});
