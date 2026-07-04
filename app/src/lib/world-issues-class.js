// =============================================================================
// world-issues-class — "Thinking It Through: World Issues & Discernment"
// =============================================================================
// A Word-first, SELF-PACED track that takes ONE charged real-world claim at a
// time and teaches the learner HOW to think it through — media literacy + biblical
// discernment — rather than telling them WHAT to conclude. It rides the SAME
// shared Learn engine as every other PoeTech / COLG course (church-classes.js
// generic helpers, learn-framework.js schema + age-adaptive branching + quiz, the
// self-driving tutor), through the reusable per-issue engine in
// lib/discernment-track.js: each "issue" is authored structured data, and
// buildDiscernmentModule() projects it into the standard Learn module shape so it
// renders today with no fork. Like "Living Lessons," it is self-paced (meta.unit
// renders rows as "Issue(s)", no cohort clock).
//
// WHY THIS EXISTS (COMMUNITY-FIRST-MISSION + QUALITY-OF-LIFE):
//   A divisive world floods believers — and kids — with charged videos and posts
//   engineered for outrage. The skill of slowing down, checking sources, hearing
//   every side fairly, and weighing it in the light of Scripture (truth AND grace)
//   is a quality-of-life skill and a discipleship skill. This track teaches it
//   with REAL issues, handled evenhandedly, so the learner walks out with the
//   transferable skill — not a verdict handed to them.
//
// BINDING SAFEGUARDS (machine-checked by discernment-track.js → auditIssue; the
// test world-issues-class.test.js asserts every published issue passes the gate):
//   • Claims are LABELED (allegation / claim / opinion / call-to-action) and
//     ATTRIBUTED to their source — never asserted as a settled verdict.
//   • Every documented fact carries a real source WITH an as-of date (verified,
//     not from memory — DR-0076).
//   • >= 2 perspectives, each STEELMANNED (evenhandedness).
//   • NO platform-published one-sided persuasion against a named real public
//     figure: a call-to-action (e.g. a boycott) is carried ONLY as the creator's
//     labeled position; the lesson's own voice issues no directive to boycott or
//     condemn the person; a grace-note (no condemnation) is required.
//   • Age-appropriate child rendering, screened (kids use the app).
//
// VERIFICATION NOTE (DR-0076): the worked example's documented anchors (the xAI
// Memphis air permit, the Owen Diaz jury verdict, Grok's 2025 outputs, Musk's
// SB 1047 support) were independently re-verified by live web search on
// 2026-06-25 against the cited outlets. Fast-moving 2026 litigation status is
// labeled honestly (filed/alleged vs adjudicated). Sources are cited with as-of
// dates so a learner can check them — that IS the lesson.
// =============================================================================

import {
  buildDiscernmentSchedule, buildDiscernmentModules,
  discernmentProgressSummary, auditAllIssues,
} from './discernment-track.js';
import {
  exportCurriculumMarkdownFor, resolveCohortGeneric,
} from './church-classes.js';

// Self-paced: no cohort, no weekly schedule (mirrors Living Lessons).
export const WORLD_ISSUES_PROPOSED_COHORT_START = null;
export const WORLD_ISSUES_CONFIRMED_COHORT = { startDate: null, confirmed: false };

export const WORLD_ISSUES_META = {
  key: 'world-issues',
  title: 'Thinking It Through: World Issues & Discernment',
  audience: 'the whole family and the whole Body — believers navigating a noisy, divisive world, at every age',
  tagline: 'Don’t be told what to think. Learn how to think it through.',
  format: 'Self-paced · one issue at a time · media literacy + biblical discernment · paced to your age',
  cadenceDays: 7,
  weeks: 1, // one published issue today; the track grows as issues are added
  handsOnLabel: 'Practice the skill',
  unit: {
    noun: 'issue',
    nounPlural: 'issues',
    cap: 'Issue',
    selfPaced: true,
    sessionLabel: 'How to lead it (family or small group)',
    countNoun: 'issue',
  },
  footer: '_Built on PoeTech · The Church of the Living God + the Poe family. This track teaches DISCERNMENT, never a verdict on a person. Word-first, evenhanded, and grace-centered — we check sources, hear every side fairly, and hold truth AND grace, for every age._',
};

// A gentle rhythm mirroring the five discernment stages.
export const WORLD_ISSUES_SESSION_FLOW = [
  { minutes: 5, name: 'The claim — read it as made, name its label' },
  { minutes: 10, name: 'Verify — documented fact vs interpretation; check a source' },
  { minutes: 10, name: 'Perspectives — steelman every side' },
  { minutes: 10, name: 'The believer’s lens — truth AND grace' },
  { minutes: 5, name: 'Reflect + the skill you carry out the door' },
];
export const WORLD_ISSUES_SESSION_MINUTES = WORLD_ISSUES_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0);

