// =============================================================================
// service-actuals — the ACTUAL side of the Order of Service + the learning loop.
// =============================================================================
// Darrell 2026-06-25: "Order of service can also be updated based on what
// occurred and becomes a blueprint for the next service." service-program.js is
// the PLANNED side (the conductor's score — what we INTEND). This module is the
// ACTUAL side (what really HAPPENED) and the loop that closes between them:
//
//   PLAN (program + segments)  ->  execute  ->  HARVEST what occurred
//     ->  RECONCILE planned-vs-actual here  ->  the reconciled actual becomes the
//     BLUEPRINT that seeds the NEXT service of the same type (Sunday -> next
//     Sunday), pre-populated from what worked. plan -> execute -> harvest ->
//     reconcile -> blueprint -> next plan. Each service improves the next.
//
// WHERE "ACTUAL" COMES FROM (Reality-trace, DR-0076): the source of "what
// occurred" is the service video (choir_schedule.youtube_url) + the real
// choir_songs / choir_sermons the choir already keeps. Two honest capture paths,
// both DESCRIPTIVE:
//   1. Quick reconcile FROM PLAN — actualFromPlanned() pre-fills the actual run
//      from the planned segments; the finalizer then adjusts (real minutes, mark
//      skipped = remove, add the unplanned, note what changed). Always available,
//      no pipeline required.
//   2. Harvest-assisted — items mined from the video by the NAS SME pipeline
//      (infra/nas-sme-pipeline, Whisper -> Ollama, sovereign, manual) land as
//      source:'harvest', needs_review:true (low confidence) until a finalizer
//      confirms — exactly the renditions archive honesty (0043). The PWA cannot
//      run Whisper; the bridge IS the design. Nothing about what occurred is
//      painted; absence of an actual for a planned segment = it was SKIPPED
//      (derived, never invented).
//
// DESCRIPTIVE, NEVER PRESCRIPTIVE (binding, mirrors choir-renditions.js): the
// blueprint is a FAITHFUL record of how we actually did it, offered as a STARTING
// template — available to reproduce OR depart from. It informs the next plan; it
// never dictates it. The finalizer circle (0043) still finalizes the next
// program with wired buttons + preview -> execute. The reusable part is the
// STRUCTURE + TIMING + sectors + cues; the date-specific content (this sermon,
// these songs) is dropped so the team chooses fresh.
//
// PURE helpers (DISPOSITIONS, toActualShape, actualFromPlanned, reconcileService,
// summarizeReconcile, blueprintFromActual, pickBlueprintProgram) carry no
// Supabase, so a vitest run locks the reconcile math + the blueprint derivation
// the surface depends on (DR-0076: measure, don't claim). The Supabase I/O is
// thin, instance-scoped (RLS via user_is_worship_finalizer), and fails soft.
// =============================================================================
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';
import { varianceCell } from './conference-variance.js';

// --- Disposition taxonomy ----------------------------------------------------
// How a planned segment actually went. 'skipped' is NOT stored — it is DERIVED
// (a planned segment with no matching actual). 'added' = an actual with no plan.
export const DISPOSITIONS = {
  'as-planned': { label: 'As planned', short: 'As planned', rank: 1, tone: 'good' },
  'ran-long':   { label: 'Ran long',   short: 'Long',       rank: 2, tone: 'attention' },
  'ran-short':  { label: 'Ran short',  short: 'Short',      rank: 3, tone: 'attention' },
  'reordered':  { label: 'Reordered',  short: 'Reordered',  rank: 4, tone: 'attention' },
  'added':      { label: 'Added (unplanned)', short: 'Added', rank: 5, tone: 'attention' },
};
export const SKIPPED = 'skipped';
export const SKIPPED_META = { label: 'Skipped', short: 'Skipped', rank: 6, tone: 'attention' };
// The minutes a segment can drift from plan and still read "as planned".
export const DEFAULT_TOLERANCE_MIN = 2;

export function dispositionLabel(key) {
  if (key === SKIPPED) return SKIPPED_META.label;
  return DISPOSITIONS[key]?.label || key;
}
export function dispositionMeta(key) {
  if (key === SKIPPED) return SKIPPED_META;
  return DISPOSITIONS[key] || { label: key, short: key, rank: 99, tone: 'idle' };
}

