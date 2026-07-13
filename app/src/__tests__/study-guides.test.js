// study-guides — proven-to-catch tests. Guards the HONEST design: we guide to
// the test, we never claim to issue an accredited diploma; the credential paths
// are the verified universal core; every state carries a verify-source link; the
// Ari-guided subject pool is real and derived, not painted.
import { describe, it, expect } from 'vitest';
import {
  CREDENTIAL_PATHS, credentialPath, US_JURISDICTIONS, stateGuide,
  REGULATION_TIERS, SUBJECT_GUIDES, GUIDE_AREAS, guidesByArea, guidePoolSummary,
  STUDY_GUIDES_DISCLAIMER,
} from '../lib/study-guides.js';

describe('study-guides — honest credential model (we guide; we do not issue a diploma)', () => {
  it('never claims accreditation, and the disclaimer says so plainly', () => {
    expect(STUDY_GUIDES_DISCLAIMER).toMatch(/not an accredited school/i);
    expect(STUDY_GUIDES_DISCLAIMER).toMatch(/does not issue a diploma/i);
    // no path anywhere asserts PoeTech grants an accredited diploma
    const blob = JSON.stringify(CREDENTIAL_PATHS).toLowerCase();
    expect(blob).not.toMatch(/poetech.*accredited|accredited.*poetech/);
  });
  it('the parent-issued diploma path is the all-50-states route; GED/HiSET are the equivalency tests', () => {
    expect(credentialPath('parent-diploma').legalWhere).toMatch(/all 50/i);
    expect(credentialPath('ged')).toBeTruthy();
    expect(credentialPath('hiset')).toBeTruthy();
    expect(CREDENTIAL_PATHS).toHaveLength(3);
  });
});

describe('study-guides — the state dropdown (50 states + DC, each verifiable)', () => {
  it('covers all 50 states plus DC and nothing is duplicated', () => {
    expect(US_JURISDICTIONS).toHaveLength(51);
    const ids = new Set(US_JURISDICTIONS.map((s) => s.id));
    expect(ids.size).toBe(51);
    expect(ids.has('DC')).toBe(true);
    expect(ids.has('TX')).toBe(true);
  });
  it('every state carries a valid regulation tier and an authoritative source link', () => {
    for (const s of US_JURISDICTIONS) {
      expect(REGULATION_TIERS[s.tier], `${s.id} tier`).toBeTruthy();
      expect(s.source, `${s.id} source`).toMatch(/^https:\/\/hslda\.org\/legal\//);
    }
  });
  it('stateGuide returns the tier PLUS the universal credential paths + a verify note', () => {
    const g = stateGuide('ny');
    expect(g.name).toBe('New York');
    expect(g.tierLabel).toBe('High');           // NY is a high-regulation state
    expect(g.credentialPaths).toHaveLength(3);   // same three routes, everywhere
    expect(g.verifyNote).toMatch(/confirm current requirements/i);
    expect(stateGuide('ZZ')).toBe(null);
  });
});

describe('study-guides — the Ari-guided subject pool (real, derived, any age)', () => {
  it('pools core academics, Spanish, A.I./tech, and test prep', () => {
    const subjects = SUBJECT_GUIDES.map((g) => g.subject.toLowerCase());
    expect(subjects).toContain('spanish');
    expect(subjects.some((s) => s.includes('a.i'))).toBe(true);
    expect(subjects.some((s) => s.includes('ged'))).toBe(true);
    for (const area of GUIDE_AREAS) expect(guidesByArea(area.id).length).toBeGreaterThan(0);
  });
  it('every guide has objectives, an Ari grounding, and a credential it serves', () => {
    for (const g of SUBJECT_GUIDES) {
      expect(g.objectives.length, `${g.id} objectives`).toBeGreaterThan(0);
      expect(g.ariGrounding, `${g.id} grounding`).toBeTruthy();
      expect(['parent-diploma', 'ged', 'hiset']).toContain(g.credential);
    }
  });
  it('the pool summary counts are DERIVED from the real guides (nothing painted)', () => {
    const sum = guidePoolSummary();
    expect(sum.total).toBe(SUBJECT_GUIDES.length);
    const recount = Object.values(sum.byArea).reduce((a, b) => a + b, 0);
    expect(recount).toBe(SUBJECT_GUIDES.length);
  });
});
