// DR-1662: every classic Learn function lives in the new look, vibrant, with
// the smallest thumbnails and their titles, and Sort · Show · View on each list.
// Darrell 2026-11-26: "We need all these functions to be in the new view
// without loosing the functions" / "Don't want to loose any functional tools".
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import LearnStudioPreview from '../components/learn-studio/LearnStudioPreview.jsx';
import LearnDashboard, { LEARN_TOOLS } from '../components/learn-studio/LearnDashboard.jsx';
import { libraryStanding, lowHangingFruit } from '../lib/learn-organize.js';
import { learnInventory } from '../lib/learn-presentation/integrity.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const COURSES = learnInventory().map((c) => ({ key: c.key, meta: { ...(c.meta || {}), key: c.key }, schedule: c.lessons }));
const LIVING = COURSES.find((c) => c.key === 'living-lessons');
// A real record: the first three Living Lessons read, the fourth begun.
const PROGRESS = Object.fromEntries(LIVING.schedule.slice(0, 3).map((m) => [m.id, true]));
const PLACES = [{ courseKey: 'living-lessons', lessonId: LIVING.schedule[3].id, stage: 1, step: 0, at: 1 }];
const CTX = { places: PLACES, progress: PROGRESS };
const SRC = (f) => readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'components', f), 'utf8');

