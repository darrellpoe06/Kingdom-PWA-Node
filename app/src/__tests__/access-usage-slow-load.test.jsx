// @vitest-environment jsdom
// Proven-to-catch for "Admin stuck on 'Loading access & usage…'" (Darrell
// 2026-07-22, 8 tabs open). The snapshot is timeout-bounded, but while it drags
// (the cross-tab auth-lock case) the loading state used to offer NO escape — no
// Refresh, no progress. This asserts the escape hatch appears so a steward is
// never stranded on a silent spinner (DR-0076 honest-states discipline).
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

// fetchAccessSnapshot hangs forever (a wedged tab holding navigator.locks); the
// component must still surface a way out.
vi.mock('../lib/access-metrics-sync.js', () => ({
  fetchAccessSnapshot: () => new Promise(() => {}),
  currentBuild: () => ({ sha: 'test', time: null }),
}));

import AccessUsageMetrics from '../components/AccessUsageMetrics.jsx';

let container;
let root;
afterEach(() => {
  try { act(() => root.unmount()); } catch { /* noop */ }
  container?.remove();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('AccessUsageMetrics — never strands on a silent Loading…', () => {
  it('reveals a Refresh escape after the slow threshold while the snapshot hangs', async () => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => { root.render(createElement(AccessUsageMetrics)); });

    // Loading immediately; NO escape yet (don't nag before it's actually slow).
    expect(container.textContent).toContain('Loading access');
    expect(container.querySelector('button')).toBeNull();

    // After ~4s the plain-language note + Refresh appear.
    await act(async () => { await vi.advanceTimersByTimeAsync(4100); });
    const btn = container.querySelector('button');
    expect(btn).not.toBeNull();
    expect(btn.textContent).toMatch(/Refresh/i);
    expect(container.textContent).toMatch(/taking longer than usual/i);
  });
});
