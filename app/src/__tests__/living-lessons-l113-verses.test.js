// =============================================================================
// L113 — "The spirit indeed is willing, but the flesh is weak": telling the two
// apart, ruling your own spirit, and the long work Yahweh has given His time to.
// Verbatim KJV.
// =============================================================================
// Captured from Darrell's question 2026-08-31 — explain the verse; how do we make
// sure we are using the spirit and not the flesh; how do we tell them apart; how
// do we strengthen the spirit framework with honest caveats about what science
// measures and about souls living inside a flesh suit; what should we expect; and
// what has Yahweh been doing and giving His time to through the ages, so we can
// support His Will and all win? With his own additions mid-build: negativity and
// not ruling the spirit; analysis, timelines and relationships inside AND outside
// Scripture; Word first, quiet the noise with Yahweh's Will; context.
//
// The three things this lesson had to get right, and which are pinned here:
//   • CONTEXT. The verse is normally quoted stripped of Gethsemane, which is how
//     it became an excuse. It opens with an imperative and is followed by a
//     compassionate observation of real exhaustion.
//   • THE BODY, HONESTLY (DR-0100 tiers). Tier 1 fact stated plainly and
//     answered by the Word first (Psalm 103:14; Elijah fed and rested BEFORE he
//     was questioned); the determinist over-reach corrected without discarding
//     the true data under it; the mind-over-matter counterfeit answered too.
//   • THE WORD IS SENIOR (DR-0098). The outside conversation is NAMED only to
//     educate past it — never staged as a co-equal view for the reader to pick.
//
// The whole-span gate from L112 rides again here: no quoted span in this lesson
// may differ from the in-repo KJV by a single character. Authoring L113 produced
// two more real in-quote alterations (a sentence period pulled inside "Watch and
// pray." and inside "willing.") plus eight places where our OWN prose was wearing
// Scripture's quotation marks — all caught by that sweep and fixed.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll113-the-spirit-is-willing-but-the-flesh-is-weak-telling-them-apart-ruling-your-spirit-and-yahwehs-long-work';
const start = src.indexOf(`id: '${ID}'`);
// Bound the slice to THIS lesson. It previously ran to the END of the array,
// so every lesson added after this one was silently swept by this file's
// gates — checks written for one lesson judging another's prose. Each
// lesson carries its own verses test; this one tests only its own.
const l = (() => {
  const rest = src.slice(start);
  const nextLesson = rest.indexOf("\n  {\n    id: 'll");
  const arrayEnd = rest.indexOf('\n  },\n];');
  const ends = [nextLesson, arrayEnd].filter((i) => i > -1);
  return ends.length ? rest.slice(0, Math.min(...ends)) : rest;
})();

const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const verse = (book, ch, v) => JSON.parse(readFileSync(join(KJV_DIR, `${book}.json`), 'utf8')).chapters[ch - 1][v - 1];

const WHOLE_KJV = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json'))) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;   // index.json is not a book
    for (const ch of j.chapters) all += `${ch.join('\n')}\n`;
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

