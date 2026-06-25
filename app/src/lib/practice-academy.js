// =============================================================================
// practice-academy — the Practice-scoped Learn space engine (TLC Therapy Solutions)
// =============================================================================
// Declared by Darrell 2026-06-25: "Practice should have a Learn space also — for
// clients, therapists, for training purposes and work certifications or whatever
// is needed." This is the PURE engine behind a dedicated Learn space scoped to the
// Practice, serving THREE audiences, plus the certification / CEU framework.
//
// IT IS NOT A NEW LEARNING ENGINE. It is a Practice-scoped surface ON the shared
// Learn primitives:
//   * Content       — lib/tlc-lessons.js (the three engine-shaped tracks).
//   * Lesson arc     — lib/lesson-flow.js (Open → Teach → Engage → Apply → Send-off).
//   * Depth / age    — lib/learn-framework.js (levels, age bands, quiz grading,
//                      courseAssessment for real completion).
// This module adds ONLY what is Practice-specific: audience scoping, and a
// certification / CEU framework that is honest about accreditation.
//
// AUDIENCE SCOPING (role/membership-aware):
//   * client    — psychoeducation for clients + families (NOT treatment, no PHI).
//   * therapist — clinical training, onboarding, supervision, best-practice (staff).
//   * training  — course completion, internal certs, and CEU tracking (staff).
// Clients only ever see the client track; clinician + cert tracks are staff-gated.
// A real client/therapist deployment pins the audience from membership; until that
// auth lands (Phase 2 / roles layer), staff can switch audiences to preview/run any.
//
// CERTIFICATION / CEU — THE COMPLIANCE BRIGHT LINE (binding):
//   We CAN issue PoeTech/TLC INTERNAL training certificates + completion records
//   freely. We CANNOT label hours as ACCREDITED CEU (APA/ASWB/NBCC, etc.) unless a
//   real accredited CE provider + a verifiable accreditation number back the claim.
//   The framework carries the forward-compatible fields (provider, accreditation #,
//   credit hours, expiry) so real CEU tracking drops in later — but a false
//   accreditation claim is structurally refused by certComplianceCheck (a proven-
//   to-catch guard, DR-0076). Default = internal, never CEU.
//
// VERIFICATION (DR-0076): completion is REAL (courseAssessment over the learner's
// own progress + quiz records), never painted. Pure + deterministic (callers pass
// `now`) so it is safe in tests and workflows.
// =============================================================================
import { TLC_LESSON_TRACKS, tracksForSide, ceCreditsToConfirm, isTrackPublishable } from './tlc-lessons.js';
import { courseAssessment, moduleQuizPassed } from './learn-framework.js';

// ---------------------------------------------------------------------------
// Audiences — the three sides of the Practice Learn space. `sideKey` maps to the
// existing tlc-lessons track grouping (tracksForSide) so NOTHING is forked.
// `staffOnly` gates clinician + cert tracks behind Practice staff (Christina /
// Darrell / governor); the client track is open to a future client deployment.
// ---------------------------------------------------------------------------
export const ACADEMY_AUDIENCES = [
  {
    key: 'client', label: 'Clients', icon: '🧭', sideKey: 'client', staffOnly: false,
    who: 'clients and their families',
    blurb: 'Psychoeducation — understand your situation and learn coping skills between sessions. Educational support, not treatment or diagnosis.',
  },
  {
    key: 'therapist', label: 'Therapists', icon: '🩺', sideKey: 'therapist', staffOnly: true,
    who: 'TLC clinicians',
    blurb: 'Clinical training, onboarding, supervision and best-practice modules for the TLC team.',
  },
  {
    key: 'training', label: 'Training & Certs', icon: '🎓', sideKey: 'training', staffOnly: true,
    who: 'the TLC team',
    blurb: 'Course completion tracking, internal certifications, and continuing-education (CEU) tracking.',
  },
];

export const ACADEMY_AUDIENCE_KEYS = ACADEMY_AUDIENCES.map((a) => a.key);

export function getAudience(key) {
  return ACADEMY_AUDIENCES.find((a) => a.key === key) || null;
}

// Which audiences a viewer may see. A non-staff viewer only ever sees the client
// (open) audiences; staff see all. Never empty (client is always visible).
export function visibleAudiences({ isStaff = false } = {}) {
  return ACADEMY_AUDIENCES.filter((a) => isStaff || !a.staffOnly);
}

