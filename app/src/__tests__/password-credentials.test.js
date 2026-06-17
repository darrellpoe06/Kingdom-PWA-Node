import { describe, it, expect } from 'vitest';
import { validateCredentials } from '../lib/supabase.js';

// The pure credential check behind signUpWithPassword / signInWithPassword.
// (The network calls themselves are exercised live, not unit-tested.)
describe('validateCredentials — simple email+password login', () => {
  it('rejects a missing or malformed email', () => {
    expect(validateCredentials('', 'longenough').error).toBeTruthy();
    expect(validateCredentials('nope', 'longenough').error).toBeTruthy();
  });

  it('rejects a password shorter than 8 characters', () => {
    expect(validateCredentials('a@b.com', '').error).toBeTruthy();
    expect(validateCredentials('a@b.com', 'short').error).toBeTruthy();
    expect(validateCredentials('a@b.com', '1234567').error).toBeTruthy();
  });

  it('accepts a valid email + 8+ char password and trims the email', () => {
    const ok = validateCredentials('  Person@Example.com  ', 'password1');
    expect(ok.error).toBeUndefined();
    expect(ok.email).toBe('Person@Example.com');
  });
});