const QUOTED_FRAGMENTS = [
  'the spirit indeed is willing, but the flesh is weak',                     // Matt 26:41
  'What, could ye not watch with me one hour?',                             // Matt 26:40
  'for their eyes were heavy',                                              // Matt 26:43
  'The spirit truly is ready, but the flesh is weak',                       // Mark 14:38
  'your whole spirit and soul and body be preserved blameless',             // 1 Thess 5:23
  'breathed into his nostrils the breath of life; and man became a living soul', // Gen 2:7
  'piercing even to the dividing asunder of soul and spirit',               // Heb 4:12
  'we have this treasure in earthen vessels',                               // 2 Cor 4:7
  'though our outward man perish, yet the inward man is renewed day by day', // 2 Cor 4:16
  'For he knoweth our frame; he remembereth that we are dust',              // Ps 103:14
  'Arise and eat; because the journey is too great for thee',               // 1 Kgs 19:7
  'Walk in the Spirit, and ye shall not fulfil the lust of the flesh',      // Gal 5:16
  'these are contrary the one to the other',                                // Gal 5:17
  'hatred, variance, emulations, wrath, strife, seditions, heresies',       // Gal 5:20
  'the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith', // Gal 5:22
  'Meekness, temperance: against such there is no law',                     // Gal 5:23
  'to be carnally minded is death; but to be spiritually minded is life and peace', // Rom 8:6
  'if ye through the Spirit do mortify the deeds of the body, ye shall live', // Rom 8:13
  'For as many as are led by the Spirit of God, they are the sons of God',  // Rom 8:14
  'the flesh profiteth nothing',                                            // John 6:63
  'But the natural man receiveth not the things of the Spirit of God',      // 1 Cor 2:14
  'He that hath no rule over his own spirit is like a city that is broken down, and without walls', // Prov 25:28
  'he that ruleth his spirit than he that taketh a city',                   // Prov 16:32
  'Death and life are in the power of the tongue',                          // Prov 18:21
  'A merry heart doeth good like a medicine: but a broken spirit drieth the bones', // Prov 17:22
  'we were in our own sight as grasshoppers, and so we were in their sight', // Num 13:33
  'as ye have spoken in mine ears, so will I do to you',                    // Num 14:28
  'because he had another spirit with him, and hath followed me fully',      // Num 14:24
  'Let no corrupt communication proceed out of your mouth',                 // Eph 4:29
  'Let all bitterness, and wrath, and anger, and clamour, and evil speaking, be put away from you', // Eph 4:31
  'whatsoever things are true, whatsoever things are honest',               // Phil 4:8
  'make not provision for the flesh, to fulfil the lusts thereof',          // Rom 13:14
  'he that soweth to his flesh shall of the flesh reap corruption',         // Gal 6:8
  'be ye transformed by the renewing of your mind',                         // Rom 12:2
  'building up yourselves on your most holy faith, praying in the Holy Ghost', // Jude 1:20
  'to be strengthened with might by his Spirit in the inner man',           // Eph 3:16
  'But I keep under my body, and bring it into subjection',                 // 1 Cor 9:27
  'they that wait upon the LORD shall renew their strength',                // Isa 40:31
  'will with the temptation also make a way to escape',                     // 1 Cor 10:13
  'Create in me a clean heart, O God; and renew a right spirit within me',  // Ps 51:10
  'Not by might, nor by power, but by my spirit, saith the LORD of hosts',  // Zech 4:6
  'For the good that I would I do not: but the evil which I would not, that I do', // Rom 7:19
  'O wretched man that I am! who shall deliver me from the body of this death?', // Rom 7:24
  'he which hath begun a good work in you will perform it',                 // Phil 1:6
  'For it is God which worketh in you both to will and to do of his good pleasure', // Phil 2:13
  'I will put my law in their inward parts, and write it in their hearts',  // Jer 31:33
  'A new heart also will I give you, and a new spirit will I put within you', // Ezek 36:26
  'I will pour out my spirit upon all flesh',                               // Joel 2:28
  'But when the fulness of the time was come, God sent forth his Son',      // Gal 4:4
  'longsuffering to us-ward, not willing that any should perish',           // 2 Pet 3:9
  'the goodness of God leadeth thee to repentance',                         // Rom 2:4
  'though it tarry, wait for it; because it will surely come, it will not tarry', // Hab 2:3
  'It is not for you to know the times or the seasons',                     // Acts 1:7
  'whose mind is stayed on thee: because he trusteth in thee',              // Isa 26:3
];

