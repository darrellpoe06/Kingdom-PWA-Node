// @vitest-environment node
//
// learn-organize — the Learn picker's grouping + sorts derive from the mounted
// courses (DR-0121): the Deep-Processing family is detected from its own key
// family, counts come from live schedules, empty groups vanish. Pins the
// 2026-07-10 "sorts and dropdowns" organizing layer.
import { describe, it, expect } from 'vitest';
import { organizeCourses, courseLessonCount, isDeepProcessing, COURSE_SORTS } from '../lib/learn-organize.js';

const c = (key, title, lessons) => ({ key, meta: { title }, schedule: Array.from({ length: lessons }, (_, i) => ({ i })) });
const COURSES = [
  c('ai-class', 'Learning A.I. The Way', 8),
  c('eternal-gospels', 'The Gospels — Deep Processing', 12),
  c('broadcast', 'The Broadcast', 6),
  c('eternal-torah', 'Torah & History — Deep Processing', 20),
];

describe('organizeCourses', () => {
  it('groups the Deep-Processing family apart, authored order by default', () => {
    const g = organizeCourses(COURSES);
    expect(g.map((x) => x.label)).toEqual(['Courses', 'The Word — Deep Processing']);
    expect(g[0].courses.map((x) => x.key)).toEqual(['ai-class', 'broadcast']);
    expect(g[1].courses.map((x) => x.key)).toEqual(['eternal-gospels', 'eternal-torah']);
  });
  it('sorts within groups: A to Z, most lessons, shortest first', () => {
    expect(organizeCourses(COURSES, 'title')[0].courses.map((x) => x.key)).toEqual(['ai-class', 'broadcast']);
    expect(organizeCourses(COURSES, 'lessons-desc')[1].courses.map((x) => x.key)).toEqual(['eternal-torah', 'eternal-gospels']);
    expect(organizeCourses(COURSES, 'lessons-asc')[0].courses.map((x) => x.key)).toEqual(['broadcast', 'ai-class']);
  });
  it('omits empty groups and survives junk input', () => {
    expect(organizeCourses(COURSES.slice(0, 1)).map((x) => x.label)).toEqual(['Courses']);
    expect(organizeCourses(null)).toEqual([]);
    expect(organizeCourses([null, undefined])).toEqual([]);
  });
  it('helpers: counts derive from the live schedule; the family is key-detected', () => {
    expect(courseLessonCount(COURSES[3])).toBe(20);
    expect(courseLessonCount(null)).toBe(0);
    expect(isDeepProcessing({ key: 'eternal-x' })).toBe(true);
    expect(isDeepProcessing({ key: 'broadcast' })).toBe(false);
    expect(COURSE_SORTS.map((s) => s.key)).toContain('authored');
  });
});
