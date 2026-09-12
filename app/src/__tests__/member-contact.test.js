// @vitest-environment node
//
// Who a member is, when they came, and how to reach them.
//
// Darrell 2026-09-11, with the Admin screen open:
//   "PoeTech App should be able to see who is and when also the ability to
//    change user levels... also see the email and try to get email and
//    cellphone together if they have them... however just NOT ALLOWING IT TO
//    BE A CONSTRAINT."
//
// Most of this file is about that last clause. It is easy to build a contact
// column that quietly becomes a chore list — a red flag on every row missing a
// number, a disabled control until somebody "completes the profile". The rule
// here is the opposite: the row says what is known and stops.
import { describe, it, expect } from 'vitest';
import {
  contactOf, reachLabel, whenLabel, dayLabel, daysBetween, formatPhone, digitsOf,
  nationalDigits, isPhoneDoorEmail, phoneDoorDigits, signInEmailOf,
  likelySamePerson, samePersonHints, contactCoverage,
  CONTACT_IS_NEVER_REQUIRED, PHONE_DOOR_SUFFIX,
} from '../lib/member-contact.js';
import { DECLARED_SAME_PERSON, declaredPersonOf } from '../lib/admin-allowlist.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(SRC, rel), 'utf8');

// The two rows the live roster actually carries for one man (measured
// 2026-09-11 against poe-family and tlc-therapy-solutions).
const gmail = { userId: 'u-gmail', displayName: 'darrellpoe06', email: 'darrellpoe06@gmail.com', emailIsPhoneDoor: false, joinedAt: '2026-05-24T00:00:00Z', lastSignInAt: '2026-08-17T00:00:00Z' };
const door = { userId: 'u-door', displayName: 'Darrell', email: null, emailIsPhoneDoor: true, phone: '15636502416', joinedAt: '2026-08-20T00:00:00Z', lastSignInAt: '2026-07-24T00:00:00Z' };
const bare = { userId: 'u-bare', displayName: 'Somebody New', email: null, emailIsPhoneDoor: false, joinedAt: '2026-09-10T00:00:00Z', lastSignInAt: null };

describe('NOT A CONSTRAINT — the instruction, held as a fact', () => {
  it('states in data that a missing email or phone blocks nothing', () => {
    expect(CONTACT_IS_NEVER_REQUIRED.blocksTheRoster).toBe(false);
    expect(CONTACT_IS_NEVER_REQUIRED.blocksARoleChange).toBe(false);
    expect(CONTACT_IS_NEVER_REQUIRED.blocksAnInvite).toBe(false);
    expect(CONTACT_IS_NEVER_REQUIRED.showsAsAnError).toBe(false);
  });

  it('a member with NEITHER is still a whole row, and is not scolded', () => {
    const c = contactOf(bare);
    expect(c.hasEmail).toBe(false);
    expect(c.hasPhone).toBe(false);
    expect(c.missing).toEqual(['email', 'phone']);
    // It says what is true. It does not ask, warn, or mark them incomplete.
    expect(reachLabel(c)).toBe('no email or phone on file');
    expect(reachLabel(c)).not.toMatch(/required|missing|please|add|incomplete|!/i);
  });

  it('the coverage count says out loud that it is not a chase list', () => {
    const c = contactCoverage([gmail, door, bare]);
    expect(c).toMatchObject({ people: 3, withEmail: 1, withPhone: 1, withBoth: 0, withNeither: 1 });
    expect(c.note).toMatch(/not a chase list/i);
    // And it names nobody.
    expect(JSON.stringify(c)).not.toMatch(/darrell|Somebody/i);
  });

  it('the roster surface never disables a control for a missing contact', () => {
    const src = read('components/AdminConsole.jsx');
    // The reach line is rendered as text beside the name — never as a gate on
    // the role select, the classification, or the invite.
    expect(src).toMatch(/reachLabel\(contactOf\(m\)\)/);
    expect(src).not.toMatch(/disabled=\{[^}]*contactOf|disabled=\{[^}]*hasPhone|disabled=\{[^}]*hasEmail/);
  });
});

describe('the phone door is a PHONE, not a mailbox', () => {
  it('recognizes the synthetic address', () => {
    expect(isPhoneDoorEmail('15636502416@phone.poetech.us')).toBe(true);
    expect(isPhoneDoorEmail('darrellpoe06@gmail.com')).toBe(false);
    expect(isPhoneDoorEmail(null)).toBe(false);
    expect(PHONE_DOOR_SUFFIX).toBe('@phone.poetech.us');
  });

  it('reads the digits out of it', () => {
    expect(phoneDoorDigits('15636502416@phone.poetech.us')).toBe('15636502416');
    expect(phoneDoorDigits('darrellpoe06@gmail.com')).toBe('');
  });

  it('NEVER prints a sign-in address where an email belongs', () => {
    const c = contactOf(door);
    expect(c.email).toBe('');           // not "15636502416@phone.poetech.us"
    expect(c.phone).toBe('(563) 650-2416');
    expect(c.phoneSource).toMatch(/sign in with/);
    expect(reachLabel(c)).toMatch(/signs in by phone/);
  });

  it('can still reconstruct the identity when one is needed', () => {
    expect(signInEmailOf(door)).toBe('15636502416@phone.poetech.us');
    expect(signInEmailOf(gmail)).toBe('darrellpoe06@gmail.com');
    expect(signInEmailOf(bare)).toBe('');
  });

  it('the database agrees — 0210 nulls that column and flags it', () => {
    const sql = read('../../infra/supabase/migrations-auto/0210-the-signature-door-and-a-roster-that-says-when.sql');
    expect(sql).toMatch(/WHEN u\.email::text LIKE '%@phone\.poetech\.us' THEN NULL/);
    expect(sql).toMatch(/email_is_phone_door boolean/);
  });
});

