// @vitest-environment node
//
// A TEST HAS NO BUSINESS DOING DNS.
//
// P54 (2026-09-12). tlc-onboarding-render failed 11, then 12, of 23 tests at
// exactly ~5002ms in a loaded full suite and passed alone in 1.7s. One of the
// two causes was this: vitest.config.js pointed VITE_SUPABASE_URL at
// a HOSTNAME that does not resolve, so every component that reaches the
// supabase client on render — and many do, via a get_profile lookup — waited
// on a resolver failure first. A resolver's timeout is not ours to bound:
// ~93ms on an idle box here, seconds under load, and there is no ceiling we
// control. Measured on the full 936-file suite the day this was written:
// 18 files were paying it.
//
// The fix is that the stub URL names a LOOPBACK PORT with nothing listening.
// The kernel refuses the connection immediately — no resolver, no retry, no
// inherited timeout — and the OUTCOME is identical: the call fails and the
// code degrades exactly as it did before.
//
// This test is the thing that keeps it fixed. The failure it guards against is
// silent: putting a hostname back reintroduces an unbounded wait that every
// suite still passes, until one timing-sensitive suite doesn't.
//
// It reads the LITERAL FALLBACK out of the config source rather than the live
// value, because process.env.VITE_SUPABASE_URL wins at runtime and a developer
// with a real .env exported would otherwise test nothing.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG = join(dirname(fileURLToPath(import.meta.url)), '../../vitest.config.js');

// Comments in this repo QUOTE the old hostname on purpose (that is how the
// finding stays readable). Scanning raw text would therefore catch the
// explanation instead of the code — a mistake this suite has made before — so
// comments come out first and only real source is examined.
const stripComments = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/.*$/gm, '$1');

export const fallbackUrlFrom = (src) => {
  const m = stripComments(src).match(
    /VITE_SUPABASE_URL\s*:\s*process\.env\.VITE_SUPABASE_URL\s*\|\|\s*(['"`])([^'"`]+)\1/
  );
  return m ? m[2] : null;
};

// Loopback by literal address, or the one name every OS resolves from its own
// hosts file without a network round trip.
const NEEDS_NO_RESOLVER = (url) => {
  let host;
  try { host = new URL(url).hostname; } catch { return false; }
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1';
};

describe('the test suite never waits on a name server', () => {
  const src = readFileSync(CONFIG, 'utf8');

  it('vitest.config.js declares a Supabase URL fallback at all', () => {
    // Without one, a clean checkout throws "supabaseUrl is required" at
    // collection and zero tests run. The stub is load-bearing; this pins that
    // it did not simply get deleted in the name of "no network in tests".
    expect(fallbackUrlFrom(src)).toBeTruthy();
  });

  it('and that fallback resolves without a name server', () => {
    const url = fallbackUrlFrom(src);
    expect(NEEDS_NO_RESOLVER(url), `${url} requires DNS — see P54`).toBe(true);
  });

  it('names a port nothing listens on, so the refusal is immediate', () => {
    const port = new URL(fallbackUrlFrom(src)).port;
    expect(port, 'an unspecified port means 80/443, where something may answer').toBeTruthy();
    expect(Number(port)).toBeLessThan(1024); // privileged: unusable by a stray dev server
  });
});

describe('proven-to-catch (anti-theater)', () => {
  const config = (url) => `test: { env: { VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || '${url}' } }`;

  it('CATCHES the exact regression: a hostname back in the stub URL', () => {
    // This is the literal string that was there before P54.
    expect(NEEDS_NO_RESOLVER(fallbackUrlFrom(config('https://test-stub.supabase.co')))).toBe(false);
  });

  it('CATCHES a real project URL pasted in', () => {
    expect(NEEDS_NO_RESOLVER(fallbackUrlFrom(config('https://abcdefgh.supabase.co')))).toBe(false);
  });

  it('CATCHES the fallback being removed entirely', () => {
    expect(fallbackUrlFrom('test: { env: { VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL } }')).toBe(null);
  });

  it('PASSES the shapes that genuinely need no resolver', () => {
    for (const ok of ['http://127.0.0.1:1', 'http://localhost:54321', 'http://[::1]:1']) {
      expect(NEEDS_NO_RESOLVER(fallbackUrlFrom(config(ok))), ok).toBe(true);
    }
  });

  it('does NOT read a commented-out line as the real value', () => {
    // The comment block in vitest.config.js quotes the old hostname. If this
    // scanner read comments, the guard above would fail on its own explanation.
    const withComment = `// VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://test-stub.supabase.co'\n${config('http://127.0.0.1:1')}`;
    expect(fallbackUrlFrom(withComment)).toBe('http://127.0.0.1:1');
  });
});
