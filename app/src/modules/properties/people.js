// =============================================================================
// people — who is on this door, by NAME (DR-0869)
// =============================================================================
// Darrell, 2026-10-10, standing on the PEOPLE tab of a door with the invite
// panel open, a role dropdown reading "1099 worker", and his own cell number
// typed in: "Need to be able to add users... 1099 workers... etc..." and then,
// one word, four exclamation marks: "Names?!!!!"
//
// TRACED (DR-0219). The name was never asked for. The column exists
// (property_access_invites.display_name), the writer accepts it
// (cloud.js inviteToProperties, `displayName`), the Dispatch roster READS it
// first (dispatch-roster.js:43) and the signed contractor document prints it
// (documents.js:286) — and the one form a landlord actually invites from had
// no name field and passed no displayName. So every person invited from inside
// the Poe Properties door became a phone number: a phone number in the
// Dispatch picker, a phone number in the note written on the door's permanent
// record, and a blank line on the contractor's document. Meanwhile the SAME
// invite sent from PoeTech's "People you know" (people-placement.js:127) DID
// pass a name — so two doors into one table disagreed, and the one he was
// standing in was the lossy one.
//
// And there was no roster. The tab rendered the invite form and nothing else:
// loadInvites() was already in the component's state, revokeInvite() existed
// in cloud.js and was called by NOTHING anywhere in the app. You could add a
// person and then never see them, never see whether they had signed in, and
// never take their access away from the surface that granted it.
//
// This file is the pure half: who is on a door, what they are called, how to
// reach them, and whether they have actually walked through yet.
// =============================================================================
import { formatPhone, isPhoneDoorEmail, phoneDoorDigits } from '../../lib/member-contact.js';
import { normalizePhone } from '../../lib/dispatch.js';
import { FACE_LABELS, CAPABILITY_LABELS } from './model.js';

/**
 * The name to show for an invited person. The name they were invited under
 * wins; failing that their number, formatted, because a formatted number is
 * at least recognizable; failing that the local part of a REAL email address
 * (never the synthetic phone-door one — that is an identifier, not a name).
 */
export function personName(invite = {}) {
  const typed = String(invite.display_name || '').trim();
  if (typed) return typed;
  const email = String(invite.email || '').trim().toLowerCase();
  const phone = normalizePhone(invite.invited_phone || (isPhoneDoorEmail(email) ? phoneDoorDigits(email) : ''));
  if (phone) return formatPhone(phone);
  if (email && !isPhoneDoorEmail(email)) return email.split('@')[0];
  return 'Someone (no name given)';
}

/**
 * How to reach them, as a person reads it. The synthetic
 * <digits>@phone.poetech.us login address is NOT a contact and is never shown
 * as one — it is rendered as the phone it stands for.
 */
export function personContact(invite = {}) {
  const email = String(invite.email || '').trim().toLowerCase();
  const phone = normalizePhone(invite.invited_phone || (isPhoneDoorEmail(email) ? phoneDoorDigits(email) : ''));
  if (phone) return { kind: 'phone', phone, label: formatPhone(phone) };
  if (email && !isPhoneDoorEmail(email)) return { kind: 'email', phone: '', label: email };
  return { kind: 'none', phone: '', label: '' };
}

/**
 * Everyone on one door.
 *
 * A row belongs to this door when it names this tenancy, or when it is
 * instance-wide (no tenancy, scope '*' — how a manager or a 1099 worker is
 * placed across every door by people-placement.js) or scoped to this door's
 * rental. Deduplicated by the way they sign in, because the same person
 * invited twice is one person.
 *
 * Returns { people, removed } — the active roster, and the ones whose access
 * was taken away, kept visible so a revoke is never silent.
 */
export function peopleOnDoor(invites = [], { instanceId = null, tenancyId = null, scopeRef = null } = {}) {
  const people = [];
  const removed = [];
  const seen = new Set();
  const rows = Array.isArray(invites) ? invites : [];
  for (const i of rows) {
    if (!i) continue;
    if (instanceId && i.instance_id && i.instance_id !== instanceId) continue;
    const mine = (tenancyId && i.tenancy_id === tenancyId)
      || (!i.tenancy_id && (i.scope_ref === '*' || (scopeRef && i.scope_ref === scopeRef)));
    if (!mine) continue;
    const contact = personContact(i);
    const key = contact.phone || (contact.kind === 'email' ? contact.label : '') || String(i.id || '');
    if (!key) continue;
    const role = String(i.role_label || '');
    const person = {
      id: i.id || key,
      key,
      name: personName(i),
      named: !!String(i.display_name || '').trim(),
      roleLabel: role,
      roleName: FACE_LABELS[role] || role || 'Unknown role',
      contact,
      capabilities: Array.isArray(i.capabilities) ? i.capabilities : [],
      grants: (Array.isArray(i.capabilities) ? i.capabilities : []).map((c) => CAPABILITY_LABELS[c] || c),
      joined: !!i.claimed_at,
      joinedAt: i.claimed_at || null,
      invitedAt: i.created_at || null,
      everywhere: !i.tenancy_id,
      revoked: !!i.revoked,
    };
    if (person.revoked) { removed.push(person); continue; }
    if (seen.has(key)) continue;   // an active duplicate is one person
    seen.add(key);
    people.push(person);
  }
  const order = (p) => (p.joined ? 0 : 1);
  people.sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name));
  removed.sort((a, b) => a.name.localeCompare(b.name));
  return { people, removed };
}

/**
 * WHO SAID IT, BY NAME (DR-0871). Darrell, 2026-10-10: "we need to be able to
 * make sure every text is in the historical timeline... so we can tell what
 * has happened and who has been misled or misunderstood."
 *
 * tenant_messages stores sender_user_id (0055:274) and the history has always
 * carried the message — but it printed `from_role`, so a year of conversation
 * read "landlord · tenant · landlord" with no way to tell WHICH worker or
 * WHICH household member actually said a thing. An invite row holds both the
 * name and, once they sign in, their claimed_by user id, so the two can be
 * joined with no new column and no migration.
 *
 * Returns Map(userId -> name) over the people who have actually signed in.
 */
export function namesByUserId(invites = []) {
  const out = new Map();
  for (const i of (Array.isArray(invites) ? invites : [])) {
    if (!i || !i.claimed_by) continue;
    const n = personName(i);
    if (n && !n.startsWith('Someone (')) out.set(i.claimed_by, n);
  }
  return out;
}

/**
 * Why the invite button cannot be pressed yet — in words, so a greyed-out
 * control never sits there unexplained (that is what Darrell met: a dead
 * "WRITE THE INVITATION" with nothing saying what was missing).
 * Null when it is ready to press.
 */
export function whyNotReady({ name = '', identified = false, by = 'phone', door = true } = {}) {
  if (!door) return 'Open one of your doors first — an invitation is to a particular place.';
  if (!String(name || '').trim()) return 'Add their name, so you and everyone after you know who this is.';
  if (!identified) {
    return by === 'phone'
      ? 'Enter their full cell number, including area code.'
      : 'Enter their email address.';
  }
  return null;
}
