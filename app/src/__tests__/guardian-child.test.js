// guardian-child.test.js — the guardian configures, the child requests, the
// guardian approves. Pins: configuration is clamped to safety, the gate returns
// allow/deny/needs-approval correctly, a denied/allowed action cannot become a
// request, and a child can never self-approve (resolution is a guardian action).
import { describe, it, expect } from 'vitest';
import { SETTING } from '../lib/relationships.js';
import {
  normalizeChildConfig,
  setChildCapability,
  decideChildAction,
  buildApprovalRequest,
  resolveApprovalRequest,
  childAccessSummary,
  APPROVAL_STATUS,
} from '../lib/guardian-child.js';

const CLOCK = '2026-06-29T12:00:00.000Z';

describe('normalizeChildConfig clamps to the safety ceiling', () => {
  it('reports what was rejected and only stores safe deviations', () => {
    const { config, rejected } = normalizeChildConfig({
      'purchase.any': SETTING.ALLOW,        // locked deny -> rejected
      'message.outbound': SETTING.ALLOW,    // ceiling is approval -> rejected, clamped
      'game.play': SETTING.ALLOW,           // already default allow -> not stored
      'message.family': SETTING.ALLOW,      // legit opening -> stored
    });
    expect(config['purchase.any']).toBeUndefined();      // never stored as allow
    expect(config['message.outbound']).toBe(SETTING.APPROVAL);
    expect(config['game.play']).toBeUndefined();          // equals default, not stored
    expect(config['message.family']).toBe(SETTING.ALLOW);
    const rk = rejected.map((r) => r.capability).sort();
    expect(rk).toContain('purchase.any');
    expect(rk).toContain('message.outbound');
  });
});

describe('setChildCapability', () => {
  it('opens an unlocked capability and removes it when set back to default', () => {
    let res = setChildCapability({}, 'message.family', SETTING.ALLOW);
    expect(res.config['message.family']).toBe(SETTING.ALLOW);
    res = setChildCapability(res.config, 'message.family', SETTING.APPROVAL); // back to default
    expect(res.config['message.family']).toBeUndefined();
  });
  it('refuses to change a locked capability', () => {
    const res = setChildCapability({}, 'purchase.any', SETTING.ALLOW);
    expect(res.locked).toBe(true);
    expect(res.effective).toBe(SETTING.DENY);
    expect(res.config['purchase.any']).toBeUndefined();
  });
});

describe('decideChildAction — the single gate', () => {
  it('allow / needs-approval / deny resolve correctly', () => {
    expect(decideChildAction('learn.read', {}).verdict).toBe('allow');
    expect(decideChildAction('message.outbound', { 'message.outbound': SETTING.APPROVAL }).verdict).toBe('needs-approval');
    expect(decideChildAction('purchase.any', {}).verdict).toBe('deny');
    expect(decideChildAction('not.a.cap', {}).verdict).toBe('deny');
  });
});

describe('approval queue', () => {
  it('a needs-approval action becomes a pending request', () => {
    const req = buildApprovalRequest(
      { childUserId: 'c1', childPersona: 'twin-a', capability: 'message.outbound', context: 'msg a friend' },
      { 'message.outbound': SETTING.APPROVAL },
      CLOCK,
    );
    expect(req.status).toBe('pending');
    expect(req.capability).toBe('message.outbound');
    expect(req.requested_at).toBe(CLOCK);
    expect(APPROVAL_STATUS).toContain('pending');
  });
  it('an ALREADY-ALLOWED action cannot be turned into a request', () => {
    expect(() => buildApprovalRequest({ capability: 'learn.read' }, {}, CLOCK)).toThrow(/already allowed/);
  });
  it('a DENIED/locked action cannot be requested into existence', () => {
    expect(() => buildApprovalRequest({ capability: 'purchase.any' }, {}, CLOCK)).toThrow(/cannot be requested/);
  });
  it('only a guardian resolution flips status; double-resolve is rejected', () => {
    const approved = resolveApprovalRequest({ status: 'pending' }, 'approved', CLOCK, 'ok this once');
    expect(approved.status).toBe('approved');
    expect(approved.guardian_note).toBe('ok this once');
    const denied = resolveApprovalRequest({ status: 'pending' }, 'denied', CLOCK);
    expect(denied.status).toBe('denied');
    expect(() => resolveApprovalRequest({ status: 'approved' }, 'denied', CLOCK)).toThrow(/already/);
    expect(() => resolveApprovalRequest({ status: 'pending' }, 'maybe', CLOCK)).toThrow(/approved or denied/);
  });
});

describe('childAccessSummary buckets capabilities', () => {
  it('default child: a real can-list, an approval-list, and a never-list', () => {
    const s = childAccessSummary({});
    const caps = s.can.map((c) => c.capability);
    expect(caps).toContain('learn.read');
    expect(caps).toContain('scripture.read');
    const never = s.never.map((c) => c.capability);
    expect(never).toContain('purchase.any');
    expect(never).toContain('finance.view');
    // the locked ones are flagged locked in the never bucket
    expect(s.never.find((c) => c.capability === 'purchase.any').locked).toBe(true);
  });
});
