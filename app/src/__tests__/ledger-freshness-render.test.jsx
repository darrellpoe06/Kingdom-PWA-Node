// @vitest-environment jsdom
// DR-0708 — Books -> Imported says when this screen last heard the family
// database. Unknown reads as unknown (never fresh); a stamp reads fresh, then
// stale as it ages; a failed read reads as failed.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import LedgerFreshness from '../components/LedgerFreshness.jsx';
import { markSynced, markSyncFailed, __resetSyncFreshness } from '../lib/sync-freshness.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
beforeEach(() => { __resetSyncFreshness(); container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const line = () => container.querySelector('[data-testid="ledger-freshness"]');

describe('LedgerFreshness', () => {
  it('with no read yet it says not confirmed, never fresh', async () => {
    await act(async () => { root.render(createElement(LedgerFreshness, { table: 'transactions' })); });
    expect(line().getAttribute('data-state')).toBe('unknown');
    expect(line().textContent).toMatch(/Not yet confirmed with the family database/);
  });

  it('a full read turns it fresh with the row count; an old one reads stale; a failed read reads failed', async () => {
    await act(async () => { root.render(createElement(LedgerFreshness, { table: 'transactions' })); });
    await act(async () => { markSynced('transactions', { rows: 3405 }); });
    expect(line().getAttribute('data-state')).toBe('fresh');
    expect(line().textContent).toMatch(/3,405 rows/);
    await act(async () => { markSynced('transactions', { rows: 3405, at: Date.now() - 60 * 60 * 1000 }); });
    expect(line().getAttribute('data-state')).toBe('stale');
    expect(line().textContent).toMatch(/Sync now/);
    await act(async () => { markSyncFailed('transactions', 'read-failed'); });
    expect(line().getAttribute('data-state')).toBe('failed');
  });

  it('Sync now with no live ledger on this device says to sign in, not that it synced', async () => {
    await act(async () => { root.render(createElement(LedgerFreshness, { table: 'transactions' })); });
    const btn = [...container.querySelectorAll('button')].find((b) => /sync now/i.test(b.textContent));
    await act(async () => { btn.click(); });
    await act(async () => {});
    expect(line().textContent).toMatch(/Sign in on this device/);
  });
});
