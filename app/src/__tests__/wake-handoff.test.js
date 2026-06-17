// =============================================================================
// Wake / handoff bridge — proven-to-catch tests (DR-0071 / DR-0076).
// =============================================================================
// The wake bridge lets a vendor emit a structured handoff before going offline;
// the NAS scheduler wakes it back up, tiered + braked. These tests pin the pure
// decision logic (validate the contract, decide DUE, pick the vendor) and prove
// the bundle's shipped schema + example agree with it. Per the Verification
// Doctrine: every assertion is a real decision, and the proven-to-catch cases
// fail loudly if the logic regresses (a gate that always passes is itself a lie).
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import {
  validateHandoff,
  isWakeDue,
  pickVendor,
  parseIsoMs,
  AFFINITY,
} from '../../../scripts/lib/handoff.mjs';
import { estimateCostUsd, PRICE_PER_MTOK } from '../../../scripts/lib/vendors.mjs';

const BUNDLE_REL = 'infra/ai-orchestrator/portable';
function findRepoRoot(start) {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, BUNDLE_REL, 'handoff', 'schema.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`bundle handoff/schema.json not found upward from ${start}`);
}
const repoRoot = findRepoRoot(process.cwd());
const HANDOFF_DIR = join(repoRoot, BUNDLE_REL, 'handoff');
const schema = JSON.parse(readFileSync(join(HANDOFF_DIR, 'schema.json'), 'utf8'));
const example = JSON.parse(readFileSync(join(HANDOFF_DIR, 'example.handoff.json'), 'utf8'));

// A minimal valid handoff factory.
const base = () => ({
  v: 1,
  id: 'handoff-test-0001',
  issued_at: '2026-06-16T18:00:00Z',
  issued_by: 'claude',
  wake_at: { at: '2026-06-16T22:00:00Z' },
  lane: 'test-lane',
  task: 'do the thing',
  state_pointer: { kind: 'git-branch', ref: 'feat/x' },
});

describe('handoff contract validation', () => {
  it('the shipped example handoff is valid', () => {
    expect(validateHandoff(example)).toEqual({ ok: true, errors: [] });
  });

  it('a minimal handoff is valid', () => {
    expect(validateHandoff(base()).ok).toBe(true);
  });

  it('rejects a missing required field (proven-to-catch: drop lane)', () => {
    const h = base(); delete h.lane;
    const r = validateHandoff(h);
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/lane/);
  });

  it('rejects a wrong contract version', () => {
    expect(validateHandoff({ ...base(), v: 2 }).ok).toBe(false);
  });

  it('rejects two wake drivers at once (must be exactly one)', () => {
    const h = base();
    h.wake_at = { at: '2026-06-16T22:00:00Z', after_seconds: 60 };
    const r = validateHandoff(h);
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/exactly one/);
  });

  it('rejects an unknown state_pointer kind', () => {
    const h = base(); h.state_pointer = { kind: 'dropbox', ref: 'x' };
    expect(validateHandoff(h).ok).toBe(false);
  });

  it('rejects a non-ISO issued_at (no loose date coercion)', () => {
    expect(validateHandoff({ ...base(), issued_at: 'next tuesday' }).ok).toBe(false);
    expect(parseIsoMs('next tuesday')).toBeNull();
    expect(parseIsoMs('2026-06-16T22:00:00Z')).toBe(Date.parse('2026-06-16T22:00:00Z'));
  });

  it('rejects non-object input', () => {
    expect(validateHandoff(null).ok).toBe(false);
    expect(validateHandoff([1]).ok).toBe(false);
  });
});

describe('schema + example agree with the runtime validator', () => {
  it('schema required list is enforced by validateHandoff (drop each => invalid)', () => {
    for (const field of schema.required) {
      const h = base();
      delete h[field];
      expect(validateHandoff(h).ok, `dropping required '${field}' should invalidate`).toBe(false);
    }
  });

  it('schema and example are self-consistent (example has every required key)', () => {
    for (const field of schema.required) {
      expect(example[field], `example missing required '${field}'`).toBeDefined();
    }
  });
});

