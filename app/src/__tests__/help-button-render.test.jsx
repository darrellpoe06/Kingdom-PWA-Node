// =============================================================================
// HelpButton — live render proof (Verification Doctrine: observe the REAL "?").
// Mounts the actual help affordance in jsdom and proves what Darrell asked for:
// a discrete "?" that, when clicked, shows REAL help for THAT surface (what /
// how / why), is context-aware across tabs, opens the user roadmap, and can
// navigate. This is the durable replacement for a one-off preview screenshot —
// it proves the "?" shows real help on several tabs, every CI run.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import HelpButton from '../components/HelpButton.jsx';
import { HELP } from '../lib/help-content.js';

let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(HelpButton, props));
  });
}
const findButton = (re) =>
  [...document.body.querySelectorAll('button')].find((b) => re.test(b.textContent));
async function click(el) { await act(async () => { el.click(); }); }

beforeEach(() => { /* fresh */ });
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  document.body.style.overflow = '';
});

describe('the "?" is discrete until used', () => {
  it('renders only a small "?" trigger, no dialog, before it is tapped', async () => {
    await mount({ variant: 'header', view: 'forecast' });
    const trigger = document.body.querySelector('button[aria-label]');
    expect(trigger).toBeTruthy();
    expect(trigger.textContent.trim()).toBe('?');
    // Nothing intrusive is open yet.
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });
});

describe('the "?" shows REAL help for the current tab (context-aware)', () => {
  it('Forecast: opens a dialog with the real what / how / why', async () => {
    await mount({ variant: 'header', view: 'forecast' });
    await click(document.body.querySelector('button[aria-label]'));
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    const text = document.body.textContent;
    // attributed to Ari (the one A.I. identity)
    expect(text).toMatch(/Ari/);
    // the real surface name + the real help content from the registry
    expect(text).toContain('Forecast');
    expect(text).toContain('How to use it');
    expect(text).toContain('Why it matters');
    expect(text).toContain(HELP.forecast.why.slice(0, 24));
  });

  it('Choir (a church sub-tab): the SAME button explains the right surface', async () => {
    await mount({ variant: 'header', view: 'church', churchView: 'choir' });
    await click(document.body.querySelector('button[aria-label]'));
    const text = document.body.textContent;
    expect(text).toContain('Choir');
    expect(text).toContain(HELP['church:choir'].what.slice(0, 24));
  });

  it('Transactions (a books sub-tab): resolves to the books:<sub> help', async () => {
    await mount({ variant: 'header', view: 'books', booksView: 'transactions' });
    await click(document.body.querySelector('button[aria-label]'));
    const text = document.body.textContent;
    expect(text).toContain('Transactions');
    expect(text).toContain(HELP['books:transactions'].what.slice(0, 24));
  });

  it('inline variant explains its explicit topic', async () => {
    await mount({ variant: 'inline', topic: 'inventory' });
    await click(document.body.querySelector('button[aria-label]'));
    const text = document.body.textContent;
    expect(text).toContain('Inventory');
    expect(text).toContain(HELP.inventory.why.slice(0, 24));
  });
});

describe('the help opens the user roadmap and can navigate', () => {
  it('shows "how this area works" and the roadmap steps, then navigates', async () => {
    let navigatedTo = null;
    await mount({
      variant: 'header',
      view: 'forecast',
      setView: (v) => { navigatedTo = v; },
    });
    await click(document.body.querySelector('button[aria-label]'));
    // Into the section roadmap...
    const areaBtn = findButton(/how .*works/i);
    expect(areaBtn).toBeTruthy();
    await click(areaBtn);
    // A roadmap step (e.g. "Big Picture →") is now offered...
    const stepBtn = findButton(/Big Picture/i);
    expect(stepBtn).toBeTruthy();
    // ...and tapping it drives the app's navigation.
    await click(stepBtn);
    expect(navigatedTo).toBe('overview');
    // navigating closes the sheet (acts in place)
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });

  it('falls back to the whole-app roadmap when a view has no help', async () => {
    await mount({ variant: 'header', view: 'no-such-view' });
    await click(document.body.querySelector('button[aria-label]'));
    const text = document.body.textContent;
    expect(text).toMatch(/How this app works/i);
  });
});
