// =============================================================================
// fleet-census-live — the fleet census, on the board, read LIVE (DR-1148)
// =============================================================================
// WHY THIS FILE EXISTS. Darrell brought back a migration census — 149 jobs,
// 131 enabled, 78 with a last run date — and asked the two questions nobody
// could answer about our OWN automation: do the disabled jobs need to move,
// and have the enabled ones with no run date never run? `scripts/
// fleet-census.mjs` answers them (DR-1140) and `.github/workflows/
// fleet-census.yml` asks GitHub the half the repository cannot know. But the
// answer landed in a step summary, an artifact, and an incident issue filed
// only when something was broken — three places Darrell does not read. A
// report nobody can see is not a report (DR-0065: the app is the primary
// artifact; a capability that CAN live in the app SHOULD).
//
// WHAT IT READS — real state, named (DR-0061 reality-trace):
//   * the rolling `fleet-census-report` issue, whose BODY the census workflow
//     rewrites on every run with the measured counts in a fenced JSON block.
//     That is the census itself, not a summary of it.
//   * fleet-census.yml's own run list, so the board can say WHEN the census
//     last ran and whether that run succeeded. A census is only as good as
//     its freshness, and an old census presented as current is a lie with a
//     digit on it.
//
// HOW IT DEGRADES. A failed read, a missing report issue, an unparseable body
// and a stale census are four DIFFERENT states and each says which it is. None
// of them renders as a healthy fleet. "Unknown" never reads as "fine"
// (DR-0076), and this module never invents a count: every number it returns
// came out of the census JSON or it is absent.
//
// Every shaper here is pure and injected with `now`, so the tests pin it.
// =============================================================================
import { GITHUB_SLUG, ghGetJson } from './github-ops.js';

const API = 'https://api.github.com/repos/' + GITHUB_SLUG;

/** A census older than this is reported STALE rather than shown as current. */
export const CENSUS_STALE_MS = 10 * 24 * 60 * 60 * 1000; // the weekly job, twice missed

// ---------------------------------------------------------------------------
// parseCensusBody — pull the census out of the report issue's body.
//
// The workflow writes a fenced ```json block holding exactly what
// `fleet-census.mjs --json` produced. Parsing the fence rather than scraping
// the human table is deliberate: a table is for the reader, and a number
// re-typed into prose is a number that can drift from the thing it measured.
//
// A body with no fence, a fence that will not parse, or a parsed object
// missing the counts is NOT an empty census — it is a census that could not be
// read, and it is returned as such.
// ---------------------------------------------------------------------------
export function parseCensusBody(body) {
  const text = String(body || '');
  const m = text.match(/```json\s*\n([\s\S]*?)\n```/);
  if (!m) return { ok: false, why: 'the report issue carries no census block' };
  let doc;
  try {
    doc = JSON.parse(m[1]);
  } catch (e) {
    return { ok: false, why: `the census block does not parse: ${(e && e.message) || 'unknown'}` };
  }
  if (!doc || typeof doc !== 'object' || typeof doc.total !== 'number') {
    return { ok: false, why: 'the census block has no total; it is not a census' };
  }
  const n = (v) => (typeof v === 'number' ? v : null);
  return {
    ok: true,
    window: doc.window || null,
    readAt: doc.readAt || null,
    total: n(doc.total),
    enabled: n(doc.enabled),
    disabled: n(doc.disabled),
    withALastRun: n(doc.withALastRun),
    neverRun: n(doc.neverRun),
    unknownLastRun: n(doc.unknownLastRun),
    byKind: (doc.byKind && typeof doc.byKind === 'object') ? doc.byKind : {},
    jobs: Array.isArray(doc.jobs) ? doc.jobs : [],
  };
}

// ---------------------------------------------------------------------------
// theThreeWayAnswer — the actual answer to Darrell's second question, which is
// the whole reason the census exists.
//
// "Enabled, no last run date" is NOT one population. It is three, with three
// OPPOSITE decisions, and a report that merges them hands the reader a wrong
// answer with full confidence:
//
//   nothingFiresIt  — on-demand only. No clock, no event. Correct and healthy:
//                     it runs when somebody asks. 40 of our own jobs are this.
//   askedAndEmpty   — something fires it on a clock, the history was asked,
//                     and there is no run. That is a retire-or-fix candidate.
//   nobodyAsked     — the history was never asked. A gap in the REPORT, not a
//                     fault in the job (DR-0076), and it must never be counted
//                     with either of the two above.
// ---------------------------------------------------------------------------
export function theThreeWayAnswer(census) {
  const jobs = (census && Array.isArray(census.jobs)) ? census.jobs : [];
  const noRun = jobs.filter((j) => j && j.lastRunClass !== 'ran');
  return {
    nothingFiresIt: noRun.filter((j) => j.onDemandOnly || j.kind === 'on-demand'),
    askedAndEmpty: noRun.filter((j) => !j.onDemandOnly && j.kind !== 'on-demand'
      && j.lastRunClass === 'never'),
    nobodyAsked: noRun.filter((j) => !j.onDemandOnly && j.kind !== 'on-demand'
      && j.lastRunClass === 'unknown'),
    inert: jobs.filter((j) => j && j.kind === 'inert'),
  };
}

