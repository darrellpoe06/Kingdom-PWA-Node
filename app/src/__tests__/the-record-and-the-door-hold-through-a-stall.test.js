// =============================================================================
// The record and the door hold through a stalled sign-in (DR-1449)
// =============================================================================
// Darrell 2026-11-12, inside PoeTech on Learn: "I can't open nor see my
// records?!", then "I'm in PoeTech and it switched me to Love Corner", then
// "I want to use either and only need one... I have access to both", then, a
// minute later, "Back... what happened". One stall explained all of it:
//   * the record read had no ceiling, and one read in flight blocks every later
//     one, so a hung request held "Reading the record now." with none of his
//     lessons until a reload;
//   * Learn's own address is a church route, so the moment his session was not
//     yet back he read as a signed-out visitor on a church link and PoeTech was
//     dressed as the Love Corner.
// Both are pinned here, each proven to catch by the old rule.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchLearnerRecords, subscribeLearnerRecords, getRecordsFreshness } from '../lib/learner-records-sync.js';
import { wearsChurchBrand } from '../lib/access-gate.js';

const never = () => new Promise(() => {});

/** A client whose session read hangs for ever: the stalled road. */
function stalledClient() {
  return {
    auth: { getSession: never },
    from: () => {
      throw new Error('unreachable');
    },
  };
}

/** A client that answers: one row, signed in. */
function answeringClient(calls) {
  const rows = [{ user_id: 'u1', lesson_id: 'l1', course_key: 'c', completed: true, updated_at: '2026-11-12T00:00:00Z' }];
  const chain = {
    select: () => chain,
    order: () => chain,
    limit: () => {
      calls.n += 1;
      return Promise.resolve({ data: rows, error: null });
    },
  };
  return { auth: { getSession: () => Promise.resolve({ data: { session: { user: { id: 'u1' } } } }) }, from: () => chain };
}

afterEach(() => vi.useRealTimers());

describe('a stalled record read is a failed read, said in seconds', () => {
  it('the read gives up at its ceiling with an error, never hangs', async () => {
    vi.useFakeTimers();
    const p = fetchLearnerRecords({ client: stalledClient(), timeoutMs: 12000 });
    await vi.advanceTimersByTimeAsync(12000);
    const res = await p;
    expect(res.records).toEqual([]);
    expect(String(res.error && res.error.message)).toMatch(/did not answer within 12 seconds/);
  });

  it('PROVEN TO CATCH: without the ceiling the same read is still pending long after', async () => {
    vi.useFakeTimers();
    let settled = false;
    fetchLearnerRecords({ client: stalledClient(), timeoutMs: 10 ** 9 }).then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(60000);
    expect(settled).toBe(false);
  });

  it('after a stall the record is tried again by itself and lands', async () => {
    vi.useFakeTimers();
    const calls = { n: 0 };
    let first = true;
    const flaky = answeringClient(calls);
    const client = { ...flaky, auth: { getSession: () => (first ? ((first = false), never()) : flaky.auth.getSession()) } };
    const got = [];
    const stop = subscribeLearnerRecords((r) => got.push(r), { client, timeoutMs: 1000, retryMs: [500], minGapMs: 0 });
    await vi.advanceTimersByTimeAsync(1000);
    expect(getRecordsFreshness().ok).toBe(false);
    await vi.advanceTimersByTimeAsync(600);
    expect(calls.n).toBe(1);
    expect(got.at(-1)).toHaveLength(1);
    expect(getRecordsFreshness().ok).toBe(true);
    stop();
  });

  it('retries are bounded: a road that stays down is not hammered', async () => {
    vi.useFakeTimers();
    let reads = 0;
    const client = {
      auth: {
        getSession: () => {
          reads += 1;
          return never();
        },
      },
      from: () => null,
    };
    const stop = subscribeLearnerRecords(() => {}, { client, timeoutMs: 100, retryMs: [100, 100], minGapMs: 0 });
    await vi.advanceTimersByTimeAsync(5000);
    expect(reads).toBe(3); // the first read and two retries, then it waits for a real event
    stop();
  });
});

