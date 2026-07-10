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
import { GIVING_CHANNELS } from '../lib/giving.js';

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
  it('links ONLY to the church-published destinations (the four slide channels + the church site), all opening safely', () => {
    act(() => root.render(createElement(ChurchGivePanel, { church: COLG, onClose: () => {} })));
    const anchors = Array.from(container.querySelectorAll('a[href]'))
      .filter((a) => !a.getAttribute('href').startsWith('https://www.youtube.com')); // Call-to-Give service links are corpus rows, tested in call-to-give.test.js
    const allowed = new Set([...GIVING_CHANNELS.map((c) => c.url), COLG.links.give]);
    expect(anchors.length).toBeGreaterThanOrEqual(5); // 4 channels + the website
    for (const a of anchors) {
      expect(allowed.has(a.getAttribute('href')), `unexpected link: ${a.getAttribute('href')}`).toBe(true);
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toMatch(/noopener/);
    }
    expect(container.textContent).toMatch(/No payment information/i);
    // The four channels render with their plain-words identity, each with a scannable QR.
    for (const ch of GIVING_CHANNELS) expect(container.textContent).toContain(ch.label);
    expect(container.querySelectorAll('a svg').length).toBeGreaterThanOrEqual(4); // the QR codes
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

  it('shows a clearly-flagged "needs a giving URL" state — the published channels stay, but no guessed site link', () => {
    act(() => root.render(createElement(ChurchGivePanel, { church: {}, onClose: () => {} })));
    expect(container.textContent).toMatch(/Giving link needed/i);
    // The church's own published channels are independent of the site link and
    // remain; every remaining anchor must be one of them — never a guessed URL.
    const channelUrls = new Set(GIVING_CHANNELS.map((c) => c.url));
    const anchors = Array.from(container.querySelectorAll('a[href]'))
      .filter((a) => !a.getAttribute('href').startsWith('https://www.youtube.com'));
    expect(anchors.length).toBe(GIVING_CHANNELS.length);
    for (const a of anchors) expect(channelUrls.has(a.getAttribute('href'))).toBe(true);
  });
});
