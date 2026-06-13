// Data-integrity coverage — three exported pure functions the app leans on but
// the 2026-06-11 audit left untested: the auto-link engine (cross-entity
// wiring), the external-profile scaffolding (contractor/tenant portal data),
// and the rentals vocab mappers (the lossy status/property-type round-trip the
// PR #24 review flagged). Continued autonomous coverage work (DR-0056 class).
import { describe, it, expect } from 'vitest';
import { findRelatedAuto, ensureExternalProfile } from '../poe-financial-mvp-v28.jsx';
import { toRemotePropertyType, toRemoteStatus, fromRemoteStatus } from '../lib/rentals-sync.js';

describe('findRelatedAuto', () => {
  it('returns [] for a null item', () => {
    expect(findRelatedAuto(null, 'incident', {})).toEqual([]);
  });

  it('links incidents on the same property and never links an item to itself', () => {
    const data = { incidents: [
      { id: 'i1', linkedTo: { type: 'rental', id: 'r1' } },
      { id: 'i2', linkedTo: { type: 'rental', id: 'r1' } },
      { id: 'i3', linkedTo: { type: 'rental', id: 'r2' } },
    ] };
    const out = findRelatedAuto({ id: 'i1', linkedTo: { type: 'rental', id: 'r1' } }, 'incident', data);
    expect(out).toHaveLength(1);            // i2 only — not i1 (self), not i3 (other property)
    expect(out[0].toEntityId).toBe('i2');
    expect(out[0].kind).toBe('same-property');
  });

  it('links same-caller voicemails, same-source inquiries, same-view feedback', () => {
    expect(findRelatedAuto({ id: 'c1', caller: '555' }, 'inbound',
      { inbound: [{ id: 'c1', caller: '555' }, { id: 'c2', caller: '555' }, { id: 'c3', caller: '999' }] })).toHaveLength(1);
    expect(findRelatedAuto({ id: 'q1', source: 'church' }, 'inquiry',
      { inquiries: [{ id: 'q1', source: 'church' }, { id: 'q2', source: 'church' }] })).toHaveLength(1);
    expect(findRelatedAuto({ id: 'f1', currentView: 'books' }, 'feedback',
      { feedback: [{ id: 'f1', currentView: 'books' }, { id: 'f2', currentView: 'books' }] })).toHaveLength(1);
  });

  it('caps results at maxResults', () => {
    const incidents = Array.from({ length: 8 }, (_, i) => ({ id: `i${i}`, linkedTo: { type: 'rental', id: 'r1' } }));
    const out = findRelatedAuto({ id: 'new', linkedTo: { type: 'rental', id: 'r1' } }, 'incident', { incidents }, 3);
    expect(out).toHaveLength(3);
  });
});

describe('ensureExternalProfile', () => {
  it('attaches tenant permissions and pulls fallback contact fields', () => {
    const out = ensureExternalProfile({ id: 'r1', tenantName: 'Jo', tenantEmail: 'jo@x.com', tenantPhone: '555' }, 'tenant');
    expect(out.externalProfile.permissions).toContain('submit-maintenance-request');
    expect(out.externalProfile.name).toBe('Jo');
    expect(out.externalProfile.email).toBe('jo@x.com');
    expect(out.externalProfile.inviteStatus).toBe('not-invited');
  });

  it('attaches contractor permissions for type contractor', () => {
    const out = ensureExternalProfile({ id: 'c1', name: 'Ace' }, 'contractor');
    expect(out.externalProfile.permissions).toContain('view-assigned-projects');
  });

  it('is idempotent — an item that already has a profile is returned unchanged', () => {
    const item = { id: 'r1', externalProfile: { permissions: ['custom'], inviteStatus: 'invited' } };
    expect(ensureExternalProfile(item, 'tenant')).toBe(item);
  });

  it('passes a null item straight through', () => {
    expect(ensureExternalProfile(null, 'tenant')).toBe(null);
  });
});

describe('rentals vocab mappers', () => {
  it('toRemotePropertyType keeps known types and falls back to single-family', () => {
    expect(toRemotePropertyType('duplex')).toBe('duplex');
    expect(toRemotePropertyType('primary-home')).toBe('primary-home');
    expect(toRemotePropertyType('mansion')).toBe('single-family');
    expect(toRemotePropertyType(undefined)).toBe('single-family');
  });

  it('status mappers keep real values, translate legacy occupancy, default to paying', () => {
    expect(toRemoteStatus('late')).toBe('late');
    expect(toRemoteStatus('owner-occupied')).toBe('owner-occupied');
    expect(toRemoteStatus('garbage')).toBe('paying');
    expect(fromRemoteStatus('occupied')).toBe('paying');     // legacy v2.2 occupancy
    expect(fromRemoteStatus('off-market')).toBe('unrented'); // legacy
    expect(fromRemoteStatus('vacant')).toBe('vacant');
  });

  it('a real local status survives the remote round-trip', () => {
    for (const s of ['paying', 'late', 'vacant', 'rehab', 'sold', 'owner-occupied']) {
      expect(fromRemoteStatus(toRemoteStatus(s))).toBe(s);
    }
  });
});
