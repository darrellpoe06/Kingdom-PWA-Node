// =============================================================================
// wealth-lessons-class — "Stewardship & Wealth: The Way Up"
// =============================================================================
// A Word-first, SELF-PACED lesson SERIES on biblical stewardship of money and
// assets, riding the SAME shared Learn engine as the other PoeTech / COLG courses
// (the generic helpers in church-classes.js, the self-driving tutor in
// class-tutor.js, and the multi-modal + AGE-ADAPTIVE + quiz + graduate→helper
// scaffolding in learn-framework.js). Like "Living Lessons," it sets `meta.unit`
// so the engine renders its rows as "Lessons," self-paced, with no cohort clock —
// and it AUTOMATICALLY joins the Learn hub and wires to the Presenter (speaker
// notes on the presenter, clean copy on the projector) via coursePresentable.
//
// WHY A SERIES, NOT ONE CARD (Darrell 2026-07-06): "multiple lesson sessions...
// sized for the brain of that age... not one lesson overload but a building on
// each other series... so there is a variety to choose from, all powerfully
// pulling down strongholds and imaginations that exalt themselves and not the
// Word." So the teaching is broken into SEVEN short lessons that build on one
// another — each brain-sized (the age bands in learn-framework.js chunk every
// lesson shorter for a child, fuller for an adult), each standing on the last:
//
//   1. Own What Produces      — the fruit tree: hold what bears fruit; don't
//                               cut it down to sell the wood (ownership vs
//                               consumption).
//   2. Store, Don't Devour    — the wise keep a store; the fool spends it up.
//   3. The Borrower Is Servant— the debt trap, and the freedom of owing no one.
//   4. Buy the Asset, Not the — Darrell's testimony: he and Christina chose a
//      Spectacle                rental house over a destination honeymoon.
//   5. Pay It Off             — freedom from the lender; the paid-off asset now
//                               serves YOU (the widow's oil: pay the debt, then
//                               live off the rest).
//   6. The Refinance          — the KEYSTONE. Pull cash from what you OWN as a
//                               LOAN (not a sale, not taxable income) at ~80% of
//                               the appraised value; the rent services the loan.
//                               You keep the tree AND eat today.
//   7. An Inheritance to Your — the wealth outlives you: a good man leaves an
//      Children's Children       inheritance to his children's children.
//   8. Give Yahweh the Glory   — the capstone over all of it: He gives the power
//      (He Will Not Share It)     to get wealth, and His glory He will not give to
//                                 another (Deuteronomy 8:17-18; Isaiah 42:8).
//
// VERIFICATION / NO-FABRICATION (DR-0076, and the Source-of-Answers rule):
//   • Every quoted verse is KJV, sourced VERBATIM from the in-repo public-domain
//     KJV (app/public/bible/kjv/*.json) — never typed from memory. Anchors cite a
//     reference + a theme gloss (not a reproduced verse), per the
//     SCRIPTURE-REFERENCE-STANDARD.
//   • DR-0100 (speak established fact plainly): the tax point is stated as the
//     plain fact it is — loan proceeds are borrowed money, not income, so they
//     are not taxed as income — while every lesson carries the bright line that
//     this is TEACHING, not personalized financial, tax, or legal advice; run
//     your own numbers and sit with a trusted advisor.
//   • WELL-BEING-POSITIVE (binding): money is a tool and a stewardship, never a
//     master (1 Timothy 6:10; Matthew 6:24). The series FREES a family from the
//     debt-trap and from consuming its seed corn; it never preaches greed, and it
//     never shames the poor. "The blessing of the LORD, it maketh rich, and he
//     addeth no sorrow with it" (Proverbs 10:22).
// =============================================================================

import {
  progressSummaryFor, exportCurriculumMarkdownFor, resolveCohortGeneric,
} from './church-classes.js';

// Self-paced: no cohort, no weekly schedule. We keep these exports so the host
// wiring mirrors the other courses exactly, but the start is null (rows carry no
// painted dates) and the UI reads "Self-paced" instead of "Cohort 1."
export const WEALTH_LESSONS_PROPOSED_COHORT_START = null;
export const WEALTH_LESSONS_CONFIRMED_COHORT = { startDate: null, confirmed: false };

export const WEALTH_LESSONS_META = {
  key: 'wealth-lessons',
  title: 'Stewardship & Wealth: The Way Up',
  audience: 'the whole family and the whole Body — every age',
  tagline: 'Money is a tool and a trust. Own the tree; don’t burn it for firewood.',
  format: 'Self-paced · read it alone, as a family, or in a group · paced to your age',
  cadenceDays: 7,
  // 8 short lessons that build on each other (7 stewardship steps + the glory
  // capstone); grows as Darrell teaches more.
  weeks: 8,
  handsOnLabel: 'Take it with you',
  unit: {
    noun: 'lesson',
    nounPlural: 'lessons',
    cap: 'Lesson',
    selfPaced: true,
    sessionLabel: 'How to lead it (family or small group)',
    countNoun: 'lesson',
  },
  footer: '_Taught by Darrell Poe · The Church of the Living God + the Poe family · built on PoeTech. Word-first and non-denominational — Scripture is senior to any tradition. Grace-centered, for every age. This is TEACHING, not personalized financial, tax, or legal advice — run your own numbers and sit with a trusted advisor before you act._',
};

// A gentle reading rhythm — not a 75-minute cohort clock. Used by the facilitator
// guide and the printout so a family or a small group has a shape to follow.
export const WEALTH_LESSONS_SESSION_FLOW = [
  { minutes: 3, name: 'Open in prayer + read the Scripture' },
  { minutes: 8, name: 'The big idea, in your own words' },
  { minutes: 10, name: 'Go deeper — the Word on money' },
  { minutes: 8, name: 'Reflect together' },
  { minutes: 3, name: 'Take it with you' },
];
export const WEALTH_LESSONS_SESSION_MINUTES = WEALTH_LESSONS_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0);

