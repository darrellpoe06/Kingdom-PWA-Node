// =============================================================================
// church-institute — the Institute names only courses that exist, never opens
// enrollment without the office's confirmation, and claims no credential it
// does not have (the brief's rules 6 and 7, 2026-11-12).
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  INSTITUTE_META,
  PROGRAMS,
  programCourses,
  programStatus,
  availableCourses,
  unresolvedCourseKeys,
  programCourseList,
  programAlsoCourses,
  populationPaths,
  launchState,
  enrollmentCopy,
  ENROLLMENT_STEPS,
} from '../lib/church-institute.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';

describe('programs name only registered courses', () => {
  it('every courseKey every program names is in LEARN_CATALOG', () => {
    expect(unresolvedCourseKeys()).toEqual([]);
  });
  it('PROVEN-TO-CATCH: a program naming a course that does not exist is reported by program and key', () => {
    const fake = [{ key: 'ghost', title: 'Ghost', courseKeys: ['church-offices', 'no-such-course'] }];
    expect(unresolvedCourseKeys(fake)).toEqual(['ghost:no-such-course']);
  });
  it('the three programs the brief names are present, and the real leadership courses are available today', () => {
    expect(PROGRAMS.map((p) => p.title)).toEqual(['Biblical Studies', 'Ministry Leadership', 'Christian Education']);
    const ml = PROGRAMS.find((p) => p.key === 'ministry-leadership');
    expect(programStatus(ml)).toBe('available');
    expect(programCourses(ml).map((c) => c.meta.title)).toEqual([
      'The Functions of the House: every office, from the Word',
      'Handed Forward: Stewarding for Problems We Never Faced',
    ]);
  });
  it('a program with no registered course is planned, and availableCourses de-duplicates', () => {
    expect(programStatus({ key: 'x', courseKeys: [] })).toBe('planned');
    expect(programStatus({ key: 'y', courseKeys: ['no-such-course'] })).toBe('planned');
    const keys = availableCourses().map((x) => x.course.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const k of keys)
      expect(
        LEARN_CATALOG.some((c) => c.key === k),
        k
      ).toBe(true);
  });
});

describe('every Word course flows into its program (2026-11-24)', () => {
  it('the required core is unchanged (DR-1460: the certificate standard moves only by a decision)', () => {
    expect(Object.fromEntries(PROGRAMS.map((p) => [p.key, p.courseKeys]))).toEqual({
      'biblical-studies': ['who-he-is', 'made-in-time'],
      'ministry-leadership': ['church-offices', 'handed-forward'],
      'christian-education': ['little-learners'],
    });
  });
  it('each program lists its core first, then its open-study courses, all registered', () => {
    for (const p of PROGRAMS) {
      const list = programCourseList(p);
      expect(list.length).toBeGreaterThan(p.courseKeys.length);
      expect(list.slice(0, p.courseKeys.length).every((x) => x.required)).toBe(true);
      expect(list.slice(p.courseKeys.length).every((x) => !x.required)).toBe(true);
    }
    const ce = PROGRAMS.find((p) => p.key === 'christian-education');
    expect(programAlsoCourses(ce).map((c) => c.key)).toContain('living-lessons');
  });
  it('PROVEN-TO-CATCH: an open-study key that does not exist is reported', () => {
    expect(unresolvedCourseKeys([{ key: 'g', courseKeys: [], alsoKeys: ['no-such-course'] }])).toEqual(['g:no-such-course']);
  });
  it('no market, real-estate or A.I. course is placed in the Institute', () => {
    const cats = availableCourses().map((x) => x.course.meta.category);
    for (const bad of ['Stock Market', 'Real Estate', 'A.I. The Way', 'Mathematics']) expect(cats).not.toContain(bad);
  });
  it('by age, young to seniors: Little Ones then every AGE_BANDS row, counts measured from the lessons', () => {
    const living = [
      { id: 'a', lesson: 'x', levels: { child: 1, senior: 1 } },
      { id: 'b', lesson: 'x', levels: { teen: 1 } },
    ];
    const rows = populationPaths(living, [{ id: 'l1' }]);
    expect(rows.map((r) => r.key)).toEqual(['little', 'child', 'youth', 'teen', 'adult', 'senior']);
    expect(Object.fromEntries(rows.map((r) => [r.key, r.count]))).toEqual({ little: 1, child: 1, youth: 0, teen: 1, adult: 2, senior: 1 });
  });
});

describe('enrollment is carried by data, never by memory', () => {
  it('never reads open without the office confirming AND opening', () => {
    expect(launchState(null)).toBe('not-filed');
    expect(launchState({})).toBe('not-filed');
    expect(launchState({ exemption_status: 'filed' })).toBe('filed');
    expect(launchState({ exemption_status: 'confirmed' })).toBe('confirmed-closed');
    expect(launchState({ exemption_status: 'confirmed', enrollment_open: false })).toBe('confirmed-closed');
    expect(launchState({ exemption_status: 'not-filed', enrollment_open: true })).toBe('not-filed');
    expect(launchState({ exemption_status: 'confirmed', enrollment_open: true })).toBe('open');
  });
  it('each state has plain copy, and the plan has four steps', () => {
    for (const s of ['open', 'confirmed-closed', 'filed', 'not-filed']) expect(enrollmentCopy(s).length).toBeGreaterThan(20);
    expect(enrollmentCopy('not-filed')).toContain('Enrollment opens when the office confirms');
    expect(ENROLLMENT_STEPS).toHaveLength(4);
  });
});

describe('no credential the Institute does not hold', () => {
  it('the credential kinds are certificates only and the note disclaims accreditation and degrees', () => {
    expect(INSTITUTE_META.credentialKinds).toEqual(['certificate']);
    expect(INSTITUTE_META.credentialNote).toBe('Religious certificates of completion. No accreditation or degrees are claimed.');
    expect(INSTITUTE_META.name).toBe('TLC Theological Institute');
    expect(INSTITUTE_META.tagline).toBe('Equipping Believers. Developing Leaders. Deepening Faith.');
  });
  it('no authored sentence claims to be accredited, authorized or degree-granting', () => {
    const text = JSON.stringify({ INSTITUTE_META, PROGRAMS, ENROLLMENT_STEPS });
    expect(text).not.toMatch(/\b(is|are|fully) accredited\b/i);
    expect(text).not.toMatch(/\bdegree[- ]granting\b|\bearn (a|your) degree\b|\bstate[- ]authorized\b/i);
  });
});
