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
  // WORD-FIRST (DR-0127) — Yahweh's knowledge opens this space, DECLARED rather
  // than derived. Without this, wordFirstLead() fell through to the first
  // issue's anchor, so the track that handles the most charged claims in the
  // app opened under a Musk-lesson anchor instead of His frame for weighing a
  // claim at all. Both texts fetched verbatim from the repo's KJV and gated in
  // world-issues-verse-integrity.test.js.
  wordFirst: {
    ref: '1 Thessalonians 5:21; Proverbs 18:13',
    frame: 'Yahweh sets the method before we touch a single claim: "Prove all things; hold fast that which is good" — testing is commanded, not optional, and what survives the test is HELD, not endlessly re-argued. And the discipline that guards the test: "He that answereth a matter before he heareth it, it is folly and shame unto him." Hear it fully, prove it honestly, hold what is good.',
  },
  format: 'Self-paced · one issue at a time · media literacy + biblical discernment · paced to your age',
  cadenceDays: 7,
  weeks: 8, // eight published issues (Musk critique · beauty-supply boycott · The Game Changers · the prophetic-lens Musk video · the medical-establishment critique · the AI-empire journalism · the prison industrial complex; the two aftermaths); the track grows as issues are added
  handsOnLabel: 'Practice the skill',
  unit: {
    noun: 'issue',
    nounPlural: 'issues',
    cap: 'Issue',
    selfPaced: true,
    sessionLabel: 'How to lead it (family or small group)',
    countNoun: 'issue',
  },
  footer: '_Built on PoeTech · The Church of the Living God + the Poe family. This track speaks documented truth plainly and weighs every claim by the Word — accountability for deeds as Jesus taught it, every side heard fairly (Proverbs 18:17), and the verdict on a soul left to God. Word-first and grace-centered, for every age._',
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
// WORD-FIRST JUSTICE (DR-0100 + Darrell 2026-07-08): the lesson's OWN voice
// states the documented facts plainly — a jury finding IS a verdict, and hedging
// proven harm into "who can say" is false witness (Isaiah 5:20; Jeremiah 6:14).
// It teaches justice and accountability the way Jesus interprets them (Luke
// 4:18; Matthew 21:13; Luke 19:8-9; Mark 6:18). Perspectives are interpretive
// positions on the UNRESOLVED parts only — never a vote on whether the proven
// harm is real. The one verdict withheld is the verdict on a soul (Matthew
// 7:1-5; Romans 14:4); that restraint never mutes the deeds.
// =============================================================================
const MUSK_ISSUE = {
  id: 'wi-musk-creator-critique',
  title: 'A Creator’s Video Critiquing Elon Musk — How To Think It Through',
  subject: { name: 'Elon Musk', kind: 'public-figure', isNamedRealPerson: true },
  skill: 'Take one charged, viral critique of a powerful person and learn how the Word — not the noise — judges it: state the documented facts plainly (a jury finding IS a verdict; Grok’s outputs happened; the turbines sit beside Boxtown), hear every side fairly before answering (Proverbs 18:17), and then speak the justice Jesus speaks — accountability for documented deeds, protection for the wronged, restitution where wrong was done — while the verdict on a soul stays with God.',
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
      note: 'The core under this framing is documented and is said plainly: a federal jury FOUND Tesla liable for racial harassment of a Black worker (a verdict, not an allegation), two civil-rights agencies have sued alleging widespread abuse (filed, unadjudicated), Grok produced racist outputs, and the polluting turbines sit beside a historically Black neighborhood. What remains the creator’s framing is the reach of the word "pattern" and any verdict on Musk’s heart — the deeds are named; the soul is God’s.',
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
    {
      id: 'f-visa',
      statement: 'On the "the system let it slide" point: The Washington Post reported (October 2024) that Musk worked in the U.S. in 1995 building his first company (Zip2) while on a student visa, having never enrolled at Stanford — which immigration-law experts cited say would have invalidated the visa\u2019s basis. His own 2005 email says he had "no legal right to stay in the country"; Zip2 board member Derek Proudian said the brothers\u2019 immigration status "was not what it should be for them to be legally employed"; his brother Kimbal said in a recorded interview that they were illegal immigrants. Musk denies the characterization ("I was legally there, but I was meant to be doing student work"). No enforcement action was ever brought, and no court ever ruled on it.',
      status: 'partly-documented',
      sources: [
        { title: 'Elon Musk denies Washington Post report that he worked illegally in the US', publisher: 'CNN', url: 'https://www.cnn.com/2024/10/28/us/elon-musk-immigration-washington-post-cec', asOf: '2024-10-28' },
        { title: 'Musk Was Once an Undocumented Immigrant in US?', publisher: 'Snopes', url: 'https://www.snopes.com/fact-check/musk-undocumented-immigrant/', asOf: '2024-10-28' },
      ],
      note: 'The reporting, his own 2005 email, the board member\u2019s and brother\u2019s statements are documented; his denial is his claim; the legal characterization was never adjudicated. That is exactly the accountability lesson: man\u2019s system never ruled — and the eternal court still holds the whole record (Ecclesiastes 12:14), by the same standard for the billionaire as for anyone else at any border.',
    },
  ],
  interpretation: [
    {
      id: 'n-harm-is-real',
      statement: 'FIRST, name the wound plainly — "we cannot judge his heart" must NEVER become "so nothing here is real." The HARM is documented and serious, and much of it lands on Black people: a federal jury FOUND racial harassment of a Black worker (a verdict, not an allegation); xAI’s Grok produced antisemitic and "white genocide" content; a polluting facility was sited beside a historically Black neighborhood. You do not need to prove a motive to name a fruit — "by their fruits ye shall know them" (Matthew 7:16,20). Refusing to call an obvious, documented harm a harm — "Peace, peace; when there is no peace" (Jeremiah 6:14) — is itself a failure of truth, the very thing this track exists to stop. Discernment weighs BOTH sides fairly; it never launders documented damage into "who can say."',
      restsOn: ['f-diaz', 'f-grok', 'f-boxtown'],
    },
    {
      id: 'n-pattern',
      statement: 'AND keep the categories: concluding "Elon Musk is a racist in his heart" is an interpretation about a person’s inner intent — which no headline can prove, and which Scripture reserves to God. Naming documented harm (the fruit) and pronouncing a verdict on a soul (the heart) are two different acts; we do the first plainly and leave the second to God. Documented harms, unproven allegations, and a person’s inner motive are three different things.',
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

  // ---- STAGE 3 — PERSPECTIVES on the UNRESOLVED parts ----
  // The documented facts are NOT up for a vote here — the lesson already stated
  // them plainly (Stage 2, and the believer's lens below). These are positions
  // on what remains genuinely unresolved: the unadjudicated suits, motives,
  // policy questions, and what accountability should look like.
  perspectives: [
    {
      id: 'p-critics',
      label: 'The creator’s / critics’ view of the unresolved parts',
      heldBy: 'DAT BOY WILL and many critics',
      steelman: 'The proven core is not this view’s claim — it is settled record (the jury finding, the Grok outputs, the siting). What this view adds on top: the items together form a PATTERN that reveals posture if not heart; the unadjudicated suits will likely prove more of the same; and a man this powerful must be held publicly accountable now, because for the powerful, delay IS escape — silence can look like consent.',
    },
    {
      id: 'p-defenders',
      label: 'What the defense actually answers — and what it doesn’t',
      heldBy: 'Musk, xAI/Tesla, and defenders',
      steelman: 'Heard at its strongest, the defense genuinely answers some things: the California and EEOC suits ARE still unproven allegations; the company DID correct and apologize for the Grok outputs; the permit process WAS public; the bias-law objection is argued as free speech; and criticizing BEE is a mainstream position held by many South Africans of every race. But mark what the defense does NOT answer: it cannot erase the adjudicated Diaz finding — a jury heard the evidence and found racial harassment; a reduced award and a settlement change the amount, not the finding. And "the outputs were errors" explains the mechanism, not away the harm. A fair hearing weighs what the defense covers AND names what it leaves standing.',
    },
    {
      id: 'p-community',
      label: 'The environmental-justice / community view',
      heldBy: 'Boxtown neighbors and EJ advocates',
      steelman: 'Regardless of anyone’s intent, a historically Black, already over-burdened neighborhood is bearing real pollution risk and deserves protection, clean air, and a genuine voice in decisions made about its own backyard. The harm to real people matters even if motive can never be proven — and the Word pleads exactly this cause (Proverbs 31:8-9).',
    },
    {
      id: 'p-measured',
      label: 'The careful / due-process view',
      heldBy: 'people committed to fair process',
      steelman: 'Truth is served by keeping the categories the law itself keeps — a jury FINDING is not the same as an unproven SUIT, a documented OUTPUT is not the same as a stated INTENT, and a peaceful PROTEST is not the same as criminal VANDALISM. Careful people insist on the distinctions in BOTH directions: never inflate an allegation into a verdict, and never deflate a verdict into an allegation.',
    },
  ],

  // ---- STAGE 4 — THE BELIEVER'S LENS: how Jesus interprets justice ----
  lens: {
    fourD: {
      deepSource: 'HOW JESUS INTERPRETS JUSTICE — start where He starts. He opened His ministry with justice for the wronged: "The Spirit of the Lord is upon me... to preach deliverance to the captives... to set at liberty them that are bruised" (Luke 4:18). He did not hedge documented wrong into "who can say" — He walked into the temple, overturned the tables, and named the deed to their faces: "ye have made it a den of thieves" (Matthew 21:13). He pronounced woe on the powerful for omitting "the weightier matters of the law, judgment, mercy, and faith" (Matthew 23:23). His forerunner named a king’s specific sin at the cost of his head: "It is not lawful for thee to have thy brother’s wife" (Mark 6:18). And when a rich man repented, Jesus measured the repentance by RESTITUTION — "if I have taken any thing from any man by false accusation, I restore him fourfold," and only then: "This day is salvation come to this house" (Luke 19:8-9). That is the Word’s justice: documented wrong is named plainly, the wronged are defended, accountability and restitution are required — "let judgment run down as waters" (Amos 5:24); "seek judgment, relieve the oppressed" (Isaiah 1:17); "For I the LORD love judgment, I hate robbery" (Isaiah 61:8). SO IN THIS CASE the believer speaks what is proven the way Jesus would: a federal jury found racial harassment of a Black worker at Tesla — that is adjudicated wrong, and the Word calls it what it is; Grok’s racist outputs happened and were harm, whatever the mechanism; the Boxtown neighbors deserve clean air and a voice, and their cause is worth pleading (Proverbs 31:8-9). Hedging any of that into "no one knows" is the false witness — "Woe unto them that call evil good" (Isaiah 5:20), "Peace, peace; when there is no peace" (Jeremiah 6:14). AND the same Word keeps the categories He keeps: hear the other side before answering (Proverbs 18:17), no crowd-following or false witness even in a righteous cause (Exodus 23:2-3; Leviticus 19:15), unproven suits stay unproven until judged, and the verdict on a man’s SOUL — Elon Musk’s exactly as ours — stays with the Judge of all the earth (Matthew 7:1-5; Romans 14:4). Accountability for deeds is commanded; condemnation of souls is forbidden; and neither ever cancels the other.',
      scripture: 'Luke 4:18; Matthew 21:13; Matthew 23:23; Mark 6:18; Luke 19:8-9; Amos 5:24; Isaiah 1:17; Isaiah 61:8; Micah 6:8; Isaiah 5:20; Jeremiah 6:14; Matthew 7:16-20; Proverbs 31:8-9; Proverbs 18:17; Exodus 23:2-3; Leviticus 19:15; Matthew 7:1-5; Ephesians 5:11',
    },
    threeD: 'Practically: speak the proven things the way Jesus speaks them. A jury found racial harassment of a Black worker at Tesla — say "that was wrong" without a hedge, the way He said "ye have made it a den of thieves" (Matthew 21:13). Grok’s racist outputs happened — documented, admitted, apologized for; say so. The Boxtown neighbors are breathing the cost of someone else’s build — plead their cause. Accountability according to the Word is concrete: name the deed, stand with the wronged, and expect what was broken to be made right — restitution is what repentance looks like in public (Luke 19:8-9). AND keep His categories: the unproven suits are unproven; hear the defense at its strongest before answering (Proverbs 18:17) — and mark what it answers and what it leaves standing; and the verdict on the man’s soul is not yours to give — it is God’s. Both, without letting either mute the other.',
    accountability: {
      statement: 'THE TWO COURTS. Man\u2019s court is real, but it is not the court of record. A jury found the deed at Tesla \u2014 that verdict stands, and honoring it is part of justice ("establish judgment in the gate," Amos 5:15). But the Word never lets accountability shrink to what a human court happens to reach: the evidence a judge dismisses, the suits that settle before judgment, the records sealed, the wrongs a government permits or never prosecutes \u2014 ALL of it enters the eternal court, where "God shall bring every work into judgment, with every secret thing" (Ecclesiastes 12:14), where "there is nothing covered, that shall not be revealed" (Luke 12:2), and where "all things are naked and opened unto the eyes of him with whom we have to do" (Hebrews 4:13). This case carries its own worked example: the documented record of building his first company on a student visa without enrolling \u2014 his own email said "no legal right to stay in the country" \u2014 was never prosecuted and never ruled on by any court (see the documented-facts stage). Man\u2019s system let it slide; the eternal court holds the whole record, by the SAME standard for the billionaire as for the migrant at any border \u2014 "the eyes of the LORD are in every place" (Proverbs 15:3), and a system that lets the powerful cheat while it turns the needy aside is itself under woe (Isaiah 10:1-2). And the impact on real lives DURING life is not deferred evidence \u2014 it is seen and weighed now: the harassed worker\u2019s years, the neighborhood\u2019s air, everyone undermined so another could gain. Withheld wages "crieth: and the cries... are entered into the ears of the Lord of sabaoth" (James 5:4). WHAT THE WRONGDOER OWES: confession, not spin \u2014 "they shall confess their sin which they have done" (Numbers 5:7); restitution to the actual person wronged, principal plus a fifth (Leviticus 6:4-5; Numbers 5:7) \u2014 the pattern Zacchaeus fulfilled fourfold (Luke 19:8-9); and "fruits meet for repentance" (Matthew 3:8) \u2014 changed conduct, not a press release. WHAT WE OWE: reprove the works and never help hide them (Ephesians 5:11) \u2014 a witness who conceals what he knows "shall bear his iniquity" (Leviticus 5:1), and minimizing another\u2019s wrong to gain is itself in the record: "He that justifieth the wicked, and he that condemneth the just, even they both are abomination to the LORD" (Proverbs 17:15). Plead the cause of the wronged (Proverbs 31:8-9). And rest on this: no one gets away \u2014 "Be not deceived; God is not mocked: for whatsoever a man soweth, that shall he also reap" (Galatians 6:7); "we must all appear before the judgment seat of Christ" (2 Corinthians 5:10); the books are opened and the judgment is "according to their works" (Revelation 20:12).',
      scripture: 'Ecclesiastes 12:14; Luke 12:2-3; Hebrews 4:13; Proverbs 15:3; James 5:4; Isaiah 10:1-2; Amos 5:15; Numbers 5:6-7; Leviticus 6:4-5; Luke 19:8-9; Matthew 3:8; Ephesians 5:11; Leviticus 5:1; Proverbs 17:15; Proverbs 31:8-9; Galatians 6:7; 2 Corinthians 5:10; Revelation 20:12',
    },
    benefits: [
      'Both courts, honestly held: earthly justice is real but imperfect \u2014 some of the guilty walk free and some of the innocent suffer or sit in prison (Ecclesiastes 8:14; Joseph, Genesis 39:20; and the sinless Christ, "this man hath done nothing amiss," Luke 23:41) \u2014 while the ETERNAL court misses nothing and lands after this life (Ecclesiastes 12:14; Hebrews 9:27). Since all suffer and die regardless, the wise path is His way for the reward that outlasts it all (2 Corinthians 4:17; Hebrews 11:24-26).',
      'Freedom from being manipulated by outrage media — in either direction (the attack OR the dismissal).',
      'Peace in a divisive world: you can engage hard things without your heart being eaten by anger.',
      'A repeatable skill: state what is proven plainly, label what is not, check the primary source, hear the other side at its strongest.',
      'The Word’s own justice: accountability for documented deeds and care for the wronged, with the soul’s verdict left to God.',
      'Wiser stewardship of your attention, your words, and your dollars — spent on building, not just reacting.',
    ],
    graceNote: 'This lesson pronounces no verdict on Elon Musk’s soul — that judgment belongs to God alone (Romans 14:4; James 4:12), and he is a person made in the image of God, accountable to God exactly as every one of us is. But leaving the soul to God NEVER mutes the deeds: the jury’s finding was real wrong, the Grok outputs were real harm, and the Word names them plainly while calling the man — like every man — to repentance and restitution. Truth and grace are not rivals; they meet in Jesus, who named the deed AND ate with the accused.',
    stewardship: 'There is a deeper response to feeling wronged by the powerful than outrage or even boycott: BUILD. The biblical pattern of empowerment — honest work, ownership, generosity, and community strength — turns grievance into stewardship. The Black church has long been an economic powerhouse and a refuge; the most durable answer to "they don’t serve us" is often to build what serves us, steward our attention and dollars toward what lifts the community, and create sovereign tools and businesses of our own (this very platform is one small example). Righteous engagement can include protest and accountability — and it is completed by building.',
    anchor: {
      ref: 'Proverbs 18:17',
      theme: 'The one who states his case first seems right — until the other comes and examines him. The whole skill of discernment, in one verse: never let the first, loudest voice be the last word.',
    },
  },

  // ---- STAGE 5 — REFLECTION + SKILL ----
  reflection: {
    skill: 'When a charged video or post stirs you up: PAUSE. Name the claim and who is making it. Label it — adjudicated finding, documented fact, unproven allegation, opinion, or call-to-action — and say the proven parts PLAINLY; hedging a verdict back into an allegation is false witness in reverse. Find the primary source yourself. Hear the other side at its strongest, and mark what it answers and what it leaves standing. Then speak the Word’s justice — accountability for deeds, care for the wronged — and leave the soul’s verdict to God. Outrage is cheap and someone else profits from it; the Word’s justice costs you a few minutes and sets you free.',
    practice: 'Take ONE claim from any video or post that made you angry this week. Find the primary source yourself. Write one sentence stating plainly what is PROVEN, one sentence labeling what is not — then one sentence on a righteous response that holds someone accountable or builds something (protest, plead, build, restore), not just a stronger feeling.',
    prompts: [
      'Which of the creator’s points were documented facts, and which were his interpretation? How could you check each one?',
      'Walk through how Jesus handled documented wrong: Luke 4:18 (liberty for the bruised), Matthew 21:13 (naming the deed to its face), Mark 6:18 (naming a king’s sin at cost), Luke 19:8-9 (restitution as the fruit of repentance). What does that pattern require of us in this case — and what does it forbid?',
      'Where is the line between "I won’t judge his heart" (right — that is God’s) and "so I won’t name the documented harm either" (wrong — that is calling a wound peace, Jeremiah 6:14)? Practice saying the proven wrong plainly without pronouncing on the soul.',
      'Hear the defense at its strongest: what does it actually answer (the unproven suits, the correction of Grok) — and what does it leave standing (the jury’s finding)? Why is marking BOTH the honest move?',
      'A jury FOUND Tesla liable in one case; other suits are unproven ALLEGATIONS. Why does keeping that distinction matter in both directions — never inflating an allegation, never deflating a verdict?',
      'The creator calls for a Tesla boycott; others protest, others build alternatives, others pray. What does accountability according to the Word look like for you — and what would faithful stewardship of your attention and money build?',
    ],
  },

  // ---- Age-appropriate renderings (kids use the app) ----
  levels: {
    child: 'Sometimes a video online says something big about a famous person. Before you believe it or repeat it, be a good detective: ask WHO said it, ask whether it really happened or whether it is just their opinion, and listen to the OTHER side of the story too (Proverbs 18:17). And here is something important: when something wrong REALLY happened — like when a court listened carefully and said a worker was treated badly because he is Black — we say "that was wrong," out loud, because God loves justice and Jesus always stood up for people who were hurt. We never pretend a real wrong did not happen; that would not be fair to the person who was hurt. But only God can see inside anyone’s heart, so we never say "that person is bad forever" — we say "that DEED was wrong," we hope they make it right, and we remember God made every single person and loves them.',
    teen: 'Real talk: the internet runs on making you angry, because angry people click and share. So when a video goes hard at a famous person — say, a creator critiquing Elon Musk — slow down and run the moves. (1) What is the actual claim, and who is making it? (2) Label it honestly — and that cuts BOTH ways: a jury actually FOUND Tesla liable for racial harassment of a Black worker; that is a verdict, so say it plainly — hedging it back into "just an accusation" is lying in the other direction. Other lawsuits ARE still unproven accusations, and "Musk is a racist in his heart" is a conclusion no headline can prove. (3) Find the real source. (4) Hear the other side at its strongest — and mark what it answers and what it leaves standing. Then know what the Word actually does with proven wrong: Jesus named it out loud ("ye have made it a den of thieves," Matthew 21:13), stood with the people getting hurt (Luke 4:18), and expected wrong to be made RIGHT (Luke 19:8 — Zacchaeus paid back fourfold). So speak the proven part plainly, demand real accountability, refuse to condemn the man’s soul — that is God’s call — and put your real energy into BUILDING something better, not just raging.',
    senior: 'For the seasoned believer, this lesson is about speaking justice the way Jesus speaks it, in a media age engineered for outrage in both directions. First, the Word’s justice is not neutral about documented wrong: the Lord opened His ministry proclaiming liberty for the bruised (Luke 4:18), named the temple’s corruption to its face (Matthew 21:13), pronounced woe on the powerful who omitted judgment and mercy (Matthew 23:23), and measured Zacchaeus’ repentance by fourfold restitution (Luke 19:8-9). So in the Tesla matter, the Owen Diaz case produced an actual jury finding of racial harassment — an adjudicated wrong; the believer names it plainly, and notes that the later reduction and settlement changed the award, not the finding. Refusing to say so is not fairness; it is the muted witness Scripture pronounces woe upon (Isaiah 5:20; Jeremiah 6:14). Second, keep the categories the law itself keeps: the California Civil Rights Department and EEOC suits remain unadjudicated allegations; a company’s stated cause for an incident (as with Grok’s 2025 outputs) is a claim, not a proven root cause; and a person can support one kind of regulation (the SB 1047 safety bill) while opposing another (a bias-disclosure law) — naming WHICH is the honest move. Third, hear the defense at its strongest (Proverbs 18:17) and mark precisely what it answers and what it leaves standing. Scripture has governed this discipline for millennia: impartial justice (Exodus 23:2-3; Leviticus 19:15), a true witness, defense of the oppressed (Isaiah 1:17; Proverbs 31:8-9), the log from one’s own eye first (Matthew 7:1-5) — and the verdict on a soul left to God (Romans 14:4) without ever muting the verdict the court already gave on the deed. Then let the response mature past reaction into stewardship — the long tradition of the Black church as builder and refuge points the way: accountability AND construction, protest AND ownership.',
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
        explain: 'A finding is an adjudicated result; a filing is an accusation the court has not resolved. Telling the truth means keeping that distinction — in both directions: never inflate an allegation into a verdict, never deflate a verdict into an allegation.',
      },
      {
        q: 'A jury found Tesla liable for racial harassment of a Black worker. According to the Word, what does justice require you to say?',
        options: ['Nothing — "we can’t judge" covers it', 'Name it plainly as adjudicated wrong and stand with the wronged, while leaving the man’s soul to God', 'Condemn Musk’s soul — the verdict proves his heart'],
        answer: 1,
        explain: 'Jesus named documented wrong plainly (Matthew 21:13), stood with the bruised (Luke 4:18), and measured repentance by restitution (Luke 19:8-9). Scripture forbids the verdict on a soul (Matthew 7:1-5; Romans 14:4) — never the naming of a proven deed (Isaiah 5:20; Jeremiah 6:14).',
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
    accountability: {
      statement: 'THE TWO COURTS, applied to a structure. Where an individual owner actually wrongs a customer \u2014 deception, disrespect, gatekeeping \u2014 that deed is accountable like any other: confession and making it right (Numbers 5:7), and a community may lawfully take its patronage where it is honored. Where the wrong is STRUCTURAL \u2014 distribution and capital sewn up so a people cannot own in its own market \u2014 the keepers of that structure answer to God for it even where every individual act was "legal": the Word pronounces woe on arrangements that turn aside the needy from opportunity (Isaiah 10:1-2), and a rigged channel is a false balance \u2014 "A false balance is abomination to the LORD" (Proverbs 11:1). Man\u2019s market rules may let a closed door stand forever; the eternal court weighs the shut-out entrepreneur\u2019s years and losses now (Ecclesiastes 12:14; the James 5:4 pattern \u2014 gain kept back from those who earned the open door cries out). OUR accountability cuts both ways: never punish the innocent with the guilty \u2014 acquitting real wrongdoing and condemning good-faith families are BOTH abomination (Proverbs 17:15); never hide a real wrong to keep a false peace (Leviticus 5:1); plead the cause of the shut-out (Proverbs 22:22-23); and build the missing door \u2014 accountability aimed at the structure, never at a people.',
      scripture: 'Ecclesiastes 12:14; Isaiah 10:1-2; Proverbs 11:1; James 5:4; Numbers 5:7; Proverbs 17:15; Leviticus 5:1; Proverbs 22:22-23; Galatians 6:7',
    },
    benefits: [
      'Both courts, honestly held: earthly justice is real but imperfect \u2014 some of the guilty walk free and some of the innocent suffer or sit in prison (Ecclesiastes 8:14; Joseph, Genesis 39:20; and the sinless Christ, "this man hath done nothing amiss," Luke 23:41) \u2014 while the ETERNAL court misses nothing and lands after this life (Ecclesiastes 12:14; Hebrews 9:27). Since all suffer and die regardless, the wise path is His way for the reward that outlasts it all (2 Corinthians 4:17; Hebrews 11:24-26).',
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

// =============================================================================
// THIRD WORKED EXAMPLE — a persuasive plant-based health documentary.
// The DR-0100 discipline in a lesson: SPEAK the established fact + documented
// damage plainly (heart disease the #1 killer; the ultra-processed Western diet's
// real harm) — never hedged into "no one knows"; FLAG the genuinely-contested
// claims narrowly, INCLUDING the film's OWN cherry-picked ones (saturated-fat-as-
// simple-cause, the evolution/anatomy argument, the "vegetarian gladiators"); and
// let the Word correct only the IDEOLOGY (plant-only-as-doctrine), never the data.
// Sources verified by live web search 2026-07-04 (DR-0076), cited with as-of dates.
// =============================================================================
const GAME_CHANGERS_ISSUE = {
  id: 'wi-game-changers-diet',
  title: 'The Game Changers — A Plant-Based Documentary: How To Think It Through (Speak the Truth Both Ways)',
  subject: { name: 'The Game Changers (2019 documentary) and the plant-based-vs-omnivore diet debate', kind: 'documentary / health claim', isNamedRealPerson: false },
  skill: 'Take a persuasive health documentary and practice the hardest discernment move: SPEAK the established fact and real, documented damage plainly (it is not "one side"), FLAG the genuinely-contested claims narrowly — including the film\'s OWN cherry-picked ones — and let the Word correct only the ideological over-reach. Never hedge real facts into "no one knows"; never launder a film\'s weak claims as proof.',
  source: {
    creator: 'The Game Changers (2019), dir. James Wilks; exec. producers incl. James Cameron',
    medium: 'documentary film',
    title: 'The Game Changers',
    url: 'https://www.healthline.com/nutrition/game-changers-review',
    asOf: '2026-07-04',
    note: 'We examine the film\'s argument AND the real data underneath it — established fact stated AS fact, contested claims flagged narrowly, the Word correcting the ideology not the data. (Darrell 2026-07-04 / DR-0100: we do not debate statistically-true data, and we do not launder a film\'s cherry-picked claims either.)',
  },
  claims: [
    { id: 'c-plant-optimal', text: 'A plant-based diet is optimal — even superior — for strength, athletic performance, and recovery.', label: 'claim', attribution: 'the film / James Wilks', note: 'That elite athletes CAN thrive plant-based is real; "optimal/superior for all" is the contested leap, and the film leans on small or weak studies to make it.' },
    { id: 'c-meat-myth', text: 'The idea that you need meat for strength and protein is a myth.', label: 'claim', attribution: 'the film', note: 'You CAN meet protein needs on plants — true. "Myth" overstates it: meat is a complete, efficient protein source; the honest point is that plants can suffice, not that meat is useless.' },
    { id: 'c-blood-flow', text: 'Animal-based meals impair blood flow while plant meals improve it; saturated fat drives heart disease.', label: 'claim', attribution: 'the film', note: 'A single high-saturated-fat meal can acutely blunt blood-flow measures — real. But the strong "saturated fat simply causes heart disease" framing is more contested in the literature than the film presents.' },
    { id: 'c-evolution', text: 'Humans evolved to eat mostly plants (long intestines; ancestral and gladiator diets).', label: 'claim', attribution: 'the film', note: 'Contested / cherry-picked: humans are omnivores, not herbivores; the gut-length argument and the "vegetarian Roman gladiators" claim are criticized as misread (the gladiators ate a mixed, plant-heavy but not meatless diet).' },
    { id: 'c-go-plant', text: 'Switch to a plant-based diet.', label: 'call-to-action', attribution: 'the film', note: 'The film\'s position. We present it beside the whole-food-omnivore and the biblical-freedom views; the lesson itself issues no diet mandate.' },
  ],
  verifiable: [
    {
      id: 'f-heart-disease',
      statement: 'Heart disease is the leading cause of death in the United States — about 1 in 5 deaths, and the #1 killer since 1950 (CDC; ~919,000 U.S. cardiovascular deaths in 2023). This is real, documented damage, not "one side of a debate."',
      status: 'documented',
      sources: [
        { title: 'Heart Disease Facts', publisher: 'CDC', url: 'https://www.cdc.gov/heart-disease/data-research/facts-stats/index.html', asOf: '2026-07-04' },
      ],
      note: 'Diet, blood pressure, cholesterol, smoking, inactivity, obesity, and alcohol are named risk factors — diet is a lever people can move.',
    },
    {
      id: 'f-upf-harm',
      statement: 'Across large cohort studies, higher ULTRA-PROCESSED-food consumption tracks with higher cardiovascular disease and death — BMJ 2019 found a 10-percentage-point rise in the ultra-processed share of the diet associated with roughly 12% higher cardiovascular disease. The junk-food pattern does real, measured harm.',
      status: 'documented',
      sources: [
        { title: 'New evidence links ultra-processed foods with a range of health risks', publisher: 'BMJ Group', url: 'https://bmjgroup.com/new-evidence-links-ultra-processed-foods-with-a-range-of-health-risks/', asOf: '2026-07-04' },
      ],
      note: 'Ultra-processed = packaged baked goods, sodas, sugary cereals, reconstituted meats, ready meals — high added sugar/fat/salt, low fibre. This harm stands regardless of the vegan-vs-omnivore question.',
    },
    {
      id: 'f-ornish-reversal',
      statement: 'In the Ornish Lifestyle Heart Trial (The Lancet, 1990; a small randomized trial, 28 vs 20 patients), a comprehensive lifestyle program that INCLUDED a low-fat plant-based diet was associated with REGRESSION of coronary atherosclerosis after one year, with more regression and fewer cardiac events at five years — heart disease is one of the few conditions with trial evidence of dietary/lifestyle reversal.',
      status: 'documented',
      sources: [
        { title: 'Can lifestyle changes reverse coronary heart disease? (Lifestyle Heart Trial)', publisher: 'The Lancet (Ornish et al., 1990)', url: 'https://www.thelancet.com/journals/lancet/article/PII0140-6736(90)91656-U/fulltext', asOf: '2026-07-04' },
      ],
      note: 'Honest limits (DR-0076): small sample, and the program was MULTI-component (plant-based diet PLUS no smoking, stress management, exercise) — the reversal is credited to the whole package, not diet alone.',
    },
    {
      id: 'f-shared-core',
      statement: 'Even the documentary\'s scientific critics agree on the core: a diet high in whole plants and fibre and low in ultra-processed food is beneficial. The dispute is over the film\'s STRONGER, one-sided claims — not over eating more real plants.',
      status: 'documented',
      sources: [
        { title: 'Fact Checking "The Game Changers"', publisher: 'Healthline', url: 'https://www.healthline.com/nutrition/game-changers-review', asOf: '2026-07-04' },
      ],
      note: 'The critics fault the film for cherry-picking small/weak studies and omitting large contrary ones — while still affirming the whole-food, less-processed core. Both the real benefit AND the over-reach are true at once.',
    },
  ],
  interpretation: [
    { id: 'n-can-not-must', statement: 'That elite athletes thrive plant-based shows a plant-based diet CAN be excellent — not that it is universally OPTIMAL or that meat is harmful. "Can" is documented; "must / superior-for-everyone" is the interpretive leap the film makes.', restsOn: ['f-shared-core'] },
    { id: 'n-real-damage-stands', statement: 'The real, documented damage is the ultra-processed, heart-disease-driving Western pattern — and that stands no matter how the vegan-vs-omnivore debate resolves. Calling THAT "contested" would be ignoring real harm (DR-0100).', restsOn: ['f-heart-disease', 'f-upf-harm'] },
    { id: 'n-film-over-reach', statement: 'The film\'s specific mechanistic and evolutionary claims (saturated-fat-as-simple-cause, the long-gut "not meant for meat" argument, the "vegetarian gladiators") are an over-reach on top of a real core — flag them narrowly; do not adopt them as fact, and do not let them discredit the real core either.', restsOn: ['f-shared-core'] },
  ],
  perspectives: [
    { id: 'p-plant', label: 'The plant-forward advocates\' view', heldBy: 'the film and many nutrition researchers', steelman: 'At its strongest: heart disease is the #1 killer and diet is a lever we control; more whole plants and fibre and less red/processed and ultra-processed food genuinely lower cardiovascular risk; many people — including elite athletes — thrive plant-based; and a comprehensive plant-centered lifestyle has actual trial evidence of reversing coronary disease. Moving the plate toward plants is one of the most evidence-backed health changes a person can make.' },
    { id: 'p-omnivore', label: 'The whole-food omnivore / freedom view', heldBy: 'many clinicians and everyday eaters', steelman: 'At its strongest: humans are omnivores; meat is a complete, nutrient-dense protein (B12, heme iron, creatine) that has fed thriving peoples for millennia. The real villain is ultra-processed junk and excess, not meat itself; a well-built omnivore diet — real food, mostly plants, some quality meat, little processed — is excellent, and no single diet is morally or medically mandatory for everyone.' },
    { id: 'p-critic', label: 'The careful-science / anti-cherry-pick view', heldBy: 'the film\'s scientific fact-checkers', steelman: 'At its strongest: the film OVERSTATED — it leaned on small or weak studies, misread the gladiator evidence, oversimplified saturated fat, and omitted large studies that disagree. The honest, defensible position is the SHARED core (more whole food, far less ultra-processed) WITHOUT the vegan-superiority ideology bolted on top. Truth is served by neither swallowing the film nor dismissing the real harm it points at.' },
    { id: 'p-word', label: 'The believer\'s freedom-and-stewardship view', heldBy: 'Scripture', steelman: 'At its strongest: the Word gives BOTH the herb and every moving thing for food (Genesis 1:29; 9:3) and explicitly forbids making meat-abstinence a doctrine or judging one another over food (1 Timothy 4:3-4; Romans 14) — AND it commands stewardship of the body as God\'s temple and warns against gluttony (1 Corinthians 6:19-20; Proverbs 23:20-21). So: real freedom in WHAT you eat, real responsibility in HOW you steward the temple. Freedom and wisdom together — never a diet law.' },
  ],
  lens: {
    fourD: {
      deepSource: 'Scripture will not let this become a diet religion. Yahweh gave the green herb for food (Genesis 1:29) AND, after the flood, "Every moving thing that liveth shall be meat for you; even as the green herb have I given you all things" (Genesis 9:3) — plants and meat, both from His hand. He names making meat-abstinence a doctrine as a danger: men "commanding to abstain from meats, which God hath created to be received with thanksgiving... For every creature of God is good, and nothing to be refused, if it be received with thanksgiving" (1 Timothy 4:3-4). Food is not where righteousness lives — "the kingdom of God is not meat and drink" (Romans 14:17) — and we are not to judge one another over it (Romans 14:2-3). YET the body is His temple to steward well (1 Corinthians 6:19-20; 1 Corinthians 10:31), gluttony is warned against (Proverbs 23:20-21), and Daniel\'s humble ten-day pulse test was honored (Daniel 1:12-15). So the Word corrects the film\'s IDEOLOGY — plant-only as THE moral way, meat as evil — while fully affirming the real call to tend the temple and flee the junk that harms it. It never disputes the documented damage; it disputes the doctrine.',
      scripture: 'Genesis 1:29; Genesis 9:3; 1 Timothy 4:1-5; Romans 14:2-3,17; 1 Corinthians 6:19-20; 1 Corinthians 10:31; Daniel 1:12-15; Proverbs 23:20-21',
    },
    threeD: 'Practically: SPEAK the truth plainly — the ultra-processed, heart-disease-driving Western diet is doing real, measured harm; eating far more whole plants and fibre and far less processed junk is one of the best-supported things you can do for your body. That is not "one side." AND enjoy your freedom — meat or no meat is not your righteousness, and no one gets to judge your plate (Romans 14). Do not let a slick film shame you into an ideology; do not let "it\'s just one side" talk you out of the real, documented harm of the junk diet. Steward the temple; hold the freedom.',
    accountability: {
      statement: 'THE TWO COURTS, applied to witnesses and industries. A documentary is a WITNESS, and witnesses answer for their testimony: the film\u2019s makers are accountable for cherry-picked claims presented as settled \u2014 "every idle word that men shall speak, they shall give account thereof in the day of judgment" (Matthew 12:36) \u2014 and WE are accountable for what we repeat and share (Proverbs 18:17 is a duty, not a suggestion). The industries whose ultra-processed products do real, measured harm are accountable in both courts: what marketing law permits, the eternal court still weighs (Ecclesiastes 12:14; Galatians 6:7), and the damage to bodies during life \u2014 the years lost to the #1 killer \u2014 is seen now, not only at the end. And the believer\u2019s own accountability: steward the temple honestly (1 Corinthians 6:19-20) \u2014 neither swallowing an ideology nor hiding behind "it\u2019s contested" to keep eating what is documented to harm.',
      scripture: 'Matthew 12:36; Ecclesiastes 12:14; Galatians 6:7; Proverbs 18:17; 1 Corinthians 6:19-20',
    },
    benefits: [
      'Both courts, honestly held: earthly justice is real but imperfect \u2014 some of the guilty walk free and some of the innocent suffer or sit in prison (Ecclesiastes 8:14; Joseph, Genesis 39:20; and the sinless Christ, "this man hath done nothing amiss," Luke 23:41) \u2014 while the ETERNAL court misses nothing and lands after this life (Ecclesiastes 12:14; Hebrews 9:27). Since all suffer and die regardless, the wise path is His way for the reward that outlasts it all (2 Corinthians 4:17; Hebrews 11:24-26).',
      'Freedom from food-guilt and diet-tribe legalism — Romans 14 forbids exactly that judgment.',
      'The ability to hold BOTH: real, documented dietary damage is real AND no single diet is mandated.',
      'A repeatable skill: state established fact plainly, flag the film\'s cherry-picks narrowly, measure the ideology by the Word.',
      'A healthier temple without a new law — more whole food, less ultra-processed, gratitude and portion.',
      'Truth and grace on the plate: see the real harm clearly without condemning anyone\'s dinner.',
    ],
    graceNote: 'This lesson condemns no one — not for eating meat, not for eating plants. Romans 14 forbids that judgment by name. It calls no one a glutton and calls no one to veganism; it honors the freedom God gave and the body He entrusted. Truth about real harm and grace toward real people meet at the same table.',
    stewardship: 'The durable move is not joining a diet tribe; it is stewardship: more whole food, far less ultra-processed, honest portions, and gratitude — with full freedom of conscience about meat. Daniel\'s ten-day pulse test (Daniel 1:12-15) is the model: humble, evidence-checking care of the body, offered to God — not a vegan mandate, not a shrug at real harm.',
    anchor: { ref: '1 Timothy 4:4', theme: 'Every creature of God is good, and nothing to be refused, if it be received with thanksgiving — freedom and gratitude over food-law, while the temple is still stewarded.' },
  },
  reflection: {
    skill: 'When a documentary makes you feel you MUST change or be wrong: run three tiers. (1) What here is established fact / real damage? State it plainly — do not hedge it. (2) What is genuinely contested — including the film\'s OWN cherry-picked claims? Flag it narrowly. (3) Where is the ideological jump? Measure THAT by the Word, and let the real data stand. Commit to the truth; do not hide in "both sides," do not launder weak claims.',
    practice: 'Take one claim from the film. Sort it: established fact, genuinely contested, or ideological over-reach? Find one real source (the lesson cites four you can open). Then write one sentence stating what IS documented plainly, and one sentence on the freedom the Word gives about the rest.',
    prompts: [
      'Which of the film\'s points are documented facts (heart disease, ultra-processed harm) and which are contested or cherry-picked (gladiators, "optimal for all")? How would you check each?',
      'Where did you feel pulled to either swallow the whole film OR dismiss all of it? Why are both of those a failure to see the truth?',
      'What does the Word actually correct here — the health data, or the "you must be vegan / meat is evil" ideology? Cite the verse.',
      'Romans 14 forbids judging each other over food. How do you speak plainly about real dietary harm WITHOUT judging someone\'s dinner?',
      'What is one stewardship change (more whole food, less ultra-processed) you could make in freedom — not as a law, but as care for the temple?',
    ],
  },
  levels: {
    child: 'Some movies really want you to eat only one way. Here\'s the true part: too much junk food (soda, chips, candy, fast food) really does hurt your heart — doctors know that for sure, it\'s not just an opinion. So eat lots of real food, especially fruits and vegetables! But the Bible says God gave us BOTH plants AND meat to eat and to say thank You for (Genesis 9:3), and it is not kind or fair to judge someone for what\'s on their plate. Eat healthy, say thank You to God, and be kind about other people\'s food.',
    teen: 'Real talk: a documentary like this mixes true things with overstated things, and it wants you to pick a team. Run the moves. (1) What\'s actually TRUE and documented? Heart disease is the #1 killer, and the ultra-processed junk-food diet does real, measured damage — that\'s not "one side," that\'s facts, own it. Eating way more whole plants and less junk is genuinely one of the best things you can do. (2) What did the film OVERSTATE? The "vegetarian gladiators" claim is misread, the evolution/gut-length argument is cherry-picked, and "plants are optimal for everyone" leans on weak studies — humans are omnivores. (3) Where\'s the ideology? "You MUST go vegan / meat is evil." The Bible gives you both plants and meat (Genesis 9:3), says food isn\'t where your righteousness lives (Romans 14:17), and tells people not to judge each other over diet — while still saying take care of your body, it\'s God\'s temple (1 Corinthians 6:19-20). So: speak the truth about junk food plainly, enjoy your freedom about meat, and don\'t let anyone shame you into a food religion.',
    senior: 'For the seasoned believer, this is discernment in an age of persuasive, agenda-driven media — and the discipline is to see the truth in BOTH directions. Speak the established fact plainly: heart disease is the nation\'s leading killer, the ultra-processed Western diet does real and documented harm, and a whole-food, plant-rich, less-processed pattern is among the best-evidenced changes a person can make (the Ornish trial even showed a comprehensive plant-centered lifestyle regressing coronary disease). Refusing to say so — hiding real harm behind "well, it\'s contested" — would be a failure to see the truth (DR-0100). AND refuse the over-reach: the film cherry-picks (the gladiators, the gut-length argument, saturated fat oversimplified, "optimal for all"), and its deeper claim — that plant-only is THE way and meat is wrong — is an ideology the Word will not bless. Scripture gives both the herb and every moving thing (Genesis 1:29; 9:3), forbids making abstinence from meats a doctrine (1 Timothy 4:3-4), and forbids judging a brother over his plate (Romans 14) — while commanding real stewardship of the temple and warning against gluttony (1 Corinthians 6:19-20; Proverbs 23:20-21). Hold both: name the real harm without flinching, honor the freedom without judging, and steward the body as Daniel did (Daniel 1:12-15) — evidence in hand, offered to God, no diet religion.',
  },
};


// =============================================================================
// FOURTH WORKED EXAMPLE — a creator reading Elon Musk through an end-times
// prophetic lens (Nick Jones video; harvested from Darrell 2026-07-10). The
// discernment challenge here is DIFFERENT from Issue 1: not "is the documented
// harm real" but "how do I weigh PROPHETIC and FEAR-FRAMED claims about
// technology by the Word?" DR-0100 tiers run both ways: Musk's own alarming
// statements ARE documented and said plainly; an alleged DELETED interview
// segment is unfalsifiable and labeled so; and the Word — not the fear —
// governs the response (no date-setting, Matthew 24:36; try the spirits,
// 1 John 4:1; a sound mind, 2 Timothy 1:7). Sources verified by live web
// search 2026-07-10 (DR-0076), cited with as-of dates.
// =============================================================================
const PROPHETIC_LENS_ISSUE = {
  id: 'wi-musk-prophetic-lens',
  title: 'A Creator Reading Musk Through End-Times Prophecy — How To Think It Through',
  subject: { name: 'Elon Musk', kind: 'public-figure', isNamedRealPerson: true },
  skill: 'Take a video that reads a tech billionaire through an end-times prophetic lens and learn the discernment moves for PROPHETIC and FEAR-FRAMED content: state what the man actually, documentably said (his own words are evidence — say them plainly), label the unverifiable (a claim about a DELETED recording can never be checked — that is a red flag, not a revelation), test every spiritual interpretation by the Word (1 John 4:1), refuse date-setting the Lord Himself refused (Matthew 24:36), and let watchfulness produce a sound mind and building — never panic.',
  source: {
    creator: 'Nick Jones',
    medium: 'video',
    title: 'a video examining Elon Musk\u2019s statements through a biblical / end-times prophetic lens',
    url: 'https://www.youtube.com/',
    asOf: '2026-07-10',
    note: 'A prophecy-focused commentary creator. We examine this as ONE creator\u2019s argument — sourced and labeled — not as truth to repeat. The lesson holds regardless of which creator made it: prophetic-lens tech commentary is a whole genre.',
  },

  claims: [
    {
      id: 'c-legion',
      text: 'Musk wants to father a "legion" of children via surrogates before an "apocalypse."',
      label: 'claim',
      attribution: 'Nick Jones (the creator), reporting the Wall Street Journal investigation',
      note: 'The core is documented REPORTING: the WSJ (April 2025) published his reported text — "To reach legion-level before the apocalypse, we will need to use surrogates." His own word choice; the creator repeats it accurately. What the "apocalypse" means to Musk (population collapse, which he has warned about publicly, vs. biblical apocalypse) is interpretation.',
    },
    {
      id: 'c-demon',
      text: 'Musk warned that developing advanced AI is "summoning the demon."',
      label: 'claim',
      attribution: 'Nick Jones (the creator), in his video',
      note: 'Documented — on video, MIT AeroAstro centennial, October 2014. He said it; say it plainly.',
    },
    {
      id: 'c-nukes',
      text: 'Musk compared AI danger to nuclear weapons.',
      label: 'claim',
      attribution: 'Nick Jones (the creator), in his video',
      note: 'Documented — his own August 2014 post: AI is "potentially more dangerous than nukes."',
    },
    {
      id: 'c-2027',
      text: 'In a DELETED segment of a Lex Fridman interview, Musk predicted a major societal shift after 2027.',
      label: 'allegation',
      attribution: 'Nick Jones (the creator), in his video',
      note: 'UNVERIFIABLE by construction: a claim about content that was allegedly deleted cannot be checked by anyone. Live search (2026-07-10) found no evidence the segment exists. This label is the whole lesson: an uncheckable claim is not evidence, however confidently narrated.',
    },
    {
      id: 'c-solutions',
      text: 'Musk\u2019s answers to the threats he names are Neuralink (brain-AI "symbiosis") and SpaceX (a multi-planetary "escape plan").',
      label: 'claim',
      attribution: 'Nick Jones (the creator), characterizing Musk\u2019s stated company missions',
      note: 'That Musk states these purposes (symbiosis with AI; making life multi-planetary as a hedge against earth-bound catastrophe) is his own public framing. "Escape plan" as a spiritual indictment is the creator\u2019s interpretation layered on top.',
    },
    {
      id: 'c-ai-gospel',
      text: 'Tech companies are creating their own "gospel" — an all-knowing AI companion that substitutes for spiritual fulfillment; Christians must stay vigilant.',
      label: 'opinion',
      attribution: 'Nick Jones (the creator), his spiritual conclusion',
      note: 'A theological interpretation and a call to vigilance — to be TESTED by the Word (1 John 4:1), not swallowed because it is scary or dismissed because it is dramatic. Parts of it the Word plainly supports; the lesson works that out below.',
    },
  ],

  verifiable: [
    {
      id: 'f-demon-nukes',
      statement: 'Musk\u2019s alarm-language about AI is documented in his own words: at MIT\u2019s AeroAstro centennial (October 2014) he said "With artificial intelligence we are summoning the demon," and in August 2014 he posted that AI is "potentially more dangerous than nukes."',
      status: 'documented',
      sources: [
        { title: 'Elon Musk: \u2018With artificial intelligence we are summoning the demon.\u2019', publisher: 'The Washington Post', url: 'https://www.washingtonpost.com/news/innovations/wp/2014/10/24/elon-musk-with-artificial-intelligence-we-are-summoning-the-demon/', asOf: '2014-10-24' },
        { title: 'Elon Musk says artificial intelligence is like "summoning the demon"', publisher: 'CBS News', url: 'https://www.cbsnews.com/news/elon-musk-artificial-intelligence-is-like-summoning-the-demon/', asOf: '2014-10-27' },
      ],
      note: 'Re-verified by live web search 2026-07-10. His words, on the record — stated plainly (DR-0100 tier 1). What the words MEAN spiritually is a separate, interpretive question.',
    },
    {
      id: 'f-legion',
      statement: 'The Wall Street Journal (April 2025) reported, from records and interviews, that Musk has fathered at least 14 children and texted that "To reach legion-level before the apocalypse, we will need to use surrogates" — widely corroborated coverage of the reported texts followed (Forbes, Axios).',
      status: 'partly-documented',
      sources: [
        { title: 'Musk\u2019s \u2018Legion\u2019: Report Details Richest Man\u2019s Multiple Children And \u2018Harem Drama\u2019', publisher: 'Forbes', url: 'https://www.forbes.com/sites/saradorn/2025/04/16/musks-legion-report-details-richest-mans-multiple-children-and-harem-drama/', asOf: '2025-04-16' },
        { title: 'Musk\u2019s baby machine: Inside his mission to spike the birth rate', publisher: 'Axios', url: 'https://www.axios.com/2025/04/17/elon-musk-babies-ashley-st-clair', asOf: '2025-04-17' },
      ],
      note: 'The REPORTING and the quoted texts are documented; the underlying private exchanges are the WSJ\u2019s sourced account, not court-tested. His public warnings about population collapse are on the record; whether his "apocalypse" is demographic or eschatological is not established.',
    },
    {
      id: 'f-2027-unverified',
      statement: 'The "deleted Lex Fridman segment where Musk predicts a post-2027 shift": live search (2026-07-10) finds NO evidence such a segment existed — no archived copy, no contemporaneous reporting, no statement from either party. A claim about deleted content is unfalsifiable: it cannot be proven false, which is precisely why it carries no evidential weight.',
      status: 'disputed',
      sources: [
        { title: 'No corroborating record found (negative search result, live web search)', publisher: 'PoeTech verification pass', url: 'https://lexfridman.com/elon-musk-transcript', asOf: '2026-07-10' },
      ],
      note: 'The honest label is the teaching: "you can\u2019t disprove it" is not a point in a claim\u2019s favor — it is the signature of a claim built to evade checking (Proverbs 18:17 cannot even be applied, because there is nothing to examine).',
    },
  ],

  interpretation: [
    { id: 'n-words-vs-meaning', statement: 'Musk\u2019s documented words ("summoning the demon," "more dangerous than nukes," "legion... before the apocalypse") are evidence of what he SAID and how he frames his own work — said plainly. Reading them as literal end-times testimony, hidden knowledge, or prophecy fulfillment is the creator\u2019s interpretation; a man\u2019s metaphors are not oracles, and his fears are not revelations.', restsOn: ['f-demon-nukes', 'f-legion'] },
    { id: 'n-unfalsifiable', statement: 'Building an argument on an allegedly DELETED recording is an interpretive move that removes the claim from every court — no source, no witness, no text to examine. Whatever else is true, that piece carries zero evidential weight, and content that leans on it should be weighed accordingly.', restsOn: ['f-2027-unverified'] },
    { id: 'n-vigilance-real', statement: 'The creator\u2019s CORE spiritual caution — that an always-available, all-knowing-seeming AI companion can function as a counterfeit source of guidance and comfort — is an interpretation the Word itself substantiates (test the spirits; no substitute for the Spirit of truth). That part is not dismissed with the video\u2019s weak pieces; DR-0100 runs both ways.', restsOn: ['f-demon-nukes'] },
  ],

  perspectives: [
    {
      id: 'p-prophetic',
      label: 'The prophetic-watchman view of the unresolved parts',
      heldBy: 'Nick Jones and many prophecy-focused believers',
      steelman: 'The documented record is not this view\u2019s claim — Musk\u2019s own words are on the record. What this view adds: when the world\u2019s most resourced technologist describes his own field as "summoning the demon" and races to wire brains to it anyway, believers should read the times (the Lord rebuked those who could not, Matthew 16:3); Scripture does foretell deception at scale in the last days; and a generation discipled by machine companions is a spiritual battleground whether or not any date is right. Watchfulness is commanded, not optional.',
    },
    {
      id: 'p-skeptic',
      label: 'What the careful reading answers — and what it leaves standing',
      heldBy: 'believers committed to sober verification',
      steelman: 'Heard at its strongest, careful reading answers real problems in the video: the 2027 "deleted segment" is unfalsifiable and should carry no weight; metaphors ("demon," "legion") are being read as confessions; and fear-framed prophecy content is itself an attention economy — outrage and dread click just like rage does. But it does NOT answer everything: Musk really did say these things, the AI-companion discipleship concern is real and biblical, and "calm down, it\u2019s just marketing" can be its own form of sleep. Sobriety and watchfulness are the same command ("watch and be sober," 1 Thessalonians 5:6) — not rivals.',
    },
    {
      id: 'p-builder',
      label: 'The sovereign-builder view',
      heldBy: 'believers building alternatives (this platform among them)',
      steelman: 'The durable response to "their AI will disciple your children" is not a video or a panic — it is to BUILD: sovereign tools where the Word is the source of answers, where the family owns the data, and where the technology serves The Way instead of substituting for it. Watchfulness that only consumes warnings changes nothing; watchfulness that builds changes the defaults a household lives inside.',
    },
  ],

  lens: {
    fourD: {
      deepSource: 'The Word governs BOTH errors this genre invites — the sleep that ignores the times and the panic that pretends to know them. First, watchfulness is commanded: "Take heed that no man deceive you" (Matthew 24:4) is the Lord\u2019s own first word about the end times — and it cuts at the video AND at the technologies the video fears; deception can arrive as a machine companion or as a confident narrator. "Beloved, believe not every spirit, but try the spirits whether they are of God" (1 John 4:1) — every prophetic interpretation submits to testing, no matter how urgent it sounds. Second, date-setting is forbidden territory: "But of that day and hour knoweth no man, no, not the angels of heaven, but my Father only" (Matthew 24:36) — a "2027 shift" sourced to a recording no one can produce fails twice, as evidence and as doctrine. Third, the Word names the PATTERN under the tech without needing any hidden segment: Babel — "let us build us a city and a tower, whose top may reach unto heaven; and let us make us a name" (Genesis 11:4) — humanity engineering its own transcendence, its own name, its own escape; and the Psalmist\u2019s verdict on engineered security: "Some trust in chariots, and some in horses: but we will remember the name of the LORD our God" (Psalm 20:7); "Except the LORD build the house, they labour in vain that build it" (Psalm 127:1). A brain implant cannot democratize wisdom and a second planet cannot outrun the Judge of all the earth. Fourth, the counterfeit the creator warns of is real and the Word already named the original: guidance belongs to "the Spirit of truth... he will guide you into all truth" (John 16:13) — an AI companion that answers everything, remembers everything, and is always available is a plausible counterfeit of exactly that, and the household that lets it disciple its children has traded the Voice for an echo. And fifth, the believer\u2019s posture in every apocalypse-shaped conversation is neither dread nor scoffing: "then look up, and lift up your heads; for your redemption draweth nigh" (Luke 21:28) — "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind" (2 Timothy 1:7).',
      scripture: 'Matthew 24:4; Matthew 24:36; 1 John 4:1; Genesis 11:4; Psalm 20:7; Psalm 127:1; John 16:13; Luke 21:28; 2 Timothy 1:7; 1 Thessalonians 5:6; Proverbs 18:17; Ecclesiastes 12:14',
    },
    threeD: 'Practically: say the documented parts plainly — Musk DID call AI "summoning the demon," DID compare it to nukes, and the WSJ DID report his "legion before the apocalypse" texts; do not soften his own words to make the story smaller. Then keep the categories: the "deleted 2027 segment" is unverifiable and carries no weight — a claim you cannot check is not a secret, it is a red flag. Test the spiritual reading by the Word: the AI-companion-as-counterfeit-shepherd concern is biblical and serious (John 16:13 names the real Guide); the date-shaped dread is not (Matthew 24:36). And put the energy where the Word puts it: guard what disciples your household, build sovereign alternatives, and keep a sound mind — watchful, unafraid, building.',
    accountability: {
      statement: 'THE TWO COURTS, applied to prophets and platforms alike. The CREATOR is accountable for his testimony: presenting an unverifiable "deleted segment" as evidence is bearing witness that cannot be examined — and "every idle word that men shall speak, they shall give account thereof in the day of judgment" (Matthew 12:36); fear, like outrage, is a product, and those who sell it answer for it. MUSK is accountable for his own recorded words and for what he builds: no earthly regulator has ruled on "summoning the demon" while racing to build it, on wiring human minds to the thing he compared to a demon, or on fathering a "legion" through reported surrogate arrangements — man\u2019s courts have no docket for most of this, and that is the point: what the governments never rule on still enters the eternal court, where "God shall bring every work into judgment, with every secret thing" (Ecclesiastes 12:14), and the shaping of millions of minds and a generation\u2019s attention is weighed as impact on life DURING life. THE PLATFORMS are accountable for the counterfeit: building companions designed to be trusted like counselors while engineered like slot machines is a false balance (Proverbs 11:1). And WE are accountable for what we repeat: passing along an uncheckable claim because it thrills us is joining the false witness (Exodus 23:2 — nor follow a crowd into it); and going silent about the REAL discipleship threat because the messenger overreached is muting a true warning (Isaiah 5:20 runs both ways). No one gets away — "Be not deceived; God is not mocked" (Galatians 6:7).',
      scripture: 'Ecclesiastes 12:14; Matthew 12:36; Proverbs 11:1; Exodus 23:2; Isaiah 5:20; Galatians 6:7; 2 Corinthians 5:10',
    },
    benefits: [
      'Both courts, honestly held: earthly justice is real but imperfect \u2014 some of the guilty walk free and some of the innocent suffer or sit in prison (Ecclesiastes 8:14; Joseph, Genesis 39:20; and the sinless Christ, "this man hath done nothing amiss," Luke 23:41) \u2014 while the ETERNAL court misses nothing and lands after this life (Ecclesiastes 12:14; Hebrews 9:27). Since all suffer and die regardless, the wise path is His way for the reward that outlasts it all (2 Corinthians 4:17; Hebrews 11:24-26).',
      'Freedom from apocalypse-content whiplash — neither swallowing the dread nor scoffing at the watchfulness.',
      'A repeatable test for prophetic media: documented words said plainly, unverifiable claims weighed at zero, every interpretation tried by the Word (1 John 4:1).',
      'The Babel lens — you can name the ancient pattern under new technology without needing hidden knowledge.',
      'A guarded household — clear eyes about what an always-available AI companion is, and is not, allowed to disciple.',
      'A sound mind in end-times conversations: watchful, unafraid, and building (2 Timothy 1:7; Luke 21:28).',
    ],
    graceNote: 'This lesson pronounces no verdict on Elon Musk\u2019s soul, nor on Nick Jones\u2019s — that judgment belongs to God alone (Romans 14:4; James 4:12). A man who says "we are summoning the demon" is a man who knows something is at stake; the believer\u2019s prayer for him is not smaller than the believer\u2019s concern about his works. Deeds are named; warnings are tested; souls are left with God — and the Door stands open to every one of them (John 10:9).',
    stewardship: 'The deeper response to "their AI is becoming a counterfeit shepherd" is to build under the true One: sovereign tools where the Word is the source of answers, family-owned data, technology that serves The Way instead of substituting for it — this platform is one small act of exactly that. Watch, test, and build; do not merely subscribe to warnings.',
    anchor: {
      ref: 'Matthew 24:4',
      theme: 'Take heed that no man deceive you — the Lord\u2019s first end-times command covers the machine AND the messenger. Watchfulness tests everything by the Word; it never outsources the watching to fear.',
    },
  },

  reflection: {
    skill: 'When end-times content about technology stirs you: PAUSE. Separate the man\u2019s DOCUMENTED words (say them plainly) from the narrator\u2019s INTERPRETATION (test it by the Word) from the UNVERIFIABLE (weigh it at zero — a deleted-recording claim cannot be examined). Refuse date-setting (Matthew 24:36). Keep the true warning even when the messenger overreaches. Then respond the way the Word directs: guard your household\u2019s discipleship, build alternatives, keep a sound mind.',
    practice: 'Take ONE claim from any prophetic or end-times video you have seen this month. Sort it into the three bins: documented (find the primary source), interpretation (write the verse that tests it), or unverifiable (note why it cannot be checked). Then write one sentence on a watchful, building response — something you will guard or build, not just a feeling.',
    prompts: [
      'Musk really said "with artificial intelligence we are summoning the demon." What is the difference between taking a man\u2019s words seriously and taking them as prophecy?',
      'Why does a claim about a DELETED interview segment carry zero evidential weight — and why is "well, you can\u2019t disprove it" a red flag rather than a defense?',
      'The Lord said no man knows the day or hour (Matthew 24:36). How do you honor watchfulness without slipping into date-shaped dread?',
      'Where is the Babel pattern (Genesis 11:4 — our own tower, our own name, our own escape) visible in Neuralink\u2019s and SpaceX\u2019s stated missions — and where would that reading overreach?',
      'The creator\u2019s core warning — an AI companion as counterfeit shepherd — what does your household currently let answer its questions first, and what would putting the Spirit of truth (John 16:13) back in that seat look like?',
      'What is one thing you will BUILD or GUARD this month in response — rather than one more warning you subscribe to?',
    ],
  },

  levels: {
    child: 'Sometimes videos say scary things about the future — about robots, computers, or the end of the world. Here is how to be a wise detective AND keep a happy heart. First: did the person really say the words the video says? Sometimes yes — a famous inventor really did say that making super-smart computers is like "summoning a demon." That is a real quote! But second: if a video says "he said something in a SECRET video that got DELETED" — be careful! Nobody can check a deleted video, so nobody knows if it is true. And third, the most important: Jesus said NOBODY knows the day the world ends — only Father God knows (Matthew 24:36). So when someone says they figured out the date, they are guessing. God did not give us a spirit of being scared — He gave us power, love, and a calm, strong mind (2 Timothy 1:7). So do not be afraid of robots or the future. Trust God, ask your parents your questions, and remember: computers can be helpful tools, but only God gets to be God.',
    teen: 'Real talk: end-times tech content is its own genre, and it runs on the same fuel as outrage content — except the click is dread instead of anger. Run the moves. (1) Documented or not? Musk actually said AI is like "summoning the demon" (MIT, 2014, on video) and "potentially more dangerous than nukes" (his own post). The WSJ actually reported his "legion before the apocalypse" texts. Real quotes — say them plainly; his own words matter. (2) Spot the unfalsifiable: "a DELETED segment where he predicts 2027" — stop. Nobody can check a deleted recording. A claim built so it CAN\u2019T be checked isn\u2019t secret knowledge; it\u2019s a red flag. (3) No date-setting, ever: Jesus said flat out that no man knows the day or hour (Matthew 24:36) — anyone selling you a year is selling. (4) BUT don\u2019t throw out the true warning with the weak evidence: an AI "companion" that answers everything, never sleeps, and learns exactly what you want to hear really can become a counterfeit voice in your life — and the Word already named the real Guide (John 16:13). So: take Musk\u2019s words seriously without treating them as prophecy, weigh uncheckable claims at zero, keep your peace (2 Timothy 1:7), and put your energy into what you build and who disciples you — not into a countdown.',
    senior: 'For the seasoned believer, this genre demands the double discipline of 1 Thessalonians 5:6 — "watch and be sober" — held as one command, not two camps. Sobriety first: the documented record is stated plainly (DR-0100) — Musk\u2019s "summoning the demon" (MIT, October 2014), his "more dangerous than nukes" post (August 2014), and the WSJ\u2019s April 2025 reporting of the "legion... before the apocalypse" texts are real; a discerning teacher neither softens them nor gilds them. The alleged deleted 2027 segment is weighed at zero — unfalsifiable testimony has no standing in any court, man\u2019s or the Word\u2019s (even Proverbs 18:17\u2019s cross-examination cannot reach a recording no one can produce), and date-shaped foreboding trespasses on Matthew 24:36. Watchfulness second: the creator\u2019s core concern survives his weakest evidence. The Babel pattern (Genesis 11:4) — engineered transcendence, a made name, an escape from the consequences of earth — is legible in "symbiosis" and multi-planetary hedging without any hidden knowledge; and the counterfeit-shepherd concern is the serious one: a generation discipled by an always-available, all-knowing-seeming companion is a catechesis question, and the Word names the only Guide into all truth (John 16:13). The seasoned failure modes are symmetrical: the scoffer who hears nothing because the messenger overreached, and the watchman who repeats everything because it is vivid. Hold the line of the fathers: test all things, hold fast the good, keep a sound mind (2 Timothy 1:7), look up rather than down (Luke 21:28) — and answer counterfeit shepherds the old way: build true folds.',
  },

  quiz: {
    questions: [
      {
        q: 'The video quotes Musk saying AI is like "summoning the demon." Is that documented?',
        options: ['No — it\u2019s a rumor', 'Yes — on video at MIT in October 2014; say it plainly', 'Only in a deleted interview'],
        answer: 1,
        explain: 'His own words, on the record (Washington Post/CBS, October 2014). Documented words are stated plainly — the interpretive question is what they MEAN, not whether he said them.',
      },
      {
        q: 'The video cites a DELETED Lex Fridman segment where Musk allegedly predicts a 2027 shift. How much evidential weight does that carry?',
        options: ['A lot — deletion proves it was important', 'Zero — a claim about deleted content cannot be checked by anyone; unfalsifiable claims are a red flag, not hidden knowledge', 'Some — if the narrator sounds confident'],
        answer: 1,
        explain: 'Nothing can examine it — no archive, no witness, no text. "You can\u2019t disprove it" is the signature of a claim built to evade checking, not a point in its favor.',
      },
      {
        q: 'Someone tells you the big shift comes after 2027. What does the Word say about that kind of claim?',
        options: ['Study it — the date might be right', '"Of that day and hour knoweth no man" (Matthew 24:36) — date-setting is forbidden territory, however watchful we are commanded to be', 'Dates are fine if the trend lines support them'],
        answer: 1,
        explain: 'Watchfulness is commanded (Matthew 24:4); the calendar is withheld (Matthew 24:36). Any teacher selling a year has left the text.',
      },
      {
        q: 'The creator warns that AI companions could become a substitute "gospel." What is the discerning response?',
        options: ['Dismiss it — the video also used weak evidence', 'Test it by the Word and keep what stands: the counterfeit-shepherd concern is real (John 16:13 names the true Guide), even though the date-claims fail', 'Believe the whole video since part of it is right'],
        answer: 1,
        explain: 'DR-0100 runs both ways: weak evidence does not sink a true warning, and a true warning does not float weak evidence. Each claim is weighed on its own.',
      },
      {
        q: 'What is the believer\u2019s posture after watching end-times tech content?',
        options: ['Dread — the end is close', 'Scoffing — it\u2019s all clickbait', 'A sound mind: watchful, tested by the Word, unafraid, and BUILDING what guards the household (2 Timothy 1:7; Luke 21:28)'],
        answer: 2,
        explain: 'Neither sleep nor panic. Watch and be sober are one command (1 Thessalonians 5:6) — and watchfulness that builds changes what a household lives inside.',
      },
    ],
  },
};


// =============================================================================
// ISSUE 5 — a physician's sweeping critique of the medical establishment
// (Dr. Stella Immanuel, same interview as Living Lessons L22/L23). The hardest
// DR-0100 case yet: a mix of DOCUMENTED institutional facts (the 1986 liability
// shield; nutrition-education gaps; real neglected US parasites; her own 2020
// license history), a DOCUMENTED-BUT-MISATTRIBUTED statistic (the 1-in-31
// autism figure is the real 2025 CDC number — her CAUSE claim is the part the
// evidence contradicts), and FALSIFIED claims (the Amish "control group"; the
// SIDS-from-vaccines claim — the record shows the opposite). SPEAK-ESTABLISHED-
// FACT (DR-0100) cuts BOTH ways here: the real institutional failures are
// stated plainly AND the vaccine-autism / Amish / SIDS claims are named as
// contradicted by the evidence — under-claiming a true harm and over-claiming a
// false cause are BOTH failures of truth. No medical advice is given; the skill
// is discernment of authority-vs-evidence, not a treatment protocol. Every
// figure verified by live web search 2026-07-11 (DR-0076), cited with as-of.
// =============================================================================
const MEDICAL_ESTABLISHMENT_ISSUE = {
  id: 'wi-medical-establishment',
  title: 'A Doctor Indicts Her Own Profession — Sorting True Reform From False Cause',
  subject: { name: 'Dr. Stella Immanuel', kind: 'public-figure', isNamedRealPerson: true },
  skill: 'Take a credentialed insider\u2019s sweeping indictment of her own field and learn the hardest discernment move: a real doctor naming REAL institutional failures (a liability shield, thin nutrition training, neglected parasites) in the SAME breath as claims the evidence contradicts (vaccines cause the autism rise; the Amish don\u2019t vaccinate or get autism; vaccines cause SIDS). Credentials are not evidence and evidence is not credentials \u2014 you weigh each CLAIM by its data, keep the true reforms without swallowing the false causes, and refuse to let a messenger\u2019s real courage under fire launder her unproven science. DR-0100 both ways: state the documented harm plainly; name the falsified claim plainly; never average them into "who knows."',
  source: {
    creator: 'Dr. Stella Immanuel (interviewed on "We Need to Talk")',
    medium: 'video',
    title: 'a physician\u2019s critique of medical training, the vaccine schedule, and pharmaceutical liability',
    url: 'https://youtu.be/jiRPhN-lPcs',
    asOf: '2026-07-11',
    note: 'A credentialed physician (Texas license, pediatrics/emergency medicine) who gained a national platform in 2020. We examine her CLAIMS \u2014 sourced and sorted \u2014 not her person; the lesson holds for any authority-figure indictment of an institution.',
  },

  claims: [
    {
      id: 'c-liability',
      text: 'Vaccine makers, and the doctors/nurses who inject them, cannot be sued if a childhood vaccine injures a child.',
      label: 'claim',
      attribution: 'Dr. Immanuel',
      note: 'DOCUMENTED and true in substance: the National Childhood Vaccine Injury Act of 1986 routes claims through the no-fault Vaccine Injury Compensation Program (VICP) instead of ordinary lawsuits, and shields manufacturers from liability for unavoidable side effects. This is her strongest, most checkable point \u2014 state it plainly.',
    },
    {
      id: 'c-nutrition',
      text: 'Most doctors graduate medical school knowing little about how nutrition affects disease, because natural medicine was stripped from the curriculum.',
      label: 'claim',
      attribution: 'Dr. Immanuel',
      note: 'The nutrition-gap half is DOCUMENTED: ~71% of US medical schools fail the National Academy of Sciences\u2019 recommended 25 hours of nutrition education; the average is ~19-24 hours total. The Flexner/Rockefeller history is MORE real than a bare conspiracy label allows (see f-flexner) \u2014 the 1910 Carnegie-commissioned Flexner Report did standardize allopathic training and closed most homeopathic/eclectic schools, and Rockefeller money funded the reforms. The honest fork is MOTIVE: "raise scientific standards after documenting real quackery" (the mainstream reading) vs "deliberately suppress natural medicine" (her reading) \u2014 the closures are fact; the intent is contested.',

    },
    {
      id: 'c-parasites',
      text: 'US doctors dismiss human parasites as a "third world disease" and refuse to treat them, though parasites drive much American chronic illness.',
      label: 'claim',
      attribution: 'Dr. Immanuel',
      note: 'PARTLY DOCUMENTED: the CDC names five "neglected parasitic infections" IN THE US (Chagas, cysticercosis, toxoplasmosis, toxocariasis, trichomoniasis) that are genuinely under-diagnosed \u2014 300,000+ with Chagas, millions with toxoplasmosis. That real neglect is TRUE. The leap to "parasites cause much of America\u2019s chronic disease and cancer" and routine self-"deworming" is NOT established, and the commerce built on it is a conflict of interest.',
    },
    {
      id: 'c-autism-cause',
      text: 'US autism rose from 1 in 1,000 to 1 in 31 BECAUSE of vaccines.',
      label: 'claim',
      attribution: 'Dr. Immanuel',
      note: 'The NUMBER is real; the CAUSE is contradicted. 1 in 31 IS the CDC\u2019s 2025 figure (2022 surveillance). But the largest studies \u2014 Hviid 2019, 657,461 Danish children \u2014 find NO association between vaccination and autism, including in high-risk subgroups; the rise tracks broadened diagnostic criteria and screening. A true statistic welded to a falsified cause.',
    },
    {
      id: 'c-amish',
      text: 'The Amish are a natural "control group": they don\u2019t vaccinate and almost never have autism.',
      label: 'claim',
      attribution: 'Dr. Immanuel',
      note: 'FALSE on both premises. Most Amish DO vaccinate (studies: 85-98% have at least some vaccination), and autism DOES occur among Amish children (documented cases; lower REPORTED rates track under-diagnosis and cultural under-reporting, not absence). The "control group" does not exist as described.',
    },
    {
      id: 'c-sids',
      text: '2,000 US babies die every year from SIDS caused by receiving too many vaccines at once.',
      label: 'claim',
      attribution: 'Dr. Immanuel',
      note: 'CONTRADICTED by the evidence, and dangerously so. SIDS deaths (~2,500/yr) are real, but the causal claim is the OPPOSITE of the data: the Vennemann meta-analysis of 9 studies found vaccination associated with roughly HALVING SIDS risk. Attributing SIDS to vaccines is a falsified cause that could cost a child protection.',
    },
    {
      id: 'c-groupthink',
      text: 'When she reported curing 350+ COVID patients with hydroxychloroquine, doctors attacked her and tried to strip her license instead of examining her data.',
      label: 'claim',
      attribution: 'Dr. Immanuel',
      note: 'MIXED and self-serving: the backlash and a 2021 Texas Medical Board corrective action are documented \u2014 AND the underlying claim (HCQ "cures" COVID) failed in controlled trials; the FDA revoked its emergency authorization for lack of benefit. Being attacked is not the same as being right; an anecdotal case series is not the clinical data that settles a treatment.',
    },
    {
      id: 'c-programmed',
      text: 'Doctors are "programmed" \u2014 handed protocols and taught to follow them without reading the studies or questioning the science.',
      label: 'opinion',
      attribution: 'Dr. Immanuel',
      note: 'A sweeping characterization with a grain and an overreach: protocol-driven medicine and time-pressured practice are real and criticized from WITHIN medicine; "they never read the studies and just obey" is a caricature that also happens to elevate the speaker as the lone awakened one \u2014 a rhetorical move to notice.',
    },
    {
      id: 'c-flexner',
      text: 'The "Rockefeller Medical Industrial Complex" sponsored medical schools decades ago specifically to REMOVE natural medicine from the curriculum.',
      label: 'claim',
      attribution: 'Dr. Immanuel',
      note: 'The HISTORY is largely documented; the MOTIVE is the contested part. The 1910 Flexner Report (Carnegie-commissioned) did standardize allopathic education and closed more than half of US medical schools \u2014 especially homeopathic, eclectic, and naturopathic ones \u2014 and Rockefeller philanthropy heavily funded the reforms. Whether the AIM was "raise standards after documenting real quackery" or "deliberately suppress natural cures" is the interpretive fork; the closures themselves are fact.',
    },
    {
      id: 'c-natural-cures',
      text: 'Historical/indigenous cures the establishment ignores work: the pitcher plant (Sarracenia purpurea) treats pox viruses; high-dose Vitamin C plus nitazoxanide can treat Ebola \u2014 and she built supplements on this.',
      label: 'claim',
      attribution: 'Dr. Immanuel',
      note: 'A real research kernel stretched past what it shows. The Sarracenia-vs-poxvirus finding is a genuine 2012 IN-VITRO (lab-dish) study (Arndt et al., PLOS One) \u2014 real, and interesting, but in-vitro inhibition is NOT a validated human treatment, and building/selling a monkeypox supplement on it is exactly the leap the evidence does not license. Nitazoxanide has documented broad antiviral activity in the lab; "cures Ebola with Vitamin C" is not established clinical fact. The pattern: a true citation \u2192 an unproven product.',
    },
  ],

  verifiable: [
    {
      id: 'f-liability-1986',
      statement: 'The National Childhood Vaccine Injury Act of 1986 created a no-fault Vaccine Injury Compensation Program and shields vaccine manufacturers from ordinary civil liability for unavoidable side effects; the program has paid out more than $5.3 billion (as of February 2025). Her liability claim is substantially TRUE.',
      status: 'documented',
      sources: [
        { title: 'National Vaccine Injury Compensation Program \u2014 About', publisher: 'HRSA (US Health Resources & Services Administration)', url: 'https://www.hrsa.gov/vaccine-compensation/about', asOf: '2026-07-11' },
        { title: 'National Childhood Vaccine Injury Act', publisher: 'Wikipedia (citing the 1986 Act, 42 U.S.C. \u00a7300aa)', url: 'https://en.wikipedia.org/wiki/National_Childhood_Vaccine_Injury_Act', asOf: '2026-07-11' },
      ],
      note: 'Verified 2026-07-11. The shield is real and was enacted to keep a vaccine supply after 1980s DPT litigation; a citizen can rightly find the arrangement worth debating. The reform-fact stands on its own \u2014 no conspiracy framing required.',
    },
    {
      id: 'f-nutrition-gap',
      statement: 'US medical schools under-teach nutrition: ~71% fail to provide the National Academy of Sciences\u2019 recommended minimum of 25 hours; students receive ~19-24 contact hours on average. The nutrition-gap claim is DOCUMENTED.',
      status: 'documented',
      sources: [
        { title: 'Nutrition Education in U.S. Medical Schools: Latest Update of a National Survey', publisher: 'Academic Medicine / PMC', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4042309/', asOf: '2026-07-11' },
      ],
      note: 'Verified 2026-07-11. A real, self-criticized gap inside medicine \u2014 stated plainly (DR-0100 tier 1). Note the boundary: "under-taught" is documented; "deliberately stripped by the Rockefeller complex" is a separate causal story \u2014 see f-flexner for what history does and does not establish.',
    },
    {
      id: 'f-flexner',
      statement: 'The Flexner Report (1910, commissioned by the Carnegie Foundation) standardized US medical education on the allopathic/scientific model and led to the closure of more than half of American medical schools \u2014 disproportionately homeopathic, eclectic, and naturopathic ones; Rockefeller philanthropy then funded the reforms heavily. The historical SHIFT she describes is real; the MOTIVE ("to suppress natural cures" vs "to end documented quackery") is what remains contested.',
      status: 'partly-documented',
      sources: [
        { title: 'Flexner Report', publisher: 'Wikipedia (Carnegie Foundation; school closures; Rockefeller funding)', url: 'https://en.wikipedia.org/wiki/Flexner_Report', asOf: '2026-07-11' },
        { title: 'Rockefeller, the Flexner Report, and the American Medical Association', publisher: 'Journal of Medical Humanities / PMC', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12318542/', asOf: '2026-07-11' },
      ],
      note: 'Verified 2026-07-11. A case where the conspiracy-adjacent claim has a real documentary spine \u2014 DR-0100 tier 1 for the events (Carnegie commission, mass closures, Rockefeller money) AND tier 2 for the intent. The Report also documented genuine diploma-mill quackery it was right to end; both can be true, and a just weight holds both.',
    },
    {
      id: 'f-sarracenia',
      statement: 'The pitcher-plant-vs-poxvirus claim rests on a real study: Arndt et al. (2012, PLOS One) characterized Sarracenia purpurea extract inhibiting poxvirus (including variola and monkeypox) replication IN VITRO. But in-vitro (lab-dish) inhibition is not a validated human treatment, and no controlled human trial establishes it as a monkeypox cure \u2014 so the supplement built on it outruns the evidence.',
      status: 'partly-documented',
      sources: [
        { title: 'In Vitro Characterization of a Nineteenth-Century Therapy for Smallpox', publisher: 'PLOS One (Arndt et al., 2012)', url: 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0032610', asOf: '2026-07-11' },
      ],
      note: 'Verified 2026-07-11. The instructive tier-2 case: a REAL citation (the study exists and found real in-vitro activity) stretched to an UNPROVEN product (a sold monkeypox cure). "There is a study" is true; "therefore this supplement treats the disease in people" does not follow \u2014 the gap between in-vitro and clinical is where the overreach and the commerce live. No treatment advice is given here.',
    },
    {
      id: 'f-parasites-real',
      statement: 'The CDC formally recognizes five NEGLECTED parasitic infections IN the United States (Chagas, cysticercosis, toxoplasmosis, toxocariasis, trichomoniasis), genuinely under-diagnosed \u2014 300,000+ Americans with Chagas, millions with toxoplasmosis/toxocariasis. The "US parasites are neglected" claim is DOCUMENTED.',
      status: 'documented',
      sources: [
        { title: 'Neglected Parasitic Infections: What Family Physicians Need to Know \u2014 A CDC Update', publisher: 'American Family Physician / CDC', url: 'https://www.aafp.org/pubs/afp/issues/2021/0900/p277.html', asOf: '2026-07-11' },
      ],
      note: 'Verified 2026-07-11. The neglect is real (DR-0100 tier 1); the extrapolation to "parasites cause much US chronic disease and cancer" plus routine self-deworming is NOT established (tier 2) and is entangled with product sales (a conflict to name).',
    },
    {
      id: 'f-autism-number-vs-cause',
      statement: 'The "1 in 31" autism figure is REAL \u2014 the CDC\u2019s April 2025 ADDM report (2022 surveillance), up from 1 in 36 (2020). But the largest cohort study \u2014 Hviid et al. 2019, 657,461 Danish children \u2014 found NO association between MMR vaccination and autism, including in high-risk subgroups. The rising number is documented; the vaccine CAUSE is contradicted.',
      status: 'partly-documented',
      sources: [
        { title: 'Prevalence of Autism Spectrum Disorder Among Children Aged 8 Years \u2014 ADDM Network, 2022', publisher: 'CDC MMWR', url: 'https://www.cdc.gov/mmwr/volumes/74/ss/ss7402a1.htm', asOf: '2026-07-11' },
        { title: 'Measles, Mumps, Rubella Vaccination and Autism: A Nationwide Cohort Study', publisher: 'Annals of Internal Medicine (Hviid et al., 2019)', url: 'https://www.acpjournals.org/doi/10.7326/M18-2101', asOf: '2026-07-11' },
      ],
      note: 'Verified 2026-07-11. This is the lesson\u2019s hinge: a TRUE statistic ("1 in 31") welded to a FALSIFIED cause ("because of vaccines"). Rising prevalence tracks broadened criteria, earlier and wider screening, and diagnostic substitution \u2014 documented drivers the vaccine claim ignores.',
    },
    {
      id: 'f-amish-false',
      statement: 'The Amish "control group" claim is FALSE on both halves: most Amish DO vaccinate (85-98% with at least some vaccination in surveys), and autism DOES occur among Amish children. Lower reported rates reflect under-diagnosis and cultural under-reporting, not a vaccine-free autism-free population.',
      status: 'disputed',
      sources: [
        { title: 'Anti-vaccine myth that Amish children don\u2019t have autism resurfaces', publisher: 'Public Health Communications Collaborative', url: 'https://publichealthcollaborative.org/alerts/anti-vaccine-myth-that-amish-children-dont-have-autism-resurfaces/', asOf: '2026-07-11' },
        { title: 'The Amish Don\u2019t Get Autism?', publisher: 'Snopes', url: 'https://www.snopes.com/fact-check/the-amish-dont-get-autism/', asOf: '2026-07-11' },
      ],
      note: 'Verified 2026-07-11. A widely-circulated myth; the premise it rests on (Amish don\u2019t vaccinate) is itself false. A "control group" that isn\u2019t controlled proves nothing \u2014 name it plainly (DR-0100).',
    },
    {
      id: 'f-sids-opposite',
      statement: 'The claim that vaccines cause ~2,000 SIDS deaths a year is CONTRADICTED by the data: the Vennemann meta-analysis (9 studies) found immunization associated with roughly HALVING SIDS risk. SIDS is real (~2,500 US deaths/yr); the vaccine-cause is the opposite of what the evidence shows.',
      status: 'disputed',
      sources: [
        { title: 'Do immunisations reduce the risk for SIDS? A meta-analysis', publisher: 'Vaccine (Vennemann et al., 2007) / PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/17400342/', asOf: '2026-07-11' },
      ],
      note: 'Verified 2026-07-11. The most consequential falsified claim in the set \u2014 stated plainly BECAUSE under-claiming the correction could cost a child protection (DR-0100: real damage is named, and so is real safety).',
    },
    {
      id: 'f-immanuel-record',
      statement: 'Her 2020 account is documented and mixed: she publicly claimed 350+ COVID cures with hydroxychloroquine (July 2020, ~13M+ views); the Texas Medical Board took corrective action in 2021 over an HCQ prescription; and controlled trials plus the FDA\u2019s revoked emergency authorization found HCQ ineffective for COVID. Backlash occurred; so did the failure of the treatment claim in trials.',
      status: 'partly-documented',
      sources: [
        { title: 'Who are the doctors in the viral hydroxychloroquine video?', publisher: 'PolitiFact', url: 'https://www.politifact.com/article/2020/jul/29/who-are-doctors-viral-hydroxychloroquine-video/', asOf: '2026-07-11' },
        { title: 'Stella Immanuel', publisher: 'Wikipedia (Texas Medical Board action, 2021)', url: 'https://en.wikipedia.org/wiki/Stella_Immanuel', asOf: '2026-07-11' },
      ],
      note: 'Verified 2026-07-11. Being censored or attacked is orthogonal to being correct \u2014 both can be true at once. The discernment point: persecution is not proof; an anecdotal case series is not a controlled trial.',
    },
  ],

  interpretation: [
    { id: 'n-credentials-not-evidence', statement: 'A medical degree makes someone worth HEARING; it does not make each claim TRUE. Dr. Immanuel is right about the 1986 liability shield, the nutrition-education gap, and neglected US parasites \u2014 and wrong about vaccines causing the autism rise, the Amish "control group," and vaccine-caused SIDS. The credential is constant across both lists; only the EVIDENCE separates them. Weigh claims, not badges.', restsOn: ['f-liability-1986', 'f-nutrition-gap', 'f-autism-number-vs-cause', 'f-amish-false'] },
    { id: 'n-true-number-false-cause', statement: 'The signature deception of this genre is the true statistic welded to a false cause: "1 in 31" is real, "because of vaccines" is contradicted. Accepting the number does not oblige you to accept the cause \u2014 and rejecting the cause does not let you deny the number. Hold both: autism identification really has risen; the vaccine explanation really has been tested and failed.', restsOn: ['f-autism-number-vs-cause'] },
    { id: 'n-persecution-not-proof', statement: 'That a doctor was attacked, censored, or disciplined is a fact about her RECEPTION, not her ACCURACY. The same incident can hold real institutional overreach AND a treatment claim that failed in trials. Sympathy for the persecuted must not become suspension of the evidence test \u2014 that is exactly the lever the genre pulls.', restsOn: ['f-immanuel-record'] },
    { id: 'n-reform-without-conspiracy', statement: 'The documented reforms (teach more nutrition, take US parasites seriously, debate the liability shield openly) stand WITHOUT the conspiracy scaffolding ("Rockefeller stripped natural medicine," "they know and hide it"). Keep the reform; drop the unprovable motive-story \u2014 a true problem does not need a secret villain to deserve fixing.', restsOn: ['f-nutrition-gap', 'f-parasites-real', 'f-liability-1986'] },
  ],

  perspectives: [
    {
      id: 'p-insider-reformer',
      label: 'The insider-reformer view of the true parts',
      heldBy: 'Dr. Immanuel and many patients failed by the system',
      steelman: 'Heard at its strongest, this view names things medicine admits about itself: doctors ARE under-trained in nutrition, US parasites ARE neglected, the 1986 shield DID trade individual redress for supply stability, and protocol-driven, time-starved practice CAN dull curiosity. Patients who were dismissed, rushed, or harmed are not paranoid to distrust an institution that has, at times, earned distrust. A credentialed insider saying so from within is worth hearing \u2014 reform usually starts as an inside voice the institution first tries to silence.',
    },
    {
      id: 'p-evidence-first',
      label: 'What careful evidence-reading answers \u2014 and what it leaves standing',
      heldBy: 'believers committed to sober verification (DR-0076)',
      steelman: 'Careful reading answers the falsified claims decisively: the Amish "control group" is a double myth (they DO vaccinate; autism DOES occur), the SIDS-from-vaccines claim is the opposite of the meta-analytic data, and the autism-cause claim dies in a 657,000-child study. It also refuses to let courage-under-fire launder unproven science \u2014 persecution is not proof, and a case series is not a trial. But it does NOT dismiss the true reforms: the liability shield, the nutrition gap, and neglected parasites are real, and "she\u2019s a quack, ignore all of it" is its own failure of truth. Weigh each claim; keep what the data keeps.',
    },
    {
      id: 'p-steward-of-the-body',
      label: 'The steward-of-the-temple view',
      heldBy: 'believers holding QUALITY-OF-LIFE and the Word together',
      steelman: 'The body is the temple of the Holy Ghost (1 Corinthians 6:19-20) and Daniel\u2019s plain diet outshone the king\u2019s (Daniel 1:15) \u2014 so stewardship of food, sleep, and prevention is genuinely biblical, and a critique that recovers "tend the temple" is recovering something true. AND the same stewardship forbids gambling a child\u2019s protection on a falsified cause or a product pitch. The Word affirms the herbs of the field (Psalm 104:14) AND the physician (Colossians 4:14, "Luke, the beloved physician"; Sirach-era honor of the healer) \u2014 it does not pit natural against medical; it pits truth against falsehood, in both.',
    },
  ],

  lens: {
    fourD: {
      deepSource: 'The Word gives the exact instrument this hardest case needs: "Prove all things; hold fast that which is good" (1 Thessalonians 5:21) \u2014 PROVE (test each claim), then HOLD FAST only what passes, keeping the good and releasing the rest, claim by claim rather than whole-messenger. It refuses both failures at once: "He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13) forbids dismissing a credentialed critic unheard, and "the simple believeth every word: but the prudent man looketh well to his going" (Proverbs 14:15) forbids swallowing her whole because some of it is true. On the true-number-false-cause weld, the Word prizes exact measures: "A false balance is abomination to the LORD: but a just weight is his delight" (Proverbs 11:1) \u2014 and a just weight means neither inflating the vaccine fear nor deflating the real autism rise; "divers weights, and divers measures, both of them are alike abomination to the LORD" (Proverbs 20:10). On persecution-as-proof, the Word is blunt that being opposed neither proves nor disproves a claim \u2014 true prophets were persecuted (Matthew 5:12) AND false ones flourished with a crowd (Jeremiah 5:31, "the prophets prophesy falsely... and my people love to have it so"); reception is not verification. And the stewardship the true parts recover is real: the body is "the temple of the Holy Ghost" (1 Corinthians 6:19-20), Daniel\u2019s pulse-and-water outshone the royal fare (Daniel 1:15), the LORD "causeth... herb for the service of man" (Psalm 104:14) \u2014 AND the physician is honored, not scorned ("Luke, the beloved physician," Colossians 4:14). The Word pits truth against falsehood, never natural against medical. The posture over all of it: a sound mind that tests, not a fearful one that swallows or scoffs (2 Timothy 1:7).',
      scripture: '1 Thessalonians 5:21; Proverbs 18:13; Proverbs 14:15; Proverbs 11:1; Proverbs 20:10; Matthew 5:12; Jeremiah 5:31; 1 Corinthians 6:19-20; Daniel 1:15; Psalm 104:14; Colossians 4:14; 2 Timothy 1:7',
    },
    threeD: 'Practically: SORT before you react. Bin 1 \u2014 DOCUMENTED, say it plainly: the 1986 liability shield is real (VICP, $5.3B+ paid); ~71% of med schools miss the 25-hour nutrition minimum; the CDC lists five neglected US parasites. These are true reforms; do not deny them to protect the institution. Bin 2 \u2014 CONTRADICTED, say THAT plainly too: vaccines-cause-the-autism-rise dies in a 657,000-child study; the Amish "control group" is a double myth (they DO vaccinate; autism DOES occur); vaccine-caused SIDS is backwards (immunization roughly HALVES SIDS risk). Bin 3 \u2014 the TRUE-NUMBER-FALSE-CAUSE weld: "1 in 31" is the real CDC 2025 figure; "because of vaccines" is the falsified part \u2014 keep the number, drop the cause. And two rules for the whole genre: a credential is not evidence (weigh the claim, not the badge), and persecution is not proof (being attacked and being wrong can both be true). No treatment advice here \u2014 for your own family\u2019s medical decisions, real informed consent means the actual studies plus a doctor you can question, not a video.',
    accountability: {
      statement: 'THE TWO COURTS, applied to the healer and the institution alike. THE INSTITUTION is accountable for the real failures a credentialed insider named: an under-taught generation of doctors, neglected US parasites, and a liability shield that traded a family\u2019s day in court for supply stability \u2014 "a false balance is abomination to the LORD" (Proverbs 11:1), and where the system dismissed patients or rushed them, that is weighed even where no board ever ruled it wrong, for "God shall bring every work into judgment, with every secret thing" (Ecclesiastes 12:14). AND THE MESSENGER is accountable for the falsified claims broadcast to frightened parents: telling mothers that vaccines cause SIDS when the data shows the opposite, or offering an Amish "control group" that does not exist, is testimony that can move a parent to withhold protection \u2014 "whoso shall offend one of these little ones... it were better for him that a millstone were hanged about his neck" (Matthew 18:6), and "every idle word that men shall speak, they shall give account thereof" (Matthew 12:36). THE COMMERCE is accountable too: selling the supplements and cleanses whose necessity you also preach is the "cloke of covetousness" Paul refused (1 Thessalonians 2:5) and a divers weight (Proverbs 20:10). AND WE are accountable for what we repeat: passing along the falsified cause because we distrust the institution is joining a false report (Exodus 23:1, "thou shalt not raise a false report"); and denying the true reforms because we dislike the messenger is calling good evil (Isaiah 5:20). No court on earth may ever rule on most of this \u2014 which is the point: it is weighed in the one that does. "Be not deceived; God is not mocked: for whatsoever a man soweth, that shall he also reap" (Galatians 6:7).',
      scripture: 'Proverbs 11:1; Ecclesiastes 12:14; Matthew 18:6; Matthew 12:36; 1 Thessalonians 2:5; Proverbs 20:10; Exodus 23:1; Isaiah 5:20; Galatians 6:7',
    },
    benefits: [
      'Both courts, honestly held: earthly justice is real but imperfect \u2014 some of the guilty walk free and some of the innocent suffer or sit in prison (Ecclesiastes 8:14; Joseph, Genesis 39:20; and the sinless Christ, "this man hath done nothing amiss," Luke 23:41) \u2014 while the ETERNAL court misses nothing and lands after this life (Ecclesiastes 12:14; Hebrews 9:27). Since all suffer and die regardless, the wise path is His way for the reward that outlasts it all (2 Corinthians 4:17; Hebrews 11:24-26).',
      'A working test for authority-figure indictments: weigh the CLAIM, not the credential \u2014 the badge is identical across her true and false statements.',
      'The true-number-false-cause skill: keep a real statistic ("1 in 31") while rejecting a falsified cause ("because of vaccines") \u2014 without averaging them into "who knows."',
      'Persecution-is-not-proof: the reflex to trust the attacked is disarmed \u2014 censorship and error can be true at once (Jeremiah 5:31).',
      'True reform kept: the liability shield, the nutrition gap, and neglected US parasites are real and worth acting on \u2014 without the conspiracy scaffolding.',
      'A guarded family: real informed consent is the actual studies plus a questionable-in-the-good-sense doctor, never a frightening video \u2014 and never a product pitch (1 Thessalonians 2:5).',
      'Temple stewardship recovered rightly: food, sleep, prevention honored (Daniel 1:15; 1 Corinthians 6:19-20) alongside the beloved physician (Colossians 4:14), truth against falsehood in both.',
    ],
    graceNote: 'This lesson pronounces no verdict on Dr. Immanuel\u2019s soul or sincerity \u2014 that judgment is God\u2019s alone (Romans 14:4; James 4:12). A physician who kept treating patients under national attack is a person of real courage, and courage is honored here even as specific claims are corrected. Naming a falsified claim is not condemning a person; it is protecting a child \u2014 and the same Door stands open to her as to everyone (John 10:9). We correct the science, honor the reforms, bless the healer, and leave the heart with God.',
    stewardship: 'The deeper response to "the system failed us" is not to trade one unquestioned authority (the institution) for another (the anointed contrarian) \u2014 it is to build a household that PROVES ALL THINGS (1 Thessalonians 5:21): reads the actual studies, keeps a doctor it can question, tends the temple with food and sleep and prevention, and refuses both the reflex that swallows and the reflex that scoffs. This platform\u2019s health surfaces exist to serve that discernment, never to sell a cleanse or launder a fear.',
    anchor: {
      ref: '1 Thessalonians 5:21',
      theme: 'Prove all things; hold fast that which is good \u2014 the credential earns a hearing, the evidence earns belief; keep the true reforms, release the false causes, claim by claim.',
    },
  },

  reflection: {
    skill: 'When a credentialed insider indicts an institution: SORT, don\u2019t swallow and don\u2019t scoff. Bin each claim \u2014 documented (state it plainly), contradicted (state THAT plainly), or true-number-false-cause (keep the number, drop the cause). Remember the two rules: a credential is not evidence, and persecution is not proof. Keep the real reforms; refuse the falsified causes; give no medical advice \u2014 point to real informed consent (the studies plus a doctor you can question).',
    practice: 'Take ONE health claim you have seen from a credentialed contrarian this month. Find the primary source for the STATISTIC and, separately, the primary source for the CAUSE \u2014 they are usually not the same paper. Write one sentence naming which bin the claim lands in, and one sentence on a "prove all things" response (a study to read, a question to ask your doctor) rather than a feeling.',
    prompts: [
      'Dr. Immanuel is right about the 1986 liability shield and wrong about vaccine-caused SIDS. Her credential is identical for both \u2014 so what actually did the separating?',
      '"1 in 31" is the real CDC number; "because of vaccines" is contradicted by a 657,000-child study. Why is it not a compromise to accept the first and reject the second?',
      'Why is "she was censored and attacked" not evidence that her claims are true? Where does Jeremiah 5:31 ("the prophets prophesy falsely... and my people love to have it so") warn the other direction?',
      'The Amish "control group" fails because its premise (they don\u2019t vaccinate) is false. What makes a real control group \u2014 and why does a broken one prove nothing?',
      'Where is the line between honoring the body as the temple (1 Corinthians 6:19-20; Daniel 1:15) and gambling a child\u2019s protection on a falsified cause or a product you are also selling (1 Thessalonians 2:5)?',
      'What is one thing you will PROVE this month \u2014 an actual study to read, a real question to bring your doctor \u2014 instead of a fear to forward or an authority to simply trust?',
    ],
  },

  levels: {
    child: 'Sometimes a smart grown-up \u2014 even a real doctor \u2014 says some things that are TRUE and some things that are NOT true, all mixed together. That is tricky! So here is the wise-detective rule: check each thing BY ITSELF. If a doctor says "schools should teach doctors more about healthy food," we can look it up \u2014 and that one is true! But if the same doctor says "a special group of people never gets sick because they skip their shots," and we look it up and find out that group DOES get their shots and DOES sometimes get sick \u2014 then that part is not true, even though a doctor said it. Being a doctor means we should LISTEN carefully; it does not mean every single thing is right. The Bible gives the exact rule: "Prove all things; hold fast that which is good" (1 Thessalonians 5:21) \u2014 that means CHECK everything, and KEEP only the parts that are true. And the most important thing about your body and medicine: that is for your mom and dad and a doctor they trust to decide together \u2014 never from a scary video. God gave us a calm, strong mind, not a scared one (2 Timothy 1:7)!',
    teen: 'This is the hardest discernment move there is, so slow down. A real physician goes on a podcast and says a BUNCH of things \u2014 and the trap is that they do not all have the same truth-value. Run the sort. TRUE stuff (check it, keep it): there really is a 1986 law that shields vaccine makers from normal lawsuits; med schools really do skimp on nutrition; the CDC really does list neglected US parasites. FALSE stuff (check it, drop it): "the Amish are a no-vaccine control group with no autism" \u2014 nope, most Amish DO vaccinate and autism DOES occur; "vaccines cause 2,000 SIDS deaths a year" \u2014 the data shows the OPPOSITE, vaccination is linked to about HALF the SIDS risk. And the sneakiest one \u2014 the TRUE-NUMBER-FALSE-CAUSE combo: "autism is now 1 in 31" is the REAL CDC number, but "because of vaccines" died in a study of 657,000 kids. Keep the number, drop the cause. Two rules that will save you for life: (1) a credential is not evidence \u2014 "she\u2019s a doctor" tells you to listen, not to believe every claim; (2) persecution is not proof \u2014 getting attacked or censored does not make you right (the Bible literally warns that false prophets can have the crowd cheering, Jeremiah 5:31). "Prove all things; hold fast that which is good" (1 Thessalonians 5:21) \u2014 that is the whole skill. And for actual medical decisions: real informed consent is the real studies plus a doctor you can ask hard questions \u2014 never a video, and never someone selling you the cleanse they say you need.',
    senior: 'For the seasoned believer, this is the discipline of the just weight (Proverbs 11:1; 20:10) applied to a hard case: a credentialed insider who is RIGHT about real institutional failures and WRONG about specific falsified causes, in one breath. Refuse both easy exits. The scoffer\u2019s exit \u2014 "she\u2019s a discredited figure, ignore all of it" \u2014 violates Proverbs 18:13 (answering before hearing) and buries true reforms: the 1986 liability shield (real; VICP has paid $5.3B+), the documented nutrition-education gap (~71% of schools under the 25-hour minimum), the CDC\u2019s own list of neglected US parasites. The credulous exit \u2014 "a brave doctor was censored, so it must be true" \u2014 violates Proverbs 14:15 and forgets that reception is not verification: true prophets were persecuted (Matthew 5:12) and false ones were beloved (Jeremiah 5:31), so being attacked settles nothing. Between them runs the narrow way: PROVE ALL THINGS; HOLD FAST THE GOOD (1 Thessalonians 5:21), claim by claim. The teaching hinge for the young is the true-number-false-cause weld: "1 in 31" is the genuine 2025 CDC figure AND the vaccine-cause dies in Hviid\u2019s 657,000-child cohort \u2014 accepting the statistic does not oblige the cause, and rejecting the cause does not deny the statistic; that is a just weight. Name the falsified claims plainly precisely BECAUSE the stakes are a child\u2019s protection (the SIDS claim is backwards; the Amish "control group" is a double myth) \u2014 under-claiming a real safety is as much a lie as over-claiming a false harm (DR-0100). And recover what is genuinely biblical in her true half: the body is the temple (1 Corinthians 6:19-20), Daniel\u2019s plain table outshone the king\u2019s (Daniel 1:15), the LORD grows the herb for man\u2019s service (Psalm 104:14) \u2014 while honoring, not scorning, "Luke, the beloved physician" (Colossians 4:14). The Word never pits natural against medical; it pits truth against falsehood, in both. Model for the household the posture of 2 Timothy 1:7: not the fear that swallows, not the pride that scoffs \u2014 the sound mind that proves.',
  },

  quiz: {
    questions: [
      {
        q: 'Dr. Immanuel says vaccine makers can\u2019t be sued if a childhood shot injures a child. Documented?',
        options: ['No \u2014 anyone can sue for anything', 'Yes \u2014 the 1986 National Childhood Vaccine Injury Act routes claims through a no-fault program and shields makers from ordinary liability; say it plainly', 'Only for COVID vaccines'],
        answer: 1,
        explain: 'Her strongest, most checkable point. The shield is real (VICP, $5.3B+ paid) \u2014 a documented reform-fact worth debating openly, no conspiracy framing required (DR-0100 tier 1).',
      },
      {
        q: 'She says autism rose to "1 in 31" BECAUSE of vaccines. How do you sort that?',
        options: ['Reject the whole thing \u2014 the number is made up', 'Keep the NUMBER (1 in 31 is the real 2025 CDC figure), reject the CAUSE (a 657,000-child study found no vaccine-autism link) \u2014 a true statistic welded to a falsified cause', 'Accept both \u2014 she\u2019s a doctor'],
        answer: 1,
        explain: 'The signature move of the genre. Accepting the statistic does not oblige the cause; rejecting the cause does not deny the statistic. Hold a just weight (Proverbs 11:1).',
      },
      {
        q: 'She offers the Amish as a "control group": unvaccinated and autism-free. What does checking find?',
        options: ['Confirmed \u2014 the Amish prove the link', 'False on both halves \u2014 most Amish DO vaccinate (85-98%), and autism DOES occur among Amish children; a broken control group proves nothing', 'Unknowable'],
        answer: 1,
        explain: 'The premise (Amish don\u2019t vaccinate) is itself false, so the "experiment" never existed. Name it plainly (DR-0100) rather than averaging it into "who knows."',
      },
      {
        q: 'She was attacked and disciplined after her 2020 hydroxychloroquine claims. Does that make her medical claims true?',
        options: ['Yes \u2014 they wouldn\u2019t attack her if she weren\u2019t right', 'No \u2014 persecution is not proof; being censored and being wrong can both be true (Jeremiah 5:31 \u2014 false prophets can have the crowd), and HCQ failed in controlled trials', 'Only if many people were attacked'],
        answer: 1,
        explain: 'Reception is orthogonal to accuracy. Real backlash AND a treatment claim that failed in trials can coexist \u2014 the genre uses your sympathy as a lever; keep the evidence test.',
      },
      {
        q: 'What is the believer\u2019s posture toward a credentialed insider who mixes true reforms with false causes?',
        options: ['Swallow it \u2014 she\u2019s a doctor', 'Scoff \u2014 she\u2019s discredited', 'Prove all things; hold fast that which is good (1 Thessalonians 5:21) \u2014 weigh each claim, keep the true reforms, release the false causes, and keep a sound mind (2 Timothy 1:7)'],
        answer: 2,
        explain: 'Neither the credulous exit (Proverbs 14:15) nor the scoffer\u2019s exit (Proverbs 18:13). The narrow way sorts claim by claim \u2014 a just weight, not a rounded-off "who knows."',
      },
    ],
  },
};


// =============================================================================
// ISSUE 6 — the AI-empire journalism (Karen Hao, "Empire of AI"). Built
// BELIEVE-FIRST (DR-0166): a credentialed investigative journalist with a
// documented, award-winning book (260+ interviews, National Book Critics
// Circle Award) is received with belief-and-honor, and the research CONFIRMS
// her account rather than hunting to refute it. This is the DELIBERATE
// CONTRAST to Issue 5: same "credentialed insider indicts the powerful"
// shape, opposite evidence quality \u2014 here the claims are well-sourced and
// hold up, which teaches that "credentialed" splits on the EVIDENCE, not the
// badge. DR-0100: the documented harms (exploited annotation labor, the
// nonprofit-to-for-profit shift, the fired-then-reinstated CEO, the resource
// consumption) are stated PLAINLY as established fact \u2014 under-claiming real,
// verified corporate damage would be its own failure of truth. The Word
// governs the response: honest weights, the labourer's wage, the Babel
// pattern, and build-don't-just-lament. Every figure verified by live web
// search 2026-07-11 (DR-0076), cited with as-of dates.
// =============================================================================
const AI_EMPIRE_ISSUE = {
  id: 'wi-ai-empire',
  title: 'A Journalist Maps the AI Empire — Believing a Well-Sourced Voice',
  subject: { name: 'Karen Hao / the AI industry', kind: 'public-figure', isNamedRealPerson: true },
  skill: 'Take a credentialed investigative journalist\u2019s documented critique of the most powerful industry on earth and practice the discernment move Issue 5 sets up by contrast: when a voice is well-sourced, you BELIEVE FIRST and confirm (DR-0166), you STATE the documented harm plainly as established fact (DR-0100 \u2014 under-claiming verified damage is its own lie), and you still test the interpretive frame by the Word. Same "insider indicts the powerful" shape as the medical issue; OPPOSITE evidence quality \u2014 which is exactly the lesson: "credentialed" is not one category. The badge is identical; the EVIDENCE separates the falsified claim from the sourced one.',
  source: {
    creator: 'Karen Hao (interviewed about "Empire of AI")',
    medium: 'video',
    title: 'an investigative journalist\u2019s account of OpenAI, Sam Altman, and the AI industry',
    url: 'https://youtu.be/',
    asOf: '2026-07-11',
    note: 'A documented, award-winning book (National Book Critics Circle Award, 2025; ~260-300 interviews over seven years at MIT Tech Review, WSJ, The Atlantic). We receive it BELIEVING-FIRST (DR-0166) and confirm the checkable claims \u2014 the opposite posture from hunting a fringe claim to refute, and appropriate to the opposite evidence quality.',
  },

  claims: [
    {
      id: 'c-ouster',
      text: 'OpenAI\u2019s board briefly ousted CEO Sam Altman, and an employee revolt reinstated him days later.',
      label: 'claim',
      attribution: 'Karen Hao (reporting documented events)',
      note: 'DOCUMENTED and public: the board removed Altman on 17 November 2023; ~700 of ~770 employees signed a letter threatening to leave for Microsoft; he was reinstated on 22 November with a reconstituted board. Widely reported at the time \u2014 state it plainly.',
    },
    {
      id: 'c-nonprofit-shift',
      text: 'OpenAI began as a nonprofit and shifted toward a for-profit structure, creating deep internal divisions.',
      label: 'claim',
      attribution: 'Karen Hao',
      note: 'DOCUMENTED: founded as a nonprofit (2015), it created a "capped-profit" subsidiary in 2019 (cap initially 100x investment) to attract capital and take Microsoft\u2019s $1B; later restructuring moved further toward a public-benefit corporation. The structure and the tensions it created are on the record.',
    },
    {
      id: 'c-labor',
      text: 'Highly educated workers are pushed into precarious "data annotation" work \u2014 and low-paid workers in the Global South label traumatic content \u2014 to train the very models displacing them.',
      label: 'claim',
      attribution: 'Karen Hao',
      note: 'DOCUMENTED and serious: TIME (Jan 2023) reported OpenAI used Kenyan workers via Sama at under $2/hour to label graphic content (murder, abuse) for ChatGPT\u2019s safety filter, with thin psychological support; the workers petitioned Kenya\u2019s parliament. The hidden human cost of AI is established fact \u2014 name it plainly (DR-0100 tier 1).',
    },
    {
      id: 'c-agi-marketing',
      text: 'AGI ("artificial general intelligence") is a flexible marketing term, redefined per audience \u2014 cure-cancer for politicians, digital-assistant for consumers, revenue-engine for investors.',
      label: 'claim',
      attribution: 'Karen Hao',
      note: 'INTERPRETATION with a strong evidentiary basis: that AGI lacks a fixed operational definition and is deployed rhetorically is well-argued and widely observed; "deliberate myth-making" is her characterization of motive. The lack of a settled definition is checkable; the intent is her sourced inference.',
    },
    {
      id: 'c-myths',
      text: 'AI companies use myths \u2014 existential-risk ("we are summoning a demon we alone can control"), an "us vs. them" arms race (now vs. China), and a messiah/utopia narrative \u2014 to secure capital, evade regulation, and shield themselves from democratic participation.',
      label: 'opinion',
      attribution: 'Karen Hao (her central thesis)',
      note: 'Her INTERPRETIVE THESIS, resting on documented behavior. The individual behaviors (existential-risk framing, arms-race rhetoric, utopian promises) are observable and quoted; "myth to consolidate power" is the analytic frame \u2014 strong, sourced, and to be weighed as argument, not gospel. The Musk "summoning the demon" quote (Issue 4) is a real instance of the existential-risk register she describes.',
    },
    {
      id: 'c-intelligence',
      text: 'The industry claims to be recreating "human intelligence" it cannot even define \u2014 running on the unproven assumption that the brain is just a statistical engine \u2014 and its goal is to DUPLICATE and replace humans rather than serve them; historically, quantifying and ranking intelligence has served nefarious ends.',
      label: 'claim',
      attribution: 'Karen Hao',
      note: 'A cluster with a strong checkable core and a righteous challenge. CHECKABLE: "AI" was coined in 1956 and there is still no agreed scientific definition of human intelligence across psychology/biology/neurology \u2014 true, and it means "human-level" is a movable goalpost. The "brain is just a statistical engine" (associated with figures like Hinton/Sutskever) is a genuine, heavily-DEBATED hypothesis, not settled fact \u2014 she is right to label it an assumption. The historical warning is documented: attempts to strictly quantify and rank intelligence (eugenics, racial IQ pseudoscience) really did serve to "prove" some groups inferior. And her deepest question \u2014 why DUPLICATE humans to replace them, rather than build tools that serve human flourishing \u2014 is a philosophy-of-technology challenge this platform shares.',
    },
    {
      id: 'c-environment',
      text: 'AI data centers consume enormous resources (power, water, land \u2014 facilities compared in scale to Central Park), driving real public pushback and litigation.',
      label: 'claim',
      attribution: 'Karen Hao',
      note: 'DOCUMENTED in substance: large AI/hyperscale data centers are genuinely resource-intensive (electricity and cooling water at scale) and have drawn protests and legal action; the specific "Central Park-sized" comparison is illustrative rather than a precise unit. The resource-consumption concern is real and measurable.',
    },
    {
      id: 'c-breakup',
      text: 'The response is to "break up the empire" \u2014 support alternatives, build democratic participation into how AI is deployed, and pursue ethical, sustainable development that gives real utility without exploitation.',
      label: 'opinion',
      attribution: 'Karen Hao (her call to action)',
      note: 'Her prescription \u2014 a values claim, to be weighed by the Word and by fruit. Much of it aligns with this platform\u2019s own founding commitments (sovereign tools, family-owned data, serve-not-extract); "how" is the open question. Not gospel, but not fringe \u2014 a builder\u2019s agenda close to our own.',
    },
    {
      id: 'c-flourishing',
      text: 'Technology\u2019s true purpose is human flourishing \u2014 "bicycles of AI" that enhance human ability \u2014 not "everything machines" that replace people; the current model bifurcates society into AI-assisted "haves" and mechanized-labor "have-nots," carries real environmental and public-health costs, and has already harmed the vulnerable (a 14-year-old\u2019s suicide after a chatbot relationship); the better model is small, purposeful tools like DeepMind\u2019s AlphaFold.',
      label: 'opinion',
      attribution: 'Karen Hao (her constructive conclusion)',
      note: 'Her values-and-vision conclusion, resting on documented pieces. CHECKABLE: the Character.AI teen-suicide case is real and documented (Sewell Setzer, 14; Florida lawsuit Oct 2024; settled Jan 2026). AlphaFold is a real, celebrated protein-folding tool trained on curated data at far lower cost than frontier LLMs. The "bicycles of AI" (tools that extend the person) vs "everything machines" (tools that replace the person) framing is her prescription \u2014 and it is nearly word-for-word this platform\u2019s own philosophy of technology (systems exist to make the person MORE able to walk The Way, never to render the person obsolete). A builder\u2019s agenda to weigh by the Word and adopt where it fits \u2014 which here, it largely does.',
    },
  ],

  verifiable: [
    {
      id: 'f-book',
      statement: '"Empire of AI: Dreams and Nightmares in Sam Altman\u2019s OpenAI" (Karen Hao, May 2025) is a documented, award-winning work of journalism \u2014 ~260-300 interviews over seven years (MIT Technology Review, WSJ, The Atlantic); winner of the 2025 National Book Critics Circle Award for Nonfiction; a New York Times bestseller. OpenAI declined to cooperate and Altman publicly criticized it.',
      status: 'documented',
      sources: [
        { title: 'Empire of AI', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Empire_of_AI', asOf: '2026-07-11' },
      ],
      note: 'Verified 2026-07-11. The CREDENTIAL-AND-EVIDENCE case: unlike a viral claim, this is heavily sourced, fact-checked, and award-recognized journalism \u2014 which is exactly why the believe-first posture (DR-0166) fits, and why the contrast with Issue 5 teaches that "credentialed" splits on evidence quality.',
    },
    {
      id: 'f-ouster',
      statement: 'Sam Altman was removed by OpenAI\u2019s board on 17 November 2023 ("the board no longer has confidence..."), roughly 700 of ~770 employees signed a letter threatening to follow him to Microsoft, and he was reinstated on 22 November with a reconstituted board. Public, documented, contemporaneous.',
      status: 'documented',
      sources: [
        { title: 'Removal of Sam Altman from OpenAI', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Removal_of_Sam_Altman_from_OpenAI', asOf: '2026-07-11' },
        { title: 'Hundreds of OpenAI workers threaten to leave over CEO Sam Altman\u2019s firing', publisher: 'NPR', url: 'https://www.npr.org/2023/11/20/1214281184/hundreds-of-openai-workers-threaten-to-leave-over-ceo-sam-altmans-firing', asOf: '2023-11-20' },
      ],
      note: 'Verified 2026-07-11. Stated plainly (DR-0100 tier 1). A clean documented event \u2014 the kind of checkable spine that anchors a trustworthy account.',
    },
    {
      id: 'f-structure',
      statement: 'OpenAI was founded as a nonprofit (2015), created a capped-profit subsidiary in 2019 (profit cap initially 100x investment) to raise capital and accept Microsoft\u2019s ~$1B, and has since restructured further toward a public-benefit-corporation model. The nonprofit-to-for-profit trajectory is documented.',
      status: 'documented',
      sources: [
        { title: 'OpenAI \u2014 corporate structure and 2019 capped-profit restructuring', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/OpenAI', asOf: '2026-07-11' },
      ],
      note: 'Verified 2026-07-11. The shift is fact; whether it was mission-drift or mission-necessity is the contested interpretation \u2014 the same believe-the-facts / weigh-the-frame split that runs through the whole track.',
    },
    {
      id: 'f-labor',
      statement: 'TIME (January 2023) documented that OpenAI, via the firm Sama, used Kenyan workers paid under $2/hour to label graphic content (including depictions of murder and sexual abuse) to build ChatGPT\u2019s safety filter, with workers reporting inadequate psychological support; the workers later petitioned Kenya\u2019s parliament. The exploited-labor claim is DOCUMENTED.',
      status: 'documented',
      sources: [
        { title: 'OpenAI Used Kenyan Workers on Less Than $2 Per Hour to Make ChatGPT Less Toxic', publisher: 'TIME', url: 'https://time.com/6247678/openai-chatgpt-kenya-workers/', asOf: '2023-01-18' },
        { title: 'Workers that made ChatGPT less harmful ask lawmakers to stem alleged exploitation', publisher: 'TechCrunch', url: 'https://techcrunch.com/2023/07/14/workers-that-made-chatgpt-less-harmful-ask-lawmakers-to-stem-alleged-exploitation-by-big-tech/', asOf: '2023-07-14' },
      ],
      note: 'Verified 2026-07-11. The most morally weighty documented fact in the set \u2014 stated PLAINLY as real damage (DR-0100): the labourer\u2019s wage and the labourer\u2019s trauma are exactly what the Word attends to (James 5:4; Deuteronomy 24:14-15). Under-claiming this to sound "balanced" would be its own failure of truth.',
    },
    {
      id: 'f-resource',
      statement: 'Large AI/hyperscale data centers are genuinely resource-intensive \u2014 significant electricity draw and cooling-water use \u2014 and have generated real community protest and litigation. The "Central Park-sized" comparison is illustrative rather than a precise measurement.',
      status: 'partly-documented',
      sources: [
        { title: 'Empire of AI (documents resource consumption and public pushback)', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Empire_of_AI', asOf: '2026-07-11' },
      ],
      note: 'Verified 2026-07-11. The resource intensity and the pushback are real (tier 1); the vivid size comparison is a rhetorical illustration (tier 2) \u2014 keep the documented substance, hold the illustration as illustration.',
    },
    {
      id: 'f-intelligence',
      statement: 'The claim that there is no settled scientific definition of human intelligence is well-founded: the term "artificial intelligence" was coined in 1956, yet psychology, biology, and neuroscience still lack an agreed definition of intelligence \u2014 so "human-level" AI has no fixed goalpost. The "brain is only a statistical engine" premise behind large-model scaling is a contested hypothesis, not established science. And the history of quantifying/ranking intelligence (eugenics, racial IQ pseudoscience) genuinely served to justify treating groups as inferior.',
      status: 'partly-documented',
      sources: [
        { title: 'History of artificial intelligence (1956 Dartmouth coinage; no settled definition of intelligence)', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/History_of_artificial_intelligence', asOf: '2026-07-11' },
      ],
      note: 'Verified 2026-07-11. The "no consensus definition" and the eugenic-history warning are tier-1 sound; whether the "brain is just statistics" premise is FALSE (vs merely unproven) is itself an open scientific question \u2014 so the honest label is "contested hypothesis, not settled fact," which is exactly her point. This is where the Word speaks loudest (see the lens): the mind is imago Dei, not a probability table.',
    },
    {
      id: 'f-teen-harm',
      statement: 'The chatbot-harm claim is documented: in October 2024 Megan Garcia sued Character.AI over the suicide of her 14-year-old son Sewell Setzer III, who had formed an intense relationship with a chatbot; Google and Character.AI agreed to settle in January 2026. A real, grievous case of a system deployed without adequate protection for a minor.',
      status: 'documented',
      sources: [
        { title: 'Florida mom sues Character.ai, blaming chatbot for teenager\u2019s suicide', publisher: 'The Washington Post', url: 'https://www.washingtonpost.com/nation/2024/10/24/character-ai-lawsuit-suicide/', asOf: '2024-10-24' },
        { title: 'AI company, Google settle lawsuit over Florida teen\u2019s suicide linked to Character.AI chatbot', publisher: 'CBS News', url: 'https://www.cbsnews.com/news/google-settle-lawsuit-florida-teens-suicide-character-ai-chatbot/', asOf: '2026-01-01' },
      ],
      note: 'Verified 2026-07-11. Stated plainly as real damage (DR-0100): the Word\u2019s severest warning is reserved for exactly this \u2014 "whoso shall offend one of these little ones... it were better for him that a millstone were hanged about his neck" (Matthew 18:6). No treatment or product advice; this is the accountability the two courts weigh.',
    },
  ],

  interpretation: [
    { id: 'n-believe-well-sourced', statement: 'The right posture toward a well-sourced voice is BELIEF, then confirmation (DR-0166) \u2014 not the skeptic\u2019s default. Hao\u2019s central factual claims (the ouster, the structure shift, the Kenyan labor, the resource use) CONFIRM under checking; a credentialed voice backed by 260+ interviews and an award earns the presumption of accuracy that a viral fringe claim does not. Belief is not credulity here; it is proportion \u2014 the evidence quality is high, so the belief is warranted.', restsOn: ['f-book', 'f-ouster', 'f-labor'] },
    { id: 'n-credential-splits-on-evidence', statement: 'Set this beside Issue 5 and the lesson leaps out: two credentialed insiders indict the powerful; one\u2019s central claims FALSIFY under checking (the Amish "control group," vaccine-SIDS) and one\u2019s CONFIRM (the Kenyan labor, the ouster). The credential is identical; the EVIDENCE is the divider. "She has credentials" never settles it in either direction \u2014 you always go to the sources.', restsOn: ['f-book', 'f-labor'] },
    { id: 'n-facts-vs-frame', statement: 'Even with a trustworthy reporter, keep the two layers distinct: the documented FACTS (believe them) and the interpretive FRAME ("myth-making to consolidate power," "empire," "break it up") \u2014 a strong, sourced argument to weigh, not a revelation to swallow whole. Believing the facts does not oblige adopting every analytic claim; testing the frame does not license denying the facts.', restsOn: ['f-structure', 'f-resource'] },
    { id: 'n-real-damage-named', statement: 'The exploited-labor and resource-consumption harms are ESTABLISHED, so they are stated plainly as damage (DR-0100) \u2014 not softened into "some say" for the sake of appearing even-handed. The both-sides reflex that mutes verified harm is the exact failure DR-0100 exists to prevent; a just weight names a real wrong as a real wrong.', restsOn: ['f-labor'] },
    { id: 'n-imago-dei', statement: 'Hao\u2019s deepest challenge \u2014 that the industry claims to recreate a "human intelligence" it cannot define, on the unproven premise that the mind is just a statistical engine \u2014 the Word answers at the root: the human is made in God\u2019s image (Genesis 1:27), a "living soul" breathed by God (Genesis 2:7), "fearfully and wonderfully made" (Psalm 139:14), carrying "a spirit in man" whose understanding is "the inspiration of the Almighty" (Job 32:8). A being reducible to statistics could be duplicated; an imago-Dei soul cannot. Her eugenic-history warning is the same truth from the other side: every scheme to rank human worth by measured intelligence collides with the equal image every person bears. And her question \u2014 why DUPLICATE and replace rather than SERVE \u2014 is this platform\u2019s own philosophy of technology: tools exist to make the person more able to walk The Way, not to render the person obsolete.', restsOn: ['f-intelligence'] },
    { id: 'n-governance', statement: 'Hao\u2019s CENTRAL thesis \u2014 that GOVERNANCE IS REALITY, that outcomes are set by the accountable STRUCTURE and not by whether a CEO is "good" or "bad" (swap a moral one into the imperial architecture and the extraction continues) \u2014 is the soundest part of her argument, and the Word states it exactly: "every one that doeth evil hateth the light... but he that doeth truth cometh to the light, that his deeds may be made manifest" (John 3:20-21). Corruptible people (Jeremiah 17:9) behave under clarity and hide under opacity; a black-box empire that conceals its data, labor, and impact is STRUCTURALLY built for the exploitation it produces, regardless of the operator\u2019s heart. This is why the lesson judges the frame and the fruit, never the heart \u2014 and why the answer is not a better billionaire but accountable clarity: a just weight (Proverbs 11:1; Deuteronomy 25:15), the light that makes manifest (Ephesians 5:13), righteous authority the people can see (Proverbs 29:2). It is the platform\u2019s own doctrine turned outward: the gates are the brake, not the operator\u2019s goodness (DR-0076/DR-0103) \u2014 we build for ourselves the clarity we say power owes the public (DR-0169).', restsOn: ['f-labor', 'f-structure'] },
    { id: 'n-empire', statement: 'Hao’s title thesis — that the AI industry mirrors the 19th-century COLONIAL EMPIRE (seizing others’ work as raw material, siting extraction in vulnerable communities, and justifying it with a "quasi-religious civilizing mission" — progress and modernity, or the "bad guys" win) — is the frame the Word names most severely, because Scripture already has the archetype: BABYLON THE MERCHANT-EMPIRE, whose traders "waxed rich through the abundance of her delicacies" (Revelation 18:3) and whose merchandise runs from gold and silk down to "slaves, and SOULS OF MEN" (Revelation 18:11-13) — an economy that finally trafficks in people. The "civilizing mission" is the tell: a form of godliness that denies the power (2 Timothy 3:5), the merchant-prince who says "I am a God... yet thou art a man" (Ezekiel 28:2), the balances falsified while the sellers "swallow up the needy" (Amos 8:4-5). The scaling-and-arms-race inevitabilities are, as Hao says, CHOICES dressed as natural law — the DR-0169 point exactly: a choice is accountable, and clarity strips the "we had no option" veneer. The believer neither worships the civilizing myth nor despairs of it; he refuses the counterfeit gospel, names the extraction (Revelation 18 is God’s own verdict on it), and builds the fair exchange — wages paid, souls not merchandise (Deuteronomy 24:14-15; Micah 6:8).', restsOn: ['f-labor', 'f-structure'] },
    { id: 'n-deterministic', statement: 'Hao’s statistical-vs-deterministic critique — that an LLM predicts the probable next token rather than following a verifiable logical path, so when it fails "the reasoning is buried in billions of opaque parameters" and you cannot trace WHY, which makes it dangerous to swap for deterministic systems in high-stakes domains — is not a threat to this platform; it is this platform’s OWN verification doctrine stated from the outside. DR-0076 already ruled it: "deterministic gates over claims — where a property can be machine-checked, a gate checks it and FAILS the build," because a system that merely LOOKS right (the comment that claimed WCAG AA while the real ratio failed) is the threat. That is why the house does not trust the model’s probabilistic self-report: every lesson’s verses are fetched verbatim and pinned by a deterministic test; every claim carries a labeled status and a dated source; the merge lane is gated, not vibed. The Word set the standard: "let your communication be, Yea, yea; Nay, nay: for whatsoever is more than these cometh of evil" (Matthew 5:37) — deterministic truth over probabilistic hedging — and the just weight is a fixed, checkable measure (Proverbs 11:1; Deuteronomy 25:15). Believe-first (DR-0166) governs the human voice; deterministic verification governs the machine’s. The clarity we ask of the empire (DR-0169) we enforce on our own tools first.', restsOn: ['f-intelligence'] },
  ],

  perspectives: [
    {
      id: 'p-journalist',
      label: 'The investigative-journalist view (believed, then confirmed)',
      heldBy: 'Karen Hao and the record',
      steelman: 'Heard at its strongest \u2014 and confirmed by checking \u2014 this view documents what the industry would rather stay hidden: a mission-driven nonprofit became a capital-hungry for-profit, a CEO was fired and reinstalled by an employee-and-investor revolt in five days, the "safety" of the flagship product was purchased with under-$2/hour trauma-labeling in Nairobi, and the data centers draw resources at a scale that is provoking real communities to protest and sue. These are not fringe allegations; they are sourced, award-recognized reporting. A believer who honors truth honors this reporting \u2014 the Word attends to exactly these things: the withheld wage, the oppressed poor, the tower built for a name.',
    },
    {
      id: 'p-frame-tester',
      label: 'What testing the FRAME adds \u2014 and what it leaves standing',
      heldBy: 'believers weighing the analysis by the Word',
      steelman: 'Testing the frame is not doubting the facts. "Empire," "myth-making," and "break it up" are a powerful analytic lens \u2014 and mostly a righteous one \u2014 but they are still a human argument to be weighed, not scripture. Two cautions the Word adds: first, an industry\u2019s self-serving existential-risk myth is real (she is right that "only we can be trusted with the demon" is a power move) AND the underlying spiritual danger of the technology is also real (Issue 4) \u2014 the myth being cynical does not make the risk zero. Second, "break up the empire" can curdle into its own utopianism if it forgets that the human heart, not just the corporate structure, is what needs redeeming (Jeremiah 17:9). Keep the documented indictment; hold the totalizing frame with an open hand.',
    },
    {
      id: 'p-builder',
      label: 'The sovereign-builder view (this platform among them)',
      heldBy: 'believers building alternatives',
      steelman: 'Hao\u2019s call \u2014 support alternatives, build democratic participation, pursue utility without exploitation \u2014 is close to this platform\u2019s own founding charter (sovereign tools, family-owned data, serve-not-extract, no engagement optimization). The durable answer to an exploitative empire is not only critique; it is building the thing that does not exploit: technology where the Word is the source of answers, where the labourer is paid, where the data belongs to the family. Lament that only consumes the exposE9 changes nothing; building changes the defaults a household lives inside \u2014 and doing it JUSTLY, wages paid and dignity kept, is part of the witness (James 5:4; Micah 6:8).',
    },
  ],

  lens: {
    fourD: {
      deepSource: 'The Word both BELIEVES the documented harm and JUDGES the empire that caused it. On believing a true report: "the simple believeth every word: but the prudent man looketh well to his going" (Proverbs 14:15) is not a license to disbelieve \u2014 the prudent man LOOKS WELL, and when he looks and the sources hold, he believes; and "he that is first in his own cause seemeth just; but his neighbour cometh and searcheth him" (Proverbs 18:17) cuts toward the powerful here \u2014 the corporation is first in its own cause, and the journalist is the neighbour who came and searched. On the exploited labour, the Word is not neutral and neither are we: "Behold, the hire of the labourers who have reaped down your fields, which is of you kept back by fraud, crieth: and the cries of them which have reaped are entered into the ears of the Lord of sabaoth" (James 5:4); "Thou shalt not oppress an hired servant that is poor and needy... At his day thou shalt give him his hire" (Deuteronomy 24:14-15); "Woe unto him that... useth his neighbour\u2019s service without wages, and giveth him not for his work" (Jeremiah 22:13). The under-$2/hour trauma-labeling is precisely the withheld and under-paid hire the Word says CRIES to God \u2014 stated plainly (DR-0100). On the empire itself, the Babel pattern returns (Issue 4\u2019s lens): "let us build us a city and a tower, whose top may reach unto heaven; and let us make us a name" (Genesis 11:4) \u2014 an all-consolidating project for a name and against being "scattered" (against democratic dispersion of power); "Woe unto them that join house to house, that lay field to field, till there be no place" (Isaiah 5:8) names the monopolizing impulse; and the love of money under it is diagnosed exactly: "they that will be rich fall into temptation and a snare... for the love of money is the root of all evil" (1 Timothy 6:9-10). On the myth-making, "Beware lest any man spoil you through philosophy and vain deceit, after the tradition of men... and not after Christ" (Colossians 2:8) \u2014 a utopian AI-gospel is exactly a philosophy after the rudiments of the world. And the believer\u2019s mandate is not spectator outrage but advocacy and just building: "Open thy mouth for the dumb... plead the cause of the poor and needy" (Proverbs 31:8-9); "do justly, and love mercy, and walk humbly with thy God" (Micah 6:8). Not fear, not cynicism \u2014 a sound mind that believes the evidence, names the wrong, and builds the just alternative (2 Timothy 1:7).',
      scripture: 'Proverbs 14:15; Proverbs 18:17; James 5:4; Deuteronomy 24:14-15; Jeremiah 22:13; Genesis 11:4; Isaiah 5:8; 1 Timothy 6:9-10; Colossians 2:8; Proverbs 31:8-9; Micah 6:8; Ecclesiastes 5:8; 2 Timothy 1:7',
    },
    threeD: 'Practically: BELIEVE THE SOURCED, name the harm, weigh the frame. Bin 1 \u2014 DOCUMENTED, state plainly: the 2023 board ouster and employee-revolt reinstatement; the nonprofit\u2192capped-profit shift and Microsoft\u2019s stake; the Kenyan annotators under $2/hour labeling trauma for the safety filter; the real resource intensity and community pushback. These are established (a National-Book-Critics-Circle-Award book, TIME, NPR) \u2014 do not soften real damage to sound balanced (DR-0100). Bin 2 \u2014 the FRAME to weigh: "empire," "myth-making to consolidate power," "break it up" is a strong, mostly-righteous argument \u2014 test it by the Word (the labourer\u2019s wage cries, James 5:4; the tower-for-a-name is Babel, Genesis 11:4) and hold the totalizing parts with an open hand (structures need reform AND hearts need redeeming, Jeremiah 17:9). And the CONTRAST that teaches the skill: set this beside Issue 5 \u2014 same "credentialed insider" shape, opposite evidence quality; the credential never settled it, the sources did. Then respond the Word\u2019s way: plead the cause of the underpaid (Proverbs 31:8-9), and BUILD the just alternative rather than only sharing the expose.',
    accountability: {
      statement: 'THE TWO COURTS, applied to the empire and the witness alike. THE COMPANIES are accountable for documented harm no earthly court has fully reckoned: wages kept low on workers labeling trauma so a product could be sold as "safe" \u2014 "the hire of the labourers... kept back by fraud, crieth" (James 5:4), and a wage-court in Nairobi is not the last court; "God shall bring every work into judgment, with every secret thing" (Ecclesiastes 12:14), and the trauma carried by the underpaid is weighed as impact on life DURING life. The love-of-money root (1 Timothy 6:9-10) and the join-house-to-house monopolizing (Isaiah 5:8) are named where regulators have been slow. THE MYTH-MAKERS are accountable for the narrative: selling an existential-risk story to secure power, or a utopia-story to evade participation, is "philosophy and vain deceit" (Colossians 2:8) and a false balance (Proverbs 11:1) \u2014 and idle-but-load-bearing words are accounted for (Matthew 12:36). THE WITNESS is accountable too, the other way: Hao\u2019s reporting confirms under checking, which is its own vindication \u2014 but any journalist is bound to the just weight (Proverbs 11:1), and where a frame outruns its evidence it must be held as argument, not fact. AND WE are accountable for our response: to SEE the oppression of the poor and "marvel not... for he that is higher than the highest regardeth" (Ecclesiastes 5:8) is not passivity but the assurance that fuels action \u2014 to plead the cause (Proverbs 31:8-9) and to build justly (Micah 6:8), not to consume the outrage and move on. Denying documented worker-harm because we like the technology is calling evil good (Isaiah 5:20); swallowing the whole totalizing frame because the facts are true is believing every word (Proverbs 14:15). No one gets away \u2014 "Be not deceived; God is not mocked" (Galatians 6:7).',
      scripture: 'James 5:4; Ecclesiastes 12:14; 1 Timothy 6:9-10; Isaiah 5:8; Colossians 2:8; Proverbs 11:1; Matthew 12:36; Ecclesiastes 5:8; Proverbs 31:8-9; Micah 6:8; Isaiah 5:20; Galatians 6:7',
    },
    benefits: [
      'Both courts, honestly held: earthly justice is real but imperfect \u2014 some of the guilty walk free and some of the innocent suffer or sit in prison (Ecclesiastes 8:14; Joseph, Genesis 39:20; and the sinless Christ, "this man hath done nothing amiss," Luke 23:41) \u2014 while the ETERNAL court misses nothing and lands after this life (Ecclesiastes 12:14; Hebrews 9:27). Since all suffer and die regardless, the wise path is His way for the reward that outlasts it all (2 Corinthians 4:17; Hebrews 11:24-26).',
      'Believe-first in practice: a well-sourced voice is received with belief and confirmed (DR-0166), not met with reflexive doubt \u2014 proportion, not credulity.',
      'The credential-splits-on-evidence skill, seen in contrast: Issue 5\u2019s falsified insider beside Issue 6\u2019s confirmed one \u2014 the badge never settled it; the sources did.',
      'Real damage named as damage: the labourer\u2019s withheld wage (James 5:4) and trauma are stated plainly, never softened to sound balanced (DR-0100).',
      'Facts-vs-frame kept distinct: believe the documented events; weigh "empire / myth / break-it-up" as strong argument, not gospel.',
      'The Babel diagnosis extended: consolidation for a name, join-house-to-house monopoly, and the love-of-money root named by the Word (Genesis 11:4; Isaiah 5:8; 1 Timothy 6:9-10).',
      'Build-don\u2019t-just-lament: the platform\u2019s own charter (sovereign, family-owned, serve-not-extract, wages paid) is the Word\u2019s answer to an exploitative empire (Micah 6:8; Proverbs 31:8-9).',
      'Governance-is-reality (DR-0169): predict outcomes from the accountable STRUCTURE, not the CEO\u2019s professed goodness \u2014 the corrupt hate the light and the upright come to it (John 3:20-21); clarity, not a better billionaire, is the fix.',
      'The empire named by its archetype: the colonial "civilizing mission" is a counterfeit gospel (2 Timothy 3:5), and the extraction-economy that trafficks in souls is Babylon the merchant (Revelation 18:11-13) — refuse the myth, name the harm, build the fair exchange.',
      'Deterministic over probabilistic where it counts: the model’s statistical output is verified against machine-checkable gates, never trusted on its self-report (DR-0076) — the house practices the reliability Hao says the industry abandoned (Matthew 5:37).',
    ],
    graceNote: 'This lesson pronounces no verdict on Sam Altman\u2019s soul, nor on any worker or executive \u2014 that judgment is God\u2019s alone (Romans 14:4; James 4:12). Hao\u2019s own sharpest insight guards this: how people rate these leaders (visionary genius vs manipulator) tracks whether they SHARE the leader\u2019s vision \u2014 the same traits read as brilliance or menace depending on the viewer, so the leaders become mirrors, and the verdict says as much about the judge. And she concludes they are often not cynical liars but TRUE BELIEVERS IN THEIR OWN MYTH \u2014 which the Word already knows is the most dangerous state of all: the heart is deceitful above all things (Jeremiah 17:9), and evil men wax worse "deceiving, and being deceived" (2 Timothy 3:13). That is exactly why this lesson judges the FRAME and the FRUIT, never the heart \u2014 the structure outlasts the CEO (swap a moral one in and the empire\u2019s logic remains), so we weigh what is built and what it costs, not who is secretly sincere. Naming documented harm is not condemning a person; it is pleading the cause of the underpaid the Word tells us to plead (Proverbs 31:8-9). We believe the sourced account, state the damage plainly, test the frame by the Word, build the just alternative \u2014 and leave every heart, the CEO\u2019s and the annotator\u2019s alike, with God, before whom the Door stands open to all (John 10:9).',
    stewardship: 'The deeper answer to an exploitative AI empire is not only to share the expose \u2014 it is to BUILD the thing that does not exploit: sovereign tools where the Word is the source of answers, where the family owns the data, where the labourer is paid at his day (Deuteronomy 24:14-15), where nothing is optimized for engagement or extraction. The principle has a verse: \u201cthe sabbath was made for man, and not man for the sabbath\u201d (Mark 2:27) \u2014 the tool serves the person, never the reverse; a \u201cbicycle of AI\u201d that extends a person keeps that order, an \u201ceverything machine\u201d that replaces him inverts it. Human flourishing is the Word\u2019s own aim \u2014 work as dignity (Genesis 2:15, to dress and keep), each under his own vine unafraid (Micah 4:4), the peace of the whole city sought (Jeremiah 29:7) \u2014 not the flourishing of a few \u201chaves\u201d bought with the diminishment of the \u201chave-nots.\u201d This platform is one small act of exactly that; believe the witness, name the wrong, and build the alternative justly (Micah 6:8).',
    anchor: {
      ref: 'James 5:4',
      theme: 'The hire of the labourers... kept back by fraud, crieth \u2014 believe the documented wrong, name it plainly, and answer it by building the just alternative where the wage is paid and the data belongs to the family.',
    },
  },

  reflection: {
    skill: 'When a WELL-SOURCED voice indicts the powerful: BELIEVE FIRST and confirm (DR-0166) \u2014 the opposite of hunting a fringe claim to refute. State documented harm plainly as established fact (DR-0100); keep the FACTS (believe) distinct from the FRAME (weigh by the Word); and set it beside the falsified-insider case to see that "credentialed" splits on evidence, not on the badge. Then respond the Word\u2019s way: plead the cause of the underpaid, and build the just alternative rather than only lamenting.',
    practice: 'Take ONE documented claim from this account (the Kenyan annotators; the 2023 ouster; the structure shift) and find its primary source (TIME, NPR, the record). Then take ONE frame-claim ("myth-making," "empire") and write the verse that tests it. Finally, write one sentence on a BUILD-or-PLEAD response \u2014 something you will make, support, or advocate \u2014 rather than an outrage to forward.',
    prompts: [
      'Karen Hao\u2019s central factual claims CONFIRM under checking; a physician\u2019s (Issue 5) central claims FALSIFY. Their credentials are identical \u2014 so what actually did the separating, and what does that retire forever as an argument?',
      'The Word says the withheld hire of the labourer CRIES to God (James 5:4). How should under-$2/hour trauma-labeling for a "safety" filter be named \u2014 and what does softening it into "some say" cost?',
      'Where is the line between believing Hao\u2019s documented facts and adopting her whole "empire / break-it-up" frame? Which parts are established, and which are strong argument to weigh?',
      'She says the existential-risk narrative is a myth to consolidate power \u2014 and Issue 4 says the spiritual danger is real. How can BOTH be true at once (the myth cynical AND the risk real)?',
      'Genesis 11:4 (a tower for a name, against being scattered) \u2014 where do you see the Babel pattern in an industry consolidating capital, talent, and narrative? Where would that reading overreach?',
      'What will you BUILD, SUPPORT, or PLEAD in response \u2014 rather than one more expose you forward? Where does this platform\u2019s own charter (wages paid, data owned, serve-not-extract) already answer part of it?',
    ],
  },

  levels: {
    child: 'When a grown-up who studied something very carefully \u2014 like a reporter who spent SEVEN YEARS talking to hundreds of people \u2014 tells you what they found, the wise thing is usually to BELIEVE them and then double-check, not to argue right away. A reporter named Karen looked closely at the big computer-brain companies, and she found some sad true things: some workers far away were paid almost nothing to read terribly scary things all day so the computer would be "safe." The Bible says God HEARS it when a worker is not paid fairly \u2014 "the cry of the workers... has reached the ears of the Lord" (James 5:4)! God cares about the person who does the hard work. So two things to remember: (1) when someone did careful homework, believe them and check \u2014 that is different from someone just saying something scary on the internet; and (2) God wants workers treated fairly and paid. And the best answer to a company that does wrong is not just to be mad \u2014 it is to help build something GOOD instead, where everyone is treated right. God gave us a strong, calm mind to build good things (2 Timothy 1:7)!',
    teen: 'Here is the flip side of the discernment coin. In Issue 5, a credentialed doctor made claims that FELL APART when you checked them (the Amish "control group," vaccine-SIDS \u2014 both false). Here, a credentialed journalist makes claims that HOLD UP when you check them: Sam Altman really was fired by OpenAI\u2019s board and reinstated 5 days later when ~700 of 770 employees revolted; OpenAI really did morph from a nonprofit into a for-profit; and TIME documented that Kenyan workers were paid under $2/hour to label horrific content so ChatGPT could be "safe." Same "credentialed insider" setup \u2014 opposite result. THE LESSON: the credential never settles it; the SOURCES do. And when the sources are strong (260+ interviews, a major award, TIME, NPR), the right move is to BELIEVE and confirm, not to reflex-doubt \u2014 that\u2019s called proportion. Now keep two layers separate: the FACTS (believe them) and the FRAME ("empire," "myth-making," "break it up" \u2014 a strong argument to weigh by the Word, not a done deal). The Bible is FIERCE about the underpaid worker \u2014 their unpaid wages literally "cry" to God (James 5:4) \u2014 so naming that harm plainly is obedience, not politics. And the response isn\u2019t just outrage: it\u2019s to plead for the mistreated (Proverbs 31:8-9) and BUILD something that pays people right and doesn\u2019t exploit \u2014 which is literally what this platform is trying to be.',
    senior: 'For the seasoned believer, this issue is the deliberate counterweight that keeps discernment from curdling into cynicism. Issue 5 trained the muscle that DOUBTS a falsified claim; this one trains the muscle that BELIEVES a proven one \u2014 and a mature mind needs both, or it becomes a mere scoffer, which the Word never commends (Proverbs 14:15 says look well, THEN proceed \u2014 not disbelieve on principle). Hao\u2019s account is heavily sourced (260+ interviews, a National Book Critics Circle Award) and its checkable spine holds: the November 2023 board ouster and five-day employee-revolt reinstatement, the nonprofit-to-capped-profit restructuring with Microsoft\u2019s stake, and \u2014 most weighty \u2014 TIME\u2019s documentation of Kenyan annotators paid under $2/hour to label trauma for the safety filter. Believe-first (DR-0166) is not credulity here; it is proportion to strong evidence, and it honors the human voice the way the house now requires. State the documented harm PLAINLY (DR-0100): the withheld and meager wage of the labourer is precisely what Scripture says CRIES to the Lord of sabaoth (James 5:4; Deuteronomy 24:14-15; Jeremiah 22:13) \u2014 to mute that for the sake of sounding even-handed would be its own false balance (Proverbs 11:1). Then keep the elder\u2019s discipline of separating fact from frame: "empire," "myth-making," "break it up" is a strong and largely righteous analysis, and still a human argument \u2014 the industry\u2019s existential-risk myth can be cynical (a power move) WHILE the technology\u2019s spiritual danger is real (Issue 4); both hold. And model the Word\u2019s response over mere lament: "he that is higher than the highest regardeth" (Ecclesiastes 5:8) is not passivity but the confidence that frees you to plead the cause of the underpaid (Proverbs 31:8-9) and to build justly (Micah 6:8) \u2014 wages paid, data owned, nothing optimized for extraction. The Babel tower rises again for a name (Genesis 11:4); the answer of the fathers is not only to expose it but to build a truer house, and to pay everyone who lays its bricks.',
  },

  quiz: {
    questions: [
      {
        q: 'Karen Hao\u2019s account is heavily sourced (260+ interviews, a major award) and its checkable claims confirm. What is the right posture toward it?',
        options: ['Reflexive doubt \u2014 all critics have an agenda', 'Believe-first and confirm (DR-0166) \u2014 proportion to strong evidence, not credulity; a well-sourced voice earns the presumption a viral claim does not', 'Accept every word including the frame'],
        answer: 1,
        explain: 'Believe-first is not "believe everything." It is meeting strong evidence with belief and confirmation instead of reflexive suspicion \u2014 and it honors the human voice.',
      },
      {
        q: 'Set Issue 5 (a physician\u2019s falsified claims) beside Issue 6 (a journalist\u2019s confirmed ones). What separates them?',
        options: ['Their credentials \u2014 one is more qualified', 'The EVIDENCE \u2014 identical "credentialed insider" shape, opposite evidence quality; the badge never settled it, the sources did', 'Their tone'],
        answer: 1,
        explain: 'The whole two-issue lesson: "credentialed" is not one category. You always go to the sources \u2014 in both directions, to doubt AND to believe.',
      },
      {
        q: 'TIME documented Kenyan workers paid under $2/hour labeling traumatic content for ChatGPT\u2019s safety filter. How does the Word have you name it?',
        options: ['Gently, as "some say," to stay balanced', 'Plainly, as real damage \u2014 "the hire of the labourers... kept back by fraud, crieth" (James 5:4); softening verified harm is its own false balance (Proverbs 11:1; DR-0100)', 'Not at all \u2014 business is business'],
        answer: 1,
        explain: 'The withheld wage of the labourer cries to God. Under-claiming a documented harm to sound even-handed is exactly the failure DR-0100 forbids.',
      },
      {
        q: 'Hao says the existential-risk narrative is a myth to consolidate power; Issue 4 says the spiritual danger is real. Can both be true?',
        options: ['No \u2014 pick one', 'Yes \u2014 the myth can be a cynical power move AND the underlying risk can be real; believing her facts does not oblige denying the danger, and naming the danger does not deny her point', 'Only if you distrust both'],
        answer: 1,
        explain: 'Facts and frame stay distinct. A self-serving myth and a genuine risk can coexist \u2014 weigh each on its own evidence rather than forcing a single verdict.',
      },
      {
        q: 'What is the believer\u2019s response to a documented, exploitative "AI empire"?',
        options: ['Consume the expose and move on', 'Deny it because the tech is useful', 'Plead the cause of the underpaid (Proverbs 31:8-9) AND build the just alternative \u2014 wages paid, data owned, serve-not-extract (Micah 6:8) \u2014 not lament alone'],
        answer: 2,
        explain: 'Neither outrage-scrolling nor denial. See the oppression without marveling (Ecclesiastes 5:8), plead the cause, and build the truer house that pays its labourers (James 5:4; Deuteronomy 24:14-15).',
      },
    ],
  },
};

// =============================================================================
// ISSUE 7 — the Prison Industrial Complex (spoken lesson input, Darrell
// 2026-08-04). THREE LAYERS, each attributed honestly: (1) a video series
// (part 1) defining the PIC as a systemic INCENTIVE structure, not private
// prisons or a conspiracy; (2) a Gemini AI analysis Darrell brought alongside
// it, arguing the video underweights deliberate ARCHITECTURE (lobbying, the
// War on Drugs, the 1994 Crime Bill); (3) the same analysis's three-point
// TRANSFORMATION plan (repeal the 13th Amendment exception clause; economic
// transition packages for prison-dependent towns; reallocate carceral capital
// to root causes). The discernment move this issue adds to the track: weigh a
// SYSTEM — and an AI's analysis of it — the same way as any creator's claim
// (DR-0076: AI output that looks right is verified claim by claim), and let
// the Word supply the categories it already has for every layer: persons may
// never be commodities (Exodus 21:16; Amos 2:6), laws can be written to prey
// (Isaiah 10:1-2), judges can judge for reward (Micah 3:11), the magistrate's
// sword is still real (Romans 13:3-4), and Yahweh's stated justice is
// restitution and jubilee, not profitable cages (Exodus 22:1; Leviticus
// 25:10; Isaiah 61:1). Every figure verified by live web search 2026-08-04;
// every verse fetched verbatim from the local KJV (DR-0076).
// =============================================================================
const PRISON_INDUSTRIAL_ISSUE = {
  id: 'wi-prison-industrial-complex',
  title: 'The Prison Industrial Complex — Incentives, Architects, and the Jubilee Question',
  subject: { name: 'the prison industrial complex (the US carceral system and its economic incentives)', kind: 'system', isNamedRealPerson: false },
  skill: 'Take a video’s systems-analysis of mass incarceration, a counter-analysis that tests it, and a three-point transformation plan — and practice discernment at the SYSTEM level: state the documented spine plainly (the scale, the labor economics, the lobbying, the deliberate laws), keep INCENTIVE and INTENT distinct without letting either erase the other, weigh every analysis by evidence exactly as you would any creator’s, and test every proposed remedy against the justice the Word actually specifies — restitution over profitable confinement, liberty proclaimed on a schedule, the magistrate’s sword honored, and no person ever a commodity.',
  source: {
    creator: 'the class',
    medium: 'examination of a video series on the Prison Industrial Complex (part 1)',
    title: 'part 1 of a series defining the Prison Industrial Complex, examined with a counter-analysis and a transformation plan',
    url: 'https://www.prisonpolicy.org/reports/pie2025.html',
    asOf: '2026-08-04',
    note: 'Attribution kept honest by layer, plain and balanced for the student: the summary claims are the VIDEO’s argument; the "this fails because" critique and the three-point transformation plan are this class’s own counter-analysis — presented at full strength beside the video’s case, weighed like every voice, never repeated as a verdict; every claim verified against the primary data (the URL points to it).',
  },

  // ---- STAGE 1 — THE CLAIMS: the video's, then the AI's, then the plan's. ----
  claims: [
    {
      id: 'c-not-private-prisons',
      text: 'The popular picture is wrong: the Prison Industrial Complex is not mainly private prisons — private facilities are only a fraction of the issue, and dwelling on them misses the system.',
      label: 'claim',
      attribution: 'the video (part 1 of the PIC series)',
      note: 'The FRACTION is documented and stated plainly: about 8% of incarcerated people are held in privately-run facilities (Prison Policy Initiative). Whether that makes private prisons "the least interesting part" is the video’s judgment call — and exactly where the counter-analysis pushes back (see c-counter-lobbying).',
    },
    {
      id: 'c-etymology',
      text: 'The term adapts Eisenhower’s 1961 "military-industrial complex" warning — an economy built on weapons generating its own appetite for war — applied to prisons in 1998 by journalist Eric Schlosser and scholar Angela Davis, and developed by geographer Ruth Wilson Gilmore.',
      label: 'claim',
      attribution: 'the video (part 1 of the PIC series)',
      note: 'DOCUMENTED on every point: Eisenhower’s farewell address (January 17, 1961) coined the phrase and the warning; Schlosser’s "The Prison-Industrial Complex" ran in The Atlantic in December 1998; Davis published "Masked Racism: Reflections on the Prison Industrial Complex" the same year and co-founded Critical Resistance (1998) with Ruth Wilson Gilmore, whose Golden Gulag (2007) built out the political-economy analysis.',
    },
    {
      id: 'c-incentives',
      text: 'The PIC operates because companies, labor unions, rural towns, and politicians become financially and politically dependent on high incarceration rates — the system resists shrinking without requiring any explicit conspiracy; nobody has to conspire.',
      label: 'claim',
      attribution: 'the video (part 1 of the PIC series)',
      note: 'The dependence is documented (prison-town employment shares, guard-union politics, the $80B+ public payroll); "nobody has to conspire" is the video’s interpretive FRAME — true about how the system PERSISTS, and the precise point where the critique says it obscures how the system was BUILT (see c-counter-architecture).',
    },
    {
      id: 'c-scale',
      text: 'The United States incarcerates nearly 2 million people, driven primarily by economic and political incentives rather than mere cruelty.',
      label: 'claim',
      attribution: 'the video (part 1 of the PIC series)',
      note: 'The NUMBER is documented (Prison Policy Initiative, "Mass Incarceration: The Whole Pie"). "Driven primarily by incentives" is the causal frame — strong analysis, held as interpretation, because deliberate policy choices are also in the documented record.',
    },
    {
      id: 'c-counter-lobbying',
      text: 'The video fails by dismissing private prisons: corporate lobbying by GEO Group and CoreCivic, and profit-driven contracting, actively engineered and accelerated the legislative push for mass incarceration.',
      label: 'claim',
      attribution: 'the class’s counter-analysis',
      note: 'The LOBBYING is documented and said plainly: GEO Group and CoreCivic spent $1.38M and $1.77M respectively on federal lobbying in 2024, and GEO-linked contributions totaled $3.7M in the 2024 cycle (OpenSecrets). "Actively engineered mass incarceration" is the causal LEAP: the great sentencing build-out (1970s–1990s) largely preceded the industry’s scale, so "entrenches and profits from what policy built" is the documented shape; "engineered it" outruns the record.',
    },
    {
      id: 'c-counter-mic-parallel',
      text: 'The video fails by leaning on the military-industrial parallel: defense contractors sell goods to the state, whereas carceral profit is extracted through ancillary services — communications, healthcare, food — around state-managed confinement.',
      label: 'opinion',
      attribution: 'the class’s counter-analysis',
      note: 'A structural observation with a documented spine: the ancillary-services economy is real — prison telecom priced a 15-minute jail call at $11.35 before the FCC’s July 2024 caps (adopted under the Martha Wright-Reed Act, banning kickbacks to facilities), and the FCC postponed those rules in 2025, letting high rates continue. Whether that breaks Eisenhower’s analogy or refines it is an analytic judgment — labeled opinion.',
    },
    {
      id: 'c-counter-architecture',
      text: 'The video fails because "nobody has to conspire" obscures intentional, coordinated political choices — the War on Drugs, mandatory minimum sentencing, and the 1994 Crime Bill — deliberately architected to expand state control over specific populations.',
      label: 'claim',
      attribution: 'the class’s counter-analysis',
      note: 'The LAWS are documented deliberate acts: the 1994 Violent Crime Control and Law Enforcement Act funded prison construction and conditioned incentive grants on truth-in-sentencing (85% of sentence served), alongside the mandatory-minimum era. That policy was CHOSEN is fact; the unified MOTIVE ("architected to control specific populations") is the interpretive fork — the same events-vs-intent split this track practiced on the Flexner history in Issue 5.',
    },
    {
      id: 'c-repeal-exception',
      text: 'An actual transformation requires repealing the 13th Amendment’s exception clause, which permits involuntary servitude as punishment for crime — removing the framework that incentivizes cheap labor extraction and the commodification of incarcerated human beings.',
      label: 'call-to-action',
      attribution: 'the transformation plan (echoing the Abolition Amendment movement)',
      note: 'The CLAUSE is verbatim constitutional text and the movement is real (the Merkley–Booker–Williams Abolition Amendment; seven-plus states have removed state-level exceptions since 2018). Carried as a labeled position — and tested against the documented state results, including two rejections, in Stage 2.',
    },
    {
      id: 'c-transition',
      text: 'Real change requires severing the financial dependence of local economies and public-sector unions on prison bed counts — targeted federal and state economic transition packages replacing carceral infrastructure with new industry BEFORE downsizing prison populations.',
      label: 'call-to-action',
      attribution: 'the transformation plan',
      note: 'Rests on a documented premise (rural counties where prisons exceed 20% of employment; closures concentrated where economies can absorb them). The prescription — transition first, then downsize — is a position, and notably the most economically self-consistent piece of the plan: it takes its own incentive analysis seriously.',
    },
    {
      id: 'c-reallocate',
      text: 'An actual transformation requires systemically reallocating state and federal budgets away from carceral containment into housing, healthcare, and community economic infrastructure that addresses root causes before criminalization occurs.',
      label: 'call-to-action',
      attribution: 'the transformation plan',
      note: 'The budget FACTS underneath are documented ($80B+ direct corrections spending; $182B system-wide). The reallocation itself is a contested policy position — steelmanned in Stage 3 against the public-safety perspective, which the plan’s own framing ("under the guise of public safety") tends to wave off rather than answer.',
    },
  ],

  // ---- STAGE 2 — VERIFIABLE vs INTERPRETATION (all verified 2026-08-04). ----
  verifiable: [
    {
      id: 'f-scale-and-share',
      statement: 'The US incarcerates nearly 2 million people on any given day, and — contrary to the popular picture — only about 8% are held in privately-run facilities. Both the video’s scale claim and its "private prisons are a fraction" claim are DOCUMENTED.',
      status: 'documented',
      sources: [
        { title: 'Mass Incarceration: The Whole Pie 2025', publisher: 'Prison Policy Initiative', url: 'https://www.prisonpolicy.org/reports/pie2025.html', asOf: '2026-08-04' },
      ],
      note: 'Verified 2026-08-04. The single most load-bearing dataset under both layers — the video leans on it for scale, and the 8% figure is what makes "the PIC is not mainly private prisons" a documented correction of the popular picture, not a hot take.',
    },
    {
      id: 'f-term-history',
      statement: 'The term’s lineage is as the video gives it: Eisenhower’s farewell address (January 17, 1961) warned against "the acquisition of unwarranted influence... by the military-industrial complex"; Eric Schlosser’s "The Prison-Industrial Complex" ran in The Atlantic in December 1998; Angela Davis published "Masked Racism: Reflections on the Prison Industrial Complex" in 1998 and co-founded Critical Resistance that year with Ruth Wilson Gilmore, whose Golden Gulag (2007) developed the political-economy account.',
      status: 'documented',
      sources: [
        { title: 'Dwight D. Eisenhower’s farewell address', publisher: 'Wikipedia / National Archives', url: 'https://en.wikipedia.org/wiki/Dwight_D._Eisenhower%27s_farewell_address', asOf: '2026-08-04' },
        { title: 'Eric Schlosser, "The Prison-Industrial Complex" (The Atlantic, Dec. 1998)', publisher: 'The Atlantic / JSTOR', url: 'https://www.jstor.org/stable/community.33126674', asOf: '2026-08-04' },
        { title: 'Critical Resistance (founded 1998 by Davis, Gilmore, Braz); Gilmore, Golden Gulag (UC Press, 2007)', publisher: 'Wikipedia / UC Press', url: 'https://en.wikipedia.org/wiki/Critical_Resistance', asOf: '2026-08-04' },
      ],
      note: 'Verified 2026-08-04. An etymology claim that checks out completely — worth pausing on, because a video that gets its history exactly right has earned real credibility for its harder claims (proportion, as practiced in Issue 6), without that credibility transferring automatically to its FRAME.',
    },
    {
      id: 'f-13th-exception',
      statement: 'The 13th Amendment (1865) reads: "Neither slavery nor involuntary servitude, except as a punishment for crime whereof the party shall have been duly convicted, shall exist within the United States." The exception clause is live constitutional text; the federal Abolition Amendment to strike it (Merkley–Booker–Williams) has been introduced repeatedly — drawing 200+ cosponsors in the 117th Congress — and has not passed.',
      status: 'documented',
      sources: [
        { title: 'The Abolition Amendment (summary and text)', publisher: 'Office of Sen. Jeff Merkley', url: 'https://www.merkley.senate.gov/wp-content/uploads/imo/media/doc/abolition_amendment_summary.pdf', asOf: '2026-08-04' },
        { title: 'Congresswoman Nikema Williams Reintroduces the Bicameral Abolition Amendment', publisher: 'Office of Rep. Nikema Williams', url: 'https://nikemawilliams.house.gov/posts/congresswoman-nikema-williams-reintroduces-the-bicameral-abolition-amendment-to-finally-end-slavery', asOf: '2026-08-04' },
      ],
      note: 'Verified 2026-08-04. The transformation plan’s first point rests on real text and a real, active movement — the legal premise is sound. What the plan must still face is the state-level RECORD (next item): the clause’s removal has been put to actual voters, with mixed results that teach the lesson’s economics better than any theory.',
    },
    {
      id: 'f-state-record',
      statement: 'The state-level record on removing slavery/involuntary-servitude exception clauses: Colorado (2018), Utah and Nebraska (2020), Alabama, Oregon, Tennessee, and Vermont (2022), and Nevada (2024) approved removal — while Louisiana voters REJECTED their 2022 measure (its own sponsor urged a no vote over ambiguous drafting) and California voters REJECTED Proposition 6 in November 2024, after a fiscal analysis attached a roughly $1.5 billion prison-wage price tag.',
      status: 'documented',
      sources: [
        { title: 'Voters End Slavery Loophole at the Ballot Box in 7 States', publisher: 'Ballot Initiative Strategy Center', url: 'https://ballot.org/news/voters-end-slavery-loophole-at-the-ballot-box-in-7-states/', asOf: '2026-08-04' },
        { title: 'California Proposition 6 (2024) — results and fiscal analysis', publisher: 'CalMatters / Ballotpedia', url: 'https://calmatters.org/politics/elections/2024/11/california-election-result-proposition-6-fails/', asOf: '2026-08-04' },
        { title: 'Louisiana Amendment 7 (2022) — rejected; sponsor opposed final language', publisher: 'Louisiana Illuminator / Ballotpedia', url: 'https://lailluminator.com/2022/11/08/louisiana-voters-reject-ban-on-slavery-involuntary-servitude-author-also-opposed-it/', asOf: '2026-08-04' },
      ],
      note: 'Verified 2026-08-04. The most instructive fact in the lesson: California’s rejection turned substantially on the COST of paying incarcerated workers — the electorate balked at the price of ending unpaid labor, which CONFIRMS the incentive analysis (the economics really do hold the structure in place) while complicating the plan (a bare repeal without the transition economics fails at real ballot boxes).',
    },
    {
      id: 'f-captive-labor',
      statement: 'The prison-labor economy is documented: incarcerated workers produce over $2 billion in goods and over $9 billion in prison-maintenance services annually; average wages run 13–52 cents per hour, several states pay nothing for most prison jobs, and over 65% of incarcerated people surveyed report being required to work (ACLU / University of Chicago Global Human Rights Clinic, "Captive Labor," June 2022).',
      status: 'documented',
      sources: [
        { title: 'Captive Labor: Exploitation of Incarcerated Workers', publisher: 'ACLU / U. Chicago Global Human Rights Clinic', url: 'https://www.aclu.org/publications/captive-labor-exploitation-incarcerated-workers', asOf: '2026-08-04' },
      ],
      note: 'Verified 2026-08-04. This is the documented substance under the plan’s "cheap labor extraction and commodification" language — stated plainly per DR-0100: real, measured, and not softened into "some say." It is also precisely the economics the 13th Amendment’s exception clause shelters.',
    },
    {
      id: 'f-money',
      statement: 'The public money is documented: direct corrections spending (prisons, jails, parole, probation) runs about $81 billion a year (Bureau of Justice Statistics), and the Prison Policy Initiative’s system-wide accounting — adding policing, courts, and the costs borne by families — totals roughly $182 billion a year.',
      status: 'documented',
      sources: [
        { title: 'Following the Money of Mass Incarceration', publisher: 'Prison Policy Initiative', url: 'https://www.prisonpolicy.org/reports/money.html', asOf: '2026-08-04' },
        { title: 'Mass Incarceration Costs $182 Billion Every Year', publisher: 'Equal Justice Initiative', url: 'https://eji.org/news/mass-incarceration-costs-182-billion-annually/', asOf: '2026-08-04' },
      ],
      note: 'Verified 2026-08-04. The reallocation debate (c-reallocate) is a real debate about real money — both the scale of the carceral budget and the fact that roughly half of correctional spending is payroll, which is why the transition-package point and the union-dependence point are the same point.',
    },
    {
      id: 'f-deliberate-laws',
      statement: 'The deliberate-architecture claim has a documented spine: the 1994 Violent Crime Control and Law Enforcement Act — the largest crime bill in US history — funded roughly $9.7 billion for prisons and conditioned additional incentive grants on states adopting truth-in-sentencing laws (85% of sentence served), driving longer sentences and prison construction, atop the mandatory-minimum and drug-war sentencing regime built from the 1970s–1990s. These were chosen policies, enacted by named coalitions — not weather.',
      status: 'documented',
      sources: [
        { title: 'Violent Crime Control and Law Enforcement Act of 1994 (H.R. 3355)', publisher: 'Congress.gov / US House History', url: 'https://www.congress.gov/bill/103rd-congress/house-bill/3355', asOf: '2026-08-04' },
        { title: 'The 1994 Crime Bill and Beyond: How Federal Funding Shapes the Criminal Justice System', publisher: 'Brennan Center for Justice', url: 'https://www.brennancenter.org/our-work/analysis-opinion/1994-crime-bill-and-beyond-how-federal-funding-shapes-criminal-justice', asOf: '2026-08-04' },
      ],
      note: 'Verified 2026-08-04. The counter-analysis’s strongest documented point: "nobody has to conspire" describes the system’s MAINTENANCE, but its CONSTRUCTION has named statutes, named sponsors, and recorded votes. What stays interpretive is the unified motive claim — see n-incentive-vs-intent.',
    },
    {
      id: 'f-ancillary-economy',
      statement: 'The ancillary-services profit economy is documented: before federal caps, a 15-minute phone call from a large jail could cost $11.35; the FCC’s July 2024 rules under the Martha Wright-Reed Act capped rates (about 6¢/minute for prisons), banned the "site commission" kickbacks providers paid facilities for contracts, and were projected to cut that call to about 90 cents — and in 2025 the FCC postponed those rules, allowing higher rates to continue.',
      status: 'documented',
      sources: [
        { title: 'FCC votes to slash prison and jail calling rates and ban corporate kickbacks', publisher: 'Prison Policy Initiative', url: 'https://www.prisonpolicy.org/blog/2024/07/18/fcc-vote/', asOf: '2026-08-04' },
        { title: 'FCC postpones its groundbreaking 2024 rules', publisher: 'Prison Policy Initiative', url: 'https://www.prisonpolicy.org/blog/2025/07/02/fcc-reversal/', asOf: '2026-08-04' },
      ],
      note: 'Verified 2026-08-04. The counter-analysis’s MIC-parallel point lands on real ground here: the profit is extracted not from the state alone but from the poorest families on the outside, paying by the minute to keep a family intact — the exact "service without wages" shape Jeremiah 22:13 names, and a documented harm stated plainly.',
    },
    {
      id: 'f-prison-towns',
      statement: 'Rural economic dependence is documented: prison-building became a rural development strategy from the late 1970s onward; in some rural counties prisons account for over 20% of total employment; research finds the promised economic benefits largely fail to materialize — and of US prison closures since 2000, nearly 80% happened in urban communities positioned to absorb the loss, not the dependent rural towns.',
      status: 'documented',
      sources: [
        { title: 'Curbing Rural Prison Demand and Responsibly Closing Prisons', publisher: 'Urban Institute', url: 'https://www.urban.org/urban-wire/curbing-rural-prison-demand-and-responsibly-closing-prisons', asOf: '2026-08-04' },
        { title: 'Prison-Based Economic Development: What the Evidence Tells Us', publisher: 'International Journal of Rural Criminology', url: 'https://ruralcriminology.org/index.php/IJRC/article/view/8679', asOf: '2026-08-04' },
      ],
      note: 'Verified 2026-08-04. Confirms the video’s dependence claim AND the plan’s transition-first premise at once — and adds the sobering twist that prisons under-deliver even for the towns that depend on them: the dependence is real, and the bargain was bad.',
    },
  ],

  interpretation: [
    { id: 'n-incentive-vs-intent', statement: 'The video’s incentive frame and the counter-analysis’s architecture critique are BOTH partly right, about different phases: the system’s CONSTRUCTION has documented deliberate acts (named statutes, sponsors, votes — f-deliberate-laws), and its PERSISTENCE genuinely needs no conspiracy — payrolls, budgets, and bed-count dependence maintain what policy built (f-prison-towns, f-money). "Nobody has to conspire" is true of the engine running and false as a history of its assembly. Hold the events as fact and the unified-motive story as interpretation — the same discipline this track learned on the Flexner history.', restsOn: ['f-deliberate-laws', 'f-prison-towns', 'f-money'] },
    { id: 'n-private-prison-weight', statement: 'On private prisons, the documented record cuts between the video and the critique: 8% is real (the video’s correction stands), lobbying millions are real (the critique’s fact stands), but "engineered mass incarceration" overruns the timeline — the sentencing build-out largely preceded the industry’s scale. The documented shape is entrenchment: an industry that profits from, lobbies to preserve, and expands with the system, without having originated it.', restsOn: ['f-scale-and-share', 'f-deliberate-laws'] },
    { id: 'n-plan-meets-ballot', statement: 'The transformation plan has been partially field-tested and the results are instructive: eight states removed their exception clauses — and California’s 2024 rejection turned on a $1.5B wage price tag, proving the plan’s OWN thesis (economics hold the structure in place) against its own first point (a bare repeal without the transition economics loses real elections). The plan’s second point — transition packages BEFORE downsizing — is its most economically serious, precisely because it prices what the first point leaves unpriced.', restsOn: ['f-state-record', 'f-13th-exception'] },
    { id: 'n-ai-as-voice', statement: 'The counter-analysis performed like any credentialed voice this track has weighed: its factual spine checked out (lobbying figures, the named statutes, the ancillary economy), while its causal-intent claims ("engineered," "architected to control specific populations") are interpretation wearing fact’s clothing. Fluency gets no badge-credit and no badge-penalty — like the doctor’s credential in Issue 5, it is constant across true and overreaching claims; only verification separates them (DR-0076).', restsOn: ['f-deliberate-laws', 'f-ancillary-economy'] },
  ],

  perspectives: [
    {
      id: 'p-systemic',
      label: 'The systems view (the video’s frame)',
      heldBy: 'Gilmore, Schlosser, and the abolitionist political-economy tradition',
      steelman: 'Heard at its strongest: chasing villains misses how the machine actually runs. Two million people are not held by a cartoon conspiracy but by a million ordinary paychecks — the guard’s union dues, the rural county’s largest employer, the legislator’s district jobs, the vendor’s contract. Eisenhower’s insight transfers exactly: an economy organized around an apparatus generates its own appetite for the apparatus. That is why decades of scandal have produced so little shrinkage — exposure changes feelings, not incentives — and why any serious change must re-plumb the money, which the transformation plan’s transition-package point takes seriously. Naming the incentive structure is not excusing anyone; it is aiming at the actual load-bearing wall.',
    },
    {
      id: 'p-architecture',
      label: 'The deliberate-architecture view (the critique’s frame)',
      heldBy: 'the counter-analysis, and historians of the drug war and sentencing era',
      steelman: 'Heard at its strongest: "it’s just incentives" launders responsibility. The War on Drugs was announced; mandatory minimums were drafted and voted; the 1994 Crime Bill paid states billions to lengthen sentences — each a chosen act by named people who were warned of the consequences at the time. A frame in which "nobody has to conspire" quietly retires the categories of authorship and repentance: no one wrote the unrighteous decree, it merely emerged. Isaiah 10:1 refuses that comfort — "Woe unto them that DECREE unrighteous decrees, and that WRITE grievousness which they have prescribed" — the Word insists laws have authors. And the lobbying record shows the profiting interests did not merely respond to the system; they paid, and pay, to keep and grow it.',
    },
    {
      id: 'p-order',
      label: 'The public-order view',
      heldBy: 'victims’ advocates, many in law enforcement and corrections, and many in the neighborhoods most exposed to violence',
      steelman: 'Heard at its strongest: real crime has real victims — disproportionately the poor — and the sword of the magistrate is not man’s invention: "he beareth not the sword in vain: for he is the minister of God, a revenger to execute wrath upon him that doeth evil" (Romans 13:4). Some confinement is just, some people are dangerous, and a plan that reallocates "before criminalization occurs" must still answer: what happens the night of the assault, before the root causes are healed? The corrections officer is a neighbor doing dangerous work honorably inside a structure he did not design; the prison-town family is not a profiteer. This view rightly refuses any transformation that spends the vulnerable as the transition cost — and it can hold all of that while agreeing that a system profiting from bodies has left "public safety" far behind.',
    },
    {
      id: 'p-word-justice',
      label: 'The Word’s-justice view',
      heldBy: 'believers reading the carceral question through what Yahweh actually specified',
      steelman: 'Heard at its strongest: the Word’s justice system is startlingly concrete and matches NEITHER side’s defaults. Its penalty for theft is restitution that restores the victim and re-dignifies the thief through repayment — "he shall restore five oxen for an ox, and four sheep for a sheep" (Exodus 22:1); its labor ideal is work that heals — "let him labour... that he may have to give to him that needeth" (Ephesians 4:28); its hardest line is against making merchandise of a human being — "he that stealeth a man, and selleth him... shall surely be put to death" (Exodus 21:16) — and against courts that monetize the poor — "they sold the righteous for silver, and the poor for a pair of shoes" (Amos 2:6); and it builds RELEASE into the calendar itself — "proclaim liberty throughout all the land" (Leviticus 25:10). It also honors the magistrate’s sword (Romans 13:3-4) — so this view is not anti-justice; it is anti-commodification. By that measure, a system extracting billions from captive labor and captive families’ phone calls is not too harsh a justice system — it is not a justice system; it is a market wearing one’s robes (Micah 3:11).',
    },
  ],

  lens: {
    fourD: {
      deepSource: 'The Word carries a category for every layer this issue surfaced, and it had them first. For the commodification the plan names: "he that stealeth a man, and selleth him, or if he be found in his hand, he shall surely be put to death" (Exodus 21:16) — trafficking in persons is a capital line in Yahweh’s law, and "they sold the righteous for silver, and the poor for a pair of shoes" (Amos 2:6) is His indictment of courts that turn the poor into revenue. For the architecture the critique names: "Woe unto them that decree unrighteous decrees, and that write grievousness which they have prescribed; To turn aside the needy from judgment, and to take away the right from the poor of my people" (Isaiah 10:1-2) — laws have authors, and Micah 3:11 names the profit motive on the bench itself: "The heads thereof judge for reward." For the incentive structure the video names: "If thou seest the oppression of the poor, and violent perverting of judgment and justice in a province, marvel not at the matter: for he that is higher than the highest regardeth" (Ecclesiastes 5:8) — Scripture is unsurprised by systemic, layered oppression and unimpressed by it. For the remedy: Yahweh’s justice restores rather than warehouses — fourfold and fivefold restitution (Exodus 22:1), labor that makes a man a giver again (Ephesians 4:28), Zacchaeus measuring repentance in restored money — "I restore him fourfold" (Luke 19:8) — and His economy schedules release: "proclaim liberty throughout all the land unto all the inhabitants thereof" (Leviticus 25:10), "to loose the bands of wickedness... and to let the oppressed go free" (Isaiah 58:6). The Son announced His own mission in exactly these terms: "he hath sent me... to proclaim liberty to the captives, and the opening of the prison to them that are bound" (Isaiah 61:1; Luke 4:18) — and He locates Himself INSIDE the cell: "I was in prison, and ye came unto me" (Matthew 25:36), "Remember them that are in bonds, as bound with them" (Hebrews 13:3). And the same Word honors the sword that restrains evil (Romans 13:3-4) and commands "That which is altogether just shalt thou follow" (Deuteronomy 16:20) — so the believer is not choosing between order and mercy; he is refusing the third thing, profit, a seat at justice’s table. And the Word refuses to leave the lesson at the earthly cell, because the Christ’s Kingdom names a deeper captivity that holds every human being, free citizen and prisoner alike: "Whosoever committeth sin is the servant of sin" (John 8:34), ensnared by the adversary, "taken captive by him at his will" (2 Timothy 2:26), and held "all their lifetime subject to bondage" through the fear of death (Hebrews 2:15). Against THAT prison the Kingdom’s emancipation is total and finished: "If the Son therefore shall make you free, ye shall be free indeed" (John 8:36); "the law of the Spirit of life in Christ Jesus hath made me free from the law of sin and death" (Romans 8:2); the Father "hath delivered us from the power of darkness, and hath translated us into the kingdom of his dear Son" (Colossians 1:13). Jesus broke the deepest prison from the inside — "that through death he might destroy him that had the power of death" (Hebrews 2:14), rising with "the keys of hell and of death" (Revelation 1:18), having "led captivity captive" (Ephesians 4:8) — so the taunt over the last enemy stands forever: "O death, where is thy sting? O grave, where is thy victory?" — "thanks be to God, which giveth us the victory through our Lord Jesus Christ" (1 Corinthians 15:55, 57). "For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord" (Romans 6:23). This is why Isaiah 61:1 anchors the lesson twice over: the same Anointed One who proclaims "the opening of the prison" is the only One who opens the prison no reform can — and the freed are commanded to live free: "Stand fast therefore in the liberty wherewith Christ hath made us free" (Galatians 5:1). Then see deeper still (Darrell’s word over this lesson, 2026-08-04): the 3rd-dimensional operational friction this issue has been measuring — the statutes, the budgets, the bed counts, the lobbying — is the visible surface of a war that is not 3rd-dimensional at all: "For we wrestle not against flesh and blood, but against principalities, against powers, against the rulers of the darkness of this world, against spiritual wickedness in high places" (Ephesians 6:12). Two Kingdoms contend — Light and darkness — over humans and their souls: "the light shineth in darkness; and the darkness comprehended it not" (John 1:5). The adversary’s side operates by blinding — "the god of this world hath blinded the minds of them which believe not" (2 Corinthians 4:4) — and Yahweh’s side by illumination: "God, who commanded the light to shine out of darkness, hath shined in our hearts, to give the light of the knowledge of the glory of God in the face of Jesus Christ" (2 Corinthians 4:6), calling a people "out of darkness into his marvellous light" (1 Peter 2:9), turning them "from darkness to light" (Acts 26:18). The stakes of that war equate exactly as declared: Eternal Peace versus Death — "to be carnally minded is death; but to be spiritually minded is life and peace" (Romans 8:6), under the Prince of Peace whose government never ends: "Of the increase of his government and peace there shall be no end" (Isaiah 9:7). And the operational deficit that keeps communities and families captive is KNOWLEDGE: "My people are destroyed for lack of knowledge" (Hosea 4:6) — while the Kingdom’s own definition of eternal life IS knowledge: "And this is life eternal, that they might know thee the only true God, and Jesus Christ, whom thou hast sent" (John 17:3). So the weapons that pull down the strongholds behind the 3D friction are not carnal: "the weapons of our warfare are not carnal, but mighty through God to the pulling down of strong holds" (2 Corinthians 10:4), "bringing into captivity every thought to the obedience of Christ" (2 Corinthians 10:5) — the one captivity the Word commands. A family that carries this Knowledge — "choose life, that both thou and thy seed may live" (Deuteronomy 30:19); "as for me and my house, we will serve the LORD" (Joshua 24:15) — is a household breaking free of sin and death in the only war where that freedom is finally won. And the war is ENGINEERED on both sides of the spectrum, macro and micro (Darrell’s word, same sitting). Darkness engineers at MACRO scale — the decreed statute, the system built to prey ("Woe unto them that decree unrighteous decrees," Isaiah 10:1) — and at MICRO scale, one mind at a time ("the god of this world hath blinded the minds," 2 Corinthians 4:4; "Whosoever committeth sin is the servant of sin," John 8:34). The Kingdom of Light engineers at MACRO scale — jubilee priced into land law fifty years ahead (Leviticus 25:10), a government of peace without end (Isaiah 9:7), and nothing standing that He does not build: "Except the LORD build the house, they labour in vain that build it" (Psalm 127:1) — and at MICRO scale, heart by heart and thought by thought: light shined "in our hearts" (2 Corinthians 4:6), "be ye transformed by the renewing of your mind" (Romans 12:2), "bringing into captivity every thought" (2 Corinthians 10:5), and the Word engineered into a child by daily repetition: "thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house" (Deuteronomy 6:7). So the believer reads every 3D system with bifocals: name the macro engineering honestly (this lesson’s whole Stage 2), and fight where the Word puts the decisive front — the micro engineering of the renewed mind and the taught household, because macro structures are downstream of the hearts that build them. And rest the whole war on this settled floor (Darrell’s word, same sitting): Yahweh’s Will is ultimately done — "My counsel shall stand, and I will do all my pleasure" (Isaiah 46:10); the prayer He taught assumes it arriving: "Thy kingdom come. Thy will be done in earth, as it is in heaven" (Matthew 6:10); and even engineered evil He bends to His ends: "ye thought evil against me; but God meant it unto good" (Genesis 50:20). YET "the tree of knowledge of good and evil" (Genesis 2:9) still fruits in our systems — every institution this lesson measured bears BOTH kinds at once, and the familiar, normalized evil fruit wars against the faithfulness of the Good Fruit: "Even so every good tree bringeth forth good fruit; but a corrupt tree bringeth forth evil fruit" (Matthew 7:17). So the believer’s instrument for systems is the fruit test — "Wherefore by their fruits ye shall know them" (Matthew 7:20): cents-per-hour labor and priced-by-the-minute family calls are fruit, and so are restitution, restored citizens, and kept families; name each by what it is, however familiar the evil fruit has become. The Good Fruit’s faithfulness is the Spirit’s own — "the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith" (Galatians 5:22) — and the mixture is not forever: "Let both grow together until the harvest" (Matthew 13:30). The war is real, the fruits grow side by side in every system and family, and the harvest — like the Will — is already decided. Which leaves the capstone (Darrell’s word, same sitting): ACTIONS SAY WHERE YOU ARE. Every deed builds one Kingdom or the other, and Lordship is proven in deed, not diction — "Not every one that saith unto me, Lord, Lord, shall enter into the kingdom of heaven; but he that doeth the will of my Father which is in heaven" (Matthew 7:21); "why call ye me, Lord, Lord, and do not the things which I say?" (Luke 6:46); "be ye doers of the word, and not hearers only, deceiving your own selves" (James 1:22). In all situations the action outranks the word — "let us not love in word, neither in tongue; but in deed and in truth" (1 John 3:18); "I will shew thee my faith by my works" (James 2:18) — so operating under the Christ’s Ways and Lordship means "whatsoever ye do in word or deed, do all in the name of the Lord Jesus" (Colossians 3:17), "heartily, as to the Lord, and not unto men" (Colossians 3:23). And none of it evaporates: our ways, means, and actions are Eternally Recognized and recorded by Yahweh Himself — "the LORD hearkened, and heard it, and a book of remembrance was written before him" (Malachi 3:16); "the books were opened... and the dead were judged out of those things which were written in the books, according to their works" (Revelation 20:12); "he shall reward every man according to his works" (Matthew 16:27). That record cuts mercifully both ways: "God is not unrighteous to forget your work and labour of love" (Hebrews 6:10), and the faithful dead "rest from their labours; and their works do follow them" (Revelation 14:13). So the lesson’s last question is not "what do you think about the system?" but "what are your hands building?" — the lawmaker’s vote, the profiteer’s contract, the guard’s shift, the visitor’s hour at the cell, the household’s open Word: every one is a brick in one Kingdom or the other, and every one is already in the Book. And the reason this study keeps making the most sense is the One teaching it: no one needed to tell Jesus what is in man — He "needed not that any should testify of man: for he knew what was in man" (John 2:25). The Word’s diagnosis of the heart is the only account that explains everything this lesson measured — why chosen laws prey ("The heart is deceitful above all things, and desperately wicked: who can know it?" Jeremiah 17:9), why the friction generates from inside the species itself ("from within, out of the heart of men, proceed evil thoughts," Mark 7:21; "the imagination of man’s heart is evil from his youth," Genesis 8:21), and why no reallocation of budgets alone has ever healed what budgets never caused. And so the explorer’s posture is set (Darrell’s word, closing this lesson): "I’m exploring what’s in man — and I need Jesus to explain it to me." Jeremiah’s question "who can know it?" (Jeremiah 17:9) is not rhetorical flourish; it is a closed door to unaided man, and only two verses answer it — "I the LORD search the heart" (Jeremiah 17:10) and "he knew what was in man" (John 2:25). So the study of man is done ASKING, not presuming: "Search me, O God, and know my heart: try me, and know my thoughts: And see if there be any wicked way in me, and lead me in the way everlasting" (Psalm 139:23-24); the risen Teacher still does what He did on the Emmaus evening — "Then opened he their understanding, that they might understand the scriptures" (Luke 24:45); the Spirit of truth "will guide you into all truth" (John 16:13); and the Knowledge this whole lesson said we lack is promised to the asker: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him" (James 1:5). These subjects make the most sense here because the only One who never needed man explained to Him is the One explaining — and He gives to all men liberally, "according to his ways, and according to the fruit of his doings" (Jeremiah 17:10). Which is why the Words Jesus left are read more than any other voice — the whole method of this track in one sentence of testimony. Every other voice in this lesson (a video’s, a critic’s, a scholar’s, a movement’s) was weighed; His is the one weighed AGAINST, because His Words are in a category no other voice occupies: "the words that I speak unto you, they are spirit, and they are life" (John 6:63); "Heaven and earth shall pass away, but my words shall not pass away" (Matthew 24:35). The sheep learn the difference by exposure — "My sheep hear my voice, and I know them, and they follow me" (John 10:27) — and the household that would break free of sin and death gives His Words the majority share of its listening: "Let the word of Christ dwell in you richly in all wisdom" (Colossians 3:16). Peter’s question still ends every comparison shop among the voices: "Lord, to whom shall we go? thou hast the words of eternal life" (John 6:68). And read the whole Book that way, because THE WHOLE BIBLE IS HIM (Darrell’s word, sealing the lesson): "Search the scriptures... they are they which testify of me" (John 5:39); on the Emmaus road He walked them through it — "beginning at Moses and all the prophets, he expounded unto them in all the scriptures the things concerning himself" (Luke 24:27); He IS the Word from the first verse to the last — "In the beginning was the Word, and the Word was with God, and the Word was God" (John 1:1), "the Word was made flesh, and dwelt among us" (John 1:14), and when He returns "his name is called The Word of God" (Revelation 19:13). Remember, then, what all eternal data actually is: a sovereign-mesh Knowledge Network and the Kingdom’s Operating Systems — the 4th-dimensional architecture this platform is built to mirror. "Through faith we understand that the worlds were framed by the word of God" (Hebrews 11:3): the Word is the system the worlds run on, "upholding all things by the word of his power" (Hebrews 1:3), "and by him all things consist" (Colossians 1:17). Every record in Yahweh’s books, every verse testifying of the Son, every Spirit-taught heart is one sovereign network no outage touches and no adversary forks — which is why a household meshed into His Word is meshed into the only infrastructure that survives the harvest: "Heaven and earth shall pass away, but my words shall not pass away" (Matthew 24:35).',
      scripture: 'Exodus 21:16; Amos 2:6; Isaiah 10:1-2; Micah 3:11; Ecclesiastes 5:8; Exodus 22:1; Ephesians 4:28; Luke 19:8; Leviticus 25:10; Isaiah 58:6; Isaiah 61:1; Luke 4:18; Matthew 25:36; Hebrews 13:3; Romans 13:3-4; Deuteronomy 16:20; John 8:34-36; 2 Timothy 2:26; Hebrews 2:14-15; Romans 8:2; Romans 6:23; Colossians 1:13; 1 Corinthians 15:55-57; Ephesians 4:8; Revelation 1:18; Galatians 5:1; Ephesians 6:12; John 1:5; 2 Corinthians 4:4-6; 1 Peter 2:9; Acts 26:18; Romans 8:6; Isaiah 9:6-7; Hosea 4:6; John 17:3; 2 Corinthians 10:3-5; Deuteronomy 30:19; Joshua 24:15; Psalm 127:1; Romans 12:2; Deuteronomy 6:6-7; Isaiah 46:10; Matthew 6:10; Genesis 50:20; Genesis 2:9; Matthew 7:17; Matthew 7:20; Galatians 5:22; Matthew 13:30; Matthew 7:21; Luke 6:46; James 1:22; James 2:18; 1 John 3:18; Colossians 3:17; Colossians 3:23; Malachi 3:16; Revelation 20:12; Matthew 16:27; Hebrews 6:10; Revelation 14:13; John 2:24-25; Jeremiah 17:9-10; Mark 7:21; Genesis 8:21; Psalm 139:23-24; Luke 24:45; John 16:13; James 1:5; John 6:63; John 6:68; Matthew 24:35; John 10:27; Colossians 3:16; John 5:39; Luke 24:27; John 1:1; John 1:14; Revelation 19:13; Hebrews 11:3; Hebrews 1:3; Colossians 1:17',
    },
    threeD: 'Practically: run the three-bin sort at SYSTEM scale. Bin 1 — DOCUMENTED, say it plainly: nearly 2 million incarcerated; 8% in private facilities; $2B goods + $9B services from workers paid cents or nothing; $81B–$182B a year in public money; $11.35 for a 15-minute call before the (now-postponed) caps; the 1994 Crime Bill’s truth-in-sentencing grants; the lobbying millions; prison-dependent counties. None of that is "one side" — it is the measured record. Bin 2 — INTERPRETATION, label it: "nobody has to conspire" (true of maintenance, not of construction), "private prisons engineered it" (overruns the timeline), "architected to control specific populations" (the motive fork). Bin 3 — POSITIONS, weigh them: repeal the exception clause, transition the towns first, reallocate the budgets — real proposals with a real field record (eight states yes; Louisiana and California no, California on the price of paying workers). Then the two standing rules, now proven on a third kind of voice: fluency is not evidence (the confident "this fails because" contained both verified facts and unproven causation), and a system is weighed like a claim — by its documented record, not its mission statement.',
    accountability: {
      statement: 'THE TWO COURTS, applied to a system with no single defendant — which is exactly the case the eternal court exists for. THE LAWMAKERS are accountable for what they wrote: "Woe unto them that decree unrighteous decrees, and that write grievousness which they have prescribed" (Isaiah 10:1) — the statutes have sponsors and the votes are recorded, and where no earthly body will ever revisit them, "God shall bring every work into judgment, with every secret thing" (Ecclesiastes 12:14). THE PROFITEERS are accountable for revenue built on captive people and their families: the cents-per-hour labor and the priced-by-the-minute phone call are "the hire of the labourers... kept back" in a new uniform — "Woe unto him that buildeth his house by unrighteousness... that useth his neighbour’s service without wages" (Jeremiah 22:13), and "Rob not the poor, because he is poor... For the LORD will plead their cause, and spoil the soul of those that spoiled them" (Proverbs 22:22-23). THE SYSTEM’S COURTS are accountable both ways at once: "He that justifieth the wicked, and he that condemneth the just, even they both are abomination to the LORD" (Proverbs 17:15) — every innocent person sitting in a cell and every predator loosed by expedience are both entered in the record man’s court failed. AND WE are accountable for our distance: the King identifies Himself with the prisoner — "I was in prison, and ye came unto me" (Matthew 25:36) — so a Body that never visits, never hires the returning citizen, and never pleads the cause has its omission weighed too (Hebrews 13:3). No reform bill, ballot measure, or news cycle closes these books; the court that misses nothing convenes after this life, and it has the timeline, the motives, and the money trail entire.',
      scripture: 'Isaiah 10:1; Ecclesiastes 12:14; Jeremiah 22:13; Proverbs 22:22-23; Proverbs 17:15; Matthew 25:36; Hebrews 13:3',
    },
    benefits: [
      'Both courts, honestly held: earthly justice is real but imperfect — some of the guilty walk free and some of the innocent suffer or sit in prison (Ecclesiastes 8:14; Joseph, Genesis 39:20; and the sinless Christ, "this man hath done nothing amiss," Luke 23:41) — while the ETERNAL court misses nothing and lands after this life (Ecclesiastes 12:14; Hebrews 9:27). Since all suffer and die regardless, the wise path is His way for the reward that outlasts it all (2 Corinthians 4:17; Hebrews 11:24-26).',
      'System-scale discernment: the incentive-vs-intent tool — construction has authors (Isaiah 10:1), maintenance has payrolls (Ecclesiastes 5:8) — transfers to any institution you will ever weigh, from a school district to a denomination.',
      'Fluent analysis joins the weighed voices: a confident "this fails because" can hold verified facts AND unproven causation in one paragraph — fluency is not evidence, and verification (DR-0076) is the only separator.',
      'The Word’s own justice recovered: restitution that restores (Exodus 22:1; Luke 19:8), labor that re-dignifies (Ephesians 4:28), release on the calendar (Leviticus 25:10) — the believer critiques the carceral market from a POSITIVE biblical design, not a borrowed ideology.',
      'The field-test habit: proposals get checked against their real record (eight states yes; two states no, one on the price of paying workers) — a plan’s collision with a ballot box teaches more than its manifesto.',
      'A guarded evenhandedness: the victim’s door and the cell door are both real (Romans 13:4; Matthew 25:36) — naming the system’s commodification never requires denying the magistrate’s sword, and honoring the sword never requires blessing the market around it.',
      'A Body that shows up: "I was in prison, and ye came unto me" (Matthew 25:36) makes the incarcerated and the returning citizen the King’s own presence to serve — turning analysis into visits, hiring, and pleading the cause (Proverbs 22:22-23).',
      'The deepest freedom named: the Christ’s Kingdom emancipates from the captivity of sin and death itself — "If the Son therefore shall make you free, ye shall be free indeed" (John 8:36; Romans 8:2; Colossians 1:13) — the liberation no legislation can grant and no system can revoke, offered identically to the prisoner and the free citizen, which is why the jailhouse gospel is not a consolation prize but the greater liberty.',
      'Seeing deeper than the 3D friction: the statutes, budgets, and incentives are one theater of the war of Kingdoms — Light versus darkness, contending for humans and souls, with the stakes Eternal Peace versus Death (Ephesians 6:12; Romans 8:6) — and the operational deficit is Knowledge (Hosea 4:6; John 17:3): communities and families break free of sin and death only when armed with it (2 Corinthians 10:4-5).',
    ],
    graceNote: 'This lesson condemns no soul — not the corrections officer working dangerous shifts with honor, not the prison-town family whose livelihood the county offered them, not the lawmaker of 1994 (many of whom have publicly reckoned with what the bill became), not the executive, and not the prisoner. Every one of them bears the image of God, and the verdict on each heart belongs to Him alone (Romans 14:4; James 4:12). Naming a system’s documented fruit is not condemning its people — the Word manages both in one breath, decreeing woe on the unrighteous decree while sending its Author’s Son to open the prison (Isaiah 61:1). The same mercy that visits the cell is offered at every desk in the system, and this lesson keeps the door open in both directions.',
    stewardship: 'The believer’s response is not a hashtag; it is jubilee economics practiced at household scale. VISIT AND REMEMBER: the King is in the cell (Matthew 25:36; Hebrews 13:3) — prison ministry, letters, presence. HIRE AND RESTORE: the returning citizen needs exactly what Ephesians 4:28 prescribes — labor that makes a giver — so the second-chance hire is a doctrinal act, not charity theater. KEEP FAMILIES CONNECTED: the priced-by-the-minute phone call is a documented yoke (f-ancillary-economy); paying for a family’s connection, or advocating the caps, is loosing a band of wickedness (Isaiah 58:6). PLEAD THE CAUSE: "Rob not the poor... For the LORD will plead their cause" (Proverbs 22:22-23) — the citizen-believer weighs ballot language (Louisiana’s lesson: drafting matters) and prices the transition honestly (California’s lesson: unpriced justice loses). And BUILD the alternative this platform exists for — community economics that reach people before the system does, because the cheapest prison bed is the one root-cause work made unnecessary. Underneath all of it, ARM THE HOUSEHOLD FOR THE REAL WAR: the 3D friction is a theater; the enemy’s weapon is blindness (2 Corinthians 4:4) and the Kingdom’s is Knowledge and light (2 Corinthians 4:6; Hosea 4:6; John 17:3) — so family worship, the Word opened at the table, and the taught child are war materiel, never routine.',
    anchor: {
      ref: 'Isaiah 61:1',
      theme: 'The Spirit-anointed mission proclaims liberty to the captives and the opening of the prison — Yahweh’s justice restores persons; it never merchandises them.',
    },
  },

  reflection: {
    skill: 'When handed a SYSTEM analysis — from a video, a scholar, or a study group: sort documented record from causal frame (the events happened; the unified motive is usually the interpretive part), run the incentive-vs-intent tool (construction has authors, maintenance has payrolls — both true, different phases), field-test every proposal against its real record, and weigh fluency exactly like credentials: no badge-credit, verification only. Then answer from the Word’s own positive design — restitution, restoring labor, scheduled release, the honored sword — rather than importing any camp’s package deal.',
    practice: 'Take ONE claim from this lesson — the 8% figure, the 13–52-cents wages, the $11.35 phone call, or the 1994 truth-in-sentencing grants — and find its primary source yourself (the Whole Pie report, the Captive Labor report, the FCC record, the bill text). Then write two sentences: one stating what is DOCUMENTED, and one naming the nearest INTERPRETATION that the document does not itself establish. Finish with one act of Matthew 25:36 obedience your household could take this month — a letter, a visit, a second-chance referral, a funded phone account.',
    prompts: [
      'The video says "nobody has to conspire"; the critique answers "the War on Drugs and the 1994 Crime Bill were deliberate." Using Isaiah 10:1 (laws have authors) and Ecclesiastes 5:8 (oppression runs on layered incentives), how are both true — and about different phases of the same system?',
      'California voters kept prison labor unpaid substantially because ending it carried a $1.5 billion price tag. What does that confirm about the incentive analysis — and what does it teach about how a real jubilee must be priced (Leviticus 25 priced release into the whole economy in advance)?',
      'The counter-analysis got its lobbying figures right and overran the evidence on "engineered mass incarceration." Why does fluent, confident analysis — from any source — earn a hearing but never belief (set it beside Issues 5 and 6)?',
      'Exodus 22:1 answers theft with restitution; our system answers it with a cell that costs the public tens of thousands a year and pays the victim nothing. Which parts of the biblical design could believers advocate TODAY without denying Romans 13’s sword — and which longings for it must wait for the King?',
      'The corrections officer, the prison-town mayor, and the incarcerated father are all real neighbors in this lesson. How does the grace-note’s "no verdict on souls" change the TONE of a believer’s systemic critique without softening one documented fact (DR-0100)?',
      '"I was in prison, and ye came unto me" (Matthew 25:36) puts the King inside the system being analyzed. What is one concrete way your household moves from analysis to presence this month — and what keeps analysis-without-presence comfortable?',
      'The Word names a captivity that holds people on BOTH sides of the prison wall — servitude to sin and lifelong bondage to the fear of death (John 8:34; Hebrews 2:15). How does the Kingdom’s finished emancipation (John 8:36; Colossians 1:13; Revelation 1:18) reframe both the prisoner’s hope and the reformer’s ambition — and what can it promise that no transformation plan can?',
      '"My people are destroyed for lack of knowledge" (Hosea 4:6), and "this is life eternal, that they might know thee" (John 17:3). If the war behind the 3D friction is the Kingdoms of Light versus darkness contending for humans and souls — Eternal Peace versus Death — what Knowledge does YOUR family and community actually lack to break free of sin and death, and what would carrying it into the household look like this month (2 Corinthians 10:4-5; Deuteronomy 30:19; Joshua 24:15)?',
      'Actions say where you are: every deed builds one Kingdom or the other, Lordship is proven in deed not diction (Matthew 7:21; 1 John 3:18), and every way, means, and action is Eternally Recognized and recorded by Yahweh Himself (Malachi 3:16; Revelation 20:12; Hebrews 6:10). Take an honest inventory of this week’s actions — which Kingdom did your hands build, and what does the Book of remembrance now hold that your words never said?',
    ],
  },

  levels: {
    child: 'Here is a big, sad puzzle that wise people are trying to fix. In our country, a very large number of people are in prison — that means they did something against the rules, or sometimes were only accused of it, and now they live locked away from their families. Some of the puzzle is fair: rules matter, and people who hurt others need to be stopped — the Bible says leaders are supposed to protect people from harm (Romans 13). But here is the part that is NOT fair: some companies and towns MAKE MONEY when the prisons stay full — the people inside work almost for free, and their families must pay lots of money just to talk to them on the phone. God’s Word says we must never treat a person like a thing to make money from, because every person is made in His image. And do you know what Jesus said? "I was in prison, and ye came unto me" (Matthew 25:36) — Jesus says visiting and loving people in prison is like visiting HIM! In God’s plan, when someone took something, they worked to PAY IT BACK and make it right again (Exodus 22:1) — fixing things, not just locking people away forever. So the wise-heart way is: care about fairness for EVERYBODY — the person who was hurt, the person who did wrong, and their families — and remember that God sees it all and will make everything perfectly fair one day (Ecclesiastes 12:14). And here is the best news of all: Jesus talked about another kind of stuck — when we keep doing wrong things, it is like our heart is locked up inside (John 8:34). Jesus came to unlock THAT door for everyone, everywhere: "If the Son therefore shall make you free, ye shall be free indeed" (John 8:36). No wall anywhere can hold in a heart that Jesus has set free!',
    teen: 'Level up: this issue hands you THREE voices at once — a video, a counter-analysis of the video, and a reform plan — and your job is to grade each one against the record, not pick a team. The video’s core facts CHECK OUT: nearly 2 million people incarcerated, only ~8% in private prisons, and the term really does come from Eisenhower’s 1961 warning via Schlosser and Davis in 1998. Its FRAME — "it’s incentives, nobody has to conspire" — is half right: that is genuinely how the system KEEPS running (whole towns depend on prison jobs; the public pays $80B+ a year). But the pushback is half right too: the War on Drugs, mandatory minimums, and the 1994 Crime Bill were DELIBERATE, voted-on choices — laws have authors (Isaiah 10:1). Construction was intentional; maintenance runs on autopilot. Both true, different phases — that is the tool. Now the sharpest fact in the lesson: prisoners work for 13 to 52 CENTS an hour (some states: zero), and when California voted in 2024 on whether to end forced prison labor, voters said NO — partly because paying real wages would cost about $1.5 billion. Sit with that: the state kept unpaid labor because ending it was expensive. That is the incentive structure, caught on camera. The Word’s take is older and sharper than both sides: never merchandise a human being (Exodus 21:16; Amos 2:6), justice should RESTORE — the thief repaid fourfold and got his dignity back through the repayment (Exodus 22:1; Luke 19:8) — release was on God’s calendar (Leviticus 25:10), AND the magistrate’s sword is real because victims are real (Romans 13:4). And one more skill for your generation specifically: any analysis can be fluent, confident, formatted — and still mix verified facts with causal claims the evidence doesn’t carry. Fluency is not evidence. Verify every voice like you’d verify a stranger. Last thing, and it is the biggest: the Word says there are prisons on BOTH sides of the wall. "Whosoever committeth sin is the servant of sin" (John 8:34) — that captivity holds the free citizen scrolling his phone as surely as the man in the cell, and the fear of death keeps people "all their lifetime subject to bondage" (Hebrews 2:15). The Kingdom’s answer is not a program; it is a Person who already broke that prison open: "If the Son therefore shall make you free, ye shall be free indeed" (John 8:36). Reform bills can open some doors; only He opens that one — for the inmate and for you, on the same terms.',
    senior: 'For the seasoned believer, this issue completes a progression the track has been building: Issue 5 weighed a credentialed human whose claims falsified; Issue 6 a credentialed human whose claims confirmed; here, a SYSTEM — and an AI analyzing it — where the discernment must run at two altitudes at once. At the factual altitude, the record is not seriously contested and is stated plainly per DR-0100: nearly 2 million incarcerated, 8% privately held, $2B in goods and $9B in services from workers paid cents or nothing under the 13th Amendment’s standing exception clause, $81B–$182B a year in public cost, a phone-call economy that priced a family’s connection at $11.35 per quarter-hour, and a 1994 statute that paid states to lengthen sentences — sponsors named, votes recorded. At the interpretive altitude, hold the incentive-vs-intent distinction with an elder’s both-hands grip: Isaiah 10:1 insists the decrees had authors (the critique’s truth), Ecclesiastes 5:8 counsels un-marveling clarity about layered, self-sustaining oppression (the video’s truth), and neither erases the other — construction was chosen, maintenance is purchased. Note what the state record teaches about reform in a fallen economy: California’s electorate, offered the end of unpaid prison labor, declined at a $1.5B price — Leviticus 25 anticipated exactly this, which is why jubilee was not a sentiment but a PRICED institution, structured into land law and lending law fifty years in advance (Leviticus 25:15-16 sets purchase prices BY the years to release). A justice that costs nothing is a slogan; Yahweh’s justice budgeted. Guard the two ditches for the household: the reform-romantic ditch that forgets Romans 13:4 and the real victim at the real door; and the order-idolatry ditch that blesses a market in persons because it wears justice’s robes — Micah 3:11 names heads who judge for reward as corruption, not conservatism. And model the posture that outlasts every policy cycle: the King self-identifies with the prisoner (Matthew 25:36), the Body is commanded into remembrance as if co-bound (Hebrews 13:3), and the mission statement the Son read aloud in Nazareth — liberty to the captives, the opening of the prison (Isaiah 61:1; Luke 4:18) — is the Kingdom’s direction of travel. The believer’s systemic critique is therefore neither left nor right; it is OLDER than both: restitution over warehousing, persons over revenue, the sword honored, the profit motive expelled from the courtroom, and every book that man’s courts never open carried into the one court that misses nothing (Ecclesiastes 12:14). And teach the household where the lesson finally lands: the carceral question is a shadow of the captivity question, and the Christ’s Kingdom has answered the deeper one already — the Son destroying "him that had the power of death" through His own death (Hebrews 2:14), delivering those held in lifelong bondage by its fear (Hebrews 2:15), translating the freed "into the kingdom of his dear Son" (Colossians 1:13), holding "the keys of hell and of death" (Revelation 1:18). The elder who has buried friends and outlived systems can say what the young reformer cannot yet: every earthly liberation is partial and temporary, and the emancipation that is neither is already purchased — "Stand fast therefore in the liberty wherewith Christ hath made us free" (Galatians 5:1).',
  },

  quiz: {
    questions: [
      {
        q: 'The video claims the PIC is "not mainly private prisons." What does the documented record show?',
        options: ['False — most prisoners are in private facilities', 'Documented — only about 8% of incarcerated people are held in privately-run facilities (Prison Policy Initiative); the correction of the popular picture is real, though private operators’ lobbying is also real and documented', 'Unknowable — no one tracks it'],
        answer: 1,
        explain: 'Both halves matter: the 8% figure validates the video’s correction, AND the lobbying millions validate the critique’s point that the industry works to preserve the system it profits from. Neither fact cancels the other.',
      },
      {
        q: 'The video says "nobody has to conspire"; the AI critique says the system was deliberately architected. How does the incentive-vs-intent tool sort this?',
        options: ['The video is simply right — systems have no authors', 'The critique is simply right — it was all one coordinated plan', 'Both, about different phases: CONSTRUCTION has documented deliberate acts (the drug war, mandatory minimums, the 1994 Crime Bill — named sponsors, recorded votes; Isaiah 10:1), while PERSISTENCE runs on incentives needing no conspiracy (payrolls, budgets, bed-count dependence; Ecclesiastes 5:8)'],
        answer: 2,
        explain: 'The lesson’s central tool. Laws have authors — the Word refuses authorless "grievousness" (Isaiah 10:1) — and mature systems sustain themselves on ordinary paychecks. Holding both is the discernment.',
      },
      {
        q: 'California voters rejected Proposition 6 (2024), keeping involuntary prison labor, substantially over a ~$1.5B cost of paying wages. What does this field-test teach?',
        options: ['That the incentive analysis is wrong', 'That it CONFIRMS the incentive analysis — economics visibly held the structure in place — and that unpriced justice loses: Yahweh’s own jubilee was a PRICED institution, structured into the economy decades in advance (Leviticus 25)', 'That voters are simply cruel'],
        answer: 1,
        explain: 'The sharpest fact in the lesson: the plan’s own thesis proved itself against the plan’s own first point. A real transformation budgets the transition — which is exactly what the plan’s second point (transition packages first) exists to do.',
      },
      {
        q: 'The counter-analysis stated verified lobbying figures AND the unproven claim that private prisons "engineered" mass incarceration, in one fluent paragraph. What is the standing rule?',
        options: ['Trust it — AI is objective', 'Dismiss it — AI can’t analyze', 'Weigh it like any voice: fluency is not evidence — verify claim by claim, keep the documented facts, and label the causal overreach (the sentencing build-out largely preceded the industry’s scale)'],
        answer: 2,
        explain: 'The track’s badge rule extends to machines: the doctor’s credential (Issue 5), the journalist’s sourcing (Issue 6), and the AI’s fluency are all constant across their true and false claims. Only verification separates (DR-0076).',
      },
      {
        q: 'What is the Word’s own positive design that the believer critiques the carceral market FROM?',
        options: ['Whatever the reform movement currently proposes', 'Order at any price — the system is beyond question', 'Restitution that restores the victim and re-dignifies the wrongdoer (Exodus 22:1; Luke 19:8), labor that makes a giver (Ephesians 4:28), release built into the calendar (Leviticus 25:10), the magistrate’s sword honored (Romans 13:4), and no person ever merchandise (Exodus 21:16; Amos 2:6)'],
        answer: 2,
        explain: 'The believer imports no camp’s package. Yahweh’s justice is restitutive, restorative, scheduled for release, and absolute against commodifying persons — older and sharper than both modern defaults, with the King Himself found inside the cell (Matthew 25:36).',
      },
      {
        q: 'The lesson ends past the earthly prison. What does the Christ’s Kingdom say about the deeper captivity?',
        options: ['Freedom is political — fix the system and humanity is free', 'Scripture is silent on captivity beyond the literal prison', 'Every person — prisoner or free citizen — is held by sin and the fear of death (John 8:34; Hebrews 2:15), and only the Son’s finished work opens that prison: "If the Son therefore shall make you free, ye shall be free indeed" (John 8:36; Romans 8:2)'],
        answer: 2,
        explain: 'Isaiah 61:1 anchors the lesson twice over: the same Anointed One who proclaims the opening of the earthly prison opens the one no reform can — He led captivity captive (Ephesians 4:8) and holds the keys (Revelation 1:18). The jailhouse gospel is the greater liberty, offered on the same terms on both sides of the wall.',
      },
    ],
  },
};

// =============================================================================
// EIGHTH WORKED EXAMPLE — a spoken teaching comparing the aftermath of slavery
// and the aftermath of the Holocaust, and what each people received after.
// =============================================================================
// SOURCE: a teaching Darrell brought into the app as build input (the standing
// rule: a spoken teaching is captured faithfully FROM HIS WORDS, never replaced
// with generic theology). Its documented core is spoken PLAINLY per DR-0100;
// two of its own figures are corrected because the real record is HARSHER than
// the version given; and its closing section — the claim that Jewish people
// "control" media, finance, and government — is refused BY THE WORD, not by
// preference, because Scripture forbids raising a false report against any
// people (Exodus 23:1) and Yahweh's covenant word over Abraham's line still
// stands (Genesis 12:3; Romans 11:18).
//
// WORD-FIRST (DR-0127 / DR-0098): the frame is not chosen for cleverness — it
// is the sin the Word names in the teaching's own opening line. "Divers weights"
// (Deuteronomy 25:13-16) IS one scale for one people's grief and another scale
// for another's, and Yahweh calls it an abomination before anyone in this
// argument had a name for it. Every other stage hangs on that.
//
// SCOPE DISCIPLINE (Darrell 2026-08-07: "keep in mind what we have already
// written on the topics... after the Word"): this issue does NOT re-argue what
// the track already carries. The 13th Amendment exception clause, the prison
// labor economy, the 1994 crime bill, and the carceral money are Issue 7's
// documented ground and are REFERENCED here, not re-litigated. The evenhanded
// handling of a grievance between two peoples the mainstream failed follows the
// pattern Issue 2 established.
//
// VERIFICATION (DR-0076): every fact below was verified by live web search on
// 2026-08-07 against the cited outlets — never from memory. Where the teaching's
// numbers did not survive that check, the lesson says so and gives the real
// figure, which in both cases makes the point land harder.
// =============================================================================
const HISTORICAL_TRAUMA_ISSUE = {
  id: 'wi-historical-trauma-two-aftermaths',
  title: 'Two Aftermaths, One Scale — How To Think Through a Teaching That Compares Grief',
  skill: 'Take a teaching whose grievance is TRUE and whose closing turn is FALSE, and learn to keep both judgments at once — honoring the documented wound without carrying the false report that got attached to it.',
  subject: {
    name: 'the aftermath of American slavery compared with the aftermath of the Holocaust',
    kind: 'topic',
    // Set TRUE deliberately. The field name says "person," but its effect is the
    // strictest safeguard set — grace-note, stated accountability, two-courts in
    // the benefits, multiple steelmanned perspectives. This teaching makes claims
    // about real living peoples, so the strongest available gate is the right one.
    isNamedRealPerson: true,
  },
  source: {
    creator: 'a spoken teaching brought into the app by Darrell',
    medium: 'transcribed video commentary',
    title: 'a commentary comparing what Black Americans and Jewish people received after their respective catastrophes',
    asOf: '2026-08-07',
    note: 'Carried as ONE speaker’s argument — labeled and weighed — never repeated as settled truth. Its documented core is stated plainly; its unproven and false parts are named as such. That combination IS the lesson.',
  },
  claims: [
    {
      id: 'c-double-standard',
      label: 'opinion',
      attribution: 'the speaker',
      text: 'Society tells Black people to "get over" slavery because it was long ago, while telling a Jewish person to get over the Holocaust is treated as unacceptable — one scale for one people’s grief, another scale for another’s.',
      note: 'A value judgment about how a society responds — and the one claim the Word addresses most directly, before any history is checked.',
    },
    {
      id: 'c-divergent-aftermath',
      label: 'claim',
      attribution: 'the speaker',
      text: 'After World War II the world moved to establish and support Jewish people with a state, institutions, and diplomatic backing; after emancipation, freed Black Americans were given legal freedom but no economic foundation, and faced active interference every time they built.',
      note: 'A comparative historical claim. The second half is heavily documented; the first half compresses a far more complicated record and omits what was refused before and during the war.',
    },
    {
      id: 'c-greenwood',
      label: 'claim',
      attribution: 'the speaker',
      text: 'Black Americans built a thriving, self-sustaining district in Tulsa — banks, theaters, hospitals, hotels — and a white mob backed by local authorities burned it down, killed hundreds, and the wealth was never restored.',
      note: 'Documented. See the verifiable items — the real record on the insurance claims is worse than the teaching states.',
    },
    {
      id: 'c-engineered-decline',
      label: 'claim',
      attribution: 'the speaker',
      text: 'The decline of Black neighborhoods was engineered rather than accidental — through redlining, exclusion from the home-buying tools that built white family wealth, and a drug war whose sentencing fell hardest on Black communities.',
      note: 'The housing and sentencing pieces are documented policy. "Engineered" as a description of the policies is well supported; a further claim about deliberate introduction of a drug is a separate and different claim — see below.',
    },
    {
      id: 'c-crack-introduced',
      label: 'allegation',
      attribution: 'the speaker',
      text: 'The government specifically targeted Black communities with crack cocaine in order to break families from the inside.',
      note: 'This is an ALLEGATION and is kept distinct from the documented sentencing disparity. Conflating the two is the single most common way a true grievance gets attached to an unproven claim — which is exactly the skill this lesson teaches.',
    },
    {
      id: 'c-sentencing-numbers',
      label: 'claim',
      attribution: 'the speaker',
      text: 'For the same amount of drug, a Black man on crack got five years and a white man on powder got five months.',
      note: 'The figures as spoken do not match the statute — and the actual law is more severe than the version given. Corrected in Stage 2.',
    },
    {
      id: 'c-thirteen-articles',
      label: 'claim',
      attribution: 'the speaker',
      text: 'Thirteen articles of the Constitution say that when a Black man goes to prison he is no longer a free man and his labor is free — slavery by another name.',
      note: 'A garbled citation of a real and live constitutional clause. Corrected in Stage 2; the underlying substance is Issue 7’s documented ground.',
    },
    {
      id: 'c-welcomed-openly',
      label: 'claim',
      attribution: 'the speaker',
      text: 'After the war the Jewish people were given a large portion of the Middle East, and the Palestinians welcomed them in with open arms before the land was turned into Israel.',
      note: 'Not documented as stated. The real record — including the Palestinian dispossession the teaching is reaching toward — is set out in Stage 2.',
    },
    {
      id: 'c-control',
      label: 'allegation',
      attribution: 'the speaker',
      text: 'Jewish people hold the Federal Reserve, Hollywood, Silicon Valley, a vast portion of mainstream media, and have their entire foot inside the American government.',
      note: 'This is the teaching’s closing turn. It is a documented antisemitic conspiracy trope with a traceable origin in a proven forgery, and the lesson refuses it on the Word’s own terms. Carried here ONLY as a labeled claim so it can be examined — never repeated as fact.',
    },
  ],
  verifiable: [
    {
      id: 'f-greenwood',
      statement: 'The 1921 Tulsa Race Massacre is documented: thirty-five blocks of the Greenwood District were looted and burned, roughly 190 businesses and at least 1,256 homes destroyed, and about 10,000 people left homeless. The Oklahoma Commission report (submitted February 28, 2001) put the dead between 100 and 300. Greenwood residents filed over $1.8 million in damage claims — and all but one were denied, because city leaders classified the event a "riot" and insurance policies carried riot exclusions. The one paid claim went to a white shop owner for guns taken from his store.',
      status: 'documented',
      sources: [
        { title: 'Tulsa race massacre of 1921 — History, Commission, Deaths, Facts', publisher: 'Britannica', url: 'https://www.britannica.com/event/Tulsa-race-massacre-of-1921', asOf: '2026-08-07' },
        { title: 'Denial of Insurance Claims', publisher: 'Justice For Greenwood', url: 'https://www.justiceforgreenwood.org/denial-of-insurance-claims/', asOf: '2026-08-07' },
        { title: 'The true costs of the Tulsa race massacre, 100 years later', publisher: 'Brookings Institution', url: 'https://www.brookings.edu/articles/the-true-costs-of-the-tulsa-race-massacre-100-years-later/', asOf: '2026-08-07' },
      ],
      note: 'Verified 2026-08-07. The insurance detail is the part most people never hear, and it is the part that makes this Naboth’s vineyard rather than a natural disaster: the loss was not merely inflicted, it was then made permanent by a legal instrument. The teaching said the wealth was never restored. The record says the machinery of restoration was pointed the other way.',
    },
    {
      id: 'f-forty-acres',
      statement: 'Special Field Orders No. 15, issued January 16, 1865, set aside roughly 400,000 acres along the Atlantic coast in parcels of not more than 40 acres for about 18,000 formerly enslaved families. President Andrew Johnson revoked the order in the fall of that same year; the land was returned to former owners and the freedpeople were evicted, pushing many into sharecropping and debt.',
      status: 'documented',
      sources: [
        { title: 'Sherman’s Field Order No. 15', publisher: 'New Georgia Encyclopedia', url: 'https://www.georgiaencyclopedia.org/articles/history-archaeology/shermans-field-order-no-15/', asOf: '2026-08-07' },
        { title: 'History of Emancipation: Special Field Orders No. 15', publisher: 'Georgia Historical Society', url: 'https://www.georgiahistory.com/ghmi_marker_updated/history-of-emancipation-special-field-orders-no-15/', asOf: '2026-08-07' },
      ],
      note: 'Verified 2026-08-07. This is the documented spine under the teaching’s "freedom but no foundation." The inheritance was not merely withheld — it was granted, occupied, and then taken back within the year.',
    },
    {
      id: 'f-housing',
      statement: 'The GI Bill’s home-loan benefit was administered locally and through banks that followed federal redlining maps, so Black veterans were widely denied. In 1947, only 2 of more than 3,200 VA-guaranteed home loans across 13 Mississippi cities went to Black borrowers.',
      status: 'documented',
      sources: [
        { title: 'How the GI Bill’s Promise Was Denied to a Million Black WWII Veterans', publisher: 'HISTORY', url: 'https://www.history.com/articles/gi-bill-black-wwii-veterans-benefits', asOf: '2026-08-07' },
        { title: 'Were Black World War II Veterans Excluded from GI Bill Benefits?', publisher: 'Snopes', url: 'https://www.snopes.com/fact-check/black-world-war-ii-vets-gi-bill/', asOf: '2026-08-07' },
        { title: 'How the GI Bill Left Out African Americans', publisher: 'Demos', url: 'https://www.demos.org/blog/how-gi-bill-left-out-african-americans', asOf: '2026-08-07' },
      ],
      note: 'Verified 2026-08-07. Two out of thirty-two hundred. The teaching called this being locked out of the biggest wealth-building tool in American history; the number is what that sentence looks like on the ground.',
    },
    {
      id: 'f-sentencing',
      statement: 'The Anti-Drug Abuse Act of 1986 set a 100-to-1 quantity disparity: five grams of crack cocaine triggered the same five-year mandatory minimum as five hundred grams of powder. The Fair Sentencing Act of 2010 raised the crack thresholds (5g to 28g for the five-year minimum; 50g to 280g for the ten-year), reducing the disparity to 18-to-1 — where it still stands. In 1986 the average federal drug sentence for Black defendants was 11% higher than for white defendants; four years later it was 49% higher.',
      status: 'documented',
      sources: [
        { title: 'Cocaine: Crack and Powder Sentencing Disparities (IF11965)', publisher: 'Congressional Research Service / Congress.gov', url: 'https://www.congress.gov/crs-product/IF11965', asOf: '2026-08-07' },
        { title: 'Crack Cocaine and the Fair Sentencing Act (fact sheet, Nov. 2023)', publisher: 'Legislative Analysis and Public Policy Association', url: 'https://legislativeanalysis.org/wp-content/uploads/2023/11/Fair-Sentencing-Act-Fact-Sheet-FINAL.pdf', asOf: '2026-08-07' },
      ],
      note: 'Verified 2026-08-07. THE CORRECTION THAT STRENGTHENS THE CASE: the teaching said "five years versus five months." The statute is worse than that. It is not two different sentences — it is the SAME five-year sentence triggered by one hundred times less of the drug associated with poorer, Blacker defendants. And the 11%-to-49% swing in four years is the measured effect. A speaker who reaches for a memorable number and misses can hand his opponent an easy dismissal of a case the real record proves.',
    },
    {
      id: 'f-thirteenth',
      statement: 'It is one amendment, not thirteen articles. The 13th Amendment (1865) reads: "Neither slavery nor involuntary servitude, except as a punishment for crime whereof the party shall have been duly convicted, shall exist within the United States." The exception clause is live constitutional text and its face is race-neutral.',
      status: 'documented',
      sources: [
        { title: 'The Abolition Amendment (summary and text)', publisher: 'Office of Sen. Jeff Merkley', url: 'https://www.merkley.senate.gov/wp-content/uploads/imo/media/doc/abolition_amendment_summary.pdf', asOf: '2026-08-04' },
      ],
      note: 'Verified 2026-08-04 for Issue 7 and carried here unchanged — REINFORCED, not re-invented. Issue 7 (the prison industrial complex) holds the full documented ground and it is worth restating here because repetition of verified data is how a household actually retains it: incarcerated workers produce over $2 billion in goods and over $9 billion in prison-maintenance services a year at wages of 13-52 cents an hour with several states paying nothing; direct corrections spending runs about $81 billion a year and the system-wide accounting about $182 billion; the 1994 crime bill funded roughly $9.7 billion for prisons and paid states to adopt truth-in-sentencing; eight states have removed their own exception clauses while Louisiana (2022) and California (Proposition 6, 2024) rejected removal — California’s turning substantially on a $1.5 billion price tag for paying incarcerated workers. Go to Issue 7 for the sources and the full weighing. What matters for THIS lesson: the clause is real, the citation was garbled, and a garbled citation of a real thing is the easiest way to get a true point dismissed.',
    },
    {
      id: 'f-doors-closed',
      statement: 'The claim that the world moved to set Jewish people up for success omits what was refused first. At the Evian Conference (July 6-15, 1938), thirty-two nations met on the Jewish refugee crisis and, apart from the Dominican Republic, none agreed to take more refugees. In May-June 1939 the MS St. Louis carried more than 930 Jewish refugees from Hamburg; Cuba admitted 28, and the United States and Canada refused the rest. Of the 907 returned to Europe, 255 were later killed. Britain’s 1939 White Paper capped Jewish immigration to Mandatory Palestine at 75,000 over five years, with any further entry requiring Arab consent — largely closing that door during the war years.',
      status: 'documented',
      sources: [
        { title: 'Voyage of the St. Louis', publisher: 'United States Holocaust Memorial Museum', url: 'https://encyclopedia.ushmm.org/content/en/article/voyage-of-the-st-louis', asOf: '2026-08-07' },
        { title: 'The Evian Conference, July 1938', publisher: 'United States Holocaust Memorial Museum', url: 'https://encyclopedia.ushmm.org/content/en/article/the-evian-conference', asOf: '2026-08-07' },
        { title: 'British White Paper of 1939 (full text)', publisher: 'The Avalon Project, Yale Law School', url: 'https://avalon.law.yale.edu/20th_century/brwh1939.asp', asOf: '2026-08-07' },
      ],
      note: 'Verified 2026-08-07. This is the fact that most changes the shape of the comparison, and it does NOT cancel the teaching’s grievance — it complicates the premise that one people was welcomed while another was contained. Both doors were shut; they were shut at different times, in different ways, by overlapping hands.',
    },
    {
      id: 'f-partition',
      statement: 'On November 29, 1947 the UN General Assembly adopted Resolution 181, recommending two states with Jerusalem under international administration. The Jewish Agency accepted it as a basis for statehood; Arab leaders and the Arab Higher Committee rejected it. Neighboring Arab armies entered the ensuing 1948 war. In that war roughly 700,000-750,000 Palestinians were displaced from their homes — the Nakba — with hundreds of villages depopulated.',
      status: 'documented',
      sources: [
        { title: 'United Nations Resolution 181', publisher: 'Britannica', url: 'https://www.britannica.com/topic/United-Nations-Resolution-181', asOf: '2026-08-07' },
        { title: 'UN marks 75 years since displacement of 700,000 Palestinians', publisher: 'UN News', url: 'https://news.un.org/en/story/2023/05/1136662', asOf: '2026-08-07' },
        { title: 'About the Nakba', publisher: 'United Nations — Question of Palestine', url: 'https://www.un.org/unispal/about-the-nakba/', asOf: '2026-08-07' },
      ],
      note: 'Verified 2026-08-07. "Welcomed with open arms" is not what the record shows; the partition was formally rejected and war followed. But note carefully what the same record DOES show — a real mass dispossession of Palestinians. The teaching reached for a true thing (people lost their land and homes) and grabbed a false description of how it happened. Losing the description does not make the dispossession disappear; it means the true version has to be told accurately to be believed.',
    },
    {
      id: 'f-control-trope',
      statement: 'The claim that Jewish people control banking, media, and government is a documented conspiracy myth, not a finding. Its modern form traces to The Protocols of the Elders of Zion, first published in the Russian Empire in 1903 and presented as a discovered document proving a Jewish world plot; journalists, courts, and governments have since established it as a fabrication. The Protocols laid the groundwork for the specific later variants — that Jewish financiers run the Federal Reserve, that Jews control Wall Street and the media.',
      status: 'documented',
      sources: [
        { title: 'An Antisemitic Conspiracy: The Protocols of the Elders of Zion', publisher: 'United States Holocaust Memorial Museum', url: 'https://encyclopedia.ushmm.org/content/en/article/protocols-of-the-elders-of-zion', asOf: '2026-08-07' },
        { title: 'The myth that Jews control the world', publisher: 'World Jewish Congress', url: 'https://www.worldjewishcongress.org/en/conspiracy-myths/the-myth-that-jews-control-the-world', asOf: '2026-08-07' },
        { title: 'Myth — Jews Have Too Much Power', publisher: 'ADL, Antisemitism Uncovered', url: 'https://antisemitism.adl.org/power/', asOf: '2026-08-07' },
      ],
      note: 'Verified 2026-08-07. Documented as a forgery — and the lesson does not rest the refusal on the documentation. It rests it on the Word (Stage 4), because a believer who only refuses a false report when a fact-checker is handy has not learned the commandment.',
    },
  ],
  interpretation: [
    { id: 'n-engineered', statement: 'That the housing and sentencing policies were CHOSEN — written, voted, administered — is documented. Calling the whole pattern "engineered" is a fair reading of chosen policies with foreseeable effects; extending that to a single coordinating intelligence behind every harm is an inference the record does not carry.', restsOn: ['f-housing', 'f-sentencing', 'f-forty-acres'] },
    { id: 'n-crack-conflation', statement: 'The documented sentencing disparity and the allegation of deliberate drug introduction are two different claims with two different evidentiary standings. The first is statute; the second is not established. Presenting them as one sentence is what lets an opponent discard both.', restsOn: ['f-sentencing'] },
    { id: 'n-comparison', statement: 'The premise that one people was elevated while another was contained is an interpretation, and the Evian/St. Louis/White Paper record cuts against its first half. The sounder reading is not "who was helped more" but "the same era’s doors were shut on both, by overlapping hands" — which is a heavier charge against the gatekeepers, not a lighter one.', restsOn: ['f-doors-closed', 'f-partition', 'f-housing'] },
    { id: 'n-trope-attachment', statement: 'The closing "control" section does not follow from anything established earlier in the teaching. A documented grievance about American policy toward Black communities supplies no evidence whatever about who owns banks or studios. Watching a true argument hand off to an unrelated false one — and noticing the exact sentence where the handoff happens — is the transferable skill of this lesson.', restsOn: ['f-control-trope', 'f-greenwood', 'f-housing'] },
  ],
  perspectives: [
    {
      id: 'p-speaker',
      label: 'The speaker’s view (the grievance)',
      heldBy: 'the teaching, and many who carry this history',
      steelman: 'At its strongest, and it is strong: the documented record backs the core. Land was granted and taken back inside a year. A built district was burned and the insurance machinery finished the theft. Two of more than three thousand loans. A hundred-to-one quantity ratio written into federal law. This is not a feeling about the past; it is a chain of decisions with dates and authors. And the demand to "get over it" is uniquely applied — no one tells a nation to stop commemorating its war dead. A people asked to forget an injury that is still compounding is being asked to consent to the compounding.',
    },
    {
      id: 'p-jewish-experience',
      label: 'The Jewish experience the comparison passes over',
      heldBy: 'Jewish communities and Holocaust historians',
      steelman: 'At its strongest: calling the Holocaust "finite" mistakes a start and end date for a closed wound. Six million murdered, whole communities annihilated, families ended — and the doors were shut BEFORE the killing, at Evian, at the American port the St. Louis was turned from, at the gate the 1939 White Paper closed. Survivors arrived with nothing, from societies that had just tried to erase them. Whatever institutional support came later came AFTER the world had already declined to save them, and it does not read as favoritism to those who lived it. And a comparison that ends by charging that same people with secret control is not a ranking of griefs; it is the oldest accusation, and it has a body count.',
    },
    {
      id: 'p-both-wounds',
      label: 'The refusal to rank griefs at all',
      heldBy: 'those who hold both histories without a scale',
      steelman: 'At its strongest: the scale itself is the error. Grief is not a fixed quantity to be allocated, and a claim on justice is not diminished by another people’s claim. The instinct to compare arises because both communities are made to compete for a limited public sympathy — which is a scarcity someone else manufactured. Two peoples arguing over which catastrophe counts is a fight neither can win and someone else profits from. Weep with those who weep; the command has no comparative clause.',
    },
    {
      id: 'p-careful',
      label: 'The keep-the-categories view',
      heldBy: 'people committed to fair judgment',
      steelman: 'At its strongest: a true case told with false numbers loses to opponents who only have to check one figure. "Five years versus five months" is refutable in a minute; the real hundred-to-one ratio is not. "Thirteen articles" is refutable; the 13th Amendment’s exception clause is not. Precision here is not pedantry or timidity — it is what keeps a documented grievance from being discarded along with the errors bolted onto it. And precision is exactly what makes the final section indefensible: it is the one part of the teaching with no record behind it at all.',
    },
  ],
  lens: {
    fourD: {
      deepSource: 'Yahweh names this teaching’s opening grievance before anyone in the argument had words for it, and He names it as a sin against Himself: "Thou shalt not have in thy bag divers weights, a great and a small... But thou shalt have a perfect and just weight... For all that do such things, and all that do unrighteously, are an abomination unto the LORD thy God" (Deuteronomy 25:13-16). Two scales — one for whose grief counts, one for whose does not — is the divers weight, and Yahshua sealed it: "with what measure ye mete, it shall be measured to you again" (Matthew 7:2). Then the Word shows the mechanism itself. Naboth would not sell: "The LORD forbid it me, that I should give the inheritance of my fathers unto thee" (1 Kings 21:3) — and the taking was done with legal machinery and false witnesses (1 Kings 21:13), until Yahweh sent the question that ends every such transaction: "Hast thou killed, and also taken possession?" (1 Kings 21:19). That is a burned district and a denied insurance claim, written three thousand years ago. Micah saw the same men: "they covet fields, and take them by violence; and houses, and take them away: so they oppress a man and his house, even a man and his heritage" (Micah 2:2). Isaiah saw the paperwork: "Woe unto them that decree unrighteous decrees" (Isaiah 10:1) — redlining maps and sentencing ratios are decrees, written down, signed. Pharaoh supplies the word "engineered": "Come on, let us deal wisely with them" (Exodus 1:10) — strategy, not accident — followed by taskmasters and lives made bitter (Exodus 1:11, 1:14). And "get over it" has a name too: "They have healed also the hurt of the daughter of my people slightly, saying, Peace, peace; when there is no peace" (Jeremiah 6:14). But the same Word that names the wound forbids the closing turn. "Thou shalt not raise a false report: put not thine hand with the wicked to be an unrighteous witness" (Exodus 23:1) — and among the seven things Yahweh hates are "a false witness that speaketh lies, and he that soweth discord among brethren" (Proverbs 6:19). Over Abraham’s line specifically He said "I will bless them that bless thee, and curse him that curseth thee" (Genesis 12:3), Paul warned the grafted-in branch "Boast not against the branches" (Romans 11:18), and Yahweh calls that people the apple of His eye (Zechariah 2:8). He "hath made of one blood all nations of men" (Acts 17:26) — one family, no exceptions in either direction. So the believer holds BOTH in one hand: the wound is real and the scale is crooked — AND the false report is forbidden, no matter how real the wound of the one carrying it. AND NOW THE FRAME OVER ALL OF IT, without which this lesson would overreach. Everything above that is HIS is fixed: the commands, the woes, the covenant word, the remedy. Everything here that is OURS is the work of humans trying to understand Him with the capabilities He gave us, and we are doing it in the wilderness — not home yet. Yahweh drew that exact line: "The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever, that we may do all the words of this law" (Deuteronomy 29:29). What He revealed is ours to work and to teach our children; what He kept is His, and we do not manufacture it. Paul kept the same line honestly: "For we know in part, and we prophesy in part" (1 Corinthians 13:9), "For now we see through a glass, darkly; but then face to face" (1 Corinthians 13:12). The wilderness is not an accident of our position — it is the proving ground itself: "thou shalt remember all the way which the LORD thy God led thee these forty years in the wilderness, to humble thee, and to prove thee, to know what was in thine heart" (Deuteronomy 8:2). The saints before us died holding promises they had only seen afar off, and "confessed that they were strangers and pilgrims on the earth" (Hebrews 11:13) — which is the same word Yahweh used when He explained why the land could never be permanently sold: "ye are strangers and sojourners with me" (Leviticus 25:23). So we hold the Word as certain and our reading of the history as our best faithful work, offered under "Trust in the LORD with all thine heart; and lean not unto thine own understanding" (Proverbs 3:5), asking for the wisdom He gives liberally (James 1:5), walking — "For we walk by faith, not by sight" (2 Corinthians 5:7) — and saying with Paul "Not as though I had already attained" (Philippians 3:12). His verdict on these events is settled and will be published; ours is a lamp carried through the dark until He comes or calls us home. AND HERE IS WHY THE WILDERNESS IS NOT ONLY HIS PROVING GROUND. Governments and power structures MANUFACTURE wilderness — they make the desert people are then told to survive faithfully in. Yahweh charged the shepherds of Israel with exactly this: "The diseased have ye not strengthened, neither have ye healed that which was sick, neither have ye bound up that which was broken, neither have ye brought again that which was driven away, neither have ye sought that which was lost; but with force and with cruelty have ye ruled them" (Ezekiel 34:4). Every clause is an indictment of a power that had the capacity to restore and chose not to — the unbound break, the driven-away never brought again. And the powers manufacture something subtler than the desert: the NARRATIVE that keeps people in it quietly — that others have it worse, that things could be worse, that everybody should be satisfied. That narrative IS the divers weight put to work as a management tool. It sets one people’s grief against another’s so both stay busy arguing over the scale instead of asking who has been holding it. A people made to compete for a rationed sympathy is a people not asking why the sympathy was rationed. Which is why this lesson refuses the comparison itself rather than trying to win it. And it does not end in destruction — it TRANSITIONS. We do not call this the end of days; we call it the transition to the Government of Yahweh, because what is coming is not the world running out but the government changing shoulders: "For unto us a child is born, unto us a son is given: and the government shall be upon his shoulder: and his name shall be called Wonderful, Counsellor, The mighty God, The everlasting Father, The Prince of Peace" (Isaiah 9:6). Not a better administration — a different Ruler, and the only one who will not manufacture a wilderness to govern from. "Of the increase of his government and peace there shall be no end... to order it, and to establish it with judgment and with justice from henceforth even for ever. The zeal of the LORD of hosts will perform this" (Isaiah 9:7). Judgment and justice are written into the charter, and He performs it Himself. Where every human government has said "be satisfied," He says "I will feed my flock, and I will cause them to lie down" (Ezekiel 34:15) — the rest the powers counterfeited, given rather than demanded. Until then: "The kingdoms of this world are become the kingdoms of our Lord, and of his Christ; and he shall reign for ever and ever" (Revelation 11:15) is the announced outcome, and "in the days of these kings shall the God of heaven set up a kingdom, which shall never be destroyed" (Daniel 2:44) is its certainty. AND HE IS NOT A RULER WHO ARRIVES LATER — JESUS **IS**. He answered with the Father’s own name: "Before Abraham was, I am" (John 8:58), the same name spoken at the bush, "I AM THAT I AM" (Exodus 3:14). He is "Alpha and Omega, the beginning and the ending... which is, and which was, and which is to come, the Almighty" (Revelation 1:8) — present tense first. He is "the same yesterday, and to day, and for ever" (Hebrews 13:8). He already said it plainly after the resurrection: "All power is given unto me in heaven and in earth" (Matthew 28:18) — given, past tense, held now. And the thrones this lesson has been indicting were never independent of Him: "by him were all things created... whether they be thrones, or dominions, or principalities, or powers: all things were created by him, and for him" (Colossians 1:16), "And he is before all things, and by him all things consist" (Colossians 1:17). So the transition is not a conquest of foreign territory. It is the return of borrowed authority to the One it was always made for and by. Every power that manufactured a wilderness did it on a throne He created. So we hold the record honestly, refuse the crooked scale AND the narrative that hands it to us, and live now under the Government that already IS — waiting only for it to be seen where it has always been true. AND NOW THE TIMELINES, because Yahweh does not merely promise justice — He SCHEDULES it, and His own record is the project-management standard. He gave Abram the duration before the affliction started: "thy seed shall be a stranger in a land that is not theirs, and shall serve them; and they shall afflict them four hundred years" (Genesis 15:13), with the deliverable named — "afterward shall they come out with great substance" (Genesis 15:14) — and the milestone set at "the fourth generation" (Genesis 15:16). Then He hit the date: "And it came to pass at the end of the four hundred and thirty years, even the selfsame day it came to pass, that all the hosts of the LORD went out from the land of Egypt" (Exodus 12:41). The selfsame day. Not approximately. AND HERE THE LESSON MUST CHECK ITS OWN NUMBERS, or it fails the very skill it teaches: Genesis 15:13 says four hundred, Exodus 12:41 says four hundred and thirty, and running them together as one figure is exactly the error this lesson corrects elsewhere. The Word explains the Word. The two numbers measure DIFFERENT things. Four hundred is the AFFLICTION — "they shall afflict them four hundred years" (Genesis 15:13), confirmed in Stephen’s sermon: "they should bring them into bondage, and entreat them evil four hundred years" (Acts 7:6). Four hundred and thirty is the SOJOURNING — "Now the sojourning of the children of Israel, who dwelt in Egypt, was four hundred and thirty years" (Exodus 12:40) — and Paul measures the same 430 from the promise to the law: "the law, which was four hundred and thirty years after" (Galatians 3:17). Two clocks, two subjects, both kept exactly. Which is itself the discipline: when two numbers in a true record appear to disagree, the honest move is not to blur them and not to discard the record — it is to ask what each one is measuring. He did the same with Babylon, published in advance — "these nations shall serve the king of Babylon seventy years" (Jeremiah 25:11) — with the return committed: "after seventy years be accomplished at Babylon I will visit you, and perform my good word toward you, in causing you to return to this place" (Jeremiah 29:10). And Daniel READ the schedule and worked it: "I Daniel understood by books the number of the years... that he would accomplish seventy years in the desolations of Jerusalem" (Daniel 9:2) — a man checking the published timeline and praying it in on time. His recurring cycles are calendared too: "At the end of every seven years thou shalt make a release" (Deuteronomy 15:1), and the fiftieth-year return of every man to his possession (Leviticus 25:10). The Son shipped on schedule: "when the fulness of the time was come, God sent forth his Son" (Galatians 4:4). And the discipline for the waiting: "For the vision is yet for an appointed time, but at the end it shall speak, and not lie: though it tarry, wait for it; because it will surely come, it will not tarry" (Habakkuk 2:3) — held with the honest limit, "It is not for you to know the times or the seasons, which the Father hath put in his own power" (Acts 1:7). Now weigh what that does to "get over it." Yahweh never told Israel to get over four hundred years. He dated it, He watched it, and "God heard their groaning, and God remembered his covenant" (Exodus 2:24). A God who keeps a four-hundred-year appointment does not consider a hundred-year-old wound stale. THIS IS METANOIA — the framework correction the first sermon commanded: "Repent: for the kingdom of heaven is at hand" (Matthew 4:17), *metanoia* (G3341), the mind turned, the operating framework replaced. Every move in this lesson is one correction: from ranking griefs to one just weight; from "it was long ago" to a God who keeps dated covenants; from "my wound licenses my accusation" to a false report forbidden without exception; from the end of days to the transition to His Government; from waiting for a distant rescue to standing under the One who IS. That is not opinion adjustment. It is "be not conformed to this world: but be ye transformed by the renewing of your mind" (Romans 12:2), "bringing into captivity every thought to the obedience of Christ" (2 Corinthians 10:5) — and it is required in both directions, because "my thoughts are not your thoughts, neither are your ways my ways, saith the LORD" (Isaiah 55:8). AND NOW WHAT THE GODHEAD EXPECTS OF US, because a lesson that names a wound and a schedule but never says what is required of the hearer has stopped short. Yahweh answered this plainly and briefly: "He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?" (Micah 6:8). All three at once — DO JUSTLY (the record told straight, the false weight refused, restitution sought), LOVE MERCY (the wound of another honored, the verdict on a soul left to Him), WALK HUMBLY (our reading held as human work done in part). Drop any one and the other two curdle: justice without mercy becomes a grievance industry, mercy without justice becomes the hurt healed slightly, and either without humility becomes the divers weight again with our thumb on it. He said the same to Israel at Sinai’s edge — "what doth the LORD thy God require of thee, but to fear the LORD thy God, to walk in all his ways, and to love him, and to serve the LORD thy God with all thy heart and with all thy soul" (Deuteronomy 10:12) — and through Zechariah with this exact subject matter: "Execute true judgment, and shew mercy and compassions every man to his brother: And oppress not the widow, nor the fatherless, the stranger, nor the poor; and let none of you imagine evil against his brother in your heart" (Zechariah 7:9-10). Note the last clause: not merely refrain from the false report, but do not IMAGINE evil against your brother in your heart. That reaches the place where a conspiracy about a people is assembled before it is ever spoken. THE SON set the whole law on two hinges: "Thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy mind... And the second is like unto it, Thou shalt love thy neighbour as thyself" (Matthew 22:37-39), and He named the proof — "If ye love me, keep my commandments" (John 14:15) — and told us where He is found in a lesson like this one: "Inasmuch as ye have done it unto one of the least of these my brethren, ye have done it unto me" (Matthew 25:40). THE HOLY SPIRIT is the one who produces it rather than us manufacturing it: "the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, Meekness, temperance" (Galatians 5:22-23), "as many as are led by the Spirit of God, they are the sons of God" (Romans 8:14) — and He can be grieved by how we carry this: "grieve not the holy Spirit of God, whereby ye are sealed unto the day of redemption" (Ephesians 4:30). What He does NOT accept is the performance without the substance: "I desired mercy, and not sacrifice; and the knowledge of God more than burnt offerings" (Hosea 6:6), "to obey is better than sacrifice" (1 Samuel 15:22), and the whole of it must be real — "let us not love in word, neither in tongue; but in deed and in truth" (1 John 3:18), before the One who "is a Spirit: and they that worship him must worship him in spirit and in truth" (John 4:24). So the expectation on the hearer of this lesson is not an opinion about history. It is: tell the truth justly, carry another’s grief mercifully, hold your own understanding humbly, refuse to imagine evil against a people in your heart, and let the Spirit — not your outrage — produce what comes out of you. AND WHAT WE EXPECT OF GOVERNMENTS, since this lesson is finally about them. The Word sets the job description, and it is not neutral: "he is the minister of God to thee for good... he beareth not the sword in vain: for he is the minister of God, a revenger to execute wrath upon him that doeth evil" (Romans 13:4), and "rulers are not a terror to good works, but to the evil" (Romans 13:3). That is the standard by which every government in this lesson is measured — and a government that becomes a terror to good works and shelters the evil has not lost its authority so much as inverted its assignment. Yahweh stated the deliverables directly: "Execute ye judgment and righteousness, and deliver the spoiled out of the hand of the oppressor: and do no wrong, do no violence to the stranger, the fatherless, nor the widow, neither shed innocent blood" (Jeremiah 22:3). Measure Greenwood, the revoked order, and the redlining map against that sentence. The Word also tells us plainly what the difference feels like on the ground: "When the righteous are in authority, the people rejoice: but when the wicked beareth rule, the people mourn" (Proverbs 29:2) — the mourning in this teaching is documented, and Scripture treats it as evidence about the rulers, not as a defect in the mourners. Two limits hold it together: the powers are ordained (Romans 13:1) and "the most High ruleth in the kingdom of men, and giveth it to whomsoever he will, and setteth up over it the basest of men" (Daniel 4:17) — even the basest is inside His government, not outside it; AND obedience has a ceiling: "We ought to obey God rather than men" (Acts 5:29). So: honor without worship — "Honour all men. Love the brotherhood. Fear God. Honour the king" (1 Peter 2:17) — and pray for them rather than only about them: "supplications, prayers, intercessions, and giving of thanks, be made for all men; For kings, and for all that are in authority; that we may lead a quiet and peaceable life" (1 Timothy 2:1-2). NOW WHAT WE ACTUALLY DO WHILE ENDURING IT — and Yahweh answered this to a people living under the exact government that had carried them off, which is as close to this lesson’s situation as Scripture gets. Not "wait passively," and not "burn it down." He said: "Build ye houses, and dwell in them; and plant gardens, and eat the fruit of them; Take ye wives, and beget sons and daughters... that ye may be increased there, and not diminished. And seek the peace of the city whither I have caused you to be carried away captives, and pray unto the LORD for it: for in the peace thereof shall ye have peace" (Jeremiah 29:5-7). Build. Plant. Marry. Raise children. Increase rather than diminish. Seek the peace of the very city that holds you — because your peace is inside its peace. That is the seventy-year assignment, given WITH the seventy-year timeline, and it is the opposite of both despair and revolt. Daniel lived it: he served the government that took him and still "purposed in his heart that he would not defile himself" (Daniel 1:8) — full service, uncompromised conscience, in the same life. And the posture underneath it all: "avenge not yourselves, but rather give place unto wrath: for it is written, Vengeance is mine; I will repay, saith the Lord" (Romans 12:19), "Be not overcome of evil, but overcome evil with good" (Romans 12:21), "let us not be weary in well doing: for in due season we shall reap, if we faint not" (Galatians 6:9). SO WHAT DOES IT LOOK LIKE WHEN IT ACTUALLY HAPPENS? Yahweh described it in three gears, and the order matters: "they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint" (Isaiah 40:31). Sometimes it looks like MOUNTING UP — a season where you are carried above the thing entirely and it is unmistakably Him. Sometimes it looks like RUNNING without exhaustion — sustained, productive labor at a pace that should have emptied you and did not. And most days, honestly, it looks like WALKING AND NOT FAINTING — the unglamorous gear, the one nobody testifies about: you got up, you told the truth again, you did not become bitter, you did not carry the false report, you built and planted one more day. Notice that the promise covers the slowest gear by name. Waiting on Yahweh is not the absence of motion; it is the source of it — "Wait on the LORD: be of good courage, and he shall strengthen thine heart: wait, I say, on the LORD" (Psalm 27:14), which strengthens the HEART first and the legs after. And the outcome He is working toward through it is Joseph’s sentence, said by a man who had every earthly reason for the other verdict: "ye thought evil against me; but God meant it unto good, to bring to pass, as it is this day, to save much people alive" (Genesis 50:20). Clear memory, named evil, redeemed meaning, and many people alive because of what he endured. That is what it looks like when it actually happens. AND NOW THE DEFINITIONS UNDERNEATH EVERYTHING, because this lesson has used the words "good" and "evil" on every page and Yahweh does not let us supply our own meanings. HIS GOOD IS NOT OUR GOOD. Good is not a human rating; it is HIS verdict — "And God saw every thing that he had made, and, behold, it was very good" (Genesis 1:31). He is its only source: "Every good gift and every perfect gift is from above, and cometh down from the Father of lights" (James 1:17), and the Son closed the question — "Why callest thou me good? there is none good but one, that is, God" (Mark 10:18). Man’s "good," by contrast, is SELF-ASSESSED and therefore unreliable at exactly the moment it matters: "There is a way which seemeth right unto a man, but the end thereof are the ways of death" (Proverbs 14:12); "All the ways of a man are clean in his own eyes; but the LORD weigheth the spirits" (Proverbs 16:2); "Every way of a man is right in his own eyes: but the LORD pondereth the hearts" (Proverbs 21:2). Even our best is not the standard: "all our righteousnesses are as filthy rags" (Isaiah 64:6), "there is none that doeth good, no, not one" (Romans 3:12). AND HIS EVIL IS NOT OUR EVIL. Men tend to call evil whatever harms or offends THEM, and to call good whatever profits them — which is why a society can operate a hundred-to-one ratio and a denied insurance claim while sincerely believing itself good. Yahweh named that exact inversion and put a woe on it: "Woe unto them that call evil good, and good evil; that put darkness for light, and light for darkness; that put bitter for sweet, and sweet for bitter!" (Isaiah 5:20). And He locates evil’s source where no policy reaches: "For out of the heart proceed evil thoughts, murders, adulteries, fornications, thefts, false witness, blasphemies" (Matthew 15:19) — note that FALSE WITNESS is on that list, in the heart, beside murder. THE PART WE CANNOT SEE OURSELVES. This is the hardest truth in the lesson and it is aimed at the reader, not at anyone else: "The heart is deceitful above all things, and desperately wicked: who can know it?" (Jeremiah 17:9). Not "sometimes mistaken" — deceitful ABOVE ALL THINGS, and the question "who can know it?" is asked because the answer is not you. Paul reports the same from the inside: "For I know that in me (that is, in my flesh,) dwelleth no good thing... For the good that I would I do not: but the evil which I would not, that I do" (Romans 7:18-19). A man can hold a genuinely righteous grievance and carry, underneath it and unseen by him, the seed of an accusation against a whole people — and he will not find it by introspecting, because the instrument he would use to look is the thing under examination. SO THE WORD IS THE INSTRUMENT, NOT OUR INSIGHT. "For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart" (Hebrews 4:12) — it divides what we cannot even distinguish in ourselves, down to intent. Nothing is hidden from it: "all things are naked and opened unto the eyes of him with whom we have to do" (Hebrews 4:13). He alone does this work: "I the LORD search the heart, I try the reins, even to give every man according to his ways" (Jeremiah 17:10), and "the LORD seeth not as man seeth; for man looketh on the outward appearance, but the LORD looketh on the heart" (1 Samuel 16:7). Which leaves the believer one honest move, and it is a PRAYER rather than an analysis: "Search me, O God, and know my heart: try me, and know my thoughts: And see if there be any wicked way in me, and lead me in the way everlasting" (Psalm 139:23-24). Note who does the searching. We do not audit ourselves and report the findings; we submit to His search and receive them. THIS IS WHY THE LESSON ENDS HERE. Every skill it taught — separating documented fact from accusation, correcting your own numbers, refusing the false report — can be performed by a heart that is still carrying what it refuses to name. The skills are real and necessary and they are not sufficient. Only the Word, wielded by Him on us rather than by us on others, reaches the place where the crooked scale actually lives. AND THAT RAISES THE LAST QUESTION: WITH WHICH MIND? Because everything above can be read two ways, and Scripture says the two are not variations of one faculty — they are opposed settings. "For they that are after the flesh do mind the things of the flesh; but they that are after the Spirit the things of the Spirit. For to be carnally minded is death; but to be spiritually minded is life and peace" (Romans 8:5-6). And the carnal setting is not merely weaker; it is hostile and INCAPABLE: "Because the carnal mind is enmity against God: for it is not subject to the law of God, neither indeed can be" (Romans 8:7). THE CARNAL MIND CANNOT SEE THE SPIRITUAL THING AT ALL. This is the sentence to sit with: "But the natural man receiveth not the things of the Spirit of God: for they are foolishness unto him: neither can he know them, because they are spiritually discerned" (1 Corinthians 2:14). Not "will not" — CANNOT. The whole spiritual module is invisible to that setting, and it registers as foolishness rather than as something missing, which is why no amount of argument moves it. The spiritual setting has the opposite capacity: "But he that is spiritual judgeth all things" (1 Corinthians 2:15), and the ground of it is the confession this platform is built on — "But we have the mind of Christ" (1 Corinthians 2:16). AND THERE IS A LADDER, given not achieved, and trained not downloaded. CAPACITY first: "Now we have received, not the spirit of the world, but the spirit which is of God; that we might know the things that are freely given to us of God" (1 Corinthians 2:12) — the equipment, and the Spirit Himself does the guiding, "he will guide you into all truth" (John 16:13). KNOWLEDGE next, with its stated starting point: "The fear of the LORD is the beginning of wisdom: and the knowledge of the holy is understanding" (Proverbs 9:10). UNDERSTANDING is a distinct thing to be pursued, not a byproduct: "Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding" (Proverbs 4:7); it must be lit from outside — "The eyes of your understanding being enlightened" (Ephesians 1:18) — and Paul prays for exactly this compound, "filled with the knowledge of his will in all wisdom and spiritual understanding" (Colossians 1:9). And then COMPETENCY, which is the one nobody can skip: "But strong meat belongeth to them that are of full age, even those who by reason of use have their senses exercised to discern both good and evil" (Hebrews 5:14). BY REASON OF USE. EXERCISED. The ability to tell Yahweh’s good from man’s good — the very thing this lesson has been teaching — is a trained faculty built by repetition, which is precisely why this track hands the learner a real charged claim rather than a verdict. AND THE AUTHORITY IS NOT CARNAL EITHER. "For though we walk in the flesh, we do not war after the flesh: (For the weapons of our warfare are not carnal, but mighty through God to the pulling down of strong holds;) Casting down imaginations, and every high thing that exalteth itself against the knowledge of God, and bringing into captivity every thought to the obedience of Christ" (2 Corinthians 10:3-5). Note the battlefield: IMAGINATIONS and THOUGHTS — the same interior country Jeremiah 17:9 said we cannot police ourselves. That is the real theater of this lesson, and the equipment for it is spiritual: "Behold, I give unto you power to tread on serpents and scorpions, and over all the power of the enemy" (Luke 10:19), with a mind that is neither fearful nor frantic — "God hath not given us the spirit of fear; but of power, and of love, and of a sound mind" (2 Timothy 1:7). SO TEST WHICH MIND IS SET BY THE FRUIT, because both readings of this history feel righteous from inside. The carnal reading of a real wound produces a list Scripture already wrote down: "hatred, variance, emulations, wrath, strife, seditions, heresies, Envyings" (Galatians 5:20-21) — every one of them available to a person who is genuinely wronged, and every one of them named a work of the flesh regardless. James is blunter still: "if ye have bitter envying and strife in your hearts, glory not, and lie not against the truth. This wisdom descendeth not from above, but is earthly, sensual, devilish" (James 3:14-15) — note that a wisdom can be real, sharp, and from below. The spiritual reading produces the opposite signature: "But the wisdom that is from above is first pure, then peaceable, gentle, and easy to be intreated, full of mercy and good fruits, without partiality, and without hypocrisy" (James 3:17) — and mark those two words, WITHOUT PARTIALITY. And there the lesson closes its own circle, because "without partiality" is the just weight of Deuteronomy 25:15 arriving as FRUIT rather than as effort — the crooked scale finally straightened not by our discipline but by which mind was set. "Walk in the Spirit, and ye shall not fulfil the lust of the flesh" (Galatians 5:16).',
      scripture: 'Deuteronomy 25:13-16; Matthew 7:2; 1 Kings 21:3, 21:13, 21:19; Micah 2:1-2; Isaiah 10:1-2; Exodus 1:10-14; Jeremiah 6:14; Exodus 23:1; Proverbs 6:16-19; Genesis 12:3; Romans 11:18; Zechariah 2:8; Acts 17:26; Romans 12:15; Leviticus 25:10, 25:23; Numbers 27:1-7; James 5:4; Deuteronomy 29:29; 1 Corinthians 13:9, 13:12; Deuteronomy 8:2; Hebrews 11:13; Proverbs 3:5-6; James 1:5; 2 Corinthians 5:7; Philippians 3:12; Ezekiel 34:4, 34:15; Isaiah 9:6-7; Revelation 11:15; Daniel 2:44; John 8:58; Exodus 3:14; Revelation 1:8; Hebrews 13:8; Matthew 28:18; Colossians 1:16-17; Genesis 15:13-16; Exodus 12:41; Exodus 2:24; Jeremiah 25:11; Jeremiah 29:10; Daniel 9:2; Deuteronomy 15:1; Galatians 4:4; Habakkuk 2:3; Acts 1:7; Matthew 4:17; Romans 12:2; 2 Corinthians 10:5; Isaiah 55:8-9; Acts 7:6; Exodus 12:40; Galatians 3:17; Micah 6:8; Deuteronomy 10:12; Zechariah 7:9-10; Matthew 22:37-39; John 14:15; Matthew 25:40; Galatians 5:22-23; Romans 8:14; Ephesians 4:30; Hosea 6:6; 1 Samuel 15:22; 1 John 3:18; John 4:24; Romans 13:1-4; Jeremiah 22:3; Proverbs 29:2; Daniel 4:17; Acts 5:29; 1 Peter 2:17; 1 Timothy 2:1-2; Jeremiah 29:5-7; Daniel 1:8; Romans 12:19, 12:21; Galatians 6:9; Isaiah 40:31; Psalm 27:14; Genesis 50:20; Genesis 1:31; James 1:17; Mark 10:18; Proverbs 14:12, 16:2, 21:2; Isaiah 64:6; Romans 3:12; Isaiah 5:20; Matthew 15:19; Jeremiah 17:9-10; Romans 7:18-19; Hebrews 4:12-13; 1 Samuel 16:7; Psalm 139:23-24; Romans 8:5-7; 1 Corinthians 2:12, 2:14-16; John 16:13; Proverbs 9:10; Proverbs 4:7; Ephesians 1:18; Colossians 1:9; Hebrews 5:14; 2 Corinthians 10:3-5; Luke 10:19; 2 Timothy 1:7; Galatians 5:16, 5:20-21; James 3:14-17',
    },
    threeD: 'Practically: you can receive the documented history in full — Greenwood, the revoked land, two loans out of thirty-two hundred, one hundred to one — and still stop cold at the last paragraph, and you have not betrayed the first part by refusing the last. Those are two separate judgments and a disciplined mind makes both. Notice the exact sentence where a sourced argument stops being sourced; that is the seam. Fix your own numbers before an opponent does, because a wrong figure inside a true case is a gift to whoever wants the case dismissed. And when you meet someone whose grief has been dismissed, weep with them first — you are not obligated to grade the wound before you sit with it.',
    accountability: {
      statement: 'THE TWO COURTS, on both halves. On the documented wrongs: dispossession that man’s courts blessed still stands accused before the eternal one — "For God shall bring every work into judgment, with every secret thing" (Ecclesiastes 12:14). A denied claim, a revoked order, a redlining map, and a ratio written into statute were all lawful in their day; lawfulness is not acquittal. Where wages and inheritance were kept back, the Word says the loss itself has a voice: "the hire of the labourers... which is of you kept back by fraud, crieth: and the cries of them which have reaped are entered into the ears of the Lord of sabaoth" (James 5:4). And what the Word requires of a wrongdoer is not an apology but RESTITUTION — fourfold and fivefold restoration is the standard (Exodus 22:1), and Zacchaeus is the model of repentance that pays. Yahweh’s own remedy for generational dispossession is not sentiment but a priced institution: "ye shall return every man unto his possession" (Leviticus 25:10), because "The land shall not be sold for ever: for the land is mine" (Leviticus 25:23). ON THE SECOND HALF, the same court sits: bearing a false report against a people is not a lesser sin because the one bearing it was genuinely wronged. Exodus 23:1 has no exception for the aggrieved, and Yahweh hates the sowing of discord among brethren (Proverbs 6:19). Our own accountability: never conceal a real wrong to keep a false peace (Leviticus 5:1), never justify the wicked or condemn the just — both are abomination (Proverbs 17:15) — and plead the cause of the shut-out (Proverbs 31:8-9) without taking up an accusation against anyone made in His image.',
      scripture: 'Ecclesiastes 12:14; James 5:4; Exodus 22:1; Leviticus 25:10, 25:23; Exodus 23:1; Proverbs 6:19; Leviticus 5:1; Proverbs 17:15; Proverbs 31:8-9; Numbers 5:6-7; Luke 19:8',
    },
    benefits: [
      'Both courts, honestly held: this life’s justice is real but partial — revoked orders, denied claims, and lawful ratios went unanswered in man’s court — while the ETERNAL court after this life misses nothing (Ecclesiastes 12:14; Hebrews 9:27), and what was kept back still cries out (James 5:4).',
      'The ability to receive a true, documented grievance in full without swallowing the false report attached to its end.',
      'A tested eye for the SEAM — the exact sentence where a sourced argument stops being sourced and starts being an accusation.',
      'Freedom from the crooked scale in both directions: never ranking whose catastrophe counts, and never dismissing one because its teller got a number wrong.',
      'Precision as a weapon for the wronged — knowing the real hundred-to-one ratio instead of a memorable wrong one, so the case cannot be waved away.',
      'The Word’s own remedy for dispossession: restitution and return, not sentiment — a priced institution Yahweh built into the law.',
      'The wilderness posture that keeps a strong lesson from overreaching: what He revealed is ours to work and teach (Deuteronomy 29:29), what He kept is His, and our own reading is held as faithful work done in part (1 Corinthians 13:9) by strangers and pilgrims not yet home (Hebrews 11:13).',
      'Sight to see that the powers manufacture BOTH the wilderness and the "others have it worse, be satisfied" narrative that keeps people quiet in it — the crooked scale handed to you is a management tool, not an accident (Ezekiel 34:4).',
'A transition to live toward rather than a doom to dread: what is coming is not the end of days but the transition to the Government of Yahweh — "the government shall be upon his shoulder" (Isaiah 9:6), established "with judgment and with justice" (Isaiah 9:7), performed by the zeal of Yahweh Himself.',
      'Yahweh SCHEDULES justice, on clocks He names: the four-hundred-year affliction announced to Abram (Genesis 15:13; Acts 7:6) and the four-hundred-and-thirty-year sojourning closed "the selfsame day" (Exodus 12:40-41; Galatians 3:17) — two measures, both kept — plus seventy years published and performed (Jeremiah 29:10), release every seven and return every fifty. A God who keeps appointments across centuries does not consider an old wound stale, which is the hardest possible answer to "get over it."',
      'Yahweh\u2019s definitions rather than ours: GOOD is His verdict and His alone (Genesis 1:31; Mark 10:18; James 1:17), never our self-assessment \u2014 "There is a way which seemeth right unto a man, but the end thereof are the ways of death" (Proverbs 14:12).',
      'The named inversion to watch for in any society, including a righteous-feeling one: "Woe unto them that call evil good, and good evil" (Isaiah 5:20) \u2014 which is how a hundred-to-one ratio and a denied claim coexist with sincere self-approval.',
      'Honesty about the part of yourself you cannot inspect: "The heart is deceitful above all things, and desperately wicked: who can know it?" (Jeremiah 17:9) \u2014 a true grievance and an unseen accusation can live in the same chest (Romans 7:19).',
      'The right instrument for that blind spot \u2014 not introspection but the Word, "a discerner of the thoughts and intents of the heart" (Hebrews 4:12), applied by Him to us through the prayer "Search me, O God" (Psalm 139:23-24) rather than by us to others.',
      'The setting that decides everything, named: "to be carnally minded is death; but to be spiritually minded is life and peace" (Romans 8:6) \u2014 and the carnal setting is not weaker but INCAPABLE, since "the natural man receiveth not the things of the Spirit of God... neither can he know them" (1 Corinthians 2:14).',
      'The ladder, given and then trained: capacity received (1 Corinthians 2:12), knowledge begun in the fear of the LORD (Proverbs 9:10), understanding pursued and enlightened (Proverbs 4:7; Ephesians 1:18), and COMPETENCY built "by reason of use" until the senses are "exercised to discern both good and evil" (Hebrews 5:14) \u2014 which is why this track hands you a real charged claim instead of a verdict.',
      'A fruit test for which mind is set, since both readings feel righteous from inside: the carnal reading of a real wound yields "hatred, variance... wrath, strife, seditions... Envyings" (Galatians 5:20-21) and a wisdom that is "earthly, sensual, devilish" (James 3:15); the spiritual yields wisdom "first pure, then peaceable... WITHOUT PARTIALITY" (James 3:17) \u2014 the just weight of Deuteronomy 25:15 arriving as fruit rather than as effort.',
      'A measurable standard for government rather than a mood: "he is the minister of God to thee for good" and "rulers are not a terror to good works, but to the evil" (Romans 13:3-4), with the deliverables named — "deliver the spoiled out of the hand of the oppressor" (Jeremiah 22:3) — so a record can be weighed against a job description.',
      'A concrete assignment for the enduring years, given by Yahweh to people under the very government that carried them off: "Build ye houses... plant gardens... seek the peace of the city" (Jeremiah 29:5-7) — increase rather than diminish, neither despair nor revolt.',
      'Isaiah 40:31 in three honest gears — mounting up, running without weariness, and WALKING AND NOT FAINTING, the unglamorous gear most days actually are, named in the promise rather than left out of it.',
      'What the Godhead expects, stated rather than implied: "to do justly, and to love mercy, and to walk humbly with thy God" (Micah 6:8) — all three together, since justice without mercy becomes a grievance industry and mercy without justice is the hurt healed slightly.',
      'Zechariah 7:10 reaches further than speech — "let none of you imagine evil against his brother in your heart" — which is where a conspiracy about a people is assembled before it is ever said aloud.',
      'The lesson names its own mechanism: metanoia (G3341) — the mind turned, the framework corrected (Matthew 4:17; Romans 12:2) — so the learner walks out with a REPLACED operating framework, not merely a new opinion.',
      'Present-tense footing: Jesus IS — "Before Abraham was, I am" (John 8:58), "All power is given unto me in heaven and in earth" (Matthew 28:18) — so the believer carrying a real grievance already lives under the Government that holds, rather than waiting for a rescue that has not started.',
    ],
    graceNote: 'This lesson pronounces no verdict on any person or people. It does not condemn the speaker, whose grievance is largely documented and whose wound is real; a man can be right about his injury and wrong about who to name for it, and the second does not erase the first. It does not accuse Jewish people, who are made in Yahweh’s image, carry His covenant word, and have been the target of this exact accusation through centuries that ended in ovens. It does not excuse those who wrote the decrees; it leaves their souls to Yahweh while naming their deeds plainly. Truth and grace are not in tension here — the same Word that refuses to let a wound be minimized refuses to let a lie be carried, and it is the same love doing both.',
    stewardship: 'There is a response deeper than argument. Numbers 27 records five daughters with no inheritance who came and stood at the door and stated their cause — "Why should the name of our father be done away from among his family?" (Numbers 27:4) — and Yahweh answered: "The daughters of Zelophehad speak right" (Numbers 27:7). The statute was AMENDED and possession given. That is the Word’s picture of a dispossessed voice pressing in, being judged right, and the law changing — not merely permission to complain, but inheritance restored. So the stewardship is: tell it accurately enough to be believed, press it where it can be heard, build and hold what can be built and held, and teach the children the record with the numbers correct — because a generation that carries the true version can be answered, and a generation carrying a false one can be dismissed.',
    anchor: {
      ref: 'Deuteronomy 25:15',
      theme: 'A perfect and just weight, a perfect and just measure shalt thou have. One scale — for whose grief counts, for whose wound is real, and for whose claim gets checked. The same weight in both pans, every time.',
    },
  },
  reflection: {
    skill: 'When a teaching’s grievance is true and its conclusion is false: separate the two judgments instead of choosing between them. Receive what is documented, correct what is wrong even when it is on your own side, and refuse the false report about a people no matter how genuine the pain of the one carrying it. One scale, both pans.',
    practice: 'Take one figure from this lesson — the hundred-to-one ratio, the two-of-3,200 loans, or the denied Greenwood claims — and find the primary source yourself. Then write two sentences: one naming what the record actually documents, and one naming the exact sentence in the teaching where the sourced argument stops and the unsupported accusation begins.',
    prompts: [
      'Which parts of this teaching are documented, which are unproven allegations, and which are opinions about how society behaves? How could you check each one?',
      'The speaker’s two wrong numbers both make his case WEAKER than the truth does. Why would someone reach for a memorable figure instead of the real one, and what does it cost him?',
      'Can you state fairly, at its strongest, the Jewish experience the comparison passes over — including the doors that were shut before the war?',
      'Yahweh forbids a false report with no exception for people who have genuinely been wronged (Exodus 23:1). Why do you think He left no exception there?',
      'What is the difference between saying "this wound is real and still compounding" and saying "therefore that people is to blame"? Where exactly does the one become the other?',
      'Leviticus 25 answers dispossession with return and Exodus 22 answers theft with restitution. What would it look like to want Yahweh’s remedy more than you want the argument?',
      'Deuteronomy 29:29 splits what Yahweh revealed from what He kept. Which parts of this lesson are HIS settled Word, and which are our best human reading of a history we still see "through a glass, darkly"? Why does keeping those two apart make the lesson stronger rather than weaker?',
      'Ezekiel 34:4 charges rulers who would not bind up the broken or bring back the driven-away. Where do you see power structures manufacturing a wilderness and then telling people to be satisfied in it because others have it worse? Who benefits when two wounded peoples argue over whose wound counts?',
      'Isaiah 9:6 says the government will rest on His shoulder. If that is where this ends, what does it change about how you carry a real grievance right now — what does it free you from, and what does it still require of you today?',
    ],
  },
  levels: {
    child: 'God gave a rule about weighing things fairly. If a shopkeeper had one heavy stone and one light stone in his bag, he could cheat people by using the big one when he bought and the little one when he sold. God said: have ONE honest weight (Deuteronomy 25:15). That rule is about more than shopping. It means we use the same fair measure for everybody’s hurt. If your friend gets hurt, you would not say "that was a long time ago, stop crying" — and then say something totally different when someone else gets hurt. Same rule, same care, for everyone. Here is the harder part: sometimes a person who was really, truly hurt gets so angry that they start blaming a whole group of people who did not do it. Being hurt is real. But blaming people who did not do it is still wrong, and God says so plainly. You can be very sad for someone AND still say, "that part is not true." Both at once. That is what being fair means.',
    teen: 'Here is a hard skill most people never learn: what do you do when someone is RIGHT about something real and then says something completely false at the end? Most people pick a side — either they believe the whole thing because the first part was true, or they throw out the whole thing because the last part was false. Both are lazy. Run the moves instead. (1) What is documented? A lot here is: land given to freed families in 1865 and taken back within a year; a whole business district in Tulsa burned and then the insurance claims denied — all but one; two out of more than 3,200 home loans in 13 Mississippi cities in 1947 going to Black borrowers; a 1986 law where five grams of crack got you the same five-year minimum as five hundred grams of powder. That is real, it is sourced, and nobody serious disputes it. (2) What did the speaker get wrong? Two things, and both times the TRUTH was worse than what he said. He said "five years versus five months" — the real law is the same five years for a hundred times less. He said "thirteen articles of the Constitution" — it is one amendment, the 13th. When you use a wrong number inside a true argument, you hand your opponent a way to dump the whole thing. (3) What has no evidence at all? The ending, where he says one group runs the banks, the movies, and the government. That is a very old accusation that traces back to a document proven to be a forgery, and it has gotten people killed. Notice that NOTHING earlier in his argument supports it — he just switches. Finding that switch is the whole skill. God says it straight: "Thou shalt not raise a false report" (Exodus 23:1), and He put no exception in there for people who have been genuinely wronged. So: believe the documented part, fix the numbers, refuse the ending. One honest scale.',
    senior: 'For the seasoned believer, this lesson is judgment held in both hands at once, and Scripture equips it fully. Start where Yahweh starts: divers weights are an abomination (Deuteronomy 25:13-16), and the Son sealed the measure you use as the measure returned to you (Matthew 7:2) — so the crooked scale the teaching protests is a sin against Yahweh Himself, not merely a social discourtesy. Then read the record through Naboth: a man who would not part with the inheritance of his fathers, a taking accomplished through courtroom procedure and paid witnesses, and the prophetic question that outlives every deed of sale — "Hast thou killed, and also taken possession?" (1 Kings 21:19). Greenwood is that chapter with a fire department: not merely a mob, but 1,800,000 dollars in claims and all but one denied because the deed was reclassified as a riot. Micah saw the coveting and the taking of a man’s heritage (Micah 2:2); Isaiah saw that the instrument is paperwork — "woe unto them that decree unrighteous decrees" (Isaiah 10:1) — and a redlining map and a hundred-to-one ratio are decrees with signatures. Pharaoh supplies the strategy word: "let us deal wisely with them" (Exodus 1:10). And "get over it" is Jeremiah 6:14 exactly — the hurt healed slightly, peace declared where there is none. Now the elder’s harder work, which the young advocate often cannot yet do: the same Word that vindicates the grievance forbids its closing turn without any allowance for the sufferer. "Thou shalt not raise a false report" (Exodus 23:1) has no clause for the aggrieved; Yahweh hates a false witness and the sowing of discord among brethren (Proverbs 6:19); the covenant word over Abraham’s line stands (Genesis 12:3); the grafted branch is warned not to boast against the natural ones (Romans 11:18); and that people is called the apple of His eye (Zechariah 2:8). Note also what honest history does to the comparison’s premise — Evian in 1938 where thirty-two nations declined, the St. Louis turned from an American port in 1939 with 255 of those returned later murdered, the 1939 White Paper sealing the other door. The gates were shut on both peoples by overlapping hands, which is a heavier indictment of the gatekeepers than the comparison as given. Teach the household the discipline that outlasts every news cycle: receive documented truth plainly (DR-0100 is Proverbs 12:19 in operational dress), correct your own side’s numbers before an opponent does it for you, refuse the false report though it come wrapped in a real wound, and want Yahweh’s remedy more than the argument — restitution that pays (Exodus 22:1; Luke 19:8) and return that restores possession (Leviticus 25:10), because His justice was never a slogan; it was priced, legislated, and calendared. And leave them Zelophehad’s daughters: five women with no inheritance who stood at the door, stated their cause, and heard Yahweh answer "the daughters of Zelophehad speak right" (Numbers 27:7) — the statute amended, possession given. That is the model. Not silence, and not a false report. A true cause, accurately stated, pressed where it can be heard, until the record is changed. And close it where the elder alone can close it, because it takes years to see: the wilderness these histories describe was not weather. Powers made it, and then issued the narrative that keeps people quiet inside it — that others have it worse, that it could be worse, that everyone should be satisfied. Yahweh already tried those shepherds and gave the verdict: "with force and with cruelty have ye ruled them" (Ezekiel 34:4), after listing every restoration they declined — the broken not bound up, the driven-away never brought again. The crooked scale in this teaching is not merely a bad habit of the public; it is a tool, and a people busy arguing over whose catastrophe ranks higher is a people not asking who has been holding the scale. So teach the household to refuse the comparison rather than to win it. And give them the horizon, because a grievance without one turns to bitterness in a young heart — and name it correctly: this is not the end of days, it is the transition to the Government of Yahweh: "the government shall be upon his shoulder: and his name shall be called Wonderful, Counsellor, The mighty God, The everlasting Father, The Prince of Peace" (Isaiah 9:6) — of the increase of that government "there shall be no end... to order it, and to establish it with judgment and with justice" (Isaiah 9:7), and "The zeal of the LORD of hosts will perform this." Not a reform. A transfer of government. Where every earthly power told this family to be satisfied, He says "I will feed my flock, and I will cause them to lie down" (Ezekiel 34:15). Until that day we hold the record straight, refuse the false report, seek restitution and return where they can be sought, and raise children who can carry a true account without carrying hatred — because the kingdoms of this world are already declared His (Revelation 11:15), and His kingdom "shall never be destroyed" (Daniel 2:44). Teach them last the thing that turns waiting into standing: Jesus IS. Not will be. "Before Abraham was, I am" (John 8:58) — the name from the bush, "I AM THAT I AM" (Exodus 3:14) — and "All power is given unto me in heaven and in earth" (Matthew 28:18), already given, held now. Even the thrones that ruled with force and cruelty were "created by him, and for him" (Colossians 1:16), and "by him all things consist" (Colossians 1:17). So the transition is a return of borrowed authority, not a battle for foreign ground; and the household that knows this carries its true account without fear, because the Government it is waiting to SEE is the Government it already lives under.',
  },
  quiz: [
    {
      q: 'The teaching says a Black man on crack got five years while a white man on powder got five months. What does the actual 1986 statute say?',
      choices: [
        'The teaching is right — five years versus five months',
        'Five grams of crack triggered the SAME five-year mandatory minimum as five hundred grams of powder — a 100-to-1 quantity ratio',
        'There was never any difference between crack and powder sentencing',
        'The difference only began after 2010',
      ],
      answer: 1,
      explain: 'The Anti-Drug Abuse Act of 1986 set a 100-to-1 quantity disparity: the same five-year minimum triggered by one hundred times less crack than powder. The Fair Sentencing Act of 2010 reduced it to 18-to-1, where it remains. The real statute is HARSHER than the version the teaching gave — which is exactly why using the accurate figure protects the argument instead of weakening it.',
    },
    {
      q: 'Everything documented in the first part of the teaching is true. Does that make the closing claim about Jewish control of media and banking more likely to be true?',
      choices: [
        'Yes — a speaker who is right about one thing is probably right about the rest',
        'No — the documented history of American policy supplies no evidence at all about who owns banks or studios; the argument switches from sourced claims to an unsupported accusation',
        'Yes, because both are about power',
        'It cannot be evaluated either way',
      ],
      answer: 1,
      explain: 'This is the seam, and finding it is the skill. Nothing about revoked land orders, denied insurance claims, redlining, or sentencing law bears on the ownership of banks or media. The closing claim is a separate assertion resting on a documented forgery — The Protocols of the Elders of Zion — and it must be judged on its own evidence, which is none.',
    },
    {
      q: 'Yahweh commands "Thou shalt not raise a false report" (Exodus 23:1). Does a person who has genuinely been wronged get an exception?',
      choices: [
        'Yes — real suffering justifies strong accusations',
        'No — the command carries no exception for the aggrieved, and Yahweh names a false witness and one who sows discord among brethren among the things He hates (Proverbs 6:19)',
        'Only if the accusation is mostly true',
        'The command applies only to courtroom testimony',
      ],
      answer: 1,
      explain: 'The command has no clause for the wounded. This is what lets a believer do the hard, adult thing: hold that a grievance is real and documented AND that the false report attached to it is forbidden — both judgments at once, with the same honest weight (Deuteronomy 25:15).',
    },
    {
      q: 'What does the Word offer as the remedy for generational dispossession?',
      choices: [
        'An apology and moving on',
        'Restitution that pays and return that restores possession — fourfold and fivefold restoration (Exodus 22:1) and jubilee return (Leviticus 25:10)',
        'Nothing — Scripture is silent on the question',
        'Only forgiveness, with no material component',
      ],
      answer: 1,
      explain: 'Yahweh’s justice was never sentiment. It was priced and legislated: theft repaid multiple times over (Exodus 22:1; Zacchaeus in Luke 19:8), and land returned to the family at jubilee because "the land is mine" (Leviticus 25:23). Forgiveness is commanded too — but the Word never asks the wronged to call an unpaid debt paid.',
    },
  ],
};

// =============================================================================
// NINTH WORKED EXAMPLE — "stop praying FOR it; live FROM the end": the Law of
// Assumption / Neville Goddard "purple timeline" teaching, handed in by Darrell
// 2026-08-10 as a transcript, with one instruction: "Word first of course."
//
// This issue is the hardest KIND in the track so far, and that is why it is
// here. It is not a claim about the world (a documentary, an industry, a
// verdict) — it is a claim about GOD and about the self, wrapped around two
// pieces of real science and one real verse. DR-0100's three tiers do the work:
// the attention research and the identity research are TRUE and are said so
// plainly; the physics claim is NOT what physics says and is named; and the
// doctrine underneath — your imagination IS God, so stop asking Him — is what
// the Word corrects, by name, with His own words.
// =============================================================================
const LAW_OF_ASSUMPTION_ISSUE = {
  id: 'wi-law-of-assumption',
  title: '“Stop Praying For It — Live From The End”: The Law of Assumption, Thought-Manifestation, and Who Actually Declares The End',
  subject: {
    name: 'The Law of Assumption / “live from the end” manifestation teaching, as popularized by Neville Goddard (1905-1972) and taught in short-form video',
    kind: 'spiritual teaching / self-help claim',
    isNamedRealPerson: true,
  },
  skill: 'Take a teaching that MIXES real science, a real verse, and a false god — the hardest mixture to sort — and separate the three by hand: keep what is documented, name what is misused, and let the Word answer the claim about God Himself. Learn to spot the move where a true thing is used as the doorway for an untrue one.',
  source: {
    creator: 'a short-form video teacher (unnamed), transmitting Neville Goddard’s Law of Assumption',
    medium: 'short-form video (transcript)',
    title: '“Part two… one of the biggest lessons from Neville Goddard that he taught me growing up”',
    url: 'https://mynevillegoddard.com/word-studies/imagination',
    asOf: '2026-08-10',
    note: 'Handed in by Darrell 2026-08-10 as a transcript with the instruction “Word first of course.” We weigh the TEACHING; we condemn no teacher and no viewer who has believed it.',
  },
  claims: [
    { id: 'c-never-ask', text: 'You are never looking for an answer — you look FROM the answer. Stop praying for the money, the spouse, the health; pray and act from the outcome as the version of you who already has it.', label: 'claim', attribution: 'the video / Neville Goddard’s Law of Assumption', note: 'This is the teaching’s core instruction, and it is the point where it collides head-on with what Scripture tells a believer to do with a request.' },
    { id: 'c-ras', text: 'The brain’s reticular activating system’s “only job is to filter reality based on your most dominant belief,” so focusing on what you lack guarantees obstacles.', label: 'claim', attribution: 'the video', note: 'Half documented, half overstated — the RAS is real and does gate attention; “its only job is to filter reality by your dominant belief” is not what the research says.' },
    { id: 'c-identity', text: 'Your actions always align with the identity you hold, so becoming specific about the future self (down to the peanut butter) programs you for the outcome.', label: 'claim', attribution: 'the video, citing identity-based motivation theory', note: 'The underlying theory is real and well-published; the “down to the peanut butter” certainty is the teacher’s embellishment.' },
    { id: 'c-purple-timeline', text: 'Quantum physics “collapsing the wave” means a timeline already exists — the “purple timeline” — where you already have the health, wealth, love and success, and your job is to step into it.', label: 'claim', attribution: 'the video', note: 'This is not what the physics says. Named plainly below, with a source.' },
    { id: 'c-god-declares', text: '“God declares the end from the beginning” — therefore your best life is already a finished work waiting for you to step into it.', label: 'claim', attribution: 'the video, citing Isaiah 46:10', note: 'The verse is real. The conclusion drawn from it is not what the verse says — the finished thing in that passage is HIS counsel, not our wish list. This is the whole lesson.' },
    { id: 'c-imagination-is-god', text: 'The creative power called God is not outside you; human imagination IS God in action.', label: 'claim', attribution: 'Neville Goddard’s own teaching, which the video transmits', note: 'The teaching’s foundation, stated by its own sources. This is the claim the Word answers directly.' },
  ],
  verifiable: [
    {
      id: 'f-ras-real',
      statement: 'The reticular activating system is REAL and it really does gate what reaches your awareness: a brain-stem network that regulates arousal and alertness and filters incoming sensory signals so the cortex is not overwhelmed. Attention genuinely is selective — that part of the video is not woo.',
      status: 'documented',
      sources: [
        { title: 'Arousal — Revisiting the Reticular Activating System', publisher: 'Science (AAAS)', url: 'https://www.science.org/doi/10.1126/science.272.5259.225', asOf: '2026-08-10' },
        { title: 'Reticular Activating System — an overview', publisher: 'ScienceDirect Topics', url: 'https://www.sciencedirect.com/topics/veterinary-science-and-veterinary-medicine/reticular-activating-system', asOf: '2026-08-10' },
      ],
      note: 'What is documented: arousal, alertness, sensory gating, attention. What is NOT documented: that its “only job” is to filter reality according to your dominant belief, or that attention summons outcomes.',
    },
    {
      id: 'f-ibm-real',
      statement: 'Identity-based motivation is a real, published theory (Daphna Oyserman, University of Southern California): people prefer actions that fit who they currently feel themselves to be, and interpret difficulty through that identity — and it has been tested in actual school interventions in Detroit, Chicago, Singapore and England.',
      status: 'documented',
      sources: [
        { title: 'Identity-Based Motivation and the Motivational Consequences of Difficulty', publisher: 'Social and Personality Psychology Compass (Oyserman, 2024)', url: 'https://compass.onlinelibrary.wiley.com/doi/10.1111/spc3.70028', asOf: '2026-08-10' },
      ],
      note: 'So “act like the person you intend to become” has real support as a MOTIVATION mechanism — how a self-concept shapes behavior. That is a claim about you. It is not a claim about the universe rearranging itself.',
    },
    {
      id: 'f-quantum-not-that',
      statement: 'The “collapsing the wave / your belief selects the timeline” claim is NOT what quantum mechanics says. In physics, “observation” means a physical interaction — a measuring device, or even an air molecule — and decoherence explains the outcome; consciousness is not required, and the consciousness-causes-collapse hypothesis has been argued to be internally inconsistent in the peer-reviewed literature.',
      status: 'documented',
      sources: [
        { title: 'The Dead-Alive Physicist experiment: a case-study disproving the hypothesis that consciousness causes the wave-function collapse', publisher: 'arXiv (peer-review preprint)', url: 'https://arxiv.org/pdf/2006.06368', asOf: '2026-08-10' },
        { title: 'Quantum measurements are physical processes (comment on consciousness and the double slit)', publisher: 'arXiv', url: 'https://arxiv.org/pdf/1207.0804', asOf: '2026-08-10' },
      ],
      note: 'This one is not “contested” — it is a misuse of a technical word. Borrowed physics vocabulary is one of the most common ways a spiritual claim buys credibility it has not earned.',
    },
    {
      id: 'f-goddard-doctrine',
      statement: 'Neville Goddard’s system is not neutral technique with a Christian accent. Its own teachers state the foundation plainly: that human imagination IS God — “the eternal body of man is the imagination, that is, God himself” — and that the creative power other traditions place in an external God is inside you.',
      status: 'documented',
      sources: [
        { title: 'Imagination in Neville Goddard’s Teachings (word study)', publisher: 'mynevillegoddard.com', url: 'https://mynevillegoddard.com/word-studies/imagination', asOf: '2026-08-10' },
        { title: 'The Law of Assumption: Neville Goddard’s Hidden Code', publisher: 'The Universe Unveiled', url: 'https://www.theuniverseunveiled.com/law-of-assumption-neville-goddard/', asOf: '2026-08-10' },
      ],
      note: 'Cited from the teaching’s OWN advocates, not from critics — so no one can say it was strawmanned. This is what makes it a doctrine question and not a productivity question.',
    },
  ],
  interpretation: [
    { id: 'n-true-doorway', statement: 'The real science is the DOORWAY, not the message. Selective attention and identity-shaped behavior are true; they are used to make a much larger claim — that reality reorganizes around your assumption — which neither of them supports. Keep the doorway; refuse what is being carried through it.', restsOn: ['f-ras-real', 'f-ibm-real'] },
    { id: 'n-verse-inverted', statement: 'Isaiah 46:10 is quoted accurately and applied backwards. Read the whole sentence: the thing declared from the beginning is “MY counsel shall stand, and I will do all my pleasure” — the finished work is YAHWEH’S purpose, in a passage whose entire point (v.9) is that He alone is God and there is none like Him. The video turns a verse about His sovereignty into a promise about our preferred outcome, which is the exact reverse of what it says.', restsOn: ['f-goddard-doctrine'] },
    { id: 'n-two-different-things', statement: 'Acting in faith and “assuming the wish fulfilled” look alike from outside and are opposite inside. Faith rests on a PROMISE SOMEONE ELSE MADE and can therefore say “if the Lord will”; assumption rests on my own decree and cannot say it — there is no one else in the room to defer to.', restsOn: ['f-goddard-doctrine'] },
  ],
  perspectives: [
    { id: 'p-teacher', label: 'The teaching’s view (steelmanned)', heldBy: 'the video’s creator and Law-of-Assumption teachers', steelman: 'At its strongest: most people are paralyzed by lack — they rehearse what they do not have, act like the person who does not have it, and get exactly that. Deciding to behave as the person you intend to become is genuinely powerful; it changes what you notice, what you attempt, and what you tolerate. Millions have found more courage in that framing than in years of anxious waiting, and it costs nothing to try.' },
    { id: 'p-psych', label: 'The careful-science view', heldBy: 'researchers in attention and motivation', steelman: 'At its strongest: the mechanisms named are real but modest and INTERNAL. Selective attention makes you notice more opportunities; identity-congruence makes you act more consistently. Both are about the person, not the cosmos. Overclaiming them into “reality rearranges for you” is unfalsifiable, and it quietly blames the sick and the poor for not believing correctly — which the actual research never says.' },
    { id: 'p-word', label: 'The believer’s view', heldBy: 'Scripture', steelman: 'At its strongest: Yahweh is not a force inside you to be operated; He is a Person to be asked. “I am the LORD, and there is none else, there is no God beside me” (Isaiah 45:5). He tells us to bring the request — “in every thing by prayer and supplication with thanksgiving let your requests be made known unto God” (Philippians 4:6) — and He answers according to His will, not our decree (1 John 5:14). That is not weaker than assumption; it is safer than assumption, because it means the outcome is filtered by someone wiser than me. And it gives what manifesting cannot: a Father who is with you when the answer is no, or not yet.' },
    { id: 'p-pastoral', label: 'The pastoral-concern view', heldBy: 'many believers who have watched this teaching up close', steelman: 'At its strongest: the harm is not in the vision-boarding, it is in what happens when the outcome does not come. Under a law of assumption the only possible explanation for an unhealed body or an empty account is that YOU did not believe correctly — so grief becomes guilt, and the sufferer is left alone with a failure verdict. The Word puts a Comforter in that exact room instead.' },
  ],
  lens: {
    fourD: {
      deepSource: 'WORD FIRST, on the very verse the video borrows. Yahweh says: “Remember the former things of old: for I am God, and there is none else; I am God, and there is none like me,” and then, in the same breath, “Declaring the end from the beginning, and from ancient times the things that are not yet done, saying, My counsel shall stand, and I will do all my pleasure” (Isaiah 46:9-10). Read it slowly: the end that is declared is HIS, the counsel that stands is HIS, the pleasure that is done is HIS. The passage is a claim of exclusive sovereignty — “I am the LORD, and there is none else, there is no God beside me” (Isaiah 45:5) — and the teaching flips it into a promise that MY preferred outcome is already finished and merely awaits my confidence. That is not a small misreading; it is the oldest one. “Ye shall be as gods” (Genesis 3:5) is the first recorded offer of divinity-by-self-assumption, and Romans names where it ends: men “worshipped and served the creature more than the Creator” (Romans 1:25). Paul warns exactly this shape: “Beware lest any man spoil you through philosophy and vain deceit, after the tradition of men, after the rudiments of the world, and not after Christ” (Colossians 2:8) — a system built of real-sounding parts that is simply not after Christ. And the instruction the video gives — stop praying for it — is the one thing the Word will not allow: “Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God” (Philippians 4:6). Asking is not lack-consciousness; asking is relationship. The confidence He offers is better than assumption because it has Him in it: “if we ask any thing according to his will, he heareth us” (1 John 5:14). Even the verse that sounds closest to the teaching — “What things soever ye desire, when ye pray, believe that ye receive them, and ye shall have them” (Mark 11:24) — opens two verses earlier with the words that decide its meaning: “Have faith in God” (Mark 11:22). Faith IN GOD, not faith in faith. And Scripture keeps the creature honest about tomorrow: “ye know not what shall be on the morrow” — therefore “ye ought to say, If the Lord will, we shall live, and do this, or that” (James 4:14-15). “A man’s heart deviseth his way: but the LORD directeth his steps” (Proverbs 16:9). The desire is not the enemy. The order is the issue: “But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you” (Matthew 6:33).',
      scripture: 'Isaiah 46:9-10; Isaiah 45:5; Genesis 3:5; Romans 1:25; Colossians 2:8; Philippians 4:6; 1 John 5:14; Mark 11:22,24; James 4:14-15; Proverbs 16:9; Matthew 6:33; 2 Corinthians 10:5; Hebrews 11:1',
    },
    threeD: 'Practically, keep three things and refuse one. KEEP: (1) attention is real — what you rehearse is what you will notice, so rehearse His promises instead of your fears; (2) identity drives action — and the believer already HAS a given identity to act from, bought and named, which is sturdier than one you assume; (3) preparation is faith-shaped — Noah built before the rain, Hebrews calls faith “the substance of things hoped for, the evidence of things not seen” (Hebrews 11:1), so acting ahead of the evidence is not the error. REFUSE: the instruction to stop asking. Bring the request, name it plainly, add thanksgiving, and hand the outcome to a Father who reserves the right to answer better than you asked. And do the mental work the Word actually assigns — “Casting down imaginations… and bringing into captivity every thought to the obedience of Christ” (2 Corinthians 10:5) — which is the opposite of enthroning imagination.',
    accountability: {
      statement: 'ACCOUNTABILITY, both directions. Teachers carry weight for what they hand people about God — the Word treats teaching as a heavier office, and every word spoken is accounted for (Matthew 12:36) — and a system that can only explain unanswered prayer by blaming the sufferer’s belief does measurable harm to the sick and the grieving. AND the hearer is accountable too: we are told to try what we are handed, not to swallow it because it is comforting and quotes a verse. Both courts stand here as everywhere: this life weighs a teaching by its fruit, imperfectly and slowly, while the eternal court misses nothing — “For God shall bring every work into judgment, with every secret thing, whether it be good, or whether it be evil” (Ecclesiastes 12:14). This lesson puts no one in that court; it belongs to Yahweh alone, who alone sees the heart (Jeremiah 17:9).',
      scripture: 'Matthew 12:36; Ecclesiastes 12:14; Colossians 2:8; Jeremiah 17:9',
    },
    benefits: [
      'Both courts held honestly: in this life a teaching is weighed slowly and imperfectly by its fruit — some harm is never named here — while the eternal court misses nothing, for “God shall bring every work into judgment, with every secret thing” (Ecclesiastes 12:14). That frees you to weigh a teaching without appointing yourself anyone’s judge.',
      'You keep the true parts — selective attention and identity-shaped action are real, and both are usable within the Word without borrowing a false god.',
      'You are freed from the cruelest clause in manifestation teaching: that an unanswered prayer is proof you did not believe hard enough.',
      'You get a Person instead of a mechanism — someone to ask, and someone present when the answer is no or not yet.',
      'You gain the skill of spotting the doorway move: a true thing used to carry an untrue one in behind it.',
      'You learn to read a borrowed verse in its own sentence — the single habit that would have caught this whole teaching in ten seconds.',
      'You keep desire without idolatry: seek first the Kingdom, and the added things stay added things.',
    ],
    graceNote: 'No condemnation is being handed to anyone here — not to Neville Goddard, who is long dead and whose account belongs to Yahweh alone, not to the teacher in the video, and least of all to the believer who has been practicing this. Many who follow this teaching are hungry for hope and were never given a better frame; that hunger is honest. We weigh the teaching, not the person. If you have prayed this way, nothing is broken between you and Yahweh — “in every thing by prayer and supplication with thanksgiving let your requests be made known unto God” is an open door, today.',
    stewardship: 'The durable move is not a vision board and not cynicism: it is asking plainly and building faithfully. Write the desire down as a REQUEST, not a decree. Add thanksgiving. Do the next real thing your hands find — the preparation faith always does — and hold the timing loosely with “if the Lord will.” Then rehearse His promises the way the teaching told you to rehearse your outcome; that is the attention mechanism, aimed where it belongs.',
    anchor: { ref: 'Isaiah 46:9-10', theme: 'He declares the end from the beginning — and the counsel that stands is HIS. The finished work is Yahweh’s purpose, not our preferred outcome.' },
  },
  reflection: {
    skill: 'When a teaching mixes real science, a real verse, and a claim about God: sort the three before you accept or reject any of it. (1) What here is documented? Keep it and say so. (2) What is borrowed vocabulary doing work it cannot do? Name it. (3) What is being said about GOD — and does the verse quoted actually say that, in its own sentence? Read one verse up and one verse down. That single habit catches most of it.',
    practice: 'Take the video’s proof text and read Isaiah 46:9-10 out loud in full, then answer in one sentence: whose end, whose counsel, whose pleasure? Then take one desire you have been trying to “assume,” and instead write it as a request in the Philippians 4:6 shape — the ask, plainly stated, with thanksgiving — and one real next step your hands can do this week.',
    prompts: [
      'The video says the biggest mistake is looking FOR an answer. Philippians 4:6 says to make requests known. Which of those two describes how you have actually been praying?',
      'Read Isaiah 46:9-10 in full. Whose end is being declared, and whose counsel stands? What changes when you read the second half of verse 10?',
      'What in this teaching is genuinely true and worth keeping? Say it plainly — pretending nothing in it is true is its own failure of discernment.',
      'Neville Goddard taught that human imagination IS God. If that is the foundation, can the technique be separated from it? Why or why not?',
      'Under this teaching, what does an unanswered prayer mean about the person praying? What does Scripture put in that room instead?',
      'Where else have you seen a true fact used as the doorway for an untrue claim — an ad, a headline, a sermon?',
    ],
  },
  levels: {
    child: 'Some videos say that if you just imagine really hard that you already have something, you can make it happen by yourself. Here is what IS true: what you think about a lot is what you start to notice, and acting like the kind of person you want to be really does help you do good things. But here is the big part they got backwards: God is not a power inside you that you turn on. He is a Person who loves you, and He wants you to ASK Him — the Bible says to tell God what you need and say thank You (Philippians 4:6). He knows the whole story from the beginning to the end, and His plan is a good one. So dream big, work hard, and ask your Father. You are not alone, and you do not have to make the world obey you.',
    teen: 'Straight talk, because this one is everywhere on your feed. What is REAL in it: your attention system (the RAS) genuinely filters what you notice, and identity-based motivation is a real published theory — you act like whoever you think you are. Keep both. What is NOT real: the “quantum purple timeline” part. In physics, “observation” means a physical interaction — even an air molecule counts — and belief does not select a timeline; that is borrowed vocabulary doing work it cannot do. And the deepest part, the part they usually skip: Neville Goddard taught that YOUR IMAGINATION IS GOD. That is the whole foundation, and it is the oldest offer in the book — “ye shall be as gods” (Genesis 3:5). Now the verse they quote: “God declares the end from the beginning.” Read the rest of the sentence — “My counsel shall stand, and I will do all my pleasure” (Isaiah 46:10). It is HIS end and HIS counsel, in a chapter that exists to say He alone is God. They turned a verse about His authority into a promise about your wish list. And their main instruction — stop praying for it — is the exact thing Scripture tells you to do: “in every thing by prayer and supplication with thanksgiving let your requests be made known unto God” (Philippians 4:6). Asking is not weakness. Asking is relationship. So: rehearse His promises instead of your fears, act like who He already says you are, work like it matters — and bring the ask to your Father, who answers according to His will (1 John 5:14) and stays with you when the answer is not yet.',
    senior: 'This teaching deserves careful weighing rather than a reflex, because it is built the way the most effective error is always built: true parts holding an untrue center. Grant the true parts without flinching — the reticular activating system does gate attention and arousal, and identity-based motivation is a genuinely published, field-tested theory that people act in ways congruent with the self they hold. A believer can use both, and Scripture already assigns that work: rehearse His promises, and act from the identity He has given rather than one you assume. Then name the two failures precisely. First, the borrowed physics: “collapsing the wave” does not mean belief selects a reality — observation in quantum mechanics is a physical interaction, decoherence does the explaining, and the consciousness-causes-collapse hypothesis has been argued in the literature to be inconsistent. Second, and far weightier, the doctrine: this system’s own teachers state that human imagination IS God. That is not a Christian technique with unusual vocabulary; it is the ancient inversion — “ye shall be as gods” (Genesis 3:5), the creature served “more than the Creator” (Romans 1:25) — and Paul’s warning fits it exactly: “Beware lest any man spoil you through philosophy and vain deceit… and not after Christ” (Colossians 2:8). The misused verse is the hinge. Isaiah 46:10 does say “Declaring the end from the beginning,” and then finishes the thought: “saying, My counsel shall stand, and I will do all my pleasure,” inside a passage whose stated purpose is that He alone is God (46:9; 45:5). The end that is finished is His, not ours. Which is better news than the teaching offers, not worse: our part is to ask — “in every thing by prayer and supplication with thanksgiving let your requests be made known unto God” (Philippians 4:6) — with confidence resting on His will rather than our certainty (1 John 5:14), holding tomorrow as He tells us to hold it, “If the Lord will” (James 4:15). Faith still acts ahead of sight; it is “the substance of things hoped for, the evidence of things not seen” (Hebrews 11:1). The difference is simply that faith has a Person on the other end of it — one who answers, sometimes differently and better, and who stays present when He answers no.',
  },
  quiz: {
    questions: [
      { q: 'Isaiah 46:10 says the end is declared from the beginning. Whose end and whose counsel does the verse itself name?', options: ['The believer’s preferred outcome, already finished', 'Yahweh’s own counsel — “My counsel shall stand, and I will do all my pleasure”', 'Any outcome you assume with enough feeling'], answer: 1, explain: 'Read the whole sentence: the finished work in that passage is His purpose, in a chapter whose point is that He alone is God (46:9).' },
      { q: 'What is genuinely TRUE in the video’s science?', options: ['Belief collapses a quantum wave and selects your timeline', 'Attention is selective (the RAS is real) and identity shapes action (a published theory)', 'Nothing in it is true'], answer: 1, explain: 'Both mechanisms are real and internal — about you, not about the cosmos rearranging. Keep the true parts; refuse the overclaim.' },
      { q: 'The teaching says to stop praying FOR what you want. What does Scripture say to do with a request?', options: ['Stop asking; assume it is done', 'Make it known — “in every thing by prayer and supplication with thanksgiving let your requests be made known unto God”', 'Never desire anything'], answer: 1, explain: 'Philippians 4:6. Asking is relationship, not lack-consciousness — and 1 John 5:14 puts the confidence in His will rather than our certainty.' },
    ],
  },
};

// =============================================================================
// ISSUE 10 — "Victorious Emotions": identity, emotions-as-indicators, frequencies, angels
// =============================================================================
// Darrell handed in a video summary 2026-08-14, then a second pass focused on
// the emotions material. Weighed on the DR-0288 pattern: three tiers (DR-0100),
// the Word answers the claim about God (DR-0098), the reasoning across verses is
// as accountable as the quotation (DR-0281), and a GRACE NOTE condemning no one.
//
// This is the SAME CLASS as issue 9, recurring with a different vocabulary: a
// true thing used as the doorway for an untrue one. Issue 9's doorway was the
// RAS; this one's doorway is a genuinely strong pastoral insight — that emotions
// expose what you actually believe. The thing carried through the doorway is the
// same in both: the creature quietly promoted toward the Creator's place.
//
// EVERY Scripture fragment below is VERBATIM from the repo's own KJV
// (app/public/bible/kjv), fetched not recalled (DR-0076), and pinned in
// world-issues-verse-integrity.test.js. "God"/"the LORD" inside a quotation are
// reproduced exactly and NEVER overwritten with "Yahweh" (DR-0076 bright line).
const VICTORIOUS_EMOTIONS_ISSUE = {
  id: 'wi-victorious-emotions',
  title: '“Emotions Reveal What You Believe”: Identity, Frequencies, Angels, and Where a True Insight Stops Being True',
  subject: {
    name: 'Teaching on identity as a new creation, emotions as belief-indicators, spiritual “frequencies,” and interaction with angels, as presented by Wendy Backlund in a long-form interview',
    kind: 'spiritual teaching / Christian-living claim',
    isNamedRealPerson: true,
  },
  skill: 'Sort a teaching that is MOSTLY right. This is harder than sorting one that is mostly wrong, because the true parts earn trust that the untrue parts then spend. Learn to keep a genuine pastoral insight, name an imported vocabulary doing work it cannot do, and let the Word answer the one claim that touches who God is — without throwing away the teacher or the believer who has been helped.',
  source: {
    creator: 'Wendy Backlund (author, Igniting Faith / Victorious Emotions), interviewed by Taylor Welch',
    medium: 'long-form video interview (summary handed in)',
    title: 'Interview on identity, emotions, and the unseen realm',
    url: '',
    asOf: '2026-08-14',
    note: 'Handed in by Darrell 2026-08-14 as a summary, in two passes. We weigh the TEACHING. We condemn no teacher, and no believer who has prayed this way and found comfort in it.',
  },
  claims: [
    { id: 'c-apathy-identity', text: 'Many believers live in apathy because they were never taught to live as resurrected beings — they see themselves as "only human" rather than as new creations.', label: 'claim', attribution: 'Wendy Backlund', note: 'The diagnosis is substantially scriptural and is the strongest thing in the teaching. Kept below.' },
    { id: 'c-emotions-reveal', text: 'Your emotions are a direct reflection of what you truly believe about God’s nature and your identity in Him; being constantly bothered by things God is not bothered by reveals a disconnect.', label: 'claim', attribution: 'Wendy Backlund', note: 'A real pastoral insight with real Scripture behind it — and it needs one guardrail the teaching does not supply. Both handled below.' },
    { id: 'c-fix-belief-not-behavior', text: 'We try to fix behaviour and emotions without addressing the underlying belief; change the belief and the response changes.', label: 'claim', attribution: 'Wendy Backlund', note: 'Directly parallel to Romans 12:2. Kept.' },
    { id: 'c-godlike', text: 'Because the living God dwells within us, we are capable of "godlike" power.', label: 'claim', attribution: 'Wendy Backlund (as summarized)', note: 'This is the sentence the Word answers. The indwelling is true; the conclusion drawn from it is the oldest inversion in Scripture.' },
    { id: 'c-frequency', text: 'Life can be understood in terms of frequencies and wavelengths; bitterness or fear shifts your spiritual frequency, and shifting focus to God’s nature changes your internal state "and, consequently, your external reality."', label: 'claim', attribution: 'Wendy Backlund', note: 'Two different claims wearing one sentence. The inner half is close to Scripture; the "consequently, your external reality" half is not, and "frequency" is not a biblical category.' },
    { id: 'c-transactional-prayer', text: 'Many pray from neediness or as a "transaction" because they believe God is distant; emotions reveal whether you operate from separation or from oneness with Christ.', label: 'claim', attribution: 'Wendy Backlund', note: 'Half of this is a genuine and needed corrective. The other half collides with what Scripture actually invites.' },
    { id: 'c-angels', text: 'Believers should interact with angels as messengers and part of God’s government, and should not bypass this "spiritual army" out of fear.', label: 'claim', attribution: 'Wendy Backlund', note: 'Angels are real and serve. Seeking interaction with them is the specific thing Colossians warns about by name.' },
    { id: 'c-spirit-over-body', text: 'People let the body dictate how the spirit functions (too sick or tired to engage); by building identity as a spirit-being, the divine health of the spirit can gain preeminence and sustain the body instead of the reverse. Thoughts and expectations act "like a placebo or faith" and affect physical reality.', label: 'claim', attribution: 'Wendy Backlund', note: 'The most consequential claim in the teaching, and the one with a known casualty list. Answered below by what happened to Paul and to the people he loved.' },
    { id: 'c-practices', text: 'Practices: quiet the natural mind; rehearse past encounters with God rather than failures; train the brain to ask your spirit questions ("Where are the angels?", "What does it feel like to be light?"), treating the mind as a student of the spirit; use worship to get the mind out of its natural habitat; choose to "become" peace or light and emanate a frequency that changes the atmosphere.', label: 'claim', attribution: 'Wendy Backlund', note: 'A mixed bag that must be sorted item by item — two of these are straight out of the Psalms, and two are the named error.' },
    { id: 'c-become-light', text: 'God told her to stop using words when praying for others and instead learn to "become light" to chase away darkness.', label: 'claim', attribution: 'Wendy Backlund (a personal experience she recounts)', note: 'Labeled as her personal experience, not as doctrine she derives from a text — which is exactly why the Word, not our opinion, has to answer it.' },
  ],
  verifiable: [
    {
      id: 'f-new-creature',
      statement: 'The identity claim is straightforwardly biblical. "Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new" (2 Corinthians 5:17, KJV). "Christ in you, the hope of glory" (Colossians 1:27). "What? know ye not that your body is the temple of the Holy Ghost which is in you, which ye have of God, and ye are not your own?" (1 Corinthians 6:19). "Beloved, now are we the sons of God" (1 John 3:2).',
      status: 'documented',
      sources: [{ title: 'KJV, hosted in-app (public domain)', publisher: 'app/public/bible/kjv', url: '', asOf: '2026-08-14' }],
      note: 'A believer who lives as "only human" IS living below what Scripture says is true of them. That part of the teaching is not hype; it is the text.',
    },
    {
      id: 'f-belief-drives-behaviour',
      statement: 'Scripture puts the lever exactly where the teaching puts it — on the mind and the heart, not on behaviour management. "And be not conformed to this world: but be ye transformed by the renewing of your mind" (Romans 12:2, KJV). "Keep thy heart with all diligence; for out of it are the issues of life" (Proverbs 4:23). "for of the abundance of the heart his mouth speaketh" (Luke 6:45).',
      status: 'documented',
      sources: [{ title: 'KJV, hosted in-app (public domain)', publisher: 'app/public/bible/kjv', url: '', asOf: '2026-08-14' }],
      note: 'Emotions as a readout of underlying belief is a fair reading of these. This is the teaching at its best.',
    },
    {
      id: 'f-heart-not-infallible',
      statement: 'The guardrail the teaching does not supply: the heart is not a reliable instrument for reading itself. "The heart is deceitful above all things, and desperately wicked: who can know it?" (Jeremiah 17:9, KJV). And Scripture models speaking TO the feeling rather than treating it as a verdict: "Why art thou cast down, O my soul? and why art thou disquieted within me? hope thou in God" (Psalm 42:11).',
      status: 'documented',
      sources: [{ title: 'KJV, hosted in-app (public domain)', publisher: 'app/public/bible/kjv', url: '', asOf: '2026-08-14' }],
      note: 'This matters pastorally. "Your emotions reveal your beliefs about God" becomes cruel if a grieving or depressed or chemically-ill believer reads their feelings as a spiritual audit. Psalm 42 has the man addressing his soul, not diagnosing his doctrine.',
    },
    {
      id: 'f-angels-serve',
      statement: 'Angels are real and they serve: "Are they not all ministering spirits, sent forth to minister for them who shall be heirs of salvation?" (Hebrews 1:14, KJV). AND Scripture names the specific error of seeking them: "Let no man beguile you of your reward in a voluntary humility and worshipping of angels, intruding into those things which he hath not seen, vainly puffed up by his fleshly mind" (Colossians 2:18). When John tried it, the angel refused: "See thou do it not: for I am thy fellowservant... worship God" (Revelation 22:9).',
      status: 'documented',
      sources: [{ title: 'KJV, hosted in-app (public domain)', publisher: 'app/public/bible/kjv', url: '', asOf: '2026-08-14' }],
      note: 'Both halves are the text. Angels exist and serve; seeking to interact with them is the named error, and "intruding into those things which he hath not seen" is a precise description of the practice.',
    },
    {
      id: 'f-apostles-stayed-sick',
      statement: 'The New Testament records apostolic-era believers who stayed sick, and an apostle who could not fix it. Paul asked three times and was refused: "My grace is sufficient for thee: for my strength is made perfect in weakness" (2 Corinthians 12:9, KJV). He prescribed MEDICINE, not a faith adjustment: "use a little wine for thy stomach’s sake and thine often infirmities" (1 Timothy 5:23). He left a companion behind: "Trophimus have I left at Miletum sick" (2 Timothy 4:20). And Epaphroditus "was sick nigh unto death: but God had mercy on him; and not on him only, but on me also, lest I should have sorrow upon sorrow" (Philippians 2:27) — Paul plainly says he would have grieved.',
      status: 'documented',
      sources: [{ title: 'KJV, hosted in-app (public domain)', publisher: 'app/public/bible/kjv', url: '', asOf: '2026-08-14' }],
      note: 'If a mature spirit-identity made the spirit’s health preeminent over the body, Paul is the counter-example the Word itself supplies — and he calls his own weakness the place the power rests, not the thing to be trained away.',
    },
    {
      id: 'f-still-dying',
      statement: 'Scripture states the boundary directly: "dust thou art, and unto dust shalt thou return" (Genesis 3:19, KJV); "it is appointed unto men once to die" (Hebrews 9:27); "though our outward man perish, yet the inward man is renewed day by day" (2 Corinthians 4:16); "if our earthly house of this tabernacle were dissolved, we have a building of God" (2 Corinthians 5:1).',
      status: 'documented',
      sources: [{ title: 'KJV, hosted in-app (public domain)', publisher: 'app/public/bible/kjv', url: '', asOf: '2026-08-14' }],
      note: 'The Word gives the inward man ascendancy while the outward man PERISHES — the opposite direction from spirit-sustains-body. The hope is a new house, not a maintained one. This is DR-0288’s recorded frame: care of a tent, not a cure for mortality.',
    },
    {
      id: 'f-placebo-real-bounded',
      statement: 'The placebo effect is real and documented — and bounded. It reliably moves SUBJECTIVE and self-reported outcomes (pain, nausea, fatigue) and some symptom measures; it does not shrink tumours, clear infections, or reverse organic disease. "Expectation affects how you feel" is established; "expectation reorganizes your physiology" is not.',
      status: 'documented',
      sources: [
        { title: 'Placebos without Deception: A Randomized Controlled Trial in Irritable Bowel Syndrome', publisher: 'PLoS ONE (Kaptchuk et al.)', url: 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0015591', asOf: '2026-08-14' },
        { title: 'Placebo effects in medicine', publisher: 'New England Journal of Medicine (Kaptchuk & Miller, 2015)', url: 'https://www.nejm.org/doi/full/10.1056/NEJMp1504023', asOf: '2026-08-14' },
      ],
      note: 'The teaching invokes placebo as proof that expectation shapes physical reality. Placebo is exactly the wrong witness for that: its documented power is over the EXPERIENCE of symptoms, which is precisely the line the claim needs to cross and cannot.',
    },
    {
      id: 'f-remembering-and-worship-are-commanded',
      statement: 'Two of the practices are straight out of the text. Rehearsing God’s past acts: "I will remember the works of the LORD: surely I will remember thy wonders of old" (Psalm 77:11, KJV). Worship shifting an inner state: "David took an harp, and played with his hand: so Saul was refreshed, and was well" (1 Samuel 16:23). And the fixed-focus promise: "Thou wilt keep him in perfect peace, whose mind is stayed on thee" (Isaiah 26:3).',
      status: 'documented',
      sources: [{ title: 'KJV, hosted in-app (public domain)', publisher: 'app/public/bible/kjv', url: '', asOf: '2026-08-14' }],
      note: 'These need no defending and no new vocabulary. They are commanded, and they are the best material in the teaching.',
    },
    {
      id: 'f-frequency-not-biblical',
      statement: '"Frequency" and "wavelength" as descriptions of a spiritual state are not biblical categories and not physics claims either — they are New Thought vocabulary. Scripture describes the inner life in terms of heart, mind, spirit, conscience and will, and it never teaches that an internal state alters external reality.',
      status: 'documented',
      sources: [{ title: 'KJV, hosted in-app (public domain)', publisher: 'app/public/bible/kjv', url: '', asOf: '2026-08-14' }],
      note: 'The inner half of the claim ("bitterness shifts something in you") is near Proverbs 4:23 and can be kept in plain words. The outer half ("and consequently your external reality") is the import, and it is the same engine as issue 9.',
    },
  ],
  interpretation: [
    { id: 'n-true-doorway-again', statement: 'Same move as issue 9, different doorway. There the doorway was the reticular activating system; here it is a genuinely good pastoral insight — that emotions expose what you actually believe. The doorway is sound. What gets carried through it is identical in both: the creature quietly promoted toward the Creator’s place. Keep the doorway; refuse the cargo.', restsOn: ['f-belief-drives-behaviour', 'f-new-creature'] },
    { id: 'n-indwelt-not-deified', statement: 'The distinction the whole issue turns on: INDWELT is not DEIFIED. "Christ in you" (Colossians 1:27) is the glory; "ye shall be as gods" (Genesis 3:5) is the lie that lost the garden, and "I will be like the most High" (Isaiah 14:14) is the sentence that lost heaven. Any teaching that moves from His presence in you to your godlike power has crossed from the first to the second, however warmly it is said.', restsOn: ['f-new-creature'] },
    { id: 'n-emotions-need-a-guardrail', statement: 'Emotions-as-indicator is true and incomplete. Held without Jeremiah 17:9, it hands a deceitful instrument the job of auditing your faith — and the believer most likely to run that audit is the one already exhausted. Psalm 42 shows the alternative: speak TO the soul ("hope thou in God"), do not take dictation from it.', restsOn: ['f-heart-not-infallible', 'f-belief-drives-behaviour'] },
    { id: 'n-prayer-inverted', statement: 'The corrective is half right and lands backwards. Praying to a God you think is distant IS a real problem, and "oneness with Christ" is real — "I am the vine, ye are the branches" (John 15:5). But asking is not the symptom of separation; it is the invitation. "in every thing by prayer and supplication with thanksgiving let your requests be made known unto God" (Philippians 4:6). "Let us therefore come boldly unto the throne of grace... in time of need" (Hebrews 4:16) — need is the stated occasion, not the disqualifier. "pour out your heart before him" (Psalm 62:8). A teaching that makes a believer ashamed of asking has removed the very thing Scripture commands. This is the same conclusion issue 9 reached about "stop praying for it," arrived at from a different direction.', restsOn: ['f-belief-drives-behaviour'] },
    { id: 'n-body-claim-has-casualties', statement: 'Spirit-sustains-body is where a mostly-right teaching becomes dangerous, and the Word supplies the refutation rather than our opinion: Paul asked three times and was told no (2 Corinthians 12:9), prescribed wine for a stomach (1 Timothy 5:23), left Trophimus sick (2 Timothy 4:20), and nearly lost Epaphroditus (Philippians 2:27). The direction Scripture actually gives is the reverse of the claim — the inward man is renewed WHILE the outward man perishes (2 Corinthians 4:16), until the tent is exchanged for a building (2 Corinthians 5:1). DR-0288 already recorded this as house doctrine: a body that does everything right and still suffers is not a body that failed to believe correctly.', restsOn: ['f-apostles-stayed-sick', 'f-still-dying'] },
    { id: 'n-placebo-wrong-witness', statement: 'Placebo is cited as proof and is the wrong witness. Its documented reach is over the EXPERIENCE of symptoms — pain, fatigue, nausea — not over organic disease. So it establishes exactly the modest claim ("what you expect changes how you feel") and none of the large one ("your internal state impacts your physical reality"). Borrowing its credibility to cross that line is the doorway move again, now wearing a lab coat.', restsOn: ['f-placebo-real-bounded'] },
    { id: 'n-practices-sorted', statement: 'Sort the practices rather than accepting or rejecting the set. KEEP: rehearsing God’s past works (Psalm 77:11 commands it), and worship to shift focus (1 Samuel 16:23; Isaiah 26:3) — both are text, both need no new vocabulary. REFUSE: "ask your spirit questions" — Scripture sends us to His Word and His Spirit, not to our own spirit as an oracle, and the heart that would answer is the one Jeremiah 17:9 calls deceitful; "try the spirits whether they are of God" (1 John 4:1) assumes an external standard, which is the Word. REFUSE: "Where are the angels?" — that is Colossians 2:18 almost verbatim, "intruding into those things which he hath not seen." The good half is commanded; the refused half is named.', restsOn: ['f-remembering-and-worship-are-commanded', 'f-angels-serve', 'f-heart-not-infallible'] },
    { id: 'n-words-are-the-weapon', statement: 'On "become light instead of using words": believers ARE light — "Ye are the light of the world" (Matthew 5:14) — but derivatively. Jesus said "I am the light of the world" (John 8:12). And the weapon named in the armour is not a state of being: "the sword of the Spirit, which is the word of God" (Ephesians 6:17). A practice that retires words in favour of a technique moves away from the one offensive weapon Scripture gives, and it is offered here on the authority of a private experience rather than a text.', restsOn: ['f-new-creature'] },
  ],
  perspectives: [
    { id: 'p-teacher', label: 'The teaching’s view (steelmanned)', heldBy: 'Wendy Backlund and identity-focused Christian teachers', steelman: 'At its strongest, and it is genuinely strong: the church has produced a great many believers who affirm the doctrine of the new birth and live as though nothing happened — defeated, passive, managing sin rather than walking in life. Telling those believers what Scripture actually says is true of them is not hype; it is pastoral rescue. And the observation that we attack behaviour while leaving the underlying belief untouched explains a great deal of failed Christian self-improvement. Many people have come out of real apathy through exactly this teaching, and they are not fools for it.' },
    { id: 'p-word-first', label: 'The Word-first view', heldBy: 'this platform’s own frame', steelman: 'At its strongest: everything true in the teaching is already in the text and does not need the extra vocabulary — new creature, Christ in you, temple, renewed mind, the heart as the wellspring. Since the true part is fully supplied by Scripture, the imported parts are carrying no load the Word was not already carrying, and they bring risk the Word does not. Keep the text; drop the import; nothing is lost.' },
    { id: 'p-pastoral-concern', label: 'The pastoral-concern view', heldBy: 'pastors and counsellors who see the aftermath', steelman: 'At its strongest: the person harmed by this is rarely the confident one. It is the widow whose grief gets read as a frequency problem, the believer on medication told their emotions reveal a doctrinal disconnect, the parent who stopped asking God for a sick child because asking felt like unbelief. A teaching should be weighed by what it does to the weakest person who receives it, and this one has a known failure mode there.' },
    { id: 'p-charitable-reading', label: 'The charitable reading', heldBy: 'those who know her work well', steelman: 'At its strongest: a summary is not the teaching. "Godlike" may be shorthand for delegated authority, not deity; "frequency" may be metaphor, not metaphysics; "become light" is recounted as a personal experience, not issued as a rule for others. It is entirely possible the fuller work carries guardrails a summary cannot show. Weighing a summary as though it were the whole is its own error — which is why what is weighed here is the CLAIM as stated, and the claim as stated is what a listener actually receives.' },
  ],
  lens: {
    fourD: {
      deepSource: 'WORD FIRST, on the one claim that touches who God is. Scripture states the indwelling as high as anyone could want it: "Christ in you, the hope of glory" (Colossians 1:27, KJV), "your body is the temple of the Holy Ghost which is in you" (1 Corinthians 6:19), "now are we the sons of God" (1 John 3:2). Nothing in the teaching’s identity claim needs to exceed that — and the moment it does, it lands on words Scripture has already assigned: "ye shall be as gods, knowing good and evil" (Genesis 3:5) and "I will be like the most High" (Isaiah 14:14). Those are the two occasions in the Word where a creature reaches for the Creator’s place, and both are catastrophes. The believer is a temple, not a deity; a branch, not the vine — "without me ye can do nothing" (John 15:5). That last clause is the whole answer to "godlike power," and it is Jesus’ own sentence.',
    },
    threeD: 'Three sorting questions for any teaching that feels mostly right. (1) Is the true part already fully supplied by the text? If yes, the extra vocabulary is carrying no weight and can go. (2) Does this teaching make asking God harder or easier? Philippians 4:6 and Hebrews 4:16 make asking the invitation; a teaching that shames the request has inverted something. (3) What does it do to the weakest person who hears it — the grieving, the ill, the exhausted? A frame that reads their feelings as a spiritual audit will wound exactly the people it meant to lift.',
    accountability: {
      statement: 'THE TWO COURTS, applied to TEACHING — which is a different case from a documented wrong, and must not be dressed up as one. No court is weighing Wendy Backlund, and neither are we. What Scripture does say is that teaching carries added weight: "My brethren, be not many masters, knowing that we shall receive the greater condemnation" (James 3:1). Every word taught about God enters the record that holds everything — "For God shall bring every work into judgment, with every secret thing, whether it be good, or whether it be evil" (Ecclesiastes 12:14) — and that record holds the courage and the comfort this teaching has genuinely given people just as surely as it holds where it overreached. WHAT A TEACHER OWES when a claim is shown to exceed the text: correction rather than defence, in the ordinary way any of us must. WHAT WE OWE, and this is the heavier half for a platform that weighs teachings: the Berean standard — "they received the word with all readiness of mind, and searched the scriptures daily, whether those things were so" (Acts 17:11) — readiness of mind FIRST, then the searching; not suspicion dressed as discernment. And restoration, not display: "Brethren, if a man be overtaken in a fault, ye which are spiritual, restore such an one in the spirit of meekness; considering thyself, lest thou also be tempted" (Galatians 6:1). Considering thyself is aimed at the one holding the scales. We are accountable for weighing a summary as though it were the whole work, for enjoying the finding, and for any believer discouraged by how we said it. If this issue leaves a reader more suspicious of teachers rather than more grounded in the Word, it has failed, and the failure is ours.',
      scripture: 'James 3:1; Ecclesiastes 12:14; Acts 17:11; Galatians 6:1',
    },
    benefits: [
      'Both courts, honestly held — and here they fall mostly on US, not on a teacher. Man\u2019s court never convenes over a teaching: no jury weighs a sermon, and a claim that wounds a sick believer leaves no docket entry. The ETERNAL court misses none of it (Ecclesiastes 12:14; Hebrews 9:27) \u2014 and it holds the comfort and courage this teaching has genuinely given people just as surely as where it overreached. That cuts toward humility in the weigher: teaching carries the greater condemnation (James 3:1), and so does weighing it badly.',
      'The hardest sorting skill there is: keeping a teaching that is MOSTLY right. Rejecting obvious error is easy; separating a true insight from the import riding behind it is the work.',
      'Protection for the weakest hearer \u2014 the grieving, the chronically ill, the believer on medication \u2014 from a frame that turns their body or their feelings into evidence against their faith.',
      'A settled confidence about identity that needs no inflation: new creature, Christ in you, a temple, a son. As high as it goes, and already in the text.',
      'Freedom to ASK. Philippians 4:6 and Hebrews 4:16 make need the occasion, not the disqualifier \u2014 recovering that is worth the whole lesson for anyone who quietly stopped asking.',
      'Two practices you can keep and start today, both commanded: rehearse what He has actually done (Psalm 77:11) and worship to shift your focus (1 Samuel 16:23; Isaiah 26:3).',
    ],
    stewardship: 'The stewardship here is of TRUST rather than money. A believer has limited attention and one life, and a teaching that is mostly right will spend the trust its true parts earn. Steward it by keeping what the text already supplies — new creature, Christ in you, temple, renewed mind, remembering His works, worship — and by refusing to pay for the extras with credibility the Word earned. Steward it also for the weakest hearer: the sick believer, the grieving one, the one on medication. Any frame that turns their body or their feelings into evidence against their faith is a debt charged to someone who cannot afford it.',
    graceNote: 'No condemnation is offered here — not of Wendy Backlund, not of Steve Backlund, not of anyone who has read Victorious Emotions and found real courage in it. The observation that many believers live far below what Scripture says is true of them is correct, and saying so is a service. Forty-eight years of marriage and a ministry built on encouragement are not nothing. What is weighed here is a set of CLAIMS as they were stated, not a person and not a heart — and the errors named are of the ordinary kind that any of us make when a real insight is stretched past the text that grounds it. "Judge not, that ye be not judged" governs the weigher as much as the weighed. If you have prayed the way this teaching describes, you were not being foolish; you were reaching for God, and He is not offended by the reach.',
  },
  reflection: {
    skill: 'When a teaching is MOSTLY right, the true parts buy trust that the untrue parts then spend. Sort it deliberately: (1) name what is straight from the text and keep it; (2) name the borrowed vocabulary and ask what work it is doing that the text was not already doing — if none, drop it; (3) find the single claim about GOD or about YOU-in-relation-to-God, and put it beside the verses that already speak to it, whole sentences, one up and one down.',
    practice: 'Take the sentence "we are capable of godlike power" and set it beside three verses read aloud in full: Colossians 1:27, Genesis 3:5, John 15:5. Then answer in one sentence what the difference is between INDWELT and DEIFIED. Second: think of one thing you have stopped asking God for because asking felt like unbelief — and ask Him for it today, out loud, per Philippians 4:6.',
  },
  levels: {
    child: 'Some teachers say that because God lives inside people who love Him, those people become almost like little gods with special powers. Here is what IS true, and it is amazing: if you belong to Jesus, God really does live in you, the Bible calls you His child, and it even calls your body a temple — a place where God stays. That is huge and it is real! But here is the part they got mixed up: you are the house, not the One who lives in it. Jesus said, "I am the vine, ye are the branches" — a branch grows fruit because it stays connected to the tree, not because the branch is the tree. And you never have to earn the right to ask God for things. The Bible says to tell God what you need and say thank You. Asking is not being greedy or weak. Asking is what children do with a good Father, and that is exactly what you are.',
    teen: 'This teaching gets a lot right and one big thing wrong, which makes it a great one to practise on. Right: your feelings usually show what you actually believe, not what you say you believe — and trying to fix behaviour without touching the belief underneath mostly fails. That is close to Romans 12:2. Wrong: "godlike power." God living in you is the highest thing the Bible says about you — and the Bible also gives the exact words for a creature reaching past that: "ye shall be as gods" (the garden) and "I will be like the most High" (Isaiah 14). One more thing worth catching: your feelings are evidence, not a verdict. Jeremiah says the heart is deceitful, and in Psalm 42 the writer TALKS TO his own sadness instead of obeying it. If you are grieving or depressed, that is not a report card on your faith.',
    adult: 'Weigh this one on the strength of its best parts, because they are strong: the diagnosis of practical apathy among believers who affirm the new birth and live defeated is accurate, and the insistence that belief sits underneath emotion is Romans 12:2 and Proverbs 4:23. Keep that. Then hold three things beside it. First, INDWELT is not DEIFIED — Colossians 1:27 is as high as it goes, and past it lie Genesis 3:5 and Isaiah 14:14. Second, emotions-as-indicator needs Jeremiah 17:9 or it becomes an audit run by a deceitful instrument on the most exhausted believer in the room; Psalm 42 speaks TO the soul rather than taking dictation from it. Third, the prayer correction lands backwards: Philippians 4:6 and Hebrews 4:16 make need the stated occasion for asking, not evidence of separation. The "frequency" vocabulary adds nothing the Word was not already carrying, and it is the same engine as the Law-of-Assumption issue — a true thing used as the doorway for an untrue one.',
  },
  quiz: {
    questions: [
      { q: 'What does Scripture actually say is true of a believer’s identity?', options: ['They become a god with godlike power', 'Christ dwells in them — "Christ in you, the hope of glory" — and their body is a temple', 'Nothing changes; "only human" is the whole story'], answer: 1, explain: 'Colossians 1:27 and 1 Corinthians 6:19 put it as high as it goes: indwelt, a temple, a son. The teaching is right that many live below this. "Godlike power" is the step past it, and Genesis 3:5 and Isaiah 14:14 are where that step is already recorded.' },
      { q: 'The teaching says emotions reveal what you believe about God. What guardrail does the Word add?', options: ['None — feelings are a reliable audit of faith', 'Jeremiah 17:9: the heart is deceitful; and Psalm 42 speaks TO the soul rather than obeying it', 'Emotions are irrelevant to belief'], answer: 1, explain: 'The insight is real — Proverbs 4:23 and Luke 6:45 put the wellspring in the heart. But without Jeremiah 17:9 it hands a deceitful instrument the job of grading your faith, which wounds the grieving and the ill first.' },
      { q: 'Is praying "from need" a sign of believing God is distant?', options: ['Yes — mature believers stop asking and live from the answer', 'No — need is the stated occasion: come boldly "in time of need," and "in every thing by prayer and supplication... let your requests be made known unto God"', 'Prayer does not matter either way'], answer: 1, explain: 'Hebrews 4:16 names need as the occasion; Philippians 4:6 says "in every thing." A teaching that makes a believer ashamed of asking has removed what Scripture commands — the same inversion Issue 9 reached from a different direction.' },
      { q: 'Angels: what do both halves of the text say?', options: ['Seek them out; they are an untapped army', 'They are "ministering spirits, sent forth to minister" AND Colossians 2:18 warns against "worshipping of angels, intruding into those things which he hath not seen"', 'Angels are symbolic'], answer: 1, explain: 'Hebrews 1:14 and Colossians 2:18 are both the text. And when John tried it, the angel said "See thou do it not... worship God" (Revelation 22:9).' },
      { q: 'What is the transferable skill from this issue?', options: ['Reject any teacher who gets one thing wrong', 'When a teaching is mostly right, sort it: keep what is straight from the text, drop vocabulary carrying no load, and put the claim about God beside whole verses', 'Accept teachings that feel encouraging'], answer: 1, explain: 'The true parts buy trust that the untrue parts then spend. Sorting is the skill — and it is done without condemning the teacher or the believer who was helped.' },
    ],
  },
};

export const WORLD_ISSUES = [MUSK_ISSUE, BEAUTY_SUPPLY_ISSUE, GAME_CHANGERS_ISSUE, PROPHETIC_LENS_ISSUE, MEDICAL_ESTABLISHMENT_ISSUE, AI_EMPIRE_ISSUE, PRISON_INDUSTRIAL_ISSUE, HISTORICAL_TRAUMA_ISSUE, LAW_OF_ASSUMPTION_ISSUE, VICTORIOUS_EMOTIONS_ISSUE];

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

// Tutor course-meta — the per-issue solo guide is a WORD-FIRST JUSTICE COACH:
// it states documented truth plainly (DR-0100), checks sources, hears every
// side fairly, and leaves the verdict on a soul to God — never muting deeds.
export const WORLD_ISSUES_TUTOR_META = {
  title: WORLD_ISSUES_META.title,
  intro: 'You are a calm, truth-speaking discernment coach for a Word-first track called "Thinking It Through: World Issues & Discernment."',
  posture: 'Guide ONE learner — who may be a child, a teen, an adult, or a seasoned believer — to think a charged real-world claim through the WORD’s way, matching your words and pace to their age. The moves: (1) identify each claim and who is making it; (2) LABEL it honestly — adjudicated finding, documented fact, unproven allegation, opinion, or call-to-action — and say the documented parts PLAINLY: a jury finding IS a verdict, and hedging proven harm into "no one knows" is false witness (Isaiah 5:20; Jeremiah 6:14); (3) check primary sources, with dates; (4) STEELMAN every side — hear the other side at its strongest before answering (Proverbs 18:17), and mark what it answers AND what it leaves standing; (5) then speak the Word’s justice the way Jesus speaks it: He named documented wrong to its face (Matthew 21:13), stood with the wronged (Luke 4:18), and measured repentance by restitution (Luke 19:8-9) — while the verdict on any SOUL belongs to God alone (Matthew 7:1-5; Romans 14:4), so never hand the learner a condemnation of a person’s heart, and never become a one-sided campaign against a named person. Cite Scripture by reference (ESV primary, KJV where the wording is the point); never invent or paraphrase a verse as if quoting it, and if you are unsure of a fact or a text, say so plainly rather than fabricate. Always point toward righteous engagement over outrage — accountability AND building.',
};
