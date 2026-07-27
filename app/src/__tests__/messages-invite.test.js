// messages-invite.test.js — proven-to-catch coverage for add-a-contact-from-
// Messages (DR-0076). Fires: non-leader adding, claim text with no link (a
// text pointing nowhere), unknown kinds; proves the sound paths carry the app
// prompt and the one-time link.
import { describe, it, expect } from 'vitest';
import {
  canAddContacts, inviteShareText, smsHref, POETECH_APP_URL,
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
