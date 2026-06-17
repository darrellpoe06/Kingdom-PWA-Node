// =============================================================================
// discussions — pure helpers for the in-app discuss-then-document records
// =============================================================================
// A discussion is a first-class record that DRIVES one or more projects. It is
// the in-app capture of the conversation that precedes (and explains) a build:
//
//   * directive  — "do this" (a marching order)
//   * decision   — "we chose this, and here is why" (the rationale, in-app)
//   * reflection — the Word/Study-grounded thinking behind it (ties to the Study)
//   * handoff    — "feed this to a lane" (a BRAKED execution intent, never auto-run)
//
// Every helper here is pure and unit-tested. The component (Discussions.jsx) and
// the monolith reducers consume these; the no-leak private-visibility filter and
// the project<->discussion linkage are tested as proven-to-catch gates.
// =============================================================================

export const DISCUSSION_KINDS = [
  { key: 'directive',  label: 'Directive',  glyph: '➤', blurb: 'A marching order — what to do.' },
  { key: 'decision',   label: 'Decision',   glyph: '⚖', blurb: 'What we chose, and why (the rationale, in-app).' },
  { key: 'reflection', label: 'Reflection', glyph: '🕮', blurb: 'The Word/Study-grounded thinking behind it.' },
  { key: 'handoff',    label: 'Hand-off',   glyph: '🛰', blurb: 'Feed this to a lane — braked, never auto-run.' },
];

export const DISCUSSION_KIND_KEYS = DISCUSSION_KINDS.map((k) => k.key);

export const kindMeta = (kind) =>
  DISCUSSION_KINDS.find((k) => k.key === kind) || { key: kind, label: kind, glyph: '•', blurb: '' };

export const DISCUSSION_STATUSES = ['open', 'resolved', 'archived'];

// -----------------------------------------------------------------------------
// validateDiscussion — the same shape the form enforces. Returns an array of
// human messages; empty array = valid. Title + kind are required; project links
// are optional (a free-standing reflection is allowed). Kept pure so the form
// and any future import path validate identically.
// -----------------------------------------------------------------------------
export function validateDiscussion(d) {
  const errs = [];
  const title = (d && typeof d.title === 'string' ? d.title : '').trim();
  if (!title) errs.push('A title is required.');
  if (title.length > 200) errs.push('Title is too long (max 200 characters).');
  const kind = d && d.kind;
  if (!DISCUSSION_KIND_KEYS.includes(kind)) errs.push('Pick a kind (directive, decision, reflection, or hand-off).');
  if (d && d.projectSlugs != null && !Array.isArray(d.projectSlugs)) errs.push('Linked projects must be a list.');
  return errs;
}

// -----------------------------------------------------------------------------
// normalizeProjectSlugs — a discussion may drive several projects. Always store a
// clean, de-duplicated array of non-empty string slugs (the project's local id).
// -----------------------------------------------------------------------------
export function normalizeProjectSlugs(slugs) {
  if (!Array.isArray(slugs)) return [];
  const seen = new Set();
  const out = [];
  for (const s of slugs) {
    const v = typeof s === 'string' ? s.trim() : '';
    if (v && !seen.has(v)) { seen.add(v); out.push(v); }
  }
  return out;
}

// -----------------------------------------------------------------------------
// discussionsForProject — every discussion linked to a given project slug,
// newest-first. This is what renders inline under a project ("its driving
// discussions"). Real linkage on project_slugs — no painted association.
// -----------------------------------------------------------------------------
export function discussionsForProject(discussions, projectSlug) {
  if (!Array.isArray(discussions) || !projectSlug) return [];
  return discussions
    .filter((d) => Array.isArray(d && d.projectSlugs) && d.projectSlugs.includes(projectSlug))
    .slice()
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

// -----------------------------------------------------------------------------
// visibleDiscussions — the NO-LEAK app-level wall on top of the DB instance+role
// boundary. A 'private' discussion is visible only to its author OR to an owner
// (the governor, who governs the bright lines). 'shared' discussions are visible
// to everyone in the family scope. Pure + proven-to-catch: a private record by
// user A must NOT come back for user B.
//
//   currentUserId — the signed-in user's id (created_by on a row)
//   isOwner       — true for a governor/owner (sees all, to govern)
// -----------------------------------------------------------------------------
export function visibleDiscussions(discussions, currentUserId, isOwner = false) {
  if (!Array.isArray(discussions)) return [];
  return discussions.filter((d) => {
    if (!d || d.visibility !== 'private') return true;       // shared (or unset) → visible
    if (isOwner) return true;                                 // the governor sees all
    return !!currentUserId && d.createdBy === currentUserId;  // else only the author
  });
}

// -----------------------------------------------------------------------------
// sortDiscussions — newest-first by createdAt, with a stable fallback on slug so
// the order is deterministic (no Date.now in render, test-friendly).
// -----------------------------------------------------------------------------
export function sortDiscussions(discussions) {
  if (!Array.isArray(discussions)) return [];
  return discussions
    .slice()
    .sort((a, b) =>
      String(b.createdAt || '').localeCompare(String(a.createdAt || '')) ||
      String(b.id || '').localeCompare(String(a.id || ''))
    );
}

// -----------------------------------------------------------------------------
// discussionCounts — a real roll-up for the management pulse: total, open, and a
// per-kind breakdown. Counts the records actually visible to the caller (so the
// pulse never leaks a private count to someone who can't see the record).
// -----------------------------------------------------------------------------
export function discussionCounts(discussions) {
  const list = Array.isArray(discussions) ? discussions : [];
  const byKind = Object.fromEntries(DISCUSSION_KIND_KEYS.map((k) => [k, 0]));
  let open = 0;
  for (const d of list) {
    if (d && byKind[d.kind] !== undefined) byKind[d.kind] += 1;
    if (d && d.status === 'open') open += 1;
  }
  return { total: list.length, open, byKind };
}
