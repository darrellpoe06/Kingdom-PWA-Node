// =============================================================================
// member-contact — who a member is, when they came, and how to reach them
// =============================================================================
// Darrell 2026-09-11, with the Admin screenshot open:
//   "PoeTech App should be able to see who is and when also the ability to
//    change user levels... also see the email and try to get email and
//    cellphone together if they have them... however just NOT ALLOWING IT TO BE
//    A CONSTRAINT."
//
// That last clause is the whole design. A missing phone or a missing email is a
// FACT ABOUT THE ROW, never a blocker: it never hides a member, never disables
// a role change, never shows as an error, and never becomes a required field.
// CONTACT_IS_NEVER_REQUIRED below states it as a constant so a test can hold us
// to it rather than a comment asking nicely.
//
// WHERE A PHONE ACTUALLY COMES FROM — measured against the live database on
// 2026-09-11, not assumed (DR-0076 rule 4):
//
//     auth.users.phone            0 of 23 accounts     — never populated
//     raw_user_meta_data.phone    3 of 23              — the phone-door accounts
//     <digits>@phone.poetech.us   3 of 23              — the same three
//     the person's own answer     church member records carry contactPhone
//
// So the phone-door address is BOTH an email and a phone, and the ordinary
// accounts have an email and no phone at all. Two consequences this file
// carries:
//
//   1. A phone-door address is NOT an email a person reads. It is a synthetic
//      sign-in identity. Printing "15636502416@phone.poetech.us" in an Email
//      column states something false about how to reach them, so this reads it
//      as a PHONE and says the email is not known yet.
//   2. The person's OWN answer outranks anything derived. Somebody who wrote
//      their number into their own record has told us; a number taken out of a
//      sign-in address is an inference, and it is labelled as one.
//
// AND ON PAIRING TWO ACCOUNTS AS ONE PERSON: this file will SAY that two rows
// look like the same person, and why, from signals that are facts. It will
// never merge them. Merging two identities is irreversible and takes the
// Governor's word (DR-0111's first carve-out), so the output is a hint with its
// reason attached, for a human to act on or ignore.
//
// Pure: no React, no network, no clock of its own (pass `today`).
// =============================================================================

import { declaredPersonOf } from './admin-allowlist.js';

/** The synthetic sign-in domain the phone door mints (0140 / DR-0172). */
export const PHONE_DOOR_SUFFIX = '@phone.poetech.us';

/**
 * A missing email or phone is NEVER a constraint. Declared as data so the
 * suite can prove it instead of trusting a comment.
 */
export const CONTACT_IS_NEVER_REQUIRED = Object.freeze({
  blocksTheRoster: false,
  blocksARoleChange: false,
  blocksAnInvite: false,
  showsAsAnError: false,
  note: 'A member with neither an email nor a phone is a member. The row says what is known and stops there.',
});

/** Every digit, in order. '(563) 650-2416' -> '5636502416'. */
export function digitsOf(raw) {
  return String(raw ?? '').replace(/\D+/g, '');
}

/**
 * The 10 digits that identify a US number, so '15636502416', '5636502416' and
 * '+1 (563) 650-2416' all compare equal. Anything else is returned as its own
 * digits — an international number is not forced into a shape it does not have.
 */
export function nationalDigits(raw) {
  const d = digitsOf(raw);
  if (d.length === 11 && d.startsWith('1')) return d.slice(1);
  return d;
}

/** A number a person can read. Never invents digits it was not given. */
export function formatPhone(raw) {
  const d = digitsOf(raw);
  const n = nationalDigits(d);
  if (n.length === 10) return `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`;
  if (d.length === 0) return '';
  return d.length > 6 ? `+${d}` : d;
}

/** True when this address is the phone door rather than a mailbox. */
export function isPhoneDoorEmail(email) {
  return String(email || '').toLowerCase().trim().endsWith(PHONE_DOOR_SUFFIX);
}

/** The digits hiding in a phone-door address, or ''. */
export function phoneDoorDigits(email) {
  if (!isPhoneDoorEmail(email)) return '';
  return digitsOf(String(email).split('@')[0]);
}

