// @vitest-environment jsdom
// The Vault as a signed-in person meets it (DR-0762) — copy and behavior
// tested together (DR-0691): the gate when signed out; create -> open; a
// record saved is a ciphertext row on the store and a clear row on screen;
// Reveal shows the password; Delete asks and Cancel keeps it; Lock closes;
// the wrong passphrase is refused and the right one opens the same rows;
// an import from a Chrome export lands as records. Every byte that reaches
// the store is checked NOT to contain the password.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { webcrypto } from 'node:crypto';

// An in-memory store with the seam's exact shape. Ciphertext in, ciphertext out.
const fake = { userId: 'user-1', header: null, rows: [], calls: [] };
vi.mock('../lib/vault-store.js', () => ({
  TIMEOUT_MS: 1000,
  currentUserId: async () => fake.userId,
  readCache: () => null,
  writeCache: () => true,
  clearCache: () => {},
  loadHeader: async () => ({ ok: true, header: fake.header }),
  saveHeader: async (_uid, h) => { fake.header = { ...h, createdAt: '2026-10-06T00:00:00Z' }; fake.calls.push(['saveHeader', h]); return { ok: true }; },
  listItems: async () => ({ ok: true, rows: fake.rows.map((r) => ({ ...r })) }),
  upsertItem: async (_uid, row) => { fake.calls.push(['upsertItem', row]); fake.rows = [...fake.rows.filter((r) => r.id !== row.id), { ...row }]; return { ok: true }; },
  deleteItem: async (_uid, id) => { fake.calls.push(['deleteItem', id]); fake.rows = fake.rows.map((r) => (r.id === id ? { ...r, deletedAt: 'now' } : r)); return { ok: true }; },
  mergeRows: (a, b) => { const by = new Map(); for (const r of [...(a || []), ...(b || [])]) by.set(r.id, r); return [...by.values()]; },
}));

import Vault from '../components/Vault.jsx';
import { surfaceById } from '../surfaces.js';
import * as vaultCrypto from '../lib/vault-crypto.js';

const PASS = 'correct horse battery staple';

