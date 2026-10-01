// @vitest-environment node
// =============================================================================
// contacts-import — the plan: new, already saved, already on PoeTech (DR-0736)
// =============================================================================
// The picker's shape becomes plain contacts; each incoming contact is matched
// by email or by the ten digits of a phone against the saved list and the
// people already on PoeTech; the same person twice in one file is counted,
// not saved twice; and nothing is ever merged, only named with its reason.
import { describe, it, expect } from 'vitest';
import { fromPickerResults, planImport, summaryLine, importKey, toSavedContact, pickerSupported } from '../lib/contacts-import.js';
import { toTableRow, saveImportedContacts } from '../lib/contacts-store.js';

describe('fromPickerResults — the Contact Picker shape becomes plain contacts', () => {
  it('takes the first name, every phone and email, and drops an empty pick', () => {
    const rows = fromPickerResults([
      { name: ['Shay Poe'], tel: ['563-505-9393', '563-505-9393', '(563) 505-9394'], email: ['Shay@Example.test'], address: [{ addressLine: ['12 Oak St'], city: 'Davenport', region: 'IA', postalCode: '52801', country: 'US' }] },
      { name: [], tel: [], email: [] },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: 'Shay Poe', phones: ['563-505-9393', '(563) 505-9394'], emails: ['shay@example.test'], addresses: ['12 Oak St, Davenport, IA, 52801, US'] });
  });

  it('pickerSupported is true only when navigator.contacts.select exists', () => {
    expect(pickerSupported({ contacts: { select: () => {} } })).toBe(true);
    expect(pickerSupported({})).toBe(false);
    expect(pickerSupported(undefined)).toBe(false);
  });
});

const SAVED = [{ id: 'p:2175550142', name: 'Shay', phone: '(217) 555-0142', email: '' }];
const MEMBERS = [
  { userId: 'u-ann', displayName: 'Sister Ann', email: 'ann@example.test', phone: '' },
  { userId: 'u-door', displayName: 'Door Person', email: '15636502416@phone.poetech.us', phone: '15636502416' },
];

describe('planImport — matches by email or phone digits, names the reason, never merges', () => {
  it('sorts incoming contacts into new, already saved and already on PoeTech', () => {
    const { rows, summary } = planImport([
      { name: 'New Friend', phones: ['217-555-0199'], emails: [] },
      { name: 'Shay P.', phones: ['+1 217 555 0142'], emails: [] },
      { name: 'Ann', phones: [], emails: ['ANN@example.test'] },
      { name: 'Somebody by phone', phones: ['(563) 650-2416'], emails: [] },
    ], SAVED, MEMBERS);
    expect(rows.map((r) => r.status)).toEqual(['new', 'saved', 'on-poetech', 'on-poetech']);
    expect(rows[1].match).toMatchObject({ by: 'phone', value: '2175550142', who: 'Shay' });
    expect(rows[2].match).toMatchObject({ by: 'email', value: 'ann@example.test', who: 'Sister Ann', userId: 'u-ann' });
    expect(rows[3].match).toMatchObject({ by: 'phone', value: '5636502416', who: 'Door Person' });
    expect(summary).toEqual({ total: 4, new: 1, alreadySaved: 1, onPoetech: 2, duplicatesInFile: 0 });
    expect(summaryLine(summary)).toBe('1 new · 1 already saved · 2 already on PoeTech');
  });

  it('counts the same person twice in one file once, and skips a contact with nothing identifying', () => {
    const { rows, summary } = planImport([
      { name: 'Twice', phones: ['217-555-0100'], emails: [] },
      { name: 'Twice Again', phones: [], emails: ['twice@example.test'] },
      { name: 'Twice (dup by phone)', phones: ['(217) 555-0100'], emails: [] },
      { name: '', phones: [], emails: [] },
    ], [], []);
    expect(rows).toHaveLength(2);
    expect(summary.duplicatesInFile).toBe(1);
    expect(summaryLine(summary)).toBe('2 new · 1 repeated in the file');
  });

  it('a row keeps its own contact; the match carries who and why, nothing is joined', () => {
    const { rows } = planImport([{ name: 'Ann from my phone', phones: ['217-555-0001'], emails: ['ann@example.test'] }], [], MEMBERS);
    expect(rows[0].contact.name).toBe('Ann from my phone');
    expect(rows[0].match.who).toBe('Sister Ann');
    expect(rows[0].key).toBe('e:ann@example.test');
  });

  it('summaryLine says when there is nothing to bring in', () => {
    expect(summaryLine({ total: 0 })).toBe('nothing to bring in');
    expect(importKey({ name: 'Only A Name' })).toBe('n:only a name');
    expect(toSavedContact({ contact: { name: 'A', phones: ['1'], emails: ['a@x.test'] }, status: 'on-poetech' })).toEqual({ name: 'A', phone: '1', email: 'a@x.test', status: 'on-poetech' });
  });
});

