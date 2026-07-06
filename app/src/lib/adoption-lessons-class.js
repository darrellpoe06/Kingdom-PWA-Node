// =============================================================================
// adoption-lessons-class — "The Spirit of Adoption: Made Wholly His"
// =============================================================================
// A Word-first, SELF-PACED lesson SERIES on adoption — the grace by which Yahweh
// takes the fatherless, the outsider, and the servant and makes them wholly His
// own: sons and daughters, heirs, family in full. Rides the SAME shared Learn
// engine as the other courses (church-classes.js generics, class-tutor.js,
// learn-framework.js age-adaptive/quiz/graduate->helper), sets `meta.unit` to
// render self-paced "Lessons," and AUTO-joins the Learn hub + Presenter.
//
// FROM DARRELL'S OWN TESTIMONY (already carried in the Generations "Darrell's
// Journey" path): Christina received his daughter K'Shawna as her own -- "by seven
// she is theirs in law and in love -- now our daughter, full stop"; and Bishop
// Gwin became "my father in love, not merely in law." The Spirit of adoption in a
// real house. This series teaches that grace verse by verse, to Yahweh's glory.
//
// THE GAMES ARE LESSONS TOO (Darrell 2026-07-06): the same teaching is playable in
// the Generations game ("The Spirit of Adoption" card) -- a decision walked.
//
// VERIFICATION (DR-0076): every quoted verse is KJV, sourced VERBATIM from the
// in-repo public-domain KJV (app/public/bible/kjv/*.json), never from memory;
// anchors cite a reference + theme gloss. WELL-BEING-POSITIVE: it settles the one
// who has felt like an orphan, an outsider, or a hired hand into full belonging --
// chosen on purpose, wholly family, an heir -- never earning its way in; grace
// adopts, and the honor is Yahweh's.
// =============================================================================

import {
  progressSummaryFor, exportCurriculumMarkdownFor, resolveCohortGeneric,
} from './church-classes.js';

export const ADOPTION_LESSONS_PROPOSED_COHORT_START = null;
export const ADOPTION_LESSONS_CONFIRMED_COHORT = { startDate: null, confirmed: false };

export const ADOPTION_LESSONS_META = {
  key: 'adoption-lessons',
  title: 'The Spirit of Adoption: Made Wholly His',
  audience: 'the whole family and the whole Body — every age',
  tagline: 'Not a servant, not an orphan — a son, a daughter, an heir. Wholly His.',
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
  footer: '_Taught by Darrell Poe · The Church of the Living God + the Poe family · built on PoeTech. Word-first and non-denominational — Scripture is senior to any tradition. Grace-centered, for every age. Grace does not half-adopt — you are wholly His; the honor is Yahweh’s._',
};

export const ADOPTION_LESSONS_SESSION_FLOW = [
  { minutes: 3, name: 'Open in prayer + read the Scripture' },
  { minutes: 8, name: 'The big idea, in your own words' },
  { minutes: 10, name: 'Go deeper — the Word on adoption' },
  { minutes: 8, name: 'Reflect together' },
  { minutes: 3, name: 'Take it with you' },
];
export const ADOPTION_LESSONS_SESSION_MINUTES = ADOPTION_LESSONS_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0);

