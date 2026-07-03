// surface-boundary (DR-0090) — one broken surface can never white-screen the app.
// Mounts the REAL boundary in jsdom (Verification Doctrine: observe behavior,
// not just logic) and proves the break-it path: a child that throws during
// render degrades to the inline card, the sibling content SURVIVES, the error
// lands in the journal, and "Try again" re-attempts the render. The healthy
// path stays untouched (children render through).
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { SurfaceBoundary, withSurfaceBoundary } from '../lib/surface-boundary.jsx';
import { readErrorJournal, clearErrorJournal } from '../lib/error-journal.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// React logs caught errors loudly; keep the test output readable.
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  clearErrorJournal(window);
});

function Bomb({ arm }) {
  if (arm) throw new Error('deliberate surface explosion');
  return createElement('div', null, 'healthy surface content');
}

async function mount(node) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let root;
  await act(async () => {
    root = createRoot(container);
    root.render(node);
  });
  return { container, root };
}

describe('SurfaceBoundary — crash containment (proven-to-catch)', () => {
  it('healthy path: children render through, no card', async () => {
    const { container } = await mount(
      createElement(SurfaceBoundary, { label: 'Voice' }, createElement(Bomb, { arm: false })),
    );
    expect(container.innerHTML).toContain('healthy surface content');
    expect(container.innerHTML).not.toContain('hit an error');
  });

  it('a throwing surface degrades to the inline card and the SIBLING SURVIVES (no white screen)', async () => {
    const { container } = await mount(
      createElement('div', null,
        createElement('nav', null, 'the nav is still here'),
        createElement(SurfaceBoundary, { label: 'Voice' }, createElement(Bomb, { arm: true })),
      ),
    );
    expect(container.innerHTML).toContain('Voice hit an error');
    expect(container.innerHTML).toContain('every other tab still works');
    expect(container.innerHTML).toContain('the nav is still here'); // containment, not unwind
    expect(container.innerHTML).not.toContain('healthy surface content');
  });

  it('the catch is RECORDED to the error journal (kind render, surface-scoped source)', async () => {
    await mount(
      createElement(SurfaceBoundary, { label: 'Voice' }, createElement(Bomb, { arm: true })),
    );
    const journal = readErrorJournal(window);
    expect(journal).toHaveLength(1);
    expect(journal[0]).toMatchObject({
      source: 'surface:Voice',
      kind: 'render',
      message: 'deliberate surface explosion',
    });
  });

  it('"Try again" resets the boundary and re-renders the child', async () => {
    let arm = true;
    function Flaky() { return createElement(Bomb, { arm }); }
    const { container } = await mount(
      createElement(SurfaceBoundary, { label: 'Voice' }, createElement(Flaky)),
    );
    expect(container.innerHTML).toContain('Voice hit an error');
    arm = false; // the transient condition clears
    const tryAgain = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Try again');
    await act(async () => { tryAgain.click(); });
    expect(container.innerHTML).toContain('healthy surface content');
  });

  it('withSurfaceBoundary wraps a component with props flowing through', async () => {
    function Named({ who }) { return createElement('span', null, `hello ${who}`); }
    const Wrapped = withSurfaceBoundary(Named, 'Greeting');
    expect(Wrapped.displayName).toBe('Bounded(Greeting)');
    const { container } = await mount(createElement(Wrapped, { who: 'family' }));
    expect(container.innerHTML).toContain('hello family');
  });

  it('journal storage being blocked does not break the containment card', async () => {
    // Poison localStorage AFTER clear: recording fails silently, the card still shows.
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('blocked'); } });
    try {
      const { container } = await mount(
        createElement(SurfaceBoundary, { label: 'Voice' }, createElement(Bomb, { arm: true })),
      );
      expect(container.innerHTML).toContain('Voice hit an error');
    } finally {
      Object.defineProperty(window, 'localStorage', original);
    }
  });
});
