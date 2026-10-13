// =============================================================================
// phone + PIN credentials — the pure layer behind phone-number sign-in (DR-0172)
// =============================================================================
// Darrell 2026-07-11: "can we allow a pin to begin instead of an email ...
// everyone doesn't have an email so cellphone and pin." The phone becomes the
// identity, the PIN the credential, reusing the email+password path via a
// synthetic never-delivered identifier. These are the pure validators; the
// network calls (signUp/signIn) are exercised live, like the email path.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  normalizePhone, phoneLoginEmail, validatePhonePin, PHONE_LOGIN_DOMAIN,
} from '../lib/supabase.js';

describe('normalizePhone', () => {
  it('normalizes a US 10-digit number to 11 digits (leading 1)', () => {
    expect(normalizePhone('(217) 555-0143')).toBe('12175550143');
    expect(normalizePhone('217-555-0143')).toBe('12175550143');
    expect(normalizePhone('2175550143')).toBe('12175550143');
  });
  it('keeps an already country-coded number', () => {
    expect(normalizePhone('+1 217 555 0143')).toBe('12175550143');
    expect(normalizePhone('442071838750')).toBe('442071838750'); // UK, 12 digits
  });
  it('rejects too-short / too-long as empty (not a real number)', () => {
    expect(normalizePhone('555')).toBe('');
    expect(normalizePhone('12345')).toBe('');
    expect(normalizePhone('1234567890123456')).toBe(''); // 16 digits
    expect(normalizePhone('')).toBe('');
    expect(normalizePhone(null)).toBe('');
  });
});

describe('phoneLoginEmail — the synthetic Supabase identifier', () => {
  it('maps a valid phone to <digits>@<domain>', () => {
    expect(phoneLoginEmail('(217) 555-0143')).toBe(`12175550143@${PHONE_LOGIN_DOMAIN}`);
  });
  it('is a well-formed email shape (Supabase requires one)', () => {
    expect(phoneLoginEmail('2175550143')).toMatch(/^\d+@[a-z.]+$/);
  });
  it('empty in → empty out (never a malformed identifier)', () => {
    expect(phoneLoginEmail('123')).toBe('');
    expect(phoneLoginEmail('')).toBe('');
  });
  it('the domain is the never-delivered constant (no real mailbox / reset vector)', () => {
    expect(PHONE_LOGIN_DOMAIN).toBe('phone.poetech.us');
  });
});

describe('validatePhonePin', () => {
  it('accepts a valid phone + 6-digit PIN and returns the synthetic email', () => {
    const ok = validatePhonePin('(217) 555-0143', '135790');
    expect(ok.error).toBeUndefined();
    expect(ok.email).toBe(`12175550143@${PHONE_LOGIN_DOMAIN}`);
    expect(ok.pin).toBe('135790');
  });
  it('rejects a bad phone number', () => {
    expect(validatePhonePin('555', '135790').error).toBeTruthy();
    expect(validatePhonePin('', '135790').error).toBeTruthy();
  });
  it('rejects a PIN that is not exactly 6 digits', () => {
    expect(validatePhonePin('2175550143', '').error).toBeTruthy();
    expect(validatePhonePin('2175550143', '1234').error).toBeTruthy();   // too short
    expect(validatePhonePin('2175550143', '1234567').error).toBeTruthy(); // too long
    expect(validatePhonePin('2175550143', '12ab56').error).toBeTruthy();  // non-numeric
  });
  it('proven-to-catch: a 6-letter "PIN" is rejected (digits only)', () => {
    expect(validatePhonePin('2175550143', 'abcdef').error).toBeTruthy();
  });
});
