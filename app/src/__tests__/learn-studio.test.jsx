// @vitest-environment jsdom
// =============================================================================
// LEARN STUDIO — the redesign is a doorway; the lesson stays the author's
// =============================================================================
// Owner direction 2026-11-24: "My husband's complete original title must remain
// directly below the new title inside each opened lesson", and every original
// lesson, title, age reading, audio and course stays. These tests pin the copy
// AND the behavior together (DR-0691): the original title is the next element
// after the new title, in full; Read / Listen / an age chip hand the REAL lesson
// row back to the reader untouched; and the surface never goes blank.
// =============================================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import LearnStudio from '../components/learn-studio/LearnStudio.jsx';
import { learnInventory } from '../lib/learn-presentation/integrity.js';
import { presentationIndex, shelfForDepartment, interimHeadline, SHELVES } from '../lib/learn-presentation/presentation.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container;
let root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const render = (el) => act(() => root.render(el));
const q = (sel) => container.querySelector(sel);
const byText = (text) =>
  [...container.querySelectorAll('button, h1, h2, p, div, span')].filter((n) => n.textContent === text && ![...n.children].some((c) => c.textContent === text));
const click = (node) => act(() => node.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const type = (input, value) =>
  act(() => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

const COURSES = learnInventory().map((c) => ({ key: c.key, meta: { ...(c.meta || {}), key: c.key }, schedule: c.lessons }));
const LL338 = COURSES.find((c) => c.key === 'living-lessons').schedule.find((l) => l.id === 'll338-not-with-eyeservice');
const REC = {
  lessonId: LL338.id,
  courseKey: 'living-lessons',
  originalTitleAtApproval: LL338.title,
  displayTitle: 'Who Is Watching When You Work Alone?',
  thumbHeadline: 'WORK WHEN UNSEEN',
  promoDescription: 'A test description.',
  visual: { alt: 'A woman works at a desk in daylight.' },
  image: { src: '/x.webp' },
  status: 'review',
  featured: true,
  featuredOrder: 1,
};

describe('LearnStudio', () => {
  it('shows the complete original title directly under the new title in an opened lesson', () => {
    render(<LearnStudio courses={COURSES} index={presentationIndex([REC])} preview initialLesson={LL338.id} />);
    const h1 = q('h1');
    expect(h1.textContent).toBe('Who Is Watching When You Work Alone?');
    const next = h1.nextElementSibling;
    expect(next.getAttribute('data-testid')).toBe('original-title');
    expect(next.textContent).toBe(LL338.title); // in full, character for character
    expect(LL338.title).toBe('Not with Eyeservice — faithful work when no one is watching');
  });

  it('Read, Listen and an age chip hand the real lesson row to the reader', () => {
    const onRead = vi.fn();
    const onListen = vi.fn();
    const onVersion = vi.fn();
    render(
      <LearnStudio
        courses={COURSES}
        index={presentationIndex([REC])}
        preview
        initialLesson={LL338.id}
        onRead={onRead}
        onListen={onListen}
        onVersion={onVersion}
      />
    );
    click(byText('Read Lesson')[0]);
    expect(onRead).toHaveBeenCalledTimes(1);
    expect(onRead.mock.calls[0][0]).toBe(LL338); // the same object: nothing copied or rewritten
    click(byText('▶ Listen')[0]);
    expect(onListen.mock.calls[0][0]).toBe(LL338);
    click(byText('Adult')[0]);
    expect(onVersion.mock.calls[0][2]).toBe('adult');
  });

  it('a record still in review is hidden from a learner build (preview off)', () => {
    render(<LearnStudio courses={COURSES} index={presentationIndex([REC])} preview={false} />);
    expect(byText('Who Is Watching When You Work Alone?')).toHaveLength(0);
    expect(q('[role=status]').textContent).toMatch(/No lesson has an approved cover yet/);
  });

  it('every department and all 994 lessons stay reachable, and search finds an original title', () => {
    render(<LearnStudio courses={COURSES} index={presentationIndex([REC])} preview />);
    expect(container.textContent).toContain('All 13 Departments');
    expect(container.textContent).toContain('994 lessons');
    type(q('input[type=search]'), 'Eyeservice');
    expect(container.textContent).toContain('Results for');
    expect(byText('Who Is Watching When You Work Alone?').length).toBeGreaterThan(0);
    type(q('input[type=search]'), 'zzqqxx');
    expect(q('[role=status]').textContent).toMatch(/No lesson matches/);
  });
});

describe('temporary covers (owner 2026-11-24: reuse approved department art, no new spend)', () => {
  const COVERS = Object.fromEntries(SHELVES.map((t) => [t.id, { image: { src: `/topics/${t.id}.webp` }, alt: t.label }]));

  it('every department on the shelves maps to an approved topic cover', () => {
    for (const t of SHELVES) for (const d of t.departments) expect(shelfForDepartment(d)).toBe(t.id);
    expect(shelfForDepartment('Not a department')).toBe(null);
  });

  it('a lesson without its own picture wears its department art, never a blank box', () => {
    const noPic = { ...REC, image: null };
    render(<LearnStudio courses={COURSES} index={presentationIndex([noPic])} preview topicCovers={COVERS} initialLesson={LL338.id} />);
    const art = q('.ls-cover-art [data-interim="true"]');
    expect(art).not.toBeNull();
    expect(art.className).toMatch(/ls-interim--faith/);
    expect(art.querySelector('img').getAttribute('src')).toBe('/topics/faith.webp');
    expect(container.textContent).not.toMatch(/Picture coming/);
    // the original title still sits directly under the new title
    expect(q('[data-testid="original-title"]').textContent).toBe(LL338.title);
  });

  it('a lesson WITH its own picture shows it, not the temporary cover', () => {
    render(<LearnStudio courses={COURSES} index={presentationIndex([REC])} preview topicCovers={COVERS} initialLesson={LL338.id} />);
    expect(q('.ls-cover-art [data-interim="true"]')).toBeNull();
    expect(q('.ls-cover-art img').getAttribute('src')).toBe('/x.webp');
  });

  it('the temporary headline uses real copy only: the record, the short title, or the course', () => {
    expect(interimHeadline({ thumbHeadline: 'WORK WHEN UNSEEN', displayTitle: 'x' })).toBe('WORK WHEN UNSEEN');
    expect(interimHeadline({ displayTitle: 'Give Me This Mountain — Caleb at 85' })).toBe('Give Me This Mountain');
    expect(interimHeadline({ displayTitle: 'A very long lesson title that keeps going on and on', courseTitle: 'Living Lessons' })).toBe('Living Lessons');
  });
});
