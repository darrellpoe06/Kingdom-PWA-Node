// =============================================================================
// tlc-lessons — the supporting online lessons that back the TLC marketplace
// =============================================================================
// Declared by Darrell 2026-06-25: "supporting lessons online to support the whole
// situation." The TLC model includes SUPPORTING ONLINE LESSONS (in the Learn area)
// that back all three sides + the overall situation. They are part of the
// workflow's VALUE and its FUNNEL — a lead magnet AND a retention/outcomes engine:
// supporting lessons draw clients in, train therapists, and support families,
// reinforcing the marketplace.
//
// Three tracks, mapped to the three sides (lib/client-acquisition.js):
//   * client  — PSYCHOEDUCATION for clients/patients + families (the patient-
//               outcomes track): coping, understanding their situation, caregiver
//               / family support. Psychoeducation NOT treatment. LCSW/specialist-
//               validated. Age-adaptive.
//   * therapist — the CE / clinician TRAINING lessons (the dual-track LMS,
//               industry-standard CE). Accredited / validated; carries CE credits.
//   * whole   — supportive content that holds it together: onboarding, what-to-
//               expect, support resources — so clients, therapists, and families
//               all have learning that reinforces the care.
//
// ENGINE-SHAPED: every lesson follows the learn-framework module shape (levels
// child/teen/standard/senior so resolveForAge renders age-right; quiz; anchor;
// rpe). It plugs into the SAME lesson engine the church courses use (depth tiers,
// age bands, read-aloud + dyslexia/large-print reading support via the shared
// accessibility primitives). Ties: docs THERAPY-TRAINING-CURRICULUM-PLAN.md +
// the dual-track LMS vision; lib/learn-framework.js; UX-PATTERNS read-aloud/TTS.
//
// GUARDRAILS (binding, same as the marketplace workflow):
//   * Client lessons: psychoeducation-not-treatment; no diagnosis; invite a
//     consult, never imply a clinical relationship. needsValidation: LCSW/specialist.
//   * Therapist lessons: CE accuracy; ceCredits + accreditation are TO-CONFIRM
//     until verified; needsValidation: accredited.
//   * Reading support: every lesson is age-adaptive + reading-support-ready
//     (large-print scaling, plain-language tiers, read-aloud) so a struggling or
//     dyslexic reader still gets the full core meaning.
//   * Nothing here is treatment, and no lesson SHIPS to the public until a
//     human (Christina / a specialist) marks it validated.
// =============================================================================

// Validation + reading-support flags carried by every track. Honest by default:
// validated=false means "not yet specialist-signed-off — do not publish."
export const LESSON_VALIDATION = {
  client:    { validatedBy: 'LCSW / specialist', validated: false, note: 'Psychoeducation only. Needs Christina/specialist sign-off before public use.' },
  therapist: { validatedBy: 'CE accreditor / supervisor', validated: false, note: 'CE credits + accreditation are TO-CONFIRM until verified with the accrediting body.' },
  whole:     { validatedBy: 'Christina / Darrell', validated: false, note: 'Supportive onboarding content; review before public use.' },
};

// Every supporting lesson is reading-support-ready (the shared accessibility
// primitives: large-print scaling, plain-language depth tiers, read-aloud).
export const READING_SUPPORT = Object.freeze({
  ageAdaptive: true, largePrint: true, plainLanguageTier: true, readAloud: true, dyslexiaFriendly: true,
});

