// @vitest-environment node
//
// books-accounts-crud — the accounts CRUD peeled from the monolith (DR-0078
// shrink). Characterize-before-change (DR-0076 §5): these tests pin the exact
// behavior the inline originals had — reducer shapes, sync gating, remoteUuid
// stamping, and the manual-balance interception — so the peel is provably a
// move, not a rewrite.
import { describe, it, expect, vi } from 'vitest';
import { createAccountsCrud } from '../lib/books-accounts-crud.js';

const CD = new Date(2026, 0, 31);

// A tiny store: applies functional setData updates to held state like React does.
function makeStore(initial) {
  const box = { state: initial };
  return { box, setData: (fn) => { box.state = fn(box.state); } };
}

function makeSync() {
  return {
    upload: vi.fn(() => Promise.resolve({ uploaded: true, remoteId: 'uuid-1' })),
    updateRow: vi.fn(() => Promise.resolve()),
    deleteRow: vi.fn(() => Promise.resolve()),
  };
}

function crudFor(data, { syncEnabled = false, postTx = () => {}, accountsSync = makeSync() } = {}) {
  const { box, setData } = makeStore(data);
  const crud = createAccountsCrud({ data, setData, syncEnabled, accountsSync, syncWarn: () => {}, postTx, currentDate: CD });
  return { crud, box, accountsSync };
}

describe('addAccount', () => {
  it('seeds id, parses balance, coerces inLegal — and does not touch sync when disabled', () => {
    const sync = makeSync();
    const { crud, box } = crudFor({ accounts: [] }, { accountsSync: sync });
    crud.addAccount({ name: 'Chk', balance: '12.50' });
    const a = box.state.accounts[0];
    expect(a.id).toMatch(/^a-/);
    expect(a.balance).toBe(12.5);
    expect(a.inLegal).toBe(false);
    expect(sync.upload).not.toHaveBeenCalled();
  });
  it('uploads when sync is enabled and stamps remoteUuid on the inserted row', async () => {
    const sync = makeSync();
    const { crud, box } = crudFor({ accounts: [] }, { syncEnabled: true, accountsSync: sync });
    crud.addAccount({ name: 'Chk', balance: 10 });
    expect(sync.upload).toHaveBeenCalledOnce();
    await Promise.resolve();
    expect(box.state.accounts[0].remoteUuid).toBe('uuid-1');
  });
});

describe('updateAccount — the manual-balance interception rides the peel intact', () => {
  it('a ledgered account: the entered balance becomes an adjustment row via postTx, the anchor never moves', () => {
    const posted = [];
    const data = {
      accounts: [{ id: 'chk', type: 'checking', balance: 4350.42, remoteUuid: 'uuid-9' }],
      transactions: [
        { id: 'i1', date: '2026-01-05', accountId: 'chk', amount: 15000 },
        { id: 'i2', date: '2026-01-12', accountId: 'chk', amount: -2397.42 },
      ],
    };
    const sync = makeSync();
    const { crud, box } = crudFor(data, { syncEnabled: true, accountsSync: sync, postTx: (t) => posted.push(t) });
    crud.updateAccount('chk', { balance: 4350.42 });
    expect(posted).toHaveLength(1);
    expect(posted[0].amount).toBe(-12602.58);
    expect(box.state.accounts[0].balance).toBe(4350.42); // anchor untouched
    expect(sync.updateRow).not.toHaveBeenCalled();        // empty patch → no cloud write
  });
  it('a no-ledger account: direct write, synced as a balance patch', () => {
    const sync = makeSync();
    const data = { accounts: [{ id: 'sav', type: 'savings', balance: 100, remoteUuid: 'uuid-2' }], transactions: [] };
    const { crud, box } = crudFor(data, { syncEnabled: true, accountsSync: sync });
    crud.updateAccount('sav', { balance: '900' });
    expect(box.state.accounts[0].balance).toBe(900);
    expect(sync.updateRow).toHaveBeenCalledWith('uuid-2', { balance: 900 });
  });
  it('maps every patched field to its schema column', () => {
    const sync = makeSync();
    const data = { accounts: [{ id: 'a1', balance: 0, remoteUuid: 'u' }], transactions: [] };
    const { crud } = crudFor(data, { syncEnabled: true, accountsSync: sync });
    crud.updateAccount('a1', { name: 'N', institution: 'I', type: 'savings', fragment: '...1', inLegal: true, isPrimary: true, entityId: 'e-x' });
    expect(sync.updateRow).toHaveBeenCalledWith('u', {
      display_name: 'N', institution: 'I', account_type: 'savings', fragment: '...1',
      in_legal: true, is_primary: true, entity_slug: 'e-x',
    });
  });
});

describe('toggleAccountLegal / deleteAccount', () => {
  it('toggle flips inLegal through updateAccount', () => {
    const data = { accounts: [{ id: 'a1', balance: 0, inLegal: false }], transactions: [] };
    const { crud, box } = crudFor(data);
    crud.toggleAccountLegal('a1');
    expect(box.state.accounts[0].inLegal).toBe(true);
  });
  it('delete removes locally and calls deleteRow only for synced rows when enabled', () => {
    const sync = makeSync();
    const data = { accounts: [{ id: 'a1', balance: 0, remoteUuid: 'u1' }, { id: 'a2', balance: 0 }], transactions: [] };
    const { crud, box } = crudFor(data, { syncEnabled: true, accountsSync: sync });
    crud.deleteAccount('a1');
    crud.deleteAccount('a2');
    expect(box.state.accounts).toHaveLength(0);
    expect(sync.deleteRow).toHaveBeenCalledTimes(1);
    expect(sync.deleteRow).toHaveBeenCalledWith('u1');
  });
});
