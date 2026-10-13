// =============================================================================
// LiveWorshipBar — the app-wide pinned LIVE service player (2026-07-05).
// =============================================================================
// PROVEN-TO-CATCH (DR-0076 anti-theater): the whole honesty of this surface is
// that it appears ONLY inside a real published service window and NEVER paints a
// 24/7 video bar (the Reality-Trace P15 rule, and the same zombie-frame concern
// church-live.js guards). These tests inject a fixed clock and assert:
//   • in-window  → the pinned live iframe mounts (muted autoplay, live_stream).
//   • off-window → nothing renders (no fabricated live bar).
//   • no channel → nothing renders (never a dead frame).
//   • dismiss    → it stays gone for the session.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { LiveWorshipBar, livePlayerSrc } from '../components/LiveWorshipBar.jsx';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';
import { __resetLivePlayerPrefs, setLivePlayerScale, setLiveBarCollapsed, LIVE_PLAYER_SCALE_KEY, barFrameStyle } from '../lib/live-player-prefs.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  try { sessionStorage.clear(); } catch (_) { /* ignore */ }
  try { localStorage.clear(); } catch (_) { /* ignore */ }
  __resetLivePlayerPrefs();
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

const IN_WINDOW = new Date('2026-06-21T11:00:00-05:00');   // Sunday 11:00 AM — service start
const OFF_WINDOW = new Date('2026-06-23T09:00:00-05:00');    // Tuesday 9:00 AM — no service

const mount = (props = {}) =>
  act(() => root.render(createElement(LiveWorshipBar, {
    church: COLG_DEFAULT_CHURCH, view: 'overview', churchView: 'home', onOpenChurch: () => {}, ...props,
  })));

describe('livePlayerSrc', () => {
  it('builds a muted-autoplay embed on the PROVEN uploads-playlist form, never the abandoned live_stream endpoint', () => {
    const src = livePlayerSrc('UC821pJh7YR5llBNnWUJj-ZA');
    expect(src).toMatch(/\/embed\/videoseries\?list=UU/);
    expect(src).not.toMatch(/live_stream/);
    expect(src).toMatch(/autoplay=1/);
    expect(src).toMatch(/mute=1/);
  });
  it('returns null without a channel (bar stays hidden, never a dead frame)', () => {
    expect(livePlayerSrc('')).toBeNull();
    expect(livePlayerSrc(null)).toBeNull();
  });
});