describe('isWakeDue — time + condition logic', () => {
  const now = Date.parse('2026-06-16T20:00:00Z');

  it('at in the past is DUE', () => {
    const h = { ...base(), wake_at: { at: '2026-06-16T19:00:00Z' } };
    expect(isWakeDue(h, now).due).toBe(true);
  });

  it('at in the future is PENDING', () => {
    const h = { ...base(), wake_at: { at: '2026-06-16T22:00:00Z' } };
    expect(isWakeDue(h, now).due).toBe(false);
  });

  it('not_before floor blocks an otherwise-due condition', () => {
    const h = { ...base(), wake_at: { at: '2026-06-16T19:00:00Z', not_before: '2026-06-16T23:00:00Z' } };
    const r = isWakeDue(h, now);
    expect(r.due).toBe(false);
    expect(r.reason).toMatch(/not_before/);
  });

  it('after_seconds elapsed relative to issued_at is DUE', () => {
    const h = { ...base(), issued_at: '2026-06-16T19:00:00Z', wake_at: { after_seconds: 1800 } };
    expect(isWakeDue(h, now).due).toBe(true); // 19:00 + 30m = 19:30 <= 20:00
  });

  it('after_seconds not yet elapsed is PENDING', () => {
    const h = { ...base(), issued_at: '2026-06-16T19:50:00Z', wake_at: { after_seconds: 1800 } };
    expect(isWakeDue(h, now).due).toBe(false);
  });

  it('an UNKNOWN condition is NOT due (never invents a wake)', () => {
    const h = { ...base(), wake_at: { condition: 'ci-green:PR-210' } };
    expect(isWakeDue(h, now).due).toBe(false);
  });

  it('a condition the checker confirms is DUE', () => {
    const h = { ...base(), wake_at: { condition: 'ci-green:PR-210' } };
    const r = isWakeDue(h, now, { conditionChecker: (c) => c === 'ci-green:PR-210' });
    expect(r.due).toBe(true);
  });
});

describe('pickVendor — tiered, cheapest-capable, sovereignty-gated', () => {
  it('private work is LOCAL-ONLY regardless of work_type or suggestion', () => {
    const h = { ...base(), private: true, work_type: 'code', suggested_vendor: 'claude' };
    expect(pickVendor(h).vendor).toBe('local');
  });

  it('code-type maps to Claude via the affinity map', () => {
    expect(pickVendor({ ...base(), work_type: 'code' }).vendor).toBe('claude');
    expect(AFFINITY.code).toBe('claude');
  });

  it('research-type maps to Gemini', () => {
    expect(pickVendor({ ...base(), work_type: 'research' }).vendor).toBe('gemini');
  });

  it('a concrete vendor suggestion is honored (advisory tie-break)', () => {
    expect(pickVendor({ ...base(), work_type: 'research', suggested_vendor: 'claude' }).vendor).toBe('claude');
  });

  it('suggested local on non-private work keeps the affinity vendor primary (local is fallback)', () => {
    const h = { ...base(), work_type: 'code', suggested_vendor: 'local' };
    expect(pickVendor(h).vendor).toBe('claude');
  });
});

describe('budget accounting (estimateCostUsd) — measured, not guessed', () => {
  it('computes real $ from token usage and the price table', () => {
    const r = estimateCostUsd('claude-sonnet-4-6', { input_tokens: 1_000_000, output_tokens: 1_000_000 });
    expect(r.known).toBe(true);
    expect(r.usd).toBeCloseTo(PRICE_PER_MTOK['claude-sonnet-4-6'].in + PRICE_PER_MTOK['claude-sonnet-4-6'].out, 6);
  });

  it('flags an unknown model rather than fabricating a price', () => {
    const r = estimateCostUsd('some-future-model', { input_tokens: 1000, output_tokens: 1000 });
    expect(r.known).toBe(false);
    expect(r.usd).toBe(0);
  });

  it('local inference is free', () => {
    expect(estimateCostUsd('local', { input_tokens: 9999, output_tokens: 9999 }).usd).toBe(0);
  });
});
