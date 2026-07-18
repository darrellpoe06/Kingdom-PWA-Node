// @vitest-environment node
//
// upload-retry — the reliability fix for Christina's books (2026-07-18). A burst
// of INSERTs (reset-and-re-import fires hundreds) used to silently drop any row
// that hit a transient error, because table-sync.upload had no retry. These pin:
// transient failures are retried until they land; permanent failures (unique/RLS)
// stop immediately (so a re-import can't double-write); the driver never throws.
import { describe, it, expect } from 'vitest';
import { classifyUploadError, backoffMs, withUploadRetry } from '../lib/upload-retry.js';

const noSleep = () => Promise.resolve();

describe('classifyUploadError', () => {
  it('marks unique/RLS/validation errors PERMANENT (a retry cannot fix them)', () => {
    expect(classifyUploadError({ code: '23505' })).toBe('permanent'); // duplicate key
    expect(classifyUploadError({ code: '42501' })).toBe('permanent'); // RLS
    expect(classifyUploadError({ message: 'duplicate key value violates unique constraint' })).toBe('permanent');
    expect(classifyUploadError({ message: 'new row violates row-level security policy' })).toBe('permanent');
  });
  it('marks rate-limit / network / timeout TRANSIENT (worth a retry)', () => {
    expect(classifyUploadError({ code: '429' })).toBe('transient');
    expect(classifyUploadError({ code: '503' })).toBe('transient');
    expect(classifyUploadError({ message: 'network timeout' })).toBe('transient');
    expect(classifyUploadError(null)).toBe('transient');
  });
});

describe('backoffMs', () => {
  it('grows and caps', () => {
    expect(backoffMs(0)).toBe(250);
    expect(backoffMs(1)).toBe(500);
    expect(backoffMs(2)).toBe(1000);
    expect(backoffMs(10)).toBe(2000); // capped
  });
});

describe('withUploadRetry', () => {
  it('returns immediately on first success (no wasted retries)', async () => {
    let calls = 0;
    const res = await withUploadRetry(() => { calls += 1; return { data: { id: 'x' }, error: null }; }, { sleep: noSleep });
    expect(res.data.id).toBe('x');
    expect(calls).toBe(1);
  });
  it('RETRIES a transient failure and then lands the row (no silent drop)', async () => {
    let calls = 0;
    const res = await withUploadRetry(() => {
      calls += 1;
      if (calls < 3) return { error: { code: '429' } };   // rate-limited twice
      return { data: { id: 'ok' }, error: null };           // then succeeds
    }, { retries: 3, sleep: noSleep });
    expect(res.data.id).toBe('ok');
    expect(calls).toBe(3); // proved it kept trying instead of dropping the row
  });
  it('STOPS immediately on a permanent error (no double-write on a unique conflict)', async () => {
    let calls = 0;
    const res = await withUploadRetry(() => { calls += 1; return { error: { code: '23505' } }; }, { retries: 3, sleep: noSleep });
    expect(res.error.code).toBe('23505');
    expect(calls).toBe(1); // did NOT retry a unique_violation
  });
  it('gives up after `retries` transient attempts and returns the failure (never throws)', async () => {
    let calls = 0;
    const res = await withUploadRetry(() => { calls += 1; return { error: { code: '503' } }; }, { retries: 2, sleep: noSleep });
    expect(res.error.code).toBe('503');
    expect(calls).toBe(3); // initial + 2 retries
  });
  it('treats a THROWN insert as a transient error (caught, retried, never propagates)', async () => {
    let calls = 0;
    const res = await withUploadRetry(() => { calls += 1; if (calls === 1) throw new Error('socket hang up'); return { data: { id: 'y' }, error: null }; }, { sleep: noSleep });
    expect(res.data.id).toBe('y');
    expect(calls).toBe(2);
  });
});
