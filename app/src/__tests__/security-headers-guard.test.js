// =============================================================================
// Security headers — defense-in-depth gate for BOTH hosts (DR-0076 / DR-0060)
// =============================================================================
// Response security headers are set in TWO places, one per host:
//   - app/vercel.json          (Vercel — the host today)
//   - app/public/_headers      (Cloudflare Pages — the host after the cutover,
//                               docs/00-foundations/CLOUDFLARE-CUTOVER-RUNBOOK.md)
// On Cloudflare, _headers is the ONLY place headers are set: anything not listed
// is not served. So the off-Vercel move could SILENTLY drop the CSP/HSTS/
// clickjacking guards. This gate proves both files carry strict headers AND that
// the Cloudflare CSP is at byte parity with Vercel's — and (per DR-0060) is
// proven-to-catch: a weakened CSP, a dropped guard, or a host drifting from the
// other all FAIL here.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const VERCEL = join(dirname(fileURLToPath(import.meta.url)), '../../vercel.json');
const CF_HEADERS = join(dirname(fileURLToPath(import.meta.url)), '../../public/_headers');

// Pull the header object that carries the CSP, flattened to { key: value }.
function securityHeaderMap(config) {
  for (const entry of config.headers || []) {
    const map = {};
    for (const h of entry.headers || []) map[h.key.toLowerCase()] = h.value;
    if (map['content-security-policy']) return map;
  }
  return null;
}

// Shared core: run the strict-headers checks against a { key: value } header map
// (keys lowercased). Used for both the Vercel and Cloudflare header sources.
function checkHeaderMap(map) {
  const problems = [];
  if (!map || !map['content-security-policy']) {
    return { ok: false, problems: ['no header source carries a Content-Security-Policy'] };
  }

  const required = ['x-frame-options', 'x-content-type-options', 'referrer-policy', 'permissions-policy', 'strict-transport-security'];
  for (const k of required) if (!map[k]) problems.push(`missing header ${k}`);

  if ((map['x-frame-options'] || '').toUpperCase() !== 'DENY') problems.push('X-Frame-Options must be DENY');
  if ((map['x-content-type-options'] || '').toLowerCase() !== 'nosniff') problems.push('X-Content-Type-Options must be nosniff');

  const csp = map['content-security-policy'] || '';
  for (const directive of ["default-src 'self'", "frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'"]) {
    if (!csp.includes(directive)) problems.push(`CSP missing "${directive}"`);
  }

  // The critical XSS lever: script-src must NOT allow inline or eval. Isolate the
  // script-src directive and check it specifically (other directives may legitimately
  // use 'unsafe-inline', e.g. style-src for inline styles).
  const scriptSrc = (csp.split(';').map((s) => s.trim()).find((s) => s.startsWith('script-src')) || '');
  if (!scriptSrc) problems.push('CSP missing a script-src directive');
  if (/'unsafe-inline'/.test(scriptSrc)) problems.push("script-src must NOT allow 'unsafe-inline' (re-opens inline-script XSS)");
  if (/'unsafe-eval'/.test(scriptSrc)) problems.push("script-src must NOT allow 'unsafe-eval'");

  return { ok: problems.length === 0, problems };
}

// Pure checker for the Vercel config: returns { ok, problems }.
export function checkSecurityHeaders(config) {
  return checkHeaderMap(securityHeaderMap(config));
}

// --- Cloudflare Pages _headers (the post-cutover host) -----------------------
// Parse the _headers file into { '<path>': { header-name(lowercase): value } }.
// Format: a path line at column 0, followed by indented "Header: value" lines;
// '#' lines and blanks are ignored. https://developers.cloudflare.com/pages/configuration/headers/
export function parseCloudflareHeaders(text) {
  const rules = {};
  let current = null;
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (/^\s/.test(line)) {
      // Indented → a header on the current rule.
      const idx = line.indexOf(':');
      if (current && idx !== -1) {
        const key = line.slice(0, idx).trim().toLowerCase();
        current[key] = line.slice(idx + 1).trim();
      }
    } else {
      // Column 0 → a path pattern; start a new rule.
      current = {};
      rules[line.trim()] = current;
    }
  }
  return rules;
}

// The security headers live on the catch-all '/*' rule. Returns { ok, problems }.
export function checkCloudflareHeaders(text) {
  const rules = parseCloudflareHeaders(text);
  return checkHeaderMap(rules['/*'] || null);
}

