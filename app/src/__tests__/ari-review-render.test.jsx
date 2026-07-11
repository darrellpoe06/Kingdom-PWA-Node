// =============================================================================
// ari-review-render.test.jsx — the comprehensive-review surface mounts and shows
// the real, dimensional read (proven-to-catch the render + the drift signal)
// =============================================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import AriReview from '../components/AriReview.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
beforeEach(() => {
  document.body.innerHTML = '';
  try { window.localStorage.clear(); } catch { /* noop */ }
});

function mount(props) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => { root.render(createElement(AriReview, props)); });
  return host;
}

describe('AriReview — the surface renders the five dimensions', () => {
  it('shows every dimension label and an honest headline on empty data', () => {
    const host = mount({ concerns: [], feedback: [] });
    const text = host.textContent;
    expect(text).toContain('comprehensive review');
    for (const label of ['Delivery integrity', 'Plan health', 'Review freshness', 'Concern & feedback backlog', 'Data integrity']) {
      expect(text).toContain(label);
    }
  });

  it('surfaces a real open-concern backlog finding from the props (not painted)', () => {
    const host = mount({ concerns: [{ status: 'open', concern: 'x' }], feedback: [] });
    expect(host.textContent).toMatch(/1 concern open/);
    expect(host.textContent).toContain('Start or schedule the open concerns');
    // and the top-actions strip surfaces it
    expect(host.textContent).toContain('Pull these next');
  });

  it('reports clear (not a painted score) when nothing is open', () => {
    const host = mount({ concerns: [], feedback: [] });
    expect(host.textContent).toMatch(/clean — no open findings/);
    expect(host.textContent).not.toMatch(/Pull these next/);
  });
});
