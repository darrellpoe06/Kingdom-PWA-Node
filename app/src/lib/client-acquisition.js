// =============================================================================
// client-acquisition — the reusable 4-stage "client growth" workflow engine
// =============================================================================
// Declared by Darrell 2026-06-24. A CLIENT-ACQUISITION process for TLC Therapy
// Solutions (tlctherapysolutions.com — Christina's multi-tenant therapy LMS /
// practice product), modeled on the 4-agent "revenue agent team" pattern, built
// as a REUSABLE in-app workflow under the Practice tab.
//
// This module is the PURE engine — no React, no Supabase, no localStorage, no
// network. It defines the four stages, the per-audience configuration, the
// deterministic prompt/brief builders the sovereign A.I. team runs, the lead /
// funnel model, and the ethical-marketing + PHI guardrails (proven-to-catch).
// The component (ClientGrowth.jsx) and the sync lib (practice-leads-sync.js) sit
// on top of it; the NAS workflow (wf-practice-growth, pending) does the drafting.
//
// WHY A CONFIG-DRIVEN ENGINE (workflow-module-library + per-industry sovereign-
// LLM-team vision): the four stages and their guardrails are universal; only the
// AUDIENCE and the TENANT change. So the engine takes a config and works for:
//   * B2B (default, lead path)  — therapy practices / clinicians adopting TLC
//                                 Therapy Solutions, the product's primary customer
//   * patient (noted path)      — prospective clients for Christina's OWN practice
// ...and, by registering a new preset, for any practice or tenant in any sector.
//
// BINDING GUARDRAILS (encoded as data + a linter so they can't be talked past —
// DR-0076 verification doctrine, proven-to-catch):
//   1. ETHICAL HEALTHCARE MARKETING — no false / exaggerated outcome claims, no
//      guarantees of cure, respect therapy-advertising rules + licensure / scope
//      (APA/ACA/NASW codes + FTC truthful-advertising). screenMarketingClaim()
//      flags violations; 'block' severity must not ship.
//   2. NO PHI IN MARKETING — flagPotentialPhi() catches client-identifying or
//      clinical content leaking into outreach copy; defaults to flag on doubt.
//   3. CONSENT / SERVED-NOT-SURVEILLED — outreach requires recorded consent
//      (lead.consent.outreachOk); encoded as a required conversion checklist item.
//   4. NO PAYMENT PROCESSING BY US — money is Darrell's hand. The conversion stage
//      produces the funnel / sequences / packaging + leads, never transactions.
//   5. HUMANS APPROVE — every stage output is a DRAFT until a human (Christina /
//      Darrell) approves it. The engine models approval state; nothing auto-sends.
//   6. PSYCHOEDUCATION, NOT TREATMENT — content educates and invites; it never
//      diagnoses, treats, or implies a clinical relationship before intake.
// =============================================================================

