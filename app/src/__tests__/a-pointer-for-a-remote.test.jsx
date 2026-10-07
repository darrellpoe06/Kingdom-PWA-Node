// @vitest-environment jsdom
// =============================================================================
// A pointer the D-pad moves, for a screen driven by a remote (DR-0802)
// =============================================================================
// Darrell 2026-10-07: "Make sure the app has a hovering pointer option for
// devices that use a remote... make sense?"
//
// It is an OPTION on purpose: a Firestick's Silk already drives a pointer of
// its own and two pointers fight, while other remote-driven browsers send
// nothing but arrow keys and leave an unfocusable control unreachable. We
// cannot tell which one we are on, so the person decides. Off by default,
// offered where the device class is a TV, kept on the device.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  POINTER_KEY, STEP_PX, MAX_STEP_PX, EDGE_PAD,
  loadPointerPref, savePointerPref, pointerOffered, startAt, stepFor, movePointer,
  readKey, keysBelongToTheElement, targetAt, MOVE_KEYS, CLICK_KEYS, DISMISS_KEYS,
} from '../lib/remote-pointer.js';
import RemotePointer from '../components/RemotePointer.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('the arithmetic, on real numbers', () => {
  beforeEach(() => { try { localStorage.clear(); } catch { /* private mode */ } });

  it('a pointer starts in the middle of the screen', () => {
    expect(startAt(1920, 1080)).toEqual({ x: 960, y: 540 });
    expect(startAt(0, 0)).toEqual({ x: 0, y: 0 });
    expect(startAt(undefined, undefined)).toEqual({ x: 0, y: 0 });
  });

  it('a tap moves a little; a held key ramps up to a cap, so a 1920px screen is crossable', () => {
    expect(stepFor(0)).toBe(STEP_PX);
    expect(stepFor(1)).toBeGreaterThan(stepFor(0));
    expect(stepFor(60)).toBe(MAX_STEP_PX);
    expect(stepFor(-5), 'a nonsense tick count is the resting step').toBe(STEP_PX);
    // Measured: how many ticks to cross 1920px holding one direction.
    let x = 0; let ticks = 0;
    while (x < 1920 && ticks < 500) { x += stepFor(ticks); ticks += 1; }
    expect(ticks, 'crossing the screen takes well under a second of holding').toBeLessThan(30);
  });

  it('the pointer never leaves the screen, in any direction', () => {
    const b = { width: 1920, height: 1080 };
    expect(movePointer({ x: 10, y: 500 }, MOVE_KEYS.ArrowLeft, 90, b).x).toBe(EDGE_PAD);
    expect(movePointer({ x: 1910, y: 500 }, MOVE_KEYS.ArrowRight, 90, b).x).toBe(1920 - EDGE_PAD);
    expect(movePointer({ x: 500, y: 5 }, MOVE_KEYS.ArrowUp, 90, b).y).toBe(EDGE_PAD);
    expect(movePointer({ x: 500, y: 1070 }, MOVE_KEYS.ArrowDown, 90, b).y).toBe(1080 - EDGE_PAD);
    // a screen we were never told the size of does not throw or fly off
    const nowhere = movePointer({ x: 50, y: 50 }, MOVE_KEYS.ArrowRight, 0, {});
    expect(Number.isFinite(nowhere.x) && Number.isFinite(nowhere.y)).toBe(true);
  });

  it('a remote\'s key names are answered as well as a keyboard\'s', () => {
    for (const k of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Up', 'Down', 'Left', 'Right']) {
      expect(readKey(k, {}).kind, k).toBe('move');
    }
    for (const k of CLICK_KEYS) expect(readKey(k, {}).kind, k).toBe('click');
    for (const k of DISMISS_KEYS) expect(readKey(k, {}).kind, k).toBe('dismiss');
    expect(readKey('q', {}), 'a key that is not ours is left alone').toBeNull();
    expect(readKey('ArrowUp', { on: false }), 'switched off, nothing is ours').toBeNull();
  });

  it('PROVEN TO CATCH: typing in a box keeps its own arrow keys', () => {
    const input = document.createElement('input');
    const area = document.createElement('textarea');
    const select = document.createElement('select');
    const div = document.createElement('div');
    for (const el of [input, area, select]) {
      expect(keysBelongToTheElement(el), el.tagName).toBe(true);
      expect(readKey('ArrowLeft', { target: el }), `${el.tagName} keeps its arrows`).toBeNull();
      expect(readKey('Enter', { target: el }), `${el.tagName} keeps its Enter`).toBeNull();
    }
    expect(keysBelongToTheElement(div)).toBe(false);
    expect(keysBelongToTheElement(null)).toBe(false);
    expect(readKey('ArrowLeft', { target: div }).kind).toBe('move');
  });

  it('the option is off until it is switched on, and survives a storage that throws', () => {
    expect(loadPointerPref()).toBe(false);
    savePointerPref(true);
    expect(localStorage.getItem(POINTER_KEY)).toBe('on');
    expect(loadPointerPref()).toBe(true);
    savePointerPref(false);
    expect(loadPointerPref()).toBe(false);
    const angry = { getItem() { throw new Error('no'); }, setItem() { throw new Error('no'); }, removeItem() { throw new Error('no'); } };
    expect(loadPointerPref(angry)).toBe(false);
    expect(() => savePointerPref(true, angry)).not.toThrow();
  });

  it('it is offered on a TV and nowhere else', () => {
    expect(pointerOffered('tv')).toBe(true);
    for (const c of ['phone', 'tablet', 'laptop', undefined]) expect(pointerOffered(c), String(c)).toBe(false);
  });

  it('a click lands on the control under the pointer, or on nothing at all', () => {
    const btn = document.createElement('button');
    const span = document.createElement('span');
    btn.appendChild(span);
    document.body.appendChild(btn);
    const fake = (el) => ({ body: document.body, elementFromPoint: () => el });
    expect(targetAt(fake(span), 1, 1), 'a span inside a button presses the button').toBe(btn);
    expect(targetAt(fake(btn), 1, 1)).toBe(btn);
    expect(targetAt(fake(document.body), 1, 1), 'empty page presses nothing').toBeNull();
    expect(targetAt(fake(null), 1, 1)).toBeNull();
    expect(targetAt({ body: document.body }, 1, 1), 'a document that cannot be asked presses nothing').toBeNull();
    const role = document.createElement('div');
    role.setAttribute('role', 'button');
    document.body.appendChild(role);
    expect(targetAt(fake(role), 1, 1), 'a role=button counts').toBe(role);
    document.body.innerHTML = '';
  });
});

