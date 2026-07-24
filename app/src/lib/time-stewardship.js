// =============================================================================
// time-stewardship — leave, hours, approvals, balances: time as a stewarded gift
// =============================================================================
// MANDATE (Darrell, 2026-07-24, with three screenshots of his employer's
// leave system — Submit Days, the Absence Graph, accrual balances): "There
// are a lot of time keeping types of software; we need a module/s for the
// PoeTech App and the family of Apps and users." This is the DOMAIN CORE:
// pure, dependency-free, unit-tested functions the surfaces build on —
// robust and lightweight, per the directive. Gaps analysis + strategy:
// docs/99-session-notes/2026-07-24-time-stewardship-gaps-analysis.md (Ari).
// Recorded as DR-0233.
//
// What the reference system proves people need (traced from the screenshots):
//   · submit a day/part-day off by TYPE, with a note, into an APPROVAL flow
//   · a named approver; approved entries only a supervisor can cancel
//   · accrual BALANCES: balance forward + accrued − used = balance on date
//   · a team ABSENCE GRAPH everyone can read at a glance
// What we deliberately do differently (founder protection + DR-0100 truth):
//   · every state change carries a receipt row (append-only ledger shape,
//     the engagement-guard pattern) — nothing edits history in place
//   · separation of duties is enforced IN THE MATH: no self-approval
//   · color theology (DR-0099): true red never marks a leave type
//
// Tenancy/RLS, sync, and UI ride the platform's existing rails when the
// surfaces land; nothing here touches the network or the DOM.

// ---------------------------------------------------------------------------
// Leave types — the platform vocabulary. `serve` is ours: ministry/serve time
// the reference systems have no word for (COLG volunteers, bus ministry,
// choir). Colors come from the app palette; per DR-0099 none is true red.
// ---------------------------------------------------------------------------
export const LEAVE_TYPES = Object.freeze([
  { key: 'vacation', label: 'Vacation', short: 'V', color: '#5A6E3D' },
  { key: 'sick', label: 'Sick / Recovery', short: 'S', color: '#B85838' },
  { key: 'personal', label: 'Personal Day', short: 'P', color: '#8A6FA8' },
  { key: 'floating', label: 'Floating Holiday', short: 'F', color: '#3D5A6E' },
  { key: 'serve', label: 'Serve / Ministry', short: 'M', color: '#EBA77E' },
  { key: 'other', label: 'Other', short: 'O', color: '#5A5751' },
]);

export function leaveType(key) {
  return LEAVE_TYPES.find((t) => t.key === key) || null;
}

// Increments: whole-day fractions (the reference system's full/half), plus
// hour precision for hourly crews (1099 + volunteers, engagement-guard rails).
export const INCREMENTS = Object.freeze({ full: 1, half: 0.5, quarter: 0.25 });

// Entry status flow. Append-only: a transition ADDS a receipt, never rewrites.
export const ENTRY_STATUSES = Object.freeze([
  'draft', 'submitted', 'approved', 'declined', 'cancelled',
]);

const TRANSITIONS = Object.freeze({
  draft: ['submitted', 'cancelled'],
  submitted: ['approved', 'declined', 'cancelled'],
  approved: ['cancelled'], // supervisor-cancel only (reference-system rule)
  declined: ['submitted'], // fix and resubmit
  cancelled: [],
});

/**
 * Validate one leave entry's shape. Returns { ok } or { error }. Pure.
 * days: fraction of a day (INCREMENTS or hours/hoursPerDay when hourly).
 */
export function validateEntry(entry) {
  const e = entry || {};
  if (!leaveType(e.type)) return { error: `unknown leave type: ${e.type}` };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(e.date || ''))) return { error: 'date must be YYYY-MM-DD' };
  const d = Number(e.days);
  if (!(d > 0 && d <= 1)) return { error: 'days must be a fraction in (0, 1]' };
  if (!e.memberId) return { error: 'memberId required' };
  return { ok: true };
}

