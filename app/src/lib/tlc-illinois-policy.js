// =============================================================================
// tlc-illinois-policy — Illinois policy, program and procedure, as data, for
// every therapist training (DR-0345)
// =============================================================================
// Darrell 2026-09-10: "We also want the 24 trainings for therapists to be for
// the week... make sure to be comprehensive in each lesson for each training...
// latest most update information based on Illinois policy and program and
// procedures of the state."
//
// One registry of the Illinois rules a TLC clinician works under, each with
// its citation, what it requires, the office procedure that follows from it,
// and the primary source. Every course in the library gets an "Illinois:
// policy, program and procedure" lesson composed from the rules that apply
// to its field (illinoisModuleFor), so the state's requirements are taught
// inside the training, not linked out of it.
//
// VERIFICATION (DR-0076 / DR-0100). Figures were checked 2026-09-10 against
// the sources named on each rule through web search (the primary IDFPR,
// ILGA, Cornell LII and Justia pages are not reachable from the build
// sandbox, so the wording here is a faithful paraphrase, never presented as
// the statute's text). ILLINOIS_POLICY_AS_OF is shown in-app so a stale rule
// is visible, not silent; `smeConfirm` names what Christina (LCSW) ratifies.
// Established fact is stated plainly (DR-0100); a genuinely open point is
// flagged narrowly.
export const ILLINOIS_POLICY_AS_OF = '2026-09-10';

export const ILLINOIS_SOURCES = Object.freeze({
  act: { label: 'Clinical Social Work and Social Work Practice Act, 225 ILCS 20', url: 'https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=1319&ChapterID=24' },
  rules: { label: '68 Ill. Adm. Code 1470 (the Act’s rules)', url: 'https://www.ilga.gov/agencies/JCAR/EntirePart?titlepart=06801470' },
  ce: { label: '68 Ill. Adm. Code 1470.95 — Continuing Education', url: 'https://www.law.cornell.edu/regulations/illinois/Ill-Admin-Code-tit-68-SS-1470.95' },
  supervision: { label: '68 Ill. Adm. Code 1470.20 — Clinical Professional Experience', url: 'https://www.law.cornell.edu/regulations/illinois/Ill-Admin-Code-tit-68-SS-1470.20' },
  idfprApply: { label: 'IDFPR — LSW / LCSW application instructions', url: 'https://idfpr.illinois.gov/content/dam/soi/en/web/idfpr/renewals/apply/forms/sw.pdf' },
  idfprCe: { label: 'IDFPR CE fact sheet — LSW & LCSW', url: 'https://idfpr.illinois.gov/content/dam/soi/en/web/idfpr/forms/dpr/ce-sw.pdf' },
  ancra: { label: 'Abused and Neglected Child Reporting Act, 325 ILCS 5', url: 'https://law.justia.com/codes/illinois/chapter-325/act-325-ilcs-5/' },
  mhddca: { label: 'Mental Health and Developmental Disabilities Confidentiality Act, 740 ILCS 110', url: 'https://law.justia.com/codes/illinois/chapter-740/act-740-ilcs-110/' },
  minors: { label: 'Mental Health and Developmental Disabilities Code, 405 ILCS 5/3-501 (minors, outpatient counseling)', url: 'https://www.ilga.gov/legislation/ilcs/documents/040500050K3-501.htm' },
  telehealth: { label: 'Telehealth Act, 225 ILCS 150', url: 'https://law.justia.com/codes/illinois/chapter-225/act-225-ilcs-150/' },
  naswTelehealth: { label: 'NASW-Illinois — Practicing telehealth in Illinois and across state lines', url: 'https://www.naswil.org/post/practicing-telehealth-therapy-in-illinois-and-across-state-lines' },
  crisis: { label: 'IDHS — 988 Suicide & Crisis Lifeline (Illinois)', url: 'https://www.dhs.state.il.us/page.aspx?item=145089' },
  cessa: { label: 'Community Emergency Services and Supports Act (CESSA), 50 ILCS 754', url: 'https://www.illinois.gov/news/press-release.25192.html' },
  pipa: { label: 'Personal Information Protection Act, 815 ILCS 530', url: 'https://law.justia.com/codes/illinois/chapter-815/act-815-ilcs-530/' },
  harassment: { label: '68 Ill. Adm. Code 1130.400 — Sexual Harassment Prevention Training', url: 'https://www.ilga.gov/commission/jcar/admincode/068/068011300E04000R.html' },
  bias: { label: '20 ILCS 2105/2105-15.7 — Implicit bias awareness training', url: 'https://www.ilga.gov/legislation/ilcs/fulltext.asp?DocName=002021050K2105-15.7' },
  dcfs: { label: 'Illinois DCFS — mandated reporter training', url: 'https://mr.dcfstraining.org/' },
});