describe('a number a person can read, and nothing invented', () => {
  it('formats a US number from any shape it arrives in', () => {
    for (const raw of ['15636502416', '5636502416', '+1 (563) 650-2416', '563.650.2416']) {
      expect(formatPhone(raw), raw).toBe('(563) 650-2416');
    }
  });
  it('leaves an international number alone rather than forcing a shape', () => {
    expect(formatPhone('442071838750')).toBe('+442071838750');
  });
  it('empty in, empty out', () => {
    expect(formatPhone('')).toBe('');
    expect(formatPhone(null)).toBe('');
    expect(digitsOf(undefined)).toBe('');
    expect(nationalDigits('15636502416')).toBe('5636502416');
  });
  it('the person’s OWN answer outranks anything derived', () => {
    const c = contactOf({ ...door, declaredPhone: '(217) 372-7704', declaredEmail: 'me@real.example' });
    expect(c.phone).toBe('(217) 372-7704');
    expect(c.phoneSource).toBe('they told us');
    expect(c.email).toBe('me@real.example');
    expect(c.emailSource).toBe('they told us');
    expect(c.both).toBe(true);
  });
});

describe('WHEN — and unknown reads as unknown', () => {
  it('says when they came and when they were last here', () => {
    expect(whenLabel(gmail, '2026-09-11')).toBe('here since 24 May 2026 · last here 25 days ago');
  });
  it('says so plainly when somebody has never signed in', () => {
    expect(whenLabel(bare, '2026-09-11')).toBe('here since 10 Sep 2026 · has not signed in yet');
  });
  it('an unrecorded join date NEVER reads as today', () => {
    const t = whenLabel({ joinedAt: null, lastSignInAt: '2026-09-11T00:00:00Z' }, '2026-09-11');
    expect(t).toMatch(/joined — not recorded/);
    expect(t).toMatch(/last here today/);
  });
  it('yesterday, and a long absence by date', () => {
    expect(whenLabel({ joinedAt: '2026-01-01', lastSignInAt: '2026-09-10' }, '2026-09-11')).toMatch(/last here yesterday/);
    expect(whenLabel({ joinedAt: '2026-01-01', lastSignInAt: '2026-05-01' }, '2026-09-11')).toMatch(/last here 1 May 2026/);
  });
  it('never renders an Invalid Date', () => {
    expect(dayLabel('')).toBe('');
    expect(dayLabel('not-a-date')).toBe('');
    expect(dayLabel('2026-13-01')).toBe('');
    expect(daysBetween('', '2026-09-11')).toBe(null);
  });
});

describe('two doors, one person — said, never merged', () => {
  it('pairs the gmail and the phone door because the repo DECLARES they are one man', () => {
    // Nothing derivable would pair these: different email, different phone,
    // different display name. The declaration is what makes it a fact.
    const hit = likelySamePerson(gmail, door);
    expect(hit.same).toBe(true);
    expect(hit.confidence).toBe('declared');
    expect(hit.why).toMatch(/declared as the same person \(darrell\)/);
  });

  it('the declaration does not drift from the shell’s own personas', () => {
    // Two copies of a mapping is how a mapping becomes wrong. This is the pin
    // that keeps admin-allowlist's DECLARED_SAME_PERSON and the shell's
    // FAMILY_EMAIL_PROFILES saying the same thing.
    const shell = read('poe-financial-mvp-v28.jsx');
    for (const [email, persona] of Object.entries(DECLARED_SAME_PERSON)) {
      expect(shell.includes(`'${email}': '${persona}'`), `${email} -> ${persona} is declared in admin-allowlist but not in FAMILY_EMAIL_PROFILES`).toBe(true);
    }
  });

  it('pairs on a shared phone, and calls a shared NAME only worth checking', () => {
    const a = { userId: 'a', phone: '5636502416', emailIsPhoneDoor: true };
    const b = { userId: 'b', declaredPhone: '+1 (563) 650-2416' };
    expect(likelySamePerson(a, b)).toMatchObject({ same: true, confidence: 'certain' });
    const n1 = { userId: 'n1', displayName: 'Mary Gwin' };
    const n2 = { userId: 'n2', displayName: 'mary gwin' };
    const hit = likelySamePerson(n1, n2);
    expect(hit.confidence).toBe('worth checking');
    expect(hit.why).toMatch(/a name is not proof/);
  });

  it('never pairs a row with itself, or two genuinely different people', () => {
    expect(likelySamePerson(gmail, gmail).same).toBe(false);
    expect(likelySamePerson(gmail, { userId: 'x', email: 'someone@else.example' }).same).toBe(false);
    expect(samePersonHints([])).toEqual([]);
    expect(samePersonHints(null)).toEqual([]);
  });

  it('MERGES NOTHING — the hint carries no action at all', () => {
    const [h] = samePersonHints([gmail, door]);
    expect(Object.keys(h).sort()).toEqual(['a', 'b', 'confidence', 'why']);
    const src = read('components/AdminConsole.jsx');
    expect(src).toMatch(/nothing is merged/i);
    expect(src).not.toMatch(/mergeMember|mergeAccounts|merge_user/);
  });
});

