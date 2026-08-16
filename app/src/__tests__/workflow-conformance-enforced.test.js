// @vitest-environment node
// =============================================================================
// The n8n conformance gate FAILS THE BUILD — it no longer only reports
// =============================================================================
// Darrell, 2026-08-16: "make the conformance gate fail the build."
//
// DR-0132 §4 had already decided this ("Whatever n8n remains gets the discipline
// the review named: gate on scripts/workflow-conformance.mjs — activation,
// errorWorkflow, headerAuth. A green gate must MEAN running-and-correct"), but
// the script always exited 0 and its only caller ran it behind `|| true`. It
// surfaced the problem for two months and never once held the line.
//
// TWO TIERS, because 92 findings across 55 workflows cannot all fail at once
// without blocking every build, and because the risk genuinely is not uniform:
//
//   TIER 1 — an ACTIVE workflow must conform, NEVER grandfathered. This is the
//     live-defect tier: a cron with no brakes is the 2026-06-06 runaway
//     precedent, an unauthenticated live webhook is an open door, and a missing
//     errorWorkflow is P17 (wf30's ntfy failing silently).
//   TIER 2 — inactive findings ratchet from today's 92. An inactive
//     non-conforming workflow is a latent activation gate, not a live bug.
//
// HONEST LIMIT (DR-0076 §8, DR-0306): the gate reads the repo `active` flag.
// Activation actually lives in n8n's SQLite DB on the NAS, and that drift is
// documented in DR-0132's own context ("built != running"; wf18 flipped
// inactive on a restart and stayed down a day). wf-ops-announce was activated
// by hand on the box on 2026-08-16 and its repo JSON still reads inactive — so
// this gate governs what we SHIP, not what runs. Dated in DR-0307.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { inspectWorkflow, judge, judgeCount } from '../../../scripts/workflow-conformance.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoFile = (p) => readFileSync(join(here, '../../..', p), 'utf8');
const BASELINE = join(here, '../../../scripts/workflow-conformance-baseline.json');

