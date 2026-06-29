// =============================================================================
// interconnect-loops — pure render logic for the in-app "Interconnection loops"
// proof (the build-time __INTERCONNECT_LOOPS__ manifest).
// =============================================================================
// Turns the file-verified manifest (scripts/interconnect-manifest.mjs, baked at
// build) into render-ready rows WITHOUT painting a green it didn't earn
// (Verification Doctrine, DR-0076):
//
//   - a 'live' loop reads GOOD only when its wiring is verified present AND not
//     broken (a destination still reads its live source on disk);
//   - a 'building' loop reads IDLE/slate "building" with its honest `awaiting`
//     why — never green, because the live wiring isn't there yet;
//   - ANY loop whose declared wiring went missing reads PROBLEM "went static" —
//     exactly the regression this surface exists to show.
//
// Pure + null-safe so it unit-tests without a browser and degrades to an honest
// empty list when the define is missing (the degraded-build case).
// =============================================================================

// Normalize the baked manifest into a safe shape.
export function normalizeInterconnect(raw) {
  const m = raw && typeof raw === 'object' ? raw : {};
  const loops = Array.isArray(m.loops) ? m.loops : [];
  const norm = loops.map((l) => ({
    id: String((l && l.id) || ''),
    name: String((l && l.name) || ''),
    status: String((l && l.status) || 'building'),
    from: String((l && l.from) || ''),
    to: String((l && l.to) || ''),
    proves: String((l && l.proves) || ''),
    awaiting: l && l.awaiting ? String(l.awaiting) : null,
    wired: l && l.wired === true,
    broken: l && l.broken === true,
    missing: Array.isArray(l && l.missing) ? l.missing : [],
  }));
  const live = norm.filter((l) => l.status === 'live');
  return {
    ok: norm.length > 0,
    loops: norm,
    summary: {
      total: norm.length,
      live: live.length,
      liveWired: live.filter((l) => l.wired && !l.broken).length,
      building: norm.filter((l) => l.status === 'building').length,
      broken: norm.filter((l) => l.broken).length,
    },
  };
}

// Per-loop KPI state for the proof row. Broken always wins (it's the regression
// signal). A live+wired loop is the only green; building is honest slate/idle.
export function loopRowStatus(loop) {
  const l = loop || {};
  if (l.broken) return { status: 'problem', label: 'went static — re-wire' };
  if (l.status === 'live' && l.wired) return { status: 'good', label: 'wired · flows live' };
  if (l.status === 'building') return { status: 'idle', label: 'building' };
  // A 'live' loop that isn't wired but isn't flagged broken (shouldn't happen if
  // the manifest is consistent) is surfaced as attention, never green.
  return { status: 'attention', label: 'wiring unverified' };
}

// One-line headline for the section, honest about the split.
export function interconnectHeadline(summary) {
  const s = summary || {};
  const live = s.live || 0;
  const wired = s.liveWired || 0;
  const building = s.building || 0;
  const broken = s.broken || 0;
  if (broken > 0) return `${broken} interconnection loop${broken === 1 ? '' : 's'} went static — a destination stopped reading its live source.`;
  if (live === 0) return 'No interconnection loops measured in this build.';
  return `${wired}/${live} interconnected loops moving live data${building ? `, ${building} still building` : ''}.`;
}
