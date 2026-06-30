// =============================================================================
// tlc-training-library — the built-out TLC clinician TRAINING COURSE LIBRARY
// =============================================================================
// Declared by Darrell 2026-06-29: the app already carries the training-FIELD
// taxonomy (the ten CLINICAL_COMPETENCIES in lib/practice-academy.js) and a cert
// catalog that logs training hours per completion. What was MISSING was the actual
// built-out COURSES — real, ready content across every field — so Christina (LCSW)
// reviews FINISHED courses rather than authoring them. This file is that library.
//
// THE SHAPE IS THE SAME ENGINE every PoeTech course uses (no fork): each course is
// a set of engine-shaped MODULES (id / title / bigIdea / levels.standard prose /
// quiz) that render through buildLessonArc + LessonFlowAudience + gradeQuiz, exactly
// like tlc-lessons.js. On top of a module set, a course adds: a `field` (one of the
// ten competencies), a real `trainingHours` value, a PRE-TEST (baseline) and a
// POST-TEST (graded gate) so growth is measurable, a `passThreshold`, honest
// validation + attribution, and grounding `sources`.
//
// HONESTY (DR-0076 + the THERAPY-TRAINING-CURRICULUM-PLAN bright lines):
//   * Every course ships `validated: false`. The content is REAL and finished —
//     plain-language, survey-level teaching grounded in the standard bodies named
//     in `sources` (NASW / ACA / APA / SAMHSA / IDFPR) — but the CLINICAL AUTHORITY
//     is Christina's (LCSW) to ratify. She reviews each course with an explicit
//     AGREE / DISAGREE (lib/tlc-course-approval.js); nothing is published on the
//     model's word. This is "arrives DONE, she reviews not authors."
//   * HOURS ARE HOURS. trainingHours are legitimate professional-development
//     TRAINING hours (didactic / coursework), tracked toward the Illinois MSW→LCSW
//     standard. They are stated plainly — no CEU claim, no fraud caveats. The
//     supervised CLINICAL (client-facing) hours that make up the bulk of the IL
//     experience requirement are a DIFFERENT bucket, logged in the supervised-hours
//     ledger; the library COMPLEMENTS that ledger, it does not replace it. One
//     neutral line says so (LIBRARY_HOURS_NOTE); it is not moralized.
//   * State-specific specifics carry an `smeConfirm` flag rather than a guessed
//     figure (e.g. exact mandated-reporting channels).
//   * A course can also ORIGINATE from a YouTube teacher Darrell selects — distilled
//     into ORIGINAL material and ATTRIBUTED (lib/tlc-course-ingest.js). Those arrive
//     with `origin: 'youtube-distilled'` + a `source`, and the SAME validated:false
//     gate. The authored courses here carry `origin: 'authored'`.
//
// PURE + DEPENDENCY-LIGHT: only imports the shared engine helpers + the competency
// list. No Date.now() / Math.random() in any exported pure function (callers pass
// `now`); ids are authored, not generated, so the library is stable + testable.
// =============================================================================
import { courseAssessment, gradeQuiz, QUIZ_PASS_RATIO } from './learn-framework.js';
import { CLINICAL_COMPETENCIES } from './practice-academy.js';

// The ten training FIELDS = the clinical competencies already in the app. Re-exported
// so the library and its surface share ONE source of truth (no second list to drift).
export const TRAINING_FIELDS = [...CLINICAL_COMPETENCIES];

