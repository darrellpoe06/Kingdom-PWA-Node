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
  weeks: 17, // seventeen published issues (Musk critique · beauty-supply boycott · The Game Changers · the prophetic-lens Musk video · the medical-establishment critique · the AI-empire journalism · the prison industrial complex · the two aftermaths · the law of assumption · victorious emotions · college tuition and the 1965 Act · the EPA power-plant rules · the SCOTUS mail-in ruling · the Kennedy Center · Evanston's reparations · the trades are hiring · biology walks back the selfish gene); the track grows as issues are added
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

// =============================================================================
// ISSUE 11 — "Wait, really? College was free until 1965." Darrell, 2026-09-15,
// pasted the transcript of a "Learning with Lindsay — Wait, Really?" video as
// build input ("Lesson"): colleges charged little or nothing under the land
// grants; the Higher Education Act of 1965 expanded federally guaranteed loans;
// tuition then rose enormously; and — the creator's reading — it rose because
// Black and brown students had just gained access. Handled under DR-0100's
// three tiers: the DOCUMENTED parts (the Morrill Acts, the HEA and its Title
// IV loan program, the 312% inflation-adjusted rise — the creator's own number,
// which matches the NCES-derived figure) are stated plainly; the CAUSAL claim
// is carried as the creator's interpretation, with the economists' competing
// explanations steelmanned; and the FRUIT — a generation paying through debt
// for what earlier generations largely did not — is judged by the Word
// regardless of anyone's motive. Word first: Yahweh's own economics of debt
// (release, jubile, no usury on the poor, the just weight) and Nehemiah 5 as the
// template. Subject is a law and a system, not a named person. Every quoted
// verse fetched verbatim from the repo KJV and gated in
// world-issues-verse-integrity.test.js. The transcript is cut off mid-sentence;
// only what it says is carried.
// =============================================================================
const TUITION_1965_ISSUE = {
  id: 'wi-tuition-and-the-1965-act',
  title: '"College was free until 1965" — Debt, Access, and the Word’s Economics',
  subject: { name: 'the Higher Education Act of 1965 and the cost of college', kind: 'policy-and-history', isNamedRealPerson: false },
  skill: 'Take a viral "wait, really?" history claim and learn how the Word weighs it: state the documented facts plainly (the land grants, the 1965 Act and its guaranteed-loan program, the 312% inflation-adjusted rise), label the creator’s causal reading as an interpretation and hear the economists’ explanations at their strongest (Proverbs 18:17), and then judge the FRUIT the way the Word judges it — debt as bondage, the just weight, and Yahweh’s remedy of release — whatever any lawmaker’s motive was.',
  source: {
    creator: 'Learning with Lindsay',
    medium: 'video',
    title: 'Wait, Really? — "College was free until 1965"',
    url: '',
    asOf: '2026-09-15',
    note: 'An educational short-form series ("Wait, Really?"). Darrell pasted the transcript on 2026-09-15; it is cut off mid-sentence, so only what it actually says is carried. We treat it as ONE creator’s argument — sourced and labeled — not as truth to repeat.',
  },

  // ---- STAGE 1 — THE CLAIM(S): the creator's points, AS MADE, each labeled. ----
  claims: [
    {
      id: 'c-free-before-1965',
      text: 'Because of the land grants of 1862 and 1890 and other federal acts, colleges charged little to nothing to attend — even the most renowned institutions were basically tuition-free.',
      label: 'claim',
      attribution: 'Learning with Lindsay (the creator), in the video',
      note: 'Partly documented: many PUBLIC land-grant colleges charged low or nominal tuition for decades. "Even the most renowned institutions" overstates it — elite private universities charged tuition long before 1965.',
    },
    {
      id: 'c-hea-1965',
      text: 'The Higher Education Act of 1965, part of the larger Civil Rights Act, expanded the student loan program.',
      label: 'claim',
      attribution: 'Learning with Lindsay (the creator), in the video',
      note: 'The Act and its Title IV Guaranteed Student Loan Program are documented. One precision: the HEA was a separate Great Society statute of the same era and purpose, not literally a part of the Civil Rights Act of 1964.',
    },
    {
      id: 'c-tuition-spike',
      text: 'In that same year, tuition appeared across the country and quickly spiked; institutions that had charged little or nothing since the 1860s suddenly charged higher and higher.',
      label: 'claim',
      attribution: 'Learning with Lindsay (the creator), in the video',
      note: 'The long-run rise is documented; the timing is compressed. Inflation-adjusted college costs rose only modestly through the 1960s; the steepest decade was the 1980s.',
    },
    {
      id: 'c-312-percent',
      text: 'Since the mid-60s tuition has climbed to 40 times what it once cost — adjusting for inflation, an increase of 312%.',
      label: 'claim',
      attribution: 'Learning with Lindsay (the creator), in the video',
      note: 'The 312% inflation-adjusted figure matches the NCES-derived number (312.4% since 1963) and is said plainly as fact. "40 times" is a nominal, unadjusted magnitude carried as the creator’s figure.',
    },
    {
      id: 'c-causation',
      text: 'College was basically free when most students were white; as soon as Black and brown students were given better access, tuition spiked and loans were issued so they now had to pay for what had been free.',
      label: 'opinion',
      attribution: 'Learning with Lindsay (the creator), in the video',
      note: 'The TIMING is real — wider access and the guaranteed-loan program arrived in the same era. The CAUSE is the creator’s interpretation: economists offer competing, documented explanations (Stage 2). The Word judges the fruit either way.',
    },
  ],

  // ---- STAGE 2 — VERIFIABLE vs INTERPRETATION ----
  verifiable: [
    {
      id: 'f-morrill',
      statement: 'The Morrill Act of 1862 let states found public colleges on federal land grants — 57 institutions, one per state or territory, in a system that in practice served white students. The Second Morrill Act of 1890 required states either to admit Black students to their 1862 institution or to establish a separate Black land-grant institution, and 19 historically Black land-grant universities (HBCUs) came from it.',
      status: 'documented',
      sources: [
        { title: 'Morrill Act (1862)', publisher: 'U.S. National Archives', url: 'https://www.archives.gov/milestone-documents/morrill-act', asOf: '2026-09-15' },
        { title: 'Celebrating the Second Morrill Act of 1890', publisher: 'USDA National Institute of Food and Agriculture', url: 'https://www.nifa.usda.gov/about-nifa/blogs/celebrating-second-morrill-act-1890', asOf: '2026-09-15' },
      ],
      note: 'Verified by live web search on 2026-09-15 against the National Archives and USDA NIFA. The 1890 Act is itself the record that the 1862 system had excluded Black students.',
    },
    {
      id: 'f-hea-1965',
      statement: 'President Lyndon B. Johnson signed the Higher Education Act on November 8, 1965, at Southwest Texas State College, as part of his Great Society "Full Educational Opportunity" agenda (announced to Congress January 12, 1965). Its Title IV-B created the Guaranteed Student Loan Program — the federal government’s first widespread step into guaranteeing loans made by private lenders to students. It was a separate statute from the Civil Rights Act of 1964.',
      status: 'documented',
      sources: [
        { title: 'Higher Education Act of 1965', publisher: 'Encyclopedia.com', url: 'https://www.encyclopedia.com/history/encyclopedias-almanacs-transcripts-and-maps/higher-education-act-1965', asOf: '2026-09-15' },
        { title: 'Title IV of the Higher Education Act of 1965', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Title_IV_of_the_Higher_Education_Act_of_1965', asOf: '2026-09-15' },
        { title: 'Origins of the Student Loan Industry in the United States (Cornuelle, United Student Aid Funds, and the Guaranteed Student Loan Program)', publisher: 'Journal of American History (Oxford Academic)', url: 'https://academic.oup.com/jah/article-abstract/110/4/667/7631603', asOf: '2026-09-15' },
      ],
      note: 'Verified by live web search on 2026-09-15. The mechanism the creator describes — private lenders backed by the government — is exactly what Title IV-B built.',
    },
    {
      id: 'f-tuition-growth',
      statement: 'Adjusted for inflation, tuition at public colleges has risen about 312% since 1963 — undergraduate tuition from roughly $4,939 to $14,688 in constant dollars by 2022 (NCES-derived). The 1960s themselves were modest (inflation-adjusted tuition, room, and board went from $12,526 in 1963-64 to $12,785 in 1969-70); the steepest decade was the 1980s (+151%).',
      status: 'documented',
      sources: [
        { title: 'Cost of College Every Year Since the 1960s (NCES data)', publisher: 'BestColleges', url: 'https://www.bestcolleges.com/research/college-costs-over-time/', asOf: '2026-09-15' },
        { title: 'Average Cost of College Over Time: Yearly Tuition Since 1970', publisher: 'EducationData.org', url: 'https://educationdata.org/average-cost-of-college-by-year', asOf: '2026-09-15' },
        { title: 'Federal Data Confirms College Costs Rose 3x Faster Than Inflation', publisher: 'The College Investor', url: 'https://thecollegeinvestor.com/77152/why-is-college-so-expensive/', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. The creator’s 312% is the real inflation-adjusted figure; the creator’s "40 times" is nominal and is carried as the creator’s number, not asserted here.',
    },
    {
      id: 'f-drivers-debated',
      statement: 'WHY tuition rose is genuinely debated among economists, and no single cause is settled. The "Bennett hypothesis" (federal aid and guaranteed loans let colleges raise prices) has mixed but real support — one Federal Reserve study finds expansions of federal loans significantly raise tuition, and aid-eligible programs have been found to charge markedly more than comparable ineligible ones. The "state disinvestment" view (states shifted cost from taxpayers to students) is also contested — some studies attribute 57–68% of public tuition increases to appropriation cuts; others find long-run state funding per student actually rose.',
      status: 'partly-documented',
      sources: [
        { title: 'Do Student Loans Drive Up College Tuition?', publisher: 'Federal Reserve Bank of Richmond (Economic Brief 22-32)', url: 'https://www.richmondfed.org/publications/research/economic_brief/2022/eb_22-32', asOf: '2026-09-15' },
        { title: 'Does Federal Student Aid Raise Tuition? New Evidence on For-Profit Colleges', publisher: 'NBER Working Paper 17827', url: 'https://www.nber.org/system/files/working_papers/w17827/w17827.pdf', asOf: '2026-09-15' },
        { title: 'The Disinvestment Hypothesis: Don’t Blame State Budget Cuts for Rising Tuition', publisher: 'Education Next', url: 'https://www.educationnext.org/disinvestment-hypothesis-dont-blame-state-budget-cuts-rising-tuition-public-universities/', asOf: '2026-09-15' },
        { title: 'Trends in Higher Education: State Funding and Tuition Revenue at Public Colleges from 1980 to 2025', publisher: 'Cato Institute', url: 'https://www.cato.org/briefing-paper/trends-higher-education-state-funding-tuition-revenue-public-colleges-1980-2025', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. The DEBATE is documented; a single cause is not. This is the honest boundary of Tier 2 (DR-0100): the mechanism is known, the motive is not adjudicated.',
    },
  ],
  interpretation: [
    {
      id: 'n-timing-is-not-motive',
      statement: 'The creator’s conclusion — tuition rose BECAUSE Black and brown students got in — is an interpretation of motive laid over a real coincidence of timing. What is documented is the mechanism (a federally guaranteed private-loan program in 1965), the long-run result (a ~312% real rise), and a genuine scholarly debate about causes. What is not documented is any decree or record saying access was the reason. Keep the categories: the timing is fact, the motive is inference — and the FRUIT is judged either way.',
      restsOn: ['f-hea-1965', 'f-tuition-growth', 'f-drivers-debated'],
    },
    {
      id: 'n-free-overstated',
      statement: '"Basically tuition-free, even at the most renowned institutions" is an overstatement. Many public land-grant colleges were cheap or nominal for decades; elite private universities charged tuition throughout. The true, smaller claim — public higher education was far cheaper before the loan era — is the one that stands.',
      restsOn: ['f-morrill', 'f-tuition-growth'],
    },
    {
      id: 'n-same-year-compressed',
      statement: '"In that same year tuition appeared and quickly spiked" compresses decades into a moment. The data show the 1960s were modest and the 1980s were the steep climb. A slow structural shift is still a shift — but honesty about the pace keeps the claim from being dismissed as a whole.',
      restsOn: ['f-tuition-growth'],
    },
    {
      id: 'n-not-the-civil-rights-act',
      statement: 'Calling the HEA "part of the larger Civil Rights Act" is a precision error, not a fabrication: it was a separate Great Society law of the same era and the same stated purpose (opening the doors). Naming it exactly makes the true point stronger, not weaker.',
      restsOn: ['f-hea-1965'],
    },
  ],

  // ---- STAGE 3 — PERSPECTIVES on the UNRESOLVED parts ----
  perspectives: [
    {
      id: 'p-creator',
      label: 'The creator’s reading — the timing tells the story',
      heldBy: 'Learning with Lindsay and many who share the video',
      steelman: 'At its strongest: the same era that opened the doors also attached a price to walking through them, and the structure that followed put that price on the newly admitted through debt. A people who lived Jim Crow — laws written to look neutral while landing on one group — have earned the right to distrust "coincidence." Even if no memo ever said it, a system that makes the newly included pay for what the previously included got cheaply produces the same fruit as intent would, and the Word judges fruit.',
    },
    {
      id: 'p-economists',
      label: 'What the economists actually answer — and what they leave standing',
      heldBy: 'Economists across the Bennett-hypothesis and expansion literature',
      steelman: 'Heard fairly: mass enrollment after 1965, federally guaranteed credit that let schools raise prices (the Bennett hypothesis, with real if mixed evidence), and campus cost growth drove tuition for EVERY student, and the timing tracks the loan program itself, not the race of the students entering. This genuinely answers the claim that access was the cause. It does NOT answer where the burden landed: a system that finances access with debt loads the cost onto the least-resourced first, whatever it intended — and that is the part the Word will not let pass.',
    },
    {
      id: 'p-state-funding',
      label: 'The state-disinvestment view',
      heldBy: 'Many public-university leaders and education economists',
      steelman: 'States shifted the cost of public colleges from all taxpayers onto students and families; several studies attribute more than half of public tuition increases to appropriation cuts. On this view the villain is not 1965 or any law but a long political choice to treat higher education as a private good. Its critics answer with data showing state funding per student rose over the long run — so even here the honest reader holds the disagreement open.',
    },
    {
      id: 'p-borrowers',
      label: 'The borrower’s and the community’s view — the fruit is the point',
      heldBy: 'Families carrying the debt; the Black church as builder',
      steelman: 'Whoever is right about causes, the outcome is not in dispute: a generation is paying through decades of debt for what earlier generations largely received without a yoke. For families with the least wealth to begin with, that debt is not an inconvenience but a bond on their labor. This view refuses to let a debate about motive become an excuse to leave the yoke in place — and it turns toward the only remedy the Word ever gave for structural debt: release and restoration.',
    },
  ],

  // ---- STAGE 4 — THE BELIEVER'S LENS ----
  lens: {
    fourD: {
      deepSource: 'WORD FIRST — Yahweh wrote the economics of debt before any legislature did, and He wrote it for the poor. Debt is bondage, plainly: "The rich ruleth over the poor, and the borrower is servant to the lender." (Proverbs 22:7). He forbade profiting from the poor’s need: "If thou lend money to any of my people that is poor by thee, thou shalt not be to him as an usurer, neither shalt thou lay upon him usury." (Exodus 22:25). And He built RELEASE into the calendar so no yoke could become permanent: "At the end of every seven years thou shalt make a release." (Deuteronomy 15:1) — "Every creditor that lendeth ought unto his neighbour shall release it; he shall not exact it of his neighbour, or of his brother; because it is called the LORD’s release." (Deuteronomy 15:2) — and the jubile, "proclaim liberty throughout all the land unto all the inhabitants thereof" (Leviticus 25:10). He measured every system by the just weight: "A false balance is abomination to the LORD: but a just weight is his delight." (Proverbs 11:1). He forbade a law that lands on one people: "thou shalt not respect the person of the poor, nor honor the person of the mighty" (Leviticus 19:15); "ye shall hear the small as well as the great" (Deuteronomy 1:17); "God is no respecter of persons" (Acts 10:34); and in Christ "ye are all one in Christ Jesus" (Galatians 3:28). And He pronounced woe on decrees that look neutral and fall on the needy: "Woe unto them that decree unrighteous decrees, and that write grievousness which they have prescribed; To turn aside the needy from judgment, and to take away the right from the poor of my people" (Isaiah 10:1-2). Jesus named the same sin in the religious system of His day: "they bind heavy burdens and grievous to be borne, and lay them on men’s shoulders" (Matthew 23:4). NEHEMIAH 5 IS THE TEMPLATE FOR THIS EXACT CASE. Under a crushing economy the people cried out — "there was a great cry of the people" (Nehemiah 5:1) — "We have mortgaged our lands, vineyards, and houses" (5:3), and worst of all, "we bring into bondage our sons and our daughters to be servants" and "neither is it in our power to redeem them" (5:5). The lenders were their own brethren. Nehemiah did not debate their motives; he named the deed — "Ye exact usury, every one of his brother" (5:7) — and demanded the remedy the Word always demands: "Restore, I pray you, to them, even this day, their lands, their vineyards, their oliveyards, and their houses" (5:11). And they did: "We will restore them, and will require nothing of them" (5:12). SO IN THIS CASE the believer does three things in order. First, state the documented plainly, because "Prove all things; hold fast that which is good." (1 Thessalonians 5:21): the land grants are real; the 1965 Act and its guaranteed private loans are real; the 312% real rise is real. Second, keep the categories honestly — "He that answereth a matter before he heareth it, it is folly and shame unto him." (Proverbs 18:13); "He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him." (Proverbs 18:17): the creator’s "because" is an inference about motive; the economists’ explanations are heard at their strongest; no court and no record has adjudicated the motive of 1965, and the Word does not let us invent one. Third — and this is where the Word settles what the debate cannot — judge the FRUIT: "by their fruits ye shall know them" (Matthew 7:20). Whatever the intent of any lawmaker, a system that finances access to learning with decades of debt laid heaviest on the least-resourced is, by Yahweh’s measure, a false balance and a heavy burden on men’s shoulders, and the sons and daughters in it are in the bondage Nehemiah’s people cried about. The Word’s remedy is not a better argument about 1965; it is release and restoration.',
      scripture: 'Proverbs 22:7; Exodus 22:25; Deuteronomy 15:1-2; Leviticus 25:10; Proverbs 11:1; Proverbs 20:23; Leviticus 19:15; Deuteronomy 1:17; Acts 10:34; Galatians 3:28; Isaiah 10:1-2; Matthew 23:4; Nehemiah 5:1-12; 1 Thessalonians 5:21; Proverbs 18:13; Proverbs 18:17; Matthew 7:16-20; Proverbs 22:22-23; Psalms 82:3-4; Micah 6:8; Romans 13:8',
    },
    threeD: 'Practically: read the claim exactly as made and sort it. Say the proven parts out loud without a hedge — the 1965 Act created guaranteed private loans; real tuition is up about 312% since 1963; the 1890 Act itself records that the first land-grant system left Black students out. Then label the rest honestly: "it rose because Black students got in" is the creator’s reading of motive — a real timing, an unproven cause — and "even the most renowned schools were free" is an overstatement. Hear the economists at their strongest (Proverbs 18:17) and mark what they answer (the mechanism) and what they leave standing (where the burden landed). Then do what the Word does with fruit: name the yoke as a yoke. In your own house, treat debt the way Yahweh’s people were told to — "Owe no man any thing, but to love one another" (Romans 13:8) — count the cost of every loan before signing (Proverbs 22:7), and use the free and low-cost paths first. In the Body, be Nehemiah: the church that founded and fed the HBCUs can fund scholarships, teach families to escape the yoke, and build learning that carries no debt at all — the way Yahweh’s release worked, on a schedule, so bondage never became permanent.',
    accountability: {
      statement: 'THE TWO COURTS. Man’s court never tried the motive of 1965 and never will; there is no verdict to cite, and this lesson invents none. But the Word never lets accountability shrink to what a legislature or a court happened to rule on. Every decree enters the eternal court — "Woe unto them that decree unrighteous decrees" (Isaiah 10:1) — where God brings every work into judgment (Ecclesiastes 12:14), where the unpaid and the over-charged are heard: withheld wages "crieth: and the cries of them which have reaped are entered into the ears of the Lord of sabaoth" (James 5:4), and "He that oppresseth the poor reproacheth his Maker" (Proverbs 14:31). Those who "turn aside the poor in the gate from their right" (Amos 5:12) answer there whatever they intended, and so does every system that does it by policy. WHAT A SYSTEM OWES under the Word is not a defense of its motives but the remedy: release on a schedule (Deuteronomy 15:1-2) and restoration — "Restore, I pray you, to them, even this day" (Nehemiah 5:11). WHAT WE OWE: to "Rob not the poor, because he is poor" (Proverbs 22:22) and to remember "the LORD will plead their cause" (Proverbs 22:23); to "Defend the poor and fatherless: do justice to the afflicted and needy." (Psalms 82:3); to hear the small as well as the great (Deuteronomy 1:17); and "to do justly, and to love mercy, and to walk humbly with thy God" (Micah 6:8). And the lived cost during this life is not deferred evidence — the years a family spends under a loan are seen and weighed now. No one gets away: God is not mocked, and the books are opened (Galatians 6:7; Revelation 20:12).',
      scripture: 'Isaiah 10:1-2; Ecclesiastes 12:14; James 5:4; Proverbs 14:31; Amos 5:12; Deuteronomy 15:1-2; Nehemiah 5:7-12; Proverbs 22:22-23; Psalms 82:3-4; Deuteronomy 1:17; Micah 6:8; Galatians 6:7; Revelation 20:12',
    },
    benefits: [
      'Both courts, honestly held: no earthly court ever ruled on the motive behind 1965, and none may — while the ETERNAL court holds every decree and every yoke it laid, and lands after this life (Ecclesiastes 12:14; Isaiah 10:1-2). You can speak the fruit plainly without inventing a verdict man never gave.',
      'Freedom from two lies at once: the outrage lie ("it was all deliberate and there is nothing to check") and the dismissal lie ("the causes are debated, so the burden must not be real").',
      'The Word’s own economics in your hands: debt is bondage, usury on the poor is forbidden, release is scheduled, and the just weight is the measure of every system (Proverbs 22:7; Exodus 22:25; Deuteronomy 15; Proverbs 11:1).',
      'A repeatable skill: state what is proven, label what is not, check the primary source and its date, hear the other side at its strongest, then judge the fruit.',
      'A house that owes no man: counting the cost before a loan, using the free and low-cost paths first, and teaching your children the same.',
      'A church that builds: the same Body that raised the HBCUs can fund, teach, and release — the Nehemiah move, not the outrage move.',
    ],
    graceNote: 'No condemnation of any lawmaker’s soul: this lesson pronounces no verdict on President Johnson, the 1965 Congress, or anyone who has run a college or a lender since — their hearts are Yahweh’s to judge, and He is no respecter of persons in either direction. But leaving the soul to God never mutes the fruit: the yoke on a generation of families is real, the Word names it, and the Word’s answer is not blame but release and restoration. Truth and grace meet in Jesus, who named heavy burdens for what they were and lifted them.',
    stewardship: 'The deeper response to a system that put a price on the door is to BUILD what the Word builds. The Black church did exactly this once: it founded schools, fed the students, and made the 1890 land-grant provision into living institutions. The same Body can do it again — scholarship funds that carry no interest, teaching every family to count the cost before a loan and to owe no man, mentoring young people into the free and low-cost paths, and creating learning that has no yoke on it at all. This platform’s own Learn tab is a small living example of Yahweh’s pattern: knowledge given freely, on machines the community owns, with no debt attached. Righteous engagement names the yoke; it is completed by building the release.',
    anchor: {
      ref: 'Proverbs 22:7; Nehemiah 5:11',
      theme: 'Debt is bondage — "the borrower is servant to the lender" — and the Word’s remedy for a people cried out under it was never a debate about motives but a command to the lenders: "Restore, I pray you, to them, even this day." Name the yoke plainly; build the release.',
    },
  },

  // ---- STAGE 5 — REFLECTION + SKILL ----
  reflection: {
    skill: 'When a "wait, really?" history claim lands in your feed: PAUSE. Separate the documented facts (dates, laws, numbers you can source) from the creator’s reading of WHY. Say the documented part plainly — refusing to name a real burden is false witness. Label the motive-claim as an interpretation, find the primary source with its date, and hear the strongest competing explanation. Then let the Word judge the FRUIT, which needs no motive proven: is this a just weight or a false balance, a release or a yoke? And respond the Nehemiah way — restore and build — not the outrage way.',
    practice: 'Take the claim "college was free until 1965." Write three lines: (1) one sentence of what is DOCUMENTED, with a source and its date; (2) one sentence labeling the creator’s causal reading as interpretation and naming the strongest competing explanation; (3) one sentence on what the Word says about the FRUIT — and one concrete act of release or building you or your church could do this month.',
    prompts: [
      'Which parts of the video are documented (the land grants, the 1965 Act, the 312% figure) and which are the creator’s interpretation (the "because")? How would you check each?',
      'The creator’s 312% number turned out to be right, and her "even the most renowned schools were free" turned out to be overstated. Why does honest sorting strengthen the true claim instead of weakening it?',
      'Walk through Nehemiah 5: the cry (v.1), the mortgaged land (v.3), the children in bondage (v.5), the rebuke (v.7), the demand to restore (v.11), the restoration (v.12). What does that pattern require of leaders today — and what does it forbid?',
      'Yahweh scheduled release every seven years (Deuteronomy 15:1-2). What would a modern "release" look like for families under education debt — and what could a church do without waiting for a law?',
      'Where is the line between "no one adjudicated the motive of 1965" (true) and "so the yoke on these families is not real" (false — Isaiah 10:1-2; Matthew 23:4)? Practice naming the fruit without inventing a verdict.',
      'In your own house: what does "Owe no man any thing" (Romans 13:8) and "count the cost" mean for the next loan someone in your family is offered?',
    ],
  },

  // ---- Age-appropriate renderings (kids use the app) ----
  levels: {
    child: 'Sometimes a video says "Wait, really?" about history — like, "College used to be almost free, and then it got expensive." Be a good detective: which parts are FACTS you can look up (there really was a law in 1965 that helped people borrow money for college, and college really does cost much more now) and which parts are someone’s GUESS about why it happened? Facts we say out loud; guesses we say "that might be, let’s check." And here is what God says about borrowing: "the borrower is servant to the lender" (Proverbs 22:7) — when you owe someone money for a long time, it is like a heavy backpack you cannot take off. God cared so much about this that He told His people to let go of debts every seven years, so nobody had to carry the backpack forever. When many families are carrying that backpack for school, God calls that a heavy burden — and the people He loves are the ones who help lift it off, like Nehemiah did when he told the lenders, "give it back to them, today." We never say a person is bad; we say a heavy burden is heavy, and we help.',
    teen: 'A viral "wait, really?" video says college was basically free until 1965, then tuition spiked right when Black and brown students got in. Run the moves before you repeat it. (1) Sort fact from "why." The land grants are real; the 1965 Higher Education Act really created government-backed private loans; and real tuition really is up about 312% since 1963 — the creator’s number checks out. But "even the fanciest schools were free" is overstated, and "it spiked BECAUSE Black students got in" is her reading of motive, not a record. (2) Hear the other side at its strongest: economists say guaranteed loans and mass enrollment drove prices for everyone — that answers the "because," but it does NOT answer where the burden landed. (3) Now let the Word judge the fruit, which doesn’t need anyone’s motive proven: "the borrower is servant to the lender" (Proverbs 22:7). God forbade profiting off the poor’s need, scheduled a release every seven years so no debt became permanent, and called laws that land on the needy "unrighteous decrees" (Isaiah 10:1). A system that makes a whole generation pay through decades of debt for what used to be nearly free is a heavy burden — that is not outrage, that is the Word. (4) Respond like Nehemiah, not like a comment section: he named the deed, told the lenders "restore," and they did. For you: count the cost before you sign a loan, use the free and cheap paths first, and be part of a church that builds scholarships and teaches families to owe no man.',
    senior: 'For the seasoned believer, this lesson is about weighing a charged historical claim with the Word’s own economics, in an age that rewards both outrage and dismissal. First, the documented record, stated plainly: the Morrill Acts (1862, and 1890 — whose very text records that the first system excluded Black students and required a remedy); the Higher Education Act signed November 8, 1965, whose Title IV-B built the Guaranteed Student Loan Program of government-backed private lending; and the inflation-adjusted rise of roughly 312% in public tuition since 1963, the creator’s own figure and the NCES-derived one. Second, the categories kept honestly (Proverbs 18:13, 18:17): the creator’s causal reading — access as the reason — is an interpretation of motive laid over a true coincidence of timing, and no decree or court has adjudicated it; the economists’ explanations (guaranteed credit, mass enrollment, state cost-shifting) are heard at their strongest, and they answer the mechanism while leaving the placement of the burden standing. "Even the most renowned institutions were free" and "in that same year it spiked" are overstatements the honest reader trims so the true claim survives. Third — where the Word settles what the debate cannot — the fruit is judged by the just weight: debt is bondage (Proverbs 22:7), usury on the poor is forbidden (Exodus 22:25), release is commanded on a schedule (Deuteronomy 15:1-2; Leviticus 25:10), unrighteous decrees that fall on the needy are under woe (Isaiah 10:1-2), and heavy burdens laid on men’s shoulders are named by the Lord Himself (Matthew 23:4). Nehemiah 5 is the governing template: the cry, the mortgaged inheritance, the children in bondage, the leader who names the deed rather than the motive, and the restoration required "even this day." The verdict on any lawmaker’s soul stays with Yahweh, who is no respecter of persons; the verdict on the yoke is already written. Then let the response mature past reaction into the Body’s long vocation as builder — the church that raised the HBCUs can fund release, teach a house to owe no man, and build learning that carries no yoke.',
  },

  // ---- Discernment-skill quiz ----
  quiz: {
    questions: [
      {
        q: 'The creator says real tuition is up 312% since the 1960s. What is the discernment move?',
        options: ['Dismiss it — viral numbers are usually wrong', 'Check the primary source; here it matches the NCES-derived figure, so say it plainly as documented', 'Accept it only if a famous person repeats it'],
        answer: 1,
        explain: 'A documented number is said plainly. Sorting fact from interpretation cuts both ways: it also means naming the true parts of a claim without a hedge (DR-0100).',
      },
      {
        q: '"Tuition spiked BECAUSE Black and brown students got access." Which label fits, and why?',
        options: ['Documented fact — the timing proves it', 'Interpretation — a real coincidence of timing, but a claim about motive no record or court has adjudicated', 'A lie — economists have disproven it'],
        answer: 1,
        explain: 'Timing is fact; motive is inference. Economists offer competing explanations, which answers the mechanism — and none of that changes the fruit the Word judges.',
      },
      {
        q: 'Economists explain the rise by guaranteed loans, mass enrollment, and state cost-shifting. What does that answer, and what does it leave standing?',
        options: ['It answers everything — the burden is therefore not real', 'It answers the MECHANISM; it leaves standing WHERE the burden landed — on the least-resourced', 'It answers nothing'],
        answer: 1,
        explain: 'Hearing the other side at its strongest (Proverbs 18:17) means marking both what it covers and what it does not. A debate about causes is not a licence to leave the yoke in place.',
      },
      {
        q: 'What does the Word require once the fruit — a generation under decades of debt — is named?',
        options: ['Nothing until the motive is proven', 'Release and restoration, the Nehemiah pattern: name the yoke, and "Restore, I pray you, to them, even this day"', 'A verdict on the lawmakers’ souls'],
        answer: 1,
        explain: 'Nehemiah did not litigate motives; he named the deed and required restoration (Nehemiah 5:7-12). The soul’s verdict is Yahweh’s; the remedy for a yoke is written.',
      },
      {
        q: 'The video also says "even the most renowned institutions were basically tuition-free." How should a discerning reader handle that?',
        options: ['Repeat it — it makes the point stronger', 'Trim it — public land-grants were cheap, elite privates charged tuition; the smaller true claim survives', 'Reject the whole video because one line is overstated'],
        answer: 1,
        explain: 'Honest trimming strengthens a true claim. Rejecting everything because one line overreaches is the dismissal error; repeating the overreach is the outrage error.',
      },
      {
        q: 'What does "the borrower is servant to the lender" (Proverbs 22:7) mean for a family deciding on a student loan today?',
        options: ['Loans are always sin', 'Count the cost first, use the free and low-cost paths, and aim to owe no man (Romans 13:8) — debt is a yoke, entered soberly if at all', 'Borrow the maximum; the government backs it'],
        answer: 1,
        explain: 'The Word treats debt as bondage to be entered soberly and escaped deliberately — and it puts release, not permanence, at the center of its economy.',
      },
    ],
  },
};

// =============================================================================
// ISSUE 12 — The EPA unwinds the power-plant carbon rules (2026-09-14).
// Darrell forwarded the Morning Brew lead (Smokin’) and the NPR Up First bullet
// on 2026-09-15 with the single word: Lesson. The newsletter is MATERIAL TO
// STUDY, not instruction. Every real-world figure below was checked by live web
// search on 2026-09-15 and sorted into DR-0100 tiers; every verse was fetched
// verbatim from the repo KJV and is gated in world-issues-verse-integrity.
// Word first: dominion is stewardship (Genesis 2:15; Psalms 24:1), the land is
// not to be polluted (Numbers 35:33-34), the just weight weighs BOTH pans of
// the cost-benefit claim (Proverbs 11:1; 20:23), the poor breathe the smoke
// first (Isaiah 10:1-2; Proverbs 29:7), and every decree meets two courts
// (Ecclesiastes 12:14). No verdict on any official’s soul; pray for rulers.
// =============================================================================
const EPA_POWER_PLANT_ISSUE = {
  id: 'wi-epa-power-plant-carbon-rules-2026',
  title: 'The EPA unwinds the power-plant carbon rules — $300 billion, 30,000 lives, and the Word on the land',
  subject: { name: 'the EPA’s September 2026 repeal of the power-plant carbon pollution standards', kind: 'policy-and-news', isNamedRealPerson: false },
  skill: 'Take a front-page policy fight with a giant number on each side — "$300 billion saved" versus "30,000 lives" — and learn how the Word weighs it: state the documented plainly (what was repealed, when, what the agency itself projects, what coal smoke is proven to do), label each modeled projection as a model with its assumptions in view, hear the administration, the public-health side, and the coal towns and downwind neighborhoods at their strongest (Proverbs 18:17), and then let Yahweh’s own frame settle what the shouting cannot: the earth is His, dominion is stewardship, the just weight has two pans, and the poor breathe the smoke first.',
  source: {
    creator: 'Morning Brew (with the NPR Up First bullet on the same story)',
    medium: 'newsletter',
    title: 'Smokin’ — EPA unwinds the power-plant carbon rules (2026-09-15 edition)',
    url: '',
    asOf: '2026-09-15',
    note: 'A daily business newsletter’s lead item, forwarded by Darrell on 2026-09-15. It compresses an AP story, an EPA announcement, an NYU analysis, and a Sierra Club count into a few sentences. We treat it as ONE summary — sourced, labeled, and checked line by line — not as truth to repeat.',
  },

  // ---- STAGE 1 — THE CLAIM(S): the newsletter's points, AS MADE, each labeled. ----
  claims: [
    {
      id: 'c-unwinding',
      text: 'The EPA announced it is unwinding Obama- and Biden-era carbon pollution standards for fossil-fuel power plants — rules requiring gas plants to burn cleaner and coal plants to capture most of their emissions by 2039 are eliminated, effective shortly after publication.',
      label: 'claim',
      attribution: 'Morning Brew, summarizing the EPA announcement of 2026-09-14',
      note: 'Documented in substance, loose in detail. The final rule signed 2026-09-14 is a PARTIAL repeal of the 2024 Carbon Pollution Standards: it strikes the guidelines for existing coal plants (90% capture by 2032 for plants running past 2039, or retire) and the carbon-capture standard for new baseload gas turbines. "Burn cleaner fuels" is the newsletter’s gloss; the gas-plant standard was a carbon-capture requirement. The exact effective date is in the Federal Register notice and is carried here as the newsletter’s "shortly after publication."',
    },
    {
      id: 'c-300b',
      text: 'The EPA says the changes save the energy industry more than $300 billion and "unleash" American energy.',
      label: 'claim',
      attribution: 'Morning Brew, quoting the EPA',
      note: 'Documented as the EPA’s OWN projection ($310 billion in avoided compliance costs, per the agency’s release). It is a one-pan figure: it counts what the industry no longer has to spend and does not count the health and climate costs on the other pan. That asymmetry is exactly what the just weight (Stage 4) is for.',
    },
    {
      id: 'c-endanger',
      text: 'In a separate proposed rule the EPA will argue that greenhouse gases do not endanger human health or the environment — which could prevent future administrations from reinstating restrictions.',
      label: 'claim',
      attribution: 'Morning Brew, summarizing the EPA’s supplemental proposal',
      note: 'Documented with a precision fix. The supplemental proposal argues that power-plant greenhouse gases "do not contribute significantly" to dangerous air pollution under Clean Air Act Section 111, and would rescind every remaining power-plant greenhouse-gas standard (final expected in 2027). The 2009 endangerment finding itself was already rescinded on 2026-02-18 for motor vehicles and is in the D.C. Circuit now.',
    },
    {
      id: 'c-nyu',
      text: 'An NYU analysis of 2022 data found that if the U.S. power sector were a country it would be the world’s sixth-largest greenhouse-gas emitter.',
      label: 'claim',
      attribution: 'Morning Brew, citing NYU School of Law’s Institute for Policy Integrity',
      note: 'Documented: the Institute for Policy Integrity’s issue brief on 2022 data makes exactly this comparison (ahead of Canada, Japan, Brazil, and Mexico as whole nations).',
    },
    {
      id: 'c-30k',
      text: 'AP research found the regulations being wiped away could prevent about 30,000 deaths; even a partial unraveling means more smog, mercury, and lead (some mercury and contaminant restrictions remain).',
      label: 'claim',
      attribution: 'Morning Brew, citing the Associated Press examination',
      note: 'Partly documented, and the most important precision in this lesson: the AP figure (~30,000 deaths and ~$275 billion per year) covers the WHOLE slate of roughly thirty EPA rollbacks, not this rule alone — about 10,000 U.S. deaths a year from the soot, mercury, and lead rules (from the EPA’s own regulatory impact analyses) plus about 25,000 heat-related deaths a year worldwide from added carbon, modeled with a peer-reviewed formula. A modeled projection with stated assumptions is not a body count; it is also not nothing. "Some mercury restrictions remain" is right: the 2024 mercury amendments were repealed 2026-02-20, and the 2012 standards still stand.',
    },
    {
      id: 'c-coal-retire',
      text: 'Coal plants said carbon capture was cost-prohibitive; per the Sierra Club, 330 coal plants have retired since 2010 and 60 more have announced closure by 2031.',
      label: 'claim',
      attribution: 'Morning Brew, citing coal operators and the Sierra Club',
      note: 'Documented: the Sierra Club count (330 retired since 2010; 60 announced by 2031) is carried in the AP story of 2026-09-14, and the EPA’s own rationale is that the 2024 rule required a control technology "not adequately demonstrated" at that scale.',
    },
    {
      id: 'c-data-centers',
      text: 'Cheaper fossil fuels coincide with the tech sector’s push for AI data centers, which are straining grids and raising consumer energy prices.',
      label: 'opinion',
      attribution: 'Morning Brew (the newsletter’s framing)',
      note: 'The demand surge and the price rise are documented (Stage 2). "Coincide" is the newsletter’s reading of motive and timing; the administration says the demand is precisely why it acted. Both the fact and the framing are carried, labeled.',
    },
    {
      id: 'c-legal',
      text: 'Legal challenges from environmental groups are expected.',
      label: 'claim',
      attribution: 'Morning Brew',
      note: 'Documented: NRDC and allies announced they will sue; the related endangerment rescission is already before the D.C. Circuit on petitions from health groups and from two dozen states.',
    },
  ],

  // ---- STAGE 2 — VERIFIABLE vs INTERPRETATION ----
  verifiable: [
    {
      id: 'f-repeal',
      statement: 'On September 14, 2026, at the G20 energy summit in Houston, EPA Administrator Lee Zeldin signed the final Partial Repeal of the Carbon Pollution Standards for Fossil Fuel-Fired Electric Generating Units. It strikes the 2024 rule’s emission guidelines for existing coal-fired plants (which required plants operating past 2039 to capture 90% of carbon dioxide by 2032, or retire), the carbon-capture standard for coal plants undertaking a large modification, and the carbon-capture (Phase 2) standard for new baseload gas turbines. The EPA projects $310 billion in avoided compliance costs and says the action will "unleash" American energy. A supplemental proposal issued the same day would rescind all remaining power-plant greenhouse-gas standards on the ground that the sector’s emissions "do not contribute significantly" to dangerous air pollution; it is expected to be finalized in 2027.',
      status: 'documented',
      sources: [
        { title: 'EPA Finalizes Repeal of 2024 Power Plant Regulations, Delivering $300+ Billion in Savings, Proposes Repeal of All Remaining Greenhouse Gas Emissions Standards for Power Plants', publisher: 'U.S. Environmental Protection Agency (news release)', url: 'https://www.epa.gov/newsreleases/epa-finalizes-repeal-2024-power-plant-regulations-delivering-300-billion-savings', asOf: '2026-09-15' },
        { title: 'Greenhouse Gas Standards and Guidelines for Fossil Fuel-Fired Power Plants', publisher: 'U.S. Environmental Protection Agency (program page)', url: 'https://www.epa.gov/stationary-sources-air-pollution/greenhouse-gas-standards-and-guidelines-fossil-fuel-fired-power', asOf: '2026-09-15' },
        { title: 'EPA eliminates rule that limits planet-warming greenhouse gas emissions from power plants', publisher: 'Associated Press (via MPR News)', url: 'https://www.mprnews.org/story/2026/09/14/epa-limits-rule-limiting-greenhouse-gas-emissions-from-power-plants', asOf: '2026-09-15' },
        { title: 'EPA Poised to Repeal Carbon Rules for Coal, Gas Power Plants', publisher: 'Bloomberg (via Insurance Journal)', url: 'https://www.insurancejournal.com/news/national/2026/09/15/884996.htm', asOf: '2026-09-15' },
      ],
      note: 'Verified by live web search on 2026-09-15 against the EPA’s own release and program page, the AP, and Bloomberg. The $310 billion is the agency’s figure for avoided industry compliance cost — one pan of the scale, stated as such.',
    },
    {
      id: 'f-endangerment',
      statement: 'The separate endangerment track is real and already moving: on February 18, 2026 the EPA published a final rule rescinding the 2009 greenhouse-gas endangerment finding for motor vehicles (effective April 20, 2026), and it is being challenged in the D.C. Circuit by a coalition of health and environmental groups and by two dozen states and more than a dozen cities and counties. The power-plant supplemental proposal of September 14, 2026 is the Section 111 counterpart, arguing the sector’s emissions are "a small and decreasing part of global emissions."',
      status: 'documented',
      sources: [
        { title: 'Rescission of the Greenhouse Gas Endangerment Finding and Motor Vehicle Greenhouse Gas Emission Standards Under the Clean Air Act', publisher: 'Federal Register', url: 'https://www.federalregister.gov/documents/2026/02/18/2026-03157/rescission-of-the-greenhouse-gas-endangerment-finding-and-motor-vehicle-greenhouse-gas-emission', asOf: '2026-09-15' },
        { title: 'Health, environmental groups sue EPA over repeal of endangerment finding', publisher: 'Utility Dive', url: 'https://www.utilitydive.com/news/environmental-groups-sue-epa-endangerment-finding/812576/', asOf: '2026-09-15' },
        { title: 'Regulating Greenhouse Gases for New and Existing Fossil Fuel-Fired Power Plants (regulatory tracker)', publisher: 'Harvard Law School Environmental & Energy Law Program', url: 'https://eelp.law.harvard.edu/tracker/regulating-greenhouse-gases-for-new-and-existing-fossil-fuel-fired-power-plants/', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. The newsletter’s "will argue greenhouse gases do not endanger" is close but imprecise: the power-plant proposal turns on "significant contribution" under Section 111; the endangerment finding proper was rescinded in February for vehicles.',
    },
    {
      id: 'f-coal-smoke-damage',
      statement: 'That coal smoke shortens lives is established science, not a projection. A 2023 study in Science (Henneman et al.) tied Medicare death records to modeled plumes from 480 U.S. coal plants and found about 460,000 deaths between 1999 and 2020 attributable to coal fine-particle pollution — more than 43,000 a year in 1999-2007, falling steeply as plants closed or added scrubbers — with coal particulates carrying roughly double the mortality risk per unit of ordinary fine particles. Mercury from coal is a neurotoxin; the 2024 Mercury and Air Toxics amendments were repealed on February 20, 2026, and the 2012 standards remain in force.',
      status: 'documented',
      sources: [
        { title: 'Mortality risk from United States coal electricity generation', publisher: 'Science (Henneman et al., 2023)', url: 'https://www.science.org/doi/10.1126/science.adf4915', asOf: '2026-09-15' },
        { title: 'Deaths associated with pollution from coal power plants', publisher: 'National Institutes of Health (Research Matters)', url: 'https://www.nih.gov/news-events/nih-research-matters/deaths-associated-pollution-coal-power-plants', asOf: '2026-09-15' },
        { title: 'Analysis of the Final Repeal of the Mercury and Air Toxics Standards Amendments', publisher: 'U.S. Environmental Protection Agency', url: 'https://www.epa.gov/power-sector-modeling/analysis-final-repeal-mercury-and-air-toxics-standards-amendments', asOf: '2026-09-15' },
        { title: 'EPA’s repeal of updated standards allows more emissions of hazardous air pollutants from coal plants', publisher: 'Clean Air Task Force', url: 'https://www.catf.us/2026/02/epas-repeal-updated-standards-allows-more-emissions-hazardous-air-pollutants-coal-plants/', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. This is Tier 1 (DR-0100): documented damage, stated plainly. It is also the honest baseline for the coal-town steelman — the same record shows the harm FELL as plants closed, which is the very trend the repeal is meant to slow.',
    },
    {
      id: 'f-ap-projection',
      statement: 'The Associated Press examination (published June 2025, restated in its September 14, 2026 story) estimated that the roughly thirty EPA rules targeted for rollback could together prevent about 30,000 deaths and save about $275 billion EACH YEAR they are in effect. The AP built the figure from the EPA’s own regulatory impact analyses plus studies in Science and Nature Communications, Rhodium Group emission estimates, and a peer-reviewed heat-death formula (one death per 10,217 tons of added carbon dioxide). Roughly 10,000 of the deaths are U.S. deaths from the soot, mercury, and lead rules; roughly 25,000 are heat-related deaths worldwide from added carbon. The Environmental Defense Fund’s preliminary analysis of this power-plant rule alone projects more than 80,000 additional premature deaths and over $1 trillion in health costs through 2047. The NYU Institute for Policy Integrity projects about 5,300 additional premature U.S. deaths from the sector’s 2022 emissions alone.',
      status: 'partly-documented',
      sources: [
        { title: 'How AP calculated the costs and death toll of EPA rule rollbacks', publisher: 'Associated Press (via Daily Journal)', url: 'https://dailyjournal.net/2025/06/05/how-ap-calculated-the-costs-and-death-toll-of-epa-rule-rollbacks/', asOf: '2026-09-15' },
        { title: 'Trump EPA attacks U.S. protections against power plant pollution', publisher: 'Environmental Defense Fund', url: 'https://www.edf.org/media/trump-epa-attacks-us-protections-against-power-plant-pollution', asOf: '2026-09-15' },
        { title: 'The Scale of Significance: Power Plants (issue brief)', publisher: 'Institute for Policy Integrity, NYU School of Law', url: 'https://policyintegrity.org/files/publications/Power_Sector_GHG_Contribution_Issue_Brief_vF.pdf', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. Tier 2 (DR-0100), flagged NARROWLY: the analyses are documented and reviewed, the inputs are named, and the projections rest on models — a carbon-mortality formula, an emissions scenario, an exposure model. Say "modeled projection with these assumptions," never "no one knows," and never "30,000 bodies." The U.S. soot-and-mercury share sits on firmer ground than the global heat share; the EDF and NYU figures are their authors’ projections, carried as such.',
    },
    {
      id: 'f-sector-scale',
      statement: 'The U.S. power sector emits more than 1.5 billion tons of carbon dioxide a year and is the largest industrial source of it in the country. Using 2022 data, NYU’s Institute for Policy Integrity found that if the sector were a country it would rank as the world’s sixth-largest emitter, ahead of the entire national emissions of Canada, Japan, Brazil, and Mexico.',
      status: 'documented',
      sources: [
        { title: 'The Scale of Significance: Power Plants (issue brief)', publisher: 'Institute for Policy Integrity, NYU School of Law', url: 'https://policyintegrity.org/files/publications/Power_Sector_GHG_Contribution_Issue_Brief_vF.pdf', asOf: '2026-09-15' },
        { title: 'EPA Repeals Climate Rules for Power Plants', publisher: 'Natural Resources Defense Council (press release)', url: 'https://www.nrdc.org/press-releases/epa-repeals-climate-rules-power-plants', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. This is the direct answer to the proposal’s "small and decreasing part of global emissions": the share IS decreasing (coal retirements), AND the absolute amount is larger than most nations. Both are true; a just weight holds both.',
    },
    {
      id: 'f-coal-fleet',
      statement: 'Per the Sierra Club, 330 U.S. coal plants have retired since 2010 and 60 more have announced closure by 2031. Against that trend the administration has used Section 202(c) emergency orders to keep aging coal plants running in Michigan, Colorado, Indiana, and Washington; on September 11, 2026 the D.C. Circuit unanimously vacated the first of those orders (the J.H. Campbell plant), rejecting the department’s "sweeping conception" of its emergency authority. The AP reports U.S. coal demand rose about 10% last year, largely on data-center load.',
      status: 'documented',
      sources: [
        { title: 'EPA eliminates rule that limits planet-warming greenhouse gas emissions from power plants', publisher: 'Associated Press (via MPR News)', url: 'https://www.mprnews.org/story/2026/09/14/epa-limits-rule-limiting-greenhouse-gas-emissions-from-power-plants', asOf: '2026-09-15' },
        { title: 'Trump Administration Loses First Court Case Challenging DOE Orders for Coal Plants', publisher: 'Earthjustice', url: 'https://earthjustice.org/press/2026/trump-administration-loses-first-court-case-challenging-doe-orders-for-coal-plants', asOf: '2026-09-15' },
        { title: 'DC Circuit Rejects Energy Department’s Claim of "Emergency" Authority to Order Coal Plant to Remain Open', publisher: 'Reason (Volokh Conspiracy)', url: 'https://reason.com/volokh/2026/09/11/dc-circuit-rejects-energy-departments-claim-of-emergency-authority-to-order-coal-plant-to-remain-open/', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. The retirement count is the Sierra Club’s own tally, carried as theirs.',
    },
    {
      id: 'f-data-centers',
      statement: 'Electricity demand and prices are rising, and data centers are a large part of the demand story: the Energy Information Administration expects record U.S. power use in 2025 and 2026 on data-center growth; data centers used about 4.4% of U.S. electricity in 2023 and are projected at 6.7-12% by 2028; residential electricity prices rose 6.9% in 2025 (more than double headline inflation); Goldman Sachs projects the AI buildout adds about 6% to electricity costs across 2026-2027. How much of the price rise is data centers versus fuel costs, grid upgrades, and weather is genuinely debated.',
      status: 'partly-documented',
      sources: [
        { title: 'Electricity prices will keep rising on AI data center demand: Goldman', publisher: 'CNBC', url: 'https://www.cnbc.com/2026/02/12/electricity-price-data-center-ai-inflation-goldman.html', asOf: '2026-09-15' },
        { title: 'AI Data Centers: Big Tech’s Impact on Electric Bills, Water, and More', publisher: 'Consumer Reports', url: 'https://www.consumerreports.org/data-centers/ai-data-centers-impact-on-electric-bills-water-and-more-a1040338678/', asOf: '2026-09-15' },
        { title: 'Why electricity prices keep rising — and why it’s not just about data centers', publisher: 'Fortune', url: 'https://fortune.com/2026/05/20/electricity-bills-surging-not-just-data-centers/', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. The demand and the price rise are Tier 1; the attribution of the price rise to data centers specifically is Tier 2, flagged narrowly.',
    },
  ],
  interpretation: [
    {
      id: 'n-one-pan-number',
      statement: '"$300 billion saved" and "30,000 lives" are not the same kind of number and should not be traded as if they were. The first is the agency’s projection of one pan — industry compliance cost avoided. The second is a reviewed but modeled projection of the other pan, covering a whole slate of rules, most of it heat deaths worldwide from added carbon. A just weight puts BOTH pans on the scale and says what each one is. The newsletter set them side by side; the discipline is to name what each measures before comparing.',
      restsOn: ['f-repeal', 'f-ap-projection'],
    },
    {
      id: 'n-established-vs-modeled',
      statement: 'Keep the two tiers apart. That coal fine-particle pollution has shortened hundreds of thousands of American lives is ESTABLISHED (Science, 2023; the harm fell as plants closed). That this repeal will cause a specific number of future deaths is MODELED. The first must be said plainly; the second must be said with its assumptions showing. Neither is "no one knows."',
      restsOn: ['f-coal-smoke-damage', 'f-ap-projection'],
    },
    {
      id: 'n-small-and-decreasing',
      statement: 'The proposal’s "small and decreasing part of global emissions" and the NYU "sixth-largest emitter" are both true readings of the same data. The share is falling because coal is retiring; the absolute amount still outweighs whole nations. Which fact a speaker leads with reveals the case being made. The reader holds both.',
      restsOn: ['f-sector-scale', 'f-coal-fleet'],
    },
    {
      id: 'n-coincide',
      statement: '"Cheaper fossil fuels coincide with the data-center push" is the newsletter’s framing of motive and timing. The demand is real and the administration says it acted BECAUSE of it (reliability, cost, keeping coal online). Whether the poor and the downwind should carry the cost of powering the data centers is the moral question underneath — and the Word answers it without needing anyone’s motive proven.',
      restsOn: ['f-data-centers', 'f-coal-fleet'],
    },
  ],

  // ---- STAGE 3 — PERSPECTIVES on the UNRESOLVED parts ----
  perspectives: [
    {
      id: 'p-administration',
      label: 'The administration and the industry — cost, reliability, and a grid under strain',
      heldBy: 'The EPA under Administrator Zeldin, coal and gas generators, and trade groups such as America’s Power',
      steelman: 'At its strongest: the 2024 rule set a standard almost no existing coal plant could meet — 90% carbon capture at scale is not proven across the fleet, and the practical effect was forced retirement, which is not what Section 111 authorizes. Demand from data centers, artificial intelligence, and reshored manufacturing is surging, prices are already up, and taking dispatchable plants off the grid on a deadline risks blackouts and bills that land on the same households the critics say they protect. Energy independence is a security question, not only an economic one. A regulator’s honest job is standards a plant can actually meet; an unmeetable standard is a closure order wearing a standard’s clothes.',
    },
    {
      id: 'p-public-health',
      label: 'The public-health and environmental side — the smoke has a body count',
      heldBy: 'Physicians’ groups, the American Public Health Association, EDF, NRDC, the Sierra Club, and the states suing in the D.C. Circuit',
      steelman: 'At its strongest: coal fine particles have shortened hundreds of thousands of American lives, and the harm dropped as plants closed — that is the record, not a forecast. The power sector is the country’s largest industrial carbon source and, alone, out-emits most nations; carbon is not a local nuisance but a global bill that comes due as heat and smoke. A "$300 billion savings" that omits the other pan is not accounting; it is advertising. And the supplemental proposal is not merely a repeal but an attempt to remove the legal ground so no future administration can act — which turns a policy choice into a locked door.',
    },
    {
      id: 'p-coal-towns',
      label: 'The workers and the towns — the mine, the plant, and the paycheck',
      heldBy: 'Coal miners and plant operators, their unions, and the counties whose tax base is the plant',
      steelman: 'At its strongest: every retirement on the Sierra Club’s tally is a town that lost its largest employer, its school funding, and its hospital’s patient base, usually with a promise of "transition" that never arrived. These are people who kept the lights on for a nation for a century and are told they are the problem. A rule that closes the plant by a date certain, with no equal-paying work in the county, is a burden laid on men’s shoulders by people who will never carry it. The Word’s "Thou shalt not muzzle the ox when he treadeth out the corn." (Deuteronomy 25:4) is about the laborer being fed by his labor — and it applies to the coal worker as surely as to anyone.',
    },
    {
      id: 'p-downwind',
      label: 'The downwind neighborhoods — who breathes it first',
      heldBy: 'Families living near plants and along the plumes, disproportionately poor and often Black and brown; the pastors and clinics that serve them',
      steelman: 'At its strongest: the asthma inhalers, the emergency visits, the grandmother with the cough, and the child kept home from school are not a model; they are the household budget. These neighborhoods did not choose the data centers, will not share the savings, and cannot move. When a rule is loosened, the cost does not disappear — it moves from a balance sheet to a lung, and the lungs it moves to are the poorest first. This side does not need the motive of any official proven; it needs the fruit named, and a church that shows up.',
    },
  ],

  // ---- STAGE 4 — THE BELIEVER'S LENS ----
  lens: {
    fourD: {
      deepSource: 'WORD FIRST — Yahweh settled who owns the earth before any agency was named. "The earth is the LORD’s, and the fulness thereof; the world, and they that dwell therein." (Psalms 24:1). "The land shall not be sold for ever: for the land is mine; for ye are strangers and sojourners with me." (Leviticus 25:23). "For every beast of the forest is mine, and the cattle upon a thousand hills." (Psalms 50:10). DOMINION IS STEWARDSHIP, NOT LICENSE. He gave man real authority — "replenish the earth, and subdue it" and "have dominion" (Genesis 1:28); "the earth hath he given to the children of men" (Psalms 115:16) — and He defined the job in the same breath: "And the LORD God took the man, and put him into the garden of Eden to dress it and to keep it." (Genesis 2:15). A keeper is a steward, and "it is required in stewards, that a man be found faithful." (1 Corinthians 4:2). So the Word corrects the first over-reach in this fight — "the earth is ours to burn." No; it is His, and we are keepers who answer for the keeping. THE LAND IS NOT TO BE POLLUTED. "So ye shall not pollute the land wherein ye are" (Numbers 35:33); "Defile not therefore the land which ye shall inhabit, wherein I dwell" (Numbers 35:34) — the ground on which the Word forbids defiling the land is that He dwells among His people on it. He built rest for the land into the calendar, and tied it to the poor: "But the seventh year thou shalt let it rest and lie still; that the poor of thy people may eat" (Exodus 23:11); "But in the seventh year shall be a sabbath of rest unto the land, a sabbath for the LORD" (Leviticus 25:4). He forbade even an army at war to strip the land bare: "thou shalt not destroy the trees thereof by forcing an axe against them" — "for the tree of the field is man’s life" (Deuteronomy 20:19). He watches the land: "A land which the LORD thy God careth for: the eyes of the LORD thy God are always upon it" (Deuteronomy 11:12). And He counts the defiling of it as a charge: "but when ye entered, ye defiled my land, and made mine heritage an abomination" (Jeremiah 2:7); "The earth also is defiled under the inhabitants thereof" (Isaiah 24:5); "Therefore shall the land mourn, and every one that dwelleth therein shall languish, with the beasts of the field, and with the fowls of heaven" (Hosea 4:3). At the end He names the destroyers: "and shouldest destroy them which destroy the earth" (Revelation 11:18). THE CREATURES ARE HIS CARE, AND SO ARE THE WORKERS. "A righteous man regardeth the life of his beast: but the tender mercies of the wicked are cruel." (Proverbs 12:10). "Thou shalt not muzzle the ox when he treadeth out the corn." (Deuteronomy 25:4) — the laborer eats from his labor; that is the coal worker’s verse as much as anyone’s. He protected even a nesting bird: "thou shalt not take the dam with the young" (Deuteronomy 22:6) — "But thou shalt in any wise let the dam go, and take the young to thee; that it may be well with thee, and that thou mayest prolong thy days." (Deuteronomy 22:7). Take what you need; leave the source alive; and He attaches long life to the restraint. "In whose hand is the soul of every living thing, and the breath of all mankind." (Job 12:10). BUT THE CREATION IS NOT GOD. The Word corrects the second over-reach as firmly as the first. Those who "worshipped and served the creature more than the Creator" (Romans 1:25) are named as the ones who changed the truth into a lie. The earth is a witness to Him, not a deity: "the invisible things of him from the creation of the world are clearly seen, being understood by the things that are made" (Romans 1:20); "all things were created by him, and for him" (Colossians 1:16), and "by him all things consist." (Colossians 1:17). People are not a plague on the planet; He said "Be fruitful, and multiply" (Genesis 1:28), gave the beasts for food — "Every moving thing that liveth shall be meat for you" (Genesis 9:3) — and declared "For every creature of God is good, and nothing to be refused, if it be received with thanksgiving" (1 Timothy 4:4). Coal, gas, sun, and wind are His provision, to be used with thanksgiving and kept with care; neither hoarded as sacred nor spent as if no one owned them. THE JUST WEIGHT HAS TWO PANS. "A false balance is abomination to the LORD: but a just weight is his delight." (Proverbs 11:1). "Divers weights are an abomination unto the LORD; and a false balance is not good." (Proverbs 20:23). "A just weight and balance are the LORD’s: all the weights of the bag are his work." (Proverbs 16:11). This is the verse for the two giant numbers. "$300 billion saved" weighs one pan — the industry’s avoided cost — and calls it the whole scale; that is a divers weight. "30,000 lives" stated as a body count instead of a modeled projection across thirty rules is also a weight that is not what it claims. The Word requires both pans, honestly labeled: the documented harm of coal smoke stated plainly, the modeled future stated as a model, the avoided cost stated as avoided cost, and the bills and blackouts the administration warns of stated as real risks. "Prove all things; hold fast that which is good." (1 Thessalonians 5:21). "He that answereth a matter before he heareth it, it is folly and shame unto him." (Proverbs 18:13). "He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him." (Proverbs 18:17). THE POOR BREATHE THE SMOKE FIRST. "Woe unto them that decree unrighteous decrees, and that write grievousness which they have prescribed" (Isaiah 10:1) — "To turn aside the needy from judgment, and to take away the right from the poor of my people" (Isaiah 10:2). "The righteous considereth the cause of the poor: but the wicked regardeth not to know it." (Proverbs 29:7). "He that oppresseth the poor reproacheth his Maker" (Proverbs 14:31). The Word does not wait for a motive to be proven before it names where a cost lands: when a decree moves a cost from a ledger to a lung, and the lungs are the poorest first, that is a decree the Word has already weighed — whatever any official intended. And the same Word guards the coal worker from being treated as the cost: the ox is not muzzled. SO THE BELIEVER DOES FOUR THINGS IN ORDER. First, state the documented plainly: the repeal, its date, the agency’s own $310 billion figure, the established damage of coal smoke, the sector’s scale. Second, keep the categories: every death projection is a model with assumptions; say so, and do not dismiss it. Third, weigh both pans with a just weight and name where the cost lands — on the poor, on the downwind, and on the coal town — because "by their fruits ye shall know them" (Matthew 7:20). Fourth, pray for the rulers who decree, by command and not by mood: "supplications, prayers, intercessions, and giving of thanks, be made for all men" (1 Timothy 2:1) — "For kings, and for all that are in authority; that we may lead a quiet and peaceable life in all godliness and honesty." (1 Timothy 2:2). The Word settles what the debate cannot: the earth is His, we keep it, the scale has two pans, and the least of these breathe first.',
      scripture: 'Psalms 24:1; Leviticus 25:23; Psalms 50:10; Genesis 1:26-28; Psalms 115:16; Genesis 2:15; 1 Corinthians 4:2; Numbers 35:33-34; Exodus 23:10-11; Leviticus 25:4; Deuteronomy 20:19; Deuteronomy 11:12; Jeremiah 2:7; Isaiah 24:5; Hosea 4:3; Revelation 11:18; Proverbs 12:10; Deuteronomy 25:4; Deuteronomy 22:6-7; Job 12:10; Romans 1:20-25; Colossians 1:16-17; Genesis 9:3; 1 Timothy 4:4; Proverbs 11:1; Proverbs 20:23; Proverbs 16:11; 1 Thessalonians 5:21; Proverbs 18:13; Proverbs 18:17; Isaiah 10:1-2; Proverbs 29:7; Proverbs 14:31; Matthew 7:20; 1 Timothy 2:1-2',
    },
    threeD: 'Practically: read the newsletter exactly as written and sort it. Say the proven parts without a hedge — on September 14, 2026 the EPA signed a partial repeal of the 2024 power-plant carbon standards; the agency itself projects $310 billion in avoided industry cost; a supplemental proposal would remove the remaining standards; coal fine-particle pollution has shortened hundreds of thousands of American lives and the harm fell as plants closed; the sector out-emits most nations. Then label the rest honestly: "30,000 deaths" is the AP’s modeled projection for a whole slate of rules, mostly heat deaths worldwide; "coincide with the data-center push" is the newsletter’s framing. Hear the administration at its strongest (an unmeetable standard is a closure order; the grid is under strain; the bills are real), hear the health side at its strongest (the smoke has a record, and a one-pan savings figure is advertising), and hear the coal town and the downwind block, who are both told they are the cost. Then do what the Word does: weigh both pans with a just weight, name where the cost lands, and refuse both over-reaches — the earth is neither ours to burn nor a god to serve. In your own house, be a keeper: count the cost (Luke 14:28) of the watts you burn, fix the leak, switch the bulb, run the load off-peak, plant the tree — not as a religion of the planet but as a steward of His property. In the Body, be the neighbor: check on the asthmatic child and the grandmother with the cough when the air is bad, drive them to the clinic, and "Open thy mouth for the dumb in the cause of all such as are appointed to destruction." (Proverbs 31:8). And pray for the people who sign the rules — by name, without a sneer — because the Word commands it.',
    accountability: {
      statement: 'THE TWO COURTS. Man’s court has not yet ruled on this repeal; the D.C. Circuit will hear it, as it is already hearing the endangerment rescission and as it vacated the first coal-plant emergency order on September 11, 2026. This lesson invents no verdict and predicts none. But the Word never lets accountability shrink to what a court happens to rule on. Every decree enters the eternal court — "Woe unto them that decree unrighteous decrees" (Isaiah 10:1) — where "God shall bring every work into judgment, with every secret thing, whether it be good, or whether it be evil." (Ecclesiastes 12:14); where the defiling of His land is a charge He has already recorded (Jeremiah 2:7; Numbers 35:33-34); where the ones who "destroy the earth" are named (Revelation 11:18); and where the poor who breathed first are heard: "The righteous considereth the cause of the poor: but the wicked regardeth not to know it." (Proverbs 29:7). WHAT A SYSTEM OWES under the Word is not a defense of its motives but a just weight — both pans, honestly labeled — and a keeper’s care for the land it governs and the people it rules, the coal worker and the downwind child alike. Deuteronomy 22:8 is the Word’s own building code: "thou shalt make a battlement for thy roof, that thou bring not blood upon thine house" — the one who builds is answerable for the neighbor who falls, and a smokestack is a roof over a whole county. WHAT WE OWE: "to do justly, and to love mercy, and to walk humbly with thy God" (Micah 6:8); to "Learn to do well; seek judgment, relieve the oppressed" (Isaiah 1:17); to "Open thy mouth, judge righteously, and plead the cause of the poor and needy." (Proverbs 31:9); to honor the ruler and pray for him (1 Peter 2:17; 1 Timothy 2:1-2) while refusing to call a false balance a just one. And the lived cost during this life is not deferred evidence — every emergency visit and every early funeral is seen and weighed now. No one gets away: "God is not mocked: for whatsoever a man soweth, that shall he also reap" (Galatians 6:7), and "the books were opened" (Revelation 20:12).',
      scripture: 'Isaiah 10:1-2; Ecclesiastes 12:14; Jeremiah 2:7; Numbers 35:33-34; Revelation 11:18; Proverbs 29:7; Deuteronomy 22:8; Micah 6:8; Isaiah 1:17; Proverbs 31:8-9; 1 Peter 2:17; 1 Timothy 2:1-2; Galatians 6:7; Revelation 20:12',
    },
    benefits: [
      'Both courts, honestly held: no earthly court has ruled on this repeal yet, and this lesson predicts none — while the ETERNAL court holds every decree and every ton, and lands after this life (Ecclesiastes 12:14; Isaiah 10:1-2; Revelation 11:18). You can name the fruit plainly without inventing a verdict man has not given.',
      'Freedom from two over-reaches at once: "the earth is ours to burn" (No — "The earth is the LORD’s" (Psalms 24:1); we are put in it "to dress it and to keep it" (Genesis 2:15)) and "creation is god / people are the plague" (No — Romans 1:25; Genesis 1:28; 1 Timothy 4:4).',
      'The just weight in your hands: a savings figure that counts one pan is a divers weight, and a death count that hides its model is too (Proverbs 11:1; 20:23; 16:11). You can hold "$300 billion" and "30,000" in the same hand and say what each one actually measures.',
      'A repeatable method for every policy headline: state the documented with its source and date, label the modeled as a model with its assumptions, hear each side at its strongest, name where the cost lands, and pray for the ruler by name.',
      'A house that keeps: the watts you do not burn are tons that do not go up, and a bill that does not come — stewardship of His property, not worship of the planet.',
      'A church that shows up downwind AND in the coal town: the asthmatic child and the laid-off miner are both among "the least of these" (Matthew 25:40), and the same Body carries both (Deuteronomy 25:4).',
    ],
    graceNote: 'No condemnation of any official’s soul: this lesson pronounces no verdict on Administrator Zeldin, the President, the Biden- and Obama-era officials who wrote the rules being repealed, the judges who will hear the challenges, the coal operator, or the newsletter writer — their hearts are Yahweh’s to judge, and He is no respecter of persons in either direction. But leaving the soul to Him never mutes the fruit: coal smoke has a documented record, the poor breathe it first, the coal town has carried its own burden, and the Word names all of it. Truth and grace meet in Jesus, who counted the sparrows His Father does not forget (Matthew 10:29) and of whom the Word says "by him all things consist." (Colossians 1:17).',
    stewardship: 'The deeper response to a fight over the air is to BE THE KEEPER the Word describes, starting where you have authority. A household: count the cost (Luke 14:28) of what it burns — seal the leaks, switch the bulbs, run the heavy loads off-peak, keep the thermostat honest, plant a tree — because "A prudent man foreseeth the evil, and hideth himself" (Proverbs 22:3), and because every watt not drawn is a bit of smoke not made and a dollar kept for the house. A church: check the air-quality reading the way it checks the weather, and on bad days call the members with asthma and COPD, drive the grandmother to the clinic, keep inhalers in the benevolence closet, and open its mouth at the county meeting for the block that cannot move — "Open thy mouth for the dumb" (Proverbs 31:8). The same church remembers the coal town: the miner is the ox that is not to be muzzled (Deuteronomy 25:4), and a Body that lobbies for cleaner air owes him a job, not a lecture. And every believer prays for the rulers by name — "For kings, and for all that are in authority" (1 Timothy 2:2) — and seeks "the peace of the city" (Jeremiah 29:7) with a just weight in one hand and mercy in the other. This platform’s own posture models the same thing on a small scale: knowledge kept on machines the family owns, run lean, with nothing wasted. Righteous engagement names the false balance; it is completed by keeping the garden you were actually given.',
    anchor: {
      ref: 'Genesis 2:15; Psalms 24:1',
      theme: 'The earth is His — "The earth is the LORD’s, and the fulness thereof" — and our dominion is a keeper’s job: "to dress it and to keep it." Weigh every cost-benefit claim with a just weight that has two pans, name who breathes the smoke first, refuse to burn the earth as ours or to worship it as god, and pray for the ruler who signs.',
    },
  },

  // ---- STAGE 5 — REFLECTION + SKILL ----
  reflection: {
    skill: 'When a policy headline lands with a giant number on each side: PAUSE. Separate the documented (what was signed, when, what the agency itself says, what the established science already shows) from the modeled (any projection of future deaths or savings — name its assumptions, and do not dismiss it). Say the documented plainly — including documented damage. Then put BOTH numbers on a just weight and state what each one measures. Hear the administration, the health side, the coal town, and the downwind block each at its strongest. Let the Word settle the frame: His earth, our keeping, two pans, the poor first. Then respond as a keeper and a neighbor — and pray for the ruler by name.',
    practice: 'Take the sentence "the EPA says the changes save the energy industry more than $300 billion; AP research says the rules could prevent about 30,000 deaths." Write four lines: (1) one sentence of what is DOCUMENTED, with a source and date; (2) one sentence stating what each number actually measures (which pan, whose projection, what assumptions); (3) one sentence of the strongest case for the side you least agree with; (4) one sentence on what the Word says about the land and the poor — and one concrete act of keeping or neighboring you or your church can do this week.',
    prompts: [
      'Which parts of the newsletter are documented (the repeal, the $310 billion projection, the sixth-largest-emitter analysis, the 330 retirements) and which are modeled or framed (the 30,000 deaths, "coincide with data centers")? How would you check each?',
      '"$300 billion saved" counts one pan. What would a just weight (Proverbs 11:1; 20:23) require on the other pan before the comparison is honest — and what would it require of the "30,000" figure before it is repeated?',
      'Walk through Genesis 2:15 and Psalms 24:1 together: if the earth is His and we are put in it to dress and keep it, what does that forbid — and what does it NOT forbid (Genesis 1:28; Genesis 9:3; 1 Timothy 4:4)?',
      'Exodus 23:11 ties the land’s rest to the poor eating. Isaiah 10:1-2 and Proverbs 29:7 tie decrees to the poor’s cause. Who breathes a power plant’s smoke first in your county — and who carried the cost when its plant closed?',
      'Deuteronomy 25:4 protects the laboring ox; Deuteronomy 22:6-7 protects the nesting bird. How do those two verses speak to the coal worker AND the downwind child at the same time?',
      'The Word commands prayer "For kings, and for all that are in authority" (1 Timothy 2:2). Name the officials on both sides of this rule and pray for them by name — without a sneer. What changed in you when you did?',
      'In your own house: what would "count the cost" (Luke 14:28) of your electricity look like this month — and what one thing could your church do for the members with asthma on the next bad-air day?',
    ],
  },

  // ---- Age-appropriate renderings (kids use the app) ----
  levels: {
    child: 'A big government office called the EPA changed some rules about power plants. Power plants make the electricity for our lights and phones. Some of them burn coal or gas, and that makes smoke. Here is what we know for sure: that smoke can make people sick, especially grandparents, babies, and kids with asthma. Some leaders say the old rules cost too much money and that we need lots more power right now. Other people say the rules kept the air cleaner and kept people well. Grown-ups will argue about the numbers. Here is what Yahweh says first. He made the earth, and it is His: "The earth is the LORD’s, and the fulness thereof" (Psalms 24:1). He put people in the garden "to dress it and to keep it" (Genesis 2:15). That means we take care of the earth like a gift we are keeping for Him. It is not ours to wreck, and it is not a god to worship. It is His, and we are the keepers. Yahweh also loves fair scales. A fair scale weighs both sides, the money AND the smoke. And He tells us to pray for our leaders (1 Timothy 2:1-2). So we do three things. We pray for the people in charge. We turn off lights we are not using. And we help a neighbor who is sick. We never say a person is bad. We say the air matters, because He made it, and we help.',
    teen: 'A newsletter says the EPA just wiped out the power-plant carbon rules, that the industry saves "$300 billion," and that AP research says the rules could have prevented "30,000 deaths." Run the moves before you repost either number. (1) Sort documented from modeled. Documented: on September 14, 2026 the EPA signed a partial repeal of the 2024 carbon standards for coal and new gas plants; the agency itself projects $310 billion in avoided industry cost; a second proposal would erase the remaining standards; the U.S. power sector, on 2022 data, out-emits every nation but five; and coal fine-particle smoke has shortened hundreds of thousands of American lives — that one is a record, not a forecast. Modeled: the 30,000 is the AP’s reviewed projection for about thirty rules together, mostly heat deaths worldwide from added carbon, built on a formula and an emissions scenario. Say "modeled, with these assumptions." Do not say "no one knows," and do not say "30,000 bodies." (2) Hear each side at its strongest: the administration says an unmeetable standard is a closure order and the grid is under real strain from data centers; the health side says a savings figure that counts one pan is advertising; the coal town says it has already paid; the downwind block says the cost moves from a spreadsheet to a lung — theirs. (3) Now the Word. "The earth is the LORD’s" (Psalms 24:1), and we are in it "to dress it and to keep it" (Genesis 2:15) — so it is not ours to burn AND it is not a god to serve (Romans 1:25). "A false balance is abomination to the LORD" (Proverbs 11:1): two pans, honestly labeled, every time. And the decree that lands on "the poor of my people" (Isaiah 10:2) is one the Word has already weighed, whatever anyone intended. (4) Respond like a keeper, not a comment section: cut the watts you waste, show up for the kid with asthma and the miner without a job, and pray for the officials on both sides by name (1 Timothy 2:1-2). That is discernment with a spine and a heart.',
    senior: 'For the seasoned believer, this lesson is about weighing a charged policy fight with the Word’s own doctrine of the land, in an age that rewards both denial and alarm. First, the documented record, stated plainly: on September 14, 2026 the EPA finalized a partial repeal of the 2024 Carbon Pollution Standards — the 90%-capture-by-2032-or-retire-by-2039 guideline for existing coal plants and the carbon-capture standard for new baseload gas turbines — projecting $310 billion in avoided compliance cost, and issued a supplemental proposal to rescind every remaining power-plant greenhouse-gas standard on a "no significant contribution" theory, with the 2009 endangerment finding already rescinded for vehicles in February and before the D.C. Circuit; the sector emits more than 1.5 billion tons a year and, on 2022 data, would rank sixth among nations; and coal fine-particle pollution is established to have shortened roughly 460,000 American lives between 1999 and 2020, a toll that fell as plants closed. Second, the categories kept honestly (Proverbs 18:13; 18:17): the AP’s 30,000 is a reviewed, modeled projection across a slate of about thirty rules — about a third U.S. deaths from soot, mercury, and lead rules, two-thirds global heat deaths from a carbon-mortality formula — and the EDF and NYU figures are their authors’ projections; the administration’s reliability and cost warnings are real risks, not pretexts to be waved away; the Sierra Club’s retirement count is theirs. Third — where the Word settles what the debate cannot — the frame: the earth is His (Psalms 24:1; Leviticus 25:23), dominion is a keeper’s commission (Genesis 1:28; 2:15; 1 Corinthians 4:2), the land is not to be defiled and is given rest for the poor’s sake (Numbers 35:33-34; Exodus 23:11; Leviticus 25:4), the creature and the laborer are both in His regard (Proverbs 12:10; Deuteronomy 25:4; 22:6-7), and yet the creation is never to be served as the Creator (Romans 1:20-25; Colossians 1:16-17; 1 Timothy 4:4). The just weight (Proverbs 11:1; 20:23; 16:11) is the verse for the two giant numbers: one pan called a whole scale is a divers weight, and so is a model called a count. And the placement of the cost is already judged by the Word without any motive proven: the decree that turns aside the needy (Isaiah 10:1-2), the ruler who regards not the cause of the poor (Proverbs 29:7). The verdict on any official’s soul stays with Yahweh; the verdict on a false balance is written. Then let the response mature past reaction into the Body’s long vocation — keepers of what they were given, neighbors to the downwind and to the coal town alike, and intercessors for the rulers by command (1 Timothy 2:1-2; Jeremiah 29:7) — because every work, including this one, enters the court where the books are opened (Ecclesiastes 12:14; Revelation 20:12).',
  },

  // ---- Discernment-skill quiz ----
  quiz: {
    questions: [
      {
        q: 'The newsletter says the EPA "saves the energy industry more than $300 billion." What is the discernment move?',
        options: ['Dismiss it — agencies always inflate', 'Check the source: it is the EPA’s own projection ($310 billion) of avoided industry compliance cost — one pan of the scale, said plainly as that', 'Accept it as the net benefit of the repeal'],
        answer: 1,
        explain: 'A documented number is said plainly — and labeled for what it measures. It counts what the industry no longer spends, not the health and climate costs on the other pan (Proverbs 11:1).',
      },
      {
        q: '"AP research says the regulations could prevent about 30,000 deaths." Which label fits, and why?',
        options: ['Documented body count of this rule', 'A reviewed, modeled projection across about thirty rules — roughly 10,000 U.S. deaths from soot, mercury, and lead rules plus about 25,000 global heat deaths from a carbon formula — carried with its assumptions, not dismissed', 'A lie — you cannot count deaths that have not happened'],
        answer: 1,
        explain: 'Tier 2 (DR-0100), flagged narrowly: name the model and its inputs. "No one knows" is false skepticism; "30,000 bodies" is over-claiming. Both fail the just weight.',
      },
      {
        q: 'Which of these is ESTABLISHED, not modeled?',
        options: ['That this repeal will cause a specific number of future deaths', 'That coal fine-particle pollution shortened roughly 460,000 American lives between 1999 and 2020, falling as plants closed (Science, 2023)', 'That data centers alone explain the rise in electricity bills'],
        answer: 1,
        explain: 'Documented damage is stated plainly (Tier 1). Future projections are models; the data-center share of price rises is genuinely debated (Tier 2). Keep the tiers apart.',
      },
      {
        q: 'What does the Word say to "the earth is ours to burn"?',
        options: ['Nothing — the Bible is silent on the environment', '"The earth is the LORD’s" (Psalms 24:1) and man was put in the garden "to dress it and to keep it" (Genesis 2:15) — dominion is a keeper’s job, and the land is not to be polluted (Numbers 35:33-34)', 'That the earth is sacred and must not be used'],
        answer: 1,
        explain: 'The Word corrects the over-reach without swinging to the opposite one: real dominion (Genesis 1:28), real stewardship (1 Corinthians 4:2), and a land He watches and forbids us to defile.',
      },
      {
        q: 'What does the Word say to "creation is god" or "people are the plague on the planet"?',
        options: ['It agrees — nature is holy', 'It names those who "worshipped and served the creature more than the Creator" (Romans 1:25), blesses fruitfulness (Genesis 1:28), and calls every creature good when received with thanksgiving (1 Timothy 4:4) — the earth is His witness, not a deity', 'It says the earth does not matter because it will burn anyway'],
        answer: 1,
        explain: 'Tier 3 cuts both ways: the Word corrects the ideological over-reach on either side, and the true data underneath (the smoke is real; the land is His) still stands.',
      },
      {
        q: 'The administration says the grid is under strain and an unmeetable standard is a closure order. The health side says a one-pan savings figure is advertising. What does the Word require of you?',
        options: ['Pick the side your friends are on', 'Hear each at its strongest (Proverbs 18:17), weigh both pans with a just weight, and name where the cost lands — on the poor and the downwind first (Isaiah 10:1-2; Proverbs 29:7) and on the coal town too (Deuteronomy 25:4)', 'Refuse to have any view since experts disagree'],
        answer: 1,
        explain: 'Steelman, then weigh, then name the fruit. The Word does not need any official’s motive proven to say where a cost fell.',
      },
      {
        q: 'What does a believer actually DO after sorting this headline?',
        options: ['Post the scarier number', 'Keep the garden you were given (cut wasted watts, count the cost), show up for the neighbor with asthma and the laid-off miner, and pray for the officials on both sides by name (1 Timothy 2:1-2; Matthew 25:40)', 'Wait for the court to decide before caring'],
        answer: 1,
        explain: 'Stewardship and intercession are commands, not moods. The two courts are both real; the believer acts in this one while trusting the other (Ecclesiastes 12:14).',
      },
    ],
  },
};

// =============================================================================
// ISSUE 16 — The trades are hiring (wi-the-trades-are-hiring-2026).
// Darrell forwarded the 2026-09-15 Morning Brew newsletter (Smokin’) with the
// single word Lesson. — build input. Its bullet, Not all job markets are equal,
// reports a Burning Glass Institute analysis (via the Wall Street Journal):
// workers 22–34 without a degree are in one of the best job markets in nearly
// two decades, unemployment near its lowest since 2003, driven by a drop in
// immigration and retiring blue-collar workers, while unemployment rises for
// bachelor’s holders as AI takes entry-level white-collar work; degree holders
// 25–54 still averaged 2.7% vs 4.7% for high-school-only. Companion to Issue 11
// (the debt a degree can cost); this one is about WORK. Handled under DR-0100’s
// three tiers with live web search 2026-09-15; every verse fetched verbatim from
// the repo KJV and gated in world-issues-verse-integrity.test.js.
// =============================================================================
const TRADES_HIRING_ISSUE = {
  id: 'wi-the-trades-are-hiring-2026',
  title: 'The trades are hiring — the non-degree job market, the white-collar squeeze, and the Word on work with your hands',
  subject: { name: 'the 2026 job market for workers without a degree, and the Word on work with your hands', kind: 'economy-and-work', isNamedRealPerson: false },
  skill: 'Take a headline about who is getting hired and learn how the Word weighs it: state the documented numbers plainly with their sources and dates (the Burning Glass analysis, the BLS rates, what an apprenticeship pays and what a degree costs in Illinois), flag the genuinely open parts narrowly (how much of the graduate squeeze is AI; how long the shift lasts), let the Word correct the two slogans that ride on the data ("college is a scam" and "a trade is second-class"), and then hear what Yahweh says about work itself — given before the fall, honored in the craftsman, practiced by the carpenter and the tentmaker, and paid on time.',
  source: {
    creator: 'Morning Brew (reporting a Burning Glass Institute analysis published by the Wall Street Journal)',
    medium: 'newsletter',
    title: 'Smokin’ — "Not all job markets are equal"',
    url: 'https://www.morningbrew.com/',
    asOf: '2026-09-15',
    note: 'Darrell forwarded the 2026-09-15 edition with the single word "Lesson." The bullet summarizes a Burning Glass Institute analysis reported by the Wall Street Journal in early September 2026 (data through July 2026). A second bullet in the same edition — the 10-year Treasury yield briefly topping 5% on 2026-09-14 — is carried here only as context on the cost of borrowing. We treat the newsletter as a SUMMARY of others’ research: every number was independently checked and is carried with its own source and date.',
  },

  // ---- STAGE 1 — THE CLAIM(S): the newsletter's points, AS MADE, each labeled. ----
  claims: [
    {
      id: 'c-best-market',
      text: 'Workers 22–34 without college degrees are having one of the best job markets in nearly two decades — one of the lowest unemployment rates since 2003 (Burning Glass Institute).',
      label: 'claim',
      attribution: 'Morning Brew, summarizing the Burning Glass Institute analysis reported by the Wall Street Journal',
      note: 'Documented: the Burning Glass Institute (chief economist Gad Levanon) compared each group’s current unemployment with its own range since 2003, using data through July 2026. The claim is RELATIVE to the group’s own history — which the newsletter states correctly.',
    },
    {
      id: 'c-causes',
      text: 'The cause is a drop in immigration plus retiring blue-collar workers.',
      label: 'claim',
      attribution: 'Morning Brew, summarizing the Burning Glass Institute / WSJ analysis',
      note: 'Both drivers are documented (Census Bureau migration estimates; Associated Builders and Contractors on retirements). How much each contributes is not measured by any source we found — carried as documented drivers, unmeasured shares.',
    },
    {
      id: 'c-grads-ai',
      text: 'Unemployment is rising for bachelor’s-degree holders amid AI replacing entry-level white-collar roles.',
      label: 'claim',
      attribution: 'Morning Brew, summarizing the Burning Glass Institute / WSJ analysis',
      note: 'The RISE for young graduates is documented (New York Fed: 5.6% unemployment and 42% underemployment for recent graduates through Q2 2026). The AI link is partly documented (Stanford’s payroll-data study finds a real gap for 22–25-year-olds in AI-exposed occupations) — but how much of the squeeze is AI, versus the doubling of some majors and slower hiring generally, is genuinely open.',
    },
    {
      id: 'c-unusual',
      text: 'This divergence is unusual — the two groups tracked each other in the pandemic and after 2008.',
      label: 'claim',
      attribution: 'Morning Brew, summarizing the Burning Glass Institute / WSJ analysis',
      note: 'Documented in the same analysis: the divergence has been running since about 2023. Whether it lasts is a forecast (Stage 2).',
    },
    {
      id: 'c-degree-still-lower',
      text: 'Big picture: degree holders 25–54 averaged 2.7% unemployment for the year ending July vs 4.7% for high-school-only; the more hands-on and in-person the job, the lower its current unemployment relative to its history (WSJ).',
      label: 'claim',
      attribution: 'Morning Brew, citing the Wall Street Journal',
      note: 'Documented. The BLS single-month figure for August 2026 (ages 25 and over) reads 2.7% for bachelor’s and higher and 4.4% for high-school-only; the newsletter’s 4.7% is the WSJ’s twelve-month average for ages 25–54. Both stand; the precision is noted so no one calls the true number wrong.',
    },
    {
      id: 'c-two-slogans',
      text: '"College is a scam" — and its mirror, "a trade is second-class work."',
      label: 'opinion',
      attribution: 'Not the newsletter — the two slogans that ride on this data in the wider conversation, carried here so the Word can correct both',
      note: 'Neither is in the newsletter. Both over-reach the data in opposite directions, and the Word corrects each (Stage 4) while the true numbers under both stay standing.',
    },
  ],

  // ---- STAGE 2 — VERIFIABLE vs INTERPRETATION ----
  verifiable: [
    {
      id: 'f-bgi-wsj',
      statement: 'A Burning Glass Institute analysis reported by the Wall Street Journal (early September 2026, data through July 2026) finds unemployment for 22–34-year-olds without a degree near the lowest levels since 2003, while conditions for college graduates of the same age are among the weakest outside the Great Recession and the pandemic. Chief economist Gad Levanon: "There’s a rapidly growing supply of people with a bachelor’s degree, and you have a rapid decline of people who don’t"; "I don’t think it’s a temporary thing." Prime-age (25–54) degree holders averaged 2.7% unemployment over the twelve months ending July versus 4.7% for high-school-only; the more physical and in-person the work, the lower its unemployment by historical standards.',
      status: 'documented',
      sources: [
        { title: 'Americans Without College Degrees Are Having One of the Best Job Markets in Years (WSJ, syndicated)', publisher: 'The Wall Street Journal via To Vima', url: 'https://www.tovima.com/wsj/americans-without-college-degrees-are-having-one-of-the-best-job-markets-in-years', asOf: '2026-09-15' },
        { title: 'Workers Without College Degrees Are Thriving In A Tough Job Market', publisher: 'Black Enterprise', url: 'https://www.blackenterprise.com/workers-without-college-degrees-best-job-market/', asOf: '2026-09-15' },
        { title: 'Unemployment for Non-College Grads Is at Near-Record Low', publisher: 'Newser', url: 'https://www.newser.com/story/396041/young-workers-sans-college-degrees-see-strong-job-market.html', asOf: '2026-09-15' },
      ],
      note: 'Verified by live web search 2026-09-15. The WSJ original is paywalled; the syndicated text and two independent write-ups agree on every figure. "Best market" is measured against each group’s OWN range since 2003 — a relative claim, correctly stated.',
    },
    {
      id: 'f-bls-august',
      statement: 'BLS (Current Population Survey, seasonally adjusted, ages 25 and over): in August 2026 unemployment was 4.4% for high-school graduates with no college, 3.7% for some college or an associate degree, and 2.7% for a bachelor’s degree and higher; 4.7% for those without a high-school diploma. The degree still carries the lowest unemployment rate in absolute terms.',
      status: 'documented',
      sources: [
        { title: 'Unemployment rate remains lower for people with more education (The Economics Daily)', publisher: 'U.S. Bureau of Labor Statistics', url: 'https://www.bls.gov/opub/ted/2026/unemployment-rate-remains-lower-for-people-with-more-education.htm', asOf: '2026-09-15' },
        { title: 'Unemployment rate for people with less than a high school diploma was 4.7 percent in August 2026 (The Economics Daily)', publisher: 'U.S. Bureau of Labor Statistics', url: 'https://www.bls.gov/opub/ted/2026/unemployment-rate-for-those-with-less-than-a-high-school-diploma-was-4-7-percent-in-august-2026.htm', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. This is the absolute picture that sits under the relative one: a degree still has the lowest rate; the non-degree group’s rate is low FOR ITSELF. Both are true at once.',
    },
    {
      id: 'f-recent-grads',
      statement: 'Federal Reserve Bank of New York, "The Labor Market for Recent College Graduates" (ages 22–27, bachelor’s or higher): through the second quarter of 2026 the unemployment rate held at about 5.6% and the underemployment rate edged up to 42%. Recent graduates have carried a higher unemployment rate than the average worker — a reversal of the long-run pattern.',
      status: 'documented',
      sources: [
        { title: 'The Labor Market for Recent College Graduates', publisher: 'Federal Reserve Bank of New York', url: 'https://www.newyorkfed.org/research/college-labor-market', asOf: '2026-09-15' },
        { title: 'Unemployment Rate for Recent College Graduates Holds at 5.6%, NY Fed Reports', publisher: 'Bloomberg', url: 'https://www.bloomberg.com/news/articles/2026-05-05/unemployment-for-recent-college-grads-remains-high-ny-fed-says', asOf: '2026-09-15' },
        { title: 'The Job Market for Recent College Grads in 5 Charts', publisher: 'Inside Higher Ed', url: 'https://www.insidehighered.com/news/students/careers/2026/06/29/job-market-recent-college-grads-5-charts', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. The squeeze on the young graduate is real and measured — it is not a vibe. Underemployment (a degree holder in a job that does not require one) is the quieter half of the number.',
    },
    {
      id: 'f-ai-link',
      statement: 'Stanford Digital Economy Lab, "Canaries in the Coal Mine" (ADP payroll data; August 2026 update): employment of 22–25-year-olds in the most AI-exposed occupations (software development, customer service) now sits about 19% below where it would be had it kept pace with less-exposed peers — up from a 13% relative decline in the 2025 paper — while the authors find NO widespread, economy-wide displacement. The Economic Policy Institute’s Class of 2026 review calls the graduate picture "more mixed than the headlines suggest." How much of the graduate squeeze is AI, versus the doubling of computer-science degrees into fewer openings, higher interest rates, and post-pandemic over-hiring unwinding, is not settled by any source we found.',
      status: 'partly-documented',
      sources: [
        { title: 'No Widespread Displacement, but the AI Employment Gap for Young Workers Has Widened to 19%', publisher: 'Stanford Digital Economy Lab', url: 'https://digitaleconomy.stanford.edu/news/canariesaug26/', asOf: '2026-09-15' },
        { title: 'Canaries in the Coal Mine? Six Facts about the Recent Employment Effects of Artificial Intelligence', publisher: 'Stanford Digital Economy Lab (Brynjolfsson, Chandar, Chen)', url: 'https://digitaleconomy.stanford.edu/publication/canaries-in-the-coal-mine-six-facts-about-the-recent-employment-effects-of-artificial-intelligence/', asOf: '2026-09-15' },
        { title: 'Young college graduates face a weaker labor market — but a more mixed picture than the headlines suggest: Class of 2026', publisher: 'Economic Policy Institute', url: 'https://www.epi.org/blog/class-of-2026-young-college-graduates-face-a-weaker-labor-market-but-a-more-mixed-picture-than-the-headlines-suggest/', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. This is Tier 2, stated narrowly: the AI effect on the MOST-EXPOSED entry-level occupations is measured and real; "AI is replacing entry-level white-collar work" as a blanket cause of the whole graduate squeeze is not proven. Say the measured part plainly; keep the share open.',
    },
    {
      id: 'f-supply',
      statement: 'The supply side is documented. Census Bureau (January 2026): net international migration peaked at about 2.7 million in 2024 and is projected to fall to roughly 321,000 in 2026. Associated Builders and Contractors (January 2026): construction must attract about 349,000 net new workers in 2026 and 456,000 in 2027, and more than half of the 2026 figure replaces retiring workers rather than supporting growth; nearly 40% of skilled construction workers are over 45, and in the electrical trades nearly one in five is over 55. ABC chief economist Anirban Basu attributes the gap mainly to retirements plus demand from megaprojects such as AI data centers.',
      status: 'documented',
      sources: [
        { title: 'New Population Estimates Show Historic Decline in Net International Migration', publisher: 'U.S. Census Bureau', url: 'https://census.gov/newsroom/blogs/random-samplings/2026/01/historic-decline-in-net-international-migration.html', asOf: '2026-09-15' },
        { title: 'ABC: Construction Industry Must Attract 349,000 Workers in 2026 Despite Macroeconomic Headwinds', publisher: 'Associated Builders and Contractors', url: 'https://www.abc.org/News-Media/News-Releases/abc-construction-industry-must-attract-349000-workers-in-2026-despite-macroeconomic-headwinds', asOf: '2026-09-15' },
        { title: 'Construction’s Triple Labor Crisis: Retirements, Immigration Enforcement, and the Deepening Electrician Shortage', publisher: 'Westside Construction Group', url: 'https://www.buildwcg.com/blog-posts/construction-labor-crisis-retirements-immigration-electricians-2026', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. The newsletter’s two causes are real. The one thing not measured is the SHARE each contributes — and the AI-data-center demand that Basu names is a third driver the newsletter left out: the same technology squeezing the entry-level office is hiring the electricians who build the buildings it runs in.',
    },
    {
      id: 'f-pay-and-openings',
      statement: 'What the trades pay (BLS, May 2025 wage data, via the Occupational Outlook Handbook): electricians median $34.37/hour (mean about $71,490/year), employment projected to grow 9% from 2025 to 2035 with about 72,700 openings a year; plumbers, pipefitters and steamfitters median $34.70/hour; HVAC mechanics and installers median $32.75/hour (mean about $68,120). Typical entry is a high-school diploma plus a four-to-five-year paid apprenticeship. U.S. Department of Labor / GAO: registered-apprenticeship completers earned average first-year wages of about $80,000 (April 2022–March 2023 exits) — higher than associate-degree holders; about 940,000 people were in registered apprenticeships in FY 2024.',
      status: 'documented',
      sources: [
        { title: 'Electricians — Occupational Outlook Handbook', publisher: 'U.S. Bureau of Labor Statistics', url: 'https://www.bls.gov/ooh/construction-and-extraction/electricians.htm', asOf: '2026-09-15' },
        { title: 'BLS 2025 OEWS Release — Key Numbers for Every Major Trade', publisher: 'SkilledTradesIQ (summarizing BLS OEWS May 2025)', url: 'https://skilledtradesiq.com/salaries/bls-2025-oews-release/', asOf: '2026-09-15' },
        { title: 'Apprenticeship: Earn-and-Learn Opportunities Can Benefit Workers and Employers (GAO-25-107040)', publisher: 'U.S. Government Accountability Office', url: 'https://www.gao.gov/products/gao-25-107040', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. Medians are national; Chicago-area union scales run higher (next item). The $80,000 figure is an AVERAGE across all registered apprenticeships, not a promise for any one trade or region.',
    },
    {
      id: 'f-illinois-cost',
      statement: 'The Illinois comparison, at sticker price. University of Illinois Urbana-Champaign, 2026–27, in-state: base tuition $14,768 plus fees $3,292, and about $32,068 a year with room and board — roughly $128,000 over four years before aid. Bachelor’s borrowers nationally took out an average of $35,639 (2025 graduates); Illinois borrowers carry about $29,535 on average. Parkland College (Champaign) estimates $9,642 in tuition and fees for an Illinois resident in 2026. Chicago union apprenticeships charge no tuition and pay from day one: UA Local 130 (plumbers) starts apprentices at $20.55/hour and reaches a journeyman rate of $60.50/hour after five years; IBEW Local 134 (electricians) runs a five-year program that opens with eleven weeks of full-time classroom instruction, with apprentices paid a rising percentage of a journeyman rate listed at $55.55 on the 2024–25 program sheet. On the other side of the ledger the degree still pays on average across a lifetime: Georgetown’s Center on Education and the Workforce puts median lifetime earnings at $2.8 million for a bachelor’s versus $1.6 million for a high-school diploma, and BLS "Education Pays" (2024) puts median weekly earnings at $1,543 versus $930.',
      status: 'documented',
      sources: [
        { title: '2026-2027 Academic Year Undergrad Tuition Rates', publisher: 'University of Illinois Office of the Registrar', url: 'https://registrar.illinois.edu/ug-tuition-rates-2627/', asOf: '2026-09-15' },
        { title: 'Tuition and Cost of Attendance, University of Illinois at Urbana-Champaign', publisher: 'University of Illinois', url: 'https://cost.illinois.edu/', asOf: '2026-09-15' },
        { title: 'Average Student Loan Debt for a Bachelor’s Degree: 2025 Analysis', publisher: 'EducationData.org', url: 'https://educationdata.org/average-debt-for-a-bachelors-degree', asOf: '2026-09-15' },
        { title: 'Student Loans in Illinois — Average Debt, Forgiveness & Rates', publisher: 'StudLoans', url: 'https://studloans.com/state/illinois', asOf: '2026-09-15' },
        { title: 'Parkland College — Tuition & Fees, Net Price', publisher: 'CollegeTuitionCompare', url: 'https://www.collegetuitioncompare.com/edu/147916/parkland-college/tuition/', asOf: '2026-09-15' },
        { title: 'Illinois Apprenticeship Programs 2026 — Electrician, Plumber, HVAC & More', publisher: 'Hardhat Careers', url: 'https://hardhat.careers/apprenticeships-illinois', asOf: '2026-09-15' },
        { title: 'IBEW Local 134 Apprenticeship — Chicago Official Sources', publisher: 'SparkShift', url: 'https://sparkshift.app/ibew-local-134', asOf: '2026-09-15' },
        { title: 'The College Payoff: Education, Occupations, Lifetime Earnings', publisher: 'Georgetown University Center on Education and the Workforce', url: 'https://cew.georgetown.edu/cew-reports/the-college-payoff/', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15 by live search. Sticker prices, not net prices — aid changes the college figure for many families, and union wage sheets change with each contract (the Local 134 rate is the last published sheet, not a 2026 contract). Both paths are stated at their real, dated numbers so a household can count the cost with real figures.',
    },
    {
      id: 'f-cost-of-debt',
      statement: 'Context on the price of borrowing: on 2026-09-14 the 10-year Treasury yield briefly touched 5.01% — the first time above 5% since 2023 and, had it held above 5.02%, the highest since July 2007 — as oil-driven inflation fears pushed markets to price a Federal Reserve rate increase.',
      status: 'documented',
      sources: [
        { title: '10-year Treasury yield briefly tops 5% for the first time since 2023', publisher: 'Yahoo Finance', url: 'https://finance.yahoo.com/markets/article/10-year-treasury-yield-briefly-tops-5-for-the-first-time-since-2023-123457398.html', asOf: '2026-09-15' },
        { title: '10-year Treasury yield hits 5% before reversing as traders await Fed meeting', publisher: 'CNBC', url: 'https://www.cnbc.com/2026/09/14/10-year-us-treasury-is-closing-in-on-5percent.html', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. Carried only as context: a borrowed degree is priced in a world where borrowing itself has gotten dearer, which makes counting the cost before the loan (Issue 11) more urgent, not less.',
    },
  ],
  interpretation: [
    {
      id: 'n-relative-and-absolute',
      statement: '"Best job market in two decades" is a claim about the non-degree group MEASURED AGAINST ITSELF; "the degree still has lower unemployment" is a claim about the two groups measured against each other. Both are documented and both are true at the same moment (2.7% vs 4.7% on the WSJ twelve-month average; 2.7% vs 4.4% on the BLS August month). A reader who keeps only one of them is repeating half a fact.',
      restsOn: ['f-bgi-wsj', 'f-bls-august'],
    },
    {
      id: 'n-ai-share-open',
      statement: 'The graduate squeeze is documented; the AI link is measured only for the most-exposed entry-level occupations, where it is real (about 19% below trend for 22–25-year-olds). "AI is replacing entry-level white-collar roles" as the cause of the whole divergence is an inference. Say the measured part plainly; keep the share honestly open; do not smear "no one knows" over the part that is known.',
      restsOn: ['f-recent-grads', 'f-ai-link'],
    },
    {
      id: 'n-durability',
      statement: '"I don’t think it’s a temporary thing" is a forecast by a credible economist, not a finding. Retirements and birth rates below replacement are slow-moving and will not reverse quickly; immigration policy can change in a single year; AI’s effect is the least predictable of the three. The honest statement is: the supply gap in the trades is structural for years; the exact size of the non-degree advantage is not.',
      restsOn: ['f-bgi-wsj', 'f-supply'],
    },
    {
      id: 'n-two-slogans-over-reach',
      statement: '"College is a scam" over-reaches the data in one direction: the degree still carries the lowest unemployment rate and, on average, about $1.2 million more in lifetime earnings — what is true is that the degree is now a PRICED decision that can be lost, not a guarantee. "A trade is second-class work" over-reaches in the other: a Chicago apprentice is paid from day one with no tuition, reaches $55–60 an hour as a journeyman, and registered-apprenticeship completers average about $80,000 in their first year out. The Word corrects both slogans (Stage 4); the numbers under both stand.',
      restsOn: ['f-bls-august', 'f-pay-and-openings', 'f-illinois-cost'],
    },
  ],

  // ---- STAGE 3 — PERSPECTIVES on the UNRESOLVED parts ----
  perspectives: [
    {
      id: 'p-trades',
      label: 'The trades case — paid to learn, owed nothing, needed for decades',
      heldBy: 'Tradesmen, union training directors, and the families who watched a degree turn into a loan',
      steelman: 'At its strongest: a young person can walk into a five-year apprenticeship in Chicago with a high-school diploma, be paid from the first week, owe no tuition at the end, and stand at $55 to $60 an hour as a journeyman while a classmate is still carrying $35,000 of loans into a 5.6% unemployment rate. The demand is not a fad — it is arithmetic: the men who wired and plumbed this country are retiring faster than they are replaced, immigration has fallen by about ninety percent from its peak, and the data centers the AI boom needs are built by electricians. A trade cannot be off-shored, cannot be done by a model, and pays the day it is learned. On this view the household that steers a capable child toward a paid apprenticeship is not settling; it is counting the cost the way the Word tells a builder to.',
    },
    {
      id: 'p-degree',
      label: 'The degree-still-pays case — 2.7% versus 4.7%',
      heldBy: 'Labor economists, the Georgetown Center on Education and the Workforce, and most parents',
      steelman: 'Heard fairly: every headline about the non-degree boom is a RELATIVE claim, and the absolute picture has not changed — prime-age degree holders averaged 2.7% unemployment against 4.7% for high-school-only, and over a working life the median bachelor’s earns about $2.8 million to the diploma’s $1.6 million. The recent-graduate squeeze is real but concentrated in the first years and in a few majors; it says nothing about the nurse, the accountant, the engineer, or the teacher at forty-five. Physical work also carries a body’s cost that shows up at fifty. On this view the lesson of the data is not "skip college" but "choose the degree, the school, and the debt soberly" — which is exactly what Issue 11 taught.',
    },
    {
      id: 'p-graduate',
      label: 'The young graduate squeezed by AI — did the work, followed the rules, and the door moved',
      heldBy: 'The class of 2024–2026, especially in software, customer-facing, and analyst roles',
      steelman: 'At its strongest: a 23-year-old who did everything the last generation told her to do — the grades, the degree, the internship — now applies into a market where entry-level postings in her field have fallen by half since 2022, where employment for her age group in AI-exposed occupations sits about 19% below where it should be, and where 42% of her cohort is working a job that never needed the degree. The loan does not care that the ladder’s bottom rung was removed after she started climbing. This is not laziness and it is not entitlement; it is a documented rearrangement of the entry-level office that landed hardest on the people with the least experience and the most debt. The Word’s answer to her is not a lecture on the trades — it is that her labor is still worthy of its hire, that the door she can open is the one to walk through, and that the house of faith is obligated to help her count the next cost honestly.',
    },
    {
      id: 'p-employer',
      label: 'The employer who cannot find skilled hands',
      heldBy: 'Contractors, facility owners, and training coordinators',
      steelman: 'Heard fairly: a contractor bidding a hospital or a data center today is turning down work because there is no one to do it. The industry needs about 349,000 net new workers this year and 456,000 next, more than half of that just to replace retirements, and an apprentice takes four to five years to become a journeyman. The shortage is not a talking point; it is the reason jobs run late and bids come in high. On this view the churches, schools, and families that still treat the trades as the fallback are the bottleneck — and the employer who pays well, trains honestly, and pays on time is doing the very thing the Word requires of a master.',
    },
  ],

  // ---- STAGE 4 — THE BELIEVER'S LENS ----
  lens: {
    fourD: {
      deepSource: 'WORD FIRST — work is not a curse and it is not a consolation prize; it is the first assignment Yahweh gave a man, before there was any fall to recover from: "And the LORD God took the man, and put him into the garden of Eden to dress it and to keep it." (Genesis 2:15). The sweat came later — "In the sweat of thy face shalt thou eat bread" (Genesis 3:19) — but the work came first, and it was good. So the believer never reads a jobs headline as a verdict on a person’s worth; he reads it as a report on where the work is. THE WORD HONORS THE CRAFTSMAN BY NAME. The first person in Scripture of whom it is written "I have filled him with the spirit of God" was not a prophet or a priest but a builder: "See, I have called by name Bezaleel" (Exodus 31:2) — "And I have filled him with the spirit of God, in wisdom, and in understanding, and in knowledge, and in all manner of workmanship" (Exodus 31:3), "to work in gold, and in silver, and in brass" (Exodus 31:4), "in cutting of stones, to set them, and in carving of timber" (Exodus 31:5). And the gift came with a duty to pass it on: "he hath put in his heart that he may teach" (Exodus 35:34); "Them hath he filled with wisdom of heart, to work all manner of work" (Exodus 35:35). Bezaleel is the pattern for every apprenticeship the Body ever runs — Spirit-given craft, taught to the next hands. THE LORD HIMSELF WORKED WITH HIS HANDS. Nazareth knew Jesus by His trade before it knew Him by His miracles: "Is not this the carpenter, the son of Mary" (Mark 6:3) — "Is not this the carpenter’s son?" (Matthew 13:55). And the most learned man in the New Testament, who was "brought up in this city at the feet of Gamaliel" (Acts 22:3), also kept a trade and used it: "because he was of the same craft, he abode with them, and wrought: for by their occupation they were tentmakers" (Acts 18:3); "these hands have ministered unto my necessities, and to them that were with me" (Acts 20:34). Paul is the living correction of both slogans at once: the scholar who honored learning and worked with his hands, and saw no contradiction. THE WORD COMMANDS WORK — WITH THE HANDS — AS A WITNESS. "to do your own business, and to work with your own hands, as we commanded you" (1 Thessalonians 4:11), "That ye may walk honestly toward them that are without, and that ye may have lack of nothing." (1 Thessalonians 4:12). "if any would not work, neither should he eat" (2 Thessalonians 3:10) — spoken against those "working not at all, but are busybodies" (2 Thessalonians 3:11) — "that with quietness they work, and eat their own bread" (2 Thessalonians 3:12). "let him labour, working with his hands the thing which is good, that he may have to give to him that needeth" (Ephesians 4:28). "In all labour there is profit: but the talk of the lips tendeth only to penury." (Proverbs 14:23). "Whatsoever thy hand findeth to do, do it with thy might" (Ecclesiastes 9:10). And the diligent hand is promised a hearing at the top: "Seest thou a man diligent in his business? he shall stand before kings; he shall not stand before mean men." (Proverbs 22:29). THE WORD PAYS THE LABORER, ON TIME. "the labourer is worthy of his hire" (Luke 10:7); "The labourer is worthy of his reward." (1 Timothy 5:18); "the wages of him that is hired shall not abide with thee all night until the morning" (Leviticus 19:13); "At his day thou shalt give him his hire, neither shall the sun go down upon it" (Deuteronomy 24:15). And withheld wages are heard in heaven: "the hire of the labourers who have reaped down your fields, which is of you kept back by fraud, crieth" (James 5:4). The employer in Stage 3 who cannot find hands is bound by this side of the Word as tightly as the worker is bound by the other. THE WORD COUNTS THE COST BEFORE THE LOAN. "sitteth not down first, and counteth the cost, whether he have sufficient to finish it?" (Luke 14:28). "Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house." (Proverbs 24:27) — income first, then the house; the trade first, then the debt, if any. "Owe no man any thing, but to love one another" (Romans 13:8); "the borrower is servant to the lender" (Proverbs 22:7). NOW THE WORD CORRECTS THE TWO SLOGANS. To "college is a scam": "Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding." (Proverbs 4:7) — Yahweh never scorned learning; He filled Bezaleel with knowledge and understanding, and Paul sat under Gamaliel. What the Word forbids is not the school but the yoke taken without counting, and the true number under the slogan (a degree that must now be CHOSEN soberly, not assumed) still stands. To "a trade is second-class": "the eye cannot say unto the hand, I have no need of thee" (1 Corinthians 12:21); "those members of the body, which seem to be more feeble, are necessary" (1 Corinthians 12:22); "now hath God set the members every one of them in the body, as it hath pleased him" (1 Corinthians 12:18). The carpenter of Nazareth settles the rank of a trade forever. And the true number under THAT slogan — that the degree still pays more on average — also stands; the Word does not need it to be false. SO IN THIS CASE the believer does three things. First, state the documented plainly, because "Prove all things; hold fast that which is good." (1 Thessalonians 5:21): the non-degree market is the best it has been in two decades for that group; the graduate squeeze is real; the trades pay from day one; the degree still has the lower unemployment rate. Second, keep the open parts open — "He that answereth a matter before he heareth it, it is folly and shame unto him." (Proverbs 18:13); "He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him." (Proverbs 18:17): how much is AI, and how long it lasts, are not settled, and we do not pretend. Third, judge the fruit — "by their fruits ye shall know them" (Matthew 7:20) — by the Word’s own measures of work: is the laborer paid, and on time? is the cost counted before the yoke? is the craft honored and taught to the next hands? "Go to the ant, thou sluggard; consider her ways, and be wise" (Proverbs 6:6) — she "Provideth her meat in the summer, and gathereth her food in the harvest." (Proverbs 6:8); the alternative is "Yet a little sleep, a little slumber, a little folding of the hands to sleep" (Proverbs 6:10), and then "So shall thy poverty come as one that travelleth, and thy want as an armed man." (Proverbs 6:11). The market will move again; the Word on work will not.',
      scripture: 'Genesis 2:15; Genesis 3:19; Exodus 31:1-5; Exodus 35:30-35; Mark 6:3; Matthew 13:55; Acts 22:3; Acts 18:3; Acts 20:34-35; 1 Thessalonians 4:11-12; 2 Thessalonians 3:10-12; Ephesians 4:28; Proverbs 14:23; Ecclesiastes 9:10; Proverbs 22:29; Luke 10:7; 1 Timothy 5:18; Leviticus 19:13; Deuteronomy 24:14-15; James 5:4; Luke 14:28; Proverbs 24:27; Romans 13:8; Proverbs 22:7; Proverbs 4:7; 1 Corinthians 12:18-22; 1 Thessalonians 5:21; Proverbs 18:13; Proverbs 18:17; Matthew 7:20; Proverbs 6:6-11; Colossians 3:23-24; Proverbs 22:6; Ecclesiastes 12:14',
    },
    threeD: 'Practically: read the headline exactly as made and sort it. Say the proven parts without a hedge — the non-degree market for 22–34-year-olds is the best it has been in about twenty years for that group (Burning Glass, data through July 2026); recent graduates sit at about 5.6% unemployment and 42% underemployment (New York Fed, Q2 2026); a Chicago plumbing apprentice starts at $20.55 an hour with no tuition and reaches $60.50 as a journeyman; in-state Urbana-Champaign runs about $32,000 a year at sticker; and the degree still carries the lower unemployment rate, 2.7% against 4.7%. Then keep the open parts open: the AI share of the graduate squeeze is measured only in the most-exposed jobs; whether the shift lasts is a forecast. Refuse both slogans — "college is a scam" and "a trade is second-class" — because the Word refuses both, and the data under each still stands. Then do what the Word does with work. In your own house: "Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house." (Proverbs 24:27) — sit down and count the cost of BOTH paths with real, dated numbers before anyone signs anything; put a capable teenager in front of a real tradesman and a real graduate and let him ask both what the first five years actually looked like; and whichever path he takes, "whatsoever ye do, do it heartily, as to the Lord, and not unto men" (Colossians 3:23), "for ye serve the Lord Christ" (Colossians 3:24). In the Body: the church has tradesmen in the pews — treat them as Bezaleel, "he hath put in his heart that he may teach" (Exodus 35:34), and build the apprenticeship pipeline the industry is begging for, out of your own youth. And if you are the employer, the Word’s side for you is short and strict: pay the laborer, and pay him on time.',
    accountability: {
      statement: 'THE TWO COURTS. No court tried the job market, and this lesson accuses no one; a shift in who is hired is not a crime. But the Word never lets accountability shrink to what a court happened to rule on. Every work enters the eternal court — "For God shall bring every work into judgment, with every secret thing, whether it be good, or whether it be evil." (Ecclesiastes 12:14) — where the books are opened (Revelation 20:12) and where withheld wages are already on file: "the hire of the labourers who have reaped down your fields, which is of you kept back by fraud, crieth" (James 5:4). WHAT AN EMPLOYER OWES under the Word: the wage, in full, on time — "At his day thou shalt give him his hire, neither shall the sun go down upon it" (Deuteronomy 24:15); "the wages of him that is hired shall not abide with thee all night until the morning" (Leviticus 19:13); honest training rather than a bait-and-switch; and the just weight in every bid and every paycheck ("a just weight is his delight", Proverbs 11:1). WHAT A WORKER OWES: to work — "if any would not work, neither should he eat" (2 Thessalonians 3:10) — with the hands, heartily, as to the Lord (Colossians 3:23), and to count the cost before taking a yoke (Luke 14:28; Proverbs 22:7). WHAT A HOUSEHOLD AND A CHURCH OWE: "Train up a child in the way he should go: and when he is old, he will not depart from it." (Proverbs 22:6) — which includes training him to work and to count; and to remember that "it is he that giveth thee power to get wealth" (Deuteronomy 8:18), so no path becomes a boast. And the lived reality during this life is not deferred evidence — the graduate under a loan and the apprentice on a job site are both seen and weighed now. No one gets away: "God is not mocked: for whatsoever a man soweth, that shall he also reap" (Galatians 6:7).',
      scripture: 'Ecclesiastes 12:14; Revelation 20:12; James 5:4; Deuteronomy 24:14-15; Leviticus 19:13; Proverbs 11:1; 2 Thessalonians 3:10; Colossians 3:23; Luke 14:28; Proverbs 22:7; Proverbs 22:6; Deuteronomy 8:18; Galatians 6:7',
    },
    benefits: [
      'Both courts, honestly held: no court ruled on who gets hired, and none needs to — while the ETERNAL court holds every wage withheld and every work done, and lands after this life (Ecclesiastes 12:14; James 5:4). You can speak the data plainly without inventing a villain.',
      'Freedom from two slogans at once: "college is a scam" (the degree still pays and still has the lowest unemployment) and "a trade is second-class" (the carpenter of Nazareth, Bezaleel "filled" with the Spirit, Paul the tentmaker). The Word corrects both; the numbers under both stand.',
      'The Word’s own theology of work in your hands: given before the fall (Genesis 2:15), commanded with the hands (1 Thessalonians 4:11), honored in the craftsman (Exodus 31:3), paid on time (Deuteronomy 24:15), done heartily as to the Lord (Colossians 3:23).',
      'A repeatable skill: state the documented number with its source and date, keep the relative claim and the absolute claim both in view, flag the open share narrowly (how much is AI), and judge the fruit by the Word’s measures of work.',
      'A house that counts the cost with real figures: $20.55 an hour and no tuition on one path, $32,000 a year at sticker on the other, and "the borrower is servant to the lender" over both (Proverbs 22:7; Luke 14:28).',
      'A church that apprentices its own: the tradesmen already in the pews are the Bezaleels — "he hath put in his heart that he may teach" (Exodus 35:34) — and the pipeline the industry cannot fill is one the Body can build.',
    ],
    graceNote: 'No condemnation of any soul: not the graduate who is struggling to find the job the degree promised, not the parent who steered a child toward a loan in good faith, not the young man who chose a trade over a classroom, and not the employer who cannot find hands. The Word ranks no lawful work below another and pronounces no verdict on a heart for the path it chose; it asks only that the work be done heartily, the laborer be paid, and the cost be counted. Truth and grace meet in Jesus, who was known in His own town as the carpenter before He was known as the Christ.',
    stewardship: 'The deeper response to a market that is short of skilled hands is to BUILD the hands — the way Yahweh built Bezaleel and told him to teach. The church that raised the HBCUs (Issue 11) can raise apprentices: COLG has tradesmen in its own pews, and PoeTech’s own founder is a building-controls technician who learned a craft with his hands and teaches with the same hands. That is not a footnote; it is the pattern. A congregation can pair every capable teenager with a journeyman for a summer, walk the family through a real union application and a real college cost sheet side by side, and hold both to the Word’s test: is the laborer paid, is the cost counted, is the craft passed on? A household can sit down before the loan, with dated numbers, and hear both a tradesman and a graduate describe their first five years. And whoever takes the degree takes it soberly, owing as little as possible; whoever takes the trade takes it as Bezaleel did, filled and teaching. Righteous engagement names the shift plainly; it is completed by training the next hands.',
    anchor: {
      ref: 'Genesis 2:15; Proverbs 22:29',
      theme: 'Work was Yahweh’s first assignment to a man — "to dress it and to keep it" — and the diligent hand is promised a hearing at the top: "Seest thou a man diligent in his business? he shall stand before kings" — the market will move again; the Word on work will not. Count the cost, honor the craft, pay the laborer, teach the next hands.',
    },
  },

  // ---- STAGE 5 — REFLECTION + SKILL ----
  reflection: {
    skill: 'When a jobs headline lands in your feed: PAUSE. Ask whether the number is RELATIVE (a group measured against its own past) or ABSOLUTE (two groups measured against each other) — and keep both. Say the documented part plainly with its source and date; label the causal part ("because of AI") by how much of it is actually measured; treat "this will last" as a forecast. Then refuse the two slogans the data tempts you toward, because the Word refuses both. Finally let the Word judge the fruit by its own measures of work: is the laborer paid on time, is the cost counted before the yoke, is the craft honored and taught?',
    practice: 'Take the claim "workers without a degree have the best job market in twenty years." Write four lines: (1) one sentence of what is DOCUMENTED, with a source and its date; (2) one sentence stating the ABSOLUTE picture beside the relative one (2.7% vs 4.7%); (3) one sentence on what is genuinely OPEN (the AI share; the durability), stated narrowly; (4) one sentence on what the Word says about work with the hands — and one concrete act this month: sit a young person in your house or church down with a real apprenticeship wage sheet and a real college cost sheet, side by side.',
    prompts: [
      'Which parts of the newsletter are documented (the Burning Glass finding, the 2.7% vs 4.7%, the retirements and the migration decline) and which are inference (how much is AI; whether it lasts)? How would you check each?',
      'The non-degree "best market" is true relative to that group’s own history, and the degree’s lower unemployment is true in absolute terms. Why does keeping both in one sentence strengthen the truth instead of weakening it?',
      'Bezaleel was the first person of whom Scripture says "I have filled him with the spirit of God" — and he was a builder told to teach (Exodus 31:3; 35:34). What does that do to the idea that a trade is second-class work? What does Paul sitting under Gamaliel AND making tents (Acts 22:3; 18:3) do to the idea that college is a scam?',
      'Read the employer’s side of the Word (Leviticus 19:13; Deuteronomy 24:15; James 5:4). If you hire anyone — a contractor, a babysitter, a helper — what does "neither shall the sun go down upon it" require of you this week?',
      'Proverbs 24:27 puts the field before the house. For a seventeen-year-old in your family, what would "Prepare thy work without" look like in the next twelve months — before any loan is signed?',
      'The young graduate in Stage 3 did what she was told and the door moved. What does the Body owe her — and what does the Word say her labor is still worth (Luke 10:7)?',
      'Where is the line between "the market favors the trades right now" (true, dated) and "everyone should skip college" (over-reach)? Practice saying the true part without the slogan.',
    ],
  },

  // ---- Age-appropriate renderings (kids use the app) ----
  levels: {
    child: 'Some grown-ups go to college. Some grown-ups learn a trade, like fixing wires or pipes. Right now, a news story says the people who fix things are getting hired a lot. That is true. It is also true that people with a college degree still find jobs a little more often. Both things are true at once. Here is what Yahweh says about work. The very first job He gave a person was to take care of a garden: "to dress it and to keep it" (Genesis 2:15). Work came before anything went wrong. It is a good gift. Jesus worked with His hands. His town called Him "the carpenter" (Mark 6:3). A man named Bezaleel built beautiful things for Yahweh. The Word says Yahweh filled him with His Spirit to do it. So no honest job is small. Yahweh also says the person who works must be paid, and paid on time. And He says to count the cost before you borrow money, like a builder who checks if he has enough before he starts. When you grow up, you might go to college, or you might learn a trade. Either way, do your work with your whole heart, "as to the Lord" (Colossians 3:23). That is what makes it great.',
    teen: 'A newsletter says workers 22 to 34 without a degree have the best job market in almost twenty years, and that college grads are getting squeezed as AI eats entry-level office jobs. Run the moves before you repeat it. (1) Sort relative from absolute. It is true — Burning Glass Institute, data through July 2026 — that the non-degree group’s unemployment is near its lowest since 2003 FOR THAT GROUP. It is also true that degree holders 25–54 averaged 2.7% unemployment versus 4.7% for high-school-only. Keep both. (2) Sort documented from open. Recent grads really are at about 5.6% unemployment and 42% underemployment (New York Fed). AI really has cut employment for 22–25-year-olds in the most exposed jobs by about 19% relative to peers (Stanford). But how much of the whole squeeze is AI, and whether the shift lasts, are not settled — and the retirements and the ninety-percent drop in immigration behind the trades boom are measured facts. (3) Get the real Illinois numbers: a Chicago plumbing apprentice starts at $20.55 an hour with no tuition and reaches $60.50 as a journeyman after five years; in-state Urbana-Champaign is about $32,000 a year at sticker; bachelor’s borrowers average about $35,000 in loans. Count the cost of BOTH with real figures — "sitteth not down first, and counteth the cost" (Luke 14:28). (4) Refuse both slogans. "College is a scam" — no: "Wisdom is the principal thing; therefore get wisdom" (Proverbs 4:7), and the degree still pays more on average. "A trade is second-class" — no: the first man of whom Scripture says "I have filled him with the spirit of God" (Exodus 31:3) was Bezaleel the craftsman, Jesus was "the carpenter" (Mark 6:3), and Paul, who studied under Gamaliel, made tents (Acts 18:3). (5) Whatever you choose: "work with your own hands" (1 Thessalonians 4:11), "do it heartily, as to the Lord" (Colossians 3:23), and remember the diligent man "shall stand before kings" (Proverbs 22:29). The market will move again. The Word on work will not.',
    senior: 'For the seasoned believer, this lesson is about weighing a jobs headline with the Word’s own theology of work, in an age that sells both panic about college and contempt for the trades. First, the documented record, stated plainly: a Burning Glass Institute analysis (Wall Street Journal, data through July 2026) finds unemployment for 22–34-year-olds without a degree near its lowest since 2003 while their degreed peers face conditions among the weakest outside the Great Recession and the pandemic; BLS shows the degree still carrying the lowest absolute rate (2.7% for bachelor’s and higher against 4.4% for high-school-only in August 2026; 2.7% against 4.7% on the WSJ’s prime-age twelve-month average); the New York Fed puts recent graduates at 5.6% unemployment and 42% underemployment; the Census Bureau projects net migration falling from a 2024 peak near 2.7 million to about 321,000 in 2026; and Associated Builders and Contractors needs 349,000 net new construction workers this year, more than half to replace retirements. In Illinois the comparison is concrete: a UA Local 130 apprentice starts at $20.55 an hour with no tuition and reaches $60.50 as a journeyman; in-state Urbana-Champaign runs about $32,000 a year at sticker; registered-apprenticeship completers average about $80,000 in their first year out; and the median bachelor’s still earns roughly $2.8 million over a lifetime to the diploma’s $1.6 million. Second, the categories kept honestly (Proverbs 18:13, 18:17): the AI effect is measured only for the most-exposed entry-level occupations (about 19% below trend for 22–25-year-olds), so "AI is replacing entry-level white-collar work" as the cause of the whole divergence is inference; "it is not temporary" is a forecast by a credible economist, not a finding. Third — where the Word settles what the debate cannot — work is judged by the Word’s own measures, not the market’s. Work preceded the fall: "to dress it and to keep it" (Genesis 2:15). The first man of whom Scripture says "I have filled him with the spirit of God" was a craftsman commanded to teach (Exodus 31:3; 35:34). The Lord was "the carpenter" (Mark 6:3); the apostle who sat under Gamaliel made tents with his own hands and said so (Acts 22:3; 18:3; 20:34). The believer is commanded "to work with your own hands" (1 Thessalonians 4:11); the one who "would not work" is not to eat (2 Thessalonians 3:10); the laborer is "worthy of his hire" (Luke 10:7) and must be paid before sundown (Deuteronomy 24:15), because withheld wages cry to the Lord of sabaoth (James 5:4); the field is prepared before the house is built (Proverbs 24:27); and no man is to owe (Romans 13:8), because the borrower serves the lender (Proverbs 22:7). Against "college is a scam" the Word answers "get wisdom" (Proverbs 4:7); against "a trade is second-class" it answers that "the eye cannot say unto the hand, I have no need of thee" (1 Corinthians 12:21). Both slogans fall; the data under both stands. The verdict on any soul’s path stays with Yahweh; the verdict on work — done heartily, paid on time, cost counted, craft taught — is already written. Then let the response mature past reaction into the Body’s long vocation as builder: the church that raised schools can raise apprentices, out of the tradesmen already in its pews, and walk every household through both cost sheets before a single loan is signed.',
  },

  // ---- Discernment-skill quiz ----
  quiz: {
    questions: [
      {
        q: 'The newsletter says non-degree workers 22–34 have "one of the best job markets in nearly two decades." What kind of claim is that, and what is the discernment move?',
        options: ['An absolute claim that non-degree workers now have lower unemployment than graduates', 'A RELATIVE claim — that group measured against its own range since 2003 — which is documented (Burning Glass, data through July 2026) and should be said plainly, beside the absolute picture', 'A rumor until the government confirms it'],
        answer: 1,
        explain: 'It is documented and relative. Say it plainly (DR-0100 Tier 1) AND keep the absolute picture in the same breath: degree holders still averaged 2.7% against 4.7%.',
      },
      {
        q: '"Unemployment is rising for graduates because AI is replacing entry-level white-collar roles." How should the parts be labeled?',
        options: ['All documented — the numbers prove the cause', 'The RISE is documented (NY Fed, 5.6% / 42%); the AI effect is measured only in the most-exposed jobs (Stanford, about 19% below trend for 22–25-year-olds); the SHARE of the whole squeeze due to AI is genuinely open', 'All speculation — no one knows anything about AI and jobs'],
        answer: 1,
        explain: 'Tier 1 for the rise and the measured exposed-occupation gap; Tier 2, narrowly, for the share. Neither "AI did all of it" nor "no one knows" is honest.',
      },
      {
        q: 'What does the Word do with the slogan "a trade is second-class work"?',
        options: ['Agrees — Scripture favors scholars', 'Corrects it: the first man of whom Scripture says "I have filled him with the spirit of God" (Exodus 31:3) was Bezaleel the craftsman, Jesus was "the carpenter" (Mark 6:3), Paul made tents (Acts 18:3), and "the eye cannot say unto the hand, I have no need of thee" (1 Corinthians 12:21)', 'Ignores it — the Word says nothing about work'],
        answer: 1,
        explain: 'The Word ranks no lawful work below another. The carpenter of Nazareth settles the question; the true data under the slogan (the degree pays more on average) still stands.',
      },
      {
        q: 'What does the Word do with the slogan "college is a scam"?',
        options: ['Confirms it — the trades are hiring', 'Corrects it: "Wisdom is the principal thing; therefore get wisdom" (Proverbs 4:7); Paul sat under Gamaliel AND made tents; what the Word forbids is the yoke taken without counting the cost (Luke 14:28; Proverbs 22:7), not the school', 'Has no opinion'],
        answer: 1,
        explain: 'The Word honors learning and forbids uncounted debt. The degree is now a priced decision to be chosen soberly — Issue 11’s lesson — not a scam and not a guarantee.',
      },
      {
        q: 'An employer cannot find skilled hands and finally hires an apprentice. What does the Word require of the employer?',
        options: ['Nothing — the market sets the terms', 'The wage in full and on time — "neither shall the sun go down upon it" (Deuteronomy 24:15), "shall not abide with thee all night" (Leviticus 19:13) — because withheld hire "crieth" to the Lord (James 5:4), plus honest training', 'Only what the contract says'],
        answer: 1,
        explain: 'The employer is bound by the Word as tightly as the worker. The shortage does not loosen the command to pay; it makes the paid, trained apprentice the very thing the Word describes.',
      },
      {
        q: 'A family with a capable seventeen-year-old reads this lesson. What is the Word’s first practical step?',
        options: ['Skip college — the data says so', 'Borrow the maximum — the degree always pays', 'Sit down and COUNT THE COST of both paths with real, dated numbers (Luke 14:28; Proverbs 24:27) — a real apprenticeship wage sheet beside a real college cost sheet — then whichever path, "do it heartily, as to the Lord" (Colossians 3:23)'],
        answer: 2,
        explain: 'The field before the house (Proverbs 24:27). The Word does not pick the path for the child; it demands the cost be counted and the work be done with the whole heart.',
      },
      {
        q: 'Why does the lesson keep "2.7% vs 4.7%" beside "best non-degree market in twenty years" instead of choosing one?',
        options: ['To avoid taking a position', 'Because both are documented and true at once — one relative, one absolute — and a reader who keeps only one is repeating half a fact (Proverbs 18:17)', 'Because the numbers contradict each other'],
        answer: 1,
        explain: 'Hearing the whole matter (Proverbs 18:13, 18:17) means holding both true numbers. That is not fence-sitting; it is the full fact.',
      },
    ],
  },
};

// =============================================================================
// ISSUE 13 — The Supreme Court leaves the mail-in rules alone
// (wi-scotus-mail-in-voting-2026). Darrell's word, 2026-09-15, forwarding the
// Morning Brew and NPR Up First newsletters: Lesson. Find the each subject and
// independently research them and create a lesson or lessons. The subject: the
// Supreme Court's September 14, 2026 order in U.S. Postal Service v. California
// (26A305) declining to let the Postal Service's ballot-mail rule run in the
// 2026 midterms. Handled under DR-0100's three tiers: the PROCEDURAL record
// (the executive order, the rule, the injunctions, the order, the dissent, the
// concurrence, the ballots already in the mail) is stated plainly with sources
// and as-of dates; the MERITS are marked open (no court has finally decided
// the Postal Service's authority); fraud-rate claims on either side are sourced
// or carried as claims; and the Word corrects both over-reaches — neither
// any-restriction-is-suppression nor any-mail-ballot-is-fraud is established.
// Word first: a just weight and measure, judges who take no gift and respect
// no person, rulers as Yahweh's ministers, prayer for kings, Caesar's coin, the
// lot cast into the lap, fruits, and the two courts. Named justices and
// officials appear; the subject is the order and the rule, not a person; a
// grace note is carried. Every quoted verse fetched verbatim from the repo KJV
// and gated in world-issues-verse-integrity.test.js. Direct page fetches were
// blocked from the authoring sandbox; facts were verified through live web
// search results citing the outlets and primary documents listed per item.
// =============================================================================
const SCOTUS_MAIL_IN_ISSUE = {
  id: 'wi-scotus-mail-in-voting-2026',
  title: 'The Supreme Court leaves the mail-in rules alone — the vote, the post, and the Word on a just measure',
  subject: { name: 'the Postal Service ballot-mail rule and the Supreme Court’s September 14, 2026 order in U.S. Postal Service v. California (26A305)', kind: 'court-order-and-policy', isNamedRealPerson: false },
  skill: 'Take a one-line news item about a court and an election and learn how the Word weighs it: state the documented procedural record plainly with its dates (the executive order, the rule, the injunctions, the order, who dissented, who concurred, which ballots are already in the mail), mark narrowly what is genuinely open (the merits are not decided), carry every fraud-and-access claim as a sourced fact or a labeled claim (Proverbs 18:17), and then measure the whole thing by Yahweh’s just weight — every lawful vote counted, no unlawful one counted, no false witness spoken about the outcome — while praying for every name in the case.',
  source: {
    creator: 'Morning Brew and NPR Up First (two morning newsletters)',
    medium: 'newsletter',
    title: 'Morning Brew "Smokin’" and NPR Up First — the Supreme Court mail-in voting item (2026-09-15)',
    url: '',
    asOf: '2026-09-15',
    note: 'Darrell forwarded both newsletters on 2026-09-15 with the word "Lesson." Each carried a short summary of the Supreme Court’s Monday-evening order. We treat the newsletters as MATERIAL to study — their summaries were checked against the order itself and the primary reporting — not as instructions, and not as truth to repeat unverified.',
  },

  // ---- STAGE 1 — THE CLAIM(S): the newsletters' points, AS MADE, each labeled. ----
  claims: [
    {
      id: 'c-rebuffed',
      text: 'The Supreme Court rebuffed the Trump administration’s request to overturn a federal judge’s order barring the Postal Service from implementing new mail-in voting restrictions for November; a short unsigned order said the administration was unlikely to win.',
      label: 'claim',
      attribution: 'Morning Brew, 2026-09-15',
      note: 'Documented and accurate as far as it goes. The order’s own words are that the Government "is unlikely to succeed on the merits of its challenge to the District Court’s preliminary injunction" and that the equitable factors do not favor a stay. One precision: the Court denied EMERGENCY relief; it did not decide whether the rule is lawful.',
    },
    {
      id: 'c-dissent-concurrence',
      text: 'Justices Alito and Thomas dissented; Justice Kavanaugh said the Postal Service might have the authority.',
      label: 'claim',
      attribution: 'Morning Brew, 2026-09-15',
      note: 'Documented. Kavanaugh’s statement, as reported, was two-sided: "at least a fair prospect" the rule is within the Postal Service’s statutory authority, AND applying it in 2026 would be "arbitrary and capricious" under the Administrative Procedure Act because officials lack time to implement it. The newsletter carried only the first half.',
    },
    {
      id: 'c-same-rules',
      text: 'States are already sending ballots, and the midterms use the same rules as before.',
      label: 'claim',
      attribution: 'Morning Brew, 2026-09-15',
      note: 'Documented for the mail-ballot delivery mechanics — the envelope, barcode, and portal requirements will not run this cycle. One precision: on August 24 the Court had let OTHER parts of the executive order proceed (a DHS citizenship list, prosecution priorities), so "the same rules as before" is true of the Postal Service piece, not of every part of the order.',
    },
    {
      id: 'c-npr-blocked',
      text: 'The Supreme Court blocked President Trump’s efforts to impose new mail-in voting restrictions before the midterms; the Postal Service continues delivering ballots as usual.',
      label: 'claim',
      attribution: 'NPR Up First, 2026-09-15',
      note: 'Accurate in effect, compressed in mechanism. Two district judges blocked the rule; the Supreme Court declined to lift those blocks for this election. "Blocked" is the practical result; the Court’s own act was a denial of a stay.',
    },
    {
      id: 'c-npr-check-deadlines',
      text: 'Voting by mail has already started in Alabama, North Carolina, and Wisconsin; voters should check state deadlines and return ballots promptly.',
      label: 'call-to-action',
      attribution: 'NPR Up First, 2026-09-15',
      note: 'Documented (the three states) and sound. This is the one directive in the item, and it is aimed at the voter’s own diligence, not at any person. The lesson adopts it in the stewardship section because the Word already commands it in substance — render what is due, on time, honestly.',
    },
    {
      id: 'c-admin-fraud',
      text: 'Mail-ballot fraud is "a particularly pernicious species of fraud that dilutes the votes of lawful voters, prevents election results from reflecting the will of the American people," and undermines public confidence — so the Postal Service’s tracking, barcode, and voter-list requirements are needed for integrity and chain of custody.',
      label: 'opinion',
      attribution: 'Solicitor General D. John Sauer, in the government’s emergency application to the Supreme Court, as reported by CBS News (2026-09)',
      note: 'The characterization is the government’s. What is DOCUMENTED underneath it is in Stage 2: real cases of absentee-ballot fraud exist (the 2018 North Carolina Ninth District scheme is the clearest), and the documented RATE across all mail ballots is very small. "Widespread" was not shown in the filings as reported; that word is carried as a claim, not a fact.',
    },
    {
      id: 'c-states-impossible',
      text: 'The rule could not lawfully or practically be imposed mid-cycle: no statute gives the Postal Service power over who receives a ballot, the envelopes could not be reprinted in time, and enrolling every mail voter through a still-inactive portal would be "virtually impossible."',
      label: 'claim',
      attribution: 'The 23 plaintiff states and the District of Columbia, and state election officials (including the Wisconsin Elections Commission chair), in court filings as reported by CBS News, CNN, and Votebeat (2026-09)',
      note: 'The legal half is a claim two district judges and a Supreme Court majority found LIKELY to succeed — not yet finally decided. The practical half rests on sworn filings with numbers (Stage 2) and was the exact ground of Justice Kavanaugh’s concurrence.',
    },
  ],

  // ---- STAGE 2 — VERIFIABLE vs INTERPRETATION ----
  verifiable: [
    {
      id: 'f-order-and-rule',
      statement: 'On March 31, 2026 the President signed Executive Order 14399, "Ensuring Citizenship Verification and Integrity in Federal Elections," directing the Postal Service toward a system for ballot mail. On August 26, 2026 the Postal Service published its final rule, "Ballot Mail for Federal Elections" (39 CFR Part 111, a new Domestic Mail Manual section), requiring pre-approved ballot-envelope designs carrying unique Postal Service barcodes and an official logo, and requiring election officials to submit the names and addresses of intended mail-ballot recipients through a new "federal ballot mail portal" before ballots enter the mail stream — with the Postal Service refusing to deliver ballot mail that does not meet the specifications or is not on the submitted list.',
      status: 'documented',
      sources: [
        { title: 'Ballot Mail for Federal Elections (final rule, 39 CFR Part 111)', publisher: 'Federal Register, U.S. Postal Service', url: 'https://www.federalregister.gov/documents/2026/08/26/2026-17238/ballot-mail-for-federal-elections', asOf: '2026-09-15' },
        { title: 'USPS Ballot Mail Rule: Overview and Potential Impact (IF13297)', publisher: 'Congressional Research Service', url: 'https://www.congress.gov/crs-product/IF13297', asOf: '2026-09-15' },
        { title: 'Postal Service Mail-In Ballot Rules: What Voters Need to Know Ahead of the 2026 Election', publisher: 'U.S. News & World Report', url: 'https://www.usnews.com/news/national-news/articles/2026-08-25/postal-service-mail-in-ballot-rules-what-voters-need-to-know-ahead-of-the-2026-election', asOf: '2026-09-15' },
      ],
      note: 'Verified by live web search on 2026-09-15 against the Federal Register listing, the CRS summary, and contemporaneous reporting. The rule is real, published, and final; what is blocked is its APPLICATION to the 2026 election.',
    },
    {
      id: 'f-lower-courts',
      statement: 'Twenty-three states and the District of Columbia, led by California, sued in the District of Massachusetts. On June 25, 2026 Judge Indira Talwani blocked key mail-voting provisions of the executive order for those jurisdictions, holding that no act of Congress delegates control of mail-in voting to the Postal Service. On August 24, 2026 the Supreme Court, 6-3 (Justices Sotomayor, Kagan, and Jackson dissenting), lifted that injunction as premature because the Postal Service had not yet issued a final rule; the rule was then published. Judge Talwani put the rule on a 14-day hold on August 28 and entered a preliminary injunction on September 4. On September 13, 2026 Judge Carl Nichols of the District of Columbia — nominated by President Trump in his first term — entered a second preliminary injunction for the Democratic Senatorial Campaign Committee, LULAC, and the NAACP, writing that "No statute grants the Postal Service the power to issue key parts of the Rule."',
      status: 'documented',
      sources: [
        { title: 'Judge blocks key pillars of Trump executive order restricting mail voting in 2026 election', publisher: 'Votebeat', url: 'https://www.votebeat.org/national/2026/06/25/trump-election-overhaul-mail-voting-executive-order-blocked-talwani-usps-dhs/', asOf: '2026-09-15' },
        { title: 'Supreme Court lifts 1 of 2 injunctions on Trump’s mail-voting executive order for 2026 elections', publisher: 'Votebeat', url: 'https://www.votebeat.org/national/2026/08/24/supreme-court-lifts-stay-trump-executive-order-on-elections-mail-ballot-restrictions/', asOf: '2026-09-15' },
        { title: 'Federal judge temporarily blocks USPS rules implementing absentee/mail-in voting executive order', publisher: 'Ballotpedia News', url: 'https://news.ballotpedia.org/2026/08/31/federal-judge-temporarily-blocks-usps-rules-implementing-absentee-mail-in-voting-executive-order/', asOf: '2026-09-15' },
        { title: 'Second federal judge freezes Trump mail ballot order with Supreme Court poised to weigh in', publisher: 'NBC News', url: 'https://www.nbcnews.com/politics/2026-election/second-federal-judge-freezes-trump-mail-ballot-order-supreme-court-rcna597633', asOf: '2026-09-15' },
        { title: 'Trump-nominated judge blocks USPS mail-in ballot rule as Supreme Court weighs case', publisher: 'Washington Examiner', url: 'https://www.washingtonexaminer.com/news/justice/4725698/trump-nominated-judge-blocks-usps-mail-in-ballot-rule/', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. The two-judge fact matters for the Word’s own test of a witness: a judge nominated by one party and a judge nominated by the other reached the same reading of the statute (Deuteronomy 19:15’s two-witness standard is about testimony, and we do not stretch it into a legal verdict — but the pattern is worth noticing).',
    },
    {
      id: 'f-scotus-order',
      statement: 'On September 6, 2026 Solicitor General D. John Sauer filed an emergency application (26A305) with Justice Jackson asking the Court to stay Judge Talwani’s September 4 injunction; responses were due September 9. On Monday, September 14, 2026 the Court denied the application in a short unsigned order stating that the Government "is unlikely to succeed on the merits of its challenge to the District Court’s preliminary injunction" and that the equitable factors for emergency relief do not favor a stay. Justice Kavanaugh wrote separately that there is "at least a fair prospect that the final rule falls within the Postal Service’s statutory authority," but that applying it in the 2026 elections "would be arbitrary and capricious in violation of the Administrative Procedure Act because state and local election officials do not have sufficient time to reasonably implement the rule before the elections." Justice Alito, joined by Justice Thomas, dissented: he wrote that he expressed "no view on whether the Government would be likely to succeed on de novo review of the Postal Service’s powers," but that the Government had made a strong showing that the States’ ultra vires claim is not likely to succeed; the States’ implementation concerns gave him pause but were "not enough to convince me."',
      status: 'documented',
      sources: [
        { title: '26A305 Postal Service v. California — order and opinions (09/14/2026)', publisher: 'Supreme Court of the United States', url: 'https://www.supremecourt.gov/opinions/25pdf/26a305_4g15.pdf', asOf: '2026-09-15' },
        { title: 'Supreme Court denies Trump administration’s request to implement parts of rule on mail-in voting', publisher: 'SCOTUSblog', url: 'https://www.scotusblog.com/2026/09/supreme-court-denies-trump-administrations-request-to-implement-parts-of-usps-rule-on-mail-in-vo/', asOf: '2026-09-15' },
        { title: 'The Supreme Court rejects Trump’s mail voting restrictions for this year’s midterms', publisher: 'NPR', url: 'https://www.npr.org/2026/09/14/nx-s1-5962190/supreme-court-mail-in-voting-trump', asOf: '2026-09-15' },
        { title: 'US Supreme Court rejects DOJ bid to stay injunction blocking USPS mail-in ballot rule', publisher: 'JURIST', url: 'https://www.jurist.org/news/2026/09/us-supreme-court-rejects-doj-bid-to-stay-injunction-blocking-usps-mail-in-ballot-rule/', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. The quoted lines are as reported from the order and opinions by the outlets above; the primary PDF is listed first so a learner can check every word. Three positions, three honest labels: a majority (unlikely to succeed on THIS emergency challenge), a concurrence (authority plausible, timing fatal), a dissent (States’ theory unlikely, merits reserved). None is a final ruling on the law.',
    },
    {
      id: 'f-ballots-out',
      statement: 'North Carolina began sending mail ballots on September 4, 2026 and Alabama on September 9; Wisconsin began the following week. Federal law requires every state to transmit ballots to military and overseas voters at least 45 days before the November 3 election. In 2024 about 30% of all ballots were cast by mail (EAC Election Administration and Voting Survey), and voters 65 and older used mail voting at the highest rate of any age group.',
      status: 'documented',
      sources: [
        { title: 'Midterm mail ballots start to go to voters as litigation over Trump’s order creates uncertainty', publisher: 'ABC News / Associated Press', url: 'https://abcnews.com/Politics/wireStory/midterm-mail-ballots-start-voters-litigation-trumps-order-136193718', asOf: '2026-09-15' },
        { title: 'Alabama voters, who qualify, can use their mail-in ballots freely for the mid-terms', publisher: 'Alabama Public Radio', url: 'https://www.apr.org/news/2026-09-15/alabama-voters-who-qualify-can-use-their-mail-in-ballots-freely-for-the-mid-terms', asOf: '2026-09-15' },
        { title: 'U.S. Election Assistance Commission Releases 2024 Election Administration and Voting Survey (EAVS) Report', publisher: 'U.S. Election Assistance Commission', url: 'https://www.eac.gov/news/2025/06/30/us-election-assistance-commission-releases-2024-election-administration-and-voting', asOf: '2026-09-15' },
        { title: 'Here’s who is most likely to vote by mail', publisher: 'CNN', url: 'https://www.cnn.com/2026/09/04/politics/mail-voting-popularity-trump-vis', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. The "who" behind the rule matters to the Word’s command to hear the small as well as the great: nearly one ballot in three, and the oldest voters most of all.',
    },
    {
      id: 'f-feasibility',
      statement: 'In sworn court filings, election officials said the rule could not be implemented before November: Washington’s elections director estimated nearly $2 million to replace more than 1 million envelopes lacking the required inbound barcodes; Hawaii’s already-ordered return envelopes had cost the state $79,000; vendors told officials there was not enough time to print the redesigned envelopes, and possibly not enough paper stock; and the Wisconsin Elections Commission chair said enrolling every Wisconsin mail voter through the portal would be "virtually impossible."',
      status: 'documented',
      sources: [
        { title: 'Election officials raise alarm over implementing new mail voting rules before midterms: "Virtually impossible"', publisher: 'CBS News', url: 'https://www.cbsnews.com/news/mail-voting-rules-usps-election-officials-midterms/', asOf: '2026-09-15' },
        { title: 'Election officials say they can’t comply with Trump’s proposed mail ballot rules', publisher: 'CNN', url: 'https://www.cnn.com/2026/09/02/politics/election-officials-trump-post-office-mail-ballot-voting', asOf: '2026-09-15' },
        { title: 'USPS Final Rule on Ballot Mail for Federal Elections: What Counties Need to Know', publisher: 'National Association of Counties', url: 'https://www.naco.org/resource/usps-final-rule-ballot-mail-federal-elections-what-counties-need-know', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. These are sworn filings with numbers, which is why the concurrence rested on timing. They document FEASIBILITY for 2026; they say nothing about whether a rule with lead time would be lawful or wise.',
    },
    {
      id: 'f-fraud-record',
      statement: 'Absentee-ballot fraud is real and documented in specific cases: in February 2019 the North Carolina State Board of Elections unanimously ordered a new election in the Ninth Congressional District after finding a "coordinated, unlawful and substantially resourced absentee ballot scheme" in the 2018 general election; four people later pleaded guilty. Its measured RATE is very small: the Heritage Foundation’s database counted 1,620 proven instances of voter fraud of all types across decades as of December 2025, of which a New York Times analysis identified 289 absentee-ballot cases from 1982 to 2025; a Brookings analysis put mail-ballot fraud at roughly 0.000043% of mail ballots cast — about four in ten million. Whether the RULE would have prevented any documented case has not been shown in the filings as reported.',
      status: 'partly-documented',
      sources: [
        { title: 'State Board unanimously orders new election in 9th Congressional District', publisher: 'North Carolina State Board of Elections', url: 'https://www.ncsbe.gov/news/press-releases/2019/02/25/state-board-unanimously-orders-new-election-9th-congressional-district', asOf: '2026-09-15' },
        { title: 'Four people plead guilty in North Carolina ballot probe of 2016 and 2018 elections', publisher: 'NBC News', url: 'https://www.nbcnews.com/politics/elections/four-people-plead-guilty-north-carolina-ballot-probe-2016-2018-electio-rcna49534', asOf: '2026-09-15' },
        { title: 'The Facts About Mail-In Voting Fraud', publisher: 'TIME', url: 'https://time.com/article/2026/03/20/mail-voting-absentee-voter-fraud-trump-claims-research/', asOf: '2026-09-15' },
        { title: 'Mail voting fraud: Data points to low risk and high benefits for voters', publisher: 'Brookings Institution', url: 'https://www.brookings.edu/articles/mail-voting-in-the-us-data-points-to-very-low-fraud-and-significant-benefits-to-voters/', asOf: '2026-09-15' },
        { title: 'What’s Conspicuously Missing from the Government’s Supreme Court Reply Brief in the Mail Ballots Case', publisher: 'Just Security', url: 'https://www.justsecurity.org/156963/usps-mail-ballots-solicitor-general-scotus/', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. This is the honest Tier 2 boundary (DR-0100): the CASES are documented and stated plainly; the RATE is documented and small; "widespread" is unproven and carried as the government’s claim; and the counter-slogan that mail fraud never happens is refuted by North Carolina’s own board. Both true data sets stand at once.',
    },
    {
      id: 'f-watson',
      statement: 'The Court had already decided a sibling mail-ballot question this term: on June 29, 2026, in Watson v. Republican National Committee (24-1260), it held 5-4 that federal Election Day statutes do not bar a state from counting a mail ballot postmarked by Election Day and received within a short state-set grace period (Mississippi’s is five business days). Justice Barrett wrote for the majority with the Chief Justice and Justices Sotomayor, Kagan, and Jackson; Justice Alito dissented, joined by Justices Thomas, Gorsuch, and Kavanaugh.',
      status: 'documented',
      sources: [
        { title: '24-1260 Watson v. Republican National Committee (06/29/2026)', publisher: 'Supreme Court of the United States', url: 'https://www.supremecourt.gov/opinions/25pdf/24-1260_g3cn.pdf', asOf: '2026-09-15' },
        { title: 'Watson v. Republican National Committee', publisher: 'Ballotpedia', url: 'https://ballotpedia.org/Watson_v._Republican_National_Committee', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. Included because "the midterms use the same rules as before" includes this: grace-period states keep their grace periods, and the same two justices who dissented on September 14 were in that dissent too. The learner can see a consistent legal position on each side, not a whim.',
    },
  ],
  interpretation: [
    {
      id: 'n-not-the-merits',
      statement: '"Rebuffed," "rejected," and "blocked" are the practical result, not the legal act. The Court answered an emergency question — whether to let the rule run in THIS election while the cases proceed — and said no, because the government was unlikely to win its challenge to the injunction and the equities cut against it. It did not rule that the Postal Service lacks the power; a majority signaled doubt, one justice said the power may well exist, two justices said the States’ theory is weak. The merits remain open in two district courts and the First Circuit. Keep the category: an emergency order is a real, binding act with real effect, and it is not a verdict on the law.',
      restsOn: ['f-scotus-order', 'f-lower-courts'],
    },
    {
      id: 'n-two-slogans',
      statement: 'Two slogans ride this story, and neither is established. "Any restriction on mail voting is suppression" is not shown: the Court itself, in Watson, was willing to read federal election law strictly, and a rule with real lead time has not been tested. "Any mail ballot is fraud" is refuted by the documented rate and by the fact that nearly a third of the country, and the oldest voters most of all, vote lawfully by mail. What IS documented on each side stands — real cases, real small rate, real feasibility filings, real ballots already out.',
      restsOn: ['f-fraud-record', 'f-feasibility', 'f-ballots-out', 'f-watson'],
    },
    {
      id: 'n-timing-was-the-hinge',
      statement: 'The decisive fact was the calendar. The rule was finalized August 26; North Carolina mailed ballots September 4; the order came September 14. Justice Kavanaugh’s concurrence turned on that alone, and even Justice Alito wrote that the States’ implementation concerns gave him pause. A learner who takes away only "the Court is against the President" or "the Court is for mail voting" has missed the sentence the case actually turned on.',
      restsOn: ['f-scotus-order', 'f-ballots-out', 'f-feasibility'],
    },
    {
      id: 'n-same-rules-narrow',
      statement: '"The same rules as before" is true of the Postal Service piece — envelopes, barcodes, and the portal will not gate delivery this cycle — and of grace periods after Watson. It is not true of every part of the executive order; on August 24 the Court let other provisions (a federal citizenship list, prosecution priorities) proceed. Saying the narrow true thing is more useful to a voter than the broad loose thing.',
      restsOn: ['f-lower-courts', 'f-watson'],
    },
  ],

  // ---- STAGE 3 — PERSPECTIVES on the UNRESOLVED parts ----
  perspectives: [
    {
      id: 'p-administration',
      label: 'The administration — integrity, chain of custody, and the mail belongs to the Postal Service',
      heldBy: 'The President, the Solicitor General, and the two dissenting justices',
      steelman: 'At its strongest: a ballot in the mail is the one stage of an election no state official can see. A unique barcode on every envelope, a design the carrier can recognize, and a list of intended recipients before the envelopes enter the stream would let the Postal Service track each ballot end to end, refuse counterfeits, and give every voter proof of custody — the same tracking any package gets. Congress gave the Postal Service broad statutory power over what it carries and how; using that power to protect the most vulnerable stage of the vote is not an intrusion on the States but a service to them. And the 2018 North Carolina scheme proves the harm is not imaginary. Even the dissent conceded the timing concern was real; its point was that the States’ legal theory is a long shot and a court should not enjoin a federal agency on a long shot.',
    },
    {
      id: 'p-states',
      label: 'The challengers — the Constitution gives elections to States and Congress, and rules do not change after the ballots are printed',
      heldBy: 'Twenty-three states and the District of Columbia, the DSCC, LULAC, the NAACP, and voting-rights groups',
      steelman: 'At its strongest: the Elections Clause places the times, places, and manner of federal elections with state legislatures and Congress, not with a mail agency, and no statute says otherwise — which is why a judge nominated by each party read the law the same way. Beyond the law is the calendar: ballots were designed, printed, and in some states mailed before the rule was final, and a Postal Service that refuses an envelope because a list was not uploaded is not catching a counterfeit, it is discarding a lawful vote — most often the vote of an older, disabled, rural, or deployed citizen who has no other way to cast it. The documented fraud rate is tiny; the documented cost of the rule was measured in millions of envelopes. The remedy for a real 2018-style scheme is prosecution, which happened, not a national filter that no state could pass in time.',
    },
    {
      id: 'p-officials',
      label: 'The election officials — feasibility is not a side issue',
      heldBy: 'State and county election administrators of both parties, in sworn filings',
      steelman: 'At its strongest: the people who actually run elections were not asked whether the goal was good; they were told to meet a specification with an inactive portal, redesigned envelopes, vendors who said there was no time, and paper that might not exist, weeks before ballots were due to overseas troops by federal law. A rule that cannot be met produces rejected ballots and lawsuits, not integrity. This is the ground Justice Kavanaugh stood on, and it is also the ground the Word calls decently and in order: a just measure must be one the measurer can actually apply.',
    },
    {
      id: 'p-believer',
      label: 'The ordinary voter — confidence both ways, and the conduct the Word requires of me',
      heldBy: 'Believers who vote, on either side of the aisle',
      steelman: 'At its strongest: a citizen wants two things at once — every lawful vote counted and no unlawful one counted — and the Word wants exactly that, calling both errors a false balance. Such a voter does not need the Court to have been for or against anyone; he needs to know what the rules are this cycle (the same as before), what his deadline is, and that he must not repeat a claim about the outcome that he cannot prove. He prays for the President, the Postmaster General, the judges, and the clerks by name, because the Word puts prayer first of all, and he trusts that the disposing of the lot is of the LORD.',
    },
  ],

  // ---- STAGE 4 — THE BELIEVER'S LENS ----
  lens: {
    fourD: {
      deepSource: 'WORD FIRST — Before any court, any agency, or any newsletter speaks, Yahweh has already said what an honest count must be. He wrote it for the marketplace first, and it reaches every counting: "Ye shall do no unrighteousness in judgment, in meteyard, in weight, or in measure." (Leviticus 19:35) — "Just balances, just weights, a just ephah, and a just hin, shall ye have: I am the LORD your God, which brought you out of the land of Egypt." (Leviticus 19:36). He owns the measure itself: "A just weight and balance are the LORD’s: all the weights of the bag are his work." (Proverbs 16:11); "A false balance is abomination to the LORD: but a just weight is his delight." (Proverbs 11:1); "Divers weights, and divers measures, both of them are alike abomination to the LORD." (Proverbs 20:10). A ballot is a weight in the bag. Yahweh’s standard has two edges at once: the measure must count every lawful vote (a weight withheld is a false balance) AND count no unlawful one (a weight added is a false balance) — and He names both errors with the same word. So the believer refuses the two slogans the day trades in; "any restriction is suppression" and "any mail ballot is fraud" are both a bag with divers weights. He then wrote the job description of a judge, and every justice on that Court sits under it whether he knows it or not: "Judges and officers shalt thou make thee in all thy gates" and "they shall judge the people with just judgment." (Deuteronomy 16:18) — "Thou shalt not wrest judgment; thou shalt not respect persons, neither take a gift: for a gift doth blind the eyes of the wise, and pervert the words of the righteous." (Deuteronomy 16:19) — "That which is altogether just shalt thou follow" (Deuteronomy 16:20). "Ye shall not respect persons in judgment; but ye shall hear the small as well as the great; ye shall not be afraid of the face of man; for the judgment is God’s" (Deuteronomy 1:17). "And thou shalt take no gift: for the gift blindeth the wise, and perverteth the words of the righteous." (Exodus 23:8). "Thou shalt not follow a multitude to do evil; neither shalt thou speak in a cause to decline after many to wrest judgment" (Exodus 23:2). Jehoshaphat’s charge to his judges is the standard for any bench: "Take heed what ye do: for ye judge not for man, but for the LORD, who is with you in the judgment." (2 Chronicles 19:6). Notice what the Word does NOT say. It does not say a judge must rule for the ruler, nor against him. It says: no respect of persons, no gift, no fear of faces. That is the whole measure of a court, and it is the measure this lesson applies to a majority, a concurrence, and a dissent alike. He wrote the standing of rulers: "Let every soul be subject unto the higher powers. For there is no power but of God: the powers that be are ordained of God." (Romans 13:1); "For he is the minister of God to thee for good." (Romans 13:4); "Submit yourselves to every ordinance of man for the Lord’s sake: whether it be to the king, as supreme;" (1 Peter 2:13) — "Or unto governors, as unto them that are sent by him for the punishment of evildoers, and for the praise of them that do well." (1 Peter 2:14). A President, a Postmaster General, a district judge, a Supreme Court: each is a minister in Yahweh’s ordering, and each will be measured by the same just weight. And He told us what to do with them, and put it FIRST: "I exhort therefore, that, first of all, supplications, prayers, intercessions, and giving of thanks, be made for all men;" (1 Timothy 2:1) — "For kings, and for all that are in authority; that we may lead a quiet and peaceable life in all godliness and honesty." (1 Timothy 2:2). Before the opinion, the prayer. He told us what we owe the system we live under: "Render therefore unto Caesar the things which are Caesar’s; and unto God the things that are God’s." (Matthew 22:21). Caesar’s coin bore Caesar’s image; a lawful ballot is a thing a citizen renders — filled honestly, returned on time, by the rules that stand. He told us the outcome is His: "The lot is cast into the lap; but the whole disposing thereof is of the LORD." (Proverbs 16:33); "The king’s heart is in the hand of the LORD, as the rivers of water: he turneth it whithersoever he will." (Proverbs 21:1); "But God is the judge: he putteth down one, and setteth up another." (Psalms 75:7). A ballot in an envelope is a lot cast into the lap; the disposing is His — which frees the believer from both panic and triumph. He told us how to read a ruler and a rule: "Wherefore by their fruits ye shall know them." (Matthew 7:20); "When the righteous are in authority, the people rejoice: but when the wicked beareth rule, the people mourn." (Proverbs 29:2). And He told us the case is not closed at the top step of that Court: "For God shall bring every work into judgment, with every secret thing, whether it be good, or whether it be evil." (Ecclesiastes 12:14). SO IN THIS CASE the believer does four things in order. First, state what is documented, plainly, because "Prove all things; hold fast that which is good." (1 Thessalonians 5:21): the executive order of March 31, the Postal Service rule of August 26, the injunctions of June 25, September 4, and September 13, the Court’s September 14 order, the two dissenters, the one concurrence, and the ballots already in the mail in North Carolina, Alabama, and Wisconsin. Second, keep the categories — "He that answereth a matter before he heareth it, it is folly and shame unto him." (Proverbs 18:13); "He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him." (Proverbs 18:17): the Court decided an EMERGENCY question, whether to lift a block for this election, not the merits of the Postal Service’s power; a majority said the government is unlikely to succeed, Justice Kavanaugh said the authority may well exist but the timing fails, Justice Alito said the States’ theory is unlikely to succeed — every one of those is reported as what it is, and none of them is the final word on the law. Third, weigh the CLAIMS by the just weight: the administration’s claim that mail fraud is pernicious rests on real documented cases (the 2018 Ninth District scheme in North Carolina was real, and a new election was ordered) and on a documented rate that is very small; the challengers’ claim that the rule would strip lawful ballots rests on real sworn filings from real election officials about envelopes, portals, vendors, and time. Both true data sets stand; neither slogan does. Fourth — and this is where the Word settles what the debate cannot — the believer’s own conduct: "Thou shalt not bear false witness against thy neighbour." (Exodus 20:16); "A false witness shall not be unpunished, and he that speaketh lies shall not escape." (Proverbs 19:5). Whatever any court rules, the believer does not say a count was stolen without proof, does not say a rule was harmless without hearing the clerk, and does not repeat a number he has not checked. "Speak ye every man the truth to his neighbour; execute the judgment of truth and peace in your gates" (Zechariah 8:16). Then he votes — checks the deadline, returns the ballot early, renders to Caesar — and prays for every name in the case, because the disposing is of the LORD.',
      scripture: 'Leviticus 19:35-36; Proverbs 16:11; Proverbs 11:1; Proverbs 20:10; Deuteronomy 25:13-15; Deuteronomy 16:18-20; Deuteronomy 1:17; Exodus 23:8; Exodus 23:2; 2 Chronicles 19:6-7; Proverbs 24:23; Romans 13:1-4; 1 Peter 2:13-14; 1 Peter 2:17; 1 Timothy 2:1-2; Jeremiah 29:7; Matthew 22:21; Romans 13:7; Proverbs 16:33; Proverbs 21:1; Psalms 75:6-7; Daniel 2:21; Matthew 7:20; Proverbs 29:2; Ecclesiastes 12:14; 1 Thessalonians 5:21; Proverbs 18:13; Proverbs 18:17; John 7:51; Exodus 20:16; Proverbs 19:5; Proverbs 12:22; Zechariah 8:16; 1 Corinthians 14:40',
    },
    threeD: 'Practically: read the newsletter line, then read the order. Say the documented parts plainly and dated — the executive order (March 31), the final rule (August 26), the injunctions (June 25, September 4, September 13), the denial (September 14), the dissent (Alito, joined by Thomas), the concurrence (Kavanaugh: authority plausible, timing fatal), and the ballots already out (North Carolina September 4, Alabama September 9, Wisconsin the week after). Then label the rest honestly: "the Court blocked the rule" is the effect, "the Court denied a stay" is the act, and "the Postal Service has no authority" is a likely-but-undecided reading of the law. Hear each side at its strongest (Proverbs 18:17): integrity and custody are real goods; the Elections Clause and the calendar are real limits; feasibility is real. Then measure it by the just weight — every lawful vote counted, no unlawful one counted — and do your own part: find your state’s deadline today, request or complete your ballot, sign it exactly as instructed, return it early (the mailbox, a drop box, or the clerk’s office as your state allows), and confirm it was received where your state offers tracking. Never post a claim about the count you cannot source. Pray, by name, for the President, the Postmaster General, Judge Talwani, Judge Nichols, the nine justices, and your county clerk — first of all (1 Timothy 2:1).',
    accountability: {
      statement: 'THE TWO COURTS. Man’s highest court answered a narrow question on September 14 and answered it lawfully; it will answer the merits later, and this lesson invents no verdict it has not given. But the Word never lets accountability shrink to what a bench happened to rule on. Every decree — a President’s order, an agency’s rule, a judge’s injunction, a justice’s dissent — enters the eternal court where "God shall bring every work into judgment, with every secret thing" (Ecclesiastes 12:14), where a judge who took a gift or feared a face answers for it (Exodus 23:8; Deuteronomy 1:17), where "He that justifieth the wicked, and he that condemneth the just, even they both are abomination to the LORD." (Proverbs 17:15), and where a false witness about a count — whoever spoke it, from a podium or a phone — is heard: "Lying lips are abomination to the LORD: but they that deal truly are his delight." (Proverbs 12:22). WHAT A SYSTEM OWES under the Word is a just measure both ways and a measure its clerks can actually apply. WHAT WE OWE: to render what is Caesar’s (Matthew 22:21) — the lawful ballot, on time; to honour the king and the governor (1 Peter 2:17) whether or not we voted for them; to pray for them first of all (1 Timothy 2:1-2); and to speak the truth to our neighbour about what a court did and did not do (Zechariah 8:16). And the lived cost during this life is seen now: an older voter whose lawful ballot would have been refused for a missing barcode, and a lawful voter whose vote would have been diluted by a counterfeit, are both weighed by the same LORD. No one gets away: "God is not mocked" (Galatians 6:7), and the books are opened (Revelation 20:12).',
      scripture: 'Ecclesiastes 12:14; Exodus 23:8; Deuteronomy 1:17; Proverbs 17:15; Proverbs 12:22; Matthew 22:21; 1 Peter 2:17; 1 Timothy 2:1-2; Zechariah 8:16; Proverbs 24:23; Galatians 6:7; Revelation 20:12',
    },
    benefits: [
      'Both courts, honestly held: man’s highest court decided an emergency question on September 14 and left the merits open, and this lesson invents no verdict — while the ETERNAL court holds every order, rule, dissent, and claim about a count, and lands after this life (Ecclesiastes 12:14; Proverbs 17:15). You can say what happened without pretending to know what has not been decided.',
      'Freedom from two slogans at once: "any restriction is suppression" and "any mail ballot is fraud" are both a bag of divers weights (Proverbs 20:10); the documented cases, the documented rate, the sworn feasibility filings, and the ballots already out all stand together.',
      'The Word’s own measure of a court in your hands — no respect of persons, no gift, no fear of faces (Deuteronomy 16:19; Exodus 23:8; Deuteronomy 1:17) — so you can read a majority, a concurrence, and a dissent by the same standard instead of by whose side they landed on.',
      'A repeatable method for any court story: the ACT (a denial of a stay) versus the EFFECT (the rule will not run); the emergency question versus the merits; what each opinion actually said versus what the headline said.',
      'Peace in the middle of an election: the lot is cast into the lap and the disposing is of the LORD (Proverbs 16:33), which removes both panic and triumph and leaves the believer free to do his part and pray for every name.',
      'A house that does not bear false witness: no unsourced claim about a count, no repeated number that was never checked (Exodus 20:16; Proverbs 19:5) — and a ballot rendered to Caesar honestly, early, and by the rules that stand (Matthew 22:21).',
    ],
    graceNote: 'No condemnation of any justice’s, judge’s, or official’s soul: this lesson pronounces no verdict on President Trump, Solicitor General Sauer, Justice Alito, Justice Thomas, Justice Kavanaugh, the six who joined the order, Judge Talwani, Judge Nichols, the Postmaster General, or any state official who signed a filing — their hearts are Yahweh’s to judge, and He is no respecter of persons in either direction. A dissent is not wickedness and a majority is not righteousness; each is measured by the just weight, and each will be. Leaving the soul to Yahweh never mutes the deed: a false balance is named as a false balance whichever hand holds it, and a false witness about a count is named as false whoever speaks it. Truth and grace meet in Jesus, who paid Caesar’s coin, told the truth before Pilate, and prayed for the men who judged Him.',
    stewardship: 'The deeper response to a fight over the mail is to BE the just measure where you stand. Vote, and vote the way the Word describes a just weight: request your ballot early, read the instructions, sign where it says, return it well before the deadline by a method your state allows, and confirm receipt where tracking exists — so that your one weight in the bag is true. Help the people the rule would have touched first: drive an older neighbour to the drop box, walk a disabled brother through his state’s tracking page, remind a deployed cousin of the 45-day window. Volunteer as a poll worker or an election observer — both parties need them, and a believer who has seen a count with his own eyes bears true witness instead of repeating a rumor. In the Body, teach the two-court frame so no one in the church spreads a claim about an outcome he cannot source. This platform’s own discipline is the same in miniature: every fact here carries a source and a date, every verse is fetched verbatim and gated, and what is undecided is marked undecided. Righteous engagement names the measure; it is completed by living it.',
    anchor: {
      ref: 'Proverbs 16:11; Exodus 20:16',
      theme: 'The measure belongs to Yahweh — "A just weight and balance are the LORD’s: all the weights of the bag are his work." — so every lawful vote is counted and no unlawful one is, and the believer’s own weight in the bag is a true ballot and a true word: "Thou shalt not bear false witness against thy neighbour."',
    },
  },

  // ---- STAGE 5 — REFLECTION + SKILL ----
  reflection: {
    skill: 'When a one-line court story lands in your feed: PAUSE. Separate the ACT (what the court actually did — here, denied an emergency stay) from the EFFECT (the rule will not run this cycle) and from the MERITS (undecided). Read what each opinion said, not what the headline said. Say the documented, dated record plainly — refusing to name it is false witness. Carry each side’s fraud-or-access claim as a sourced fact or a labeled claim, and hear both at their strongest. Then measure by the just weight — every lawful vote, no unlawful one — do your own part on time, and pray for every name in the case before you form an opinion of any of them.',
    practice: 'Take the line "the Supreme Court blocked the mail-in voting restrictions." Write four lines: (1) one sentence of the ACT with its date and docket; (2) one sentence of what Justice Kavanaugh and Justice Alito each actually said; (3) one sentence labeling the fraud claim and the access claim, each with its documented basis; (4) one sentence of what you will DO this month — your state’s deadline, your ballot, and the names you will pray for first.',
    prompts: [
      'The order said the government "is unlikely to succeed on the merits of its challenge to the District Court’s preliminary injunction." What did the Court decide, and what did it leave undecided? Why does that distinction matter for a believer who does not want to bear false witness?',
      'Justice Kavanaugh said the Postal Service may well have the authority AND that applying the rule in 2026 would be arbitrary and capricious for lack of time. How does the Word’s "decently and in order" (1 Corinthians 14:40) bear on a rule that cannot be met?',
      'Yahweh calls a withheld weight and an added weight by the same word — abomination (Proverbs 20:10). Where do you see each error being defended as if it were righteousness? How do you hold both edges at once?',
      'The 2018 North Carolina scheme was real, and the documented mail-fraud rate is about four in ten million. How do you state both plainly in one breath without collapsing either into a slogan?',
      'Deuteronomy 16:19 forbids a judge to respect persons, take a gift, or fear faces. Apply that measure to the majority, the concurrence, and the dissent — without deciding by which side each landed on. What would it look like to pray for Justice Alito and Judge Talwani in the same sentence?',
      'Proverbs 16:33: the lot is cast, the disposing is of the LORD. What would change in your speech about this election if you believed that sentence?',
      'In your own house: what is your state’s mail-ballot deadline, and who in your church or family would have been touched first by an envelope rule — an older saint, a disabled brother, a deployed cousin? What will you do for them this month?',
    ],
  },

  // ---- Age-appropriate renderings (kids use the app) ----
  levels: {
    child: 'When grown-ups vote, some of them mail their vote in an envelope. This year some leaders wanted the post office to use new rules for those envelopes. Judges said, not this year. The old rules stay. Big news like this can make people say things that are not true. Yahweh says we must be fair when we weigh or count anything. He says, "A false balance is abomination to the LORD: but a just weight is his delight." (Proverbs 11:1). Counting votes is like weighing on a scale. Every real vote should count. No pretend vote should count. Both of those are being fair. Yahweh also tells us to pray for leaders and judges (1 Timothy 2:1-2). And He says, "Thou shalt not bear false witness against thy neighbour." (Exodus 20:16). That means do not say things that are not true about other people. So when you hear big news, do three things. Ask what really happened. Say only what is true. Pray for the people in charge. And when you are old enough, vote on time, the honest way.',
    teen: 'Two newsletters say the Supreme Court "blocked" new mail-in voting rules. Run the moves before you repeat it. (1) Get the ACT right. On March 31 the President signed an executive order; on August 26 the Postal Service finalized a rule requiring pre-approved envelopes with barcodes and a federal portal listing every mail voter, with the Postal Service refusing anything that did not match. Two judges — one nominated by a Democrat, one by President Trump — blocked it. On September 14 the Supreme Court refused to lift the block for this election, saying the government was unlikely to win its challenge and the timing cut against it. Justices Alito and Thomas dissented; Justice Kavanaugh said the Postal Service may well have the power but there was no time to apply the rule fairly. So: the rule is real, it will not run this year, and whether it is LAWFUL is not decided. That is the honest sentence. (2) Weigh the claims. The government says mail fraud is pernicious; a real 2018 scheme in North Carolina forced a new election, and the documented rate across all mail ballots is about four in ten million. The states say lawful ballots would be refused; sworn filings put the cost in millions of envelopes and a portal that was not even live. Both data sets are true. Neither slogan is. (3) Now the Word. Yahweh says "A false balance is abomination to the LORD: but a just weight is his delight." (Proverbs 11:1) — a withheld lawful vote and an added unlawful one are BOTH a false balance, and He hates both. He says a judge must not respect persons, take a gift, or fear faces (Deuteronomy 16:19) — that is how you measure a majority and a dissent alike, not by whose side they landed on. He says the lot is cast but "the whole disposing thereof is of the LORD." (Proverbs 16:33) — so no panic, no gloating. And He says "Thou shalt not bear false witness against thy neighbour." (Exodus 20:16) — so you do not post a claim about a count you cannot source. (4) Do your part. If you can vote: check your state’s deadline today, return the ballot early, confirm it arrived. If you cannot yet: help someone older get theirs in. And pray, first of all, for the President, the judges, and the justices by name (1 Timothy 2:1-2) — the ones you agree with and the ones you do not.',
    senior: 'For the seasoned believer, this lesson is about reading a court through the Word’s own measure of a court, in a season when both political tribes want the bench to be their instrument. First, the record, stated plainly and dated: Executive Order 14399 of March 31, 2026; the Postal Service’s final rule of August 26 (pre-approved envelopes with unique barcodes and an official logo; a federal portal listing intended mail-ballot recipients; refusal to deliver non-conforming ballot mail); Judge Talwani’s June 25 injunction against the order for 23 states and the District, lifted by the Court on August 24 as premature; her September 4 preliminary injunction against the rule; Judge Nichols’s parallel September 13 injunction in the District of Columbia ("No statute grants the Postal Service the power to issue key parts of the Rule"); the Solicitor General’s September 6 application; and the September 14 denial — the Government "is unlikely to succeed on the merits of its challenge to the District Court’s preliminary injunction," the equities against a stay — with Justice Kavanaugh concurring on timing under the Administrative Procedure Act and Justice Alito, joined by Justice Thomas, dissenting on the strength of the States’ ultra vires theory while expressly reserving the merits. Ballots were already in the mail in North Carolina, Alabama, and Wisconsin. Second, the categories kept honestly (Proverbs 18:13, 18:17): the act was a denial of emergency relief; the effect is that the rule will not govern 2026; the merits are open in two district courts and a court of appeals; and the sibling ruling in Watson v. RNC (June 29) shows a consistent position on each side rather than a whim. Third, the claims by the just weight (Leviticus 19:35-36; Proverbs 16:11): documented absentee fraud exists and was prosecuted (North Carolina, 2018-2019); its documented rate is very small; sworn feasibility filings are real; nearly a third of the electorate, the oldest voters most of all, votes lawfully by mail. Neither "any restriction is suppression" nor "any mail ballot is fraud" survives the Word, and the true data under each slogan stands untouched. Fourth — where the Word settles what the debate cannot — the measure of the bench itself is not which side it favored but whether it respected persons, took a gift, or feared a face (Deuteronomy 16:18-20; Exodus 23:8; 2 Chronicles 19:6-7); rulers are ministers in Yahweh’s ordering (Romans 13:1-4; 1 Peter 2:13-14) and are to be prayed for first of all (1 Timothy 2:1-2); the ballot is Caesar’s coin rendered honestly (Matthew 22:21); the disposing of the lot is of the LORD (Proverbs 16:33); and the believer’s own weight in the bag is a true ballot and a true word (Exodus 20:16; Zechariah 8:16). The verdict on any justice’s or official’s soul stays with Yahweh; the verdict on a false balance, and on a false witness about a count, is already written (Proverbs 11:1; Proverbs 12:22; Ecclesiastes 12:14). Then let the response mature past commentary into the Body’s vocation: be the just measure where you stand — vote early and exactly, carry the older and the disabled to the box, serve as a poll worker or observer so your witness is true, and teach the household not to repeat what it cannot source.',
  },

  // ---- Discernment-skill quiz ----
  quiz: {
    questions: [
      {
        q: 'The newsletter says the Supreme Court "blocked" the mail-in rules. What did the Court actually do on September 14, 2026?',
        options: ['Ruled that the Postal Service has no authority over ballot mail', 'Denied the government’s emergency request to lift a district court’s injunction, finding the government unlikely to succeed on that challenge and the equities against a stay', 'Struck down the executive order in full'],
        answer: 1,
        explain: 'The ACT was a denial of a stay; the EFFECT is that the rule will not run in 2026; the MERITS — whether the rule is lawful — remain undecided in the lower courts. Keeping those three apart is the discernment move.',
      },
      {
        q: 'Justice Kavanaugh wrote separately. Which statement best captures what he said?',
        options: ['The Postal Service clearly lacks authority', 'There is at least a fair prospect the rule is within the Postal Service’s authority, but applying it in 2026 would be arbitrary and capricious because officials lack time to implement it', 'The States have no standing'],
        answer: 1,
        explain: 'His concurrence was two-sided — authority plausible, timing fatal. A newsletter carrying only the first half is not lying, but it is incomplete; the Word asks us to hear the whole matter (Proverbs 18:13).',
      },
      {
        q: 'Which label fits the statement "mail-ballot fraud is a particularly pernicious species of fraud"?',
        options: ['Documented fact', 'The government’s characterization — carried as a claim, with the documented cases and the documented small rate stated underneath it', 'A lie'],
        answer: 1,
        explain: 'Real cases exist (the 2018 North Carolina scheme forced a new election) and the documented rate is about four in ten million. Both are stated plainly; "widespread" is unproven and stays a claim (DR-0100).',
      },
      {
        q: 'Yahweh calls both a withheld weight and an added weight an abomination (Proverbs 20:10). Applied to an election, what does that require?',
        options: ['Counting every ballot that arrives, no matter what', 'Rejecting any ballot that came by mail', 'Every lawful vote counted AND no unlawful one counted — both errors are a false balance'],
        answer: 2,
        explain: 'The Word’s standard has two edges at once. Neither slogan — "any restriction is suppression" or "any mail ballot is fraud" — survives it.',
      },
      {
        q: 'How does the Word tell you to measure a judge — and therefore a majority, a concurrence, and a dissent?',
        options: ['By which side they ruled for', 'By whether they respected persons, took a gift, or feared the face of man (Deuteronomy 16:19; Exodus 23:8; Deuteronomy 1:17)', 'By their party of nomination'],
        answer: 1,
        explain: 'The Word does not say a judge must rule for the ruler or against him. Its measure is impartiality, and it applies to every opinion in the case by the same standard.',
      },
      {
        q: 'What does "Thou shalt not bear false witness against thy neighbour" (Exodus 20:16) require of a believer during this election?',
        options: ['Silence about politics', 'Never repeating a claim about a count or an outcome that you cannot source, and stating the documented record plainly', 'Only speaking well of your own side'],
        answer: 1,
        explain: 'False witness runs both ways — inventing a stolen count and denying a documented scheme are both lies. The believer says what is documented and marks what is undecided.',
      },
      {
        q: 'What is the believer’s own part, per the lesson’s stewardship?',
        options: ['Wait for the merits ruling before voting', 'Check the state deadline, complete and return the ballot early by an allowed method, confirm receipt, help an older or disabled neighbour do the same, and pray for every name in the case first of all', 'Post reactions to each opinion'],
        answer: 1,
        explain: 'Render to Caesar what is Caesar’s (Matthew 22:21), pray first of all (1 Timothy 2:1-2), and trust that the disposing of the lot is of the LORD (Proverbs 16:33).',
      },
    ],
  },
};

// =============================================================================
// ISSUE 15 — Evanston's reparations and the equal-protection suit
// (wi-evanston-reparations-and-equal-protection). Darrell forwarded NPR's Up
// First (2026-09-15) with the word Lesson. and the instruction to find each
// subject, research it independently, and build the lesson. This is the deep
// dive: the first US city with a reparations program, its documented 1921
// zoning wrong, the $25,000 grants, the conservative group's suit, and the
// Justice Department's move to join it on an equal-protection theory. Handled
// under DR-0100: the DOCUMENTED harm (the ordinance, the confinement to one
// ward, the mortgage denial) is stated plainly; the LEGAL question is genuinely
// open and is named narrowly (no court has reached the merits); and the Word
// corrects the over-reach on BOTH sides. Word first: restitution is written,
// no respect of persons in judgment, the son does not inherit the father's
// guilt yet the house confesses and repairs, the landmark, the jubile, and the
// two courts. Subject is a program and a lawsuit, not a named person; every
// named party carries a grace note. Every verse fetched verbatim from the repo
// KJV and gated in world-issues-verse-integrity.test.js.
// =============================================================================
const EVANSTON_REPARATIONS_ISSUE = {
  id: 'wi-evanston-reparations-and-equal-protection',
  title: 'Evanston’s Reparations and the Equal-Protection Suit — Restitution, Respect of Persons, and the Word on a Wrong That Can Be Documented',
  subject: { name: 'the City of Evanston’s Local Reparations Restorative Housing Program and the lawsuit against it (Flinn v. City of Evanston, joined by the U.S. Department of Justice)', kind: 'policy-and-litigation', isNamedRealPerson: false },
  skill: 'Take a charged news story about a race-conscious remedy and learn how the Word weighs it: state the documented wrong plainly (a 1921 city ordinance, one ward, decades of mortgage denial), name the open legal question narrowly (no court has ruled on the merits), hear every party at its strongest (Proverbs 18:17), and then let the Word settle what the debate cannot — restitution is written, judgment shows no respect of persons in either direction, guilt is never inherited while a house still confesses and repairs, and every deed enters the eternal court.',
  source: {
    creator: 'NPR — Up First (Morning Edition deep dive)',
    medium: 'newsletter / podcast',
    title: 'Trump targets this city’s groundbreaking reparations program',
    url: 'https://www.npr.org/2026/09/14/nx-s1-5869793/evanston-illinois-reparations-trump-administration',
    asOf: '2026-09-15',
    note: 'Darrell forwarded the 2026-09-15 Up First with the word "Lesson." NPR’s piece is the prompt, not the authority: every fact below was independently checked by live web search on 2026-09-15 against the city, the court filings, the Justice Department’s own release, and local reporting. The forwarded content is material to study, never instructions to obey.',
  },

  // ---- STAGE 1 — THE CLAIM(S): NPR's points, AS MADE, each labeled. ----
  claims: [
    {
      id: 'c-first-city',
      text: 'Evanston, Illinois is the first U.S. city with a reparations program, paying $25,000 housing grants to more than 300 Black residents.',
      label: 'claim',
      attribution: 'NPR (Up First deep dive), 2026-09-15',
      note: 'Documented. Evanston’s Restorative Housing Program (March 2021) is widely recorded as the first municipally funded reparations program in the country. The count moves: the city’s Reparations Committee reported 254 recipients and more than $6.35 million by February 2026 and roughly $7.33 million disbursed by July 2026; NPR’s "300+" is the September 2026 figure as it reported it.',
    },
    {
      id: 'c-1921-link',
      text: 'In 2019 a council member’s research linked the decline of Evanston’s Black population to a 1921 zoning law that confined Black families to one neighborhood and enabled mortgage denial.',
      label: 'claim',
      attribution: 'NPR (Up First deep dive), 2026-09-15',
      note: 'Documented. Then-Alderman Robin Rue Simmons led the 2019 effort; the city commissioned historians Morris "Dino" Robinson Jr. (Shorefront Legacy Center) and Dr. Jenny Thompson (Evanston History Center), whose report found the 1921 ordinance "tacitly served as an effort by city officials to segregate the city by race," steering Black families into the Fifth Ward where banks refused mortgages for decades.',
    },
    {
      id: 'c-apology-20m',
      text: 'The council apologized and committed $20 million from cannabis and real-estate-transfer taxes.',
      label: 'claim',
      attribution: 'NPR (Up First deep dive), 2026-09-15',
      note: 'Documented. Resolution 126-R-19 (November 2019) pledged the first $10 million of adult-use cannabis tax; the commitment was later expanded to $20 million with a share of the real-estate-transfer tax. The money is the city’s own, not a state or federal grant.',
    },
    {
      id: 'c-eligibility',
      text: 'Applicants had to be Black and show that they or an ancestor lived in Evanston between 1919 and 1969.',
      label: 'claim',
      attribution: 'NPR (Up First deep dive), 2026-09-15',
      note: 'Documented. Two categories: "Ancestors" (Black adults living in Evanston at any time 1919–1969) and "Direct Descendants" (their children, grandchildren, great-grandchildren). The $25,000 may go to a home purchase, mortgage assistance, repairs, or — since a March 2023 council vote — direct cash.',
    },
    {
      id: 'c-doj-violates',
      text: 'The Justice Department says the program violates the Equal Protection Clause.',
      label: 'allegation',
      attribution: 'The U.S. Department of Justice, Civil Rights Division, in its June 16, 2026 motion to intervene — as reported by NPR',
      note: 'An allegation in a live case, carried as such. The DOJ’s proposed complaint pleads the Equal Protection Clause of the Fourteenth Amendment and the Fair Housing Act and says the program is "not narrowly tailored to remediating specific, identified instances of past discrimination." No court has ruled on it.',
    },
    {
      id: 'c-frame-trump-stopping',
      text: 'This city led the way on reparations for Black people, and Trump is trying to stop it.',
      label: 'opinion',
      attribution: 'NPR’s headline framing (the member-station headline of the same piece), 2026-09-15',
      note: 'Editorial framing. The documented act is a Justice Department motion to intervene in a private lawsuit filed two years earlier; the DOJ acts under the current administration. "Led the way" and "trying to stop it" are a stance on the merits, not a record — and a discerning reader separates the record from the frame.',
    },
  ],

  // ---- STAGE 2 — VERIFIABLE vs INTERPRETATION ----
  verifiable: [
    {
      id: 'f-1921-and-harms',
      statement: 'Evanston adopted a zoning ordinance in 1921 that, together with restrictive practices by realtors and banks, confined the city’s Black residents to the Fifth Ward, where local banks refused mortgages for decades. The city documented this itself: historians Morris "Dino" Robinson Jr. and Dr. Jenny Thompson were commissioned by the Reparations Subcommittee and produced "Evanston Policies and Practices Directly Affecting the African American Community, 1900–1960 (and Present)" (draft August 2020; released 2021), which found the 1921 ordinance "tacitly served as an effort by city officials to segregate the city by race." The report won a National Council on Public History award in 2022.',
      status: 'documented',
      sources: [
        { title: 'Evanston historians win national award for work documenting city’s history of racial discrimination', publisher: 'Evanston RoundTable', url: 'https://evanstonroundtable.com/2022/02/19/evanston-historians-win-national-council-on-public-history-award/', asOf: '2026-09-15' },
        { title: 'Documenting Historic Harm', publisher: 'Washington University Libraries', url: 'https://library.washu.edu/news/documenting-historic-harm/', asOf: '2026-09-15' },
        { title: 'In Likely First, Chicago Suburb Of Evanston Approves Reparations For Black Residents', publisher: 'NPR', url: 'https://www.npr.org/2021/03/23/980277688/in-likely-first-chicago-suburb-of-evanston-approves-reparations-for-black-reside', asOf: '2026-09-15' },
        { title: 'Trump targets this city’s groundbreaking reparations program', publisher: 'NPR', url: 'https://www.npr.org/2026/09/14/nx-s1-5869793/evanston-illinois-reparations-trump-administration', asOf: '2026-09-15' },
      ],
      note: 'Verified by live web search 2026-09-15. This is DR-0100 Tier 1: established, documented damage, done by the city’s own hand and recorded in the city’s own commissioned report. No party in the lawsuit disputes that the 1921 ordinance existed.',
    },
    {
      id: 'f-program-mechanics',
      statement: 'Timeline: November 2019 — Resolution 126-R-19 commits the first $10 million of adult-use cannabis sales tax to local reparations. March 2021 — the council approves the Local Reparations Restorative Housing Program ($25,000 per eligible person for home purchase, mortgage assistance, or repair). January 2022 — the first 16 recipients are selected by random drawing. 2022 — the fund is expanded toward $20 million with a share of the real-estate-transfer tax. March 2023 — the council allows the $25,000 to be paid as direct cash. Eligibility: "Ancestors" (Black persons who lived in Evanston as adults 1919–1969) and "Direct Descendants" (their children, grandchildren, or great-grandchildren).',
      status: 'documented',
      sources: [
        { title: 'Evanston’s historic reparations program: A 101 guide (parts 1–3)', publisher: 'Evanston RoundTable', url: 'https://evanstonroundtable.com/2022/08/23/evanstons-historic-reparations-program-a-101-guide/', asOf: '2026-09-15' },
        { title: 'Robin Rue Simmons: "Today we take an important step in selecting the first reparations recipients"', publisher: 'Evanston RoundTable', url: 'https://evanstonroundtable.com/2022/01/13/reparations-robin-rue-simmons-important-first-step-statement/', asOf: '2026-09-15' },
        { title: 'Evanston City Council votes in favor of expanding its reparations program to repair housing discrimination', publisher: 'CNN', url: 'https://www.cnn.com/2023/03/27/us/evanston-illinois-reparations-housing-discrimination-expand/index.html', asOf: '2026-09-15' },
        { title: 'Evanston Local Reparations', publisher: 'City of Evanston', url: 'https://www.cityofevanston.org/government/initiatives/evanston_local_reparations.php', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. The money is the city’s own revenue; the apology is the council’s own; the eligibility window (1919–1969) matches the period the city’s report documents.',
    },
    {
      id: 'f-paid-to-date',
      statement: 'As of February 2026 the Reparations Committee reported more than $6.35 million awarded to 254 individuals, with 44 further $25,000 payments announced; by July 2026 the committee reported roughly $7.33 million disbursed. WBEZ (July 2026) put it at "more than $7 million to over 200" residents; NPR (September 2026) said "300+"; the Justice Department’s June 2026 release said the city "has paid out more than $5 million to date." The figures differ by date and by what is counted (awarded vs. disbursed; ancestors vs. descendants), not by dispute.',
      status: 'documented',
      sources: [
        { title: 'Reparations Committee announces 44 new payments, explores Delta-8 tax', publisher: 'The Daily Northwestern', url: 'https://dailynorthwestern.com/2026/02/06/city/reparations-committee-announces-44-new-payments-explores-delta-8-tax/', asOf: '2026-09-15' },
        { title: 'Evanston Reparations Committee addresses federal lawsuit, seeks community support', publisher: 'The Daily Northwestern', url: 'https://dailynorthwestern.com/2026/07/03/city/reparations-committee-addresses-federal-lawsuit-seeks-community-support/', asOf: '2026-09-15' },
        { title: 'Architects of Evanston reparations program stand firm against DOJ attacks', publisher: 'WBEZ Chicago', url: 'https://www.wbez.org/in-the-loop-with-sasha-ann-simons/2026/07/01/architects-of-evanston-reparations-program-stand-firm-against-doj-attacks', asOf: '2026-09-15' },
        { title: 'U.S. Justice Department Moves to Intervene in Race Discrimination Lawsuit Challenging Reparations Program in Evanston, Illinois', publisher: 'U.S. Department of Justice, Office of Public Affairs', url: 'https://www.justice.gov/opa/pr/us-justice-department-moves-intervene-race-discrimination-lawsuit-challenging-reparations', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. A discerning reader carries the range and its dates rather than one round number.',
    },
    {
      id: 'f-suit-and-doj',
      statement: 'Flinn v. City of Evanston, No. 1:24-cv-04269 (N.D. Ill.), was filed in May 2024 by Judicial Watch as a class action on behalf of non-Black descendants of people who lived in Evanston 1919–1969, alleging the race requirement violates the Equal Protection Clause and "uses race as a proxy for discrimination without requiring proof of discrimination." On March 27, 2026, Judge John F. Kness denied the city’s motion to dismiss — holding the plaintiffs had standing and that applying to a program they were ineligible for would have been futile — without reaching the merits. In March 2026 the Justice Department opened an investigation; on June 16, 2026, its Civil Rights Division moved to intervene, pleading the Equal Protection Clause and the Fair Housing Act and arguing the program is "not narrowly tailored to remediating specific, identified instances of past discrimination." Assistant Attorney General Harmeet K. Dhillon: "Simply handing out money based on race, however, is not the answer. It is race discrimination, pure and simple. And it is illegal." Mayor Daniel Biss: "We stand behind our first-in-the-nation reparations program, are confident in its constitutionality, and look forward to defending it in court," describing the program as repair for "specific acts taken by the city on purpose." The city’s legal department said no change to disbursements was planned; in August 2026 the DOJ was still pressing its motion to join.',
      status: 'documented',
      sources: [
        { title: 'U.S. Justice Department Moves to Intervene in Race Discrimination Lawsuit Challenging Reparations Program in Evanston, Illinois', publisher: 'U.S. Department of Justice', url: 'https://www.justice.gov/opa/pr/us-justice-department-moves-intervene-race-discrimination-lawsuit-challenging-reparations', asOf: '2026-09-15' },
        { title: 'Evanston’s reparations plan faces constitutional challenge', publisher: 'Evanston RoundTable', url: 'https://evanstonroundtable.com/2026/06/16/department-of-justice-joins-lawsuit-against-evanstons-reparations-program/', asOf: '2026-09-15' },
        { title: 'Lawsuit challenging Evanston reparations program allowed to proceed', publisher: 'Evanston RoundTable', url: 'https://evanstonroundtable.com/2026/03/30/lawsuit-challenging-evanston-reparations-program-allowed-to-proceed/', asOf: '2026-09-15' },
        { title: 'Flinn v. City of Evanston, 1:24-cv-04269', publisher: 'Civil Rights Litigation Clearinghouse', url: 'https://clearinghouse.net/case/45655/', asOf: '2026-09-15' },
        { title: 'Biss defends reparations amid DOJ challenge', publisher: 'Evanston Now', url: 'https://evanstonnow.com/biss-defends-reparations-amid-doj-challenge/', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. Both sides’ positions are carried in their own words. The March ruling decided who may sue, not who is right.',
    },
    {
      id: 'f-legal-standard',
      statement: 'The governing standard is documented; its application to Evanston is not decided. Under City of Richmond v. J.A. Croson Co. (1989) a state or local racial classification must survive strict scrutiny: a compelling interest and narrow tailoring. Remedying the government’s OWN identified past discrimination can be a compelling interest, but only on a "strong basis in evidence" — general "societal discrimination" is not enough. Students for Fair Admissions v. Harvard (2023) reaffirmed that only two interests have qualified: "remediating specific, identified instances of past discrimination that violated the Constitution or a statute" and avoiding imminent violence in prisons. In 2021 federal courts enjoined race-based federal relief programs as not narrowly tailored (Vitolo v. Guzman, 6th Cir., restaurant grants; Wynn v. Vilsack, M.D. Fla., farm-debt relief). Evanston’s defenders (including Howard University law professor Justin Hansford, who is assisting the city) argue the program rests on the city’s own documented, place-specific wrong and a residency window tied to it — exactly the identified discrimination Croson contemplates; critics (the Cato Institute called it "likely unconstitutional") argue race as the gate, without individual proof of harm, fails narrow tailoring after SFFA. No court has ruled on the merits of Evanston’s program.',
      status: 'partly-documented',
      sources: [
        { title: 'City of Richmond v. J.A. Croson Co., 488 U.S. 469 (1989)', publisher: 'Justia', url: 'https://supreme.justia.com/cases/federal/us/488/469/', asOf: '2026-09-15' },
        { title: 'Equal Protection: Strict Scrutiny of Racial Classifications', publisher: 'Congressional Research Service', url: 'https://www.congress.gov/crs-product/IF12391', asOf: '2026-09-15' },
        { title: 'Students for Fair Admissions, Inc. v. President and Fellows of Harvard College, 600 U.S. ___ (2023)', publisher: 'Justia', url: 'https://supreme.justia.com/cases/federal/us/600/20-1199/', asOf: '2026-09-15' },
        { title: 'Vitolo v. Guzman (6th Cir. 2021)', publisher: 'FindLaw', url: 'https://caselaw.findlaw.com/court/us-6th-circuit/2129637.html', asOf: '2026-09-15' },
        { title: 'Wynn v. Vilsack, 3:21-cv-00514 (M.D. Fla.)', publisher: 'Civil Rights Litigation Clearinghouse', url: 'https://clearinghouse.net/case/18139/', asOf: '2026-09-15' },
        { title: 'Justice Department challenges Evanston’s reparations program', publisher: 'The Hill', url: 'https://thehill.com/regulation/court-battles/5927763-justice-department-evanston-reparations-housing-discrimination/', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. This is the honest boundary of DR-0100 Tier 2, stated narrowly: the STANDARD is settled law; whether Evanston’s evidence and design satisfy it is the one thing genuinely undecided. Nothing here is "no one knows whether a wrong happened."',
    },
  ],
  interpretation: [
    {
      id: 'n-what-is-open-narrowly',
      statement: 'The open question is small and precise: does a city’s documented ordinance plus a residency-in-the-period window satisfy "specific, identified" discrimination and narrow tailoring, or does using race as the eligibility gate — without each applicant proving individual harm — fail strict scrutiny? That is what Judge Kness’s court will decide. What is NOT open: that the 1921 ordinance existed, that it confined Black families to one ward, that mortgages were denied there for decades, that the city itself documented and apologized for it. Keep the categories: the harm is Tier 1; the constitutional fit is Tier 2.',
      restsOn: ['f-1921-and-harms', 'f-suit-and-doj', 'f-legal-standard'],
    },
    {
      id: 'n-two-overreaches',
      statement: 'Two over-reaches sit on either side of the record, and the Word corrects both while the true data under each still stands. "Events more than 100 years ago" can slide into "so nothing is owed" — but a documented wrong is not erased by a calendar (2 Samuel 21:1 answers a wrong from a prior king’s reign; Proverbs 23:10-11 names a mighty Redeemer for the fatherless whose field was entered). And "the harm was real" can slide into "therefore any race-based rule is justice" — but the Word forbids respect of persons in judgment in BOTH directions (Leviticus 19:15) and ties restitution to the one wronged, by the one who wronged (Leviticus 6:5; Numbers 5:7). Both corrections leave the true thing beneath each side untouched: the wrong happened; a remedy must be just in its form as well as its aim.',
      restsOn: ['f-1921-and-harms', 'f-legal-standard'],
    },
    {
      id: 'n-headline-frame',
      statement: '"Trump is trying to stop it" is a frame laid over a filing. The documented act is the Justice Department moving to join a suit private plaintiffs filed in 2024; the DOJ is the administration’s, so the frame is not false — but it turns a legal question into a personality contest, and a discerning reader declines to let a headline choose the category for them.',
      restsOn: ['f-suit-and-doj'],
    },
    {
      id: 'n-numbers-carry-dates',
      statement: '"300+" (NPR, September 2026), "over 200" (WBEZ, July 2026), "254" (the committee, February 2026), and "more than $5 million" (the DOJ, June 2026) are not contradictions; they are different dates and different counts (awarded vs. disbursed). Carry the number with its date and its source — that is what a just weight looks like in reporting (Proverbs 11:1).',
      restsOn: ['f-paid-to-date'],
    },
  ],

  // ---- STAGE 3 — PERSPECTIVES on the UNRESOLVED parts ----
  perspectives: [
    {
      id: 'p-city',
      label: 'The city — documented, local, apologized, self-funded',
      heldBy: 'The City of Evanston (Mayor Daniel Biss, the Reparations Committee under Robin Rue Simmons) and the scholars assisting its defense',
      steelman: 'At its strongest: this is not "societal discrimination" in the abstract. It is one municipality’s own ordinance, from its own council, in its own archive, documented by historians it commissioned — the very "strong basis in evidence" the Supreme Court asked for in Croson. The remedy is bounded to the place (Evanston), the period the wrong operated (1919–1969), the people the wrong was aimed at (Black residents and their direct descendants), and the good it took (housing). The money is the city’s own tax revenue, not another citizen’s wages, and the city chose it in the open with an apology. A wrongdoer who names his wrong, funds the repair himself, and limits it to the people he wronged is doing what the Word calls restitution — "he shall even restore it in the principal" (Leviticus 6:5). If a city may never repair a wrong it can document, then documentation is worthless and the ordinance wins twice.',
    },
    {
      id: 'p-doj-plaintiffs',
      label: 'The Justice Department and the plaintiffs — equal protection binds the remedy too',
      heldBy: 'The DOJ Civil Rights Division (Assistant Attorney General Harmeet K. Dhillon), Judicial Watch, and the Flinn plaintiffs',
      steelman: 'At its strongest: the Fourteenth Amendment does not have an exception for good intentions, and the Court has held for decades that every racial classification by government — benign or hostile — must pass strict scrutiny. The plaintiffs are descendants of people who lived in Evanston in the same years; they are turned away at the door for one reason, their race. The program asks no applicant to show that he, or his ancestor, was actually confined by the ordinance or refused a mortgage; it uses race as a proxy for harm, which is exactly the shortcut Croson and SFFA forbid. A remedy for identified discrimination is lawful — but it must be tailored to the identified victims, and a race-neutral design (residence in the Fifth Ward, a documented denial, a deed with a restrictive covenant) could reach them without a racial gate. Two federal courts in 2021 enjoined race-gated relief on just this reasoning. This is not a claim that the 1921 wrong never happened; it is a claim that the Constitution governs how a wrong may be repaired.',
    },
    {
      id: 'p-recipients',
      label: 'The recipients and Evanston’s Black families — the harm is specific and it has names',
      heldBy: 'Ancestors and Direct Descendants who have received or applied for the grant; the Fifth Ward community; the historians who gathered their documents',
      steelman: 'At its strongest: this harm is not a theory. It is a grandmother who could not get a mortgage a mile from the lake, a deed with a covenant, a family that rented for forty years in the one ward the city allowed and so never built the equity a white family the same age built by default. The applicants proved residence with documents; the Shorefront Legacy Center helped them find the records the city itself had kept. To be told now that the repair is "race discrimination, pure and simple" lands as the wrong being done twice — first the exclusion, then the erasure. Even the 1921 ordinance was aimed at them BY race; a remedy that names the same people is naming the wrong, not inventing a new one. And the amount, $25,000 against a lifetime of lost equity, is closer to a fifth part than a fourfold. Some in this community argued from the start that a housing-only benefit was too small to be called reparations at all — an honest dissent from inside, not from outside.',
    },
    {
      id: 'p-scholars-tailoring',
      label: 'Legal scholars on narrow tailoring — the case turns on fit, and fit is contested',
      heldBy: 'Constitutional scholars across the spectrum (Justin Hansford, Howard University, assisting the city; commentators at the Cato Institute and others who expect the program to fail strict scrutiny)',
      steelman: 'Heard fairly: the law asks two questions, and the second is where this case lives. First, is there a compelling interest? Evanston’s record — a specific ordinance, a specific ward, a commissioned report — is far stronger than Richmond’s in Croson, and even critics concede the documentation is real. Second, is the program narrowly tailored to that interest? Here honest scholars divide, and the division is about legal design, not about history: does a racial eligibility gate plus a residency window fit the identified victims tightly enough, or must the city require individualized proof or use race-neutral proxies? After SFFA and the 2021 relief cases the trend is toward requiring tighter fit, which is why Cato calls the program "likely unconstitutional"; Hansford and others answer that a remedy for a wrong done BY race cannot be forbidden from naming the race it was done to. The scholars are not debating whether the harm happened. They are debating the form a lawful repair must take — and that is precisely what a court, not a headline, will settle.',
    },
  ],

  // ---- STAGE 4 — THE BELIEVER'S LENS ----
  lens: {
    fourD: {
      deepSource: 'WORD FIRST — Yahweh wrote restitution into His law before any city council existed, and He tied it to a wrong that can be named. "If a man shall steal an ox, or a sheep, and kill it, or sell it; he shall restore five oxen for an ox, and four sheep for a sheep." (Exodus 22:1) "If the theft be certainly found in his hand alive, whether it be ox, or ass, or sheep; he shall restore double." (Exodus 22:4) When a neighbour is wronged by violence or deceit — "in a thing taken away by violence, or hath deceived his neighbour" (Leviticus 6:2) — the wrongdoer "shall restore that which he took violently away, or the thing which he hath deceitfully gotten" (Leviticus 6:4), and "he shall even restore it in the principal, and shall add the fifth part more thereto, and give it unto him to whom it appertaineth" (Leviticus 6:5). Numbers repeats it with confession attached: "Then they shall confess their sin which they have done: and he shall recompense his trespass with the principal thereof, and add unto it the fifth part thereof, and give it unto him against whom he hath trespassed." (Numbers 5:7) Notice the shape of the Word’s restitution: a NAMED wrong, a NAMED wronged party, paid BY the one who did it, in the principal plus more. Zacchaeus did it with no court in the room: "if I have taken any thing from any man by false accusation, I restore him fourfold" (Luke 19:8) — and Jesus answered, "This day is salvation come to this house" (Luke 19:9). Nehemiah demanded it of leaders who had taken land: "Restore, I pray you, to them, even this day, their lands, their vineyards, their oliveyards, and their houses" (Nehemiah 5:11). And land is the Word’s own example of what must not be taken: "Thou shalt not remove thy neighbour’s landmark, which they of old time have set in thine inheritance" (Deuteronomy 19:14); "Cursed be he that removeth his neighbour’s landmark." (Deuteronomy 27:17) "Remove not the old landmark; and enter not into the fields of the fatherless:" (Proverbs 23:10) "For their redeemer is mighty; he shall plead their cause with thee." (Proverbs 23:11) Isaiah pronounced woe on those "that join house to house, that lay field to field, till there be no place" (Isaiah 5:8), and Micah on those who "covet fields, and take them by violence; and houses, and take them away: so they oppress a man and his house, even a man and his heritage" (Micah 2:2). A zoning ordinance that fenced one people into one ward and a bank that would not lend there is, in the Word’s vocabulary, a landmark moved and a heritage taken — and the jubile is Yahweh’s own design for restoring inheritance across generations: "proclaim liberty throughout all the land unto all the inhabitants thereof: it shall be a jubile unto you; and ye shall return every man unto his possession" (Leviticus 25:10); "In the year of this jubile ye shall return every man unto his possession." (Leviticus 25:13) SECOND, the same Word forbids respect of persons in judgment — in BOTH directions. "Ye shall do no unrighteousness in judgment: thou shalt not respect the person of the poor, nor honor the person of the mighty: but in righteousness shalt thou judge thy neighbour." (Leviticus 19:15) "Ye shall not respect persons in judgment; but ye shall hear the small as well as the great" (Deuteronomy 1:17). "Neither shalt thou countenance a poor man in his cause." (Exodus 23:3) Peter learned it at Cornelius’s house: "God is no respecter of persons" (Acts 10:34); James made it sin: "if ye have respect to persons, ye commit sin, and are convinced of the law as transgressors" (James 2:9). So the Word will not let a court favor the mighty city or the mighty government — and it will not let a court favor a party because his cause is sympathetic. THIRD, the distinction this house taught in Living Lesson L154 governs here, and it must be kept exactly: guilt is never inherited — "The son shall not bear the iniquity of the father, neither shall the father bear the iniquity of the son" (Ezekiel 18:20) — and yet the saints CONFESS the fathers’ deeds as the house’s own, "stood and confessed their sins, and the iniquities of their fathers" (Nehemiah 9:2), because no living Evanstonian inherits the guilt of the 1921 council while the CITY, as a continuing house, may still confess and repair what its own hand did. Leviticus promised what follows such a confession: "If they shall confess their iniquity, and the iniquity of their fathers" (Leviticus 26:40) — "Then will I remember my covenant with Jacob… and I will remember the land." (Leviticus 26:42) Daniel prayed it: "O Lord, to us belongeth confusion of face, to our kings, to our princes, and to our fathers, because we have sinned against thee." (Daniel 9:8) And David is the case law: a famine came "for Saul, and for his bloody house, because he slew the Gibeonites" (2 Samuel 21:1), a wrong from a PRIOR king’s administration, and David — who bore none of Saul’s guilt — asked the wronged, "What shall I do for you? and wherewith shall I make the atonement" (2 Samuel 21:3). The kingdom repaired what an earlier kingdom broke, without any son being charged with a father’s sin. That is the exact frame for a city that says "we caused this" in 2021 about a council of 1921. FOURTH, justice for the oppressed is commanded, not optional: "Learn to do well; seek judgment, relieve the oppressed, judge the fatherless, plead for the widow." (Isaiah 1:17) "to do justly, and to love mercy, and to walk humbly with thy God" (Micah 6:8). "But let judgment run down as waters, and righteousness as a mighty stream." (Amos 5:24) "Woe unto them that decree unrighteous decrees, and that write grievousness which they have prescribed" (Isaiah 10:1) — a written ordinance is a decree, and the Word has a category for it. SO IN THIS CASE the believer does four things in order. First, state the documented wrong plainly, because "Prove all things; hold fast that which is good." (1 Thessalonians 5:21): the 1921 ordinance, the one ward, the decades of mortgage denial, the city’s own report and apology — Tier 1, said without a hedge. Second, name the open question narrowly — "He that answereth a matter before he heareth it, it is folly and shame unto him." (Proverbs 18:13); "He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him." (Proverbs 18:17): no court has ruled whether this design is narrowly tailored, and this lesson does not pretend to be that court. Third, let the Word correct the over-reach on both sides: "it was a hundred years ago, nothing is owed" fails before the Gibeonites and the landmark; "any race-based rule is justice" fails before Leviticus 19:15 and Exodus 23:3, and before the Word’s own restitution, which is paid to "him to whom it appertaineth" (Leviticus 6:5) — the wronged, specifically. Where the Word is silent — it gives no ruling on the Fourteenth Amendment or on whether a category rule or an individual proof satisfies man’s court — this lesson says so and stops. Fourth, remember that the measure the Word cares most about is not which brief wins but whether a documented wrong is REPAIRED to the ones it was done to, by the one who did it, in the principal and more — and that "God shall bring every work into judgment, with every secret thing" (Ecclesiastes 12:14), the ordinance of 1921 and every filing of 2026 alike.',
      scripture: 'Exodus 22:1; Exodus 22:4; Leviticus 6:2-5; Numbers 5:6-7; Luke 19:8-9; Nehemiah 5:11; Deuteronomy 19:14; Deuteronomy 27:17; Proverbs 22:28; Proverbs 23:10-11; Isaiah 5:8; Micah 2:2; Leviticus 25:10; Leviticus 25:13; Leviticus 25:23; Leviticus 19:15; Deuteronomy 1:17; Deuteronomy 16:19; Exodus 23:3; Acts 10:34; James 2:9; Romans 2:11; Ezekiel 18:20; Deuteronomy 24:16; Nehemiah 9:2; Leviticus 26:40-42; Daniel 9:8; 2 Samuel 21:1-3; Isaiah 1:17; Micah 6:8; Amos 5:24; Isaiah 10:1-2; 1 Thessalonians 5:21; Proverbs 18:13; Proverbs 18:17; Ecclesiastes 12:14',
    },
    threeD: 'Practically: read the story and sort it before you repeat it. Say the proven part out loud without softening — Evanston passed a zoning ordinance in 1921 that confined Black families to one ward where banks refused mortgages for decades; the city documented it, apologized, and set aside its own money. Then say the open part exactly as narrow as it is: a federal judge has let the suit proceed and the Justice Department has moved to join it; no court has decided whether a race-gated remedy for a documented city wrong passes strict scrutiny — that is the one live question. Refuse both shortcuts: do not let "a hundred years ago" become "nothing happened," and do not let "the harm was real" become "therefore the form of the remedy cannot be questioned." Hear all four voices at their strongest (Proverbs 18:17) — the city, the DOJ and plaintiffs, the recipients, the scholars — and notice that none of them denies the ordinance; they differ on the lawful shape of repair. Then let the Word give you its own measure, which is older than the Fourteenth Amendment and stricter than any brief: a named wrong, a named wronged party, repaired by the one who did it, in the principal and more (Leviticus 6:5; Numbers 5:7), with no respect of persons in the judging of it (Leviticus 19:15). Carry numbers with their dates. Pray for the judge by name and for every party. And bring it home: Zacchaeus did not wait for a ruling.',
    accountability: {
      statement: 'THE TWO COURTS. Man’s court is open on this one — Judge Kness’s courtroom will decide whether Evanston’s program stands, and this lesson invents no verdict either way. But the Word never lets accountability shrink to the docket. The 1921 council that wrote grievousness into an ordinance answers to the court that reads every decree: "Woe unto them that decree unrighteous decrees, and that write grievousness which they have prescribed" (Isaiah 10:1) — where "God shall bring every work into judgment, with every secret thing, whether it be good, or whether it be evil." (Ecclesiastes 12:14) The bank that would not lend in one ward answers there: "He that oppresseth the poor reproacheth his Maker" (Proverbs 14:31). The fields entered have a Redeemer: "For their redeemer is mighty; he shall plead their cause with thee." (Proverbs 23:11) And every party in 2026 — the city, the department, the plaintiffs, the recipients — answers in the same court for the honesty of its brief and the respect of persons in its heart: "Ye shall not respect persons in judgment" (Deuteronomy 1:17); "if ye have respect to persons, ye commit sin" (James 2:9). WHAT A CITY OWES under the Word is not a winning argument but the repair: "he shall even restore it in the principal, and shall add the fifth part more thereto, and give it unto him to whom it appertaineth" (Leviticus 6:5); "Restore, I pray you, to them, even this day" (Nehemiah 5:11). WHAT A COURT OWES is judgment without a thumb on either scale: "thou shalt not respect the person of the poor, nor honor the person of the mighty" (Leviticus 19:15). WHAT WE OWE: "Defend the poor and fatherless: do justice to the afflicted and needy." (Psalms 82:3); "Execute true judgment, and shew mercy and compassions every man to his brother" (Zechariah 7:9); "to do justly, and to love mercy, and to walk humbly with thy God" (Micah 6:8). And the lived cost is not deferred evidence — the equity a family never built is seen and weighed now. No one gets away: "God is not mocked: for whatsoever a man soweth, that shall he also reap." (Galatians 6:7) "and the books were opened" (Revelation 20:12).',
      scripture: 'Isaiah 10:1-2; Ecclesiastes 12:14; Proverbs 14:31; Proverbs 23:11; Deuteronomy 1:17; James 2:9; Leviticus 6:5; Nehemiah 5:11; Leviticus 19:15; Psalms 82:3; Zechariah 7:9-10; Micah 6:8; Galatians 6:7; Revelation 20:12',
    },
    benefits: [
      'Both courts, honestly held: man’s court has not ruled on Evanston’s program and this lesson does not pretend to — while the ETERNAL court holds the 1921 ordinance, the mortgage denials, and every 2026 brief alike, and lands after this life (Ecclesiastes 12:14; Isaiah 10:1). You can speak the wrong plainly without inventing a verdict.',
      'Freedom from two lies at once: the dismissal lie ("it was a hundred years ago, so nothing is owed") and the shortcut lie ("the harm was real, so any race-based rule is justice").',
      'The Word’s own restitution in your hands: a named wrong, a named wronged party, repaired by the one who did it, in the principal plus more (Exodus 22:4; Leviticus 6:5; Numbers 5:7; Luke 19:8) — a measure older and stricter than any brief.',
      'The L154 distinction kept exactly where the news blurs it: no living person inherits the guilt of a 1921 council (Ezekiel 18:20), and a house may still confess and repair what its own hand did (Nehemiah 9:2; 2 Samuel 21:1-3).',
      'A repeatable skill: state what is documented, name what is open as narrowly as it really is, carry every number with its date and source, hear every party at its strongest, and let the Word judge the form of repair as well as its aim.',
      'No respect of persons in your own judging: the Word forbids favoring the mighty AND favoring the sympathetic (Leviticus 19:15; Exodus 23:3), so you can read this case without a thumb on either scale.',
      'A church that moves without a court: Zacchaeus restored fourfold before any suit was filed, and the Body can search its own records and repair its own wrongs the same way.',
    ],
    graceNote: 'No condemnation of any soul in this story. Not the 1921 council members, long dead, whose hearts Yahweh alone judged; not Robin Rue Simmons or Mayor Daniel Biss, who named a wrong and tried to repair it; not Assistant Attorney General Harmeet K. Dhillon, Judicial Watch, or the Flinn plaintiffs, who say the Constitution binds the form of the repair; not Judge John F. Kness, who must rule; not the historians, the scholars on either side, or a single recipient or applicant. Yahweh is no respecter of persons in either direction, and this lesson pronounces on no one’s heart. But leaving every soul to Him never mutes the record: the ordinance was real, the ward was real, the mortgages were denied, and the Word’s remedy for a documented wrong is repair to the ones it was done to. Truth and grace meet in Jesus, who sat at a swindler’s table and watched him restore fourfold, and said salvation had come to that house.',
    stewardship: 'The deeper response to a fight over how a city repairs its wrong is for the CHURCH to repair its own without waiting for a ruling. Zacchaeus did not need a court; he needed Jesus at his table, and he said "I restore him fourfold" on the spot. Jesus told us the order: "Leave there thy gift before the altar, and go thy way; first be reconciled to thy brother, and then come and offer thy gift." (Matthew 5:24) So: open your own records. Many congregations sit on land, deeds, and histories that include a covenant, a segregated pew, a member turned away, a property acquired when a neighbor could not get a loan. Search the archive the way Evanston searched its own — honestly, with historians, in the open. Where a wrong is documented, name it, confess it as the house’s own without charging any living member with a dead man’s guilt, and restore in the principal and more to the people it was done to — a scholarship, a house, a deed, a mortgage paid down, a fifth part added. Build the jubile inside the Body: "ye shall return every man unto his possession" (Leviticus 25:13). Isaiah names who does this: "thou shalt be called, The repairer of the breach, The restorer of paths to dwell in." (Isaiah 58:12) Righteous engagement names the wrong and prays for the court; it is completed by a church that repairs its own breach first.',
    anchor: {
      ref: 'Leviticus 6:5; Luke 19:8',
      theme: 'Restitution is written — "he shall even restore it in the principal, and shall add the fifth part more thereto, and give it unto him to whom it appertaineth" — and Zacchaeus showed what it looks like with no court in the room: "if I have taken any thing from any man by false accusation, I restore him fourfold." Name the wrong plainly; judge with no respect of persons; repair to the ones it was done to.',
    },
  },

  // ---- STAGE 5 — REFLECTION + SKILL ----
  reflection: {
    skill: 'When a race-and-money story lands in your feed: PAUSE. Separate the documented wrong (an ordinance, a ward, a mortgage record you can source) from the open legal question (which is usually narrower than the headline). Say the documented part plainly — refusing to name a real wrong is false witness. Say the open part exactly as narrow as it is — no court had ruled, so do not rule for it. Hear every party at its strongest and notice what none of them disputes. Then let the Word give its own measure: a named wrong, a named wronged party, repaired by the one who did it, in the principal and more, judged with no respect of persons. And respond the Zacchaeus way — search your own house and restore — not the comment-section way.',
    practice: 'Take the Evanston story. Write four lines: (1) one sentence of what is DOCUMENTED, with a source and its date; (2) one sentence naming the open legal question as narrowly as it really is; (3) one sentence on where each side’s over-reach begins and which verse corrects it; (4) one concrete act of restitution you, your family, or your church could make this month for a wrong you can document — without waiting for anyone to sue.',
    prompts: [
      'Which parts of NPR’s story are documented (the 1921 ordinance, the $20 million, the 1919–1969 window, the DOJ filing) and which is the frame ("Trump is trying to stop it")? How would you check each?',
      'The Word’s restitution is paid "unto him to whom it appertaineth" (Leviticus 6:5) by the one who did the wrong. Walk through how the city’s design tries to match that shape — place, period, people, the good taken — and where the DOJ says it does not. What is each side actually disputing?',
      'Leviticus 19:15 forbids favoring the poor AND honoring the mighty in judgment. What would it look like to read this case with a thumb on neither scale — and where do you feel the pull toward one?',
      'Living Lesson L154 taught that guilt is never inherited (Ezekiel 18:20) while the house confesses the fathers’ deeds (Nehemiah 9:2). Where is that line in Evanston’s case — who bears no guilt, and who may still confess and repair? Use 2 Samuel 21:1-3 as the test case.',
      'No court has ruled on the merits. Practice saying the open question in ONE sentence that neither dismisses the wrong nor pre-decides the law.',
      'Zacchaeus restored fourfold with no court in the room (Luke 19:8). What wrong could your church document in its own records, and what would "the principal and the fifth part" look like for it?',
      'Carry a number with its date: "254 by February 2026," "300+ by September 2026," "more than $5 million per the DOJ in June." Why is that discipline part of a just weight (Proverbs 11:1)?',
    ],
  },

  // ---- Age-appropriate renderings (kids use the app) ----
  levels: {
    child: 'Here is a true story from a town called Evanston. A long time ago, in 1921, the town made a rule. The rule said Black families could only live in one part of town. Banks would not lend them money to buy a house there. That was wrong. It hurt real families for a long time. Many years later, the town looked at its old papers and found the rule. The town said, we are sorry. Then the town began giving money to those families and their children and grandchildren, to help with a home. Now some people have gone to a judge. They say the town should not pick who gets help by the color of their skin. The judge has not decided yet. What does Yahweh say? First, when you take something that is not yours, you give it back, and more. The Bible says a thief "shall restore double" (Exodus 22:4). A man named Zacchaeus had taken money that was not his. When Jesus came to his house, he said, "I restore him fourfold" (Luke 19:8). He gave back four times as much. Nobody made him do it. Second, a judge must be fair to everyone. The Bible says "ye shall hear the small as well as the great" (Deuteronomy 1:17). A judge must not pick a side because someone is big, or because someone is sad. Third, you are not guilty for what your grandpa did. "The son shall not bear the iniquity of the father" (Ezekiel 18:20). You do not inherit his guilt. But a family can still confess an old wrong and help fix it. Nehemiah’s people did that (Nehemiah 9:2). So here is what to do. Say the true part out loud: the old rule was real, and it hurt people. Say the open part honestly: the judge has not decided. And do what Zacchaeus did in your own life. If you took something, give it back, and give more. Yahweh sees every deed. And He loves it when we make things right.',
    teen: 'NPR ran a deep dive on Evanston, Illinois — the first U.S. city with a reparations program — and on the Justice Department joining a lawsuit to stop it. Run the moves before you take a side. (1) Say what is documented, plainly. In 1921 Evanston passed a zoning ordinance that confined Black families to the Fifth Ward, where banks refused mortgages for decades; the city commissioned historians, found it in its own archive, apologized, and set aside $20 million of its own cannabis and real-estate-transfer tax to pay $25,000 to Black residents who lived there 1919–1969 and their direct descendants. That is not "some say." That is the record. (2) Say what is open, and say it narrowly. A conservative group sued in 2024 on behalf of non-Black descendants of Evanston residents, arguing the race requirement violates equal protection; a federal judge let the case proceed in March 2026 without deciding who is right; the DOJ moved to join in June, saying the program is "not narrowly tailored to remediating specific, identified instances of past discrimination." No court has ruled on the merits. The live question is about the FORM of the repair — whether a race-gated rule fits the identified victims tightly enough — not about whether the wrong happened. (3) Hear everyone at their strongest. The city: our own ordinance, our own money, our own apology, bounded to our own victims. The DOJ and plaintiffs: the Constitution binds remedies too, and race as a proxy for harm is the shortcut the Supreme Court forbids. The recipients: this harm has names, and being told the repair is "discrimination" lands as the wrong done twice. The scholars: the fight is over fit, and honest people divide. Notice that none of them denies 1921. (4) Now the Word. Restitution is written before any constitution: "he shall even restore it in the principal, and shall add the fifth part more thereto, and give it unto him to whom it appertaineth" (Leviticus 6:5) — a named wrong, a named wronged party, repaired by the one who did it. Zacchaeus did it with no court: "I restore him fourfold" (Luke 19:8). Land taken is a landmark moved: "Remove not the old landmark; and enter not into the fields of the fatherless" (Proverbs 23:10). And judgment must show no respect of persons in EITHER direction: "thou shalt not respect the person of the poor, nor honor the person of the mighty" (Leviticus 19:15). Keep the L154 line exactly: nobody alive inherits the 1921 council’s guilt — "The son shall not bear the iniquity of the father" (Ezekiel 18:20) — and yet a house may still confess what its fathers did and repair it (Nehemiah 9:2), the way David repaired Saul’s wrong to the Gibeonites though he bore none of Saul’s guilt (2 Samuel 21:1-3). So the Word corrects both over-reaches: "a hundred years ago, nothing is owed" fails; "any race-based rule is justice" fails. What stands is the record and the measure. (5) Your move: carry numbers with dates, pray for the judge and every party by name, and do the Zacchaeus thing in your own house before anyone sues.',
    senior: 'For the seasoned believer, this lesson is about weighing a race-conscious remedy with the Word’s own law of restitution, in an age that offers only two scripts — outrage and dismissal — for a question that deserves neither. First, the documented record, stated without a hedge (DR-0100 Tier 1): Evanston’s 1921 zoning ordinance, which the city’s own commissioned historians found "tacitly served as an effort by city officials to segregate the city by race"; the confinement of Black residents to the Fifth Ward and the decades of mortgage denial there; the council’s apology; Resolution 126-R-19 (November 2019) and the $20 million commitment from the city’s own cannabis and real-estate-transfer taxes; the $25,000 grants, paid since January 2022, to "Ancestors" who lived in Evanston 1919–1969 and their direct descendants — some $6.35 million to 254 people by February 2026, roughly $7.33 million by July, "300+" by NPR’s September count. Second, the open question, named as narrowly as it truly is (Tier 2): Flinn v. City of Evanston (N.D. Ill., filed May 2024 by Judicial Watch), which Judge John F. Kness allowed to proceed on March 27, 2026 without reaching the merits, and which the Justice Department’s Civil Rights Division moved to join on June 16, 2026 under the Equal Protection Clause and the Fair Housing Act, arguing the program is "not narrowly tailored to remediating specific, identified instances of past discrimination." The governing law is settled — Croson’s strict scrutiny and "strong basis in evidence," SFFA’s two compelling interests, the 2021 relief-program injunctions — and its application to Evanston is undecided; the scholars’ division is over fit, not over history. Third, the Word, which is older than the Fourteenth Amendment and stricter than any brief. Restitution is written and shaped: a named wrong, a named wronged party, repaid by the wrongdoer "in the principal" with "the fifth part more thereto" and given "unto him to whom it appertaineth" (Leviticus 6:5; Numbers 5:7; Exodus 22:1, 4); Zacchaeus enacted it without a court (Luke 19:8-9); Nehemiah commanded it of leaders who had taken land (Nehemiah 5:11); the landmark texts (Deuteronomy 19:14; 27:17; Proverbs 23:10-11) and the prophets (Isaiah 5:8; Micah 2:2) give a written ordinance that fenced a people into one ward its true name; the jubile is Yahweh’s design for restoring inheritance across generations (Leviticus 25:10, 13). Against that, and with equal weight, judgment must show no respect of persons in either direction — "thou shalt not respect the person of the poor, nor honor the person of the mighty" (Leviticus 19:15); "Neither shalt thou countenance a poor man in his cause." (Exodus 23:3); "if ye have respect to persons, ye commit sin" (James 2:9). And the distinction this house fixed in Living Lesson L154 must be kept precisely where the public debate blurs it: guilt is never inherited — "The son shall not bear the iniquity of the father" (Ezekiel 18:20) — so no living Evanstonian is charged with 1921; yet the house may confess and repair what its own hand did — "stood and confessed their sins, and the iniquities of their fathers" (Nehemiah 9:2; Leviticus 26:40-42; Daniel 9:8) — as David, bearing none of Saul’s guilt, repaired Saul’s wrong to the Gibeonites (2 Samuel 21:1-3). From that frame the Word corrects the over-reach on both sides and leaves the true data under each intact: "events more than 100 years ago" cannot become "nothing is owed," and "the harm was real" cannot become "therefore the form of the remedy is beyond question." Where the Word is silent — on the Fourteenth Amendment, on whether a categorical rule or an individualized proof satisfies man’s court — the seasoned reader says so and stops, and prays for the judge by name. Then let the response mature past commentary into the Body’s own vocation: the church that searches its own deeds, confesses its own documented wrongs as the house’s own, and restores in the principal and more to the people they were done to — the repairer of the breach (Isaiah 58:12), with no lawsuit required.',
  },

  // ---- Discernment-skill quiz ----
  quiz: {
    questions: [
      {
        q: 'NPR says Evanston’s 1921 zoning law confined Black families to one neighborhood where mortgages were denied. What is the discernment move?',
        options: ['Hedge it — "some say" the ordinance was discriminatory', 'State it plainly as documented: the city’s own commissioned report found it, the city apologized, and no party in the suit disputes it', 'Dismiss it — it was a hundred years ago'],
        answer: 1,
        explain: 'DR-0100 Tier 1: established, documented damage is said plainly. Under-claiming a verified wrong is as much a failure of truth as over-claiming an unverified one.',
      },
      {
        q: '"The DOJ says the program violates the Equal Protection Clause." Which label fits, and why?',
        options: ['Documented fact — the DOJ said it, so it is settled', 'Allegation in a live case — pleaded in a June 2026 motion; no court has ruled on the merits', 'Opinion — lawyers just disagree'],
        answer: 1,
        explain: 'A filing is a claim, not a verdict. Judge Kness’s March 2026 ruling decided only that the plaintiffs may sue; the merits are undecided. Carry it as an allegation, narrowly.',
      },
      {
        q: 'What is the ONE question genuinely open in Flinn v. City of Evanston?',
        options: ['Whether the 1921 ordinance existed', 'Whether a race-gated remedy for a city’s documented wrong is "narrowly tailored" to the identified victims under strict scrutiny', 'Whether reparations are a good idea in general'],
        answer: 1,
        explain: 'Tier 2 is named narrowly. Every party agrees the ordinance existed; the scholars divide over the lawful FORM of repair. That is what the court will settle — not this lesson.',
      },
      {
        q: 'What is the shape of restitution in the Word (Leviticus 6:5; Numbers 5:7)?',
        options: ['A general apology to society', 'A named wrong, a named wronged party, repaid by the one who did it, in the principal plus a fifth part', 'Whatever a court orders'],
        answer: 1,
        explain: '"he shall even restore it in the principal, and shall add the fifth part more thereto, and give it unto him to whom it appertaineth." The Word ties repair to the specific wronged — a measure older and stricter than any brief.',
      },
      {
        q: 'Leviticus 19:15 says "thou shalt not respect the person of the poor, nor honor the person of the mighty." What does that require of you reading this case?',
        options: ['Side with the city because its cause is sympathetic', 'Side with the government because it is powerful', 'Judge with a thumb on neither scale — the Word forbids favoring the mighty AND favoring the sympathetic'],
        answer: 2,
        explain: 'Respect of persons runs both ways. The Word will not let a court, or a reader, decide by who is big or who is sad, but "in righteousness shalt thou judge thy neighbour."',
      },
      {
        q: 'L154 taught that guilt is never inherited (Ezekiel 18:20). Does that mean Evanston cannot repair a 1921 wrong?',
        options: ['Yes — no one alive did it, so nothing can be done', 'No — no living person inherits the guilt, yet a house may still confess and repair what its own hand did, as David repaired Saul’s wrong to the Gibeonites (Nehemiah 9:2; 2 Samuel 21:1-3)', 'Yes — the Word forbids any collective act'],
        answer: 1,
        explain: 'Two subjects, both kept: guilt (never transferred) and confession-and-repair (the house’s own). David bore none of Saul’s guilt and still asked the wronged, "wherewith shall I make the atonement" (2 Samuel 21:3).',
      },
      {
        q: 'What did Zacchaeus do that no court required (Luke 19:8)?',
        options: ['Waited for a ruling', 'Said "I restore him fourfold" on the spot, and Jesus said salvation had come to his house', 'Gave to a general charity instead'],
        answer: 1,
        explain: 'Restitution without a lawsuit is the stewardship move for the Body: search your own records, confess your own documented wrong, and restore to the ones it was done to.',
      },
    ],
  },
};

// =============================================================================
// ISSUE 14 — The Kennedy Center on the brink: whose name goes on the house, and
// the Word on names, patrons, and the arts (wi-kennedy-center-bankruptcy-and-the-name).
// Darrell forwarded NPR's Up First of 2026-09-15 with one word — Lesson. — and the
// instruction to find each subject, research it independently, and build the
// lesson. This issue takes the Kennedy Center item: the board's own resolutions
// saying the arts center is weeks from missing payroll and unsafe to occupy, its
// stated judgment that only President Trump can lead the fiscal rescue and so his
// name belongs on the marble, Rep. Joyce Beatty's suit before Judge Christopher
// Cooper (who ruled in May that Congress gave the center its name and only Congress
// can change it), the artists and audiences who left, and how a large arts
// nonprofit is actually funded. Handled under DR-0100's tiers: the documented
// record (dates, votes, the ruling, the WaPo-obtained figures, the Sept 5 ceiling
// collapse) stated plainly with sources; the open questions (would an inscription
// bring the money back; whether an inscription is a renaming under the May order)
// flagged narrowly; motives adjudicated for no one; over-reach on every side
// corrected by the Word. Word first: names on houses (Babel, Absalom's pillar,
// Psalms 49, Nebuchadnezzar), the arts as Yahweh's gift (Bezaleel, David's singers),
// patrons and dependence (Cyrus and Darius funding the house that kept His name;
// put not your trust in princes; count the cost), the just weight for the board's
// claim, and the two courts. Every verse fetched verbatim from the repo KJV and
// gated in world-issues-verse-integrity.test.js. The board vote and the status
// hearing were scheduled for the day of authoring; their outcomes are carried as
// pending, not guessed.
// =============================================================================
const KENNEDY_CENTER_ISSUE = {
  id: 'wi-kennedy-center-bankruptcy-and-the-name',
  title: 'The Kennedy Center on the Brink — Whose Name Goes on the House, and the Word on Names, Patrons, and the Arts',
  subject: { name: 'the Kennedy Center’s solvency crisis and the fight over whose name goes on the building', kind: 'institution-and-public-figures', isNamedRealPerson: true },
  skill: 'Take a breaking news item in which an institution says it will die unless a powerful patron’s name goes on the building, and learn how the Word weighs it: state the documented record plainly (the 1964 Act, the votes, the May ruling, the collapse in tickets and gifts, the ceiling), label the board’s "only he can save it" as its judgment and hear every side at its strongest (Proverbs 18:17), keep the open questions narrow, and then let the Word speak to what no court will rule on — making a name, trusting princes, counting the cost, the just weight, and the arts as Yahweh’s gift — without pronouncing on any soul.',
  source: {
    creator: 'NPR (Up First, 2026-09-15; reporting by Anastasia Tsioulcas)',
    medium: 'newsletter and radio segment',
    title: 'SCOTUS rejects Trump’s mail voting limits. And, the Kennedy Center financial crisis',
    url: 'https://www.wkyufm.org/news/2026-09-15/scotus-rejects-trumps-mail-voting-limits-and-the-kennedy-center-financial-crisis',
    asOf: '2026-09-15',
    note: 'Darrell forwarded the newsletter on 2026-09-15 with the word "Lesson." and the instruction to research each subject independently. NPR is the reporting source; every fact below was re-verified by live web search the same day against the primary documents and multiple outlets. The board vote and the status hearing were scheduled for the day of authoring; their outcomes were not public when this was written and are carried as pending.',
  },

  // ---- STAGE 1 — THE CLAIM(S): the points AS MADE, each labeled. ----
  claims: [
    {
      id: 'c-bankruptcy',
      text: 'The Kennedy Center faces bankruptcy and might close as soon as today; it will not be able to make payroll or routine maintenance contracts within weeks.',
      label: 'claim',
      attribution: 'The Kennedy Center board’s draft resolutions, obtained by The Washington Post and NPR ahead of the September 15 board meeting',
      note: 'That the board SAID this is documented — the resolution text is public. The underlying finances are partly documented by confidential documents The Washington Post obtained in August; the center has not published audited figures for the current year.',
    },
    {
      id: 'c-only-trump',
      text: 'President Trump is the only one who can raise enough funds to rescue the center, so he deserves his name on the building.',
      label: 'opinion',
      attribution: 'The Kennedy Center board’s resolution, as reported by NPR (Anastasia Tsioulcas)',
      note: 'A judgment about the future by a board most of whose members the President appointed and whose chairman he is. It is carried as the board’s position, not as a fact. What IS documented is that ticket sales and gifts fell after his name went on the building in December (Stage 2).',
    },
    {
      id: 'c-politicized',
      text: 'Artists and audiences have been leaving over the past year saying the center became too politicized; the live-events calendar is a fraction of what it was; donations dried up.',
      label: 'claim',
      attribution: 'NPR (Anastasia Tsioulcas), summarizing a year of reporting',
      note: 'The departures are documented by name and date. "Too politicized" is the departing artists’ own stated reason and is carried as theirs.',
    },
    {
      id: 'c-funding-model',
      text: 'Big arts nonprofits rely on ticket revenue, donations, and some grants.',
      label: 'claim',
      attribution: 'NPR (Anastasia Tsioulcas)',
      note: 'Documented and, for the Kennedy Center specifically, refined in Stage 2: about half its budget came from tickets, a federal appropriation of roughly $45 million a year covers upkeep of the memorial only, and the rest is contributed.',
    },
    {
      id: 'c-crisis-likely',
      text: 'A real and dire crisis seems likely.',
      label: 'opinion',
      attribution: 'NPR (Anastasia Tsioulcas), her assessment on air',
      note: 'A reporter’s reading, carried as such. The documented decline in revenue, the ceiling collapse, and the board’s own words give it weight; it remains an assessment about the future.',
    },
    {
      id: 'c-congress-named-it',
      text: 'Congress named the center as a memorial to President Kennedy, and only Congress can change its name.',
      label: 'claim',
      attribution: 'Rep. Joyce Beatty’s lawsuit; adopted by Judge Christopher Cooper in his May 29, 2026 ruling',
      note: 'This one is an adjudicated finding, not merely a party’s claim — a federal judge ruled it. Whether the September inscription options honor that order is the narrow question now before the same judge.',
    },
  ],

  // ---- STAGE 2 — VERIFIABLE vs INTERPRETATION ----
  verifiable: [
    {
      id: 'f-1964-name',
      statement: 'On January 23, 1964 — two months after President Kennedy’s assassination — Congress by Public Law 88-260 renamed the National Cultural Center the John F. Kennedy Center for the Performing Arts, designated it a living memorial to him, and authorized $23 million toward building it. The Congressional vote to name it for him was unanimous.',
      status: 'documented',
      sources: [
        { title: 'S.J.Res.136 (88th Congress) — renaming the National Cultural Center as the John F. Kennedy Center for the Performing Arts', publisher: 'Congress.gov (Library of Congress)', url: 'https://www.congress.gov/bill/88th-congress/senate-joint-resolution/136/text', asOf: '2026-09-15' },
        { title: 'A Living Memorial', publisher: 'The Kennedy Center', url: 'https://www.kennedy-center.org/memorial/', asOf: '2026-09-15' },
      ],
      note: 'Verified by live web search 2026-09-15. This is the fact the lawsuit and the ruling rest on: the name was given by statute, not by the board.',
    },
    {
      id: 'f-takeover-2025',
      statement: 'On February 12, 2025 President Trump dismissed the trustees appointed by President Biden — eighteen, including chairman David Rubenstein — and the remaining board, most of whom he had just appointed, elected him chairman. The board removed Deborah Rutter, president since 2014, and installed Richard Grenell. Congress later provided $257 million for Kennedy Center renovation in the 2025 reconciliation bill ("One Big Beautiful Bill Act").',
      status: 'documented',
      sources: [
        { title: 'Kennedy Center Board elects President Donald J. Trump as Board Chair', publisher: 'The Kennedy Center (press release)', url: 'https://www.kennedy-center.org/news-room/press-release-landing-page/kennedy-center-board-elects--president-donald-j.-trump-as-board-chair/', asOf: '2026-09-15' },
        { title: 'Trump has purged the Kennedy Center’s board, which in turn made him its chair — why does that matter?', publisher: 'The Conversation', url: 'https://theconversation.com/trump-has-purged-the-kennedy-centers-board-which-in-turn-made-him-its-chair-why-does-that-matter-249934', asOf: '2026-09-15' },
        { title: 'Kennedy Center Faces $257 Million Renovation — What the One Big Beautiful Bill Really Covers', publisher: 'IBTimes UK', url: 'https://www.ibtimes.co.uk/kennedy-center-faces-257-million-renovation-what-one-big-beautiful-bill-really-covers-1775497', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. The chairman of the board is the person the board now proposes to honor on the facade; that structural fact is stated, not editorialized.',
    },
    {
      id: 'f-departures',
      statement: 'Departures are on the record by name and date. In February 2025 Rhiannon Giddens canceled ("I cannot in good conscience play at The Kennedy with the recent programming changes forced on the institution by this new board"), Issa Rae canceled her March 2025 show, Renée Fleming resigned as artistic advisor at large, Ben Folds resigned as the National Symphony Orchestra’s artistic advisor, and Shonda Rhimes resigned as board treasurer. In March 2025 the producers of Hamilton canceled the run scheduled for March–April 2026. Later cancellations included Béla Fleck (performing there had become "charged and political"), the Brentano String Quartet, Vocal Arts DC’s spring recitals, and Fleming’s May 2026 NSO concerts. On January 10, 2026 the Washington National Opera cut ties with the center after decades as a resident company, citing a new break-even policy: "The Center’s new business model requires productions to be fully funded in advance — a requirement incompatible with opera operations."',
      status: 'documented',
      sources: [
        { title: 'Here’s who’s canceled their Kennedy Center performances since Trump took over', publisher: 'NPR', url: 'https://www.npr.org/2026/01/20/nx-s1-5675192/kennedy-center-canceled-performances', asOf: '2026-09-15' },
        { title: 'Rhiannon Giddens is the latest artist to cancel Kennedy Center gig', publisher: 'NPR', url: 'https://www.npr.org/2025/02/25/nx-s1-5308302/rhiannon-giddens-cancels-kennedy-center-concert', asOf: '2026-09-15' },
        { title: '‘Hamilton’ Cancels Kennedy Center Show Run In Protest Of Trump’s ‘Purge’', publisher: 'Forbes', url: 'https://www.forbes.com/sites/antoniopequenoiv/2025/03/05/hamilton-cancels-kennedy-center-show-run-in-protest-of-trumps-purge/', asOf: '2026-09-15' },
        { title: 'Washington National Opera cuts ties with the Kennedy Center after longstanding partnership', publisher: 'CNN', url: 'https://www.cnn.com/2026/01/10/politics/washington-national-opera-leaves-kennedy-center', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. Each departing artist gave a reason on the record; those reasons are theirs, quoted, not the lesson’s verdict.',
    },
    {
      id: 'f-rename-and-suit',
      statement: 'On December 18, 2025 the board voted to rename the institution "The Donald J. Trump and The John F. Kennedy Memorial Center for the Performing Arts" (in short, the Trump Kennedy Center). The White House called the vote unanimous; Rep. Joyce Beatty, an ex officio trustee, said she was muted on the call when she tried to object. She filed Beatty v. Trump (No. 1:25-cv-04480, D.D.C.) on December 22, 2025, challenging the renaming, the plan to close the center for two years of renovation (voted in March 2026), and the board’s stripping of her voting rights.',
      status: 'documented',
      sources: [
        { title: 'Kennedy Center board votes to rename it ‘Trump Kennedy Center’', publisher: 'CNN', url: 'https://www.cnn.com/2025/12/18/politics/trump-kennedy-center-name', asOf: '2026-09-15' },
        { title: 'Beatty v. Trump, 1:25-cv-04480 (D.D.C.)', publisher: 'Civil Rights Litigation Clearinghouse', url: 'https://clearinghouse.net/case/47530/', asOf: '2026-09-15' },
        { title: 'Ohio Rep. Joyce Beatty sues Trump over Kennedy Center renaming', publisher: 'Yahoo News', url: 'https://www.yahoo.com/news/articles/ohio-rep-joyce-beatty-sues-142528015.html', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. "Unanimous" and "I was muted" are both on the record; the lesson carries both and adjudicates neither.',
    },
    {
      id: 'f-ruling',
      statement: 'On May 29, 2026 — President Kennedy’s birthday — U.S. District Judge Christopher Cooper ruled in a 94-page opinion that the board had no authority to rename the center: "Congress gave the Kennedy Center its name, and only Congress can change it." He ordered all signage renaming it for Donald Trump removed within fourteen days and blocked the two-year closure. Workers removed the name from the website and, on June 12, erected scaffolding and took down the facade signage. On August 13, 2026 the board voted 20–3 to inscribe "The John F. Kennedy Center for the Performing Arts Restored and Renovated by President Donald J. Trump" and to name the grounds "President Donald J. Trump Plaza"; Beatty filed an emergency motion on August 21; at the emergency hearing the Justice Department argued the inscriptions are "not renaming" the center.',
      status: 'documented',
      sources: [
        { title: 'Judge temporarily halts Kennedy Center closure and orders removal of Trump’s name from building', publisher: 'NBC News', url: 'https://www.nbcnews.com/politics/trump-administration/judge-temporarily-halts-kennedy-center-closure-trump-name-removed-rcna347598', asOf: '2026-09-15' },
        { title: 'Judge says Kennedy Center board violated law putting Trump’s name on building, blocks closure', publisher: 'PBS NewsHour', url: 'https://www.pbs.org/newshour/politics/judge-says-kennedy-center-board-violated-law-putting-trumps-name-on-building-blocks-closure', asOf: '2026-09-15' },
        { title: 'Kennedy Center votes to put Trump’s name back on building and close for renovations', publisher: 'CNN', url: 'https://www.cnn.com/2026/08/13/politics/kennedy-center-board-vote', asOf: '2026-09-15' },
        { title: 'DOJ insists new Trump inscriptions are ‘not renaming’ Kennedy Center', publisher: 'The Hill', url: 'https://thehill.com/regulation/court-battles/6055867-justice-department-trump-kennedy-center-hearing/', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. The May ruling is an adjudicated finding and is stated as one. Whether an inscription beneath the name is a renaming is the live question before the same judge; the lesson does not pre-decide it.',
    },
    {
      id: 'f-finances',
      statement: 'Confidential documents obtained by The Washington Post (August 25, 2026) show ticket sales and fundraising collapsed after the President’s name went on the building in December, even as leaders publicly described a turnaround. Spring projections had the center falling nearly $100 million short of its revenue target, with officials predicting the fiscal year’s revenue would miss budget by 70 percent. Subscription sales fell about $1.6 million (roughly 36 percent) from 2024. In the fall of 2025 about 43 percent of tickets for typical productions went unsold, against about 93 percent sold or issued complimentary in fall 2024 and 80 percent in fall 2023. Then on September 5, 2026 a portion of the Grand Foyer ceiling fell during heavy rain — no one was hurt — and spokeswoman Roma Daravi attributed it to decades of deferred maintenance.',
      status: 'documented',
      sources: [
        { title: 'Kennedy Center revenue plunged after Trump’s name went on the building', publisher: 'The Washington Post', url: 'https://www.washingtonpost.com/style/2026/08/25/kennedy-center-revenue-plunged-after-trumps-name-went-building/', asOf: '2026-09-15' },
        { title: 'Kennedy Center finances deteriorated sharply after Trump name change', publisher: 'The Detroit News (Washington Post report)', url: 'https://www.detroitnews.com/story/news/nation/2026/08/25/kennedy-center-finances-deteriorated-sharply-after-trump-name-change/91454004007/', asOf: '2026-09-15' },
        { title: 'Chunk of Kennedy Center’s ceiling falls during heavy rains', publisher: 'UPI', url: 'https://www.upi.com/Top_News/US/2026/09/05/kennedy-center-ceiling-collapse/3841788648940/', asOf: '2026-09-15' },
        { title: 'Kennedy Center closes after partial ceiling collapse in Grand Foyer', publisher: 'The Hill', url: 'https://thehill.com/homenews/administration/6073213-kennedy-center-ceiling-collapse-grand-foyer/', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. Two true things in two lanes: the building’s decay is decades old (the ceiling), and the revenue collapse is new and dated (the documents). Both are stated plainly; neither cancels the other.',
    },
    {
      id: 'f-sept-14',
      statement: 'On September 14, 2026 two draft board resolutions became public ahead of the September 15 board meeting. One calls the main building "unsafe for continued occupancy" and proposes closing it. The other states that the center "is in such a precarious fiscal position that it will not be able to support its payroll obligations, nor routine maintenance contracts within a matter of weeks," warns of "certain fiscal collapse within weeks," and says: "The Board understands that without such appropriate recognition it is unlikely that President Trump will provide the fundamental oversight of the renovation of the main building and lead the fiscal rescue of the Center." It offers ten inscription options for the marble below the center’s name, among them "Renovation and endowment overseen by President Donald J. Trump and the Trump Kennedy Center Fund," "With Gratitude for Support from President Donald J. Trump and the Trump Kennedy Center Fund," and "A Legacy protected through the Generosity of President Donald J. Trump." A status hearing before Judge Cooper was set for the same day, hours before the board meeting.',
      status: 'documented',
      sources: [
        { title: 'Kennedy Center says it’s on the brink of bankruptcy, might close as early as Tuesday', publisher: 'NPR', url: 'https://www.npr.org/2026/09/14/nx-s1-5968690/kennedy-center-financial-physical-state', asOf: '2026-09-15' },
        { title: 'Kennedy Center says it’s close to bankruptcy and will not be able to pay staff "within weeks"', publisher: 'NPR', url: 'https://www.npr.org/2026/09/14/nx-s1-5968602/kennedy-center-says-its-close-to-bankruptcy-and-will-not-be-able-to-pay-staff-within-weeks', asOf: '2026-09-15' },
        { title: 'Kennedy Center warns of bankruptcy unless Trump’s name is added to building: court documents', publisher: 'ABC News', url: 'https://abcnews.com/Politics/kennedy-center-warns-bankruptcy-trumps-added-building-court/story?id=136428259', asOf: '2026-09-15' },
        { title: 'Kennedy Center board to propose new options for honoring Trump as center confronts solvency worries', publisher: 'AP via WTOP', url: 'https://wtop.com/dc/2026/09/kennedy-center-board-to-propose-new-options-for-honoring-trump-as-center-confronts-solvency-worries/', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15, the day of the meeting. The vote’s outcome and the hearing’s result were not public at authoring and are NOT asserted here. The resolution’s words are quoted exactly so the reader weighs the board’s own language, not a paraphrase.',
    },
    {
      id: 'f-funding-model',
      statement: 'How a large arts nonprofit is funded, measured: across the nonprofit arts sector revenue runs roughly 60 percent earned, 30 percent private contributions, 10 percent government. For performing-arts organizations specifically, about 46 percent comes from admissions, contract fees, and memberships, about 41 percent is contributed (individuals 20.7 percent; government only 4.3 percent), and endowment income averages about 5 percent. The Kennedy Center’s operating budget grew to about $268 million under Deborah Rutter; ticket sales covered roughly half; a federal appropriation of about $45 million a year (FY2023: $45.38 million) is restricted to maintenance, security, and capital upkeep of the memorial and funds no programming; the rest is contributed.',
      status: 'documented',
      sources: [
        { title: 'Sources of Revenue for Nonprofit Arts & Cultural Organizations', publisher: 'Americans for the Arts', url: 'https://www.americansforthearts.org/by-program/reports-and-data/legislation-policy/naappd/sources-of-revenue-for-nonprofit-arts-cultural-organizations', asOf: '2026-09-15' },
        { title: 'John F. Kennedy Center for the Performing Arts: Recent Events and Background (IF12911)', publisher: 'Congressional Research Service', url: 'https://www.congress.gov/crs-product/IF12911', asOf: '2026-09-15' },
        { title: 'FY2025 Budget Justification to Congress', publisher: 'The Kennedy Center', url: 'https://www.kennedy-center.org/globalassets/our-story/mission/kennedy-center-fy25-budget-justification-to-congress.pdf', asOf: '2026-09-15' },
      ],
      note: 'Verified 2026-09-15. This is why a hall can be publicly owned and still go broke: the public pays for the walls, not the music; the music is paid for by the people who come and the people who give — and both left.',
    },
    {
      id: 'f-fundraising-claims',
      statement: 'The center’s leadership has publicly claimed record fundraising — a $23 million Kennedy Center Honors, "$58 million in the last 30 days alone," and, per Richard Grenell, $130 million raised in a year — while the confidential documents show revenue collapsing, and sources told Politico that the figures given to Grenell were "sometimes rosier than the money that actually comes into the center." In June the center said it would lose "hundreds of millions" in donations if the President’s name came off. Grenell has also alleged $26 million in "phantom revenue" under prior leadership. None of these figures has been reconciled by an audited statement available to the public.',
      status: 'disputed',
      sources: [
        { title: 'Kennedy Center Claims It Will Lose ‘Hundreds Of Millions’ In Donations After Removing Trump Name', publisher: 'Forbes', url: 'https://www.forbes.com/sites/conormurray/2026/06/30/kennedy-center-claims-it-will-lose-hundreds-of-millions-in-donations-after-removing-trump-name/', asOf: '2026-09-15' },
        { title: 'Trump-led Kennedy Center nearly doubles fundraising from Biden era, smashing record with $23M haul', publisher: 'Fox News', url: 'https://www.foxnews.com/politics/exclusive-trump-led-kennedy-center-nearly-doubles-fundraising-from-biden-era-smashing-record-23m-haul', asOf: '2026-09-15' },
        { title: 'President Donald Trump Plunges Kennedy Center Fundraising Into Chaos', publisher: 'The Daily Beast', url: 'https://www.thedailybeast.com/president-donald-trump-plunges-kennedy-center-fundraising-into-chaos/', asOf: '2026-09-15' },
      ],
      note: 'Tier 2 (DR-0100), narrowly: the public claims and the internal documents do not agree, and no audited reconciliation is public. That disagreement is the fact; which set of numbers is right is genuinely open. The Word’s standard for the numbers themselves is not open (Stage 4).',
    },
  ],
  interpretation: [
    {
      id: 'n-only-he-can-is-a-forecast',
      statement: '"Only President Trump can raise enough" is a forecast, not a finding. What is documented is the opposite direction so far: tickets and gifts fell after his name went on in December, and the board’s own June warning that removing the name would cost hundreds of millions has not been reconciled with any audited figure. Whether an inscription would now bring money in is untested — a narrow, honest unknown. The board is also not a neutral witness to it: its chairman is the person to be honored. Keep the categories: the collapse is fact; the rescue is a hope.',
      restsOn: ['f-finances', 'f-fundraising-claims', 'f-sept-14', 'f-takeover-2025'],
    },
    {
      id: 'n-two-decays-two-clocks',
      statement: 'Two true things run on two clocks. The building’s decay is decades old — the ceiling fell on September 5 and the spokeswoman blamed deferred maintenance across many administrations; Congress voted $257 million for it. The revenue collapse is new and dated to the takeover and the renaming — the departures are on the record by name and the documents by month. "Decades of neglect" does not explain the empty seats, and the empty seats do not explain the ceiling. A reader who lets either side use its true fact to erase the other’s has stopped weighing.',
      restsOn: ['f-finances', 'f-departures', 'f-takeover-2025'],
    },
    {
      id: 'n-inscription-or-renaming',
      statement: 'The May ruling settled that the board cannot rename the center. The September options put the President’s name BELOW the center’s name as a credit line; the Justice Department calls that recognition, Beatty calls it the same act by another route. That is the live question before Judge Cooper, and the lesson does not pre-decide it. What the Word says about a living ruler’s name on a memorial built for another man is a different question, and the Word answers that one (Stage 4).',
      restsOn: ['f-ruling', 'f-sept-14', 'f-1964-name'],
    },
    {
      id: 'n-departures-are-a-cause-too',
      statement: 'The departing artists say the center became too politicized; the board says the artists and their audiences abandoned a public institution over politics. Both descriptions are of the same event. What is not in dispute is the fruit: a resident opera company of decades gone, a Hamilton run gone, subscriptions down a third, seats half empty — and now payroll for musicians, ushers, and stagehands at risk within weeks. Whoever is right about who started it, the Word is clear about who must be paid (Stage 4).',
      restsOn: ['f-departures', 'f-finances', 'f-sept-14'],
    },
  ],

  // ---- STAGE 3 — PERSPECTIVES on the UNRESOLVED parts ----
  perspectives: [
    {
      id: 'p-board',
      label: 'The board’s reading — survival, and the one donor who can',
      heldBy: 'The Kennedy Center trustees and administration',
      steelman: 'At its strongest: a ceiling fell on the red carpet two weeks ago; the resolution says payroll cannot be met within weeks; the federal appropriation pays for walls, not music; and the audiences and donors who paid for the music are gone. In that hour there is one person with the reach to raise nine figures fast, and he secured $257 million from Congress for this building already. Concert halls everywhere carry the names of the people who saved them; it is not vanity to credit a benefactor on the marble — the Word itself records elders telling Jesus of a centurion, "he loveth our nation, and he hath built us a synagogue" (Luke 7:5), and commands "honour to whom honour" (Romans 13:7). An inscription beneath the center’s name changes nothing Congress wrote. A closed hall honors no one.',
    },
    {
      id: 'p-artists-audiences',
      label: 'The artists’ and audiences’ reading — a hall claimed by one ruler changes the song',
      heldBy: 'Artists who canceled, the Washington National Opera, subscribers who stopped coming',
      steelman: 'Heard fairly: they did not leave a building; they left a building that had been made to mean something else. A memorial to a slain president was renamed for a sitting one by a board he appointed, after the trustees and president who ran it were dismissed and a break-even rule drove out the opera company that had lived there for decades. An artist asks what a stage means before standing on it — "How shall we sing the LORD’s song in a strange land?" (Psalms 137:4) — and the Word shows the arts conscripted to a ruler’s image once before, when "all kinds of musick" were commanded so the crowd would "fall down and worship the golden image" (Daniel 3:5), and three men who would not. Their conscience is their own; and the empty seats show the audience agreed with their feet. On this view the crisis was not inherited; it was made, and the remedy is to give the house back its meaning, not to carve the cause of the wound deeper into the wall.',
    },
    {
      id: 'p-lawsuit',
      label: 'The lawsuit’s reading — a memorial’s name belongs to the one it was built for',
      heldBy: 'Rep. Joyce Beatty and those who back her suit; the court, on the May ruling',
      steelman: 'At its strongest this is not about one man versus another; it is about who owns a memorial. In 1964 a grieving Congress voted unanimously to name a national house for a president who had just been killed, and only Congress can un-vote it — a judge has already said so. A living ruler’s name on the memorial of another man is exactly the pillar Absalom raised "to keep my name in remembrance" (2 Samuel 18:18), and a board that depends on that ruler for its next payroll is not free to judge whether his name belongs there. A credit line that leads with the ruler’s name is a renaming by inches. The rule of law is the point: if a board can carve around a court order, no memorial is safe.',
    },
    {
      id: 'p-workers',
      label: 'The workers’ reading — a name on a wall costs us nothing; a closed hall costs us everything',
      heldBy: 'The National Symphony Orchestra musicians, stagehands, ushers, and staff whose payroll the resolution names',
      steelman: 'The players did not fire anyone, rename anything, or cancel a show, and they are the ones the resolution says will not be paid "within a matter of weeks." From the pit and the loading dock the fight over marble looks like two sides willing to let the house die to win. Their strongest word is the Word’s own: "the wages of him that is hired shall not abide with thee all night until the morning" (Leviticus 19:13) — and the hire kept back "crieth" (James 5:4). Whatever the court and the board decide, the people who make the music must be paid, and any settlement that leaves them unpaid has failed the first test.',
    },
  ],

  // ---- STAGE 4 — THE BELIEVER'S LENS ----
  lens: {
    fourD: {
      deepSource: 'WORD FIRST — Yahweh spoke about names on buildings long before any board did, and He spoke about the arts, and about patrons, and about counting the cost, and the Word settles what the court will never rule on. NAMES ON HOUSES. The first building project after the flood was a name project: "let us make us a name" (Genesis 11:4) — and He scattered it. Absalom, a king’s son with no throne, "reared up for himself a pillar" because "I have no son to keep my name in remembrance: and he called the pillar after his own name" (2 Samuel 18:18); the Word records the pillar and records that he died in a tree the same chapter. The psalmist names the whole instinct: "Their inward thought is, that their houses shall continue for ever, and their dwelling places to all generations; they call their lands after their own names." (Psalms 49:11) — and answers it in the next breath: "Nevertheless man being in honour abideth not: he is like the beasts that perish." (Psalms 49:12). And the plainest case: a king on his roof, "Is not this great Babylon, that I have built for the house of the kingdom by the might of my power, and for the honour of my majesty?" (Daniel 4:30) — "While the word was in the king’s mouth, there fell a voice from heaven" (Daniel 4:31) — and the same king, restored, confessed that the King of heaven is the one whose "works are truth, and his ways judgment: and those that walk in pride he is able to abase." (Daniel 4:37). The Word is not against memorials — Yahweh Himself commanded stones "for a memorial unto the children of Israel for ever" (Joshua 4:7) — and it is not against honoring a benefactor: "he loveth our nation, and he hath built us a synagogue" (Luke 7:5); "honour to whom honour" (Romans 13:7). What it is against is a MAN making his own name the thing the house is for. The name that lasts is not carved: "A good name is rather to be chosen than great riches, and loving favour rather than silver and gold." (Proverbs 22:1); "A good name is better than precious ointment" (Ecclesiastes 7:1); "The memory of the just is blessed" (Proverbs 10:7); and "them that honour me I will honour" (1 Samuel 2:30). And there is one name over every house: Yahweh "hath highly exalted him, and given him a name which is above every name" (Philippians 2:9) — "That at the name of Jesus every knee should bow" (Philippians 2:10) and "every tongue should confess that Jesus Christ is Lord, to the glory of God the Father." (Philippians 2:11). "Not unto us, O LORD, not unto us, but unto thy name give glory" (Psalms 115:1); "my glory will I not give to another" (Isaiah 42:8). THE ARTS ARE HIS GIFT. The first person the Word NAMES as filled with the spirit of God was not a prophet but a craftsman — and even before him the unnamed makers of the priest’s garments were "wise hearted, whom I have filled with the spirit of wisdom" (Exodus 28:3): "See, I have called by name Bezaleel" (Exodus 31:2) — "And I have filled him with the spirit of God, in wisdom, and in understanding, and in knowledge, and in all manner of workmanship" (Exodus 31:3), "To devise cunning works, to work in gold, and in silver, and in brass" (Exodus 31:4), and "in carving of timber" (Exodus 31:5); and Yahweh made him a teacher — "he hath put in his heart that he may teach" (Exodus 35:34) — of a whole guild, "of the engraver, and of the cunning workman, and of the embroiderer, in blue, and in purple, in scarlet, and in fine linen, and of the weaver" (Exodus 35:35). Music was there from the fourth chapter — Jubal, "the father of all such as handle the harp and organ" (Genesis 4:21) — and David built the first national arts institution on the record: singers "who should prophesy with harps, with psalteries, and with cymbals" (1 Chronicles 25:1), "instructed in the songs of the LORD, even all that were cunning, was two hundred fourscore and eight" (1 Chronicles 25:7). He commands excellence in it — "play skilfully with a loud noise" (Psalms 33:3) — and tells the believer to dwell on "whatsoever things are lovely, whatsoever things are of good report" (Philippians 4:8); and skill has always walked into palaces on its own feet: "Seest thou a man diligent in his business? he shall stand before kings" (Proverbs 22:29). So the believer never sneers at a concert hall; the hall is a Bezaleel house, and its emptiness is a real loss. PATRONS AND DEPENDENCE. The Word shows kings funding Yahweh’s house — Cyrus: "he hath charged me to build him an house at Jerusalem" (Ezra 1:2); Darius: "let the expenses be given out of the king’s house" (Ezra 6:4); Artaxerxes, and Ezra blessing the LORD "which hath put such a thing as this in the king’s heart, to beautify the house of the LORD" (Ezra 7:27); Nehemiah taking the king’s timber — "And the king granted me, according to the good hand of my God upon me." (Nehemiah 2:8). Three things stand out. The house kept HIS name, not the king’s — it is "the God that hath caused his name to dwell there" (Ezra 6:12) even in Darius’s own decree. The credit went behind the king to the Giver — "The king’s heart is in the hand of the LORD" (Proverbs 21:1); "it is he that giveth thee power to get wealth" (Deuteronomy 8:18). And the people were told where NOT to put their trust: "Put not your trust in princes, nor in the son of man, in whom there is no help." (Psalms 146:3) — "His breath goeth forth, he returneth to his earth; in that very day his thoughts perish." (Psalms 146:4); "It is better to trust in the LORD than to put confidence in princes." (Psalms 118:9); "Cursed be the man that trusteth in man, and maketh flesh his arm" (Jeremiah 17:5); "Not by might, nor by power, but by my spirit, saith the LORD of hosts." (Zechariah 4:6); "Except the LORD build the house, they labour in vain that build it" (Psalms 127:1). A house that says in writing that one man is its only hope has written its own diagnosis: it has become the borrower, and "the borrower is servant to the lender" (Proverbs 22:7). And Jesus gave the rule every board should have read before December: "For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?" (Luke 14:28) — "Lest haply, after he hath laid the foundation, and is not able to finish it, all that behold it begin to mock him" (Luke 14:29), "Saying, This man began to build, and was not able to finish." (Luke 14:30). THE JUST WEIGHT FOR THE NUMBERS. "A false balance is abomination to the LORD: but a just weight is his delight." (Proverbs 11:1). Public claims of record hauls beside private documents of collapse is a scale with two weights, and the Word forbids it before any auditor does: "Providing for honest things, not only in the sight of the Lord, but also in the sight of men." (2 Corinthians 8:21); "Let another man praise thee, and not thine own mouth" (Proverbs 27:2); "Thou shalt not bear false witness against thy neighbour." (Exodus 20:16) — which binds everyone in this story who reports a number, on every side. THE ONES WHO MUST BE PAID. Whatever the court decides, "the wages of him that is hired shall not abide with thee all night until the morning" (Leviticus 19:13); the hire kept back "crieth" (James 5:4). The musicians and the crew are the first obligation, not the last. THE OVER-REACH, CORRECTED ON EVERY SIDE. To the board’s "only he can": "Put not your trust in princes" (Psalms 146:3) — the true data under it (a real collapse, a real ceiling) stands; the theology over it does not. To any artist or audience tempted from conscience into contempt: conscience is honored — "we will not serve thy gods, nor worship the golden image" (Daniel 3:18) — but so is the command to pray "For kings, and for all that are in authority" (1 Timothy 2:2) and to "seek the peace of the city" (Jeremiah 29:7); the Word never licenses cursing the ruler you will not play for. To the lawsuit’s side, if the marble becomes the whole cause: no man’s name is the final memorial — "The memory of the just is blessed" (Proverbs 10:7) is a memory Yahweh keeps, and He "dwelleth not in temples made with hands" (Acts 17:24); the rule of law is worth defending and the name of a slain president worth honoring, and neither is ultimate. SO IN THIS CASE the believer does four things in order. First, state the documented plainly, because "Prove all things; hold fast that which is good." (1 Thessalonians 5:21): Congress named it in 1964; a court ruled only Congress can change it; the artists left by name; the seats emptied by the numbers; the ceiling fell; the board wrote what it wrote. Second, hear every side at its strongest — "He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him." (Proverbs 18:17) — and mark what each answers and what it leaves standing. Third, keep the open questions narrow and honest: whether an inscription would raise the money, and whether it is a renaming under the order, are for evidence and for the judge; no motive on any side is adjudicated here. Fourth — where the Word settles what the court cannot — judge by the fruit, "by their fruits ye shall know them" (Matthew 7:20): a house whose survival plan is one man’s name has trusted a prince; a name carved for oneself has never kept anyone in remembrance; the arts are Yahweh’s gift and their silence is a loss to Him; the workers must be paid; and "whosoever shall exalt himself shall be abased; and he that shall humble himself shall be exalted" (Matthew 23:12) is not a threat against anyone — it is the law of every name, including ours.',
      scripture: 'Genesis 11:4; 2 Samuel 18:18; Psalms 49:11-12; Daniel 4:30-37; Joshua 4:7; Luke 7:5; Romans 13:7; Proverbs 22:1; Ecclesiastes 7:1; Proverbs 10:7; 1 Samuel 2:30; Philippians 2:9-11; Psalms 115:1; Isaiah 42:8; Exodus 28:3; Exodus 31:1-5; Exodus 35:30-35; Genesis 4:21; 1 Chronicles 25:1-7; Psalms 33:3; Philippians 4:8; Proverbs 22:29; Ezra 1:2; Ezra 6:4; Ezra 6:12; Ezra 7:27; Nehemiah 2:8; Proverbs 21:1; Deuteronomy 8:18; Psalms 146:3-4; Psalms 118:8-9; Jeremiah 17:5; Zechariah 4:6; Psalms 127:1; Proverbs 22:7; Luke 14:28-30; Proverbs 11:1; 2 Corinthians 8:21; Proverbs 27:2; Exodus 20:16; Leviticus 19:13; James 5:4; Daniel 3:5; Daniel 3:18; Psalms 137:4; 1 Timothy 2:1-2; Jeremiah 29:7; Acts 17:24; 1 Thessalonians 5:21; Proverbs 18:17; Matthew 7:20; Matthew 23:12',
    },
    threeD: 'Practically: read the resolution’s own words and sort them. Say the proven parts without a hedge — Congress named the center in 1964; a federal judge ruled in May that only Congress can change it; the artists left by name and date; subscriptions fell about a third and nearly half the seats went unsold; part of the ceiling fell on September 5; the board wrote that payroll cannot be met within weeks. Then label the rest: "only President Trump can raise it" is the board’s forecast, made by a board he chairs, and the public record so far shows gifts falling after his name went on, not rising; "too politicized" is the artists’ reason, carried as theirs; "not renaming" versus "renaming by inches" is the judge’s question, not yours. Hear all four sides at their strongest (Proverbs 18:17) and notice that each holds a true fact — the ceiling, the empty seats, the statute, the unpaid crew — and each is tempted to use its fact to erase the others’. Then do what the Word does: refuse to put your trust in a prince or your contempt on one; count the cost before you build; use one weight for the numbers; insist the workers are paid first; and remember whose name every house is finally for. In your own house: when you give, give without a plaque (Matthew 6:1-4); when you build, sit down first and count (Luke 14:28); when you are honored, "Let another man praise thee" (Proverbs 27:2). In the Body: fund the arts you say you love, and name your buildings for what they are for, not for who paid.',
    accountability: {
      statement: 'THE TWO COURTS. Man’s court has ruled once — "Congress gave the Kennedy Center its name, and only Congress can change it" — and is being asked to rule again; the lesson cites what it ruled and invents nothing about what it will. No court will rule on motive, and neither does this lesson. But the Word never lets accountability shrink to a docket. Every resolution, every press release, every canceled contract, and every private projection enters the eternal court — "For God shall bring every work into judgment, with every secret thing, whether it be good, or whether it be evil." (Ecclesiastes 12:14) — where "the books were opened" (Revelation 20:12) and "God is not mocked" (Galatians 6:7), and where the only remembrance that lasts is the one He writes: "a book of remembrance was written before him for them that feared the LORD, and that thought upon his name" (Malachi 3:16). WHAT THE STEWARDS OWE under the Word: to be "found faithful" (1 Corinthians 4:2) with a house the public paid for; to count the cost before laying a foundation (Luke 14:28-30); to keep one weight for the numbers in public and in private (Proverbs 11:1; 2 Corinthians 8:21); and to pay the hired before the sun goes down (Leviticus 19:13; James 5:4) — a settlement that leaves the crew unpaid has failed before it begins. WHAT THE COURT OWES: "thou shalt not respect persons, neither take a gift" (Deuteronomy 16:19). WHAT THE ARTISTS OWE: to work "heartily, as to the Lord, and not unto men" (Colossians 3:23) wherever they do play, and to pray for the ruler they will not play for (1 Timothy 2:1-2). WHAT WE OWE: to speak the documented plainly and the unproven as unproven; to honor a benefactor without trusting him (Romans 13:7; Psalms 146:3); and to leave every soul in this story to Yahweh, who "is able to abase" the proud (Daniel 4:37) and exalt the humble (Matthew 23:12) without our help. And the lived cost during this life is not deferred evidence — a musician’s missed paycheck, a canceled season, a fallen ceiling are seen and weighed now.',
      scripture: 'Ecclesiastes 12:14; Revelation 20:12; Galatians 6:7; Malachi 3:16; 1 Corinthians 4:2; Luke 14:28-30; Proverbs 11:1; 2 Corinthians 8:21; Leviticus 19:13; James 5:4; Deuteronomy 16:19; Colossians 3:23; 1 Timothy 2:1-2; Romans 13:7; Psalms 146:3; Daniel 4:37; Matthew 23:12',
    },
    benefits: [
      'Both courts, honestly held: a federal judge ruled on the name, and will rule again on the inscription — cite what was ruled, invent nothing about what will be — while the ETERNAL court holds every resolution, every projection, and every secret thing, and lands after this life (Ecclesiastes 12:14; Revelation 20:12). You can name the fruit without pronouncing on a soul.',
      'Freedom from two lies at once: the rescue lie ("one man’s name will save it, so the name is the price") and the contempt lie ("the building deserves to fall") — the Word forbids trusting a prince AND cursing one.',
      'The Word’s own theology of names in your hands: Babel, Absalom’s pillar, Psalms 49, Nebuchadnezzar’s roof, and the name above every name — so a plaque never fools you again about what lasts (Genesis 11:4; 2 Samuel 18:18; Proverbs 22:1; Philippians 2:9-11).',
      'A right love of the arts: Bezaleel is the first person the Word names as filled with the spirit of God, David appointed 288 trained singers, and "play skilfully" is a command — so an empty concert hall is a loss to Yahweh, not a culture-war trophy (Exodus 31:3; 1 Chronicles 25:7; Psalms 33:3).',
      'A repeatable skill for institutional crises: read the document itself, sort fact from forecast, ask who is speaking and what they depend on, hear four sides, keep the open question narrow, then weigh by the just weight and the fruit.',
      'A house that counts the cost and gives without a trumpet: Luke 14:28 before every build, Matthew 6:1-4 before every gift, one weight for every number you report.',
      'A church that builds the arts it praises — a Bezaleel guild, a choir taught to excellence, a building named for its purpose — so the next generation of players has a stage that no patron can rename.',
    ],
    graceNote: 'No condemnation of any soul in this story: this lesson pronounces no verdict on President Trump, Rep. Joyce Beatty, Richard Grenell, the trustees who voted, the artists who left, the judge who ruled, or the memory of President Kennedy — their hearts are Yahweh’s to judge, and He is no respecter of persons in either direction. But leaving the soul to Yahweh never mutes the fruit: the seats are empty, the ceiling fell, the workers are weeks from unpaid, and the Word names what a house does when it writes that one man is its only hope. Truth and grace meet in Jesus, whose name is above every name (Philippians 2:9) and who taught that when evening comes the labourers are called and given their hire (Matthew 20:8).',
    stewardship: 'The deeper response is to BUILD what the Word builds, in your own house first. A congregation has its own arts and its own building, and both raise the same questions this hall does. Name the building for what it is for, not for who paid — the house Cyrus and Darius funded kept Yahweh’s name (Ezra 6:12) — and when a family gives the roof, let the reward be the one "thy Father which seeth in secret" gives "openly" (Matthew 6:4), not a plaque by the door: "let not thy left hand know what thy right hand doeth" (Matthew 6:3). Fund the arts you say you love: raise a Bezaleel guild — the painter, the carpenter, the engraver, the weaver — and a choir "instructed in the songs of the LORD" (1 Chronicles 25:7), taught to "play skilfully" (Psalms 33:3), paid on time (Leviticus 19:13), and free of any patron who could rename the stage. Count the cost before the building campaign (Luke 14:28), keep one weight in every financial report (Proverbs 11:1; 2 Corinthians 8:21), and pray for the rulers and the trustees of the hall in Washington by name — for the workers to be paid, for the house to stand, and for every name on it, including ours, to bow to the one above it (Philippians 2:10). This platform’s own Learn tab is a small example of Yahweh’s pattern: made with skill, given freely, owned by the community, and named for no donor.',
    anchor: {
      ref: 'Proverbs 22:1; Psalms 146:3',
      theme: 'A good name is chosen, not carved — "A good name is rather to be chosen than great riches" — and a house that writes down that one man is its only hope has already told you where its trust went: "Put not your trust in princes, nor in the son of man, in whom there is no help." State the documented plainly, hear every side, pay the workers, and give without a plaque.',
    },
  },

  // ---- STAGE 5 — REFLECTION + SKILL ----
  reflection: {
    skill: 'When an institution announces it will die unless a powerful person is honored: PAUSE. Read the document itself, not the headline. Separate what is documented (dates, votes, rulings, the numbers with their source) from forecasts ("only he can") and from each side’s reasons ("too politicized," "decades of neglect"). Ask who is speaking and what they depend on. Hear every side at its strongest — the board, the artists, the lawsuit, the workers — and mark the true fact each holds and the fact each is tempted to erase. Keep the open questions narrow and leave motive alone. Then let the Word speak to what no court will rule on: names on houses, trust in princes, counting the cost, the just weight, the wages of the hired, and the arts as Yahweh’s gift.',
    practice: 'Take the September 14 resolution. Write four lines: (1) one sentence of what is DOCUMENTED, with a source and its date; (2) one sentence labeling "only President Trump can raise enough" as a forecast, naming who made it and what they depend on; (3) one sentence giving the strongest case for a side you do not naturally hold; (4) one sentence on what the Word says about a name on a house — and one concrete thing your own church could do this month with its own arts or its own building’s name.',
    prompts: [
      'Which parts of the story are documented (the 1964 Act, the December vote, the May ruling, the WaPo figures, the ceiling) and which are forecasts or reasons (only he can raise it; too politicized; decades of neglect)? How would you check each?',
      'The board that says only its chairman can save the center is a board he appointed. Does that make its claim false? What does it make it? (Proverbs 18:17)',
      'Walk through the Word’s names on houses: Babel (Genesis 11:4), Absalom’s pillar (2 Samuel 18:18), Psalms 49:11-12, Nebuchadnezzar’s roof (Daniel 4:30-37). What do they have in common — and how does Luke 7:5 and Romans 13:7 keep this from becoming a rule against ever honoring a giver?',
      'Cyrus and Darius paid for Yahweh’s house and the house kept His name (Ezra 6:4; 6:12). What would it look like for a hall — or a church — to accept a large gift without becoming the giver’s servant (Proverbs 22:7; Psalms 146:3)?',
      'The artists cite conscience (Daniel 3:18; Psalms 137:4). The Word also says pray for kings (1 Timothy 2:2) and seek the peace of the city (Jeremiah 29:7). Where is the line between refusing to play and holding a ruler in contempt?',
      'The resolution says payroll cannot be met within weeks. What does Leviticus 19:13 and James 5:4 require of every party before anything else is settled — and what does that require of your own church’s musicians and staff?',
      'In your own house: when you give to a building, do you need the plaque? Read Matthew 6:1-4 and answer honestly.',
    ],
  },

  // ---- Age-appropriate renderings (kids use the app) ----
  levels: {
    child: 'A big music and theater hall in Washington, D.C. is in trouble. It is called the Kennedy Center. Long ago, Congress named it to remember a president who had died. Now the people who run it say it is almost out of money. Part of a ceiling fell down in the rain. And they say the only way to save it is to put the President’s name on the front of the building, because he can ask his friends for money. A judge already said the name has to stay the way Congress wrote it. Many singers and players stopped coming. Many people stopped buying tickets. Here is how to think it through. First, sort what is known from what is a guess. We know the money went down. We know the ceiling fell. "Only one person can save it" is a guess about the future. Second, hear each side kindly. The board is scared. The singers have their reasons. The judge has the law. The workers just want to be paid. Third, ask what Yahweh says. Long ago some people built a tower and said, "let us make us a name" (Genesis 11:4). That did not end well. A king looked at his city and bragged that he built it by his own power (Daniel 4:30), and Yahweh humbled him. The Word says, "A good name is rather to be chosen than great riches" (Proverbs 22:1). A good name is not letters on a wall. It is being honest and kind. And the Word says, "Put not your trust in princes" (Psalms 146:3). Help from a leader can be a gift. But our trust goes to Yahweh. Music and art are His gift too. He filled a man named Bezaleel with His Spirit to make beautiful things (Exodus 31:3). When you give, Jesus says to do it quietly, so your Father who sees in secret can reward you (Matthew 6:4). We do not call anyone bad. We pray for the leaders. We pray for the workers who need their pay. And we make beautiful things for Yahweh.',
    teen: 'Breaking news: the Kennedy Center’s own board says the place could go bankrupt within weeks and might close — and that the only way out is to carve the President’s name into the front of the building, because he is the only one who can raise the money. Run the moves before you repeat any of it. (1) Sort fact from forecast. Documented: Congress named it for President Kennedy in 1964; the board renamed it for Trump in December 2025; a federal judge ruled in May that "only Congress can change it" and made them take the name down; artists like Renée Fleming and the producers of Hamilton canceled, and the opera company left; documents show subscriptions fell about a third and nearly half the seats went unsold after the name went on; part of the ceiling fell on September 5. Forecast: "only President Trump can raise enough" — said by a board he chairs, and so far the money went DOWN after his name went up. (2) Hear all four sides at their strongest: the board (the ceiling is real, the hall dies without cash), the artists (a memorial claimed by a sitting ruler changes what the stage means — Psalms 137:4), the lawsuit (Congress named a memorial for a slain president; only Congress un-names it), and the workers (a name costs them nothing; a closed hall costs them everything). Notice each side holds a true fact and is tempted to use it to erase the others. (3) Now let the Word speak to what no judge will rule on. Names on houses: Babel said "let us make us a name" (Genesis 11:4); Absalom built a pillar "to keep my name in remembrance" (2 Samuel 18:18); Nebuchadnezzar bragged "Is not this great Babylon, that I have built" (Daniel 4:30) and lost his mind until he honored the King of heaven. The name that lasts: "A good name is rather to be chosen than great riches" (Proverbs 22:1). Trust: "Put not your trust in princes" (Psalms 146:3) — a house that writes down that one man is its only hope has told you where its trust went, and "the borrower is servant to the lender" (Proverbs 22:7). Cost: "sitteth not down first, and counteth the cost" (Luke 14:28). Honesty: public record-fundraising claims next to private collapse documents is two weights on one scale (Proverbs 11:1). The workers: "the wages of him that is hired shall not abide with thee all night" (Leviticus 19:13) — the crew gets paid first, whoever wins. And the arts: Bezaleel is the first person the Word names as filled with the spirit of God (Exodus 31:3), so an empty hall is a loss to Yahweh, not a win for anybody. (4) Don’t become the comment section. Conscience is honored (Daniel 3:18), but so is praying "For kings, and for all that are in authority" (1 Timothy 2:2). For you: when you give, no plaque (Matthew 6:3-4); when you build, count first; and make something excellent for Yahweh this week.',
    senior: 'For the seasoned believer, this lesson is about weighing a public institution’s cry for rescue with the Word’s own theology of names, patrons, and the arts — in a week when the outcome is not yet known and every side is speaking at once. First, the documented record, stated plainly: Public Law 88-260 of January 23, 1964 named the National Cultural Center for President Kennedy as a living memorial; on February 12, 2025 the President dismissed the Biden-era trustees and was elected chairman by a board he had appointed, which removed Deborah Rutter and installed Richard Grenell; artists withdrew by name and date, and the Washington National Opera ended a residency of decades under a new break-even rule; on December 18, 2025 the board renamed the center for him, and Rep. Joyce Beatty — muted, she says, on the call — sued four days later; on May 29, 2026 Judge Christopher Cooper ruled in ninety-four pages that "Congress gave the Kennedy Center its name, and only Congress can change it," ordered the signage down within fourteen days, and blocked a two-year closure; on August 13 the board voted 20–3 for a credit-line inscription and a "Trump Plaza"; The Washington Post’s documents of August 25 show revenue projected nearly $100 million short and 70 percent under budget, subscriptions down about 36 percent, and roughly 43 percent of seats unsold; on September 5 part of the Grand Foyer ceiling fell; and on September 14 the board’s resolutions said payroll cannot be met "within a matter of weeks" and that without "appropriate recognition" it is unlikely the President will "lead the fiscal rescue of the Center." Second, the categories kept honestly (Proverbs 18:13; 18:17): "only he can" is a forecast by an interested board, and the record so far runs the other way; "too politicized" and "decades of neglect" are each side’s reasons, each resting on a true fact — the empty seats and the fallen ceiling run on two different clocks; whether an inscription is a renaming under the order is the judge’s question, and the public fundraising claims against the private documents are a genuine, narrow unknown — no audited reconciliation exists. No motive is adjudicated. Third — where the Word settles what the court cannot — the theology of names is old and consistent: Babel’s "let us make us a name," Absalom’s pillar, the psalmist’s "they call their lands after their own names" answered by "man being in honour abideth not," and Nebuchadnezzar on his roof — while the Word also commands memorials (Joshua 4:7) and honor to benefactors (Luke 7:5; Romans 13:7), so the correction is precise: not against honoring a giver, but against a man making his own name the thing a house is for. The arts are Yahweh’s gift — Bezaleel the first person the Word names as filled with the spirit of God, David’s 288 trained singers, "play skilfully" — so the hall’s silence is a loss to Him. Patrons are shown funding His house — Cyrus, Darius, Artaxerxes — and the house kept His name (Ezra 6:12) while the people were commanded, "Put not your trust in princes" (Psalms 146:3) and warned that "the borrower is servant to the lender" (Proverbs 22:7). The just weight (Proverbs 11:1; 2 Corinthians 8:21) governs every number reported on every side; the wages of the hired (Leviticus 19:13; James 5:4) govern the first obligation of any settlement; and the two courts govern the rest: man’s court has ruled and will rule again, and the eternal court holds every resolution and every secret thing (Ecclesiastes 12:14). Then let the response mature past taking a side into the Body’s long vocation — build the arts you praise, name your house for its purpose, give without a plaque (Matthew 6:1-4), count the cost (Luke 14:28), pay your musicians on time, and pray by name for the rulers, the trustees, the artists, and the crew — knowing that every name on every wall, ours included, will bow to the one above it (Philippians 2:10).',
  },

  // ---- Discernment-skill quiz ----
  quiz: {
    questions: [
      {
        q: 'The board’s resolution says only President Trump can raise enough to rescue the center. What is the discernment move?',
        options: ['Accept it — the board would know', 'Label it a forecast by an interested board (he chairs it), check the record (gifts fell after his name went on), and keep the open question narrow: it is untested, not proven or disproven', 'Reject it — boards always exaggerate'],
        answer: 1,
        explain: 'A forecast is not a finding. Ask who is speaking and what they depend on, check what the documents show so far, and say honestly what is unknown (DR-0100 Tier 2, narrowly).',
      },
      {
        q: '"Congress gave the Kennedy Center its name, and only Congress can change it." What kind of statement is this?',
        options: ['One side’s opinion in a lawsuit', 'An adjudicated finding — a federal judge ruled it on May 29, 2026 — and it is said plainly as such', 'A claim no one has examined'],
        answer: 1,
        explain: 'A ruling is a verdict and is stated as one. What remains open is the narrower question of whether an inscription beneath the name violates that order — which the same judge will decide.',
      },
      {
        q: 'The board says the crisis comes from decades of neglect; the artists say it was made by the takeover. What does the record show?',
        options: ['Only the board is right', 'Only the artists are right', 'Two true facts on two clocks: the building’s decay is decades old (the ceiling), and the revenue collapse is new and dated to the renaming (the documents) — neither erases the other'],
        answer: 2,
        explain: 'Weighing means letting each side keep its true fact without letting it cancel the other’s. "Decades of neglect" does not explain the empty seats; the empty seats do not explain the ceiling.',
      },
      {
        q: 'Which is the Word’s teaching about names on houses?',
        options: ['Never honor a giver on a building', 'Memorials and honor to benefactors are commanded (Joshua 4:7; Romans 13:7), but a man making his own name the thing a house is for is Babel, Absalom’s pillar, and Nebuchadnezzar’s roof — and "A good name is rather to be chosen than great riches"', 'Whoever pays the most gets the name'],
        answer: 1,
        explain: 'The correction is precise. The Word honors givers and commands memorials; it warns against "let us make us a name" and answers "they call their lands after their own names" with "man being in honour abideth not."',
      },
      {
        q: 'Cyrus and Darius paid for Yahweh’s house. What did the Word keep, and what does that model for a hall or a church taking a large gift?',
        options: ['The king’s name went on the house', 'The house kept Yahweh’s name (Ezra 6:12), the credit went behind the king to the Giver, and the people were told "Put not your trust in princes" — accept the gift, keep the name and the trust where they belong', 'Refuse all gifts from rulers'],
        answer: 1,
        explain: 'A patron can be received with honor and thanks (Ezra 7:27; Nehemiah 2:8) without becoming the one the house is for or the one it depends on (Proverbs 22:7).',
      },
      {
        q: 'The resolution says payroll cannot be met within weeks. Before the name is settled, what does the Word require?',
        options: ['Nothing until the court rules', 'That the hired be paid first — "the wages of him that is hired shall not abide with thee all night until the morning" (Leviticus 19:13); the hire kept back "crieth" (James 5:4)', 'That the artists come back'],
        answer: 1,
        explain: 'Whoever wins the fight over the marble, the musicians and the crew are the first obligation, not the last. A settlement that leaves them unpaid has failed the first test.',
      },
      {
        q: 'Public claims of record fundraising sit beside confidential documents showing collapse. What does the Word say about the numbers?',
        options: ['Numbers are a matter of opinion', '"A false balance is abomination to the LORD" — one weight in public and in private (Proverbs 11:1; 2 Corinthians 8:21); which figures are right is genuinely open, but the standard for reporting them is not', 'Whichever side you favor is right'],
        answer: 1,
        explain: 'Tier 2 is narrow: the disagreement is documented and no audited reconciliation is public. The just weight binds every party that reports a figure, on every side.',
      },
      {
        q: 'An artist cancels out of conscience. What does the Word honor, and what does it still require?',
        options: ['Conscience is honored (Daniel 3:18), and so is praying for those in authority and seeking the peace of the city (1 Timothy 2:2; Jeremiah 29:7) — refusal is not a license for contempt', 'Artists must play wherever they are booked', 'Conscience means the ruler is the enemy'],
        answer: 0,
        explain: 'Three men refused the image and were honored; the same Word tells the exiles to pray for the city that held them. Refusing to play and cursing the ruler are different acts.',
      },
    ],
  },
};

// =============================================================================
// ISSUE 17 — Biology walks back gene-determinism; the Word framed the worlds
// first. Darrell pasted six blocks summarizing a Socrates in the City
// conversation between host Eric Metaxas and the physiologist Denis Noble on
// 2026-09-20 with the single word: Lesson. His governing thesis: this is based
// on the Word's perspective of the worlds, and the confident anti-Yahweh
// reading of biology is being proven wrong from inside science itself. The
// Word first; the men arriving late. PROVENANCE, stated plainly in source.note
// and pinned by a test: we have NOT watched the video. Every position credited
// to Noble, Dawkins, Metaxas or Collins is as summarized in the material
// Darrell provided, and the timestamps are that summary's. Every verse is
// fetched verbatim from the repo KJV and gated in world-issues-verse-integrity.
// =============================================================================
const NOBLE_BIOLOGY_ISSUE = {
  id: 'wi-biology-walked-back-and-the-word-on-the-worlds',
  title: 'Biology Walks Back the Selfish Gene — the Word Framed the Worlds First, and the Science Is Arriving Late',
  subject: { name: 'the gene-centric, deterministic model of life and its public walk-back from inside biology', kind: 'science-and-public-figures', isNamedRealPerson: true },
  skill: 'Take a viral science conversation in which an eminent biologist says his own field got something big wrong for eighty years, and learn how the Word weighs it: lead with what Yahweh already said about the worlds (Hebrews 11:3; Colossians 1:16-17; Genesis 2:7; Job 38), state the documented plainly (the genome was sequenced; polygenic scores predict poorly for individuals; water moves at random; today’s machines have no senses), keep the genuinely contested narrow and named (whether neo-Darwinism is dead is Noble’s position in a live dispute, not a concession by mainstream biology), hear the gene-centric view at its strongest without a sneer (Proverbs 18:17), and refuse BOTH over-reaches — you are not a readout of your genes, and this science is not a proof of Yahweh.',
  source: {
    creator: 'Socrates in the City (host Eric Metaxas), in conversation with the physiologist Denis Noble',
    medium: 'video, received as a written SUMMARY',
    title: 'We Have Been Misled About Biology for 80 Years | Denis Noble',
    url: 'https://youtu.be/18pppZ3egOg',
    asOf: '2026-09-20',
    note: 'PROVENANCE, plainly: we have NOT watched this video, and this lesson is written from a written SUMMARY of it — not a transcript and not the recording. Darrell pasted six summary blocks into the session on 2026-09-20 with the single word "Lesson." Therefore EVERY position attributed here to Denis Noble, Richard Dawkins, Eric Metaxas or Francis Collins is as summarized in the material Darrell provided, not as quoted from the video; and every timestamp in that material is the summary’s own, not one we checked. We quote none of these men verbatim from the recording. The one phrase this lesson does quote from a book — Dawkins’s "created us, body and mind" from The Selfish Gene — was verified independently by live web search on 2026-09-22, not taken from the summary’s word. Video metadata as displayed to Darrell on 2026-09-20: about 1:06:42 long, roughly 503K views, upload read as approximately three weeks earlier (so mid-to-late August 2026, approximate). A NAS-side transcript route exists in the repo but had not merged when this was authored, so this lesson ships on summary provenance and says so.',
  },

  // ---- STAGE 1 — THE CLAIM(S): the summary's points, AS SUMMARIZED, each labeled. ----
  claims: [
    {
      id: 'c-title-misled-80-years',
      text: 'We have been misled about biology for 80 years.',
      label: 'opinion',
      attribution: 'The video’s published title (the publisher’s framing), as displayed on the page Darrell viewed',
      note: 'A headline, not a finding — and the thumbnail on the same video asks the gentler question "Has Science Forgotten Its Limits?" That gap between a headline and the question underneath it is itself the discernment lesson: the title sells, the question teaches. We carry the title as the publisher’s claim and the question as the better frame.',
    },
    {
      id: 'c-dna-not-sole-commander',
      text: 'The deterministic, gene-centric picture — DNA as the sole commander, information flowing one way from DNA to protein to organism (the central dogma) — is incomplete, because the living cell actively regulates and corrects its own genes, so causation runs in several directions at once.',
      label: 'claim',
      attribution: 'Denis Noble, as summarized in the material Darrell provided',
      note: 'The mechanistic content here is mainstream and uncontroversial today: gene regulation, feedback, and error correction are textbook. What is contested is how much of evolutionary theory this overturns (see Stage 2).',
    },
    {
      id: 'c-stochasticity-is-used',
      text: 'Living systems are fundamentally stochastic — driven by inherent chance at the molecular level — and life does not merely tolerate that randomness, it HARNESSES it; the immune system deliberately mutates to generate variety and then selects the variants that bind a new virus.',
      label: 'claim',
      attribution: 'Denis Noble, as summarized in the material Darrell provided',
      note: 'Somatic hypermutation in the immune system is documented biology. Whether the randomness is inherent in the world or a limit in our instruments is the narrow open part (Stage 2).',
    },
    {
      id: 'c-water-and-prediction-limits',
      text: 'We are about 70% water; water molecules have been known to move at random since Robert Brown observed it in 1827; and no computer can predict the behavior of every one of the 20 billion water molecules in a single bacterium — so chance is a foundational property of life, not a gap in our data.',
      label: 'claim',
      attribution: 'Denis Noble, as summarized in the material Darrell provided',
      note: 'The 1827 date and the computational intractability are documented (Stage 2). The specific figures — 70%, 20 billion — are the summary’s and are carried as its numbers, not asserted here.',
    },
    {
      id: 'c-consciousness-and-ai',
      text: 'Consciousness is sensitivity, and it is science’s great blind spot; silicon systems can simulate language but possess no genuine consciousness — they cannot see, feel, hear, or touch.',
      label: 'claim',
      attribution: 'Denis Noble, as summarized in the material Darrell provided',
      note: 'That today’s systems have no sensory experience is documented and plainly true of how they are built. Consciousness as sensitivity is his own definition, and whether consciousness is explicable at all is genuinely open (Stage 2). This is the centre of the lesson, because Psalms 115:4-8 lists the senses of a made thing in the same order three thousand years earlier.',
    },
    {
      id: 'c-genome-project',
      text: 'The Human Genome Project achieved its primary scientific goal — sequencing three billion base pairs, a monumental success — while simultaneously exposing the limits of the reductionist model; the promise that a patient’s genome would predict disease and personalize medicine has not materialized for about 95% of humanity.',
      label: 'claim',
      attribution: 'Denis Noble, as summarized in the second block Darrell sent, which corrects the first block’s "failure of genomic prediction" heading',
      note: 'Darrell’s own correction governs here, and it is the more accurate framing: the project did NOT fail. It succeeded at what it set out to do and the data it produced is what revealed that we are not merely our genes. The prediction shortfall is documented (Stage 2); the "95%" and "60% of fatalities" figures are the summary’s and are carried as its numbers.',
    },
    {
      id: 'c-fail-safe-design',
      text: 'Biological systems are built with redundancy and self-correction: block one gene or one pathway and the system often finds another route to keep the function, which a rigid single-pathway determinism cannot account for.',
      label: 'claim',
      attribution: 'Denis Noble, as summarized in the material Darrell provided',
      note: 'Redundancy, genetic buffering and proofreading during cell division are documented biology. Paul reasoned from distributed, mutually-supplying design in a body long before anyone measured it (1 Corinthians 12:24-25; Ephesians 4:16).',
    },
    {
      id: 'c-testified-against-own-work',
      text: 'When he and his colleagues began in the 1960s they assumed biological systems like the human heart were completely deterministic and predictable by mathematical modelling — his own celebrated work — and he now says that assumption was wrong.',
      label: 'claim',
      attribution: 'Denis Noble, as summarized in the material Darrell provided',
      note: 'This is the rarest thing in the whole story: a man testifying against his own life’s premise. Under this house’s rules that is the thing to admire, not the thing to exploit (Proverbs 18:17; 1 Thessalonians 5:21) — and it is also the blade this lesson turns on the church, which defends traditions past their evidence too (Mark 7:13).',
    },
    {
      id: 'c-neo-darwinism-dead',
      text: 'Neo-Darwinism is dead, because it rests on flawed deterministic assumptions, treats natural selection as the only process at work, and cannot account for agency, purpose, or inheritance beyond DNA such as epigenetics.',
      label: 'opinion',
      attribution: 'Denis Noble, as summarized in the material Darrell provided — his own position in a live scientific dispute',
      note: 'CONTESTED, and the honest word is contested. Most working biologists disagree: the Modern Synthesis remains the foundational framework for mainstream evolutionary biology, and the Extended Evolutionary Synthesis argument Noble belongs to is an ongoing debate, not a settled reversal. This lesson must NOT leave a reader thinking mainstream biology has conceded — it has not. The Word does not need it to.',
    },
    {
      id: 'c-finite-monkeys',
      text: 'A finite-monkeys calculation shows that generating a meaningful biological sequence — or even one coherent phrase — purely by random mutation and selection would take longer than the lifetime of the universe.',
      label: 'opinion',
      attribution: 'Denis Noble, as summarized in the material Darrell provided — offered as an illustration',
      note: 'CARRIED AS HIS ILLUSTRATION AND NEVER AS A PROOF, with the standard objection stated in the same breath because the objection is real: selection is not a pure random search, so a calculation that assumes pure randomness does not describe what the theory actually claims. Cumulative selection with heritable variation is a different mathematical object than drawing letters from a hat. A lesson that leaned on this calculation would hand its critic the easiest possible win — and we do not need it. Psalms 94:9 does the work without a calculator.',
    },
    {
      id: 'c-epigenetics-lamarckian',
      text: 'Epigenetics and related processes show that organisms can pass on acquired characteristics, bringing back Lamarckian ideas the neo-Darwinian framework had rejected.',
      label: 'claim',
      attribution: 'Denis Noble, as summarized in the material Darrell provided',
      note: 'Epigenetic regulation is real, documented, and central to modern biology. Whether acquired characteristics are transmitted across human generations by epigenetic marks is the narrow contested part, named as such in Stage 2.',
    },
    {
      id: 'c-humility',
      text: 'Biology should move toward the open-ended humility physics accepted with quantum indeterminacy; there is something ineffable about life, and we may never fully explain it by reductionist models.',
      label: 'opinion',
      attribution: 'Denis Noble, as summarized in the material Darrell provided — his closing posture',
      note: 'A posture, not a finding, and the one the Word meets most directly: Deuteronomy 29:29 puts the limit exactly there and then steps past it — the secret things are His, and the revealed things are ours to work.',
    },
  ],

  // ---- STAGE 2 — VERIFIABLE vs INTERPRETATION ----
  verifiable: [
    {
      id: 'f-noble-is-eminent',
      statement: 'Denis Noble is a real and eminent physiologist, not a fringe figure: he held the Burdon Sanderson Chair of Cardiovascular Physiology at the University of Oxford from 1984 to 2004, built the first computational model of the cardiac action potential in the 1960s, and is a founding figure of systems biology. His disagreement with Richard Dawkins over the selfish-gene account is genuine, public, and long-running: he has argued in print and in public debate that the selfish-gene picture is holding biology back and is not a good account of evolution (reported position, not a verbatim quotation).',
      status: 'documented',
      sources: [
        { title: 'Denis Noble', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Denis_Noble', asOf: '2026-09-22' },
        { title: 'The Noble - Dawkins debate', publisher: 'Voices from Oxford', url: 'https://www.voicesfromoxford.org/the-noble-dawkins-debate/', asOf: '2026-09-22' },
        { title: 'Noble versus Dawkins: DNA is not the program of the concert of life (De Mul, 2016)', publisher: 'denisnoble.com', url: 'https://denisnoble.com/wp-content/uploads/2019/11/De-Mul-2016-Noble-versus-Dawkins.pdf', asOf: '2026-09-22' },
      ],
      note: 'Verified by live web search 2026-09-22. This matters for weighing the story honestly in both directions: the walk-back is coming from inside mainstream biology, from a decorated practitioner — and that same standing is why his contested conclusions must be labeled as contested rather than borrowed as authority.',
    },
    {
      id: 'f-selfish-gene-phrase',
      statement: 'The phrase the summary quotes from The Selfish Gene is real. Dawkins writes of the replicators: "They are in you and in me; they created us, body and mind; and their preservation is the ultimate rationale for our existence."',
      status: 'documented',
      sources: [
        { title: 'The Selfish Gene', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Selfish_Gene', asOf: '2026-09-22' },
        { title: 'The Selfish Gene — quotations', publisher: 'Goodreads', url: 'https://www.goodreads.com/work/quotes/1746717-the-selfish-gene', asOf: '2026-09-22' },
      ],
      note: 'Verified independently by live web search 2026-09-22 rather than trusted from the summary, because a quoted phrase is a claim that the words are exact. This is the ONE verbatim quotation of any living person in this lesson; every other position is reported, not quoted.',
    },
    {
      id: 'f-hgp-succeeded',
      statement: 'The Human Genome Project ran from 1990 to 2003 and achieved its goal: it determined and made public the sequence of nearly all of the roughly three billion base pairs of human DNA. It was a scientific success, and it is the source of the data that later research uses.',
      status: 'documented',
      sources: [
        { title: 'Human Genome Project (HGP) — History, Timeline, & Facts', publisher: 'Encyclopaedia Britannica', url: 'https://www.britannica.com/event/Human-Genome-Project', asOf: '2026-09-22' },
        { title: 'Human Genome Project: a new era of scientific progress', publisher: 'Wellcome', url: 'https://wellcome.org/insights/articles/human-genome-project-new-era-scientific-progress', asOf: '2026-09-22' },
      ],
      note: 'Verified 2026-09-22. Stated this way on purpose: the project did NOT fail, and Darrell’s second block corrected the first block’s framing to exactly this. Saying "the genome project failed" would be the easy, false version — and this house forbids under-claiming a verified success as much as it forbids over-claiming an unproven one. What the project exposed is a limit of the reductionist MODEL, which is a different sentence.',
    },
    {
      id: 'f-collins-prediction',
      statement: 'The personalized-prediction promise was made publicly and specifically. Francis Collins, then director of the National Human Genome Research Institute, told Congress in 2003 that within about ten years predictive genetic tests would let each person learn individual risks for future illness, and that by 2020 gene-based designer drugs would likely be available for conditions like diabetes, Alzheimer’s disease and hypertension.',
      status: 'documented',
      sources: [
        { title: 'Personalized medicine: We’re not there yet', publisher: 'STAT News', url: 'https://www.statnews.com/2024/04/05/personalized-medicine-not-here-yet/', asOf: '2026-09-22' },
        { title: 'The Human Genome Project, and recent advances in personalized genomics', publisher: 'Journal of Clinical Investigation / PMC', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4337712/', asOf: '2026-09-22' },
        { title: 'Personalized Medicine', publisher: 'National Human Genome Research Institute (genome.gov)', url: 'https://www.genome.gov/genetics-glossary/Personalized-Medicine', asOf: '2026-09-22' },
      ],
      note: 'Verified 2026-09-22. Stated without sneering: parts of that vision did arrive — pharmacogenomics, targeted cancer therapy, rare-disease diagnosis. The broad population-level prediction did not, which is the narrower and true claim.',
    },
    {
      id: 'f-polygenic-scores-predict-poorly',
      statement: 'The 2023 University College London work the summary points to exists and says what the summary says it says. Hingorani, Gratton, Finan and colleagues analysed 926 polygenic risk scores across 310 diseases in the Polygenic Score Catalog and reported that the scores perform poorly for population screening and individual risk prediction: a typical score for a common disease detects only about 11% of the people who go on to develop it, at a 5% false-positive rate.',
      status: 'documented',
      sources: [
        { title: 'Performance of polygenic risk scores in screening, prediction, and risk stratification: secondary analysis of data in the Polygenic Score Catalog (Hingorani AD, Gratton J, Finan C, et al., BMJ Medicine 2023;2(1))', publisher: 'PubMed (PMID 37859783)', url: 'https://pubmed.ncbi.nlm.nih.gov/37859783/', asOf: '2026-09-22' },
        { title: 'Performance of polygenic risk scores in screening, prediction, and risk stratification (record)', publisher: 'UCL Discovery', url: 'https://discovery.ucl.ac.uk/id/eprint/10179716/', asOf: '2026-09-22' },
        { title: 'Genetic risk scores not useful in predicting disease', publisher: 'ScienceDaily (reporting the BMJ Medicine study)', url: 'https://www.sciencedaily.com/releases/2023/10/231017215935.htm', asOf: '2026-09-22' },
      ],
      note: 'Verified 2026-09-22 by live web search, including the authors and the journal, because the brief required naming them or saying plainly that we could not. Stated plainly, in the first tier: limited individual predictive power for common complex disease is a documented finding of mainstream medical research, published in a BMJ journal by UCL researchers — not a skeptic’s talking point. The summary’s "95% of humanity" and "60% of human fatalities" figures are NOT in this paper as such and are carried as the summary’s numbers only.',
    },
    {
      id: 'f-brownian-1827',
      statement: 'Random molecular motion in water has been an observed fact since 1827, when the botanist Robert Brown watched particles inside pollen grains suspended in water move in a rapid oscillatory way under his microscope; he published the observations in 1828 and showed the motion was general to matter, not peculiar to living pollen.',
      status: 'documented',
      sources: [
        { title: 'Brownian motion', publisher: 'Encyclopaedia Britannica', url: 'https://www.britannica.com/science/Brownian-motion', asOf: '2026-09-22' },
        { title: 'August 1827: Robert Brown and Molecular Motion in a Pollen Grain', publisher: 'American Physical Society (APS News)', url: 'https://www.aps.org/apsnews/2016/08/robert-brown-molecular-motion-pollen', asOf: '2026-09-22' },
      ],
      note: 'Verified 2026-09-22. The date in the summary checks out. Note the honest detail the summary leaves out and we keep: Brown first thought the motion belonged to living material and then disproved himself — the same self-correcting move this lesson admires later.',
    },
    {
      id: 'f-intractability',
      statement: 'It is genuinely intractable to compute the trajectory of every molecule in even a single cell. The number of interacting particles and the sensitivity of the dynamics put a molecule-by-molecule simulation of a whole living cell beyond any computer that exists or is planned; this is why cell-scale modelling is done statistically, with coarse-grained and stochastic methods, rather than particle by particle.',
      status: 'documented',
      sources: [
        { title: '100 years of Einstein’s theory of Brownian motion: from pollen grains to protein trains', publisher: 'arXiv (cond-mat/0504610)', url: 'https://arxiv.org/pdf/cond-mat/0504610', asOf: '2026-09-22' },
        { title: 'Introduction to the theory of stochastic processes and Brownian motion problems', publisher: 'arXiv (cond-mat/0701242)', url: 'https://arxiv.org/pdf/cond-mat/0701242', asOf: '2026-09-22' },
      ],
      note: 'Verified 2026-09-22. Said carefully: intractable-for-us is a statement about our computers and our methods, not a proof about what is determined or undetermined in the world. That distinction is exactly where this lesson refuses to over-reach — and where Psalms 147:5 steps past us without contradicting anyone’s physics.',
    },
    {
      id: 'f-ai-has-no-senses',
      statement: 'Current language systems have no sensory experience. They are trained on text and other recorded data and run as numerical computations on silicon; there is no seeing, hearing, smelling, touching or feeling in the loop, and no scientific instrument has detected experience in one. Whatever a system’s fluency, its words are not reports of a lived sensation.',
      status: 'documented',
      sources: [
        { title: 'Denis Noble', publisher: 'Wikipedia (for Noble’s stated position on the distinction)', url: 'https://en.wikipedia.org/wiki/Denis_Noble', asOf: '2026-09-22' },
        { title: 'Scientific-intellectual movements in the post-truth age: The case of the Extended Evolutionary Synthesis', publisher: 'PMC', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12882973/', asOf: '2026-09-22' },
      ],
      note: 'Tier 1 on the architecture, and deliberately NOT more than that: that these systems lack sensory experience is plain from how they are built, and this lesson states it. Whether a machine could ever be conscious is a separate question this lesson does not answer, and Psalms 115 is a resonance about makers and made things, not a physics proof about silicon.',
    },
    {
      id: 'f-neo-darwinism-contested',
      statement: 'Whether "neo-Darwinism is dead" is NOT settled, and mainstream evolutionary biology has not conceded it. The Extended Evolutionary Synthesis argument — that development, plasticity, niche construction and epigenetic inheritance require extending or replacing the Modern Synthesis — is a live, heated debate in which many, probably most, working evolutionary biologists hold that the Modern Synthesis remains the foundational framework and already accommodates these findings.',
      status: 'disputed',
      sources: [
        { title: 'Scientific-intellectual movements in the post-truth age: The case of the Extended Evolutionary Synthesis', publisher: 'PMC', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12882973/', asOf: '2026-09-22' },
        { title: 'The extended evolutionary synthesis: An integrated historical and philosophical examination (Shan, 2024)', publisher: 'Philosophy Compass (Wiley)', url: 'https://compass.onlinelibrary.wiley.com/doi/10.1111/phc3.13002', asOf: '2026-09-22' },
        { title: 'Neo-darwinism still haunts evolutionary theory: A modern perspective on Charlesworth, Lande, and Slatkin (1982)', publisher: 'Evolution / PMC', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8979413/', asOf: '2026-09-22' },
      ],
      note: 'A genuinely-open item, NARROWLY and on purpose. The contested item is the verdict "dead," not the underlying findings. A reader must leave this lesson knowing that mainstream biology has NOT conceded the point — because a faith propped on a live scientific dispute falls the day the dispute turns, and the Word never needed the verdict.',
    },
    {
      id: 'f-transgenerational-human',
      statement: 'Epigenetic regulation is documented and central to biology. Transgenerational epigenetic inheritance IN HUMANS — acquired marks transmitted across generations and producing a stable inherited trait — is the narrow part that is not established; the animal evidence is stronger than the human evidence, and human studies are hard to separate from shared environment and social transmission.',
      status: 'partly-documented',
      sources: [
        { title: 'Evolution beyond neo-Darwinism: a new conceptual framework (Noble, 2015)', publisher: 'Journal of Experimental Biology', url: 'https://journals.biologists.com/jeb/article/218/1/7/13568/Evolution-beyond-neo-Darwinism-a-new-conceptual', asOf: '2026-09-22' },
        { title: 'The extended evolutionary synthesis: An integrated historical and philosophical examination (Shan, 2024)', publisher: 'Philosophy Compass (Wiley)', url: 'https://compass.onlinelibrary.wiley.com/doi/10.1111/phc3.13002', asOf: '2026-09-22' },
      ],
      note: 'Tier 2, one clause wide: the mechanism is real, the human-generational claim is not settled. Saying "epigenetics proves Lamarck was right about people" would be the over-claim; saying "epigenetics is not real" would be the under-claim. Neither is honest.',
    },
    {
      id: 'f-finite-monkeys-objection',
      statement: 'The improbability calculation is not evidence, and the objection to it is standard and sound: an argument that computes the odds of assembling a sequence by drawing characters at random does not describe cumulative selection, in which each favourable variant is retained and built upon. Pure-random-search odds and selection-with-heritable-variation are different mathematical objects, so the calculation does not refute what evolutionary theory actually claims.',
      status: 'disputed',
      sources: [
        { title: 'Scientific-intellectual movements in the post-truth age: The case of the Extended Evolutionary Synthesis', publisher: 'PMC', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12882973/', asOf: '2026-09-22' },
        { title: 'Neo-Darwinism and Evo-Devo: An Argument for Theoretical Pluralism in Evolutionary Biology', publisher: 'Perspectives on Science (MIT Press)', url: 'https://direct.mit.edu/posc/article/23/3/243/15391/Neo-Darwinism-and-Evo-Devo-An-Argument-for', asOf: '2026-09-22' },
      ],
      note: 'Carried here so the illustration in Stage 1 can never travel alone. This house does not need a contested probability argument: "He that planted the ear, shall he not hear? he that formed the eye, shall he not see?" (Psalms 94:9) needs no calculator, and cannot be overturned by a better calculation.',
    },
  ],
  interpretation: [
    {
      id: 'n-the-reverse-arrow',
      statement: 'THE ARROW RUNS ONE WAY, AND IT IS NOT THE FLATTERING ONE. Biology has not proved Yahweh, and this lesson never says it has. What the record shows is the reverse and far more durable claim: Yahweh said it first — the worlds framed by His word, the man formed of dust and then breathed into, the sea given a decree — and a confident reading of biology that contradicted Him is now being walked back from inside the field. "Through faith we understand that the worlds were framed by the word of God" (Hebrews 11:3) is how the frame is received; a journal is not the instrument that delivers it. Faith propped on a live scientific dispute falls the day the dispute turns; faith in what He said does not move when the dispute does.',
      restsOn: ['f-noble-is-eminent', 'f-neo-darwinism-contested', 'f-hgp-succeeded'],
    },
    {
      id: 'n-philosophy-in-a-lab-coat',
      statement: 'BE PRECISE ABOUT WHAT IS COLLAPSING, BECAUSE PRECISION IS WHAT MAKES IT STRONG. The gene-centric research programme produced enormous real knowledge and still does. What is collapsing is the PHILOSOPHICAL claim that rode in on it: that you ARE your genes, that purpose is an illusion, that life is a blind algorithm with no author. That was never a measurement; it was a worldview assertion wearing a lab coat — and it is now contradicted by eminent mainstream biologists, not by apologists. Saying so plainly is required: under-claiming a verified truth fails as badly as over-claiming an unverified one. "oppositions of science falsely so called" (1 Timothy 6:20) names exactly that layer and nothing else: the worldview claim in the coat, never the microscope, never the honest worker at the bench.',
      restsOn: ['f-selfish-gene-phrase', 'f-polygenic-scores-predict-poorly', 'f-noble-is-eminent'],
    },
    {
      id: 'n-not-a-concession-by-the-field',
      statement: 'A DISPUTE IS NOT A SURRENDER. Noble’s "neo-Darwinism is dead" is his verdict inside an unresolved argument, and most working biologists do not agree with it. A reader who leaves thinking mainstream biology has conceded has been misinformed by us, which would be its own false witness. Keep the categories: the mechanisms (regulation, stochasticity, redundancy, epigenetic control) are documented; the verdict on the framework is contested; and nothing in the Word’s account depends on how that argument ends.',
      restsOn: ['f-neo-darwinism-contested', 'f-transgenerational-human'],
    },
    {
      id: 'n-the-genome-project-did-not-fail',
      statement: 'THE PROJECT SUCCEEDED; THE MODEL MET A LIMIT. Darrell’s second block corrected the first block’s "failure of genomic prediction" framing, and the correction governs: three billion base pairs were sequenced, which is a monumental success, and the very data it produced is what showed that a person is not a readout of a sequence. The honest sentence is "the project achieved its goal and exposed the limits of the reductionist model," not "the project failed." One of those sentences is true and the other is a slogan.',
      restsOn: ['f-hgp-succeeded', 'f-collins-prediction', 'f-polygenic-scores-predict-poorly'],
    },
    {
      id: 'n-headline-versus-question',
      statement: 'THE HEADLINE AND THE QUESTION UNDER IT. "We Have Been Misled About Biology for 80 Years" is the publisher’s title; the thumbnail on the same video asks "Has Science Forgotten Its Limits?" The second is the better question and the one the conversation actually answers. Noticing that gap — a title tuned for the click, a question tuned for the truth — is the transferable habit of this whole track, and it applies to every headline a believer will meet this week, including headlines we agree with.',
      restsOn: ['f-noble-is-eminent'],
    },
    {
      id: 'n-our-own-provenance-limit',
      statement: 'OUR OWN LIMIT, STATED FIRST. We did not watch the video. This lesson is built from a written summary Darrell provided, with that summary’s timestamps, so every position here attributed to a living man is reported at one remove and is labeled that way in the source note and throughout. We quote none of them verbatim from the recording; the single book phrase we do quote was verified independently. A lesson that teaches provenance and hides its own would be teaching the opposite of itself.',
      restsOn: ['f-selfish-gene-phrase'],
    },
  ],

  // ---- STAGE 3 — PERSPECTIVES on the UNRESOLVED parts ----
  perspectives: [
    {
      id: 'p-gene-centric',
      label: 'The gene-centric view — the gene’s-eye account explained an enormous amount, and still does',
      heldBy: 'Richard Dawkins and the many serious biologists who hold a gene-centred account of selection',
      steelman: 'At its strongest, and it is strong: the gene’s-eye view solved problems that had defeated earlier accounts. It explained why a sterile worker bee will die for her sisters, why parents invest unequally, why conflict runs between a mother and the embryo she carries — the arithmetic of relatedness made sense of behaviour that looked like a contradiction of natural selection. It gave the field a unit that is actually inherited and actually replicates, it generated decades of testable predictions that came out right, and it made a difficult science teachable to millions. It has also never required the caricature: Dawkins argued at length that the "selfishness" is a bookkeeping metaphor about replicators, not a claim that people are doomed to selfish behaviour, and he wrote explicitly about rebelling against the replicators. Serious, careful people hold this view today, and a reader who cannot state it in its own best words has not earned the right to disagree with it (Proverbs 18:17). What the Word corrects is not this research programme; it is the further leap — that the sequence is therefore all a person IS.',
    },
    {
      id: 'p-systems-biology',
      label: 'The systems-biology critique — causation runs in several directions, and life uses chance on purpose',
      heldBy: 'Denis Noble and colleagues in systems biology and the Extended Evolutionary Synthesis, as summarized in the material Darrell provided',
      steelman: 'Heard fairly: a heart does not beat because a gene commands it to; the rhythm is a property of the whole interacting system, and the cell regulates, silences and repairs its own DNA continuously. Block a pathway and a living system frequently routes around the block. The immune system does not read a pre-written answer for a virus it has never met; it deliberately generates variety and then selects what binds. From inside that work, treating DNA as a one-way program looks like mistaking the score for the music. And this critique comes with an unusual credential: the man making it is retracting the premise of his own celebrated modelling work from the 1960s, which is the opposite of defending a position because it is his. His conclusion about the whole framework is contested; his description of how a cell behaves largely is not.',
    },
    {
      id: 'p-mainstream-synthesis',
      label: 'The mainstream synthesis view — Noble is describing real biology and overstating what it overturns',
      heldBy: 'Many evolutionary biologists and philosophers of biology who hold that the Modern Synthesis remains foundational',
      steelman: 'At its strongest, and this is the view a reader is least likely to be handed: nothing in the list is news, and none of it is outside the framework. Population genetics has modelled stochastic processes since Fisher, Wright and Haldane — drift IS chance, formalised a century ago. Regulation, plasticity, redundancy, canalisation and mutation-rate control are standard subjects with standard mathematics, and molecular noise has been measured, not merely asserted. That polygenic scores predict individuals poorly is exactly what a highly polygenic, environment-interacting architecture predicts; it refutes a naive determinism that careful geneticists never held. On this view "neo-Darwinism is dead" is a rhetorical flourish that trades a well-tested framework for a slogan, and the improbability calculation is the weakest thing in the case. The honest position is extension and refinement, not a funeral — and an outsider who hears "dead" and concludes that evolutionary biology has collapsed has been misled by the framing, not informed by the evidence.',
    },
    {
      id: 'p-word-first-reader',
      label: 'The Word-first reader’s view — He said it first, and the arrow never reverses',
      heldBy: 'Believers who hold Scripture as the frame rather than as a competitor in the argument',
      steelman: 'This reader is not waiting for a verdict. The worlds were framed by His word and are held together by the Son; the man was formed of dust and then breathed into, and the breath was never an item in the sequence; the sea was given a decree it cannot pass. That account was written down long before a microscope existed, and it does not become more true when a biologist moves toward it or less true if he moves back. So this reader refuses two temptations at once: he will not recruit a live scientific dispute as proof of Yahweh, because "Through faith we understand" (Hebrews 11:3) names the instrument and it is not a journal; and he will not pretend the philosophical claim that rode on gene-determinism was ever measured. He states the documented plainly, keeps the contested narrow, honours the honest worker at the bench, and keeps the Honor where it belongs.',
    },
  ],

  // ---- STAGE 4 — THE BELIEVER'S LENS ----
  lens: {
    fourD: {
      deepSource: 'WORD FIRST — Yahweh told us how the worlds are before any laboratory opened, and the lesson is not that biology has proved Him. The arrow runs the other way: He said it first, and the men are arriving late. THE WORLDS AS HE FRAMED THEM. The frame comes first and it is received by faith, not by a journal: "Through faith we understand that the worlds were framed by the word of God, so that things which are seen were not made of things which do appear." (Hebrews 11:3). The Author is not a force inside the system He made; He is before it and He holds it: "For by him were all things created, that are in heaven, and that are in earth, visible and invisible" (Colossians 1:16) — "And he is before all things, and by him all things consist." (Colossians 1:17); "For in him we live, and move, and have our being" (Acts 17:28); "he giveth to all life, and breath, and all things" (Acts 17:25). He put the boundary in the sea Himself: "When he gave to the sea his decree, that the waters should not pass his commandment" (Proverbs 8:29) — "Hitherto shalt thou come, but no further" (Job 38:11) — and He opened the cross-examination that no model has ever answered: "Where wast thou when I laid the foundations of the earth? declare, if thou hast understanding." (Job 38:4). And the making of a man is the most precise refutation of a sequence-only account that exists, because it is TWO acts and only one of them is material: "And the LORD God formed man of the dust of the ground, and breathed into his nostrils the breath of life; and man became a living soul." (Genesis 2:7). Dust, and then His breath. The breath is not an item in the sequence, and no reading of the dust will ever find it. He was there in the building of the body, and He kept the record: "thou hast covered me in my mother’s womb" (Psalms 139:13) — "I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well." (Psalms 139:14) — "My substance was not hid from thee, when I was made in secret, and curiously wrought in the lowest parts of the earth." (Psalms 139:15) — "Thine eyes did see my substance, yet being unperfect; and in thy book all my members were written" (Psalms 139:16). "it is he that hath made us, and not we ourselves" (Psalms 100:3); "Shall the clay say to him that fashioneth it, What makest thou?" (Isaiah 45:9). CONSCIOUSNESS — THE SENSES OF A MADE THING. This is the centre of the lesson. Noble’s reported point is that silicon can simulate language and has no consciousness at all: it cannot see, feel, hear or touch. Now read the list the Word made three thousand years earlier, in the same order, about the best that human making could do: "Their idols are silver and gold, the work of men’s hands." (Psalms 115:4) — "They have mouths, but they speak not: eyes have they, but they see not:" (Psalms 115:5) — "They have ears, but they hear not: noses have they, but they smell not:" (Psalms 115:6) — "They have hands, but they handle not: feet have they, but they walk not: neither speak they through their throat." (Psalms 115:7). Mouth, eye, ear, nose, hand, foot, throat — the exact inventory of what a made thing does not have. AND THEN VERSE 8 TURNS IT ON US, AND WE DO NOT DODGE IT: "They that make them are like unto them; so is every one that trusteth in them." (Psalms 115:8). The danger was never that the machine would become a soul. The danger is that the maker shrinks to the size of what he made — which is precisely what gene-determinism did to man from the other direction, telling him he was a readout. Both errors reduce a living soul to a mechanism, and Psalms 115:8 catches both in one line. What a man actually has, no inventory of parts contains: "But there is a spirit in man: and the inspiration of the Almighty giveth them understanding." (Job 32:8); "For what man knoweth the things of a man, save the spirit of man which is in him?" (1 Corinthians 2:11); "In whose hand is the soul of every living thing, and the breath of all mankind." (Job 12:10); the LORD "formeth the spirit of man within him" (Zechariah 12:1). And the Word aims one line uncomfortably close to a house that builds teaching machines, so we name our own exposure rather than enjoy someone else’s: "Woe unto him that saith to the wood, Awake; to the dumb stone, Arise, it shall teach!" (Habakkuk 2:19) — "it shall teach" — "and there is no breath at all in the midst of it" (Habakkuk 2:19); "a teacher of lies, that the maker of his work trusteth therein" (Habakkuk 2:18). We build teaching tools on this platform. The warning is ours before it is anyone else’s: a tool may carry His words, and it has no breath, and it must never be trusted as the source. WATER, AND WHAT IS UNCOMPUTABLE TO US. The strongest fit in the whole story. Life is mostly water; water has been known to move at random since 1827; and no computer can track every water molecule in one bacterium. The Word puts the limit in exactly that place — counting what cannot be counted — and then steps straight past it: "He telleth the number of the stars; he calleth them all by their names." (Psalms 147:4) — "Great is our Lord, and of great power: his understanding is infinite." (Psalms 147:5). "Who can number the clouds in wisdom?" (Job 38:37); "He bindeth up the waters in his thick clouds; and the cloud is not rent under them." (Job 26:8). What is uncomputable to us is not unknown to Him. That is the whole sentence, and notice what it does not say: it does not claim a scientific finding, and it cannot be overturned by a faster computer. And the waters were there at the making, which the Word says men are determined not to see: "And the Spirit of God moved upon the face of the waters" (Genesis 1:2) — "For this they willingly are ignorant of, that by the word of God the heavens were of old, and the earth standing out of the water and in the water:" (2 Peter 3:5). "willingly are ignorant" lands on the thesis without any help from us. FINDING A WAY THROUGH IS HIS OWN SIGNATURE. Noble’s reported definition of life is the ability to find a way through. Read whose signature that is: "Thus saith the LORD, which maketh a way in the sea, and a path in the mighty waters" (Isaiah 43:16) — "I will even make a way in the wilderness, and rivers in the desert" (Isaiah 43:19) — and the promise to a tempted believer is built on the same verb — He "will with the temptation also make a way to escape, that ye may be able to bear it" (1 Corinthians 10:13); "out of his belly shall flow rivers of living water" (John 7:38). A way through water is not a coincidence of vocabulary; it is how He describes Himself. And water finishes the idol movement: the idol is stone, gold and silver — crystal, rigid, made — and the reported point is that the silicon chip is crystal too, while life is water, flux and breath. Name the resonance and stop there. It is a resonance worth seeing, not an argument that silicon can never think; we do not need that argument and the Word does not make it. CHANCE IS A WORD FOR WHAT WE CANNOT SEE, NEVER FOR WHAT IS UNRULED. This is the release this lesson gives, and many believers need it. Stochasticity in a cell is no threat whatsoever to His rule, because Scripture uses the language of chance freely and then tells you who disposes it: "The lot is cast into the lap; but the whole disposing thereof is of the LORD." (Proverbs 16:33); "time and chance happeneth to them all" (Ecclesiastes 9:11); "A man’s heart deviseth his way: but the LORD directeth his steps." (Proverbs 16:9); "Man’s goings are of the LORD; how can a man then understand his own way?" (Proverbs 20:24); "the way of man is not in himself: it is not in man that walketh to direct his steps" (Jeremiah 10:23). And the clearest case in the Word is an arrow nobody aimed. A prophet said Ahab would fall and the scattered people go home — "I saw all Israel scattered upon the hills, as sheep that have not a shepherd" (1 Kings 22:17) — and the court preferred the four hundred who said otherwise, though the Word even discloses the mechanism behind them: "the LORD hath put a lying spirit in the mouth of all these thy prophets" (1 Kings 22:23). Then: "And a certain man drew a bow at a venture, and smote the king of Israel between the joints of the harness" (1 Kings 22:34). At a venture. Random, by every measure a bowman could give, and exactly as spoken. A believer who flinches at the word "random" has quietly accepted the atheist’s premise — that chance and providence are competitors. They are not. Randomness names our ignorance of a cause; providence names His government of the whole. FAIL-SAFE DESIGN, WHICH PAUL ALREADY REASONED FROM. The reported finding is redundancy and self-correction: block one gene and the system finds another path. Paul reasoned from that architecture in a body, as doctrine, before anyone measured a pathway: "For our comely parts have no need: but God hath tempered the body together, having given more abundant honour to that part which lacked:" (1 Corinthians 12:24) — "That there should be no schism in the body; but that the members should have the same care one for another." (1 Corinthians 12:25). And distributed causation is in one clause: "the effectual working in the measure of every part" (Ephesians 4:16) — every part working in its measure, the increase belonging to the whole. The body He built is the model the Body is told to copy. And the craftsmanship word for it was already chosen: "curiously wrought" (Psalms 139:15). THE GENOME PROJECT — A SUCCESS THAT EXPOSED A LIMIT. Say it the accurate way, because the accurate way is stronger: the project achieved its goal, three billion base pairs, a monumental success — and the data it produced is what revealed that a person is not a readout. That is how honest searching is supposed to work, and the Word blesses the searching: "It is the glory of God to conceal a thing: but the honour of kings is to search out a matter." (Proverbs 25:2). Concealing is His glory; searching is our honour. The only thing the Word deflates is the confidence that the search is finished: "And if any man think that he knoweth any thing, he knoweth nothing yet as he ought to know." (1 Corinthians 8:2); "Such knowledge is too wonderful for me; it is high, I cannot attain unto it." (Psalms 139:6). A MAN WHO TESTIFIED AGAINST HIS OWN WORK — AND THE BLADE TURNED ON US. Of everything in this story, the rarest is a man saying the premise of his own celebrated work was wrong. This house’s rules make that the thing to honour: "He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him." (Proverbs 18:17); "Prove all things; hold fast that which is good." (1 Thessalonians 5:21). NOW TURN THE BLADE ON US. A model held eighty years past its evidence is a failure the church commits too — traditions defended because they are ours rather than because they are His: "Making the word of God of none effect through your tradition" (Mark 7:13). If this lesson can praise a biologist for self-correction and cannot ask the reader to do the same, it has failed, and the thesis curdles into gloating. So the question comes home: what do we hold because He said it, and what do we hold because we have always held it? HIS KNOWING PRECEDES THE SEARCH. Every instrument we point at the eye was made by a thing He made first: "He that planted the ear, shall he not hear? he that formed the eye, shall he not see?" (Psalms 94:9). He announced ends before beginnings: "Declaring the end from the beginning, and from ancient times the things that are not yet done" (Isaiah 46:10); "Before I formed thee in the belly I knew thee" (Jeremiah 1:5). His knowing is not a later inference from data; it is prior to the data. "so are my ways higher than your ways, and my thoughts than your thoughts" (Isaiah 55:9). SCIENCE FALSELY SO CALLED — USED PRECISELY. The Word gives a phrase for this exact layer, and it must be aimed exactly or it becomes a slur on honest work: "oppositions of science falsely so called" (1 Timothy 6:20). Science falsely so called is not the microscope, not the sequencing machine, not the technician at the bench. It is the WORLDVIEW claim wearing the lab coat — you are your genes, purpose is illusion, there is no author — asserted with the authority of measurement and never measured. Aimed there, the Word is precise and this lesson does not despise real science. Aimed anywhere else, it becomes exactly the anti-intellectual sneer we are not permitted: "It is the glory of God to conceal a thing: but the honour of kings is to search out a matter." (Proverbs 25:2) blesses the searching. And where the claim WAS made — knowing Him and refusing the Honor — the Word’s verdict is already recorded: "the invisible things of him from the creation of the world are clearly seen, being understood by the things that are made, even his eternal power and Godhead; so that they are without excuse:" (Romans 1:20) — "when they knew God, they glorified him not as God, neither were thankful; but became vain in their imaginations" (Romans 1:21) — "Professing themselves to be wise, they became fools," (Romans 1:22). "For it is written, I will destroy the wisdom of the wise, and will bring to nothing the understanding of the prudent." (1 Corinthians 1:19); "where is the disputer of this world? hath not God made foolish the wisdom of this world?" (1 Corinthians 1:20); "For the wisdom of this world is foolishness with God." (1 Corinthians 3:19); "The Lord knoweth the thoughts of the wise, that they are vain." (1 Corinthians 3:20); "The fool hath said in his heart, There is no God." (Psalms 14:1); "Beware lest any man spoil you through philosophy and vain deceit" (Colossians 2:8). Read these as a verdict on a CLAIM, which is what they are — never as a taunt at a person, and never as an argument we offer to persuade. Romans 1 pronounces them without excuse; it does not hand them a proof for their approval. THE OVER-REACH, CORRECTED IN BOTH DIRECTIONS. First direction — genetic determinism. A man is not a readout of a sequence, and the Word never lets a person be reduced to an inheritance: "The soul that sinneth, it shall die." (Ezekiel 18:20) — the charge is personal, never a thing you simply inherit from your father — and the summons is to a chooser: "I have set before you life and death, blessing and cursing: therefore choose life" (Deuteronomy 30:19). The true data under the determinist over-reach stands untouched: genes are real, heritable, and consequential, and no one here is pretending otherwise. Second direction, and it is OURS — do not claim biology has proved Yahweh. It has not, this lesson does not say it has, and saying it would be a weaker faith, not a stronger one: it would rest the Honor of Yahweh on a dispute that could turn next year. "Through faith we understand" (Hebrews 11:3) names the instrument, and it is not a journal. Romans 1’s logic is a verdict on those who knew and refused — "so that they are without excuse" (Romans 1:20) — not a proof handed to them for their approval. Keep the arrow straight: He said it first; the science is arriving late. SO IN THIS CASE the believer does four things in order. First, lead with what He said, not with what a biologist said — Hebrews 11:3, Colossians 1:16-17, Genesis 2:7, Job 38, Psalms 139. Second, state the documented plainly: the genome was sequenced and that was a success; polygenic scores predict individuals poorly; water moves at random and has since 1827; a cell is not computable molecule by molecule; today’s machines have no senses. Third, keep the contested narrow and named — "neo-Darwinism is dead" is one eminent man’s verdict in a live argument that mainstream biology has not conceded, human transgenerational epigenetic inheritance is unsettled, and the improbability calculation is an illustration with a real objection against it, never a proof. Fourth, refuse both over-reaches, honour the honest worker at the bench, and let the limit be the whole verse: "The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever, that we may do all the words of this law." (Deuteronomy 29:29). Both halves. Ending on mystery alone would be half a verse and half a faith — the secret things are His, AND the revealed things are ours to work, and to teach our children. "Canst thou by searching find out God? canst thou find out the Almighty unto perfection?" (Job 11:7); "he hath set the world in their heart, so that no man can find out the work that God maketh from the beginning to the end" (Ecclesiastes 3:11); "though a wise man think to know it, yet shall he not be able to find it" (Ecclesiastes 8:17); "things too wonderful for me, which I knew not" (Job 42:3); "Trust in the LORD with all thine heart; and lean not unto thine own understanding." (Proverbs 3:5); "Be not wise in thine own eyes: fear the LORD, and depart from evil." (Proverbs 3:7); "But the LORD is in his holy temple: let all the earth keep silence before him." (Habakkuk 2:20).',
      scripture: 'Hebrews 11:3; Colossians 1:16-17; Acts 17:24-28; Proverbs 8:29; Job 38:4; Job 38:11; Genesis 2:7; Psalms 139:13-16; Psalms 139:6; Psalms 100:3; Isaiah 45:9; Psalms 115:4-8; Job 32:8; 1 Corinthians 2:11; Job 12:10; Zechariah 12:1; Habakkuk 2:18-20; Psalms 147:4-5; Job 38:37; Job 26:8; Genesis 1:2; 2 Peter 3:5; Isaiah 43:16; Isaiah 43:19; 1 Corinthians 10:13; John 7:38; Proverbs 16:33; Ecclesiastes 9:11; Proverbs 16:9; Proverbs 20:24; Jeremiah 10:23; 1 Kings 22:17; 1 Kings 22:23; 1 Kings 22:34; 1 Corinthians 12:24-25; Ephesians 4:16; Proverbs 25:2; 1 Corinthians 8:2; Proverbs 18:17; 1 Thessalonians 5:21; Mark 7:13; Psalms 94:9; Isaiah 46:10; Jeremiah 1:5; Isaiah 55:9; 1 Timothy 6:20; Romans 1:20-22; 1 Corinthians 1:19-20; 1 Corinthians 3:19-20; Psalms 14:1; Colossians 2:8; Ezekiel 18:20; Deuteronomy 30:19; Deuteronomy 29:29; Job 11:7; Ecclesiastes 3:11; Ecclesiastes 8:17; Job 42:3; Proverbs 3:5-7; Ecclesiastes 12:14; Revelation 20:12; Galatians 6:7',
    },
    threeD: 'Practically: when a science headline lands in your feed, lead with the Word and then sort the rest. Say the proven parts with no hedge — the genome really was sequenced and that was a scientific success; polygenic risk scores really do predict poorly for an individual (Hingorani and colleagues, BMJ Medicine, 2023, 926 scores across 310 diseases, about 11% of cases detected at a 5% false-positive rate); water really has been known to move at random since 1827; a cell really is not computable molecule by molecule; today’s language systems really have no senses. Then label the rest honestly: "neo-Darwinism is dead" is one eminent man’s verdict in an argument mainstream biology has not conceded, and a reader must not leave you thinking it has; the improbability calculation is an illustration with a real objection against it — selection is not a pure random search — so never lean on it; human transgenerational epigenetic inheritance is unsettled. Read the gene-centric view at its strongest before you answer it (Proverbs 18:17), and say out loud what it genuinely explained. Then refuse both over-reaches in the same breath: you are not a readout of your genes, and this science is not a proof of Yahweh. In your own house: teach your children Genesis 2:7 and Psalms 139:14 before they meet a slogan about DNA, so they already know they are formed AND breathed into. Let the word "random" stop frightening you — read Proverbs 16:33 and the arrow drawn at a venture, and rest. And when you build with tools that talk, keep Psalms 115:8 in front of you: the maker becomes like what he trusts, so use the tool and trust Yahweh.',
    accountability: {
      statement: 'THE TWO COURTS. Man’s court is the peer-reviewed literature, and it has not ruled: the extended-synthesis argument is live, "neo-Darwinism is dead" is one eminent man’s verdict inside it, and this lesson cites what is published and invents nothing about what will be concluded. No motive is adjudicated for anyone. But the Word never lets accountability shrink to a bibliography. Every claim taught as knowledge — in a journal, a lecture hall, a pulpit, or an app like this one — enters the eternal court: "For God shall bring every work into judgment, with every secret thing, whether it be good, or whether it be evil." (Ecclesiastes 12:14); "the books were opened" (Revelation 20:12); "God is not mocked" (Galatians 6:7). WHAT A TEACHER OF ANY KIND OWES: to say what is measured as measured and what is contested as contested, because a worldview asserted with the authority of measurement is "oppositions of science falsely so called" (1 Timothy 6:20) whoever asserts it — and the same rule binds a preacher who over-claims a verse. WHAT WE OWE, and it is the harder half: to hold nothing merely because we have always held it — "Making the word of God of none effect through your tradition" (Mark 7:13) — to prove all things and hold what is good (1 Thessalonians 5:21), to hear a view we dislike at its strongest (Proverbs 18:17), and to refuse to recruit a live scientific dispute as proof of Yahweh when "Through faith we understand" (Hebrews 11:3) already named the instrument. WHAT THE WORD SAYS IS ALREADY SETTLED about knowing Him and refusing the Honor is a verdict, not an argument we deploy: "so that they are without excuse:" (Romans 1:20). And the lived cost during this life is not deferred evidence — a young believer told he is nothing but a sequence, a sick person promised a prediction that never came, a student taught to sneer at the bench: those are seen and weighed now.',
      scripture: 'Ecclesiastes 12:14; Revelation 20:12; Galatians 6:7; 1 Timothy 6:20; Mark 7:13; 1 Thessalonians 5:21; Proverbs 18:17; Hebrews 11:3; Romans 1:20-22; Proverbs 25:2',
    },
    benefits: [
      'Both courts, honestly held: man’s court here is the literature and it has NOT ruled — the extended-synthesis argument is live and we cite only what is published — while the ETERNAL court holds every claim ever taught as knowledge, from a journal or a pulpit or an app, and lands after this life (Ecclesiastes 12:14; Revelation 20:12). You can speak the documented plainly without inventing a verdict science never gave.',
      'Freedom from two lies at once: the determinist lie ("you are your genes, so purpose is illusion") and the triumphalist lie ("biology has now proved Yahweh") — the Word refuses both, and the second would be the weaker faith, resting His Honor on a dispute that could turn next year.',
      'The Word’s own account of the worlds in your hands, prior to every headline: framed by His word (Hebrews 11:3), held together by the Son (Colossians 1:17), the man formed of dust and then breathed into (Genesis 2:7), the sea under a decree (Proverbs 8:29) — so no slogan about DNA can tell your child what he is.',
      'The end of flinching at the word "random": chance and providence are not competitors — "The lot is cast into the lap; but the whole disposing thereof is of the LORD." (Proverbs 16:33), and an arrow drawn at a venture landed exactly as spoken (1 Kings 22:34). Stochasticity in a cell is no threat to His rule.',
      'A repeatable habit for science news: lead with the Word, state the measured as measured, name the contested in one clause, read the other side at its strongest, refuse both over-reaches, and notice the gap between the headline and the question underneath it.',
      'Psalms 115:8 as a working discipline for a house that builds with machines: the maker becomes like what he trusts, so use the tool and never trust it as the source — the warning lands on us first, not on someone else.',
      'A church willing to be corrected: if we can admire a scientist for testifying against his own life’s work, we can ask what we hold because He said it and what we hold only because we have always held it (Mark 7:13; 1 Thessalonians 5:21).',
    ],
    graceNote: 'No condemnation of any soul in this story: this lesson pronounces no verdict on Denis Noble, Richard Dawkins, Eric Metaxas, Francis Collins, or any scientist who has held or taught a gene-centred account — their hearts are Yahweh’s to judge, and He is no respecter of persons in either direction. "Anti-Yahweh" in this lesson names a CLAIM — you are your genes, purpose is illusion, there is no author — and never a person; hold that in every sentence you say about this. Richard Dawkins in particular is owed a fair hearing here and no mockery: the gene’s-eye account explained a great deal that had defeated earlier theories, serious people hold it today, and Stage 3 states it in its own best words on purpose. Denis Noble is owed honour for the rarest thing in the story — a man testifying against the premise of his own celebrated work — and Francis Collins made a public prediction in good faith that parts of medicine did fulfil. Leaving every soul to Yahweh never mutes the claim: a worldview asserted with the authority of measurement and never measured is named plainly, and the true science underneath it is honoured just as plainly. Truth and grace meet in Jesus, the Eternal Son of Yahweh, by whom all things consist (Colossians 1:17).',
    stewardship: 'The deeper response is to BUILD what the Word builds. Teach the making before the mechanism: a child who knows "And the LORD God formed man of the dust of the ground, and breathed into his nostrils the breath of life" (Genesis 2:7) and "I am fearfully and wonderfully made" (Psalms 139:14) has an identity a slogan cannot dent, and he can then learn genetics with delight instead of dread. Honour the bench: encourage the young people in your house toward real science, real medicine, real measurement — "the honour of kings is to search out a matter" (Proverbs 25:2) — because a church that sneers at the laboratory has surrendered a field Yahweh gave it. Practise correction in public: name one thing your household or your congregation held that the Word does not require, and put it down (Mark 7:13). Keep one weight for claims: say the measured as measured and the contested as contested, in your teaching and in your arguments, and never recruit a live dispute as proof of Yahweh. And carry Psalms 115:8 into every tool you build or use on this platform: a teaching machine can carry His words and has no breath in it, so it serves the reader and is never trusted as the source. This platform’s own Learn tab is the test case — every verse gated verbatim against the Word, every claim sourced and dated, every limit stated, on machines the community owns.',
    anchor: {
      ref: 'Hebrews 11:3; Genesis 2:7',
      theme: 'He said it first, and the science is arriving late — "Through faith we understand that the worlds were framed by the word of God" — and the making of a man was always two acts, only one of them material: "And the LORD God formed man of the dust of the ground, and breathed into his nostrils the breath of life; and man became a living soul." Read the dust as long as you like; the breath is not in the sequence.',
    },
  },

  // ---- STAGE 5 — REFLECTION + SKILL ----
  reflection: {
    skill: 'When a science story lands claiming a field got something big wrong: PAUSE, and lead with the Word rather than with the scientist. Then sort. What is MEASURED (a sequenced genome, a published predictive-power number with its authors and journal, a dated observation, an architecture that plainly has no senses)? What is CONTESTED, in one clause, named precisely (a verdict on a whole framework that the field has not conceded)? What is an ILLUSTRATION carrying a known objection (an improbability calculation that assumes pure randomness when selection is not a random search)? Read the view being criticised at its strongest and say what it genuinely explained. Then refuse both over-reaches in the same breath: a person is not a readout of a sequence, and a live scientific dispute is not a proof of Yahweh. Finally, notice the gap between the headline and the question underneath it — and ask what you hold only because you have always held it.',
    practice: 'Take this conversation. Write five lines: (1) one sentence of what the WORD says about the worlds, with a reference, before you mention any scientist; (2) one sentence of what is DOCUMENTED, with a source, its authors and its date; (3) one sentence naming what is CONTESTED, narrowly, in a way a reader could not mistake for a concession by mainstream biology; (4) one sentence giving the gene-centric view its strongest case, in its own best words; (5) one sentence refusing BOTH over-reaches. Then do one thing: name one belief in your own house you hold by habit rather than by the Word, and test it this week (1 Thessalonians 5:21).',
    prompts: [
      'Which parts of this story are measured (the sequenced genome, the polygenic-score paper, Brownian motion in 1827, machines without senses) and which are verdicts inside a live argument ("neo-Darwinism is dead")? How would you check each one, and where would you look?',
      'Read Psalms 115:4-8 beside the claim that a silicon system can talk but cannot see, feel, hear or touch. Verse 8 turns it on the makers. What does that verse require of a house that builds teaching tools — and how is gene-determinism the same reduction coming from the opposite direction?',
      'No computer can track every water molecule in one bacterium, and "Great is our Lord, and of great power: his understanding is infinite." (Psalms 147:5). Say precisely what that sentence claims and what it does not claim. Why does the careful version survive a faster computer?',
      'Walk the arrow drawn at a venture (1 Kings 22:34) beside "The lot is cast into the lap; but the whole disposing thereof is of the LORD." (Proverbs 16:33). Where have you treated randomness as a threat to His rule — and what changes if chance and providence were never competitors?',
      'The Human Genome Project achieved its goal and exposed the limits of a model. Why is that sentence stronger than "the genome project failed" — and what does the difference teach you about how you repeat any story you like the sound of?',
      'Denis Noble says the premise of his own celebrated work was wrong. Read Proverbs 18:17 and 1 Thessalonians 5:21, then read Mark 7:13. What is your household holding because it is His, and what are you holding because it is yours?',
      'Use "oppositions of science falsely so called" (1 Timothy 6:20) precisely: what exactly is science falsely so called here, and what is honest work that the Word actually blesses (Proverbs 25:2)? Practise saying it so a scientist could hear it without being insulted.',
      'Deuteronomy 29:29 has two halves. What happens to a lesson — or a church — that ends on the secret things and never reaches "those things which are revealed belong unto us and to our children for ever"?',
    ],
  },

  // ---- Age-appropriate renderings (kids use the app) ----
  levels: {
    child: 'Scientists study how living things work. For a long time many of them taught something like this: you are just your genes, like a tiny set of directions inside you that decides everything. Now some very well-known scientists say that was far too simple. One of them studies hearts. He even says he believed the simple idea when he was young, and that he was wrong. Saying that out loud is a brave thing to do. Here is the wonderful part. Yahweh told us first. Long before anyone had a microscope, He said, "Through faith we understand that the worlds were framed by the word of God" (Hebrews 11:3). And when He made the first man, He did two things, not one: "And the LORD God formed man of the dust of the ground, and breathed into his nostrils the breath of life; and man became a living soul." (Genesis 2:7). First the dust. Then His breath. You can study the dust for a hundred years. You will never find the breath on a list of parts. The Word says about you, "I am fearfully and wonderfully made" (Psalms 139:14). So you are not an accident. And you are not a machine. You were made on purpose by Someone who knows you. Here is one more thing. Computers can talk now. But a computer cannot see a sunset. It cannot feel a hug. Long ago the Word said the same thing about statues that people made with their hands: "They have mouths, but they speak not: eyes have they, but they see not:" (Psalms 115:5). Only Yahweh gives real life and real breath. And some things about life are still a puzzle. That is fine. The Word says, "The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever" (Deuteronomy 29:29). We get to learn the parts He shows us. We trust Him with the rest. We never make fun of scientists. Many of them work hard and find true things that help people. We just remember Who made it all, first.',
    teen: 'A viral video says biology has been misled for 80 years — that the "selfish gene" picture of life, where DNA is the sole commander and you are basically a readout of your sequence, is falling apart. The man saying it is not a preacher; he is Denis Noble, an Oxford physiologist who built the first computer model of the heartbeat and who says the premise of his own famous work was wrong. Run the moves before you repeat any of it. (0) Lead with the Word, not with him. Yahweh already told us how the worlds are: "Through faith we understand that the worlds were framed by the word of God" (Hebrews 11:3); "he is before all things, and by him all things consist" (Colossians 1:17); and the making of a man was two acts, only one of them material — "And the LORD God formed man of the dust of the ground, and breathed into his nostrils the breath of life; and man became a living soul." (Genesis 2:7). Dust, then breath. Read the dust forever; the breath is not in the sequence. That is why the arrow in this lesson runs one way: He said it first and the scientists are arriving late. (1) Sort the measured from the contested. Measured: the Human Genome Project sequenced three billion base pairs and that was a real success; a 2023 UCL study in BMJ Medicine looked at 926 polygenic risk scores across 310 diseases and found a typical score catches only about 11% of the people who get the disease; water has been known to move at random since Robert Brown in 1827; no computer can track every molecule in one cell; today’s chat systems have no senses at all. Contested — and say this out loud so nobody misunderstands you: "neo-Darwinism is dead" is Noble’s verdict in a live argument, and most working biologists do NOT agree. Mainstream biology has not conceded. And the "finite monkeys" calculation? Do not use it. The objection is real: selection is not a pure random search, so a calculation that assumes pure randomness is not describing the theory it attacks. You do not need it. (2) Here is the part worth the whole lesson. Noble says silicon can talk but has no consciousness — it cannot see, feel, hear or touch. Now read the list Yahweh made three thousand years earlier about the best thing human hands could build: "They have mouths, but they speak not: eyes have they, but they see not:" (Psalms 115:5) — "They have ears, but they hear not: noses have they, but they smell not:" (Psalms 115:6). Same senses, same order. And then verse 8 turns it on the people who built it: "They that make them are like unto them; so is every one that trusteth in them." (Psalms 115:8). The danger was never that the machine becomes a soul. It is that the maker shrinks to the size of what he made — which is exactly what "you are just your genes" did to human beings from the other direction. Both errors turn a living soul into a mechanism. (3) Stop flinching at "random." Chance and providence are not rivals. "The lot is cast into the lap; but the whole disposing thereof is of the LORD." (Proverbs 16:33) — and the clearest case is an arrow nobody aimed: "And a certain man drew a bow at a venture, and smote the king of Israel between the joints of the harness" (1 Kings 22:34), exactly as the prophet had said. Randomness names what WE cannot see; providence names what He governs. (4) Refuse both over-reaches. You are not a readout of your genes: "I have set before you life and death, blessing and cursing: therefore choose life" (Deuteronomy 30:19) is spoken to a chooser. AND biology has not proved Yahweh — do not say that, even though it would feel good. A faith propped on a live scientific dispute falls the day the dispute turns. Hebrews 11:3 says "Through faith we understand," and faith is not a journal. (5) Honour the bench. Use "oppositions of science falsely so called" (1 Timothy 6:20) precisely: it means the worldview claim wearing the lab coat, not the microscope and not the honest researcher. "It is the glory of God to conceal a thing: but the honour of kings is to search out a matter." (Proverbs 25:2) — searching is honourable. And notice the last thing: the video’s title sells ("misled for 80 years") while its own thumbnail asks the better question ("Has Science Forgotten Its Limits?"). Learn to read the question under the headline. Then ask it about yourself: what do you believe because He said it, and what do you believe because you have always believed it?',
    senior: 'For the seasoned believer, this lesson is about holding a charged science story with the Word in front of it rather than behind it. First, the frame, because it is prior to everything else in the story: the worlds were framed by His word and are not made of what appears (Hebrews 11:3); all things were created by the Son and "by him all things consist" (Colossians 1:17); "For in him we live, and move, and have our being" (Acts 17:28); the sea was given a decree it cannot pass (Proverbs 8:29; Job 38:11); and the making of a man was two acts of which only one is material — "And the LORD God formed man of the dust of the ground, and breathed into his nostrils the breath of life; and man became a living soul." (Genesis 2:7), with the builder’s own record kept: "curiously wrought" (Psalms 139:15), "Thine eyes did see my substance, yet being unperfect; and in thy book all my members were written" (Psalms 139:16). That account predates every instrument, and it does not gain truth when a biologist moves toward it. Second, the documented record, stated plainly, because under-claiming a verified truth fails as badly as over-claiming an unproven one: the Human Genome Project (1990-2003) sequenced roughly three billion base pairs and was a scientific success; Francis Collins told Congress in 2003 that predictive genetic testing and gene-based designer drugs would follow within ten to seventeen years; the broad population-prediction promise has not materialised, and the 2023 UCL analysis published in BMJ Medicine (Hingorani, Gratton, Finan and colleagues) examined 926 polygenic risk scores across 310 diseases and found a typical score detects about 11% of those who develop a common disease at a 5% false-positive rate; random molecular motion has been observed since Robert Brown in 1827; molecule-by-molecule computation of a living cell is intractable; and current language systems, whatever their fluency, have no sensory experience. Third, the categories kept honestly (Proverbs 18:17; 1 Thessalonians 5:21): "neo-Darwinism is dead" is Denis Noble’s verdict inside a live and unresolved dispute — the extended-synthesis argument — which mainstream evolutionary biology has NOT conceded, and a reader who leaves us believing otherwise has been misinformed by us; transgenerational epigenetic inheritance in humans is unsettled; the improbability calculation is an illustration against which the standard objection is decisive, since selection is not a pure random search; and the video’s own title is the publisher’s claim while its thumbnail asks the gentler and better question about the limits of science. What is collapsing, precisely, is not the gene-centric research programme, which produced immense real knowledge, but the philosophical claim that rode in on it — that you ARE your genes, that purpose is illusion, that life is a blind algorithm with no author. That was a worldview assertion wearing a lab coat, and it is now contradicted by eminent mainstream biologists rather than by apologists. "oppositions of science falsely so called" (1 Timothy 6:20) names that layer exactly, and aimed there it leaves the microscope and the technician untouched; "It is the glory of God to conceal a thing: but the honour of kings is to search out a matter." (Proverbs 25:2) keeps the searching honourable. Fourth — where the Word settles what the dispute cannot — the resonances are worth naming and worth not over-driving. Consciousness: the senses a made thing lacks were inventoried three thousand years ago in the same order (Psalms 115:4-7), and verse 8 turns the warning on the makers, "They that make them are like unto them; so is every one that trusteth in them." — the reduction of a soul to a mechanism runs in both directions, from the chip and from the chromosome. What a man has, no parts list holds: "But there is a spirit in man: and the inspiration of the Almighty giveth them understanding." (Job 32:8); "In whose hand is the soul of every living thing, and the breath of all mankind." (Job 12:10). Water: what is uncomputable to us is not unknown to Him — "He telleth the number of the stars; he calleth them all by their names." (Psalms 147:4), "his understanding is infinite" (Psalms 147:5), "Who can number the clouds in wisdom?" (Job 38:37) — and the waters were there at the making, a thing of which men "willingly are ignorant" (2 Peter 3:5). Chance: "The lot is cast into the lap; but the whole disposing thereof is of the LORD." (Proverbs 16:33), and an arrow drawn at a venture struck exactly as spoken (1 Kings 22:34) — so stochasticity in a cell threatens nothing, and a believer who flinches at "random" has accepted the atheist’s premise that chance competes with providence. Fail-safe design: Paul reasoned from redundancy and mutual supply as doctrine long before it was measured (1 Corinthians 12:24-25; Ephesians 4:16). Fifth, the discipline that keeps this from curdling into gloating: a man testified against the premise of his own celebrated work, which the Word makes the thing to honour — and therefore the same blade must turn on us, since a model held eighty years past its evidence is a failure the church commits too, "Making the word of God of none effect through your tradition" (Mark 7:13). And the final restraint, which is also the strongest position available: do not say biology has proved Yahweh. It has not, and the claim would rest His Honor on an argument that could turn next year. "Through faith we understand" (Hebrews 11:3) names the instrument. Romans 1’s logic is a verdict — "so that they are without excuse:" (Romans 1:20) — not a proof offered for anyone’s approval. Then let the limit be the whole verse, both halves: "The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever, that we may do all the words of this law." (Deuteronomy 29:29) — mystery honoured, and the revealed things worked and taught, which is the only place this lesson is allowed to end.',
  },

  // ---- Discernment-skill quiz ----
  quiz: {
    questions: [
      {
        q: 'An eminent biologist says gene-determinism is collapsing. What is the Word-first move?',
        options: ['Announce that science has now proved Yahweh', 'Lead with what Yahweh already said about the worlds (Hebrews 11:3; Genesis 2:7) and treat the science as arriving late — never as the proof', 'Wait for the scientists to settle it before saying anything'],
        answer: 1,
        explain: 'The arrow runs one way. "Through faith we understand that the worlds were framed by the word of God" (Hebrews 11:3) names the instrument, and it is not a journal. A faith propped on a live dispute falls the day the dispute turns.',
      },
      {
        q: '"Neo-Darwinism is dead." How must this lesson carry that sentence?',
        options: ['As a documented finding — an Oxford professor said it', 'As one eminent man’s OPINION inside a live dispute that mainstream biology has not conceded — named as contested, narrowly', 'As a lie, since most biologists disagree'],
        answer: 1,
        explain: 'The genuinely-open tier, used narrowly: the mechanisms he describes are documented; the verdict on the framework is contested. A reader must not leave thinking the field has conceded — it has not.',
      },
      {
        q: 'The Human Genome Project. Which sentence is the true one?',
        options: ['It failed', 'It achieved its primary goal — three billion base pairs, a monumental success — and the data it produced exposed the limits of the reductionist model', 'It was irrelevant to medicine'],
        answer: 1,
        explain: 'Darrell’s own correction governs, and it is the accurate framing. Under-claiming a verified success is as much a failure of truth as over-claiming an unverified one. "The project failed" is a slogan; the longer sentence is the fact.',
      },
      {
        q: 'What is the right handling of the "finite monkeys" improbability calculation?',
        options: ['Use it — the numbers are overwhelming', 'Carry it as his illustration, state the standard objection in the same breath (selection is not a pure random search), and never present it as a proof', 'Ignore that he said it'],
        answer: 1,
        explain: 'A lesson that leans on a contested probability argument hands its critic the easiest win. "He that planted the ear, shall he not hear? he that formed the eye, shall he not see?" (Psalms 94:9) does the work without a calculator.',
      },
      {
        q: 'A silicon system can produce language but cannot see, feel, hear or touch. Which verse reads the situation, and where does it land?',
        options: ['Psalms 115:4-7 lists exactly those senses of a made thing — and verse 8 turns it on the MAKERS: "They that make them are like unto them; so is every one that trusteth in them."', 'It proves a machine can never think', 'The Word says nothing about made things'],
        answer: 0,
        explain: 'The danger was never that the machine becomes a soul; it is that the maker shrinks to the size of what he made — the same reduction gene-determinism performed from the other direction. Both turn a living soul into a mechanism.',
      },
      {
        q: 'No computer can compute every molecule in one cell. What does the Word add — precisely?',
        options: ['That science is useless', 'That what is uncomputable to US is not unknown to HIM — "his understanding is infinite" (Psalms 147:5) — a claim no faster computer can overturn', 'That the universe is random and unruled'],
        answer: 1,
        explain: 'Say the careful version and it survives every advance: intractable-for-us is a fact about our methods. "He telleth the number of the stars; he calleth them all by their names." (Psalms 147:4) is about Him.',
      },
      {
        q: 'A believer hears that cells depend on randomness and feels his faith wobble. What does the Word say?',
        options: ['Randomness disproves providence', 'Chance and providence were never competitors — "The lot is cast into the lap; but the whole disposing thereof is of the LORD." (Proverbs 16:33), and an arrow drawn at a venture struck exactly as spoken (1 Kings 22:34)', 'Believers should not read science'],
        answer: 1,
        explain: 'Flinching at the word "random" concedes the atheist’s premise. Randomness names our ignorance of a cause; providence names His government of the whole. The Word uses the language of chance freely and then tells you who disposes it.',
      },
      {
        q: 'How is "oppositions of science falsely so called" (1 Timothy 6:20) used correctly here?',
        options: ['Against science generally', 'Against the WORLDVIEW claim wearing a lab coat — you are your genes, purpose is illusion, there is no author — while the microscope and the honest worker are honoured (Proverbs 25:2)', 'Against anyone who studies biology'],
        answer: 1,
        explain: 'Precision is what keeps this lesson from despising real science. Aimed at the unmeasured philosophical claim it is exact; aimed anywhere else it becomes the sneer we are not permitted.',
      },
      {
        q: 'Denis Noble says the premise of his own celebrated work was wrong. What does this house do with that, and what does it then require of us?',
        options: ['Use it as ammunition against scientists', 'Honour it (Proverbs 18:17; 1 Thessalonians 5:21) — and turn the same blade on ourselves, since a model held past its evidence is a failure the church commits too (Mark 7:13)', 'Doubt his motives'],
        answer: 1,
        explain: 'If we can praise a biologist for self-correction and cannot ask the reader to do the same, the lesson has failed and the thesis curdles into gloating. Ask what you hold because He said it, and what you hold because you have always held it.',
      },
      {
        q: 'Deuteronomy 29:29 is the closing verse. Why must BOTH halves be quoted?',
        options: ['Because long quotations are better', 'Because ending on mystery alone is half the verse: the secret things are His, AND "those things which are revealed belong unto us and to our children for ever" — the revealed part is ours to work and to teach', 'Because the second half cancels the first'],
        answer: 1,
        explain: 'Scientific humility is where the conversation ends; the Word goes one step further and hands us an assignment. Mystery honoured, and the revealed things worked — that is the whole verse and the whole posture.',
      },
    ],
  },
};

export const WORLD_ISSUES = [MUSK_ISSUE, BEAUTY_SUPPLY_ISSUE, GAME_CHANGERS_ISSUE, PROPHETIC_LENS_ISSUE, MEDICAL_ESTABLISHMENT_ISSUE, AI_EMPIRE_ISSUE, PRISON_INDUSTRIAL_ISSUE, HISTORICAL_TRAUMA_ISSUE, LAW_OF_ASSUMPTION_ISSUE, VICTORIOUS_EMOTIONS_ISSUE, TUITION_1965_ISSUE, EPA_POWER_PLANT_ISSUE, SCOTUS_MAIL_IN_ISSUE, KENNEDY_CENTER_ISSUE, EVANSTON_REPARATIONS_ISSUE, TRADES_HIRING_ISSUE, NOBLE_BIOLOGY_ISSUE];

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
