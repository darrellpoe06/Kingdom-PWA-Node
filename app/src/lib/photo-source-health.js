// =============================================================================
// photo-source-health — honest readout of "did the photo source actually resolve?"
// =============================================================================
// "All data has a path and a purpose." Each Property-Photos tile resolves from a
// real source: the family's Synology Chat archive, mapped to the NAS thumbnail
// the property channel already has. A tile with no thumbnail (`thumb == null`)
// is a photo the NAS has no backed-up preview for — a screenshot, an iPhone /
// WhatsApp image, a download: shared into the chat but never backed up to
// Synology Photos. That is HONEST ("not in backup"), not a bug — but it must be
// VISIBLE and COUNTED, never a silent wall of blank tiles.
//
// This pure summary drives an in-app flag (a KpiDot + a "X of Y from your NAS"
// line) so the populate rate is surfaced and a genuinely broken source (0 of
// many) reads as a problem, not as "no photos." Pure + null-safe so it is unit
// tested (DR-0076 — measure, don't claim).
import { resolveKpiStatus } from './kpi-status.js';

// Summarize a loaded page/set of photos. `photos` is the array the bridge
// returned (each may have a `thumb` data URL or null/undefined).
//   total      — photos listed for this property (the real archive size)
//   resolved   — how many have a usable thumbnail (will actually render)
//   missing    — listed but with no NAS-backed preview ("not in backup")
//   rate       — resolved / loaded, 0..1 (0 when nothing loaded)
//   status     — canonical KPI key, so the dot color can't drift:
//                  idle     -> nothing loaded yet (no data, never a false green)
//                  good     -> most resolved (>= 60%)
//                  attention-> a meaningful share missing (some resolved)
//                  problem  -> loaded photos but NONE resolved (source looks broken)
//   label      — short human line for the readout.
export function summarizePhotoSource(photos, { total } = {}) {
  const list = Array.isArray(photos) ? photos : [];
  const loaded = list.length;
  const resolved = list.filter((p) => p && p.thumb).length;
  const missing = loaded - resolved;
  const archive = typeof total === 'number' && total >= 0 ? total : loaded;
  const rate = loaded ? resolved / loaded : 0;

  let status;
  if (loaded === 0) status = 'idle';
  else if (resolved === 0) status = 'problem';   // listed photos but none resolved
  else if (rate >= 0.6) status = 'good';
  else status = 'attention';                      // a real chunk not in backup

  let label;
  if (loaded === 0) label = 'No photos loaded yet';
  else if (resolved === 0) label = `0 of ${loaded} loaded — none are in your NAS backup`;
  else if (missing === 0) label = `All ${resolved} loaded from your NAS`;
  else label = `${resolved} of ${loaded} loaded from your NAS · ${missing} not in backup`;

  return {
    total: archive, loaded, resolved, missing, rate,
    status,
    color: resolveKpiStatus(status).color,
    label,
  };
}
