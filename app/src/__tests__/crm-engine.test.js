// =============================================================================
// crm-engine — proven-to-catch tests for the shared CRM backbone (DR-0076).
// Every binding guardrail is pinned by a test that proves it CATCHES the break:
// consent gating, no-auto-send drafts, no-PHI/no-payment strip, seed-vs-real,
// ethical-marketing linter, stage normalization, source attribution, and the
// funnel adapters that wire each business onto the one model.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  BUSINESSES, PIPELINES, PIPELINE_KEYS, pipelinesForBusiness,
  normalizeStage, nextStage, stageGroup,
  attributeSource,
  newLead, moveStage,
  canOutreach, consentReason,
  nextFollowUp, advanceSequence, getSequence,
  pipelineStats, isSeedLead,
  leadFromInquiry, leadFromPracticeAcquisition, leadFromSubscriber, leadFromBooking, leadFromRealEstateInquiry,
  validateCapture, stripDisallowed, DISALLOWED_KEYS,
  screenMarketingClaim, isClaimShippable, flagPotentialPhi,
  NO_PAYMENT_PROCESSING,
} from '../lib/crm-engine.js';

const NOW = '2026-06-24T12:00:00.000Z';

describe('businesses + pipelines registry — one engine, per-business config', () => {
  it('registers TLC three pipelines + GTM + Boxcar + real estate', () => {
    expect(pipelinesForBusiness('tlc').map(p => p.id).sort()).toEqual(
      ['tlc-client-intake', 'tlc-therapist-recruiting', 'tlc-training-enrollment']);
    expect(pipelinesForBusiness('gtm').map(p => p.id)).toEqual(['gtm-subscriber']);
    expect(pipelinesForBusiness('boxcar').map(p => p.id)).toEqual(['boxcar-booking']);
    expect(pipelinesForBusiness('realestate').map(p => p.id)).toEqual(['realestate-leads']);
  });

  it('every pipeline names a real business + ordered stages + a sequence', () => {
    for (const id of PIPELINE_KEYS) {
      const p = PIPELINES[id];
      expect(BUSINESSES[p.business]).toBeTruthy();
      expect(p.stages.length).toBeGreaterThan(1);
      expect(getSequence(p.sequenceKey)).toBeTruthy();
    }
  });
});

describe('stage helpers', () => {
  it('normalizes an invalid stage to the pipeline first stage', () => {
    expect(normalizeStage('gtm-subscriber', 'bogus')).toBe('new');
    expect(normalizeStage('gtm-subscriber', 'subscribed')).toBe('subscribed');
  });
  it('nextStage advances and SKIPS lost terminals (advancing != losing)', () => {
    expect(nextStage('tlc-client-intake', 'new')).toBe('contacted');
    // last active before terminals: consult-booked -> intake-scheduled (won), not declined/lost
    expect(nextStage('tlc-client-intake', 'consult-booked')).toBe('intake-scheduled');
    expect(nextStage('tlc-client-intake', 'intake-scheduled')).toBe(null);
  });
  it('stageGroup classifies won / lost / active uniformly', () => {
    expect(stageGroup('booked')).toBe('won');
    expect(stageGroup('cancelled')).toBe('lost');
    expect(stageGroup('contacted')).toBe('active');
  });
});

describe('source attribution', () => {
  it('normalizes known + aliased sources, falls back to other', () => {
    expect(attributeSource('Instagram')).toBe('instagram');
    expect(attributeSource('ig')).toBe('instagram');
    expect(attributeSource('word-of-mouth')).toBe('referral');
    expect(attributeSource('totally-unknown')).toBe('other');
    expect(attributeSource('')).toBe('other');
  });
});

