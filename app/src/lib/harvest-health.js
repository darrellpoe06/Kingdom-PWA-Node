// =============================================================================
// harvest-health — is the transcript pipeline actually ADVANCING, and if not,
// which way is it broken?
// =============================================================================
// Darrell 2026-08-11: "fix the witness too... in app surface... etc."
//
// The witness existed (.github/workflows/harvest-health.yml, DR-0277) and it
// DID ring — four times a day for five days, into a GitHub issue nobody reads,
// while the corpus sat at 81 of 860 for 35 days. Three things were wrong with
// it, and this module is two of the three fixes.
//
// 1. IT COULD REPORT A FALSE GREEN. Freshness was `max(created_at)` over ALL
//    rows of video_transcripts — and that table stores FAILURES as rows too
//    (56 of its 137 rows are errors). So the documented most-likely cause, a
//    YouTube IP block, writes a steady stream of error rows, holds the age near
//    zero, and the probe reports ADVANCING and CLOSES the incident while zero
//    transcripts are produced. That is LESSONS P22 exactly — "a green run must
//    mean the target state MOVED; recorded-my-own-failure is not progress" —
//    living inside the instrument built to enforce it. classifyHarvestPulse
//    judges the stall on SUCCESS freshness and can never be fooled that way.
//
// 2. IT COULD NOT SAY WHICH FAILURE IT WAS. "Stalled" was one state with a
//    hardcoded list of three guesses appended to it, and on 2026-08-11 all
//    three were wrong (the NAS was up, YouTube was not blocking, the secrets
//    were fine — a python module was simply never installed). The two failure
//    shapes have OPPOSITE next actions and are trivially distinguishable:
//      • SILENT  — nothing written at all, not even errors → the rider is not
//                  EXECUTING. Look at the box and the cycle log.
//      • BLOCKED — errors still landing, successes stale → the rider IS running
//                  and is being refused. Look at the block/backoff.
//    That distinction is the entire diagnosis this file exists to make cheap.
//
// 3. IT HAD NO IN-APP SURFACE AND NO ACTUATOR (DR-0135's standard is probe →
//    readout → actuator → announce, and "a detector without an actuator is a
//    named debt"). fetchHarvestHealth is the readout half, read LIVE from the
//    repo's own records (DR-0121 — the counts are the workflow's measurement,
//    never a number typed here); the actuator is the heal dispatch in the
//    workflow itself.
//
// Degrades HONESTLY: a failed read returns ok:false with a notice. Unknown is
// never rendered as healthy (DR-0076).
// =============================================================================
import { GITHUB_SLUG, ghGetJson } from './github-ops.js';

const API = 'https://api.github.com/repos/' + GITHUB_SLUG;

/**
 * The verdict, from measurements only. Pure and clock-free — every age is
 * handed in, so this is deterministic in tests and safe in a workflow.
 *
 *   transcribed  — rows carrying real text
 *   total        — videos owing a transcript
 *   successAgeH  — hours since the newest row WITH TEXT (-1 = never)
 *   attemptAgeH  — hours since the newest row of ANY kind, errors included (-1)
 *   recentErrors — error rows written inside the stall window
 *
 * Returns { state, stalled, headline, nextAction }. `state` is one of
 * unknown | no-corpus | complete | advancing | blocked | silent.
 */
export function classifyHarvestPulse({
  transcribed = null,
  total = null,
  successAgeH = -1,
  attemptAgeH = -1,
  recentErrors = 0,
  stallHours = 48,
} = {}) {
  // null/undefined/'' must NOT slide through Number() to 0 — that would land on
  // `no-corpus`, which reads as benign ("nothing owed") and is therefore an
  // unmeasured state rendered as a healthy one. Caught by this file's own test.
  const num = (v) => (v === null || v === undefined || v === '' ? NaN : Number(v));
  const done = num(transcribed);
  const all = num(total);
  if (!Number.isFinite(done) || !Number.isFinite(all)) {
    return {
      state: 'unknown', stalled: false,
      headline: 'Harvest state could not be measured',
      nextAction: 'Unknown is never reported as healthy — check the probe run.',
    };
  }
  if (all <= 0) {
    return { state: 'no-corpus', stalled: false, headline: 'No videos are owed a transcript yet', nextAction: '' };
  }
  const gaps = all - done;
  if (gaps <= 0) {
    return { state: 'complete', stalled: false, headline: `All ${all} transcribed`, nextAction: '' };
  }

  // THE FIX: the stall is judged on SUCCESS freshness. Error rows are not
  // progress and can never hold this open.
  const sAge = Number(successAgeH);
  const fresh = Number.isFinite(sAge) && sAge >= 0 && sAge < stallHours;
  if (fresh) {
    return {
      state: 'advancing', stalled: false,
      headline: `Advancing — ${done} of ${all} transcribed`,
      nextAction: '',
    };
  }

  const aAge = Number(attemptAgeH);
  const tryingRecently = (Number(recentErrors) || 0) > 0
    || (Number.isFinite(aAge) && aAge >= 0 && aAge < stallHours);
  const since = Number.isFinite(sAge) && sAge >= 0 ? `${sAge}h` : 'ever';

  if (tryingRecently) {
    return {
      state: 'blocked', stalled: true,
      headline: `Blocked — ${done} of ${all}, nothing succeeded in ${since} while attempts keep failing`,
      nextAction: 'The rider IS running and is being refused. Read the newest error rows for the reason (an IP block backs off and resumes itself).',
    };
  }
  return {
    state: 'silent', stalled: true,
    headline: `Silent — ${done} of ${all}, nothing written in ${since}, not even a failure`,
    nextAction: 'The rider is not EXECUTING. Check the NAS cycle log for the installer that died; a dependency it never installed will not announce itself.',
  };
}

