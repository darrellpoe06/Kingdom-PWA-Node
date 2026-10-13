// TimelineGame — proves the ordering game reads the real spine, accepts the
// correct next era, rejects a wrong pick, and reaches the win state in true order.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import TimelineGame from '../components/games/TimelineGame.jsx';
import { listEpochs } from '../lib/biblical-timeline.js';

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

const clickEra = (era) => {
  const btn = [...container.querySelectorAll('button')].find((b) => b.textContent.includes(era));
  if (!btn) throw new Error(`no button for era "${era}"`);
  act(() => btn.dispatchEvent(new MouseEvent('click', { bubbles: true })));
};

describe('TimelineGame', () => {
  it('mounts with the prompt and the true first era among the choices', () => {
    act(() => root.render(createElement(TimelineGame)));
    expect(container.textContent).toContain('Yahweh’s Story, in order');
    expect(container.textContent).toContain('Which comes next?');
    expect(container.textContent).toContain(listEpochs()[0].era); // "Before Time"
  });

  it('accepts the correct next era and rejects a wrong one', () => {
    act(() => root.render(createElement(TimelineGame)));
    const eras = listEpochs().map((e) => e.era);
    // A wrong pick first (the LAST era can never be first) -> feedback, not placed.
    clickEra(eras[eras.length - 1]);
    expect(container.textContent).toContain('Not yet');
    // Now the correct first era -> placed (row "1." appears).
    clickEra(eras[0]);
    expect(container.textContent).toContain(`1. `);
  });

  it('reaches the win state when placed in true order, and marks you-are-here', () => {
    act(() => root.render(createElement(TimelineGame)));
    for (const e of listEpochs()) clickEra(e.era);
    expect(container.textContent).toContain('The whole story, in order');
    expect(container.textContent).toContain('You are here');
    expect(container.textContent).toContain('Play again');
  });
});