describe('newLead — canonical shape, no clinical fields by design', () => {
  it('builds a normalized lead with defaults + initial history', () => {
    const lead = newLead({ pipeline: 'gtm-subscriber', name: 'Sam', source: 'IG' }, { now: NOW, id: 'lead-1' });
    expect(lead).toMatchObject({ id: 'lead-1', business: 'gtm', pipeline: 'gtm-subscriber', stage: 'new', name: 'Sam', source: 'instagram', seed: false });
    expect(lead.history).toEqual([{ stage: 'new', at: NOW }]);
    expect(lead.consent).toEqual({ outreachOk: false, channels: [], capturedAt: null, note: '' });
  });
  it('derives business from pipeline + forces a valid stage', () => {
    const lead = newLead({ pipeline: 'boxcar-booking', stage: 'not-a-stage' }, { now: NOW, id: 'l' });
    expect(lead.business).toBe('boxcar');
    expect(lead.stage).toBe('new');
  });
  it('moveStage records history and is a no-op for the same stage', () => {
    const a = newLead({ pipeline: 'realestate-leads' }, { now: NOW, id: 'l' });
    const b = moveStage(a, 'showing', { now: NOW });
    expect(b.stage).toBe('showing');
    expect(b.history).toHaveLength(2);
    expect(moveStage(b, 'showing', { now: NOW })).toBe(b);
  });
});

describe('CONSENT GATE — served, not surveilled (proven-to-catch)', () => {
  it('blocks outreach with no recorded consent', () => {
    const lead = newLead({ pipeline: 'gtm-subscriber' }, { now: NOW, id: 'l' });
    expect(canOutreach(lead)).toBe(false);
    expect(consentReason(lead)).toMatch(/no recorded outreach consent/i);
  });
  it('allows outreach once consent is recorded, scoped to channel', () => {
    const lead = newLead({ pipeline: 'gtm-subscriber', consent: { outreachOk: true, channels: ['email'] } }, { now: NOW, id: 'l' });
    expect(canOutreach(lead)).toBe(true);
    expect(canOutreach(lead, 'email')).toBe(true);
    expect(canOutreach(lead, 'phone')).toBe(false); // not a consented channel
    expect(consentReason(lead, 'phone')).toMatch(/does not cover the phone channel/i);
  });
  it('empty channels = general consent (any channel)', () => {
    const lead = newLead({ pipeline: 'gtm-subscriber', consent: { outreachOk: true, channels: [] } }, { now: NOW, id: 'l' });
    expect(canOutreach(lead, 'phone')).toBe(true);
  });
});

describe('FOLLOW-UP — LLMs draft, humans approve, NEVER auto-send (proven-to-catch)', () => {
  it('refuses to offer a follow-up step without consent', () => {
    const lead = newLead({ pipeline: 'tlc-client-intake' }, { now: NOW, id: 'l' });
    const f = nextFollowUp(lead, { now: NOW });
    expect(f.available).toBe(false);
    expect(f.reason).toMatch(/consent/i);
  });
  it('every produced step is a DRAFT that requires human approval', () => {
    const lead = newLead({ pipeline: 'tlc-client-intake', consent: { outreachOk: true, channels: [] } }, { now: NOW, id: 'l' });
    const f = nextFollowUp(lead, { now: NOW });
    expect(f.available).toBe(true);
    expect(f.status).toBe('draft');
    expect(f.requiresHumanApproval).toBe(true);
    expect(f.channel).toBe('email');
  });
  it('gates the step on the specific channel the step uses', () => {
    // step 2 of the client nurture is a phone call; consent only covers email
    const lead = newLead({ pipeline: 'tlc-client-intake', nurtureStep: 2, consent: { outreachOk: true, channels: ['email'] } }, { now: NOW, id: 'l' });
    const f = nextFollowUp(lead, { now: NOW });
    expect(f.available).toBe(false);
    expect(f.reason).toMatch(/phone channel/i);
  });
  it('advanceSequence bumps the step and caps at sequence length', () => {
    let lead = newLead({ pipeline: 'tlc-training-enrollment', consent: { outreachOk: true } }, { now: NOW, id: 'l' });
    const seqLen = getSequence(lead.sequenceKey).steps.length;
    for (let i = 0; i < seqLen + 3; i++) lead = advanceSequence(lead, { now: NOW });
    expect(lead.nurtureStep).toBe(seqLen);
    expect(nextFollowUp(lead, { now: NOW }).available).toBe(false); // complete
  });
});

