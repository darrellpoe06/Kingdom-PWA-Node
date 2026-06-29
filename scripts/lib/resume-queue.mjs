// =============================================================================
// resume-queue.mjs — pure logic for the BOUNDED cap-resume queue (no I/O, no net).
// =============================================================================
// The testable core of the "resume already-approved work after a vendor cap/outage
// resets" bridge. This is a LOWER risk class than the open wake bridge: it only
// continues an EXPLICITLY APPROVED queue and makes no new decisions. The approval
// flag is the bounded guarantee — an item the human did not greenlight can never
// be eligible, no matter what else is true.
//
// Kept pure so the verification gate can prove it (DR-0076): every decision here
// is a deterministic function of its inputs and is unit-tested proven-to-catch.
//
// Contract:  infra/ai-orchestrator/portable/resume/RESUME-CONTRACT.md
//            infra/ai-orchestrator/portable/resume/approved-queue.schema.json
// Reuses the wake/handoff contract for each item's resume payload (no duplication):
//            scripts/lib/handoff.mjs  (validateHandoff, parseIsoMs)
//
// Trigger model (DR-0071 reconciliation): the always-on NAS scheduler fires this
// AFTER the vendor cap-reset window. The clock is only a POLL; the real gate is
// (a) the cap window being open and (b) an item being explicitly approved. The
// scheduler never invents work — no approved item => no-op.

import { validateHandoff, parseIsoMs } from './handoff.mjs';

// Lifecycle states for a queued task. Only 'pending' is eligible; everything else
// is terminal-or-busy, which makes the runner idempotent (a 'done' item is never
// resumed twice — the single-flight + status guard together).
export const QUEUE_STATUSES = ['pending', 'in_progress', 'done', 'failed', 'skipped'];

// --- format helper (minutes-since-midnight -> HH:MM) -------------------------
function fmtMin(m) {
  const h = Math.floor(m / 60) % 24;
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

// localWall(nowMs, tz) -> { minutes, dayKey }
// The wall-clock time in a named IANA timezone, derived purely from an epoch via
// Intl (deterministic given epoch + tz; no bare Date.now in the logic). minutes =
// minutes-since-local-midnight; dayKey = the local 'YYYY-MM-DD' (used as the
// once-per-local-day idempotency key so a misfiring scheduler can't double-run).
export function localWall(nowMs, tz = 'America/Chicago') {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date(nowMs)).map((x) => [x.type, x.value]));
  let hh = Number(p.hour);
  if (hh === 24) hh = 0; // some engines emit 24 for local midnight
  const mm = Number(p.minute);
  return { minutes: hh * 60 + mm, dayKey: `${p.year}-${p.month}-${p.day}` };
}

// capWindowOpen(nowMs, cfg) -> { open, reason, dayKey }
// True only once the local wall time has passed the cap-reset instant plus a small
// buffer (the vendor account's daily cap resets at resetHHMM local; we wait the
// buffer so a clock-skewed early fire never races the reset). Configurable so the
// exact reset time can be tuned without code changes. A malformed reset time is
// NOT-open (honest: never guess the window).
export function capWindowOpen(nowMs, cfg = {}) {
  const tz = cfg.tz || 'America/Chicago';
  const resetHHMM = cfg.resetHHMM || '04:30';
  const bufferMin = Number(cfg.bufferMin || 0);
  const [rh, rm] = String(resetHHMM).split(':').map(Number);
  if (!Number.isFinite(rh) || !Number.isFinite(rm) || rh < 0 || rh > 23 || rm < 0 || rm > 59) {
    return { open: false, reason: `bad reset time '${resetHHMM}'`, dayKey: null };
  }
  const resetMin = rh * 60 + rm + bufferMin;
  const { minutes, dayKey } = localWall(nowMs, tz);
  if (minutes >= resetMin) {
    return { open: true, reason: `cap window open (local ${fmtMin(minutes)} >= reset+buffer ${fmtMin(resetMin)} ${tz})`, dayKey };
  }
  return { open: false, reason: `before cap reset (local ${fmtMin(minutes)} < reset+buffer ${fmtMin(resetMin)} ${tz})`, dayKey };
}

