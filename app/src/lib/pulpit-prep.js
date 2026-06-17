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

// The preachers & teachers roster, derived from REAL data: the distinct speakers
// credited across the published messages (drafts excluded), most first. BG is the
// primary voice; guest preachers/teachers who fill in are rostered alongside from
// their own credited messages — no fabricated roster, it IS who has preached.
// `isBG` flags the Gwin entries. Tolerates a non-array corpus / garbage rows.
export function speakerRoster(sermons) {
  const list = Array.isArray(sermons) ? sermons.filter((s) => s && typeof s === 'object') : [];
  const counts = new Map();
  for (const s of list.filter((s) => s.status !== 'draft')) {
    const name = (s.speaker || '').trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return Array.from(counts, ([name, count]) => ({ name, count, isBG: /gwin/i.test(name) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

// Which tabs a viewer of The Word — Migdal sees. Pure so the access rule is
// unit-tested: EVERYONE gets the public "Message library"; ONLY leadership
// (canManage = owner/admin) additionally gets "Prep from your corpus". A non-
// privileged user can never reach the prep tab.
export function theWordTabs(canManage) {
  const tabs = [['library', 'Message library']];
  if (canManage) tabs.push(['prep', 'Prep from your corpus']);
  return tabs;
}

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