// One rule: what the state requires, the procedure the office follows because
// of it, the citation, the sources, and a quiz question that proves the reader
// took it in. `verbatim:false` everywhere — see the header.
const rule = (key, o) => Object.freeze({ key, verbatim: false, asOf: ILLINOIS_POLICY_AS_OF, ...o });

export const ILLINOIS_RULES = Object.freeze({
  'ce-renewal': rule('ce-renewal', {
    title: 'Continuing education for renewal (LSW / LCSW)',
    cite: '68 Ill. Adm. Code 1470.95; 225 ILCS 20',
    requires: 'Thirty hours of continuing education each two-year renewal cycle; Illinois social work licenses expire November 30 of each odd-numbered year (the current cycle runs December 1, 2025 to November 30, 2027). Within the thirty: three hours in social work practice ethics, three hours in cultural competence, one hour of sexual harassment prevention training, one hour of implicit bias awareness training, and one hour on Alzheimer’s disease and other dementias. Beginning with the renewal period ending November 30, 2027, licensed clinical social workers complete a one-time six hours of clinical supervision training within their thirty. No continuing education is required for the first renewal of a new license. Hours count only from an IDFPR-approved social work CE sponsor (sponsor numbers read 159.xxxxxx).',
    procedure: 'Log every activity in the CE renewal area of Training the day it is completed, with the sponsor number and the mandated topic it satisfies; the tracker shows the mandated minimums against the thirty, the renewal countdown, and the first-renewal exemption. Keep the certificate of attendance for the cycle plus one year in case of audit.',
    sources: ['ce', 'idfprCe', 'rules', 'harassment', 'bias'],
    smeConfirm: 'Christina confirms the one-time six-hour clinical supervision training counts inside the thirty (not in addition) and the exact dementia-training trigger for licensees serving adults.',
    quiz: { q: 'An Illinois LCSW renewing in November 2027 needs, within the thirty hours…', options: ['Ethics 3, cultural competence 3, sexual harassment 1, implicit bias 1, dementia 1, and a one-time 6 in clinical supervision', 'Thirty hours of any topic', 'No hours; renewal is automatic'], answer: 0, explain: 'The mandated minimums sit inside the thirty; the six-hour supervision training is one-time, first due for the cycle ending November 30, 2027.' },
  }),
  'lcsw-licensure': rule('lcsw-licensure', {
    title: 'Becoming an LCSW: supervised clinical experience',
    cite: '225 ILCS 20/9; 68 Ill. Adm. Code 1470.20',
    requires: 'After the master’s in social work, 3,000 hours of satisfactory supervised clinical professional experience over at least two years (2,000 hours after a doctorate), directly related to clinical social work as the Act defines it, then the ASWB Clinical examination. Since 1995 only experience supervised by a licensed clinical social worker counts. The supervisor meets with the supervisee an average of at least four hours each month; supervision may be individual or in a group of no more than five supervisees; it may be inside or outside the employing agency, paid or unpaid, and the supervisor evaluates the experience as satisfactory. An applicant who took and failed the clinical examination after January 1, 2019 may substitute an additional 3,000 hours of supervised professional experience within the statutory window; for hours earned on or after January 1, 2026 the applicant must already hold an Illinois LSW or school social work license before those alternative hours accrue.',
    procedure: 'A pre-licensed colleague logs each week’s clinical hours and each supervision meeting in the Hours area of Training, naming the LCSW supervisor; the ledger shows the running total against 3,000 and the four-hours-a-month supervision average, so the Verification of Experience form is filled from a record, not from memory.',
    sources: ['act', 'supervision', 'idfprApply'],
    smeConfirm: 'Christina confirms TLC’s supervision contract wording (inside or outside the agency, paid or unpaid) and that group supervision at TLC never exceeds five.',
    quiz: { q: 'For the Illinois LCSW after an MSW, the experience requirement is…', options: ['3,000 supervised clinical hours over at least two years, supervised by an LCSW, averaging four supervision hours a month', '1,000 hours in one year, any supervisor', 'No hours; the exam alone'], answer: 0, explain: 'Three thousand hours, two years minimum, an LCSW supervisor, four hours a month on average, groups of five at most.' },
  }),
  'mandated-reporting': rule('mandated-reporting', {
    title: 'Mandated reporting of child abuse and neglect',
    cite: 'Abused and Neglected Child Reporting Act, 325 ILCS 5/4',
    requires: 'Social workers are mandated reporters: on reasonable cause to believe a child known to them in their professional capacity may be abused or neglected, they report to the Department of Children and Family Services immediately. Every mandated reporter completes initial training within three months of starting a role that carries the duty and retrains at least every three years; the training covers the indicators of abuse and neglect, the Illinois reporting process and its documentation, responding to a child in a trauma-informed way, and what to expect from child protective services after the call.',
    procedure: 'Report by telephone to the DCFS hotline the same day, then complete the written report the Act requires; document the observation, the call time, the worker spoken to and the report number in the clinical record, factually and without conclusion. Tell a supervisor; the duty to report is personal and is not discharged by telling someone else. Keep the DCFS training certificate current and log it in Training.',
    sources: ['ancra', 'dcfs'],
    smeConfirm: 'Christina confirms the office’s written reporting steps and where the DCFS certificate is filed. The hotline number is not carried here from memory: the DCFS site is the source of the number.',
    quiz: { q: 'A mandated reporter in Illinois who suspects abuse…', options: ['Reports to DCFS immediately and documents the call; telling a supervisor alone does not discharge the duty', 'Waits for proof', 'Reports only if the parent agrees'], answer: 0, explain: 'The duty is personal and immediate; reasonable cause is the threshold, not proof.' },
  }),
  confidentiality: rule('confidentiality', {
    title: 'Confidentiality of the clinical record',
    cite: 'Mental Health and Developmental Disabilities Confidentiality Act, 740 ILCS 110',
    requires: 'Every record and communication in mental-health services is confidential and is disclosed only as the Act allows, ordinarily with the recipient’s written consent. A therapist’s personal notes kept in the therapist’s sole possession for the therapist’s own use, and shared with no one but a supervisor, consulting therapist or attorney, are not part of the record; once disclosed, they become part of it. A recipient twelve or older has the right to inspect and copy their own record. When consent cannot be obtained despite every reasonable effort, a disclosure without consent is limited to the identity of the recipient and therapist and the nature, purpose, quantity and dates of service, and the recipient is told of it.',
    procedure: 'Use the office release-of-information form for every disclosure and file the signed copy with the record; keep personal notes physically and electronically apart from the clinical record; honor a record request from a recipient twelve or older within the Act’s terms; note every disclosure, with its authority, in the record. Colleague files in this app are never client records; no client health information passes through it.',
    sources: ['mhddca'],
    quiz: { q: 'Under 740 ILCS 110, a therapist’s personal notes…', options: ['Are outside the record while kept in the therapist’s sole possession, and join it once disclosed', 'Are always part of the record', 'May be shared with anyone'], answer: 0, explain: 'Personal notes stay outside the record only while undisclosed.' },
  }),
  'duty-to-warn': rule('duty-to-warn', {
    title: 'Disclosure to warn or protect',
    cite: '740 ILCS 110/11',
    requires: 'A therapist may disclose, in the therapist’s sole discretion and to the extent necessary, to warn or protect a specific individual against whom the recipient has made a specific threat of violence, where a therapist-recipient relationship or a special recipient-individual relationship exists.',
    procedure: 'On a specific threat against a specific person: assess and document the threat, consult the clinical supervisor at once, decide the disclosure and its extent, make it, and document the reasoning, the recipient of the warning and the time. The disclosure is limited to what protection requires.',
    sources: ['mhddca'],
    quiz: { q: 'Illinois permits a disclosure to warn when…', options: ['A specific threat of violence is made against a specific individual, in the therapist’s discretion and to the extent necessary', 'A client seems angry', 'A family member asks'], answer: 0, explain: 'Specific threat, specific person, limited to what protection needs.' },
  }),
  'minor-consent': rule('minor-consent', {
    title: 'Minors and outpatient counseling',
    cite: '405 ILCS 5/3-501',
    requires: 'A minor twelve or older may request and receive outpatient counseling or psychotherapy without a parent’s or guardian’s consent. Until that consent is obtained, counseling for a minor under seventeen is initially limited to eight sessions of ninety minutes; the provider may continue without parental consent after at least two unsuccessful attempts to contact the parent or guardian for consent and with the minor’s written consent. The parent or guardian is not told about the counseling without the minor’s consent unless the provider believes disclosure is necessary, and the minor is told before the parent is informed.',
    procedure: 'Record the minor’s age and who consented at intake; count the eight-session limit for an under-seventeen minor without parental consent; log each attempt to reach the parent (date, method); obtain and file the minor’s written consent before continuing; when disclosure to a parent becomes necessary, tell the minor first and document it.',
    sources: ['minors'],
    quiz: { q: 'A fifteen-year-old asks for counseling without a parent. In Illinois…', options: ['Counseling may begin, initially limited to eight ninety-minute sessions until parental consent, or two documented attempts plus the minor’s written consent', 'Counseling may not begin', 'There is no limit'], answer: 0, explain: 'Twelve or older may consent; under seventeen carries the eight-session initial limit.' },
  }),
  telehealth: rule('telehealth', {
    title: 'Telehealth',
    cite: 'Telehealth Act, 225 ILCS 150',
    requires: 'A clinician treating a client located in Illinois by telehealth must be licensed or otherwise authorized to practice in Illinois; clinical social workers are health care professionals under the Act and practice telehealth within the scope of their licensing Act to the same standard of care as in-person services. Illinois issues no separate telehealth license. Since January 1, 2023 an out-of-state social worker may serve by telehealth a client who is temporarily visiting Illinois. Serving a client located in another state depends on that state’s law.',
    procedure: 'Confirm and record the client’s physical location at the start of every telehealth session; serve only clients located where the clinician is licensed or authorized; obtain telehealth consent at intake; use the office’s HIPAA-covered platform; have an emergency plan with the client’s local emergency number and address on file.',
    sources: ['telehealth', 'naswTelehealth'],
    smeConfirm: 'Whether Illinois has enacted the Social Work Licensure Compact, and its effective date, is not verified here; Christina confirms before any cross-state telehealth is offered.',
    quiz: { q: 'For a telehealth session with a client sitting in Illinois, the clinician must…', options: ['Hold an Illinois license or authorization and meet the in-person standard of care', 'Hold any state’s license', 'Hold a separate Illinois telehealth license'], answer: 0, explain: 'Licensed in Illinois, same standard of care; there is no separate telehealth license.' },
  }),
  crisis: rule('crisis', {
    title: 'Crisis response: 988 and CESSA',
    cite: '988 Suicide & Crisis Lifeline (IDHS); Community Emergency Services and Supports Act (CESSA)',
    requires: 'Anyone in Illinois can call or text 988 to reach trained crisis counselors at any hour, for suicidal thoughts, a mental health or substance use crisis, emotional distress, or concern for a loved one. Under CESSA, 911 operators refer calls seeking mental or behavioral health support to a service that can dispatch mental health professionals rather than police, coordinated with 988, to keep people in crisis out of emergency rooms and the justice system where care is the right response.',
    procedure: 'Every safety plan names 988 and the client’s local emergency number; the client’s address and emergency contact are on file for every telehealth session; a clinician facing imminent risk calls emergency services, stays with the client where possible, consults the supervisor, and documents the assessment, the plan and every call.',
    sources: ['crisis', 'cessa'],
    quiz: { q: 'In Illinois, 988…', options: ['Reaches trained crisis counselors by call or text, at any hour, for any mental health crisis or concern for a loved one', 'Is only for active suicide attempts', 'Replaces 911 for all emergencies'], answer: 0, explain: 'Call or text, any hour, any crisis; 911 remains the emergency number, with CESSA routing behavioral-health calls to mental health response.' },
  }),
  records: rule('records', {
    title: 'Records, retention and data protection',
    cite: '740 ILCS 110; Personal Information Protection Act, 815 ILCS 530',
    requires: 'The clinical record is confidential under 740 ILCS 110 and is kept apart from personal notes. Any data collector holding personal information must maintain reasonable security measures against unauthorized access, acquisition, destruction, use, modification or disclosure, and must notify affected Illinois residents of a breach. The Confidentiality Act does not itself set a retention period for a private practice; the general Illinois standard used in health care is ten years from the last encounter for an adult and, for a minor, ten years or until age twenty-two, whichever is longer.',
    procedure: 'Keep records in the practice’s clinical system (never in this app), encrypted at rest and in transit, with named access; retain for ten years from the last encounter (minors: ten years or to age twenty-two, whichever is longer); destroy securely and log the destruction; report any suspected breach to the practice owner the same day so notification duties are met.',
    sources: ['mhddca', 'pipa'],
    smeConfirm: 'Christina confirms TLC’s written retention schedule; the ten-year figure is the general health-care standard, not a social-work-specific statute.',
    quiz: { q: 'Under Illinois PIPA, a practice holding client personal information must…', options: ['Keep reasonable security measures and notify affected residents of a breach', 'Do nothing beyond HIPAA', 'Publish the data on request'], answer: 0, explain: 'Reasonable security plus breach notification.' },
  }),
  'cultural-competence': rule('cultural-competence', {
    title: 'Cultural competence and implicit bias, by rule',
    cite: '68 Ill. Adm. Code 1470.95; 20 ILCS 2105/2105-15.7',
    requires: 'Three of the thirty renewal hours are in cultural competence in the practice of social work (a requirement added for renewals on or after January 1, 2025), and one hour is implicit bias awareness training (for renewals on or after January 1, 2023). Both count inside the thirty.',
    procedure: 'Log the cultural competence and implicit bias hours under their mandated topics in the CE renewal area so the tracker shows them met before the renewal date.',
    sources: ['ce', 'bias'],
    quiz: { q: 'Illinois social work renewal requires, within the thirty hours…', options: ['Three hours of cultural competence and one hour of implicit bias awareness', 'No cultural competence hours', 'Ten hours of cultural competence'], answer: 0, explain: 'Three and one, both inside the thirty.' },
  }),
  ethics: rule('ethics', {
    title: 'Ethics and sexual harassment prevention, by rule',
    cite: '68 Ill. Adm. Code 1470.95; 68 Ill. Adm. Code 1130.400',
    requires: 'Three of the thirty renewal hours are in the ethical practice of social work, and one hour each cycle is sexual harassment prevention training under the Department’s cross-profession rule. A licensee is subject to discipline under the Act for unprofessional conduct, including breaches of confidentiality and boundary violations.',
    procedure: 'Complete the ethics and sexual harassment prevention hours from an approved sponsor each cycle and log them under their topics; review the office handbook’s professional-conduct section at onboarding and yearly.',
    sources: ['ce', 'harassment', 'act'],
    quiz: { q: 'Each Illinois renewal cycle a social worker completes…', options: ['Three hours of ethics and one hour of sexual harassment prevention, inside the thirty', 'One hour of ethics only', 'Ethics hours only at first renewal'], answer: 0, explain: 'Three ethics, one sexual harassment prevention, each cycle.' },
  }),
});

