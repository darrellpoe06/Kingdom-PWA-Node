// @vitest-environment jsdom
// =============================================================================
// Messages composers — speak instead of type, and long inputs that grow
// =============================================================================
// Darrell 2026-07-27: "I want the input to be able to do a transcription of
// what a person is saying so they don't have to type... also long inputs."
// The app's ONE dictation primitive (lib/voice-dictation.js — push-to-end,
// 5-minute brake, honest type-instead fallback) already served eight surfaces;
// the Messages composers had never adopted it. These tests pin the adoption:
// the mic renders where speech is supported, spoken chunks APPEND into the
// draft (never replace it), and the composer grows with long input instead of
// trapping a paragraph in a two-row box. Proven-to-catch: all of it fails
// against the pre-adoption composers.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

// Controllable stand-in for the shared dictation hook: captures the options
// each composer passes so the test can feed transcript chunks like the engine.
const h = vi.hoisted(() => ({
  lastOpts: null,
  mic: { supported: true, listening: false, error: '', toggle: () => {}, stop: () => {}, clearError: () => {} },
}));
vi.mock('../lib/voice-dictation.js', () => ({
  useVoiceDictation: (opts) => { h.lastOpts = opts; return h.mic; },
}));
vi.mock('../lib/supabase.js', () => ({
  default: {},
  onAuthChange: (cb) => { cb({ user: { id: 'me' } }); return () => {}; },
}));
vi.mock('../lib/direct-messages-sync.js', () => ({
  subscribeDirectMessages: (set) => { set([]); return () => {}; },
  sendDirectMessage: async () => ({ ok: true }),
  markThreadRead: async () => {},
  groupDmThreads: () => [],
  threadMessages: () => [],
  isSendableBody: (b) => typeof b === 'string' && b.trim().length > 0,
}));

import DirectMessages, { autoGrow } from '../components/DirectMessages.jsx';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => { h.lastOpts = null; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

function openComposer() {
  act(() => root.render(createElement(DirectMessages, { roster: [{ userId: 'u2', displayName: 'Christina' }] })));
  const chip = Array.from(container.querySelectorAll('button')).find((b) => /Christina/.test(b.textContent));
  act(() => chip.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  return container.querySelector('textarea');
}

describe('DM composer — dictation adopted from the one shared primitive', () => {
  it('renders the mic beside Send when speech is supported', () => {
    openComposer();
    const micBtn = container.querySelector('button[aria-label="Speak your message instead of typing"]');
    expect(micBtn).toBeTruthy();
    expect(micBtn.textContent).toContain('Speak');
  });

  it('spoken chunks APPEND to the draft — a pause never wipes what was already said or typed', () => {
    const ta = openComposer();
    expect(h.lastOpts && typeof h.lastOpts.onTranscript).toBe('function');
    act(() => { h.lastOpts.onTranscript('thus saith the heart'); });
    act(() => { h.lastOpts.onTranscript('and the second thought'); });
    expect(container.querySelector('textarea').value).toBe('thus saith the heart and the second thought');
    expect(ta).toBeTruthy();
  });

  it('hides the mic honestly when the browser cannot listen (type-only stays whole)', () => {
    h.mic.supported = false;
    try {
      openComposer();
      expect(container.querySelector('button[aria-label="Speak your message instead of typing"]')).toBeNull();
      expect(container.querySelector('textarea')).toBeTruthy(); // typing unaffected
    } finally {
      h.mic.supported = true;
    }
  });
});

describe('long inputs — the composer grows instead of trapping the paragraph', () => {
  it('autoGrow raises the box with content and caps it so it scrolls inside', () => {
    const el = document.createElement('textarea');
    document.body.appendChild(el);
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 180 });
    autoGrow(el);
    expect(el.style.height).toBe('180px');
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 5000 });
    autoGrow(el);
    expect(el.style.height).toBe('320px'); // the cap — beyond it, overflow-y-auto scrolls
    el.remove();
  });

  it('the group composer in Messages.jsx carries the same adoption (dictation + ref\'d auto-grow)', () => {
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../components/Messages.jsx'), 'utf8');
    expect(src).toContain("import { useVoiceDictation } from '../lib/voice-dictation.js'");
    expect(src).toContain('autoGrow(taRef.current)');
    expect(src).toContain('Speak your message instead of typing');
    expect(src).toContain('overflow-y-auto');
  });
});