// -----------------------------------------------------------------------------
// The four stages — the "revenue / client-acquisition agent team." Each stage is
// one specialized role. `promptTemplate` is rendered by buildStagePrompt() into
// the actual instruction the sovereign A.I. runs; it is deterministic so a test
// can pin exactly what the model is asked to do (and that the guardrails ride
// along on every call).
// -----------------------------------------------------------------------------
export const ACQUISITION_STAGES = [
  {
    key: 'market-signal',
    n: 1,
    role: 'Market Signal Researcher',
    emoji: '🔭',
    goal: 'Identify real demand: who needs this, where, and what signal proves it.',
    produces: 'signals',
    producesLabel: 'Market signals',
    inputs: ['audience', 'product', 'regions', 'specialties'],
    outputs: [
      'Underserved segments (specialty + region) ranked by need',
      'Search / social / competitor signals that prove demand',
      'The single sharpest segment to lead with, and why',
    ],
    guardrailKeys: ['no-phi', 'no-scraping-private'],
    promptTemplate:
      'Act as a Market Signal Researcher for {{tenant}} ({{productOrService}}). ' +
      'Audience: {{audienceWho}}. Goal: surface REAL, verifiable demand — do not invent ' +
      'numbers. Identify (a) underserved {{specialtyNoun}} + region segments, (b) the ' +
      'search, social, and competitor signals that show the need, and (c) the one segment ' +
      'to lead with. For every claim, name the source or mark it UNVERIFIED. ' +
      '{{regionsLine}}{{specialtiesLine}}',
  },
  {
    key: 'offer-architect',
    n: 2,
    role: 'Offer Architect',
    emoji: '🧱',
    goal: 'Design the offer: what is sold, how it is packaged, and the value it returns.',
    produces: 'offers',
    producesLabel: 'Offer',
    inputs: ['signals', 'product', 'tracks', 'pricingTiers'],
    outputs: [
      'The value proposition for the chosen segment',
      'Packaging + tiers (what each includes)',
      'The clinician-CE track and the patient-outcomes track, framed honestly',
    ],
    guardrailKeys: ['no-outcome-guarantee', 'scope-of-practice', 'no-payment-processing'],
    promptTemplate:
      'Act as an Offer Architect for {{tenant}} ({{productOrService}}). Using the chosen ' +
      'segment from stage 1, design the offer {{audienceWho}} would actually buy. Cover: ' +
      'the value proposition, packaging, and tiers. For TLC specifically, frame BOTH the ' +
      'clinician continuing-education (CE) track and the patient-outcomes track. ' +
      'HARD RULES: state value honestly — NO guaranteed outcomes, NO cure language, stay ' +
      'inside licensure / scope of practice. Describe pricing tiers and what each includes, ' +
      'but DO NOT build any payment flow — packaging and price points only.',
  },
  {
    key: 'content-angle',
    n: 3,
    role: 'Content Angle Strategist',
    emoji: '🎯',
    goal: 'Shape outreach content into clickable, watchable angles for the right practices.',
    produces: 'angles',
    producesLabel: 'Content angles',
    inputs: ['offers', 'channels', 'contentEngine'],
    outputs: [
      'Hooks / angles per channel (YouTube, social, the content engine, the church audience)',
      'A few title + thumbnail-line options per angle',
      'A psychoeducation-first framing for each (educate + invite, never treat)',
    ],
    guardrailKeys: ['no-outcome-guarantee', 'psychoeducation-not-treatment', 'no-phi', 'no-deceptive-funnel'],
    promptTemplate:
      'Act as a Content Angle Strategist for {{tenant}} ({{productOrService}}). Turn the ' +
      'offer from stage 2 into outreach angles that attract {{audienceWho}}. Channels: ' +
      '{{channelsList}}. For each angle give a hook, 2-3 title options, and the promise it ' +
      'makes. HARD RULES: psychoeducation, NOT treatment — educate and invite, never ' +
      'diagnose or imply a clinical relationship. No clickbait that misrepresents the offer. ' +
      'No outcome guarantees. No PHI or real client stories without written release.',
  },
  {
    key: 'conversion-system',
    n: 4,
    role: 'Conversion System Builder',
    emoji: '🪝',
    goal: 'Build the lead magnets, follow-up sequences, and intake funnel that land leads in PoeTech.',
    produces: 'sequences',
    producesLabel: 'Conversion system',
    inputs: ['angles', 'offers', 'funnelStages'],
    outputs: [
      'Lead magnet(s) matched to the angle',
      'A follow-up / nurture sequence (the messages, not the sending)',
      'The intake funnel: how a lead enters PoeTech and moves through the stages',
    ],
    guardrailKeys: ['consent-required', 'no-payment-processing', 'no-deceptive-funnel', 'human-approves'],
    promptTemplate:
      'Act as a Conversion System Builder for {{tenant}} ({{productOrService}}). Design the ' +
      'system that converts attention into a tracked lead inside PoeTech. Produce: (a) lead ' +
      'magnet(s) matched to the angle, (b) a follow-up / nurture sequence (write the message ' +
      'drafts), and (c) the intake funnel stages {{funnelList}}. HARD RULES: every outreach ' +
      'step requires recorded consent (served, not surveilled). Write the sequence COPY only ' +
      '— do NOT build payment processing or send anything. A human approves before any ' +
      'message goes out.',
  },
];

export const STAGE_KEYS = ACQUISITION_STAGES.map((s) => s.key);

export function getStage(stageKey) {
  return ACQUISITION_STAGES.find((s) => s.key === stageKey) || null;
}

