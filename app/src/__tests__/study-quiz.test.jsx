// @vitest-environment jsdom
// The Study quiz files its grade on the record ("Where are my records?", Darrell 2026-11-26).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import StudyQuiz from '../components/learn-studio/StudyQuiz.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const tap = (id) => act(() => q(id).dispatchEvent(new MouseEvent('click', { bubbles: true })));
const mount = (props) => act(() => root.render(createElement(StudyQuiz, props)));

const lesson = {
  id: 'l1',
  quiz: {
    questions: [
      { q: 'One?', options: ['a', 'b'], answer: 0, explain: 'Because a.' },
      { q: 'Two?', options: ['c', 'd'], answer: 1, explain: 'Because d.' },
    ],
  },
};

describe('StudyQuiz', () => {
  it('records the graded attempt once every question is answered, and says it was saved', () => {
    const onRecordQuiz = vi.fn();
    mount({ lesson, tools: { quizSaves: true, onRecordQuiz, quizSaved: null } });
    expect(q('le-quiz-none')).toBeTruthy();
    tap('le-quiz-0-0');
    expect(onRecordQuiz).not.toHaveBeenCalled();
    tap('le-quiz-1-1');
    expect(onRecordQuiz).toHaveBeenCalledTimes(1);
    const [id, r] = onRecordQuiz.mock.calls[0];
    expect(id).toBe('l1');
    expect(r).toMatchObject({ passed: true, pct: 100, questions: 2 });
    expect(typeof r.at).toBe('string');
    expect(q('le-quiz-result').textContent).toContain('2 of 2 correct (100%): passed. Saved to your record.');
  });

  it('a second tap on an answered question changes nothing and files nothing twice', () => {
    const onRecordQuiz = vi.fn();
    mount({ lesson, tools: { quizSaves: true, onRecordQuiz } });
    tap('le-quiz-0-1');
    tap('le-quiz-0-0');
    tap('le-quiz-1-1');
    tap('le-quiz-1-0');
    expect(onRecordQuiz).toHaveBeenCalledTimes(1);
    expect(onRecordQuiz.mock.calls[0][1]).toMatchObject({ passed: false, pct: 50 });
  });

  it('shows the grade already on the record before any tap', () => {
    mount({ lesson, tools: { quizSaves: true, onRecordQuiz: () => {}, quizSaved: { passed: true, pct: 80, at: '2026-11-20T10:00:00Z' } } });
    expect(q('le-quiz-saved').textContent).toContain('On your record: passed (80%)');
  });

  it('never claims a save when signed out or in the owner preview', () => {
    mount({ lesson, tools: { quizSaves: false, onRecordQuiz: () => {} } });
    tap('le-quiz-0-0');
    tap('le-quiz-1-1');
    expect(q('le-quiz-result').textContent).toContain('Not saved: sign in');
    mount({ lesson });
    tap('le-quiz-0-0');
    tap('le-quiz-1-1');
    expect(q('le-quiz-result').textContent).toContain('owner preview');
  });

  it('Take it again clears the attempt', () => {
    mount({ lesson });
    tap('le-quiz-0-0');
    tap('le-quiz-1-1');
    tap('le-quiz-again');
    expect(q('le-quiz-result')).toBeNull();
    expect(q('le-quiz-0-0').getAttribute('aria-pressed')).toBe('false');
  });
});
