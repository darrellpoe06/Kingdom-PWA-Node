// DR-0687 — every lesson in every course carries the real day it was created.
//
// Darrell 2026-09-30, verbatim, looking at Learn -> "Latest lessons, every
// course": "Add all the days the lessons were created so we can have all of
// them in each course so they can get done."
//
// The days are GENERATED (scripts/derive-lesson-dates.mjs) from git: the UTC
// author day of the earliest commit that added the line defining the lesson.
// This file pins the generated file on the REAL mounted catalog, and proves the
// rule's judge catches a planted wrong day, a wrong commit, and a lesson with no
// day. The full re-derivation from history runs in CI (the guards job checks out
// full history and runs `npm run lesson-dates:check`), because a shallow clone
// cannot see first commits.
import { describe, it, expect } from 'vitest';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { buildEternalProcessingCourses } from '../lib/eternal-algorithms-course.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { buildLivingLessonsSchedule } from '../lib/living-lessons-class.js';
import DATES from '../lib/lesson-dates.json';
import { lessonCreatedDay, datedSchedule, withLessonDates, undatedReason } from '../lib/lesson-dates.js';
import { datesFollowNumbers, orderLessons } from '../lib/lesson-order.js';
import { latestCountLine } from '../lib/learn-organize.js';
import {
  createScanner, gitDayFor, judgeEntry, buildDatesFile, RECORDED_ELSEWHERE, SQUASH_GRACE_DAYS,
} from '../../../scripts/lesson-dates-core.mjs';

// The same catalog the generator reads: every registered course's own schedule
// rows, plus the Eternal Algorithms courses — built WITHOUT the dates attached.
const RAW = [
  ...LEARN_CATALOG.map((e) => ({ key: e.key, ids: e.buildScheduleRows().map((m) => m.id) })),
  ...buildEternalProcessingCourses().map((c) => ({ key: c.key, ids: c.schedule.map((m) => m.id) })),
];
const ISO = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** Every mounted lesson with no day — the gate a new lesson meets at birth. */
function lessonsWithoutDays(catalog, dates = DATES, recorded = LIVING_LESSONS_ADDED) {
  const out = [];
  for (const c of catalog) {
    for (const id of c.ids) {
      const day = RECORDED_ELSEWHERE[c.key] ? recorded[id] : (dates.courses[c.key] && dates.courses[c.key][id] && dates.courses[c.key][id][0]);
      if (!ISO.test(day || '') && !dates.undated[`${c.key}/${id}`]) out.push(`${c.key}/${id}`);
    }
  }
  return out;
}
const FIX = 'a lesson with no day: run `cd app && npm run lesson-dates` after committing it, then commit app/src/lib/lesson-dates.json';

describe('the generated days, on the real catalog', () => {
  it('MEASURED 2026-09-30: 748 lessons in 50 courses, every one dated, none untraced', () => {
    const total = RAW.reduce((t, c) => t + c.ids.length, 0);
    expect(RAW.length).toBeGreaterThanOrEqual(50);
    expect(total).toBeGreaterThanOrEqual(748);
    const inFile = Object.values(DATES.courses).reduce((t, rows) => t + Object.keys(rows).length, 0);
    const recorded = RAW.filter((c) => RECORDED_ELSEWHERE[c.key]).reduce((t, c) => t + c.ids.filter((id) => ISO.test(LIVING_LESSONS_ADDED[id] || '')).length, 0);
    expect(inFile + recorded).toBe(total);
    expect(DATES.undated).toEqual({});
  });

  it('every mounted lesson has a day (or a recorded reason) — a new lesson cannot join without one', () => {
    expect(lessonsWithoutDays(RAW), FIX).toEqual([]);
  });

  it('proven-to-catch: a planted new lesson with no day fails the same check', () => {
    const planted = RAW.map((c) => (c.key === 'banking' ? { ...c, ids: [...c.ids, 'bank99-a-lesson-not-yet-dated'] } : c));
    expect(lessonsWithoutDays(planted)).toEqual(['banking/bank99-a-lesson-not-yet-dated']);
    // and one in the hand-recorded course, too
    const ll = RAW.map((c) => (c.key === 'living-lessons' ? { ...c, ids: [...c.ids, 'll999-planted'] } : c));
    expect(lessonsWithoutDays(ll)).toEqual(['living-lessons/ll999-planted']);
  });

  it('the file names no lesson that is not mounted, and its counts are its own rows', () => {
    const mounted = new Set(RAW.flatMap((c) => c.ids.map((id) => `${c.key}/${id}`)));
    const stale = Object.entries(DATES.courses).flatMap(([k, rows]) => Object.keys(rows).map((id) => `${k}/${id}`)).filter((x) => !mounted.has(x));
    expect(stale).toEqual([]);
    for (const c of RAW) {
      if (RECORDED_ELSEWHERE[c.key]) continue;
      expect(Object.keys(DATES.courses[c.key] || {}).length, c.key).toBe(c.ids.length);
    }
  });

  it('every day is a real ISO day with its commit, inside the life of the repository', () => {
    for (const rows of Object.values(DATES.courses)) {
      for (const [day, sha] of Object.values(rows)) {
        expect(ISO.test(day)).toBe(true);
        expect(sha).toMatch(/^[0-9a-f]{8}$/);
        expect(day >= '2026-04-27').toBe(true); // the repository's first commit
        expect(day <= new Date().toISOString().slice(0, 10)).toBe(true);
      }
    }
  });

  it('pins known first commits (spot-checked with `git show`)', () => {
    expect(DATES.courses['who-he-is']['whohe1-all-of-them-the-rule-the-line-and-the-edge']).toEqual(['2026-09-29', '2a308544']);
    // Derived lessons take the later of record and builder: the Eternal Algorithms
    // builder landed 2026-07-08 (dcb2d376), Healthy Living's 2026-08-10 (3c72a1f8).
    expect(DATES.courses['eternal-torah']['ea-gh-choose-life']).toEqual(['2026-07-08', 'dcb2d376']);
    expect(Object.values(DATES.courses['healthy-living']).every(([d, s]) => d === '2026-08-10' && s === '3c72a1f8')).toBe(true);
  });

  it('Living Lessons keeps its own recorded days — never written into the generated file', () => {
    // Measured 2026-09-30 (DR-0687): git's first-commit day differs from the
    // recorded day on five lessons (L164, L189, L193, L194, L195), each recorded
    // one day EARLIER; the script prints them on every run and the recorded day
    // is kept (it is the day the course itself noted, or the lesson's own branch day).
    expect(DATES.courses['living-lessons']).toBeUndefined();
    const sched = buildLivingLessonsSchedule();
    expect(sched.every((m) => m.added === LIVING_LESSONS_ADDED[m.id])).toBe(true);
    expect(withLessonDates([{ key: 'living-lessons', schedule: sched }])[0].schedule).toBe(sched);
  });
});