// -----------------------------------------------------------------------------
// Guardrails — the binding list, referenced by key from each stage. Surfaced in
// the UI and enforced by the linters below.
// -----------------------------------------------------------------------------
export const GUARDRAILS = {
  'no-phi': {
    label: 'No PHI in marketing',
    detail: 'No protected health information, client-identifying detail, or clinical content in any outreach. Pre-intake / contact-level only.',
  },
  'no-outcome-guarantee': {
    label: 'No guaranteed outcomes',
    detail: 'No promises of cure, "results guaranteed," or exaggerated outcome claims. Therapy-advertising ethics (APA/ACA/NASW) + FTC truthful advertising.',
  },
  'scope-of-practice': {
    label: 'Stay in scope / licensure',
    detail: 'Claims stay inside the clinician’s license and scope of practice; no implied services the practice is not licensed to provide.',
  },
  'psychoeducation-not-treatment': {
    label: 'Psychoeducation, not treatment',
    detail: 'Content educates and invites. It never diagnoses, treats, or implies a clinical relationship before a real intake.',
  },
  'consent-required': {
    label: 'Consent / served-not-surveilled',
    detail: 'Outreach requires recorded consent. We serve people; we never surveil them. Honor opt-out immediately.',
  },
  'no-payment-processing': {
    label: 'No payment processing by us',
    detail: 'Money is the owner’s hand. We produce packaging, price points, sequences, and leads — never transactions.',
  },
  'no-deceptive-funnel': {
    label: 'No deceptive funnels',
    detail: 'No bait-and-switch, fake scarcity, or hooks that misrepresent the offer. The promise on the hook is the promise delivered.',
  },
  'no-scraping-private': {
    label: 'No private-data scraping',
    detail: 'Research uses public signals and consented data only — never scraped private or paywalled personal data.',
  },
  'human-approves': {
    label: 'Humans approve',
    detail: 'Every output is a draft until Christina or Darrell approves it. Nothing the engine produces is sent automatically.',
  },
};

export function guardrailsForStage(stageKey) {
  const stage = getStage(stageKey);
  if (!stage) return [];
  return stage.guardrailKeys.map((k) => ({ key: k, ...GUARDRAILS[k] })).filter((g) => g.label);
}

// -----------------------------------------------------------------------------
// Audience presets — the per-audience configuration. Default leads with B2B (the
// product's primary customer); the patient path is included and noted.
// -----------------------------------------------------------------------------
const PRESETS = {
  'b2b-practices': {
    key: 'b2b-practices',
    label: 'B2B — therapy practices & clinicians (product customers)',
    audienceWho: 'therapy practices, group practices, and individual clinicians who need continuing-education (CE) plus a practice LMS / operations layer',
    productOrService: 'TLC Therapy Solutions — a faith-aware, sovereign therapy LMS + practice platform (clinician-CE track + patient-outcomes track)',
    specialtyNoun: 'clinical specialty',
    defaultChannels: ['youtube', 'linkedin', 'content-engine', 'church-network', 'clinician-referral'],
    regions: ['Illinois', 'multicultural / historically underserved communities'],
    specialties: ['multicultural therapy', 'faith integration', 'child & adolescent', 'couples & family'],
    tracks: ['clinician-CE', 'patient-outcomes'],
    pricingTiers: ['Solo clinician', 'Group practice', 'Network / enterprise'],
    funnelStages: ['new', 'contacted', 'engaged', 'nurturing', 'qualified', 'converted', 'lost'],
    leadNoun: 'practice / clinician',
    complianceNotes: 'B2B selling to clinicians is not PHI-bound, but every shared example, testimonial, or outcome claim still follows therapy-advertising ethics and carries written release.',
  },
  'patient-practice': {
    key: 'patient-practice',
    label: 'Patient path — prospective clients for Christina’s own practice',
    audienceWho: 'prospective therapy clients in the practice’s service area seeking faith-integrated, multicultural care',
    productOrService: 'TLC Therapy Solutions clinical care (individual, couples, family, child & adolescent) — faith-integrated therapy',
    specialtyNoun: 'presenting-need',
    defaultChannels: ['church-network', 'instagram', 'facebook', 'google', 'referral'],
    regions: ['Illinois service area'],
    specialties: ['anxiety', 'grief', 'couples', 'child & adolescent', 'faith integration'],
    tracks: ['patient-outcomes'],
    pricingTiers: ['Insurance (in-network)', 'Self-pay'],
    funnelStages: ['new', 'contacted', 'consult-booked', 'intake-scheduled', 'lost'],
    leadNoun: 'prospective client',
    // The bright line: this path is the most sensitive. It tracks PRE-INTAKE
    // contact-level data ONLY; clinical content lives with the clinician (Acuity),
    // never here. The Practice inquiry lane already enforces this; the patient
    // acquisition path inherits the same wall.
    phiSensitive: true,
    complianceNotes: 'HIGHEST sensitivity. Pre-intake contact-level only — no clinical detail, no PHI, ever. Psychoeducation, not treatment. Consult invites must not imply a clinical relationship before intake. Honors the same Acuity bright line as the Practice inquiry lane.',
  },
};

