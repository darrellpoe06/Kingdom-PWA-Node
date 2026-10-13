// =============================================================================
// CLAUDE.md byte budget — Layer 0 only shrinks (2026-07-30 comprehensive review)
// =============================================================================
// Every byte of CLAUDE.md is loaded by every session before any work (~16.5k
// tokens at its 2026-07-30 peak). The DR-0245 fold proved accretion is real:
// 10,182 B saved, 1,532 B (15%) re-added within one day, with no guard. Same
// pattern as scripts/monolith-budget.json: a frozen ceiling the file may only
// move DOWN from. New binding rules belong in a DR + a pointer line, not a new
// Layer 0 essay (the router docs/CONTEXT.md is one hop away).
import { describe, it, expect } from 'vitest';
import { statSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repo = (rel) => fileURLToPath(new URL('../../../' + rel, import.meta.url));

describe('CLAUDE.md stays inside its frozen byte budget', () => {
  it('size <= budget (lower the freeze when you shrink it; a raise needs a DR)', () => {
    const { budget } = JSON.parse(readFileSync(repo('scripts/claude-md-budget.json'), 'utf8'));
    const size = statSync(repo('CLAUDE.md')).size;
    expect(budget).toBeGreaterThan(10000); // sanity: the freeze file is real
    expect(size, `CLAUDE.md is ${size} B, over its ${budget} B ceiling — fold the growth into a DR + pointer (DR-0245), or record a DR that raises the ceiling`).toBeLessThanOrEqual(budget);
  });
  it('the Layer 1 router exists and Layer 0 points at it (the fold has a landing place)', () => {
    expect(existsSync(repo('docs/CONTEXT.md'))).toBe(true);
    expect(readFileSync(repo('CLAUDE.md'), 'utf8')).toMatch(/docs\/CONTEXT\.md/);
  });
});
