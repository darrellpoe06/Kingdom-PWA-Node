// @vitest-environment node
// =============================================================================
// Legal values come from a registry that REFUSES to guess
// =============================================================================
// Darrell, 2026-08-27: "derived from state requirements etc.... current code
// based on the information available... eventually for every state based on
// their codes."
//
// The danger in this feature is not a missing number — it is a CONFIDENT one. A
// deposit deadline or a notice period recalled from memory does not read as
// wrong; it reads as a finished legal document, and it is a statutory violation
// the day it is handed to someone. So these assertions are about refusal: no
// value exists until a named person verified it on a date, and until then the
// document prints the CITATION to check.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  normalizeState, REQUIREMENT_IDS, JURISDICTIONS, KNOWN_STATES,
  requirementsFor, legalValue, verify, outstandingRequirements,
} from '../modules/properties/jurisdictions.js';
import { buildDocument } from '../modules/properties/documents.js';

describe('the registry starts where the doors actually are', () => {
  it('Illinois is in it — measured: every Poe Properties door is IL', () => {
    expect(KNOWN_STATES).toContain('IL');
    expect(JURISDICTIONS.IL.name).toBe('Illinois');
  });

  it('"Illinois" and "IL" resolve to the same place — the live data holds both', () => {
    expect(normalizeState('Illinois')).toBe('IL');
    expect(normalizeState('IL')).toBe('IL');
    expect(normalizeState('il')).toBe('IL');
    expect(requirementsFor({ state: 'Illinois' }).state).toBe('IL');
  });

  it('a state not in the registry is SAID, never defaulted to Illinois', () => {
    const r = requirementsFor({ state: 'TX' });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('state-not-in-registry');
    expect(r.message).toMatch(/not in the registry yet/);
    expect(r.requirements).toEqual({});
  });

  it('a door with no state recorded says so — six doors are like that today', () => {
    const r = requirementsFor({});
    expect(r.reason).toBe('no-state-recorded');
    expect(r.message).toMatch(/no state recorded/);
  });
});

describe('nothing is asserted until a person verifies it', () => {
  it('every shipped requirement is unverified and carries NO value', () => {
    for (const [id, req] of Object.entries(JURISDICTIONS.IL.requirements)) {
      expect(req.status, `${id} ships as verified`).toBe('unverified');
      expect(req.value, `${id} ships with a value`).toBeNull();
    }
  });

  it('every requirement names the citation to check', () => {
    for (const [id, req] of Object.entries(JURISDICTIONS.IL.requirements)) {
      expect(req.citation, `${id} has no citation`).toBeTruthy();
      expect(req.citation.length).toBeGreaterThan(10);
    }
  });

  it('an unverified value comes back as a blank carrying its citation — not a number', () => {
    const v = legalValue('deposit-return-days', { state: 'IL' });
    expect(v.verified).toBe(false);
    expect(v.value).toBeNull();
    expect(v.blank).toMatch(/765 ILCS 710/);
    expect(v.blank).toMatch(/confirm against/);
  });

  it('verifying takes a value, a named person AND a date', () => {
    expect(verify({ state: 'IL', id: 'deposit-return-days', value: '45 days', verifiedAt: '2026-09-01' })).toEqual({ ok: false, reason: 'no-one-named' });
    expect(verify({ state: 'IL', id: 'deposit-return-days', value: '45 days', verifiedBy: 'Trevor' })).toEqual({ ok: false, reason: 'no-date' });
    expect(verify({ state: 'IL', id: 'deposit-return-days', verifiedBy: 'Trevor', verifiedAt: 'x' })).toEqual({ ok: false, reason: 'no-value' });
    expect(verify({ state: 'TX', id: 'deposit-return-days', value: 'x', verifiedBy: 'y', verifiedAt: 'z' })).toEqual({ ok: false, reason: 'state-not-in-registry' });
    const ok = verify({ state: 'Illinois', city: 'Champaign', id: 'deposit-return-days', value: '45 days', verifiedBy: 'Trevor (RE counsel)', verifiedAt: '2026-09-01' });
    expect(ok.entry).toMatchObject({ state: 'IL', city: 'champaign', status: 'verified', verified_by: 'Trevor (RE counsel)' });
  });

  it('everything is outstanding until then, and that is the honest count', () => {
    const o = outstandingRequirements({ state: 'IL', city: 'Champaign' });
    expect(o.outstanding).toHaveLength(REQUIREMENT_IDS.length);
  });
});

describe('city sits on top of state', () => {
  it('a Champaign door gets the CITY answer, and is told it is the city\'s', () => {
    const v = legalValue('entry-notice-hours', { state: 'IL', city: 'Champaign' });
    expect(v.level).toBe('city');
    expect(v.blank).toMatch(/City of Champaign/);
  });

  it('a door elsewhere in Illinois falls back to the state level, labelled', () => {
    const v = legalValue('entry-notice-hours', { state: 'IL', city: 'Urbana' });
    expect(v.level).toBe('state');
    expect(v.blank).toMatch(/no single statewide entry-notice statute/);
  });

  it('a door with no city says a municipal ordinance cannot be checked yet', () => {
    expect(requirementsFor({ state: 'IL' }).cityNote).toMatch(/cannot be checked until there is one/);
  });
});

describe('the documents carry the citation, not a guess', () => {
  const door = { property_label: '1003 Koehn', state: 'IL', city: 'Champaign' };
  const tenancy = { tenant_name: 'Leonard Morris', deposit: 950, monthly_rent: 950, lease_end: '2027-08-31' };

  it('the entry notice prints the rule to confirm, at the city level', () => {
    const d = buildDocument('notice-entry', { door, tenancy });
    expect(d.lines.join('\n')).toMatch(/Advance notice required here: \[.*City of Champaign/);
  });

  it('the deposit accounting prints all three deadlines as citations to confirm', () => {
    const d = buildDocument('move-out-deposit', { door, tenancy });
    const text = d.lines.join('\n');
    // Champaign OVERRIDES the return deadline, so this door cites the city —
    // which is the layering doing its job, not a missing state citation.
    expect(text).toMatch(/Deadline to return it: \[.*City of Champaign/);
    expect(text).toMatch(/Deadline for the itemized statement: \[.*765 ILCS 710/);
    expect(text).toMatch(/Interest owed: \[.*765 ILCS 715/);
    expect(d.blanks.some((b) => b.includes('ILCS'))).toBe(true);
  });

  it('the same document for a door with NO city override cites the state act', () => {
    const d = buildDocument('move-out-deposit', { door: { ...door, city: 'Urbana' }, tenancy });
    expect(d.lines.join('\n')).toMatch(/Deadline to return it: \[.*765 ILCS 710/);
  });

  it('the lease names the disclosures the jurisdiction requires', () => {
    const d = buildDocument('lease-whole-unit', { door, tenancy: { ...tenancy, lease_start: '2026-09-01' } });
    expect(d.lines.join('\n')).toMatch(/lead-based paint disclosure/i);
    expect(d.lines.join('\n')).toMatch(/Radon Awareness Act/i);
  });

  it('a document for an unregistered state says the state is unknown rather than borrowing Illinois', () => {
    const d = buildDocument('notice-entry', { door: { ...door, state: 'TX', city: 'Austin' }, tenancy });
    expect(d.lines.join('\n')).toMatch(/TX is not in the registry yet/);
    expect(d.lines.join('\n')).not.toMatch(/ILCS/);
  });
});
