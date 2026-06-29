// =============================================================================
// service-program — the Order of Service: ONE master program per Sunday worship,
// from which each staff SECTOR reads a derived view scoped to their part.
// =============================================================================
// Darrell 2026-06-24. The conductor's score for Sunday: the steward (owner/admin)
// builds ONE ordered run-of-show (segments with timing + an owning sector + per-
// sector cues + soft refs to the real choir songs / sermon), and every staff
// member reads the SAME master, each through their own sector LENS:
//   - Choir / Worship  -> their selections + cues + when they're up
//   - Preacher (Pulpit) -> the sermon slot + scripture + notes
//   - Music / Keys      -> song keys / arrangements / cues
//   - Media / AV        -> what to display when (presenter cues)
//   - Ushers / Offering -> their cues + timing
//   - Hospitality       -> welcome / announcements cues
//
// The per-sector view is a FOCUS, not a security wall: the whole team reads the
// master (RLS read = user_in_choir), so deriveSectorView() runs purely on the
// client. Mirrors choir-sync.js: tenant via churchInstanceId(), postgres_changes
// realtime, owner/admin writes. Backed by 0041-service-program.sql.
//
// Pure helpers (mappers, sectorForRole, computeSchedule, reflowProgram,
// deriveSectorView, seedDefaultOrder) are exported for tests — no Supabase, so a
// vitest run locks the timing math + the derivation the surface depends on
// (DR-0076: measure, don't claim).
// =============================================================================
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';

// --- Sector taxonomy ---------------------------------------------------------
// The owning-sector set a segment can carry (DB CHECK mirrors these). 'general'
// = an all-hands moment (MC / whole room), shown to every lens.
export const SECTORS = [
  { key: 'worship',     label: 'Choir / Worship',          short: 'Choir',       emoji: '\u{1F3B5}' },
  { key: 'pulpit',      label: 'Preacher / Pastor',        short: 'Pulpit',      emoji: '\u{1F4D6}' },
  { key: 'music',       label: 'Music / Keys',             short: 'Music',       emoji: '\u{1F3B9}' },
  { key: 'media',       label: 'Media / AV',               short: 'Media',       emoji: '\u{1F5A5}' },
  { key: 'ushers',      label: 'Ushers / Offering',        short: 'Ushers',      emoji: '\u{1F9FA}' },
  { key: 'hospitality', label: 'Welcome / Announcements',  short: 'Welcome',     emoji: '\u{1F4E3}' },
  { key: 'pastoral',    label: 'Prayer / Altar',           short: 'Pastoral',    emoji: '\u{1F64F}' },
  { key: 'general',     label: 'All hands',                short: 'All',         emoji: '\u{1F465}' },
];
// The lens a viewer reads through. STEWARD sees every sector and edits the master.
export const STEWARD = 'steward';
const SECTOR_BY_KEY = Object.fromEntries(SECTORS.map((s) => [s.key, s]));
export function sectorLabel(key) {
  if (key === STEWARD) return 'Steward (all sectors)';
  return SECTOR_BY_KEY[key]?.label || key;
}
export function sectorShort(key) {
  if (key === STEWARD) return 'All';
  return SECTOR_BY_KEY[key]?.short || key;
}

// Map a signed-in member to the sector they run, so their first view lands on
// their own part. Owner/admin steward the whole master.
export function sectorForRole(role, choirRole) {
  if (role === 'owner' || role === 'admin') return STEWARD;
  switch (choirRole) {
    case 'musician': return 'music';
    case 'sound':
    case 'media':
    case 'tech': return 'media';
    case 'director':
    case 'assistant':
    case 'member': return 'worship';
    default: return 'worship';
  }
}

