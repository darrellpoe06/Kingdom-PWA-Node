// The client-acquisition engine is pure (no React / Supabase / network), so the
// 4-stage workflow, the per-audience config, the deterministic prompts, the
// ethical-marketing + PHI guardrails, and the funnel math are all verified here.
// Per DR-0076 (verification doctrine) the guardrail linters are PROVEN-TO-CATCH:
// a bad claim / PHI string must be flagged, and a clean one must pass.
import { describe, it, expect } from 'vitest';
import {
  ACQUISITION_STAGES,
  STAGE_KEYS,
  getStage,
  GUARDRAILS,
  guardrailsForStage,
  makeAcquisitionConfig,
  registerAudiencePreset,
  getAudiencePreset,
  listAudiencePresets,
  DEFAULT_AUDIENCE_KEY,
  TLC_DEFAULT_CONFIG,
  buildStageBrief,
  buildStagePrompt,
  screenMarketingClaim,
  isClaimShippable,
  flagPotentialPhi,
  newLead,
  funnelMetrics,
  funnelStagesFor,
  nextFunnelStage,
  canOutreach,
  newStageOutput,
  canApproveOutput,
  pipelineSummary,
  sensitivityFor,
  PRACTICE_GROWTH_WEBHOOK,
} from '../lib/client-acquisition.js';

describe('the 4-stage revenue-agent-team shape', () => {
  it('is exactly the four named stages in order', () => {
    expect(ACQUISITION_STAGES).toHaveLength(4);
    expect(STAGE_KEYS).toEqual(['market-signal', 'offer-architect', 'content-angle', 'conversion-system']);
    expect(ACQUISITION_STAGES.map((s) => s.n)).toEqual([1, 2, 3, 4]);
    expect(ACQUISITION_STAGES.map((s) => s.role)).toEqual([
      'Market Signal Researcher', 'Offer Architect', 'Content Angle Strategist', 'Conversion System Builder',
    ]);
  });

  it('every stage references only defined guardrails', () => {
    for (const stage of ACQUISITION_STAGES) {
      for (const k of stage.guardrailKeys) {
        expect(GUARDRAILS[k], `guardrail ${k} on ${stage.key}`).toBeTruthy();
      }
    }
  });

  it('getStage resolves by key and returns null for unknown', () => {
    expect(getStage('offer-architect').role).toBe('Offer Architect');
    expect(getStage('nope')).toBeNull();
  });
});

describe('config + audience presets (reusable per practice/tenant/audience)', () => {
  it('defaults to the B2B product-customer path', () => {
    expect(TLC_DEFAULT_CONFIG.audiencePresetKey).toBe(DEFAULT_AUDIENCE_KEY);
    expect(DEFAULT_AUDIENCE_KEY).toBe('b2b-practices');
    expect(TLC_DEFAULT_CONFIG.phiSensitive).toBe(false);
  });

  it('exposes both the B2B and patient paths', () => {
    const keys = listAudiencePresets().map((p) => p.key);
    expect(keys).toContain('b2b-practices');
    expect(keys).toContain('patient-practice');
  });

  it('the patient path is PHI-sensitive (highest sensitivity)', () => {
    const cfg = makeAcquisitionConfig({ audiencePresetKey: 'patient-practice' });
    expect(cfg.phiSensitive).toBe(true);
    expect(sensitivityFor(cfg)).toBe('clinical-local-only');
    expect(sensitivityFor(TLC_DEFAULT_CONFIG)).toBe('commercial');
  });

  it('is reusable: a registered preset flows through makeAcquisitionConfig', () => {
    registerAudiencePreset('law-firm-b2b', {
      label: 'B2B — law firms',
      audienceWho: 'small law firms needing CLE + practice ops',
      productOrService: 'A sovereign legal practice platform',
      specialtyNoun: 'practice area',
      defaultChannels: ['linkedin', 'content-engine'],
      regions: ['Illinois'],
      specialties: ['family law'],
      tracks: ['attorney-CLE'],
      pricingTiers: ['Solo', 'Firm'],
      funnelStages: ['new', 'contacted', 'qualified', 'converted', 'lost'],
      leadNoun: 'firm',
    });
    expect(getAudiencePreset('law-firm-b2b')).toBeTruthy();
    const cfg = makeAcquisitionConfig({ tenant: 'LegalOS', audiencePresetKey: 'law-firm-b2b' });
    expect(cfg.tenant).toBe('LegalOS');
    expect(cfg.leadNoun).toBe('firm');
    expect(cfg.funnelStages).toContain('qualified');
  });

  it('falls back to the default preset for an unknown key', () => {
    const cfg = makeAcquisitionConfig({ audiencePresetKey: 'does-not-exist' });
    expect(cfg.audiencePresetKey).toBe(DEFAULT_AUDIENCE_KEY);
  });
});

