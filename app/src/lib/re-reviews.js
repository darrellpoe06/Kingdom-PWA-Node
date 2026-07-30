// =============================================================================
// re-reviews — the sortable BACKLOG of dated commitments, in the app.
// =============================================================================
// Darrell 2026-07-06: "before any work... Keep a sortable list inside the
// PoeTech App too." Every parked item, deferred upgrade, and ranked opportunity
// this team records carries a `re-review:` date (DR-0075). Those dates ARE the
// backlog — but they lived only as prose inside DR bodies and REV findings, with
// no way to see "what's next / what's overdue" at a glance. This module extracts
// them into one structured, sortable list.
//
// PURE + dependency-free (Node + browser + tests). Nothing painted (DR-0076):
// every item is a real `re-review <date>` that literally appears in a review
// finding or a decision record — the same evidence discipline as the harvest /
// transcript extractors. An absent date yields no row; nothing is invented.
//
// Reads the data the build already injects (__UIUX_REVIEWS__ + __DR_LEDGER__),
// so no new build seam is needed — the extraction is a pure function of what is
// already on the page.
// =============================================================================

// Matches "re-review: 2026-07-13", "re-review 2026-07-13", "re-review by 2026-..".
// Global + case-insensitive: one DR / finding can carry several distinct dates.
const RE_REVIEW_RE = /re-review(?:ed|s)?\s*(?:by|on|:)?\s*(\d{4})-(\d{2})-(\d{2})/gi;

const MS_DAY = 86400000;

function dateMs(isoDate) {
  const ms = Date.parse(`${isoDate}T00:00:00Z`);
  return Number.isFinite(ms) ? ms : null;
}

// One backlog row with its urgency derived against `nowMs` (injected, never read
// from the clock here — deterministic in tests, safe in workflow scripts).
function makeItem(base, nowMs) {
  const ms = dateMs(base.date);
  let dueInDays = null;
  let overdue = false;
  let dueSoon = false;
  if (nowMs != null && ms != null) {
    dueInDays = Math.round((ms - nowMs) / MS_DAY);
    overdue = dueInDays < 0;
    dueSoon = dueInDays >= 0 && dueInDays <= 7;
  }
  return { ...base, dueInDays, overdue, dueSoon };
}

// A re-review commitment is CLOSED when its date is IMMEDIATELY followed by a
// done-marker: `re-review: 2026-08-01 [DONE <sha/evidence>]` (also `✓DONE`,
// `— DONE`, `(RESOLVED …)`). Scoped to the individual clause — a single
// Findings line can carry both closed and open commitments (2026-07-30 drive
// dry-run finding F1: the ledger recorded INTENT, not completion, so a naive
// date-sort drive would redo done work and the watcher over-counted overdue).
// The marker is an explicit ALL-CAPS token so prose "done" never false-closes.
const DONE_MARKER_RE = /^[\s—:(\[]*?(?:✓\s*)?(DONE|RESOLVED|CLOSED|SHIPPED|LANDED)\b/;

// Pull every OPEN re-review date out of one free-text blob, tagged with source.
function fromText(text, meta, nowMs, out) {
  const s = String(text || '');
  if (!s) return;
  RE_REVIEW_RE.lastIndex = 0;
  let m;
  while ((m = RE_REVIEW_RE.exec(s))) {
    const after = s.slice(m.index + m[0].length, m.index + m[0].length + 48);
    if (DONE_MARKER_RE.test(after)) continue; // closed commitment — not a live item
    out.push(makeItem({ ...meta, date: `${m[1]}-${m[2]}-${m[3]}` }, nowMs));
  }
}

// Accept either a normalized `{ items: [...] }` shape or a raw array.
function listOf(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  if (Array.isArray(x.items)) return x.items;
  return [];
}

// extractReReviews — the backlog from the review registry + the DR ledger.
//   reviews   : __UIUX_REVIEWS__ (items carry {id,title,date,type,status,findings,source})
//   decisions : __DR_LEDGER__     (items carry {id,title,status,decision,rationale,source})
// De-dups exact (sourceId, date) repeats so a DR naming the same date twice is
// one row; two DIFFERENT dates on one record stay two rows (they're two commitments).
export function extractReReviews({ reviews, decisions } = {}, nowMs = null) {
  const out = [];
  for (const r of listOf(reviews)) {
    fromText(r.findings, {
      sourceId: r.id || '', title: r.title || r.id || 'review',
      type: r.type || 'review', status: r.status || '',
      source: r.source || 'docs/reviews/REVIEWS.md', origin: 'review',
    }, nowMs, out);
  }
  for (const d of listOf(decisions)) {
    const body = `${d.title || ''}\n${d.decision || ''}\n${d.rationale || ''}\n${d.consequences || ''}`;
    fromText(body, {
      sourceId: d.id || '', title: d.title || d.id || 'decision',
      type: 'decision', status: d.status || '',
      source: d.id ? `DR ${d.id}` : 'docs/decisions', origin: 'decision',
    }, nowMs, out);
  }
  const seen = new Set();
  const deduped = [];
  for (const it of out) {
    const k = `${it.origin}|${it.sourceId}|${it.date}`;
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(it);
  }
  return deduped;
}

// Urgency → a KPI status the shared dot can render (never a new color).
// overdue = problem (past due, act now); due within 7d = attention; else idle.
export function reReviewStatus(item) {
  if (!item) return { status: 'idle', label: 'no date' };
  if (item.overdue) return { status: 'problem', label: `overdue ${Math.abs(item.dueInDays)}d` };
  if (item.dueSoon) return { status: 'attention', label: item.dueInDays === 0 ? 'due today' : `due ${item.dueInDays}d` };
  if (item.dueInDays == null) return { status: 'idle', label: 'no date' };
  return { status: 'idle', label: `in ${item.dueInDays}d` };
}

// Sort rank for the status column: most-urgent first (overdue < soon < later).
function urgencyRank(it) {
  if (it.overdue) return 0;
  if (it.dueSoon) return 1;
  if (it.dueInDays == null) return 3;
  return 2;
}

// sortReReviews — stable sort by any column, asc/desc. Mirrors imported-view's
// sortRows discipline: pure, stable ties (original order), nulls sink regardless
// of direction. Default: date ascending = soonest / overdue first (the backlog
// order — what to pull next).
const CMP = {
  date: (it) => dateMs(it.date),
  status: (it) => urgencyRank(it),
  type: (it) => String(it.type || '').toLowerCase(),
  source: (it) => String(it.source || '').toLowerCase(),
  title: (it) => String(it.title || '').toLowerCase(),
};
export function sortReReviews(items, key = 'date', dir = 'asc') {
  const get = CMP[key] || CMP.date;
  const sign = dir === 'asc' ? 1 : -1;
  return (items || []).map((it, i) => [it, i]).sort((a, b) => {
    const va = get(a[0]);
    const vb = get(b[0]);
    const an = va == null;
    const bn = vb == null;
    if (an && bn) return a[1] - b[1];
    if (an) return 1;   // nulls sink regardless of direction
    if (bn) return -1;
    if (va < vb) return -1 * sign;
    if (va > vb) return 1 * sign;
    return a[1] - b[1];
  }).map((x) => x[0]);
}

// Headline counts for the tab (overdue is the number that must not hide).
export function reReviewSummary(items, nowMs = null) {
  const list = items || [];
  let overdue = 0;
  let soon = 0;
  for (const it of list) {
    const s = nowMs != null && it.dueInDays == null ? makeItem(it, nowMs) : it;
    if (s.overdue) overdue += 1;
    else if (s.dueSoon) soon += 1;
  }
  return { total: list.length, overdue, soon };
}
