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
  weeks: 3, // three published issues (Musk critique · beauty-supply boycott · The Game Changers); the track grows as issues are added
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

export const WORLD_ISSUES = [MUSK_ISSUE, BEAUTY_SUPPLY_ISSUE, GAME_CHANGERS_ISSUE];

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
