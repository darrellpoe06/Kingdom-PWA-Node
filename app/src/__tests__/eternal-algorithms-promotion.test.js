// =============================================================================
// Eternal Algorithms — the finalize -> promote gate (Verification Doctrine).
// =============================================================================
// The library is the FINISHED gallery: drafting lives in Study (the workshop),
// and ONLY a finalized framework promotes in. Each test FAILS if the gate
// regresses (asserts the catch, not just the happy path):
//   1. validateFinal REJECTS a draft (missing name/4D/3D/outcome) and the whole
//      seed catalog PASSES. Scripture-empty is allowed (no fabrication).
//   2. promoteFromStudy rejects a draft, admits a final entry with provenance,
//      and is IDEMPOTENT by sourceId (re-promote updates, never duplicates).
//   3. End-to-end no-rough-drafts: a SUGGESTED (not accepted) thought cannot
//      promote (toEternalAlgorithmDraft -> null); only an ACCEPTED, teaching-
//      ready thought can. Drafts stay in Study; finished output reaches the gallery.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { normalizeEntry } from '../lib/study-space.js';
import {
  applySuggestion, acceptFinalization, isTeachingReady, toEternalAlgorithmDraft,
} from '../lib/thought-finalizer.js';
import {
  validateFinal, promoteFromStudy, findBySource, promotedSourceIds,
  seedIfEmpty, emptyLibrary, SEED_ALGORITHMS,
} from '../lib/eternal-algorithms.js';

const COMPLETE = {
  name: 'Build by Resistance',
  fourD: { summary: 'You meant evil... God meant it for good (Gen 50:20).', scripture: 'Genesis 50:20' },
  threeD: { summary: 'The load builds the muscle; the obstacle becomes the way.' },
  outcome: 'Growth and strength — the enemy becomes a footstool.',
  tags: ['resistance'],
};

describe('validateFinal — the no-rough-drafts gate', () => {
  it('passes a complete framework and the entire seed catalog', () => {
    expect(validateFinal(COMPLETE).ok).toBe(true);
    for (const a of SEED_ALGORITHMS) {
      expect(validateFinal(a).ok, `seed "${a.name}" must be final-valid`).toBe(true);
    }
  });

  it('CATCHES each missing required part (name / 4D / 3D / outcome)', () => {
    expect(validateFinal({ ...COMPLETE, name: '' }).missing).toContain('name');
    expect(validateFinal({ ...COMPLETE, fourD: { summary: '' } }).missing).toContain('4D expression');
    expect(validateFinal({ ...COMPLETE, threeD: { summary: '' } }).missing).toContain('3D expression');
    expect(validateFinal({ ...COMPLETE, outcome: '   ' }).missing).toContain('outcome');
    expect(validateFinal({ ...COMPLETE, outcome: '' }).ok).toBe(false);
  });

  it('allows an empty Scripture ref (never forces a fabricated verse)', () => {
    const v = validateFinal({ ...COMPLETE, fourD: { summary: '4d', scripture: '' } });
    expect(v.ok).toBe(true);
    expect(v.hasScripture).toBe(false);
  });
});

describe('promoteFromStudy — workshop -> finished gallery', () => {
  it('REJECTS a draft and leaves the library untouched', () => {
    const lib = seedIfEmpty(emptyLibrary(), 0);
    const before = lib.entries.length;
    const res = promoteFromStudy(lib, { name: 'X', outcome: '' }, { sourceId: 's1' });
    expect(res.ok).toBe(false);
    expect(res.missing).toContain('outcome');
    expect(res.library).toBeUndefined();      // nothing returned to persist
    expect(lib.entries.length).toBe(before);  // unchanged
  });

  it('admits a final entry with study provenance, preserving the seed catalog', () => {
    const lib = seedIfEmpty(emptyLibrary(), 0);
    const seedCount = lib.entries.length;
    const res = promoteFromStudy(lib, COMPLETE, { sourceId: 'study-1', nowMs: 5 });
    expect(res.ok).toBe(true);
    expect(res.library.entries.length).toBe(seedCount + 1); // seeds kept, +1 promoted
    const got = findBySource(res.library.entries, 'study-1');
    expect(got.source).toBe('study');
    expect(got.sourceId).toBe('study-1');
    expect(got.promotedAt).toBeTruthy();
    expect(got.seed).toBe(false);
    expect(got.outcome).toBe(COMPLETE.outcome);
    expect(promotedSourceIds(res.library.entries).has('study-1')).toBe(true);
  });

  it('is IDEMPOTENT by sourceId — re-promote updates, never duplicates', () => {
    const lib = seedIfEmpty(emptyLibrary(), 0);
    const first = promoteFromStudy(lib, COMPLETE, { sourceId: 'study-1', nowMs: 5 });
    const firstId = findBySource(first.library.entries, 'study-1').id;
    const count = first.library.entries.length;

    const edited = { ...COMPLETE, outcome: 'Growth, strength, and the enemy underfoot.' };
    const second = promoteFromStudy(first.library, edited, { sourceId: 'study-1', nowMs: 9 });
    expect(second.library.entries.length).toBe(count); // NO duplicate
    const after = findBySource(second.library.entries, 'study-1');
    expect(after.id).toBe(firstId);                     // same entry
    expect(after.outcome).toBe(edited.outcome);         // content refreshed
  });
});

describe('end-to-end — only FINALIZED thoughts promote (drafts stay in Study)', () => {
  const base = normalizeEntry({
    title: 'Build by Resistance', deep: 'the long deep version', plain: 'the plain version',
    scripture: 'Genesis 50:20', tags: ['resistance'],
  }, 0, 0);
  const suggestion = { fourD: { summary: '4d reading', scripture: 'Genesis 50:20' }, threeD: { summary: '3d practice' }, outcome: 'growth' };

  it('a SUGGESTED (not accepted) thought cannot promote', () => {
    const suggested = applySuggestion(base, suggestion, { source: 'local' });
    expect(isTeachingReady(suggested)).toBe(false);
    expect(toEternalAlgorithmDraft(suggested)).toBeNull(); // gate at the source

    // And even if someone hands the raw (incomplete-by-status) thought forward,
    // the library gate still refuses anything that isn't a complete framework.
    const res = promoteFromStudy(seedIfEmpty(emptyLibrary(), 0), toEternalAlgorithmDraft(suggested) || {}, { sourceId: base.id });
    expect(res.ok).toBe(false);
  });

  it('an ACCEPTED, teaching-ready thought promotes into the gallery', () => {
    const accepted = acceptFinalization(applySuggestion(base, suggestion, { source: 'local' }), '2026-06-25T00:00:00.000Z');
    expect(isTeachingReady(accepted)).toBe(true);
    const draft = toEternalAlgorithmDraft(accepted);
    expect(draft).toBeTruthy();

    const res = promoteFromStudy(seedIfEmpty(emptyLibrary(), 0), draft, { sourceId: accepted.id, nowMs: 1 });
    expect(res.ok).toBe(true);
    const got = findBySource(res.library.entries, accepted.id);
    expect(got.name).toBe('Build by Resistance');
    expect(got.outcome).toBe('growth');
    expect(got.source).toBe('study');
  });
});