export function canSeeAudience(audienceKey, { isStaff = false } = {}) {
  const a = getAudience(audienceKey);
  if (!a) return false;
  return isStaff || !a.staffOnly;
}

// A sensible default audience for a viewer (the first one they're allowed to see).
export function defaultAudience({ isStaff = false } = {}) {
  const vis = visibleAudiences({ isStaff });
  return (vis[0] && vis[0].key) || 'client';
}

// The supporting-lesson tracks for an audience — straight from tlc-lessons
// (tracksForSide), de-duplicated by track key (the `whole` track supports several).
export function audienceTracks(audienceKey) {
  const a = getAudience(audienceKey);
  if (!a) return [];
  const seen = new Set();
  return tracksForSide(a.sideKey).filter((t) => {
    if (!t || seen.has(t.key)) return false;
    seen.add(t.key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Real completion — reuse the shared courseAssessment over a track's modules and
// the learner's OWN progress + quiz records. `progress` = { [moduleId]: truthy };
// `quizState` = { [moduleId]: { passed, pct, at } }.
// ---------------------------------------------------------------------------
export function trackCompletion(track, progress = {}, quizState = {}) {
  const modules = (track && track.modules) || [];
  return courseAssessment(modules, progress, quizState);
}

// A module is "complete" for the learner when it is marked done AND (if it has a
// quiz) the quiz is passed. Used to drive the per-module checkmarks.
export function moduleComplete(module, progress = {}, quizState = {}) {
  if (!module) return false;
  return !!progress[module.id] && moduleQuizPassed(module, quizState);
}

// ===========================================================================
// CERTIFICATION / CEU FRAMEWORK
// ===========================================================================
export const CERT_KINDS = {
  internal: {
    key: 'internal',
    label: 'Internal certificate',
    issuer: 'PoeTech / TLC',
    accredited: false,
    canIssueFreely: true,
    disclaimer: 'Internal certificate of completion. This is NOT accredited continuing education (CE/CEU) and is not valid toward state-licensure renewal.',
  },
  'accredited-ceu': {
    key: 'accredited-ceu',
    label: 'Accredited CE / CEU',
    issuer: null, // the named, approved CE provider fills this
    accredited: true,
    canIssueFreely: false,
    disclaimer: 'Accredited continuing-education credit — valid ONLY when issued by a real APA/ASWB/NBCC-approved CE provider with a verifiable accreditation number.',
  },
};

export const CERT_KIND_KEYS = Object.keys(CERT_KINDS);

// The forward-compatible certificate TEMPLATE shape (a catalog entry). Carries the
// accredited-CEU fields (provider / accreditation # / credit hours / expiry) so
// real CEU tracking drops in later — but defaults to a safe internal cert.
export function makeCertTemplate(partial = {}) {
  const p = partial || {};
  const kind = CERT_KINDS[p.kind] ? p.kind : 'internal';
  return {
    id: p.id || `cert-${Math.random().toString(36).slice(2, 9)}`,
    kind,
    title: p.title || 'Certificate of Completion',
    trackKey: p.trackKey || null,
    audienceKey: p.audienceKey || null,
    // CE / accreditation fields (the forward set):
    provider: p.provider || null,            // approved CE provider org (APA/ASWB/NBCC, ...)
    accreditationNumber: p.accreditationNumber || null, // the provider's approval number
    creditHours: Number(p.creditHours) || 0, // numeric hours
    creditUnit: p.creditUnit || (kind === 'accredited-ceu' ? 'CE hours' : 'contact hours'),
    accredited: !!p.accredited,              // the CLAIM that hours count as accredited CEU
    expiresMonths: p.expiresMonths == null ? null : Number(p.expiresMonths) || null,
  };
}

// THE COMPLIANCE GUARD (proven-to-catch). An accredited CEU claim is structurally
// refused unless a named provider + a verifiable accreditation number + real hours
// back it. An internal cert may never carry an accredited claim. Returns
// { ok, accreditedClaim, issues:[{ field, severity, why }] }.
export function certComplianceCheck(template) {
  const t = template || {};
  const issues = [];
  const accreditedClaim = !!t.accredited || t.kind === 'accredited-ceu';

  if (accreditedClaim) {
    if (!t.provider) issues.push({ field: 'provider', severity: 'block', why: 'An accredited CEU claim requires a named, approved CE provider (APA / ASWB / NBCC, etc.).' });
    if (!t.accreditationNumber) issues.push({ field: 'accreditationNumber', severity: 'block', why: 'An accredited CEU claim requires the provider’s verifiable accreditation / approval number.' });
    if (!(Number(t.creditHours) > 0)) issues.push({ field: 'creditHours', severity: 'block', why: 'Accredited CE must state the real number of credit hours.' });
  }
  // An internal cert can never be labeled accredited CEU.
  if (t.kind === 'internal' && t.accredited) {
    issues.push({ field: 'accredited', severity: 'block', why: 'Internal certificates cannot be labeled accredited CEU. Use the Accredited CE / CEU kind with a real provider.' });
  }

  const ok = issues.filter((i) => i.severity === 'block').length === 0;
  return { ok, accreditedClaim, issues };
}

// Will this template actually issue ACCREDITED credit? Only when it claims it AND
// the compliance guard passes. This is the single source of truth for "is this CEU."
export function isAccreditedCredit(template) {
  const check = certComplianceCheck(template);
  return check.accreditedClaim && check.ok;
}

// The honest credit label. Never claims accreditation the template can't back.
export function creditLabel(template) {
  const t = template || {};
  const hrs = Number(t.creditHours) || 0;
  if (isAccreditedCredit(t)) {
    return `${hrs} ${t.creditUnit || 'CE hours'} · ACCREDITED — ${t.provider} #${t.accreditationNumber}`;
  }
  if (certComplianceCheck(t).accreditedClaim) {
    // Wants to be CEU but isn't backed yet — say so plainly.
    return `${hrs} hours · NOT YET ACCREDITED (provider / number to confirm) — completion only, not CEU`;
  }
  return hrs > 0
    ? `${hrs} ${t.creditUnit || 'contact hours'} · internal (not CEU)`
    : 'Certificate of completion · internal (not CEU)';
}

// Deterministic verify code from the issuance inputs (no Math.random / Date here,
// so issuance is reproducible + testable). 8-char base36.
function verifyCodeFor(parts) {
  const s = parts.filter(Boolean).join('|');
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36).toUpperCase().padStart(8, '0').slice(-8);
}

// Add N months to an ISO date string, returning an ISO date (YYYY-MM-DD...). Pure.
export function addMonthsISO(iso, months) {
  if (!iso || !months) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + Number(months));
  return d.toISOString();
}

// Issue a certificate when a learner completes a track. HONEST: if the template
// wants to be accredited CEU but the compliance guard fails, the issued record is
// downgraded to a non-accredited completion (the credit does NOT count as CEU) and
// carries the internal disclaimer. `now` is an ISO string the caller supplies.
export function issueCertificate(template, { learnerName = '', learnerEmail = '', trackTitle = '', completion = null, now = null } = {}) {
  const t = makeCertTemplate(template || {});
  const accredited = isAccreditedCredit(t);
  const issuedAt = now || null;
  const expiresAt = issuedAt && t.expiresMonths ? addMonthsISO(issuedAt, t.expiresMonths) : null;
  const hrs = Number(t.creditHours) || 0;

  return {
    id: `issued-${verifyCodeFor([t.id, learnerEmail, issuedAt])}`,
    certId: t.id,
    kind: t.kind,
    title: t.title,
    trackKey: t.trackKey,
    trackTitle,
    audienceKey: t.audienceKey,
    learnerName: learnerName || 'Learner',
    learnerEmail,
    accredited,                                   // the ONLY truthful accreditation flag
    creditHours: hrs,
    creditUnit: t.creditUnit,
    provider: accredited ? t.provider : null,
    accreditationNumber: accredited ? t.accreditationNumber : null,
    label: creditLabel(t),
    disclaimer: accredited ? null : CERT_KINDS.internal.disclaimer,
    completionPct: completion && typeof completion.progressPct === 'number' ? completion.progressPct : 100,
    issuedAt,
    expiresAt,
    verifyCode: verifyCodeFor([t.id, learnerEmail, issuedAt]),
  };
}

// Is an issued certificate expired as of `now` (ISO string)?
export function certExpired(cert, now) {
  if (!cert || !cert.expiresAt || !now) return false;
  const exp = new Date(cert.expiresAt);
  const n = new Date(now);
  if (isNaN(exp.getTime()) || isNaN(n.getTime())) return false;
  return n.getTime() > exp.getTime();
}

// ---------------------------------------------------------------------------
// Default certificate catalog — demonstrates BOTH:
//   * internal certs that can issue NOW (kind 'internal', never CEU); and
//   * the accredited-CEU forward shape, deliberately NOT YET ACCREDITED (provider
//     / number to confirm) so the fields exist without a false claim. Christina
//     fills the provider + accreditation number to turn one real.
// ---------------------------------------------------------------------------
export const DEFAULT_CERT_CATALOG = [
  makeCertTemplate({
    id: 'cert-tlc-clinical-foundations', kind: 'internal', audienceKey: 'therapist',
    title: 'TLC Clinical Foundations — Certificate of Completion',
    trackKey: TLC_LESSON_TRACKS.therapist.key, creditHours: 3, creditUnit: 'contact hours', expiresMonths: 24,
  }),
  makeCertTemplate({
    id: 'cert-tlc-onboarding', kind: 'internal', audienceKey: 'training',
    title: 'TLC Contractor Onboarding — Certificate',
    trackKey: TLC_LESSON_TRACKS.whole.key, creditHours: 1, creditUnit: 'contact hours', expiresMonths: null,
  }),
  makeCertTemplate({
    // Forward shape: wants to be accredited CEU, but provider/number are blank, so
    // certComplianceCheck refuses the CEU claim until Christina supplies them.
    id: 'cert-tlc-ce-clinical', kind: 'accredited-ceu', audienceKey: 'training',
    title: 'TLC Clinical Continuing Education (CE)',
    trackKey: TLC_LESSON_TRACKS.therapist.key, creditHours: 3, creditUnit: 'CE hours',
    accredited: false, provider: null, accreditationNumber: null, expiresMonths: 24,
  }),
];

// Catalog entries that apply to one audience.
export function catalogForAudience(catalog, audienceKey) {
  return (catalog || []).filter((c) => !c.audienceKey || c.audienceKey === audienceKey);
}

// ---------------------------------------------------------------------------
// Required trainings — a place to track trainings clinicians must keep current,
// with a cadence (months). Status is derived from the last completion + `now`.
// ---------------------------------------------------------------------------
export const DEFAULT_REQUIRED_TRAININGS = [
  { id: 'req-hipaa', title: 'HIPAA & Privacy', audienceKey: 'therapist', cadenceMonths: 12, note: 'Annual; required for all clinical staff. Christina confirms the IL standard.' },
  { id: 'req-ethics', title: 'Ethics & Professional Boundaries', audienceKey: 'therapist', cadenceMonths: 24, note: 'Per licensure cycle.' },
  { id: 'req-risk', title: 'Risk: Suicide / Safety & Mandated Reporting', audienceKey: 'therapist', cadenceMonths: 12, note: 'Highest-stakes; Christina (LCSW) signs off the protocol.' },
];

// Status of one required training given the last-completed ISO date and `now`.
// Returns { status, dueAt, daysLeft }. status: 'never' | 'current' | 'due-soon' | 'overdue'.
export function requiredTrainingStatus(req, lastCompletedISO, now) {
  if (!req) return { status: 'never', dueAt: null, daysLeft: null };
  if (!lastCompletedISO) return { status: 'never', dueAt: null, daysLeft: null };
  const dueAt = req.cadenceMonths ? addMonthsISO(lastCompletedISO, req.cadenceMonths) : null;
  if (!dueAt || !now) return { status: 'current', dueAt, daysLeft: null };
  const due = new Date(dueAt).getTime();
  const n = new Date(now).getTime();
  const daysLeft = Math.round((due - n) / 86400000);
  let status = 'current';
  if (daysLeft < 0) status = 'overdue';
  else if (daysLeft <= 30) status = 'due-soon';
  return { status, dueAt, daysLeft };
}

// A small roll-up for the manager (staff) view: how many required trainings are
// current / due-soon / overdue / never for a given completions map.
export function requiredTrainingSummary(reqs, completions = {}, now = null) {
  const list = reqs || [];
  const tally = { total: list.length, current: 0, dueSoon: 0, overdue: 0, never: 0 };
  for (const req of list) {
    const { status } = requiredTrainingStatus(req, completions[req.id] || null, now);
    if (status === 'current') tally.current += 1;
    else if (status === 'due-soon') tally.dueSoon += 1;
    else if (status === 'overdue') tally.overdue += 1;
    else tally.never += 1;
  }
  return tally;
}

// Re-export the honesty helpers the surface needs from tlc-lessons so the
// component imports one engine.
export { isTrackPublishable, ceCreditsToConfirm };
