// =============================================================================
// intake-autofix — the brakes of the low-hanging-fruit fix lane (DR-0622)
// =============================================================================
// Darrell 2026-09-24: "if it's low hanging fruit, then we fix it. The system
// fixes it automatically". The fixer is an AI session (a Claude Code Routine),
// so this is the AI class: it keeps the FULL brake set (CLAUDE.md "Autonomous
// Automation Requires Three Brakes", as amended by DR-0247/DR-0248: the heavier
// AI-class gates keep budget, lock AND kill-switch), and it is armed by record
// (DR-0247): the committed infra/intake-autofix/ARMED-BY-RECORD is the arm, so
// merge = started; deleting it, or committing PAUSED, is the brake.
//
// PURE. The runner (scripts/intake-autofix.mjs) gathers the state and this
// decides. Every brake is proven to catch in app/src/__tests__/intake-autofix
// .test.js.
//
//   BUDGET     one item per run; at most DAILY_MAX fix branches opened in any
//              24 hours; at most MAX_ATTEMPTS tries per note; the Routine's own
//              session carries a wall-clock limit in its prompt.
//   LOCK       single instance: an open intake-fix pull request, or a row
//              claimed within LOCK_HOURS, means the next run SKIPS.
//   KILL       PAUSED on record stops everything; and the lane pauses ITSELF
//              after FAIL_STREAK failures in a row, until a person commits a
//              RESUME-AFTER date later than the last failure.
//   SCOPE      only rows the categorizer put in `fix`, with scope copy or style;
//              the branch diff is checked again by
//              scripts/intake-autofix-scope-guard.mjs in CI.
// =============================================================================

export const AUTOFIX = Object.freeze({
  DAILY_MAX: 3,
  MAX_ATTEMPTS: 2,
  LOCK_HOURS: 2,
  FAIL_STREAK: 3,
  STALE_PR_HOURS: 6,
  BRANCH_PREFIX: 'claude/intake-fix-',
  SCOPES: ['copy', 'style'],
});

const HOUR = 3600000;
const t = (s) => { const n = Date.parse(s || ''); return Number.isFinite(n) ? n : NaN; };

export function branchFor(queueId) {
  return `${AUTOFIX.BRANCH_PREFIX}${String(queueId || '').replace(/[^0-9a-f]/gi, '').slice(0, 12).toLowerCase()}`;
}

export function queueIdPrefixOf(branch) {
  const m = new RegExp(`^${AUTOFIX.BRANCH_PREFIX.replace(/[/-]/g, '\\$&')}([0-9a-f]{8,12})$`).exec(String(branch || ''));
  return m ? m[1] : null;
}

/**
 * The self-pause: the last FAIL_STREAK finished rows (merged or failed, newest
 * first) all failed, and none of those failures is older than the committed
 * resume date. Returns { paused, reason }.
 */
export function selfPause(queue = [], resumeAfter = '') {
  const since = t(resumeAfter);
  const finished = queue
    .filter((q) => q && (q.status === 'merged' || q.status === 'failed') && Number.isFinite(t(q.finished_at)))
    .filter((q) => !Number.isFinite(since) || t(q.finished_at) > since)
    .sort((a, b) => t(b.finished_at) - t(a.finished_at));
  const last = finished.slice(0, AUTOFIX.FAIL_STREAK);
  if (last.length === AUTOFIX.FAIL_STREAK && last.every((q) => q.status === 'failed')) {
    return { paused: true, reason: `The last ${AUTOFIX.FAIL_STREAK} system fixes all failed; the lane paused itself. A person commits infra/intake-autofix/RESUME-AFTER with a later date to resume.` };
  }
  return { paused: false, reason: '' };
}

/**
 * decideHandout — may this run hand one item to the fixer, and which one?
 * state: { armed, pausedOnRecord, resumeAfter, queue, openFixPrs, fixPrsOpened24h, nowMs }
 * Returns { go, reason, item? } — the reason is always said, go or not.
 */