const realConfig = () => JSON.parse(readFileSync(VERCEL, 'utf8'));
const realCfHeaders = () => readFileSync(CF_HEADERS, 'utf8');

describe('vercel.json security headers', () => {
  it('PASSES the real vercel.json (CSP + headers present and strict)', () => {
    const { ok, problems } = checkSecurityHeaders(realConfig());
    expect(ok, problems.join('; ')).toBe(true);
  });

  // --- proven-to-catch (DR-0060) ---------------------------------------------
  it('CATCHES a removed CSP', () => {
    const cfg = realConfig();
    cfg.headers = cfg.headers.map((e) => ({ ...e, headers: (e.headers || []).filter((h) => h.key !== 'Content-Security-Policy') }));
    expect(checkSecurityHeaders(cfg).ok).toBe(false);
  });

  it("CATCHES script-src regaining 'unsafe-inline'", () => {
    const cfg = realConfig();
    const map = securityHeaderMap(cfg);
    const entry = cfg.headers.find((e) => (e.headers || []).some((h) => h.value === map['content-security-policy']));
    const cspHeader = entry.headers.find((h) => h.key === 'Content-Security-Policy');
    cspHeader.value = cspHeader.value.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'");
    const { ok, problems } = checkSecurityHeaders(cfg);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/unsafe-inline/i);
  });

  it('CATCHES a dropped clickjacking guard (frame-ancestors)', () => {
    const cfg = realConfig();
    const map = securityHeaderMap(cfg);
    const entry = cfg.headers.find((e) => (e.headers || []).some((h) => h.value === map['content-security-policy']));
    const cspHeader = entry.headers.find((h) => h.key === 'Content-Security-Policy');
    cspHeader.value = cspHeader.value.replace("frame-ancestors 'none'; ", '');
    const { ok, problems } = checkSecurityHeaders(cfg);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/frame-ancestors/i);
  });
});

describe('Cloudflare _headers security headers (post-cutover host)', () => {
  it('PASSES the real _headers (strict security headers on /*)', () => {
    const { ok, problems } = checkCloudflareHeaders(realCfHeaders());
    expect(ok, problems.join('; ')).toBe(true);
  });

  it('keeps the Cloudflare CSP at byte parity with vercel.json', () => {
    const cfCsp = (parseCloudflareHeaders(realCfHeaders())['/*'] || {})['content-security-policy'];
    const vercelCsp = securityHeaderMap(realConfig())['content-security-policy'];
    // Drift on either host is a regression: a relaxed CSP on one is a hole on
    // whichever host serves it. They must move together.
    expect(cfCsp).toBe(vercelCsp);
  });

  // --- proven-to-catch (DR-0060) ---------------------------------------------
  it('CATCHES a _headers with no /* security block (the pre-fix regression)', () => {
    // This is exactly the state main was in before the cutover hardening: only
    // cache rules, no security block. It MUST fail.
    const cacheOnly = '/poetech-app/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n';
    expect(checkCloudflareHeaders(cacheOnly).ok).toBe(false);
  });

  it("CATCHES script-src regaining 'unsafe-inline' in _headers", () => {
    const weakened = realCfHeaders().replace("script-src 'self'", "script-src 'self' 'unsafe-inline'");
    const { ok, problems } = checkCloudflareHeaders(weakened);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/unsafe-inline/i);
  });

  it('CATCHES a dropped HSTS header in _headers', () => {
    const noHsts = realCfHeaders().replace(/^\s*Strict-Transport-Security:.*$/m, '');
    expect(checkCloudflareHeaders(noHsts).ok).toBe(false);
  });

  it('CATCHES the two hosts drifting apart (parity guard)', () => {
    const cfCsp = (parseCloudflareHeaders(realCfHeaders())['/*'] || {})['content-security-policy'];
    const driftedVercel = JSON.parse(readFileSync(VERCEL, 'utf8'));
    const map = securityHeaderMap(driftedVercel);
    const entry = driftedVercel.headers.find((e) => (e.headers || []).some((h) => h.value === map['content-security-policy']));
    const cspHeader = entry.headers.find((h) => h.key === 'Content-Security-Policy');
    cspHeader.value = cspHeader.value + " https://evil.example.com";
    expect(cfCsp).not.toBe(securityHeaderMap(driftedVercel)['content-security-policy']);
  });
});
