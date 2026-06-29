// practice-leads-sync maps the client-acquisition CRM lead <-> the 0045
// practice_leads row. The mapping is verified here (the controller doesn't
// re-expose toRow/fromRow), and the column map is checked so the monolith's
// updateLead patch builder can't drift from the migration's columns.
import { describe, it, expect } from 'vitest';
import { leadToRow, leadFromRow, LEAD_COLUMN_OF, mergeRemoteLeads } from '../lib/practice-leads-sync.js';
import { newLead } from '../lib/client-acquisition.js';

describe('lead <-> row mapping', () => {
  it('toRow includes instance_id + created_by and the flat columns', () => {
    const lead = newLead({
      sideKey: 'therapist', name: 'Acme Counseling', org: 'Acme', role: 'Owner',
      contactMethod: 'email', contactValue: 'a@acme.org', source: 'youtube', stage: 'contacted',
      consent: { outreachOk: true, capturedAt: '2026-06-24T00:00:00.000Z', note: '' },
    }, { id: 'lead-1' });
    const row = leadToRow(lead, { tenantId: 'inst-9', userId: 'user-7' });
    expect(row.instance_id).toBe('inst-9');
    expect(row.created_by).toBe('user-7');
    expect(row.slug).toBe('lead-1');
    expect(row.audience_preset_key).toBe('therapist'); // side key stored in the CRM column
    expect(row.name).toBe('Acme Counseling');
    expect(row.stage).toBe('contacted');
    expect(row.consent.outreachOk).toBe(true);
  });

  it('round-trips toRow -> fromRow preserving the local shape (incl. sideKey)', () => {
    const lead = newLead({ sideKey: 'training', name: 'X', org: 'Org', source: 'linkedin', stage: 'enrolled', fitScore: 80, signalTags: ['ce-demand'] }, { id: 'lead-2' });
    const row = { ...leadToRow(lead, { tenantId: 't', userId: 'u' }), id: 'uuid-abc', created_at: '2026-06-24T00:00:00.000Z' };
    const back = leadFromRow(row);
    expect(back.id).toBe('lead-2');         // slug -> id
    expect(back.remoteUuid).toBe('uuid-abc');
    expect(back.sideKey).toBe('training');
    expect(back.fitScore).toBe(80);
    expect(back.signalTags).toEqual(['ce-demand']);
    expect(back.stage).toBe('enrolled');
  });

  it('has no clinical columns (PHI wall is structural)', () => {
    const row = leadToRow(newLead({ name: 'X' }, { id: 'l' }), { tenantId: 't', userId: 'u' });
    expect(row).not.toHaveProperty('diagnosis');
    expect(row).not.toHaveProperty('presenting_concern');
    expect(row).not.toHaveProperty('clinical_notes');
  });
});

describe('LEAD_COLUMN_OF', () => {
  it('maps editable local fields to snake_case columns', () => {
    expect(LEAD_COLUMN_OF.stage).toBe('stage');
    expect(LEAD_COLUMN_OF.contactValue).toBe('contact_value');
    expect(LEAD_COLUMN_OF.signalTags).toBe('signal_tags');
    expect(LEAD_COLUMN_OF.sideKey).toBe('audience_preset_key');
  });

  it('does not allow patching identity columns', () => {
    expect(LEAD_COLUMN_OF).not.toHaveProperty('instanceId');
    expect(LEAD_COLUMN_OF).not.toHaveProperty('createdBy');
  });
});

describe('mergeRemoteLeads', () => {
  it('keeps a never-uploaded local lead (non-UUID id) when the cloud list arrives', () => {
    const localOnly = newLead({ name: 'Offline' }, { id: 'lead-local-1' });
    const remote = [{ id: '11111111-1111-1111-1111-111111111111', name: 'Cloud' }];
    const merged = mergeRemoteLeads([localOnly], remote);
    expect(merged.find((l) => l.id === 'lead-local-1')).toBeTruthy();
    expect(merged.find((l) => l.id === '11111111-1111-1111-1111-111111111111')).toBeTruthy();
  });
});
