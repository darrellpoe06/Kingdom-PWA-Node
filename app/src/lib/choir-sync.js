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
import { publicRpc } from './public-rpc.js';
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
    title: decodeHtmlEntities(row.title),
    youtubeUrl: row.youtube_url ?? null,
    scriptureRef: row.scripture_ref ?? null,
    notes: row.notes ?? null,
    lyrics: row.lyrics ?? null,
    serviceDate: row.service_date ?? null,
    serviceType: row.service_type ?? 'sunday',
    startSeconds: row.start_seconds ?? null,
    sortOrder: row.sort_order ?? 0,
    status: row.status ?? 'active',
    // Cross-reference + practical metadata (0041) — see lib/choir-songbook.js.
    themes: Array.isArray(row.themes) ? row.themes : [],
    songKey: row.song_key ?? null,
    arrangement: row.arrangement ?? null,
    soloist: row.soloist ?? null,
    sermonRef: row.sermon_ref ?? null,
    // Archive provenance (0042) — auto-seeded from the church archive. A row IS
    // one rendition; these ALSO carry that performance's source honesty (the
    // renditions surface, lib/choir-renditions.js, reads source/videoId/
    // confidence/needsReview rather than adding parallel columns).
    source: row.source ?? 'manual',
    videoId: row.video_id ?? null,
    confidence: row.confidence ?? null,
    needsReview: !!row.needs_review,
    // Per-rendition story (0043) — see lib/choir-renditions.js. The ad-libs and
    // the keyboardist's per-PERFORMANCE notes for THIS rendition (distinct from
    // the song-level SME notes in choir_sme_notes, 0042).
    adLibs: Array.isArray(row.ad_libs) ? row.ad_libs : [],
    keyboardistNotes: row.keyboardist_notes ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export function toSermonShape(row) {
  return {
    id: row.id,
    serviceDate: row.service_date ?? null,
    serviceType: row.service_type ?? 'sunday',
    // Decoded at the mapper (DR-0139): harvested titles arrive entity-encoded
    // ('&QUOT;DON'T…'), and rows already stored that way heal at render.
    title: decodeHtmlEntities(row.title),
    speaker: row.speaker ?? null,
    speakerId: row.speaker_id ?? null,   // canonical speaker entity (0037); null on the public RPC path
    scriptureRef: row.scripture_ref ?? null,
    serviceSlot: row.service_slot ?? null,
    youtubeUrl: row.youtube_url ?? null,
    videoId: row.video_id ?? null,
    startSeconds: row.start_seconds ?? null,
    notes: row.notes ?? null,
    status: row.status ?? 'active',
    source: row.source ?? 'manual',
    sourceSermonId: row.source_sermon_id ?? null,   // re-preach lineage (0038)
    sourceSpeakerId: row.source_speaker_id ?? null, // original deliverer's entity
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

// Canonical preacher/teacher entity (0037). The typeahead source so a new
// message resolves to an existing speaker instead of re-spelling free text.
export function toSpeakerShape(row) {
  return {
    id: row.id,
    canonicalName: row.canonical_name,
    nameKey: row.name_key ?? null,
    aliases: Array.isArray(row.aliases) ? row.aliases : [],
    isPrimary: !!row.is_primary,
    roleTitle: row.role_title ?? null,
  };
}

export function toSermonDocShape(row) {
  return {
    id: row.id,
    sermonId: row.sermon_id,
    documentUrl: row.document_url,
    documentSource: row.document_source ?? null,
  };
}

export function toTeamDocShape(row) {
  return {
    id: row.id,
    docDate: row.doc_date ?? null,
    docType: row.doc_type ?? 'other',
    title: row.title,
    documentUrl: row.document_url ?? null,
    documentSource: row.document_source ?? null,
    createdAt: row.created_at ?? null,
  };
}

export function toScheduleShape(row) {
  return {
    id: row.id,
    serviceDate: row.service_date,
    serviceType: row.service_type,
    title: decodeHtmlEntities(row.title) ?? null,
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
// Accepts watch?v=, youtu.be/, /embed/, /live/, /shorts/, /v/, and bare-id forms.
//
// WHY /live/ and /shorts/ (added 2026-06-23): the church's service recordings on
// YouTube carry the `youtube.com/live/<id>` URL (that is the link a director
// copies straight off a finished livestream — "the YouTube recording of this
// service"), and short clips carry `youtube.com/shorts/<id>`. Neither form was
// recognized before, so a pasted live-stream link fell through to null and the
// embed silently degraded to a plain "Open link" — the "choir YouTube link →
// video processing broken" report (feedback d23b37f3). Recognizing them embeds
// the video in place. Pure + additive: every URL that embedded before still
// embeds; nothing that resolved to a real id changes.
export function youtubeEmbedUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();
  let id = null;
  let m;
  if ((m = u.match(/[?&]v=([\w-]{11})/))) id = m[1];
  else if ((m = u.match(/youtu\.be\/([\w-]{11})/))) id = m[1];
  else if ((m = u.match(/\/embed\/([\w-]{11})/))) id = m[1];
  else if ((m = u.match(/\/live\/([\w-]{11})/))) id = m[1];
  else if ((m = u.match(/\/shorts\/([\w-]{11})/))) id = m[1];
  else if ((m = u.match(/\/v\/([\w-]{11})/))) id = m[1];
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

// The past-services list for the Choir "This week" panel. HISTORY is the real
// service corpus, not just the planning calendar: a card shows for any past
// service that has a planned schedule row, OR at least one song on it (manual OR
// a harvested draft), OR a service RECORDING to watch. The watchable rule is the
// 2026-07-10 fix (DR-0137): the history read only 7 services because the corpus's
// recorded-but-songless services were filtered out as "empty cards" — but to the
// choir a recorded service IS history (Darrell: "the Choir tab still only has 7
// videos in the history"). Only a row with none of the three — no plan, no
// setlist, no video — stays hidden as noise.
// Deduped by date|type, newest-first. Pure + channel-agnostic (callers pass the
// already tenant-scoped rows). Each entry is a service-card shape:
//   { id, serviceDate, serviceType, title, youtubeUrl }
export function buildPastServices(schedule, sermons, songs, todayIso) {
  const today = todayIso || '';
  const byKey = new Map();
  const keyOf = (d, t) => `${d}|${t || 'sunday'}`;
  const consider = (svc, isSchedule) => {
    if (!svc || !svc.serviceDate || svc.serviceDate >= today) return;
    const type = svc.serviceType || 'sunday';
    const k = keyOf(svc.serviceDate, type);
    const prev = byKey.get(k);
    // A schedule row is authoritative for title/link; a sermon fills gaps.
    byKey.set(k, {
      id: (prev && prev.id) || svc.id || k,
      serviceDate: svc.serviceDate,
      serviceType: type,
      title: (isSchedule ? svc.title : (prev && prev.title)) || (prev && prev.title) || svc.title || null,
      youtubeUrl: (isSchedule ? svc.youtubeUrl : (prev && prev.youtubeUrl)) || (prev && prev.youtubeUrl) || svc.youtubeUrl || null,
      _scheduled: (prev && prev._scheduled) || isSchedule,
    });
  };
  for (const s of schedule || []) consider(s, true);
  for (const s of sermons || []) consider(s, false);
  // Keep a service if it was planned, has a setlist, or is WATCHABLE (any
  // dated recording). The old Sunday-only rule (2026-07-10) hid 142 dated
  // weekday recordings and left 52 of an 897-row corpus visible — superseded
  // by Darrell 2026-08-03 ("only 52 of the 800 plus"): every dated service
  // with a recording is the choir's browsable history; the card's own
  // day/type label says which weekday it was. Rows with no date at all still
  // cannot render on a dated list — they surface via the undated-remainder
  // note until the corpus pipeline dates them (DR-0266/DR-0267).
  const out = [];
  for (const svc of byKey.values()) {
    const hasSongs = songsForService(songs, svc.serviceDate, svc.serviceType).length > 0;
    const watchable = !!svc.youtubeUrl;
    if (svc._scheduled || hasSongs || watchable) {
      const { _scheduled, ...clean } = svc;
      out.push(clean);
    }
  }
  return out.sort((a, b) => String(b.serviceDate).localeCompare(String(a.serviceDate)));
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
  // Everyone who could actually stand in that day: not the absent member, not
  // already scheduled out, not a tech/sound/media role (they don't sing a part).
  const freeSingers = (members || [])
    .filter((m) => m.id !== absentMember?.id)
    .filter((m) => !out.has(m.id))
    .filter((m) => m.choirRole !== 'sound' && m.choirRole !== 'media' && m.choirRole !== 'tech');
  if (!section) return freeSingers;
  // PREFER same-section (they cover the exact part) — but never DEAD-END the
  // request: if no same-section singer is free, fall back to any free singer so a
  // backup can always be asked for (the surface promises "request a backup").
  const sameSection = freeSingers.filter((m) => m.section === section);
  return sameSection.length ? sameSection : freeSingers;
}

// Who may respond (confirm/decline) to a REQUESTED backup: the chosen backup
// themselves (iAmBackup), OR the director (canEdit — owner/admin, which RLS
// already permits) on their behalf. The director path keeps a request from being
// stuck at 'requested' forever when the chosen singer has no linked account yet.
export function canRespondToBackup(absence, canEdit) {
  if (!absence || !absence.backupName || absence.backupStatus !== 'requested') return false;
  return !!(absence.iAmBackup || canEdit);
}

// Are the offered backups a cross-section fallback? (True when the absent member
// has a section but NO same-section singer is free, so suggestBackups returned
// others.) Lets the UI label the list honestly instead of claiming "same-section".
export function backupsAreCrossSection(suggestions, absentMember) {
  const section = absentMember?.section || null;
  if (!section || !Array.isArray(suggestions) || suggestions.length === 0) return false;
  return !suggestions.some((m) => m.section === section);
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
import { parseServiceTitle as _parseTitle, decodeHtmlEntities } from './youtube-title-parse.js';
export { parseServiceTitle, extractYoutubeId, decodeHtmlEntities } from './youtube-title-parse.js';

// Pure: turn raw {videoId, title} channel items into NEW choir_sermons rows —
// parse the title, keep only dated ones, drop any whose video is already stored
// (idempotent re-import). Exported for tests; used by importSermonsFromChannel.
export function selectNewSermonImports(items, existingVideoIds) {
  const have = new Set(existingVideoIds || []);
  const out = [];
  for (const it of items || []) {
    if (!it.videoId || have.has(it.videoId)) continue;
    const p = _parseTitle(it.title);
    // EVERY new channel video is imported — the archive must match the channel
    // (Darrell 2026-07-16: "there are 850 videos on YouTube... get the others").
    // Date, best-effort: the title's date, else the YouTube UPLOAD date; a video
    // with no date anywhere still lands (dateless, sorted last) — never dropped.
    const uploadDate = (typeof it.publishedAt === 'string' && /^\d{4}-\d{2}-\d{2}/.test(it.publishedAt)) ? it.publishedAt.slice(0, 10) : null;
    const serviceDate = p.serviceDate || uploadDate || null;
    out.push({
      videoId: it.videoId,
      youtubeUrl: `https://www.youtube.com/watch?v=${it.videoId}`,
      serviceDate,
      serviceType: p.serviceType,
      title: p.title || String(it.title || '').trim() || 'Untitled message',
      speaker: p.speaker,
      source: 'youtube',
    });
    have.add(it.videoId); // dedup WITHIN this call too (the same video across pages)
  }
  return out;
}

// Stable dedupe key for a sermon/message row — mirrors migration 0061's guard.
// A row with a source video is keyed by that video; a video-less row (the study
// drafts the harvest generates) is keyed by its content: title + date + service.
// Accepts either camelCase (app shape) or snake_case (DB row).
export function sermonDedupeKey(s) {
  const vid = s.videoId ?? s.video_id;
  if (vid) return `v:${vid}`;
  const title = String(s.title || '').trim().toLowerCase();
  const date = s.serviceDate ?? s.service_date ?? '';
  const type = s.serviceType ?? s.service_type ?? '';
  const slot = s.serviceSlot ?? s.service_slot ?? '';
  return `t:${title}|${date}|${type}|${slot}`;
}

// Collapse duplicate sermons, keeping the FIRST occurrence of each stable key.
// Belt-and-suspenders for the UI: the served library shows deduped rows the
// moment this ships, even before migration 0061 has run against the cloud DB.
// Returns { kept, dropped }.
export function dedupeSermons(rows) {
  const seen = new Set();
  const kept = [];
  const dropped = [];
  for (const r of (Array.isArray(rows) ? rows : [])) {
    const k = sermonDedupeKey(r);
    if (seen.has(k)) dropped.push(r);
    else { seen.add(k); kept.push(r); }
  }
  return { kept, dropped };
}

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
  return function subscribe(onChange, onError) {
    let channel = null;
    let cancelled = false;
    (async () => {
      // Cold-start race (Darrell 2026-07-15, "we don't have any Word in the Word
      // Tab"): getSession() can return null for a beat on a fresh load, BEFORE
      // the persisted session is read. The old code bailed silently on that null
      // -> onChange never fired -> the list sat at "No messages yet." though the
      // session and the rows were both there a moment later. Retry briefly; only
      // after the session truly doesn't arrive do we report an honest empty.
      let session = null;
      for (let i = 0; i < 8 && !cancelled; i += 1) {
        session = await currentSession();
        if (session) break;
        await new Promise((r) => setTimeout(r, 250));
      }
      if (cancelled) return;
      if (!session) { onChange([]); return; } // genuinely signed out -> honest empty, never a hang
      const myUserId = session.user.id;
      const fetchAll = async () => {
        const q = supabase.from(table).select('*');
        const { data, error } = orderBy
          ? await q.order(orderBy.col, { ascending: orderBy.asc })
          : await q;
        if (error) { console.warn(`[choir-sync] ${table} fetch failed:`, error); if (onError) onError(error); return null; }
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
// Canonical speakers (0037) — owner/admin reads the set for the add-message
// typeahead, so a new credit resolves to an existing person, not a new spelling.
export const subscribeSpeakers = makeSubscriber('church_speakers', toSpeakerShape, { col: 'canonical_name', asc: true });

// The Word — Migdal PUBLIC library. Calls the SECURITY DEFINER RPC
// theword_public_sermons() (migration 0029), which returns ONLY published
// (non-draft), colg-scoped messages — no drafts, no prep notes, no documents.
// Works for ANYONE, including signed-out/anon (the RPC is granted to anon), so
// the congregation + the unchurched can watch the sermon library (Father's-
// Business reach). The table itself stays owner/admin (RLS), so prep/drafts never
// leak.
//
// Rides publicRpc (anon key + hard 12s deadline), NEVER the shared supabase
// client: the shared client awaits auth.getSession() first, which waits on a
// CROSS-TAB navigator lock shared by every PoeTech window on this origin. A
// wedged/backgrounded PoeTech tab holds that lock and — because browser fetch()
// has no timeout — the library request never returns, stranding the surface on
// "Loading the Word…" forever with no Retry (Darrell 2026-07-19, many PoeTech
// tabs open). Same fix as fetchShowcase (2026-07-07 gallery hang).
//
// On a hard error/timeout this THROWS so the caller lights up its honest
// error+Retry state — a false "No messages yet." on a real failure is exactly
// the dishonest empty the three-state design forbids (DR-0076). A genuine empty
// library still resolves to [].
export async function fetchPublicSermons() {
  const { data, error } = await publicRpc('theword_public_sermons');
  if (error) throw new Error(error.message || 'theword-public-library-failed');
  return (data || []).map((r) => toSermonShape(r));
}

export const subscribeResources = makeSubscriber('choir_resources', toResourceShape, { col: 'created_at', asc: true });
export const subscribeTeamDocuments = makeSubscriber('choir_team_documents', toTeamDocShape, { col: 'doc_date', asc: false });

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
    lyrics: song.lyrics ?? null,
    service_date: song.serviceDate ?? null,
    service_type: song.serviceType ?? 'sunday',
    start_seconds: Number.isFinite(song.startSeconds) ? song.startSeconds : null,
    sort_order: Number.isFinite(song.sortOrder) ? song.sortOrder : 0,
    status: song.status ?? 'active',
    // Cross-reference + practical metadata (0041). themes is text[]; the rest
    // are nullable text/uuid. Only written when provided (additive).
    themes: Array.isArray(song.themes) ? song.themes : [],
    song_key: song.songKey ?? null,
    arrangement: song.arrangement ?? null,
    soloist: song.soloist ?? null,
    sermon_ref: song.sermonRef ?? null,
  };
  // Archive provenance (0042) — written ONLY when provided, so a manual save
  // (SongForm) never resets an archive-seeded row's source back to 'manual'.
  if (song.source !== undefined) row.source = song.source || 'manual';
  if (song.videoId !== undefined) row.video_id = song.videoId || null;
  if (song.confidence !== undefined) row.confidence = song.confidence || null;
  if (song.needsReview !== undefined) row.needs_review = !!song.needsReview;
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
    lyrics: song.lyrics ?? null,
    serviceDate: newDate,
    serviceType: newType || song.serviceType || 'sunday',
    startSeconds: song.startSeconds ?? null,
    sortOrder: 0,
    status: 'active',
    // Carry the cross-reference forward so a reused song keeps its themes /
    // scripture / key / arrangement / soloist (0041) — the new row stays
    // cross-referenced without re-tagging.
    themes: Array.isArray(song.themes) ? song.themes : [],
    songKey: song.songKey ?? null,
    arrangement: song.arrangement ?? null,
    soloist: song.soloist ?? null,
    sermonRef: song.sermonRef ?? null,
  };
}

export async function reuseSong(song, newDate, newType, displayName) {
  return saveSong(buildReusedSong(song, newDate, newType), displayName);
}

// The distinct song CATALOG for the "pick from imported songs" picker (Christina
// 2026-07-04: "link it to songs and be able to choose from the songs that have
// already been imported... so you are not doing double duty"). Dedupes the full
// song list by title (case-insensitive), keeping the richest record (one with
// lyrics, then a video), sorted by title. Pure — the picker maps over it and the
// existing reuseSong pipeline schedules the chosen song onto a date.
export function distinctSongCatalog(songs) {
  const byTitle = new Map();
  const score = (x) => (x && x.lyrics ? 2 : 0) + (x && x.youtubeUrl ? 1 : 0);
  for (const s of (Array.isArray(songs) ? songs : [])) {
    const key = String((s && s.title) || '').trim().toLowerCase();
    if (!key) continue;
    const prev = byTitle.get(key);
    if (!prev || score(s) > score(prev)) byTitle.set(key, s);
  }
  return [...byTitle.values()].sort((a, b) => String(a.title).localeCompare(String(b.title)));
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

// Change a roster member's DESCRIPTIVE choir role (member/musician/sound/media/tech/
// director/assistant). This is the section-team label, not app authority —
// choir_members_update RLS (0011) already lets owner/admin update it. Edit ACCESS
// (co-director) is a separate instance-role change via member-roles.setMemberRole.
export async function updateChoirRole(id, choirRole) {
  if (!id || !choirRole) return { skipped: 'bad-args' };
  const { error } = await supabase.from('choir_members').update({ choir_role: choirRole }).eq('id', id);
  return error ? { skipped: 'update-error', error } : { updated: true };
}

// Invite a choir/media member into the church instance by email + role. They get
// access (and see the Choir tab) the next time they sign in — join_church_instance
// accepts the pending invite. Owner/admin only (enforced in the RPC).
export function isValidInviteEmail(email) {
  const e = String(email || '').trim();
  return e.length > 3 && /\S+@\S+\.\S+/.test(e);
}

export async function inviteToChurch(email, role) {
  if (!isValidInviteEmail(email)) return { skipped: 'bad-email' };
  const { data, error } = await supabase.rpc('invite_to_church', {
    email_in: String(email).trim(),
    role_in: role || 'member',
  });
  return error ? { skipped: 'invite-error', error } : { invited: true, id: data };
}

// --- Roster self-claim (DR-0220 / DR-0187 leg 1) ------------------------------
// A roster row with user_id = NULL is INERT — user_in_choir() never matches it,
// so a rostered singer can't see the Choir surface until their account is linked
// to their row. Migration 0110 closes that with a director-issued one-time code:
// the director mints a code for the unclaimed row and reads it to the member
// (human-to-human — "DMs not SMS", no external channel required); the member
// redeems it here, which links choir_members.user_id = auth.uid(). Linking grants
// READ + own-absence only; it never touches instance_members.role, so claiming a
// 'director' roster row does NOT make anyone an owner/admin (choir_role is
// descriptive — 0011:43).

// Normalize a typed code to EXACTLY what the RPC compares against — uppercase +
// whitespace stripped (the server does upper(trim()); codes contain no spaces).
// Deliberately NO confusable-folding: the alphabet is already confusable-free
// (no 0/O/1/I/L/U), so any substitution here could only turn a VALID typed code
// invalid. Keep the client and server normalization identical.
export function normalizeClaimCode(raw) {
  return String(raw || '').toUpperCase().replace(/\s+/g, '');
}

// Owner/admin mints a one-time claim code for an unclaimed roster row.
// Returns { code, expiresAt, displayName } or { skipped, error }.
export async function mintClaimCode(memberId) {
  if (!memberId) return { skipped: 'no-member' };
  const { data, error } = await supabase.rpc('mint_choir_claim_code', { member_id_in: memberId });
  if (error) return { skipped: 'mint-error', error };
  return { code: data?.code ?? null, expiresAt: data?.expires_at ?? null, displayName: data?.display_name ?? null };
}

// The signed-in member redeems a code. Returns the RPC envelope:
// { status: 'linked'|'invalid'|'already-linked', ... } or { skipped, error }.
export async function claimChoirMember(rawCode) {
  const code = normalizeClaimCode(rawCode);
  if (!code) return { skipped: 'no-code' };
  const { data, error } = await supabase.rpc('claim_choir_member', { code_in: code });
  if (error) return { skipped: 'claim-error', error };
  return data || { status: 'invalid' };
}

// The caller's own linked roster row(s) in the church instance, so the surface can
// show "you're linked as X (section)" + personalize "songs you're leading". Returns
// an array of { memberId, displayName, section, choirRole } (empty if unlinked).
export async function getMyChoirMembership(displayName) {
  const session = await currentSession();
  if (!session) return [];
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return [];
  const { data, error } = await supabase.rpc('my_choir_membership', { instance_uuid: tenantId });
  if (error) { console.warn('[choir-sync] my_choir_membership failed:', error); return []; }
  return (data || []).map((r) => ({
    memberId: r.member_id,
    displayName: r.display_name,
    section: r.section ?? null,
    choirRole: r.choir_role ?? 'member',
  }));
}

// --- Sent invites (the director's "who have I already invited?" view) --------
// Christina (2026-07-12): she needs to SEE who she already sent an invite to, so
// she doesn't guess or double-invite. The rows already exist in instance_invites
// (written by invite_to_church) and owner/admin already have a SELECT on them
// (policy instance_invites_admin_read, schema-v2.1-infra) — so this reads the
// real rows directly, no new migration. SCOPED to the church instance so a
// governor who ALSO owns the family instance never sees family invites bleed
// into the choir roster. Live: a new invite or an acceptance updates the list.

// instance_invites has no created_at; expires_at defaults to (invited + 14 days)
// in migration 0014, so the SEND date is derivable for display.
const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export function toInviteShape(row) {
  const expiresAt = row.expires_at ?? null;
  const invitedAt = expiresAt
    ? new Date(Date.parse(expiresAt) - INVITE_TTL_MS).toISOString()
    : null;
  return {
    id: row.id,
    email: row.email,
    role: row.role ?? 'member',
    invitedBy: row.invited_by ?? null,
    acceptedAt: row.accepted_at ?? null,
    expiresAt,
    invitedAt,
  };
}

// Pure: an invite is 'accepted' once it's been consumed at sign-in; otherwise
// 'expired' if past its window, else still 'pending' (the actionable state).
export function deriveInviteStatus(invite, nowMs) {
  if (!invite) return 'pending';
  if (invite.acceptedAt) return 'accepted';
  const exp = invite.expiresAt ? Date.parse(invite.expiresAt) : NaN;
  if (Number.isFinite(exp) && Number.isFinite(nowMs) && exp <= nowMs) return 'expired';
  return 'pending';
}

// Pure: newest invite first, so "who did I just invite?" is at the top.
export function sortInvites(invites) {
  return [...(invites || [])].sort((a, b) =>
    String(b.invitedAt || '').localeCompare(String(a.invitedAt || '')));
}

// Scoped, live subscriber (mirrors makeSubscriber but pinned to the church
// instance — the generic all-rows read would mix in family invites for a
// governor who owns both). Non-admins get [] (RLS), so it degrades quietly.
export function subscribeChurchInvites(onChange, displayName) {
  let channel = null;
  let cancelled = false;
  (async () => {
    const session = await currentSession();
    if (!session || cancelled) return;
    const tenantId = await churchInstanceId(displayName);
    if (!tenantId || cancelled) return;
    const fetchAll = async () => {
      const { data, error } = await supabase
        .from('instance_invites')
        .select('*')
        .eq('instance_id', tenantId)
        .order('expires_at', { ascending: false });
      if (error) { console.warn('[choir-sync] instance_invites fetch failed:', error); return null; }
      return (data || []).map(toInviteShape);
    };
    const initial = await fetchAll();
    if (initial && !cancelled) onChange(initial);
    channel = supabase
      .channel('church-invites-stream')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'instance_invites', filter: `instance_id=eq.${tenantId}` },
        () => { fetchAll().then((rows) => { if (rows && !cancelled) onChange(rows); }); })
      .subscribe();
  })();
  return function unsubscribe() {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
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
    service_slot: sermon.serviceSlot ?? null,
    youtube_url: sermon.youtubeUrl ?? null,
    video_id: sermon.videoId ?? null,
    start_seconds: Number.isFinite(sermon.startSeconds) ? sermon.startSeconds : null,
    notes: sermon.notes ?? null,
    status: sermon.status ?? 'active',
    source: sermon.source ?? 'manual',
    source_sermon_id: sermon.sourceSermonId ?? null,   // re-preach lineage (0038)
    source_speaker_id: sermon.sourceSpeakerId ?? null,
  };
  if (sermon.id) {
    const { error } = await supabase.from('choir_sermons').update({ ...row, updated_by: ctx.userId }).eq('id', sermon.id);
    return error ? { skipped: 'update-error', error } : { saved: true, id: sermon.id };
  }
  const { data, error } = await supabase.from('choir_sermons').insert({ ...row, instance_id: ctx.tenantId, created_by: ctx.userId }).select('id').single();
  return error ? { skipped: 'insert-error', error } : { saved: true, id: data?.id };
}

export async function deleteSermon(id) {
  const { error } = await supabase.from('choir_sermons').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}

// Sermon documents — OWNER/ADMIN ONLY (only BG/Darrell/Christina). RLS returns
// nothing to other members, so non-admins never receive a document link.
export const subscribeSermonDocuments = makeSubscriber('choir_sermon_documents', toSermonDocShape, { col: 'created_at', asc: true });

export async function saveSermonDocument(sermonId, documentUrl, source) {
  if (!sermonId) return { skipped: 'no-sermon' };
  const url = (documentUrl || '').trim();
  const ctx = await writeContext();
  if (ctx.error) return { skipped: ctx.error };
  // Clearing the field removes the document; one document per sermon.
  await supabase.from('choir_sermon_documents').delete().eq('sermon_id', sermonId);
  if (!url) return { saved: true, cleared: true };
  const { error } = await supabase.from('choir_sermon_documents').insert({
    instance_id: ctx.tenantId,
    sermon_id: sermonId,
    document_url: url,
    document_source: source || 'manual',
    created_by: ctx.userId,
  });
  return error ? { skipped: 'insert-error', error } : { saved: true };
}

// Re-preach a past message: a fresh DRAFT that BG curates from the original,
// crediting the RE-PREACHER (BG — the canonical primary speaker) while keeping a
// link back to the SOURCE message + the ORIGINAL deliverer's entity, so both are
// visible and BG can pull up the source preacher's material. This is BG's actual
// workflow (Darrell 2026-06-17) — NOT a copy of the source's speaker. Pass the
// re-preacher's canonical entity (the instance's primary speaker); if absent we
// keep the source's speaker rather than guess. Pure so it's testable.
export function buildReusedSermon(sermon, newDate, newType, repreacher) {
  const repreachName = repreacher?.canonicalName || sermon.speaker || null;
  const original = sermon.speaker || null;
  const isRepreach = !!repreacher && repreachName !== original && !!original;
  return {
    serviceDate: newDate,
    serviceType: newType || sermon.serviceType || 'sunday',
    title: sermon.title,
    speaker: repreachName,                 // credited to the re-preacher (BG)
    scriptureRef: sermon.scriptureRef ?? null,
    notes: [
      sermon.notes,
      isRepreach ? `Re-preached by ${repreachName}; original by ${original}.` : null,
      sermon.youtubeUrl ? `Drawn from: ${sermon.youtubeUrl}` : null,
    ].filter(Boolean).join('\n'),
    youtubeUrl: null,
    startSeconds: null,
    status: 'draft',
    source: 'manual',
    sourceSermonId: sermon.id ?? null,            // pull up the original material
    sourceSpeakerId: sermon.speakerId ?? null,    // durable credit to the original deliverer
  };
}

export async function reuseSermon(sermon, newDate, newType, repreacher, displayName) {
  return saveSermon(buildReusedSermon(sermon, newDate, newType, repreacher), displayName);
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

// A sermon document is either an external link (manually pasted) or a private
// Storage path (imported from BG's email). Pure: tells them apart.
export function isExternalUrl(u) {
  return typeof u === 'string' && /^https?:\/\//i.test(u.trim());
}

// A stored document opens inline (no signed URL needed) when it's an external link
// OR an UPLOADED data: URL (Christina 2026-07-04 — "I need to be able to upload
// pictures or documents"). Uploads ride the app's proven data-URL pattern
// (lib/image.js), so an uploaded file opens straight from its data URL.
export function isInlineDocument(u) {
  return isExternalUrl(u) || (typeof u === 'string' && /^data:/i.test(u.trim()));
}

// A team-doc UPLOAD is validated before it becomes a data URL: images are
// compressed client-side (so no size cap), other files (PDF/doc/txt) must fit the
// cap because they ride in the row as a data URL. Pure — unit-tested.
export const TEAM_DOC_MAX_BYTES = 3 * 1024 * 1024; // 3 MB for a non-image upload
export function classifyUpload(file, maxBytes = TEAM_DOC_MAX_BYTES) {
  if (!file) return { ok: false, reason: 'no-file' };
  const type = String(file.type || '');
  const name = String(file.name || '');
  const isImage = /^image\//i.test(type);
  const isDoc = /pdf|msword|officedocument|text\/plain/i.test(type) || /\.(pdf|docx?|txt)$/i.test(name);
  if (!isImage && !isDoc) return { ok: false, reason: 'unsupported-type' };
  if (!isImage && Number(file.size) > maxBytes) return { ok: false, reason: 'too-large' };
  return { ok: true, kind: isImage ? 'image' : 'document' };
}

// Resolve an openable URL for a document in a given bucket. External links and
// uploaded data: URLs pass through; Storage paths get a short-lived signed URL
// (RLS gates who succeeds).
async function openDocument(bucket, documentUrl) {
  if (!documentUrl) return null;
  if (isInlineDocument(documentUrl)) return documentUrl;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(documentUrl, 300);
  if (error) { console.warn(`[choir-sync] signed url (${bucket}) failed:`, error); return null; }
  return data?.signedUrl || null;
}
// Sermon docs: owner/admin only (RLS). Team docs: whole choir (RLS).
export const openSermonDocument = (url) => openDocument('sermon-documents', url);
export const openTeamDocument = (url) => openDocument('church-team-documents', url);

export async function saveTeamDocument(doc) {
  const ctx = await writeContext();
  if (ctx.error) return { skipped: ctx.error };
  const row = {
    doc_date: doc.docDate ?? null,
    doc_type: doc.docType ?? 'other',
    title: doc.title ?? '',
    document_url: doc.documentUrl ?? null,
    document_source: doc.documentSource || 'manual',
  };
  if (doc.id) {
    const { error } = await supabase.from('choir_team_documents').update({ ...row, updated_by: ctx.userId }).eq('id', doc.id);
    return error ? { skipped: 'update-error', error } : { saved: true };
  }
  const { error } = await supabase.from('choir_team_documents').insert({ ...row, instance_id: ctx.tenantId, created_by: ctx.userId });
  return error ? { skipped: 'insert-error', error } : { saved: true };
}

export async function deleteTeamDocument(id) {
  const { error } = await supabase.from('choir_team_documents').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}

// --- Ongoing import from the YouTube channel (director-triggered, not a timer) -
// Pulls the channel's recent uploads via the YouTube Data API and inserts any
// NEW dated messages into choir_sermons. Metadata only — no downloads (Darrell:
// "source, don't download"). Needs VITE_YOUTUBE_API_KEY (a read-only,
// referrer-restrictable key); without it the surface tells the director to add
// it. Idempotent: existing videos are skipped (selectNewSermonImports).
const CHURCH_CHANNEL_HANDLE = 'thelovecorner';

async function ytApi(path, key) {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/${path}&key=${encodeURIComponent(key)}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`YouTube API ${res.status}: ${body.slice(0, 160)}`);
  }
  return res.json();
}

// Page through the uploads playlist so the service corpus can be COMPREHENSIVE
// (the historical choir-song sweep harvests from these same services, so the
// deeper this corpus, the larger the song history). Bounded by maxPages (a brake
// against a runaway loop); returns the items plus whether more remain. ~50/page.
async function fetchUploadsItems(uploads, key, maxPages) {
  const items = [];
  let pageToken = '';
  let pages = 0;
  let more = false;
  do {
    const tok = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
    const pl = await ytApi(`playlistItems?part=snippet,contentDetails&maxResults=50${tok}&playlistId=${encodeURIComponent(uploads)}`, key);
    for (const i of pl?.items || []) {
      items.push({
        videoId: i?.contentDetails?.videoId,
        title: i?.snippet?.title,
        // The video's real upload date (contentDetails.videoPublishedAt is the
        // publish time; snippet.publishedAt is when it was added to the playlist).
        // Used as the service-date fallback so a dateless title still lands dated.
        publishedAt: i?.contentDetails?.videoPublishedAt || i?.snippet?.publishedAt || null,
      });
    }
    pageToken = pl?.nextPageToken || '';
    pages += 1;
    if (pageToken && pages >= maxPages) { more = true; break; }
  } while (pageToken);
  return { items, pages, more };
}

export async function importSermonsFromChannel(displayName, opts = {}) {
  const key = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_YOUTUBE_API_KEY) || '';
  if (!key) return { skipped: 'no-key' };
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  // Scan the WHOLE channel by default (~850 videos = 17 pages of 50); 40 pages
  // is 2000-video headroom so nothing older is left unscanned (Darrell 2026-07-16).
  const maxPages = Number.isFinite(opts.maxPages) && opts.maxPages > 0 ? Math.floor(opts.maxPages) : 40;
  try {
    // Resolve the channel's uploads playlist from its handle.
    const ch = await ytApi(`channels?part=contentDetails&forHandle=${encodeURIComponent('@' + CHURCH_CHANNEL_HANDLE)}`, key);
    const uploads = ch?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploads) return { skipped: 'channel-not-found' };
    // Walk the full upload history (bounded), newest first, so the corpus is deep.
    const { items, more } = await fetchUploadsItems(uploads, key, maxPages);
    const { data: existing } = await supabase.from('choir_sermons').select('video_id').eq('instance_id', ctx.tenantId);
    const existingIds = (existing || []).map((r) => r.video_id).filter(Boolean);
    const fresh = selectNewSermonImports(items, existingIds);
    if (!fresh.length) return { imported: 0, scanned: items.length, more };
    const rows = fresh.map((r) => ({
      instance_id: ctx.tenantId,
      created_by: ctx.userId,
      video_id: r.videoId,
      youtube_url: r.youtubeUrl,
      service_date: r.serviceDate,
      service_type: r.serviceType,
      title: r.title,
      speaker: r.speaker,
      source: 'youtube',
      // PUBLISHED, not draft. An archived channel video is already public on
      // YouTube, and The Word library is public by design (migration 0029/0103):
      // it must be watchable the moment it is archived. BG's prep (points /
      // scriptures) stays private separately (0101) and fills in over the next
      // days — the video does not wait on it.
      status: 'active',
    }));
    const { error } = await supabase.from('choir_sermons').insert(rows);
    if (error) return { skipped: 'insert-error', error };
    return { imported: rows.length, scanned: items.length, more };
  } catch (e) {
    // Surface the REAL reason (status + body) so a manager can fix it from the
    // screen (DR-0076). ytApi throws "YouTube API 403: ..." — a 403 is almost
    // always the key's HTTP-referrer restriction not allowing this site, or the
    // "YouTube Data API v3" not being enabled on the key's Google Cloud project.
    return { skipped: 'api-error', error: e, detail: (e && e.message) || String(e) };
  }
}
