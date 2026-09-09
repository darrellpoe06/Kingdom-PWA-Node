// =============================================================================
// Show the Word — every verse on the page opens with one tap, closes with one,
// and each chip still works on its own. Both.
// =============================================================================
// Darrell, 2026-09-08: "make all scriptures open with one click so the reader
// can read it with or without the scriptures presented... or else users have
// to click each one separately... collectively... and close collectively...
// also work independently... both... best of all options."
//
// PROVEN-TO-CATCH (DR-0076 §3): a switch that opens only the chips in one
// component fails "every reference on the page"; a chip that ignores the
// switch, or a switch that ignores a chip's own tap, fails the layered cases;
// a page-wide open that nudges the screen fails the still-screen case;
// forgetting the choice fails the remembered case; a surface without the
// toggle fails its pin.
import React, { act } from 'react';
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import VerseChips from '../components/VerseChips.jsx';
import WordInline from '../components/WordInline.jsx';
import ShowTheWordToggle from '../components/ShowTheWordToggle.jsx';
import {
  isShowTheWord, setShowTheWord, toggleShowTheWord, __resetShowTheWord, SHOW_THE_WORD_KEY,
} from '../lib/show-the-word.js';
import * as motion from '../lib/gentle-motion.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(HERE, rel), 'utf8');

let mounted = [];
beforeEach(() => { __resetShowTheWord(); });
afterEach(() => {
  mounted.forEach(({ root, host }) => { act(() => root.unmount()); host.remove(); });
  mounted = [];
  __resetShowTheWord();
});
function render(el) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => root.render(el));
  mounted.push({ root, host });
  return host;
}
const buttons = (h) => [...h.querySelectorAll('button')];
const byText = (h, re) => buttons(h).find((b) => re.test(b.textContent));
const click = (n) => act(() => { n.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const settle = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });
const regions = (h) => [...h.querySelectorAll('[role="region"]')].map((r) => r.getAttribute('aria-label'));

const KJV = {
  'Genesis 6:2': 'That the sons of God saw the daughters of men that they were fair;',
  'Genesis 6:4': 'There were giants in the earth in those days;',
  'Genesis 1:26': 'And God said, Let us make man in our image, after our likeness:',
};
const load = vi.fn(async (r) => KJV[r] || '');

/** A page with two separate components on it, the way a real surface has. */
function Page() {
  return (
    <div>
      <ShowTheWordToggle />
      <VerseChips refs={['Genesis 6:2', 'Genesis 6:4']} load={load} />
      <WordInline text="Our likeness in Genesis 1:26 is family language." load={load} />
    </div>
  );
}

describe('the switch', () => {
  it('starts off, flips, and is remembered on this device', () => {
    expect(isShowTheWord()).toBe(false);
    toggleShowTheWord();
    expect(isShowTheWord()).toBe(true);
    expect(localStorage.getItem(SHOW_THE_WORD_KEY)).toBe('on');
    setShowTheWord(false);
    expect(localStorage.getItem(SHOW_THE_WORD_KEY)).toBe('off');
  });

  it('tells the reader, in place, that references can be tapped, opened together, and read in order', () => {
    // Darrell: "Make sure the users know also..."
    const host = render(<ShowTheWordToggle />);
    expect(host.textContent).toMatch(/Tap any verse reference to read it right here/);
    expect(host.textContent).toMatch(/opens them all at once/);
    expect(host.textContent).toMatch(/in the order they happened, as far as the Word itself settles it/);
    const quiet = render(<ShowTheWordToggle hint={false} />);
    expect(quiet.textContent).not.toMatch(/Tap any verse/);
  });

  it('the toggle says what it will do, and marks itself pressed', () => {
    const host = render(<ShowTheWordToggle />);
    const b = buttons(host)[0];
    expect(b.textContent).toMatch(/Show the Word/);
    expect(b.getAttribute('aria-pressed')).toBe('false');
    expect(b.className).toMatch(/min-h-\[36px\]/);
    click(b);
    expect(b.textContent).toMatch(/Hide the Word/);
    expect(b.getAttribute('aria-pressed')).toBe('true');
  });
});

describe('collectively', () => {
  it('one tap opens EVERY reference on the page — chips and prose alike', async () => {
    const host = render(<Page />);
    expect(regions(host)).toEqual([]);
    click(byText(host, /Show the Word/));
    await settle();
    expect(regions(host)).toEqual(['Genesis 6:2', 'Genesis 6:4', 'Genesis 1:26']);
    expect(host.textContent).toContain(KJV['Genesis 1:26']);
  });

  it('one tap closes them all again', async () => {
    const host = render(<Page />);
    click(byText(host, /Show the Word/));
    await settle();
    click(byText(host, /Hide the Word/));
    expect(regions(host)).toEqual([]);
  });

  it('a page-wide open holds the screen perfectly still — no nudges at all', async () => {
    const spy = vi.spyOn(motion, 'gentleReveal');
    const host = render(<Page />);
    click(byText(host, /Show the Word/));
    await settle();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('independently, on top of the switch', () => {
  it('with the Word shown, one chip can be closed on its own', async () => {
    const host = render(<Page />);
    click(byText(host, /Show the Word/));
    await settle();
    click(byText(host, /^Genesis 6:4$/));
    expect(regions(host)).toEqual(['Genesis 6:2', 'Genesis 1:26']);
    expect(byText(host, /^Genesis 6:4$/).getAttribute('aria-expanded')).toBe('false');
  });

  it('with the Word hidden, one chip can be opened on its own', async () => {
    const host = render(<Page />);
    click(byText(host, /^Genesis 1:26$/));
    await settle();
    expect(regions(host)).toEqual(['Genesis 1:26']);
  });

  it('flipping the switch clears the individual choices, so the page reads whole again', async () => {
    const host = render(<Page />);
    click(byText(host, /^Genesis 6:2$/));            // opened alone
    await settle();
    click(byText(host, /Show the Word/));            // now everything
    await settle();
    expect(regions(host)).toEqual(['Genesis 6:2', 'Genesis 6:4', 'Genesis 1:26']);
    click(byText(host, /Hide the Word/));            // and nothing
    expect(regions(host)).toEqual([]);
  });
});

describe('the surfaces carry the toggle', () => {
  it.each([
    ['../components/TorahPatternMap.jsx'],
    ['../components/Study.jsx'],
    ['../components/ChurchLearn.jsx'],
    ['../components/ScriptureLibrary.jsx'],
  ])('%s', (rel) => {
    expect(read(rel)).toMatch(/<ShowTheWordToggle \/>/);
  });
});
