// =============================================================================
// banking-course — "Banking: What the Bank Does With Your Money"
// =============================================================================
// Darrell 2026-09-19, naming a gap in the catalog in four words: "Banking
// courses etc..." He said it in the same breath as the plain-words work
// (DR-0519), and the two belong together: a person looking for this course is
// thinking the word BANK, not the word stewardship.
//
// THE ARC, one argument in eight moves:
//   1. A deposit is not storage        (Genesis 41:35, 36, 48, 49, 56, 57)
//   2. Interest, and who it may never be charged to (Exodus 22:25, 26, 27; Ezekiel 18:8, 13, 17; Psalms 15:5)
//   3. When the credit system broke a nation (Nehemiah 5:1, 2, 3, 4, 5, 7, 9, 10, 11, 12, 13)
//   4. Signing for somebody else       (Proverbs 6:1, 2, 3, 4, 5; Proverbs 17:18)
//   5. Saving that is not hoarding     (Proverbs 21:20; Proverbs 30:24, 25)
//   6. Fees, and what the poor pay     (Amos 8:4, 5, 6; Proverbs 28:8; Jeremiah 22:13)
//   7. The count, the bag, and the men nobody had to audit (2 Kings 12:9, 10, 11, 12, 15)
//   8. Who actually holds it           (1 Timothy 6:17, 18, 19; Jeremiah 17:5, 7, 8)
//
// Find out what the institution does with the money -> get the one rule
// Scripture is unambiguous about -> watch a whole nation reach the end of that
// road -> learn the single signature that ruins households -> separate saving
// from hoarding, which is not the same fault -> see who actually pays the fees
// -> get a control system good enough that nobody had to be audited -> and end
// on the only question the statement never asks.
//
// WHY LESSON 3 IS IN THE MIDDLE. Lessons 1 and 2 are mechanism and rule, which
// a reader can hold at arm's length. Nehemiah 5 is what the rule exists to
// prevent, told by the people it happened to, in their own voices, in a chapter
// that opens with a CRY. The rest of the course is read differently afterwards.
//
// THE LINE THIS COURSE HOLDS (DR-0098 / DR-0100). Lesson 2 is the one most
// likely to be pressed into service as a blanket condemnation of all interest
// everywhere, so it states its own limit in the text: Scripture's usury
// passages name the POOR BROTHER and the pledge taken from a man who has
// nothing else to sleep under, and reading them as a general theory of finance
// reads past what they say. Lesson 6 states real, documented harm plainly
// rather than hedging it, and does not inflate it either.
//
// NO BOOK-AND-CHAPTER IS SHARED with the other courses of this department
// (Kingdom Economics, Secure the Legacy, Handed Forward) -- checked against
// their own reference lists rather than assumed, and pinned by the course test.
//
// BANDS, BENEFITS AND STORIES FROM THE FIRST COMMIT (DR-0509). Every lesson
// carries levels.teen and levels.senior, six `benefits`, and two `stories`.
//
// VERIFICATION (DR-0076 / SCRIPTURE-REFERENCE-STANDARD). Every quoted span is
// fetched VERBATIM from the repository's own KJV. Our prose says Yahweh;
// quotations keep "God" and "the LORD" exactly as the KJV has them (DR-0210).
//
// TEACHING, NOT FINANCIAL OR LEGAL ADVICE -- carried on the meta.
// =============================================================================

import {
  buildScheduleFor, progressSummaryFor, exportCurriculumMarkdownFor,
} from './church-classes.js';

export const BANKING_CARE_NOTE =
  'Teaching, not financial or legal advice. Account terms, interest rates, overdraft and fee schedules, deposit insurance limits, credit reporting rules and what a lender may lawfully do vary by institution and by state, and they change. Use this course for the principles and for what to ask; take your actual accounts and your actual numbers to someone qualified to look at them with you. Nothing here is a substitute for advice drawn for your situation. If money is tight right now, start with lesson six and lesson three — they are the two that deal with what is happening to you rather than with what you should have done.';

