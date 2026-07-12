// =============================================================================
// TabHelp — the "How to use this tab" short walkthrough (DP 2026-07-12)
// =============================================================================
// "No stress for the staff." PROVEN-TO-CATCH: the guide is an OPTION (collapsed
// until asked), it reveals the ordered steps on demand, and an empty step list
// renders nothing (never an empty "?" affordance).
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
import TabHelp from '../components/TabHelp.jsx';

let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(TabHelp, props)); });
}
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; });
const btn = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent));

describe('TabHelp — an optional, on-demand walkthrough', () => {
  it('starts collapsed (an option, not in the way) and reveals the steps when opened', async () => {
    await mount({ title: 'How to use X', steps: ['First do this', 'Then do that'] });
    // collapsed: the steps are not shown yet
    expect(container.textContent).not.toContain('First do this');
    const toggle = btn(/how to use x/i);
    expect(toggle).toBeTruthy();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    await act(async () => { toggle.click(); });
    expect(container.textContent).toContain('First do this');
    expect(container.textContent).toContain('Then do that');
    expect(container.querySelectorAll('ol li')).toHaveLength(2);
  });

  it('renders nothing when there are no steps (no empty affordance)', async () => {
    await mount({ title: 'Empty', steps: [] });
    expect(container.querySelector('button')).toBeNull();
  });
});
