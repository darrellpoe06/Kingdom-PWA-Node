// =============================================================================
// Client-path parity guard — every same-origin path the CLIENT calls has a
// provider on the production host (Pages Function, _redirects rule, or a
// public/ static asset). The successor to cf-pages-parity's vercel.json scan.
// =============================================================================
// 2026-07-30 comprehensive-review incident class: nine features were cut over
// in code to sovereign same-origin paths (/llm/chat, /reviews/llm-review.json,
// base-relative taxes/archive.json, /scribe/*, /ways/brain.json,
// /property-history, /automation-status, /wake-orchestrator*) and NO transport
// was ever built on poetech.us — each fell through _redirects to the SPA and
// silently served its authored fallback. The old parity guard read vercel.json
// (a config the repo declares measured-dead) and hardcoded /n8n, /nas-photos,
// /api — so every path added since was unguarded by construction. This guard
// scans the CLIENT SOURCE instead: the set of paths the app actually calls is
// the spec.
//
// PROVEN-TO-CATCH (DR-0076 §3): written before the Funnel-proxy routes
// existed; its first red run listed the nine known paths AND found two more
// nobody had named (/review-feed, /review-action in ReviewFeed.jsx). The
// routes in app/functions/ turned it green. The non-vacuous pins below keep
// the scanner honest: a green run can never mean "scanned nothing."
// =============================================================================
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = (rel) => fileURLToPath(new URL('../../' + rel, import.meta.url));

// ---- extract same-origin path calls from client source ----------------------
// Two shapes:
//  (a) absolute-path string literals: '…' / "…" / `…` beginning with a slash.
//      Multi-segment paths (or a dotted filename) are kept unconditionally;
//      SINGLE-segment paths are kept only when the surrounding line reads as
//      transport (fetch/url/endpoint/href/URL) — this drops UI fragments like
//      '/yr', '/mo', regex-flag strings, and prose slugs without dropping
//      real single-segment endpoints declared as consts (URL in the name).
//  (b) base-relative template calls: `${baseHref()}seg/…` — the shape
//      lib/tax-archive.js uses; recorded as '/poetech-app/seg/…' because the
//      app's base scope is /poetech-app/ (manifest-pinned).
const TRANSPORT_CONTEXT = /fetch|url|endpoint|href|xhr|axios|request|upload/i;

export function extractClientPaths(source) {
  const out = new Set();
  const lines = source.split('\n');
  const litRe = /['"`](\/[a-z0-9][a-z0-9.-]*(?:\/[^'"`$\s?#]*)?)(?=['"`?#])/g;
  for (const line of lines) {
    let m;
    while ((m = litRe.exec(line))) {
      const p = m[1].replace(/\/+$/, '');
      const multi = p.split('/').filter(Boolean).length > 1 || /\.[a-z0-9]+$/.test(p);
      if (multi || TRANSPORT_CONTEXT.test(line)) out.add(p);
    }
    let b;
    const baseRe = /\$\{baseHref\(\)\}([a-z0-9][a-z0-9.-]*(?:\/[^'"`$\s?#]*)?)/g;
    while ((b = baseRe.exec(line))) out.add('/poetech-app/' + b[1].replace(/\/+$/, ''));
  }
  return out;
}

// Paths that are NOT same-origin client calls, each with the reason it is
// excluded — additions need the same. Matched on FIRST segment.
const ALLOWLIST = new Set([
  '/webhook',   // retired n8n webhook paths quoted in registry/doc prose (DR-0218 historical)
  '/data',      // NAS bind-mount paths quoted in ops prose, never fetched by the client
  '/volume1',   // NAS filesystem paths in runbook prose
  '/usr',       // NAS filesystem paths in runbook prose
  '/etc',       // NAS filesystem paths in runbook prose
  '/embed',     // YouTube embed URL suffix appended to an external origin (church-live)
  '/600x600bb', // Apple artwork URL suffix appended to an external origin (tv-catalog)
  '/watch',     // YouTube watch URL suffix on an external origin
  '/results',   // YouTube results URL suffix on an external origin
  '/channel',   // YouTube channel URL suffix on an external origin
  '/maps',      // Google Maps URL suffix on an external origin
]);

function firstSegment(p) {
  return '/' + (p.split('/').filter(Boolean)[0] || '');
}

