// =============================================================================
// Three small closes from the 2026-11-05 Ways review (DR-1340, DR-1330 D11),
// each pinned beside the line it changes:
//   1. the push-send machine token is compared in constant time;
//   2. the voice worker never answers Access-Control-Allow-Origin: * ;
//   3. a proxied write from another origin is refused at the door, while a
//      same-origin write, an origin-less rider and a cross-origin read pass.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { sameToken } from '../../functions/api/push-send.js';
import { cors } from '../../../backend/voice-worker/src/index.js';
import { makeFunnelProxy, ROAD_HEADER, ROAD_VALUE } from '../../functions/_lib/funnel-proxy.js';

describe('1. the machine token compare', () => {
  it('matches only the exact token, and never an empty expected one', () => {
    expect(sameToken('abc123', 'abc123')).toBe(true);
    expect(sameToken('abc124', 'abc123')).toBe(false);
    expect(sameToken('abc12', 'abc123')).toBe(false);
    expect(sameToken('abc1234', 'abc123')).toBe(false);
    expect(sameToken('', 'abc123')).toBe(false);
    expect(sameToken('', '')).toBe(false);
    expect(sameToken(undefined, 'abc123')).toBe(false);
  });
  it('folds every byte whatever the outcome (the loop never returns early)', () => {
    const src = sameToken.toString();
    const loop = src.slice(src.indexOf('for ('));
    expect(loop).toMatch(/diff \|=/);
    expect(loop.slice(0, loop.indexOf('return diff'))).not.toMatch(/return/);
    // A difference in the first byte and one in the last byte are the same answer.
    expect(sameToken('Xbc123', 'abc123')).toBe(false);
    expect(sameToken('abc12X', 'abc123')).toBe(false);
  });
});

describe('2. the voice worker CORS answer', () => {
  const req = (origin) => ({ headers: { get: (k) => (k === 'Origin' ? origin : null) } });
  const res = () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  it('echoes a matched origin', () => {
    expect(
      cors({ PWA_ORIGIN: 'https://poetech.us, http://localhost:5173' }, req('http://localhost:5173'), res()).headers.get('Access-Control-Allow-Origin')
    ).toBe('http://localhost:5173');
  });
  it('answers an unmatched origin with the first allowed one, which the browser blocks', () => {
    expect(cors({ PWA_ORIGIN: 'https://poetech.us' }, req('https://evil.example'), res()).headers.get('Access-Control-Allow-Origin')).toBe(
      'https://poetech.us'
    );
  });
  it('with no allow list it sends NO CORS origin header — never *', () => {
    const out = cors({}, req('https://evil.example'), res());
    expect(out.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect([...out.headers.values()]).not.toContain('*');
  });
});

describe('3. a proxied write from another origin', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });
  function call({ method, origin }) {
    let forwarded = false;
    globalThis.fetch = async () => {
      forwarded = true;
      return new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } });
    };
    const onRequest = makeFunnelProxy({ upstreamPrefix: '/sb', label: 'sovereign-supabase' });
    const headers = origin ? { origin } : {};
    return onRequest({ request: new Request('https://poetech.us/sb/rest/v1/notes', { method, headers }), params: { path: ['rest', 'v1', 'notes'] } }).then(
      (res) => ({ res, forwarded })
    );
  }
  it('is refused at the door, signed as a Function, and never forwarded', async () => {
    const { res, forwarded } = await call({ method: 'POST', origin: 'https://evil.example' });
    expect(res.status).toBe(403);
    expect(res.headers.get(ROAD_HEADER)).toBe(ROAD_VALUE);
    expect((await res.json()).code).toBe('cross-origin-write');
    expect(forwarded).toBe(false);
  });
  it('passes a same-origin write, an origin-less rider, and a cross-origin read', async () => {
    expect((await call({ method: 'POST', origin: 'https://poetech.us' })).forwarded).toBe(true);
    expect((await call({ method: 'PATCH' })).forwarded).toBe(true);
    expect((await call({ method: 'GET', origin: 'https://evil.example' })).forwarded).toBe(true);
  });
});
