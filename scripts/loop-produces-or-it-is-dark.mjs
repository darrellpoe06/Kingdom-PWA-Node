#!/usr/bin/env node
// =============================================================================
// loop-produces-or-it-is-dark — a loop that ships nothing is not healthy,
// however ready it is.
// =============================================================================
// WHY, MEASURED ON OUR OWN WITNESS, 2026-10-26. Fifteen of Darrell's lesson
// rows sat in the in-app queue for up to 102 hours. Every one of them reached
// the NAS builder, was claimed, grouped, had its verses fetched, was written,
// was gated -- and FAILED the gate, inside two seconds, twice each. Nothing
// shipped for four days.
//
// `lesson-builder-health.yml` ran every one of those days and passed every
// time. Its last run before this was read printed, in as many words:
//
//     verdict passed -- nothing to diagnose
//
// It was not lying about what it measured. It asks the builder for
// `lesson_builder.py --status`, which reports the unit, the kill state, each
// writer's readiness and the push credential -- and it judges exactly those:
// unit active, not stopped, A WRITER IS READY, credential present. All five
// were true the whole time. `--status` has no outcome field to report (read
// at infra/nas-lesson-builder/lesson_builder.py: `--status` prints
// `readiness()` plus `kill`, and nothing else), so the witness could not have
// known, and the one thing a reader takes "lesson-builder loop: PASS" to mean
// -- that teachings are becoming lessons -- was the one thing unmeasured.
//
// THE STALE ALARM DID RING, five times on the oldest row (DR-0771). So two
// witnesses disagreed for four days and the one wired to the `incident` label
// said green. A green check that does not mean what its reader takes it to
// mean is the anti-theater failure DR-0076 §3 names: a gate that always
// passes is itself a lie.
//
// READINESS IS NOT PRODUCTION. That is the whole of this file. A kitchen with
// the gas on, the pans out and the staff standing ready is not serving
// dinner, and saying "ready" when no plate has left in four days is the
// report that lets it go on.
//
// SO THE OUTCOME IS JUDGED, and kept apart from readiness:
//
//   HEALTHY        (0) — ready, and either nothing is waiting past the alarm
//                        or something shipped inside the window.
//   DARK_IN_EFFECT (1) — READY AND PRODUCING NOTHING: rows waiting past the
//                        stale alarm and nothing shipped. This is the state
//                        that reported PASS for four days.
//   UNKNOWN        (2) — a judged number could not be read. NEVER healthy: a
//                        queue nobody could read is not an empty queue
//                        (DR-1186 / DR-0125, the same rule as the deploy
//                        proof in DR-1210).
//   NOT_READY      (3) — no writer is ready. The existing problem class, kept
//                        separate so "it cannot build" and "it builds and
//                        every build fails" never read as one thing: they have
//                        different cures.

export const HEALTHY = 'healthy';
export const DARK_IN_EFFECT = 'dark-in-effect';
export const UNKNOWN = 'unknown';
export const NOT_READY = 'not-ready';

/** The stale alarm's threshold (DR-0771), in hours. */
export const ALARM_HOURS = 4;

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/**
 * Pure. Given what the witness measured, what do we actually know?
 *
 * Takes readiness and the outcome numbers separately and ON PURPOSE: the bug
 * this exists for is readiness standing in for the outcome, so a caller
 * cannot pass "ready" and have it answer for production.
 */
export function verdictOf({
  writerReady, waiting, oldestWaitHours, shippedLastDay, alarmHours = ALARM_HOURS,
} = {}) {
  if (writerReady === false) {
    return { verdict: NOT_READY, why: 'no writer is ready, so the loop cannot build at all' };
  }
  if (writerReady !== true) {
    return { verdict: UNKNOWN, why: 'whether a writer is ready could not be read' };
  }
  const n = num(waiting);
  const shipped = num(shippedLastDay);
  if (n === null || shipped === null) {
    return {
      verdict: UNKNOWN,
      why: 'the queue could not be read, so nothing is being said about whether the loop produces'
        + ' — an unread queue is NOT an empty one',
    };
  }
  // Nothing waiting is the one case where silence is genuinely fine: there was
  // nothing to ship. Measured against the queue, never assumed from readiness.
  if (n === 0) {
    return { verdict: HEALTHY, why: 'nothing is waiting, so nothing is owed' };
  }
  const oldest = num(oldestWaitHours);
  if (oldest === null) {
    return { verdict: UNKNOWN, why: `${n} row(s) are waiting but how long could not be read` };
  }
  if (oldest < alarmHours) {
    return {
      verdict: HEALTHY,
      why: `${n} row(s) waiting, the oldest ${oldest}h, still inside the ${alarmHours}h alarm`,
    };
  }
  if (shipped > 0) {
    return {
      verdict: HEALTHY,
      why: `${n} row(s) waiting (oldest ${oldest}h) but ${shipped} shipped in the window,`
        + ' so the loop is moving',
    };
  }
  return {
    verdict: DARK_IN_EFFECT,
    why: `the loop is READY AND PRODUCING NOTHING: ${n} row(s) waiting, the oldest ${oldest}h`
      + ` — past the ${alarmHours}h alarm — and 0 shipped in the window.`
      + ' Readiness is not production: every writer can be ready while every build fails the gate',
  };
}

/**
 * Pure. 0 healthy, 1 dark, 2 unknown, 3 not ready.
 * Nothing unrecognised maps to 0: a typo'd or future verdict must not become a
 * pass by default (the rule DR-1210 pinned for the deploy proof).
 */
export const exitCodeOf = (verdict) => (
  verdict === HEALTHY ? 0
    : verdict === DARK_IN_EFFECT ? 1
      : verdict === NOT_READY ? 3
        : 2
);

/**
 * Pure. The problem lines the health witness appends to its own verdict, so
 * this reinforces that judgement instead of replacing it.
 */
export function problemsOf(v) {
  return v && (v.verdict === DARK_IN_EFFECT || v.verdict === UNKNOWN || v.verdict === NOT_READY)
    ? [v.why]
    : [];
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('loop-produces-or-it-is-dark.mjs');
if (invokedDirectly) {
  const arg = (f) => { const i = process.argv.indexOf(f); return i === -1 ? null : process.argv[i + 1]; };
  const asNum = (s) => (s === null || s === '' || Number.isNaN(Number(s)) ? null : Number(s));
  const ready = arg('--writer-ready');
  const v = verdictOf({
    writerReady: ready === 'true' ? true : ready === 'false' ? false : null,
    waiting: asNum(arg('--waiting')),
    oldestWaitHours: asNum(arg('--oldest-hours')),
    shippedLastDay: asNum(arg('--shipped')),
    alarmHours: asNum(arg('--alarm-hours')) ?? ALARM_HOURS,
  });
  console.log(`${v.verdict.toUpperCase()}: ${v.why}`);
  if (v.verdict === DARK_IN_EFFECT) {
    console.log('\nThis is NOT a readiness problem and restarting the unit will not cure it:');
    console.log('the builds are happening and failing. Read why one failed (its stages end');
    console.log('written -> gated -> failed) before changing anything about the writers.');
  }
  process.exit(exitCodeOf(v.verdict));
}
