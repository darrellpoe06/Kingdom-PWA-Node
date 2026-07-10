// =============================================================================
// client-engagements — build billing terms + recorded-discovery intake (DR-0117)
// =============================================================================
// PURE logic for the client-business-factory commercial seam (DR-0114 step 1.5).
//
// THE TERMS — declared by Darrell 2026-07-07, for the SMALL NO-OVERHEAD business
// segment (the factory's first market):
//   * Build: $2,000 MINIMUM, "90 days same as cash" — $500 deposit to start,
//     $500 at MVP delivery, the remaining balance over the rest of the 90 days
//     (no interest, ever — a payment plan, not financing). Or paid in full up
//     front. "…or we don't even start work": canStartBuild() is that sentence
//     made structural — false until the deposit is recorded.
//   * Support: $150/mo perpetual support THROUGH THE FEEDBACK PORTAL once the
//     build is paid. Anything beyond portal-scope support re-enters through the
//     front door as a new build engagement at the $2,000 minimum.
//   * Larger/complex builds (custom domain tables, integrations) are quoted UP
//     from the minimum — the quote number itself is ALWAYS the governor's hand
//     (DR-0114); nothing here computes a price, it only enforces the declared
//     floor and milestones.
//
// RECORDED DISCOVERY — requirements come from the client's own recorded words
// (imported voice notes or an LLM-guided conversation), not a scheduled call:
// parseDiscoveryJson() consumes the extraction pipeline's requirements.json
// (same handoff-contract family as choir-sme-notes.js). Every item carries a
// source_quote and imports as status='extracted' pending steward review
// (Verification Doctrine — a thing the client didn't say stays null; nothing
// is invented). The MVP is built from reviewed requirements; revisions ride
// the Feedback tab, a conversation only when that isn't enough.
//
// Money is INTEGER CENTS. Payments are RECORDED, never processed — money moves
// by the owner's hand (Square/Venmo/etc.; the Moore §7 posture). No card or
// bank fields exist in this shape on purpose.
// =============================================================================

const cap = (s, n) => (s == null ? null : String(s).trim().slice(0, n) || null);
const okConfidence = (c) => (['high', 'med', 'low'].includes(c) ? c : null);
const asCents = (v) => (Number.isFinite(v) && v > 0 ? Math.round(v) : 0);
const DAY_MS = 24 * 60 * 60 * 1000;

// The declared numbers — one source of truth (the door's price-out reads these).
export const BUILD_MINIMUM_CENTS = 200000;   // $2,000 build minimum
export const DEPOSIT_CENTS = 50000;          // $500 to start
export const MVP_PAYMENT_CENTS = 50000;      // $500 at MVP delivery
export const TERM_DAYS = 90;                 // the same-as-cash window
export const SUPPORT_MONTHLY_CENTS = 15000;  // $150/mo Feedback-portal support

export const ENGAGEMENT_TERMS = {
  'ninety-day':   { label: '90 days same as cash', blurb: '$500 to start, $500 at MVP, the balance over the rest of the 90 days. No interest.' },
  'full-upfront': { label: 'Paid in full up front', blurb: 'The whole quote clears before work starts.' },
};
export const DEFAULT_TERMS = 'ninety-day';

// The support fence — perpetual support lives in the Feedback portal; bigger
// asks are a NEW engagement through the front door at the build minimum.
export const SUPPORT_SCOPE =
  'Perpetual support at $150/mo through the Feedback portal. Work beyond portal scope is a new build engagement — back through the front door, $2,000 minimum.';

export function normalizeEngagement(raw = {}) {
  const terms = ENGAGEMENT_TERMS[raw.terms] ? raw.terms : DEFAULT_TERMS;
  return {
    id: raw.id ?? null,
    clientName: cap(raw.clientName, 200),
    businessName: cap(raw.businessName, 200),
    terms,
    quoteCents: asCents(raw.quoteCents),               // the governor's number — never computed
    payments: (Array.isArray(raw.payments) ? raw.payments : [])
      .map(normalizePayment).filter(Boolean),
    agreementScopeId: cap(raw.agreementScopeId, 60),  // the signed scope's id (DR-0123 §2)
    mvpDeliveredAt: cap(raw.mvpDeliveredAt, 40),
    mvpAcceptedAt: cap(raw.mvpAcceptedAt, 40),
    createdAt: cap(raw.createdAt, 40),
  };
}