export const ADOPTION_LESSONS_MODULES = [
  // ---------------------------------------------------------------------------
  // LESSON 1 — The Spirit of Adoption (not fear again, but Abba)
  {
    id: 'ad1-the-spirit-of-adoption',
    title: 'The Spirit of Adoption',
    bigIdea: 'When Yahweh saves you, He does not hand you back the old spirit of slavery and fear — He gives you the Spirit of adoption. "Ye have not received the spirit of bondage again to fear; but ye have received the Spirit of adoption, whereby we cry, Abba, Father." Abba is the word a small child uses for a daddy they trust completely. So the first thing the Spirit does is put a family name in your mouth: not "Master," not "Sir" — Father. And the Spirit Himself confirms it, bearing witness with your spirit that you really are a child of God. You are not on probation and not a stranger at the door. You have been brought inside and taught to call Him Abba.',
    inApp: 'If you have carried a spirit of fear or "I don’t really belong," name it. Then say the truth the Spirit gives you: "I didn’t receive fear again — I received the Spirit of adoption. Abba, Father." Say "Abba, Father" out loud today as a child who is home, not a servant on trial.',
    anchor: {
      ref: 'Romans 8:15-16',
      theme: 'You did not receive a spirit of bondage to fear again, but the Spirit of adoption, by which you cry "Abba, Father" — and the Spirit witnesses that you are a child of God.',
    },
    benefits: [
      'Freedom from the old spirit of fear and slavery — that is not the spirit you received.',
      'A family name in your mouth — you get to call the Almighty "Abba, Father," the trusting word of a child.',
      'Inner assurance — the Spirit Himself bears witness that you truly are a child of God.',
      'An identity that is received, not earned — you are brought inside, not left at the door on probation.',
      'The ground of the whole series — everything that follows stands on "you are His child now."',
    ],
    levels: {
      child: 'When you belong to God, He gives you something wonderful. The Bible says: "ye have not received the spirit of bondage again to fear; but ye have received the Spirit of adoption, whereby we cry, Abba, Father" (Romans 8:15). "Bondage" means being like a slave, and "fear" means being scared — and God says that is NOT what He gives you! Instead He gives you the "Spirit of adoption." Adoption is when a family chooses a child and makes them their very own forever. And the special word "Abba" is like saying "Daddy" — the name a little kid calls a daddy they love and trust. So God isn’t a scary boss you have to be afraid of. He’s your Father, and you get to call Him "Abba, Daddy"! And God’s Spirit whispers to your heart that it’s really true — "we are the children of God" (Romans 8:16). You belong. You’re His.',
      teen: 'Here’s the first thing that changes when you belong to God, and it’s huge: "For ye have not received the spirit of bondage again to fear; but ye have received the Spirit of adoption, whereby we cry, Abba, Father" (Romans 8:15). Read what He did NOT give you: "the spirit of bondage again to fear" — the old slave-mindset, always scared, always trying to earn your keep. That’s not the spirit you got. What you DID get is "the Spirit of adoption." Adoption is when someone chooses you and makes you legally, permanently, fully their own child — not a foster placement that could end, not a trial run. And notice the word the Spirit puts in your mouth: "Abba." It’s the intimate, trusting word a young kid uses for a daddy they feel completely safe with — closer to "Papa" than "Father, sir." So you don’t relate to God as a nervous servant hoping not to get fired; you relate to Him as a kid who’s home. And you don’t have to just take someone else’s word for it — "The Spirit itself beareth witness with our spirit, that we are the children of God" (Romans 8:16). God’s own Spirit confirms it on the inside. You’re not a stranger at the door or on probation. You’ve been adopted, and taught to call Him Abba.',
      senior: 'The seasoned believer knows the difference between serving God from fear and resting in Him as a child, and Paul names it precisely: "For ye have not received the spirit of bondage again to fear; but ye have received the Spirit of adoption, whereby we cry, Abba, Father" (Romans 8:15). The contrast is deliberate. The "spirit of bondage... to fear" is the disposition of the slave — anxious, servile, forever laboring to secure a standing never quite secured. That, Paul insists, is emphatically NOT what the believer received. What was received is "the Spirit of adoption" (Greek huiothesia — the legal placing of a chosen one as a full son, with all a son’s rights). The evidence of this Spirit is a cry: "Abba, Father." Abba is the Aramaic of intimate family address, the trusting word of a child to a beloved father; that this untranslated household word survives in Paul’s Greek testifies to how startling the intimacy is — the Almighty is addressed not as distant Sovereign but as Father, and by the Spirit’s own prompting. And the assurance is not left to feeling alone: "The Spirit itself beareth witness with our spirit, that we are the children of God" (Romans 8:16) — a dual testimony, God’s Spirit confirming to our spirit the reality of our sonship. For a life that may have long served God dutifully yet still, at times, from the old fear, this is a summons back to the truth of one’s standing: you are not a slave straining to earn a place, but an adopted child assured by the Spirit and taught by Him to say, Abba. Everything else in this series rests on that settled word.',
    },
    quiz: {
      questions: [
        {
          q: 'What spirit did you NOT receive, according to Romans 8:15?',
          options: [
            'The Spirit of adoption',
            'The spirit of bondage / fear again — the anxious slave-mindset',
            'A spirit of power',
          ],
          answer: 1,
          explain: 'You did not get the old spirit of slavery and fear back. What you received is the Spirit of adoption — a child’s standing, not a servant’s.',
        },
        {
          q: 'What word does the Spirit of adoption put in your mouth?',
          options: [
            '"Master" or "Sir"',
            '"Abba, Father" — the intimate, trusting word of a child to a beloved daddy',
            'Nothing',
          ],
          answer: 1,
          explain: 'Abba is family language — the untranslated household word for a trusted father. You address God as a child who is home, not a servant on trial.',
        },
        {
          q: 'How do you know your adoption is real (Romans 8:16)?',
          options: [
            'You just have to hope so',
            'The Spirit Himself bears witness with your spirit that you are a child of God',
            'You earn it over time',
          ],
          answer: 1,
          explain: 'A dual testimony — God’s Spirit confirming to your spirit that you truly are His child. Assurance is given, not merely felt.',
        },
      ],
    },
    lesson: 'This whole series is about one of the most tender things Yahweh does, and it starts the moment you belong to Him. Paul puts it in a single contrast: "For ye have not received the spirit of bondage again to fear; but ye have received the Spirit of adoption, whereby we cry, Abba, Father" (Romans 8:15). Look first at what God did NOT give you back. He did not hand you the "spirit of bondage again to fear" — the mindset of a slave, always anxious, always scrambling to earn a place, never quite sure the standing is secure. That old fear is real, and many of us carried it a long time; but Paul says flatly it is not the spirit you received. What you received instead is "the Spirit of adoption." Adoption is not a temporary arrangement or a trial run that could be revoked — it is the legal, permanent placing of a chosen one as a full child, with every right a child has. And notice the very first thing this Spirit does: He puts a word in your mouth. Not "Master." Not "Sir." "Abba, Father." Abba is a family word — the intimate, trusting name a small child uses for a daddy they feel completely safe with, closer to "Papa" than to a formal "Father." That this little household word survives untranslated right in the middle of Paul’s Greek tells you how astonishing the intimacy is: the Almighty God, the One who set the stars, is addressed by His adopted children as Abba — and it is His own Spirit who prompts the cry. This is the same Spirit of adoption Darrell has watched in his own house: when Christina received his daughter K’Shawna as her own, by seven she was theirs in law and in love — "now our daughter, full stop." Grace does the same for you: it does not keep you at arm’s length as a helper; it brings you inside and teaches you to call God Father. And you are not left to merely hope it took. "The Spirit itself beareth witness with our spirit, that we are the children of God" (Romans 8:16). There is a double testimony going on — God’s Spirit confirming to your own spirit, on the inside, that you really are His child. So if you have been relating to God like a nervous servant hoping not to get fired, hear the first word of this series: that is not your standing anymore. You are not a stranger at the door, not on probation, not a hired hand. You have been adopted, assured by the Spirit, and taught to say the word only a child gets to say: Abba, Father. Everything else rests on that.',
    facilitator: {
      talkingPoints: [
        'The contrast in Romans 8:15: NOT "the spirit of bondage again to fear" (the anxious slave-mindset) — but "the Spirit of adoption."',
        'Adoption (huiothesia) = the legal, permanent placing of a chosen one as a full child, with all a child’s rights. Not a trial run.',
        'The first thing the Spirit does is put a word in your mouth: "Abba, Father" — intimate family language, the trusting word of a child.',
        'Assurance is given, not just felt: "the Spirit itself beareth witness with our spirit, that we are the children of God" (8:16) — a double testimony.',
        'Darrell’s house shows it: Christina received K’Shawna as her own — "now our daughter, full stop." Grace brings you inside, not to arm’s length.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Romans 8:15-16 — ask, "have you ever related to God more like a servant than a child?" | The big idea, in your own words (8): what He did NOT give (fear again) vs what He DID (the Spirit of adoption); the meaning of "Abba." | Go deeper — the Word on adoption (10): adoption as permanent full sonship; the Spirit’s inner witness; tell the K’Shawna testimony if it fits. | Reflect together (8): use the prompts; be tender with anyone who has felt like an orphan or outsider. | Take it with you (3): each person names one place they’ve served from fear, and practices saying "Abba, Father" as a child who is home.',
      discussionPrompts: [
        'Have you related to God more like a nervous servant or a safe-at-home child? Why?',
        'What does it mean to you that the Spirit teaches you to say "Abba"?',
        'Where do you still carry "the spirit of fear" that Paul says you did NOT receive?',
        'How does it help to know the Spirit Himself witnesses that you’re God’s child — you don’t have to just hope?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 2 — No More a Servant, but a Son (and an Heir)
  {
    id: 'ad2-no-more-a-servant-but-a-son',
    title: 'No More a Servant, but a Son',
    bigIdea: 'Adoption cost God something — it is not sentiment, it is redemption. "God sent forth his Son... to redeem them that were under the law, that we might receive the adoption of sons." He bought you out of the old status so He could place you in a new one. And the change is total: "thou art no more a servant, but a son; and if a son, then an heir of God through Christ." A servant works FOR the house hoping to be kept; a son belongs TO the house and inherits it. You didn’t get promoted from a good servant to a great one — you were moved out of the servant category entirely, into the family, with the inheritance attached.',
    inApp: 'Ask where you still live like a servant trying to earn your keep with God — performing, striving, afraid of being let go. Then declare the change: "I am no more a servant, but a son/daughter — and if a child, then an heir." Do one thing today FROM belonging (rest, gratitude, confidence) instead of TO earn it.',
    anchor: {
      ref: 'Galatians 4:4-7',
      theme: 'God sent His Son to redeem us so we might receive the adoption of sons; so you are no more a servant, but a son — and if a son, then an heir of God through Christ.',
    },
    benefits: [
      'A status change, not a promotion — you’re moved out of "servant" into "child," not just a better servant.',
      'It cost God His Son — adoption is redemption, so it’s secure; it wasn’t cheap or casual.',
      'The inheritance attached — "if a son, then an heir of God through Christ." Family comes with the estate.',
      'Freedom from earning your keep — a child belongs to the house; they don’t work to stay in it.',
      'The Spirit crying "Abba" in your heart as proof the placing is real (Galatians 4:6).',
    ],
    levels: {
      child: 'Imagine a kid who works in a big house as a helper, always worried, "If I don’t do a good job, they might send me away." Now imagine the family says, "We don’t want you as a helper — we want you as our own child! Forever!" That’s what God did for you. The Bible says God sent Jesus "to redeem them that were under the law, that we might receive the adoption of sons" (Galatians 4:5). "Redeem" means He paid to set you free. And then: "thou art no more a servant, but a son; and if a son, then an heir of God through Christ" (Galatians 4:7). See the big change? You’re not a worried helper anymore — you’re a child of the family! And an "heir" is someone who gets to share everything the family has. So you don’t have to work to try to keep your place. You already belong. God made you His own.',
      teen: 'This lesson shows you what adoption actually COST and what it changes. First the cost: "But when the fulness of the time was come, God sent forth his Son... to redeem them that were under the law, that we might receive the adoption of sons" (Galatians 4:4-5). "Redeem" means to buy back, to pay to set free — so adoption wasn’t God being casually sentimental; it cost Him His Son. He bought you out of your old status specifically so He could place you in a new one. Now the change, and it’s total: "thou art no more a servant, but a son; and if a son, then an heir of God through Christ" (Galatians 4:7). Catch the difference between a servant and a son. A servant works FOR the house, always hoping to be kept on; a son belongs TO the house and inherits it. You didn’t get upgraded from an okay servant to a great one — you got moved OUT of the servant category entirely and into the family, with the inheritance attached ("if a son, then an heir"). And here’s the proof it’s real: "because ye are sons, God hath sent forth the Spirit of his Son into your hearts, crying, Abba, Father" (Galatians 4:6) — that "Abba" from Lesson 1 is the receipt. So stop living like a servant trying to earn your keep with God. That job ended. You belong to the family now, and the inheritance comes with it.',
      senior: 'Paul’s argument in Galatians moves from redemption to adoption to inheritance, and the seasoned believer will feel the weight of each step. First, the redemption that grounds it: "But when the fulness of the time was come, God sent forth his Son, made of a woman, made under the law, To redeem them that were under the law, that we might receive the adoption of sons" (Galatians 4:4-5). Adoption here is no mere sentiment; it is purchased — the Son was sent and given precisely so that the redeemed "might receive the adoption of sons." The verb "redeem" (exagorazo) is commercial: to buy out of bondage. God bought us out of one status to place us in another. Then the placing itself, stated as an accomplished reversal: "Wherefore thou art no more a servant, but a son; and if a son, then an heir of God through Christ" (Galatians 4:7). The distinction between servant (doulos) and son is categorical, not merely one of degree: the servant labors within the house under obligation and without title to it; the son belongs to the house and stands to inherit it. Adoption does not make one a better servant; it removes one from the servant class altogether and confers heirship — "an heir of God through Christ," no less. And Paul supplies the internal evidence, the same as Romans: "because ye are sons, God hath sent forth the Spirit of his Son into your hearts, crying, Abba, Father" (Galatians 4:6). For a believer who, after long faithful service, still catches himself relating to God as a hired hand anxious about his standing, this is a needed correction and a deep rest: the servant’s labor to secure a place is finished, because the place was secured by the Son’s redemption and sealed by the Spirit’s cry. You are no more a servant, but a son — and therefore an heir.',
    },
    quiz: {
      questions: [
        {
          q: 'Why did God send His Son, according to Galatians 4:4-5?',
          options: [
            'To give us more rules',
            'To REDEEM us — buy us out of the old status — so we might receive the adoption of sons',
            'To make us better servants',
          ],
          answer: 1,
          explain: 'Adoption is redemption, not sentiment — it cost God His Son. He bought you out of one status to place you in a new one.',
        },
        {
          q: 'What is the categorical change in Galatians 4:7?',
          options: [
            'From a poor servant to a rich servant',
            'From servant to SON — no more a servant, but a son, and therefore an heir of God through Christ',
            'From son back to servant',
          ],
          answer: 1,
          explain: 'Not a promotion within the servant class — you’re moved out of it entirely into the family, with heirship attached.',
        },
        {
          q: 'What is the difference between a servant and a son here?',
          options: [
            'Nothing, really',
            'A servant works FOR the house hoping to be kept; a son belongs TO the house and inherits it',
            'A son works harder',
          ],
          answer: 1,
          explain: 'The servant labors under obligation without title; the son belongs and inherits. You don’t work to keep your place — you already belong.',
        },
      ],
    },
    lesson: 'Lesson 1 gave you the Spirit of adoption and the word "Abba"; this lesson shows you what that adoption cost God and how completely it changed your status. Paul lays out the whole movement in Galatians. First, the cost: "But when the fulness of the time was come, God sent forth his Son, made of a woman, made under the law, To redeem them that were under the law, that we might receive the adoption of sons" (Galatians 4:4-5). The key word is "redeem" — it is a commercial word, meaning to buy someone out of bondage, to pay the price that sets a slave free. So adoption was not God feeling casually sentimental one afternoon; it cost Him His Son. He paid to buy you OUT of your old status for the express purpose that you might be placed INTO a new one — "that we might receive the adoption of sons." Then Paul states the change itself, and it is not a small upgrade — it is a total reversal: "Wherefore thou art no more a servant, but a son; and if a son, then an heir of God through Christ" (Galatians 4:7). Sit with the difference between a servant and a son, because it is the whole point. A servant works FOR the house, under obligation, always hoping to do well enough to be kept on; the house is never really his. A son belongs TO the house — he doesn’t earn his place in it, he simply is family, and he stands to inherit everything. What God did in adopting you was not to make you a better, more polished servant. He moved you OUT of the servant category altogether and into the family, and He attached the inheritance to it: "if a son, then an heir of God through Christ." An heir of God. And lest you wonder whether the placing really took, Paul points to the evidence already living in you: "because ye are sons, God hath sent forth the Spirit of his Son into your hearts, crying, Abba, Father" (Galatians 4:6). That cry of "Abba" from the last lesson is the receipt — the Spirit’s own confirmation that the adoption is legally, permanently done. Darrell has watched this exact reversal in his own family: a child received not as a ward to be managed but as a daughter, fully — and a father-in-law, Bishop Gwin, who became "my father in love, not merely in law." That is how grace works. So if you are still living like a servant with God — performing to be accepted, striving to earn your keep, quietly afraid that one bad stretch could get you let go — hear the verse plainly: that job is over. You are no more a servant, but a son, a daughter; and because you belong to the family, the inheritance belongs to you too. Live from that, not for it.',
    facilitator: {
      talkingPoints: [
        'Adoption is REDEMPTION, not sentiment: "God sent forth his Son... to redeem... that we might receive the adoption of sons" (Galatians 4:4-5). It cost Him His Son.',
        '"Redeem" is a commercial word — to buy out of bondage. God bought you out of one status to place you in another.',
        'The change is categorical: "no more a servant, but a son; and if a son, then an heir of God through Christ" (4:7). Out of the servant class entirely.',
        'Servant vs son: a servant works FOR the house hoping to be kept; a son belongs TO the house and inherits it.',
        'The receipt: "God hath sent forth the Spirit of his Son into your hearts, crying, Abba, Father" (4:6). Live FROM belonging, not FOR it.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Galatians 4:4-7 — ask, "where do you still try to earn your keep with God?" | The big idea, in your own words (8): the cost (redemption); the categorical change (servant → son → heir). | Go deeper — the Word on adoption (10): servant vs son distinction; the inheritance attached; the Spirit’s cry as the receipt; the Bishop Gwin "father in love" testimony if it fits. | Reflect together (8): use the prompts. | Take it with you (3): each person names one place they perform to be accepted, and does one thing this week FROM belonging instead of TO earn it.',
      discussionPrompts: [
        'Where do you still live like a servant trying to earn your keep with God?',
        'What changes when you hear adoption COST God His Son — that it wasn’t cheap or casual?',
        'What’s the real difference between working FOR the house and belonging TO it?',
        'If you’re "an heir of God through Christ," what does living from that inheritance look like this week?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 3 — A Father to the Fatherless
  {
    id: 'ad3-a-father-to-the-fatherless',
    title: 'A Father to the Fatherless',
    bigIdea: 'God is not distant from the ones the world leaves out — He runs toward them. "A father of the fatherless, and a judge of the widows, is God in his holy habitation. God setteth the solitary in families." Read who He specifically takes: the fatherless, the widow, the solitary, the one bound. He does not just pity them from far away; He fathers the fatherless and He plants the lonely INTO a family. Adoption is how the God of the outsider makes the outsider an insider. If you have ever felt fatherless, unclaimed, or alone, this is the exact ministry the Word assigns to God Himself — and He is very good at it.',
    inApp: 'Name a way you have felt fatherless, unclaimed, or alone — then hand it to the God who fathers the fatherless: "You are a Father to the fatherless; You set the solitary in families — set me in Yours." Then do one thing to help set someone ELSE in a family this week (welcome the outsider, include the lonely) — become part of how He does it.',
    anchor: {
      ref: 'Psalm 68:5-6; 2 Corinthians 6:18',
      theme: 'God is a father of the fatherless and sets the solitary in families; He says, "And will be a Father unto you, and ye shall be my sons and daughters." He makes the outsider an insider.',
    },
    benefits: [
      'A Father for the ones the world leaves out — the fatherless, the widow, the solitary, the bound.',
      'Belonging, not just pity — He doesn’t watch from far away; He sets the lonely INTO a family.',
      'A named promise for the outsider — "And will be a Father unto you, and ye shall be my sons and daughters."',
      'Healing for the father-wound — the exact ministry the Word assigns to God Himself.',
      'A calling to pass it on — you become part of how He sets the solitary in families.',
    ],
    levels: {
      child: 'Some kids don’t have a daddy at home, or feel all alone sometimes. The Bible has really good news for them — and for everybody who ever feels left out. It says God is "A father of the fatherless" and He "setteth the solitary in families" (Psalm 68:5-6). "Fatherless" means someone without a daddy, and "solitary" means someone who feels all alone. And God says He takes care of them Himself — He becomes their Father, and He puts lonely people into a family so they’re not alone anymore! God even promises: "And will be a Father unto you, and ye shall be my sons and daughters" (2 Corinthians 6:18). So if you ever feel left out or lonely, remember: God is the best Father, and He loves to bring lonely people into His family. Nobody is too left-out for God to make them His own.',
      teen: 'If you’ve ever felt fatherless, unclaimed, or just alone — this lesson is aimed straight at you, because it’s a ministry God assigns to Himself. "A father of the fatherless, and a judge of the widows, is God in his holy habitation. God setteth the solitary in families: he bringeth out those which are bound with chains" (Psalm 68:5-6). Read WHO God specifically goes after: the fatherless, the widow, the solitary (the lonely, the isolated), the one bound in chains. These aren’t the people the world builds its ads around — they’re the ones it overlooks. And God doesn’t just feel sorry for them from a distance; look at the verbs. He FATHERS the fatherless. He SETS the solitary in families — He plants the lonely person into belonging. That’s adoption: it’s how the God of the outsider turns the outsider into an insider. And He puts it as a personal promise: "And will be a Father unto you, and ye shall be my sons and daughters, saith the Lord Almighty" (2 Corinthians 6:18). Sons AND daughters — nobody’s left off the list. So if there’s a father-shaped hole or a lonely place in you, this is exactly the thing God is famous for filling. And here’s the turn: since He sets the solitary in families, you get to be part of how He does it — by welcoming the person who’s on the outside looking in.',
      senior: 'Scripture locates God’s heart, with striking specificity, among those society is most prone to forget: "A father of the fatherless, and a judge of the widows, is God in his holy habitation. God setteth the solitary in families: he bringeth out those which are bound with chains: but the rebellious dwell in a dry land" (Psalm 68:5-6). Observe the roster — the fatherless, the widow, the solitary, the imprisoned. These are precisely the vulnerable and the isolated, and the God enthroned "in his holy habitation" is described not as remote from them but as their Father, Judge, and Deliverer. Two verbs carry the tenderness: He fathers the fatherless, and He "setteth the solitary in families" — the Hebrew picture is of the lonely one caused to dwell in a household, planted into belonging. This is the theological taproot of adoption: the God of the outsider makes the outsider an insider, not by distant charity but by placement into family. Paul gathers up the covenant promises to the same end: "And will be a Father unto you, and ye shall be my sons and daughters, saith the Lord Almighty" (2 Corinthians 6:18) — note "sons and daughters," the full inclusion of both. For the seasoned believer this is both comfort and commission. Comfort, because whatever father-wound or seasons of solitude a long life has known, the ministry of fathering the fatherless and homing the lonely is one God claims as His own and performs faithfully. Commission, because the God who sets the solitary in families characteristically does so THROUGH a people — so the household of faith is meant to be the very family into which He plants the lonely. To have been so gathered ourselves is to be sent, in turn, to gather.',
    },
    quiz: {
      questions: [
        {
          q: 'Who does Psalm 68:5-6 say God specifically fathers and gathers?',
          options: [
            'Only the strong and successful',
            'The fatherless, the widow, the solitary (lonely), and the bound — the ones the world overlooks',
            'No one in particular',
          ],
          answer: 1,
          explain: 'God locates His heart among the vulnerable and isolated — He is "a father of the fatherless" and "setteth the solitary in families."',
        },
        {
          q: 'How does God treat the lonely — from a distance, or how?',
          options: [
            'He pities them from far away',
            'He SETS the solitary in families — He plants the lonely person into belonging',
            'He leaves them alone',
          ],
          answer: 1,
          explain: 'Not distant charity but placement into family. That is the taproot of adoption — the God of the outsider makes the outsider an insider.',
        },
        {
          q: 'What does God personally promise in 2 Corinthians 6:18?',
          options: [
            '"Try harder and maybe you’ll belong."',
            '"And will be a Father unto you, and ye shall be my sons and daughters" — full inclusion, sons AND daughters',
            'Nothing personal',
          ],
          answer: 1,
          explain: 'A named, personal promise — and "sons and daughters" leaves no one off the list.',
        },
      ],
    },
    lesson: 'Adoption is not an abstract doctrine; it flows straight out of who God is, and Scripture tells you exactly where His heart is by telling you who He goes after. "A father of the fatherless, and a judge of the widows, is God in his holy habitation. God setteth the solitary in families: he bringeth out those which are bound with chains" (Psalm 68:5-6). Read the roster of the people named there: the fatherless, the widow, the solitary, the one bound in chains. Notice that these are not the people the world centers — they are the ones it tends to overlook, the vulnerable and the isolated. And the God who is enthroned "in his holy habitation," high and holy, is described not as far off from them but as being FOR them in the most personal terms: a Father to the fatherless, a Judge who takes up the widow’s case, a Deliverer of the imprisoned. Look closely at the two verbs, because the whole doctrine of adoption is hiding in them. He does not merely feel compassion for the fatherless from a safe distance — He fathers them; He steps into the empty place a father was meant to fill. And He does not just wish the lonely well — He "setteth the solitary in families." The picture is of a solitary person being caused to dwell in a household, planted into belonging, given a family they did not have. That is what adoption IS: it is how the God of the outsider makes the outsider an insider — not by tossing charity over a wall, but by bringing them inside and giving them a name at the table. And He states it as a direct, personal promise: "And will be a Father unto you, and ye shall be my sons and daughters, saith the Lord Almighty" (2 Corinthians 6:18). Sons AND daughters — the promise is deliberately wide enough that no one gets left off the list. This is deeply personal for Darrell’s own story: a boy from the projects, whom the maps and the statistics had written off, whom Yahweh fathered and set into a family — including a father in the faith, Bishop Gwin, who "became family." So if you have ever carried a father-shaped hole, or lived through long seasons of feeling unclaimed and alone, hear this precisely: the ministry of fathering the fatherless and homing the lonely is one that God claims as His own personal work, and He is faithful and very good at it. And there is a turn at the end you should not miss. Because God characteristically sets the solitary in families THROUGH a people, the household of faith is meant to be the very family He plants the lonely into. Which means that if you have been gathered in, you are now sent out to gather — to be part of how the God who fathered you fathers the next fatherless one, and welcomes the next person standing on the outside looking in.',
    facilitator: {
      talkingPoints: [
        'Scripture locates God’s heart among the overlooked: "a father of the fatherless... God setteth the solitary in families" (Psalm 68:5-6).',
        'The roster is specific — fatherless, widow, solitary, the bound — the vulnerable and isolated, not the world’s centered ones.',
        'The verbs carry the doctrine: He FATHERS the fatherless and SETS the solitary in families (plants the lonely into belonging). That’s adoption.',
        'A personal promise: "And will be a Father unto you, and ye shall be my sons and daughters" (2 Corinthians 6:18) — full inclusion, no one left off.',
        'Comfort AND commission: God homes the lonely THROUGH a people — the household of faith is the family He plants them into; the gathered are sent to gather.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Psalm 68:5-6 and 2 Corinthians 6:18 — ask, "have you ever felt fatherless or on the outside?" | The big idea, in your own words (8): who God goes after; He doesn’t pity from afar, He sets the solitary IN families. | Go deeper — the Word on adoption (10): the two verbs; the wide promise (sons and daughters); the church as the family He plants people into; Darrell’s "father in love" testimony if it fits. | Reflect together (8): use the prompts; be gentle with real father-wounds. | Take it with you (3): each person receives God as Father for one lonely place, and does one thing to help set someone ELSE in a family this week.',
      discussionPrompts: [
        'Where have you felt fatherless, unclaimed, or alone — and how does "a father of the fatherless" meet that?',
        'What’s the difference between God pitying the lonely from afar and God SETTING them in a family?',
        'Who around you is on the outside looking in that you could help welcome into belonging?',
        'How does it change your church family to see it as where God "setteth the solitary in families"?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 4 — What Manner of Love (Chosen on Purpose)
  {
    id: 'ad4-what-manner-of-love-chosen',
    title: 'What Manner of Love (Chosen on Purpose)',
    bigIdea: 'Adoption is never an accident — it is a choice, made on purpose, ahead of time, out of sheer love. "Having predestinated us unto the adoption of children by Jesus Christ to himself, according to the good pleasure of his will." You were not a last resort or an afterthought; God DECIDED to make you His, because it pleased Him to. John can barely contain it: "Behold, what manner of love the Father hath bestowed upon us, that we should be called the sons of God." A biological child is received; an adopted child is chosen — someone looked at you specifically and said, "that one; I want that one to be mine." That is the love the Father has bestowed on you.',
    inApp: 'If you have felt like an accident, a burden, or an afterthought, replace that story with the true one out loud: "I was not an afterthought — I was predestined unto adoption, chosen on purpose, according to the good pleasure of His will." Sit for one minute in "what manner of love" that is, and let it be bestowed on you, not earned.',
    anchor: {
      ref: 'Ephesians 1:5; 1 John 3:1',
      theme: 'God predestined us unto adoption by Jesus Christ, according to the good pleasure of His will. Behold what manner of love — that we should be called the sons of God. Chosen on purpose.',
    },
    benefits: [
      'You were chosen on purpose — "predestinated unto the adoption," not a last resort or accident.',
      'Love as the only motive — "according to the good pleasure of his will"; He wanted to.',
      'Awe instead of anxiety — "what manner of love the Father hath bestowed upon us."',
      'Healing for the "I’m a burden" story — an adopted child is specifically chosen, not merely received.',
      'A settled worth that isn’t performance-based — the love was bestowed, before you did anything.',
    ],
    levels: {
      child: 'Here is something wonderful about being adopted by God: He didn’t do it by accident. He CHOSE you — on purpose! The Bible says God decided ahead of time to make you His child "according to the good pleasure of his will" (Ephesians 1:5). That means it made God HAPPY to choose you! You’re not an oops or a leftover — God wanted YOU. And the Bible gets so excited about it that it says, "Behold, what manner of love the Father hath bestowed upon us, that we should be called the sons of God" (1 John 3:1). "Behold" means "Wow, look at this!" When a family adopts a child, it’s like they point and say, "That one — we want that one to be ours." That’s what God did with you. You were picked on purpose, because He loves you. That’s not an accident — that’s the best kind of love there is.',
      teen: 'This one’s for anyone who’s ever secretly felt like an accident, a burden, or an afterthought: adoption is never accidental — it’s a choice, made on purpose, ahead of time, out of pure love. "Having predestinated us unto the adoption of children by Jesus Christ to himself, according to the good pleasure of his will" (Ephesians 1:5). Unpack that. "Predestinated" means God decided in advance — before you did anything to earn it or ruin it. "Adoption of children... to himself" means He chose to make you HIS. And why? "According to the good pleasure of his will" — not because He had to, not because you talked Him into it, but because it genuinely pleased Him to. He WANTED you. Here’s the difference that hits home: a biological child is received into a family; an adopted child is specifically chosen — someone looked at that exact child and said, "that one, I want that one to be mine." That’s the kind of love God set on you. No wonder John can hardly get the words out: "Behold, what manner of love the Father hath bestowed upon us, that we should be called the sons of God" (1 John 3:1). "Behold" is basically "STOP and look at this." So if the story in your head is "I’m too much" or "nobody really chose me," swap it for the true one: you were predestined unto adoption, chosen on purpose, because it pleased the Father. That’s not a thing you earned. It’s a thing He bestowed.',
      senior: 'This lesson reaches the deepest root of adoption — the eternal, gracious CHOICE behind it: "Having predestinated us unto the adoption of children by Jesus Christ to himself, according to the good pleasure of his will" (Ephesians 1:5). Three things in that verse repay long meditation. First, "predestinated" — the adoption was purposed by God in advance, not improvised in response to our merit; it originates in His prior, sovereign love. Second, "the adoption of children... to himself" — the terminus of the choosing is God’s own family; He chose to make us His. Third, the motive: "according to the good pleasure of his will" — not obligation, not our persuasion, but His own delight; it pleased Him to adopt us. Herein lies a comfort available to no self-made status: a standing grounded in God’s good pleasure cannot be undone by our poor performance, for it never rested on our performance to begin with. John responds to this reality not with analysis but with astonishment: "Behold, what manner of love the Father hath bestowed upon us, that we should be called the sons of God: therefore the world knoweth us not, because it knew him not" (1 John 3:1). The imperative "Behold" summons wonder; "what manner of love" confesses that this love is of a kind almost beyond category. And there is a quiet dignity peculiar to adoption that the passage honors: a child born into a family is received; a child adopted is chosen — deliberately singled out and claimed. For the seasoned saint who may carry old wounds of feeling unwanted, unchosen, or an afterthought, the Word overwrites that account entirely: you were predestined unto adoption, claimed on purpose, according to the good pleasure of His will — and the only fitting response is to behold what manner of love has been bestowed, and to rest in it.',
    },
    quiz: {
      questions: [
        {
          q: 'According to Ephesians 1:5, when and why did God choose to adopt you?',
          options: [
            'As a last resort, because He felt obligated',
            'He PREDESTINED it (decided in advance) "according to the good pleasure of his will" — because it pleased Him to',
            'Only after you earned it',
          ],
          answer: 1,
          explain: 'Chosen on purpose, ahead of time, out of His own delight — not obligation and not your merit. You were wanted.',
        },
        {
          q: 'What is the special dignity of being ADOPTED (vs merely born into a family)?',
          options: [
            'There’s no difference',
            'An adopted child is specifically CHOSEN — deliberately singled out and claimed, not just received',
            'Adopted children matter less',
          ],
          answer: 1,
          explain: 'Someone looked at you specifically and said "that one — I want that one to be mine." That’s the love God set on you.',
        },
        {
          q: 'How does John react to this love in 1 John 3:1?',
          options: [
            'He analyzes it coolly',
            'With astonishment — "Behold, what manner of love the Father hath bestowed upon us, that we should be called the sons of God"',
            'He ignores it',
          ],
          answer: 1,
          explain: '"Behold" summons wonder; the love is almost beyond category — and it was bestowed on you, not earned by you.',
        },
      ],
    },
    lesson: 'Every adoption answers a quiet question the adopted heart is always asking: was I wanted, or was I just taken in? This lesson answers it, and the answer reaches all the way back before time. "Having predestinated us unto the adoption of children by Jesus Christ to himself, according to the good pleasure of his will" (Ephesians 1:5). Three words in that verse deserve to be turned over slowly. "Predestinated" — God did not adopt you as a scramble, a last resort, an improvised response to your good behavior; He decided on it in advance, before you had done anything to earn it or anything to disqualify yourself. It originates in His own prior love, not in your résumé. "Adoption of children... to himself" — the destination of that choosing is God’s own family; He chose specifically to make you His. And then the motive, which is the sweetest part: "according to the good pleasure of his will." He did not adopt you because He was cornered into it, or because you argued Him into it, or because He owed it to you. He did it because it pleased Him to — it made Him glad. He wanted you. And here is the particular dignity of adoption that the world often misses: a child born into a family is received, which is a beautiful thing; but an adopted child is CHOSEN — someone looked at that exact child, out of all the children there were, and said, "that one; I want that one to be mine." That deliberate, singling-out love is the love God set on you. It is no wonder that when the apostle John contemplates it, he stops arguing and just stares: "Behold, what manner of love the Father hath bestowed upon us, that we should be called the sons of God: therefore the world knoweth us not, because it knew him not" (1 John 3:1). "Behold" is a word that grabs your sleeve — stop, look at this. "What manner of love" is John confessing that this love is almost of a different category than any love he has words for. And crucially, it is love "bestowed" — laid on you as a gift, before you did a single thing to deserve it. So if the story running quietly in the back of your mind is "I was an accident," or "I’m too much," or "nobody really chose me — I just got taken in," the Word overwrites that story completely. You were predestined unto adoption. You were claimed on purpose. It pleased the Father to make you His. That is not a status you performed your way into and could therefore perform your way out of; it rests entirely on His good pleasure, which is exactly why it is unshakable. The right response to all of this is not to try harder to deserve it. It is to do what John did: behold. Stop, and look at what manner of love has been bestowed on you — and let yourself be, at last, someone who was chosen on purpose.',
    facilitator: {
      talkingPoints: [
        'Adoption is chosen, not accidental: "predestinated us unto the adoption of children... according to the good pleasure of his will" (Ephesians 1:5) — decided in advance, out of delight.',
        'The motive is love, not obligation — "the good pleasure of his will." He WANTED you; you didn’t corner Him into it.',
        'The dignity of adoption: a born child is received; an adopted child is specifically CHOSEN — singled out and claimed.',
        'John’s response is awe, not analysis: "Behold, what manner of love..." (1 John 3:1) — "behold" grabs your sleeve; the love is almost beyond category.',
        'It’s "bestowed," not earned — which is exactly why it’s unshakable; it never rested on your performance. Overwrites the "I’m an accident/burden" story.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Ephesians 1:5 and 1 John 3:1 — ask, "have you ever felt like an afterthought?" | The big idea, in your own words (8): predestined = chosen in advance; "good pleasure of his will" = He wanted to; received vs chosen. | Go deeper — the Word on adoption (10): the three words in Ephesians 1:5; John’s "Behold"; love bestowed, not earned, so unshakable. | Reflect together (8): use the prompts; be tender with wounds of feeling unwanted. | Take it with you (3): each person replaces one "I’m an accident/burden" story with "chosen on purpose," and sits a minute in "what manner of love."',
      discussionPrompts: [
        'What story have you carried about being wanted — and how does "chosen on purpose" meet it?',
        'What’s the difference between being received and being specifically chosen?',
        'Why does it matter that God’s love was "bestowed" (a gift) and not earned?',
        'What would change this week if you truly believed it PLEASED God to make you His?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 5 — Full Family, Full Inheritance (no more a stranger)
  {
    id: 'ad5-full-family-full-inheritance',
    title: 'Full Family, Full Inheritance',
    bigIdea: 'Grace does not half-adopt. It does not make you a guest, a distant cousin, or a member on probation. "Now therefore ye are no more strangers and foreigners, but fellowcitizens with the saints, and of the household of God." And it is not only belonging — it is inheritance: "if children, then heirs; heirs of God, and joint-heirs with Christ." Joint-heirs — you inherit alongside Jesus Himself, not a lesser portion. This is the capstone: you were an outsider, and the Father brought you all the way in — full family, full citizenship, full inheritance. Nothing about your adoption is partial. You are wholly His.',
    inApp: 'Name any place you still feel like a stranger, a guest, or a second-class member in God’s house. Then declare the whole truth: "No more a stranger or a foreigner — I’m of the household of God, an heir of God, a joint-heir with Christ." Live one part of today as a full family member, not a guest asking permission to be there.',
    anchor: {
      ref: 'Ephesians 2:19; Romans 8:17; John 1:12',
      theme: 'No more strangers and foreigners, but fellowcitizens and of the household of God; and if children, then heirs of God and joint-heirs with Christ. Full family, full inheritance — wholly His.',
    },
    benefits: [
      'Full belonging, not partial — "no more strangers and foreigners, but... of the household of God."',
      'Full citizenship — "fellowcitizens with the saints"; you have standing, not guest status.',
      'Full inheritance — "heirs of God, and joint-heirs with Christ"; you inherit alongside Jesus, not a lesser share.',
      'The right and power to be His — "to them gave he power to become the sons of God" (John 1:12).',
      'The capstone of the series — outsider brought all the way in; nothing about your adoption is partial.',
    ],
    levels: {
      child: 'When God adopts you, He doesn’t do it halfway — He brings you ALL the way into the family! The Bible says, "ye are no more strangers and foreigners, but fellowcitizens with the saints, and of the household of God" (Ephesians 2:19). A "stranger" is someone who doesn’t belong, and a "foreigner" is someone far from home. God says that’s not you anymore — now you’re part of "the household of God," which means His own family and home! And there’s even more: "if children, then heirs... joint-heirs with Christ" (Romans 8:17). An "heir" gets to share the family’s treasure, and "joint-heirs with Christ" means you get to share it right alongside Jesus! So you’re not a visitor who has to knock and wait outside. You’re a full member of God’s family, with a full share of everything. The Bible even says God "gave... power to become the sons of God" to everyone who receives Jesus (John 1:12). All the way in — that’s how God adopts!',
      teen: 'Here’s the capstone of the whole series, and it kills the lie that you’re only sort-of in: grace does NOT half-adopt. It doesn’t make you a guest, a distant cousin, or a member on probation. "Now therefore ye are no more strangers and foreigners, but fellowcitizens with the saints, and of the household of God" (Ephesians 2:19). Three upgrades in one verse: not a stranger (you belong), not a foreigner (you’re home), but a fellowcitizen (full standing) in "the household of God" (His actual family). And it’s not just belonging — there’s an inheritance attached: "if children, then heirs; heirs of God, and joint-heirs with Christ" (Romans 8:17). Don’t skip "joint-heirs with Christ" — it means you inherit ALONGSIDE Jesus, not some leftover portion in the corner. And the door to all of it is wide open: "as many as received him, to them gave he power to become the sons of God" (John 1:12) — the right and the power to actually BE His, given to everyone who receives Christ. So put the whole series together: you got the Spirit of adoption and learned to say "Abba" (L1); you were moved from servant to son and heir (L2); the God of the fatherless set you in a family (L3); and He chose you on purpose out of what-manner-of-love (L4). This last one seals it: you’re not partly in. You’re a full citizen of God’s household with a full inheritance next to Christ Himself. Stop living like a guest who has to ask permission to be there. You’re family — wholly His.',
      senior: 'The series concludes where adoption always leads — into full membership and full inheritance, with nothing withheld. "Now therefore ye are no more strangers and foreigners, but fellowcitizens with the saints, and of the household of God" (Ephesians 2:19). Paul negates two categories of exclusion and affirms two of inclusion: no longer "strangers" (xenoi, those without belonging) nor "foreigners" (those without the rights of the community), but "fellowcitizens" (full civic standing among the saints) and members "of the household of God" (oikeioi — those who belong to the family itself). The movement is from the far margin to the very center of the house. And adoption, biblically, always carries heirship: "And if children, then heirs; heirs of God, and joint-heirs with Christ; if so be that we suffer with him, that we may be also glorified together" (Romans 8:17). The phrase "joint-heirs with Christ" (sunkleronomoi) is staggering and must not be softened — the adopted inherit not a diminished, secondary portion but share the inheritance together with the eternal Son Himself. The entrance to this standing is by receiving Christ: "But as many as received him, to them gave he power to become the sons of God, even to them that believe on his name" (John 1:12) — the right and the enabling to become God’s children, granted to all who receive Him. Gathering the whole series: the Spirit of adoption and the cry "Abba" (Romans 8), the reversal from servant to son and heir (Galatians 4), the God who fathers the fatherless and homes the solitary (Psalm 68), and the predestinating love that chose us on purpose (Ephesians 1) — all of it terminates here, in full family and full inheritance. For the seasoned believer, any lingering sense of being a tolerated guest in God’s house, a second-tier member, is contradicted by the plain testimony of Scripture: you are a fellowcitizen and household member, an heir of God and joint-heir with Christ. Grace does not half-adopt. You are wholly His — belong accordingly, and to Yahweh be the glory.',
    },
    quiz: {
      questions: [
        {
          q: 'What does Ephesians 2:19 say you now are?',
          options: [
            'A guest on probation',
            'No more a stranger or foreigner, but a fellowcitizen and "of the household of God" — full belonging',
            'A distant relative',
          ],
          answer: 1,
          explain: 'From the far margin to the center of the house — full civic standing and family membership, not guest status.',
        },
        {
          q: 'What does "joint-heirs with Christ" (Romans 8:17) mean?',
          options: [
            'You get a small leftover portion',
            'You inherit ALONGSIDE Jesus Himself — not a diminished, secondary share',
            'You inherit nothing',
          ],
          answer: 1,
          explain: 'The adopted share the inheritance together with the eternal Son — staggering, and not to be softened. Full inheritance.',
        },
        {
          q: 'How does someone enter this full standing (John 1:12)?',
          options: [
            'By earning it over many years',
            'By RECEIVING Christ — "to them gave he power to become the sons of God, even to them that believe on his name"',
            'It’s only for a special few',
          ],
          answer: 1,
          explain: 'The right and the power to become God’s children is given to all who receive Him. The door is wide open.',
        },
      ],
    },
    lesson: 'This is the capstone, and it exists to kill a lie that adopted hearts are especially prone to believe — the lie that you are only sort-of in, a guest who got lucky, a member on probation who had better not mess it up. Grace does not half-adopt. Hear how completely Paul closes the distance: "Now therefore ye are no more strangers and foreigners, but fellowcitizens with the saints, and of the household of God" (Ephesians 2:19). He names two categories of exclusion and cancels both, then names two of inclusion and grants both. You are no longer a "stranger" — someone with no belonging; and no longer a "foreigner" — someone present but without the rights of the community. Instead you are a "fellowcitizen with the saints" — full standing, full rights, an equal member of the commonwealth — and you are "of the household of God," which is to say you belong to the family itself, in the house, at the table. The whole movement of that verse is from the far edge of the margin to the very center of the home. And adoption in Scripture never stops at belonging; it always carries an inheritance: "And if children, then heirs; heirs of God, and joint-heirs with Christ; if so be that we suffer with him, that we may be also glorified together" (Romans 8:17). Do not rush past "joint-heirs with Christ," and do not let anyone soften it. It does not mean you get a small leftover portion in a back room while the real inheritance goes elsewhere. It means the adopted children share the inheritance TOGETHER WITH the eternal Son of God Himself — heirs of God, alongside Christ. That is the standing grace confers. And the door into all of it is thrown wide: "But as many as received him, to them gave he power to become the sons of God, even to them that believe on his name" (John 1:12) — the right, and the very power, to become a child of God, given to everyone who receives Christ. Now gather the whole series into one picture, because this lesson is where all of it lands. You were given the Spirit of adoption and taught to cry "Abba, Father" (Lesson 1). You were moved out of the servant class entirely and made a son, a daughter, an heir, at the cost of God’s own Son (Lesson 2). You met the God who fathers the fatherless and sets the solitary in families, the God of the outsider who makes outsiders insiders (Lesson 3). And you learned that none of it was an accident — you were chosen on purpose, predestined unto adoption out of what-manner-of-love (Lesson 4). Here is where every one of those threads is tied off: full family, full citizenship, full inheritance. Nothing about your adoption is partial. So if you have been living in God’s house like a guest who has to knock and ask permission to be there, like a second-class member bracing to be found out and sent back — let this be the word that settles it. You are no more a stranger and a foreigner. You are a fellowcitizen, a member of the household of God, an heir of God and a joint-heir with Christ. Grace did not bring you halfway in. It brought you all the way home. You are wholly His — so belong like it, and give Yahweh the glory for the love that adopted you.',
    facilitator: {
      talkingPoints: [
        'Grace does not half-adopt: "no more strangers and foreigners, but fellowcitizens with the saints, and of the household of God" (Ephesians 2:19) — from the far margin to the center of the house.',
        'Two exclusions cancelled (stranger, foreigner), two inclusions granted (fellowcitizen, household member) — full standing, full belonging.',
        'Full inheritance, not a leftover: "heirs of God, and joint-heirs with Christ" (Romans 8:17) — you inherit ALONGSIDE Jesus. Don’t soften it.',
        'The door is wide open: "as many as received him, to them gave he power to become the sons of God" (John 1:12) — the right and power to be His.',
        'The capstone gathers the series: Spirit of adoption (L1), servant→son→heir (L2), Father to the fatherless (L3), chosen on purpose (L4) → full family, full inheritance, wholly His.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Ephesians 2:19 and Romans 8:17 — ask, "do you ever feel like a guest in God’s house?" | The big idea, in your own words (8): grace doesn’t half-adopt; stranger/foreigner → fellowcitizen/household; the inheritance attached. | Go deeper — the Word on adoption (10): "joint-heirs with Christ" (don’t soften it); the open door (John 1:12); gather the whole series. | Reflect together (8): use the prompts. | Take it with you (3): each person names one place they live like a guest, and steps into one part of the week as full family — an heir, not a visitor.',
      discussionPrompts: [
        'Where do you still live like a guest in God’s house instead of full family?',
        'What hits you about being a "joint-heir with Christ" — inheriting alongside Jesus, not a leftover share?',
        'Looking back over the whole series (Abba → son → the fatherless fathered → chosen → full family), which lesson met you most?',
        'What would it look like this week to "belong like it" — to live as someone wholly His?',
      ],
    },
  },
];

export const ADOPTION_LESSONS_INTEREST_TAG = '[Spirit of Adoption interest]';
export const ADOPTION_LESSONS_HELPER_TAG = '[Spirit of Adoption helper]';

export function resolveAdoptionLessonsCohort(localCohort = null) {
  return resolveCohortGeneric(localCohort, ADOPTION_LESSONS_CONFIRMED_COHORT, ADOPTION_LESSONS_PROPOSED_COHORT_START);
}

export function buildAdoptionLessonsSchedule() {
  return ADOPTION_LESSONS_MODULES.map((m, i) => ({ ...m, week: i + 1, date: null, weekday: null }));
}

export function adoptionLessonsProgressSummary(progress = {}) {
  return progressSummaryFor(ADOPTION_LESSONS_MODULES, progress);
}

export function exportAdoptionLessonsCurriculumMarkdown() {
  return exportCurriculumMarkdownFor(
    { meta: ADOPTION_LESSONS_META, sessionFlow: ADOPTION_LESSONS_SESSION_FLOW, modules: ADOPTION_LESSONS_MODULES },
    null,
  );
}

// Tutor course-meta — a Word-first, grace-centered companion that settles the one
// who has felt fatherless, outside, or like a servant into full, chosen belonging.
export const ADOPTION_LESSONS_TUTOR_META = {
  title: ADOPTION_LESSONS_META.title,
  intro: 'You are a warm, grace-centered guide for a Word-first, non-denominational lesson series called "The Spirit of Adoption: Made Wholly His."',
  posture: 'Guide ONE learner — who may be a child, a teen, an adult, or a seasoned believer — through the lesson, matching your words and pace to their age. The series builds in order: (1) the SPIRIT OF ADOPTION — not the spirit of fear again, but the Spirit that cries "Abba, Father," with the Spirit witnessing that you are God’s child (Romans 8:15-16); (2) NO MORE A SERVANT, BUT A SON — adoption is redemption (it cost God His Son) and moves you out of the servant class into sonship and heirship (Galatians 4:4-7); (3) A FATHER TO THE FATHERLESS — God fathers the fatherless and sets the solitary in families; the God of the outsider makes the outsider an insider (Psalm 68:5-6; 2 Corinthians 6:18); (4) CHOSEN ON PURPOSE — predestined unto adoption according to the good pleasure of His will; behold what manner of love (Ephesians 1:5; 1 John 3:1); and (5) FULL FAMILY, FULL INHERITANCE — no more a stranger, but a fellowcitizen and household member, an heir of God and joint-heir with Christ (Ephesians 2:19; Romans 8:17; John 1:12). The through-line: grace does not half-adopt — you are wholly His, chosen on purpose, an heir. Be relentlessly WELL-BEING-POSITIVE: settle the one who has felt like an orphan, an outsider, or a hired hand into full belonging — chosen, wholly family, an heir — never earning its way in; heal the father-wound with the God who fathers the fatherless; never shame. Cite Scripture by reference (KJV, as in the lessons); never invent or paraphrase a verse as if quoting it, and if unsure of a text, say so rather than fabricate. Give Yahweh the glory — the love that adopted us is His.',
};
