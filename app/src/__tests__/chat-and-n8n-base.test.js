// Autonomous fruit-loop batch 1 (DR-0057 additive-test class). Pure helpers
// the scout flagged untested: the Synology-chat message formatters + the n8n
// base/auth resolver. All pure or env-deterministic; zero source changes.
import { describe, it, expect } from 'vitest';
import {
  isChatConfigured, postToChat,
  formatFeedbackMessage, formatProjectCreatedMessage,
  formatChangeRequestMessage, formatCycleItemCompletedMessage,
} from '../lib/synology-chat.js';
import { N8N_BASE, n8nAuthHeaders, resolveN8nBearer, N8N_DEVICE_TOKEN_KEY } from '../lib/n8n-base.js';

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

describe('n8n base resolver', () => {
  it('defaults to EMPTY — n8n is RETIRED (DR-0218, 2026-07-30); no app code calls it', () => {
    expect(N8N_BASE).toBe('');
  });
  it.skip('LEGACY (pre-retirement): defaulted to the same-origin /n8n proxy', () => {
    // 2026-07-05: production moved to Cloudflare Pages, whose Pages Function
    // (app/functions/n8n/[[path]].js) proxies the Funnel same-origin. The
    // browser must NEVER call the Funnel cross-origin — it throttles those
    // with 503s before the request reaches n8n. (The 2026-06-17 Funnel-direct
    // era existed only because Vercel's router couldn't TLS-handshake to
    // *.ts.net; that constraint left with Vercel.)
    expect(N8N_BASE).toBe('/n8n');
  });

  it('n8nAuthHeaders sends nothing when unauthorized or no bearer is configured', () => {
    expect(n8nAuthHeaders(false)).toEqual({});
    expect(n8nAuthHeaders(true)).toEqual({}); // no VITE_N8N_BEARER in the test env -> deny
  });

  // 2026-07-03: the bearer's PRIMARY source is the per-device bridge token
  // (never in the public bundle); the VITE_ var is a transition fallback only.
  it('the per-device bridge token authorizes, and unauthorized callers still send nothing', () => {
    const win = { localStorage: { getItem: (k) => (k === N8N_DEVICE_TOKEN_KEY ? '  device-tok-9  ' : null) } };
    expect(resolveN8nBearer(win)).toBe('device-tok-9'); // trimmed
    expect(n8nAuthHeaders(true, win)).toEqual({ Authorization: 'Bearer device-tok-9' });
    expect(n8nAuthHeaders(false, win)).toEqual({}); // authorization gate still holds
  });

  it('a blocked/absent localStorage falls back honestly (no token in the test env -> deny)', () => {
    const blocked = { localStorage: { getItem() { throw new Error('private mode'); } } };
    expect(resolveN8nBearer(blocked)).toBe('');
    expect(n8nAuthHeaders(true, blocked)).toEqual({});
    expect(resolveN8nBearer({ localStorage: { getItem: () => null } })).toBe('');
  });
});
