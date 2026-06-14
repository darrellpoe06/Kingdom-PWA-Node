// =============================================================================
// choir-sync — Supabase-backed Choir module (roster + songs + schedule + msgs)
// =============================================================================
// Mirrors engagement-sync.js / feedback-sync.js: tenant membership via
// ensureTenantMembership() before any write (so RLS passes), and a
// postgres_changes realtime stream so the choir's devices update live. Backed by
// the choir_members / choir_songs / choir_schedule / choir_messages tables from
// infra/supabase/migrations-auto/0011-choir-module.sql.
//
// ACCESS (decided 2026-06-14): read = any choir member (user_in_choir = owner/
// admin OR a row in choir_members); write/edit on roster/songs/schedule =
// owner/admin. Members may post choir messages. The client mirrors this with
// getChoirAccess() so editor controls only render for directors; RLS is the
// real enforcement either way.
// =============================================================================
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

function resolveDisplayName(session, explicit) {
  const trimmed = (explicit || '').trim();
  if (trimmed) return trimmed;
  return session.user.email?.split('@')[0] || 'Member';
}

// --- Pure mappers / helpers (exported for tests) -----------------------------

export function toSongShape(row) {
  return {
    id: row.id,
    title: row.title,
    youtubeUrl: row.youtube_url ?? null,
    scriptureRef: row.scripture_ref ?? null,
    notes: row.notes ?? null,
    serviceDate: row.service_date ?? null,
    serviceType: row.service_type ?? 'sunday',
    startSeconds: row.start_seconds ?? null,
    sortOrder: row.sort_order ?? 0,
    status: row.status ?? 'active',
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export function toSermonShape(row) {
  return {
    id: row.id,
    serviceDate: row.service_date ?? null,
    serviceType: row.service_type ?? 'sunday',
    title: row.title,
    speaker: row.speaker ?? null,
    scriptureRef: row.scripture_ref ?? null,
    youtubeUrl: row.youtube_url ?? null,
    videoId: row.video_id ?? null,
    startSeconds: row.start_seconds ?? null,
    notes: row.notes ?? null,
    status: row.status ?? 'active',
    source: row.source ?? 'manual',
    createdAt: row.created_at ?? null,
  };
}

export function toResourceShape(row) {
  return {
    id: row.id,
    title: row.title,
    url: row.url ?? null,
    note: row.note ?? null,
    createdAt: row.created_at ?? null,
  };
}

export function toScheduleShape(row) {
  return {
    id: row.id,
    serviceDate: row.service_date,
    serviceType: row.service_type,
    title: row.title ?? null,
    youtubeUrl: row.youtube_url ?? null,
    notes: row.notes ?? null,
  };
}

export function toMemberShape(row) {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    displayName: row.display_name,
    section: row.section ?? null,
    choirRole: row.choir_role ?? 'member',
    createdAt: row.created_at ?? null,
  };
}

export function toChoirMessageShape(row, myUserId) {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    body: row.body,
    createdAt: row.created_at,
    mine: row.user_id === myUserId,
  };
}

export function toAbsenceShape(row, myUserId) {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    memberId: row.member_id ?? null,
    memberName: row.member_name,
    startDate: row.start_date,
    endDate: row.end_date ?? null,
    reason: row.reason ?? null,
    backupMemberId: row.backup_member_id ?? null,
    backupUserId: row.backup_user_id ?? null,
    backupName: row.backup_name ?? null,
    backupStatus: row.backup_status ?? 'none',
    createdBy: row.created_by ?? null,
    mine: !!myUserId && (row.user_id === myUserId || row.created_by === myUserId),
    iAmBackup: !!myUserId && row.backup_user_id === myUserId,
  };
}

// Editor controls render only for directors; RLS still enforces it server-side.
export function deriveAccess(role, inChoir) {
  const canEdit = role === 'owner' || role === 'admin';
  return { canEdit, canSee: canEdit || !!inChoir };
}

// Normalize a YouTube URL to its embeddable form; null if not recognizable.
// Accepts watch?v=, youtu.be/, and /embed/ forms.
export function youtubeEmbedUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();
  let id = null;
  let m;
  if ((m = u.match(/[?&]v=([\w-]{11})/))) id = m[1];
  else if ((m = u.match(/youtu\.be\/([\w-]{11})/))) id = m[1];
  else if ((m = u.match(/\/embed\/([\w-]{11})/))) id = m[1];
  else if ((m = u.match(/^([\w-]{11})$/))) id = m[1];
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

