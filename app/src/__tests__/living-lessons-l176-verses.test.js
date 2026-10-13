// @vitest-environment node
// =============================================================================
// L176 — Faith Is the Substance and the Evidence, and He Made Me Then Died for
// Me. Every verse verbatim, every band carrying the whole teaching, and the
// definition held where the age argues with it.
// =============================================================================
// Darrell spoke this in three pieces and marked it a lesson:
//   "Faith is the substance of things hoped for, evidence of things not seen,
//    and Yahweh loves it."
//   "Without faith it is impossible to please Yahweh."
//   "He made me and then died for me, so I want to please Him -- why not --
//    and I'm sure it'll be the best."
//
// THE FIVE THINGS THIS LESSON COULD MOST EASILY HAVE GOT WRONG:
//
//   1. FAITH TAUGHT AS A FEELING. Hebrews 11:1 gives two NOUNS, both of them
//      from building and from law. A band that landed on warmth would have
//      taught the opposite of the verse it quotes, so every band must say what
//      the sentence does NOT contain.
//   2. THE OBJECTION DODGED. "Faith is belief without evidence" is the thing
//      the reader will actually be handed. It is answered by the definition
//      itself -- faith IS the evidence -- so every band must name the objection
//      rather than teach around it.
//   3. GULLIBILITY TAUGHT BY ACCIDENT. The single easiest failure of a faith
//      lesson. 1 John 4:1 and 1 Thessalonians 5:21 come from the same hand to
//      the same reader, and every band must carry both and say so.
//   4. FAITH AS A QUANTITY TO ACCUMULATE. The apostles asked for MORE and He
//      answered with a grain of mustard seed. Every band must carry the size
//      teaching AND the connection reading, or a reader on a hard day concludes
//      he is disqualified.
//   5. A TECHNIQUE FOR GETTING THINGS. Hebrews 11 closes on people whose
//      promise never arrived and calls it a good report. Every band carries
//      that half, the child band included -- it is the half the grieving
//      reader came for.
//
// Check-writing rules in force, each already paid for: every claim check reads
// OUR prose with quotations AND their reference parentheses stripped, so no
// check can be answered by the verse sitting beside the claim; no alternation
// branch is a title keyword (faith, substance, evidence, made, died are ALL
// title keywords here, so none is ever the sole evidence for a claim); one
// claim per test; and every quoted span in the WHOLE module -- benefits, quiz
// options, explanations, talking points -- is walked, not only the five reader
// texts (the DR-0483 blind spot).
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import { ourProseOnly, fleschKincaidGrade, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { formatLessonText } from '../lib/lesson-format.js';
import fullLevels from '../lib/full-levels-baseline.json';
import readingLevel from '../lib/reading-level-baseline.json';
import titleNarrative from '../lib/title-in-narrative-baseline.json';
import quotationIntegrity from '../lib/quotation-integrity-baseline.json';
import bandDiff from '../lib/band-differentiation-baseline.json';

const ID = 'll176-faith-is-the-substance-and-the-evidence-and-he-made-me-then-died-for-me';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];
const TEXTS = { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) };
const ALL = Object.keys(TEXTS);
const READER = { lesson: L.lesson, bigIdea: L.bigIdea, inApp: L.inApp, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) };

// STRICT is whitespace-only; apostrophes are NEVER normalised, or "children's"
// silently passes for the corpus's typographic apostrophe and the quotation is
// not His.
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const cache = new Map();
const load = (book) => {
  const k = String(book).replace(/\s+/g, '');
  if (!cache.has(k)) { const p = join(KJV, `${k}.json`); cache.set(k, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null); }
  return cache.get(k);
};
const versesOf = (book, ch, label) => {
  const bk = load(book); if (!bk) return null;
  const chap = bk.chapters[Number(ch) - 1]; if (!chap) return null;
  const nums = [];
  for (const part of String(label).split(',')) {
    const p = part.trim(); if (!p) continue;
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) for (let i = Number(m[1]); i <= Number(m[2]); i += 1) nums.push(i); else nums.push(Number(p));
  }
  const parts = nums.map((n) => chap[n - 1]);
  return parts.some((x) => x == null) ? null : parts.join(' ');
};
const SPAN_WITH_REF = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g;
const spansOf = (text) => {
  const out = []; SPAN_WITH_REF.lastIndex = 0; let m;
  while ((m = SPAN_WITH_REF.exec(text))) out.push({ quote: m[1], book: m[2].trim(), ch: m[3], vs: m[4].trim() });
  return out;
};
const walkStrings = (node, path, fn) => {
  if (typeof node === 'string') fn(node, path);
  else if (Array.isArray(node)) node.forEach((v, i) => walkStrings(v, `${path}[${i}]`, fn));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walkStrings(v, path ? `${path}.${k}` : k, fn);
};