// --- Pure mapper -------------------------------------------------------------
export function toActualShape(row) {
  return {
    id: row.id,
    programId: row.program_id,
    plannedSegmentId: row.planned_segment_id ?? null,
    disposition: row.disposition ?? 'as-planned',
    title: row.title ?? '',
    sector: row.sector ?? 'general',
    actualOrder: Number.isFinite(row.actual_order) ? row.actual_order : 0,
    actualMinutes: Number.isFinite(row.actual_minutes) ? row.actual_minutes : null,
    actualSongs: Array.isArray(row.actual_songs) ? row.actual_songs : [],
    actualSermonId: row.actual_sermon_id ?? null,
    note: row.note ?? null,
    source: row.source === 'harvest' ? 'harvest' : 'manual',
    confidence: row.confidence ?? null,
    videoId: row.video_id ?? null,
    atSeconds: Number.isFinite(row.at_seconds) ? row.at_seconds : null,
    needsReview: row.needs_review === true,
    createdAt: row.created_at ?? null,
  };
}

// Pre-fill ONE actual item from a planned segment — the quick-reconcile seed:
// "we did exactly this." The finalizer then edits the real minutes, marks it
// skipped (by removing it), or notes what changed. No id / no DB (a template the
// caller inserts), mirroring service-program.seedDefaultOrder().
export function actualFromPlanned(seg) {
  return {
    plannedSegmentId: seg.id,
    disposition: 'as-planned',
    title: seg.title || '',
    sector: seg.sector || 'general',
    actualOrder: Number.isFinite(seg.sortOrder) ? seg.sortOrder : 0,
    actualMinutes: Number.isFinite(seg.plannedMinutes) ? seg.plannedMinutes : null,
    actualSongs: Array.isArray(seg.songIds) ? seg.songIds : [],
    actualSermonId: seg.sermonId || null,
    note: '',
    source: 'manual',
  };
}