/**
 * The address this person actually SIGNS IN with — which is not always the
 * address a roster row shows. 0210 deliberately returns NULL in the email
 * column for a phone-door account so nobody prints a synthetic address as a
 * mailbox; this puts it back together from the digits when a caller needs the
 * identity rather than a way to write to somebody.
 */
export function signInEmailOf(m = {}) {
  const raw = String(m.signInEmail || m.rawEmail || m.email || '').trim();
  if (raw) return raw.toLowerCase();
  if (m.emailIsPhoneDoor === true || m.email_is_phone_door === true) {
    const d = digitsOf(m.phone);
    if (d) return `${d}${PHONE_DOOR_SUFFIX}`;
  }
  return '';
}

/**
 * Everything known about reaching one member, and what is not known.
 *
 * @param {object} m a roster row: { email, phone, metaPhone, declaredEmail,
 *                                   declaredPhone, displayName, ... }
 * @returns {{ email, emailSource, phone, phoneDigits, phoneSource,
 *             emailIsPhoneDoor, hasEmail, hasPhone, missing, both }}
 */
export function contactOf(m = {}) {
  const rawEmail = String(m.email || '').trim();
  // The door shows up two ways: as the raw synthetic address (an older caller,
  // or the shell's own session email), or as 0210's flag with the email column
  // already nulled out. Both mean the same thing.
  const viaDoor = isPhoneDoorEmail(rawEmail) || m.emailIsPhoneDoor === true || m.email_is_phone_door === true;

  // EMAIL. The person's own answer first; the sign-in address next; and a
  // phone-door address is not an email at all.
  const declaredEmail = String(m.declaredEmail || '').trim();
  let email = '';
  let emailSource = '';
  if (declaredEmail) { email = declaredEmail; emailSource = 'they told us'; }
  else if (rawEmail && !viaDoor) { email = rawEmail; emailSource = 'how they sign in'; }

  // PHONE, same order: their own answer, then the account, then the door.
  const declaredPhone = digitsOf(m.declaredPhone);
  const accountPhone = digitsOf(m.phone) || digitsOf(m.metaPhone);
  // When the address is still present the digits come out of it; when 0210 has
  // already nulled it, the account phone IS those digits.
  const doorPhone = phoneDoorDigits(rawEmail) || (viaDoor ? accountPhone : '');
  let phoneDigits = '';
  let phoneSource = '';
  if (declaredPhone) { phoneDigits = declaredPhone; phoneSource = 'they told us'; }
  else if (accountPhone) {
    phoneDigits = accountPhone;
    // 0210 fills the phone column FROM the door for these accounts, so "on
    // their account" would be true and useless. Name the door when that is
    // where the number actually comes from.
    phoneSource = (doorPhone && nationalDigits(doorPhone) === nationalDigits(accountPhone))
      ? 'the phone they sign in with' : 'on their account';
  } else if (doorPhone) { phoneDigits = doorPhone; phoneSource = 'the phone they sign in with'; }

  const missing = [];
  if (!email) missing.push('email');
  if (!phoneDigits) missing.push('phone');

  return {
    email,
    emailSource,
    phone: formatPhone(phoneDigits),
    phoneDigits,
    phoneSource,
    emailIsPhoneDoor: viaDoor,
    hasEmail: !!email,
    hasPhone: !!phoneDigits,
    missing,
    both: !!email && !!phoneDigits,
  };
}

/**
 * One plain sentence for a row. It states what is known and stops — it never
 * asks for the missing half, because asking is how a display turns into a
 * constraint.
 */
export function reachLabel(contact) {
  const c = contact || {};
  if (c.both) return `${c.email} · ${c.phone}`;
  if (c.hasEmail) return c.email;
  if (c.hasPhone) return `${c.phone}${c.emailIsPhoneDoor ? ' · signs in by phone' : ''}`;
  return 'no email or phone on file';
}

