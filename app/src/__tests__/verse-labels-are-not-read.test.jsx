// @vitest-environment jsdom
// =============================================================================
// A verse's labels and links are for the eye, never the ear.
// =============================================================================
// Darrell 2026-11-24, with the reader running on a verse card in the Love
// Corner ("Backs: Spiritual Module · The Word", "Hide other translations",
// "ESV ↗ NIV ↗ NKJV ↗ AMP ↗" circled): "Should not ever be read by the
// reader!!!!!!! Fix it..."
//
// The page reader speaks buildFollowMap(...).text. It already skipped buttons;
// it did not skip the Backs labels (plain text) or the version chips (links).
// Both blocks now carry [data-read-skip], the reader's own word for chrome.
//
// Pinned on the real Scripture library, rendered:
//   1. the labels and the version links are still on screen;
//   2. the reader's map holds none of them, while the verse itself is heard;
//   3. PROVEN TO CATCH: with the skip taken off, the same words ARE heard.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ScriptureLibrary from '../components/ScriptureLibrary.jsx';
import { buildFollowMap } from '../lib/read-follow.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host, root;
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(createElement(ScriptureLibrary, {})));
  // The verse cards live under "Curated study" (the library opens on the full Bible).
  act(() => [...host.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Curated study').click());
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const openAllTranslations = () =>
  act(() => {
    for (const b of [...host.querySelectorAll('button')].filter((x) => /Read other translations/.test(x.textContent))) b.click();
  });
const heard = () => buildFollowMap(host).text;

describe('a verse card is read as the Word, not as its labels', () => {
  it('the labels and the version links are on screen', () => {
    openAllTranslations();
    expect(host.textContent).toMatch(/Backs:/);
    expect(host.textContent).toMatch(/Hide other translations/);
    expect([...host.querySelectorAll('a')].some((a) => /^ESV/.test(a.textContent))).toBe(true);
  });

  it('none of them is in what the reader speaks, and the verses still are', () => {
    openAllTranslations();
    const text = heard();
    expect(text).not.toMatch(/Backs:/); // the label; the intro's own prose ("backs the spiritual teaching") is read
    expect(text).not.toMatch(/Hide other translations/i); // the control; the footer sentence about translations is prose
    expect(text).not.toMatch(/\b(ESV|NIV|NKJV|AMP)\s*↗/); // the chips; the copyright notice naming them is prose
    expect(text).not.toMatch(/Spiritual Module/i);
    // A KJV verse the library shows is still read (2 Timothy 1:7 is in its first theme or later; any "God" line will do).
    expect(text.length).toBeGreaterThan(500);
    expect(text).toMatch(/KJV|God|LORD|Jesus/);
  });

  it('PROVEN TO CATCH: the same card with the skip taken off IS read', () => {
    openAllTranslations();
    for (const el of host.querySelectorAll('[data-read-skip]')) el.removeAttribute('data-read-skip');
    const text = heard();
    expect(text).toMatch(/Backs:/);
    expect(text).toMatch(/\bESV\s*↗/);
  });
});