// -----------------------------------------------------------------------------
// The three tracks. Representative modules per track (engine-shaped). Each module:
//   id, title, audience, bigIdea, levels{ child?, teen, standard, senior },
//   quiz{ questions[] }, guardrailKey, plus track-level ce/validation flags.
// Lesson PROSE is intentionally concise + marked for specialist validation; the
// authored long-form lives in the lesson engine once validated.
// -----------------------------------------------------------------------------
export const TLC_LESSON_TRACKS = {
  client: {
    sideKey: 'client',
    key: 'client-psychoeducation',
    title: 'Understanding & Coping — for clients and families',
    audience: 'clients/patients and their families',
    purpose: 'Psychoeducation that helps people understand their situation and take a next step — and invites a consult. Not treatment.',
    leadMagnet: true, retention: true,
    validation: LESSON_VALIDATION.client, readingSupport: READING_SUPPORT,
    guardrailKey: 'psychoeducation-not-treatment',
    modules: [
      {
        id: 'cl1-what-is-anxiety',
        title: 'What anxiety is (and what it isn’t)',
        bigIdea: 'Anxiety is a normal alarm system that can get oversensitive. Understanding it lowers the fear of the fear — and naming it is the first step to working with it (with support).',
        levels: {
          child: 'Sometimes your body hits the alarm button even when there’s no real danger — like a smoke alarm going off from toast. That’s anxiety. It’s not bad, and it can get quieter with help.',
          teen: 'Anxiety is your body’s alarm system. It’s supposed to protect you, but sometimes it fires when there’s no real threat. Knowing that helps you respond instead of panicking — and a counselor can help you turn the volume down.',
          standard: 'Anxiety is the body’s threat-response system doing its job — sometimes too well. It becomes a problem when the alarm fires without real danger, or won’t switch off. Understanding the mechanism reduces secondary fear ("the fear of the fear") and opens the door to skills and, when needed, professional support.',
          senior: 'Anxiety is an adaptive arousal response that can become dysregulated. Psychoeducation reframes symptoms as an over-firing alarm rather than personal failure, which itself lowers reactivity; the lesson points toward evidence-based coping and a consult, without diagnosing the reader.',
        },
        quiz: { questions: [
          { q: 'Anxiety is best understood as…', options: ['A character flaw', 'An alarm system that can become oversensitive', 'Something only weak people feel'], answer: 1, explain: 'It’s a normal protective response that can mis-fire — not a flaw.' },
          { q: 'This lesson is…', options: ['Treatment / a diagnosis', 'Psychoeducation that invites a next step', 'A guarantee you’ll feel better'], answer: 1, explain: 'Psychoeducation educates and invites a consult; it never diagnoses or guarantees outcomes.' },
        ] },
      },
      {
        id: 'cl2-grounding-skills',
        title: 'Two grounding skills you can use today',
        bigIdea: 'Simple, evidence-informed grounding (paced breathing; 5-4-3-2-1 senses) can steady the body in a hard moment. These are coping supports, not a substitute for care.',
        levels: {
          child: 'When you feel too big inside, try this: breathe out slowly like you’re blowing a bubble, and name 5 things you can see. It helps your body feel safe again.',
          teen: 'Two tools: (1) slow your exhale — breathe in for 4, out for 6; (2) 5-4-3-2-1 — name 5 things you see, 4 you hear, 3 you feel, 2 you smell, 1 you taste. They bring your body back down.',
          standard: 'Paced breathing (longer exhale than inhale) nudges the parasympathetic system toward calm; the 5-4-3-2-1 sensory scan interrupts a spiral by anchoring attention in the present. Both are coping supports to practice between sessions — not a replacement for therapy.',
          senior: 'These are portable self-regulation skills with a physiological rationale (vagal tone via extended exhale; attentional re-anchoring via multisensory orienting). Framed as adjuncts to care, not as treatment, and offered without any outcome promise.',
        },
        quiz: { questions: [
          { q: 'These grounding skills are…', options: ['A cure for anxiety', 'Coping supports to practice, not a replacement for care', 'Only for emergencies'], answer: 1, explain: 'They’re supports — helpful, but not treatment or a cure.' },
        ] },
      },
      {
        id: 'cl3-supporting-a-loved-one',
        title: 'Supporting a loved one (for families & caregivers)',
        bigIdea: 'Families help most by listening without fixing, keeping their own steadiness, and knowing when to encourage professional support. Caregiver support is part of the outcome.',
        levels: {
          teen: 'If someone you love is struggling: listen more than you advise, don’t try to "fix" them, and gently encourage talking to a counselor. Take care of yourself too — you can’t pour from an empty cup.',
          standard: 'Caregivers help most by validating rather than problem-solving, maintaining their own regulation (co-regulation works both ways), holding routine, and encouraging professional support without coercion. The lesson includes when to seek help and how to look after the caregiver — family support is part of the patient-outcomes picture.',
          senior: 'Family psychoeducation improves outcomes: validation over advice, co-regulation, boundary-with-warmth, and recognizing escalation thresholds. The caregiver’s own support is named explicitly, with a clear, non-alarmist path to professional help.',
        },
        quiz: { questions: [
          { q: 'The most helpful first move for a caregiver is to…', options: ['Fix the problem for them', 'Listen and validate, and encourage support', 'Take over their decisions'], answer: 1, explain: 'Listening + validating + gently encouraging support helps most.' },
        ] },
      },
    ],
  },

  therapist: {
    sideKey: 'therapist',
    key: 'clinician-ce',
    title: 'Clinician CE & onboarding (the dual-track LMS)',
    audience: 'TLC clinicians (and clinicians seeking CE)',
    purpose: 'Industry-standard continuing-education + onboarding. CE credits + accreditation are TO-CONFIRM until verified. Part of the therapist offer.',
    leadMagnet: true, retention: true, ceTrack: true,
    validation: LESSON_VALIDATION.therapist, readingSupport: READING_SUPPORT,
    guardrailKey: 'ce-accuracy',
    modules: [
      {
        id: 'th1-faith-integrated-care',
        title: 'Faith-integrated care, done ethically',
        ceCreditsToConfirm: 1,
        bigIdea: 'Integrating faith respectfully means following the client’s lead, staying within competence and consent, and never imposing — a skill with a real evidence base when done ethically.',
        levels: {
          standard: 'Ethical faith-integration: assess the client’s own framework, obtain informed consent for any spiritual intervention, stay within competence, document appropriately, and never impose the clinician’s beliefs. The module surveys the evidence base and the ethical guardrails (ACA/NASW). CE credit + accreditation: TO CONFIRM.',
          senior: 'Covers consent, competence boundaries, multicultural humility, documentation, and the distinction between client-led spiritual integration and clinician-imposed practice — with citations to be finalized for CE accreditation.',
        },
        quiz: { questions: [
          { q: 'Faith integration should be…', options: ['Imposed when the clinician believes it helps', 'Client-led, consented, and within competence', 'Avoided entirely'], answer: 1, explain: 'Client-led + consented + within competence is the ethical standard.' },
        ] },
      },
      {
        id: 'th2-multicultural-competency',
        title: 'Multicultural competency in practice',
        ceCreditsToConfirm: 1,
        bigIdea: 'Cultural humility — ongoing self-examination and client-as-expert — outperforms a fixed "competence checklist." It is a practice, not a credential.',
        levels: {
          standard: 'Moves from static "cultural competence" to cultural humility: lifelong self-reflection, redressing power imbalance, and treating the client as the expert on their own context. Includes practical intake and rupture-repair applications. CE credit + accreditation: TO CONFIRM.',
          senior: 'Frames humility vs. competence, addresses clinician bias and microaggression repair, and ties to TLC’s multicultural, historically-underserved mission — references to be finalized for accreditation.',
        },
        quiz: { questions: [
          { q: 'Cultural humility treats the client as…', options: ['A diagnosis', 'The expert on their own cultural context', 'A checklist item'], answer: 1, explain: 'Client-as-expert + ongoing self-reflection is the core.' },
        ] },
      },
      {
        id: 'th3-documentation-ethics',
        title: 'Documentation, consent & the PHI line',
        ceCreditsToConfirm: 1,
        bigIdea: 'Good documentation protects the client and the clinician. The PHI line is bright: clinical detail lives in the record, never in marketing or casual channels.',
        levels: {
          standard: 'Covers note standards, informed consent, the minimum-necessary principle, and — directly relevant to this platform — the bright line that clinical detail/PHI never enters marketing or pre-intake systems. CE credit + accreditation: TO CONFIRM.',
          senior: 'Note quality, consent, minimum-necessary, mandated-reporting awareness, and the structural PHI wall the platform enforces (pre-intake/contact-level only) — references to be finalized.',
        },
        quiz: { questions: [
          { q: 'Where does clinical detail / PHI belong?', options: ['In marketing if anonymized', 'In the clinical record only, never marketing', 'Anywhere, if helpful'], answer: 1, explain: 'PHI stays in the clinical record — never marketing or pre-intake systems.' },
        ] },
      },
    ],
  },

  whole: {
    sideKey: 'whole',
    key: 'whole-situation-support',
    title: 'What to expect & support resources (everyone)',
    audience: 'clients, families, and clinicians',
    purpose: 'Supportive content that holds it together: onboarding, what-to-expect, and where to get help — so the whole situation is reinforced.',
    leadMagnet: true, retention: true,
    validation: LESSON_VALIDATION.whole, readingSupport: READING_SUPPORT,
    guardrailKey: 'psychoeducation-not-treatment',
    modules: [
      {
        id: 'wh1-what-to-expect',
        title: 'What to expect from therapy (first steps)',
        bigIdea: 'Knowing how the first consult and intake work removes a major barrier. Demystifying the process is itself supportive — and it sets honest expectations.',
        levels: {
          child: 'Talking to a counselor is like having a helper who listens. The first time is just getting to know each other. You’re in charge of what you share.',
          teen: 'Your first session is mostly getting to know each other and what you want help with. There’s no pressure, nothing’s "wrong" with you for going, and you control what you share.',
          standard: 'Walks through the consult → intake → first sessions: what each involves, what to bring, confidentiality basics and its limits, and how fit is assessed. Setting honest expectations reduces no-shows and anxiety. Not treatment; an orientation.',
          senior: 'Orients the reader to the care pathway, confidentiality and its limits, and the collaborative nature of fit — honestly, without overpromising outcomes.',
        },
        quiz: { questions: [
          { q: 'The first session is mostly…', options: ['A diagnosis and a cure plan', 'Getting to know each other and your goals', 'A commitment you can’t change'], answer: 1, explain: 'It’s an orientation + fit conversation — you stay in control.' },
        ] },
      },
      {
        id: 'wh2-finding-support-now',
        title: 'If you need support right now',
        bigIdea: 'Knowing the immediate-help options (and that therapy is a step, not the only step) is part of responsible support. This is signposting, not treatment.',
        levels: {
          teen: 'If things feel like an emergency, that’s when to reach a crisis line or 988 (US) right away — therapy is for the ongoing work, not the emergency moment. It’s strong, not weak, to reach out.',
          standard: 'Signposts the difference between routine support (a consult) and acute crisis (emergency services / 988 in the US), normalizes help-seeking, and lists what TLC can and cannot be for. Responsible signposting — not treatment or triage.',
          senior: 'Clarifies the routine-vs-crisis distinction, names emergency resources, and sets honest scope for what the practice provides — without implying clinical care has begun.',
        },
        quiz: { questions: [
          { q: 'For an immediate emergency, the right step is…', options: ['Wait for a therapy appointment', 'Contact crisis / emergency services (e.g., 988 in the US)', 'Read another lesson'], answer: 1, explain: 'Crisis = emergency resources now; therapy is for the ongoing work.' },
        ] },
      },
    ],
  },
};

