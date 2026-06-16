// The live review needs the NAS (qwen2.5 via wf-llm-review), but the PARSING +
// the tier decision are pure and verified here so the advisory surface never
// ships untested (DR-0076 — measure/prove, don't claim). Two surfaces under test:
//   1. app side  — app/src/lib/llm-review.js (what the Build-board card renders)
//   2. engine     — scripts/orchestration/llm-review.mjs (pure helpers)
import { describe, it, expect } from 'vitest';
import { normalizeLlmReview, llmReviewKpi, findingLocation, SEVERITY_RANK } from '../lib/llm-review.js';
import {
  reviewableFiles, decideTier, countDiffLines, parseFindings, buildReport, DEFAULTS,
} from '../../../scripts/orchestration/llm-review.mjs';

// A representative report envelope, shaped exactly as the engine's buildReport
// emits and wf-llm-review serves.
const REPORT = {
  ok: true,
  advisory: true,
  generated_at: '2026-06-16T12:00:00.000Z',
  base: 'origin/main',
  head: 'feat/x',
  model: 'qwen2.5',
  source: 'local',
  escalated: false,
  escalation_recommended: false,
  files_reviewed: ['app/src/a.js', 'app/src/b.js'],
  files_reviewed_count: 2,
  diff_lines: 42,
  counts: { findings: 2, bugs: 1, warnings: 1, nits: 0 },
  findings: [
    { file: 'app/src/a.js', line: 10, severity: 'warning', concern: 'unhandled promise', suggestion: 'await it' },
    { file: 'app/src/b.js', line: 5, severity: 'bug', concern: 'off-by-one', suggestion: 'use <=' },
  ],
};

describe('normalizeLlmReview (app side)', () => {
  it('returns ok:false (not a throw) for null / garbage / explicit error', () => {
    expect(normalizeLlmReview(null).ok).toBe(false);
    expect(normalizeLlmReview('nope').ok).toBe(false);
    const n = normalizeLlmReview({ ok: false, error: 'ollama unreachable' });
    expect(n.ok).toBe(false);
    expect(n.error).toMatch(/unreachable/i);
    expect(n.findings).toEqual([]);
  });

  it('normalizes a real report and sorts findings bug-first', () => {
    const n = normalizeLlmReview(REPORT);
    expect(n.ok).toBe(true);
    expect(n.model).toBe('qwen2.5');
    expect(n.filesReviewedCount).toBe(2);
    expect(n.counts).toEqual({ findings: 2, bugs: 1, warnings: 1, nits: 0 });
    expect(n.findings[0].severity).toBe('bug'); // bug sorts above warning
    expect(n.findings[0].file).toBe('app/src/b.js');
  });

  it('drops findings with no concern and buckets unknown severities to warning', () => {
    const n = normalizeLlmReview({ ok: true, findings: [
      { file: 'x.js', line: 1, severity: 'whatever', concern: 'real concern' },
      { file: 'y.js', line: 2, severity: 'bug' }, // no concern -> dropped
    ] });
    expect(n.findings).toHaveLength(1);
    expect(n.findings[0].severity).toBe('warning');
  });
});

describe('findingLocation', () => {
  it('renders file:line, or just file when line is unknown', () => {
    expect(findingLocation({ file: 'a.js', line: 9 })).toBe('a.js:9');
    expect(findingLocation({ file: 'a.js', line: null })).toBe('a.js');
    expect(findingLocation(null)).toBe('(unknown)');
  });
});

describe('llmReviewKpi', () => {
  it('is honest-idle when there is no report, never a misleading green', () => {
    expect(llmReviewKpi('loading', null).status).toBe('idle');
    expect(llmReviewKpi('offline', null).status).toBe('idle');
    expect(llmReviewKpi('ok', { ok: false }).status).toBe('idle');
  });
  it('maps bugs->problem, warnings->attention, clean->good', () => {
    expect(llmReviewKpi('ok', normalizeLlmReview(REPORT)).status).toBe('problem');
    const warnOnly = normalizeLlmReview({ ok: true, findings: [{ file: 'a', line: 1, severity: 'warning', concern: 'c' }] });
    expect(llmReviewKpi('ok', warnOnly).status).toBe('attention');
    const clean = normalizeLlmReview({ ok: true, findings: [] });
    expect(llmReviewKpi('ok', clean).status).toBe('good');
    expect(llmReviewKpi('ok', clean).label).toMatch(/no bugs/i);
  });
});

describe('engine: reviewableFiles', () => {
  it('keeps source files and skips lockfiles, bundles, deps, non-code', () => {
    const out = reviewableFiles([
      'app/src/a.jsx', 'scripts/x.mjs', 'infra/y.sh', 'db/z.sql',
      'app/package-lock.json', 'node_modules/foo/index.js', 'dist/app.min.js',
      'README.md', 'logo.png', '', null,
    ]);
    expect(out).toEqual(['app/src/a.jsx', 'scripts/x.mjs', 'infra/y.sh', 'db/z.sql']);
  });
});