describe('deterministic stage prompts carry the guardrails on every call', () => {
  it('buildStageBrief returns role/goal/guardrails for a stage', () => {
    const brief = buildStageBrief('content-angle', TLC_DEFAULT_CONFIG);
    expect(brief.role).toBe('Content Angle Strategist');
    expect(brief.guardrails.length).toBeGreaterThan(0);
    expect(brief.guardrails.map((g) => g.key)).toContain('psychoeducation-not-treatment');
  });

  it('the prompt is deterministic (same config -> same string)', () => {
    const a = buildStagePrompt('market-signal', TLC_DEFAULT_CONFIG);
    const b = buildStagePrompt('market-signal', TLC_DEFAULT_CONFIG);
    expect(a).toBe(b);
  });

  it('the prompt names the tenant + audience and appends every guardrail', () => {
    const prompt = buildStagePrompt('offer-architect', TLC_DEFAULT_CONFIG);
    expect(prompt).toContain('TLC Therapy Solutions');
    expect(prompt.toLowerCase()).toContain('offer architect');
    for (const g of guardrailsForStage('offer-architect')) {
      expect(prompt).toContain(g.label);
    }
    expect(prompt).toContain('DRAFT for human review');
  });

  it('never leaks an unfilled {{token}} into the prompt', () => {
    for (const key of STAGE_KEYS) {
      expect(buildStagePrompt(key, TLC_DEFAULT_CONFIG)).not.toMatch(/\{\{\w+\}\}/);
    }
  });

  it('chains prior approved context when provided', () => {
    const prompt = buildStagePrompt('content-angle', TLC_DEFAULT_CONFIG, { priorSummary: 'APPROVED OFFER X' });
    expect(prompt).toContain('APPROVED OFFER X');
  });
});

describe('ethical-marketing guardrail linter (proven-to-catch)', () => {
  it('BLOCKS guaranteed-results / cure language', () => {
    const bad = 'We guarantee results and will cure your anxiety.';
    const findings = screenMarketingClaim(bad);
    const blocks = findings.filter((f) => f.severity === 'block');
    expect(blocks.length).toBeGreaterThanOrEqual(2);
    expect(isClaimShippable(bad)).toBe(false);
  });

  it('BLOCKS risk-free and 100%-effective claims', () => {
    expect(isClaimShippable('A risk-free program.')).toBe(false);
    expect(isClaimShippable('100% effective therapy.')).toBe(false);
  });

  it('WARNS on superlatives and speed claims without hard-blocking', () => {
    const w1 = screenMarketingClaim('The #1 therapist in town.');
    expect(w1.some((f) => f.severity === 'warn')).toBe(true);
    expect(isClaimShippable('The #1 therapist in town.')).toBe(true); // warn, not block
    expect(screenMarketingClaim('Get instant relief.').some((f) => f.severity === 'warn')).toBe(true);
  });

  it('PASSES honest, compliant copy', () => {
    const good = 'Faith-integrated therapy that meets you where you are. Book a consultation to see if we are a good fit.';
    expect(screenMarketingClaim(good)).toHaveLength(0);
    expect(isClaimShippable(good)).toBe(true);
  });
});

describe('PHI-leak heuristic (errs safe)', () => {
  it('flags client-identifying and clinical content', () => {
    expect(flagPotentialPhi('My client Sarah was diagnosed with depression.').length).toBeGreaterThan(0);
    expect(flagPotentialPhi('Here are the session notes from intake.').length).toBeGreaterThan(0);
    expect(flagPotentialPhi('Their date of birth is on file.').length).toBeGreaterThan(0);
  });

  it('passes clean marketing copy with no PHI', () => {
    expect(flagPotentialPhi('Our team offers couples and family therapy.')).toHaveLength(0);
  });
});

