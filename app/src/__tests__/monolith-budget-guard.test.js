// @vitest-environment node
//
// monolith-budget-guard — the forcing function for the hybrid-modular freeze
// (DR-0078 cutover; DR-0076 verification doctrine). The monolith shell is frozen
// to bug-fixes only: its line count may go DOWN, never UP. A PR that grows it past
// the frozen budget must HARD-FAIL. Logic in scripts/monolith-budget-guard.mjs
// (also a CLI: `node scripts/monolith-budget-guard.mjs`).
//
// Anti-theater (DR-0076): a gate that only ever passes is itself a lie. These
// tests PROVE the gate catches growth on synthetic counts, then assert the real
// monolith is at-or-under the frozen budget on disk.
import { describe, it, expect } from 'vitest';
import {
  countLines, evaluate, loadBudget, liveLineCount,
} from '../../../scripts/monolith-budget-guard.mjs';

describe('countLines matches wc -l semantics', () => {
  it('counts newline-terminated lines', () => {
    expect(countLines('a\nb\nc\n')).toBe(3);
  });
  it('counts a final line with no trailing newline', () => {
    expect(countLines('a\nb\nc')).toBe(3);
  });
  it('an empty file is zero lines', () => {
    expect(countLines('')).toBe(0);
  });
});

describe('proven-to-catch — the ratchet flags growth, never blocks shrink', () => {
  it('FAILS when the monolith grows past the frozen budget', () => {
    const v = evaluate(9387, 9386); // one line over
    expect(v.ok).toBe(false);
    expect(v.reason).toBe('over-budget');
    expect(v.delta).toBe(1);
  });

  it('FAILS hard on a feature-sized addition', () => {
    const v = evaluate(9386 + 400, 9386);
    expect(v.ok).toBe(false);
    expect(v.delta).toBe(400);
  });

  it('PASSES when the shell holds exactly at budget', () => {
    const v = evaluate(9386, 9386);
    expect(v.ok).toBe(true);
    expect(v.reason).toBe('at-budget');
  });

  it('PASSES and signals re-freeze when an extraction shrank the shell', () => {
    const v = evaluate(8266, 9386); // a ~1,120-line peel, like BooksTransactions
    expect(v.ok).toBe(true);
    expect(v.reason).toBe('under-budget');
    expect(v.delta).toBe(-1120);
  });
});

describe('the real repo holds the freeze', () => {
  it('has a frozen budget on disk', () => {
    const doc = loadBudget();
    expect(doc, 'scripts/monolith-budget.json must exist and define a numeric budget').toBeTruthy();
    expect(typeof doc.budget).toBe('number');
  });

  it('the live monolith is at or under its frozen budget', () => {
    const doc = loadBudget();
    const live = liveLineCount();
    expect(live, 'monolith file must exist').not.toBeNull();
    const v = evaluate(live, doc.budget);
    expect(v.ok, `monolith is ${live} lines, ${v.delta > 0 ? '+' + v.delta + ' OVER' : ''} the frozen budget ${doc.budget}`).toBe(true);
  });
});
