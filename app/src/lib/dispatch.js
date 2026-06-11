// =============================================================================
// dispatch — pure helpers for sending rental work to a 1099 worker
// =============================================================================
// The dispatch loop (BUSINESS-PROCESS-CONNECTIONS.md: every visible surface
// is one end of a connection; the other end must be wired): a maintenance
// need becomes an incident (work order) → a worker is assigned from
// Books · 1099s → the job rides out in one tap as a text or call → done
// comes back as a resolve. Every hop is timestamped in the incident
// lifecycle log, so the quality-control trail (who was sent, when, how long
// to done) accumulates as structured data the family can review later.

export function normalizePhone(raw) {
  if (!raw) return '';
  return String(raw).replace(/[^\d+]/g, '');
}

export function telHref(phone) {
  const p = normalizePhone(phone);
  return p ? `tel:${p}` : '';
}

// `sms:NUMBER?&body=` is the cross-platform form (iOS accepts ?&body=,
// Android accepts both). Body is fully URI-encoded.
export function smsHref(phone, body) {
  const p = normalizePhone(phone);
  if (!p) return '';
  return body ? `sms:${p}?&body=${encodeURIComponent(body)}` : `sms:${p}`;
}

// The text a worker receives. Plain and complete — what / where / how bad /
// when it's due — so the job is answerable from the phone without a
// follow-up call (ANXIETY-CLARITY-PRINCIPLE: every surface answers
// what / when / why / how).
export function buildDispatchMessage({
  propertyName = '',
  address = '',
  city = '',
  state = '',
  zip = '',
  description = '',
  category = '',
  urgencyLabel = '',
  dueDate = '',
  notes = '',
} = {}) {
  const where = [address || propertyName, city, state, zip].filter(Boolean).join(', ');
  const lines = [
    `Work order — ${propertyName || address || 'property'}`,
    where ? `Where: ${where}` : '',
    description ? `Job: ${category ? `${category} — ` : ''}${description}` : '',
    urgencyLabel
      ? `Priority: ${urgencyLabel}${dueDate ? ` (due ${dueDate})` : ''}`
      : (dueDate ? `Due: ${dueDate}` : ''),
    notes ? `Notes: ${notes}` : '',
    'Reply YES to confirm, or call back with questions.',
  ].filter(Boolean);
  return lines.join('\n');
}
