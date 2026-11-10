// =============================================================================
// The reading on evidence, and how each exam attempt was taken, reach the
// record on the NAS (0316, DR-1396)
// =============================================================================
// Darrell 2026-11-10: "Storage on the nas?!!!!!!! What are we waiting for?!!!!!!"
// The live database is the NAS (infra/nas-supabase/REPOINT-ARMED). The wall is
// proven in infra/supabase/tests/0250-learner-records-smoke.sql (section 11);
// this gate proves the app sends, reads and survives a deploy that lands
// before the migration.
// =============================================================================
import { describe, it, expect, vi } from 'vitest';
import { cleanTaken, recordToRow, rowToRecord, cleanQuizHistory } from '../lib/learner-records.js';
import { saveLearnerRecord, fetchLearnerRecords } from '../lib/learner-records-sync.js';
import { testIntegrityKpis } from '../lib/test-integrity.js';

const ME = 'b0000000-0000-4000-a000-000000000250';
const TAKEN = { reading: 'before', readPct: 0, secsPerQuestion: 0.43, rushed: true, firstTry: true, eyesWpm: null, evil: 'x' };

function client({ upsertErrors = [], selectError = null, rows = [] } = {}) {
  const calls = { upserts: [], selects: [] };
  const chain = {
    select: vi.fn((cols) => {
      calls.selects.push(cols);
      return chain;
    }),
    order: vi.fn(() => chain),
    limit: vi.fn(() => Promise.resolve(calls.selects.length === 1 && selectError ? { data: null, error: selectError } : { data: rows, error: null })),
    upsert: vi.fn((payload) => {
      calls.upserts.push({ ...payload });
      return Promise.resolve({ error: upsertErrors[calls.upserts.length - 1] || null });
    }),
  };
  return { calls, auth: { getSession: () => Promise.resolve({ data: { session: { user: { id: ME } } } }) }, from: vi.fn(() => chain) };
}

describe('the app keeps exactly what the wall keeps', () => {
  it('cleans how an attempt was taken to the known keys, types and ranges', () => {
    expect(cleanTaken(TAKEN)).toEqual({ reading: 'before', readPct: 0, secsPerQuestion: 0.4, rushed: true, firstTry: true });
    expect(cleanTaken({ reading: 'sideways', readPct: 400, eyesWpm: 99999 })).toEqual({ readPct: 100, eyesWpm: 5000 });
    expect(cleanTaken(['x'])).toBe(null);
    expect(cleanTaken({})).toBe(null);
  });

  it('writes the evidence only when named, and reads it back', () => {
    const row = recordToRow({ lessonId: 'L1', readEvidenceAt: '2026-11-10T09:20:00.000Z', quizTaken: TAKEN });
    expect(row.read_evidence_at).toBe('2026-11-10T09:20:00.000Z');
    expect(row.quiz_taken).toEqual(cleanTaken(TAKEN));
    const bare = recordToRow({ lessonId: 'L1' });
    expect('read_evidence_at' in bare).toBe(false);
    expect('quiz_taken' in bare).toBe(false);
    const back = rowToRecord({ user_id: ME, lesson_id: 'L1', read_evidence_at: '2026-11-10T09:20:00Z', quiz_taken: { reading: 'after', rushed: false } });
    expect(back.readEvidenceAt).toBe('2026-11-10T09:20:00.000Z');
    expect(back.quizTaken).toEqual({ reading: 'after', rushed: false });
    expect(cleanQuizHistory([{ at: '2026-11-10T09:00:00Z', pct: 100, passed: true, taken: TAKEN }])[0].taken).toEqual(cleanTaken(TAKEN));
  });

  it('an exam attempt sends how it was taken with it', async () => {
    const c = client();
    await saveLearnerRecord({ lessonId: 'L1', quiz: { pct: 100, passed: true, at: '2026-11-10T09:00:00.000Z', attempts: 1, taken: TAKEN } }, { client: c });
    expect(c.calls.upserts[0].quiz_taken).toEqual(cleanTaken(TAKEN));
  });

  it('a deploy that lands before 0316 loses nothing: the write is sent again without the new columns', async () => {
    const c = client({
      upsertErrors: [{ code: 'PGRST204', message: "Could not find the 'quiz_taken' column of 'learner_lesson_records' in the schema cache" }],
    });
    const res = await saveLearnerRecord(
      {
        lessonId: 'L1',
        completedAt: '2026-11-10T09:20:00.000Z',
        readEvidenceAt: '2026-11-10T09:20:00.000Z',
        quiz: { pct: 90, passed: true, at: '2026-11-10T09:30:00.000Z', attempts: 2, taken: TAKEN },
      },
      { client: c }
    );
    expect(res.saved).toBe(true);
    expect(c.calls.upserts).toHaveLength(2);
    expect(c.calls.upserts[1]).not.toHaveProperty('quiz_taken');
    expect(c.calls.upserts[1]).not.toHaveProperty('read_evidence_at');
    expect(c.calls.upserts[1]).toMatchObject({ quiz_pct: 90, completed_at: '2026-11-10T09:20:00.000Z' });
  });

  it('PROVEN TO CATCH: any other refusal is not retried', async () => {
    const c = client({ upsertErrors: [{ code: '42501', message: 'permission denied' }] });
    const res = await saveLearnerRecord({ lessonId: 'L1', quiz: { pct: 90, at: '2026-11-10T09:30:00.000Z', taken: TAKEN } }, { client: c });
    expect(res.error).toBeTruthy();
    expect(c.calls.upserts).toHaveLength(1);
  });

  it('the read asks for the evidence, and a backend without it still returns the record', async () => {
    const row = { user_id: ME, lesson_id: 'L1', quiz_pct: 100 };
    const c = client({ selectError: { code: '42703', message: 'column learner_lesson_records.read_evidence_at does not exist' }, rows: [row] });
    const { records, error } = await fetchLearnerRecords({ client: c });
    expect(error).toBeUndefined();
    expect(c.calls.selects[0]).toContain('read_evidence_at');
    expect(c.calls.selects[1]).not.toContain('read_evidence_at');
    expect(c.calls.selects[1]).toContain('quiz_history');
    expect(records[0].quizPct).toBe(100);
  });
});

describe('the class record reads the stored evidence', () => {
  it('an attempt’s own account of the reading wins over the moments, and the evidenced reading is used', () => {
    const k = testIntegrityKpis([
      // Marked Done at 9:00 but read on evidence only at 9:40; a pass at 9:30 came before the reading.
      {
        lessonId: 'a',
        completedAt: '2026-11-10T09:00:00Z',
        readEvidenceAt: '2026-11-10T09:40:00Z',
        quizHistory: [{ at: '2026-11-10T09:30:00Z', pct: 100, passed: true }],
      },
      // The attempt says it was taken after reading.
      { lessonId: 'b', quizHistory: [{ at: '2026-11-10T09:30:00Z', pct: 100, passed: true, taken: { reading: 'after', rushed: false } }] },
      {
        lessonId: 'c',
        completedAt: '2026-11-10T08:00:00Z',
        quizHistory: [{ at: '2026-11-10T09:00:00Z', pct: 50, passed: false, taken: { reading: 'before', rushed: true } }],
      },
    ]);
    expect(k.passedBeforeReading).toBe(1);
    expect(k.afterReading).toBe(1);
    expect(k.understood).toBe(1);
    expect(k.rushed).toBe(1);
  });
});