// A payment RECORD (what was received, by which hand, when) — never a charge.
export function normalizePayment(raw) {
  if (!raw || typeof raw !== 'object') return null; // a null row is not a payment
  const amount = asCents(raw.amountCents);
  if (!amount) return null; // a zero/negative "payment" is not a payment
  return {
    amountCents: amount,
    method: cap(raw.method, 60),   // 'Square' | 'Venmo' | 'Apple Pay' | ... owner's hand
    paidAt: cap(raw.paidAt, 40),
    note: cap(raw.note, 300),
  };
}

// -----------------------------------------------------------------------------
// The gate math.
// -----------------------------------------------------------------------------
export function totalPaidCents(engagement) {
  const e = normalizeEngagement(engagement);
  return e.payments.reduce((sum, p) => sum + p.amountCents, 0);
}

// A quote below the declared minimum is not an engagement we start.
export function quoteMeetsMinimum(engagement) {
  return normalizeEngagement(engagement).quoteCents >= BUILD_MINIMUM_CENTS;
}

// What must clear before ANY build work starts.
export function depositRequiredCents(engagement) {
  const e = normalizeEngagement(engagement);
  if (!e.quoteCents) return 0; // no quote yet — nothing can clear (see canStartBuild)
  return e.terms === 'full-upfront' ? e.quoteCents : DEPOSIT_CENTS;
}

// Cumulative amount expected by MVP delivery ($500 deposit + $500 at MVP on the
// ninety-day terms; everything, on full-upfront).
export function expectedByMvpCents(engagement) {
  const e = normalizeEngagement(engagement);
  if (e.terms === 'full-upfront') return e.quoteCents;
  return Math.min(e.quoteCents, DEPOSIT_CENTS + MVP_PAYMENT_CENTS);
}

export function balanceDueCents(engagement) {
  const e = normalizeEngagement(engagement);
  return Math.max(0, e.quoteCents - totalPaidCents(e));
}

// The 90-day same-as-cash due date runs from the FIRST recorded payment (the
// deposit that started the clock). Null until a payment with a date exists.
export function termDueDate(engagement) {
  const e = normalizeEngagement(engagement);
  if (e.terms !== 'ninety-day') return null;
  const dates = e.payments.map((p) => Date.parse(p.paidAt || '')).filter(Number.isFinite);
  if (!dates.length) return null;
  return new Date(Math.min(...dates) + TERM_DAYS * DAY_MS).toISOString().slice(0, 10);
}

// Agreement-on-file (DR-0123 §2): the signed scope and the engagement link by
// id — a scope row carrying engagementId === e.id (or the engagement carrying
// agreementScopeId) is the recorded agreement. This helper is the SEAM: it
// answers from real rows and never invents a link. canStartBuild's money gate
// is deliberately unchanged (its contract is pinned by tests and by the terms
// module); readiness surfaces compose the two truths side by side — "deposit
// met" and "agreement on file" — so a build that starts without a signed
// scope is a VISIBLE choice, not an accident. The scope-creation UI picker
// that WRITES engagementId is routed separately (re-review: 2026-07-22).
export function agreementOnFile(engagement, scopes) {
  const e = normalizeEngagement(engagement);
  const rows = Array.isArray(scopes) ? scopes : [];
  return rows.find((sRow) =>
    sRow && ((sRow.engagementId && sRow.engagementId === e.id)
      || (e.agreementScopeId && sRow.id === e.agreementScopeId))
  ) || null;
}

// "…or we don't even start work." Structural: false with no quote, false below
// the $2,000 minimum, false until the deposit is recorded.
export function canStartBuild(engagement) {
  const e = normalizeEngagement(engagement);
  if (!quoteMeetsMinimum(e)) return false;
  return totalPaidCents(e) >= depositRequiredCents(e);
}

// The one derived stage — computed from real fields, never stored separately
// (DR-0076: a painted stage would drift from the money that defines it).
//   inquiry          no quote at/above minimum yet (discovery rides alongside)
//   awaiting-deposit quoted; deposit not recorded — work does NOT start
//   cleared-to-build deposit met; MVP not delivered yet
//   mvp-review       MVP delivered ($500 MVP payment due here), not yet accepted
//   in-term          accepted; balance riding the rest of the 90 days
//   past-due         accepted; balance remains past the 90-day due date
//   complete         accepted and paid in full — $150/mo support begins
export function engagementStage(engagement, nowIso) {
  const e = normalizeEngagement(engagement);
  if (!quoteMeetsMinimum(e)) return 'inquiry';
  if (!canStartBuild(e)) return 'awaiting-deposit';
  if (!e.mvpDeliveredAt) return 'cleared-to-build';
  if (!e.mvpAcceptedAt) return 'mvp-review';
  if (balanceDueCents(e) > 0) {
    const due = termDueDate(e);
    const now = Date.parse(nowIso || '');
    if (due && Number.isFinite(now) && now > Date.parse(due) + DAY_MS) return 'past-due';
    return 'in-term';
  }
  return 'complete';
}

