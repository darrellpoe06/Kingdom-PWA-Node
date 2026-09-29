// =============================================================================
// openclaw-tower-record.js -- the tower's witness record: one JSON shape, written by the lane,
// read live by the app (DR-0670)
// =============================================================================
// The app cannot reach the tower (it is loopback-only on the tailnet), and the
// agent sandbox cannot either. The openclaw-tower workflow CAN: it joins the
// tailnet, reads the tower over ssh, and writes what it MEASURED into the body
// of one rolling GitHub issue (label `openclaw-tower`). The OpsBoard reads that
// issue live from the public repo -- the harvest-health / site-health pattern
// (DR-0121: the app shows the probe's own numbers, never a second figure).
//
// It lives in app/src/lib so the app and the workflow (node, on a GitHub
// runner) import ONE shape. composeRecord() builds the record from the probe; parseRecord() reads it
// back. Both pure; the round trip is pinned in vitest. Unknown stays null --
// never a guess, never a default green (DR-0076).
// =============================================================================

export const RECORD_MARKER = 'openclaw-tower-record v1';
export const RECORD_TITLE = 'openclaw-tower: OpenClaw on the 4070 tower -- witness record';

const numOrNull = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));

/**
 * probe: {
 *   measuredAt, host, reachable, road,           -- did the witness get in, and how
 *   healthz, readyz,                              -- HTTP codes from the gateway on the box
 *   containerState,                               -- `docker inspect` State.Status
 *   model, modelPresent,                          -- the configured model, and whether `ollama list` has it
 *   imageRef,                                     -- the pinned image the compose names
 *   status,                                       -- the runner's state/status.json (last pilot run), or null
 *   roles,                                        -- [{ name, role, live, reason }] from brakes.killState on main
 *   budgetOk, lockHeld, lockAgeSeconds,           -- brake readings
 *   reason                                        -- why a reading is missing, in words
 * }
 */
export function composeRecord(probe = {}) {
  const p = probe || {};
  const status = p.status && typeof p.status === 'object' ? p.status : null;
  return {
    marker: RECORD_MARKER,
    measuredAt: p.measuredAt || null,
    host: p.host || null,
    reachable: p.reachable === true ? true : p.reachable === false ? false : null,
    road: p.road || null,
    gateway: {
      healthz: numOrNull(p.healthz),
      readyz: numOrNull(p.readyz),
      container: p.containerState || null,
      image: p.imageRef || null,
    },
    model: {
      name: p.model || null,
      present: p.modelPresent === true ? true : p.modelPresent === false ? false : null,
    },
    lastRun: status
      ? {
          at: status.at || null,
          role: status.loop || null,
          verdict: status.verdict || null,
          ok: status.ok === true ? true : status.ok === false ? false : null,
          reason: status.reason || null,
          turns: numOrNull(status.turns),
          toolCalls: numOrNull(status.toolCalls),
          elapsedMs: numOrNull(status.elapsedMs),
          report: status.report ? String(status.report).slice(0, 1500) : null,
        }
      : null,
    brakes: {
      budget: p.budgetOk === true ? true : p.budgetOk === false ? false : null,
      lock: p.lockHeld === true ? { held: true, ageSeconds: numOrNull(p.lockAgeSeconds) } : p.lockHeld === false ? { held: false } : null,
      kill: Array.isArray(p.roles) ? p.roles.map((r) => ({ name: r.name, role: r.role, live: r.live === true, reason: r.reason || null })) : null,
      paused: status && status.paused ? status.paused : null,
    },
    reason: p.reason || null,
  };
}

/** The issue body: a human paragraph, then the record as a fenced JSON block. */
export function renderIssueBody(record) {
  const r = record || {};
  const up = r.gateway && r.gateway.healthz === 200;
  const line = r.reachable === false
    ? `The witness could not reach the tower: ${r.reason || 'no reason recorded'}.`
    : up
      ? `Gateway answering on the tower (healthz 200); model ${r.model && r.model.name ? r.model.name : 'unknown'}${r.model && r.model.present === false ? ' (NOT pulled)' : ''}.`
      : `Gateway NOT answering on the tower (healthz ${r.gateway && r.gateway.healthz !== null ? r.gateway.healthz : 'unknown'}).`;
  return [
    `**OpenClaw on the 4070 tower -- measured ${r.measuredAt || 'at an unknown time'}.**`,
    '',
    line,
    '',
    'This body is rewritten by `.github/workflows/openclaw-tower.yml` on every fire and read live by the OpsBoard. DR-0670.',
    '',
    `<!-- ${RECORD_MARKER} -->`,
    '```json',
    JSON.stringify(r, null, 2),
    '```',
  ].join('\n');
}

/** Read the record back out of an issue body. Returns null when absent or unreadable. */
export function parseRecord(body = '') {
  const s = String(body || '');
  const at = s.indexOf(`<!-- ${RECORD_MARKER} -->`);
  if (at < 0) return null;
  const rest = s.slice(at);
  const m = rest.match(/```json\s*([\s\S]*?)```/);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[1]);
    return obj && obj.marker === RECORD_MARKER ? obj : null;
  } catch {
    return null;
  }
}
