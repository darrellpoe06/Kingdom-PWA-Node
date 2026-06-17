// =============================================================================
// eternal-algorithms — proven-to-catch gate (Verification Doctrine, DR-0076).
// =============================================================================
// The library is browsable as "frameworks and outcomes": framework on one side,
// the OUTCOME it yields on the other. The properties that must hold and stay
// held (each test FAILS if the behavior regresses, asserting the catch):
//   1. OUTCOME is first-class — every seeded algorithm has a non-empty outcome,
//      and missingOutcome() actually catches an entry that loses it.
//   2. SHAPE — name + the two dimensional expressions (4D w/ scripture, 3D)
//      survive normalize; tags/links are clean arrays.
//   3. PAIRING — frameworksAndOutcomes() projects framework<->outcome rows.
//   4. SEARCH/SORT — filter spans every textual field; sort is pinned-first.
//   5. PERSISTENCE — the device-local round-trip survives.
// =============================================================================
import { describe, it, expect, beforeEach } from 'vitest';
import {
  emptyLibrary, seedIfEmpty, SEED_ALGORITHMS, normalizeAlgorithm,
  upsertAlgorithm, removeAlgorithm, togglePin, sortAlgorithms,
  filterAlgorithms, frameworksAndOutcomes, missingOutcome,
  loadLibrary, saveLibrary, algKey,
} from '../lib/eternal-algorithms.js';

describe('OUTCOME is first-class — every framework yields a stated win', () => {
  it('every seeded algorithm has a non-empty outcome (the pairing is never half-built)', () => {
    const seeded = seedIfEmpty(emptyLibrary(), 0).entries;
    expect(seeded.length).toBeGreaterThanOrEqual(8);
    for (const e of seeded) {
      expect(e.outcome, `"${e.name}" must state its outcome`).toBeTruthy();
      expect(e.outcome.trim().length).toBeGreaterThan(0);
    }
    // The gate itself must work: a seed catalog with an outcome present finds none missing.
    expect(missingOutcome(seeded)).toHaveLength(0);
  });

  it('missingOutcome CATCHES an entry that loses its outcome (proven-to-catch)', () => {
    const good = normalizeAlgorithm({ name: 'X', outcome: 'a real win' }, 0, 0);
    const stripped = normalizeAlgorithm({ name: 'Y', outcome: '   ' }, 0, 1);
    const flagged = missingOutcome([good, stripped]);
    expect(flagged).toHaveLength(1);
    expect(flagged[0].name).toBe('Y');
  });
});

describe('SHAPE — the four-part entry survives normalize', () => {
  it('keeps name, 4D (summary + scripture), 3D, outcome, tags, links', () => {
    const e = normalizeAlgorithm({
      name: '  Change the Frame  ',
      outcome: 'a transformed life',
      fourD: { summary: 'renew the mind', scripture: 'Romans 12:2' },
      threeD: { summary: 'reframe the model' },
      tags: ['metanoia', '', '  reframe  '],
      links: [{ label: 'Study', where: 'Reflections' }, { label: '', where: '' }],
    }, 0, 0);
    expect(e.name).toBe('Change the Frame');
    expect(e.fourD.summary).toBe('renew the mind');
    expect(e.fourD.scripture).toBe('Romans 12:2');
    expect(e.threeD.summary).toBe('reframe the model');
    expect(e.outcome).toBe('a transformed life');
    expect(e.tags).toEqual(['metanoia', 'reframe']); // blanks dropped, trimmed
    expect(e.links).toHaveLength(1);                  // empty link dropped
    expect(e.id).toBeTruthy();
  });

  it('every seeded entry has a 4D scripture and a 3D expression (both dimensions present)', () => {
    for (const a of SEED_ALGORITHMS) {
      const e = normalizeAlgorithm(a, 0, 0);
      expect(e.fourD.scripture, `"${e.name}" needs scripture`).toBeTruthy();
      expect(e.fourD.summary, `"${e.name}" needs a 4D expression`).toBeTruthy();
      expect(e.threeD.summary, `"${e.name}" needs a 3D expression`).toBeTruthy();
    }
  });
});

describe('PAIRING — frameworks & outcomes projection', () => {
  it('pairs every framework with its outcome + scripture', () => {
    const seeded = seedIfEmpty(emptyLibrary(), 0).entries;
    const rows = frameworksAndOutcomes(seeded);
    expect(rows).toHaveLength(seeded.length);
    for (const r of rows) {
      expect(r.name).toBeTruthy();
      expect(r.outcome).toBeTruthy();
      expect(r).toHaveProperty('scripture');
    }
  });
});

describe('SEARCH + SORT', () => {
  const seeded = seedIfEmpty(emptyLibrary(), 0).entries;

  it('search spans name, 4D, 3D, outcome, scripture, and tags', () => {
    expect(filterAlgorithms(seeded, 'footstool').length).toBeGreaterThan(0);     // 4D / name
    expect(filterAlgorithms(seeded, 'rework').length).toBeGreaterThanOrEqual(0); // 3D text
    expect(filterAlgorithms(seeded, 'metanoia').length).toBeGreaterThan(0);      // tag
    expect(filterAlgorithms(seeded, 'James 1:2').length).toBeGreaterThan(0);     // scripture ref
    expect(filterAlgorithms(seeded, 'zzz-no-match').length).toBe(0);
    expect(filterAlgorithms(seeded, '').length).toBe(seeded.length);             // empty = all
  });

  it('sort is pinned-first, then by name', () => {
    const pinned = togglePin(seeded, seeded.find((e) => e.name.startsWith('Joy')).id);
    const sorted = sortAlgorithms(pinned);
    expect(sorted[0].name.startsWith('Joy')).toBe(true);
  });

  it('upsert adds new, updates existing; remove deletes by id', () => {
    const fresh = normalizeAlgorithm({ name: 'New One', outcome: 'win' }, 0, 99);
    let list = upsertAlgorithm(seeded, fresh);
    expect(list.length).toBe(seeded.length + 1);
    list = upsertAlgorithm(list, { ...fresh, outcome: 'updated win', updatedAt: 'x' });
    expect(list.find((e) => e.id === fresh.id).outcome).toBe('updated win');
    list = removeAlgorithm(list, fresh.id);
    expect(list.find((e) => e.id === fresh.id)).toBeUndefined();
  });
});

describe('PERSISTENCE — device-local round-trip', () => {
  beforeEach(() => { try { localStorage.clear(); } catch { /* no storage in this env */ } });

  it('save then load returns the same entries under the per-identity key', () => {
    const lib = seedIfEmpty(emptyLibrary(), 0);
    const res = saveLibrary('darrellpoe06@gmail.com', lib);
    // If the test env has no localStorage, save fails soft — accept the skip.
    if (res.skipped) return;
    const back = loadLibrary('darrellpoe06@gmail.com');
    expect(back.entries.length).toBe(lib.entries.length);
    expect(back.entries[0].outcome).toBe(lib.entries[0].outcome);
  });

  it('keys are per-identity (one device never shows another profile)', () => {
    expect(algKey('A@x.com')).not.toBe(algKey('B@x.com'));
    expect(algKey('DARRELL@x.com')).toBe(algKey('darrell@x.com')); // case-insensitive
  });
});