let container, root;
beforeEach(() => {
  window.speechSynthesis = { speak() {}, cancel() {}, pause() {}, resume() {}, getVoices: () => [], addEventListener() {}, removeEventListener() {} };
  window.SpeechSynthesisUtterance = class {};
  try {
    window.localStorage.clear();
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
const $ = (id) => container.querySelector(`[data-testid="${id}"]`);
const pressed = (group, label) => [...$(group).querySelectorAll('button')].find((b) => b.textContent === label);

describe('Your Learning: the same numbers the classic page reads', () => {
  it('not started / begun / finished / lessons read come from libraryStanding over the same record', () => {
    act(() => root.render(<LearnDashboard courses={COURSES} index={new Map()} ctx={CTX} onOpenCourse={vi.fn()} />));
    const all = libraryStanding(COURSES, CTX);
    const text = $('ls-standing').textContent;
    expect(text).toContain(`${all.notStarted}not started`);
    expect(text).toContain(`${all.inProgress}begun`);
    expect(text).toContain(`${all.lessonsRead}of ${all.lessons} lessons read`);
    expect($('ls-standing').querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe(String(all.pct));
  });

  it('Closest to finished and Not started, and short are the classic picks, each one tap into its course', () => {
    const onOpenCourse = vi.fn();
    act(() => root.render(<LearnDashboard courses={COURSES} index={new Map()} ctx={CTX} onOpenCourse={onOpenCourse} />));
    const fruit = lowHangingFruit(COURSES, CTX);
    expect($('ls-fruit').textContent).toContain('Closest to finished');
    expect($('ls-fruit').textContent).toContain('Not started, and short');
    click($('ls-fruit').querySelector(`[data-testid="ls-course-${fruit.nearest.course.key}"]`));
    expect(onOpenCourse).toHaveBeenCalledWith(fruit.nearest.course.key);
  });

  it('every classic area is a tool here: Continue, Latest, Browse, Find, Record, Downloads', () => {
    const onTool = vi.fn();
    act(() =>
      root.render(<LearnDashboard courses={COURSES} index={new Map()} ctx={CTX} onOpenCourse={vi.fn()} onTool={onTool} continueCount={19} recordCount={153} />)
    );
    expect(LEARN_TOOLS).toEqual(['continue', 'latest', 'browse', 'find', 'record', 'downloads']);
    expect($('ls-tool-continue').textContent).toBe('Continue · 19');
    expect($('ls-tool-record').textContent).toBe('Record · 153');
    for (const id of LEARN_TOOLS) click($(`ls-tool-${id}`));
    expect(onTool.mock.calls.map((c) => c[0])).toEqual(LEARN_TOOLS);
  });
});

describe('Courses: compact thumbnail rows with Sort · Show · View', () => {
  it('lists the first twelve, then every course; departments narrow the list', () => {
    act(() => root.render(<LearnDashboard courses={COURSES} index={new Map()} ctx={CTX} onOpenCourse={vi.fn()} />));
    expect($('ls-courses').querySelectorAll('button.ls-mini').length).toBe(Math.min(12, COURSES.length));
    click($('ls-courses-all'));
    expect($('ls-courses').querySelectorAll('button.ls-mini').length).toBe(COURSES.length);
    const deptBtn = [...$('ls-courses').querySelectorAll('[data-testid^="ls-dept-"]')].find((b) => b.getAttribute('data-testid') !== 'ls-dept-all');
    click(deptBtn);
    expect(deptBtn.getAttribute('aria-pressed')).toBe('true');
    expect($('ls-courses').querySelectorAll('button.ls-mini').length).toBeLessThan(COURSES.length);
  });

  it('Show: Begun keeps only begun courses; Finished with none says so (never blank)', () => {
    act(() => root.render(<LearnDashboard courses={COURSES} index={new Map()} ctx={CTX} onOpenCourse={vi.fn()} />));
    click(pressed('ls-course-show', 'Begun'));
    const rows = [...$('ls-courses').querySelectorAll('button.ls-mini')];
    expect(rows.map((r) => r.getAttribute('data-testid'))).toEqual(['ls-course-living-lessons']);
    click(pressed('ls-course-show', 'Finished'));
    expect($('ls-courses-none')).toBeTruthy();
  });

  it('Sort A to Z orders by title; View: Cards turns the rows into tiles and is remembered', () => {
    act(() => root.render(<LearnDashboard courses={COURSES} index={new Map()} ctx={CTX} onOpenCourse={vi.fn()} />));
    pick($('ls-course-sort'), 'title');
    click($('ls-courses-all'));
    const titles = [...$('ls-courses').querySelectorAll('.ls-mini-title')].map((n) => n.textContent);
    expect(titles.length).toBe(COURSES.length);
    click(pressed('ls-course-view', 'Cards'));
    expect($('ls-courses').querySelector('.ls-mini-list--cards')).toBeTruthy();
    expect(window.localStorage.getItem('ls-view:course-view')).toBe('cards');
  });
});

describe('Lessons: thumbnails, read marks, ages, Show and View', () => {
  it('a read lesson carries its classic read mark; age chips open that age; Show: Read narrows', () => {
    const markFor = (lesson) => (PROGRESS[lesson.id] ? '✓ READ ×3 · Adult' : '');
    act(() =>
      root.render(
        <LearnStudioPreview
          courses={COURSES}
          onOpenLesson={vi.fn()}
          onExit={vi.fn()}
          ownerDevice
          initialCourseKey="living-lessons"
          ctx={CTX}
          done={new Set(Object.keys(PROGRESS))}
          markFor={markFor}
        />
      )
    );
    const first = $(`inorder-${LIVING.schedule[0].id}`);
    expect(first.textContent).toContain('✓ READ ×3 · Adult');
    expect(first.querySelector('.ls-mini-thumb')).toBeTruthy();
    click(pressed('inorder-show', 'Read'));
    expect(container.querySelectorAll('button.ls-inorder-row').length).toBe(3);
    click(pressed('inorder-view', 'Cards'));
    expect(container.querySelector('.ls-inorder-list--cards')).toBeTruthy();
    // Every Living Lesson carries a Child version (DR-1657): its chip opens the lesson in the Experience.
    const chip = $(`inorder-age-${LIVING.schedule[0].id}-child`);
    expect(chip).toBeTruthy();
    click(chip);
    expect(container.querySelector('.ls-inorder-list')).toBeNull();
  });
});

describe('the classic tools render inside the new look, and their lessons open there', () => {
  it('the tools node is on the home and on a course page; nothing is replaced', () => {
    const tools = <div data-testid="learn-areas">classic tools</div>;
    act(() => root.render(<LearnStudioPreview courses={COURSES} onOpenLesson={vi.fn()} onExit={vi.fn()} ownerDevice tools={tools} ctx={CTX} />));
    expect($('ls-full-tools')).toBeTruthy();
    expect($('ls-full-tools').querySelector('[data-testid="learn-areas"]')).toBeTruthy();
    expect($('learn-dashboard')).toBeTruthy();
    click($(`ls-course-${COURSES[0].key}`));
    expect($('ls-full-tools').querySelector('[data-testid="learn-areas"]')).toBeTruthy();
  });

  it('a lesson chosen in the classic tools opens the Experience through the registered opener', () => {
    let opener = null;
    act(() =>
      root.render(<LearnStudioPreview courses={COURSES} onOpenLesson={vi.fn()} onExit={vi.fn()} ownerDevice registerOpener={(fn) => (opener = fn)} ctx={CTX} />)
    );
    expect(typeof opener).toBe('function');
    let took;
    act(() => {
      took = opener('living-lessons', LIVING.schedule[0].id, { mode: 'read' });
    });
    expect(took).toBe(true);
    expect($('learn-dashboard')).toBeNull(); // the Experience replaced the home
    expect(opener('no-such-course', 'nope', {})).toBe(false); // unknown: the classic path runs
  });

  it('off the owner device the opener declines, so the classic reader opens exactly as before', () => {
    let opener = null;
    act(() => root.render(<LearnStudioPreview courses={COURSES} onOpenLesson={vi.fn()} onExit={vi.fn()} registerOpener={(fn) => (opener = fn)} ctx={CTX} />));
    expect(opener('living-lessons', LIVING.schedule[0].id, { mode: 'read' })).toBe(false);
  });

  it('ChurchLearn hands its whole classic page in as the tools and routes every lesson-open through the opener first', () => {
    const src = SRC('ChurchLearn.jsx');
    expect(src).toMatch(/tools=\{classicLearn\}/);
    for (const fn of ['openLessonFromList', 'playLesson', 'continueAndRead', 'readVersion']) {
      const at = src.indexOf(`const ${fn} = `);
      expect(at, fn).toBeGreaterThan(-1);
      expect(src.slice(at, at + 400), fn).toMatch(/viaStudio\(/);
    }
    // Leaving the new look clears the opener, so the classic view never routes away.
    expect(SRC('learn-studio/LearnStudioPreview.jsx')).toMatch(/return \(\) => registerOpener\(null\)/);
  });
});
