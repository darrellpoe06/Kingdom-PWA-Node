// The persona picker's tiles must each boot THEIR OWN sample — on the public
// host too — and the public/reviewer boot must never be SEED_DATA.
// Regression: until 2026-11-18 the public-host guard ran first, so on
// poetech.us every ?demo=<persona> showed the family-of-4 household.
import { describe, it, expect } from 'vitest';
import { pickInitialSeed } from '../lib/demo-seed-choice.js';
import { buildDemoPersonas, DEMO_PERSONA_META } from '../lib/demo-data.js';

const SEED = { __seed: true, meta: {}, pressureMappings: {} };
const personas = buildDemoPersonas(SEED);
const base = { personas, seed: SEED, isDemoMode: false, demoPersona: null, isPublic: false, reviewerMode: false, isPickerMode: false, isFirstTimeLanding: false };

describe('pickInitialSeed', () => {
  it.each(Object.keys(DEMO_PERSONA_META))('public host + ?demo=%s boots that persona, not family-of-4', (key) => {
    const got = pickInitialSeed({ ...base, isPublic: true, isDemoMode: true, demoPersona: key });
    expect(got).toBe(personas[key]);
    if (key !== 'family-of-4') expect(got).not.toBe(personas['family-of-4']);
  });

  it('public host with no demo param boots the family-of-4 sample, never SEED', () => {
    expect(pickInitialSeed({ ...base, isPublic: true })).toBe(personas['family-of-4']);
  });

  it('reviewer mode never boots SEED (the steward\'s own world)', () => {
    expect(pickInitialSeed({ ...base, reviewerMode: true })).toBe(personas['family-of-4']);
    expect(pickInitialSeed({ ...base, reviewerMode: true, isDemoMode: true, demoPersona: 'landlord' })).toBe(personas.landlord);
  });

  it('an unknown persona key on a public host falls back to the sample, never SEED or undefined', () => {
    expect(pickInitialSeed({ ...base, isPublic: true, isDemoMode: true, demoPersona: 'nope' })).toBe(personas['family-of-4']);
  });

  it('picker / first-time landing on a private host boot the sample; plain private host boots SEED', () => {
    expect(pickInitialSeed({ ...base, isPickerMode: true })).toBe(personas['family-of-4']);
    expect(pickInitialSeed({ ...base, isFirstTimeLanding: true })).toBe(personas['family-of-4']);
    expect(pickInitialSeed(base)).toBe(SEED);
  });
});

describe('every persona is the same anonymized sample class as family-of-4', () => {
  // The public-host guard exists so SEED_DATA's real ops shape never reaches
  // poetech.us. Honoring the chosen persona is only safe if no persona passes
  // MORE of SEED_DATA through than family-of-4 already does.
  it('no persona inherits a SEED_DATA field that family-of-4 overrides', () => {
    const marker = '__REAL_SEED__';
    const keys = new Set();
    Object.values(personas).forEach((d) => Object.keys(d).forEach((k) => keys.add(k)));
    const markedSeed = { meta: {}, pressureMappings: {} };
    keys.forEach((k) => { if (!(k in markedSeed)) markedSeed[k] = marker; });
    const marked = buildDemoPersonas(markedSeed);
    const passthrough = (d) => Object.keys(d).filter((k) => d[k] === marker).sort();
    const f4 = passthrough(marked['family-of-4']);
    for (const [key, d] of Object.entries(marked)) {
      expect({ key, leaked: passthrough(d).filter((k) => !f4.includes(k)) }).toEqual({ key, leaked: [] });
    }
  });

  it('every picker tile has a dataset behind it', () => {
    for (const key of Object.keys(DEMO_PERSONA_META)) expect(personas[key], key).toBeTruthy();
  });
});