// --- Pure mappers ------------------------------------------------------------
export function toProgramShape(row) {
  return {
    id: row.id,
    serviceDate: row.service_date ?? null,
    serviceType: row.service_type ?? 'sunday',
    serviceSlot: row.service_slot ?? null,
    title: row.title ?? 'Order of Worship',
    theme: row.theme ?? null,
    scriptureRef: row.scripture_ref ?? null,
    startTime: row.start_time ?? null,
    targetMinutes: row.target_minutes ?? null,
    status: row.status ?? 'draft',
    notes: row.notes ?? null,
    // ACTUAL side (0045) — what really happened + the blueprint lineage. Null
    // until the service is reconciled (see lib/service-actuals.js).
    actualStartTime: row.actual_start_time ?? null,
    actualTotalMinutes: Number.isFinite(row.actual_total_minutes) ? row.actual_total_minutes : null,
    actualNotes: row.actual_notes ?? null,
    harvestSource: row.harvest_source ?? null,
    reconciledAt: row.reconciled_at ?? null,
    reconciledBy: row.reconciled_by ?? null,
    blueprintSourceId: row.blueprint_source_id ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export function toSegmentShape(row) {
  return {
    id: row.id,
    programId: row.program_id,
    sortOrder: row.sort_order ?? 0,
    title: row.title ?? '',
    sector: row.sector ?? 'general',
    ownerName: row.owner_name ?? null,
    plannedMinutes: Number.isFinite(row.planned_minutes) ? row.planned_minutes : 5,
    flexible: row.flexible !== false,
    scriptureRef: row.scripture_ref ?? null,
    sermonId: row.sermon_id ?? null,
    songIds: Array.isArray(row.song_ids) ? row.song_ids : [],
    cues: (row.cues && typeof row.cues === 'object') ? row.cues : {},
    notes: row.notes ?? null,
    createdAt: row.created_at ?? null,
  };
}

// --- Time math (pure) --------------------------------------------------------
// 'HH:MM' (24h) <-> minutes-since-midnight. Tolerant: bad input -> null.
export function parseClock(hhmm) {
  if (typeof hhmm !== 'string') return null;
  const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]); const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}
