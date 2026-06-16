// Choir write-path reproduction for the 2026-06-16 incident: Choir -> Schedule /
// Sermons / links could not save. The verified root cause was a DATABASE grant
// (the `authenticated` role had no table privilege on choir_schedule, so every
// insert 403'd with Postgres code 42501 BEFORE RLS ran). The durable fix +
// recurrence gate is migration 0024 + scripts/grant-guard.mjs (grant-guard.test.js).
//
// This locks the CLIENT contract around that failure so it can't silently
// regress: saveService returns { saved:true } when the insert succeeds (the
// fixed state) and surfaces { skipped:'insert-error' } when the DB rejects it
// (the broken state — exactly the 42501 the user hit). Same for saveSermon.
//
// supabase + church-instance are mocked so this is a pure unit test (no network).
import { vi, describe, it, expect, beforeEach } from 'vitest';

// A chainable query stub: `await from(t).insert(row)` resolves to `result`
// (via then), and `from(t).insert(row).select('id').single()` resolves to it too.
let nextResult = { error: null, data: { id: 'new-id' } };
const insertSpy = vi.fn();
function makeQuery() {
  const q = {
    insert: vi.fn((row) => { insertSpy(row); return q; }),
    update: vi.fn(() => q),
    delete: vi.fn(() => q),
    select: vi.fn(() => q),
    single: vi.fn(() => Promise.resolve(nextResult)),
    eq: vi.fn(() => Promise.resolve(nextResult)),
    then: (onF, onR) => Promise.resolve(nextResult).then(onF, onR),
  };
  return q;
}

vi.mock('../lib/supabase.js', () => ({
  default: {
    from: vi.fn(() => makeQuery()),
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: { user: { id: 'user-1', email: 'director@example.com' } } },
      })),
    },
  },
}));
vi.mock('../lib/church-instance.js', () => ({
  churchInstanceId: vi.fn(async () => 'instance-1'),
}));

import { saveService, saveSermon } from '../lib/choir-sync.js';

beforeEach(() => {
  insertSpy.mockClear();
  nextResult = { error: null, data: { id: 'new-id' } };
});

describe('saveService (Choir -> Schedule "Add date") — the incident surface', () => {
  it('SUCCESS (fixed state): a clean insert returns { saved:true }', async () => {
    nextResult = { error: null, data: { id: 'sched-1' } };
    const res = await saveService({ serviceDate: '2026-06-21', serviceType: 'sunday', title: 'Morning Worship' });
    expect(res).toEqual({ saved: true });
  });

  it('sends an instance-scoped, attributed insert row (RLS needs instance_id + created_by)', async () => {
    await saveService({ serviceDate: '2026-06-21', serviceType: 'sunday', title: 'Morning Worship' });
    expect(insertSpy).toHaveBeenCalledTimes(1);
    expect(insertSpy.mock.calls[0][0]).toMatchObject({
      service_date: '2026-06-21',
      service_type: 'sunday',
      title: 'Morning Worship',
      instance_id: 'instance-1',
      created_by: 'user-1',
    });
  });

  it('BROKEN state (the bug): a 42501 grant denial surfaces as { skipped:"insert-error" }', async () => {
    // This is the exact Postgres error the real signed-in owner hit before the
    // grant fix: "permission denied for table choir_schedule" (code 42501).
    nextResult = { error: { code: '42501', message: 'permission denied for table choir_schedule' }, data: null };
    const res = await saveService({ serviceDate: '2026-06-21', serviceType: 'sunday', title: 'Morning Worship' });
    expect(res.skipped).toBe('insert-error');
    expect(res.error.code).toBe('42501');
  });

  it('still short-circuits cleanly when there is no church to write to', async () => {
    const { churchInstanceId } = await import('../lib/church-instance.js');
    churchInstanceId.mockResolvedValueOnce(null);
    const res = await saveService({ serviceDate: '2026-06-21', serviceType: 'sunday', title: 'x' });
    expect(res).toEqual({ skipped: 'no-church' });
  });
});

describe('saveSermon (Choir -> Sermons) — same grant-gated insert path', () => {
  it('SUCCESS returns { saved:true, id } from the inserted row', async () => {
    nextResult = { error: null, data: { id: 'sermon-9' } };
    const res = await saveSermon({ title: 'Let Go and Let God', serviceType: 'sunday' });
    expect(res).toEqual({ saved: true, id: 'sermon-9' });
  });

  it('a 42501 grant denial surfaces as { skipped:"insert-error" }', async () => {
    nextResult = { error: { code: '42501', message: 'permission denied for table choir_sermons' }, data: null };
    const res = await saveSermon({ title: 'Let Go and Let God', serviceType: 'sunday' });
    expect(res.skipped).toBe('insert-error');
  });
});
