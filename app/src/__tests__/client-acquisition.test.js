// The client-acquisition engine is pure, so the 4-stage workflow, the THREE
// sides (client/therapist/training), the per-side prompts, the marketplace
// balance, the AUTOMATION (run-the-team chaining + approve-outbound-only gate +
// inert cadence), and the guardrail linters are all verified here. Per DR-0076
// the guardrails + the outbound gate are PROVEN-TO-CATCH.
import { describe, it, expect } from 'vitest';
import {
  ACQUISITION_STAGES, STAGE_KEYS, GUARDRAILS, guardrailsForStage,
  SIDE_KEYS, DEFAULT_SIDE_KEY, makeAcquisitionConfig, configForSide, getSidePreset,
  registerSidePreset, listSidePresets,
  buildStagePrompt,
  screenMarketingClaim, isClaimShippable, flagPotentialPhi,
  newLead, funnelStagesFor, stageRequiresOutbound,
  canOutreach, autoAdvanceLead, marketplaceBalance, CASELOAD_PER_THERAPIST,
  newStageOutput, canApproveOutput,
  isOutbound, OUTBOUND_KINDS, buildRunPlan, summarizeForChain, newRun, setRunStep, runOverallStatus,
  newOutboundItem, canApproveOutbound,
  CADENCE_DEFAULT, evaluateCadenceGate, cadenceStatusLabel,
  pipelineSummary, sensitivityFor, PRACTICE_GROWTH_WEBHOOK,
  GROWTH_FRAMEWORKS, growthPlaysForStage,
} from '../lib/client-acquisition.js';

describe('the 4-stage team', () => {
  it('is the four named stages in order, each with a produces-kind', () => {
    expect(STAGE_KEYS).toEqual(['market-signal', 'offer-architect', 'content-angle', 'conversion-system']);
    expect(ACQUISITION_STAGES.map((s) => s.producesKind)).toEqual(['market-signals', 'offer', 'content-angles', 'sequence']);
  });
  it('every stage references only defined guardrails', () => {
    for (const stage of ACQUISITION_STAGES) for (const k of stage.guardrailKeys) expect(GUARDRAILS[k]).toBeTruthy();
  });
});

describe('the THREE sides (two-sided marketplace + enablement)', () => {
  it('exposes client, therapist, training', () => {
    expect(SIDE_KEYS).toEqual(['client', 'therapist', 'training']);
    expect(DEFAULT_SIDE_KEY).toBe('client');
    expect(listSidePresets().map((p) => p.key).sort()).toEqual(['client', 'therapist', 'training']);
  });
  it('client side is demand + PHI-sensitive + psychoeducation', () => {
    const c = configForSide('client');
    expect(c.side).toBe('demand');
    expect(c.phiSensitive).toBe(true);
    expect(c.extraGuardrailKeys).toContain('psychoeducation-not-treatment');
    expect(sensitivityFor(c)).toBe('health-marketing-local-only');
  });
  it('therapist side is supply + recruiting funnel + license-verification', () => {
    const t = configForSide('therapist');
    expect(t.side).toBe('supply');
    expect(t.funnelStages).toContain('credential-check');
    expect(t.funnelStages).toContain('matched');
    expect(t.extraGuardrailKeys).toContain('license-verification');
    expect(sensitivityFor(t)).toBe('commercial');
  });
  it('training side is enablement + CE funnel + ce-accuracy', () => {
    const tr = configForSide('training');
    expect(tr.side).toBe('enablement');
    expect(tr.funnelStages).toContain('enrolled');
    expect(tr.funnelStages).toContain('completed');
    expect(tr.extraGuardrailKeys).toContain('ce-accuracy');
  });
  it('is reusable: a registered side preset flows through makeAcquisitionConfig', () => {
    registerSidePreset('legal-b2b', { side: 'demand', label: 'Legal clients', audienceWho: 'people needing counsel', productOrService: 'a law practice', specialtyNoun: 'matter', defaultChannels: ['google'], regions: ['IL'], specialties: ['family'], pricingTiers: ['Hourly'], funnelStages: ['new', 'contacted', 'lost'], leadNoun: 'matter', leadNounPlural: 'matters', sideFraming: {} });
    expect(getSidePreset('legal-b2b')).toBeTruthy();
    expect(makeAcquisitionConfig({ sideKey: 'legal-b2b' }).leadNounPlural).toBe('matters');
  });
});

