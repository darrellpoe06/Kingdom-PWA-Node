// @vitest-environment node
// =============================================================================
// The third pile is a worklist, and it is counted (DR-1126)
// =============================================================================
// Darrell, 2026-10-20, reading sov42 on his phone at step 6 of 31, where the
// lesson says of itself: "THIRD PILE, WHAT WE DID NOT CHECK... WE DID NOT READ
// A SINGLE FULL ARTICLE" and "we did not telephone La Roche University, Berea
// College, Hampshire College, Harvard, any legislature or any department, and
// we reproduced none of the numbers." His question: "Why aren't we using the
// research space to do that whenever a lesson needs to?"
//
// MEASURED 2026-10-20 on main 15141ac71. The instrument already exists:
// lesson-sources-witness.mjs has a GitHub runner read every researched figure
// back off its publisher's own page, and it has NO hardcoded lesson -- it is
// keyed by lesson id, so widening it is DATA, not code. It covers ONE lesson.
// Nine lessons admit unchecked material in their own words. Nothing counted
// either side, so the admission read as a confession instead of a worklist.
//
// THIS FILE COUNTS BOTH SIDES AND PINS THE GAP. It does not do the checking --
// that needs a runner with web access, which neither this sandbox nor the NAS
// writer has (lesson-sources-witness.mjs says so in its own header). It makes
// the work visible and shrinking.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  admits, checked, gap, recordIdAt, catalogFiles, LESSON_ID,
} from '../../../scripts/unchecked-claims.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');

// Measured, not chosen. The gap may SHRINK as figures gain their sources; it
// may never grow without a reader seeing this go red.
//
// 9 -> 10 on 2026-10-20 (DR-1146), and the reason is on the record rather than
// in a wording change. sov45 (no single witness: the office of the critic) is
// built from a Level Up Coding newsletter about Slack's multi-agent security
// system, and the whole subject of the lesson is that a producer may not certify
// its own work -- so the lesson could not quietly omit its own limit. It takes
// the SECOND branch this test's own verdict offers ("say plainly why it cannot
// be checked"): the figures are not checkable from here, because the build asked
// for slack.engineering on 2026-10-20 and the agent proxy answered 403 to the
// CONNECT by policy (recorded in the proxy's own recentRelayFailures). An
// open-web search returned Slack's page title and the three role names, which is
// corroboration at one remove and NOT a figure read back, so no source row was
// written -- a 0-figure row would have made `checked()` count a lesson whose
// figures nobody read, which is the anti-theatre rule in DR-0076 section 3. No
// teaching in sov45 rests on either figure; the two numbers are carried as the
// newsletter's claims and labelled as such on every adult surface.
// re-review: 2026-11-20 -- if slack.engineering becomes reachable from a runner
// with web access, read the two figures back, give sov45 a row in
// lesson-sources.json, and lower this pin to 9.
//
// 10 -> 11 on 2026-10-27 (ll264, the judgment seat and the reward), and the
// reason is on the record rather than in a wording change. The lesson teaches
// the bema from the Word -- Romans 14:10, 2 Corinthians 5:10, 1 Corinthians
// 3:13-15 -- and none of its teaching rests on the unchecked part. The talk it
// was built from ALSO said that this kind of platform was where a city crowned
// its athletes and honoured its soldiers; that is a claim about classical
// civic practice, not about the Word, and the lesson says so in its own text:
// "One honest limit, because we do not relay what we did not check... That may
// well be so, but we did not verify it."
//
// It takes the SECOND branch this test's own verdict offers ("say plainly why
// it cannot be checked"). The claim is not a figure a publisher can hand back,
// so there is nothing for lesson-sources.json to read: it would want a
// scholarly source on the bema at Corinth, and a 0-figure row would make
// `checked()` count a lesson whose figures nobody read, which is the
// anti-theatre rule in DR-0076 section 3. Carrying it as the talk's claim and
// labelling it is the honest handling, and the lesson already does that.
// re-review: 2026-11-27 -- if a runner with web access can read a scholarly
// source on the bema's civic use, either cite it in the lesson and lower this
// pin to 10, or drop the sentence.
const GAP = 11;
const CHECKED_LESSONS = 1;

