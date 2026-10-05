// @vitest-environment node
// =============================================================================
// learner-records-sync — the record leaves the device (DR-0754)
// =============================================================================
// PROVEN-TO-CATCH: every assertion here fails against the shipped behavior
// before this, where a learner's progress and exam scores lived only in
// `data.classProgress` / `data.classQuiz` on one device and no row was ever
// written. The demo and signed-out assertions catch the other failure mode —
// a sync that writes anyway (demo mode writes nothing, ever).
import { describe, it, expect, vi } from 'vitest';
import {
  saveLearnerRecord, fetchLearnerRecords, subscribeLearnerRecords,
} from '../lib/learner-records-sync.js';

const ME = 'b0000000-0000-4000-a000-000000000250';

function fakeClient({ session = { user: { id: ME } }, rows = [], upsertError = null, selectError = null } = {}) {
  const calls = { upserts: [], selects: 0, channels: [], removed: 0 };
  const builder = () => {
    const chain = {
      select: vi.fn(() => { calls.selects += 1; return chain; }),
      order: vi.fn(() => chain),
      limit: vi.fn(() => Promise.resolve({ data: selectError ? null : rows, error: selectError })),
      upsert: vi.fn((payload, opts) => {
        calls.upserts.push({ payload, opts });
        return Promise.resolve({ error: upsertError });
      }),
    };
    return chain;
  };
  return {
    calls,
    auth: { getSession: vi.fn(() => Promise.resolve({ data: { session } })) },
    from: vi.fn((table) => { calls.table = table; return builder(); }),
    channel: vi.fn((name) => {
      const ch = { name, on: vi.fn(() => ch), subscribe: vi.fn(() => ch) };
      calls.channels.push(ch);
      return ch;
    }),
    removeChannel: vi.fn(() => { calls.removed += 1; }),
  };
}

describe('keeping one lesson’s record', () => {
  it('writes the row to learner_lesson_records, keyed so a second reading corrects it', async () => {
    const client = fakeClient();
    const res = await saveLearnerRecord({
      lessonId: 'L1', courseKey: 'living-lessons', learnerLabel: 'Son', ageBand: 'teen',
      completedAt: '2026-10-01T10:00:00.000Z',
      quiz: { pct: 80, passed: true, at: '2026-10-01T10:05:00.000Z', attempts: 1 },
    }, { client });
    expect(res.saved).toBe(true);
    expect(client.calls.table).toBe('learner_lesson_records');
    const [{ payload, opts }] = client.calls.upserts;
    expect(opts).toEqual({ onConflict: 'user_id,lesson_id' });
    expect(payload).toMatchObject({
      lesson_id: 'L1', course_key: 'living-lessons', age_band: 'teen',
      quiz_pct: 80, quiz_passed: true, quiz_attempts: 1,
    });
    // The owner is never named by the client: the column defaults to auth.uid()
    // and the write wall refuses any other account (DR-0060).
    expect(payload.user_id).toBeUndefined();
  });

  it('demo mode writes NOTHING, ever — proven to catch', async () => {
    const client = fakeClient();
    const res = await saveLearnerRecord({ lessonId: 'L1' }, { client, demo: true });
    expect(res).toEqual({ skipped: 'demo' });
    expect(client.calls.upserts).toEqual([]);
    expect(client.from).not.toHaveBeenCalled();
  });

  it('signed out writes nothing and says so', async () => {
    const client = fakeClient({ session: null });
    const res = await saveLearnerRecord({ lessonId: 'L1' }, { client });
    expect(res).toEqual({ skipped: 'signed-out' });
    expect(client.calls.upserts).toEqual([]);
  });

  it('a record with no lesson is not written', async () => {
    const client = fakeClient();
    expect(await saveLearnerRecord({}, { client })).toEqual({ skipped: 'no-lesson' });
    expect(client.calls.upserts).toEqual([]);
  });

  it('a refused write is reported, never thrown into the read', async () => {
    const client = fakeClient({ upsertError: { message: 'row-level security' } });
    const res = await saveLearnerRecord({ lessonId: 'L1' }, { client });
    expect(res.error).toBeTruthy();
    expect(res.saved).toBeUndefined();
  });

  it('a client that throws costs only the record', async () => {
    const client = fakeClient();
    client.from = () => { throw new Error('socket gone'); };
    const res = await saveLearnerRecord({ lessonId: 'L1' }, { client });
    expect(res.error).toBeInstanceOf(Error);
  });
});

describe('reading the records this account may read', () => {
  it('returns the mapped records — the read wall decided the scope', async () => {
    const client = fakeClient({
      rows: [
        { user_id: ME, lesson_id: 'L1', course_key: 'c', quiz_pct: 90, quiz_passed: true, quiz_attempts: 1, completed_at: '2026-10-01T00:00:00.000Z' },
        { user_id: 'other', lesson_id: 'L1', course_key: 'c', quiz_pct: 40, quiz_passed: false, quiz_attempts: 1 },
      ],
    });
    const { records } = await fetchLearnerRecords({ client });
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({ userId: ME, lessonId: 'L1', quizPct: 90 });
  });

  it('a row with no lesson id is dropped, never shown as a blank learner', async () => {
    const client = fakeClient({ rows: [{ user_id: ME, lesson_id: null }] });
    const { records } = await fetchLearnerRecords({ client });
    expect(records).toEqual([]);
  });

  it('signed out reads nothing and says so', async () => {
    const { records, skipped } = await fetchLearnerRecords({ client: fakeClient({ session: null }) });
    expect(records).toEqual([]);
    expect(skipped).toBe('signed-out');
  });

  it('a failed read is an empty list plus the error, never a throw', async () => {
    const { records, error } = await fetchLearnerRecords({ client: fakeClient({ selectError: { message: 'boom' } }) });
    expect(records).toEqual([]);
    expect(error).toBeTruthy();
  });
});

describe('the record arrives without a reload', () => {
  it('fetches once, listens on the table, and hands the channel back on unsubscribe', async () => {
    const client = fakeClient({ rows: [{ user_id: ME, lesson_id: 'L1' }] });
    const seen = [];
    const stop = subscribeLearnerRecords((recs) => seen.push(recs), { client });
    await new Promise((r) => setTimeout(r, 0));
    expect(seen[0]).toHaveLength(1);
    const ch = client.calls.channels[0];
    expect(ch.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'learner_lesson_records' },
      expect.any(Function),
    );
    stop();
    expect(client.calls.removed).toBe(1);
  });

  it('a client with NO realtime still gets the first read, so the screen is never empty for want of a socket', async () => {
    const client = fakeClient({ rows: [{ user_id: ME, lesson_id: 'L1' }] });
    delete client.channel;
    const seen = [];
    const stop = subscribeLearnerRecords((recs) => seen.push(recs), { client });
    await new Promise((r) => setTimeout(r, 0));
    expect(seen[0]).toHaveLength(1);
    expect(() => stop()).not.toThrow();
  });

  it('nothing is handed to the screen after unsubscribe', async () => {
    const client = fakeClient({ rows: [{ user_id: ME, lesson_id: 'L1' }] });
    const onRecords = vi.fn();
    const stop = subscribeLearnerRecords(onRecords, { client });
    stop();
    await new Promise((r) => setTimeout(r, 0));
    expect(onRecords).not.toHaveBeenCalled();
  });
});
