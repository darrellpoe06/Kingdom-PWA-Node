// @vitest-environment node
// =============================================================================
// THE LEGIBILITY GUARD CAN SEE EVERY DOOR
// =============================================================================
// Darrell, 2026-10-10, on the Poe Properties Guest Ready panel at night:
// "Can't see in dark mode..."
//
// THE GUARD SAID PASS WHILE HE COULD NOT READ THE SCREEN, and the reason was
// not a threshold or a palette. listPages() walked app/src/components and the
// monolith and NOTHING ELSE: app/src/modules was never scanned, so the whole
// Properties module — the app he was standing in — had never been measured on
// a dark surface in its life. Its own header already records the sibling miss
// ("it scanned components/*.jsx NON-RECURSIVELY"); recursion was fixed and
// this root was never added.
//
// MEASURED the moment the scan was widened: 315 pages -> 322, and SIXTY
// regressions appeared, 34 of them in ReadinessTab alone — the Guest Ready
// panel in his screenshot — including #1A1815 on the midnight card at
// 1.04:1, which is black text on a black surface.
//
// A gate that cannot see a surface is not protecting it (DR-0076 §3). This
// pins the roots, so the next module directory cannot be born invisible.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { listPages } from '../../../scripts/legibility-guard.mjs';

const ids = listPages().map((p) => p.split('/app/src/')[1] || p);

describe('every root the app renders from is scanned', () => {
  it('PROVEN-TO-CATCH: the modules tree is in the scan at all', () => {
    const mods = ids.filter((p) => p.startsWith('modules/'));
    expect(mods.length, 'app/src/modules is invisible to the legibility guard').toBeGreaterThan(0);
  });

  it('the Properties module Darrell uses is covered, by name', () => {
    for (const f of [
      'modules/properties/ReadinessTab.jsx',
      'modules/properties/PropertiesApp.jsx',
      'modules/properties/Storefront.jsx',
      'modules/properties/DoorTabs.jsx',
    ]) {
      expect(ids, `${f} is not scanned`).toContain(f);
    }
  });

  it('components are still covered — widening added a root, it did not swap one', () => {
    expect(ids.some((p) => p.startsWith('components/'))).toBe(true);
    expect(ids.some((p) => p.endsWith('poe-financial-mvp-v28.jsx'))).toBe(true);
  });

  it('discovery is filesystem-independent, so CI and a laptop agree', () => {
    const sorted = [...ids].sort((a, b) => a.localeCompare(b));
    expect(ids).toEqual(sorted);
  });
});
