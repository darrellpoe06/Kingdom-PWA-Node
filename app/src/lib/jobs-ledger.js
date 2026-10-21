// =============================================================================
// jobs-ledger — every clocked GitHub workflow: name, cycle, last ran, never ran,
// sequence, logs, and a reminder when a cycle was missed (DR-1189)
// =============================================================================
// Darrell 2026-10-21, as a stream of notes: "Data quality controllers and
// reporting systems are fundamentally sound?!" · "Cyclical calendars for stored
// procedures" · "Reminders" · "Actual job names" · "Number of jobs, last ran,
// never ran... sequence of things, logs".
//
// WHAT IS REAL HERE. Names and crons come from app/src/lib/job-registry.json,
// derived at build time from .github/workflows (scripts/derive-job-registry.mjs;
// drift is a failing test). Runs come from TWO live unauthenticated reads of
// the repo's API, through the same ETag cache and rate budget every other
// live read on the OpsBoard shares (github-ops.js ghGetJson):
//   GET /actions/workflows?per_page=100            — the workflow ids and state
//   GET /actions/runs?event=schedule&per_page=100  — the newest scheduled runs
// Two requests for the whole board, never one per job (60/hr budget, DR-0686
// / DR-0625 discipline).
//
// WHAT "NEVER RAN" MEANS, said exactly (DR-0076 §8). The runs read is a window:
// the newest 100 scheduled runs across every workflow. A workflow with no run
// in that window is drawn as "no run in the last 100 scheduled runs", with the
// window's oldest day, never as "never once fired" — the same honesty the fleet
// census keeps ("never, in retained history" is not "never once"). Unknown
// (a failed read) is drawn as unknown with its reason, never as green.
//
// THE REMINDER. A job whose cycle is shorter than the time since its last run
// has missed a cycle. GitHub throttles scheduled workflows (site-health.yml:
// requested every 10 minutes, measured ~67), so the reminder fires only past
// TWO cycles or an hour, whichever is longer — a request, not a guarantee, is
// what a cron is.
import { ghGetJson, GITHUB_SLUG } from './github-ops.js';
import registry from './job-registry.json';

const API = 'https://api.github.com/repos/' + GITHUB_SLUG;
export const JOBS_RUN_WINDOW = 100;
export const JOBS_TTL_MS = 5 * 60 * 1000;

