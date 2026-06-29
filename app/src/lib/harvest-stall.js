// =============================================================================
// harvest-stall — flag a harvest that has STOPPED advancing (can't-fail-the-
// same-way guard for the coverage climb).
// =============================================================================
// Darrell's second complaint (2026-06-29) was CONSISTENCY: "stuck", "inconsistent",
// "stalled partway". The fetcher itself is the cure — incremental, resumable,
// idempotent, bounded — so re-running always advances until done. This module is
// the DETECTOR that proves it did: given a history of coverage snapshots, it says
// whether the harvest is still climbing or has stalled with work left undone.
//
// PURE + dependency-free (Node + browser + tests). The runtime guard
// (scripts/harvest-stall-guard.mjs) and the in-app readout both call detectStall.
// =============================================================================

// One point-in-time reading of the corpus coverage. `at` is an ISO string or ms
// epoch supplied by the caller (this module never reads the clock, so it stays
// deterministic in tests and safe in workflow scripts).
export function harvestSnapshot(summary, at) {
  const s = summary || {};
  return {
    at: at ?? null,
    videos: s.videos || 0,
    avgPct: s.avgPct || 0,
    fullyHarvested: s.fullyHarvested || 0,
    orphans: s.orphans || 0,
    // How many videos have their transcript harvest complete — the lever this
    // whole change pulls. A stall with transcripts un-fetched = "go run the fetcher".
    transcribed: (s.byType && s.byType.transcript && s.byType.transcript.complete) || 0,
  };
}

// Is the harvest "done enough" that not advancing is fine (not a stall)? Done =
// no orphans AND average coverage at/above the floor. Default floor 60% is the
// honest heuristic ceiling (4 complete + 4 partial of 9 ≈ 67%); a deeper LLM pass
// lifts it further, but below the floor with work outstanding is a real stall.
function isDone(snap, floorPct) {
  return snap.orphans === 0 && snap.avgPct >= floorPct;
}

// Detect a stall across a history of snapshots (oldest -> newest).
//   opts.floorPct   — coverage at/above which "not moving" is acceptable (def 60)
//   opts.minPoints  — snapshots required before a stall can be called (def 3)
//   opts.epsilonPct — the smallest avgPct gain that counts as progress (def 1)
// Returns { stalled, reason, latestPct, priorPct, points }.
export function detectStall(history, opts = {}) {
  const floorPct = opts.floorPct ?? 60;
  const minPoints = opts.minPoints ?? 3;
  const epsilonPct = opts.epsilonPct ?? 1;

  const h = (history || []).filter(Boolean);
  const latest = h[h.length - 1] || null;

  if (!latest || latest.videos === 0) {
    return { stalled: false, reason: 'no-corpus', latestPct: 0, priorPct: 0, points: h.length };
  }
  if (isDone(latest, floorPct)) {
    return { stalled: false, reason: 'done', latestPct: latest.avgPct, priorPct: latest.avgPct, points: h.length };
  }
  if (h.length < minPoints) {
    // Not enough history to call it — assume it's still working (give it room).
    return { stalled: false, reason: 'warming-up', latestPct: latest.avgPct, priorPct: h[0] ? h[0].avgPct : 0, points: h.length };
  }

  // Compare the latest reading against the one `minPoints-1` snapshots back: if the
  // average coverage hasn't gained at least epsilon over that window while work is
  // still outstanding, the harvest has stalled.
  const prior = h[h.length - minPoints];
  const gain = latest.avgPct - prior.avgPct;
  if (gain < epsilonPct) {
    const why = latest.transcribed < latest.videos
      ? `transcripts un-fetched for ${latest.videos - latest.transcribed} of ${latest.videos} videos — run the YouTube-caption fetcher`
      : 'coverage flat with harvests still owed — check the loader / extractors';
    return {
      stalled: true,
      reason: why,
      latestPct: latest.avgPct,
      priorPct: prior.avgPct,
      points: h.length,
    };
  }
  return { stalled: false, reason: 'advancing', latestPct: latest.avgPct, priorPct: prior.avgPct, points: h.length };
}