export const LESSON_TRACK_KEYS = Object.keys(TLC_LESSON_TRACKS);

// Map a marketplace side → its supporting-lesson track(s). The CLIENT side draws
// on client + whole; THERAPIST on therapist + whole; TRAINING on therapist; the
// "whole" track supports everyone.
export function tracksForSide(sideKey) {
  if (sideKey === 'client') return [TLC_LESSON_TRACKS.client, TLC_LESSON_TRACKS.whole];
  if (sideKey === 'therapist') return [TLC_LESSON_TRACKS.therapist, TLC_LESSON_TRACKS.whole];
  if (sideKey === 'training') return [TLC_LESSON_TRACKS.therapist];
  return [TLC_LESSON_TRACKS.whole];
}

// The lessons usable as LEAD MAGNETS for a side (the funnel-facing subset).
export function leadMagnetLessons(sideKey) {
  return tracksForSide(sideKey).filter((t) => t.leadMagnet);
}

export function allTracks() { return Object.values(TLC_LESSON_TRACKS); }
export function getTrack(key) { return TLC_LESSON_TRACKS[key] || allTracks().find((t) => t.key === key) || null; }

// Engine-compatibility check: a module is renderable by learn-framework
// resolveForAge if it carries a `levels` object with at least a 'standard' depth.
export function isEngineRenderable(module) {
  return !!(module && module.levels && typeof module.levels === 'object' && typeof module.levels.standard === 'string');
}

// A track is publishable only when a human has marked it validated (specialist /
// accreditor sign-off). Default false — honest: nothing ships unvalidated.
export function isTrackPublishable(track) {
  return !!(track && track.validation && track.validation.validated === true);
}

// Total CE credits a track claims, all TO-CONFIRM until accreditation is verified.
export function ceCreditsToConfirm(track) {
  if (!track || !track.modules) return 0;
  return track.modules.reduce((sum, m) => sum + (m.ceCreditsToConfirm || 0), 0);
}
