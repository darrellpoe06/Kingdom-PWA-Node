// =============================================================================
// ops-commands — the app-first operations queue (DR-0088)
// =============================================================================
// "I want all loops and responsibilities to be based on the PoeTech App as my
// assistant... have an admin space in the app... based on my profile."
// (Darrell, 2026-07-03.) Operational work is TRIGGERED and OBSERVED inside the
// app; the NAS is plumbing, never the front door.
//
// HOW IT MOVES. The cloud app can never reach the LAN-only NAS (P18), so the
// two meet in the database: this module INSERTs a command row into
// ops_commands (migration 0068) under the signed-in steward's own role, and
// the NAS ops-runner (infra/nas-sme-pipeline/ops-runner.py, service role,
// outbound-only poll) executes it and streams status + log back into the row.
// This module then watches the row move queued -> running -> done live via
// realtime. Command latency = the runner's poll interval (~1 min).
//
// ACCESS mirrors the RLS wall (0068): owner/admin ONLY, in every direction.
// The surface additionally renders the controls only for access.canEdit —
// RLS is the real wall either way; a non-steward read degrades to [].
//
// THE JOB LIST HERE IS DISPLAY METADATA. The executable whitelist lives in
// ops-runner.py (JOBS) — a job queued here that the runner doesn't know is
// marked 'skipped', never executed. ops-commands.test.js guards that every
// job offered here exists in the runner's whitelist.
// =============================================================================
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';

// Jobs the admin card offers. Keys MUST exist in ops-runner.py JOBS.
export const OPS_JOBS = {
  'transcript-backfill': {
    label: 'Fetch next transcripts',
    description: 'Runs the NAS transcript loader once with a small budget; the Harvest % climbs as rows land.',
    defaults: { max: 10 },
  },
  'resume-transcripts': {
    label: 'Resume after YouTube block',
    description: 'Clears the loader’s kill-switch once the IP block has cooled, so fetching can continue.',
    defaults: {},
  },
};

// --- Pure mappers / helpers ---------------------------------------------------

export function toCommandShape(row) {
  return {
    id: row.id,
    job: row.job,
    params: row.params && typeof row.params === 'object' ? row.params : {},
    status: row.status || 'queued',
    log: typeof row.log === 'string' ? row.log : null,
    result: row.result && typeof row.result === 'object' ? row.result : null,
    createdAt: row.created_at ?? null,
    startedAt: row.started_at ?? null,
    finishedAt: row.finished_at ?? null,
  };
}

// A command still queued after this long (with nothing running) suggests the
// NAS runner isn't armed/online — surfaced honestly instead of a silent hang.
export const STALE_QUEUED_MS = 5 * 60 * 1000;

export function runnerHint(commands, nowMs) {
  const list = commands || [];
  if (list.some((c) => c.status === 'running')) return 'running';
  const queued = list.filter((c) => c.status === 'queued');
  if (!queued.length) return null;
  const oldest = queued.reduce((min, c) => {
    const t = Date.parse(c.createdAt || '');
    return Number.isFinite(t) ? Math.min(min, t) : min;
  }, nowMs);
  return nowMs - oldest > STALE_QUEUED_MS ? 'queued-stale' : 'queued';
}

// --- Writes (owner/admin via RLS; fail soft) ----------------------------------

async function writeContext(displayName) {
  const { data } = await supabase.auth.getSession();
  const session = data.session ?? null;
  if (!session) return { error: 'signed-out' };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { error: 'no-church' };
  return { tenantId, userId: session.user.id };
}

export async function queueCommand(job, params, displayName) {
  if (!OPS_JOBS[job]) return { skipped: 'bad-job' };
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const { error } = await supabase.from('ops_commands').insert({
    instance_id: ctx.tenantId,
    requested_by: ctx.userId,
    job,
    params: { ...OPS_JOBS[job].defaults, ...(params || {}) },
  });
  return error ? { skipped: 'insert-error', error } : { queued: true };
}

// Cancel is only meaningful while still queued — the guard is in the .eq so a
// race with the runner (already running) is a harmless no-op.
export async function cancelCommand(id) {
  const { error } = await supabase.from('ops_commands')
    .update({ status: 'skipped' })
    .eq('id', id)
    .eq('status', 'queued');
  return error ? { skipped: 'update-error', error } : { cancelled: true };
}

// --- Reads / live subscription -------------------------------------------------

export async function fetchCommands(limit = 8) {
  const { data, error } = await supabase
    .from('ops_commands')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('[ops-commands] fetch failed:', error);
    return [];
  }
  return (data || []).map(toCommandShape);
}

// Initial load + live refresh whenever any command row changes. Returns an
// unsubscribe fn. Mirrors subscribeLedger (harvest-ledger.js).
export function subscribeOpsCommands(onChange) {
  let cancelled = false;
  let channel = null;
  const refresh = () => {
    fetchCommands().then((rows) => { if (!cancelled) onChange(rows); });
  };
  (async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session || cancelled) return;
    refresh();
    channel = supabase
      .channel('ops-commands')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ops_commands' }, refresh)
      .subscribe();
  })();
  return function unsubscribe() {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
}
