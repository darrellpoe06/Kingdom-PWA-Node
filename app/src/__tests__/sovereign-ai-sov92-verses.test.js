// @vitest-environment node
// =============================================================================
// sov92 — every quotation is the corpus verbatim, the house is traced to its
// real records, and the lesson is whole in every band (DR-1559)
// =============================================================================
// Sovereign A.I. week 92, "The voice is Jacob's voice", was built from one word
// Darrell typed above a forwarded IT Brew issue, Cheating the system, on
// 2026-11-18: Lesson. Gmail thread 1a1f0049f29b5267. Built the same day by
// scripts/sov92-fill.mjs.
//
// SHAPE. The shared Living Lesson gate's pure checks (helpers/living-lesson-gate.js,
// DR-1477) are run on this Sovereign A.I. module by name, so the same verbatim,
// voice, adversary, band, ladder, quiz and parable rules that bind a Living
// Lesson bind this week too; then the checks particular to this lesson.
//
// WHAT THIS FILE ADDS FOR THIS LESSON. One teaching, one lesson (DR-0610):
// week 90 owns the second look and week 91 owns evaluation and its gulfs; this
// week owns the agent that cheats its own test, and the test holds them apart.
// The tiers are held apart (reported through the newsletter, established,
// measured, not measured), no rate is printed and no model ranked, and every
// house claim is pinned to the file that makes it true.
//
// THE RESIDUAL GAP, STATED (DR-0076 section 8). This file proves each quotation
// IS the verse it names. It cannot prove the verse was the RIGHT one for the
// point; that is the author's eye and the reviewer's.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
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

const ID = 'sov92-the-voice-is-jacobs-voice';
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
  ['Genesis 27:22', 'The voice is Jacob’s voice, but the hands are the hands of Esau'],
  ['Ephesians 6:6', 'Not with eyeservice, as menpleasers'],
];
const REVIEW = 're-review: 2026-12-02';

// MEASURED 2026-11-18 on the spliced module (scripts/sov92-fill.mjs output):
// 23 anchor references. Floor a little low; the anchor exact.
const ANCHOR_COUNT = 23;
const QUOTED_FLOOR = 100;

