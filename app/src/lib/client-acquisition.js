// =============================================================================
// client-acquisition — the reusable client-growth workflow engine (3-sided)
// =============================================================================
// Declared by Darrell 2026-06-24, extended 2026-06-25. TLC Therapy Solutions is a
// TWO-SIDED MARKETPLACE + ENABLEMENT, not just lead-gen. The same 4-stage "revenue
// agent team" serves THREE audiences, adapting per side:
//
//   1. CLIENT   (demand)  — acquire patients/clients seeking therapy. Healthcare-
//                           marketing ethics: no false outcome claims, no PHI,
//                           consent, psychoeducation-not-treatment.
//   2. THERAPIST (supply) — RECRUIT licensed clinicians (the 1099 therapist
//                           workforce) to serve those clients. Professional
//                           recruiting funnel, credential-aware, match to demand.
//   3. TRAINING  (team)   — onboard + upskill the team via the CE/clinician track
//                           (the TLC dual-track LMS). Industry-standard CE +
//                           patient-outcomes track. Accuracy + validation.
//
// The MARKETPLACE MATCH is the point: don't over-acquire clients without
// therapists to serve them, or vice versa (marketplaceBalance below).
//
// This module is the PURE engine — no React, no Supabase, no localStorage, no
// network. It defines the four stages, the three sides + per-side framing, the
// deterministic prompt builders the sovereign A.I. team runs, the lead/funnel/
// marketplace model, the AUTOMATION (run-the-team orchestration + the
// approve-outbound-only gate + the optional braked cadence), and the ethical
// guardrails (proven-to-catch). Supporting lessons live in lib/tlc-lessons.js.
//
// BINDING GUARDRAILS (encoded as data + linters — DR-0076, proven-to-catch):
//   * Healthcare-marketing (CLIENT): no guaranteed/cure/exaggerated outcomes,
//     no PHI, consent, psychoeducation-not-treatment.
//   * Licensure/credentialing (THERAPIST): claims about the role stay honest;
//     recruiting respects license verification; no guaranteed-income claims.
//   * CE-accuracy + outcomes (TRAINING): no false CE/accreditation claims;
//     content is validated (LCSW/specialist / accredited).
//   * NO PAYMENT PROCESSING by us (money is the owner's hand).
//   * HUMANS APPROVE ANYTHING OUTBOUND. The team auto-PRODUCES research, offers,
//     content, sequences, and draft leads; anything that goes OUT to a real
//     person waits for human approval. This is the key automation line.
// =============================================================================

// -----------------------------------------------------------------------------
// The four stages — the "revenue / client-acquisition agent team." Side-agnostic
// in structure; the per-side framing (config.sideFraming[stageKey]) is woven into
// the prompt so the SAME team works each side honestly.
// -----------------------------------------------------------------------------
export const ACQUISITION_STAGES = [
  {
    key: 'market-signal', n: 1, role: 'Market Signal Researcher', emoji: '🔭',
    goal: 'Identify real demand AND supply: who needs this, where, and what signal proves it.',
    produces: 'signals', producesLabel: 'Market signals', producesKind: 'market-signals',
    outputs: [
      'Underserved segments ranked by need',
      'Search / social / competitor signals that prove it',
      'The single sharpest segment to lead with, and why',
    ],
    guardrailKeys: ['no-phi', 'no-scraping-private'],
    promptTemplate:
      'Act as a Market Signal Researcher for {{tenant}} ({{productOrService}}). ' +
      'Audience: {{audienceWho}}. Goal: surface REAL, verifiable signal — do not invent ' +
      'numbers. {{sideFraming}} For every claim, name the source or mark it UNVERIFIED. ' +
      '{{regionsLine}}{{specialtiesLine}}',
  },
  {
    key: 'offer-architect', n: 2, role: 'Offer Architect', emoji: '🧱',
    goal: 'Design the offer this side actually wants — packaging, tiers, and honest value.',
    produces: 'offers', producesLabel: 'Offer', producesKind: 'offer',
    outputs: [
      'The value proposition for the chosen segment',
      'Packaging + tiers (what each includes)',
      'The honest promise — what is and is not included',
    ],
    guardrailKeys: ['no-outcome-guarantee', 'scope-of-practice', 'no-payment-processing'],
    promptTemplate:
      'Act as an Offer Architect for {{tenant}} ({{productOrService}}). Using the chosen ' +
      'segment from stage 1, design the offer {{audienceWho}} would actually take. Cover the ' +
      'value proposition, packaging, and tiers. {{sideFraming}} HARD RULES: state value ' +
      'honestly — NO guaranteed outcomes, NO cure language, stay inside licensure / scope. ' +
      'Describe price points + what each tier includes, but DO NOT build any payment flow.',
  },
  {
    key: 'content-angle', n: 3, role: 'Content Angle Strategist', emoji: '🎯',
    goal: 'Shape outreach content into clickable, watchable angles for this side.',
    produces: 'angles', producesLabel: 'Content angles', producesKind: 'content-angles',
    outputs: [
      'Hooks / angles per channel',
      'A few title + thumbnail-line options per angle',
      'The honest promise each makes',
    ],
    guardrailKeys: ['no-outcome-guarantee', 'psychoeducation-not-treatment', 'no-phi', 'no-deceptive-funnel'],
    promptTemplate:
      'Act as a Content Angle Strategist for {{tenant}} ({{productOrService}}). Turn the ' +
      'offer from stage 2 into outreach angles that attract {{audienceWho}}. Channels: ' +
      '{{channelsList}}. {{sideFraming}} HARD RULES: educate and invite — for client-facing ' +
      'content, psychoeducation NOT treatment (never diagnose or imply a clinical ' +
      'relationship). No clickbait that misrepresents the offer. No outcome guarantees. No ' +
      'PHI or real client stories without written release.',
  },
  {
    key: 'conversion-system', n: 4, role: 'Conversion System Builder', emoji: '🪝',
    goal: 'Build the lead magnets, follow-up sequences, and intake funnel that land leads in PoeTech.',
    produces: 'sequences', producesLabel: 'Conversion system', producesKind: 'sequence',
    outputs: [
      'Lead magnet(s) matched to the angle (supporting lessons make strong magnets)',
      'A follow-up / nurture sequence (the message DRAFTS, not the sending)',
      'The intake funnel: how a lead enters PoeTech and moves through the stages',
    ],
    guardrailKeys: ['consent-required', 'no-payment-processing', 'no-deceptive-funnel', 'human-approves'],
    promptTemplate:
      'Act as a Conversion System Builder for {{tenant}} ({{productOrService}}). Design the ' +
      'system that converts attention into a tracked lead inside PoeTech. Produce: (a) lead ' +
      'magnet(s) matched to the angle — supporting lessons are strong magnets, (b) a follow-up ' +
      '/ nurture sequence (write the message DRAFTS), and (c) the intake funnel stages ' +
      '{{funnelList}}. {{sideFraming}} HARD RULES: every outreach step requires recorded ' +
      'consent (served, not surveilled). Write the sequence COPY only — do NOT build payment ' +
      'processing or send anything. A human approves before any message goes out.',
  },
];

