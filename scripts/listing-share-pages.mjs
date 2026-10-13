#!/usr/bin/env node
// =============================================================================
// listing-share-pages — one static preview page per listed unit (DR-1006)
// =============================================================================
// Darrell: share a listing to social media; the link opens the app with that
// unit's pictures open, and the post shows the picture and the name.
//
// A social crawler never runs the app: it reads the HTML at the shared URL.
// So, at deploy time, this writes <dist>/properties/l/<id>/index.html for every
// unit the public shelf lists — the unit's own first listing picture
// (photo.jpg beside it, decoded from the row) and its name in the Open Graph
// tags — and that page refreshes into the door with ?listing=<id>, where the
// card opens its pictures. Exactly the road /moore and /lovecorner take; no
// Pages Function is needed (they were dark, #2057, when this was written).
//
// What it reads is what the shelf reads: public_vacancies() and
// public_vacancy_photos(), as anon, through PostgREST — nothing a visitor could
// not already see. A listing with no public picture gets the Poe Properties
// icon and says so in the log; a read that FAILS is logged as a failure and
// writes nothing for that unit (never a page that pretends), and the deploy
// goes on: a stale preview is a smaller harm than a site that did not deploy
// (DR-0107). The last line says how many pages were written, out of how many.
//
// Usage: node scripts/listing-share-pages.mjs <dist>   (env: VITE_SUPABASE_URL,
// VITE_SUPABASE_ANON_KEY). Pure parts are exported for the unit test.
// =============================================================================
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cadenceChoice } from '../app/src/modules/properties/cadence.js';

export const ORIGIN = 'https://poetech.us';
export const FALLBACK_IMAGE = `${ORIGIN}/properties-icon-512.png`;

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (n) => `$${Math.round(Number(n)).toLocaleString('en-US')}`;

/** The unit's name as the card prints it: the label, then the unit when the label does not already say it. */
export function listingName(v = {}) {
  const label = String(v.label || '').trim();
  const unit = String(v.unit || '').trim();
  return unit && !label.toLowerCase().includes(unit.toLowerCase()) ? `${label} · ${unit}` : label || 'A place to live';
}

/** One line a post can carry: where, the price, the true month beside any other cadence, a shared home said plainly. */
export function describeListing(v = {}) {
  const where = [v.city, v.state].map((x) => String(x || '').trim()).filter(Boolean).join(', ');
  const parts = [];
  if (where) parts.push(where);
  if (Number(v.rent) > 0) parts.push(`${money(v.rent)}/mo`);
  const shortStay = v.offering === 'short-term' || v.offering === 'both';
  // A short-stays-only season says so (DR-1009); the shelf already reads no
  // lease price for it, so nothing is contradicted below.
  if (v.offering === 'short-term') parts.push('Short stays only');
  // The co-living cadences compared; the night said by itself (DR-1008).
  const c = cadenceChoice({ monthly: v.rent, weekly: v.weekly_rate, biweekly: v.biweekly_rate });
  if (c.line) parts.push(c.line);
  if (shortStay && Number(v.nightly_rate) > 0) parts.push(`Short stay ${money(v.nightly_rate)}/night`);
  if (v.shared_home) parts.push(v.rentable_level === 'room' ? 'A private room in a shared home' : 'A bed in a shared bedroom, two to a room, in a shared home');
  if (v.building_note) parts.push(`The building: ${String(v.building_note).trim()}`);
  return parts.join(' · ');
}

