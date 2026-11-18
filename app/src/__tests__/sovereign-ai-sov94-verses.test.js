// @vitest-environment node
// =============================================================================
// sov94 — every quotation is the corpus verbatim, the house is traced to its
// real records, and the lesson is whole in every band (DR-1562)
// =============================================================================
// Sovereign A.I. week 94, "A bag with holes", was built from one word Darrell
// typed above a forwarded ByteByteGo roundup of 2026-11-11: Lesson. Gmail
// thread 1a1cb80997812109. Built 2026-11-18 by scripts/sov94-fill.mjs.
//
// SHAPE. The shared Living Lesson gate's pure checks (helpers/living-lesson-gate.js,
// DR-1477) are run on this Sovereign A.I. module by name, so the same verbatim,
// voice, adversary, band, ladder, quiz and parable rules that bind a Living
// Lesson bind this week too; then the checks particular to this lesson.
//
// WHAT THIS FILE ADDS FOR THIS LESSON. One teaching, one lesson (DR-0610):
// week 60 owns the bottleneck moving from writing code to trusting it; the
// runtime story is weeks 66 and 67 and Software Project Management week 11;
// week 93 owns the gateway. This week owns throughput without a defect rate.
// The tiers are held apart (reported figures, the established principle, the
// measured house, the unmeasured escaped-defect count), and every house claim
// is pinned to the record that makes it true.
//
// THE RESIDUAL GAP, STATED (DR-0076 section 8). This file proves each quotation
// IS the verse it names. It cannot prove the verse was the RIGHT one for the
// point; that is the author's eye and the reviewer's. The git counts are
// pinned as the commits they name, not re-counted live, because main moves.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
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

