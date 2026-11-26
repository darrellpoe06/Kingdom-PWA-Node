// DR-1676: measured 2026-11-26, lesson_shares held 0 rows ever while lessons were shared from the new
// look -- its Share sent a bare link. It now shares exactly as the classic button: the lesson's own
// note, a fresh token on the preview link (DR-1673), the share recorded, and a shared open reported.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const recorded = [];
const landed = [];
vi.mock('../lib/lesson-share-record.js', () => ({
  recordLessonShare: (payload, result) => recorded.push({ payload, result }),
  reportShareLanded: (r) => landed.push(r),
  pendingShareToken: () => globalThis.__pendingToken || '',
}));

import { LessonCover } from '../components/learn-studio/LearnStudio.jsx';
import { isShareToken } from '../lib/lesson-share.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const course = { key: 'living-lessons', meta: { key: 'living-lessons', title: 'Living Lessons from the Word', category: 'Living Lessons' } };
const lesson = { id: 'll10-strength-and-honour-are-her-clothing', title: 'Strength and Honour', bigIdea: 'Strength is stewardship. Honour is clothing.' };
const x = {
  lesson,
  course,
  p: { courseKey: 'living-lessons', lessonId: lesson.id, displayTitle: 'Strong, Not Skinny', courseTitle: 'Living Lessons from the Word' },
};

let container, root, shared;
beforeEach(() => {
  recorded.length = 0;
  landed.length = 0;
  globalThis.__pendingToken = '';
  shared = [];
  Object.defineProperty(window.navigator, 'share', { configurable: true, value: async (d) => shared.push(d) });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete window.navigator.share;
});
const render = () =>
  act(() => root.render(<LessonCover x={x} next={null} onBack={() => {}} onRead={() => {}} onListen={() => {}} onVersion={() => {}} onOpen={() => {}} />));

describe("the new look's Share is the classic share, recorded", () => {
  it('shares the lesson note with a token on its preview link, and records the share', async () => {
    render();
    const btn = [...container.querySelectorAll('button')].find((b) => /share/i.test(b.textContent));
    expect(btn).toBeTruthy();
    await act(async () => {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(shared.length).toBe(1);
    expect(shared[0].text || shared[0].url).toMatch(/\/l\/lovecorner\/\?.*lesson=ll10-strength-and-honour-are-her-clothing.*&s=/);
    expect(recorded.length).toBe(1);
    expect(recorded[0].result).toBe('shared');
    expect(isShareToken(recorded[0].payload.token)).toBe(true);
    expect(recorded[0].payload.lessonId).toBe(lesson.id);
  });

  it('a page opened from a shared link reports the lesson on screen when its cover shows', () => {
    globalThis.__pendingToken = 'Tok3nAbcdE12';
    render();
    expect(landed).toEqual([{ ok: true }]);
    expect(container.querySelector(`#learn-lesson-${lesson.id}`)).toBeTruthy();
  });
});