// =============================================================================
// FIRST WORKED EXAMPLE — a creator's video critiquing Elon Musk.
// Handled evenhandedly + source-checked: the video is treated as ONE creator's
// argument (sourced, labeled), not as truth to repeat. Documented pieces are
// separated from interpretive ones; the boycott "call to action" is carried as
// the creator's position alongside other views, never as the lesson's directive.
// =============================================================================
const MUSK_ISSUE = {
  id: 'wi-musk-creator-critique',
  title: 'A Creator’s Video Critiquing Elon Musk — How To Think It Through',
  subject: { name: 'Elon Musk', kind: 'public-figure', isNamedRealPerson: true },
  skill: 'Take one charged, viral critique of a powerful person and learn the discernment moves: identify and label each claim, separate documented fact from interpretation, steelman every side, and weigh it in the light of Scripture — truth AND grace, no verdict on a soul.',
  source: {
    creator: 'DAT BOY WILL',
    medium: 'video',
    title: 'a video critique of Elon Musk',
    url: 'https://www.youtube.com/channel/UCRI8dwsKhiN9wZwcWUju6Gg',
    asOf: '2026-06-25',
    note: 'A culture/commentary YouTube creator. We examine this as ONE creator’s argument — sourced and labeled — not as truth to repeat. Confirm the specific video before naming it; the lesson holds regardless of which creator made it.',
  },

  // ---- STAGE 1 — THE CLAIM(S): the creator's points, AS MADE, each labeled. ----
  claims: [
    {
      id: 'c-discrimination',
      text: 'Elon Musk and his companies have a pattern of racism and discrimination against Black people.',
      label: 'allegation',
      attribution: 'DAT BOY WILL (the creator), in his video',
      note: 'A serious assertion against a person/company. Some related matters have court findings; others are unproven lawsuits; the broad characterization of a "pattern" is the creator’s framing.',
    },
    {
      id: 'c-ai-regulation',
      text: 'xAI (Musk’s AI company) opposes AI anti-discrimination regulation.',
      label: 'claim',
      attribution: 'DAT BOY WILL (the creator), in his video',
      note: 'A checkable factual claim about legal/regulatory positions — testable against filings and statements.',
    },
    {
      id: 'c-memphis',
      text: 'Musk’s xAI data center in Memphis is polluting a Black neighborhood through gas turbines.',
      label: 'claim',
      attribution: 'DAT BOY WILL (the creator), in his video',
      note: 'Much of this is documented (the permit, the location, the appeals); the degree of harm and whether it is "illegal" is contested in active litigation.',
    },
    {
      id: 'c-race-science',
      text: 'Musk and his AI (Grok) amplify "race science."',
      label: 'allegation',
      attribution: 'DAT BOY WILL (the creator), in his video',
      note: 'Specific Grok outputs in 2025 are documented; "amplifies race science" as a standing property is the creator’s interpretation.',
    },
    {
      id: 'c-bee',
      text: 'Musk’s opposition to South Africa’s Black Economic Empowerment (BEE) laws is racist.',
      label: 'opinion',
      attribution: 'DAT BOY WILL (the creator), in his video',
      note: 'That Musk criticized BEE is documented; whether that criticism is "racist" is a value judgment, and BEE itself is a genuinely two-sided policy debate.',
    },
    {
      id: 'c-boycott',
      text: 'People should boycott Tesla.',
      label: 'call-to-action',
      attribution: 'DAT BOY WILL (the creator), in his video',
      note: 'A request to DO something — the creator’s position. We present it alongside other responses (protest, build alternatives, pray, do nothing); the lesson itself issues no boycott directive.',
    },
  ],

  // ---- STAGE 2 — VERIFIABLE vs INTERPRETATION ----
  verifiable: [
    {
      id: 'f-memphis-permit',
      statement: 'On July 2, 2025, the Shelby County (TN) Health Department granted xAI an air permit for 15 gas turbines at its South Memphis "Colossus" data center, after 1,700+ public comments; the NAACP and the Southern Environmental Law Center (SELC) appealed, arguing earlier turbines ran without proper permits.',
      status: 'documented',
      sources: [
        { title: 'Health dept. grants permit for xAI turbines', publisher: 'Action News 5 (WMC Memphis)', url: 'https://www.actionnews5.com/2025/07/02/health-dept-grants-permit-xai-turbines/', asOf: '2025-07-02' },
        { title: 'Groups appeal permit for xAI’s South Memphis data center', publisher: 'Southern Environmental Law Center', url: 'https://www.selc.org/press-release/groups-appeal-permit-for-xais-south-memphis-data-center-decisions-around-unpermitted-methane-gas-turbines/', asOf: '2025-07-16' },
      ],
      note: 'Re-verified by live web search on 2026-06-25. The permit, date, turbine count, and the NAACP/SELC appeal are documented.',
    },
    {
      id: 'f-boxtown',
      statement: 'The data center sits near Boxtown, a historically Black neighborhood of South Memphis founded by formerly enslaved people, long identified as an environmental-justice community surrounded by heavy industry.',
      status: 'partly-documented',
      sources: [
        { title: 'In South Memphis, Elon Musk’s Colossus Operated Gas Turbines Without Appropriate Permits, Residents and Activists Claim', publisher: 'Inside Climate News', url: 'https://insideclimatenews.org/news/17072025/elon-musk-xai-data-center-gas-turbines-memphis/', asOf: '2025-07-17' },
      ],
      note: 'The neighborhood’s history and environmental-justice context are documented; specific demographic percentages are widely reported but treated here as "reported," not independently confirmed.',
    },
    {
      id: 'f-diaz',
      statement: 'In 2021 a federal jury found Tesla liable for racial harassment of Owen Diaz, a Black former Fremont-factory worker, awarding $137M (later reduced; a 2023 retrial awarded ~$3.2M; the parties settled in 2024). This is a court FINDING of liability, not merely an allegation.',
      status: 'documented',
      sources: [
        { title: 'Tesla’s $137 million fine for racism is reduced', publisher: 'Fortune', url: 'https://fortune.com/2023/04/03/tesla-lawsuit-racism-award-reduced/', asOf: '2023-04-03' },
        { title: 'Tesla settles racial discrimination lawsuit with Owen Diaz', publisher: 'TechTimes', url: 'https://www.techtimes.com/articles/302631/20240315/tesla-settles-racial-discrimination-lawsuit-black-employee-owen-diaz-after-two-trials.htm', asOf: '2024-03-15' },
      ],
      note: 'Re-verified 2026-06-25. The case is against Tesla, Inc. (corporate), not Musk personally.',
    },
    {
      id: 'f-pending-suits',
      statement: 'Separately, California’s Civil Rights Department (filed Feb 2022) and the federal EEOC (filed Sept 2023) brought suits ALLEGING a racially hostile environment for Black workers at Tesla’s Fremont plant. Tesla denies wrongdoing; these are unadjudicated allegations, not verdicts.',
      status: 'partly-documented',
      sources: [
        { title: 'DFEH Sues Tesla, Inc. for Race Discrimination and Harassment', publisher: 'California Civil Rights Department', url: 'https://calcivilrights.ca.gov/2022/02/10/dfeh-sues-tesla-inc-for-race-discrimination-and-harassment/', asOf: '2022-02-10' },
        { title: 'EEOC Sues Tesla for Racial Harassment and Retaliation', publisher: 'U.S. EEOC', url: 'https://www.eeoc.gov/newsroom/eeoc-sues-tesla-racial-harassment-and-retaliation', asOf: '2023-09-28' },
      ],
      note: 'The FILINGS are documented; the underlying claims are allegations the courts have not resolved. This is the allegation-vs-verdict distinction the lesson teaches.',
    },
    {
      id: 'f-grok',
      statement: 'In 2025, xAI’s chatbot Grok produced racist/extremist outputs on two occasions — unsolicited "white genocide"/South Africa replies (May) and antisemitic content calling itself "MechaHitler" (July). xAI said both came from unauthorized/erroneous changes, took action, and apologized.',
      status: 'documented',
      sources: [
        { title: 'xAI blames Grok’s obsession with white genocide on an ‘unauthorized modification’', publisher: 'TechCrunch', url: 'https://techcrunch.com/2025/05/15/xai-blames-groks-obsession-with-white-genocide-on-an-unauthorized-modification/', asOf: '2025-05-15' },
        { title: 'xAI issues lengthy apology for violent and antisemitic Grok posts', publisher: 'CNN', url: 'https://www.cnn.com/2025/07/12/tech/xai-apology-antisemitic-grok-social-media-posts', asOf: '2025-07-12' },
      ],
      note: 'The OUTPUTS and the apology are documented; xAI’s stated CAUSE is the company’s claim, not an independently verified root cause.',
    },
    {
      id: 'f-sb1047',
      statement: 'On the question of AI regulation, the record is mixed by TYPE: Musk publicly SUPPORTED California’s SB 1047 AI-SAFETY bill in August 2024 (against most of the industry), while xAI later OPPOSED (and sued over) a state AI ANTI-DISCRIMINATION/bias law, framing its objection as free speech.',
      status: 'partly-documented',
      sources: [
        { title: 'Elon Musk unexpectedly offers support for California’s AI bill', publisher: 'TechCrunch', url: 'https://techcrunch.com/2024/08/26/elon-musk-unexpectedly-offers-support-for-californias-ai-bill/', asOf: '2024-08-26' },
        { title: 'Elon Musk on X: “California should probably pass the SB 1047 AI safety bill”', publisher: 'X (Elon Musk)', url: 'https://x.com/elonmusk/status/1828205685386936567', asOf: '2024-08-26' },
      ],
      note: 'The SB 1047 support is documented (re-verified 2026-06-25, his own post). The opposition to a bias law is reported in 2026 coverage; the FACT of the opposition is well-attested, but its MOTIVE (free speech vs. otherwise) is contested — do not conflate "for/against regulation" without naming WHICH regulation.',
    },
    {
      id: 'f-bee',
      statement: 'Musk (South-African-born) has publicly criticized South Africa’s race-based Black Economic Empowerment (BEE) ownership rules and tied Starlink’s lack of a license to them. It is documented that he said this, and that Starlink is unlicensed because SpaceX has not met ownership rules that apply to all telecom licensees; the accuracy of his sharper claims (e.g. "142 racist laws") is disputed by South African fact-checkers.',
      status: 'disputed',
      sources: [
        { title: 'Elon Musk again slams South Africa’s B-BBEE policies as Starlink licence stalls', publisher: 'IOL (South Africa)', url: 'https://iol.co.za/news/south-africa/2026-04-14-elon-musk-again-slams-south-africas-b-bbee-policies-as-starlink-licence-stalls/', asOf: '2026-04-14' },
        { title: 'South Africa does not have 142 racist laws — here’s what the claim gets wrong', publisher: 'News24', url: 'https://www.news24.com/southafrica/debunking/south-africa-does-not-have-142-racist-laws-heres-what-the-claim-gets-wrong-20250522-1237', asOf: '2025-05-22' },
      ],
      note: 'That he criticized BEE is documented; whether BEE is good policy, and whether his framing is fair, is a genuinely two-sided debate (see Perspectives).',
    },
    {
      id: 'f-takedown',
      statement: 'A real, decentralized "Tesla Takedown" movement held largely peaceful protests in early 2025 urging people to sell Teslas in opposition to Musk’s government role. A SEPARATE wave of vandalism/arson against Tesla property drew federal charges and an official "domestic terrorism" label — a characterization whose legal correctness is contested.',
      status: 'documented',
      sources: [
        { title: '“Tesla Takedown” campaign erupts for its biggest protest weekend yet', publisher: 'NPR', url: 'https://www.npr.org/2025/03/29/nx-s1-5343986/anti-musk-protests-planned-worldwide', asOf: '2025-03-29' },
        { title: '3 people face federal charges for Tesla attacks. Are such acts domestic terrorism?', publisher: 'NPR', url: 'https://www.npr.org/2025/03/20/nx-s1-5333315/tesla-attacks-ag-bondi-domestic-terrorism-trump-musk', asOf: '2025-03-20' },
      ],
      note: 'Conflating the peaceful protest movement with the separate criminal vandalism is itself a media-literacy trap the lesson flags.',
    },
  ],
  interpretation: [
    {
      id: 'n-pattern',
      statement: 'Concluding "Elon Musk is a racist" is an interpretation about a person’s heart and intent — not a documented fact. Documented harms, allegations, and a person’s inner motive are three different things.',
      restsOn: ['f-diaz', 'f-pending-suits', 'f-grok'],
    },
    {
      id: 'n-bias-law',
      statement: 'Reading xAI’s opposition to a bias-regulation law as "xAI endorses discrimination" is an interpretation; the company frames it as a free-speech objection. The fact (it opposed the law) and the motive (why) are separate.',
      restsOn: ['f-sb1047'],
    },
    {
      id: 'n-race-science',
      statement: '"Grok amplifies race science" as a blanket property is an interpretation. What is documented is specific 2025 outputs and the company’s response — not an established inherent design goal.',
      restsOn: ['f-grok'],
    },
    {
      id: 'n-bee-failed',
      statement: 'Saying "BEE has failed" (or "criticizing BEE is racist") is a contested value judgment. The policy has serious defenders and serious critics across South African society, including among Black South Africans.',
      restsOn: ['f-bee'],
    },
    {
      id: 'n-illegal-plant',
      statement: 'Calling the Memphis turbines "an illegal power plant" is the plaintiffs’ contested legal characterization in active litigation — an argument a court has not finally settled, not an established fact.',
      restsOn: ['f-memphis-permit'],
    },
  ],

  // ---- STAGE 3 — PERSPECTIVES (each steelmanned) ----
  perspectives: [
    {
      id: 'p-critics',
      label: 'The creator’s / critics’ view',
      heldBy: 'DAT BOY WILL and many critics',
      steelman: 'At its strongest: there is a documented jury finding of racial harassment at Tesla, additional government lawsuits alleging more, real racist outputs from Grok, a polluting facility sited beside a historically Black neighborhood, and opposition to a civil-rights bias law. Even if no single item proves intent, the pattern is serious, it lands on Black communities, and a powerful man should be held accountable — silence can look like consent.',
    },
    {
      id: 'p-defenders',
      label: 'Musk’s / defenders’ view',
      heldBy: 'Musk, xAI/Tesla, and defenders',
      steelman: 'At its strongest: lawsuits are allegations, not verdicts; the one finding (Diaz) was sharply reduced and settled; the Grok outputs were errors the company corrected and apologized for; the data center followed a public permit process and brings jobs and energy; the bias-law objection is about free speech and government overreach, not a wish to discriminate; and criticizing BEE is a mainstream policy position held by many South Africans of every race. Judging a person’s heart from contested headlines is unfair.',
    },
    {
      id: 'p-community',
      label: 'The environmental-justice / community view',
      heldBy: 'Boxtown neighbors and EJ advocates',
      steelman: 'At its strongest: regardless of anyone’s intent, a historically Black, already over-burdened neighborhood is bearing real pollution risk and deserves protection, clean air, and a genuine voice in decisions made about its own backyard. The harm to real people matters even if motive can never be proven.',
    },
    {
      id: 'p-measured',
      label: 'The careful / due-process view',
      heldBy: 'people committed to fair process',
      steelman: 'At its strongest: truth is served by keeping categories straight — a jury FINDING is not the same as an unproven SUIT, a documented OUTPUT is not the same as a stated INTENT, and a peaceful PROTEST is not the same as criminal VANDALISM. Outrage that blurs these lines distorts reality and can wrong an innocent person; careful people insist on the distinctions before they judge.',
    },
  ],

  // ---- STAGE 4 — THE BELIEVER'S LENS (4D framework + truth-and-grace) ----
  lens: {
    fourD: {
      deepSource: 'Scripture refuses to let us pick only one half of God’s heart. He hates injustice and partiality, defends the poor, the oppressed, and the foreigner, and commands honest scales and a true witness — "do justice, love kindness, walk humbly" (Micah 6:8); "open your mouth for the mute... defend the rights of the poor and needy" (Proverbs 31:8-9). And in the SAME breath He forbids false witness, crowd-following, and partiality even toward the poor in a dispute — "you shall not fall in with the many to do evil... nor be partial to a poor man in his lawsuit" (Exodus 23:2-3); "in righteousness shall you judge your neighbor" (Leviticus 19:15). He warns the one who judges to first take the log out of his own eye (Matthew 7:1-5), and to speak "the truth in love" (Ephesians 4:15). So the believer engages injustice head-on AND refuses to dehumanize — because every person, including the powerful and including the ones we are angry at, bears the image of God.',
      scripture: 'Micah 6:8; Proverbs 18:17; Proverbs 31:8-9; Leviticus 19:15-16; Exodus 23:2-3; Isaiah 1:17; James 2:1-9; Matthew 7:1-5; Ephesians 4:15',
    },
    threeD: 'Practically: care about the real people in the story — the Boxtown neighbors breathing the air, the workers in the lawsuits — without letting a creator’s outrage (or a defender’s dismissal) do your thinking for you. You can name a documented wrong AND refuse to declare a verdict on a person’s soul. Check before you believe or share. Hold the categories straight. And remember that being stirred up is not the same as being informed, and is not the same as doing good.',
    benefits: [
      'Freedom from being manipulated by outrage media — in either direction (the attack OR the dismissal).',
      'Peace in a divisive world: you can engage hard things without your heart being eaten by anger.',
      'A repeatable skill: identify the claim, label it, check the primary source, hear the other side at its strongest.',
      'The ability to hold truth AND grace — to care about justice without condemning a person.',
      'Wiser stewardship of your attention, your words, and your dollars — spent on building, not just reacting.',
    ],
    graceNote: 'This lesson does NOT condemn Elon Musk, or anyone. He is a person made in the image of God, accountable to God exactly as every one of us is. We can examine claims, care deeply about justice, and protect the vulnerable WITHOUT pronouncing a verdict on a human soul — that judgment belongs to God alone (Romans 14:4; James 4:12). Truth and grace are not rivals; they meet in Jesus.',
    stewardship: 'There is a deeper response to feeling wronged by the powerful than outrage or even boycott: BUILD. The biblical pattern of empowerment — honest work, ownership, generosity, and community strength — turns grievance into stewardship. The Black church has long been an economic powerhouse and a refuge; the most durable answer to "they don’t serve us" is often to build what serves us, steward our attention and dollars toward what lifts the community, and create sovereign tools and businesses of our own (this very platform is one small example). Righteous engagement can include protest and accountability — and it is completed by building.',
    anchor: {
      ref: 'Proverbs 18:17',
      theme: 'The one who states his case first seems right — until the other comes and examines him. The whole skill of discernment, in one verse: never let the first, loudest voice be the last word.',
    },
  },

  // ---- STAGE 5 — REFLECTION + SKILL ----
  reflection: {
    skill: 'When a charged video or post stirs you up: PAUSE. Name the claim and who is making it. Label it — fact, allegation, opinion, or call-to-action. Find the primary source yourself. State the other side at its strongest. Then weigh it with truth AND grace, and choose a righteous response over a reflexive one. Outrage is cheap and someone else profits from it; discernment costs you a few minutes and sets you free.',
    practice: 'Take ONE claim from any video or post that made you angry this week. Find the primary source yourself. Write one sentence on what is documented vs. what is interpretation — then one sentence on a righteous, non-outrage response you could actually take (something that builds, protects, or blesses).',
    prompts: [
      'Which of the creator’s points were documented facts, and which were his interpretation? How could you check each one?',
      'Can you state Musk’s (or his defenders’) strongest case fairly, even though it is not the popular thing to do? Why is that a discipline worth practicing?',
      'A jury FOUND Tesla liable in one case; other suits are unproven ALLEGATIONS. Why does keeping that distinction matter for telling the truth?',
      'How do you hold both at once: caring about the Boxtown neighbors’ clean air AND refusing to condemn a person’s heart?',
      'The creator calls for a Tesla boycott; others protest, others build alternatives, others pray. What is the difference between outrage and righteous engagement — and what would faithful stewardship of your attention and money look like for you?',
    ],
  },

  // ---- Age-appropriate renderings (kids use the app) ----
  levels: {
    child: 'Sometimes a video online says something big about a famous person. Before you believe it or repeat it, be a good detective: ask WHO said it, ask whether it really happened or whether it is just their opinion, and listen to the OTHER side of the story too. The Bible says the first story can sound completely right — until someone checks it (Proverbs 18:17). Be fair to everyone, even people you do not like, and remember that God made every single person and loves them. Being a good detective and being kind go together.',
    teen: 'Real talk: the internet runs on making you angry, because angry people click and share. So when a video goes hard at a famous person — say, a creator critiquing Elon Musk — slow down and run the moves. (1) What is the actual claim, and who is making it? (2) Is it a documented fact, a not-yet-proven allegation, an opinion, or a "you should do X"? They are not the same: a jury actually found Tesla liable in one racism case, but other lawsuits are still just accusations, and "Musk is a racist" is a conclusion about his heart that no headline can prove. (3) Find the real source. (4) Can you say the other side’s best argument fairly? That is the skill that makes you hard to manipulate. The Bible is big on this: care about justice AND tell the truth, defend people who are being hurt AND don’t bear false witness, and don’t just "go with the crowd to do evil" (Exodus 23:2). You can be furious about real injustice and still refuse to condemn a person’s soul — that is God’s call, not yours. And the strongest response to feeling wronged by the powerful is often to BUILD something better, not just to rage.',
    senior: 'For the seasoned believer, this lesson is about stewarding judgment in a media age engineered for outrage. Keep the categories the law itself keeps: an ALLEGATION (a filed suit) is not a FINDING (a jury verdict) is not a SETTLEMENT (which resolves a case without an admission). In the Tesla matter, the Owen Diaz case produced an actual jury finding of liability (later reduced and settled), while the California Civil Rights Department and EEOC suits remain unadjudicated allegations — and a company’s stated cause for an incident (as with Grok’s 2025 outputs) is a claim, not an externally proven root cause. On policy, refuse the lazy headline: a person can support one kind of regulation (Musk backed the SB 1047 safety bill) while opposing another (a bias-disclosure law) — naming WHICH regulation is the honest move. Scripture has governed exactly this discipline for millennia: impartial justice that will not favor even the poor in a dispute (Exodus 23:2-3; Leviticus 19:15), a true witness, defense of the oppressed (Isaiah 1:17; Proverbs 31:8-9), and the humility to take the log from one’s own eye first (Matthew 7:1-5). Hold truth and grace together: we may examine the powerful and protect the vulnerable while leaving the verdict on a soul to God (Romans 14:4). And let the response mature past reaction into stewardship — the long tradition of the Black church as builder and refuge points the way: accountability AND construction, protest AND ownership.',
  },

  // ---- Discernment-skill quiz (checks the SKILL, never "is the person guilty") ----
  quiz: {
    questions: [
      {
        q: 'The creator labels something an "allegation." Does that mean it is proven true?',
        options: ['Yes — if someone alleged it, it happened', 'No — an allegation is an assertion that still has to be checked', 'Only if it is in a video'],
        answer: 1,
        explain: 'An allegation is a claim made against someone, not a verdict. The discernment move is to check it against primary sources before believing or sharing it.',
      },
      {
        q: 'A jury FOUND Tesla liable in the Owen Diaz case; the California and EEOC suits were FILED but not decided. What is the difference?',
        options: ['No difference — they are all lawsuits', 'Diaz is a court finding; the others are unproven allegations', 'The unproven ones are more reliable because the government filed them'],
        answer: 1,
        explain: 'A finding is an adjudicated result; a filing is an accusation the court has not resolved. Telling the truth means keeping that distinction.',
      },
      {
        q: 'Which of these is a documented FACT, and which is an INTERPRETATION? (A) "Grok produced racist outputs in 2025." (B) "Grok amplifies race science."',
        options: ['Both are facts', 'Both are interpretations', 'A is documented; B is an interpretation drawn from it'],
        answer: 2,
        explain: 'Specific 2025 outputs are documented; "amplifies race science" as a standing property is an inference. Separating the two is the core skill.',
      },
      {
        q: 'Musk publicly SUPPORTED one AI bill (SB 1047, on safety) and xAI OPPOSED another (a bias-disclosure law). What does that teach about headlines like "Musk is anti-regulation"?',
        options: ['Nothing — it is a contradiction', 'That such headlines oversimplify; the honest question is WHICH regulation', 'That he changes his mind randomly'],
        answer: 1,
        explain: 'Posture can differ by the TYPE of regulation. A discerning reader asks which specific bill, rather than accepting a blanket label.',
      },
      {
        q: 'A video about a powerful person makes you angry. What is the discernment move?',
        options: ['Share it immediately so others know', 'Pause, label each claim, find the primary source, hear the other side, then weigh it with truth and grace', 'Decide the person is guilty and move on'],
        answer: 1,
        explain: 'Outrage is what the algorithm wants; discernment is the disciple’s response — and it ends in a righteous action, not just a stronger feeling.',
      },
    ],
  },
};

