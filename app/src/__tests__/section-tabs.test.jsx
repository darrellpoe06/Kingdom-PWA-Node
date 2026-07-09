// SectionTabs — proves the "sliding tabs instead of a long scroll" primitive:
// only the ACTIVE section's content is mounted, clicking (or Arrow-keying) a tab
// swaps which section shows, and the strip is a real WAI-ARIA tablist. This is the
// reusable component the Admin report (and other long tabs) adopt. (Darrell
// 2026-07-04: "sliding tabs for all tabs instead of a long scroll... you feel like
// you can get where you want.")
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import SectionTabs from '../components/SectionTabs.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
const tick = () => act(async () => { await Promise.resolve(); });
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); });
afterEach(() => { try { act(() => root && root.unmount()); } catch { /* noop */ } container.remove(); container = null; root = null; });

const SECTIONS = [
  { id: 'a', label: 'First', icon: 'users', render: () => createElement('p', null, 'ALPHA-BODY') },
  { id: 'b', label: 'Second', icon: 'monitor', render: () => createElement('p', null, 'BETA-BODY') },
  { id: 'c', label: 'Third', render: () => createElement('p', null, 'GAMMA-BODY') },
];

async function mount(props = {}) {
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(SectionTabs, { sections: SECTIONS, ariaLabel: 'Test sections', idBase: 't', ...props }));
  });
  await tick();
}
const tabByLabel = (label) => [...container.querySelectorAll('[role="tab"]')].find((b) => (b.textContent || '').includes(label));

describe('SectionTabs — one section at a time, swipeable strip', () => {
  it('renders a tablist and mounts ONLY the first section by default', async () => {
    await mount();
    expect(container.querySelector('[role="tablist"]')).toBeTruthy();
    expect(container.querySelectorAll('[role="tab"]').length).toBe(3);
    const text = container.textContent || '';
    expect(text).toContain('ALPHA-BODY');   // active
    expect(text).not.toContain('BETA-BODY'); // inactive not mounted (lazy)
    expect(text).not.toContain('GAMMA-BODY');
  });

  it('marks the active tab aria-selected and gives it the roving tabindex', async () => {
    await mount();
    expect(tabByLabel('First').getAttribute('aria-selected')).toBe('true');
    expect(tabByLabel('First').getAttribute('tabindex')).toBe('0');
    expect(tabByLabel('Second').getAttribute('aria-selected')).toBe('false');
    expect(tabByLabel('Second').getAttribute('tabindex')).toBe('-1');
    // The panel is wired to its tab for screen readers.
    const panel = container.querySelector('[role="tabpanel"]');
    expect(panel.getAttribute('aria-labelledby')).toBe('t-tab-a');
    expect(panel.id).toBe('t-panel-a');
  });

  it('clicking a tab swaps the mounted section (no long scroll — you jump there)', async () => {
    await mount();
    await act(async () => { tabByLabel('Second').dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
    await tick();
    const text = container.textContent || '';
    expect(text).toContain('BETA-BODY');
    expect(text).not.toContain('ALPHA-BODY');
    expect(tabByLabel('Second').getAttribute('aria-selected')).toBe('true');
  });

  it('ArrowRight moves selection along the strip (keyboard slide)', async () => {
    await mount();
    await act(async () => { tabByLabel('First').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); });
    await tick();
    expect(container.textContent).toContain('BETA-BODY');
    expect(tabByLabel('Second').getAttribute('aria-selected')).toBe('true');
  });

  it('honors defaultId, and renders nothing when there are no sections', async () => {
    await mount({ defaultId: 'c' });
    expect(container.textContent).toContain('GAMMA-BODY');
    await act(() => root.render(createElement(SectionTabs, { sections: [] })));
    await tick();
    expect(container.querySelector('[role="tablist"]')).toBeNull();
  });
});