// minutes-since-midnight -> '7:05 PM' (12h, no leading zero on hour).
export function formatClock(mins) {
  if (!Number.isFinite(mins)) return '';
  let m = ((Math.round(mins) % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60); const min = m % 60;
  const ampm = h24 < 12 ? 'AM' : 'PM';
  let h12 = h24 % 12; if (h12 === 0) h12 = 12;
  return `${h12}:${String(min).padStart(2, '0')} ${ampm}`;
}

const bySort = (a, b) => (a.sortOrder - b.sortOrder) || String(a.id).localeCompare(String(b.id));

// Attach a running clock to each segment from the program start time. Pure: each
// segment gets startMin/endMin (minutes-since-midnight) + startClock label.
export function computeSchedule(segments, startTime) {
  const start = parseClock(startTime);
  const ordered = [...(segments || [])].sort(bySort);
  let cursor = start;
  return ordered.map((s) => {
    const dur = Number.isFinite(s.plannedMinutes) ? s.plannedMinutes : 0;
    const startMin = Number.isFinite(cursor) ? cursor : null;
    const endMin = Number.isFinite(cursor) ? cursor + dur : null;
    if (Number.isFinite(cursor)) cursor += dur;
    return {
      ...s,
      startMin, endMin,
      startClock: startMin != null ? formatClock(startMin) : null,
      endClock: endMin != null ? formatClock(endMin) : null,
    };
  });
}

// Reflow the run-of-show when the service actually has more/less time than
// planned. FIXED segments (flexible === false, e.g. the sermon) keep their
// planned minutes; the FLEXIBLE remainder scales proportionally to hit
// actualTotalMin. Pure -> each segment gets adjustedMinutes; returns { segments,
// plannedTotal, fixedTotal, flexTotal, scale, feasible }.
export function reflowProgram(segments, actualTotalMin) {
  const ordered = [...(segments || [])].sort(bySort);
  const plannedTotal = ordered.reduce((n, s) => n + (s.plannedMinutes || 0), 0);
  const fixedTotal = ordered.filter((s) => s.flexible === false).reduce((n, s) => n + (s.plannedMinutes || 0), 0);
  const flexTotal = plannedTotal - fixedTotal;
  const target = Number.isFinite(actualTotalMin) ? actualTotalMin : plannedTotal;
  const flexBudget = Math.max(0, target - fixedTotal);
  // feasible = the fixed segments alone already fit in the available time.
  const feasible = target >= fixedTotal;
  const scale = flexTotal > 0 ? flexBudget / flexTotal : 1;
  const out = ordered.map((s) => {
    if (s.flexible === false) return { ...s, adjustedMinutes: s.plannedMinutes || 0 };
    const adj = Math.max(1, Math.round((s.plannedMinutes || 0) * scale));
    return { ...s, adjustedMinutes: (s.plannedMinutes || 0) > 0 ? adj : 0 };
  });
  return { segments: out, plannedTotal, fixedTotal, flexTotal, scale, feasible };
}

// --- The derivation: one master -> one sector's view (pure) ------------------
// flow keeps EVERY segment (the staffer always sees the whole flow for context),
// flagging the ones they own (isMine), attaching THEIR cue, and resolving the
// real linked songs/sermon so the view shows live data, not ids.
export function deriveSectorView(program, segments, sector, { songs = [], sermons = [] } = {}) {
  const songById = new Map((songs || []).map((s) => [s.id, s]));
  const sermonById = new Map((sermons || []).map((s) => [s.id, s]));
  const scheduled = computeSchedule(segments, program?.startTime);
  const isSteward = sector === STEWARD;
  const flow = scheduled.map((s) => {
    const mine = isSteward || s.sector === sector || s.sector === 'general';
    const linkedSongs = (s.songIds || []).map((id) => songById.get(id)).filter(Boolean);
    const linkedSermon = s.sermonId ? (sermonById.get(s.sermonId) || null) : null;
    return {
      id: s.id,
      order: s.sortOrder,
      title: s.title,
      ownerSector: s.sector,
      ownerSectorLabel: sectorLabel(s.sector),
      ownerName: s.ownerName || null,
      plannedMinutes: s.plannedMinutes,
      flexible: s.flexible,
      startClock: s.startClock,
      endClock: s.endClock,
      scriptureRef: s.scriptureRef || null,
      notes: s.notes || null,
      isMine: mine,
      isOwner: isSteward ? false : s.sector === sector,
      myCue: isSteward ? null : (s.cues?.[sector] || null),
      cues: s.cues || {},
      songs: linkedSongs,
      sermon: linkedSermon,
    };
  });
  const plannedTotalMinutes = scheduled.reduce((n, s) => n + (s.plannedMinutes || 0), 0);
  return {
    sector,
    sectorLabel: sectorLabel(sector),
    programId: program?.id || null,
    programTitle: program?.title || 'Order of Worship',
    theme: program?.theme || null,
    scriptureRef: program?.scriptureRef || null,
    serviceDate: program?.serviceDate || null,
    serviceType: program?.serviceType || 'sunday',
    serviceSlot: program?.serviceSlot || null,
    status: program?.status || 'draft',
    startTime: program?.startTime || null,
    targetMinutes: program?.targetMinutes || null,
    flow,
    myStops: isSteward ? flow : flow.filter((f) => f.isOwner),
    mineCount: isSteward ? flow.length : flow.filter((f) => f.isOwner).length,
    plannedTotalMinutes,
  };
}

// A one-tap starting order so a steward's first build is a real run-of-show, not
// a blank page (SEED-DATA-AS-ASPIRATION: the starter state shows what a faithful,
// well-ordered service looks like). Returns template segment shapes (no ids /
// no DB) the surface inserts. The sermon is FIXED (flexible:false) so a reflow
// never compresses the Word.
export function seedDefaultOrder() {
  const t = [
    { title: 'Call to Worship',        sector: 'pulpit',      planned: 5,  flexible: true,  owner: '' },
    { title: 'Praise & Worship',       sector: 'worship',     planned: 20, flexible: true,  owner: '' },
    { title: 'Welcome & Announcements',sector: 'hospitality', planned: 5,  flexible: true,  owner: '' },
    { title: 'Offering',               sector: 'ushers',      planned: 7,  flexible: true,  owner: '' },
    { title: 'Choir Selection',        sector: 'worship',     planned: 6,  flexible: true,  owner: '' },
    { title: 'Scripture Reading',      sector: 'pulpit',      planned: 4,  flexible: true,  owner: '' },
    { title: 'Sermon',                 sector: 'pulpit',      planned: 35, flexible: false, owner: '' },
    { title: 'Altar Call',             sector: 'pastoral',    planned: 8,  flexible: true,  owner: '' },
    { title: 'Benediction',            sector: 'pulpit',      planned: 3,  flexible: true,  owner: '' },
  ];
  return t.map((x, i) => ({
    title: x.title,
    sector: x.sector,
    ownerName: x.owner,
    plannedMinutes: x.planned,
    flexible: x.flexible,
    sortOrder: (i + 1) * 10,
    scriptureRef: '',
    sermonId: null,
    songIds: [],
    cues: {},
    notes: '',
  }));
}

// --- Access (mirrors getChoirAccess) -----------------------------------------
// canEdit (FINALIZE the master) = owner/admin OR a designated worship-team
// finalizer (the keyboardist circle, 0043). canSee (read the master + a per-
// sector view) = any choir member. The finalizer flag is orthogonal to the
// musical role: a musician can be a finalizer without being an instance admin.
export function deriveAccess(role, inChoir, isFinalizer = false) {
  const isAdmin = role === 'owner' || role === 'admin';
  const canEdit = isAdmin || isFinalizer === true;
  const canSee = canEdit || inChoir === true;
  return { canSee, canEdit };
}

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

function resolveActorName(session) {
  const meta = (session && session.user && session.user.user_metadata) || {};
  return meta.full_name || meta.name || session?.user?.email?.split('@')[0] || 'Member';
}

export async function getServiceProgramAccess(displayName) {
  const session = await currentSession();
  if (!session) return { signedIn: false, canSee: false, canEdit: false, isFinalizer: false, tenantId: null, role: null, sector: 'worship', actorName: null };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { signedIn: true, canSee: false, canEdit: false, isFinalizer: false, tenantId: null, role: null, sector: 'worship', actorName: resolveActorName(session) };
  const [{ data: role }, { data: inChoir }, { data: isFinalizer }, member] = await Promise.all([
    supabase.rpc('user_role_in_instance', { tenant_uuid: tenantId }),
    supabase.rpc('user_in_choir', { instance_uuid: tenantId }),
    supabase.rpc('user_is_worship_finalizer', { instance_uuid: tenantId }),
    supabase.from('choir_members').select('choir_role').eq('instance_id', tenantId).eq('user_id', session.user.id).maybeSingle(),
  ]);
  const { canEdit, canSee } = deriveAccess(role, inChoir, isFinalizer);
  const choirRole = member?.data?.choir_role ?? null;
  return { signedIn: true, canSee, canEdit, isFinalizer: !!isFinalizer, tenantId, role: role ?? null, choirRole, sector: sectorForRole(role, choirRole), actorName: resolveActorName(session) };
}

// --- Realtime subscribe (mirrors choir-sync.makeSubscriber) ------------------
function makeSubscriber(table, mapRow, orderBy) {
  return function subscribe(onChange) {
    let channel = null;
    let cancelled = false;
    (async () => {
      const session = await currentSession();
      if (!session || cancelled) return;
      const fetchAll = async () => {
        const q = supabase.from(table).select('*');
        const { data, error } = orderBy ? await q.order(orderBy.col, { ascending: orderBy.asc }) : await q;
        if (error) { console.warn(`[service-program] ${table} fetch failed:`, error); return null; }
        return (data || []).map((r) => mapRow(r));
      };
      const initial = await fetchAll();
      if (initial && !cancelled) onChange(initial);
      channel = supabase
        .channel(`${table}-stream`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          fetchAll().then((rows) => { if (rows && !cancelled) onChange(rows); });
        })
        .subscribe();
    })();
    return function unsubscribe() {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  };
}

export const subscribePrograms = makeSubscriber('church_service_programs', toProgramShape, { col: 'service_date', asc: false });
export const subscribeSegments = makeSubscriber('church_service_segments', toSegmentShape, { col: 'sort_order', asc: true });

// Collaborative-edit institutional memory: the "who changed what" trail (0043).
export function toChangeShape(row) {
  return {
    id: row.id,
    programId: row.program_id ?? null,
    segmentId: row.segment_id ?? null,
    actorName: row.actor_name ?? null,
    action: row.action,
    summary: row.summary ?? null,
    createdAt: row.created_at ?? null,
  };
}
export const subscribeChanges = makeSubscriber('church_service_program_changes', toChangeShape, { col: 'created_at', asc: false });

// Roster slice used by the finalizer-management strip (owner/admin designates
// who is in the finalizer circle). Carries the is_finalizer flag (0043).
export function toFinalizerMemberShape(row) {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    displayName: row.display_name,
    choirRole: row.choir_role ?? 'member',
    isFinalizer: row.is_finalizer === true,
  };
}
export const subscribeFinalizerMembers = makeSubscriber('choir_members', toFinalizerMemberShape, { col: 'created_at', asc: true });

