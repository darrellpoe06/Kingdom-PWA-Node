// @vitest-environment jsdom
// =============================================================================
// Course page: Pictures or List, in any order (Darrell 2026-11-25: "Is there a
// list view also?... so we can choose chronological or this look").
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import CourseLessonsView, { orderCourseItems, COURSE_VIEW_KEY } from '../components/learn-studio/CourseLessonsView.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const items = [
  { lesson: { id: 'a', title: 'Zebra' }, p: { displayTitle: 'Zebra', number: 1 } },
  { lesson: { id: 'b', title: 'Apple' }, p: { displayTitle: 'Apple', number: 2 } },
  { lesson: { id: 'c', title: 'Mango' }, p: { displayTitle: 'Mango', number: 3 } },
];
let container, root;
beforeEach(() => {
  window.localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const mount = (onOpen = vi.fn()) =>
  act(() =>
    root.render(
      createElement(CourseLessonsView, {
        title: 'Made in Time',
        items,
        onOpen,
        renderPictures: (rows) => createElement('div', { 'data-testid': 'pictures' }, rows.map((r) => r.lesson.id).join(',')),
      })
    )
  );

describe('orderCourseItems', () => {
  it('keeps the course order by default and keeps each lesson its own number in every order', () => {
    expect(orderCourseItems(items).map((x) => [x.lesson.id, x.n])).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ]);
    expect(orderCourseItems(items, 'newest').map((x) => x.lesson.id)).toEqual(['c', 'b', 'a']);
    expect(orderCourseItems(items, 'az').map((x) => [x.lesson.id, x.n])).toEqual([
      ['b', 2],
      ['c', 3],
      ['a', 1],
    ]);
    expect(orderCourseItems(items, 'za').map((x) => x.lesson.id)).toEqual(['a', 'c', 'b']);
    expect(orderCourseItems(null)).toEqual([]);
  });
});

describe('the course page switch', () => {
  it('opens on Pictures, switches to a numbered List of every lesson, and remembers the choice on this device', () => {
    mount();
    expect(q('course-lessons-view').getAttribute('data-view')).toBe('pictures');
    expect(q('pictures').textContent).toBe('a,b,c');
    click(q('course-view-list'));
    expect(q('pictures')).toBeNull();
    expect([...q('course-list').querySelectorAll('li')].map((li) => li.textContent)).toEqual(['1Zebra▶', '2Apple▶', '3Mango▶']);
    expect(q('course-view-list').getAttribute('aria-pressed')).toBe('true');
    expect(window.localStorage.getItem(COURSE_VIEW_KEY)).toBe('list');
    act(() => root.unmount());
    root = createRoot(container);
    mount();
    expect(q('course-lessons-view').getAttribute('data-view')).toBe('list');
  });
  it('the order applies to both looks, and a list row opens that lesson', () => {
    const onOpen = vi.fn();
    mount(onOpen);
    const sel = q('course-view-order');
    act(() => {
      sel.value = 'az';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(q('pictures').textContent).toBe('b,c,a');
    click(q('course-view-list'));
    click(q('course-row-c'));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen.mock.calls[0][0].lesson.id).toBe('c');
  });
});

// The switch on the REAL course page: LearnStudio opened on a course shows it, and List lists that course.
describe('on the Learn Studio course page', () => {
  it('a course opened in Learn Studio carries the Pictures | List switch, and List shows its lessons in course order', async () => {
    const { default: LearnStudio } = await import('../components/learn-studio/LearnStudio.jsx');
    const { presentationIndex } = await import('../lib/learn-presentation/presentation.js');
    const course = {
      key: 'demo',
      meta: { key: 'demo', title: 'Demo Course', category: 'Faith' },
      schedule: [
        { id: 'd1', title: 'First lesson', lesson: 'One. Two.' },
        { id: 'd2', title: 'Second lesson', lesson: 'Three. Four.' },
      ],
    };
    await act(async () => {
      root.render(
        createElement(LearnStudio, {
          courses: [course],
          index: presentationIndex([]),
          preview: true,
          initialCourse: 'demo',
          onRead: () => {},
          onListen: () => {},
          onVersion: () => {},
          onExit: () => {},
        })
      );
    });
    expect(q('course-lessons-view')).toBeTruthy();
    click(q('course-view-list'));
    expect([...q('course-list').querySelectorAll('.ls-inorder-t')].map((e) => e.textContent)).toEqual(['First lesson', 'Second lesson']);
    // The cold import of the whole Learn Studio tree is most of this test's time (~17 s on a loaded runner).
  }, 60000);
});
