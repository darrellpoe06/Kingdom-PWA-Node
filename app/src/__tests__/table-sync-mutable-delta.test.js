// @vitest-environment node
// =============================================================================
// table-sync mutableDelta — the ledger refreshes by watermark, never by re-download
// =============================================================================
// DR-0305 fixed record_events with appendOnly and deliberately did NOT touch
// transactions: rows there update and delete, so an append-only delta is
// unsound. Measured before this mode: 2,953 rows / 3.4 MB, re-downloaded WHOLE
// on every one of 17,374 lifetime writes.
//
// The design (Gemini-reviewed, then corrected by measurement — updated_at
// already existed with 1,978 NULLs; deletes already live in record_events, so
// no soft-delete column):
//   * upserts:   rows where updated_at > watermark (0136 trigger keeps it true)
//   * deletes:   record_events record_id (the LOCAL id, measured) since watermark
//   * consumer:  ALWAYS handed the FULL list from the controller's cache —
//                a partial list to a replace-style consumer loses history.
//
// Two failure classes matter as much as the savings, and both are proven here:
// a failed delta must fall back to the full read (never read as "no changes"),
// and a deleted row must never resurrect.
import { vi, describe, it, expect, beforeEach } from 'vitest';

let queries = [];
let rowsByCall = [];
let callIndex = 0;

function builder(table) {
  const q = { table, filters: [], _range: null };
  const chain = {
    select() { return chain; },
    eq(col, val) { q.filters.push(['eq', col, val]); return chain; },
    gt(col, val) { q.filters.push(['gt', col, val]); return chain; },
    order() { return chain; },
    range(from, to) {
      q._range = [from, to];
      queries.push(q);
      const res = rowsByCall[callIndex] ?? [];
      callIndex += 1;
      if (res && res.__error) return Promise.resolve({ data: null, error: res.__error });
      return Promise.resolve({ data: res, error: null });
    },
  };
  return chain;
}

let realtimeHandler = null;

vi.mock('../lib/supabase.js', () => ({
  default: {
    from: vi.fn((t) => builder(t)),
    rpc: vi.fn(async () => ({ data: 'inst-test', error: null })),
    auth: { getSession: vi.fn(async () => ({ data: { session: { user: { id: 'u-1' } } } })) },
    channel: vi.fn(() => {
      const ch = {
        on: vi.fn((_evt, _cfg, handler) => { realtimeHandler = handler; return ch; }),
        subscribe: vi.fn(() => ch),
      };
      return ch;
    }),
    removeChannel: vi.fn(),
  },
}));

import { createTableSync } from '../lib/table-sync.js';

// A ledger row: id + updated_at are what the mode runs on.
const tx = (id, updatedAt, amount = 1) => ({
  id, slug: id, updated_at: updatedAt, created_at: updatedAt, instance_id: 'inst-test', amount,
});

function makeSync() {
  return createTableSync({
    localKey: 'transactions',
    remoteTable: 'transactions',
    toRow: (x) => x,
    fromRow: (r) => ({ id: r.slug, amount: r.amount, updatedAt: r.updated_at }),
    mutableDelta: true,
    eventsKind: 'transaction',
  });
}

const flush = () => new Promise((r) => setTimeout(r, 450)); // past the 400ms debounce

beforeEach(() => {
  queries = [];
  rowsByCall = [];
  callIndex = 0;
  realtimeHandler = null;
});

describe('the refresh is a DELTA (the 3.4 MB-per-edit class)', () => {
  it('after the initial full load, a realtime change queries gt(updated_at) — not the whole ledger', async () => {
    rowsByCall = [
      [tx('t1', '2026-08-01T00:00:00Z'), tx('t2', '2026-08-02T00:00:00Z')], // initial full
      [tx('t2', '2026-08-03T00:00:00Z', 99)],                              // delta: t2 edited
      [],                                                                   // deletes: none
    ];
    const seen = [];
    makeSync().subscribe((items) => seen.push(items));
    await flush();
    expect(realtimeHandler).toBeTruthy();
    realtimeHandler({});
    await flush();

    const deltaQ = queries.find((q) => q.table === 'transactions' && q.filters.some(([op, col]) => op === 'gt' && col === 'updated_at'));
    expect(deltaQ, 'the refresh must filter gt(updated_at)').toBeTruthy();
    expect(deltaQ.filters).toContainEqual(['gt', 'updated_at', '2026-08-02T00:00:00Z']);

    // The consumer still receives the FULL list, with the edit folded in.
    const last = seen.at(-1);
    expect(last).toHaveLength(2);
    expect(last.find((i) => i.id === 't2').amount).toBe(99);
  });

  it('a deleted row is REMOVED via record_events — and never resurrects', async () => {
    rowsByCall = [
      [tx('t1', '2026-08-01T00:00:00Z'), tx('t2', '2026-08-02T00:00:00Z')],
      [],                                   // no upserts
      [{ record_id: 't1' }],                // record_events: t1 deleted
    ];
    const seen = [];
    makeSync().subscribe((items) => seen.push(items));
    await flush();
    realtimeHandler({});
    await flush();

    const evQ = queries.find((q) => q.table === 'record_events');
    expect(evQ, 'deletes must be read from the audit log').toBeTruthy();
    expect(evQ.filters).toContainEqual(['eq', 'record_kind', 'transaction']);
    expect(evQ.filters).toContainEqual(['eq', 'action', 'delete']);

    const last = seen.at(-1);
    expect(last.map((i) => i.id)).toEqual(['t2']);
  });

  it('a quiet delta (no upserts, no deletes) does not churn the consumer', async () => {
    rowsByCall = [[tx('t1', '2026-08-01T00:00:00Z')], [], []];
    const seen = [];
    makeSync().subscribe((items) => seen.push(items));
    await flush();
    realtimeHandler({});
    await flush();
    expect(seen).toHaveLength(1); // only the initial load
  });
});

