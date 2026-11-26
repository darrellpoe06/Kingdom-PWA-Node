// @vitest-environment jsdom
// =============================================================================
// LearnStudioErrorBoundary: a crash in the experimental Learn preview must
// NEVER take down the rest of the app (post-incident, 2026-11-24 -- Darrell's
// wife: "None of the buttons in my installed FOS app are responding"). This
// proves the boundary catches a throw, falls back to classic Learn (onExit),
// remembers "off" so a reopen does not re-enter and re-crash, and -- the part
// that matters most -- leaves React able to render and react to clicks
// AFTER the crash, rather than a frozen tree.
// =============================================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { LearnStudioErrorBoundary } from '../components/learn-studio/LearnStudioPreview.jsx';
import { STUDIO_FLAG_KEY } from '../lib/learn-presentation/presentation.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
beforeEach(() => {
  window.localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  window.localStorage.clear();
});

function Bomb() {
  throw new Error('a lesson in the catalog has a shape the preview did not expect');
}

function Harness({ crash, onExit, afterCount }) {
  const [n, setN] = React.useState(0);
  return (
    <div>
      <button type="button" onClick={() => setN((x) => x + 1)}>
        rest of the app
      </button>
      <span data-testid="rest-count">{n}</span>
      <LearnStudioErrorBoundary onExit={onExit}>{crash ? <Bomb /> : <div>learn studio ok</div>}</LearnStudioErrorBoundary>
    </div>
  );
}

describe('LearnStudioErrorBoundary: a crash in the preview falls back, never freezes the app', () => {
  it('renders its children normally when nothing throws', () => {
    const onExit = vi.fn();
    act(() => root.render(<Harness crash={false} onExit={onExit} />));
    expect(container.textContent).toContain('learn studio ok');
    expect(onExit).not.toHaveBeenCalled();
  });

  it('on a throw: calls onExit (the fallback to classic Learn), remembers OFF, and the rest of the app keeps working', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onExit = vi.fn();
    act(() => root.render(<Harness crash={true} onExit={onExit} />));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(STUDIO_FLAG_KEY)).toBe('0');
    // THE REGRESSION ITSELF: the rest of the tree must still be interactive.
    const btn = container.querySelector('button');
    act(() => btn.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(container.querySelector('[data-testid="rest-count"]').textContent).toBe('1');
    err.mockRestore();
  });
});
