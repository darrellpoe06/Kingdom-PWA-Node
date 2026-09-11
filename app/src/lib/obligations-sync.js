// =============================================================================
// obligations-sync — the seam for the obligation ledger (0202, DR-0358)
// =============================================================================
// Read goes through RLS, not through a filter the client can forget: the books
// role wall (0082/0100) already denies 'child' and 'assistant', and 0202's
// policies say the same thing for these three tables. Every write goes through
// a SECURITY DEFINER function that requires owner or admin.
//
// Settlements are APPEND-ONLY at the database, so there is deliberately no
// update and no delete here. Correcting a payment means recording the truth,
// not editing the past.
// =============================================================================
import supabase from './supabase.js';
import { validateObligation, validateSettlement, toCents } from './obligations.js';

export const TIMEOUT_MS = 20000;

function withTimeout(promise, ms, what) {
  let t;
  const timer = new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${what} timed out after ${ms} ms`)), ms); });
  return Promise.race([promise, timer]).finally(() => clearTimeout(t));
}
function message(error) {
  const raw = String((error && (error.message || error.msg)) || error || '').replace(/^.*?:\s*/, '');
  return raw || 'That did not go through.';
}
function fail(reason, msg) { return { ok: false, reason, message: msg }; }

const fromRow = (r, settlements = [], documents = []) => ({
  id: r.id,
  instanceId: r.instance_id,
  direction: r.direction,
  counterparty: r.counterparty,
  description: r.description,
  amountCents: Number(r.amount_cents) || 0,
  terms: r.terms,
  issuedOn: r.issued_on || '',
  dueDate: r.due_date || '',
  lifecycle: r.lifecycle || 'open',
  lifecycleNote: r.lifecycle_note || '',
  priority: Number(r.priority) || 2,
  product: r.product || '',
  place: r.place || '',
  entitySlug: r.entity_slug || '',
  externalRef: r.external_ref || '',
  note: r.note || '',
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  settlements,
  documents,
});

const fromSettlement = (s) => ({
  id: s.id,
  amountCents: Number(s.amount_cents) || 0,
  paidOn: s.paid_on || '',
  method: s.method || '',
  transactionId: s.transaction_id || null,
  note: s.note || '',
  createdAt: s.created_at,
});

const fromAttachment = (d) => ({
  id: d.id, documentId: d.document_id, role: d.role, addedAt: d.added_at,
});

/**
 * The whole ledger for these books: every obligation with its settlements and
 * its paper, so status and aging can be worked out without a second trip.
 */
export async function listObligations(instanceId = null) {
  try {
    let q = supabase.from('obligations')
      .select('id, instance_id, direction, counterparty, description, amount_cents, terms, issued_on, due_date, lifecycle, lifecycle_note, priority, product, place, entity_slug, external_ref, note, created_at, updated_at')
      .order('due_date', { ascending: true });
    if (instanceId) q = q.eq('instance_id', instanceId);
    const { data, error } = await withTimeout(q, TIMEOUT_MS, 'reading the ledger');
    if (error) return { ok: false, reason: 'rpc-error', message: message(error), rows: [] };
    const rows = data || [];
    if (!rows.length) return { ok: true, rows: [] };
    const ids = rows.map((r) => r.id);

    const [{ data: sets }, { data: docs }] = await Promise.all([
      withTimeout(supabase.from('obligation_settlements')
        .select('id, obligation_id, amount_cents, paid_on, method, transaction_id, note, created_at')
        .in('obligation_id', ids).order('paid_on', { ascending: true }), TIMEOUT_MS, 'reading the payments'),
      withTimeout(supabase.from('obligation_documents')
        .select('id, obligation_id, document_id, role, added_at')
        .in('obligation_id', ids), TIMEOUT_MS, 'reading the paper'),
    ]);

    const byObligation = (list, key) => {
      const map = {};
      for (const x of list || []) (map[x[key]] = map[x[key]] || []).push(x);
      return map;
    };
    const setMap = byObligation(sets, 'obligation_id');
    const docMap = byObligation(docs, 'obligation_id');
    return { ok: true, rows: rows.map((r) => fromRow(r, (setMap[r.id] || []).map(fromSettlement), (docMap[r.id] || []).map(fromAttachment))) };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e), rows: [] };
  }
}

/** Record a thing that is owed, in either direction. Refused locally first. */
export async function recordObligation(obligation, instanceId = null) {
  const payload = { ...obligation, amountCents: Math.round(Number(obligation.amountCents || toCents(obligation.amount))) };
  const errors = validateObligation(payload);
  if (errors.length) return { ok: false, reason: 'invalid', errors, message: errors[0] };
  try {
    const { data, error } = await withTimeout(
      supabase.rpc('obligation_record', { payload_in: payload, instance_in: instanceId }),
      TIMEOUT_MS, 'recording the obligation');
    if (error) return { ok: false, reason: 'rpc-error', message: message(error) };
    return { ok: true, row: fromRow(data) };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e) };
  }
}

/** Money actually moved. Append-only: this never edits a prior payment. */
export async function settleObligation(obligationId, settlement, obligation = null) {
  if (!obligationId) return fail('no-obligation', 'Nothing to settle.');
  const amountCents = Math.round(Number(settlement.amountCents || toCents(settlement.amount)));
  const errors = validateSettlement({ ...settlement, amountCents }, obligation);
  if (errors.length) return { ok: false, reason: 'invalid', errors, message: errors[0] };
  try {
    const { data, error } = await withTimeout(
      supabase.rpc('obligation_settle', {
        obligation_id_in: obligationId,
        amount_cents_in: amountCents,
        paid_on_in: settlement.paidOn,
        method_in: settlement.method || null,
        transaction_id_in: settlement.transactionId || null,
        note_in: settlement.note || null,
      }), TIMEOUT_MS, 'recording the payment');
    if (error) return { ok: false, reason: 'rpc-error', message: message(error) };
    return { ok: true, result: data };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e) };
  }
}

/** Void it or write it off — never a delete, and never without a reason. */
export async function setObligationLifecycle(obligationId, lifecycle, note = '') {
  if (!obligationId) return fail('no-obligation', 'Nothing to change.');
  if (lifecycle !== 'open' && String(note || '').trim().length < 3) {
    return fail('no-reason', 'Say why in a few words. A write-off without a reason is a hole in the record.');
  }
  try {
    const { data, error } = await withTimeout(
      supabase.rpc('obligation_set_lifecycle', { obligation_id_in: obligationId, lifecycle_in: lifecycle, note_in: note || null }),
      TIMEOUT_MS, 'changing the obligation');
    if (error) return { ok: false, reason: 'rpc-error', message: message(error) };
    return { ok: true, row: fromRow(data) };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e) };
  }
}

/** Attach the bill, the proof it was paid, or a supporting document. */
export async function attachDocument(obligationId, documentId, role) {
  if (!obligationId || !documentId) return fail('no-target', 'Nothing to attach.');
  try {
    const { data, error } = await withTimeout(
      supabase.rpc('obligation_attach_document', { obligation_id_in: obligationId, document_id_in: documentId, role_in: role }),
      TIMEOUT_MS, 'attaching the document');
    if (error) return { ok: false, reason: 'rpc-error', message: message(error) };
    return { ok: true, row: fromAttachment(data) };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e) };
  }
}

/** Sort a document that came in: what it means, which product, which place. */
export async function routeDocument(documentId, { means = null, product = null, place = null, arrivedOn = null } = {}) {
  if (!documentId) return fail('no-document', 'Nothing to sort.');
  try {
    const { data, error } = await withTimeout(
      supabase.rpc('document_route', {
        document_id_in: documentId, means_in: means, product_in: product,
        place_in: place, arrived_on_in: arrivedOn,
      }), TIMEOUT_MS, 'sorting the document');
    if (error) return { ok: false, reason: 'rpc-error', message: message(error) };
    return { ok: true, document: data };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e) };
  }
}
