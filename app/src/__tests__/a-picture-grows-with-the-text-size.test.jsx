// @vitest-environment jsdom
// =============================================================================
// A picture grows with the reader's text size (DR-1575)
// =============================================================================
// Darrell 2026-11-18: "Larger text doesn't enlarge the fonts on the images....
// or documents..." A picture's lettering is pixels, so the picture itself is
// made bigger: the office's pictures fill their cards, and every full-size
// viewer opens at the reader's own text-size step with Larger and Smaller on
// screen and a box that scrolls both ways.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ChurchOfficeBoard from '../components/lovecorner/ChurchOfficeBoard.jsx';
import { ZoomControls, ZoomPane, usePictureZoom } from '../components/PictureZoom.jsx';
import { ZOOM_STEPS, zoomIndexForTextSize, stepZoomIndex, zoomAt, zoomLabel, MAX_CANVAS_PX } from '../lib/picture-zoom.js';
import { TEXT_SIZE_STEPS, setTextSize } from '../lib/text-size.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const here = dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(join(here, '../index.css'), 'utf8');
const VIEWER = readFileSync(join(here, '../components/DocumentViewer.jsx'), 'utf8');
const rule = (sel) => {
  const line = CSS.split('\n').find((l) => l.startsWith(`${sel}{`));
  return line ? line.slice(sel.length + 1, line.indexOf('}')) : null;
};

const DIGEST = {
  calendar: { label: 'November 2026', src: '/api/church-site?asset=cal', path: '/cal.jpg' },
  letter: { label: 'October 2026 letter', src: '/api/church-site?asset=letter', path: '/letter.jpg' },
  events: { intro: '', flyers: [{ path: '/f.jpg', src: '/api/church-site?asset=f', name: 'Battle Cry Sunday Veterans' }] },
  serviceTimes: [],
  fetchedAt: '2026-11-18T14:48:30.000Z',
};

let container, root;
beforeEach(() => {
  localStorage.clear();
  act(() => {
    setTextSize('normal');
  });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  act(() => {
    setTextSize('normal');
  });
});
const q = (sel) => container.querySelector(sel);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));

describe('the ladder', () => {
  it('opens on the reader’s own text-size step: every text size has its rung', () => {
    for (const s of TEXT_SIZE_STEPS) expect(zoomAt(zoomIndexForTextSize(s.key)), s.key).toBe(s.mult);
    expect(zoomIndexForTextSize('nonsense')).toBe(0);
  });
  it('100% is the floor, the ladder goes past Big Print, and steps stay inside it', () => {
    expect(ZOOM_STEPS[0]).toBe(1);
    expect(ZOOM_STEPS[ZOOM_STEPS.length - 1]).toBeGreaterThan(2.75);
    expect([...ZOOM_STEPS].sort((a, b) => a - b)).toEqual(ZOOM_STEPS);
    expect(stepZoomIndex(0, -1)).toBe(0);
    expect(stepZoomIndex(ZOOM_STEPS.length - 1, 1)).toBe(ZOOM_STEPS.length - 1);
    expect(stepZoomIndex(2, 1)).toBe(3);
    expect(zoomLabel(2)).toBe('150%');
    expect(MAX_CANVAS_PX).toBeGreaterThanOrEqual(2048);
  });
});