const ID = 'sov94-a-bag-with-holes';
const MODULE = SOVEREIGN_AI_MODULES.find((m) => m.id === ID);
const REPO = join(process.cwd(), '..');
const src = (rel) => {
  const p = join(REPO, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
};
const clone = () => JSON.parse(JSON.stringify(MODULE));
const git = (args) => {
  try {
    return execFileSync('git', args, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
};

const READER_PLACES = ['bigIdea', 'inApp', 'lesson', 'child', 'youth', 'teen', 'senior'];
const TEACHING_PLACES = ['lesson', 'child', 'youth', 'teen', 'senior'];
const place = (M, p) => (['child', 'youth', 'teen', 'senior'].includes(p) ? M.levels[p] : M[p]);
const SPINE = [
  ['Haggai 1:6', 'to put it into a bag with holes'],
  ['2 Chronicles 24:13', 'the work was perfected by them'],
];
const REVIEW = 're-review: 2026-12-02';

// MEASURED 2026-11-18 on the spliced module (scripts/sov94-fill.mjs output):
// 17 anchor references. Floor a little low; the anchor exact.
const ANCHOR_COUNT = 17;
const QUOTED_FLOOR = 70;

describe('sov94 is in the catalog and is the whole lesson', () => {
  it('the module exists, as week 94, with all four bands', () => {
    expect(MODULE, `${ID} is in SOVEREIGN_AI_MODULES`).toBeTruthy();
    for (const b of FOUR_BANDS) {
      expect(typeof MODULE.levels[b]).toBe('string');
      expect(MODULE.levels[b].startsWith(MODULE.title), b).toBe(true);
    }
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
    L.quiz.questions[0].explain += ` "and he that earneth wages earneth wages to put it into a bag with rents." (Haggai 1:6)`;
    expect(verbatimFaults(stringsOf(L)).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: the author’s words put in quotation marks with no reference are caught', () => {
    const L = clone();
    L.lesson += ' The newsletter said "throughput without a defect rate is not the whole picture."';
    expect(bareQuoteFaults(L).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: the generic name in our voice and a capitalised adversary are caught', () => {
    const L = clone();
    L.levels.teen += ' God counts the bag. Satan plasters the wall.';
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

describe('the Word opens and frames the hour; no newsletter number stands above it', () => {
  it('in every teaching place both frame verses are quoted before a pull request or a merge is named', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      const frame = Math.max(t.indexOf('(Haggai 1:6)'), t.indexOf('(2 Chronicles 24:13)'));
      const tech = Math.min(...[/pull request/i, /merge/i, /revert/i, /\bchanges\b/i].map((re) => t.search(re)).filter((i) => i >= 0));
      expect(frame, `${p} quotes both frame verses`).toBeGreaterThan(0);
      expect(Number.isFinite(tech), `${p} teaches the merges`).toBe(true);
      expect(frame, `${p}: the frame stands before the machines`).toBeLessThan(tech);
    }
  });

  it('every teaching place teaches the side verses, the half picture, the repair forward and the unmeasured count', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      for (const ref of [
        '(1 Corinthians 3:13)',
        '(Ezekiel 13:10)',
        '(Ezekiel 13:11)',
        '(Ezekiel 13:12)',
        '(Nehemiah 4:10)',
        '(Proverbs 19:2)',
        '(John 19:30)',
      ]) {
        expect(t, `${p} ${ref}`).toContain(ref);
      }
      expect(t, `${p} names what comes back`).toMatch(/comes back|came back|returns?\b/i);
      expect(t, `${p} names the repair made forward`).toMatch(/fix(ed)? (it|that check|forward)|repairs? forward|corrected the check/i);
    }
  });

  it('Jesus is confessed as the Lamb of Yahweh in every teaching place, and the Eternal Son in the lesson and the older bands', () => {
    for (const p of TEACHING_PLACES) {
      expect(place(MODULE, p), p).toMatch(/Lamb of Yahweh/);
      expect(place(MODULE, p), p).toContain('(John 1:29)');
    }
    for (const p of ['lesson', 'youth', 'teen', 'senior']) expect(place(MODULE, p), p).toMatch(/Eternal Son/);
  });

  it('the source is credited and the sponsor, links and the filing’s figures are left out', () => {
    expect(MODULE.lesson).toMatch(/ByteByteGo/);
    for (const s of stringsOf(MODULE)) {
      expect(s).not.toMatch(/https?:\/\/|sponsor(ed)? by|\(c\) 2026|\$16\.3B|900%|\bANT\b|S-?1\b/i);
    }
  });

  it('one teaching, one lesson: the earlier weeks’ stories are named as theirs, not re-taught', () => {
    for (const s of stringsOf(MODULE)) expect(s).not.toMatch(/PHP2Shell|mod_php|CVSS|Copilot Fusion|Scion|load balancer/i);
    expect(MODULE.lesson).toMatch(/week sixty's/);
    expect(MODULE.lesson).toMatch(/eleventh week of Software Project Management/);
  });

  it('no decision record is recited at a reader', () => {
    for (const p of READER_PLACES) expect(place(MODULE, p), p).not.toMatch(/DR-\d{4}/);
  });
});

describe('the tiers held apart in every reader place', () => {
  it('every teaching place carries the dated re-review, the newsletter as the source, and the unmeasured question', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, p).toContain(REVIEW);
      expect(t, `${p} names the newsletter as the carrier`).toMatch(/newsletter/i);
      expect(t, `${p} says the figures were not checked`).toMatch(/did not check|were not checked|not checked against|did not count them/i);
      expect(t, `${p} says the house question was not measured`).toMatch(/not (yet )?(been )?measured|nobody has counted|nothing in the house counts/i);
    }
  });

  it('the house carries no unchecked-material admission (DR-1126)', () => {
    for (const s of stringsOf(MODULE)) {
      DISCLOSURE.lastIndex = 0;
      expect(DISCLOSURE.test(s)).toBe(false);
    }
  });
});

describe('our own house: every claim the lesson makes is still true of the records', () => {
  it('the counts are the ones main held at 5d16069df: 429 in thirty days, 45 on the day, 0 reverts in the window, 4 in 2,859', () => {
    // MEASURED 2026-11-18 with `git log origin/main --first-parent`, window
    // --since=2026-10-19, at 5d16069df. Re-counted here when the commit is in
    // this clone's history (a shallow clone skips; CI fetches full history).
    const at = '5d16069df';
    if (git(['cat-file', '-e', `${at}^{commit}`]) === null) return;
    const count = (extra) => Number(git(['rev-list', '--count', '--first-parent', ...extra, at]));
    expect(count(['--since=2026-10-19'])).toBe(429);
    expect(count(['--since=2026-11-18T00:00:00Z'])).toBe(45);
    expect(count([])).toBe(2859);
    const subjects = (extra) => git(['log', '--first-parent', '--format=%s', ...extra, at]).split('\n');
    expect(subjects(['--since=2026-10-19']).filter((s) => /^revert/i.test(s)).length).toBe(0);
    expect(subjects([]).filter((s) => /^revert/i.test(s)).length).toBe(4);
    expect(subjects(['--since=2026-10-19']).filter((s) => /^fix/i.test(s)).length).toBe(4);
    expect(subjects(['--since=2026-10-19']).filter((s) => /\bfix/i.test(s)).length).toBe(12);
    for (const p of TEACHING_PLACES) expect(place(MODULE, p), p).toMatch(/429|four hundred and twenty[- ]nine/);
  });

  it('the same-day repair forward: the voice probe that read another service as the voice, fixed by a new change, not a revert', () => {
    const dr = src('docs/decisions/DR-1555-the-voice-answer-must-be-the-voices.md');
    expect(dr).toMatch(/\*\*Date:\*\* 2026-11-18/);
    expect(dr).toMatch(/\*\*Type:\*\* fix/);
    expect(dr).toMatch(/That is the camera forwarder's health, not the voice's\./);
    expect(src('docs/decisions/DR-1538-my-voice-is-made-on-the-nas-when-the-tower-is-dark.md')).toMatch(/^# DR-1538/);
    expect(MODULE.lesson).toMatch(/a second change repaired that check the same afternoon/);
  });

  it('the gate: about two thousand test files, and the stuck line of green work the ledger workflow answers', () => {
    const tests = readdirSync(join(REPO, 'app/src/__tests__')).filter((f) => /\.test\.(js|jsx|mjs)$/.test(f));
    expect(tests.length).toBeGreaterThanOrEqual(1900);
    const wf = src('.github/workflows/keep-prs-current.yml');
    expect(wf).toMatch(/every open agent PR .* was green and could not merge/s);
    expect(wf).toMatch(/CI re-ran \(~20 min\)/);
    expect(wf).toMatch(/resolves ONLY INDEX\.md \+ legibility-health\.json/);
    expect(MODULE.lesson).toMatch(/resolves only those two ledger files by rule/);
  });

  it('the runtime register the lesson points to is real and dates its pins', () => {
    const reg = JSON.parse(src('scripts/eol-register.json') || '{}');
    expect(Object.keys(reg).length).toBeGreaterThan(0);
    expect(src('scripts/eol-register.mjs')).toMatch(/end[- ]of[- ]life/i);
    expect(MODULE.lesson).toMatch(/keeps a register that dates every runtime it pins/);
  });

  it('no verse in this week was held by the agent: the generator fills from the KJV file on disk', () => {
    const g = src('scripts/sov94-fill.mjs');
    expect(g).toMatch(/const KJV = join\(ROOT, 'app', 'public', 'bible', 'kjv'\)/);
    expect(g).toMatch(/return `"\$\{t\}" \(\$\{r\}\)`/);
  });
});

describe('the four bands, measured on this tree', () => {
  it('passes the house four-band ladder with no faults', () => {
    expect(fourBandFaults(MODULE)).toEqual([]);
  });

  it('the measurements are what the record says they are', () => {
    // MEASURED 2026-11-18 by scripts/sov94-fill.mjs: adult 2,308 prose words;
    // child 0.518 / youth 0.616 / teen 0.623 / senior 0.634; grades 1.70 <
    // 3.89 < 4.83 < 8.52. Pinned with tolerance.
    const adult = words(MODULE.lesson);
    expect(adult).toBeGreaterThanOrEqual(2250);
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
