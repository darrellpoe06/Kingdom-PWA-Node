// @vitest-environment jsdom
// =============================================================================
// Every registered surface LOADS to a component — the chunk boundary is proven,
// not assumed
// =============================================================================
// MEASURED 2026-09-23 on Darrell's Fold (screenshot 18:05): Books → Owed showed
// the section boundary, "OWED HIT AN ERROR". Reproduced on the local preview:
// React error #306 — the lazy element resolved to undefined. surfaces.js had
// registered Obligations with pick(..., 'Obligations'), a NAMED export the
// module never had (it exports default). The surface had been broken since it
// shipped on 2026-09-11 (#1526): twelve days, every reader, and no test opened
// it through the registry — the component's own tests mounted it directly
// (LESSONS P16, the surface the user meets was never the surface under test).
//
// The rule this pins: every entry's `load()` resolves to a module whose
// `default` is a function. It walks the registry itself, so the next
// mis-named pick fails here before it reaches a phone.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { surfaceById } from '../surfaces.js';

const entries = Object.values(surfaceById);

describe('every registered surface loads to a component', () => {
  it('the registry is not empty', () => {
    expect(entries.length).toBeGreaterThan(40);
  });

  for (const s of entries) {
    it(`${s.id} → ${s.label}: load() resolves to a component`, async () => {
      const m = await s.load();
      expect(m, `${s.id}: load() resolved to nothing`).toBeTruthy();
      expect(typeof m.default, `${s.id}: the picked export is ${typeof m.default} — a mis-named pick(loader, name) or a module without that export (React #306 on the phone)`).toBe('function');
    }, 60000); // the largest modules (Rentals) take longer than the 5 s default to transform on a cold worker
  }

  it('PROVEN-TO-CATCH: a pick by a name the module lacks is exactly what this walk refuses', async () => {
    // The shape that shipped: pick(() => import(Obligations.jsx), 'Obligations') on a default-only module.
    const pick = (loader, name) => () => loader().then((mod) => ({ default: mod[name] }));
    const m = await pick(() => import('../components/Obligations.jsx'), 'Obligations')();
    expect(typeof m.default).toBe('undefined');
    const fixed = await surfaceById.owed.load();
    expect(typeof fixed.default).toBe('function');
  });
});
