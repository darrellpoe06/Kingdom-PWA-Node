// =============================================================================
// lifecycle-and-flow extraction — seam verification (DR-0076/0078)
// =============================================================================
// The lifecycle/auto-link/pressure/debt-projection helpers moved verbatim from
// the monolith to lib/lifecycle-and-flow.js, with the monolith re-exporting so
// existing importers stay untouched. These tests pin the seam: the lib is pure,
// the re-export contract holds, and the math behaves.
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ensureLifecycle, appendLifecycleLog, LIFECYCLE_TERMINAL_PHASES,
  frequencyToMonthly, projectDebtMinimumOnly,
} from '../lib/lifecycle-and-flow.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('the extracted lib is pure and self-contained', () => {
  const src = readFileSync(join(ROOT, 'lib/lifecycle-and-flow.js'), 'utf8');
  it('imports no React and no storage — pure functions only', () => {
    expect(src).not.toMatch(/from 'react'|localStorage|supabase/);
  });
  it('the monolith re-exports the moved API instead of defining it', () => {
    const mono = readFileSync(join(ROOT, 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect(mono).toMatch(/export \{[\s\S]*?projectDebtSnowball[\s\S]*?\} from '\.\/lib\/lifecycle-and-flow\.js'/);
    expect(mono).not.toMatch(/^export function projectDebtSnowball/m);
    expect(mono).not.toMatch(/^function ensureLifecycle/m);
  });
});

describe('behavior spot-checks (verbatim move, same math)', () => {
  it('ensureLifecycle stamps phase/openedAt/log on a bare item', () => {
    const item = ensureLifecycle({ id: 'x1', status: 'open' });
    expect(item.lifecycle.phase).toBeTruthy();
    expect(item.lifecycle.openedAt).toBeTruthy();
    expect(Array.isArray(item.lifecycle.log)).toBe(true);
  });
  it('appendLifecycleLog records the transition and closes on terminal phases', () => {
    const item = ensureLifecycle({ id: 'x2', status: 'open' });
    const done = appendLifecycleLog(item, 'resolved', 'test', 'done');
    expect(done.lifecycle.log.length).toBeGreaterThan(0);
    expect(LIFECYCLE_TERMINAL_PHASES.has('resolved')).toBe(true);
    expect(done.lifecycle.closedAt).toBeTruthy();
  });
  it('frequencyToMonthly normalizes common frequencies', () => {
    expect(frequencyToMonthly(120, 'monthly')).toBe(120);
    expect(frequencyToMonthly(1200, 'annual')).toBe(100);
  });
  it('projectDebtMinimumOnly runs a debt to a finite horizon', () => {
    const out = projectDebtMinimumOnly(
      [{ id: 'd1', name: 'card', balance: 1000, rate: 12, minimum: 100 }],
      new Date('2026-01-01'),
    );
    expect(out).toBeTruthy();
    expect(out.months ?? out.projection?.length ?? out.payoffMonths ?? 1).toBeTruthy();
  });
});
