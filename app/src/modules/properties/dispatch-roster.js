// =============================================================================
// dispatch-roster — the work is an option of the door, and the dispatch is a
// record, not a text box (DR-0837)
// =============================================================================
// Darrell, 2026-10-09, over the Work Board and Dispatch tabs: "How does this
// work... this seems to be not evaluated end to end... does the workflow work
// with sending data driven review... has to connect to etc..." and "How can
// you not have some entities to be inside before getting to these tabs... they
// should be options inside the apartment... doesn't make sense separate."
//
// Traced (DR-0219): the Dispatch tab was a bare phone box over every open
// request; "Text it" opened the messaging app and wrote NOTHING back: no
// assignment, no status, no note. The worker roster already exists, in
// property_access_invites (role_label field_worker, a phone or a phone-door
// email, a display name, claimed_by once they sign in). This file is the pure
// half: the roster from those rows, the text from the door's real address, the
// record a dispatch writes (assignment + status + the note on the door), and
// the worker's own jobs.
import { buildDispatchMessage, normalizePhone } from '../../lib/dispatch.js';
import { formatPhone, isPhoneDoorEmail, phoneDoorDigits } from '../../lib/member-contact.js';
import { proofNotice } from './proof.js';

/** The statuses a job can still be sent in. */
export const DISPATCHABLE = Object.freeze(['submitted', 'received', 'scheduled', 'in-progress']);

const URGENCY = Object.freeze({
  low: 'Low: when convenient', normal: 'Normal: this week', high: 'High: within 3 days', urgent: 'Urgent: same day',
});

/**
 * The 1099 workers invited to this instance, from property_access_invites.
 * Only field_worker rows that are not revoked; phone from the invite or the
 * phone-door email; the display name, else the number; claimed_by is the
 * worker's user id once they have signed in. Deduplicated, sorted by name.
 */
export function workerRoster(invites = [], { instanceId = null } = {}) {
  const out = [];
  const seen = new Set();
  for (const i of (Array.isArray(invites) ? invites : [])) {
    if (!i || i.revoked || String(i.role_label || '') !== 'field_worker') continue;
    if (instanceId && i.instance_id && i.instance_id !== instanceId) continue;
    const email = String(i.email || '').trim().toLowerCase();
    const phone = normalizePhone(i.invited_phone || (isPhoneDoorEmail(email) ? phoneDoorDigits(email) : ''));
    const name = String(i.display_name || '').trim()
      || (phone ? formatPhone(phone) : '')
      || (email && !isPhoneDoorEmail(email) ? email.split('@')[0] : '')
      || 'Worker';
    const key = phone || email || String(i.id || '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ key, name, phone, email: isPhoneDoorEmail(email) ? '' : email, userId: i.claimed_by || null, claimed: !!i.claimed_at, invitedAt: i.created_at || null });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** A worker who is not on the roster: a number typed in, named if a name was. */
export function someoneElse(phone, name = '') {
  const p = normalizePhone(phone);
  if (!p) return null;
  return { key: `phone:${p}`, name: String(name || '').trim() || formatPhone(p), phone: p, email: '', userId: null, claimed: false, invitedAt: null };
}

/** The text a worker receives: the door's real address, the job, how urgent, the detail. */
export function dispatchText({ door = {}, rental = null, request = {} } = {}) {
  const unit = door?.unit_label ? ` \u00b7 ${door.unit_label}` : '';
  const name = door?.property_label || (rental && (rental.display_name || rental.address)) || 'the property';
  // The worker is told up front when pictures (or a video) are required for
  // payment (DR-0902), not after the job is done.
  const proof = proofNotice(request);
  const body = buildDispatchMessage({
    propertyName: `${name}${unit}`,
    address: (rental && rental.address) || '',
    city: (rental && rental.city) || '',
    state: (rental && rental.state) || '',
    zip: (rental && rental.zip) || '',
    description: request.title || '',
    category: request.area || '',
    urgencyLabel: URGENCY[request.priority] || '',
    notes: request.detail || '',
  });
  return proof ? `${body}\n${proof}` : body;
}

/** Where a job goes when it is sent: a filed one becomes scheduled; one already moving stays; a closed one cannot be sent. */
export function nextStatusOnDispatch(status) {
  if (status === 'submitted' || status === 'received') return 'scheduled';
  if (status === 'scheduled' || status === 'in-progress') return status;
  return null;
}

/**
 * What a dispatch WRITES: the assignment (the worker's user id when they have
 * signed in, their name always), the status, and the note on the door's record.
 * Null when the job is closed.
 */
export function dispatchRecord({ request = {}, worker = {}, at = null } = {}) {
  const status = nextStatusOnDispatch(request.status);
  if (!status) return null;
  const name = String(worker.name || '').trim() || (worker.phone ? formatPhone(worker.phone) : '') || 'a worker';
  const reach = worker.phone ? ` (${formatPhone(worker.phone)})` : '';
  return {
    assign: { assignedTo: worker.userId || null, assignedToLabel: name },
    status,
    note: `Dispatched to ${name}${reach} by text: ${request.title || 'work order'}${at ? ` \u00b7 ${at}` : ''}`,
  };
}

/** The jobs assigned to THIS worker: by their user id, or by the name they were invited under. */
export function myJobs(requests = [], { userId = null, label = null } = {}) {
  const l = String(label || '').trim().toLowerCase();
  return (Array.isArray(requests) ? requests : []).filter((r) => r
    && ((userId && r.assigned_to === userId) || (l && String(r.assigned_to_label || '').trim().toLowerCase() === l)));
}

/** The open jobs that can still be sent. */
export function dispatchable(requests = []) {
  return (Array.isArray(requests) ? requests : []).filter((r) => r && DISPATCHABLE.includes(r.status));
}
