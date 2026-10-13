// @vitest-environment node
// =============================================================================
// Staging tenancies from the family's own records — PROPOSE, never ASSERT
// =============================================================================
// This file exists because a boundary was faked: "the landlord types all twelve
// doors" was carried as a human step without running the DR-0108 challenge. The
// challenge found real records (a lease in Drive, Gmail connected), so reading
// and proposing is buildable work. These assertions pin the one thing that makes
// it safe: the extractor may only say what a record actually says.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  fromFilename, fromLeaseText, stageFromRecord, stageFromRecords,
  tenancyRowFromDraft, confirmDraft, TENANCY_FIELDS,
} from '../modules/properties/staging.js';

// The REAL record, measured 2026-08-26: 9 pages, an image scan, zero text.
const REAL_SCAN = { id: '1l30J7y-VH7tIGUfvq3w8ccqS4QQSd0QX', title: 'Leonard Morris Lease 2022-23.pdf', text: '', kind: 'drive-file' };

describe('the real Drive record', () => {
  it('reads the tenant and term the FILENAME actually carries', () => {
    const s = stageFromRecord(REAL_SCAN);
    expect(s.draft.tenantName).toBe('Leonard Morris');
    expect(s.draft.leaseStart).toBe('2022-01-01');
    expect(s.draft.leaseEnd).toBe('2023-12-31');
  });

  it('invents NOTHING the scan cannot say — rent, deposit and contact stay null', () => {
    const s = stageFromRecord(REAL_SCAN);
    expect(s.draft.monthlyRent).toBeNull();
    expect(s.draft.deposit).toBeNull();
    expect(s.draft.tenantEmail).toBeNull();
    expect(s.draft.tenantPhone).toBeNull();
    expect(s.missing).toEqual(['tenantEmail', 'tenantPhone', 'monthlyRent', 'deposit']);
  });

  it('says out loud that the pages are unreadable and the dates are year-only', () => {
    const s = stageFromRecord(REAL_SCAN);
    expect(s.notes.join(' ')).toMatch(/image scan with no readable text/i);
    expect(s.notes.join(' ')).toMatch(/year and not a day/i);
  });

  it('every value it DOES emit names the record and the words it came from', () => {
    const s = stageFromRecord(REAL_SCAN);
    expect(s.provenance.tenantName.source).toBe(REAL_SCAN.id);
    expect(s.provenance.tenantName.quote).toContain('Leonard Morris');
    for (const k of TENANCY_FIELDS) {
      if (s.draft[k] !== null) expect(s.provenance[k], `${k} has a value with no provenance`).toBeTruthy();
    }
  });
});

describe('a lease with real text', () => {
  const text = `RESIDENTIAL LEASE. Term beginning June 1, 2025. Monthly rent $1,250.00 due on the first.
    Security deposit $1,250.00. Tenant email: leonard.morris@example.com. Tenant phone (563) 555-0142.`;

  it('takes what the text STATES, over what the filename guessed', () => {
    const s = stageFromRecord({ id: 'x', title: 'Leonard Morris Lease 2022-23.pdf', text });
    expect(s.draft.monthlyRent).toBe(1250);
    expect(s.draft.deposit).toBe(1250);
    expect(s.draft.tenantEmail).toBe('leonard.morris@example.com');
    expect(s.draft.leaseStart).toBe('June 1, 2025');   // the text's date beats the filename year
    expect(s.missing).toEqual([]);
  });

  it('a document that states nothing yields nothing', () => {
    expect(fromLeaseText('')).toEqual({});
    expect(fromLeaseText('This page intentionally left blank.')).toEqual({});
  });

  it('a record with no tenant name is DROPPED, not padded into a draft', () => {
    expect(stageFromRecord({ id: 'y', title: 'Some Notes.pdf', text: 'rent $900' })).toBeNull();
    expect(stageFromRecords([REAL_SCAN, { id: 'y', title: 'Some Notes.pdf' }])).toHaveLength(1);
  });

  it('a filename that is not a lease is not forced into one', () => {
    expect(fromFilename('Loan Application.pdf')).toBeNull();
    expect(fromFilename('application.pdf')).toBeNull();
  });
});

describe('nothing becomes a tenancy without a human saying so', () => {
  it('an unconfirmed draft is refused even with a door chosen', () => {
    const s = stageFromRecord(REAL_SCAN);
    expect(s.needsConfirmation).toBe(true);
    expect(tenancyRowFromDraft(s, { instanceId: 'i', rentalRef: 'PROP-A', confirmed: true }))
      .toEqual({ ok: false, reason: 'not-confirmed' });
  });

  it('a confirmed draft still needs the landlord to say WHICH door', () => {
    const s = confirmDraft(stageFromRecord(REAL_SCAN));
    expect(tenancyRowFromDraft(s, { instanceId: 'i', confirmed: true })).toEqual({ ok: false, reason: 'no-door' });
  });

  it('confirmed + a door builds the real row, carrying only what was found', () => {
    const s = confirmDraft(stageFromRecord(REAL_SCAN));
    const r = tenancyRowFromDraft(s, { instanceId: 'inst-1', rentalRef: 'PROP-A', propertyLabel: '1003 Koehn', unitLabel: 'Unit 1', confirmed: true });
    expect(r.ok).toBe(true);
    expect(r.row.tenant_name).toBe('Leonard Morris');
    expect(r.row.rental_ref).toBe('PROP-A');
    expect(r.row.tenant_email).toBeNull();     // still not invented at write time
    expect(r.row.monthly_rent).toBe(0);        // 0 = "not stated", the landlord fills it
    expect(r.row.status).toBe('active');
  });
});
