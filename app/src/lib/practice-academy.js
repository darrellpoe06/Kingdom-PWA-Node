// =============================================================================
// practice-academy — the Practice-scoped Learn space engine (TLC Therapy Solutions)
// =============================================================================
// Declared by Darrell 2026-06-25: "Practice should have a Learn space also — for
// clients, therapists, for training purposes and work certifications or whatever
// is needed." This is the PURE engine behind a dedicated Learn space scoped to the
// Practice, serving THREE audiences, with a real TRAINING-HOURS LEDGER.
//
// IT IS NOT A NEW LEARNING ENGINE. It is a Practice-scoped surface ON the shared
// Learn primitives:
//   * Content   — lib/tlc-lessons.js (the three engine-shaped tracks).
//   * Lesson arc — lib/lesson-flow.js (Open → Teach → Engage → Apply → Send-off).
//   * Depth/age  — lib/learn-framework.js (levels, age bands, quiz grading,
//                  courseAssessment for real completion).
// This module adds ONLY what is Practice-specific: audience scoping, the learning
// OUTCOMES that lead the experience, completion certificates that affirm growth,
// and a training-hours ledger.
//
// THE VALUE IS THE HELP, NOT THE CREDENTIAL (Darrell 2026-06-25, experience-over-
// credentials / SKOS): a course is worth building when its content actually helps
// stakeholders understand the process and build skills + coping skills. Outcomes
// and growth lead; certificates affirm the learning on its own merit.
//
// HOURS ARE HOURS. The ledger logs legitimate TRAINING HOURS to the industry
// standard — for clinicians, SUPERVISED CLINICAL / TRAINING HOURS that count on the
// Illinois MSW → LCSW path (Illinois requires supervised clinical experience hours
// logged under a qualified supervisor of record). Hours are tracked per learner
// with date / hours / activity type / supervisor of record / competency, and
// totaled toward the standard. Accreditation / CE-provider info is a plain OPTIONAL
// metadata field for the cases that want it — neutral, not a gate, not a headline.
// EXACT IL requirement specifics are confirmed by Christina (LCSW) as the SME.
//
// VERIFICATION (DR-0076): completion + hour totals are REAL (derived from the
// learner's own records), never painted. Pure + deterministic (callers pass `now`).
// =============================================================================
import { TLC_LESSON_TRACKS, tracksForSide, ceCreditsToConfirm, isTrackPublishable } from './tlc-lessons.js';
import { courseAssessment, moduleQuizPassed } from './learn-framework.js';

// ---------------------------------------------------------------------------
// Audiences — the three sides of the Practice Learn space. `sideKey` maps to the
// existing tlc-lessons track grouping (tracksForSide) so NOTHING is forked.
// `staffOnly` gates clinician + training tracks behind Practice staff (Christina /
// Darrell); the client track is open to a future client deployment.
// ---------------------------------------------------------------------------
export const ACADEMY_AUDIENCES = [
  {
    key: 'client', label: 'Clients', icon: '🧭', sideKey: 'client', staffOnly: false,
    who: 'clients and their families',
    blurb: 'Understand your situation and build real coping skills you can use between sessions. Educational support, not treatment or diagnosis.',
  },
  {
    key: 'therapist', label: 'Therapists', icon: '🩺', sideKey: 'therapist', staffOnly: true,
    who: 'TLC clinicians',
    blurb: 'Grow clinical skill and confidence — training, onboarding, supervision and best-practice modules, with your training hours logged as you go.',
  },
  {
    key: 'training', label: 'Training & Hours', icon: '🎓', sideKey: 'training', staffOnly: true,
    who: 'the TLC team',
    blurb: 'Course completion, certificates that affirm your growth, and a training-hours ledger toward the Illinois MSW → LCSW pathway.',
  },
];

export const ACADEMY_AUDIENCE_KEYS = ACADEMY_AUDIENCES.map((a) => a.key);

export function getAudience(key) {
  return ACADEMY_AUDIENCES.find((a) => a.key === key) || null;
}

