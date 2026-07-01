// =============================================================================
// decisions — the app's DECISIONS surface auto-populates from what it actually did
// =============================================================================
// Darrell, 2026-07-01: "The DECISIONS tab should auto-populate from decisions the
// app actually makes/records — board hand-offs (Push to Ari/Darrell + note),
// concern resolutions, approvals, architectural/config choices — EACH with its
// RATIONALE ('we decided X not Y because Z') so future stewards inherit
// understanding, not just outcomes." (institutional memory / events-as-data.)
//
// This is the deterministic derivation: it reads the SAME shared records the app
// and the humans already write — the discussions table (kind 'handoff' /
// 'decision', migration 0035) and the concerns board (a concern that reached
// status 'done' IS a decision: "we resolved it, here's how") — and projects each
// as a decision event carrying its WHY. Both AI and humans read/write those same
// records, so a hand-off pushed by the orchestrator and one pushed by a person
// land here identically. No new table, no painted rows: a decision shows up
// because a real record exists, and carries the rationale that record stored.
//
// The build-time Decision-Record ledger (docs/decisions/ -> __DR_LEDGER__) stays
// the DECIDED section of GovernanceQueue; this adds the LIVE, in-app decisions the
// running system records between commits. PURE + DETERMINISTIC (proven-to-catch in
// decisions.test.js).
// =============================================================================

import { SEED_CONCERNS } from './concerns.js';

function isoDay(v) {
  if (!v) return '';
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function truncate(s, n) {
  const t = String(s || '').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

// kind → display metadata (badge color reuses the board's themeable palette).
export const DECISION_KIND = {
  handoff:    { label: 'Hand-off',   color: '#2A5A8E', blurb: 'A task pushed to a specific owner, with a note' },
  resolution: { label: 'Resolved',   color: '#5A6E3D', blurb: 'A concern closed — the how becomes the record' },
  decision:   { label: 'Decision',   color: '#B85838', blurb: 'A choice recorded in a discussion, with its why' },
};

// ---------------------------------------------------------------------------
// deriveAppDecisions — project the live shared records into decision events.
//
//   discussions[]  — the discussions table rows in local shape (lib/discussions
//                    / synced). kind 'handoff' → a board hand-off; kind
//                    'decision' → a recorded choice. The body IS the rationale.
//   concerns[]     — DB-backed concerns (superseding same-id seeds); a 'done'
//                    concern is a resolution decision whose solution is the why.
//   seeds[]        — the dated baseline concerns (SEED_CONCERNS); a 'done' seed
//                    is likewise a resolution with its solution as the rationale.
//
// Returns newest-first. Every event carries { decision, rationale } so the why is
// never lost. Deterministic: same records in → same list out.
// ---------------------------------------------------------------------------
export function deriveAppDecisions({ discussions = [], concerns = [], seeds = SEED_CONCERNS } = {}) {
  const out = [];

  for (const d of discussions || []) {
    if (!d) continue;
    const kind = d.kind;
    const date = isoDay(d.createdAt || d.created_at || d.updatedAt);
    if (kind === 'handoff') {
      const to = (d.meta && (d.meta.handoff?.to || d.meta.to)) || null;
      const note = d.body || (d.meta && d.meta.handoff?.note) || '';
      out.push({
        id: `dec-handoff-${d.slug || d.id}`,
        kind: 'handoff',
        title: d.title || 'Board hand-off',
        decision: to ? `Pushed to ${to}` : 'Pushed to an owner',
        rationale: note || '(no note recorded with the hand-off)',
        date,
        owner: to || (d.authorPersona || ''),
        source: 'board hand-off · discussions',
      });
    } else if (kind === 'decision') {
      out.push({
        id: `dec-discussion-${d.slug || d.id}`,
        kind: 'decision',
        title: d.title || 'Recorded decision',
        decision: d.title || 'Decision recorded',
        rationale: d.body || '(no rationale recorded)',
        date,
        owner: d.authorPersona || '',
        source: 'recorded decision · discussions',
      });
    }
  }

  // Concern resolutions — DB concerns supersede same-id seeds (a Governor's real
  // row wins over the baseline), so de-dupe by id, DB first.
  const seen = new Set();
  const resolved = [];
  for (const c of concerns || []) if (c && c.id && !seen.has(c.id)) { seen.add(c.id); if (c.status === 'done') resolved.push(c); }
  for (const c of seeds || [])   if (c && c.id && !seen.has(c.id)) { seen.add(c.id); if (c.status === 'done') resolved.push(c); }
  for (const c of resolved) {
    out.push({
      id: `dec-resolved-${c.id}`,
      kind: 'resolution',
      title: `Resolved: ${truncate(c.concern, 90)}`,
      decision: 'Concern marked resolved',
      rationale: c.solution || '(no resolution note recorded)',
      date: isoDay(c.targetDate || c.created),
      owner: '',
      concernId: c.id, // back-reference so the loop is observable both ways
      source: `concern resolution · ${c.area || 'general'}`,
    });
  }

  return out.sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(a.id).localeCompare(String(b.id)));
}
