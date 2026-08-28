// @vitest-environment node
// =============================================================================
// The paperwork prepopulates itself — and refuses to invent what it doesn't know
// =============================================================================
// Darrell, 2026-08-27: "Did we create a prepopulated version of all documents we
// need so they can be the initial starting point... Built into the app..."
//
// The risk in a document generator is not that it fails — it is that it
// produces something that LOOKS finished. So the assertions here are mostly
// about refusal: an unfilled field stays a named blank, a regulated document
// says which law and why, and the room lease cannot be produced at all for a
// door whose legal regime has not been cleared.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  DOCUMENT_SET, DOCUMENT_IDS, COUNSEL_LINE,
  buildDocument, availableDocuments, acknowledge,
} from '../modules/properties/documents.js';
import { CHECKLIST_IDS, clearanceRecord } from '../modules/properties/coliving.js';

const door = { property_label: '1003 Koehn', unit_label: 'Unit 1' };
const tenancy = { tenant_name: 'Leonard Morris', lease_start: '2026-09-01', lease_end: '2027-08-31', monthly_rent: 950, deposit: 950 };
const room = { name: 'Front bedroom', monthly_rent: 1000, occupancy: 1 };
const clearAll = () => CHECKLIST_IDS.map((id) => clearanceRecord({ itemId: id, clearedBy: 'Trevor (RE counsel)', clearedAt: '2026-09-01' }).record);

describe('the set covers what a landlord actually hands people', () => {
  it('has the lease, the rules, the condition reports, the notices, the decisions and the contractor', () => {
    for (const id of ['lease-whole-unit', 'lease-by-room', 'house-rules', 'move-in-condition',
      'move-out-deposit', 'notice-entry', 'notice-late-rent', 'application-approved',
      'application-declined', 'contractor-1099', 'work-order']) {
      expect(DOCUMENT_IDS, `${id} is missing from the set`).toContain(id);
    }
  });

  it('every document says WHY it exists, in a sentence a person would use', () => {
    for (const d of DOCUMENT_SET) expect(d.why.length).toBeGreaterThan(20);
  });
});

describe('prepopulated from the real records', () => {
  it('the lease fills itself from the door and the tenancy', () => {
    const doc = buildDocument('lease-whole-unit', { door, tenancy });
    const text = doc.lines.join('\n');
    expect(doc.ok).toBe(true);
    expect(text).toContain('1003 Koehn · Unit 1');
    expect(text).toContain('Leonard Morris');
    expect(text).toContain('$950.00');
    // The lease became a real contract on 2026-08-28 (lease-template.js), so the
    // term reads as a sentence rather than a one-line summary: "begins on X and
    // ends on Y". Both dates still come from the tenancy and nowhere else.
    expect(text).toContain('2026-09-01');
    expect(text).toContain('2027-08-31');
    // Every remaining blank is either a statutory value to confirm against its
    // citation, or a house DECISION the records genuinely do not hold (the late
    // fee, pets, who pays which utility). None is a field the records could
    // have filled and did not.
    const decisions = /lateFee|pets|Utilities|rentersInsurance/;
    const statutory = /deposit-|entry-notice|late-rent-cure|lease-disclosures/;
    expect(doc.blanks.every((b) => statutory.test(b) || decisions.test(b)),
      `unexpected blank: ${doc.blanks.join(' | ')}`).toBe(true);
  });

  it('a number changed on the record changes the document — there is no second copy', () => {
    const doc = buildDocument('lease-whole-unit', { door, tenancy: { ...tenancy, monthly_rent: 1075 } });
    expect(doc.lines.join('\n')).toContain('$1075.00');
  });

  it('the work order and the contractor agreement fill from their own records', () => {
    const wo = buildDocument('work-order', { door, request: { title: 'Furnace out', priority: 'urgent', created_at: '2026-09-02T10:00:00Z', assigned_to_label: 'Handy Sam' } });
    expect(wo.lines.join('\n')).toMatch(/Furnace out[\s\S]*urgent[\s\S]*Handy Sam/);
    const k = buildDocument('contractor-1099', { worker: { name: 'Handy Sam', trade: 'HVAC' } });
    expect(k.lines.join('\n')).toMatch(/Handy Sam[\s\S]*HVAC/);
  });
});

