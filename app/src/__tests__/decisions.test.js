// =============================================================================
// decisions.test.js — PROVEN-TO-CATCH tests for the auto-derived Decisions feed
// (Darrell 2026-07-01: Decisions auto-populate from what the app actually did —
// board hand-offs + concern resolutions — EACH with its rationale). Every source
// is shown to produce a decision event carrying its WHY, deterministically, with
// no one typing it in.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { deriveAppDecisions, DECISION_KIND } from '../lib/decisions.js';

describe('deriveAppDecisions — board hand-offs', () => {
  it('projects a kind:handoff discussion into a decision WITH its note as rationale', () => {
    const discussions = [{
      id: 'd1', slug: 'dc-1', kind: 'handoff', title: 'Ship the CapEx fix',
      body: 'Pushed to Ari because it is a mechanical repair, no human call needed.',
      meta: { handoff: { to: 'Ari' } }, createdAt: '2026-07-01T10:00:00Z',
    }];
    const out = deriveAppDecisions({ discussions, concerns: [], seeds: [] });
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe('handoff');
    expect(out[0].decision).toBe('Pushed to Ari');
    expect(out[0].rationale).toContain('mechanical repair');
    expect(out[0].date).toBe('2026-07-01');
    expect(out[0].owner).toBe('Ari');
  });

  it('projects a kind:decision discussion with body as rationale', () => {
    const discussions = [{ id: 'd2', slug: 'dc-2', kind: 'decision', title: 'Use derivation, not a new table', body: 'The concerns table already exists (0039); a new one would duplicate.', createdAt: '2026-07-01T09:00:00Z' }];
    const out = deriveAppDecisions({ discussions, concerns: [], seeds: [] });
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe('decision');
    expect(out[0].rationale).toContain('already exists');
  });

  it('ignores non-decision discussions (directive / reflection)', () => {
    const discussions = [{ id: 'd3', kind: 'directive', title: 'do this', body: 'x' }, { id: 'd4', kind: 'reflection', title: 'thought', body: 'y' }];
    expect(deriveAppDecisions({ discussions, concerns: [], seeds: [] })).toHaveLength(0);
  });
});

describe('deriveAppDecisions — concern resolutions', () => {
  it('projects a resolved concern into a decision whose WHY is the solution', () => {
    const concerns = [{ id: 'cn-1', concern: 'wf18 import was down', solution: 'Root-caused and repaired the stalled-import path.', status: 'done', targetDate: '2026-06-17', area: 'Banking import' }];
    const out = deriveAppDecisions({ discussions: [], concerns, seeds: [] });
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe('resolution');
    expect(out[0].title).toContain('wf18');
    expect(out[0].rationale).toContain('Root-caused');
    expect(out[0].date).toBe('2026-06-17');
  });

  it('does NOT record open / in-progress concerns as decisions', () => {
    const concerns = [{ id: 'cn-2', concern: 'still open', solution: 'x', status: 'open' }, { id: 'cn-3', concern: 'wip', solution: 'y', status: 'in-progress' }];
    expect(deriveAppDecisions({ discussions: [], concerns, seeds: [] })).toHaveLength(0);
  });

  it('a DB concern supersedes a same-id seed (no duplicate resolution)', () => {
    const concerns = [{ id: 'seed-x', concern: 'db version', solution: 'db why', status: 'done', targetDate: '2026-06-20' }];
    const seeds = [{ id: 'seed-x', concern: 'seed version', solution: 'seed why', status: 'done', targetDate: '2026-06-18' }];
    const out = deriveAppDecisions({ discussions: [], concerns, seeds });
    expect(out).toHaveLength(1);
    expect(out[0].rationale).toBe('db why');
  });
});

describe('deriveAppDecisions — determinism, ordering, self-describe', () => {
  it('sorts newest-first and every event carries a rationale', () => {
    const discussions = [{ id: 'd1', kind: 'handoff', title: 'older', body: 'why1', meta: { handoff: { to: 'Darrell' } }, createdAt: '2026-06-01T00:00:00Z' }];
    const concerns = [{ id: 'cn-1', concern: 'newer', solution: 'why2', status: 'done', targetDate: '2026-07-01' }];
    const out = deriveAppDecisions({ discussions, concerns, seeds: [] });
    expect(out.map((d) => d.date)).toEqual(['2026-07-01', '2026-06-01']);
    expect(out.every((d) => d.rationale && d.rationale.length > 0)).toBe(true);
  });

  it('every emitted kind has display metadata', () => {
    const discussions = [{ id: 'd1', kind: 'handoff', title: 't', body: 'b', meta: { handoff: { to: 'Ari' } }, createdAt: '2026-07-01' }];
    const out = deriveAppDecisions({ discussions, concerns: [], seeds: [] });
    for (const d of out) expect(DECISION_KIND[d.kind]).toBeTruthy();
  });

  it('is empty and safe when every source is explicitly empty', () => {
    expect(deriveAppDecisions({ discussions: [], concerns: [], seeds: [] })).toEqual([]);
  });

  it('by DEFAULT surfaces resolved baseline (seed) concerns as decisions with rationale', () => {
    // No seeds arg → defaults to SEED_CONCERNS. Every 'done' baseline concern is a
    // real recorded decision (we resolved it, here's how) — no one types it in.
    const out = deriveAppDecisions({ discussions: [], concerns: [] });
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((d) => d.kind === 'resolution' && d.rationale && d.rationale.length > 0)).toBe(true);
  });
});
