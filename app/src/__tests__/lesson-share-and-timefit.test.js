// @vitest-environment node
// =============================================================================
// Sharing a lesson, and fitting it to the time a person actually has
// =============================================================================
// Two asks from Darrell, 2026-08-10:
//
//   "can we just share right from the lessons? not have to copy a link... users
//    can but not necessary... share and it will open whatever they usually do."
//
//   "each lesson should be about 25 minutes or combine similar lessons as our
//    Ways and documentation state and demand... do they?" and then, sharpening
//    it: "capable of being scaled down to the most minimal times and full lesson
//    for those that have time all in the Ways!!!"
//
// The second one was a spec-conformance question, and the answer was no. DR-0215
// decided the 25-minute Love Corner session is the design unit and that the
// curriculum ADJUSTS to the allotted time by PACING rather than cutting —
// `reflowArcMinutes` has always been able to do it — but the only control that
// drove it lived inside the facilitator run-of-show behind
// `isGovernor && showFacilitator`, and its lowest preset was 20 minutes. So the
// capability existed and the learner could not reach it, and "the most minimal
// time" did not exist for anyone.
import { describe, it, expect, vi } from 'vitest';
import { canShare, lessonSharePayload, shareLink } from '../lib/lesson-links.js';
import { getTimeFit, recordTimeFit, TIME_FIT_MIN, TIME_FIT_MAX } from '../lib/learn-resume.js';

// A minimal localStorage double — the same shape learn-resume already injects.
const mem = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
};

describe('sharing hands the lesson to whatever they already use', () => {
  it('uses the device share sheet when there is one', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const nav = { share };
    const out = await shareLink({ title: 'T', text: 'X', url: 'https://poetech.us/l' }, nav);
    expect(out).toBe('shared');
    expect(share).toHaveBeenCalledWith({ title: 'T', text: 'X', url: 'https://poetech.us/l' });
  });

  it('THE BUG THIS PREVENTS: backing out of the sheet is not an error', async () => {
    // A cancelled share rejects with AbortError. Treating that as a failure
    // flashes "couldn't share" at someone who simply changed their mind — and
    // then, worse, silently copies to their clipboard behind their back.
    const err = Object.assign(new Error('cancelled'), { name: 'AbortError' });
    const writeText = vi.fn();
    const nav = { share: vi.fn().mockRejectedValue(err), clipboard: { writeText } };
    expect(await shareLink({ url: 'https://poetech.us/l' }, nav)).toBe('dismissed');
    expect(writeText, 'a cancelled share must NOT quietly copy instead').not.toHaveBeenCalled();
  });

  it('falls back to the clipboard where there is no share sheet', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const nav = { clipboard: { writeText } };
    expect(canShare(nav)).toBe(false);
    expect(await shareLink({ url: 'https://poetech.us/l' }, nav)).toBe('copied');
    expect(writeText).toHaveBeenCalledWith('https://poetech.us/l');
  });

  it('a share that fails for a real reason still falls through to copy', async () => {
    const err = Object.assign(new Error('target refused'), { name: 'DataError' });
    const writeText = vi.fn().mockResolvedValue(undefined);
    const nav = { share: vi.fn().mockRejectedValue(err), clipboard: { writeText } };
    expect(await shareLink({ url: 'https://poetech.us/l' }, nav)).toBe('copied');
  });

  it('reports failure honestly when neither path exists — never a fake success', async () => {
    expect(await shareLink({ url: 'https://poetech.us/l' }, {})).toBe('failed');
    expect(await shareLink({ url: 'https://poetech.us/l' }, null)).toBe('failed');
  });

  it('the payload carries the lesson and its link, and never an empty text', () => {
    const p = lessonSharePayload(
      { title: 'Rest', bigIdea: 'He gives His beloved sleep.' },
      { url: 'https://poetech.us/x', courseTitle: 'Healthy Living' },
    );
    expect(p.title).toBe('Rest');
    expect(p.text).toContain('He gives His beloved sleep.');
    expect(p.text).toContain('Healthy Living');
    expect(p.url).toBe('https://poetech.us/x');
    // A module with nothing but a title still shares something sayable.
    expect(lessonSharePayload({ title: 'Only' }, {}).text).toBe('Only');
    expect(lessonSharePayload(null, {}).title).toBeTruthy();
  });
});

describe('the lesson fits the time the person actually has', () => {
  it('remembers a chosen length on this device', () => {
    const storage = mem();
    recordTimeFit(25, { storage });
    expect(getTimeFit({ storage })).toBe(25);
  });

  it('the MINIMAL end is real — five minutes is storable', () => {
    const storage = mem();
    recordTimeFit(TIME_FIT_MIN, { storage });
    expect(getTimeFit({ storage })).toBe(5);
  });

  it('an out-of-range value CLEARS rather than pinning a number nobody chose', () => {
    const storage = mem();
    recordTimeFit(25, { storage });
    recordTimeFit(TIME_FIT_MAX + 1, { storage });
    expect(getTimeFit({ storage })).toBeNull();   // → the course's authored length
    recordTimeFit(1, { storage });
    expect(getTimeFit({ storage })).toBeNull();
  });

  it('unset, corrupt, or storage-less all read as "no choice", never as a length', () => {
    expect(getTimeFit({ storage: mem() })).toBeNull();
    const bad = mem(); bad.setItem('poe-learn-timefit', 'twenty-five');
    expect(getTimeFit({ storage: bad })).toBeNull();
    expect(getTimeFit({ storage: null })).toBeNull();
  });

  it('never throws when storage refuses to write (private mode / quota)', () => {
    const hostile = { getItem: () => { throw new Error('nope'); }, setItem: () => { throw new Error('nope'); }, removeItem: () => { throw new Error('nope'); } };
    expect(() => recordTimeFit(25, { storage: hostile })).not.toThrow();
    expect(getTimeFit({ storage: hostile })).toBeNull();
  });
});

describe('the presets answer the Ways (DR-0215)', () => {
  it('PROVEN-TO-CATCH: 25 — the documented design unit — is offered, and a minimal 5 exists', async () => {
    // The shipped list was [20, 30, 45, 60, 75, 90]: it stepped straight over
    // 25 ("these lessons will be about 25 minutes at the Love Corner") and its
    // floor of 20 meant "the most minimal times" was unreachable.
    const { REFLOW_PRESETS } = await import('../components/LessonFlow.jsx');
    expect(REFLOW_PRESETS).toContain(25);
    expect(Math.min(...REFLOW_PRESETS)).toBe(TIME_FIT_MIN);
    expect(Math.max(...REFLOW_PRESETS)).toBeGreaterThanOrEqual(90); // still a full sitting
    expect([...REFLOW_PRESETS].sort((a, b) => a - b)).toEqual(REFLOW_PRESETS);
  });
});
