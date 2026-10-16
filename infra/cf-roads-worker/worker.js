// =============================================================================
// poetech-roads — the same-origin roads as a ZONE WORKER, a second door that
// does not depend on Cloudflare Pages Functions (DR-1068; #2057, day 7)
// =============================================================================
// Since 2026-10-09 no Pages Function on poetech-app is invoked (#2057): every
// request to /sb, /cams, /nas-photos, /taxes and the rest falls through to the
// SPA shell on the custom domain, on the pages.dev alias and on every
// per-deployment host alike, while every deploy logs "Uploading Functions
// bundle". The repository cannot reach that fault. What it CAN do is answer
// the same paths one layer higher: a Worker bound to zone routes on
// poetech.us runs BEFORE the Pages project (Cloudflare resolves Workers
// routes ahead of a Pages custom domain), so the family's browsers get the
// same-origin door back that CLAUDE.md Layer 0 and DR-0307 require, and the
// 2026-10-09 unlock (the absolute Funnel origin in the client bundle, with
// its written cross-origin-throttle hazard) can be reverted.
//
// ONE IMPLEMENTATION, PORTED, NOT REWRITTEN: the request handling below is
// app/functions/_lib/funnel-proxy.js line for line — the Pages Functions and
// this Worker share the same runtime API, and the-roads-have-a-second-door
// test pins every proxied Pages route to a row here so the two doors cannot
// drift. The routes that are NOT plain proxies (functions/api/*, /geocode,
// /link, /store/apk) carry their own logic and secrets and stay with Pages.
//
// Anything that reaches this Worker on a path it does not know is handed to
// the origin untouched (fetch(request)), so a route pattern wider than the
// table can never black-hole the app.

import { handleEdge } from './edge.js';

export const FUNNEL_ORIGIN = 'https://poetech.tail5a2f35.ts.net';

// [routePrefix on poetech.us, upstreamPrefix on the Funnel, label]. Order
// matters only where one prefix begins another (voice-lite before voice,
// wake-orchestrator-control before wake-orchestrator, /poetech-app/taxes
// before anything shorter): the first row whose prefix matches wins.
export const ROADS = [
  ['/poetech-app/taxes', '/taxes', 'taxes'],
  ['/sb', '/sb', 'sovereign-supabase'],
  ['/cams', '/cams', 'cams'],
  ['/nas-photos', '/nas-photos', 'nas-photos'],
  ['/voice-lite', '/voice-lite', 'voice-lite'],
  ['/voice', '/voice', 'voice'],
  ['/taxes', '/taxes', 'taxes'],
  ['/llm', '/llm', 'llm'],
  ['/reviews', '/reviews', 'reviews'],
  ['/scribe', '/scribe', 'scribe'],
  ['/ways', '/ways', 'ways'],
  ['/openers', '/openers', 'openers'],
  ['/interest', '/interest', 'interest'],
  ['/n8n', '', 'n8n'],
  ['/automation-status', '/automation-status', 'automation-status'],
  ['/property-history', '/property-history', 'property-history'],
  ['/review-action', '/review-action', 'review-action'],
  ['/review-feed', '/review-feed', 'review-feed'],
  ['/wake-orchestrator-control', '/wake-orchestrator-control', 'wake-orchestrator-control'],
  ['/wake-orchestrator', '/wake-orchestrator', 'wake-orchestrator'],
];

/** The road a path belongs to, or null when the Worker has nothing to say. */
export function roadFor(pathname) {
  for (const road of ROADS) {
    const [prefix] = road;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return road;
  }
  return null;
}

/** The Funnel URL a poetech.us URL forwards to, or null. Pure; unit-tested. */
export function targetFor(url) {
  const u = new URL(url);
  const road = roadFor(u.pathname);
  if (!road) return null;
  const [prefix, upstreamPrefix] = road;
  return `${FUNNEL_ORIGIN}${upstreamPrefix}${u.pathname.slice(prefix.length)}${u.search}`;
}

async function proxy(request, road) {
  const [, , label] = road;
  const target = targetFor(request.url);

  // Copy request headers but drop Host so fetch sets the correct Funnel host.
  const headers = new Headers(request.headers);
  headers.delete('host');

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  let upstream;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      // Buffered, never streamed (the same bound the Pages proxy keeps: the
      // largest body any road carries is a 6 MB media chunk).
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: 'manual',
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `${label} proxy upstream unreachable`, detail: String((err && err.message) || err) }),
      { status: 502, headers: { 'content-type': 'application/json' } },
    );
  }

  // A 5xx whose body is HTML is the edge talking to a browser that is not
  // there; every client of these roads speaks JSON (funnel-proxy.js, 2026-09-09).
  const ctype = upstream.headers.get('content-type') || '';
  if (upstream.status >= 500 && /text\/html/i.test(ctype)) {
    let title = '';
    try {
      const text = await upstream.text();
      const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(text);
      title = m ? m[1].replace(/\s+/g, ' ').replace(/\s*\|.*$/, '').trim().slice(0, 80) : '';
    } catch { /* the body is not the point */ }
    return new Response(
      JSON.stringify({
        error: `${label} proxy upstream unreachable`,
        code: 'upstream-unreachable',
        upstreamStatus: upstream.status,
        detail: title || `HTTP ${upstream.status} from the edge`,
        message: `The church server could not be reached${title ? ` (${title})` : ''}. Nothing was changed — try again in a moment.`,
      }),
      { status: 502, headers: { 'content-type': 'application/json' } },
    );
  }

  // Stream the upstream response back unchanged (status + headers + body),
  // with one header that says which door answered, so a probe can tell.
  const out = new Headers(upstream.headers);
  out.set('x-poetech-road', 'worker');
  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: out });
}

export default {
  async fetch(request, env = {}) {
    const { pathname } = new URL(request.url);
    // The Edge Guard (DR-1067): the stewards see who is hitting the site and
    // block them, from inside the app, through this same Worker.
    if (pathname === '/edge' || pathname.startsWith('/edge/')) return handleEdge(request, env);
    const road = roadFor(pathname);
    if (!road) return fetch(request); // not ours: the origin (Pages) answers as before
    return proxy(request, road);
  },
};
