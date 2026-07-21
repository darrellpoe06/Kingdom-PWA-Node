// =============================================================================
// matched-services — Layer 3 service-matching rules engine (client-side)
// =============================================================================
// A faithful, DETERMINISTIC port of wf35 (35-matched-services-layer3): takes the
// skill profile (Layer 2) + parsed transactions (Layer 1) and returns ranked
// service recommendations with honest timeline commitments (BUSINESS-PROCESS-
// CONNECTIONS Timeline-First). DR-0218 zero-n8n: this is a pure rules engine —
// no LLM, no NAS, no network — so it runs CLIENT-SIDE and can never fail on a
// down Funnel. Session-only, like the whole data->skill->services flow: nothing
// persists.
//
// The service catalog lives HERE (as it did in the workflow). Each entry carries
// all five BUSINESS-PROCESS-CONNECTIONS fields: invites / pipeline / governor /
// promise / timeline. waitlist routing is sovereign-neutral (`/waitlist`), not an
// n8n webhook.
//
// matchServices({ profile, transactions, stats, personaHint }) ->
//   { ok, matches: [{ service_id, fit_score, fit_reason, service }], non_matches }
// =============================================================================

// Service catalog. Update this list whenever a new service is committed.
export const SERVICES = [
  {
    service_id: 'family-os-public-beta',
    name: 'Family OS Public Beta',
    audience: 'Two-earner families managing $5k-15k/mo combined income, looking for one place where bills, paycheck, tithe, groceries, and debt all answer what/when/why/how.',
    invites: 'Sign up for the waitlist; we engage when capacity opens and you fit the cohort.',
    pipeline: 'Workflow 30 waitlist intake + Governor review queue.',
    governor: 'Darrell as primary; Christina governs brand + UX feedback loop.',
    promise: 'No date until we have confidence. Honest waitlist position. Real human reaches out when there is a fit.',
    timeline: 'Q4 2027 target. Confidence: medium. Depends on Phase 1 (security) + Phase 2 (Postgres) + Phase 4 (multi-tenant) landing in sequence.',
    waitlist_endpoint: '/waitlist',
    waitlist_field: 'family-os',
  },
  {
    service_id: 'solo-practice-module',
    name: 'Solo Practice Module',
    audience: 'Solo therapists, lawyers, consultants, and small-practice owners running W-2 + LLC income with quarterly tax obligations.',
    invites: 'Specific module waitlist; signals when the module opens for cohort onboarding.',
    pipeline: 'Workflow 30 waitlist intake (interest=solo-practice) + Governor review.',
    governor: 'Darrell governs; Christina advises on clinical-practice usability when relevant.',
    promise: 'Module ships after Family OS Public Beta proves the foundation. Quarterly tax set-aside, CEU tracking, owner-draw automation included.',
    timeline: 'Q2 2028 target. Confidence: medium-low (depends on Family OS sequencing).',
    waitlist_endpoint: '/waitlist',
    waitlist_field: 'solo-practice',
  },
  {
    service_id: 'landlord-module',
    name: 'Landlord Module',
    audience: 'Property owners running 1-20 rentals with day-job income, mortgage timing concerns, and capex reserve discipline gaps.',
    invites: 'Module waitlist; per-property cash flow + late-tenant flagging + capex auto-fund visibility.',
    pipeline: 'Workflow 30 waitlist intake (interest=landlord) + Governor review.',
    governor: 'Darrell governs (operates rentals himself, knows the user).',
    promise: 'Per-property cash flow without spreadsheets. Mortgage timing protected. Capex reserve auto-funded.',
    timeline: 'Q3 2028 target. Confidence: medium-low.',
    waitlist_endpoint: '/waitlist',
    waitlist_field: 'landlord',
  },
  {
    service_id: 'specialist-consultation',
    name: 'Anonymous Specialist Consultation',
    audience: 'Families who have a clear question (financial, legal, practice) but want vetted expertise without committing to a relationship yet.',
    invites: 'Browse the specialist directory anonymously; read, listen, message without revealing identity until you choose to.',
    pipeline: 'Specialist directory (post-Layer-C multi-tenant) + per-specialist intake workflow.',
    governor: 'Darrell + the partner specialist (vetting per-relationship).',
    promise: 'Experience over credentials. Real practitioners with track records. You decide when to reveal yourself.',
    timeline: '2028+ target. Confidence: low. Requires specialist directory infrastructure (v3) which requires separate pilot.',
    waitlist_endpoint: '/waitlist',
    waitlist_field: 'specialist-consultation',
  },
  {
    service_id: 'church-financial-discipleship',
    name: 'Church-Connected Financial Discipleship',
    audience: 'Churches and ministries wanting to offer financial-discipleship support to members, with tithe tracking, capex visibility, and faith-rooted stewardship modules.',
    invites: 'Partnership inquiry; we onboard churches one at a time.',
    pipeline: 'Direct outreach + partnership agreement + per-church onboarding workflow.',
    governor: 'Christina + Darrell jointly (relationship + theological alignment + operations).',
    promise: 'Pilot with one church first. Scale only after pilot proves the model.',
    timeline: '2028+ target. Confidence: low. Requires v3 church directory infrastructure + one successful pilot.',
    waitlist_endpoint: '/waitlist',
    waitlist_field: 'church-discipleship',
  },
];

