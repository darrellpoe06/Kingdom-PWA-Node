// =============================================================================
// The NAS copy is lossless, and the parity gate sees any drift (DR-0677)
// =============================================================================
// The code is the master; the NAS database (0242) holds a synchronized copy.
// Two things must be true for that copy to be trusted:
//
//   1. ROUND TRIP. Every lesson of every course the app mounts, decomposed into
//      the table rows and recomposed, is deep-equal to the lesson in the code.
//      The rows pass through JSON first — exactly what a jsonb column can hold —
//      and the child rows are shuffled, because a database promises no order.
//      (Also measured against a real PostgreSQL 16 on 2026-09-29: migrate, sync
//      729 lessons, read back, parity IN STEP — recorded in DR-0677.)
//   2. PARITY. scripts/curriculum-parity.mjs names every lesson whose copy
//      differs, with the field. Proven to catch: one altered band, one missing
//      lesson, one extra public row, one hash, one stale preview.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  courseToRows, rowsToCourses, rowsToLesson, lessonToRows, asJson, canonicalJson,
} from '../lib/curriculum-rows.js';
import { loadRepoCurriculum, snapshotRows, lessonHash } from '../../../scripts/curriculum-snapshot.mjs';
import { parity, describeDrift } from '../../../scripts/curriculum-parity.mjs';

const { list, courses } = await loadRepoCurriculum();
const lessonTotal = Object.values(courses).reduce((t, l) => t + l.length, 0);

// What a database hands back: JSON, children in no particular order.
const throughDb = (rows) => {
  const r = JSON.parse(JSON.stringify(rows));
  for (const k of ['bands', 'quiz', 'movements', 'sources']) r[k].reverse();
  return r;
};

describe('ROUND TRIP — code -> rows -> code is lossless for every course', () => {
  const rows = throughDb(snapshotRows(list));
  const back = rowsToCourses(rows);

  it('reads the real school, not an empty one', () => {
    expect(list.length).toBeGreaterThanOrEqual(49);
    expect(lessonTotal).toBeGreaterThanOrEqual(729);
    expect(rows.lessons).toHaveLength(lessonTotal);
    expect(rows.bands.length).toBeGreaterThan(1000);
    expect(rows.quiz.length).toBeGreaterThan(1000);
    expect(rows.verse_spans.length).toBeGreaterThan(40000);
  });

  it('every course comes back deep-equal, lesson for lesson, in order', () => {
    const bad = [];
    for (const { course, lessons } of list) {
      const got = back[course.key] || [];
      if (got.length !== lessons.length) { bad.push(`${course.key}: ${got.length} of ${lessons.length}`); continue; }
      lessons.forEach((l, i) => {
        if (canonicalJson(asJson(l)) !== canonicalJson(got[i])) bad.push(`${course.key}/${l.id}`);
      });
    }
    expect(bad, `lessons that did not survive the round trip:\n${bad.join('\n')}`).toEqual([]);
  });

  it('and with vitest\'s own deep equality, on the largest course', () => {
    expect(back['living-lessons']).toEqual(asJson(courses['living-lessons']));
  });

  it('keeps each lesson\'s own key order (not only its values)', () => {
    const l = courses['living-lessons'][courses['living-lessons'].length - 1];
    expect(Object.keys(back['living-lessons'].at(-1))).toEqual(Object.keys(asJson(l)));
  });

  it('the stored hash is the hash of the lesson', () => {
    const r = rows.lessons.find((x) => x.course_key === 'living-lessons');
    expect(r.content_sha256).toBe(lessonHash(courses['living-lessons'][0]));
  });

  it('PROVEN-TO-CATCH: an altered band, a dropped key or a lost quiz question is not deep-equal', () => {
    const l = courses['living-lessons'][0];
    const base = lessonToRows('living-lessons', l, 0);
    const bands = base.bands.map((b, i) => (i === 0 ? { ...b, text: `${b.text} ` } : b));
    expect(rowsToLesson({ ...base, bands })).not.toEqual(asJson(l));
    const keyOrder = base.lesson.key_order.filter((k) => k !== 'benefits');
    expect(rowsToLesson({ ...base, lesson: { ...base.lesson, key_order: keyOrder } })).not.toEqual(asJson(l));
    expect(rowsToLesson({ ...base, quiz: base.quiz.slice(1) })).not.toEqual(asJson(l));
    expect(rowsToLesson(base)).toEqual(asJson(l));
  });

  it('an unusual shape rides whole in rest rather than being bent', () => {
    const odd = { id: 'x1', title: 't', quiz: [{ q: 'array-shaped quiz' }], levels: { child: 'a', extra: { n: 1 } }, week: 3 };
    const r = lessonToRows('odd', odd, 0);
    expect(r.lesson.rest.quiz).toEqual(odd.quiz);
    expect(r.lesson.rest.levels).toEqual(odd.levels);
    expect(rowsToLesson(r)).toEqual(odd);
    expect(courseToRows({ key: 'odd', meta: {} }, 0, [odd]).lessons).toHaveLength(1);
  });
});

