// =============================================================================
// brand-stamp — every property picture that leaves the app advertises (DR-0918)
// =============================================================================
// Darrell, 2026-10-10: "Make sure we have our logos and qrcodes inside each
// image of the properties so it's always an advertisement... especially since
// users can download it... all downloaded materials have our tags and logos".
//
// A picture is stamped at the moment it is SHOWN FULL-SIZE or SAVED, never at
// upload: the original stays the family's clean record (a damage photo, an
// inspection, a listing reshoot), and the copy that travels carries a band
// across its foot with the Poe Properties mark, the door's name, the address
// to find it, and a QR code that opens that unit's own listing. Because the
// band is drawn INTO the pixels (canvas), a long-press save, a screenshot of
// the viewer, or a forwarded file all carry it.
//
// Pure where it can be (the layout and the text are plain functions, tested
// without a canvas); the drawing takes its canvas, image loader and QR maker
// as arguments so it runs in the browser and is proven in jsdom with fakes.
// =============================================================================
import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { QRCodeSVG } from 'qrcode.react';

export const BRAND = Object.freeze({
  name: 'Poe Properties',
  tag: 'poetech.us/properties',
  logo: '/properties-icon-192.png',
  ink: '#FAF8F4',
  band: 'rgba(26, 24, 21, 0.86)',
  accent: '#2F5D50',
});

/**
 * Where everything sits on a picture of width w and height h. The band is a
 * fixed share of the WIDTH (so a tall phone shot and a wide room shot carry
 * the same-sized mark), never less than a readable floor, and the QR is the
 * band's height minus its padding so a phone can scan it off a screen.
 */
export function stampLayout(w, h) {
  const W = Math.max(1, Math.round(Number(w) || 0));
  const H = Math.max(1, Math.round(Number(h) || 0));
  const band = Math.max(96, Math.round(W * 0.16));
  const pad = Math.round(band * 0.12);
  const qr = band - pad * 2;
  const logo = Math.round(band * 0.5);
  return {
    width: W,
    height: H + band,
    image: { x: 0, y: 0, w: W, h: H },
    band: { x: 0, y: H, w: W, h: band },
    logo: { x: pad, y: H + Math.round((band - logo) / 2), size: logo },
    qr: { x: W - pad - qr, y: H + pad, size: qr },
    text: { x: pad * 2 + logo, y: H + Math.round(band * 0.42), size: Math.max(14, Math.round(band * 0.2)), small: Math.max(11, Math.round(band * 0.14)) },
  };
}

/** The two lines the band says: who, and where to find the place. */
export function stampLines({ door = '', link = '' } = {}) {
  const where = String(door || '').trim();
  return {
    title: where ? `${BRAND.name} · ${where}` : BRAND.name,
    sub: `Scan to see this place · ${String(link || '').replace(/^https?:\/\//, '') || BRAND.tag}`,
  };
}

/** A file name that says what it is and whose it is. */
export function stampFileName(door = '', n = 1) {
  const slug = String(door || 'property').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'property';
  return `poe-properties-${slug}-${n}.jpg`;
}

/**
 * The QR code for a link, as an SVG data URL an <img> or canvas can draw.
 * Rendered with the React and qrcode.react already in the app (a detached
 * root, flushed synchronously), so no server renderer ships to the phone.
 */
export function qrDataUrl(link, size = 256) {
  const host = document.createElement('div');
  const root = createRoot(host);
  flushSync(() => {
    root.render(createElement(QRCodeSVG, { value: String(link || BRAND.tag), size, level: 'M', marginSize: 2, bgColor: '#FFFFFF', fgColor: '#1A1815' }));
  });
  const svg = host.innerHTML;
  root.unmount();
  if (!/^<svg/.test(svg)) throw new Error('qr-did-not-render');
  const withNs = svg.includes('xmlns=') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(withNs)}`;
}

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error('image-did-not-load'));
  img.src = src;
});

/**
 * Draw the stamped picture and return it as a JPEG data URL. `deps` exists so
 * the drawing is proven without a browser: { makeCanvas, load, qr }.
 * Any failure resolves to null — the caller then shows or saves nothing
 * unbranded in its place (it says the picture could not be prepared).
 */
export async function stampImage({ src, door = '', link = '' } = {}, deps = {}) {
  const makeCanvas = deps.makeCanvas || (() => document.createElement('canvas'));
  const load = deps.load || loadImage;
  const qr = deps.qr || qrDataUrl;
  try {
    if (!src) return null;
    const [photo, logo, code] = await Promise.all([
      load(src),
      load(BRAND.logo).catch(() => null),
      load(qr(link)).catch(() => null),
    ]);
    const L = stampLayout(photo.naturalWidth || photo.width, photo.naturalHeight || photo.height);
    const canvas = makeCanvas();
    canvas.width = L.width;
    canvas.height = L.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(photo, L.image.x, L.image.y, L.image.w, L.image.h);
    ctx.fillStyle = BRAND.band;
    ctx.fillRect(L.band.x, L.band.y, L.band.w, L.band.h);
    ctx.fillStyle = BRAND.accent;
    ctx.fillRect(L.band.x, L.band.y, L.band.w, Math.max(2, Math.round(L.band.h * 0.03)));
    if (logo) ctx.drawImage(logo, L.logo.x, L.logo.y, L.logo.size, L.logo.size);
    if (code) ctx.drawImage(code, L.qr.x, L.qr.y, L.qr.size, L.qr.size);
    const lines = stampLines({ door, link });
    ctx.fillStyle = BRAND.ink;
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${L.text.size}px Georgia, serif`;
    ctx.fillText(lines.title, L.text.x, L.text.y, L.qr.x - L.text.x - L.logo.x);
    ctx.font = `${L.text.small}px Georgia, serif`;
    ctx.fillText(lines.sub, L.text.x, L.text.y + Math.round(L.text.size * 1.25), L.qr.x - L.text.x - L.logo.x);
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch {
    return null;
  }
}