describe('engine: decideTier (sovereign-first)', () => {
  it('stays local for a normal diff', () => {
    const t = decideTier({ fileCount: 3, diffLines: 100 });
    expect(t.tier).toBe('local');
    expect(t.escalate).toBe(false);
  });
  it('recommends escalation for a big diff but stays local when NOT armed', () => {
    const t = decideTier({ fileCount: 99, diffLines: 100, allowVendor: false, hasKey: false });
    expect(t.tier).toBe('local');
    expect(t.escalate).toBe(true);
    expect(t.reason).toMatch(/not armed/i);
  });
  it('escalates to vendor only when big AND armed (flag + key)', () => {
    const t = decideTier({ fileCount: 99, diffLines: 100, allowVendor: true, hasKey: true });
    expect(t.tier).toBe('vendor');
    expect(t.escalate).toBe(true);
  });
  it('does NOT escalate to vendor when armed but diff is small (no spend without need)', () => {
    const t = decideTier({ fileCount: 2, diffLines: 50, allowVendor: true, hasKey: true });
    expect(t.tier).toBe('local');
    expect(t.escalate).toBe(false);
  });
  it('--deep forces escalation when armed', () => {
    const t = decideTier({ fileCount: 1, diffLines: 1, deep: true, allowVendor: true, hasKey: true });
    expect(t.tier).toBe('vendor');
  });
  it('unreachable local model escalates if armed, else fails honestly local', () => {
    expect(decideTier({ fileCount: 1, diffLines: 1, ollamaReachable: false, allowVendor: true, hasKey: true }).tier).toBe('vendor');
    const unarmed = decideTier({ fileCount: 1, diffLines: 1, ollamaReachable: false });
    expect(unarmed.tier).toBe('local');
    expect(unarmed.escalate).toBe(true);
    expect(unarmed.reason).toMatch(/unreachable/i);
  });
});

describe('engine: countDiffLines', () => {
  it('counts +/- content lines and ignores the +++/--- headers', () => {
    const diff = ['--- a/x', '+++ b/x', '@@ -1 +1,2 @@', '-old', '+new', '+added', ' context'].join('\n');
    expect(countDiffLines(diff)).toBe(3);
    expect(countDiffLines('')).toBe(0);
    expect(countDiffLines(null)).toBe(0);
  });
});

describe('engine: parseFindings (the trust-nothing boundary)', () => {
  it('returns [] for null / non-JSON / empty, never throws', () => {
    expect(parseFindings(null)).toEqual([]);
    expect(parseFindings('not json at all')).toEqual([]);
    expect(parseFindings('')).toEqual([]);
  });
  it('parses a clean JSON object', () => {
    const out = parseFindings('{"findings":[{"line":3,"severity":"bug","concern":"x","suggestion":"y"}]}', { file: 'a.js' });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ file: 'a.js', line: 3, severity: 'bug', concern: 'x', suggestion: 'y' });
  });
  it('unwraps a ```json fence and tolerates surrounding prose', () => {
    const raw = 'Here is the review:\n```json\n{"findings":[{"line":1,"severity":"warning","concern":"c"}]}\n```\nThanks!';
    const out = parseFindings(raw, { file: 'b.js' });
    expect(out).toHaveLength(1);
    expect(out[0].severity).toBe('warning');
    expect(out[0].suggestion).toBe(null);
  });
  it('accepts an Ollama-style {response: "..."} wrapper and a bare array', () => {
    expect(parseFindings({ response: '{"findings":[{"severity":"nit","concern":"c"}]}' })[0].severity).toBe('nit');
    expect(parseFindings('[{"severity":"bug","concern":"c"}]')[0].severity).toBe('bug');
  });
  it('buckets an unknown severity to warning and drops concern-less rows', () => {
    const out = parseFindings('{"findings":[{"severity":"explode","concern":"c"},{"severity":"bug"}]}');
    expect(out).toHaveLength(1);
    expect(out[0].severity).toBe('warning');
  });
});

describe('engine: buildReport', () => {
  it('is always advisory and sorts findings bug-first', () => {
    const r = buildReport({
      base: 'origin/main', head: 'h', model: 'qwen2.5', tier: 'local', escalate: false,
      filesReviewed: ['a.js', 'b.js'], diffLines: 12, generatedAt: 'T',
      findings: [
        { file: 'a.js', line: 1, severity: 'nit', concern: 'c1' },
        { file: 'b.js', line: 2, severity: 'bug', concern: 'c2' },
      ],
    });
    expect(r.advisory).toBe(true);
    expect(r.ok).toBe(true);
    expect(r.escalated).toBe(false);
    expect(r.findings[0].severity).toBe('bug');
    expect(r.counts).toEqual({ findings: 2, bugs: 1, warnings: 0, nits: 1 });
    expect(r.note).toMatch(/advisory/i);
  });
  it('carries an error envelope honestly (ok:false), never a fake pass', () => {
    const r = buildReport({ base: 'origin/main', head: 'h', model: 'qwen2.5', tier: 'local', escalate: true, escalateReason: 'unreachable', generatedAt: 'T', error: 'local Ollama unreachable' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/unreachable/i);
    expect(r.escalation_recommended).toBe(true);
  });
  it('marks the source as vendor when escalated', () => {
    const r = buildReport({ base: 'b', head: 'h', model: 'claude-haiku-4-5-20251001', tier: 'vendor', escalate: true, generatedAt: 'T', findings: [] });
    expect(r.escalated).toBe(true);
    expect(r.source).toMatch(/^vendor:/);
  });
});

describe('shared severity contract', () => {
  it('app and engine agree on the severity ranking', () => {
    expect(SEVERITY_RANK).toEqual({ bug: 3, warning: 2, nit: 1 });
    expect(DEFAULTS.model).toBe('qwen2.5'); // sovereign-first default
  });
});
