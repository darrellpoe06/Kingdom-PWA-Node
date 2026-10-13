// =============================================================================
// phone-email-promotion — the DR-0172 follow-up, BUILT not deferred (2026-07-13).
// =============================================================================
// A phone+PIN user can attach a real, verified login email to the SAME account.
// This is NOT a merge: the user id never changes, so the phone-number → unique-ID
// mapping is preserved. These pure helpers back the "Add email" affordance and
// the friendly identity label (no more raw <digits>@phone.poetech.us on screen).
import { describe, it, expect } from 'vitest';
import {
  isSyntheticPhoneEmail, isPhoneLoginSession, formatPhoneDisplay, identityLabel,
  promoteEmailToLogin, PHONE_LOGIN_DOMAIN,
} from '../lib/supabase.js';

const phoneSession = (over = {}) => ({
  user: {
    id: 'uid-1',
    email: over.email ?? `14472209780@${PHONE_LOGIN_DOMAIN}`,
    user_metadata: over.user_metadata ?? { login_method: 'phone-pin', phone: '14472209780' },
  },
});

describe('isSyntheticPhoneEmail', () => {
  it('is true only for the synthetic placeholder domain', () => {
    expect(isSyntheticPhoneEmail(`14472209780@${PHONE_LOGIN_DOMAIN}`)).toBe(true);
    expect(isSyntheticPhoneEmail('real@gmail.com')).toBe(false);
    expect(isSyntheticPhoneEmail(undefined)).toBe(false);
  });
});

describe('isPhoneLoginSession', () => {
  it('detects a phone account by login_method OR by synthetic email', () => {
    expect(isPhoneLoginSession(phoneSession())).toBe(true);
    expect(isPhoneLoginSession(phoneSession({ user_metadata: {} }))).toBe(true); // still synthetic email
    expect(isPhoneLoginSession(phoneSession({ email: 'real@x.com', user_metadata: { login_method: 'phone-pin' } }))).toBe(true);
  });
  it('is false for an email account and for no session', () => {
    expect(isPhoneLoginSession({ user: { email: 'a@b.com', user_metadata: {} } })).toBe(false);
    expect(isPhoneLoginSession(null)).toBe(false);
  });
});

describe('formatPhoneDisplay', () => {
  it('formats a US number (10-digit and 11-digit lead-1) as (xxx) xxx-xxxx', () => {
    expect(formatPhoneDisplay('4472209780')).toBe('(447) 220-9780');
    expect(formatPhoneDisplay('14472209780')).toBe('(447) 220-9780');
    expect(formatPhoneDisplay('1 (447) 220-9780')).toBe('(447) 220-9780');
  });
  it('leaves a non-standard value untouched and never throws', () => {
    expect(formatPhoneDisplay('12345')).toBe('12345');
    expect(formatPhoneDisplay(null)).toBe('');
  });
});

describe('identityLabel — no raw synthetic address ever shown', () => {
  it('shows a phone user their formatted number, not the placeholder email', () => {
    expect(identityLabel(phoneSession())).toBe('(447) 220-9780');
    // Falls back to the email local-part digits when metadata.phone is absent.
    expect(identityLabel(phoneSession({ user_metadata: { login_method: 'phone-pin' } }))).toBe('(447) 220-9780');
  });
  it('shows an email user their email', () => {
    expect(identityLabel({ user: { email: 'coach@gmail.com', user_metadata: {} } })).toBe('coach@gmail.com');
  });
  it('is empty for no session', () => {
    expect(identityLabel(null)).toBe('');
  });
});

describe('promoteEmailToLogin — validation (rejects before any network call)', () => {
  it('rejects an empty or malformed email', async () => {
    expect((await promoteEmailToLogin('')).error).toBeTruthy();
    expect((await promoteEmailToLogin('nope')).error).toBeTruthy();
  });
  it('rejects the synthetic placeholder address — a phone user must enter a REAL email', async () => {
    const res = await promoteEmailToLogin(`14472209780@${PHONE_LOGIN_DOMAIN}`);
    expect(res.error).toBeTruthy();
    expect(res.error.message).toMatch(/real email/i);
  });
});
