// =============================================================================
// learner-identity — the record is in the reader's NAME (DR-1421)
// =============================================================================
// Darrell, 2026-11-10, of his son's record headed
// "14472209779@phone.poetech.us · CHILD": say "the name of the reader in their
// record... use all subpoints for who they are... name as the main focus like
// Big Picture in our default mode"; then "The name of the reader"; then "In
// their name."
//
// A sign-in address is how a person gets in, not who they are. The name comes
// from what the app already holds, in this order, and is never invented:
//   1. the name the reader's own record carries (their account's name);
//   1b. the name their household's roster holds for them (their own display
//      name in this household; lib/learner-household.js);
//   2. the name the VIEWER'S OWN contacts give that number or address
//      (lib/contact-names.js, DR-0825: a label beside the account, per viewer);
//   3. nothing known: the phone number or address, written so a person can
//      read it, with a line saying how a name gets there.
// The address itself is kept, as a subpoint, never as the heading.
//
// BENEATH THE NAME, WHO THEY ARE ("parents etc... households... vs individuals"):
// the relationship a steward wrote for them, their standing in the household
// (a parent or guardian holds the account; a child is under one), the
// household by name and how many are in it, or that the account stands alone.
// Each line is a row the household already holds; a reader the roster does not
// list gets no household line at all, because unknown is not "none".
// Pure: the contact index is passed in.
// =============================================================================
import { labelFor } from './contact-names.js';
import { isPhoneDoorEmail, phoneDoorDigits, formatPhone } from './member-contact.js';

const str = (v) => String(v == null ? '' : v).trim();
const looksLikeAddress = (s) => /@/.test(s);
const LEVEL = { child: 'Child', youth: 'Youth', teen: 'Teen', adult: 'Adult', senior: 'Senior' };
// A member's standing, in the words a family uses. A role not named here is shown as written.
const STANDING = {
  owner: 'Head of the household account (a parent or guardian)',
  admin: 'A parent or guardian on the household account',
  child: 'A child on the household account, under a guardian',
  member: 'A member of the household',
};

/** The household lines for a reader the roster lists; [] for one it does not. */
export function householdPoints(member, household) {
  if (!member) return [];
  const out = [];
  const rel = str(member.relationship);
  if (rel) out.push(`Relationship: ${rel}`);
  const role = str(member.role).toLowerCase();
  if (role) out.push(STANDING[role] || `Role: ${role}`);
  const count = (household && household.count) || 0;
  const name = str(household && household.name);
  if (count === 1) out.push(name ? `An individual account (${name})` : 'An individual account');
  else if (count > 1) out.push(name ? `Household: ${name}, ${count} people` : `A household of ${count} people`);
  return out;
}

/** The name an account gives itself, from its sign-in session; '' when it gives none. */
export function accountName(user) {
  const m = (user && user.user_metadata) || {};
  const name = str(m.full_name || m.name || m.display_name || [m.first_name, m.last_name].filter(Boolean).join(' '));
  return looksLikeAddress(name) ? '' : name;
}

/**
 * Who this reader is, for the head of their record.
 * @param {object} learner  { label, ageBand, lastActivityAt } (lib/learner-records.js)
 * @param {object} [opts]   { contacts: contact index, mine: boolean, household: lib/learner-household.js }
 * @returns {{ name: string, named: boolean, source: 'record'|'household'|'contacts'|'none',
 *   signIn: string, points: string[] }}
 */
export function learnerIdentity(learner = {}, { contacts = null, mine = false, household = null } = {}) {
  const member = household && household.byUser && learner.userId ? household.byUser.get(learner.userId) || null : null;
  const rosterName = member && !looksLikeAddress(str(member.displayName)) ? str(member.displayName) : '';
  const label = str(learner.label);
  const address = looksLikeAddress(label) ? label : '';
  const own = address ? '' : label;
  const door = isPhoneDoorEmail(address);
  const phone = door ? formatPhone(phoneDoorDigits(address)) : '';
  const hit = address ? labelFor(contacts, { ownName: '', email: address }) : { shown: '', note: '' };
  const signIn = door ? `Signs in by phone ${phone}` : address ? `Signs in as ${address}` : '';

  let name = own || rosterName;
  let source = own ? 'record' : rosterName ? 'household' : 'none';
  if (!name && hit.shown) {
    name = hit.shown;
    source = 'contacts';
  }
  const named = !!name;
  if (!name) name = door ? phone : address || 'A reader';

  const points = [];
  if (mine) points.push('This is your own record');
  points.push(...householdPoints(member, household));
  const level = LEVEL[str(learner.ageBand).toLowerCase()];
  if (level) points.push(`Reads at the ${level} level`);
  // The address is a line beneath the name; for the reader's own record it is always there, so they know it is theirs.
  if (signIn && (named || mine)) points.push(signIn);
  if (source === 'contacts') points.push('Named from your contacts');
  if (!named && !mine)
    points.push(door ? 'No name on this account yet. Save this number in your contacts with their name and it shows here.' : 'No name on this account yet.');
  return { name, named, source, signIn, points };
}
