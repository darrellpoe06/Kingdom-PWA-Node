// =============================================================================
// sovereign-password-recovery — an email account has a way back in, and the
// witness can say whether the email door works at all
// =============================================================================
// THE INCIDENT (2026-09-07). Shay tapped "email me a sign-in link" on her own
// business door, got "Sign-in link sent", and nothing arrived. Three facts
// under it, each true and each invisible from outside the NAS:
//
//   1. DR-0307 §3 keeps SMTP out of sovereign auth's critical path on purpose.
//      So the link CANNOT arrive, by design, until someone runs
//      enable_email_smtp.sh. That is a decision, not a fault.
//   2. Her identity IS an email address, so the phone+PIN door is not hers —
//      signing up there would mint a SECOND user id with no Moore Divahs seat
//      and land her in an empty world, which looks like success and is not.
//   3. reset_phone_pin.sh, the one recovery tool on the box, only ever accepted
//      a phone number and only ever touched `<digits>@phone.poetech.us`. The
//      password door was the only door her account could open, and nothing
//      could reset that password. She had NO route in.
//
// So this file pins the two things that close it: the recovery script exists
// and holds the shape that makes it safe, and the witness can answer "does the
// email door work?" — the question that had no answer inside the instrument
// that is supposed to answer it (DR-0125, DR-0327).
//
// PROVEN-TO-CATCH (DR-0076 §3): every structural rule below is also fed a
// fixture carrying the defect it forbids, and is required to reject it. A gate
// that has never been red is not evidence.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SCRIPT = join(ROOT, 'infra/nas-supabase/reset_password.sh');
const PHONE_SIBLING = join(ROOT, 'infra/nas-supabase/reset_phone_pin.sh');
const WITNESS = join(ROOT, '.github/workflows/nas-health.yml');
const SUPABASE_LIB = join(ROOT, 'app/src/lib/supabase.js');

const read = (p) => readFileSync(p, 'utf8');

// --- the checks, as functions, so a defective fixture can be fed to each -----

/** psql must be quiet: without -q the "UPDATE 1" command tag joins the captured
 *  value ("1UPDATE1") and a SUCCESSFUL write reports as a failure. Measured
 *  2026-08-20 on the phone sibling, run 32389158714. */
export function usesQuietPsql(src) {
  return /psql\s+-q\b/.test(src);
}

/** The secret is prompted, never an argument: an argv password lands in the
 *  process list and in shell history. */
export function promptsForTheSecret(src) {
  return /stty -echo/.test(src) && /read -r/.test(src);
}

/** The account must be proven to exist BEFORE anyone is asked for a secret —
 *  and the script must never create one, so a typo fails loudly instead of
 *  minting a seatless identity. */
export function checksAccountBeforePrompting(src) {
  const count = src.search(/SELECT count\(\*\) FROM auth\.users/);
  const prompt = src.search(/stty -echo/);
  return count > -1 && prompt > -1 && count < prompt;
}

/** bcrypt in the format GoTrue verifies. */
export function hashesWithBcrypt(src) {
  return /crypt\(\s*:'?\w+'?\s*,\s*gen_salt\('bf'\)\s*\)/.test(src);
}

/** Confirming an unconfirmed address widens WHO can sign in. It may happen
 *  only on an explicit second decision, never as a side effect of a reset. */
export function neverSilentlyConfirms(src) {
  if (!/email_confirmed_at\s*=/.test(src)) return true; // never touches it at all
  return /--confirm-email/.test(src);
}

describe('reset_password.sh exists — the email door has a way back in', () => {
  it('is present on the box alongside its phone sibling', () => {
    expect(existsSync(SCRIPT)).toBe(true);
    expect(existsSync(PHONE_SIBLING)).toBe(true);
  });

  it('refuses a phone+PIN account and names the script that owns it', () => {
    const src = read(SCRIPT);
    expect(src).toMatch(/@phone\.poetech\.us\)/);
    expect(src).toMatch(/reset_phone_pin\.sh/);
  });

  it('resolves the docker binary rather than trusting the PATH (DR-0322)', () => {
    // DSM gives a non-login ssh shell no docker on the PATH. A whole migration
    // lane exited before it ran on exactly this.
    expect(read(SCRIPT)).toMatch(/command -v docker/);
  });

  it('states plainly that it never creates an account', () => {
    expect(read(SCRIPT)).toMatch(/never creates one/i);
  });
});

