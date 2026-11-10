// @vitest-environment jsdom
// =============================================================================
// My paces: off until the learner turns it on, and honest about what it has measured (DR-1386)
// =============================================================================
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import MyPaces from '../components/MyPaces.jsx';
import { noteSeenRise, noteEarsPace, recordPacedAttempt } from '../lib/pace-understanding.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host = null;
let root = null;
const draw = (props) => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(createElement(MyPaces, props)));
};
const q = (id) => host.querySelector(`[data-testid="${id}"]`);

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  if (root) act(() => root.unmount());
  if (host) host.remove();
  root = null;
  host = null;
  window.localStorage.clear();
});

describe('my paces', () => {
  it('is off until turned on, and the choice is remembered', () => {
    draw({ lessonId: 'L' });
    expect(q('my-paces-toggle').textContent).toBe('Show my paces');
    expect(q('my-paces-eyes')).toBeNull();
    act(() => q('my-paces-toggle').click());
    expect(q('my-paces-toggle').getAttribute('aria-pressed')).toBe('true');
    expect(q('my-paces-eyes')).toBeTruthy();
    act(() => root.unmount());
    host.remove();
    draw({ lessonId: 'L' });
    expect(q('my-paces-toggle').textContent).toBe('Hide my paces');
  });

  it('says it is still measuring until it has enough, and never paints a pace', () => {
    noteSeenRise('L', { words: 40, at: 0 });
    noteSeenRise('L', { words: 40, at: 10000 });
    draw({ lessonId: 'L' });
    act(() => q('my-paces-toggle').click());
    expect(q('my-paces-eyes').getAttribute('data-accurate')).toBe('false');
    expect(q('my-paces-eyes').textContent).toMatch(/^Your reading: measuring \(40 of 150 words/);
    expect(q('my-paces-ears').textContent).toMatch(/not measured on this lesson yet/);
    expect(q('my-paces-fit').textContent).toMatch(/Not enough yet to say/);
  });

  it('shows both paces once measured, and the finding once the data holds one', () => {
    for (let i = 0; i <= 5; i += 1) noteSeenRise('L', { words: 50, at: i * 12000 });
    noteEarsPace('L', 175, 1);
    for (const [wpm, pcts] of [
      [200, [90, 90, 90]],
      [450, [60, 60, 60]],
    ]) {
      pcts.forEach((pct, i) => {
        const id = `p${wpm}-${i}`;
        for (let k = 0; k <= 5; k += 1) noteSeenRise(id, { words: wpm / 5, at: k * 12000 });
        recordPacedAttempt({ lessonId: id, pct, passed: pct >= 70 });
      });
    }
    draw({ lessonId: 'L' });
    act(() => q('my-paces-toggle').click());
    expect(q('my-paces-eyes').textContent).toBe('Your reading: 250 words a minute (measured on 250 words).');
    expect(q('my-paces-ears').textContent).toBe('The reader: 175 words a minute at 1.0×.');
    expect(q('my-paces-fit').getAttribute('data-finding')).toBe('true');
    expect(q('my-paces-fit').textContent).toMatch(
      /score higher at 150 to 250 words a minute \(90% across 3\) than at 400 words a minute or more \(60% across 3\)/
    );
  });
});
