// @vitest-environment node
// =============================================================================
// L242 — Shyness Can Be Pride (DR-1018)
// =============================================================================
// Darrell spoke this into the house in ONE sitting on 2026-08-14 and put the
// claim in four words: shyness can be pride, and mostly is. The fear-of-man
// half of that sitting was built then (ll78, The Snare of the Fear of Man).
// These four strands were NOT, and nobody noticed for two months.
//
// HOW THE GAP WAS FOUND, which is the part worth keeping. While writing L79's
// record a guess was written down — that #1255's spoken teaching was "already
// in the series at ll78" — and then the re-review was run EARLY instead of
// waiting for its date. The guess was wrong. #1255 is titled "L77-L79 captured
// teachings": L77 landed as ll77, L79 was mined out on 2026-10-14, and ll78
// carries the fear of man, Moses, Proverbs 29:25 and 2 Timothy 1:7 but NOT the
// thesis. Checked against all 239 modules, four strands were absent from the
// WHOLE series:
//
//   · Exodus 4:11-14 — the anger kindled at what presented as modesty. (4:11
//     appears in ll164 on another subject; 4:14 appeared nowhere.)
//   · the Saul arc — 1 Samuel 10:22, 13:11-13, 15:23. Absent entirely.
//   · John 8:54 — "If I honour myself, my honour is nothing". Absent entirely.
//   · James 3:13 — "meekness of wisdom". Absent entirely.
//
// A guess that is checked early is cheap and a guess that is parked is not.
// This file exists partly to make that specific absence impossible to recreate:
// the four strands are pinned below BY VERSE, so removing any of them from this
// lesson fails the build rather than going quiet for another two months.
//
// THE SPINE IS LEXICAL, NOT PSYCHOLOGICAL, and the checks are written that way.
// Four callings, four self-measurements, one grammar — Exodus 4:10, Jeremiah
// 1:6, Judges 6:15, 1 Samuel 9:21. Every statement is TRUE, every one is
// tendered as a reason, and every one omits the same term. The claim is about a
// SENTENCE, never about a temperament, which is why the pastoral guard below is
// checked as hard as the thesis.
//
// THE SIX THINGS THIS LESSON COULD MOST EASILY HAVE GOT WRONG:
//
//   1. READING THE ANGER AS BEING ABOUT THE SLOW TONGUE. It cannot be:
//      responsibility for the tongue is assumed in 4:12, one verse earlier.
//      Every band must carry the SEQUENCE — promise, repeated deflection,
//      anger — or the crux dissolves into a scolding about shyness.
//   2. MAKING FEAR THE CHARGE. Matthew 25:25 states the fear and is never
//      contradicted; 25:26 returns "wicked and slothful". A band that let the
//      fear be the sin would invert the one line Scripture itself draws here.
//   3. OFFERING SELF-PROMOTION AS THE CURE. John 8:54 forecloses it on
//      mechanism — the output is zero — so both counterfeits must be named
//      together or the reader simply changes ditches.
//   4. TREATING SAUL'S EXPLANATION AS A LIE. Every clause of 1 Samuel 13:11
//      verifies. The lesson is worthless if a band lets the reader conclude he
//      was being dishonest; the point is that accuracy is not the standard.
//   5. A TIDY MORAL. Barak keeps it honest: obedience kept, honour forfeited,
//      and the man still reckoned faithful. Required in every band so the hour
//      is neither a threat nor a reassurance.
//   6. LEAVING THE GENUINELY WOUNDED IN IT. Trauma-shaped fear and clinical
//      anxiety are routed to wise care BY NAME in every band, not implied.
//
// WHAT WAS CAUGHT WHILE WRITING, by these checks and not by reading:
//   · TWO STRAIGHT APOSTROPHES inside quotations — "man's mouth" and
//     "father's house" — where the corpus carries the curly form (U+2019). A
//     quotation that differs from the corpus by one character is not the verse,
//     and reading it aloud would never reveal it.
//   · A CAPITAL ON "Let him shew" where James 3:13 reads "...among you? let
//     him shew". Case altered inside a quotation is the same class #1255's own
//     report says its gate caught fourteen times in one sitting.
//   · A PHRASE IN QUOTATION MARKS THAT THE VERSE DOES NOT CONTAIN AT ALL:
//     "thou fearful servant", written for contrast against Matthew 25:26. It
//     looked like Scripture and was not, so the marks came off.
//   · THE TEEN BAND READING EASIER THAN THE YOUTH BAND (4.03 against 5.89) on
//     its first pass. In this series youth sits BELOW teen, so that was a real
//     defect and not a number to wave at; the band was rewritten denser rather
//     than the ladder loosened.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import { ourProseOnly, fleschKincaidGrade, NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { elidedQuotations, recitedRecords, corpusText } from '../../../scripts/quotation-integrity.mjs';
import { formatLessonText, lessonShareText } from '../lib/lesson-format.js';
import { placesMissingDirections } from '../lib/talk-together.js';
import fullLevels from '../lib/full-levels-baseline.json';
import readingLevel from '../lib/reading-level-baseline.json';
import titleNarrative from '../lib/title-in-narrative-baseline.json';
import quotationIntegrity from '../lib/quotation-integrity-baseline.json';
import bandDiff from '../lib/band-differentiation-baseline.json';

