// =============================================================================
// people-placement — the people you know, and the space each one belongs in
// =============================================================================
// Darrell, 2026-10-09: "Also my daughter Christiana!!!!! In my contacts... how
// do I add all my contacts at once?!!!!!!! Then choosing who are tenants...
// church members... etc... all who we want in whatever space... make sense?"
//
// The contacts are already in (DR-0736 / DR-0826: the phone picker takes one,
// some or all; a .vcf file takes every one; the keeper holds them). This is
// the next step: each person the steward knows, matched to an account where
// one exists (by email, or by the phone a phone-door account signs in with),
// and PLACED: an account that exists is added to a space by the governor's
// hand (DR-0829); a person with no account yet is invited to a space, by
// email or by the phone they will sign in with; a tenant, household member,
// 1099 worker or manager is written to the Poe Properties invite table the
// door already claims from (0150). Pure: every decision here is a plain
// function; the writes are injected so the proof needs no network.
import { nationalDigits, isPhoneDoorEmail, phoneDoorDigits, formatPhone } from './member-contact.js';

const PROPERTIES_SLUG = 'poe-properties';

const str = (v) => String(v || '').trim();
const lowerEmail = (e) => str(e).toLowerCase();

/**
 * One list of people from the two shapes the app keeps: the keeper's rows
 * ({ name, phones: [], emails: [] }) and this device's rows ({ name, phone,
 * email }). Merged by identifier, named rows only, phones as national digits.
 */
