// @vitest-environment node
//
// admin-console — proves the pure backbone of the in-app Admin surface is honest:
// the roster is identity-based and flags the current user, role meanings only
// exist for known roles, data health reads the REAL loop registry (no painted
// numbers), system facts never leak a secret, and every consequential action
// carries a preview (preview-then-execute). Grounds DR-0061 / DR-0076.
import { describe, it, expect } from 'vitest';
import {
  ADMIN_PANELS,
  isAdminPanel,
  accessRoster,
  roleMeaning,
  ROLE_MEANING,
  dataHealthSummary,
  systemFacts,
  INTERNAL_SURFACES,
  previewAction,
  PREVIEW_ACTIONS,
} from '../lib/admin-console.js';
import { ADMIN_EMAILS } from '../lib/admin-allowlist.js';

describe('panels', () => {
  it('exposes the four backend concerns, each with an icon + blurb', () => {
    expect(ADMIN_PANELS.map((p) => p.id)).toEqual(['access', 'data', 'system', 'internal']);
    for (const p of ADMIN_PANELS) {
      expect(p.icon, `${p.id} needs a UiIcon name`).toBeTruthy();
      expect(p.blurb.length).toBeGreaterThan(10);
    }
  });
  it('isAdminPanel recognizes real ids and rejects others', () => {
    expect(isAdminPanel('access')).toBe(true);
    expect(isAdminPanel('nope')).toBe(false);
  });
});

describe('access roster is identity-based and marks the current user', () => {
  it('mirrors the canonical ADMIN_EMAILS allowlist (one source of truth)', () => {
    expect(accessRoster('x@y.com').map((r) => r.email)).toEqual(ADMIN_EMAILS);
  });
  it('flags the signed-in steward, case-insensitively', () => {
    const roster = accessRoster('  DarrellPoe06@Gmail.com ');
    const me = roster.find((r) => r.isYou);
    expect(me).toBeTruthy();
    expect(me.email).toBe('darrellpoe06@gmail.com');
    expect(roster.filter((r) => r.isYou).length).toBe(1);
  });
  it('flags no one when the email is not on the list', () => {
    expect(accessRoster('stranger@example.com').some((r) => r.isYou)).toBe(false);
    expect(accessRoster(null).some((r) => r.isYou)).toBe(false);
  });
});

describe('role meaning only exists for known roles (no invented roles)', () => {
  it('maps every schema role to plain language', () => {
    for (const role of ['owner', 'admin', 'member', 'viewer', 'specialist']) {
      expect(roleMeaning(role), role).toBe(ROLE_MEANING[role]);
    }
  });
  it('normalizes case + whitespace', () => {
    expect(roleMeaning('  OWNER ')).toBe(ROLE_MEANING.owner);
  });
  it('returns null for an unknown or empty role rather than guessing', () => {
    expect(roleMeaning('superuser')).toBeNull();
    expect(roleMeaning(null)).toBeNull();
  });
});

describe('data health reads the real loop registry (no painted numbers)', () => {
  it('counts every tracked loop and summarizes attention vs fresh', () => {
    const now = Date.parse('2026-06-30T00:00:00Z');
    const s = dataHealthSummary({}, now, {});
    expect(s.total).toBeGreaterThan(0);
    expect(s.freshCount + s.attentionCount).toBe(s.total);
    expect(typeof s.allFlowing).toBe('boolean');
    expect(s.plain).toMatch(/loop|attention|updating/i);
  });
  it('an empty world has attention loops (nothing has flowed yet) — honest, not green', () => {
    const now = Date.parse('2026-06-30T00:00:00Z');
    const s = dataHealthSummary({}, now, {});
    expect(s.attentionCount).toBeGreaterThan(0);
    expect(s.allFlowing).toBe(false);
  });
  it('a fresh financial doc flips that loop to flowing (self-heals from real data)', () => {
    const now = Date.parse('2026-06-30T00:00:00Z');
    const dry = dataHealthSummary({}, now, {});
    const wet = dataHealthSummary({}, now, { financialDocAt: '2026-06-29T00:00:00Z' });
    expect(wet.freshCount).toBeGreaterThan(dry.freshCount);
  });
});

describe('system facts are plain-language and carry no secrets', () => {
  it('describes host, backend connection, and live build', () => {
    const facts = systemFacts({ isPublicHost: true, buildSha: 'abc1234', buildTime: '2026-06-30T12:00:00Z', backendReachable: true });
    expect(facts.map((f) => f.label)).toEqual(['Where this is running', 'Backend connection', 'Live build']);
    expect(facts.find((f) => f.label === 'Backend connection').value).toBe('Connected');
    expect(facts.find((f) => f.label === 'Live build').value).toBe('abc1234');
  });
  it('reflects the NAS host + disconnected backend honestly', () => {
    const facts = systemFacts({ isPublicHost: false, backendReachable: false });
    expect(facts[0].value).toMatch(/NAS/i);
    expect(facts[1].value).toMatch(/Not connected/i);
  });
  it('never emits a key/token/secret/bearer in any field', () => {
    const blob = JSON.stringify(systemFacts({ isPublicHost: true, buildSha: 'x', buildTime: null, backendReachable: true })).toLowerCase();
    for (const forbidden of ['key', 'token', 'secret', 'bearer', 'password', 'anon']) {
      expect(blob.includes(forbidden), `system facts must not mention "${forbidden}"`).toBe(false);
    }
  });
});

describe('internal surfaces carry no credentials', () => {
  it('lists real NAS surfaces with public identifiers only', () => {
    expect(INTERNAL_SURFACES.length).toBeGreaterThan(0);
    for (const s of INTERNAL_SURFACES) {
      expect(s.tailscale).toMatch(/^https?:\/\//);
      expect(s.lan).toMatch(/^https?:\/\//);
      const blob = JSON.stringify(s).toLowerCase();
      for (const forbidden of ['bearer', 'apikey', 'api_key', 'secret', 'password', 'token=']) {
        expect(blob.includes(forbidden), `${s.key} must not embed "${forbidden}"`).toBe(false);
      }
    }
  });
});

describe('preview-then-execute — every consequential action previews first', () => {
  it('exposes reload + reset actions, each with a what-line, confirm label, and preview steps', () => {
    for (const id of ['reload-latest', 'reset-seed']) {
      const a = previewAction(id);
      expect(a, id).toBeTruthy();
      expect(a.label.length).toBeGreaterThan(3);
      expect(a.what.length).toBeGreaterThan(10);
      expect(a.confirmLabel.length).toBeGreaterThan(2);
      expect(Array.isArray(a.preview) && a.preview.length).toBeTruthy();
    }
  });
  it('marks the destructive reset as danger and the reload as safe', () => {
    expect(PREVIEW_ACTIONS['reset-seed'].danger).toBe(true);
    expect(PREVIEW_ACTIONS['reload-latest'].danger).toBe(false);
  });
  it('returns null for an unknown action (no phantom actions)', () => {
    expect(previewAction('delete-everything')).toBeNull();
  });
});
