// @vitest-environment node
// =============================================================================
// sov90 — every quotation is the corpus verbatim, the house is traced to its
// real code, and the lesson is whole in every band (DR-1548)
// =============================================================================
// Sovereign A.I. week 90, "Let your yea be yea", was built from one word
// Darrell typed above a forwarded ByteByteGo issue, Why Thinking More Can Make
// an LLM Dumb, on 2026-11-17: Lesson. Gmail thread 1a1ea6587885ee3f. Built
// 2026-11-18 by scripts/sov90-fill.mjs.
//
// SHAPE. The shared Living Lesson gate's pure checks (helpers/living-lesson-gate.js,
// DR-1477) are run on this Sovereign A.I. module by name, so the same verbatim,
// voice, adversary, band, ladder, quiz and parable rules that bind a Living
// Lesson bind this week too; then the checks particular to this lesson.
//
// WHAT THIS FILE ADDS FOR THIS LESSON. The tiers are held apart (established,
// verified at the developer's own page, reported, measured, not measured), and
// every house claim is pinned to the file that makes it true: the quotation
// gate's first-run count, the duplicate finder's two drifts, the shared gate's
// fifteen planted-defect cases, the band ladder's floor without a length
// ceiling, and the course's own lengths, RE-COUNTED here by the same method
// the lesson states. If any of that moves, this file goes red and the lesson
// is re-read.
//
// THE RESIDUAL GAP, STATED (DR-0076 section 8). This file proves each quotation
// IS the verse it names. It cannot prove the verse was the RIGHT one for the
// point; that is the author's eye and the reviewer's.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { fourBandFaults, fk, words, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';
import { DISCLOSURE } from '../../../scripts/unchecked-claims.mjs';
import {
  lessonGateFaults,
  stringsOf,
  corpusText,
  quotedPairs,
  verbatimFaults,
  voiceFaults,
  adversaryFaults,
  bareQuoteFaults,
} from './helpers/living-lesson-gate.js';