export function registerAudiencePreset(key, preset) {
  PRESETS[key] = { ...preset, key };
  return PRESETS[key];
}

export function getAudiencePreset(key) {
  return PRESETS[key] || null;
}

export function listAudiencePresets() {
  return Object.values(PRESETS);
}

export const DEFAULT_AUDIENCE_KEY = 'b2b-practices';

// -----------------------------------------------------------------------------
// makeAcquisitionConfig — merge a preset + tenant + overrides into the config the
// stage builders consume. Reusable for any practice / tenant / sector: pass a
// registered preset key (or register one first) and override only what differs.
// -----------------------------------------------------------------------------
export function makeAcquisitionConfig({
  tenant = 'TLC Therapy Solutions',
  audiencePresetKey = DEFAULT_AUDIENCE_KEY,
  overrides = {},
} = {}) {
  const preset = getAudiencePreset(audiencePresetKey) || getAudiencePreset(DEFAULT_AUDIENCE_KEY);
  return {
    tenant,
    audiencePresetKey: preset.key,
    audienceLabel: preset.label,
    audienceWho: preset.audienceWho,
    productOrService: preset.productOrService,
    specialtyNoun: preset.specialtyNoun,
    channels: preset.defaultChannels,
    regions: preset.regions,
    specialties: preset.specialties,
    tracks: preset.tracks,
    pricingTiers: preset.pricingTiers,
    funnelStages: preset.funnelStages,
    leadNoun: preset.leadNoun,
    phiSensitive: !!preset.phiSensitive,
    complianceNotes: preset.complianceNotes,
    ...overrides,
  };
}

// The TLC default — B2B product-customer path, the one the surface leads with.
export const TLC_DEFAULT_CONFIG = makeAcquisitionConfig();

// -----------------------------------------------------------------------------
// buildStageBrief — the human-readable contract for a stage (role, goal,
// guardrails, what it consumes / produces). Deterministic from config.
// -----------------------------------------------------------------------------
export function buildStageBrief(stageKey, config = TLC_DEFAULT_CONFIG) {
  const stage = getStage(stageKey);
  if (!stage) return null;
  return {
    key: stage.key,
    n: stage.n,
    role: stage.role,
    emoji: stage.emoji,
    goal: stage.goal,
    produces: stage.produces,
    producesLabel: stage.producesLabel,
    outputs: stage.outputs,
    guardrails: guardrailsForStage(stageKey),
    audienceLabel: config.audienceLabel,
    tenant: config.tenant,
  };
}

// Tiny mustache-free template filler. Only {{token}} replacement; unknown tokens
// resolve to '' so a missing field never leaks a literal {{token}} into a prompt.
function fillTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] == null ? '' : String(vars[k]))).replace(/\s+/g, ' ').trim();
}

// -----------------------------------------------------------------------------
// buildStagePrompt — render the deterministic instruction the sovereign A.I. runs
// for a stage. The guardrails are appended to EVERY prompt so they ride along on
// every call (you cannot get a draft without the ethical constraints attached).
// `context` may carry prior-stage approved outputs to chain the team.
// -----------------------------------------------------------------------------
export function buildStagePrompt(stageKey, config = TLC_DEFAULT_CONFIG, context = {}) {
  const stage = getStage(stageKey);
  if (!stage) return '';
  const vars = {
    tenant: config.tenant,
    productOrService: config.productOrService,
    audienceWho: config.audienceWho,
    specialtyNoun: config.specialtyNoun,
    channelsList: (config.channels || []).join(', '),
    funnelList: (config.funnelStages || []).join(' → '),
    regionsLine: (config.regions && config.regions.length) ? `Regions of interest: ${config.regions.join(', ')}. ` : '',
    specialtiesLine: (config.specialties && config.specialties.length) ? `Specialties of interest: ${config.specialties.join(', ')}.` : '',
  };
  const body = fillTemplate(stage.promptTemplate, vars);
  const priorLine = context.priorSummary ? `\n\nContext from approved prior stages:\n${context.priorSummary}` : '';
  const guardLines = guardrailsForStage(stageKey).map((g) => `- ${g.label}: ${g.detail}`).join('\n');
  return (
    `${body}${priorLine}\n\n` +
    `Non-negotiable guardrails for this output:\n${guardLines}\n\n` +
    `Return a DRAFT for human review. Mark any factual claim UNVERIFIED if you cannot cite a source.`
  );
}

