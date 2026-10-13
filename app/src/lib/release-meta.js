// =============================================================================
// release-meta — the footer names the app's release, never the demo persona.
// =============================================================================
// 2026-09-24 (the Books → Plan end-to-end review). Darrell's screenshot showed
// a real family plan — rows from family_plans under RLS — with the shell's
// footer reading "SAMPLE · FAMILY OF 4" beneath it. The label is
// data.meta.releaseLabel; on a public host the shell starts from the demo
// object, a device that saved its snapshot from that state saved the demo's
// meta with it, and every later hydration merged that saved meta back over
// the real data. A surface must say the truth about itself (DR-0239): the
// release fields describe the APP, so they are always taken from the seed's
// meta; every other meta field (lastUpdated, bufferTarget, …) is the
// family's own and is kept from the saved snapshot.
// =============================================================================

export const RELEASE_FIELDS = Object.freeze(['releaseLabel', 'releaseNote', 'appVersion']);

/** The saved meta with the release fields replaced by the app's own. */
export function withReleaseMeta(savedMeta, seedMeta) {
  const base = savedMeta && typeof savedMeta === 'object' ? savedMeta : {};
  const seed = seedMeta && typeof seedMeta === 'object' ? seedMeta : {};
  const out = { ...base };
  for (const k of RELEASE_FIELDS) if (seed[k] != null) out[k] = seed[k];
  return out;
}
