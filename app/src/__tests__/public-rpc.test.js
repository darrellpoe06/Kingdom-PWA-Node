// @vitest-environment node
// public-rpc — the anon read lane that can never hang behind the auth lock
// (DR-0076 proven-to-catch for the 2026-07-07 door hang: classes stuck on
// "Loading classes…", gallery blank, login buttons never appearing — all
// three waited on supabase-js's cross-tab getSession() lock).
import { describe, it, expect, vi, beforeEach } from 'vitest';

async function loadModule() {
  vi.resetModules();
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-test-key');
  return await import('../lib/public-rpc.js');
}

beforeEach(() => { vi.unstubAllEnvs(); });

describe('publicRpc — plain fetch, anon key, hard deadline', () => {
  it('returns data on success and sends ONLY the anon credentials', async () => {
    const { publicRpc } = await loadModule();
    let captured = null;
    const fetchImpl = async (url, init) => {
      captured = { url, init };
      return { ok: true, json: async () => [{ slug: 'mc-1' }] };
    };
    const r = await publicRpc('moore_public_classes', { p_instance_slug: 'poe-family' }, { fetchImpl });
    expect(r.error).toBeNull();
    expect(r.data).toEqual([{ slug: 'mc-1' }]);
    expect(captured.url).toBe('https://example.supabase.co/rest/v1/rpc/moore_public_classes');
    expect(captured.init.headers.apikey).toBe('anon-test-key');
    expect(captured.init.headers.Authorization).toBe('Bearer anon-test-key');
    expect(JSON.parse(captured.init.body)).toEqual({ p_instance_slug: 'poe-family' });
  });

  it('an HTTP error settles as { error } — never an unsettled promise', async () => {
    const { publicRpc } = await loadModule();
    const fetchImpl = async () => ({ ok: false, status: 404, json: async () => ({ message: 'function not found' }) });
    const r = await publicRpc('nope', {}, { fetchImpl });
    expect(r.data).toBeNull();
    expect(r.error.status).toBe(404);
    expect(r.error.message).toBe('function not found');
  });

  it('a hung request is cut at the deadline and settles as a timeout error', async () => {
    const { publicRpc } = await loadModule();
    // A fetch that never responds but honors the abort signal — the exact
    // shape of a wedged connection.
    const fetchImpl = (url, init) => new Promise((resolve, reject) => {
      init.signal.addEventListener('abort', () => {
        const e = new Error('aborted'); e.name = 'AbortError'; reject(e);
      });
    });
    const r = await publicRpc('moore_showcase', {}, { fetchImpl, timeoutMs: 30 });
    expect(r.data).toBeNull();
    expect(r.error.timedOut).toBe(true);
    expect(r.error.message).toBe('rpc-moore_showcase-timeout');
  });

  it('missing env settles honestly instead of throwing', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    const { publicRpc } = await import('../lib/public-rpc.js');
    const r = await publicRpc('anything');
    expect(r.error.message).toBe('missing-supabase-env');
  });
});

describe('the structural point — no auth machinery in the public lane', () => {
  it('public-rpc.js never imports the shared supabase client', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../lib/public-rpc.js', import.meta.url), 'utf8');
    expect(src.includes("from './supabase.js'")).toBe(false);
    expect(src.includes('@supabase/supabase-js')).toBe(false);
  });
  it('the door PUBLIC reads ride publicRpc, not supabase.rpc', async () => {
    const { readFileSync } = await import('node:fs');
    const door = readFileSync(new URL('../components/MooreDoor.jsx', import.meta.url), 'utf8');
    expect(door.includes("publicRpc('moore_public_classes'")).toBe(true);
    const showcase = readFileSync(new URL('../lib/showcase.js', import.meta.url), 'utf8');
    expect(showcase.includes("publicRpc('moore_showcase'")).toBe(true);
    expect(showcase.includes("supabase.rpc('moore_showcase'")).toBe(false);
  });
});
