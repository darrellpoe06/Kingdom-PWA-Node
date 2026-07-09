// =============================================================================
// github-ops — REAL orchestration state for the in-app Ops surface (DR-0061).
// =============================================================================
// Darrell, 2026-06-16: "actual proof inside the app ... all loops return and
// inform inside ... no mock/placeholder data." This reads the orchestration
// loop's REAL outcomes straight from GitHub's REST API — the same source the
// auto-merge / auto-open-pr / conflict-map machinery acts on:
//   - in-flight PRs (branch, auto-merge armed?, `hold`?, draft?, head SHA)
//   - which lane each is in (PARALLEL-SAFE vs MUST-SERIALIZE) — computed from
//     the PR's REAL changed files (touches the monolith or a migration => must
//     serialize), the same rule scripts/orchestration/conflict-map.sh applies
//   - what actually merged into main, with the real commit SHA
//   - main's latest CI conclusion (recent failures)
//
// The repo is PUBLIC, so the browser reads the API unauthenticated (no token
// shipped to the client, ever). Unauthenticated GitHub API = 60 req/hr per IP,
// so this fetches on demand (mount + manual refresh), never on a poll, and
// degrades HONESTLY: on a 403/rate-limit or network error it returns what it
// has plus an explicit notice — it never invents a row.

export const GITHUB_SLUG = 'darrellpoe06/Kingdom-PWA-Node';
export const MONOLITH_PATH = 'app/src/poe-financial-mvp-v28.jsx';
export const MIGRATIONS_DIR = 'infra/supabase/migrations-auto/';
const API = 'https://api.github.com/repos/' + GITHUB_SLUG;
// Cap per-PR file lookups so one render stays well under the 60/hr budget.
export const MAX_PR_FILE_LOOKUPS = 8;

// --- pure shapers (testable, never throw) -----------------------------------

// A PR is in the serialized lane if it changes the shared monolith or adds a
// migration (the strictly-ordered sequence). Mirrors conflict-map.sh.
export function classifyLane(files) {
  const list = Array.isArray(files) ? files : [];
  const touchesMonolith = list.some((f) => f === MONOLITH_PATH);
  const touchesMigration = list.some((f) => typeof f === 'string' && f.indexOf(MIGRATIONS_DIR) === 0);
  return touchesMonolith || touchesMigration ? 'must-serialize' : 'parallel-safe';
}

export function normalizePulls(json) {
  if (!Array.isArray(json)) return [];
  return json.map((p) => ({
    number: p && p.number,
    title: String((p && p.title) || ''),
    branch: String((p && p.head && p.head.ref) || ''),
    base: String((p && p.base && p.base.ref) || ''),
    headSha: String((p && p.head && p.head.sha) || ''),
    draft: (p && p.draft) === true,
    autoMerge: !!(p && p.auto_merge),
    hold: Array.isArray(p && p.labels) && p.labels.some((l) => l && l.name === 'hold'),
    updatedAt: (p && p.updated_at) || null,
  }));
}

export function normalizeCommits(json) {
  if (!Array.isArray(json)) return [];
  return json.map((c) => {
    const sha = String((c && c.sha) || '');
    const msg = String((c && c.commit && c.commit.message) || '');
    return {
      sha,
      shortSha: sha.slice(0, 7),
      title: msg.split('\n')[0],
      date: (c && c.commit && c.commit.author && c.commit.author.date) || null,
    };
  });
}

// Latest CI run conclusion for main — the "is the trunk healthy" signal.
export function normalizeMainRuns(json) {
  const runs = (json && Array.isArray(json.workflow_runs)) ? json.workflow_runs : [];
  if (runs.length === 0) return { status: 'idle', label: 'No runs', latest: null };
  const latest = runs[0];
  const concl = String(latest.conclusion || latest.status || 'unknown');
  const map = { success: 'good', failure: 'problem', cancelled: 'attention', timed_out: 'problem' };
  return {
    status: map[concl] || 'attention',
    label: concl === 'success' ? 'CI green' : `CI ${concl}`,
    latest: { sha: String(latest.head_sha || '').slice(0, 7), name: latest.name || 'CI', conclusion: concl },
  };
}

