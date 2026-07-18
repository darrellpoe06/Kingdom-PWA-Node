import { describe, it, expect } from 'vitest';
import { parseInviteEmails, isValidInviteEmail, INVITE_ROLES, buildClaimLink, readClaimTokenFromUrl } from '../lib/family-invite.js';

describe('family-invite — parse a person + their family from one field', () => {
  it('splits on commas, semicolons, spaces, and newlines', () => {
    const { valid } = parseInviteEmails('a@x.com, b@x.com; c@x.com\n d@x.com');
    expect(valid).toEqual(['a@x.com', 'b@x.com', 'c@x.com', 'd@x.com']);
  });

  it('lowercases and de-duplicates', () => {
    const { valid } = parseInviteEmails('Sam@X.com sam@x.com SAM@x.com');
    expect(valid).toEqual(['sam@x.com']);
  });

  it('separates invalid fragments so the UI can report them', () => {
    const { valid, invalid } = parseInviteEmails('good@x.com notanemail also-bad');
    expect(valid).toEqual(['good@x.com']);
    expect(invalid).toEqual(['notanemail', 'also-bad']);
  });

  it('empty / null input yields empty lists, never throws', () => {
    expect(parseInviteEmails('')).toEqual({ valid: [], invalid: [] });
    expect(parseInviteEmails(null)).toEqual({ valid: [], invalid: [] });
    expect(parseInviteEmails(undefined)).toEqual({ valid: [], invalid: [] });
  });

  it('isValidInviteEmail accepts real shapes, rejects junk', () => {
    expect(isValidInviteEmail('a@b.co')).toBe(true);
    expect(isValidInviteEmail('nope')).toBe(false);
    expect(isValidInviteEmail('')).toBe(false);
    expect(isValidInviteEmail(null)).toBe(false);
  });

  it('roles never offer owner (only member/admin/viewer)', () => {
    expect(INVITE_ROLES).toEqual(['member', 'admin', 'viewer']);
    expect(INVITE_ROLES).not.toContain('owner');
  });
});

describe('family-invite — the token claim link the guardian delivers (DR-0187)', () => {
  it('builds a ?join= claim link on the given origin, token URL-encoded', () => {
    expect(buildClaimLink('abc123', 'https://poetech.us')).toBe('https://poetech.us/?join=abc123');
    // a token with URL-hostile chars is encoded, not left raw
    expect(buildClaimLink('a b/c', 'https://poetech.us')).toBe('https://poetech.us/?join=a%20b%2Fc');
  });

  it('reads the token back out of a ?join= url', () => {
    expect(readClaimTokenFromUrl('https://poetech.us/?join=abc123')).toBe('abc123');
    expect(readClaimTokenFromUrl('https://poetech.us/?join=a%20b%2Fc')).toBe('a b/c');
  });

  it('round-trips: read(build(token)) === token', () => {
    const token = 'f3a9c0deadbeef0011223344556677';
    expect(readClaimTokenFromUrl(buildClaimLink(token, 'https://poetech.us'))).toBe(token);
  });

  it('returns empty string when there is no join token, never throws', () => {
    expect(readClaimTokenFromUrl('https://poetech.us/')).toBe('');
    expect(readClaimTokenFromUrl('https://poetech.us/?other=1')).toBe('');
    expect(readClaimTokenFromUrl('not a url')).toBe('');
    expect(readClaimTokenFromUrl('')).toBe('');
    expect(readClaimTokenFromUrl(null)).toBe('');
  });
});