export const BANKING_META = {
  key: 'banking',
  title: 'Banking: What the Bank Does With Your Money',
  audience: 'anyone with an account, anyone about to open one, and the young people who will inherit both — taught at every age',
  tagline: 'Your deposit does not sit in a drawer with your name on it. Knowing where it actually goes changes every other question.',
  wordFirst: {
    ref: 'Genesis 41:48; Exodus 22:25',
    frame: 'The first bank in Scripture is a granary. Joseph gathers the surplus of seven good years and lays it up in the cities — "And he gathered up all the food of the seven years, which were in the land of Egypt, and laid up the food in the cities" (Genesis 41:48) — and when the famine comes the store is opened and sold. That is what an institution holding other people’s surplus is FOR, and it is also exactly where the danger lives, because whoever holds the store sets the terms when the famine comes. So Yahweh fixes one rule before any of it: "If thou lend money to any of my people that is poor by thee, thou shalt not be to him as an usurer, neither shalt thou lay upon him usury." (Exodus 22:25) Not a cap. A prohibition, aimed at one specific borrower.',
  },
  format: 'Self-paced · 8 lessons · read one a week or all in a morning · paced to your age',
  cadenceDays: 7,
  weeks: 8,
  handsOnLabel: 'Work it on your own accounts',
  unit: {
    noun: 'lesson',
    nounPlural: 'lessons',
    cap: 'Lesson',
    selfPaced: true,
    sessionLabel: 'How to run it (family table, class, or one-on-one)',
    countNoun: 'lesson',
  },
  blurb: 'What the bank does with your money, and what the Word says about every part of it. A granary in Egypt that is the first institution in Scripture to hold other people’s surplus — and the reason the man who holds the store sets the terms when the famine comes. One prohibition on interest, aimed at one specific borrower, and what it does not say. A whole nation that reached the end of the credit road, told in the voices of the people it happened to, in a chapter that opens with a cry. The single signature that has ruined more households than any purchase. The difference between saving and hoarding, which are not the same fault. Who actually pays the fees, stated plainly. A building fund with controls so good that nobody had to be audited. And the one question your statement never asks you. Free, in full, every lesson at two reading levels.',
  care: BANKING_CARE_NOTE,
  footer: '_Taught by Darrell Poe · the Poe family + The Church of the Living God · built on PoeTech. Know what happens to the deposit, know the one rule and its limit, see where the road ends, refuse the signature, save without hoarding, find out who pays the fee, build the control that makes an audit unnecessary — and answer the question the statement never asks. Teaching, not financial or legal advice._',
};

export const BANKING_SESSION_FLOW = [
  { minutes: 5, name: 'Prayer + the anchor' },
  { minutes: 10, name: 'The principle in one sentence' },
  { minutes: 15, name: 'Teach it — what the Word actually says' },
  { minutes: 20, name: 'Work it on your own accounts' },
  { minutes: 10, name: 'Discussion' },
  { minutes: 5, name: 'Send-off + solo task' },
];
export const BANKING_SESSION_MINUTES =
  BANKING_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0); // 65

