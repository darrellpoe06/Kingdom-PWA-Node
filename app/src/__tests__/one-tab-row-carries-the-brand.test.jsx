// =============================================================================
// The one-tab row carries the brand (DR-0640)
// =============================================================================
// Darrell 2026-09-24, on his Fold in The Love Corner with the header tucked
// away: "Why does the Church tab space need that? Can we save even more space
// if not... can we add another Love Corner etc tag in the space? Make sense?"
// And, asked whether the brand should then leave the collapsed row: "Both
// places are good... why not".
//
// These render the real TopNavRow with createRoot + act. The geometry (one
// row, not two; the brand on screen at every size) is measured in Chromium by
// scripts/chrome-layout-probe.mjs, the one-tab pass. This file pins the DOM.
// PROVEN-TO-CATCH (run by hand when this was written): making loneTab() always
// return null fails the one-tab tests; making it return the first tab of any
// list fails the many-tabs test; dropping the hatch's brand fails "both places".
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import TopNavRow, { loneTab } from '../components/TopNavRow.jsx';
import { TextSizeEscapeHatch } from '../components/TextSizeControl.jsx';
import { DEFAULT_TEXT_SIZE } from '../lib/text-size.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));

let container, root;
async function mount(element) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(element);
  });
  return container;
}
beforeEach(() => { try { localStorage.setItem('poe-text-size', DEFAULT_TEXT_SIZE); } catch { /* jsdom */ } });
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  root = null; container = null;
});

const tab = (id, label) => createElement('button', { key: id, type: 'button' }, label);
const sep = () => createElement('span', { key: 'sep', 'aria-hidden': 'true' });
const BRAND = { brandName: 'The Love Corner', brandTagline: 'The Church of the Living God' };
const hatchFor = (collapsed) => createElement(TextSizeEscapeHatch, { collapsed, onShowHeader: () => {}, siteName: BRAND.brandName, siteTagline: BRAND.brandTagline });
const row = (collapsed, tabs) => createElement(TopNavRow, { collapsed, onToggleHeader: () => {}, hatch: hatchFor(collapsed), ...BRAND }, tabs);

describe('one tab: the row becomes the brand row', () => {
  it('draws no lone tab row, and the brand sits in the top row', async () => {
    const el = await mount(row(true, [tab('church', 'Church')]));
    const nav = el.querySelector('nav');
    expect(nav.querySelector('.tab-scroll'), 'no tab strip for a single tab').toBeNull();
    expect([...nav.querySelectorAll('button')].some((b) => b.textContent === 'Church'), 'no lone "Church" tab button').toBe(false);
    expect(nav.querySelector('[data-testid="one-tab-brand-row"]')).toBeTruthy();
    // Back/forward on the left, the chevron on the right.
    expect(nav.querySelector('[aria-label="Back to previous page"]')).toBeTruthy();
    expect(nav.querySelector('button[aria-expanded]')).toBeTruthy();
  });

  it('still tells a screen reader where it is', async () => {
    const el = await mount(row(true, [tab('church', 'Church')]));
    const here = el.querySelector('[data-testid="one-tab-current"]');
    expect(here.textContent).toBe('Church');
    expect(here.getAttribute('aria-current')).toBe('page');
    expect(here.className).toMatch(/\bsr-only\b/);
  });

  it('the collapsed row rides INSIDE the top row: one row, not two', async () => {
    const el = await mount(row(true, [tab('church', 'Church')]));
    const collapsedRow = el.querySelector('[data-testid="collapsed-row"]');
    expect(collapsedRow, 'the collapsed row renders').toBeTruthy();
    expect(el.querySelector('nav').contains(collapsedRow), 'and it is inside the nav row').toBe(true);
    expect(collapsedRow.className).toMatch(/\bts-hatch-inline\b/);
    // "Show header" and the text size stay (the phone compact rules intact).
    expect(collapsedRow.querySelector('[data-testid="show-full-header"]')).toBeTruthy();
    expect(collapsedRow.querySelector('[data-testid="text-size-compact"]')).toBeTruthy();
  });

  it('"Both places are good... why not": the brand is in the top row AND on the collapsed row', async () => {
    const el = await mount(row(true, [tab('church', 'Church')]));
    expect(el.querySelector('[data-testid="top-brand-name"]').textContent).toBe('The Love Corner');
    expect(el.querySelector('[data-testid="top-brand-tagline"]').textContent).toBe('The Church of the Living God');
    expect(el.querySelector('[data-testid="collapsed-site-name"]').textContent).toBe('The Love Corner');
    expect(el.querySelector('[data-testid="collapsed-site-tagline"]').textContent).toBe('The Church of the Living God');
    // The top row's own lockup yields while the collapsed row is beside it,
    // and comes back when that row is the bottom bar (index.css).
    expect(el.querySelector('[data-testid="one-tab-brand"]').className).toMatch(/\bone-tab-brand--float\b/);
  });

  it('with the header open, the row carries the brand and no collapsed row', async () => {
    const el = await mount(row(false, [tab('church', 'Church')]));
    const brand = el.querySelector('[data-testid="one-tab-brand"]');
    expect(brand.className).toMatch(/^flex /);
    expect(brand.className).not.toMatch(/one-tab-brand--float/);
    expect(el.querySelector('[data-testid="collapsed-row"]')).toBeNull();
    expect(el.querySelector('.tab-scroll')).toBeNull();
  });
});

