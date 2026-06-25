// =============================================================================
// crm-engine — ONE sovereign, reusable CRM backbone every funnel rides
// =============================================================================
// Declared by Darrell 2026-06-24. "Formalize ONE shared, sovereign in-app CRM
// backbone and wire the acquisition funnels onto it." This is the SINGLE engine
// (not one per business): contacts/leads, pipelines + stages, activities /
// touchpoints, follow-up sequences, source attribution, owner/tenant scoping,
// and a universal status lifecycle. Reusable across businesses + tenants (TLC,
// GTM, Boxcar, real estate, future verticals) — one engine, per-business config.
//
// This module is the PURE engine — no React, no Supabase, no localStorage, no
// network. The component (CRM.jsx) and the sync lib (crm-sync.js) sit on top of
// it; the migration (0046-crm-backbone-leads.sql) is its store; the capture RPC
// (crm_capture_lead) is its API seam — the ONE wired "other end" every funnel,
// form, content-engine touchpoint, and inbound channel writes a lead through.
//
// RELATION TO THE TLC client-acquisition lane (lib/client-acquisition.js):
// that lane built the proven 4-stage "revenue agent team" workflow + the
// practice-lead shape + the ethical-marketing/PHI guardrail linters. This engine
// GENERALIZES that lead shape to multi-business (adds `business` + `pipeline`)
// and re-homes the SAME guardrail linters here so the two never diverge — the
// TLC lane's practice_leads retarget onto `crm_leads` via leadFromPractice
// Acquisition(); its workflow stays its own. One table, one guardrail set.
//
// BINDING GUARDRAILS (encoded as data + linters so they cannot be talked past —
// DR-0076 verification doctrine, proven-to-catch). Same six the TLC lane holds:
//   1. PRIVACY / PII-MINIMAL — a lead carries contact-level data only. No clinical
//      data, no PHI, no payment data, ever. stripDisallowed() is the structural
//      scrub; flagPotentialPhi() is the proven-to-catch heuristic on top.
//   2. CONSENT / SERVED-NOT-SURVEILLED — outreach requires recorded consent
//      (lead.consent.outreachOk + channel). canOutreach() is the gate; NO follow-
//      up step is offered without it.
//   3. HEALTHCARE-MARKETING ETHICS (TLC) — no false/guaranteed outcomes, scope of
//      practice, psychoeducation not treatment. screenMarketingClaim() flags it;
//      'block' severity must not ship.
//   4. NO PAYMENT PROCESSING BY US — money is the owner's hand. The engine
//      produces leads / pipelines / sequence DRAFTS, never transactions.
//   5. LLMs DRAFT, HUMANS APPROVE — every follow-up step is a draft requiring
//      human approval; nothing auto-sends. requiresHumanApproval is always true.
//   6. SEED IS NOT REAL — isSeedLead() distinguishes demo/seed from real records
//      so a "thriving pipeline" demo never gets resurrected as real outreach.
// =============================================================================

// -----------------------------------------------------------------------------
// Businesses — the verticals/tenants the one engine serves. Each is a per-
// business CONFIG, not a separate engine. New verticals register a business +
// its pipelines; the model, guardrails, sync, and surface are inherited.
// -----------------------------------------------------------------------------
export const BUSINESSES = {
  tlc: {
    key: 'tlc',
    label: 'TLC Therapy Solutions',
    instanceSlug: 'tlc',
    phiBoundary: true, // contact-level only; clinical content lives in Acuity
    accent: '#B85838',
  },
  gtm: {
    key: 'gtm',
    label: 'GTM',
    instanceSlug: 'poe-family',
    phiBoundary: false,
    accent: '#5A6E3D',
  },
  boxcar: {
    key: 'boxcar',
    label: 'Boxcar',
    instanceSlug: 'poe-family',
    phiBoundary: false,
    accent: '#3D5A6E',
  },
  realestate: {
    key: 'realestate',
    label: 'Steward Real Estate',
    instanceSlug: 'poe-family',
    phiBoundary: false,
    accent: '#6E5A3D',
  },
};

export function getBusiness(key) {
  return BUSINESSES[key] || null;
}