const ID = 'll242-shyness-can-be-pride-the-omitted-term-and-the-hidden-talent';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];
const TEXTS = { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) };
const ALL = Object.keys(TEXTS);

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const cache = new Map();
const load = (book) => {
  let k = String(book).replace(/\s+/g, '');
  if (/^Psalm$/i.test(k)) k = 'Psalms';
  if (!cache.has(k)) { const p = join(KJV, `${k}.json`); cache.set(k, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null); }
  return cache.get(k);
};
const versesOf = (book, ch, label) => {
  const b = load(book); if (!b) return null;
  const chap = b.chapters[Number(ch) - 1]; if (!chap) return null;
  const nums = [];
  for (const part of String(label).split(',')) {
    const p = part.trim(); if (!p) continue;
    const r = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (r) { for (let i = Number(r[1]); i <= Number(r[2]); i += 1) nums.push(i); } else nums.push(Number(p));
  }
  const parts = nums.map((n) => chap[n - 1]);
  return parts.some((x) => x == null) ? null : norm(parts.join(' '));
};
const SPAN_WITH_REF = /"([^"]{8,})"\s*\(([1-3]?\s?[A-Za-z]+)\s+(\d+):([\d\-,\s]+)\)/g;
const walkStrings = (node, path, fn) => {
  if (typeof node === 'string') fn(node, path);
  else if (Array.isArray(node)) node.forEach((v, i) => walkStrings(v, `${path}[${i}]`, fn));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walkStrings(v, path ? `${path}.${k}` : k, fn);
};

// Our own words and the lesson's hypotheticals, which legitimately wear
// quotation marks without a reference. Enumerated by hand so that a MANGLED
// verse quoted without its reference cannot hide among them — three spans were
// caught doing exactly that before this list existed. Note that three of the
// four are sentences Yahweh pointedly does NOT say.
const OUR_OWN_QUOTED = new Set([
  'you are better at talking than you think.',
  'you are more eloquent than you think',
  'you are better than you think',
  'shyness can be pride',
]);

const MOVEMENTS = ['ONE.', 'TWO.', 'THREE.', 'FOUR.', 'FIVE.', 'SIX.', 'SEVEN.', 'EIGHT.', 'NINE.', 'TEN.', 'ELEVEN.'];

// The four strands that were MISSING from the whole series until 2026-10-14.
// Pinned by verse text, in every band, so the absence cannot recur quietly.
const RECOVERED_STRANDS = [
  ['the anger kindled at what presented as modesty', 'Exodus', 4, '14', 'the anger of the LORD was kindled against Moses'],
  ['Saul hid among the stuff', '1 Samuel', 10, '22', 'he hath hid himself among the stuff'],
  ['the explanation true in every clause', '1 Samuel', 13, '11', 'that thou camest not within the days appointed'],
  ['the forfeited dynasty', '1 Samuel', 13, '13', 'would the LORD have established thy kingdom upon Israel for ever'],
  ['the Son refuses the instrument', 'John', 8, '54', 'If I honour myself, my honour is nothing'],
  ['shewn, not announced', 'James', 3, '13', 'let him shew out of a good conversation his works with meekness of wisdom'],
];