// The published set of issues for this track (grows as issues are added).
// =============================================================================
// ISSUE 2 — The boycott of Asian-owned beauty-supply businesses (Darrell
// 2026-07-04). A charged inter-community video calling for a boycott. The
// substance (the documented distribution/ownership barrier) is taught
// constructively in the Kingdom Economics course; HERE it is handled as a
// discernment case: real grievances AND real people on both sides, the boycott
// carried ONLY as the movement's labeled call-to-action (never the lesson's
// voice), the one-new-man frame governing the response — build, don't war on a
// people. Subject is a movement/industry, not a named person.
// =============================================================================
const BEAUTY_SUPPLY_ISSUE = {
  id: 'wi-beauty-supply-boycott',
  title: 'A Video Calling to Boycott Asian-Owned Beauty-Supply Stores — How To Think It Through',
  subject: { name: 'the beauty-supply boycott movement / Asian-owned beauty-supply businesses', kind: 'social-movement', isNamedRealPerson: false },
  skill: 'Take a charged video about tension between two communities and learn the discernment moves: separate a DOCUMENTED barrier from an assumed MOTIVE, refuse collective punishment of a whole group for individuals’ actions, hear every side at its strongest, and weigh a righteous response — build and plead the cause, without warring on a people.',
  source: {
    creator: 'a commentary video on the beauty-supply boycott',
    medium: 'video',
    title: 'a video on the boycott of Asian-owned businesses',
    url: 'https://www.mprnews.org/story/2017/04/25/black-beauty-shops-korean-suppliers-roots-of-tension-mn',
    asOf: '2026-07-04',
    note: 'We examine the ARGUMENT and the underlying documented facts — sourced and labeled — not as a verdict to repeat. The lesson holds regardless of which creator made the specific video.',
  },
  claims: [
    { id: 'c-gatekeeping', text: 'Asian-owned beauty-supply stores block Black entrepreneurs from the distributors needed to open competing stores.', label: 'allegation', attribution: 'the video / boycott advocates', note: 'The concentration of wholesale access is documented; whether it is deliberate racial gatekeeping by store owners (versus distributor/industry structure) is the contested part.' },
    { id: 'c-no-investment', text: 'These businesses operate in Black neighborhoods but do not invest back (sponsoring teams, youth programs).', label: 'opinion', attribution: 'the video / boycott advocates', note: 'A value judgment about community reciprocity; true of some businesses, not a measured property of all.' },
    { id: 'c-disrespect', text: 'Black customers are treated with suspicion or disrespect in some of these stores.', label: 'allegation', attribution: 'the video / boycott advocates', note: 'Real individual experiences are widely reported; "all stores" is a generalization.' },
    { id: 'c-group-econ', text: 'Shift economic power toward Black-owned businesses ("group economics").', label: 'call-to-action', attribution: 'the video / boycott advocates', note: 'A constructive call — build and support within the community.' },
    { id: 'c-boycott', text: 'Boycott Asian-owned beauty-supply stores.', label: 'call-to-action', attribution: 'the video / boycott advocates', note: 'A request to DO something — the movement’s position. We present it alongside other responses (build, plead, buy elsewhere, reconcile); the lesson itself issues no boycott directive.' },
  ],
  verifiable: [
    {
      id: 'f-ownership',
      statement: 'Of roughly 9,000 beauty-supply stores in the U.S. — an industry serving a primarily Black customer base — only about one third are Black-owned; the remainder are predominantly Korean-owned (per the Black Owned Beauty Supply Association’s estimates).',
      status: 'partly-documented',
      sources: [
        { title: 'Roots of tension: race, hair, competition and black beauty stores', publisher: 'MPR News', url: 'https://www.mprnews.org/story/2017/04/25/black-beauty-shops-korean-suppliers-roots-of-tension-mn', asOf: '2017-04-25' },
        { title: 'Meet The Black Entrepreneurs Fighting Discrimination In The Beauty Supply Sector', publisher: 'Beauty Independent', url: 'https://www.beautyindependent.com/black-entrepreneurs-fighting-discrimination-beauty-supply-sector/', asOf: '2020-09-01' },
      ],
      note: 'The rough proportions are widely reported from industry-group estimates; treat the exact figures as reported, not census-precise.',
    },
    {
      id: 'f-distribution',
      statement: 'Black-owned beauty-supply entrepreneurs report real barriers accessing the small number of central distributors and wholesale terms that dominate the industry — a pattern documented for two decades.',
      status: 'partly-documented',
      sources: [
        { title: 'Black Hair (documentary, 2006), Aron Ranen', publisher: 'Aron Ranen', url: 'https://en.wikipedia.org/wiki/Black_Hair_(film)', asOf: '2026-07-04' },
        { title: 'Roots of tension: race, hair, competition and black beauty stores', publisher: 'MPR News', url: 'https://www.mprnews.org/story/2017/04/25/black-beauty-shops-korean-suppliers-roots-of-tension-mn', asOf: '2017-04-25' },
      ],
      note: 'The barrier to wholesale access is documented; whether it is driven by owner-level racial intent or by industry/distributor structure is contested — that distinction is the whole lesson.',
    },
    {
      id: 'f-both-communities',
      statement: 'Many of the Asian-owned businesses are immigrant (largely Korean-American) family operations that entered the hair-care niche decades ago; some in that community publicly express concern about being collectively punished for individuals’ actions, and some acknowledge internalized bias worth addressing.',
      status: 'partly-documented',
      sources: [
        { title: 'Roots of tension: race, hair, competition and black beauty stores', publisher: 'MPR News', url: 'https://www.mprnews.org/story/2017/04/25/black-beauty-shops-korean-suppliers-roots-of-tension-mn', asOf: '2017-04-25' },
      ],
      note: 'Both communities include real people acting in good and bad faith; neither is a monolith.',
    },
  ],
  interpretation: [
    { id: 'n-intent', statement: 'Reading a documented barrier to wholesale access as proof that every Asian store owner is a deliberate racial gatekeeper is an interpretation — the barrier is documented; the motive across thousands of owners is not.', restsOn: ['f-distribution'] },
    { id: 'n-collective', statement: 'Treating all Asian-owned stores as responsible for the actions of some is a generalization — collective punishment of a group for individuals’ conduct.', restsOn: ['f-both-communities'] },
    { id: 'n-target', statement: 'The video’s own deeper point — that societal structures pit minority groups against each other — suggests the real lever is distribution and capital access, not a people; that is an interpretation the lesson finds worth weighing.', restsOn: ['f-ownership', 'f-distribution'] },
  ],
  perspectives: [
    { id: 'p-black-community', label: 'The boycott advocates’ / Black-community view', heldBy: 'the video and many in the community', steelman: 'At its strongest: the barriers are real and documented — limited wholesale access, a financing gap, and genuine experiences of disrespect — in an industry whose customers are overwhelmingly Black yet whose ownership is mostly not. Group economics is a legitimate, historically rooted response: keep and circulate wealth within the community, and build what serves us. Where a people is shut out of ownership in its own market, organizing that market is righteous stewardship, not mere grievance.' },
    { id: 'p-asian-owners', label: 'The Asian-owned businesses’ view', heldBy: 'many Korean-American store owners and families', steelman: 'At its strongest: most are immigrant families who entered an open niche legally and built businesses through long hours and pooled family capital, and it is unjust to punish thousands of them collectively for the rudeness or gatekeeping of some. A boycott aimed at an ethnicity harms good-faith families along with bad actors; accountability should be targeted at specific wrongdoing, not a whole people — and some in the community are willing to name and address internalized bias if met as neighbors rather than enemies.' },
    { id: 'p-structural', label: 'The structural / one-new-man view', heldBy: 'those focused on the real lever', steelman: 'At its strongest: the fight is with a STRUCTURE — control of distribution and capital — not with a people. Two communities the mainstream underserved are being pitted against each other while the real gatekeeping of capital and channel goes unchallenged. The durable answer is to build alternative distribution and Black-owned capital (as the Black Owned Beauty Supply Association pursues), and, for believers, the cross broke down the dividing wall between peoples — the response builds and reconciles rather than wars.' },
    { id: 'p-measured', label: 'The careful / keep-the-categories view', heldBy: 'people committed to fair judgment', steelman: 'At its strongest: truth needs the distinctions kept — a documented BARRIER is not the same as a proven MOTIVE; an individual’s rudeness is not the same as a group’s guilt; a targeted PROTEST is not the same as collective punishment. Outrage that blurs these can wrong innocent families and still leave the real barrier standing.' },
  ],
  lens: {
    fourD: {
      deepSource: 'Scripture will not let us take only half of God’s heart. He defends the poor and the shut-out and commands honest scales and open doors of opportunity (Proverbs 31:8-9; Isaiah 1:17) — AND He forbids partiality, false witness, and crowd-following even in a good cause, and refuses to be partial even to the poor in a dispute (Exodus 23:2-3; Leviticus 19:15). He forbids treating a whole people by the sins of some, and He tears down the dividing wall of hostility between peoples in Christ (Ephesians 2:14-16). So the believer names a real barrier and pleads the cause of the shut-out (Proverbs 22:22-23) WITHOUT declaring a verdict on a whole community or bearing false witness against good-faith families.',
      scripture: 'Proverbs 31:8-9; Isaiah 1:17; Exodus 23:2-3; Leviticus 19:15-16; Proverbs 18:17; Proverbs 22:22-23; Ephesians 2:14-16; Romans 12:19-21',
    },
    threeD: 'Practically: care about the real people on BOTH sides — the shut-out Black entrepreneur AND the immigrant family that built a store — and refuse to let a video’s anger, or a defender’s dismissal, do your thinking. You can name a documented barrier and organize your own community’s ownership AND refuse to condemn a whole people or punish the innocent with the guilty. Check the claim, keep the categories straight, and aim your energy at the structure, not an ethnicity.',
    benefits: [
      'Freedom from being played by outrage that pits two underserved communities against each other.',
      'The ability to hold both: a real, documented barrier AND the dignity of good-faith families on the other side.',
      'A repeatable skill: separate a documented barrier from an assumed motive; refuse collective punishment.',
      'Energy aimed at the real lever — building distribution and capital — instead of a reflexive boycott.',
      'Truth and grace together: plead the cause of the shut-out without warring on a people.',
    ],
    graceNote: 'This lesson does NOT condemn Asian-owned businesses, Korean-American families, or the Black community. Every person on every side is made in the image of God and accountable to God exactly as we are. We can name a documented barrier, protect the shut-out, and organize our own community’s ownership WITHOUT pronouncing a verdict on a whole people or punishing good-faith families for others’ wrongs. The cross made the two one; truth and grace meet in Jesus.',
    stewardship: 'There is a deeper response to a barrier than a boycott: BUILD. The most durable answer to "we are shut out of ownership in our own market" is to build the missing door — Black-owned distribution and manufacturing, pooled capital, cooperative buying (the path the Black Owned Beauty Supply Association has pursued) — and to steward attention and dollars toward what lifts the community. Righteous engagement can include protest and accountability for real wrongdoing, and it is completed by building what serves us, under the frame that we war on a structure, never on a people.',
    anchor: { ref: 'Proverbs 18:17', theme: 'The one who states his case first seems right — until the other comes and examines him. Never let the first, loudest voice — the boycott video OR the dismissal — be the last word.' },
  },
  reflection: {
    skill: 'When a video pits your community against another: PAUSE. Name the claim and who makes it. Label it — documented barrier, assumed motive, opinion, or call-to-action. Find the primary source. State the OTHER community’s strongest case fairly. Then aim at the structure (distribution, capital), not a people — and choose to build over to boycott where you can.',
    practice: 'Take the barrier this video names. Find one source on it yourself. Write one sentence on what is documented (the barrier) vs. assumed (every owner’s motive) — then one sentence on a righteous, building response you could take (support or start Black-owned supply, pool buying, or reconcile a real relationship).',
    prompts: [
      'Which of the video’s points are documented barriers, and which are assumptions about people’s hearts? How would you check each?',
      'Can you state the Asian-owned families’ strongest case fairly, even though it is not the popular thing to do? Why is that a discipline?',
      'What is the difference between targeted accountability for real wrongdoing and collective punishment of a whole people?',
      'The video calls for a boycott; others build alternatives, others reconcile, others plead the cause. What would faithful stewardship of your attention and dollars look like for you?',
      'How do you hold both: naming a real barrier that shut your community out AND refusing to war on another underserved people?',
    ],
  },
  levels: {
    child: 'Sometimes a video says one group of people is the problem. Before you believe it, be a good, fair detective: ask what really happened, ask if it is true of EVERYONE or just some, and listen to the other side too. It is not fair to blame a whole group for what a few people did. The Bible says the first story sounds right until someone checks it (Proverbs 18:17), and God made every single person and loves them all. The best answer to a problem is usually to BUILD something good, not just to be angry. Being fair and being kind go together.',
    teen: 'Real talk: the internet loves to pit two groups against each other, because anger gets clicks. So when a video says "boycott THOSE people," slow down and run the moves. (1) What is the actual claim, and who is making it? (2) Is it a documented barrier, an assumption about people’s motives, an opinion, or a "you should do X"? A real example here: it is documented that Black entrepreneurs face barriers getting beauty-supply wholesale access — that part is checkable. But "every Asian store owner is racist" is a conclusion about thousands of hearts that no video can prove, and blaming a whole group for what some did is collective punishment. (3) Find the real source. (4) Can you say the other side’s best case — mostly immigrant families who built stores through long hours — fairly? The Bible is big on this: defend people who are shut out AND don’t bear false witness, and don’t "go with the crowd to do evil" (Exodus 23:2). The strongest move when your community is shut out of ownership is usually to BUILD — your own supply, your own distribution — not just to boycott. Aim at the structure, not a people.',
    senior: 'For the seasoned believer, this is judgment stewarded in a media age engineered to pit underserved communities against each other. Keep the categories: a documented BARRIER (limited wholesale access, a financing gap — real and sourced) is not the same as a proven MOTIVE across thousands of owners; an individual’s disrespect is not a group’s guilt; targeted accountability is not collective punishment. Scripture has governed exactly this for millennia — defend the shut-out and command open, honest dealing (Isaiah 1:17; Proverbs 31:8-9), refuse partiality and false witness even in a good cause (Exodus 23:2-3; Leviticus 19:15), and, in Christ, tear down the dividing wall of hostility between peoples (Ephesians 2:14-16). Hold truth and grace: name the barrier and organize your community’s ownership while leaving the verdict on any soul to God and refusing to punish good-faith families for others’ wrongs. And let the response mature past reaction into stewardship — the Black church’s long tradition as builder and refuge points the way: accountability AND construction, group economics AND reconciliation, aimed at the structure of capital and distribution, never at a people.',
  },
};