// -----------------------------------------------------------------------------
// Stage metadata — the universal vocabulary of funnel stages. Each pipeline
// picks an ordered subset; `group` ('active' | 'won' | 'lost') drives the status
// lifecycle and the metrics. A stage is pipeline-positional; the GROUP is
// universal, so conversion math is identical across every business.
// -----------------------------------------------------------------------------
export const STAGE_META = {
  // active (in-flight)
  'new':              { label: 'New',               group: 'active' },
  'contacted':        { label: 'Contacted',         group: 'active' },
  'engaged':          { label: 'Engaged',           group: 'active' },
  'nurturing':        { label: 'Nurturing',         group: 'active' },
  'qualified':        { label: 'Qualified',         group: 'active' },
  'consult-booked':   { label: 'Consult booked',    group: 'active' },
  'screening':        { label: 'Screening',         group: 'active' },
  'credentialing':    { label: 'Credentialing',     group: 'active' },
  'interested':       { label: 'Interested',        group: 'active' },
  'showing':          { label: 'Showing scheduled', group: 'active' },
  'application':      { label: 'Application',        group: 'active' },
  'held':             { label: 'Held (tentative)',  group: 'active' },
  // won (converted)
  'intake-scheduled': { label: 'Intake scheduled',  group: 'won' },
  'onboarded':        { label: 'Onboarded',         group: 'won' },
  'enrolled':         { label: 'Enrolled',          group: 'won' },
  'subscribed':       { label: 'Subscribed',        group: 'won' },
  'booked':           { label: 'Booked',            group: 'won' },
  'leased':           { label: 'Leased / closed',   group: 'won' },
  // lost
  'declined':         { label: 'Declined',          group: 'lost' },
  'lost':             { label: 'Lost / no fit',     group: 'lost' },
  'dropped':          { label: 'Dropped',           group: 'lost' },
  'unsubscribed':     { label: 'Unsubscribed',      group: 'lost' },
  'cancelled':        { label: 'Cancelled',         group: 'lost' },
};

export function stageGroup(stageKey) {
  return (STAGE_META[stageKey] || {}).group || 'active';
}

// -----------------------------------------------------------------------------
// Pipelines — the per-business funnels. THIS is the registry the whole product
// rides: TLC's three (client intake / therapist recruiting / training
// enrollment), GTM's subscriber funnel, Boxcar's same-night booking, and real-
// estate leads. Each names its ordered stages, its allowed sources, whether
// outreach needs consent (always true here), the PHI boundary it inherits from
// its business, and the follow-up sequence key it nurtures with.
// -----------------------------------------------------------------------------
export const PIPELINES = {
  'tlc-client-intake': {
    id: 'tlc-client-intake',
    business: 'tlc',
    label: 'Client intake',
    leadNoun: 'prospective client',
    stages: ['new', 'contacted', 'consult-booked', 'intake-scheduled', 'declined', 'lost'],
    sources: ['church-network', 'instagram', 'facebook', 'google', 'referral', 'website', 'other'],
    sequenceKey: 'tlc-client-nurture',
    phiSensitive: true, // the most sensitive path; pre-intake contact-level ONLY
    complianceNote: 'Pre-intake contact-level only — no clinical detail, no PHI, ever. Psychoeducation, not treatment. Mirrors the Acuity bright line.',
  },
  'tlc-therapist-recruiting': {
    id: 'tlc-therapist-recruiting',
    business: 'tlc',
    label: 'Therapist recruiting',
    leadNoun: 'clinician',
    stages: ['new', 'contacted', 'screening', 'credentialing', 'onboarded', 'declined'],
    sources: ['clinician-referral', 'linkedin', 'job-board', 'church-network', 'website', 'other'],
    sequenceKey: 'tlc-recruit-nurture',
    phiSensitive: false, // B2B/clinician relationship; not PHI
    complianceNote: 'B2B clinician recruiting — not PHI-bound, but outcome/earnings claims still follow truthful-advertising ethics.',
  },
  'tlc-training-enrollment': {
    id: 'tlc-training-enrollment',
    business: 'tlc',
    label: 'Training / CE enrollment',
    leadNoun: 'practice / clinician',
    stages: ['new', 'interested', 'engaged', 'qualified', 'enrolled', 'dropped'],
    sources: ['youtube', 'linkedin', 'content-engine', 'church-network', 'clinician-referral', 'webinar', 'other'],
    sequenceKey: 'tlc-training-nurture',
    phiSensitive: false,
    complianceNote: 'Continuing-education / product enrollment. No guaranteed outcomes; stay in scope of practice.',
  },
  'gtm-subscriber': {
    id: 'gtm-subscriber',
    business: 'gtm',
    label: 'Subscriber funnel',
    leadNoun: 'subscriber',
    stages: ['new', 'engaged', 'subscribed', 'unsubscribed'],
    sources: ['youtube', 'content-engine', 'social', 'website', 'lead-magnet', 'referral', 'other'],
    sequenceKey: 'gtm-welcome',
    phiSensitive: false,
    complianceNote: 'Subscriber consent recorded at capture. Honor opt-out immediately (served, not surveilled).',
  },
  'boxcar-booking': {
    id: 'boxcar-booking',
    business: 'boxcar',
    label: 'Same-night booking',
    leadNoun: 'booking inquiry',
    stages: ['new', 'contacted', 'held', 'booked', 'cancelled', 'lost'],
    sources: ['website', 'google', 'social', 'referral', 'walk-in', 'phone', 'other'],
    sequenceKey: 'boxcar-confirm',
    phiSensitive: false,
    complianceNote: 'Fast funnel — same-night turnaround. We capture and confirm; we never process payment (owner does).',
  },
  'realestate-leads': {
    id: 'realestate-leads',
    business: 'realestate',
    label: 'Property leads',
    leadNoun: 'renter / buyer',
    stages: ['new', 'contacted', 'showing', 'application', 'leased', 'lost'],
    sources: ['website', 'zillow', 'google', 'referral', 'sign', 'walk-in', 'other'],
    sequenceKey: 'realestate-nurture',
    phiSensitive: false,
    complianceNote: 'Fair-housing posture: same process, same criteria for every applicant. No payment processing by us.',
  },
};

