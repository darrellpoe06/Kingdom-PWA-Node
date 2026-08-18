// @vitest-environment node
// =============================================================================
// Every audience-facing field is under the verbatim gate — not just `lesson`
// =============================================================================
// Found 2026-08-15 while building L79, by running DR-0219's first step on our own
// gate: what does it SAY it does, and what does it ARE-actually-do?
//
// SHOULD: living-lessons-l68-verses.test.js opens with "every quoted Scripture is
// KJV-VERBATIM (DR-0076)" — a claim about the lesson, unqualified.
// ARE: it reads `mod.lesson` and nothing else.
// GAP: `bigIdea`, `inApp`, `benefits[]`, `anchor.theme`, `levels.child/teen/senior`,
// every quiz question, option and explanation, and the entire facilitator block
// are audience-facing prose carrying quoted Scripture — 3363 referenced quotes,
// none of them ever checked. The child band was the least-gated prose in the
// repository and it is the band read to children.
// CLOSE: scripts/lesson-quote-guard.mjs, ratcheted.
//
// 556 defect sites exist today, in four classes with four different remedies
// (352 case-only, 108 emphasis-inside-the-quote, 104 re-worded, 14 unresolvable
// references). They are grandfathered rather than swept: a blind find-replace
// through quoted Scripture is the very move DR-0210's bright line forbids, and
// the bracketed-gloss convention ("charity [love]") is an editorial question for
// the SME rather than something a script gets to decide. See DR-0309 for the
// re-review dates on working that debt down.
//
// PROVEN-TO-CATCH (DR-0076 §3): `node scripts/lesson-quote-guard.mjs --selftest`
// injects a fresh defect of each class and requires a catch; the shrink-only case
// below fails if a healed site is left in the baseline.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { findDefects, proseFields } from '../../../scripts/lesson-quote-guard.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const BASELINE = join(here, '../../../scripts/lesson-quote-baseline.json');

describe('lesson quotes outside the `lesson` field', () => {
  const defects = findDefects(LIVING_LESSONS_MODULES);
  const keys = [...new Set(defects.map((d) => d.key))].sort();
  const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : [];

  it('no NEW altered quote enters any audience-facing field', () => {
    const known = new Set(baseline);
    const fresh = keys.filter((k) => !known.has(k));
    const detail = fresh.map((k) => {
      const d = defects.find((x) => x.key === k);
      return `${d.cls} — ${k} — "${d.quoted.slice(0, 70)}"`;
    }).join('\n');
    expect(fresh, `New altered quote(s). Fetch the verse verbatim; keep emphasis and glosses OUTSIDE the quotation marks (DR-0076, DR-0210).\n${detail}`).toEqual([]);
  });

  it('the baseline is shrink-only — a repaired quote must leave it', () => {
    const healed = baseline.filter((k) => !keys.includes(k));
    expect(healed, `These now match the corpus; remove them from scripts/lesson-quote-baseline.json:\n${healed.join('\n')}`).toEqual([]);
  });

  it('reads every audience-facing field, so the gate cannot silently narrow again', () => {
    const labels = proseFields({
      bigIdea: 'x', inApp: 'x', benefits: ['x'], anchor: { theme: 'x' },
      levels: { child: 'x', teen: 'x', senior: 'x' },
      quiz: { questions: [{ q: 'x', options: ['x'], explain: 'x' }] },
      facilitator: { talkingPoints: ['x'], howToRun: 'x', discussionPrompts: ['x'] },
    }).map(([l]) => l);
    for (const need of ['bigIdea', 'inApp', 'benefits[0]', 'anchor.theme', 'levels.child',
      'levels.teen', 'levels.senior', 'quiz[0].q', 'quiz[0].opt0', 'quiz[0].explain',
      'fac.talk[0]', 'fac.howToRun', 'fac.prompt[0]']) {
      expect(labels, `the gate must read ${need}`).toContain(need);
    }
  });

  it('actually finds quotes to check — a regex drift would silently pass everything', () => {
    let seen = 0;
    const RE = /"([^"]+)"\s*\(((?:[1-3]\s)?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?\)/g;
    for (const m of LIVING_LESSONS_MODULES) {
      for (const [, text] of proseFields(m)) seen += [...String(text).matchAll(RE)].length;
    }
    expect(seen, 'thousands of referenced quotes live outside mod.lesson').toBeGreaterThan(2000);
  });

  it('L79 — the lesson this gap was found while building — is clean in EVERY field', () => {
    const l79 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll79'));
    expect(l79).toBeTruthy();
    const bad = findDefects([l79]);
    expect(bad.map((d) => `${d.label} ${d.ref} "${d.quoted.slice(0, 60)}"`), 'new work carries no debt').toEqual([]);
  });
});
