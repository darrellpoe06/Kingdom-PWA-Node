// =============================================================================
// crm-sync — row<->lead round-trip mappers. Pins that a lead survives a trip to
// the crm_leads row shape and back without losing or corrupting a field, and
// that source is attributed on the way out. Pairs with crm-engine.test.js.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { toCrmLeadRow, fromCrmLeadRow } from '../lib/crm-sync.js';
import { newLead } from '../lib/crm-engine.js';

const NOW = '2026-06-24T12:00:00.000Z';

describe('crm-sync mappers — round-trip', () => {
  it('toCrmLeadRow maps app shape -> snake_case row + attributes source', () => {
    const lead = newLead({
      pipeline: 'tlc-therapist-recruiting', name: 'Dr. A', org: 'Group Practice', role: 'LCSW',
      contactMethod: 'email', contactValue: 'a@x.com', source: 'LinkedIn', fitScore: 80,
      consent: { outreachOk: true, channels: ['email'] },
    }, { now: NOW, id: 'lead-7' });
    const row = toCrmLeadRow(lead, { tenantId: 't-1', userId: 'u-1' });
    expect(row).toMatchObject({
      instance_id: 't-1', created_by: 'u-1', slug: 'lead-7',
      business: 'tlc', pipeline: 'tlc-therapist-recruiting', stage: 'new',
      name: 'Dr. A', org: 'Group Practice', role: 'LCSW',
      contact_method: 'email', contact_value: 'a@x.com', source: 'linkedin', fit_score: 80,
      nurture_step: 0, sequence_key: 'tlc-recruit-nurture', seed: false,
    });
    expect(row.consent.outreachOk).toBe(true);
  });

  it('fromCrmLeadRow rehydrates into the canonical lead shape', () => {
    const row = {
      id: 'uuid-1', slug: 'lead-9', business: 'boxcar', pipeline: 'boxcar-booking', stage: 'booked',
      name: 'Lee', contact_method: 'phone', contact_value: '555', source: 'google', source_detail: 'Party 2',
      fit_score: null, signal_tags: [], notes: null,
      consent: { outreachOk: true, channels: ['phone', 'text'], capturedAt: NOW, note: 'Booking request' },
      nurture_step: 1, sequence_key: 'boxcar-confirm', owner_user_id: null, seed: false,
      links: {}, history: [{ stage: 'new', at: NOW }, { stage: 'booked', at: NOW }],
      created_at: NOW, updated_at: NOW,
    };
    const lead = fromCrmLeadRow(row);
    expect(lead).toMatchObject({
      id: 'lead-9', business: 'boxcar', pipeline: 'boxcar-booking', stage: 'booked',
      name: 'Lee', contactMethod: 'phone', contactValue: '555', source: 'google',
      nurtureStep: 1, sequenceKey: 'boxcar-confirm', seed: false,
    });
    expect(lead.history).toHaveLength(2);
  });

  it('round-trip preserves identity', () => {
    const lead = newLead({ pipeline: 'gtm-subscriber', name: 'Sam', contactValue: 's@x.com', source: 'website', consent: { outreachOk: true, channels: ['email'] } }, { now: NOW, id: 'lead-rt' });
    const back = fromCrmLeadRow({ ...toCrmLeadRow(lead, { tenantId: 't', userId: 'u' }), id: 'uuid-x', created_at: NOW, updated_at: NOW });
    expect(back.id).toBe('lead-rt');
    expect(back.business).toBe('gtm');
    expect(back.source).toBe('website');
    expect(back.consent.outreachOk).toBe(true);
  });
});