// Rules engine. Each service gets a fit score 0-100 based on profile + stats +
// transaction signals. Faithful to wf35's scoreService (same thresholds, same
// reasons). Pure: no side effects, deterministic for the same inputs.
export function scoreService(svc, profile = {}, stats = {}, transactions = [], personaHint = '') {
  let score = 50; // baseline
  const reasons = [];

  const income = parseFloat(stats.income_total || 0);
  const titheRate = parseFloat(stats.tithe_rate_pct || 0);
  const txns = Array.isArray(transactions) ? transactions : [];

  switch (svc.service_id) {
    case 'family-os-public-beta':
      score = 60;
      if (profile.alignment === 'high') { score += 20; reasons.push('alignment is high'); }
      if (profile.buffer_fund_discipline === 'building' || profile.buffer_fund_discipline === 'steady') { score += 10; reasons.push('buffer fund discipline present'); }
      if (profile.income_stability === 'steady') { score += 5; reasons.push('income is steady'); }
      if (personaHint && /family/i.test(personaHint)) { score += 10; reasons.push('persona hint matches family'); }
      break;
    case 'solo-practice-module': {
      score = 20;
      const hasLLCIncome = txns.some((t) => /(llc|inc|practice|consulting|llp|pllc)/i.test(t.description || ''));
      if (hasLLCIncome) { score += 35; reasons.push('LLC/practice income detected in transactions'); }
      if (profile.income_stability === 'variable' || profile.income_stability === 'volatile') { score += 10; reasons.push('variable income suggests practice rhythm'); }
      if (personaHint && /solo|practice|therapist|lawyer|consultant/i.test(personaHint)) { score += 25; reasons.push('persona hint matches solo practice'); }
      break;
    }
    case 'landlord-module': {
      score = 20;
      const hasRentalIncome = txns.some((t) => /(rent|tenant|lease|property|landlord)/i.test(t.description || ''));
      if (hasRentalIncome) { score += 40; reasons.push('rental income detected in transactions'); }
      if (personaHint && /landlord|rental|property/i.test(personaHint)) { score += 25; reasons.push('persona hint matches landlord'); }
      break;
    }
    case 'specialist-consultation':
      score = 35;
      if (profile.alignment === 'high' && profile.buffer_fund_discipline === 'steady') { score += 25; reasons.push('foundation is solid; ready for specialized guidance'); }
      if (income > 8000) { score += 10; reasons.push('income range supports professional consultation'); }
      break;
    case 'church-financial-discipleship':
      score = 25;
      if (titheRate > 5) { score += 20; reasons.push('consistent tithe practice (' + titheRate.toFixed(1) + '%)'); }
      if (txns.some((t) => /(church|ministry|cathedral|temple|fellowship|congregation)/i.test(t.description || ''))) { score += 25; reasons.push('church-connected transactions detected'); }
      if (personaHint && /church|ministry/i.test(personaHint)) { score += 25; reasons.push('persona hint matches church'); }
      break;
    default:
      break;
  }

  return { score: Math.min(100, Math.max(0, score)), reasons };
}

// The Layer-3 entry point. Ranks the catalog; >=50 are matches (top 3), the rest
// are non_matches (kept for completeness). Never throws.
export function matchServices({ profile = {}, transactions = [], stats = {}, personaHint = '' } = {}) {
  const scored = SERVICES.map((svc) => {
    const { score, reasons } = scoreService(svc, profile, stats, transactions, personaHint);
    return {
      service_id: svc.service_id,
      fit_score: score,
      fit_reason: reasons.length ? reasons.join('; ') : 'baseline fit; no specific signals detected',
      service: svc,
    };
  });
  scored.sort((a, b) => b.fit_score - a.fit_score);
  return {
    ok: true,
    matches: scored.filter((s) => s.fit_score >= 50).slice(0, 3),
    non_matches: scored.filter((s) => s.fit_score < 50),
  };
}
