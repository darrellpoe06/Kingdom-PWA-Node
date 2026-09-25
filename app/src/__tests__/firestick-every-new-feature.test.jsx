// @vitest-environment jsdom
// =============================================================================
// Every new feature works on the Firestick (DR-0655)
// =============================================================================
// Darrell 2026-09-25: "Will this work with the Firestick still?" and "All new
// features too?" He reads on an Amazon Fire TV Stick, in Silk, with a D-pad
// remote. The sweep drove each of the day's features in Chromium with a Fire
// TV's shape (Silk user agent, 960x540 at DPR 2, no device voices, no
// microphone) using ONLY the arrow keys, Enter and Escape. What failed, and is
// fixed here, each pinned by a check that fails on the code before:
//
//   1. The TV focus ring never switched on: it was keyed to a 1600px width,
//      and a Fire TV lays out at 960. A TV is now known by its user agent.
//   2. A text box was a dead end: the D-pad went into the Notes box and
//      stayed there, 25 presses of 25. On a TV an arrow leaves a field when
//      the caret can go no further that way.
//   3. A list changed itself under a passing D-pad: one Down on the reader's
//      "Start at" list started reading at paragraph 1. On a TV the arrows
//      move on past a list, and OK opens it.
//   4. Record was offered on a device with no microphone, and failed on the
//      first press. It is no longer offered; the reason is said.
//   5. A tab strip was a cage: Up and Down stepped the strip and wrapped, so
//      30 presses of Down on Learn cycled the department row and never
//      reached the lessons. Up and Down now leave a strip.
//   6. The floaters caught every step: each Down on a long page went content,
//      sticky tab, connection badge, Feedback, then content. From a control
//      in the page, a move stays in the page when the page has anything
//      that way; the floaters are still reached at the end or sideways.
// =============================================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRoot } from 'react-dom/client';

vi.mock('../lib/supabase.js', () => ({
  default: { auth: { getSession: async () => ({ data: { session: null } }) }, rpc: async () => ({ data: null, error: null }) },
  supabase: { auth: { getSession: async () => ({ data: { session: null } }) }, rpc: async () => ({ data: null, error: null }) },
}));

import { isTvUserAgent, markTvDevice, isTvDocument } from '../lib/tv-device.js';
import { handleRemoteKey, caretAtEdge } from '../lib/remote-navigation.js';
import { micPresentFrom, probeMicPresent, NO_MICROPHONE_LINE } from '../lib/mic-presence.js';
import OneVoiceInput from '../components/OneVoiceInput.jsx';
import SectionTabs from '../components/SectionTabs.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));

const SILK_FIRE_TV = 'Mozilla/5.0 (Linux; Android 9; AFTKA Build/PS7633) AppleWebKit/537.36 (KHTML, like Gecko) Silk/118.3.1 like Chrome/118.0.5993.144 Safari/537.36';
const ANDROID_PHONE = 'Mozilla/5.0 (Linux; Android 14; SM-F946U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const DESKTOP = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';
// A Fire TV tablet runs Silk too, and is NOT a television.
const FIRE_TABLET = 'Mozilla/5.0 (Linux; Android 11; KFTRWI) AppleWebKit/537.36 (KHTML, like Gecko) Silk/118.3.1 like Chrome/118.0.5993.144 Safari/537.36';

describe('1. a television is known by what it says it is', () => {
  it('a Fire TV Stick in Silk is a TV; a phone, a desktop and a Fire tablet are not', () => {
    expect(isTvUserAgent(SILK_FIRE_TV)).toBe(true);
    expect(isTvUserAgent(ANDROID_PHONE)).toBe(false);
    expect(isTvUserAgent(DESKTOP)).toBe(false);
    expect(isTvUserAgent(FIRE_TABLET)).toBe(false);
  });

  it('boot marks the document, and the TV ring is keyed to that mark, not to a width a Fire TV never has', () => {
    const doc = document.implementation.createHTMLDocument('tv');
    expect(markTvDevice(doc, { userAgent: SILK_FIRE_TV })).toBe(true);
    expect(isTvDocument(doc)).toBe(true);
    const main = readFileSync(join(HERE, '../main.jsx'), 'utf8');
    expect(main.indexOf('markTvDevice();')).toBeGreaterThan(0);
    expect(main.indexOf('markTvDevice();')).toBeLessThan(main.indexOf('wireRemoteNavigation();'));
    const css = readFileSync(join(HERE, '../index.css'), 'utf8');
    const rule = css.match(/:root\[data-device='tv'\] :focus-visible \{([^}]*)\}/);
    expect(rule, 'no TV focus-ring rule keyed to data-device').toBeTruthy();
    expect(rule[1]).toMatch(/outline-width: 4px/);
  });
});

