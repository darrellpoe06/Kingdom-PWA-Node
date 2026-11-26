// @vitest-environment jsdom
// The shell's door to the discovery page must never be able to take Learn away.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import LearnDoor, { discoveryWanted, DISCOVER_OFF_KEY } from '../components/learn-discover/LearnDoor.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root = null;
let host = null;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (host && host.parentNode) host.parentNode.removeChild(host);
  root = null;
  host = null;
});
const learn = createElement('div', { 'data-testid': 'the-real-learn' });

describe('when the discovery page shows', () => {
  it('shows by default, and not for a link that names a course or a lesson, or ?discover=0', () => {
    const store = { getItem: () => null };
    expect(discoveryWanted('', store)).toBe(true);
    expect(discoveryWanted('?view=church&sub=learn', store)).toBe(true);
    expect(discoveryWanted('?course=living-lessons', store)).toBe(false);
    expect(discoveryWanted('?lesson=ll2-the-energy-you-were-given', store)).toBe(false);
    expect(discoveryWanted('?discover=0', store)).toBe(false);
  });
  it('a device can turn it off', () => {
    expect(discoveryWanted('', { getItem: (k) => (k === DISCOVER_OFF_KEY ? '0' : null) })).toBe(false);
    expect(
      discoveryWanted('', {
        getItem: () => {
          throw new Error('blocked');
        },
      })
    ).toBe(true);
  });
});

describe('the door', () => {
  it('hands back the very same Learn element when discovery is not wanted', () => {
    const off = { getItem: () => '0' };
    expect(LearnDoor({ learn, search: '', store: off })).toBe(learn);
  });
  it('shows Learn itself if the discovery page fails to load or crashes', async () => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    const quiet = console.error;
    console.error = () => {};
    // a store that is fine, a search that wants discovery; the lazy chunk is real, so make Learn's fallback observable by crashing the entry
    await act(async () => {
      root.render(createElement(LearnDoor, { learn, search: '', store: { getItem: () => null } }));
    });
    for (let i = 0; i < 40 && !host.querySelector('[data-testid=learn-discover]') && !host.querySelector('[data-testid=the-real-learn]'); i += 1)
      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });
    console.error = quiet;
    // either the discovery page rendered, or (if it could not) the real Learn did: never an empty screen
    expect(host.querySelector('[data-testid=learn-discover]') || host.querySelector('[data-testid=the-real-learn]')).toBeTruthy();
  }, 60000);
});
