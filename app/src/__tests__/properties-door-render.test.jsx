// =============================================================================
// The Poe Properties door RENDERS what its copy promises
// =============================================================================
// Caught on the door's first real render check (2026-08-26, headless Chromium
// against the built bundle): the page said "sign in with the email address your
// landlord used to invite you" while the form underneath asked for a phone
// number and a PIN. That is not cosmetic — a tenant is recognized by the EXACT
// address their landlord invited (migration 0150's claim function matches
// auth.users.email), so a phone-first login hands an invited person a session
// that can never match their invitation, and the app would tell them, honestly
// and uselessly, that they have no door.
//
// Proven-to-catch: if the door ever stops asking for email first, this fails.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// The door checks for a session on mount; a signed-OUT check is the state under
// test (that is when the sign-in form renders).
vi.mock('../lib/supabase.js', () => ({
  default: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({}),
    },
    // The signed-out door asks for listed vacancies; two listed, so the
    // "nothing available" copy and the listing copy are both exercised.
    rpc: async (name) => (name === 'public_vacancies'
      ? { data: [{ id: 'v1', label: 'Maple Street', unit: 'Unit 2', city: 'Davenport', state: 'IA', property_type: 'duplex', rent: 950, note: 'Available Sept 1' }], error: null }
      : { data: null, error: null }),
  },
  phoneLoginEmail: (p) => (String(p || '').replace(/\D+/g, '').length >= 10 ? `1${String(p).replace(/\D+/g, '')}@phone.poetech.us` : ''),
  normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
  // The door now resolves its first session through the shared primitive
  // instead of racing getSession() against a deadline (2026-08-28). The mock
  // mirrors the real contract: emit the stored session at once, then reconcile.
  readPersistedSession: () => null,
  resolveInitialSession: (emit, io) => {
    emit(io.readStored ? io.readStored() : null);
    Promise.resolve(io.getSession())
      .then((r) => { const sx = r && r.data ? r.data.session : undefined; if (sx !== undefined) emit(sx ?? null); })
      .catch(() => {});
  },
  signOut: async () => ({}),
}));

import PropertiesDoor from '../components/PropertiesDoor.jsx';

let container, root;
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; });

async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(PropertiesDoor)); });
  await act(async () => { await Promise.resolve(); });
}

const click = async (re) => {
  const el = [...container.querySelectorAll('button')].find((b) => re.test(b.textContent));
  expect(el, `no button matching ${re}`).toBeTruthy();
  await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await act(async () => { await Promise.resolve(); });
};

describe('the signed-out door', () => {
  it('carries the Poe Properties name, not PoeTech', async () => {
    await mount();
    expect(container.querySelector('h1').textContent).toBe('Poe Properties');
  });

  it('ASKS who you are before demanding a sign-in', async () => {
    await mount();
    expect(container.textContent).toMatch(/Who are you\?/i);
    const text = container.textContent;
    for (const label of ['Looking for a place', 'I live here', 'I do the work', 'I manage properties', 'I own properties']) {
      expect(text, `"${label}" is not offered`).toContain(label);
    }
    // No sign-in form until a person says which one they are.
    expect(container.querySelectorAll('input')).toHaveLength(0);
  });

  it('says out loud which choice needs no account', async () => {
    await mount();
    expect(container.textContent).toMatch(/No account needed/i);
  });

  it('an APPLICANT sees the listed units with no sign-in at all', async () => {
    await mount();
    await click(/Looking for a place/i);
    expect(container.textContent).toMatch(/Available now/i);
    expect(container.textContent).toMatch(/Maple Street/);
    expect(container.textContent).toMatch(/Davenport/);
    expect(container.textContent).toMatch(/\$950\/mo/);
    // Still no sign-in demanded of someone just looking.
    expect(container.querySelectorAll('input')).toHaveLength(0);
  });

  it('never publishes the street address to someone with no account', async () => {
    await mount();
    await click(/Looking for a place/i);
    expect(container.textContent).toMatch(/address is given by a person, not published here/i);
  });

  it('a TENANT is TOLD what is behind the door before any form appears', async () => {
    await mount();
    await click(/Your unit, work orders/i);
    // "only if they want or need to log in" — no credential fields until asked.
    expect(container.querySelectorAll('input')).toHaveLength(0);
    expect(container.textContent).toMatch(/email address .*or the cell phone number/is);
    expect(container.textContent).toMatch(/Sign in \/ create a profile/i);
  });

  it('the sign-in form appears only when the person asks for it — and names both identities', async () => {
    await mount();
    await click(/Your unit, work orders/i);
    await click(/Sign in \/ create a profile/i);
    const labels = [...container.querySelectorAll('label')].map((l) => l.textContent);
    expect(labels.some((l) => /email/i.test(l)), `email field missing; saw: ${labels.join(', ')}`).toBe(true);
    // The phone+PIN way stays REACHABLE (DR-0172 — not everyone has email).
    expect(/phone number \+ (a )?PIN/i.test(container.textContent)).toBe(true);
  });

  it('an APPLICANT can apply with NO account, and is never asked for an SSN', async () => {
    await mount();
    await click(/Looking for a place/i);
    expect(container.textContent).toMatch(/Apply — no account needed/i);
    await click(/Apply — no account needed/i);
    const labels = [...container.querySelectorAll('label')].map((l) => l.textContent).join(' | ');
    expect(labels).toMatch(/Last name/i);
    expect(labels).toMatch(/Cell phone/i);
    expect(labels).toMatch(/evicted/i);                       // the real background questions
    expect(/social security/i.test(labels), 'the public form asks for an SSN').toBe(false);
    expect(/driver.s license/i.test(labels), 'the public form asks for a licence number').toBe(false);
    expect(container.textContent).toMatch(/never ask for a Social Security number here/i);
  });

  it('the application will not send until the required fields are filled', async () => {
    await mount();
    await click(/Looking for a place/i);
    await click(/Apply — no account needed/i);
    const send = [...container.querySelectorAll('button')].find((b) => /Send my application/i.test(b.textContent));
    expect(send.disabled).toBe(true);
    expect(container.textContent).toMatch(/Still needed: \d+ required field/i);
  });
});

