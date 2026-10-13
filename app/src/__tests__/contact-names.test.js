// @vitest-environment node
// =============================================================================
// contact-names — a number you already know reads as the person you know,
//                 from your own contacts and nobody else's (DR-0825)
// =============================================================================
// The reported case: Platform Signups showed `1<ten digits>@phone.poetech.us`
// and nothing else, while the viewer's phone already knew the name. The index
// is built from the viewer's rows (table shape and device shape); a phone-door
// address is looked up as the phone it is; the account's own name is never
// written over; the loader says where the names came from. Fixture numbers
// are the 555 reserve and the names are made up: the repo is public.
import { describe, it, expect, vi } from 'vitest';

const store = { device: [], table: { ok: true, rows: [], reason: '' } };
vi.mock('../lib/contacts-store.js', () => ({
  cachedContacts: () => store.device,
  loadMyContacts: async () => store.table,
}));

import { buildContactIndex, nameFor, labelFor, countNamed, loadContactIndex, emptyIndex } from '../lib/contact-names.js';

const TABLE = [
  { name: 'Sister Lamb', phones: ['(555) 010-0498'], emails: ['lamb@example.org'] },
  { name: 'Brother Reed', phones: ['+1 555-010-0317'], emails: [] },
  { name: '', phones: ['5550109999'], emails: [] },               // no name: names nothing
];
const DEVICE = [
  { id: 'p:5550100777', name: 'Deacon Oak', phone: '555-010-0777', email: '' },
  { id: 'e:oak@example.org', name: 'Deacon Oak (phone)', phone: '', email: 'OAK@example.org' },
];

describe('buildContactIndex', () => {
  it('indexes both shapes by lowercase email and ten national digits', () => {
    const idx = buildContactIndex([...TABLE, ...DEVICE]);
    expect(idx.size).toBe(4);                                     // the unnamed row is not counted
    expect(idx.byPhone.get('5550100498')).toBe('Sister Lamb');
    expect(idx.byPhone.get('5550100317')).toBe('Brother Reed');  // the leading 1 is dropped
    expect(idx.byPhone.get('5550100777')).toBe('Deacon Oak');
    expect(idx.byEmail.get('oak@example.org')).toBe('Deacon Oak (phone)');
    expect(idx.byPhone.has('5550109999')).toBe(false);
  });
  it('the first row to claim an identifier keeps it (pass the keeper first)', () => {
    const idx = buildContactIndex([
      { name: 'From the server', phones: ['5550100001'] },
      { name: 'From the device', phone: '15550100001' },
    ]);
    expect(idx.byPhone.get('5550100001')).toBe('From the server');
    expect(idx.size).toBe(1);
  });
  it('tolerates junk', () => {
    expect(buildContactIndex(null).size).toBe(0);
    expect(buildContactIndex([null, {}, { name: 'x' }]).size).toBe(0);
  });
});

describe('nameFor', () => {
  const idx = buildContactIndex([...TABLE, ...DEVICE]);
  it('reads a phone-door address as the phone it is: the reported case', () => {
    expect(nameFor(idx, { email: '15550100498@phone.poetech.us' }))
      .toEqual({ name: 'Sister Lamb', by: 'phone', from: 'your contacts' });
  });
  it('matches a real address by email, case-insensitively', () => {
    expect(nameFor(idx, { email: 'Lamb@Example.org' }).name).toBe('Sister Lamb');
    expect(nameFor(idx, { email: 'oak@example.org' }).by).toBe('email');
  });
  it('matches a bare phone by its ten digits', () => {
    expect(nameFor(idx, { phone: '+1 (555) 010-0777' }).name).toBe('Deacon Oak');
  });
  it('never looks a phone-door address up as a mailbox', () => {
    const only = buildContactIndex([{ name: 'Wrong', emails: ['15550100498@phone.poetech.us'] }]);
    expect(nameFor(only, { email: '15550100498@phone.poetech.us' })).toBeNull();
  });
  it('answers null for a stranger and for an empty index', () => {
    expect(nameFor(idx, { email: 'nobody@example.org' })).toBeNull();
    expect(nameFor(emptyIndex(), { email: '15550100498@phone.poetech.us' })).toBeNull();
    expect(nameFor(null, {})).toBeNull();
  });
});

describe('labelFor: the account name first, the contact name beside it, never merged', () => {
  const idx = buildContactIndex(TABLE);
  it('fills the gap when the account has no name', () => {
    expect(labelFor(idx, { ownName: '', email: '15550100498@phone.poetech.us' }))
      .toEqual({ shown: 'Sister Lamb', note: 'from your contacts', by: 'phone' });
  });
  it('keeps the account name and says what the contacts call them when they differ', () => {
    expect(labelFor(idx, { ownName: 'S. Lamb', email: '15550100498@phone.poetech.us' }))
      .toEqual({ shown: 'S. Lamb', note: 'in your contacts as Sister Lamb', by: 'phone' });
  });
  it('says nothing extra when both agree, or when nothing is known', () => {
    expect(labelFor(idx, { ownName: 'sister lamb', email: '15550100498@phone.poetech.us' }).note).toBe('');
    expect(labelFor(idx, { ownName: '', email: 'nobody@example.org' })).toEqual({ shown: '', note: '', by: '' });
  });
});

describe('countNamed', () => {
  it('counts rows the contacts name, through the caller\'s pick', () => {
    const idx = buildContactIndex(TABLE);
    const rows = [
      { email: '15550100498@phone.poetech.us' },
      { email: 'reed@example.org' },
      { email: 'lamb@example.org' },
      null,
    ];
    expect(countNamed(idx, rows, (r) => ({ email: r.email }))).toBe(2);
  });
});

describe('loadContactIndex: the device first, the server as keeper, where it came from said', () => {
  it('merges both and the server outranks the device on the same number', async () => {
    store.device = [{ name: 'Old name on the phone', phone: '5550100498' }, { name: 'Only on the device', phone: '5550100222' }];
    store.table = { ok: true, rows: [{ name: 'Sister Lamb', phones: ['5550100498'], emails: [] }], reason: '' };
    const idx = await loadContactIndex();
    expect(idx.where).toBe('nas+device');
    expect(idx.reason).toBe('');
    expect(idx.byPhone.get('5550100498')).toBe('Sister Lamb');
    expect(idx.byPhone.get('5550100222')).toBe('Only on the device');
  });
  it('falls back to the device with the server\'s reason when the table does not answer', async () => {
    store.device = [{ name: 'Only on the device', phone: '5550100222' }];
    store.table = { ok: false, rows: [], reason: 'relation "contacts" does not exist' };
    const idx = await loadContactIndex();
    expect(idx.where).toBe('device');
    expect(idx.reason).toMatch(/does not exist/);
    expect(idx.byPhone.get('5550100222')).toBe('Only on the device');
  });
  it('is empty, with where none, for a person who brought nothing in', async () => {
    store.device = [];
    store.table = { ok: true, rows: [], reason: '' };
    const idx = await loadContactIndex();
    expect(idx.size).toBe(0);
    expect(idx.where).toBe('nas');
  });
});