export const ILLINOIS_RULE_KEYS = Object.freeze(Object.keys(ILLINOIS_RULES));

// Which Illinois rules each training field teaches. Every field carries the
// renewal rule (the reason the training hours exist) plus the rules its work
// touches; a course may add its own via `illinoisTopics`.
export const FIELD_TOPICS = Object.freeze({
  'Assessment & diagnosis': ['confidentiality', 'minor-consent', 'mandated-reporting'],
  'Treatment planning': ['records', 'minor-consent'],
  'Individual therapy': ['confidentiality', 'telehealth'],
  'Couples & family': ['minor-consent', 'confidentiality', 'mandated-reporting'],
  'Group': ['confidentiality', 'lcsw-licensure'],
  'Crisis & risk': ['crisis', 'duty-to-warn', 'mandated-reporting'],
  'Ethics & boundaries': ['ethics', 'confidentiality', 'duty-to-warn'],
  'Documentation': ['records', 'confidentiality', 'telehealth'],
  'Cultural humility': ['cultural-competence', 'ethics'],
  'Supervision': ['lcsw-licensure', 'ce-renewal'],
});

export function illinoisTopicsFor(course) {
  const base = FIELD_TOPICS[course && course.field] || [];
  const own = Array.isArray(course && course.illinoisTopics) ? course.illinoisTopics : [];
  const keys = ['ce-renewal', ...base, ...own].filter((k, i, a) => ILLINOIS_RULES[k] && a.indexOf(k) === i);
  return keys;
}