describe('cheaper is never less correct (the DR-0076 half)', () => {
  it('PROVEN-TO-CATCH: a FAILED delta falls back to the FULL read — never "no changes"', async () => {
    rowsByCall = [
      [tx('t1', '2026-08-01T00:00:00Z')],   // initial full
      { __error: { message: 'boom' } },     // delta fails
      [],                                   // deletes leg
      [tx('t1', '2026-08-01T00:00:00Z'), tx('t9', '2026-08-05T00:00:00Z')], // fallback full
    ];
    const seen = [];
    makeSync().subscribe((items) => seen.push(items));
    await flush();
    realtimeHandler({});
    await flush();
    const last = seen.at(-1);
    expect(last.map((i) => i.id).sort()).toEqual(['t1', 't9']);
  });

  it('PROVEN-TO-CATCH: a failed DELETES leg also forces the full read (a missed delete must not linger)', async () => {
    rowsByCall = [
      [tx('t1', '2026-08-01T00:00:00Z'), tx('t2', '2026-08-02T00:00:00Z')],
      [],                                   // upserts fine
      { __error: { message: 'boom' } },     // deletes leg fails
      [tx('t2', '2026-08-02T00:00:00Z')],   // fallback full: t1 is gone
    ];
    const seen = [];
    makeSync().subscribe((items) => seen.push(items));
    await flush();
    realtimeHandler({});
    await flush();
    expect(seen.at(-1).map((i) => i.id)).toEqual(['t2']);
  });

  it('before any full load, a refresh is a FULL read (no watermark = no delta)', async () => {
    rowsByCall = [null, [tx('t1', '2026-08-01T00:00:00Z')]];
    // initial fetchAll returns null (first page error) => no watermark; then a
    // realtime change must fetch the whole table, not a delta.
    rowsByCall = [
      { __error: { message: 'first page down' } },
      [tx('t1', '2026-08-01T00:00:00Z')],
    ];
    const seen = [];
    makeSync().subscribe((items) => seen.push(items));
    await flush();
    realtimeHandler({});
    await flush();
    const deltaQs = queries.filter((q) => q.filters.some(([op, col]) => op === 'gt' && col === 'updated_at'));
    expect(deltaQs).toEqual([]);
    expect(seen.at(-1).map((i) => i.id)).toEqual(['t1']);
  });

  it('every read stays tenant-scoped — delta and deletes both carry instance_id', async () => {
    rowsByCall = [
      [tx('t1', '2026-08-01T00:00:00Z')],
      [tx('t1', '2026-08-02T00:00:00Z')],
      [{ record_id: 'none' }],
    ];
    makeSync().subscribe(() => {});
    await flush();
    realtimeHandler({});
    await flush();
    for (const q of queries) {
      expect(q.filters, `${q.table} query missing instance scope`).toContainEqual(['eq', 'instance_id', 'inst-test']);
    }
  });
});

describe('the regression pin (revert the mode, this fails)', () => {
  it('transactions-sync opts in with the measured eventsKind', async () => {
    const src = (await import('node:fs')).readFileSync(
      new URL('../lib/transactions-sync.js', import.meta.url), 'utf8');
    expect(src).toMatch(/mutableDelta:\s*true/);
    expect(src).toMatch(/eventsKind:\s*'transaction'/);
  });

  it('migration 0136 backfills, triggers, indexes, and PROVES', async () => {
    const sql = (await import('node:fs')).readFileSync(
      new URL('../../../infra/supabase/migrations-auto/0136-transactions-updated-at-watermark.sql', import.meta.url), 'utf8');
    expect(sql).toMatch(/SET updated_at = COALESCE\(created_at, now\(\)\)/);
    expect(sql).toMatch(/CREATE TRIGGER transactions_touch_updated_at/);
    expect(sql).toMatch(/BEFORE INSERT OR UPDATE/);
    expect(sql).toMatch(/RAISE EXCEPTION/); // the migration proves itself
    expect(sql).not.toMatch(/is_deleted/);  // no soft deletes — the audit log covers it
  });
});