export const STAGE_KEYS = ACQUISITION_STAGES.map((s) => s.key);
export function getStage(stageKey) { return ACQUISITION_STAGES.find((s) => s.key === stageKey) || null; }

// -----------------------------------------------------------------------------
// Guardrails — the binding list, referenced by key from each stage + each side.
// -----------------------------------------------------------------------------
export const GUARDRAILS = {
  'no-phi': { label: 'No PHI in marketing', detail: 'No protected health information, client-identifying detail, or clinical content in any outreach. Pre-intake / contact-level only.' },
  'no-outcome-guarantee': { label: 'No guaranteed outcomes', detail: 'No promises of cure, "results guaranteed," or exaggerated outcome claims. Therapy-advertising ethics (APA/ACA/NASW) + FTC truthful advertising.' },
  'scope-of-practice': { label: 'Stay in scope / licensure', detail: 'Claims stay inside the clinician’s license and scope of practice; no implied services the practice is not licensed to provide.' },
  'psychoeducation-not-treatment': { label: 'Psychoeducation, not treatment', detail: 'Content educates and invites. It never diagnoses, treats, or implies a clinical relationship before a real intake.' },
  'consent-required': { label: 'Consent / served-not-surveilled', detail: 'Outreach requires recorded consent. We serve people; we never surveil them. Honor opt-out immediately.' },
  'no-payment-processing': { label: 'No payment processing by us', detail: 'Money is the owner’s hand. We produce packaging, price points, sequences, and leads — never transactions.' },
  'no-deceptive-funnel': { label: 'No deceptive funnels', detail: 'No bait-and-switch, fake scarcity, or hooks that misrepresent the offer. The promise on the hook is the promise delivered.' },
  'no-scraping-private': { label: 'No private-data scraping', detail: 'Research uses public signals and consented data only — never scraped private or paywalled personal data.' },
  'human-approves': { label: 'Humans approve outbound', detail: 'The team auto-produces; anything that goes OUT to a real person waits for Christina/Darrell to approve. Nothing auto-sends.' },
  // Side-specific
  'license-verification': { label: 'License verification (therapists)', detail: 'Recruiting verifies license + credentials before match; no guaranteed-income or guaranteed-caseload claims.' },
  'ce-accuracy': { label: 'CE accuracy + validation (training)', detail: 'No false CE / accreditation claims. Training content is LCSW/specialist-validated or accredited before it ships.' },
};
export function guardrailsForStage(stageKey, config = null) {
  const stage = getStage(stageKey);
  if (!stage) return [];
  const keys = [...stage.guardrailKeys, ...((config && config.extraGuardrailKeys) || [])];
  const seen = new Set();
  return keys.filter((k) => GUARDRAILS[k] && !seen.has(k) && seen.add(k)).map((k) => ({ key: k, ...GUARDRAILS[k] }));
}

// =============================================================================
// The three sides — the canonical TLC marketplace audiences. registerSidePreset
// keeps it reusable for any practice / tenant / sector.
// =============================================================================
const PRESETS = {
  client: {
    key: 'client', side: 'demand', label: 'Clients — patients seeking therapy',
    audienceWho: 'prospective therapy clients (and their families) seeking faith-integrated, multicultural care in the service area',
    productOrService: 'TLC Therapy Solutions clinical care (individual, couples, family, child & adolescent) — faith-integrated therapy',
    specialtyNoun: 'presenting-need',
    defaultChannels: ['church-network', 'instagram', 'facebook', 'google', 'referral', 'lead-magnet'],
    regions: ['Illinois service area'], specialties: ['anxiety', 'grief', 'couples', 'child & adolescent', 'faith integration'],
    pricingTiers: ['Insurance (in-network)', 'Self-pay'],
    funnelStages: ['new', 'outreach-ready', 'contacted', 'consult-booked', 'intake-scheduled', 'lost'],
    leadNoun: 'prospective client', leadNounPlural: 'clients',
    phiSensitive: true, extraGuardrailKeys: ['psychoeducation-not-treatment'],
    complianceNotes: 'HIGHEST sensitivity. Pre-intake / contact-level only — no clinical detail, no PHI, ever. Psychoeducation, not treatment. Consult invites must not imply a clinical relationship before intake.',
    sideFraming: {
      'market-signal': 'This is the DEMAND side: find where people seeking therapy are underserved (specialty, language, faith fit, region) and what they search for in their own words.',
      'offer-architect': 'Package the CLIENT-facing services (the patient-outcomes track) and the consult on-ramp. Insurance + self-pay framing, honest about fit.',
      'content-angle': 'Client-facing content is PSYCHOEDUCATION — it helps people understand their situation and invites a consult; it never diagnoses or treats.',
      'conversion-system': 'The funnel ends at a booked consult / scheduled intake. Supporting psychoeducation lessons are the lead magnet + retention engine.',
    },
  },
  therapist: {
    key: 'therapist', side: 'supply', label: 'Therapists — recruit clinicians to serve clients',
    audienceWho: 'licensed therapists / clinicians (LCSW, LCPC, multicultural & faith-integrated specialists) who could serve TLC clients as 1099 providers',
    productOrService: 'a 1099 clinician role at TLC Therapy Solutions — flexible, mission-aligned, multicultural, faith-aware, with a real client pipeline + a supportive team',
    specialtyNoun: 'clinical specialty',
    defaultChannels: ['linkedin', 'clinician-referral', 'content-engine', 'church-network', 'job-boards'],
    regions: ['Illinois', 'telehealth-eligible states'], specialties: ['multicultural therapy', 'faith integration', 'child & adolescent', 'couples & family'],
    pricingTiers: ['Per-session 1099', 'Caseload commitment'],
    funnelStages: ['new', 'outreach-ready', 'contacted', 'screening', 'credential-check', 'matched', 'onboarding', 'active', 'lost'],
    leadNoun: 'clinician', leadNounPlural: 'therapists',
    phiSensitive: false, extraGuardrailKeys: ['license-verification'],
    complianceNotes: 'Recruiting funnel. Verify license + credentials before match. No guaranteed-income or guaranteed-caseload claims. Honest about the 1099 relationship + the mission.',
    sideFraming: {
      'market-signal': 'This is the SUPPLY side: find where licensed clinicians (esp. multicultural / faith-integrated) are looking for flexible, mission-aligned work, and what they want from a practice.',
      'offer-architect': 'Package WHY JOIN TLC: the role, the client pipeline, the team + training, the flexibility — honestly, with no guaranteed income.',
      'content-angle': 'Therapist-facing content speaks clinician-to-clinician: the mission, the support, the real caseload — respectful and accurate, never overstated.',
      'conversion-system': 'The funnel runs to screening + credential-check + match. Onboarding lessons (the CE track) are part of the offer.',
    },
  },
  training: {
    key: 'training', side: 'enablement', label: 'Training — CE / clinician training for the team',
    audienceWho: 'therapists on (or joining) the TLC team who need continuing-education (CE) + onboarding via the dual-track LMS, plus clinicians anywhere seeking quality CE',
    productOrService: 'the TLC dual-track LMS: industry-standard continuing-education (CE) for clinicians + the patient-outcomes training track',
    specialtyNoun: 'training-need',
    defaultChannels: ['content-engine', 'clinician-referral', 'linkedin', 'webinar'],
    regions: ['online / anywhere'], specialties: ['faith-integrated care', 'multicultural competency', 'documentation & ethics', 'outcomes measurement'],
    pricingTiers: ['Included for TLC clinicians', 'Open CE enrollment'],
    funnelStages: ['new', 'outreach-ready', 'contacted', 'enrolled', 'in-progress', 'completed', 'lost'],
    leadNoun: 'trainee', leadNounPlural: 'trainees',
    phiSensitive: false, extraGuardrailKeys: ['ce-accuracy'],
    complianceNotes: 'No false CE / accreditation claims. Content is LCSW/specialist-validated or accredited before it ships. Ties the dual-track LMS (CE + patient-outcomes).',
    sideFraming: {
      'market-signal': 'Find the CE + onboarding NEEDS of the team and the wider clinician market (required hours, topics, faith-integration gap, multicultural competency demand).',
      'offer-architect': 'Package the CE offering + the onboarding track. Be exact about CE credits + accreditation status; do not overstate.',
      'content-angle': 'Training content demonstrates competence: a real, useful CE preview that earns enrollment — accurate, validated, never inflated.',
      'conversion-system': 'The funnel runs to enrollment + completion. The supporting CE lessons ARE the product; the preview is the magnet.',
    },
  },
};

