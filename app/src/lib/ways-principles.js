// =============================================================================
// ways-principles — the binding-principle registry, surfaced live in the app
// =============================================================================
// Darrell 2026-07-21, on whether the Ways drive the app when Claude Code isn't in
// session: the docs reach the running app only via a BUILD-TIME snapshot. This is
// the safe first increment of "the Ways surfaced live" — it bakes the cite-once
// binding-principle registry (docs/decisions/PRINCIPLES.md) into the bundle
// (__DR_PRINCIPLES__) so the family/Governor can SEE the principles that govern
// the build, in-app, on every deploy — no autonomous doc-watcher, zero runaway
// risk (the three-brakes class is the SEPARATE Tier-C ingestion service).
//
// PURE + dependency-free (Node + browser + tests). Nothing painted (DR-0076):
// every row is a real registry line the build injected; the caller passes the
// injected object in, so the lib is deterministic and unit-testable. An absent /
// empty registry yields an honest empty result, never invented principles.
// =============================================================================

// Normalize the build-injected registry ({ ok, count, items:[{id,summary,source}] })
// into a clean, sorted, de-duplicated list. Tolerates a missing/garbled global.
export function normalizeWaysPrinciples(injected) {
  const raw = (injected && typeof injected === 'object' && Array.isArray(injected.items))
    ? injected.items
    : [];
  const seen = new Set();
  const items = [];
  for (const p of raw) {
    if (!p || typeof p !== 'object') continue;
    const id = String(p.id || '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    items.push({
      id,
      summary: String(p.summary || '').trim(),
      source: String(p.source || '').trim(),
    });
  }
  items.sort((a, b) => a.id.localeCompare(b.id));
  return { ok: items.length > 0, count: items.length, items };
}

// Case-insensitive substring filter over id + summary, for an in-app search box.
export function filterWaysPrinciples(items, query) {
  const q = String(query || '').trim().toLowerCase();
  const list = Array.isArray(items) ? items : [];
  if (!q) return list;
  return list.filter((p) => `${p.id} ${p.summary}`.toLowerCase().includes(q));
}

// Look one up by exact ID (e.g. a DR's `grounds:` tag) — returns the row or null.
export function findWaysPrinciple(items, id) {
  const key = String(id || '').trim().toLowerCase();
  if (!key) return null;
  return (Array.isArray(items) ? items : []).find((p) => p.id.toLowerCase() === key) || null;
}
