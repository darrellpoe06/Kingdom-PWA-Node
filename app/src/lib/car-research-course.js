// =============================================================================
// car-research-course — "Historical Research, Level 1: Who Invented the Car?"
// The craft of the 1619 course, taught on a second case (DR-1083)
// =============================================================================
// Darrell, 2026-10-16: "Lesson... who invented the driving car? Based on
// documentation of history etc... make sure we use all sources inside the
// app... and research 1 level context however the Higher Education Yahweh as
// the foundation of our comprehension of the world and dimensions... lesson",
// and minutes later: "1619 historical events... in context historical accuracy
// and science of how we understand as a community..."
//
// SO: the History department's research method (historical-research-course.js,
// the 1619 Project as the case, DR-0590 / DR-0597 / DR-0601) applied to a
// second, smaller case. "1 level" is his name for that Level-1 course; "all
// sources inside the app" is its source discipline (the record hosts and the
// runner witness, history-course.js); "how we understand as a community" is
// what this case turned out to be about.
//
// NOTHING HERE WAS REMEMBERED. Every voice and every dated entry was read by a
// GitHub runner before a sentence was written (history-voices-witness probe
// runs 38969635014 and 38969913844, 2026-10-16), because the cloud sandbox has
// no road to these pages. The runner reads text case-folded, so capitals in
// the quotations are restored by ordinary proper-noun and sentence rules; the
// words and their order are the page's. Two records refused the runner (the
// live Library of Congress page and the live Smithsonian page, HTTP 403) and
// are read from the Wayback Machine's dated copies. One German record (the
// patent office's page on Bertha Benz) is quoted in German, with our
// translation marked as ours.
//
// WHAT THE RECORD SHOWED, which is why the course has its shape:
//   - In 2009 news outlets said the Library of Congress had ruled for Germany.
//     The Library's own blog answered that its page named Benz only as the
//     one it would PROBABLY credit IF it had to name one, under a disclaimer.
//     By 2024 the page itself said "a matter of opinion" and "our knowledge
//     of the invention of the true automobile continues to evolve". A
//     community learning in public, both versions on the record.
//   - A respected museum's 2026 anniversary page prints the patent as "no.
//     37345" and calls the filing date the grant; the patent office, the
//     company, the patent record and the UN all say 37435, applied for
//     January 29 and granted November 2, 1886 — and the museum's own page
//     says so further down. Two or three witnesses, in one case.
//   - Around the single name: Cugnot (1769/1770), Daimler and Maybach (1885,
//     March 8, 1886), Bertha Benz (August 5, 1888), the Duryeas (1893, 1896),
//     Selden (a patent of 1895, never manufactured, royalties collected).
//   - The car reached the multitude by a method on the record: $850 in 1908,
//     a Model T every 93 minutes by early 1914.
//
// WORD FIRST, and the Higher Education he named: every competency is a
// command before it is a skill (Proverbs 18:13; Deuteronomy 19:15; Romans
// 13:7; Deuteronomy 6:7), and the frame under the whole case is that wisdom
// "find[s] out knowledge of witty inventions" (Proverbs 8:12), that "his God
// doth instruct him" (Isaiah 28:26), and that the worlds the inventors worked
// with "were framed by the word of God" (Hebrews 11:3). Every verse verbatim
// from the repo's KJV, pinned by car-research-course.test.js.
//
// SPEAK ESTABLISHED FACT (DR-0100). The dates, numbers, prices and deeds are
// stated plainly with their records. The ONE genuinely open question — which
// first deserves the single word "inventor" — is stated narrowly, as the
// Library of Congress itself now states it: a question of definition.
// =============================================================================
import {
  buildScheduleFor, progressSummaryFor, exportCurriculumMarkdownFor,
} from './church-classes.js';
import { historyVoiceFaults, historyTimelineFaults, historyYearsNamed, historyVoiceYears, historyWorkedCaseFaults } from './history-course.js';

export const CAR_RESEARCH_CARE_NOTE =
  'Teaching, not a substitute for the record. This course teaches four Level-1 competencies of historical research on one case, the invention of the automobile, and states the documented facts it names with their dates and their records. It is not a full history of the car. Every record here — the Library of Congress page and its blog, the patent office’s pages, the patent record, the company history, the museums’ pages, the United Nations notice — can be read in full where it points, and you are meant to check it.';

export const CAR_RESEARCH_META = {
  key: 'car-research-who-invented-the-car',
  title: 'Historical Research, Level 1: Who Invented the Car?',
  audience: 'students, teachers, parents and anyone who has repeated a famous "first" and wants to know how to check it — taught at every age, from a child’s first reading to a teacher’s notes',
  tagline: 'Define before you count, go to the issuing record, give each one their due, and write it in order for the children — four competencies on one case, under the Word, with Yahweh as the Teacher of every invention.',
  // WORD-FIRST, DECLARED (DR-0127 / DR-0282). Both spans VERBATIM from the
  // repo's KJV and pinned in the course test.
  wordFirst: {
    ref: 'Proverbs 18:13; Proverbs 8:12',
    frame: 'Yahweh gave the researcher the first rule before any university did: "He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13). And He is the source of the knowledge the case is about: "I wisdom dwell with prudence, and find out knowledge of witty inventions" (Proverbs 8:12). Hear the whole question, then read the record; and remember Who taught the inventors.',
  },
  format: 'Self-paced · 4 lessons · one competency a week or all in an afternoon · four reading levels, child to teacher',
  cadenceDays: 7,
  weeks: 4,
  handsOnLabel: 'Work it on the case',
  unit: {
    noun: 'lesson',
    nounPlural: 'lessons',
    cap: 'Lesson',
    selfPaced: true,
    sessionLabel: 'How to run it (family table, class, or one-on-one)',
    countNoun: 'lesson',
  },
  blurb: 'The third course of the History department, and the second case for the Level-1 research craft the 1619 course teaches. Who invented the car? In 2009 the newspapers said the Library of Congress had settled it for Germany; the Library answered in public that its page named Karl Benz only as the one it would probably credit if it had to name one, and by 2024 the page itself said the question is a matter of opinion and that our knowledge continues to evolve. The course works that case the way a careful community learns: it defines what is being counted, goes to the office that issued the patent and catches a museum’s transposed number with two and three witnesses, gives their due to the people one name leaves out (a French engineer, two German engineers, the woman who proved the car on the road, two American brothers, and a man who collected royalties on a car he never built), and writes the whole finding in order for a child. Under all of it is the Higher Education the Word names: wisdom finds out witty inventions, and Yahweh teaches the plowman and the engineer. Four lessons, every verse fetched verbatim, every voice and every date read by a runner from its record, four reading levels. Free, in full.',
  care: CAR_RESEARCH_CARE_NOTE,
  footer: '_Taught by Darrell Poe · the Poe family + The Church of the Living God · built on PoeTech. Course three of the History department. Hear the whole question; go to the issuing record; render to all their dues; teach it diligently to the children._',
};

export const CAR_RESEARCH_SESSION_FLOW = [
  { minutes: 5, name: 'Prayer + the anchor' },
  { minutes: 10, name: 'The competency in one sentence' },
  { minutes: 15, name: 'Teach it — what the Word actually says' },
  { minutes: 20, name: 'Work it on the case' },
  { minutes: 10, name: 'Discussion' },
  { minutes: 5, name: 'Send-off + solo task' },
];

export const CAR_RESEARCH_SESSION_MINUTES =
  CAR_RESEARCH_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0); // 65

// Verified sources. Every URL below answered a GitHub runner with HTTP 200 and
// the quoted words on the page (history-voices-witness probe runs 38969635014
// and 38969913844 on 2026-10-16). The live loc.gov and si.edu pages refuse a
// runner (403, a bot check), so those two are read from the Wayback Machine.
const SRC = {
  locBlog: { title: 'Matt Raymond, "Truth About Car’s Origins Actually a Bit Murky," Timeless, the Library of Congress blog, February 26, 2009', url: 'https://blogs.loc.gov/loc/2009/02/truth-about-cars-origins-actually-a-bit-murky/' },
  locPage: { title: '"Who Invented the Automobile?," Everyday Mysteries, Science Reference Section, Library of Congress, updated December 5, 2024 — archived by the Wayback Machine', url: 'https://web.archive.org/web/20250102152254/https://www.loc.gov/everyday-mysteries/motor-vehicles-aeronautics-astronautics/item/who-invented-the-automobile/' },
  mb: { title: '"Benz Patent Motor Car: the first automobile (1885-1886)," Company History, Mercedes-Benz Group', url: 'https://group.mercedes-benz.com/company/tradition/company-history/1885-1886.html' },
  patent: { title: 'DE37435C, "Fahrzeug mit Gasmotorenbetrieb," Benz & Co. in Mannheim — the patent record, Google Patents', url: 'https://patents.google.com/patent/DE37435' },
  dpmaBertha: { title: '"Bertha Benz," Patente von Frauen, Deutsches Patent- und Markenamt (the German Patent and Trade Mark Office)', url: 'https://www.dpma.de/dpma/veroeffentlichungen/patentefrauen/berthabenz/index.html' },
  dpmaIndex: { title: '"Automobiles: the beginnings," Milestones, Deutsches Patent- und Markenamt (the German Patent and Trade Mark Office)', url: 'https://www.dpma.de/english/our_office/publications/milestones/automobiles/index.html' },
  dpmaMaybach: { title: '"Wilhelm Maybach," Milestones, Deutsches Patent- und Markenamt (the German Patent and Trade Mark Office)', url: 'https://www.dpma.de/english/our_office/publications/milestones/automobiles/maybach/index.html' },
  ghdi: { title: '"The First Four-Wheeled Daimler Motor Car (1886)," German History in Documents and Images, German Historical Institute', url: 'https://germanhistorydocs.org/en/forging-an-empire-bismarckian-germany-1866-1890/gottlieb-daimler-s-first-automobile-march-8-1886' },
  un: { title: '"Dozens of new collections added to UN’s Memory of the World register," UN News, May 2011', url: 'https://news.un.org/en/story/2011/05/376352' },
  nmm: { title: '"29th January 1886 - the birth of the motorcar?," National Motor Museum, Beaulieu, January 15, 2026', url: 'https://nationalmotormuseum.org.uk/story-of-motoring/motoring-topics/vehicle-stories/benz-motorwagen/' },
  lindaHall: { title: '"Nicolas-Joseph Cugnot," Scientist of the Day, Linda Hall Library, February 26, 2018', url: 'https://www.lindahall.org/about/news/scientist-of-the-day/nicolas-joseph-cugnot/' },
  duryea: { title: '"Duryea Motor Carriage, 1893," National Museum of American History, Smithsonian Institution — archived by the Wayback Machine', url: 'https://web.archive.org/web/2024/https://www.si.edu/object/duryea-motor-carriage-1893:nmah_694756' },
  fordT: { title: 'Bob Casey, "Ford’s Model T: A Car for the Great Multitude," The Henry Ford, January 28, 2015', url: 'https://www.thehenryford.org/explore/blog/fords-model-t' },
  fordLine: { title: 'Matt Anderson, "Ford Methods and the Ford Shops," The Henry Ford, July 22, 2021', url: 'https://www.thehenryford.org/collections/explore/articles/ford-methods-and-the-ford-shops' },
};

