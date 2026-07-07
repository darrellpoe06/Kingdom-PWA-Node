// =============================================================================
// perpetual-report — one portable, sortable history over every record stream
// =============================================================================
// "Perpetual reports, like the Books section's historical, for everything we
// want to keep track of in our projects and other systems — portable, and able
// to sort multiple business systems' processes, for adaptability." (Darrell,
// 2026-07-07.) The Books ledger pattern, generalized: every record stream the
// app already keeps (projects, board work + its history events, concerns,
// discussions, the decision ledger, the review registry, the lessons incidents)
// normalized into ONE row shape, filterable by system/kind/status/text, sorted
// as a timeline, paginated, and exportable as CSV — so the same history travels
// across business systems instead of living trapped per-surface.
//
// NO STATIC DATA (DR-0121): every row is a projection of a live record — a
// board_tasks row or its append-only links.history, a concerns/discussions/
// feedback row, or a build-parsed repo record (the DR ledger, REVIEWS.md,
// LESSONS-LEARNED). Nothing here is typed into this file.
//
// Pure + deterministic (proven-to-catch in perpetual-report.test.js).
// =============================================================================
import { taskHistory, groupLabelOf } from './board.js';

const isoDay = (v) => {
  const s = String(v || '');
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : '';
};
const clip = (s, n = 300) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

// The record streams ("systems"). A row's `system` is one of these keys; the
// component renders the labels. Order here is the filter-chip order.
export const REPORT_SYSTEMS = [
  ['projects', 'Projects'],
  ['boards', 'Board work'],
  ['board-events', 'Work events'],
  ['concerns', 'Concerns'],
  ['discussions', 'Discussions'],
  ['decisions', 'Decision ledger'],
  ['reviews', 'Reviews'],
  ['lessons', 'Lessons incidents'],
];

