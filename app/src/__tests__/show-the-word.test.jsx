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
import { readFileSync, readdirSync } from 'node:fs';
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
    ['../components/LessonFlow.jsx'],
    ['../components/EternalAlgorithmsStudy.jsx'],
  ])('%s', (rel) => {
    expect(read(rel)).toMatch(/<ShowTheWordToggle\b/);
  });
});

// ---------------------------------------------------------------------------
// THE LIVE MAP, as Darrell met it (2026-09-09: "Button does not work.... Did
// you test it?!!!!"). The earlier suite mounted chips on a bare page, where
// the switch worked; on the real map every pattern card starts collapsed, so
// the switch opened verses inside closed cards and nothing showed. This
// describe mounts the REAL component and presses the REAL button.
// ---------------------------------------------------------------------------
describe('on the real Torah pattern map', () => {
  it('Show the Word opens the pattern cards themselves, so the verses are actually visible', async () => {
    const { default: TorahPatternMap } = await import('../components/TorahPatternMap.jsx');
    const { __setBibleFetcher } = await import('../lib/bible-kjv.js');
    const chapters = []; chapters[0] = []; chapters[0][25] = 'And God said, Let us make man in our image, after our likeness:';
    __setBibleFetcher(async () => ({ ok: true, json: async () => ({ chapters }) }));
    try {
      const host = render(<TorahPatternMap />);
      const cards = () => [...host.querySelectorAll('li > button[aria-expanded]')];
      expect(cards().length).toBeGreaterThan(5);
      expect(cards().every((b) => b.getAttribute('aria-expanded') === 'false')).toBe(true);
      expect(host.querySelector('[role="region"]')).toBeNull();
      click(byText(host, /Show the Word/));
      await settle();
      await settle();
      // Every card is open, and the verses are on the page.
      expect(cards().every((b) => b.getAttribute('aria-expanded') === 'true')).toBe(true);
      expect(host.querySelectorAll('[role="region"]').length).toBeGreaterThan(10);
      // One card still closes on its own on top of the switch.
      click(cards()[0]);
      expect(cards()[0].getAttribute('aria-expanded')).toBe('false');
      expect(cards()[1].getAttribute('aria-expanded')).toBe('true');
      // And Hide closes everything, including that card's override.
      click(byText(host, /Hide the Word/));
      expect(cards().every((b) => b.getAttribute('aria-expanded') === 'false')).toBe(true);
      expect(host.querySelector('[role="region"]')).toBeNull();
    } finally { __setBibleFetcher(null); }
  });

  it('the pattern title owns its row and the Person chips sit beneath it, never beside it', async () => {
    const { default: TorahPatternMap } = await import('../components/TorahPatternMap.jsx');
    const host = render(<TorahPatternMap />);
    const card = host.querySelector('li > button[aria-expanded]');
    const rows = [...card.children];
    // Row one: title + arrow. Row two: the chips. Side by side at large text
    // on a phone, the chips squeezed the title to one word per line.
    expect(rows.length).toBe(2);
    expect(rows[0].querySelector('[style]')).toBeTruthy();
    expect(rows[1].className).toMatch(/\bblock\b/);
  });

  it('the toggle never swaps to white text on hover — a phone keeps hover after a tap', () => {
    expect(read('../components/ShowTheWordToggle.jsx')).not.toMatch(/hover:text-white/);
    expect(read('../components/ShowTheWordToggle.jsx')).not.toMatch(/hover:bg-\[#5A6E3D\]/);
  });
});

// -----------------------------------------------------------------------------
// Darrell, 2026-09-09, on the Study series page: "The Word does not drop down
// on all pages?!!!" — the switch opened verses INSIDE folds that stayed shut.
// Two gates so it can never come back: the real study, and a source scan of
// every component that both folds and renders the Word.
// -----------------------------------------------------------------------------
describe('on the real Eternal Algorithms study', () => {
  it('Show the Word opens every content fold — Go deeper, the deep layer, the review, the entries — so the Word is actually visible', async () => {
    const { default: EternalAlgorithmsStudy } = await import('../components/EternalAlgorithmsStudy.jsx');
    const host = render(<EternalAlgorithmsStudy email="visitor@example.com" view="church" churchView="eternal-algorithms" />);
    await settle();
    // Every fold that holds the Word: the "About this" fold is the one exception (no Word inside).
    const folds = () => [...host.querySelectorAll('button[aria-expanded]')].filter((b) => !/About this/i.test(b.textContent || '') && !/^(Open|Close) /.test(b.getAttribute('aria-label') || ''));
    expect(folds().length).toBeGreaterThan(3);
    expect(folds().every((b) => b.getAttribute('aria-expanded') === 'false')).toBe(true);
    click(byText(host, /Show the Word/));
    await settle();
    await settle();
    expect(folds().every((b) => b.getAttribute('aria-expanded') === 'true')).toBe(true);
    // The deep layer's prose is now on the page.
    expect(host.textContent).toMatch(/Close/);
    // One fold still closes on its own on top of the switch.
    click(folds()[0]);
    expect(folds()[0].getAttribute('aria-expanded')).toBe('false');
    expect(folds()[1].getAttribute('aria-expanded')).toBe('true');
    // Hide closes them all, the override included.
    click(byText(host, /Hide the Word/));
    expect(folds().every((b) => b.getAttribute('aria-expanded') === 'false')).toBe(true);
  });
});

describe('every fold that holds the Word follows the switch (source scan, proven-to-catch)', () => {
  // A component that both folds (aria-expanded) and renders the Word
  // (WordInline / VerseChips / VerseBlock) must bind each fold's open state to
  // useOpenWithTheWord — except the folds named here, with their reason.
  const EXEMPT = {
    'VerseChips.jsx': ['open'],                 // the chip IS the reference's own open state
    'WordInline.jsx': ['isOpen(seg.value)'],    // same — the chip inline in prose
    'EternalAlgorithmsStudy.jsx': ['aboutOpen'], // "About this" holds no Word
    'PracticeLearn.jsx': ['open', 'mOpen'],     // navigation accordions: pick a lesson, not a fold of the Word
    'ChurchLearn.jsx': ['tutorOpen'],           // the tutor panel, not the Word
    'ScriptureLibrary.jsx': ['open'],           // other translations / the check: per-verse tools, not hidden references
  };
  const dir = join(HERE, '..', 'components');
  const files = readdirSync(dir).filter((f) => f.endsWith('.jsx'));
  for (const f of files) {
    const src = readFileSync(join(dir, f), 'utf8');
    if (!/aria-expanded=\{/.test(src)) continue;
    if (!/WordInline|VerseChips|VerseBlock/.test(src)) continue;
    it(`${f}: every aria-expanded state comes from useOpenWithTheWord (or is named exempt)`, () => {
      const states = [...src.matchAll(/aria-expanded=\{([^}]+)\}/g)].map((m) => m[1].trim());
      const exempt = EXEMPT[f] || [];
      const lines = src.split('\n');
      const bound = (s) => lines.some((ln) => ln.includes(`const [${s}, `) && ln.includes('] = useOpenWithTheWord('));
      const bad = states.filter((s) => !exempt.includes(s) && !bound(s));
      expect(bad, `${f}: folds holding the Word that ignore the switch: ${bad.join(', ')}`).toEqual([]);
    });
  }
});
