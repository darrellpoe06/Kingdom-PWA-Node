// =============================================================================
// succession-class — "Handed Forward: Stewarding for Problems We Never Faced"
// =============================================================================
// The PoeTech / family SUCCESSION course — for the heirs being raised to take
// over the businesses. Declared by Darrell 2026-07-06:
//
//   "We can't expect our heirs to learn how we did, or even exactly what we
//    learned. There are new issues that older people want young people to take
//    care of — and the PoeTech App will."
//
// That teaching is the SPINE of this course, and it inverts the usual "learn the
// family trade the way I learned it" model. Succession here is NOT cloning the
// founder's path; it is COMMISSIONING the heir for the new problems the founder
// is handing forward — problems the founder may never have faced. So the course
// teaches the heir to (1) know the God of their father, (2) READ the real books
// before they rule them, and (3) build what the previous generation could not.
//
// Pairs with the SUCCESSOR permission role (lib/relationships.js, DR-0111): a
// steward-in-training SEES the family's real books read-only and learns on the
// actual numbers, while finance.manage stays denied so a read never becomes an
// accidental write. The role is the safe seat; this course is what they do in it.
//
// SAME SHARED FRAMEWORK as the sibling Learn courses (church-classes.js helpers,
// learn-framework age bands + quiz, class-tutor). Age-adaptive: every module
// carries levels.child / levels.senior so a 12-year-old heir and a 25-year-old
// heir each get the right depth of the SAME truth.
//
// VERIFICATION (DR-0076 / SCRIPTURE-REFERENCE-STANDARD): every KJV fragment
// quoted in the lesson prose was checked VERBATIM against the repository's
// public-domain KJV (app/public/bible/kjv/*.json) — no verse from memory. A
// vitest (succession-class.test.js) re-pins the exact fragments so a future edit
// cannot drift the text. Nothing here fabricates content or numbers.
// =============================================================================

import {
  buildScheduleFor, progressSummaryFor, exportCurriculumMarkdownFor, resolveCohortGeneric,
} from './church-classes.js';

export const SUCCESSION_PROPOSED_COHORT_START = null;
export const SUCCESSION_CONFIRMED_COHORT = { startDate: null, confirmed: false };

export const SUCCESSION_META = {
  key: 'handed-forward',
  title: 'Handed Forward: Stewarding for Problems We Never Faced',
  audience: 'the heirs being raised to take over the family and Kingdom businesses — taught at every age, from a young steward-in-training to a grown successor',
  tagline: 'We hand you the mission, not our path. Know the God of your father, read the real books, and build what we could not.',
  format: 'Self-paced or 5 sessions · ~75 min each (paced to your age) · Word-first, real-books, built to be handed on again',
  cadenceDays: 7,
  weeks: 5,
  handsOnLabel: 'Hands-on with the real books (read-only)',
  blurb: 'A succession course for the next generation. The founder cannot hand down their exact path — the heir will face new issues the founder never met (Darrell 2026-07-06). So this course commissions rather than clones: know the God of your father, learn to READ the family’s actual books before you rule them (the read-only Successor seat, DR-0111), and take up the work the previous generation prepared but could not finish — David to Solomon, Moses to Joshua, Elijah to Elisha — then hand it forward again.',
  footer: '_Taught by Darrell Poe · the Poe family + The Church of the Living God · built on PoeTech. We hand forward the mission, not the map. The soul first, then the finances. Read before you rule; build what we could not; and commit it to faithful ones who will teach others also (2 Timothy 2:2)._',
};

export const SUCCESSION_SESSION_FLOW = [
  { minutes: 5, name: 'Prayer + the anchor' },
  { minutes: 10, name: 'Recap last week' },
  { minutes: 15, name: 'Teach the big idea' },
  { minutes: 25, name: 'Hands-on with the real books (read-only)' },
  { minutes: 15, name: 'Discussion' },
  { minutes: 5, name: 'Send-off + solo task' },
];
export const SUCCESSION_SESSION_MINUTES = SUCCESSION_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0); // 75

