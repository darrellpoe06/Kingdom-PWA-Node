// @vitest-environment node
// =============================================================================
// a-record-is-one-persons — what a person read is theirs and nobody else's
// (DR-1577)
// =============================================================================
// Darrell, 2026-11-19, looking at his wife's record: 143 lessons read, 91 exams
// passed, 140 of them "Not placed in a course". "My wife doesn't read
// lessons... what or where does these numbers come from?" and "It should be
// based on the users... It's her record!"
//
// Traced: the device maps of what was read (classProgress) and how each exam
// went (classQuiz) lived in the app's data object, which rides the household
// snapshot (one row per household). So one member's reading landed on every
// member's device, and the record catch-up (DR-1450) filed whatever a device
// held under whoever was signed in, with no course, which is the 140. The
// Governor's device had a second road in: it merged EVERY learner's rows into
// its own maps.
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

vi.mock('../lib/supabase.js', () => ({ default: { auth: { getSession: async () => ({ data: { session: null } }) } } }));
const { buildSnapshotPayload, withoutDevicePrefs, PERSONAL_RECORD_KEYS, DEVICE_PREF_KEYS } = await import('../lib/snapshot-sync.js');
const { deviceFactsMissingFromRecord, deviceStateForAccount, mergeRecordsIntoState } = await import('../lib/learner-records.js');

const HIS = 'user-his';
const HERS = 'user-hers';
// What he read, as his device holds it and as the old snapshot carried it to hers.
const hisProgress = { 'll1-a': '2026-11-01T10:00:00.000Z', 'll2-b': '2026-11-02T10:00:00.000Z', 'll3-c': '2026-11-03T10:00:00.000Z' };
const hisQuiz = { 'll1-a': { pct: 100, passed: true, at: '2026-11-01T10:05:00.000Z', attempts: 1 } };

describe('a person’s reading never rides the household snapshot', () => {
  it('is never pushed, and the household’s shared data still is', () => {
    const payload = buildSnapshotPayload({
      data: { classProgress: hisProgress, classQuiz: hisQuiz, classMine: { [HIS]: { 'll1-a': true } }, classOwner: HIS, budget: { rent: 1 } },
    });
    for (const k of PERSONAL_RECORD_KEYS) expect(payload.data[k], k).toBeUndefined();
    expect(payload.data.budget).toEqual({ rent: 1 });
    expect(PERSONAL_RECORD_KEYS).toEqual(['classProgress', 'classQuiz', 'classMine', 'classOwner']);
    // The earlier rule is untouched.
    expect(DEVICE_PREF_KEYS).toEqual(['learnAgeBand', 'learnLevel']);
  });

  it('an older snapshot that still carries his reading does not land it on her device', () => {
    const hers = { classProgress: {}, classQuiz: {}, budget: { rent: 1 } };
    const incoming = { classProgress: hisProgress, classQuiz: hisQuiz, budget: { rent: 2 } };
    const next = { ...hers, ...withoutDevicePrefs(incoming) };
    expect(next.classProgress).toEqual({});
    expect(next.classQuiz).toEqual({});
    expect(next.budget).toEqual({ rent: 2 });
  });

  it('PROVEN TO CATCH: the plain merge is how his reading reached her device', () => {
    const naive = { classProgress: {}, ...{ classProgress: hisProgress } };
    expect(Object.keys(naive.classProgress)).toHaveLength(3);
  });
});

describe('the catch-up files only what this account did on this device', () => {
  it('PROVEN TO CATCH: without the rule, his three lessons are filed under her, with no course', () => {
    const old = deviceFactsMissingFromRecord({ records: [], userId: HERS, progress: hisProgress, quizState: hisQuiz });
    expect(old.map((m) => m.lessonId)).toEqual(['ll1-a', 'll2-b', 'll3-c']);
    expect(old.every((m) => m.courseKey === null)).toBe(true);
  });

  it('with the rule and nothing of her own done here, nothing is filed', () => {
    const got = deviceFactsMissingFromRecord({ records: [], userId: HERS, progress: hisProgress, quizState: hisQuiz, madeHere: {} });
    expect(got).toEqual([]);
  });

  it('what she did here herself is still filed, so a save lost to a stall is not lost for good (DR-1450 kept)', () => {
    const progress = { ...hisProgress, 'll9-hers': '2026-11-18T09:00:00.000Z' };
    const got = deviceFactsMissingFromRecord({ records: [], userId: HERS, progress, quizState: hisQuiz, madeHere: { 'll9-hers': true } });
    expect(got.map((m) => m.lessonId)).toEqual(['ll9-hers']);
  });
});

describe('the device holds one person’s record', () => {
  const rows = [
    { userId: HIS, lessonId: 'll1-a', completedAt: hisProgress['ll1-a'], quizAt: null },
    { userId: HERS, lessonId: 'll9-hers', completedAt: '2026-11-18T09:00:00.000Z', quizAt: null },
  ];

  it('rebuilt for her, it keeps her own rows and what she did here, and drops what it was carrying from him', () => {
    const state = deviceStateForAccount({
      records: rows,
      userId: HERS,
      progress: { ...hisProgress, 'll7-unsaved': '2026-11-18T08:00:00.000Z' },
      quizState: hisQuiz,
      madeHere: { 'll7-unsaved': true },
    });
    expect(Object.keys(state.progress).sort()).toEqual(['ll7-unsaved', 'll9-hers']);
    expect(state.quizState).toEqual({});
  });

  it('the device copy still wins on a lesson her own rows already name', () => {
    const state = deviceStateForAccount({
      records: rows,
      userId: HERS,
      progress: { 'll9-hers': '2026-11-17T07:00:00.000Z' },
      quizState: {},
      madeHere: {},
    });
    expect(state.progress['ll9-hers']).toBe('2026-11-17T07:00:00.000Z');
  });

  it('PROVEN TO CATCH: merging every row the Governor may read puts another learner’s lesson in his own maps', () => {
    const naive = mergeRecordsIntoState(rows, { progress: {}, quizState: {} });
    expect(Object.keys(naive.progress).sort()).toEqual(['ll1-a', 'll9-hers']);
    const his = deviceStateForAccount({ records: rows, userId: HIS, progress: {}, quizState: {}, madeHere: {} });
    expect(Object.keys(his.progress)).toEqual(['ll1-a']);
  });

  it('the hook passes only this account’s rows and its own made-here set', () => {
    const src = readFileSync(join(__dirname, '..', 'lib', 'use-learner-records.js'), 'utf8');
    expect(src).toMatch(/madeHere: \(uid0 && \(d0\.classMine \|\| \{\}\)\[uid0\]\) \|\| \{\}/);
    expect(src).toMatch(/const own = \(records \|\| \[\]\)\.filter\(\(r\) => r && uid && r\.userId === uid\)/);
    expect(src).toMatch(/mergeRecordsIntoState\(own,/);
    expect(src).not.toMatch(/mergeRecordsIntoState\(records \|\| \[\]/);
    expect(src).toMatch(/d\.classOwner !== uid/);
  });
});
