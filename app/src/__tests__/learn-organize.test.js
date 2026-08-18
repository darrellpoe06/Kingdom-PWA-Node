// @vitest-environment node
//
// learn-organize — the Learn picker's grouping + sorts derive from the mounted
// courses (DR-0121): the Deep-Processing family is detected from its own key
// family, counts come from live schedules, empty groups vanish. Pins the
// 2026-07-10 "sorts and dropdowns" organizing layer.
import { describe, it, expect } from 'vitest';
import { organizeCourses, courseLessonCount, isDeepProcessing, COURSE_SORTS, buildLessonIndex, searchLessons } from '../lib/learn-organize.js';

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

// =============================================================================
// The LESSON FINDER (Darrell 2026-08-18) — index derives from live schedules,
// search finds by title, topic, and VERSE REFERENCE, AND-matched and ranked.
// =============================================================================
describe('lesson finder — cross-course index + search', () => {
  const FINDER_COURSES = [
    {
      key: 'living-lessons',
      meta: { title: 'Living Lessons from the Word', unit: 'lesson' },
      schedule: [
        { id: 'll80', week: 80, title: 'The Four Warnings of a Hardening Heart', bigIdea: 'Judas and Peter, remorse vs repentance', anchor: { ref: 'Hebrews 3:13; 2 Corinthians 7:10', theme: 'the direction of the sorrow' } },
        { id: 'll81', week: 81, title: 'Tongues, Weighed Word-First', bigIdea: 'Acts defines Acts; praying in the Spirit as dependence', anchor: { ref: 'Acts 2:6-11; 1 Corinthians 14:39-40', theme: 'both hands held' } },
      ],
    },
    {
      key: 'eternal-gospels',
      meta: { title: 'The Gospels — Deep Processing', unit: 'session' },
      schedule: [
        { id: 'eg1', week: 1, title: 'Seek First the Kingdom', bigIdea: 'the mechanics of provision', anchor: { ref: 'Matthew 6:33', theme: 'ordering the seeking' } },
      ],
    },
  ];
  const INDEX = buildLessonIndex(FINDER_COURSES);

  it('the index derives every lesson from the live schedules — course identity, unit label, anchor carried', () => {
    expect(INDEX).toHaveLength(3);
    const l80 = INDEX.find((e) => e.lessonId === 'll80');
    expect(l80.courseTitle).toBe('Living Lessons from the Word');
    expect(l80.unitLabel).toBe('Lesson 80');
    expect(l80.ref).toContain('2 Corinthians 7:10');
    expect(INDEX.find((e) => e.lessonId === 'eg1').unitLabel).toBe('Session 1');
  });

  it('finds a lesson by title words without knowing its course', () => {
    const hits = searchLessons(INDEX, 'hardening heart');
    expect(hits.map((h) => h.lessonId)).toEqual(['ll80']);
  });

  it('a VERSE REFERENCE finds its lesson (the anchor is searchable)', () => {
    expect(searchLessons(INDEX, '2 corinthians 7').map((h) => h.lessonId)).toEqual(['ll80']);
    expect(searchLessons(INDEX, 'matthew 6:33').map((h) => h.lessonId)).toEqual(['eg1']);
  });

  it('AND semantics: a token that matches nothing kills the match', () => {
    expect(searchLessons(INDEX, 'hardening zebra')).toEqual([]);
  });

  it('title matches outrank body matches', () => {
    const hits = searchLessons(INDEX, 'tongues');
    expect(hits[0].lessonId).toBe('ll81'); // in the TITLE, ranks first even if others mention it in body
  });

  it('blank and junk queries return an empty list, never the whole wall', () => {
    expect(searchLessons(INDEX, '')).toEqual([]);
    expect(searchLessons(INDEX, '   ')).toEqual([]);
    expect(searchLessons([], 'x')).toEqual([]);
  });
});