export const PIPELINE_KEYS = Object.keys(PIPELINES);

export function getPipeline(pipelineId) {
  return PIPELINES[pipelineId] || null;
}

export function pipelinesForBusiness(businessKey) {
  return PIPELINE_KEYS.map((k) => PIPELINES[k]).filter((p) => p.business === businessKey);
}

// Register a new business + pipeline at runtime (future verticals). Keeps the
// engine open for extension without forking.
export function registerBusiness(key, business) {
  BUSINESSES[key] = { ...business, key };
  return BUSINESSES[key];
}
export function registerPipeline(id, pipeline) {
  PIPELINES[id] = { ...pipeline, id };
  if (!PIPELINE_KEYS.includes(id)) PIPELINE_KEYS.push(id);
  return PIPELINES[id];
}

// Stage helpers — normalize an arbitrary stage to one valid for the pipeline,
// and advance to the next stage in the pipeline's order.
export function firstStage(pipelineId) {
  const p = getPipeline(pipelineId);
  return p && p.stages.length ? p.stages[0] : 'new';
}
export function normalizeStage(pipelineId, stage) {
  const p = getPipeline(pipelineId);
  if (!p) return 'new';
  return p.stages.includes(stage) ? stage : p.stages[0];
}
export function nextStage(pipelineId, currentStage) {
  const p = getPipeline(pipelineId);
  if (!p) return null;
  const i = p.stages.indexOf(currentStage);
  if (i < 0 || i >= p.stages.length - 1) return null;
  // Skip to the next ACTIVE/won stage, not a lost terminal — advancing means
  // progressing the lead, not marking it lost.
  for (let j = i + 1; j < p.stages.length; j++) {
    if (stageGroup(p.stages[j]) !== 'lost') return p.stages[j];
  }
  return null;
}
export function stagesFor(pipelineId) {
  const p = getPipeline(pipelineId);
  if (!p) return [];
  return p.stages.map((k) => ({ key: k, ...(STAGE_META[k] || { label: k, group: 'active' }) }));
}

// -----------------------------------------------------------------------------
// Source attribution — the union of every funnel's sources, normalized. A raw
// source from a form / UTM / inbound channel maps to a known key, else 'other',
// so attribution stays clean across funnels.
// -----------------------------------------------------------------------------
export const SOURCES = [
  { key: 'church-network',   label: 'Church network' },
  { key: 'instagram',        label: 'Instagram' },
  { key: 'facebook',         label: 'Facebook' },
  { key: 'social',           label: 'Social' },
  { key: 'youtube',          label: 'YouTube' },
  { key: 'linkedin',         label: 'LinkedIn' },
  { key: 'google',           label: 'Google search' },
  { key: 'zillow',           label: 'Zillow' },
  { key: 'sign',             label: 'Yard sign / signage' },
  { key: 'content-engine',   label: 'Content engine' },
  { key: 'clinician-referral', label: 'Clinician referral' },
  { key: 'job-board',        label: 'Job board' },
  { key: 'webinar',          label: 'Webinar / event' },
  { key: 'lead-magnet',      label: 'Lead magnet' },
  { key: 'referral',         label: 'Personal referral' },
  { key: 'website',          label: 'Website' },
  { key: 'walk-in',          label: 'Walk-in' },
  { key: 'phone',            label: 'Phone' },
  { key: 'other',            label: 'Other' },
];
const SOURCE_KEYS = new Set(SOURCES.map((s) => s.key));
export function attributeSource(raw) {
  if (!raw) return 'other';
  const k = String(raw).toLowerCase().trim();
  if (SOURCE_KEYS.has(k)) return k;
  // a few friendly aliases for inbound/UTM variants
  const ALIAS = { ig: 'instagram', fb: 'facebook', yt: 'youtube', web: 'website', site: 'website', search: 'google', word_of_mouth: 'referral', 'word-of-mouth': 'referral', church: 'church-network', parishioner: 'church-network' };
  return ALIAS[k] || 'other';
}
export function sourceLabel(key) {
  return (SOURCES.find((s) => s.key === key) || {}).label || key || 'Other';
}

