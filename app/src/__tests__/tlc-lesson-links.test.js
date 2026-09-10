// @vitest-environment node
// =============================================================================
// A link that serves ONE TLC lesson outside the app (Darrell 2026-09-10:
// "a link to serve the lessons like the Love Corner App does... so people can
// taste and see what type of therapy and training TLC ... has to offer")
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  tlcLessonQuery, tlcLessonUrl, parseTlcLessonLink, resolveTlcLesson, everyTlcLessonId,
  tlcLessonSharePayload, tlcCourseSharePayload, TLC_TASTE_NOTE,
} from '../lib/tlc-lesson-links.js';
import { allTracks } from '../lib/tlc-lessons.js';
import { allCourses } from '../lib/tlc-training-library.js';
import { isTlcDoorContext } from '../lib/tlc-door.js';

describe('the link', () => {
  it('carries the door marker, the course and the lesson, and round-trips', () => {
    const q = tlcLessonQuery({ courseId: 'client-psychoeducation', lessonId: 'cl1-what-anxiety-is' });
    expect(q.startsWith('?tlc=1&')).toBe(true);
    expect(isTlcDoorContext(q), 'the shell must route it to the TLC door').toBe(true);
    expect(parseTlcLessonLink(q)).toEqual({ courseId: 'client-psychoeducation', lessonId: 'cl1-what-anxiety-is' });
    expect(parseTlcLessonLink(tlcLessonQuery({ courseId: 'client-psychoeducation' }))).toEqual({ courseId: 'client-psychoeducation', lessonId: null });
    expect(tlcLessonQuery({})).toBe('');
    expect(parseTlcLessonLink('?tlc=1')).toEqual({ courseId: null, lessonId: null });
    expect(parseTlcLessonLink(null)).toEqual({ courseId: null, lessonId: null });
  });
  it('is absolute, on the canonical origin and TLC’s own installable entry — the path the onboarding link already uses', () => {
    const url = tlcLessonUrl({ courseId: 'whole-situation-support', lessonId: 'wh1-what-to-expect' });
    expect(url).toBe('https://poetech.us/tlc/app/?tlc=1&course=whole-situation-support&lesson=wh1-what-to-expect');
    expect(tlcLessonUrl({ courseId: 'x', lessonId: 'y', origin: 'http://localhost:5173', path: '/' })).toBe('http://localhost:5173/?tlc=1&course=x&lesson=y');
    expect(tlcLessonUrl({})).toBe('');
  });
});

describe('resolving a link against the mounted curriculum', () => {
  it('every lesson id across the tracks and the library is unique, so a link is never ambiguous', () => {
    const ids = everyTlcLessonId();
    expect(ids.length).toBeGreaterThan(100);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('a client-track lesson resolves to the open audience with its module', () => {
    const track = allTracks().find((t) => t.key === 'client-psychoeducation');
    const m = track.modules[0];
    const r = resolveTlcLesson({ courseId: track.key, lessonId: m.id });
    expect(r.kind).toBe('track');
    expect(r.audience).toBe('client');
    expect(r.module.id).toBe(m.id);
    expect(r.title).toBe(track.title);
  });
  it('the whole-situation track serves as the client audience; the clinician track as therapist', () => {
    const whole = allTracks().find((t) => t.sideKey === 'whole');
    const clin = allTracks().find((t) => t.sideKey === 'therapist');
    expect(resolveTlcLesson({ courseId: whole.key }).audience).toBe('client');
    expect(resolveTlcLesson({ courseId: clin.key }).audience).toBe('therapist');
  });
  it('a library lesson (a full training, or one of Christina’s session scripts) resolves to Training & Hours', () => {
    const courses = allCourses();
    const course = courses.find((c) => c.id.startsWith('tl-individual-therapy'));
    const r = resolveTlcLesson({ courseId: course.id, lessonId: course.modules[1].id });
    expect(r.kind).toBe('library');
    expect(r.audience).toBe('training');
    expect(r.course.id).toBe(course.id);
    expect(r.module.id).toBe(course.modules[1].id);
    const script = courses.find((c) => c.id === 'tl-script-finding-herself');
    expect(resolveTlcLesson({ courseId: script.id, lessonId: script.modules[0].id }).kind).toBe('library');
  });
  it('a lesson id alone is found; a stale course or lesson resolves to null (the door opens normally)', () => {
    const course = allCourses()[0];
    expect(resolveTlcLesson({ lessonId: course.modules[0].id }).course.id).toBe(course.id);
    expect(resolveTlcLesson({ courseId: 'gone-course' })).toBeNull();
    expect(resolveTlcLesson({ courseId: course.id, lessonId: 'gone-lesson' })).toBeNull();
    expect(resolveTlcLesson({})).toBeNull();
  });
});

describe('what the share sheet gets', () => {
  it('a lesson: its title, its big idea, the practice named, the link', () => {
    const course = allCourses()[0];
    const m = course.modules[0];
    const url = tlcLessonUrl({ courseId: course.id, lessonId: m.id });
    const p = tlcLessonSharePayload(m, { url, courseTitle: course.title });
    expect(p.title).toBe(m.title);
    expect(p.text).toContain(m.bigIdea);
    expect(p.text).toContain(course.title);
    expect(p.text).toContain('TLC Therapy Solutions');
    expect(p.url).toBe(url);
  });
  it('a course: the series with its honest lesson count', () => {
    const course = allCourses()[0];
    const p = tlcCourseSharePayload(course, { url: 'https://x/', lessonCount: course.modules.length });
    expect(p.title).toBe(course.title);
    expect(p.text).toContain(`${course.modules.length} lessons, free to read`);
    expect(tlcCourseSharePayload({ title: 'T' }, { url: 'u' }).text).toContain('Free to read');
  });
  it('the visitor’s note says what this is and what it is not', () => {
    expect(TLC_TASTE_NOTE).toMatch(/taste and see/);
    expect(TLC_TASTE_NOTE).toMatch(/not treatment or diagnosis/);
  });
});
