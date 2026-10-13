// @vitest-environment node
// =============================================================================
// server-error-text + the sovereign proxy — a server's failure is said in words
// =============================================================================
// Darrell's phone, 2026-09-09 11:07 PM: My profile's status line filled with
// "<!DOCTYPE html> ... <title>Origin DNS error |" — Cloudflare's 1016 page,
// streamed through the /sb proxy into supabase-js and printed raw. Two closes,
// both pinned here: the proxy turns an edge HTML 5xx into one JSON 502 with a
// readable `message`; the client belt never prints an HTML body.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { humanizeServerError, looksLikeHtml, htmlTitle } from '../lib/server-error-text.js';
import { makeFunnelProxy } from '../../functions/_lib/funnel-proxy.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const CF_1016 = '<!DOCTYPE html>\n<!--[if lt IE 7]> <html class="no-js ie6 oldie" lang="en-US"> <![endif]-->\n<html class="no-js" lang="en-US"><head><title>Origin DNS error | poetech.tail5a2f35.ts.net | Cloudflare</title></head><body>...</body></html>';

describe('humanizeServerError — words, and what did not happen', () => {
  it('an HTML error page becomes one sentence carrying its <title> as the class of failure', () => {
    const s = humanizeServerError({ message: CF_1016 });
    expect(s).toBe('Nothing was saved — the church server could not be reached (Origin DNS error). Try again in a moment.');
    expect(s).not.toMatch(/<|DOCTYPE|html/i);
  });
  it('a real database message is kept, one line, capped', () => {
    expect(humanizeServerError({ message: 'a display name is 1 to 80 characters' })).toBe('Nothing was saved — a display name is 1 to 80 characters');
    expect(humanizeServerError('x'.repeat(500)).length).toBeLessThan(240);
  });
  it('an empty answer is honest, and the "did" is the caller\'s', () => {
    expect(humanizeServerError('', { did: 'The message was not sent' })).toBe('The message was not sent — the server did not answer. Try again in a moment.');
    expect(humanizeServerError(null)).toMatch(/^Nothing was saved — the server did not answer/);
  });
  it('helpers: looksLikeHtml and htmlTitle', () => {
    expect(looksLikeHtml(CF_1016)).toBe(true);
    expect(looksLikeHtml('permission denied for table profiles')).toBe(false);
    expect(htmlTitle(CF_1016)).toBe('Origin DNS error');
    expect(htmlTitle('no title here')).toBe('');
  });
  it('source pin: the profile save path uses it (never the raw error.message)', () => {
    const src = readFileSync(join(HERE, '..', 'lib', 'profiles-sync.js'), 'utf8');
    expect(src).toContain("humanizeServerError(error, { did: 'Nothing was saved' })");
    expect(src).not.toMatch(/errors: \[error\.message/);
  });
});

describe('the sovereign proxy answers JSON when the edge answers HTML', () => {
  const run = async (upstream) => {
    const proxy = makeFunnelProxy({ upstreamPrefix: '/sb', label: 'sovereign-supabase' });
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => upstream;
    try {
      return await proxy({
        request: new Request('https://poetech.us/sb/rest/v1/rpc/upsert_my_profile', { method: 'POST', body: '{}', headers: { 'content-type': 'application/json' } }),
        params: { path: ['rest', 'v1', 'rpc', 'upsert_my_profile'] },
      });
    } finally { globalThis.fetch = realFetch; }
  };

  it('a 530 HTML page from the edge becomes a JSON 502 with a readable message and the page title', async () => {
    const res = await run(new Response(CF_1016, { status: 530, headers: { 'content-type': 'text/html; charset=UTF-8' } }));
    expect(res.status).toBe(502);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    const body = await res.json();
    expect(body.code).toBe('upstream-unreachable');
    expect(body.upstreamStatus).toBe(530);
    expect(body.detail).toBe('Origin DNS error');
    expect(body.message).toBe('The church server could not be reached (Origin DNS error). Nothing was changed — try again in a moment.');
    expect(JSON.stringify(body)).not.toMatch(/DOCTYPE|<html/i);
  });

  it('the NAS\'s own JSON errors pass through untouched — those are words', async () => {
    const res = await run(new Response('{"message":"permission denied for table profiles","code":"42501"}', { status: 403, headers: { 'content-type': 'application/json' } }));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ message: 'permission denied for table profiles', code: '42501' });
  });

  it('a healthy 200 streams through unchanged', async () => {
    const res = await run(new Response('[{"ok":true}]', { status: 200, headers: { 'content-type': 'application/json' } }));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('[{"ok":true}]');
  });

  it('a JSON 5xx from the NAS itself is not rewritten (only HTML from the edge is)', async () => {
    const res = await run(new Response('{"message":"db down"}', { status: 503, headers: { 'content-type': 'application/json' } }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ message: 'db down' });
  });
});
