// help-walkthrough-church-door.test.jsx — the PoeTech quick tour NEVER offers
// itself inside the church door (DR-0261 follow-up; Darrell's 2026-08-01
// screenshot: the installed Love Corner app opened onto "WELCOME TO POETECH —
// The quick tour" introducing money/business/CRM surfaces a congregation
// member doesn't have). Proven-to-catch both ways: the family boot still gets
// the offer; a church-door boot gets NOTHING from this component.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import HelpWalkthrough from '../components/HelpWalkthrough.jsx';

let container, root;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(HelpWalkthrough, {}));
  });
}
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  try { window.localStorage.removeItem('poetech.help.tour.v1'); } catch (e) { /* ignore */ }
  window.history.replaceState({}, '', '/');
});

describe('HelpWalkthrough — church door never sees the PoeTech tour', () => {
  it('offers the tour card on a normal (family) boot', async () => {
    window.history.replaceState({}, '', '/');
    await mount();
    expect(container.textContent).toContain('New here?');
  });

  it('renders NOTHING on a church-door boot (?lovecorner=1 — the installed Love Corner app)', async () => {
    window.history.replaceState({}, '', '/?lovecorner=1');
    await mount();
    expect(container.textContent).toBe('');
  });
});