describe('PARITY — the witness names the lesson and the field', () => {
  const clean = throughDb(snapshotRows(list));
  for (const l of clean.lessons) l.status = 'public';

  it('the code and a faithful copy are IN STEP', () => {
    const r = parity(courses, clean);
    expect(r.drift.map(describeDrift)).toEqual([]);
    expect(r.inStep).toBe(true);
  });

  it('PROVEN-TO-CATCH: one altered band is reported by id and field', () => {
    const rows = JSON.parse(JSON.stringify(clean));
    const target = rows.bands.find((b) => b.lesson_id.startsWith('ll1-'));
    target.text += ' (edited on the NAS)';
    const r = parity(courses, rows);
    expect(r.inStep).toBe(false);
    expect(r.drift).toContainEqual(expect.objectContaining({ id: target.lesson_id, field: 'levels', kind: 'field' }));
    expect(r.drift).toContainEqual(expect.objectContaining({ id: target.lesson_id, kind: 'hash' }));
  });

  it('PROVEN-TO-CATCH: a lesson missing from the copy, and a public one the code does not carry', () => {
    const rows = JSON.parse(JSON.stringify(clean));
    const gone = rows.lessons.shift();
    rows.lessons.push({ ...gone, lesson_id: 'zz-ghost', key_order: ['id', 'title'], title: 'ghost', course_key: 'ai' });
    const r = parity(courses, rows);
    expect(r.drift).toContainEqual(expect.objectContaining({ id: gone.lesson_id, kind: 'missing-on-nas' }));
    expect(r.drift).toContainEqual(expect.objectContaining({ id: 'zz-ghost', kind: 'extra-on-nas' }));
  });

  it('a preview inside its window is expected; one past it is drift, with its PR', () => {
    const rows = JSON.parse(JSON.stringify(clean));
    const now = Date.parse('2026-10-01T00:00:00Z');
    rows.lessons.push({ course_key: 'living-lessons', lesson_id: 'll998-fresh', key_order: ['id', 'title'], title: 'fresh', status: 'preview', updated_at: '2026-09-30T12:00:00Z', pr_url: 'https://github.com/x/y/pull/1' });
    rows.lessons.push({ course_key: 'living-lessons', lesson_id: 'll999-stale', key_order: ['id', 'title'], title: 'stale', status: 'preview', updated_at: '2026-09-20T12:00:00Z', pr_url: 'https://github.com/x/y/pull/2' });
    const r = parity(courses, rows, { now });
    expect(r.drift.map((d) => d.id)).not.toContain('ll998-fresh');
    expect(r.drift).toContainEqual(expect.objectContaining({ id: 'll999-stale', kind: 'stale-preview', pr: 'https://github.com/x/y/pull/2' }));
  });

  it('a merged lesson still marked preview on the NAS is drift', () => {
    const rows = JSON.parse(JSON.stringify(clean));
    rows.lessons[0].status = 'preview';
    const r = parity(courses, rows);
    expect(r.drift).toContainEqual(expect.objectContaining({ id: rows.lessons[0].lesson_id, kind: 'status' }));
  });
});
