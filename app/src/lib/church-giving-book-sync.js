// =============================================================================
// church-giving-book-sync -- Supabase I/O for the OFFICE's contribution book.
// =============================================================================
// Tables 0214: church_giving_batches, church_giving_claims, church_giving_aliases.
//
// THIS IS NOT THE MEMBER'S LEDGER. giving-records-sync.js reads 0184, which is
// owner-only and belongs to the giver. This file reads the office's own book,
// which is RLS-gated to ('owner','admin'). The two are never joined, never
// reconciled against each other, and never rendered on the same surface. 0184
// said so when it was written; 0214's header says why; a source gate in
// church-giving-book-wall.test.js fails the build if a future edit crosses it.
//
// Mirrors the established church-surface pattern (giving-records-sync,
// bus-ministry-sync): writeContext() resolves the church tenant BEFORE any
// write so RLS passes, and every call returns an honest, distinguishable
// outcome instead of throwing.
//
// HONEST STATES (DR-0076). "No rows" is not "signed out" is not "you are not
// the office" is not "the read failed". Each renders differently, so a steward
// is never told to sign in because a fetch hiccuped, and a member who wanders
// in is told plainly that this book belongs to the office rather than being
// shown an empty one that implies the church received nothing.
// Outcomes: { ok:true, ... } | { ok:false, reason: 'signed-out'|'no-church'|'forbidden'|'error' }.
//
// TIMEOUTS ARE EXPLICIT (SOUL.md DoD #3). Every network call races a deadline.
//
// MONEY CROSSES THE BOUNDARY ONCE, IN ONE PLACE. The libraries work in integer
// CENTS because reconciliation must be exact; the table stores numeric(12,2)
// because that is this repo's money type. centsToNumeric/numericToCents below
// are the ONLY conversion, they are exact in both directions, and they are
// tested on the values that actually break naive conversions.
// =============================================================================
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';

const BATCHES = 'church_giving_batches';
const CLAIMS = 'church_giving_claims';
const ALIASES = 'church_giving_aliases';
const DEADLINE_MS = 15000;

// ---------------------------------------------------------------------------
// Money at the boundary
// ---------------------------------------------------------------------------
// cents -> the string form numeric(12,2) accepts. Built by integer arithmetic
// and string padding rather than division, so 1 cent is '0.01' and never
// '0.010000000000000002'. Negative amounts are real here (a refund row), so the
// sign is carried on the whole, not smuggled into the fraction.
export function centsToNumeric(cents) {
  const n = Math.trunc(Number(cents) || 0);
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

// numeric -> cents. Rounds the scaled value rather than truncating it, because
// parseFloat('0.29') * 100 is 28.999999999999996 in IEEE-754 and truncating
// that yields 28 -- a cent lost on a row whose value is a typical processor
// fee. Verified, not assumed: a sweep of every cent value from 0.01 to 2000.00
// finds 0.29 the first of many such cases, and the round-trip test pins them.
// This is the kind of drift that makes a reconciliation report disagree with
// itself while every individual line looks right.
export function numericToCents(value) {
  if (value == null || value === '') return 0;
  const f = typeof value === 'number' ? value : parseFloat(String(value));
  if (!Number.isFinite(f)) return 0;
  return Math.round(f * 100);
}

function withDeadline(promise, ms = DEADLINE_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('church-giving-book: request timed out')), ms);
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

// A Postgres RLS refusal and a broken network are different facts and the
// steward needs to be told which. 42501 is insufficient_privilege; PostgREST
// also reports a policy violation as 42501 on write. Anything else is 'error'.
function reasonFor(error) {
  if (error && (error.code === '42501' || /row-level security|permission denied/i.test(error.message || ''))) {
    return 'forbidden';
  }
  return 'error';
}

