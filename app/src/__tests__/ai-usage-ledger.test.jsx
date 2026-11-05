// =============================================================================
// ai-usage-ledger — the slide's project-results table, kept by the build
// (DR-1338, DR-1330 D8). Proven to catch: a cost with no tokens, a session
// reading that is not a subtraction, a record that landed without its line;
// the live ledger is sound and covers every record from DR-1331 on; the
// report never shows a zero where no meter exists.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateLedger, validateEntry, rollup, ledgeredDrs, loadAiUsageLedger } from '../lib/ai-usage-ledger.js';
import { recordsOnDisk, missingLines } from '../../../scripts/ai-usage-ledger.mjs';
import AiUsageReport from '../components/AiUsageReport.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const ok = {
  id: 'x',
  date: '2026-11-05',
  task: 't',
  drs: ['DR-1339'],
  prs: [1],
  model: 'claude-fable-5-1',
  tokens: null,
  costUsd: null,
  wallClockHours: 0.5,
  estimateWithoutAiHours: 8,
  notes: '',
};
const ledger = (entries, sessions = []) => ({ models: { 'claude-fable-5-1': {} }, sessions, entries });

describe('ai-usage-ledger: proven to catch', () => {
  it('passes a sound entry and refuses a cost with no tokens behind it', () => {
    expect(validateEntry(ok)).toEqual([]);
    expect(validateEntry({ ...ok, costUsd: 1.2 })[0]).toMatch(/a cost with no tokens is a guess/);
    expect(validateEntry({ ...ok, tokens: { in: 10, out: 5 }, costUsd: 1.2 })).toEqual([]);
  });
  it('refuses a missing DR, a zero wall clock, a bad date, a duplicate id, an undescribed model', () => {
    expect(validateEntry({ ...ok, drs: [] })[0]).toMatch(/drs must name/);
    expect(validateEntry({ ...ok, wallClockHours: 0 })[0]).toMatch(/wallClockHours/);
    expect(validateEntry({ ...ok, date: '5 Nov' })[0]).toMatch(/date must be/);
    expect(validateLedger(ledger([ok, { ...ok }]))).toContain('x: duplicate id');
    expect(validateLedger(ledger([{ ...ok, model: 'gpt-nope' }]))[0]).toMatch(/not described in models/);
  });
  it('refuses a session token reading that is not a subtraction of two readings', () => {
    const s = { id: 's', tokensBudgetAtStart: 100, tokensBudgetAtRead: 60, sessionTokensObserved: 50, tasks: ['x'] };
    expect(validateLedger(ledger([ok], [s]))[0]).toMatch(/must equal budgetAtStart - budgetAtRead/);
    expect(validateLedger(ledger([ok], [{ ...s, sessionTokensObserved: 40 }]))).toEqual([]);
  });
  it('names a record that landed without its line', () => {
    expect(missingLines([1331, 1332, 1340], new Set(['DR-1331', 'DR-1344']))).toEqual(['DR-1340']);
    expect(missingLines([1331], new Set(['DR-1331']))).toEqual([]);
  });
  it('rolls up wall clock, the estimate, the ratio and the unmetered count', () => {
    const r = rollup(ledger([ok, { ...ok, id: 'y', wallClockHours: 0.5, estimateWithoutAiHours: 8, tokens: { in: 1000, out: 500 }, costUsd: 0.02 }]));
    expect(r.tasks).toBe(2);
    expect(r.wallClockHours).toBe(1);
    expect(r.estimateWithoutAiHours).toBe(16);
    expect(r.ratio).toBe(16);
    expect(r.meteredTasks).toBe(1);
    expect(r.unmeteredTasks).toBe(1);
    expect(r.meteredUsd).toBe(0.02);
  });
});

describe('ai-usage-ledger: the live ledger', () => {
  it('is sound and covers every decision record from DR-1331 on', () => {
    const live = loadAiUsageLedger();
    expect(validateLedger(live)).toEqual([]);
    expect(missingLines(recordsOnDisk(join(ROOT, 'docs/decisions')), ledgeredDrs(live))).toEqual([]);
  });
});

describe('AiUsageReport', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });
  async function mount(el) {
    const c = document.createElement('div');
    document.body.appendChild(c);
    await act(async () => {
      createRoot(c).render(el);
    });
    return c;
  }
  it('says "not metered" where no meter exists, never a free-looking zero', async () => {
    const c = await mount(
      createElement(AiUsageReport, {
        ledger: ledger([ok], [{ id: 's', tokensBudgetAtStart: 100, tokensBudgetAtRead: 60, sessionTokensObserved: 40, tasks: ['x'] }]),
      })
    );
    expect(c.querySelector('[data-testid="ai-cost"]').textContent).toContain('not metered');
    expect(c.querySelector('[data-testid="ai-cost"]').textContent).toContain('40 session tokens');
    expect(c.querySelector('[data-testid="ai-usage-table"]').textContent).toContain('not metered');
    expect(c.querySelector('[data-testid="ai-estimate"]').textContent).toContain('about 16× the wall clock');
  });
  it('says what to do when nothing is ledgered', async () => {
    const c = await mount(createElement(AiUsageReport, { ledger: ledger([]) }));
    expect(c.querySelector('[data-testid="ai-usage-empty"]').textContent).toContain('--add');
  });
});