describe('both sides of the honesty gap are counted', () => {
  it(`exactly ${GAP} lesson(s) admit unchecked material with no source row`, () => {
    const g = gap();
    if (g.length === GAP) {
      expect(g.length).toBe(GAP);
      return;
    }
    const verdict = g.length > GAP
      ? `${g.length} lessons admit unchecked material with no source row, pinned at ${GAP} -- a NEW one landed. Either give its figures a row in lesson-sources.json so the runner reads them back, or say plainly why it cannot be checked.`
      : `${g.length} lessons, pinned at ${GAP} -- one gained its sources; lower the pin to ${g.length} so the ledger stays true.`;
    expect(g.map((x) => `${x.disclosures} :: ${x.lesson}`).join('\n'), verdict).toBe(`(expected exactly ${GAP})`);
  });

  it(`exactly ${CHECKED_LESSONS} lesson(s) have a figure read back from a publisher`, () => {
    // Pinned in its own right: this is the number that is supposed to RISE, and
    // a silent fall (a lesson's rows deleted) would not move the gap pin alone.
    const c = checked();
    expect(c).toHaveLength(CHECKED_LESSONS);
    expect(c[0].figures).toBeGreaterThan(0);
  });

  it('scans a real corpus, so a pass means something', () => {
    // Anti-theater (DR-0076 section 3): if the walk stopped reading files, the
    // gap would read zero and look like success.
    expect(catalogFiles().length).toBeGreaterThan(50);
    expect(admits().length).toBeGreaterThanOrEqual(gap().length);
    expect(admits().reduce((n, x) => n + x.disclosures, 0)).toBeGreaterThan(50);
  });

  it('the lesson he was reading is on the list, by its own id', () => {
    // sov42 is the three-year-degree lesson on his screen at step 6 of 31.
    expect(gap().map((x) => x.lesson)).toContain('sov42-the-three-year-degree-and-the-work-that-teaches');
  });
});

describe('PROVEN-TO-CATCH: the two record shapes, which is the bug that actually happened', () => {
  // The catalogs hold lessons in TWO forms, and my first count of this read
  // only one of them. It did not fail -- it answered confidently about the
  // WRONG record, attributing sov42's disclosure to the nearest older literal
  // above it and reporting 4 lessons when the answer is 9.
  const TWO_SHAPES = [
    "  { id: 'sov32-the-im-fine-problem', lesson: 'older shape, single quotes' },",
    '  { "id": "sov42-the-three-year-degree", "lesson": "WHAT WE DID NOT CHECK: we did not telephone anybody." }',
  ].join('\n');

  /** The pattern my first pass used: one shape only. */
  const SINGLE_SHAPE_ONLY = /\bid:\s*'([^']{5,})'/g;
  function idAtSingleShape(src, offset) {
    SINGLE_SHAPE_ONLY.lastIndex = 0;
    let id = null;
    for (let m = SINGLE_SHAPE_ONLY.exec(src); m; m = SINGLE_SHAPE_ONLY.exec(src)) {
      if (m.index >= offset) break;
      id = m[1];
    }
    return id;
  }

  it('the disclosure is attributed to the JSON-shaped record that carries it', () => {
    const at = TWO_SHAPES.indexOf('WHAT WE DID NOT CHECK');
    expect(recordIdAt(TWO_SHAPES, at)).toBe('sov42-the-three-year-degree');
  });

  it('and the single-shape pattern blames the record ABOVE it instead', () => {
    const at = TWO_SHAPES.indexOf('WHAT WE DID NOT CHECK');
    expect(idAtSingleShape(TWO_SHAPES, at)).toBe('sov32-the-im-fine-problem');
    // The two genuinely disagree on this input -- that is the whole case.
    expect(recordIdAt(TWO_SHAPES, at)).not.toBe(idAtSingleShape(TWO_SHAPES, at));
  });

  it('both shapes are matched by the id pattern this module uses', () => {
    LESSON_ID.lastIndex = 0;
    const found = [...TWO_SHAPES.matchAll(LESSON_ID)].map((m) => m[1] || m[2]);
    expect(found).toEqual(['sov32-the-im-fine-problem', 'sov42-the-three-year-degree']);
  });

  it('and the real catalogs genuinely contain both shapes, so this is not a fixture-only concern', () => {
    const src = readFileSync(join(REPO, 'app/src/lib/sovereign-ai-class.js'), 'utf8');
    expect(src).toMatch(/\bid:\s*'sov\d+-/);          // the JS literal form
    expect(src).toMatch(/"id"\s*:\s*"sov\d+-/);       // the JSON row form
  });
});