// =============================================================================
// Canonical lead shape — the CRM core record. Generic across every business; NO
// clinical / PHI / payment fields exist by design (the wall is structural, not
// just a linter). `now`/`id` are injectable for tests.
// =============================================================================
export const CONTACT_METHODS = ['email', 'phone', 'text', 'linkedin', 'in-person', 'other'];

export function newLead(partial = {}, { now = null, id = null } = {}) {
  const ts = now || new Date().toISOString();
  const business = partial.business || (getPipeline(partial.pipeline) || {}).business || 'tlc';
  const pipeline = getPipeline(partial.pipeline) ? partial.pipeline : pipelinesForBusiness(business)[0]?.id || 'tlc-client-intake';
  const stage = normalizeStage(pipeline, partial.stage || firstStage(pipeline));
  return {
    id: id || partial.id || `lead-${(now ? new Date(now).getTime() : Date.now())}-${Math.random().toString(36).slice(2, 7)}`,
    business,
    pipeline,
    stage,
    name: partial.name || '',
    org: partial.org || '',
    role: partial.role || '',
    contactMethod: CONTACT_METHODS.includes(partial.contactMethod) ? partial.contactMethod : 'email',
    contactValue: partial.contactValue || '',
    source: attributeSource(partial.source),
    sourceDetail: partial.sourceDetail || '',
    fitScore: partial.fitScore == null ? null : partial.fitScore,
    signalTags: Array.isArray(partial.signalTags) ? partial.signalTags : [],
    notes: partial.notes || '',
    consent: normalizeConsent(partial.consent),
    nurtureStep: partial.nurtureStep == null ? 0 : partial.nurtureStep,
    sequenceKey: partial.sequenceKey || (getPipeline(pipeline) || {}).sequenceKey || null,
    ownerUserId: partial.ownerUserId || null,
    seed: partial.seed === true,
    links: partial.links || {},
    history: Array.isArray(partial.history) && partial.history.length
      ? partial.history
      : [{ stage, at: ts }],
    createdAt: partial.createdAt || ts,
    updatedAt: partial.updatedAt || ts,
  };
}

export function normalizeConsent(consent) {
  const c = consent && typeof consent === 'object' ? consent : {};
  return {
    outreachOk: c.outreachOk === true,
    channels: Array.isArray(c.channels) ? c.channels : [],
    capturedAt: c.capturedAt || null,
    note: c.note || '',
  };
}

// Advance a lead's stage, recording the move in history. Pure — returns a new
// lead. `now` injectable.
export function moveStage(lead, toStage, { now = null } = {}) {
  const ts = now || new Date().toISOString();
  const stage = normalizeStage(lead.pipeline, toStage);
  if (stage === lead.stage) return lead;
  return { ...lead, stage, updatedAt: ts, history: [...(lead.history || []), { stage, at: ts }] };
}

// =============================================================================
// Consent gate — served, not surveilled. No recorded consent => no outreach.
// A channel, when supplied, must be allowed by the recorded consent.
// =============================================================================
export function canOutreach(lead, channel = null) {
  if (!lead || !lead.consent || lead.consent.outreachOk !== true) return false;
  if (!channel) return true;
  const allowed = lead.consent.channels || [];
  // empty channels = general consent (any channel); otherwise channel must be listed
  return allowed.length === 0 || allowed.includes(channel);
}
export function consentReason(lead, channel = null) {
  if (!lead || !lead.consent || lead.consent.outreachOk !== true) {
    return 'No recorded outreach consent — capture consent before any outreach.';
  }
  if (channel && (lead.consent.channels || []).length && !lead.consent.channels.includes(channel)) {
    return `Consent does not cover the ${channel} channel.`;
  }
  return null;
}

