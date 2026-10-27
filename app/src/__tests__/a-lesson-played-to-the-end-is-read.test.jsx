// =============================================================================
// A lesson played to the end is read — the record gets it at once
// =============================================================================
// Darrell 2026-10-27: "are we counting the reading of students accurately and
// effectively?" The record had two writers (use-learner-records.js): a tap on
// "Mark this lesson done", and a finished PLACE filed by the course view when
// it mounts (DR-0754 follow-up). The in-space reader finishes a place when its
// read-aloud speaks the last sentence (TTSControl). ▶ Play — the big full-
// screen reader, the door he asked for by name — finished nothing: the deck
// never wrote to the place, and its read target is owned per slide, so the
// in-space rule never matched. A lesson read whole through Play was not a
// read.
//
// Driven here the way he does it: Latest lessons → ▶ Play on a Living Lesson
// → the deck opens → the reader walks it to the last point. The place is
// finished and the read is filed to the record (toggleModule) before the deck
// is even closed — not on the next sign-in.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { getPlaceFor, clearAllPlaces, finishPlace } from '../lib/learn-resume.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const choose = (sel, value) => act(() => {
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(sel, value);
  sel.dispatchEvent(new Event('change', { bubbles: true }));
});
const key = (k) => act(() => { window.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true })); });

describe('a lesson played to the end is read', () => {
  let host, root;
  const mount = (toggleModule) => act(() => root.render(createElement(ChurchLearn, {
    extraCourses: buildCatalogCourseDescriptors(), progress: {}, toggleModule, quizState: {}, recordQuiz: () => {},
    learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
  })));
  /** Latest → the lesson's own space (the title), as he reaches it. Returns the lesson id and its card. */
  const openFromLatest = () => {
    choose(host.querySelector('#learn-course-sort'), 'latest');
    const row = host.querySelector('[data-testid="learn-latest-lessons"] li[data-course-key="living-lessons"]');
    expect(row).toBeTruthy();
    const id = row.getAttribute('data-lesson-id');
    act(() => { row.querySelector('button').click(); });
    const card = host.querySelector(`[id="learn-lesson-${id}"]`);
    expect(card, 'the lesson opened in its own space').toBeTruthy();
    return { id, card };
  };
  beforeEach(() => { window.localStorage.clear(); clearAllPlaces(); host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
  afterEach(() => { act(() => root.unmount()); host.remove(); window.localStorage.clear(); });

  it('the deck (Present), walked to the last point: the place is finished and the read is filed at once', () => {
    const toggleModule = vi.fn();
    mount(toggleModule);
    const { id, card } = openFromLatest();
    expect(toggleModule).not.toHaveBeenCalled();
    const present = [...card.querySelectorAll('button')].find((b) => /\bPresent\b/.test(b.textContent || ''));
    expect(present, 'the deck has its own door on the card').toBeTruthy();
    act(() => { present.click(); });
    expect(host.querySelector('#presenter-slide'), 'the big full-screen reader opened on the lesson').toBeTruthy();
    expect(getPlaceFor('living-lessons', id)?.done, 'opening is not reading').not.toBe(true);
    expect(toggleModule).not.toHaveBeenCalled();
    // Walk the deck to its last point. A lesson's parts are its scenes; sixty
    // presses is more than any lesson has, and the deck is silent past its end.
    for (let i = 0; i < 60 && !toggleModule.mock.calls.length; i += 1) key('ArrowRight');
    expect(getPlaceFor('living-lessons', id)?.done, 'the place is finished').toBe(true);
    expect(toggleModule).toHaveBeenCalledTimes(1);
    expect(toggleModule).toHaveBeenCalledWith(id, 'living-lessons');
    key('ArrowRight');
    key('Escape');
    expect(toggleModule, 'walking on, or closing, does not file it twice').toHaveBeenCalledTimes(1);
  });

  it('the in-space reader finishing the place (its last sentence) is filed the same moment, not on the next sign-in', () => {
    const toggleModule = vi.fn();
    mount(toggleModule);
    const { id } = openFromLatest();
    expect(toggleModule).not.toHaveBeenCalled();
    // What TTSControl does when the last sentence is spoken (TTSControl.jsx finishPlace()).
    act(() => { finishPlace({ courseKey: 'living-lessons', lessonId: id }); });
    expect(toggleModule).toHaveBeenCalledTimes(1);
    expect(toggleModule).toHaveBeenCalledWith(id, 'living-lessons');
    act(() => { finishPlace({ courseKey: 'living-lessons', lessonId: id }); });
    expect(toggleModule, 'a second finish of the same lesson is not a second file').toHaveBeenCalledTimes(1);
  });

  it('proven-to-catch: a deck opened and closed unread files nothing', () => {
    const toggleModule = vi.fn();
    mount(toggleModule);
    const { card } = openFromLatest();
    const present = [...card.querySelectorAll('button')].find((b) => /\bPresent\b/.test(b.textContent || ''));
    act(() => { present.click(); });
    key('Escape');
    expect(toggleModule).not.toHaveBeenCalled();
  });
});
