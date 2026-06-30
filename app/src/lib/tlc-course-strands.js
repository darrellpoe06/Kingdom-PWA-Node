// =============================================================================
// tlc-course-strands — the FOUR-STRAND course design spine (binding for the whole
// TLC curriculum)
// =============================================================================
// Declared by Darrell 2026-06-29. Every TLC training course braids FOUR strands, with
// YAHWEH'S PERSPECTIVE + WILL as the explicit CENTRE the other three serve:
//
//   1. YAHWEH'S PERSPECTIVE + WILL — explicit, Scripture-grounded: His view of and
//      direction for the topic. The anchor. (This is TLC's anchor, not an add-on.)
//   2. CLINICAL skill — the therapy content/technique/context.
//   3. NEUROPLASTICITY + SCIENTIFIC RIGOR — the brain-science / research basis for
//      WHY the technique works (real, cited science).
//   4. SOCIETAL & UNDERSTANDING — cultural context, how it lands for real people,
//      even-handed, with dignity.
//
// The clinical / scientific / societal strands show how Yahweh's perspective is
// LIVED OUT — they do not replace it. Christina (LCSW) approves BOTH clinical
// soundness AND the faith framing per course; doctrine is Darrell / Christina /
// Bishop SME (non-denominational, Word-first). Ties the body-undivided + Father's-
// business anchors.
//
// SOURCING THEOLOGY (Darrell 2026-06-29): all true knowledge is FROM YAHWEH. A human
// teacher cited as a source is a faithful CONDUIT who "sources Him well," never the
// origin or ultimate authority — we credit the person (honesty / integrity /
// copyright) AND name Yahweh as the Source, and we TEST the teaching against His Word
// (so if a source falls short anywhere, the truth still stands because it never
// rested on the person). See SOURCE_THEOLOGY_NOTE.
//
// VERIFICATION (DR-0076): Scripture is cited BY REFERENCE (book chapter:verse); this
// module does NOT hard-code translation wording — the exact translation text is set
// from the chosen edition on SME review, so nothing fabricates a verse. Science cites
// real, named findings. Each Yahweh strand carries `smeDoctrine` (Bishop/Christina
// confirm). Pure data + helpers; no Date.now()/Math.random().
// =============================================================================

// The four strands, in canonical order with Yahweh at the centre.
export const FOUR_STRANDS = [
  { key: 'yahweh', label: 'Yahweh’s perspective & Will', centre: true, role: 'The anchor and direction — His view of, and will for, the topic, Scripture-grounded.' },
  { key: 'clinical', label: 'Clinical skill', centre: false, role: 'The therapy content, technique, and context.' },
  { key: 'science', label: 'Neuroplasticity & scientific rigor', centre: false, role: 'The brain-science / research basis for why it works — real, cited science.' },
  { key: 'societal', label: 'Societal & understanding', centre: false, role: 'Cultural context and how it lands for real people — even-handed, with dignity.' },
];

export const STRAND_SPINE_NOTE =
  'Every TLC course braids four strands with Yahweh’s perspective and Will at the centre. The clinical, scientific, and societal strands show how His design is lived out — they do not replace it. Christina (LCSW) approves both the clinical soundness and the faith framing; doctrine is Darrell / Christina / Bishop (non-denominational, Word-first).';

export const SOURCE_THEOLOGY_NOTE =
  'All true knowledge is from Yahweh. A teacher we cite is a faithful conduit who sources Him well — credited for honesty and integrity, but never elevated above the Word. We test every teaching against His Word, so the truth stands on Him, not on a person.';

// ---------------------------------------------------------------------------
// COURSE_STRANDS — the authored four-strand braid for each library course, keyed by
// course id. The new "Desire, Connection & Covenant" course carries its strands
// inline on the course object; the rest are here. Every Yahweh strand cites Scripture
// by reference (no fabricated wording) and flags SME doctrine confirmation.
// ---------------------------------------------------------------------------
const DOCTRINE = 'Doctrine confirmed by Darrell / Christina / Bishop (non-denominational, Word-first). Scripture cited by reference; wording set from the chosen translation on review.';
const y = (principle, anchors) => ({ principle, anchors, smeDoctrine: DOCTRINE });