describe('the roster read actually asks for WHEN', () => {
  it('0210 returns joined_at, last_sign_in_at and created_at', () => {
    const sql = read('../../infra/supabase/migrations-auto/0210-the-signature-door-and-a-roster-that-says-when.sql');
    for (const col of ['joined_at timestamptz', 'last_sign_in_at timestamptz', 'created_at timestamptz', 'phone text']) {
      expect(sql, col).toContain(col);
    }
    // Access is UNCHANGED: still owner/admin, still checked in the body.
    expect(sql).toMatch(/user_role_in_instance\(instance_uuid\) IN \('owner','admin'\)/);
  });

  it('the client mapper carries them through, nulls and all', () => {
    const src = read('lib/member-roles.js');
    for (const k of ['joinedAt:', 'lastSignInAt:', 'accountCreatedAt:', 'phone:', 'emailIsPhoneDoor:']) {
      expect(src, k).toContain(k);
    }
    expect(src).toMatch(/never a constraint|not allowing it to be a constraint/i);
  });
});

describe('proven-to-catch (anti-theater)', () => {
  it('CATCHES a phone-door address printed as an email', () => {
    // The failure this whole module exists to prevent: telling a steward they
    // can write to 15636502416@phone.poetech.us.
    expect(contactOf(door).email).not.toContain('@phone.poetech.us');
    expect(reachLabel(contactOf(door))).not.toContain('@');
  });
  it('CATCHES an invented phone number', () => {
    expect(contactOf(gmail).phone).toBe('');
    expect(contactOf(gmail).hasPhone).toBe(false);
  });
  it('CATCHES an unknown date rendered as today', () => {
    expect(whenLabel({ joinedAt: null, lastSignInAt: null }, '2026-09-11'))
      .toBe('joined — not recorded · has not signed in yet');
  });
  it('CATCHES a declaration that only exists in one of the two places', () => {
    expect(declaredPersonOf('darrellpoe06@gmail.com')).toBe('darrell');
    expect(declaredPersonOf('nobody@nowhere.example')).toBe('');
  });
});

// ── THE PERSON'S OWN ANSWER ACTUALLY ARRIVES NOW (0213) ─────────────────────
// contactOf() has read `declaredEmail` / `declaredPhone` since the day it was
// written, and preferred them over anything derived, labelled "they told us".
// The SERVER never sent them: 0210's roster read auth.users and stopped. So
// the best-labelled branch in this module was, until 0213, unreachable from
// the real surface — right code, no supply.
describe('what they wrote themselves, from the roster row', () => {
  it('the client mapper carries the two declared cells', () => {
    const src = read('lib/member-roles.js');
    expect(src).toContain('declaredEmail: r.declared_email');
    expect(src).toContain('declaredPhone: r.declared_phone');
  });

  it('their own answer outranks the account, and says so', () => {
    const row = { email: 'signin@test.local', phone: '15635550000',
                  declaredEmail: 'reach.me@test.local', declaredPhone: '(563) 555-0213' };
    const c = contactOf(row);
    expect(c.email).toBe('reach.me@test.local');
    expect(c.emailSource).toBe('they told us');
    expect(c.phoneSource).toBe('they told us');
    expect(c.phone).toBe('(563) 555-0213');
  });

  it('and a row with no record still reads exactly as it did before', () => {
    const row = { email: 'signin@test.local', declaredEmail: null, declaredPhone: null };
    const c = contactOf(row);
    expect(c.email).toBe('signin@test.local');
    expect(c.emailSource).toBe('how they sign in');
    expect(c.hasPhone).toBe(false);
    expect(c.missing).toContain('phone');
  });

  it('CATCHES a household number hung on a person — the whole reason 0213 reads no household record', () => {
    // household_records has NO user_id: one row for the whole instance. If the
    // migration had joined it, every member would carry the household's "Best
    // phone" as though they had given it. The wall is in the SQL; this pins
    // that nothing on the client puts it back.
    const src = read('../../infra/supabase/migrations-auto/0213-the-roster-shows-what-the-person-told-us.sql');
    const code = src.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
    expect(code).not.toMatch(/household_records/);
    expect(code).toMatch(/church_member_records/);
    expect(code).toMatch(/tlc_onboarding_packets/);
  });
});