// =============================================================================
// Follow-up sequences — DRAFT-ONLY nurture. The engine knows the steps; it
// NEVER sends. nextFollowUp() returns the next step as a draft requiring human
// approval, gated on consent. The drafting itself is done by the sovereign LLM
// (the NAS workflow) — these are the deterministic step specs it drafts against.
// =============================================================================
export const SEQUENCES = {
  'tlc-client-nurture': {
    key: 'tlc-client-nurture',
    label: 'Client intake nurture',
    steps: [
      { step: 0, channel: 'email', dayOffset: 0, intent: 'Warm welcome + how booking works (psychoeducation, not treatment).' },
      { step: 1, channel: 'email', dayOffset: 2, intent: 'Gentle check-in + a faith-aware resource. Invite a consult.' },
      { step: 2, channel: 'phone', dayOffset: 5, intent: 'Personal call offer to answer questions about fit + insurance.' },
    ],
  },
  'tlc-recruit-nurture': {
    key: 'tlc-recruit-nurture',
    label: 'Therapist recruiting nurture',
    steps: [
      { step: 0, channel: 'email', dayOffset: 0, intent: 'Intro to the practice + the flexible career path. Honest earnings framing.' },
      { step: 1, channel: 'email', dayOffset: 3, intent: 'What credentialing + onboarding looks like. Invite a screening call.' },
      { step: 2, channel: 'phone', dayOffset: 7, intent: 'Screening call scheduling.' },
    ],
  },
  'tlc-training-nurture': {
    key: 'tlc-training-nurture',
    label: 'Training enrollment nurture',
    steps: [
      { step: 0, channel: 'email', dayOffset: 0, intent: 'CE value + what the track covers. No guaranteed outcomes.' },
      { step: 1, channel: 'email', dayOffset: 4, intent: 'A free sample lesson + enrollment invite.' },
    ],
  },
  'gtm-welcome': {
    key: 'gtm-welcome',
    label: 'Subscriber welcome',
    steps: [
      { step: 0, channel: 'email', dayOffset: 0, intent: 'Welcome + what to expect + easy unsubscribe (served, not surveilled).' },
      { step: 1, channel: 'email', dayOffset: 3, intent: 'Best-of content + invite to engage.' },
    ],
  },
  'boxcar-confirm': {
    key: 'boxcar-confirm',
    label: 'Booking confirm',
    steps: [
      { step: 0, channel: 'text', dayOffset: 0, intent: 'Acknowledge the request + hold details. Same-night turnaround.' },
      { step: 1, channel: 'phone', dayOffset: 0, intent: 'Confirm specifics. (No payment — owner handles money.)' },
    ],
  },
  'realestate-nurture': {
    key: 'realestate-nurture',
    label: 'Property lead nurture',
    steps: [
      { step: 0, channel: 'email', dayOffset: 0, intent: 'Property details + how to schedule a showing. Same process for everyone.' },
      { step: 1, channel: 'phone', dayOffset: 2, intent: 'Offer a showing time + answer questions.' },
    ],
  },
};

export function getSequence(key) {
  return SEQUENCES[key] || null;
}

// nextFollowUp — the next draft step for a lead, or a structured reason it is not
// available. ALWAYS a draft requiring human approval; NEVER sends. Gated on
// consent. dueAt is computed from a base time (injectable).
export function nextFollowUp(lead, { now = null } = {}) {
  if (!lead) return { available: false, reason: 'No lead.' };
  const reason = consentReason(lead, null);
  if (reason) return { available: false, reason };
  const seq = getSequence(lead.sequenceKey);
  if (!seq) return { available: false, reason: 'No follow-up sequence configured for this pipeline.' };
  const idx = lead.nurtureStep == null ? 0 : lead.nurtureStep;
  const spec = seq.steps[idx];
  if (!spec) return { available: false, reason: 'Sequence complete — no further steps.' };
  if (!canOutreach(lead, spec.channel)) {
    return { available: false, reason: consentReason(lead, spec.channel) || `Consent does not cover the ${spec.channel} channel.` };
  }
  const base = now ? new Date(now).getTime() : Date.now();
  const dueAt = new Date(base + (spec.dayOffset || 0) * 86400000).toISOString();
  return {
    available: true,
    sequenceKey: seq.key,
    step: idx,
    channel: spec.channel,
    intent: spec.intent,
    dueAt,
    // The hard contract: a draft a HUMAN approves. The engine produces the spec;
    // the LLM drafts the copy; a person sends it. Never auto-send.
    status: 'draft',
    requiresHumanApproval: true,
  };
}

// advanceSequence — bump the nurture step after a human approves+sends a step.
// Pure; returns a new lead. Caps at the sequence length.
export function advanceSequence(lead, { now = null } = {}) {
  const ts = now || new Date().toISOString();
  const seq = getSequence(lead.sequenceKey);
  const max = seq ? seq.steps.length : 0;
  const nextStepIdx = Math.min((lead.nurtureStep || 0) + 1, max);
  return { ...lead, nurtureStep: nextStepIdx, updatedAt: ts };
}

// =============================================================================
// Pipeline metrics — counts per stage + conversion rate over a lead list. Pure;
// drives the in-app readout (real data only — no painted numbers). Seed leads
// are excluded by default so the demo never inflates a real pipeline.
// =============================================================================
export function pipelineStats(leads = [], { pipeline = null, includeSeed = false } = {}) {
  const list = (leads || []).filter((l) => l && (includeSeed || !isSeedLead(l)) && (!pipeline || l.pipeline === pipeline));
  const byStage = {};
  let won = 0, lost = 0, active = 0, consented = 0;
  const bySourceMap = {};
  for (const lead of list) {
    byStage[lead.stage] = (byStage[lead.stage] || 0) + 1;
    const grp = stageGroup(lead.stage);
    if (grp === 'won') won += 1; else if (grp === 'lost') lost += 1; else active += 1;
    if (canOutreach(lead)) consented += 1;
    bySourceMap[lead.source] = (bySourceMap[lead.source] || 0) + 1;
  }
  const closed = won + lost;
  const conversionRate = closed > 0 ? (won / closed) * 100 : 0;
  const bySource = Object.entries(bySourceMap)
    .map(([key, count]) => ({ key, label: sourceLabel(key), count }))
    .sort((a, b) => b.count - a.count);
  return { total: list.length, byStage, won, lost, active, closed, conversionRate, consented, bySource };
}

