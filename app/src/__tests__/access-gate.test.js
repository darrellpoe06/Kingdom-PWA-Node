import { describe, it, expect } from 'vitest';
import { accessState } from '../lib/access-gate.js';

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
