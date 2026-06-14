// Family-email gating in the multi-point picker — 2026-06-14. The shared-device
// persona gate must apply the family-email guard: only a VERIFIED family member
// can have the real personas (Darrell/Christina) PIN-gated; an outside viewer
// never selects a real family persona, and the household roll-up is never gated.
// This composes isFamilyEmail (#131) with isPersonaGated (multi-point) — the
// exact predicate the picker uses — so a regression in either is caught.
import { describe, it, expect } from 'vitest';
import { isFamilyEmail } from '../poe-financial-mvp-v28.jsx';
import { isPersonaGated, GATEABLE_PERSONAS } from '../lib/multi-point-auth.js';

const isFamilyMember = (email) => isFamilyEmail(email);

describe('persona gating respects the family-email guard', () => {
  it('a verified family member: real personas are PIN-gateable', () => {
    const fam = isFamilyMember('darrellpoe06@gmail.com');
    expect(isPersonaGated('darrell', fam)).toBe(true);
    expect(isPersonaGated('christina', fam)).toBe(true);
  });

  it('the household roll-up persona is NEVER gated, even for family', () => {
    expect(isPersonaGated('family', isFamilyMember('darrellpoe06@gmail.com'))).toBe(false);
  });

  it('an outside (non-family) viewer never gets a gateable real persona', () => {
    const outside = isFamilyMember('parishioner@example.com');
    expect(outside).toBe(false);
    for (const persona of [...GATEABLE_PERSONAS, 'family']) {
      expect(isPersonaGated(persona, outside)).toBe(false);
    }
  });

  it('case-insensitive family recognition still gates', () => {
    expect(isPersonaGated('christina', isFamilyMember('MrsPoe06@gmail.com'))).toBe(true);
  });

  it('null / empty viewer email never gates anything', () => {
    expect(isPersonaGated('darrell', isFamilyMember(null))).toBe(false);
    expect(isPersonaGated('darrell', isFamilyMember(''))).toBe(false);
  });
});
