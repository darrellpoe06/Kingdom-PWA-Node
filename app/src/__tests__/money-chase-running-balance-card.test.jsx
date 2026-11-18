// The review card shows every row read from a Chase screenshot with the amount
// taken AND the bank balance printed under it, before anything is added, and
// lists a row whose amount was not clear instead of adding it (Christina
// 2026-11-18: "Show every extracted transaction with its original amount
// before approval").
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import BooksUpload from '../components/BooksUpload.jsx';

vi.mock('../lib/books-intake-cloud.js', () => ({ keepOriginalInCloud: async () => ({ ok: false, reason: 'test' }) }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root = null;
let host = null;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (host) host.remove();
  root = null;
  host = null;
});
async function until(fn, ms = 8000) {
  const t0 = Date.now();
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() - t0 > ms) throw new Error('timed out waiting');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 25));
    });
  }
}

describe('the review card for a Chase history screenshot', () => {
  it('shows each amount with the bank balance after it, and holds back the row whose amount was lost', { timeout: 30000 }, async () => {
    const DATA = {
      accounts: [{ id: 'a-7206', name: 'Chase 7206', fragment: '7206', type: 'checking', entityId: 'e-personal', balance: 0 }],
      entities: [{ id: 'e-personal', name: 'Personal', type: 'personal' }],
      transactions: [],
    };
    const body = [
      'CHASE',
      'TOTAL CHECKING (...7206)',
      'Available balance $2,559.78',
      'as of Nov 17, 2026',
      'Nov 16, 2026',
      'Zelle payment to TLC',
      '$3,941.72',
      '-$75.00',
      'ATM CASH DEPOSIT',
      '$4,497.99',
      'Nov 15, 2026',
      'Transfer from GMR',
      '$8,529.13',
      '$55.00',
      'Cash App from Darrell',
      '$8,474.13',
      '$1,450.00',
    ].join('\n');
    const written = [];
    host = document.createElement('div');
    host.style.width = '360px';
    document.body.appendChild(host);
    root = createRoot(host);
    act(() =>
      root.render(
        createElement(BooksUpload, {
          hint: 'overview',
          data: DATA,
          debts: [],
          commitImportedRows: async (rows) => {
            written.push(...rows);
            return { saved: rows.length };
          },
          addAccount: () => {},
          updateAccount: () => {},
          onClose: () => {},
        })
      )
    );
    const input = await until(() => document.querySelector('[data-testid="books-upload-input"]'));
    const file = {
      name: 'Screenshot_chase.txt',
      type: 'text/plain',
      size: body.length,
      text: async () => body,
      arrayBuffer: async () => new TextEncoder().encode(body).buffer,
    };
    await act(async () => {
      Object.defineProperty(input, 'files', { configurable: true, value: [file] });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const list = await until(() => document.querySelector('[data-testid="intake-snapshot-rows"]'));
    const text = list.textContent;
    expect(text).toContain('Zelle payment to TLC');
    expect(text).toContain('−$75.00');
    expect(text).toContain('Bank balance after: $3,941.72');
    expect(text).toContain('+$55.00');
    expect(text).toContain('Bank balance after: $8,529.13');
    expect(text).toContain('+$1,450.00');
    // No running balance is shown as an amount.
    expect(text).not.toMatch(/\+\$3,941\.72|\+\$8,529\.13|\+\$8,474\.13/);
    // The ATM row lost its amount in this read: listed, not added.
    const unclear = await until(() => document.querySelector('[data-testid="intake-unclear-row"]'));
    expect(unclear.textContent).toContain('ATM CASH DEPOSIT');
    expect(unclear.textContent).toContain('not added: amount unclear');
    expect(unclear.textContent).toContain('$4,497.99');
    expect(written).toEqual([]);
  });

  it('a posted charge that is likely the pending one already in the books is shown unticked, with why', { timeout: 30000 }, async () => {
    const DATA = {
      accounts: [{ id: 'a-7206', name: 'Chase 7206', fragment: '7206', type: 'checking', entityId: 'e-personal', balance: 0 }],
      entities: [{ id: 'e-personal', name: 'Personal', type: 'personal' }],
      transactions: [{ id: 'p1', accountId: 'a-7206', date: '2026-11-17', description: 'CIRCLE K 1234', amount: -40, pending: true }],
    };
    const body = [
      'CHASE',
      'TOTAL CHECKING (...7206)',
      'Available balance $2,519.78',
      'as of Nov 18, 2026',
      'Nov 18, 2026',
      'POS DEBIT CIRCLE K #1234',
      '-$40.00',
    ].join('\n');
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    act(() =>
      root.render(
        createElement(BooksUpload, {
          hint: 'overview',
          data: DATA,
          debts: [],
          commitImportedRows: async () => ({ saved: 0 }),
          addAccount: () => {},
          updateAccount: () => {},
          onClose: () => {},
        })
      )
    );
    const input = await until(() => document.querySelector('[data-testid="books-upload-input"]'));
    const file = {
      name: 'Screenshot_chase2.txt',
      type: 'text/plain',
      size: body.length,
      text: async () => body,
      arrayBuffer: async () => new TextEncoder().encode(body).buffer,
    };
    await act(async () => {
      Object.defineProperty(input, 'files', { configurable: true, value: [file] });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const row = await until(() => document.querySelector('[data-testid="intake-snapshot-row"][data-status="pending-posted"]'));
    expect(row.querySelector('input[type="checkbox"]').checked).toBe(false);
    expect(row.textContent).toContain('Likely the posted copy of the pending CIRCLE K 1234 on 2026-11-17');
    expect(document.querySelector('[data-testid="intake-rows-summary"]').textContent).toMatch(/^0 of 1 row/);
  });
});