// --- cron ---------------------------------------------------------------------
// Five fields, as GitHub Actions uses them: minute hour day-of-month month
// day-of-week, with `*`, lists `a,b`, ranges `a-b`, steps `*/n` and `a-b/n`.
// Enough for every cron the repo carries (surveyed 2026-10-21: lists of
// minutes, hourly steps, fixed daily minutes); anything stranger parses to null
// and is drawn as "cron not understood", never guessed.
function field(spec, min, max) {
  const out = new Set();
  for (const part of String(spec).split(',')) {
    const m = part.trim().match(/^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/);
    if (!m) return null;
    let lo = min; let hi = max;
    if (m[1] !== '*') {
      const r = m[1].split('-').map(Number);
      lo = r[0]; hi = r.length > 1 ? r[1] : (m[2] ? max : r[0]);
    }
    const step = m[2] ? Number(m[2]) : 1;
    if (!(step > 0) || lo < min || hi > max || lo > hi) return null;
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  return out;
}

export function parseCron(cron) {
  const f = String(cron || '').trim().split(/\s+/);
  if (f.length !== 5) return null;
  const minute = field(f[0], 0, 59); const hour = field(f[1], 0, 23);
  const dom = field(f[2], 1, 31); const month = field(f[3], 1, 12); const dow = field(f[4], 0, 7);
  if (!minute || !hour || !dom || !month || !dow) return null;
  if (dow.has(7)) dow.add(0);
  return { minute, hour, dom, month, dow, domAny: f[2] === '*', dowAny: f[4] === '*' };
}

function matches(c, d) {
  if (!c.minute.has(d.getUTCMinutes()) || !c.hour.has(d.getUTCHours()) || !c.month.has(d.getUTCMonth() + 1)) return false;
  const domOk = c.dom.has(d.getUTCDate()); const dowOk = c.dow.has(d.getUTCDay());
  if (c.domAny && c.dowAny) return true;
  if (c.domAny) return dowOk;
  if (c.dowAny) return domOk;
  return domOk || dowOk; // cron's rule: either field matches when both are restricted
}

/** The next `count` fire times (UTC, ms) strictly after `from`, or [] when the cron is not understood. */
export function cronNextFires(cron, from = Date.now(), count = 3, { horizonDays = 400 } = {}) {
  const c = parseCron(cron);
  if (!c) return [];
  const out = [];
  const d = new Date(from);
  d.setUTCSeconds(0, 0);
  d.setUTCMinutes(d.getUTCMinutes() + 1);
  const end = from + horizonDays * 86400000;
  while (d.getTime() <= end && out.length < count) {
    if (matches(c, d)) out.push(d.getTime());
    d.setUTCMinutes(d.getUTCMinutes() + 1);
  }
  return out;
}

/** The cycle in ms: the smallest gap between consecutive fires in the coming year, or null. */
export function cronPeriodMs(cron, from = Date.now()) {
  const fires = cronNextFires(cron, from, 4);
  if (fires.length < 2) return null;
  let best = null;
  for (let i = 1; i < fires.length; i += 1) {
    const gap = fires[i] - fires[i - 1];
    best = best == null ? gap : Math.min(best, gap);
  }
  return best;
}

// --- normalising the two reads -----------------------------------------------
export function normalizeWorkflows(json) {
  const list = (json && Array.isArray(json.workflows)) ? json.workflows : [];
  return list.map((w) => ({
    id: w.id, name: String(w.name || ''), file: String(w.path || '').replace(/^\.github\/workflows\//, ''),
    state: String(w.state || ''), url: w.html_url || null,
  })).filter((w) => w.file);
}

export function normalizeRuns(json) {
  const list = (json && Array.isArray(json.workflow_runs)) ? json.workflow_runs : [];
  return list.map((r) => ({
    id: r.id, workflowId: r.workflow_id, file: String(r.path || '').replace(/^\.github\/workflows\//, ''),
    at: r.run_started_at || r.created_at || null, status: r.status || null, conclusion: r.conclusion || null,
    url: r.html_url || null, number: r.run_number || null,
  })).filter((r) => r.at);
}

// --- the ledger ----------------------------------------------------------------
export const MISSED_FLOOR_MS = 60 * 60 * 1000;

/** The state of one job against the runs window; pure, for the gate. */
export function jobState(job, runs, { now = Date.now(), windowOldest = null } = {}) {
  const mine = runs.filter((r) => r.file === job.file).sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const last = mine[0] || null;
  const periods = job.crons.map((c) => cronPeriodMs(c, now)).filter((p) => p != null);
  const period = periods.length ? Math.min(...periods) : null;
  const nextFires = job.crons.flatMap((c) => cronNextFires(c, now, 2)).sort((a, b) => a - b).slice(0, 3);
  if (!last) {
    return { state: 'no-run-in-window', last: null, period, nextFires, runs: mine, since: null };
  }
  const since = now - Date.parse(last.at);
  const missed = period != null && since > Math.max(2 * period, MISSED_FLOOR_MS);
  return { state: missed ? 'missed' : 'ran', last, period, nextFires, runs: mine, since };
}

export function buildJobsLedger({ jobs = registry.jobs, workflows = [], runs = [], now = Date.now() } = {}) {
  const byFile = Object.fromEntries(workflows.map((w) => [w.file, w]));
  const windowOldest = runs.length ? runs.map((r) => Date.parse(r.at)).reduce((a, b) => Math.min(a, b)) : null;
  const rows = jobs.map((job) => {
    const w = byFile[job.file] || null;
    const s = jobState(job, runs, { now, windowOldest });
    return {
      file: job.file, name: (w && w.name) || job.name, crons: job.crons, apiState: w ? w.state : 'unknown',
      logsUrl: w ? w.url : null, ...s,
    };
  });
  const order = { missed: 0, 'no-run-in-window': 1, ran: 2 };
  rows.sort((a, b) => (order[a.state] - order[b.state]) || ((b.last ? Date.parse(b.last.at) : 0) - (a.last ? Date.parse(a.last.at) : 0)) || a.name.localeCompare(b.name));
  const counts = {
    scheduled: rows.length,
    ran: rows.filter((r) => r.state === 'ran').length,
    missed: rows.filter((r) => r.state === 'missed').length,
    noRunInWindow: rows.filter((r) => r.state === 'no-run-in-window').length,
    disabled: rows.filter((r) => /disabled/.test(r.apiState)).length,
  };
  return { rows, counts, window: { size: JOBS_RUN_WINDOW, runs: runs.length, oldest: windowOldest } };
}

// --- the words ------------------------------------------------------------------
export function fmtUtc(ms) {
  if (!ms && ms !== 0) return '';
  return new Date(ms).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
}

export function agoWords(ms) {
  if (ms == null) return '';
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

export function periodWords(ms) {
  if (ms == null) return 'cron not understood';
  const m = Math.round(ms / 60000);
  if (m < 60) return `every ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? 'hourly' : `every ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'daily' : d === 7 ? 'weekly' : `every ${d} d`;
}

export function stateWords(row, ledger) {
  if (row.state === 'ran') return `ran ${agoWords(row.since)}${row.last.conclusion ? `, ${row.last.conclusion}` : ''}`;
  if (row.state === 'missed') return `missed a cycle: last ran ${agoWords(row.since)}, cycle ${periodWords(row.period)}`;
  const oldest = ledger && ledger.window && ledger.window.oldest ? ` (window back to ${fmtUtc(ledger.window.oldest).slice(0, 10)})` : '';
  return `no run in the last ${ledger ? ledger.window.size : JOBS_RUN_WINDOW} scheduled runs${oldest}`;
}

export function ledgerLine(ledger) {
  const c = ledger.counts;
  return `${c.scheduled} scheduled workflows · ${c.ran} ran on cycle · ${c.missed} missed a cycle · ${c.noRunInWindow} with no run in the window${c.disabled ? ` · ${c.disabled} disabled on GitHub` : ''}`;
}

// --- the live read ---------------------------------------------------------------
let inflight = null;
let last = { at: 0, data: null };

export async function fetchJobsLedger(opts = {}) {
  if (!opts.fetch) {
    const now = Date.now();
    if (last.data && now - last.at < JOBS_TTL_MS && !opts.force) return last.data;
    if (inflight) return inflight;
    inflight = fetchJobsLedgerUncached(opts).then((data) => { last = { at: Date.now(), data }; inflight = null; return data; }, (e) => { inflight = null; throw e; });
    return inflight;
  }
  return fetchJobsLedgerUncached(opts);
}

async function fetchJobsLedgerUncached(opts = {}) {
  const f = opts.fetch;
  const now = opts.now || Date.now();
  const out = { ok: false, ledger: null, notice: null, registry: { scheduled: registry.scheduled, derivedFrom: registry.derivedFrom } };
  try {
    const [wfRaw, runsRaw] = await Promise.all([
      ghGetJson(`${API}/actions/workflows?per_page=100`, f),
      ghGetJson(`${API}/actions/runs?event=schedule&per_page=${JOBS_RUN_WINDOW}`, f),
    ]);
    out.ledger = buildJobsLedger({ jobs: opts.jobs || registry.jobs, workflows: normalizeWorkflows(wfRaw), runs: normalizeRuns(runsRaw), now });
    out.ok = true;
  } catch (e) {
    out.notice = e && e.rateLimited
      ? 'GitHub API rate limit reached (60/hr, unauthenticated); the jobs are unknown until it resets.'
      : `Could not read the jobs from GitHub: ${(e && e.message) || 'unknown'}. Unknown is drawn as unknown, never as green.`;
  }
  return out;
}

export function __resetJobsLedgerForTests() { inflight = null; last = { at: 0, data: null }; }
