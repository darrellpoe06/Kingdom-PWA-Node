// @vitest-environment jsdom
// =============================================================================
// the-pattern-test-shows-on-screen — the test reaches the reader (DR-1404)
// =============================================================================
// Darrell's screenshot was "Open the Door → He Comes In to Sup", Pattern 3 of 8
// in the Eternal Algorithms (Revelation) course, with no test anywhere on it.
// The data now carries one; this renders the real QuizBlock with the real
// pattern module and requires the reader to see every question and its
// options, so a test that exists only in the data cannot pass for one the
// reader can take.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { QuizBlock } from '../components/ChurchLearn.jsx';
import { buildEternalProcessingCourses } from '../lib/eternal-algorithms-course.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host;
let root;
afterEach(() => {
  act(() => root && root.unmount());
  host && host.remove();
});

describe('the pattern in the screenshot shows its test', () => {
  it('Open the Door → He Comes In to Sup renders every question with its options', () => {
    const course = buildEternalProcessingCourses().find((c) => c.key === 'eternal-revelation');
    const module = course.schedule.find((m) => m.id === 'ea-gh-door-sup');
    expect(module.title).toBe('Open the Door → He Comes In to Sup');
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => root.render(createElement(QuizBlock, { module, saved: null, onRecord: () => {} })));
    const text = host.textContent;
    for (const q of module.quiz.questions) expect(text).toContain(q.q);
    const radios = host.querySelectorAll('input[type="radio"]');
    expect(radios.length).toBe(module.quiz.questions.reduce((t, q) => t + q.options.length, 0));
  });
});