describe('the office’s pictures on the church door', () => {
  it('the inline picture fills its card: no height cap that draws it narrower than the card', () => {
    const img = rule('.lc-office-pic img');
    expect(img).toMatch(/width:100%/);
    expect(img).not.toMatch(/max-height|object-fit/);
    expect(CSS, 'the flyers’ own height cap is gone too').not.toMatch(/\.lc-office-strip \.lc-office-pic img\{/);
  });
  it('at Normal the full-size viewer opens at 100%, with Larger and Smaller on screen', () => {
    act(() => root.render(createElement(ChurchOfficeBoard, { digest: DIGEST })));
    click(q('[data-testid="church-office-calendar"] button'));
    const img = q('[data-testid="church-office-full-img"]');
    expect(img.style.width).toBe('100%');
    expect(q('[data-testid="picture-zoom-now"]').textContent).toBe('100%');
    expect(q('[data-testid="picture-zoom-smaller"]').disabled).toBe(true);
    click(q('[data-testid="picture-zoom-larger"]'));
    expect(img.style.width).toBe('120%');
    click(q('[data-testid="picture-zoom-larger"]'));
    expect(img.style.width).toBe('150%');
    click(q('[data-testid="picture-zoom-smaller"]'));
    expect(img.style.width).toBe('120%');
  });
  it('at Largest the viewer opens at 200%, at Big Print 44 at 275%, and Smaller still works', () => {
    act(() => {
      setTextSize('largest');
    });
    act(() => root.render(createElement(ChurchOfficeBoard, { digest: DIGEST })));
    click(q('[data-testid="church-office-letter"] button'));
    expect(q('[data-testid="church-office-full-img"]').style.width).toBe('200%');
    click(q('[data-testid="church-office-close"]'));
    act(() => {
      setTextSize('bigprint');
    });
    click(q('[data-testid="church-office-flyer"] button'));
    const img = q('[data-testid="church-office-full-img"]');
    expect(img.style.width).toBe('275%');
    click(q('[data-testid="picture-zoom-smaller"]'));
    expect(img.style.width).toBe('200%');
  });
  it('the viewer scrolls both ways under a bar that stays put, and Escape still closes it', () => {
    expect(rule('.lc-office-scroll')).toMatch(/overflow:auto/);
    expect(rule('.lc-office-scroll img')).toMatch(/max-width:none/);
    act(() => root.render(createElement(ChurchOfficeBoard, { digest: DIGEST })));
    click(q('[data-testid="church-office-calendar"] button'));
    const full = q('[data-testid="church-office-full"]');
    const scroll = q('[data-testid="church-office-scroll"]');
    expect(scroll.contains(q('[data-testid="church-office-full-img"]'))).toBe(true);
    expect(scroll.contains(q('[data-testid="picture-zoom"]')), 'the buttons are outside the scroll box').toBe(false);
    expect(scroll.getAttribute('tabindex'), 'the scroll box is reachable by keyboard').toBe('0');
    act(() => full.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(q('[data-testid="church-office-full"]')).toBeNull();
  });
});

describe('the shared pieces every viewer uses', () => {
  it('ZoomPane lays its content out at zoom x its width; the controls are 44px fixed-size chrome', () => {
    let z;
    function Host() {
      z = usePictureZoom();
      return createElement('div', null, createElement(ZoomControls, { z, what: 'pages' }), createElement(ZoomPane, { zoom: z.zoom, label: 'A page' }, createElement('p', null, 'page')));
    }
    act(() => {
      setTextSize('larger');
    });
    act(() => root.render(createElement(Host)));
    expect(q('.pz-sheet').style.width).toBe('150%');
    expect(q('[data-testid="picture-zoom"]').getAttribute('aria-label')).toBe('Size of the pages');
    expect(q('[data-testid="picture-zoom-larger"]').getAttribute('aria-label')).toBe('Larger pages');
    expect(rule('.pz-btn')).toMatch(/min-height:44px;min-width:44px/);
    expect(rule('.pz-btn'), 'chrome is fixed px: it never grows with the text it serves').not.toMatch(/rem/);
    expect(rule('.pz-pane')).toMatch(/overflow:auto/);
  });
  it('the document viewer zooms a picture and a PDF, and redraws a PDF page at its new width', () => {
    expect(VIEWER).toMatch(/<ZoomPane zoom=\{z\.zoom\}[^>]*>\s*<img/);
    expect(VIEWER).toMatch(/<ZoomPane zoom=\{z\.zoom\}[^>]*>\s*<PdfPages blob=\{state\.blob\} title=\{title\} zoom=\{z\.zoom\} \/>/);
    expect(VIEWER).toMatch(/\}, \[pdf, n, zoom\]\);/);
    expect(VIEWER).toMatch(/MAX_CANVAS_PX \/ base\.width/);
    expect(VIEWER).toMatch(/\{zoomable && <ZoomControls z=\{z\}/);
  });
});
