// =============================================================================
// rescue-upload — the records land, twice is harmless, and a failure is named
// =============================================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/supabase.js', () => ({ default: {} }));
vi.mock('../lib/table-sync.js', () => ({
  getInstanceId: vi.fn(async () => '11111111-1111-1111-1111-111111111111'),
}));

import { carryUpRecords, describeResult } from '../lib/rescue-upload.js';
import { getInstanceId } from '../lib/table-sync.js';

const UUID = '22222222-2222-2222-2222-222222222222';

// A fake PostgREST that records every insert and can be told what a door
// already holds — the two behaviors this module's correctness turns on.
function fakeClient({ existing = {}, failOn = null, readFailOn = null, readError = null } = {}) {
  const inserted = {};
  const client = {
    inserted,
    auth: { getUser: async () => ({ data: { user: { id: 'user-1' } } }) },
    from(table) {
      const q = {
        _table: table,
        select() { return q; },
        eq() { return q; },
        not() {
          if (readFailOn === table) return Promise.resolve({ data: null, error: readError || { message: 'read blew up' } });
          return Promise.resolve({ data: (existing[table] || []).map((id) => ({ legacy_id: id })), error: null });
        },
        insert(rows) {
          if (failOn === table) return Promise.resolve({ error: { message: 'insert refused' } });
          inserted[table] = [...(inserted[table] || []), ...rows];
          return Promise.resolve({ error: null });
        },
      };
      return q;
    },
  };
  return client;
}

const door = (over = {}) => ({
  id: 'r-1508williamsburg',
  name: '1508 Williamsburg',
  remoteUuid: UUID,
  conversationLog: [{ id: 'cv-1', date: '2026-07-06', person: 'Adrianna', summary: 'Porch smoking' }],
  rooms: [{ id: 'rm-1', name: 'Kitchen' }],
  equipment: [{ id: 'eq-1', category: 'Water Heater', make: 'Rheem' }],
  maintenanceLog: [{ id: 'mt-1', date: '2026-05-02', category: 'lawn', description: 'Mowed' }],
  ...over,
});

beforeEach(() => { getInstanceId.mockResolvedValue('11111111-1111-1111-1111-111111111111'); });

describe('the records reach the right tables', () => {
  it('writes each store to its own table and counts what landed', async () => {
    const client = fakeClient();
    const res = await carryUpRecords(door(), { client });
    expect(res.ok).toBe(true);
    expect(res.carried).toBe(4);
    expect(client.inserted.property_notes).toHaveLength(1);
    expect(client.inserted.property_rooms).toHaveLength(1);
    expect(client.inserted.property_systems).toHaveLength(1);
    expect(client.inserted.property_system_events).toHaveLength(1);
  });

  it('keys the note by slug and everything else by uuid', async () => {
    // Two keys, not interchangeable. Swapping them writes rows nothing will
    // ever read again — the failure is silent, which is why it is pinned.
    const client = fakeClient();
    await carryUpRecords(door(), { client });
    expect(client.inserted.property_notes[0].rental_ref).toBe('r-1508williamsburg');
    expect(client.inserted.property_rooms[0].rental_ref).toBe(UUID);
    expect(client.inserted.property_systems[0].rental_ref).toBe(UUID);
    expect(client.inserted.property_system_events[0].rental_ref).toBe(UUID);
  });

  it('stamps the instance and the author on every row', async () => {
    const client = fakeClient();
    await carryUpRecords(door(), { client });
    const all = Object.values(client.inserted).flat();
    for (const row of all) {
      expect(row.instance_id).toBe('11111111-1111-1111-1111-111111111111');
      expect(row.created_by).toBe('user-1');
    }
  });
});

describe('pressing the button twice is harmless', () => {
  it('sends nothing that is already filed under the same device id', async () => {
    const client = fakeClient({
      existing: {
        property_notes: ['cv-1'],
        property_rooms: ['rm-1'],
        property_systems: ['eq-1'],
        property_system_events: ['mt-1'],
      },
    });
    const res = await carryUpRecords(door(), { client });
    expect(res.carried).toBe(0);
    expect(client.inserted).toEqual({});
  });

  it('sends only the part that is new', async () => {
    const client = fakeClient({ existing: { property_notes: ['cv-1'], property_rooms: ['rm-1'] } });
    const res = await carryUpRecords(door(), { client });
    expect(res.carried).toBe(2);
    expect(client.inserted.property_notes).toBeUndefined();
    expect(client.inserted.property_systems).toHaveLength(1);
  });
});

