// =============================================================================
// tailnet-key-incident.mjs — a refused tailnet key files ONE loud observation
// =============================================================================
// WHY THIS EXISTS (2026-10-29, measured, not theorised).
//
// 64 workflows in this repository join the tailnet with TS_AUTHKEY. On
// 2026-10-28 the key began answering `backend error: invalid key`, and every
// one of them went red-and-SILENT. Two consequences, both measured:
//
//   1. The isolation proofs stopped, and the reason had nothing to do with the
//      road that was shut. db-migrate's `Dispatch the isolation proofs` carried
//      `if: success()`, which reads the JOB's status -- and the job is red
//      whenever the SOVEREIGN replay fails, however well the hosted half went.
//      Measured on run 40795511412's step conclusions: `Apply migrations` and
//      `Witness the LIVE definitions` both SUCCEEDED, the replay failed, and
//      the dispatch read `skipped`. Last isolation run: 2026-10-27 19:35.
//      Twenty-nine hours of DR-0060-class proofs not running, because a shut
//      road on one database switched off the proofs for the other.
//   2. node-availability.yml -- the witness built for exactly the question
//      "how often does this happen" -- files its rolling incident only when
//      its PROBE returns 1. A refused key fails the join step BEFORE the probe
//      runs, so `steps.probe.outputs.code` is empty and the incident step is
//      skipped. The one instrument aimed at tailnet outages records nothing on
//      the outage that matters most.
//
// So the outage was loud in the Actions tab and absent from every ledger. That
// is DR-0125's exact lesson applied one layer down: unknown freshness must
// never READ as fresh, and a red check nobody queries is not an observation.
//
// WHAT THIS IS *NOT*, because the first draft of this file said it and it was
// wrong (corrected 2026-10-29 before merge). It is NOT a claim that the live
// database is behind. DR-1269 built the replay a SECOND ROAD on 2026-10-28 --
// `infra/nas-supabase/replay-on-clock.sh`, registered `enabled` in
// infra/nas-loops/services.json, active by merge -- which runs the SAME
// replay_migrations.sh against the SAME ledger on the NAS's own clock, needing
// no runner and no tailnet, with a shared lock so the two roads never collide.
// A refused key shuts the RUNNER's road; whether a migration has landed is a
// question only the NAS's own `/volume1/PoeTech/sovereign-replay/status.json`
// answers, and `loops-health.yml` is the reader. The first draft inferred the
// live schema from db-migrate's last SUCCESSFUL run -- a lane's record read as
// the database's state, which is the false-measurement class REPOINT-ARMED
// warns about in capitals. So the body below points a reader AT that ledger
// instead of telling them what it would have said.
//
// ONE ROAD, CALLED BY MANY LANES. Every health workflow in this repo inlines
// its own `gh issue list || gh issue create` block. A 65th copy pasted into
// each tailnet caller would be 64 things to keep in step -- the drift this
// house has now paid for three times (DR-0621, DR-1151, DR-1152). This is the
// one place that knows how to say "the key is refused", and callers pass what
// they measured.
//
// THE BRAKES (CLAUDE.md -- budget + lock; the deterministic class, DR-0248).
//   * BUDGET -- a COOLDOWN. 64 workflows times many fires a day would bury the
//     ledger it is meant to make readable, so an entry is written at most once
//     per cooldown window (default 6 h) and every later caller inside that
//     window is a deliberate no-op that says so. The first caller in a window
//     always writes.
//   * LOCK -- one rolling issue, found by its exact title. Never a second
//     issue while one is open, so the ledger is a thread rather than a drift
//     of duplicates.
//   * No kill-switch of its own: it writes one comment and exits. There is no
//     loop here to run away, and the stop-path is closing the issue.
//
// It NEVER prints key material. The reason text a caller passes comes from a
// tool's own stderr and may name a key ID (Tailscale prints one in `invalid
// key: <id>`); the secret half never appears in a join failure, and the body
// is quoted verbatim rather than re-typed (DR-0076 section 4) so a human reads
// what the tool actually said.
// =============================================================================

export const TITLE = 'Tailnet key refused — the NAS-side witnesses are blind';
export const COOLDOWN_HOURS = 6;

/**
 * Decide whether to write, and what. Pure: no I/O, so the decision is testable
 * without a network or a `gh` on PATH.
 *
 * @param {{issue: {number: number, lastActivityAt: string}|null, now: Date, cooldownHours?: number}} state
 * @returns {{action: 'create'|'comment'|'skip', reason: string, hoursSince?: number}}
 */
