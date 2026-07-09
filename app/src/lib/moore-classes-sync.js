// =============================================================================
// moore-classes-sync — cross-device sync for Moore Divahs class sessions + seats
// =============================================================================
// Mirrors moore-orders-sync: pure model in lib/moore-divahs.js (CLASS_FORMATS,
// seatsLeft, canBook), adapters over createTableSync for class_sessions +
// class_signups (0084). The binding rule rides the shape: a signup with no
// paidAt holds NOTHING — seats derive from PAID rows only. No payment data.
// =============================================================================
import { createTableSync } from './table-sync.js';
import { newClassSession } from './moore-divahs.js';

// ---- sessions ----------------------------------------------------------------
export function toSessionRow(item, { tenantId, userId } = {}) {
  return {
    instance_id: tenantId ?? null,
    created_by:  userId ?? null,
    slug:        item.id ?? null,
    format:      item.format === 'one-on-one' ? 'one-on-one' : 'group',
    project:     item.project || null,
    date_iso:    item.dateIso || null,
    location:    item.location || null,
    location_lat: typeof item.locationLat === 'number' ? item.locationLat : null,
    location_lon: typeof item.locationLon === 'number' ? item.locationLon : null,
    price_cents: item.priceCents == null ? 4500 : item.priceCents,
    seat_cap:    item.seatCap == null ? 10 : item.seatCap,
    seed:        item.seed === true,
  };
}
export function fromSessionRow(row) {
  return { ...newClassSession({
    id:         row.slug ?? `mc-remote-${row.id}`,
    format:     row.format,
    project:    row.project,
    dateIso:    row.date_iso,
    location:   row.location,
    locationLat: row.location_lat == null ? null : Number(row.location_lat),
    locationLon: row.location_lon == null ? null : Number(row.location_lon),
    priceCents: row.price_cents,
    seatCap:    row.seat_cap,
    seed:       row.seed === true,
    createdAt:  row.created_at,
  }), remoteUuid: row.id };
}
export const mooreSessionsSync = createTableSync({
  localKey: 'mooreClassSessions',
  remoteTable: 'class_sessions',
  toRow: toSessionRow,
  fromRow: fromSessionRow,
  idOf: (item) => item.id,
});

// ---- signups (seats) ----------------------------------------------------------
export function toSignupRow(item, { tenantId, userId } = {}) {
  return {
    instance_id:   tenantId ?? null,
    created_by:    userId ?? null,
    slug:          item.id ?? null,
    session_slug:  item.sessionId ?? null,   // engine keys seats by session id
    student_name:  item.studentName ?? '',
    contact_value: item.contactValue || null,
    paid_at:       item.paidAt || null,       // NULL holds nothing
    pay_method:    item.payMethod || null,
    seed:          item.seed === true,
  };
}
export function fromSignupRow(row) {
  return {
    id:           row.slug ?? `ms-remote-${row.id}`,
    sessionId:    row.session_slug,
    studentName:  row.student_name || '',
    contactValue: row.contact_value || '',
    paidAt:       row.paid_at || null,
    payMethod:    row.pay_method || null,
    seed:         row.seed === true,
    createdAt:    row.created_at,
    remoteUuid:   row.id,
  };
}
export const mooreSignupsSync = createTableSync({
  localKey: 'mooreClassSignups',
  remoteTable: 'class_signups',
  toRow: toSignupRow,
  fromRow: fromSignupRow,
  idOf: (item) => item.id,
});
