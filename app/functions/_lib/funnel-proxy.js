// =============================================================================
// Shared Funnel reverse-proxy factory — ONE implementation for every
// same-origin route that fronts the NAS (2026-07-30 comprehensive review).
// =============================================================================
// Why a Function per route (not _redirects): Cloudflare Pages `_redirects`
// 200-proxying is restricted to same-site URLs and CANNOT proxy an external
// origin. The Tailscale Funnel is an external origin, so each NAS-backed path
// needs a Function that fetch()es the Funnel and streams the response back.
//
// Why the proxy exists at all: the Funnel throttles cross-origin browser
// fetches from poetech.us with HTTP 503 *before* they reach the NAS. Routing
// through a same-origin proxy makes the Funnel see ONE trusted client
// (Cloudflare egress) instead of every family browser, eliminating the
// throttle. Full rationale:
// docs/99-session-notes/2026-06-01-research-review-wf18-unreachable.md
// (formerly also in app/src/lib/n8n-base.js, removed with DR-0617).
//
// Before this factory existed, functions/n8n/[[path]].js and
// functions/nas-photos/[[path]].js were ~90% identical copies — and the NINE
// sovereign paths the app had already cut over to (/llm, /reviews, /taxes,
// /scribe, /ways, /property-history, /automation-status, /wake-orchestrator*)
// had NO transport at all on poetech.us: each silently fell through to the SPA
// and served its authored fallback (the 2026-07-30 review's headline finding,
// gated by client-path-parity.test.js). Now every route is a 3-line file over
// this one implementation.
//
// This directory is underscore-prefixed, so Pages does NOT route it.
//
// EVERY ANSWER FROM HERE SIGNS ITSELF (2026-10-17, DR-1092). From 2026-10-09 to
// 2026-10-17 this repository carried an incident — #2057, 38 comments, a zone
// Worker written to route around it (DR-1068) and an unlock that put the
// absolute Funnel origin back into the client bundle — all on the claim that NO
// PAGES FUNCTION WAS RUNNING. The claim was false the whole time. It rested on
// reading the CONTENT TYPE of /automation-status: text/html was taken to mean
// "the SPA shell answered, no Function ran". But /automation-status is a PROXY,
// like every road in this file, and it forwards whatever the NAS returns —
// content type and all. /automation-status is not a Funnel mount, so it lands
// on the Funnel's root and comes back as the NAS's own HTML page. The Function
// ran perfectly and returned HTML, and the probe called that a dead transport.
//
// A content type cannot answer "did a Function run", because a proxy's job is
// to return somebody else's content type. So the answer is no longer inferred:
// every response this factory produces — the proxied one AND both 502s — sets
// `x-poetech-road: pages-function`. Only code running here can set a response
// header; the SPA fallback is a static file and can set nothing. The probes
// read the header and the question is settled structurally.
//
// The zone Worker (infra/cf-roads-worker/worker.js) already signed itself
// `x-poetech-road: worker` for exactly this reason. This is the same idea on
// the door that was actually carrying the traffic.
// =============================================================================

const FUNNEL_ORIGIN = 'https://poetech.tail5a2f35.ts.net';

// The signature every answer from this factory carries. A probe that reads it
// knows a Function ran; its ABSENCE is what a dark road looks like.
export const ROAD_HEADER = 'x-poetech-road';
export const ROAD_VALUE = 'pages-function';

// upstreamPrefix: the path prefix ON THE FUNNEL that this route forwards to.
//   ''            -> strip the route's own prefix (the legacy /n8n behavior:
//                    /n8n/webhook/foo -> FUNNEL/webhook/foo)
//   '/nas-photos' -> preserve (/nas-photos/x -> FUNNEL/nas-photos/x), the
//                    shape every sovereign route uses (NAS Caddy routes by path)
// label: names the route in the 502 error body so a failure says which
//   feature's transport is down, not just "upstream unreachable".
export function makeFunnelProxy({ upstreamPrefix, label }) {
  return async function onRequest(context) {
    const { request, params } = context;
    const url = new URL(request.url);

    // [[path]] catch-all -> array of segments after the route prefix (absent
    // entirely for single-path routes like /property-history).
    const segments = Array.isArray(params?.path) ? params.path : (params?.path ? [params.path] : []);
    const path = segments.join('/');
    const target = FUNNEL_ORIGIN + upstreamPrefix + (path ? '/' + path : '') + url.search;

    // Copy request headers but drop Host so fetch sets the correct Funnel host.
    const headers = new Headers(request.headers);
    headers.delete('host');

    const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

    let upstream;
    try {
      upstream = await fetch(target, {
        method: request.method,
        headers,
        // Buffer the body so we never depend on streaming-body `duplex`
        // support across runtime versions. Bounded: the largest body any
        // route sends is a phone-backup media chunk at CHUNK_BYTES (6 MB,
        // app/src/lib/media-backup.js), well under the Pages request cap;
        // every other payload is a small JSON family write.
        body: hasBody ? await request.arrayBuffer() : undefined,
        redirect: 'manual',
      });
    } catch (err) {
      // Funnel unreachable (NAS down / Tailscale blip). Fail with a clear 502
      // so the client surfaces a real error instead of an opaque/CORS fail.
      return new Response(
        JSON.stringify({ error: `${label} proxy upstream unreachable`, detail: String((err && err.message) || err) }),
        { status: 502, headers: { 'content-type': 'application/json', [ROAD_HEADER]: ROAD_VALUE } }
      );
    }

    // AN UPSTREAM THAT FAILED BEFORE THE NAS ANSWERED SPEAKS JSON, NOT HTML
    // (2026-09-09, Darrell's phone at 11:07 PM: Cloudflare's 1016 "Origin DNS
    // error" page — what this runtime's fetch() returns when the Funnel
    // hostname does not resolve — streamed through here into supabase-js,
    // whose error.message is the raw body, and printed itself into the My
    // profile status line). Every client of these routes speaks JSON; an
    // HTML error page is Cloudflare talking to a browser that is not there.
    // So a 5xx whose body is HTML becomes one honest JSON 502 carrying the
    // page's <title> as the class of failure, and a `message` a person can
    // read. The NAS's own JSON errors (PostgREST 4xx/5xx) pass through
    // untouched — those ARE words.
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
        { status: 502, headers: { 'content-type': 'application/json', [ROAD_HEADER]: ROAD_VALUE } }
      );
    }

    // Stream the upstream response back unchanged (status + headers + body),
    // plus the one header that says this Function answered. The upstream's own
    // headers are copied first and never dropped, so the signature is additive:
    // a road that was working keeps behaving exactly as it did.
    const out = new Headers(upstream.headers);
    out.set(ROAD_HEADER, ROAD_VALUE);
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: out,
    });
  };
}