describe('per-side prompts weave the side framing + guardrails', () => {
  it('the same stage reads differently per side, deterministically', () => {
    const clientP = buildStagePrompt('content-angle', configForSide('client'));
    const therapistP = buildStagePrompt('content-angle', configForSide('therapist'));
    expect(clientP).not.toBe(therapistP);
    expect(clientP).toContain('psychoeducation');
    expect(therapistP.toLowerCase()).toContain('clinician');
    expect(buildStagePrompt('content-angle', configForSide('client'))).toBe(clientP);
  });
  it('therapist offer prompt carries the license-verification guardrail', () => {
    const cfg = configForSide('therapist');
    const p = buildStagePrompt('offer-architect', cfg);
    const labels = guardrailsForStage('offer-architect', cfg).map((g) => g.label);
    expect(labels).toContain('License verification (therapists)');
    for (const g of guardrailsForStage('offer-architect', cfg)) expect(p).toContain(g.label);
  });
  it('never leaks an unfilled token', () => {
    for (const side of SIDE_KEYS) for (const k of STAGE_KEYS) expect(buildStagePrompt(k, configForSide(side))).not.toMatch(/\{\{\w+\}\}/);
  });
});

describe('adopted growth plays (DR-0140) — attributed, honesty-bent, woven into the prompts', () => {
  it('every play carries its attribution, honesty bend, DR ref, and a REAL stage', () => {
    expect(GROWTH_FRAMEWORKS.length).toBeGreaterThanOrEqual(5);
    for (const f of GROWTH_FRAMEWORKS) {
      expect(f.attribution, f.key).toMatch(/Priestley/);
      expect(f.honestyBend, f.key).toBeTruthy();
      expect(f.drRef, f.key).toBe('DR-0140');
      expect(STAGE_KEYS, `${f.key} rides a real stage`).toContain(f.stageKey);
    }
  });
  it('the 7-11-4 play is named as a HEURISTIC, never as verified research', () => {
    const t = GROWTH_FRAMEWORKS.find((f) => f.key === 'trust-touch');
    expect(t.play).toMatch(/7 hours|~11|~4/);
    expect(`${t.label} ${t.honestyBend}`.toLowerCase()).toMatch(/heuristic/);
    expect(t.honestyBend.toLowerCase()).toMatch(/not research we verified/);
  });
  it('the demand-proof play demands HONEST tests (no fake scarcity)', () => {
    const d = GROWTH_FRAMEWORKS.find((f) => f.key === 'demand-proof');
    expect(d.stageKey).toBe('market-signal');
    expect(d.play.toLowerCase()).toMatch(/waiting list|discussion group|needs analysis/);
    expect(d.honestyBend.toLowerCase()).toMatch(/never manufactured|must be real/);
  });
  it('each stage prompt weaves in exactly its own plays, after the guardrails', () => {
    for (const k of STAGE_KEYS) {
      const p = buildStagePrompt(k, configForSide('client'));
      const plays = growthPlaysForStage(k);
      for (const f of plays) {
        expect(p, `${k} carries ${f.key}`).toContain(f.label);
        expect(p.indexOf(f.label), `${k}: plays come after guardrails`).toBeGreaterThan(p.indexOf('Non-negotiable guardrails'));
      }
      for (const f of GROWTH_FRAMEWORKS.filter((x) => x.stageKey !== k)) {
        expect(p, `${k} does not carry ${f.key}`).not.toContain(f.label);
      }
    }
    // offer-architect carries no plays by design — the offer stays the preset's honest packaging
    expect(growthPlaysForStage('offer-architect')).toHaveLength(0);
  });
});