export const WEALTH_LESSONS_MODULES = [
  // ---------------------------------------------------------------------------
  // LESSON 1 — Own What Produces (the fruit tree)
  {
    id: 'sw1-own-what-produces',
    title: 'Own What Produces',
    bigIdea: 'Yahweh’s very first picture of provision is a tree that makes fruit — and its seed is inside the fruit, so it keeps making more. The wise learn to OWN things that produce: a skill, a tool, a piece of land, a house someone will pay to live in. The foolish spend everything on things that only get used up. You do not get rich by having more to burn; you get on The Way Up by owning what bears fruit — and then keeping the tree instead of cutting it down for one night’s firewood.',
    inApp: 'Name one thing you already own that PRODUCES — a skill, a tool, a habit, a small asset — and one way you could grow it this month. If you can’t name one yet, name the first producing thing you’ll work toward. Say it out loud: "I am learning to own what bears fruit, not just what gets used up."',
    anchor: {
      ref: 'Genesis 1:11; Proverbs 27:18',
      theme: 'Yahweh’s first design for provision is a fruit tree whose seed is in itself — it keeps producing. Whoever keeps the tree eats its fruit. Own and tend what bears fruit.',
    },
    benefits: [
      'A clear first move on The Way Up: build or buy one thing that PRODUCES, instead of only things that get consumed.',
      'Freedom from the treadmill of spending everything you earn — a producing asset works while you rest.',
      'Dignity in what you already have — a skill or a tool in your hand is a real, God-given seed.',
      'A patient mindset: fruit takes a season; you learn to tend and wait instead of chasing quick want.',
      'A family that thinks in trees, not firewood — the start of wealth that lasts past this week.',
    ],
    levels: {
      child: 'God’s very first picture of food and money was a TREE. When He made the world He said, "Let the earth bring forth... the fruit tree yielding fruit... whose seed is in itself" (Genesis 1:11). That means the tree makes apples, and inside each apple are seeds for MORE trees! So a tree keeps giving and giving. Now imagine you are cold one night, and you chop down your apple tree to make a fire. You would be warm for one night — but then no more apples, ever. Silly, right? Wise people take care of the tree and eat the fruit every year. The Bible says, "Whoso keepeth the fig tree shall eat the fruit thereof" (Proverbs 27:18). So learn to KEEP good things that make more — a skill you practice, a little garden, money you save — instead of using everything up all at once.',
      teen: 'Here is the very first money-picture in the Bible, and most people miss it. When God made the earth He didn’t make a pile of food to eat once — He made a fruit tree "whose seed is in itself" (Genesis 1:11). A tree that produces, and carries the seed of the NEXT tree inside its own fruit. That is the whole idea of an asset: something you own that keeps producing. A skill is an asset. A tool is an asset. A house someone pays rent to live in is an asset. The opposite is stuff that only gets used up — the new shoes, the fast food, the thing that’s cool for a week. Both are fine to have, but only one builds you a future. And here’s the trap to avoid: don’t cut down your fruit tree to sell the wood. Don’t cash out the thing that produces just to have a good time once. "Whoso keepeth the fig tree shall eat the fruit thereof" (Proverbs 27:18). Learn young to OWN what produces and keep it, and you’ll eat for years while other people are still spending everything they make.',
      senior: 'For the seasoned steward this lesson is a return to the first principle, hidden in the creation account itself. Before there was money, Yahweh’s design for provision was generative: "Let the earth bring forth... the fruit tree yielding fruit after his kind, whose seed is in itself" (Genesis 1:11). Provision that carries its own future — the seed inside the fruit. That is the biblical seed of what we now call a capital asset: a thing owned that keeps producing, and reproduces its own kind. Scripture consistently honors the one who tends and keeps such things — "Whoso keepeth the fig tree shall eat the fruit thereof" (Proverbs 27:18); "He that tilleth his land shall be satisfied with bread" (Proverbs 12:11) — and just as consistently it distinguishes producing from consuming. The gift of God, Ecclesiastes says, is not merely to HAVE riches but to be given "power to eat thereof, and to take his portion, and to rejoice in his labour" (Ecclesiastes 5:19): to enjoy the FRUIT without destroying the tree. A lifetime teaches the difference painfully — how often a family, under pressure, cuts down the producing thing (sells the land, cashes out the tool, spends the principal) for one season’s relief, and never eats from it again. The wiser path, and the one this whole series builds on, is to acquire and keep what bears fruit, live on the yield, and pass the tree on still standing. Own what produces; tend it; eat the fruit; keep the tree.',
    },
    quiz: {
      questions: [
        {
          q: 'What is Yahweh’s very first picture of provision in Genesis 1:11?',
          options: [
            'A pile of food to eat once',
            'A fruit tree "whose seed is in itself" — it keeps producing and carries its own future',
            'A bag of gold coins',
          ],
          answer: 1,
          explain: 'God’s first design was generative — a tree that produces fruit and carries the seed of the next tree inside it. That is the seed of every producing asset.',
        },
        {
          q: 'What is the difference between an asset and something merely consumed?',
          options: [
            'There is no difference',
            'An asset keeps PRODUCING (a skill, a tool, a rental house); consumables only get used up',
            'Assets are only for rich people',
          ],
          answer: 1,
          explain: 'A producing thing works while you rest; a consumable is gone once used. Both are fine to have, but only one builds a future.',
        },
        {
          q: 'What is the "don’t cut down the fruit tree" warning about?',
          options: [
            'Actual gardening only',
            'Don’t destroy or cash out the thing that PRODUCES just for one season’s relief or fun',
            'Never sell anything, ever',
          ],
          answer: 1,
          explain: '"Whoso keepeth the fig tree shall eat the fruit thereof" (Proverbs 27:18). Keep the producing asset and live on its fruit, rather than burning the tree for one night’s warmth.',
        },
      ],
    },
    lesson: 'Long before the Bible says a word about money, it shows you a picture of how provision is supposed to work — and almost everyone reads right past it. On the third day, "God said, Let the earth bring forth grass, the herb yielding seed, and the fruit tree yielding fruit after his kind, whose seed is in itself, upon the earth: and it was so" (Genesis 1:11). Look closely at that phrase: "whose seed is in itself." Yahweh did not create a one-time meal; He created a fruit tree that produces fruit AND hides the seed of the next tree inside the fruit it makes. Provision that carries its own future. That is the very first pattern of wealth in Scripture, and it is the foundation of this whole series: learn to OWN and tend things that PRODUCE, and live on the fruit. We would call it a producing asset today — a skill you can charge for, a tool that does work, a piece of land, a house someone pays rent to live in. Now hold that picture next to the way most people actually live, and you can see the trap immediately. Imagine a cold night, and you chop down your apple tree to feed the fire. You are warm tonight — and you have destroyed every future harvest for one evening’s comfort. That is exactly what a family does when it cashes out the producing thing to fund a moment: sells the land for a good time, spends the principal instead of the interest, burns the tree for firewood. Scripture keeps steering us the other way: "Whoso keepeth the fig tree shall eat the fruit thereof" (Proverbs 27:18) — the one who KEEPS the tree is the one who eats — and "He that tilleth his land shall be satisfied with bread" (Proverbs 12:11). And notice how Ecclesiastes frames the good gift: it is not merely to have riches, but to be given "power to eat thereof, and to take his portion, and to rejoice in his labour; this is the gift of God" (Ecclesiastes 5:19). You are meant to enjoy the FRUIT — really enjoy it — without destroying the tree. So the first step on The Way Up is not to earn more so you have more to burn. It is to acquire, even something small, that produces; to tend it patiently through its season; to eat the fruit; and to keep the tree standing so it feeds you again next year. Everything else in this series — storing, staying out of the debt-trap, buying the asset instead of the spectacle, paying it off, and one day pulling cash from it without selling it — is built on this one first move: own what produces.',
    facilitator: {
      talkingPoints: [
        'The first money-picture in the Bible is generative: a fruit tree "whose seed is in itself" (Genesis 1:11) — provision that keeps producing and carries its own future. That is a producing asset.',
        'Asset vs consumable: an asset (a skill, a tool, land, a rental house) keeps producing; a consumable only gets used up. Both are fine; only one builds a future.',
        'The core warning: don’t cut down the fruit tree for firewood — don’t cash out the producing thing for one season’s comfort. "Whoso keepeth the fig tree shall eat the fruit thereof" (Proverbs 27:18).',
        'Enjoy the FRUIT, keep the TREE: Ecclesiastes 5:19 — the gift is "power to eat thereof, and to take his portion, and to rejoice" without destroying the source.',
        'This lesson is the foundation of the whole series — storing, avoiding debt, buying the asset, paying it off, and the refinance all build on "own what produces."',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Genesis 1:11 and Proverbs 27:18 aloud — ask, "what does it mean that the seed is inside the fruit?" | The big idea, in your own words (8): draw the fruit tree; contrast keeping the tree (eat every year) with burning it for firewood (warm one night, then nothing). | Go deeper — the Word on money (10): name real producing assets in the room (a trade skill, a tool, savings, a rental); land Proverbs 12:11 and Ecclesiastes 5:19 — enjoy the fruit, keep the tree. | Reflect together (8): use the prompts; be gentle — some are just starting and own no "tree" yet, and that’s a fine place to begin. | Take it with you (3): each person names one producing thing they own (or will build toward) and one way to grow it this month.',
      discussionPrompts: [
        'What is one thing you own right now that actually PRODUCES — a skill, a tool, a habit, a small asset?',
        'Where have you been tempted to "burn the tree for firewood" — to cash out something that produces, for one moment’s relief?',
        'What is the very first producing thing you could build or buy this year?',
        'How does it change your spending to ask, "is this a tree, or is this firewood?"',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 2 — Store, Don't Devour
  {
    id: 'sw2-store-dont-devour',
    title: 'Store, Don’t Devour',
    bigIdea: 'The difference between the wise and the foolish, Proverbs says, is not how much they make — it is what they do with it. The wise keep a store; the fool "spendeth it up." A buffer of saved provision is not fear or hoarding; it is what lets you meet a hard season without cutting down your tree or running to the lender. Even the ant, with no boss over her, "provideth her meat in the summer." Store a portion before you spend the rest, and slow, gathered increase beats fast money every time.',
    inApp: 'Decide your first "store" number — even a small one — and where it will sit, untouched, for emergencies. Move the first amount into it today if you can. Say it out loud: "I store a portion before I spend the rest."',
    anchor: {
      ref: 'Proverbs 21:20; Proverbs 6:6-8',
      theme: 'In the house of the wise there is a store; the fool spends it all up. Even the ant gathers in summer for the season ahead. Keep a buffer before you spend the rest.',
    },
    benefits: [
      'A buffer that meets the hard season WITHOUT cutting down your tree or running to the lender.',
      'Freedom from living paycheck to paycheck — a store turns a crisis into an inconvenience.',
      'Peace instead of panic when the car breaks or the job shifts, because provision is already set aside.',
      'The habit that makes every later step possible — you cannot buy an asset or pay one off without first learning to keep a store.',
      'Slow, gathered increase you can trust: "he that gathereth by labour shall increase" (Proverbs 13:11).',
    ],
    levels: {
      child: 'God gave us a tiny teacher for saving: the ANT. The Bible says, "Go to the ant, thou sluggard; consider her ways, and be wise" (Proverbs 6:6). The ant has no boss telling her what to do, but all summer she gathers food and stores it up, so when winter comes she has plenty (Proverbs 6:7-8). She saves a little at a time! The Bible also says wise people keep "treasure to be desired and oil in the dwelling of the wise; but a foolish man spendeth it up" (Proverbs 21:20). That means the wise keep some, but the foolish spend ALL of it right away and have nothing left. So when you get money — a gift, an allowance, some birthday cash — don’t spend every bit. Keep some in a special safe spot. A little saved, again and again, becomes a lot. Be like the ant!',
      teen: 'Proverbs says something that will save you a hundred headaches: the gap between the wise and the foolish is not how much they MAKE — it’s what they do with it. "There is treasure to be desired and oil in the dwelling of the wise; but a foolish man spendeth it up" (Proverbs 21:20). Same money in; totally different result, because one keeps a store and the other blows through it. That store — what people call an emergency fund — is the single thing that keeps a hard week from becoming a disaster. Car breaks? You have it covered instead of borrowing at 30%. God’s example is almost funny: "Go to the ant, thou sluggard... which having no guide, overseer, or ruler, provideth her meat in the summer, and gathereth her food in the harvest" (Proverbs 6:6-8). No boss, no reminders — she just stores a little all summer so winter doesn’t wreck her. Do the same: every time money comes in, keep a slice FIRST, before you spend the rest. And don’t chase get-rich-quick — "wealth gotten by vanity shall be diminished: but he that gathereth by labour shall increase" (Proverbs 13:11). Slow and gathered beats fast and gone.',
      senior: 'The seasoned steward has watched this proverb prove itself across decades: "There is treasure to be desired and oil in the dwelling of the wise; but a foolish man spendeth it up" (Proverbs 21:20). The dividing line Scripture draws is never mere income — it is the discipline of the store. A kept reserve is what lets a household absorb the blows every long life brings — illness, a lost job, a failed roof — without liquidating a producing asset (Lesson 1) or surrendering to the lender (Lesson 3). Proverbs sends us to the smallest of creatures for the pattern: "Go to the ant, thou sluggard; consider her ways, and be wise: which having no guide, overseer, or ruler, provideth her meat in the summer, and gathereth her food in the harvest" (Proverbs 6:6-8). Note precisely what is praised — self-governed, unsupervised diligence that stores in the season of plenty for the season of need. This is not the anxious hoarding Jesus warns against in the parable of the rich fool (Luke 12), nor is it trusting the store instead of God; it is prudent provision held with an open hand. And it rewards patience over haste: "Wealth gotten by vanity shall be diminished: but he that gathereth by labour shall increase" (Proverbs 13:11); "the thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want" (Proverbs 21:5). For any who have been burned by a get-rich-quick scheme, that is a gentle vindication. Store a portion first; gather by labour; let it grow slowly and surely. It is the quiet habit on which every bolder step in this series depends.',
    },
    quiz: {
      questions: [
        {
          q: 'According to Proverbs 21:20, what really separates the wise from the foolish with money?',
          options: [
            'How much money they make',
            'Whether they keep a store — the fool "spendeth it up," the wise keeps a reserve',
            'Their luck',
          ],
          answer: 1,
          explain: 'Same money in, different result: the wise keep a store; the fool spends it all. The dividing line is the discipline, not the income.',
        },
        {
          q: 'What does the ant teach us (Proverbs 6:6-8)?',
          options: [
            'To work only when a boss is watching',
            'Self-governed diligence: store in the season of plenty for the season of need',
            'That saving is impossible for small creatures',
          ],
          answer: 1,
          explain: 'With "no guide, overseer, or ruler," the ant still gathers in summer for winter — unsupervised, steady storing is the pattern.',
        },
        {
          q: 'What does a store (an emergency fund) protect you from?',
          options: [
            'Nothing useful',
            'Having to cut down a producing asset or run to the lender when a hard season hits',
            'Ever enjoying your money',
          ],
          answer: 1,
          explain: 'A reserve turns a crisis into an inconvenience — you meet the hard week without liquidating your tree (Lesson 1) or borrowing at high cost (Lesson 3).',
        },
      ],
    },
    lesson: 'Proverbs quietly hands you the secret that most money-stress comes down to, and it is not the secret people expect. "There is treasure to be desired and oil in the dwelling of the wise; but a foolish man spendeth it up" (Proverbs 21:20). Read it again: the difference between the wise house and the foolish one is not how much came in the door — it is that one KEPT a store and the other spent it all. Same income, opposite outcome. That kept store — what we’d call an emergency fund, a buffer — is the single most protective habit in a family’s whole financial life, because life delivers blows on its own schedule: the car dies, the roof leaks, the hours get cut, someone gets sick. With a store, those are inconveniences. Without one, each becomes a small disaster that forces you to cut down a producing asset (the very thing Lesson 1 warned against) or run to the lender (the trap Lesson 3 is about) at the worst possible moment and the worst possible rate. Yahweh drives the point home with the humblest of teachers: "Go to the ant, thou sluggard; consider her ways, and be wise: which having no guide, overseer, or ruler, provideth her meat in the summer, and gathereth her food in the harvest" (Proverbs 6:6-8). No boss stands over the ant, and no one reminds her — she simply stores a little all through the season of plenty so the season of need cannot wreck her. That is the posture: store a portion FIRST, before you spend the rest, every time provision comes in. This is not fearful hoarding, and it is not trusting the store instead of trusting God; it is prudent provision held with an open hand. And it quietly rebukes the get-rich-quick itch that empties so many pockets: "Wealth gotten by vanity shall be diminished: but he that gathereth by labour shall increase" (Proverbs 13:11), and "the thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want" (Proverbs 21:5). Slow, gathered, steady increase beats fast money every single time — because fast money is usually gone as fast as it came. So before you reach for anything bolder in this series, build the store. Pick your first number, even a small one; give it a place to sit untouched; and feed it first. Everything that follows — buying an asset, paying it off, one day pulling cash from it — stands on this quiet, ant-like habit of keeping a portion instead of devouring it.',
    facilitator: {
      talkingPoints: [
        'The dividing line is the STORE, not the income: "the wise" keep a reserve; "a foolish man spendeth it up" (Proverbs 21:20). Same money in, opposite result.',
        'The ant (Proverbs 6:6-8): self-governed, unsupervised diligence — store in the season of plenty for the season of need. No boss required.',
        'A store turns a crisis into an inconvenience, and keeps you from having to cut down a producing asset (Lesson 1) or run to the lender (Lesson 3) at the worst moment.',
        'Not fearful hoarding, not trusting the store over God — prudent provision held with an open hand (contrast the rich fool, Luke 12).',
        'Slow beats fast: "he that gathereth by labour shall increase" (Proverbs 13:11); "the thoughts of the diligent tend only to plenteousness" (Proverbs 21:5). This gently frees anyone burned by get-rich-quick.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Proverbs 21:20 and 6:6-8 aloud — ask, "who taught you to save, if anyone?" | The big idea, in your own words (8): the difference is the store, not the paycheck; tell the ant’s example plainly. | Go deeper — the Word on money (10): what a store protects against (the car, the roof, the lost hours) — a crisis vs an inconvenience; land Proverbs 13:11 and 21:5, slow beats fast. | Reflect together (8): use the prompts; honor that starting small is still starting. | Take it with you (3): each person sets a first "store" number and where it will sit, untouched — and moves the first amount today if they can.',
      discussionPrompts: [
        'When did NOT having a store turn a small problem into a big one for you?',
        'What would a first, small emergency fund do for your peace this month?',
        'The ant stores with "no guide, overseer, or ruler." Where do you need self-governed diligence, without anyone making you?',
        'Have you ever been burned chasing fast money? What would "gather by labour" look like instead?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 3 — The Borrower Is Servant
  {
    id: 'sw3-the-borrower-is-servant',
    title: 'The Borrower Is Servant',
    bigIdea: 'Proverbs is blunt: "the borrower is servant to the lender." Debt is not just a bill — it is a form of ownership over your future work. Some borrowing is a tool the wise use on purpose (we’ll see that in the refinance), but consumer debt for things that only get used up is a trap: you pay for last year’s want with next year’s freedom. The goal is to owe no one anything but love — to work FOR your future instead of paying off your past.',
    inApp: 'List every debt you owe and its interest rate, smallest to largest. Circle the most expensive one — that’s where the war starts. Say it out loud: "I will owe no man anything but to love him — I am working my way free."',
    anchor: {
      ref: 'Proverbs 22:7; Romans 13:8',
      theme: 'The borrower is servant to the lender; so owe no man anything but to love one another. Debt is a claim on your future work — get free of the trap kind.',
    },
    benefits: [
      'Clear eyes on the real cost of debt — it is a claim on your FUTURE work, not just a monthly bill.',
      'A war plan: attack the most expensive debt first and stop the bleeding.',
      'Freedom from the servant-to-the-lender trap, so your labour builds YOUR house, not the lender’s.',
      'A guardrail against consumer debt for things that only get used up — paying next year’s freedom for last year’s want.',
      'The aim Scripture sets: "owe no man any thing, but to love one another" (Romans 13:8) — free to give, not just to pay.',
    ],
    levels: {
      child: 'The Bible tells the plain truth about borrowing money: "the borrower is servant to the lender" (Proverbs 22:7). A servant has to do what someone else says. So when you borrow money, part of your work now belongs to the person you owe — until you pay it all back. Imagine you borrow candy money from a friend, and now every allowance you get, some of it has to go to them first. You are kind of working for THEM until it’s paid. That’s why it’s so much better to save up and buy something than to borrow and owe. God’s goal for us is to be free: "Owe no man any thing, but to love one another" (Romans 13:8). The only thing we should always "owe" everybody is love! So save up, wait, and buy it when you can — and stay free.',
      teen: 'Here’s a truth that will protect you for life: "The rich ruleth over the poor, and the borrower is servant to the lender" (Proverbs 22:7). Debt isn’t just a monthly payment — it’s a piece of your FUTURE that already belongs to someone else. When you borrow for something that only gets used up (clothes, a phone upgrade, eating out on a credit card at 25% interest), you’re paying for last year’s want with next year’s freedom, plus a fat fee on top. The lender rules that part of your life until it’s gone. Now — not ALL borrowing is dumb. Later in this series you’ll see a wise, on-purpose kind of loan (a refinance) that a smart owner uses as a tool. The difference is whether the borrowing puts you UNDER something or gets leverage on something you OWN. For now, learn the trap: consumer debt for stuff that disappears makes you a servant. God’s aim for you is freedom — "Owe no man any thing, but to love one another" (Romans 13:8). Get free, stay free, and let your work build YOUR house instead of the lender’s.',
      senior: 'Few proverbs land with more lived weight than this one: "The rich ruleth over the poor, and the borrower is servant to the lender" (Proverbs 22:7). Scripture is not moralizing about a bill; it is describing a real transfer of authority — debt is a claim on your future labour, and the lender holds it. The seasoned steward has felt both edges of this. There is a foolish, enslaving borrowing — consumer debt at punishing interest for things that depreciate to nothing — of which Proverbs warns even against careless co-signing: "Be not thou one of them that strike hands, or of them that are sureties for debts. If thou hast nothing to pay, why should he take away thy bed from under thee?" (Proverbs 22:26-27). And there is a wise, deliberate use of a loan as a tool by an owner who controls the terms — the refinance this series builds toward, where you borrow against an asset you own rather than surrendering your future to fund a want. The whole art is knowing which is which: does this borrowing put me UNDER, or does it give me leverage on something I OWN and can service from its own yield? The scriptural aim is never mere solvency but freedom for love: "Owe no man any thing, but to love one another: for he that loveth another hath fulfilled the law" (Romans 13:8). The one debt we are to carry perpetually is love. Everything else, get free of — so that your labour, in your later years, builds your own house and blesses your children’s children, rather than servicing a lender’s.',
    },
    quiz: {
      questions: [
        {
          q: 'What does "the borrower is servant to the lender" (Proverbs 22:7) actually mean?',
          options: [
            'Borrowing is always a sin',
            'Debt is a claim on your FUTURE work — the lender holds authority over part of your life until it’s paid',
            'Only poor people borrow',
          ],
          answer: 1,
          explain: 'It describes a real transfer: part of your future labour already belongs to the lender. That is why the trap kind of debt is so costly.',
        },
        {
          q: 'What is the "trap" kind of borrowing to avoid?',
          options: [
            'Any loan of any kind',
            'Consumer debt at high interest for things that only get used up — paying next year’s freedom for last year’s want',
            'Borrowing a book from a friend',
          ],
          answer: 1,
          explain: 'Borrowing for depreciating wants at punishing rates makes you a servant. (A deliberate loan against an asset you own is a different, wiser tool — Lesson 6.)',
        },
        {
          q: 'What is the one debt Scripture says to carry always (Romans 13:8)?',
          options: [
            'A mortgage',
            'Love — "owe no man any thing, but to love one another"',
            'Student loans',
          ],
          answer: 1,
          explain: 'The aim is freedom for love: get free of every other debt so your work builds your house and blesses others, and keep owing only love.',
        },
      ],
    },
    lesson: 'Proverbs does not soften it, and neither should we: "The rich ruleth over the poor, and the borrower is servant to the lender" (Proverbs 22:7). That is not a scolding about a monthly bill; it is a description of a real transfer of authority. When you borrow, a piece of your FUTURE work no longer belongs to you — it belongs to the lender, until the last dollar is paid. You feel it every month: money you earned this year going to pay for something you already used up, plus a fee on top. That is the servant part, and it is why the trap kind of debt is so quietly devastating. The trap is consumer debt — borrowing at high interest for things that only depreciate: the clothes, the gadget, the meals put on a card at twenty-five percent. You are paying next year’s freedom for last year’s want, and handing the lender a cut for the privilege. Scripture even warns against carelessly guaranteeing someone else’s debt: "Be not thou one of them that strike hands, or of them that are sureties for debts. If thou hast nothing to pay, why should he take away thy bed from under thee?" (Proverbs 22:26-27). Now, hear this clearly, because it matters for where this series is going: not all borrowing is foolish. There is a wise, deliberate use of a loan — one an owner controls, borrowing against an asset they already own and can pay from the asset’s own yield. That is the refinance we will get to in Lesson 6, and it is a tool, not a trap. The whole art is telling the two apart with one honest question: does this borrowing put me UNDER something that only shrinks, or does it give me leverage on something I OWN and can service from its own fruit? For now, name and attack the trap kind. And keep the goal in view, because Scripture sets it higher than mere solvency — it sets it at freedom for love: "Owe no man any thing, but to love one another: for he that loveth another hath fulfilled the law" (Romans 13:8). The one debt you are meant to carry forever is love. Everything else, work your way free of — so that your labour builds your own house and one day blesses your children’s children, instead of forever servicing a lender’s.',
    facilitator: {
      talkingPoints: [
        '"The borrower is servant to the lender" (Proverbs 22:7) is a real transfer of authority — debt is a claim on your FUTURE work, not just a monthly bill.',
        'The TRAP kind: consumer debt at high interest for depreciating wants — paying next year’s freedom for last year’s want, plus a fee.',
        'Not all borrowing is foolish: a deliberate loan against an asset you OWN and can service from its yield is a tool (foreshadow Lesson 6, the refinance). The honest test: does it put me under, or give me leverage on what I own?',
        'Scripture even warns against careless co-signing/surety (Proverbs 22:26-27).',
        'The aim is higher than solvency — it’s freedom for love: "owe no man any thing, but to love one another" (Romans 13:8). Carry only love.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Proverbs 22:7 and Romans 13:8 aloud — ask, "have you ever felt like you were working for a lender?" | The big idea, in your own words (8): debt as a claim on future work; the trap kind vs the tool kind (name that the refinance is coming). | Go deeper — the Word on money (10): the honest test (under, or leverage on what I own?); the surety warning (22:26-27); the aim of freedom for love (13:8). | Reflect together (8): use the prompts; no shame — many carry trap debt and the point is a way OUT. | Take it with you (3): each person lists their debts with interest rates, smallest to largest, and circles the most expensive one to attack first.',
      discussionPrompts: [
        'Where have you felt like "a servant to the lender" — what did that cost you beyond money?',
        'Which of your debts is the "trap" kind (used-up things at high interest), and which is a tool?',
        'What is your most expensive debt, and what would it feel like to kill it first?',
        'What would you do with the money — and the freedom — once you "owe no man any thing but to love"?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 4 — Buy the Asset, Not the Spectacle (Darrell's testimony)
  {
    id: 'sw4-buy-the-asset-not-the-spectacle',
    title: 'Buy the Asset, Not the Spectacle',
    bigIdea: 'When Darrell and Christina were about to marry, they had one pot of money and two choices: a destination honeymoon they would remember, or a rental house that would pay them for decades. She said, "buy a house." They bought the rental and honeymooned at a local hotel — and Yahweh has been faithful. That is the whole lesson: at every fork, the wise ask not "what will feel good now?" but "what will still be producing in twenty years?" Prepare the field before you build the house. Count the cost. Buy the tree, not the firewood.',
    inApp: 'Name one upcoming "spectacle vs asset" fork in your own life — a splurge you’re planning, or money about to land. Ask the question honestly: what would still be producing in twenty years? Write down the asset version of that choice. Say it out loud: "I’ll buy what produces, and celebrate simply."',
    anchor: {
      ref: 'Proverbs 24:27; Luke 14:28',
      theme: 'Prepare your field first, and afterward build your house; and count the cost before you build. Put the producing thing first; the celebration can be simple.',
    },
    benefits: [
      'A decision rule you can use for life: at every fork, choose what will still be PRODUCING in twenty years.',
      'Freedom from spectacle-spending — the big splurge that feels great once and produces nothing.',
      'A real testimony that it works: a rental bought instead of a honeymoon, still providing decades later — to Yahweh’s glory.',
      'Order restored: prepare the field (the income) FIRST, then build the house (the comforts follow).',
      'The habit of counting the cost before you commit, so you finish what you start.',
    ],
    levels: {
      child: 'When Darrell and his wife Christina were getting married, they had some money saved, and they had to pick: a big fancy honeymoon trip far away, or a house that other people would pay to live in. Christina said, "let’s buy the house!" So they bought a rental house, and for their honeymoon they just stayed at a hotel close to home. Guess what? That house has been paying them money for many, many years — and God has taken good care of them! The Bible says, "Prepare thy work without... and afterwards build thine house" (Proverbs 24:27) — that means: get the thing that MAKES money first, and the fun stuff can come later. A trip is fun for a week. A good choice can bless you for a lifetime. So learn to pick the thing that keeps giving, and you can still celebrate — just simply!',
      teen: 'Real story: when Darrell and Christina were about to get married, they had one pot of money and a classic fork in the road — a destination honeymoon they’d remember, or a rental house that would pay them for decades. Christina said, "buy a house." So they did. They bought the rental and honeymooned at a local hotel, kept it simple, and gave the money a job. Decades later that house is still producing income, and they’ll tell you plainly: God has been faithful. That’s the lesson, and it’s a decision rule you can use your whole life: at every money fork, don’t ask "what feels good right now?" Ask "what will still be PRODUCING in twenty years?" The Bible put the order in one line: "Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house" (Proverbs 24:27). Get the income-maker first (prepare the field); the comforts (build the house) come after. And Jesus said count the cost before you build a tower, so you can actually finish it (Luke 14:28). You don’t have to skip celebrating — celebrate simply. Just don’t trade a lifetime asset for a one-week spectacle.',
      senior: 'Every seasoned couple knows the fork this lesson names, because they have stood at it many times. Darrell tells it straight, as testimony: when he and Christina were engaged, they had a sum of money and a decision — a destination honeymoon, or an income-producing rental house. Christina chose the house. They bought the rental, honeymooned modestly at a local hotel, and decades on, that property is still yielding — and, he is quick to say, Yahweh has been faithful the whole way; the glory is His. The principle beneath the story is old and ordered: "Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house" (Proverbs 24:27). The ancient wisdom is sequence — establish the productive means (the field) BEFORE the consumptive comforts (the house), so the comforts rest on a foundation that pays for them. Jesus grounds the same prudence in the counting of cost: "Which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?" (Luke 14:28). None of this is asceticism or a rebuke of joy — Scripture blesses the enjoyment of God’s gifts (Ecclesiastes 5:19). It is discernment about SEQUENCE and PROPORTION: the wise put the producing thing first and keep the celebration modest, precisely so that there is more to celebrate, and to give, for the rest of their lives — and for their children’s children. The spectacle dazzles once; the asset provides for a generation.',
    },
    quiz: {
      questions: [
        {
          q: 'At the marriage fork, what did Darrell and Christina choose — and why does it matter?',
          options: [
            'A destination honeymoon, for the memories',
            'A rental house over the honeymoon — an asset that would produce for decades (they honeymooned locally); Yahweh has been faithful',
            'They spent it all and started over',
          ],
          answer: 1,
          explain: 'They bought the producing asset and kept the celebration simple. Decades later the rental still provides — a real testimony to Yahweh’s faithfulness.',
        },
        {
          q: 'What is the decision rule this lesson gives you for every money fork?',
          options: [
            'Choose whatever feels best right now',
            'Ask "what will still be PRODUCING in twenty years?" and put the asset first',
            'Always pick the cheapest option',
          ],
          answer: 1,
          explain: 'The wise ask about the future yield, not the present feeling — buy what produces, celebrate simply.',
        },
        {
          q: 'What order does Proverbs 24:27 set?',
          options: [
            'Build your house first, then worry about income',
            'Prepare the FIELD (the income-maker) first, and afterward build the house (the comforts)',
            'Neither; do them at random',
          ],
          answer: 1,
          explain: '"Prepare thy work without... and afterwards build thine house" — establish the productive means before the consumptive comforts, so the comforts are paid for. Count the cost first (Luke 14:28).',
        },
      ],
    },
    lesson: 'Some lessons are best told as testimony, so here is one, and Darrell tells it to give Yahweh the glory. When he and Christina were engaged and about to marry, they had a pot of money and a very real choice in front of them — the kind almost every couple faces in some form. They could take a destination honeymoon, the trip you remember and show people; or they could buy a rental house, a property that other people would pay to live in for decades to come. He asked her which she wanted. Christina said: buy a house. So that is what they did. They bought the rental property, and for their honeymoon they simply stayed at a local hotel — celebration kept modest on purpose — and they gave that money a job instead of a memory. Decades later, that house is still producing income for their family, and Darrell will tell you plainly that Yahweh has been faithful through all of it; the increase and the keeping have been the Lord’s. That is the whole lesson, and inside it is a decision rule you can carry for the rest of your life. At every money fork, the wise do not ask "what will feel good right now?" They ask "what will still be PRODUCING in twenty years?" One choice dazzles once; the other provides for a generation. Scripture set the order down long ago in a single line: "Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house" (Proverbs 24:27). Prepare the field first — establish the thing that makes provision — and AFTERWARD build the house, the comforts, the celebrations, which now rest on a foundation that can actually pay for them. Jesus grounds the same wisdom in counting the cost: "Which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?" (Luke 14:28). Now hear what this is NOT: it is not a frown on joy, and it is not saying never celebrate. Scripture blesses the enjoyment of God’s good gifts. It is about SEQUENCE and PROPORTION — put the producing thing first, keep the spectacle simple, and you will end up with far more to celebrate, and far more to give, for the whole rest of your life. This lesson is where the earlier ones become a decision: you learned to own what produces (Lesson 1) and to keep a store (Lesson 2) and to fear the debt-trap (Lesson 3); here you stand at the fork and actually choose the tree over the firewood — the asset over the spectacle. The next two lessons follow that rental house all the way through: paying it off, and then, years later, pulling cash from it without ever selling it.',
    facilitator: {
      talkingPoints: [
        'The testimony (told to give Yahweh the glory): Darrell and Christina chose a rental house over a destination honeymoon, honeymooned locally, and decades later that asset still provides — the Lord has been faithful.',
        'The decision rule for every money fork: not "what feels good now?" but "what will still be PRODUCING in twenty years?" The spectacle dazzles once; the asset provides for a generation.',
        'The biblical ORDER: "Prepare thy work... in the field; and afterwards build thine house" (Proverbs 24:27) — income-maker first, comforts after, so the comforts are paid for.',
        'Count the cost before you commit (Luke 14:28) so you can finish what you start.',
        'This is NOT anti-joy: Scripture blesses enjoying God’s gifts (Ecclesiastes 5:19). It is about sequence and proportion — celebrate simply, so there’s more to celebrate and give for a lifetime.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Proverbs 24:27 and Luke 14:28 aloud — ask, "what’s a spectacle you were tempted to buy?" | The big idea, in your own words (8): tell the honeymoon-house testimony; draw the fork — spectacle (feels good once) vs asset (produces for decades). | Go deeper — the Word on money (10): the order (field before house), counting the cost, and that this isn’t anti-joy — celebrate simply. | Reflect together (8): use the prompts; let couples/families talk about a real upcoming fork. | Take it with you (3): each person names one real spectacle-vs-asset fork ahead and writes the ASSET version of that choice.',
      discussionPrompts: [
        'What is a "spectacle" you spent on that felt great once and produced nothing — and what could that money have become?',
        'What money fork is ahead of you right now, and what would "buy the asset, celebrate simply" look like there?',
        'Where in your life have you built the house before preparing the field — and what happened?',
        'How does hearing that God was faithful through their simple choice change how you see your own?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 5 — Pay It Off (free from the lender)
  {
    id: 'sw5-pay-it-off',
    title: 'Pay It Off',
    bigIdea: 'Darrell and Christina didn’t just buy the rental house — they paid it off. And a paid-off asset changes everything: now the rent isn’t servicing a bank, it’s serving your family. The widow in 2 Kings had a jar of oil, and the prophet’s word was exact: "sell the oil, and pay thy debt, and live thou and thy children of the rest." Pay the debt FIRST, then live off what the asset produces free and clear. A paid-off tree gives you all its fruit.',
    inApp: 'Pick your "oil to sell" — the one focused effort or cutback that will kill your most expensive debt fastest — and your target date to be free of it. Say it out loud: "I pay the debt, then my family lives off the rest."',
    anchor: {
      ref: '2 Kings 4:7; Romans 13:8',
      theme: 'Sell the oil, pay the debt, and live — you and your children — off the rest. Owe no man anything but love. A paid-off asset gives its full fruit to your family.',
    },
    benefits: [
      'The full fruit of your asset flowing to YOUR family, not to a bank — once the debt on it is gone.',
      'Freedom and margin: a paid-off house (or car, or tool) drops your cost of living and steadies every month.',
      'A biblical order of operations — pay the debt FIRST, then live off the rest (2 Kings 4:7).',
      'Proof it’s reachable: Darrell and Christina paid theirs off and still collect the income decades on.',
      'The launch pad for Lesson 6 — you can only refinance from strength what you actually OWN free and clear.',
    ],
    levels: {
      child: 'In the Bible there was a mom whose husband had died, and she owed money she couldn’t pay. All she had was one little jar of oil. She asked God’s helper, the prophet Elisha, what to do. God did a miracle and filled LOTS of jars with her oil! Then the prophet told her exactly what to do: "sell the oil, and pay thy debt, and live thou and thy children of the rest" (2 Kings 4:7). See the order? First she PAID what she owed. Then she and her kids got to LIVE on all the money that was left over. When Darrell and Christina bought their rental house, they worked hard and paid it ALL off. Now nobody can take it, and the rent money is theirs to keep. Paying something off all the way is like finally owning your whole apple tree — every single apple is yours!',
      teen: 'Buying the asset is step one; OWNING it free and clear is where the power is. Darrell and Christina didn’t just buy that rental house — they paid it off. And that changes the whole equation: before, the rent had to go feed the bank; after, the rent feeds their family. The Bible has a perfect little picture of the right order. A widow was drowning in debt with nothing but one jar of oil. God multiplied the oil into many jars, and then the prophet gave her the exact play: "sell the oil, and pay thy debt, and live thou and thy children of the rest" (2 Kings 4:7). Read the sequence — pay the debt FIRST, THEN live off what’s left, free and clear. Not the other way around. That’s the goal with any asset you’re paying on: kill the debt, and then the thing you own starts working fully for you instead of for the lender. It lines up with the aim from Lesson 3 — "owe no man any thing, but to love one another" (Romans 13:8). A paid-off tree gives you ALL its fruit. Pick your "oil to sell" — the one hard push that kills your biggest debt — and go get free.',
      senior: 'The seasoned steward knows the quiet, enormous difference between owning an asset and owning it FREE AND CLEAR. Darrell and Christina did not stop at buying the rental house; they paid it off — and a paid-off property reorders a family’s whole economy: the rent that once serviced a mortgage now serves the household, the monthly cost of living drops, and the margin to give and to save widens. Scripture gives the order of operations in one of its tenderest miracles. A prophet’s widow, her creditor coming for her two sons, has nothing but "a pot of oil" (2 Kings 4). Elisha multiplies it, and his instruction is precise and sequential: "Go, sell the oil, and pay thy debt, and live thou and thy children of the rest" (2 Kings 4:7). Pay the debt FIRST; then live — you and your children — off what remains, unencumbered. That is the pattern: retire the debt on the asset, and the asset’s yield becomes wholly yours and your heirs’. It fulfills the aim set in Lesson 3 — "owe no man any thing, but to love one another" (Romans 13:8) — and it is the necessary launch pad for what follows, because you can only refinance from a position of strength what you genuinely own. For any who carry the weariness of long obligation, this is the hopeful word: debt CAN be retired, deliberately, oil-jar by oil-jar; and the freedom on the other side — the full fruit of a paid-off tree flowing to your family and beyond — is worth every disciplined season it takes to get there.',
    },
    quiz: {
      questions: [
        {
          q: 'What exact order did the prophet give the widow in 2 Kings 4:7?',
          options: [
            'Live first, and pay the debt only if there’s anything left',
            'Sell the oil, PAY THE DEBT, and THEN live — you and your children — off the rest',
            'Keep the oil and ignore the debt',
          ],
          answer: 1,
          explain: '"Sell the oil, and pay thy debt, and live thou and thy children of the rest." Retire the debt first; then live off what remains, free and clear.',
        },
        {
          q: 'Why does paying OFF an asset (not just buying it) matter so much?',
          options: [
            'It doesn’t change anything',
            'The rent/yield stops servicing the bank and starts serving YOUR family; your cost of living drops',
            'It only helps the lender',
          ],
          answer: 1,
          explain: 'A paid-off tree gives you all its fruit. Owning free and clear reorders the whole household economy toward you and your heirs.',
        },
        {
          q: 'How does this connect to the next lesson (the refinance)?',
          options: [
            'It doesn’t',
            'You can only refinance from strength what you actually OWN free and clear — paying it off is the launch pad',
            'You should refinance before paying anything off',
          ],
          answer: 1,
          explain: 'Ownership free and clear is the position of strength the refinance draws on. First own it fully (Lesson 5); then you can pull cash without selling it (Lesson 6).',
        },
      ],
    },
    lesson: 'Buying the asset was Lesson 4; this lesson is about the difference between owning something and owning it FREE AND CLEAR — because that difference is enormous, and Darrell and Christina lived it. They did not simply buy the rental house; they worked and paid it off. And a paid-off asset quietly reorders a family’s entire economy. Before it is paid off, the rent that property earns has to go feed the bank every month. After it is paid off, that same rent feeds YOUR family. The cost of living drops. The margin to save and to give widens. The thing you own finally works fully for you instead of for the lender. Scripture hands us the exact order of operations inside one of its tenderest miracles. In 2 Kings 4, a prophet’s widow is about to lose her two sons to a creditor, and all she has left in the house is a single pot of oil. Through Elisha, Yahweh multiplies that oil into vessel after vessel — and then the prophet’s instruction is careful and sequential: "Go, sell the oil, and pay thy debt, and live thou and thy children of the rest" (2 Kings 4:7). Do not miss the order. First: pay the debt. THEN: live — you and your children — off the rest, unencumbered. Not "live it up and pay the debt with the scraps," but retire the obligation first, and then let what the asset produces be wholly yours. That is the pattern for anything you are still making payments on: kill the debt on it, and its yield becomes entirely your family’s. It is the fulfillment of the aim we set back in Lesson 3 — "owe no man any thing, but to love one another" (Romans 13:8) — and it is the launch pad for the lesson that comes next, because here is the key: you can only refinance from a position of strength something you genuinely OWN. If the property is drowning in debt, the bank has the strength; if you own it free and clear, YOU do. So if you are weary under a long obligation, take heart — debt can be retired on purpose, one oil-jar at a time. Pick your "oil to sell": the one focused push or cutback that will kill your most expensive debt fastest, and a real date to be free of it. The freedom on the other side — the full fruit of a paid-off tree flowing to your family, and one day to your children’s children — is worth every disciplined season it costs. Own it fully. Then, in the next lesson, we’ll see how a fully-owned asset can hand you cash without you ever having to sell the tree.',
    facilitator: {
      talkingPoints: [
        'Owning vs owning FREE AND CLEAR: Darrell and Christina paid the rental off — now the rent serves the family, not the bank; cost of living drops, margin to give widens.',
        'The order of operations from 2 Kings 4:7: "sell the oil, and pay thy debt, and live thou and thy children of the rest." Pay the debt FIRST, then live off the rest.',
        'A paid-off tree gives you ALL its fruit — the yield becomes wholly yours and your heirs’. It fulfills "owe no man any thing, but to love" (Romans 13:8).',
        'This is the launch pad for Lesson 6: you can only refinance FROM STRENGTH what you own free and clear.',
        'Hope for the weary: debt CAN be retired deliberately, oil-jar by oil-jar. Pick the one focused push that kills the most expensive debt.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read 2 Kings 4:1-7 aloud — ask, "notice the ORDER of what she does with the money." | The big idea, in your own words (8): owning vs owning free-and-clear; how a paid-off asset flips the rent from feeding the bank to feeding the family. | Go deeper — the Word on money (10): the sequence (pay first, then live off the rest); tie to Romans 13:8; name that this is the launch pad for the refinance. | Reflect together (8): use the prompts; encourage the weary — it’s reachable. | Take it with you (3): each person names their "oil to sell" (the focused push to kill the biggest debt) and a target free-and-clear date.',
      discussionPrompts: [
        'What would change for your family if your biggest debt were simply GONE?',
        'What is your "jar of oil" — the resource or effort you could direct at the debt right now?',
        'Why does the ORDER matter — pay the debt first, then live off the rest?',
        'What’s one cutback or push that could move your "free and clear" date sooner?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 6 — The Refinance (the KEYSTONE)
  {
    id: 'sw6-the-refinance',
    title: 'The Refinance — Cash Without Cutting Down the Tree',
    bigIdea: 'Here is the move most people never learn. Darrell and Christina paid off their rental house — and now, any time they need cash, they don’t have to SELL it. They can refinance: borrow against the house they own, up to about 80% of its appraised value, and take that money out as a LOAN. And a loan is borrowed money, not income — so it isn’t taxed as income the way a sale’s profit is. The rent the house earns services the loan. So they get cash today AND keep the asset producing for tomorrow. You don’t cut down the fruit tree to get money — you let it keep making fruit while it also lets you borrow against its trunk.',
    inApp: 'Think of an asset you own (or are working to own free and clear). Ask: if I needed cash, would selling it kill a producing thing? Could I instead borrow against it and let its yield service the loan? Write down which of your assets could one day be a "keep the tree" source of cash. Say it out loud: "I don’t have to sell the tree to eat from it."',
    anchor: {
      ref: 'Deuteronomy 8:18; Proverbs 13:22',
      theme: 'It is Yahweh who gives the power to get wealth, to establish His covenant; and a good man leaves an inheritance to his children’s children. Use the asset wisely without destroying it.',
    },
    benefits: [
      'A way to get cash from an asset WITHOUT selling it — you keep the producing thing AND get liquidity today.',
      'Clear understanding of a real, legal, plain fact: loan proceeds are borrowed money, not income, so they’re not taxed as income (a sale’s gain can be).',
      'A picture of leverage used wisely — the rent services the loan, so the asset largely pays for its own borrowing.',
      'The wise, on-purpose kind of borrowing (contrast the trap in Lesson 3): leverage on what you OWN and can service from its yield.',
      'A tree you can pass on still standing — cash pulled without destroying the inheritance (Proverbs 13:22).',
    ],
    levels: {
      child: 'Remember the apple tree? Here’s a really smart trick grown-ups can do. Darrell and Christina own their rental house all the way — nobody else has any claim on it. One day they might need some money. They do NOT have to sell their house to get it! Instead, they can go to the bank and say, "we own this house; let us borrow some money, and we’ll use it as the promise that we’ll pay you back." The bank gives them cash now, and the rent from the house pays the bank back a little each month. So they get money to use AND they still keep their house making rent! It’s like this: you don’t chop down your apple tree to get money. You keep the tree, keep getting apples, and just borrow a little using the tree as your promise. God is the One who gives us wisdom and the power to build good things (Deuteronomy 8:18) — and wise people keep the tree so they can pass it to their kids someday (Proverbs 13:22).',
      teen: 'This is the move almost nobody teaches you, and it’s the whole reason the earlier lessons matter. Darrell and Christina own their rental house free and clear (Lesson 5). Now say they need cash. Most people’s only idea is: sell it. But selling kills the producing asset — you get one lump, and the rent stops forever. Here’s the smarter play: REFINANCE. Because they own the house, they can borrow against it — typically up to about 80% of what it’s appraised to be worth — and take that money out as a LOAN. Two things make this powerful. One: they still OWN the house, so it keeps earning rent, and that rent services (pays down) the loan. Two — and this is a plain, legal fact, not a loophole — a loan is borrowed money, not income. You didn’t earn it or sell for a profit; you have to pay it back. So loan proceeds aren’t taxed as income the way the GAIN on a sale can be. Result: cash in hand today, AND the tree still standing and still producing tomorrow. That’s the difference between the trap-debt of Lesson 3 and wise leverage — this is borrowing ON something you own and can pay from its own fruit. (Real talk: rates, fees, and rules change, and you have to be able to make the payment — so this is teaching, not personalized advice. Run the numbers with a trusted advisor.) But learn the principle now: you don’t have to cut down the tree to eat from it.',
      senior: 'For the experienced steward this lesson names something you may have used, or wished you had: the difference between LIQUIDATING an asset and LEVERAGING it. Darrell and Christina, having paid the rental house off (Lesson 5), hold it free and clear — and that ownership gives them options a debtor does not have. Should they need capital, they need not SELL the property (which ends the income stream and can trigger tax on the gain). They can instead refinance — borrow against the equity they own, commonly up to roughly 80% of appraised value (an 80% loan-to-value), drawing the cash out as loan proceeds. Two features make this a genuinely wise tool rather than the trap-debt of Lesson 3. First, the asset is retained and keeps producing: the rental income services the new loan, so the property substantially carries its own borrowing. Second — and this is stated as the plain, established fact it is (DR-0100), not tax advice — borrowed money is not income. A loan must be repaid; it is not earnings and not a realized gain, so loan proceeds are not taxed as income, whereas the profit on a sale generally is a taxable event. The steward thus converts illiquid equity into usable cash WITHOUT destroying the producing asset or unnecessarily realizing a tax liability — and retains the property to keep yielding and, in time, to pass on. This is precisely the "wise, on-purpose borrowing" foreshadowed in Lesson 3: leverage upon a thing you own and can service from its own yield, not consumer debt for what depreciates. The necessary cautions are real and must be taught alongside it: refinancing re-encumbers the asset, appraisals and rates and lending rules vary and change, closing costs apply, and one must be genuinely able to service the debt from reliable income — over-leverage is its own snare. So this is teaching, not personalized financial, tax, or legal advice; the numbers must be run, and a trusted advisor consulted, for any real transaction. But the principle is a jewel worth handing to the next generation: "it is he [the LORD] that giveth thee power to get wealth, that he may establish his covenant" (Deuteronomy 8:18), and "a good man leaveth an inheritance to his children’s children" (Proverbs 13:22). You can draw from the tree without cutting it down — and so leave it standing for those who come after you.',
    },
    quiz: {
      questions: [
        {
          q: 'What is the core move of a refinance, as taught here?',
          options: [
            'Sell the asset to get cash',
            'Borrow AGAINST an asset you own (up to ~80% of appraised value) and take the cash as a LOAN — keeping the asset',
            'Give the asset to the bank',
          ],
          answer: 1,
          explain: 'You pull cash out as loan proceeds against equity you own, commonly up to ~80% loan-to-value, and you KEEP the producing asset instead of liquidating it.',
        },
        {
          q: 'Why aren’t loan proceeds taxed as income (a plain, established fact)?',
          options: [
            'Because of a secret loophole',
            'Because borrowed money is not income — it must be repaid; a sale’s GAIN, by contrast, can be a taxable event',
            'They actually are taxed as income',
          ],
          answer: 1,
          explain: 'A loan isn’t earnings or a realized gain — you owe it back — so it isn’t taxed as income the way profit on a sale generally is. (Teaching, not personalized tax advice — run your numbers.)',
        },
        {
          q: 'How is this the WISE kind of borrowing (vs the trap in Lesson 3)?',
          options: [
            'It isn’t; all borrowing is the same',
            'It’s leverage ON an asset you own that you can service from its own yield (the rent), not consumer debt for things that depreciate',
            'Because you never have to pay it back',
          ],
          answer: 1,
          explain: 'The asset keeps producing and its rent services the loan — leverage on what you own, controlled by you. You must still be able to make the payment; over-leverage is its own snare.',
        },
        {
          q: 'What’s the picture that ties this lesson to the whole series?',
          options: [
            'Chop down the tree to sell the wood',
            'Draw cash from the tree WITHOUT cutting it down — keep it producing, and pass it on still standing',
            'Ignore the tree entirely',
          ],
          answer: 1,
          explain: 'You get money today and keep the producing asset for tomorrow — and leave it standing as an inheritance (Proverbs 13:22). You don’t have to sell the tree to eat from it.',
        },
      ],
    },
    lesson: 'This is the keystone of the whole series — the move most people are never taught, and the reason every earlier lesson mattered. Darrell and Christina bought the rental house (Lesson 4) and paid it off (Lesson 5), so they now own it free and clear, with no one else holding a claim on it. Now suppose they need a sum of cash. The only idea most people have is to SELL — but selling kills the producing asset: you get one lump of money, the rent stops forever, and you’ve cut down the tree to get the wood. There is a wiser move, and it depends entirely on owning the thing outright: REFINANCE. Because they own the house, they can borrow against it — typically up to about 80% of the property’s appraised value, what lenders call an 80% loan-to-value — and take that money out as a LOAN. Two features turn this from the trap-debt of Lesson 3 into a genuinely wise tool. First, they still OWN the house, so it keeps producing: the rent it earns services the new loan, meaning the asset largely pays for its own borrowing. Second — and this is a plain, established fact stated plainly, not a loophole and not tax advice — borrowed money is not income. You didn’t earn it and you didn’t sell for a profit; you have to pay it back. Because it isn’t income and isn’t a realized gain, loan proceeds are not taxed as income, whereas the profit on a sale generally IS a taxable event. So the steward converts locked-up equity into usable cash today WITHOUT destroying the producing asset and without unnecessarily triggering a tax on a gain — and keeps the property to go on yielding, and one day to hand down. That is exactly the "wise, on-purpose borrowing" this series foreshadowed back in Lesson 3: leverage upon a thing you OWN and can service from its own fruit, as opposed to consumer debt for things that only get used up. Now, the honest cautions belong right here in the lesson, not in the fine print: a refinance re-encumbers the asset (you’re putting a loan back on the house you’d paid off), appraisals and interest rates and lending rules vary and change, there are closing costs, and above all you must genuinely be able to make the payment from reliable income — over-leverage is its own snare, and borrowing against everything is how people lose the tree they were trying to keep. So take this as teaching, not personalized financial, tax, or legal advice: for any real transaction, run the actual numbers and sit down with a trusted advisor. But the principle is a jewel to hand your children: it is Yahweh "that giveth thee power to get wealth, that he may establish his covenant" (Deuteronomy 8:18), and "a good man leaveth an inheritance to his children’s children" (Proverbs 13:22). You do not have to cut down the fruit tree to eat from it. You can draw from it and leave it standing — producing for you today, and for those who come after you.',
    facilitator: {
      talkingPoints: [
        'The keystone move: because they OWN the rental free and clear (Lesson 5), Darrell and Christina can pull cash by REFINANCING — borrowing against it, commonly up to ~80% of appraised value (80% LTV) — instead of selling it.',
        'Plain established fact (DR-0100), not a loophole and not tax advice: borrowed money is NOT income (you repay it), so loan proceeds aren’t taxed as income; a sale’s GAIN generally IS a taxable event.',
        'Why it’s wise leverage (vs Lesson 3’s trap): the asset is KEPT and keeps producing — the rent services the loan, so the property largely pays for its own borrowing. Leverage ON what you own, not consumer debt.',
        'The honest cautions belong in the lesson: it re-encumbers the asset; rates/fees/appraisals/rules vary and change; you must be able to make the payment; over-leverage is its own snare. Teaching, NOT personalized advice — run the numbers with a trusted advisor.',
        'The through-picture: draw cash from the tree WITHOUT cutting it down — keep it producing today and pass it on still standing (Deuteronomy 8:18; Proverbs 13:22).',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Deuteronomy 8:18 and Proverbs 13:22 aloud — ask, "who gives the power to get wealth, and why?" | The big idea, in your own words (8): sell vs refinance; draw the tree — selling chops it down (one lump, rent stops), refinancing borrows against the trunk (cash now, tree still fruiting). | Go deeper — the Word on money (10): the ~80% LTV mechanic; the plain fact that a loan isn’t income (so not taxed as income) while a sale’s gain can be; rent services the loan; then teach the cautions honestly (re-encumbering, rates/fees, must-make-the-payment, over-leverage). | Reflect together (8): use the prompts; keep the bright line — this is teaching, not personalized advice; numbers + a trusted advisor for any real move. | Take it with you (3): each person names one asset that could one day be a "keep the tree" source of cash instead of a sale.',
      discussionPrompts: [
        'What’s the difference between SELLING an asset and REFINANCING it — for the asset, and for your future income?',
        'Why does it matter that a loan is not income? Where had you assumed all incoming money is taxed the same?',
        'How is this "wise leverage" different from the trap-debt of Lesson 3?',
        'What are the real cautions you’d want to respect before ever doing this — and who is the trusted advisor you’d talk to?',
        'What would it mean to pass on a producing asset "still standing" to your children’s children?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 7 — An Inheritance to Your Children's Children
  {
    id: 'sw7-an-inheritance',
    title: 'An Inheritance to Your Children’s Children',
    bigIdea: 'Everything in this series was pointing here. "A good man leaveth an inheritance to his children’s children." Not just his kids — his grandchildren. The whole point of owning what produces, storing, staying free of the trap, buying the asset, paying it off, and drawing from it without destroying it, is a tree still standing generations from now. Wealth built The Way is not for hoarding and not for show — it’s a river that keeps flowing to people you may never meet. And the deepest inheritance you leave is the Way itself: the wisdom, the fear of the Lord, the testimony that Yahweh is faithful.',
    inApp: 'Write one sentence of "inheritance" you want to leave — an asset, a habit, and a truth about Yahweh — to someone in the next generation. Then take one small step toward it this week. Say it out loud: "I’m building something that outlives me, to the glory of Yahweh."',
    anchor: {
      ref: 'Proverbs 13:22; Psalm 112:1-3',
      theme: 'A good man leaves an inheritance to his children’s children; the God-fearing man’s seed is mighty, and blessing rests on the generation of the upright. Build what outlives you.',
    },
    benefits: [
      'A horizon past yourself — you build for people you may never meet, which reorders every choice today.',
      'Freedom from both hoarding and showing off — wealth The Way is a river that flows, not a pile that sits.',
      'The truest inheritance secured: not just money, but the Way — wisdom, the fear of the Lord, and the testimony that Yahweh is faithful.',
      'A blessing that compounds across generations: "his seed shall be mighty upon earth" (Psalm 112:2).',
      'A finish line for the series that is really a starting line for your family line.',
    ],
    levels: {
      child: 'Here is the best part of the whole lesson. The Bible says, "A good man leaveth an inheritance to his children’s children" (Proverbs 13:22). "Children’s children" means grandchildren! So a wise, good person builds things that are still helping their family even after they’re gone — like planting apple trees that their grandkids will get to eat from someday. That’s why we learn to keep the tree and not chop it down: so it’s still there for the kids who come later. And the very BEST thing you can leave your family isn’t just money — it’s teaching them to love God and follow His Way, and telling them all the times God was faithful to you. The Bible says the person who loves God, "his seed shall be mighty upon earth" (Psalm 112:2). So you’re not just building for you — you’re planting trees for people you might never even meet. Isn’t that a wonderful reason to be wise?',
      teen: 'Everything in this whole series was aiming at one verse: "A good man leaveth an inheritance to his children’s children" (Proverbs 13:22). Look closely — not just his children. His children’s children. Grandkids. The wise build with a time horizon way past their own lives. That’s the real reason you learn to own what produces, keep a store, stay out of the debt-trap, buy the asset, pay it off, and draw from it without destroying it: so there’s a tree still standing and still fruiting for a generation you may never meet. Wealth built The Way is not a pile you sit on (hoarding) and not a show you put on (flexing) — it’s a river that keeps flowing to others. And here’s the deepest part: the biggest inheritance you leave isn’t the money at all. It’s the WAY — the wisdom, the fear of the Lord, and your own testimony that God was faithful to you. Psalm 112 says of the person who fears the Lord and delights in His commands, "his seed shall be mighty upon earth: the generation of the upright shall be blessed" (Psalm 112:2). So start now. You’re not just building a life — you’re planting a family line. Build something that outlives you, and give the glory to Yahweh.',
      senior: 'This is where the series was always headed, and where a long life finds its meaning: "A good man leaveth an inheritance to his children’s children: and the wealth of the sinner is laid up for the just" (Proverbs 13:22). The Hebrew wisdom reaches past one’s own children to the third generation — the mark of a life well-stewarded is provision for those one may never meet. Everything prior in this series serves this end: one owns what produces, keeps a store, refuses the debt-trap, buys the asset over the spectacle, pays it off, and draws from it without destroying it, precisely so that a producing tree remains standing for the generations to come. Scripture is careful to frame such generational wealth rightly — neither the hoarding Jesus rebukes in the rich fool, nor the vanity of display, but a river of blessing that flows outward: "House and riches are the inheritance of fathers" (Proverbs 19:14), and of the one who fears the Lord, "His seed shall be mighty upon earth: the generation of the upright shall be blessed. Wealth and riches shall be in his house: and his righteousness endureth for ever" (Psalm 112:2-3) — note that his RIGHTEOUSNESS, not merely his estate, is what endures. For the deepest inheritance is not the asset but the WAY: the wisdom, the fear of the Lord, and the living testimony that "it is he that giveth thee power to get wealth" (Deuteronomy 8:18) and that He has been faithful. Darrell tells his own story — the rental bought instead of a honeymoon, paid off, still providing — for exactly this reason: so that the children and their children will know Yahweh kept His word, and will walk in the same Way, and pass down both the standing tree and the God who grew it. That is wealth built The Way: a blessing that outlives you, and glory that returns to Him.',
    },
    quiz: {
      questions: [
        {
          q: 'Who does the "good man" leave an inheritance to, in Proverbs 13:22?',
          options: [
            'Only himself, to enjoy',
            'His children’s CHILDREN — he builds past his own lifetime, to the third generation',
            'Whoever asks first',
          ],
          answer: 1,
          explain: 'The wisdom reaches to the grandchildren — a life well-stewarded provides for people one may never meet.',
        },
        {
          q: 'How is wealth built The Way meant to function?',
          options: [
            'As a pile to hoard or a show to flex',
            'As a river that flows outward — blessing that keeps moving to others, not hoarding and not display',
            'As something to spend entirely on yourself',
          ],
          answer: 1,
          explain: 'Neither the hoarding of the rich fool nor vanity of display — a flowing blessing (Proverbs 19:14; Psalm 112). That’s why you keep the tree standing.',
        },
        {
          q: 'What is the DEEPEST inheritance you leave?',
          options: [
            'Only the money and property',
            'The WAY itself — wisdom, the fear of the Lord, and the testimony that Yahweh is faithful',
            'Your reputation for spending',
          ],
          answer: 1,
          explain: 'Psalm 112 says his RIGHTEOUSNESS endures forever, not merely his estate. The truest inheritance is the Way and the God who gives the power to get wealth (Deuteronomy 8:18).',
        },
      ],
    },
    lesson: 'Everything in this series has been quietly pointing at one verse, and now we arrive: "A good man leaveth an inheritance to his children’s children: and the wealth of the sinner is laid up for the just" (Proverbs 13:22). Read it slowly. Not just his children — his children’s children. The grandchildren. Biblical wisdom builds on a time horizon that runs clean past your own lifetime, and that horizon is the reason every earlier lesson mattered. You learned to own what produces (Lesson 1), to keep a store (Lesson 2), to refuse the debt-trap (Lesson 3), to buy the asset instead of the spectacle (Lesson 4), to pay it off (Lesson 5), and to draw cash from it without destroying it (Lesson 6) — all of it so that a producing tree is still standing, still bearing fruit, for a generation you may never meet. That is the shape of wealth built The Way. It is not a pile you sit on — Jesus had hard words for the rich fool who hoarded and never gave. And it is not a show you put on — the vanity of display is its own kind of poverty. Wealth built The Way is a RIVER: blessing that keeps flowing outward, to your children, to their children, to the church, to the stranger. "House and riches are the inheritance of fathers" (Proverbs 19:14), and of the one who fears the Lord and delights in His commandments, Scripture says, "His seed shall be mighty upon earth: the generation of the upright shall be blessed. Wealth and riches shall be in his house: and his righteousness endureth for ever" (Psalm 112:2-3). Catch that last line — it is his RIGHTEOUSNESS that endures forever, not merely his estate. Which points to the deepest inheritance of all, the one worth more than every asset combined: the WAY itself. The wisdom. The fear of the Lord. And your own living testimony that Yahweh is faithful — that "it is he that giveth thee power to get wealth, that he may establish his covenant" (Deuteronomy 8:18). This is exactly why Darrell tells his own story plainly — the rental house bought instead of a honeymoon, paid off, still providing decades later — not to boast, but so that his children and their children will KNOW that Yahweh kept His word, and will walk in the same Way, and will pass down both the standing tree and the God who grew it. So here is the finish line of the series, which is really the starting line for your family line: build something that outlives you. Own what produces, keep the tree, let it feed you and let it flow, and hand down the asset AND the Way AND the testimony together. And give Yahweh the glory — for the power to get wealth was His gift, the keeping of it was His faithfulness, and the blessing that runs to your children’s children is, first and last, from His hand.',
    facilitator: {
      talkingPoints: [
        'The whole series aimed here: "A good man leaveth an inheritance to his children’s children" (Proverbs 13:22) — build past your own lifetime, to the grandchildren.',
        'Every prior lesson serves this: own what produces, store, refuse the trap, buy the asset, pay it off, draw without destroying — so a producing tree still stands for the next generations.',
        'Wealth The Way is a RIVER, not a pile (hoarding — the rich fool) and not a show (display): blessing that flows outward. "His seed shall be mighty upon earth" (Psalm 112:2).',
        'The DEEPEST inheritance is the Way itself — wisdom, the fear of the Lord, and the testimony that Yahweh is faithful. Note Psalm 112:3: his RIGHTEOUSNESS endures, not just his estate.',
        'Darrell tells his story to give Yahweh the glory — so his children’s children know the Lord kept His word (Deuteronomy 8:18). The power to get wealth was His gift; the glory returns to Him.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Proverbs 13:22 and Psalm 112:1-3 aloud — ask, "who benefits from a good man’s life, according to these verses?" | The big idea, in your own words (8): the time horizon past yourself; wealth as a river, not a pile or a show; recap how every lesson fed this. | Go deeper — the Word on money (10): the deepest inheritance is the Way + the testimony (Psalm 112:3, righteousness endures); Yahweh gives the power to get wealth (Deuteronomy 8:18) — the glory is His. | Reflect together (8): use the prompts; let people speak about what they want to pass on. | Take it with you (3): each person writes one sentence of inheritance — an asset, a habit, and a truth about Yahweh — for someone in the next generation, and takes one step toward it this week.',
      discussionPrompts: [
        'What do you want to still be true for your family a generation after you’re gone?',
        'Is your relationship with money more like a river (flowing) or a pile (sitting)? What would move it toward a river?',
        'Beyond money, what part of "the Way" do you most want to hand down — and to whom?',
        'Where has Yahweh already been faithful to you with provision, and how could telling that story bless the next generation?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 8 — Give Yahweh the Glory (He Will Not Share It) — the capstone that
  // governs the whole series (Darrell 2026-07-06): every increase is His gift, and
  // the glory is His, which He wills not to share — rightfully so.
  {
    id: 'sw8-give-yahweh-the-glory',
    title: 'Give Yahweh the Glory (He Will Not Share It)',
    bigIdea: 'Here is the deciding question the whole series was walking toward: when the increase comes, WHO gets the glory? Yahweh warns about the exact moment of success — "lest thou say in thine heart, My power and the might of mine hand hath gotten me this wealth." The correction is not "don’t be blessed"; it is "remember Whose hand it was" — it is HE that gives you the power to get wealth. And this is not God being needy; it is God being truthful: He is the Source, and He says plainly, "my glory will I not give to another." He will not share it — and rightfully so, because everything you have, you received. So the crown of stewardship is to give Him the glory, out loud, on purpose.',
    inApp: 'Name one specific increase or provision in your life — then say out loud Whose hand it really was: "Yahweh gave me the power to get this; the glory is His, not mine." Tell the story to one person this week in a way that points to Him, not to you. Say it: "Not unto me — unto Your name give glory."',
    anchor: {
      ref: 'Deuteronomy 8:17-18; Isaiah 42:8',
      theme: 'Beware saying "my own hand got me this wealth" — it is Yahweh who gives the power to get it; and He says, "my glory will I not give to another." Give Him the glory; He will not share it.',
    },
    benefits: [
      'Freedom from the crushing weight of self-made pride — you did not build it alone, and you were never meant to carry the credit.',
      'A guardrail on success itself — the danger the Word names is not failure but the forgetting that comes AFTER the increase.',
      'Right-sized truth: everything you have, you received (1 Corinthians 4:7) — so gratitude replaces boasting.',
      'A testimony that blesses others — glory given to Yahweh turns your provision into someone else’s faith.',
      'The crown of the whole series — stewardship completed by returning the glory to the One who gave the power.',
    ],
    levels: {
      child: 'When God blesses you — with money, or a good thing you worked hard for — there’s a very important question: who do you say made it happen? God told His people something to watch out for. He said: don’t say in your heart, "MY power and MY own hand got me all this!" (Deuteronomy 8:17). Because that’s not the whole truth. God said, "it is he that giveth thee power to get wealth" (Deuteronomy 8:18) — HE is the One who gives you the strength and the smarts and the chances! And God said something amazing about His glory (that means the honor and the "well done" for something great): "my glory will I not give to another" (Isaiah 42:8). God will NOT share His glory — and that’s okay and right, because He’s the One who really did it! So when good things come, the best thing you can do is point up and say, "Thank You, God — YOU did this!" That’s giving God the glory. And it makes your heart happy instead of proud.',
      teen: 'This is the capstone of the whole series, and it’s the thing that decides whether all the rest goes right or goes wrong: when you get the increase — the money, the win, the thing you grinded for — who gets the credit? God pinpoints the exact danger moment, and it’s not failure. It’s success. He warns: "beware... lest... thou say in thine heart, My power and the might of mine hand hath gotten me this wealth" (Deuteronomy 8:17). Right after the blessing, pride whispers "I did this myself." And God corrects it flat: "thou shalt remember the LORD thy God: for it is he that giveth thee power to get wealth" (Deuteronomy 8:18). Not just the wealth — the POWER to get it: your mind, your health, your chances, your breath. All received. Paul nails it: "what hast thou that thou didst not receive?" (1 Corinthians 4:7). And here’s the part people trip on: God says, "my glory will I not give to another" (Isaiah 42:8). That’s not God being insecure — it’s God being honest. He’s the Source, so the glory is His by right, and He won’t let it get misfiled onto anyone else. So the highest, most freeing move of a steward is to give it back on purpose: "Not unto us, O LORD, not unto us, but unto thy name give glory" (Psalm 115:1). Say it out loud. Tell your story so it points at Him. That’s not losing credit — it’s trading a heavy crown you were never built to wear for a light and grateful heart.',
      senior: 'The seasoned steward knows that the sharpest spiritual danger is rarely poverty — it is prosperity, and the forgetting that so easily follows it. Moses names the very hour of peril with precision, and it is the hour of success: "lest when thou hast eaten and art full, and hast built goodly houses, and dwelt therein... then thine heart be lifted up, and thou forget the LORD thy God... and thou say in thine heart, My power and the might of mine hand hath gotten me this wealth" (Deuteronomy 8, culminating v.17). The remedy is not asceticism or false modesty; it is remembrance and attribution: "But thou shalt remember the LORD thy God: for it is he that giveth thee power to get wealth, that he may establish his covenant" (Deuteronomy 8:18). Observe what is credited to God — not merely the wealth, but the POWER to get it: the faculties, the health, the opportunities, the very breath by which one labors. Paul reduces all boasting to ash with a single question: "what hast thou that thou didst not receive? now if thou didst receive it, why dost thou glory, as if thou hadst not received it?" (1 Corinthians 4:7). And the Lord Himself sets the boundary that governs this entire series, twice, emphatically: "I am the LORD: that is my name: and my glory will I not give to another" (Isaiah 42:8); "for how should my name be polluted? and I will not give my glory unto another" (Isaiah 48:11). This is not divine insecurity — it is divine veracity: since "of him, and through him, and to him, are all things" (Romans 11:36), to route the glory anywhere else is simply false, and God will not underwrite a lie, not even a flattering one about His servant. The mature response is the deliberate, spoken return of glory: "Not unto us, O LORD, not unto us, but unto thy name give glory, for thy mercy, and for thy truth’s sake" (Psalm 115:1). For a life that has been carried a long way — often from a wilderness the maps forgot — this is both the truest confession and the sweetest rest: you did not do it alone, you were never meant to, and the honor belongs, wholly and rightly, to the One who gave the power. Give Him the glory; He will not share it — and rightfully so.',
    },
    quiz: {
      questions: [
        {
          q: 'According to Deuteronomy 8:17-18, what is the SPECIFIC danger to guard against?',
          options: [
            'Being poor and having nothing',
            'After the increase, saying in your heart "my own power and hand got me this" — forgetting it is Yahweh who gives the power to get wealth',
            'Working too hard',
          ],
          answer: 1,
          explain: 'The danger the Word names is not failure but the pride that follows success: "beware... lest thou say... My power... hath gotten me this wealth." The remedy is to remember Whose hand it was (8:18).',
        },
        {
          q: 'What exactly does God say He gives — beyond the wealth itself?',
          options: [
            'Nothing beyond the money',
            'The POWER to get wealth — the mind, health, chances, breath by which you labor',
            'Only good luck',
          ],
          answer: 1,
          explain: '"It is he that giveth thee power to get wealth" (Deuteronomy 8:18). Even your capacity to work and earn is received — so "what hast thou that thou didst not receive?" (1 Corinthians 4:7).',
        },
        {
          q: 'Why does Yahweh say "my glory will I not give to another" (Isaiah 42:8)?',
          options: [
            'Because God is insecure and needs praise',
            'Because it is TRUE — He is the Source, so the glory is rightly His; routing it elsewhere would be a lie He will not underwrite',
            'Because glory doesn’t matter',
          ],
          answer: 1,
          explain: 'Not insecurity but veracity: "of him, and through him, and to him, are all things" (Romans 11:36). He will not let His glory be misfiled onto another — rightfully so.',
        },
        {
          q: 'What is the mature steward’s response to being blessed?',
          options: [
            'Take quiet pride in what you built',
            'Deliberately, out loud, give Yahweh the glory: "Not unto us, O LORD... but unto thy name give glory" (Psalm 115:1)',
            'Say nothing and move on',
          ],
          answer: 1,
          explain: 'The crown of stewardship is the spoken return of glory to God — trading a heavy self-made crown for a grateful heart, and turning your provision into someone else’s faith.',
        },
      ],
    },
    lesson: 'Every lesson in this series has been walking toward one deciding question, and here it is: when the increase finally comes — the paid-off house, the producing asset, the inheritance taking shape — WHO gets the glory for it? Scripture treats this not as a footnote but as the very hinge on which a blessed life turns right or wrong, and it locates the danger with startling precision. The danger is not poverty. It is prosperity, and the forgetting that so easily rides in behind it. Moses warns the people on the edge of abundance: beware, "lest when thou hast eaten and art full, and hast built goodly houses, and dwelt therein... then thine heart be lifted up, and thou forget the LORD thy God," until at last "thou say in thine heart, My power and the might of mine hand hath gotten me this wealth" (Deuteronomy 8:17). Read that inner sentence, because it is the most natural thing in the world to say after a season of hard, successful work: my power, my hand, my hustle got me this. And God corrects it immediately and flatly — not by shaming the blessing, but by relocating the credit: "But thou shalt remember the LORD thy God: for it is he that giveth thee power to get wealth, that he may establish his covenant" (Deuteronomy 8:18). Notice carefully WHAT is credited to Him. Not merely the wealth — the POWER to get the wealth. Your mind that saw the opportunity, your health that let you work it, the doors that opened at the right hour, the very breath in your lungs while you labored: all of it received, none of it self-generated. Paul takes every boast we could muster and reduces it to ash with one question: "what hast thou that thou didst not receive? now if thou didst receive it, why dost thou glory, as if thou hadst not received it?" (1 Corinthians 4:7). If it was all a gift, there is simply nothing left to brag about. And now the part people stumble over, the part that sounds severe until you understand it. God says of His glory — twice, emphatically — "I am the LORD: that is my name: and my glory will I not give to another, neither my praise to graven images" (Isaiah 42:8), and again, "for how should my name be polluted? and I will not give my glory unto another" (Isaiah 48:11). He will not share it. At first that can sound like insecurity, as if God needed our applause. It is the opposite: it is pure truthfulness. Because "of him, and through him, and to him, are all things: to whom be glory for ever" (Romans 11:36), to route the glory to anyone or anything else — even to a flattering story about how impressive His servant is — would be a lie, and God will not underwrite a lie, not even a kind one about you. His glory belongs to Him by simple fact, the way the sun owns its own light. He wills not to share it, and He is rightfully so, because He alone is the Source. So what does the mature steward DO with all this? Not shrink, not perform false modesty, not refuse the blessing. The response is the deliberate, spoken RETURN of glory to the One it belongs to: "Not unto us, O LORD, not unto us, but unto thy name give glory, for thy mercy, and for thy truth’s sake" (Psalm 115:1). You say it out loud. You tell the story of your provision in a way that points up, not in. And here is the mercy hidden inside the command: giving God the glory is not losing your credit — it is laying down a crown you were never built to wear. Self-made pride is a heavy, anxious thing; it has to keep defending itself, because deep down it knows it is not the whole truth. Handing the glory back to Yahweh is rest. It is the confession that you did not do it alone, that you were carried — often from a wilderness the maps forgot — and that the honor belongs, wholly and rightly, to the God who gave the power. This is the capstone of everything this series taught: own what produces, store, flee the debt-trap, buy the asset, pay it off, draw from it without destroying it, leave it to your children’s children — and then, over all of it, give Yahweh the glory. He will not share it. Rightfully so. And when you give it to Him gladly, your provision stops being a monument to you and becomes a testimony to Him — which is the only kind of wealth that was ever really worth building.',
    facilitator: {
      talkingPoints: [
        'The deciding question of the whole series: when the increase comes, WHO gets the glory? Scripture makes this the hinge, not a footnote.',
        'The danger is prosperity, not poverty: Deuteronomy 8:17 — "lest thou say... My power and the might of mine hand hath gotten me this wealth." Pride rides in behind success.',
        'The correction relocates the credit: Deuteronomy 8:18 — "it is he that giveth thee power to get wealth." Not just the wealth — the POWER to get it (mind, health, chances, breath). "What hast thou that thou didst not receive?" (1 Corinthians 4:7).',
        'He will not share His glory — and that is veracity, not insecurity: Isaiah 42:8 and 48:11; "of him, and through him, and to him, are all things" (Romans 11:36). Misfiling the glory would be a lie God won’t underwrite.',
        'The mature response is the spoken return of glory: Psalm 115:1 — "Not unto us... but unto thy name give glory." It trades a heavy self-made crown for rest, and turns provision into testimony.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Deuteronomy 8:17-18 and Isaiah 42:8 aloud — ask, "when are we most tempted to forget Whose hand it was?" | The big idea, in your own words (8): the danger is success, not failure; the whisper "I did this myself" and God’s flat correction. | Go deeper — the Word on money (10): the POWER to get wealth is the gift (8:18); 1 Corinthians 4:7 reduces boasting to ash; why "my glory will I not give to another" is truth, not insecurity (Romans 11:36); the spoken return of glory (Psalm 115:1). | Reflect together (8): use the prompts; invite real testimony of Yahweh’s faithfulness that gives HIM the glory. | Take it with you (3): each person names one specific increase and gives Yahweh the glory for it out loud, then tells that story to one person this week pointing to Him.',
      discussionPrompts: [
        'When you succeed, what does the whisper "my own hand did this" sound like in you — and how do you answer it?',
        'What is one thing you have that you had been quietly taking credit for, that you actually RECEIVED?',
        'Why is it TRUE, not insecure, that Yahweh will not share His glory?',
        'Tell a real story of provision in a way that gives Yahweh the glory — how does telling it that way change it?',
        'What heavy "crown" of self-made pride could you lay down this week by giving Him the glory out loud?',
      ],
    },
  },
];

export const WEALTH_LESSONS_INTEREST_TAG = '[Stewardship & Wealth interest]';
export const WEALTH_LESSONS_HELPER_TAG = '[Stewardship & Wealth helper]';

export function resolveWealthLessonsCohort(localCohort = null) {
  return resolveCohortGeneric(localCohort, WEALTH_LESSONS_CONFIRMED_COHORT, WEALTH_LESSONS_PROPOSED_COHORT_START);
}

// Self-paced: one row per lesson with its lesson number, but NO computed date.
export function buildWealthLessonsSchedule() {
  return WEALTH_LESSONS_MODULES.map((m, i) => ({ ...m, week: i + 1, date: null, weekday: null }));
}

export function wealthLessonsProgressSummary(progress = {}) {
  return progressSummaryFor(WEALTH_LESSONS_MODULES, progress);
}

export function exportWealthLessonsCurriculumMarkdown() {
  return exportCurriculumMarkdownFor(
    { meta: WEALTH_LESSONS_META, sessionFlow: WEALTH_LESSONS_SESSION_FLOW, modules: WEALTH_LESSONS_MODULES },
    null,
  );
}

// Tutor course-meta — the per-lesson solo guide introduces itself as a Word-first,
// grace-centered stewardship companion: age-aware, never improvising theology, and
// always clear that this is teaching, not personalized financial/tax/legal advice.
export const WEALTH_LESSONS_TUTOR_META = {
  title: WEALTH_LESSONS_META.title,
  intro: 'You are a warm, grace-centered guide for a Word-first, non-denominational lesson series on biblical stewardship and wealth called "Stewardship & Wealth: The Way Up."',
  posture: 'Guide ONE learner — who may be a child, a teen, an adult, or a seasoned steward — through the lesson, matching your words and pace to their age. The series builds in order: (1) own what PRODUCES (the fruit tree, Genesis 1:11), (2) STORE a portion, don’t devour it (Proverbs 21:20), (3) the borrower is servant to the lender — flee the debt-TRAP (Proverbs 22:7), (4) buy the ASSET, not the spectacle (Darrell and Christina chose a rental house over a destination honeymoon; Proverbs 24:27), (5) PAY IT OFF — then live off the rest (2 Kings 4:7), (6) the REFINANCE keystone — pull cash by borrowing against an asset you own (up to ~80% of appraised value) instead of selling it; a loan is borrowed money, not income, so it is not taxed as income, and the rent services the loan — you keep the tree AND get cash, (7) leave an INHERITANCE to your children’s children (Proverbs 13:22), and (8) the capstone over all of it — GIVE YAHWEH THE GLORY, which He will not share: it is He that gives the power to get wealth (Deuteronomy 8:17-18), and "my glory will I not give to another" (Isaiah 42:8) — not divine insecurity but divine truth, for everything we have we received (1 Corinthians 4:7). Be relentlessly WELL-BEING-POSITIVE: money is a tool and a trust, never a master (1 Timothy 6:10; Matthew 6:24); never preach greed and never shame the poor. State plain established facts plainly (DR-0100) — e.g. loan proceeds are not income and so are not taxed as income — but ALWAYS make clear this is TEACHING, not personalized financial, tax, or legal advice: real decisions need the learner’s own numbers and a trusted advisor, and you must be able to make the payment (over-leverage is its own snare). Cite Scripture by reference (KJV, as in the lessons); never invent or paraphrase a verse as if quoting it, and if unsure of a text, say so rather than fabricate. Give Yahweh the glory — He gives the power to get wealth (Deuteronomy 8:18).',
};
