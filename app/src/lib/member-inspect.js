// =============================================================================
// member-inspect — pure rules for the member stewardship record (0122)
// =============================================================================
// Darrell 2026-07-27: "edit each member of the app position and inspect them
// to be sure of their services and status so qualitative information can help
// us keep track of satisfaction." Append-only observations; newest row = the
// member's current position/status; the sequence = the satisfaction track.
// QUALITY-OF-LIFE: a mirror for care, never a judge — the vocabulary is
// care-shaped, and the trend exists so a steward notices a person drifting
// toward hurting BEFORE they disappear.

export const MEMBER_STATUSES = ['new', 'active', 'away', 'stepping-back', 'inactive'];
export const SATISFACTION_LEVELS = ['thriving', 'steady', 'strained', 'hurting'];

const SAT_RANK = { thriving: 3, steady: 2, strained: 1, hurting: 0 };

/**
 * Validate one observation before insert. Returns { ok, problems }.
 * An observation must SAY something — position, satisfaction, or a note;
 * a bare status ping is allowed only when the status actually changes,
 * which the caller can't know here, so we require substance.
 */
export function validateObservation({ position, status, satisfaction, note } = {}) {
  const problems = [];
  if (status != null && !MEMBER_STATUSES.includes(status)) problems.push('unknown-status');
  if (satisfaction != null && satisfaction !== '' && !SATISFACTION_LEVELS.includes(satisfaction)) problems.push('unknown-satisfaction');
  const substantive = String(position || '').trim() || String(note || '').trim()
    || (satisfaction && SATISFACTION_LEVELS.includes(satisfaction)) || (status && MEMBER_STATUSES.includes(status));
  if (!substantive) problems.push('empty-observation');
  return { ok: problems.length === 0, problems };
}

/** Newest observation per member — the member's CURRENT position/status. */
export function latestByMember(rows) {
  const out = new Map();
  for (const r of Array.isArray(rows) ? rows : []) {
    const key = r.member_user_id;
    const prev = out.get(key);
    if (!prev || String(r.created_at) > String(prev.created_at)) out.set(key, r);
  }
  return out;
}

/**
 * Satisfaction trend for one member's rows (any order): compares the two most
 * recent rows THAT CARRY a satisfaction read. 'improving' | 'declining' |
 * 'steady' | null (fewer than two reads — no fabricated trend, DR-0076).
 */
export function satisfactionTrend(memberRows) {
  const reads = (Array.isArray(memberRows) ? memberRows : [])
    .filter((r) => SATISFACTION_LEVELS.includes(r.satisfaction))
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  if (reads.length < 2) return null;
  const [prev, last] = reads.slice(-2);
  const d = SAT_RANK[last.satisfaction] - SAT_RANK[prev.satisfaction];
  if (d > 0) return 'improving';
  if (d < 0) return 'declining';
  return 'steady';
}

/** Build the insert row; refuses an invalid observation (never launders one). */
export function buildObservation({ instanceId, memberUserId, recordedBy, position, status, satisfaction, note } = {}) {
  const check = validateObservation({ position, status, satisfaction, note });
  if (!check.ok) return { ok: false, problems: check.problems, row: null };
  if (!instanceId || !memberUserId || !recordedBy) return { ok: false, problems: ['missing-ids'], row: null };
  return {
    ok: true,
    problems: [],
    row: {
      instance_id: instanceId,
      member_user_id: memberUserId,
      recorded_by: recordedBy,
      position: String(position || '').trim() || null,
      status: MEMBER_STATUSES.includes(status) ? status : 'active',
      satisfaction: SATISFACTION_LEVELS.includes(satisfaction) ? satisfaction : null,
      note: String(note || '').trim() || null,
    },
  };
}
