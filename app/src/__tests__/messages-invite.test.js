// messages-invite.test.js — proven-to-catch coverage for add-a-contact-from-
// Messages (DR-0076). Fires: non-leader adding, claim text with no link (a
// text pointing nowhere), unknown kinds; proves the sound paths carry the app
// prompt and the one-time link.
import { describe, it, expect } from 'vitest';
import {
  canAddContacts, inviteShareText, smsHref, POETECH_APP_URL,
  normalizePhone, isLikelyPhone, telHref, smsHrefTo, installPromptText,
} from '../lib/messages-invite.js';

describe('canAddContacts — invite is a leader capability', () => {
  it('a member of no led spaces cannot add', () => {
    expect(canAddContacts([])).toBe(false);
    expect(canAddContacts(undefined)).toBe(false);
  });
  it('a leader of one space can', () => {
    expect(canAddContacts([{ instanceId: 'i1', instanceType: 'family' }])).toBe(true);
  });
});

describe('inviteShareText — the text his thumb sends', () => {
  it('church invites point at the app (access lands on next sign-in)', () => {
    const out = inviteShareText({ kind: 'church', spaceName: 'COLG' });
    expect(out.ok).toBe(true);
    expect(out.text).toContain(POETECH_APP_URL);
    expect(out.text).toContain('COLG');
  });
  it('claim invites carry the one-time link', () => {
    const out = inviteShareText({ kind: 'claim', link: 'https://poetech.us/claim/abc' });
    expect(out.ok).toBe(true);
    expect(out.text).toContain('https://poetech.us/claim/abc');
  });
  it('CATCHES a claim invite with no link — never a text pointing nowhere', () => {
    expect(inviteShareText({ kind: 'claim', link: '' })).toEqual({ ok: false, text: '' });
  });
  it('CATCHES an unknown kind', () => {
    expect(inviteShareText({ kind: 'carrier-pigeon' }).ok).toBe(false);
  });
});

describe('smsHref', () => {
  it('encodes the invite into an sms: URI', () => {
    const href = smsHref('Join me on PoeTech: https://x/y?z=1');
    expect(href.startsWith('sms:?&body=')).toBe(true);
    expect(href).toContain(encodeURIComponent('https://x/y?z=1'));
  });
  it('empty text yields no href (no dead Text buttons)', () => {
    expect(smsHref('')).toBe('');
  });
});

describe('cellphone as contact data — sovereign, no gateway', () => {
  it('normalizePhone keeps a leading + then digits only', () => {
    expect(normalizePhone('+1 (217) 555-0142')).toBe('+12175550142');
    expect(normalizePhone('217.555.0142')).toBe('2175550142');
    expect(normalizePhone('  ')).toBe('');
    expect(normalizePhone('no digits here')).toBe('');
  });
  it('isLikelyPhone accepts 7–15 digits and CATCHES too-short / too-long', () => {
    expect(isLikelyPhone('217-555-0142')).toBe(true);
    expect(isLikelyPhone('+12175550142')).toBe(true);
    expect(isLikelyPhone('123')).toBe(false);          // too short
    expect(isLikelyPhone('1234567890123456')).toBe(false); // 16 digits, too long
  });
  it('telHref builds a tap-to-call URI, and none for a bad number', () => {
    expect(telHref('(217) 555-0142')).toBe('tel:2175550142');
    expect(telHref('nope')).toBe('');
  });
  it('smsHrefTo addresses a specific number when present, else recipient-less', () => {
    const to = smsHrefTo('+1 217 555 0142', 'Come join PoeTech');
    expect(to.startsWith('sms:+12175550142?&body=')).toBe(true);
    expect(to).toContain(encodeURIComponent('Come join PoeTech'));
    expect(smsHrefTo('', 'hi').startsWith('sms:?&body=')).toBe(true); // no number → still works
    expect(smsHrefTo('+12175550142', '')).toBe('');                   // no text → no dead button
  });
  it('installPromptText prompts install with the app URL and no dead link', () => {
    const out = installPromptText({ spaceName: 'family' });
    expect(out.ok).toBe(true);
    expect(out.text).toContain(POETECH_APP_URL);
    expect(out.text).toContain('family');
  });
});
