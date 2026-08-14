// @vitest-environment jsdom
// =============================================================================
// TTSControl — the Read Aloud panel is CHROME, capped, never ballooned
// =============================================================================
// Darrell 2026-07-27, from live phone screenshots at large print: "The sizes of
// text makes the talk section not useful for the user." The open panel's labels
// were rem-based inside a fixed 260px box, so at A+++/A44 the buttons wrapped,
// the five speed chips crushed together, and the panel clipped off-screen. The
// standing law (Pattern 2b, lib/text-size.js scope split): floating CONTROLS
// are chrome — capped via --ts-chrome-scale — while reading CONTENT scales
// fully. The collapsed FAB already obeyed; this proves the OPEN PANEL does too.
//
// Proven-to-catch: every assertion here fails against the pre-fix panel.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

// Mock the read-aloud hook: jsdom has no speechSynthesis, and the panel only
// renders when supported. The mock reports a ready, idle reader with the
// standard catalog so the full at-rest panel (all three action buttons, the
// speed grid, the voice picker, the explainer) mounts.
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: false, isPaused: false, rate: 1,
    read: () => {}, pause: () => {}, resume: () => {}, stop: () => {},      // claimAudio: the synchronous audio-session claim the play handler makes
      // inside the tap (background listening). A mock that omits it makes the
      // handler throw before it ever reads — which is exactly how the real
      // regression surfaced, so it is a no-op here rather than absent.
      claimAudio: () => {},
 setRate: () => {},
    catalog: [
      { id: 'sys', label: 'System voice', group: 'Default', usable: true },
      { id: 'dp', label: 'Darrell Poe', group: 'Your voices', usable: true, ai: true, standIn: true },
    ],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));

import TTSControl from '../components/TTSControl.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

function openPanel() {
  act(() => root.render(createElement(TTSControl, { view: 'church' })));
  const fab = container.querySelector('button[aria-label="Open read-aloud controls"]');
  act(() => fab.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  return container.querySelector('.tts-controls > div');
}

describe('TTSControl panel — chrome-capped so large print never breaks it', () => {
  it('the panel font-size is the CAPPED chrome size (var(--ts-chrome-scale)), not the raw root scale', () => {
    const panel = openPanel();
    expect(panel).toBeTruthy();
    expect(panel.style.fontSize).toContain('var(--ts-chrome-scale');
  });

  it('everything inside the panel is em-sized — no rem/text-xs classes left to ride the root scale past the cap', () => {
    const panel = openPanel();
    for (const el of [panel, ...panel.querySelectorAll('*')]) {
      const cls = typeof el.className === 'string' ? el.className : '';
      expect(cls.includes('rem]'), `rem-sized class survives on <${el.tagName.toLowerCase()}>: "${cls}"`).toBe(false);
      expect(/\btext-(xs|sm|base|lg)\b/.test(cls), `root-scaling text class survives on <${el.tagName.toLowerCase()}>: "${cls}"`).toBe(false);
    }
  });

  it('the panel box grows WITH its capped text (em width) and stays on-screen (viewport clamp + internal scroll)', () => {
    const panel = openPanel();
    expect(panel.className).toContain('w-[16.25em]');                 // width tracks the capped em, not fixed px
    expect(panel.className).toContain('max-w-[calc(100vw-2rem)]');    // never wider than the phone
    expect(panel.className).toContain('max-h-[calc(100dvh-7rem)]');   // never taller than the screen…
    expect(panel.className).toContain('overflow-y-auto');             // …it scrolls inside instead of clipping controls
  });

  it('the three talk actions and all five speed steps are present and reachable', () => {
    const panel = openPanel();
    const labels = Array.from(panel.querySelectorAll('button')).map((b) => b.textContent.trim());
    expect(labels.some((t) => /Read this page/i.test(t))).toBe(true);
    expect(labels.some((t) => /Start where I tap/i.test(t))).toBe(true);
    expect(labels.some((t) => /Talk about this/i.test(t))).toBe(true);
    expect(panel.querySelectorAll('[role="group"][aria-label="Reading speed"] button').length).toBe(5);
  });
});