// Priority-ordered land order, computed client-side from the SAME rule the
// orchestrator uses: parallel-safe first (land freely), then the serialized
// lane (one at a time, rebase the rest). incident(fix) > governance(docs) >
// feature(feat). Held PRs are excluded — they are deliberately parked.
export function landOrder(pulls) {
  const prio = (b) => (b.startsWith('fix/') ? 0 : b.startsWith('merge/') ? 1 : b.startsWith('docs/') ? 2 : 3);
  const eligible = pulls.filter((p) => !p.hold && !p.draft);
  const safe = eligible.filter((p) => p.lane === 'parallel-safe');
  const serial = eligible.filter((p) => p.lane !== 'parallel-safe');
  const byPrio = (a, b) => prio(a.branch) - prio(b.branch) || a.number - b.number;
  return [...safe.sort(byPrio), ...serial.sort(byPrio)];
}

// --- live fetch (bounded, honest degradation) -------------------------------
//
// RATE-BUDGET DISCIPLINE (2026-07-03, "GitHub capped us"): one fetchOps() costs
// up to 11 unauthenticated requests, and the See tab mounts THREE panels that
// each called it — up to 33 requests per visit against a 60/hr/IP budget. Two
// visits in an hour = capped. Two structural fixes, both here so no caller can
// regress them:
//   1. ETag conditional requests — GitHub 304s DON'T COUNT against the
//      unauthenticated rate limit, so a repeat read of an unchanged endpoint is
//      free. Bodies + ETags cache in localStorage (pruned, best-effort).
//   2. One shared fetch — concurrent fetchOps() calls join the same in-flight
//      promise, and a fresh result is reused within OPS_TTL_MS instead of
//      re-spending the budget three times for one screen.

const ETAG_KEY = 'poe-gh-etag-cache';
const ETAG_CAP = 24; // endpoints worth of {etag, body} — pruned oldest-first

// ONE in-memory cache object, hydrated from localStorage once. Concurrent
// endpoint reads (fetchOps fires several in a Promise.all) mutate the SAME
// object, so a parallel writer can never clobber another's entry the way
// independent read-modify-write cycles on the storage key would (the pinning
// test caught exactly that race). Persistence is best-effort.
let etagCache = null;
// Test seam: force re-hydration from localStorage (the cache hydrates once).
export function __resetEtagCacheForTests() { etagCache = null; }
function getEtagCache() {
  if (!etagCache) {
    try {
      const raw = JSON.parse(localStorage.getItem(ETAG_KEY) || '{}');
      etagCache = raw && typeof raw === 'object' ? raw : {};
    } catch { etagCache = {}; }
  }
  return etagCache;
}
function persistEtagCache(cache) {
  try {
    const keys = Object.keys(cache);
    if (keys.length > ETAG_CAP) {
      keys.sort((a, b) => (cache[a].at || 0) - (cache[b].at || 0))
        .slice(0, keys.length - ETAG_CAP)
        .forEach((k) => { delete cache[k]; });
    }
    localStorage.setItem(ETAG_KEY, JSON.stringify(cache));
  } catch { /* private mode / full storage — caching is best-effort */ }
}

// Exported for sibling live-read modules (site-health.js) so every GitHub read
// in the app shares ONE ETag cache + rate-budget discipline — a second module
// growing its own fetch path is how the 60/hr budget gets re-blown.
export async function ghGetJson(url, fetchImpl) {
  return getJson(url, fetchImpl);
}

