// Autonomous fruit-loop batch 1 (DR-0057 additive-test class). Pure helpers
// the scout flagged untested: the Synology-chat message formatters + the bridge
// auth resolver (formerly lib/n8n-base.js; renamed with DR-0617 — its absence
// is pinned in n8n-is-gone.test.js). All pure or env-deterministic.
import { describe, it, expect } from 'vitest';
import {
  isChatConfigured, postToChat,
  formatFeedbackMessage, formatProjectCreatedMessage,
  formatChangeRequestMessage, formatCycleItemCompletedMessage,
} from '../lib/synology-chat.js';
import { bridgeAuthHeaders, resolveBridgeBearer, BRIDGE_DEVICE_TOKEN_KEY } from '../lib/bridge-auth.js';

describe('synology-chat formatters', () => {
  it('feedback message: leads with first name, encodes sentiment + tab', () => {
    expect(formatFeedbackMessage({ displayName: 'Jo Poe', text: 'nice', sentiment: 'positive', activeTab: 'books' }))
      .toBe('Jo shared a win (books): nice');
    expect(formatFeedbackMessage({ displayName: 'Jo', text: 'hmm', sentiment: 'negative' }))
      .toBe('Jo flagged something to look at: hmm');
    // 2026-06-13: the no-name fallback now survives intact (the .split truncation
    // to 'A' is fixed).
    expect(formatFeedbackMessage({ text: 'x' }))
      .toBe('A family member shared a thought: x');
  });

  it('project / change-request / cycle-item messages', () => {
    expect(formatProjectCreatedMessage({ displayName: 'Dee Poe', name: 'Roof' })).toBe('Dee opened a new project: Roof');
    expect(formatChangeRequestMessage({ displayName: 'Dee', title: 'Pricing' })).toBe('Dee proposed a change to review: Pricing');
    expect(formatCycleItemCompletedMessage({ displayName: 'Dee', summary: 'Done' })).toBe('Dee marked complete: Done');
    expect(formatProjectCreatedMessage({ name: 'X' })).toBe('A family member opened a new project: X');
  });
});

describe('synology-chat transport (unconfigured in test env)', () => {
  it('isChatConfigured is false and postToChat is a safe no-op without a bot URL', async () => {
    expect(isChatConfigured()).toBe(false);
    await expect(postToChat('hello')).resolves.toEqual({ skipped: 'no-url' });
  });
});

describe('bridge auth resolver', () => {
  it('the rename kept the device key — tokens already typed on family devices still work', () => {
    expect(BRIDGE_DEVICE_TOKEN_KEY).toBe('poetech-chat-bridge-token');
  });

  it('bridgeAuthHeaders sends nothing when unauthorized or no bearer is configured', () => {
    expect(bridgeAuthHeaders(false)).toEqual({});
    expect(bridgeAuthHeaders(true)).toEqual({}); // no device token in the test env -> deny
  });

  // 2026-07-03: the bearer's PRIMARY source is the per-device bridge token
  // (never in the public bundle); the VITE_ var is a transition fallback only.
  it('the per-device bridge token authorizes, and unauthorized callers still send nothing', () => {
    const win = { localStorage: { getItem: (k) => (k === BRIDGE_DEVICE_TOKEN_KEY ? '  device-tok-9  ' : null) } };
    expect(resolveBridgeBearer(win)).toBe('device-tok-9'); // trimmed
    expect(bridgeAuthHeaders(true, win)).toEqual({ Authorization: 'Bearer device-tok-9' });
    expect(bridgeAuthHeaders(false, win)).toEqual({}); // authorization gate still holds
  });

  it('a blocked/absent localStorage falls back honestly (no token in the test env -> deny)', () => {
    const blocked = { localStorage: { getItem() { throw new Error('private mode'); } } };
    expect(resolveBridgeBearer(blocked)).toBe('');
    expect(bridgeAuthHeaders(true, blocked)).toEqual({});
    expect(resolveBridgeBearer({ localStorage: { getItem: () => null } })).toBe('');
  });
});