// --- Writes (finalizer circle via RLS; fail soft + surface to caller) --------
async function writeContext(displayName) {
  const session = await currentSession();
  if (!session) return { error: 'signed-out' };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { error: 'no-church' };
  return { tenantId, userId: session.user.id, actorName: resolveActorName(session) };
}

// Human-readable line for the change trail. Pure (exported for tests).
export function summarizeChange(action, title) {
  const t = title ? ` "${title}"` : '';
  switch (action) {
    case 'create-program': return 'Created the order of service';
    case 'edit-program':   return 'Edited the master order';
    case 'add-segment':    return `Added segment${t}`;
    case 'edit-segment':   return `Edited segment${t}`;
    case 'delete-segment': return `Removed segment${t}`;
    case 'seed-order':     return 'Started from the standard order';
    default:               return action;
  }
}

// Append to the institutional-memory trail. Best-effort: a logging failure never
// blocks (or rolls back) the edit it records.
async function logChange(ctx, programId, segmentId, action, title) {
  try {
    await supabase.from('church_service_program_changes').insert({
      instance_id: ctx.tenantId,
      program_id: programId ?? null,
      segment_id: segmentId ?? null,
      actor: ctx.userId,
      actor_name: ctx.actorName ?? null,
      action,
      summary: summarizeChange(action, title),
    });
  } catch (e) { console.warn('[service-program] change-log failed:', e); }
}

