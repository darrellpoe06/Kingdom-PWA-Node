// =============================================================================
// Cloudflare Pages parity guard — the hosting move can never silently drop an
// endpoint again.
// =============================================================================
// 2026-07-05 incident class: production cut over from Vercel to Cloudflare
// Pages, and every same-origin endpoint that Vercel provided outside the static
// bundle (serverless functions in app/api/, rewrites in app/vercel.json) had to
// be INDIVIDUALLY re-provided on the new host (Pages Functions in
// app/functions/, rules in app/public/_redirects). Three were missed:
// /api/market-quote (Markets watchlist quotes), /api/voice-speak (the voice
// bridge), and /nas-photos/* (property photos + Life Gallery). Each failed
// only at runtime, on the live site, per-feature — the "not so obvious"
// breakage of a platform move.
//
// This guard makes the parity structural (DR-0076: every looked-fine-but-wasn't
// class becomes a machine check):
//   1. Every Vercel serverless function in app/api/ must have a same-named
//      Cloudflare Pages Function in app/functions/api/.
//   2. Every non-static vercel.json rewrite must have a CF-side provider —
//      a Pages Function directory for external-origin proxies (Pages
//      _redirects cannot proxy external domains), or a _redirects rule for
//      same-site path rewrites.
//   3. The client's same-origin bases (/n8n, /nas-photos, /api/*) each map to
//      a real provider file that exists in the repo.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repo = (rel) => fileURLToPath(new URL('../../' + rel, import.meta.url));

describe('Cloudflare Pages parity with the Vercel-era surface', () => {
  it('every Vercel function in app/api/ has a same-named Pages Function', () => {
    const vercelFns = readdirSync(repo('api')).filter((f) => f.endsWith('.js'));
    expect(vercelFns.length).toBeGreaterThan(0); // the guard itself must see them
    for (const f of vercelFns) {
      expect(existsSync(repo('functions/api/' + f)), `functions/api/${f} missing — /api/${f.replace(/\.js$/, '')} 404s on Cloudflare Pages`).toBe(true);
    }
  });

  it('the /n8n same-origin proxy exists as a Pages Function', () => {
    expect(existsSync(repo('functions/n8n/[[path]].js'))).toBe(true);
  });

  it('the /nas-photos same-origin proxy exists as a Pages Function', () => {
    // vercel.json rewrote /nas-photos/* to the Funnel (an external origin);
    // _redirects cannot proxy external domains, so CF needs a Function.
    expect(existsSync(repo('functions/nas-photos/[[path]].js'))).toBe(true);
  });

  it('every external-origin vercel.json rewrite has a Pages Function; same-site ones ride _redirects', () => {
    const vercelCfg = JSON.parse(readFileSync(repo('vercel.json'), 'utf8'));
    const redirects = readFileSync(repo('public/_redirects'), 'utf8');
    for (const rw of vercelCfg.rewrites || []) {
      const dest = String(rw.destination || '');
      if (/^https?:\/\//.test(dest)) {
        // External-origin proxy: needs a catch-all Pages Function named after
        // the first path segment of the source.
        const seg = String(rw.source).split('/').filter(Boolean)[0].replace(/[:(].*$/, '');
        expect(existsSync(repo(`functions/${seg}/[[path]].js`)), `no Pages Function for external rewrite ${rw.source} -> ${dest}`).toBe(true);
      } else {
        // Same-site rewrite: must appear in _redirects (by first segment).
        const seg = String(rw.source).split('/').filter(Boolean)[0].replace(/[:(].*$/, '');
        expect(redirects.includes(`/${seg}`), `no _redirects rule for same-site rewrite ${rw.source}`).toBe(true);
      }
    }
  });
});