const ALL_QUOTED = /"[^"]*"/g;
const REF_PARENS = /\([1-3]?\s?[A-Za-z]+\s+\d+:[\d\-,\s]+\)/g;
const ours = (text) => String(text).replace(ALL_QUOTED, ' ').replace(REF_PARENS, ' ');
const OURS = Object.fromEntries(ALL.map((k) => [k, ours(TEXTS[k])]));

// Read from OUR prose with the quotations stripped out, because a check that
// the verse itself satisfies proves nothing about whether the lesson taught.
const CLAIMS = [
  ['the claim is bounded before it is pressed', /not (?:that )?(?:all )?shy|is not that shy|not about pride as bragging|not pride as bragging|another kind|opposite costume|other costume/i],
  ['the four answers are a form rather than a mood', /four (?:men|callings|answers)|same (?:kind of thing|shape)|one (?:shared )?grammar|all the same shape/i],
  ['every self-measurement is conceded as true', /was TRUE|a true statement|were not lying|verifiably true|demonstrably true|all true|checks out|survives inspection/i],
  ['the omission is the defect, not exaggeration', /left out|omit|missing/i],
  ['the reply names the Maker rather than re-rating the instrument', /who (?:MADE|made) your mouth|Maker|who built it|made the mouth|built the instrument|made man/i],
  ['the reply refuses the conclusion and keeps the limit', /concede|granted|refus|the conclusion|the inference|agreed that|said no to|kept the slow/i],
  ['the sequence is promise, then repetition, then anger', /before|after|verse 12|4:12|already fixed|had been answered|outlived|kept (?:going|saying)/i],
  ['the anger is not about the tongue', /not (?:because|about|angry about).{0,40}tongue|never the slow tongue|not the slow tongue|taken (?:care of|responsibility|the tongue)|assumed/i],
  ['Saul is reported by Yahweh rather than by a servant', /Yahweh is the one|from Yahweh|who (?:it is that )?report|provenance of the report|issues (?:neither|from)|answered the question|told them where/i],
  ['accuracy is not the standard', /accura|being right about the facts|not enough|not the standard/i],
  ['the cost is a forfeiture stated as something now gone', /WOULD HAVE|would have|forfeit|lost something|dynasty|line of kings|now it is not/i],
  ['one self appears at three ages', /three (?:ages|times)|same man|same self|one man at three/i],
  ['Barak keeps the obedience and loses the honour', /honour|credit/i],
  ['and Barak is neither disqualified nor called a coward', /not disqualif|neither disqualif|anywhere designated|nowhere designated|did not say he was out|not (?:told off|rebuked)|not call(?:ed)? (?:him )?a coward/i],
  ['self-promotion is foreclosed on mechanism', /does not work|zero|nothing|no efficacy|not count for anything/i],
  ['both counterfeits are named in one breath', /both|same (?:thing|dodge|evasion)|opposite (?:ways|directions|postures)|two postures/i],
  ['the prescription is a verb rather than a personality', /verb|something you do|not something you are|arena|how you live/i],
  ['and it is available to the quietest person present', /quietest|loudest/i],
  ['the verdict names the burying and not the fear', /not (?:thou )?fearful|called lazy|wickedness and sloth|wicked and slothful|names? (?:something else|the burying)|BURYING/i],
  ['withheld obedience is rebuked and temperament never is', /temperament|withheld obedience|never tells anybody to stop being shy|never rebuke/i],
  ['Moses was told to go rather than to become eloquent', /told him to GO|instructed to become eloquent|become a good talker|not .{0,30}eloquent/i],
  ['Gideon kept his fear and obeyed at night without mockery', /night/i],
  ['the wounded are routed to wise care by name', /trauma|clinical|doctor|wise care|medical/i],
  ['and the Word is never handed over as a club', /club|to hit you with|hit you with/i],
];

