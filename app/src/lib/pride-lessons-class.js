// =============================================================================
// pride-lessons-class — "Pride Before the Fall: The Increase Is the Lord's"
// =============================================================================
// A Word-first, SELF-PACED lesson SERIES on pride, humility, gratitude, and the
// truth that the increase and the victory are Yahweh's — riding the SAME shared
// Learn engine as the other PoeTech / COLG courses (the generics in
// church-classes.js, the self-driving tutor in class-tutor.js, and the multi-modal
// + AGE-ADAPTIVE + quiz + graduate->helper scaffolding in learn-framework.js). Like
// the Stewardship and Living Lessons series it sets `meta.unit` so the engine
// renders its rows as "Lessons," self-paced, no cohort clock — and it AUTO-joins
// the Learn hub and wires to the Presenter via coursePresentable.
//
// FROM DARRELL'S OWN WORDS (2026-07-06, spoken build input): "Don't be proud of
// yourself; be grateful for Yahweh — He makes us win. I could have worked for a
// thousand years with no increase; that comes from the Lord." This series is that
// teaching, built out and grounded verse by verse. The companion truth to the
// Stewardship capstone (Give Yahweh the Glory): there we returned the glory; here
// we pull up the root under it — pride — and put gratitude in its place.
//
// THE GAMES ARE LESSONS TOO (Darrell 2026-07-06): the same teaching is playable in
// the optional Generations game (the "Pride & the Increase" cards in
// lib/games/generations.js), so a player LEARNS it by walking it — a decision that
// ripples to the next generation. One teaching, surfaced where the family is.
//
// The building arc (each lesson brain-sized per age band, standing on the last):
//   1. Pride Goes Before the Fall   — the warning itself (Proverbs 16:18).
//   2. The Increase Is the Lord's   — you could labor a thousand years; God gives
//                                     the increase (1 Corinthians 3:6-7).
//   3. Except the Lord Build the    — without Him the labor is vain; without Him
//      House                          we can do nothing (Psalm 127; John 15:5).
//   4. Be Grateful, Not Proud       — gratitude uproots pride; glory only in
//                                     knowing Him (1 Corinthians 4:7; Jeremiah 9).
//   5. He Makes Us Win              — the victory is His gift, not our arm
//                                     (1 Corinthians 15:57; Psalm 44:3).
//   6. Humble Yourself, and He Lifts— humble first or be humbled; He raises the
//      You                            lowly (James 4:10; 1 Peter 5:6; Daniel 4).
//
// VERIFICATION / NO-FABRICATION (DR-0076): every quoted verse is KJV, sourced
// VERBATIM from the in-repo public-domain KJV (app/public/bible/kjv/*.json), never
// typed from memory; anchors cite a reference + theme gloss. WELL-BEING-POSITIVE:
// the series FREES from the exhausting weight of self-made pride and lifts the
// weary into gratitude and rest — it never shames, and it gives Yahweh the glory.
// =============================================================================

import {
  progressSummaryFor, exportCurriculumMarkdownFor, resolveCohortGeneric,
} from './church-classes.js';

export const PRIDE_LESSONS_PROPOSED_COHORT_START = null;
export const PRIDE_LESSONS_CONFIRMED_COHORT = { startDate: null, confirmed: false };

export const PRIDE_LESSONS_META = {
  key: 'pride-lessons',
  title: 'Pride Before the Fall: The Increase Is the Lord’s',
  audience: 'the whole family and the whole Body — every age',
  tagline: 'Don’t be proud of yourself. Be grateful — He makes us win.',
  format: 'Self-paced · read it alone, as a family, or in a group · paced to your age',
  cadenceDays: 7,
  weeks: 6,
  handsOnLabel: 'Take it with you',
  unit: {
    noun: 'lesson',
    nounPlural: 'lessons',
    cap: 'Lesson',
    selfPaced: true,
    sessionLabel: 'How to lead it (family or small group)',
    countNoun: 'lesson',
  },
  footer: '_Taught by Darrell Poe · The Church of the Living God + the Poe family · built on PoeTech. Word-first and non-denominational — Scripture is senior to any tradition. Grace-centered, for every age. Don’t be proud of yourself; be grateful for Yahweh — He makes us win, and the increase is His._',
};

export const PRIDE_LESSONS_SESSION_FLOW = [
  { minutes: 3, name: 'Open in prayer + read the Scripture' },
  { minutes: 8, name: 'The big idea, in your own words' },
  { minutes: 10, name: 'Go deeper — the Word on pride & increase' },
  { minutes: 8, name: 'Reflect together' },
  { minutes: 3, name: 'Take it with you' },
];
export const PRIDE_LESSONS_SESSION_MINUTES = PRIDE_LESSONS_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0);