export const CAR_RESEARCH_MODULES = [
  // ---------------------------------------------------------------------------
  // 1. DEFINE BEFORE YOU COUNT: WHAT IS A CAR?
  // ---------------------------------------------------------------------------
  {
    id: 'car1-what-is-a-car',
    title: 'What is a car? The question before the answer',
    bigIdea: 'Before you can say who invented the car, you have to say what a car is, or you will answer before you have heard the question. The Word names that mistake: "He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13). In 2009 the newspapers said the Library of Congress had settled it for Germany. The Library answered in public that the truth was more elusive, and in 2024 it rewrote its own page to say our knowledge of the invention continues to evolve. This lesson works that case.',
    inApp: 'Write the question "Who invented the car?" at the top of a page. Under it write three definitions of a car the Library’s own table uses: a road vehicle that moves itself, one with a gasoline engine, and one that a company built and sold. Beside each, write the name and the year the table gives. Save it in your Study; every later lesson opens a record behind one of those lines.',
    anchor: { ref: 'Proverbs 18:13; Proverbs 25:2; Proverbs 27:2; 1 Thessalonians 5:21', theme: 'Yahweh warns against the answer that runs ahead of the question: "He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13). He gives the search its dignity, "It is the glory of God to conceal a thing: but the honour of kings is to search out a matter" (Proverbs 25:2), and He tells a people how to handle its own praise: "Let another man praise thee, and not thine own mouth" (Proverbs 27:2). The method under all of it: "Prove all things; hold fast that which is good" (1 Thessalonians 5:21).' },
    stories: [
      { title: 'Three right answers', body: 'A teacher asked her class who invented the car and got three answers. One boy said a German named Benz. A girl said a Frenchman with a steam wagon. Another boy said Henry Ford, because his grandfather had a picture of a Model T. She wrote all three on the board and asked each of them what they meant by a car. The first meant a car with a gasoline engine. The second meant any road vehicle that moved itself. The third meant a car ordinary families could buy. She told them they were all right about their own question, and all wrong to think there was only one question.' },
      { title: 'The disclaimer under the answer', body: 'A father read a news story aloud at breakfast saying a great library had proved the car was invented in Germany. His daughter looked up the library’s page on her phone. Right under the name Karl Benz it said the question did not have a straightforward answer. She read it out. Her father put the paper down and said the reporter had copied the answer and skipped the sentence underneath it. Then he asked her to read the whole page to him, slowly, before either of them said another word about it.' },
    ],
    benefits: [
      'You stop arguing about who was first until you have agreed what you are counting.',
      'You read the sentence under the headline, because the qualifier is often where the truth is.',
      'You can watch a trusted institution correct how it was quoted, and you learn to honour a correction made in the open.',
      'You know the difference between a fact the record settles and a definition the record cannot choose for you.',
      'You can teach a child that the honour of a king is to search a matter out, not to repeat it.',
    ],
    levels: {
      child: 'Who made the first car? That sounds like an easy question. It is not. First we have to ask, what is a car? The Bible tells us to listen to the whole question first. "He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13). That means do not answer too fast.\n\nHere is what happened. In 2009, a president gave a big speech. He said his nation invented the car. Some news writers said a big library had already answered it. They said the library proved the car came from Germany. But the library had not said that! The library wrote a short note to explain. It said the truth was harder to find than people thought.\n\nThe library has a page about this question. Right under the name Karl Benz, the page said the question did not have an easy answer. The news writers copied the name. They did not copy the note under it. That is how a small mistake grows big.\n\nThe library also made a list. It shows many people who built early cars. A man in France built a steam wagon that moved by itself. It went only about two and a half miles an hour. A man in Germany built a car with a gasoline engine. Two brothers in America built a gas car and then started a car company. So who made the first car? It depends on what you call a car.\n\nLater the library changed its page. Now it says people still learn more about who made the car. That is honest. The Bible tells us, "Prove all things; hold fast that which is good" (1 Thessalonians 5:21). That means check things, then keep what is true.\n\nYahweh likes it when we search for the truth. "It is the glory of God to conceal a thing: but the honour of kings is to search out a matter" (Proverbs 25:2). Yahweh made a world full of things to find out. When we search carefully, we are doing a good thing.\n\nThe Bible also says do not brag about yourself. "Let another man praise thee, and not thine own mouth" (Proverbs 27:2). A nation should not just say, we did it first. It should let the record speak. Ask your parents what they think a car is. Then look at the list together and see who fits.',
      youth: 'Here is the first skill this course teaches: ask what you are counting before you count who was first. "Who invented the car?" sounds like it has one answer. It has several, and each one depends on what you mean by a car. The Word warns against answering too fast: "He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13).\n\nIn 2009 a president said in a national address that his nation had invented the automobile. Reporters went looking for proof, and some wrote that the Library of Congress had already settled the question for Germany. On February 26 the Library wrote on its own blog that this was not quite true. Its blog quoted the page the reporters used. The page did name Karl Benz, but right under that it said the question did not have a straightforward answer, and that if it had to give credit to one inventor, it would probably be Benz. Probably is not proof. The reporters had kept the name and dropped the qualifier.\n\nThe page also carries a table, and the table shows why the question is hard. A French army engineer built a steam road vehicle in 1769. A German built a gasoline car with a patent in 1886. Two American brothers built a successful gas car in 1893 and set up the first American car company. Each of those is a real first. They are firsts of different things.\n\nThen, in 2024, the Library rewrote its page. It now says who invented the automobile is a matter of opinion, that earlier accounts gave the credit to Benz, and that our knowledge of the invention continues to evolve. That is a public institution changing its words as it learns, with both versions on the record for anyone to compare.\n\nThe Word gives the method and the posture. "Prove all things; hold fast that which is good" (1 Thessalonians 5:21). "It is the glory of God to conceal a thing: but the honour of kings is to search out a matter" (Proverbs 25:2). Yahweh hid the workings of His world so that searching it would be honourable work. And He tells a people how to treat its own claims: "Let another man praise thee, and not thine own mouth" (Proverbs 27:2). A country that says it invented something should be glad to have the record say it first.\n\nTalk with your parents about what you think a car is. Then compare your definition with the three firsts in the table.',
      teen: 'The first competency here is definition before counting. "Who invented the car?" is really three or four questions wearing one coat. You cannot answer it until you know which one you are asking. The Word says so directly: "He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13).\n\nThe case is from 2009. A president said in a national address that his nation had invented the automobile. Some news outlets then claimed the Library of Congress had already ruled for Germany. The Library replied on its own blog. Its post quoted the page reporters had used. That page named Karl Benz, but it put a disclaimer right under the name. It said the question did not have a straightforward answer. It said that if credit had to go to one inventor, it would probably be Benz. The reporters turned probably into proof. The blog called the truth more elusive than one might think.\n\nThe page’s own table shows why. In 1769 a French engineer built a self-propelled road vehicle for the army. In 1886 a German patent covered a gasoline car. In 1893 two American brothers built a successful gas-powered car, and they went on to found a car company. Each line is a first. Each counts a different thing: self-propulsion, the gasoline engine, a working American machine, a company that sold cars.\n\nIn 2024 the Library rewrote the page. It now calls the question a matter of opinion. It says earlier accounts credited Benz. It says our knowledge of the invention continues to evolve. Note what changed and what did not. The facts in the table stayed. The confidence of the headline shrank. A careful institution learned in public, and both versions are on the record.\n\nThe Word supplies the method: "Prove all things; hold fast that which is good" (1 Thessalonians 5:21). It also gives the work its honour: "It is the glory of God to conceal a thing: but the honour of kings is to search out a matter" (Proverbs 25:2). Yahweh built a world that rewards a patient search. And it checks our pride: "Let another man praise thee, and not thine own mouth" (Proverbs 27:2). A national claim is best stated by the record, not by the nation.\n\nDiscuss with your parents which definition they would choose, and why. Then test it against the table.',
      senior: 'Teach this lesson as a discipline of definition, and open with the proverb that names the failure it prevents: "He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13). The question "Who invented the car?" is several questions under one heading, and the honest researcher refuses to answer it until the heading has been taken apart.\n\nThe case is a matter of public record from 2009. A president said in a national address that his nation had invented the automobile, Several news outlets then went looking for an authority. They reported that the Library of Congress had definitively assigned the invention to Germany. The Library answered on its own blog on February 26, in the plainest terms an institution can use about itself: the truth, it said, was more elusive than one might think. It then quoted the page the reporters had relied on, and the page had never said what they said it said. It named Karl Benz. But directly beneath the name stood a disclaimer that the question did not have a straightforward answer. The credit to Benz was given only conditionally, as the one inventor the Library would probably name if it had to name one.\n\nThe page’s own table explains why no single name will do. It records a French military engineer’s self-propelled road vehicle in 1769, a German gasoline automobile protected by a patent in 1886, and an American gas-powered car that worked in 1893, built by two brothers who then founded their country’s first company to manufacture and sell automobiles. Each entry is a genuine first. Each is the first of a different thing, and the answer changes with the definition one brings to it.\n\nIn 2024 the Library revised the page itself. It now says that who invented the automobile is a matter of opinion, that earlier accounts often gave the credit to Benz, and that knowledge of the invention continues to evolve. The facts in the table stand unchanged; what changed is the confidence of the headline, and both versions remain on the record for any reader to compare.\n\nClose on the Word that governs the whole course. "Prove all things; hold fast that which is good" (1 Thessalonians 5:21). "It is the glory of God to conceal a thing: but the honour of kings is to search out a matter" (Proverbs 25:2): Yahweh made the world to reward patient searching, and searching it well is honourable work for those who rule and those who teach. And a word for national pride: "Let another man praise thee, and not thine own mouth" (Proverbs 27:2). Ask your grown children which definition they would defend, and listen before you answer.',
    },
    lesson: 'The first competency of this course is the one the first Historical Research course began with, carried to a new case: get the question exactly right before you answer it. "Who invented the car?" sounds like a question with one answer. The records show it has several, and each depends on what you mean by a car. The Word names the mistake this lesson prevents: "He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13).\n\nThe case is from 2009. A president said in a national address that his nation had invented the automobile, and several news outlets reported that the Library of Congress had already assigned the invention to Germany. On February 26 the Library answered on its own blog. Its post said the truth is sometimes more elusive than one might think, and it quoted the page the reporters had used. That page did name Karl Benz. But right beneath the name it said the question does not have a straightforward answer, and it gave Benz the credit only conditionally: if it had to give credit to one inventor, it would probably be Benz. The reporters kept the name and dropped the qualifier, and a probable answer travelled as a settled one.\n\nThe page’s own table shows why the question splits. A French army engineer built a self-propelled road vehicle in 1769. A German, Karl Benz, completed a gasoline car in 1885 and applied for a patent on it in 1886. Two American brothers built a successful gas-powered car in 1893 and set up the first American company to make and sell cars. Every one of those is a real first. They are firsts of different things: a vehicle that moves itself, a vehicle with a gasoline engine and a patent, a working American machine, a business that sold cars to the public.\n\nIn 2024 the Library rewrote its page. It now says exactly who invented the automobile is a matter of opinion, that earlier accounts often gave the credit to Benz, and that our knowledge of the invention continues to evolve. Read that carefully. The facts in the table did not change. The confidence of the headline did, and both versions are on the record for anyone to compare. That is how a careful community learns: in public, with its earlier words still visible.\n\nSo here is the competency. Before you answer who was first, write down what you are counting. Then let the record answer the question you actually asked. The Word gives the method, "Prove all things; hold fast that which is good" (1 Thessalonians 5:21), and the honour of the work: "It is the glory of God to conceal a thing: but the honour of kings is to search out a matter" (Proverbs 25:2). Yahweh made a world that rewards a patient search. And it gives a word to every nation that wants a first for itself: "Let another man praise thee, and not thine own mouth" (Proverbs 27:2).',
    voices: [
      { speaker: 'Barack Obama, President of the United States', year: 2009, where: 'The address the Library of Congress blog called his State of the Union address, in the sentence its post of February 26, 2009 quotes.', source: SRC.locBlog,
        words: 'I believe the nation that invented the automobile cannot walk away from it.',
        why: 'The claim of a national first, made from the highest platform, that sent reporters looking for an authority.' },
      { speaker: 'Matt Raymond, for the Library of Congress', year: 2009, where: 'The Library’s own blog, February 26, 2009, answering the news coverage of the speech.', source: SRC.locBlog,
        words: 'A number of them are citing the Library of Congress as having definitively asserted that the car was actually invented in Germany.',
        why: 'The institution naming, in its own voice, how it had been misquoted.' },
      { speaker: 'The Library of Congress, Everyday Mysteries page', year: 2009, where: 'The page as it read in 2009, quoted word for word by the Library’s own blog post of February 26, 2009.', source: SRC.locBlog,
        words: 'If we had to give credit to one inventor, it would probably be Karl Benz from Germany. Many suggest that he created the first true automobile in 1885/1886.',
        why: 'The qualified answer the reporters reduced to a settled one: one inventor only if it had to name one, and probably.' },
      { speaker: 'The Library of Congress, Everyday Mysteries page', year: 2024, where: 'The page as revised on December 5, 2024, read from the Wayback Machine’s dated copy because the live page refuses a runner.', source: SRC.locPage,
        words: 'Exactly who invented the automobile is a matter of opinion. Earlier accounts often gave credit to Karl Benz, from Germany, for creating the first true automobile in 1885/1886. However, our knowledge of the invention of the true automobile continues to evolve.',
        why: 'The same institution’s later words: the facts kept, the confidence lowered, the learning admitted in public.' },
    ],
    timeline: [
      { year: 1769, event: 'Nicolas-Joseph Cugnot builds a self-propelled steam road vehicle for the French army, the earliest entry in the Library of Congress table.',
        record: 'The Library of Congress, Everyday Mysteries, its automobile highlights table.', source: { ...SRC.locPage, phrase: 'built the first self propelled road vehicle (military tractor) for the french army' } },
      { year: 1885, event: 'Karl Benz completes his two-seater motor car with a single-cylinder four-stroke engine at the rear.',
        record: 'Mercedes-Benz Group, company history, 1885-1886.', source: { ...SRC.mb, phrase: 'the two-seater vehicle, which was completed in 1885' } },
      { year: 1886, event: 'On January 29 Karl Benz applies for a patent on his vehicle powered by a gas engine, patent number 37435.',
        record: 'Mercedes-Benz Group, company history, 1885-1886.', source: { ...SRC.mb, phrase: 'carl benz applied for a patent for his' } },
      { year: 1893, event: 'The Duryea brothers build the first successful gas powered car in the United States, by the Library’s table.',
        record: 'The Library of Congress, Everyday Mysteries, its automobile highlights table.', source: { ...SRC.locPage, phrase: 'first successful gas powered car' } },
      { year: 2009, event: 'News outlets report that the Library of Congress assigned the invention to Germany, and the Library answers on its own blog that the truth is more elusive.',
        record: 'Matt Raymond, the Library of Congress blog, February 26, 2009.', source: { ...SRC.locBlog, phrase: 'the truth is sometimes more elusive than what one might think' } },
      { year: 2024, event: 'The Library revises its page to say the question is a matter of opinion and that knowledge of the invention continues to evolve.',
        record: 'The Library of Congress, Everyday Mysteries, updated December 5, 2024, archived by the Wayback Machine.', source: { ...SRC.locPage, phrase: 'our knowledge of the invention of the true automobile continues to evolve' } },
    ],
    workedCase: {
      claim: { words: 'I believe the nation that invented the automobile cannot walk away from it.', by: 'President Barack Obama, as quoted by the Library of Congress blog, February 26, 2009', source: SRC.locBlog },
      event: { year: 2009, what: 'A national first is claimed before Congress, and news outlets attribute to the Library of Congress a verdict for Germany that its page never gave.' },
      closedDoors: {
        hidden: 'The page the reporters cited carried its disclaimer directly under its answer; whoever copied the answer into the story left the qualifying sentence out of sight of every reader.',
        light: 'On February 26, 2009 the Library’s own blog quoted the page word for word, disclaimer and all, and in 2024 the Library rewrote the page so that the qualifier is now the answer.',
        verse: '"For there is nothing covered, that shall not be revealed; neither hid, that shall not be known" (Luke 12:2).',
        heart: '"Let another man praise thee, and not thine own mouth; a stranger, and not thine own lips" (Proverbs 27:2).',
      },
      risk: 'A first claimed for a nation, or against one, gets repeated as settled because it flatters someone, and the reader never learns what was actually first.',
      opportunity: 'The claim names a thing that can be counted, so the Library’s table can be set beside it and each nation’s real firsts can be stated plainly.',
      constraint: 'No record can choose the definition of a car for us; the table supplies dated facts for each definition, and the reader must say which one is meant.',
      economics: [
        { figure: '1769', meaning: 'The year of the earliest self-propelled road vehicle in the Library’s table, built in France, more than a century before any gasoline car.', record: 'The Library of Congress, Everyday Mysteries, automobile highlights table' },
        { figure: '2.5 mph', meaning: 'The speed the Library’s table gives for that first steam vehicle: very slow, and still a road vehicle that moved itself.', record: 'The Library of Congress, Everyday Mysteries, automobile highlights table' },
        { figure: '4hp', meaning: 'The power of the Duryea brothers’ 1893 car, the first successful gas-powered car in the United States by the same table.', record: 'The Library of Congress, Everyday Mysteries, automobile highlights table' },
      ],
      steps: [
        'Write the claim exactly as it was spoken, and name what it counts: the invention of the automobile, by a nation.',
        'Open the record the reporters cited and read the sentence under the answer, the disclaimer that the question has no straightforward answer.',
        'Split the question by definition using the Library’s own table: self-propelled road vehicle in 1769, patented gasoline car in 1886, successful American gas car in 1893.',
        'State each first at the strength the record gives it, and say plainly that choosing the definition is ours, not the record’s.',
      ],
      settled: 'France has the earliest self-propelled road vehicle in the record, Germany the first patented gasoline automobile, and the United States its first successful gas car and first car company.',
      stillOpen: 'Which of those firsts should be called the invention of the car is a question of definition that no fetched record answers for us.',
    },
    quiz: { questions: [
      { q: 'Why did the Library of Congress say the reporters had gone too far in 2009?',
        options: ['The reporters had read a different library', 'Its page said the question had no straightforward answer, and named Benz only as the probable choice if one had to be named', 'The Library had never mentioned Benz at all'],
        answer: 1, explain: 'The reporters kept the name and dropped the qualifier. "He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13).' },
      { q: 'What did the Library change on its page in 2024?',
        options: ['It removed the table of early vehicles', 'It gave the credit to the United States', 'It said the question is a matter of opinion and that knowledge of the invention continues to evolve'],
        answer: 2, explain: 'The facts stayed; the confidence of the headline was lowered, in public, with the earlier words still on the record.' },
    ] },
    facilitator: {
      howToRun: 'Prayer + the anchor (5): pray; read Proverbs 18:13 and Proverbs 25:2 aloud. The competency in one sentence (10): define before you count. Teach it (15): read the president’s sentence, then the blog’s reply, then the 2009 page wording, then the 2024 wording, in that order. Work it on the case (20): split the question by the table’s three definitions and state each first. Discussion (10). Send-off (5): each person writes their own definition of a car and the first that fits it.',
      talkingPoints: [
        'The question comes before the answer; a first means nothing until you say what is being counted.',
        'The qualifier under a headline is often where the truth lives; the reporters copied the name and dropped the disclaimer.',
        'A careful institution corrected how it was quoted in public, and later rewrote its own page; both versions are on the record.',
        'The record supplies dated facts for each definition; choosing the definition is our work, done openly.',
      ],
      discussionPrompts: [
        'What do you mean by a car, and which first in the table fits your definition?',
        'Why do national firsts get repeated without being checked?',
        'What does it say about an institution when it revises its own page as it learns?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // 2. GO TO THE ISSUING RECORD: THE PATENT, AND TWO OR THREE WITNESSES
  // ---------------------------------------------------------------------------
  {
    id: 'car2-go-to-the-issuing-record',
    title: 'Go to the issuing record: the patent, and two or three witnesses',
    bigIdea: 'When a claim is about a document, go to the office that issued it. The Word sets the rule for settling any matter: "at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established" (Deuteronomy 19:15). In January 2026 a respected museum marked the anniversary of the granting of German patent no. 37345 to Karl Benz. The patent office’s own page, the company that carries Benz’s name today, the patent record itself and the United Nations all give the number as 37435, applied for on January 29, 1886 and granted on November 2, 1886. One digit and one verb were wrong, and only a second and third witness could show it.',
    inApp: 'Make a table with four columns: the museum, the patent office, the company, the patent record. Write in each column the patent number and the two dates that witness gives (applied for, granted). Circle every cell that disagrees with the others. Save it in your Study beside the table from lesson one.',
    anchor: { ref: 'Deuteronomy 19:15; Habakkuk 2:2; Proverbs 12:19; Luke 1:3', theme: 'Yahweh establishes a matter by more than one witness, "at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established" (Deuteronomy 19:15), and He tells His people to write a thing down so it can be read and run with: "Write the vision, and make it plain upon tables, that he may run that readeth it" (Habakkuk 2:2). A true record outlasts a careless one, "The lip of truth shall be established for ever: but a lying tongue is but for a moment" (Proverbs 12:19), and Luke shows the researcher’s posture: "having had perfect understanding of all things from the very first, to write unto thee in order" (Luke 1:3).' },
    stories: [
      { title: 'Two numbers that look the same', body: 'A boy copied a patent number from a museum page for his science report: 37345. His older sister checked it against the patent office’s own page and found 37435. They looked at each other and laughed, because the two numbers use the same digits in a different order. Then she asked him which one he would trust, the museum or the office that wrote the patent. He said the office. She said good, but check a third one too. The company’s history page said 37435. So did the patent record. He fixed his report and wrote all four sources at the bottom.' },
      { title: 'Applied for, and granted', body: 'A grandmother who had worked in a lawyer’s office told her grandchildren that a patent has two dates, the day you ask for it and the day it is granted. They were reading about Karl Benz, and one page said his patent was granted on January 29, 1886. She shook her head and said that is the day he asked. They found the patent office’s page, written in German, and with a dictionary they worked out that the patent was granted on November 2, 1886, counted back to January 29. She told them the difference between asking and receiving matters in law, in history and in prayer.' },
    ],
    benefits: [
      'You go to the office that issued a document before you trust anyone’s summary of it.',
      'You read two or three witnesses side by side, so a single careless copy cannot settle a matter.',
      'You know a patent has two dates, applied for and granted, and you keep them apart.',
      'You treat a small error in a trusted source as a reason to check, not a reason to sneer.',
      'You can teach a child that writing a thing down plainly is how it is kept for the next generation.',
    ],
    levels: {
      child: 'A patent is a paper from the government. It says, this person made this new thing. It has a number. It has dates. When we want to know about a patent, we go to the office that wrote it. That is called the issuing record.\n\nKarl Benz got a patent for his car. Many pages talk about it. But they do not all say the same thing! In 2026, a car museum wrote that the number was 37345. The patent office says the number is 37435. Look closely. The digits are the same. Two of them are in a different order. That is an easy mistake to make.\n\nHow do we know which is right? The Bible tells us. "at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established" (Deuteronomy 19:15). A witness is someone who tells what is true. We need more than one. So we check more pages. The patent office says 37435. The car company says 37435. The patent paper says 37435. The United Nations listed it in 2011. It said 37435 too. Four witnesses agree. So the number is 37435.\n\nThere is a second mistake. The museum said the patent was given on January 29, 1886. But that is the day Benz asked for it. The patent office says he got it on November 2, 1886. Asking and getting are two different days.\n\nThe Bible says to write things down plainly. "Write the vision, and make it plain upon tables, that he may run that readeth it" (Habakkuk 2:2). A patent is written down plainly, so anyone can read it. That is why we can still check it today.\n\nThe Bible also says the truth lasts. "The lip of truth shall be established for ever: but a lying tongue is but for a moment" (Proverbs 12:19). The museum did not lie. It made a small slip. Further down its own page, it got the dates right. When we check carefully, the truth stands.\n\nYahweh is the One who knows everything exactly. We are not. So we check. Ask your parents to help you find two pages about one fact. See if they agree.',
      youth: 'The second skill is this: when a claim is about a document, go to the office that issued the document. For a patent, that is the patent office. Everyone else is repeating it.\n\nKarl Benz’s patent is one of the most famous papers in the history of machines. In 2011 the United Nations added it to UNESCO’s Memory of the World register, a list of documents the world has agreed to protect. Its notice listed patent DRP 37435, a vehicle with gas engine operation, submitted by Carl Benz of Mannheim on 29 January 1886.\n\nIn January 2026 a respected car museum wrote that the month marked the 140th anniversary of the granting of German patent no. 37345. Read that number slowly. The patent office, the car company, the patent record and the United Nations all give it as 37435. The museum swapped two digits. It also called January 29 the day the patent was granted. The patent office says Benz applied on January 29, 1886 and received the patent on November 2, 1886, counted back to the day he applied. The museum had the right event and two wrong details.\n\nHere is what makes this a lesson and not a gotcha. The same museum page, further down, gives the application date and the grant date correctly. One careful paragraph and one careless one sit on the same page. A reader who stops at the first sentence takes away two errors. A reader who keeps going, and checks a second and third witness, gets it right.\n\nThe Word set that rule long before any patent office existed: "at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established" (Deuteronomy 19:15). One source is not enough, even a good one. It also tells us why writing things down matters: "Write the vision, and make it plain upon tables, that he may run that readeth it" (Habakkuk 2:2). A patent is published so anyone can read it, and that is why we can still check this one today.\n\nYahweh’s word is exact; ours is not always. "The lip of truth shall be established for ever: but a lying tongue is but for a moment" (Proverbs 12:19). Talk with your parents about a time a small copying error caused a big confusion, and how it was found.',
      teen: 'The second competency is to go to the issuing record. When a claim is about a document, the office that issued it is the first witness. Everyone else is a copy.\n\nKarl Benz’s patent is among the most famous documents of the machine age. In 2011 UNESCO added it to its Memory of the World register. The United Nations notice listed patent DRP 37435, a vehicle with gas engine operation, submitted by Carl Benz of Mannheim on 29 January 1886.\n\nNow the case. In January 2026 a respected motor museum published an anniversary page. It said the month marked the 140th anniversary of the granting of German patent no. 37345. Set four witnesses beside it. The patent office’s own page, the company that carries Benz’s name today, the patent record and the United Nations all give 37435. Two digits were swapped. The museum also called January 29 the grant date. The patent office says Benz applied on January 29, 1886. He received the patent on November 2, 1886, dated back to the day he applied. So the museum had the right event, a transposed number and the wrong verb.\n\nNotice the shape of the error. It is not a lie. It is the kind of slip careful people make, and the museum’s own page shows it. Further down, the same page states the application date and the grant date correctly. A reader who stops at the first line leaves with two errors. A reader who reads on, then checks a second and third source, does not.\n\nThat is the Word’s rule for settling any matter: "at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established" (Deuteronomy 19:15). One witness can be honest and wrong. Two or three let the error show itself.\n\nThe Word also explains why the record can still be checked: "Write the vision, and make it plain upon tables, that he may run that readeth it" (Habakkuk 2:2). A patent is a public document. It was written so anyone could read it, then and now. Luke shows the posture: "having had perfect understanding of all things from the very first, to write unto thee in order" (Luke 1:3). And Yahweh tells us which record lasts: "The lip of truth shall be established for ever: but a lying tongue is but for a moment" (Proverbs 12:19).\n\nDiscuss with your parents which source they would trust first, and why. Then decide together how many witnesses a fact needs before you repeat it.',
      senior: 'Teach this lesson as the discipline of the issuing record. When a claim concerns a document, the office that issued the document is the first and best witness, and every other account is a copy of it with whatever errors the copying introduced.\n\nKarl Benz’s patent is among the most celebrated documents of the industrial age. In 2011 UNESCO inscribed it on its Memory of the World register, and the United Nations notice of that year listed it exactly: patent DRP 37435, a vehicle with gas engine operation, submitted by Carl Benz of Mannheim on 29 January 1886.\n\nThe case comes from January 2026, when a respected motor museum published a page marking what it called the 140th anniversary of the granting of German patent no. 37345. Lay four witnesses beside that sentence. The patent office’s own page, the company that carries Benz’s name today, the patent record itself and the United Nations all give the number as 37435. Two digits have changed places. The museum also called January 29 the date of the grant. The patent office states that Benz applied on January 29, 1886, and received the patent on November 2, 1886, with the grant dated back to the application. The event is right; the number is transposed; the verb is wrong.\n\nThe shape of the error is the instruction. It is not deception. It is the ordinary slip of a careful institution, and the museum’s own page shows as much, because further down it gives the application date and the grant date correctly. A reader who stops at the first sentence leaves with two errors. A reader who reads on, and then consults a second and third witness, does not.\n\nThe Word set this rule long before any patent office was founded: "at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established" (Deuteronomy 19:15). One witness may be entirely honest and still mistaken. It also explains why the record is still there to consult: "Write the vision, and make it plain upon tables, that he may run that readeth it" (Habakkuk 2:2). The patent was published so that anyone could read it, and that is why we can check it now. Luke’s method is the model, "having had perfect understanding of all things from the very first, to write unto thee in order" (Luke 1:3), and Yahweh tells us which record endures: "The lip of truth shall be established for ever: but a lying tongue is but for a moment" (Proverbs 12:19).\n\nAsk your grown children how many sources they read before they repeat a fact. Then show them this one.',
    },
    lesson: 'The second competency is to go to the issuing record. When a claim is about a document, the office that issued the document is the first witness, and everyone else is a copy. Karl Benz’s patent is a good place to practise, because it is famous enough to be copied everywhere.\n\nStart with what the world has agreed to keep. In 2011 UNESCO added the Benz patent to its Memory of the World register, and the United Nations notice of that year named it plainly: patent DRP 37435, a vehicle with gas engine operation, submitted by Carl Benz of Mannheim on 29 January 1886. The company that carries Benz’s name today calls it the birth certificate of the automobile. The patent record itself, as it is kept today, carries the same date as its prior-art date: 1886-01-29.\n\nNow the case. In January 2026 a respected motor museum published a page marking the 140th anniversary of the granting of German patent no. 37345. Set the witnesses beside it. The patent office’s own page, the company, the patent record and the United Nations all give the number as 37435. Two digits changed places. The museum also called January 29 the day the patent was granted. The patent office says Benz applied on January 29, 1886, and received the patent on November 2, 1886, dated back to the day he applied. The event is right. The number is transposed. The verb is wrong.\n\nThe shape of the error is the lesson. It is not a lie. It is the ordinary slip of a careful institution, and the museum’s own page proves it: further down, the same page gives the application date and the grant date correctly. A reader who stops at the first sentence leaves with two errors. A reader who reads to the end, and then opens a second and a third witness, does not.\n\nThe Word set this rule long before any patent office existed: "at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established" (Deuteronomy 19:15). One witness can be honest and wrong. The Word also tells us why the record is still there to check: "Write the vision, and make it plain upon tables, that he may run that readeth it" (Habakkuk 2:2). A patent is published so that anyone can read it. Luke shows the posture of the one who reads it, "having had perfect understanding of all things from the very first, to write unto thee in order" (Luke 1:3), and Yahweh tells us which record lasts: "The lip of truth shall be established for ever: but a lying tongue is but for a moment" (Proverbs 12:19).',
    voices: [
      { speaker: 'Irina Bokova, Director-General of UNESCO', year: 2011, where: 'UN News, May 2011, the day she endorsed the new inscriptions on the Memory of the World register, the Benz patent among them.', source: SRC.un,
        words: 'By helping safeguard and share such a varied documentary heritage, UNESCO’s Memory of the World Programme reinforces the basis for scholarship and enjoyment of the creative wealth and diversity of human cultures and societies.',
        why: 'Why the world keeps documents like this one: so that anyone, later, can read the original.' },
      { speaker: 'The National Motor Museum, Beaulieu', year: 2026, where: 'Its anniversary page of January 15, 2026, in its opening sentence.', source: SRC.nmm,
        words: '29th January 2026 marks the 140th anniversary of the granting of German patent no. 37345 to Karl Benz of Mannheim.',
        why: 'The claim this lesson tests, quoted exactly as published, transposed number and all.' },
      { speaker: 'The National Motor Museum, Beaulieu', year: 2026, where: 'The same page of January 15, 2026, further down, under its picture of the patent.', source: SRC.nmm,
        words: 'The German patent application of January 29, 1886, that was granted on November 2, 1886, to Benz & Company in Mannheim.',
        why: 'The same institution getting both dates right a few paragraphs later: the slip and its correction on one page.' },
      { speaker: 'The German Patent and Trade Mark Office (DPMA)', year: 2026, where: 'Its page on Bertha Benz, written for the 140th year of the patent, in German as the office published it.', source: SRC.dpmaBertha,
        words: 'am 2. November 1886, hatte Carl Benz vom Kaiserlichen Patentamt, dem Vorläufer des DPMA, ein Patent auf sein',
        why: 'The issuing office’s own successor, giving the grant date. In English: on November 2, 1886 Carl Benz had received from the Imperial Patent Office, the forerunner of the DPMA, a patent on his vehicle.',
        note: 'Our translation of the German, offered for reading; the quotation is the office’s German, as fetched.' },
    ],
    timeline: [
      { year: 1886, event: 'On January 29 Karl Benz applies for a patent on his vehicle powered by a gas engine, patent number 37435.',
        record: 'Mercedes-Benz Group, company history, 1885-1886.', source: { ...SRC.mb, phrase: 'the patent - number 37435 - may be regarded as the birth certificate of the automobile' } },
      { year: 1886, event: 'On November 2 the Imperial Patent Office grants the patent, dated back to January 29.',
        record: 'The German Patent and Trade Mark Office, its page on Bertha Benz.', source: { ...SRC.dpmaBertha, phrase: 'rückwirkend zum 29. januar 1886 erhalten' } },
      { year: 2011, event: 'UNESCO inscribes the Benz patent on its Memory of the World register, one of 45 new documents and collections that year.',
        record: 'UN News, May 2011.', source: { ...SRC.un, phrase: 'patent drp 37435' } },
      { year: 2026, event: 'A museum marks the 140th anniversary of the patent with a transposed number and the filing date called the grant, and corrects both further down the same page.',
        record: 'The National Motor Museum, Beaulieu, January 15, 2026.', source: { ...SRC.nmm, phrase: 'the granting of german patent no. 37345' } },
    ],
    workedCase: {
      claim: { words: '29th January 2026 marks the 140th anniversary of the granting of German patent no. 37345 to Karl Benz of Mannheim.', by: 'The National Motor Museum, Beaulieu, January 15, 2026', source: SRC.nmm },
      event: { year: 2026, what: 'A respected museum publishes an anniversary page whose first sentence transposes the patent number and calls the filing date the grant.' },
      closedDoors: {
        hidden: 'A swapped pair of digits and a filing date called a grant are invisible to a reader who trusts the museum and never opens the issuing office’s own record.',
        light: 'The issuing office’s successor, the company that carries Benz’s name today, the patent record and the United Nations all state the number and the dates, and the museum’s own page states the dates correctly further down.',
        verse: '"at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established" (Deuteronomy 19:15).',
        heart: '"The lip of truth shall be established for ever: but a lying tongue is but for a moment" (Proverbs 12:19).',
      },
      risk: 'A trusted institution’s slip gets copied into reports and articles, and a wrong number travels further than the right one because the source looked authoritative.',
      opportunity: 'A patent is a public document with an issuing office, so every copy can be checked against it, and the error can be fixed by anyone who looks.',
      constraint: 'The original 1886 patent document itself was not fetched here; the number and dates rest on the office’s successor, the company, the patent record and the United Nations, four witnesses that agree.',
      economics: [
        { figure: '37435', meaning: 'The patent number as the patent office, the company, the patent record and the United Nations all give it.', record: 'DPMA; Mercedes-Benz Group; Google Patents DE37435C; UN News, May 2011' },
        { figure: '37345', meaning: 'The number in the museum’s opening sentence: the same digits with two of them swapped.', record: 'The National Motor Museum, January 15, 2026' },
        { figure: '277 days', meaning: 'The time from Benz’s application on January 29, 1886 to the grant on November 2, 1886, the gap between asking and receiving that the museum’s first sentence closed.', record: 'The German Patent and Trade Mark Office, its page on Bertha Benz' },
        { figure: '45 new items', meaning: 'The documents and collections added to the Memory of the World register the year the patent joined it, bringing the register to 238.', record: 'UN News, May 2011' },
      ],
      steps: [
        'Copy the claim exactly and underline the two checkable details: the patent number and the word granting with its date.',
        'Open the issuing office’s own record first, then the company that carries Benz’s name today, then the patent record and the United Nations notice.',
        'Lay the four witnesses in a table and mark where the museum differs: 37345 against 37435, and granted against applied for.',
        'Read the museum’s own page to the end and note that it states both dates correctly further down, so the slip is in one sentence.',
        'State the fact at the strength four agreeing witnesses give it, and name the original 1886 document as the record not fetched.',
      ],
      settled: 'Karl Benz applied for patent 37435 on January 29, 1886 and received it on November 2, 1886, dated back to the application, by four agreeing witnesses.',
      stillOpen: 'The original paper patent of 1886 was not opened here; its own text is the record still to read in full.',
    },
    quiz: { questions: [
      { q: 'Which number do the patent office, the company, the patent record and the United Nations all give for Benz’s patent?',
        options: ['37345', '37435', '1886'],
        answer: 1, explain: 'Four witnesses agree on 37435; the museum’s first sentence swapped two digits. "at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established" (Deuteronomy 19:15).' },
      { q: 'What happened on January 29, 1886?',
        options: ['The patent was granted', 'Benz drove his car in public for the first time', 'Benz applied for the patent, which was granted on November 2, 1886 and dated back to January 29'],
        answer: 2, explain: 'A patent has two dates, applied for and granted; the patent office keeps them apart, and so should we.' },
    ] },
    facilitator: {
      howToRun: 'Prayer + the anchor (5): pray; read Deuteronomy 19:15 and Habakkuk 2:2 aloud. The competency in one sentence (10): go to the office that issued the document. Teach it (15): read the United Nations notice, then the museum’s first sentence, then the patent office’s dates. Work it on the case (20): fill the four-witness table and circle the disagreements, then read the museum page to the end. Discussion (10). Send-off (5): each person checks one fact they believe against two sources before the next lesson.',
      talkingPoints: [
        'For a document, the issuing office is the first witness; everyone else is a copy.',
        'Two or three witnesses set side by side let an honest slip show itself; one witness cannot.',
        'A patent has two dates, applied for and granted; history is full of the two being run together.',
        'A small error in a trusted source is a reason to check, not to sneer; the museum’s own page corrects it further down.',
      ],
      discussionPrompts: [
        'Which source would you have trusted first, and why?',
        'Why is a transposed number so easy to miss?',
        'Where else in your life do asking and receiving have two different dates?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // 3. OTHERS LABOURED: THE NAMES ONE ANSWER LEAVES OUT
  // ---------------------------------------------------------------------------
  {
    id: 'car3-others-laboured',
    title: 'Others laboured: the names one answer leaves out',
    bigIdea: 'Every "first" stands on work that came before it and work that came beside it. Jesus said so of His own harvest: "One soweth, and another reapeth" (John 4:37), and "other men laboured, and ye are entered into their labours" (John 4:38). In 2009 the Library of Congress named one inventor only because it was asked to name one. The records around that name hold a French engineer’s steam wagon, two German engineers’ engine and four-wheeled carriage, a woman who proved the machine worked by driving it, two American brothers who built the first American car company, and a lawyer who collected royalties on a car he never built. The Word’s instruction is to give each one what is due: "honour to whom honour" (Romans 13:7).',
    inApp: 'Draw a line across a page and mark it 1769 at one end and 1896 at the other. Put every person in this lesson on the line at the year the record gives, with one sentence of what they did. Then write beside Bertha Benz the verse "let her own works praise her in the gates" and say in one sentence why it fits.',
    anchor: { ref: 'John 4:37-38; Romans 13:7; Proverbs 31:31; 1 Corinthians 3:6-7', theme: 'Jesus names the shape of every great work, "One soweth, and another reapeth" (John 4:37), "other men laboured, and ye are entered into their labours" (John 4:38). The Word commands that credit be paid like a debt, "Render therefore to all their dues: tribute to whom tribute is due; custom to whom custom; fear to whom fear; honour to whom honour" (Romans 13:7), it honours the woman by her deeds, "Give her of the fruit of her hands; and let her own works praise her in the gates" (Proverbs 31:31), and it places the increase where it belongs: "I have planted, Apollos watered; but God gave the increase" (1 Corinthians 3:6).' },
    stories: [
      { title: 'The name on the trophy', body: 'A girl’s robotics team won a regional prize, and the newspaper printed one name, the boy who drove the robot in the final. At dinner her mother asked who built the arm, who wrote the code, and who fixed the wheel at midnight. The girl named five people, including herself. Her mother said the newspaper was not lying, it was just short. Then she asked her to write the five names on a card and give it to the coach, so the team’s record would be whole even if the newspaper’s was not.' },
      { title: 'Without his knowledge', body: 'A grandfather told his grandson about a woman in Germany who took her husband’s new motor car one August morning, with their two sons, and drove it to her mother’s town without telling him. Along the way she cleared a blocked fuel line herself, a blacksmith helped her out of a fix, and she bought fuel at a town pharmacy, which made it the first filling station. The boy asked why the history books mostly name the husband. The grandfather said that he held the patent and she proved the machine worked, and that a careful reader keeps both on the page.' },
    ],
    benefits: [
      'You see that every first stands on earlier work and beside parallel work, and you name both.',
      'You pay credit like a debt, to the person the record shows did the work.',
      'You notice who a single answer leaves out, including the women whose work was done out of sight.',
      'You can tell the difference between building a thing and owning a paper about it.',
      'You can teach a child that Yahweh gives the increase, and people plant and water in turn.',
    ],
    levels: {
      child: 'In lesson one, we learned that a library named Karl Benz as the probable inventor of the car. But many people helped make cars. Jesus said, "One soweth, and another reapeth" (John 4:37). That means one person plants and another person picks the crop. Big things are made by many hands.\n\nFirst, there was Nicolas-Joseph Cugnot in France. He was an engineer for the army. In 1769 he made a small model of a wagon that ran on steam. In 1770 he built a big one. It moved by itself, with no horse! But it was very slow. It had to stop every 15 minutes to get more wood for its fire.\n\nThen there were two men in Germany, Gottlieb Daimler and Wilhelm Maybach. In 1885 they made a small, light engine. In 1886 Daimler put it in a coach that horses used to pull. Now the coach could move by itself. It had four wheels.\n\nThen there was Bertha Benz. She was Karl Benz’s wife. One August day in 1888, she took the car and her two sons. She did not tell her husband. She drove all the way to her mother’s town and back. On the way she fixed problems herself. Her trip showed the world that the car really worked.\n\nThe Bible says, "Give her of the fruit of her hands; and let her own works praise her in the gates" (Proverbs 31:31). That means a woman’s good work should be praised. Bertha’s work deserves praise.\n\nIn America, two brothers named Duryea built a gas car. Frank Duryea drove it in 1893. In 1896 they started a company that made cars and sold them. A man named George Selden got a patent for a car in 1895. But he never built one! He collected money from others instead.\n\nThe Bible says, "Render therefore to all their dues" (Romans 13:7). That means give each person what they earned, even praise. So when someone asks who made the car, we can name many people.\n\nPaul said, "I have planted, Apollos watered; but God gave the increase" (1 Corinthians 3:6). People do the work. Yahweh makes it grow. Ask your parents about someone who helped your family who never got thanked. Then thank them together.',
      youth: 'The first lesson ended with a table of firsts. This one asks who the single answer leaves out. Jesus described every big harvest this way: "One soweth, and another reapeth" (John 4:37), and "other men laboured, and ye are entered into their labours" (John 4:38). No invention starts from nothing.\n\nStart in France. Nicolas-Joseph Cugnot was an army engineer asked to build a steam vehicle for hauling cannon. He made a working model in 1769, and in 1770 he showed a full-sized one he called a fardier à vapeur. It could reputedly move at a little over two miles an hour, and it had to stop every 15 minutes for more wood. It was slow and clumsy. It was also a road vehicle that moved itself, more than a century before Benz.\n\nNow Germany, beside Benz rather than before him. In 1885 Gottlieb Daimler and Wilhelm Maybach built a small, light engine. On March 8, 1886, Daimler fitted it into a stagecoach, and the German Historical Institute calls the result the world’s first four-wheeled automobile. Benz had three wheels; Daimler had four. Both are real.\n\nThen Bertha Benz. One August day in 1888 she took an improved version of her husband’s car, without his knowledge, and drove with their two sons from Mannheim to Pforzheim, her birthplace. The company record says the trip, about 180 kilometers there and back, demonstrated the practicality of the motor vehicle to the whole world. The patent office says that without her, the history of mobility would have been different. He held the patent. She proved it worked.\n\nIn America, Frank Duryea road-tested a gas car in Springfield, Massachusetts, in 1893, and in 1896 he, his brother Charles and their backers founded the first American company that made and sold cars. And George Selden took out a car patent in 1895, never built the car, and collected royalties from people who did.\n\nThe Word tells us what to do with all of this: "Render therefore to all their dues" (Romans 13:7). Credit is a debt. It honours the woman by her work, "let her own works praise her in the gates" (Proverbs 31:31), and it puts the growth where it belongs: "I have planted, Apollos watered; but God gave the increase" (1 Corinthians 3:6). Yahweh gave every one of them the wits and the iron. Ask your parents whose work your family stands on, and write those names down.',
      teen: 'The third competency is to ask who the single answer leaves out. A first is never alone. Jesus said it of His own harvest: "One soweth, and another reapeth" (John 4:37). "other men laboured, and ye are entered into their labours" (John 4:38). Read the record around any famous name and you will find the others.\n\nStart before Benz, in France. Nicolas-Joseph Cugnot was an army officer and engineer. The army asked him for a steam vehicle to haul cannon. He made a working model in 1769. In 1770 he unveiled a full-sized machine, a fardier à vapeur. It could reputedly move at a little over two miles an hour. It had to stop every 15 minutes for wood. It was a road vehicle that moved itself, a century before any gasoline car.\n\nNext, beside Benz. In 1885 Gottlieb Daimler and Wilhelm Maybach built a small, light engine. On March 8, 1886, Daimler fitted it into a stagecoach. The German Historical Institute calls that the world’s first four-wheeled automobile. So in one year, in one country, two teams built two different first cars.\n\nThen the person who proved the machine worked. One August day in 1888, Bertha Benz took an improved version of her husband’s car without his knowledge. With their two sons she drove from Mannheim to Pforzheim, her birthplace, and back. The company record calls it the first long-distance journey in automotive history, about 180 kilometers. The patent office says that without her the history of mobility would have been different. It also quotes Carl Benz remembering that she was more daring than he was. He held the patent. She supplied the proof.\n\nIn America, Frank Duryea road-tested a gasoline car in Springfield, Massachusetts, in 1893. In 1896 he, his brother Charles and their backers founded the first American company to make and sell cars. And one more name shows a different thing. George Selden took out a patent on a car in 1895. He never manufactured it. He collected royalties from those who did.\n\nThe Word gives the rule for all of them: "Render therefore to all their dues: tribute to whom tribute is due; custom to whom custom; fear to whom fear; honour to whom honour" (Romans 13:7). It honours the woman by her deeds: "Give her of the fruit of her hands; and let her own works praise her in the gates" (Proverbs 31:31). And it puts the growth where it belongs: "I have planted, Apollos watered; but God gave the increase" (1 Corinthians 3:6). Yahweh supplied every mind and every metal.\n\nTalk with your parents about whose work your own family stands on. Name them out loud.',
      senior: 'Teach this lesson as the discipline of the omitted, and open the hour with the Lord’s own description of how every great harvest comes in: "One soweth, and another reapeth" (John 4:37), and "other men laboured, and ye are entered into their labours" (John 4:38). A single name answers the reporter’s question. The record around that name nearly always holds others, and those who have lived long know how often the person named was not the only one who did the work.\n\nPut the earliest witness on the table first. A French officer and engineer, Nicolas-Joseph Cugnot, was set the task of a steam carriage to draw cannon, made a working model in 1769, and showed the full-sized fardier à vapeur in 1770. The library that keeps his story says it crept along at a little over two miles an hour and had to halt every quarter hour for wood. Ask the room whether that counts as a car, and let them argue it with the first lesson’s definitions in hand.\n\nThen lay the German record out in the order it happened. Daimler and Maybach’s light engine came in 1885; on March 8, 1886, Daimler set it in a stagecoach and, by the German Historical Institute’s reckoning, made the first four-wheeled automobile. Benz’s three-wheeler and Daimler’s four-wheeler were the work of separate men in the same land in the same year, which is the sort of fact a one-name answer cannot hold.\n\nGive the longest time to Bertha Benz. In August 1888, without telling her husband, she set off with their two sons on the improved car to her birthplace at Pforzheim and home again, a round trip the company puts at 180 kilometers. The patent office, of all institutions, writes that the history of mobility would have been different without her, and it records her husband’s later admission that she had more daring than he did. Many in the room will recognise the pattern: the paper in his name, the proof in her hands.\n\nClose the record in America with two contrasting claims. Frank Duryea tried a gasoline carriage on the road at Springfield, Massachusetts, in 1893, and with his brother Charles and their backers formed in 1896 the first American firm to make and sell motor cars. George Selden, by contrast, held a car patent dated 1895, built nothing, and drew royalties from those who did; owning a paper and making a machine are not the same labour, and the Library’s table keeps them apart.\n\nThe Word settles how the credit is to be paid: "Render therefore to all their dues: tribute to whom tribute is due; custom to whom custom; fear to whom fear; honour to whom honour" (Romans 13:7). It praises the woman for what her hands did, "Give her of the fruit of her hands; and let her own works praise her in the gates" (Proverbs 31:31), and it keeps the increase with Yahweh, who furnished every mind and every ore: "I have planted, Apollos watered; but God gave the increase" (1 Corinthians 3:6). Tell your family whose labour you entered into, and say their names aloud.',
    },
    lesson: 'The third competency is to ask who the single answer leaves out. In 2009 the Library of Congress named Karl Benz only because it was asked to name one inventor, and said so. The records around his name hold others, before him and beside him, and a researcher’s duty is to find them. Jesus described the shape of every great harvest: "One soweth, and another reapeth" (John 4:37), and "other men laboured, and ye are entered into their labours" (John 4:38).\n\nBefore Benz there was France. Nicolas-Joseph Cugnot, an army officer and engineer, was asked to build a steam vehicle to haul cannon. He made a scaled-down working model in 1769, and in 1770 he unveiled a full-sized machine he called a fardier à vapeur. It could reputedly move at a little over two miles an hour, and it had to stop every 15 minutes to take on wood. It was slow and clumsy, and it was a road vehicle that moved itself, more than a century before any gasoline car.\n\nBeside Benz there was Daimler. In 1885 Gottlieb Daimler and Wilhelm Maybach built a small, light engine, and on March 8, 1886, Daimler fitted it into a stagecoach. The German Historical Institute calls the result the world’s first four-wheeled automobile. In one year, in one country, two teams built two different first cars.\n\nThen there is the person who proved the machine worked. One August day in 1888, Bertha Benz took an improved version of her husband’s car, without his knowledge, and drove with their two sons from Mannheim to her birthplace at Pforzheim and back, about 180 kilometers by the company’s record. That record says she demonstrated the practicality of the motor vehicle to the entire world. The patent office says that without Bertha Benz the history of mobility would have been different. He held the patent; she supplied the proof.\n\nIn America, Frank Duryea road-tested a gasoline car in Springfield, Massachusetts, in 1893, and in 1896 he, his brother Charles and their backers founded the first American company that manufactured and sold automobiles. And one name shows a different kind of first: George Selden took out a patent on a car in 1895, never manufactured it, and collected royalties from the people who did. Building a thing and owning a paper about it are not the same work.\n\nThe Word tells us what to do with every one of them: "Render therefore to all their dues: tribute to whom tribute is due; custom to whom custom; fear to whom fear; honour to whom honour" (Romans 13:7). Credit is a debt. It honours the woman by her deeds, "Give her of the fruit of her hands; and let her own works praise her in the gates" (Proverbs 31:31). And it puts the growth where it belongs, with Yahweh who supplied every mind and every metal: "I have planted, Apollos watered; but God gave the increase" (1 Corinthians 3:6).',
    voices: [
      { speaker: 'The Linda Hall Library of Science, Engineering and Technology', year: 2018, where: 'Its Scientist of the Day article on Nicolas-Joseph Cugnot, February 26, 2018, on the steam vehicle he built for the French army.', source: SRC.lindaHall,
        words: 'Cugnot devised a scaled-down working model in 1769, and in 1770, he unveiled a full-sized steam-driven vehicle, which he called a fardier à vapeur.',
        why: 'The earliest self-propelled road vehicle in the record, from a science library’s own account.' },
      { speaker: 'The Library of Congress, Everyday Mysteries table', year: 2024, where: 'The page’s automobile highlights table as updated on December 5, 2024, read from the Wayback Machine’s dated copy.', source: SRC.locPage,
        words: 'Combined internal combustion engine with a carriage: patent no: 549,160 (1895). Never manufactured - Selden collected royalties.',
        why: 'A first of a different kind: a paper owned, a car never built, and money collected on it.' },
      { speaker: 'The German Patent and Trade Mark Office (DPMA)', year: 2026, where: 'Its English page Automobiles: the beginnings, as last updated on February 12, 2026, introducing its article on Bertha Benz.', source: SRC.dpmaIndex,
        words: 'On August 5, 1888, a woman heralded the era of the automobile: without Bertha Benz, the history of mobility would have been different.',
        why: 'The patent office itself giving the woman who drove the car her due beside the man who patented it.' },
    ],
    timeline: [
      { year: 1769, event: 'Nicolas-Joseph Cugnot builds a scaled-down working model of a steam vehicle for the French army.',
        record: 'Linda Hall Library, Scientist of the Day.', source: { ...SRC.lindaHall, phrase: 'cugnot devised a scaled-down working model in 1769' } },
      { year: 1770, event: 'Cugnot unveils his full-sized steam vehicle, the fardier à vapeur.',
        record: 'Linda Hall Library, Scientist of the Day.', source: { ...SRC.lindaHall, phrase: 'he unveiled a full-sized steam-driven vehicle' } },
      { year: 1885, event: 'Gottlieb Daimler and Wilhelm Maybach build a small, lightweight engine.',
        record: 'German History in Documents and Images, German Historical Institute.', source: { ...SRC.ghdi, phrase: 'the 1885 daimler-maybach engine was small and lightweight' } },
      { year: 1886, event: 'On March 8 Daimler fits his engine into a stagecoach, the first four-wheeled automobile by the German Historical Institute’s account.',
        record: 'German History in Documents and Images, German Historical Institute.', source: { ...SRC.ghdi, phrase: 'daimler took a stagecoach (made by wilhelm wimpff & son)' } },
      { year: 1888, event: 'On August 5 Bertha Benz drives the motor car with her two sons from Mannheim to Pforzheim and back, without her husband’s knowledge.',
        record: 'Mercedes-Benz Group, company history; the German Patent and Trade Mark Office.', source: { ...SRC.mb, phrase: 'without her husband\'s knowledge, benz\'s wife bertha and their two sons' } },
      { year: 1893, event: 'On September 21 Frank Duryea road-tests a second-hand carriage with a gasoline engine in Springfield, Massachusetts.',
        record: 'National Museum of American History, Smithsonian Institution, archived by the Wayback Machine.', source: { ...SRC.duryea, phrase: 'frank duryea road-tested the vehicle' } },
      { year: 1895, event: 'George Selden’s car patent, no. 549,160, is dated 1895; he never manufactures the car and collects royalties on the patent.',
        record: 'The Library of Congress, Everyday Mysteries, automobile highlights table.', source: { ...SRC.locPage, phrase: 'never manufactured - selden collected royalties' } },
      { year: 1896, event: 'Frank and Charles Duryea and their backers found the Duryea Motor Wagon Company, the first American company that made and sold automobiles.',
        record: 'National Museum of American History, Smithsonian Institution, archived by the Wayback Machine.', source: { ...SRC.duryea, phrase: 'founded the duryea motor wagon company' } },
      { year: 2009, event: 'The Library of Congress page names Karl Benz as the one inventor it would probably credit if it had to name one.',
        record: 'Matt Raymond, the Library of Congress blog, February 26, 2009.', source: { ...SRC.locBlog, phrase: 'if we had to give credit to one inventor' } },
      { year: 2018, event: 'The Linda Hall Library publishes its account of Cugnot’s steam vehicle.',
        record: 'Linda Hall Library, Scientist of the Day, February 26, 2018.', source: { ...SRC.lindaHall, phrase: 'tasked by the army to develop a steam-powered vehicle' } },
      { year: 2024, event: 'The Library of Congress table, as updated, records Selden’s patent and the royalties he collected without building a car.',
        record: 'The Library of Congress, Everyday Mysteries, updated December 5, 2024.', source: { ...SRC.locPage, phrase: 'combined internal combustion engine with a carriage' } },
      { year: 2026, event: 'The German patent office writes that without Bertha Benz the history of mobility would have been different.',
        record: 'The German Patent and Trade Mark Office, Automobiles: the beginnings.', source: { ...SRC.dpmaIndex, phrase: 'without bertha benz, the history of mobility would have been different' } },
    ],
    workedCase: {
      claim: { words: 'If we had to give credit to one inventor, it would probably be Karl Benz from Germany.', by: 'The Library of Congress, Everyday Mysteries, as quoted by its own blog on February 26, 2009', source: SRC.locBlog },
      event: { year: 2009, what: 'A national library, asked for one name, gives one name and says plainly that it is giving one only because it has to.' },
      closedDoors: {
        hidden: 'Bertha Benz took the car without her husband’s knowledge and proved it on the open road, and George Selden collected royalties on a car he never built; neither shows up in a one-name answer.',
        light: 'The company’s own history, the patent office’s pages and the Library’s own table put both on the public record, with the dates and the figures.',
        verse: '"For there is nothing covered, that shall not be revealed; neither hid, that shall not be known" (Luke 12:2).',
        heart: '"Let nothing be done through strife or vainglory; but in lowliness of mind let each esteem other better than themselves" (Philippians 2:3).',
      },
      risk: 'A single name taught as the whole answer erases the people whose work made the first car possible and the one who proved it worked.',
      opportunity: 'Every person in this lesson has a dated record, so the whole company of the invention can be taught in order, with each one’s work stated.',
      constraint: 'The records fetched here state what each person did; they do not settle who deserves the word inventor, which depends on the definition from lesson one.',
      economics: [
        { figure: '15 minutes', meaning: 'How often Cugnot’s steam vehicle had to stop to take on wood: the measure of how far the first self-propelled vehicle was from a usable one.', record: 'Linda Hall Library, Scientist of the Day' },
        { figure: '18 kilometers per hour', meaning: 'The top speed of Daimler’s four-wheeled motor car of 1886.', record: 'German History in Documents and Images, German Historical Institute' },
        { figure: '180 kilometers', meaning: 'Bertha Benz’s journey from Mannheim to Pforzheim and back, the trip that showed the world the machine was practical.', record: 'Mercedes-Benz Group, company history, 1885-1886' },
        { figure: '13 production models', meaning: 'The cars the Duryea Motor Wagon Company made; the only surviving one is in the collection of the Henry Ford Museum.', record: 'National Museum of American History, Smithsonian Institution' },
        { figure: '549,160', meaning: 'Selden’s patent number, on a car never manufactured, on which he collected royalties.', record: 'The Library of Congress, Everyday Mysteries table' },
      ],
      steps: [
        'Read the claim and its own qualifier: one inventor, only if one has to be named, and probably.',
        'List every person the surrounding records name, before the claim (Cugnot) and beside it (Daimler and Maybach, Bertha Benz, the Duryeas, Selden).',
        'Put each person on the line at the year the record gives, with what the record says they did and its figure.',
        'Separate the kinds of work: building, proving in use, founding a company, and owning a patent on a car never built.',
        'Give each one their due in a sentence, and leave the word inventor to the definition the reader chose in lesson one.',
      ],
      settled: 'The automobile was the work of many people across a century and three countries, and the records name each of them with a date and a deed.',
      stillOpen: 'Which of them should carry the single word inventor is still the question of definition the first lesson named; the record answers what each one did.',
    },
    quiz: { questions: [
      { q: 'What did Bertha Benz do in August 1888?',
        options: ['She applied for the patent', 'She drove the motor car with her two sons from Mannheim to Pforzheim and back, without her husband’s knowledge', 'She built the first steam vehicle'],
        answer: 1, explain: 'The patent office says that without her the history of mobility would have been different. "let her own works praise her in the gates" (Proverbs 31:31).' },
      { q: 'What did George Selden do with his car patent of 1895?',
        options: ['Collected royalties on it without ever manufacturing the car', 'Built thirteen cars', 'Gave it to the Duryea brothers'],
        answer: 0, explain: 'Owning a paper about a thing and building the thing are different work; the Library’s table records both.' },
    ] },
    facilitator: {
      howToRun: 'Prayer + the anchor (5): pray; read John 4:37-38 and Romans 13:7 aloud. The competency in one sentence (10): ask who the single answer leaves out. Teach it (15): Cugnot, then Daimler and Maybach, then Bertha Benz, then the Duryeas and Selden, each from the record. Work it on the case (20): put every person on one timeline with their deed and their figure. Discussion (10). Send-off (5): each person writes the names of the people whose labour their own family entered into.',
      talkingPoints: [
        'Every first stands on earlier work and beside parallel work; the record names both.',
        'Credit is a debt the Word tells us to pay, to the person the record shows did the work.',
        'Bertha Benz proved the machine on the open road; the patent office gives her her due.',
        'Building a thing, proving it, selling it and owning a paper about it are four different kinds of work.',
      ],
      discussionPrompts: [
        'Whose work is left out when you are told one name?',
        'Why does the Word tell us to give honour as a debt?',
        'What is the difference between Selden’s first and the Duryeas’ first?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // 4. FOR THE MULTITUDE, AND THE GIVER OF EVERY INVENTION
  // ---------------------------------------------------------------------------
  {
    id: 'car4-for-the-multitude-and-the-giver',
    title: 'For the multitude, and the Giver of every invention',
    bigIdea: 'An invention becomes part of ordinary life when it reaches ordinary people, and every invention begins with what Yahweh made and taught. On October 1, 1908 the Model T went on sale at $850, and by early 1914 Ford’s moving lines turned out a finished car every 93 minutes. The Word says where that kind of knowledge comes from: "I wisdom dwell with prudence, and find out knowledge of witty inventions" (Proverbs 8:12), and of the farmer, "For his God doth instruct him to discretion, and doth teach him" (Isaiah 28:26). The worlds the inventors worked with "were framed by the word of God" (Hebrews 11:3). This lesson finishes the case and writes it in order for the children.',
    inApp: 'Write the answer to "Who invented the car?" in five sentences, one for each lesson’s finding, with the record named after each sentence. End with one sentence about where the knowledge came from, with its verse. Read it to a child, and keep it in your Study as the course’s deliverable.',
    anchor: { ref: 'Proverbs 8:12; Isaiah 28:24-26; Hebrews 11:3; Colossians 1:16-17; Deuteronomy 6:7', theme: 'Wisdom speaks of herself as the finder of every good device, "I wisdom dwell with prudence, and find out knowledge of witty inventions" (Proverbs 8:12), and Isaiah says the farmer’s skill is taught, "For his God doth instruct him to discretion, and doth teach him" (Isaiah 28:26). The material and the laws were His before any workshop: "Through faith we understand that the worlds were framed by the word of God, so that things which are seen were not made of things which do appear" (Hebrews 11:3), and "by him all things consist" (Colossians 1:17). The finding is to be passed on: "And thou shalt teach them diligently unto thy children" (Deuteronomy 6:7).' },
    stories: [
      { title: 'The car for the great multitude', body: 'A farmer’s son in the hill country grew up hearing his grandfather tell how the family got its first car. It was a Model T, bought used, and it did everything. It took eggs to town, pulled a stuck wagon out of the creek, and with one wheel jacked up it ran a saw. The grandfather said the roads were so bad that the car’s high clearance was the only reason it got anywhere. The boy asked who invented it. The grandfather laughed and said a great many people, and that the man who made it cheap enough for them was the one they talked about at the feed store.' },
      { title: 'Where the iron came from', body: 'A mechanic who taught Sunday school had his class look under the hood of an old truck. He asked them where the steel came from, and they said a factory. Before the factory, he asked. A mine. Before the mine. The ground. And who put it there? A girl said Yahweh. He told them that every inventor in history had to start with things he did not make and laws he did not write, and that the honest ones said so. Then he read them the verse about the worlds being framed by the word of God, and let them close the hood.' },
    ],
    benefits: [
      'You see that an invention changes ordinary life when it reaches ordinary people, and you can name the records that show how.',
      'You can read a figure like 93 minutes as a measure of method, not of genius alone.',
      'You hold every human invention under the One who made the materials and wrote the laws they obey.',
      'You can write a finding in order, with a record under every sentence, plain enough for a child.',
      'You leave the course knowing the honest answer to a famous question, and how a community came to it.',
    ],
    levels: {
      child: 'The first cars were made one at a time. Then a man named Henry Ford made a car called the Model T. It came out in 1908. It cost $850. That was cheap for a car back then. Many more families could buy one.\n\nFord also found a faster way to build cars. It was called the assembly line. In 1913, workers stood in a row. Each one did one small job. Then the part slid to the next person. At first the line made flywheel parts. Then it made whole cars. By early 1914 the line could finish a whole Model T in just 93 minutes. Before, one car took more than 12 hours! By 1927, there were 15 million Model Ts.\n\nSo who invented the car? Here is the whole answer from this course. Cugnot built a steam wagon that moved by itself. Benz got the patent for a gas car. Daimler built a car with four wheels. Bertha Benz drove the car far and showed it worked. The Duryea brothers started a car company in America. Ford made cars cheap enough for many families. Many hands made the car.\n\nBut where did they get their ideas? The Bible tells us. "I wisdom dwell with prudence, and find out knowledge of witty inventions" (Proverbs 8:12). Witty inventions are clever new things. Wisdom comes from Yahweh. The Bible even says Yahweh teaches the farmer how to plant. "For his God doth instruct him to discretion, and doth teach him" (Isaiah 28:26).\n\nAnd the iron, the fire and the wheels? Yahweh made the world they came from. "Through faith we understand that the worlds were framed by the word of God, so that things which are seen were not made of things which do appear" (Hebrews 11:3). Every inventor used things Yahweh made.\n\nThe Bible tells parents to teach their children. "And thou shalt teach them diligently unto thy children" (Deuteronomy 6:7). So tell someone what you learned. Children, tell your parents the whole answer to who made the car. Then thank Yahweh for the wisdom He gives.',
      youth: 'The last lesson finishes the case. An invention does not change the world when it is first built. It changes the world when ordinary people can use it. For cars, that happened when a car became cheap enough for a farmer to buy.\n\nThe Henry Ford’s own curator writes that when Ford introduced the Model T on October 1, 1908, it was the result of Henry Ford’s effort to build an inexpensive, efficient and reliable car that would put owning one within reach of far more people. It cost $850, cheap for its day. It could reach 40 miles an hour on a smooth road and get 20 miles per gallon. It sat high, because America’s roads were among the worst in the industrialized world.\n\nThen came the method. The museum’s article on Ford’s shops says the assembly line arrived in stages. Around April 1, 1913, flywheel magnetos went onto moving lines: instead of one worker making one flywheel in about 20 minutes, a line of workers each did a small piece, and a whole flywheel came off every 13 minutes, and soon every five. Ford moved the idea to engines, then transmissions, and in August 1913 to the whole chassis. By early 1914 the lines could finish a Model T every 93 minutes, against twelve and a half hours before. By 1927 the 15 millionth Model T came off the line.\n\nSo here is the course’s answer, in order. A French engineer built a self-propelled steam road vehicle in 1769. Karl Benz built a gasoline car and patented it in 1886, the same year Daimler built a four-wheeled one. Bertha Benz proved it on the open road in 1888. The Duryeas built an American gas car in 1893 and the first American car company in 1896. Ford put the car within reach of the multitude from 1908. The Library of Congress now says our knowledge of all this continues to evolve.\n\nWhere did their skill come from? The Word answers: "I wisdom dwell with prudence, and find out knowledge of witty inventions" (Proverbs 8:12). Even the farmer is taught: "For his God doth instruct him to discretion, and doth teach him" (Isaiah 28:26). And everything they worked with was already His: "by him all things consist" (Colossians 1:17). Yahweh framed the worlds; people find out how they work.\n\nThe Word also says what to do with what we learn: "And thou shalt teach them diligently unto thy children" (Deuteronomy 6:7). Ask your parents to listen while you read them your five sentences.',
      teen: 'The fourth competency is to finish the case and write it in order. An invention becomes history when it reaches ordinary people. For the car, that moment has a date and a price.\n\nThe Henry Ford’s former curator of transportation writes that Ford introduced the Model T on October 1, 1908. He calls it the result of Henry Ford’s quest to build an inexpensive, efficient and reliable car. The aim was to put owning one within reach of far more people. It sold for $850, cheap for its day. It reached about 40 miles an hour and got about 20 miles per gallon. It sat high off the ground, because American roads were so poor.\n\nThe method came next, and the museum’s article gives it in stages. Around April 1, 1913, flywheel magnetos moved onto lines. One worker had needed about 20 minutes per flywheel. A line of workers turned one out every 13 minutes, then every five. Ford moved the line to engines, then transmissions, and in August 1913 to the whole chassis. By early 1914 three continuous lines finished a Model T every 93 minutes. Under the old method a car had taken twelve and a half hours. By 1927 the 15 millionth Model T came off the line.\n\nNow the whole finding, in order, with its records. Cugnot built a self-propelled steam road vehicle in 1769 (the Library of Congress table; the Linda Hall Library). Benz built a gasoline car and patented it in 1886, granted in November (the patent office). Daimler built a four-wheeled car the same year (the German Historical Institute). Bertha Benz proved it on the road in 1888 (the patent office; the company). The Duryeas built an American gas car in 1893 and the first American car company in 1896 (the Smithsonian). Ford made it a car for the multitude from 1908 (The Henry Ford). And the Library of Congress now says our knowledge continues to evolve.\n\nThen the frame under all of it. "I wisdom dwell with prudence, and find out knowledge of witty inventions" (Proverbs 8:12). "For his God doth instruct him to discretion, and doth teach him" (Isaiah 28:26). Inventors discover. Yahweh designed. "Through faith we understand that the worlds were framed by the word of God, so that things which are seen were not made of things which do appear" (Hebrews 11:3). "And he is before all things, and by him all things consist" (Colossians 1:17).\n\nThe Word sends the finding home: "And thou shalt teach them diligently unto thy children" (Deuteronomy 6:7). Read your five sentences to your parents, and ask them which record they would check first.',
      senior: 'Teach this final lesson as the completion of the case and the writing of it. Open with the observation that an invention enters history in earnest only when it reaches ordinary people. For the motor car that moment carries a date, a price and a method, all on the record.\n\nThe Henry Ford’s former curator of transportation writes that Ford Motor Company introduced the Model T on October 1, 1908. He calls it the culmination of Henry Ford’s pursuit of an inexpensive, efficient and reliable vehicle, one that would bring car ownership within reach of far more people. At $850 it was cheap for its day. It would reach some 40 miles an hour where a smooth road could be found, and it ran about 20 miles to the gallon. It was built high and flexible because the nation’s roads were so poor. Many of us heard those roads described by grandparents who drove them.\n\nThe method is documented with equal care. The museum’s account of the Ford shops dates the moving line in stages. Flywheel magnetos came first, around April 1, 1913, where a line of workers cut the time for one assembly from some twenty minutes to thirteen, and then to five. Engines followed, then transmissions, and in August 1913 the complete chassis. By early 1914 three continuous lines delivered a finished Model T every 93 minutes. The old stationary method had taken twelve and a half hours. By 1927 the fifteen millionth car had left the line.\n\nSet the whole finding down in order, each sentence on its record. Cugnot built a self-propelled steam road vehicle in 1769. Benz patented a gasoline car in 1886, and Daimler built a four-wheeled car the same year. Bertha Benz proved the car on the open road in 1888. The Duryeas built an American gas car in 1893 and their company in 1896. Ford made a car for the multitude from 1908. And the Library of Congress now judges that knowledge of the invention continues to evolve.\n\nThen place it under the frame the Word supplies. "I wisdom dwell with prudence, and find out knowledge of witty inventions" (Proverbs 8:12). Isaiah says even the farmer’s judgment is taught from above: "For his God doth instruct him to discretion, and doth teach him" (Isaiah 28:26). The engineer discovers what Yahweh designed. The iron, the fire and the laws of motion were His first. "Through faith we understand that the worlds were framed by the word of God, so that things which are seen were not made of things which do appear" (Hebrews 11:3), and "by him all things consist" (Colossians 1:17).\n\nClose with the duty of the generation that knows the story: "And thou shalt teach them diligently unto thy children" (Deuteronomy 6:7). Grandparents, sit with your grandchildren and tell them the first car you remember, then read them the five sentences with their records.',
    },
    lesson: 'The fourth competency is to finish the case and write it in order, plain enough for a child, with a record under every sentence. An invention becomes part of history in earnest when it reaches ordinary people, and for the car that moment has a date, a price and a method.\n\nThe Henry Ford’s former curator of transportation writes that Ford Motor Company introduced its new Model T on October 1, 1908, as the culmination of Henry Ford’s quest to build an inexpensive, efficient and reliable vehicle that would put owning a car within reach of far more people. At $850 it was cheap for its day. It could reach 40 miles an hour on a smooth road, got about 20 miles per gallon, and sat high because America’s roads were so poor.\n\nThe method is on the record too. The museum’s article on Ford’s shops says the assembly line came in stages. Around April 1, 1913, flywheel magnetos went onto moving lines: a single worker had taken about 20 minutes per flywheel, and a line of workers turned one out every 13 minutes, then every five. Ford moved the line to engines, then transmissions, and in August 1913 to the complete chassis. By early 1914 three continuous lines finished a Model T every 93 minutes, against twelve and a half hours under the old method. By 1927 the 15 millionth Model T came off the line.\n\nSo here is the course’s finding, in order, each on its record. Nicolas-Joseph Cugnot built a self-propelled steam road vehicle in 1769. Karl Benz built a gasoline car and patented it in 1886, the same year Gottlieb Daimler built a four-wheeled one. Bertha Benz proved the car on the open road in 1888. The Duryea brothers built an American gas car in 1893 and the first American car company in 1896. Henry Ford put the car within reach of the multitude from 1908. And the Library of Congress now says plainly that our knowledge of the invention continues to evolve. That is how a careful community comes to understand its past: many witnesses, set in order, corrected in the open.\n\nThen the frame under all of it, the higher education every one of these engineers received whether they named its Teacher or not. "I wisdom dwell with prudence, and find out knowledge of witty inventions" (Proverbs 8:12). Isaiah says even the plowman’s skill is taught: "For his God doth instruct him to discretion, and doth teach him" (Isaiah 28:26). The inventors discovered; Yahweh designed. The iron, the fire and the laws of motion were His before any workshop: "Through faith we understand that the worlds were framed by the word of God, so that things which are seen were not made of things which do appear" (Hebrews 11:3), and "by him all things consist" (Colossians 1:17).\n\nAnd the Word tells us what to do with the finding: "And thou shalt teach them diligently unto thy children" (Deuteronomy 6:7).',
    voices: [
      { speaker: 'Bob Casey, former curator of transportation at The Henry Ford', year: 2015, where: 'His article on the Model T for The Henry Ford, published January 28, 2015, on the car and the day it went on sale.', source: SRC.fordT,
        words: 'When Ford Motor Company introduced its new Model T automobile on October 1, 1908, the car was the culmination of Henry Ford’s quest to develop an inexpensive, efficient and reliable vehicle that would put automobile ownership within the reach of far more people.',
        why: 'The moment the car reached the multitude, from the museum that keeps Ford’s papers and cars.' },
      { speaker: 'Matt Anderson, writing for The Henry Ford', year: 2021, where: 'His article on Ford Methods and the Ford Shops for The Henry Ford, published July 22, 2021, on the year the moving line arrived.', source: SRC.fordLine,
        words: 'In 1913, Ford Motor Company combined the standardization of interchangeable parts with the subdivision of labor and the fluid movement of work to workers to create the world’s most influential assembly line.',
        why: 'The method that made the car cheap, named part by part.' },
      { speaker: 'Matt Anderson, writing for The Henry Ford', year: 2021, where: 'The same article of July 22, 2021, on what the lines had become by the next year.', source: SRC.fordLine,
        words: 'By early 1914, the various separate production lines had fused into three continuous lines able to churn out a finished Model T every 93 minutes',
        why: 'The figure that measures the method: a car every 93 minutes.' },
      { speaker: 'The Library of Congress, Everyday Mysteries page', year: 2024, where: 'The page as revised on December 5, 2024, its present judgment on the whole question, read from the Wayback Machine’s dated copy.', source: SRC.locPage,
        words: 'However, our knowledge of the invention of the true automobile continues to evolve.',
        why: 'How a careful community holds its finding: settled where the records agree, open to more.' },
    ],
    timeline: [
      { year: 1769, event: 'Cugnot builds the first self-propelled road vehicle in the Library of Congress table.',
        record: 'The Library of Congress, Everyday Mysteries table.', source: { ...SRC.locPage, phrase: 'built the first self propelled road vehicle' } },
      { year: 1886, event: 'Karl Benz applies for patent 37435 on January 29; Daimler builds a four-wheeled motor car the same year.',
        record: 'Mercedes-Benz Group, company history; German History in Documents and Images.', source: { ...SRC.mb, phrase: 'the patent - number 37435 - may be regarded as the birth certificate of the automobile' } },
      { year: 1888, event: 'Bertha Benz proves the motor car on a long-distance journey.',
        record: 'The German Patent and Trade Mark Office, Automobiles: the beginnings.', source: { ...SRC.dpmaIndex, phrase: 'on august 5, 1888, a woman heralded the era of the automobile' } },
      { year: 1893, event: 'Frank Duryea road-tests an American gasoline car in Springfield, Massachusetts.',
        record: 'National Museum of American History, Smithsonian Institution, archived by the Wayback Machine.', source: { ...SRC.duryea, phrase: 'on september 21, 1893, frank duryea road-tested the vehicle' } },
      { year: 1896, event: 'The Duryea Motor Wagon Company is founded, the first American company that made and sold automobiles.',
        record: 'National Museum of American History, Smithsonian Institution, archived by the Wayback Machine.', source: { ...SRC.duryea, phrase: 'the first american company that manufactured and sold automobiles' } },
      { year: 1908, event: 'On October 1 Ford Motor Company introduces the Model T at $850.',
        record: 'Bob Casey, The Henry Ford, January 28, 2015.', source: { ...SRC.fordT, phrase: 'introduced its new model t automobile on october 1, 1908' } },
      { year: 1913, event: 'Around April 1 flywheel magnetos go onto moving lines at Highland Park, and in August the complete chassis follows.',
        record: 'Matt Anderson, The Henry Ford, July 22, 2021.', source: { ...SRC.fordLine, phrase: 'around april 1, 1913, flywheel magnetos were placed on moving lines' } },
      { year: 1914, event: 'By early in the year three continuous lines finish a Model T every 93 minutes.',
        record: 'Matt Anderson, The Henry Ford, July 22, 2021.', source: { ...SRC.fordLine, phrase: 'able to churn out a finished model t every 93 minutes' } },
      { year: 1927, event: 'On May 26 the 15 millionth Model T comes off the Highland Park assembly line.',
        record: 'Bob Casey, The Henry Ford, January 28, 2015.', source: { ...SRC.fordT, phrase: 'the 15 millionth model t came off the highland park assembly line' } },
      { year: 2015, event: 'The Henry Ford publishes its curator’s account of the Model T as a car for the great multitude.',
        record: 'Bob Casey, The Henry Ford, January 28, 2015.', source: { ...SRC.fordT, phrase: 'put automobile ownership within the reach of far more people' } },
      { year: 2021, event: 'The Henry Ford publishes its curator’s account of the moving assembly line in stages.',
        record: 'Matt Anderson, The Henry Ford, July 22, 2021.', source: { ...SRC.fordLine, phrase: 'the assembly line came to ford motor company in stages' } },
      { year: 2024, event: 'The Library of Congress revises its page to say knowledge of the invention continues to evolve.',
        record: 'The Library of Congress, Everyday Mysteries, updated December 5, 2024.', source: { ...SRC.locPage, phrase: 'our knowledge of the invention of the true automobile continues to evolve' } },
    ],
    workedCase: {
      claim: { words: 'a vehicle that would put automobile ownership within the reach of far more people', by: 'Bob Casey, former curator of transportation at The Henry Ford, January 28, 2015', source: SRC.fordT },
      event: { year: 1908, what: 'On October 1 the Model T goes on sale at $850, built to put a car within reach of ordinary buyers.' },
      closedDoors: {
        hidden: 'How the price could fall was settled on the shop floor, in who stood where and how fast the work moved to the worker, out of sight of every buyer.',
        light: 'Two observers of industry documented the Ford shops at the time, and The Henry Ford’s article puts the stages and the minutes on the public record.',
        verse: '"For there is nothing covered, that shall not be revealed; neither hid, that shall not be known" (Luke 12:2).',
        heart: '"For the LORD giveth wisdom: out of his mouth cometh knowledge and understanding" (Proverbs 2:6).',
      },
      risk: 'An invention credited to one genius hides the method and the many workers who made it affordable, and teaches children to wait for a genius instead of learning a method.',
      opportunity: 'The price, the minutes and the dates are all on the museum’s record, so the claim can be measured rather than admired.',
      constraint: 'The records fetched here give the price at launch, the minutes per car and the count by 1927; they do not give the wages or the conditions of the workers on the line, which this course did not fetch.',
      economics: [
        { figure: '$850', meaning: 'The price of the Model T when it was introduced in 1908, cheap for its day.', record: 'Bob Casey, The Henry Ford, January 28, 2015' },
        { figure: '93 minutes', meaning: 'The time to finish a Model T on the continuous lines by early 1914.', record: 'Matt Anderson, The Henry Ford, July 22, 2021' },
        { figure: '12½ hours', meaning: 'The time per car under the old stationary method, the figure the 93 minutes is measured against.', record: 'Matt Anderson, The Henry Ford, July 22, 2021' },
        { figure: '15 millionth', meaning: 'The Model T that came off the Highland Park line on May 26, 1927.', record: 'Bob Casey, The Henry Ford, January 28, 2015' },
      ],
      steps: [
        'Copy the claim and name what it measures: a car within reach of far more people, which needs a price and a production rate.',
        'Open the museum’s record for the price at launch, $850, and the date, October 1, 1908.',
        'Open the same museum’s account of the shops for the method in stages and the minutes per car, 93 against twelve and a half hours.',
        'State the claim at the strength those figures support, and name the workers’ wages and conditions as the record still to open.',
      ],
      settled: 'The Model T went on sale on October 1, 1908 at $850, and by early 1914 the moving lines finished one every 93 minutes, by the museum’s own records.',
      stillOpen: 'What the line cost the workers who stood at it, in wages and in conditions, is a record this course did not fetch and names as the next one to read.',
    },
    quiz: { questions: [
      { q: 'By early 1914, how long did Ford’s continuous lines take to finish a Model T?',
        options: ['93 minutes', 'Twelve and a half hours', 'Three days'],
        answer: 0, explain: 'Against twelve and a half hours under the old stationary method, by The Henry Ford’s account of the Ford shops.' },
      { q: 'Where does the Word say the knowledge of inventions comes from?',
        options: ['From the inventor alone', 'From wisdom, which comes from Yahweh: "I wisdom dwell with prudence, and find out knowledge of witty inventions" (Proverbs 8:12)', 'From luck'],
        answer: 1, explain: 'Even the farmer is taught: "For his God doth instruct him to discretion, and doth teach him" (Isaiah 28:26).' },
    ] },
    facilitator: {
      howToRun: 'Prayer + the anchor (5): pray; read Proverbs 8:12 and Hebrews 11:3 aloud. The competency in one sentence (10): finish the case and write it in order. Teach it (15): the Model T’s date and price, then the line in stages, then the whole finding in order. Work it on the case (20): each person writes the five-sentence answer with a record under every sentence. Discussion (10). Send-off (5): read the five sentences to a child this week.',
      talkingPoints: [
        'An invention changes ordinary life when it reaches ordinary people; for the car that has a date, a price and a method.',
        'A figure like 93 minutes measures method and the many workers in it, not one man’s genius alone.',
        'The finding in order: Cugnot, Benz and Daimler, Bertha Benz, the Duryeas, Ford, and a Library that says knowledge continues to evolve.',
        'Every inventor worked with what Yahweh made and laws He wrote; wisdom finds out witty inventions, and He teaches.',
      ],
      discussionPrompts: [
        'What changed more lives, the first car or the cheap one, and why?',
        'What does it mean that Yahweh teaches the farmer and the engineer?',
        'Which sentence of your five would you check first, and against which record?',
      ],
    },
  },
];

export function buildCarResearchSchedule(startISO = null) {
  return buildScheduleFor(CAR_RESEARCH_MODULES, startISO, CAR_RESEARCH_META.cadenceDays);
}

export function carResearchProgressSummary(progress = {}) {
  return progressSummaryFor(CAR_RESEARCH_MODULES, progress);
}

export function exportCarResearchCurriculumMarkdown(startISO = null) {
  return exportCurriculumMarkdownFor({
    meta: CAR_RESEARCH_META,
    modules: buildCarResearchSchedule(startISO),
    sessionFlow: CAR_RESEARCH_SESSION_FLOW,
  }, startISO);
}

/** The same voice, timeline and worked-case gates the first two history courses carry (DR-0580 / DR-0597 / DR-0601). */
export const carResearchVoiceFaults = historyVoiceFaults;
export const carResearchTimelineFaults = historyTimelineFaults;
export const carResearchWorkedCaseFaults = historyWorkedCaseFaults;
export { historyYearsNamed as carResearchYearsNamed, historyVoiceYears as carResearchVoiceYears };

/** Every distinct Scripture anchor the course names, in authored order (the crosslist's measured count). */
export function carResearchRefs(modules = CAR_RESEARCH_MODULES) {
  const out = [];
  for (const m of modules) for (const part of String((m.anchor && m.anchor.ref) || '').split(';')) { const r = part.trim(); if (r && !out.includes(r)) out.push(r); }
  return out;
}

/** The whole course on one line of years — every lesson's dated record, merged and sorted. */
export function carResearchTimeline(modules = CAR_RESEARCH_MODULES) {
  const out = [];
  modules.forEach((m, order) => {
    for (const t of (m && m.timeline) || []) out.push({ ...t, lessonId: m.id, lessonTitle: m.title, order });
  });
  return out.sort((a, b) => (a.year - b.year) || (a.order - b.order));
}

/** Every distinct record the course quotes or dates, with the lessons that use it (the witness probes each on every push). */
export function carResearchSources(modules = CAR_RESEARCH_MODULES) {
  const map = new Map();
  for (const m of modules) {
    for (const v of m.voices || []) { const k = v.source.url; if (!map.has(k)) map.set(k, { ...v.source, lessons: new Set() }); map.get(k).lessons.add(m.id); }
    for (const t of m.timeline || []) if (t.source) { const k = t.source.url; if (!map.has(k)) map.set(k, { title: t.source.title, url: t.source.url, lessons: new Set() }); map.get(k).lessons.add(m.id); }
  }
  return [...map.values()].map((s) => ({ ...s, lessons: [...s.lessons] }));
}

export const CAR_RESEARCH_INTEREST_TAG = '[Historical Research L1: the car]';
export const CAR_RESEARCH_HELPER_TAG = '[Historical Research L1: the car helper]';

export const CAR_RESEARCH_TUTOR_META = {
  key: 'car-research-who-invented-the-car',
  name: CAR_RESEARCH_META.title,
  title: CAR_RESEARCH_META.title,
  posture: 'Teach the craft Word-first: hear the whole question before answering it, go to the office that issued a document, establish every word at the mouth of two or three witnesses, render to all their dues, and write the finding in order for the children. State dated facts plainly with their records; the one open question here is which first deserves the word inventor, and it is a question of definition, stated narrowly. Never quote a page the runner did not read, and never give a figure without its record. Every invention began with what Yahweh made and taught.',
  blurb: 'Ask about any of the four competencies — defining before counting, going to the issuing record, giving their due to the people one name leaves out, and writing the finding in order — or bring a famous first of your own and work it the same way.',
};
