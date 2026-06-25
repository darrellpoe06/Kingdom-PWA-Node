import { describe, it, expect } from 'vitest';
import {
  visibleAudiences, canSeeAudience, defaultAudience,
  audienceTracks, trackCompletion, moduleComplete,
  makeCertTemplate, certComplianceCheck, isAccreditedCredit, creditLabel,
  issueCertificate, certExpired, addMonthsISO,
  DEFAULT_CERT_CATALOG, catalogForAudience,
  DEFAULT_REQUIRED_TRAININGS, requiredTrainingStatus, requiredTrainingSummary,
} from '../lib/practice-academy.js';
import { TLC_LESSON_TRACKS } from '../lib/tlc-lessons.js';

const NOW = '2026-06-25T00:00:00.000Z';

// ---------------------------------------------------------------------------
// Audience scoping — clients see only client tracks; clinician/cert tracks staff.
// ---------------------------------------------------------------------------
describe('audience scoping', () => {
  it('PROVEN-TO-CATCH: a non-staff viewer can NEVER see the clinician or cert audiences', () => {
    const keys = visibleAudiences({ isStaff: false }).map((a) => a.key);
    expect(keys).toContain('client');
    expect(keys).not.toContain('therapist');
    expect(keys).not.toContain('training');
    expect(canSeeAudience('therapist', { isStaff: false })).toBe(false);
    expect(canSeeAudience('training', { isStaff: false })).toBe(false);
  });

  it('staff see all three audiences', () => {
    expect(visibleAudiences({ isStaff: true }).map((a) => a.key)).toEqual(['client', 'therapist', 'training']);
  });

  it('default audience is the first one the viewer may see', () => {
    expect(defaultAudience({ isStaff: false })).toBe('client');
    expect(defaultAudience({ isStaff: true })).toBe('client');
  });

  it('client audience tracks include the client psychoeducation track, not the clinician CE track', () => {
    const keys = audienceTracks('client').map((t) => t.key);
    expect(keys).toContain(TLC_LESSON_TRACKS.client.key);
    expect(keys).not.toContain(TLC_LESSON_TRACKS.therapist.key);
  });

  it('therapist audience tracks include the clinician CE track', () => {
    expect(audienceTracks('therapist').map((t) => t.key)).toContain(TLC_LESSON_TRACKS.therapist.key);
  });

  it('audienceTracks de-duplicates the shared "whole" track', () => {
    const keys = audienceTracks('client').map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

// ---------------------------------------------------------------------------
// Completion — real, from the learner's own progress + quiz records.
// ---------------------------------------------------------------------------
describe('completion', () => {
  const track = TLC_LESSON_TRACKS.client;

  it('a fresh learner has 0% and is not complete', () => {
    const c = trackCompletion(track, {}, {});
    expect(c.done).toBe(0);
    expect(c.complete).toBe(false);
  });

  it('a module is complete only when marked done AND its quiz passed', () => {
    const m = track.modules[0];
    expect(moduleComplete(m, { [m.id]: true }, {})).toBe(false); // quiz not passed
    expect(moduleComplete(m, { [m.id]: true }, { [m.id]: { passed: true } })).toBe(true);
  });

  it('marking every module done with quizzes passed completes the track', () => {
    const progress = {};
    const quiz = {};
    for (const m of track.modules) { progress[m.id] = true; quiz[m.id] = { passed: true }; }
    expect(trackCompletion(track, progress, quiz).complete).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Certification / CEU compliance — the bright line.
// ---------------------------------------------------------------------------
describe('cert compliance guard', () => {
  it('PROVEN-TO-CATCH: an accredited-CEU claim with no provider/number is REFUSED', () => {
    const tpl = makeCertTemplate({ kind: 'accredited-ceu', creditHours: 3 });
    const check = certComplianceCheck(tpl);
    expect(check.accreditedClaim).toBe(true);
    expect(check.ok).toBe(false);
    expect(check.issues.map((i) => i.field)).toEqual(expect.arrayContaining(['provider', 'accreditationNumber']));
    expect(isAccreditedCredit(tpl)).toBe(false);
  });

  it('PROVEN-TO-CATCH: an internal cert can NEVER be labeled accredited', () => {
    const tpl = makeCertTemplate({ kind: 'internal', accredited: true });
    const check = certComplianceCheck(tpl);
    expect(check.ok).toBe(false);
    expect(check.issues.some((i) => i.field === 'accredited')).toBe(true);
  });

  it('a fully-backed accredited CEU passes and is labeled accredited', () => {
    const tpl = makeCertTemplate({ kind: 'accredited-ceu', creditHours: 3, provider: 'ASWB ACE', accreditationNumber: '1234' });
    expect(certComplianceCheck(tpl).ok).toBe(true);
    expect(isAccreditedCredit(tpl)).toBe(true);
    expect(creditLabel(tpl)).toMatch(/ACCREDITED/);
    expect(creditLabel(tpl)).toContain('ASWB ACE');
  });

  it('an internal cert is labeled "not CEU", never accredited', () => {
    const tpl = makeCertTemplate({ kind: 'internal', creditHours: 2 });
    expect(creditLabel(tpl)).toMatch(/not CEU/);
    expect(creditLabel(tpl)).not.toMatch(/ACCREDITED/);
  });

  it('the default catalog ships its CE template UNaccredited (no false claim)', () => {
    const ce = DEFAULT_CERT_CATALOG.find((c) => c.id === 'cert-tlc-ce-clinical');
    expect(ce.kind).toBe('accredited-ceu');
    expect(isAccreditedCredit(ce)).toBe(false); // provider/number deliberately blank
    expect(creditLabel(ce)).toMatch(/NOT YET ACCREDITED/);
  });

  it('the forward-compatible fields exist on every template', () => {
    const tpl = makeCertTemplate({});
    expect(tpl).toHaveProperty('provider');
    expect(tpl).toHaveProperty('accreditationNumber');
    expect(tpl).toHaveProperty('creditHours');
    expect(tpl).toHaveProperty('expiresMonths');
  });
});

// ---------------------------------------------------------------------------
// Certificate issuance — honest downgrade, expiry, deterministic verify code.
// ---------------------------------------------------------------------------
describe('certificate issuance', () => {
  it('issues an internal certificate of completion', () => {
    const tpl = makeCertTemplate({ id: 'c1', kind: 'internal', creditHours: 1, expiresMonths: 12 });
    const cert = issueCertificate(tpl, { learnerName: 'Sam', learnerEmail: 's@x.com', trackTitle: 'T', now: NOW });
    expect(cert.accredited).toBe(false);
    expect(cert.disclaimer).toMatch(/NOT accredited/i);
    expect(cert.expiresAt).toBe(addMonthsISO(NOW, 12));
    expect(cert.verifyCode).toHaveLength(8);
  });

  it('PROVEN-TO-CATCH: issuing from an unbacked CE template downgrades to NON-accredited', () => {
    const tpl = makeCertTemplate({ id: 'c2', kind: 'accredited-ceu', creditHours: 3 }); // no provider
    const cert = issueCertificate(tpl, { learnerEmail: 's@x.com', now: NOW });
    expect(cert.accredited).toBe(false);
    expect(cert.provider).toBe(null);
    expect(cert.accreditationNumber).toBe(null);
  });

  it('issues real accredited CE when the template is backed', () => {
    const tpl = makeCertTemplate({ id: 'c3', kind: 'accredited-ceu', creditHours: 3, provider: 'NBCC', accreditationNumber: '99', expiresMonths: 24 });
    const cert = issueCertificate(tpl, { learnerEmail: 's@x.com', now: NOW });
    expect(cert.accredited).toBe(true);
    expect(cert.provider).toBe('NBCC');
    expect(cert.creditHours).toBe(3);
  });

  it('verify code + id are deterministic for the same inputs', () => {
    const tpl = makeCertTemplate({ id: 'c4', kind: 'internal' });
    const a = issueCertificate(tpl, { learnerEmail: 's@x.com', now: NOW });
    const b = issueCertificate(tpl, { learnerEmail: 's@x.com', now: NOW });
    expect(a.verifyCode).toBe(b.verifyCode);
    expect(a.id).toBe(b.id);
  });

  it('certExpired is true only past the expiry date', () => {
    const tpl = makeCertTemplate({ id: 'c5', kind: 'internal', expiresMonths: 12 });
    const cert = issueCertificate(tpl, { learnerEmail: 's@x.com', now: NOW });
    expect(certExpired(cert, '2026-12-01T00:00:00Z')).toBe(false);
    expect(certExpired(cert, '2027-07-01T00:00:00Z')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Required trainings status.
// ---------------------------------------------------------------------------
describe('required trainings', () => {
  const req = { id: 'r', title: 'HIPAA', cadenceMonths: 12 };

  it('never logged → "never"', () => {
    expect(requiredTrainingStatus(req, null, NOW).status).toBe('never');
  });

  it('logged within the cadence → current; near the end → due-soon; past → overdue', () => {
    expect(requiredTrainingStatus(req, '2026-01-01T00:00:00Z', NOW).status).toBe('current');
    expect(requiredTrainingStatus(req, '2025-07-01T00:00:00Z', NOW).status).toBe('due-soon');
    expect(requiredTrainingStatus(req, '2024-01-01T00:00:00Z', NOW).status).toBe('overdue');
  });

  it('summary tallies the default required trainings', () => {
    const reqs = DEFAULT_REQUIRED_TRAININGS;
    const tally = requiredTrainingSummary(reqs, {}, NOW);
    expect(tally.total).toBe(reqs.length);
    expect(tally.never).toBe(reqs.length);
  });
});

describe('catalog scoping', () => {
  it('catalogForAudience filters to the audience', () => {
    const training = catalogForAudience(DEFAULT_CERT_CATALOG, 'training').map((c) => c.id);
    expect(training).toContain('cert-tlc-onboarding');
    expect(training).not.toContain('cert-tlc-clinical-foundations'); // therapist audience
  });
});