// OUR prose: quotations out FIRST, then the reference parentheses.
const ALL_SPANS = /"[^"]*"/g;
const REF_PARENS = /\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\)/g;
const ours = (text) => String(text).replace(ALL_SPANS, ' ').replace(REF_PARENS, ' ');
const OURS = Object.fromEntries(ALL.map((k) => [k, ours(TEXTS[k])]));

// The movement count each band actually renders, MEASURED and pinned per band.
// Not "at least N": lesson-format.js only promotes a standalone caps clause of
// 2-9 words that heads real prose, so a heading that runs long, carries an em
// dash, or sits glued behind a reference parenthesis is silently dropped from
// the page while every other gate stays green. Seven of the adult band's
// movements were invisible that way in the first draft, and three of the
// senior band's. Pinned so a reworded heading fails here instead of vanishing.
const SECTIONS = { adult: 17, child: 16, youth: 17, teen: 17, senior: 22 };

// The twenty-five things this lesson must TEACH, each read from our prose
// alone. Every one of them lands in all five texts, measured before the check
// was written rather than after.
const CLAIMS = [
  ['the definition contains no feeling', /not say faith is a feeling|is a feeling, a mood|not a feeling|no feeling|nothing in it about how you feel|declines to say/i],
  ['substance is what a thing is made of', /made of|made out of|material/i],
  ['evidence belongs to a hearing', /hearing|courtroom|contested|challenged|show somebody|produce when|proof you can show/i],
  ['the objection is named', /without proof|without evidence|no proof|belief without/i],
  ['faith is a faculty of understanding', /UNDERSTAND/],
  ['the rewarder half is carried in our words', /expects nothing|arithmetic|bookkeeping|thrown into a void|goes somewhere|terminates somewhere|rewards people who really look|no longer do business/i],
  ['diligence rules out waiting to be impressed', /waiting to be impressed|wait to be impressed|waiting around to be impressed|really look for Him|seeking is real|excludes the posture/i],
  ['faith arrives rather than being generated', /it comes|arrives|by a stated route|squeeze faith out of yourself|do not make it/i],
  ['the honest man brought both halves', /both halves|both at once|not rebuked|AND help me where I do not|did not tell him off/i],
  ['the amount is a joke', /joke|so small|almost nothing|a seed|tiny/i],
  ['faith is a connection rather than a quantity', /connection/i],
  ['credulity is separated from faith', /credulity|gullib|believe anything|believe everyone|believe every/i],
  ['both instructions come from the same hand', /same Author|same hand|issued together|same book|same Person who|together, by the same/i],
  ['a faith that changed nothing was not substance', /changed nothing|never the substance|altered nothing|you can see it|shows on the outside|somebody can see/i],
  ['the trial is an assay', /assay|reading the metal|to prove it is real|what a material genuinely is|what a thing is/i],
  ['the making was written down first', /before there (?:was|were)|before any of them|before you were born|before there existed/i],
  ['the dying happened while we were yet sinners', /while we were yet|not after we|before we (?:got|were) better|not after anybody cleaned/i],
  ['the Maker and the One who died are one', /same Person|one Person|not two|the same One|same Somebody/i],
  ['his question is asked back', /why not/i],
  ['pleasing Him is not a purchase', /payment plan|purchase|instalment|not buying|buying anything|not a payment/i],
  ['taste comes before see', /taste, (?:and )?then see|taste precedes see|taste first|taste, then/i],
  ['the seeing is partial for now', /partial|only see a part|not all of it yet|see a little now/i],
  ['the object cannot lie', /cannot lie|impossible for Him to lie|He does not lie/i],
  ['the promise did not always arrive in a lifetime', /did not arrive|never arrived|not having received|still outstanding|did not come in|never got it|never got what|did not get what/i],
  ['the blessing is spoken over those who never saw', /beatitude|blessing|blessed/i],
];