describe('reset_password.sh: the shape that makes it safe', () => {
  const src = read(SCRIPT);

  it('runs psql quietly, so a successful UPDATE is not read as a failure', () => {
    expect(usesQuietPsql(src)).toBe(true);
    // proven-to-catch: the exact shape without -q
    expect(usesQuietPsql('CHANGED=$(psql -h 127.0.0.1 -t -A -c "UPDATE ...")')).toBe(false);
  });

  it('prompts for the password instead of taking it as an argument', () => {
    expect(promptsForTheSecret(src)).toBe(true);
    expect(promptsForTheSecret('NEWPW="$2"\npsql -q -v pw="$NEWPW"')).toBe(false);
  });

  it('proves the account exists before asking for any secret', () => {
    expect(checksAccountBeforePrompting(src)).toBe(true);
    // proven-to-catch: prompting first, checking after — the order that asks a
    // person for a secret and only then tells them the address was wrong.
    const inverted = 'stty -echo; read -r PW; stty echo\nSELECT count(*) FROM auth.users WHERE email = :\'em\';';
    expect(checksAccountBeforePrompting(inverted)).toBe(false);
  });

  it('hashes with bcrypt via pgcrypto, the format GoTrue verifies', () => {
    expect(hashesWithBcrypt(src)).toBe(true);
    expect(hashesWithBcrypt("SET encrypted_password = md5(:'pw')")).toBe(false);
  });

  it('never confirms an unconfirmed address as a side effect of a reset', () => {
    expect(neverSilentlyConfirms(src)).toBe(true);
    // proven-to-catch: a reset that quietly confirms the address as well —
    // the same statement, minus the explicit decision.
    const silent = "UPDATE auth.users SET encrypted_password = crypt(:'pw', gen_salt('bf')), email_confirmed_at = now() WHERE email = :'em';";
    expect(neverSilentlyConfirms(silent)).toBe(false);
  });

  it('carries the same 8-character floor the sign-in form enforces', () => {
    // DR-0314: a standard that lives in one implementation is a coincidence.
    // If the app's floor moves, this gate goes red rather than letting the box
    // set a password the form will refuse — a lockout wearing a success line.
    expect(read(SUPABASE_LIB)).toMatch(/password\.length < 8/);
    expect(src).toMatch(/-ge 8\b/);
    expect(src).toMatch(/at least 8 characters/);
  });
});

describe('the witness can answer "does the email door work?"', () => {
  const wf = read(WITNESS);

  it('reports whether SMTP is wired at all', () => {
    expect(wf).toMatch(/SMTP wired in supabase-auth/);
    expect(wf).toMatch(/GOTRUE_SMTP_HOST/);
  });

  it('reads PRESENCE only — a credential is never one grep from a public log', () => {
    // The value must never be echoed. `test -n` is the whole read.
    expect(wf).toMatch(/test -n "\$GOTRUE_SMTP_HOST"/);
    expect(wf).not.toMatch(/GOTRUE_SMTP_PASS/);
    expect(wf).not.toMatch(/echo "\$GOTRUE_SMTP/);
  });

  it('names the working doors when the email door is down, instead of leaving it at "no"', () => {
    // DR-0100: an unusable state reported without the route around it is a
    // half-truth. The witness says what still works.
    expect(wf).toMatch(/EMAIL SIGN-IN LINKS CANNOT ARRIVE/);
    expect(wf).toMatch(/reset_password\.sh/);
  });

  it('counts the accounts that have NO working door at all', () => {
    // The number that matters: an email account with no password, on a box
    // that cannot send mail, cannot sign in by any route we serve.
    expect(wf).toMatch(/NO working door/);
  });

  it('keeps the counts-only rule — no address is ever printed', () => {
    const block = wf.slice(wf.indexOf('the SIGN-IN witness'), wf.indexOf('WHY the sick legs restart'));
    expect(block.length).toBeGreaterThan(0);
    // The only literal address shape allowed here is the synthetic phone
    // DOMAIN used to split the classes — never a person's own address.
    const addresses = block.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];
    expect(addresses.filter((a) => !a.startsWith('%@phone.'))).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// The locked-out PATH itself (Darrell 2026-09-07: "something is wrong with the
// path when locked out"). Pins on the sign-in surface, by source, with the
// defect shape fed back to each check.
// -----------------------------------------------------------------------------
const PASSWORD_AUTH = join(ROOT, 'app/src/components/PasswordAuth.jsx');

/** The email door opens on the PASSWORD form (DR-0307 §3: password and
 *  phone+PIN lead; the link is the alternate). */
export function passwordLeadsTheEmailDoor(src) {
  const m = src.match(/const \[usePassword, setUsePassword\] = useState\((true|false)\)/);
  return !!m && m[1] === 'true';
}

/** The link screen never CLAIMS delivery. "Sent" is a claim the app cannot
 *  back; "requested" is what it knows. */
export function linkScreenClaimsOnlyWhatItKnows(src) {
  return !/>\s*Sign-in link sent\s*</.test(src) && /Link requested/.test(src);
}

describe('the locked-out path: the email door leads with what works', () => {
  const src = read(PASSWORD_AUTH);

  it('opens on the password form, with the link as the alternate', () => {
    expect(passwordLeadsTheEmailDoor(src)).toBe(true);
    expect(passwordLeadsTheEmailDoor('const [usePassword, setUsePassword] = useState(false);')).toBe(false);
  });

  it('the link screen says "requested", never "sent", and puts the password door on a button', () => {
    expect(linkScreenClaimsOnlyWhatItKnows(src)).toBe(true);
    expect(linkScreenClaimsOnlyWhatItKnows('<h3>Sign-in link sent</h3>')).toBe(false);
    expect(src).toMatch(/Sign in with my password instead/);
    expect(src).toMatch(/Forgot your password\?/);
  });

  it('keeps the phone+PIN door a PROMINENT button from the password form', () => {
    // Now that the password form is the email door's first screen, the
    // no-email reader lands here (COMMUNITY-FIRST, DR-0172): 48px, border-2.
    const passwordForm = src.slice(src.lastIndexOf('<form onSubmit={submit}'));
    expect(passwordForm).toMatch(/min-h-\[48px\][^>]*>\s*No email\? Use your phone number \+ a PIN/);
  });
});
