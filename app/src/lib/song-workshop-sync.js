// =============================================================================
// song-workshop-sync — Supabase-backed Choir "Song Workshop" (idea pool)
// =============================================================================
// The collaborative song-idea surface inside the Choir tab. ANY choir member may
// add a song (a link + title), play it in-app, comment, and vote; the director
// (owner/admin) marks which ideas are FINAL — the rest return to the pool. Backed
// by choir_song_ideas / choir_song_comments / choir_song_votes
// (infra/supabase/migrations-auto/0036-choir-song-workshop.sql).
//
// Kept in its OWN file (not choir-sync.js) on purpose: the Choir module has
// concurrent work in flight, so this surface adds zero edit-surface to that hot
// file. The one thing reused from choir-sync is the pure `youtubeEmbedUrl`
// helper (already exported + tested there) — reuse, don't re-roll.
//
// All writes fail soft and surface a { skipped } result to the caller, mirroring
// choir-sync. RLS is the real enforcement; the client mirrors it (canEdit gates
// the FINAL/pool controls) only so the UI doesn't offer what the server refuses.
// =============================================================================
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';
import { youtubeEmbedUrl } from './choir-sync.js';

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

function resolveDisplayName(session, explicit) {
  const trimmed = (explicit || '').trim();
  if (trimmed) return trimmed;
  return session.user.email?.split('@')[0] || 'Member';
}

// --- Pure helpers (exported for tests) ---------------------------------------

// 'youtube' when the URL is an embeddable YouTube link, else 'link'. Anything
// non-YouTube still works — the card falls back to an "Open link" button.
export function detectSourceType(url) {
  return youtubeEmbedUrl(url) ? 'youtube' : 'link';
}

// The embeddable player URL for an idea, or null when it can't be embedded
// (the card then shows a safe "Open link" / "no link yet" fallback — never dead).
export function ideaEmbedUrl(idea) {
  if (!idea || !idea.url) return null;
  return youtubeEmbedUrl(idea.url);
}

