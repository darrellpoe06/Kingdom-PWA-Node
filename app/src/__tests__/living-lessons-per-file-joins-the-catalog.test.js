// @vitest-environment node
// =============================================================================
// A per-file lesson joins the catalog, in order, on its OWN day (DR-1468)
// =============================================================================
// The directory is empty until the first lesson lands, so the integration is
// proven here with two lessons standing in for files: the catalog must append
// them after its own, in ORDER, and withAdded must read each file's ADDED
// BEFORE living-lessons-dates.js — the stand-in carries a different day in
// both places on purpose, so reading them in the wrong order turns this red.
import { describe, it, expect, vi } from 'vitest';

vi.mock('../lib/living-lessons-per-file.js', () => {
  const a = { id: 'll990-stand-in-a', title: 'A' };
  const b = { id: 'll991-stand-in-b', title: 'B' };
  return {
    PER_FILE_CATALOG: [a, b],
    PER_FILE_ADDED: { 'll990-stand-in-a': '2026-11-13', 'll991-stand-in-b': '2026-11-14' },
  };
});
vi.mock('../lib/living-lessons-dates.js', async (importOriginal) => {
  const real = await importOriginal();
  // The older record of the same lesson, which the file's own day must outrank.
  return { ...real, LIVING_LESSONS_ADDED: { ...real.LIVING_LESSONS_ADDED, 'll990-stand-in-a': '2020-01-01' } };
});

const { LIVING_LESSONS_MODULES, buildLivingLessonsSchedule } = await import('../lib/living-lessons-class.js');

describe('the catalog with two per-file lessons in it', () => {
  it('appends them after its own lessons, in ORDER', () => {
    expect(LIVING_LESSONS_MODULES.slice(-2).map((m) => m.id)).toEqual(['ll990-stand-in-a', 'll991-stand-in-b']);
    expect(LIVING_LESSONS_MODULES.filter((m) => /^ll99[01]-stand-in-/.test(m.id)).length).toBe(2);
  });

  it('dates each by its own file first — never by the older record', () => {
    const sched = buildLivingLessonsSchedule();
    expect(sched.find((m) => m.id === 'll990-stand-in-a').added).toBe('2026-11-13');
    expect(sched.find((m) => m.id === 'll991-stand-in-b').added).toBe('2026-11-14');
  });
});
