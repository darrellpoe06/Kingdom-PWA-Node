// @vitest-environment jsdom
// =============================================================================
// One read-aloud control on the screen (DR-0718)
// =============================================================================
// Darrell 2026-10-01: a screenshot of the READ ALOUD panel with Text size,
// Colors, Follow along and Speed drawn two and three times, stacked. Each
// section exists once in TTSControl; two mounted readers draw two panels in
// the same fixed corner. The Practice Learn tab mounted a second reader under
// the app's own.
//
// Proven-to-catch: against origin/main two <TTSControl/> render two
// read-aloud buttons and two panels; here exactly one, and it is the
// app-level reader (the one handed the view).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, Fragment } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vi } from 'vitest';
import { registerReader, chosenReader, _resetReadersForTests } from '../lib/one-reader.js';

const HERE = dirname(fileURLToPath(import.meta.url));

vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: false, isPaused: false, rate: 1,
    read: () => {}, pause: () => {}, resume: () => {}, stop: () => {}, claimAudio: () => {}, setRate: () => {},
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));
const { default: TTSControl } = await import('../components/TTSControl.jsx');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); _resetReadersForTests(); });

const fabs = () => container.querySelectorAll('button[aria-label*="read-aloud controls"]');

describe('only one reader renders', () => {
  it('two mounted readers draw ONE button and ONE panel', () => {
    act(() => root.render(createElement(Fragment, null,
      createElement(TTSControl, null),
      createElement(TTSControl, { view: 'church' }))));
    expect(fabs().length).toBe(1);
    act(() => { fabs()[0].click(); });
    expect(container.querySelectorAll('[data-testid="reader-look-and-feel"]').length).toBe(1);
    expect(container.querySelectorAll('[data-testid="reader-follow-options"]').length).toBe(1);
  });

  it('the app-level reader outranks one a surface mounts; ties go to the first', () => {
    _resetReadersForTests();
    const offA = registerReader('a', 0);
    expect(chosenReader()).toBe('a');
    const offB = registerReader('b', 0);
    expect(chosenReader()).toBe('a');
    const offApp = registerReader('app', 1);
    expect(chosenReader()).toBe('app');
    offApp();
    expect(chosenReader()).toBe('a');
    offA();
    expect(chosenReader()).toBe('b');
    offB();
    expect(chosenReader()).toBeNull();
  });

  it('the Practice Learn tab does not mount a second reader', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'Practice.jsx'), 'utf8');
    expect(src).toMatch(/<PracticeLearn email=\{email\} isStaff=\{isStaff\} readAloud=\{false\} \/>/);
  });
});
