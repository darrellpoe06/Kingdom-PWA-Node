// =============================================================================
// interconnect-guard — fail the build if a declared interconnection loop went
// static (its live wiring was removed). Proven-to-catch regression guard.
// =============================================================================
// Darrell, 2026-06-29: "add a regression guard so a loop can't silently go
// static." This is that guard. It re-runs the file-verified interconnect manifest
// and exits non-zero if ANY loop is `broken` — i.e. a loop declared LIVE lost the
// wiring token that proves a destination still reads its live source. Wired into
// CI alongside module-boundary-guard; also asserted by a vitest (proven-to-catch).
// =============================================================================
import { buildInterconnectManifest } from './interconnect-manifest.mjs';

const m = buildInterconnectManifest();
const broken = m.loops.filter((l) => l.broken);

if (broken.length > 0) {
  console.error('✗ interconnect-guard: an interconnection loop went STATIC (live wiring removed):\n');
  for (const l of broken) {
    console.error(`  - ${l.name} [${l.status}]`);
    for (const miss of l.missing) console.error(`      missing ${miss}`);
  }
  console.error('\nA destination stopped reading its live source. Re-wire it, or — if the change is intentional — update scripts/interconnect-manifest.mjs (and say why).');
  process.exit(1);
}

console.log(`✓ interconnect-guard: ${m.summary.liveWired}/${m.summary.live} live loops wired, ${m.summary.building} building (declared), 0 broken.`);