const isoDay = (v) => {
  const s = String(v || '');
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : '';
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-07-12' -> '12 Jul 2026'. Empty in, empty out — never "Invalid Date". */
export function dayLabel(value) {
  const d = isoDay(value);
  if (!d) return '';
  const [y, m, day] = d.split('-');
  const mi = Number(m) - 1;
  if (mi < 0 || mi > 11) return '';
  return `${Number(day)} ${MONTHS[mi]} ${y}`;
}

/** Whole days between two ISO days, or null when either is unknown. */
export function daysBetween(fromIso, toIso) {
  const a = isoDay(fromIso); const b = isoDay(toIso);
  if (!a || !b) return null;
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

/**
 * The WHEN, in the words a person uses. Unknown reads as unknown — never as
 * "today", and never as a blank that looks like "never" (DR-0076 rule 8).
 */
export function whenLabel(member = {}, today = '') {
  const joined = isoDay(member.joinedAt);
  const seen = isoDay(member.lastSignInAt);
  const parts = [];
  parts.push(joined ? `here since ${dayLabel(joined)}` : 'joined — not recorded');
  if (seen) {
    const ago = daysBetween(seen, today);
    parts.push(ago === null ? `last here ${dayLabel(seen)}`
      : ago <= 0 ? 'last here today'
        : ago === 1 ? 'last here yesterday'
          : ago < 30 ? `last here ${ago} days ago`
            : `last here ${dayLabel(seen)}`);
  } else {
    parts.push('has not signed in yet');
  }
  return parts.join(' · ');
}

/**
 * Do these two rows look like the SAME person? Facts only, and the reason
 * always travels with the answer. This NEVER merges anything — merging two
 * identities is irreversible and is the Governor's call, not a heuristic's.
 */
export function likelySamePerson(a = {}, b = {}) {
  if (!a || !b || a.userId === b.userId) return { same: false, why: '' };
  const ca = contactOf(a);
  const cb = contactOf(b);

  // A DECLARED pairing outranks every derived signal. The Governor signs in
  // through gmail and through the phone door; those two rows carry no shared
  // phone, no shared email and no shared display name, so nothing derivable
  // would ever pair them — but the repo already declares that they are one man
  // (admin-allowlist DECLARED_SAME_PERSON, mirroring the shell's personas).
  const pa = declaredPersonOf(signInEmailOf(a));
  const pb = declaredPersonOf(signInEmailOf(b));
  if (pa && pa === pb) {
    return { same: true, why: `both sign-in doors are declared as the same person (${pa})`, confidence: 'declared' };
  }
  const na = nationalDigits(ca.phoneDigits);
  const nb = nationalDigits(cb.phoneDigits);
  if (na && na === nb) {
    return { same: true, why: `the same phone number, ${formatPhone(na)}`, confidence: 'certain' };
  }
  const ea = String(ca.email || '').toLowerCase();
  const eb = String(cb.email || '').toLowerCase();
  if (ea && ea === eb) {
    return { same: true, why: `the same email address, ${ea}`, confidence: 'certain' };
  }
  const da = String(a.displayName || '').trim().toLowerCase();
  const db = String(b.displayName || '').trim().toLowerCase();
  if (da && da === db) {
    // A shared name is a PROMPT to look, not a finding. Said as such.
    return { same: true, why: `the same display name, "${String(a.displayName).trim()}" — a name is not proof`, confidence: 'worth checking' };
  }
  return { same: false, why: '' };
}

/**
 * Rows that look like one person, each pair carrying its reason. The caller
 * shows these; nothing here acts on them.
 */
export function samePersonHints(members = []) {
  const rows = (Array.isArray(members) ? members : []).filter(Boolean);
  const out = [];
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      const hit = likelySamePerson(rows[i], rows[j]);
      if (hit.same) out.push({ a: rows[i], b: rows[j], why: hit.why, confidence: hit.confidence });
    }
  }
  return out;
}

/** How the roster stands on contact — counts only, and nobody is named. */
export function contactCoverage(members = []) {
  const rows = (Array.isArray(members) ? members : []).filter(Boolean);
  const cs = rows.map(contactOf);
  return {
    people: rows.length,
    withEmail: cs.filter((c) => c.hasEmail).length,
    withPhone: cs.filter((c) => c.hasPhone).length,
    withBoth: cs.filter((c) => c.both).length,
    withNeither: cs.filter((c) => !c.hasEmail && !c.hasPhone).length,
    // Said out loud so nobody reads the number as a to-do list.
    note: 'A count, not a chase list. Nothing in this app requires either one.',
  };
}
