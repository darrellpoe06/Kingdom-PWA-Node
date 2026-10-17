// @vitest-environment jsdom
// =============================================================================
// The way in belongs in the header, not only on an admin tab (DR-1056)
// =============================================================================
// Darrell, 2026-10-15, with a screenshot of the Love Corner app's QR card:
// "This needs to be in the header...not just there... make sense?"
//
// The trace behind that: there are TWO app doors, and only one was in the
// header. InstallAppButton gets the app onto THIS phone and hides itself once
// installed — correct for what it does, and it means the steward standing in
// front of the congregation, who has the app, has no button at all. The code
// they actually want to show lived on five other surfaces, none of them the
// header.
//
// These cases pin the three things that could quietly go wrong:
//   1. the header offering the PoeTech join link to someone plainly standing
//      in the church — a code that installs the WRONG app is worse than none;
//   2. the share card being COPIED here rather than reused, which goes stale
//      the first time a door URL changes;
//   3. the install button being lost in the swap.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import AppDoorControls, { doorFor } from '../components/AppDoorControls.jsx';
import { SHARE_DOOR_URL } from '../lib/church-own-door.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(HERE, '..', rel), 'utf8');
const SHELL = read('poe-financial-mvp-v28.jsx');
const SELF = read('components/AppDoorControls.jsx');

let container; let root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  global.IS_REACT_ACT_ENVIRONMENT = true;
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('doorFor — the header never hands out the wrong app', () => {
  it('on a church surface it is the CHURCH door, by the one shared constant', () => {
    const d = doorFor(true);
    expect(d.url).toBe(SHARE_DOOR_URL);
    // Not a second hardcoded string: the value must be the module's own.
    expect(SELF.includes("'https://poetech.us/lovecorner"), 'the URL is hardcoded here instead of imported').toBe(false);
    expect(d.shown).toBe('poetech.us/lovecorner');
    expect(d.title).toMatch(/Love Corner/);
  });

  it('off a church surface it falls back to the platform join URL', () => {
    const d = doorFor(false);
    // null means "let AppShareQR use appJoinUrl()" — the existing behaviour of
    // every caller that passes nothing. Never a guessed string.
    expect(d.url).toBe(null);
    expect(d.shown).toBe(null);
    expect(d.title).not.toMatch(/Love Corner/);
  });

  it('every door names itself on the button, so the label is never generic', () => {
    for (const church of [true, false]) {
      const d = doorFor(church);
      expect(d.label.length).toBeGreaterThan(3);
      expect(d.ariaLabel).toMatch(/QR code/);
      expect(d.blurb.length).toBeGreaterThan(40);
    }
  });
});

describe('the card is REUSED, not copied', () => {
  it('renders the shared AppShareQR rather than its own QR', () => {
    expect(SELF).toMatch(/import AppShareQR from '\.\/AppShareQR\.jsx'/);
    // A second QR implementation here is the stale-copy failure. qrcode.react
    // belongs to AppShareQR alone.
    expect(SELF.includes('qrcode.react'), 'a second QR renderer was added').toBe(false);
  });

  it('keeps the install button — the swap must not lose it', () => {
    expect(SELF).toMatch(/import InstallAppButton from '\.\/InstallAppButton\.jsx'/);
    expect(SELF).toMatch(/<InstallAppButton \/>/);
  });
});

describe('the shell', () => {
  it('renders it in the header, on every tab, with the church flag', () => {
    expect(SHELL).toMatch(/<AppDoorControls church=\{churchBrand \|\| view === 'church'\}/);
    // And the old direct render is gone, or the install button would double.
    expect(SHELL.includes('<InstallAppButton />'), 'the shell still renders InstallAppButton directly').toBe(false);
  });

  it('THE SHELL DID NOT GROW — one line out, one line in', () => {
    // poe-financial-mvp-v28.jsx is frozen and may only shrink
    // (monolith-budget-guard). That constraint is WHY these two controls are
    // one component: a new header line would have failed the gate.
    const budget = JSON.parse(read('../../scripts/monolith-budget.json'));
    const live = SHELL.split('\n').length - (SHELL.endsWith('\n') ? 1 : 0);
    expect(live).toBeLessThanOrEqual(budget.budget);
  });
});

describe('it renders, and the card is behind one tap', () => {
  it('shows the install control and a share button, closed to start', () => {
    act(() => root.render(createElement(AppDoorControls, { church: true })));
    const share = [...container.querySelectorAll('button')]
      .find((b) => (b.getAttribute('aria-label') || '').includes('Share our app'));
    expect(share, 'the share button did not render').toBeTruthy();
    // Nothing is shown until asked — the header stays a header.
    expect(container.textContent).not.toMatch(/poetech\.us\/lovecorner/);
  });

  it('one tap opens the church code, with the church words', () => {
    act(() => root.render(createElement(AppDoorControls, { church: true })));
    const share = [...container.querySelectorAll('button')]
      .find((b) => (b.getAttribute('aria-label') || '').includes('Share our app'));
    act(() => share.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    const text = document.body.textContent;
    expect(text).toMatch(/poetech\.us\/lovecorner/);
    expect(text).toMatch(/The Love Corner app/);
    // And the promise the card has always carried travels with it.
    expect(text).toMatch(/doesn’t grant access/);
  });

  it('off the church door it opens the platform card, not the church one', () => {
    act(() => root.render(createElement(AppDoorControls, { church: false })));
    const share = [...container.querySelectorAll('button')]
      .find((b) => (b.getAttribute('aria-label') || '').includes('Share app'));
    expect(share).toBeTruthy();
    act(() => share.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(document.body.textContent).not.toMatch(/poetech\.us\/lovecorner/);
  });
});
