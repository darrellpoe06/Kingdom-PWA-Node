import { describe, it, expect } from 'vitest';
import {
  CANONICAL_APP_ORIGIN, APP_BASE_PATH,
  appJoinUrl, appJoinUrlDisplay, inviteMessage,
} from '../lib/app-share.js';

describe('app-share — canonical join link (single source for the QR + invites)', () => {
  it('encodes the PUBLIC production URL, not a preview/localhost origin', () => {
    // The QR is scanned from someone else's phone, so it must always be prod.
    expect(appJoinUrl()).toBe('https://poetech.us/poetech-app/?join=1');
    expect(appJoinUrl().startsWith('https://')).toBe(true);
  });

  it('reaches the platform-aware install boot (?join=1) under the manifest scope', () => {
    expect(appJoinUrl()).toContain('?join=1');
    expect(appJoinUrl()).toContain(APP_BASE_PATH);
    expect(APP_BASE_PATH).toBe('/poetech-app/'); // must match manifest scope/start_url
  });

  it('display form drops the scheme but keeps the address', () => {
    expect(appJoinUrlDisplay()).toBe('poetech.us/poetech-app/?join=1');
    expect(appJoinUrlDisplay()).not.toContain('https://');
  });

  it('constants stay consistent with the built URL', () => {
    expect(appJoinUrl()).toBe(`${CANONICAL_APP_ORIGIN}${APP_BASE_PATH}?join=1`);
  });

  it('inviteMessage greets by name and carries the canonical link', () => {
    const msg = inviteMessage('Bishop Gwin');
    expect(msg).toContain('Hi Bishop Gwin,');
    expect(msg).toContain(appJoinUrl());
    expect(msg).toContain('— Darrell & Christina, PoeTech');
  });

  it('inviteMessage falls back to a warm generic greeting when no name', () => {
    expect(inviteMessage('')).toContain('Hi there,');
    expect(inviteMessage(null)).toContain('Hi there,');
    expect(inviteMessage('   ')).toContain('Hi there,');
  });
});