export const COURSE_STRANDS = {
  // --- Assessment & diagnosis ---
  'tl-assessment-and-diagnosis-biopsychosocial-assessment-the-whole-person': {
    yahweh: y('Yahweh made and knows the WHOLE person — spirit, soul, and body — and knows our frame; an assessment that honors that wholeness reflects how He sees us.', ['1 Thessalonians 5:23', 'Psalm 139:1-4', 'Psalm 103:14']),
    clinical: 'Gather the biological, psychological, and social domains and integrate them into a working formulation that explains the concern.',
    science: 'The biopsychosocial model (Engel, 1977) and stress physiology (the HPA axis) show the domains are not separate — biology, mind, and environment continuously shape one another.',
    societal: 'Read poverty, racism, housing, and culture as real social-domain factors, not background noise — with dignity, never reduction.',
  },
  'tl-assessment-and-diagnosis-using-the-dsm-5-tr-responsibly': {
    yahweh: y('Every person is made in Yahweh’s image and is named and known by Him; a diagnosis may describe a pattern, but it never defines the image-bearer.', ['Genesis 1:27', 'Isaiah 43:1', 'Psalm 139:14']),
    clinical: 'Use differential thinking; hold a diagnosis as provisional, reasoned, and documented — a shared language, not a verdict.',
    science: 'Diagnostic categories have measurable reliability and validity limits; reification (treating a label as a thing) and cultural variation in expression are documented risks.',
    societal: 'Avoid pathologizing a normal, culturally-shaped response to real hardship or oppression — a known harm for underserved clients.',
  },
  'tl-assessment-and-diagnosis-standardized-screening-tools-in-practice': {
    yahweh: y('Yahweh loves an honest measure and faithfulness in small things — we measure rightly and never deceive with a number.', ['Proverbs 11:1', 'Luke 16:10']),
    clinical: 'Validated screeners support — never replace — clinical judgment; they enable measurement-based care.',
    science: 'Psychometrics: instruments like the PHQ-9 and GAD-7 carry published sensitivity, specificity, and reliable change scores that quantify progress.',
    societal: 'A tool must be valid across populations; watch for measurement bias across language and culture before trusting a cut-off.',
  },
  // --- Treatment planning ---
  'tl-treatment-planning-goals-that-are-real-collaborative-measurable-plans': {
    yahweh: y('Yahweh’s plans give a future and a hope; we set goals in humility — a person plans the way, but the Lord directs the steps, "if the Lord wills."', ['Jeremiah 29:11', 'Proverbs 16:9', 'James 4:13-15']),
    clinical: 'Build the plan WITH the client: meaningful goals, measurable objectives, named interventions.',
    science: 'Goal-setting theory (Locke & Latham) and self-determination theory show specific, autonomy-supported goals drive motivation and follow-through.',
    societal: 'Goals must fit the client’s family, faith, and community — values imposed by the clinician quietly fail.',
  },
  'tl-treatment-planning-evidence-based-practice-and-matching-the-method': {
    yahweh: y('Test everything and hold fast what is good; in an abundance of counselors there is wisdom — discernment over fashion.', ['1 Thessalonians 5:21', 'Proverbs 11:14']),
    clinical: 'Evidence-based practice integrates research, clinical expertise, and the client’s values — not a manual applied blindly.',
    science: 'The three-legged APA definition, effect sizes, and common-factors research ground what "works" beyond any single brand of therapy.',
    societal: 'The evidence base often under-samples marginalized groups; adapt with humility rather than assume universal fit.',
  },
  'tl-treatment-planning-measuring-progress-and-knowing-when-to-adjust': {
    yahweh: y('Examine and test the work; a faithful steward reviews the trust given and is willing to change course.', ['2 Corinthians 13:5', 'Lamentations 3:40', '1 Corinthians 4:2']),
    clinical: 'Feedback-informed care: check whether therapy is helping and adjust on non-response.',
    science: 'Routine outcome monitoring (Lambert and colleagues) and deterioration alerts measurably improve outcomes by catching non-response early.',
    societal: 'Honor the client’s own report of what is and isn’t working, across differing cultural expressions of distress.',
  },
  // --- Individual therapy ---
  'tl-individual-therapy-the-therapeutic-alliance-the-engine-of-change': {
    yahweh: y('Love is the method Yahweh gave — bear one another’s burdens, and love that is patient and kind; the helping relationship reflects His care.', ['John 13:34-35', 'Galatians 6:2', '1 Corinthians 13:4-7']),
    clinical: 'Build bond, agreement on goals, and agreement on tasks; notice and repair ruptures.',
    science: 'The alliance–outcome correlation (Horvath; Wampold’s common-factors research) makes the relationship one of the most robust predictors of outcome.',
    societal: 'Forming an alliance across difference takes cultural humility and earned trust.',
  },
  'tl-individual-therapy-core-counseling-microskills': {
    yahweh: y('Be quick to listen and slow to speak; a word fitly spoken is precious — listen before you answer.', ['James 1:19', 'Proverbs 25:11', 'Proverbs 18:13']),
    clinical: 'Reflective listening, open questions, summarizing, and unhurried silence carry every modality.',
    science: 'Empathy and accurate reflection have measurable effects on outcome; attunement and Rogers’ facilitative conditions are supported by research.',
    societal: 'Listen in a way that honors the client’s own idiom and worldview, not the clinician’s default.',
  },
  'tl-individual-therapy-a-survey-of-evidence-based-modalities-awareness-level': {
    yahweh: y('Be transformed by the renewing of the mind and take every thought captive — the cognitive work echoes His call, held under Him.', ['Romans 12:2', '2 Corinthians 10:5', 'Philippians 4:8']),
    clinical: 'Awareness-level CBT, DBT, ACT, and MI — shared vocabulary; practicing any modality requires its own training.',
    science: 'Each modality has an evidence base and a named mechanism (cognitive restructuring, emotion regulation, psychological flexibility, evoking change talk).',
    societal: 'Match the approach to the person and context, not to fashion.',
  },
  // --- Couples & family (the new "Desire, Connection & Covenant" course carries strands inline) ---
  'tl-couples-and-family-systems-thinking-seeing-the-whole-family': {
    yahweh: y('We are members of one body — when one part suffers, all suffer; a family is a whole, and two are better than one.', ['1 Corinthians 12:26', 'Ecclesiastes 4:9-12']),
    clinical: 'Widen the lens from the "identified patient" to the relational pattern; join without taking sides (multidirected partiality).',
    science: 'Family-systems theory (Bowen), circular causality, and co-regulation describe how a change in one part shifts the whole system.',
    societal: 'Respect family roles shaped by culture and faith; surface the pattern without imposing the clinician’s norms.',
  },
  'tl-couples-and-family-communication-and-conflict-in-relationships': {
    yahweh: y('Be angry without sinning, let no corrupting talk come out, and a soft answer turns away wrath — His way of handling conflict.', ['Ephesians 4:26-29', 'Proverbs 15:1', 'James 1:19']),
    clinical: 'Make the corrosive patterns visible, slow them down, and coach the antidote and the repair.',
    science: 'Gottman’s predictive research, physiological flooding, and the role of repair attempts ground what raises or lowers relationship risk.',
    societal: 'Conflict norms vary by culture and family; coach repair without judgment.',
  },
  // --- Group ---
  'tl-group-how-groups-heal-therapeutic-factors': {
    yahweh: y('Where two or three gather He is present; bear one another’s burdens and stir one another to love — the group reflects the body.', ['Matthew 18:20', 'Galatians 6:2', 'Hebrews 10:24-25']),
    clinical: 'Cultivate the therapeutic factors (universality, hope, altruism); manage process and protect safety.',
    science: 'Yalom’s therapeutic factors and the group-cohesion–outcome literature explain how a group heals.',
    societal: 'Attend to who feels safe to speak and whose norms are assumed in the room.',
  },
  'tl-group-running-psychoeducational-and-support-groups': {
    yahweh: y('Let all things be done decently and in order, and encourage one another — structure that serves people.', ['1 Corinthians 14:40', '1 Thessalonians 5:11']),
    clinical: 'A reliable open, a clear middle, and an intentional close; a plan for common challenges.',
    science: 'Group-development stages (Tuckman) and the effect of clear norms and structure on group function.',
    societal: 'Facilitate inclusively across difference so every member is reached.',
  },
  // --- Crisis & risk ---
  'tl-crisis-and-risk-suicide-risk-assessment-and-safety-planning-foundations': {
    yahweh: y('Yahweh is near the brokenhearted and calls us to choose life; we are our brother’s keeper.', ['Psalm 34:18', 'Deuteronomy 30:19', 'Genesis 4:9']),
    clinical: 'Ask directly, build a collaborative safety plan, and route acute risk to real human help now.',
    science: 'Evidence shows asking about suicide does NOT increase risk; the Safety Planning Intervention (Stanley & Brown) and means-safety reduce attempts.',
    societal: 'Stigma and disparities shape risk and help-seeking; meet the person with compassion, not alarm.',
  },
  'tl-crisis-and-risk-de-escalation-and-crisis-response': {
    yahweh: y('A gentle answer turns away wrath; blessed are the peacemakers; bear with one another — a calm, peace-making presence.', ['Proverbs 15:1', 'Matthew 5:9', 'Colossians 3:13']),
    clinical: 'The helper’s own calm is the first tool; verbal de-escalation and offering choices restore control.',
    science: 'Co-regulation and the autonomic nervous system (Porges’ polyvagal work) explain how a calm presence down-regulates another’s threat response.',
    societal: 'De-escalate in a way that protects dignity and avoids escalation bias.',
  },
  // --- Ethics & boundaries ---
  'tl-ethics-and-boundaries-professional-ethics-and-codes-of-conduct': {
    yahweh: y('Walk in integrity, let your yes be yes, and do justice and love mercy — the heart beneath any code.', ['Proverbs 10:9', 'Matthew 5:37', 'Micah 6:8']),
    clinical: 'Know the binding code and work dilemmas through a documented decision model.',
    science: 'Models of moral reasoning and structured decision-making under conflicting duties.',
    societal: 'Ethics in service of dignity and justice, especially for the underserved.',
  },
  'tl-ethics-and-boundaries-boundaries-dual-relationships-and-self-disclosure': {
    yahweh: y('Love does no harm to a neighbor; abstain from the appearance of evil; be faithful with what is entrusted — boundaries that protect.', ['Romans 13:10', '1 Thessalonians 5:22', 'Luke 16:10']),
    clinical: 'Hold boundaries, manage dual relationships, and disclose only for the client’s good.',
    science: 'The power differential, transference, and documented harms of boundary violations.',
    societal: 'Manage unavoidable overlap in small, tight-knit, or faith communities with consent, consultation, and care.',
  },
  // --- Documentation ---
  'tl-documentation-clinical-documentation-that-holds-up': {
    yahweh: y('Be faithful in little, speak truthfully, and steward the record well — honest witness.', ['Luke 16:10', 'Proverbs 12:22', '1 Corinthians 4:2']),
    clinical: 'Standard formats (DAP/SOAP); timely, objective, minimum-necessary notes.',
    science: 'Memory decay argues for timeliness; biased language in records has measurable downstream effects.',
    societal: 'A biased or careless record can follow a client for years — an equity issue.',
  },
  'tl-documentation-hipaa-privacy-and-the-phi-line': {
    yahweh: y('A faithful person keeps a confidence and does not betray a trust; love covers — privacy as care.', ['Proverbs 11:13', 'Proverbs 25:9', '1 Peter 4:8']),
    clinical: 'Know what PHI is, apply minimum-necessary, and hold the bright line that clinical detail never leaks to marketing.',
    science: 'Documented harms of disclosure and re-identification risk justify strict handling.',
    societal: 'Trust is the foundation of help for wary, historically-underserved communities.',
  },
  // --- Cultural humility ---
  'tl-cultural-humility-from-cultural-competence-to-cultural-humility': {
    yahweh: y('Every person is made in His image, honor one another, and Yahweh shows no partiality — humility before the image-bearer.', ['Genesis 1:27', 'Romans 12:10', 'Acts 10:34-35']),
    clinical: 'Treat the client as the expert on their own context; keep self-reflecting and repair ruptures across difference.',
    science: 'Implicit-bias research and the evidence favoring cultural humility over a fixed "competence" checklist.',
    societal: 'Redress the power imbalance — central to serving historically-underserved communities.',
  },
  'tl-cultural-humility-faith-integrated-care-done-ethically': {
    yahweh: y('Give a reason with gentleness and respect, season speech with grace, and do not quarrel over the faith of the weak — follow the client’s lead, never impose.', ['1 Peter 3:15', 'Colossians 4:6', 'Romans 14:1']),
    clinical: 'Faith integration that is client-led, consented, and within competence.',
    science: 'Research on religion/spirituality and health, and spiritually-integrated psychotherapy (Pargament).',
    societal: 'Honor faith as a strength with dignity, never as coercion.',
  },
  // --- Supervision ---
  'tl-supervision-clinical-supervision-getting-the-most-from-it': {
    yahweh: y('Plans succeed with many counselors; iron sharpens iron; the wise receive instruction — humble teachability.', ['Proverbs 15:22', 'Proverbs 27:17', 'Proverbs 9:9']),
    clinical: 'Supervision builds competence and protects clients; bring your real, hard material.',
    science: 'Competency-based supervision and deliberate practice (Ericsson) are how clinical skill is actually built.',
    societal: 'Gatekeeping that protects the public — especially the vulnerable.',
  },
  'tl-supervision-giving-and-receiving-clinical-feedback': {
    yahweh: y('Faithful are the wounds of a friend; speak the truth in love; the one who heeds correction gains understanding.', ['Proverbs 27:6', 'Ephesians 4:15', 'Proverbs 15:31-32']),
    clinical: 'Give specific, behavioral, balanced feedback; receive it with curiosity, not defensiveness.',
    science: 'Feedback-effectiveness research, growth mindset (Dweck), and deliberate-practice loops.',
    societal: 'Feedback that builds rather than shames, across difference.',
  },
};