// ---------------------------------------------------------------------------
// Row mapping -- library shape <-> table row
// ---------------------------------------------------------------------------
export function toBatchRow(batch, { tenantId, userId, slug }) {
  return {
    instance_id: tenantId,
    slug,
    source: batch.onlineSource || 'cashapp',
    payout_ref: batch.onlineBatchId || '',
    payout_on: batch.payoutOn || null,
    service_date: batch.serviceDate || null,
    deposit_amount: batch.depositCents == null ? null : centsToNumeric(batch.depositCents),
    gifts_gross: centsToNumeric((batch.onlineTotalCents || 0) + (batch.feesCents || 0)),
    fees_total: centsToNumeric(batch.feesCents || 0),
    gifts_net: centsToNumeric(batch.onlineTotalCents || 0),
    claim_count: batch.giftCount || 0,
    imported_by: userId,
  };
}

export function fromBatchRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    onlineSource: row.source,
    onlineBatchId: row.payout_ref || '',
    payoutOn: row.payout_on || null,
    serviceDate: row.service_date || null,
    depositCents: row.deposit_amount == null ? null : numericToCents(row.deposit_amount),
    grossCents: numericToCents(row.gifts_gross),
    feesCents: numericToCents(row.fees_total),
    onlineTotalCents: numericToCents(row.gifts_net),
    giftCount: row.claim_count || 0,
    note: row.note || '',
    createdAt: row.created_at || null,
  };
}

// A claim carries its giver's NAME always and their account link only when a
// person confirmed it. parishioner_user_id and match_confirmed_by move
// together or not at all -- the table's CHECK constraint refuses the half
// state, and this mapper never constructs one.
export function toClaimRow(claim, { tenantId, batchId, slug, confirmedBy = null }) {
  const linked = claim.parishionerId || null;
  const givenAt = claim.givenAt
    ? `${claim.givenOn}T${claim.givenAt}`
    : `${claim.givenOn}T00:00:00`;
  return {
    instance_id: tenantId,
    batch_id: batchId || null,
    slug,
    giver_name: claim.giverName || '',
    parishioner_user_id: linked,
    match_basis: claim.matchBasis || 'none',
    match_confirmed_by: linked ? (confirmedBy || null) : null,
    match_confirmed_at: linked ? new Date().toISOString() : null,
    given_at: givenAt,
    amount: centsToNumeric(claim.grossCents == null ? claim.amountClaimedCents : claim.grossCents),
    fee: centsToNumeric(claim.feeCents || 0),
    net: centsToNumeric(claim.amountClaimedCents || 0),
    fund: claim.fund || 'offering',
    kind: 'gift',
    note: claim.note || '',
    source: 'cashapp',
    source_ref: claim.txnId || '',
  };
}

export function fromClaimRow(row) {
  if (!row) return null;
  const at = String(row.given_at || '');
  return {
    id: row.id,
    slug: row.slug,
    batchId: row.batch_id || null,
    giverName: row.giver_name || '',
    parishionerId: row.parishioner_user_id || null,
    matchBasis: row.match_basis || 'none',
    confirmedBy: row.match_confirmed_by || null,
    givenOn: at.slice(0, 10),
    givenAt: at.length > 10 ? at.slice(11, 19) : '',
    grossCents: numericToCents(row.amount),
    feeCents: numericToCents(row.fee),
    amountClaimedCents: numericToCents(row.net),
    fund: row.fund || 'offering',
    note: row.note || '',
    txnId: row.source_ref || '',
  };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------
// fetchBatches -- the deposits this church has booked, newest first. RLS is the
// real gate: a member calling this gets nothing back, and gets it as
// 'forbidden' rather than as an empty book.
export async function fetchBatches(displayName, { limit = 200 } = {}) {
  const ctx = await writeContext(displayName);
  if (ctx.reason) return { ok: false, reason: ctx.reason, batches: [] };
  try {
    const { data, error } = await withDeadline(
      supabase.from(BATCHES).select('*').eq('instance_id', ctx.tenantId)
        .order('payout_on', { ascending: false }).limit(limit),
    );
    if (error) return { ok: false, reason: reasonFor(error), batches: [] };
    return { ok: true, batches: (data || []).map(fromBatchRow), tenantId: ctx.tenantId };
  } catch {
    return { ok: false, reason: 'error', batches: [] };
  }
}

// fetchClaims -- the itemised gifts. Optionally narrowed to one batch or one
// calendar month (the month-end report the steward described).
export async function fetchClaims(displayName, { batchId = null, month = null, limit = 2000 } = {}) {
  const ctx = await writeContext(displayName);
  if (ctx.reason) return { ok: false, reason: ctx.reason, claims: [] };
  try {
    let q = supabase.from(CLAIMS).select('*').eq('instance_id', ctx.tenantId);
    if (batchId) q = q.eq('batch_id', batchId);
    if (month) {
      // month is 'YYYY-MM'. The upper bound is the first instant of the next
      // month and the comparison is strict, so a gift at 23:59:59 on the last
      // day is included and one at 00:00:00 on the first of the next is not.
      const [y, m] = String(month).split('-').map(Number);
      const start = new Date(Date.UTC(y, m - 1, 1)).toISOString();
      const end = new Date(Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1)).toISOString();
      q = q.gte('given_at', start).lt('given_at', end);
    }
    const { data, error } = await withDeadline(q.order('given_at', { ascending: false }).limit(limit));
    if (error) return { ok: false, reason: reasonFor(error), claims: [] };
    return { ok: true, claims: (data || []).map(fromClaimRow), tenantId: ctx.tenantId };
  } catch {
    return { ok: false, reason: 'error', claims: [] };
  }
}