// Which audiences a viewer may see. A non-staff viewer only ever sees the open
// (client) audiences; staff see all. Never empty (client is always visible).
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
// OUTCOMES — what each audience actually GAINS. This leads the experience: the
// help and skill-building is the value. Modest, real, stakeholder-facing.
// ---------------------------------------------------------------------------
export const AUDIENCE_OUTCOMES = {
  client: {
    understand: 'How your situation works — what anxiety, stress, and hard seasons are doing, in plain language.',
    skills: ['Name what you’re feeling', 'Use grounding and paced-breathing in a hard moment', 'Know what to expect from therapy'],
    coping: ['Steady your body when it spikes', 'Support a loved one without burning out', 'Know where to turn in a crisis'],
    improve: 'You leave each lesson with one concrete thing to try — small steps that add up to feeling more in control.',
  },
  therapist: {
    understand: 'The ethical, cultural, and documentation foundations of strong clinical work.',
    skills: ['Faith-integrated care done ethically', 'Cultural humility in practice', 'Clean documentation and the PHI line'],
    coping: ['Hold boundaries that protect you and the client', 'Recognize and route risk early'],
    improve: 'Each module sharpens real practice — and your training hours are logged toward the IL MSW → LCSW pathway as you go.',
  },
  training: {
    understand: 'How completion, certificates, and supervised training hours fit together on the path toward licensure.',
    skills: ['Track competencies across your work', 'Build a clean hours record under a supervisor of record'],
    coping: ['See your progress toward the requirement at a glance'],
    improve: 'Your growth is affirmed by certificates and a real, standard hours ledger — accreditation optional, never required.',
  },
};

export function outcomesFor(audienceKey) {
  return AUDIENCE_OUTCOMES[audienceKey] || AUDIENCE_OUTCOMES.client;
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

export function moduleComplete(module, progress = {}, quizState = {}) {
  if (!module) return false;
  return !!progress[module.id] && moduleQuizPassed(module, quizState);
}

// ===========================================================================
// CERTIFICATES — affirm the learning + growth, on their own merit. Accreditation /
// CE-provider info is OPTIONAL neutral metadata; it is never a gate or a caveat.
// ===========================================================================

// A certificate TEMPLATE (catalog entry). `trainingHours` are the real hours the
// course represents. `ceProvider` / `ceNumber` are optional metadata for the cases
// where a continuing-education provider matters — equal footing with any other field.
export function makeCertTemplate(partial = {}) {
  const p = partial || {};
  return {
    id: p.id || `cert-${Math.random().toString(36).slice(2, 9)}`,
    title: p.title || 'Certificate of Completion',
    trackKey: p.trackKey || null,
    audienceKey: p.audienceKey || null,
    trainingHours: Number(p.trainingHours) || 0,        // real training hours represented
    hoursUnit: p.hoursUnit || 'training hours',
    competency: p.competency || null,                   // primary competency area, if any
    // Optional CE-provider metadata (neutral; present only when it matters):
    ceProvider: p.ceProvider || null,
    ceNumber: p.ceNumber || null,
    expiresMonths: p.expiresMonths == null ? null : Number(p.expiresMonths) || null,
  };
}

// A neutral, truthful label. States the hours; appends CE-provider info only when
// present. No warnings, no caveats.
export function creditLabel(template) {
  const t = template || {};
  const hrs = Number(t.trainingHours) || 0;
  const base = hrs > 0 ? `${hrs} ${t.hoursUnit || 'training hours'}` : 'Certificate of completion';
  if (t.ceProvider) return `${base} · CE provider: ${t.ceProvider}${t.ceNumber ? ` #${t.ceNumber}` : ''}`;
  return base;
}

// Deterministic verify code from the issuance inputs (no Math.random / Date here,
// so issuance is reproducible + testable). 8-char base36.
function verifyCodeFor(parts) {
  const s = parts.filter(Boolean).join('|');
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36).toUpperCase().padStart(8, '0').slice(-8);
}

// Add N months to an ISO date string, returning an ISO string. Pure.
export function addMonthsISO(iso, months) {
  if (!iso || !months) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + Number(months));
  return d.toISOString();
}

