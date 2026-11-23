#!/usr/bin/env node
// =============================================================================
// church-site-archive-collect — the daily reader's first half (DR-1596)
// =============================================================================
// Reads the church's public website from a GitHub runner (the sandbox has no
// route to it), names every calendar, Letter from BG and flyer on its pages
// with the SAME parser the app runs (app/src/lib/church-site.js +
// church-archive.js; one parser, no drift), downloads each picture, checks it
// IS a picture from its own bytes, hashes it, and writes
//   <out>/manifest.json   { slug, mode, generatedAt, pages, items, skipped }
//   <out>/files/<sha256>.<ext>
// The second half (church_archive_keep.py, on the NAS) keeps what is new.
//
// --mode site     the four pages as they are now (the daily run)
// --mode wayback  the same pages as the Internet Archive captured them in the
//                 past, so months the site already replaced can be recovered
//                 where a snapshot exists (a one-off backfill, dispatched)
//
// BUDGET: every request carries a timeout; a picture over MAX_ASSET_BYTES is
// skipped and named; at most --max-items pictures and --max-snapshots
// snapshots per page. Never invents a month: what the page or file does not
// state is filed under the day it was first seen, and says so.
// =============================================================================
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SITE_HOST, PAGES, MAX_ASSET_BYTES, contentRegion, uploadPictures } from '../app/functions/api/church-site.js';
import { parseChurchPage } from '../app/src/lib/church-site.js';
import { ARCHIVE_PAGES, archiveCandidates, dedupeByContent, sniffType } from '../app/src/lib/church-archive.js';

export const TIMEOUT_MS = 20000;
export const DEFAULTS = Object.freeze({ site: { maxItems: 60, maxSnapshots: 0 }, wayback: { maxItems: 400, maxSnapshots: 40 } });
const UA = 'PoeTech-LoveCorner-Archive/1.0 (+https://poetech.us)';
const EXT = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' };

/** A 14-digit Wayback timestamp as an ISO time, or '' when it is not one. */
export function waybackIso(ts) {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(String(ts || ''));
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z` : '';
}

/** The snapshots a CDX JSON answer lists: [{ timestamp, original }], oldest first. */
export function parseCdx(json) {
  if (!Array.isArray(json) || json.length < 2 || !Array.isArray(json[0])) return [];
  const [head, ...rows] = json;
  const ti = head.indexOf('timestamp');
  const oi = head.indexOf('original');
  if (ti < 0 || oi < 0) return [];
  return rows
    .map((r) => ({ timestamp: String(r[ti] || ''), original: String(r[oi] || '') }))
    .filter((r) => waybackIso(r.timestamp) && /^https?:\/\//.test(r.original))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

async function get(fetchImpl, url, accept, timeoutMs) {
  return fetchImpl(url, { headers: { 'User-Agent': UA, accept }, signal: AbortSignal.timeout(timeoutMs), redirect: 'follow' });
}

/** One page's HTML through the relay's own slicing, as the parser expects it; null when it did not read. */
export async function readPage(fetchImpl, page, url, { timeoutMs = TIMEOUT_MS, fetchedAt = new Date().toISOString() } = {}) {
  try {
    const res = await get(fetchImpl, url, 'text/html', timeoutMs);
    if (!res || !res.ok) return null;
    const html = await res.text();
    return parseChurchPage({ page, url, fetchedAt, html: contentRegion(html), images: uploadPictures(html) });
  } catch {
    return null;
  }
}

/** A picture's bytes and type, or { reason } when it is missing, too big or not a picture. */
export async function readPicture(fetchImpl, url, { timeoutMs = TIMEOUT_MS, maxBytes = MAX_ASSET_BYTES } = {}) {
  try {
    const res = await get(fetchImpl, url, 'image/*', timeoutMs);
    if (!res || !res.ok) return { reason: `http-${res ? res.status : 'none'}` };
    const len = Number((res.headers && res.headers.get && res.headers.get('content-length')) || 0);
    if (len > maxBytes) return { reason: 'too-big' };
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length > maxBytes) return { reason: 'too-big' };
    const type = sniffType(bytes);
    if (!type) return { reason: 'not-a-picture' };
    return { bytes, type };
  } catch {
    return { reason: 'unreachable' };
  }
}

/**
 * Reads the site (or its past snapshots) and returns
 * { pages, items: [{ ...archive item, file }], files: Map(file -> bytes), skipped }.
 * Items are one per content (dedupeByContent). Never throws.
 */
export async function collect({
  fetchImpl = globalThis.fetch,
  mode = 'site',
  now = new Date().toISOString(),
  maxItems,
  maxSnapshots,
  timeoutMs = TIMEOUT_MS,
} = {}) {
  const lim = { ...DEFAULTS[mode === 'wayback' ? 'wayback' : 'site'] };
  if (Number.isFinite(maxItems)) lim.maxItems = maxItems;
  if (Number.isFinite(maxSnapshots)) lim.maxSnapshots = maxSnapshots;
  const pages = {};
  const items = [];
  const files = new Map();
  const skipped = [];
  const byPath = new Map(); // sourcePath -> picture result, so a path in many snapshots is fetched once
  let fetched = 0;

  const keep = async (cand, seenAt, foundVia, urls) => {
    let got = byPath.get(cand.sourcePath);
    if (!got) {
      if (fetched >= lim.maxItems) {
        skipped.push({ path: cand.sourcePath, reason: 'budget' });
        return;
      }
      fetched += 1;
      for (const u of urls) {
        got = await readPicture(fetchImpl, u, { timeoutMs });
        if (got.bytes) break;
      }
      byPath.set(cand.sourcePath, got);
    }
    if (!got.bytes) {
      skipped.push({ path: cand.sourcePath, reason: got.reason });
      return;
    }
    const sha256 = createHash('sha256').update(got.bytes).digest('hex');
    const file = `${sha256}.${EXT[got.type]}`;
    files.set(file, got.bytes);
    items.push({ ...cand, sha256, bytes: got.bytes.length, contentType: got.type, seenAt, foundVia, file });
  };

  if (mode === 'wayback') {
    for (const page of ARCHIVE_PAGES) {
      const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${SITE_HOST.replace(/^www\./, '')}${PAGES[page]}&output=json&fl=timestamp,original&filter=statuscode:200&collapse=digest&limit=${lim.maxSnapshots}`;
      let snaps = [];
      try {
        const res = await get(fetchImpl, cdxUrl, 'application/json', timeoutMs);
        snaps = res && res.ok ? parseCdx(await res.json()) : [];
      } catch {
        snaps = [];
      }
      pages[page] = `${snaps.length} snapshot(s)`;
      for (const s of snaps.slice(0, lim.maxSnapshots)) {
        const seenAt = waybackIso(s.timestamp);
        const parsed = await readPage(fetchImpl, page, `https://web.archive.org/web/${s.timestamp}id_/${s.original}`, { timeoutMs, fetchedAt: seenAt });
        if (!parsed) continue;
        for (const cand of archiveCandidates({ [page]: parsed }, { seenAt })) {
          await keep(cand, seenAt, 'wayback', [
            `https://${SITE_HOST}${cand.sourcePath}`,
            `https://web.archive.org/web/${s.timestamp}im_/https://${SITE_HOST}${cand.sourcePath}`,
          ]);
        }
      }
    }
  } else {
    const read = {};
    for (const page of ARCHIVE_PAGES) {
      read[page] = await readPage(fetchImpl, page, `https://${SITE_HOST}${PAGES[page]}`, { timeoutMs, fetchedAt: now });
      pages[page] = read[page] ? 'read' : 'failed';
    }
    for (const cand of archiveCandidates(read, { seenAt: now })) await keep(cand, now, 'site', [`https://${SITE_HOST}${cand.sourcePath}`]);
  }
  return { pages, items: dedupeByContent(items), files, skipped };
}

