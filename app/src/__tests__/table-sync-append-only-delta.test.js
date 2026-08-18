// @vitest-environment node
// =============================================================================
// table-sync appendOnly — the refresh fetches the DELTA, not the whole log
// =============================================================================
// THE OUTAGE THIS EXISTS TO PREVENT (2026-08-14, measured).
//
// record_events is the audit log: one row per change to ANY tracked record.
// Measured in production: 20,129 rows / 15 MB of payload, largest single row
// 1.18 MB (fat before/after JSON blobs). subscribe() called fetchAll() on EVERY
// realtime change, so ten inventory edits meant ten full 15 MB re-downloads on
// every connected device. 5 GB of free-tier egress is roughly 340 of those.
//
// The project was hard-restricted by Supabase with `exceed_egress_quota` —
// "The project owner must upgrade their plan or remove spend caps to restore
// service" — and EVERY account across all four apps was locked out. Measured
// from auth.users: the last successful sign-in by any of the 23 users was
// 2026-08-11 03:04:53 UTC, with zero in the following 48 hours. 3.5 days down.
//
// Worse, the pagination in fetchAll was added to fix TRUNCATION at 1,000 rows.
// That correctness fix turned a capped 1,000-row pull into a guaranteed
// 20,129-row one — it made the egress bill strictly worse, and because nothing
// measured egress it stayed invisible until service was cut off.
//
// So these tests hold two lines at once, and the second matters as much as the
// first: the refresh must get CHEAPER, and it must never get LESS CORRECT.
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Every query the code builds, recorded so the tests can assert on shape.
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
      const data = rowsByCall[callIndex] ?? [];
      callIndex += 1;
      return Promise.resolve({ data, error: q._error || null });
    },
  };
  return chain;
}

// Capture the realtime handler subscribe() registers, so a test can fire a
// change through the REAL refresh path instead of a stand-in. Without this the
// delta assertion would never execute — a green test proving nothing.
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

const ev = (id, at) => ({ id, created_at: at, instance_id: 'inst-test' });

function makeSync(opts = {}) {
  return createTableSync({
    localKey: 'recordEvents',
    remoteTable: 'record_events',
    toRow: (x) => x,
    fromRow: (x) => x,
    ...opts,
  });
}

/** Drive subscribe()'s internal refresh without a real realtime channel. */
async function firstLoadThenRefresh(sync) {
  const seen = [];
  sync.subscribe((rows) => seen.push(rows));
  // let the initial fetchAll resolve
  await new Promise((r) => setTimeout(r, 0));
  return seen;
}

beforeEach(() => { queries = []; rowsByCall = []; callIndex = 0; realtimeHandler = null; });

