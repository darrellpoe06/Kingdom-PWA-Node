// =============================================================================
// legacy-provisions-backfill — a record made on the device reaches the family
// (2026-09-24, the Books → Plan end-to-end review).
// =============================================================================
// Before: the surface subscribed (cloud → device) and uploaded on add, but
// never pushed pending local rows up on mount — an entry made signed out, or
// whose INSERT failed after its retries, stayed on one device for ever.
// Now: initialSync runs on mount with the device's own entries, and the
// merged list it returns is folded in. Signed out it is skipped.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

const sync = vi.hoisted(() => ({ initialSync: vi.fn(), subscribe: vi.fn(() => () => {}), upload: vi.fn(), deleteRow: vi.fn() }));
vi.mock('../lib/family-trust-sync.js', () => ({
  familyTrustSync: sync,
  mergeRemoteTrustRecords: (cur, items) => {
    const seen = new Set(cur.map((e) => e.id));
    return [...cur, ...items.filter((i) => !seen.has(i.id))];
  },
}));

import { LegacyProvisions } from '../components/LegacyProvisions.jsx';
import { saveTrustEntries } from '../lib/family-trust-store.js';

let container = null; let root = null;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(LegacyProvisions)); });
  return { container };
}
async function cleanup() {
  if (root) await act(async () => root.unmount());
  if (container) container.remove();
  root = null; container = null;
}

afterEach(async () => { await cleanup(); sync.initialSync.mockReset(); localStorage.clear(); });

describe('the ledger back-fills on mount', () => {
  it('hands the device’s own entries to initialSync, and folds the merged list back in', async () => {
    saveTrustEntries([{ id: 'ft-local-1', kind: 'production', beneficiary: 'child-one', label: 'made offline' }]);
    sync.initialSync.mockResolvedValue({ merged: [
      { id: 'ft-local-1', kind: 'production', beneficiary: 'child-one', label: 'made offline', remoteUuid: 'u1' },
      { id: 'ft-other-device', kind: 'production', beneficiary: 'child-two', label: 'from her phone', remoteUuid: 'u2' },
    ], uploadFailures: 0 });
    const { container } = await mount();
    await act(async () => {});
    expect(sync.initialSync).toHaveBeenCalledTimes(1);
    expect(sync.initialSync.mock.calls[0][0]).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'ft-local-1' })]));
    // The merged record brings its person onto the roster (the ledger tab holds the label itself).
    expect(container.textContent).toMatch(/child-two/);
  });

  it('signed out, initialSync is skipped and the surface still renders from the device', async () => {
    sync.initialSync.mockResolvedValue({ skipped: 'signed-out' });
    const { container } = await mount();
    await act(async () => {});
    expect(sync.initialSync).toHaveBeenCalledTimes(1);
    expect(container.textContent.length).toBeGreaterThan(0);
  });

  it('a failing initialSync is logged, never thrown into the surface', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    sync.initialSync.mockRejectedValue(new Error('network down'));
    await mount();
    await act(async () => {});
    expect(warn).toHaveBeenCalledWith('[legacy-provisions] initial sync failed:', expect.any(Error));
    warn.mockRestore();
  });
});
