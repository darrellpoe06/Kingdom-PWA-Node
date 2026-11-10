// @vitest-environment jsdom
// =============================================================================
// The record opens on the record, picks a learner in one tap, never runs off the
// edge, and names what it is still waiting for (DR-1393)
// =============================================================================
// Darrell, 2026-11-10: "Record doesn't open a users record!! It should!!!... it
// currently opened the information about it... we want the record"; with a Big
// Print screenshot, "the screen on the right cutting off fields"; "No 100% even
// after completing all lessons... Evaluation of systems"; and "each user needs
// to have a drop-down for choosing them... so I can see my recent records or my
// son's without needing to scroll".
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import LearnersPanel from '../components/LearnersPanel.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { clearAllPlaces } from '../lib/learn-resume.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const ME = 'b0000000-0000-4000-a000-000000000250';
const SON = 'c0000000-0000-4000-a000-000000000250';
let host;
let root;
beforeEach(() => {
  window.localStorage.clear();
  clearAllPlaces();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  window.localStorage.clear();
});
const q = (id) => host.querySelector(`[data-testid="${id}"]`);
const qa = (id) => [...host.querySelectorAll(`[data-testid="${id}"]`)];
const rec = (o) => ({ courseKey: 'buying-terms', completedAt: '2026-11-09T10:00:00.000Z', ...o });
const IDS = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8'];
const TITLES = Object.fromEntries(IDS.map((id, i) => [id, `Lesson ${i + 1}`]));

describe('the Record tab opens on the record', () => {
  it('the class record is unfolded and the library is folded', () => {
    act(() =>
      root.render(
        createElement(ChurchLearn, {
          extraCourses: buildCatalogCourseDescriptors(),
          progress: {},
          toggleModule: vi.fn(),
          quizState: {},
          recordQuiz: () => {},
          learnLevel: 'auto',
          setLearnLevel: () => {},
          ageBand: 'adult',
          setAgeBand: () => {},
          signedIn: true,
          currentUserId: ME,
          learnerRecords: [],
        })
      )
    );
    const tab = [...host.querySelectorAll('[data-testid="learn-areas"] button')].find((b) => /^Record/.test((b.textContent || '').trim()));
    act(() => tab.click());
    expect(q('learn-class-record').open, 'the record is open').toBe(true);
    expect(q('learn-library-census').open, 'the information about it waits, folded').toBe(false);
  });
});

describe('the record itself', () => {
  const rows = [
    ...IDS.slice(0, 6).map((id) => rec({ userId: ME, lessonId: id })),
    rec({ userId: SON, lessonId: 'b1', learnerLabel: 'Son', completedAt: '2026-11-10T08:00:00.000Z' }),
  ];
  const draw = (props = {}) =>
    act(() =>
      root.render(
        createElement(LearnersPanel, {
          records: rows,
          currentUserId: ME,
          isGovernor: true,
          courseTotals: { 'buying-terms': 8 },
          courseLessonIds: { 'buying-terms': IDS },
          titleOf: (id) => TITLES[id] || null,
          onReadAgain: vi.fn(),
          onRetake: vi.fn(),
          ...props,
        })
      )
    );

  it('a whose-record picker shows one learner at a time, you first, without scrolling past the others', () => {
    draw();
    const pick = q('learner-pick');
    expect(pick).toBeTruthy();
    expect([...pick.options].map((o) => o.textContent.split(' · ')[0])).toEqual(['You', 'Son']);
    expect(host.querySelectorAll('ul.space-y-3 > li')).toHaveLength(1);
    expect(q('learner-course').textContent).toContain('6 of 8');
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setter.call(pick, SON);
      pick.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(host.querySelectorAll('ul.space-y-3 > li')).toHaveLength(1);
    expect(q('learner-course').textContent).toContain('1 of 8');
    expect(
      qa('learner-course-missing').some((li) => li.querySelector('button')),
      'another learner’s record has no doors'
    ).toBe(false);
  });

  it('course by course is stacked blocks, not a five-column table that runs off a Big Print screen', () => {
    draw();
    expect(host.querySelector('table'), 'no table').toBeNull();
    const course = q('learner-course');
    expect(course.querySelector('dl').className).toContain('flex-wrap');
    expect(course.textContent).toMatch(/Read\s*6 of 8/);
    expect(course.textContent).toMatch(/Completion\s*75%/);
  });

  it('a completion short of the whole names each lesson the record is waiting for, each one tap to read', () => {
    const onReadAgain = vi.fn();
    draw({ onReadAgain });
    const gap = q('learner-course-gap');
    expect(gap.textContent).toMatch(/^2 not on the record yet:/);
    const missing = qa('learner-course-missing');
    expect(missing.map((li) => li.textContent)).toEqual(['7. Lesson 7', '8. Lesson 8']);
    act(() => missing[1].querySelector('button').click());
    expect(onReadAgain).toHaveBeenCalledWith('buying-terms', 'b8');
  });

  it('PROVEN TO CATCH: a whole course says so, and names nothing missing', () => {
    act(() =>
      root.render(
        createElement(LearnersPanel, {
          records: IDS.map((id) => rec({ userId: ME, lessonId: id })),
          currentUserId: ME,
          courseTotals: { 'buying-terms': 8 },
          courseLessonIds: { 'buying-terms': IDS },
          titleOf: (id) => TITLES[id],
        })
      )
    );
    expect(q('learner-course').textContent).toMatch(/Completion\s*100%/);
    expect(q('learner-course-whole')).toBeTruthy();
    expect(qa('learner-course-missing')).toHaveLength(0);
  });
});
