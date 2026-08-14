// =============================================================================
// pipeline-availability — which declared pipeline devices are actually up
// =============================================================================
// Darrell 2026-08-14: "we need to come up with obstacles to turning off anything
// or device we use for this pipeline including creating master accounts on each
// cpu and using administrative procedures etc..."
//
// Every obstacle in infra/device-availability/RUNBOOK.md is a CLAIM until
// something watches. This is the pure core of the watching: given the declared
// fleet (infra/device-availability/pipeline-nodes.json) and a set of probe
// results, decide what is an INCIDENT, what is NORMAL, and what is UNKNOWN.
//
// THREE RULES THAT KEEP THIS WITNESS WORTH LISTENING TO:
//
//  1. UNKNOWN IS NEVER UP (DR-0076). A probe that did not run, timed out
//     ambiguously, or returned nothing is `unknown` — never quietly counted as
//     reachable. The 2026-07-08 lesson (DR-0125) was a probe that MEASURED an
//     outage and then died before filing it; silence is not health.
//
//  2. A NODE THAT IS ALLOWED TO BE OFF IS NOT AN INCIDENT. livestream-main-pc
//     feeds the NovaStar -> wall, and DR-0012 gives live/creative work ABSOLUTE
//     priority over AI jobs. An operator powering it down is correct behaviour.
//     It is declared expected_always_on:false and its darkness is reported as
//     `normal`. A witness that cries wolf on legitimate behaviour gets muted,
//     and then it protects nothing.
//
//  3. A NODE NOBODY DECLARED IS NOT SILENTLY TRUSTED. A probe result for a slug
//     absent from the manifest is surfaced as `undeclared` rather than folded
//     into the healthy count — that is how a box quietly joining the pipeline
//     gets noticed instead of assumed.
//
// PURE (no React, no I/O) so the gate can prove its derivations.
// =============================================================================

/** Probe states a caller may report. Anything else is coerced to 'unknown'. */
export const PROBE_STATES = ['up', 'down', 'unknown'];

export function normalizeProbeState(raw) {
  const v = String(raw == null ? '' : raw).toLowerCase().trim();
  return PROBE_STATES.includes(v) ? v : 'unknown';
}

/** The declared nodes, defensively parsed. A malformed manifest yields []. */
export function declaredNodes(manifest) {
  const list = manifest && Array.isArray(manifest.nodes) ? manifest.nodes : [];
  return list
    .filter((n) => n && typeof n.slug === 'string' && n.slug.trim())
    .map((n) => ({
      slug: n.slug.trim(),
      role: typeof n.role === 'string' ? n.role : 'unknown',
      required: n.required === true,
      expectedAlwaysOn: n.expected_always_on === true,
      tailnetIp: typeof n.tailnet_ip === 'string' ? n.tailnet_ip : null,
    }));
}

/**
 * Classify one declared node against its probe result.
 *
 * incident   — declared always-on, measured down. Someone or something took it.
 * normal     — up, OR down on a node allowed to be down.
 * unverified — we did not get a usable reading. Never counted as healthy, and
 *              never counted as an incident either: not knowing is its own
 *              state, and calling it either would be a lie in one direction.
 */
export function classifyNode(node, state) {
  const probe = normalizeProbeState(state);
  if (probe === 'up') {
    return { slug: node.slug, probe, verdict: 'normal', reason: 'reachable' };
  }
  if (probe === 'unknown') {
    return {
      slug: node.slug,
      probe,
      verdict: 'unverified',
      reason: 'no usable reading — unknown freshness never reads as up (DR-0076)',
    };
  }
  if (!node.expectedAlwaysOn) {
    return {
      slug: node.slug,
      probe,
      verdict: 'normal',
      reason: node.role === 'gpu-presenter'
        ? 'dark, and allowed to be — live/creative work has absolute priority over AI jobs (DR-0012)'
        : 'dark, and not declared always-on',
    };
  }
  return {
    slug: node.slug,
    probe,
    verdict: 'incident',
    reason: node.required
      ? 'declared always-on AND required — the pipeline is degraded while this is dark'
      : 'declared always-on and measured dark',
  };
}

/**
 * The whole fleet reading.
 * `probes` is { slug: 'up'|'down'|'unknown' }. A declared node with no entry is
 * `unknown` by omission — the probe not running is itself a finding.
 */
export function assessFleet(manifest, probes) {
  const nodes = declaredNodes(manifest);
  const seen = probes && typeof probes === 'object' ? probes : {};

  const results = nodes.map((n) => classifyNode(n, seen[n.slug]));

  const undeclared = Object.keys(seen)
    .filter((slug) => !nodes.some((n) => n.slug === slug))
    .map((slug) => ({ slug, probe: normalizeProbeState(seen[slug]), verdict: 'undeclared' }));

  const incidents = results.filter((r) => r.verdict === 'incident');
  const unverified = results.filter((r) => r.verdict === 'unverified');

  return {
    results,
    undeclared,
    incidents,
    unverified,
    totals: {
      declared: nodes.length,
      up: results.filter((r) => r.probe === 'up').length,
      down: results.filter((r) => r.probe === 'down').length,
      unknown: unverified.length,
      incidents: incidents.length,
      undeclared: undeclared.length,
    },
    // The witness fails ONLY on a real incident. Unverified is loud in the
    // report but does not cry wolf — a runner that could not join the tailnet
    // is a runner problem, not a church-device problem, and conflating them is
    // how a gate earns the mute it later dies of.
    healthy: incidents.length === 0,
  };
}

/** A one-line-per-node report a human can read without opening the JSON. */
export function formatFleetReport(assessment) {
  if (!assessment || !Array.isArray(assessment.results)) return 'no assessment';
  const icon = { normal: 'ok  ', incident: 'DARK', unverified: '??  ', undeclared: 'NEW ' };
  const lines = assessment.results
    .concat(assessment.undeclared.map((u) => ({ ...u, reason: 'probed but not in pipeline-nodes.json' })))
    .map((r) => `${icon[r.verdict] || '?   '} ${r.slug.padEnd(20)} ${r.probe.padEnd(8)} ${r.reason || ''}`.trimEnd());
  const t = assessment.totals;
  lines.push('');
  lines.push(`declared ${t.declared} | up ${t.up} | down ${t.down} | unknown ${t.unknown} | incidents ${t.incidents}`);
  return lines.join('\n');
}
