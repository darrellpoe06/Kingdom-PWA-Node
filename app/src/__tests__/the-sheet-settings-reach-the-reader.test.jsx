// @vitest-environment jsdom
// =============================================================================
// What the Personalize sheet sets, the readers on the page obey (DR-1575)
// =============================================================================
// Darrell 2026-11-18, "Faster" picked in the Personalize sheet on the Love
// Corner door: "The reading speeds etc don't work... fix it". Traced: the
// sheet wrote the speed to this device's storage; every reader already on the
// page (the Read button, the sheet's own Test, an open lesson) kept the copy
// it read when it mounted, spoke at that, and wrote it back over the pick the
// next time it saved anything. These tests mount a REAL reader (the real
// hook, the real engine, a stand-in for the browser's speech synth) beside
// the REAL sheet, tap a speed, and read the rate off the next thing spoken.
// Proven-to-catch: before the fix the first test read 1 where it wanted 1.5.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

vi.mock('../lib/supabase.js', () => {
  const chain = () => {
    const c = {
      select: () => c,
      eq: () => c,
      order: () => c,
      limit: () => c,
      in: () => c,
      maybeSingle: async () => ({ data: null, error: null }),
      then: (res) => Promise.resolve({ data: [], error: null }).then(res),
    };
    return c;
  };
  const fake = {
    from: () => chain(),
    rpc: async () => ({ data: null, error: null }),
    auth: { getSession: async () => ({ data: { session: null } }), getUser: async () => ({ data: { user: null } }), updateUser: async () => ({}) },
    channel: () => ({
      on() {
        return this;
      },
      subscribe() {
        return this;
      },
    }),
    removeChannel: () => {},
  };
  return { default: fake, supabase: fake, onAuthChange: () => () => {}, signOut: async () => {} };
});

import PersonalizeSheet from '../components/shell/PersonalizeSheet.jsx';
import { AllFeaturesSheet } from '../components/shell/LoveCornerMenus.jsx';
import { voiceOptionLabel } from '../components/ReadingVoiceControl.jsx';
import { useTextToSpeech, RATE_STEPS, loadTTSPrefs, saveTTSPrefs, saveTTSRate, subscribeTTSPrefs } from '../lib/tts.js';
import { churchSubTabs } from '../lib/church-tabs.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const here = dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(join(here, '../index.css'), 'utf8');

