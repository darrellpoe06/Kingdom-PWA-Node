// =============================================================================
// pulpit-prep — pure retrieval over Bishop Gwin's own message corpus.
// =============================================================================
// The Pulpit "Prep from your corpus" surface is grounded in his REAL history:
// given his past messages + a theme/scripture query, return what he has actually
// preached on it, the distinct scriptures he has used, and the year span. No
// fabrication — the help is "sourced from him" because it IS his corpus (DR-0076).
// Dependency-free (no React, no supabase) so it is unit-testable in node, mirror-
// ing youtube-title-parse.js. Drafts are excluded from the studyable history.
// =============================================================================

export function corpusPrep(sermons, query) {
  const q = String(query || '').trim().toLowerCase();
  const all = (sermons || []).filter((s) => s.status !== 'draft');
  const matches = q
    ? all.filter((s) => `${s.title || ''} ${s.scriptureRef || ''} ${s.notes || ''}`.toLowerCase().includes(q))
    : [];
  const scriptures = Array.from(new Set(matches.map((s) => (s.scriptureRef || '').trim()).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b));
  const years = matches.map((s) => (s.serviceDate || '').slice(0, 4)).filter(Boolean).sort();
  const span = years.length ? (years[0] === years[years.length - 1] ? years[0] : `${years[0]}–${years[years.length - 1]}`) : '';
  return { matches, scriptures, span, total: all.length };
}
