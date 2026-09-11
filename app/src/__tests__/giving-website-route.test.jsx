// =============================================================================
// The Give panel's website route — it says where the giving page actually is.
//
// Darrell, 2026-09-11, opening this button in front of the COLG leadership:
//   "And, actually, this should go straight to the pay page... is this the pay
//    page? Mm-mm. No. That's not the pay page. So we wanted to go to the actual
//    Menu, and then Tithes and Offering guest page. This is the link we need."
//
// The exact URL is not in the repo, and this project's binding rule is that a
// giving URL is NEVER invented. So the fix is to stop dropping someone on a
// homepage with no directions. These pin that — and pin that the directions
// RETIRE THEMSELVES the moment a real deep-link is set, so the app never tells
// someone to go hunting a menu it already opened for them.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { resolveGiveDestination } from '../lib/giving.js';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';
import { ChurchGivePanel } from '../components/ChurchGiving.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('resolveGiveDestination — directions while the link is only the site root', () => {
  it('carries the menu path when the button lands on the homepage', () => {
    const d = resolveGiveDestination(COLG_DEFAULT_CHURCH);
    expect(d.confirmed).toBe(false);
    expect(d.hint).toBe('On the church website: Menu → Tithes and Offering');
    expect(d.note).toMatch(/one step in/);
    expect(d.note).toMatch(/Tithes and Offering/);
  });

  it('DROPS the directions once a real giving deep-link is set', () => {
    // The hint exists because the button lands short. A deep-link IS the giving
    // page, so repeating "now find the menu" would be wrong, not merely noisy.
    const d = resolveGiveDestination({
      ...COLG_DEFAULT_CHURCH,
      links: { ...COLG_DEFAULT_CHURCH.links, give: 'https://thechurchofthelivinggod.com/tithes-and-offering' },
    });
    expect(d.confirmed).toBe(true);
    expect(d.hint).toBeNull();
    expect(d.note).not.toMatch(/one step in/);
  });

  it('never invents a URL — it still only ever points at what the record holds', () => {
    const d = resolveGiveDestination(COLG_DEFAULT_CHURCH);
    expect(d.url).toBe(COLG_DEFAULT_CHURCH.links.give);
    expect(resolveGiveDestination({ name: 'Somewhere Else' }).url).toBeNull();
  });

  it('has no hint for a church that never gave one', () => {
    const d = resolveGiveDestination({ site: 'https://example.org', links: {} });
    expect(d.hint).toBeNull();
    expect(d.note).toMatch(/where their secure giving page is published/);
  });
});

describe('the real Give panel', () => {
  let container, root;
  beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  const mount = (church) => act(() => {
    root.render(createElement(ChurchGivePanel, { church, onClose() {} }));
  });

  it('stops calling the homepage "more ways to give" and says what it really is', () => {
    mount(COLG_DEFAULT_CHURCH);
    expect(container.textContent).toContain('Church website — giving page is one step in');
    expect(container.textContent).toContain('Menu → Tithes and Offering');
    expect(container.textContent).toMatch(/not the giving page itself/);
  });

  it('reads as the giving page once the office supplies the direct link', () => {
    mount({ ...COLG_DEFAULT_CHURCH, links: { ...COLG_DEFAULT_CHURCH.links, give: 'https://thechurchofthelivinggod.com/tithes-and-offering' } });
    expect(container.textContent).toContain('Give on the church website');
    expect(container.textContent).not.toContain('Menu → Tithes and Offering');
    expect(container.textContent).not.toMatch(/not the giving page itself/);
  });

  it('still leads with the four channels that ARE direct', () => {
    mount(COLG_DEFAULT_CHURCH);
    for (const label of ['Zelle', 'Cash App', 'Givelify', 'PayPal']) {
      expect(container.textContent).toContain(label);
    }
  });
});
