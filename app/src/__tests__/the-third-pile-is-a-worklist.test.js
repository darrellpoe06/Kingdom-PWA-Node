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
// 11 -> 12 on 2026-10-28 (wm9, the cost of staying warm), and the reason is on
// the record rather than in a wording change. The lesson is built from a
// Morning Brew newsletter Darrell forwarded, and its whole teaching is HOW TO
// TREAT a borrowed number: a dated, attributed reading of what one named source
// reported on one named day is a different object from a price spoken as
// current, and the reader leaves with the two questions it reduces to, who said
// it and on what day. It therefore could not quietly omit its own limit, and it
// does not: the adult text AND all four bands name the newsletter, name the day,
// and say plainly that nobody here opened the Energy Information
// Administration's projection, the Food & Water Watch study, the weatherization
// interview or the heating-assistance reporting.
//
// It takes the SECOND branch this test's own verdict offers ("say plainly why it
// cannot be checked"), and the why is specific rather than general. THE SOURCE
// IS AN EMAIL, not a page: the figures reached us inside a newsletter, and a
// newsletter is not a publisher's page a runner can fetch and read a number back
// off, so there is nothing for lesson-sources.json to point at for the
// newsletter itself. Writing a row anyway — or a 0-figure row — would make
// `checked()` count a lesson whose figures nobody read, which is the
// anti-theatre rule in DR-0076 section 3.
//
// What IS checkable, and is owed: the EIA's winter heating-oil projection is
// published on eia.gov, so a runner with web access could read the per-gallon
// figure and the year-on-year change back off the agency's own page, and the
// Food & Water Watch study is likewise published. Neither was reachable from
// this build. No teaching in wm9 rests on either number — the lesson's point
// stands whatever the price turns out to be, which is itself the thing it
// teaches — and every figure is labelled as the newsletter's report on every
// adult surface and in every band.
// re-review: 2026-11-28 -- from a runner with web access, read the EIA
// projection and the Food & Water Watch figure back off their publishers' own
// pages, give wm9 a row in lesson-sources.json, and lower this pin to 11.
//
//
// 1 -> 2 CHECKED on 2026-10-28 (DR-1275). legacy8 is built from a Morning Brew
// edition reporting the Federal Reserve's 2025 Survey of Consumer Finances, so
// its figures have a primary publisher and did not have to stay admitted. The
// GAP does not move: legacy8 arrived carrying disclosures AND left the gap in
// the same change, because it gained a source row rather than an apology.
//
// The road matters more than the row (DR-0108). This sandbox cannot resolve
// federalreserve.gov at all -- not a 403, a DNS refusal -- so the first reading
// of "we cannot check this" was about ONE agent's reach, not the team's. A
// GitHub runner reaches it, and lesson-sources-witness.mjs is keyed by lesson
// id, so widening it was DATA. Three probe runs on a throwaway branch found
// what no amount of reasoning would have: the bulletin is scf26.pdf, not
// scf25.pdf, and it prints dollars in THOUSANDS, so the newsletter's $505,000
// reads back as 504.9. Measured, runs 40765563536 / 40765786504 / 40766904379.
//
// What did NOT read back is on the row's own note and is not smoothed over:
// the $367,000 previous median is absent from the bulletin, and the 37/23
// percent changes are unmatchable as bare two-digit strings, so they are left
// as the newsletter's claims rather than dressed up as verified.
//
// BOTH LANDED THE SAME DAY, and the resolution is not a split difference.
// wm9 took the second branch (its figures arrived inside an email, and an email
// is not a page a runner can read a number back off) so it ADDS to the gap:
// 11 -> 12. legacy8 took the first branch and LEAVES the gap, so it does not
// subtract from wm9's increment -- it was never counted in the 11. Hence
// GAP = 12 with CHECKED_LESSONS = 2, and neither lesson's reasoning is edited
// to suit the other's.
//
// Standing note for wm9's own re-review, now that it is not hypothetical: a
// runner CAN read a publisher's page back -- legacy8 proved it on
// federalreserve.gov the same day, after this sandbox failed even to resolve
// the host. So wm9's "could read the EIA projection" is a method that exists
// and has been exercised, not a hope.
// 2 -> 3 CHECKED on 2026-10-28 (DR-1279), and the GAP does not move. bank9
// (the moat that moves) is built from The Daily Upside edition Darrell
// forwarded to himself with one word on it (Gmail thread 1a1541f1da7acd58),
// and it took the FIRST branch this test's verdict offers: it arrived carrying
// disclosures AND a source row in the same change, so it was never counted in
// the 12.
//
// The road again, and it is the same finding as legacy8's (DR-0108): this
// sandbox cannot reach morganstanley.com at all -- the agent proxy answers 403
// to the CONNECT -- so "its figures arrived inside an email and an email is not
// a page" would have been WRONG here, because the firm publishes its own
// quarterly release and a GitHub runner can read it. Three probe runs on a
// throwaway branch found what no reasoning would have: the press-release URL
// 404s, the release lives at .../shareholder/3q2026.pdf, and the phrasings a
// writer would guess at are not the phrasings it prints -- it says "net new
// assets were $232 billion", never "net new assets of $232 billion".
// Measured, runs 40776657937 / 40777096354 / 40777425081.
//
// What did NOT read back is on the row's own note and is not smoothed over: the
// $81 billion of net new assets a year earlier and the $5.8 billion from stock
// trading are absent from that release, and the nearly 40 percent S&P 500
// top-ten concentration has no row at all because no index document was opened
// for it. A 0-figure row would have made `checked()` count a figure nobody
// read, which is the anti-theatre rule in DR-0076 section 3. Those three stay
// The Daily Upside's report, labelled as such in the adult text and in all four
// bands, and no teaching in bank9 rests on any of them.
//
// wm9's standing note (above) is now exercised twice rather than once: a runner
// CAN read a publisher's page back, proven on federalreserve.gov and again on
// morganstanley.com. Its own re-review on 2026-11-28 should ask the EIA the
// same way.
const GAP = 12;
const CHECKED_LESSONS = 3;

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
