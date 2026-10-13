// =============================================================================
// ministry-meetings-sync — Supabase I/O for sovereign meeting scheduling.
// =============================================================================
// Backed by ministry_meetings (0097-ministry-meetings.sql). The LOAD RULES
// (participant/duration caps, max concurrent, one-per-ministry) run in
// lib/ministry-meetings.js BEFORE the write, so an overloading meeting never
// reaches the table. The real-time OBS/WebRTC engine is the Tier-C target in
// SOVEREIGN-COMMS-AND-MEETINGS.md; this file schedules + tracks the record.
// =============================================================================
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';
import { toMeetingShape, meetingLoadCheck } from './ministry-meetings.js';

export * from './ministry-meetings.js';

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}
function resolveName(session, explicit) {
  const t = (explicit || '').trim();
  if (t) return t;
  return session?.user?.email?.split('@')[0] || 'Host';
}

export function subscribeMeetings(onChange) {
  let channel = null;
  let cancelled = false;
  (async () => {
    const session = await currentSession();
    if (!session || cancelled) return;
    const myUserId = session.user.id;
    const fetchAll = async () => {
      const { data, error } = await supabase.from('ministry_meetings').select('*').order('scheduled_at', { ascending: true });
      if (error) { console.warn('[meetings-sync] fetch failed:', error); return null; }
      return (data || []).map((r) => toMeetingShape(r, myUserId));
    };
    const initial = await fetchAll();
    if (initial && !cancelled) onChange(initial);
    channel = supabase
      .channel('ministry_meetings-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ministry_meetings' }, () => {
        fetchAll().then((rows) => { if (rows && !cancelled) onChange(rows); });
      })
      .subscribe();
  })();
  return function unsubscribe() { cancelled = true; if (channel) supabase.removeChannel(channel); };
}

// Schedule a meeting. `existing` are the current meeting shapes (so the load
// rules can be checked client-side against real state); the caller passes them
// in from the live subscription. Returns { skipped, violations } when the load
// rules block it — the surface renders the reasons.
export async function scheduleMeeting(meeting, existing, displayName) {
  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };
  const nowMs = Date.now();
  const check = meetingLoadCheck(existing || [], meeting, nowMs);
  if (!check.ok) return { skipped: 'load-rules', violations: check.violations };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { skipped: 'no-instance' };
  const row = {
    instance_id: tenantId,
    ministry: meeting.ministry ?? null,
    space: meeting.space === 'main' ? 'main' : 'ministry',
    title: (meeting.title || '').trim(),
    host_name: resolveName(session, meeting.hostName || displayName),
    host_user_id: session.user.id,
    provider: meeting.provider ?? 'poetech-obs',
    join_url: (meeting.joinUrl || '').trim() || null,
    scheduled_at: meeting.scheduledAt,
    duration_min: Number(meeting.durationMin) || 60,
    participant_cap: Number(meeting.participantCap) || 12,
    status: 'scheduled',
    notes: meeting.notes ?? null,
    created_by: session.user.id,
  };
  const { error } = await supabase.from('ministry_meetings').insert(row);
  return error ? { skipped: 'insert-error', error } : { saved: true };
}

export async function setMeetingStatus(id, status) {
  const { error } = await supabase.from('ministry_meetings').update({ status }).eq('id', id);
  return error ? { skipped: 'update-error', error } : { saved: true };
}
export async function removeMeeting(id) {
  const { error } = await supabase.from('ministry_meetings').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}