describe('L176 — the shape of the lesson', () => {
  it('is mounted, and the painted week count moved with it', () => {
    expect(L, `${ID} is not in the series`).toBeTruthy();
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('carries all four age bands', () => {
    for (const b of BANDS) expect(String(L.levels[b] || '').trim().length, `${b} is empty`).toBeGreaterThan(400);
  });

  it('has no band below the coverage floor', () => {
    expect(shortBands(measureFullness(L))).toEqual([]);
  });

  it('adds no entry to the coverage debt', () => {
    expect(Object.keys(fullLevels.short)).not.toContain(ID);
  });

  it('adds no entry to the reading-level debt', () => {
    expect(readingLevel.inverted).not.toContain(ID);
    expect(readingLevel.childOverCeiling).not.toContain(ID);
  });

  it('adds no entry to the title-in-narrative debt', () => {
    expect(Object.keys(titleNarrative.unnamed)).not.toContain(ID);
  });

  it('adds no entry to the quotation debt', () => {
    expect(Object.keys(quotationIntegrity.elided)).not.toContain(ID);
    expect(Object.keys(quotationIntegrity.recited)).not.toContain(ID);
  });

  it('runs a monotone reading ladder from child to senior', () => {
    const g = (b) => fleschKincaidGrade(ourProseOnly(L.levels[b]));
    expect(g('teen'), 'teen does not read above child').toBeGreaterThan(g('child'));
    expect(g('senior'), 'senior does not read above teen').toBeGreaterThan(g('teen'));
  });

  it('keeps the child band under the ceiling a NEW lesson is held to', () => {
    expect(fleschKincaidGrade(ourProseOnly(L.levels.child))).toBeLessThan(NEW_LESSON_CHILD_CEILING);
  });

  it('opens every band on the name of its own lesson', () => {
    expect(unnamedBands(L)).toEqual([]);
  });

  it('writes four DIFFERENT bands rather than one repeated four times', () => {
    // The DR-0484 measure, applied to a lesson on the day it is written rather
    // than to a debt discovered later. Every pair well under the ceiling, and
    // the lesson absent from the duplication baseline.
    const m = measureDifferentiation(L);
    expect(m, 'the lesson is not being measured at all').toBeTruthy();
    expect(m.worst, `bands too alike: ${JSON.stringify(m.pairs)}`).toBeLessThan(DIFF_CEILING);
    expect(Object.keys(bandDiff.duplicated)).not.toContain(ID);
  });

  it('renders every movement the author wrote, in every band', () => {
    for (const k of ALL) {
      expect(formatLessonText(TEXTS[k]).sectionCount, `${k} lost a movement to the renderer`).toBe(SECTIONS[k]);
    }
  });

  it('the section pin can SEE a heading the renderer drops (proven-to-catch)', () => {
    // The break, made here rather than trusted: lengthen a heading past the
    // nine-word window and the renderer stops promoting it. If this ever stops
    // reporting a loss, the pin above is measuring nothing.
    const broken = TEXTS.senior.replace('A GRAIN IS ENOUGH.', 'A GRAIN OF MUSTARD SEED IS ALTOGETHER ENOUGH FOR THE PURPOSE.');
    expect(broken).not.toBe(TEXTS.senior);
    expect(formatLessonText(broken).sectionCount).toBeLessThan(SECTIONS.senior);
  });

  it('keeps every rendered chunk inside the house wall', () => {
    for (const k of ALL) {
      const lens = formatLessonText(TEXTS[k]).items.map((i) => String(i.text || i.body || '').length);
      expect(Math.max(...lens), `${k} has a chunk over the 420-character wall`).toBeLessThanOrEqual(420);
    }
  });

  it('carries the authored furniture a lesson is read and run from', () => {
    expect(L.benefits.length).toBe(15);
    expect(L.quiz.questions.length).toBe(15);
    expect(L.facilitator.talkingPoints.length).toBe(10);
    for (const q of L.quiz.questions) {
      expect(q.options.length, `${q.q.slice(0, 40)} does not offer three options`).toBe(3);
      expect(q.options[q.answer], 'the answer index points at nothing').toBeTruthy();
    }
  });
});

describe('L176 — His words, exactly as He said them', () => {
  it('quotes every referenced span in the WHOLE module verbatim, not only the reader texts', () => {
    const bad = [];
    walkStrings(L, '', (node, path) => {
      for (const s of spansOf(node)) {
        const text = versesOf(s.book, s.ch, s.vs);
        if (text == null) { bad.push(`${path}: ${s.book} ${s.ch}:${s.vs} does not resolve`); continue; }
        if (!norm(text).includes(norm(s.quote))) bad.push(`${path}: ${s.book} ${s.ch}:${s.vs} — ${s.quote.slice(0, 60)}`);
      }
    });
    expect(bad, `spans that are not His words, anywhere in the module:\n${bad.join('\n')}`).toEqual([]);
  });

  it('the verbatim walk can SEE a corrupted quotation (proven-to-catch)', () => {
    // The real catch this check already made: the first draft wrote Luke 17:6
    // as "a grain of a mustard seed" — one word the KJV does not carry, in ten
    // places including a benefit and a quiz explanation. The reader texts alone
    // would have hidden four of them.
    const corrupted = 'and he said, "If ye had faith as a grain of a mustard seed" (Luke 17:6) said He';
    const s = spansOf(corrupted)[0];
    expect(norm(versesOf(s.book, s.ch, s.vs)).includes(norm(s.quote))).toBe(false);
  });

  it('leaves no quoted span unreferenced ANYWHERE in the module', () => {
    const bad = [];
    walkStrings(L, '', (node, path) => {
      const re = /"([^"]+)"(\s*\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\))?/g;
      let m;
      while ((m = re.exec(node))) if (!m[2]) bad.push(`${path}: ${m[1].slice(0, 60)}`);
    });
    expect(bad, `quoted spans carrying no reference:\n${bad.join('\n')}`).toEqual([]);
  });

  it('carries no ellipsis inside a quotation in the WHOLE module', () => {
    const found = [];
    walkStrings(L, '', (node, path) => {
      for (const q of node.match(/"[^"]*(?:\.\.\.|…)[^"]*"/g) || []) found.push(`${path}: ${q}`);
    });
    expect(found, `elided quotations:\n${found.join('\n')}`).toEqual([]);
  });

  it('claims no paraphrase anywhere in the module', () => {
    const found = [];
    walkStrings(L, '', (node, path) => { if (/paraphras/i.test(node)) found.push(path); });
    expect(found, `fields claiming a paraphrase: ${found.join(', ')}`).toEqual([]);
  });

  it('never capitalises an adversary name anywhere in the module', () => {
    const found = [];
    walkStrings(L, '', (node, path) => {
      for (const bad of ['Satan', 'Lucifer', 'The Devil', 'The Adversary', 'The Accuser', 'The Deceiver', 'Baal']) {
        if (node.includes(bad)) found.push(`${path}: ${bad}`);
      }
    });
    expect(found, `capitalised adversary names:\n${found.join('\n')}`).toEqual([]);
  });

  it('says Yahweh in its own prose in every reader field', () => {
    for (const [k, v] of Object.entries(READER)) {
      expect(ours(v), `${k} never names Him by His covenant name in our own voice`).toMatch(/Yahweh/i);
    }
  });

  it('never says the generic name in its own prose in any reader field', () => {
    const bad = [];
    for (const [k, v] of Object.entries(READER)) {
      for (const m of ours(v).match(/.{0,24}\bGod\b.{0,16}/g) || []) {
        if (!/of God|word of God|will of God|Son of God/.test(m)) bad.push(`${k}: ${m.trim()}`);
      }
    }
    expect(bad, `generic uses in our own prose:\n${bad.join('\n')}`).toEqual([]);
  });

  it('leaves the KJV generic name untouched inside its quotations (DR-0076 bright line)', () => {
    // Our prose says Yahweh; His quoted text is never edited to match. Both
    // halves are asserted, because a blind sweep would break the second.
    for (const k of ALL) {
      expect(TEXTS[k], `${k} has scrubbed the KJV's own wording`).toContain('Behold the Lamb of God, which taketh away the sin of the world');
    }
  });

  it('recites no record id to the reader', () => {
    for (const [k, v] of Object.entries(READER)) expect(v, `${k} recites a record id`).not.toMatch(/DR-\d{4}/);
  });

  it('names every anchor reference somewhere the reader meets it', () => {
    const body = [L.lesson, L.bigIdea, ...BANDS.map((b) => L.levels[b]), ...L.benefits].join(' ');
    const missing = L.anchor.ref.split(';').map((s) => s.trim()).filter((r) => r && !body.includes(r));
    expect(missing, `anchors never named: ${missing.join(', ')}`).toEqual([]);
  });
});