// ---------------------------------------------------------------------------
// buildReportRows — normalize every stream into { id, date, system, kind,
// title, detail, status, source }. Missing dates stay '' (sorted last, shown
// as "undated") — never invented (DR-0076).
// ---------------------------------------------------------------------------
export function buildReportRows({
  projects = [], tasks = [], concerns = [], discussions = [],
  ledger = null, reviews = null, lessons = null,
} = {}) {
  const rows = [];

  for (const p of projects) {
    if (!p || !p.id) continue;
    rows.push({
      id: `pr-project-${p.id}`,
      date: isoDay(p.startDate || p.createdAt),
      system: 'projects',
      kind: p.domain || 'project',
      title: p.title || String(p.id),
      detail: clip(p.notes || p.description || ''),
      status: p.status || '',
      source: 'projects (synced)',
    });
  }

  for (const t of tasks) {
    if (!t || !t.slug) continue;
    rows.push({
      id: `pr-task-${t.slug}`,
      date: isoDay(t.dueDate || t.startDate),
      system: 'boards',
      kind: 'task',
      title: t.title || t.slug,
      detail: clip([t.boardTitle, groupLabelOf(t), t.notes].filter(Boolean).join(' · ')),
      status: t.status || '',
      source: 'board_tasks (live)',
    });
    // The append-only history — hand-offs, phase completions, re-defaults.
    // These are the "finish ripple" moments (DR-0120): real recorded events.
    taskHistory(t).forEach((e, i) => {
      if (!e || !e.kind) return;
      rows.push({
        id: `pr-ev-${t.slug}-${i}`,
        date: isoDay(e.at),
        system: 'board-events',
        kind: e.kind,
        title: e.kind === 'phase-complete'
          ? `Phase "${e.phase || groupLabelOf(t)}" completed — ${e.boardTitle || t.boardTitle || t.boardSlug}`
          : `${e.kind === 'default' ? 'Re-defaulted' : 'Hand-off'}: ${e.from || '—'} → ${e.to || '—'} (${t.title || t.slug})`,
        detail: clip(e.note || ''),
        status: 'recorded',
        source: 'board_tasks.links.history (append-only)',
      });
    });
  }

  for (const c of concerns) {
    if (!c || !c.id) continue;
    rows.push({
      id: `pr-concern-${c.id}`,
      date: isoDay(c.targetDate || c.created),
      system: 'concerns',
      kind: c.source || 'manual',
      title: clip(c.concern, 160),
      detail: clip(c.solution || ''),
      status: c.status || 'open',
      source: `concerns · ${c.source || 'manual'}${c.area ? ` · ${c.area}` : ''}`,
    });
  }

  for (const d of discussions) {
    if (!d) continue;
    rows.push({
      id: `pr-disc-${d.slug || d.id}`,
      date: isoDay(d.createdAt || d.created_at || d.updatedAt),
      system: 'discussions',
      kind: d.kind || 'discussion',
      title: d.title || 'Discussion',
      detail: clip(d.body || ''),
      status: d.status || 'open',
      source: 'discussions (synced)',
    });
  }

  for (const d of (ledger && Array.isArray(ledger.items) ? ledger.items : [])) {
    if (!d || !d.id) continue;
    rows.push({
      id: `pr-dr-${d.id}`,
      date: isoDay(d.date),
      system: 'decisions',
      kind: 'decision-record',
      title: `${d.id} — ${d.title || d.decision || ''}`.trim(),
      detail: clip(d.decision || d.rationale || ''),
      status: d.status || '',
      source: 'docs/decisions (re-parsed every build)',
    });
  }

  for (const r of (reviews && Array.isArray(reviews.items) ? reviews.items : [])) {
    if (!r || !r.id) continue;
    rows.push({
      id: `pr-rev-${r.id}`,
      date: isoDay(r.date),
      system: 'reviews',
      kind: r.type || 'review',
      title: `${r.id} — ${r.title || r.surface || ''}`.trim(),
      detail: clip(r.findings || ''),
      status: r.status || 'logged',
      source: 'docs/reviews/REVIEWS.md (re-parsed every build)',
    });
  }

  for (const [i, inc] of (lessons && Array.isArray(lessons.incidents) ? lessons.incidents : []).entries()) {
    if (!inc || !inc.title) continue;
    rows.push({
      id: `pr-les-${inc.date || i}-${i}`,
      date: isoDay(inc.date),
      system: 'lessons',
      kind: 'incident',
      title: clip(inc.title, 160),
      detail: '',
      status: 'distilled',
      source: 'LESSONS-LEARNED.md (re-parsed every build)',
    });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// filterReport / sortReport — the sortable, cross-system lens.
// ---------------------------------------------------------------------------
export function filterReport(rows, { system = 'all', status = 'all', query = '', from = '', to = '' } = {}) {
  const q = String(query || '').trim().toLowerCase();
  return (rows || []).filter((r) => {
    if (!r) return false;
    if (system !== 'all' && r.system !== system) return false;
    if (status !== 'all' && String(r.status) !== status) return false;
    if (from && (!r.date || r.date < from)) return false;
    if (to && (!r.date || r.date > to)) return false;
    if (q && !`${r.title} ${r.detail} ${r.kind} ${r.status} ${r.source}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function sortReport(rows, { key = 'date', dir = 'desc' } = {}) {
  const sign = dir === 'asc' ? 1 : -1;
  const val = (r) => String(r?.[key] ?? '');
  return [...(rows || [])]
    .map((r, i) => [r, i])
    .sort((a, b) => {
      const va = val(a[0]), vb = val(b[0]);
      // Undated rows sink to the bottom in BOTH directions on the date key.
      if (key === 'date') {
        if (!va && !vb) return a[1] - b[1];
        if (!va) return 1;
        if (!vb) return -1;
      }
      return sign * va.localeCompare(vb) || (a[1] - b[1]);
    })
    .map(([r]) => r);
}

// Distinct statuses present in the rows (for the status filter — derived from
// the data itself, never a hardcoded list that drifts).
export function reportStatuses(rows) {
  const seen = new Set();
  for (const r of rows || []) if (r && r.status) seen.add(String(r.status));
  return [...seen].sort();
}

// ---------------------------------------------------------------------------
// reportToCsv — portability. RFC-4180-style escaping so the export opens
// cleanly in any spreadsheet / other business system.
// ---------------------------------------------------------------------------
export function reportToCsv(rows) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ['date', 'system', 'kind', 'title', 'detail', 'status', 'source'];
  const lines = [header.join(',')];
  for (const r of rows || []) {
    if (!r) continue;
    lines.push(header.map((k) => esc(r[k])).join(','));
  }
  return lines.join('\r\n');
}

// ---------------------------------------------------------------------------
// failureCoverage — the "failures & fixes" lens: are the failures we recorded
// being implemented/fixed? Counts per failure-carrying stream, split into
// open / working / closed by each stream's own vocabulary. Derived, never
// asserted: the numbers move the moment the underlying records do.
// ---------------------------------------------------------------------------
const CLOSED = new Set(['done', 'addressed', 'resolved', 'accepted', 'distilled', 'recorded', 'complete', 'shipped']);
const WORKING = new Set(['in-progress', 'building', 'logged', 'archived']);

export function failureCoverage(rows) {
  const streams = ['concerns', 'reviews', 'lessons'];
  const out = [];
  for (const s of streams) {
    const list = (rows || []).filter((r) => r && r.system === s);
    let open = 0, working = 0, closed = 0;
    for (const r of list) {
      const st = String(r.status || '').toLowerCase();
      if (CLOSED.has(st)) closed += 1;
      else if (WORKING.has(st)) working += 1;
      else open += 1;
    }
    out.push({ system: s, total: list.length, open, working, closed });
  }
  return out;
}