/** The manifest row the NAS keeper sends to church_site_archive_keep() for one item. */
export function manifestItem(it) {
  return {
    kind: it.kind,
    title: it.title,
    for_year: it.forYear,
    for_month: it.forMonth,
    month_from: it.monthFrom,
    sha256: it.sha256,
    bytes: it.bytes,
    content_type: it.contentType,
    source_path: it.sourcePath,
    source_page: it.sourcePage,
    found_via: it.foundVia,
    seen_at: it.seenAt,
    file: it.file,
  };
}

function arg(name, fallback = '') {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function main() {
  const out = arg('out');
  const mode = arg('mode', 'site') === 'wayback' ? 'wayback' : 'site';
  const slug = arg('slug', 'colg');
  if (!out) {
    console.error('usage: church-site-archive-collect.mjs --out DIR [--mode site|wayback] [--slug colg] [--max-items N] [--max-snapshots N]');
    process.exit(2);
  }
  const num = (n) => (arg(n) ? Number(arg(n)) : undefined);
  const r = await collect({ mode, maxItems: num('max-items'), maxSnapshots: num('max-snapshots') });
  mkdirSync(join(out, 'files'), { recursive: true });
  for (const [file, bytes] of r.files) writeFileSync(join(out, 'files', file), bytes);
  const manifest = { slug, mode, generatedAt: new Date().toISOString(), pages: r.pages, items: r.items.map(manifestItem), skipped: r.skipped };
  writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`pages: ${JSON.stringify(r.pages)}`);
  console.log(
    `pictures: ${r.items.length} (${r.items.map((i) => `${i.kind} ${i.forYear}-${String(i.forMonth).padStart(2, '0')} ${i.sourcePath}`).join('; ') || 'none'})`
  );
  if (r.skipped.length) console.log(`skipped: ${r.skipped.map((s) => `${s.path} (${s.reason})`).join('; ')}`);
  // The site itself unreadable is a red run, never a quiet empty one (DR-0076).
  if (mode === 'site' && Object.values(r.pages).every((v) => v === 'failed')) {
    console.error('::error::no page of the church website could be read; nothing was kept today');
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
