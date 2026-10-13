// Render smoke test for the interactive Timeline surface. It mounts only on a
// button reveal inside the L30 lesson, so the catalog render test does not
// exercise it -- this proves it renders the real spine (epochs, the "you are
// here" marker, Scripture, and a real lesson title) without crashing.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import BiblicalTimeline from '../components/BiblicalTimeline.jsx';
import { currentEpoch } from '../lib/biblical-timeline.js';

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

describe('BiblicalTimeline — renders the spine', () => {
  it('mounts and shows the title, the you-are-here epoch, and opens it by default', () => {
    act(() => root.render(createElement(BiblicalTimeline)));
    const txt = container.textContent;
    expect(txt).toContain('The Whole Story');
    expect(txt).toContain('You are here');
    // the current epoch is open by default -> its Scripture (church-age anchors) shows
    expect(currentEpoch().id).toBe('church-age');
    expect(txt).toContain('Acts 2:5-6');
    // real lesson TITLES resolve under the open (church-age) epoch, not raw ids
    expect(txt).toContain('Prove All Things');
    expect(txt).toContain('Seasoned with Salt');
    expect(txt).not.toContain('ll28-');
  });

  it('renders all three phase headings', () => {
    act(() => root.render(createElement(BiblicalTimeline)));
    const txt = container.textContent;
    expect(txt).toContain('Before Time');
    expect(txt).toContain('During Time');
    expect(txt).toContain('The End of Time');
  });
});