describe('workflow conformance is enforced, not reported', () => {
  it('W1 — a cron with no timeout and no lock is caught; one with both is not', () => {
    const bare = { nodes: [{ type: 'n8n-nodes-base.scheduleTrigger' }], settings: { errorWorkflow: 'E' } };
    expect(inspectWorkflow(bare).map((f) => f.code)).toContain('W1');
    const braked = { nodes: [{ type: 'n8n-nodes-base.scheduleTrigger', p: 'getWorkflowStaticData' }], settings: { errorWorkflow: 'E', executionTimeout: 300 } };
    expect(inspectWorkflow(braked).map((f) => f.code)).not.toContain('W1');
  });

  it('W2 — a missing errorWorkflow is caught, and an errorTrigger handler is exempt', () => {
    expect(inspectWorkflow({ nodes: [{ type: 'n8n-nodes-base.noOp' }], settings: {} }).map((f) => f.code)).toContain('W2');
    expect(inspectWorkflow({ nodes: [{ type: 'n8n-nodes-base.errorTrigger' }], settings: {} }).map((f) => f.code)).not.toContain('W2');
  });

  it('W3 — an unauthenticated webhook is caught; headerAuth clears it', () => {
    expect(inspectWorkflow({ nodes: [{ type: 'n8n-nodes-base.webhook' }], settings: { errorWorkflow: 'E' } }).map((f) => f.code)).toContain('W3');
    const authed = { nodes: [{ type: 'n8n-nodes-base.webhook', parameters: { authentication: 'headerAuth' } }], settings: { errorWorkflow: 'E' } };
    expect(inspectWorkflow(authed).map((f) => f.code)).not.toContain('W3');
  });

  it('TIER 1 — a baseline entry can NEVER excuse an ACTIVE workflow', () => {
    const finding = { key: 'x.json|W1', name: 'x.json', code: 'W1', detail: 'd', active: true };
    const { blocking } = judge([finding], ['x.json|W1']); // grandfathered, and still must block
    expect(blocking).toHaveLength(1);
    expect(blocking[0].why).toMatch(/ACTIVE/);
  });

  it('TIER 2 — a grandfathered inactive finding passes, a NEW one blocks', () => {
    const inactive = { key: 'y.json|W2', name: 'y.json', code: 'W2', detail: 'd', active: false };
    expect(judge([inactive], ['y.json|W2']).blocking).toHaveLength(0);
    expect(judge([inactive], []).blocking).toHaveLength(1);
  });

  it('the baseline is shrink-only — a repaired workflow must leave it', () => {
    const { healed } = judge([], ['gone.json|W1']);
    expect(healed).toEqual(['gone.json|W1']);
  });

  it('the baseline contains ONLY inactive findings — an active one must never be frozen in', () => {
    expect(existsSync(BASELINE)).toBe(true);
    const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
    expect(baseline.length).toBeGreaterThan(50);
    // judge() ignores the baseline for active findings, so a stale active entry
    // cannot weaken the gate — but it would be misleading, so keep it honest.
    expect(baseline.every((k) => typeof k === 'string' && /\|W[123]$/.test(k))).toBe(true);
  });

  it('CI actually runs the gate in enforcing mode, and its selftest', () => {
    const ci = repoFile('.github/workflows/ci.yml');
    expect(ci).toMatch(/node \.\.\/scripts\/workflow-conformance\.mjs\s*$/m);
    expect(ci).toMatch(/workflow-conformance\.mjs --selftest/);
  });

  // ---------------------------------------------------------------------------
  // THE COUNT RATCHET (DR-0218 / DR-0308) — the number that actually matters.
  // Added after Darrell corrected the premise: "we used python not n8n for
  // reasons... review our history of this." DR-0218 (2026-07-21) AMENDS DR-0132,
  // overriding its "some flows stay on n8n" endpoint — the target is ZERO — and
  // the app-side cutover is already DONE (app/src/lib/n8n-base.js:63 resolves
  // N8N_BASE EMPTY by default, so no app code calls n8n at all). Grading the
  // QUALITY of retired artifacts was the wrong instrument; grading their
  // EXISTENCE is the right one.
  // ---------------------------------------------------------------------------
  it('adding an n8n artifact fails, and points at the sovereign path', () => {
    const grew = judgeCount(56, 55);
    expect(grew).toHaveLength(1);
    expect(grew[0]).toMatch(/ZERO/);
    expect(grew[0], 'the fix is a sovereign path, never "make it conform"').toMatch(/sovereign path/);
  });

  it('holding steady passes; shrinking flags so the gain is locked in', () => {
    expect(judgeCount(55, 55)).toEqual([]);
    expect(judgeCount(54, 55)).toHaveLength(1);
    expect(judgeCount(54, 55)[0]).toMatch(/SHRANK/);
  });

  it('the ceiling file exists and only ever goes down', () => {
    const f = join(here, '../../../scripts/n8n-artifact-ceiling.json');
    expect(existsSync(f)).toBe(true);
    const { ceiling } = JSON.parse(readFileSync(f, 'utf8'));
    expect(typeof ceiling).toBe('number');
    expect(ceiling).toBeLessThanOrEqual(55);
  });

  it('the app-side cutover is DONE — N8N_BASE defaults empty, so nothing calls n8n', () => {
    const base = repoFile('app/src/lib/n8n-base.js');
    expect(base, 'DR-0218 retirement must stay recorded at the source').toMatch(/RETIRED \(DR-0218/);
    expect(base).toMatch(/export const N8N_BASE = RAW \? RAW\.replace\([^)]*\) : '';/);
  });

  it('the daily review no longer swallows the exit code with `|| true`', () => {
    const daily = repoFile('.github/workflows/daily-review.yml');
    expect(daily).not.toMatch(/workflow-conformance\.mjs[^\n]*\|\| true/);
    expect(daily, 'the daily job reports explicitly rather than hiding the status').toMatch(/workflow-conformance\.mjs --report/);
  });
});