const URL_RE = /\bhttps?:\/\/[^\s<>"')]+/i;
const BARE_YT_RE = /\b(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s<>"')]+/i;

// Pull a single URL out of one pasted line and split off the rest as a title.
// Accepts "Title - https://…", "https://… Title", a bare URL, or "youtu.be/…"
// without a scheme. Returns { title, url } with url null when the line has none.
export function parseSongLine(line) {
  const raw = (line || '').trim();
  if (!raw) return null;
  let url = null;
  let rest = raw;
  let m = raw.match(URL_RE);
  if (m) { url = m[0]; rest = raw.replace(m[0], ' '); }
  else if ((m = raw.match(BARE_YT_RE))) { url = `https://${m[0]}`; rest = raw.replace(m[0], ' '); }
  // Strip list bullets, surrounding dashes/pipes, and collapse whitespace.
  let title = rest.replace(/^[\s\-*•|>\d.)#]+/, '').replace(/[\s\-|]+$/, '').replace(/\s+/g, ' ').trim();
  if (!title) {
    if (url) {
      const yt = youtubeEmbedUrl(url);
      title = yt ? 'YouTube song' : 'Untitled song';
    } else {
      title = raw.slice(0, 200);
    }
  }
  return { title: title.slice(0, 200), url: url ? url.slice(0, 2000) : null };
}

// Parse a multi-line paste into a de-duplicated list of { title, url } ideas.
// Lines with no recognizable URL still become title-only ideas (the card shows a
// "no link yet" state) rather than being silently dropped.
export function parseSongList(text) {
  const seen = new Set();
  const out = [];
  for (const line of String(text || '').split(/\r?\n/)) {
    const parsed = parseSongLine(line);
    if (!parsed) continue;
    const key = (parsed.url || parsed.title).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(parsed);
  }
  return out;
}

export function toIdeaShape(row, myUserId) {
  return {
    id: row.id,
    title: row.title,
    url: row.url ?? null,
    sourceType: row.source_type ?? 'link',
    note: row.note ?? null,
    keyLabel: row.key_label ?? null,
    arrangement: row.arrangement ?? null,
    status: row.status ?? 'idea',
    addedBy: row.added_by ?? null,
    addedByName: row.added_by_name ?? 'Member',
    decidedAt: row.decided_at ?? null,
    createdAt: row.created_at ?? null,
    mine: !!myUserId && row.added_by === myUserId,
  };
}

export function toSongCommentShape(row, myUserId) {
  return {
    id: row.id,
    songId: row.song_id,
    userId: row.user_id ?? null,
    author: row.author ?? 'Member',
    body: row.body ?? '',
    createdAt: row.created_at ?? null,
    mine: !!myUserId && row.user_id === myUserId,
  };
}

export function toVoteShape(row, myUserId) {
  return { id: row.id, songId: row.song_id, userId: row.user_id ?? null, mine: !!myUserId && row.user_id === myUserId };
}

export function toLeadShape(row, myUserId) {
  return {
    id: row.id,
    songId: row.song_id,
    memberUserId: row.member_user_id ?? null,
    memberName: row.member_name ?? 'Member',
    role: row.role === 'co-lead' ? 'co-lead' : 'lead',
    mine: !!myUserId && row.member_user_id === myUserId,
  };
}

// Bucket ideas by lifecycle for the three-section UI. Pure + stable-sorted
// (newest first within each bucket) so the render order doesn't jitter.
export function splitByStatus(ideas) {
  const by = { final: [], idea: [], pool: [] };
  for (const it of ideas || []) (by[it.status] || by.idea).push(it);
  const newest = (a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  return {
    finals: by.final.slice().sort(newest),
    candidates: by.idea.slice().sort(newest),
    pool: by.pool.slice().sort(newest),
  };
}

// songId -> [comments], oldest first (thread reads top-to-bottom).
export function groupCommentsBySong(comments) {
  const map = new Map();
  for (const c of comments || []) {
    if (!map.has(c.songId)) map.set(c.songId, []);
    map.get(c.songId).push(c);
  }
  for (const arr of map.values()) arr.sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
  return map;
}

// songId -> { count, mine } for the vote pills.
export function tallyVotes(votes) {
  const map = new Map();
  for (const v of votes || []) {
    const cur = map.get(v.songId) || { count: 0, mine: false };
    cur.count += 1;
    if (v.mine) cur.mine = true;
    map.set(v.songId, cur);
  }
  return map;
}

// songId -> [leads], lead(s) before co-leads then by name (stable card order).
export function groupLeadsBySong(leads) {
  const map = new Map();
  for (const l of leads || []) {
    if (!map.has(l.songId)) map.set(l.songId, []);
    map.get(l.songId).push(l);
  }
  const rank = (l) => (l.role === 'lead' ? 0 : 1);
  for (const arr of map.values()) arr.sort((a, b) => rank(a) - rank(b) || String(a.memberName).localeCompare(String(b.memberName)));
  return map;
}

// The set of songIds the current member is assigned to lead/co-lead — drives the
// "songs I'm leading" view and the "Your lead" flag on a card.
export function myLeadSongIds(leads) {
  const set = new Set();
  for (const l of leads || []) if (l.mine) set.add(l.songId);
  return set;
}

// --- Realtime subscribers (mirror choir-sync.makeSubscriber) -----------------

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
        const { data, error } = orderBy ? await q.order(orderBy.col, { ascending: orderBy.asc }) : await q;
        if (error) { console.warn(`[song-workshop] ${table} fetch failed:`, error); return null; }
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

export const subscribeSongIdeas    = makeSubscriber('choir_song_ideas',    toIdeaShape,        { col: 'created_at', asc: false });
export const subscribeSongComments = makeSubscriber('choir_song_comments', toSongCommentShape, { col: 'created_at', asc: true });
export const subscribeSongVotes    = makeSubscriber('choir_song_votes',    toVoteShape,        null);
export const subscribeSongLeads    = makeSubscriber('choir_song_leads',    toLeadShape,        { col: 'created_at', asc: true });

// --- Writes ------------------------------------------------------------------

async function writeContext(displayName) {
  const session = await currentSession();
  if (!session) return { error: 'signed-out' };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { error: 'no-church' };
  return { tenantId, userId: session.user.id, displayName: resolveDisplayName(session, displayName) };
}

function ideaRow(ctx, idea) {
  const url = (idea.url || '').trim() || null;
  return {
    instance_id: ctx.tenantId,
    title: (idea.title || '').trim().slice(0, 200),
    url: url ? url.slice(0, 2000) : null,
    source_type: detectSourceType(url),
    note: (idea.note || '').trim().slice(0, 2000) || null,
    key_label: (idea.keyLabel || '').trim().slice(0, 40) || null,
    arrangement: (idea.arrangement || '').trim().slice(0, 120) || null,
    status: 'idea',
    added_by: ctx.userId,
    added_by_name: ctx.displayName,
  };
}

// Any choir member adds one song idea. Requires a title.
export async function addSongIdea(idea, displayName) {
  if (!idea || !(idea.title || '').trim()) return { skipped: 'empty-title' };
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const { error } = await supabase.from('choir_song_ideas').insert(ideaRow(ctx, idea));
  return error ? { skipped: 'insert-error', error } : { saved: true };
}

// Paste a list -> each parsed line becomes a song idea (one bulk insert).
export async function addSongIdeaList(text, displayName) {
  const items = parseSongList(text);
  if (!items.length) return { skipped: 'empty-list' };
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const rows = items.map((it) => ideaRow(ctx, it));
  const { error } = await supabase.from('choir_song_ideas').insert(rows);
  return error ? { skipped: 'insert-error', error } : { saved: true, count: rows.length };
}

// Director-only (RLS enforces): set an idea's lifecycle status.
export async function setIdeaStatus(id, status, displayName) {
  if (!['idea', 'final', 'pool'].includes(status)) return { skipped: 'bad-status' };
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const { error } = await supabase
    .from('choir_song_ideas')
    .update({ status, decided_by: ctx.userId, decided_at: new Date().toISOString() })
    .eq('id', id);
  return error ? { skipped: 'update-error', error } : { saved: true };
}

// The adder or a director may remove an idea (cascades comments + votes).
export async function deleteSongIdea(id) {
  const { error } = await supabase.from('choir_song_ideas').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}

export async function addSongComment(songId, body, displayName) {
  const text = (body || '').trim();
  if (!songId || !text) return { skipped: 'empty' };
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const { error } = await supabase.from('choir_song_comments').insert({
    instance_id: ctx.tenantId,
    song_id: songId,
    user_id: ctx.userId,
    author: ctx.displayName,
    body: text.slice(0, 2000),
  });
  return error ? { skipped: 'insert-error', error } : { saved: true };
}

export async function deleteSongComment(id) {
  const { error } = await supabase.from('choir_song_comments').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}

// Toggle the current member's vote on a song. hasVoted=true clears it.
export async function toggleSongVote(songId, hasVoted, displayName) {
  if (!songId) return { skipped: 'no-song' };
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  if (hasVoted) {
    const { error } = await supabase.from('choir_song_votes').delete().eq('song_id', songId).eq('user_id', ctx.userId);
    return error ? { skipped: 'delete-error', error } : { saved: true, voted: false };
  }
  const { error } = await supabase.from('choir_song_votes').insert({ instance_id: ctx.tenantId, song_id: songId, user_id: ctx.userId });
  return error ? { skipped: 'insert-error', error } : { saved: true, voted: true };
}

// Director-only (RLS enforces): assign a member as the lead (or co-lead) on a
// song. member = { userId?, name }. The UNIQUE(song_id, member_user_id) guard
// stops assigning the same account twice on one song.
export async function assignLead(songId, member, role, displayName) {
  const name = (member?.name || '').trim();
  if (!songId || !name) return { skipped: 'empty' };
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const { error } = await supabase.from('choir_song_leads').insert({
    instance_id: ctx.tenantId,
    song_id: songId,
    member_user_id: member?.userId ?? null,
    member_name: name.slice(0, 120),
    role: role === 'co-lead' ? 'co-lead' : 'lead',
    assigned_by: ctx.userId,
  });
  return error ? { skipped: 'insert-error', error } : { saved: true };
}

// Director-only: switch a lead between lead and co-lead.
export async function setLeadRole(id, role) {
  if (!['lead', 'co-lead'].includes(role)) return { skipped: 'bad-role' };
  const { error } = await supabase.from('choir_song_leads').update({ role }).eq('id', id);
  return error ? { skipped: 'update-error', error } : { saved: true };
}

// Director-only: unassign a lead.
export async function removeLead(id) {
  const { error } = await supabase.from('choir_song_leads').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}