const ID = 'sov90-let-your-yea-be-yea';
const MODULE = SOVEREIGN_AI_MODULES.find((m) => m.id === ID);
const REPO = join(process.cwd(), '..');
const src = (rel) => {
  const p = join(REPO, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
};
const clone = () => JSON.parse(JSON.stringify(MODULE));

const READER_PLACES = ['bigIdea', 'inApp', 'lesson', 'child', 'youth', 'teen', 'senior'];
const TEACHING_PLACES = ['lesson', 'child', 'youth', 'teen', 'senior'];
const place = (M, p) => (['child', 'youth', 'teen', 'senior'].includes(p) ? M.levels[p] : M[p]);
const SPINE = [
  ['Acts 17:11', 'searched the scriptures daily, whether those things were so'],
  ['Matthew 5:37', 'Yea, yea; Nay, nay'],
];
const REVIEW = 're-review: 2026-12-02';

// MEASURED 2026-11-18 on the spliced module (scripts/sov90-fill.mjs output):
// 31 anchor references. Floors a little low; the anchor exact.
const ANCHOR_COUNT = 31;
const QUOTED_FLOOR = 120;

describe('sov90 is in the catalog and is the whole lesson', () => {
  it('the module exists, as week 90, with all four bands', () => {
    expect(MODULE, `${ID} is in SOVEREIGN_AI_MODULES`).toBeTruthy();
    for (const b of FOUR_BANDS) expect(typeof MODULE.levels[b]).toBe('string');
    expect(MODULE.levels.child.startsWith(MODULE.title)).toBe(true);
  });
});

describe('the shared Living Lesson gate, run on this week check by check', () => {
  it('every check is empty', () => {
    const all = lessonGateFaults(MODULE, { spine: SPINE });
    for (const [name, faults] of Object.entries(all)) expect(faults, name).toEqual([]);
  });

  it(`at least ${QUOTED_FLOOR} referenced quotations are swept, so the sweep is not vacuous`, () => {
    const n = stringsOf(MODULE).reduce((a, t) => a + quotedPairs(t).filter((p) => p.ref).length, 0);
    expect(n).toBeGreaterThanOrEqual(QUOTED_FLOOR);
  });

  it('PROVEN-TO-CATCH: one altered word inside a quotation, in a quiz explanation, is caught', () => {
    const L = clone();
    L.quiz.questions[0].explain += ` "Prove all things; hold fast that which is true." (1 Thessalonians 5:21)`;
    expect(verbatimFaults(stringsOf(L)).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: the newsletter’s words put in quotation marks with no reference are caught', () => {
    const L = clone();
    L.lesson += ' The newsletter says "knowing when to stop is a separate skill."';
    expect(bareQuoteFaults(L).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: the generic name in our voice and a capitalised adversary are caught', () => {
    const L = clone();
    L.levels.teen += ' God answers plainly. Satan asks again.';
    expect(voiceFaults(L).length).toBeGreaterThan(0);
    expect(adversaryFaults(L)).toEqual(['Satan']);
  });
});

describe('anchor.ref names every verse quoted in a reader place, and nothing more', () => {
  const refs = MODULE.anchor.ref
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  const quoted = new Set(
    READER_PLACES.flatMap((p) =>
      quotedPairs(place(MODULE, p))
        .map((q) => q.ref)
        .filter(Boolean)
    )
  );

  it(`the anchor carries exactly ${ANCHOR_COUNT} references, each resolving in the corpus`, () => {
    expect(refs.length).toBe(ANCHOR_COUNT);
    for (const r of refs) expect(corpusText(r), r).not.toBeNull();
  });

  it('both ways: nothing on the anchor that a reader is not shown, nothing shown that is not on the anchor', () => {
    expect([...quoted].filter((r) => !refs.includes(r))).toEqual([]);
    expect(refs.filter((r) => !quoted.has(r))).toEqual([]);
  });
});

describe('the Word opens and frames the hour; no article stands above it', () => {
  it('in every teaching place both frame verses are quoted before the newsletter’s own material', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      const frame = Math.max(t.indexOf('(Acts 17:11)'), t.indexOf('(Matthew 5:37)'));
      const article = t.search(/one (small|tiny) piece at a time|in small pieces|piece at a time|small units/);
      expect(frame, `${p} quotes both frame verses`).toBeGreaterThan(0);
      expect(article, `${p} teaches the mechanism`).toBeGreaterThan(0);
      expect(frame, `${p}: the frame stands before the article`).toBeLessThan(article);
    }
  });

  it('the garden’s plain word and Jesus’ answer from what was written are in every teaching place', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, p).toContain('(Genesis 3:1)');
      expect(t, p).toContain('(Matthew 4:4)');
    }
  });

  it('Jesus is confessed as the Lamb of Yahweh and the Eternal Son in the lesson and the older bands', () => {
    for (const p of ['lesson', 'youth', 'teen', 'senior']) {
      const t = place(MODULE, p);
      expect(t, p).toMatch(/Lamb of Yahweh/);
      expect(t, p).toMatch(/Eternal Son/);
      expect(t, p).toContain('(John 1:29)');
    }
  });

  it('the sponsor is left out, and no company or model is ranked', () => {
    for (const s of stringsOf(MODULE)) {
      expect(s).not.toMatch(/Unblocked/);
      expect(s).not.toMatch(/\bbest model\b|is the winner|clearly better than/i);
      expect(s).not.toMatch(/\bGPT-?\d|\bclaude-[a-z]+-\d|\bOpus \d|\bSonnet \d|\bHaiku \d/i);
    }
  });

  it('no decision record is recited at a reader', () => {
    for (const p of READER_PLACES) expect(place(MODULE, p), p).not.toMatch(/DR-\d{4}/);
  });
});

describe('the tiers held apart in every reader place', () => {
  it('every teaching place carries the dated re-review, the reported account, and the unmeasured question', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, p).toContain(REVIEW);
      expect(t, `${p} names what is reported`).toMatch(
        /newsletter('s)? (report|account)|came from the email|taken the email at its word|took the email at its word/i
      );
      expect(t, `${p} says the length question was not measured`).toMatch(/not (been )?measured|did not find out|do not know yet/i);
    }
  });

  it('the house carries no unchecked-material admission (DR-1126)', () => {
    for (const s of stringsOf(MODULE)) {
      DISCLOSURE.lastIndex = 0;
      expect(DISCLOSURE.test(s)).toBe(false);
    }
  });

  it('the newsletter’s worked examples are right: 100 -> 120 -> 96, and a while-less-than loop over three items stops one short', () => {
    expect(Math.round(100 * 1.2 * 0.8)).toBe(96);
    const ran = [];
    for (let pos = 1; pos < 3; pos += 1) ran.push(pos);
    expect(ran).toEqual([1, 2]);
    expect(MODULE.lesson).toMatch(/ninety-six/);
  });
});

