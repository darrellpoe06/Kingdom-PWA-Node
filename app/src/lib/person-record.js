// =============================================================================
// person-record — everything the database holds about one person, in one
//                 read, with what it does NOT hold said plainly (DR-0828)
// =============================================================================
// Darrell 2026-10-09: "Devices from this person... EIN... or MAC address...
// other device details... all of these are from this user." And: "End to end
// comprehensive fields inside the database connects to what we needed from
// them and communicate etc..."
//
// So: one record per roster row, built from the rows that already exist and
// that THIS viewer may read (RLS decides; nothing here widens it):
//   who        the account's own name, the name the viewer's contacts give it
//              (DR-0825), the sign-in doors (member-contact.js)
//   reach      the ways to reach them, as real links: text, call, email
//   devices    dm_device_keys (a device that can open their sealed messages:
//              its label and when it was last seen) and member_presence (what
//              the app saw: platform, build, when)
//   notHeld    what the cloud never holds and why, so a steward is never left
//              guessing whether a blank means "unknown" or "kept elsewhere"
//
// Everything is a fact about a row or a stated absence. Nothing is merged,
// nothing is fingerprinted (0055 chose coarse platform on purpose), and a
// MAC address is never invented: a browser cannot read one.
// Pure. The loader is in person-record-sync.js.
// =============================================================================

import { contactOf, formatPhone } from './member-contact.js';
import { labelFor } from './contact-names.js';

const str = (v) => String(v == null ? '' : v).trim();

/** What the cloud does not hold about a person, and why. Said, not implied. */
export const NOT_HELD = Object.freeze([
  Object.freeze({
    what: 'Full SSN or EIN',
    why: 'kept only in the on-device tax-id vault on the phone that typed it (Contractors1099); the cloud carries the type and the last four at most.',
  }),
  Object.freeze({
    what: 'MAC address',
    why: 'a browser cannot read one, so the app never has it; the NAS on the LAN can see it, and tying a LAN device to a person is a NAS-side record, not a cloud field.',
  }),
  Object.freeze({
    what: 'Notification devices',
    why: 'push_subscriptions is readable by the person alone (their opt-in, DR-0231); a steward sees the count of nothing here, by design.',
  }),
  Object.freeze({
    what: 'A device fingerprint',
    why: 'member_presence records a coarse platform and the build on purpose (0055: no fingerprinting).',
  }),
]);

/** A device row from dm_device_keys, as the record shows it. */
export function dmDeviceView(row = {}) {
  return {
    kind: 'messages',
    id: str(row.device_id || row.deviceId),
    label: str(row.label) || 'Unnamed device',
    lastSeenAt: row.last_seen_at || row.lastSeenAt || null,
    note: 'can open their sealed messages',
  };
}

/** A presence row from member_presence, as the record shows it. */
export function presenceView(row = {}) {
  const platform = str(row.platform) || 'unknown platform';
  const build = str(row.build_sha || row.buildSha);
  return {
    kind: 'presence',
    id: `${platform}:${build || 'nobuild'}`,
    label: platform,
    lastSeenAt: row.last_seen_at || row.lastSeenAt || null,
    note: build ? `build ${build.slice(0, 7)}` : 'build not recorded',
  };
}

/** Newest first; an undated row sorts last and says so through lastSeenAt null. */
export function sortDevices(list = []) {
  return [...list].sort((a, b) => {
    const ta = Date.parse(a.lastSeenAt || '') || 0;
    const tb = Date.parse(b.lastSeenAt || '') || 0;
    return tb - ta;
  });
}

/** The real links to reach a person; only the ones a fact supports. */
export function reachLinks(contact) {
  const c = contact || {};
  const out = [];
  if (c.phoneDigits) {
    out.push({ kind: 'text', label: `Text ${formatPhone(c.phoneDigits)}`, href: `sms:${c.phoneDigits}` });
    out.push({ kind: 'call', label: `Call ${formatPhone(c.phoneDigits)}`, href: `tel:${c.phoneDigits}` });
  }
  if (c.email) out.push({ kind: 'email', label: `Email ${c.email}`, href: `mailto:${c.email}` });
  return out;
}

/**
 * Build the record. Every input is a row the viewer already read; absence is
 * stated, never painted.
 * @param {object} args { member, contactIndex, dmDevices, presence }
 */
export function buildPersonRecord({ member = {}, contactIndex = null, dmDevices = [], presence = [] } = {}) {
  const contact = contactOf(member);
  const who = labelFor(contactIndex, { ownName: member.displayName, email: member.email, phone: contact.phoneDigits });
  const doors = [];
  if (contact.email) doors.push({ kind: 'email', value: contact.email, source: contact.emailSource });
  if (contact.phoneDigits) doors.push({ kind: 'phone', value: formatPhone(contact.phoneDigits), source: contact.phoneSource });
  const devices = sortDevices([
    ...(Array.isArray(dmDevices) ? dmDevices : []).map(dmDeviceView),
    ...(Array.isArray(presence) ? presence : []).map(presenceView),
  ]);
  return {
    userId: member.userId || null,
    name: who.shown || '',
    nameNote: who.note || '',
    doors,
    reach: reachLinks(contact),
    devices,
    notHeld: NOT_HELD,
    missing: contact.missing,
    summary: summaryLine({ doors, devices, reach: reachLinks(contact) }),
  };
}

/** "2 doors · 3 devices · 3 ways to reach" — only what is there. */
export function summaryLine({ doors = [], devices = [], reach = [] } = {}) {
  const parts = [];
  parts.push(doors.length ? `${doors.length} sign-in ${doors.length === 1 ? 'door' : 'doors'}` : 'no sign-in door on record');
  parts.push(devices.length ? `${devices.length} ${devices.length === 1 ? 'device' : 'devices'} seen` : 'no device seen yet');
  parts.push(reach.length ? `${reach.length} ${reach.length === 1 ? 'way' : 'ways'} to reach them` : 'no way to reach them on record');
  return parts.join(' · ');
}
