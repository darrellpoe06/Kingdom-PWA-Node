// Autonomous fruit-loop batch 1 (DR-0057 additive-test class). Pure helpers
// the scout flagged untested: the Synology-chat message formatters + the n8n
// base/auth resolver. All pure or env-deterministic; zero source changes.
import { describe, it, expect } from 'vitest';
import {
  isChatConfigured, postToChat,
  formatFeedbackMessage, formatProjectCreatedMessage,
  formatChangeRequestMessage, formatCycleItemCompletedMessage,
} from '../lib/synology-chat.js';
import { N8N_BASE, n8nAuthHeaders } from '../lib/n8n-base.js';

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
  it('defaults to the same-origin /n8n rewrite when no override is set', () => {
    expect(N8N_BASE).toBe('/n8n');
  });

  it('n8nAuthHeaders sends nothing when unauthorized or no bearer is configured', () => {
    expect(n8nAuthHeaders(false)).toEqual({});
    expect(n8nAuthHeaders(true)).toEqual({}); // no VITE_N8N_BEARER in the test env -> deny
  });
});
