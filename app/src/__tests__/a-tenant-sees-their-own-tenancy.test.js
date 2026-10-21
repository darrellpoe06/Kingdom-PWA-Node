// =============================================================================
// A tenant sees their own tenancy, from the day it became theirs (DR-1159).
// Darrell, 2026-10-21, on 805 North Prospect Avenue Apt 2 "seen as a tenant":
// "A new tenant should only see their history... the landlord should see all
// historical events and data make sense?" and "all tabs should make sense".
//
// What the screen showed: a vacant door's tenant face listing the landlord's
// own 7/6 note about the last tenant and a 10/10 test message, under a line
// saying the landlord's private notes are not part of the tenant's history.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { forThisTenancy, tenancyHasTenant, tenantSightStart, buildHistory, unseenByThisFace } from '../modules/properties/model.js';
import { tenancyForTenantInvite } from '../modules/properties/staging.js';
import { loadDoorRecord } from '../modules/properties/cloud.js';

const VACANT = { id: 'v', instance_id: 'i', rental_ref: 'apt-2', status: 'pending', tenant_name: null, created_at: '2026-06-01T00:00:00Z' };
const THEIRS = { ...VACANT, tenant_user_id: 'u-t', tenant_from: '2026-10-15T00:00:00Z' };

// The door's record as the owner reads it: the vacant months and the tenant's.
const DOOR = {
  requests: [
    { id: 'w1', tenancy_id: 'v', title: 'Turn the unit', created_at: '2026-07-07T00:00:00Z' },
    { id: 'w2', tenancy_id: 'v', title: 'Sink drips', created_at: '2026-10-16T00:00:00Z' },
    { id: 'w3', tenancy_id: null, rental_id: 'r', title: 'Roof', created_at: '2026-10-17T00:00:00Z' },
    { id: 'w4', tenancy_id: 'old', title: 'Jhazmine left the keys', created_at: '2026-10-18T00:00:00Z' },
  ],
  messages: [
    { id: 'm1', tenancy_id: 'v', body: 'Testing the process....', sent_at: '2026-10-10T00:00:00Z' },
    { id: 'm2', tenancy_id: 'v', body: 'Welcome home', sent_at: '2026-10-15T09:00:00Z' },
  ],
  notes: [{ id: 'n1', tenancy_id: 'v', body: 'Moved out dirty', created_at: '2026-07-06T00:00:00Z' }],
  docs: [
    { id: 'd1', request_id: 'w1', tenancy_id: 'v', created_at: '2026-07-08T00:00:00Z' },
    { id: 'd2', request_id: 'w2', tenancy_id: 'v', created_at: '2026-10-16T01:00:00Z' },
  ],
  rent: [
    { id: 'p1', tenancy_id: 'v', amount: 900, reported_at: '2026-07-01T00:00:00Z' },
    { id: 'p2', tenancy_id: 'v', amount: 900, reported_at: '2026-10-20T00:00:00Z' },
  ],
  notices: [{ id: 'x1', tenancy_id: 'v', title: 'Inspection', posted_at: '2026-07-01T00:00:00Z' }],
  unreadable: [],
};

describe('the tenant face reads its own tenancy only (forThisTenancy)', () => {
  it('a door with nobody on it shows a tenant nothing at all, and says it is vacant', () => {
    const seen = forThisTenancy(DOOR, VACANT);
    expect(seen.vacant).toBe(true);
    for (const k of ['requests', 'messages', 'notes', 'docs', 'rent', 'notices']) expect(seen[k]).toEqual([]);
    expect(forThisTenancy(DOOR, null).vacant).toBe(true);
  });

  it('PROVEN TO CATCH: the 10/10 test message and the 7/6 note are not the new tenant\'s', () => {
    const seen = forThisTenancy(DOOR, THEIRS);
    expect(seen.messages.map((m) => m.id)).toEqual(['m2']);
    expect(seen.notes).toEqual([]);
    expect(seen.notices).toEqual([]);
    expect(seen.since).toBe('2026-10-15T00:00:00.000Z');
  });

  it('a door-level row and another tenancy\'s row never reach a tenant', () => {
    const seen = forThisTenancy(DOOR, THEIRS);
    expect(seen.requests.map((r) => r.id)).toEqual(['w2']);
    expect(seen.docs.map((d) => d.id)).toEqual(['d2']);
    expect(seen.rent.map((r) => r.id)).toEqual(['p2']);
  });

  it('with no tenant_from yet, the window opens at the row\'s birth', () => {
    const named = { ...VACANT, tenant_name: 'Sam', created_at: '2026-10-12T00:00:00Z' };
    expect(tenantSightStart(named).iso).toBe('2026-10-12T00:00:00.000Z');
    expect(forThisTenancy(DOOR, named).messages.map((m) => m.id)).toEqual(['m2']);
  });

  it('a person is a name, an email, a phone or an account', () => {
    expect(tenancyHasTenant(VACANT)).toBe(false);
    expect(tenancyHasTenant({ tenant_name: '  ' })).toBe(false);
    for (const k of ['tenant_name', 'tenant_email', 'tenant_phone', 'tenant_user_id']) {
      expect(tenancyHasTenant({ [k]: 'x' })).toBe(true);
    }
  });

  it('the tenant history built from it carries no landlord note and says where it begins', () => {
    const seen = forThisTenancy(DOOR, THEIRS);
    const events = buildHistory({ ...seen, propertyNotes: [] });
    expect(events.some((e) => e.kind === 'property-note')).toBe(false);
    expect(events.every((e) => e.at >= '2026-10-15')).toBe(true);
    const lines = unseenByThisFace('tenant', [], { since: seen.since });
    expect(lines[0]).toMatch(/begins on 2026-10-15/);
    expect(unseenByThisFace('owner', [], { since: seen.since })).toEqual([]);
  });
});

