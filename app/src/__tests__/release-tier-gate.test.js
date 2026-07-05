// =============================================================================
// release-tier-gate — the parameter that holds Tier B/C, lets Tier A ride
// =============================================================================
// Darrell 2026-07-05 ("Yes tighten that"): the delivery lane must auto-merge
// ONLY provably low-risk (Tier A) work; everything else holds for review. This
// pins that decision and, per DR-0076, proves the gate CATCHES the risky cases
// (a gate that always said "ship" would be a lie).
import { describe, it, expect } from 'vitest';
import { classifyTier } from '../../../scripts/release-tier-gate.mjs';

describe('Tier A — provably low-risk rides the lane on green', () => {
  it('docs-only change auto-merges', () => {
    const r = classifyTier(['docs/decisions/DR-0105-x.md', 'docs/CONTEXT.md']);
    expect(r.tier).toBe('A');
    expect(r.autoMerge).toBe(true);
  });
  it('memory + foundation markdown auto-merges', () => {
    const r = classifyTier(['memory/MEMORY.md', 'CLAUDE.md']);
    expect(r).toMatchObject({ tier: 'A', autoMerge: true });
  });
  it('test-only changes auto-merge (tests gate, they do not ship behavior)', () => {
    const r = classifyTier(['app/src/__tests__/foo.test.js', 'app/src/__tests__/bar.test.jsx']);
    expect(r).toMatchObject({ tier: 'A', autoMerge: true });
  });
});

describe('Tier C — highest-risk classes HOLD (proven-to-catch)', () => {
  const holdsC = (path) => {
    const r = classifyTier([path]);
    expect(r.tier, `${path} must be Tier C`).toBe('C');
    expect(r.autoMerge, `${path} must NOT auto-merge`).toBe(false);
  };
  it('a database migration holds', () => holdsC('infra/supabase/migrations-auto/0069-x.sql'));
  it('any .sql holds', () => holdsC('app/src/lib/seed.sql'));
  it('editing the CI / delivery lane itself holds', () => holdsC('.github/workflows/auto-merge.yml'));
  it('a server API (CF Pages Function) holds', () => holdsC('app/functions/api/market-quote.js'));
  it('a backend service holds', () => holdsC('backend/server.js'));
  it('infra (orchestrator / deploy / NAS jobs) holds', () => holdsC('infra/ai-orchestrator/run.py'));
  it('a real-money path holds', () => holdsC('app/src/lib/checkout-seam.js'));
  it('the front-door / mission surface holds', () => holdsC('app/src/components/About.jsx'));
  it('COLG / church onboarding holds', () => holdsC('app/src/lib/default-church.js'));
  it('autonomous / timer-driven automation holds', () => holdsC('app/src/lib/wake-orchestrator.js'));
});

describe('Tier B — ordinary product code holds by default (rule 5)', () => {
  it('a product component holds', () => {
    const r = classifyTier(['app/src/components/Choir.jsx']);
    expect(r).toMatchObject({ tier: 'B', autoMerge: false });
  });
  it('a product lib holds', () => {
    const r = classifyTier(['app/src/lib/budget-engine.js']);
    expect(r).toMatchObject({ tier: 'B', autoMerge: false });
  });
  it('MIXED docs + product code holds (one unsafe path pulls the whole PR up)', () => {
    const r = classifyTier(['docs/notes.md', 'app/src/components/Choir.jsx']);
    expect(r.tier).toBe('B');
    expect(r.autoMerge).toBe(false);
  });
  it('MIXED safe + high-risk resolves to C (high-risk wins outright)', () => {
    const r = classifyTier(['docs/notes.md', 'infra/supabase/migrations-auto/0069.sql']);
    expect(r.tier).toBe('C');
  });
});

describe('safety defaults', () => {
  it('an empty / unreadable change set HOLDS, never auto-merges', () => {
    expect(classifyTier([]).autoMerge).toBe(false);
    expect(classifyTier(null).autoMerge).toBe(false);
    expect(classifyTier(undefined).autoMerge).toBe(false);
  });
  it('normalizes ./ and blank entries', () => {
    const r = classifyTier(['./docs/x.md', '', '  ']);
    expect(r).toMatchObject({ tier: 'A', autoMerge: true });
  });
});

describe('proven-to-catch inversion — the gate would FAIL if it stopped catching', () => {
  it('a product component is NOT in the safe set (so it can never be Tier A)', () => {
    // If someone widened TIER_A_SAFE to accidentally include app/src/**, this
    // assertion (and the Tier B cases above) would flip — the gate silently
    // opening the door is exactly what this catches.
    const r = classifyTier(['app/src/components/Choir.jsx']);
    expect(r.autoMerge).toBe(false);
  });
});