export function decideHandout(state = {}) {
  const now = Number.isFinite(state.nowMs) ? state.nowMs : NaN;
  const queue = Array.isArray(state.queue) ? state.queue : [];
  if (!state.armed) return { go: false, brake: 'arm', reason: 'Not armed: infra/intake-autofix/ARMED-BY-RECORD is not on this commit.' };
  if (state.pausedOnRecord) return { go: false, brake: 'kill', reason: 'Paused on record: infra/intake-autofix/PAUSED is committed.' };
  const sp = selfPause(queue, state.resumeAfter);
  if (sp.paused) return { go: false, brake: 'kill', reason: sp.reason };
  if (!Number.isFinite(now)) return { go: false, brake: 'clock', reason: 'No clock was given; nothing is handed out on an unknown time.' };
  if ((state.openFixPrs || 0) > 0) return { go: false, brake: 'lock', reason: `A system fix is already open (${state.openFixPrs}); one at a time.` };
  const claimed = queue.find((q) => q && q.status === 'claimed' && now - t(q.claimed_at) < AUTOFIX.LOCK_HOURS * HOUR);
  if (claimed) return { go: false, brake: 'lock', reason: `Item ${String(claimed.id).slice(0, 8)} was claimed under ${AUTOFIX.LOCK_HOURS} hours ago; one at a time.` };
  if ((state.fixPrsOpened24h || 0) >= AUTOFIX.DAILY_MAX) return { go: false, brake: 'budget', reason: `${state.fixPrsOpened24h} system fixes were opened in the last 24 hours (the budget is ${AUTOFIX.DAILY_MAX}).` };
  const item = queue
    .filter((q) => q && q.status === 'queued' && (q.attempts || 0) < AUTOFIX.MAX_ATTEMPTS && AUTOFIX.SCOPES.includes(q.scope))
    .sort((a, b) => t(a.created_at) - t(b.created_at) || String(a.id).localeCompare(String(b.id)))[0];
  if (!item) return { go: false, brake: 'empty', reason: 'Nothing is waiting in the fix queue.' };
  return { go: true, brake: '', reason: `Handing out ${String(item.id).slice(0, 8)} (${item.rule}, scope ${item.scope}).`, item, branch: branchFor(item.id) };
}

/**
 * reconcile — each claimed / opened row read against the pull requests for its
 * branch. Returns the row updates to write and the stale fix PRs to close.
 * prs: [{ number, title, branch, state ('open'|'closed'), merged (bool), createdAt, closedAt }]
 */
export function reconcile({ queue = [], prs = [], nowMs } = {}) {
  const updates = [];
  const closePrs = [];
  const byPrefix = new Map();
  for (const p of prs) {
    const pre = queueIdPrefixOf(p.branch);
    if (pre) byPrefix.set(pre, [...(byPrefix.get(pre) || []), p]);
  }
  for (const q of queue) {
    if (!q || !['claimed', 'opened'].includes(q.status)) continue;
    const pre = String(q.id).replace(/[^0-9a-f]/gi, '').slice(0, 12).toLowerCase();
    const mine = (byPrefix.get(pre) || []).sort((a, b) => t(b.createdAt) - t(a.createdAt));
    const pr = mine[0];
    if (pr && pr.merged) { updates.push({ id: q.id, feedback_id: q.feedback_id, status: 'merged', pr_number: pr.number, pr_title: pr.title }); continue; }
    if (pr && pr.state === 'closed') { updates.push({ id: q.id, feedback_id: q.feedback_id, status: 'failed', pr_number: pr.number, last_error: 'The fix was closed without merging.' }); continue; }
    if (pr && pr.state === 'open') {
      if (Number.isFinite(nowMs) && nowMs - t(pr.createdAt) > AUTOFIX.STALE_PR_HOURS * HOUR) {
        closePrs.push(pr.number);
        updates.push({ id: q.id, feedback_id: q.feedback_id, status: 'failed', pr_number: pr.number, last_error: `The fix did not pass the checks within ${AUTOFIX.STALE_PR_HOURS} hours.` });
      } else if (q.status !== 'opened') {
        updates.push({ id: q.id, feedback_id: q.feedback_id, status: 'opened', pr_number: pr.number, pr_title: pr.title });
      }
      continue;
    }
    // Claimed and no branch ever opened: a claim that outlives the lock failed.
    if (q.status === 'claimed' && Number.isFinite(nowMs) && nowMs - t(q.claimed_at) >= AUTOFIX.LOCK_HOURS * HOUR) {
      updates.push({ id: q.id, feedback_id: q.feedback_id, status: (q.attempts || 0) >= AUTOFIX.MAX_ATTEMPTS ? 'failed' : 'queued', last_error: 'The fixer claimed it and opened nothing.' });
    }
  }
  return { updates, closePrs };
}