describe('attaching the days', () => {
  it('fills `added` from the file, keeps a day already present, and never reads the cohort `date`', () => {
    const id = 'bank1-a-deposit-is-not-storage';
    expect(lessonCreatedDay('banking', id)).toBe(DATES.courses.banking[id][0]);
    const [a, b, c] = datedSchedule('banking', [
      { id, date: '2031-01-05' },
      { id, added: '2026-01-02' },
      { id: 'not-a-lesson', date: '2026-10-01' },
    ]);
    expect(a.added).toBe(DATES.courses.banking[id][0]);
    expect(b.added).toBe('2026-01-02');
    expect(c.added).toBeUndefined();
    expect(lessonCreatedDay('banking', 'nope')).toBe(null);
    expect(undatedReason('banking', id)).toBe(null);
  });

  it('withLessonDates returns an untouched course as the same object', () => {
    const c = { key: 'x-none', schedule: [{ id: 'q' }] };
    expect(withLessonDates([c])[0]).toBe(c);
    const d = { meta: { key: 'banking' }, schedule: [{ id: 'bank1-a-deposit-is-not-storage' }] };
    expect(withLessonDates([d])[0].schedule[0].added).toMatch(ISO);
  });
});

describe('"By number" is "oldest first" only where the days never go backwards', () => {
  it('true on Living Lessons; false when a later-numbered lesson is older (proven-to-catch)', () => {
    const ll = buildLivingLessonsSchedule();
    expect(datesFollowNumbers(ll)).toBe(true);
    const byNum = orderLessons(ll, 'number');
    const swapped = byNum.map((m, i) => (i === 5 ? { ...m, added: '2026-01-01' } : m));
    expect(datesFollowNumbers(swapped)).toBe(false);
    expect(datesFollowNumbers(ll.map((m, i) => (i === 3 ? { ...m, added: null } : m)))).toBe(false);
  });
});

describe('the Latest lessons header says the true count', () => {
  it('all listed, or how many are not and why', () => {
    const rows = [{}, {}, {}];
    expect(latestCountLine({ rows, undatedLessons: [], courseCount: 2 })).toBe('All 3 lessons across 2 courses, each on the day it was first added to the app.');
    const reason = (k) => (k === 'traced-not' ? 'no commit ever added it' : null);
    expect(latestCountLine({ rows, undatedLessons: [{ courseKey: 'fresh', lessonId: 'a' }, { courseKey: 'traced-not', lessonId: 'b' }], courseCount: 2 }, reason))
      .toBe('3 lessons across 2 courses, each on the day it was first added to the app · 2 not listed: 1 too new to have its day recorded yet, 1 whose first day the record cannot trace.');
  });
});