/** A data URL's bytes and file extension; null for anything else. */
export function decodeDataUrl(dataUrl) {
  const m = /^data:(image\/(jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/i.exec(String(dataUrl || ''));
  if (!m) return null;
  const ext = m[2].toLowerCase() === 'jpeg' ? 'jpg' : m[2].toLowerCase();
  const bytes = Buffer.from(m[3].replace(/\s+/g, ''), 'base64');
  return bytes.length > 0 ? { bytes, ext, type: m[1].toLowerCase() } : null;
}

/** The page itself: tags a crawler reads, a refresh a person follows. No inline JS (CSP script-src 'self'). */
export function renderListingPage(v, { image = FALLBACK_IMAGE, imageAlt = '' } = {}) {
  const id = String(v.id).toLowerCase();
  const name = listingName(v);
  const description = describeListing(v) || 'Poe Properties — a place to live, listed by the family.';
  const pageUrl = `${ORIGIN}/properties/l/${id}/`;
  const appUrl = `/properties/app/?properties=1&listing=${id}`;
  return `<!doctype html>
<!-- One listing's shareable link (DR-1006). Written at deploy time by
     scripts/listing-share-pages.mjs from the public shelf; a crawler reads the
     tags, a person is refreshed into the door with this unit's pictures open.
     No inline JS (CSP: script-src 'self'). -->
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(name)} — Poe Properties</title>
  <meta name="description" content="${esc(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Poe Properties" />
  <meta property="og:title" content="${esc(name)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${esc(pageUrl)}" />
  <meta property="og:image" content="${esc(image)}" />
  ${imageAlt ? `<meta property="og:image:alt" content="${esc(imageAlt)}" />` : ''}
  <meta name="twitter:card" content="${image === FALLBACK_IMAGE ? 'summary' : 'summary_large_image'}" />
  <meta name="twitter:title" content="${esc(name)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(image)}" />
  <meta name="theme-color" content="#2F5D50" />
  <link rel="icon" href="/properties-icon-192.png" />
  <meta http-equiv="refresh" content="0; url=${esc(appUrl)}" />
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #FAF8F4; color: #1A1815; font-family: Georgia, 'Times New Roman', serif; }
    .card { padding: 2rem; max-width: 36rem; }
    h1 { margin: 0 0 .25rem; font-size: 1.75rem; }
    p { margin: .25rem 0; color: #5A5751; font-size: .95rem; }
    a { color: #2F5D50; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${esc(name)}</h1>
    <p>${esc(description)}</p>
    <p>Opening the listing… <a href="${esc(appUrl)}">tap here if it doesn't open</a>.</p>
  </div>
</body>
</html>
`;
}

async function rpc(base, key, name, args, fetchImpl) {
  const resp = await fetchImpl(`${base.replace(/\/$/, '')}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', apikey: key, authorization: `Bearer ${key}` },
    body: JSON.stringify(args || {}),
  });
  if (!resp.ok) throw new Error(`${name} answered HTTP ${resp.status}`);
  const data = await resp.json();
  if (!Array.isArray(data)) throw new Error(`${name} answered something that is not a list`);
  return data;
}

/**
 * Write the pages. Returns { listed, written, withPicture, failed: [..] }.
 * `fetchImpl` is injectable for the test; the real run uses global fetch.
 */
export async function writeListingPages({ dist, base, key, fetchImpl = globalThis.fetch, log = console.log }) {
  const out = { listed: 0, written: 0, withPicture: 0, failed: [] };
  const root = join(dist, 'properties', 'l');
  let units;
  try {
    units = await rpc(base, key, 'public_vacancies', {}, fetchImpl);
  } catch (e) {
    out.failed.push(`public_vacancies: ${e.message}`);
    return out;
  }
  out.listed = units.length;
  // Start clean: a unit no longer listed loses its page at this deploy.
  try { rmSync(root, { recursive: true, force: true }); } catch { /* nothing to clear */ }
  for (const v of units) {
    const id = String(v.id || '').toLowerCase();
    if (!/^[0-9a-f-]{36}$/.test(id)) { out.failed.push(`a row without a well-formed id was skipped`); continue; }
    const dir = join(root, id);
    let image = FALLBACK_IMAGE;
    let imageAlt = '';
    try {
      const photos = await rpc(base, key, 'public_vacancy_photos', { p_rental: id }, fetchImpl);
      const first = photos.find((p) => p && typeof p.storage_path === 'string') || null;
      const decoded = first ? decodeDataUrl(first.storage_path) : null;
      if (decoded) {
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, `photo.${decoded.ext}`), decoded.bytes);
        image = `${ORIGIN}/properties/l/${id}/photo.${decoded.ext}`;
        imageAlt = String(first.caption || listingName(v));
        out.withPicture += 1;
      } else {
        log(`listing-share-pages: ${listingName(v)} has no public picture yet; the Poe Properties icon stands in`);
      }
    } catch (e) {
      // A read that failed is said as a failure, never as "no pictures".
      log(`listing-share-pages: the pictures of ${listingName(v)} could not be read (${e.message}); the icon stands in for this deploy`);
      out.failed.push(`${id}: public_vacancy_photos: ${e.message}`);
    }
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), renderListingPage(v, { image, imageAlt }));
    out.written += 1;
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const dist = process.argv[2] || 'dist';
  const base = process.env.VITE_SUPABASE_URL || '';
  const key = process.env.VITE_SUPABASE_ANON_KEY || '';
  if (!base || !key) {
    console.log('::warning::listing-share-pages: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set; no listing pages written');
    process.exit(0);
  }
  if (typeof globalThis.fetch !== 'function') { console.log('::warning::listing-share-pages: no fetch in this node; no listing pages written'); process.exit(0); }
  writeListingPages({ dist, base, key }).then((r) => {
    for (const f of r.failed) console.log(`::warning::listing-share-pages: ${f}`);
    console.log(`listing-share-pages: ${r.written} of ${r.listed} listed unit(s) got a preview page, ${r.withPicture} with their own picture, at ${dist}/properties/l/<id>/`);
    process.exit(0);
  }).catch((e) => { console.log(`::warning::listing-share-pages: ${e.message}; no listing pages written`); process.exit(0); });
}