describe('ethical guardrail linter (proven-to-catch)', () => {
  it('BLOCKS guaranteed-results / cure / risk-free / guaranteed-income', () => {
    expect(isClaimShippable('We guarantee results.')).toBe(false);
    expect(isClaimShippable('This will cure your anxiety.')).toBe(false);
    expect(isClaimShippable('A risk-free program.')).toBe(false);
    expect(isClaimShippable('Join us — guaranteed income for therapists.')).toBe(false);
  });
  it('WARNS on superlatives/speed without hard-blocking', () => {
    expect(screenMarketingClaim('The #1 therapist in town.').some((f) => f.severity === 'warn')).toBe(true);
    expect(isClaimShippable('The #1 therapist in town.')).toBe(true);
  });
  it('PASSES honest copy', () => {
    expect(screenMarketingClaim('Faith-integrated therapy. Book a consult to see if we fit.')).toHaveLength(0);
  });
});

describe('PHI heuristic (errs safe)', () => {
  it('flags client-identifying + clinical content', () => {
    expect(flagPotentialPhi('My client was diagnosed with depression.').length).toBeGreaterThan(0);
  });
  it('passes clean copy', () => { expect(flagPotentialPhi('We offer couples and family therapy.')).toHaveLength(0); });
});

describe('lead + funnel + marketplace', () => {
  it('newLead carries sideKey, no clinical fields, consent off by default', () => {
    const l = newLead({ sideKey: 'therapist', name: 'Dr X' }, { now: '2026-06-25T00:00:00.000Z', id: 'l1' });
    expect(l.sideKey).toBe('therapist');
    expect(l.audiencePresetKey).toBe('therapist');
    expect(l).not.toHaveProperty('diagnosis');
    expect(canOutreach(l)).toBe(false);
  });
  it('funnel stages are per-side; outbound stages are flagged', () => {
    expect(funnelStagesFor(configForSide('therapist')).map((s) => s.key)).toContain('onboarding');
    expect(stageRequiresOutbound('outreach-ready')).toBe(false);
    expect(stageRequiresOutbound('contacted')).toBe(true);
  });
  it('marketplaceBalance recommends recruiting therapists when demand has no supply', () => {
    const leads = [newLead({ sideKey: 'client', stage: 'new' }, { id: 'c1' }), newLead({ sideKey: 'client', stage: 'consult-booked' }, { id: 'c2' })];
    const b = marketplaceBalance(leads);
    expect(b.therapistsServing).toBe(0);
    expect(b.clientsActive).toBe(2);
    expect(b.recommend).toBe('recruit-therapists');
  });
  it('marketplaceBalance recommends acquiring clients when capacity is idle', () => {
    const leads = [newLead({ sideKey: 'therapist', stage: 'active' }, { id: 't1' })];
    const b = marketplaceBalance(leads);
    expect(b.capacity).toBe(CASELOAD_PER_THERAPIST);
    expect(b.recommend).toBe('acquire-clients');
  });
});

