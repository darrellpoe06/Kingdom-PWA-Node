// =============================================================================
// build-story — the Build tab's ship story DERIVED from live sources (DR-0121)
// =============================================================================
// "No static data, combine what makes sense." (Darrell, 2026-07-07.) The Build
// tab's 39-item hand-typed ROADMAP constant went 20 days stale without saying
// so; this replaces it by combining the three record streams the app already
// maintains as part of shipping — so the ship story can only go stale if the
// ways themselves fail:
//
//   SHIPPED  — the Decision-Record ledger (docs/decisions/ -> __DR_LEDGER__,
//              re-parsed on every build). Every shipped feature lands a dated
//              DR; the ledger IS the maintained ship record.
//   BUILDING/NEXT — the live board store (board_tasks + the SEED_BOARDS specs
//              as the code-maintained fallback where a board has no live rows
//              on this device). Phase state is real; due dates only where a
//              real due date exists (DR-0076 — no invented dates).
//   GATED    — the governance decision queue (docs/governance/decision-queue.md
//              -> __GOVERNANCE_QUEUE__): "waiting on a decision" is exactly the
//              queue's OPEN list, not a hand-copied echo of it.
//
// Pure + deterministic (proven-to-catch in build-story.test.js). The component
// (BuildBoard.jsx) only renders what these functions derive.
// =============================================================================
import { SEED_BOARDS, seedTasksForBoard, boardPhases, boardProgress, SEED_BOARD_BY_SLUG } from './board.js';

// ---------------------------------------------------------------------------
// Chronology helpers (moved from BuildBoard.jsx unchanged — same pinned
// behavior: dated items sort as a timeline, prose targets sink to the bottom).
// ---------------------------------------------------------------------------
export function whenSortKey(r) {
  const t = Date.parse(r.when || '');
  return Number.isNaN(t) ? Infinity : t;
}
export function sortByWhen(list, dir = 'asc') {
  const sign = dir === 'desc' ? -1 : 1;
  return list
    .map((r, i) => [r, i])
    .sort((a, b) => {
      const ka = whenSortKey(a[0]), kb = whenSortKey(b[0]);
      if (ka === Infinity && kb === Infinity) return a[1] - b[1];
      if (ka === Infinity) return 1;
      if (kb === Infinity) return -1;
      return sign * (ka - kb) || (a[1] - b[1]);
    })
    .map(([r]) => r);
}

