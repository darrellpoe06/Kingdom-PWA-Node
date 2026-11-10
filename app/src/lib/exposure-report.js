// =============================================================================
// exposure-report — what an attacker would actually use, ranked, read LIVE on
// the board (DR-1408)
// =============================================================================
// Darrell 2026-11-10: "workflows that make sure we are secure as we can without
// undermining our processes and conditions report before and location should be
// inside the PoeTech App space". .github/workflows/exposure-report.yml ranks
// every known vulnerability in what we ship by Gartner's four elements (threat
// intelligence, asset context, exploitability, control validation) and writes
// the conditions, before any fix, into the rolling `exposure-report` issue as a
// fenced JSON block. This module reads that issue live (DR-0121: no static
// data) with the board's own rate discipline (ghGetJson, ETag reads).
//
// FOUR STATES, EACH SAID AS ITSELF (DR-0076): the read failed; no report yet;
// a report that will not parse; a report too old to be current. None renders
// as "nothing exposed". Every number shown came out of the report's JSON.
// =============================================================================
import { GITHUB_SLUG, ghGetJson } from './github-ops.js';

const API = 'https://api.github.com/repos/' + GITHUB_SLUG;

/** The job runs weekly; twice missed is stale, not current. */
export const EXPOSURE_STALE_MS = 15 * 24 * 60 * 60 * 1000;
export const TIER_LABEL = { 'act-now': 'Act now', plan: 'Plan', watch: 'Watch' };

/** Pull the report out of the issue body's fenced JSON block. */
export function parseExposureBody(body) {
  const m = String(body || '').match(/```json\s*\n([\s\S]*?)\n```/);
  if (!m) return { ok: false, why: 'the report issue carries no report block' };
  let doc;
  try {
    doc = JSON.parse(m[1]);
  } catch (e) {
    return { ok: false, why: `the report block does not parse: ${(e && e.message) || 'unknown'}` };
  }
  if (!doc || doc.kind !== 'exposure-report' || !doc.counts || !Array.isArray(doc.items)) {
    return { ok: false, why: 'the report block is not an exposure report' };
  }
  return { ok: true, report: doc };
}

/** The one line the board shows, and its tone. Unknown is never "clear". */
export function exposureVerdict(parsed, { now = Date.now() } = {}) {
  if (!parsed || !parsed.ok) return { tone: 'unknown', line: (parsed && parsed.why) || 'the exposure report could not be read' };
  const r = parsed.report;
  const at = Date.parse(r.readAt);
  if (!Number.isFinite(at)) return { tone: 'unknown', line: 'the report carries no reading time, so its age is unknown' };
  if (now - at > EXPOSURE_STALE_MS) return { tone: 'unknown', line: `the last report is from ${r.readAt.slice(0, 10)}, too old to be current` };
  const c = r.counts;
  const unknownFeeds = Object.entries(r.sources || {})
    .filter(([, v]) => /^unknown/.test(String(v)))
    .map(([k]) => k);
  const tail = unknownFeeds.length ? `; could not read: ${unknownFeeds.join(', ')}` : '';
  if (c['act-now'] > 0) return { tone: 'bad', line: `${c['act-now']} to act on now, ${c.plan} to plan, ${c.watch} to watch${tail}` };
  if (c.plan > 0 || unknownFeeds.length) return { tone: 'warn', line: `nothing to act on now; ${c.plan} to plan, ${c.watch} to watch${tail}` };
  return { tone: 'ok', line: `nothing to act on now or plan; ${c.watch} to watch` };
}

/** Read the newest report issue (explicitly sorted, P62). */
export async function fetchExposureReport(opts = {}) {
  const out = { ok: false, parsed: null, verdict: null, reportUrl: null, notice: null };
  try {
    const raw = await ghGetJson(`${API}/issues?labels=exposure-report&state=all&sort=created&direction=desc&per_page=1`, opts.fetch);
    const issue = (Array.isArray(raw) ? raw.filter((i) => i && !i.pull_request) : [])[0] || null;
    out.reportUrl = (issue && issue.html_url) || null;
    out.parsed = issue ? parseExposureBody(issue.body) : { ok: false, why: 'the exposure report has not been filed yet' };
    out.ok = !!out.parsed.ok;
  } catch (e) {
    out.notice =
      e && e.rateLimited
        ? 'GitHub API rate limit reached (60/hr, unauthenticated). Try again later.'
        : `Could not read the exposure report: ${(e && e.message) || 'unknown'}. Nothing is invented when the read fails.`;
    out.parsed = { ok: false, why: 'the exposure report could not be read' };
  }
  out.verdict = exposureVerdict(out.parsed, { now: opts.now || Date.now() });
  return out;
}