// Future-or-today services first, soonest first; past services after, newest
// first. Keeps "this week" at the top of the schedule view.
export function sortServices(schedule, todayIso) {
  const today = todayIso || '';
  const future = [];
  const past = [];
  for (const s of schedule || []) {
    (s.serviceDate >= today ? future : past).push(s);
  }
  future.sort((a, b) => String(a.serviceDate).localeCompare(String(b.serviceDate)));
  past.sort((a, b) => String(b.serviceDate).localeCompare(String(a.serviceDate)));
  return [...future, ...past];
}

// Songs assigned to a given service date + type (a 'both' song shows on either).
export function songsForService(songs, serviceDate, serviceType) {
  return (songs || [])
    .filter((s) => s.status !== 'archived')
    .filter((s) => s.serviceDate === serviceDate && (s.serviceType === serviceType || s.serviceType === 'both'))
    .sort((a, b) => (a.sortOrder - b.sortOrder) || String(a.title).localeCompare(String(b.title)));
}

// Which week a date falls in relative to today: 'this' (within 7 days), 'next'
// (8-14 days), or 'later'. Past dates return 'past'. Lets the planner group
// upcoming services so Christina can plan this week + next week and beyond.
export function weekBucket(dateIso, todayIso) {
  if (!dateIso || !todayIso) return 'later';
  if (dateIso < todayIso) return 'past';
  const days = Math.floor((Date.parse(dateIso + 'T00:00:00') - Date.parse(todayIso + 'T00:00:00')) / 86400000);
  if (days <= 7) return 'this';
  if (days <= 14) return 'next';
  return 'later';
}

// Is a member out on a given date? Absence covers [startDate, endDate]; a null
// endDate means a single day.
export function isOutOnDate(absence, dateIso) {
  if (!absence || !absence.startDate) return false;
  const end = absence.endDate || absence.startDate;
  return dateIso >= absence.startDate && dateIso <= end;
}

// The member ids out on a given date (for "who's out" + backup suggestions).
export function membersOutOnDate(absences, dateIso) {
  return (absences || [])
    .filter((a) => isOutOnDate(a, dateIso))
    .map((a) => a.memberId)
    .filter(Boolean);
}

// Suggest backups for a member who is out on a date: same-section roster members
// who are NOT themselves out that day and aren't the absent member. Singers fill
// for singers; if the absent member has no section, suggest anyone available.
export function suggestBackups(members, absences, dateIso, absentMember) {
  const out = new Set(membersOutOnDate(absences, dateIso));
  const section = absentMember?.section || null;
  return (members || [])
    .filter((m) => m.id !== absentMember?.id)
    .filter((m) => !out.has(m.id))
    .filter((m) => (section ? m.section === section : true))
    .filter((m) => m.choirRole !== 'sound' && m.choirRole !== 'media' && m.choirRole !== 'tech');
}

// --- Timestamps (jump to the exact music / sermon moment in a service video) -