async function getJson(url, fetchImpl) {
  const f = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!f) throw new Error('no fetch');
  const cache = getEtagCache();
  const hit = cache[url];
  const headers = { Accept: 'application/vnd.github+json' };
  if (hit && hit.etag) headers['If-None-Match'] = hit.etag;
  const r = await f(url, { headers });
  if (r.status === 304 && hit) {
    return hit.body; // free: a 304 does not count against the unauth limit
  }
  if (r.status === 403 || r.status === 429) {
    const err = new Error('rate-limited');
    err.rateLimited = true;
    throw err;
  }
  if (!r.ok) throw new Error('http ' + r.status);
  const body = await r.json();
  const etag = (r.headers && typeof r.headers.get === 'function') ? r.headers.get('etag') : null;
  if (etag) {
    cache[url] = { etag, body, at: Date.now() };
    persistEtagCache(cache);
  }
  return body;
}

// Share one live read across every panel on the screen: concurrent callers
// join the in-flight promise; a completed read is reused for OPS_TTL_MS.
// Injected-fetch calls (tests) bypass the share so fixtures stay isolated.
export const OPS_TTL_MS = 90 * 1000;
let opsInflight = null;
let opsLast = { at: 0, data: null };

export async function fetchOps(opts = {}) {
  if (!opts.fetch) {
    const now = Date.now();
    if (opsLast.data && now - opsLast.at < OPS_TTL_MS && !opts.force) return opsLast.data;
    if (opsInflight) return opsInflight;
    opsInflight = fetchOpsUncached(opts).then((data) => {
      opsLast = { at: Date.now(), data };
      opsInflight = null;
      return data;
    }, (e) => { opsInflight = null; throw e; });
    return opsInflight;
  }
  return fetchOpsUncached(opts);
}

// Pull the live orchestration picture. Returns a normalized, render-ready shape
// with an explicit `ok` / `notice` so the UI can show partial truth honestly.
async function fetchOpsUncached(opts = {}) {
  const fetchImpl = opts.fetch;
  const out = { ok: false, fetchedAt: null, main: null, mainCi: null, pulls: [], recentMerges: [], notice: null };
  try {
    const [pullsRaw, commitsRaw] = await Promise.all([
      getJson(`${API}/pulls?state=open&per_page=50`, fetchImpl),
      getJson(`${API}/commits?sha=main&per_page=8`, fetchImpl),
    ]);
    let pulls = normalizePulls(pullsRaw);
    const merges = normalizeCommits(commitsRaw);
    out.recentMerges = merges;
    out.main = merges[0] ? { sha: merges[0].sha, shortSha: merges[0].shortSha, title: merges[0].title } : null;

    // Lane per open PR — REAL changed files, bounded by the rate budget.
    const lookups = pulls.slice(0, MAX_PR_FILE_LOOKUPS);
    await Promise.all(lookups.map(async (p) => {
      try {
        const files = await getJson(`${API}/pulls/${p.number}/files?per_page=100`, fetchImpl);
        p.lane = classifyLane((files || []).map((f) => f && f.filename));
        p.fileCount = Array.isArray(files) ? files.length : 0;
      } catch (e) {
        if (e && e.rateLimited) throw e;
        p.lane = 'unknown';
      }
    }));
    if (pulls.length > MAX_PR_FILE_LOOKUPS) {
      out.notice = `Lane computed for the first ${MAX_PR_FILE_LOOKUPS} of ${pulls.length} open PRs (API rate budget).`;
    }
    pulls.forEach((p) => { if (!p.lane) p.lane = 'unknown'; });

    // Main CI health (best-effort; never fails the whole load).
    try {
      const runs = await getJson(`${API}/actions/runs?branch=main&per_page=5`, fetchImpl);
      out.mainCi = normalizeMainRuns(runs);
    } catch (_) { out.mainCi = null; }

    out.pulls = pulls;
    out.ok = true;
  } catch (e) {
    out.ok = out.pulls.length > 0;
    out.notice = e && e.rateLimited
      ? 'GitHub API rate limit reached (60/hr, unauthenticated). Showing what loaded; try again later.'
      : `Could not reach GitHub API: ${(e && e.message) || 'unknown'}. This surface reads live repo state; nothing is shown when it cannot.`;
  }
  return out;
}
