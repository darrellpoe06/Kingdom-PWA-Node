// @vitest-environment node
// =============================================================================
// The keeper pulls back (DR-0826): contacts kept on your own server reach
// every device's list; a hand-added contact reaches the server; a forgotten
// contact is forgotten on both, so it does not return on the next pull.
// =============================================================================
// Darrell 2026-10-09: "Names and cellphone numbers are not being synchronized!"
// Measured cause: the Messages list read only the device cache. Fixtures are
// made up and the numbers are the 555 reserve.
import { describe, it, expect } from 'vitest';
import { pullMyContacts, keepContactOnServer, forgetContactEverywhere, tableRowToDevice } from '../lib/contacts-store.js';
import { readContacts, upsertContact } from '../lib/saved-contacts.js';

function fakeStore() { let v = null; return { getItem: () => v, setItem: (_k, val) => { v = val; } }; }

const TABLE_ROWS = [
  { contact_key: 'p:5550100498', name: 'Sister Lamb', phones: ['(555) 010-0498'], emails: [], created_at: '2026-10-01T00:00:00Z' },
  { contact_key: 'e:reed@example.org', name: 'Brother Reed', phones: ['555-010-0317'], emails: ['reed@example.org'], created_at: '2026-10-02T00:00:00Z' },
  { contact_key: 'n:blank', name: '', phones: [], emails: [], created_at: '2026-10-03T00:00:00Z' },   // nothing to show
];

function clientWith({ rows = TABLE_ROWS, error = null, session = { user: { id: 'me' } } } = {}) {
  const calls = { upserts: [], deletes: [] };
  const client = {
    auth: { getSession: async () => ({ data: { session } }) },
    from: (t) => ({
      select: () => ({ order: async () => ({ data: error ? null : rows, error }) }),
      upsert: async (payload, opts) => { calls.upserts.push({ t, payload, opts }); return { error: null }; },
      delete: () => ({ eq: async (col, val) => { calls.deletes.push({ t, col, val }); return { error: null }; } }),
    }),
  };
  return { client, calls };
}

describe('tableRowToDevice', () => {
  it('takes the name, the first phone and the first email', () => {
    expect(tableRowToDevice(TABLE_ROWS[1])).toEqual({ name: 'Brother Reed', phone: '555-010-0317', email: 'reed@example.org', status: 'saved' });
    expect(tableRowToDevice({})).toEqual({ name: '', phone: '', email: '', status: 'saved' });
  });
});

describe('pullMyContacts', () => {
  it('writes the server rows into this device\'s list, merging onto the same people', async () => {
    const storage = fakeStore();
    // Already on this device under a different name, same number: merged, not duplicated.
    upsertContact(storage, { name: 'Lamb (old)', phone: '5550100498' }, '2026-09-01');
    const { client } = clientWith();
    const r = await pullMyContacts({ client, storage });
    expect(r).toEqual({ ok: true, pulled: 2, reason: '' });
    const list = readContacts(storage);
    expect(list).toHaveLength(2);
    const lamb = list.find((c) => c.phone.includes('0498'));
    expect(lamb.name).toBe('Sister Lamb');            // the server's name wins on the merge
    expect(list.find((c) => c.email === 'reed@example.org').name).toBe('Brother Reed');
  });
  it('says so when the server does not answer, and leaves the device list alone', async () => {
    const storage = fakeStore();
    upsertContact(storage, { name: 'Only here', phone: '5550100222' }, '2026-09-01');
    const { client } = clientWith({ error: { message: 'relation "contacts" does not exist' } });
    const r = await pullMyContacts({ client, storage });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/does not exist/);
    expect(readContacts(storage)).toHaveLength(1);
  });
  it('a thrown client is a reason, never an exception', async () => {
    const client = { from: () => { throw new Error('offline'); } };
    const r = await pullMyContacts({ client, storage: fakeStore() });
    expect(r).toMatchObject({ ok: false, pulled: 0 });
    expect(r.reason).toMatch(/offline/);
  });
});

describe('keepContactOnServer', () => {
  it('upserts one manual row keyed like the device list', async () => {
    const { client, calls } = clientWith();
    const r = await keepContactOnServer({ name: 'Deacon Oak', phone: '(555) 010-0777', email: '' }, { client });
    expect(r).toEqual({ ok: true, reason: '' });
    expect(calls.upserts).toHaveLength(1);
    expect(calls.upserts[0].opts).toEqual({ onConflict: 'owner_id,contact_key' });
    expect(calls.upserts[0].payload[0]).toMatchObject({ owner_id: 'me', contact_key: 'p:5550100777', name: 'Deacon Oak', phones: ['(555) 010-0777'], emails: [], source: 'manual' });
  });
  it('an email keys the row, lowercased', async () => {
    const { client, calls } = clientWith();
    await keepContactOnServer({ name: 'Oak', phone: '', email: 'OAK@Example.org' }, { client });
    expect(calls.upserts[0].payload[0]).toMatchObject({ contact_key: 'e:oak@example.org', emails: ['oak@example.org'] });
  });
  it('signed out: nothing is written and the reason is said', async () => {
    const { client, calls } = clientWith({ session: null });
    const r = await keepContactOnServer({ name: 'Oak', phone: '5550100777' }, { client });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/Not signed in/);
    expect(calls.upserts).toHaveLength(0);
  });
  it('nothing identifying: nothing is written', async () => {
    const { client, calls } = clientWith();
    const r = await keepContactOnServer({ name: '', phone: '', email: '' }, { client });
    expect(r.ok).toBe(false);
    expect(calls.upserts).toHaveLength(0);
  });
});

describe('forgetContactEverywhere', () => {
  it('removes the row from the device list and deletes it on the server by key', async () => {
    const storage = fakeStore();
    upsertContact(storage, { name: 'Deacon Oak', phone: '5550100777' }, '2026-09-01');
    const { client, calls } = clientWith();
    const r = await forgetContactEverywhere('p:5550100777', { client, storage });
    expect(r).toEqual({ ok: true, reason: '' });
    expect(readContacts(storage)).toHaveLength(0);
    expect(calls.deletes).toEqual([{ t: 'contacts', col: 'contact_key', val: 'p:5550100777' }]);
  });
  it('a server refusal is a reason, and the device row is still gone', async () => {
    const storage = fakeStore();
    upsertContact(storage, { name: 'Deacon Oak', phone: '5550100777' }, '2026-09-01');
    const client = { from: () => ({ delete: () => ({ eq: async () => ({ error: { message: 'permission denied' } }) }) }) };
    const r = await forgetContactEverywhere('p:5550100777', { client, storage });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/permission denied/);
    expect(readContacts(storage)).toHaveLength(0);
  });
});