// =============================================================================
// Guardrail linters — proven-to-catch. screenMarketingClaim flags unethical /
// non-compliant marketing language; flagPotentialPhi flags likely PHI leakage.
// Both are deterministic and pure so a test can prove they CATCH the break.
// =============================================================================

// Each rule: a regex, a severity ('block' must not ship, 'warn' needs a human
// look), a why, and a suggested fix. Ordered roughly by seriousness.
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

// True when the copy is safe to ship (no 'block' findings). 'warn' findings still
// surface for a human but do not hard-block.
export function isClaimShippable(text) {
  return !screenMarketingClaim(text).some((f) => f.severity === 'block');
}

// PHI / clinical-leak heuristics. Honest about being a HEURISTIC: it flags likely
// leakage so a human looks; it defaults to flagging on doubt (errs safe). It is
// NOT a substitute for the structural wall (clinical content lives in Acuity).
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

// =============================================================================
// Lead / funnel model — the CRM core. Leads are real records (see
// practice-leads-sync.js); these helpers are the pure shape + math.
// =============================================================================

export const LEAD_SOURCES = [
  { key: 'youtube', label: 'YouTube' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'google', label: 'Google search' },
  { key: 'content-engine', label: 'Content engine' },
  { key: 'church-network', label: 'Church network' },
  { key: 'clinician-referral', label: 'Clinician referral' },
  { key: 'referral', label: 'Personal referral' },
  { key: 'webinar', label: 'Webinar / event' },
  { key: 'lead-magnet', label: 'Lead magnet' },
  { key: 'other', label: 'Other' },
];

// Display metadata for funnel stages (label + whether the stage counts as a win /
// a loss / in-flight). Keys come from the audience config's funnelStages.
export const FUNNEL_STAGE_META = {
  'new':             { label: 'New',             group: 'active' },
  'contacted':       { label: 'Contacted',       group: 'active' },
  'engaged':         { label: 'Engaged',         group: 'active' },
  'nurturing':       { label: 'Nurturing',       group: 'active' },
  'qualified':       { label: 'Qualified',       group: 'active' },
  'consult-booked':  { label: 'Consult booked',  group: 'active' },
  'intake-scheduled':{ label: 'Intake scheduled',group: 'won' },
  'converted':       { label: 'Converted',       group: 'won' },
  'lost':            { label: 'Lost / no fit',   group: 'lost' },
};

export function funnelStagesFor(config = TLC_DEFAULT_CONFIG) {
  return (config.funnelStages || []).map((k) => ({ key: k, ...(FUNNEL_STAGE_META[k] || { label: k, group: 'active' }) }));
}

export function nextFunnelStage(config, currentKey) {
  const stages = config.funnelStages || [];
  const i = stages.indexOf(currentKey);
  if (i < 0 || i >= stages.length - 1) return null;
  return stages[i + 1];
}

// newLead — the canonical lead shape. `now` / `id` are injectable for tests; at
// runtime they default to Date.now(). NO clinical fields exist on a lead by
// design (the PHI wall is structural, not just a linter).
export function newLead(partial = {}, { now = null, id = null } = {}) {
  const ts = now || new Date().toISOString();
  return {
    id: id || `lead-${(now ? new Date(now).getTime() : Date.now())}-${Math.random().toString(36).slice(2, 7)}`,
    audiencePresetKey: partial.audiencePresetKey || DEFAULT_AUDIENCE_KEY,
    name: partial.name || '',
    org: partial.org || '',
    role: partial.role || '',
    contactMethod: partial.contactMethod || 'email',
    contactValue: partial.contactValue || '',
    source: partial.source || 'other',
    sourceDetail: partial.sourceDetail || '',
    stage: partial.stage || 'new',
    fitScore: partial.fitScore == null ? null : partial.fitScore,
    signalTags: Array.isArray(partial.signalTags) ? partial.signalTags : [],
    notes: partial.notes || '',
    consent: partial.consent || { outreachOk: false, capturedAt: null, note: '' },
    nurtureStep: partial.nurtureStep == null ? 0 : partial.nurtureStep,
    history: Array.isArray(partial.history) ? partial.history : [{ stage: partial.stage || 'new', at: ts }],
    createdAt: partial.createdAt || ts,
    updatedAt: partial.updatedAt || ts,
  };
}

