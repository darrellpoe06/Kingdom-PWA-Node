// =============================================================================
// The lease is a contract, not a cover sheet
// =============================================================================
// Darrell, 2026-08-28: "I need usable documents... obviously... not just fake
// data... preloaded with the default contract we will use unless we update it."
// What the Documents tab produced was ten lines. Nobody can sign ten lines.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_LEASE, MERGE_FIELDS, TEMPLATE_VERSION, TEMPLATE_STATUS,
  fillClause, leaseInForce,
} from '../modules/properties/lease-template.js';
import { buildDocument, LEASE_TERMS } from '../modules/properties/documents.js';

const DOOR = { property_label: '1003 Koehn Dr', state: 'IL', city: 'Danville' };
const TENANCY = {
  tenant_name: 'A. Tenant', lease_start: '2026-01-01', lease_end: '2026-12-31',
  monthly_rent: 680, deposit: 680,
};

describe('the default lease covers what a lease has to cover', () => {
  const headings = DEFAULT_LEASE.map((s) => s.heading.toLowerCase()).join(' ');
  for (const subject of [
    'parties', 'term', 'rent', 'security deposit', 'utilities', 'repairs',
    'entry', 'safety', 'pets', 'insurance', 'subletting', 'signatures',
  ]) {
    it(`has a section on ${subject}`, () => {
      expect(headings).toContain(subject);
    });
  }

  it('is long enough to be a document, not a summary', () => {
    const clauses = DEFAULT_LEASE.reduce((n, s) => n + s.clauses.length, 0);
    expect(clauses).toBeGreaterThan(40);
  });

  it('says on its face that it is a draft for counsel', () => {
    expect(TEMPLATE_STATUS.reviewed).toBe(false);
    expect(TEMPLATE_STATUS.note).toMatch(/not legal advice/i);
    expect(TEMPLATE_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });
});

describe('no statutory number is written into the template', () => {
  // The discipline that keeps this honest: deadlines and interest are lookups,
  // never prose. A recalled number in a lease is a liability.
  const body = JSON.stringify(DEFAULT_LEASE);

  it('uses legal lookups for every period the law sets', () => {
    for (const id of ['deposit-return-days', 'deposit-itemization-days', 'deposit-interest',
      'entry-notice-hours', 'late-rent-cure-days', 'lease-disclosures']) {
      expect(body, `${id} must be a lookup, not prose`).toContain(`{{legal:${id}}}`);
    }
  });

  it('never states a day-count for a deposit in its own words', () => {
    expect(body).not.toMatch(/within \d+ days/i);
    expect(body).not.toMatch(/\b(30|45|21|14) days\b/);
  });

  it('prints the citation to confirm when a value is unverified', () => {
    const r = buildDocument('lease-whole-unit', { door: DOOR, tenancy: TENANCY });
    expect(r.ok).toBe(true);
    expect(r.blanks.join(' ')).toMatch(/765 ILCS 710/);
    expect(r.lines.join('\n')).toMatch(/confirm against/i);
  });
});

describe('merge fields', () => {
  it('leaves a NAMED blank rather than an empty sentence', () => {
    const out = fillClause('Rent is {{rent}} due on the {{rentDueDay}}.', { value: () => null });
    expect(out.text).toBe('Rent is [rent] due on the [rentDueDay].');
    expect(out.blanks).toEqual(['rent', 'rentDueDay']);
  });

  it('fills what it is given and reports only what is missing', () => {
    const out = fillClause('{{tenant}} at {{property}}', {
      value: (n) => (n === 'tenant' ? 'A. Tenant' : null),
    });
    expect(out.text).toBe('A. Tenant at [property]');
    expect(out.blanks).toEqual(['property']);
  });

  it('treats whitespace as missing, not as a value', () => {
    expect(fillClause('{{x}}', { value: () => '   ' }).blanks).toEqual(['x']);
  });

  it('every merge field the body uses is declared', () => {
    const used = new Set();
    const re = /\{\{\s*([a-zA-Z][\w-]*)\s*\}\}/g;
    for (const s of DEFAULT_LEASE) for (const c of s.clauses) {
      let m; while ((m = re.exec(c))) if (!m[1].startsWith('legal:')) used.add(m[1]);
    }
    for (const f of used) expect(MERGE_FIELDS, `${f} is used but not declared`).toContain(f);
  });
});

describe('the house terms ask instead of assuming', () => {
  it('leaves every real decision blank', () => {
    // A lease that quietly invents a pet policy or a late fee is worse than one
    // with a blank in it.
    for (const decision of ['lateFee', 'pets', 'tenantUtilities', 'landlordUtilities', 'rentersInsurance']) {
      expect(LEASE_TERMS[decision], `${decision} must not be assumed`).toBe(null);
    }
  });

  it('fills only what is genuinely safe', () => {
    expect(LEASE_TERMS.landlord).toMatch(/Poe Properties/);
    expect(LEASE_TERMS.rentDueDay).toBeTruthy();
  });
});

describe('"unless we update it"', () => {
  it('uses the default when nothing is saved', () => {
    const f = leaseInForce(null);
    expect(f.source).toBe('default');
    expect(f.template).toBe(DEFAULT_LEASE);
    expect(f.version).toBe(TEMPLATE_VERSION);
  });

  it('a saved lease wins over the default, always', () => {
    const mine = [{ heading: 'Ours', clauses: ['We wrote this.'] }];
    expect(leaseInForce(mine).source).toBe('saved');
    expect(leaseInForce({ body: mine, version: 'v2' })).toMatchObject({ source: 'saved', version: 'v2' });
  });

  it('an empty save does not blank the lease', () => {
    // A stored override that is empty must fall back, not produce no contract.
    expect(leaseInForce([]).source).toBe('default');
    expect(leaseInForce({ body: [] }).source).toBe('default');
  });
});

describe('the built document', () => {
  it('carries the real terms from the tenancy', () => {
    const r = buildDocument('lease-whole-unit', { door: DOOR, tenancy: TENANCY });
    const text = r.lines.join('\n');
    expect(text).toContain('A. Tenant');
    expect(text).toContain('1003 Koehn Dr');
    expect(text).toContain('$680');
  });

  it('is a document, not a summary', () => {
    const r = buildDocument('lease-whole-unit', { door: DOOR, tenancy: TENANCY });
    expect(r.lines.length).toBeGreaterThan(80);
    expect(r.lines.join('\n')).toMatch(/Landlord does not lock Tenant out/);
  });

  it('names which template it came from', () => {
    const r = buildDocument('lease-whole-unit', { door: DOOR, tenancy: TENANCY });
    expect(r.lines.join('\n')).toMatch(/Template: PoeTech default/);
  });

  it('uses the instance\'s own lease when it has one', () => {
    const r = buildDocument('lease-whole-unit', {
      door: DOOR, tenancy: TENANCY,
      leaseTemplate: [{ heading: 'Our own terms', clauses: ['Rent is {{rent}}.'] }],
    });
    const text = r.lines.join('\n');
    expect(text).toContain('Our own terms');
    expect(text).toMatch(/this instance/i);
    expect(text).not.toMatch(/PoeTech default/);
  });

  it('still refuses to produce a lease with no tenancy', () => {
    expect(buildDocument('lease-whole-unit', { door: DOOR }).ok).toBe(false);
  });
});