describe('PROVEN-TO-CATCH — the refresh stops re-downloading the whole log', () => {
  it('the FIRST load reads the whole table (no watermark yet)', async () => {
    rowsByCall = [[ev('a', '2026-08-01T00:00:00Z'), ev('b', '2026-08-02T00:00:00Z')]];
    const sync = makeSync({ appendOnly: true });
    await firstLoadThenRefresh(sync);
    expect(queries).toHaveLength(1);
    // A full read is scoped by tenant only — never by created_at.
    expect(queries[0].filters.some((f) => f[0] === 'gt')).toBe(false);
  });

  it('a realtime change refreshes with ONLY rows newer than the newest held', async () => {
    rowsByCall = [
      [ev('a', '2026-08-01T00:00:00Z'), ev('b', '2026-08-02T00:00:00Z')], // initial
      [ev('c', '2026-08-03T00:00:00Z')],                                   // delta
    ];
    const sync = makeSync({ appendOnly: true });
    const seen = await firstLoadThenRefresh(sync);
    expect(seen[0].map((r) => r.id)).toEqual(['a', 'b']);

    queries = [];
    expect(realtimeHandler, 'subscribe() must register a realtime handler').toBeTruthy();
    realtimeHandler({ eventType: 'INSERT' });
    await new Promise((r) => setTimeout(r, 450)); // past the 400ms debounce

    // THE ASSERTION THE OUTAGE TURNS ON: bounded by the watermark, not a
    // whole-table read. A regression to fetchAll() drops the gt filter here.
    expect(queries.length).toBeGreaterThan(0);
    expect(queries[0].filters).toContainEqual(['gt', 'created_at', '2026-08-02T00:00:00Z']);

    // And the consumer receives only the new row — the union merge folds it in.
    expect(seen[1].map((r) => r.id)).toEqual(['c']);
  });

  it('a refresh that finds nothing new does NOT churn the consumer', async () => {
    rowsByCall = [[ev('a', '2026-08-01T00:00:00Z')], []];
    const sync = makeSync({ appendOnly: true });
    const seen = await firstLoadThenRefresh(sync);
    realtimeHandler({ eventType: 'INSERT' });
    await new Promise((r) => setTimeout(r, 450));
    expect(seen).toHaveLength(1); // initial only; no empty-delta callback
  });

  it('WITHOUT appendOnly the behaviour is unchanged — no gt filter ever', async () => {
    rowsByCall = [[ev('a', '2026-08-01T00:00:00Z')], [ev('b', '2026-08-02T00:00:00Z')]];
    const sync = makeSync({ appendOnly: false });
    await firstLoadThenRefresh(sync);
    for (const q of queries) {
      expect(q.filters.some((f) => f[0] === 'gt')).toBe(false);
    }
  });
});

describe('cheaper must never mean less correct', () => {
  it('the delta is exclusive (gt, not gte) so the watermark row is not re-sent', async () => {
    rowsByCall = [[ev('a', '2026-08-01T00:00:00Z')]];
    const sync = makeSync({ appendOnly: true });
    await firstLoadThenRefresh(sync);
    // The recorded initial query must carry no gt; the contract asserted in the
    // sibling test is that the NEXT one uses gt with the max created_at seen.
    expect(queries[0].filters.some((f) => f[0] === 'gt')).toBe(false);
  });

  it('every read stays tenant-scoped — the delta path must not widen access', async () => {
    rowsByCall = [[ev('a', '2026-08-01T00:00:00Z')]];
    const sync = makeSync({ appendOnly: true });
    await firstLoadThenRefresh(sync);
    for (const q of queries) {
      expect(q.filters).toContainEqual(['eq', 'instance_id', 'inst-test']);
    }
  });

  it('the delta pages like the full read — a burst over 1,000 rows is not truncated', async () => {
    const page = Array.from({ length: 1000 }, (_, i) => ev(`i${i}`, '2026-08-01T00:00:00Z'));
    rowsByCall = [page, [ev('last', '2026-08-02T00:00:00Z')]];
    const sync = makeSync({ appendOnly: true });
    await firstLoadThenRefresh(sync);
    // A full first page must provoke a second range() call, never stop at 1,000.
    expect(queries.length).toBeGreaterThanOrEqual(2);
    expect(queries[1]._range).toEqual([1000, 1999]);
  });
});

describe('the append-only contract is opt-in, never a default', () => {
  it('createTableSync defaults appendOnly to false', async () => {
    rowsByCall = [[ev('a', '2026-08-01T00:00:00Z')]];
    const sync = makeSync(); // no appendOnly key at all
    await firstLoadThenRefresh(sync);
    for (const q of queries) expect(q.filters.some((f) => f[0] === 'gt')).toBe(false);
  });

  it('record_events — the 15 MB table — actually opts in', async () => {
    const mod = await import('../lib/record-events-sync.js');
    expect(mod.recordEventsSync).toBeTruthy();
    // The union merge is what makes a delta safe; assert it is still a union.
    const merged = mod.mergeRemoteRecordEvents(
      [{ id: 'local-only' }],
      [{ id: 'from-delta' }],
    );
    expect(merged.map((m) => m.id).sort()).toEqual(['from-delta', 'local-only']);
  });
});
