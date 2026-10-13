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

// THE WHOLE-SYSTEM FLOW GRAPH (DR-0622): a dead end, an orphan, a missing
// table, a consumer that does not really read, an unseeded claim, a workflow /
// NAS rider / new table with no place in the graph, or a loop that does not
// close without a named blocker — each fails the build.
const g = m.graph || { findings: [{ gate: 'graph', message: 'the flow graph could not be built' }], summary: {} };
if (g.findings.length > 0) {
  console.error(`✗ interconnect-guard: the whole-system flow graph has ${g.findings.length} finding(s):\n`);
  for (const f of g.findings) console.error(`  - [${f.gate}] ${f.message}`);
  console.error('\nEvery workflow must read something real, write something real, and seed the next (scripts/system-flow-registry.mjs).');
  process.exit(1);
}

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
console.log(`✓ system flow graph: ${g.summary.nodes} nodes, ${g.summary.edges} connections, ${g.summary.measured} measured live, ${g.summary.loopsClosed}/${g.summary.loops} declared loops closed, ${g.summary.workflows} workflows + ${g.summary.riders} NAS riders all placed, 0 findings.`);
