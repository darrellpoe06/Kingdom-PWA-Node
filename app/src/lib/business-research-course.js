// =============================================================================
// business-research-course — "Business Research, Level 1: Business Wars as
// the Case"
// =============================================================================
// Darrell, 2026-09-23: "we need to use the podcast business wars as context
// for our business courses... Word first research 1 institution level". The
// Business department's second course. The first (rent-to-own-business) taught
// one business from the inside; this one teaches the CRAFT of finding out what
// a business actually did — eight Level-1 competencies of business research —
// with one living case as the doorway: Business Wars, the Wondery podcast
// hosted by David Brown, former anchor of Marketplace, which retells the
// rivalries (Netflix and Blockbuster, Microsoft and the browser makers, Boeing
// and Airbus, Disney and Marvel) as drama. The podcast is the DOORWAY. The
// record — the filing, the court's findings, the dispute panel, the press
// release — is the FLOOR. This course teaches a family to walk from the one
// to the other and to write down what it found.
//
// WORD FIRST (DR-0127 / DR-0282). Every competency is a command before it is
// a skill. The Word tells the researcher to count the cost before building,
// to hear a matter before answering it, to establish every word at the mouth
// of two or three witnesses, to look well to his going instead of believing
// every word, to keep a just weight, to regard reproof, to know what is
// settled, and to write it plain upon tables so the reader may run. Each
// verse was pulled verbatim from the repo's own KJV (app/public/bible/kjv)
// before a line of lesson was written and is re-pinned by
// business-research-course.test.js.
//
// THE ARC — eight competencies, one case:
//   1. Count the cost — a business claim is a claim until the numbers answer
//      (Luke 14:28-30; Proverbs 24:27; Proverbs 21:5)
//   2. Go to the filing — the record before the retelling
//      (Proverbs 18:13; Luke 1:3-4; Proverbs 25:2)
//   3. Two or three witnesses — corroborate before you repeat
//      (Deuteronomy 19:15; 2 Corinthians 13:1; Proverbs 18:17)
//   4. A dramatization is not a record — sort the reenactment from the document
//      (Proverbs 14:15; John 7:24; Proverbs 19:2)
//   5. Just weights — read a rivalry by its conduct and its numbers, not its side
//      (Proverbs 11:1; Leviticus 19:35-36; Proverbs 16:11; Micah 6:11)
//   6. The correction — a record that changes toward the truth
//      (Proverbs 28:13; Proverbs 15:31-32; Proverbs 12:19)
//   7. What the Word settles and what the record must supply
//      (James 5:4; Deuteronomy 25:13-16; Proverbs 22:16; Luke 16:10; Matthew 6:24)
//   8. Write it in order — the sourced case brief
//      (Habakkuk 2:2; Luke 1:3-4; Proverbs 22:20-21)
//   9. Follow the money to the oil — the eight applied to one commodity, every
//      industry, worldwide (Proverbs 21:20; Genesis 41:35-36; Deuteronomy 8:17-18)
//      Added 2026-09-24 (DR-0602) on the records the runner fetched in runs
//      35948713733 and 35949217702; OPEC's own page refused the runner (403).
//
// TEACH THE WORD, DO NOT DEBATE IT (DR-0098) and SPEAK ESTABLISHED FACT
// (DR-0100). Whether a false balance is wrong is not a research finding: the
// Word settled it. What research supplies is what a company actually did, on
// what date, on what record — and there the course states documented fact
// plainly: Netflix incorporated in Delaware in August 1997 and public in May
// 2002 (its own annual report); Blockbuster in chapter 11 on September 23,
// 2010 (its own exhibit filed that day); the Microsoft findings of fact on
// November 5, 1999, the appeals opinion of June 28, 2001, the final judgment
// of November 12, 2002, the second appeals opinion of June 30, 2004 and the
// modified final judgment of September 7, 2006 (the Antitrust Division's own
// case page); the WTO's two aircraft disputes (the Secretariat's summaries);
// Disney's agreement to acquire Marvel on August 31, 2009 (Disney's own
// release). Where a question is genuinely open — WHY a company chose as it
// did — the course says so narrowly and teaches how to weigh it by evidence,
// never "you decide."
//
// THEIR WORDS, FETCHED NOT REMEMBERED (DR-0580). Every voice below was probed
// on a GitHub runner against its named source before it was written in
// WITNESSES ADDED 2026-09-24 (DR-0600): a person who was there, in his own
// words, in every lesson — Hastings (2011), the Netflix letter (2011), Keyes
// (2010), Iger and Perlmutter (2009), Gates as the Court quoted his memo
// (1999), Boeing's own 10-K (2020); probed on a runner first (runs
// 35946339324, 35946488040, 35946756879).
// (history-voices-witness runs 35933697006, 35933806953, 35933917730,
// 35934034007, 35934089153, 35934134357 and 35934157081, 2026-09-23): the
// Wondery show page (served through Audible), the Antitrust Division's
// findings-of-fact and case pages, the WTO dispute summaries DS316 and DS353,
// Disney's press release, Netflix's 10-K for 2011 and Blockbuster's 8-K
// exhibit of September 23, 2010. Pages that answered 404 (the Coca-Cola
// history page, an old Netflix press link) were NOT used. The same file is
// probed again by the witness workflow whenever it changes.
//
// THE SAME GATES AS THE HISTORY COURSES: every quoted span verbatim against
// the KJV; two bands per lesson at their ceilings and floors; two verified
// voices per lesson on a listed record host; a dated timeline that carries
// every year the lesson names and names every year it carries.
// =============================================================================
import { buildScheduleFor, progressSummaryFor } from './church-classes.js';
import { historyVoiceFaults, historyTimelineFaults, historyWorkedCaseFaults } from './history-course.js';

export const BUSINESS_RESEARCH_CARE_NOTE =
  'Teaching, not a substitute for the record. This course teaches the eight Level-1 competencies of business research on a set of cases the Business Wars podcast tells as drama, and states the documented facts it names, with their dates and their record. It is not a history of any company and it is not investment advice. Every quoted verse is the KJV verbatim; every quoted voice was fetched from its named source before it was written in. Where the record is silent on a motive, the course says so.';

export const BUSINESS_RESEARCH_META = {
  key: 'business-research-wars',
  title: 'Business Research, Level 1: Business Wars as the Case',
  audience: 'students, teachers, parents, and anyone who has heard a business story told as a war and wants to know how to find out what the companies actually did — taught at every age',
  tagline: 'Count the cost. Eight competencies of business research, worked on the rivalries a podcast tells as drama, then all eight followed to the money tied to oil, under the Word.',
  // WORD-FIRST, DECLARED (DR-0127 / DR-0282). Both spans VERBATIM from the
  // repo's KJV and pinned in the course test.
  wordFirst: {
    ref: 'Luke 14:28; Deuteronomy 19:15',
    frame: 'Yahweh gave the researcher the method before any business school did: "For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?" (Luke 14:28), and "at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established" (Deuteronomy 19:15). Count first; establish by witnesses; then speak.',
  },
  format: 'Self-paced · 9 lessons · one competency a week or all in a weekend · paced to your age',
  cadenceDays: 7,
  weeks: 9,
  handsOnLabel: 'Work it on the case',
  unit: {
    noun: 'lesson',
    nounPlural: 'lessons',
    cap: 'Lesson',
    selfPaced: true,
    sessionLabel: 'How to run it (family table, class, or one-on-one)',
    countNoun: 'lesson',
  },
  blurb: 'The second course of the Business department. Business Wars, the Wondery podcast hosted by David Brown, retells the rivalries that shaped what we buy — Netflix against Blockbuster, Microsoft against the browser makers, Boeing against Airbus, Disney buying Marvel — as drama, and it says so: the unauthorized, real story. This course takes the drama as its doorway and teaches the craft beneath it: count the cost before you believe a plan, go to the filing before the retelling, find the second witness, sort the reenactment from the document, keep a just weight, trace the correction, know what the Word has already settled, and write the case in order with its sources. The ninth lesson follows the money to the oil beneath every rivalry: the two shocks on the Federal Reserve’s own record, the nation’s figures from the Energy Information Administration, the Standard Oil opinion, and the reserve. Every verse verbatim; every voice fetched from its record.',
  care: BUSINESS_RESEARCH_CARE_NOTE,
  footer: '_Taught by Darrell Poe · the Poe family + The Church of the Living God · built on PoeTech. Course two of the Business department. Count the cost; establish every word at the mouth of two or three witnesses; write it plain upon tables._',
};

export const BUSINESS_RESEARCH_SESSION_FLOW = [
  { minutes: 5, name: 'Prayer + the anchor' },
  { minutes: 10, name: 'The competency in one sentence' },
  { minutes: 15, name: 'Teach it — what the Word actually says' },
  { minutes: 20, name: 'Work it on the case' },
  { minutes: 10, name: 'Discussion' },
  { minutes: 5, name: 'Send-off + solo task' },
];
export const BUSINESS_RESEARCH_SESSION_MINUTES =
  BUSINESS_RESEARCH_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0); // 65

// Verified sources (runs listed in the header). Each URL below answered HTTP
// 200 with the quoted words on the page.
const SRC = {
  wondery: { title: 'Wondery — Business Wars, the show page (served through Audible): the description and the first episode, February 6, 2018', url: 'https://wondery.com/shows/business-wars/' },
  findings: { title: 'U.S. Department of Justice, Antitrust Division — U.S. v. Microsoft: the Court’s Findings of Fact, November 5, 1999', url: 'https://www.justice.gov/atr/us-v-microsoft-courts-findings-fact' },
  casePage: { title: 'U.S. Department of Justice, Antitrust Division — U.S. v. Microsoft Corporation (browser and middleware): the case page and its dated documents', url: 'https://www.justice.gov/atr/case/us-v-microsoft-corporation-browser-and-middleware' },
  ds316: { title: 'World Trade Organization — dispute DS316, European Communities and certain member States: measures affecting trade in large civil aircraft (the Secretariat’s summary)', url: 'https://www.wto.org/english/tratop_e/dispu_e/cases_e/ds316_e.htm' },
  ds353: { title: 'World Trade Organization — dispute DS353, United States: measures affecting trade in large civil aircraft (second complaint) (the Secretariat’s summary)', url: 'https://www.wto.org/english/tratop_e/dispu_e/cases_e/ds353_e.htm' },
  disney: { title: 'The Walt Disney Company — press release, “Disney to Acquire Marvel Entertainment,” August 31, 2009', url: 'https://thewaltdisneycompany.com/disney-to-acquire-marvel-entertainment/' },
  netflix10k: { title: 'U.S. Securities and Exchange Commission, EDGAR — Netflix, Inc., annual report on Form 10-K for the year ended December 31, 2011, filed February 10, 2012', url: 'https://www.sec.gov/Archives/edgar/data/1065280/000119312512053009/d260328d10k.htm' },
  blockbuster8k: { title: 'U.S. Securities and Exchange Commission, EDGAR — Blockbuster Inc., exhibit 99.1 to the current report on Form 8-K filed September 23, 2010', url: 'https://www.sec.gov/Archives/edgar/data/1085734/000119312510215624/dex991.htm' },
  // WITNESSES — people who were there, in their own words (2026-09-24, DR-0600;
  // Darrell: "Any actual testimonies from witnesses?! For these lessons?!"
  // — "Fix them too!"). Probed on a runner before they were written in:
  // history-voices-witness runs 35946339324, 35946488040, 35946756879.
  hastings: { title: 'Reed Hastings, chief executive of Netflix — “An Explanation and Some Reflections,” the Netflix blog, September 18, 2011, as archived by the Wayback Machine (the live page is gone)', url: 'https://web.archive.org/web/2011/https://blog.netflix.com/2011/09/explanation-and-some-reflections.html' },
  netflixLetter: { title: 'U.S. Securities and Exchange Commission, EDGAR — Netflix, Inc., letter to shareholders of October 24, 2011, exhibit 99.1 to the current report on Form 8-K', url: 'https://www.sec.gov/Archives/edgar/data/1065280/000119312511278716/d246709dex991.htm' },
  blockbusterRelease: { title: 'U.S. Securities and Exchange Commission, EDGAR — Blockbuster Inc., press release of September 23, 2010 (the chapter 11 filing), exhibit 99.1 to the current report on Form 8-K filed September 24, 2010', url: 'https://www.sec.gov/Archives/edgar/data/1085734/000119312510215765/dex991.htm' },
  boeing10k: { title: 'U.S. Securities and Exchange Commission, EDGAR — The Boeing Company, annual report on Form 10-K for the year ended December 31, 2019, filed January 31, 2020', url: 'https://www.sec.gov/Archives/edgar/data/12927/000001292720000014/a201912dec3110k.htm' },  // THE OIL RECORDS (2026-09-24, DR-0602; Darrell: "Tie all the money tied to
  // oil and how that impacts the economy worldwide"). Probed on a runner first:
  // history-voices-witness runs 35948713733 and 35949217702. OPEC's own page
  // answered 403 and is NOT used; the Bureau of Economic Analysis page answered
  // with navigation only and is NOT used.
  fedOil1973: { title: 'Federal Reserve History — “Oil Shock of 1973-74,” by Michael Corbett: the embargo of October 19, 1973, the price from $2.90 to $11.65 a barrel, and Arthur Burns’s explanation of 1974', url: 'https://www.federalreservehistory.org/essays/oil-shock-of-1973-74' },
  fedOil1979: { title: 'Federal Reserve History — “Oil Shock of 1978-79,” by Laurel Graefe: Iranian output down 4.8 million barrels a day by January 1979 and the price more than doubled by April 1980', url: 'https://www.federalreservehistory.org/essays/oil-shock-of-1978-79' },
  fedGreatInflation: { title: 'Federal Reserve History — “The Great Inflation”: the two energy crises and the central bank’s own account of what it could and could not control', url: 'https://www.federalreservehistory.org/essays/great-inflation' },
  eiaUse: { title: 'U.S. Energy Information Administration — “Use of oil” (Oil and petroleum products explained): consumption by sector and by product, 2022, citing the Monthly Energy Review of July 2023', url: 'https://www.eia.gov/energyexplained/oil-and-petroleum-products/use-of-oil.php' },
  eiaTrade: { title: 'U.S. Energy Information Administration — “Oil imports and exports”: the net-exporter year of 2020, the 2022 figures, the 2005 peak and OPEC’s 1977 share', url: 'https://www.eia.gov/energyexplained/oil-and-petroleum-products/imports-and-exports.php' },
  eiaPrices: { title: 'U.S. Energy Information Administration — “Oil prices and outlook”: petroleum as about one third of world energy and OPEC’s share of reserves and production, 2021', url: 'https://www.eia.gov/energyexplained/oil-and-petroleum-products/prices-and-outlook.php' },
  eiaWhere: { title: 'U.S. Energy Information Administration — “Where our oil comes from”: the top producer since 2018, the five states and the five countries, 2022, citing the Petroleum Supply Annual of August 2023', url: 'https://www.eia.gov/energyexplained/oil-and-petroleum-products/where-our-oil-comes-from.php' },
  standardOil: { title: 'Legal Information Institute, Cornell Law School — Standard Oil Company of New Jersey et al. v. United States, 221 U.S. 1: the Supreme Court’s opinion, argued March 1910, reargued January 1911', url: 'https://www.law.cornell.edu/supremecourt/text/221/1' },
  spr: { title: 'U.S. Department of Energy, Office of Petroleum Reserves — “Strategic Petroleum Reserve”: 714 million barrels of authorized capacity and the four emergency releases', url: 'https://www.energy.gov/ceser/strategic-petroleum-reserve' },
};