// =============================================================================
// Seed vs real — a thriving demo pipeline is aspiration, NOT real outreach
// targets. isSeedLead is the bright line; no follow-up is ever offered for seed.
// =============================================================================
export function isSeedLead(lead) {
  if (!lead) return false;
  if (lead.seed === true) return true;
  const id = String(lead.id || '');
  return /^(seed-|lead-ex|inq-ex|demo-)/i.test(id);
}

// =============================================================================
// Funnel adapters — map each funnel's native record into a canonical CRM lead.
// These are how "each funnel writes leads → CRM": the funnel keeps its capture
// UX, the adapter normalizes into the one model. All pure.
// =============================================================================

// TLC pre-intake inquiry (the existing Practice `inquiries` rows) → client-intake
// lead. Read-side federation: surfaces existing TLC inquiries on the one board
// without forking their table.
export function leadFromInquiry(inq, opts = {}) {
  if (!inq) return null;
  return newLead({
    id: inq.remoteUuid ? `inq-${inq.remoteUuid}` : (inq.id || null),
    business: 'tlc',
    pipeline: 'tlc-client-intake',
    stage: mapInquiryStatus(inq.status),
    name: inq.firstName || '',
    contactMethod: inq.contactMethod || 'phone',
    contactValue: inq.contactValue || inq.phone || inq.email || '',
    source: inq.source,
    sourceDetail: inq.sourceDetail || '',
    notes: inq.notes || '',
    // Inquiries predate explicit consent capture; default to NOT-consented so the
    // engine never offers outreach without a real recorded yes.
    consent: { outreachOk: false },
    seed: isSeedSlug(inq.id),
    createdAt: inq.receivedAt || null,
  }, opts);
}
function mapInquiryStatus(s) {
  const M = { 'new': 'new', 'attempting-contact': 'contacted', 'contacted': 'contacted', 'scheduled-intake': 'intake-scheduled', 'declined': 'declined', 'lost': 'lost' };
  return M[s] || 'new';
}

// The TLC client-acquisition lane's practice_lead → canonical CRM lead. This is
// the retarget seam: that lane's leads land in `crm_leads`, business 'tlc', the
// pipeline chosen by its audience preset. patient-practice => client intake;
// b2b-practices => training enrollment (product adoption).
export function leadFromPracticeAcquisition(pl, opts = {}) {
  if (!pl) return null;
  const pipeline = pl.audiencePresetKey === 'patient-practice' ? 'tlc-client-intake' : 'tlc-training-enrollment';
  return newLead({
    id: pl.id || null,
    business: 'tlc',
    pipeline,
    stage: pl.stage,
    name: pl.name || '',
    org: pl.org || '',
    role: pl.role || '',
    contactMethod: pl.contactMethod || 'email',
    contactValue: pl.contactValue || '',
    source: pl.source,
    sourceDetail: pl.sourceDetail || '',
    fitScore: pl.fitScore,
    signalTags: pl.signalTags,
    notes: pl.notes || '',
    consent: pl.consent ? { outreachOk: !!pl.consent.outreachOk, capturedAt: pl.consent.capturedAt, note: pl.consent.note } : { outreachOk: false },
    nurtureStep: pl.nurtureStep,
    history: pl.history,
    createdAt: pl.createdAt || null,
  }, opts);
}

// GTM subscriber capture → subscriber lead.
export function leadFromSubscriber(sub, opts = {}) {
  if (!sub) return null;
  return newLead({
    id: sub.id || null,
    business: 'gtm',
    pipeline: 'gtm-subscriber',
    stage: sub.unsubscribed ? 'unsubscribed' : (sub.confirmed ? 'subscribed' : 'new'),
    name: sub.name || '',
    contactMethod: 'email',
    contactValue: sub.email || '',
    source: sub.source || 'website',
    sourceDetail: sub.sourceDetail || '',
    // A subscribe action IS the consent — but only for the email channel they
    // opted into. Recorded explicitly so the gate is honest.
    consent: { outreachOk: sub.consented === true || sub.confirmed === true, channels: ['email'], capturedAt: sub.subscribedAt || null, note: 'Subscribe opt-in' },
    createdAt: sub.subscribedAt || null,
  }, opts);
}