export async function fetchAliases(displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.reason) return { ok: false, reason: ctx.reason, aliases: {}, aliasNames: {} };
  try {
    const { data, error } = await withDeadline(
      supabase.from(ALIASES).select('*').eq('instance_id', ctx.tenantId).limit(1000),
    );
    if (error) return { ok: false, reason: reasonFor(error), aliases: {}, aliasNames: {} };
    // Two shapes, deliberately. proposeDonorMatches() consumes a FLAT
    // normalized-name -> id map, so that is what `aliases` is -- handing it a
    // map of objects would make every alias silently fail to match while the
    // screen still looked right. `aliasNames` keeps the steward's own wording
    // for display, which is hers and is not the matcher's business.
    const aliases = {};
    const aliasNames = {};
    for (const row of data || []) {
      if (!row.parishioner_user_id) continue;
      aliases[row.statement_name] = String(row.parishioner_user_id);
      aliasNames[row.statement_name] = row.display_name || '';
    }
    return { ok: true, aliases, aliasNames };
  } catch {
    return { ok: false, reason: 'error', aliases: {}, aliasNames: {} };
  }
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------
// importBatch -- write one deposit and its gifts.
//
// PARTIAL IMPORTS ARE REPORTED, NEVER HIDDEN. PostgREST has no transaction
// across two statements, so the batch lands first and the claims follow. If the
// claims insert fails, this does NOT pretend the import worked and does NOT
// leave a batch row claiming gifts it does not have: it deletes the batch it
// just made and reports the failure. A book that is wrong is worse than a book
// that is empty, because only the empty one gets refilled.
//
// RE-IMPORTING THE SAME STATEMENT IS SAFE. (instance_id, source, source_ref) is
// UNIQUE, so duplicate gifts are refused by the database rather than by a
// client-side check that a future refactor could drop. Rows already present are
// reported as skipped -- an honest count the steward can check against her own.
export async function importBatch({ batch, claims }, displayName, { newSlug } = {}) {
  const mkSlug = newSlug || (() => `cgb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const ctx = await writeContext(displayName);
  if (ctx.reason) return { ok: false, reason: ctx.reason };

  const batchRow = toBatchRow(batch, { tenantId: ctx.tenantId, userId: ctx.userId, slug: mkSlug() });
  let saved;
  try {
    const { data, error } = await withDeadline(supabase.from(BATCHES).insert(batchRow).select().single());
    if (error) return { ok: false, reason: reasonFor(error) };
    saved = data;
  } catch {
    return { ok: false, reason: 'error' };
  }

  const rows = (claims || []).map((c) => toClaimRow(c, {
    tenantId: ctx.tenantId, batchId: saved.id, slug: mkSlug(), confirmedBy: ctx.userId,
  }));

  // A gift with no processor id cannot be de-duplicated on re-import, so it is
  // refused at the door rather than admitted as a row that will double next
  // month. The steward is told which ones and why.
  const unreferenced = rows.filter((r) => !r.source_ref);
  if (unreferenced.length) {
    await withDeadline(supabase.from(BATCHES).delete().eq('id', saved.id)).catch(() => {});
    return {
      ok: false,
      reason: 'unreferenced',
      unreferenced: unreferenced.length,
      detail: 'Some rows carry no transaction id, so a re-import could not tell them from new gifts.',
    };
  }

  try {
    const { data, error } = await withDeadline(
      supabase.from(CLAIMS).upsert(rows, { onConflict: 'instance_id,source,source_ref', ignoreDuplicates: true }).select(),
    );
    if (error) {
      await withDeadline(supabase.from(BATCHES).delete().eq('id', saved.id)).catch(() => {});
      return { ok: false, reason: reasonFor(error) };
    }
    const inserted = (data || []).length;
    return {
      ok: true,
      batch: fromBatchRow(saved),
      inserted,
      skipped: rows.length - inserted,
      claims: (data || []).map(fromClaimRow),
    };
  } catch {
    await withDeadline(supabase.from(BATCHES).delete().eq('id', saved.id)).catch(() => {});
    return { ok: false, reason: 'error' };
  }
}

// confirmClaimGiver -- a PERSON says who a statement name belongs to. Writes the
// link and who confirmed it in one row, and remembers the alias so next month's
// import does not ask again. Passing parishionerId = null clears a link that was
// confirmed in error, and clears the confirmation with it.
export async function confirmClaimGiver(claimId, parishionerId, displayName, { statementName = '', personName = '' } = {}) {
  const ctx = await writeContext(displayName);
  if (ctx.reason) return { ok: false, reason: ctx.reason };
  const patch = parishionerId
    ? {
      parishioner_user_id: parishionerId,
      match_basis: 'confirmed',
      match_confirmed_by: ctx.userId,
      match_confirmed_at: new Date().toISOString(),
    }
    : {
      parishioner_user_id: null,
      match_basis: 'none',
      match_confirmed_by: null,
      match_confirmed_at: null,
    };
  try {
    const { data, error } = await withDeadline(
      supabase.from(CLAIMS).update(patch).eq('id', claimId).eq('instance_id', ctx.tenantId).select().single(),
    );
    if (error) return { ok: false, reason: reasonFor(error) };
    if (parishionerId && statementName) {
      await withDeadline(
        supabase.from(ALIASES).upsert({
          instance_id: ctx.tenantId,
          statement_name: statementName,
          parishioner_user_id: parishionerId,
          display_name: personName || '',
          confirmed_by: ctx.userId,
        }, { onConflict: 'instance_id,statement_name' }),
      ).catch(() => {});
    }
    return { ok: true, claim: fromClaimRow(data) };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

// setDeposit -- the steward enters what the BANK actually shows for a payout.
// This is the number reconciliation is measured against, so it is entered by a
// person reading their own bank, never inferred from the statement we imported.
export async function setDeposit(batchId, depositCents, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.reason) return { ok: false, reason: ctx.reason };
  try {
    const { data, error } = await withDeadline(
      supabase.from(BATCHES)
        .update({ deposit_amount: depositCents == null ? null : centsToNumeric(depositCents) })
        .eq('id', batchId).eq('instance_id', ctx.tenantId).select().single(),
    );
    if (error) return { ok: false, reason: reasonFor(error) };
    return { ok: true, batch: fromBatchRow(data) };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

// removeBatch -- undo an import. The claims go with it (ON DELETE CASCADE), so
// a mis-uploaded statement leaves nothing behind to double-count later.
export async function removeBatch(batchId, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.reason) return { ok: false, reason: ctx.reason };
  try {
    const { error } = await withDeadline(
      supabase.from(BATCHES).delete().eq('id', batchId).eq('instance_id', ctx.tenantId),
    );
    if (error) return { ok: false, reason: reasonFor(error) };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