export async function saveProgram(program, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const row = {
    service_date: program.serviceDate ?? null,
    service_type: program.serviceType ?? 'sunday',
    service_slot: program.serviceSlot || null,
    title: program.title || 'Order of Worship',
    theme: program.theme || null,
    scripture_ref: program.scriptureRef || null,
    start_time: program.startTime || null,
    target_minutes: Number.isFinite(program.targetMinutes) ? program.targetMinutes : null,
    status: program.status || 'draft',
    notes: program.notes || null,
  };
  if (program.id) {
    const { error } = await supabase.from('church_service_programs').update({ ...row, updated_by: ctx.userId }).eq('id', program.id);
    if (error) return { skipped: 'update-error', error };
    await logChange(ctx, program.id, null, 'edit-program', program.title);
    return { saved: true };
  }
  const { data, error } = await supabase.from('church_service_programs')
    .insert({ ...row, instance_id: ctx.tenantId, created_by: ctx.userId }).select('id').single();
  if (error) return { skipped: 'insert-error', error };
  await logChange(ctx, data?.id, null, 'create-program', program.title);
  return { saved: true, id: data?.id };
}

export async function deleteProgram(id) {
  const { error } = await supabase.from('church_service_programs').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}

function segmentRow(seg) {
  return {
    title: seg.title || '',
    sector: seg.sector || 'general',
    owner_name: seg.ownerName || null,
    planned_minutes: Number.isFinite(seg.plannedMinutes) ? seg.plannedMinutes : 5,
    flexible: seg.flexible !== false,
    scripture_ref: seg.scriptureRef || null,
    sermon_id: seg.sermonId || null,
    song_ids: Array.isArray(seg.songIds) ? seg.songIds : [],
    cues: (seg.cues && typeof seg.cues === 'object') ? seg.cues : {},
    notes: seg.notes || null,
    sort_order: Number.isFinite(seg.sortOrder) ? seg.sortOrder : 0,
  };
}

export async function saveSegment(programId, seg, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const row = segmentRow(seg);
  if (seg.id) {
    const { error } = await supabase.from('church_service_segments').update({ ...row, updated_by: ctx.userId }).eq('id', seg.id);
    if (error) return { skipped: 'update-error', error };
    await logChange(ctx, programId, seg.id, 'edit-segment', seg.title);
    return { saved: true };
  }
  const { error } = await supabase.from('church_service_segments')
    .insert({ ...row, program_id: programId, instance_id: ctx.tenantId, created_by: ctx.userId });
  if (error) return { skipped: 'insert-error', error };
  await logChange(ctx, programId, null, 'add-segment', seg.title);
  return { saved: true };
}

// meta = { programId, title } so the deletion is recorded in the trail with a
// readable summary (the row is gone, but the institutional memory keeps it).
export async function deleteSegment(id, meta = {}) {
  const ctx = await writeContext(meta.displayName);
  const { error } = await supabase.from('church_service_segments').delete().eq('id', id);
  if (error) return { skipped: 'delete-error', error };
  if (!ctx.error) await logChange(ctx, meta.programId ?? null, id, 'delete-segment', meta.title);
  return { deleted: true };
}

// Insert a whole seed order at once (one-tap "start from template"). Best-effort;
// returns the count inserted. Fails soft per row so a partial template still lands.
export async function seedProgramSegments(programId, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const rows = seedDefaultOrder().map((seg) => ({
    ...segmentRow(seg), program_id: programId, instance_id: ctx.tenantId, created_by: ctx.userId,
  }));
  const { error } = await supabase.from('church_service_segments').insert(rows);
  if (error) return { skipped: 'insert-error', error };
  await logChange(ctx, programId, null, 'seed-order', null);
  return { saved: true, count: rows.length };
}

// Designate (or remove) a worship-team finalizer. Owner/admin only — the
// choir_members UPDATE policy (0011) enforces it, so a finalizer who is just a
// musician cannot promote others; governance stays with the stewards. This is
// how the keyboardist (Christian) is added to the circle once he's on the roster.
export async function setFinalizer(memberUserId, value, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const { error } = await supabase.from('choir_members')
    .update({ is_finalizer: value === true })
    .eq('instance_id', ctx.tenantId).eq('user_id', memberUserId);
  return error ? { skipped: 'update-error', error } : { saved: true };
}
