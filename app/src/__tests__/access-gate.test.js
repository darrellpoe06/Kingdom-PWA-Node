import { describe, it, expect } from 'vitest';
import { isPublicChurchRoute, accessState } from '../lib/access-gate.js';

const SESSION = { user: { email: 'someone@example.com' } };

describe('access-gate — no profile, no access', () => {
  it('PROVEN-TO-CATCH: public host + checked + no session → gated (must create a profile)', () => {
    expect(accessState({ isPublicHostVal: true, authChecked: true, authSession: null })).toBe('gate');
  });

  it('public host + signed in → app', () => {
    expect(accessState({ isPublicHostVal: true, authChecked: true, authSession: SESSION })).toBe('app');
  });

  it('public host + auth not yet checked → loading (never flash the form at a signed-in user)', () => {
    expect(accessState({ isPublicHostVal: true, authChecked: false, authSession: null })).toBe('loading');
    expect(accessState({ isPublicHostVal: true, authChecked: false, authSession: SESSION })).toBe('loading');
  });

  it('private/trusted host → app regardless of session (NAS/LAN/dev unchanged)', () => {
    expect(accessState({ isPublicHostVal: false, authChecked: false, authSession: null })).toBe('app');
    expect(accessState({ isPublicHostVal: false, authChecked: true, authSession: null })).toBe('app');
    expect(accessState({ isPublicHostVal: false, authChecked: true, authSession: SESSION })).toBe('app');
  });

  it('a signed-out public visitor is NEVER shown the app', () => {
    const out = accessState({ isPublicHostVal: true, authChecked: true, authSession: null });
    expect(out).not.toBe('app');
  });
});


// ===========================================================================
// THE PUBLIC CHURCH ROUTE — a shared lesson link opens for a stranger
// ===========================================================================
// Darrell 2026-08-10, opening a shared lesson link on the live site: "why would
// anyone need to login to see the lessons?" The church door was public ONLY for
// an installed (standalone) app or the ?lovecorner=1 param, so every link pasted
// into an ordinary browser tab met the create-a-profile wall — including the
// lesson links the app had just learned how to make. A link you cannot hand to
// someone who does not have the app is not a link.
//
// These pin BOTH sides: the church opens, and the private app stays shut.
describe('the public church route — the shared link a stranger can open', () => {
  it('THE REPORT ITSELF: a shared lesson deep-link opens without a login', () => {
    expect(isPublicChurchRoute('?view=church&sub=learn&course=world-issues&lesson=wi-law-of-assumption')).toBe(true);
  });

  it('any church surface opens: the tab, a sub-tab, the study rooms', () => {
    expect(isPublicChurchRoute('?view=church')).toBe(true);
    expect(isPublicChurchRoute('?view=church&sub=eternal-algorithms')).toBe(true);
    expect(isPublicChurchRoute('?view=church&sub=scripture')).toBe(true);
    expect(isPublicChurchRoute('?view=CHURCH')).toBe(true); // case is not a lock
  });

  it('the church’s own door param still opens it', () => {
    expect(isPublicChurchRoute('?lovecorner=1')).toBe(true);
  });

  it('old church deep-links (pre-history-nav) keep working — a shared bookmark never starts demanding a login', () => {
    for (const v of ['learn', 'engagement', 'choir', 'pulpit', 'events']) {
      expect(isPublicChurchRoute(`?view=${v}`)).toBe(true);
    }
  });

  it('PROVEN-TO-CATCH: the PRIVATE app is NOT opened by this — the wall stands where it always did', () => {
    expect(isPublicChurchRoute('')).toBe(false);
    expect(isPublicChurchRoute('?view=overview')).toBe(false);
    expect(isPublicChurchRoute('?view=books&sub=transactions')).toBe(false);
    expect(isPublicChurchRoute('?view=admin')).toBe(false);
    expect(isPublicChurchRoute('?view=crm')).toBe(false);
    expect(isPublicChurchRoute('?view=projects')).toBe(false);
    expect(isPublicChurchRoute('?lovecorner=0')).toBe(false);
  });

  it('a malformed query falls back to the normal gate, never an accidental opening', () => {
    expect(isPublicChurchRoute(null)).toBe(false);
    expect(isPublicChurchRoute(undefined)).toBe(false);
  });

  it('the gate itself is unchanged — this predicate only decides who may pass it', () => {
    // accessState still says 'gate' for a signed-out public visitor; the shell
    // consults isPublicChurchRoute() alongside it. The security property that a
    // signed-out visitor never reaches the PRIVATE app is what the false cases
    // above hold.
    expect(accessState({ isPublicHostVal: true, authChecked: true, authSession: null })).toBe('gate');
  });
});
