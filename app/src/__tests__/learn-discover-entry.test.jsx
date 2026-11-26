// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import LearnDiscoverEntry from '../components/learn-discover/LearnDiscoverEntry.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root = null;
let host = null;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (host) host.remove();
  root = host = null;
});
async function mount(props = {}) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  const getBook = async () => ({ name: 'Matthew', chapters: [Array.from({ length: 60 }, (_, i) => `v${i}`)] });
  await act(async () => {
    root.render(
      createElement(LearnDiscoverEntry, {
        renderLearn: () => createElement('div', { 'data-testid': 'the-real-learn' }),
        places: [],
        getBook,
        now: new Date(2026, 10, 26),
        search: '',
        ...props,
      })
    );
  });
  await act(async () => {
    await Promise.resolve();
  });
}

describe('the discovery entry', () => {
  it('opens on the discovery page, not on Learn', async () => {
    await mount();
    expect(host.querySelector('[data-testid=learn-discover]')).toBeTruthy();
    expect(host.querySelector('[data-testid=the-real-learn]')).toBeNull();
  });
  it('Browse All Lessons mounts the existing Learn, and Back returns to discovery', async () => {
    await mount();
    const b = [...host.querySelectorAll('button')].find((x) => x.textContent === 'Browse All Lessons');
    await act(async () => b.click());
    expect(host.querySelector('[data-testid=the-real-learn]')).toBeTruthy();
    await act(async () => host.querySelector('[data-testid=ld-back]').click());
    expect(host.querySelector('[data-testid=learn-discover]')).toBeTruthy();
  });
  it('a link that names a course or lesson goes straight to Learn, as it does today', async () => {
    await mount({ search: '?view=church&sub=learn&course=living-lessons&lesson=ll2-the-energy-you-were-given' });
    expect(host.querySelector('[data-testid=the-real-learn]')).toBeTruthy();
    expect(host.querySelector('[data-testid=learn-discover]')).toBeNull();
  });
});
