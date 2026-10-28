// =============================================================================
// The Latest list carries what the course list carries, and lists each lesson once
// =============================================================================
// Darrell 2026-10-27, two screenshots side by side (a course's own list, then
// Latest): "Lessons tab is not giving the count or the play buttons etc...",
// "we have a couple of duplicate lessons now?", "Even the count is different
// for lessons and latest with the same courses?" Measured on the real catalog
// before changing anything: 849 Latest rows, two pairs sharing a title — L153
// carried whole into Sovereign A.I. as sov18 (one source, two doors, marked
// `sharedWith`), and L17 "Taste and See" beside the Eternal Wisdom algorithm
// of the same name (two lessons from the one question he spoke on
// 2026-07-10) — and a Latest row with no ▶ Play, no Continue, and a heading
// with two numbers where the course list's had a different two.
//
// Now: a row carries ▶ Play and the device's own Continue / FINISHED mark; a
// lesson carried whole is listed once, at home, and the home row names the
// other course; two different lessons with one title stay two rows that name
// each other; the month heading says lessons · readings · for every age — the
// same three the course list's heading says (ChurchLearn.jsx).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import LatestLessons from '../components/LatestLessons.jsx';
import { latestLessons, latestCountLine } from '../lib/learn-organize.js';
import { recordPlace, finishPlace, clearAllPlaces } from '../lib/learn-resume.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const ADULT = 'The adult lesson, written in full for a grown reader.';
const ALL_AGES = { child: 'Child words.', youth: 'Youth words.', teen: 'Teen words.', senior: 'Senior words.' };
const L1 = { id: 'll1-the-first', title: 'The First', lesson: ADULT, levels: ALL_AGES, added: '2026-10-03' };
const L2 = { id: 'll2-taste-and-see', title: 'Taste and See', lesson: ADULT, added: '2026-10-02' };
const L3 = { id: 'll3-the-third', title: 'The Third', lesson: ADULT, added: '2026-09-20' };
const SOV = { ...L1, id: 'sov9-the-first', sharedWith: { course: 'll', lesson: L1.id } };
const EW = { id: 'ea-taste-and-see', title: 'Taste and See', lesson: 'A different lesson under the same title.', added: '2026-10-02' };
const courses = () => [
  { key: 'll', meta: { title: 'Living Lessons' }, schedule: [L1, L2, L3] },
  { key: 'sov', meta: { title: 'Sovereign A.I.' }, schedule: [SOV] },
  { key: 'ew', meta: { title: 'Eternal Wisdom' }, schedule: [EW] },
];

describe('latestLessons lists each lesson once and names its pair', () => {
  it('a lesson carried whole into a second course is one row, at home, naming the other course', () => {
    const out = latestLessons(courses());
    expect(out.rows.map((r) => r.lessonId)).toEqual([L1.id, L2.id, EW.id, L3.id]);
    expect(out.carried).toEqual([{ courseKey: 'sov', courseTitle: 'Sovereign A.I.', lessonId: SOV.id, homeCourseKey: 'll', homeLessonId: L1.id }]);
    expect(out.rows[0].alsoIn).toEqual(['Sovereign A.I.']);
    expect(out.courseCount).toBe(2);
    expect(latestCountLine(out)).toBe('All 4 lessons across 2 courses, each on the day it was first added to the app. One lesson carried whole into a second course is listed once, at home.');
  });
  it('two different lessons with one title stay two rows, and each names the other', () => {
    const { rows } = latestLessons(courses());
    expect(rows.find((r) => r.lessonId === L2.id).sameTitleIn).toEqual(['Eternal Wisdom']);
    expect(rows.find((r) => r.lessonId === EW.id).sameTitleIn).toEqual(['Living Lessons (L2)']);
    expect(rows.find((r) => r.lessonId === L1.id).sameTitleIn).toEqual([]);
  });
  it('a carried copy whose home is not mounted is listed itself — a real lesson never vanishes (proven-to-catch)', () => {
    const out = latestLessons(courses().filter((c) => c.key !== 'll'));
    expect(out.rows.map((r) => r.lessonId)).toEqual([SOV.id, EW.id]);
    expect(out.carried).toEqual([]);
  });
  it('says which rows carry every age', () => {
    const { rows } = latestLessons(courses());
    expect(rows.map((r) => [r.lessonId, r.everyAge])).toEqual([[L1.id, true], [L2.id, false], [EW.id, false], [L3.id, false]]);
  });
});

