// =============================================================================
// TVTime — live render proof PoeTech TV Time works (Darrell 2026-07-04, the
// friend-group demand). Mounts the real component, tracks a show, opens the
// discussion, posts a comment, and laughs together (a reaction) — all device-
// local, no network.
// =============================================================================
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import TVTime from '../components/TVTime.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => { try { localStorage.clear(); } catch { /* noop */ } });
afterEach(() => {
  try { act(() => root && root.unmount()); } catch { /* noop */ }
  if (container) container.remove();
  container = null; root = null;
});

const tick = () => act(async () => { await Promise.resolve(); });
async function mount(props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(TVTime, { email: 'fan@example.com', ...props })); });
  await tick();
}
const setValue = (el, val) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, val);
  el.dispatchEvent(new window.Event('input', { bubbles: true }));
};
const click = async (el) => { await act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); }); await tick(); };
const btnByText = (re) => [...container.querySelectorAll('button')].find((b) => re.test((b.textContent || '').trim()));

describe('PoeTech TV Time', () => {
  it('opens with the title and the honest circle note', async () => {
    await mount();
    const text = container.textContent || '';
    expect(text).toMatch(/PoeTech TV Time/);
    expect(text).toMatch(/Live group sync/);          // honest: coming next
    expect(text).toMatch(/Quick add/);
  });

  it('tracks a show, opens the talk, posts a comment, and laughs together', async () => {
    await mount();
    // quick-add a seed show → it moves into a tracked section with a status control
    await click(btnByText(/^\+ The Real Housewives$/));
    expect(container.querySelector('select[id^="st-"]'), 'the tracked show has a status control').toBeTruthy();
    // open its discussion
    await click(btnByText(/^Talk/));
    expect(container.textContent).toMatch(/Watch it through The Way/);   // the discernment prompt
    // post a comment
    const input = container.querySelector('input[id^="cm-"]');
    setValue(input, 'This reunion was EVERYTHING');
    await click(btnByText(/^Post$/));
    expect(container.textContent).toContain('This reunion was EVERYTHING');
    // laugh together — a reaction toggles on and counts
    await click(btnByText(/^Laughed$/));
    expect(btnByText(/^Laughed 1$/), 'the laugh reaction counts').toBeTruthy();
  });

  it('adds a custom show by title', async () => {
    await mount();
    setValue(container.querySelector('#tv-new'), 'Our Home Church Live');
    await click(btnByText(/^Add$/));
    expect(container.textContent).toContain('Our Home Church Live');
  });
});