describe('what it does not know, it does not invent', () => {
  it('an unfilled field is a NAMED blank and is reported', () => {
    const doc = buildDocument('lease-whole-unit', { door, tenancy: { ...tenancy, lease_end: null, deposit: 0 } });
    // The merge field is named as the template names it.
    expect(doc.lines.join('\n')).toContain('[leaseEnd]');
    expect(doc.blanks).toContain('leaseEnd');
    expect(doc.blanks).toContain('deposit');
  });

  it('refuses outright when a required record is absent', () => {
    expect(buildDocument('lease-whole-unit', { door })).toEqual({ ok: false, reason: 'missing-tenancy' });
    expect(buildDocument('work-order', { door })).toEqual({ ok: false, reason: 'missing-request' });
    expect(buildDocument('made-up-doc', {})).toEqual({ ok: false, reason: 'unknown-document' });
  });

  it('availableDocuments says which are ready and what each still needs', () => {
    const list = availableDocuments({ door, tenancy });
    expect(list.find((d) => d.id === 'lease-whole-unit').ready).toBe(true);
    expect(list.find((d) => d.id === 'contractor-1099')).toMatchObject({ ready: false, reason: 'missing-worker' });
  });
});

describe('nothing here poses as finished or as legal advice', () => {
  it('every document leads with the counsel-review line', () => {
    for (const id of DOCUMENT_IDS) {
      const doc = buildDocument(id, { door, tenancy, room, worker: { name: 'Sam' }, application: { applicant_name: 'A' }, request: { title: 't' }, clearances: clearAll() });
      if (!doc.ok) continue;
      expect(doc.lines[0], `${id} does not lead with the counsel line`).toBe(COUNSEL_LINE);
    }
    expect(COUNSEL_LINE).toMatch(/Not legal advice/);
    expect(COUNSEL_LINE).toMatch(/before it is given to anyone to sign/);
  });

  it('a regulated document names the law and why it bites', () => {
    const declined = buildDocument('application-declined', { application: { applicant_name: 'A', decision_reason: 'Income is 2.1x rent; our documented minimum is 3x.' } });
    expect(declined.regulated).toMatch(/FCRA/);
    expect(declined.lines.join('\n')).toMatch(/REGULATED — /);
    expect(declined.lines.join('\n')).toMatch(/right to dispute incomplete or inaccurate information/i);
    // The agency did not make the decision — the sentence the FCRA requires.
    expect(declined.lines.join('\n')).toMatch(/agency did not make this decision/i);
  });

  it('the decline carries the documented criterion, or names it as the blank it is', () => {
    const withReason = buildDocument('application-declined', { application: { applicant_name: 'A', decision_reason: 'Prior landlord confirmed a balance left owing.' } });
    expect(withReason.lines.join('\n')).toContain('Prior landlord confirmed a balance left owing.');
    const without = buildDocument('application-declined', { application: { applicant_name: 'A' } });
    expect(without.blanks).toContain('the documented criterion this rests on');
  });

  it('the contractor agreement names classification as the risk, not the wording', () => {
    expect(DOCUMENT_SET.find((d) => d.id === 'contractor-1099').regulated).toMatch(/treated as an employee is one regardless/);
  });
});

describe('the co-living gate reaches the paperwork too (DR-029)', () => {
  it('a room lease CANNOT be produced for an uncleared door', () => {
    const r = buildDocument('lease-by-room', { door, tenancy, room });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('coliving-not-cleared');
    expect(r.message).toMatch(/different legal regime/i);
  });

  it('and can once every checklist item is cleared', () => {
    const r = buildDocument('lease-by-room', { door, tenancy, room, clearances: clearAll() });
    expect(r.ok).toBe(true);
    expect(r.lines.join('\n')).toContain('Front bedroom');
    expect(r.lines.join('\n')).toMatch(/utilities included/);
  });

  it('the room lease states the privacy line to the person living there (DR-028)', () => {
    const r = buildDocument('lease-by-room', { door, tenancy, room, clearances: clearAll() });
    expect(r.lines.join('\n')).toMatch(/no camera, microphone or sensor inside any room/i);
    expect(r.lines.join('\n')).toMatch(/access log at the door/i);
  });
});

describe('acknowledgment is a fact, not a checkbox', () => {
  it('needs both who and when', () => {
    const doc = buildDocument('house-rules', { door });
    expect(doc.acknowledgment).toEqual({ required: true, by: null, at: null });
    expect(acknowledge(doc, { at: '2026-09-01' })).toEqual({ ok: false, reason: 'no-one-named' });
    expect(acknowledge(doc, { by: 'Leonard Morris' })).toEqual({ ok: false, reason: 'no-date' });
    const done = acknowledge(doc, { by: 'Leonard Morris', at: '2026-09-01T12:00:00Z' });
    expect(done.document.acknowledgment).toEqual({ required: true, by: 'Leonard Morris', at: '2026-09-01T12:00:00Z' });
  });
});
