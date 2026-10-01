// @vitest-environment jsdom
// =============================================================================
// DR-0708 — two family screens, one ledger (2026-09-30)
// =============================================================================
// Measured on the live NAS database (family-books-probe run 36787773243): the
// poe-family ledger held 3,405 rows, 258 in September. Christina's phone showed
// exactly that. Darrell's desktop showed 3,330 and 183: it had loaded before
// she wrote 75 September rows that day, and `transactions` was not in the NAS
// supabase_realtime publication, so no change event ever reached his screen and
// it kept the picture it loaded with, saying nothing about its age.
//
// Proven here, on a fake database that never sends a realtime event:
//   1. OLD BEHAVIOR FAILS: without a front-of-screen re-read the open screen
//      stays at the smaller ledger (this test fails on the pre-DR-0708 code);
//   2. coming back to the screen re-reads the delta and shows the new rows;
//   3. the freshness stamp is unknown before the first read, fresh after a
//      full read, and 'failed' (never fresh) after a read that did not finish;
//   4. "Sync now" re-reads the whole table.
// =============================================================================
import { vi, describe, it, expect, beforeEach } from 'vitest';

// A tiny database: rows with updated_at; reads honor eq / gt / range.
let db = [];
let failReads = 0;
function builder(table) {
  const q = { table, gt: null };
  const chain = {
    select() { return chain; },
    eq() { return chain; },
    gt(col, val) { q.gt = [col, val]; return chain; },
    order() { return chain; },
    range(from, to) {
      if (failReads > 0) { failReads -= 1; return Promise.resolve({ data: null, error: { message: 'down' } }); }
      if (table === 'record_events') return Promise.resolve({ data: [], error: null });
      let rows = db.slice();
      if (q.gt) rows = rows.filter((r) => r[q.gt[0]] > q.gt[1]);
      rows.sort((a, b) => (a.updated_at < b.updated_at ? -1 : a.updated_at > b.updated_at ? 1 : 0));
      return Promise.resolve({ data: rows.slice(from, to + 1), error: null });
    },
  };
  return chain;
}

vi.mock('../lib/supabase.js', () => ({
  default: {
    from: vi.fn((t) => builder(t)),
    rpc: vi.fn(async () => ({ data: 'poe-family', error: null })),
    auth: { getSession: vi.fn(async () => ({ data: { session: { user: { id: 'darrell' } } } })) },
    // Realtime: a channel that NEVER delivers a change (the NAS publication
    // did not carry the ledger).
    channel: vi.fn(() => { const ch = { on: vi.fn(() => ch), subscribe: vi.fn(() => ch) }; return ch; }),
    removeChannel: vi.fn(),
  },
}));

import { createTableSync } from '../lib/table-sync.js';
import { getSyncStamp, describeFreshness, requestResync, __resetSyncFreshness } from '../lib/sync-freshness.js';

const row = (i, at) => ({ id: `u${i}`, slug: `t${i}`, updated_at: at, created_at: at, instance_id: 'poe-family', txn_date: i < 183 ? '2026-09-10' : '2026-09-30' });
const makeSync = () => createTableSync({
  localKey: 'transactions', remoteTable: 'transactions',
  toRow: (x) => x, fromRow: (r) => ({ id: r.slug, date: r.txn_date }),
  mutableDelta: true, eventsKind: 'transaction',
});
const settle = async () => { for (let i = 0; i < 8; i++) await new Promise((r) => setTimeout(r, 0)); };
const comeBackToTheScreen = async (nowMs) => {
  vi.setSystemTime(nowMs);
  window.dispatchEvent(new Event('focus'));
  await settle();
};

beforeEach(() => {
  __resetSyncFreshness();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(Date.parse('2026-09-30T12:00:00Z'));
  failReads = 0;
  // Darrell's desktop loads: 183 September rows exist.
  db = Array.from({ length: 183 }, (_, i) => row(i, `2026-09-2${i % 9}T00:00:00.000Z`));
});

describe('an open screen does not keep a ledger the household has moved past', () => {
  it('shows Christina\'s 75 new rows when the screen comes back to the front, with no realtime event', async () => {
    const seen = [];
    expect(describeFreshness(getSyncStamp('transactions')).state, 'before any read: unknown, never fresh').toBe('unknown');
    const off = makeSync().subscribe((items) => seen.push(items.length));
    await settle();
    expect(seen.at(-1)).toBe(183);

    // Christina writes 75 September rows. No realtime event reaches this screen.
    for (let i = 183; i < 258; i++) db.push(row(i, `2026-09-30T18:${String(i % 60).padStart(2, '0')}:00.000Z`));

    // An hour later Darrell looks again.
    await comeBackToTheScreen(Date.parse('2026-09-30T13:00:00Z'));
    expect(seen.at(-1), 'the open screen now holds the whole ledger').toBe(258);
    off();
  });

  it('the stamp is fresh after a full read and carries the row count', async () => {
    const off = makeSync().subscribe(() => {});
    await settle();
    expect(describeFreshness(getSyncStamp('transactions')).state).toBe('fresh');
    expect(getSyncStamp('transactions').stamp.rows).toBe(183);
    off();
  });

  it('an old stamp reads as stale, and a read that did not finish reads as failed, never fresh', async () => {
    const off = makeSync().subscribe(() => {});
    await settle();
    const later = Date.parse('2026-09-30T12:40:00Z');
    expect(describeFreshness(getSyncStamp('transactions'), later).state).toBe('stale');
    failReads = 10; // the connection drops: the delta and its full-read fallback both fail
    await comeBackToTheScreen(later);
    const d = describeFreshness(getSyncStamp('transactions'), later);
    expect(d.state).toBe('failed');
    expect(d.text).toMatch(/may be out of date/);
    off();
  });

  it('"Sync now" re-reads the whole table', async () => {
    const seen = [];
    const off = makeSync().subscribe((items) => seen.push(items.length));
    await settle();
    db.push(row(900, '2026-09-30T19:00:00.000Z'));
    expect(await requestResync('transactions')).toBe(true);
    await settle();
    expect(seen.at(-1)).toBe(184);
    off();
    expect(await requestResync('transactions'), 'no live controller after unsubscribe').toBe(false);
  });
});