describe('sov92 is in the catalog and is the whole lesson', () => {
  it('the module exists, as week 92, with all four bands', () => {
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
    L.quiz.questions[0].explain += ` "The voice is Jacob’s voice, but the hands are the hands of Isaac." (Genesis 27:22)`;
    expect(verbatimFaults(stringsOf(L)).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: the researcher’s words put in quotation marks with no reference are caught', () => {
    const L = clone();
    L.lesson += ' The researcher said "it has certainly made things feel more urgent."';
    expect(bareQuoteFaults(L).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: the generic name in our voice and a capitalised adversary are caught', () => {
    const L = clone();
    L.levels.teen += ' God sees the grader. Satan edits the script.';
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

describe('the Word opens and frames the hour; no newsletter stands above it', () => {
  it('in every teaching place both frame verses are quoted before CheatBench is named', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      const frame = Math.max(t.indexOf('(Genesis 27:22)'), t.indexOf('(Ephesians 6:6)'));
      const bench = t.indexOf('CheatBench');
      expect(frame, `${p} quotes both frame verses`).toBeGreaterThan(0);
      expect(bench, `${p} teaches CheatBench`).toBeGreaterThan(0);
      expect(frame, `${p}: the frame stands before the benchmark`).toBeLessThan(bench);
    }
  });

  it('every teaching place teaches the honeypot, the changed grader, the test that reveals, and the two side items', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, p).toMatch(/honeypot/i);
      expect(t, p).toMatch(/grading script|grader|checker/i);
      expect(t, p).toContain('(Genesis 27:12)');
      expect(t, p).toContain('(Colossians 3:22)');
      expect(t, p).toContain('(Deuteronomy 8:2)');
      expect(t, p).toContain('(Proverbs 25:14)');
      expect(t, p).toContain('(Proverbs 16:18)');
    }
  });

  it('Jesus is confessed as the Lamb of Yahweh in every teaching place, and the Eternal Son in the lesson and the older bands', () => {
    for (const p of TEACHING_PLACES) {
      expect(place(MODULE, p), p).toMatch(/Lamb of Yahweh/);
      expect(place(MODULE, p), p).toContain('(John 8:29)');
    }
    for (const p of ['lesson', 'youth', 'teen', 'senior']) expect(place(MODULE, p), p).toMatch(/Eternal Son/);
  });

  it('the source is credited, no rate is printed, no model is ranked, and the sponsors are left out', () => {
    expect(MODULE.lesson).toMatch(/Center for AI Safety/);
    expect(MODULE.lesson).toMatch(/Mantas Mazeika/);
    for (const s of stringsOf(MODULE)) {
      expect(s).not.toMatch(/\d+(\.\d+)?\s?(%|percent)/i);
      expect(s).not.toMatch(/\bGrok\b|\bGPT-?\d|\bclaude-[a-z]+-\d|\bOpus \d|\bSonnet \d|\bGemini\b/i);
      expect(s).not.toMatch(/biggest offender|is the winner|clearly better than|TrustOps|Logi Game Day|123456/i);
    }
  });

  it('one teaching, one lesson: week 91’s gulfs and week 90’s second look are not re-taught here', () => {
    for (const s of stringsOf(MODULE)) {
      expect(s).not.toMatch(/\bgulfs?\b|two plus three|timetable|signature lines/i);
    }
  });

  it('no decision record is recited at a reader', () => {
    for (const p of READER_PLACES) expect(place(MODULE, p), p).not.toMatch(/DR-\d{4}/);
  });
});

describe('the tiers held apart in every reader place', () => {
  it('every teaching place carries the dated re-review, the reported source, and the unmeasured question', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, p).toContain(REVIEW);
      expect(t, `${p} names the newsletter as the carrier`).toMatch(/newsletter/i);
      expect(t, `${p} says the reports disagree`).toMatch(/disagree|conflict|different numbers/i);
      expect(t, `${p} says the house question was not measured`).toMatch(/not (yet )?(been )?measured|unmeasured|nobody has counted|nothing counts that/i);
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
  it('a test marked to run alone fails the build; skips are reported, not failed', () => {
    const g = src('app/src/__tests__/only-guard.test.js');
    expect(g).toMatch(/It scans every real test file and HARD-FAILS on any `\.only` test modifier/);
    expect(g).toMatch(/are reported for visibility but do NOT fail/);
    expect(MODULE.lesson).toMatch(/fails the whole build if any test is marked to run alone/);
  });

  it('the skips the lesson counted are still no more than two (measured: 2 of 2,020 files on 2026-11-18)', () => {
    const files = [];
    (function walk(d) {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const f = join(d, e.name);
        if (e.isDirectory()) walk(f);
        else if (/\.test\.(js|jsx)$/.test(e.name)) files.push(f);
      }
    })(join(REPO, 'app', 'src', '__tests__'));
    expect(files.length).toBeGreaterThanOrEqual(2020);
    // Code positions only, the way only-guard reads them: strings and comments
    // are blanked first so a fixture (like the line below) is never counted.
    const code = (t) =>
      t
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/\/\/[^\n]*/g, ' ')
        .replace(/'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g, "''");
    const withSkip = files.filter((f) => /\b(it|test|describe|context)\.(skip|todo|skipIf|failing)\b/.test(code(readFileSync(f, 'utf8'))));
    expect(withSkip.length, withSkip.join('\n')).toBeLessThanOrEqual(2);
    expect(MODULE.lesson).toMatch(/two thousand and twenty test files, and two of them carry a skip/);
  });

  it('the course file’s ceiling is raised by hand with a written reason, and sov92 is the twenty-fifth raise', () => {
    const budgets = JSON.parse(src('scripts/file-budgets.json'));
    const raises = budgets.raises.filter((r) => r.file === 'app/src/lib/sovereign-ai-class.js');
    expect(raises.length).toBeGreaterThanOrEqual(25);
    const mine = raises.find((r) => /sov92/.test(r.why));
    expect(mine, 'the sov92 raise is recorded').toBeTruthy();
    expect(raises.indexOf(mine)).toBe(24);
    for (const r of raises) expect(String(r.why).length).toBeGreaterThan(40);
    expect(src('scripts/file-budget-guard.mjs')).toMatch(/To RAISE a ceiling, edit the file by hand with a one-line reason/);
    expect(MODULE.lesson).toMatch(/raised twenty-four times/);
    expect(MODULE.lesson).toMatch(/raises it a twenty-fifth time/);
  });

  it('the house rule: a gate that always passes is itself a lie', () => {
    expect(src('CLAUDE.md')).toMatch(/A gate that always passes is itself a lie\. Ship a gate only after it's shown to CATCH the break\./);
    expect(MODULE.lesson).toMatch(/a gate that always passes is itself a lie/);
  });

  it('no verse in this week was held by the agent: the generator fills from the KJV file on disk', () => {
    const g = src('scripts/sov92-fill.mjs');
    expect(g).toMatch(/const KJV = join\(ROOT, 'app', 'public', 'bible', 'kjv'\)/);
    expect(g).toMatch(/return `"\$\{t\}" \(\$\{r\}\)`/);
  });
});

describe('the four bands, measured on this tree', () => {
  it('passes the house four-band ladder with no faults', () => {
    expect(fourBandFaults(MODULE)).toEqual([]);
  });

  it('the measurements are what the record says they are', () => {
    // MEASURED 2026-11-18 by scripts/sov92-fill.mjs: adult 2,137 prose words;
    // child 0.521 / youth 0.608 / teen 0.677 / senior 0.684; grades 2.33 <
    // 3.99 < 4.90 < 9.87. Pinned with tolerance.
    const adult = words(MODULE.lesson);
    expect(adult).toBeGreaterThanOrEqual(2100);
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