// --- The reconcile: planned vs actual (pure) ---------------------------------
// Given the PLANNED segments and the captured ACTUAL items, produce the unified
// reconciliation: every planned segment paired with what occurred (or marked
// skipped), plus the unplanned additions, in the order it really happened.
//
// Disposition is DERIVED from the data (deterministic, test-lockable), not from
// the stored label: added (no plan) | ran-long / ran-short (minutes drift beyond
// tolerance) | reordered (position moved) | as-planned. The stored disposition
// column stays available for harvested/explicit records but reconcile is the
// source of truth for what the surface shows.
//
// Returns { rows, plannedTotalMinutes, actualTotalMinutes, deltaMinutes,
// totalsVariance, counts, occurredCount, skippedCount, addedCount, reconciled }.
export function reconcileService(plannedSegments, actualItems, { tolMinutes = DEFAULT_TOLERANCE_MIN, reconciled = false } = {}) {
  const planned = [...(plannedSegments || [])].sort((a, b) => (a.sortOrder - b.sortOrder) || String(a.id).localeCompare(String(b.id)));
  const actuals = [...(actualItems || [])].sort((a, b) => (a.actualOrder - b.actualOrder) || String(a.id || '').localeCompare(String(b.id || '')));

  // Index actuals by the planned segment they reconcile to (first wins).
  const actualByPlanned = new Map();
  const added = [];
  for (const a of actuals) {
    if (a.plannedSegmentId && !actualByPlanned.has(a.plannedSegmentId)) actualByPlanned.set(a.plannedSegmentId, a);
    else if (!a.plannedSegmentId) added.push(a);
  }

  // Planned rank among segments that actually occurred (for reorder detection).
  const occurredPlannedIds = planned.filter((p) => actualByPlanned.has(p.id)).map((p) => p.id);
  const plannedRank = new Map(occurredPlannedIds.map((id, i) => [id, i]));
  const actualRank = new Map(actuals.filter((a) => a.plannedSegmentId && actualByPlanned.get(a.plannedSegmentId) === a).map((a, i) => [a.plannedSegmentId, i]));

  const matchedRow = (p, a) => {
    const plannedMinutes = Number.isFinite(p.plannedMinutes) ? p.plannedMinutes : null;
    const actualMinutes = Number.isFinite(a.actualMinutes) ? a.actualMinutes : null;
    const deltaMinutes = (plannedMinutes != null && actualMinutes != null) ? actualMinutes - plannedMinutes : null;
    const reordered = plannedRank.has(p.id) && actualRank.has(p.id) && plannedRank.get(p.id) !== actualRank.get(p.id);
    let disposition = 'as-planned';
    if (deltaMinutes != null && deltaMinutes > tolMinutes) disposition = 'ran-long';
    else if (deltaMinutes != null && deltaMinutes < -tolMinutes) disposition = 'ran-short';
    else if (reordered) disposition = 'reordered';
    return {
      kind: 'occurred', key: `p-${p.id}`, sortKey: a.actualOrder,
      plannedSegmentId: p.id, planned: p, actual: a,
      title: a.title || p.title, sector: a.sector || p.sector,
      disposition, dispositionLabel: dispositionLabel(disposition), reordered,
      plannedMinutes, actualMinutes, deltaMinutes,
      variance: (plannedMinutes != null && actualMinutes != null) ? varianceCell(plannedMinutes, actualMinutes) : null,
      note: a.note || null, songs: a.actualSongs || [], sermonId: a.actualSermonId || null,
      source: a.source, needsReview: !!a.needsReview, confidence: a.confidence, videoId: a.videoId, atSeconds: a.atSeconds,
    };
  };

  const addedRow = (a) => ({
    kind: 'occurred', key: `a-${a.id}`, sortKey: a.actualOrder,
    plannedSegmentId: null, planned: null, actual: a,
    title: a.title || '(unplanned)', sector: a.sector || 'general',
    disposition: 'added', dispositionLabel: dispositionLabel('added'), reordered: false,
    plannedMinutes: null, actualMinutes: Number.isFinite(a.actualMinutes) ? a.actualMinutes : null, deltaMinutes: null, variance: null,
    note: a.note || null, songs: a.actualSongs || [], sermonId: a.actualSermonId || null,
    source: a.source, needsReview: !!a.needsReview, confidence: a.confidence, videoId: a.videoId, atSeconds: a.atSeconds,
  });

  const skippedRow = (p) => ({
    kind: 'skipped', key: `s-${p.id}`, sortKey: p.sortOrder,
    plannedSegmentId: p.id, planned: p, actual: null,
    title: p.title, sector: p.sector,
    disposition: SKIPPED, dispositionLabel: SKIPPED_META.label, reordered: false,
    plannedMinutes: Number.isFinite(p.plannedMinutes) ? p.plannedMinutes : null,
    actualMinutes: null, deltaMinutes: null, variance: null,
    note: null, songs: [], sermonId: null,
    source: 'manual', needsReview: false, confidence: null, videoId: null, atSeconds: null,
  });

  const rows = [];
  for (const p of planned) {
    const a = actualByPlanned.get(p.id);
    if (a) rows.push(matchedRow(p, a));
    else if (reconciled) rows.push(skippedRow(p)); // only call it skipped once reconciled
  }
  for (const a of added) rows.push(addedRow(a));
  rows.sort((x, y) => (x.sortKey - y.sortKey) || (x.kind === 'skipped' ? 1 : 0) - (y.kind === 'skipped' ? 1 : 0));

  const occurred = rows.filter((r) => r.kind === 'occurred');
  const skipped = rows.filter((r) => r.kind === 'skipped');
  const plannedTotalMinutes = planned.reduce((n, p) => n + (Number.isFinite(p.plannedMinutes) ? p.plannedMinutes : 0), 0);
  const actualTotalMinutes = occurred.reduce((n, r) => n + (Number.isFinite(r.actualMinutes) ? r.actualMinutes : 0), 0);
  const counts = { asPlanned: 0, ranLong: 0, ranShort: 0, reordered: 0, added: 0, skipped: skipped.length };
  for (const r of occurred) {
    if (r.disposition === 'as-planned') counts.asPlanned += 1;
    else if (r.disposition === 'ran-long') counts.ranLong += 1;
    else if (r.disposition === 'ran-short') counts.ranShort += 1;
    else if (r.disposition === 'reordered') counts.reordered += 1;
    else if (r.disposition === 'added') counts.added += 1;
  }
  return {
    rows, occurred, skipped,
    plannedTotalMinutes, actualTotalMinutes,
    deltaMinutes: reconciled ? actualTotalMinutes - plannedTotalMinutes : null,
    totalsVariance: reconciled ? varianceCell(plannedTotalMinutes, actualTotalMinutes) : null,
    counts, occurredCount: occurred.length, skippedCount: skipped.length, addedCount: counts.added,
    reconciled: !!reconciled,
  };
}

