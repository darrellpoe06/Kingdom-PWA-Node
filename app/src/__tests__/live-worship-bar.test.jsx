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

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  try { sessionStorage.clear(); } catch (_) { /* ignore */ }
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

const IN_WINDOW = new Date(2026, 5, 21, 11, 0, 0);   // Sunday 11:00 AM — service start
const OFF_WINDOW = new Date(2026, 5, 23, 9, 0, 0);    // Tuesday 9:00 AM — no service

const mount = (props = {}) =>
  act(() => root.render(createElement(LiveWorshipBar, {
    church: COLG_DEFAULT_CHURCH, view: 'overview', churchView: 'home', onOpenChurch: () => {}, ...props,
  })));

describe('livePlayerSrc', () => {
  it('builds a muted-autoplay live_stream embed for a channel', () => {
    const src = livePlayerSrc('UC821pJh7YR5llBNnWUJj-ZA');
    expect(src).toMatch(/\/embed\/live_stream\?channel=UC821pJh7YR5llBNnWUJj-ZA/);
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
    expect(iframe.src).toMatch(/\/embed\/live_stream\?channel=UC821pJh7YR5llBNnWUJj-ZA/);
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
