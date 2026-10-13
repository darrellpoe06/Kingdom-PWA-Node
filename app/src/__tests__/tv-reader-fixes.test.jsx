// @vitest-environment jsdom
// =============================================================================
// The three things a Fire TV found that a phone never would
// =============================================================================
// Darrell, 2026-09-20, watching a lesson on a Firestick, in this order:
//   "Make sure the highlighting works with the reader."
//   "I can't pick lessons outside of what the screen shows.... the scrolling
//    isn't working for the lessons lists... fix it... too..."
//   "Not reading yet... even though it says so...."
//
// Three separate defects, one common shape: each was a DEGRADATION THAT HAD
// BEEN ACCEPTED IN WRITING somewhere in the codebase, on the reasonable
// assumption that the reader has a phone in their hand. On a sofa, ten feet
// from the screen, with only a D-pad, every one of those assumptions fails.

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { boxesFor, ensureLayer, paint, clearAll, LAYER_ID } from '../lib/highlight-fallback.js';
import { focusAndReveal } from '../lib/remote-navigation.js';

const repoRoot = resolve(__dirname, '../../..');
const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');
const rect = (left, top, width, height) => ({ left, top, width, height });

describe('1. the highlight is painted even without CSS.highlights', () => {
  // read-follow.js uses the CSS Custom Highlight API, which shipped in
  // Chromium 105; Fire TV's Silk predates it. index.css accepted the loss in
  // so many words — "browsers without the API simply never paint these and the
  // auto-scroll floor still follows." That floor is enough when your eye is a
  // hand's width from the text. It is nothing at all across a room.
  beforeEach(() => { document.body.innerHTML = ''; clearAll(window); });

  it('turns line-box rects into document-space boxes', () => {
    // getClientRects returns ONE RECT PER LINE the range crosses, which is
    // exactly the shape of a highlighter stroke over wrapped text.
    const boxes = boxesFor([rect(10, 20, 100, 16), rect(0, 36, 80, 16)], { scrollX: 5, scrollY: 50 });
    expect(boxes).toEqual([
      { left: 15, top: 70, width: 100, height: 16 },
      { left: 5, top: 86, width: 80, height: 16 },
    ]);
  });

  it('drops zero-area rects, which some engines render as a hairline', () => {
    // A range starting exactly at a line break produces an empty leading rect.
    expect(boxesFor([rect(0, 0, 0, 16), rect(0, 0, 50, 16), rect(0, 0, 50, 0)])).toHaveLength(1);
  });

  it('paints one element per box, and replaces them on the next call', () => {
    const range = { getClientRects: () => [rect(0, 0, 100, 16), rect(0, 16, 60, 16)] };
    expect(paint('poe-read-seg', range, window)).toBe(2);
    expect(document.querySelectorAll('[data-hl="poe-read-seg"]')).toHaveLength(2);
    // A second sentence must REPLACE the first, never accumulate — otherwise a
    // long lesson ends up painted end to end.
    expect(paint('poe-read-seg', { getClientRects: () => [rect(0, 32, 90, 16)] }, window)).toBe(1);
    expect(document.querySelectorAll('[data-hl="poe-read-seg"]')).toHaveLength(1);
  });

  it('the two names are independent — a word never erases its sentence', () => {
    paint('poe-read-seg', { getClientRects: () => [rect(0, 0, 100, 16)] }, window);
    paint('poe-read-word', { getClientRects: () => [rect(10, 0, 20, 16)] }, window);
    expect(document.querySelectorAll('[data-hl="poe-read-seg"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-hl="poe-read-word"]')).toHaveLength(1);
  });

  it('a null range clears that name and nothing else', () => {
    paint('poe-read-seg', { getClientRects: () => [rect(0, 0, 100, 16)] }, window);
    paint('poe-read-word', { getClientRects: () => [rect(0, 0, 20, 16)] }, window);
    expect(paint('poe-read-seg', null, window)).toBe(0);
    expect(document.querySelectorAll('[data-hl="poe-read-seg"]')).toHaveLength(0);
    expect(document.querySelectorAll('[data-hl="poe-read-word"]')).toHaveLength(1);
  });

  it('the layer can never eat a remote press', () => {
    // A full-page overlay that swallowed OK would make the app unusable — a
    // far worse bug than the one being fixed.
    ensureLayer(document);
    expect(read('app/src/index.css')).toMatch(/#poe-read-highlight-layer[\s\S]{0,200}pointer-events: none/);
    expect(document.getElementById(LAYER_ID).getAttribute('aria-hidden')).toBe('true');
  });

  it('survives a range that refuses to measure', () => {
    expect(paint('poe-read-seg', { getClientRects: () => { throw new Error('detached'); } }, window)).toBe(0);
    expect(paint('poe-read-seg', {}, window)).toBe(0);
  });

  it('read-follow actually calls it instead of returning false', () => {
    const rf = read('app/src/lib/read-follow.js');
    expect(rf).toMatch(/import \{ paint as paintFallback/);
    expect(rf, 'the no-API path still gives up silently').toMatch(/supportsHighlight\(win\)\) return paintFallback/);
  });

  it('the fallback matches the API path, and is never true red (DR-0099)', () => {
    const css = read('app/src/index.css');
    // Same rust as ::highlight(poe-read-seg) — one feature, not two that look
    // different depending on the device.
    expect(css).toMatch(/\.poe-hl-poe-read-seg[\s\S]{0,120}rgba\(184, 88, 56, 0\.22\)/);
    expect(css).toMatch(/\[data-theme="midnight"\] \.poe-hl-poe-read-seg/);
  });
});

describe('2. moving focus brings the target ON SCREEN', () => {
  // "I can't pick lessons outside of what the screen shows." A TV browser drives
  // a pointer with the D-pad, and a pointer cannot reach a list item below the
  // fold: no wheel, no thumb, no Tab key. Walking focus is the mechanism that
  // reaches them, and it only works if each step reveals its target.
  it('focuses AND scrolls into view, with the two not fighting', () => {
    const calls = [];
    const el = {
      focus: (opts) => calls.push(['focus', opts && opts.preventScroll]),
      scrollIntoView: (opts) => calls.push(['scroll', opts && opts.block]),
    };
    focusAndReveal(el);
    expect(calls).toEqual([['focus', true], ['scroll', 'nearest']]);
  });

  it("block:'nearest' — a long list creeps, it does not lurch a screen at a time", () => {
    let block = null;
    focusAndReveal({ focus: () => {}, scrollIntoView: (o) => { block = o && o.block; } });
    expect(block).toBe('nearest');
  });

  it('falls back when an old engine rejects the options object', () => {
    // Silk is old enough that this is a real possibility, and a throw here
    // would kill the keydown handler mid-navigation.
    let focused = false; let scrolled = false;
    focusAndReveal({
      focus: (o) => { if (o) throw new Error('no options'); focused = true; },
      scrollIntoView: (o) => { if (o) throw new Error('no options'); scrolled = true; },
    });
    expect(focused).toBe(true);
    expect(scrolled).toBe(true);
  });

  it('a non-element is ignored rather than thrown on', () => {
    expect(() => focusAndReveal(null)).not.toThrow();
    expect(() => focusAndReveal({})).not.toThrow();
  });

  it('the navigation handler uses it, so every move reveals', () => {
    const lib = read('app/src/lib/remote-navigation.js');
    expect(lib).toMatch(/focusAndReveal\(items\[next\]\)/);
    expect(lib, 'the first-press adopt must reveal too').toMatch(/focusAndReveal\(items\[0\]\)/);
  });
});

describe('3. the panel can no longer say READING while nothing reads', () => {
  // "Not reading yet... even though it says so." The start watchdog — the
  // "never a dead, silent button" guarantee — was gated on `'speaking' in
  // this.synth`, a condition added so that "the simple unit-test fakes are
  // unaffected". On any engine without that property the watchdog never armed,
  // status stayed 'playing' for ever, `failed` never flipped, and the panel
  // reported a reading that was not happening.
  const tts = read('app/src/lib/tts.js');

  it('the watchdog arms on ANY synth, not only one exposing `speaking`', () => {
    expect(tts).toMatch(/if \(typeof setTimeout === 'function' && this\.synth\) \{/);
    expect(tts, 'the test-convenience guard is back').not.toMatch(
      /typeof setTimeout === 'function' && this\.synth && \('speaking' in this\.synth\)/,
    );
  });

  it('`speaking` is still USED when present — a real read is not called a failure', () => {
    // Dropping the guard must not drop the escape hatch: an engine that speaks
    // without firing onstart is reading, not failing.
    expect(tts).toMatch(/isSpeaking = !!this\.synth\.speaking/);
    expect(tts).toMatch(/if \(isSpeaking\) return;/);
  });

  it('and the failure it detects still reaches a person', () => {
    expect(tts).toMatch(/this\.failed = true/);
    expect(read('app/src/lib/use-read-aloud.js')).toMatch(/if \(tts\.failed\) setNotice\(/);
    expect(read('app/src/components/TTSControl.jsx')).toMatch(/data-testid="read-aloud-notice"/);
  });
});
