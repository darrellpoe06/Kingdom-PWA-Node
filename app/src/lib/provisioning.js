// provisioning.js — the repeatable, verifiable plan for spinning up a CLEAN,
// isolated instance for a new adopter, plus the evidence-based handoff gate.
//
// This is the machine-readable companion to the operational runbook
// (docs/99-session-notes/2026-06-29-adopter-onboarding-and-provisioning-system.md).
// It is pure data + a pure readiness function so the runbook can be TESTED and
// so a handoff is gated on evidence, never on anyone's word (DR-0076 verification
// doctrine: "no claim without evidence").
//
// Nothing here mutates anything. Provisioning itself runs through the real,
// already-live mechanisms named in each step (the self-serve RPC, the migrations,
// the CI guards). This module describes and verifies that pipeline.

// ---------------------------------------------------------------------------
// THE PLAN — ordered steps, each tied to the REAL mechanism that performs it
// and the REAL check that proves it. `automatable` = no human judgment needed.
// ---------------------------------------------------------------------------
export const PROVISIONING_STEPS = [
  {
    id: 'instance',
    title: 'Create the isolated instance',
    action: 'A new adopter signs in; their own instance is created and they are made its owner.',
    mechanism: 'public.join_default_instance() — slug u-<uid>, owner membership (migrations-auto/0002).',
    verify: 'instance_members has exactly one owner row for this user; instances has the u-<uid> row.',
    automatable: true,
  },
  {
    id: 'isolation',
    title: 'Confirm the cross-tenant wall',
    action: 'Prove this instance cannot read any other instance’s data, and no one else can read it.',
    mechanism: 'RLS predicate user_in_instance(instance_id) on every instance-scoped table.',
    verify: 'Two-identity live no-leak probe: each identity reads ONLY its own rows, ZERO of the other’s; anon gets 42501.',
    automatable: true,
  },
  {
    id: 'grants',
    title: 'Confirm table reachability',
    action: 'Ensure the authenticated role can reach every instance-scoped table (no silent 403s).',
    mechanism: 'ALTER DEFAULT PRIVILEGES ... GRANT ... TO authenticated (migrations-auto/0024).',
    verify: 'scripts/grant-guard.mjs is green (every instance_id table granted; recurrence guard present).',
    automatable: true,
  },
  {
    id: 'seed',
    title: 'Load the aspirational starter',
    action: 'Open the instance on a thriving example for the adopter’s type — never Poe data, never blank.',
    mechanism: 'lib/adopter-templates.js templateFor(type); guarded by adopter-template-guard.mjs.',
    verify: 'The chosen template renders; the no-leak guard is green (no real Poe identifier present).',
    automatable: true,
  },
  {
    id: 'roles',
    title: 'Wire roles and relationships',
    action: 'The owner adds their people with the right access (admin, member, guardian→child, tenant).',
    mechanism: 'lib/relationships.js + guardian-child.js + tenant-portal.js; instance_members.role.',
    verify: 'Each added person resolves to exactly their role’s capability matrix; child/tenant denials hold.',
    automatable: false, // who-gets-what is the owner's judgment call
  },
  {
    id: 'gates',
    title: 'Run the quality gates',
    action: 'Run the full required check before any handoff.',
    mechanism: 'app — lint + vitest (tenancy-guard, grant-guard, consistency, legibility, monolith-budget, no-leak).',
    verify: 'CI is green on the exact SHA being served (quality-proof: green only on the served build).',
    automatable: true,
  },
  {
    id: 'observe',
    title: 'Confirm the loops are live',
    action: 'Confirm the instance’s feedback→concerns loop and health loops are wired and reporting.',
    mechanism: 'lib/loop-health.js assessLoops(); Concerns & Solutions board (feedback-sync).',
    verify: 'No loop reads a dead "never"; each is fresh or honestly "awaiting" a named upstream.',
    automatable: true,
  },
  {
    id: 'handoff',
    title: 'Hand off',
    action: 'Give the adopter their working, verified instance and the onboarding journey.',
    mechanism: 'lib/adopter-onboarding.js ONBOARDING_JOURNEY (productive in hours).',
    verify: 'provisioningReadiness() reports ready:true — every gate has passing evidence.',
    automatable: false, // the human governs the bright line (GOVERNANCE-EXECUTION-ADVISORY)
  },
];

