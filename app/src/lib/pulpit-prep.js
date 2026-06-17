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

// Normalized identity key for a speaker name — lowercase, strip everything but
// [a-z0-9]. The CLIENT mirror of SQL speaker_norm() (migration 0037): collapses
// case, spacing (incl. non-breaking/double spaces — the invisible duplicate that
// made the SAME display name count twice), and punctuation. Defense-in-depth so
// the roster groups identically whether or not a row already carries speaker_id.
export function speakerKey(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// The preachers & teachers roster, derived from REAL data: the distinct speakers
// credited across the published messages (drafts excluded), most first. BG is the
// primary voice; guest preachers/teachers who fill in are rostered alongside from
// their own credited messages — no fabricated roster, it IS who has preached.
//
// Speaker is a canonical ENTITY now (0037): each message points at a speaker_id
// and carries the entity's canonical_name in `speaker`. We group by that entity
// (speakerId) so the nine historical Gwin spellings collapse to ONE row; rows
// without an id yet fall back to the normalized name key. The display name is the
// canonical spelling, and `isBG` reflects the entity's primary flag when present
// (real data) — falling back to a /gwin/i name check for the public path, whose
// RPC returns the already-canonical text without the id. Tolerates garbage rows.
export function speakerRoster(sermons) {
  const list = Array.isArray(sermons) ? sermons.filter((s) => s && typeof s === 'object') : [];
  const groups = new Map(); // key -> { name, count, primary }
  for (const s of list.filter((s) => s.status !== 'draft')) {
    const name = (s.speaker || '').trim();
    if (!name) continue;
    const key = s.speakerId || speakerKey(name);
    const g = groups.get(key) || { name, count: 0, primary: false };
    g.count += 1;
    if (s.speakerIsPrimary) g.primary = true;
    // Keep the longest spelling seen as the display name (most complete); the
    // canonical_name written by 0037 is already uniform, this just stays stable.
    if (name.length > g.name.length) g.name = name;
    groups.set(key, g);
  }
  return Array.from(groups.values())
    .map((g) => ({ name: g.name, count: g.count, isBG: g.primary || /gwin/i.test(g.name) }))
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