describe('Vault surface', () => {
  let container; let root;
  beforeEach(() => {
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    if (!globalThis.crypto || !globalThis.crypto.subtle) vi.stubGlobal('crypto', webcrypto);
    fake.userId = 'user-1'; fake.header = null; fake.rows = []; fake.calls = [];
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(async () => {}) }, configurable: true });
    window.confirm = vi.fn(() => true);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

  const flush = async (n = 3) => { for (let i = 0; i < n; i += 1) await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
  const mount = async () => { await act(async () => { root.render(createElement(Vault)); }); await flush(); };
  const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await flush(); };
  const type = async (el, value) => { await act(async () => {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }); };
  const buttons = () => [...container.querySelectorAll('button')];
  const btn = (text) => buttons().find((b) => b.textContent.trim() === text);
  const byLabel = (label) => container.querySelector(`[aria-label="${label}"]`);
  // Deriving a key at 600k rounds takes a moment; wait for the open state.
  const waitFor = async (pred, ms = 15000) => { const t0 = Date.now(); while (!pred()) { if (Date.now() - t0 > ms) throw new Error('timed out waiting'); await flush(1); } };

  it('signed out: the gate says whose the vault is and the way in', async () => {
    fake.userId = null;
    await mount();
    expect(container.textContent).toMatch(/Sign in to open a vault/);
    expect(container.querySelector('input[type="password"]')).toBeNull();
  });

  it('create -> open empty; a saved record reaches the store as ciphertext only and shows in the clear here; Reveal, Delete (Cancel keeps it), Lock', async () => {
    await mount();
    expect(container.textContent).toMatch(/No vault yet/);
    expect(btn('Create my vault').disabled).toBe(true);
    expect(container.textContent).toMatch(/Type the passphrase twice to enable this/);
    await type(byLabel('New passphrase'), PASS);
    await type(byLabel('Repeat passphrase'), PASS);
    expect(btn('Create my vault').disabled).toBe(false);
    await click(btn('Create my vault'));
    await waitFor(() => /Your vault is open and empty/.test(container.textContent));
    expect(fake.header).toBeTruthy();
    expect(fake.header.iterations).toBe(vaultCrypto.KDF_ITERATIONS);
    expect(JSON.stringify(fake.header)).not.toContain(PASS);

    await click(btn('+ Add'));
    await type(byLabel('Name'), 'Bank');
    await type(byLabel('Site URL'), 'https://www.bank.example/login');
    await type(byLabel('Username'), 'darrell');
    await type(byLabel('Password'), 'S3cret-Pass-Word!');
    await click(btn('Save'));
    await waitFor(() => fake.calls.some((c) => c[0] === 'upsertItem'));
    const row = fake.calls.find((c) => c[0] === 'upsertItem')[1];
    expect(row.iv).toBeTruthy(); expect(row.ct).toBeTruthy();
    expect(JSON.stringify(row)).not.toContain('S3cret');
    expect(JSON.stringify(row)).not.toContain('darrell');
    expect(container.textContent).toMatch(/Bank/);
    expect(container.textContent).toMatch(/bank\.example · darrell/);
    expect(container.textContent).not.toContain('S3cret-Pass-Word!');

    await click(btn('Reveal'));
    expect(container.querySelector(`[data-testid="password-${row.id}"]`).textContent).toBe('S3cret-Pass-Word!');
    await click(btn('Copy password'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('S3cret-Pass-Word!');
    expect(container.textContent).toMatch(/clears in 30 s/);

    window.confirm = vi.fn(() => false);
    await click(btn('Delete'));
    expect(container.textContent).toMatch(/Bank/);
    expect(fake.calls.some((c) => c[0] === 'deleteItem')).toBe(false);

    await click(btn('Lock'));
    expect(container.textContent).toMatch(/Locked · 1 record/);
    expect(container.querySelector('[data-testid^="password-"]')).toBeNull();
  }, 60000);

  it('locked: the wrong passphrase is refused; the right one opens the same rows; a row it cannot open is counted honestly', async () => {
    const salt = vaultCrypto.newSalt({ cryptoObj: webcrypto });
    const key = await vaultCrypto.deriveVaultKey(PASS, salt, vaultCrypto.KDF_ITERATIONS_FLOOR, { cryptoObj: webcrypto });
    fake.header = { ...(await vaultCrypto.makeHeader(key, salt, vaultCrypto.KDF_ITERATIONS_FLOOR, { cryptoObj: webcrypto })), createdAt: '2026-10-01T00:00:00Z' };
    const sealed = await vaultCrypto.encryptJson(key, { name: 'Mail', url: 'https://mail.example', username: 'me', password: 'pw' }, { cryptoObj: webcrypto });
    fake.rows = [
      { id: 'r1', iv: sealed.iv, ct: sealed.ct, updatedAt: '2026-10-02T00:00:00Z', deletedAt: null },
      { id: 'r2', iv: sealed.iv, ct: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', updatedAt: '2026-10-02T00:00:00Z', deletedAt: null },
      { id: 'r3', iv: sealed.iv, ct: sealed.ct, updatedAt: '2026-10-03T00:00:00Z', deletedAt: '2026-10-03T00:00:00Z' },
    ];
    await mount();
    expect(container.textContent).toMatch(/Locked · 2 records · created 2026-10-01/);
    await type(byLabel('Passphrase'), 'wrong passphrase entirely');
    await click(btn('Unlock'));
    await waitFor(() => /does not open this vault/.test(container.textContent));
    await type(byLabel('Passphrase'), PASS);
    await click(btn('Unlock'));
    await waitFor(() => /open · 1 record/.test(container.textContent));
    expect(container.textContent).toMatch(/Mail/);
    expect(container.textContent).toMatch(/1 record this passphrase cannot open/);
    expect(container.textContent).not.toMatch(/r3/);
  }, 60000);

  it('imports a Chrome export: preview counts, then records; duplicates are skipped', async () => {
    const salt = vaultCrypto.newSalt({ cryptoObj: webcrypto });
    const key = await vaultCrypto.deriveVaultKey(PASS, salt, vaultCrypto.KDF_ITERATIONS_FLOOR, { cryptoObj: webcrypto });
    fake.header = await vaultCrypto.makeHeader(key, salt, vaultCrypto.KDF_ITERATIONS_FLOOR, { cryptoObj: webcrypto });
    const sealed = await vaultCrypto.encryptJson(key, { name: 'Bank', url: 'https://bank.example', username: 'd', password: 'x' }, { cryptoObj: webcrypto });
    fake.rows = [{ id: 'r1', iv: sealed.iv, ct: sealed.ct, updatedAt: '2026-10-02T00:00:00Z', deletedAt: null }];
    await mount();
    await type(byLabel('Passphrase'), PASS);
    await click(btn('Unlock'));
    await waitFor(() => /open · 1 record/.test(container.textContent));
    await click(btn('Import'));
    const csv = 'name,url,username,password,note\nBank,https://www.bank.example/login,d,dup,\nShop,https://shop.example,me,shop-pw-1234,\n';
    const file = new File([csv], 'Chrome Passwords.csv', { type: 'text/csv' });
    file.text = async () => csv; // jsdom's File lacks text()
    const input = byLabel('Choose the export file');
    await act(async () => {
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await flush();
    expect(container.textContent).toMatch(/Chrome \/ Edge \/ Brave/);
    expect(container.textContent).toMatch(/1 new · 1 already in your vault \(skipped\)/);
    await click(buttons().find((b) => /^Import 1 record$/.test(b.textContent.trim())));
    await waitFor(() => /imported 1/.test(container.textContent));
    expect(container.textContent).toMatch(/delete the export file/);
    expect(container.textContent).toMatch(/Shop/);
    const up = fake.calls.filter((c) => c[0] === 'upsertItem');
    expect(up).toHaveLength(1);
    expect(JSON.stringify(up[0][1])).not.toContain('shop-pw-1234');
  }, 60000);

  it('is registered as a signed-in, locked-when-denied top-level surface', () => {
    const s = surfaceById['vault'];
    expect(s).toBeTruthy();
    expect(s.nav).toBe('top');
    expect(s.view).toBe('vault');
    expect(s.requires).toBe('signed-in');
    expect(s.whenDenied).toBe('lock');
  });
});