// Issue a certificate when a learner completes a track. Affirms the learning +
// hours; carries CE-provider metadata when present. `now` is an ISO string.
export function issueCertificate(template, { learnerName = '', learnerEmail = '', trackTitle = '', completion = null, now = null } = {}) {
  const t = makeCertTemplate(template || {});
  const issuedAt = now || null;
  const expiresAt = issuedAt && t.expiresMonths ? addMonthsISO(issuedAt, t.expiresMonths) : null;
  const hrs = Number(t.trainingHours) || 0;
  return {
    id: `issued-${verifyCodeFor([t.id, learnerEmail, issuedAt])}`,
    certId: t.id,
    title: t.title,
    trackKey: t.trackKey,
    trackTitle,
    audienceKey: t.audienceKey,
    learnerName: learnerName || 'Learner',
    learnerEmail,
    trainingHours: hrs,
    hoursUnit: t.hoursUnit,
    competency: t.competency,
    ceProvider: t.ceProvider,   // optional metadata, passed through as-is
    ceNumber: t.ceNumber,
    label: creditLabel(t),
    completionPct: completion && typeof completion.progressPct === 'number' ? completion.progressPct : 100,
    issuedAt,
    expiresAt,
    verifyCode: verifyCodeFor([t.id, learnerEmail, issuedAt]),
  };
}

export function certExpired(cert, now) {
  if (!cert || !cert.expiresAt || !now) return false;
  const exp = new Date(cert.expiresAt);
  const n = new Date(now);
  if (isNaN(exp.getTime()) || isNaN(n.getTime())) return false;
  return n.getTime() > exp.getTime();
}

// Default certificate catalog — completion certificates that affirm growth. The
// CE-provider fields are simply blank unless a course pursues a CE provider.
export const DEFAULT_CERT_CATALOG = [
  makeCertTemplate({
    id: 'cert-tlc-clinical-foundations', audienceKey: 'therapist',
    title: 'TLC Clinical Foundations — Certificate of Completion',
    trackKey: TLC_LESSON_TRACKS.therapist.key, trainingHours: 3, competency: 'Ethics & boundaries', expiresMonths: 24,
  }),
  makeCertTemplate({
    id: 'cert-tlc-onboarding', audienceKey: 'training',
    title: 'TLC Contractor Onboarding — Certificate',
    trackKey: TLC_LESSON_TRACKS.whole.key, trainingHours: 1, expiresMonths: null,
  }),
  makeCertTemplate({
    id: 'cert-tlc-clinical-ce', audienceKey: 'training',
    title: 'TLC Clinical Training — Certificate of Completion',
    trackKey: TLC_LESSON_TRACKS.therapist.key, trainingHours: 3, competency: 'Clinical practice', expiresMonths: 24,
    // ceProvider / ceNumber left blank — optional, only filled if a CE provider is pursued.
  }),
];

export function catalogForAudience(catalog, audienceKey) {
  return (catalog || []).filter((c) => !c.audienceKey || c.audienceKey === audienceKey);
}

// ===========================================================================
// TRAINING-HOURS LEDGER — the real, standard hours tracker. Built for the Illinois
// MSW → LCSW supervised-clinical-experience pathway (Christina, LCSW, is the SME
// for the exact current IL DFPR requirement).
// ===========================================================================

// Activity types that matter for the IL supervised-experience record. Whether each
// counts toward the supervised-clinical total is marked `countsClinical` — kept
// conservative; Christina confirms the exact IL rule.
export const HOUR_ACTIVITY_TYPES = [
  { key: 'supervised-clinical', label: 'Supervised clinical (client-facing)', countsClinical: true },
  { key: 'supervision', label: 'Clinical supervision session', countsClinical: false },
  { key: 'training', label: 'Training / coursework', countsClinical: false },
  { key: 'didactic', label: 'Didactic / seminar', countsClinical: false },
  { key: 'other', label: 'Other professional development', countsClinical: false },
];

export const DEFAULT_ACTIVITY_TYPE = 'supervised-clinical';

export function activityType(key) {
  return HOUR_ACTIVITY_TYPES.find((t) => t.key === key) || null;
}

// Clinical competency areas an hour entry can be tagged with.
export const CLINICAL_COMPETENCIES = [
  'Assessment & diagnosis', 'Treatment planning', 'Individual therapy', 'Couples & family',
  'Group', 'Crisis & risk', 'Ethics & boundaries', 'Documentation', 'Cultural humility', 'Supervision',
];

