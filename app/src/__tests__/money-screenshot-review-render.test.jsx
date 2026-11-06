// money-screenshot-review-render.test.jsx — the review screen itself, at phone
// width, through Darrell's exact 2026-11-06 sequence: upload the Chase 7206
// screen, answer the day, answer Available, see "Ready to confirm" and the
// Approve button, tap it, and the verified balance reaches the books once.
// (The file is text here so the reader needs no OCR; the screen, the
// questions, the statuses and the write are the real ones.)
// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import BooksUpload from '../components/BooksUpload.jsx';

// The household shelf copy is a network call; the review screen is what is
// under test, so the copy answers "not now" at once (the panel already treats
// that as fine: the original stays on the device).
vi.mock('../lib/books-intake-cloud.js', () => ({ keepOriginalInCloud: async () => ({ ok: false, reason: 'test' }) }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root = null; let host = null;
function mount(el) { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); act(() => root.render(el)); return host; }
async function until(fn, ms = 8000) {
  const t0 = Date.now();
  for (;;) { const v = fn(); if (v) return v; if (Date.now() - t0 > ms) throw new Error('timed out waiting'); await act(async () => { await new Promise((r) => setTimeout(r, 25)); }); }
}
afterEach(() => { if (root) act(() => root.unmount()); if (host) host.remove(); root = null; host = null; });

const SCREEN = ['Chase', 'Chase Personal Checking (...7206)', 'Available balance', '$4,687.18', 'Present balance $5,062.72', 'Transactions', 'Nov 5  Zelle payment to BG & Mom JPM99D23RK9R  -$750.00'].join('\n');
const DATA = {
  accounts: [{ id: 'a-7206', name: 'Chase Personal Checking', fragment: '7206', type: 'checking', entityId: 'e-personal', balance: 0 }, { id: 'a-3322', name: 'Chase 3322', fragment: '3322', type: 'checking', entityId: 'e-poeprops', balance: 0 }],
  entities: [{ id: 'e-personal', name: 'Personal', type: 'personal' }, { id: 'e-poeprops', name: 'Poe Properties LLC', type: 'business' }],
  transactions: [],
};
const buttons = () => [...document.querySelectorAll('button')];
const byText = (re) => buttons().find((b) => re.test(b.textContent));

describe('the review screen on a phone: date, Available, Ready to confirm, Approve', () => {
  it('walks the exact sequence and writes one checkpoint to the existing 7206 account', { timeout: 30000 }, async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 412 });
    const written = [];
    const commitImportedRows = vi.fn(async (rows) => { written.push(...rows); return { saved: rows.length }; });
    const addAccount = vi.fn();
    mount(<BooksUpload hint="overview" data={DATA} debts={[]} commitImportedRows={commitImportedRows} addAccount={addAccount} updateAccount={vi.fn()} onClose={() => {}} />);
    const c = document;
    const input = await until(() => document.querySelector('[data-testid="books-upload-input"]'));
    // jsdom's File has no text(); the panel only ever calls name/type/size/text/arrayBuffer.
    const file = { name: 'Screenshot_20261106_Chase.txt', type: 'text/plain', size: SCREEN.length, text: async () => SCREEN, arrayBuffer: async () => new TextEncoder().encode(SCREEN).buffer };
    await act(async () => {
      Object.defineProperty(input, 'files', { configurable: true, value: [file] });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    // the card appears as "Received" first; wait until the read has named the kind
    const card = await until(() => { const k = c.querySelector('[data-testid="intake-doc"]'); return k && /Kind/.test(k.textContent) && k; });
    expect(card.textContent).toMatch(/Banking app screenshot/);
    expect(card.textContent).toMatch(/Needs your answer/);
    // 1. the day
    await until(() => byText(/What day was this screenshot taken/) || [...document.querySelectorAll('p')].some((p) => /What day was this screenshot taken/.test(p.textContent)));
    const dayBtn = await until(() => byText(/the day it was uploaded/));
    await act(async () => { dayBtn.click(); });
    await until(() => !byText(/the day it was uploaded/));
    // the date question is gone, the balance question is still there
    expect([...document.querySelectorAll('p')].some((p) => /two balances/.test(p.textContent))).toBe(true);
    // 2. Available
    const availBtn = await until(() => byText(/^Available \$4687\.18$/));
    await act(async () => { availBtn.click(); });
    await until(() => !byText(/^Available \$4687\.18$/));
    // 3. Ready to confirm, with the verified balance named, and the Approve button
    await until(() => /Ready to confirm/.test(c.querySelector('[data-testid="intake-doc"]').textContent));
    expect(c.querySelector('[data-testid="intake-snapshot-checkpoint"]').textContent).toMatch(/\$4,687\.18 as of 2026-11-06 \(available\)/);
    expect(c.querySelector('[data-testid="intake-doc"]').textContent).toMatch(/Chase Personal Checking/);
    const approve = await until(() => byText(/^Approve: verified balance \+ 1 new row$/));
    expect(approve.disabled).toBe(false);
    // 4. Approve
    await act(async () => { approve.click(); });
    await until(() => /Added/.test(c.querySelector('[data-testid="intake-doc"]').textContent) && byText(/Approve:/) === undefined);
    expect(addAccount).not.toHaveBeenCalled();
    const cps = written.filter((r) => r.category === 'balance-checkpoint');
    expect(cps).toHaveLength(1);
    expect(cps[0]).toMatchObject({ accountId: 'a-7206', date: '2026-11-06' });
    expect(cps[0].reconciliation).toMatchObject({ balance: 4687.18, basis: 'available' });
    expect(written.filter((r) => r.category !== 'balance-checkpoint')).toHaveLength(1);
    expect(c.querySelector('[data-testid="intake-doc"]').textContent).toMatch(/Bank-verified balance \$4,687\.18 recorded as of 2026-11-06/);
  });
});