describe('LiveWorshipBar — honest service-window gate', () => {
  it('mounts the pinned live player INSIDE a service window', () => {
    mount({ now: IN_WINDOW });
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeTruthy();
    expect(iframe.src).toMatch(/\/embed\/videoseries\?list=UU/);
    expect(iframe.src).toMatch(/autoplay=1/);
    expect(container.querySelector('[role="region"]')).toBeTruthy();
    expect(container.textContent).toMatch(/Live service/i);
  });

  it('renders NOTHING outside a service window (no fabricated live bar)', () => {
    mount({ now: OFF_WINDOW });
    expect(container.querySelector('iframe')).toBeFalsy();
    expect(container.querySelector('[role="region"]')).toBeFalsy();
  });

  it('renders NOTHING for a church with no channel, even in-window', () => {
    mount({
      now: IN_WINDOW,
      church: { name: 'Grace Fellowship', services: [{ id: 's', day: 'Sunday', time: '11:00 AM', online: true }] },
    });
    expect(container.querySelector('iframe')).toBeFalsy();
  });

  it('stays hidden after the viewer dismisses it for the session', () => {
    mount({ now: IN_WINDOW });
    const close = [...container.querySelectorAll('button')].find((b) => /close the live/i.test(b.getAttribute('aria-label') || ''));
    expect(close).toBeTruthy();
    act(() => close.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(container.querySelector('iframe')).toBeFalsy();
    // A re-render in-window keeps it dismissed (session-sticky).
    mount({ now: IN_WINDOW });
    expect(container.querySelector('iframe')).toBeFalsy();
  });

  it('offers an Open Church action when not already on the Church tab', () => {
    let opened = 0;
    mount({ now: IN_WINDOW, view: 'overview', onOpenChurch: () => { opened += 1; } });
    const openBtn = [...container.querySelectorAll('button')].find((b) => /open church/i.test(b.textContent));
    expect(openBtn).toBeTruthy();
    act(() => openBtn.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(opened).toBe(1);
  });
});

// -----------------------------------------------------------------------------
// Darrell, 2026-09-09: "the player doesn't open in full view when we choose for
// it to when it first opens... the player automation is live... before any
// amount of interaction from users." The bar opens on its own inside the
// window; the viewer's chosen size must be honoured AT THAT FIRST OPEN, from
// the device, with no tap. Proven-to-catch: the frame's style is read from the
// rendered DOM, not asserted from the store.
// -----------------------------------------------------------------------------
describe('LiveWorshipBar — the viewer\'s remembered choice is honoured on the automatic first open', () => {
  const frame = () => container.querySelector('[data-live-scale]');

  it('opens in FULL VIEW on first mount when the device remembers Large — no interaction needed', () => {
    try { localStorage.setItem(LIVE_PLAYER_SCALE_KEY, 'l'); } catch (_) { /* ignore */ }
    // A fresh session reads the device on module load; simulate that read.
    setLivePlayerScale('l');
    mount({ now: IN_WINDOW });
    expect(frame()).toBeTruthy();
    expect(frame().getAttribute('data-live-scale')).toBe('l');
    expect(frame().style.width).toBe('100%');
    expect(frame().style.maxWidth).toBe('');
    expect(frame().style.maxHeight).toBe('60vh');
  });

  it('keeps the original medium shape when nothing was chosen', () => {
    mount({ now: IN_WINDOW });
    expect(frame().getAttribute('data-live-scale')).toBe('m');
    expect(frame().style.maxWidth).toBe('56rem');
    expect(frame().style.maxHeight).toBe('45vh');
  });

  it('a choice made on the Church home player changes the pinned bar live, with no remount', () => {
    mount({ now: IN_WINDOW });
    const before = container.querySelector('iframe');
    act(() => setLivePlayerScale('l'));
    expect(frame().style.maxHeight).toBe('60vh');
    expect(container.querySelector('iframe')).toBe(before); // same frame: the stream never restarted
  });

  it('show/hide video holds for the session across a remount', () => {
    mount({ now: IN_WINDOW });
    act(() => setLiveBarCollapsed(true));
    expect(container.querySelector('button[aria-label="Expand the live service player"]')).toBeTruthy();
    act(() => root.unmount());
    root = createRoot(container);
    mount({ now: IN_WINDOW });
    expect(container.querySelector('button[aria-label="Expand the live service player"]')).toBeTruthy();
  });

  // READING ON A PHONE (2026-09-30): the 289px video over a lesson at 360px
  // put the chrome at 686px of a 900px screen. With a lesson open on a phone
  // and no choice made, the bar starts as its one-line strip.
  describe('a lesson open on a phone', () => {
    const realMM = window.matchMedia;
    const phone = (on) => {
      window.matchMedia = (q) => ({ matches: on && /max-width/.test(q), media: q, addEventListener() {}, removeEventListener() {} });
    };
    afterEach(() => {
      window.matchMedia = realMM;
      document.documentElement.removeAttribute('data-lesson-space');
    });
    const videoHidden = () => container.querySelector('iframe').parentElement.parentElement.classList.contains('hidden');

    it('starts with the video folded to the strip', () => {
      phone(true);
      document.documentElement.setAttribute('data-lesson-space', 'open');
      mount({ now: IN_WINDOW });
      expect(videoHidden()).toBe(true);
      expect(container.querySelector('button[aria-label="Expand the live service player"]')).toBeTruthy();
    });
    it('keeps the video open on a phone when no lesson is open, and in a lesson on a wide screen', () => {
      phone(true);
      mount({ now: IN_WINDOW });
      expect(videoHidden()).toBe(false);
      act(() => root.unmount());
      root = createRoot(container);
      phone(false);
      document.documentElement.setAttribute('data-lesson-space', 'open');
      mount({ now: IN_WINDOW });
      expect(videoHidden()).toBe(false);
    });
    it('the viewer\'s choice to show the video wins over the phone default', () => {
      phone(true);
      document.documentElement.setAttribute('data-lesson-space', 'open');
      act(() => setLiveBarCollapsed(false));
      mount({ now: IN_WINDOW });
      expect(videoHidden()).toBe(false);
    });
  });

  it('publishes data-live-bar while open and clears it when the window closes', () => {
    mount({ now: IN_WINDOW });
    expect(document.documentElement.getAttribute('data-live-bar')).toBe('open');
    mount({ now: OFF_WINDOW });
    expect(document.documentElement.getAttribute('data-live-bar')).toBeNull();
  });

  it('barFrameStyle: large is full width; small is capped narrow; medium is the original', () => {
    expect(barFrameStyle('l')).toMatchObject({ width: '100%', maxHeight: '60vh' });
    expect(barFrameStyle('l').maxWidth).toBeUndefined();
    expect(barFrameStyle('s')).toMatchObject({ maxWidth: '28rem' });
    expect(barFrameStyle('m')).toMatchObject({ maxWidth: '56rem', maxHeight: '45vh' });
  });
});
