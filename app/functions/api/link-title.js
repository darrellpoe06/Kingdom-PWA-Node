// =============================================================================
// Cloudflare Pages Function — /api/link-title (server-side page-title fetch)
// =============================================================================
// n8n cutover (DR-0218 / DR-0083): replaces the /n8n/webhook/link-title webhook
// (wf22) with a same-origin edge function — no n8n, no NAS dependency. Same
// privacy property the webhook had: the URL is resolved SERVER-SIDE (at our edge,
// never a third-party metadata service), so what a family member is reading never
// leaks from their browser. The caller (poe-financial-mvp-v28.jsx enrichNoteLinks)
// now hits /api/link-title?url=… and needs no NAS bearer.
//
// Safety: http/https only, hard URL-length cap, a request timeout, and a capped
// read (title lives in the <head>, so we only need the first slice of the body).
// Follows the market-quote.js pattern (onRequestGet + the Cache API).

const json = (obj, status) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

// Pull the <title>…</title> text from an HTML head slice; decode the few
// entities that actually show up in titles. Returns '' when there is no title.
function extractTitle(html) {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html || '');
  if (!m) return '';
  return m[1]
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const target = String(url.searchParams.get('url') || '').trim();
  if (!target || target.length > 500 || !/^https?:\/\//i.test(target)) {
    return json({ error: 'bad-url' }, 400);
  }

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let upstream;
  try {
    upstream = await fetch(target, {
      headers: { 'User-Agent': 'PoeTech-FamilyOS/1.0 (+https://poetech.us)', 'Accept': 'text/html,application/xhtml+xml' },
      redirect: 'follow',
      signal: AbortSignal.timeout(6000),
    });
  } catch {
    return json({ title: '' }, 200); // unreachable → caller keeps the hostname label
  }
  const ctype = upstream.headers.get('content-type') || '';
  if (!upstream.ok || !/html|xml|text/i.test(ctype)) {
    return json({ title: '' }, 200);
  }

  // Only the head is needed — read a capped slice, not the whole page.
  let html = '';
  try {
    const reader = upstream.body && upstream.body.getReader();
    if (reader) {
      const dec = new TextDecoder();
      let bytes = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.length;
        html += dec.decode(value, { stream: true });
        if (/<\/title>/i.test(html) || bytes > 131072) { try { await reader.cancel(); } catch { /* ignore */ } break; }
      }
    } else {
      html = (await upstream.text()).slice(0, 131072);
    }
  } catch {
    return json({ title: '' }, 200);
  }

  const resp = json({ title: extractTitle(html) }, 200);
  resp.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  context.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}
