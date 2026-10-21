// =============================================================================
// The preview is one door, through that person's wall (DR-1199)
// =============================================================================
// preview.js mirrors the read policies for a "seen as" view, the way model.js
// mirrors 0150. These cases are the 0309 smoke's scenario in JavaScript: the
// same door, the same four pictures, the same people — so the SQL proof and
// the app's mirror are held to one story. PROVEN TO CATCH: each wrong sight is
// asserted absent, not merely the right ones present.
import { describe, it, expect } from 'vitest';
import { tenancyOnDoor, pickPreviewDoor, previewSeesPhoto, previewScope, previewDoorData } from '../modules/properties/preview.js';

const D = { id: 'rd', slug: 'DOOR-D', instance_id: 'i', address: '805 D St', unit: 'Apt 1', display_name: 'Door D' };
const X = { id: 'rx', slug: 'DOOR-X', instance_id: 'i', address: '806 X St', unit: 'Apt 1', display_name: 'Door X' };
const V = { id: 'tv', rental_ref: 'DOOR-D', status: 'active', created_at: '2026-01-01', tenant_name: 'T' };
const OLD = { id: 'told', rental_ref: 'DOOR-D', status: 'ended', created_at: '2025-01-01', tenant_name: 'Before' };
const P1 = { id: 'p1', rental_ref: 'rd', tenancy_id: null, kind: 'listing', caption: 'D kitchen' };
const P2 = { id: 'p2', rental_ref: 'rd', tenancy_id: null, kind: 'turn', caption: 'D turn' };
const P3 = { id: 'p3', rental_ref: 'rx', tenancy_id: null, kind: 'listing', caption: 'X kitchen' };
const P4 = { id: 'p4', rental_ref: 'rd', tenancy_id: 'tv', kind: 'move-in-condition', caption: 'T move-in' };
const PHOTOS = [P1, P2, P3, P4];
const ids = (list) => list.map((p) => p.id);

describe('the tenancy a person on the door would hold', () => {
  it('active before pending before the newest; nothing on a door nobody holds', () => {
    expect(tenancyOnDoor([OLD, V], D).id).toBe('tv');
    expect(tenancyOnDoor([OLD], D).id).toBe('told');
    expect(tenancyOnDoor([V], X)).toBe(null);
    expect(tenancyOnDoor([], null)).toBe(null);
  });
  it('the preview stands on the chosen door, else the first door somebody lives on for a tenant, else the first door', () => {
    expect(pickPreviewDoor('tenant', 'rx', [D, X], [V]).id).toBe('rx');
    expect(pickPreviewDoor('tenant', '', [X, D], [V]).id).toBe('rd');
    expect(pickPreviewDoor('field_worker', '', [X, D], [V]).id).toBe('rx');
    expect(pickPreviewDoor('tenant', 'nope', [X], [])).toBe(X);
    expect(pickPreviewDoor('tenant', '', [], [])).toBe(null);
  });
});

describe('what each face reads on door D (the 0309 smoke, in JavaScript)', () => {
  const on = (role) => previewScope(role, D, { doors: [OLD, V], rentals: [D, X], photos: PHOTOS, photoOrders: { rd: { p1: 0 }, rx: { p3: 0 } } });
  it('the tenant: their tenancy, no rentals row, the listing shot and their own picture; never the turn shot, never X', () => {
    const t = on('tenant');
    expect(ids(t.doors)).toEqual(['tv']);
    expect(t.rentals).toEqual([]);
    expect(ids(t.photos)).toEqual(['p1', 'p4']);
    expect(t.activeId).toBe('tv');
    expect(t.photoOrders).toEqual({});
  });
  it('the household member reads what the tenant reads, and is a member of that tenancy', () => {
    const h = on('household');
    expect(ids(h.photos)).toEqual(['p1', 'p4']);
    expect(h.household).toEqual([{ tenancy_id: 'tv', preview: true }]);
  });
  it('the worker: the one door, every picture filed to it, nothing of X; no tenancy list', () => {
    const w = on('field_worker');
    expect(ids(w.rentals)).toEqual(['rd']);
    expect(w.doors).toEqual([]);
    expect(ids(w.photos)).toEqual(['p1', 'p2', 'p4']);
    expect(w.photoOrders).toEqual({ rd: { p1: 0 } });
    expect(w.activeId).toBe('rd');
  });
  it('the manager: the door and its tenancies, every picture filed to it', () => {
    const m = on('manager');
    expect(ids(m.doors).sort()).toEqual(['told', 'tv']);
    expect(ids(m.photos)).toEqual(['p1', 'p2', 'p4']);
  });
  it('PROVEN TO CATCH: with the landlord\'s switch off the tenant loses the listing shot and keeps their own; the worker keeps everything', () => {
    const held = { ...D, pictures_shared_with_door: false };
    expect(ids(previewScope('tenant', held, { doors: [V], photos: PHOTOS }).photos)).toEqual(['p4']);
    expect(ids(previewScope('field_worker', held, { doors: [V], photos: PHOTOS }).photos)).toEqual(['p1', 'p2', 'p4']);
  });
  it('an archived listing shot is not a tenant\'s; a door nobody holds shows a tenant nothing of their own', () => {
    expect(previewSeesPhoto('tenant', { rental: D, tenancy: V }, { ...P1, archived_at: '2026-10-01' })).toBe(false);
    const t = previewScope('tenant', X, { doors: [V], photos: PHOTOS });
    expect(t.doors).toEqual([]);
    expect(ids(t.photos)).toEqual(['p3']);
    expect(t.activeId).toBe('rx');
  });
});

describe('the per-door read, cut the same way', () => {
  const data = { rooms: [{ id: 'r1' }], photos: PHOTOS, sharedPhotos: [P3], sharedDoors: [X], sharedOrder: { p3: 0 }, tenancies: [OLD, V], documents: [{ id: 'd1', tenancy_id: 'tv' }, { id: 'd0', tenancy_id: 'told' }], propertyNotes: [{ id: 'n1' }] };
  it('the tenant: their pictures, their tenancy, their papers, no neighbours, no private notes', () => {
    const d = previewDoorData('tenant', { rental: D, tenancy: V }, data);
    expect(ids(d.photos)).toEqual(['p1', 'p4']);
    expect(d.sharedPhotos).toEqual([]);
    expect(d.sharedDoors).toEqual([]);
    expect(ids(d.tenancies)).toEqual(['tv']);
    expect(ids(d.documents)).toEqual(['d1']);
    expect(d.propertyNotes).toEqual([]);
    expect(d.rooms).toEqual([{ id: 'r1' }]);
  });
  it('the worker: the door\'s pictures, no neighbours, no private notes; the manager keeps the notes', () => {
    expect(previewDoorData('field_worker', { rental: D, tenancy: V }, data).propertyNotes).toEqual([]);
    expect(ids(previewDoorData('field_worker', { rental: D, tenancy: V }, data).photos)).toEqual(['p1', 'p2', 'p4']);
    expect(previewDoorData('manager', { rental: D, tenancy: V }, data).propertyNotes).toEqual([{ id: 'n1' }]);
  });
});