describe('the checking instrument it defers to', () => {
  it('reads every figure back from the publisher, and corrects the LESSON when it fails', () => {
    const witness = readFileSync(join(REPO, 'scripts/lesson-sources-witness.mjs'), 'utf8');
    expect(witness).toMatch(/read back\s*\n?\/\/ from its publisher|publisher's own page/);
    expect(witness).toMatch(/the lesson is corrected, not the\s*\n?\/\/ check/);
  });

  it('and is keyed by lesson id with no lesson hardcoded, so widening it is DATA', () => {
    // The fact that makes the gap above closable at all.
    const witness = readFileSync(join(REPO, 'scripts/lesson-sources-witness.mjs'), 'utf8');
    expect(witness).not.toMatch(/ll207/);
    expect(witness).toMatch(/lesson-sources\.json/);
  });

  it('the research road is NOT that instrument, and says so itself', () => {
    // Vane finds sources; it does not verify them. Using it to "check" a digest
    // would add a remove rather than remove one -- which is the third pile's
    // own complaint about reading somebody's summary of somebody's reporting.
    const road = readFileSync(join(REPO, 'app/src/lib/research.js'), 'utf8');
    expect(road).toMatch(/marks every answer verified:false|verified:false/);
  });
});

describe('SHIP AND SHRINK: a pile that has shrunk may not still claim it is full', () => {
  // Darrell's decision, 2026-10-20, on the question DR-1126 put to him: a
  // digest-built lesson SHIPS with its third pile and the pile shrinks as
  // source rows land. "ship and shrink."
  //
  // That choice has one failure mode blocking does not. A lesson that says "we
  // reproduced none of the numbers" is telling the truth on the day it ships.
  // The moment one of its figures gains a row the runner reads back, the same
  // sentence becomes false in the OTHER direction -- the work was done and the
  // page still confesses it was not. DR-0100: under-claiming a verified truth
  // is as much a failure of truth as over-claiming an unverified one.
  //
  // So the two sides are held to each other: no lesson may both carry a
  // total-denial phrase and have figures read back from a publisher.
  const TOTAL_DENIAL = /reproduced none of the numbers|DID NOT READ A SINGLE FULL ARTICLE/i;

  it('no lesson both denies checking outright and has a source row', () => {
    // Committed at ZERO, not baselined: there is no such lesson today (ll207
    // carries rows and no denial), so this is a floor the shrink cannot cross
    // rather than a debt to work down.
    const haveRows = new Set(checked().map((c) => c.lesson));
    const contradicting = admits()
      .filter((a) => haveRows.has(a.lesson))
      .filter((a) => {
        const src = readFileSync(join(REPO, 'app/src/lib', a.file), 'utf8');
        const at = src.indexOf(a.lesson);
        return TOTAL_DENIAL.test(src.slice(at, at + 60_000));
      });
    expect(contradicting.map((c) => c.lesson)).toEqual([]);
  });

  it('PROVEN-TO-CATCH: the contradiction is detectable, not merely absent', () => {
    // A zero rule nobody can make fail is the anti-theater case (DR-0076 §3).
    // The denial phrase and a source row, in one lesson, is what it looks like.
    const bent = 'We reproduced none of the numbers.';
    expect(TOTAL_DENIAL.test(bent)).toBe(true);
    expect(TOTAL_DENIAL.test('We read the article and quoted the figure.')).toBe(false);
  });

  it('the shrink has somewhere to land: the witness runs on a push to the sources file', () => {
    // What makes "shrink" a real motion rather than an intention -- adding a row
    // for a lesson that already shipped triggers the read-back by itself.
    const wf = readFileSync(join(REPO, '.github/workflows/lesson-sources-witness.yml'), 'utf8');
    expect(wf).toMatch(/app\/src\/lib\/lesson-sources\.json/);
    expect(wf).toMatch(/workflow_dispatch/);
  });
});