describe('a failure is named, never swallowed', () => {
  it('does not treat an unreadable table as an empty one', async () => {
    // If the read failed and this assumed "nothing is filed", the next press
    // would duplicate every record on the door. The table fails instead.
    const client = fakeClient({ existing: { property_notes: ['cv-1'] }, readFailOn: 'property_notes' });
    const res = await carryUpRecords(door(), { client });
    expect(res.ok).toBe(false);
    expect(client.inserted.property_notes).toBeUndefined();
    expect(res.failed.join(' ')).toContain('could not check what is already filed');
  });

  it('reports a partial success as partial, naming the table that refused', async () => {
    const client = fakeClient({ failOn: 'property_systems' });
    const res = await carryUpRecords(door(), { client });
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('partly-carried');
    expect(res.carried).toBe(3);
    expect(res.failed.join(' ')).toContain('property_systems: insert refused');
    expect(describeResult(res)).toContain('Carried 3 records');
  });

  it('says to sign in rather than failing obscurely with no instance', async () => {
    getInstanceId.mockResolvedValue(null);
    const res = await carryUpRecords(door(), { client: fakeClient() });
    expect(res.ok).toBe(false);
    expect(describeResult(res)).toContain('Sign in first');
  });

  it('holds back uuid-keyed rows when the door has never synced', async () => {
    const client = fakeClient();
    const res = await carryUpRecords(door({ remoteUuid: null }), { client });
    // The slug-keyed note still goes; the rest wait for the door's server id.
    expect(client.inserted.property_notes).toHaveLength(1);
    expect(client.inserted.property_rooms).toBeUndefined();
    expect(res.plan.deferred.join(' ')).toContain('has synced');
  });
});

describe('the window between a deploy and its migration is named, not dumped raw', () => {
  // legacy_id arrives with 0159. The lane deploys and migrates on the same
  // merge but not in a guaranteed order, so there is a real window where every
  // read is a 400 for an unknown column. That is a database catching up, not a
  // broken record, and the landlord gets a sentence he can act on.
  const missing = {
    message: "column property_rooms.legacy_id does not exist",
    code: '42703',
  };

  it('says the database has not caught up, rather than quoting PostgREST', async () => {
    const client = fakeClient({ readFailOn: 'property_rooms', readError: missing });
    const res = await carryUpRecords(door(), { client });
    expect(res.failed.join(' ')).toContain('has not caught up with this release yet');
    expect(res.failed.join(' ')).not.toContain('42703');
  });

  it('still carries the tables that ARE ready', async () => {
    const client = fakeClient({ readFailOn: 'property_rooms', readError: missing });
    const res = await carryUpRecords(door(), { client });
    expect(client.inserted.property_rooms).toBeUndefined();
    expect(client.inserted.property_notes).toHaveLength(1);
    expect(res.carried).toBe(3);
  });

  it('does not mistake an ordinary read failure for a missing column', async () => {
    const client = fakeClient({ readFailOn: 'property_rooms' });
    const res = await carryUpRecords(door(), { client });
    expect(res.failed.join(' ')).toContain('could not check what is already filed');
    expect(res.failed.join(' ')).not.toContain('has not caught up');
  });
});

describe('the sentence afterwards tells the whole truth', () => {
  it('mentions the photos that stayed behind', async () => {
    const client = fakeClient();
    const res = await carryUpRecords(
      door({ rooms: [{ id: 'rm-1', name: 'Kitchen', photos: [{ src: 'data:x' }] }] }),
      { client },
    );
    expect(describeResult(res)).toContain('1 photo');
  });

  it('says so plainly when there was nothing to carry', async () => {
    const client = fakeClient();
    const res = await carryUpRecords({ id: 'r-empty' }, { client, rentalUuid: UUID });
    expect(describeResult(res)).toBe('Everything in this record was already on the server.');
  });
});