export const PRIDE_LESSONS_MODULES = [
  // ---------------------------------------------------------------------------
  // LESSON 1 — Pride Goes Before the Fall
  {
    id: 'pf1-pride-goes-before-the-fall',
    title: 'Pride Goes Before the Fall',
    bigIdea: 'Scripture gives one of its plainest warnings about pride: "Pride goeth before destruction, and an haughty spirit before a fall." Pride is not confidence and it is not joy in good work — it is the heart quietly taking for itself the credit that belongs to Yahweh, lifting itself above others and above God. And it is dangerous precisely because it feels like strength right up until the fall. The Word’s pattern is exact: before destruction, a haughty heart; before honour, humility. Learn to spot pride early, while it is still small — because it always goes before the fall.',
    inApp: 'Ask honestly: where is pride whispering to you right now — "I did this," "I’m better than them," "I don’t need help"? Name it out loud and hand it up: "Yahweh, I don’t want a haughty heart. Keep me low, keep me grateful." Catch it once this week before it grows.',
    anchor: {
      ref: 'Proverbs 16:18; Proverbs 18:12',
      theme: 'Pride goes before destruction; a haughty spirit before a fall — and before honour comes humility. Pride feels like strength right until the fall; spot it early.',
    },
    benefits: [
      'An early-warning system for your own heart — you learn to catch pride while it is still small.',
      'Freedom from a fall you can’t see coming — the Word names the pattern so you’re not blindsided by it.',
      'Clarity on what pride actually is (taking Yahweh’s credit and lifting self), so you stop confusing it with healthy confidence.',
      'The doorway to real honour — "before honour is humility"; the low road is the road up.',
      'Protection for everyone around you — a humble heart doesn’t trample the people a proud one steps on.',
    ],
    levels: {
      child: 'The Bible gives us a warning we should never forget: "Pride goeth before destruction, and an haughty spirit before a fall" (Proverbs 16:18). "Pride" here means thinking you’re better than everybody else, or thinking YOU did something all by yourself when really God helped you. "A fall" means tripping and getting hurt. So the Bible is saying: when someone gets all puffed-up and proud, a fall is usually coming next — like a kid strutting around showing off right before they trip! God is not trying to scare you; He’s warning you because He loves you. The good news is the opposite is true too: "before honour is humility" (Proverbs 18:12). Humility means being humble — knowing you need God and other people. So stay humble and grateful, and instead of a fall, honour comes!',
      teen: 'Here’s one of the most quoted warnings in the whole Bible, and it’s quoted a lot because it keeps coming true: "Pride goeth before destruction, and an haughty spirit before a fall" (Proverbs 16:18). Real quick — pride isn’t the same as confidence, and it isn’t being happy about something you did well. Pride is the heart taking credit that belongs to God, and lifting itself above other people. And the reason it’s so dangerous is that it feels like strength — right up until the fall. You’ve seen it: the person on top who stops listening, stops thanking anybody, starts believing their own hype... and then it all comes down. Scripture nails the exact order twice: "Before destruction the heart of man is haughty, and before honour is humility" (Proverbs 18:12), and "A man’s pride shall bring him low: but honour shall uphold the humble in spirit" (Proverbs 29:23). So the move is to spot pride EARLY, while it’s still just a whisper — "I did this," "I’m better than them," "I don’t need anybody" — and trade it for gratitude before it grows. Humility isn’t weakness; it’s the actual road UP. Before honour comes humility, every time.',
      senior: 'The seasoned believer has watched this proverb vindicated across a lifetime of rises and falls, in others and, if honest, in self: "Pride goeth before destruction, and an haughty spirit before a fall" (Proverbs 16:18). It is worth defining pride precisely, because the flesh disguises it as virtue. Biblical pride is not the satisfaction of honest work well done, nor godly confidence; it is the heart’s appropriation of glory that belongs to God, and the exalting of self over others and over Him. Its peril lies in its counterfeit strength — it feels like ascendancy at the very moment it has become descent. Scripture states the sequence with almost clinical precision: "Before destruction the heart of man is haughty, and before honour is humility" (Proverbs 18:12); "When pride cometh, then cometh shame: but with the lowly is wisdom" (Proverbs 11:2); "A man’s pride shall bring him low: but honour shall uphold the humble in spirit" (Proverbs 29:23). Note that in each the outcomes are inverted from the world’s expectation: the haughty heart is already on the road to a fall while it still feels triumphant, and the lowly spirit is already on the road to honour while it still feels small. This is not moralism; it is realism — the very structure God built into the moral universe. The pastoral counsel of a long life is to watch the FIRST movements of pride, the small internal sentences ("I earned this," "I am beyond correction," "I no longer need counsel"), and to answer them early with gratitude and dependence, before they harden into the haughtiness that always precedes the fall. Before honour, humility; there is no other order.',
    },
    quiz: {
      questions: [
        {
          q: 'What does Proverbs 16:18 warn goes before a fall?',
          options: [
            'Hard work and confidence',
            'Pride / a haughty spirit — "Pride goeth before destruction, and an haughty spirit before a fall"',
            'Poverty',
          ],
          answer: 1,
          explain: 'Pride goes before the fall. Its danger is that it feels like strength right up until the collapse.',
        },
        {
          q: 'What IS biblical pride, as this lesson defines it?',
          options: [
            'Any confidence or joy in good work',
            'The heart taking credit that belongs to God, and lifting self above others and Him',
            'Simply having money',
          ],
          answer: 1,
          explain: 'Pride isn’t healthy confidence; it’s appropriating God’s glory and exalting self. That distinction keeps you from mislabeling honest gladness as sin.',
        },
        {
          q: 'What comes before HONOUR, according to Proverbs 18:12?',
          options: [
            'More pride',
            'Humility — "before honour is humility"',
            'Nothing in particular',
          ],
          answer: 1,
          explain: 'The order is inverted from the world’s: humility is the road up. The lowly spirit is already headed toward honour while it still feels small.',
        },
      ],
    },
    lesson: 'It is one of the most quoted lines in all of Scripture, and it is quoted so often because it keeps proving true: "Pride goeth before destruction, and an haughty spirit before a fall" (Proverbs 16:18). Before we go a step further, we have to define pride carefully, because the flesh loves to disguise it as a virtue. Biblical pride is not confidence, and it is not the honest satisfaction of good work done well — those are gifts. Pride is something quieter and more dangerous: it is the heart taking for itself the credit that belongs to Yahweh, and lifting itself up above other people and above God. And the reason it is so lethal is that it does not feel like weakness or sin — it feels like strength, like ascendancy, like finally arriving, right up until the moment of the fall. You have watched it happen: the person who reaches the top, stops listening, stops thanking anyone, starts believing their own press, becomes uncorrectable — and then it all comes down, and everyone but them saw it coming. Scripture describes the sequence with almost clinical precision, and more than once. "Before destruction the heart of man is haughty, and before honour is humility" (Proverbs 18:12). "When pride cometh, then cometh shame: but with the lowly is wisdom" (Proverbs 11:2). "A man’s pride shall bring him low: but honour shall uphold the humble in spirit" (Proverbs 29:23). Notice the pattern in every one of them: the outcomes are flipped from what the world expects. The haughty heart is already on the road to a fall at the very moment it feels most triumphant; the lowly spirit is already on the road to honour at the very moment it feels smallest. This is not God being harsh or moralistic — it is God telling you the actual structure of the moral universe He built, so you are not blindsided by it. So the whole practical work of this first lesson is simply this: learn to spot pride EARLY, while it is still just a whisper and not yet a lifestyle. The first movements are small internal sentences — "I did this myself," "I’m better than them," "I don’t need help," "I’m beyond correction now." Catch those sentences. Answer them, the moment you hear them, with gratitude and dependence on Yahweh, before they harden into the haughtiness that always, always precedes the fall. The rest of this series is how you do that — because the antidote to pride is not self-hatred; it is the truth that the increase, and the victory, were His all along. And remember the promise buried in the warning: before honour comes humility. The low road is the road up. There is no other order.',
    facilitator: {
      talkingPoints: [
        'The plain warning: "Pride goeth before destruction, and an haughty spirit before a fall" (Proverbs 16:18). It keeps getting quoted because it keeps coming true.',
        'Define pride precisely (so it isn’t confused with healthy confidence): the heart taking God’s credit and lifting self above others and Him.',
        'Its danger is counterfeit strength — it feels like ascendancy at the exact moment it has become descent.',
        'The inverted order, stated repeatedly: "before honour is humility" (18:12); "when pride cometh, then cometh shame" (11:2); "a man’s pride shall bring him low, but honour shall uphold the humble" (29:23).',
        'The practical work: spot pride EARLY, in the small internal sentences ("I did this," "I’m beyond correction"), and answer with gratitude + dependence before it hardens.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Proverbs 16:18 and 18:12 aloud — ask, "have you ever seen pride go right before a fall?" | The big idea, in your own words (8): define pride carefully (not confidence — taking God’s credit + lifting self); why it feels like strength until the fall. | Go deeper — the Word on pride & increase (10): the inverted order in 11:2, 18:12, 29:23; the low road is the road up. | Reflect together (8): use the prompts; keep it self-examining, not finger-pointing. | Take it with you (3): each person names one early "pride sentence" they’ll catch this week and trade for gratitude.',
      discussionPrompts: [
        'Where have you seen pride go right before a fall — in the world, or in your own story?',
        'What’s the difference between healthy confidence and the pride the Bible warns about?',
        'What small "pride sentence" do you catch yourself thinking, and what would gratitude say instead?',
        '"Before honour is humility." Where do you need to take the low road that’s actually the road up?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 2 — The Increase Is the Lord's (Darrell's "thousand years" teaching)
  {
    id: 'pf2-the-increase-is-the-lords',
    title: 'The Increase Is the Lord’s',
    bigIdea: 'Here is the truth that pulls the root out from under pride: you can plant and you can water, but only God gives the increase. "I have planted, Apollos watered; but God gave the increase." You could labor with everything in you for a thousand years and see no increase at all — because increase was never yours to manufacture. It is a gift Yahweh gives. Your work is real and it matters; but the moment the seed grows, that was Him. This is not discouraging — it is freeing. It takes the impossible weight of "make it grow" off your back, and it takes the credit off your head and puts it where it belongs.',
    inApp: 'Think of one thing that "grew" in your life — a job, a skill, a family, a healing. You planted or watered; name the moment the increase came, and say the truth: "I could have worked a thousand years and not made that grow — Yahweh gave the increase." Thank Him for one specific increase today.',
    anchor: {
      ref: '1 Corinthians 3:6-7; Deuteronomy 8:18',
      theme: 'One plants, another waters, but God gives the increase; and it is He who gives the very power to get wealth. You could labor a thousand years — the growth is always His gift.',
    },
    benefits: [
      'The weight of "make it grow" lifted off you — your job is to plant and water faithfully; the increase is His to give.',
      'The root pulled out from under pride — if the growth was His gift, there is simply nothing to boast about.',
      'Freedom from despair when effort seems fruitless — increase runs on His timing, not the size of your striving.',
      'Right-sized labor: your work is real and honored, AND it is never the thing that makes the seed grow.',
      'Gratitude that comes easy, because you can finally see Whose hand the harvest was.',
    ],
    levels: {
      child: 'Think about a farmer. He digs the dirt, plants the seed, and pours the water — he works really hard! But can the farmer MAKE the seed grow? No! He can’t reach inside the seed and turn it into a plant. Only God makes things grow. The Bible says it just like that: "I have planted, Apollos watered; but God gave the increase" (1 Corinthians 3:6). "Increase" means the growing part — the seed turning into a big plant with fruit. So the farmer does his part (planting and watering), but GOD does the growing part. That means when good things grow in your life, you can work hard AND still say thank you to God, because HE made it grow. You could water a seed for a hundred years, but only God can make it come up. So do your part, and thank God for the growing!',
      teen: 'This is the verse that quietly ends pride, if you really get it: "I have planted, Apollos watered; but God gave the increase" (1 Corinthians 3:6). Then Paul drives it all the way home: "So then neither is he that planteth any thing, neither he that watereth; but God that giveth the increase" (3:7). Read that carefully. Your work is real — you plant, you water, you grind, and that matters. But you cannot MANUFACTURE increase. You can’t reach into a seed and make it grow; you can’t force a business to take off, a skill to click, a relationship to heal. Here’s how my dad says it: you could work with everything in you for a THOUSAND YEARS and see no increase — because the increase was never yours to make. It’s a gift God gives. And that’s not a downer, it’s a massive relief two ways. One: the impossible pressure of "I have to make this grow" comes off your back — not your job. Two: when it DOES grow, you don’t have to carry the heavy crown of "I did this," because you didn’t make the seed grow; He did. God even says the same thing about money: "it is he that giveth thee power to get wealth" (Deuteronomy 8:18) — not just the wealth, the power to get it. So plant hard, water faithfully, and give God the increase. He’s the One who grows things.',
      senior: 'For the seasoned saint this is among the most quietly liberating truths in Scripture, and it is the specific antidote to the pride of the previous lesson. Paul, addressing a church tempted to exalt its favorite ministers, writes: "I have planted, Apollos watered; but God gave the increase. So then neither is he that planteth any thing, neither he that watereth; but God that giveth the increase" (1 Corinthians 3:6-7). The logic is exact and it dismantles all boasting. Human labor is genuinely necessary — planting and watering are real, commanded, honored work, and God ordinarily uses them. But the INCREASE — the mysterious moment a seed becomes a plant, a word becomes faith, effort becomes a harvest — is categorically beyond human power. No farmer has ever reached into a seed and manufactured its growth; no laborer has ever produced increase by the sheer mass of his striving. As Darrell frames it with force: one could labor with total devotion for a thousand years and see no increase, because increase was never ours to make — it is Yahweh’s gift, given in His time. This truth cuts two ways, both merciful. It lifts the crushing burden of self-sufficiency: you are not the guarantor of the harvest, and you were never meant to be (recall Psalm 127:2, "for so he giveth his beloved sleep"). And it lifts the intoxicating burden of self-credit: when the increase comes, there is simply nothing to be proud of, because you did not produce it. God says the same over material provision — "it is he that giveth thee power to get wealth, that he may establish his covenant" (Deuteronomy 8:18) — crediting to Himself not merely the wealth but the very capacity to gain it. The mature posture, then, is to labor with all diligence and to hold the outcome with open, grateful hands, knowing the One who gives the increase gives it as He wills, and gets the glory when it comes.',
    },
    quiz: {
      questions: [
        {
          q: 'In 1 Corinthians 3:6-7, who gives the increase (the growth)?',
          options: [
            'The one who plants',
            'God — "neither is he that planteth any thing, neither he that watereth; but God that giveth the increase"',
            'Whoever works the hardest',
          ],
          answer: 1,
          explain: 'Planting and watering are real, needed work — but only God gives the increase. The growth was never ours to manufacture.',
        },
        {
          q: 'What is the "thousand years" point of this lesson?',
          options: [
            'Hard work is pointless',
            'You could labor a thousand years and see no increase — because increase is God’s gift, not something effort forces',
            'You should work for a thousand years',
          ],
          answer: 1,
          explain: 'Your labor is real and honored, but it is never the thing that makes the seed grow. Increase comes from the Lord, in His time.',
        },
        {
          q: 'How does this truth cut pride at the root?',
          options: [
            'It doesn’t',
            'If the growth was God’s gift, there is nothing to boast about — and no crushing pressure to "make it grow" either',
            'By telling you to stop working',
          ],
          answer: 1,
          explain: 'It’s freeing two ways: the weight of guaranteeing the harvest comes off you, and the credit comes off you too. Plant and water; God gives the increase.',
        },
      ],
    },
    lesson: 'If Lesson 1 named the disease, this lesson hands you the cure, and it is one short verse: "I have planted, Apollos watered; but God gave the increase" (1 Corinthians 3:6). Paul is writing to a church that had started exalting its favorite preachers — team Paul, team Apollos — and he stops it cold with a farming picture everyone understands. Think about a farmer: he breaks the ground, plants the seed, pours the water. That is real work, hard work, necessary work. But can the farmer, by any amount of effort, reach inside the seed and MAKE it grow? He cannot. The growing itself — the increase — is completely beyond him. So Paul draws the conclusion all the way out: "So then neither is he that planteth any thing, neither he that watereth; but God that giveth the increase" (1 Corinthians 3:7). Now sit with what that means for pride. Your labor is real; God honors it and ordinarily uses it. You plant, you water, you show up, you grind — all of that matters. But you cannot manufacture increase. You cannot force a business to take off, a skill to finally click, a wound to heal, a child’s heart to turn, a ministry to bear fruit. The moment any of those actually GROWS — that was Yahweh, not you. Here is how Darrell says it, and it is worth holding onto: you could work with everything in you for a THOUSAND YEARS and still see no increase — because the increase was never yours to make in the first place. It is a gift God gives, in His own timing. And far from being discouraging, that is a double relief. First, it lifts the impossible weight of self-sufficiency off your back: you are not the guarantor of the harvest, you were never meant to be, and you can finally exhale — "for so he giveth his beloved sleep" (Psalm 127:2). Second, it lifts the intoxicating weight of self-credit off your head: when the increase comes, there is simply nothing left to be proud of, because you did not produce it. God says the very same thing about money and provision: "it is he that giveth thee power to get wealth" (Deuteronomy 8:18) — not merely the wealth, but the power to get it, the mind and strength and opportunity behind every gain. So the posture this lesson leaves you in is beautiful and light: labor with all your diligence, plant and water like it depends on you — and then hold the outcome with open, grateful hands, knowing it depends on Him. He gives the increase. He always did.',
    facilitator: {
      talkingPoints: [
        'The cure for pride is one verse: "I have planted, Apollos watered; but God gave the increase" (1 Corinthians 3:6), and its conclusion, 3:7 — the increase is God’s, not the laborer’s.',
        'The farmer picture: planting and watering are real, necessary work — but no one can reach into a seed and make it grow. Increase is categorically beyond human power.',
        'Darrell’s framing: you could labor a thousand years and see no increase, because increase was never yours to make — it’s Yahweh’s gift, in His timing.',
        'It’s freeing two ways: lifts the burden of guaranteeing the harvest (you’re not the guarantor), and lifts the credit (nothing to boast about when you didn’t make it grow).',
        'Same over provision: "it is he that giveth thee power to get wealth" (Deuteronomy 8:18) — even the capacity to gain is His gift. Labor hard; hold the outcome with open hands.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read 1 Corinthians 3:6-7 aloud — ask, "can a farmer MAKE a seed grow?" | The big idea, in your own words (8): plant/water vs increase; the thousand-years point — increase is God’s gift, not effort’s product. | Go deeper — the Word on pride & increase (10): how this pulls the root out from under pride (nothing to boast); the double relief; Deuteronomy 8:18 over provision. | Reflect together (8): use the prompts; invite stories of an "increase" that was clearly God’s. | Take it with you (3): each person names one increase in their life and thanks Yahweh for it out loud.',
      discussionPrompts: [
        'What is something that "grew" in your life that you know you didn’t make grow?',
        'How does it feel to hear you could labor a thousand years and not make the increase — freeing, or frustrating? Why?',
        'Where are you carrying the weight of "I have to make this grow" that you could hand back to God?',
        'If the increase is always His gift, what changes about how you’ll work AND how you’ll celebrate?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 3 — Except the Lord Build the House
  {
    id: 'pf3-except-the-lord-build-the-house',
    title: 'Except the Lord Build the House',
    bigIdea: 'The Psalm says it flat: "Except the LORD build the house, they labour in vain that build it." Not "God helps a little" — without Him the whole labor is in vain. Jesus says the same about fruit: "without me ye can do nothing." This is the ground under Lesson 2. Peter fished all night — expert, exhausted, empty — and caught nothing until Jesus spoke; then the nets nearly broke. Your effort is not the engine; His word is. So we build and we work with everything we have, but we build WITH Him and lean on Him, because apart from Him even our best all-night labor comes up empty.',
    inApp: 'Name one "house" you’re building right now — a career, a marriage, a ministry, a habit. Before you work on it today, invite Him in out loud: "Lord, unless You build this, I labor in vain — build it with me." Then do your part, leaning on Him instead of only on your own arm.',
    anchor: {
      ref: 'Psalm 127:1; John 15:5',
      theme: 'Unless the Lord builds the house, the builders labor in vain; and apart from Christ we can do nothing. Build WITH Him — your effort is not the engine, His word is.',
    },
    benefits: [
      'Relief from the exhaustion of building alone — you were never meant to be the whole engine.',
      'A simple, powerful habit — inviting Him into the work BEFORE you strain at it.',
      'Freedom from the "all night, caught nothing" despair — His word turns empty nets full.',
      'Protection from vain labor — effort without Him can look busy and still come up empty.',
      'Dependence that dissolves pride — if apart from Him we can do nothing, self-credit makes no sense.',
    ],
    levels: {
      child: 'Imagine building a big sandcastle all by yourself, but every wave keeps knocking it down. The Bible says something like that about building anything without God: "Except the LORD build the house, they labour in vain that build it" (Psalm 127:1). "In vain" means for nothing — all that work and it doesn’t last. Jesus said it another way: "without me ye can do nothing" (John 15:5). Here’s a true story: Jesus’ friend Peter was a fisherman, and he fished ALL night long and caught zero fish — nothing! But when Jesus told him to try again, the net got SO full it almost broke (Luke 5:5). So the fish didn’t come from Peter being strong; they came when he listened to Jesus. That means the best way to build or do anything is WITH God — ask Him to help before you start, and do your part with Him. Then your work isn’t in vain!',
      teen: 'Lesson 2 said God gives the increase; this one shows you the ground under it. Psalm 127:1 doesn’t say God helps a little — it says: "Except the LORD build the house, they labour in vain that build it: except the LORD keep the city, the watchman waketh but in vain." WITHOUT Him, the whole thing is in vain. Jesus put it even more bluntly: "I am the vine, ye are the branches... without me ye can do nothing" (John 15:5). Not "you can do a little" — nothing. And there’s a perfect story for this. Peter was a professional fisherman, and he’d "toiled all the night, and... taken nothing" (Luke 5:5) — expert effort, total exhaustion, empty nets. Then Jesus says try again, and Peter says "nevertheless at thy word I will let down the net" — and the catch nearly sinks the boat. Catch the point: the fish didn’t come from Peter’s skill or all-night grind. They came from Christ’s word. So here’s the shift: keep working hard — but build WITH Him, not just for Him and not just by your own arm. Invite Him into the thing BEFORE you strain at it. Because your effort isn’t the engine; His word is. And that’s why pride makes no sense — if apart from Him you can do nothing, what exactly would you brag about?',
      senior: 'This lesson supplies the theological floor beneath the truth that God gives the increase, and it is stated with uncompromising clarity: "Except the LORD build the house, they labour in vain that build it: except the LORD keep the city, the watchman waketh but in vain" (Psalm 127:1). The Hebrew does not qualify it — apart from the LORD, the building and the watching are simply vain, however skilled or strenuous. The next verse extends it to the anxious over-striver: "It is vain for you to rise up early, to sit up late, to eat the bread of sorrows: for so he giveth his beloved sleep" (Psalm 127:2). Our Lord states the same principle at the deepest level: "I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing" (John 15:5) — apart from vital union with Christ, not "little," but nothing of eternal fruit. The Gospels give us the enacted parable in Peter: a lifelong professional fisherman who had "toiled all the night, and... taken nothing" (Luke 5:5) — the fullest expression of expert, exhausting, self-reliant effort, and it yielded empty nets — until, at Christ’s word, "nevertheless at thy word I will let down the net," the catch nearly broke the nets and sank two boats. The instruction is not to cease laboring; Scripture everywhere commands diligence. It is to relocate the source of efficacy from our arm to His word — to build WITH Him and in dependence upon Him, inviting His hand into the work before we exert ourselves in it. For a life that has built many houses and kept many watches, this is both a humbling and a rest: the humbling that our unaided labor is vain, and the rest that we were never meant to be the engine. And it seals the case against pride begun in Lesson 1 — for if apart from Him we can do nothing, then every good thing accomplished is, at its root, His doing and not ours to boast of.',
    },
    quiz: {
      questions: [
        {
          q: 'What does Psalm 127:1 say about building without the Lord?',
          options: [
            'It goes a little slower',
            'The builders "labour in vain" — without Him the whole effort is for nothing',
            'It’s totally fine on your own',
          ],
          answer: 1,
          explain: 'Not "God helps a bit" — apart from Him the building and the watching are in vain, however skilled or strenuous.',
        },
        {
          q: 'What did Peter learn when he "toiled all the night, and... taken nothing" (Luke 5:5)?',
          options: [
            'That he just needed to try harder alone',
            'That the catch came at Christ’s WORD, not from his own all-night effort or expertise',
            'That fishing is impossible',
          ],
          answer: 1,
          explain: 'Expert, exhausting, self-reliant effort produced empty nets; Christ’s word filled them. Your effort isn’t the engine — His word is.',
        },
        {
          q: 'How does John 15:5 ("without me ye can do nothing") relate to pride?',
          options: [
            'It has nothing to do with pride',
            'If apart from Him we can do nothing, then self-credit makes no sense — every good thing is His doing',
            'It means we should never do anything',
          ],
          answer: 1,
          explain: 'Dependence dissolves pride. We still labor diligently — but we build WITH Him, relocating the source of results from our arm to His word.',
        },
      ],
    },
    lesson: 'Lesson 2 told you God gives the increase; this lesson shows you the solid ground underneath that, and it is a verse that refuses to be softened: "Except the LORD build the house, they labour in vain that build it: except the LORD keep the city, the watchman waketh but in vain" (Psalm 127:1). Read what it does NOT say. It does not say the Lord helps a little, or gives you a boost, or makes it go faster. It says that without Him, the whole labor is in vain — the building and the watching alike, no matter how skilled the builder or how alert the watchman. The very next verse turns and speaks straight to the anxious striver, the one trying to guarantee everything by sheer effort: "It is vain for you to rise up early, to sit up late, to eat the bread of sorrows: for so he giveth his beloved sleep" (Psalm 127:2). And Jesus states the same principle at the deepest possible level, about spiritual fruit: "I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing" (John 15:5). Not "without Me you can do a little" — without Him, nothing that lasts. Then the Gospels hand us the whole truth acted out, in Peter. He was a professional fisherman, and he had "toiled all the night, and... taken nothing" (Luke 5:5). Picture it: the expert, at his own craft, working the full night through, straining with everything he had — and pulling up empty nets, every time. That is self-reliant effort at its absolute fullest, and its yield was zero. Then Jesus, a carpenter, tells the fisherman where to fish, and Peter says the sentence that changes everything: "nevertheless at thy word I will let down the net" — and the catch is so enormous it nearly breaks the nets and sinks two boats. Do not miss the point: the fish did not come from Peter’s skill or his all-night grind. They came from the word of Christ. So here is the shift this lesson asks of you, and it is not "stop working" — Scripture everywhere commands diligence. It is to move the source of the outcome off of your own arm and onto His word: to build WITH Him and in dependence on Him, to invite His hand into the work BEFORE you throw yourself at it, rather than laboring all night in your own strength and hoping it holds. Your effort is real and required — but your effort is not the engine. His word is. And notice how this quietly finishes the case against pride we started in Lesson 1: if apart from Him you can do nothing, then every genuinely good thing you have ever accomplished was, at its root, His doing and not yours to boast about. That is not a demotion. It is a rest. You were never meant to be the engine. Build with Him.',
    facilitator: {
      talkingPoints: [
        '"Except the LORD build the house, they labour in vain that build it" (Psalm 127:1) — not "helps a little"; without Him the whole labor is vain.',
        'John 15:5 at the deepest level: "without me ye can do nothing" — not "little," nothing of lasting fruit.',
        'Peter enacts it: "toiled all the night, and... taken nothing" (Luke 5:5) — full expert effort, empty nets — until "at thy word I will let down the net," and the catch nearly sinks the boats.',
        'The shift is not "stop working" but relocate the source of results from your arm to His word: build WITH Him, invite Him in BEFORE you strain.',
        'Seals the anti-pride case: if apart from Him we can do nothing, self-credit makes no sense — and it’s a rest, not a demotion. You were never the engine.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Psalm 127:1-2 and John 15:5 — ask, "where have you built something alone that fell apart?" | The big idea, in your own words (8): "in vain" without Him; the difference between working FOR Him in your own strength and building WITH Him. | Go deeper — the Word on pride & increase (10): Peter’s all-night empty nets vs the word-of-Christ catch (Luke 5:5); effort isn’t the engine, His word is. | Reflect together (8): use the prompts. | Take it with you (3): each person names one "house" they’re building and invites Him into it out loud before working on it this week.',
      discussionPrompts: [
        'Where have you "toiled all night and taken nothing" — labored hard in your own strength and come up empty?',
        'What’s the difference between working FOR God and building WITH God?',
        'What "house" are you building right now that you need to invite Him into before you strain at it?',
        'If "without Him we can do nothing," how does that change what you brag about — and what you rest in?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 4 — Be Grateful, Not Proud
  {
    id: 'pf4-be-grateful-not-proud',
    title: 'Be Grateful, Not Proud',
    bigIdea: 'Pride and gratitude cannot share a heart — one always crowds the other out. Pride says "look what I did"; gratitude says "look what I was given." And Scripture makes the choice easy once you see it: "what hast thou that thou didst not receive?" If everything you have is a gift, boasting is just forgetting Whose gift it was. So Yahweh redirects our glorying entirely: don’t glory in your wisdom, might, or riches — glory in this, that you know Him. The cure for a proud heart is not to think less of yourself in shame; it is to become so grateful there is no room left for pride.',
    inApp: 'Make a fast gratitude list — three things you were tempted to feel proud about, and next to each, Who gave it (the ability, the chance, the help). Watch pride shrink as the list grows. Then thank Yahweh out loud for one of them and, if you can, thank a person who helped.',
    anchor: {
      ref: '1 Corinthians 4:7; Jeremiah 9:23-24',
      theme: 'What do you have that you did not receive? So don’t glory in wisdom, might, or riches — glory only in knowing Yahweh. Gratitude crowds pride out of the heart.',
    },
    benefits: [
      'A practical cure for pride that isn’t self-hatred — you get grateful instead of getting down on yourself.',
      'Lighter relationships — grateful people thank others; proud people compete with them.',
      'Clear thinking about what’s actually yours: "what hast thou that thou didst not receive?"',
      'A re-aimed glory — you stop glorying in wisdom/might/riches and glory in knowing Yahweh, which never fails.',
      'A more joyful heart — gratitude is simply happier to live in than pride.',
    ],
    levels: {
      child: 'Here’s a secret: you can’t be proud and thankful at the same time — they don’t fit in your heart together! Proud says, "Look what *I* did!" Thankful says, "Look what I was *given*!" The Bible asks a question that helps: "what hast thou that thou didst not receive?" (1 Corinthians 4:7). That means: is there anything you have that somebody didn’t GIVE you? Your strong arms, your smart brain, your family, your food — all gifts from God and people who love you! So if it was all a gift, there’s nothing to brag about — there’s only lots to say THANK YOU for. God even tells us what to be proud of instead: not being smart or strong or rich, but KNOWING Him (Jeremiah 9:23-24). So the best way to beat pride isn’t to feel bad about yourself. It’s to get SO thankful that there’s no room left for being proud. Try it — say three thank-yous right now!',
      teen: 'Try this and you’ll never forget it: pride and gratitude literally cannot share a heart. One crowds the other out. Pride says "look what I did"; gratitude says "look what I was given." And Paul asks the one question that ends the argument: "what hast thou that thou didst not receive? now if thou didst receive it, why dost thou glory, as if thou hadst not received it?" (1 Corinthians 4:7). Think it through — your intelligence, your talent, your health, your opportunities, the people who poured into you: every bit of it received. And if it was all a gift, then bragging is just forgetting Who gave it. So the fix for pride is NOT to trash yourself or feel worthless — that’s just pride flipped upside down. The fix is to get so genuinely grateful that pride has no room left. And God even re-aims what we DO glory in: "Let not the wise man glory in his wisdom, neither let the mighty man glory in his might, let not the rich man glory in his riches: But let him that glorieth glory in this, that he understandeth and knoweth me" (Jeremiah 9:23-24). Don’t glory in being smart, strong, or rich — those can all be lost. Glory in knowing God, which can’t. Paul lands it: "God forbid that I should glory, save in the cross" (Galatians 6:14). Grateful is lighter, truer, and honestly just happier than proud.',
      senior: 'This lesson offers the positive cure to which the whole series has been building: gratitude as the practical displacement of pride, for the two cannot cohabit a heart. The decisive text is a question: "For who maketh thee to differ from another? and what hast thou that thou didst not receive? now if thou didst receive it, why dost thou glory, as if thou hadst not received it?" (1 Corinthians 4:7). The logic is airtight and humbling: every endowment — intellect, strength, temperament, opportunity, the formative people God set in our path — was received, not self-generated; and what is received furnishes no ground for boasting, only for thanks. Crucially, the biblical cure for pride is never self-contempt (which is merely pride inverted, still fixated on self), but a Godward gratitude so full that pride is crowded out. Scripture then re-aims the very impulse to glory rather than merely forbidding it: "Thus saith the LORD, Let not the wise man glory in his wisdom, neither let the mighty man glory in his might, let not the rich man glory in his riches: But let him that glorieth glory in this, that he understandeth and knoweth me, that I am the LORD which exercise lovingkindness, judgment, and righteousness in the earth" (Jeremiah 9:23-24). Observe the pastoral genius — the three classic grounds of human pride (wisdom, might, riches) are precisely the things that can be lost, while the one permitted glorying, the knowledge of God, can never be taken away. Paul concentrates it to a single object: "But God forbid that I should glory, save in the cross of our Lord Jesus Christ" (Galatians 6:14). For a long life that has accumulated real wisdom, strength once held, and perhaps means, the invitation is to let all of it become fuel for thanksgiving rather than a pedestal — and to glory only in the One who gave it and can never be lost.',
    },
    quiz: {
      questions: [
        {
          q: 'Why can’t pride and gratitude share a heart?',
          options: [
            'They can, easily',
            'Pride says "look what I did"; gratitude says "look what I was given" — one crowds the other out',
            'Because gratitude is weak',
          ],
          answer: 1,
          explain: 'They’re opposite postures toward the same blessing. Getting genuinely grateful is how you crowd pride out.',
        },
        {
          q: 'What question in 1 Corinthians 4:7 ends the case for boasting?',
          options: [
            '"How hard did you work?"',
            '"What hast thou that thou didst not receive?" — if it was all a gift, boasting forgets Who gave it',
            '"Who is the smartest?"',
          ],
          answer: 1,
          explain: 'Every endowment was received; what is received is no ground for boasting, only for thanks.',
        },
        {
          q: 'What does Jeremiah 9:23-24 tell us to glory in instead of wisdom, might, or riches?',
          options: [
            'Our achievements',
            'That we understand and KNOW Yahweh — the one glorying that can never be lost',
            'Nothing at all',
          ],
          answer: 1,
          explain: 'Wisdom, might, and riches can all be lost; knowing God cannot. Scripture re-aims our glorying rather than just forbidding it.',
        },
      ],
    },
    lesson: 'Every lesson so far has been clearing the ground; here is the seed that actually replaces pride, and it is gratitude. Start with a truth you can test in your own chest: pride and gratitude cannot share a heart. They are opposite postures toward the very same blessing. Pride looks at a good thing and says, "look what I did." Gratitude looks at the identical good thing and says, "look what I was given." Wherever one grows, it crowds the other out — which means the way to shrink pride is not mainly to attack it, but to grow gratitude until pride has nowhere left to sit. And Scripture makes that shift almost effortless with one disarming question from Paul: "For who maketh thee to differ from another? and what hast thou that thou didst not receive? now if thou didst receive it, why dost thou glory, as if thou hadst not received it?" (1 Corinthians 4:7). Walk it through honestly. Your intelligence — did you assemble your own brain? Your strength, your temperament, your knack for the thing you’re good at? Your opportunities, your teachers, the people God set in your path to pour into you? Every single item on that list was received, not self-generated. And here is the hinge: what is received gives you nothing to boast about — it only gives you Someone to thank. So the boasting isn’t just wrong; it’s a kind of forgetting, forgetting Whose gift it was. Now notice, carefully, what the biblical cure for pride is NOT. It is not self-contempt, not thinking of yourself as worthless, not the fake-humble grovel — because that is just pride flipped over, still obsessed with self, only now in the negative. The real cure is a Godward gratitude so genuine and so full that pride simply runs out of room. And Yahweh does something even better than forbidding pride — He re-aims the very impulse to glory and gives it a worthy target: "Thus saith the LORD, Let not the wise man glory in his wisdom, neither let the mighty man glory in his might, let not the rich man glory in his riches: But let him that glorieth glory in this, that he understandeth and knoweth me, that I am the LORD which exercise lovingkindness, judgment, and righteousness, in the earth: for in these things I delight, saith the LORD" (Jeremiah 9:23-24). Look at the pastoral genius in that. The three great grounds of human pride — wisdom, might, riches — are exactly the three things that can be taken from you. Age takes the might, a crash takes the riches, time can even cloud the wisdom. But the one glorying He permits, knowing Him, can never be lost. Paul boils it down to a single object: "But God forbid that I should glory, save in the cross of our Lord Jesus Christ" (Galatians 6:14). So this is the whole practical turn of the series: don’t fight pride by beating yourself up. Fight it by getting so grateful — naming Who gave you every gift, thanking Him out loud, thanking the people He used — that there is simply no room left for "look what I did." Gratitude is not only truer than pride. It is lighter, and it is happier, and it glories in the one thing no one can ever take away.',
    facilitator: {
      talkingPoints: [
        'Pride and gratitude can’t share a heart: pride says "look what I did," gratitude says "look what I was given." Grow gratitude and pride loses its seat.',
        'The disarming question: "what hast thou that thou didst not receive?" (1 Corinthians 4:7). If it was all received, boasting is just forgetting Who gave it.',
        'The cure is NOT self-contempt (that’s pride inverted) — it’s a Godward gratitude so full pride has no room.',
        'Scripture re-aims glory rather than only forbidding it: Jeremiah 9:23-24 — not wisdom/might/riches (all losable), but knowing Yahweh (never lost). Galatians 6:14 — glory only in the cross.',
        'Practical: gratitude is lighter, truer, happier — and it thanks people too, where pride competes with them.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read 1 Corinthians 4:7 and Jeremiah 9:23-24 — ask, "what’s something you were tempted to feel proud of?" | The big idea, in your own words (8): pride vs gratitude as opposite postures; the "received" question; the cure isn’t self-hatred. | Go deeper — the Word on pride & increase (10): wisdom/might/riches can be lost, knowing God can’t; glory re-aimed (Jeremiah 9; Galatians 6:14). | Reflect together (8): do a live gratitude round — name a gift and Who gave it. | Take it with you (3): each person writes three things they were proud of and Who gave each, and thanks Yahweh + one person this week.',
      discussionPrompts: [
        'Name something you’re tempted to be proud of — now, who or what did you RECEIVE it from?',
        'Why is beating yourself up NOT real humility?',
        'What would change if you gloried in knowing God instead of in your wisdom, strength, or stuff?',
        'Who is a person you should thank this week for something you’d been quietly taking credit for?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 5 — He Makes Us Win (Darrell's words)
  {
    id: 'pf5-he-makes-us-win',
    title: 'He Makes Us Win',
    bigIdea: 'When you win — really win — Whose win is it? Scripture is emphatic: "thanks be to God, which giveth us the victory." Not "helps us win"; giveth us the victory. He "always causeth us to triumph." Israel is told plainly they did not take the land by their own sword or arm — it was His right hand. So the winning itself is His gift, the same as the increase was. This is the most freeing way to succeed there is: you get to fight, and work, and compete with everything in you — and then give the victory back to the One who actually won it. Don’t be proud of the win; be grateful — He makes us win.',
    inApp: 'Think of a real "win" you’ve had — a victory, a breakthrough, a door that opened. Say it the true way out loud: "I didn’t win that by my own arm — Yahweh gave me the victory." Then carry that into the next thing you’re fighting for: work hard, and hand Him the win in advance.',
    anchor: {
      ref: '1 Corinthians 15:57; Psalm 44:3',
      theme: 'Thanks be to God, who GIVES us the victory and always causes us to triumph; Israel did not win by their own sword or arm, but by His right hand. He makes us win.',
    },
    benefits: [
      'A whole new way to win — you fight hard AND stay free of the proud heart that ruins winners.',
      'Freedom from the crushing pressure to be the source of your own victories — the victory is His to give.',
      'Staying power — winners who thank God don’t get drunk on the win and fall (back to Lesson 1).',
      'Gratitude in the mouth at the moment of triumph — the exact moment pride usually strikes.',
      'Confidence that isn’t arrogance — you can be bold because the win rests on His arm, not yours.',
    ],
    levels: {
      child: 'When you win a game or finally do something hard — who really made it happen? The Bible gives the answer with a big thank-you: "thanks be to God, which giveth us the victory" (1 Corinthians 15:57). "Victory" means the WIN! And it doesn’t say God helps us win — it says God GIVES us the win. Another verse says God "always causeth us to triumph" (2 Corinthians 2:14) — triumph is another word for winning big! A long time ago God’s people won their land, and God reminded them: you didn’t win it with your own sword or your own strong arm — it was MY right hand that did it (Psalm 44:3). So here’s the happy secret: when you win, you don’t have to get all puffed-up and proud. You get to say, "Thank You, God — YOU made me win!" That’s way better than bragging. Work hard, play hard, and give God the win. He makes us win!',
      teen: 'When you actually WIN something — the game, the competition, the breakthrough you fought for — whose win is it really? My dad says it straight: don’t be proud of yourself; be grateful — He makes us win. And the Bible backs it word for word. "But thanks be to God, which giveth us the victory through our Lord Jesus Christ" (1 Corinthians 15:57) — not "helps us win," GIVES us the victory. "Now thanks be unto God, which always causeth us to triumph in Christ" (2 Corinthians 2:14) — He’s the one causing the triumph. And when Israel won their land, God made sure they knew the source: "they got not the land in possession by their own sword, neither did their own arm save them: but thy right hand, and thine arm, and the light of thy countenance" (Psalm 44:3). Their sword didn’t do it; His right hand did. So the winning itself is His gift, exactly like the increase from Lesson 2. And this is honestly the best way to win there is: you go ALL out — you train, you compete, you fight for it — and then you hand the victory to the One who really won it. That keeps you from the thing that wrecks winners: getting drunk on the win and falling (Lesson 1). Win hard. Thank God louder. He makes us win.',
      senior: 'This lesson applies the whole series to the moment most dangerous to a proud heart — the moment of victory. Darrell’s own words frame it: "Don’t be proud of yourself; be grateful — He makes us win." Scripture is emphatic and repeated that triumph is God’s gift, not our achievement. "But thanks be to God, which giveth us the victory through our Lord Jesus Christ" (1 Corinthians 15:57) — the verb is giveth; the victory is bestowed, not earned. "Now thanks be unto God, which always causeth us to triumph in Christ, and maketh manifest the savour of his knowledge by us in every place" (2 Corinthians 2:14) — God is the one causing the triumph, continually. And the Psalter roots it in Israel’s formative victory precisely to forestall national pride: "For they got not the land in possession by their own sword, neither did their own arm save them: but thy right hand, and thine arm, and the light of thy countenance, because thou hadst a favour unto them" (Psalm 44:3). Sword and arm — the natural instruments of self-credit — are explicitly denied the glory; the LORD’s right hand is named the true cause. This does not counsel passivity: Israel drew the sword; we labor and contend. It relocates the CAUSE of the victory from our strength to His, so that triumph produces thanksgiving rather than the swollen heart that "goeth before destruction." For the seasoned believer, who has known both defeats and victories, this is the mature completion of gratitude: to fight faithfully with all one’s strength, and, in the very hour of winning — when pride most insistently offers its crown — to give the victory back to the One whose right hand actually won it. He makes us win; the winning is His, and so is the glory.',
    },
    quiz: {
      questions: [
        {
          q: 'What does 1 Corinthians 15:57 say God does with the victory?',
          options: [
            'Helps us win if we try hard enough',
            'GIVES us the victory — "thanks be to God, which giveth us the victory"',
            'Watches us win on our own',
          ],
          answer: 1,
          explain: 'The verb is "giveth" — the victory is bestowed, not earned. He makes us win.',
        },
        {
          q: 'Why does Psalm 44:3 say Israel did NOT win by their own sword and arm?',
          options: [
            'Because they didn’t fight at all',
            'To forestall pride — the true cause was God’s right hand, not their own strength',
            'Because swords don’t work',
          ],
          answer: 1,
          explain: 'They did draw the sword — but the CAUSE of the victory was His right hand and favour, not their arm. The credit is relocated to God.',
        },
        {
          q: 'What is the "best way to win" this lesson describes?',
          options: [
            'Win, then take all the credit',
            'Fight/work with everything you have, then give the victory back to the One who won it',
            'Don’t compete at all',
          ],
          answer: 1,
          explain: 'It’s not passivity — you go all out — but at the moment of triumph (when pride strikes hardest) you thank God, which keeps you from the win-drunk fall of Lesson 1.',
        },
      ],
    },
    lesson: 'This lesson takes everything the series has taught and applies it to the single moment most dangerous to a proud heart: the moment you actually win. Darrell says it in one line that is worth memorizing: don’t be proud of yourself; be grateful — He makes us win. And Scripture says the very same thing, emphatically and more than once. "But thanks be to God, which giveth us the victory through our Lord Jesus Christ" (1 Corinthians 15:57). Look at the verb — not "helps us win," not "gives us a chance to win," but giveth us the victory. The win is a gift, bestowed, not a wage earned. Paul says it again in the present continuous, as an ongoing reality: "Now thanks be unto God, which always causeth us to triumph in Christ, and maketh manifest the savour of his knowledge by us in every place" (2 Corinthians 2:14). God is the one CAUSING the triumph, again and again. And the Psalms drive it all the way back into Israel’s founding victory — deliberately, to head off national pride before it could start: "For they got not the land in possession by their own sword, neither did their own arm save them: but thy right hand, and thine arm, and the light of thy countenance, because thou hadst a favour unto them" (Psalm 44:3). Read what that verse refuses. The sword and the arm — the two most natural symbols of "I did this myself" — are explicitly stripped of the credit. It was His right hand, His arm, His favour that won the land. Now put this next to Lesson 2, and you’ll see they are twins: there, the increase was His gift; here, the victory is His gift. Growth and winning, the two things we are most tempted to be proud of, both turn out to be things He gives. And notice, this is not a call to passivity or to sitting on the sidelines. Israel drew the sword. Peter let down the net. You still train, still compete, still work, still contend for the thing with everything in you. What changes is where you locate the CAUSE of the win — off of your own strength and onto His right hand — so that the outcome of victory is thanksgiving instead of a swollen heart. And that matters enormously, because winning is exactly when pride pounces. The hour of triumph is when the haughty heart of Lesson 1 offers you its crown, and it is precisely the winners who get drunk on the win that fall. So this is the most freeing way to succeed that exists: go all out, fight faithfully, leave nothing in the tank — and then, in the very moment of winning, when pride is whispering loudest, give the victory back out loud to the One whose right hand actually won it. He makes us win. The winning is His gift, and so is the glory — and a grateful winner is a winner who lasts.',
    facilitator: {
      talkingPoints: [
        'Darrell’s framing: "Don’t be proud of yourself; be grateful — He makes us win." Applied to the moment most dangerous to pride: victory.',
        'The victory is GIVEN, not earned: "thanks be to God, which giveth us the victory" (1 Corinthians 15:57); "always causeth us to triumph" (2 Corinthians 2:14).',
        'Psalm 44:3 strips the credit from sword and arm ("I did this myself") and names God’s right hand the true cause — deliberately, to forestall pride.',
        'Twin of Lesson 2: increase is His gift; victory is His gift. The two things we’re proudest of are both things He gives.',
        'Not passivity — you go all out — but relocate the CAUSE to Him, so triumph yields thanks, not the win-drunk fall of Lesson 1.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read 1 Corinthians 15:57 and Psalm 44:3 — ask, "when you’ve won, where did the credit go?" | The big idea, in your own words (8): "giveth us the victory," not helps; He makes us win; winning is when pride strikes. | Go deeper — the Word on pride & increase (10): Psalm 44:3 denies sword/arm the glory; twin of the increase; fight hard AND hand Him the win. | Reflect together (8): use the prompts; share a real win and give God the glory for it. | Take it with you (3): each person names a win and says the true version out loud — "Yahweh gave me that victory" — and hands Him the next fight in advance.',
      discussionPrompts: [
        'Think of a real win — where did the credit go in your heart at the time?',
        'What’s the difference between God "helping you win" and God "giving you the victory"?',
        'Why is the moment of winning the most dangerous moment for pride?',
        'What are you fighting for right now that you could hand Him the victory on, in advance?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 6 — Humble Yourself, and He Lifts You
  {
    id: 'pf6-humble-yourself-and-he-lifts-you',
    title: 'Humble Yourself, and He Lifts You',
    bigIdea: 'There are only two ways down from pride: humble yourself, or be humbled. Scripture makes the gentle way an invitation with a promise: "Humble yourselves in the sight of the Lord, and he shall lift you up." God actively "resisteth the proud, but giveth grace unto the humble" — so pride is swimming against God Himself. King Nebuchadnezzar learned the hard way: at the peak of "my power, my majesty," he was brought low, and only when he lifted his eyes to heaven was he restored, saying those that walk in pride, God is able to abase. The whole series lands here: choose the low place on purpose, and let the God who gives the increase and the victory be the One who lifts you up, in due time.',
    inApp: 'Pick one concrete way to "humble yourself" this week before you’re humbled — apologize first, ask for help, give someone else the credit, take the lower seat, receive correction without defending. Do it on purpose, and say: "I humble myself, Lord — You lift up in due time." Then watch what He does.',
    anchor: {
      ref: 'James 4:10; 1 Peter 5:6',
      theme: 'Humble yourself in the sight of the Lord and He will lift you up; humble yourself under His mighty hand, that He may exalt you in due time. Choose the low place — He does the lifting.',
    },
    benefits: [
      'The gentle way down instead of the hard way — humble yourself before life humbles you.',
      'A promise attached: "he shall lift you up" — the lifting is His job, and He’s good at it.',
      'Freedom from exhausting self-promotion — you can stop clawing for the high seat and let Him seat you.',
      'Alignment with God instead of against Him — pride resists the very One who gives grace to the humble.',
      'The whole series completed: the God who gives the increase and the victory is the One who lifts the humble in due time.',
    ],
    levels: {
      child: 'There are only two ways to get down from being high-and-proud: you can climb down gently yourself, or you can fall. The Bible shows the gentle way, and it comes with a promise: "Humble yourselves in the sight of the Lord, and he shall lift you up" (James 4:10). See that? YOU go low on purpose, and GOD lifts you up! There’s even a true story about a proud king named Nebuchadnezzar. He looked at his huge kingdom and bragged, "Look at this GREAT thing *I* built by *my* power!" (Daniel 4:30). And he got brought very low — until he finally looked up to God, and then God restored him, and the king said God "is able to abase" (bring down) "those that walk in pride" (Daniel 4:37). So don’t wait to be brought low — choose to be humble now! Say sorry first, let others go first, ask for help, and let God be the One who lifts you up. That’s the happy way!',
      teen: 'The whole series lands right here, and it’s a choice: there are only two ways down from pride — you humble yourself, or you get humbled. God makes the gentle way an actual invitation WITH a promise attached: "Humble yourselves in the sight of the Lord, and he shall lift you up" (James 4:10); "Humble yourselves therefore under the mighty hand of God, that he may exalt you in due time" (1 Peter 5:6). You go low on purpose; He does the lifting, in His timing. And here’s a serious reason to pick the gentle way: God is not neutral about pride. "God resisteth the proud, but giveth grace unto the humble" (James 4:6; 1 Peter 5:5). Pride literally puts you swimming against God. The classic cautionary tale is King Nebuchadnezzar. At the top of his game he looked over his kingdom and said, "Is not this great Babylon, that *I* have built... by the might of *my* power, and for the honour of *my* majesty?" (Daniel 4:30) — and he was humbled hard, until he "lifted up mine eyes unto heaven," and God restored him. His own conclusion: "those that walk in pride he is able to abase" (Daniel 4:37). So stop clawing for the high seat. Humble yourself first — apologize, ask for help, give the credit away, take the lower seat — and let the same God who gives the increase (Lesson 2) and the victory (Lesson 5) be the One who lifts you up, right on time.',
      senior: 'The series concludes where it must: with the deliberate choice of humility, and the promise God attaches to it. Scripture frames the alternatives starkly — one either humbles oneself or is, in time, humbled — and it makes the voluntary path an invitation carrying an explicit promise: "Humble yourselves in the sight of the Lord, and he shall lift you up" (James 4:10); "Humble yourselves therefore under the mighty hand of God, that he may exalt you in due time" (1 Peter 5:6). The pattern is fixed: we descend by choice; He exalts, and in His timing, not ours. The stakes are underscored by a sobering statement of God’s own posture: "God resisteth the proud, but giveth grace unto the humble" (James 4:6; 1 Peter 5:5) — pride sets a person against the active opposition of God Himself, while humility positions one to receive His grace. The archetypal illustration is Nebuchadnezzar, whose account Daniel preserves precisely as a warning to the proud and a comfort to the humbled. At the zenith of his success he declared, "Is not this great Babylon, that I have built for the house of the kingdom by the might of my power, and for the honour of my majesty?" (Daniel 4:30) — self-credit in its purest form — and he was abased to the point of madness, restored only when "mine understanding returned unto me, and I blessed the most High," concluding, "those that walk in pride he is able to abase" (Daniel 4:37). For a believer near the fullness of years, this is the summation of a life’s wisdom: the God who gives the increase (Lesson 2), who builds the house (Lesson 3), who is the only worthy object of our glorying (Lesson 4), and who gives the very victory (Lesson 5), is also the God who lifts the humble in due time. Therefore choose the low place freely, gratefully, without anxiety for your own exaltation — for the lifting is His office, He performs it faithfully, and He performs it on time.',
    },
    quiz: {
      questions: [
        {
          q: 'According to James 4:10, what happens when you humble yourself?',
          options: [
            'You stay down forever',
            'He lifts you up — "Humble yourselves in the sight of the Lord, and he shall lift you up"',
            'Nothing at all',
          ],
          answer: 1,
          explain: 'You go low on purpose; the lifting is His job, in His timing (1 Peter 5:6 — "exalt you in due time").',
        },
        {
          q: 'What is God’s own posture toward pride vs humility (James 4:6; 1 Peter 5:5)?',
          options: [
            'He’s neutral about both',
            'He "resisteth the proud, but giveth grace unto the humble" — pride opposes God Himself',
            'He prefers the proud',
          ],
          answer: 1,
          explain: 'Pride puts you swimming against God’s active resistance; humility positions you to receive His grace. Strong reason to choose the gentle way.',
        },
        {
          q: 'What did Nebuchadnezzar learn (Daniel 4:30, 37)?',
          options: [
            'That his own power built everything',
            'After boasting "my power, my majesty" he was abased, and learned "those that walk in pride he is able to abase"',
            'That pride has no consequences',
          ],
          answer: 1,
          explain: 'At the peak of self-credit he was brought low, and restored only when he looked up to God — the archetypal warning that pride goes before the fall.',
        },
      ],
    },
    lesson: 'The series has to end here, because everything before it was pointing to one deliberate choice. And the choice is simple, even if it isn’t easy: there are only two ways down from pride — you humble yourself, or you get humbled. One way is gentle and one is hard, and God, in mercy, makes the gentle way an open invitation with a promise tied to it: "Humble yourselves in the sight of the Lord, and he shall lift you up" (James 4:10). Peter says it the same way: "Humble yourselves therefore under the mighty hand of God, that he may exalt you in due time" (1 Peter 5:6). Read the division of labor in those verses, because it is the whole secret. YOUR part is to go low — on purpose, voluntarily, now. GOD’s part is the lifting, and He does it in due time, His time, not yours. You are not responsible for your own exaltation; you are only responsible for your own humility, and He takes care of the rest. And there is a serious, clarifying reason to choose the gentle way rather than gambling on the hard one: God is not neutral about pride. "God resisteth the proud, but giveth grace unto the humble" (James 4:6, and again in 1 Peter 5:5). Sit with how weighty that is. A proud heart is not merely unwise or unattractive — it is set directly against the active resistance of God Himself, swimming upstream against the current of heaven. The humble heart, by contrast, is positioned right under the open hand of grace. The Bible’s great illustration of all of this is King Nebuchadnezzar, and Daniel records his story precisely as a warning to the proud and a comfort to anyone who has been brought low. At the absolute peak of his success, surveying his empire, he said the most naked sentence of self-credit in all of Scripture: "Is not this great Babylon, that I have built for the house of the kingdom by the might of my power, and for the honour of my majesty?" (Daniel 4:30). My Babylon, my power, my majesty. And he was abased — brought so low he lived like an animal — until, as he tells it, he "lifted up mine eyes unto heaven, and mine understanding returned unto me, and I blessed the most High." His own hard-won conclusion is the moral of the whole series: "those that walk in pride he is able to abase" (Daniel 4:37). So here is where all six lessons come to rest. The same God who gives the increase when you could labor a thousand years and not make it grow (Lesson 2), who builds the house that you would otherwise build in vain (Lesson 3), who is the only glorying that can never be taken from you (Lesson 4), and who gives the very victory that your own sword and arm could never win (Lesson 5) — that same God is the One who lifts up the humble in due time. Which means you can stop clawing for the high seat entirely. You can stop the exhausting work of self-promotion, of defending your image, of making sure everyone sees how much you did. You can choose the low place freely and gratefully — apologize first, ask for help, hand the credit to someone else, take the lower seat, receive correction without flinching — and simply trust the lifting to Him. Don’t be proud of yourself. Be grateful. He gives the increase, He gives the victory, He makes us win — and He lifts up the humble, right on time.',
    facilitator: {
      talkingPoints: [
        'Two ways down from pride: humble yourself, or be humbled. God makes the gentle way an invitation WITH a promise: "Humble yourselves... and he shall lift you up" (James 4:10; 1 Peter 5:6).',
        'The division of labor: your part is going low on purpose; His part is the lifting, in due time. You’re not responsible for your own exaltation.',
        'God is not neutral: "God resisteth the proud, but giveth grace unto the humble" (James 4:6; 1 Peter 5:5). Pride swims against God Himself.',
        'Nebuchadnezzar (Daniel 4:30, 37): "my power, my majesty" → abased → restored when he looked up → "those that walk in pride he is able to abase." The archetypal Proverbs 16:18.',
        'The series comes to rest: the God who gives the increase, builds the house, is our only glory, and gives the victory, is the One who lifts the humble in due time. Don’t be proud; be grateful — He makes us win.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read James 4:6,10 and 1 Peter 5:6 — ask, "which is easier: humbling yourself, or getting humbled?" | The big idea, in your own words (8): the two ways down; your part (go low) vs His part (lift, in due time); God resists the proud. | Go deeper — the Word on pride & increase (10): Nebuchadnezzar’s "my power, my majesty" and his fall + restoration; tie the whole series together. | Reflect together (8): use the prompts. | Take it with you (3): each person picks ONE concrete way to humble themselves this week (apologize first, ask for help, give the credit away, take the lower seat) and does it on purpose.',
      discussionPrompts: [
        'Which is easier for you — humbling yourself, or getting humbled? Why?',
        'Where is pride making you "swim against God" right now, and what would humility look like there?',
        'What is one concrete way you can humble yourself on purpose this week, before life does it for you?',
        'How does it change your striving to know the LIFTING is God’s job, in due time — not yours?',
      ],
    },
  },
];

export const PRIDE_LESSONS_INTEREST_TAG = '[Pride & the Increase interest]';
export const PRIDE_LESSONS_HELPER_TAG = '[Pride & the Increase helper]';

export function resolvePrideLessonsCohort(localCohort = null) {
  return resolveCohortGeneric(localCohort, PRIDE_LESSONS_CONFIRMED_COHORT, PRIDE_LESSONS_PROPOSED_COHORT_START);
}

export function buildPrideLessonsSchedule() {
  return PRIDE_LESSONS_MODULES.map((m, i) => ({ ...m, week: i + 1, date: null, weekday: null }));
}

export function prideLessonsProgressSummary(progress = {}) {
  return progressSummaryFor(PRIDE_LESSONS_MODULES, progress);
}

export function exportPrideLessonsCurriculumMarkdown() {
  return exportCurriculumMarkdownFor(
    { meta: PRIDE_LESSONS_META, sessionFlow: PRIDE_LESSONS_SESSION_FLOW, modules: PRIDE_LESSONS_MODULES },
    null,
  );
}

// Tutor course-meta — the per-lesson solo guide introduces itself as a Word-first,
// grace-centered companion that uproots pride with gratitude and points every
// increase and victory back to Yahweh.
export const PRIDE_LESSONS_TUTOR_META = {
  title: PRIDE_LESSONS_META.title,
  intro: 'You are a warm, grace-centered guide for a Word-first, non-denominational lesson series called "Pride Before the Fall: The Increase Is the Lord’s."',
  posture: 'Guide ONE learner — who may be a child, a teen, an adult, or a seasoned believer — through the lesson, matching your words and pace to their age. The series builds in order: (1) pride goes before the fall (Proverbs 16:18), (2) the INCREASE is the Lord’s — you could labor a thousand years and not make it grow; God gives the increase (1 Corinthians 3:6-7), (3) except the Lord build the house we labor in vain, and apart from Christ we can do nothing (Psalm 127:1; John 15:5; Peter’s empty nets, Luke 5:5), (4) be GRATEFUL, not proud — pride and gratitude can’t share a heart, and "what hast thou that thou didst not receive?" (1 Corinthians 4:7; glory only in knowing Yahweh, Jeremiah 9:23-24), (5) He makes us WIN — the victory is His gift, not our sword or arm (1 Corinthians 15:57; Psalm 44:3), and (6) HUMBLE yourself and He lifts you up in due time; God resists the proud but gives grace to the humble (James 4:6,10; 1 Peter 5:6; Nebuchadnezzar, Daniel 4). The through-line, in Darrell’s words: "Don’t be proud of yourself; be grateful for Yahweh — He makes us win." Be relentlessly WELL-BEING-POSITIVE: the cure for pride is never self-contempt (that is pride inverted) but a Godward gratitude so full pride has no room; free the weary from self-made pride into gratitude and rest, and never shame. Cite Scripture by reference (KJV, as in the lessons); never invent or paraphrase a verse as if quoting it, and if unsure of a text, say so rather than fabricate. Give Yahweh the glory — the increase and the victory are His.',
};