// "Ran 8' over plan · 2 ran long · 1 added · 1 skipped" — one honest recap line.
// Empty-ish input -> a gentle nothing-yet line.
export function summarizeReconcile(reconcile) {
  if (!reconcile || (!reconcile.occurredCount && !reconcile.skippedCount)) return 'Not reconciled yet.';
  const parts = [];
  const d = reconcile.deltaMinutes;
  if (d == null) parts.push(`${reconcile.actualTotalMinutes}' across ${reconcile.occurredCount} segment${reconcile.occurredCount === 1 ? '' : 's'}`);
  else if (d === 0) parts.push(`On time (${reconcile.actualTotalMinutes}' / ${reconcile.plannedTotalMinutes}' planned)`);
  else parts.push(`Ran ${Math.abs(d)}' ${d > 0 ? 'over' : 'under'} plan (${reconcile.actualTotalMinutes}' / ${reconcile.plannedTotalMinutes}')`);
  const c = reconcile.counts;
  if (c.ranLong) parts.push(`${c.ranLong} ran long`);
  if (c.ranShort) parts.push(`${c.ranShort} ran short`);
  if (c.reordered) parts.push(`${c.reordered} reordered`);
  if (c.added) parts.push(`${c.added} added`);
  if (c.skipped) parts.push(`${c.skipped} skipped`);
  return parts.join(' · ');
}

// --- The blueprint: reconciled actual -> a starting template for next time ---
// The reconciled actual becomes the seed for the NEXT service of the same type.
// Returns template segments in the SAME shape as service-program.seedDefaultOrder
// (no ids / no DB) so the same insert path lands them. DESCRIPTIVE: it carries
// the reusable run-of-show STRUCTURE + real TIMING (actual minutes become the new
// plan) + sector + owner + per-sector cues + flexible flag; it DROPS the date-
// specific content (this sermon, these songs) so the team picks fresh, leaving a
// "last time" breadcrumb in the note. Skipped segments fall away; added ones come
// along. The finalizer adjusts everything — this is a head start, not a rule.
export function blueprintFromActual(program, plannedSegments, actualItems, { tolMinutes = DEFAULT_TOLERANCE_MIN } = {}) {
  const reconcile = reconcileService(plannedSegments, actualItems, { tolMinutes, reconciled: true });
  const plannedById = new Map((plannedSegments || []).map((p) => [p.id, p]));
  const segments = reconcile.occurred.map((r, i) => {
    const p = r.plannedSegmentId ? plannedById.get(r.plannedSegmentId) : null;
    const minutes = Number.isFinite(r.actualMinutes) ? r.actualMinutes : (Number.isFinite(r.plannedMinutes) ? r.plannedMinutes : 5);
    const lastTime = [];
    if (r.disposition === 'added') lastTime.push('Added live last time');
    else if (r.disposition === 'ran-long') lastTime.push(`Ran ${r.deltaMinutes}' long last time`);
    else if (r.disposition === 'ran-short') lastTime.push(`Ran ${Math.abs(r.deltaMinutes)}' short last time`);
    if (r.note) lastTime.push(r.note);
    const baseNote = (p?.notes || '').trim();
    const note = [baseNote, lastTime.length ? `Last time: ${lastTime.join('; ')}` : ''].filter(Boolean).join('\n');
    return {
      title: r.title,
      sector: r.sector,
      ownerName: p?.ownerName || '',
      plannedMinutes: minutes,
      flexible: p ? p.flexible !== false : true, // the sermon stays fixed
      sortOrder: (i + 1) * 10,
      scriptureRef: '',            // date-specific — chosen fresh
      sermonId: null,              // this sermon belongs to that date
      songIds: [],                 // these songs belong to that date
      cues: (p?.cues && typeof p.cues === 'object') ? { ...p.cues } : {}, // run-of-show cues are reusable
      notes: note,
    };
  });
  return {
    segments,
    sourceProgramId: program?.id || null,
    sourceServiceDate: program?.serviceDate || null,
    sourceServiceType: program?.serviceType || 'sunday',
    plannedTotalMinutes: reconcile.actualTotalMinutes,
    droppedSkipped: reconcile.skippedCount,
    broughtAdded: reconcile.addedCount,
  };
}

// The most recent reconciled program of the same service type to blueprint FROM
// (Sunday -> last reconciled Sunday). Skips the program being built (excludeId)
// and anything on/after beforeDate. Returns the program or null.
export function pickBlueprintProgram(programs, { serviceType = 'sunday', beforeDate = null, excludeId = null } = {}) {
  const candidates = (programs || []).filter((p) =>
    p.serviceType === serviceType
    && p.reconciledAt
    && p.id !== excludeId
    && (!beforeDate || String(p.serviceDate || '') < String(beforeDate)));
  candidates.sort((a, b) => String(b.serviceDate || '').localeCompare(String(a.serviceDate || '')));
  return candidates[0] || null;
}

