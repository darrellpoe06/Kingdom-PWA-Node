// =============================================================================
// site-health — the LIVE uptime record: is poetech.us up, fresh, and how many
// times has it failed today? (DR-0125; DR-0107 lineage.)
// =============================================================================
// 2026-07-08: Darrell reported the app down AGAIN while every deploy run was
// green — deploy-success is not site-up, and nothing was watching the site
// itself. The outside-in probe (.github/workflows/site-health.yml) now measures
// the served product every ~10 minutes: root redirect answers, the app shell is
// real HTML, the shell's own hashed bundle exists, and the served sw.js build
// SHA matches main. A failing probe records the evidence on the single rolling
// `incident`-labeled issue; recovery closes it.
//
// This module reads that record LIVE (DR-0121 — no static data): probe runs,
// incident issues, and deploy freshness, straight from the public repo's API
// with the same unauthenticated rate-budget discipline as github-ops.js (ETag
// conditional reads via ghGetJson + one shared TTL'd fetch). It degrades
// HONESTLY — a failed read returns ok:false with a notice, never an invented
// green.
//
// Pure shapers are proven-to-catch in site-health.test.js.
// =============================================================================
import { GITHUB_SLUG, ghGetJson } from './github-ops.js';

const API = 'https://api.github.com/repos/' + GITHUB_SLUG;

const isoDay = (v) => String(v || '').slice(0, 10);

// ---------------------------------------------------------------------------
// normalizeProbeRuns — site-health.yml runs -> the probe timeline. A probe run
// concludes `success` when the site answered up+intact (a stale-only probe
// still succeeds after dispatching its heal); `failure` is a DOWN/BROKEN
// observation with its evidence on the incident issue.
// ---------------------------------------------------------------------------
export function normalizeProbeRuns(json) {
  const runs = (json && Array.isArray(json.workflow_runs)) ? json.workflow_runs : [];
  return runs
    .filter((r) => r && r.status === 'completed' && r.conclusion)
    .map((r) => ({
      id: r.id,
      at: r.created_at || null,
      day: isoDay(r.created_at),
      verdict: r.conclusion === 'success' ? 'up' : 'down',
      conclusion: String(r.conclusion),
      event: String(r.event || ''),
      url: r.html_url || null,
    }));
}

// ---------------------------------------------------------------------------
// probeStats — the "how many times today?" answer, measured. `today` is
// injected (never Date.now() inside the shaper) so tests pin it.
// ---------------------------------------------------------------------------
export function probeStats(runs, { today = '' } = {}) {
  const list = Array.isArray(runs) ? runs : [];
  const todays = today ? list.filter((r) => r.day === today) : [];
  const downToday = todays.filter((r) => r.verdict === 'down');
  return {
    measured: list.length > 0,
    latest: list[0] || null,
    checksToday: todays.length,
    downToday: downToday.length,
    lastDown: list.find((r) => r.verdict === 'down') || null,
  };
}

// ---------------------------------------------------------------------------
// normalizeIncidents — `incident`-labeled issues -> the downtime ledger. Open
// = an outage in progress right now; each comment on the rolling issue is one
// failing observation, so `comments + 1` bounds the observation count.
// ---------------------------------------------------------------------------
export function normalizeIncidents(json) {
  const list = Array.isArray(json) ? json : [];
  return list
    .filter((i) => i && i.number && !i.pull_request)
    .map((i) => ({
      number: i.number,
      title: String(i.title || ''),
      state: i.state === 'open' ? 'open' : 'closed',
      openedAt: i.created_at || null,
      openedDay: isoDay(i.created_at),
      closedAt: i.closed_at || null,
      observations: (Number(i.comments) || 0) + 1,
      url: i.html_url || null,
    }));
}

// ---------------------------------------------------------------------------
// freshness — served build (last successful deploy's head_sha) vs main's tip.
// ---------------------------------------------------------------------------
export function freshness(deployRunsJson, mainSha) {
  const runs = (deployRunsJson && Array.isArray(deployRunsJson.workflow_runs)) ? deployRunsJson.workflow_runs : [];
  const last = runs[0] || null;
  const deployedSha = String((last && last.head_sha) || '');
  const tip = String(mainSha || '');
  return {
    deployedSha: deployedSha.slice(0, 7),
    deployedAt: (last && (last.updated_at || last.created_at)) || null,
    mainSha: tip.slice(0, 7),
    known: !!(deployedSha && tip),
    fresh: !!(deployedSha && tip) && deployedSha === tip,
  };
}

// ---------------------------------------------------------------------------
// fetchSiteHealth — one bounded live read (4 endpoints, ETag-cached, shared
// within SITE_HEALTH_TTL_MS so co-mounted panels never re-spend the budget).
// ---------------------------------------------------------------------------
export const SITE_HEALTH_TTL_MS = 90 * 1000;
let inflight = null;
let last = { at: 0, data: null };

export async function fetchSiteHealth(opts = {}) {
  if (!opts.fetch) {
    const now = Date.now();
    if (last.data && now - last.at < SITE_HEALTH_TTL_MS && !opts.force) return last.data;
    if (inflight) return inflight;
    inflight = fetchSiteHealthUncached(opts).then((data) => {
      last = { at: Date.now(), data };
      inflight = null;
      return data;
    }, (e) => { inflight = null; throw e; });
    return inflight;
  }
  return fetchSiteHealthUncached(opts);
}

async function fetchSiteHealthUncached(opts = {}) {
  const f = opts.fetch;
  const today = opts.today || new Date().toISOString().slice(0, 10);
  const out = { ok: false, probe: null, incidents: [], freshness: null, notice: null };
  try {
    const [probeRaw, issuesRaw, deployRaw, mainRaw] = await Promise.all([
      ghGetJson(`${API}/actions/workflows/site-health.yml/runs?per_page=50`, f),
      ghGetJson(`${API}/issues?labels=incident&state=all&per_page=20`, f),
      ghGetJson(`${API}/actions/workflows/deploy-cloudflare-pages.yml/runs?status=success&per_page=1`, f),
      ghGetJson(`${API}/commits/main`, f),
    ]);
    out.probe = probeStats(normalizeProbeRuns(probeRaw), { today });
    out.incidents = normalizeIncidents(issuesRaw);
    out.freshness = freshness(deployRaw, mainRaw && mainRaw.sha);
    out.ok = true;
  } catch (e) {
    out.notice = e && e.rateLimited
      ? 'GitHub API rate limit reached (60/hr, unauthenticated). Try again later.'
      : `Could not read the live uptime record: ${(e && e.message) || 'unknown'}. Nothing is invented when the read fails.`;
  }
  return out;
}
