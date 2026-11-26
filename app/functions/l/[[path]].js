// =============================================================================
// /l/<door>/?course=..&lesson=..&s=.. -- a shared lesson link previews as the lesson (DR-1673)
// =============================================================================
// Answers a tiny page whose preview tags are the lesson's cover and title, then
// refreshes into the lesson with the SAME query (lib/learn-link-preview.js).
// FAIL-SAFE: an unknown door, a missing index or any error sends the reader
// straight on to the lesson (302) -- a preview may be plain, a lesson link never
// fails. The index (learn-preview.json) is emitted by the build from the
// approved presentation records and read from this deploy's own assets.
// =============================================================================
import { previewPage, PREVIEW_DOORS } from '../../src/lib/learn-link-preview.js';

let INDEX = null;
async function indexFor(context, origin) {
  if (INDEX) return INDEX;
  const res = await context.env.ASSETS.fetch(new URL('/learn-preview.json', origin));
  if (!res.ok) return null;
  INDEX = await res.json();
  return INDEX;
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const door = (url.pathname.split('/')[2] || '').toLowerCase();
  const fallback = PREVIEW_DOORS[door] ? `${PREVIEW_DOORS[door].path}${url.search}` : `/lovecorner/app/${url.search}`;
  try {
    if (!PREVIEW_DOORS[door]) return Response.redirect(new URL(fallback, url.origin).toString(), 302);
    let entry = null;
    try {
      const index = await indexFor(context, url.origin);
      const id = url.searchParams.get('lesson') || '';
      entry = index && Object.prototype.hasOwnProperty.call(index, id) ? index[id] : null;
    } catch {
      entry = null; // a plain preview, never a failed link
    }
    const page = previewPage({ origin: url.origin, door, search: url.search, entry });
    return new Response(page.html, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300', 'x-content-type-options': 'nosniff' },
    });
  } catch {
    return Response.redirect(new URL(fallback, url.origin).toString(), 302);
  }
}