// funnelMetrics — counts per stage + conversion rate over a lead list, scoped to
// a config's funnel. Pure; drives the in-app funnel readout (real data only).
export function funnelMetrics(leads = [], config = TLC_DEFAULT_CONFIG) {
  const stages = config.funnelStages || [];
  const byStage = {};
  for (const k of stages) byStage[k] = 0;
  let won = 0;
  let lost = 0;
  let active = 0;
  let consented = 0;
  for (const lead of leads) {
    const k = lead.stage;
    if (k in byStage) byStage[k] += 1;
    const grp = (FUNNEL_STAGE_META[k] || {}).group;
    if (grp === 'won') won += 1;
    else if (grp === 'lost') lost += 1;
    else active += 1;
    if (lead.consent && lead.consent.outreachOk) consented += 1;
  }
  const closed = won + lost;
  const conversionRate = closed > 0 ? (won / closed) * 100 : 0;
  return { total: leads.length, byStage, won, lost, active, closed, conversionRate, consented };
}

// canOutreach — the consent gate, used before any outreach action is offered.
// Served, not surveilled: no recorded consent => no outreach.
export function canOutreach(lead) {
  return !!(lead && lead.consent && lead.consent.outreachOk);
}

// =============================================================================
// Output / approval model — each stage RUN captures a draft the human approves.
// Stage outputs are working content (device-local in the component); leads are
// the synced CRM object. This keeps the engine pure and the persistence honest.
// =============================================================================

export const OUTPUT_STATUS = ['draft', 'approved', 'archived'];

export function newStageOutput(stageKey, content, { now = null, id = null, audiencePresetKey = DEFAULT_AUDIENCE_KEY } = {}) {
  const ts = now || new Date().toISOString();
  const claimFindings = screenMarketingClaim(content);
  const phiFindings = flagPotentialPhi(content);
  return {
    id: id || `out-${(now ? new Date(now).getTime() : Date.now())}-${Math.random().toString(36).slice(2, 7)}`,
    stageKey,
    audiencePresetKey,
    content: content || '',
    status: 'draft',
    // Captured at creation so the surface can show the human exactly why a draft
    // is blocked or flagged before they approve it.
    claimFindings,
    phiFindings,
    shippable: !claimFindings.some((f) => f.severity === 'block') && phiFindings.length === 0,
    createdAt: ts,
    updatedAt: ts,
    approvedAt: null,
    approvedBy: null,
  };
}

// Whether an output is allowed to be marked approved: it must be free of 'block'
// claim findings and of any PHI finding. 'warn' findings are surfaced but the
// human may approve over them (their call, on the record).
export function canApproveOutput(output) {
  if (!output) return false;
  const blocked = (output.claimFindings || []).some((f) => f.severity === 'block');
  const phi = (output.phiFindings || []).length > 0;
  return !blocked && !phi;
}

// A reality-trace summary for the surface header: what's real right now. No
// painted numbers — every count comes from the passed-in real lists.
export function pipelineSummary(config = TLC_DEFAULT_CONFIG, { leads = [], outputs = [] } = {}) {
  const m = funnelMetrics(leads, config);
  const byStageOutputs = {};
  for (const s of ACQUISITION_STAGES) {
    byStageOutputs[s.key] = {
      total: outputs.filter((o) => o.stageKey === s.key).length,
      approved: outputs.filter((o) => o.stageKey === s.key && o.status === 'approved').length,
    };
  }
  return {
    tenant: config.tenant,
    audienceLabel: config.audienceLabel,
    leads: m.total,
    activeLeads: m.active,
    won: m.won,
    conversionRate: m.conversionRate,
    consented: m.consented,
    outputsByStage: byStageOutputs,
  };
}

// The NAS workflow this surface will POST to once it's wired. Same-origin /n8n
// rewrite per project_n8n_same_origin_rewrite (never the absolute Funnel URL).
// 'commercial' sensitivity for the B2B path (not PHI) so the orchestrator MAY
// escalate; the patient path is phiSensitive and stays local-only.
export const PRACTICE_GROWTH_WEBHOOK = '/n8n/webhook/practice-growth';

export function sensitivityFor(config = TLC_DEFAULT_CONFIG) {
  return config.phiSensitive ? 'clinical-local-only' : 'commercial';
}
