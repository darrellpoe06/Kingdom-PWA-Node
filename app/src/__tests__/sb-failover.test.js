// sb-failover (DR-1653): a second road for sign-in and data, decided in DR-1622
// after the NAS's Tailscale login lapsed and the ONE road went dark.
import { describe, it, expect, vi } from 'vitest';
import { createFailoverFetch, rewriteToFallback, PREFER_FALLBACK_MS } from '../lib/sb-failover.js';

const PRIMARY = 'https://poetech.tail5a2f35.ts.net/sb';
const FALLBACK = 'https://sb.poetech.us';
const res = (status) => ({ status, ok: status < 400 });

describe('rewriteToFallback', () => {
  it('moves a request under the primary base onto the fallback base', () => {
    expect(rewriteToFallback(`${PRIMARY}/auth/v1/token?grant_type=password`, PRIMARY, FALLBACK)).toBe(`${FALLBACK}/auth/v1/token?grant_type=password`);
    expect(rewriteToFallback(`${PRIMARY}/rest/v1/choir_sermons`, `${PRIMARY}/`, `${FALLBACK}/`)).toBe(`${FALLBACK}/rest/v1/choir_sermons`);
  });
  it('never rewrites a URL that is not under the primary (no lookalike prefix)', () => {
    expect(rewriteToFallback('https://example.com/x', PRIMARY, FALLBACK)).toBeNull();
    expect(rewriteToFallback(`${PRIMARY}evil/x`, PRIMARY, FALLBACK)).toBeNull();
  });
});

describe('createFailoverFetch', () => {
  it('is OFF with no fallback: the platform fetch is returned unchanged', () => {
    const f = vi.fn();
    expect(createFailoverFetch({ primary: PRIMARY, fallback: '', fetchImpl: f })).toBe(f);
  });

  it('a healthy primary answer is returned and the fallback is never touched', async () => {
    const f = vi.fn(async () => res(200));
    const ff = createFailoverFetch({ primary: PRIMARY, fallback: FALLBACK, fetchImpl: f });
    expect((await ff(`${PRIMARY}/auth/v1/user`, {})).status).toBe(200);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('a 4xx is the server ANSWERING (wrong password) and is never retried', async () => {
    const f = vi.fn(async () => res(400));
    const ff = createFailoverFetch({ primary: PRIMARY, fallback: FALLBACK, fetchImpl: f });
    expect((await ff(`${PRIMARY}/auth/v1/token`, { method: 'POST', body: '{}' })).status).toBe(400);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('THE OUTAGE: the primary cannot be reached at all -> the same request goes to the tunnel', async () => {
    const f = vi.fn(async (url) => {
      if (String(url).startsWith(PRIMARY)) throw new TypeError('Failed to fetch');
      return res(200);
    });
    const onSwitch = vi.fn();
    const ff = createFailoverFetch({ primary: PRIMARY, fallback: FALLBACK, fetchImpl: f, onSwitch });
    const init = { method: 'POST', body: '{"email":"a@b.c"}' };
    expect((await ff(`${PRIMARY}/auth/v1/token?grant_type=password`, init)).status).toBe(200);
    expect(f.mock.calls[1][0]).toBe(`${FALLBACK}/auth/v1/token?grant_type=password`);
    expect(f.mock.calls[1][1]).toBe(init); // same method and body
    expect(onSwitch).toHaveBeenCalledWith('fallback', 'Failed to fetch');
  });

  it('an edge gateway failure (502/525/530) is retried on the tunnel', async () => {
    for (const code of [502, 525, 530]) {
      const f = vi.fn(async (url) => (String(url).startsWith(PRIMARY) ? res(code) : res(200)));
      const ff = createFailoverFetch({ primary: PRIMARY, fallback: FALLBACK, fetchImpl: f });
      expect((await ff(`${PRIMARY}/rest/v1/x`, {})).status).toBe(200);
    }
  });

  it('after a failover the tunnel is preferred for a while, then the primary is tried again', async () => {
    let t = 0;
    let primaryUp = false;
    const f = vi.fn(async (url) => {
      if (String(url).startsWith(PRIMARY)) {
        if (!primaryUp) throw new TypeError('down');
        return res(200);
      }
      return res(200);
    });
    const ff = createFailoverFetch({ primary: PRIMARY, fallback: FALLBACK, fetchImpl: f, now: () => t });
    await ff(`${PRIMARY}/a`, {});
    f.mockClear();
    await ff(`${PRIMARY}/b`, {});
    expect(f).toHaveBeenCalledTimes(1);
    expect(f.mock.calls[0][0]).toBe(`${FALLBACK}/b`); // straight to the road that works
    primaryUp = true;
    t = PREFER_FALLBACK_MS + 1;
    f.mockClear();
    await ff(`${PRIMARY}/c`, {});
    expect(f.mock.calls[0][0]).toBe(`${PRIMARY}/c`); // the primary gets its turn back
  });

  it('when BOTH roads are down the caller sees the real failure, not a fake success', async () => {
    const f = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    const ff = createFailoverFetch({ primary: PRIMARY, fallback: FALLBACK, fetchImpl: f });
    await expect(ff(`${PRIMARY}/x`, {})).rejects.toThrow('Failed to fetch');
  });

  it("a primary 502 with the tunnel also failing returns the primary's own answer", async () => {
    const f = vi.fn(async (url) => (String(url).startsWith(PRIMARY) ? res(502) : res(503)));
    const ff = createFailoverFetch({ primary: PRIMARY, fallback: FALLBACK, fetchImpl: f });
    expect((await ff(`${PRIMARY}/x`, {})).status).toBe(502);
  });

  it('only rewrites requests to the house database, never anything else', async () => {
    const f = vi.fn(async () => {
      throw new TypeError('down');
    });
    const ff = createFailoverFetch({ primary: PRIMARY, fallback: FALLBACK, fetchImpl: f });
    await expect(ff('https://example.com/x', {})).rejects.toThrow('down');
    expect(f).toHaveBeenCalledTimes(1);
  });
});

describe('supabase.js wires the failover only when a fallback is built in', () => {
  it('passes global.fetch to createClient behind VITE_SUPABASE_FALLBACK_URL', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'supabase.js'), 'utf8');
    expect(src).toMatch(/VITE_SUPABASE_FALLBACK_URL/);
    expect(src).toMatch(/SB_FALLBACK_URL && failoverFetch \? \{ global: \{ fetch: failoverFetch \} \} : \{\}/);
  });
});