// A stable slug per field (for ids + grouping). Derived, not a second list.
export function fieldSlug(field) {
  return String(field || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// The neutral, single statement about what these hours are — stated once, no
// moralizing. Surfaced in-app so the distinction is visible, not hidden.
export const LIBRARY_HOURS_NOTE =
  'These are professional-development TRAINING hours (self-paced coursework), logged toward your Illinois MSW → LCSW training record. Supervised clinical (client-facing) hours are tracked separately in the supervised-hours ledger; this library complements that record.';

// The single validation statement for the whole library. Honest by default.
export const LIBRARY_VALIDATION_NOTE =
  'Every course is finished and ready to review. Content is grounded in the named standard bodies; the clinical substance is Christina (LCSW)’s to ratify. Each course carries an explicit Agree / Disagree — nothing is published until she approves it.';

export const DEFAULT_PASS_THRESHOLD = QUIZ_PASS_RATIO; // 0.7, the shared engine bar

// ---------------------------------------------------------------------------
// makeCourse — normalize an authored course to a stable shape. Pure.
//   id, field, title, summary, trainingHours, origin, source, validated,
//   passThreshold, sources[], smeConfirm, preTest, postTest, modules[]
// ---------------------------------------------------------------------------
export function makeCourse(partial = {}) {
  const p = partial || {};
  const field = p.field || TRAINING_FIELDS[0];
  return {
    id: p.id || `tl-${fieldSlug(field)}-${fieldSlug(p.title || 'course')}`,
    field,
    title: p.title || 'Training course',
    summary: p.summary || '',
    trainingHours: Math.max(0, Number(p.trainingHours) || 0),
    origin: p.origin || 'authored',
    source: p.source || null,                       // { teacher, channel, url } when distilled
    validated: p.validated === true,                // SME sign-off; default false (honest)
    passThreshold: p.passThreshold == null ? DEFAULT_PASS_THRESHOLD : Number(p.passThreshold),
    sources: Array.isArray(p.sources) ? p.sources : [],
    smeConfirm: p.smeConfirm || null,               // a named state-specific open question, if any
    preTest: p.preTest || null,                     // { questions:[...] } baseline (optional)
    postTest: p.postTest || null,                   // { questions:[...] } graded gate (optional)
    modules: Array.isArray(p.modules) ? p.modules : [],
    // The FOUR-STRAND braid (lib/tlc-course-strands.js): Yahweh's perspective/Will
    // at the centre + clinical + neuroscience + societal. Authored inline on a course,
    // or resolved from the central strand map by courseStrands(). Null here until set.
    strands: p.strands || null,
    // Reach metadata for a source-distilled course (recognition = asset). Honest:
    // a qualitative reach when an exact count isn't verified — never a fabricated number.
    sourceReach: p.sourceReach || null,
  };
}

// =============================================================================
// THE AUTHORED COURSES, BY FIELD. Real, finished, plain-language, survey-level —
// grounded in the standard bodies cited per field. validated:false on every one.
// =============================================================================

const NASW = { label: 'NASW Code of Ethics', url: 'https://www.socialworkers.org/About/Ethics/Code-of-Ethics' };
const ACA = { label: 'ACA Code of Ethics', url: 'https://www.counseling.org/resources/aca-code-of-ethics.pdf' };
const APA_EBP = { label: 'APA evidence-based practice', url: 'https://www.apa.org/practice/resources/evidence' };
const SAMHSA_988 = { label: '988 Suicide & Crisis Lifeline', url: 'https://988lifeline.org' };
const IDFPR_SW = { label: 'IDFPR Social Work CE / practice rules', url: 'https://idfpr.illinois.gov/profs/socialwork.html' };

// A small authoring helper: a module with a single rich `standard` level + quiz.
function mod(id, title, bigIdea, standard, quiz, extra = {}) {
  return { id, title, bigIdea, levels: { standard, ...(extra.levels || {}) }, quiz, ...extra };
}

const COURSES = [
  // ===========================================================================
  // 1 · ASSESSMENT & DIAGNOSIS
  // ===========================================================================
  makeCourse({
    field: 'Assessment & diagnosis',
    title: 'Biopsychosocial Assessment — the whole person',
    summary: 'How a thorough intake assessment looks at the whole person — biological, psychological, and social — and turns that picture into a working clinical formulation.',
    trainingHours: 3,
    sources: [NASW, APA_EBP],
    preTest: { questions: [
      { q: 'A biopsychosocial assessment looks at…', options: ['Only the presenting symptom', 'Biological, psychological, AND social factors together', 'Only the client’s history'], answer: 1, explain: 'It deliberately integrates all three domains.' },
    ] },
    modules: [
      mod('tl-assess-bps-m1', 'The three domains', 'A strong assessment never reduces a person to a symptom — it reads the biological, the psychological, and the social as one interacting system.',
        'A biopsychosocial assessment gathers, in plain terms, three streams at once. The biological: health, sleep, medication, substance use, family medical history. The psychological: mood, thinking patterns, history of trauma or loss, coping style, prior treatment. The social: relationships, work or school, housing, finances, culture, faith, and the supports or stressors around the person. The skill is not collecting facts — it is noticing how the three interact (poor sleep feeding low mood feeding isolation), so the picture explains the presenting concern rather than just listing it. The client is the expert on their own life; the clinician brings the structure.',
        { questions: [
          { q: 'Which is a SOCIAL-domain factor?', options: ['Sleep and medication', 'Housing, work, and relationships', 'History of panic attacks'], answer: 1, explain: 'Housing/work/relationships are social-domain; sleep is biological; panic is psychological.' },
          { q: 'The point of integrating the three domains is to…', options: ['Make the note longer', 'See how factors interact to explain the concern', 'Reach a diagnosis faster'], answer: 1, explain: 'Integration explains the concern; it is not about length or speed.' },
        ] }),
      mod('tl-assess-bps-m2', 'From data to formulation', 'A formulation is the story that connects what you learned to why the person is struggling now — and what might help.',
        'A clinical formulation is the bridge from assessment data to a plan. A simple, durable frame is the "4 Ps": Predisposing factors (what made the person vulnerable — e.g. early loss), Precipitating factors (what set it off now — a job loss), Perpetuating factors (what keeps it going — avoidance, conflict), and Protective factors (strengths and supports to build on — faith, a steady relationship). Written as a few honest sentences, the formulation gives the treatment plan its targets and tells you what to reinforce. It is a working hypothesis, revised as you learn more — not a verdict.',
        { questions: [
          { q: 'In the 4 Ps, a Perpetuating factor is one that…', options: ['Made the person vulnerable long ago', 'Keeps the problem going now', 'Protects against the problem'], answer: 1, explain: 'Perpetuating = what maintains the problem in the present.' },
          { q: 'A formulation is best understood as…', options: ['A fixed verdict', 'A working hypothesis that guides the plan and gets revised', 'The same thing as a diagnosis code'], answer: 1, explain: 'It is a revisable hypothesis that targets the plan.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'The biopsychosocial frame integrates…', options: ['Three domains: biological, psychological, social', 'Only mood and thoughts', 'Only diagnosis and medication'], answer: 0, explain: 'All three domains, read together.' },
      { q: 'Protective factors in a formulation are…', options: ['Things that started the problem', 'Strengths and supports to build on', 'Symptoms to remove'], answer: 1, explain: 'Protective = strengths/supports.' },
      { q: 'A good formulation primarily serves to…', options: ['Lengthen the record', 'Give the treatment plan its targets', 'Replace the client’s own account'], answer: 1, explain: 'It targets the plan; the client’s account remains central.' },
    ] },
  }),
  makeCourse({
    field: 'Assessment & diagnosis',
    title: 'Using the DSM-5-TR Responsibly',
    summary: 'What a diagnostic framework is for, what it is NOT for, and how to use it as a shared language without reducing a person to a label.',
    trainingHours: 2.5,
    sources: [APA_EBP, NASW],
    smeConfirm: 'Christina confirms TLC’s house position on diagnosis in faith-integrated, culturally-humble practice.',
    modules: [
      mod('tl-assess-dsm-m1', 'A shared language, not a verdict', 'Diagnostic criteria are a common vocabulary for communication and care — useful when held lightly, harmful when they become the whole person.',
        'A diagnostic manual exists so clinicians, clients, and systems can talk about patterns the same way and access appropriate care. Used well, it is a shared language: it names a cluster of experiences, supports treatment selection, and communicates with other providers. Used poorly, it flattens a person into a code, implies false certainty, or pathologizes a normal response to abnormal circumstances. Responsible use means matching criteria honestly, holding the label as provisional, documenting the reasoning, and remembering that culture, context, and faith shape how distress is expressed. The diagnosis describes a pattern; it never describes a person.',
        { questions: [
          { q: 'A diagnosis is best used as…', options: ['The complete truth about a person', 'A provisional shared language for care', 'A reason to stop listening'], answer: 1, explain: 'Shared, provisional language — not the whole person.' },
          { q: 'A risk of diagnostic labeling is…', options: ['Better communication', 'Flattening a person or implying false certainty', 'Access to care'], answer: 1, explain: 'The risk is reduction and false certainty.' },
        ] }),
      mod('tl-assess-dsm-m2', 'Culture, context, and differential thinking', 'Before a label is applied, the responsible question is "what else could this be?" — including a normal, culturally-shaped response to real stress.',
        'Differential thinking asks what else could explain the presentation before settling on one answer: a medical cause, a substance effect, grief, an adjustment to a real stressor, or a culturally normative expression of distress that is not disorder at all. The manual itself cautions against diagnosing what is an expectable response to loss or oppression. For a historically-underserved client, mistaking a justified response to real hardship for pathology is a known harm. The discipline is to rule out, to ask, to consult, and to document the reasoning — so the conclusion is earned, not assumed.',
        { questions: [
          { q: 'Differential thinking means…', options: ['Picking the first label that fits', 'Asking what else could explain the presentation', 'Avoiding diagnosis entirely'], answer: 1, explain: 'It is the discipline of ruling out alternatives.' },
          { q: 'A normal, culturally-shaped response to real hardship should be…', options: ['Always diagnosed as a disorder', 'Considered as a non-disorder explanation', 'Ignored'], answer: 1, explain: 'It may not be disorder at all; consider it explicitly.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'Responsible diagnostic use treats the label as…', options: ['Final and total', 'Provisional and documented', 'Irrelevant'], answer: 1, explain: 'Provisional, reasoned, documented.' },
      { q: 'A key differential question is…', options: ['"How fast can I code this?"', '"What else could explain this, including a normal response?"', '"Which label sounds most serious?"'], answer: 1, explain: 'Rule out alternatives first.' },
    ] },
  }),
  makeCourse({
    field: 'Assessment & diagnosis',
    title: 'Standardized Screening Tools in Practice',
    summary: 'How brief, validated screeners (like the PHQ-9 and GAD-7) support — but never replace — clinical judgment, and how to use them ethically.',
    trainingHours: 2,
    sources: [APA_EBP],
    modules: [
      mod('tl-assess-screen-m1', 'What a screener is for', 'A validated screener is a quick, repeatable measure that adds signal to clinical judgment and tracks change over time — it is an instrument, not a verdict.',
        'Brief screening tools such as the PHQ-9 (depression) and GAD-7 (anxiety) give a standardized, repeatable number that complements the clinical interview. Their value is threefold: they catch what an interview might miss, they let you measure change session-over-session (measurement-based care), and they give the client visible evidence of progress. Their limit is just as important: a score is a starting point for a conversation, not a diagnosis, and cut-offs are guides, not gates. A screener is always interpreted in context — by the clinician, with the client — never applied mechanically.',
        { questions: [
          { q: 'The main value of a repeated screener is…', options: ['Replacing the interview', 'Measuring change over time', 'Producing a diagnosis automatically'], answer: 1, explain: 'Measurement-based care tracks change; it does not replace judgment.' },
          { q: 'A screener score should be treated as…', options: ['A final diagnosis', 'A starting point for a conversation', 'A gate that decides care alone'], answer: 1, explain: 'It informs the conversation; it does not decide alone.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'Measurement-based care means…', options: ['Using scores to track change and inform care', 'Letting the score replace the clinician', 'Avoiding any measurement'], answer: 0, explain: 'Scores inform care; the clinician interprets.' },
    ] },
  }),

  // ===========================================================================
  // 2 · TREATMENT PLANNING
  // ===========================================================================
  makeCourse({
    field: 'Treatment planning',
    title: 'Goals That Are Real — Collaborative, Measurable Plans',
    summary: 'How to build a treatment plan WITH the client: goals that are specific, measurable, and meaningful to the person, with objectives that show the path.',
    trainingHours: 3,
    sources: [APA_EBP, NASW],
    preTest: { questions: [
      { q: 'A good treatment goal is primarily…', options: ['Written by the clinician alone', 'Collaborative and meaningful to the client', 'Vague on purpose'], answer: 1, explain: 'Collaboration and meaning drive engagement.' },
    ] },
    modules: [
      mod('tl-plan-goals-m1', 'Goals vs objectives vs interventions', 'A plan has three layers: where we’re going (goal), the visible steps that prove we’re getting there (objectives), and what we’ll do (interventions).',
        'A clean treatment plan separates three things people often blur. The GOAL is the destination in the client’s own words ("I want to sleep through the night and feel less on-edge with my kids"). OBJECTIVES are measurable, time-bound steps that show movement toward it ("reduce night awakenings from 4 to 1 per week within 8 weeks"). INTERVENTIONS are what the clinician and client actually do (sleep-hygiene work, a worry-time exercise, paced breathing). Keeping the layers distinct makes progress visible, keeps the work accountable, and lets you adjust the method without losing the destination.',
        { questions: [
          { q: 'A measurable OBJECTIVE is…', options: ['"Feel better"', '"Reduce night awakenings from 4 to 1 per week in 8 weeks"', '"Do CBT"'], answer: 1, explain: 'Objectives are measurable and time-bound; "do CBT" is an intervention.' },
          { q: 'Separating the layers lets you…', options: ['Write more', 'Change the method without losing the goal', 'Avoid measuring'], answer: 1, explain: 'You can adjust interventions while keeping the goal.' },
        ] }),
      mod('tl-plan-goals-m2', 'Whose plan is it?', 'A plan the client did not help build is a plan the client will not follow — collaboration is not a courtesy, it is what makes the plan work.',
        'Engagement research is consistent: clients pursue goals they helped set and that matter to them, and disengage from goals imposed on them. Practically, that means asking what the client most wants to be different, translating it into the plan’s language without erasing their words, and reviewing the plan together at intervals so it stays current. It also means cultural humility — a goal that fits the clinician’s values but not the client’s family, faith, or community will quietly fail. The clinician brings structure and options; the client brings direction and ownership. The plan is co-authored.',
        { questions: [
          { q: 'Clients are most likely to follow a plan that…', options: ['The clinician sets alone', 'They helped build and find meaningful', 'Is never reviewed'], answer: 1, explain: 'Ownership and meaning drive follow-through.' },
          { q: 'Cultural humility in planning means…', options: ['Imposing the clinician’s values', 'Fitting goals to the client’s family, faith, and community', 'Skipping goals'], answer: 1, explain: 'The plan must fit the client’s world.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'Goal / objective / intervention map to…', options: ['Destination / measurable steps / what we do', 'All the same thing', 'Diagnosis / code / billing'], answer: 0, explain: 'Three distinct layers.' },
      { q: 'The strongest predictor of follow-through is…', options: ['A longer plan', 'Client ownership of meaningful goals', 'A stricter clinician'], answer: 1, explain: 'Ownership of meaningful goals.' },
    ] },
  }),
  makeCourse({
    field: 'Treatment planning',
    title: 'Evidence-Based Practice & Matching the Method',
    summary: 'What "evidence-based practice" actually means — research, clinical expertise, and client values together — and how to choose an approach that fits.',
    trainingHours: 2.5,
    sources: [APA_EBP],
    modules: [
      mod('tl-plan-ebp-m1', 'The three-legged stool', 'Evidence-based practice is not "do whatever the manual says" — it is the integration of best research, clinical expertise, and the client’s own values and preferences.',
        'The APA definition of evidence-based practice rests on three legs: the best available research evidence, the clinician’s expertise, and the client’s characteristics, culture, and preferences. Drop any leg and the stool falls — a manual applied without judgment or consent is not evidence-based, and neither is intuition with no grounding. In planning, this means knowing what approaches have support for the presenting concern, using judgment to adapt them to this person, and genuinely incorporating what the client wants and will do. The goal is the best fit, not the trendiest method.',
        { questions: [
          { q: 'Evidence-based practice integrates research with…', options: ['Clinical expertise and client values', 'Only the manual', 'Only intuition'], answer: 0, explain: 'All three legs of the stool.' },
          { q: 'Applying a manual with no judgment or consent is…', options: ['Fully evidence-based', 'NOT evidence-based — it drops two legs', 'Always best'], answer: 1, explain: 'It ignores expertise and client values.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'The three legs are research, clinical expertise, and…', options: ['Client values and culture', 'Insurance rules', 'The newest technique'], answer: 0, explain: 'Client values/culture is the third leg.' },
    ] },
  }),
  makeCourse({
    field: 'Treatment planning',
    title: 'Measuring Progress & Knowing When to Adjust',
    summary: 'How to tell whether therapy is working, and what to do when it isn’t — using feedback, outcome measures, and honest review.',
    trainingHours: 2,
    sources: [APA_EBP],
    modules: [
      mod('tl-plan-progress-m1', 'Feedback-informed care', 'The clinician who routinely asks "is this helping?" and acts on the answer gets better outcomes than the one who assumes it is.',
        'Feedback-informed treatment means regularly checking, with brief measures and direct conversation, whether the client is improving and whether the relationship feels right — and then adjusting when the signal says to. Outcomes improve when clinicians notice non-response early rather than continuing an approach that isn’t working. Practically: track a simple measure, ask the client how the work and the alliance feel, treat a plateau or a rupture as information, and be willing to change the method, intensify, consult, or refer. Adjusting is not failure; persisting with what isn’t working is.',
        { questions: [
          { q: 'Feedback-informed care improves outcomes by…', options: ['Assuming therapy is working', 'Noticing non-response early and adjusting', 'Never changing the plan'], answer: 1, explain: 'Early course-correction is the gain.' },
          { q: 'A plateau or rupture should be treated as…', options: ['A reason to give up', 'Information that may call for adjustment', 'Something to ignore'], answer: 1, explain: 'It is information, not failure.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'When an approach clearly isn’t working, the clinician should…', options: ['Persist unchanged', 'Adjust, intensify, consult, or refer', 'Blame the client'], answer: 1, explain: 'Act on the signal.' },
    ] },
  }),

  // ===========================================================================
  // 3 · INDIVIDUAL THERAPY
  // ===========================================================================
  makeCourse({
    field: 'Individual therapy',
    title: 'The Therapeutic Alliance — the Engine of Change',
    summary: 'Why the relationship itself is one of the most reliable predictors of outcome, and the concrete skills that build and repair it.',
    trainingHours: 3,
    sources: [APA_EBP, ACA],
    preTest: { questions: [
      { q: 'Across studies, the therapeutic alliance is…', options: ['Irrelevant to outcome', 'One of the most reliable predictors of outcome', 'Only relevant in CBT'], answer: 1, explain: 'The alliance is a robust, cross-modality predictor.' },
    ] },
    modules: [
      mod('tl-indiv-alliance-m1', 'Bond, goals, and tasks', 'A strong alliance has three parts: a genuine bond, agreement on where we’re going, and agreement on how we’ll get there.',
        'Bordin’s classic model breaks the alliance into three working parts. The BOND is the felt sense of trust, warmth, and respect between client and clinician. Agreement on GOALS means both people are aiming at the same destination. Agreement on TASKS means both believe the methods being used make sense. Outcomes suffer when any part is weak — a warm bond with no shared goals drifts; perfect technique with no bond doesn’t land. The skills that build all three are ordinary and learnable: warmth, accurate empathy, reliability, transparency about the work, and checking in rather than assuming.',
        { questions: [
          { q: 'The three parts of the alliance are bond, goals, and…', options: ['Tasks', 'Billing', 'Diagnosis'], answer: 0, explain: 'Bond, goals, tasks (Bordin).' },
          { q: 'Excellent technique with no bond tends to…', options: ['Work perfectly', 'Not land well', 'Replace the relationship'], answer: 1, explain: 'Technique without bond underperforms.' },
        ] }),
      mod('tl-indiv-alliance-m2', 'Ruptures and repair', 'Every real relationship has strains — what distinguishes good therapy is not the absence of ruptures but the skill of repairing them.',
        'A rupture is any moment the alliance frays: the client withdraws, disagrees, or seems to comply on the surface while disengaging underneath. Ruptures are common and, handled well, are some of the most powerful moments in therapy. Repair starts with noticing — a change in tone, energy, or follow-through — and then naming it gently and non-defensively ("I wonder if something I said didn’t sit right"). The clinician stays curious rather than defensive, takes responsibility where due, and lets the client’s experience be valid. A repaired rupture often deepens trust beyond where it was before.',
        { questions: [
          { q: 'A rupture in the alliance is…', options: ['Always the end of therapy', 'A common strain that can be repaired', 'Proof of a bad client'], answer: 1, explain: 'Ruptures are normal and repairable.' },
          { q: 'Good repair begins with…', options: ['Defending yourself', 'Noticing and gently naming it, non-defensively', 'Ignoring it'], answer: 1, explain: 'Notice, name, stay curious.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'Bordin’s alliance model names bond, goals, and tasks as…', options: ['The three working parts of the alliance', 'Three diagnoses', 'Billing categories'], answer: 0, explain: 'The three components.' },
      { q: 'Skilled rupture repair tends to…', options: ['Destroy trust', 'Deepen trust beyond where it was', 'Have no effect'], answer: 1, explain: 'Repair can strengthen the alliance.' },
      { q: 'Empathy and reliability are…', options: ['Optional extras', 'Learnable skills that build the alliance', 'Irrelevant'], answer: 1, explain: 'Ordinary, learnable, and central.' },
    ] },
  }),
  makeCourse({
    field: 'Individual therapy',
    title: 'Core Counseling Microskills',
    summary: 'The foundational in-session skills — reflective listening, open questions, summarizing, and silence — that carry every modality.',
    trainingHours: 2.5,
    sources: [ACA],
    modules: [
      mod('tl-indiv-micro-m1', 'Listening that the client can feel', 'Reflective listening is not repeating words back — it is showing the person their experience was actually received.',
        'Microskills are the small, trainable moves that make a session work regardless of modality. Reflective listening offers back the essence and the feeling underneath ("so underneath the anger, it sounds like you felt dismissed"), which tells the client they were truly heard. Open questions ("what was that like for you?") invite depth where closed ones shut it down. Summarizing gathers a stretch of conversation into a thread the client can see. And silence — unhurried, comfortable — gives room for the real thing to surface. None of these are tricks; together they create the conditions in which a person can do hard work.',
        { questions: [
          { q: 'Reflective listening primarily…', options: ['Repeats words verbatim', 'Shows the client their experience was received', 'Gives advice'], answer: 1, explain: 'It conveys accurate understanding, not parroting.' },
          { q: 'An OPEN question…', options: ['Invites depth ("what was that like?")', 'Can be answered yes/no', 'Ends the conversation'], answer: 0, explain: 'Open questions invite elaboration.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'Comfortable silence in session…', options: ['Should always be filled', 'Gives room for real material to surface', 'Means the clinician failed'], answer: 1, explain: 'Silence makes space.' },
    ] },
  }),
  makeCourse({
    field: 'Individual therapy',
    title: 'A Survey of Evidence-Based Modalities (Awareness Level)',
    summary: 'A plain-language tour of CBT, DBT, ACT, and motivational interviewing — what each is for. Awareness only; practicing a modality requires its own training.',
    trainingHours: 3,
    sources: [APA_EBP],
    smeConfirm: 'Awareness-level only. Christina confirms which modalities TLC clinicians are trained to deliver and the framing for each.',
    modules: [
      mod('tl-indiv-modalities-m1', 'CBT and DBT', 'CBT works with the link between thoughts, feelings, and behavior; DBT adds skills for riding intense emotion without being swept away.',
        'Cognitive Behavioral Therapy (CBT) is built on a simple, powerful idea: thoughts, feelings, and behaviors are linked, so changing unhelpful thinking patterns and behaviors changes how a person feels. It is structured, skills-focused, and has a broad evidence base. Dialectical Behavior Therapy (DBT) grew from CBT for people who feel emotion very intensely; it pairs acceptance with change and teaches four skill sets — mindfulness, distress tolerance, emotion regulation, and interpersonal effectiveness. This module is awareness-level: it gives shared vocabulary, not competence. Delivering either modality well requires its own dedicated training and supervised practice.',
        { questions: [
          { q: 'CBT centers on the link between…', options: ['Thoughts, feelings, and behaviors', 'Diet and sleep only', 'Childhood alone'], answer: 0, explain: 'The cognitive-behavioral triangle.' },
          { q: 'DBT’s four skill areas include mindfulness, distress tolerance, emotion regulation, and…', options: ['Interpersonal effectiveness', 'Billing', 'Hypnosis'], answer: 0, explain: 'The four DBT modules.' },
        ] }),
      mod('tl-indiv-modalities-m2', 'ACT and Motivational Interviewing', 'ACT helps people make room for hard feelings and act on their values; MI strengthens a person’s own motivation to change.',
        'Acceptance and Commitment Therapy (ACT) shifts the goal from eliminating difficult thoughts and feelings to changing one’s relationship with them — accepting inner experience while committing to action guided by personal values. Motivational Interviewing (MI) is a respectful, collaborative style for helping someone resolve their own ambivalence and strengthen their own reasons to change, rather than the clinician arguing for change. Both are evidence-supported and both, like CBT and DBT, require real training to practice. Knowing what each is FOR helps a clinician recognize when a fuller training — or a referral — is the right next step.',
        { questions: [
          { q: 'ACT’s aim is to…', options: ['Eliminate all hard feelings', 'Accept inner experience and act on values', 'Avoid all action'], answer: 1, explain: 'Acceptance plus values-based action.' },
          { q: 'Motivational Interviewing works by…', options: ['Arguing the client into change', 'Strengthening the client’s OWN motivation', 'Ignoring ambivalence'], answer: 1, explain: 'MI evokes the client’s own reasons.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'This survey qualifies a clinician to…', options: ['Practice any of these modalities', 'Share vocabulary and know when fuller training is needed', 'Certify others'], answer: 1, explain: 'Awareness only; practice needs dedicated training.' },
      { q: 'MI and ACT are alike in that both…', options: ['Are evidence-supported and need real training', 'Require no training', 'Are the same therapy'], answer: 0, explain: 'Both evidence-supported, both need training.' },
    ] },
  }),

  // ===========================================================================
  // 4 · COUPLES & FAMILY
  // ===========================================================================
  makeCourse({
    field: 'Couples & family',
    title: 'Systems Thinking — Seeing the Whole Family',
    summary: 'How a family-systems lens shifts the question from "what’s wrong with this person?" to "what pattern is the whole system caught in?"',
    trainingHours: 3,
    sources: [ACA, APA_EBP],
    preTest: { questions: [
      { q: 'A family-systems lens locates the problem primarily in…', options: ['One "identified" person', 'The patterns between people', 'No one'], answer: 1, explain: 'Systems thinking looks at relational patterns.' },
    ] },
    modules: [
      mod('tl-couple-systems-m1', 'The identified patient and the pattern', 'When a family brings "the problem child," the systems clinician gently widens the lens to the pattern everyone is caught in.',
        'Family-systems thinking treats a family as an interacting whole, not a set of separate individuals. Often a family arrives focused on one member — the "identified patient" — whose symptom may actually be expressing a strain in the whole system (a child acting out around a parental conflict, for instance). The clinician’s move is not to blame anyone but to widen the lens: to notice the repeating loops (one person pursues, another withdraws), the roles people fall into, and the rules — spoken and unspoken — the family lives by. Change one part of a system and the whole system shifts, which is why working with the pattern is often more powerful than working with the "problem person" alone.',
        { questions: [
          { q: 'The "identified patient" is…', options: ['Always the real source of the problem', 'The member a family focuses on, whose symptom may express a system strain', 'The clinician'], answer: 1, explain: 'The symptom often expresses the whole system.' },
          { q: 'A pursue–withdraw loop is an example of…', options: ['A repeating relational pattern', 'A diagnosis', 'A medication'], answer: 0, explain: 'It is a system pattern.' },
        ] }),
      mod('tl-couple-systems-m2', 'Joining without taking sides', 'In couples and family work the clinician must connect with everyone at once — holding multiple truths without becoming anyone’s ally against another.',
        'A core skill in relational work is multidirected partiality — being genuinely on everyone’s side at the same time. If the clinician aligns with one partner against the other, the work collapses; if the clinician stays neutral to the point of coldness, no one feels held. The balance is active: validating each person’s experience as real, surfacing the pattern rather than assigning blame, and keeping the room safe enough that hard things can be said. Faith and culture shape family roles and expectations, so humility about whose norms are in the room is part of the skill. The clinician serves the relationship, not one person’s case against another.',
        { questions: [
          { q: 'Multidirected partiality means…', options: ['Picking the "right" partner', 'Being genuinely on everyone’s side at once', 'Staying cold and neutral'], answer: 1, explain: 'Active, balanced alliance with all.' },
          { q: 'If a clinician aligns with one partner against the other…', options: ['The work strengthens', 'The work tends to collapse', 'Nothing changes'], answer: 1, explain: 'Taking sides breaks relational work.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'Systems thinking asks…', options: ['"What pattern is the system caught in?"', '"Who is to blame?"', '"Which one is the patient?"'], answer: 0, explain: 'Pattern over blame.' },
      { q: 'Serving the relationship means the clinician is…', options: ['One partner’s advocate', 'On everyone’s side, holding multiple truths', 'Absent'], answer: 1, explain: 'Multidirected partiality.' },
    ] },
  }),
  makeCourse({
    field: 'Couples & family',
    title: 'Communication & Conflict in Relationships',
    summary: 'Research-grounded patterns that predict relationship distress, and the repair skills couples can learn — framed for the therapy room.',
    trainingHours: 2.5,
    sources: [APA_EBP],
    modules: [
      mod('tl-couple-comm-m1', 'The corrosive patterns and their antidotes', 'Certain communication habits reliably erode relationships — and each one has a learnable antidote.',
        'Gottman’s research identified communication patterns that predict relationship breakdown — often summarized as criticism, contempt, defensiveness, and stonewalling — with contempt the most corrosive. The clinical value is that each has an antidote a couple can practice: criticism gives way to a gentle, specific complaint about a behavior rather than an attack on character; contempt to deliberate appreciation and respect; defensiveness to taking some responsibility; stonewalling to a self-soothing break and return. The therapist’s job is to make the pattern visible in the room, slow it down, and coach the antidote — turning an automatic destructive loop into a chosen, repairable exchange.',
        { questions: [
          { q: 'The most corrosive of the patterns is generally…', options: ['Contempt', 'A gentle complaint', 'Taking responsibility'], answer: 0, explain: 'Contempt is the strongest predictor of breakdown.' },
          { q: 'The antidote to criticism is…', options: ['A character attack', 'A gentle, specific complaint about a behavior', 'Silence'], answer: 1, explain: 'Soft start-up about behavior, not character.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'The therapist’s role with a destructive loop is to…', options: ['Let it run', 'Make it visible, slow it down, coach the antidote', 'Take a side'], answer: 1, explain: 'Surface and coach repair.' },
    ] },
  }),
  makeCourse({
    field: 'Couples & family',
    title: 'Desire, Connection & Covenant — Rebuilding Intimacy in Marriage',
    summary: 'Built on the candid public marriage conversation Devale & Khadeen Ellis had (as engaged on Rivah TV). The human voices source a truth that is ultimately from Yahweh; we credit them and test the lesson against His Word. Synthesized into original teaching — not a reproduction of the video. Teaches the clinical reality of DESIRE DISCREPANCY (not a gender stereotype), the science of how desire and connection actually work, and marriage through Yahweh’s design.',
    trainingHours: 3.5,
    origin: 'youtube-distilled',
    source: { teacher: 'Devale & Khadeen Ellis (public conversation)', channel: 'Rivah TV', url: 'https://youtu.be/UNTcnf7cRNY', conduitNote: 'A faithful human source pointing to a truth from Yahweh; credited, not elevated above the Word.' },
    sourceReach: { recognition: 'Widely-viewed public conversation by recognized public figures (reported in the millions of views).', exactCount: null, smeConfirm: 'Exact view count is recorded qualitatively, not fabricated — confirm if a figure is wanted.' },
    sources: [APA_EBP, ACA],
    smeConfirm: 'Christina (LCSW) approves BOTH the clinical soundness AND the faith framing; doctrine confirmed by Darrell / Christina / Bishop (non-denominational, Word-first). Handles real public figures’ intimate disclosures respectfully — educational lesson, never sensational.',
    preTest: { questions: [
      { q: 'When partners want sex at different frequencies, the clinically accurate name is…', options: ['One partner is broken', 'Desire discrepancy — common and multi-causal', 'A gender failing'], answer: 1, explain: 'Desire discrepancy is common, multi-causal, and not about blame.' },
      { q: 'Yahweh’s design for marriage centers on…', options: ['Performance and image', 'Covenant oneness and sacrificial love', 'Keeping score'], answer: 1, explain: 'Covenant oneness + sacrificial love (Gen 2:24; Eph 5).' },
    ] },
    strands: {
      yahweh: {
        principle: 'Marriage is Yahweh’s covenant of oneness — two becoming one flesh — sustained by sacrificial, patient love and faithfulness. Intimacy is part of His good design for that union, not a bargaining chip; spouses are told to not deprive one another but to give to each other. The method that heals every strand below is the love He commanded: lay-your-life-down love that seeks the other’s good first.',
        anchors: ['Genesis 2:24', 'Ephesians 5:25-33', '1 Corinthians 13:4-7', '1 Corinthians 7:3-5', 'John 13:34-35'],
        smeDoctrine: 'Doctrine confirmed by Darrell / Christina / Bishop (non-denominational, Word-first). Scripture cited by reference; wording to be set from the chosen translation on review.',
      },
      clinical: 'Assess desire discrepancy without blame; build expectation-setting and candid communication; repair the disconnect that distance creates; and balance the domestic load so resentment and burnout do not quietly erode intimacy.',
      science: 'Responsive vs spontaneous desire (Basson); the dual-control model of arousal (Janssen & Bancroft); dopamine, novelty, and habituation in long-term pairs; attachment theory (Bowlby) and Emotionally Focused Therapy (Johnson); oxytocin in bonding; and neuroplasticity — repeated warm, attuned interactions literally re-wire a couple’s connection (Hebbian "cells that fire together wire together").',
        societal: 'Social-media marriage is curated; candid "real deal" conversation is the corrective. These dynamics show up across cultures and are discussed here with dignity — especially the strength and candor in Black marriage conversations — without trading in stereotypes about either spouse.',
    },
    modules: [
      mod('tl-couple-desire-m1', 'The covenant frame — what marriage is FOR',
        'Before technique, the direction: Yahweh designed marriage as a covenant of oneness, and that frame reorders everything else.',
        'Start with Yahweh’s perspective, because it sets the destination the clinical work serves. Scripture frames marriage as covenant — two becoming one flesh (Genesis 2:24) — held together by sacrificial love (Ephesians 5) and the patient, unself-seeking love of 1 Corinthians 13. Against that, the curated marriage of social media sells an image; the Ellis conversation is valuable precisely because it is candid instead of idealized. A clinician working with a faith-rooted couple can name the gap honestly: the goal is not a highlight reel but a real, durable oneness in which both people are safe, known, and cherished. Holding the covenant frame keeps the later work — desire, communication, the domestic load — pointed toward connection rather than scorekeeping. (Faith framing reviewed by Christina / Bishop.)',
        { questions: [
          { q: 'The covenant frame keeps the clinical work pointed toward…', options: ['A social-media image', 'Durable oneness and mutual cherishing', 'Winning the argument'], answer: 1, explain: 'Covenant oneness is the direction the skills serve.' },
          { q: 'The Ellis conversation is clinically useful because it is…', options: ['Idealized', 'Candid rather than curated', 'A diagnosis'], answer: 1, explain: 'Candor is the corrective to curated marriage.' },
        ] }),
      mod('tl-couple-desire-m2', 'Desire discrepancy — the clinical reality under the hot-take',
        'The viral framing said women "push monogamy but treat intimacy as a chore." That is a stereotype, not a finding — the real, teachable truth is desire discrepancy.',
        'The public conversation floated a gendered generalization — that women want exclusivity but experience intimacy as a chore. We do NOT teach that as fact; it blames a gender for a human pattern. The documented clinical reality underneath is DESIRE DISCREPANCY: partners commonly want sexual frequency at different levels, and it is multi-causal — stress, exhaustion, the mental and domestic load, health, history, resentment, and simple difference in wiring. The science reframes it further: Basson showed much desire is RESPONSIVE (it follows closeness and arousal) rather than SPONTANEOUS (arising unbidden), and the dual-control model describes a balance of accelerators and brakes that differs person to person. So a partner who is not spontaneously initiating is not "withholding a chore" — their brakes may be fully pressed by load and stress while connection (the accelerator) is thin. The clinical move is to depathologize, map each partner’s real accelerators and brakes, and rebuild closeness so responsive desire has something to respond to — never to assign blame by gender.',
        { questions: [
          { q: 'The gendered "intimacy as a chore" claim should be…', options: ['Taught as fact', 'Replaced with the real concept: desire discrepancy', 'Used to blame men'], answer: 1, explain: 'Teach desire discrepancy, multi-causal, not gender-blame.' },
          { q: 'Responsive desire means desire often…', options: ['Arises only spontaneously', 'Follows closeness and arousal', 'Never returns'], answer: 1, explain: 'Basson: responsive desire follows connection.' },
          { q: 'A partner not initiating is best understood as…', options: ['Withholding on purpose', 'Possibly having the "brakes" pressed by load/stress', 'Broken'], answer: 1, explain: 'Dual-control: brakes vs accelerators, not blame.' },
        ] }),
      mod('tl-couple-desire-m3', 'Rebuilding connection — communication, repair, and the shared load',
        'Desire and closeness are rebuilt the same way the brain learns anything — through repeated, attuned, safe interaction; and through fairly carrying the load so resentment does not.',
        'Rebuilding is concrete and hopeful. Attachment science (Bowlby; Sue Johnson’s Emotionally Focused Therapy) shows couples reconnect by turning toward each other’s bids and repairing the moments of disconnection rather than avoiding them. Neuroplasticity is the engine: warm, attuned interactions repeated over time literally strengthen the couple’s pathways for trust and closeness — the brain wires what it practices, so small consistent moves outperform grand gestures. Clinically, that means coaching candid expectation-setting ("here is what intimacy and partnership mean to me"), teaching repair after rupture, protecting novelty and play (which feed the dopamine/closeness loop), and — crucially — balancing the domestic and mental load, because chronic imbalance breeds the resentment and exhaustion that press the brakes on desire. All of it is the love Yahweh commanded made practical: spouses giving to one another (1 Corinthians 7:3-5), seeking the other’s good first (John 13:34-35). The clinical and scientific rigor serve that direction; they do not replace it.',
        { questions: [
          { q: 'Neuroplasticity tells couples that connection is rebuilt by…', options: ['One grand gesture', 'Repeated, attuned, safe interactions over time', 'Waiting it out'], answer: 1, explain: 'The brain wires what it repeatedly practices.' },
          { q: 'Balancing the domestic/mental load matters because imbalance breeds…', options: ['Closeness', 'Resentment and exhaustion that suppress desire', 'Nothing'], answer: 1, explain: 'Chronic imbalance presses the brakes on desire.' },
          { q: 'The clinical + scientific work ultimately serves…', options: ['Replacing the faith frame', 'Living out the sacrificial love Yahweh designed', 'Scorekeeping'], answer: 1, explain: 'The strands serve Yahweh’s design; they do not replace it.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'The clinically accurate replacement for the gendered "chore" claim is…', options: ['Desire discrepancy — common, multi-causal, no gender-blame', 'Women are the problem', 'Men are the problem'], answer: 0, explain: 'Desire discrepancy is the teachable truth.' },
      { q: 'Responsive desire (Basson) means…', options: ['Desire follows closeness/arousal for many people', 'Desire is always spontaneous', 'Desire cannot change'], answer: 0, explain: 'Responsive desire follows connection.' },
      { q: 'Couples rebuild connection neurologically through…', options: ['Repeated attuned interaction (neuroplasticity)', 'A single apology', 'Avoiding conflict'], answer: 0, explain: 'The brain wires what it practices.' },
      { q: 'In the four-strand frame, the clinical/scientific/societal strands…', options: ['Replace Yahweh’s perspective', 'Show how Yahweh’s design is lived out', 'Are unrelated to faith'], answer: 1, explain: 'They serve the centre; they do not replace it.' },
      { q: 'The source conversation is handled by…', options: ['Reproducing the video', 'Crediting it, synthesizing original teaching, and testing it against the Word', 'Ignoring attribution'], answer: 1, explain: 'Credit the conduit; test against Scripture; transform, don’t reproduce.' },
    ] },
  }),

  // ===========================================================================
  // 5 · GROUP
  // ===========================================================================
  makeCourse({
    field: 'Group',
    title: 'How Groups Heal — Therapeutic Factors',
    summary: 'The mechanisms that make group therapy work — universality, instillation of hope, and the others — and how a facilitator cultivates them.',
    trainingHours: 3,
    sources: [APA_EBP],
    preTest: { questions: [
      { q: 'A unique healing factor of GROUP (vs individual) therapy is…', options: ['Universality — "I’m not the only one"', 'Higher fees', 'Less structure'], answer: 0, explain: 'Universality is a hallmark group factor.' },
    ] },
    modules: [
      mod('tl-group-factors-m1', 'Why a group can do what one-to-one can’t', 'A well-run group offers things individual therapy cannot — chief among them the relief of discovering you are not alone.',
        'Yalom described the therapeutic factors that make groups work. Universality — the discovery that others struggle with the same things — breaks the isolation that shame builds. Instillation of hope comes from seeing others a few steps further along. Imparting information, altruism (helping others helps the helper), and the corrective recapitulation of the family group all play a part. Above all, a group is a social microcosm: members re-enact their relational patterns in the room, where those patterns can be seen and worked with directly. The facilitator’s craft is to create the safety and norms in which these factors can operate.',
        { questions: [
          { q: '"Instillation of hope" in a group often comes from…', options: ['The fee structure', 'Seeing others further along', 'Strict silence'], answer: 1, explain: 'Hope from peers’ progress.' },
          { q: 'A group as a "social microcosm" means…', options: ['Members re-enact their patterns where they can be worked with', 'The group is unrealistic', 'No real relationships form'], answer: 0, explain: 'Patterns show up live and become workable.' },
        ] }),
      mod('tl-group-factors-m2', 'Safety, norms, and the facilitator’s role', 'A group only heals if it is safe — building and protecting norms is the facilitator’s first and ongoing job.',
        'The factors that make groups powerful only operate inside safety. The facilitator establishes norms early — confidentiality, one person at a time, respect across difference, the right to pass — and then protects them, especially in the harder moments. The facilitator manages process more than content: drawing out the quiet member, gently containing the dominating one, naming what is happening between members, and steering conflict toward something workable rather than letting it wound. For culturally diverse groups, attending to who feels safe to speak — and whose norms are assumed — is part of the work. Good facilitation is mostly invisible and entirely intentional.',
        { questions: [
          { q: 'The facilitator primarily manages…', options: ['Process — safety, norms, what happens between members', 'Only the content of each story', 'The billing'], answer: 0, explain: 'Process leadership is the core role.' },
          { q: 'Group norms are…', options: ['Set once and forgotten', 'Established early and actively protected', 'Unnecessary'], answer: 1, explain: 'Norms are built and maintained.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'Universality offers members…', options: ['Relief that they are not alone', 'A diagnosis', 'A discount'], answer: 0, explain: 'The "me too" relief.' },
      { q: 'Group healing factors operate only inside…', options: ['Safety the facilitator builds and protects', 'Strict secrecy from the clinician', 'A leaderless room'], answer: 0, explain: 'Safety is the precondition.' },
    ] },
  }),
  makeCourse({
    field: 'Group',
    title: 'Running Psychoeducational & Support Groups',
    summary: 'The practical craft of planning, opening, and closing a group session, and managing common challenges, for support and psychoeducation formats.',
    trainingHours: 2,
    sources: [APA_EBP],
    modules: [
      mod('tl-group-run-m1', 'The shape of a session', 'A reliable opening, a clear middle, and an intentional close give a group the container it needs to do real work.',
        'Even an informal support group benefits from structure. A consistent OPENING — a check-in or grounding ritual — signals safety and gathers everyone into the room. The MIDDLE carries the session’s purpose: a topic and discussion for a psychoeducational group, shared experience and mutual support for a support group, always with the facilitator watching airtime and emotional safety. The CLOSE matters as much as the open: a summary, a forward step, and a deliberate transition back out, so no one leaves cracked open. Anticipating common challenges — the monopolizer, the silent member, a member in distress — and having a plan for each keeps the container intact.',
        { questions: [
          { q: 'A strong group close includes…', options: ['Abruptly ending', 'A summary, a forward step, and a transition out', 'Opening a new heavy topic'], answer: 1, explain: 'Close intentionally so members leave settled.' },
          { q: 'Watching "airtime" means…', options: ['Timing the session to the minute', 'Making sure no one dominates and quiet members are included', 'Recording the group'], answer: 1, explain: 'Balancing participation.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'Having a plan for the monopolizer and the silent member helps…', options: ['Keep the container intact', 'Lengthen the group', 'Avoid facilitation'], answer: 0, explain: 'Plan for common challenges.' },
    ] },
  }),

  // ===========================================================================
  // 6 · CRISIS & RISK
  // ===========================================================================
  makeCourse({
    field: 'Crisis & risk',
    title: 'Suicide Risk: Assessment & Safety Planning (Foundations)',
    summary: 'A foundational, awareness-level orientation to recognizing risk, asking directly, and collaborative safety planning. The practice protocol is owned by the licensed supervisor.',
    trainingHours: 3,
    sources: [SAMHSA_988, APA_EBP],
    smeConfirm: 'HIGHEST-STAKES field. Christina (LCSW) owns and signs off TLC’s actual risk-assessment and safety-planning protocol; this course is orientation, not the protocol.',
    preTest: { questions: [
      { q: 'Asking a client directly about suicidal thoughts…', options: ['Plants the idea and increases risk', 'Is appropriate and does not increase risk', 'Should never be done'], answer: 1, explain: 'Asking directly does not increase risk; it opens help.' },
    ] },
    modules: [
      mod('tl-crisis-suicide-m1', 'Ask directly, listen without flinching', 'The single most important skill in risk work is the willingness to ask about suicide plainly — and to stay present for the answer.',
        'A persistent myth holds that asking about suicide plants the idea; the evidence is clear that it does not — direct, compassionate asking opens the door to help. Foundational practice means noticing warning signs (hopelessness, talk of being a burden, withdrawal, giving things away, a sharp change after depression), then asking in plain language whether the person is thinking about suicide, and staying steady and non-judgmental for the answer. The clinician explores the thoughts, any plan, means, and intent, while keeping the person connected rather than alarmed. This module orients you to the posture; the specific assessment instrument and protocol TLC uses are owned and trained by Christina (LCSW).',
        { questions: [
          { q: 'Asking directly about suicide…', options: ['Increases risk', 'Opens the door to help and does not increase risk', 'Is optional small talk'], answer: 1, explain: 'Direct asking is protective, not harmful.' },
          { q: 'A warning sign worth noting is…', options: ['Talk of being a burden and giving things away', 'Making weekend plans', 'Asking about session times'], answer: 0, explain: 'Burden/giving-away are recognized signs.' },
        ] }),
      mod('tl-crisis-suicide-m2', 'Collaborative safety planning', 'A safety plan is something built WITH a person, not handed to them — a concrete, personal list of what to do and who to reach when the storm comes.',
        'A collaborative safety plan is a short, written, client-owned plan used widely in the field. It typically walks through the person’s own warning signs, internal coping strategies they can use alone, people and settings that provide distraction and connection, people they can ask for help, professionals and agencies to contact, and steps to make the environment safer by reducing access to means. The power is in the collaboration: the client generates the content, so it fits their real life and they own it. Crucially, anytime risk is acute, the answer is real human help now — the 988 Suicide & Crisis Lifeline (call or text 988) and local emergency services — never a self-serve handout. TLC’s exact escalation path is set by Christina.',
        { questions: [
          { q: 'A safety plan works best when…', options: ['The clinician writes it alone', 'The client generates the content collaboratively', 'It is generic'], answer: 1, explain: 'Client ownership makes it usable.' },
          { q: 'For ACUTE risk, the right step is…', options: ['A handout', 'Real human help now — 988 and emergency services', 'Wait for next session'], answer: 1, explain: 'Acute risk routes to humans immediately.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'The 988 Lifeline is reached by…', options: ['Calling or texting 988', 'Email only', 'It does not exist'], answer: 0, explain: 'Call or text 988.' },
      { q: 'This course is best described as…', options: ['TLC’s official protocol', 'An orientation; the protocol is owned by the licensed supervisor', 'A certification in risk assessment'], answer: 1, explain: 'Orientation, not the protocol.' },
      { q: 'Reducing access to means is…', options: ['Irrelevant', 'A recognized part of safety planning', 'Always impossible'], answer: 1, explain: 'Means-safety is part of the plan.' },
    ] },
  }),
  makeCourse({
    field: 'Crisis & risk',
    title: 'De-escalation & Crisis Response',
    summary: 'How to stay regulated and help another person regulate in an acute moment — verbal de-escalation principles and the clinician’s own grounding.',
    trainingHours: 2,
    sources: [SAMHSA_988],
    modules: [
      mod('tl-crisis-deesc-m1', 'Your calm is the intervention', 'In a crisis, the clinician’s own regulated nervous system is the first and most powerful tool — you cannot de-escalate from an escalated place.',
        'De-escalation begins with the helper. A person in acute distress is co-regulating off everyone around them, so a calm, slow, low voice and unhurried body language do real work before any words land. The verbal principles are consistent across crisis-intervention models: keep it simple and concrete, listen more than you direct, validate the feeling without arguing the facts, offer choices to restore a sense of control, and respect physical and emotional space. Throughout, the clinician monitors their own activation and uses grounding to stay steady. And the bright line holds: if there is danger to self or others, de-escalation runs alongside — never instead of — contacting real emergency help.',
        { questions: [
          { q: 'The first tool in de-escalation is…', options: ['A louder voice', 'The clinician’s own regulated, calm presence', 'Winning the argument'], answer: 1, explain: 'Co-regulation starts with the helper’s calm.' },
          { q: 'Offering choices during de-escalation helps by…', options: ['Restoring a sense of control', 'Confusing the person', 'Ending the conversation'], answer: 0, explain: 'Choice restores agency.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'When there is danger to self or others, de-escalation…', options: ['Replaces emergency help', 'Runs alongside contacting real emergency help', 'Is the only response'], answer: 1, explain: 'Never instead of emergency help.' },
    ] },
  }),

  // ===========================================================================
  // 7 · ETHICS & BOUNDARIES
  // ===========================================================================
  makeCourse({
    field: 'Ethics & boundaries',
    title: 'Professional Ethics & Codes of Conduct',
    summary: 'The shared backbone of professional ethics — the codes that bind your license, and a model for working through dilemmas that aren’t black-and-white.',
    trainingHours: 3,
    sources: [NASW, ACA],
    preTest: { questions: [
      { q: 'Which code binds a given clinician is determined by…', options: ['Personal preference', 'Their license / profession (e.g. NASW for social work)', 'The client'], answer: 1, explain: 'The license dictates the binding code.' },
    ] },
    modules: [
      mod('tl-ethics-codes-m1', 'The codes and their core values', 'Every clinician practices under a code — and beneath the specific rules sit a few shared core values that guide the hard cases.',
        'A clinician’s license determines the binding code: the NASW Code of Ethics for social workers, the ACA Code of Ethics for counselors, the APA Ethics Code for psychologists. Though they differ in detail, they share a core: service and the dignity and worth of the person, the importance of human relationships, integrity, competence, and (in social work especially) social justice. The codes are not just lists of prohibitions — they encode a professional identity. Knowing the letter matters; knowing the values beneath the letter is what guides you when two duties collide and no rule gives a clean answer.',
        { questions: [
          { q: 'A shared core value across the codes is…', options: ['Profit maximization', 'The dignity and worth of the person', 'Avoiding all relationships'], answer: 1, explain: 'Dignity/worth of the person is foundational.' },
          { q: 'The codes are best understood as…', options: ['Only a list of prohibitions', 'An encoding of professional identity and values', 'Optional suggestions'], answer: 1, explain: 'They encode identity, not just rules.' },
        ] }),
      mod('tl-ethics-codes-m2', 'Working an ethical dilemma', 'When duties collide, you don’t improvise — you work the problem through a deliberate, documentable model.',
        'Real ethical dilemmas are conflicts between two goods — confidentiality versus safety, client autonomy versus a duty to protect. A decision-making model gives you a defensible path: identify the problem and who is affected; consult the relevant code sections; consider the options and their consequences; consult a supervisor or colleague; choose a course you could defend openly; act; and document the reasoning. The documentation is not bureaucratic — it shows the decision was reasoned, not reactive, and it protects both client and clinician. The aim is not a perfect answer but a thoughtful, consultative, transparent process.',
        { questions: [
          { q: 'An ethical dilemma is typically a conflict between…', options: ['Two goods or duties', 'Right and obviously wrong', 'Two clients'], answer: 0, explain: 'Good-versus-good is the hard case.' },
          { q: 'A key step in the model is to…', options: ['Decide alone and quickly', 'Consult and document the reasoning', 'Avoid the decision'], answer: 1, explain: 'Consultation and documentation matter.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'When two duties collide, the clinician should…', options: ['Improvise silently', 'Use a decision model: consult the code, consult a colleague, document', 'Always favor confidentiality'], answer: 1, explain: 'Work it through a model.' },
      { q: 'Documenting ethical reasoning primarily…', options: ['Wastes time', 'Shows the decision was reasoned and protects everyone', 'Hides the decision'], answer: 1, explain: 'It evidences a reasoned process.' },
    ] },
  }),
  makeCourse({
    field: 'Ethics & boundaries',
    title: 'Boundaries, Dual Relationships & Self-Disclosure',
    summary: 'How to hold the boundaries that keep therapy safe — especially in a small, close-knit, or faith community where lives overlap.',
    trainingHours: 2.5,
    sources: [ACA, NASW],
    smeConfirm: 'Christina owns how boundary/dual-relationship standards apply to a small, faith-rooted, historically-close community.',
    modules: [
      mod('tl-ethics-bound-m1', 'Boundaries that protect the work', 'Boundaries are not coldness — they are the frame that makes it safe for a client to be vulnerable.',
        'Professional boundaries define the therapeutic relationship: its purpose, its limits, and the asymmetry that keeps it focused on the client’s needs rather than the clinician’s. A dual relationship — when a clinician has another role with a client (neighbor, fellow church member, business contact) — risks impairing objectivity and exploiting trust, even unintentionally. The codes prohibit sexual dual relationships outright and require great care with others. In a small or tight-knit community, some overlap may be unavoidable; the standard then is informed consent, consultation, supervision, and documentation, with the client’s welfare always governing. Self-disclosure follows the same test: share only when it serves the client, never to meet the clinician’s own needs.',
        { questions: [
          { q: 'A dual relationship is risky because it can…', options: ['Impair objectivity and exploit trust', 'Improve therapy automatically', 'Replace consent'], answer: 0, explain: 'It threatens objectivity and trust.' },
          { q: 'When some overlap is unavoidable in a small community, the standard is…', options: ['Ignore it', 'Informed consent, consultation, supervision, documentation', 'End all therapy'], answer: 1, explain: 'Manage it transparently and carefully.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'Clinician self-disclosure is appropriate when it…', options: ['Serves the client’s needs', 'Meets the clinician’s needs', 'Is always avoided'], answer: 0, explain: 'It must serve the client.' },
    ] },
  }),

  // ===========================================================================
  // 8 · DOCUMENTATION
  // ===========================================================================
  makeCourse({
    field: 'Documentation',
    title: 'Clinical Documentation That Holds Up',
    summary: 'How to write notes that serve the client, support continuity and billing, and stand up to an audit — using standard formats like DAP and SOAP.',
    trainingHours: 2.5,
    sources: [NASW, APA_EBP],
    preTest: { questions: [
      { q: 'A progress note primarily exists to…', options: ['Fill space', 'Support continuity of care, communication, and accountability', 'Record private opinions'], answer: 1, explain: 'It serves care, communication, accountability.' },
    ] },
    modules: [
      mod('tl-doc-formats-m1', 'Why we document, and standard formats', 'A note is a clinical and legal record — written so that another professional, or future-you, can pick up care without losing the thread.',
        'Documentation serves continuity of care, communication across providers, billing justification, and a legal record of what happened and why. Standard structures keep notes consistent and complete. DAP — Data, Assessment, Plan — is common in outpatient mental health: what was observed and reported, the clinician’s assessment of it, and the plan forward. SOAP adds a Subjective/Objective split. Whatever the format, a good note captures the presenting concern, what was done (the intervention), the client’s response, any risk, and the next step. It is written professionally, in a way you would be comfortable for the client or an auditor to read.',
        { questions: [
          { q: 'In DAP, the "A" stands for…', options: ['Assessment', 'Administration', 'Authorization'], answer: 0, explain: 'Data, ASSESSMENT, Plan.' },
          { q: 'A complete note captures concern, intervention, client response, risk, and…', options: ['The next step / plan', 'The clinician’s lunch', 'Unrelated opinions'], answer: 0, explain: 'The forward plan completes it.' },
        ] }),
      mod('tl-doc-formats-m2', 'Timely, objective, and minimum-necessary', 'Good notes are written promptly, describe rather than judge, and include what is needed — no more.',
        'Three habits separate strong documentation from weak. TIMELY: notes written soon after the session (commonly within 24–48 hours) are more accurate and more defensible than ones reconstructed weeks later. OBJECTIVE: describe behavior and quote the client rather than labeling or speculating ("client stated she felt hopeless" beats "client was being dramatic"). MINIMUM-NECESSARY: include the clinical information needed for care and justification, and leave out gratuitous sensitive detail that doesn’t serve the record. Note quality is also an equity issue — biased or sloppy language in a record can follow a client for years. The standard is professional, fair, and useful.',
        { questions: [
          { q: 'An objective note…', options: ['Labels the client ("dramatic")', 'Describes behavior and quotes the client', 'Speculates freely'], answer: 1, explain: 'Describe and quote; don’t judge.' },
          { q: '"Minimum-necessary" means include…', options: ['Every detail possible', 'What’s needed for care and justification, no gratuitous detail', 'Nothing at all'], answer: 1, explain: 'Necessary clinical info, not more.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'Notes are most accurate when written…', options: ['Weeks later', 'Promptly, commonly within 24–48 hours', 'Never'], answer: 1, explain: 'Timeliness aids accuracy and defensibility.' },
      { q: 'Biased language in a record matters because…', options: ['It doesn’t', 'It can follow a client for years — an equity issue', 'It speeds billing'], answer: 1, explain: 'Records persist; fairness counts.' },
    ] },
  }),
  makeCourse({
    field: 'Documentation',
    title: 'HIPAA, Privacy & the PHI Line',
    summary: 'The privacy baseline every clinician owns — what PHI is, the minimum-necessary rule, and the bright line that clinical detail never leaks into marketing or casual channels.',
    trainingHours: 2,
    sources: [NASW],
    smeConfirm: 'Christina/TLC confirm the practice’s specific privacy procedures and the EHR/hosting boundary.',
    modules: [
      mod('tl-doc-hipaa-m1', 'What PHI is and where it belongs', 'Protected health information is powerful and portable — knowing what it is and keeping it in the right place is a daily, practical discipline.',
        'Protected Health Information (PHI) is any information that links a person to their health or care — name plus a diagnosis, appointment, or note. HIPAA’s Privacy Rule sets the baseline: use and share PHI only as needed for treatment, payment, and operations, and apply the minimum-necessary standard. The practical disciplines are ordinary but non-negotiable: keep records in the secure clinical system, not in personal email or texts; speak about clients only where you can’t be overheard; and hold the bright line that clinical detail belongs in the clinical record ONLY — never in marketing, testimonials, or casual conversation, even anonymized. When in doubt, less sharing is safer, and the practice’s specific procedures govern.',
        { questions: [
          { q: 'PHI is…', options: ['Any info linking a person to their health/care', 'Only Social Security numbers', 'Public information'], answer: 0, explain: 'It links identity to health/care.' },
          { q: 'Clinical detail belongs…', options: ['In marketing if anonymized', 'In the clinical record only', 'Anywhere convenient'], answer: 1, explain: 'The PHI line: record only, never marketing.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'The minimum-necessary rule says…', options: ['Share everything', 'Use/share only the PHI needed for the purpose', 'Never document'], answer: 1, explain: 'Only what’s needed.' },
    ] },
  }),

  // ===========================================================================
  // 9 · CULTURAL HUMILITY
  // ===========================================================================
  makeCourse({
    field: 'Cultural humility',
    title: 'From Cultural Competence to Cultural Humility',
    summary: 'Why "humility" — lifelong learning with the client as the expert — outperforms a fixed "competence" checklist, and what it looks like in the room.',
    trainingHours: 3,
    sources: [NASW, APA_EBP],
    preTest: { questions: [
      { q: 'Cultural humility treats the client as…', options: ['A checklist of traits', 'The expert on their own culture and context', 'A diagnosis'], answer: 1, explain: 'Client-as-expert is the core stance.' },
    ] },
    modules: [
      mod('tl-culture-humility-m1', 'A posture, not a credential', 'You never "complete" cultural competence — humility is the ongoing, honest stance that there is always more to learn from the person in front of you.',
        'Cultural competence once implied a clinician could master another culture and check it off. Cultural humility reframes that as a lifelong posture: ongoing self-reflection about one’s own assumptions and biases, a redress of the power imbalance inherent in the helping relationship, and a genuine stance of the client as the expert on their own culture, faith, and lived experience. It is humbler and more accurate — no clinician can fully know another’s world, but any clinician can keep learning and stay curious. In practice it means asking rather than assuming, noticing when your norms are operating as the default, and treating difference as something to understand, not correct.',
        { questions: [
          { q: 'Cultural humility differs from "competence" in that it…', options: ['Is a credential you complete', 'Is an ongoing posture of learning and self-reflection', 'Ignores culture'], answer: 1, explain: 'A lifelong posture, never "done".' },
          { q: 'A humble clinician handles difference by…', options: ['Correcting it to their own norm', 'Asking and seeking to understand', 'Assuming'], answer: 1, explain: 'Ask, don’t assume.' },
        ] }),
      mod('tl-culture-humility-m2', 'Bias, rupture, and repair across difference', 'Everyone carries bias; the skill is catching it, owning it, and repairing the moments it shows up across difference.',
        'Implicit bias is universal and largely automatic — having it is not a moral failure; refusing to examine it is. In cross-cultural work, bias and microaggressions can cause ruptures the clinician may not even notice. The skill is to build self-awareness (including honest reflection and, where useful, formal training), to watch for the small signs that a client felt misunderstood across difference, and to repair without defensiveness — owning the impact even when the intent was good. For TLC’s mission to historically-underserved communities, this is central: a clinician who can be corrected, who knows their own location, and who treats the client’s context with respect builds the trust that makes everything else possible.',
        { questions: [
          { q: 'Having implicit bias is…', options: ['A unique moral failure', 'Universal; the failure is refusing to examine it', 'Impossible'], answer: 1, explain: 'Everyone has it; examine it.' },
          { q: 'Repairing a cross-cultural rupture requires…', options: ['Defending your intent', 'Owning the impact without defensiveness', 'Ending therapy'], answer: 1, explain: 'Impact over intent; non-defensive repair.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'The client-as-expert stance means…', options: ['The clinician knows the culture best', 'The client is the authority on their own context', 'No one is the expert'], answer: 1, explain: 'Client holds the expertise on their world.' },
      { q: 'For historically-underserved clients, a correctable, humble clinician primarily builds…', options: ['Trust', 'Distance', 'A diagnosis'], answer: 0, explain: 'Trust is the foundation.' },
    ] },
  }),
  makeCourse({
    field: 'Cultural humility',
    title: 'Faith-Integrated Care, Done Ethically',
    summary: 'How to honor a client’s faith as a source of strength without imposing — following the client’s lead, within consent and competence.',
    trainingHours: 2.5,
    sources: [ACA, NASW],
    smeConfirm: 'Christina confirms TLC’s faith-integration posture and where it sits relative to clinical scope.',
    modules: [
      mod('tl-culture-faith-m1', 'Client-led, consented, within competence', 'Faith can be one of the deepest resources a person has — honored ethically, it strengthens care; imposed, it harms.',
        'For many clients, faith is central to identity, meaning, and coping, and ignoring it can miss a profound source of strength. Integrating it ethically rests on a few firm principles: assess the client’s own framework rather than assuming it; obtain informed consent for any spiritual intervention; stay within your competence and scope; document appropriately; and never impose the clinician’s beliefs or use the relationship to evangelize. The clinician follows the client’s lead — a client may want prayer woven in, or may want their faith simply respected as context. Done this way, faith-integration is both client-centered and consistent with the codes. Done as imposition, it violates them.',
        { questions: [
          { q: 'Ethical faith-integration is…', options: ['Imposed when the clinician believes it helps', 'Client-led, consented, and within competence', 'Always avoided'], answer: 1, explain: 'Follow the client’s lead, with consent.' },
          { q: 'Using the relationship to evangelize is…', options: ['Best practice', 'A violation of professional ethics', 'Required'], answer: 1, explain: 'Imposition violates the codes.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'The clinician’s role with a client’s faith is to…', options: ['Replace it with the clinician’s', 'Follow the client’s lead and honor it ethically', 'Dismiss it'], answer: 1, explain: 'Honor, client-led.' },
    ] },
  }),

  // ===========================================================================
  // 10 · SUPERVISION
  // ===========================================================================
  makeCourse({
    field: 'Supervision',
    title: 'Clinical Supervision — Getting the Most From It',
    summary: 'What supervision is for, how to use it well as a supervisee, and how the supervisory relationship itself shapes growth toward licensure.',
    trainingHours: 2.5,
    sources: [NASW, ACA, IDFPR_SW],
    smeConfirm: 'Illinois supervision-hour rules and who may supervise vary by license; Christina confirms the exact IL LCSW requirement.',
    preTest: { questions: [
      { q: 'Clinical supervision exists mainly to…', options: ['Catch mistakes only', 'Develop the clinician and protect client welfare', 'Replace therapy'], answer: 1, explain: 'Development plus client protection.' },
    ] },
    modules: [
      mod('tl-superv-use-m1', 'What supervision is for', 'Supervision is where clinical skill is actually built — a protected space to think, get feedback, and grow, with the client’s welfare always in view.',
        'Clinical supervision has several jobs at once: it develops the supervisee’s competence, it safeguards client welfare, it serves a gatekeeping role for the profession, and (for the pre-licensed clinician) it accrues the supervised experience required for licensure. A competency-based model focuses on building specific skills through case discussion, observation, feedback, and modeling — within a supervisory ALLIANCE that, like the therapeutic one, is the foundation everything rests on. For the supervisee, the most growth comes from bringing real, even uncomfortable, material rather than only the cases that went well.',
        { questions: [
          { q: 'A pre-licensed clinician uses supervision partly to…', options: ['Accrue supervised experience toward licensure', 'Avoid all feedback', 'Skip development'], answer: 0, explain: 'Supervised hours count toward licensure.' },
          { q: 'The supervisory ALLIANCE is…', options: ['Irrelevant', 'The foundation good supervision rests on', 'A billing code'], answer: 1, explain: 'Like the therapeutic alliance, it’s foundational.' },
        ] }),
      mod('tl-superv-use-m2', 'Bringing your real work', 'You grow fastest when you bring the cases that worry you — supervision is for the hard parts, not a performance.',
        'The supervisee who only presents tidy successes wastes the most valuable resource they have. Growth comes from bringing the stuck cases, the ruptures, the moments of uncertainty, and the strong reactions a case stirred up (this is part of using supervision to understand one’s own responses). That requires a supervisory relationship safe enough for honesty — which is why a good supervisor builds trust and gives feedback that is direct but humane. The supervisee’s job is to come prepared, be open, and act on the feedback; the supervisor’s is to challenge and support in balance. Illinois has specific rules about who may supervise and how many hours are required — those specifics are confirmed by Christina (LCSW) for the IL LCSW path.',
        { questions: [
          { q: 'The most useful material to bring to supervision is…', options: ['Only the cases that went well', 'The stuck, uncertain, or hard cases', 'Nothing'], answer: 1, explain: 'Bring the hard parts.' },
          { q: 'The exact IL supervision-hour requirements are…', options: ['Invented here', 'Confirmed by Christina (LCSW) for the IL path', 'The same in every state'], answer: 1, explain: 'State-specific; SME-confirmed.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'Supervision’s gatekeeping role protects…', options: ['The profession and the public', 'Only the supervisor', 'No one'], answer: 0, explain: 'Gatekeeping safeguards clients/profession.' },
      { q: 'A supervisee grows fastest by…', options: ['Performing only successes', 'Bringing real, hard material and acting on feedback', 'Avoiding supervision'], answer: 1, explain: 'Honesty plus follow-through.' },
    ] },
  }),
  makeCourse({
    field: 'Supervision',
    title: 'Giving & Receiving Clinical Feedback',
    summary: 'The skill underneath supervision: how to give feedback that builds skill without shaming, and how to receive it without defensiveness.',
    trainingHours: 2,
    sources: [ACA],
    modules: [
      mod('tl-superv-feedback-m1', 'Feedback that builds, not shames', 'Good clinical feedback is specific, balanced, and tied to growth — and good supervisees learn to receive it as a gift, not a threat.',
        'Effective feedback follows a few learnable rules: make it specific and behavioral rather than vague or characterological ("when you reflected her anger, she opened up" beats "good job"); balance affirmation with growth edges so the person can hear it; tie it to a concrete next step; and deliver it in a relationship safe enough that it lands. On the receiving side, the skill is to manage one’s own defensiveness, get curious instead of justifying, ask for specifics, and choose what to act on. Both sides serve the same aim — better care for clients — which is why feedback in supervision is a professional skill in its own right, not a personal verdict.',
        { questions: [
          { q: 'Strong feedback is…', options: ['Vague and characterological', 'Specific, behavioral, and tied to a next step', 'Only criticism'], answer: 1, explain: 'Specific + behavioral + actionable.' },
          { q: 'Receiving feedback well means…', options: ['Justifying immediately', 'Getting curious and managing defensiveness', 'Ignoring it'], answer: 1, explain: 'Curiosity over defensiveness.' },
        ] }),
    ],
    postTest: { questions: [
      { q: 'Feedback in supervision is best understood as…', options: ['A personal verdict', 'A professional skill serving better client care', 'Punishment'], answer: 1, explain: 'A skill in service of clients.' },
    ] },
  }),
];

// The frozen, normalized library. Every entry is already makeCourse-shaped.
export const TRAINING_LIBRARY = COURSES;

// ---------------------------------------------------------------------------
// Accessors — pure, derived. The surface + the plan + the tests share these.
// ---------------------------------------------------------------------------
export function allCourses() { return TRAINING_LIBRARY; }

export function getCourse(courseId) {
  return TRAINING_LIBRARY.find((c) => c.id === courseId) || null;
}

export function coursesByField(field) {
  return TRAINING_LIBRARY.filter((c) => c.field === field);
}

// Courses grouped into the ten fields, in the canonical field order. Always returns
// every field (empty array if none authored yet — an honest, visible gap).
export function libraryByField(courses = TRAINING_LIBRARY) {
  return TRAINING_FIELDS.map((field) => ({
    field,
    slug: fieldSlug(field),
    courses: (courses || []).filter((c) => c.field === field),
  }));
}

export function courseTrainingHours(course) {
  return Math.max(0, Number(course && course.trainingHours) || 0);
}

// Per-field rollup: course count + total training hours. Honest about thin fields.
export function fieldCoverage(courses = TRAINING_LIBRARY) {
  return libraryByField(courses).map(({ field, slug, courses: list }) => ({
    field,
    slug,
    courseCount: list.length,
    hours: list.reduce((t, c) => t + courseTrainingHours(c), 0),
  }));
}

// Whole-library totals.
export function libraryTotals(courses = TRAINING_LIBRARY) {
  const list = courses || [];
  return {
    courseCount: list.length,
    totalHours: list.reduce((t, c) => t + courseTrainingHours(c), 0),
    fields: TRAINING_FIELDS.length,
    fieldsCovered: fieldCoverage(list).filter((f) => f.courseCount > 0).length,
    authored: list.filter((c) => c.origin === 'authored').length,
    distilled: list.filter((c) => c.origin === 'youtube-distilled').length,
    validated: list.filter((c) => c.validated).length,
  };
}

// ---------------------------------------------------------------------------
// Completion + growth — real, derived from the learner's OWN records. Never painted.
//   progress   = { [moduleId]: truthy }
//   quizState  = { [moduleId]: { passed, pct, at } }
//   testState  = { [courseId]: { pre?: {pct,passed,at}, post?: {pct,passed,at} } }
// ---------------------------------------------------------------------------
export function courseModuleAssessment(course, progress = {}, quizState = {}) {
  return courseAssessment((course && course.modules) || [], progress, quizState);
}

// A course is COMPLETE when every module is done + its quiz passed AND, if the course
// has a post-test, the post-test is passed. The post-test is the graded gate.
export function courseComplete(course, progress = {}, quizState = {}, testState = {}) {
  if (!course) return false;
  const mod = courseModuleAssessment(course, progress, quizState);
  if (!mod.complete) return false;
  if (course.postTest && Array.isArray(course.postTest.questions) && course.postTest.questions.length) {
    const rec = testState[course.id] && testState[course.id].post;
    return !!(rec && rec.passed);
  }
  return true;
}

// Grade a course's pre- or post-test with the shared engine, against the course's
// own passThreshold. Returns the gradeQuiz result with `passed` recomputed at the
// course threshold (so a course can set a higher bar than the engine default).
export function gradeCourseTest(course, which, answers = {}) {
  const test = which === 'pre' ? (course && course.preTest) : (course && course.postTest);
  const res = gradeQuiz(test, answers);
  const threshold = course && course.passThreshold != null ? Number(course.passThreshold) : DEFAULT_PASS_THRESHOLD;
  const total = res.total || 0;
  const passed = total > 0 ? res.correct / total >= threshold : false;
  return { ...res, passed, threshold };
}

// Growth from pre-test to post-test, as a percentage-point delta. Returns null when
// either is missing (honest — no painted "improvement").
export function growthDelta(testState = {}, courseId) {
  const rec = testState[courseId];
  if (!rec || !rec.pre || !rec.post) return null;
  const pre = Number(rec.pre.pct);
  const post = Number(rec.post.pct);
  if (!Number.isFinite(pre) || !Number.isFinite(post)) return null;
  return { pre, post, delta: post - pre };
}

// The hour-entry payload a completed course logs into the supervised-hours ledger
// (lib/practice-academy.makeHourEntry). It is a TRAINING activity (didactic), tagged
// with the course's field as the competency — hours are hours, logged honestly.
export function courseHourEntry(course, { learnerEmail = '', date = null } = {}) {
  return {
    date,
    hours: courseTrainingHours(course),
    activity: 'training',                 // didactic / coursework (countsClinical:false)
    competency: course && course.field ? course.field : null,
    supervisor: '',
    note: course ? `Course: ${course.title}` : '',
    learnerEmail,
  };
}
