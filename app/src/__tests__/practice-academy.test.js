import { describe, it, expect } from 'vitest';
import {
  visibleAudiences, canSeeAudience, defaultAudience,
  audienceTracks, outcomesFor, trackCompletion, moduleComplete,
  makeCertTemplate, creditLabel, issueCertificate, certExpired, addMonthsISO,
  DEFAULT_CERT_CATALOG, catalogForAudience,
  HOUR_ACTIVITY_TYPES, makeHourEntry, sumHours, supervisedClinicalHours,
  hoursByCompetency, hoursByActivity, requirementProgress, IL_LCSW_REQUIREMENT,
  DEFAULT_REQUIRED_TRAININGS, requiredTrainingStatus, requiredTrainingSummary,
} from '../lib/practice-academy.js';
import { TLC_LESSON_TRACKS } from '../lib/tlc-lessons.js';

const NOW = '2026-06-25T00:00:00.000Z';

// ---------------------------------------------------------------------------
// Audience scoping — clients see only client tracks; clinician/cert tracks staff.
// ---------------------------------------------------------------------------
describe('audience scoping', () => {
  it('PROVEN-TO-CATCH: a non-staff viewer can NEVER see the clinician or training audiences', () => {
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
  });

  it('client audience tracks include the client track, not the clinician track', () => {
    const keys = audienceTracks('client').map((t) => t.key);
    expect(keys).toContain(TLC_LESSON_TRACKS.client.key);
    expect(keys).not.toContain(TLC_LESSON_TRACKS.therapist.key);
  });

  it('therapist audience tracks include the clinician track', () => {
    expect(audienceTracks('therapist').map((t) => t.key)).toContain(TLC_LESSON_TRACKS.therapist.key);
  });

  it('audienceTracks de-duplicates the shared "whole" track', () => {
    const keys = audienceTracks('client').map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

// ---------------------------------------------------------------------------
// Outcomes lead the experience — every audience has understand/skills/coping/improve.
// ---------------------------------------------------------------------------
describe('outcomes', () => {
  it('every audience has real, non-empty outcomes', () => {
    for (const key of ['client', 'therapist', 'training']) {
      const o = outcomesFor(key);
      expect(o.understand).toBeTruthy();
      expect(o.skills.length).toBeGreaterThan(0);
      expect(o.coping.length).toBeGreaterThan(0);
      expect(o.improve).toBeTruthy();
    }
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
    expect(moduleComplete(m, { [m.id]: true }, {})).toBe(false);
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
// Certificates — affirm hours; accreditation is neutral optional metadata.
// ---------------------------------------------------------------------------
describe('certificates', () => {
  it('a completion certificate states its training hours plainly — no caveats', () => {
    const tpl = makeCertTemplate({ trainingHours: 3 });
    const label = creditLabel(tpl);
    expect(label).toContain('3 training hours');
    expect(label).not.toMatch(/not CEU|NOT ACCREDITED|accredited/i);
  });

  it('CE-provider metadata is appended only when present, as a neutral field', () => {
    const plain = makeCertTemplate({ trainingHours: 3 });
    expect(creditLabel(plain)).not.toMatch(/CE provider/);
    const withCe = makeCertTemplate({ trainingHours: 3, ceProvider: 'ASWB ACE', ceNumber: '1234' });
    expect(creditLabel(withCe)).toContain('CE provider: ASWB ACE #1234');
  });

  it('the forward-compatible optional fields exist on every template', () => {
    const tpl = makeCertTemplate({});
    expect(tpl).toHaveProperty('ceProvider');
    expect(tpl).toHaveProperty('ceNumber');
    expect(tpl).toHaveProperty('trainingHours');
    expect(tpl).toHaveProperty('expiresMonths');
  });

  it('the default catalog ships plain completion certs (no CE provider forced)', () => {
    for (const c of DEFAULT_CERT_CATALOG) {
      expect(c.ceProvider).toBe(null);
      expect(creditLabel(c)).not.toMatch(/NOT|caveat|warning/i);
    }
  });

  it('issues a certificate that affirms the hours, with expiry + deterministic verify code', () => {
    const tpl = makeCertTemplate({ id: 'c1', trainingHours: 3, expiresMonths: 12 });
    const a = issueCertificate(tpl, { learnerEmail: 's@x.com', trackTitle: 'T', now: NOW });
    const b = issueCertificate(tpl, { learnerEmail: 's@x.com', trackTitle: 'T', now: NOW });
    expect(a.trainingHours).toBe(3);
    expect(a.expiresAt).toBe(addMonthsISO(NOW, 12));
    expect(a.verifyCode).toHaveLength(8);
    expect(a.verifyCode).toBe(b.verifyCode); // deterministic
  });

  it('CE-provider metadata carries through issuance when present', () => {
    const tpl = makeCertTemplate({ id: 'c2', trainingHours: 3, ceProvider: 'NBCC', ceNumber: '99' });
    const cert = issueCertificate(tpl, { learnerEmail: 's@x.com', now: NOW });
    expect(cert.ceProvider).toBe('NBCC');
    expect(cert.ceNumber).toBe('99');
  });

  it('certExpired is true only past the expiry date', () => {
    const cert = issueCertificate(makeCertTemplate({ id: 'c3', expiresMonths: 12 }), { learnerEmail: 's@x.com', now: NOW });
    expect(certExpired(cert, '2026-12-01T00:00:00Z')).toBe(false);
    expect(certExpired(cert, '2027-07-01T00:00:00Z')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Training-hours ledger — the real, standard IL MSW → LCSW tracker.
// ---------------------------------------------------------------------------
describe('training-hours ledger', () => {
  const entries = [
    makeHourEntry({ id: 'h1', date: '2026-06-01', hours: 10, activity: 'supervised-clinical', competency: 'Individual therapy', supervisor: 'Christina Poe, LCSW' }),
    makeHourEntry({ id: 'h2', date: '2026-06-08', hours: 5, activity: 'supervised-clinical', competency: 'Crisis & risk', supervisor: 'Christina Poe, LCSW' }),
    makeHourEntry({ id: 'h3', date: '2026-06-09', hours: 1, activity: 'supervision', competency: 'Supervision', supervisor: 'Christina Poe, LCSW' }),
    makeHourEntry({ id: 'h4', date: '2026-06-10', hours: 2, activity: 'training', competency: 'Documentation' }),
  ];

  it('makeHourEntry clamps hours and defaults the activity type', () => {
    const e = makeHourEntry({ hours: -5 });
    expect(e.hours).toBe(0);
    expect(HOUR_ACTIVITY_TYPES.some((t) => t.key === e.activity)).toBe(true);
  });

  it('sumHours totals all entries; supervisedClinicalHours counts only clinical', () => {
    expect(sumHours(entries)).toBe(18);
    expect(supervisedClinicalHours(entries)).toBe(15); // 10 + 5, not supervision/training
  });

  it('rolls up hours by competency and by activity', () => {
    const byComp = hoursByCompetency(entries);
    expect(byComp['Individual therapy']).toBe(10);
    expect(byComp['Crisis & risk']).toBe(5);
    const byAct = hoursByActivity(entries);
    expect(byAct['supervised-clinical']).toBe(15);
    expect(byAct.supervision).toBe(1);
  });

  it('requirementProgress totals supervised-clinical toward the IL target with supervisor of record', () => {
    const prog = requirementProgress(entries, IL_LCSW_REQUIREMENT);
    expect(prog.logged).toBe(15);
    expect(prog.target).toBe(IL_LCSW_REQUIREMENT.supervisedClinicalHours);
    expect(prog.remaining).toBe(prog.target - 15);
    expect(prog.supervisionHours).toBe(1);
    expect(prog.supervisors).toEqual(['Christina Poe, LCSW']);
    expect(prog.confirmed).toBe(false); // exact IL requirement is SME-confirmed
  });

  it('an empty ledger is 0 logged, full remaining', () => {
    const prog = requirementProgress([], IL_LCSW_REQUIREMENT);
    expect(prog.logged).toBe(0);
    expect(prog.remaining).toBe(prog.target);
    expect(prog.pct).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Required trainings status.
// ---------------------------------------------------------------------------
describe('required trainings', () => {
  const req = { id: 'r', title: 'HIPAA', cadenceMonths: 12 };

  it('never logged → "never"; within cadence → current; near end → due-soon; past → overdue', () => {
    expect(requiredTrainingStatus(req, null, NOW).status).toBe('never');
    expect(requiredTrainingStatus(req, '2026-01-01T00:00:00Z', NOW).status).toBe('current');
    expect(requiredTrainingStatus(req, '2025-07-01T00:00:00Z', NOW).status).toBe('due-soon');
    expect(requiredTrainingStatus(req, '2024-01-01T00:00:00Z', NOW).status).toBe('overdue');
  });

  it('summary tallies the default required trainings', () => {
    const tally = requiredTrainingSummary(DEFAULT_REQUIRED_TRAININGS, {}, NOW);
    expect(tally.total).toBe(DEFAULT_REQUIRED_TRAININGS.length);
    expect(tally.never).toBe(DEFAULT_REQUIRED_TRAININGS.length);
  });
});

describe('catalog scoping', () => {
  it('catalogForAudience filters to the audience', () => {
    const training = catalogForAudience(DEFAULT_CERT_CATALOG, 'training').map((c) => c.id);
    expect(training).toContain('cert-tlc-onboarding');
    expect(training).not.toContain('cert-tlc-clinical-foundations'); // therapist audience
  });
});