describe('our own house: every claim the lesson makes is still true of the code', () => {
  it('the quotation gate checks each span against the verse it names, and its first run found 18 of 25,192', () => {
    const t = src('app/src/__tests__/quoted-verse-is-the-verse.test.js');
    expect(t).toMatch(/Haggai 1:5/);
    expect(t).toMatch(/25,192 referenced spans/);
    expect(t).toMatch(/18 spans\s*\n?\/\/\s*were not the verse they named/);
    expect(MODULE.lesson).toMatch(/eighteen of 25,192/);
  });

  it('the duplicate finder records both drifts: the bare day, and the review date far from the source', () => {
    const t = src('scripts/lesson-already-built.mjs');
    expect(t).toMatch(/accepted a BARE DAY/);
    expect(t).toMatch(/LIKELY ALREADY BUILT/);
    expect(t).toMatch(/thirty-odd lines away/);
    expect(t).toMatch(/SOURCE_DAY_WINDOW/);
  });

  it('the shared gate’s own test runs fifteen planted-defect cases', () => {
    const t = src('app/src/__tests__/living-lesson-gate.test.js');
    const block = t.slice(t.indexOf("describe('PROVEN TO CATCH"));
    expect(block.length).toBeGreaterThan(100);
    expect((block.match(/^ {2}it\(/gm) || []).length).toBe(15);
  });

  it('the four-band ladder sets a share floor and grade ceilings, and no length ceiling', () => {
    const t = src('app/src/__tests__/fixtures/four-band-ladder.js');
    expect(t).toMatch(/if \(share < ladder\.floor\[b\]\)/);
    expect(t).toMatch(/childCeiling/);
    expect(t).not.toMatch(/share > |lengthCeiling|maxShare/);
  });

  it('the course lengths are what the lesson says, counted the way it says (whitespace words of the adult lesson)', () => {
    const w = (s) =>
      String(s || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
    const byWeek = new Map(SOVEREIGN_AI_MODULES.map((m) => [Number(m.id.match(/^sov(\d+)-/)[1]), w(m.lesson)]));
    expect(byWeek.get(1)).toBe(291);
    expect(byWeek.get(88)).toBe(3668);
    const eighties = [80, 81, 82, 83, 84, 85, 86, 87, 88].map((n) => byWeek.get(n));
    expect(Math.min(...eighties)).toBe(3139);
    expect(Math.max(...eighties)).toBe(4845);
    // And this week was written shorter on purpose, by the same count.
    expect(byWeek.get(90)).toBeLessThan(Math.min(...eighties));
  });
});

describe('the four bands, measured on this tree', () => {
  it('passes the house four-band ladder with no faults', () => {
    expect(fourBandFaults(MODULE)).toEqual([]);
  });

  it('the measurements are what the record says they are', () => {
    // MEASURED 2026-11-18 by scripts/sov90-fill.mjs: adult 1,926 prose words;
    // child 0.518 / youth 0.618 / teen 0.612 / senior 0.668; grades 1.69 <
    // 4.42 < 5.19 < 9.17. Pinned with tolerance.
    const adult = words(MODULE.lesson);
    expect(adult).toBeGreaterThanOrEqual(1900);
    const g = Object.fromEntries(FOUR_BANDS.map((b) => [b, fk(MODULE.levels[b])]));
    expect(g.child).toBeLessThanOrEqual(5.0);
    expect(g.teen).toBeLessThanOrEqual(6.0);
    expect(g.senior).toBeLessThanOrEqual(10.0);
    let worst = 0;
    for (let i = 0; i < FOUR_BANDS.length; i += 1) {
      for (let j = i + 1; j < FOUR_BANDS.length; j += 1) worst = Math.max(worst, overlapOf(MODULE.levels[FOUR_BANDS[i]], MODULE.levels[FOUR_BANDS[j]]));
      worst = Math.max(worst, overlapOf(MODULE.levels[FOUR_BANDS[i]], MODULE.lesson));
    }
    expect(worst).toBeLessThan(0.25);
  });
});