// --- the remote -------------------------------------------------------------
const r = (left, top, width = 100, height = 40) => ({ left, top, width, height, right: left + width, bottom: top + height });
function key(k) {
  return { key: k, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
}
let root;
beforeEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-device');
  root = document.createElement('div');
  document.body.appendChild(root);
});

describe('2. on a TV a text box is not a dead end', () => {
  const build = (value) => {
    root.innerHTML = '<textarea id="box"></textarea><button id="below">Record</button>';
    const box = root.querySelector('#box');
    box.value = value;
    const rects = { box: r(0, 0, 400, 80), below: r(0, 200) };
    return { box, opts: { rectOf: (el) => rects[el.id], isVisible: () => true } };
  };

  it('with the caret at the end, Down leaves the box for the control below', () => {
    const { box, opts } = build('a thought');
    box.focus(); box.setSelectionRange(9, 9);
    const ev = key('ArrowDown');
    expect(handleRemoteKey(ev, root, { ...opts, tv: true })).toBe(root.querySelector('#below'));
    expect(ev.defaultPrevented).toBe(true);
  });

  it('with room to move, the caret still moves (the key is left alone)', () => {
    const { box, opts } = build('line one\nline two');
    box.focus(); box.setSelectionRange(3, 3);
    const ev = key('ArrowDown');
    expect(handleRemoteKey(ev, root, { ...opts, tv: true })).toBe(null);
    expect(ev.defaultPrevented).toBe(false);
  });

  it('off a TV nothing changes: a keyboard keeps every arrow inside the box', () => {
    const { box, opts } = build('a thought');
    box.focus(); box.setSelectionRange(9, 9);
    expect(handleRemoteKey(key('ArrowDown'), root, { ...opts, tv: false })).toBe(null);
    expect(document.activeElement).toBe(box);
  });

  it('the edge, pure: a single-line field always lets Up and Down go', () => {
    const input = document.createElement('input');
    input.value = 'abc'; root.appendChild(input); input.setSelectionRange(1, 1);
    expect(caretAtEdge(input, 'down')).toBe(true);
    expect(caretAtEdge(input, 'left')).toBe(false);
    input.setSelectionRange(0, 0);
    expect(caretAtEdge(input, 'left')).toBe(true);
  });
});

describe('3. on a TV a list does not change itself under a passing D-pad', () => {
  const build = () => {
    root.innerHTML = '<select id="list"><option value="">Pick…</option><option value="3">Paragraph 1</option></select><button id="below">Read</button>';
    const list = root.querySelector('#list');
    const rects = { list: r(0, 0), below: r(0, 100) };
    return { list, opts: { rectOf: (el) => rects[el.id], isVisible: () => true } };
  };

  it('Down moves on past the list, and the key is prevented so the choice does not change', () => {
    const { list, opts } = build();
    list.focus();
    const ev = key('ArrowDown');
    expect(handleRemoteKey(ev, root, { ...opts, tv: true })).toBe(root.querySelector('#below'));
    expect(ev.defaultPrevented, 'the list would have chosen paragraph 1 and started reading').toBe(true);
    expect(list.value).toBe('');
  });

  it('OK opens the list', () => {
    const { list, opts } = build();
    list.focus();
    list.showPicker = vi.fn();
    const ev = key('Enter');
    handleRemoteKey(ev, root, { ...opts, tv: true });
    expect(list.showPicker).toHaveBeenCalledTimes(1);
    expect(ev.defaultPrevented).toBe(true);
  });
});