describe('L113 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of [
      'bigIdea:', 'inApp:',
      "ref: 'Matthew 26:41; Galatians 5:16-17; Proverbs 25:28'",
      'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:',
    ]) {
      expect(l).toContain(key);
    }
  });

  it('is registered in the live series and the painted week count is the real one', () => {
    const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
    expect(m, 'L113 must be in LIVING_LESSONS_MODULES').toBeTruthy();
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(5);
    expect(m.benefits.length).toBeGreaterThanOrEqual(6);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(5);
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('teaches the whole arc in order — context, frame, caveat, test, negativity, framework, expectation, ages', () => {
    const order = [
      '1) THE CONTEXT - WHERE AND TO WHOM JESUS SAID IT',
      '2) THE THREE-PART FRAME',
      '3) THE FLESH IS REAL',
      '4) HOW TO TELL THE TWO APART',
      '5) NEGATIVITY AND THE UNRULED SPIRIT',
      '6) HOW TO STRENGTHEN THE SPIRIT',
      '7) WHAT TO EXPECT',
      '8) THE AGES',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('answers every part of the question that was actually asked', () => {
    expect(l).toContain('Darrell');
    expect(l, 'the diagnosis-with-prescription reading').toMatch(/diagnosis/i);
    expect(l, 'the flesh-suit frame').toMatch(/flesh suit|vessel/i);
    expect(l, 'the differentiator').toContain('FRUIT');
    expect(l, 'negativity, which he added mid-build').toMatch(/NEGATIVITY/);
    expect(l, 'ruling your own spirit').toContain('rule over his own spirit');
    expect(l, 'what to expect').toMatch(/WHAT TO EXPECT/);
    expect(l, 'the ages Yahweh has given His time to').toMatch(/THE AGES/);
    expect(l, 'supporting His Will').toMatch(/His Will/);
  });

  it('holds the three-tier honesty about the body — and never shames it (DR-0100)', () => {
    // tier 1 stated plainly, and grounded in the Word FIRST
    expect(l).toContain('For he knoweth our frame; he remembereth that we are dust');
    expect(l).toContain('Arise and eat; because the journey is too great for thee');
    // the over-reach corrected, with the true data under it left standing
    expect(l).toMatch(/over-reach/i);
    expect(l).toContain('mortify the deeds of the body');
    // the formula that keeps both halves true
    expect(l).toMatch(/body REPORTS/);
  });

  it('keeps the Word senior — the outside conversation is named to educate past it (DR-0098)', () => {
    expect(l).toMatch(/Word first/i);
    expect(l).toMatch(/never staged as|educated past|educate past/i);
  });

  it('keeps our authored voice on Yahweh, with no capitalized adversary name', () => {
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bSatan\b/g) || []).length).toBe(0);
    expect((ours.match(/\bLucifer\b/g) || []).length).toBe(0);
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(15);
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    it(`quotes verbatim: "${frag.slice(0, 48)}${frag.length > 48 ? '…' : ''}"`, () => {
      expect(l).toContain(frag);
    });
  }
});

describe('NO in-quote alteration anywhere in the lesson — the whole-span gate', () => {
  it('the lesson\'s double quotes are balanced', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span appears verbatim in the in-repo KJV', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length).toBeGreaterThan(120);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((s) => s.trim()).filter(Boolean)) {
        if (!WHOLE_KJV.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('is PROVEN-TO-CATCH against the alterations actually made while authoring THIS lesson', () => {
    // the sentence period pulled inside the quotation
    expect(WHOLE_KJV.includes('Watch and pray.')).toBe(false);
    expect(WHOLE_KJV.includes('Watch and pray')).toBe(true);
    expect(WHOLE_KJV.includes('willing.')).toBe(false);
    expect(WHOLE_KJV.includes('willing')).toBe(true);
    // and our own prose wearing Scripture's quotation marks
    expect(WHOLE_KJV.includes('walking in the flesh')).toBe(false);
  });
});

describe('every age level carries the message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };

  it('each band carries the verse, the body-is-real mercy, and the fruit test', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the verse`).toMatch(/the flesh is weak/);
      expect(t, `${band} carries the body honestly`).toMatch(/knoweth our frame|Arise and eat|1 Kings 19/);
      expect(t, `${band} carries the fruit test`).toMatch(/fruit of the Spirit|Galatians 5:2[23]/);
    }
  });

  it('each band carries negativity and Caleb’s another spirit — the part he added', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the unruled spirit`).toMatch(/rule over his own spirit|Proverbs 25:28/);
      expect(t, `${band} carries another spirit`).toMatch(/another spirit/);
    }
  });

  it('teen and senior additionally carry the ages and the supplied willingness', () => {
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t).toMatch(/Jeremiah 31:33|inward parts/);
      expect(t).toMatch(/2 Peter 3:8|2 Peter 3:9|not willing that any should perish|longsuffering/);
    }
  });

  it('the child level teaches without adult weight, and is not a stub', () => {
    const child = level('child');
    expect(child.length).toBeGreaterThan(400);
    expect(child).toMatch(/tired|hungry/);
    expect(child).toContain('another spirit');
  });
});

describe('corpus witness — the pins are re-read from the corpus files themselves', () => {
  it('a representative set matches the repo KJV exactly', () => {
    expect(verse('Matthew', 26, 41)).toBe('Watch and pray, that ye enter not into temptation: the spirit indeed is willing, but the flesh is weak.');
    expect(verse('Mark', 14, 38)).toContain('The spirit truly is ready, but the flesh is weak');
    expect(verse('Psalms', 103, 14)).toBe('For he knoweth our frame; he remembereth that we are dust.');
    expect(verse('1Kings', 19, 7)).toContain('Arise and eat; because the journey is too great for thee');
    expect(verse('1Thessalonians', 5, 23)).toContain('your whole spirit and soul and body');
    expect(verse('Galatians', 5, 22)).toContain('love, joy, peace, longsuffering, gentleness, goodness, faith');
    expect(verse('Proverbs', 25, 28)).toBe('He that hath no rule over his own spirit is like a city that is broken down, and without walls.');
    expect(verse('Numbers', 13, 33)).toContain('we were in our own sight as grasshoppers');
    expect(verse('Numbers', 14, 24)).toContain('because he had another spirit with him');
    expect(verse('Jeremiah', 31, 33)).toContain('write it in their hearts');
    expect(verse('Ezekiel', 36, 26)).toContain('A new heart also will I give you');
    expect(verse('2Peter', 3, 9)).toContain('not willing that any should perish');
  });
});
