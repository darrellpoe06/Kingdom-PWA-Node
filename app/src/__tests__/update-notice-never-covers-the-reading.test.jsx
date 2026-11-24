// @vitest-environment jsdom
// THE UPDATE NOTICE NEVER COVERS THE READING (Darrell 2026-11-24).
// =============================================================================
// The DR-1503 line ("A newer version of the app is ready...") was pinned
// across the top of the page, over the lesson being read: "Can't see the
// reading when a new update is available, find another way to give a notice
// without undermining the lessons live." Where the bar is mounted the notice
// is now ONE bar button; the pinned line stays only as the fallback for a
// page with no bar. The tap is the same loadUpdateNow either way.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChromeDock from '../components/ChromeDock.jsx';
import { UpdatePrompt } from '../components/PwaPrompts.jsx';
import { offerUpdateWhileReading, useReadingHold, resetUpdateWhileReadingForTests, UPDATE_READY_WORDS } from '../lib/update-while-reading.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let stops = 0;
function Reader() {
  useReadingHold(true, () => {
    stops += 1;
  });
  return null;
}

let host, root;
beforeEach(() => {
  stops = 0;
  resetUpdateWhileReadingForTests();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  resetUpdateWhileReadingForTests();
});
const q = (sel) => host.querySelector(sel);

describe('a newer version waiting on a reading', () => {
  it('with the bar mounted: one bar button says it, and nothing is pinned over the page', async () => {
    await act(async () =>
      root.render(createElement('div', null, createElement(Reader), createElement(UpdatePrompt), createElement(ChromeDock, { onFeedback: () => {} })))
    );
    expect(q('[data-testid="dock-update-ready"]')).toBeNull(); // drawn only while an update waits
    let reloads = 0;
    await act(async () => {
      offerUpdateWhileReading({
        key: 'build-a',
        reload: () => {
          reloads += 1;
        },
        cancel: () => {},
      });
    });
    const btn = q('[data-testid="chrome-dock"] [data-testid="dock-update-ready"]');
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-label')).toBe(UPDATE_READY_WORDS);
    expect(btn.className).toMatch(/min-h-\[44px\]/);
    expect(q('[data-testid="update-ready-line"]')).toBeNull(); // the line that covered the words
    expect(q('.update-ready')).toBeNull();
    await act(async () => btn.click());
    expect(stops).toBe(1); // the reading stopped cleanly first
    expect(reloads).toBe(1); // the page reloads here in the real app
  });
  it('PROVEN-TO-CATCH: with no bar on the page the line still says it (never silent, DR-1503)', async () => {
    await act(async () => root.render(createElement('div', null, createElement(Reader), createElement(UpdatePrompt))));
    await act(async () => {
      offerUpdateWhileReading({ key: 'build-b', reload: () => {}, cancel: () => {} });
    });
    expect(q('[data-testid="update-ready-line"]').textContent).toBe(UPDATE_READY_WORDS);
  });
});
