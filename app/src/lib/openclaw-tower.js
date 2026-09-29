// =============================================================================
// openclaw-tower -- is OpenClaw actually up on the 4070 tower, on which model,
// when did it last run, and are its brakes armed? Read live; unknown when unknown.
// =============================================================================
// DR-0670 (Darrell 2026-09-29: "Can we make the open claw work on the towers?").
//
// The tower (tlcmediadpt) is loopback-only on the tailnet: neither the browser
// nor the agent sandbox can reach it. The openclaw-tower workflow can -- it
// joins the tailnet, measures the box over ssh, and rewrites the body of one
// rolling issue labeled `openclaw-tower` with the record it measured
// (./openclaw-tower-record.js). This module reads that issue from the
// PUBLIC repo, unauthenticated, exactly as harvest-health and site-health do
// (DR-0121: the surface shows the probe's own numbers, never a second figure).
//
// UNKNOWN IS NEVER GREEN (DR-0076). No record, an unreadable record, a record
// that says the witness could not get in, or a record older than two witness
// cycles all read as UNKNOWN, with the reason in words.
// =============================================================================
import { GITHUB_SLUG, ghGetJson } from './github-ops.js';
import { parseRecord, RECORD_TITLE } from './openclaw-tower-record.js';

const API = 'https://api.github.com/repos/' + GITHUB_SLUG;

// The witness fires every 6 h; two missed cycles and the reading is stale.
export const STALE_AFTER_HOURS = 13;

const ageHours = (iso, nowMs) => {
  const t = Date.parse(iso || '');
  return Number.isFinite(t) ? (nowMs - t) / 3600000 : null;
};

/**
 * The verdict the strip renders. Pure and clock-injected.
 * Returns {
 *   state: 'up' | 'down' | 'unknown',
 *   label, reason,
 *   model: { name, present } | null,
 *   lastRun: {...} | null,
 *   brakes: { budget: bool|null, lock: bool|null, kill: bool|null, killReason },
 *   roles: [{ name, role, live, reason }],
 *   measuredAt, ageHours
 * }
 */
export function deriveTowerStatus(record, { nowMs = Date.now() } = {}) {
  const unknown = (reason, extra = {}) => ({
    state: 'unknown',
    label: 'unknown',
    reason,
    model: null,
    lastRun: null,
    brakes: { budget: null, lock: null, kill: null, killReason: null },
    roles: [],
    measuredAt: null,
    ageHours: null,
    ...extra,
  });
  if (!record || typeof record !== 'object') return unknown('no witness record yet -- the lane has not measured the tower');
  const age = ageHours(record.measuredAt, nowMs);
  const base = { measuredAt: record.measuredAt || null, ageHours: age === null ? null : Math.round(age * 10) / 10 };
  if (record.reachable !== true) {
    return unknown(record.reason || 'the witness could not reach the tower', base);
  }
  if (age === null) return unknown('the record carries no measurement time', base);
  if (age > STALE_AFTER_HOURS) return unknown(`last measured ${Math.round(age)} h ago -- older than two witness cycles`, base);

  const hz = record.gateway ? record.gateway.healthz : null;
  const roles = record.brakes && Array.isArray(record.brakes.kill) ? record.brakes.kill : [];
  const report = roles.find((r) => r && r.role === 'report') || null;
  const kill = roles.length ? roles.every((r) => r && r.live === true) : null;
  const killReason = roles.filter((r) => r && r.live !== true).map((r) => `${r.name}: ${r.reason || 'off'}`).join('; ') || null;
  const lockReading = record.brakes ? record.brakes.lock : null;
  const out = {
    ...base,
    model: record.model ? { name: record.model.name || null, present: record.model.present === true ? true : record.model.present === false ? false : null } : null,
    lastRun: record.lastRun || null,
    brakes: {
      budget: record.brakes && typeof record.brakes.budget === 'boolean' ? record.brakes.budget : null,
      lock: lockReading && typeof lockReading.held === 'boolean' ? true : null,
      kill,
      killReason,
      paused: record.brakes ? record.brakes.paused || null : null,
    },
    roles,
    reportLive: report ? report.live === true : null,
  };
  if (hz === null || hz === undefined) return { ...out, state: 'unknown', label: 'unknown', reason: 'the gateway health was not read on the last fire' };
  if (hz !== 200) return { ...out, state: 'down', label: `gateway not answering (healthz ${hz})`, reason: record.reason || null };
  if (out.model && out.model.present === false) {
    return { ...out, state: 'down', label: `gateway up, model ${out.model.name || ''} not pulled`, reason: 'the configured model is missing from Ollama on the tower' };
  }
  return { ...out, state: 'up', label: 'gateway up on the tower', reason: null };
}

export const OPENCLAW_TOWER_TTL_MS = 90 * 1000;
let inflight = null;
let last = { at: 0, data: null };

export async function fetchOpenclawTower(opts = {}) {
  if (!opts.fetch) {
    const now = Date.now();
    if (last.data && now - last.at < OPENCLAW_TOWER_TTL_MS && !opts.force) return last.data;
    if (inflight) return inflight;
    inflight = fetchUncached(opts).then((data) => {
      last = { at: Date.now(), data };
      inflight = null;
      return data;
    }, (e) => { inflight = null; throw e; });
    return inflight;
  }
  return fetchUncached(opts);
}

async function fetchUncached(opts = {}) {
  try {
    const issues = await ghGetJson(`${API}/issues?labels=openclaw-tower&state=all&per_page=5`, opts.fetch);
    const list = Array.isArray(issues) ? issues : [];
    const rec = list.find((i) => i && String(i.title || '') === RECORD_TITLE) || list[0] || null;
    const record = rec ? parseRecord(rec.body || '') : null;
    return { ok: true, url: rec ? rec.html_url || null : null, status: deriveTowerStatus(record, { nowMs: opts.nowMs || Date.now() }) };
  } catch (e) {
    return { ok: false, notice: (e && e.message) || 'could not read the tower record', status: deriveTowerStatus(null) };
  }
}