// validateQueueItem(item) -> { ok, errors[] }
// An item is { id, approved, status, handoff, not_before? }. The resume payload is
// a full handoff (reused verbatim — same validator the wake bridge uses), so a cold
// vendor session can act on it with only the Charter + state pointer. 'approved'
// MUST be an explicit boolean: there is no default-true path.
export function validateQueueItem(item) {
  const errors = [];
  if (item === null || typeof item !== 'object' || Array.isArray(item)) {
    return { ok: false, errors: ['queue item must be a JSON object'] };
  }
  if (typeof item.id !== 'string' || item.id.length < 3) errors.push('id must be a string of length >= 3');
  if (typeof item.approved !== 'boolean') errors.push('approved must be an explicit boolean (the greenlight gate)');
  if (!QUEUE_STATUSES.includes(item.status)) errors.push(`status must be one of ${QUEUE_STATUSES.join('|')}`);
  if (item.not_before !== undefined && parseIsoMs(item.not_before) === null) {
    errors.push('not_before must be a UTC ISO-8601 datetime');
  }
  const hv = validateHandoff(item.handoff);
  if (!hv.ok) for (const e of hv.errors) errors.push(`handoff.${e}`);
  return { ok: errors.length === 0, errors };
}

// validateQueue(queue) -> { ok, errors[] }
// Top-level shape: { v:1, items:[...] }. Also catches duplicate ids (a dup would
// break idempotent status write-back).
export function validateQueue(queue) {
  const errors = [];
  if (queue === null || typeof queue !== 'object' || Array.isArray(queue)) {
    return { ok: false, errors: ['queue must be a JSON object'] };
  }
  if (queue.v !== 1) errors.push('v must be 1');
  if (!Array.isArray(queue.items)) {
    errors.push('items must be an array');
    return { ok: errors.length === 0, errors };
  }
  const seen = new Set();
  queue.items.forEach((it, i) => {
    const v = validateQueueItem(it);
    if (!v.ok) errors.push(`items[${i}] (${(it && it.id) || '?'}): ${v.errors.join('; ')}`);
    const id = it && it.id;
    if (id) { if (seen.has(id)) errors.push(`duplicate id '${id}'`); seen.add(id); }
  });
  return { ok: errors.length === 0, errors };
}

// selectEligible(queue, nowMs) -> { eligible[], skipped[{id,reason}] }
// THE bounded gate. An item is eligible ONLY when it is structurally valid AND
// approved === true AND status === 'pending' AND past any per-item not_before floor.
// Everything else is skipped with a logged reason. This is the single place the
// "already-approved only, no new decisions" guarantee lives.
export function selectEligible(queue, nowMs) {
  const eligible = [];
  const skipped = [];
  const items = (queue && Array.isArray(queue.items)) ? queue.items : [];
  for (const it of items) {
    const v = validateQueueItem(it);
    if (!v.ok) { skipped.push({ id: (it && it.id) || '?', reason: `invalid: ${v.errors.join('; ')}` }); continue; }
    if (it.approved !== true) { skipped.push({ id: it.id, reason: 'not approved (explicit greenlight required)' }); continue; }
    if (it.status !== 'pending') { skipped.push({ id: it.id, reason: `status=${it.status} (only pending is eligible; idempotent)` }); continue; }
    if (it.not_before !== undefined && nowMs < parseIsoMs(it.not_before)) {
      skipped.push({ id: it.id, reason: `before not_before floor ${it.not_before}` });
      continue;
    }
    eligible.push(it);
  }
  return { eligible, skipped };
}

// capCheck(state) -> { ok, reason }
// The per-run + per-day call/task ceilings (the BUDGET brake's count half; the $
// half lives in the runner's spend accounting, mirroring brakes.sh). BOTH ceilings
// must be configured (> 0) or it is a MISSING brake => not ok => inert. This is the
// same "unset == missing brake == do not act" rule the dollar budget uses.
export function capCheck(state = {}) {
  const callsToday = Number(state.callsToday || 0);
  const maxCallsPerDay = Number(state.maxCallsPerDay || 0);
  const tasksThisRun = Number(state.tasksThisRun || 0);
  const maxTasksPerRun = Number(state.maxTasksPerRun || 0);
  if (!(maxCallsPerDay > 0) || !(maxTasksPerRun > 0)) {
    return { ok: false, reason: 'call/task caps unset (missing brake)' };
  }
  if (callsToday >= maxCallsPerDay) return { ok: false, reason: `daily call cap reached (${callsToday} >= ${maxCallsPerDay})` };
  if (tasksThisRun >= maxTasksPerRun) return { ok: false, reason: `per-run task cap reached (${tasksThisRun} >= ${maxTasksPerRun})` };
  return { ok: true, reason: `caps ok (run ${tasksThisRun}/${maxTasksPerRun}, day ${callsToday}/${maxCallsPerDay})` };
}
