// =============================================================================
// snapshot-hydration — the defensive snapshot merge + demo-residue scrub (pure)
// =============================================================================
// Extracted from the monolith shell's loadSavedSnapshot (2026-07-05, the Money
// tabs reconciliation). Two jobs, both pure and unit-tested:
//
//   mergeSnapshotData(base, saved) — the v17 defensive merge: spread the saved
//   snapshot over a BASE world, backfilling every collection a legacy snapshot
//   may lack so old saves keep loading. The base matters: on a public host the
//   mounted world is the Reeves DEMO (anonymous-visitor safety), and merging a
//   signed-in owner's snapshot over THAT let demo values leak into the owner's
//   books wherever the snapshot lacked a key. The 2026-07-05 incident: Big
//   Picture → Money showed the demo's "+$1k" net cash flow (demo inflows/
//   outflows, tagged to the demo-only 'e-family' entity) above the owner's own
//   four entities — every card $0, no tab agreeing with another. Callers now
//   pass the OWNER'S baseline (their seed / empty world), never the demo.
//
//   scrubDemoResidue(data, opts) — removes demo-persona rows that historically
//   leaked into a persisted snapshot (the polluted-snapshot half of the same
//   incident: once the merged demo values were saved back to the device, they
//   became durable "owner data" and re-hydrated forever after). Row-level demo
//   provenance (ids / entity names) drops leaked rows from every list including
//   inflows.salaries + inflows.rentals; a demo meta.releaseLabel is the tell
//   that the NON-provenanced remainder (meta, outflows) is demo residue too, so
//   those reset to the baseline's. A signed-in world never legitimately holds
//   demo rows — demo/picker modes neither persist nor hydrate.
//
// No React, no monolith import (module-boundary rule): the demo/seed provenance
// predicates and baselines live in the shell and are passed in.
// =============================================================================

// mergeSnapshotData — the defensive merge, moved verbatim from the shell's
// loadSavedSnapshot updater (behavior pinned by snapshot-hydration.test.js).
// `base` is the world the snapshot lands on; `saved` is parsed.data.
export function mergeSnapshotData(base, saved) {
  const d = base || {};
  const parsedData = saved || {};
  return {
    ...d,
    ...parsedData,
    // Multi-user Layer A — backfill `visibleTo` on saved entities so
    // existing devices loading old data continue working. Defaults
    // match the seed: owner sees all, family-rollup includes business
    // entities, TLC is christina-only.
    entities: Array.isArray(parsedData.entities)
      ? parsedData.entities.map(e => ({
          ...e,
          visibleTo: Array.isArray(e.visibleTo) && e.visibleTo.length > 0
            ? e.visibleTo
            : (e.id === 'e-tlc' ? ['darrell', 'christina']
               : e.id === 'e-personal' ? ['darrell', 'christina', 'family']
               : ['darrell']),
        }))
      : (d.entities || []),
    events: Array.isArray(parsedData.events) ? parsedData.events : (d.events || []),
    projects: Array.isArray(parsedData.projects) ? parsedData.projects : (d.projects || []),
    subscriptions: Array.isArray(parsedData.subscriptions) ? parsedData.subscriptions : (d.subscriptions || []),
    feedback: Array.isArray(parsedData.feedback) ? parsedData.feedback : (d.feedback || []),
    welcomeDismissed: parsedData.welcomeDismissed === true,
    moduleInterest: parsedData.moduleInterest || d.moduleInterest || {},
    // Round 10 — backfill ITSM fields on old incidents that pre-date the taxonomy.
    incidents: Array.isArray(parsedData.incidents)
      ? parsedData.incidents.map(i => ({
          urgency: 'incident',
          status: i.status || 'resolved',
          dueDate: i.dueDate || i.date || '',
          ...i,
        }))
      : (d.incidents || []),
    recurringObligations: Array.isArray(parsedData.recurringObligations) ? parsedData.recurringObligations : (d.recurringObligations || []),
    scopes: Array.isArray(parsedData.scopes) ? parsedData.scopes : (d.scopes || []),
    // Concerns (0039) — the curated Concerns & Solutions rows. Hydrated
    // defensively so a concern added while signed-out survives a reload
    // (cloud sync covers the signed-in path on top of this).
    concerns: Array.isArray(parsedData.concerns) ? parsedData.concerns : (d.concerns || []),
    practiceInquiries: Array.isArray(parsedData.practiceInquiries) ? parsedData.practiceInquiries : (d.practiceInquiries || []),
    inquiries: Array.isArray(parsedData.inquiries) ? parsedData.inquiries : (d.inquiries || []),
    checkoutIntents: Array.isArray(parsedData.checkoutIntents) ? parsedData.checkoutIntents : (d.checkoutIntents || []),
    userTier: typeof parsedData.userTier === 'string' ? parsedData.userTier : (d.userTier || 'foundation'),
    // v28+ MVP v1.5: defensive merge for new collections so old saves still load.
    capexItems: Array.isArray(parsedData.capexItems) ? parsedData.capexItems : (d.capexItems || []),
    watchlist: Array.isArray(parsedData.watchlist) ? parsedData.watchlist : (d.watchlist || []),
    church: (parsedData.church && typeof parsedData.church === 'object') ? { ...d.church, ...parsedData.church } : d.church,
    prayerRequests: Array.isArray(parsedData.prayerRequests) ? parsedData.prayerRequests : (d.prayerRequests || []),
    skillProfiles: Array.isArray(parsedData.skillProfiles) ? parsedData.skillProfiles : (d.skillProfiles || []),
    voiceOps: (parsedData.voiceOps && typeof parsedData.voiceOps === 'object') ? { ...d.voiceOps, ...parsedData.voiceOps } : d.voiceOps,
  };
}