export const BUSINESS_RESEARCH_MODULES = [
  // ---------------------------------------------------------------------------
  // 1. COUNT THE COST
  // ---------------------------------------------------------------------------
  {
    id: 'br1-count-the-cost',
    title: 'Count the cost: a business claim is a claim until the numbers answer it',
    bigIdea: 'The first competency of business research is the one Jesus gave to anyone who would build: "For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?" (Luke 14:28). A podcast, a pitch deck, a headline and a founder’s story all make claims. Before you agree or disagree, sort the claim by its kind — a fact claim, a frame claim, or a cause claim — and ask what record would answer it.',
    inApp: 'Write down three claims you have heard about Netflix and Blockbuster — from anyone, the podcast included. Beside each, write which kind it is: a fact claim (a company did a thing on a date), a frame claim (this is a war), or a cause claim (this is why one won). Then write, for each, the one record that would settle it. Save it in your Study.',
    anchor: { ref: 'Luke 14:28-30; Proverbs 24:27; Proverbs 21:5; Proverbs 14:15', theme: 'Jesus names the first move of anyone who builds: "sitteth not down first, and counteth the cost" (Luke 14:28), because the alternative is public: "all that behold it begin to mock him, Saying, This man began to build, and was not able to finish" (Luke 14:29-30). Solomon gives the order of work: "Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house" (Proverbs 24:27), and the temper of it: "The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want" (Proverbs 21:5). The researcher counts before he believes.' },
    stories: [
      {
        kind: 'parable', tone: 'light',
        title: 'The Episode on the Drive Home',
        body: 'Marcus listened to the first episode of Business Wars on the drive home and came in the door saying Blockbuster could have bought Netflix for nothing and laughed it out of the room. His daughter asked how he knew. He said the podcast said so. She asked whether the podcast said it was a fact or told it as a scene. He sat down at the table, opened his notebook, and wrote the sentence in the middle of the page. Above it he wrote FACT, FRAME or CAUSE and circled nothing yet. Then he wrote underneath: what record would show this? He did not know. That was the first honest thing said about it in the house, and it was the beginning of the research.',
      },
      {
        kind: 'parable', tone: 'sober',
        title: 'The Tower on Fifth Street',
        body: 'A man in the congregation borrowed against his house to open a second store because the first one had a good year. He had not counted the rent on the second lease against the slow months, and he had not read what his first store’s own numbers said about how much of that good year was one contract that would not repeat. The second store closed in fourteen months and the first one went with it. He told Darrell afterward that he had heard the verse about counting the cost a hundred times and had never once sat down and done it. He does it now, on paper, before he believes his own plan.',
      },
    ],
    benefits: [
      'You stop being carried by a good story. A claim sorted into its kind cannot stampede you, because you know what would prove it and you have not gone there yet.',
      'You can listen to a whole season of drama and come out with a list of questions instead of a list of opinions.',
      'You separate what a company did from how the story frames it and from why it happened, and you never again let a strong frame carry a weak fact.',
      'You practise the order the Word gives: count first, prepare the field first, build afterwards — "and afterwards build thine house" (Proverbs 24:27).',
      'You can hand a child the method in one sentence: is this a fact, a way of telling it, or a reason? Then: what record would show it?',
    ],
    levels: {
      teen: 'Here is the first skill. Count the cost before you believe a plan. Jesus said it plainly. "For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?" (Luke 14:28). That is a question with one right answer. You sit down first. You count.\n\nBusiness Wars is a podcast. It started in January 2018. David Brown hosts it. He used to anchor a business radio show. The show tells the story of companies that fought each other. Its first episode came out on February 6, 2018. It was about Netflix and Blockbuster. The show’s own page says it gives you the unauthorized, real story. Keep that word. Unauthorized means the companies did not write it. Real means the show wants you to trust it. You can enjoy it and still check it. That is the whole course.\n\nA claim comes in three kinds. A fact claim says a company did a thing on a date. Netflix says in its own annual report that it was incorporated in Delaware in August 1997. That is a fact claim, and a record answers it. A frame claim says this is a war. That is a way of telling it. Ask what it shows and what it hides. A cause claim says this is why one company won. That is the hardest kind. Only the record of what people did at the time can answer it.\n\nBlockbuster filed for chapter 11 on September 23, 2010. That is a fact. The company’s own filing that day says so. Why it happened is a cause claim. The podcast has a story about why. Sort the story before you repeat it.\n\nHere is your job. Write three claims about Netflix and Blockbuster. Mark each one fact, frame or cause. Then write the one record that would settle it. Do not decide yet. Counting comes first.',
      senior: 'Teach this lesson as a discipline of restraint, because that is what the first competency is. The reflex in the room will be to take a side on Netflix and Blockbuster before anyone has opened a filing, and the teacher’s task is to make the room sit down first. The anchor is a question Jesus asked about towers, and it has one answer: "sitteth not down first, and counteth the cost" (Luke 14:28). The consequence is public, "all that behold it begin to mock him" (Luke 14:29), which is why the counting must be done in private, on paper, before the plan is spoken.\n\nSet the case out plainly and by its own words. Business Wars is a Wondery podcast hosted by David Brown, formerly the anchor of Marketplace. Its show page describes it as the unauthorized, real story of what drives these companies and their leaders. The first episode, released February 6, 2018, opens the Netflix and Blockbuster series and says the story started around 1997 with Marc Randolph and Reed Hastings. Note what the page itself gives you: a date, a host, a claim of realism, and a claim of independence from the companies. Every one of those is a claim to be sorted, not a fact to be assumed.\n\nThen give the three kinds and make the class apply them to sentences the podcast uses. A fact claim is settled by a record: Netflix’s own annual report states that it was incorporated in Delaware in August 1997, and Blockbuster’s own exhibit filed September 23, 2010 speaks of its chapter 11 cases in the present tense. A frame claim is neither true nor false; it is a lens, and business is war is a lens that shows rivalry and hides cooperation, suppliers, customers, and the many months when nobody was fighting anyone. A cause claim — Blockbuster lost because it missed the internet — is the kind the room will want most and can prove least, because motive and cause live only in what the actors said and did at the time, which is why competency five and competency seven wait for it.\n\nThe temper the Word gives is Solomon’s: "The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want" (Proverbs 21:5). The order is his too: "Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house" (Proverbs 24:27). Close by setting the eight-week discipline: nobody in this room takes a position on a rivalry until the claim in front of them is sorted and its record named.',
    },
    lesson: 'Business research begins with a question Jesus asked, and the question is older than the discipline: "For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?" (Luke 14:28). He is speaking to anyone who would build anything, which means the first competency belongs to a mother at a kitchen table as much as to an analyst, and it comes with a warning about what happens when the counting is skipped: "Lest haply, after he hath laid the foundation, and is not able to finish it, all that behold it begin to mock him, Saying, This man began to build, and was not able to finish" (Luke 14:29-30). Solomon gives the same order in the language of a farm: "Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house" (Proverbs 24:27).\n\nThe case this course works is a podcast. In January 2018 Wondery introduced Business Wars, hosted by David Brown, formerly the anchor of Marketplace, and on February 6, 2018 its first episode opened an eight-part series on Netflix and Blockbuster. The show page states its own posture: the unauthorized, real story of what drives these companies and their leaders. Read that sentence as a researcher reads any sentence. It claims independence from the companies and it claims realism. Both are claims. The course is not against the podcast; it uses the podcast as the doorway it is, and teaches how to walk from a doorway to a floor.\n\nA claim comes in three kinds, and the first competency is to sort them before judging any of them. A fact claim says that a company did a thing on a date, and a record settles it: Netflix’s own annual report for 2011 states that the company was incorporated in Delaware in August 1997, and Blockbuster’s own exhibit filed on September 23, 2010 speaks of its chapter 11 cases as a present fact. A frame claim says this is a war; it is a lens, neither true nor false, and the researcher asks what it shows and what it hides. A cause claim says this is why one company won and the other filed; it is the kind a story loves most and the kind only the actors’ own words and deeds at the time can answer.\n\nThe researcher who sorts before judging has done what Solomon calls diligence: "The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want" (Proverbs 21:5). The one who repeats the episode on the drive home has done what the simple do: "The simple believeth every word: but the prudent man looketh well to his going" (Proverbs 14:15). Count first. Name the record. Then, and only then, decide.',
    voices: [
      { speaker: 'Wondery, the show page for Business Wars', year: 2018, where: 'The show’s own description, on its page as served through Audible, beside the first episode of February 6, 2018.', source: SRC.wondery, words: 'Business Wars gives you the unauthorized, real story of what drives these companies and their leaders, innovators, investors and executives to new heights - or to ruin.', why: 'The case states its own posture in one sentence, and every word of it is a claim the course teaches how to sort.' },
      { speaker: 'Netflix, Inc., in its annual report for 2011', year: 2012, where: 'Item 1 of the Form 10-K for the year ended December 31, 2011, filed with the Securities and Exchange Commission on February 10, 2012.', source: SRC.netflix10k, words: 'We were incorporated in Delaware in August 1997 and completed our initial public offering in May 2002.', why: 'A fact claim answered by the company’s own filing: the date the story says it started, on the record.' },
      { speaker: 'Reed Hastings, chief executive of Netflix', year: 2011, where: 'The same post, on why he moved the company as fast as he did.', source: SRC.hastings, words: 'Companies rarely die from moving too fast, and they frequently die from moving too slowly.', why: 'The cost he counted, stated by the one who counted it.' },
      { speaker: 'Jim Keyes, chairman and chief executive of Blockbuster', year: 2010, where: 'The company’s press release on the day it filed for chapter 11, September 23, 2010, filed with the Securities and Exchange Commission.', source: SRC.blockbusterRelease, words: 'After a careful and thorough analysis, we determined that the process announced today provides the optimal path for recapitalizing our balance sheet and positioning Blockbuster for the future as we continue to transform our business model to meet the evolving preferences of our customers.', why: 'The man at the head of the losing company, on the day, in his own words on the record.' },
    ],
    timeline: [
      { year: 1997, event: 'Netflix is incorporated in Delaware in August, by its own later account.', record: 'Netflix, Inc., Form 10-K for 2011, Item 1, “Other Information.”' },
      { year: 2002, event: 'Netflix completes its initial public offering in May, by its own later account.', record: 'Netflix, Inc., Form 10-K for 2011, Item 1, “Other Information.”' },
      { year: 2010, event: 'Blockbuster files its chapter 11 exhibit with the Securities and Exchange Commission on September 23.', record: 'Blockbuster Inc., Form 8-K filed September 23, 2010, exhibit 99.1.' },
      { year: 2011, event: 'The fiscal year Netflix’s annual report covers ends on December 31; the report itself is filed the next February.', record: 'Netflix, Inc., Form 10-K for the year ended December 31, 2011, cover page.' },
      { year: 2012, event: 'Netflix files its annual report for 2011 on February 10, stating its incorporation and its offering dates.', record: 'EDGAR accession 0001193125-12-053009.' },
      { year: 2018, event: 'Wondery introduces Business Wars on January 19; the first episode, on Netflix and Blockbuster, follows on February 6.', record: 'The Business Wars show page, episode list.' },
    ],
    workedCase: {
      claim: { words: "Companies rarely die from moving too fast, and they frequently die from moving too slowly.", by: "Reed Hastings, chief executive of Netflix, September 18, 2011", source: SRC.hastings },
      event: { year: 2011, what: "Netflix raises its prices and announces a split of its DVD service; two months of member anger later the chief executive apologises in public." },
      closedDoors: {
        hidden: "The decision to raise prices and split the service was made inside the company; members learned of it when it was announced, and the reasoning stayed inside until the apology.",
        light: "The chief executive published the reasoning himself, and the company’s signed letter to shareholders put the damage on the record with the Securities and Exchange Commission.",
        verse: "\"But he that doeth truth cometh to the light, that his deeds may be made manifest, that they are wrought in God\" (John 3:21).",
        heart: "\"He that loveth silver shall not be satisfied with silver; nor he that loveth abundance with increase: this is also vanity\" (Ecclesiastes 5:10).",
      },
      risk: "The letter names it: the company “greatly upset many domestic Netflix members” and, in doing so, hurt its reputation and stalled its domestic growth.",
      opportunity: "The same letter names the prize: to be one of the leaders of the internet’s transformation of video, with the best streaming subscription service on the planet.",
      constraint: "Streaming and DVD by mail had become, in the chief executive’s words, two quite different businesses with very different cost structures; one price could not carry both.",
      economics: [
        { figure: "$7.99", meaning: "The price of the unlimited streaming service the letter says the company dramatically improved while it upset its members on the DVD side.", record: "Netflix, Inc., letter to shareholders of October 24, 2011, exhibit 99.1 (EDGAR)" },
        { figure: "2×, more than doubled", meaning: "What the company did to its domestic spending on streaming content over the prior year: the cost it was counting when it moved fast.", record: "Netflix, Inc., letter to shareholders of October 24, 2011, exhibit 99.1 (EDGAR)" },
        { figure: "over 10 years", meaning: "How long the company had mailed DVDs when its chief executive wrote that it was hard to split the service; the sunk cost he chose to move past.", record: "Reed Hastings, the Netflix blog, September 18, 2011, as archived by the Wayback Machine" },
      ],
      steps: [
        "Quote the claim and mark it as a claim about cost: moving slowly is the more expensive error, in the words of the one who paid for moving fast.",
        "Open the filed letter and find the actual costs: members upset, reputation hurt, domestic growth stalled, in the company’s own signed words.",
        "Set the figures beside the claim — the $7.99 price, the doubled content spend, the ten years of DVDs — and count what the move risked against what it protected.",
        "State what the record settles: the company counted the cost of moving slowly higher than the cost of moving fast, and paid the second cost in public.",
      ],
      settled: "The company’s own filed letter records the price, the spending and the damage, and its chief executive’s own post records the reasoning; the cost was counted after the fact, in public.",
      stillOpen: "How many members left, and what the stalled growth cost in dollars, are figures the letter’s excerpt this course fetched does not carry; the full letter is the record still to read.",
    },
    quiz: {
      questions: [
        { q: '"Blockbuster lost because it missed the internet." What kind of claim is that?', options: ['A fact claim, settled by one filing', 'A cause claim about motive and reason, settled only by what the actors said and did at the time', 'A frame claim, neither true nor false'], answer: 1, explain: 'Why a company won or lost is a cause claim; a filing gives you the dates, not the reason.' },
        { q: 'What does Jesus say the builder does first?', options: ['Lays the foundation quickly', 'Sits down first and counts the cost', 'Asks the crowd what they think'], answer: 1, explain: '"sitteth not down first, and counteth the cost" (Luke 14:28) — counting comes before building, and before believing a plan that someone else has told you as a story.' },
      ],
    },
    facilitator: {
      talkingPoints: [
        'The method is a question before it is a skill: "sitteth not down first, and counteth the cost" (Luke 14:28) — asked of anyone who builds anything.',
        'Three kinds of claim: fact (a record settles it), frame (ask what it shows and hides), cause (only the actors’ own words and deeds at the time).',
        'The podcast states its own posture — unauthorized, real — and both words are claims to sort, not facts to assume.',
        'Set the discipline for eight weeks: nobody takes a side on a rivalry before the claim in front of them is sorted and its record named.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Luke 14:28-30 twice. | The competency in a sentence (10): sort the claim before you judge it. | Teach it (15): the three kinds, then Solomon’s order of work. | Work it (20): three claims each, sorted, with the record named. | Discussion (10): the prompts. | Send-off (5): count one plan of your own this week on paper.',
      discussionPrompts: [
        'Which of your three claims was hardest to sort, and why did it resist?',
        'What does the frame business is war show you, and what does it hide?',
        'When did you last believe a plan before counting it? What would the counting have shown?',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 2. GO TO THE FILING
  // ---------------------------------------------------------------------------
  {
    id: 'br2-go-to-the-filing',
    title: 'Go to the filing: the record before the retelling',
    bigIdea: 'Luke wrote the way a researcher should: "having had perfect understanding of all things from the very first, to write unto thee in order" (Luke 1:3), so the reader "mightest know the certainty of those things" (Luke 1:4). Solomon says the search is an honour: "It is the glory of God to conceal a thing: but the honour of kings is to search out a matter" (Proverbs 25:2). A public company writes its own record under oath every year; a bankrupt one writes it on the day. Go there before the retelling.',
    inApp: 'Open one filing: Netflix’s annual report for 2011 or Blockbuster’s exhibit of September 23, 2010 (the course names the address of each). Write down three things the company says about itself in its own words. Then write one thing the podcast says that the filing does not say. Save it in your Study.',
    anchor: { ref: 'Luke 1:1-4; Proverbs 18:13; Proverbs 25:2', theme: 'Luke names his method: "having had perfect understanding of all things from the very first, to write unto thee in order" (Luke 1:3), "That thou mightest know the certainty of those things, wherein thou hast been instructed" (Luke 1:4). Solomon warns the one who skips the record: "He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13). And he honours the search itself: "the honour of kings is to search out a matter" (Proverbs 25:2).' },
    stories: [
      {
        kind: 'parable', tone: 'light',
        title: 'The Form With the Long Name',
        body: 'Christina’s nephew wanted to write a school report on Netflix and had six articles open. She closed five of them and typed a long address into the sixth window, and a page came up that said Form 10-K at the top and looked like nothing anyone would read for fun. She told him to find the paragraph where the company says when it was born. He found it in four minutes: incorporated in Delaware in August 1997, public in May 2002, in the company’s own words. He said it was boring. She said boring is what the truth usually looks like before you know what to ask it.',
      },
      {
        kind: 'parable', tone: 'sober',
        title: 'What the Exhibit Said',
        body: 'A brother who had worked at a video store for nine years asked Darrell whether it was true that the company had been fine until the last minute. Darrell did not answer from memory. He pulled up the exhibit Blockbuster filed on the day it entered chapter 11 and read him the sentence where the company itself listed, among its risks, its ability to continue as a going concern. The brother was quiet for a while. Then he said he wished someone had read him that filing while he still worked there. The record had been public the whole time. Nobody had gone to it.',
      },
    ],
    benefits: [
      'You know where the floor is. A public company’s annual report and its current reports are written by the company under the law, and you can read them for free.',
      'You stop arguing about what a company did, because the company said what it did, on a date, in a document with a number.',
      'You learn to tell a retelling from a record, which is the difference between a scene and a sentence signed by an officer.',
      'You practise Luke’s order: understanding first, then writing, so the reader may know the certainty.',
      'You can teach a child to find the paragraph that says when a company was born and what it fears, in its own words.',
    ],
    levels: {
      teen: 'Here is the second skill. Go to the record before the retelling. Luke wrote his book that way. He had "perfect understanding of all things from the very first" (Luke 1:3). Then he wrote it in order. He did it so the reader could "know the certainty of those things" (Luke 1:4). Certainty comes from the record. It does not come from the retelling.\n\nA public company writes its own record. Every year it files an annual report. The form is called a 10-K. The company signs it. Netflix filed one for the year 2011 on February 10, 2012. In it the company says it was incorporated in Delaware in August 1997. It says it completed its initial public offering in May 2002. It names Blockbuster and Redbox as DVD rental competitors. It says the market is intensely competitive. Those are the company’s own words. You can read them for free.\n\nA company in trouble writes its record too. On September 23, 2010 Blockbuster filed a current report. The form is called an 8-K. One exhibit listed the company’s risks. It named the chapter 11 cases. It named the ability of the company to continue as a going concern. That is the company speaking about itself on the day.\n\nSolomon says what happens when you skip this. "He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13). The podcast is a retelling. It can be good. It is still a retelling. The filing is the record. Go there first.\n\nYour job. Open one of the two filings. Write three things the company says about itself. Then write one thing the podcast says that the filing does not. Keep both lists apart.',
      senior: 'This lesson moves the class from the story to the shelf, and the teacher should make the move physically: open a filing on a screen the whole room can see and read a paragraph of it aloud. Most adults have never seen a Form 10-K and assume it is beyond them. It is not. It is a company describing itself under the law. It is the floor beneath every retelling.\n\nBegin with Luke, whose preface is a research method. He wrote from "perfect understanding of all things from the very first" (Luke 1:3), in order, so that Theophilus "mightest know the certainty of those things, wherein thou hast been instructed" (Luke 1:4). Certainty is the product of the record. Instruction without it is what the podcast and the classroom both hand out. Luke wrote so that instruction could be checked.\n\nThen put two records on the table. Netflix’s annual report for the year ended December 31, 2011, filed February 10, 2012, states in its own words that the company was incorporated in Delaware in August 1997 and completed its initial public offering in May 2002. It names Blockbuster and Redbox among DVD rental outlets and kiosk services in its list of competitors. It says the market for entertainment video is intensely competitive and subject to rapid change. Blockbuster’s current report filed September 23, 2010 carries an exhibit that lists, among the company’s risks, the ability of the company to continue as a going concern and the outcome of the chapter 11 cases. Read those two paragraphs beside the podcast’s scenes. Let the class feel the difference in register. One is a document with an accession number. The other is a story with music.\n\nSolomon’s warning is for the researcher who answers from the retelling: "He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13). His encouragement is for the one who does the work: "the honour of kings is to search out a matter" (Proverbs 25:2). Send the class to the filings with a narrow assignment: three sentences the company says about itself, and one thing the podcast says that the filing does not. Insist that the two lists stay on separate pages.',
    },
    lesson: 'The second competency is the one Luke practised before he wrote a line: "having had perfect understanding of all things from the very first, to write unto thee in order, most excellent Theophilus, That thou mightest know the certainty of those things, wherein thou hast been instructed" (Luke 1:3-4). The order matters. Understanding from the very first, then writing in order, then certainty for the reader. A retelling reverses it: the story comes first and the record, if it comes at all, comes as decoration.\n\nBusiness has a record that history often lacks, because a public company is required to write its own. Every year it files an annual report on Form 10-K, signed by its officers; when something material happens it files a current report on Form 8-K; and all of it is public, free, and dated. Netflix’s annual report for the year ended December 31, 2011, filed February 10, 2012, states in the company’s own words that it was incorporated in Delaware in August 1997 and completed its initial public offering in May 2002. It names DVD rental outlets and kiosk services such as Blockbuster and Redbox among its competitors, and it describes the market for entertainment video as intensely competitive and subject to rapid change. That is the company on itself, under the law.\n\nBlockbuster’s record ends differently and no less plainly. On September 23, 2010 the company filed a current report whose exhibit lists, among the factors that could move its results, the ability of the company to continue as a going concern, its ability to obtain bankruptcy court approval in the chapter 11 cases, and the outcome of those cases in general. A researcher who has read that exhibit does not need a narrator to tell him what day the story turned; the company told him, on the day, in the register companies use when the lawyers are in the room.\n\nSolomon frames both the failure and the honour. The failure: "He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13) — the person who repeats an episode as if it were a filing has answered before hearing. The honour: "It is the glory of God to conceal a thing: but the honour of kings is to search out a matter" (Proverbs 25:2) — the person who opens the 10-K has done a king’s work at a kitchen table. The competency is simple to state and rare to practise: before you repeat what a story says a company did, find where the company said what it did.',
    voices: [
      { speaker: 'Netflix, Inc., in its annual report for 2011', year: 2012, where: 'Item 1, “Competition,” of the Form 10-K for the year ended December 31, 2011, filed February 10, 2012.', source: SRC.netflix10k, words: 'The market for entertainment video is intensely competitive and subject to rapid change. New competitors may be able to launch new businesses at relatively low cost.', why: 'The company describes its own market in the register of a filing, not a scene; the reader can hold the two side by side.' },
      { speaker: 'Blockbuster Inc., in an exhibit filed the day it entered chapter 11', year: 2010, where: 'Exhibit 99.1 to the current report on Form 8-K filed with the Securities and Exchange Commission on September 23, 2010.', source: SRC.blockbuster8k, words: 'the ability of the Company to continue as a going concern, the Company’s ability to obtain bankruptcy court approval with respect to motions in the chapter 11 cases', why: 'The company names its own condition on the day, in its own words; no retelling is needed to date the turn.' },
      { speaker: 'Netflix, Inc., in its letter to shareholders', year: 2011, where: 'The letter of October 24, 2011, filed with the Securities and Exchange Commission as exhibit 99.1: its second paragraph.', source: SRC.netflixLetter, words: 'The last few months, however, have been difficult for shareholders, employees, and most unfortunately, many members of Netflix.', why: 'The company under its own signature, on the record, saying what the quarter cost.' },
      { speaker: 'The Boeing Company, in its annual report', year: 2020, where: 'Item 1 of the Form 10-K for the year ended December 31, 2019, filed January 31, 2020: the paragraph headed Competition.', source: SRC.boeing10k, words: 'We face aggressive international competitors who are intent on increasing their market share, such as Airbus and other entrants from Russia, China and Japan.', why: 'One party to the dispute naming the other, under its own signature, in a sworn filing.' },
    ],
    timeline: [
      { year: 1997, event: 'Netflix is incorporated in Delaware in August.', record: 'Netflix, Inc., Form 10-K for 2011, Item 1, “Other Information.”' },
      { year: 2002, event: 'Netflix completes its initial public offering in May.', record: 'Netflix, Inc., Form 10-K for 2011, Item 1, “Other Information.”' },
      { year: 2010, event: 'Blockbuster files a current report on September 23 whose exhibit names the chapter 11 cases and the going-concern risk.', record: 'Blockbuster Inc., Form 8-K, exhibit 99.1, EDGAR accession 0001193125-10-215624.' },
      { year: 2011, event: 'The fiscal year the Netflix report covers ends on December 31.', record: 'Netflix, Inc., Form 10-K for the year ended December 31, 2011, cover page.' },
      { year: 2012, event: 'Netflix files its annual report for 2011 on February 10.', record: 'EDGAR accession 0001193125-12-053009, primary document d260328d10k.htm.' },
      { year: 2019, event: 'The fiscal year Boeing’s annual report covers ends on December 31; the report is filed the next January.', record: 'The Boeing Company, Form 10-K for the year ended December 31, 2019, cover page.' },
      { year: 2020, event: 'Boeing files its annual report for 2019 on January 31, naming Airbus among the aggressive international competitors it faces.', record: 'The Boeing Company, Form 10-K for 2019, Item 1, “Competition.”' },
    ],
    workedCase: {
      claim: { words: "After a careful and thorough analysis, we determined that the process announced today provides the optimal path for recapitalizing our balance sheet and positioning Blockbuster for the future", by: "Jim Keyes, chairman and chief executive of Blockbuster, September 23, 2010", source: SRC.blockbusterRelease },
      event: { year: 2010, what: "Blockbuster files for chapter 11 and files the press release with the Securities and Exchange Commission the next day: the last day the company’s own words are on the record as a going concern." },
      closedDoors: {
        hidden: "The analysis the chairman calls careful and thorough was done inside the company with its noteholders; the plan support agreement was negotiated before the public heard a word.",
        light: "The filing put the whole arrangement on the record: the financing, the store count, the library, and which debt would be exchanged for the equity of the reorganized company.",
        verse: "\"Neither is there any creature that is not manifest in his sight: but all things are naked and opened unto the eyes of him with whom we have to do\" (Hebrews 4:13).",
        heart: "\"The rich ruleth over the poor, and the borrower is servant to the lender\" (Proverbs 22:7).",
      },
      risk: "A company that cannot pay its senior notes hands the company to the people who hold them; the release says so in one sentence about what the notes would be exchanged for.",
      opportunity: "The release names the assets the reorganized company would keep: a well-established brand, a library of more than 125,000 titles, and stores, kiosks, mail and digital under one name.",
      constraint: "The senior secured notes, at eleven and three-quarters percent, set the terms; the borrower’s path was the one its lenders would fund.",
      economics: [
        { figure: "$125 million", meaning: "The debtor-in-possession financing the senior noteholders committed so the company could pay customers, suppliers and employees during the recapitalization.", record: "Blockbuster Inc., press release of September 23, 2010, exhibit 99.1 to the Form 8-K (EDGAR)" },
        { figure: "3,000 stores", meaning: "The number of United States stores the release says would remain open, while the company evaluated its store portfolio.", record: "Blockbuster Inc., press release of September 23, 2010, exhibit 99.1 to the Form 8-K (EDGAR)" },
        { figure: "more than 125,000 titles", meaning: "The library the release counts as an exceptional asset of the reorganized company.", record: "Blockbuster Inc., press release of September 23, 2010, exhibit 99.1 to the Form 8-K (EDGAR)" },
        { figure: "11¾ percent", meaning: "The rate on the senior secured notes that, under the proposed plan, would be exchanged for the equity of a reorganized Blockbuster.", record: "Blockbuster Inc., press release of September 23, 2010, exhibit 99.1 to the Form 8-K (EDGAR)" },
      ],
      steps: [
        "Go past the retelling to the filing: the press release is exhibit 99.1 to a Form 8-K on EDGAR, filed the day after the chapter 11 filing.",
        "Read the chairman’s sentence as a claim of judgment (optimal path) resting on facts the same document states.",
        "Pull the figures — the financing, the stores, the titles, the rate — and notice each comes from the company under its own signature, not from a narrator.",
        "State the finding: on the day it filed, the company’s own record shows what it owed, what it kept, and to whom the equity would go.",
      ],
      settled: "The financing, the store count, the library and the note exchange are on the record in the company’s own filed release, dated to the day.",
      stillOpen: "What the reorganized company was worth, and what the noteholders recovered, are figures in later filings this course did not fetch.",
    },
    quiz: {
      questions: [
        { q: 'Which is the record and which is the retelling?', options: ['The podcast episode is the record; the 10-K is the retelling', 'The 10-K signed by the company is the record; the episode is a retelling', 'Both are records'], answer: 1, explain: 'A filing is the company on itself under the law; an episode is someone else telling it.' },
        { q: 'Why did Luke write "in order" (Luke 1:3)?', options: ['So the book would be shorter', 'So the reader might know the certainty of the things he had been taught', 'So nobody would ask questions'], answer: 1, explain: '"That thou mightest know the certainty of those things" (Luke 1:4) — the record exists so that instruction can be checked by the one who received it.' },
      ],
    },
    facilitator: {
      talkingPoints: [
        'Luke’s order: understanding from the very first, then writing in order, then certainty (Luke 1:3-4). A retelling reverses it.',
        'A public company writes its own record: the annual report on Form 10-K, the current report on Form 8-K, signed, dated, free.',
        'Netflix’s 2011 report gives August 1997 and May 2002 in its own words; Blockbuster’s exhibit of September 23, 2010 names the going-concern risk on the day.',
        '"He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13) — the person repeating an episode has answered before hearing.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Luke 1:1-4. | The competency in a sentence (10): the record before the retelling. | Teach it (15): what a 10-K and an 8-K are; read a paragraph of each aloud. | Work it (20): three sentences the company says about itself; one thing the podcast says the filing does not. | Discussion (10): the prompts. | Send-off (5): find the filing for one company you buy from this week.',
      discussionPrompts: [
        'What did the company say about itself that surprised you, and why had you never read it before?',
        'What did the podcast say that the filing does not say — and what would it take to establish it?',
        'Where in your own life do you answer a matter before you hear it?',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 3. TWO OR THREE WITNESSES
  // ---------------------------------------------------------------------------
  {
    id: 'br3-two-or-three-witnesses',
    title: 'Two or three witnesses: corroborate before you repeat',
    bigIdea: 'The law of evidence is older than any court: "at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established" (Deuteronomy 19:15), and Paul carried it whole into the church: "In the mouth of two or three witnesses shall every word be established" (2 Corinthians 13:1). When two of the largest companies on earth each accused the other of taking government money, the World Trade Organization did not take a side; it opened two disputes and let each be established by its own witnesses. The researcher does the same.',
    inApp: 'Take one claim you have heard about Boeing and Airbus — that one of them was subsidised. Find the WTO’s two dispute summaries (the course names both). Write, for each dispute, who complained, on what date, and what was alleged. Then write one sentence that both records together establish, and one sentence neither establishes. Save it in your Study.',
    anchor: { ref: 'Deuteronomy 19:15; 2 Corinthians 13:1; Proverbs 18:17', theme: 'Moses set the rule: "One witness shall not rise up against a man for any iniquity, or for any sin, in any sin that he sinneth: at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established" (Deuteronomy 19:15). Paul kept it: "In the mouth of two or three witnesses shall every word be established" (2 Corinthians 13:1). Solomon explains why one is not enough: "He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him" (Proverbs 18:17).' },
    stories: [
      {
        kind: 'parable', tone: 'light',
        title: 'Both Sides of the Ocean',
        body: 'Two cousins argued at a birthday party about which aircraft company had cheated. One had heard a podcast; the other had read a headline. Their aunt, who had spent years in a purchasing office, asked each of them for a second witness. Neither had one. She showed them on her phone that the trade body had opened a dispute against each side and that each summary began with a date and a complaint. Both cousins had been half right and each had told it as a whole. They spent the rest of the party reading the two summaries to each other, which their aunt said was the first useful thing either of them had done all afternoon.',
      },
      {
        kind: 'parable', tone: 'sober',
        title: 'One Witness at the Deacons’ Meeting',
        body: 'A contractor told the deacons that a supplier had cheated the church on a roofing order, and the story was vivid enough that two deacons were ready to cancel the account that night. The chairman asked for the invoice, the delivery slip and the supplier’s side, and said the meeting would take no action on one voice. The invoice showed the price agreed; the delivery slip showed the shortfall; the supplier showed a back-order notice sent to the contractor the week before. The matter was established by three papers, and it was smaller and different from the story. Nobody was cheated. Somebody had not read his mail.',
      },
    ],
    benefits: [
      'You never again repeat a single source as a settled fact, however confident it sounds.',
      'You learn to find the second witness in business research: the other party’s filing, the regulator’s record, the court’s finding, the counterparty’s release.',
      'You can hold two accusations at once without picking a side, because the Word’s rule is about establishing words, not about winning.',
      'You practise Solomon’s wisdom in a boardroom shape: the one first in his own cause seems just until his neighbour searches him.',
      'You can teach a child the rule in six words: two witnesses, or it is not established.',
    ],
    levels: {
      teen: 'Here is the third skill. Get two witnesses before you repeat a thing. The law says so. "At the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established" (Deuteronomy 19:15). Paul kept the same rule. "In the mouth of two or three witnesses shall every word be established" (2 Corinthians 13:1). One voice can be loud. It is still one voice. Two voices that agree are the start of a fact. That is the rule, and it is old.\n\nHere is a case. Boeing builds big airplanes. Airbus builds big airplanes. Each side said the other one got government help it should not have. The World Trade Organization handles disputes like that. It did not pick a side. It opened two cases.\n\nThe first is called DS316. On October 6, 2004, the United States asked for talks with the European Communities and four of its member states. It said they gave Airbus subsidies. A panel was set up on July 20, 2005. The second is called DS353. In it the European Communities said the United States gave Boeing subsidies. A panel was set up on February 17, 2006. The Europeans said the total came to $19.1 billion between 1989 and 2006. The panel report came out on March 31, 2011.\n\nSo who cheated? A researcher does not answer that from one podcast. A researcher does not answer it from one summary either. Two records now exist. Each side is first in its own cause. Solomon warns you about that. "He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him" (Proverbs 18:17). Read both summaries. Write what both establish together. Write what neither one establishes yet.\n\nYour job. Find the two WTO summaries. Write who complained, on what date, and what they claimed. Then write one sentence both records establish. Then one sentence neither does.',
      senior: 'This lesson teaches corroboration in the shape business research actually meets it: two large parties, each accusing the other, each entirely persuasive on its own. The teacher’s task is to keep the room from taking a side for a full twenty minutes. The Word’s rule makes that restraint a duty, not a courtesy.\n\nOpen with the law and its apostolic echo. "One witness shall not rise up against a man for any iniquity, or for any sin, in any sin that he sinneth: at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established" (Deuteronomy 19:15); "In the mouth of two or three witnesses shall every word be established" (2 Corinthians 13:1). Point out that the rule governs establishment, not accusation. Anyone may accuse. Nothing is established until the witnesses agree.\n\nThen lay out the case from the two Secretariat summaries. In dispute DS316 the United States requested consultations on October 6, 2004 with the European Communities and with Germany, France, the United Kingdom and Spain over measures affecting trade in large civil aircraft, alleging launch aid and other subsidies to Airbus. The panel was established on July 20, 2005. In dispute DS353 the European Communities complained that the United States subsidised Boeing’s large civil aircraft division through state, federal and research-programme measures. The panel was established on February 17, 2006. The Europeans put the alleged total at $19.1 billion between 1989 and 2006. The panel report was circulated on March 31, 2011. Each summary is a witness to its own dispute. Neither alone establishes the whole. Read together they establish something the room can write in one sentence. Both sides were accused before a body with the standing to hear it. Both accusations went to a panel.\n\nSolomon supplies the psychology the room will feel: "He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him" (Proverbs 18:17). Whichever summary is read first will seem just. The second searches it. Send the class to both, with the narrow assignment of one sentence both establish and one sentence neither does. Refuse to let anyone name a cheat.',
    },
    lesson: 'The third competency is the oldest rule of evidence there is, and it was given to a nation before it was given to any court: "One witness shall not rise up against a man for any iniquity, or for any sin, in any sin that he sinneth: at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established" (Deuteronomy 19:15). Paul, writing to a church that had heard plenty of single voices, kept it whole: "In the mouth of two or three witnesses shall every word be established" (2 Corinthians 13:1). The rule is not about doubting; it is about what it takes for a word to stand.\n\nBusiness supplies a case where two enormous parties each accused the other and each was persuasive alone. Boeing and Airbus build the world’s large civil aircraft, and each side said the other was fed by government money it should not have had. The World Trade Organization did what the Word’s rule requires of a researcher: it did not adopt either accusation; it opened a dispute for each and let each be established or fail on its own record. In dispute DS316, the United States requested consultations on October 6, 2004 with the European Communities and with Germany, France, the United Kingdom and Spain over measures affecting trade in large civil aircraft, naming launch aid, grants, preferential loans and equity infusions to Airbus; the Dispute Settlement Body established a panel on July 20, 2005. In dispute DS353, the European Communities complained that the United States subsidised Boeing’s large civil aircraft division through state and municipal incentives, research programmes and tax measures; a panel was established on February 17, 2006; the Europeans estimated the alleged subsidies at $19.1 billion between 1989 and 2006; and the panel report was circulated to members on March 31, 2011.\n\nWhat do the two records establish together? That both sides were formally accused before a body with standing to hear the matter, on named dates, with named measures, and that both accusations went to a panel. What does neither establish alone? Who cheated, in the sense the podcast’s listener wants to know, because each summary is its own dispute and each side is, in Solomon’s phrase, first in its own cause: "He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him" (Proverbs 18:17). The researcher who reads only DS316 comes away sure of Airbus; the one who reads only DS353 comes away sure of Boeing; the one who reads both has learned the competency.\n\nCorroboration in business research has a practical shape: the other party’s filing, the regulator’s docket, the court’s finding, the counterparty’s own release. Whenever a story gives you one, go and find the second before you repeat the first. Two witnesses, or it is not established.',
    voices: [
      { speaker: 'The WTO Secretariat, summarising dispute DS316', year: 2004, where: 'The Secretariat’s summary of the dispute on the WTO’s site, under “Consultations,” the complaint by the United States.', source: SRC.ds316, words: 'On 6 October 2004, the United States requested consultations with the governments of Germany, France, the United Kingdom, and Spain', why: 'The first witness: who complained, against whom, on what date, in the record-keeper’s own words.' },
      { speaker: 'The WTO Secretariat, summarising dispute DS353', year: 2011, where: 'The Secretariat’s summary of the dispute on the WTO’s site, under “Summary of key findings,” the European Communities’ complaint against the United States.', source: SRC.ds353, words: 'The European Communities estimated that the total amount of the alleged subsidies was $19.1 billion between 1989 and 2006.', why: 'The second witness: the other side’s complaint, with its own number and its own dates, so neither accusation stands alone.' },
      { speaker: 'Reed Hastings, chief executive of Netflix', year: 2011, where: 'His post on the Netflix blog, September 18, 2011, the first words after the title.', source: SRC.hastings, words: 'I messed up. I owe everyone an explanation.', why: 'The man who made the decision, in his own words, before any narrator retells it.' },
      { speaker: 'Netflix, Inc., in its letter to shareholders', year: 2011, where: 'The same letter, on the pricing change and the rebranding it had cancelled.', source: SRC.netflixLetter, words: 'we greatly upset many domestic Netflix members with our significant DVD-related pricing changes, and to a lesser degree, with the proposed-and-now-cancelled rebranding of our DVD service', why: 'The second witness to the same event, in a filed document: the blog and the letter agree.' },
    ],
    timeline: [
      { year: 1989, event: 'The first year of the period over which the European Communities later counted alleged subsidies to Boeing.', record: 'WTO dispute DS353, Secretariat summary of key findings.' },
      { year: 2004, event: 'The United States requests consultations over Airbus subsidies on October 6.', record: 'WTO dispute DS316, Secretariat summary.' },
      { year: 2005, event: 'The Dispute Settlement Body establishes the DS316 panel on July 20.', record: 'WTO dispute DS316, Secretariat summary.' },
      { year: 2006, event: 'The Dispute Settlement Body establishes the DS353 panel on February 17; the last year of the counted period.', record: 'WTO dispute DS353, Secretariat summary.' },
      { year: 2011, event: 'The DS353 panel report is circulated to members on March 31.', record: 'WTO dispute DS353, Secretariat summary.' },
    ],
    workedCase: {
      claim: { words: "I messed up. I owe everyone an explanation.", by: "Reed Hastings, chief executive of Netflix, September 18, 2011", source: SRC.hastings },
      event: { year: 2011, what: "The same event is on the record twice: the chief executive’s post on September 18, and the company’s letter to shareholders on October 24, which calls the rebranding proposed and now cancelled." },
      closedDoors: {
        hidden: "The chief executive’s account of what went wrong could have stayed a private post-mortem; the shareholders’ letter could have described the quarter without naming the damage.",
        light: "Both were published: the post under his name on the company’s blog, the letter under the company’s signature with the Securities and Exchange Commission; two witnesses to one event, both in the light.",
        verse: "\"Therefore whatsoever ye have spoken in darkness shall be heard in the light; and that which ye have spoken in the ear in closets shall be proclaimed upon the housetops\" (Luke 12:3).",
        heart: "\"He that covereth his sins shall not prosper: but whoso confesseth and forsaketh them shall have mercy\" (Proverbs 28:13).",
      },
      risk: "One witness alone can be dismissed as a mood or a public-relations move; the second, a filed document, makes the first a matter of record.",
      opportunity: "Two independent records of the same event let a researcher establish it the way the Word requires, at the mouth of two witnesses, without trusting either one alone.",
      constraint: "The two witnesses are not independent of the company — one is its chief executive, the other its signed letter — so a third, outside witness would be needed to establish anything they both omit.",
      economics: [
        { figure: "2 records, 36 days apart", meaning: "The post of September 18 and the letter of October 24: the same price change and rebranding described twice, once by the man and once by the company under its filing obligation.", record: "Reed Hastings, the Netflix blog, September 18, 2011, as archived by the Wayback Machine; Netflix, Inc., letter to shareholders of October 24, 2011, exhibit 99.1 (EDGAR)" },
        { figure: "2 charges", meaning: "What a member subscribing to both services would have seen under the split the post announced: two entries on a credit card statement, one for each business.", record: "Reed Hastings, the Netflix blog, September 18, 2011, as archived by the Wayback Machine" },
      ],
      steps: [
        "Take the first witness — the post — and note what it establishes: an apology, a reason, and a plan to split the service.",
        "Take the second — the filed letter — and note what it establishes: the damage, and that the rebranding was proposed and then cancelled.",
        "Mark what both share (the price change, the split, the harm) as established, and what only one carries (the reasoning; the cancellation) as single-witness.",
        "Name the outside witness that would complete the case — a member count from a later filing — and that this course did not fetch it.",
      ],
      settled: "The price change, the announced split and the damage to members and reputation are established by two records of the company’s own, thirty-six days apart.",
      stillOpen: "The number of members lost is in neither excerpt this course fetched; a later filing would be the third witness.",
    },
    quiz: {
      questions: [
        { q: 'Reading only DS316, what has a researcher established?', options: ['That Airbus cheated', 'That the United States formally accused the European side, on a date, of named measures', 'Nothing at all'], answer: 1, explain: 'One record establishes its own dispute — who complained, when, of what — not the whole matter.' },
        { q: 'What does Paul say it takes for a word to be established?', options: ['One confident witness', 'Two or three witnesses', 'A majority vote'], answer: 1, explain: '"In the mouth of two or three witnesses shall every word be established" (2 Corinthians 13:1). One record is an accusation; two records that agree begin to establish a fact.' },
      ],
    },
    facilitator: {
      talkingPoints: [
        'The rule governs establishment, not accusation: anyone may accuse; nothing stands until the witnesses agree (Deuteronomy 19:15; 2 Corinthians 13:1).',
        'DS316: the United States asked for consultations on October 6, 2004; panel July 20, 2005. DS353: panel February 17, 2006; $19.1 billion alleged over 1989 to 2006; report March 31, 2011.',
        'Together the two records establish that both sides were accused before a body with standing; neither alone establishes who cheated.',
        '"He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him" (Proverbs 18:17) — read the second summary before you believe the first.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Deuteronomy 19:15. | The competency in a sentence (10): two witnesses, or it is not established. | Teach it (15): the two disputes, side by side, dates first. | Work it (20): who, when, what for each; one sentence both establish; one neither does. | Discussion (10): the prompts. | Send-off (5): find the second witness for one claim you repeated this week.',
      discussionPrompts: [
        'Which summary did you read first, and how did it change what you believed before you read the second?',
        'Where in your family or church is a matter being decided on one witness right now?',
        'What is the difference between an accusation and an established word?',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 4. A DRAMATIZATION IS NOT A RECORD
  // ---------------------------------------------------------------------------
  {
    id: 'br4-a-dramatization-is-not-a-record',
    title: 'A dramatization is not a record: sort the reenactment from the document',
    bigIdea: 'Business Wars is honest about what it is. Its own page calls it the unauthorized, real story, and its episodes stage meetings and conversations as scenes. The Word gives the researcher the sorting rule: "The simple believeth every word: but the prudent man looketh well to his going" (Proverbs 14:15), and "Judge not according to the appearance, but judge righteous judgment" (John 7:24). A staged scene is appearance; a press release with a date and a price is a document. The prudent researcher keeps them on separate pages and credits each for what it is.',
    inApp: 'Listen to any Business Wars scene in which two executives talk. Write down two sentences from it. Beside each, mark: could a document contain this (a filing, a release, a transcript), or is this a reenactment? Then find one real document from the same story (the course gives Disney’s Marvel release as the model) and write one sentence from it with its date. Save it in your Study.',
    anchor: { ref: 'Proverbs 14:15; John 7:24; Proverbs 19:2', theme: 'Solomon draws the line between the simple and the prudent: "The simple believeth every word: but the prudent man looketh well to his going" (Proverbs 14:15). Jesus gives the standard of judgment: "Judge not according to the appearance, but judge righteous judgment" (John 7:24). And Solomon names the cost of speed: "Also, that the soul be without knowledge, it is not good; and he that hasteth with his feet sinneth" (Proverbs 19:2).' },
    stories: [
      {
        kind: 'parable', tone: 'light',
        title: 'The Meeting Nobody Recorded',
        body: 'A youth leader played an episode for the teens in which two executives argue across a table, and then asked the room who had been in that meeting. Nobody knew. He asked whether the podcast had said it was reading from a transcript. Nobody thought so. He asked whether the argument might still be true. Several said yes. He said that was exactly right: a reenactment can be faithful, and it is still a reenactment, and you cannot cite it. Then he put Disney’s press release on the screen, with its date and its price per share, and said: this you can cite. One of the teens asked why the release was so boring. He said because nobody had to act it.',
      },
      {
        kind: 'parable', tone: 'sober',
        title: 'The Sermon Illustration That Was Not True',
        body: 'A preacher told a story about a famous founder for years, complete with the words the man had said in a hotel lobby, and it moved people every time. A visiting engineer who had worked at that company asked him afterward where the quote came from. The preacher realised it came from a dramatization he had heard once and had been improving for a decade. He did not stop telling stories. He started saying, when he told that one, that this is how it is told, and that he did not have the record. The illustration lost nothing and the pulpit gained its honesty back.',
      },
    ],
    benefits: [
      'You can enjoy a dramatization fully and still know exactly which sentences you may cite and which you may not.',
      'You learn what a document looks like in business: a release with a date, a filing with a number, a transcript with a speaker — and what a scene looks like.',
      'You give the storytellers their due. A team that turns filings into drama for millions of listeners does real work, and crediting it honestly is part of the craft.',
      'You practise righteous judgment instead of appearance, which is the standard Jesus set.',
      'You can teach a child the question in five words: could a document say this?',
    ],
    levels: {
      teen: 'Here is the fourth skill. A dramatization is not a record. Business Wars tells its stories as scenes. People talk across tables. Music plays. The show’s own page calls it the unauthorized, real story. That is fair. It is also a warning. A scene can be true and still be a reenactment. You cannot cite a reenactment.\n\nSolomon gives the rule. "The simple believeth every word: but the prudent man looketh well to his going" (Proverbs 14:15). Jesus gives the standard. "Judge not according to the appearance, but judge righteous judgment" (John 7:24). A scene is appearance. A document is something else.\n\nHere is a document. On August 31, 2009, the Walt Disney Company put out a press release. It said Disney had agreed to acquire Marvel Entertainment. It gave the price. Marvel shareholders would get $30 in cash plus about 0.745 Disney shares for each share. It said the deal was worth about $50 per Marvel share, or about $4 billion. It quoted Robert Iger, Disney’s chief executive. It quoted Ike Perlmutter, Marvel’s chief executive. Every sentence has a date and a name on it. That is what a record looks like.\n\nNow think about a scene where two executives argue. Ask one question. Could a document say this? If a filing, a release or a transcript could carry the sentence, go find it. If not, it is a reenactment. Enjoy it. Do not cite it. And give credit where it is due. The people who make the show do real work. They read filings so you do not have to. Say so. Then go read the filings anyway.\n\nYour job. Take two sentences from a scene. Mark each one: document or reenactment. Then take one sentence from Disney’s release with its date.',
      senior: 'This lesson gives the class a sorting tool it will use for the rest of its life, and the teacher should be generous to the podcast while teaching it, because the point is not that dramatization is dishonest but that it is a different kind of thing from a record and must be credited as what it is.\n\nStart with what the show says of itself: the unauthorized, real story of what drives these companies and their leaders. Both adjectives are honest. Unauthorized tells you the companies did not approve it, which is a strength; real tells you the makers intend fidelity, which is a promise. Neither adjective turns a staged conversation into a transcript. Then read Solomon and Jesus together. "The simple believeth every word: but the prudent man looketh well to his going" (Proverbs 14:15) is the posture; "Judge not according to the appearance, but judge righteous judgment" (John 7:24) is the standard; and "he that hasteth with his feet sinneth" (Proverbs 19:2) is the warning against the speed with which a good scene becomes a repeated fact.\n\nThen put a document on the screen and let its register teach. Disney’s press release of August 31, 2009 announces an agreement to acquire Marvel Entertainment in a stock and cash transaction; it states that Marvel shareholders would receive $30 per share in cash plus approximately 0.745 Disney shares for each Marvel share, that the transaction value based on the closing price of August 28 was $50 per Marvel share or approximately $4 billion, and it quotes Robert A. Iger and Ike Perlmutter by name and title. A researcher can cite every clause of that, because a company issued it on a date and it is still where the company put it.\n\nThe sorting question for any scene is one sentence: could a document carry this? If a filing, a release, a court transcript or a letter could contain the words, the words are findable and the researcher’s job is to find them. If nothing but a script could contain them, they are a reenactment, to be enjoyed, credited, and never cited. Close by crediting the makers plainly. A team that reads filings and court records and turns them into drama that millions will hear has done real educational work; the course stands on its shoulders and then goes to the shelf it points to.',
    },
    lesson: 'The fourth competency is the one that keeps the podcast in its honest place. Business Wars describes itself, on its own page, as the unauthorized, real story of what drives these companies and their leaders, and its episodes stage meetings, phone calls and arguments as scenes with voices and music. That is a legitimate form and an old one. It is also, by its nature, a reenactment, and a reenactment is not a record. The Word gives the sorting rule in two verses that belong together: "The simple believeth every word: but the prudent man looketh well to his going" (Proverbs 14:15), and "Judge not according to the appearance, but judge righteous judgment" (John 7:24). A scene is appearance, however faithful; a document is a different kind of thing.\n\nWhat a document looks like in business is worth showing rather than describing. On August 31, 2009 the Walt Disney Company issued a press release announcing that it had agreed to acquire Marvel Entertainment in a stock and cash transaction. Under the agreement, and based on Disney’s closing price on August 28, 2009, Marvel shareholders would receive $30 per share in cash plus approximately 0.745 Disney shares for each Marvel share, a value of $50 per Marvel share or approximately $4 billion. The release quotes Robert A. Iger, Disney’s president and chief executive, and Ike Perlmutter, Marvel’s chief executive, by name and title. Every clause carries a date, a number or a name. A researcher may cite all of it, because a company issued it on a day and it remains where the company put it. A court’s findings are the same kind of thing: the findings of fact in the Microsoft case were signed on November 5, 1999 and remain on the Antitrust Division’s site, word for word.\n\nThe sorting question is one sentence: could a document carry this? A staged conversation between two executives in a Blockbuster office is a scene; if a deposition, a letter or a filing carried those words, the researcher’s job is to find it, and if nothing but a script could carry them, they are a reenactment to be enjoyed and never cited. Solomon adds the warning about speed, because a good scene becomes a repeated fact in a single retelling: "Also, that the soul be without knowledge, it is not good; and he that hasteth with his feet sinneth" (Proverbs 19:2).\n\nAnd the credit belongs on the page. The people who make Business Wars read filings and court records and turn them into drama that millions of listeners will hear; that is real work in the service of education, and this course stands on it. The competency is not to despise the doorway but to know it is a doorway, to thank the ones who built it, and to walk through it to the floor.',
    voices: [
      { speaker: 'Wondery, the show page for Business Wars', year: 2018, where: 'The show’s own description beside its first episode on the page as served through Audible, February 6, 2018.', source: SRC.wondery, words: 'Netflix vs. HBO. Nike vs. Adidas. Business is war. Sometimes the prize is your wallet or your attention.', why: 'The frame in the show’s own words: a lens the researcher names before sorting the scenes it frames.' },
      { speaker: 'The Walt Disney Company, in its press release', year: 2009, where: 'The release “Disney to Acquire Marvel Entertainment,” Burbank and New York, August 31, 2009, still on Disney’s own site.', source: SRC.disney, words: 'Based on the closing price of Disney stock on Friday, August 28, the transaction value is $50 per Marvel share or approximately $4 billion.', why: 'A document with a date, a number and a name: the model of what may be cited, set beside a scene that may not.' },
      { speaker: 'Robert A. Iger, president and chief executive of The Walt Disney Company', year: 2009, where: 'The company’s press release of August 31, 2009, announcing the Marvel acquisition.', source: SRC.disney, words: 'We believe that adding Marvel to Disney\'s unique portfolio of brands provides significant opportunities for long-term growth and value creation', why: 'The buyer, in his own words, on the day: what a dramatization must be checked against.' },
      { speaker: 'Ike Perlmutter, chief executive of Marvel', year: 2009, where: 'The same press release: the seller’s own words.', source: SRC.disney, words: 'Disney is the perfect home for Marvel\'s fantastic library of characters given its proven ability to expand content creation and licensing businesses', why: 'The seller as a witness beside the buyer, both on the record the same day.' },
    ],
    timeline: [
      { year: 1999, event: 'The Court’s Findings of Fact in the Microsoft case are signed on November 5, a document a researcher may cite word for word.', record: 'The Court’s Findings of Fact, U.S. v. Microsoft, on the Antitrust Division’s site.' },
      { year: 2009, event: 'Disney announces on August 31 that it has agreed to acquire Marvel Entertainment for about $4 billion.', record: 'The Walt Disney Company press release of August 31, 2009.' },
      { year: 2018, event: 'Business Wars begins; its show page describes the unauthorized, real story and stages its episodes as scenes.', record: 'The Business Wars show page, description and episode list.' },
    ],
    workedCase: {
      claim: { words: "Based on the closing price of Disney stock on Friday, August 28, the transaction value is $50 per Marvel share or approximately $4 billion.", by: "The Walt Disney Company, press release of August 31, 2009", source: SRC.disney },
      event: { year: 2009, what: "Disney announces it will acquire Marvel; the release states the price, the assets and both chief executives’ words on the same day." },
      closedDoors: {
        hidden: "The negotiation between the two companies — who wanted what, what was offered and refused — happened in private and is not in the release.",
        light: "What the release does put in the light is the price, the count of characters, and the two executives’ own sentences; a dramatization may fill the room with invented dialogue, but only those are on the record.",
        verse: "\"For nothing is secret, that shall not be made manifest; neither any thing hid, that shall not be known and come abroad\" (Luke 8:17).",
        heart: "\"A just weight and balance are the LORD’s: all the weights of the bag are his work\" (Proverbs 16:11).",
      },
      risk: "A reenactment that invents a boardroom line teaches the listener a motive nobody recorded; repeated as fact, it displaces the two sentences the executives actually said.",
      opportunity: "The release gives the researcher exactly what a dramatization cannot: a price per share, a total, a character count and two quotations with names attached.",
      constraint: "The release states the value “based on the closing price” of one Friday, so the $4 billion is a computation on a date, not a fixed sum; the record itself says so.",
      economics: [
        { figure: "$50 per share", meaning: "The transaction value per Marvel share, on the release’s own basis of Disney’s closing price on Friday, August 28.", record: "The Walt Disney Company, press release of August 31, 2009" },
        { figure: "approximately $4 billion", meaning: "The total value the release states for the acquisition, on the same basis.", record: "The Walt Disney Company, press release of August 31, 2009" },
        { figure: "more than 5,000 characters", meaning: "What Disney said it would acquire ownership of: the library the buyer named as the asset.", record: "The Walt Disney Company, press release of August 31, 2009" },
      ],
      steps: [
        "Separate what the release records (price, total, characters, two quotations) from what a dramatization adds (scenes, dialogue, motive).",
        "Read the two executives’ sentences as the only words either man is on record saying about the deal that day.",
        "Check the computation the release describes: the total rests on one closing price, which the release names.",
        "Teach the listener to keep the record’s figures and hold the reenactment as illustration, never as source.",
      ],
      settled: "The price per share, the approximate total, the character count and the two executives’ words are on the record in the buyer’s own release, dated to the day.",
      stillOpen: "What was said in the negotiation, and what Marvel’s owner would have accepted, are in no record this course fetched; any dramatization of them is invention.",
    },
    quiz: {
      questions: [
        { q: 'A scene in which two executives argue across a table is:', options: ['A record, because the show says it is real', 'A reenactment, unless a document carries the words', 'Always false'], answer: 1, explain: 'Could a document say this? If not, it is appearance — to be enjoyed and credited, never cited.' },
        { q: 'What makes Disney’s release citable?', options: ['It is exciting', 'A company issued it on a date with numbers and names, and it is still where the company put it', 'It was on a podcast'], answer: 1, explain: 'A document has a date, a number or a name on every clause and an issuer who put it there.' },
      ],
    },
    facilitator: {
      talkingPoints: [
        '"The simple believeth every word: but the prudent man looketh well to his going" (Proverbs 14:15); "Judge not according to the appearance" (John 7:24) — a scene is appearance.',
        'The show calls itself the unauthorized, real story; both words are honest and neither turns a staged conversation into a transcript.',
        'Disney’s release of August 31, 2009: $30 cash plus about 0.745 shares, $50 per Marvel share, about $4 billion, Iger and Perlmutter quoted by name — the model of a document.',
        'The sorting question in one sentence: could a document carry this? Credit the makers plainly, then go to the shelf they point to.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Proverbs 14:15 and John 7:24. | The competency in a sentence (10): could a document say this? | Teach it (15): the release on the screen, clause by clause. | Work it (20): two sentences from a scene, sorted; one sentence from the release with its date. | Discussion (10): the prompts. | Send-off (5): credit one storyteller this week and then find one record they used.',
      discussionPrompts: [
        'Which scene did you most want to be true, and what would it take to find its record?',
        'What does the frame business is war make you expect, and what did the Disney release actually show?',
        'How do you credit a storyteller honestly without citing the story as a record?',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 5. JUST WEIGHTS
  // ---------------------------------------------------------------------------
  {
    id: 'br5-just-weights',
    title: 'Just weights: read a rivalry by its conduct and its numbers, not its side',
    bigIdea: 'Yahweh cares how a thing is weighed: "A false balance is abomination to the LORD: but a just weight is his delight" (Proverbs 11:1). A researcher weighs a rivalry the way a court weighs a case, by conduct proved and numbers measured, not by which company he likes. When the United States tried Microsoft, the judge wrote 412 numbered findings and dated them, and his standard was stated on the first page: facts proved by a preponderance of the evidence. That is a just weight, and the researcher borrows it.',
    inApp: 'Open the Court’s Findings of Fact in U.S. v. Microsoft (the course names the page). Read findings 33 to 35. Write down the one number the court gives for Microsoft’s share of its market, the words the court uses for that power, and the standard of proof stated on the first page. Then write one sentence about the browser rivalry that the findings support, and one that they do not. Save it in your Study.',
    anchor: { ref: 'Proverbs 11:1; Leviticus 19:35-36; Proverbs 16:11; Micah 6:11', theme: 'The law of the scale is Yahweh’s own: "Ye shall do no unrighteousness in judgment, in meteyard, in weight, or in measure. Just balances, just weights, a just ephah, and a just hin, shall ye have" (Leviticus 19:35-36). "A just weight and balance are the LORD’s: all the weights of the bag are his work" (Proverbs 16:11). And Micah asks the question a researcher must answer about himself: "Shall I count them pure with the wicked balances, and with the bag of deceitful weights?" (Micah 6:11).' },
    stories: [
      {
        kind: 'parable', tone: 'light',
        title: 'The Scale in the Pantry',
        body: 'Naomi kept a kitchen scale that read a little heavy, and for a year every loaf she baked was slightly under what she thought. She found out when she weighed a bag of flour that said its weight on the label. She did not throw out the scale; she wrote the correction on a piece of tape and stuck it to the base, and every recipe after that was true. Darrell used the tape at the table to explain what a court does with a case: it does not trust the loudest party’s scale. It writes down the standard first, then weighs, then numbers every finding so anyone can check the tape.',
      },
      {
        kind: 'parable', tone: 'sober',
        title: 'The Church Treasurer Who Liked One Vendor',
        body: 'A treasurer had a friend who sold sound equipment, and for three years every quote from the friend won without anyone reading the other quotes. Nobody stole anything. The church simply paid more, because the scale was tilted by affection and no one had written the standard down. When a new deacon insisted on three sealed quotes and a scoring sheet, the friend still won one bid of four, fairly, and the church saved enough on the other three to fix the roof. A just weight did not punish the friend. It only stopped weighing him twice.',
      },
    ],
    benefits: [
      'You stop reading a rivalry as a fan. Conduct proved and numbers measured are the only weights on the scale.',
      'You learn what a court’s findings look like: numbered, dated, with the standard of proof stated first, so anyone can check the tape.',
      'You can hold a hard finding about a company you admire, and a fair finding about one you do not, without flinching.',
      'You practise the law of the scale in your own judgments: a just weight, a just measure, no deceitful bag.',
      'You can teach a child to ask of any verdict: what standard did they weigh by, and did they write it down first?',
    ],
    levels: {
      teen: 'Here is the fifth skill. Weigh a rivalry with a just weight. The Word cares about scales. "A false balance is abomination to the LORD: but a just weight is his delight" (Proverbs 11:1). "Just balances, just weights, a just ephah, and a just hin, shall ye have" (Leviticus 19:36). A researcher is a person holding a scale. The question is whether the scale is honest.\n\nHere is a case weighed by a court. The United States brought a case against Microsoft. The case opened on May 18, 1998. The trial ran from October 19, 1998 to June 24, 1999. The record closed on July 28, 1999. On November 5, 1999 the judge, Thomas Penfield Jackson, issued his findings of fact. There are 412 of them. They are numbered. On the first page he wrote his standard. He found the facts proved by a preponderance of the evidence. That means more likely than not. He wrote the standard before he weighed. That is a just scale.\n\nWhat did he find? Finding 33 says Microsoft enjoys monopoly power in the relevant market. Finding 35 says its share of the market for Intel-compatible PC operating systems stood above ninety percent every year for the last decade. Those are numbers and conduct. They are not feelings about a company. You may like Microsoft or not. The finding stands either way.\n\nWhat did the findings not settle? Whether the case should have been brought at all. Whether the remedy was right. Those came later, and other courts weighed them. Lesson six tells that part.\n\nYour job. Read findings 33 to 35. Write the number, the words for the power, and the standard of proof. Then write one sentence the findings support. Then one they do not.',
      senior: 'This lesson gives the class a court as its model of weighing, and the teacher should lean on the form of the findings as much as their content, because the form is what a just weight looks like on paper: a standard stated first, then numbered findings anyone can check.\n\nOpen with the law of the scale, which is Yahweh’s own and not a business ethic: "Ye shall do no unrighteousness in judgment, in meteyard, in weight, or in measure. Just balances, just weights, a just ephah, and a just hin, shall ye have" (Leviticus 19:35-36). "A false balance is abomination to the LORD: but a just weight is his delight" (Proverbs 11:1). Micah turns it on the weigher: "Shall I count them pure with the wicked balances, and with the bag of deceitful weights?" (Micah 6:11). A researcher with a favourite company has a deceitful bag whether or not he knows it.\n\nThen put the case on the table by its own dates. The Antitrust Division’s case page records the case as opened on May 18, 1998. The Court’s Findings of Fact state that the actions were tried without a jury between October 19, 1998 and June 24, 1999, that the record closed on July 28, 1999, and that the court found the facts proved by a preponderance of the evidence; Judge Thomas Penfield Jackson signed them on November 5, 1999. Finding 33 states that Microsoft enjoys monopoly power in the relevant market; finding 35 states that its share of the market for Intel-compatible PC operating systems stood above ninety percent every year for the previous decade; finding 412 states what the court took to be the most harmful effect of the conduct on every enterprise with the potential to innovate. Read them aloud. They are numbered, dated, and weighed against a stated standard, which is exactly what the Word requires of a balance.\n\nThen mark the boundary of what the findings settle. They settle conduct and numbers as found by that court on that record. They do not settle whether the case was wise, whether the remedy was right, or how history should feel about Microsoft; the first two went to other courts, which lesson six traces, and the last is not a research question at all. Send the class to findings 33 to 35 with a narrow assignment, and insist that the sentence the findings do not support be written as carefully as the one they do.',
    },
    lesson: 'The fifth competency is the law of the scale, and it is Yahweh’s law before it is anyone’s method: "Ye shall do no unrighteousness in judgment, in meteyard, in weight, or in measure. Just balances, just weights, a just ephah, and a just hin, shall ye have: I am the LORD your God, which brought you out of the land of Egypt" (Leviticus 19:35-36). Solomon says the same in a proverb: "A false balance is abomination to the LORD: but a just weight is his delight" (Proverbs 11:1). A researcher reading a rivalry is a person holding a scale, and the competency is to make sure the scale is honest before anything is placed on it.\n\nThe case is a court, because a court is where business rivalries are weighed in public with the standard written down first. The Antitrust Division’s case page records United States v. Microsoft Corporation as opened on May 18, 1998. The Court’s Findings of Fact, signed by Judge Thomas Penfield Jackson on November 5, 1999, open by stating that the consolidated actions were tried to the court, sitting without a jury, between October 19, 1998 and June 24, 1999; that the record closed on July 28, 1999; and that the court finds the following facts to have been proved by a preponderance of the evidence. Then come 412 numbered findings. Finding 33 states that Microsoft enjoys monopoly power in the relevant market. Finding 35 states that every year for the previous decade its share of the market for Intel-compatible PC operating systems stood above ninety percent. Finding 412 states that the most harmful effect of the conduct was the message it sent to every enterprise with the potential to innovate. Whatever the reader feels about Microsoft, those findings are conduct and numbers weighed against a stated standard by a court that wrote the standard down before it weighed, and that is what a just balance looks like on paper.\n\nThe competency has a second half, which is to mark the boundary of what a finding settles. The findings settle what that court found on that record. They do not settle whether the suit was wise, whether the remedies were right, or how a listener should feel about a company; the first two questions went to other courts, beginning with the Court of Appeals opinion of June 28, 2001, and lesson six follows them there; the third is not a research question. A researcher who lets a finding of monopoly power become a verdict on a company’s whole life has picked up a deceitful weight, and Micah’s question is for him: "Shall I count them pure with the wicked balances, and with the bag of deceitful weights?" (Micah 6:11).\n\n"A just weight and balance are the LORD’s: all the weights of the bag are his work" (Proverbs 16:11). Read the rivalry by its conduct and its numbers. State your standard first. Number what you find. Then say what you have not found.',
    voices: [
      { speaker: 'Judge Thomas Penfield Jackson, in the Court’s Findings of Fact', year: 1999, where: 'Finding 33, under “Microsoft’s Power in the Relevant Market,” signed November 5, 1999, on the Antitrust Division’s site.', source: SRC.findings, words: 'In other words, Microsoft enjoys monopoly power in the relevant market.', why: 'A finding of conduct weighed against a stated standard, in the court’s own words, numbered so anyone can check it.' },
      { speaker: 'Judge Thomas Penfield Jackson, in the Court’s Findings of Fact', year: 1999, where: 'Finding 35, under “Market Share,” signed November 5, 1999, on the Antitrust Division’s site.', source: SRC.findings, words: 'Every year for the last decade, Microsoft’s share of the market for Intel-compatible PC operating systems has stood above ninety percent.', why: 'The number beneath the finding: a just weight is a measured one, not a felt one.' },
      { speaker: 'Bill Gates, chairman and chief executive of Microsoft, in a memorandum to his executives', year: 1999, where: 'His “Internet Tidal Wave” memorandum of May 1995, as the Court quoted it in its Findings of Fact of November 5, 1999.', source: SRC.findings, words: 'pursuing a multi-platform strategy where they move the key API into the client to commoditize the underlying operating system', why: 'The defendant’s own words about his rival, entered into the court’s record: the weight is his, not the narrator’s.' },
      { speaker: 'Bill Gates, chairman and chief executive of Microsoft, in a memorandum to his executives', year: 1999, where: 'The same memorandum, as the Court quoted it: what a decent product could and could not do.', source: SRC.findings, words: 'this alone won\'t get people to switch away from Netscape', why: 'His own words, weighed by the Court, on why quality alone would not win the browser.' },
    ],
    timeline: [
      { year: 1995, event: 'In May Bill Gates sends his “Internet Tidal Wave” memorandum to Microsoft’s executives, naming Netscape as a new competitor; the Court quotes it four years later.', record: 'U.S. v. Microsoft, the Court’s Findings of Fact, paragraphs 72 and 134.' },
      { year: 1998, event: 'The United States’ case against Microsoft opens on May 18; trial begins October 19.', record: 'The Antitrust Division’s case page (case open date) and the Court’s Findings of Fact (trial dates).' },
      { year: 1999, event: 'Trial ends June 24; the record closes July 28; Judge Jackson signs 412 findings of fact on November 5.', record: 'The Court’s Findings of Fact, U.S. v. Microsoft, November 5, 1999.' },
      { year: 2001, event: 'The Court of Appeals issues its opinion on June 28, the first of the courts the findings went to next.', record: 'The Antitrust Division’s case page, frequently requested documents.' },
    ],
    workedCase: {
      claim: { words: "this alone won't get people to switch away from Netscape", by: "Bill Gates, in his May 1995 memorandum, as the Court quoted it in its Findings of Fact", source: SRC.findings },
      event: { year: 1999, what: "The Court finds the facts: what Microsoft’s chairman wrote to his executives in 1995, what the company spent on its browser, and what it gave away." },
      closedDoors: {
        hidden: "An internal memorandum from a chairman to his executive staff is written for a closed room; it names the rival and what a decent product will not accomplish by itself.",
        light: "The memorandum was entered into a federal court’s findings of fact and is quoted there in his own words; the closed room is now a public record with paragraph numbers.",
        verse: "\"For there is nothing covered, that shall not be revealed; neither hid, that shall not be known\" (Luke 12:2).",
        heart: "\"Divers weights are an abomination unto the LORD; and a false balance is not good\" (Proverbs 20:23).",
      },
      risk: "A company that decides quality alone will not win, and then spends and gives away to make sure, is weighed by a court on its own words; the memorandum became the weight.",
      opportunity: "The findings carry the figures — the spending, the headcount, the free product — so the weighing can be done by a reader with the record open, not by a narrator’s side.",
      constraint: "The findings are the Court’s account of the facts, not the company’s; the company’s own reply is in other documents on the same case page, and a just weight reads both.",
      economics: [
        { figure: "more than $100 million a year", meaning: "What Microsoft spent each year from 1995 onward developing Internet Explorer, by the Court’s finding.", record: "U.S. v. Microsoft, the Court’s Findings of Fact, November 5, 1999 (Department of Justice)" },
        { figure: "from five or six to more than one thousand", meaning: "The number of developers working on the browser, early 1995 to 1999, by the Court’s finding.", record: "U.S. v. Microsoft, the Court’s Findings of Fact, November 5, 1999 (Department of Justice)" },
        { figure: "$0, free", meaning: "The price at which the company gave the browser away, while also giving other firms things of value to build its usage share, by the Court’s finding.", record: "U.S. v. Microsoft, the Court’s Findings of Fact, November 5, 1999 (Department of Justice)" },
      ],
      steps: [
        "Quote the chairman’s own words as the Court quotes them, and mark them as the defendant’s account of his own strategy.",
        "Set the Court’s figures beside them: the spending, the headcount, the free product.",
        "Weigh without respect of persons: a large company and a small one are read by the same record, and the record here is the Court’s.",
        "Name the other side’s documents on the case page as the record to read before the weight is final.",
      ],
      settled: "The chairman’s words, the annual spending and the growth in developers are in the Court’s findings of fact with their paragraph numbers.",
      stillOpen: "What the browser strategy earned or cost the company in dollars is not in the excerpt this course fetched; the company’s filings are the record for that.",
    },
    quiz: {
      questions: [
        { q: 'What did the court write before it weighed?', options: ['Its opinion of Microsoft', 'Its standard of proof: facts proved by a preponderance of the evidence', 'Nothing'], answer: 1, explain: 'A just weight states the standard first; the findings open by naming it.' },
        { q: 'Which of these do the findings NOT settle?', options: ['Microsoft’s market share above ninety percent', 'That Microsoft enjoyed monopoly power in the relevant market', 'Whether the case was wise to bring'], answer: 2, explain: 'Findings settle conduct and numbers on a record; wisdom and remedy went to other courts, and feelings are not research.' },
      ],
    },
    facilitator: {
      talkingPoints: [
        'The scale is Yahweh’s law: "Just balances, just weights, a just ephah, and a just hin, shall ye have" (Leviticus 19:36); "A false balance is abomination to the LORD" (Proverbs 11:1).',
        'The case by its dates: opened May 18, 1998; tried October 19, 1998 to June 24, 1999; record closed July 28, 1999; 412 findings signed November 5, 1999.',
        'Findings 33 and 35: monopoly power in the relevant market; share above ninety percent every year for a decade. Conduct and numbers, not feelings.',
        'Mark the boundary: the findings settle what that court found on that record — not the wisdom of the suit, not the remedy, not how to feel.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Leviticus 19:35-36. | The competency in a sentence (10): state the standard, then weigh. | Teach it (15): the first page of the findings, then 33 to 35, aloud. | Work it (20): the number, the words, the standard; one sentence supported, one not. | Discussion (10): the prompts. | Send-off (5): write the standard down before your next judgment of a person or a company.',
      discussionPrompts: [
        'Which company did you walk in favouring, and what did the numbered findings do to that?',
        'Why does writing the standard down first make a weight just?',
        'Where is a deceitful bag in your own judgments this week?',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 6. THE CORRECTION
  // ---------------------------------------------------------------------------
  {
    id: 'br6-the-correction',
    title: 'The correction: a record that changes toward the truth',
    bigIdea: 'A record that never changes is either perfect or unread. The Word honours the one that changes toward the truth: "He that covereth his sins shall not prosper: but whoso confesseth and forsaketh them shall have mercy" (Proverbs 28:13), and "The ear that heareth the reproof of life abideth among the wise" (Proverbs 15:31). The Microsoft case was corrected by courts above the court, on dated documents, for seven years; and Blockbuster’s last exhibit said the honest word about itself on the day. The researcher traces a correction as carefully as a claim.',
    inApp: 'Open the Antitrust Division’s case page for U.S. v. Microsoft. Write the five dated documents it lists as frequently requested, in order: the findings of fact, the appeals opinion, the final judgment, the second appeals opinion, the modified final judgment. Beside each, write in one sentence what a correction on that date means for a researcher who had read only the findings. Save it in your Study.',
    anchor: { ref: 'Proverbs 28:13; Proverbs 15:31-32; Proverbs 12:19', theme: 'The Word ties mercy to correction: "He that covereth his sins shall not prosper: but whoso confesseth and forsaketh them shall have mercy" (Proverbs 28:13). It ties wisdom to hearing reproof: "The ear that heareth the reproof of life abideth among the wise. He that refuseth instruction despiseth his own soul: but he that heareth reproof getteth understanding" (Proverbs 15:31-32). And it promises what lasts: "The lip of truth shall be established for ever: but a lying tongue is but for a moment" (Proverbs 12:19).' },
    stories: [
      {
        kind: 'parable', tone: 'light',
        title: 'The Bulletin Board',
        body: 'The church kept a printed bulletin that once announced a wrong date for the men’s breakfast, and forty men showed up on the wrong Saturday. The next bulletin did not pretend. It printed the correction in a box at the top with the old date crossed out and the new one beside it, and it kept that box for a month. Attendance at the breakfast went up. Darrell pointed at the box when he taught this lesson: a record that corrects itself in public is more trustworthy than one that never admits a mistake, and a researcher should read the corrections as closely as the announcements.',
      },
      {
        kind: 'parable', tone: 'sober',
        title: 'The Founder Who Would Not Be Corrected',
        body: 'A man built a small business on a claim about his product that a customer later proved wrong with a simple test. He had two roads. He could correct the claim on his website, take the hit, and keep the customers who valued honesty; or he could argue. He argued for two years, and the claim that could have been fixed in a sentence became a story about him. When he finally corrected it, the correction was true but nobody was left to read it. "The lip of truth shall be established for ever: but a lying tongue is but for a moment" (Proverbs 12:19) is not only a comfort; it is a warning about timing.',
      },
    ],
    benefits: [
      'You read a record the way it is actually built: as a first finding and then a chain of dated corrections, each of which changes what may be said.',
      'You stop citing the first document as if it were the last, and you learn to ask what came after.',
      'You recognise honesty in a company’s own filing, because the honest word about a going concern is a correction in the present tense.',
      'You practise the posture the Word calls wise: hearing reproof, confessing, forsaking, being corrected in public.',
      'You can teach a child to ask of any story: was it corrected later, and by whom, and on what date?',
    ],
    levels: {
      teen: 'Here is the sixth skill. Trace the correction. A good record changes toward the truth. The Word honours that. "He that covereth his sins shall not prosper: but whoso confesseth and forsaketh them shall have mercy" (Proverbs 28:13). "The ear that heareth the reproof of life abideth among the wise" (Proverbs 15:31). A researcher who reads only the first document has read half a story.\n\nGo back to the Microsoft case. The findings of fact came on November 5, 1999. That was not the end. The Antitrust Division’s case page lists what came after, with dates. An appeals court opinion on June 28, 2001. A final judgment on November 12, 2002. A second appeals court opinion on June 30, 2004. A modified final judgment on September 7, 2006. Each one is a court checking a court. That is seven years of correction, on paper, in public. If you read only the findings you would say things that later documents changed. The researcher reads the whole chain.\n\nNow look at Blockbuster. On September 23, 2010 the company filed an exhibit. It did not hide. It listed the ability of the company to continue as a going concern among its risks. It named the chapter 11 cases. That is a company correcting its own story in the present tense. It is a hard sentence. It is an honest one.\n\nHere is the point. Corrections are not embarrassing to a researcher. They are the record working. The Word says the lip of truth lasts. "The lip of truth shall be established for ever: but a lying tongue is but for a moment" (Proverbs 12:19).\n\nYour job. Write the five dated documents from the case page in order. Beside each, write what it means for someone who read only the findings.',
      senior: 'This lesson teaches the class to read a record as a chain rather than a point, The teacher should draw the chain on the board with dates. The sight of seven years of correction on one line changes how people cite the first document.\n\nOpen with the Word’s regard for correction. "He that covereth his sins shall not prosper: but whoso confesseth and forsaketh them shall have mercy" (Proverbs 28:13); "The ear that heareth the reproof of life abideth among the wise. He that refuseth instruction despiseth his own soul: but he that heareth reproof getteth understanding" (Proverbs 15:31-32). Correction is not the failure of a record. It is the record hearing reproof. A researcher who despises it despises his own understanding.\n\nThen draw the chain from the Antitrust Division’s case page, which lists its frequently requested documents with dates: the Court’s Findings of Fact of November 5, 1999; the Court of Appeals opinion of June 28, 2001; the Final Judgment of November 12, 2002; a second Court of Appeals opinion of June 30, 2004; and the Modified Final Judgment of September 7, 2006. Each is a court above or after another court. Each changed what a careful person may say about the case. A researcher who cites the 1999 findings as the last word has stopped reading in the middle of the sentence. The course does not summarise what each opinion held. The case page gives the documents and not their holdings, and a researcher states what the record in front of him says. The assignment is to open them.\n\nThen set the other kind of correction beside it: a company’s own. Blockbuster’s exhibit of September 23, 2010 lists among its risks the ability of the company to continue as a going concern and the outcome of the chapter 11 cases. That is the honest word said on the day, in the company’s own filing. The class should recognise it as a correction in the present tense rather than a confession after the fact. "The lip of truth shall be established for ever: but a lying tongue is but for a moment" (Proverbs 12:19). Send the class to the case page with a narrow assignment. List the five dated documents in order. Write one sentence each on what a correction on that date means for someone who read only the findings.',
    },
    lesson: 'The sixth competency is the one that keeps a researcher from citing the first document as if it were the last. The Word’s regard for correction is high and specific: "He that covereth his sins shall not prosper: but whoso confesseth and forsaketh them shall have mercy" (Proverbs 28:13); "The ear that heareth the reproof of life abideth among the wise. He that refuseth instruction despiseth his own soul: but he that heareth reproof getteth understanding" (Proverbs 15:31-32). A record that is corrected in public has heard reproof. A researcher who reads the corrections as closely as the claims has got understanding.\n\nThe Microsoft case is a chain of corrections that runs for seven years on dated documents, and the Antitrust Division’s case page lists the links. The Court’s Findings of Fact of November 5, 1999 were followed by a Court of Appeals opinion on June 28, 2001, a Final Judgment on November 12, 2002, a second Court of Appeals opinion on June 30, 2004, and a Modified Final Judgment on September 7, 2006. Each document is a court checking a court, and each changed what a careful person may say. This course does not summarise what each opinion held, because the case page gives the documents and their dates rather than their holdings, and the discipline of this course is to say what the record in front of it says; the competency here is to know that the chain exists, to walk it in order, and never to stop at 1999 when the record runs to 2006.\n\nThere is a second kind of correction, and it is the company’s own. On September 23, 2010 Blockbuster filed an exhibit that listed, among the risks to its results, the ability of the company to continue as a going concern and the outcome of the chapter 11 cases. That is not a confession after the fact; it is the honest word said on the day, in the present tense, in the register companies use when everything they say may be held against them. A researcher recognises it as the record correcting its own story while the story is still running.\n\nCorrections are not an embarrassment to research; they are research working. "The lip of truth shall be established for ever: but a lying tongue is but for a moment" (Proverbs 12:19). The first finding is a moment. The corrected record is what lasts. Trace it.',
    voices: [
      { speaker: 'The Antitrust Division’s case page for U.S. v. Microsoft Corporation', year: 2001, where: 'The list of frequently requested documents on the case page, each with its date, including the appeals opinion of June 28, 2001.', source: SRC.casePage, words: 'Court of Appeals Opinion (June 30, 2004) Final Judgment (November 12, 2002) Court’s Findings of Fact (November 5, 1999)', why: 'The chain of corrections as the record-keeper lists it: dated documents after the findings, which a researcher must read in order.' },
      { speaker: 'Blockbuster Inc., in an exhibit filed the day it entered chapter 11', year: 2010, where: 'Exhibit 99.1 to the current report on Form 8-K filed September 23, 2010, in its cautionary note.', source: SRC.blockbuster8k, words: 'those described in filings made by the Company with the U.S. Bankruptcy Court for the Southern District of New York, the ability of the Company to continue as a going concern', why: 'A company correcting its own story in the present tense, on the day, in its own filing.' },
      { speaker: 'Reed Hastings, chief executive of Netflix', year: 2011, where: 'The same post, on what he got wrong.', source: SRC.hastings, words: 'In hindsight, I slid into arrogance based upon past success.', why: 'A correction in the first person: the witness names his own fault.' },
      { speaker: 'Netflix, Inc., in its letter to shareholders', year: 2011, where: 'The same letter, on the pricing change and the rebranding it had cancelled.', source: SRC.netflixLetter, words: 'we greatly upset many domestic Netflix members with our significant DVD-related pricing changes, and to a lesser degree, with the proposed-and-now-cancelled rebranding of our DVD service', why: 'The second witness to the same event, in a filed document: the blog and the letter agree.' },
    ],
    timeline: [
      { year: 1999, event: 'The Court’s Findings of Fact are signed on November 5.', record: 'The Antitrust Division’s case page, frequently requested documents.' },
      { year: 2001, event: 'The Court of Appeals issues its opinion on June 28.', record: 'The Antitrust Division’s case page, appeals court filings.' },
      { year: 2002, event: 'The Final Judgment is entered on November 12.', record: 'The Antitrust Division’s case page, frequently requested documents.' },
      { year: 2004, event: 'A second Court of Appeals opinion issues on June 30.', record: 'The Antitrust Division’s case page, frequently requested documents.' },
      { year: 2006, event: 'The Modified Final Judgment is entered on September 7.', record: 'The Antitrust Division’s case page, frequently requested documents.' },
      { year: 2010, event: 'Blockbuster names the going-concern risk and the chapter 11 cases in its own exhibit on September 23.', record: 'Blockbuster Inc., Form 8-K, exhibit 99.1.' },
      { year: 2011, event: 'Reed Hastings publishes his apology on September 18; the letter to shareholders of October 24 calls the rebranding proposed-and-now-cancelled.', record: 'The Netflix blog as archived by the Wayback Machine; the letter to shareholders, exhibit 99.1.' },
    ],
    workedCase: {
      claim: { words: "In hindsight, I slid into arrogance based upon past success.", by: "Reed Hastings, chief executive of Netflix, September 18, 2011", source: SRC.hastings },
      event: { year: 2011, what: "The chief executive corrects himself in public on September 18; by October 24 the company’s filed letter records the rebranding as proposed and now cancelled." },
      closedDoors: {
        hidden: "Arrogance based on past success is a private condition; nobody outside the company saw it forming, and the man who had it did not see it until the members answered.",
        light: "He named it himself, in public, under his own name; and thirty-six days later the company’s filed letter recorded that the plan he announced had been cancelled.",
        verse: "\"But all things that are reproved are made manifest by the light: for whatsoever doth make manifest is light\" (Ephesians 5:13).",
        heart: "\"He that covereth his sins shall not prosper: but whoso confesseth and forsaketh them shall have mercy\" (Proverbs 28:13).",
      },
      risk: "The post’s own plan — two websites, two charges, ratings that do not carry across — was the risk the members judged; the letter records that the judgment stood and the plan fell.",
      opportunity: "A correction made in the open, with the reason stated, is the one asset a company can create in a bad quarter; the record shows it was made.",
      constraint: "The price increase was not reversed — the post says it would not have changed the price — so the correction was of the manner and the split, not of the cost to the member.",
      economics: [
        { figure: "2 websites, 2 charges", meaning: "What the split would have meant for a member of both services: two sites that did not share ratings or a credit card, and two entries on the statement; the cost the members refused.", record: "Reed Hastings, the Netflix blog, September 18, 2011, as archived by the Wayback Machine" },
        { figure: "36 days", meaning: "From the post of September 18 to the letter of October 24 that records the rebranding as cancelled: the time from the correction of the manner to the correction of the plan.", record: "Reed Hastings, the Netflix blog, September 18, 2011, as archived by the Wayback Machine; Netflix, Inc., letter to shareholders of October 24, 2011, exhibit 99.1 (EDGAR)" },
      ],
      steps: [
        "Read the first correction — the apology and the named fault — for what it changed (the manner) and what it left standing (the price).",
        "Read the second — the filed letter — for what it changed (the plan itself, cancelled) and what it left standing (the pricing).",
        "Tell an open correction from a quiet one: both here carry a name and a date, one on the blog and one in a filing.",
        "Keep the dated copy: the blog page is gone from the company’s site and lives only in the archive, which is why it can still be quoted.",
      ],
      settled: "The chief executive corrected the manner in public and the company cancelled the plan within thirty-six days; both are on dated records in their own words.",
      stillOpen: "What the cancelled rebranding had already cost — the name, the site, the team — is not in the excerpts this course fetched.",
    },
    quiz: {
      questions: [
        { q: 'A researcher cites the 1999 findings as the last word on the Microsoft case. What has he missed?', options: ['Nothing; findings are final', 'Four dated documents through 2006 in which courts corrected and modified the record', 'The podcast'], answer: 1, explain: 'The case page lists an appeals opinion, a final judgment, a second opinion and a modified judgment, through September 7, 2006.' },
        { q: 'What does the Word say about the one who hears reproof?', options: ['He is weak', 'He getteth understanding', 'He should argue'], answer: 1, explain: '"he that heareth reproof getteth understanding" (Proverbs 15:32). A record that changes toward the truth is the record hearing reproof, and the researcher reads the whole chain.' },
      ],
    },
    facilitator: {
      talkingPoints: [
        'Correction is the record hearing reproof: "he that heareth reproof getteth understanding" (Proverbs 15:32).',
        'The chain by date: findings November 5, 1999; appeals opinion June 28, 2001; final judgment November 12, 2002; second opinion June 30, 2004; modified judgment September 7, 2006.',
        'The course does not summarise the holdings, because the case page gives documents and dates, not holdings; the assignment is to open them.',
        'Blockbuster’s exhibit of September 23, 2010 is a correction in the present tense: the honest word said on the day.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Proverbs 15:31-32. | The competency in a sentence (10): trace the correction as carefully as the claim. | Teach it (15): the chain on the board, five dates. | Work it (20): the five documents in order, one sentence each. | Discussion (10): the prompts. | Send-off (5): correct one thing you have said this month, in public, with the date.',
      discussionPrompts: [
        'What would you have said about the case after reading only the findings, and what stops you now?',
        'Why is a company’s honest word on the day a correction and not a confession?',
        'Where does your own record need a box at the top with the old date crossed out?',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 7. WHAT THE WORD SETTLES
  // ---------------------------------------------------------------------------
  {
    id: 'br7-what-the-word-settles',
    title: 'What the Word settles and what the record must supply',
    bigIdea: 'Some questions a business researcher never has to research, because the Word answered them: "Thou shalt not have in thy bag divers weights, a great and a small" (Deuteronomy 25:13); "the hire of the labourers who have reaped down your fields, which is of you kept back by fraud, crieth" (James 5:4); "Ye cannot serve God and mammon" (Matthew 6:24). Whether fraud is wrong is settled. What a company actually did, on what date, on what record, is what research must supply. Keeping the two apart is the seventh competency.',
    inApp: 'Make two lists. On the first, write three questions about any rivalry in the course that the Word has already settled (write the verse beside each). On the second, write three questions the Word leaves to the record (write the record beside each). Then write one sentence about the Microsoft findings that belongs on the second list, not the first. Save it in your Study.',
    anchor: { ref: 'Deuteronomy 25:13-16; James 5:4; Proverbs 22:16; Luke 16:10; Matthew 6:24', theme: 'The verdicts the Word has already given, which no rivalry and no retelling reopens, and which a researcher states plainly before he opens a single filing: "Thou shalt not have in thy bag divers weights, a great and a small" (Deuteronomy 25:13); "For all that do such things, and all that do unrighteously, are an abomination unto the LORD thy God" (Deuteronomy 25:16); "He that oppresseth the poor to increase his riches, and he that giveth to the rich, shall surely come to want" (Proverbs 22:16); "He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much" (Luke 16:10); "Ye cannot serve God and mammon" (Matthew 6:24).' },
    stories: [
      {
        kind: 'parable', tone: 'light',
        title: 'Two Columns on the Whiteboard',
        body: 'When the teens finished the Microsoft lesson one of them asked whether Microsoft was evil. The youth leader drew two columns on the whiteboard. On the left he wrote SETTLED and put three verses under it: divers weights, the hire kept back by fraud, faithful in that which is least. On the right he wrote RECORD and put three findings under it: the case opened May 18, 1998; the findings signed November 5, 1999; the share above ninety percent. Then he asked which column the word evil belonged in. Nobody could put it in either. He said that was the right answer: it was a feeling, not a finding, and the Word had not asked them to research feelings.',
      },
      {
        kind: 'parable', tone: 'sober',
        title: 'The Two Sets of Books',
        body: 'A man in the community kept one ledger for the bank and one for himself, and for a while he told himself that everybody in his trade did the same and that the second book was only planning. The Word had settled the matter three thousand years before he opened either book: "Thou shalt not have in thine house divers measures, a great and a small" (Deuteronomy 25:14). When the second book came out, nobody needed a court to tell them what it was. What the court supplied was the dates and the amounts. What the Word had supplied was the verdict, and it had been waiting the whole time.',
      },
    ],
    benefits: [
      'You stop researching what is already settled. Fraud, false weights, wages withheld, oppression of the poor: the Word has spoken, and no rivalry reopens it.',
      'You stop pretending the Word settles what it leaves to the record. Dates, amounts, shares and conduct are for the filing and the court to supply.',
      'You can say a hard settled thing plainly and a hard unsettled thing carefully, and you know which is which.',
      'You practise faithfulness in the least, which is the standard Jesus set for anyone who would be trusted with much.',
      'You can teach a child the two columns: what the Word settled, and what the record must supply.',
    ],
    levels: {
      teen: 'Here is the seventh skill. Know what is settled. Some questions are already answered. The Word answered them. False weights are one. "Thou shalt not have in thy bag divers weights, a great and a small" (Deuteronomy 25:13). Wages kept back by fraud are another. James says the hire of the labourers, kept back by fraud, "crieth" (James 5:4). Serving money is another. "Ye cannot serve God and mammon" (Matthew 6:24). You never have to research whether fraud is wrong. It is settled.\n\nOther questions are not settled by the Word. They are settled by the record. Did a company hold more than ninety percent of a market? The court found that. Did a company file for chapter 11 on September 23, 2010? The company’s own exhibit says so. When did a trade dispute begin? The WTO summary gives October 6, 2004. Those are record questions. You go to the filing, the finding, the summary.\n\nHere is the mistake to avoid. Do not put a settled question on the record list. Do not put a record question on the settled list. Whether Microsoft was faithful in the least is a Word question. Whether its share stood above ninety percent is a record question. The judge found the second. The judge did not rule on the first. He was not asked to.\n\nJesus set the standard for anyone who wants to be trusted. "He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much" (Luke 16:10). That is for you before it is for any company.\n\nYour job. Two lists. Three settled questions with their verses. Three record questions with their records. Then one sentence about the Microsoft findings that belongs on the record list.',
      senior: 'This lesson exists to stop a confusion that runs in both directions, and the teacher should name both directions before the class does anything else. The first confusion treats a settled matter as if research could reopen it; the second treats a record matter as if the Word had ruled on it. Both make bad researchers and worse witnesses.\n\nBegin with what the Word has settled, read whole. "Thou shalt not have in thy bag divers weights, a great and a small. Thou shalt not have in thine house divers measures, a great and a small" (Deuteronomy 25:13-14); "For all that do such things, and all that do unrighteously, are an abomination unto the LORD thy God" (Deuteronomy 25:16). "Behold, the hire of the labourers who have reaped down your fields, which is of you kept back by fraud, crieth" (James 5:4). "He that oppresseth the poor to increase his riches, and he that giveth to the rich, shall surely come to want" (Proverbs 22:16). "Ye cannot serve God and mammon" (Matthew 6:24). None of these is a research question. A rivalry, however dramatic, does not reopen them, and a course that staged them as open would be teaching the both-sides posture this platform exists to remove.\n\nThen mark what the Word leaves to the record. Whether Microsoft’s share stood above ninety percent every year for a decade is a record question, and the court found it on November 5, 1999. Whether Blockbuster faced a going-concern risk on September 23, 2010 is a record question, and the company’s own exhibit answers it. When the United States asked for consultations over Airbus is a record question, and the WTO summary gives October 6, 2004. None of these is answered by a verse, and a researcher who says the Word settles them has borrowed authority he was not given.\n\nThe hinge is Jesus’ standard for trust: "He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much" (Luke 16:10). It is a verdict on character, and it belongs on the settled list; whether a particular company met it on a particular day is a record question that the court, in the Microsoft case, was not asked and did not answer. Send the class to its two lists and insist on the discipline that nothing crosses the line between them.',
    },
    lesson: 'The seventh competency is a boundary, and it protects research from two opposite errors. The Word has settled certain questions, and research does not reopen them: "Thou shalt not have in thy bag divers weights, a great and a small. Thou shalt not have in thine house divers measures, a great and a small" (Deuteronomy 25:13-14), with the verdict attached, "For all that do such things, and all that do unrighteously, are an abomination unto the LORD thy God" (Deuteronomy 25:16). "Behold, the hire of the labourers who have reaped down your fields, which is of you kept back by fraud, crieth" (James 5:4). "He that oppresseth the poor to increase his riches, and he that giveth to the rich, shall surely come to want" (Proverbs 22:16). "Ye cannot serve God and mammon" (Matthew 6:24). No rivalry, however it is dramatised, puts those back on the table, and a course that staged them as open would be doing the one thing this platform was built to stop.\n\nThe Word has also left certain questions to the record, and research does not pretend a verse answers them. Whether Microsoft’s share of the market for Intel-compatible PC operating systems stood above ninety percent every year for a decade is a record question, and a court found it on November 5, 1999 after a trial that opened on October 19, 1998. Whether Blockbuster faced the risk of not continuing as a going concern on September 23, 2010 is a record question, and the company’s own exhibit filed that day answers it. When the United States first asked the European side to consult over Airbus is a record question, and the WTO’s summary gives October 6, 2004. Whether the European Communities’ $19.1 billion estimate over 1989 to 2006 was correct is a record question that a panel weighed. A researcher who claims the Word settles any of these has borrowed an authority he was never given.\n\nThe discipline is to keep the two lists apart and to be honest about which list a sentence belongs on. Whether a company was faithful in that which is least is a Word question: "He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much" (Luke 16:10). Whether that company held a given share on a given date is a record question. The judge in the Microsoft case answered the second; he was not asked the first, and a researcher does not put words in a court’s mouth any more than he puts them in Scripture’s.\n\nWhat the Word settles, say plainly and without apology. What the record must supply, go and get, and cite. What neither has settled — a motive, a feeling, a verdict on a whole life — say that you do not have it. That is the seventh competency, and it is the one that keeps a researcher honest in both directions at once.',
    voices: [
      { speaker: 'Judge Thomas Penfield Jackson, in the Court’s Findings of Fact', year: 1999, where: 'Finding 412, the last of the findings, signed November 5, 1999, on the Antitrust Division’s site.', source: SRC.findings, words: 'Most harmful of all is the message that Microsoft’s actions have conveyed to every enterprise with the potential to innovate in the computer industry.', why: 'A record-list sentence: a court’s finding of effect, which is what research supplies and a verse does not.' },
      { speaker: 'The WTO Secretariat, summarising dispute DS353', year: 2011, where: 'The Secretariat’s summary of the dispute, under “Summary of key findings,” the European Communities’ estimate of subsidies to Boeing.', source: SRC.ds353, words: 'More than half of this amount was accounted for by the value of the alleged NASA R&D subsidies, which, according to the European Communities, was $10.4 billion in this period.', why: 'A record-list number with its own attribution — what a record supplies, stated as the record states it.' },
      { speaker: 'Jim Keyes, chairman and chief executive of Blockbuster', year: 2010, where: 'The company’s press release on the day it filed for chapter 11, September 23, 2010, filed with the Securities and Exchange Commission.', source: SRC.blockbusterRelease, words: 'After a careful and thorough analysis, we determined that the process announced today provides the optimal path for recapitalizing our balance sheet and positioning Blockbuster for the future as we continue to transform our business model to meet the evolving preferences of our customers.', why: 'The man at the head of the losing company, on the day, in his own words on the record.' },
      { speaker: 'Reed Hastings, chief executive of Netflix', year: 2011, where: 'The same post, announcing the split of the DVD service.', source: SRC.hastings, words: 'It\'s hard for me to write this after over 10 years of mailing DVDs with pride, but we think it is necessary and best', why: 'The decision as he announced it, so the later reversal can be read against his own words.' },
    ],
    timeline: [
      { year: 1989, event: 'The first year of the period over which the European Communities counted alleged subsidies to Boeing.', record: 'WTO dispute DS353, Secretariat summary.' },
      { year: 1998, event: 'The Microsoft trial opens on October 19.', record: 'The Court’s Findings of Fact, U.S. v. Microsoft.' },
      { year: 1999, event: 'The court finds Microsoft’s share above ninety percent and signs its findings on November 5.', record: 'The Court’s Findings of Fact, findings 35 and 412.' },
      { year: 2004, event: 'The United States requests consultations over Airbus on October 6.', record: 'WTO dispute DS316, Secretariat summary.' },
      { year: 2006, event: 'The last year of the counted period in the European Communities’ estimate.', record: 'WTO dispute DS353, Secretariat summary.' },
      { year: 2010, event: 'Blockbuster names the going-concern risk in its own exhibit on September 23.', record: 'Blockbuster Inc., Form 8-K, exhibit 99.1.' },
      { year: 2011, event: 'The DS353 panel report, carrying the $19.1 billion estimate, is circulated on March 31.', record: 'WTO dispute DS353, Secretariat summary.' },
      { year: 2019, event: 'On October 2 the United States trade office announces a $7.5 billion award in the Airbus subsidies case, the other side of the pair of disputes.', record: 'Office of the United States Trade Representative, press release of October 2, 2019.' },
    ],
    workedCase: {
      claim: { words: "The European Communities estimated that the total amount of the alleged subsidies was $19.1 billion between 1989 and 2006", by: "The World Trade Organization Secretariat, summarizing dispute DS353", source: SRC.ds353 },
      event: { year: 2011, what: "The panel report in the Boeing dispute is circulated to members on March 31, with the claimed subsidies counted by category and by amount." },
      closedDoors: {
        hidden: "Tax breaks, research payments and access to government facilities are granted in legislatures and agencies, line by line, and each side keeps its own accounting of what the other received.",
        light: "The dispute forced both accountings into one public record: ten categories of claimed measures, an estimated total, and years later an award the trade office announced to the dollar.",
        verse: "\"For God shall bring every work into judgment, with every secret thing, whether it be good, or whether it be evil\" (Ecclesiastes 12:14).",
        heart: "\"A false balance is abomination to the LORD: but a just weight is his delight\" (Proverbs 11:1).",
      },
      risk: "Each side’s figure is a claim by a party to the dispute; a reader who takes either as settled has let the party weigh its own cause.",
      opportunity: "The Word settles the standard — a just weight, no respect of persons — before any panel sits, so the researcher knows what to ask of the record: who counted, and by what measure.",
      constraint: "The Secretariat’s summary reports what the complainant estimated, not what the panel found in every category; the panel report itself is the record for the finding.",
      economics: [
        { figure: "$19.1 billion, 1989–2006", meaning: "The European Communities’ estimate of the alleged subsidies to Boeing’s large civil aircraft division, across ten categories of measures.", record: "World Trade Organization, dispute DS353, the Secretariat’s summary" },
        { figure: "$7.5 billion", meaning: "The award the United States trade office announced on October 2, 2019 in the Airbus subsidies case, the other side of the same pair of disputes.", record: "Office of the United States Trade Representative, press release of October 2, 2019" },
      ],
      steps: [
        "Mark what the Word settles before the record is opened: the weight must be just and the same for both parties.",
        "Read the claim as a party’s estimate, name who made it and over what years, and keep it apart from the panel’s finding.",
        "Set the other side’s figure beside it — the award the trade office announced — and notice both numbers come from parties, not from a neutral scale.",
        "Name the panel reports as the record where the weighing was actually done, and that this course fetched the summaries, not the reports.",
      ],
      settled: "The complainant’s estimate, its period and its categories are on the Secretariat’s record; the award figure is on the trade office’s record; the Word’s standard for weighing them is settled.",
      stillOpen: "What the panels found subsidy by subsidy, and what each side actually paid or withdrew, is in the panel reports and later filings this course did not fetch.",
    },
    quiz: {
      questions: [
        { q: 'Which question belongs on the settled list?', options: ['Whether Microsoft’s share stood above ninety percent', 'Whether keeping back wages by fraud is wrong', 'When the DS316 consultations began'], answer: 1, explain: '"which is of you kept back by fraud, crieth" (James 5:4) — settled by the Word before any research began, and never reopened by any rivalry or any retelling.' },
        { q: 'Which question belongs on the record list?', options: ['Whether divers weights are an abomination', 'Whether Blockbuster faced a going-concern risk on September 23, 2010', 'Whether a man can serve two masters'], answer: 1, explain: 'A date and a condition on a filing are what the record supplies; the company’s own exhibit answers it.' },
      ],
    },
    facilitator: {
      talkingPoints: [
        'Settled by the Word: divers weights (Deuteronomy 25:13-16), wages kept back by fraud (James 5:4), oppressing the poor (Proverbs 22:16), serving mammon (Matthew 6:24). No rivalry reopens them.',
        'Left to the record: shares, dates, filings, findings, estimates — the court on November 5, 1999, the exhibit on September 23, 2010, the WTO on October 6, 2004.',
        'The hinge: "He that is faithful in that which is least is faithful also in much" (Luke 16:10) is a Word question; whether a company met it on a day is a record question the court was not asked.',
        'Say the settled plainly; go get the record; say plainly what neither has settled.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Deuteronomy 25:13-16. | The competency in a sentence (10): two lists, and nothing crosses the line. | Teach it (15): the settled verses, then the record questions, side by side. | Work it (20): three and three, with verses and records; one findings sentence placed. | Discussion (10): the prompts. | Send-off (5): write one settled thing and one record thing about your own work this week.',
      discussionPrompts: [
        'Which settled question had you been treating as open, and why?',
        'Which record question had you been treating as settled by a verse, and what record actually answers it?',
        'What does faithfulness in that which is least look like in your business this month?',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 8. WRITE IT IN ORDER
  // ---------------------------------------------------------------------------
  {
    id: 'br8-write-it-in-order',
    title: 'Write it in order: the sourced case brief',
    bigIdea: 'Research that ends in a feeling has not ended. Yahweh told Habakkuk what to do with what he had seen: "Write the vision, and make it plain upon tables, that he may run that readeth it" (Habakkuk 2:2). Luke wrote "in order" (Luke 1:3) so the reader could know the certainty. The eighth competency is the product of the other seven: two dated paragraphs, one on Netflix and Blockbuster and one on the Microsoft case, every sentence carrying its record, written plain enough that someone else may run with it.',
    inApp: 'Write two paragraphs. First: Netflix and Blockbuster from August 1997 to February 2012, every sentence dated and sourced to a filing or the show page. Second: the Microsoft case from May 18, 1998 to September 7, 2006, every sentence dated and sourced to the findings or the case page. Then read each back and ask of every sentence: how do you know? Save both in your Study.',
    anchor: { ref: 'Habakkuk 2:2; Luke 1:3-4; Proverbs 22:20-21', theme: 'The command to write: "Write the vision, and make it plain upon tables, that he may run that readeth it" (Habakkuk 2:2). The method of writing: "to write unto thee in order" (Luke 1:3), "That thou mightest know the certainty of those things" (Luke 1:4). And the purpose of writing: "That I might make thee know the certainty of the words of truth; that thou mightest answer the words of truth to them that send unto thee" (Proverbs 22:21).' },
    stories: [
      {
        kind: 'parable', tone: 'light',
        title: 'The Brief on the Refrigerator',
        body: 'Marcus, who had come in the door eight weeks earlier repeating an episode, taped two paragraphs to the refrigerator. Each sentence had a date and, in brackets, where it came from: the 10-K, the 8-K, the findings, the case page, the show page. His daughter read them aloud and asked, after each sentence, how do you know, and each time he pointed at the bracket. When she got to the sentence that said why Blockbuster failed, he had written: the record I have does not say. She said that was her favourite sentence. He said it had been the hardest one to write.',
      },
      {
        kind: 'parable', tone: 'sober',
        title: 'The Report Nobody Could Check',
        body: 'A consultant handed a church board a forty-page report recommending a building loan, full of confident sentences about what other churches had done. A deacon asked for the source of one sentence, then another. There were none. The report was a feeling with a cover page. The board did not reject the loan; it rejected the report, and asked for two pages in which every sentence carried its record. The two pages took a week and changed the decision. "Write the vision, and make it plain upon tables, that he may run that readeth it" (Habakkuk 2:2) is a standard for consultants as much as prophets.',
      },
    ],
    benefits: [
      'You finish. Research that ends in two sourced paragraphs has produced something another person can check, run with, and correct.',
      'You learn the shape of a case brief: dated sentences, each with its record in brackets, and an honest sentence where the record is silent.',
      'You give the podcast its credit in writing, as the doorway it was, beside the filings it pointed to.',
      'You practise the purpose the Word gives for writing: that the reader may know the certainty of the words of truth and answer with them.',
      'You can teach a child the last question of every sentence: how do you know?',
    ],
    levels: {
      teen: 'Here is the last skill. Write it in order. With sources. Yahweh told Habakkuk to do that. "Write the vision, and make it plain upon tables, that he may run that readeth it" (Habakkuk 2:2). Plain enough that a reader can run with it. Luke wrote "in order" (Luke 1:3) so the reader could know the certainty. Research that ends in a feeling is not finished.\n\nHere is the first paragraph, as a model. Netflix was incorporated in Delaware in August 1997. It says so in its own annual report. It completed its initial public offering in May 2002. Same report. On September 23, 2010 Blockbuster filed an exhibit that listed the ability of the company to continue as a going concern among its risks and named its chapter 11 cases. Netflix filed its report for 2011 on February 10, 2012 and named Blockbuster among its DVD rental competitors. In January 2018 Wondery introduced Business Wars, and on February 6, 2018 its first episode told this story as drama. Why Blockbuster failed: the record I have does not say.\n\nHere is the second. The United States opened its case against Microsoft on May 18, 1998. The trial ran from October 19, 1998 to June 24, 1999. On November 5, 1999 the court signed 412 findings, including that Microsoft held above ninety percent of its market and enjoyed monopoly power. The appeals court gave its opinion on June 28, 2001. A final judgment came on November 12, 2002. A second appeals opinion came on June 30, 2004. A modified final judgment came on September 7, 2006.\n\nEvery sentence has a date. Every sentence has a record. Now ask of each one: how do you know? If you can point at the bracket, it stays. If you cannot, it goes or it gets the honest words: the record I have does not say.\n\nYour job. Write your own two paragraphs. Dated. Sourced. Then read them back and ask how do you know, every time.',
      senior: 'The last lesson is the product, and the teacher’s job is to make the class produce it rather than talk about it. The Word gives the form and the purpose in three places: "Write the vision, and make it plain upon tables, that he may run that readeth it" (Habakkuk 2:2); "to write unto thee in order" (Luke 1:3) so that the reader "mightest know the certainty of those things" (Luke 1:4); and "That I might make thee know the certainty of the words of truth; that thou mightest answer the words of truth to them that send unto thee" (Proverbs 22:21). Plain, in order, with certainty, so the reader can answer with it.\n\nModel the first paragraph with the class, sentence by sentence, bracket by bracket. Netflix was incorporated in Delaware in August 1997 and completed its initial public offering in May 2002 (its Form 10-K for 2011). On September 23, 2010 Blockbuster filed an exhibit naming its chapter 11 cases and the ability of the company to continue as a going concern (its Form 8-K, exhibit 99.1). On February 10, 2012 Netflix filed its annual report for 2011, naming Blockbuster and Redbox among DVD rental outlets and kiosk services (the same 10-K). On January 19, 2018 Wondery introduced Business Wars, and on February 6, 2018 its first episode opened the Netflix and Blockbuster series and credited the story to Marc Randolph and Reed Hastings around 1997 (the show page). Why Blockbuster failed: the record assembled here does not say, and the sentence should say so.\n\nModel the second. The case opened May 18, 1998 (the case page). The trial ran October 19, 1998 to June 24, 1999, the record closed July 28, 1999, and the court signed 412 findings on November 5, 1999, among them that Microsoft’s share stood above ninety percent every year for a decade and that it enjoyed monopoly power in the relevant market (the findings). The Court of Appeals issued its opinion June 28, 2001; the Final Judgment was entered November 12, 2002; a second appeals opinion issued June 30, 2004; the Modified Final Judgment was entered September 7, 2006 (the case page). What each later document held: not summarised here, because the case page gives dates and documents, and the reader is sent to them.\n\nThen make the class read every sentence back with one question, how do you know, and require that any sentence without a bracket either gets one or gets the honest words. Credit the podcast in the brief as the doorway, by name and date, and close the course where it began: count first, establish by witnesses, write it plain.',
    },
    lesson: 'The eighth competency is the one the other seven exist for. Research that ends in a feeling has not ended; it ends in a written record another person can check. Yahweh’s instruction to Habakkuk is the standard: "Write the vision, and make it plain upon tables, that he may run that readeth it" (Habakkuk 2:2). Luke’s preface is the method: "to write unto thee in order, most excellent Theophilus, That thou mightest know the certainty of those things, wherein thou hast been instructed" (Luke 1:3-4). Solomon states the purpose: "That I might make thee know the certainty of the words of truth; that thou mightest answer the words of truth to them that send unto thee" (Proverbs 22:21).\n\nThe first paragraph, as the course would write it. Netflix was incorporated in Delaware in August 1997 and completed its initial public offering in May 2002, by its own annual report. On September 23, 2010 Blockbuster filed a current report whose exhibit listed the ability of the company to continue as a going concern among its risks and named its chapter 11 cases. On February 10, 2012 Netflix filed its annual report for the year 2011, describing its market as intensely competitive and naming DVD rental outlets and kiosk services such as Blockbuster and Redbox among its competitors. On January 19, 2018 Wondery introduced Business Wars, hosted by David Brown, and on February 6, 2018 its first episode opened an eight-part series on Netflix and Blockbuster and placed the beginning of the story around 1997 with Marc Randolph and Reed Hastings. Why Blockbuster failed: the record assembled here does not say, and the brief says so rather than borrowing the podcast’s scene.\n\nThe second paragraph. The United States opened its case against Microsoft on May 18, 1998. The actions were tried without a jury between October 19, 1998 and June 24, 1999; the record closed on July 28, 1999; and on November 5, 1999 the court signed 412 findings of fact, among them that Microsoft’s share of the market for Intel-compatible PC operating systems stood above ninety percent every year for a decade and that it enjoyed monopoly power in the relevant market. The Court of Appeals issued its opinion on June 28, 2001; the Final Judgment was entered on November 12, 2002; a second Court of Appeals opinion issued on June 30, 2004; and the Modified Final Judgment was entered on September 7, 2006. What each later document held is not summarised in this brief, because the case page supplies the documents and their dates and the reader is sent to them.\n\nEvery sentence carries a date and a record; the two that do not carry a record carry the honest words instead. That is the form: plain enough to run with, ordered enough to give certainty, sourced enough to answer with. The podcast is credited in the brief by name and date as the doorway it was. And the last question of the course is the one to ask of every sentence you will ever write about a company: how do you know?',
    voices: [
      { speaker: 'Wondery, the episode note for the first Business Wars episode', year: 2018, where: 'The note beside “Netflix vs Blockbuster - Sudden Death,” episode 1, February 6, 2018, on the show page as served through Audible.', source: SRC.wondery, words: 'This is episode 1 of an 8-part series on the brutal business battle between Netflix and Blockbuster, and later HBO.', why: 'The doorway credited in its own words, by date, in the brief that walks through it to the record.' },
      { speaker: 'Netflix, Inc., in its annual report for 2011', year: 2012, where: 'Item 1, “Competition,” of the Form 10-K for the year ended December 31, 2011, filed February 10, 2012.', source: SRC.netflix10k, words: 'DVD rental outlets and kiosk services, such as Blockbuster and Redbox; entertainment video retailers, such as Best Buy, Wal-Mart and Amazon.com.', why: 'The record naming the rival in the company’s own filing: the sentence the brief cites instead of the scene.' },
      { speaker: 'The Boeing Company, in its annual report', year: 2020, where: 'Item 1 of the Form 10-K for the year ended December 31, 2019, filed January 31, 2020: the paragraph headed Competition.', source: SRC.boeing10k, words: 'We face aggressive international competitors who are intent on increasing their market share, such as Airbus and other entrants from Russia, China and Japan.', why: 'One party to the dispute naming the other, under its own signature, in a sworn filing.' },
      { speaker: 'Jim Keyes, chairman and chief executive of Blockbuster', year: 2010, where: 'The company’s press release on the day it filed for chapter 11, September 23, 2010, filed with the Securities and Exchange Commission.', source: SRC.blockbusterRelease, words: 'After a careful and thorough analysis, we determined that the process announced today provides the optimal path for recapitalizing our balance sheet and positioning Blockbuster for the future as we continue to transform our business model to meet the evolving preferences of our customers.', why: 'The man at the head of the losing company, on the day, in his own words on the record.' },
    ],
    timeline: [
      { year: 1997, event: 'Netflix is incorporated in Delaware in August; the podcast later places the story’s beginning around this year.', record: 'Netflix, Inc., Form 10-K for 2011; the Business Wars episode note.' },
      { year: 1998, event: 'The Microsoft case opens May 18; trial begins October 19.', record: 'The Antitrust Division’s case page; the Court’s Findings of Fact.' },
      { year: 1999, event: 'Trial ends June 24; the record closes July 28; the findings are signed November 5.', record: 'The Court’s Findings of Fact.' },
      { year: 2001, event: 'The Court of Appeals issues its opinion on June 28.', record: 'The Antitrust Division’s case page.' },
      { year: 2002, event: 'Netflix completes its initial public offering in May; the Final Judgment in the Microsoft case is entered November 12.', record: 'Netflix, Inc., Form 10-K for 2011; the Antitrust Division’s case page.' },
      { year: 2004, event: 'A second Court of Appeals opinion issues on June 30.', record: 'The Antitrust Division’s case page.' },
      { year: 2006, event: 'The Modified Final Judgment is entered on September 7.', record: 'The Antitrust Division’s case page.' },
      { year: 2009, event: 'On August 31 Disney announces it will acquire Marvel for about $4 billion, $50 a Marvel share on that Friday’s closing price; a figure in the brief.', record: 'The Walt Disney Company, press release, “Disney to Acquire Marvel Entertainment,” August 31, 2009.' },
      { year: 2010, event: 'Blockbuster files its chapter 11 exhibit on September 23.', record: 'Blockbuster Inc., Form 8-K, exhibit 99.1.' },
      { year: 2011, event: 'The fiscal year the Netflix report covers ends on December 31.', record: 'Netflix, Inc., Form 10-K for the year ended December 31, 2011, cover page.' },
      { year: 2012, event: 'Netflix files its annual report for 2011 on February 10.', record: 'EDGAR accession 0001193125-12-053009.' },
      { year: 2018, event: 'Wondery introduces Business Wars on January 19; the first episode follows on February 6.', record: 'The Business Wars show page, episode list.' },
      { year: 2019, event: 'The fiscal year Boeing’s annual report covers ends on December 31; the report is filed the next January.', record: 'The Boeing Company, Form 10-K for the year ended December 31, 2019, cover page.' },
      { year: 2020, event: 'Boeing files its annual report for 2019 on January 31, naming Airbus among the aggressive international competitors it faces.', record: 'The Boeing Company, Form 10-K for 2019, Item 1, “Competition.”' },
    ],
    workedCase: {
      claim: { words: "We face aggressive international competitors who are intent on increasing their market share, such as Airbus and other entrants from Russia, China and Japan.", by: "The Boeing Company, in its annual report for 2019, filed January 31, 2020", source: SRC.boeing10k },
      event: { year: 2020, what: "Boeing files its annual report and names its competitors under its own signature; the sentence closes the course’s timeline from a founding in 1997 to a sworn filing." },
      closedDoors: {
        hidden: "A company’s view of its rivals is formed in strategy rooms; what it fears and what it plans are not said aloud to the market by choice.",
        light: "The securities law puts a version of it in the light every year: the annual report must state the competition the company faces, under its signature, and this one names Airbus, Russia, China and Japan.",
        verse: "\"Neither is there any creature that is not manifest in his sight: but all things are naked and opened unto the eyes of him with whom we have to do\" (Hebrews 4:13).",
        heart: "\"Take heed, and beware of covetousness: for a man’s life consisteth not in the abundance of the things which he possesseth\" (Luke 12:15).",
      },
      risk: "A brief written from podcasts and memory will carry dates and figures no filing supports, and a reader who checks one will discard the rest.",
      opportunity: "Every figure in this course sits on a filing, a finding, a summary or a release with a date, so the case brief can be written in order with a record under every line.",
      constraint: "The brief may state only what the fetched records carry; where the record is a party’s estimate or a company’s own view, the brief must say whose it is.",
      economics: [
        { figure: "$125 million · 3,000 stores · 125,000 titles", meaning: "Blockbuster on the day it filed: the financing, the stores, the library, from the company’s own release.", record: "Blockbuster Inc., press release of September 23, 2010, exhibit 99.1 to the Form 8-K (EDGAR)" },
        { figure: "$7.99 · more than doubled", meaning: "Netflix in the quarter it apologised: the streaming price and the growth in content spending, from the filed letter.", record: "Netflix, Inc., letter to shareholders of October 24, 2011, exhibit 99.1 (EDGAR)" },
        { figure: "$50 a share · about $4 billion · 5,000 characters", meaning: "Disney buying Marvel, from the buyer’s release.", record: "The Walt Disney Company, press release of August 31, 2009" },
        { figure: "more than $100 million a year · 5 or 6 to more than 1,000 developers", meaning: "Microsoft building the browser, from the Court’s findings.", record: "U.S. v. Microsoft, the Court’s Findings of Fact, November 5, 1999 (Department of Justice)" },
        { figure: "$19.1 billion claimed · $7.5 billion awarded", meaning: "Boeing and Airbus, from the Secretariat’s summary and the trade office’s release.", record: "World Trade Organization, dispute DS353, the Secretariat’s summary; Office of the United States Trade Representative, press release of October 2, 2019" },
      ],
      steps: [
        "Lay the figures out in date order from the founding in 1997 to the filing in 2020, each with the record it came from.",
        "Write one sentence per figure that names whose figure it is: the company’s, the Court’s, the complainant’s, the trade office’s.",
        "Keep the settled and the open in the same brief: what the records carry and what this course did not fetch.",
        "Close with the Word that stood before any of it: a just weight, and a man’s life not measured by what he possesses.",
      ],
      settled: "Every figure in the brief is on a dated record in the words of the party that filed, found, summarized or announced it.",
      stillOpen: "The panel reports, the later Netflix and Blockbuster filings, and the negotiation behind the Marvel deal are the records the brief names as still to open.",
    },
    quiz: {
      questions: [
        { q: 'A sentence in your brief has no record behind it. What do you do?', options: ['Leave it; it sounds right', 'Give it a record, or give it the honest words: the record I have does not say', 'Cite the podcast scene'], answer: 1, explain: 'Every sentence carries its record or carries the honest words; a scene is a doorway, not a record.' },
        { q: 'Why did Yahweh tell Habakkuk to make it plain upon tables?', options: ['So it would look official', 'That he may run that readeth it', 'So nobody could check it'], answer: 1, explain: '"that he may run that readeth it" (Habakkuk 2:2) — written plainly and in order so that another person can take it up and go check it.' },
      ],
    },
    facilitator: {
      talkingPoints: [
        'The form: "Write the vision, and make it plain upon tables, that he may run that readeth it" (Habakkuk 2:2); the method: "in order" (Luke 1:3); the purpose: "answer the words of truth" (Proverbs 22:21).',
        'Paragraph one by date: August 1997, May 2002, September 23, 2010, February 10, 2012, January 19 and February 6, 2018 — each with its record in brackets; the why left honest.',
        'Paragraph two by date: May 18, 1998; October 19, 1998 to June 24, 1999; November 5, 1999; June 28, 2001; November 12, 2002; June 30, 2004; September 7, 2006.',
        'The last question of every sentence: how do you know? Credit the podcast as the doorway, by name and date.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Habakkuk 2:2. | The competency in a sentence (10): write it in order, with its record. | Teach it (15): model paragraph one, bracket by bracket. | Work it (20): each person writes both paragraphs. | Discussion (10): read back with how do you know. | Send-off (5): tape your brief where the family can read it, and correct it when the record does.',
      discussionPrompts: [
        'Which sentence was hardest to source, and what did you write instead?',
        'How does it feel to write the record I have does not say — and why is that sentence the strongest one on the page?',
        'What will you write next, in order, with its record?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // 9 · FOLLOW THE MONEY TO THE OIL — one commodity, every industry, worldwide
  // (2026-09-24, Darrell: "Tie all the money tied to oil and how that impacts
  // the economy worldwide... comprehensive data driven understanding from all
  // industries which is why business wars was a source I gave for context
  // especially in American culture and history"). Every figure below is from a
  // record the runner fetched (runs 35948713733 and 35949217702): the Federal
  // Reserve's own histories of the two oil shocks and the Great Inflation, five
  // Energy Information Administration pages, the Supreme Court's Standard Oil
  // opinion (221 U.S. 1) and the Energy Department's reserve page. OPEC's own
  // page refused the runner (403) and is not used.
  // ---------------------------------------------------------------------------
  {
    id: 'br9-follow-the-oil',
    title: 'Follow the money to the oil: one commodity, every industry, worldwide',
    bigIdea: 'Every rivalry this course has worked ran on one commodity. Netflix shipped discs by truck; Boeing’s jets burn it; the Court’s first great monopoly case was about it. Yahweh names it as the store of a wise house: "There is treasure to be desired and oil in the dwelling of the wise; but a foolish man spendeth it up" (Proverbs 21:20). The ninth competency applies the other eight to the money tied to oil: a price that quadrupled in three months in 1973 and 1974 and reached every industry; a nation that imported most of its oil in 1977 and became a net exporter in 2020; a company that controlled ninety per cent of the business by 1899; and a reserve of 714 million barrels laid up against the next cut, the way Joseph laid up corn.',
    inApp: 'Open the lesson’s economics table and pick one figure: the barrel price of January 1974, the transportation sector’s 66.6% share of consumption, or the 714 million barrels of the reserve. Trace it to its record and write, in one dated sentence, what it did to one industry you can name from the record. Then write the sentence the Word already settled about the wealth beneath it. Save both in your Study.',
    anchor: { ref: 'Proverbs 21:20; Genesis 41:35-36; Deuteronomy 8:17-18', theme: 'The store: "There is treasure to be desired and oil in the dwelling of the wise; but a foolish man spendeth it up" (Proverbs 21:20). The reserve laid up before the cut: "And let them gather all the food of those good years that come, and lay up corn under the hand of Pharaoh, and let them keep food in the cities. And that food shall be for store to the land against the seven years of famine, which shall be in the land of Egypt; that the land perish not through the famine" (Genesis 41:35-36). And the heart that forgets who gave the wealth: "And thou say in thine heart, My power and the might of mine hand hath gotten me this wealth. But thou shalt remember the LORD thy God: for it is he that giveth thee power to get wealth" (Deuteronomy 8:17-18).' },
    stories: [
      {
        kind: 'parable', tone: 'light',
        title: 'The Receipt on the Dashboard',
        body: 'Marcus kept every fuel receipt in the glove box, which his daughter thought was a strange habit until the lesson on oil. She laid a year of them on the table beside the family’s grocery receipts and the electric bill and drew one line: the month the pump price jumped was the month the bread and the delivery fees rose too. Then she found the Federal Reserve’s essay on the embargo, read the sentence about a barrel going from under three dollars to nearly twelve, and said the thing the whole course had been teaching her to say: that is one number, from one record, and it moved every other number on this table. Marcus said the glove box had been waiting fifteen years for someone to do that.',
      },
      {
        kind: 'parable', tone: 'sober',
        title: 'The Church Van and the Second Shock',
        body: 'A deacon who had driven the church van through the second oil shock told the class what the record could not: the line at the pump on the morning of the rationing, the widow who stopped coming to midweek service because the drive cost too much, the youth trip cancelled. Then he did what the lesson asked. He opened the Federal Reserve’s essay, found the sentence that said Iranian output fell by 4.8 million barrels a day and prices more than doubled inside a year, and put his memory beside it as a witness beside a record. He said the memory had been true for forty years, and the record told him how big it had been. "Be thou diligent to know the state of thy flocks, and look well to thy herds" (Proverbs 27:23), he said, is a command about knowing your numbers before the shock, not after.',
      },
    ],
    benefits: [
      'You learn to follow one commodity through every industry: the barrel price behind a delivery fee, a jet fare, a plastic lid, a grocery bill, all from the government’s own figures.',
      'You can name, from the Federal Reserve’s own history, what an embargo did to prices and how a central bank explained it at the time.',
      'You see the same case worked at three scales: a trust that held ninety per cent of the business, a nation that imported seventy per cent of its oil from one group of countries, and a world in which five countries pump half the crude.',
      'You learn that a reserve is a biblical pattern before it is a policy: Joseph laid up corn against the famine, and the nation lays up 714 million barrels against the next cut.',
      'You can teach a child to ask, of any price, what it is made of, and to look for the answer in a record rather than a rumour.',
    ],
    levels: {
      teen: 'Here is the ninth skill. Follow the money to the oil. Almost every price you pay has oil in it. The truck that brings the bread burns it. The jet burns it. The plastic on the shelf is made from it. So when the price of a barrel moves, every other price moves too. Yahweh calls oil the store of a wise house. "There is treasure to be desired and oil in the dwelling of the wise; but a foolish man spendeth it up" (Proverbs 21:20).\n\nNow the record. In October 1973 a group of oil countries cut off the United States. The Federal Reserve’s own history says the price of a barrel went from $2.90 to $11.65 by January 1974. That is nearly four times the price in three months. The embargo ended in March 1974. The high price stayed. The chairman of the Federal Reserve, Arthur Burns, said in 1974 that prices for industrial goods were already rising more than ten per cent a year before the cut came. So the shock landed on an economy that was already hot.\n\nA second shock came. Iran had a revolution that began in 1978. By January 1979 its oil output was down by 4.8 million barrels a day. That was seven per cent of the world’s oil. Prices more than doubled between April 1979 and April 1980. The Federal Reserve says the first shock made oil cost four times as much, and the second made it cost three times as much again.\n\nNow the shape of it today. The government’s energy office says oil is about one third of all the energy the world uses. In the United States two thirds of the oil goes to moving things: cars, trucks, ships, planes. Gasoline alone is about 43 per cent of it. In 1977 the country got 70 per cent of the oil it bought from OPEC. In 2020 the United States sold more oil abroad than it bought, for the first time since at least 1949. In 2022 it was the largest producer in the world, with about 14.7 per cent of the crude. Five countries pumped about half of it all. Texas alone pumped 42.5 per cent of the American share. In that same year the country sold about 9.52 million barrels a day abroad and bought about 8.33. It made about 20.08 million barrels a day and used about 20.01. So it makes about what it uses. But it still bought 6.28 million barrels of crude a day from other countries and sold 3.58. Read that twice. A net exporter of oil can still be a net buyer of crude. The record holds both facts at once.\n\nNow the oldest case. By 1899 one company held about ninety per cent of the business of making, moving and selling oil in America. The government said so in its bill. The Supreme Court wrote the story down in 1911 and found the combination was in restraint of trade.\n\nAnd the reserve. The nation keeps 714 million barrels in salt caves against the next cut. The President has let some of it out in an emergency four times. Joseph did the same thing with corn. He filled the cities in the good years so the land would not die in the bad ones. "And that food shall be for store to the land against the seven years of famine" (Genesis 41:36).\n\nYour job. Pick one figure from the table. Find it in its record. Write one sentence that says what it did to one industry. Then write the verse that stood before it.',
      senior: 'The ninth lesson is the one Darrell asked for by name: tie the money to the oil and show the class how one commodity reaches every industry in the world, with data, not with a mood. The teacher’s task is to keep three scales in view at once and to keep every figure pinned to the record it came from.\n\nThe first scale is the shock. Open the Federal Reserve’s own essay and let the class read the sentence about the embargo of October 1973 and the barrel that went from $2.90 to $11.65 by January 1974. Then read Arthur Burns, the chairman at the time, explaining in 1974 that industrial prices were already rising at better than ten per cent a year when the cut arrived, and that the industry had no spare capacity with which to answer. Put the second essay beside it: the Iranian revolution that began in 1978, output down 4.8 million barrels a day by January 1979, seven per cent of the world’s production, and a price that more than doubled between April 1979 and April 1980. The Federal Reserve’s essay on the Great Inflation ties the two together: the first crisis quadrupled crude and the second tripled it, and the central bank says plainly that the inflation the oil price caused was largely beyond its control. That is what a shock to one commodity does to the price of everything, on the record of the institution that had to answer for it.\n\nThe second scale is the nation. The Energy Information Administration’s pages give the class the shape of American oil: about one third of the world’s energy is petroleum; the transportation sector takes 66.6 per cent of American consumption and gasoline alone 43 per cent; OPEC supplied 70 per cent of American petroleum imports in 1977; the country became a net exporter in 2020 for the first time since at least 1949; it produced about 20.08 million barrels a day in 2022 and consumed about 20.01, was the world’s top producer from 2018, and drew 72 per cent of its crude from five states, Texas first at 42.5 per cent. Worldwide, 98 countries produced the crude in 2022 and five of them, the United States first at 14.7 per cent, accounted for about half.\n\nThe third scale is the company. The Supreme Court’s opinion in the Standard Oil case recites the government’s bill: a conspiracy alleged to have been formed about 1870, a trust agreement of January 1882 by which the stock of forty corporations went to nine trustees, its dissolution in 1892, the New Jersey holding company of 1899, and a combination controlling ninety per cent of producing, shipping, refining and selling. The company, in its own brief, admitted the trust, the dissolution and the acquisitions and denied the conspiracy; the decree found the combination of 1899 in restraint of trade. Teach the class to read the admission and the denial as the two witnesses they are.\n\nThen the Word. Oil is the store of a wise house, and a fool spends it (Proverbs 21:20). A reserve laid up against a famine is Joseph’s pattern before it is the Energy Department’s: the nation keeps 714 million barrels in salt caverns and has released them in an emergency on four occasions. And Moses names the heart that every one of these figures tempts: "My power and the might of mine hand hath gotten me this wealth" (Deuteronomy 8:17). Send the class to the table with one question for every figure: what did this do to one industry, and which record says so?',
    },
    lesson: 'The eight competencies were worked on rivalries; the ninth is worked on the commodity beneath all of them. Netflix’s discs travelled by truck; Boeing’s aircraft burn fuel; Disney’s parks and Microsoft’s data centres run on power; the oldest antitrust case the Supreme Court decided against a single industry was about oil. Yahweh names it as the store of a wise house: "There is treasure to be desired and oil in the dwelling of the wise; but a foolish man spendeth it up" (Proverbs 21:20). The competency is to follow the money to the oil at three scales, the shock, the nation and the company, and to let every figure stand on the record that carries it.\n\nThe shock. The Federal Reserve’s own history records that on October 19, 1973 the Arab exporters cut off the United States, and that the production cuts that followed took the price of a barrel from $2.90 to $11.65 by January 1974. The embargo was lifted in March 1974; the price stayed. Arthur Burns, the chairman of the Federal Reserve, explained in 1974 that the manipulation of oil prices came at the worst time, when wholesale prices of industrial commodities were already rising at more than ten per cent a year and the industrial plant was running at full capacity, and that the American oil industry had no spare capacity with which to answer a cut. OPEC, formed in 1960, had by then a growing share of the world market, and a dollar devalued in the early years of that decade made the price rise steeper. Five years later the Iranian revolution, which began in early 1978, took 4.8 million barrels a day out of the world’s supply by January 1979, seven per cent of production, and prices more than doubled between April 1979 and April 1980. The Federal Reserve’s essay on the Great Inflation puts the two shocks in one sentence: the first quadrupled the price of crude and the second tripled it, and the inflation the oil price caused was, in the central bank’s own words, largely beyond the control of monetary policy. That is one commodity reaching every price in the economy, on the record of the institution that had to answer for the result.\n\nThe nation. The Energy Information Administration gives the shape of it. Petroleum is about one third of the world’s energy. In the United States the transportation sector takes the largest share, 66.6 per cent of consumption in 2022, industry 27.5, homes 2.8, commerce 2.5 and power plants 0.6; gasoline alone averaged 8.78 million barrels a day, about 43 per cent of the whole, and distillate, the diesel that moves trucks and trains, 3.96 million, about 20 per cent. In 1977 OPEC supplied 70 per cent of the petroleum the country imported. In 2020 the United States became a net exporter of petroleum for the first time since at least 1949; in 2022 it exported about 9.52 million barrels a day and imported about 8.33, produced about 20.08 million and consumed about 20.01, while still importing 6.28 million barrels of crude a day and exporting 3.58. Imports had peaked in 2005. The country has been the world’s top crude producer since 2018; in 2022 five states supplied 72 per cent of its crude, Texas 42.5 per cent, New Mexico 13.3, North Dakota 8.9, Colorado and Alaska 3.7 each. Worldwide, 98 countries produced about 80.75 million barrels of crude in 2022 and five of them about 52 per cent: the United States 14.7, Saudi Arabia 13.2, Russia 12.7, Canada 5.6, Iraq 5.5. At the start of 2021 OPEC’s members held about 72 per cent of proved reserves and produced 37 per cent of the crude.\n\nThe company. The Supreme Court’s opinion in the Standard Oil case, reargued in January 1911, recites the government’s bill: a conspiracy alleged to have been formed about 1870; a trust agreement made in January 1882 by which the stock of forty corporations was turned over to nine trustees; its dissolution in 1892; the acquisition by the Standard Oil Company of New Jersey of the stocks of the corporations in 1899; and by then a combination controlling ninety per cent of the business of producing, shipping, refining and selling petroleum, able to fix the price of crude and refined oil. The company’s own brief admitted the trust, the dissolution and the acquisitions and denied any conspiracy, and the decree adjudged the combination of 1899 a combination in restraint of trade. The admission and the denial are two witnesses on one record; the researcher reads both.\n\nThe reserve. The Energy Department keeps the Strategic Petroleum Reserve, 714 million barrels of authorized capacity in salt caverns on the Gulf coast, established to reduce the impact of a cut in supply; the President has authorized emergency releases on four occasions, and a heating oil exchange was made in 2000. It is Joseph’s pattern: "let them gather all the food of those good years that come, and lay up corn under the hand of Pharaoh" (Genesis 41:35), "for store to the land against the seven years of famine" (Genesis 41:36). And the Word names the heart every one of these figures tempts, in the company that held ninety per cent and the nation that pumps the most: "And thou say in thine heart, My power and the might of mine hand hath gotten me this wealth. But thou shalt remember the LORD thy God: for it is he that giveth thee power to get wealth" (Deuteronomy 8:17-18). Follow the money to the oil, and then follow the oil to the One who put it in the ground.',
    voices: [
      { speaker: 'Federal Reserve History, the Federal Reserve’s own account of the first oil shock', year: 2026, where: 'The essay “Oil Shock of 1973-74,” on the embargo and the price; the page carries no date in the fetched window, so it is dated by the day the runner read it, September 24, 2026.', source: SRC.fedOil1973, words: 'These cuts nearly quadrupled the price of oil from $2.90 a barrel before the embargo to $11.65 a barrel in January 1974.', why: 'The figure the whole lesson turns on, in the central bank’s own history.' },
      { speaker: 'Arthur Burns, chairman of the Federal Reserve, in 1974, as Federal Reserve History quotes him', year: 1974, where: 'The same essay, quoting the chairman’s explanation given in 1974 of why the shock landed as hard as it did.', source: SRC.fedOil1973, words: 'manipulation of oil prices and supplies by the oil-exporting countries came at a most inopportune time for the United States. In the middle of 1973, wholesale prices of industrial commodities were already rising at an annual rate of more than 10 per cent; our industrial plant was operating at virtually full capacity', why: 'The witness: the man who had to answer for the price of everything, in his own words, at the time.' },
      { speaker: 'Federal Reserve History, on the second oil shock', year: 2026, where: 'The essay “Oil Shock of 1978-79,” on Iranian output and the price; dated by the day the runner read it.', source: SRC.fedOil1979, words: 'Iranian oil output declined by 4.8 million barrels per day (7 percent of world production at the time) by January 1979.', why: 'The second shock measured in barrels and in the world’s share, from the same record-keeper.' },
      { speaker: 'Federal Reserve History, on the Great Inflation', year: 2026, where: 'The essay “The Great Inflation,” tying the two shocks to the price level; dated by the day the runner read it.', source: SRC.fedGreatInflation, words: 'From the perspective of the central bank, the inflation being caused by the rising price of oil was largely beyond the control of monetary policy.', why: 'The central bank on the limit of its own power over a commodity price: the plainest sentence in the lesson.' },
      { speaker: 'The U.S. Energy Information Administration, on the use of oil', year: 2023, where: 'The page “Use of oil,” whose figures cite the Monthly Energy Review of July 2023.', source: SRC.eiaUse, words: 'In 2022, consumption of finished motor gasoline averaged about 8.78 million b/d (369 million gallons per day), which was about 43% of total U.S. petroleum consumption.', why: 'The single largest use of the commodity, measured by the government’s own statisticians.' },
      { speaker: 'The U.S. Energy Information Administration, on imports and exports', year: 2023, where: 'The page “Oil imports and exports,” on the year the country became a net exporter.', source: SRC.eiaTrade, words: 'In 2020, the United States became a net exporter of petroleum for the first time since at least 1949.', why: 'The turn in the nation’s position, dated, on the record.' },
      { speaker: 'The U.S. Energy Information Administration, on where oil comes from', year: 2023, where: 'The page “Where our oil comes from,” whose figures cite the Petroleum Supply Annual of August 2023 and international statistics as of September 6, 2023.', source: SRC.eiaWhere, words: 'In 2022, 98 countries produced about 80.75 million barrels of crude oil, and five of those countries accounted for about 52% of the total.', why: 'The world’s supply in one sentence: many producers, half of it from five.' },
      { speaker: 'The U.S. Energy Information Administration, on prices', year: 2021, where: 'The page “Oil prices and outlook,” in its paragraph on OPEC, whose figures are for 2021.', source: SRC.eiaPrices, words: 'Petroleum products made from crude oil and other hydrocarbon liquids account for about one-third of total world energy consumption.', why: 'The scale of the commodity against all energy, worldwide.' },
      { speaker: 'The United States, in its bill against Standard Oil, as the Supreme Court recited it', year: 1911, where: 'The opinion in Standard Oil Company of New Jersey v. United States, 221 U.S. 1, reciting the government’s charge for the third period.', source: SRC.standardOil, words: 'controlling 90 per cent of the business of producing, shipping, refining, and selling petroleum and its products, and thus was able to fix the price of crude and refined petroleum', why: 'The government’s own figure for the company’s hold on the commodity, on the Court’s record.' },
      { speaker: 'Standard Oil’s appellants, in their own brief, as the Court quoted it', year: 1911, where: 'The same opinion, quoting the appellants’ summary of their answers to the bill.', source: SRC.standardOil, words: 'admitting many of the alleged acquisitions of property, the formation of the so-called trust of 1882, its dissolution in 1892, and the acquisition by the Standard Oil Company of New Jersey of the stocks of the various corporations in 1899, they deny all the allegations respecting combinations or conspiracies to restrain or monopolize the oil trade', why: 'The company under its own signature: what it admitted and what it denied, the second witness beside the bill.' },
      { speaker: 'The U.S. Department of Energy, on the Strategic Petroleum Reserve', year: 2026, where: 'The page of the Office of Petroleum Reserves, “Strategic Petroleum Reserve,” dated by the day the runner read it.', source: SRC.spr, words: 'the President has authorized emergency releases from the SPR on four occasions', why: 'The reserve as Joseph’s pattern, in the words of the office that keeps it.' },
    ],
    timeline: [
      { year: 1870, event: 'The conspiracy the government later alleged is said to have been formed in or about this year by John D. Rockefeller, William Rockefeller and Henry M. Flagler.', record: 'Standard Oil Co. of New Jersey v. United States, 221 U.S. 1, reciting the bill.' },
      { year: 1882, event: 'The trust agreement is made in January; the stock of forty corporations, including the Standard Oil Company of Ohio, goes to nine trustees.', record: 'Standard Oil Co. of New Jersey v. United States, 221 U.S. 1.' },
      { year: 1892, event: 'The trust is dissolved, as the company’s own brief admitted.', record: 'Standard Oil Co. of New Jersey v. United States, 221 U.S. 1, quoting the appellants’ brief.' },
      { year: 1899, event: 'The Standard Oil Company of New Jersey acquires the stocks of the corporations; the decree later adjudges this combination in restraint of trade.', record: 'Standard Oil Co. of New Jersey v. United States, 221 U.S. 1.' },
      { year: 1910, event: 'The case is argued March 14, 15 and 16 and ordered for reargument April 11.', record: 'Standard Oil Co. of New Jersey v. United States, 221 U.S. 1, the caption.' },
      { year: 1911, event: 'The case is reargued January 12, 13 and 16; the Court’s opinion recites the bill, the answers and the decree.', record: 'Standard Oil Co. of New Jersey v. United States, 221 U.S. 1.' },
      { year: 1949, event: 'The earliest year the Energy Information Administration’s series reaches: the country would not be a net exporter of petroleum again until 2020.', record: 'U.S. Energy Information Administration, “Oil imports and exports.”' },
      { year: 1960, event: 'OPEC is formed; the Federal Reserve’s history dates its growing influence over the price from here.', record: 'Federal Reserve History, “Oil Shock of 1973-74.”' },
      { year: 1973, event: 'On October 19 the Arab exporters institute an embargo on the United States; wholesale industrial prices were already rising at more than 10 per cent a year in the middle of the year.', record: 'Federal Reserve History, “Oil Shock of 1973-74,” quoting Arthur Burns.' },
      { year: 1974, event: 'The barrel reaches $11.65 in January from $2.90 before the embargo; the embargo is lifted in March; Burns explains the shock.', record: 'Federal Reserve History, “Oil Shock of 1973-74.”' },
      { year: 1977, event: 'OPEC nations supply 70 per cent of the petroleum the United States imports.', record: 'U.S. Energy Information Administration, “Oil imports and exports.”' },
      { year: 1978, event: 'The Iranian revolution begins early in the year.', record: 'Federal Reserve History, “Oil Shock of 1978-79.”' },
      { year: 1979, event: 'By January Iranian output is down 4.8 million barrels a day, 7 per cent of world production; prices begin to rise rapidly in mid-year.', record: 'Federal Reserve History, “Oil Shock of 1978-79.”' },
      { year: 1980, event: 'By April the price has more than doubled from April of the year before.', record: 'Federal Reserve History, “Oil Shock of 1978-79.”' },
      { year: 2000, event: 'The reserve’s heating oil exchange, the one exchange the Energy Department names apart from those made at refiners’ request.', record: 'U.S. Department of Energy, “Strategic Petroleum Reserve.”' },
      { year: 2005, event: 'United States petroleum imports peak.', record: 'U.S. Energy Information Administration, “Oil imports and exports.”' },
      { year: 2018, event: 'The United States becomes the world’s top crude oil producer.', record: 'U.S. Energy Information Administration, “Where our oil comes from.”' },
      { year: 2020, event: 'The United States becomes a net exporter of petroleum for the first time since at least 1949.', record: 'U.S. Energy Information Administration, “Oil imports and exports.”' },
      { year: 2021, event: 'At the start of the year OPEC’s members hold about 72 per cent of the world’s proved crude reserves; they produce 37 per cent of the crude this year.', record: 'U.S. Energy Information Administration, “Oil prices and outlook.”' },
      { year: 2022, event: 'Exports 9.52 and imports 8.33 million barrels a day; production 20.08 and consumption 20.01; transportation 66.6 per cent of use; 98 countries produce about 80.75 million barrels of crude, five of them 52 per cent.', record: 'U.S. Energy Information Administration, “Oil imports and exports,” “Use of oil,” “Where our oil comes from.”' },
      { year: 2023, event: 'The Energy Information Administration cites the data this lesson uses: the Monthly Energy Review of July, the Petroleum Supply Annual of August, and international statistics as of September 6.', record: 'The three pages’ own data-source lines.' },
      { year: 2026, event: 'On September 24 the records this lesson stands on are fetched on a runner (runs 35948713733 and 35949217702); OPEC’s own page refuses the runner and is not used.', record: 'The history-voices-witness workflow, probe mode.' },
    ],
    workedCase: {
      claim: { words: 'These cuts nearly quadrupled the price of oil from $2.90 a barrel before the embargo to $11.65 a barrel in January 1974.', by: 'Federal Reserve History, the Federal Reserve’s own account of the first oil shock', source: SRC.fedOil1973 },
      event: { year: 1973, what: 'On October 19 the Arab exporters embargo the United States and begin production cuts; within three months the barrel costs four times what it did, and the price reaches every industry that moves, heats or makes anything.' },
      closedDoors: {
        hidden: 'The production cuts were decided among the exporting governments, and the earlier control of the American market was built in a trust agreement of January 1882 that put forty corporations under nine trustees without the public’s knowledge.',
        light: 'The Federal Reserve’s own history now states the embargo, the date and the price, and the Supreme Court’s opinion recites the trust agreement, the company’s admission of it, and the decree, so a student can read both from the record.',
        verse: '"For there is nothing covered, that shall not be revealed; neither hid, that shall not be known" (Luke 12:2).',
        heart: '"And thou say in thine heart, My power and the might of mine hand hath gotten me this wealth" (Deuteronomy 8:17).',
      },
      risk: 'A price that quadruples in one commodity reaches every price in the economy at once, and a central bank that has already let prices run has, in its own words, little control over the result.',
      opportunity: 'A nation that lays up a reserve, and a household that knows its numbers before the shock, can meet a cut without panic; the record shows both the reserve and the figures a family can keep.',
      constraint: 'The lesson may state only what the fetched records carry: the Federal Reserve’s history, the Energy Information Administration’s figures, the Court’s recital and the Energy Department’s page; OPEC’s own account refused the runner and is not quoted.',
      economics: [
        { figure: '$2.90 to $11.65 a barrel', meaning: 'The price before the embargo and in January 1974: nearly four times, in three months.', record: 'Federal Reserve History, “Oil Shock of 1973-74”' },
        { figure: 'more than 10 per cent a year', meaning: 'Wholesale industrial prices already rising in the middle of 1973, before the cut, in Burns’s words.', record: 'Federal Reserve History, “Oil Shock of 1973-74,” quoting Arthur Burns, 1974' },
        { figure: '4.8 million barrels a day · 7 per cent', meaning: 'Iranian output lost by January 1979 and its share of world production.', record: 'Federal Reserve History, “Oil Shock of 1978-79”' },
        { figure: 'more than doubled, from April 1979 to April 1980', meaning: 'The oil price over the 12 months the essay names.', record: 'Federal Reserve History, “Oil Shock of 1978-79”' },
        { figure: 'quadrupled (4 times) · tripled (3 times) · about 5 months', meaning: 'The first crisis and the second, and how long the embargo lasted.', record: 'Federal Reserve History, “The Great Inflation”' },
        { figure: 'about one third (1 in 3)', meaning: 'Petroleum’s share of all the energy the world uses.', record: 'U.S. Energy Information Administration, “Oil prices and outlook”' },
        { figure: '72 per cent · 37 per cent', meaning: 'OPEC’s share of proved reserves at the start of 2021 and of production in 2021.', record: 'U.S. Energy Information Administration, “Oil prices and outlook”' },
        { figure: '66.6 · 27.5 · 2.8 · 2.5 · 0.6 per cent', meaning: 'Transportation, industry, homes, commerce and power plants as shares of American petroleum use in 2022: every industry, measured.', record: 'U.S. Energy Information Administration, “Use of oil”' },
        { figure: '8.78 million b/d · 43 per cent', meaning: 'Gasoline consumed in 2022 and its share of the whole.', record: 'U.S. Energy Information Administration, “Use of oil”' },
        { figure: '3.96 million b/d · 20 per cent', meaning: 'Distillate, the diesel of trucks, trains and heavy equipment, in 2022.', record: 'U.S. Energy Information Administration, “Use of oil”' },
        { figure: '70 per cent', meaning: 'OPEC’s share of the petroleum the United States imported in 1977.', record: 'U.S. Energy Information Administration, “Oil imports and exports”' },
        { figure: '9.52 · 8.33 · 1.19 million b/d', meaning: 'Exports, imports and net exports of petroleum in 2022, the third year as a net exporter.', record: 'U.S. Energy Information Administration, “Oil imports and exports”' },
        { figure: '20.08 · 20.01 million b/d', meaning: 'Produced and consumed in 2022: the nation makes about what it uses.', record: 'U.S. Energy Information Administration, “Oil imports and exports”' },
        { figure: '6.28 · 3.58 million b/d', meaning: 'Crude imported and exported in 2022: still a net importer of crude while a net exporter of petroleum.', record: 'U.S. Energy Information Administration, “Oil imports and exports”' },
        { figure: '42.5 · 13.3 · 8.9 · 3.7 · 3.7 per cent · 72 per cent', meaning: 'Texas, New Mexico, North Dakota, Colorado and Alaska in 2022, and the five together.', record: 'U.S. Energy Information Administration, “Where our oil comes from”' },
        { figure: '14.7 · 13.2 · 12.7 · 5.6 · 5.5 per cent · 80.75 million barrels · 98 countries', meaning: 'The United States, Saudi Arabia, Russia, Canada and Iraq in 2022, and the world’s crude.', record: 'U.S. Energy Information Administration, “Where our oil comes from”' },
        { figure: '90 per cent · forty corporations · nine trustees', meaning: 'The company’s hold on the business by 1899 as the bill charged it, and the trust of 1882.', record: 'Standard Oil Co. of New Jersey v. United States, 221 U.S. 1' },
        { figure: '714 million barrels · four occasions', meaning: 'The reserve’s authorized capacity and the emergency releases the President has ordered.', record: 'U.S. Department of Energy, “Strategic Petroleum Reserve”' },
      ],
      steps: [
        'Count the cost: take the barrel price of January 1974 and follow it into one industry named in the record, transportation at 66.6 per cent of use, and write what a fourfold price does to the cost of moving every good.',
        'Go to the filing: read the Federal Reserve’s essay yourself and confirm the date, the price and the chairman’s words before repeating any of them.',
        'Two or three witnesses: put the Fed’s history, the Energy Information Administration’s trade page and the Court’s recital side by side, and note that each carries its own figures and none contradicts another.',
        'Keep a just weight: state the exporters’ cut and the company’s ninety per cent as the records state them, and state the nation’s own turn to net exporter in 2020 from the same office, without a side.',
        'Write it in order: from 1870 to 2022, every sentence dated, every figure with its record, and the Word that stood before it.',
      ],
      settled: 'On the record, the embargo of October 1973, the barrel from $2.90 to $11.65, the Iranian loss of 4.8 million barrels a day, the trust of 1882 and its ninety per cent, the net-exporter year of 2020 and the reserve of 714 million barrels are all stated by the institutions that keep the figures.',
      stillOpen: 'What the exporters said to one another in deciding the cuts, and OPEC’s own account of 1973, are records this lesson did not fetch: OPEC’s page refused the runner, and the exporters’ minutes are not on any page the runner reached.',
    },
    quiz: {
      questions: [
        { q: 'The Federal Reserve’s history says the barrel went from $2.90 to $11.65. What must the researcher do before repeating it?', options: ['Repeat it; the Federal Reserve is trustworthy', 'Open the essay, confirm the sentence, and cite it with its date', 'Round it to twelve dollars for the class'], answer: 1, explain: 'A figure is repeated from the record it stands on, confirmed and cited; the source’s reputation is not a substitute for opening it.' },
        { q: 'The nation keeps 714 million barrels against the next cut. Which pattern in the Word does the lesson set beside it?', options: ['The widow’s mite', 'Joseph laying up corn against the seven years of famine', 'The talents buried in the ground'], answer: 1, explain: '"And that food shall be for store to the land against the seven years of famine" (Genesis 41:36): a reserve laid up in the good years is Joseph’s pattern before it is a policy.' },
      ],
    },
    facilitator: {
      talkingPoints: [
        'The store and the fool: "There is treasure to be desired and oil in the dwelling of the wise; but a foolish man spendeth it up" (Proverbs 21:20); the reserve as Joseph’s pattern (Genesis 41:35-36); the heart that forgets who gave the wealth (Deuteronomy 8:17-18).',
        'The shock, from the Federal Reserve: October 19, 1973; $2.90 to $11.65 by January 1974; Burns on prices already rising more than 10 per cent; Iran down 4.8 million barrels a day by January 1979; prices more than doubled by April 1980; quadrupled, then tripled.',
        'The nation, from the Energy Information Administration: one third of world energy; transportation 66.6 per cent; gasoline 43 per cent; OPEC 70 per cent of imports in 1977; net exporter in 2020; top producer since 2018; five states 72 per cent; five countries 52 per cent of the world’s crude in 2022.',
        'The company, from the Court: 1870, the trust of 1882, dissolved 1892, the New Jersey holding of 1899, ninety per cent of the business; the admission and the denial in the company’s own brief; the decree.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Proverbs 21:20. | The competency in a sentence (10): follow the money to the oil, at three scales, on the record. | Teach it (15): read the Federal Reserve’s embargo sentence and Burns’s words aloud; then the Energy Information Administration’s shares. | Work it (20): each person takes one figure from the table to its record and writes what it did to one industry. | Discussion (10): which industry in your own week runs on the barrel? | Send-off (5): know the state of your flocks before the shock; lay up in the good years.',
      discussionPrompts: [
        'Which price in your family’s week has the most oil in it, and how would you find the record that says so?',
        'The central bank said the inflation the oil price caused was largely beyond its control. What does that tell you about where a family’s safety in a shock actually comes from?',
        'The company admitted the trust and denied the conspiracy. How do you weigh an admission and a denial from the same witness?',
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers — the same shape the History courses export, so the catalog, the
// witness workflow and the gates treat this course exactly like the others.
// ---------------------------------------------------------------------------
export function buildBusinessResearchSchedule(startISO = null) {
  return buildScheduleFor(BUSINESS_RESEARCH_MODULES, startISO, BUSINESS_RESEARCH_META.cadenceDays);
}

export function businessResearchProgressSummary(progress = {}) {
  return progressSummaryFor(BUSINESS_RESEARCH_MODULES, progress);
}

export function exportBusinessResearchCurriculumMarkdown(startISO = null) {
  const rows = buildBusinessResearchSchedule(startISO);
  const lines = [`# ${BUSINESS_RESEARCH_META.title}`, '', BUSINESS_RESEARCH_META.tagline, '', `> ${BUSINESS_RESEARCH_META.care}`, ''];
  rows.forEach((r, i) => {
    const m = BUSINESS_RESEARCH_MODULES[i];
    lines.push(`## Lesson ${r.week} · ${m.title}`, '', `_${m.anchor.ref}_`, '', m.bigIdea, '', m.lesson, '');
    lines.push('### Voices', '');
    for (const v of m.voices) lines.push(`- ${v.speaker} (${v.year}): "${v.words}" — ${v.source.title}, ${v.source.url}`);
    lines.push('', '### Timeline', '');
    for (const t of m.timeline) lines.push(`- ${t.year} — ${t.event} (${t.record})`);
    lines.push('');
  });
  lines.push(BUSINESS_RESEARCH_META.footer, '');
  return lines.join('\n');
}

/** Hosts a business voice may cite: the record-keepers the runner probed. */
export const BUSINESS_SOURCE_HOSTS = [
  'wondery.com', 'www.justice.gov', 'www.sec.gov', 'www.wto.org', 'thewaltdisneycompany.com',
  'web.archive.org', // the Wayback Machine's dated copy of a page the company has since removed (Hastings, 2011)
  'www.eia.gov', 'www.energy.gov', // the oil records (DR-0602): the Energy Information Administration and the Energy Department; the Federal Reserve's history and the Court are already on the History lists the shared gate accepts
];

// The History gates, re-used whole; the host list is the one thing that
// differs, so the voice check swaps the History hosts for the business ones
// by re-reading the fault list: a host fault on a business host is not a fault.
export function businessResearchVoiceFaults(m) {
  const own = new Set(BUSINESS_SOURCE_HOSTS);
  return historyVoiceFaults(m).filter((f) => {
    const hit = /source host ([^ ]+) is not a listed primary-record host/.exec(f);
    return !(hit && own.has(hit[1]));
  });
}
export const businessResearchTimelineFaults = historyTimelineFaults;
/** The worked case (DR-0601): an actual claim processed with the data — the same gate the History course carries. */
export const businessResearchWorkedCaseFaults = historyWorkedCaseFaults;

export function businessResearchRefs(modules = BUSINESS_RESEARCH_MODULES) {
  const out = [];
  for (const m of modules) for (const part of String((m.anchor && m.anchor.ref) || '').split(';')) { const r = part.trim(); if (r && !out.includes(r)) out.push(r); }
  return out;
}

/** The whole course on one line of years — every lesson's dated record, merged and sorted. */
export function businessResearchTimeline(modules = BUSINESS_RESEARCH_MODULES) {
  const out = [];
  modules.forEach((m, order) => {
    for (const t of (m && m.timeline) || []) out.push({ ...t, lessonId: m.id, lessonTitle: m.title, order });
  });
  return out.sort((a, b) => (a.year - b.year) || (a.order - b.order));
}

export const BUSINESS_RESEARCH_INTEREST_TAG = '[Business Research L1]';
export const BUSINESS_RESEARCH_HELPER_TAG = '[Business Research L1 helper]';

export const BUSINESS_RESEARCH_TUTOR_META = {
  key: 'business-research-wars',
  name: BUSINESS_RESEARCH_META.title,
  title: BUSINESS_RESEARCH_META.title,
  posture: 'Teach the craft Word-first: count the cost before believing a plan, go to the filing before the retelling, establish every word at the mouth of two or three witnesses, sort the reenactment from the document, keep a just weight, trace the correction, keep what the Word settles apart from what the record must supply, and write it in order with its sources. Never invent a date, a filing, a number or a quotation — every fact in this course is on a record the course names, and you say which one. Never stage a settled matter (fraud, false weights, wages withheld) as open, and never claim a verse settles a record question (a share, a date, a filing). Where the record is silent on a motive, say so plainly rather than borrowing a podcast’s scene. Credit the podcast as the doorway it is.',
  blurb: 'Ask about any of the eight competencies — counting the cost, finding the filing, the second witness, sorting a scene from a document, weighing a rivalry justly, tracing a correction, keeping the settled apart from the record, or writing the two-paragraph brief — or bring a company you are curious about and work it through them.',
};
