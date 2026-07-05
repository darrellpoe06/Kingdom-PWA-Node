// =============================================================================
// snapshot-hydration — proven-to-catch (DR-0076) for the 2026-07-05 Money-tab
// reconciliation incident: on poetech.us the signed-in hydration merged the
// owner's saved snapshot over the MOUNTED REEVES DEMO, so every key the
// snapshot lacked silently kept demo values. Big Picture → Money then showed
// the demo's "+$1k" net cash flow (demo inflows/outflows tagged to the
// demo-only 'e-family') above the owner's own entities — all reading $0 —
// and the merged residue was persisted back as "owner data". Each test here
// reproduces a leg of that failure against the OLD behavior and asserts the
// fix: merge over the owner's baseline; scrub demo rows from a real world.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { mergeSnapshotData, scrubDemoResidue } from '../lib/snapshot-hydration.js';
import {
  SEED_DATA, EMPTY_WORLD, DEMO_RELEASE_LABELS, notDemoEntityRow, stripSeedScaffolding, SEED_IDS,
} from '../poe-financial-mvp-v28.jsx';

// The Reeves family demo's money spine, as a polluted world would carry it
// (ids are the demo's own — stable provenance the scrub keys on).
const demoInflows = {
  salaries: [
    { id: 'sal-1', who: 'You', source: 'Primary salary', expected: 3200, actual: 3200, entityId: 'e-family' },
    { id: 'sal-2', who: 'Spouse', source: 'Part-time income', expected: 1400, actual: 1400, entityId: 'e-family' },
  ],
  rentals: [],
};
const demoOutflows = { rentalMortgages: 0, propertyUtilities: 0, household: 1800, debtService: 1500, charitableGiving: 200 };
const isDemoRow = (x) => !notDemoEntityRow(x);
const scrubOpts = (baseline) => ({ isDemoRow, demoReleaseLabels: DEMO_RELEASE_LABELS, baseline });

describe('mergeSnapshotData — the merge base decides what a sparse snapshot inherits', () => {
  // The owner's real snapshot from the incident: it HAS entities (their own
  // four) but LACKS the hand-kept money spine keys entirely.
  const sparseSnapshot = {
    entities: [
      { id: 'e-personal', name: 'Personal', type: 'personal' },
      { id: 'e-poeprops', name: 'Poe Properties', type: 'business' },
    ],
  };
  const demoWorld = { ...SEED_DATA, inflows: demoInflows, outflows: demoOutflows, meta: { ...SEED_DATA.meta, releaseLabel: 'Sample · Family of 4' } };

  it('reproduces the incident: merged over the mounted demo, demo money leaks in', () => {
    const merged = mergeSnapshotData(demoWorld, sparseSnapshot);
    // The owner's entities land…
    expect(merged.entities.map((e) => e.id)).toEqual(['e-personal', 'e-poeprops']);
    // …but the demo's money spine rides along: +$1,100/mo of Reeves income
    // tagged to an entity that no longer exists. This is the "+$1k over $0
    // entity cards" screen.
    expect(merged.inflows.salaries.map((s) => s.id)).toEqual(['sal-1', 'sal-2']);
    expect(merged.meta.releaseLabel).toBe('Sample · Family of 4');
  });

  it('the fix: merged over the OWNER baseline, the money spine is the baseline\'s', () => {
    const merged = mergeSnapshotData(SEED_DATA, sparseSnapshot);
    expect(merged.entities.map((e) => e.id)).toEqual(['e-personal', 'e-poeprops']);
    expect(merged.inflows).toBe(SEED_DATA.inflows);
    expect(merged.outflows).toBe(SEED_DATA.outflows);
    expect(merged.meta.releaseLabel).not.toBe('Sample · Family of 4');
  });

  it('a non-family owner merging over EMPTY_WORLD inherits empty books, never the demo', () => {
    const merged = mergeSnapshotData(EMPTY_WORLD, sparseSnapshot);
    expect(merged.inflows.salaries).toEqual([]);
    expect(Object.values(merged.outflows).every((v) => v === 0)).toBe(true);
  });

  it('keeps the defensive per-key backfills (legacy snapshot without collections)', () => {
    const merged = mergeSnapshotData(SEED_DATA, { welcomeDismissed: true });
    expect(Array.isArray(merged.events)).toBe(true);
    expect(Array.isArray(merged.projects)).toBe(true);
    expect(merged.welcomeDismissed).toBe(true);
    expect(merged.userTier).toBe(SEED_DATA.userTier || 'foundation');
    // visibleTo backfill still applies to saved entities missing it
    const withEntities = mergeSnapshotData(SEED_DATA, { entities: [{ id: 'e-tlc', name: 'TLC' }] });
    expect(withEntities.entities[0].visibleTo).toEqual(['darrell', 'christina']);
  });
});

