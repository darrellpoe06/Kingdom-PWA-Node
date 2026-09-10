// @vitest-environment node
// =============================================================================
// The TLC app carries the office's own workflows (DR-0344): the standalone
// office store binds the SAME table syncs the PoeTech shell uses and runs the
// shell's reducers — upload → remoteUuid, column patches, deletes — without
// the family books store. DR-0076: the syncs are stubbed and every call the
// store makes is recorded.
// =============================================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const calls = { inq: [], leads: [] };
vi.mock('../lib/inquiries-sync.js', () => ({
  inquiriesSync: {
    initialSync: async () => ({ merged: [{ id: 'inq-1', remoteUuid: 'u-1', firstName: 'Maya', status: 'new', contactMethod: 'phone', statusHistory: [] }] }),
    subscribe: () => () => {},
    upload: async (item) => { calls.inq.push(['upload', item.id]); return { uploaded: true, remoteId: 'u-new' }; },
    updateRow: async (id, patch) => { calls.inq.push(['update', id, patch]); return { updated: true }; },
    deleteRow: async (id) => { calls.inq.push(['delete', id]); return { deleted: true }; },
  },
}));
vi.mock('../lib/practice-leads-sync.js', () => ({
  practiceLeadsSync: {
    initialSync: async () => ({ merged: [] }),
    subscribe: () => () => {},
    upload: async (item) => { calls.leads.push(['upload', item.id]); return { uploaded: true, remoteId: 'l-new' }; },
    updateRow: async (id, patch) => { calls.leads.push(['update', id, patch]); return { updated: true }; },
    deleteRow: async (id) => { calls.leads.push(['delete', id]); return { deleted: true }; },
  },
  mergeRemoteLeads: (cur, inc) => inc,
  LEAD_COLUMN_OF: { name: 'name', stage: 'stage' },
}));

import { startTlcOfficeData, addInquiry, updateInquiry, deleteInquiry, addLead, updateLead, deleteLead, inquiryPatch, __resetTlcOfficeData } from '../lib/tlc-office-data.js';

const tick = () => new Promise((r) => setTimeout(r, 0));
beforeEach(() => { __resetTlcOfficeData(); calls.inq.length = 0; calls.leads.length = 0; });

describe('the standalone office store', () => {
  it('reads both tables once on start and marks itself loaded + signed in', async () => {
    const s = await startTlcOfficeData();
    expect(s.loaded).toBe(true);
    expect(s.signedIn).toBe(true);
    expect(s.inquiries).toHaveLength(1);
  });
  it('addInquiry seeds the shell shape, uploads, and binds the remoteUuid that comes back', async () => {
    await startTlcOfficeData();
    const seeded = addInquiry({ firstName: 'New', contactMethod: 'email', contactValue: 'n@example.com' });
    expect(seeded.status).toBe('new');
    expect(seeded.statusHistory).toHaveLength(1);
    await tick();
    expect(calls.inq[0]).toEqual(['upload', seeded.id]);
    const s = await startTlcOfficeData();
    expect(s.inquiries.find((i) => i.id === seeded.id).remoteUuid).toBe('u-new');
  });
  it('updateInquiry patches by column, appending status history exactly like the shell', async () => {
    await startTlcOfficeData();
    updateInquiry('inq-1', { status: 'contacted', statusNotes: 'left a message', notes: 'call back' });
    await tick();
    const [kind, id, patch] = calls.inq[0];
    expect(kind).toBe('update'); expect(id).toBe('u-1');
    expect(patch.status).toBe('contacted');
    expect(patch.notes).toBe('call back');
    expect(patch.status_history).toHaveLength(1);
    expect(patch.status_history[0]).toMatchObject({ status: 'contacted', notes: 'left a message' });
  });
  it('inquiryPatch routes phone/email to contact_value by the contact method', () => {
    expect(inquiryPatch({ contactMethod: 'phone' }, { phone: '217' }).contact_value).toBe('217');
    expect(inquiryPatch({ contactMethod: 'email' }, { phone: '217' }).contact_value).toBeUndefined();
    expect(inquiryPatch({ contactMethod: 'email' }, { email: 'a@b.c' }).contact_value).toBe('a@b.c');
  });
  it('deleteInquiry removes the remote row and the local one', async () => {
    await startTlcOfficeData();
    deleteInquiry('inq-1');
    await tick();
    expect(calls.inq[0]).toEqual(['delete', 'u-1']);
    expect((await startTlcOfficeData()).inquiries).toHaveLength(0);
  });
  it('leads: upload binds remoteUuid; update patches only mapped columns; delete removes', async () => {
    await startTlcOfficeData();
    addLead({ id: 'lead-1', name: 'Org', stage: 'new' });
    await tick();
    updateLead('lead-1', { stage: 'contacted', unmapped: 'x' });
    await tick();
    expect(calls.leads[0]).toEqual(['upload', 'lead-1']);
    expect(calls.leads[1]).toEqual(['update', 'l-new', { stage: 'contacted' }]);
    deleteLead('lead-1');
    await tick();
    expect(calls.leads[2]).toEqual(['delete', 'l-new']);
  });
});

describe('the TLC app never pulls the family books store, and Practice no longer imports the shell', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  it('tlc-office-data imports only the two table syncs', () => {
    const src = readFileSync(join(here, '../lib/tlc-office-data.js'), 'utf8');
    expect(src).not.toMatch(/use-financial|financial-store|poe-financial-mvp|app-store/);
    expect(src).toMatch(/inquiries-sync\.js/);
    expect(src).toMatch(/practice-leads-sync\.js/);
  });
  it('Practice.jsx takes findRelatedAuto from the lib, not the monolith (the door mounts it)', () => {
    const src = readFileSync(join(here, '../components/Practice.jsx'), 'utf8');
    expect(src).not.toMatch(/from '\.\.\/poe-financial-mvp-v28\.jsx'/);
    expect(src).toMatch(/from '\.\.\/lib\/lifecycle-and-flow\.js'/);
  });
});