// scrubDemoResidue — drop demo-persona rows from a REAL (non-demo-mode) world.
//   isDemoRow(row)     — provenance predicate (demo ids + demo entity names).
//   demoReleaseLabels  — the demo personas' meta.releaseLabel values; a match
//                        marks the non-provenanced remainder (meta, outflows)
//                        as residue, reset to the baseline's.
//   baseline           — the owner's clean world (their seed / empty world).
// Watchlist-style string arrays pass through untouched (isDemoRow sees no id).
export function scrubDemoResidue(data, { isDemoRow, demoReleaseLabels = [], baseline = {} } = {}) {
  if (!data || typeof data !== 'object' || typeof isDemoRow !== 'function') return data;
  const keep = (x) => !isDemoRow(x);
  const out = { ...data };
  for (const k of Object.keys(out)) {
    if (Array.isArray(out[k])) {
      const filtered = out[k].filter(keep);
      if (filtered.length !== out[k].length) out[k] = filtered;
    }
  }
  if (out.inflows && typeof out.inflows === 'object') {
    out.inflows = {
      ...out.inflows,
      salaries: Array.isArray(out.inflows.salaries) ? out.inflows.salaries.filter(keep) : out.inflows.salaries,
      rentals: Array.isArray(out.inflows.rentals) ? out.inflows.rentals.filter(keep) : out.inflows.rentals,
    };
  }
  const label = out.meta && out.meta.releaseLabel;
  if (label && demoReleaseLabels.includes(label)) {
    if (baseline.meta) out.meta = { ...baseline.meta };
    if (baseline.outflows) out.outflows = { ...baseline.outflows };
    // The demo-labeled world's inflow lists were demo rows (now filtered out);
    // an emptied list falls back to the baseline's so the money spine stays
    // internally consistent (inflows, outflows, and meta from ONE world).
    // Rows the owner entered themselves (non-demo ids) always survive.
    const bInf = baseline.inflows || {};
    const cur = out.inflows || {};
    out.inflows = {
      ...cur,
      salaries: (Array.isArray(cur.salaries) && cur.salaries.length > 0) ? cur.salaries : (bInf.salaries || []),
      rentals: (Array.isArray(cur.rentals) && cur.rentals.length > 0) ? cur.rentals : (bInf.rentals || []),
    };
  }
  return out;
}
