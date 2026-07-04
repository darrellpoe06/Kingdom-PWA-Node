// =============================================================================
// bible-xref — the whole-Bible cross-references ("the unions"), in-app.
// =============================================================================
// Darrell 2026-07-04: "I love how the unions connect the old and new testament
// so I can see the patterns across all timelines." This resolves any verse to
// its community-vote-ranked cross-references (openbible.info / public-domain
// Treasury of Scripture Knowledge — 341,902 links), served from per-book static
// assets (app/public/bible/xref/<File>.json) that lazy-load only when opened.
// Same sovereign play as the full KJV: out of the JS bundle, offline once cached.
//
// PURE-ish + fail-soft: parsing rides bible-kjv's parseRef/bookMeta; the only I/O
// is a same-origin fetch that returns [] on any error and never throws.
import { parseRef, bookMeta } from './bible-kjv.js';

export const XREF_SOURCE = Object.freeze({
  name: 'openbible.info cross-references (Treasury of Scripture Knowledge)',
  license: 'Public Domain / CC-BY',
  url: 'https://www.openbible.info/labs/cross-references/',
});

const BASE = (() => {
  try { return (import.meta && import.meta.env && import.meta.env.BASE_URL) || '/'; }
  catch { return '/'; }
})();

let fetcher = (typeof fetch !== 'undefined') ? fetch.bind(globalThis) : null;
export function __setXrefFetcher(fn) { fetcher = fn || ((typeof fetch !== 'undefined') ? fetch.bind(globalThis) : null); }

const cache = new Map(); // file -> { book, refs: { "ch:v": [[toRef, votes], ...] } }

async function loadBookXrefs(file) {
  if (cache.has(file)) return cache.get(file);
  if (!fetcher) return null;
  try {
    const res = await fetcher(`${BASE}bible/xref/${file}.json`);
    if (!res || !res.ok) return null;
    const data = await res.json();
    if (!data || typeof data.refs !== 'object') return null;
    cache.set(file, data);
    return data;
  } catch {
    return null;
  }
}

// The cross-references for a verse, vote-ranked: [{ ref, votes }]. Empty on any
// miss (unparseable ref, book without an asset, or a verse with no links).
export async function crossRefsFor(ref) {
  const p = parseRef(ref);
  if (!p) return [];
  const data = await loadBookXrefs(p.file);
  const list = data && data.refs[`${p.chapter}:${p.v1}`];
  if (!Array.isArray(list)) return [];
  return list.map(([r, votes]) => ({ ref: r, votes }));
}

// Does the app carry a cross-reference asset for this reference's book? (Sync;
// used to decide whether to offer the "unions" affordance at all.)
export function bookHasXrefs(ref) {
  const p = parseRef(ref);
  return !!(p && bookMeta(p.file));
}
