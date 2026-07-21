// =============================================================================
// ways-brain — the LIVE Ways, fetched from the sovereign parser's output
// =============================================================================
// The build-time snapshot (__DR_PRINCIPLES__, re-reviews.js) shows the Ways as of
// the last DEPLOY. This reads the SOVEREIGN Ways brain (infra/nas-ways/
// ways_ingest.py writes /ways/brain.json to the Caddy site) so the app can show
// the Ways as of the last time the parser ran on the NAS — updated between
// deploys, without the Claude Code agent (DR-0219; the sovereign half).
//
// SAME-ORIGIN, RELATIVE (DR-0218 zero-n8n): '/ways/brain.json', never a vendor/
// Funnel URL. HONEST OFFLINE (DR-0076): on any failure the caller keeps the
// build-time snapshot — the live brain is an ENHANCEMENT (fresher + the open
// re-review backlog), never a hard dependency, and it never fabricates.
// =============================================================================

export const WAYS_BRAIN_URL = '/ways/brain.json';

// Normalize the parser's JSON into the shape the UI reads. Never throws; a
// missing/garbled body yields { ok:false } so the caller falls back cleanly.
export function normalizeWaysBrain(json) {
  if (!json || typeof json !== 'object' || json.ok === false) {
    return { ok: false, live: false, generatedAt: null, principles: [], openReReviews: [], counts: { principles: 0, decisions: 0, open_re_reviews: 0 } };
  }
  const principles = (Array.isArray(json.principles) ? json.principles : [])
    .filter((p) => p && p.id)
    .map((p) => ({ id: String(p.id), summary: String(p.summary || ''), source: String(p.source || '') }));
  const openReReviews = (Array.isArray(json.open_re_reviews) ? json.open_re_reviews : [])
    .filter((r) => r && r.date)
    .map((r) => ({ id: String(r.id || ''), date: String(r.date), title: String(r.title || '') }));
  const c = (json.counts && typeof json.counts === 'object') ? json.counts : {};
  return {
    ok: true,
    live: true,
    generatedAt: json.generated_at || null,
    principles,
    openReReviews,
    counts: {
      principles: Number.isFinite(c.principles) ? c.principles : principles.length,
      decisions: Number.isFinite(c.decisions) ? c.decisions : 0,
      open_re_reviews: Number.isFinite(c.open_re_reviews) ? c.open_re_reviews : openReReviews.length,
    },
  };
}

// Fetch the live Ways brain. Returns the normalized shape; { ok:false } on any
// network/parse failure (the caller then keeps the build-time snapshot).
export async function fetchWaysBrain({ signal, fetchImpl } = {}) {
  const doFetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!doFetch) return normalizeWaysBrain(null);
  try {
    const r = await doFetch(WAYS_BRAIN_URL, { headers: { Accept: 'application/json' }, cache: 'no-store', signal });
    if (!r.ok) return normalizeWaysBrain(null);
    const json = await r.json().catch(() => null);
    return normalizeWaysBrain(json);
  } catch (_) {
    return normalizeWaysBrain(null);
  }
}