export const STAGE_LABELS = {
  'inquiry': 'Inquiry / discovery',
  'awaiting-deposit': 'Awaiting $500 deposit — work not started',
  'cleared-to-build': 'Cleared to build',
  'mvp-review': 'MVP delivered — $500 due, Feedback tab open',
  'in-term': 'Balance riding the 90 days',
  'past-due': 'Past the 90-day term — balance outstanding',
  'complete': 'Paid in full — $150/mo support active',
};

// -----------------------------------------------------------------------------
// RECORDED DISCOVERY — parse the extraction pipeline's requirements.json.
// Handoff contract (infra/nas-sme-pipeline/client-discovery-json-prompt.md):
//   { client:{name,business},
//     requirements:[{area,requirement,confidence,source_quote}],
//     pricing:[{item,amount_text,source_quote}],
//     policies:[{policy,source_quote}],
//     channels:["..."],
//     pain_points:[{pain,source_quote}],
//     unclear:["..."] }
// Faithful: a field the client didn't state stays null. Extracted items import
// as status='extracted' — a steward reviews before the MVP spec rides on them.
// -----------------------------------------------------------------------------
export function parseDiscoveryJson(input, meta = {}) {
  const json = typeof input === 'string' ? JSON.parse(input) : (input || {});
  const client = json.client && typeof json.client === 'object' ? json.client : {};
  const prov = {
    clientName: cap(client.name, 200),
    businessName: cap(client.business, 200),
    sourceRecording: cap(meta.sourceRecording, 300),
    sourceRun: cap(meta.sourceRun, 300),
    extractedAt: meta.extractedAt || null,
    status: 'extracted',
  };
  const items = [];
  for (const r of Array.isArray(json.requirements) ? json.requirements : []) {
    const requirement = cap(r && r.requirement, 2000);
    if (!requirement) continue; // an empty requirement can't be built — skip, don't guess
    items.push({ kind: 'requirement', area: cap(r.area, 120), text: requirement, amountText: null, confidence: okConfidence(r.confidence), sourceQuote: cap(r.source_quote, 2000), ...prov });
  }
  for (const p of Array.isArray(json.pricing) ? json.pricing : []) {
    const item = cap(p && p.item, 300);
    if (!item) continue;
    items.push({ kind: 'pricing', area: null, text: item, amountText: cap(p.amount_text, 120), confidence: null, sourceQuote: cap(p.source_quote, 2000), ...prov });
  }
  for (const p of Array.isArray(json.policies) ? json.policies : []) {
    const policy = cap(p && p.policy, 2000);
    if (!policy) continue;
    items.push({ kind: 'policy', area: null, text: policy, amountText: null, confidence: null, sourceQuote: cap(p.source_quote, 2000), ...prov });
  }
  for (const pain of Array.isArray(json.pain_points) ? json.pain_points : []) {
    const text = cap(pain && pain.pain, 2000);
    if (!text) continue;
    items.push({ kind: 'pain-point', area: null, text, amountText: null, confidence: null, sourceQuote: cap(pain.source_quote, 2000), ...prov });
  }
  const channels = (Array.isArray(json.channels) ? json.channels : []).map((c) => cap(c, 120)).filter(Boolean);
  const unclear = (Array.isArray(json.unclear) ? json.unclear : []).map((u) => cap(u, 500)).filter(Boolean);
  return {
    client: { name: prov.clientName, business: prov.businessName },
    items, channels, unclear,
  };
}

// Items still awaiting a steward's confirmation before the MVP spec uses them.
export function pendingDiscoveryItems(items) {
  return (items || []).filter((i) => i.status === 'extracted');
}

// Group confirmed requirements by area for the MVP spec view.
export function requirementsByArea(items, { includeExtracted = false } = {}) {
  const out = new Map();
  for (const i of items || []) {
    if (i.kind !== 'requirement') continue;
    if (!includeExtracted && i.status !== 'reviewed') continue;
    const area = i.area || 'general';
    if (!out.has(area)) out.set(area, []);
    out.get(area).push(i);
  }
  return out;
}