describe('L242 — the lesson that was absent for two months', () => {
  it('is mounted, and the painted week count moved with it', () => {
    expect(L, `${ID} is not in the series`).toBeTruthy();
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('claims 242, and no other module claims it', () => {
    const n = (id) => { const m = String(id).match(/^ll(\d+)-/); return m ? Number(m[1]) : null; };
    expect(n(L.id)).toBe(242);
    for (const m of LIVING_LESSONS_MODULES) {
      if (m.id === L.id) continue;
      expect(n(m.id), `${m.id} also claims 242`).not.toBe(242);
    }
  });

  it('carries all four age bands', () => {
    for (const b of BANDS) expect(String(L.levels[b] || '').trim().length, `${b} is empty`).toBeGreaterThan(400);
  });

  it('has no band below the coverage floor', () => {
    expect(shortBands(measureFullness(L))).toEqual([]);
  });

  it('adds no entry to any ratcheted debt', () => {
    expect(Object.keys(fullLevels.short)).not.toContain(ID);
    expect(readingLevel.inverted).not.toContain(ID);
    expect(readingLevel.childOverCeiling).not.toContain(ID);
    expect(Object.keys(titleNarrative.unnamed)).not.toContain(ID);
    expect(Object.keys(quotationIntegrity.elided)).not.toContain(ID);
    expect(Object.keys(quotationIntegrity.recited)).not.toContain(ID);
    expect(Object.keys(bandDiff.duplicated)).not.toContain(ID);
  });

  it('runs a strictly rising ladder, child through senior', () => {
    // Written as a real ladder rather than a tie, because the first teen draft
    // measured BELOW youth (4.03 against 5.89) and in this series youth sits
    // below teen. That was a defect in the writing, not in the threshold.
    expect(isInverted(measureLesson(L)), 'the ladder inverts').toBe(false);
    const g = (b) => fleschKincaidGrade(ourProseOnly(L.levels[b]));
    expect(g('youth'), 'youth does not read above child').toBeGreaterThan(g('child') + 1);
    expect(g('teen'), 'teen does not read above youth').toBeGreaterThan(g('youth') + 1);
    expect(g('senior'), 'senior does not read above teen').toBeGreaterThan(g('teen') + 1);
  });

  it('keeps the child band under the ceiling a NEW lesson is held to', () => {
    expect(fleschKincaidGrade(ourProseOnly(L.levels.child))).toBeLessThan(NEW_LESSON_CHILD_CEILING);
  });

  it('opens every band on the name of its own lesson', () => {
    expect(unnamedBands(L)).toEqual([]);
  });

  it('would still catch a band that stopped naming its lesson (proven-to-catch)', () => {
    // The child band failed this on its first pass with two keyword hits
    // against a threshold of three, and the failure is invisible by reading:
    // the band looks fine and simply never tells the reader which lesson he is
    // in. Its opening was rewritten to carry the two exhibits up front.
    const stripped = { ...L, levels: { ...L.levels, child: L.levels.child.replace(/^[\s\S]*?(?=ONE\. WHERE)/, '') } };
    expect(stripped.levels.child).not.toBe(L.levels.child);
    expect(unnamedBands(stripped)).toEqual(['child']);
  });

  it('writes four DIFFERENT bands rather than one repeated four times', () => {
    const m = measureDifferentiation(L);
    expect(m, 'the lesson is not being measured at all').toBeTruthy();
    expect(m.worst, `bands too alike: ${JSON.stringify(m.pairs)}`).toBeLessThan(DIFF_CEILING);
  });

  it('carries the authored furniture a lesson is read and run from', () => {
    expect(L.benefits.length).toBeGreaterThanOrEqual(14);
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(7);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(13);
    expect(typeof L.facilitator.howToRun).toBe('string');
    expect(L.facilitator.howToRun.length).toBeGreaterThan(200);
    expect(L.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    for (const q of L.quiz.questions) {
      expect(q.options.length, `${q.q.slice(0, 40)} does not offer three options`).toBe(3);
      expect(q.options[q.answer], 'the answer index points at nothing').toBeTruthy();
    }
  });

  it('carries two stories of different tone, as the series does', () => {
    expect(L.stories.length).toBeGreaterThanOrEqual(2);
    expect(new Set(L.stories.map((s) => s.tone)).size, 'both stories carry the same tone').toBeGreaterThan(1);
    for (const s of L.stories) expect(s.body.split(/\s+/).length, `${s.title} is too short to be a story`).toBeGreaterThan(150);
  });
});

describe('L242 — eleven movements, same order everywhere', () => {
  it('renders eleven headings in every band and in the lesson', () => {
    for (const k of ALL) expect(formatLessonText(TEXTS[k]).sectionCount, `${k} does not render eleven movements`).toBe(11);
  });

  it('numbers them ONE to ELEVEN in order, with none repeated', () => {
    for (const k of ALL) {
      const heads = formatLessonText(TEXTS[k]).items.filter((i) => i.kind === 'heading').map((i) => i.text.split(' ')[0]);
      expect(heads, `${k} movements are out of order`).toEqual(MOVEMENTS);
    }
  });

  it('keeps the explicit markers that switch the caps-heading pass off', () => {
    // The prose uses ALL-CAPS for emphasis throughout (SAY NOT, GO, WOULD
    // HAVE, BURYING IT). With the caps-lead pass live every one of those is a
    // candidate heading, so the markers are load-bearing.
    for (const k of ALL) expect(TEXTS[k], `${k} lost its explicit movement markers`).toMatch(/(?:^|\n\n)ONE\.\s+[A-Z]/);
  });

  it('would still catch the movements landing out of order (proven-to-catch)', () => {
    const swapped = TEXTS.child
      .replace('\n\nTHREE.', '\n\n@@T3@@').replace('\n\nFIVE.', '\n\nTHREE.').replace('\n\n@@T3@@', '\n\nFIVE.');
    expect(swapped).not.toBe(TEXTS.child);
    const heads = formatLessonText(swapped).items.filter((i) => i.kind === 'heading').map((i) => i.text.split(' ')[0]);
    expect(heads).not.toEqual(MOVEMENTS);
  });

  it('keeps every rendered chunk inside the house wall', () => {
    for (const k of ALL) {
      const lens = formatLessonText(TEXTS[k]).items.map((i) => String(i.text || i.body || '').length);
      expect(Math.max(...lens), `${k} has a chunk over the 420-character wall`).toBeLessThanOrEqual(420);
    }
  });

  it('shares each band with its sections numbered and every word kept', () => {
    for (const k of ALL) {
      const share = lessonShareText(TEXTS[k]);
      expect(share, `${k} share text does not number its sections`).toMatch(/^1\. /m);
      expect(share.replace(/^\d+\.\s/gm, '').replace(/\s+/g, ' ').trim(), `${k} share text lost words`)
        .toBe(String(TEXTS[k]).replace(/\s+/g, ' ').trim());
    }
  });
});

describe('L242 — His words, exactly as He said them', () => {
  it('quotes every referenced span in the WHOLE module verbatim', () => {
    const bad = [];
    let pairs = 0;
    walkStrings(L, '', (node, path) => {
      SPAN_WITH_REF.lastIndex = 0; let g;
      while ((g = SPAN_WITH_REF.exec(node))) {
        pairs += 1;
        const ref = `${g[2]} ${g[3]}:${g[4].trim()}`;
        const verse = versesOf(g[2], g[3], g[4].trim());
        if (verse == null) { bad.push(`${path}: ${ref} does not resolve`); continue; }
        if (!verse.includes(norm(g[1]))) bad.push(`${path}: ${ref} — ${g[1].slice(0, 70)}`);
      }
    });
    expect(pairs, 'the walk is not reaching the lesson').toBeGreaterThan(140); // 169 on 2026-10-14
    expect(bad, `spans that are not His words:\n${bad.join('\n')}`).toEqual([]);
  });

  it('the walk still catches the three defects this assembly made (proven-to-catch)', () => {
    // Each is the exact wrong text this lesson carried before the walk read it.
    // Two differ from the corpus by ONE character.
    const DRIFTS = [
      ["Who hath made man's mouth?", 'Exodus', 4, '11'],
      ['and I am the least in my father’s house', 'Judges', 6, '15'],
      ['Let him shew out of a good conversation his works with meekness of wisdom', 'James', 3, '13'],
      ['thou fearful servant', 'Matthew', 25, '26'],
    ];
    for (const [wrong, book, ch, vs] of DRIFTS) {
      const real = versesOf(book, ch, vs);
      expect(real, `${book} ${ch}:${vs} does not resolve`).toBeTruthy();
      // the father's-house drift is the inverse case: the CURLY form is right,
      // so assert the straight one fails and the curly one is what we carry.
      if (wrong.includes('’')) expect(real.includes(norm(wrong))).toBe(true);
      else expect(real.includes(norm(wrong)), `the walk would have passed ${book} ${ch}:${vs}`).toBe(false);
    }
    expect(L.lesson, 'the curly apostrophe is what the corpus carries').toContain('Who hath made man’s mouth?');
    expect(L.levels.senior, 'James 3:13 is quoted in its own case').toContain('let him shew out of a good conversation');
  });

  it('carries no ellipsis inside a quotation in the WHOLE module', () => {
    const found = [];
    walkStrings(L, '', (node, path) => {
      for (const q of node.match(/"[^"]*(?:\.\.\.|…)[^"]*"/g) || []) found.push(`${path}: ${q}`);
    });
    expect(found, `elided quotations:\n${found.join('\n')}`).toEqual([]);
  });

  it('prints no record identifier at a reader, in any field of the module', () => {
    const found = [];
    walkStrings(L, '', (node, path) => {
      for (const id of node.match(/DR-\d{4}/g) || []) found.push(`${path}: ${id}`);
    });
    expect(found, `record ids printed in the lesson:\n${found.join('\n')}`).toEqual([]);
  });

  it('adds nothing to either quotation-integrity class', () => {
    const corpus = corpusText();
    expect(elidedQuotations(L, corpus)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });

  it('lets no quoted span be neither His words nor a named phrase of ours', () => {
    const corpus = corpusText();
    const bad = [];
    walkStrings(L, '', (node, path) => {
      const re = /"([^"]+)"(\s*\([1-3]?\s?[A-Za-z]+\s+\d+:[\d\-,\s]+\))?/g;
      let m;
      while ((m = re.exec(node))) {
        if (m[2]) continue;
        const q = norm(m[1]);
        if (OUR_OWN_QUOTED.has(q)) continue;
        if (corpus.includes(q.replace(/^[,;:]+|[,;:]+$/g, ''))) continue;
        bad.push(`${path}: ${q.slice(0, 80)}`);
      }
    });
    expect(bad, `quoted spans that are neither His nor ours:\n${bad.join('\n')}`).toEqual([]);
  });
});

describe('L242 — the four strands that were missing from the whole series', () => {
  for (const [name, book, ch, vs, fragment] of RECOVERED_STRANDS) {
    it(`carries ${name} (${book} ${ch}:${vs}), in every band`, () => {
      const real = versesOf(book, ch, vs);
      expect(real, `${book} ${ch}:${vs} does not resolve`).toBeTruthy();
      expect(real, 'the pinned fragment is not in that verse').toContain(norm(fragment));
      const missing = ALL.filter((k) => !norm(TEXTS[k]).includes(norm(fragment)));
      expect(missing, `${book} ${ch}:${vs} is missing from: ${missing.join(', ')}`).toEqual([]);
    });
  }

  it('names the sitting it came from without naming a record id', () => {
    for (const k of ALL) expect(TEXTS[k], `${k} does not say where this came from`).toMatch(/2026-08-14|August/);
  });
});

describe('L242 — what the lesson must actually teach', () => {
  for (const [name, re] of CLAIMS) {
    it(`teaches, in every band, that ${name}`, () => {
      const missing = ALL.filter((k) => !re.test(OURS[k]));
      expect(missing, `${name} is missing from: ${missing.join(', ')}`).toEqual([]);
    });
  }

  it('reads the claims from our prose and not from the quotations (proven-to-catch)', () => {
    for (const k of ALL) {
      expect(OURS[k].length, `${k} has no prose of its own`).toBeGreaterThan(2000);
      expect(OURS[k], `${k} prose still carries a quotation`).not.toMatch(/"/);
    }
  });

  it('gives all three directions for talking it over, in every place', () => {
    expect(placesMissingDirections(L)).toEqual([]);
  });
});