export const BANKING_MODULES = [
  {
    id: 'bank1-a-deposit-is-not-storage',
    title: 'A deposit is not storage — what actually happens to your money',
    bigIdea: 'Most people picture a deposit as storage: your money, in a drawer, with your name on it, waiting. That picture is wrong, and almost every other confusion about banking grows out of it. Money you deposit is LENT OUT. The first institution in Scripture that holds other people’s surplus is a granary — "And he gathered up all the food of the seven years, which were in the land of Egypt, and laid up the food in the cities" (Genesis 41:48) — and it exists precisely so the surplus of good years can be worked during bad ones. That is genuinely useful, and it is also exactly where the danger lives, because whoever holds the store sets the terms when the famine comes.',
    inApp: 'Open your own account page and find two numbers: what the bank pays you on your balance, and what the bank charges on its own lending. Write both down, side by side. The gap between them is the business, and most people have never once looked at it. Then write one sentence about what would happen to you, specifically, if you could not reach that money for ten days.',
    anchor: { ref: 'Genesis 41:48', theme: 'Joseph gathers seven years of surplus and lays it up in the cities — "And he gathered up all the food of the seven years, which were in the land of Egypt, and laid up the food in the cities: the food of the field, which was round about every city, laid he up in the same." (Genesis 41:48) — and there was so much of it the counting stopped: "And Joseph gathered corn as the sand of the sea, very much, until he left numbering; for it was without number." (Genesis 41:49) Then the famine comes and the store is OPENED: "And Joseph opened all the storehouses, and sold unto the Egyptians" (Genesis 41:56). Held surplus, released under terms, by the one holding it.' },
    levels: {
      teen: 'Here is a question almost nobody asks, and the answer changes how you think about money. You put two hundred dollars in the bank. Where is it? Most people picture a drawer somewhere with their name on it and their two hundred dollars sitting in it. That is not what happens. The bank lends your money out. Right away. To somebody buying a car, somebody buying a house, somebody running a shop. Your two hundred dollars is not in a drawer. It is out working, and the bank is collecting interest on it. Think about what that means. The bank might pay you a very small amount for keeping your money there. Then it lends that same money out at a much higher rate. The difference between those two numbers is how a bank makes money. That is not a scandal and it is not a secret. It is just the business, and it is worth understanding before you have opinions about it. Now look at where this comes from, because the Word has the first version of it. Joseph is running Egypt and he knows seven good years are coming and then seven bad ones. So he collects the extra during the good years. "And he gathered up all the food of the seven years, which were in the land of Egypt, and laid up the food in the cities" (Genesis 41:48). And there was so much that they stopped counting it. "And Joseph gathered corn as the sand of the sea, very much, until he left numbering; for it was without number." (Genesis 41:49). Then the bad years come, and here is the part that matters. "And Joseph opened all the storehouses, and sold unto the Egyptians" (Genesis 41:56). Sold. Not gave. The store gets opened, and the person holding the store decides the terms. That is a granary, but it is doing the thing a bank does. Somebody holds a lot of other people’s surplus. That is genuinely useful — without it, everybody’s extra just sits in their own house doing nothing, and when a hard year comes there is no store anywhere. And it is also exactly where the risk is, because whoever holds the store has a huge amount of power when people are desperate. Both of those are true at once. Hold them both. So what do you actually do with this? Two things. First, know that your money is out working, which is why the bank wants you to keep it there and why there are rules about how much they have to keep on hand. Second, go look at the two numbers: what they pay you, and what they charge. You will probably be surprised by the gap. Being surprised is fine. Not knowing is the part worth fixing.',
      senior: 'This session exists to replace a mental picture, and the picture is doing more damage than any specific product. Ask the room first, before any Scripture: when you deposit money, where is it? Let people answer. A good number will describe storage — their money, held, waiting for them. Then say plainly that it is lent out, generally the same week, and that the institution earns the spread between what it pays a depositor and what it charges a borrower. Nothing in that is scandalous. What is costly is not knowing it, because a person who thinks of a deposit as storage cannot reason about anything downstream: not deposit insurance, not why there are reserve requirements, not why a bank cares whether everyone withdraws at once, not why the rate on a savings account and the rate on a card can differ by an order of magnitude at the same institution. Then take them to Genesis 41, because Scripture gives us the institution before it gives us the rules for it. Joseph, holding delegated authority in Egypt, gathers the surplus of seven abundant years: "And let them gather all the food of those good years that come, and lay up corn under the hand of Pharaoh, and let them keep food in the cities." (Genesis 41:35) Note the stated purpose, which is written into the text rather than inferred: "And that food shall be for store to the land against the seven years of famine, which shall be in the land of Egypt; that the land perish not through the famine." (Genesis 41:36) THAT THE LAND PERISH NOT. The store exists so the nation survives its bad years, and that is the legitimate reason for any institution that holds other people’s surplus. Then let the scale land: "And Joseph gathered corn as the sand of the sea, very much, until he left numbering; for it was without number." (Genesis 41:49) He stopped counting. And then the release, where the teaching turns: "And Joseph opened all the storehouses, and sold unto the Egyptians; and the famine waxed sore in the land of Egypt." (Genesis 41:56) SOLD. Not distributed. The store is opened under terms set by the one who holds it, and the pressure on the buyer is at its maximum precisely when the store is at its most necessary: "And all countries came into Egypt to Joseph for to buy corn; because that the famine was so sore in all lands." (Genesis 41:57) Hold both halves in front of the room without collapsing either. The store is a GOOD — without it the surplus sits idle in ten thousand houses and there is nothing anywhere when the year turns. And the store is a POWER — the holder sets terms in the hour of greatest need. Every rule in the rest of this course exists at that junction, and the next session is the rule Yahweh states first. Close with the instrument, which is small and concrete. Two numbers from their own statement: what the institution pays them, and what it charges. Most will never have looked at both at once. Then one sentence on what ten days without access would actually mean in their household — which is the question deposit insurance exists to answer and which almost nobody has asked themselves.',
    },
    benefits: [
      'You replace the picture that causes most banking confusion — a drawer with your name on it — with what actually happens, which is that your deposit is lent out and the institution earns the spread.',
      'You get the first holder-of-surplus in Scripture, with its purpose stated in the text rather than inferred: "And that food shall be for store to the land against the seven years of famine, which shall be in the land of Egypt; that the land perish not through the famine." (Genesis 41:36) That the land perish not.',
      'You can feel the scale of a real store, because the text gives it to you: "And Joseph gathered corn as the sand of the sea, very much, until he left numbering; for it was without number." (Genesis 41:49) The counting stopped.',
      'You catch the verb that carries the whole warning. "And Joseph opened all the storehouses, and sold unto the Egyptians" (Genesis 41:56). SOLD. The store is released under terms set by whoever holds it.',
      'You leave holding both halves at once — the store is a genuine good, and the store is a genuine power — which is the junction every rule in the rest of this course sits on.',
      'Carry it out this week: find the two numbers on your own account, what they pay you and what they charge, and write one sentence about what ten days without access would mean in your house.',
    ],
    stories: [
      {
        kind: 'parable', tone: 'light',
        title: 'The Drawer With His Name On It',
        body: 'Andre was nineteen and he had four hundred and twelve dollars in the bank, which was the most money he had ever had at once, and he checked the balance most days the way you check a plant you are not sure about. His uncle asked him one evening, mostly making conversation, where he thought that money was right now. Andre said at the bank, obviously. His uncle asked him what that meant — like, physically. And Andre realised he had been picturing a drawer. Not consciously. But if you had made him draw it, he would have drawn a drawer, in a back room, with a card on the front, and four hundred and twelve dollars in it. His uncle told him it was lent out. Probably that same week. Probably to somebody buying a used car about forty minutes from here. Andre said that could not be right, because it was his. His uncle said it was still his, that was what the account was, but it was not sitting anywhere. It was out working, and the bank was earning on it, and paying Andre almost nothing for the use of it. Andre went and looked that night. The savings rate was a number so small he had to read it twice. The rate on the card they had been trying to give him since he turned eighteen was a number thirty times larger. Same building. Same week. He did not close the account and he did not get angry. He just said out loud, to nobody, huh — and he has never once since then thought about a bank the way he did at dinner that evening.',
      },
      {
        kind: 'testimony', tone: 'serious',
        title: 'Ten Days',
        body: 'I found out what a deposit was the hard way, in a week I still do not enjoy describing. There was a hold placed on our account — a legitimate one, as it turned out, a fraud flag on a transaction that really did look strange — and it lasted ten days. Ten days. I had money. I could see the money. I could not reach the money. I want to be careful here, because the bank was not the villain in this story and I will not tell it as though they were. They did what they were supposed to do and it protected us, and when it cleared they apologised and they were right to have flagged it. What I learned was about me, not about them. I had built our entire household on a picture of that money as a drawer I could open. There was no second account. There was no cash anywhere in the house. There was nothing at my wife’s credit union, because why would there be. I had one door and I had never once asked what happens if the door is closed for a week and a half. My son was eleven and he remembers that week, which tells you what it was like. Now we keep a second thing. Not a lot. Enough for a month. And I have told four younger men the same sentence, which is the only piece of advice I give about money that I am completely sure of: go find out today what ten days without access would actually do to your house, and then do something small about the answer.',
      },
    ],
    lesson: 'This course opens by replacing a picture, because the picture is doing more damage than any particular product ever has. Ask yourself the question before reading further: when you deposit money, where is it? Most people, if made to draw it, would draw storage — their money, held somewhere, with their name on it, waiting. That is not what happens. A deposit is LENT OUT, generally within days, and the institution earns the difference between what it pays you for the use of your money and what it charges the person it lends your money to. There is nothing scandalous in that sentence. What is costly is not knowing it. A person who thinks of a deposit as storage cannot reason about anything downstream: not why deposit insurance exists, not why there are reserve requirements, not why a bank minds very much whether everybody withdraws in the same week, not how the rate on a savings account and the rate on a credit card at the SAME institution can differ by a factor of thirty. Every one of those becomes obvious the moment the picture is right. Now take it to the Word, because Scripture gives us the institution before it gives us the rules for it, and the institution is a granary. Joseph, holding delegated authority under Pharaoh, is told to gather the surplus of seven abundant years: "And let them gather all the food of those good years that come, and lay up corn under the hand of Pharaoh, and let them keep food in the cities." (Genesis 41:35) Notice that the purpose is written into the text rather than left to be inferred: "And that food shall be for store to the land against the seven years of famine, which shall be in the land of Egypt; that the land perish not through the famine." (Genesis 41:36) THAT THE LAND PERISH NOT. That is the legitimate reason for any institution that holds other people’s surplus, and it is worth stating as plainly as Scripture states it, because this course is going to be hard on abuses later and a reader should know from the first session that the thing itself is not the abuse. Then the execution, and the scale: "And he gathered up all the food of the seven years, which were in the land of Egypt, and laid up the food in the cities: the food of the field, which was round about every city, laid he up in the same." (Genesis 41:48) Note that the food of each field was stored in the city it came from — a detail nobody quotes, and a sound one. And then: "And Joseph gathered corn as the sand of the sea, very much, until he left numbering; for it was without number." (Genesis 41:49) He stopped counting. Hold that image, because a store at that scale is not a pantry. It is an instrument of national policy. And then the release, which is where this becomes a banking lesson rather than a history lesson: "And Joseph opened all the storehouses, and sold unto the Egyptians; and the famine waxed sore in the land of Egypt." (Genesis 41:56) SOLD. Not distributed, not returned, not handed back to the people it was gathered from. The store is opened under terms, and the terms are set by the one holding the store. And the pressure on the buyer is at its absolute maximum in exactly the hour the store is most necessary: "And all countries came into Egypt to Joseph for to buy corn; because that the famine was so sore in all lands." (Genesis 41:57) So hold both halves, without collapsing either one into the other. The store is a GENUINE GOOD. Without it, surplus sits idle in ten thousand separate houses, nothing is available to anybody when the year turns, and the land perishes — which the text says out loud. And the store is a GENUINE POWER, because whoever holds other people’s surplus sets the terms at the moment of greatest need, and no amount of good intention changes the structure of that. Every rule in the rest of this course lives at that junction. The next session is the rule Yahweh states first, and it is not a cap on the rate. So the work this week is small and it is concrete. Find two numbers on your own statement: what the institution pays you on your balance, and what it charges on its own lending. Put them side by side, which most people have never done, because the two numbers live on different pages and nobody is in a hurry to print them together. The gap between them is the business. Then write one sentence about what would happen in your household if you could not reach that money for ten days. Not whether it is likely. What it would DO. That single sentence is the question deposit insurance exists to answer, and it is the question almost nobody has actually put to themselves.',
    quiz: {
      questions: [
        { q: 'What actually happens to money you deposit?', options: ['It is held in a secure drawer under your name', 'It is lent out, and the institution earns the difference between what it pays you and what it charges the borrower', 'It is converted to gold and stored centrally', 'It is held until the end of the month and then invested'], answer: 1, explain: 'A deposit is not storage. The money is lent out, generally within days. Nothing in that is scandalous; what is costly is not knowing it, because the storage picture makes deposit insurance, reserve requirements and the rate gap all impossible to reason about.' },
        { q: 'What purpose does Genesis 41:36 state for the store?', options: ['That Pharaoh be enriched', 'That the land perish not through the famine', 'That Egypt become powerful over other nations', 'That the price of corn be controlled'], answer: 1, explain: '"And that food shall be for store to the land against the seven years of famine, which shall be in the land of Egypt; that the land perish not through the famine." (Genesis 41:36) The purpose is written into the text, and it is the legitimate reason for any institution holding other people’s surplus.' },
        { q: 'Which verb in Genesis 41:56 carries the warning half of this lesson?', options: ['Gathered', 'Sold', 'Numbered', 'Laid up'], answer: 1, explain: '"And Joseph opened all the storehouses, and sold unto the Egyptians" (Genesis 41:56). Sold, not distributed. The store is released under terms set by whoever holds it, and the buyer is under maximum pressure exactly when the store is most necessary.' },
      ],
    },
    facilitator: {
      talkingPoints: [
        'Ask where the money is BEFORE any Scripture. Let people describe storage in their own words, then say plainly that it is lent out.',
        'Name what the storage picture makes impossible to understand: deposit insurance, reserve requirements, and a thirtyfold rate gap inside one building.',
        'Genesis 41:36 states the purpose in the text — that the land perish not. Do not let the session become only a warning.',
        'Genesis 41:49 gives the scale: he left numbering. A store at that size is national policy, not a pantry.',
        'Genesis 41:56 gives the verb: SOLD. The holder sets the terms, and the buyer is most pressed exactly when the store is most needed.',
        'End on both halves held at once — genuine good, genuine power — because every rule in this course sits on that junction.',
      ],
      howToRun: 'Open with the question and collect three honest answers before correcting anything. Spend the middle in Genesis 41, reading 35 and 36 for the purpose, 48 and 49 for the scale, and 56 and 57 for the release. Ask the room to find the verb in 56 themselves. Then hold both halves up together and refuse to let the group settle on either one alone. Close with the two numbers and the ten-day sentence; collect nothing.',
      discussionPrompts: [
        'Before tonight, where did you actually picture your money being?',
        'What are the two numbers on your statement, and why have you never seen them on the same page?',
        'Genesis 41:36 says the store exists that the land perish not. What is lost if we only teach the warning?',
        'What would ten days without access actually do in your house?',
      ],
    },
  },
];
