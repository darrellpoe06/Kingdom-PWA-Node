// =============================================================================
// ministry-meetings — pure logic for scheduling sovereign PoeTech meetings, with
// LOAD RULES so a meeting can't overload the environment.
// =============================================================================
// Declared by Darrell 2026-07-12: "We want our own OBS-based Zoom/Teams version
// for PoeTech" — a sovereign, self-hosted meeting engine on our broadcast stack,
// NOT an external Zoom/Teams integration. The real-time OBS/WebRTC engine is a
// Tier-C architecture target (captured in
// docs/00-foundations/_root/SOVEREIGN-COMMS-AND-MEETINGS.md); THIS module is the
// scheduling + guardrail shell it plugs into, which is real and testable now:
// leaders schedule a meeting, and the load rules gate it.
//
// The load rules are the "three brakes" (CLAUDE.md: Autonomous Automation
// Requires Three Brakes) applied to meetings so we get "good content and context"
// without overloading the environment:
//   1. BUDGET      — participant cap + duration cap + max concurrent per instance
//   2. CONCURRENCY  — one live/overlapping meeting per ministry at a time
//   3. GUARDRAIL    — scheduling required (a start time, no unbounded ad-hoc)
//
// Word-first grounding: "count the cost, whether he have sufficient to finish it"
// (Luke 14:28) and "Let all things be done decently and in order" (1 Cor 14:40).
// This file is PURE — every rule is unit-tested (DR-0076).
// =============================================================================

export const MEETING_PROVIDERS = [
  ['poetech-obs', 'PoeTech (OBS)'],
  ['zoom', 'Zoom'],
  ['teams', 'Teams'],
  ['other', 'Other link'],
];
export const meetingProviderLabel = (p) => (MEETING_PROVIDERS.find(([k]) => k === p)?.[1]) || p;

export const MEETING_STATUS = [
  ['scheduled', 'Scheduled'],
  ['live', 'Live'],
  ['ended', 'Ended'],
  ['canceled', 'Canceled'],
];
export const meetingStatusLabel = (s) => (MEETING_STATUS.find(([k]) => k === s)?.[1]) || s;

// MEETING SPACES (declared by Darrell 2026-07-12). Two rooms, sized to the real
// sovereign stack — the on-site Synology NAS today, the 5x RTX 3090 rig the infra
// project is standing up (ChurchInfraPlan). The caps are grounded in that
// hardware, not aspiration: a self-hosted SFU on one uplink can carry the whole
// admin staff OR several small working meetings, not both at once.
//   - main:     the admin-staff / monthly meeting room — up to 50 people, but
//               EXCLUSIVE (it takes the whole stack, so nothing else runs
//               alongside it) and ADMIN-ONLY to book.
//   - ministry: a working meeting for a ministry (bus sync, choir) — up to 12
//               typical, 25 ceiling; several can run within the concurrency cap.
export const MEETING_SPACES = {
  main:     { id: 'main',     label: 'Main meeting space (admin & monthly)', cap: 50, adminOnly: true,  exclusive: true },
  ministry: { id: 'ministry', label: 'Ministry meeting',                     cap: 25, adminOnly: false, exclusive: false },
};
export const meetingSpaceLabel = (s) => (MEETING_SPACES[s]?.label) || MEETING_SPACES.ministry.label;
export function spaceCap(space) { return (MEETING_SPACES[space] || MEETING_SPACES.ministry).cap; }
// The main room is admin-staff only (Darrell 2026-07-12). RLS enforces this too
// (0098); this mirror only decides which spaces a surface offers.
export function canBookSpace(space, role) {
  const sp = MEETING_SPACES[space] || MEETING_SPACES.ministry;
  return sp.adminOnly ? (role === 'owner' || role === 'admin') : true;
}

// The environment budget. These are deliberately conservative caps — the point
// is to protect the sovereign stack, not to host webinars. Per-meeting participant
// caps come from the SPACE (above); these bound duration + how many small meetings
// overlap. Raising one is a decision (DR-0075), not a silent tweak.
export const MEETING_LIMITS = {
  maxParticipants: 50,       // absolute ceiling = the main space; per-space cap is senior
  maxDurationMin: 180,       // 3h ceiling per meeting
  maxConcurrentPerInstance: 3, // small ministry meetings at once (a main-space meeting is exclusive)
};

export function toMeetingShape(row, myUserId) {
  return {
    id: row.id,
    ministry: row.ministry ?? null,
    space: row.space ?? 'ministry',
    title: row.title ?? '',
    hostName: row.host_name ?? '',
    hostUserId: row.host_user_id ?? null,
    provider: row.provider ?? 'poetech-obs',
    joinUrl: row.join_url ?? null,
    scheduledAt: row.scheduled_at ?? null,
    durationMin: Number.isFinite(row.duration_min) ? row.duration_min : 60,
    participantCap: Number.isFinite(row.participant_cap) ? row.participant_cap : null,
    status: row.status ?? 'scheduled',
    notes: row.notes ?? null,
    mine: !!myUserId && row.host_user_id === myUserId,
  };
}