describe('scrubDemoResidue — a real world never keeps demo rows', () => {
  it('drops leaked demo salary rows and resets the demo-labeled remainder to the baseline', () => {
    // The persisted-pollution leg of the incident: the snapshot itself carries
    // the demo money spine (it was saved from a merged-over-demo session).
    const polluted = {
      ...SEED_DATA,
      entities: [{ id: 'e-personal', name: 'Personal', type: 'personal' }],
      inflows: demoInflows,
      outflows: demoOutflows,
      meta: { ...SEED_DATA.meta, releaseLabel: 'Sample · Family of 4' },
    };
    const clean = scrubDemoResidue(polluted, scrubOpts(SEED_DATA));
    // No demo rows survive anywhere…
    expect(clean.inflows.salaries.some((s) => s.entityId === 'e-family')).toBe(false);
    // …and the emptied money spine falls back to the baseline's, so the world
    // stays internally consistent (inflows + outflows + meta from ONE world).
    expect(clean.inflows.salaries).toEqual(SEED_DATA.inflows.salaries);
    expect(clean.outflows).toEqual(SEED_DATA.outflows);
    expect(clean.meta.releaseLabel).toBe(SEED_DATA.meta.releaseLabel);
    // The owner's own rows are untouched.
    expect(clean.entities.map((e) => e.id)).toEqual(['e-personal']);
  });

  it('keeps rows the owner entered themselves alongside dropped demo rows', () => {
    const mixed = {
      ...SEED_DATA,
      inflows: {
        salaries: [
          ...demoInflows.salaries,
          { id: `sal-${Date.now()}`, who: 'Darrell', source: 'Real income', actual: 5000, entityId: 'e-personal' },
        ],
        rentals: [],
      },
    };
    const clean = scrubDemoResidue(mixed, scrubOpts(SEED_DATA));
    expect(clean.inflows.salaries.map((s) => s.source)).toEqual(['Real income']);
    // meta is NOT demo-labeled here → outflows/meta stay the world's own.
    expect(clean.outflows).toBe(mixed.outflows);
  });

  it('drops demo entities by name even under a foreign id (historical UUID pollution)', () => {
    const world = { ...SEED_DATA, entities: [...SEED_DATA.entities, { id: 'a1b2c3d4-0000-0000-0000-000000000000', name: 'The Reeves Family', type: 'personal' }] };
    const clean = scrubDemoResidue(world, scrubOpts(SEED_DATA));
    expect(clean.entities.some((e) => e.name === 'The Reeves Family')).toBe(false);
    expect(clean.entities.length).toBe(SEED_DATA.entities.length);
  });

  it('leaves string collections (watchlist) and non-demo worlds untouched', () => {
    const world = { ...SEED_DATA, watchlist: ['spy.us', 'qqq.us'] };
    const clean = scrubDemoResidue(world, scrubOpts(SEED_DATA));
    expect(clean.watchlist).toEqual(['spy.us', 'qqq.us']);
    expect(clean.inflows.salaries).toEqual(SEED_DATA.inflows.salaries);
  });
});

describe('stripSeedScaffolding — salaries now filtered like rentals (2026-07-05 fix)', () => {
  it('drops pure seed salary rows on the signed-in clean start; keeps synced + user rows', () => {
    const seedSalaryId = SEED_DATA.inflows.salaries[0].id;
    expect(SEED_IDS.has(seedSalaryId)).toBe(true);
    const out = stripSeedScaffolding({
      inflows: {
        salaries: [
          { id: seedSalaryId },
          { id: seedSalaryId, remoteUuid: 'uuid-1' },
          { id: `sal-${Date.now()}` },
        ],
        rentals: [{ id: SEED_DATA.inflows.rentals[0].id }],
      },
    });
    expect(out.inflows.salaries.length).toBe(2); // synced + user-entered survive
    expect(out.inflows.salaries.some((s) => s.id === seedSalaryId && !s.remoteUuid)).toBe(false);
    expect(out.inflows.rentals.length).toBe(0);
  });
});
