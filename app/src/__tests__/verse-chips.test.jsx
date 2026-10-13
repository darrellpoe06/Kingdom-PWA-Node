// =============================================================================
// VerseChips — tap a reference and the Word opens right there; nothing navigates
// =============================================================================
// Darrell, 2026-09-08: "Make the bible verses clickable for seeing the Word when
// pressed... don't leave the page... just open right there... no quick moves
// to another place... open at the location it's clicked... inline."
//
// PROVEN-TO-CATCH (DR-0076 §3): turning the chip back into an <a href> fails
// "no link anywhere"; rendering text before the loader answers fails the
// loading case; inventing text for a verse the loader cannot supply fails the
// honest-miss case; opening a second chip closing the first fails "several at
// once"; a chip under the 36px floor or without a focus ring fails the
// standard cases; and the Torah map falling back to plain spans fails the
// last describe.
import React, { act } from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import VerseChips from '../components/VerseChips.jsx';
import TorahPatternMap from '../components/TorahPatternMap.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));

let mounted = [];
afterEach(() => {
  mounted.forEach(({ root, host }) => { act(() => root.unmount()); host.remove(); });
  mounted = [];
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

const KJV = {
  'Genesis 6:2': 'That the sons of God saw the daughters of men that they were fair; and they took them wives of all which they chose.',
  'Genesis 6:4': 'There were giants in the earth in those days;',
};
const load = vi.fn(async (r) => KJV[r] || '');

describe('a reference is a button that opens the Word in place', () => {
  it('renders every reference as a button, and NO link anywhere', () => {
    const host = render(<VerseChips refs={['Genesis 6:2', 'Genesis 6:4']} load={load} />);
    expect(buttons(host).map((b) => b.textContent)).toEqual(['Genesis 6:2', 'Genesis 6:4']);
    expect(host.querySelector('a')).toBeNull();
    expect(host.innerHTML).not.toMatch(/href=/);
  });

  it('opens the verbatim text beneath the chips when pressed, and nothing before the text arrives', async () => {
    const host = render(<VerseChips refs={['Genesis 6:2']} load={load} />);
    expect(host.textContent).not.toMatch(/sons of God saw/);
    click(byText(host, /Genesis 6:2/));
    // The instant after the tap: the chip is marked open and the block says it is opening.
    expect(byText(host, /Genesis 6:2/).getAttribute('aria-expanded')).toBe('true');
    expect(host.textContent).toMatch(/Opening Genesis 6:2/);
    await settle();
    expect(host.textContent).toContain(KJV['Genesis 6:2']);
    expect(host.textContent).toMatch(/KJV/);
    expect(load).toHaveBeenCalledWith('Genesis 6:2');
    // The block sits in the same container, after the chip row — not elsewhere.
    const region = host.querySelector('[role="region"]');
    expect(region).toBeTruthy();
    expect(region.compareDocumentPosition(byText(host, /Genesis 6:2/)) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it('presses again to close, leaving the chips where they were', async () => {
    const host = render(<VerseChips refs={['Genesis 6:2']} load={load} />);
    click(byText(host, /Genesis 6:2/));
    await settle();
    click(byText(host, /Genesis 6:2/));
    expect(host.querySelector('[role="region"]')).toBeNull();
    expect(byText(host, /Genesis 6:2/).getAttribute('aria-expanded')).toBe('false');
  });

  it('holds several open at once, in chip order', async () => {
    const host = render(<VerseChips refs={['Genesis 6:2', 'Genesis 6:4']} load={load} />);
    click(byText(host, /Genesis 6:4/));
    click(byText(host, /Genesis 6:2/));
    await settle();
    const regions = [...host.querySelectorAll('[role="region"]')].map((r) => r.getAttribute('aria-label'));
    expect(regions).toEqual(['Genesis 6:2', 'Genesis 6:4']);
  });

  it('says plainly when a verse cannot be opened — never fills it in', async () => {
    const host = render(<VerseChips refs={['Genesis 99:1']} load={load} />);
    click(byText(host, /Genesis 99:1/));
    await settle();
    expect(host.textContent).toMatch(/could not be opened on this device right now/);
    expect(host.textContent).toMatch(/nothing is filled in/);
    expect(host.innerHTML).not.toMatch(/“/);   // no quotation marks around invented text
  });

  it('survives a loader that throws, with the same honest message', async () => {
    const boom = vi.fn(async () => { throw new Error('offline'); });
    const host = render(<VerseChips refs={['Genesis 6:2']} load={boom} />);
    click(byText(host, /Genesis 6:2/));
    await settle();
    expect(host.textContent).toMatch(/could not be opened/);
  });

  it('meets the house standard: a 36px floor, a focus ring, and a spoken label on every chip', () => {
    const host = render(<VerseChips refs={['Genesis 6:2']} load={load} />);
    const b = byText(host, /Genesis 6:2/);
    expect(b.className).toMatch(/min-h-\[36px\]/);
    expect(b.className).toMatch(/focus:outline/);
    expect(b.getAttribute('aria-label')).toBe('Open Genesis 6:2');
    expect(b.getAttribute('type')).toBe('button');
  });
});

describe('the Torah pattern map uses it', () => {
  it('a pattern\'s references are buttons that open the verse in the card, without leaving the map', async () => {
    // The real component; the KJV fetch is stubbed at the bible-kjv seam.
    const { __setBibleFetcher } = await import('../lib/bible-kjv.js');
    const chapters = [];
    chapters[5] = [];                    // Genesis 6
    chapters[5][1] = KJV['Genesis 6:2'];  // verse 2
    chapters[5][3] = KJV['Genesis 6:4'];  // verse 4
    __setBibleFetcher(async () => ({ ok: true, json: async () => ({ chapters }) }));
    try {
      const host = render(<TorahPatternMap />);
      const tab = byText(host, /The enemies, named/);
      click(tab);
      const row = byText(host, /The sons of God, and the giants/);
      click(row);
      const chip = byText(host, /^Genesis 6:2$/);
      expect(chip).toBeTruthy();
      const before = host.textContent;
      click(chip);
      await settle();
      await settle();
      expect(host.textContent).toContain(KJV['Genesis 6:2']);
      // The map is still the map: the pattern is still open, the tab is still chosen.
      expect(host.textContent).toMatch(/Where the text stops, we stop/i);
      expect(host.textContent.length).toBeGreaterThan(before.length);
      expect(host.querySelector('a[href]')).toBeNull();
    } finally {
      __setBibleFetcher(null);
    }
  });

  it('the map no longer draws references as plain spans', () => {
    const src = readFileSync(join(HERE, '../components/TorahPatternMap.jsx'), 'utf8');
    expect(src).toMatch(/<VerseChips refs=\{pattern\.refs\} \/>/);
    expect(src).not.toMatch(/pattern\.refs\.map\(\(r\) => \(\s*<span/);
  });
});