// =============================================================================
// Supabase I/O — finalizer-circle writes (RLS), realtime read, fail-soft.
// Mirrors service-program.js (same churchInstanceId tenant, same change log).
// =============================================================================
async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}
function resolveActorName(session) {
  const meta = (session && session.user && session.user.user_metadata) || {};
  return meta.full_name || meta.name || session?.user?.email?.split('@')[0] || 'Member';
}
async function writeContext(displayName) {
  const session = await currentSession();
  if (!session) return { error: 'signed-out' };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { error: 'no-church' };
  return { tenantId, userId: session.user.id, actorName: resolveActorName(session) };
}

// Human line for the shared change trail (church_service_program_changes, 0043).
export function summarizeActualChange(action, title) {
  const t = title ? ` "${title}"` : '';
  switch (action) {
    case 'reconcile-start': return 'Started reconciling the actual from the plan';
    case 'reconcile':       return 'Reconciled what actually occurred';
    case 'capture-actual':  return `Recorded actual${t}`;
    case 'edit-actual':     return `Edited actual${t}`;
    case 'delete-actual':   return `Marked${t} skipped`;
    case 'capture-harvest': return 'Captured harvested items from the service video';
    case 'blueprint-seed':  return 'Seeded this service from the last reconciled actual (blueprint)';
    default:                return action;
  }
}
async function logChange(ctx, programId, action, title) {
  try {
    await supabase.from('church_service_program_changes').insert({
      instance_id: ctx.tenantId, program_id: programId ?? null, segment_id: null,
      actor: ctx.userId, actor_name: ctx.actorName ?? null,
      action, summary: summarizeActualChange(action, title),
    });
  } catch (e) { console.warn('[service-actuals] change-log failed:', e); }
}

// Realtime subscribe to the actual run (newest reconcile streams to co-editors).
export function subscribeActuals(onChange) {
  let channel = null; let cancelled = false;
  (async () => {
    const session = await currentSession();
    if (!session || cancelled) return;
    const fetchAll = async () => {
      const { data, error } = await supabase.from('church_service_segment_actuals').select('*').order('actual_order', { ascending: true });
      if (error) { console.warn('[service-actuals] fetch failed:', error); return null; }
      return (data || []).map(toActualShape);
    };
    const initial = await fetchAll();
    if (initial && !cancelled) onChange(initial);
    channel = supabase.channel('church_service_segment_actuals-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'church_service_segment_actuals' }, () => {
        fetchAll().then((rows) => { if (rows && !cancelled) onChange(rows); });
      }).subscribe();
  })();
  return function unsubscribe() { cancelled = true; if (channel) supabase.removeChannel(channel); };
}

function actualRow(a, ctx) {
  return {
    instance_id: ctx.tenantId,
    planned_segment_id: a.plannedSegmentId || null,
    disposition: DISPOSITIONS[a.disposition] ? a.disposition : 'as-planned',
    title: a.title || '',
    sector: a.sector || 'general',
    actual_order: Number.isFinite(a.actualOrder) ? a.actualOrder : 0,
    actual_minutes: Number.isFinite(a.actualMinutes) ? a.actualMinutes : null,
    actual_songs: Array.isArray(a.actualSongs) ? a.actualSongs : [],
    actual_sermon_id: a.actualSermonId || null,
    note: a.note || null,
    source: a.source === 'harvest' ? 'harvest' : 'manual',
    confidence: a.confidence || null,
    video_id: a.videoId || null,
    at_seconds: Number.isFinite(a.atSeconds) ? a.atSeconds : null,
    needs_review: a.needsReview === true,
  };
}

export async function saveActual(programId, actual, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const row = actualRow(actual, ctx);
  if (actual.id) {
    const { error } = await supabase.from('church_service_segment_actuals').update({ ...row, updated_by: ctx.userId }).eq('id', actual.id);
    if (error) return { skipped: 'update-error', error };
    await logChange(ctx, programId, 'edit-actual', actual.title);
    return { saved: true };
  }
  const { error } = await supabase.from('church_service_segment_actuals').insert({ ...row, program_id: programId, created_by: ctx.userId });
  if (error) return { skipped: 'insert-error', error };
  await logChange(ctx, programId, 'capture-actual', actual.title);
  return { saved: true };
}