describe('SEED vs REAL — demo never becomes an outreach target (proven-to-catch)', () => {
  it('flags seeded leads by flag or id prefix', () => {
    expect(isSeedLead({ seed: true })).toBe(true);
    expect(isSeedLead({ id: 'lead-ex-3' })).toBe(true);
    expect(isSeedLead({ id: 'inq-ex6' })).toBe(true);
    expect(isSeedLead({ id: 'lead-real-1' })).toBe(false);
  });
  it('pipelineStats EXCLUDES seed leads by default', () => {
    const real = newLead({ pipeline: 'gtm-subscriber', stage: 'subscribed' }, { now: NOW, id: 'lead-r' });
    const demo = newLead({ pipeline: 'gtm-subscriber', stage: 'subscribed', seed: true }, { now: NOW, id: 'lead-d' });
    const s = pipelineStats([real, demo], { pipeline: 'gtm-subscriber' });
    expect(s.total).toBe(1);
    expect(pipelineStats([real, demo], { pipeline: 'gtm-subscriber', includeSeed: true }).total).toBe(2);
  });
});

describe('pipelineStats — real conversion math', () => {
  it('computes won/lost/active + conversion rate over closed', () => {
    const leads = [
      newLead({ pipeline: 'realestate-leads', stage: 'leased' }, { now: NOW, id: 'a' }),
      newLead({ pipeline: 'realestate-leads', stage: 'lost' }, { now: NOW, id: 'b' }),
      newLead({ pipeline: 'realestate-leads', stage: 'showing' }, { now: NOW, id: 'c' }),
    ];
    const s = pipelineStats(leads, { pipeline: 'realestate-leads' });
    expect(s).toMatchObject({ total: 3, won: 1, lost: 1, active: 1, closed: 2 });
    expect(s.conversionRate).toBe(50);
  });
});

describe('NO-PHI / NO-PAYMENT strip — structural privacy wall (proven-to-catch)', () => {
  it('DISALLOWED_KEYS covers clinical + payment identifiers', () => {
    expect(DISALLOWED_KEYS).toEqual(expect.arrayContaining(['diagnosis', 'ssn', 'cardNumber', 'sessionNotes', 'insuranceId']));
  });
  it('stripDisallowed drops clinical/payment keys, keeps contact-level ones', () => {
    const cleaned = stripDisallowed({ name: 'Sam', diagnosis: 'X', cardNumber: '4111', notes: 'ok' });
    expect(cleaned).toEqual({ name: 'Sam', notes: 'ok' });
  });
  it('validateCapture forces first stage, explicit consent, attributed source, and strips PHI', () => {
    const r = validateCapture('tlc-client-intake', {
      name: 'Maya', contactValue: 'm@x.com', source: 'IG',
      stage: 'intake-scheduled',          // attempt to self-advance -> ignored
      consentOutreachOk: false,           // not consenting
      diagnosis: 'anxiety',               // PHI -> stripped
    }, { now: NOW, id: 'cap-1' });
    expect(r.ok).toBe(true);
    expect(r.lead.stage).toBe('new');                 // not intake-scheduled
    expect(r.lead.source).toBe('instagram');
    expect(r.lead.consent.outreachOk).toBe(false);
    expect(r.lead).not.toHaveProperty('diagnosis');
    expect(JSON.stringify(r.lead)).not.toMatch(/anxiety/);
  });
  it('validateCapture records consent only when literally true', () => {
    const yes = validateCapture('gtm-subscriber', { name: 'A', consentOutreachOk: true, consentChannels: ['email'] }, { now: NOW, id: 'c' });
    expect(yes.lead.consent.outreachOk).toBe(true);
    expect(yes.lead.consent.channels).toEqual(['email']);
    expect(yes.lead.consent.capturedAt).toBe(NOW);
    const no = validateCapture('gtm-subscriber', { name: 'A', consentOutreachOk: 'yes' }, { now: NOW, id: 'c2' });
    expect(no.lead.consent.outreachOk).toBe(false);
  });
  it('rejects an unknown pipeline', () => {
    expect(validateCapture('nope', {}).ok).toBe(false);
  });
  it('NO_PAYMENT_PROCESSING is the binding marker', () => {
    expect(NO_PAYMENT_PROCESSING).toBe(true);
  });
});

