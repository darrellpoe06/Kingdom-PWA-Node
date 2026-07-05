// =============================================================================
// eval-history — pure logic for the History & Markers evaluation layer (DR-0102)
// =============================================================================
// The Quality & Throughput board (DR-0091) reads the system's state NOW; this
// module gives that board its time dimension: per-day series for what people
// did (the sovereign usage_flow_series aggregate, 0078) and for what the
// system did (real ops_commands rows), with HISTORICAL MARKERS — the Decision
// Records and LESSONS-LEARNED incidents whose dates land inside the window —
// pinned to the same timeline, so a change in a number can be read beside the
// change that caused it. Review user behavior to serve; control system
// behavior we own; never confuse the two.
//
// HONESTY RULES (DR-0076), built in like quality-throughput.js:
//   - normalizers degrade to ok:false empties — an absent series renders as
//     "unavailable", never a painted flat line;
//   - ops rows without a parseable created_at contribute nothing;
//   - a record without a parseable date is NOT a marker — it is skipped, not
//     guessed onto a day;
//   - deltas are computed only when both halves of the window carry data.

// --- day math (UTC, matching the 0078 RPC's bucketing) --------------------------

export function dayKeyUtc(input) {
  const t = typeof input === 'number' ? input : Date.parse(String(input || ''));
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString().slice(0, 10);
}

// The window's day keys, oldest -> newest, today (UTC) included — the shared
// x-axis every lane and the marker rail align to.
export function windowDayKeys(days, nowMs) {
  const raw = Number(days);
  const n = Math.max(1, Math.min(Number.isFinite(raw) ? raw : 30, 365));
  const today = new Date(nowMs);
  const keys = [];
  for (let i = n - 1; i >= 0; i--) {
    keys.push(new Date(Date.UTC(
      today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i,
    )).toISOString().slice(0, 10));
  }
  return keys;
}

// --- the people lane (usage_flow_series RPC result) -----------------------------

export function normalizeUsageSeries(raw) {
  const rows = raw && Array.isArray(raw.days) ? raw.days : null;
  if (!rows) return { ok: false, windowDays: 0, days: [], totalViews: 0, activeDays: 0 };
  const days = rows
    .filter((r) => r && typeof r.day === 'string')
    .map((r) => ({ day: r.day, views: Number(r.views) || 0, users: Number(r.users) || 0 }));
  return {
    ok: true,
    windowDays: Number(raw.window_days) || days.length,
    days,
    totalViews: days.reduce((a, d) => a + d.views, 0),
    activeDays: days.filter((d) => d.views > 0).length,
  };
}

// --- the system lane (real ops_commands rows, toCommandShape-d) ------------------

// Bucket the real command rows onto the window's day keys. A row without a
// parseable created_at contributes nothing; a row outside the window is out of
// scope, not an error. ok:false only when the feed itself never arrived (null).
export function opsDaily(commands, dayKeys) {
  if (commands == null) return { ok: false, days: [], total: 0, failed: 0 };
  const byDay = {};
  for (const k of dayKeys) byDay[k] = { day: k, done: 0, error: 0, other: 0 };
  let total = 0;
  let failed = 0;
  for (const c of Array.isArray(commands) ? commands : []) {
    const k = dayKeyUtc(c && c.createdAt);
    if (!k || !byDay[k]) continue;
    total += 1;
    if (c.status === 'done') byDay[k].done += 1;
    else if (c.status === 'error') { byDay[k].error += 1; failed += 1; }
    else byDay[k].other += 1;
  }
  return { ok: true, days: dayKeys.map((k) => byDay[k]), total, failed };
}

// --- the evaluation: older half vs newer half ------------------------------------

// Compare the window's older half to its newer half over one accessor. The
// percentage exists only when the older half measured something (no divide-by-
// zero storytelling); direction is honest either way.
export function halfWindowDelta(days, accessor) {
  const list = Array.isArray(days) ? days : [];
  if (list.length < 2) return { ok: false };
  const mid = Math.floor(list.length / 2);
  const sum = (part) => part.reduce((a, d) => a + (Number(accessor(d)) || 0), 0);
  const prev = sum(list.slice(0, mid));
  const curr = sum(list.slice(list.length - mid));
  return {
    ok: true,
    prev,
    curr,
    pct: prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null,
    direction: curr > prev ? 'up' : curr < prev ? 'down' : 'flat',
  };
}

// --- historical markers (the why, pinned to the timeline) ------------------------

// Decision Records + LESSONS-LEARNED incidents whose dates land inside the
// window become markers on the shared axis. A record without a parseable date
// is skipped — never guessed onto a day. Sorted oldest first, DRs before
// incidents within a day.
export function buildMarkers(drLedger, lessons, dayKeys) {
  const inWindow = new Set(dayKeys);
  const markers = [];
  for (const d of (drLedger && Array.isArray(drLedger.items)) ? drLedger.items : []) {
    const day = /^\d{4}-\d{2}-\d{2}$/.test(d && d.date ? d.date : '') ? d.date : null;
    if (!day || !inWindow.has(day)) continue;
    markers.push({ day, kind: 'dr', id: d.id, title: d.title || d.decision || '' });
  }
  for (const inc of (lessons && Array.isArray(lessons.incidents)) ? lessons.incidents : []) {
    const day = /^\d{4}-\d{2}-\d{2}$/.test(inc && inc.date ? inc.date : '') ? inc.date : null;
    if (!day || !inWindow.has(day)) continue;
    markers.push({ day, kind: 'incident', id: inc.date, title: inc.title || '' });
  }
  const kindRank = { dr: 0, incident: 1 };
  return markers.sort((a, b) => a.day.localeCompare(b.day) || kindRank[a.kind] - kindRank[b.kind]);
}

export function markersByDay(markers) {
  const by = {};
  for (const m of Array.isArray(markers) ? markers : []) {
    (by[m.day] = by[m.day] || []).push(m);
  }
  return by;
}

// --- chart geometry (pure, so the SVG never lies about scale) --------------------

// Bar height for one value against the series max: proportional, with a 1px
// floor for any NONZERO value (a real event must be visible) and a true 0 for
// zero (a quiet day must look quiet). Returns integers for crisp SVG.
export function barHeight(value, max, maxH) {
  const v = Number(value) || 0;
  const m = Number(max) || 0;
  if (v <= 0 || m <= 0) return 0;
  return Math.max(1, Math.round((v / m) * maxH));
}

export function seriesMax(days, accessor) {
  let max = 0;
  for (const d of Array.isArray(days) ? days : []) {
    const v = Number(accessor(d)) || 0;
    if (v > max) max = v;
  }
  return max;
}

// Short human date for axis ends and tooltips: '2026-07-05' -> 'Jul 5'.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function fmtDay(dayKey) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dayKey || ''));
  if (!m) return '';
  return `${MONTHS[parseInt(m[2], 10) - 1]} ${parseInt(m[3], 10)}`;
}
