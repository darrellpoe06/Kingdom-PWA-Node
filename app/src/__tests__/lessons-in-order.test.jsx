// DR-1661: "Where is the lessons!!!" The lessons are first on the Learn home,
// in order, and one tap opens the lesson in the new look.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import LearnStudioPreview from '../components/learn-studio/LearnStudioPreview.jsx';
import { orderedLessons, FIRST_ROWS } from '../components/learn-studio/LessonsInOrder.jsx';
import { learnInventory } from '../lib/learn-presentation/integrity.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const COURSES = learnInventory().map((c) => ({ key: c.key, meta: { ...(c.meta || {}), key: c.key }, schedule: c.lessons }));
const LIVING = COURSES.find((c) => c.key === 'living-lessons');
let container, root;
beforeEach(() => {
  window.speechSynthesis = { speak() {}, cancel() {}, pause() {}, resume() {}, getVoices: () => [], addEventListener() {}, removeEventListener() {} };
  window.SpeechSynthesisUtterance = class {};
  // These cases read the List look (DR-1661's numbered rows); the home now opens on Pictures
  // (learn-functions-in-new-look.test.jsx holds that default), so they pick List as a reader would.
  try {
    window.localStorage.setItem('ls-view:lesson-view-2', 'list');
  } catch {
    /* no storage */
  }
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const click = (n) => act(() => n.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const pick = (sel, v) =>
  act(() => {
    Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(sel, v);
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });

describe('the lessons are first on the Learn home, in order (DR-1661, pictures first DR-1686)', () => {
  it('orderedLessons: in order by default, and every other order', () => {
    const rows = orderedLessons(LIVING, new Map());
    expect(rows.length).toBe(LIVING.schedule.length);
    expect(rows[0].lesson.id).toBe(LIVING.schedule[0].id);
    expect(rows[0].n).toBe(1);
    expect(orderedLessons(LIVING, new Map(), { order: 'newest' })[0].lesson.id).toBe(LIVING.schedule[LIVING.schedule.length - 1].id);
    const az = orderedLessons(LIVING, new Map(), { order: 'az' }).map((x) => x.lesson.title);
    const za = orderedLessons(LIVING, new Map(), { order: 'za' }).map((x) => x.lesson.title);
    expect(za[0]).toBe(az[az.length - 1]);
  });

  it('the pictures lead (DR-1686): the carousel, then the lessons, Living Lessons lesson 1 on top', () => {
    act(() => root.render(<LearnStudioPreview courses={COURSES} onOpenLesson={vi.fn()} onExit={vi.fn()} ownerDevice />));
    const list = container.querySelector('[data-testid="lessons-in-order"]');
    expect(list).toBeTruthy();
    // Darrell 2026-11-26: "More images at the top of the app." The carousel is first, the lessons right after it.
    const hero = container.querySelector('.ls-hero');
    expect(hero).toBeTruthy();
    expect(hero.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const search = container.querySelector('.ls-top');
    expect(hero.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelector('[data-testid="inorder-course"]').value).toBe('living-lessons');
    const rows = container.querySelectorAll('.ls-inorder-row');
    expect(rows.length).toBe(FIRST_ROWS);
    expect(rows[0].getAttribute('data-testid')).toBe(`inorder-${LIVING.schedule[0].id}`);
    // DR-1669: the prototype banner is gone; nothing on the home calls the new look a prototype.
    expect(container.textContent).not.toMatch(/prototype/i);
  });

  it('Show all lists every lesson; Newest first puts the last lesson on top', () => {
    act(() => root.render(<LearnStudioPreview courses={COURSES} onOpenLesson={vi.fn()} onExit={vi.fn()} ownerDevice />));
    click(container.querySelector('[data-testid="inorder-all"]'));
    expect(container.querySelectorAll('.ls-inorder-row').length).toBe(LIVING.schedule.length);
    pick(container.querySelector('[data-testid="inorder-order"]'), 'newest');
    expect(container.querySelector('.ls-inorder-row').getAttribute('data-testid')).toBe(`inorder-${LIVING.schedule[LIVING.schedule.length - 1].id}`);
  });

  it('one tap on a row opens that lesson in the new look (owner device); elsewhere it opens the classic reader', () => {
    const onOpenLesson = vi.fn();
    act(() => root.render(<LearnStudioPreview courses={COURSES} onOpenLesson={onOpenLesson} onExit={vi.fn()} ownerDevice />));
    click(container.querySelector('.ls-inorder-row'));
    expect(onOpenLesson).not.toHaveBeenCalled();
    expect(container.querySelector('.le-root')).toBeTruthy();
    act(() => root.unmount());
    root = createRoot(container);
    act(() => root.render(<LearnStudioPreview courses={COURSES} onOpenLesson={onOpenLesson} onExit={vi.fn()} ownerDevice={false} />));
    click(container.querySelector('.ls-inorder-row'));
    expect(onOpenLesson).toHaveBeenCalledWith('living-lessons', LIVING.schedule[0].id);
  });
});