// ---------------------------------------------------------------------------
// Helpers — pure. Resolve, normalize, and check a course's four-strand braid.
// ---------------------------------------------------------------------------
function normYahweh(yv) {
  if (!yv || typeof yv !== 'object') return null;
  return {
    principle: yv.principle || '',
    anchors: Array.isArray(yv.anchors) ? yv.anchors.filter(Boolean) : [],
    smeDoctrine: yv.smeDoctrine || DOCTRINE,
  };
}

export function normalizeStrands(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    yahweh: normYahweh(raw.yahweh),
    clinical: typeof raw.clinical === 'string' ? raw.clinical : '',
    science: typeof raw.science === 'string' ? raw.science : '',
    societal: typeof raw.societal === 'string' ? raw.societal : '',
  };
}

// The four-strand braid for a course: the inline `strands` win, else the central map.
export function courseStrands(course) {
  if (!course) return null;
  return normalizeStrands(course.strands || COURSE_STRANDS[course.id] || null);
}

// True only when all FOUR strands carry real content (Yahweh strand needs a principle
// AND at least one Scripture anchor). The curriculum gate keys off this.
export function hasFourStrands(course) {
  const s = courseStrands(course);
  if (!s) return false;
  return !!(s.yahweh && s.yahweh.principle && s.yahweh.anchors.length
    && s.clinical && s.science && s.societal);
}

// Roll up strand coverage across a course list — the gate's header numbers.
export function strandsCoverage(courses = []) {
  const list = courses || [];
  const withAll = list.filter((c) => hasFourStrands(c)).length;
  return { total: list.length, withFourStrands: withAll, missing: list.length - withAll };
}
