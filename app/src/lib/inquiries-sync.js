// =============================================================================
// inquiries-sync — cross-device sync for the TLC inquiries table
// =============================================================================
// Mirrors accounts-sync / debts-sync / transactions-sync. Lets Christina enter
// a TLC inquiry on her laptop and see it on her phone (and vice versa).
//
// Gated by the verify-balances walkthrough — same gate as the other numeric
// tables (see VerifyBalances.jsx). Inquiries don't carry a "balance" but they
// share the family-instance scope and the same RLS-by-membership policy, so
// the same gate keeps the seed-vs-realtime semantics consistent: the device
// that signed in first uploads its inquiries as the seed; other devices
// then read that seed before activating their own writes.
//
// Local shape (from MVP seed + addInquiry — see line ~138 + ~1324 of
// app/src/poe-financial-mvp-v28.jsx):
//   {
//     id: 'inq-1716...',          // local string slug
//     firstName: 'Maya R.',
//     contactMethod: 'phone'|'email'|'text',
//     contactValue: '...',         // form field (newer entries)
//     phone: '(217) 555-0142',     // legacy seed field
//     email: 'sarah@example.com',  // legacy seed field
//     interestArea: 'individual'|'couples'|'family'|'child'|'group'|'consultation'|'unsure',
//     hasInsurance: 'Y'|'N'|'unsure',
//     preferredProvider: 'Christina Poe'|'any'|...,
//     bestTimeToCall: 'morning'|'evening'|'lunch'|free-text,
//     source: 'church'|'referral'|'facebook'|'instagram'|'google'|'website'|'word-of-mouth'|'other',
//     sourceDetail: '...',
//     notes: '...',
//     status: 'new'|'attempting-contact'|'contacted'|'scheduled-intake'|'declined'|'lost',
//     statusHistory: [{ status, at, notes? }],
//     receivedAt: ISO,
//     links: [...]                 // CONNECTED-CONTEXT.md per-entity links
//   }
//
// Remote shape (schema v1.2 inquiries row, renamed tenant_id->instance_id in v2.1):
//   {
//     id (uuid), instance_id, created_by, created_at, updated_at,
//     slug, first_name, contact_method, contact_value,
//     interest_area, has_insurance, preferred_provider, best_time_to_call,
//     source, source_detail, notes,
//     status, status_history (jsonb), conversation_log (jsonb),
//     received_at
//   }
//
// HIPAA-adjacent note: per LEGAL-PRIVACY-BOUNDARY.md + ECOSYSTEM-PARTICIPANTS.md,
// the inquiries table tracks PRE-INTAKE leads only — non-PHI. Once an inquiry
// is scheduled into Acuity, PHI lives in Acuity, not here. The sync therefore
// stays inside the same instance-scoped RLS that protects every other domain
// row — no special encryption needed at this layer.
// =============================================================================
import { createTableSync } from './table-sync.js';

const ALLOWED_STATUSES = new Set([
  'new',
  'attempting-contact',
  'contacted',
  'scheduled-intake',
  'declined',
  'lost',
]);

function normalizeStatus(s) {
  return ALLOWED_STATUSES.has(s) ? s : 'new';
}

function pickContactValue(item) {
  // Prefer the form's contactValue (newer entries). Fall back to the
  // legacy seed shape that stashed the phone or email under those keys.
  if (item.contactValue) return item.contactValue;
  if (item.contactMethod === 'email') return item.email ?? null;
  if (item.contactMethod === 'phone' || item.contactMethod === 'text') return item.phone ?? null;
  return item.phone ?? item.email ?? null;
}

export const inquiriesSync = createTableSync({
  localKey: 'inquiries',
  remoteTable: 'inquiries',

  toRow(item, { tenantId, userId }) {
    return {
      instance_id:        tenantId,
      created_by:         userId,
      slug:               item.id ?? null,
      first_name:         item.firstName ?? '',
      contact_method:     item.contactMethod ?? 'phone',
      contact_value:      pickContactValue(item),
      interest_area:      item.interestArea ?? 'unsure',
      has_insurance:      item.hasInsurance ?? 'unsure',
      preferred_provider: item.preferredProvider ?? 'any',
      best_time_to_call:  item.bestTimeToCall ?? 'anytime',
      source:             item.source ?? 'other',
      source_detail:      item.sourceDetail ?? null,
      notes:              item.notes ?? null,
      status:             normalizeStatus(item.status),
      status_history:     Array.isArray(item.statusHistory) ? item.statusHistory : [],
      conversation_log:   Array.isArray(item.conversationLog) ? item.conversationLog : [],
      received_at:        item.receivedAt ?? new Date().toISOString(),
    };
  },

  fromRow(row) {
    // Re-attach legacy email/phone keys so the existing render code (which
    // sometimes reads inq.phone or inq.email directly — see seed line ~139)
    // works unchanged for rows that came back from the server.
    const cv = row.contact_value;
    const isEmail = row.contact_method === 'email';
    return {
      id:                row.slug ?? `inq-remote-${row.id}`,
      remoteUuid:        row.id,
      tenantId:          row.instance_id,
      firstName:         row.first_name,
      contactMethod:     row.contact_method,
      contactValue:      cv,
      phone:             isEmail ? null : cv,
      email:             isEmail ? cv : null,
      interestArea:      row.interest_area,
      hasInsurance:      row.has_insurance,
      preferredProvider: row.preferred_provider,
      bestTimeToCall:    row.best_time_to_call,
      source:            row.source,
      sourceDetail:      row.source_detail,
      notes:             row.notes,
      status:            row.status,
      statusHistory:     Array.isArray(row.status_history) ? row.status_history : [],
      conversationLog:   Array.isArray(row.conversation_log) ? row.conversation_log : [],
      receivedAt:        row.received_at,
      updatedAt:         row.updated_at,
      createdAt:         row.created_at,
    };
  },

  idOf(item) {
    return item.id; // the local slug; dedup at initialSync time
  },
});