describe('the screen wires it on every tenant tab (PropertiesApp)', () => {
  const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'modules', 'properties', 'PropertiesApp.jsx'), 'utf8');
  it('the tenant face reads `seen`, not the door record, on History, Messages, Work orders, Payments and Notices', () => {
    expect(src).toMatch(/tenantFace \? forThisTenancy\(record, activeDoor\) : record/);
    expect(src).toContain('requests={seen.requests} open={openWork} docs={seen.docs}');
    expect(src).toContain('<ThreadTab messages={seen.messages}');
    expect(src).toContain('rent={seen.rent} door={activeDoor}');
    expect(src).toContain('seen.notices.map(');
  });
  it('the landlord\'s own door notes join the history for the landlord\'s faces only', () => {
    expect(src).toContain("role === 'owner' || role === 'manager' ? doorData.propertyNotes || [] : []");
    expect(src).toContain('propertyNotes: doorNotes');
    expect(src).not.toMatch(/buildHistory\(\{ \.\.\.record, propertyNotes: doorData\.propertyNotes/);
  });
  it('a vacant door says so to the tenant face, and My place has no lease to show', () => {
    expect(src).toContain('data-testid="tenant-face-vacant"');
    expect(src).toContain('No tenancy on this door yet, so there is no lease to show.');
  });
  it('the landlord reads every tenancy the door has had', () => {
    expect(src).toContain('earlierTenancyIds: landlordSees ? doorTenancyIds : []');
  });
  it('a tenant invitation goes through tenancyForTenantInvite', () => {
    expect(src).toContain("payload.roleLabel === 'tenant' ? await doorForTenant(payload) : await ensureDoor()");
  });
});

describe('a new tenant is invited onto a tenancy that is theirs (tenancyForTenantInvite)', () => {
  const invitee = { displayName: 'Pat', email: 'pat@x.test', phone: '' };
  it('a vacant unit record is given their name first, which opens their window', () => {
    const plan = tenancyForTenantInvite({ door: VACANT, invitee });
    expect(plan.action).toBe('hold');
    expect(plan.patch).toEqual({ tenant_name: 'Pat', tenant_email: 'pat@x.test', tenant_phone: null });
  });
  it('a tenancy already in their name is used as it is', () => {
    const plan = tenancyForTenantInvite({ door: { ...VACANT, status: 'active', tenant_name: 'Pat', tenant_email: 'PAT@x.test' }, invitee });
    expect(plan.action).toBe('use');
    const byPhone = tenancyForTenantInvite({ door: { ...VACANT, status: 'active', tenant_phone: '(555) 123-4567' }, invitee: { phone: '+1 555 123 4567' } });
    expect(byPhone.action).toBe('use');
  });
  it('PROVEN TO CATCH: an ended tenancy, or one in someone else\'s name, is never reused', () => {
    const ended = tenancyForTenantInvite({ door: { ...VACANT, status: 'ended', tenant_name: 'Jhazmine' }, invitee });
    expect(ended.action).toBe('new');
    expect(ended.row).toMatchObject({ rental_ref: 'apt-2', tenant_name: 'Pat', tenant_email: 'pat@x.test', status: 'pending' });
    const someoneElse = tenancyForTenantInvite({ door: { ...VACANT, status: 'active', tenant_name: 'Sam' }, invitee });
    expect(someoneElse.action).toBe('new');
    const emptyEnded = tenancyForTenantInvite({ door: { ...VACANT, status: 'ended' }, invitee });
    expect(emptyEnded.action).toBe('new');
  });
  it('no door at all starts a tenancy on the rental', () => {
    const plan = tenancyForTenantInvite({ door: null, rental: { id: 'r', slug: 'apt-9', instance_id: 'i', display_name: '9 Street' }, invitee });
    expect(plan.action).toBe('new');
    expect(plan.row).toMatchObject({ instance_id: 'i', rental_ref: 'apt-9', property_label: '9 Street' });
  });
});

describe('the landlord\'s read covers every tenancy the door has had (loadDoorRecord)', () => {
  const recorder = () => {
    const calls = [];
    const client = {
      from: (table) => {
        const self = {
          select: () => self,
          eq: (c, v) => { calls.push([table, 'eq', c, v]); return self; },
          in: (c, v) => { calls.push([table, 'in', c, v]); return self; },
          or: (f) => { calls.push([table, 'or', f]); return self; },
          order: () => Promise.resolve({ data: [], error: null }),
        };
        return self;
      },
    };
    return { calls, client };
  };
  it('earlier tenancies join the read; messages and notices included', async () => {
    const { calls, client } = recorder();
    await loadDoorRecord('now', { rentalId: 'r', earlierTenancyIds: ['old', 'now'] }, client);
    expect(calls).toContainEqual(['tenant_messages', 'in', 'tenancy_id', ['now', 'old']]);
    expect(calls).toContainEqual(['tenant_notices', 'in', 'tenancy_id', ['now', 'old']]);
    expect(calls).toContainEqual(['tenancy_notes', 'or', 'tenancy_id.in.(now,old),rental_id.eq.r']);
  });
  it('without them it reads one tenancy, as before', async () => {
    const { calls, client } = recorder();
    await loadDoorRecord('now', { rentalId: 'r' }, client);
    expect(calls).toContainEqual(['tenant_messages', 'eq', 'tenancy_id', 'now']);
    expect(calls).toContainEqual(['tenancy_notes', 'or', 'tenancy_id.in.(now),rental_id.eq.r']);
  });
});
