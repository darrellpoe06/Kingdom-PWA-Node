// =============================================================================
// table-lessons-class — "The Table & the Footstool: Meek, Sound-Minded, Seated"
// =============================================================================
// A Word-first, SELF-PACED lesson SERIES on the identity Yahweh gives the one He
// has carried through the wilderness — a table set in the presence of enemies,
// enemies made a footstool, the meekness that inherits, the sound mind that fear
// cannot take, and the mind reprogrammed by His Word. Rides the SAME shared Learn
// engine as the other courses (church-classes.js generics, class-tutor.js,
// learn-framework.js age-adaptive/quiz/graduate->helper), sets `meta.unit` to
// render self-paced "Lessons," and AUTO-joins the Learn hub + Presenter.
//
// FROM DARRELL'S OWN WORDS (spoken build input, 2026): "Yahweh said He sets a
// table before your enemies and they will be your footstool. You are meek and have
// a sound mind etc — character Yahweh is developing while you program yourself with
// His 4th-dimensional Data." This series is that teaching, built out verse by
// verse. It completes the theology the Way Up game already seeds at "The Table."
//
// THE GAMES ARE LESSONS TOO (Darrell 2026-07-06): the same teaching is playable in
// the Generations game ("The Table Set Before You" card) — a decision walked, not
// just read.
//
// VERIFICATION (DR-0076): every quoted verse is KJV, sourced VERBATIM from the
// in-repo public-domain KJV (app/public/bible/kjv/*.json), never from memory;
// anchors cite a reference + theme gloss. WELL-BEING-POSITIVE: it settles the
// anxious into rest and honor (the table is set, the seat is given), never striving
// or self-exaltation; meekness is strength under Yahweh's hand, and the victory is
// His — He makes the footstool, we do not.
// =============================================================================

import {
  progressSummaryFor, exportCurriculumMarkdownFor, resolveCohortGeneric,
} from './church-classes.js';

export const TABLE_LESSONS_PROPOSED_COHORT_START = null;
export const TABLE_LESSONS_CONFIRMED_COHORT = { startDate: null, confirmed: false };

export const TABLE_LESSONS_META = {
  key: 'table-lessons',
  title: 'The Table & the Footstool: Meek, Sound-Minded, Seated',
  audience: 'the whole family and the whole Body — every age',
  tagline: 'He sets the table. He makes the footstool. You get to be seated.',
  format: 'Self-paced · read it alone, as a family, or in a group · paced to your age',
  cadenceDays: 7,
  weeks: 5,
  handsOnLabel: 'Take it with you',
  unit: {
    noun: 'lesson',
    nounPlural: 'lessons',
    cap: 'Lesson',
    selfPaced: true,
    sessionLabel: 'How to lead it (family or small group)',
    countNoun: 'lesson',
  },
  footer: '_Taught by Darrell Poe · The Church of the Living God + the Poe family · built on PoeTech. Word-first and non-denominational — Scripture is senior to any tradition. Grace-centered, for every age. He sets the table and makes the footstool — the honor and the victory are His._',
};

export const TABLE_LESSONS_SESSION_FLOW = [
  { minutes: 3, name: 'Open in prayer + read the Scripture' },
  { minutes: 8, name: 'The big idea, in your own words' },
  { minutes: 10, name: 'Go deeper — the Word on the table & the mind' },
  { minutes: 8, name: 'Reflect together' },
  { minutes: 3, name: 'Take it with you' },
];
export const TABLE_LESSONS_SESSION_MINUTES = TABLE_LESSONS_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0);

