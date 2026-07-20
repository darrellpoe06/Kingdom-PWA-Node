// =============================================================================
// learn-engagement — feedback-tuned for EVERY age (Darrell 2026-06-16, item 5)
// =============================================================================
// "Wire the continuous-feedback reel to track engagement BY AGE BAND and fine-tune
// pacing/format from real use — improving it for one age improves the library for
// all, continuously."
//
// This is the data plumbing for that loop. The Learn surface emits real engagement
// SIGNALS (a learner started a week, finished a paced segment, passed/failed a
// check, completed, dropped off) tagged with the AGE BAND in use. The signals ride
// the SAME cross-tenant feedback pipe everything else uses (addFeedback, area
// 'church-learn'), so they reach the Governor's review with no new backend. The
// Governor view aggregates them BY AGE BAND — so the developmental pacing defaults
// in learn-framework (segment length, break cadence, content-before-check) can be
// TUNED from what actually held each age's attention. One shared library; every
// course's pacing improves from every learner's real use.
//
// NOTHING here is painted (DR-0076): an empty feed aggregates to honest zeros, and
// the parser only ever reports what was really tagged. No engagement is invented.
// Signals carry NO personal content beyond an optional first name the learner is
// already attaching elsewhere — they are pacing telemetry, not surveillance.
// =============================================================================
import { AGE_BANDS, normalizeAgeBand } from './learn-framework.js';

export const LEARN_ENGAGEMENT_TAG = '[Learn engagement]';

// The signals the Learn surface can emit. Kept small and meaningful — each maps to
// a real moment in the paced lesson. `weight` lets the aggregate compute a simple
// engagement score (finishing counts more than starting; dropping is negative).
export const ENGAGEMENT_SIGNALS = [
  { id: 'started', label: 'Started a week', weight: 1 },
  { id: 'segment-complete', label: 'Finished a paced segment', weight: 1 },
  { id: 'quiz-passed', label: 'Passed a check', weight: 2 },
  { id: 'quiz-failed', label: 'Missed a check', weight: 0 },
  { id: 'completed', label: 'Completed a week', weight: 3 },
  { id: 'dropped', label: 'Dropped off mid-segment', weight: -1 },
];

export function isEngagementSignal(id) {
  return ENGAGEMENT_SIGNALS.some((s) => s.id === id);
}

// Compose the tagged feedback text for one engagement signal. The band + signal +
// course + module are encoded in a stable `key=value` form so the aggregate can
// parse them back out of the merged local + Supabase feedback stream (the same
// round-trip the class roster survives). Human-readable tail for the Governor's eye.
export function engagementFeedbackText({ courseKey, courseTitle, moduleId, ageBand, signal, who } = {}) {
  const band = normalizeAgeBand(ageBand);
  const sig = isEngagementSignal(signal) ? signal : 'started';
  const name = (who || 'A learner').toString().trim() || 'A learner';
  const sigLabel = (ENGAGEMENT_SIGNALS.find((s) => s.id === sig) || {}).label || sig;
  return `${LEARN_ENGAGEMENT_TAG} band=${band} signal=${sig} course=${courseKey || 'unknown'} module=${moduleId || 'none'} — ${name}: ${sigLabel} in "${courseTitle || courseKey || 'a course'}".`;
}

// Parse one feedback row back into an engagement record, or null if it isn't one.
export function parseEngagement(item) {
  const text = item && typeof item.text === 'string' ? item.text : '';
  if (!text.startsWith(LEARN_ENGAGEMENT_TAG)) return null;
  const get = (k) => {
    const m = text.match(new RegExp(`${k}=([^\\s]+)`));
    return m ? m[1] : null;
  };
  const band = get('band');
  const signal = get('signal');
  if (!band || !signal) return null;
  return {
    id: item.id || null,
    band: normalizeAgeBand(band),
    signal,
    course: get('course'),
    module: get('module'),
    at: item.createdAt || item.submittedAt || null,
  };
}

// Aggregate the whole feedback stream into per-age-band engagement, so the Governor
// can SEE which age the pacing is serving — and tune the framework defaults from it.
// Returns { byBand: { [bandId]: { counts, total, score } }, totals }. Real counts
// from real rows; an empty feed yields honest zeros for every band.
export function aggregateEngagementByAge(items = []) {
  const blank = () => {
    const counts = {};
    for (const s of ENGAGEMENT_SIGNALS) counts[s.id] = 0;
    return { counts, total: 0, score: 0 };
  };
  const byBand = {};
  for (const b of AGE_BANDS) byBand[b.id] = blank();
  let total = 0;
  for (const it of (items || [])) {
    const rec = parseEngagement(it);
    if (!rec) continue;
    const bucket = byBand[rec.band] || (byBand[rec.band] = blank());
    if (rec.signal in bucket.counts) bucket.counts[rec.signal] += 1;
    else bucket.counts[rec.signal] = 1;
    const w = (ENGAGEMENT_SIGNALS.find((s) => s.id === rec.signal) || {}).weight || 0;
    bucket.score += w;
    bucket.total += 1;
    total += 1;
  }
  return { byBand, totals: { records: total } };
}

// Rows for the "Engagement by age" readout — ONE per age band, ALWAYS all of them.
// "Engagement by age does not explain all levels, leaves out teen" (Darrell 2026-07-19):
// a band with zero signals must still show (quiet=true → "no signals yet"), never be
// dropped — an invisible band hides a gap in the pacing data instead of naming it.
// Honest zeros (DR-0076), not omitted rows. Order follows AGE_BANDS (child → senior).
export function engagementRowsByAge(agg) {
  const byBand = (agg && agg.byBand) || {};
  return AGE_BANDS.map((b) => {
    const row = byBand[b.id] || { counts: {}, total: 0, score: 0 };
    const total = row.total || 0;
    return {
      id: b.id,
      label: b.label,
      range: b.range,
      total,
      score: row.score || 0,
      completed: (row.counts && row.counts['completed']) || 0,
      quiet: total === 0,
    };
  });
}
