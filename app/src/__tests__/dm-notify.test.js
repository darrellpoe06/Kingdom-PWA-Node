// =============================================================================
// dm-notify — the doorbell rings honestly (2026-08-22)
// =============================================================================
// Darrell: "do the users get notifications?" — measured no; this layer adds
// the tab-title unread badge and the hidden-tab browser Notification. These
// tests pin the pure decision (never ring on shrink, never while watching,
// never without permission), the idempotent title badge, and the wiring.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { notifyDecision, applyTitleBadge } from '../lib/dm-notify.js';

const HERE = dirname(fileURLToPath(import.meta.url));

describe('notifyDecision — ring only on growth, hidden, and permission', () => {
  it('rings when unread grew while hidden with permission granted', () => {
    expect(notifyDecision(0, 1, { hidden: true, permission: 'granted' }).notify).toBe(true);
  });
  it('never rings while the reader is watching (visible)', () => {
    expect(notifyDecision(0, 3, { hidden: false, permission: 'granted' }).notify).toBe(false);
  });
  it('never rings without permission, and never on shrink or no-change', () => {
    expect(notifyDecision(0, 1, { hidden: true, permission: 'default' }).notify).toBe(false);
    expect(notifyDecision(2, 1, { hidden: true, permission: 'granted' }).notify).toBe(false);
    expect(notifyDecision(2, 2, { hidden: true, permission: 'granted' }).notify).toBe(false);
  });
  it('the title badge states the count, and clears at zero', () => {
    expect(notifyDecision(0, 2, {}).titleBadge).toBe('(2) ');
    expect(notifyDecision(2, 0, {}).titleBadge).toBe('');
  });
});

describe('applyTitleBadge — idempotent, always restorable', () => {
  it('prefixes, re-prefixes without stacking, and restores the clean title', () => {
    const doc = { title: 'PoeTech' };
    applyTitleBadge(doc, '(1) ');
    expect(doc.title).toBe('(1) PoeTech');
    applyTitleBadge(doc, '(4) ');
    expect(doc.title).toBe('(4) PoeTech');
    applyTitleBadge(doc, '');
    expect(doc.title).toBe('PoeTech');
  });
  it('adopts an already-badged title without doubling the badge', () => {
    const doc = { title: '(3) PoeTech' };
    applyTitleBadge(doc, '(5) ');
    expect(doc.title).toBe('(5) PoeTech');
  });
});

describe('wiring — the doorbell is mounted app-wide and asked for by a tap', () => {
  it('main.jsx starts the watcher at boot (any tab, not only Messages)', () => {
    const src = readFileSync(join(HERE, '..', 'main.jsx'), 'utf8');
    expect(src).toMatch(/startDmNotifications\(window\)/);
  });
  it('DirectMessages offers the one-tap grant only while permission is undecided', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'DirectMessages.jsx'), 'utf8');
    expect(src).toMatch(/notifPerm === 'default'/);
    expect(src).toMatch(/requestDmNotificationPermission/);
  });
  it('the hidden-tab heartbeat exists — a sick stream cannot silence the doorbell', () => {
    const src = readFileSync(join(HERE, '..', 'lib', 'dm-notify.js'), 'utf8');
    expect(src).toMatch(/HIDDEN_HEARTBEAT_MS = 60000/);
    expect(src).toMatch(/visibilityState === 'hidden'\) stopSub\?\.refresh\?\.\(\)/);
  });
});