describe('lead + funnel model', () => {
  it('newLead produces a clinical-field-free, consent-aware shape', () => {
    const lead = newLead({ name: 'Acme Counseling', source: 'youtube' }, { now: '2026-06-24T00:00:00.000Z', id: 'lead-1' });
    expect(lead.id).toBe('lead-1');
    expect(lead.stage).toBe('new');
    expect(lead.consent.outreachOk).toBe(false);
    // No clinical fields exist on a lead by design.
    expect(lead).not.toHaveProperty('diagnosis');
    expect(lead).not.toHaveProperty('presentingConcern');
    expect(canOutreach(lead)).toBe(false);
  });

  it('canOutreach gates on recorded consent', () => {
    const ok = newLead({ name: 'X', consent: { outreachOk: true, capturedAt: 'now' } }, { id: 'l2' });
    expect(canOutreach(ok)).toBe(true);
  });

  it('funnelMetrics counts won/lost/active + conversion over real leads', () => {
    const cfg = TLC_DEFAULT_CONFIG;
    const leads = [
      newLead({ stage: 'new' }, { id: 'a' }),
      newLead({ stage: 'qualified' }, { id: 'b' }),
      newLead({ stage: 'converted' }, { id: 'c' }),
      newLead({ stage: 'converted' }, { id: 'd' }),
      newLead({ stage: 'lost' }, { id: 'e' }),
    ];
    const m = funnelMetrics(leads, cfg);
    expect(m.total).toBe(5);
    expect(m.won).toBe(2);
    expect(m.lost).toBe(1);
    expect(m.active).toBe(2);
    expect(m.closed).toBe(3);
    expect(Math.round(m.conversionRate)).toBe(67); // 2 won / 3 closed
  });

  it('nextFunnelStage walks the configured funnel and stops at the end', () => {
    const cfg = TLC_DEFAULT_CONFIG;
    expect(nextFunnelStage(cfg, 'new')).toBe('contacted');
    expect(nextFunnelStage(cfg, 'lost')).toBeNull();
  });

  it('funnelStagesFor reflects the audience config', () => {
    const patient = makeAcquisitionConfig({ audiencePresetKey: 'patient-practice' });
    const keys = funnelStagesFor(patient).map((s) => s.key);
    expect(keys).toContain('intake-scheduled');
    expect(keys).not.toContain('converted');
  });
});

describe('output approval model', () => {
  it('captures guardrail findings at creation and blocks approval on a violation', () => {
    const bad = newStageOutput('content-angle', 'We guarantee results.');
    expect(bad.shippable).toBe(false);
    expect(canApproveOutput(bad)).toBe(false);
  });

  it('a PHI finding blocks approval even with no claim violation', () => {
    const phi = newStageOutput('content-angle', 'My client loved the program.');
    expect(canApproveOutput(phi)).toBe(false);
  });

  it('a clean draft is approvable', () => {
    const ok = newStageOutput('offer-architect', 'Three honest tiers: solo, group, network.');
    expect(ok.shippable).toBe(true);
    expect(canApproveOutput(ok)).toBe(true);
  });
});

describe('reality-trace summary + webhook seam', () => {
  it('pipelineSummary derives only from passed-in real lists', () => {
    const leads = [newLead({ stage: 'new' }, { id: 'a' }), newLead({ stage: 'converted' }, { id: 'b' })];
    const outputs = [newStageOutput('market-signal', 'Honest signal'), newStageOutput('offer-architect', 'Honest offer')];
    const s = pipelineSummary(TLC_DEFAULT_CONFIG, { leads, outputs });
    expect(s.leads).toBe(2);
    expect(s.won).toBe(1);
    expect(s.outputsByStage['market-signal'].total).toBe(1);
  });

  it('uses the same-origin /n8n rewrite (never the absolute Funnel URL)', () => {
    expect(PRACTICE_GROWTH_WEBHOOK.startsWith('/n8n/')).toBe(true);
    expect(PRACTICE_GROWTH_WEBHOOK).not.toMatch(/^https?:/);
  });
});
