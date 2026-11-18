// @vitest-environment jsdom
// =============================================================================
// The kids lesson reads two ways (Darrell, 2026-11-18: "Can we also have a
// scroll version as an option?"): step by step, the paced plan as before, or
// the whole lesson scrolled on one page. The choice is remembered on the
// device; Read to me reads the whole lesson in scroll mode and the current
// step otherwise; the record and the check are unchanged either way.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import YouthZone from '../components/YouthZone.jsx';
import { readLessonMode, writeLessonMode, LESSON_MODE_KEY, segmentWords } from '../components/kids/KidsAdventure.jsx';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';

vi.mock('../lib/engagement-sync.js', () => ({
  uploadTriviaAnswer: vi.fn(async () => ({})),
  sendMessage: vi.fn(async () => ({})),
  subscribeMessages: vi.fn(() => () => {}),
  getActiveQuestion: vi.fn(async () => null),
  getRecentQuestions: vi.fn(async () => []),
  chooseTriviaSource: vi.fn(() => ({ mode: 'anchor' })),
  checkQuestionFidelity: vi.fn(() => ({ ok: true })),
  retractQuestion: vi.fn(async () => ({})),
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const MON = new Date('2026-11-16T15:00:00Z');
const loadVerse = async (ref) => `Words of ${ref} for the test.`;
const flush = () =>
  act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  window.localStorage.clear();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const q = (sel) => container.querySelector(sel);
const qa = (sel) => [...container.querySelectorAll(sel)];
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const mount = () =>
  act(() =>
    root.render(
      createElement(YouthZone, {
        church: COLG_DEFAULT_CHURCH,
        now: MON,
        loadVerse,
        fetchRecords: async () => ({ records: [] }),
        saveRecord: async () => ({ ok: true }),
        ask: async () => ({ ok: false }),
      })
    )
  );

describe('the lesson reads step by step or scrolled', () => {
  it('opens step by step; Scroll shows every segment at once and is remembered; Step by step returns and is remembered', async () => {
    await mount();
    await flush();
    click(q('[data-testid="weekly-lesson-open"]'));
    await flush();
    expect(q('[data-testid="adventure-plan"]').getAttribute('data-mode')).toBe('steps');
    expect(q('[data-testid="adventure-mode-steps"]').getAttribute('aria-checked')).toBe('true');
    const total = Number(q('[data-testid="adventure-plan"]').getAttribute('data-segments'));
    expect(total).toBeGreaterThan(1);
    const stepText = q('[data-testid="adventure-plan"]').textContent;
    click(q('[data-testid="adventure-mode-scroll"]'));
    await flush();
    expect(q('[data-testid="adventure-plan"]').getAttribute('data-mode')).toBe('scroll');
    expect(q('[data-testid="adventure-mode-scroll"]').getAttribute('aria-checked')).toBe('true');
    expect(window.localStorage.getItem(LESSON_MODE_KEY)).toBe('scroll');
    // The scrolled lesson carries more words than one step did.
    expect(q('[data-testid="adventure-plan"]').textContent.length).toBeGreaterThan(stepText.length);
    click(q('[data-testid="adventure-mode-steps"]'));
    await flush();
    expect(q('[data-testid="adventure-plan"]').getAttribute('data-mode')).toBe('steps');
    expect(window.localStorage.getItem(LESSON_MODE_KEY)).toBe('steps');
  });
  it('the device remembers scroll for the next lesson; the Teens door reads the same choice', async () => {
    writeLessonMode('scroll');
    expect(readLessonMode()).toBe('scroll');
    await mount();
    await flush();
    click(q('[data-testid="door-teens"]'));
    click(q('[data-testid="weekly-lesson-open"]'));
    await flush();
    expect(q('[data-testid="adventure-plan"]').getAttribute('data-mode')).toBe('scroll');
    expect(qa('[data-testid="adventure-mode"] [role="radio"]').length).toBe(2);
  });
  it('a device with no storage still reads step by step; segment words come from either shape', () => {
    const broken = {
      getItem: () => {
        throw new Error('no storage');
      },
      setItem: () => {
        throw new Error('no storage');
      },
    };
    expect(readLessonMode(broken)).toBe('steps');
    expect(() => writeLessonMode('scroll', broken)).not.toThrow();
    expect(readLessonMode({ getItem: () => 'nonsense' })).toBe('steps');
    expect(segmentWords('plain words')).toBe('plain words');
    expect(segmentWords({ text: 'in text' })).toBe('in text');
    expect(segmentWords({ body: 'in body' })).toBe('in body');
    expect(segmentWords(null)).toBe('');
  });
});
