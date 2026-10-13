// =============================================================================
// scribe-minutes — load rules + lifecycle for scribe_sessions (migration 0121)
// =============================================================================
// DR-0236: the join between a Scribe recording and the real record it feeds.
// A session row is refused before it exists unless it carries what the schema
// demands (the same consent/cap rules the browser gate and the NAS ingest hold
// — three independent enforcements, DR-0076); its lifecycle moves one honest
// step at a time (recorded → queued → transcribed → minuted, failed from the
// working states) so a surface can never claim "minuted" for a session whose
// transcript never existed; and only a 'meeting' session may join a
// ministry_meetings row (DR-0182).
import { SCRIBE_MAX_DURATION_MIN, SCRIBE_KINDS, validateManifest } from './workflow-scribe.js';

export const SCRIBE_STATUSES = ['recorded', 'queued', 'transcribed', 'minuted', 'failed'];

// The honest lifecycle: no skipping, no un-failing without a new recording.
const TRANSITIONS = {
  recorded: ['queued'],
  queued: ['transcribed', 'failed'],
  transcribed: ['minuted', 'failed'],
  minuted: [],
  failed: [],
};

/** Is a status move legal? Pure. */
export function canTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

/**
 * Validate a session row before insert. Returns { ok, problems } — the same
 * vocabulary as validateManifest so a gate failure reads the same on every
 * layer.
 */
export function validateSessionRow(row) {
  const problems = [];
  const r = row || {};
  if (!r.session_id) problems.push('missing-session-id');
  if (!SCRIBE_KINDS.includes(r.kind)) problems.push('unknown-kind');
  const secs = Number(r.seconds) || 0;
  if (secs < 0 || secs > SCRIBE_MAX_DURATION_MIN * 60) problems.push('over-duration-cap');
  if (!r.consent || !r.consent.allConsented) problems.push('consent-missing');
  if (r.status && !SCRIBE_STATUSES.includes(r.status)) problems.push('unknown-status');
  if (r.meeting_id && r.kind !== 'meeting') problems.push('meeting-join-requires-meeting-kind');
  return { ok: problems.length === 0, problems };
}

/**
 * Map a capture manifest (workflow-scribe.js buildManifest) to a row for
 * scribe_sessions. Refuses an invalid manifest rather than mapping it —
 * the row never launders a bad capture into "real data".
 */
export function buildSessionRow(manifest, { instanceId, userId, meetingId = null } = {}) {
  const check = validateManifest(manifest);
  if (!check.ok) return { ok: false, problems: check.problems, row: null };
  if (meetingId && manifest.kind !== 'meeting') {
    return { ok: false, problems: ['meeting-join-requires-meeting-kind'], row: null };
  }
  if (!instanceId || !userId) {
    return { ok: false, problems: ['missing-tenant-or-user'], row: null };
  }
  return {
    ok: true,
    problems: [],
    row: {
      instance_id: instanceId,
      session_id: manifest.sessionId,
      kind: manifest.kind,
      meeting_id: meetingId,
      seconds: manifest.seconds,
      consent: manifest.consent,
      steps: manifest.steps,
      status: 'recorded',
      created_by: userId,
    },
  };
}

/**
 * Attach transcript / minutes coming back from the NAS consumer. Enforces the
 * lifecycle: a transcript lands only on a queued session, minutes only on a
 * transcribed one.
 */
export function applyPipelineResult(session, { transcript, minutesMd } = {}) {
  const s = session || {};
  if (transcript != null) {
    if (!canTransition(s.status, 'transcribed')) return { ok: false, problem: `illegal-transition:${s.status}->transcribed` };
    return { ok: true, patch: { transcript, status: 'transcribed' } };
  }
  if (minutesMd != null) {
    if (!canTransition(s.status, 'minuted')) return { ok: false, problem: `illegal-transition:${s.status}->minuted` };
    return { ok: true, patch: { minutes_md: String(minutesMd), status: 'minuted' } };
  }
  return { ok: false, problem: 'nothing-to-apply' };
}