export function registerSidePreset(key, preset) { PRESETS[key] = { ...preset, key }; return PRESETS[key]; }
export function getSidePreset(key) { return PRESETS[key] || null; }
export function listSidePresets() { return Object.values(PRESETS); }
export const SIDE_KEYS = ['client', 'therapist', 'training'];
export const DEFAULT_SIDE_KEY = 'client';

// Back-compat aliases (the original two-preset API name).
export const registerAudiencePreset = registerSidePreset;
export const getAudiencePreset = getSidePreset;
export const listAudiencePresets = listSidePresets;
export const DEFAULT_AUDIENCE_KEY = DEFAULT_SIDE_KEY;

// -----------------------------------------------------------------------------
// makeAcquisitionConfig — merge a side preset + tenant + overrides into the config
// the stage builders consume. `sideKey` (canonical) or `audiencePresetKey` (alias).
// -----------------------------------------------------------------------------
export function makeAcquisitionConfig({ tenant = 'TLC Therapy Solutions', sideKey = null, audiencePresetKey = null, overrides = {} } = {}) {
  const key = sideKey || audiencePresetKey || DEFAULT_SIDE_KEY;
  const preset = getSidePreset(key) || getSidePreset(DEFAULT_SIDE_KEY);
  return {
    tenant,
    sideKey: preset.key,
    audiencePresetKey: preset.key, // alias kept for the CRM column + back-compat
    side: preset.side,
    audienceLabel: preset.label,
    audienceWho: preset.audienceWho,
    productOrService: preset.productOrService,
    specialtyNoun: preset.specialtyNoun,
    channels: preset.defaultChannels,
    regions: preset.regions,
    specialties: preset.specialties,
    pricingTiers: preset.pricingTiers,
    funnelStages: preset.funnelStages,
    leadNoun: preset.leadNoun,
    leadNounPlural: preset.leadNounPlural,
    phiSensitive: !!preset.phiSensitive,
    extraGuardrailKeys: preset.extraGuardrailKeys || [],
    complianceNotes: preset.complianceNotes,
    sideFraming: preset.sideFraming || {},
    ...overrides,
  };
}

export const TLC_DEFAULT_CONFIG = makeAcquisitionConfig();
export function configForSide(sideKey) { return makeAcquisitionConfig({ sideKey }); }

// -----------------------------------------------------------------------------
// Brief + prompt builders. The side framing + guardrails ride along on every call.
// -----------------------------------------------------------------------------
export function buildStageBrief(stageKey, config = TLC_DEFAULT_CONFIG) {
  const stage = getStage(stageKey);
  if (!stage) return null;
  return {
    key: stage.key, n: stage.n, role: stage.role, emoji: stage.emoji, goal: stage.goal,
    produces: stage.produces, producesLabel: stage.producesLabel, producesKind: stage.producesKind,
    outputs: stage.outputs, guardrails: guardrailsForStage(stageKey, config),
    audienceLabel: config.audienceLabel, tenant: config.tenant, sideKey: config.sideKey,
  };
}

function fillTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] == null ? '' : String(vars[k]))).replace(/\s+/g, ' ').trim();
}

export function buildStagePrompt(stageKey, config = TLC_DEFAULT_CONFIG, context = {}) {
  const stage = getStage(stageKey);
  if (!stage) return '';
  const vars = {
    tenant: config.tenant, productOrService: config.productOrService, audienceWho: config.audienceWho,
    specialtyNoun: config.specialtyNoun, channelsList: (config.channels || []).join(', '),
    funnelList: (config.funnelStages || []).join(' → '),
    sideFraming: (config.sideFraming && config.sideFraming[stageKey]) || '',
    regionsLine: (config.regions && config.regions.length) ? `Regions of interest: ${config.regions.join(', ')}. ` : '',
    specialtiesLine: (config.specialties && config.specialties.length) ? `Specialties of interest: ${config.specialties.join(', ')}.` : '',
  };
  const body = fillTemplate(stage.promptTemplate, vars);
  const priorLine = context.priorSummary ? `\n\nContext from approved prior stages:\n${context.priorSummary}` : '';
  const guardLines = guardrailsForStage(stageKey, config).map((g) => `- ${g.label}: ${g.detail}`).join('\n');
  return `${body}${priorLine}\n\nNon-negotiable guardrails for this output:\n${guardLines}\n\nReturn a DRAFT for human review. Mark any factual claim UNVERIFIED if you cannot cite a source.`;
}