export async function deleteActual(id, meta = {}) {
  const ctx = await writeContext(meta.displayName);
  const { error } = await supabase.from('church_service_segment_actuals').delete().eq('id', id);
  if (error) return { skipped: 'delete-error', error };
  if (!ctx.error) await logChange(ctx, meta.programId ?? null, 'delete-actual', meta.title);
  return { deleted: true };
}

// Quick reconcile: pre-fill the actual run from the planned segments (one-tap
// "we did exactly this," then adjust). Inserts one actual per planned segment.
export async function seedActualsFromPlan(programId, plannedSegments, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const rows = (plannedSegments || []).map((seg) => ({
    ...actualRow(actualFromPlanned(seg), ctx), program_id: programId, created_by: ctx.userId,
  }));
  if (!rows.length) return { saved: true, count: 0 };
  const { error } = await supabase.from('church_service_segment_actuals').insert(rows);
  if (error) return { skipped: 'insert-error', error };
  await logChange(ctx, programId, 'reconcile-start', null);
  return { saved: true, count: rows.length };
}

// Capture harvested items (mined from the service video by the NAS SME pipeline)
// as needs_review actuals — never shown as confirmed until a finalizer reviews.
export async function captureActualFromHarvest(programId, harvestedItems, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const rows = (harvestedItems || []).map((h, i) => ({
    ...actualRow({ ...h, source: 'harvest', needsReview: true, confidence: h.confidence || 'low', actualOrder: Number.isFinite(h.actualOrder) ? h.actualOrder : (i + 1) * 10 }, ctx),
    program_id: programId, created_by: ctx.userId,
  }));
  if (!rows.length) return { saved: true, count: 0 };
  const { error } = await supabase.from('church_service_segment_actuals').insert(rows);
  if (error) return { skipped: 'insert-error', error };
  await logChange(ctx, programId, 'capture-harvest', null);
  return { saved: true, count: rows.length };
}

// Mark the program reconciled — stamp the recap (real start/total/notes + the
// harvest source it was reconciled from). After this, planned segments with no
// actual read as SKIPPED in reconcileService.
export async function markReconciled(program, fields = {}, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const patch = {
    actual_start_time: fields.actualStartTime || null,
    actual_total_minutes: Number.isFinite(fields.actualTotalMinutes) ? fields.actualTotalMinutes : null,
    actual_notes: fields.actualNotes || null,
    harvest_source: fields.harvestSource || null,
    reconciled_at: new Date().toISOString(),
    reconciled_by: ctx.userId,
    updated_by: ctx.userId,
  };
  const { error } = await supabase.from('church_service_programs').update(patch).eq('id', program.id);
  if (error) return { skipped: 'update-error', error };
  await logChange(ctx, program.id, 'reconcile', program.title);
  return { saved: true };
}

// Seed a NEW program's segments from a blueprint (the reconciled actual of the
// last service of this type). Inserts the template segments + records that this
// plan descends from that actual (blueprint_source_id), closing the loop.
export async function seedSegmentsFromBlueprint(programId, blueprint, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const segs = (blueprint?.segments || []).map((seg) => ({
    instance_id: ctx.tenantId, program_id: programId, created_by: ctx.userId,
    title: seg.title || '', sector: seg.sector || 'general', owner_name: seg.ownerName || null,
    planned_minutes: Number.isFinite(seg.plannedMinutes) ? seg.plannedMinutes : 5,
    flexible: seg.flexible !== false, scripture_ref: seg.scriptureRef || null,
    sermon_id: seg.sermonId || null, song_ids: Array.isArray(seg.songIds) ? seg.songIds : [],
    cues: (seg.cues && typeof seg.cues === 'object') ? seg.cues : {}, notes: seg.notes || null,
    sort_order: Number.isFinite(seg.sortOrder) ? seg.sortOrder : 0,
  }));
  if (!segs.length) return { saved: true, count: 0 };
  const { error } = await supabase.from('church_service_segments').insert(segs);
  if (error) return { skipped: 'insert-error', error };
  if (blueprint?.sourceProgramId) {
    await supabase.from('church_service_programs').update({ blueprint_source_id: blueprint.sourceProgramId, updated_by: ctx.userId }).eq('id', programId);
  }
  await logChange(ctx, programId, 'blueprint-seed', null);
  return { saved: true, count: segs.length };
}