describe('the rule itself (scripts/lesson-dates-core.mjs)', () => {
  // A tiny synthetic history, oldest commit last as `git log` prints it.
  const LOG = [
    '\u0001cccccccc00000000 1790000000', // 2026-09-21
    '+++ b/app/src/lib/bank-course.js',
    "+    id: 'bank1-first',",
    '+++ b/app/src/lib/godhead-study.js',
    "+    id: 'gh-late', section: 'torah',",
    '\u0001bbbbbbbb00000000 1780000000', // 2026-05-28
    '+++ b/app/src/__tests__/x.test.js',
    "+    id: 'bank2-only-in-a-test',",
    '+++ b/app/src/lib/eternal-algorithms-course.js',
    '+    id: `ea-${alg.id}`,',
    '+++ b/app/src/lib/who-he-is-course.js',
    "+  'whohe1-keyed': { sits: [] },",
    '\u0001aaaaaaaa00000000 1779000000', // 2026-05-17
    '+++ b/app/src/lib/bank-course.js',
    '+    "id": "bank1-first",',
    '+++ b/app/src/lib/godhead-study.js',
    "+    id: 'gh-early', section: 'torah',",
  ];
  const scanOf = (lines) => { const s = createScanner(); lines.forEach((l) => s.line(l)); return s.result(); };
  const scan = scanOf(LOG);

  it('the earliest commit that defined the id wins, in either quoting; test files are not definitions', () => {
    expect(gitDayFor('bank1-first', scan)).toMatchObject({ date: '2026-05-17', sha: 'aaaaaaaa' });
    expect(gitDayFor('bank2-only-in-a-test', scan).reason).toMatch(/no commit ever added/);
    expect(gitDayFor('whohe1-keyed', scan)).toMatchObject({ date: '2026-05-28', sha: 'bbbbbbbb' });
  });

  it('a derived lesson takes the LATER of its record and its builder', () => {
    expect(gitDayFor('ea-gh-early', scan)).toMatchObject({ date: '2026-05-28', sha: 'bbbbbbbb' }); // builder later
    expect(gitDayFor('ea-gh-late', scan)).toMatchObject({ date: '2026-09-21', sha: 'cccccccc' }); // record later
    expect(gitDayFor('ea-gh-missing', scan).reason).toMatch(/never defined in app\/src\/lib\/godhead-study.js/);
  });

  it('judgeEntry: exact on a commit in history; a planted wrong day or commit is caught', () => {
    const git = { date: '2026-05-17', sha: 'aaaaaaaa' };
    const reach = new Set(['aaaaaaaa', 'bbbbbbbb']);
    expect(judgeEntry({ date: '2026-05-17', sha: 'aaaaaaaa' }, git, reach)).toBe(null);
    expect(judgeEntry({ date: '2026-05-16', sha: 'aaaaaaaa' }, git, reach)).toMatch(/recorded 2026-05-16/);
    expect(judgeEntry({ date: '2026-05-28', sha: 'bbbbbbbb' }, git, reach)).toMatch(/not the first commit/);
    expect(judgeEntry(null, git, reach)).toBe('no recorded day');
    expect(judgeEntry({ date: 'soon', sha: 'aaaaaaaa' }, git, reach)).toBe('no recorded day');
  });

  it('judgeEntry: a branch-dated lesson squash-merged later holds only within the grace, and never after', () => {
    const git = { date: '2026-09-25', sha: 'dddddddd' };
    const reach = new Set(['dddddddd']);
    expect(judgeEntry({ date: '2026-09-24', sha: 'eeeeeeee' }, git, reach)).toBe(null);
    expect(judgeEntry({ date: '2026-09-26', sha: 'eeeeeeee' }, git, reach)).toMatch(/AFTER/);
    const early = new Date(Date.parse('2026-09-25T00:00:00Z') - (SQUASH_GRACE_DAYS + 1) * 86400000).toISOString().slice(0, 10);
    expect(judgeEntry({ date: early, sha: 'eeeeeeee' }, git, reach)).toMatch(/not a squash/);
    expect(judgeEntry({ date: '2026-09-30', sha: 'working-tree' }, { reason: 'no commit ever added' }, reach)).toBe(null);
  });

  it('buildDatesFile keeps what git supports, replaces and reports what it does not, and reports Living Lessons differences', () => {
    const catalog = [{ key: 'banking', ids: ['bank1-first', 'bank3-untraced'] }, { key: 'living-lessons', ids: ['whohe1-keyed'] }];
    const reachable = new Set(['aaaaaaaa', 'bbbbbbbb', 'cccccccc']);
    const planted = { courses: { banking: { 'bank1-first': ['2026-05-20', 'aaaaaaaa'] } } };
    const { file, report, problems } = buildDatesFile({ catalog, scan, reachable, previous: planted, recorded: { 'whohe1-keyed': '2026-05-27' } });
    expect(problems).toEqual([{ course: 'banking', id: 'bank1-first', why: expect.stringMatching(/recorded 2026-05-20/) }]);
    expect(file.courses.banking['bank1-first']).toEqual(['2026-05-17', 'aaaaaaaa']);
    expect(file.undated['banking/bank3-untraced']).toMatch(/no commit ever added/);
    expect(report.counts.banking).toEqual({ lessons: 2, dated: 1, undated: 1 });
    expect(report.livingLessonsDisagreements).toEqual([{ course: 'living-lessons', id: 'whohe1-keyed', recorded: '2026-05-27', git: '2026-05-28', sha: 'bbbbbbbb' }]);
    // A true previous entry is kept exactly and raises no problem.
    const again = buildDatesFile({ catalog, scan, reachable, previous: file, recorded: {} });
    expect(again.problems).toEqual([]);
    expect(again.file.courses.banking).toEqual(file.courses.banking);
  });
});
