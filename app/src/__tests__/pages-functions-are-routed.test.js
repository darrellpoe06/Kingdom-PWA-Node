// @vitest-environment node
// =============================================================================
// EVERY PAGES FUNCTION IS ROUTED — the gate for the 2026-10-09 lockout
// =============================================================================
// WHAT HAPPENED. Darrell and his wife could not sign in to their own app. The
// error on both screens was "Failed to execute 'json' on 'Response': Unexpected
// end of JSON input", on the email-link screen and on the phone-PIN screen,
// because both are POSTs. Measured from a GitHub runner:
//
//   NAS gateway POST  127.0.0.1:8800/sb/auth/v1/token -> 400, 81 bytes  (healthy)
//   Funnel POST       poetech.tail…/sb/auth/v1/token  -> 400, 81 bytes  (healthy)
//   edge POST         poetech.us/sb/auth/v1/token     -> 405, 0 bytes   (DEAD)
//   edge GET          poetech.us/automation-status     -> 200 text/html (DEAD)
//
// HTTP 405 with an empty body is what Cloudflare Pages returns for a POST to a
// STATIC asset, and a Function route answering `text/html` is the SPA shell. So
// no Pages Function was being invoked at all — not /sb, not /n8n, not /cams,
// /taxes, /openers, /llm, /reviews, /voice, /nas-photos, /ways or /scribe. The
// whole sovereign transport was dark while every deploy logged "Compiled Worker
// successfully" and "Uploading Functions bundle", and a fresh redeploy of the
// same commit changed nothing. The fix is public/_routes.json: an EXPLICIT
// routing table, rather than trusting the table Pages derives on its own.
//
// WHY THIS TEST. _routes.json is now load-bearing for every NAS-backed feature,
// and it is strict JSON that cannot carry a comment explaining itself. A new
// Function added without a matching include would ship dark and silent — which
// is exactly the failure above, where the only symptom was a family locked out.
// So the file tree is the source of truth and this is the gate: add a Function,
// and it must be routed before it can merge.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, '..', '..');
const FUNCTIONS = join(APP, 'functions');
const ROUTES = join(APP, 'public', '_routes.json');

/** Every function entrypoint, repo-relative, excluding the _lib factory dir. */
function functionFiles(dir = FUNCTIONS, out = []) {
  for (const name of readdirSync(dir)) {
    // Underscore-prefixed directories are not routed by Pages (_lib).
    if (name.startsWith('_')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) functionFiles(full, out);
    else if (name.endsWith('.js')) out.push(relative(FUNCTIONS, full));
  }
  return out;
}

/**
 * The URL path a Pages Function file serves. A `[[path]]` catch-all or a
 * `[param]` segment becomes a trailing wildcard; a plain file is its own path.
 */
function routeFor(file) {
  const parts = file.replace(/\.js$/, '').split('/');
  const last = parts[parts.length - 1];
  if (/^\[\[.+\]\]$/.test(last) || /^\[.+\]$/.test(last)) {
    return '/' + parts.slice(0, -1).join('/') + '/*';
  }
  return '/' + parts.join('/');
}

/** Does an include pattern cover this concrete route? */
function covers(pattern, route) {
  if (pattern === route) return true;
  if (pattern.endsWith('/*')) {
    const base = pattern.slice(0, -2);
    if (route === base + '/*') return true;
    return route.startsWith(base + '/');
  }
  return false;
}

const routes = JSON.parse(readFileSync(ROUTES, 'utf8'));

describe('_routes.json is a well-formed Pages routing table', () => {
  it('declares version 1, a non-empty include list and an array exclude', () => {
    expect(routes.version).toBe(1);
    expect(Array.isArray(routes.include)).toBe(true);
    expect(routes.include.length).toBeGreaterThan(0);
    expect(Array.isArray(routes.exclude)).toBe(true);
  });

  it('stays inside the 100-rule cap Pages enforces', () => {
    expect(routes.include.length + routes.exclude.length).toBeLessThanOrEqual(100);
  });

  it('uses only a leading slash and at most a trailing wildcard, as Pages requires', () => {
    for (const p of [...routes.include, ...routes.exclude]) {
      expect(p.startsWith('/'), `${p} must start with /`).toBe(true);
      const stars = (p.match(/\*/g) || []).length;
      expect(stars, `${p} may hold at most one wildcard`).toBeLessThanOrEqual(1);
      if (stars === 1) expect(p.endsWith('/*'), `${p}'s wildcard must be a trailing /*`).toBe(true);
    }
  });

  it('never routes everything, which would send static assets through the Worker', () => {
    expect(routes.include).not.toContain('/*');
  });

  it('holds no duplicate include', () => {
    expect(routes.include.length).toBe(new Set(routes.include).size);
  });
});

describe('every Pages Function on disk is actually routed (the lockout gate)', () => {
  const files = functionFiles();

  it('finds the real function tree', () => {
    expect(files.length).toBeGreaterThan(20);
    expect(files).toContain(join('sb', '[[path]].js'));
  });

  it('routes EVERY function file, so none can ship dark', () => {
    const unrouted = files
      .map((f) => ({ file: f, route: routeFor(f) }))
      .filter(({ route }) => !routes.include.some((p) => covers(p, route)));
    expect(
      unrouted,
      `these Pages Functions are NOT in public/_routes.json, so Cloudflare would\n`
      + `serve the SPA shell for them and every POST would answer 405 with an\n`
      + `empty body — the 2026-10-09 lockout:\n`
      + unrouted.map(({ file, route }) => `  ${file}  ->  needs ${route}`).join('\n')
    ).toEqual([]);
  });

  it('routes the sign-in road specifically, because that is who got locked out', () => {
    expect(routes.include).toContain('/sb/*');
    expect(covers('/sb/*', '/sb/auth/v1/token')).toBe(true);
  });

  it('carries no include that matches no function on disk', () => {
    const live = files.map(routeFor);
    const orphans = routes.include.filter((p) => !live.some((r) => covers(p, r)));
    expect(orphans, `include patterns matching no function:\n${orphans.join('\n')}`).toEqual([]);
  });
});

// PROVEN-TO-CATCH (DR-0076 §3): a gate that cannot fail is itself a lie.
describe('PROVEN-TO-CATCH', () => {
  it('a function with no include is reported, not passed over', () => {
    const route = routeFor(join('brand-new-road', '[[path]].js'));
    expect(route).toBe('/brand-new-road/*');
    expect(routes.include.some((p) => covers(p, route))).toBe(false);
  });

  it('a wildcard does NOT cover a sibling prefix that merely starts the same', () => {
    // /voice/* must not be read as covering /voice-lite/*, which is why both
    // are listed. A prefix-only string compare would have hidden that.
    expect(covers('/voice/*', '/voice-lite/*')).toBe(false);
    expect(routes.include).toContain('/voice-lite/*');
  });

  it('a plain path is not covered by an unrelated wildcard', () => {
    expect(covers('/api/*', '/automation-status')).toBe(false);
  });

  it('the route derivation turns a catch-all into a wildcard and a file into a path', () => {
    expect(routeFor(join('cams', '[[path]].js'))).toBe('/cams/*');
    expect(routeFor(join('store', 'apk', '[brand].js'))).toBe('/store/apk/*');
    expect(routeFor('automation-status.js')).toBe('/automation-status');
    expect(routeFor(join('api', 'checkout.js'))).toBe('/api/checkout');
  });
});