// The browser's speech synth, as far as the engine uses it: it keeps what it
// was asked to speak so the test can read the rate each utterance carried.
let spoken;
function installSynth() {
  spoken = [];
  class Utterance {
    constructor(text) {
      this.text = text;
      this.rate = 1;
      this.pitch = 1;
      this.voice = null;
    }
  }
  const synth = {
    speaking: false,
    pending: false,
    paused: false,
    getVoices: () => [],
    speak: (u) => {
      spoken.push(u);
      synth.speaking = true;
      if (typeof u.onstart === 'function') u.onstart({});
    },
    cancel: () => {
      synth.speaking = false;
    },
    pause: () => {},
    resume: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  window.speechSynthesis = synth;
  window.SpeechSynthesisUtterance = Utterance;
}

let reader;
function Reader() {
  reader = useTextToSpeech();
  return createElement('output', { 'data-testid': 'reader-rate' }, String(reader.rate));
}

const flush = () =>
  act(async () => {
    for (let i = 0; i < 8; i += 1) await Promise.resolve();
  });
const q = (sel) => document.querySelector(sel);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const lastRate = () => spoken[spoken.length - 1].rate;

let container, root;
beforeEach(() => {
  localStorage.clear();
  installSynth();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.querySelectorAll('[role="dialog"]').forEach((d) => d.remove());
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
});

const mountBoth = async () => {
  act(() => root.render(createElement('div', null, createElement(Reader), createElement(PersonalizeSheet, { open: true, onClose: () => {}, theme: 'night', setTheme: () => {} }))));
  await flush();
};

describe('a speed picked in Personalize reaches a reader already on the page', () => {
  it('the next thing that reader speaks carries the picked speed', async () => {
    await mountBoth();
    expect(q('[data-testid="reader-rate"]').textContent).toBe('1');
    click(q('[data-testid="lch-rate-1.5"]'));
    await flush();
    expect(loadTTSPrefs().rate, 'the pick is saved on this device').toBe(1.5);
    expect(q('[data-testid="reader-rate"]').textContent, 'the reader shows the picked speed').toBe('1.5');
    act(() => reader.speak('The Lord is my shepherd; I shall not want.'));
    await flush();
    expect(spoken.length).toBeGreaterThan(0);
    expect(lastRate(), 'the utterance is spoken at the picked speed').toBe(1.5);
  });

  it('a reading already under way takes the new speed on its sentence', async () => {
    await mountBoth();
    act(() => reader.speak('In the beginning God created the heaven and the earth. And the earth was without form, and void.'));
    await flush();
    expect(lastRate()).toBe(1);
    const before = spoken.length;
    click(q('[data-testid="lch-rate-2"]'));
    await flush();
    expect(spoken.length, 'the sentence is spoken again at the new speed').toBeGreaterThan(before);
    expect(lastRate()).toBe(2);
  });

  it('a reader saving something else afterwards never writes the old speed back', async () => {
    await mountBoth();
    click(q('[data-testid="lch-rate-2.5"]'));
    await flush();
    act(() => reader.setPitch(1.1));
    await flush();
    const now = loadTTSPrefs();
    expect(now.rate, 'the pick outlives the reader’s next save').toBe(2.5);
    expect(now.pitch).toBe(1.1);
  });

  it('Reset to the church’s look puts every reader back on Normal', async () => {
    saveTTSPrefs({ rate: 3, pitch: 1, voiceURI: null });
    await mountBoth();
    expect(q('[data-testid="reader-rate"]').textContent).toBe('3');
    click(q('[data-testid="lch-reset"]'));
    await flush();
    expect(q('[data-testid="reader-rate"]').textContent).toBe('1');
  });

  it('a speed changed on one reader shows on the sheet’s own ladder the next time it opens, and on every other reader', async () => {
    let second;
    function Second() {
      second = useTextToSpeech();
      return null;
    }
    act(() => root.render(createElement('div', null, createElement(Reader), createElement(Second))));
    await flush();
    act(() => reader.setRate(4));
    await flush();
    expect(second.rate).toBe(4);
    act(() => root.render(createElement('div', null, createElement(Reader), createElement(Second), createElement(PersonalizeSheet, { open: true, onClose: () => {}, theme: 'night', setTheme: () => {} }))));
    await flush();
    expect(q('[data-testid="lch-rate-4"]').getAttribute('aria-checked')).toBe('true');
  });
});

describe('the prefs store tells its subscribers', () => {
  it('announces the STORED prefs once per burst, and stops when unsubscribed', async () => {
    const seen = [];
    const off = subscribeTTSPrefs((p) => seen.push(p.rate));
    saveTTSRate(1.5);
    saveTTSRate(2);
    await Promise.resolve();
    await Promise.resolve();
    expect(seen).toEqual([2]);
    off();
    saveTTSRate(3);
    await Promise.resolve();
    expect(seen).toEqual([2]);
    expect(loadTTSPrefs().rate).toBe(3);
  });
  it('a save to some other store announces nothing: only this device’s own store is shared', async () => {
    const seen = [];
    const off = subscribeTTSPrefs((p) => seen.push(p.rate));
    const other = { setItem: () => {}, getItem: () => null };
    saveTTSPrefs({ rate: 5 }, other);
    await Promise.resolve();
    expect(seen).toEqual([]);
    off();
  });
  it('saveTTSRate keeps the voice and the pitch already saved', () => {
    saveTTSPrefs({ rate: 1, pitch: 1.2, voiceURI: 'voice-a' });
    saveTTSRate(2);
    expect(loadTTSPrefs()).toEqual({ rate: 2, pitch: 1.2, voiceURI: 'voice-a' });
  });
});

describe('every speed is on the sheet', () => {
  it('all eight rungs are drawn, each named with its number', async () => {
    await mountBoth();
    const rungs = [...document.querySelectorAll('[data-testid^="lch-rate-"]')];
    expect(rungs.length).toBe(RATE_STEPS.length);
    for (const s of RATE_STEPS) {
      const b = q(`[data-testid="lch-rate-${s.value}"]`);
      expect(b.textContent).toContain(s.name);
      expect(b.textContent).toContain(s.label);
    }
  });
  it('the ladder wraps instead of being cut off at its box', () => {
    const seg = CSS.match(/\.lch-seg\{([^}]*)\}/)[1];
    expect(seg).toMatch(/display:grid/);
    expect(seg).toMatch(/auto-fit/);
    expect(seg, 'the strip that hid four of eight speeds is gone').not.toMatch(/overflow:hidden|inline-flex/);
  });
});