/**
 * Decide a status transition WITH separation of duties (founder protection —
 * enforced in the math, not the UI): the person who submitted can never be
 * the person who approves/declines; approved entries cancel only by a
 * DIFFERENT hand than the requester (the reference system's supervisor rule).
 * Returns { ok, receipt } or { error }. Pure — now/timestamps injected.
 */
export function decideTransition({ entry, to, actorId, at }) {
  const from = entry?.status;
  if (!ENTRY_STATUSES.includes(to)) return { error: `unknown status: ${to}` };
  if (!TRANSITIONS[from] || !TRANSITIONS[from].includes(to)) {
    return { error: `cannot move ${from} → ${to}` };
  }
  if (!actorId) return { error: 'actorId required' };
  const needsOtherHand = to === 'approved' || to === 'declined'
    || (to === 'cancelled' && from === 'approved');
  if (needsOtherHand && actorId === entry.memberId) {
    return { error: 'separation of duties: your own request needs another approver' };
  }
  return {
    ok: true,
    receipt: { entryId: entry.id ?? null, from, to, by: actorId, at: at || null },
  };
}

// ---------------------------------------------------------------------------
// Balances — the reference system's summary block, generalized:
//   balanceForward + accrued(asOf) − used(asOf) = balance(asOf)
// ---------------------------------------------------------------------------

/**
 * Days accrued from a policy through asOf (inclusive), from the period start.
 * policy: { balanceForward, accrualPerMonth, periodStart } — monthly accrual
 * (the dominant real-world shape); yearly grants model as balanceForward.
 * Pure; no Date.now — asOf is always passed in as YYYY-MM-DD.
 */
export function accruedThrough(policy, asOf) {
  const p = policy || {};
  const per = Number(p.accrualPerMonth) || 0;
  if (!per || !p.periodStart) return 0;
  const [sy, sm] = String(p.periodStart).split('-').map(Number);
  const [ay, am] = String(asOf).split('-').map(Number);
  if (!sy || !ay) return 0;
  const months = (ay - sy) * 12 + (am - sm) + 1; // accrual granted per month entered
  return months > 0 ? months * per : 0;
}

/** Sum of approved (and optionally submitted) days of one type through asOf. */
export function usedThrough(entries, type, asOf, { includePending = false } = {}) {
  return (entries || []).reduce((sum, e) => {
    if (e.type !== type || String(e.date) > String(asOf)) return sum;
    const counts = e.status === 'approved' || (includePending && e.status === 'submitted');
    return counts ? sum + (Number(e.days) || 0) : sum;
  }, 0);
}

/** The summary row the reference system shows, computed not asserted. */
export function balanceOn(policy, entries, type, asOf) {
  const forward = Number(policy?.balanceForward) || 0;
  const accrued = accruedThrough(policy, asOf);
  const used = usedThrough(entries, type, asOf);
  return {
    balanceForward: forward,
    accrued: round2(accrued),
    used: round2(used),
    balance: round2(forward + accrued - used),
  };
}

const round2 = (n) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------
// Absence graph — one row per member across a date range, each cell the
// entry's short code (approved only: the graph states facts, DR-0100).
// ---------------------------------------------------------------------------

/** List of YYYY-MM-DD strings from start to end inclusive. Pure. */
export function dateRange(start, end) {
  const out = [];
  const d = new Date(`${start}T00:00:00Z`);
  const stop = new Date(`${end}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || Number.isNaN(stop.getTime())) return out;
  while (d <= stop && out.length < 400) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

/**
 * Rows for the team graph: [{ memberId, name, cells: [{ date, short, color,
 * days } | null] }]. Approved entries only — pending never paints the board.
 */
export function buildAbsenceRows(members, entries, start, end) {
  const days = dateRange(start, end);
  const approved = (entries || []).filter((e) => e.status === 'approved');
  return (members || []).map((m) => ({
    memberId: m.id,
    name: m.name || m.id,
    cells: days.map((date) => {
      const hit = approved.find((e) => e.memberId === m.id && e.date === date);
      if (!hit) return null;
      const t = leaveType(hit.type);
      return { date, short: t?.short || '?', color: t?.color || '#5A5751', days: Number(hit.days) || 1 };
    }),
  }));
}