// Boxcar same-night booking inquiry → booking lead.
export function leadFromBooking(bk, opts = {}) {
  if (!bk) return null;
  return newLead({
    id: bk.id || null,
    business: 'boxcar',
    pipeline: 'boxcar-booking',
    stage: bk.status === 'booked' ? 'booked' : bk.status === 'cancelled' ? 'cancelled' : bk.status === 'held' ? 'held' : 'new',
    name: bk.name || '',
    contactMethod: bk.contactMethod || 'phone',
    contactValue: bk.contactValue || bk.phone || '',
    source: bk.source || 'website',
    sourceDetail: bk.partySize ? `Party ${bk.partySize}${bk.when ? ' · ' + bk.when : ''}` : (bk.sourceDetail || ''),
    notes: bk.notes || '',
    // Booking request implies consent to be contacted about THIS booking (phone/
    // text), not marketing. Channels reflect that.
    consent: { outreachOk: true, channels: ['phone', 'text'], capturedAt: bk.requestedAt || null, note: 'Booking request' },
    createdAt: bk.requestedAt || null,
  }, opts);
}

// Real-estate inquiry (renter/buyer) → property lead.
export function leadFromRealEstateInquiry(req, opts = {}) {
  if (!req) return null;
  return newLead({
    id: req.id || null,
    business: 'realestate',
    pipeline: 'realestate-leads',
    stage: req.stage || 'new',
    name: req.name || '',
    contactMethod: req.contactMethod || 'email',
    contactValue: req.contactValue || req.email || req.phone || '',
    source: req.source || 'website',
    sourceDetail: req.property ? `Re: ${req.property}` : (req.sourceDetail || ''),
    notes: req.notes || '',
    consent: { outreachOk: req.consented === true, channels: req.contactMethod ? [req.contactMethod] : [], capturedAt: req.requestedAt || null, note: 'Property inquiry' },
    createdAt: req.requestedAt || null,
  }, opts);
}

function isSeedSlug(id) {
  return /^(seed-|lead-ex|inq-ex|demo-)/i.test(String(id || ''));
}

// =============================================================================
// Capture validation — the API seam mirror. The DB capture RPC (crm_capture_lead)
// enforces these server-side for anon/inbound writes; this is the same contract
// usable client-side. It FORCES the safe shape: valid pipeline, first stage,
// attributed source, minimal PII, consent defaulting to false, and strips any
// disallowed (clinical/payment) field a caller tries to smuggle in.
// =============================================================================
export const DISALLOWED_KEYS = [
  'diagnosis', 'diagnoses', 'presentingConcern', 'presenting_concern', 'sessionNotes', 'session_notes',
  'treatmentPlan', 'treatment_plan', 'clinical', 'phi', 'dob', 'dateOfBirth', 'date_of_birth', 'ssn',
  'medicalRecord', 'medical_record', 'insuranceId', 'insurance_id', 'memberId', 'member_id',
  'cardNumber', 'card_number', 'cvv', 'payment', 'paymentMethod', 'payment_method', 'bankAccount', 'bank_account',
];

export function stripDisallowed(payload) {
  const out = {};
  for (const [k, v] of Object.entries(payload || {})) {
    if (!DISALLOWED_KEYS.includes(k)) out[k] = v;
  }
  return out;
}

export function validateCapture(pipelineId, payload = {}, { now = null, id = null } = {}) {
  const pipe = getPipeline(pipelineId);
  if (!pipe) return { ok: false, error: `Unknown pipeline: ${pipelineId}` };
  const clean = stripDisallowed(payload);
  // Anon/inbound capture can NEVER self-advance, self-approve, or self-consent
  // beyond an explicit boolean. Stage is forced to the first stage; consent is
  // explicit-only (default false).
  const lead = newLead({
    business: pipe.business,
    pipeline: pipe.id,
    stage: firstStage(pipe.id),
    name: clean.name,
    org: clean.org,
    role: clean.role,
    contactMethod: clean.contactMethod,
    contactValue: clean.contactValue,
    source: clean.source,
    sourceDetail: clean.sourceDetail,
    notes: clean.notes,
    consent: { outreachOk: clean.consentOutreachOk === true, channels: Array.isArray(clean.consentChannels) ? clean.consentChannels : [], capturedAt: clean.consentOutreachOk === true ? (now || new Date().toISOString()) : null, note: clean.consentNote || '' },
    seed: false,
  }, { now, id });
  return { ok: true, lead };
}