// A meeting occupies the environment while it is scheduled/live and its window
// hasn't passed. Ended/canceled meetings free their slot.
export function isActiveMeeting(m, nowMs) {
  if (!m || m.status === 'ended' || m.status === 'canceled') return false;
  if (m.status === 'live') return true;
  const start = m.scheduledAt ? Date.parse(m.scheduledAt) : NaN;
  if (Number.isNaN(start)) return false;
  const end = start + (Number(m.durationMin) || 60) * 60_000;
  return Number.isFinite(nowMs) ? nowMs < end : true; // future/ongoing window
}

// Two [start, start+dur) windows overlap? (ms inputs)
export function windowsOverlap(aStartMs, aDurMin, bStartMs, bDurMin) {
  if (!Number.isFinite(aStartMs) || !Number.isFinite(bStartMs)) return false;
  const aEnd = aStartMs + (Number(aDurMin) || 0) * 60_000;
  const bEnd = bStartMs + (Number(bDurMin) || 0) * 60_000;
  return aStartMs < bEnd && bStartMs < aEnd;
}

// The gate. Given the instance's existing meetings and a proposed one, return
// { ok, violations: [{ rule, message }] }. `nowMs` is passed in (never read from
// the clock here) so the rule is deterministic and testable.
export function meetingLoadCheck(existing = [], proposed = {}, nowMs = 0, limits = MEETING_LIMITS) {
  const violations = [];
  const L = { ...MEETING_LIMITS, ...(limits || {}) };

  // GUARDRAIL: scheduling required, in the future, bounded duration.
  const startMs = proposed.scheduledAt ? Date.parse(proposed.scheduledAt) : NaN;
  if (Number.isNaN(startMs)) {
    violations.push({ rule: 'scheduling-required', message: 'A meeting needs a scheduled start time.' });
  } else if (Number.isFinite(nowMs) && startMs < nowMs) {
    violations.push({ rule: 'scheduling-required', message: 'The start time is in the past.' });
  }
  const dur = Number(proposed.durationMin) || 0;
  if (dur <= 0) {
    violations.push({ rule: 'duration', message: 'Set how long the meeting runs.' });
  } else if (dur > L.maxDurationMin) {
    violations.push({ rule: 'duration', message: `Meetings are capped at ${L.maxDurationMin} minutes to protect the environment.` });
  }

  // BUDGET: participant cap within the SPACE's cap (main 50, ministry 25).
  const space = MEETING_SPACES[proposed.space] || MEETING_SPACES.ministry;
  const cap = Number(proposed.participantCap);
  if (!Number.isFinite(cap) || cap < 1) {
    violations.push({ rule: 'participant-cap', message: 'Set a participant cap (at least 1).' });
  } else if (cap > space.cap) {
    violations.push({ rule: 'participant-cap', message: `${space.label} holds up to ${space.cap} people.` });
  }

  const active = (existing || []).filter((m) => isActiveMeeting(m, nowMs) && m.id !== proposed.id);

  // The set of active meetings that overlap the proposed window.
  const overlappingInstance = active.filter((m) => {
    const ms = m.scheduledAt ? Date.parse(m.scheduledAt) : NaN;
    return Number.isNaN(startMs) || m.status === 'live' || windowsOverlap(startMs, dur, ms, m.durationMin);
  });

  // EXCLUSIVE: the main space (a 50-person meeting) takes the whole sovereign
  // stack — nothing else may overlap it, in either direction.
  const anyExclusiveActive = overlappingInstance.some((m) => (MEETING_SPACES[m.space] || MEETING_SPACES.ministry).exclusive);
  if (space.exclusive && overlappingInstance.length >= 1) {
    violations.push({ rule: 'main-space-exclusive', message: 'The main meeting space runs on its own — no other meeting can overlap it. Pick a clear time.' });
  } else if (!space.exclusive && anyExclusiveActive) {
    violations.push({ rule: 'main-space-exclusive', message: 'The main meeting space is booked in that window — it takes the whole stack. Pick another time.' });
  }

  // BUDGET: max concurrent SMALL (ministry) meetings per instance, at the window.
  // (An exclusive main-space meeting is handled above, not counted here.)
  if (!space.exclusive) {
    const overlappingMinistry = overlappingInstance.filter((m) => !(MEETING_SPACES[m.space] || MEETING_SPACES.ministry).exclusive);
    if (overlappingMinistry.length >= L.maxConcurrentPerInstance) {
      violations.push({ rule: 'max-concurrent', message: `No more than ${L.maxConcurrentPerInstance} ministry meetings can run at once here. Pick a different time.` });
    }
    // CONCURRENCY LOCK: one live/overlapping meeting per ministry at a time.
    if (proposed.ministry) {
      const sameMinistry = overlappingMinistry.filter((m) => m.ministry === proposed.ministry);
      if (sameMinistry.length >= 1) {
        violations.push({ rule: 'ministry-lock', message: `${proposed.ministry} already has a meeting in that window. One at a time.` });
      }
    }
  }

  return { ok: violations.length === 0, violations };
}

// Upcoming (scheduled/live), soonest first — what the surface lists.
export function upcomingMeetings(meetings = [], nowMs = 0) {
  return (meetings || [])
    .filter((m) => isActiveMeeting(m, nowMs))
    .sort((a, b) => String(a.scheduledAt).localeCompare(String(b.scheduledAt)));
}