/** harvest-health.yml runs → a pass/fail timeline. */
export function normalizeHarvestRuns(json) {
  const runs = (json && Array.isArray(json.workflow_runs)) ? json.workflow_runs : [];
  return runs
    .filter((r) => r && r.status === 'completed' && r.conclusion)
    .map((r) => ({
      id: r.id,
      at: r.created_at || null,
      ok: r.conclusion === 'success',
      url: r.html_url || null,
    }));
}

/** Latest verdict + how long it has been that way, from the run timeline. */
export function harvestStats(runs = []) {
  const list = Array.isArray(runs) ? runs : [];
  if (list.length === 0) return { measured: false, ok: null, checks: 0, failing: 0, lastAt: null, url: null };
  const failing = list.filter((r) => !r.ok).length;
  const newest = list[0];
  // How many consecutive newest-first runs share the newest run's verdict —
  // "stalled for 20 straight checks" is the number that makes a month visible.
  let streak = 0;
  for (const r of list) { if (r.ok === newest.ok) streak += 1; else break; }
  return {
    measured: true,
    ok: newest.ok,
    checks: list.length,
    failing,
    streak,
    lastAt: newest.at,
    url: newest.url,
  };
}

/**
 * Pull the measured counts out of the rolling incident record. The workflow
 * writes them there in a fixed shape, so the app SHOWS the probe's own numbers
 * rather than computing a second, possibly-disagreeing figure (DR-0121).
 * Returns null when nothing parseable is present — never a guess.
 */
export function parseHarvestComment(body = '') {
  const s = String(body || '');
  const counts = s.match(/transcribed\s+(\d+)\s*\/\s*(\d+)/i);
  const owed = s.match(/(\d+)\s+still owed/i);
  const age = s.match(/nothing has landed in\s+(-?\d+)h/i);
  if (!counts && !owed && !age) return null;
  return {
    transcribed: counts ? Number(counts[1]) : null,
    total: counts ? Number(counts[2]) : null,
    owed: owed ? Number(owed[1]) : null,
    quietHours: age ? Number(age[1]) : null,
    state: /\bSILENT\b/i.test(s) ? 'silent' : /\bBLOCKED\b/i.test(s) ? 'blocked' : (/\bSTALLED\b/i.test(s) ? 'stalled' : null),
  };
}

export const HARVEST_HEALTH_TTL_MS = 90 * 1000;
let inflight = null;
let last = { at: 0, data: null };

export async function fetchHarvestHealth(opts = {}) {
  if (!opts.fetch) {
    const now = Date.now();
    if (last.data && now - last.at < HARVEST_HEALTH_TTL_MS && !opts.force) return last.data;
    if (inflight) return inflight;
    inflight = fetchHarvestHealthUncached(opts).then((data) => {
      last = { at: Date.now(), data };
      inflight = null;
      return data;
    }, (e) => { inflight = null; throw e; });
    return inflight;
  }
  return fetchHarvestHealthUncached(opts);
}

async function fetchHarvestHealthUncached(opts = {}) {
  const f = opts.fetch;
  const out = { ok: false, stats: null, latest: null, incident: null, notice: null };
  try {
    const [runsRaw, issuesRaw] = await Promise.all([
      ghGetJson(`${API}/actions/workflows/harvest-health.yml/runs?per_page=30`, f),
      ghGetJson(`${API}/issues?labels=incident&state=all&per_page=20`, f),
    ]);
    out.stats = harvestStats(normalizeHarvestRuns(runsRaw));
    const issues = Array.isArray(issuesRaw) ? issuesRaw : [];
    const rec = issues.find((i) => i && /harvest-health/i.test(String(i.title || '')));
    if (rec) {
      out.incident = {
        number: rec.number,
        open: rec.state === 'open',
        url: rec.html_url || null,
        since: rec.created_at || null,
      };
      out.latest = parseHarvestComment(rec.body);
    }
    out.ok = true;
  } catch (e) {
    out.notice = e && e.rateLimited
      ? 'GitHub API rate limit reached (60/hr, unauthenticated). Try again later.'
      : `Could not read the harvest record: ${(e && e.message) || 'unknown'}. Nothing is invented when the read fails.`;
  }
  return out;
}