export function decide({ issue, now, cooldownHours = COOLDOWN_HOURS }) {
  if (!issue) return { action: 'create', reason: 'no open entry for this outage yet' };
  const last = Date.parse(issue.lastActivityAt);
  if (!Number.isFinite(last)) {
    // Never infer "recent" from a reading we could not make (DR-0076 §8). An
    // unreadable timestamp falls through to writing, because a missing entry
    // is the failure this exists to prevent and a duplicate comment is not.
    return { action: 'comment', reason: 'the entry\'s last activity could not be read, so it is treated as stale' };
  }
  const hoursSince = (now.getTime() - last) / 3_600_000;
  if (hoursSince < cooldownHours) {
    return {
      action: 'skip',
      reason: `entry #${issue.number} was written ${hoursSince.toFixed(1)} h ago, inside the ${cooldownHours} h window`,
      hoursSince,
    };
  }
  return { action: 'comment', reason: `entry #${issue.number} last moved ${hoursSince.toFixed(1)} h ago`, hoursSince };
}

/**
 * The body a caller's observation becomes. Quotes the tool's own words.
 *
 * @param {{workflow: string, runUrl: string, measured: string, at: string}} o
 */
export function body({ workflow, runUrl, measured, at }) {
  const said = String(measured || '').trim() || '(the caller passed no measured text)';
  return [
    'A workflow could not join the tailnet, so everything it reaches on the NAS went unmeasured.',
    '',
    `- lane: **${workflow}**`,
    `- measured at: ${at}`,
    `- run: ${runUrl}`,
    '',
    'What the tool itself said:',
    '',
    '```',
    said,
    '```',
    '',
    'This shuts the **runner\'s** road to the NAS. It does not say the live database is behind:',
    'DR-1269 gave the replay a second road, `replay-on-clock.sh`, which applies the mirror\'s',
    'migrations on the NAS\'s own clock against the same ledger. **Nor does it say the live database',
    'is current** — that question is answered only by the box\'s own',
    '`/volume1/PoeTech/sovereign-replay/status.json` (`ok`, `applied`, `ledger`, `frontier`, `head`),',
    'which `loops-health.yml` reads over this same closed road. So while this holds, the live schema',
    'state is **unknown from CI**, and unknown never reads as current (DR-0076 §8).',
    '',
    'The one value that closes this: a fresh Tailscale auth key (**Reusable + Ephemeral**) stored as',
    'the repo secret `TS_AUTHKEY`. 64 workflows read it.',
    '',
    '---',
    '_Generated by [Claude Code](https://claude.ai/code)_',
  ].join('\n');
}

// --- the thin CLI -----------------------------------------------------------
// Called as: node scripts/tailnet-key-incident.mjs --workflow <name> --run <url>
//            --measured-file <path>
// `gh` does the writing, so the caller's GH_TOKEN governs; nothing here holds a
// credential of its own.

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());

if (isMain) {
  const { execFileSync } = await import('node:child_process');
  const { readFileSync } = await import('node:fs');

  const arg = (name, dflt = '') => {
    const i = process.argv.indexOf(`--${name}`);
    return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
  };

  const workflow = arg('workflow', process.env.GITHUB_WORKFLOW || 'unknown lane');
  const runUrl = arg('run', '(no run url passed)');
  const file = arg('measured-file');
  let measured = '';
  if (file) {
    try { measured = readFileSync(file, 'utf8'); } catch { measured = ''; }
  }

  const gh = (args, input) => execFileSync('gh', args, {
    encoding: 'utf8',
    input,
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  let issue = null;
  try {
    const found = gh(['issue', 'list', '--label', 'incident', '--state', 'open',
      '--search', `${TITLE} in:title`, '--json', 'number,title,updatedAt', '--limit', '20']);
    const rows = JSON.parse(found || '[]');
    const exact = rows.find((r) => r.title === TITLE);
    if (exact) issue = { number: exact.number, lastActivityAt: exact.updatedAt };
  } catch {
    // An unreadable listing must not read as "no outage recorded": fall through
    // to create, and a duplicate is the cheaper error than silence.
    issue = null;
  }

  const verdict = decide({ issue, now: new Date() });
  const text = body({
    workflow,
    runUrl,
    measured,
    at: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
  });

  if (verdict.action === 'skip') {
    console.log(`tailnet-key incident: not written — ${verdict.reason}`);
    process.exit(0);
  }
  try {
    if (verdict.action === 'create') {
      const out = gh(['issue', 'create', '--title', TITLE, '--label', 'incident', '--body-file', '-'], text);
      console.log(`tailnet-key incident FILED (${verdict.reason}): ${out.trim()}`);
    } else {
      gh(['issue', 'comment', String(issue.number), '--body-file', '-'], text);
      console.log(`tailnet-key incident APPENDED to #${issue.number} (${verdict.reason})`);
    }
  } catch (e) {
    // The escalation failing must never mask the outage that called it. Say so
    // and exit 0: the caller's own red status is still the primary signal.
    console.log(`tailnet-key incident could not be written (${e && e.message}); the lane's own failure stands as the signal.`);
  }
}
