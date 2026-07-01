// adopter-templates — the aspirational starter a new adopter opens on must be
// real, complete, and (the bright line) free of any Poe-family identifier.
import { describe, it, expect } from 'vitest';
import {
  ADOPTER_TEMPLATES, templateTypes, templateFor, templateSummary,
} from '../lib/adopter-templates.js';
import { scanTemplates, POE_IDENTIFIERS } from '../../../scripts/adopter-template-guard.mjs';

describe('adopter templates — shape and aspiration', () => {
  it('provides family, church, and business starters', () => {
    expect(templateTypes()).toEqual(['family', 'church', 'business']);
  });

  it('every template answers the four-point SEED-DATA-AS-ASPIRATION contract', () => {
    for (const t of ADOPTER_TEMPLATES) {
      expect(t.contract).toBeTruthy();
      for (const key of ['privacy', 'aspiration', 'relatability', 'activeGuidance']) {
        expect(typeof t.contract[key], `${t.type}.contract.${key}`).toBe('string');
        expect(t.contract[key].length).toBeGreaterThan(8);
      }
    }
  });

  it('every template carries members with real roles and one active-guidance moment', () => {
    for (const t of ADOPTER_TEMPLATES) {
      expect(t.members.length).toBeGreaterThan(0);
      expect(t.members.some((m) => m.role === 'owner')).toBe(true);
      expect(t.starter.activeGuidance?.message?.length).toBeGreaterThan(8);
    }
  });

  it('templateFor returns null for an unknown type (never guesses)', () => {
    expect(templateFor('spaceship')).toBeNull();
    expect(templateFor('family')?.type).toBe('family');
  });

  it('templateSummary is display-safe and complete', () => {
    const s = templateSummary(templateFor('church'));
    expect(s.type).toBe('church');
    expect(s.roles).toContain('owner');
    expect(s.activeGuidance).toBeTruthy();
    expect(templateSummary(null)).toBeNull();
  });
});

describe('adopter templates — NO Poe-family data (the bright line)', () => {
  it('the live templates contain zero Poe identifiers', () => {
    const { ok, violations } = scanTemplates();
    expect(ok, `leaked: ${JSON.stringify(violations)}`).toBe(true);
  });

  // Anti-theater (DR-0076): prove the guard actually CATCHES a leak, so a green
  // result means something. A guard that always passes is itself a lie.
  it('the guard CATCHES a planted Poe identifier (proven-to-catch)', () => {
    const poisoned = `
      export const ADOPTER_TEMPLATES = [
        { type: 'family', members: [{ displayName: 'Darrell', role: 'owner' }],
          starter: { entities: [{ name: 'Poe Properties LLC' }] } },
      ];
    `;
    const { ok, violations } = scanTemplates(poisoned);
    expect(ok).toBe(false);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations.some((v) => /darrell|poe/i.test(v.identifier))).toBe(true);
  });

  it('the guard CATCHES the church identifier too', () => {
    const poisoned = `const x = { name: 'Church of the Living God' };`;
    expect(scanTemplates(poisoned).ok).toBe(false);
  });

  it('the identifier list covers people, brands, church, and places', () => {
    for (const needle of ['darrell', 'poetech', 'church of the living god', 'champaign']) {
      expect(POE_IDENTIFIERS).toContain(needle);
    }
  });
});
