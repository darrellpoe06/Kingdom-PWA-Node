// =============================================================================
// EVERY PROPERTY PICTURE THAT LEAVES THE APP ADVERTISES (DR-0918)
// =============================================================================
// Darrell, 2026-10-10: "Make sure we have our logos and qrcodes inside each
// image of the properties so it's always an advertisement... especially since
// users can download it... all downloaded materials have our tags and logos".
//
// The band (logo, the door's name, the address, a QR to that unit's listing)
// is drawn into the pixels when a picture is shown full-size or saved; the
// stored original is never altered. A picture that cannot be stamped is never
// handed out bare: Save says it could not be prepared.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { stampLayout, stampLines, stampFileName, stampImage, qrDataUrl, BRAND } from '../lib/brand-stamp.js';
import Lightbox from '../components/Lightbox.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('the band, laid out and worded (pure)', () => {
  it('a band across the foot, sized to the width, never below readable; the QR fills it', () => {
    const L = stampLayout(1600, 1200);
    expect(L.width).toBe(1600);
    expect(L.band).toEqual({ x: 0, y: 1200, w: 1600, h: 256 });
    expect(L.height).toBe(1456);
    expect(L.qr.size).toBe(256 - 2 * Math.round(256 * 0.12));
    expect(L.qr.x + L.qr.size).toBeLessThanOrEqual(1600);
    expect(stampLayout(300, 400).band.h).toBe(96);
  });
  it('says whose it is and where to find it; names the file for the place', () => {
    expect(stampLines({ door: '805 N Prospect Ave Apt 2', link: 'https://poetech.us/properties/?apply=abc' }))
      .toEqual({ title: 'Poe Properties · 805 N Prospect Ave Apt 2', sub: 'Scan to see this place · poetech.us/properties/?apply=abc' });
    expect(stampLines({}).title).toBe('Poe Properties');
    expect(stampFileName('805 N Prospect Ave, Apt 2', 3)).toBe('poe-properties-805-n-prospect-ave-apt-2-3.jpg');
  });
  it('the QR is a real SVG that encodes the link', () => {
    const url = qrDataUrl('https://poetech.us/properties/?apply=abc');
    expect(url.startsWith('data:image/svg+xml')).toBe(true);
    expect(decodeURIComponent(url)).toContain('<svg');
  });
});

describe('the stamp is drawn into the picture', () => {
  const fakeCanvas = () => {
    const ops = [];
    const ctx = {
      drawImage: (img, x, y, w, h) => ops.push(['image', img.id, x, y, w, h]),
      fillRect: (x, y, w, h) => ops.push(['rect', x, y, w, h]),
      fillText: (t) => ops.push(['text', t]),
      set fillStyle(v) { ops.push(['fill', v]); }, set font(v) { ops.push(['font', v]); }, set textBaseline(v) {},
    };
    return { ops, width: 0, height: 0, getContext: () => ctx, toDataURL: (type) => `data:${type};base64,STAMPED` };
  };
  it('photo, band, logo, QR and both lines, in the pixels', async () => {
    let canvas;
    const out = await stampImage({ src: 'photo.jpg', door: 'Apt 2', link: 'https://poetech.us/properties/?apply=abc' }, {
      makeCanvas: () => { canvas = fakeCanvas(); return canvas; },
      load: async (src) => ({ id: src.startsWith('data:image/svg') ? 'qr' : src === BRAND.logo ? 'logo' : 'photo', naturalWidth: 1000, naturalHeight: 750 }),
      qr: (link) => `data:image/svg+xml,${link}`,
    });
    expect(out).toBe('data:image/jpeg;base64,STAMPED');
    expect([canvas.width, canvas.height]).toEqual([1000, 910]);
    const drawn = canvas.ops.filter((o) => o[0] === 'image').map((o) => o[1]);
    expect(drawn).toEqual(['photo', 'logo', 'qr']);
    expect(canvas.ops.filter((o) => o[0] === 'text').map((o) => o[1])).toEqual(['Poe Properties · Apt 2', 'Scan to see this place · poetech.us/properties/?apply=abc']);
  });
  it('a picture that will not load is not stamped (null), never thrown', async () => {
    expect(await stampImage({ src: 'gone.jpg' }, { makeCanvas: fakeCanvas, load: async () => { throw new Error('x'); }, qr: () => 'q' })).toBeNull();
  });
});

describe('the viewer shows and saves only the stamped copy', () => {
  let container; let root;
  afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; });
  async function mount(el) {
    container = document.createElement('div'); document.body.appendChild(container);
    await act(async () => { root = createRoot(container); root.render(el); });
    for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
  }
  const items = [{ src: 'data:image/jpeg;base64,ORIGINAL', alt: 'Kitchen', fileName: 'poe-properties-apt-2-1.jpg' }];

  it('PROVEN-TO-CATCH: with a stamp, the picture on screen and the Save link are the stamped copy, never the original', async () => {
    await mount(createElement(Lightbox, { items, index: 0, onClose: () => {}, stamp: async () => 'data:image/jpeg;base64,STAMPED' }));
    expect(container.querySelector('img').getAttribute('src')).toBe('data:image/jpeg;base64,STAMPED');
    const save = container.querySelector('[data-testid="lightbox-save"]');
    expect(save.getAttribute('href')).toBe('data:image/jpeg;base64,STAMPED');
    expect(save.getAttribute('download')).toBe('poe-properties-apt-2-1.jpg');
    expect(container.innerHTML).not.toContain('ORIGINAL');
  });

  it('PROVEN-TO-CATCH: when the stamp cannot be made, the picture is still seen, and nothing unbranded is offered for saving', async () => {
    await mount(createElement(Lightbox, { items, index: 0, onClose: () => {}, stamp: async () => null }));
    expect(container.querySelector('img').getAttribute('src')).toBe('data:image/jpeg;base64,ORIGINAL');
    expect(container.querySelector('[data-testid="lightbox-save"]')).toBeNull();
    expect(container.textContent).toContain('could not be prepared for saving');
  });

  it('without a stamp (a family photo elsewhere in the app), the viewer is unchanged', async () => {
    await mount(createElement(Lightbox, { items, index: 0, onClose: () => {} }));
    expect(container.querySelector('img').getAttribute('src')).toBe('data:image/jpeg;base64,ORIGINAL');
    expect(container.querySelector('[data-testid="lightbox-save"]').getAttribute('href')).toBe('data:image/jpeg;base64,ORIGINAL');
  });
});