// ---------------------------------------------------------------------------
// THE HANDOFF GATES — what must be PROVEN before an instance is handed over.
// Each maps to a real evidence signal; absence of evidence is "unknown", never
// an assumed pass (DR-0076).
// ---------------------------------------------------------------------------
export const HANDOFF_GATES = [
  { id: 'ownerPresent',     label: 'Owner membership exists',          signal: 'ownerMembershipPresent' },
  { id: 'isolationProbed',  label: 'Two-identity no-leak probe passed', signal: 'noLeakProbePassed' },
  { id: 'grantsGreen',      label: 'Grant guard green',                 signal: 'grantGuardGreen' },
  { id: 'starterChosen',    label: 'Aspirational starter loaded (no Poe data)', signal: 'starterChosenAndClean' },
  { id: 'ciGreen',          label: 'Required check green on served SHA', signal: 'ciGreenOnServedSha' },
  { id: 'loopsLive',        label: 'No dead loops (fresh or awaiting)',  signal: 'noDeadLoops' },
];

/**
 * provisioningReadiness — evidence-based handoff gate.
 *
 * @param {object} signals — measured truths, e.g.
 *   { ownerMembershipPresent: true, noLeakProbePassed: true, grantGuardGreen: true,
 *     starterChosenAndClean: true, ciGreenOnServedSha: true, noDeadLoops: true }
 * A signal that is strictly `true` PASSES. A signal that is strictly `false`
 * FAILS. Anything else (missing / null / undefined) is UNKNOWN — which BLOCKS the
 * handoff exactly like a failure, because we never claim a gate we did not measure.
 *
 * @returns {{ ready:boolean, gates:Array, blocking:Array }}
 */
export function provisioningReadiness(signals = {}) {
  const gates = HANDOFF_GATES.map((g) => {
    const v = signals[g.signal];
    let status;
    if (v === true) status = 'pass';
    else if (v === false) status = 'fail';
    else status = 'unknown';
    return {
      id: g.id,
      label: g.label,
      signal: g.signal,
      status,
      evidence: v === true ? 'measured: true' : v === false ? 'measured: false' : 'no measurement',
    };
  });
  const blocking = gates.filter((g) => g.status !== 'pass');
  return { ready: blocking.length === 0, gates, blocking };
}

/**
 * renewalStatus — the QCHP "is this instance getting BETTER each cycle?" check.
 * Perpetual-improvement is the default (DR-0075): every review cycle should leave
 * the instance better, or carry a stated why.
 *
 * @param {Array<{cycle:string, score:number, why?:string}>} history — newest last.
 * @returns {{ renewing:boolean, latest:object|null, delta:number|null, note:string }}
 */
export function renewalStatus(history = []) {
  const cycles = Array.isArray(history) ? history.filter((h) => h && typeof h.score === 'number') : [];
  if (cycles.length === 0) return { renewing: false, latest: null, delta: null, note: 'No review cycle recorded yet.' };
  const latest = cycles[cycles.length - 1];
  if (cycles.length === 1) return { renewing: true, latest, delta: null, note: 'First cycle — baseline set.' };
  const prev = cycles[cycles.length - 2];
  const delta = latest.score - prev.score;
  if (delta >= 0) return { renewing: true, latest, delta, note: 'Improved or held since last cycle.' };
  // A decline is allowed ONLY with a stated why (DR-0075) — otherwise it is a stall.
  return {
    renewing: false,
    latest,
    delta,
    note: latest.why ? `Declined with a stated why: ${latest.why}` : 'Declined with no stated why — needs attention.',
  };
}
