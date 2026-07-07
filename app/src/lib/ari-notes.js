// =============================================================================
// ari-notes — Ari's running record + responsibilities, DERIVED (never static)
// =============================================================================
// "This should be full of Ari notes and Ari has stopped updating as we add
// features." (Darrell, 2026-07-07 — DR-0120/DR-0121 item 3.) And: "Ari's
// responsibility and reports should all update to reflect as well, all inside
// the PoeTech App." (Darrell, 2026-07-07.)
//
// The constraint is real and verified: the cloud build agent cannot write
// family-instance discussions rows (RLS, by design — DR-0060). So instead of a
// lane that must REMEMBER to write notes, Ari's notes DERIVE from the decision
// ledger — the record every shipped feature already files (docs/decisions/ ->
// __DR_LEDGER__, re-parsed on every build). The best tending is derived, not
// remembered (DR-0120 §2): this feed can only fall silent if shipping stops
// filing decision records, which is the failure we want visible.
//
// The credentialed Local-LLM tending lane (DR-0120 §3) still owns writing
// REAL discussions rows (reflections with Study refs, judgment calls) when it
// arms — this derived feed is the always-current floor beneath it.
//
// Pure + deterministic (proven-to-catch in ari-notes.test.js).
// =============================================================================
import { isAiOwner } from './board.js';

const clip = (s, n) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

// ---------------------------------------------------------------------------
// ariNotesFromLedger — one note per dated Decision Record, newest-first: what
// shipped/was decided, and the why, carrying its DR ref. Discussion-shaped so
// the Discussions surface renders it beside the family's real rows.
// ---------------------------------------------------------------------------
export function ariNotesFromLedger(ledger, { limit = 0 } = {}) {
  const rows = (ledger && Array.isArray(ledger.items)) ? ledger.items : [];
  const out = [];
  for (const d of rows) {
    if (!d || !d.id || !/^\d{4}-\d{2}/.test(String(d.date || ''))) continue;
    out.push({
      id: `ari-note-${d.id}`,
      kind: 'decision',
      title: d.title || d.id,
      body: clip(d.decision || d.rationale || '', 360) || 'Recorded in the decision ledger.',
      date: String(d.date).slice(0, 10),
      drRef: d.id,
      drStatus: d.status || '',
      readOnly: true,
      source: 'decision ledger (derived — updates every build)',
    });
  }
  out.sort((a, b) => b.date.localeCompare(a.date) || b.drRef.localeCompare(a.drRef));
  return limit > 0 ? out.slice(0, limit) : out;
}

// ---------------------------------------------------------------------------
// ariAssignments — Ari's LIVE workload from the real board rows: every item
// whose owner is the AI (board.js isAiOwner — 'Ari', 'AI', 'agent', …), split
// open / done. This IS Ari's current responsibility list; it moves the moment
// an item is pushed to or from him (the two-way handoff).
// ---------------------------------------------------------------------------
export function ariAssignments(tasks) {
  const mine = (Array.isArray(tasks) ? tasks : []).filter((t) => t && isAiOwner(t.owner));
  const open = mine.filter((t) => t.status !== 'done');
  const done = mine.filter((t) => t.status === 'done');
  return {
    total: mine.length,
    open: open.length,
    done: done.length,
    openItems: open.map((t) => ({
      slug: t.slug,
      title: t.title || t.slug,
      board: t.boardTitle || t.boardSlug || '',
      status: t.status || 'not-started',
      dueDate: t.dueDate || null,
    })),
  };
}

// ---------------------------------------------------------------------------
// ARI_STANDING_DUTIES — the standing responsibilities the ledger assigned to
// the AI lane, each carrying the DR that assigned it. The LIST is maintained
// in code as part of shipping (a new assignment lands with its DR); each ref
// is RESOLVED against the live ledger at render (resolveDuties) so a duty
// whose DR disappears reads as "not in the ledger" instead of silently
// standing on nothing (DR-0076 — the WhyStrip pattern).
// ---------------------------------------------------------------------------
export const ARI_STANDING_DUTIES = [
  { key: 'board-work', duty: 'Work every board item pushed to Ari (the two-way handoff), and record hand-offs with their why.', drRef: 'DR-0077' },
  { key: 'notes', duty: 'Keep a running note per shipped feature — derived live from the decision ledger here; written as real synced reflections once the credentialed tending lane arms (Tier C, three brakes).', drRef: 'DR-0120' },
  { key: 'tending', duty: 'Tend the record surfaces as features land — feedback promoted or closed, concerns re-decided when a target passes, board items flipped — structurally where possible, by the tending lane where judgment is needed.', drRef: 'DR-0120' },
  { key: 'no-static', duty: 'Keep every report surface derived from live sources and keep cleaning — no hand-typed record where a live source exists.', drRef: 'DR-0121' },
  { key: 'reviews', duty: 'Report reviews where they ran — orchestration/ways reviews, entrance reviews, and post-feature alignment appended to the registry the app reads.', drRef: 'DR-0108' },
];

export function resolveDuties(ledger, duties = ARI_STANDING_DUTIES) {
  const byId = new Map(((ledger && ledger.items) || []).map((d) => [d.id, d]));
  return duties.map((d) => {
    const hit = byId.get(d.drRef);
    return {
      ...d,
      found: !!hit,
      drTitle: hit ? (hit.title || hit.decision || '') : '',
      drDate: hit ? (hit.date || '') : '',
    };
  });
}