// The IL MSW → LCSW supervised-experience target. The figure widely referenced for
// Illinois is ~3,000 hours of supervised clinical professional experience over a
// minimum period. This is a sensible default to TRACK AGAINST — the exact current
// requirement is confirmed by Christina (LCSW) / IL DFPR, hence `confirmed:false`.
export const IL_LCSW_REQUIREMENT = {
  state: 'IL',
  credential: 'LCSW',
  supervisedClinicalHours: 3000,
  minMonths: 24,
  note: 'Illinois supervised clinical experience toward LCSW. Exact current hours, supervision ratio, and timeframe are confirmed by Christina (LCSW) / IL DFPR.',
  confirmed: false,
};

// One logged hour entry. Pure factory; the surface supplies id/now.
export function makeHourEntry(partial = {}) {
  const p = partial || {};
  return {
    id: p.id || `hr-${Math.random().toString(36).slice(2, 9)}`,
    date: p.date || null,                                  // ISO date the hours were earned
    hours: Math.max(0, Number(p.hours) || 0),
    activity: HOUR_ACTIVITY_TYPES.some((t) => t.key === p.activity) ? p.activity : DEFAULT_ACTIVITY_TYPE,
    competency: p.competency || null,
    supervisor: p.supervisor || '',                        // supervisor of record (required for clinical)
    note: p.note || '',
    learnerEmail: p.learnerEmail || '',
    createdAt: p.createdAt || null,
  };
}

// Sum hours across entries (optionally filtered).
export function sumHours(entries, filterFn = null) {
  return (entries || [])
    .filter((e) => (filterFn ? filterFn(e) : true))
    .reduce((t, e) => t + (Number(e.hours) || 0), 0);
}

// Hours that count toward the supervised-clinical requirement.
export function supervisedClinicalHours(entries) {
  return sumHours(entries, (e) => {
    const t = activityType(e.activity);
    return !!(t && t.countsClinical);
  });
}

export function hoursByCompetency(entries) {
  const out = {};
  for (const e of entries || []) {
    const k = e.competency || 'Unspecified';
    out[k] = (out[k] || 0) + (Number(e.hours) || 0);
  }
  return out;
}

export function hoursByActivity(entries) {
  const out = {};
  for (const e of entries || []) {
    out[e.activity] = (out[e.activity] || 0) + (Number(e.hours) || 0);
  }
  return out;
}

// Progress toward a requirement. Returns logged / target / pct / remaining and the
// distinct supervisors of record on file (a real supervised record needs one).
export function requirementProgress(entries, requirement = IL_LCSW_REQUIREMENT) {
  const target = Number(requirement && requirement.supervisedClinicalHours) || 0;
  const logged = supervisedClinicalHours(entries);
  const supervisionHours = sumHours(entries, (e) => e.activity === 'supervision');
  const pct = target > 0 ? Math.min(100, Math.round((logged / target) * 100)) : 0;
  const remaining = Math.max(0, target - logged);
  const supervisors = Array.from(new Set((entries || [])
    .filter((e) => activityType(e.activity)?.countsClinical && e.supervisor)
    .map((e) => e.supervisor.trim())
    .filter(Boolean)));
  return { logged, target, pct, remaining, supervisionHours, supervisors, confirmed: !!(requirement && requirement.confirmed) };
}

// ---------------------------------------------------------------------------
// Required trainings — a place to track trainings clinicians keep current, with a
// cadence (months). Status is derived from the last completion + `now`.
// ---------------------------------------------------------------------------
export const DEFAULT_REQUIRED_TRAININGS = [
  { id: 'req-hipaa', title: 'HIPAA & Privacy', audienceKey: 'therapist', cadenceMonths: 12, note: 'Kept current for all clinical staff. Christina confirms the IL standard.' },
  { id: 'req-ethics', title: 'Ethics & Professional Boundaries', audienceKey: 'therapist', cadenceMonths: 24, note: 'Per licensure cycle.' },
  { id: 'req-risk', title: 'Risk: Suicide / Safety & Mandated Reporting', audienceKey: 'therapist', cadenceMonths: 12, note: 'Christina (LCSW) signs off the protocol.' },
];

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