export const SUCCESSION_MODULES = [
  {
    id: 'succ1-mission-not-map',
    title: 'We hand you the mission, not the map',
    bigIdea: 'A founder cannot hand down their exact path — the heir will face problems the founder never met. So succession is not cloning how we learned; it is being commissioned for the new work we are handing forward. What transfers is the mission and the character, not the map.',
    inApp: 'Look at how much the family businesses have already changed in a few years. The heir will steward tools and problems that did not exist when the founder started — proof that the map cannot simply be copied, only the mission handed on.',
    anchor: { ref: 'Ecclesiastes 2:18-19; Proverbs 4:7; 3 John 1:2', theme: 'What I labored for I leave to the one who comes after me, and who knows whether he will be wise or a fool — therefore EQUIP him; wisdom and understanding are the principal thing; and the soul prospers first. The founder cannot control the outcome, so the founder invests understanding and character, not a script.' },
    levels: {
      child: 'When grown-ups build something — a business, a church, a family — they cannot give the kids a map that says "do exactly what I did," because the world keeps changing and you will meet NEW problems they never had. So instead of a map, they give you the MISSION (why we do it) and help your heart and your wisdom grow strong. The Bible even says a wise person knows the one who comes after them might be wise OR foolish — so the smart thing is to help you get wise NOW. Your job: name one thing that is different today than when your parents were young.',
      senior: 'Solomon, at the height of his wealth, wrote something brutally honest about succession: "I hated all my labour which I had taken under the sun: because I should leave it unto the man that shall be after me. And who knoweth whether he shall be a wise man or a fool? yet shall he have rule over all my labour" (Ecclesiastes 2:18-19). The founder does not get to control the outcome — the heir may be wise or a fool, and will rule over everything the founder built regardless. That is not a reason to despair; it is the exact reason to EQUIP. If you cannot hand down control, hand down understanding: "Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding" (Proverbs 4:7). And keep the order the whole house runs on — "even as thy soul prospereth" (3 John 1:2), the soul first. The map is worthless to a new era; the mission and the character are everything. Darrell put it plainly: we cannot expect our heirs to learn how we did, or even exactly what we learned — there are new issues we want the young to take care of. So we commission, we do not clone.',
    },
    quiz: {
      questions: [
        { q: 'Why can’t a founder just hand the heir their exact path?', options: ['Because the heir is not smart enough', 'Because the heir will face NEW problems the founder never met — the map does not fit a new era', 'Because paths are secret'], answer: 1, explain: 'Darrell 2026-07-06: new issues the founder never faced. Hand the mission, not the map.' },
        { q: 'Given the founder can’t control the outcome (Ecclesiastes 2:19), what is the wise response?', options: ['Give up and hoard', 'EQUIP the heir — invest understanding and character now (Proverbs 4:7)', 'Refuse to hand anything on'], answer: 1, explain: 'Cannot hand down control, so hand down understanding. Commission, not clone.' },
      ],
    },
    lesson: 'Every succession plan wants to be a map: "here is exactly how I did it, do the same." This course refuses that, because the Word and reality both refuse it. Solomon, richer than anyone, wrote the most honest sentence ever written about handing on an estate: "Yea, I hated all my labour which I had taken under the sun: because I should leave it unto the man that shall be after me. And who knoweth whether he shall be a wise man or a fool? yet shall he have rule over all my labour wherein I have laboured" (Ecclesiastes 2:18-19). Read it slowly. The builder does not get to decide whether the heir is wise or foolish — and the heir will rule over the whole thing either way. You cannot hand down control. So what CAN you hand down? Understanding and character: "Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding" (Proverbs 4:7) — held in the order the whole family runs on, the soul first, "even as thy soul prospereth" (3 John 1:2). This is exactly the charge Darrell gave when he asked for this course: we cannot expect our heirs to learn how we did, or even exactly what we learned, because there are new issues the older generation wants the younger to take care of. The founder fought battles the heir will never fight; the heir will face problems the founder never imagined. So we do not clone the founder — we COMMISSION the heir. The rest of this course is that commission: know the God of your father, learn to read the real books, and build what we could not.',
    facilitator: {
      talkingPoints: [
        'Succession is not "copy my path" — the heir meets NEW problems (Darrell 2026-07-06).',
        'Ecclesiastes 2:18-19: the founder cannot control whether the heir is wise or foolish.',
        'Therefore EQUIP — hand down understanding and character, not a script (Proverbs 4:7).',
        'The order holds: the soul first (3 John 1:2). Commission, do not clone.',
      ],
      howToRun: 'Prayer + anchor (5): pray; read Ecclesiastes 2:18-19. | Recap (10): first session — each heir names why they are here. | Teach (15): mission-not-map; the founder cannot hand down control, only understanding. | Hands-on (25): list how the businesses/tools have changed in a few years. | Discussion (15): what new problem will YOUR generation have to solve? | Send-off (5): solo task — write the mission in one sentence, in your own words.',
      discussionPrompts: [
        'What is the difference between handing down a map and handing down a mission?',
        'Why does Ecclesiastes 2:19 push a founder toward equipping rather than controlling?',
        'What is a problem your generation will face that the last one did not?',
      ],
    },
  },
  {
    id: 'succ2-read-before-you-rule',
    title: 'Read before you rule — learn on the real books',
    bigIdea: 'Before an heir manages money, they learn to READ it — on the family’s actual books, not a toy example. The Successor seat is read-only on purpose: you see the real numbers and learn on them, but you cannot change them yet. Read, don’t wreck. Know the God of your father first; then take heed, be strong, and do the work.',
    inApp: 'Open the family books in the read-only Successor view: the accounts, the forecast, the tithe, the buffer. Trace one real number to where it came from. You are reading the truth of the house — a privilege, handled with care.',
    anchor: { ref: '1 Chronicles 28:9-10; Luke 16:10', theme: 'Know the God of your father and serve Him with a perfect heart; take heed, for you have been chosen to build — be strong and do it; and he that is faithful in that which is least is faithful also in much. Reading faithfully in the small, read-only seat is the proving ground for ruling in much.' },
    levels: {
      child: 'Before you get to DRIVE a car, you ride along and watch how it is really driven — the real road, not a pretend one. Money is the same. In the Successor seat you get to SEE the family’s real books — the real money coming in, the giving, the saving — but you cannot change anything yet. That is not a punishment; it is how you learn safely on the real thing. And the very first thing David told his son before handing him the biggest job of his life was: know God with your whole heart. Your job: with a grown-up, look at one real number in the family books and ask where it came from.',
      senior: 'When David handed the greatest project of the age to Solomon, he did not start with blueprints. He started with the heir’s heart: "And thou, Solomon my son, know thou the God of thy father, and serve him with a perfect heart and with a willing mind... if thou seek him, he will be found of thee" (1 Chronicles 28:9). THEN the charge to the work: "Take heed now; for the LORD hath chosen thee to build an house for the sanctuary: be strong, and do it" (28:10). Notice the order — God first, then the work. That is why the Successor seat is READ-ONLY by design (DR-0111): you are handed the truth of the house — the real accounts, the real forecast, the real giving and buffer — to READ and understand deeply, before you are ever handed the power to change it. Jesus set the same principle: "He that is faithful in that which is least is faithful also in much" (Luke 16:10). The read-only seat is the "least" — prove faithful reading the real books there, and ruling in much is the natural promotion. An heir who learns money on a toy example learns nothing real; an heir who reads the true books, carefully, for a season, is being formed to steward them.',
    },
    quiz: {
      questions: [
        { q: 'Why is the Successor seat read-only on the real books?', options: ['To keep secrets from the heir', 'So the heir learns on the TRUE numbers safely — reads and understands before gaining power to change them', 'Because the books are fake'], answer: 1, explain: 'DR-0111 — read, don’t wreck. See the real thing; earn write access by proving faithful.' },
        { q: 'What did David put FIRST when charging Solomon with the work?', options: ['The building plans', 'Know the God of your father and serve Him with a whole heart (1 Chronicles 28:9)', 'The budget'], answer: 1, explain: 'God first (28:9), then "be strong, and do it" (28:10). The heart before the work.' },
      ],
    },
    lesson: 'An heir does not begin by managing money; they begin by learning to READ it — and on the real books, not a pretend one, because a toy example teaches nothing true. This is exactly why the app gives a successor a READ-ONLY seat on the family finances (DR-0111): you can see the real accounts, the real forecast, the real tithe and buffer, and trace where every number came from — but you cannot change anything yet. Read, don’t wreck. Scripture models the same sequence in the biggest handoff in the Old Testament. When David transferred the temple project to Solomon, he led not with blueprints but with the heir’s heart: "And thou, Solomon my son, know thou the God of thy father, and serve him with a perfect heart and with a willing mind... if thou seek him, he will be found of thee" (1 Chronicles 28:9). Only then the charge to the work itself: "Take heed now; for the LORD hath chosen thee to build an house for the sanctuary: be strong, and do it" (28:10). God first, then the work. And Jesus gives the proving principle that makes a read-only season make sense: "He that is faithful in that which is least is faithful also in much" (Luke 16:10). Reading the real books faithfully, carefully, without the power to alter them, IS the "least" — and faithfulness there is what earns the "much." So take the read-only seat as an honor: you are being trusted with the truth of the house, and formed to steward it.',
    facilitator: {
      talkingPoints: [
        'Learn money by READING the real books first — a toy example teaches nothing true.',
        'The Successor seat is read-only by design (DR-0111): see the real numbers, cannot change them yet.',
        '1 Chronicles 28:9-10: David charged Solomon’s HEART first (know God), then the work.',
        'Luke 16:10: faithful in the least (reading) → trusted with much (ruling).',
      ],
      howToRun: 'Prayer + anchor (5): pray; read 1 Chronicles 28:9-10. | Recap (10): the heir restates mission-not-map. | Teach (15): read before you rule; God-first; faithful-in-least. | Hands-on (25): open the read-only books; trace real numbers to their source. | Discussion (15): what does the real ledger tell you that a lecture could not? | Send-off (5): solo task — write one honest question the real books raised for you.',
      discussionPrompts: [
        'Why learn on the REAL books instead of a made-up example?',
        'What is the difference between reading money faithfully and controlling it?',
        'Why did David charge Solomon’s heart before the work?',
      ],
    },
  },
  {
    id: 'succ3-new-builder-new-work',
    title: 'A new builder for a new work — David gathered, Solomon built',
    bigIdea: 'The previous generation prepares what the next generation builds — often a work the elders could not do themselves. David gathered the materials and could not build the temple; Solomon, young and facing a great work, built it in an era of peace David’s wars made possible. The heir is not repeating the founder’s task; they are taking up a NEW one the founder prepared for.',
    inApp: 'Name one thing the family is building NOW so the next generation can complete it later (a fund, a system, a property, a skill). You are seeing "David gathering" in real time — preparation for a work the heir will finish.',
    anchor: { ref: '1 Chronicles 29:1; 1 Chronicles 28:10; Proverbs 13:22', theme: 'Solomon my son, whom God alone has chosen, is young and tender, and the work is great; the LORD has chosen you to build — be strong and do it; a good man leaves an inheritance to his children’s children. The elder prepares and hands on; the young take up a great and NEW work.' },
    levels: {
      child: 'King David really wanted to build God’s temple — but God said no, that job belongs to your SON, Solomon. So David spent his life gathering the gold, the wood, and the stone, and then handed it all to Solomon to actually build. David gathered; Solomon built. That means grown-ups today are gathering things — money saved, tools made, lessons written — so that YOU can build something they could not. Your job: name one thing your family is saving or making now that you might finish when you are older.',
      senior: 'David wanted to build the temple, and God gave that work to his son instead — so David spent his final years GATHERING for a work he would never do with his own hands, then handed it to Solomon: "Solomon my son, whom alone God hath chosen, is yet young and tender, and the work is great: for the palace is not for man, but for the LORD God" (1 Chronicles 29:1). Sit with that pattern, because it is the heart of this module. The elder does not build the future; the elder PREPARES it and hands it to a successor who is "young and tender" facing a work that is "great." And crucially, Solomon’s task was NOT David’s task. David was a man of war; Solomon built in the peace David’s wars secured. Same mission (a house for God), entirely different work and era. That is Darrell’s point exactly — new issues, handed to the young. The charge stands over it: "the LORD hath chosen thee to build... be strong, and do it" (28:10). And the horizon is generational: "a good man leaveth an inheritance to his children’s children" (Proverbs 13:22). You inherit gathered materials AND a new work to do with them.',
    },
    quiz: {
      questions: [
        { q: 'Why did David gather materials but not build the temple himself?', options: ['He was lazy', 'God gave the BUILDING to his son Solomon — David’s job was to prepare, Solomon’s was to build', 'He ran out of money'], answer: 1, explain: '1 Chronicles 29:1 — the elder prepares; the young successor builds the great, new work.' },
        { q: 'How was Solomon’s work different from David’s?', options: ['It was identical', 'Same mission (a house for God) but a NEW work in a new era — David warred, Solomon built in peace', 'Solomon did nothing new'], answer: 1, explain: 'New issues handed to the young: the mission carries, the task changes.' },
      ],
    },
    lesson: 'Here is the pattern at the center of Scripture’s greatest succession, and it is the pattern Darrell named when he asked for this course. David, the warrior-king, wanted to build the temple — and God said that work belonged to his son. So David spent the end of his reign GATHERING: gold, silver, bronze, timber, cut stone, and skilled workers, all for a house he would never raise himself. Then he handed it forward: "Solomon my son, whom alone God hath chosen, is yet young and tender, and the work is great: for the palace is not for man, but for the LORD God" (1 Chronicles 29:1). Notice everything in that verse. The heir is chosen, young, and tender; the work is GREAT; and it is for God, not for man. And notice what is NOT there: any expectation that Solomon repeat David’s life. David’s work was war; Solomon’s work was building, in a peace that David’s wars had bought. Same mission — a dwelling for God — but a genuinely new work, in a new season, handed to a new generation. That is exactly what Darrell meant: there are new issues the elders prepare for and hand to the young to take care of. Over it stands the charge, "the LORD hath chosen thee to build an house for the sanctuary: be strong, and do it" (1 Chronicles 28:10), and the long horizon, "a good man leaveth an inheritance to his children’s children" (Proverbs 13:22). So look around at what the family is gathering now — the buffer fund, the systems, the property, the skills, this very app — and understand: that is David gathering. Your generation is Solomon, and your work will be great, and it will be new.',
    facilitator: {
      talkingPoints: [
        'The elder PREPARES the work; the successor BUILDS it — often a work the elder could not do.',
        '1 Chronicles 29:1: the heir is chosen, "young and tender," and the work is "great."',
        'Solomon’s task ≠ David’s task — same mission, new work, new era (new issues for the young).',
        'Proverbs 13:22: the horizon is the children’s children. We gather now for what they will build.',
      ],
      howToRun: 'Prayer + anchor (5): pray; read 1 Chronicles 29:1. | Recap (10): the heir restates read-before-you-rule. | Teach (15): David gathers, Solomon builds; new work, not the same work. | Hands-on (25): list what the family is "gathering" now for a future build. | Discussion (15): what great, new work might YOU be being prepared to build? | Send-off (5): solo task — name one thing you would build that we have only gathered for.',
      discussionPrompts: [
        'What does it mean that the elder gathers and the successor builds?',
        'Why was it important that Solomon’s work was NOT the same as David’s?',
        'What is being gathered in our family right now for you to finish?',
      ],
    },
  },
  {
    id: 'succ4-cross-what-we-could-not',
    title: 'Cross into what we could not — Moses to Joshua',
    bigIdea: 'Some works the previous generation genuinely cannot finish — they prepare the people to the edge and hand the crossing to the next leader. Moses brought Israel to the Jordan but could not enter; Joshua led them across. The heir’s courage is grounded not in copying the predecessor but in the same God going before them.',
    inApp: 'Identify an "edge" the family has reached but not crossed — a goal prepared for but not yet entered. That crossing may be the successor’s to lead, with the same God who went before the founder going before them.',
    anchor: { ref: 'Deuteronomy 31:7-8; Joshua 1:2,9', theme: 'Be strong and of a good courage, for you shall cause them to inherit it; God goes before you, He will not fail you. Moses my servant is dead, now arise and go over this Jordan; be strong and of a good courage, for the LORD your God is with you wherever you go. The predecessor reaches the edge; the successor leads the crossing, God going before.' },
    levels: {
      child: 'Moses led God’s people for forty years, all the way to the edge of the Promised Land — but he was not the one who got to lead them IN. That job went to Joshua. God told Joshua: Moses is gone, so now stand up and cross the river; be brave, because I am with you everywhere you go. Sometimes the grown-ups get you right up to the edge of something good, and then it is YOUR turn to go in. And you can be brave for the same reason Joshua was: God goes with you. Your job: name something brave you might have to do that the grown-ups got you ready for.',
      senior: 'Moses led Israel for forty years and brought them to the very border of the promise — and was told he would not cross. So the last thing he did was commission his successor in front of everyone: "Be strong and of a good courage: for thou must go with this people unto the land which the LORD hath sworn unto their fathers to give them; and thou shalt cause them to inherit it" (Deuteronomy 31:7), grounding it not in Joshua’s ability but in God: "the LORD, he it is that doth go before thee; he will be with thee, he will not fail thee, neither forsake thee: fear not, neither be dismayed" (31:8). Then God Himself repeats it to Joshua after Moses dies: "Moses my servant is dead; now therefore arise, go over this Jordan" (Joshua 1:2), and "Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest" (1:9). This is the hardest truth of succession and the most freeing: some works the previous generation CANNOT finish — not for lack of faith or effort, but because the crossing was assigned to the next leader. The heir does not draw courage from imitating Moses; the heir draws courage from the same God who went before Moses now going before them. What edge has your family been brought to that it has not yet crossed? That crossing may be yours.',
    },
    quiz: {
      questions: [
        { q: 'Why did Joshua, not Moses, lead Israel into the land?', options: ['Moses refused', 'The crossing was assigned to the successor — Moses prepared them to the edge; Joshua led them in', 'There was no leader'], answer: 1, explain: 'Deuteronomy 31 / Joshua 1 — some works the predecessor cannot finish; the heir crosses.' },
        { q: 'Where did Joshua’s courage come from?', options: ['From copying Moses exactly', 'From the same God going before him — "the LORD thy God is with thee whithersoever thou goest" (Joshua 1:9)', 'From having no fear naturally'], answer: 1, explain: 'Not imitation of the predecessor — the presence of God. That is transferable; a path is not.' },
      ],
    },
    lesson: 'Some works the previous generation simply cannot finish. Not because they lacked faith or effort — Moses was the most faithful leader Israel ever had — but because the crossing itself was assigned to the next leader. Moses led the people for forty years and brought them to the edge of the Jordan, and there God told him he would not go over. So Moses spent his final act commissioning Joshua publicly: "Be strong and of a good courage: for thou must go with this people unto the land which the LORD hath sworn unto their fathers to give them; and thou shalt cause them to inherit it" (Deuteronomy 31:7). And he anchored Joshua’s courage not in Joshua’s talent but in God: "the LORD, he it is that doth go before thee; he will be with thee, he will not fail thee, neither forsake thee: fear not, neither be dismayed" (31:8). After Moses died, God said it again, directly to Joshua: "Moses my servant is dead; now therefore arise, go over this Jordan" (Joshua 1:2) — "Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest" (1:9). Hear what this means for an heir. Your courage is not supposed to come from copying the founder’s path — that path ended at the river. It comes from the same God who went before the founder now going before you. The founder gets you to the edge; you lead the crossing. So look for the edges: the goals the family prepared for but has not yet entered. One of them may be the crossing that is yours to lead.',
    facilitator: {
      talkingPoints: [
        'Some works the predecessor cannot finish — the crossing is assigned to the successor.',
        'Deuteronomy 31:7-8: Moses publicly commissions Joshua and grounds his courage in God, not talent.',
        'Joshua 1:2,9: "Moses is dead; arise, go over" — courage from God’s presence, not imitation.',
        'The transferable thing is God going before, not the founder’s exact path.',
      ],
      howToRun: 'Prayer + anchor (5): pray; read Joshua 1:9. | Recap (10): the heir restates David-gathers-Solomon-builds. | Teach (15): Moses to the edge, Joshua across; courage from God’s presence. | Hands-on (25): name the family’s "edges" — prepared-for but not-yet-crossed goals. | Discussion (15): which crossing might be yours to lead? | Send-off (5): solo task — write the one crossing you feel God preparing you for.',
      discussionPrompts: [
        'Why could Moses not finish the work himself?',
        'Where should a successor’s courage come from, if not from copying the founder?',
        'What "edge" has our family reached that has not yet been crossed?',
      ],
    },
  },
  {
    id: 'succ5-double-portion-hand-it-forward',
    title: 'Ask for the double portion — then hand it forward again',
    bigIdea: 'A faithful successor does not merely receive; they ask to go FURTHER than the predecessor, and then commit what they received to the next faithful generation. Elisha asked Elijah for a double portion; Paul told Timothy to entrust what he received to faithful people who would teach others. Succession is a chain, not a finish line.',
    inApp: 'Write the "hand-forward plan": what you are learning now, and who you will one day teach it to. A successor who plans to hand it on again is stewarding the chain, not just their own turn.',
    anchor: { ref: '2 Kings 2:9; 2 Timothy 2:2; Proverbs 13:22', theme: 'Let a double portion of your spirit be upon me; the things you have heard, commit to faithful people who will teach others also; a good man leaves an inheritance to his children’s children. The heir asks to go further and hands it forward — a chain of stewardship across generations.' },
    levels: {
      child: 'When the prophet Elijah was about to leave, his student Elisha asked for something bold: a DOUBLE portion — to be able to do even MORE than his teacher. That was not being greedy; it was wanting to serve God even bigger. And later, Paul told young Timothy: whatever I taught you, teach it to other trustworthy people, so they can teach even more people. So you are not the end of the line — you receive, you grow bigger, and then you pass it on. Your job: name one thing you are learning that you could teach a younger kid someday.',
      senior: 'Two verses complete the picture of a faithful heir. First, ambition of the right kind. As Elijah was about to be taken, he offered Elisha anything; Elisha asked, "let a double portion of thy spirit be upon me" (2 Kings 2:9). A double portion was the inheritance of the firstborn — Elisha was asking to receive as a true heir and to do even MORE than his master (and he did: the record shows Elisha working twice the miracles). That is not arrogance; it is a successor refusing to let the mission shrink on their watch. Second, the chain must continue. Paul to Timothy: "the things that thou hast heard of me among many witnesses, the same commit thou to faithful men, who shall be able to teach others also" (2 Timothy 2:2). Four generations in one verse — Paul, Timothy, faithful people, others also. A successor who receives but never hands on breaks the chain. So the goal is never merely "take over"; it is "receive a double portion, and commit it to the faithful who will teach others also," with the generational horizon fixed: "a good man leaveth an inheritance to his children’s children" (Proverbs 13:22). This is why the whole platform is built to be handed on: you are one faithful link, asked to make the mission bigger and then pass it forward.',
    },
    quiz: {
      questions: [
        { q: 'What did Elisha ask of Elijah, and why is it not arrogance?', options: ['To rest — he was tired', 'A double portion — to receive as a true heir and do even MORE for God; refusing to let the mission shrink', 'To leave the ministry'], answer: 1, explain: '2 Kings 2:9 — the firstborn’s inheritance; ambition to advance the mission, not personal glory.' },
        { q: 'What does 2 Timothy 2:2 require a successor to do with what they receive?', options: ['Keep it to themselves', 'Commit it to faithful people who will teach OTHERS also — continue the chain', 'Write it down and stop'], answer: 1, explain: 'Four generations in one verse. The heir is a link, not the finish line.' },
      ],
    },
    lesson: 'A faithful successor is marked by two things at once: holy ambition, and a plan to hand it forward. The ambition first. When Elijah was about to be taken up and offered Elisha whatever he wanted, Elisha did not ask for comfort or safety — he asked, "let a double portion of thy spirit be upon me" (2 Kings 2:9). In Israel a double portion was the FIRSTBORN’S inheritance, so Elisha was asking to receive as a true heir and to do even more than his teacher — and Scripture records that he did, working roughly twice the miracles of Elijah. That is not arrogance; it is a successor refusing to let the mission shrink on their watch, wanting God’s work to grow, not merely survive. Then the handoff. Paul wrote to his own successor, Timothy: "the things that thou hast heard of me among many witnesses, the same commit thou to faithful men, who shall be able to teach others also" (2 Timothy 2:2). Count the generations in that one sentence — Paul, to Timothy, to faithful people, to others also. Four links. A successor who receives the inheritance but never commits it forward breaks the chain that made them possible. So the aim of this whole course is not "take over the business." It is this: receive a double portion, steward it faithfully, and commit it to faithful ones who will teach others also — because "a good man leaveth an inheritance to his children’s children" (Proverbs 13:22). That is why the family builds everything to be handed on, and why this app records and teaches, generation after generation. You are one faithful link. Ask to make the mission bigger, and plan, from the beginning, to hand it forward.',
    facilitator: {
      talkingPoints: [
        'Elisha’s "double portion" (2 Kings 2:9): a successor asks to go FURTHER, to grow the mission, not shrink it.',
        'That is the firstborn’s inheritance — holy ambition, not arrogance.',
        '2 Timothy 2:2: four generations in one verse — receive, then commit to faithful ones who teach others.',
        'Proverbs 13:22: the horizon is the children’s children. Succession is a chain, never a finish line.',
      ],
      howToRun: 'Prayer + anchor (5): pray; read 2 Timothy 2:2. | Recap (10): the heir restates the crossing (Moses to Joshua). | Teach (15): the double portion; the four-generation chain. | Hands-on (25): each heir drafts a "hand-forward plan" — what they’re learning and who they’ll teach. | Discussion (15): how do we keep the mission from shrinking on our watch? | Send-off (5): solo task — name the person you will one day teach this to.',
      discussionPrompts: [
        'What kind of ambition is a "double portion," and how is it different from arrogance?',
        'Why does 2 Timothy 2:2 make handing-on part of the job, not an afterthought?',
        'Who could you begin preparing to hand this forward to?',
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Shared-framework wrappers (identical contract to the sibling courses).
// ---------------------------------------------------------------------------
export const SUCCESSION_INTEREST_TAG = '[Handed Forward succession class interest]';
export const SUCCESSION_HELPER_TAG = '[Handed Forward succession class helper]';

export function resolveSuccessionCohort(localCohort = null) {
  return resolveCohortGeneric(localCohort, SUCCESSION_CONFIRMED_COHORT, SUCCESSION_PROPOSED_COHORT_START);
}

export function buildSuccessionSchedule(startISO) {
  return buildScheduleFor(SUCCESSION_MODULES, startISO, SUCCESSION_META.cadenceDays);
}

export function successionProgressSummary(progress = {}) {
  return progressSummaryFor(SUCCESSION_MODULES, progress);
}

export function exportSuccessionCurriculumMarkdown(startISO = null) {
  return exportCurriculumMarkdownFor(
    { meta: SUCCESSION_META, sessionFlow: SUCCESSION_SESSION_FLOW, modules: SUCCESSION_MODULES },
    startISO,
  );
}

// The tutor course-meta this class passes to askTutor.
export const SUCCESSION_TUTOR_META = {
  title: SUCCESSION_META.title,
  intro: 'You are a patient, encouraging tutor for a family + church SUCCESSION course called "Handed Forward: Stewarding for Problems We Never Faced."',
  posture: 'Guide ONE heir — child, teen, or grown successor — being raised to take over the family and Kingdom businesses. The spine of the course (Darrell 2026-07-06): we cannot expect heirs to learn how the founder did, or even exactly what the founder learned — there are NEW issues the older generation wants the young to take care of. So COMMISSION, do not clone: hand forward the mission and character, not a copied path. Teach the five movements — (1) mission-not-map (Ecclesiastes 2:18-19; Proverbs 4:7), (2) read the real books before you rule them, God-first (1 Chronicles 28:9-10; Luke 16:10; and the read-only Successor seat, DR-0111), (3) a new builder for a new work (David gathered, Solomon built — 1 Chronicles 29:1), (4) cross what the predecessor could not (Moses to Joshua — Deuteronomy 31:7-8; Joshua 1:2,9), and (5) ask a double portion and hand it forward again (2 Kings 2:9; 2 Timothy 2:2; Proverbs 13:22). Keep the order the whole house runs on: the soul first (3 John 1:2). Quote Scripture only as it appears in the lesson (verbatim KJV); never invent a verse. Match your pace and words to the heir’s age.',
};