export function peopleFromContacts(tableRows = [], deviceRows = []) {
  const people = [];
  const byKey = new Map();
  const rows = [
    ...(Array.isArray(tableRows) ? tableRows : []).map((r) => ({ name: r && r.name, emails: (r && r.emails) || [], phones: (r && r.phones) || [] })),
    ...(Array.isArray(deviceRows) ? deviceRows : []).map((r) => ({ name: r && r.name, emails: r && r.email ? [r.email] : [], phones: r && r.phone ? [r.phone] : [] })),
  ];
  for (const r of rows) {
    const name = str(r.name);
    if (!name) continue;
    const emails = r.emails.map(lowerEmail).filter((e) => e.includes('@') && !isPhoneDoorEmail(e));
    const phones = r.phones.map(nationalDigits).filter((d) => d.length >= 7);
    const keys = [...emails.map((e) => `e:${e}`), ...phones.map((p) => `p:${p}`)];
    let person = null;
    for (const k of keys) { if (byKey.has(k)) { person = byKey.get(k); break; } }
    if (!person) {
      person = { key: keys[0] || `n:${name.toLowerCase()}`, name, emails: [], phones: [] };
      people.push(person);
    }
    for (const e of emails) if (!person.emails.includes(e)) person.emails.push(e);
    for (const p of phones) if (!person.phones.includes(p)) person.phones.push(p);
    for (const k of keys) byKey.set(k, person);
  }
  return people.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The account a person already has, from the signups list: by a real email,
 * or by the phone a phone-door account signs in with. Null when none.
 */
export function accountFor(person, signupRows = []) {
  const emails = new Set((person && person.emails) || []);
  const phones = new Set((person && person.phones) || []);
  for (const r of Array.isArray(signupRows) ? signupRows : []) {
    const e = lowerEmail(r && r.email);
    if (!e) continue;
    if (isPhoneDoorEmail(e)) {
      if (phones.has(nationalDigits(phoneDoorDigits(e)))) return { userId: r.user_id || null, email: e, category: r.category || 'unknown', by: 'phone' };
    } else if (emails.has(e)) {
      return { userId: r.user_id || null, email: e, category: r.category || 'unknown', by: 'email' };
    }
  }
  return null;
}

/** Every person with their account, if any. */
export function matchAccounts(people = [], signupRows = []) {
  return people.map((p) => ({ ...p, account: accountFor(p, signupRows) }));
}

/** Is this space the Poe Properties instance (tenants, workers, managers live here)? */
export function isPropertiesSpace(space) {
  return !!space && (str(space.slug) === PROPERTIES_SLUG || /poe properties/i.test(str(space.displayName)));
}

export const PROPERTY_PLACEMENTS = Object.freeze([
  { key: 'tenant', label: 'Tenant (the lease signer)', roleLabel: 'tenant', capabilities: [] },
  { key: 'household', label: 'Household member (their family)', roleLabel: 'household', capabilities: [] },
  { key: 'field_worker', label: '1099 worker', roleLabel: 'field_worker', capabilities: ['property.history', 'docs.add'] },
  { key: 'manager', label: 'Property manager', roleLabel: 'manager', capabilities: ['request.manage', 'message.tenant', 'notice.post', 'rentroll.view', 'rent.confirm', 'application.review'] },
]);

/**
 * What a person can be placed AS in a space: the Poe Properties roles on that
 * space; member, viewer and (for an owner) admin everywhere else.
 */
export function placementsFor(space) {
  if (isPropertiesSpace(space)) return PROPERTY_PLACEMENTS.map((p) => ({ key: p.key, label: p.label }));
  const out = [{ key: 'member', label: 'Member' }, { key: 'viewer', label: 'Viewer' }];
  if (space && space.role === 'owner') out.push({ key: 'admin', label: 'Admin' });
  return out;
}

/** The identity an invite is written to: a real email first, else the phone they will sign in with. */
export function inviteIdentityFor(person, toPhoneEmail) {
  const email = (person && person.emails && person.emails[0]) || '';
  if (email) return { email, phone: '' };
  const phone = (person && person.phones && person.phones[0]) || '';
  if (phone) return { email: typeof toPhoneEmail === 'function' ? (toPhoneEmail(phone) || '') : '', phone };
  return { email: '', phone: '' };
}

/**
 * Place one person in one space as one thing. The writes are injected:
 *   addUserToSpace(instanceId, userId, role, name)           -> { ok, status, role } | { ok:false, reason }
 *   inviteToSpace(instanceType, email, role, instanceId)      -> { ok, kind, link? } | { ok:false, reason }
 *   inviteToProperties({ instanceId, email, phone, roleLabel, scopeRef, capabilities, displayName })
 * Answers { name, outcome: 'added'|'already'|'invited'|'link'|'error', detail }.
 */
export async function placePerson({ person, space, placement, toPhoneEmail, addUserToSpace, inviteToSpace, inviteToProperties } = {}) {
  const name = str(person && person.name) || 'this person';
  if (!space || !placement) return { name, outcome: 'error', detail: 'no space or placement chosen' };
  const id = inviteIdentityFor(person, toPhoneEmail);
  if (isPropertiesSpace(space)) {
    const p = PROPERTY_PLACEMENTS.find((x) => x.key === placement);
    if (!p) return { name, outcome: 'error', detail: `${placement} is not a Poe Properties placement` };
    if (!id.email && !id.phone) return { name, outcome: 'error', detail: 'no email or phone to invite' };
    const r = await inviteToProperties({ instanceId: space.instanceId, email: id.phone ? '' : id.email, phone: id.phone, roleLabel: p.roleLabel, tenancyId: null, scopeRef: '*', capabilities: p.capabilities, displayName: name });
    if (!r || !r.ok) return { name, outcome: 'error', detail: (r && (r.error || r.reason)) || 'the invite did not save' };
    return { name, outcome: 'invited', detail: `${p.label} on Poe Properties, claimed when they sign in ${id.phone ? `with ${formatPhone(id.phone)}` : `as ${id.email}`}` };
  }
  const role = ['admin', 'member', 'viewer'].includes(placement) ? placement : 'member';
  if (person && person.account && person.account.userId) {
    const r = await addUserToSpace(space.instanceId, person.account.userId, role, name);
    if (!r || !r.ok) return { name, outcome: 'error', detail: (r && (r.error || r.reason)) || 'the add did not save' };
    return { name, outcome: r.status === 'noop' ? 'already' : 'added', detail: `${r.role || role} of ${space.displayName || space.slug || 'the space'}` };
  }
  if (!id.email) return { name, outcome: 'error', detail: 'no email or phone to invite' };
  const r = await inviteToSpace(space.instanceType, id.email, role, space.instanceId);
  if (!r || !r.ok) return { name, outcome: 'error', detail: (r && (r.error || r.reason)) || 'the invite did not save' };
  if (r.link) return { name, outcome: 'link', detail: `${role} of ${space.displayName || space.slug || 'the space'}: send them the claim link`, link: r.link };
  return { name, outcome: 'invited', detail: `${role} of ${space.displayName || space.slug || 'the space'}, theirs on their next sign-in ${id.phone ? `with ${formatPhone(id.phone)}` : `as ${id.email}`}` };
}

/** Place many, one after another, never stopping on one failure. */
export async function placeMany(people = [], args = {}) {
  const out = [];
  for (const person of people) {
    out.push(await placePerson({ ...args, person }));
  }
  return out;
}

/** One honest line over a set of results. */
export function placementSummary(results = []) {
  const n = (k) => results.filter((r) => r.outcome === k).length;
  const parts = [];
  if (n('added')) parts.push(`${n('added')} added`);
  if (n('already')) parts.push(`${n('already')} already there`);
  if (n('invited')) parts.push(`${n('invited')} invited`);
  if (n('link')) parts.push(`${n('link')} with a claim link to send`);
  if (n('error')) parts.push(`${n('error')} not placed`);
  return parts.length ? parts.join(' · ') : 'Nothing placed.';
}