describe('ETHICAL MARKETING linter — catches the break (proven-to-catch)', () => {
  it('blocks guaranteed-outcome / cure language', () => {
    expect(isClaimShippable('We guarantee results in 30 days.')).toBe(false);
    expect(isClaimShippable('This therapy will cure your anxiety.')).toBe(false);
    expect(screenMarketingClaim('100% effective, risk-free').some(f => f.severity === 'block')).toBe(true);
  });
  it('passes honest psychoeducational copy', () => {
    expect(isClaimShippable('Faith-integrated support to help you work through anxiety.')).toBe(true);
  });
  it('flags potential PHI leakage in copy', () => {
    expect(flagPotentialPhi('My client with a trauma diagnosis...').length).toBeGreaterThan(0);
    expect(flagPotentialPhi('We offer couples therapy.')).toEqual([]);
  });
});

describe('FUNNEL ADAPTERS — each funnel writes leads into the ONE model', () => {
  it('leadFromInquiry maps a TLC pre-intake inquiry, defaulting consent OFF', () => {
    const lead = leadFromInquiry({ id: 'inq-9', firstName: 'Dana', status: 'attempting-contact', contactMethod: 'phone', contactValue: '555', source: 'church', receivedAt: NOW }, { now: NOW });
    expect(lead).toMatchObject({ business: 'tlc', pipeline: 'tlc-client-intake', stage: 'contacted', name: 'Dana', source: 'church-network' });
    expect(canOutreach(lead)).toBe(false); // inquiries predate explicit consent
  });
  it('leadFromInquiry flags seed example inquiries as seed', () => {
    expect(isSeedLead(leadFromInquiry({ id: 'inq-ex6', firstName: 'Sample B.', status: 'new' }, { now: NOW }))).toBe(true);
  });
  it('leadFromPracticeAcquisition routes by audience preset (the retarget seam)', () => {
    const patient = leadFromPracticeAcquisition({ id: 'pl-1', audiencePresetKey: 'patient-practice', name: 'P', stage: 'contacted', source: 'referral' }, { now: NOW });
    expect(patient.pipeline).toBe('tlc-client-intake');
    const b2b = leadFromPracticeAcquisition({ id: 'pl-2', audiencePresetKey: 'b2b-practices', name: 'Org', stage: 'new', source: 'linkedin' }, { now: NOW });
    expect(b2b.pipeline).toBe('tlc-training-enrollment');
  });
  it('leadFromSubscriber treats the subscribe opt-in AS email consent', () => {
    const lead = leadFromSubscriber({ id: 's1', email: 'a@b.com', confirmed: true, source: 'website', subscribedAt: NOW }, { now: NOW });
    expect(lead).toMatchObject({ business: 'gtm', pipeline: 'gtm-subscriber', stage: 'subscribed' });
    expect(canOutreach(lead, 'email')).toBe(true);
    expect(canOutreach(lead, 'phone')).toBe(false); // only email was opted into
  });
  it('leadFromBooking sets a fast booking lead with contact-only consent', () => {
    const lead = leadFromBooking({ id: 'bk1', name: 'Lee', phone: '555', status: 'held', partySize: 4, when: 'tonight 8pm', requestedAt: NOW }, { now: NOW });
    expect(lead).toMatchObject({ business: 'boxcar', pipeline: 'boxcar-booking', stage: 'held' });
    expect(lead.sourceDetail).toMatch(/Party 4/);
    expect(canOutreach(lead, 'text')).toBe(true);
  });
  it('leadFromRealEstateInquiry maps a property lead', () => {
    const lead = leadFromRealEstateInquiry({ id: 're1', name: 'Pat', email: 'p@x.com', property: '805 N Prospect', requestedAt: NOW }, { now: NOW });
    expect(lead).toMatchObject({ business: 'realestate', pipeline: 'realestate-leads', stage: 'new' });
    expect(lead.sourceDetail).toMatch(/805 N Prospect/);
  });
});