// ---------------------------------------------------------------------------
// censusFreshness — when did the census last run, and is what we are showing
// current? `now` is injected; a shaper that reads the clock cannot be pinned.
// ---------------------------------------------------------------------------
export function censusFreshness(runsJson, { now = 0 } = {}) {
  const runs = (runsJson && Array.isArray(runsJson.workflow_runs)) ? runsJson.workflow_runs : [];
  const done = runs.filter((r) => r && r.status === 'completed' && r.conclusion);
  const last = done[0] || null;
  if (!last) {
    return { known: false, stale: false, lastRunAt: null, conclusion: null, url: null };
  }
  const at = last.run_started_at || last.created_at || null;
  const ms = at ? Date.parse(at) : NaN;
  const ageMs = (Number.isFinite(ms) && now) ? now - ms : null;
  return {
    known: true,
    lastRunAt: at,
    ageMs,
    // Unknown age is NOT fresh. A census whose date we cannot compute is
    // exactly as untrustworthy as one we know to be old.
    stale: ageMs === null ? true : ageMs > CENSUS_STALE_MS,
    conclusion: String(last.conclusion),
    url: last.html_url || null,
  };
}

// ---------------------------------------------------------------------------
// censusVerdict — one sentence the board can show, derived from the numbers it
// actually has. It names the thing that needs a decision, and when nothing
// does, it says so WITHOUT claiming more than was measured.
// ---------------------------------------------------------------------------
export function censusVerdict(census, answer) {
  if (!census || !census.ok) {
    return { tone: 'unknown', line: (census && census.why) || 'the census has not been read' };
  }
  const a = answer || theThreeWayAnswer(census);
  if (a.inert.length) {
    return {
      tone: 'bad',
      line: `${a.inert.length} job(s) nothing can fire at all`,
    };
  }
  if (a.askedAndEmpty.length) {
    return {
      tone: 'bad',
      line: `${a.askedAndEmpty.length} job(s) on a clock with no run in retained history`,
    };
  }
  if (census.unknownLastRun) {
    return {
      tone: 'unknown',
      line: `${census.unknownLastRun} of ${census.total} job(s) have no last-run answer yet`,
    };
  }
  return {
    tone: 'good',
    line: `${census.total} jobs, ${census.enabled} enabled, ${census.withALastRun} with a last run`,
  };
}

// ---------------------------------------------------------------------------
// fetchFleetCensus — one bounded live read (2 endpoints, ETag-conditional
// through ghGetJson, shared within the TTL so co-mounted panels do not spend
// the unauthenticated budget twice).
// ---------------------------------------------------------------------------
export const FLEET_CENSUS_TTL_MS = 5 * 60 * 1000;
let inflight = null;
let cached = { at: 0, data: null };

export async function fetchFleetCensus(opts = {}) {
  if (!opts.fetch) {
    const now = Date.now();
    if (cached.data && now - cached.at < FLEET_CENSUS_TTL_MS && !opts.force) return cached.data;
    if (inflight) return inflight;
    inflight = fetchFleetCensusUncached(opts).then((data) => {
      cached = { at: Date.now(), data };
      inflight = null;
      return data;
    }, (e) => { inflight = null; throw e; });
    return inflight;
  }
  return fetchFleetCensusUncached(opts);
}

async function fetchFleetCensusUncached(opts = {}) {
  const f = opts.fetch;
  const now = opts.now || Date.now();
  const out = {
    ok: false, census: null, answer: null, verdict: null, freshness: null,
    reportUrl: null, notice: null,
  };
  try {
    const [issuesRaw, runsRaw] = await Promise.all([
      ghGetJson(`${API}/issues?labels=fleet-census-report&state=all&per_page=1`, f),
      ghGetJson(`${API}/actions/workflows/fleet-census.yml/runs?per_page=5`, f),
    ]);
    out.freshness = censusFreshness(runsRaw, { now });
    const issues = Array.isArray(issuesRaw) ? issuesRaw.filter((i) => i && !i.pull_request) : [];
    const report = issues[0] || null;
    out.reportUrl = (report && report.html_url) || null;
    if (!report) {
      // The census may be perfectly healthy and simply never have reported.
      // That is a state of the REPORT, and it is said as one.
      out.census = { ok: false, why: 'the census has not filed a report yet' };
    } else {
      out.census = parseCensusBody(report.body);
    }
    out.answer = out.census.ok ? theThreeWayAnswer(out.census) : null;
    out.verdict = censusVerdict(out.census, out.answer);
    out.ok = !!out.census.ok;
  } catch (e) {
    out.notice = e && e.rateLimited
      ? 'GitHub API rate limit reached (60/hr, unauthenticated). Try again later.'
      : `Could not read the live fleet census: ${(e && e.message) || 'unknown'}. Nothing is invented when the read fails.`;
    out.verdict = { tone: 'unknown', line: 'the census could not be read' };
  }
  return out;
}
