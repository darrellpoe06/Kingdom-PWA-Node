// =============================================================================
// giving-records-sync — Supabase I/O for the giver's own record (table 0184).
// =============================================================================
// Mirrors the established church-surface pattern (bus-ministry-sync, choir-sync):
// writeContext() resolves the church tenant BEFORE any write so RLS passes, and
// every call returns an honest, distinguishable outcome instead of throwing.
//
// HONEST STATES ARE THE WHOLE POINT (DR-0076). "No rows" is not "signed out" is
// not "the read failed" — the surface renders a different, truthful thing for
// each, so a signed-in member is never told to sign in because a fetch hiccuped.
// Outcomes: { ok:true, records } | { ok:false, reason: 'signed-out'|'no-church'|'error' }.
//
// TIMEOUTS ARE EXPLICIT (SOUL.md DoD #3). Every network call races a deadline,
// so a hung request surfaces as an honest error the member can retry instead of
// a spinner that never resolves.
//
// The pure shapes, validation and totals live in giving-records.js and are
// re-exported here for the surface's convenience.
// =============================================================================
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';
import { toGivingRow, fromGivingRow, newSlug, validateGivingDraft } from './giving-records.js';

export * from './giving-records.js';

const TABLE = 'giving_records';
const DEADLINE_MS = 12000;

// withDeadline — an async routine that cannot hang forever. Rejects with a
// named error so the caller reports 'error' (a real failure) rather than
// silently resolving to an empty list that would read as "you've given nothing."
function withDeadline(promise, ms = DEADLINE_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('giving-records: request timed out')), ms);
    Promise.resolve(promise).then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

async function currentSession() {
  try {
    const { data } = await withDeadline(supabase.auth.getSession());
    return data?.session ?? null;
  } catch {
    return null;
  }
}

async function writeContext(displayName) {
  const session = await currentSession();
  if (!session) return { reason: 'signed-out' };
  let tenantId;
  try {
    tenantId = await withDeadline(churchInstanceId(displayName));
  } catch {
    return { reason: 'error' };
  }
  if (!tenantId) return { reason: 'no-church' };
  return { tenantId, userId: session.user.id };
}

// fetchMyGiving — the member's own rows, newest first. RLS is the real gate:
// created_by = auth.uid() means this query can only ever return the caller's
// own gifts, whatever the client asks for.
export async function fetchMyGiving(displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.reason) return { ok: false, reason: ctx.reason, records: [] };
  try {
    const { data, error } = await withDeadline(
      supabase
        .from(TABLE)
        .select('id, slug, given_on, amount, fund, fund_note, method, reference, note, created_at')
        .eq('created_by', ctx.userId)
        .order('given_on', { ascending: false })
        .limit(500),
    );
    if (error) return { ok: false, reason: 'error', records: [] };
    return { ok: true, records: (data || []).map(fromGivingRow), tenantId: ctx.tenantId };
  } catch {
    return { ok: false, reason: 'error', records: [] };
  }
}

// recordGiving — write one gift. Validation runs here too (never trust that the
// form checked): an invalid draft is refused with its field errors, and no
// partial row reaches the table.
export async function recordGiving(draft, displayName) {
  const check = validateGivingDraft(draft);
  if (!check.ok) return { ok: false, reason: 'invalid', errors: check.errors };

  const ctx = await writeContext(displayName);
  if (ctx.reason) return { ok: false, reason: ctx.reason };

  const row = toGivingRow(draft, { tenantId: ctx.tenantId, userId: ctx.userId, slug: newSlug() });
  try {
    const { data, error } = await withDeadline(supabase.from(TABLE).insert(row).select().single());
    if (error) return { ok: false, reason: 'error' };
    return { ok: true, record: fromGivingRow(data) };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

// removeGiving — delete one of the member's own entries (a typo, a duplicate).
// RLS restricts the delete to the caller's rows; the created_by filter is the
// belt beside that suspenders.
export async function removeGiving(remoteUuid, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.reason) return { ok: false, reason: ctx.reason };
  try {
    const { error } = await withDeadline(
      supabase.from(TABLE).delete().eq('id', remoteUuid).eq('created_by', ctx.userId),
    );
    if (error) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
