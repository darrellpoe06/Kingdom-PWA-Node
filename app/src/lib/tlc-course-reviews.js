// =============================================================================
// tlc-course-reviews — for Christina to evaluate: each course's known
// understanding, its sources, the questions only she can settle, and the TLC
// workflow as steps (DR-0345 build-out, 2026-09-10)
// =============================================================================
// Darrell: "I want that paragraph to begin your research: 1 level comprehensive
// review of the known understanding and lessons to discuss with stakeholders...
// a robust version for Christina to evaluate against her knowledge of the
// workflows so we can finalize her App." / "From MVP to hard-coded workflows."
// Every course carries one of these; the Course library renders it under the
// lessons. Keyed by course id. Plain data; Christina ratifies in-app.
const r = (knownUnderstanding, sources, forChristina, workflow) => ({ knownUnderstanding, sources, forChristina, workflow });

export const COURSE_REVIEWS = Object.freeze({
  'tl-assessment-and-diagnosis-biopsychosocial-assessment-the-whole-person': r(
    ['The biopsychosocial model (Engel, 1977) remains the standard frame for intake assessment across social work, medicine and psychology.', 'A formulation (the 4 Ps) is expected in the record as the reasoned basis for the plan.', 'Assessment is where informed consent and the confidentiality limits are explained and recorded.'],
    ['NASW Code of Ethics (2021)', 'APA Policy Statement on Evidence-Based Practice (2006)', 'Engel, G. (1977), Science 196:129'],
    ['Which intake template TLC uses, and whether the three streams and the 4 Ps are explicit fields in it.', 'How long TLC allows for intake (one session or two), and whether a screener battery is standard.', 'Whether TLC records a formulation as a separate section or inside the first progress note.'],
    ['Inquiry arrives (Inquiries tab) and is scheduled for a consult.', 'Consult: fit, consent, confidentiality limits, telehealth consent, minor consent where applicable.', 'Intake session: the three streams; screeners at baseline.', 'Formulation written within 24 hours; shared with the client at session two.', 'Plan built from the formulation (next course).'],
  ),
  'tl-assessment-and-diagnosis-using-the-dsm-5-tr-responsibly': r(
    ['The DSM-5-TR is a shared descriptive language; reliability and validity limits are documented and cultural variation in expression is built into the manual.', 'Diagnosis is within an LCSW’s scope in Illinois; medical rule-out and psychiatric referral remain part of competent practice.', 'The record must show the basis for any diagnosis.'],
    ['American Psychiatric Association, DSM-5-TR (2022), including the Cultural Formulation Interview', '225 ILCS 20 (scope of clinical social work)', 'NASW Code of Ethics, competence and cultural awareness standards'],
    ['TLC’s house position on diagnosis in faith-integrated, culturally humble practice (when to diagnose, how it is explained, how it is written).', 'Which diagnoses TLC clinicians give and which are referred out.', 'How a payer’s code requirement is handled when the clinical picture is unsettled.'],
    ['Assessment first; diagnosis considered only after duration, impairment and exclusions are checked.', 'Medical rule-out requested where plausible.', 'Diagnosis explained to the client in plain words with what it is for.', 'Reasoning recorded with the code; reviewed at plan review.'],
  ),
  'tl-assessment-and-diagnosis-standardized-screening-tools-in-practice': r(
    ['Measurement-based care improves outcomes and detects deterioration clinicians miss; the PHQ-9 and GAD-7 are the most used, with published thresholds.', 'A screener flags and measures; it never diagnoses.', 'Any self-harm item is followed up the same session.'],
    ['Kroenke, Spitzer & Williams (2001), PHQ-9; Spitzer et al. (2006), GAD-7', 'Fortney et al. (2017), measurement-based care in behavioral health', 'Lambert (2010), outcome monitoring'],
    ['Which screeners TLC gives at intake and at what interval afterwards.', 'Where scores are recorded and trended in TLC’s clinical system.', 'Which translated or culturally validated versions TLC uses.'],
    ['Screeners given at intake, scored with the client.', 'Self-harm item positive: safety assessment now, supervisor same day.', 'Repeat at the agreed interval; trend discussed in session.', 'Stalled or falling scores trigger a plan review.'],
  ),
  'tl-treatment-planning-goals-that-are-real-collaborative-measurable-plans': r(
    ['Plans with client-worded goals, measurable objectives and named interventions are the standard payers and boards expect.', 'Collaborative planning improves engagement and outcomes; self-determination is the ethical root.', 'Plans are reviewed at fixed intervals and consent is renewed there.'],
    ['NASW Code of Ethics, self-determination and informed consent', 'Standard treatment-plan structure (goal, objective, intervention, review date) used across Illinois payers', 'Tryon & Winograd (2011), goal consensus and collaboration'],
    ['TLC’s plan template and review interval.', 'How a minor’s own goals and a parent’s goals are held and documented at TLC.', 'How the plan is shared with the client (paper, portal, in session).'],
    ['Goals in the client’s words at session two.', 'Objectives dated and measurable; interventions named with rationale.', 'Client agreement recorded.', 'Review every four to six sessions: still wanted, moving, what changes.'],
  ),
  'tl-treatment-planning-evidence-based-practice-and-matching-the-method': r(
    ['Evidence-based practice integrates research, expertise and the client’s characteristics, culture and preferences (APA, 2006).', 'Method choice is recorded with its rationale.', 'Competence limits what may be delivered; referral covers the rest.'],
    ['APA Presidential Task Force (2006), Evidence-Based Practice in Psychology', 'Division 12 treatment lists; Cochrane and NICE guidance as summaries of evidence', 'NASW Code of Ethics, competence'],
    ['Which methods TLC clinicians are trained in and which are referred out.', 'How TLC records the rationale for the method chosen.', 'Whether TLC keeps a list of the approaches it offers for clients to see.'],
    ['Presenting problem matched to the approaches with the strongest evidence.', 'Clinician competence checked; referral where needed.', 'Client preference discussed and the match said aloud.', 'Method and rationale recorded; revisited at plan review.'],
  ),
  'tl-treatment-planning-measuring-progress-and-knowing-when-to-adjust': r(
    ['Routine outcome and alliance monitoring reduces deterioration and dropout; clinicians overestimate progress without it.', 'A stalled trend is a signal to revisit the formulation and plan, not a client failure.'],
    ['Lambert (2010); Miller, Duncan & colleagues on the ORS/SRS; Fortney et al. (2017)'],
    ['Which outcome and alliance measures TLC uses and how often.', 'The threshold at which TLC expects a plan review.', 'Where the trend is visible to the client.'],
    ['Brief outcome measure at session start; alliance measure at close.', 'Scores plotted in the record.', 'Three to four flat or falling sessions: named to the client; plan revisited.', 'Alliance dip: raised the same session.'],
  ),
  'tl-individual-therapy-the-therapeutic-alliance-the-engine-of-change': r(
    ['The alliance (bond, goals, tasks) is among the strongest predictors of outcome across methods (Horvath, Flückiger and colleagues).', 'Ruptures noticed and repaired predict better outcomes than an alliance that never strains (Safran & Muran).'],
    ['Bordin (1979); Flückiger et al. (2018) meta-analysis; Safran & Muran (2000)'],
    ['Whether TLC uses a brief alliance measure and how it is discussed.', 'How TLC expects a clinician to handle a rupture they cannot repair (supervision, transfer).'],
    ['Goals in the client’s words; tasks explained and agreed.', 'Alliance measured briefly and regularly.', 'Rupture noticed, named, owned, repaired; brought to supervision when it is not.'],
  ),
  'tl-individual-therapy-core-counseling-microskills': r(
    ['Empathy as experienced by the client predicts outcome across approaches; microskills are teachable and measurable.', 'Attending behaviours carry different meanings across cultures.'],
    ['Ivey & Ivey, Intentional Interviewing and Counseling; Elliott et al. (2018) on empathy'],
    ['Whether TLC uses recorded sessions in supervision for microskills review.', 'TLC’s expectations on note-taking during sessions.'],
    ['Attend before speaking; reflect feeling before content.', 'Open questions, summaries at turns, silence held.', 'Skills reviewed in supervision on real segments.'],
  ),
  'tl-individual-therapy-a-survey-of-evidence-based-modalities-awareness-level': r(
    ['CBT carries the largest evidence base for depression and anxiety; DBT is a programme for intense emotion and self-harm; ACT and MI have strong evidence in their domains.', 'This course is awareness level; delivery requires training.'],
    ['Beck; Linehan (1993, 2015); Hayes, Strosahl & Wilson; Miller & Rollnick (2013); Division 12 lists'],
    ['Which modalities TLC delivers, by whom, with what training.', 'Which TLC refers out (for example, full DBT).', 'What continuing education TLC will fund or require.'],
    ['Method matched by evidence, competence and preference.', 'Only trained methods delivered; others referred.', 'Training logged toward Illinois CE.'],
  ),
  'tl-couples-and-family-systems-thinking-seeing-the-whole-family': r(
    ['Family systems theory (Bowen, Minuchin) frames the identified patient’s symptom within the family’s pattern.', 'Confidentiality between family members needs explicit agreement; a minor’s consent and record rights are held alongside the parents’ in Illinois.'],
    ['Bowen (1978); Minuchin (1974); Nichols & Davis, Family Therapy: Concepts and Methods', '405 ILCS 5/3-501; 740 ILCS 110'],
    ['TLC’s consent and confidentiality agreement for family work.', 'When TLC sees a minor alone within family work and how that is documented.'],
    ['Genogram and pattern at the first family session.', 'Confidentiality agreement between members recorded.', 'Pattern reflected without a villain; work organised around it.'],
  ),
  'tl-couples-and-family-communication-and-conflict-in-relationships': r(
    ['Gottman’s four horsemen and their antidotes are the most replicated findings on couple communication; contempt is the strongest predictor of separation.', 'Couple work is contraindicated where there is coercive control or violence; screen separately first.'],
    ['Gottman & Silver (1999); Gottman Institute research summaries', 'Intimate partner violence screening guidance (for example, HITS, WAST)'],
    ['TLC’s separate IPV screening before couple work, and what happens when it is positive.', 'Whether TLC clinicians train in a specific couple method.'],
    ['Screen each partner separately for violence before couple work.', 'Teach the patterns; coach the antidotes live.', 'Stonewalling break rule agreed in advance.'],
  ),
  'tl-couples-and-family-desire-connection-and-covenant-rebuilding-intimacy-in-marriage': r(
    ['Desire discrepancy is common and treatable; the source-distilled course carries its own citations.', 'The covenant frame is TLC’s own and is Christina’s to ratify.'],
    ['The course’s own source and citations'],
    ['Whether the covenant framing is TLC’s position for all couples or offered to couples who share the faith.', 'How a couple who does not share the faith is served in this course.'],
    ['Assessment of the discrepancy; medical rule-out where indicated.', 'Communication and repair skills; the shared load.', 'Faith framing by consent.'],
  ),
  'tl-group-how-groups-heal-therapeutic-factors': r(
    ['Yalom’s therapeutic factors are the standard account of group process; cohesion and interpersonal learning carry the most weight.', 'Group confidentiality is an agreement the clinician cannot enforce; consent must say so.'],
    ['Yalom & Leszcz, The Theory and Practice of Group Psychotherapy (6th ed.)', 'AGPA Practice Guidelines'],
    ['Which groups TLC runs or plans, and their selection criteria.', 'TLC’s group consent form.'],
    ['Screen and prepare each member individually.', 'Norms set in the group’s words; breaches met in the group.', 'Per-member records; no member named in another’s.'],
  ),
  'tl-group-running-psychoeducational-and-support-groups': r(
    ['A fixed session shape (opening round, focus, working time, closing round) holds a group; psychoeducation segments should be short and followed by practice.'],
    ['AGPA Practice Guidelines; Corey, Theory and Practice of Group Counseling'],
    ['TLC’s group curricula and who reviews handouts.', 'Session length and group size TLC uses.'],
    ['Start and end on time.', 'Short teaching, practice, members’ experience.', 'Closing round; attendance and disclosures recorded per member.'],
  ),
  'tl-crisis-and-risk-suicide-risk-assessment-and-safety-planning-foundations': r(
    ['Asking directly does not increase risk and improves disclosure; prior attempt is the strongest predictor.', 'The Stanley–Brown safety plan has evidence; no-suicide contracts do not.', 'Means restriction, especially firearms and medication, is among the most effective interventions.'],
    ['Columbia Suicide Severity Rating Scale; Stanley & Brown (2012) Safety Planning Intervention; Zero Suicide framework', 'IDHS 988; CESSA'],
    ['TLC’s risk assessment tool and documentation template.', 'Same-day supervisor consultation rule when risk is present.', 'TLC’s means-restriction conversation and how firearms are addressed.'],
    ['Direct question at intake and at every signal.', 'Assessment recorded: ideation, plan, means, intent, history, protection.', 'Safety plan built with the client; 988 and local emergency number named.', 'Supervisor consulted the same day; follow-up scheduled.'],
  ),
  'tl-crisis-and-risk-de-escalation-and-crisis-response': r(
    ['De-escalation depends on the responder’s regulation and on lowering threat; verbal de-escalation guidance is consistent across settings.', 'Illinois permits disclosure to warn on a specific threat to a specific person; CESSA routes behavioural crises to mental-health response.'],
    ['Richmond et al. (2012), Verbal De-escalation of the Agitated Patient (Project BETA)', '740 ILCS 110/11; CESSA'],
    ['TLC’s office emergency plan and who is called first.', 'Telehealth crisis procedure: location confirmed, local emergency number on file.'],
    ['Clinician regulates first; names the feeling; offers a choice.', 'Help called early on a threat or weapon.', 'Incident documented the same day; supervisor told.'],
  ),
  'tl-ethics-and-boundaries-professional-ethics-and-codes-of-conduct': r(
    ['The NASW Code’s six values and its standards are the profession’s baseline; the Illinois Act adds discipline for unprofessional conduct.', 'Ethical dilemmas are worked through a stepwise model with consultation and documented reasoning.'],
    ['NASW Code of Ethics (2021); Reamer, Ethical Standards in Social Work', '225 ILCS 20; 68 Ill. Adm. Code 1470'],
    ['TLC’s consultation rule for ethical dilemmas and where the reasoning is recorded.', 'Which ethics CE TLC will require or provide toward the three-hour Illinois mandate.'],
    ['Dilemma written in the eight steps.', 'Supervisor consulted; consultation recorded.', 'Decision, reasoning and client communication documented.'],
  ),
  'tl-ethics-and-boundaries-boundaries-dual-relationships-and-self-disclosure': r(
    ['Boundary violations are among the most common grounds for discipline; sexual contact with a client is always prohibited.', 'In small and faith communities dual relationships are often unavoidable and must be managed and documented.'],
    ['NASW Code of Ethics, standards 1.06 and 1.09; Zur, Boundaries in Psychotherapy', 'TLC Independent Contractor Handbook, Professional Standards'],
    ['TLC’s rules on gifts, social media, and clients from the same congregation.', 'How a dual relationship is documented at TLC.'],
    ['Frame stated at intake.', 'Boundary question: whose need, judgment risk, how it reads in the record; consult.', 'Dual relationship named with the client and documented.'],
  ),
  'tl-documentation-clinical-documentation-that-holds-up': r(
    ['SOAP, DAP and BIRP are the standard note formats; notes are timely, objective and minimum-necessary.', 'Illinois distinguishes the record from the therapist’s personal notes and gives clients twelve and older the right to inspect it.'],
    ['740 ILCS 110; HIPAA minimum-necessary standard', 'TLC Independent Contractor Handbook (notes within 24 hours; TLC templates)'],
    ['TLC’s note format and templates, and the 24-hour rule’s enforcement.', 'TLC’s retention schedule and secure destruction procedure.'],
    ['Note within 24 hours in the TLC template.', 'Risk assessments and interventions recorded by name.', 'Personal notes kept apart from the record.'],
  ),
  'tl-documentation-hipaa-privacy-and-the-phi-line': r(
    ['HIPAA’s privacy and security rules and Illinois’s stricter Confidentiality Act govern PHI; PIPA adds breach notification.', 'The TLC app carries no client health information; the clinical record lives in the practice’s clinical system.'],
    ['HIPAA Privacy and Security Rules; 740 ILCS 110; 815 ILCS 530; 225 ILCS 150 (telehealth)'],
    ['TLC’s approved platforms for telehealth and messaging.', 'TLC’s breach procedure and who is told.', 'TLC’s rule on client testimonials and social media.'],
    ['Approved platforms only; no clinical content by text or personal email.', 'Suspected breach reported the same day.', 'No identifying content in marketing without consent and review.'],
  ),
  'tl-cultural-humility-from-cultural-competence-to-cultural-humility': r(
    ['Cultural humility (Tervalon & Murray-García, 1998) reframes competence as a lifelong posture of self-examination and client-as-expert.', 'Illinois mandates three hours of cultural competence and one of implicit bias per renewal cycle.'],
    ['Tervalon & Murray-García (1998); NASW Standards for Cultural Competence in Social Work Practice', '68 Ill. Adm. Code 1470.95; 20 ILCS 2105/2105-15.7'],
    ['How TLC assesses culture and faith at intake.', 'Which cultural competence and implicit bias CE TLC will use.'],
    ['Ask rather than assume at intake.', 'Adapt pace, directness, family and faith roles to what the client teaches.', 'Ruptures across difference named, owned, repaired, and brought to supervision.'],
  ),
  'tl-cultural-humility-faith-integrated-care-done-ethically': r(
    ['Spiritually integrated therapies show good outcomes for religious clients; consent, competence and client leadership are the ethical conditions.', 'A client who does not want faith in the room is served without it.'],
    ['Pargament, Spiritually Integrated Psychotherapy; Captari et al. (2018) meta-analysis; NASW Code, self-determination and competence'],
    ['TLC’s house position on prayer, Scripture and clergy referral in session, and the consent language used.', 'How TLC serves a client of another faith or none.'],
    ['Spiritual assessment at intake.', 'Explicit consent for any spiritual intervention; documented.', 'Client leads; clinician stays within competence; faith struggle worked with respect.'],
  ),
  'tl-supervision-clinical-supervision-getting-the-most-from-it': r(
    ['Supervision has administrative, educational and supportive functions; a written contract and records are standard.', 'Illinois: 3,000 post-MSW supervised hours over at least two years, an LCSW supervisor averaging four hours a month, groups of five at most.'],
    ['Bernard & Goodyear, Fundamentals of Clinical Supervision', '68 Ill. Adm. Code 1470.20; IDFPR verification of experience form'],
    ['TLC’s supervision contract and who supervises whom.', 'Whether TLC supervision is paid or unpaid, inside or outside the agency, per the Illinois rule.'],
    ['Supervision contract at start.', 'Cases brought prepared; recordings with consent where possible.', 'Each session logged in the Hours area; supervisor evaluates.'],
  ),
  'tl-supervision-giving-and-receiving-clinical-feedback': r(
    ['Effective feedback is specific, behavioural, timely and balanced; the supervisor’s evaluation is a statutory duty in Illinois.'],
    ['Bernard & Goodyear; Illinois 1470.20 (supervisor evaluation)'],
    ['TLC’s evaluation form and cadence for supervisees.', 'How peer feedback is structured in TLC’s team meetings.'],
    ['Ask, observe, suggest, check.', 'Feedback in private, soon after the work.', 'Evaluation recorded at the agreed cadence.'],
  ),
  // ---------------------------------------------------------------------------
  // Christina's six session scripts (tlc-session-scripts.js). The words are
  // hers; the review asks her to confirm HOW each script is used at TLC so the
  // workflow can be hard-coded, and names the clinical understanding under it.
  // ---------------------------------------------------------------------------
  'tl-script-finding-herself': r(
    ['Identity and values work in adulthood is well described: values clarification (as in ACT) and narrative re-authoring help a client separate who she is from the roles she has been assigned.', 'Role loss and life transition are recognised precipitants of low mood and anxiety; the script treats the search itself as healthy rather than as a symptom.', 'Faith-integrated identity work follows the client’s lead on how much of her faith enters the room.'],
    ['Training Notes for Therapists-in-Training (Christina Poe, LCSW, 2025-09-28)', 'Hayes, Strosahl & Wilson, Acceptance and Commitment Therapy (2nd ed., 2012)', 'White & Epston, Narrative Means to Therapeutic Ends (1990)'],
    ['At which session in a client’s course this script is normally used (first session, or once the alliance is set).', 'Whether the role-play is run in supervision before a trainee uses the script with a client, and who plays the client.', 'How the wrap-up homework is recorded and followed up at the next session.'],
    ['Intake and formulation name role loss or identity strain as a target.', 'Trainee rehearses the script in supervision; Christina signs off.', 'Session run from the script: opening, the client’s goal, guiding questions, role-play, encouraging wrap-up.', 'Homework set and noted; reviewed at the next session.', 'Progress checked against the plan’s goal at the next review point.'],
  ),
  'tl-script-saying-no': r(
    ['Assertiveness training is an established behavioural method: a client learns to state a need or refusal clearly, without aggression and without apology, and practises it in graded steps.', 'Difficulty saying no is commonly tied to fear of conflict or of losing a relationship; the script builds strength first, then the words.', 'Role-play with immediate feedback is the method of choice for skills of this kind.'],
    ['Training Notes for Therapists-in-Training (Christina Poe, LCSW, 2025-09-28)', 'Alberti & Emmons, Your Perfect Right (10th ed., 2017)', 'NASW Code of Ethics (2021), 1.02 self-determination'],
    ['Which situations the trainee should choose for the first role-play (low-stakes first, or the client’s hardest one).', 'How a client’s faith and family expectations around refusing are handled when they conflict with the goal.', 'Whether a written script the client keeps between sessions is part of TLC’s practice.'],
    ['Assessment identifies where the client cannot refuse and what it costs her.', 'Goal written in the plan in her words.', 'Session from the script: strength first, then the words, then the role-play with feedback.', 'One real refusal chosen as homework and reported back.', 'Boundary gains reviewed at each plan review.'],
  ),
  'tl-script-managing-anger': r(
    ['Cognitive-behavioural anger management is well supported: recognising the early physical cues, the pause, the thought behind the anger, and a replacement response.', 'Anger is treated as a signal, not a sin in itself; the script keeps Ephesians 4:26 and Proverbs 15:1 as its frame.', 'Safety comes first: anger that has become violence at home is a risk question, not only a skills question.'],
    ['Training Notes for Therapists-in-Training (Christina Poe, LCSW, 2025-09-28)', 'Deffenbacher & McKay, Overcoming Situational and General Anger (2000)', 'Illinois Domestic Violence Act, 750 ILCS 60 (duty to assess safety)'],
    ['What the trainee must screen for (violence at home, substance use) before using this script, and where that screen is recorded.', 'Whether TLC uses a written anger log between sessions and in what form.', 'When a client is referred out to a partner-abuse intervention programme instead of anger work in individual therapy.'],
    ['Safety and substance screen at intake; risk recorded.', 'Anger goal and its triggers written into the plan.', 'Session from the script: cues, the pause, the thought, the soft answer; role-play.', 'Anger log kept between sessions; reviewed each session.', 'Escalation or violence disclosed: safety plan and referral per Illinois law.'],
  ),
  'tl-script-family-conflict': r(
    ['Family conflict is best understood systemically: the pattern between members, not one member’s fault, and the client’s part in the pattern is the part she can change.', 'Communication skills (I-statements, listening back, a pause before answering) reduce conflict measurably when practised.', 'Boundaries with family are a frequent target for adult clients and often carry faith and honour questions the script names.'],
    ['Training Notes for Therapists-in-Training (Christina Poe, LCSW, 2025-09-28)', 'Nichols & Davis, Family Therapy: Concepts and Methods (12th ed., 2020)', 'Gottman & Silver, The Seven Principles for Making Marriage Work (2015)'],
    ['Whether this script is used with the individual only, or also when family members join a session.', 'How the trainee handles a client who wants the therapist to take her side against a family member.', 'Whether a family session at TLC needs a separate consent and how it is documented.'],
    ['Intake maps the family pattern and the client’s part in it.', 'Goal written as a change in her own move, not in the other person.', 'Session from the script: the pattern, the skills, the role-play of one hard conversation.', 'Homework: one conversation tried; reported back.', 'Family joins a session only with consent recorded per TLC policy.'],
  ),
  'tl-script-household-imbalance': r(
    ['Unequal division of household and parenting labour is a well-documented source of couple conflict; naming the invisible work is the first move, negotiation is the second.', 'Couple work here uses the same communication antidotes as the couples course: soft start-up, listening back, a concrete agreement written down.', 'Faith framing around roles is handled from the Word with care so that neither partner is shamed and both are honoured.'],
    ['Training Notes for Therapists-in-Training (Christina Poe, LCSW, 2025-09-28)', 'Gottman & Silver, The Seven Principles for Making Marriage Work (2015)', 'Rodsky, Fair Play (2019), for the labour-inventory method'],
    ['Whether TLC uses a written inventory of household tasks in session and which one.', 'How a couple session is booked and billed at TLC and who the client of record is.', 'How the trainee responds when one partner uses Scripture to close the negotiation.'],
    ['Couple consult: both partners consent; the client of record set per TLC policy.', 'Inventory of the labour completed together in session or as homework.', 'Session from the script: the imbalance named, the negotiation, the role-play, the written agreement.', 'Agreement tried for a fortnight and reviewed.', 'Adjusted at each review until both call it fair.'],
  ),
  'tl-script-healing-after-relationship': r(
    ['Recovery after an unhealthy or abusive relationship follows a trauma-informed course: safety, then stabilisation, then meaning; pace is set by the client.', 'Self-worth work (Psalms 139:14) and boundaries for the next relationship are the script’s two pillars, matched by the evidence on rebuilding after coercive control.', 'Ongoing contact with the former partner, children in common, or legal proceedings change the plan and may raise safety questions.'],
    ['Training Notes for Therapists-in-Training (Christina Poe, LCSW, 2025-09-28)', 'Herman, Trauma and Recovery (rev. ed., 2015)', 'Illinois Domestic Violence Act, 750 ILCS 60; the Illinois DV helpline 1-877-863-6338'],
    ['What safety questions the trainee asks first when the relationship has ended recently, and where the answers are recorded.', 'Whether TLC refers to a domestic-violence advocate alongside therapy, and how that hand-off is made.', 'How far the script goes before a trauma-specific modality (EMDR, TF-CBT) is considered and who decides.'],
    ['Safety screen at intake; referral to advocacy where indicated, recorded.', 'Goal written in the client’s words: worth, boundaries, or both.', 'Session from the script: opening, the goal, the strategies, the role-play, the wrap-up.', 'Boundary and self-care homework reviewed each session.', 'Trauma-specific work considered at the plan review if symptoms persist.'],
  ),

});

export function courseReview(courseId) { return COURSE_REVIEWS[courseId] || null; }