describe('the voice pick is written out in full', () => {
  it('under the picker, where a long name can wrap instead of being cut off', async () => {
    await mountBoth();
    const now = q('[data-testid="reading-voice-now"]');
    expect(now, 'the full name of the voice in use').toBeTruthy();
    expect(now.textContent).toContain('System voice');
    expect(now.className).toMatch(/break-words/);
    expect(voiceOptionLabel({ label: 'System voice', deviceVoice: 'Phone default (OS voice)', usable: true })).toBe('System voice · Phone default (OS voice)');
    expect(voiceOptionLabel({ label: 'Darrell', ai: true, standIn: true, usable: false })).toBe('Darrell · AI (stand-in) — subscriber');
  });
});

describe('the sheets are one themed panel, not a dark sheet in a white frame', () => {
  const assertSheet = (dialog) => {
    expect(dialog.getAttribute('data-modal-variant')).toBe('sheet');
    expect(dialog.getAttribute('data-theme'), 'the panel carries the theme itself: it is portalled outside the themed shell').toBe('night');
    expect(dialog.className).not.toMatch(/bg-white|p-5|p-6/);
    const x = dialog.querySelector('[data-testid="modal-close"]');
    expect(x.className).toBe('modal-sheet-x');
    expect(x.getAttribute('aria-label')).toBe('Close');
    const scroll = dialog.querySelector('[data-testid="modal-sheet-scroll"]');
    expect(scroll.contains(dialog.querySelector('.lch-sheet')), 'the sheet sits in the panel’s one scroll box').toBe(true);
    expect(scroll.contains(x), 'the close is outside the scroll box, so it never scrolls away').toBe(false);
  };
  it('Personalize', async () => {
    await mountBoth();
    assertSheet(q('[role="dialog"]'));
  });
  it('All features', async () => {
    act(() => root.render(createElement(AllFeaturesSheet, { open: true, onClose: () => {}, churchTabs: churchSubTabs({ signedIn: false }), churchView: 'home', onGo: () => {}, theme: 'night' })));
    await flush();
    assertSheet(q('[role="dialog"]'));
  });
  it('the close is a 44px themed button that never grows with the text, and the sheet no longer scrolls inside the panel', () => {
    const x = CSS.match(/\.modal-sheet-x\{([^}]*)\}/)[1];
    expect(x).toMatch(/width:44px;height:44px/);
    expect(x).toMatch(/color:var\(--lc-ink\)/);
    expect(x).toMatch(/background:var\(--lc-paper\)/);
    const sheet = CSS.match(/\n\.lch-sheet\{([^}]*)\}/)[1];
    expect(sheet).not.toMatch(/max-height|overflow/);
    expect(CSS).toMatch(/\.lch-sheet>:first-child\{margin-right:52px/);
  });
});
