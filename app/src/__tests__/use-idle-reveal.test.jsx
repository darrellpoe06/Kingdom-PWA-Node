// @vitest-environment jsdom
// Pins the floating-control idle-reveal behavior (Darrell 2026-07-14: the
// Feedback + read-aloud buttons "move out the way after a certain amount of time
// and come up when the users move the screen"). Proven-to-catch: visible at rest,
// hides after the idle window, re-reveals on scroll.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useIdleReveal } from '../lib/use-idle-reveal.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => { vi.useRealTimers(); });

function Probe({ idleMs }) {
  const visible = useIdleReveal({ idleMs });
  return createElement('span', { 'data-visible': visible ? '1' : '0' }, visible ? 'shown' : 'hidden');
}

describe('useIdleReveal', () => {
  it('starts visible, hides after the idle window, re-reveals on scroll', async () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    document.body.appendChild(container);
    let root;
    await act(async () => { root = createRoot(container); root.render(createElement(Probe, { idleMs: 3000 })); });
    const span = () => container.querySelector('span');
    expect(span().getAttribute('data-visible')).toBe('1'); // visible at rest

    await act(async () => { vi.advanceTimersByTime(3001); }); // idle past the window
    expect(span().getAttribute('data-visible')).toBe('0'); // settled out of the way

    await act(async () => { window.dispatchEvent(new Event('scroll')); }); // user moves the screen
    expect(span().getAttribute('data-visible')).toBe('1'); // gentle reminder — it's back

    await act(async () => { root.unmount(); });
    container.remove();
  });
});
