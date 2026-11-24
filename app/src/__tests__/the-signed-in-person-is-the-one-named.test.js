// =============================================================================
// DR-1617 — the signed-in person is the one named, and stays signed in
// =============================================================================
// Darrell 2026-11-24: "The Apps keep logging me in and out?!!!!!!! Christina
// logging in shows Darrell name instead of hers?!!!!!"
//
// Three measured causes, three pins:
//   1. The profile pill / welcome name came from ONE saved value per device,
//      read before the signed-in account's own mapping.
//   2. The boot's synchronous session read took the FIRST sb-*-auth-token in
//      storage, and the cutover left two on every pre-cutover device.
//   3. The sovereign GoTrue ran a refresh-token reuse interval of 0 (no
//      default in v2.177.0), so a tab presenting a just-rotated token got the
//      whole token family revoked: every tab and device signed out at once.
// Each pin is shown to CATCH the old behaviour, not only to pass the new.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { profileForAccount, readSavedProfile, writeSavedProfile, PROFILE_KEY, PROFILE_OWNER_KEY } from '../lib/account-profile.js';
import { readPersistedSession } from '../lib/supabase.js';

const FAMILY = {
  'darrellpoe06@gmail.com': 'darrell',
  'mrspoe06@gmail.com': 'christina',
  'christina@tlctherapysolutions.com': 'christina',
};
const DARRELL = 'uid-darrell';
const CHRISTINA = 'uid-christina';

function memStore(init = {}) {
  const m = new Map(Object.entries(init));
  return {
    get length() { return m.size; },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
  };
}