describe('the pointer on the page', () => {
  let root = null;
  let container = null;

  const mount = async (on) => {
    container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(RemotePointer, { on, doc: document }));
    });
  };
  const key = async (k) => {
    await act(async () => {
      document.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
      document.dispatchEvent(new window.KeyboardEvent('keyup', { key: k, bubbles: true }));
    });
  };

  beforeEach(() => { window.innerWidth = 1920; window.innerHeight = 1080; });
  afterEach(async () => {
    if (root) await act(async () => { root.unmount(); });
    if (container && container.parentNode) container.parentNode.removeChild(container);
    root = null; container = null;
    document.body.innerHTML = '';
  });

  it('switched OFF it draws nothing and answers no key — a phone pays nothing for it', async () => {
    await mount(false);
    await key('ArrowRight');
    expect(document.querySelector('[data-testid="remote-pointer"]')).toBeNull();
  });

  it('switched on, the first arrow wakes it and it appears on the screen', async () => {
    await mount(true);
    expect(document.querySelector('[data-testid="remote-pointer"]'), 'not before it is needed').toBeNull();
    await key('ArrowRight');
    const dot = document.querySelector('[data-testid="remote-pointer"]');
    expect(dot, 'the pointer is up').toBeTruthy();
    expect(parseInt(dot.style.left, 10), 'it moved right of centre').toBeGreaterThan(960);
    expect(dot.getAttribute('aria-hidden'), 'a screen reader is not told about a dot').toBe('true');
  });

  it('Enter presses the control under it, and Escape puts it away', async () => {
    const pressed = [];
    const btn = document.createElement('button');
    btn.textContent = 'Read';
    btn.addEventListener('click', () => pressed.push('read'));
    document.body.appendChild(btn);
    document.elementFromPoint = () => btn;
    await mount(true);
    await key('ArrowRight');
    await key('Enter');
    expect(pressed, 'the button under the pointer was pressed').toEqual(['read']);
    await key('Escape');
    expect(document.querySelector('[data-testid="remote-pointer"]'), 'Escape puts it away').toBeNull();
  });

  it('PROVEN TO CATCH: Enter before the pointer is up is left to the page', async () => {
    const pressed = [];
    const btn = document.createElement('button');
    btn.addEventListener('click', () => pressed.push('x'));
    document.body.appendChild(btn);
    document.elementFromPoint = () => btn;
    await mount(true);
    await key('Enter');
    expect(pressed, 'the page keeps its own Enter until the pointer is woken').toEqual([]);
  });
});