export const WORLD_ISSUES = [MUSK_ISSUE, BEAUTY_SUPPLY_ISSUE];

// ---------------------------------------------------------------------------
// Course-specific helpers — thin wrappers over the reusable discernment engine
// + the generic Learn helpers, so this track behaves exactly like the others.
// ---------------------------------------------------------------------------
export const WORLD_ISSUES_INTEREST_TAG = '[World Issues interest]';
export const WORLD_ISSUES_HELPER_TAG = '[World Issues helper]';

export function resolveWorldIssuesCohort(localCohort = null) {
  return resolveCohortGeneric(localCohort, WORLD_ISSUES_CONFIRMED_COHORT, WORLD_ISSUES_PROPOSED_COHORT_START);
}

// Self-paced: one row per issue, numbered, NO painted date.
export function buildWorldIssuesSchedule() {
  return buildDiscernmentSchedule(WORLD_ISSUES);
}

export function worldIssuesProgressSummary(progress = {}) {
  return discernmentProgressSummary(WORLD_ISSUES, progress);
}

export function exportWorldIssuesCurriculumMarkdown() {
  return exportCurriculumMarkdownFor(
    { meta: WORLD_ISSUES_META, sessionFlow: WORLD_ISSUES_SESSION_FLOW, modules: buildDiscernmentModules(WORLD_ISSUES) },
    null,
  );
}