describe('the Latest list on screen', () => {
  let container, root;
  beforeEach(() => { window.localStorage.clear(); clearAllPlaces(); container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); window.localStorage.clear(); });
  const li = (id) => container.querySelector(`[data-testid="learn-latest-list"] li[data-lesson-id="${id}"]`);

  it('every row carries the same ▶ Play the course list carries, opening that lesson in its home course', () => {
    const onPlay = vi.fn();
    const onOpen = vi.fn();
    act(() => root.render(createElement(LatestLessons, { courses: courses(), onOpen, onPlay, onContinue: () => {} })));
    const rows = [...container.querySelectorAll('[data-testid="learn-latest-list"] li[data-lesson-id]')];
    expect(rows.length).toBe(4);
    expect(rows.every((r) => r.querySelector('[data-testid="latest-play"]'))).toBe(true);
    act(() => { li(EW.id).querySelector('[data-testid="latest-play"]').click(); });
    expect(onPlay).toHaveBeenCalledWith('ew', EW.id);
    expect(onOpen).not.toHaveBeenCalled();
    // The title is still the first button in the row — the same tap, the same door.
    act(() => { li(L3.id).querySelector('button').click(); });
    expect(onOpen).toHaveBeenCalledWith('ll', L3.id);
  });

  it('proven-to-catch: with no Play handed in, no Play is painted', () => {
    act(() => root.render(createElement(LatestLessons, { courses: courses(), onOpen: () => {} })));
    expect(container.querySelectorAll('[data-testid="latest-play"]').length).toBe(0);
  });

  it('a lesson begun shows Continue, a lesson read to the end shows FINISHED — from the device record', () => {
    recordPlace({ courseKey: 'll', lessonId: L2.id, step: 2 });
    finishPlace({ courseKey: 'ew', lessonId: EW.id });
    const onContinue = vi.fn();
    act(() => root.render(createElement(LatestLessons, { courses: courses(), onOpen: () => {}, onPlay: () => {}, onContinue })));
    expect(li(L2.id).querySelector('[data-testid="row-continue"]')).toBeTruthy();
    expect(li(EW.id).querySelector('[data-testid="row-finished"]').textContent).toMatch(/READ/);
    expect(li(L1.id).querySelector('[data-testid="row-continue"], [data-testid="row-finished"]')).toBe(null);
    act(() => { li(L2.id).querySelector('[data-testid="row-continue"]').click(); });
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onContinue.mock.calls[0][0].lessonId).toBe(L2.id);
  });

  it('the carried lesson is one row that names the other course; the same-title pair name each other', () => {
    act(() => root.render(createElement(LatestLessons, { courses: courses(), onOpen: () => {}, onPlay: () => {} })));
    expect(li(SOV.id)).toBe(null);
    expect(li(L1.id).querySelector('[data-testid="latest-also-in"]').textContent).toBe('also taught whole in Sovereign A.I.');
    expect(li(L2.id).querySelector('[data-testid="latest-same-title"]').textContent).toBe('same title, another lesson: Eternal Wisdom');
    expect(li(EW.id).querySelector('[data-testid="latest-same-title"]').textContent).toBe('same title, another lesson: Living Lessons (L2)');
    expect(container.querySelector('[data-testid="learn-latest-line"]').textContent).toMatch(/One lesson carried whole into a second course is listed once, at home\.$/);
  });

  it('the month heading says the three numbers the course list says: lessons · readings · for every age', () => {
    act(() => root.render(createElement(LatestLessons, { courses: courses(), onOpen: () => {}, onPlay: () => {} })));
    const oct = container.querySelector('li[data-month-heading="month-2026-10"]');
    expect(oct.querySelector('[data-month-lessons]').textContent).toBe('3 lessons');
    expect(oct.querySelector('[data-month-readings]').textContent).toBe('7 readings');
    expect(oct.querySelector('[data-month-aged]').textContent).toBe(' · 1 for every age');
    expect(oct.querySelector('[data-testid="latest-month-fold"]').getAttribute('aria-label')).toBe('October 2026, 3 lessons, 7 readings, 1 written for every age — fold this month');
    const sep = container.querySelector('li[data-month-heading="month-2026-09"]');
    expect(sep.querySelector('[data-month-aged]')).toBe(null);
  });
});
