// =============================================================================
// Security headers — vercel.json defense-in-depth gate (DR-0076 / DR-0060)
// =============================================================================
// The app is served by Vercel; the only place to set response security headers is
// app/vercel.json. This gate proves the headers + CSP are present and meaningfully
// strict, and (per DR-0060) is proven-to-catch: a weakened CSP (e.g. script-src
// regaining 'unsafe-inline', which would re-open inline-script XSS), a dropped
// clickjacking guard, or a removed CSP all FAIL here.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const VERCEL = join(dirname(fileURLToPath(import.meta.url)), '../../vercel.json');

// Pull the header object that carries the CSP, flattened to { key: value }.
function securityHeaderMap(config) {
  for (const entry of config.headers || []) {
    const map = {};
    for (const h of entry.headers || []) map[h.key.toLowerCase()] = h.value;
    if (map['content-security-policy']) return map;
  }
  return null;
}

// Pure checker: returns { ok, problems }.
export function checkSecurityHeaders(config) {
  const problems = [];
  const map = securityHeaderMap(config);
  if (!map) return { ok: false, problems: ['no header block carries a Content-Security-Policy'] };

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

const realConfig = () => JSON.parse(readFileSync(VERCEL, 'utf8'));

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