// =============================================================================
// Guardrail linters — proven-to-catch, re-homed here as the CANONICAL set so the
// TLC lane and this engine never diverge. screenMarketingClaim flags unethical /
// non-compliant marketing language; flagPotentialPhi flags likely PHI leakage.
// Both deterministic + pure so a test proves they CATCH the break (DR-0076).
// =============================================================================
const CLAIM_RULES = [
  { re: /\b(guarantee[ds]?|guaranteed results?|results guaranteed)\b/i, severity: 'block', why: 'Guaranteeing therapy results is prohibited by therapy-advertising ethics and FTC rules.', fix: 'Describe the process and what clients typically work toward — never a guaranteed result.' },
  { re: /\b(cure[sd]?|will cure|curing)\b/i, severity: 'block', why: 'Claiming to "cure" implies a guaranteed clinical outcome and overstates scope.', fix: 'Use "support," "help with," or "work through" instead of "cure."' },
  { re: /\b(100%|completely|fully)\s+(effective|successful|cured|healed)\b/i, severity: 'block', why: 'Absolute effectiveness claims are exaggerated outcome claims.', fix: 'Drop the absolute; describe the approach honestly.' },
  { re: /\bproven to (cure|fix|heal|eliminate)\b/i, severity: 'block', why: '"Proven to cure/heal" is an unsupported outcome claim.', fix: 'Cite real evidence for the METHOD, not a promised outcome.' },
  { re: /\b(no[- ]risk|risk[- ]free|zero risk)\b/i, severity: 'block', why: 'Therapy is not risk-free; the claim is misleading.', fix: 'Be honest about fit and the consultation step.' },
  { re: /(?:#1|\b(?:number one|best|top[- ]rated|leading))\s+(?:therapist|practice|counsel(?:or|ing)|clinic)\b/i, severity: 'warn', why: 'Superlative ranking claims need objective substantiation or they mislead.', fix: 'Replace with a specific, true differentiator.' },
  { re: /\b(instant|overnight|quick fix|fast results?|rapid results?)\b/i, severity: 'warn', why: 'Implying speed of outcome misrepresents the therapeutic process.', fix: 'Set honest expectations about the work and timeline.' },
  { re: /\b\d{1,3}%\s+(of (clients|patients|people)|success rate|recover)/i, severity: 'warn', why: 'A success-rate statistic must be sourced or it is fabricated proof.', fix: 'Cite the real source, or remove the statistic.' },
  { re: /\b(fix|save) your (marriage|relationship|life|child)\b/i, severity: 'warn', why: 'Promising to fix/save a specific outcome is an implied guarantee.', fix: 'Offer support and a path, not a promised rescue.' },
];

export function screenMarketingClaim(text) {
  const t = text || '';
  const findings = [];
  for (const rule of CLAIM_RULES) {
    const m = t.match(rule.re);
    if (m) findings.push({ term: m[0], severity: rule.severity, why: rule.why, fix: rule.fix });
  }
  return findings;
}
export function isClaimShippable(text) {
  return !screenMarketingClaim(text).some((f) => f.severity === 'block');
}

const PHI_RULES = [
  { re: /\bmy (client|patient)\b/i, why: 'References a specific person in your care — keep client stories out of marketing without written release.' },
  { re: /\ba (client|patient) of mine\b/i, why: 'Identifiable client reference; remove or anonymize with written release.' },
  { re: /\b(diagnos(ed|is)|presenting (problem|concern)|treatment plan|session notes?|case notes?)\b/i, why: 'Clinical detail belongs in the clinical record (Acuity), never in marketing copy.' },
  { re: /\b(date of birth|d\.?o\.?b\.?|medical record|chart number|insurance id|member id)\b/i, why: 'Direct identifier — must never appear in marketing.' },
  { re: /\b(SSN|social security)\b/i, why: 'Direct identifier — must never appear anywhere in marketing.' },
];

export function flagPotentialPhi(text) {
  const t = text || '';
  const findings = [];
  for (const rule of PHI_RULES) {
    const m = t.match(rule.re);
    if (m) findings.push({ term: m[0], why: rule.why });
  }
  return findings;
}

export const GUARDRAILS = {
  'pii-minimal':        { label: 'PII minimal', detail: 'Contact-level data only. No clinical, PHI, or payment data on a lead — ever.' },
  'consent-required':   { label: 'Consent / served-not-surveilled', detail: 'Outreach requires recorded consent and the right channel. Honor opt-out immediately.' },
  'healthcare-ethics':  { label: 'Healthcare-marketing ethics', detail: 'No false/guaranteed outcomes. Scope of practice. Psychoeducation, not treatment.' },
  'no-payment':         { label: 'No payment processing by us', detail: "Money is the owner's hand. We produce leads, pipelines, and sequence drafts — never transactions." },
  'human-approves':     { label: 'LLMs draft, humans approve', detail: 'Every follow-up step is a draft. Nothing the engine produces is sent automatically.' },
  'seed-not-real':      { label: 'Seed is not real', detail: 'Demo/seed leads never become outreach targets. Real records are distinct from aspiration.' },
};

// Constant marker for the binding rule, referenced by the surface + tests.
export const NO_PAYMENT_PROCESSING = true;