export function illinoisRules(keys = ILLINOIS_RULE_KEYS) {
  return keys.map((k) => ILLINOIS_RULES[k]).filter(Boolean);
}

export function sourcesFor(rules) {
  const seen = new Set();
  const out = [];
  for (const r of rules) for (const s of r.sources || []) { if (!seen.has(s) && ILLINOIS_SOURCES[s]) { seen.add(s); out.push(ILLINOIS_SOURCES[s]); } }
  return out;
}

// The Illinois lesson for one course: an engine-shaped module whose standard
// text walks each applicable rule (requirement, then procedure, then the
// citation), whose quiz is the rules' own questions, and whose plain and Word
// renderings are the same (the state's rule carries no Scripture; the course's
// Word rendering lives on its other lessons).
export function illinoisModuleFor(course) {
  const keys = illinoisTopicsFor(course);
  const rules = illinoisRules(keys);
  if (!rules.length) return null;
  const standard = rules.map((r) => `${r.title}. What Illinois requires: ${r.requires} What we do at TLC: ${r.procedure} (${r.cite}.)`).join(' ');
  const teen = rules.map((r) => `${r.title} (${r.cite}): ${r.requires.split('. ')[0]}.`).join(' ');
  return {
    id: `${course.id}-illinois`,
    title: 'Illinois: policy, program and procedure',
    bigIdea: `The Illinois rules this training works under, as of ${ILLINOIS_POLICY_AS_OF}: ${rules.map((r) => r.title.toLowerCase()).join('; ')}. Each with what the state requires, what TLC does because of it, and its citation.`,
    illinois: { keys, asOf: ILLINOIS_POLICY_AS_OF, sources: sourcesFor(rules), smeConfirm: rules.map((r) => r.smeConfirm).filter(Boolean) },
    levels: { teen, standard, senior: standard },
    quiz: { questions: rules.map((r) => r.quiz) },
  };
}
