// =============================================================================
// A READ IS FILED WITH ITS VERSION, AND A FILE NEVER ERASES WHAT IT DID NOT
// SAY (DR-1255)
// =============================================================================
// The learner's record (learner_lesson_records, DR-0754) is one row per
// lesson. Measured in lib/learner-records-sync.js before this change: every
// write carried EVERY column, so a mark-read sent `quiz_pct: null` over an
// exam the learner had passed, and an exam sent `completed_at: null` over a
// read. Now a write names only what it was told, the row carries the versions
// read, and a reading files its versions without ever unmarking the lesson.
// =============================================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { rowToRecord, recordToRow, cleanVersionsRead } from '../lib/learner-records.js';
import { saveLearnerRecord, fetchLearnerRecords } from '../lib/learner-records-sync.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const ME = 'b0000000-0000-4000-a000-000000000250';

function fakeClient({ rows = [] } = {}) {
  const calls = { upserts: [], select: '' };
  const client = {
    auth: { getSession: () => Promise.resolve({ data: { session: { user: { id: ME } } } }) },
    from: vi.fn(() => ({
      upsert: vi.fn((payload, opts) => { calls.upserts.push({ payload, opts }); return Promise.resolve({ error: null }); }),
      select: vi.fn((cols) => { calls.select = cols; return { order: () => ({ limit: () => Promise.resolve({ data: rows, error: null }) }) }; }),
    })),
  };
  return { client, calls };
}

describe('the row carries the versions read', () => {
  it('reads them back, known ids only, in the picker order, each once', () => {
    expect(rowToRecord({ lesson_id: 'L1', versions_read: ['adult', 'child', 'adult', 'grown-up'] }).versionsRead).toEqual(['child', 'adult']);
    expect(rowToRecord({ lesson_id: 'L1' }).versionsRead).toEqual([]);
    expect(cleanVersionsRead(null)).toEqual([]);
  });
  it('writes them only when named — a row that says nothing leaves the wall its union', () => {
    expect(recordToRow({ lessonId: 'L1', versionsRead: ['senior', 'teen'] }).versions_read).toEqual(['teen', 'senior']);
    expect('versions_read' in recordToRow({ lessonId: 'L1' })).toBe(false);
  });
  it('the fetch asks for the column', async () => {
    const { client, calls } = fakeClient({ rows: [{ user_id: ME, lesson_id: 'L1', completed_at: '2026-10-20T00:00:00.000Z', versions_read: ['adult'] }] });
    const { records } = await fetchLearnerRecords({ client });
    expect(calls.select).toContain('versions_read');
    expect(records[0].versionsRead).toEqual(['adult']);
  });
});

describe('a write names only what it was told (proven-to-catch)', () => {
  it('a mark-read with its versions carries no exam columns, so a passed exam is not erased', async () => {
    const { client, calls } = fakeClient();
    await saveLearnerRecord({ lessonId: 'L1', courseKey: 'c', completedAt: '2026-10-20T00:00:00.000Z', versionsRead: ['adult'] }, { client });
    const [{ payload }] = calls.upserts;
    expect(payload).toMatchObject({ lesson_id: 'L1', course_key: 'c', completed_at: '2026-10-20T00:00:00.000Z', versions_read: ['adult'] });
    for (const col of ['quiz_pct', 'quiz_passed', 'quiz_attempts', 'quiz_at']) expect(col in payload, col).toBe(false);
  });
  it('an exam carries no completed_at, so a read is not erased; an unmark still sends null on purpose', async () => {
    const { client, calls } = fakeClient();
    await saveLearnerRecord({ lessonId: 'L1', quiz: { pct: 80, passed: true, at: '2026-10-20T00:00:00.000Z', attempts: 1 } }, { client });
    expect('completed_at' in calls.upserts[0].payload).toBe(false);
    expect(calls.upserts[0].payload.quiz_pct).toBe(80);
    await saveLearnerRecord({ lessonId: 'L1', completedAt: null }, { client });
    expect(calls.upserts[1].payload.completed_at).toBeNull();
  });
});

describe('the hook files a reading without ever unmarking', () => {
  const saved = [];
  let host, root, api, store;
  beforeEach(async () => {
    saved.length = 0;
    vi.doMock('../lib/learner-records-sync.js', () => ({
      saveLearnerRecord: (rec) => { saved.push(rec); return Promise.resolve({ saved: true }); },
      subscribeLearnerRecords: () => () => {},
    }));
    const { useLearnerRecords } = await import('../lib/use-learner-records.js');
    store = { classProgress: {}, classQuiz: {} };
    const setData = (fn) => { store = typeof fn === 'function' ? fn(store) : fn; };
    function Probe() { api = useLearnerRecords({ authSession: { user: { id: ME, email: 'me@test.local' } }, demo: false, ageBand: 'adult', setData }); return null; }
    host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
    act(() => { root.render(createElement(Probe)); });
  });
  afterEach(() => { act(() => root.unmount()); host.remove(); vi.doUnmock('../lib/learner-records-sync.js'); });

  it('a reading marks the lesson once and files its versions; a second reading of another version files, never unmarks', () => {
    act(() => { api.toggleClassModule('L1', 'c', { versionsRead: ['adult'] }); });
    const at = store.classProgress.L1;
    expect(at).toBeTruthy();
    expect(saved[0]).toMatchObject({ lessonId: 'L1', courseKey: 'c', completedAt: at, versionsRead: ['adult'] });
    act(() => { api.toggleClassModule('L1', 'c', { versionsRead: ['child', 'adult'] }); });
    expect(store.classProgress.L1, 'still marked, the same moment').toBe(at);
    expect(saved[1]).toMatchObject({ completedAt: at, versionsRead: ['child', 'adult'] });
    // The tap still toggles.
    act(() => { api.toggleClassModule('L1', 'c'); });
    expect(store.classProgress.L1).toBeUndefined();
    expect(saved[2]).toMatchObject({ completedAt: null });
    expect('versionsRead' in saved[2]).toBe(false);
  });
});