function collectProviders() {
  const providers = new Set();
  // Pages Functions: a directory (catch-all) or a top-level file per segment.
  for (const entry of readdirSync(repo('functions'))) {
    if (entry.startsWith('_')) continue; // _lib and friends are not routes
    providers.add('/' + entry.replace(/\.js$/, ''));
  }
  // _redirects rules provide their first segment.
  for (const line of readFileSync(repo('public/_redirects'), 'utf8').split('\n')) {
    const src = line.trim().split(/\s+/)[0];
    if (src && src.startsWith('/')) providers.add(firstSegment(src));
  }
  // public/ static assets serve their own paths.
  for (const entry of readdirSync(repo('public'))) providers.add('/' + entry);
  return providers;
}

// /poetech-app/* is the SPA scope: the app shell answers ANYTHING under it,
// which is exactly the silent-fallback trap — so a base-relative DATA call
// needs its own second-level provider (a Function dir/file under
// functions/poetech-app/), with 'assets' served by the build itself.
function hasScopedProvider(p) {
  const seg2 = p.split('/').filter(Boolean)[1] || '';
  if (!seg2 || seg2 === 'assets') return true;
  return existsSync(repo('functions/poetech-app/' + seg2)) || existsSync(repo('functions/poetech-app/' + seg2 + '.js'));
}

function scanSrc() {
  const roots = [repo('src/lib'), repo('src/components'), repo('src/modules')];
  const paths = new Map(); // path -> first file seen in
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!/\.(js|jsx)$/.test(entry) || /\.test\./.test(entry)) continue;
      const src = readFileSync(full, 'utf8');
      for (const p of extractClientPaths(src)) if (!paths.has(p)) paths.set(p, full);
    }
  };
  for (const r of roots) if (existsSync(r)) walk(r);
  // The monolith is outside lib/components; scan it explicitly.
  const monolith = repo('src/poe-financial-mvp-v28.jsx');
  for (const p of extractClientPaths(readFileSync(monolith, 'utf8'))) if (!paths.has(p)) paths.set(p, monolith);
  return paths;
}

describe('client-path parity — every same-origin path the app calls has a provider', () => {
  it('extractor works on the literal shapes the codebase uses (non-vacuous)', () => {
    const sample = [
      "  return '/llm/chat';",
      '  const url = "/llm/health";',
      "  export const WAYS_BRAIN_URL = '/ways/brain.json';",
      "  await fetch('/scribe/session', { method: 'POST' });",
      "  export const REVIEW_FEED_URL = '/review-feed';",
      '  const res = await fetcher(`${baseHref()}taxes/archive.json`, { cache: "no-store" });',
      "  const label = '$40' + '/yr';", // UI fragment on a non-transport line -> dropped
    ].join('\n');
    const got = extractClientPaths(sample);
    for (const p of ['/llm/chat', '/llm/health', '/ways/brain.json', '/scribe/session', '/review-feed', '/poetech-app/taxes/archive.json']) {
      expect([...got].includes(p), p).toBe(true);
    }
    expect([...got].includes('/yr'), 'UI fragment /yr must not be extracted').toBe(false);
  });

  it('the scanner still SEES the 2026-07-30 incident paths (a green run cannot mean "scanned nothing")', () => {
    const scanned = [...scanSrc().keys()];
    for (const p of ['/llm/chat', '/reviews/llm-review.json', '/poetech-app/taxes/archive.json', '/scribe/session', '/ways/brain.json', '/property-history', '/automation-status', '/wake-orchestrator', '/review-feed']) {
      expect(scanned.some((k) => k === p || k.startsWith(p + '/')), `scanner no longer sees ${p} — if the feature was removed, update this pin; if the extractor broke, fix it`).toBe(true);
    }
  });

  it('every scanned client path has a provider (Function, _redirects, or public asset)', () => {
    const providers = collectProviders();
    const missing = [];
    for (const [p, file] of scanSrc()) {
      const seg = firstSegment(p);
      if (ALLOWLIST.has(seg)) continue;
      const ok = seg === '/poetech-app' ? hasScopedProvider(p) : providers.has(seg);
      if (!ok) missing.push(`${p}  (first seen in ${file.split('/src/')[1] || file})`);
    }
    expect(missing, `client paths with NO provider on the production host — each silently falls to the SPA and serves its fallback:\n  ${missing.join('\n  ')}`).toEqual([]);
  });
});
