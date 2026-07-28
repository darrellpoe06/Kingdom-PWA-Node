// @vitest-environment node
// =============================================================================
// saved-contacts — the returnable address book, proven (Darrell 2026-07-28)
// =============================================================================
// A contact you add is KEPT with a name; the same person never duplicates
// (deterministic key); a later add that supplies an email MERGES into the same
// row (completing access) without losing the name/phone. All over an injected
// fake storage (no browser).
import { describe, it, expect } from 'vitest';
import { contactKey, readContacts, upsertContact, removeContact } from '../lib/saved-contacts.js';

function fakeStore() {
  let v = null;
  return { getItem: () => v, setItem: (_k, val) => { v = val; }, _dump: () => v };
}

describe('contactKey — stable, email > phone > name', () => {
  it('prefers email, then phone digits, then name; empty when nothing identifies', () => {
    expect(contactKey({ email: 'A@X.com', phone: '217', name: 'Al' })).toBe('e:a@x.com');
    expect(contactKey({ phone: '(217) 555-0142', name: 'Al' })).toBe('p:2175550142');
    expect(contactKey({ name: 'Shay' })).toBe('n:shay');
    expect(contactKey({})).toBe('');
  });
});

describe('upsertContact — keeps the name, never duplicates, merges access later', () => {
  it('saves a phone-only contact WITH a name', () => {
    const s = fakeStore();
    upsertContact(s, { name: 'Shay', phone: '563-505-9393', spaceName: 'Poe Family', status: 'texted' }, '2026-07-28');
    const list = readContacts(s);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ name: 'Shay', phone: '563-505-9393', status: 'texted', spaceName: 'Poe Family' });
  });
  it('a later add of the SAME phone with an email MERGES — one row, name kept, email filled', () => {
    const s = fakeStore();
    upsertContact(s, { name: 'Shay', phone: '(563) 505-9393', status: 'texted' }, 't1');
    // same number, now with email → must merge onto the same person (keyed by phone)
    upsertContact(s, { phone: '5635059393', email: 'shay@example.com', status: 'invited' }, 't2');
    const list = readContacts(s);
    expect(list).toHaveLength(1);              // NOT two rows
    expect(list[0].name).toBe('Shay');         // name preserved
    expect(list[0].email).toBe('shay@example.com'); // email added
    expect(list[0].status).toBe('invited');    // status advanced
  });
  it('refuses an empty contact (nothing identifying)', () => {
    const s = fakeStore();
    upsertContact(s, { name: '  ' }, 't');
    expect(readContacts(s)).toHaveLength(0);
  });
  it('distinct people are distinct rows, newest first', () => {
    const s = fakeStore();
    upsertContact(s, { name: 'A', email: 'a@x.com' }, 't1');
    upsertContact(s, { name: 'B', email: 'b@x.com' }, 't2');
    const list = readContacts(s);
    expect(list.map((c) => c.name)).toEqual(['B', 'A']);
  });
});

describe('removeContact', () => {
  it('drops one contact by id and leaves the rest', () => {
    const s = fakeStore();
    upsertContact(s, { name: 'A', email: 'a@x.com' }, 't1');
    upsertContact(s, { name: 'B', email: 'b@x.com' }, 't2');
    removeContact(s, 'e:a@x.com');
    expect(readContacts(s).map((c) => c.name)).toEqual(['B']);
  });
});

describe('readContacts — tolerant of junk', () => {
  it('returns [] on empty or malformed storage', () => {
    const bad = { getItem: () => '{not json', setItem: () => {} };
    expect(readContacts(bad)).toEqual([]);
    const empty = { getItem: () => null, setItem: () => {} };
    expect(readContacts(empty)).toEqual([]);
  });
});