describe('L176 — the verses the whole lesson rests on are in every band', () => {
  const REQUIRED = [
    ['the definition', 'Now faith is the substance of things hoped for, the evidence of things not seen'],
    ['the framing of the worlds', 'Through faith we understand that the worlds were framed by the word of God'],
    ['the impossibility and its reason', 'for he that cometh to God must believe that he is, and that he is a rewarder of them that diligently seek him'],
    ['where faith comes from', 'So then faith cometh by hearing, and hearing by the word of God'],
    ['the honest father', 'Lord, I believe; help thou mine unbelief'],
    ['the mustard seed', 'If ye have faith as a grain of mustard seed'],
    ['try the spirits', 'believe not every spirit, but try the spirits whether they are of God'],
    ['prove all things', 'Prove all things; hold fast that which is good'],
    ['faith without works', 'Even so faith, if it hath not works, is dead, being alone'],
    ['the trial by fire', 'though it be tried with fire'],
    ['the making, written first', 'in thy book all my members were written'],
    ['by Him all things consist', 'and by him all things consist'],
    ['the timing of the dying', 'while we were yet sinners, Christ died for us'],
    ['the Lamb', 'Behold the Lamb of God, which taketh away the sin of the world'],
    ['the Father to the Son', 'But unto the Son he saith, Thy throne, O God, is for ever and ever'],
    ['not of works', 'For by grace are ye saved through faith'],
    ['taste and see', 'O taste and see that the LORD is good'],
    ['through a glass, darkly', 'For now we see through a glass, darkly'],
    ['He cannot lie', 'in which it was impossible for God to lie'],
    ['the half nobody quotes', 'These all died in faith, not having received the promises'],
    ['blessed who have not seen', 'blessed are they that have not seen, and yet have believed'],
  ];
  for (const [what, span] of REQUIRED) {
    it(`carries ${what} in every band`, () => {
      for (const k of ALL) expect(TEXTS[k], `${k} is missing ${what}`).toContain(span);
    });
  }
});

describe('L176 — what the lesson must TEACH, read from our prose alone', () => {
  for (const [what, re] of CLAIMS) {
    it(what, () => {
      const missing = ALL.filter((k) => !re.test(OURS[k]));
      expect(missing, `${what} — absent from: ${missing.join(', ')}`).toEqual([]);
    });
  }

  it('the claim checks read OUR words, never the verse beside them (proven-to-catch)', () => {
    // The check that keeps every check above honest. "rewarder" is a word of
    // the QUOTATION; a claim check that could be answered by it would pass on a
    // band that quoted Hebrews 11:6 and taught nothing about it.
    expect(TEXTS.adult).toContain('rewarder of them that diligently seek him');
    expect(OURS.adult.includes('rewarder of them that diligently seek him')).toBe(false);
  });
});