// --- the microphone -----------------------------------------------------------
describe('4. no microphone, no Record button', () => {
  let container; let rroot;
  const install = (devices) => {
    window.MediaRecorder = class { static isTypeSupported() { return true; } };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => { const e = new Error('Requested device not found'); e.name = 'NotFoundError'; throw e; },
        enumerateDevices: devices === undefined ? undefined : async () => devices,
        addEventListener() {}, removeEventListener() {},
      },
    });
  };
  afterEach(async () => {
    if (rroot) await act(async () => rroot.unmount());
    if (container) container.remove();
    rroot = null; container = null;
    delete window.MediaRecorder;
    delete navigator.mediaDevices;
  });
  const renderBox = async () => {
    container = document.createElement('div'); document.body.appendChild(container);
    rroot = createRoot(container);
    await act(async () => { rroot.render(<OneVoiceInput surface="notes" submitLabel="Save" addNote={vi.fn()} />); });
    for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
  };

  it('pure: an empty device list is no microphone; no list is unknown', async () => {
    expect(micPresentFrom([])).toBe(false);
    expect(micPresentFrom([{ kind: 'audiooutput' }])).toBe(false);
    expect(micPresentFrom([{ kind: 'audioinput', label: '' }])).toBe(true);
    expect(micPresentFrom(undefined)).toBe(null);
    expect(await probeMicPresent({})).toBe(null);
  });

  it('a TV with no microphone is offered no Record and no Speak, and is told why', async () => {
    install([{ kind: 'audiooutput', deviceId: 'default', label: '' }]);
    await renderBox();
    expect(container.querySelector('[data-testid="record-conversation"]'), 'Record a conversation was offered with no microphone').toBe(null);
    expect([...container.querySelectorAll('button')].some((b) => /Speak/.test(b.textContent || '')), 'Speak was offered with no microphone').toBe(false);
    expect(container.querySelector('[data-testid="no-microphone"]').textContent).toBe(NO_MICROPHONE_LINE);
  });

  it('a device WITH a microphone still gets Record (the check can tell the two apart)', async () => {
    install([{ kind: 'audioinput', deviceId: '', label: '' }]);
    await renderBox();
    expect(container.querySelector('[data-testid="record-conversation"]')).not.toBe(null);
    expect(container.querySelector('[data-testid="no-microphone"]')).toBe(null);
  });

  it('unknown is never a verdict: with no device list, Record stays', async () => {
    install(undefined);
    await renderBox();
    expect(container.querySelector('[data-testid="record-conversation"]')).not.toBe(null);
  });
});

describe('5. a tab strip is a row, and Up and Down leave it', () => {
  let container; let rroot;
  afterEach(async () => { if (rroot) await act(async () => rroot.unmount()); if (container) container.remove(); rroot = null; container = null; });

  it('Down on a tab neither moves along the strip nor changes the section; Right still does', async () => {
    container = document.createElement('div'); document.body.appendChild(container);
    rroot = createRoot(container);
    const sections = ['Courses', 'Living Lessons', 'History'].map((label) => ({ id: label, label, render: () => <p>{label} page</p> }));
    await act(async () => { rroot.render(<SectionTabs sections={sections} ariaLabel="Departments" />); });
    const tabs = [...container.querySelectorAll('button')].filter((b) => sections.some((x) => (b.textContent || '').includes(x.label)));
    tabs[0].focus();
    const down = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
    await act(async () => { tabs[0].dispatchEvent(down); });
    expect(document.activeElement, 'Down stepped along the strip (the Learn cage)').toBe(tabs[0]);
    expect(down.defaultPrevented, 'Down was kept by the strip, so the remote could not leave it').toBe(false);
    expect(container.textContent).toContain('Courses page');
    const right = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    await act(async () => { tabs[0].dispatchEvent(right); });
    expect(container.textContent).toContain('Living Lessons page');
  });
});

describe('6. the page before the floaters', () => {
  const build = () => {
    root.innerHTML = '<button id="a">Lesson 1</button><button id="feedback">Open feedback</button><button id="b">Lesson 2</button>';
    const rects = { a: r(0, 0), feedback: r(0, 100), b: r(0, 300) };
    return { rectOf: (el) => rects[el.id], isVisible: () => true, pinned: (el) => !!el && el.id === 'feedback' };
  };
  it('Down from a lesson goes to the next lesson, not to the fixed Feedback button in between', () => {
    const opts = build();
    root.querySelector('#a').focus();
    expect(handleRemoteKey(key('ArrowDown'), root, opts)).toBe(root.querySelector('#b'));
  });
  it('the floater is still reached when the page has nothing that way, and from a floater the rule is off', () => {
    const opts = build();
    root.querySelector('#b').focus();
    // Nothing in the page below Lesson 2 and Feedback is not below it either: stay put.
    expect(handleRemoteKey(key('ArrowDown'), root, opts)).toBe(null);
    root.querySelector('#feedback').focus();
    expect(handleRemoteKey(key('ArrowUp'), root, opts)).toBe(root.querySelector('#a'));
  });
});