// Parse a "mm:ss", "h:mm:ss", or plain-seconds string into seconds (or null).
export function parseTimecode(text) {
  if (text == null || text === '') return null;
  const s = String(text).trim();
  if (/^\d+$/.test(s)) return Number(s);
  const parts = s.split(':').map((p) => Number(p));
  if (parts.some((n) => !Number.isFinite(n))) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

// Format seconds back to mm:ss / h:mm:ss for display.
export function formatTimecode(sec) {
  if (sec == null || !Number.isFinite(Number(sec))) return '';
  const total = Math.max(0, Math.floor(Number(sec)));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// A YouTube watch URL that opens at startSeconds (deep-link to the moment).
export function youtubeTimedUrl(url, startSeconds) {
  if (!url) return url || null;
  const sec = Number(startSeconds);
  if (!Number.isFinite(sec) || sec <= 0) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}t=${Math.floor(sec)}s`;
}

// The YouTube title parser lives in a dependency-free module so the local
// backfill script can share it. Re-exported here for the app + tests.
export { parseServiceTitle, extractYoutubeId } from './youtube-title-parse.js';

// --- Access ------------------------------------------------------------------

export async function getChoirAccess(displayName) {
  const session = await currentSession();
  if (!session) return { signedIn: false, canSee: false, canEdit: false, tenantId: null, role: null };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { signedIn: true, canSee: false, canEdit: false, tenantId: null, role: null };
  const [{ data: role }, { data: inChoir }] = await Promise.all([
    supabase.rpc('user_role_in_instance', { tenant_uuid: tenantId }),
    supabase.rpc('user_in_choir', { instance_uuid: tenantId }),
  ]);
  const { canEdit, canSee } = deriveAccess(role, inChoir);
  return { signedIn: true, canSee, canEdit, tenantId, role: role ?? null };
}

// --- Generic fetch + realtime subscribe --------------------------------------

function makeSubscriber(table, mapRow, orderBy) {
  return function subscribe(onChange) {
    let channel = null;
    let cancelled = false;
    (async () => {
      const session = await currentSession();
      if (!session || cancelled) return;
      const myUserId = session.user.id;
      const fetchAll = async () => {
        const q = supabase.from(table).select('*');
        const { data, error } = orderBy
          ? await q.order(orderBy.col, { ascending: orderBy.asc })
          : await q;
        if (error) { console.warn(`[choir-sync] ${table} fetch failed:`, error); return null; }
        return (data || []).map((r) => mapRow(r, myUserId));
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

export const subscribeSongs = makeSubscriber('choir_songs', toSongShape, { col: 'service_date', asc: true });
export const subscribeSchedule = makeSubscriber('choir_schedule', toScheduleShape, { col: 'service_date', asc: true });
export const subscribeMembers = makeSubscriber('choir_members', toMemberShape, { col: 'created_at', asc: true });
export const subscribeChoirMessages = makeSubscriber('choir_messages', toChoirMessageShape, { col: 'created_at', asc: true });
export const subscribeAbsences = makeSubscriber('choir_absences', toAbsenceShape, { col: 'start_date', asc: true });
export const subscribeSermons = makeSubscriber('choir_sermons', toSermonShape, { col: 'service_date', asc: false });
export const subscribeResources = makeSubscriber('choir_resources', toResourceShape, { col: 'created_at', asc: true });

// --- Writes (owner/admin via RLS; fail soft + surface to caller) -------------

async function writeContext(displayName) {
  const session = await currentSession();
  if (!session) return { error: 'signed-out' };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { error: 'no-church' };
  return { tenantId, userId: session.user.id, displayName: resolveDisplayName(session, displayName) };
}

export async function saveSong(song, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const row = {
    title: song.title ?? '',
    youtube_url: song.youtubeUrl ?? null,
    scripture_ref: song.scriptureRef ?? null,
    notes: song.notes ?? null,
    service_date: song.serviceDate ?? null,
    service_type: song.serviceType ?? 'sunday',
    start_seconds: Number.isFinite(song.startSeconds) ? song.startSeconds : null,
    sort_order: Number.isFinite(song.sortOrder) ? song.sortOrder : 0,
    status: song.status ?? 'active',
  };
  if (song.id) {
    const { error } = await supabase.from('choir_songs').update({ ...row, updated_by: ctx.userId }).eq('id', song.id);
    return error ? { skipped: 'update-error', error } : { saved: true };
  }
  const { error } = await supabase.from('choir_songs').insert({ ...row, instance_id: ctx.tenantId, created_by: ctx.userId });
  return error ? { skipped: 'insert-error', error } : { saved: true };
}

export async function deleteSong(id) {
  const { error } = await supabase.from('choir_songs').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}

// Reuse a past song on a future date: a NEW active song row carrying the same
// title / YouTube / scripture / notes, on the new date+type (Darrell 2026-06-14:
// "go back historical weeks ... move them to a future date so they can reuse old
// songs"). Pure so it's testable; saveSong inserts it (no id).
export function buildReusedSong(song, newDate, newType) {
  return {
    title: song.title,
    youtubeUrl: song.youtubeUrl ?? null,
    scriptureRef: song.scriptureRef ?? null,
    notes: song.notes ?? null,
    serviceDate: newDate,
    serviceType: newType || song.serviceType || 'sunday',
    startSeconds: song.startSeconds ?? null,
    sortOrder: 0,
    status: 'active',
  };
}

export async function reuseSong(song, newDate, newType, displayName) {
  return saveSong(buildReusedSong(song, newDate, newType), displayName);
}

export async function saveService(item, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const row = {
    service_date: item.serviceDate,
    service_type: item.serviceType,
    title: item.title ?? null,
    youtube_url: item.youtubeUrl ?? null,
    notes: item.notes ?? null,
  };
  if (item.id) {
    const { error } = await supabase.from('choir_schedule').update({ ...row, updated_by: ctx.userId }).eq('id', item.id);
    return error ? { skipped: 'update-error', error } : { saved: true };
  }
  const { error } = await supabase.from('choir_schedule').insert({ ...row, instance_id: ctx.tenantId, created_by: ctx.userId });
  return error ? { skipped: 'insert-error', error } : { saved: true };
}

export async function deleteService(id) {
  const { error } = await supabase.from('choir_schedule').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}

export async function addMember(member, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const { error } = await supabase.from('choir_members').insert({
    instance_id: ctx.tenantId,
    user_id: member.userId ?? null,
    display_name: member.displayName ?? '',
    section: member.section ?? null,
    choir_role: member.choirRole ?? 'member',
    added_by: ctx.userId,
  });
  return error ? { skipped: 'insert-error', error } : { saved: true };
}

export async function removeMember(id) {
  const { error } = await supabase.from('choir_members').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}

export async function sendChoirMessage(body, displayName) {
  const text = (body || '').trim();
  if (!text) return { skipped: 'empty' };
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const { error } = await supabase.from('choir_messages').insert({
    instance_id: ctx.tenantId,
    user_id: ctx.userId,
    display_name: ctx.displayName,
    body: text,
  });
  return error ? { skipped: 'insert-error', error } : { uploaded: true };
}

// --- Availability / absences -------------------------------------------------

// Log (or edit) an absence. A member schedules their OWN time out and may
// request a backup. created_by is always the signed-in user (RLS requires it);
// user_id defaults to the signed-in user unless a director logs it for someone.
export async function saveAbsence(absence, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const hasBackup = !!(absence.backupMemberId || absence.backupUserId || absence.backupName);
  const row = {
    user_id: absence.userId ?? ctx.userId,
    member_id: absence.memberId ?? null,
    member_name: absence.memberName ?? ctx.displayName,
    start_date: absence.startDate,
    end_date: absence.endDate || null,
    reason: absence.reason ?? null,
    backup_member_id: absence.backupMemberId ?? null,
    backup_user_id: absence.backupUserId ?? null,
    backup_name: absence.backupName ?? null,
    backup_status: hasBackup ? (absence.backupStatus || 'requested') : 'none',
  };
  if (absence.id) {
    const { error } = await supabase.from('choir_absences').update({ ...row, updated_by: ctx.userId }).eq('id', absence.id);
    return error ? { skipped: 'update-error', error } : { saved: true };
  }
  const { error } = await supabase.from('choir_absences').insert({ ...row, instance_id: ctx.tenantId, created_by: ctx.userId });
  return error ? { skipped: 'insert-error', error } : { saved: true };
}

export async function deleteAbsence(id) {
  const { error } = await supabase.from('choir_absences').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}

// The requested backup confirms or declines covering the absence. RLS allows the
// row's backup_user_id (set when the backup is a linked app user) to update it.
export async function respondToBackup(id, accept) {
  const { error } = await supabase.from('choir_absences')
    .update({ backup_status: accept ? 'confirmed' : 'declined' })
    .eq('id', id);
  return error ? { skipped: 'update-error', error } : { saved: true };
}

// --- Sermons / message library -----------------------------------------------

export async function saveSermon(sermon, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const row = {
    service_date: sermon.serviceDate ?? null,
    service_type: sermon.serviceType ?? 'sunday',
    title: sermon.title ?? '',
    speaker: sermon.speaker ?? null,
    scripture_ref: sermon.scriptureRef ?? null,
    youtube_url: sermon.youtubeUrl ?? null,
    video_id: sermon.videoId ?? null,
    start_seconds: Number.isFinite(sermon.startSeconds) ? sermon.startSeconds : null,
    notes: sermon.notes ?? null,
    status: sermon.status ?? 'active',
    source: sermon.source ?? 'manual',
  };
  if (sermon.id) {
    const { error } = await supabase.from('choir_sermons').update({ ...row, updated_by: ctx.userId }).eq('id', sermon.id);
    return error ? { skipped: 'update-error', error } : { saved: true };
  }
  const { error } = await supabase.from('choir_sermons').insert({ ...row, instance_id: ctx.tenantId, created_by: ctx.userId });
  return error ? { skipped: 'insert-error', error } : { saved: true };
}

export async function deleteSermon(id) {
  const { error } = await supabase.from('choir_sermons').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}

// Reuse a past message as a starting point for a NEW one: a fresh DRAFT carrying
// the title/scripture/notes (and a back-reference to the original video) on a
// future date — BG curates the new sermon from the old. Pure so it's testable.
export function buildReusedSermon(sermon, newDate, newType) {
  return {
    serviceDate: newDate,
    serviceType: newType || sermon.serviceType || 'sunday',
    title: sermon.title,
    speaker: sermon.speaker ?? null,
    scriptureRef: sermon.scriptureRef ?? null,
    notes: [sermon.notes, sermon.youtubeUrl ? `Drawn from: ${sermon.youtubeUrl}` : null].filter(Boolean).join('\n'),
    youtubeUrl: null,
    startSeconds: null,
    status: 'draft',
    source: 'manual',
  };
}

export async function reuseSermon(sermon, newDate, newType, displayName) {
  return saveSermon(buildReusedSermon(sermon, newDate, newType), displayName);
}

// --- Resources (director-curated) --------------------------------------------

export async function saveResource(resource, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const { error } = await supabase.from('choir_resources').insert({
    instance_id: ctx.tenantId,
    title: resource.title ?? '',
    url: resource.url ?? null,
    note: resource.note ?? null,
    created_by: ctx.userId,
  });
  return error ? { skipped: 'insert-error', error } : { saved: true };
}

export async function deleteResource(id) {
  const { error } = await supabase.from('choir_resources').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}