describe('a member is never dressed as a stranger while sign-in settles', () => {
  it('a signed-in member, or a device holding a member session, keeps PoeTech on Learn', () => {
    expect(wearsChurchBrand({ signedIn: true, route: true, memberOnDevice: false })).toBe(false);
    expect(wearsChurchBrand({ signedIn: false, route: true, memberOnDevice: true })).toBe(false);
  });

  it('a true stranger on a church link still meets the Love Corner, and the church door always wears it', () => {
    expect(wearsChurchBrand({ signedIn: false, route: true, memberOnDevice: false })).toBe(true);
    expect(wearsChurchBrand({ churchDoorOnly: true, signedIn: true, route: false, memberOnDevice: true })).toBe(true);
  });

  it('PROVEN TO CATCH: the old rule dressed a member as a stranger the moment his session was absent', () => {
    const oldRule = ({ churchDoorOnly = false, signedIn = false, route = false }) => !!churchDoorOnly || (!signedIn && !!route);
    expect(oldRule({ signedIn: false, route: true })).toBe(true);
    expect(wearsChurchBrand({ signedIn: false, route: true, memberOnDevice: true })).toBe(false);
  });

  it('the shell asks the shared rule, so the member check is not bypassed', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const shell = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect(shell).toMatch(/const churchBrand = wearsChurchBrand\(\{/);
  });
});

describe('what this device holds is filed until the record holds it', () => {
  it('names the read and the exam the record lacks, for this learner only, and never a score it already has', async () => {
    const { deviceFactsMissingFromRecord } = await import('../lib/learner-records.js');
    const records = [
      { userId: 'me', lessonId: 'a', completedAt: '2026-11-01T00:00:00.000Z', quizPct: 100 },
      { userId: 'me', lessonId: 'b', completedAt: null, quizPct: null },
      { userId: 'someone-else', lessonId: 'c', completedAt: '2026-11-01T00:00:00.000Z', quizPct: 90 },
    ];
    const progress = { a: '2026-11-01T00:00:00Z', b: '2026-11-02T00:00:00Z', c: '2026-11-03T00:00:00Z' };
    const quizState = { a: { pct: 100, passed: true }, b: { pct: 80, passed: true, attempts: 2 }, c: { pct: 100, passed: true } };
    const got = deviceFactsMissingFromRecord({ records, userId: 'me', progress, quizState, courseOf: (id) => (id === 'b' ? 'course-b' : null) });
    expect(got.map((g) => g.lessonId).sort()).toEqual(['b', 'c']);
    const b = got.find((g) => g.lessonId === 'b');
    expect(b.courseKey).toBe('course-b');
    expect(b.completedAt).toBe('2026-11-02T00:00:00.000Z');
    expect(b.quiz).toMatchObject({ pct: 80, passed: true, attempts: 2 });
    expect(got.find((g) => g.lessonId === 'c').quiz.pct).toBe(100); // another learner's row is not mine
  });

  it('a lesson the device marks read is named while the record lacks it, and dropped once the record holds it', async () => {
    const { deviceFactsMissingFromRecord } = await import('../lib/learner-records.js');
    const progress = { lost: '2026-11-12T13:00:00Z' };
    expect(deviceFactsMissingFromRecord({ records: [], userId: 'me', progress }).map((g) => g.lessonId)).toEqual(['lost']);
    const filed = [{ userId: 'me', lessonId: 'lost', completedAt: '2026-11-12T13:00:00.000Z' }];
    expect(deviceFactsMissingFromRecord({ records: filed, userId: 'me', progress })).toEqual([]);
  });

  it('is bounded per read', async () => {
    const { deviceFactsMissingFromRecord } = await import('../lib/learner-records.js');
    const progress = Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`l${i}`, '2026-11-12T00:00:00Z']));
    expect(deviceFactsMissingFromRecord({ progress })).toHaveLength(25);
  });
});