describe('1. the profile follows the account, not the device', () => {
  it("Christina on the device Darrell last used is named Christina (the reported bug: a pre-rule saved 'darrell')", () => {
    const r = profileForAccount({ uid: CHRISTINA, email: 'mrspoe06@gmail.com', saved: 'darrell', savedOwner: null, familyMap: FAMILY });
    expect(r.profile).toBe('christina');
    expect(r.source).toBe('account');
  });

  it("Christina is named Christina even when the saved pick is stamped as Darrell's", () => {
    const r = profileForAccount({ uid: CHRISTINA, email: 'christina@tlctherapysolutions.com', saved: 'darrell', savedOwner: DARRELL, familyMap: FAMILY });
    expect(r.profile).toBe('christina');
  });

  it("a person's OWN saved pick stands (Darrell chose the Family view on his device)", () => {
    const r = profileForAccount({ uid: DARRELL, email: 'darrellpoe06@gmail.com', saved: 'family', savedOwner: DARRELL, familyMap: FAMILY });
    expect(r.profile).toBe('family');
    expect(r.source).toBe('saved');
  });

  it("someone outside the family never inherits a family profile from the device", () => {
    const r = profileForAccount({ uid: 'uid-parishioner', email: 'someone@example.com', saved: 'darrell', savedOwner: null, familyMap: FAMILY });
    expect(r.profile).toBe('self');
  });

  it('email case does not matter', () => {
    expect(profileForAccount({ uid: CHRISTINA, email: 'MrsPoe06@Gmail.com', familyMap: FAMILY }).profile).toBe('christina');
  });

  it('PROVEN TO CATCH: the old order (saved before account) names Darrell for Christina', () => {
    const oldResolve = ({ email, saved }) => saved || FAMILY[email.toLowerCase()] || 'self';
    expect(oldResolve({ email: 'mrspoe06@gmail.com', saved: 'darrell' })).toBe('darrell');
    expect(profileForAccount({ uid: CHRISTINA, email: 'mrspoe06@gmail.com', saved: 'darrell', familyMap: FAMILY }).profile).not.toBe('darrell');
  });

  it('a saved pick is stamped with its account, and clearing clears both', () => {
    const ls = memStore();
    writeSavedProfile(ls, 'family', DARRELL);
    expect(readSavedProfile(ls)).toEqual({ saved: 'family', savedOwner: DARRELL });
    writeSavedProfile(ls, null, DARRELL);
    expect(ls.getItem(PROFILE_KEY)).toBeNull();
    expect(ls.getItem(PROFILE_OWNER_KEY)).toBeNull();
  });

  it('the household roll-up names nobody; a person persona is title-cased', async () => {
    const { personaName } = await import('../lib/account-profile.js');
    expect(personaName('family')).toBeNull();
    expect(personaName('christina')).toBe('Christina');
    expect(personaName(null)).toBeNull();
  });

  it('blocked storage never throws', () => {
    const bad = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
    expect(readSavedProfile(bad)).toEqual({ saved: null, savedOwner: null });
    expect(() => writeSavedProfile(bad, 'darrell', DARRELL)).not.toThrow();
  });

  it('the app resolves the profile once per ACCOUNT, through this rule, and stamps every pick', () => {
    const src = readFileSync(join(__dirname, '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect(src).toMatch(/import \{ profileForAccount, readSavedProfile, writeSavedProfile, personaName \} from '\.\/lib\/account-profile\.js'/);
    expect(src).toMatch(/profileResolvedForRef\.current === uid/);
    expect(src).toMatch(/profileForAccount\(\{ uid, email: authSession\.user\?\.email, saved, savedOwner, familyMap: FAMILY_EMAIL_PROFILES \}\)/);
    expect(src).toMatch(/writeSavedProfile\(localStorage, p, /);
    // The old early return that let the device's last profile stand for the next person.
    expect(src).not.toMatch(/if \(!authSession \|\| !authHydrated \|\| currentProfile \|\| isAnyDemoMode\) return;/);
  });
});

describe("2. the boot reads the client's own session slot, never a leftover one", () => {
  const sess = (who) => JSON.stringify({ access_token: `at-${who}`, refresh_token: `rt-${who}`, user: { id: `uid-${who}` } });

  it('with two auth tokens on the device, the client key wins regardless of storage order', () => {
    const ls = memStore({ 'sb-oldhostedref-auth-token': sess('darrell'), 'sb-poetech-auth-token': sess('christina') });
    expect(readPersistedSession(ls, 'sb-poetech-auth-token').user.id).toBe('uid-christina');
  });

  it("the client key empty means signed out, even when a leftover slot holds someone's session", () => {
    const ls = memStore({ 'sb-oldhostedref-auth-token': sess('darrell') });
    expect(readPersistedSession(ls, 'sb-poetech-auth-token')).toBeNull();
  });

  it('PROVEN TO CATCH: the old shape scan paints the leftover session first', () => {
    const ls = memStore({ 'sb-oldhostedref-auth-token': sess('darrell'), 'sb-poetech-auth-token': sess('christina') });
    expect(readPersistedSession(ls).user.id).toBe('uid-darrell');
  });
});

describe('3. the sovereign auth server does not sign every tab out on a rotation race', () => {
  const compose = readFileSync(join(__dirname, '..', '..', '..', 'infra', 'nas-supabase', 'docker-compose.yml'), 'utf8');
  const authBlock = compose.slice(compose.indexOf('\n  auth:'), compose.indexOf('healthcheck:', compose.indexOf('\n  auth:')));

  it('sets a refresh-token reuse interval of at least 10 seconds (hosted parity)', () => {
    const m = authBlock.match(/GOTRUE_SECURITY_REFRESH_TOKEN_REUSE_INTERVAL:\s*"?(\d+)"?/);
    expect(m).not.toBeNull();
    expect(Number(m[1])).toBeGreaterThanOrEqual(10);
  });

  it('keeps rotation and reuse detection on outside the window', () => {
    expect(authBlock).toMatch(/GOTRUE_SECURITY_REFRESH_TOKEN_ROTATION_ENABLED:\s*"true"/);
  });

  it('PROVEN TO CATCH: an auth block without the interval fails the check', () => {
    const without = authBlock.replace(/GOTRUE_SECURITY_REFRESH_TOKEN_REUSE_INTERVAL:.*\n/, '');
    expect(without.match(/GOTRUE_SECURITY_REFRESH_TOKEN_REUSE_INTERVAL:\s*"?(\d+)"?/)).toBeNull();
  });
});

describe("4. the header names the person, not the phone account's digits", () => {
  it("Darrell's phone sign-in with no profile name reads Darrell when the account is known", async () => {
    const { headerName } = await import('../components/HeaderAuthButton.jsx');
    const session = { user: { email: '15636502416@phone.poetech.us' } };
    expect(headerName(null, session, 'Darrell')).toBe('Darrell');
  });

  it('an unknown phone sign-in reads its formatted number, never the raw synthetic address', async () => {
    const { headerName } = await import('../components/HeaderAuthButton.jsx');
    expect(headerName(null, { user: { email: '15636502416@phone.poetech.us' } })).toBe('(563) 650-2416');
  });

  it("a chosen profile name always wins", async () => {
    const { headerName } = await import('../components/HeaderAuthButton.jsx');
    expect(headerName({ displayName: 'Christina Poe' }, { user: { email: 'mrspoe06@gmail.com' } }, 'Darrell')).toBe('Christina Poe');
  });

  it('the shell hands the door the account\'s own persona name, never the household roll-up', () => {
    const src = readFileSync(join(__dirname, '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect(src).toMatch(/personName: personaName\(personaOf\(authSession\?\.user\?\.email\)\)/);
  });
});