describe('AUTOMATION — run-the-team + approve-outbound-only', () => {
  it('classifies outbound vs internal artifacts', () => {
    expect(isOutbound('outreach-message')).toBe(true);
    expect(isOutbound('market-signals')).toBe(false);
    expect(OUTBOUND_KINDS).toContain('published-content');
  });
  it('buildRunPlan + chaining covers all four stages', () => {
    const plan = buildRunPlan(configForSide('client'));
    expect(plan.map((p) => p.stageKey)).toEqual(STAGE_KEYS);
    const chain = summarizeForChain([newStageOutput('market-signal', 'segment A', { sideKey: 'client' })]);
    expect(chain).toContain('Market Signal Researcher');
    expect(chain).toContain('segment A');
  });
  it('run record tracks per-stage status and an overall', () => {
    let run = newRun(configForSide('client'), { now: '2026-06-25T00:00:00.000Z', id: 'run-1' });
    expect(runOverallStatus(run)).toBe('pending');
    for (const k of STAGE_KEYS) run = setRunStep(run, k, { status: 'produced' });
    expect(runOverallStatus(run)).toBe('produced');
    run = setRunStep(run, 'content-angle', { status: 'needs-capture' });
    expect(runOverallStatus(run)).toBe('needs-capture');
  });
  it('autoAdvanceLead moves new -> outreach-ready but NEVER crosses the outbound boundary', () => {
    const cfg = configForSide('client');
    expect(autoAdvanceLead(newLead({ sideKey: 'client', stage: 'new' }, { id: 'a' }), cfg)).toBe('outreach-ready');
    expect(autoAdvanceLead(newLead({ sideKey: 'client', stage: 'outreach-ready' }, { id: 'b' }), cfg)).toBeNull();
  });
  it('outbound item requires consent AND no guardrail block to approve (the gate)', () => {
    const lead = newLead({ sideKey: 'client', stage: 'outreach-ready', consent: { outreachOk: false } }, { id: 'l' });
    const clean = newOutboundItem({ leadId: 'l', sideKey: 'client', subject: 'Hello', body: 'A warm, honest follow-up.' }, { id: 'ob1' });
    expect(canApproveOutbound(clean, lead).ok).toBe(false); // no consent
    const consented = { ...lead, consent: { outreachOk: true } };
    expect(canApproveOutbound(clean, consented).ok).toBe(true);
    const bad = newOutboundItem({ leadId: 'l', sideKey: 'client', subject: 'Guaranteed results', body: 'We guarantee results.' }, { id: 'ob2' });
    expect(bad.blocked).toBe(true);
    expect(canApproveOutbound(bad, consented).ok).toBe(false);
  });
});

describe('optional cadence — ships INERT, default-deny (three brakes)', () => {
  it('default cadence is disabled + unarmed and the gate denies', () => {
    expect(CADENCE_DEFAULT.enabled).toBe(false);
    expect(CADENCE_DEFAULT.armed).toBe(false);
    expect(evaluateCadenceGate(CADENCE_DEFAULT, null).allowed).toBe(false);
    expect(cadenceStatusLabel(CADENCE_DEFAULT, null)).toMatch(/Inert/i);
  });
  it('stays denied without the brakes even when enabled+armed+budgeted', () => {
    const c = { enabled: true, armed: true, intervalHours: 24, scope: ['market-signal'], sides: ['client'], budget: { capUsd: 10, spentUsd: 0 } };
    expect(evaluateCadenceGate(c, null).allowed).toBe(false);
    const brakes = { killSwitch: 'clear', armed: true, concurrencyLock: 'free' };
    expect(evaluateCadenceGate(c, brakes).allowed).toBe(true);
    expect(evaluateCadenceGate(c, { ...brakes, concurrencyLock: 'held' }).allowed).toBe(false);
  });
});

describe('output approval + reality-trace + webhook', () => {
  it('blocks approval of an output with a violation', () => {
    expect(canApproveOutput(newStageOutput('content-angle', 'We guarantee results.', { sideKey: 'client' }))).toBe(false);
    expect(canApproveOutput(newStageOutput('offer-architect', 'Three honest tiers.', { sideKey: 'client' }))).toBe(true);
  });
  it('pipelineSummary derives only from real lists', () => {
    const s = pipelineSummary(configForSide('client'), { leads: [newLead({ sideKey: 'client', stage: 'intake-scheduled' }, { id: 'a' })], outputs: [newStageOutput('market-signal', 'x', { sideKey: 'client' })] });
    expect(s.won).toBe(1);
    expect(s.outputsByStage['market-signal'].total).toBe(1);
  });
  it('uses the same-origin /n8n rewrite', () => {
    expect(PRACTICE_GROWTH_WEBHOOK.startsWith('/n8n/')).toBe(true);
    expect(PRACTICE_GROWTH_WEBHOOK).not.toMatch(/^https?:/);
  });
});