const truncate = (s, n) => {
  const t = String(s || '').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

// ---------------------------------------------------------------------------
// SHIPPED — dated Decision Records, newest-first. Each entry keeps the
// ROADMAP item shape ({id,title,what,status,when}) so the sort helpers and the
// existing render read it unchanged. Undated ledger rows (the DR-0017..0049
// chain rows all carry dates; a malformed row may not) are excluded from the
// timeline rather than given an invented date.
// ---------------------------------------------------------------------------
export function shippedFromLedger(ledger, { limit = 0 } = {}) {
  const rows = (ledger && Array.isArray(ledger.items)) ? ledger.items : [];
  const out = [];
  for (const d of rows) {
    if (!d || !/^\d{4}-\d{2}(-\d{2})?/.test(String(d.date || ''))) continue;
    out.push({
      id: d.id,
      title: d.title || d.decision || d.id,
      what: truncate(d.decision || d.rationale || '', 420) || 'Recorded in the decision ledger.',
      status: 'shipped',
      when: String(d.date).slice(0, 10),
      drStatus: d.status || '',
    });
  }
  const sorted = sortByWhen(out, 'desc');
  return limit > 0 ? sorted.slice(0, limit) : sorted;
}

// ---------------------------------------------------------------------------
// BUILDING / NEXT — the live boards. For each program board: the live rows on
// this device when present, else the code-maintained seed spec (labeled, so
// the surface says which it is showing). A board classifies as:
//   building — any item in progress or blocked, or partly done
//   next     — nothing started yet
//   complete — every item done (rolls up into a single honest line)
// ---------------------------------------------------------------------------
export function effectiveBoards(tasks) {
  const bySlug = new Map();
  for (const t of Array.isArray(tasks) ? tasks : []) {
    if (!t || !t.boardSlug) continue;
    if (!bySlug.has(t.boardSlug)) bySlug.set(t.boardSlug, []);
    bySlug.get(t.boardSlug).push(t);
  }
  const out = [];
  for (const spec of SEED_BOARDS) {
    const live = bySlug.get(spec.slug);
    out.push({
      slug: spec.slug,
      title: spec.title,
      blurb: spec.blurb || '',
      rows: live && live.length ? live : seedTasksForBoard(spec.slug),
      live: !!(live && live.length),
    });
    bySlug.delete(spec.slug);
  }
  for (const [slug, rows] of bySlug) {
    out.push({
      slug,
      title: rows.find((r) => r && r.boardTitle)?.boardTitle || slug,
      blurb: '',
      rows,
      live: true,
    });
  }
  return out;
}

export function inFlightStory(tasks) {
  const building = [];
  const next = [];
  const complete = [];
  for (const b of effectiveBoards(tasks)) {
    const p = boardProgress(b.rows);
    if (!p.total) continue;
    const phases = boardPhases(b.rows, SEED_BOARD_BY_SLUG[b.slug]?.groupOrder || []);
    const currentPhase = phases.find((x) => !x.complete)?.label || null;
    let nextDue = null;
    for (const t of b.rows) {
      if (!t || t.status === 'done' || !t.dueDate) continue;
      const v = Date.parse(t.dueDate);
      if (!Number.isNaN(v) && (nextDue == null || v < nextDue)) nextDue = v;
    }
    const entry = {
      id: b.slug,
      title: b.title,
      what: b.blurb,
      when: nextDue != null ? new Date(nextDue).toISOString().slice(0, 10) : '',
      progress: p,
      currentPhase,
      live: b.live,
    };
    if (p.done === p.total) complete.push({ ...entry, status: 'shipped' });
    else if (p.inProgress > 0 || p.blocked > 0 || p.done > 0) building.push({ ...entry, status: 'building' });
    else next.push({ ...entry, status: 'next' });
  }
  return { building: sortByWhen(building, 'asc'), next: sortByWhen(next, 'asc'), complete };
}

// ---------------------------------------------------------------------------
// PAST DUE — open board items whose REAL due date has passed. Only real
// YYYY-MM-DD due dates count; done items never count. The board holds itself
// to the dates it commits to, in the open.
// ---------------------------------------------------------------------------
export function pastDueTasks(tasks, { now = Date.now() } = {}) {
  const out = [];
  for (const b of effectiveBoards(tasks)) {
    for (const t of b.rows) {
      if (!t || t.status === 'done') continue;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(t.dueDate || '')) continue;
      const days = Math.floor((now - Date.parse(t.dueDate)) / 86400000);
      if (days > 0) {
        out.push({
          id: t.slug || `${b.slug}-${t.title}`,
          title: t.title,
          what: `${b.title}${t.group ? ` · ${t.group}` : ''} — committed ${t.dueDate}, still ${t.status}.`,
          status: t.status,
          when: t.dueDate,
          boardTitle: b.title,
          daysLate: days,
        });
      }
    }
  }
  return out.sort((a, b) => b.daysLate - a.daysLate);
}

// ---------------------------------------------------------------------------
// GATED — the open governance queue: work deliberately waiting on the
// Governor's decision, read from the same real file the Decisions tab reads.
// ---------------------------------------------------------------------------
export function gatedFromQueue(queue) {
  const rows = (queue && Array.isArray(queue.items)) ? queue.items : [];
  return rows.map((it) => ({
    id: it.id,
    title: it.title || it.id,
    what: [it.unblocks && `Unblocks: ${it.unblocks}`, it.recommendation && `Recommendation: ${it.recommendation}`]
      .filter(Boolean).join(' — ') || 'Awaiting the Governor’s decision.',
    status: 'gated',
    when: `awaiting the Governor’s decision${it.tier ? ` (Tier ${it.tier})` : ''}`,
  }));
}
