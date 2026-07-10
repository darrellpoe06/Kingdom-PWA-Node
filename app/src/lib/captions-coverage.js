// =============================================================================
// captions-coverage.js — the REAL captions-coverage metric (Ari's report).
// =============================================================================
// WHY (Darrell 2026-07-09): "we want live perpetual and historical sovereign
// captions... Ari's responsibility and reports should all update to reflect...
// No static data." So captions coverage is a MEASURED number, not a claim: what
// fraction of the service-video corpus actually carries a sovereign, timestamped
// caption track (video_transcripts.vtt with cue_count > 0, migration 0095).
//
// HONESTY (DR-0076): the denominator is the REAL corpus (every service video the
// ledger knows). The numerator counts ONLY videos with a genuine timed track — an
// untimed transcript does NOT count as captioned (captions.js hasCaptions). A
// video with no track is an honest gap, surfaced for the caption pipeline, never
// painted. Pure + dependency-free (Node + browser + test), like video-harvest.js.
// =============================================================================

// captionsCoverage(videoIds, captionsByVideo) -> a coverage snapshot.
//   videoIds        : array of the corpus's video ids (from choir_sermons) — the
//                     denominator. Falsy/empty ids are ignored.
//   captionsByVideo : { [videoId]: { cueCount, source, ... } } — ONLY videos that
//                     carry a real timed track (fetchCaptionsByVideo already
//                     filters to cue_count > 0). Any id present here with
//                     cueCount > 0 counts as captioned.
//
// Returns { total, captioned, gaps, pct, fullyCaptioned, bySource, gapIds }.
export function captionsCoverage(videoIds, captionsByVideo = {}) {
  const ids = [];
  const seen = new Set();
  for (const v of Array.isArray(videoIds) ? videoIds : []) {
    const id = v && typeof v === 'object' ? (v.videoId || v.video_id) : v;
    if (id && !seen.has(id)) { seen.add(id); ids.push(id); }
  }
  const map = captionsByVideo && typeof captionsByVideo === 'object' ? captionsByVideo : {};

  const bySource = {};
  const gapIds = [];
  let captioned = 0;
  for (const id of ids) {
    const track = map[id];
    const cues = track && Number.isFinite(track.cueCount) ? track.cueCount : 0;
    if (track && cues > 0) {
      captioned += 1;
      const src = track.source || 'unknown';
      bySource[src] = (bySource[src] || 0) + 1;
    } else {
      gapIds.push(id);
    }
  }
  const total = ids.length;
  const gaps = total - captioned;
  const pct = total > 0 ? Math.round((captioned / total) * 100) : 0;
  return {
    total,
    captioned,
    gaps,
    pct,
    fullyCaptioned: total > 0 && gaps === 0,
    bySource,
    gapIds,
  };
}

// A one-line human summary for a report cell / Ari's status readout.
export function captionsCoverageLine(cov) {
  if (!cov || !cov.total) return 'No service videos yet — nothing to caption.';
  if (cov.fullyCaptioned) return `All ${cov.total} service videos captioned (sovereign).`;
  return `${cov.captioned}/${cov.total} service videos captioned (${cov.pct}%) — ${cov.gaps} still owe a caption track.`;
}

// Concern threshold: below this, the coverage gap is worth surfacing on the
// concerns/opportunities board (derive-concerns feeds this). A real accessibility
// obligation (WCAG / COMMUNITY-FIRST), so the bar is high, not aspirational.
export const CAPTIONS_COVERAGE_CONCERN_PCT = 90;
