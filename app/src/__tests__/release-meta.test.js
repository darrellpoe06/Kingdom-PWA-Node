// release-meta — the footer names the app's release, never the demo persona
// (2026-09-24, the Books → Plan end-to-end review: a real plan under
// "SAMPLE · FAMILY OF 4").
import { describe, it, expect } from 'vitest';
import { withReleaseMeta, RELEASE_FIELDS } from '../lib/release-meta.js';
import { SEED_DATA } from '../poe-financial-mvp-v28.jsx';
import { buildDemoPersonas } from '../lib/demo-data.js';

describe('withReleaseMeta', () => {
  const seed = { releaseLabel: 'MVP v1.5', releaseNote: 'the real note', appVersion: '28.1' };

  it('replaces the three release fields and keeps everything else the family saved', () => {
    const saved = { releaseLabel: 'Sample · Family of 4', releaseNote: 'demo note', appVersion: '28.0', lastUpdated: '2026-09-01', bufferTarget: 7000 };
    expect(withReleaseMeta(saved, seed)).toEqual({ releaseLabel: 'MVP v1.5', releaseNote: 'the real note', appVersion: '28.1', lastUpdated: '2026-09-01', bufferTarget: 7000 });
  });

  it('tolerates a snapshot with no meta at all', () => {
    expect(withReleaseMeta(undefined, seed)).toEqual(seed);
    expect(withReleaseMeta(null, {})).toEqual({});
  });

  it('never leaves the demo persona’s label on a signed-in member’s data (the screenshot)', () => {
    const demo = Object.values(buildDemoPersonas(SEED_DATA))[0];
    expect(demo.meta.releaseLabel).toMatch(/Sample/);
    const fixed = withReleaseMeta(demo.meta, SEED_DATA.meta);
    expect(fixed.releaseLabel).toBe(SEED_DATA.meta.releaseLabel);
    expect(fixed.releaseLabel).not.toMatch(/Sample/);
    for (const k of RELEASE_FIELDS) expect(fixed[k]).toBe(SEED_DATA.meta[k]);
  });
});