// The machine-checked safeguard gate over the WHOLE published set. The course
// test asserts every issue passes (auditWorldIssues().every(r => r.ok)).
export function auditWorldIssues() {
  return auditAllIssues(WORLD_ISSUES);
}

// Tutor course-meta — the per-issue solo guide is a DISCERNMENT COACH: evenhanded,
// source-checking, truth-and-grace, and it never delivers a verdict on a person.
export const WORLD_ISSUES_TUTOR_META = {
  title: WORLD_ISSUES_META.title,
  intro: 'You are a calm, evenhanded discernment coach for a Word-first track called "Thinking It Through: World Issues & Discernment."',
  posture: 'Guide ONE learner — who may be a child, a teen, an adult, or a seasoned believer — to THINK THROUGH a charged real-world claim, matching your words and pace to their age. Teach the moves, never the verdict: (1) identify each claim and who is making it; (2) LABEL it — documented fact, unproven allegation, opinion, or call-to-action; (3) separate documented fact (checkable against primary sources, with dates) from interpretation; (4) STEELMAN every side — state each fairly at its strongest; (5) weigh it in the light of Scripture with truth AND grace. Be relentlessly EVENHANDED: never become a one-sided attack on a named person, and never hand the learner a conclusion about a person’s heart — that judgment belongs to God. Cite Scripture by reference (ESV primary, KJV where the wording is the point); never invent or paraphrase a verse as if quoting it, and if you are unsure of a fact or a text, say so plainly rather than fabricate. Always point toward righteous engagement over outrage, and toward building over merely reacting.',
};