describe('many tabs: nothing changes', () => {
  it('renders the tab strip with every tab, and the collapsed row ABOVE the nav, not in it', async () => {
    const el = await mount(row(true, [tab('overview', 'Big Picture'), tab('books', 'Books'), sep(), tab('church', 'Church')]));
    const nav = el.querySelector('nav');
    const strip = nav.querySelector('.tab-scroll');
    expect(strip, 'the tab strip renders').toBeTruthy();
    expect([...strip.querySelectorAll('button')].map((b) => b.textContent)).toEqual(expect.arrayContaining(['Big Picture', 'Books', 'Church']));
    expect(nav.querySelector('[data-testid="one-tab-brand-row"]')).toBeNull();
    expect(nav.querySelector('[data-testid="top-brand-name"]')).toBeNull();
    const collapsedRow = el.querySelector('[data-testid="collapsed-row"]');
    expect(collapsedRow).toBeTruthy();
    expect(nav.contains(collapsedRow)).toBe(false);
    expect(collapsedRow.className).not.toMatch(/ts-hatch-inline/);
    expect(collapsedRow.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // The chevron never yields in the many-tab row.
    expect(nav.querySelector('button[aria-expanded]').className).not.toMatch(/one-tab-chevron-yields/);
  });
});

describe('loneTab', () => {
  it('is the one tab when there is one, ignoring the separator', () => {
    expect(loneTab([tab('church', 'Church')]).key).toBe('.$church');
    expect(loneTab([sep(), tab('church', 'Church')]).key).toBe('.$church');
  });
  it('is null for two or more tabs, or none', () => {
    expect(loneTab([tab('a', 'A'), tab('b', 'B')])).toBeNull();
    expect(loneTab([])).toBeNull();
  });
});

describe('the shell wires it', () => {
  const shell = readFileSync(join(HERE, '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
  it('mounts TopNavRow with the same brand the header wordmark and the collapsed row show', () => {
    expect(shell).toMatch(/<TopNavRow [^\n]*brandName=\{churchBrand \? 'The Love Corner' : 'Family Operating Systems'\} brandTagline=\{churchBrand \? 'The Church of the Living God' : 'PoeTech · Life, Soul & Money'\}/);
    expect(shell).toMatch(/hatch=\{<TextSizeEscapeHatch collapsed=\{headerCollapsed\}/);
  });
  it('the church door still filters the top tabs down to Church alone (the one-tab case)', () => {
    expect(shell).toMatch(/\.filter\(\(\[id\]\) => \(!churchDoorOnly \|\| id === 'church'\)/);
  });
});