// =============================================================================
// Guardrail linters — proven-to-catch (DR-0076).
// =============================================================================
const CLAIM_RULES = [
  { re: /\b(guarantee[ds]?|guaranteed results?|results guaranteed)\b/i, severity: 'block', why: 'Guaranteeing therapy results is prohibited by therapy-advertising ethics and FTC rules.', fix: 'Describe the process and what clients typically work toward — never a guaranteed result.' },
  { re: /\b(cure[sd]?|will cure|curing)\b/i, severity: 'block', why: 'Claiming to "cure" implies a guaranteed clinical outcome and overstates scope.', fix: 'Use "support," "help with," or "work through" instead of "cure."' },
  { re: /\b(100%|completely|fully)\s+(effective|successful|cured|healed)\b/i, severity: 'block', why: 'Absolute effectiveness claims are exaggerated outcome claims.', fix: 'Drop the absolute; describe the approach honestly.' },
  { re: /\bproven to (cure|fix|heal|eliminate)\b/i, severity: 'block', why: '"Proven to cure/heal" is an unsupported outcome claim.', fix: 'Cite real evidence for the METHOD, not a promised outcome.' },
  { re: /\b(no[- ]risk|risk[- ]free|zero risk)\b/i, severity: 'block', why: 'Therapy is not risk-free; the claim is misleading.', fix: 'Be honest about fit and the consultation step.' },
  { re: /\bguaranteed (income|caseload|clients?|salary)\b/i, severity: 'block', why: 'Guaranteed income/caseload claims to recruits are misleading and create liability.', fix: 'Describe the real pipeline + 1099 terms honestly.' },
  { re: /(?:#1|\b(?:number one|best|top[- ]rated|leading))\s+(?:therapist|practice|counsel(?:or|ing)|clinic)\b/i, severity: 'warn', why: 'Superlative ranking claims need objective substantiation or they mislead.', fix: 'Replace with a specific, true differentiator.' },
  { re: /\b(instant|overnight|quick fix|fast results?|rapid results?)\b/i, severity: 'warn', why: 'Implying speed of outcome misrepresents the therapeutic process.', fix: 'Set honest expectations about the work and timeline.' },
  { re: /\b\d{1,3}%\s+(of (clients|patients|people)|success rate|recover)/i, severity: 'warn', why: 'A success-rate statistic must be sourced or it is fabricated proof.', fix: 'Cite the real source, or remove the statistic.' },
  { re: /\b(fix|save) your (marriage|relationship|life|child)\b/i, severity: 'warn', why: 'Promising to fix/save a specific outcome is an implied guarantee.', fix: 'Offer support and a path, not a promised rescue.' },
  { re: /\b(accredited|CE credits?|continuing education)\b[^.]*\b(guaranteed|approved by all|every state)\b/i, severity: 'warn', why: 'CE / accreditation claims must be exact and verifiable per accrediting body + state.', fix: 'State the specific accreditation + which boards/states accept it.' },
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
export function isClaimShippable(text) { return !screenMarketingClaim(text).some((f) => f.severity === 'block'); }

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
  for (const rule of PHI_RULES) { const m = t.match(rule.re); if (m) findings.push({ term: m[0], why: rule.why }); }
  return findings;
}

// =============================================================================
// Lead / funnel / marketplace model.
// =============================================================================
export const LEAD_SOURCES = [
  { key: 'youtube', label: 'YouTube' }, { key: 'linkedin', label: 'LinkedIn' },
  { key: 'instagram', label: 'Instagram' }, { key: 'facebook', label: 'Facebook' },
  { key: 'google', label: 'Google search' }, { key: 'content-engine', label: 'Content engine' },
  { key: 'church-network', label: 'Church network' }, { key: 'clinician-referral', label: 'Clinician referral' },
  { key: 'job-boards', label: 'Job boards' }, { key: 'referral', label: 'Personal referral' },
  { key: 'webinar', label: 'Webinar / event' }, { key: 'lead-magnet', label: 'Lead magnet (lesson)' },
  { key: 'run-the-team', label: 'Run-the-team (A.I.)' }, { key: 'other', label: 'Other' },
];

// Funnel stage metadata. `group`: active | won | lost. `requiresOutbound`: reaching
// this stage means a message went OUT to a real person — so it is gated behind
// human approval and can NEVER be auto-entered (the approve-outbound-only line).
export const FUNNEL_STAGE_META = {
  'new':              { label: 'New',              group: 'active', requiresOutbound: false },
  'outreach-ready':   { label: 'Outreach ready',   group: 'active', requiresOutbound: false }, // auto-advance target (internal)
  'contacted':        { label: 'Contacted',        group: 'active', requiresOutbound: true },
  'consult-booked':   { label: 'Consult booked',   group: 'active', requiresOutbound: true },
  'intake-scheduled': { label: 'Intake scheduled', group: 'won',    requiresOutbound: true },
  'screening':        { label: 'Screening',        group: 'active', requiresOutbound: true },
  'credential-check': { label: 'Credential check', group: 'active', requiresOutbound: true },
  'matched':          { label: 'Matched',          group: 'active', requiresOutbound: true },
  'onboarding':       { label: 'Onboarding',       group: 'active', requiresOutbound: true },
  'active':           { label: 'Active',           group: 'won',    requiresOutbound: true },
  'enrolled':         { label: 'Enrolled',         group: 'active', requiresOutbound: true },
  'in-progress':      { label: 'In progress',      group: 'active', requiresOutbound: true },
  'completed':        { label: 'Completed',        group: 'won',    requiresOutbound: true },
  'lost':             { label: 'Lost / no fit',    group: 'lost',   requiresOutbound: false },
};

export function funnelStagesFor(config = TLC_DEFAULT_CONFIG) {
  return (config.funnelStages || []).map((k) => ({ key: k, ...(FUNNEL_STAGE_META[k] || { label: k, group: 'active', requiresOutbound: true }) }));
}
export function nextFunnelStage(config, currentKey) {
  const stages = config.funnelStages || [];
  const i = stages.indexOf(currentKey);
  return (i < 0 || i >= stages.length - 1) ? null : stages[i + 1];
}
export function stageRequiresOutbound(stageKey) { return !!(FUNNEL_STAGE_META[stageKey] && FUNNEL_STAGE_META[stageKey].requiresOutbound); }

export function newLead(partial = {}, { now = null, id = null } = {}) {
  const ts = now || new Date().toISOString();
  const sideKey = partial.sideKey || partial.audiencePresetKey || DEFAULT_SIDE_KEY;
  return {
    id: id || `lead-${(now ? new Date(now).getTime() : Date.now())}-${Math.random().toString(36).slice(2, 7)}`,
    sideKey, audiencePresetKey: sideKey, // CRM column alias
    name: partial.name || '', org: partial.org || '', role: partial.role || '',
    contactMethod: partial.contactMethod || 'email', contactValue: partial.contactValue || '',
    source: partial.source || 'other', sourceDetail: partial.sourceDetail || '',
    stage: partial.stage || 'new', fitScore: partial.fitScore == null ? null : partial.fitScore,
    signalTags: Array.isArray(partial.signalTags) ? partial.signalTags : [],
    notes: partial.notes || '',
    consent: partial.consent || { outreachOk: false, capturedAt: null, note: '' },
    nurtureStep: partial.nurtureStep == null ? 0 : partial.nurtureStep,
    history: Array.isArray(partial.history) ? partial.history : [{ stage: partial.stage || 'new', at: ts }],
    createdAt: partial.createdAt || ts, updatedAt: partial.updatedAt || ts,
  };
}

export function funnelMetrics(leads = [], config = TLC_DEFAULT_CONFIG) {
  const stages = config.funnelStages || [];
  const byStage = {}; for (const k of stages) byStage[k] = 0;
  let won = 0, lost = 0, active = 0, consented = 0;
  for (const lead of leads) {
    if (lead.stage in byStage) byStage[lead.stage] += 1;
    const grp = (FUNNEL_STAGE_META[lead.stage] || {}).group;
    if (grp === 'won') won += 1; else if (grp === 'lost') lost += 1; else active += 1;
    if (lead.consent && lead.consent.outreachOk) consented += 1;
  }
  const closed = won + lost;
  return { total: leads.length, byStage, won, lost, active, closed, conversionRate: closed > 0 ? (won / closed) * 100 : 0, consented };
}

export function canOutreach(lead) { return !!(lead && lead.consent && lead.consent.outreachOk); }

// -----------------------------------------------------------------------------
// marketplaceBalance — the two-sided match. Don't over-acquire one side. Compares
// active CLIENT demand against THERAPIST serving capacity and recommends which
// side to push. Pure; drives the in-app balance banner from real lead lists.
// -----------------------------------------------------------------------------
export const CASELOAD_PER_THERAPIST = 25; // active clients one 1099 clinician can hold (tunable)

export function marketplaceBalance(leads = [], { caseloadPerTherapist = CASELOAD_PER_THERAPIST } = {}) {
  const clientCfg = configForSide('client');
  const therapistCfg = configForSide('therapist');
  const sideOf = (l) => l.sideKey || l.audiencePresetKey;
  const clientLeads = leads.filter((l) => sideOf(l) === 'client');
  const therapistLeads = leads.filter((l) => sideOf(l) === 'therapist');
  // Active client demand = client leads still in flight (active group) or booked/scheduled.
  const clientsActive = clientLeads.filter((l) => (FUNNEL_STAGE_META[l.stage] || {}).group === 'active' || ['consult-booked', 'intake-scheduled'].includes(l.stage)).length;
  // Serving therapists = matched / onboarding / active.
  const therapistsServing = therapistLeads.filter((l) => ['matched', 'onboarding', 'active'].includes(l.stage)).length;
  const capacity = therapistsServing * caseloadPerTherapist;
  const gap = clientsActive - capacity; // >0 => need more therapists; <0 => spare capacity
  let recommend = 'balanced';
  let message;
  if (therapistsServing === 0 && clientsActive > 0) {
    recommend = 'recruit-therapists';
    message = `${clientsActive} client(s) in the pipeline and no serving therapists yet — recruit therapists before acquiring more clients.`;
  } else if (gap > 0) {
    recommend = 'recruit-therapists';
    message = `Demand exceeds capacity by ~${gap} (${clientsActive} active clients vs ~${capacity} slots). Push the THERAPIST side.`;
  } else if (capacity > 0 && clientsActive < capacity * 0.5) {
    recommend = 'acquire-clients';
    message = `Spare capacity (~${capacity} slots, ${clientsActive} active clients). Push the CLIENT side to fill therapists.`;
  } else {
    message = `Balanced: ~${clientsActive} active clients vs ~${capacity} serving slots.`;
  }
  return { clientsActive, therapistsServing, capacity, gap, recommend, message, caseloadPerTherapist,
    labels: { client: clientCfg.leadNounPlural, therapist: therapistCfg.leadNounPlural } };
}

// =============================================================================
// Output / approval model — stage RUN outputs the human approves.
// =============================================================================
export const OUTPUT_STATUS = ['draft', 'approved', 'archived'];

export function newStageOutput(stageKey, content, { now = null, id = null, sideKey = DEFAULT_SIDE_KEY, audiencePresetKey = null, runId = null } = {}) {
  const ts = now || new Date().toISOString();
  const side = sideKey || audiencePresetKey || DEFAULT_SIDE_KEY;
  const claimFindings = screenMarketingClaim(content);
  const phiFindings = flagPotentialPhi(content);
  const stage = getStage(stageKey);
  return {
    id: id || `out-${(now ? new Date(now).getTime() : Date.now())}-${Math.random().toString(36).slice(2, 7)}`,
    stageKey, sideKey: side, audiencePresetKey: side, runId,
    kind: stage ? stage.producesKind : 'output',
    content: content || '', status: 'draft', claimFindings, phiFindings,
    shippable: !claimFindings.some((f) => f.severity === 'block') && phiFindings.length === 0,
    createdAt: ts, updatedAt: ts, approvedAt: null, approvedBy: null,
  };
}
export function canApproveOutput(output) {
  if (!output) return false;
  return !(output.claimFindings || []).some((f) => f.severity === 'block') && !((output.phiFindings || []).length > 0);
}

// =============================================================================
// AUTOMATION — "this seems like a job; automate it." One trigger runs the whole
// team; the team auto-PRODUCES; only OUTBOUND waits for a human.
// =============================================================================

// Artifact kinds the team produces, and which ones are OUTBOUND (go to a real
// person) vs INTERNAL (research/offers/content/sequence drafts/draft leads). The
// approve-outbound-only gate keys off this.
export const OUTBOUND_KINDS = ['outreach-message', 'published-content', 'nurture-send'];
export function isOutbound(kind) { return OUTBOUND_KINDS.includes(kind); }

// buildRunPlan — the ordered steps a single "Run the team" executes for a side.
export function buildRunPlan(config = TLC_DEFAULT_CONFIG) {
  return ACQUISITION_STAGES.map((s) => ({
    stageKey: s.key, n: s.n, role: s.role, emoji: s.emoji, producesKind: s.producesKind, sideKey: config.sideKey,
  }));
}

// summarizeForChain — fold produced/approved outputs into the priorSummary that
// feeds the NEXT stage, so one run chains end-to-end (each output → next input).
export function summarizeForChain(outputs = []) {
  if (!outputs.length) return '';
  return outputs.map((o) => {
    const s = getStage(o.stageKey);
    return `[${s ? s.role : o.stageKey}] ${(o.content || '').slice(0, 500)}`;
  }).join('\n');
}

// newRun — a run record: per-stage status, the chained outputs, overall status.
export function newRun(config = TLC_DEFAULT_CONFIG, { now = null, id = null } = {}) {
  const ts = now || new Date().toISOString();
  return {
    id: id || `run-${(now ? new Date(now).getTime() : Date.now())}-${Math.random().toString(36).slice(2, 7)}`,
    sideKey: config.sideKey, tenant: config.tenant, startedAt: ts, finishedAt: null,
    status: 'pending', // pending | running | produced | needs-capture | error | killed
    killed: false,
    trigger: 'manual', // manual | cadence (cadence ships inert — see CADENCE_DEFAULT)
    steps: buildRunPlan(config).map((p) => ({ ...p, status: 'pending', outputId: null, message: '', rationale: '' })),
    events: [], // live observability reel — appended via pushRunEvent
    summary: null,
  };
}
export function setRunStep(run, stageKey, patch) {
  return { ...run, steps: run.steps.map((s) => (s.stageKey === stageKey ? { ...s, ...patch } : s)) };
}
export function runOverallStatus(run) {
  const steps = (run && run.steps) || [];
  if (!steps.length) return 'pending';
  if (steps.some((s) => s.status === 'error')) return 'error';
  if (steps.every((s) => s.status === 'produced')) return 'produced';
  if (steps.some((s) => s.status === 'needs-capture')) return 'needs-capture';
  if (steps.some((s) => s.status === 'running')) return 'running';
  return 'pending';
}

// -----------------------------------------------------------------------------
// Pipeline auto-flow. autoAdvanceLead moves a lead ONLY across internal stages
// (new → outreach-ready). It can NEVER cross the outbound boundary — entering a
// requiresOutbound stage happens only via approveOutbound (a human).
// -----------------------------------------------------------------------------
export function autoAdvanceLead(lead, config = TLC_DEFAULT_CONFIG) {
  if (!lead) return null;
  const next = nextFunnelStage(config, lead.stage);
  if (!next) return null;
  if (stageRequiresOutbound(next)) return null; // brake: don't auto-cross outbound
  return next;
}

// newOutboundItem — a drafted message queued for human approval BEFORE it goes to
// a real person. It references the lead + channel + draft copy. It is the ONLY
// thing that can advance a lead into an outbound stage. Nothing here sends.
export function newOutboundItem({ leadId, sideKey, channel = 'email', subject = '', body = '', runId = null }, { now = null, id = null } = {}) {
  const ts = now || new Date().toISOString();
  const claimFindings = screenMarketingClaim(`${subject}\n${body}`);
  const phiFindings = flagPotentialPhi(`${subject}\n${body}`);
  return {
    id: id || `ob-${(now ? new Date(now).getTime() : Date.now())}-${Math.random().toString(36).slice(2, 7)}`,
    kind: 'outreach-message', leadId, sideKey: sideKey || DEFAULT_SIDE_KEY, runId,
    channel, subject, body, status: 'pending', // pending | approved | rejected
    claimFindings, phiFindings,
    blocked: claimFindings.some((f) => f.severity === 'block') || phiFindings.length > 0,
    createdAt: ts, approvedAt: null, approvedBy: null,
  };
}
// An outbound item may be approved only if the lead has consent AND there is no
// blocking guardrail finding. Returns { ok, reasons }.
export function canApproveOutbound(outboundItem, lead) {
  const reasons = [];
  if (!outboundItem) return { ok: false, reasons: ['No item.'] };
  if (outboundItem.blocked) reasons.push('Guardrail violation in the message (resolve before sending).');
  if (!canOutreach(lead)) reasons.push('No recorded outreach consent on this lead (served, not surveilled).');
  return { ok: reasons.length === 0, reasons };
}

// =============================================================================
// OPTIONAL CONTINUOUS CADENCE — ships INERT. A scheduled auto-run lives BEHIND
// the three brakes (budget + concurrency lock + kill-switch) PLUS an explicit arm
// that only Darrell sets. Mirrors orchestrator-handoff's default-deny gate.
// =============================================================================
export const CADENCE_DEFAULT = Object.freeze({
  enabled: false,   // the feature toggle (off)
  armed: false,     // Darrell's explicit arm (off) — the dead-man's arm
  intervalHours: 24,
  scope: ['market-signal'], // what a cadence run refreshes (signals only by default)
  sides: ['client', 'therapist'],
  budget: { capUsd: 0, spentUsd: 0 }, // a ceiling must be set to run
});

// evaluateCadenceGate — default-DENY. Returns { allowed, reasons }. Allowed ONLY
// when the feature is enabled AND armed AND every brake permits. `brakes` is the
// real Cage state (lib/wake-orchestrator normalizeWakeState .brakes) or null.
export function evaluateCadenceGate(cadence = CADENCE_DEFAULT, brakes = null) {
  const reasons = [];
  const c = cadence || CADENCE_DEFAULT;
  if (!c.enabled) reasons.push('Cadence disabled (on-demand only).');
  if (!c.armed) reasons.push('Not armed — only Darrell arms continuous runs.');
  if (!c.budget || !(c.budget.capUsd > 0)) reasons.push('No budget ceiling set.');
  else if (c.budget.spentUsd >= c.budget.capUsd) reasons.push('Budget cap reached.');
  if (!brakes) reasons.push('Orchestrator not connected — cannot verify the brakes.');
  else {
    if (brakes.killSwitch && brakes.killSwitch !== 'clear') reasons.push('Kill-switch engaged (master stop).');
    if (brakes.armed !== true) reasons.push('Engine is disarmed.');
    if (brakes.concurrencyLock === 'held') reasons.push('A run is already in progress (concurrency lock held).');
  }
  return { allowed: reasons.length === 0, reasons };
}
export function cadenceStatusLabel(cadence = CADENCE_DEFAULT, brakes = null) {
  const gate = evaluateCadenceGate(cadence, brakes);
  if (gate.allowed) return `Armed — refreshes every ${cadence.intervalHours}h (still approves outbound).`;
  return `Inert / on-demand. ${gate.reasons[0] || ''}`.trim();
}

// =============================================================================
// Reality-trace summary + the webhook seam.
// =============================================================================
export function pipelineSummary(config = TLC_DEFAULT_CONFIG, { leads = [], outputs = [] } = {}) {
  const m = funnelMetrics(leads, config);
  const byStageOutputs = {};
  for (const s of ACQUISITION_STAGES) {
    byStageOutputs[s.key] = {
      total: outputs.filter((o) => o.stageKey === s.key).length,
      approved: outputs.filter((o) => o.stageKey === s.key && o.status === 'approved').length,
    };
  }
  return { tenant: config.tenant, audienceLabel: config.audienceLabel, sideKey: config.sideKey,
    leads: m.total, activeLeads: m.active, won: m.won, conversionRate: m.conversionRate, consented: m.consented, outputsByStage: byStageOutputs };
}

// Same-origin /n8n rewrite per project_n8n_same_origin_rewrite (never the Funnel URL).
export const PRACTICE_GROWTH_WEBHOOK = '/n8n/webhook/practice-growth';
export function sensitivityFor(config = TLC_DEFAULT_CONFIG) { return config.phiSensitive ? 'health-marketing-local-only' : 'commercial'; }

// =============================================================================
// COCKPIT + OBSERVABILITY + RUN BRAKES (added 2026-06-25, declared by Darrell:
// "intuitive + DO the work + report on it — WHY it did what it did, with metrics").
// All pure. Three jobs:
//   1. Make the run OBSERVABLE — a live state, the current stage, what it produced.
//   2. Make every step carry its DECISION RATIONALE — "did X, not Y, because Z."
//   3. Put the on-demand run BEHIND THE THREE BRAKES — budget cap + single-flight
//      lock + kill-switch — even though a human triggers it. Bounded by design.
// =============================================================================

// --- 1. RUN STATE READOUT (the cockpit reads these) --------------------------
export const RUN_STATUSES = ['pending', 'running', 'produced', 'needs-capture', 'error', 'killed'];

export function runStageInProgress(run) {
  return ((run && run.steps) || []).find((s) => s.status === 'running') || null;
}
export function runProgress(run) {
  const steps = (run && run.steps) || [];
  const done = steps.filter((s) => ['produced', 'needs-capture', 'error'].includes(s.status)).length;
  return { done, total: steps.length };
}
export function runStatusLabel(run) {
  if (!run) return 'Idle — no run yet this session. Press Run the team to start.';
  if (run.killed) return 'Stopped — the run was halted (kill-switch / Stop). Nothing was sent.';
  const st = run.status || runOverallStatus(run);
  const cur = runStageInProgress(run);
  const { done, total } = runProgress(run);
  if (cur) return `Running ${cur.emoji} ${cur.role} — stage ${cur.n} of ${total}…`;
  if (st === 'produced') return `Done — produced ${done} of ${total} drafts for your review. Nothing sent.`;
  if (st === 'needs-capture') return `Done — ${done} of ${total} stages handed you a prompt to run (sovereign A.I. pending). No fake output.`;
  if (st === 'error') return 'Finished with an error in a stage — see the run log below.';
  if (st === 'running') return 'Running…';
  return 'Ready.';
}
// A short, plain phase token for a status chip: idle | running | review | capture | stopped | error.
export function runPhase(run) {
  if (!run) return 'idle';
  if (run.killed) return 'stopped';
  if (runStageInProgress(run)) return 'running';
  const st = run.status || runOverallStatus(run);
  if (st === 'produced') return 'review';
  if (st === 'needs-capture') return 'capture';
  if (st === 'error') return 'error';
  if (st === 'running') return 'running';
  return 'idle';
}

// --- 2. DECISION + RATIONALE (decisions-with-rationale: did X, not Y, because Z)
// Every step records WHY it did what it did, so the report can show the reasoning,
// not just the outcome. `mode` is the step's resolved status.
export function stepRationale(stageKey, mode, { live = false } = {}) {
  const stage = getStage(stageKey);
  const role = stage ? stage.role : stageKey;
  const produces = stage ? stage.producesLabel.toLowerCase() : 'output';
  switch (mode) {
    case 'produced':
      return {
        did: `Drafted the ${produces}${live ? ' on the live sovereign-A.I. workflow (wf-practice-growth)' : ''}.`,
        why: 'The prior approved stages gave this stage what it needed, so the team produced the next artifact in the chain.',
        not: 'It did NOT send anything to a real person — every outbound step waits for your approval.',
      };
    case 'needs-capture':
      return {
        did: `Handed you the exact deterministic prompt for the ${role}.`,
        why: 'The sovereign-A.I. workflow (wf-practice-growth) is pending infrastructure and returned nothing.',
        not: 'It did NOT fabricate an A.I. result (DR-0076: no fake output) — you run the prompt and paste the real draft.',
      };
    case 'budget-halt':
      return {
        did: 'Stopped this stage before running it.',
        why: 'The run hit its budget ceiling (stage-call cap) — a brake, not a failure.',
        not: 'It did NOT keep spending past the cap. Raise the budget or reset it to continue.',
      };
    case 'killed':
      return {
        did: 'Stopped mid-run.',
        why: 'The Stop control or the kill-switch was engaged.',
        not: 'It did NOT auto-continue or send anything. Nothing left the system.',
      };
    case 'error':
      return {
        did: `Could not complete the ${role}.`,
        why: 'The stage call failed (network or workflow error) — surfaced honestly, not hidden.',
        not: 'It did NOT invent a result to paper over the failure.',
      };
    default:
      return { did: '', why: '', not: '' };
  }
}
export function rationaleText(r) {
  if (!r) return '';
  return [r.did, r.why, r.not].filter(Boolean).join(' ');
}

// --- 3. RUN EVENT REEL (live observability — one line per thing that happened) -
export const RUN_EVENT_TYPES = [
  'run-started', 'stage-started', 'stage-produced', 'stage-needs-capture', 'stage-error',
  'lead-landed', 'outbound-queued', 'budget-halt', 'run-killed', 'run-finished',
];
export function runEvent(type, detail = '', { now = null } = {}) {
  return { ts: now || new Date().toISOString(), type, detail };
}
export function pushRunEvent(run, type, detail = '', opts = {}) {
  return { ...run, events: [...((run && run.events) || []), runEvent(type, detail, opts)] };
}

// --- 4. THE THREE BRAKES for the on-demand run -------------------------------
// The run is human-triggered, but it still chains real A.I. calls — so it is
// bounded the same way the autonomous cadence is (budget + lock + kill-switch).
export const RUN_COST_PER_STAGE = 1; // budget unit = one real stage-call (honest, counted)
export const RUN_BUDGET_DEFAULT = Object.freeze({ capCalls: 200, usedCalls: 0 });
export const RUN_LOCK_STALE_MS = 10 * 60 * 1000; // dead-man: a lock older than 10 min is stale

export function newRunLock() { return { held: false, runId: null, startedAt: null }; }
export function acquireRunLock(runId, { now = null } = {}) {
  return { held: true, runId, startedAt: now || new Date().toISOString() };
}
export function releaseRunLock() { return { held: false, runId: null, startedAt: null }; }
export function isLockStale(lock, { now = null, maxMs = RUN_LOCK_STALE_MS } = {}) {
  if (!lock || !lock.held || !lock.startedAt) return false;
  const t = new Date(lock.startedAt).getTime();
  if (!isFinite(t)) return true; // unparseable timestamp = treat as stale (dead-man)
  const ref = now ? new Date(now).getTime() : Date.now();
  return (ref - t) > maxMs;
}
export function budgetRemaining(budget = RUN_BUDGET_DEFAULT) {
  const b = budget || RUN_BUDGET_DEFAULT;
  return Math.max(0, (b.capCalls || 0) - (b.usedCalls || 0));
}

// evaluateRunGate — can a NEW run start RIGHT NOW? Default-allow for a human
// trigger, but ANY brake denies: master kill-switch, single-flight lock, budget.
export function evaluateRunGate({ killSwitch = 'clear', lock = null, budget = RUN_BUDGET_DEFAULT, stagesInRun = STAGE_KEYS.length, now = null } = {}) {
  const reasons = [];
  if (killSwitch && killSwitch !== 'clear') reasons.push('Kill-switch engaged — clear it to run (master stop).');
  if (lock && lock.held && !isLockStale(lock, { now })) reasons.push('A run is already in progress (single-flight lock held).');
  const b = budget || RUN_BUDGET_DEFAULT;
  if (!(b.capCalls > 0)) reasons.push('No budget ceiling set — set a stage-call cap to run.');
  else if (budgetRemaining(b) < stagesInRun) reasons.push(`Budget nearly spent (${budgetRemaining(b)} of ${b.capCalls} stage-calls left, run needs ${stagesInRun}). Reset or raise the cap.`);
  return { allowed: reasons.length === 0, reasons };
}

// --- 5. ACTIVITY / OUTCOME REPORT — what it DID, with metrics + rationale ------
// Honest ESTIMATE of minutes a person would spend drafting each artifact by hand.
// Real input (counts of produced drafts) × a transparent per-artifact assumption.
export const TIME_SAVED_PER_ARTIFACT = Object.freeze({
  'market-signals': 25, offer: 30, 'content-angles': 20, sequence: 25, output: 20,
});
export function estMinutesSavedFor(outputs = []) {
  return outputs.reduce((sum, o) => sum + ((o && o.content && o.content.trim())
    ? (TIME_SAVED_PER_ARTIFACT[o.kind] || TIME_SAVED_PER_ARTIFACT.output) : 0), 0);
}

export function buildActivityReport({ runs = [], leads = [], outbound = [], outputs = [], sideKey = null } = {}) {
  const sideOf = (x) => (x && (x.sideKey || x.audiencePresetKey)) || DEFAULT_SIDE_KEY;
  const runList = sideKey ? runs.filter((r) => r.sideKey === sideKey) : runs;
  const obList = sideKey ? outbound.filter((o) => sideOf(o) === sideKey) : outbound;
  const outList = sideKey ? outputs.filter((o) => sideOf(o) === sideKey) : outputs;
  const leadList = sideKey ? leads.filter((l) => sideOf(l) === sideKey) : leads;

  const draftsProduced = outList.filter((o) => o.content && o.content.trim()).length;
  const needsCapture = outList.filter((o) => o.status === 'needs-capture').length;
  const approvedDrafts = outList.filter((o) => o.status === 'approved').length;

  const outboundQueued = obList.length;
  const outboundPending = obList.filter((o) => o.status === 'pending').length;
  const outboundApproved = obList.filter((o) => o.status === 'approved').length;
  const outboundRejected = obList.filter((o) => o.status === 'rejected').length;

  const leadsLanded = leadList.filter((l) => l.source === 'run-the-team').length;

  const startedTimes = runList.map((r) => r.startedAt).filter(Boolean).sort();
  const perRun = [...runList]
    .sort((a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0))
    .map((r) => {
      const steps = r.steps || [];
      return {
        runId: r.id, side: r.sideKey, startedAt: r.startedAt, finishedAt: r.finishedAt,
        status: r.killed ? 'killed' : (r.status || runOverallStatus(r)),
        draftsProduced: steps.filter((s) => s.status === 'produced').length,
        needsCapture: steps.filter((s) => s.status === 'needs-capture').length,
        landedLeads: (r.summary && r.summary.landedLeads) || 0,
        queuedOutbound: (r.summary && r.summary.queuedOutbound) || 0,
        decisions: steps.filter((s) => s.rationale).map((s) => ({
          stageKey: s.stageKey, n: s.n, role: s.role, emoji: s.emoji, status: s.status, rationale: s.rationale,
        })),
        events: r.events || [],
      };
    });

  return {
    runsTotal: runList.length,
    lastRunAt: startedTimes.length ? startedTimes[startedTimes.length - 1] : null,
    draftsProduced, needsCapture, approvedDrafts,
    outboundQueued, outboundPending, outboundApproved, outboundRejected,
    leadsLanded,
    estMinutesSaved: estMinutesSavedFor(outList),
    estTimeSavedAssumption: 'Estimate: counted drafts the team produced × ~20–30 min a person spends drafting each by hand.',
    perRun,
  };
}