export const TABLE_LESSONS_MODULES = [
  // ---------------------------------------------------------------------------
  // LESSON 1 — A Table in the Presence of Your Enemies
  {
    id: 'tf1-a-table-before-your-enemies',
    title: 'A Table in the Presence of Your Enemies',
    bigIdea: 'David says something almost scandalous: "Thou preparest a table before me in the presence of mine enemies." Not after the enemies are gone — right in front of them. Yahweh doesn’t just rescue you from opposition; He seats you at a spread meal, anoints your head, and fills your cup until it overflows, while those who opposed you watch. You don’t have to fight your way to the seat or earn the meal. The Shepherd sets the table, and your only job is to sit down and be fed. Provision and honor, in the very place you expected only battle.',
    inApp: 'Name one "enemy" you’re facing — a person, a pressure, a fear, a hard season. Then picture the Shepherd setting a full table for you right in front of it, and say: "You prepare a table for me here — I don’t have to fight for the seat; I sit and I’m fed." Receive one specific provision today as from His hand.',
    anchor: {
      ref: 'Psalm 23:5; Psalm 23:1',
      theme: 'The Shepherd prepares a table in the presence of your enemies, anoints your head, fills your cup to overflowing. You lack nothing — you don’t earn the seat; He sets it.',
    },
    benefits: [
      'Rest instead of striving — the table is already set; you receive, you don’t earn the meal.',
      'Honor in the exact place you expected only opposition — anointed, filled, seated.',
      'Freedom from having to defeat every enemy first — He feeds you in their very presence.',
      'A cup that "runneth over" — His provision is not stingy; it overflows.',
      'The Shepherd’s guarantee under it all: "I shall not want" — with Him you lack nothing you truly need.',
    ],
    levels: {
      child: 'King David wrote a song about God being like a good shepherd who takes care of his sheep. And he said something surprising: "Thou preparest a table before me in the presence of mine enemies" (Psalm 23:5). A "table" means a big meal, all set up! And "in the presence of mine enemies" means right in front of the people who don’t like you. So God doesn’t just chase your enemies away — He sets up a yummy feast for you right there, and pours your cup so full it spills over! You don’t have to cook it or fight for your seat. The Shepherd does it all; you just sit down and eat. David also said, "The LORD is my shepherd; I shall not want" (Psalm 23:1) — "I shall not want" means with God taking care of you, you have everything you really need. Isn’t that a good Shepherd?',
      teen: 'Psalm 23 has a line people quote all the time without catching how bold it is: "Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over" (Psalm 23:5). Read it slowly. God doesn’t wait until your enemies are defeated to bless you — He sets a full table for you RIGHT in front of them, while they watch. He anoints your head (that’s honor, like rolling out the red carpet) and fills your cup until it literally overflows. And here’s the part that takes the pressure off: you don’t set that table, and you don’t fight your way to the seat. The Shepherd sets it; you sit down and get fed. That’s the whole posture of this series — provision and honor as a GIFT from Him, in the very place you thought you’d only get a battle. It starts with the line right before it: "The LORD is my shepherd; I shall not want" (Psalm 23:1). "I shall not want" means when He’s your Shepherd, you’re not lacking what you actually need. So when you’re staring down something hard, don’t only picture the fight — picture the table He’s already setting for you, right there in front of it.',
      senior: 'The seasoned believer has feasted at this table more than once and knows its wonder: "Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over" (Psalm 23:5). The imagery is deliberate and striking. In the ancient world a prepared table meant settled peace, provision, and honor; to be given it "in the presence of mine enemies" is to be publicly vindicated and cared for while opposition looks on, unable to interrupt the meal. Yahweh does not merely deliver His own FROM their enemies; He honors them BEFORE their enemies — anointing the head (a sign of chosenness, gladness, and consecration) and filling the cup past its brim (abundance, not mere sufficiency). Crucially, every verb is His: Thou preparest, Thou anointest — the guest neither cooks the meal nor secures the seat; he receives. This is grace made visible at a table, and it rests on the Psalm’s opening confession, "The LORD is my shepherd; I shall not want" (Psalm 23:1) — the sheep under this Shepherd lacks no needful thing. For a life that has known real enemies — injustice, illness, betrayal, the long wilderness — the pastoral comfort is precise: the table is not a reward earned by winning the war, but a provision spread in the midst of it, by the Shepherd’s own hand. Sit down. You are not intruding; you are invited, honored, and filled to overflowing, and the One who set the table has already answered the question of whether you will lack.',
    },
    quiz: {
      questions: [
        {
          q: 'When does the Shepherd prepare the table, according to Psalm 23:5?',
          options: [
            'Only after the enemies are gone',
            'In the PRESENCE of your enemies — right in front of them, while they watch',
            'Never; you have to set it yourself',
          ],
          answer: 1,
          explain: 'He honors you before your enemies, not only after — provision and honor in the very place of opposition.',
        },
        {
          q: 'Who sets the table and fills the cup?',
          options: [
            'You do, by working hard enough',
            'The Shepherd — "Thou preparest... thou anointest" — you receive; you don’t earn the meal or the seat',
            'Your enemies',
          ],
          answer: 1,
          explain: 'Every verb is His. The guest neither cooks the meal nor secures the seat; grace sets the table and you sit down.',
        },
        {
          q: 'What does "my cup runneth over" tell us about His provision?',
          options: [
            'It’s just barely enough',
            'It’s abundant — overflowing, not stingy or minimal',
            'It’s empty',
          ],
          answer: 1,
          explain: 'The cup overflows — abundance, not mere sufficiency. And "I shall not want" (23:1) means with Him you lack nothing you truly need.',
        },
      ],
    },
    lesson: 'Everyone quotes Psalm 23, but this one line in it is quietly astonishing, and it sets the whole tone of this series: "Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over" (Psalm 23:5). Slow down and look at what David is actually saying. He does not say God waits until the enemies are defeated and gone, and THEN throws a celebration. He says Yahweh prepares a full table for him right in the presence of his enemies — spread out, ready, honored — while those who opposed him watch and can do nothing to stop the meal. In the ancient world a prepared table meant peace, provision, and welcome; to be given one in front of your enemies was public vindication. And God goes further than food: He anoints the head with oil, which is the language of being chosen, gladdened, set apart for honor, and He fills the cup past the brim so it runs over — that is abundance, not a careful little portion. Now catch the detail that changes everything about how you carry a hard season: every single verb in that verse belongs to God. THOU preparest. THOU anointest. The guest at this table did not cook the meal, did not earn the seat, did not fight his way to the head of the table. He was invited, seated, honored, and filled — all by the Shepherd’s hand. That is grace made visible at a table. You do not strive your way to this seat; you receive it. And it rests on the line right before it, the confession the whole Psalm is built on: "The LORD is my shepherd; I shall not want" (Psalm 23:1). "I shall not want" is not a wish; it is a settled fact about life under this Shepherd — you will not lack the thing you actually need. So here is the identity this first lesson hands you, and the rest of the series builds on it: you are someone Yahweh honors in front of opposition, not only after it. When you are staring down an enemy — a person, a pressure, an illness, a fear, a long wilderness — do not picture only the battle. Picture the table He is already setting for you, right there in the middle of it. Then do the one thing the guest is actually asked to do: sit down, and be fed. You are not intruding. You are invited, anointed, and filled to overflowing, by the One who has already settled whether you will lack.',
    facilitator: {
      talkingPoints: [
        'The bold claim of Psalm 23:5: the table is set "in the presence of mine enemies" — provision + honor IN the place of opposition, not only after it.',
        'God goes beyond food: anointing the head (chosenness, honor, gladness) and a cup that "runneth over" (abundance, not mere sufficiency).',
        'Every verb is His — "Thou preparest, thou anointest." The guest receives; he does not cook the meal or earn the seat. Grace at a table.',
        'It rests on "The LORD is my shepherd; I shall not want" (23:1) — under this Shepherd you lack no needful thing.',
        'The posture for a hard season: don’t picture only the battle — picture the table He’s already setting, and sit down.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Psalm 23 (all of it) aloud — ask, "what surprises you about a table set in front of enemies?" | The big idea, in your own words (8): He honors you before your enemies, not only after; you receive the seat, you don’t earn it. | Go deeper — the Word on the table & the mind (10): the anointing + the overflowing cup; every verb is His; "I shall not want." | Reflect together (8): use the prompts; let people name a real "enemy" and picture the table. | Take it with you (3): each person names one opposition and receives one provision today as from the Shepherd’s hand.',
      discussionPrompts: [
        'What "enemy" are you facing where you’ve only pictured the battle, not the table?',
        'What’s the difference between God removing your enemies and God honoring you in front of them?',
        'Where do you strive to "earn your seat" when the Shepherd is offering to seat you?',
        'What would it look like to actually "sit down and be fed" this week instead of fighting for it?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 2 — Your Enemies a Footstool
  {
    id: 'tf2-your-enemies-a-footstool',
    title: 'Your Enemies a Footstool',
    bigIdea: 'Yahweh’s word to His own is stunning: "Sit thou at my right hand, until I make thine enemies thy footstool." Look at the two verbs and who does each. YOU sit. HE makes the footstool. The subduing of what opposes you is His work, not yours — you are invited to be seated while He does it. This is the deepest version of "He makes us win." First and forever it is true of Jesus, seated at the Father’s right hand until His enemies are made His footstool; and in Him, you are seated too. So you don’t claw and scramble to conquer — you rest at the table, and let the God who sets it also subdue what stands against it.',
    inApp: 'Name the thing that feels like it’s "winning" over you right now. Then hand the subduing of it to God out loud: "I sit; You make it a footstool — the victory is Yours to work, not mine to force." Choose to REST in that today instead of striving to conquer it by your own strength.',
    anchor: {
      ref: 'Psalm 110:1; Hebrews 10:12-13',
      theme: 'The LORD says, "Sit at My right hand until I make your enemies your footstool." You sit; He subdues. First true of Jesus, seated until His enemies are His footstool — and in Him, of you.',
    },
    benefits: [
      'The victory relocated off your shoulders — the subduing is His work; your part is to be seated.',
      'Rest in the middle of conflict — you can sit because He is the one making the footstool.',
      'Freedom from clawing and scrambling to conquer everything by your own strength.',
      'Anchored in Christ — seated at the right hand, He guarantees the outcome; you’re in Him.',
      'The completion of "He makes us win" — the enemies become a footstool by His hand, in His time.',
    ],
    levels: {
      child: 'God said something amazing to His King: "Sit thou at my right hand, until I make thine enemies thy footstool" (Psalm 110:1). A footstool is the little stool you put your feet up on to rest! So God is saying: you SIT down and rest, and I will take the things that are against you and put them right under your feet. See who does what? YOU sit. GOD makes the footstool. That means you don’t have to beat your problems all by yourself — God does the winning, and you get to rest! This is really about Jesus: He sits next to God, and God is making everything that’s against Jesus into His footstool. And because we belong to Jesus, we get to rest too. So when something feels too big, remember: you sit, and God makes it a footstool.',
      teen: 'Here’s one of the most repeated verses in the whole Bible — the New Testament quotes it over and over: "The LORD said unto my Lord, Sit thou at my right hand, until I make thine enemies thy footstool" (Psalm 110:1). Zoom in on the two verbs and who’s doing them. YOU: sit. GOD: makes the footstool. A footstool is what you rest your feet on — so the picture is your enemies ending up UNDER your feet, subdued. And the whole point is that the subduing is GOD’s job, not yours. You’re invited to be seated while He does the heavy lifting. This is the deepest version of "He makes us win" from the last series. First and forever it’s about Jesus — Hebrews says He "sat down on the right hand of God; from henceforth expecting till his enemies be made his footstool" (Hebrews 10:12-13). He’s seated, waiting, because the outcome is guaranteed. And because you’re IN Him, you’re seated too. So when something feels like it’s beating you, you don’t have to scramble and claw to conquer it in your own strength. You sit — you rest, you trust — and you let the God who sets the table also put what’s against you under your feet, in His time.',
      senior: 'This is the royal companion to the table of Lesson 1, and it is the most-cited Old Testament verse in the New Testament: "The LORD said unto my Lord, Sit thou at my right hand, until I make thine enemies thy footstool" (Psalm 110:1). The grammar carries the theology. The one addressed is commanded to SIT — the posture of rest, enthronement, and finished work — while the LORD Himself undertakes the making of the footstool, the subjugation of every opposing power. The believer is nowhere told to manufacture the victory; he is invited to be seated while God accomplishes it. This finds its first and fullest reference in Christ: "But this man, after he had offered one sacrifice for sins for ever, sat down on the right hand of God; from henceforth expecting till his enemies be made his footstool" (Hebrews 10:12-13). The seated Christ is the guarantee — His work finished, His enthronement certain, His enemies’ subjection only a matter of the Father’s timing. And by union with Him, the saints are "raised... up together, and made... sit together in heavenly places in Christ Jesus" (Ephesians 2:6): our seat is His seat, our victory secured in His. For the seasoned believer this reframes the whole posture toward conflict. The exhausting compulsion to conquer every foe by one’s own arm is answered by a command to sit — not passivity, but the deep rest of one who trusts that the subduing is the Lord’s to work and the Lord’s to time. It is the crowning form of the truth that He makes us win: the enemies become a footstool by His hand, not ours, and the victory is as sure as Christ’s own throne.',
    },
    quiz: {
      questions: [
        {
          q: 'In Psalm 110:1, who does each part — the sitting and the making-a-footstool?',
          options: [
            'You do both',
            'YOU sit; the LORD makes your enemies your footstool — the subduing is His work',
            'Your enemies sit; you make the footstool',
          ],
          answer: 1,
          explain: 'You are invited to be seated (rest, trust) while God subdues what opposes you. The victory is His to work.',
        },
        {
          q: 'Who is this verse first and fully about?',
          options: [
            'Only ancient Israel',
            'Jesus — seated at God’s right hand "till his enemies be made his footstool" (Hebrews 10:12-13); and in Him, us',
            'No one in particular',
          ],
          answer: 1,
          explain: 'The seated Christ guarantees the outcome; by union with Him we are seated too, our victory secured in His.',
        },
        {
          q: 'What posture toward conflict does this teach?',
          options: [
            'Claw and scramble to conquer everything yourself',
            'Sit — rest and trust — while God subdues what stands against you, in His time',
            'Ignore all conflict',
          ],
          answer: 1,
          explain: 'Not passivity but deep rest: the subduing is the Lord’s to work and to time. It’s the crowning form of "He makes us win."',
        },
      ],
    },
    lesson: 'Lesson 1 seated you at a table in the presence of your enemies; this lesson tells you what God is doing about those enemies while you sit there — and it is the boldest promise yet. It is the single most-quoted Old Testament verse in the entire New Testament: "The LORD said unto my Lord, Sit thou at my right hand, until I make thine enemies thy footstool" (Psalm 110:1). The whole meaning is in two verbs and who performs each one. The one addressed is told to SIT — and sitting, in Scripture, is the posture of rest, of enthronement, of finished work. And the LORD Himself takes up the other verb: "until I make thine enemies thy footstool." A footstool is what a king rests his feet upon; to make your enemies your footstool is to place every opposing thing under your feet, subdued. Now hold those two verbs together and feel the relief in it: your job is to sit; the subduing is God’s job. You are not commanded anywhere to manufacture the victory by the sheer force of your own effort — you are invited to be seated while He accomplishes it. This is the deepest version of the truth the last series ended on, that He makes us win. And it is first and forever true of Jesus. Hebrews shows Him doing exactly this: "But this man, after he had offered one sacrifice for sins for ever, sat down on the right hand of God; from henceforth expecting till his enemies be made his footstool" (Hebrews 10:12-13). Look at the seated Christ — His work of salvation finished ("one sacrifice for sins for ever"), so He sits, and He is simply EXPECTING, waiting, because the subjection of His enemies is guaranteed; it is only a matter of the Father’s timing. And here is why this touches you directly: by faith you are joined to Him, "raised up together, and made to sit together in heavenly places in Christ Jesus" (Ephesians 2:6). His seat is your seat. His guaranteed victory is the one you are seated inside of. So this lesson quietly dismantles the exhausting instinct to conquer every enemy by your own strength — the clawing, the scrambling, the sleepless strategizing to defeat what opposes you. The word to you is the same word: sit. Not passivity — this is the deep, active rest of someone who genuinely trusts that the subduing belongs to the Lord and that His timing is right. You stay at the table He set. You do your faithful part. And you let the same God who prepared the meal also put what stands against it under your feet — because the enemies becoming a footstool was never your work to force. It is His hand, in His time, as sure as the throne of Christ Himself.',
    facilitator: {
      talkingPoints: [
        'Psalm 110:1 is the most-quoted OT verse in the NT. Two verbs, two doers: YOU sit; the LORD makes the footstool. The subduing is His work.',
        'Sitting = rest, enthronement, finished work — not passivity, but the active rest of trust. You’re invited to be seated while He conquers.',
        'First and fully about Jesus: Hebrews 10:12-13 — He "sat down... expecting till his enemies be made his footstool." The seated Christ guarantees the outcome.',
        'By union with Him we’re "made to sit together... in Christ" (Ephesians 2:6) — His seat is our seat, His victory ours.',
        'The crowning form of "He makes us win": stop clawing to conquer by your own arm; sit, trust, and let Him make the footstool in His time.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Psalm 110:1 and Hebrews 10:12-13 — ask, "who does the sitting, and who makes the footstool?" | The big idea, in your own words (8): the two verbs; sitting as rest not passivity; the subduing is God’s job. | Go deeper — the Word on the table & the mind (10): the seated Christ guarantees it; we’re seated in Him (Ephesians 2:6); the deepest "He makes us win." | Reflect together (8): use the prompts; name where they’re clawing to conquer. | Take it with you (3): each person hands God the subduing of one thing and chooses to REST in it this week.',
      discussionPrompts: [
        'Where are you trying to "make your own footstool" — conquer something by your own strength?',
        'What’s the difference between passivity and the active REST of sitting while God works?',
        'How does it change things that this is first about Jesus, and you’re seated IN Him?',
        'What would it look like to sit and trust the timing this week, instead of forcing the win?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 3 — The Meek Inherit
  {
    id: 'tf3-the-meek-inherit',
    title: 'The Meek Inherit',
    bigIdea: 'The world says the aggressive take everything; Jesus says the opposite: "Blessed are the meek: for they shall inherit the earth." Meekness is not weakness — it is strength under Yahweh’s control, power that has learned to be gentle and to trust God instead of grabbing. Moses, who faced down Pharaoh, is called the meekest man on earth. Jesus, with all authority, calls Himself "meek and lowly in heart." And notice the verb: the meek INHERIT — they don’t seize, they receive what a Father hands down. You don’t have to grab your seat or force your future; the meek are given the earth, because they trusted the God who gives it.',
    inApp: 'Find one place today where your instinct is to grab, push, or force your way — and choose the meek move instead: yield, trust, wait on God. Say it: "I don’t have to seize it; the meek inherit. I’ll trust You to hand me what’s mine." Watch what strength-under-control feels like.',
    anchor: {
      ref: 'Matthew 5:5; Numbers 12:3',
      theme: 'Blessed are the meek, for they shall inherit the earth. Meekness is strength under God’s control (Moses, the meekest man; Jesus, meek and lowly) — the meek receive, they don’t grab.',
    },
    benefits: [
      'A redefinition that frees you: meekness is strength under control, not weakness or being a doormat.',
      'Rest from the exhausting grab-it-all race — the meek INHERIT; they receive what the Father hands down.',
      'Strong role models — Moses (the meekest, yet faced Pharaoh) and Jesus (all authority, yet meek and lowly).',
      'Freedom from forcing your future — you trust the God who gives, instead of seizing.',
      'A promise with staggering scope — the meek inherit the EARTH; God’s math is not the world’s.',
    ],
    levels: {
      child: 'The world says: push, grab, and be the loudest to get what you want. But Jesus said the opposite! "Blessed are the meek: for they shall inherit the earth" (Matthew 5:5). "Meek" does NOT mean weak or scared. Meek means strong on the inside but gentle on the outside — like a big, powerful horse that lets a child lead it. It’s strength that stays calm and trusts God. Guess who the Bible says was the MEEKEST man on the whole earth? Moses — and he stood up to a mighty king (Pharaoh)! So meek people are actually really strong. And "inherit" means to be GIVEN something, like a gift a dad passes down to his kids — you don’t have to grab it or fight for it. So you don’t have to push and shove to get good things. Be meek — strong and gentle and trusting God — and God gives you what’s yours!',
      teen: 'The world runs on a simple rule: the aggressive win, the pushy get ahead, grab yours before someone else does. Jesus flipped it completely: "Blessed are the meek: for they shall inherit the earth" (Matthew 5:5). First, kill the myth — meek does NOT mean weak, timid, or a pushover. Meekness is strength UNDER CONTROL — real power that has learned to stay gentle and trust God instead of grabbing. Think of a trained warhorse or a black belt who stays calm: all that force, harnessed. Two examples prove it. Moses — the man who stared down Pharaoh and led a nation — is literally called "very meek, above all the men which were upon the face of the earth" (Numbers 12:3). And Jesus, who has ALL authority, said, "I am meek and lowly in heart" (Matthew 11:29). So meekness is not the opposite of strength; it’s strength that trusts God enough not to force things. And catch the verb Jesus uses: the meek INHERIT the earth. They don’t seize it, don’t hustle it, don’t take it by force — they inherit it, the way a kid receives what a father hands down. That’s the whole point: you don’t have to grab your seat or force your future. Do your part, stay meek, and trust the God who GIVES the inheritance to hand you what’s yours.',
      senior: 'The seasoned believer has lived long enough to see the world’s creed — that the aggressive inherit the earth — fail on its own terms, and to find the truth in Jesus’ great reversal: "Blessed are the meek: for they shall inherit the earth" (Matthew 5:5). The word rendered "meek" (praus) carried, in its era, the sense of strength brought under control — a powerful animal broken to the bridle, force harnessed rather than force absent. Meekness is therefore not timidity, servility, or weakness of will; it is power submitted to God, the gentleness of one strong enough not to grasp. Scripture’s exemplars settle the point beyond dispute: Moses, who confronted Pharaoh and led a nation through the wilderness, is called "very meek, above all the men which were upon the face of the earth" (Numbers 12:3); and the Lord Himself, possessing all authority in heaven and earth, says, "Take my yoke upon you, and learn of me; for I am meek and lowly in heart" (Matthew 11:29). Note also the verb Christ selects: the meek do not seize or conquer the earth — they INHERIT it. Inheritance is received, not extorted; it is the gift of a Father to His children, bestowed in His time and by His will. Here is the quiet subversion of the whole worldly economy of grasping: the promised inheritance falls not to the one who takes but to the one who trusts. For a life that has watched the grasping lose what they grabbed, this is deep vindication and deeper rest — the meek need not force their future or fight for their seat, because the God who gives the inheritance is faithful to hand it down. Strength under His control, and an inheritance received from His hand: that is the meekness that inherits the earth.',
    },
    quiz: {
      questions: [
        {
          q: 'What does "meek" actually mean in Matthew 5:5?',
          options: [
            'Weak, timid, a pushover',
            'Strength UNDER control — power harnessed, gentle enough not to grab, trusting God',
            'Lazy',
          ],
          answer: 1,
          explain: 'Meekness is strength submitted to God, not weakness. Moses (who faced Pharaoh) is called the meekest man; Jesus, with all authority, calls Himself meek.',
        },
        {
          q: 'What verb does Jesus use — how do the meek get the earth?',
          options: [
            'They seize it by force',
            'They INHERIT it — receive it as a gift handed down by the Father, not grabbed',
            'They buy it',
          ],
          answer: 1,
          explain: 'Inheritance is received, not extorted. You don’t have to grab your seat or force your future; the meek are given the earth.',
        },
        {
          q: 'Who does Scripture name to prove meekness isn’t weakness?',
          options: [
            'No one',
            'Moses ("very meek, above all men," yet faced Pharaoh) and Jesus ("meek and lowly," yet all authority)',
            'Only weak people',
          ],
          answer: 1,
          explain: 'The two strongest figures are called meek — proof that meekness is power under God’s control, not the absence of strength.',
        },
      ],
    },
    lesson: 'The world has one loud rule about how you get ahead: be aggressive, push, grab yours before somebody else does, because the strong take everything. Jesus stood that rule completely on its head in a single sentence: "Blessed are the meek: for they shall inherit the earth" (Matthew 5:5). Before that can land, we have to kill a myth, because "meek" is one of the most misunderstood words in the Bible. Meek does NOT mean weak, timid, spineless, or a pushover. The word Jesus used carried the sense of strength brought under control — like a powerful warhorse trained to the bridle, or great force harnessed rather than force that isn’t there. Meekness is power submitted to God: the gentleness of someone who is actually strong enough not to grasp. And Scripture proves it with two figures nobody would call weak. Moses — the man who stared down Pharaoh, called down plagues, and led an entire nation out of slavery and through the wilderness — is described as "very meek, above all the men which were upon the face of the earth" (Numbers 12:3). The meekest man alive was also one of the boldest. And the Lord Jesus, who has all authority in heaven and on earth, said of Himself, "Take my yoke upon you, and learn of me; for I am meek and lowly in heart" (Matthew 11:29). If Moses and Jesus are the meek ones, then meekness is plainly not the opposite of strength — it IS strength, the kind that trusts God enough not to force things. Now look closely at the verb Jesus chose, because it is the hinge of the whole teaching: the meek INHERIT the earth. He did not say the meek seize the earth, or conquer it, or hustle and grab their way to it. They inherit it — and an inheritance is received, not extorted. It is what a Father hands down to His children, given in His time and by His will. There is the quiet subversion of the entire worldly economy of grasping: the promised inheritance does not go to the one who takes; it goes to the one who trusts. And that ties this lesson straight back to the table and the footstool. You do not have to grab your seat at the table — the Shepherd sets it. You do not have to conquer your own enemies — the LORD makes the footstool. And you do not have to seize your future by force — the meek inherit the earth. All three say the same freeing thing in different words: your part is to trust and receive; His part is to give. So the next time your instinct is to push, grab, or force your way to what you want, remember there is another way that Jesus called blessed — the way of strength under God’s control, the way that yields and waits and trusts, the way that ends not with less but with an inheritance as vast as the earth itself. The meek are not the losers of the story. They are the heirs.',
    facilitator: {
      talkingPoints: [
        'Jesus reverses the world’s rule: not the aggressive, but "the meek... shall inherit the earth" (Matthew 5:5).',
        'Kill the myth: meek ≠ weak. It’s strength UNDER control — power harnessed, gentle enough not to grasp, trusting God.',
        'The proof: Moses (faced Pharaoh, yet "very meek, above all men," Numbers 12:3) and Jesus (all authority, yet "meek and lowly," Matthew 11:29).',
        'The verb matters: the meek INHERIT — receive what the Father hands down; they don’t seize or force it.',
        'Ties to the series: don’t grab the seat (He sets the table), don’t conquer the enemies (He makes the footstool), don’t force the future (the meek inherit). Trust and receive.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Matthew 5:5 and Numbers 12:3 — ask, "what do you PICTURE when you hear the word meek?" | The big idea, in your own words (8): meek = strength under control, not weakness; the warhorse/black-belt image; Moses and Jesus. | Go deeper — the Word on the table & the mind (10): the verb "inherit" vs "seize"; the meek receive what a Father gives; tie to the table + footstool. | Reflect together (8): use the prompts; where do they grab instead of trust? | Take it with you (3): each person picks one "grab" instinct to replace with the meek move (yield, trust, wait) this week.',
      discussionPrompts: [
        'What did you used to think "meek" meant — and how does Moses/Jesus change that?',
        'Where in your life do you grab, push, or force when you could trust and receive?',
        'What’s the difference between seizing something and inheriting it?',
        'What would "strength under God’s control" look like in a situation you’re facing right now?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 4 — A Sound Mind, Not a Spirit of Fear
  {
    id: 'tf4-a-sound-mind-not-fear',
    title: 'A Sound Mind, Not a Spirit of Fear',
    bigIdea: 'Paul tells Timothy exactly what God did and did not give: "God hath not given us the spirit of fear; but of power, and of love, and of a sound mind." Read it as an inventory of what’s actually yours. The fear that grips and paralyzes — that is NOT from God, so you can refuse it as a counterfeit. What He DID give is power, love, and a sound mind: a settled, disciplined, clear mind that fear cannot run. This is the mind of the one seated at the table — not anxious, not scrambling, but kept "in perfect peace" because it is stayed on Him. You don’t have to live gripped by fear; a sound mind is standard-issue for the children of God.',
    inApp: 'Name the fear that’s been loudest in your mind lately. Then say the truth over it: "This spirit of fear is not from God — He gave me power, love, and a sound mind." Trade one anxious thought today for a settled one by fixing your mind on Him, and notice the peace that "passeth all understanding."',
    anchor: {
      ref: '2 Timothy 1:7; Isaiah 26:3',
      theme: 'God did not give a spirit of fear, but of power, love, and a sound mind; He keeps in perfect peace the mind stayed on Him. Fear is a counterfeit to refuse; the sound mind is yours.',
    },
    benefits: [
      'A clear line to draw: the gripping, paralyzing fear is NOT from God — you can refuse it as a counterfeit.',
      'An inventory of what’s actually yours — power, love, and a sound mind — standard-issue for God’s children.',
      'Peace that guards you: "perfect peace" for the mind stayed on Him; peace that "passeth all understanding."',
      'Freedom from anxiety running your decisions — a sound mind is settled, disciplined, and clear.',
      'The mind that fits the table — not scrambling, but kept, because it’s fixed on the Shepherd.',
    ],
    levels: {
      child: 'Sometimes we feel scared — and the Bible tells us something important about that feeling. "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind" (2 Timothy 1:7). Did you catch it? The scared, frozen, can’t-think feeling — that does NOT come from God! So when big fear tries to boss you around, you can say, "Nope, you’re not from God!" What God DID give you is three good things: POWER (strength to do what’s right), LOVE (a big caring heart), and a SOUND MIND (a calm, clear, thinking-straight mind). And God gives peace too: "Thou wilt keep him in perfect peace, whose mind is stayed on thee" (Isaiah 26:3) — that means when you keep thinking about God and trusting Him, He keeps your heart calm and peaceful. So you don’t have to let fear be the boss. God gave you a strong, loving, calm mind instead!',
      teen: 'Fear is real, and if you’ve ever felt it grip you — heart racing, mind spinning, can’t think straight — you need this verse: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind" (2 Timothy 1:7). Read it as an inventory of what God actually handed you. First, what He did NOT give: "the spirit of fear" — that gripping, paralyzing dread. So when it shows up, you can name it as a counterfeit and refuse it: this isn’t from God, so it doesn’t get to run me. Then, what He DID give: power (real strength), love (a heart aimed at others, not self-protection), and a "sound mind" — a settled, disciplined, clear-thinking mind. Not anxious. Not scrambling. Clear. And there’s a how attached to it: "Thou wilt keep him in perfect peace, whose mind is stayed on thee" (Isaiah 26:3). "Stayed on thee" means fixed on God — when your mind keeps leaning on Him instead of spinning on the fear, He keeps it in PERFECT peace. Paul says the same thing happens when you pray: "the peace of God, which passeth all understanding, shall keep your hearts and minds" (Philippians 4:7). This is the mind that matches the table from Lesson 1 — not the panicked mind fighting for its life, but the settled mind of someone the Shepherd has already seated and fed. A sound mind isn’t a rare gift for a few — it’s standard-issue for God’s kids. Refuse the fear; take the sound mind.',
      senior: 'To a young Timothy facing real intimidation, Paul writes a verse the seasoned believer returns to across a lifetime of fears faced and outlived: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind" (2 Timothy 1:7). The verse is best read as a divine inventory. First, a negation that grants permission to refuse: the "spirit of fear" — the Greek deilia, a cowering, paralyzing dread — is expressly NOT God’s gift, and what God has not given, the believer is not obligated to house. Then the threefold endowment that IS given: power (dunamis, effective strength), love (agape, the self-giving that casts out fear, 1 John 4:18), and a "sound mind" (sophronismos — a disciplined, self-controlled, sound-judging mind). The sound mind is not the absence of trouble but the presence of a settled, governed clarity in the midst of it. Its mechanism is given plainly elsewhere: "Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee" (Isaiah 26:3) — the mind fixed (stayed) upon God is kept in a peace the Hebrew doubles for emphasis, shalom shalom, perfect peace. And Paul names the same guard as the fruit of prayer: "the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus" (Philippians 4:7). This is precisely the mind that befits the one seated at the table of Lesson 1 and resting under the promise of Lesson 2 — not the frantic mind of one still fighting for survival, but the composed mind of one already provided for and enthroned in Christ. For a life that has known fear intimately, the pastoral word is both permission and provision: the paralyzing fear is a counterfeit to be refused, and the sound mind, kept in perfect peace by a gaze fixed on God, is the settled inheritance of every child of His.',
    },
    quiz: {
      questions: [
        {
          q: 'According to 2 Timothy 1:7, what did God NOT give us?',
          options: [
            'Power',
            'The spirit of FEAR — the gripping, paralyzing dread; it’s not from God, so it can be refused',
            'A sound mind',
          ],
          answer: 1,
          explain: 'The spirit of fear is expressly not God’s gift. What He has not given, you are not obligated to house — you can name it a counterfeit and refuse it.',
        },
        {
          q: 'What three things DID God give (2 Timothy 1:7)?',
          options: [
            'Money, fame, and comfort',
            'Power, love, and a sound mind — a settled, disciplined, clear-thinking mind',
            'Fear, worry, and doubt',
          ],
          answer: 1,
          explain: 'Power (real strength), love (self-giving that casts out fear), and a sound mind — standard-issue for God’s children.',
        },
        {
          q: 'How is the mind kept in "perfect peace" (Isaiah 26:3)?',
          options: [
            'By never facing any trouble',
            'By being STAYED (fixed) on God and trusting Him — the mind leaned on Him is kept in peace',
            'By worrying harder',
          ],
          answer: 1,
          explain: 'A sound mind isn’t the absence of trouble but settled clarity within it — kept in perfect peace when it’s fixed on Him (and Philippians 4:7, peace that passeth understanding).',
        },
      ],
    },
    lesson: 'The one seated at the Shepherd’s table (Lesson 1) and resting under God’s promise to make the footstool (Lesson 2) has a certain kind of mind — and this lesson names it. Paul is writing to young Timothy, who is facing real fear and intimidation, and he hands him a verse that God’s people have leaned on ever since: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind" (2 Timothy 1:7). The best way to read it is as an inventory — a plain list of what God did and did not put in your account. Start with what He did NOT give, because that one word sets you free: "the spirit of fear." Not caution, not reverence, but that gripping, cowering, paralyzing dread — the kind that makes your heart race and your mind spin until you can’t think. Paul says flatly that this did not come from God. And that matters enormously, because what God has not given you, you are under no obligation to keep in the house. When that fear shows up and tries to run your decisions, you can name it exactly for what it is — a counterfeit, not from your Father — and refuse it. Then look at what He DID give, three real things that are actually yours: power (genuine, effective strength), love (a heart turned toward others, the kind that casts out fear), and a "sound mind" — a settled, disciplined, self-controlled, clear-judging mind. Notice that a sound mind is not defined as a life with no trouble in it; it is a mind that stays clear and governed in the middle of trouble. And Scripture even hands you the mechanism, the how. "Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee" (Isaiah 26:3). The key word is "stayed" — fixed, leaned, propped upon God. A mind that keeps turning back to Him instead of spinning on the fear is kept in a peace so complete the Hebrew says it twice for emphasis. Paul describes the very same guard as the fruit of prayer: "the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus" (Philippians 4:7) — a peace that doesn’t even wait for you to understand your circumstances before it garrisons your heart. Put it all together and you can see why this is the mind that fits everything the series has said. The person still fighting for survival has a frantic, fear-run mind. But the person Yahweh has already seated at the table, already promised to subdue every enemy, already named an heir — that person can carry a settled mind, because the outcome is in the Shepherd’s hands, not theirs. So this is not a rare gift reserved for the spiritually elite. A sound mind is standard-issue for the children of God. When fear grips you, do two things: refuse the counterfeit that never came from Him, and fix your mind back on the God who set your table — and let the perfect peace that guards the seated heart do its quiet, powerful work.',
    facilitator: {
      talkingPoints: [
        'Read 2 Timothy 1:7 as an inventory: what God did NOT give (the spirit of fear) and what He DID (power, love, a sound mind).',
        'The freeing negation: fear that grips and paralyzes is NOT from God — a counterfeit you’re not obligated to house; name it and refuse it.',
        'A "sound mind" = settled, disciplined, clear judgment — not the absence of trouble but governed clarity within it.',
        'The mechanism: "perfect peace" for the mind "stayed on thee" (Isaiah 26:3); the peace that "passeth all understanding" guards the heart (Philippians 4:7).',
        'It’s the mind that fits the table: not frantic survival, but the settled mind of one already seated, provided for, and made an heir.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read 2 Timothy 1:7 and Isaiah 26:3 — ask, "what does fear do to your thinking?" | The big idea, in your own words (8): the inventory; fear is not from God (refuse it); power/love/sound mind is yours. | Go deeper — the Word on the table & the mind (10): "sound mind" as governed clarity; the mind "stayed on" God kept in perfect peace; peace that passeth understanding. | Reflect together (8): use the prompts; be gentle with real fear/anxiety in the room. | Take it with you (3): each person names their loudest fear, refuses it as not-from-God, and fixes their mind on Him for one settled thought this week.',
      discussionPrompts: [
        'What does fear actually do to your ability to think clearly?',
        'What changes when you hear that the gripping kind of fear is NOT from God — a counterfeit you can refuse?',
        'What does "a sound mind" look like in a real pressure you’re facing?',
        'Where does your mind need to be "stayed on" God this week instead of spinning on the fear?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 5 — Programmed by His Word (the Renewed Mind)
  {
    id: 'tf5-programmed-by-his-word',
    title: 'Programmed by His Word (the Renewed Mind)',
    bigIdea: 'Here is how the sound mind is kept and the character is formed — Darrell calls it "programming yourself with His 4th-dimensional Data." Paul calls it the renewed mind: "be not conformed to this world: but be ye transformed by the renewing of your mind." The world is always trying to install its programming in you; transformation runs the other direction — you overwrite it with His Word. That means actively "casting down imaginations... and bringing into captivity every thought to the obedience of Christ," and meditating on His Word day and night. You are not stuck with the mind the world gave you. Feed it His data, and He renews it — that’s the character Yahweh is developing in the one He seated at the table.',
    inApp: 'Catch one thought today that exalts itself against what God says (a lie, a fear, a "you’ll never..."). Take it captive: name it, and replace it out loud with a specific truth from His Word. Then feed your mind one verse to meditate on today — that’s installing His data. Say: "I’m not conformed; I’m being transformed by the renewing of my mind."',
    anchor: {
      ref: 'Romans 12:2; 2 Corinthians 10:5',
      theme: 'Don’t be conformed to this world; be transformed by the renewing of your mind — casting down imaginations and taking every thought captive to Christ. Overwrite the world’s program with His Word.',
    },
    benefits: [
      'A real mechanism for change — you’re not stuck with the mind the world gave you; the renewed mind is transformable.',
      'Active tools, not wishful thinking — cast down lies, take thoughts captive, meditate on His Word.',
      'Discernment as a payoff — the renewed mind can "prove" the good, acceptable, perfect will of God.',
      'Character formed on purpose — the sound mind is kept and grown by what you feed it.',
      'The capstone of the series — the identity (table, footstool, meek, sound mind) is installed and held by His Word.',
    ],
    levels: {
      child: 'Your mind is a little like a computer — whatever you put INTO it is what it runs on. The world tries to load its stuff into your mind all day (through screens, words, and worries). But the Bible says you can load something better: "be not conformed to this world: but be ye transformed by the renewing of your mind" (Romans 12:2). "Conformed" means copying the world; "transformed" means being CHANGED into something new and better — by RENEWING your mind, which means filling it up fresh with God’s truth! And when a bad or scary thought pops up, the Bible says you can grab it and hand it to Jesus — "bringing into captivity every thought to the obedience of Christ" (2 Corinthians 10:5). That’s like catching a wrong thought and trading it for a true one. So how do you renew your mind? By putting God’s Word IN it — reading it, remembering it, thinking about it. Feed your mind God’s truth, and He makes it new!',
      teen: 'This is the how behind the whole series — Darrell calls it "programming yourself with God’s 4th-dimensional Data," and the Bible calls it the renewed mind: "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God" (Romans 12:2). Think of it like an operating system. The world is constantly trying to install ITS programming in you — its fears, its lies, its "this is just how you are." Being "conformed" is letting that download run. "Transformed" is the opposite direction: you overwrite it by RENEWING your mind — feeding it God’s truth until it starts running on His data instead. And it’s active, not passive. Paul describes the actual move: "casting down imaginations, and every high thing that exalteth itself against the knowledge of God, and bringing into captivity every thought to the obedience of Christ" (2 Corinthians 10:5). So when a thought pops up that contradicts what God says — a lie, a fear, a "you’ll never" — you don’t just let it run. You catch it, name it, and replace it with truth. Add meditating on His Word "day and night" (Joshua 1:8), and you’re installing the data on purpose. Here’s the freeing part: you are NOT stuck with the mind the world handed you. Feed it His Word, take your thoughts captive, and He renews it — and THAT is the character God is building in the person He’s already seated at the table. The sound mind from Lesson 4 is kept and grown by what you feed it.',
      senior: 'This final lesson supplies the mechanism by which the sound mind is maintained and godly character is formed — what Darrell frames as programming oneself with God’s "4th-dimensional Data," and what Paul calls the renewing of the mind: "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God" (Romans 12:2). The two verbs are set in deliberate opposition. "Conformed" (syschematizo) is the passive pressure of the age pressing the believer into its mold; "transformed" (metamorphoo — the word behind metamorphosis) is an inward, ongoing change whose instrument is named precisely: "the renewing of your mind." The mind is not static; it is the very site of transformation, and it is renewed by being saturated with God’s truth rather than the world’s. This renewal is active and even militant: "casting down imaginations, and every high thing that exalteth itself against the knowledge of God, and bringing into captivity every thought to the obedience of Christ" (2 Corinthians 10:5). The believer is not the passive host of every thought that arrives; false and self-exalting thoughts are to be pulled down and every thought marched captive into obedience to Christ. The positive discipline is ancient and constant: "This book of the law shall not depart out of thy mouth; but thou shalt meditate therein day and night" (Joshua 1:8), and "Set your affection on things above, not on things on the earth" (Colossians 3:2). Observe the promised fruit — the renewed mind can "prove," that is, discern and approve, the good and perfect will of God; sound judgment is the harvest of a mind fed on Scripture. For the seasoned saint this is the crown of the whole series: the identity Yahweh confers — seated at the table, enemies made a footstool, the meekness that inherits, the sound mind that fear cannot rule — is installed, guarded, and matured by the deliberate, lifelong feeding of the mind upon His Word. Character is not accidental; it is the fruit of a mind renewed. Program the mind with His data, take every thought captive to Christ, and become, increasingly, what He has already declared you to be.',
    },
    quiz: {
      questions: [
        {
          q: 'What are the two opposite directions in Romans 12:2?',
          options: [
            'Sleeping and waking',
            'CONFORMED to the world (the world’s program) vs TRANSFORMED by the renewing of your mind (His truth)',
            'Rich and poor',
          ],
          answer: 1,
          explain: 'Conformed = letting the world’s programming run; transformed = overwriting it by renewing your mind with God’s truth. You’re not stuck with the mind the world gave you.',
        },
        {
          q: 'What is the active move in 2 Corinthians 10:5 when a false thought arrives?',
          options: [
            'Let every thought run freely',
            'Cast it down and bring "every thought to the obedience of Christ" — take it captive, replace it with truth',
            'Ignore your thoughts entirely',
          ],
          answer: 1,
          explain: 'You’re not the passive host of every thought. False, self-exalting thoughts get pulled down and marched captive to Christ.',
        },
        {
          q: 'What is the fruit of a renewed mind (Romans 12:2)?',
          options: [
            'Nothing changes',
            'You can "prove" — discern and approve — the good, acceptable, and perfect will of God',
            'You stop thinking',
          ],
          answer: 1,
          explain: 'Sound judgment is the harvest of a mind fed on Scripture. Character is formed by what you feed the mind — His "4th-dimensional Data."',
        },
      ],
    },
    lesson: 'The last four lessons gave you an identity: seated at the Shepherd’s table, your enemies being made a footstool, meek enough to inherit the earth, carrying a sound mind that fear cannot run. This final lesson answers the obvious question — HOW is that identity kept and grown into real character? Darrell frames it vividly: you program yourself with God’s "4th-dimensional Data." Paul calls it the renewing of the mind, and he sets it in a sharp contrast: "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God" (Romans 12:2). Picture your mind as an operating system, and notice the two directions those verbs point. "Conformed" is the passive one — it is the constant pressure of the world pressing you into its mold, downloading its fears, its lies, its "this is just how things are and how you are." Left alone, that program runs by default. "Transformed" — the word is the one behind "metamorphosis" — runs the opposite direction: a real, inward change, and Paul names its exact instrument, "the renewing of your mind." Your mind is not fixed hardware you’re stuck with; it is the very site of transformation, and it gets renewed by what you feed it — His truth instead of the world’s. And this renewal is not passive daydreaming; it is active, even militant. Paul describes the actual operation: "casting down imaginations, and every high thing that exalteth itself against the knowledge of God, and bringing into captivity every thought to the obedience of Christ" (2 Corinthians 10:5). Read what that gives you permission to do. You are not the helpless host of every thought that walks into your head. When a thought shows up that exalts itself against what God has said — a lie about your worth, a fear about your future, a "you’ll never" — you do not have to let it set up residence and run the place. You cast it down. You take it captive. You march it into obedience to Christ and replace it with what is true. And alongside pulling down the false, you feed in the true: "This book of the law shall not depart out of thy mouth; but thou shalt meditate therein day and night" (Joshua 1:8), and "Set your affection on things above, not on things on the earth" (Colossians 3:2). That is installing His data on purpose, day after day. Here is the freedom in all of it, and the reason it is the right place to end: you are not stuck with the mind the world handed you. Feed it His Word, take your thoughts captive to Christ, and He renews it — and a renewed mind even gains the ability to "prove," to discern and approve, the good and perfect will of God. This is the character Yahweh is developing in the very person He has already seated at the table. The identity is His gift; the daily programming of the mind with His Word is how that gift is guarded and grown until you become, more and more, what He has already declared you to be — seated, meek, sound-minded, and unafraid.',
    facilitator: {
      talkingPoints: [
        'The HOW behind the whole series — Darrell’s "program yourself with His 4th-dimensional Data" = Paul’s renewed mind (Romans 12:2).',
        'Two directions: "conformed" (the world’s program runs by default) vs "transformed" by "the renewing of your mind" (overwrite it with His truth).',
        'Active, not passive: "casting down imaginations... bringing into captivity every thought to the obedience of Christ" (2 Corinthians 10:5) — you’re not the helpless host of every thought.',
        'Feed the true in: meditate on His Word "day and night" (Joshua 1:8); "set your affection on things above" (Colossians 3:2). Installing the data on purpose.',
        'The fruit + the capstone: a renewed mind "proves" God’s good and perfect will; the identity (table, footstool, meek, sound mind) is installed and grown by His Word.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Romans 12:2 and 2 Corinthians 10:5 — ask, "what’s been programming your mind lately?" | The big idea, in your own words (8): the mind as an OS; conformed vs transformed; renewed by what you feed it. | Go deeper — the Word on the table & the mind (10): taking thoughts captive; meditating day and night; the renewed mind proves God’s will; ties the whole series together. | Reflect together (8): use the prompts. | Take it with you (3): each person catches one self-exalting thought, takes it captive + replaces it with truth, and picks one verse to meditate on this week.',
      discussionPrompts: [
        'What has been "programming" your mind lately — and is it the world’s data or God’s?',
        'What’s a recurring thought that "exalts itself against" what God says, that you could take captive?',
        'What does it look like, practically, to "renew your mind" this week?',
        'How does feeding your mind God’s Word connect to the table, the footstool, the meekness, and the sound mind?',
      ],
    },
  },
];

export const TABLE_LESSONS_INTEREST_TAG = '[Table & Footstool interest]';
export const TABLE_LESSONS_HELPER_TAG = '[Table & Footstool helper]';

export function resolveTableLessonsCohort(localCohort = null) {
  return resolveCohortGeneric(localCohort, TABLE_LESSONS_CONFIRMED_COHORT, TABLE_LESSONS_PROPOSED_COHORT_START);
}

export function buildTableLessonsSchedule() {
  return TABLE_LESSONS_MODULES.map((m, i) => ({ ...m, week: i + 1, date: null, weekday: null }));
}

export function tableLessonsProgressSummary(progress = {}) {
  return progressSummaryFor(TABLE_LESSONS_MODULES, progress);
}

export function exportTableLessonsCurriculumMarkdown() {
  return exportCurriculumMarkdownFor(
    { meta: TABLE_LESSONS_META, sessionFlow: TABLE_LESSONS_SESSION_FLOW, modules: TABLE_LESSONS_MODULES },
    null,
  );
}

// Tutor course-meta — the per-lesson solo guide introduces itself as a Word-first,
// grace-centered companion that seats the anxious at the table, rests them under
// the footstool promise, and helps them renew the mind with His Word.
export const TABLE_LESSONS_TUTOR_META = {
  title: TABLE_LESSONS_META.title,
  intro: 'You are a warm, grace-centered guide for a Word-first, non-denominational lesson series called "The Table & the Footstool: Meek, Sound-Minded, Seated."',
  posture: 'Guide ONE learner — who may be a child, a teen, an adult, or a seasoned believer — through the lesson, matching your words and pace to their age. The series builds in order: (1) a TABLE prepared in the presence of enemies — provision and honor you receive, you don’t earn (Psalm 23:5), (2) enemies made a FOOTSTOOL — you sit, He subdues; first true of the seated Christ (Psalm 110:1; Hebrews 10:12-13), (3) the MEEK inherit — meekness is strength under God’s control, not weakness; the meek receive, they don’t grab (Matthew 5:5; Moses, Numbers 12:3), (4) a SOUND MIND, not a spirit of fear — refuse the counterfeit fear, keep the mind stayed on God in perfect peace (2 Timothy 1:7; Isaiah 26:3), and (5) programmed by His WORD — the renewed mind, casting down imaginations and taking every thought captive to Christ (Romans 12:2; 2 Corinthians 10:5), which Darrell frames as "programming yourself with His 4th-dimensional Data." The through-line: Yahweh sets the table and makes the footstool — the honor and the victory are His; you receive the identity and grow it by feeding your mind His Word. Be relentlessly WELL-BEING-POSITIVE: settle the anxious into rest and honor, never striving or self-exaltation; meekness is strength under God’s hand, never being a doormat; fear is a counterfeit to refuse, not a verdict. Cite Scripture by reference (KJV, as in the lessons); never invent or paraphrase a verse as if quoting it, and if unsure of a text, say so rather than fabricate. Give Yahweh the glory — He sets the table and makes the footstool.',
};