describe('contacts-store — the table row, and where the contacts were kept', () => {
  const planned = planImport([{ name: 'Shay', phones: ['217-555-0142'], emails: [], addresses: ['12 Oak St'], org: 'Poe Family', note: 'cousin' }], [], []).rows;

  it('toTableRow carries the owner, the stable key, every field and the hint', () => {
    expect(toTableRow({ ...planned[0], match: { userId: 'u-1' } }, { ownerId: 'me', source: 'picker' })).toEqual({
      owner_id: 'me', contact_key: 'p:2175550142', name: 'Shay', phones: ['217-555-0142'], emails: [], addresses: ['12 Oak St'],
      org: 'Poe Family', note: 'cousin', source: 'picker', matched_user: 'u-1',
    });
    expect(toTableRow(planned[0], { ownerId: 'me', source: 'bogus' }).source).toBe('file');
  });

  function fakeStore() { let v = null; return { getItem: () => v, setItem: (_k, val) => { v = val; } }; }

  it('signed in: upserts on (owner_id, contact_key) and mirrors into the device list', async () => {
    const calls = [];
    const client = {
      auth: { getSession: async () => ({ data: { session: { user: { id: 'me' } } } }) },
      from: (t) => ({ upsert: async (rows, opts) => { calls.push({ t, rows, opts }); return { error: null }; } }),
    };
    const storage = fakeStore();
    const r = await saveImportedContacts(planned, { source: 'file', client, storage, at: '2026-10-01' });
    expect(r).toMatchObject({ kept: 1, where: 'nas+device', error: '' });
    expect(calls).toHaveLength(1);
    expect(calls[0].t).toBe('contacts');
    expect(calls[0].opts).toEqual({ onConflict: 'owner_id,contact_key' });
    expect(calls[0].rows[0]).toMatchObject({ owner_id: 'me', contact_key: 'p:2175550142' });
    expect(JSON.parse(storage.getItem())[0]).toMatchObject({ name: 'Shay', phone: '217-555-0142', addedAt: '2026-10-01' });
  });

  it('signed out (demo included): nothing goes to the table, the device keeps them, and the reason is said', async () => {
    let wrote = 0;
    const client = { auth: { getSession: async () => ({ data: { session: null } }) }, from: () => ({ upsert: async () => { wrote += 1; return { error: null }; } }) };
    const storage = fakeStore();
    const r = await saveImportedContacts(planned, { client, storage, at: '2026-10-01' });
    expect(wrote).toBe(0);
    expect(r.where).toBe('device');
    expect(r.reason).toMatch(/Not signed in/);
    expect(JSON.parse(storage.getItem())).toHaveLength(1);
  });

  it('a server error is reported, not swallowed, and the device still has them', async () => {
    const client = { auth: { getSession: async () => ({ data: { session: { user: { id: 'me' } } } }) }, from: () => ({ upsert: async () => ({ error: { message: 'permission denied for table contacts' } }) }) };
    const r = await saveImportedContacts(planned, { client, storage: fakeStore(), at: '2026-10-01' });
    expect(r.where).toBe('device');
    expect(r.error).toMatch(/permission denied/);
  });
});
