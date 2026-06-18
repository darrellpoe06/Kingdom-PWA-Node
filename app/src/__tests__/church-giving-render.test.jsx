// =============================================================================
// ChurchGiving — live render proof (Verification Doctrine: observe the REAL
// surface). Mounts the actual Give floater + panel in jsdom and proves what
// Darrell asked for: a distinct Give floater on Church (gift SVG, not an emoji),
// a panel that links ONLY to the church's own giving destination (never an
// invented URL), and the benefits of giving according to the Word with the six
// anchor scriptures + the anti-prosperity-gospel bright line.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ChurchGiveFloater, ChurchGivePanel } from '../components/ChurchGiving.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const COLG = {
  name: 'The Church of the Living God',
  site: 'https://thechurchofthelivinggod.com',
  links: { give: 'https://thechurchofthelivinggod.com' },
};

let container, root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

describe('ChurchGiveFloater — the floater', () => {
  it('renders a distinct Give pill with a cross-device SVG icon (not an emoji)', () => {
    act(() => root.render(createElement(ChurchGiveFloater, { church: COLG })));
    const btn = container.querySelector('button[aria-label="Give to the church"]');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toMatch(/Give/);
    expect(btn.querySelector('svg')).toBeTruthy();           // inline SVG gift icon
    expect(/[\u{1F300}-\u{1FAFF}]/u.test(btn.textContent)).toBe(false); // no emoji glyph
    expect(btn.className).toMatch(/fixed/);                   // floats
    expect(btn.className).toMatch(/right-4/);                 // bottom-right (Feedback owns left)
  });

  it('opens the panel on tap', () => {
    act(() => root.render(createElement(ChurchGiveFloater, { church: COLG })));
    const btn = container.querySelector('button[aria-label="Give to the church"]');
    act(() => btn.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(container.querySelector('[role="dialog"]')).toBeTruthy();
  });
});

describe('ChurchGivePanel — the panel', () => {
  it('links ONLY to the church-provided destination (never an invented URL), opens safely', () => {
    act(() => root.render(createElement(ChurchGivePanel, { church: COLG, onClose: () => {} })));
    const a = container.querySelector('a[href]');
    expect(a.getAttribute('href')).toBe(COLG.links.give);
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toMatch(/noopener/);
    expect(container.textContent).toMatch(/No payment information/i);
  });

  it('shows the benefits of giving according to the Word — six anchor scriptures + bright line', () => {
    act(() => root.render(createElement(ChurchGivePanel, { church: COLG, onClose: () => {} })));
    const text = container.textContent;
    for (const ref of ['Malachi 3:10', '2 Corinthians 9:6-8', 'Luke 6:38', 'Proverbs 11:25', 'Proverbs 3:9-10', 'Acts 20:35']) {
      expect(text).toContain(ref);
    }
    expect(text).toMatch(/not a transaction with a promised return/i); // anti-prosperity bright line
    expect(text).toMatch(/10%/);                                        // tithe baseline
  });

  it('shows a clearly-flagged "needs a giving URL" state and NO link when none configured', () => {
    act(() => root.render(createElement(ChurchGivePanel, { church: {}, onClose: () => {} })));
    expect(container.querySelector('a[href]')).toBeNull();   // never a dead/guessed link
    expect(container.textContent).toMatch(/Giving link needed/i);
  });
});
