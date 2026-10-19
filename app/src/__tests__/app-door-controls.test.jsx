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
import AppDoorControls, { doorFor, doorKeyFor } from '../components/AppDoorControls.jsx';
import { SHARE_DOOR_URL } from '../lib/church-own-door.js';
import { TLC_SHARE_URL } from '../lib/tlc-door.js';
import { MOORE_SHARE_URL } from '../lib/moore-door.js';
import { PROPERTIES_SHARE_URL } from '../modules/properties/config.js';
import { DOORS } from '../lib/app-doors.js';

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
    const d = doorFor('lovecorner');
    expect(d.url).toBe(SHARE_DOOR_URL);
    // Not a second hardcoded string: the value must be the module's own.
    expect(SELF.includes("'https://poetech.us/lovecorner"), 'the URL is hardcoded here instead of imported').toBe(false);
    expect(d.shown).toBe('poetech.us/lovecorner');
    expect(d.title).toMatch(/Love Corner/);
  });

  it('PoeTech falls back to the platform join URL, and never names the church', () => {
    const d = doorFor('poetech');
    // null means "let AppShareQR use appJoinUrl()" — the existing behaviour of
    // every caller that passes nothing. Never a guessed string.
    expect(d.url).toBe(null);
    expect(d.shown).toBe(null);
    expect(d.title).toMatch(/PoeTech/);
    expect(d.title).not.toMatch(/Love Corner/);
  });

  it('every app shares ITSELF, by its own door\'s constant (DR-1112)', () => {
    expect(doorFor('tlc').url).toBe(TLC_SHARE_URL);
    expect(doorFor('moore').url).toBe(MOORE_SHARE_URL);
    expect(doorFor('properties').url).toBe(PROPERTIES_SHARE_URL);
    expect(doorFor('tlc').title).toMatch(/TLC/);
    expect(doorFor('moore').title).toMatch(/Moore/);
    expect(doorFor('properties').title).toMatch(/Properties/);
    // Every door the app can boot as has a share of its own — a new door that
    // lacks one would silently fall back to PoeTech's.
    for (const d of DOORS) expect(doorFor(d.key).key, `${d.key} has no share card`).toBe(d.key);
    // And an unknown key is PoeTech's own door, never another app's.
    expect(doorFor('nope').key).toBe('poetech');
  });

  it('every door names itself on the button, so the label is never generic', () => {
    for (const d of DOORS) {
      const door = doorFor(d.key);
      expect(door.label.length).toBeGreaterThan(3);
      expect(door.ariaLabel).toMatch(/QR code/);
      expect(door.blurb.length).toBeGreaterThan(40);
    }
  });
});

describe('doorKeyFor — the app you are IN decides, never the tab you are on (DR-1112)', () => {
  it('THE BUG: the PoeTech app on its Church tab shares PoeTech, not the Love Corner', () => {
    // Darrell's screenshot: poetech.us/poetech-app/?view=church, "Share our
    // app" opened the Love Corner card. The tab is in the query; the app is
    // in the path.
    expect(doorKeyFor({ church: false, pathname: '/poetech-app/', search: '?view=church' })).toBe('poetech');
  });
  it('each installed app shares itself by where it booted', () => {
    expect(doorKeyFor({ pathname: '/lovecorner/app/', search: '' })).toBe('lovecorner');
    expect(doorKeyFor({ pathname: '/tlc/app/', search: '?view=overview' })).toBe('tlc');
    expect(doorKeyFor({ pathname: '/moore/app/', search: '' })).toBe('moore');
    expect(doorKeyFor({ pathname: '/properties/app/', search: '' })).toBe('properties');
  });
  it('a page wearing the church brand is the Love Corner, wherever it is served', () => {
    expect(doorKeyFor({ church: true, pathname: '/poetech-app/', search: '' })).toBe('lovecorner');
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
    // The church flag is the page's BRAND, never the tab (DR-1112): the old
    // `|| view === 'church'` turned the PoeTech app's Church tab into the
    // church's door.
    expect(SHELL).toMatch(/<AppDoorControls church=\{churchBrand\} \/>/);
    expect(/<AppDoorControls[^>]*view\s*===/.test(SHELL), 'the tab still decides which app is shared').toBe(false);
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
    // And the promise the card has always carried travels with it — ONCE.
    // The header added a second copy beneath AppShareQR's own (DR-1112).
    expect(text.match(/grant access/g) || []).toHaveLength(1);
  });

  it('off the church door it opens the platform card, not the church one', () => {
    act(() => root.render(createElement(AppDoorControls, { church: false })));
    const share = [...container.querySelectorAll('button')]
      .find((b) => (b.getAttribute('aria-label') || '').includes('Share our app'));
    expect(share).toBeTruthy();
    act(() => share.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(document.body.textContent).not.toMatch(/poetech\.us\/lovecorner/);
  });
});