// =============================================================================
// A TIMEOUT IS NOT A SIGN-OUT
// =============================================================================
// Darrell, 2026-08-28, with screenshots: "it also logged me out of PoeTech...
// fix it". He had not been logged out. PoeTech was still signed in on the same
// phone one minute earlier (build 7840BFB, "SIGNED IN AS (563) 650-2416").
//
// What happened: this door raced supabase.auth.getSession() against a 5-second
// deadline and rendered SIGNED OUT when the deadline won. getSession() takes a
// CROSS-TAB auth lock, so with the PoeTech app open in another tab the lock is
// contended and the deadline wins routinely. A landlord with twelve doors was
// shown "Who are you?" — the applicant picker built for a stranger.
//
// The deadline was right. The ANSWER was wrong: "I could not find out in time"
// is not "there is no session" (DR-0076 §8), and here the unknown was rendered
// as the most alarming value available — your account is gone.
//
// The fix reuses resolveInitialSession + readPersistedSession, which the
// monolith already used for this exact hang (auth-boot-gate-hang). The fix was
// in the repo and this door did not reuse it — the P26 class.
describe('the door does not mistake a slow lock for a sign-out', () => {
  const src = () => readFileSync(
    join(process.cwd(), 'src/components/PropertiesDoor.jsx'), 'utf8',
  );

  it('no longer renders signed-out when getSession times out', () => {
    const s = src();
    // The old shape: race a deadline, then setSession(timedOut ? null : ...).
    expect(s).not.toMatch(/timedOut\s*\?\s*null/);
    expect(s).not.toMatch(/Promise\.race\(\[supabase\.auth\.getSession\(\)/);
  });

  it('reads the persisted session synchronously, which cannot hang', () => {
    const s = src();
    expect(s).toMatch(/resolveInitialSession\(/);
    expect(s).toMatch(/readStored:\s*\(\)\s*=>\s*readPersistedSession\(\)/);
    expect(s).toMatch(/getSession:\s*\(\)\s*=>\s*supabase\.auth\.getSession\(\)/);
  });

  it('signs out through the deliberate path, so it cannot be recovered back in', () => {
    const s = src();
    // supabase.auth.signOut() skips the deliberate-signout window, and the
    // transient-logout guard can then "recover" the user straight back in.
    // Strip comments first — this file EXPLAINS the wrong call by name, and a
    // gate that reads its own prose as code is the kind that cries wolf.
    const code = s.replace(/^\s*\/\/.*$/gm, '');
    expect(code).not.toMatch(/supabase\.auth\.signOut\(\)/);
    expect(code).toMatch(/signOut\(\)\.then/);
  });

  // ---------------------------------------------------------------------------
  // "login to each separate and together etc... not dependent" (Darrell, same
  // night). Both doors are one origin and therefore one Supabase session, so the
  // old Sign out revoked it and took PoeTech down with it.
  // ---------------------------------------------------------------------------
  it('leaving Poe Properties does not revoke the shared session', () => {
    const code = src().replace(/^\s*\/\/.*$/gm, '');
    // The per-door button must not call the real sign-out.
    const perDoor = code.slice(code.indexOf('Sign out of Poe Properties') - 600, code.indexOf('Sign out of Poe Properties'));
    expect(perDoor).toMatch(/leaveDoor\(DOORS\.properties\)/);
    expect(perDoor).not.toMatch(/signOut\(\)\.then/);
  });

  it('still offers a real sign-out, and it clears every door flag', () => {
    const code = src().replace(/^\s*\/\/.*$/gm, '');
    expect(code).toMatch(/enterAllDoors\(\);\s*signOut\(\)/);
  });

  it('tells someone who left that their PoeTech sign-in is untouched', () => {
    // The alarming reading — "my account is gone" — is what the screenshots
    // showed. A door you closed should say it closed.
    expect(src()).toMatch(/only forgot you|still\s*\n?\s*active/);
    expect(src()).toMatch(/Come back in/);
  });

  it('MooreDoor does not carry the same mistake', () => {
    // Gate the CLASS, not the instance (DR-0239): the same five-second
    // deadline-means-signed-out lived in the shop's door too.
    const moore = readFileSync(join(process.cwd(), 'src/components/MooreDoor.jsx'), 'utf8')
      .replace(/^\s*\/\/.*$/gm, '');
    expect(moore).toMatch(/readPersistedSession\(\)/);
    expect(moore).not.toMatch(/s\?\.timedOut \|\| !s\?\.data\?\.session/);
    expect(moore).not.toMatch(/supabase\.auth\.signOut\(\)/);
  });
});
