// =============================================================================
// worker-ops — pure helpers for managing 1099 workers + hearing their voice
// =============================================================================
// MANDATE (Darrell, 2026-07-05): "we need the system to be our 1099 workers
// managers and also hear their perspectives on operations." Two halves, both
// on EXISTING rails (no new tables, no new sync module):
//
//   1. MANAGER STATE — which open work orders (incidents) each contractor is
//      on right now. The linkage is the incident.dispatch jsonb
//      ({ assignments: [...] }), read via lib/assignments.js getAssignments()
//      — the ONE tolerant reader (new crew shape + legacy single-worker rows).
//      "Open" = status !== 'resolved', the same filter BigPictureDashboard
//      (line ~109) and Rentals (openIncidentFor) already use.
//
//   2. WORKER VOICE — what the worker said about the operation after a job,
//      recorded by the family member and shipped through the EXISTING
//      feedback rail (feedback-sync uploadFeedback), tagged with the distinct
//      'worker-ops' area so it rides the same live cross-device stream and
//      the Concerns board's feedback read-through picks it up with zero
//      extra wiring.
// =============================================================================
import { getAssignments } from './assignments.js';

// The which_tab / area tag worker-voice entries carry on the feedback rail.
// Registered in FEEDBACK_AREAS (FeedbackCenter.jsx) so it is also selectable
// from the general feedback form.
export const WORKER_VOICE_AREA = 'worker-ops';

// Open work orders (incidents) carrying an assignment for this contractor.
// Returns [{ incident, assignment }] where `assignment` is THIS worker's own
// slice (their status / dispatchedAt / doneAt), so "their piece is done but
// the order is still open" reads honestly instead of flattening to one bit.
// Matching is by assignment.contractorId only — a worker assigned without a
// directory id cannot be traced to a roster row, and inventing that link
// would be a painted connection (DR-0076), so those are skipped.
export function workerOpenIncidents(contractorId, incidents = []) {
  if (!contractorId) return [];
  const out = [];
  for (const incident of incidents || []) {
    if (!incident || incident.status === 'resolved') continue;
    for (const assignment of getAssignments(incident)) {
      if (assignment.contractorId === contractorId) out.push({ incident, assignment });
    }
  }
  return out;
}

// The one-tap follow-up text for an open work order — same posture as
// buildDispatchMessage in lib/dispatch.js (ANXIETY-CLARITY-PRINCIPLE: the
// message is answerable from the phone: what job, when it's due, what to do).
export function buildFollowUpMessage(incident = {}) {
  return [
    `Checking in — ${incident.description || 'the job we sent you'}`,
    incident.dueDate ? `Due: ${incident.dueDate}` : '',
    'Any update? Reply here or call back.',
  ].filter(Boolean).join('\n');
}

// Build the feedback item for one spoken worker perspective. The shape rides
// uploadFeedback as-is: `text` becomes the row body (feedback_text) and
// `currentView`/`area` become which_tab ('worker-ops') — the tag the stream
// and the Concerns read-through filter on. The extra ids (contractorId,
// incidentId) ride the LOCAL copy only; the DB row carries the composed text,
// which is why the incident context is written into the text itself.
// Returns null when there is no named worker or nothing said — the caller
// shows the validation message; nothing is fabricated.
export function buildWorkerVoiceRecord({ contractor, said, incident, at } = {}) {
  const name = contractor && contractor.name && contractor.name.trim();
  const quote = said && said.trim();
  if (!name || !quote) return null;
  const who = name + (contractor.role ? ` (${contractor.role})` : '');
  const re = incident && incident.description ? ` — re: ${incident.description}` : '';
  return {
    id: `wv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    area: WORKER_VOICE_AREA,
    currentView: WORKER_VOICE_AREA,
    text: `Worker voice — ${who}: "${quote}"${re}`,
    contractorId: contractor.id || '',
    incidentId: (incident && incident.id) || '',
    createdAt: at || new Date().toISOString(),
  };
}

// A feedback item is a worker-voice entry when it carries the tag — either the
// local shape (area) or the remote prototype shape, where which_tab comes back
// as currentView (feedback-sync toPrototypeShape).
export function isWorkerVoice(item) {
  return !!item && (item.area === WORKER_VOICE_AREA || item.currentView === WORKER_VOICE_AREA);
}

// Real timestamp of a feedback item (remote rows carry submittedAt, local
// copies createdAt). NaN-safe: an unparseable time sorts last, never invents.
function entryTime(item) {
  const t = Date.parse((item && (item.submittedAt || item.createdAt)) || '');
  return Number.isNaN(t) ? 0 : t;
}

// Newest-first worker-voice list from a mixed local + remote feedback array.
// Every entry keeps its REAL timestamp and author; dedupe is by id so a row
// present in both inputs renders once.
export function voiceEntries(feedbackItems = []) {
  const seen = new Set();
  const out = [];
  for (const f of feedbackItems || []) {
    if (!isWorkerVoice(f)) continue;
    const key = f.id || `${f.text}|${f.submittedAt || f.createdAt || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out.sort((a, b) => entryTime(b) - entryTime(a));
}
