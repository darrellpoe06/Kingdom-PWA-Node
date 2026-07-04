// =============================================================================
// living-lessons-class — "Living Lessons from the Word"
// =============================================================================
// A Word-first, non-denominational LESSON SERIES that rides the SAME shared Learn
// engine as the four PoeTech / COLG courses ("Learning A.I. The Way", "The
// Broadcast", "The Infrastructure", "Sovereign A.I.") — the generic helpers in
// church-classes.js, the self-driving tutor (class-tutor.js → askTutor), and the
// multi-modal lesson schema + age-adaptive skill-level branching + quiz +
// graduate→helper from learn-framework.js. The difference is PRESENTATION, not
// machinery: this series is SELF-PACED (no cohort, no weekly clock), so it sets
// `meta.unit` to render its rows as "Lessons" instead of "Weeks" (a small,
// backward-compatible label layer in ChurchLearn; the four courses, which set no
// `meta.unit`, are unchanged).
//
// The lessons are structured on DARRELL'S 4D/3D FRAMEWORK — the same spine as his
// Study, the Thought-finalizer, and the Eternal Algorithms library:
//
//   • DEEP SOURCE (4th-dimensional) — the deep, Scripture-and-language-grounded
//     teaching (the module `lesson`, surfaced in the facilitator/teaching layer).
//   • PLAIN (3rd-dimensional)        — the wider-audience distillation, paced to
//     age (the module `levels`: child / teen / senior, plus the standard `lesson`
//     base and the `bigIdea` hook).
//   • BENEFITS                       — what running the lesson FREES in you (the
//     module `benefits` array, rendered as "What this frees in you"), plus the
//     real-life "Take it with you" action.
//
// LESSON 1 — "The Perfect You Were Made For" — is Darrell's teaching:
//   "None of us are 3rd-dimensional perfect; however Yahweh describes a Perfect
//    He expects — that's a lesson."
// It is the matching ETERNAL ALGORITHM ("The Perfect You Were Made For — whole,
// not flawless"; seeded in eternal-algorithms.js): 3D flawless-performance vs the
// 4D Perfect Yahweh actually expects.
//
// VERIFICATION / NO-FABRICATION (DR-0076, and the Source-of-Answers rule):
//   • Every Scripture is cited by REFERENCE; quoted text is the ESV (primary) with
//     the KJV noted where the KJV wording IS the teaching point, per
//     SCRIPTURE-REFERENCE-STANDARD — fetched and verified, not produced from
//     memory. The translation insight at the heart of the lesson (the KJV renders
//     BOTH Hebrew `tamim`, Gen 17:1, and Greek `teleios`, Matt 5:48, as "perfect,"
//     where the ESV reads "blameless" and "perfect/mature") is verified against
//     the lexicons (Strong's H8549 tamim = complete / whole / sound / blameless /
//     integrity; Strong's G5046 teleios, from G5056 telos = end / goal, = complete
//     / brought-to-its-end / lacking-nothing / full-grown / mature — NOT "without
//     any flaw").
//   • EVENHANDED: the historic traditions on sanctification / "Christian
//     perfection" (Wesleyan entire-sanctification, Reformed progressive
//     sanctification, Orthodox theosis, and others) are presented fairly and
//     Word-first; the lesson names their common ground and lets the Word + the
//     Spirit lead, rather than dividing the Body (COMMUNITY-FIRST / Word-first).
//   • WELL-BEING-POSITIVE (binding): the lesson FREES the reader from crushing
//     self-perfectionism and works-righteousness; it distinguishes God's "perfect"
//     (grace, maturity, love, His finished work in us) from the anxious flawless-
//     performance the flesh chases. Grace-centered, never pressure-adding.
// =============================================================================

// Self-paced: there is no cohort and no weekly schedule. We keep these exports so
// the host wiring mirrors the other courses exactly, but the start is null (rows
// carry no painted dates) and the UI reads "Self-paced" instead of "Cohort 1."
export const LIVING_LESSONS_PROPOSED_COHORT_START = null;
export const LIVING_LESSONS_CONFIRMED_COHORT = { startDate: null, confirmed: false };

export const LIVING_LESSONS_META = {
  key: 'living-lessons',
  title: 'Living Lessons from the Word',
  audience: 'the whole family and the whole Body — every age',
  tagline: 'You were never made to be flawless. You were made to be whole.',
  format: 'Self-paced · read it alone, as a family, or in a group · paced to your age',
  cadenceDays: 7,
  weeks: 7, // L1 Perfect · L2 Energy · L3 Bodybuilding Christ · L4 Dying to Live · L5 Take No Thought · L6 Think on These Things · L7 Let Peace Be the Umpire; grows as Darrell teaches more
  handsOnLabel: 'Take it with you',
  // The label layer that lets the shared engine render this honestly as a
  // self-paced lesson series rather than a weekly cohort class.
  unit: {
    noun: 'lesson',
    nounPlural: 'lessons',
    cap: 'Lesson',
    selfPaced: true,
    sessionLabel: 'How to lead it (family or small group)',
    countNoun: 'lesson',
  },
  footer: '_Taught by Darrell Poe · The Church of the Living God + the Poe family · built on PoeTech. Word-first and non-denominational — Scripture is senior to any tradition, and we let the Word and the Spirit lead. Grace-centered, for every age._',
};

// A gentle reading rhythm — not a 75-minute cohort clock. Used by the facilitator
// guide and the printout so a family or a small group has a shape to follow.
export const LIVING_LESSONS_SESSION_FLOW = [
  { minutes: 3, name: 'Open in prayer + read the Scripture' },
  { minutes: 10, name: 'The big idea, in your own words' },
  { minutes: 10, name: 'Go deeper — the two "perfects"' },
  { minutes: 10, name: 'Reflect together' },
  { minutes: 2, name: 'Take it with you' },
];
export const LIVING_LESSONS_SESSION_MINUTES = LIVING_LESSONS_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0);

export const LIVING_LESSONS_MODULES = [
  // ---------------------------------------------------------------------------
  {
    id: 'll1-the-perfect-yahweh-expects',
    title: 'The Perfect You Were Made For',
    bigIdea: 'None of us are flawless — and Yahweh never asked us to be. When He says "be perfect," the word does not mean "make no mistakes ever." It means whole, complete, grown-up, all-in. The flawless kind of perfect is a trap that breeds fear; the Perfect Yahweh actually expects is a wholehearted love that He Himself grows in you by grace. One crushes; the other sets you free.',
    inApp: 'Name the one place you have been beating yourself up for not being "perfect." Then say the truth out loud: "I was made to be whole, not flawless — and God is growing me." Carry that sentence into one real moment today where you would normally feel like you fell short.',
    anchor: {
      ref: 'Matthew 5:48; Genesis 17:1',
      theme: 'Two famous "be perfect" verses — and both words mean whole / complete / wholehearted, not flawless. The Perfect Yahweh expects is maturity and all-in love, grown in you by grace, not a spotless performance you have to produce.',
    },
    // BENEFITS — "What this frees in you." Darrell's framework made visible.
    benefits: [
      'Freedom from the crushing pressure to be flawless — the standard you were never actually given.',
      'Less anxiety and self-condemnation, because acceptance is a gift of grace, not a score you earn.',
      'A real, reachable target: grow whole — wholehearted, maturing, perfected in love by the Spirit.',
      'Rest for the scared, tired heart — you stop performing for God and start walking WITH Him.',
      'A way to extend the same grace to others, because you have stopped measuring everyone (including yourself) by flawless.',
    ],
    levels: {
      child: 'God never asked you to be perfect like a robot that never makes a single mistake. When the Bible says "be perfect," the word really means "be whole" and "be all grown up in love" — like an apple that is fully ripe, or a puzzle with every piece in. You will still mess up sometimes, and that is okay — God is not mad; He is helping you grow, a little at a time, like a gardener helps a plant. So you do not have to be scared or sad about not being perfect. You just keep loving God with your WHOLE heart, and He does the growing. That is the kind of perfect He wants — and it is good news, not bad news.',
      teen: 'Real talk: you are not flawless, and God already knows that — He was never asking for flawless. The verses that say "be perfect" (Matthew 5:48; Genesis 17:1) use words that mean WHOLE, COMPLETE, all-in — "mature," "wholehearted" — not "never make a mistake." Chasing flawless is actually a trap: it makes you anxious, never enough, always performing, and it is a standard the Bible never set. The perfect God actually wants is a heart that is all-in with Him, and the wild part is He grows that in you Himself, by His grace and His Spirit — you do not manufacture it by trying harder. Paul, who wrote a third of the New Testament, literally said "not that I am already perfect... but I press on" (Philippians 3:12). If he is still pressing on, you are allowed to be growing too. That is freedom.',
      senior: 'For the seasoned believer, this lesson lands as both relief and depth. The English word "perfect" has drifted: today it means flawless, but in 1611 (and in the underlying languages) it meant complete, whole, sound, brought to its proper end. The KJV translates BOTH the Hebrew tamim (Genesis 17:1, "walk before me, and be thou perfect" — Strong\'s H8549: complete, whole, sound, having integrity) AND the Greek teleios (Matthew 5:48 — Strong\'s G5046, from telos, "end / goal": complete, mature, brought to its purpose, lacking nothing necessary) as "perfect." The ESV, reading the same words, renders them "blameless" and "you... must be perfect, as your heavenly Father is perfect" — wholeness and maturity, not the modern sinless flawlessness. This matters pastorally: a lifetime of hearing "perfect" as "never falter" has wounded many sincere saints. Scripture is plain that flawless self-performance is neither the standard nor possible this side of glory (1 John 1:8; Philippians 3:12). What IS expected — and what grace produces — is a heart made whole and wholehearted, "perfected in love" (1 John 4:17-18), pressing on toward maturity (Hebrews 6:1; Colossians 1:28; James 1:4). The traditions differ on HOW far that perfecting goes in this life; they agree it is God\'s grace-work in us, not our flawless résumé. Rest in the finished work, and keep growing.',
    },
    quiz: {
      questions: [
        {
          q: 'When the Bible says "be perfect" (Matthew 5:48; Genesis 17:1), what does the word most directly mean?',
          options: [
            'Never make a single mistake — flawless',
            'Whole, complete, mature, wholehearted — brought to its proper end',
            'Better than everyone around you',
          ],
          answer: 1,
          explain: 'The Greek teleios (from telos, "end / goal") and the Hebrew tamim both mean complete / whole / mature / sound — not modern "flawless." The KJV even renders both as "perfect," which is why the older sense matters.',
        },
        {
          q: 'How is the "perfect" Yahweh expects actually produced in you?',
          options: [
            'By trying harder until you finally never slip',
            'By God\'s grace and His Spirit growing you — His work in you, received, not manufactured',
            'It is impossible, so you should give up',
          ],
          answer: 1,
          explain: 'It is grace-work: God perfects His people in love and grows them to maturity. We receive and cooperate; we do not manufacture flawlessness by effort.',
        },
        {
          q: 'What did the apostle Paul say about his own "perfection"?',
          options: [
            '"I have already arrived and am flawless."',
            '"Not that I am already perfect... but I press on" (Philippians 3:12).',
            'He never mentioned it.',
          ],
          answer: 1,
          explain: 'Paul models the posture exactly: already accepted in Christ, not yet flawless, still pressing on. Growth, not arrival, is the honest Christian life.',
        },
        {
          q: 'Why is chasing flawless-perfection spiritually dangerous?',
          options: [
            'It is not dangerous; it is the goal.',
            'It breeds fear, anxiety, and self-condemnation, and replaces grace with a score you can never earn.',
            'It makes you too humble.',
          ],
          answer: 1,
          explain: '"Perfect love casts out fear" (1 John 4:18) — flawless-performance religion runs on fear; the Perfect God expects runs on love and rest.',
        },
      ],
    },
    // DEEP SOURCE (4D) — the deep, language-and-grace-grounded teaching.
    lesson: 'Start with the honest truth no one should have to whisper: none of us are flawless. Not the pastor, not the parent, not the saint you admire. In this third-dimensional, in-the-flesh life, a spotless, never-falter record is not on offer to anyone — "if we say we have no sin, we deceive ourselves" (1 John 1:8, ESV). So when people read "You therefore must be perfect, as your heavenly Father is perfect" (Matthew 5:48, ESV) and hear "never make a mistake or you have failed God," it crushes them — and it is a misreading. The whole lesson turns on what the word "perfect" actually means. The English word has drifted: in everyday speech today "perfect" means flawless, but that is not what the biblical words mean, and it is not even what the word meant when the King James translators chose it in 1611. The Greek behind Matthew 5:48 is teleios (Strong\'s G5046), and it comes from telos — "end, goal, purpose." Teleios means complete, brought to its proper end, lacking nothing necessary to its completeness, full-grown, mature. It is the word for ripe fruit and for a grown adult, not for a machine with zero defects. The Hebrew behind Genesis 17:1 — where God tells Abram, "walk before me, and be thou perfect" (KJV) — is tamim (Strong\'s H8549): complete, whole, sound, having integrity. Notice the beautiful clue hiding in plain sight: the KJV translates BOTH of these very different words as "perfect," while the ESV, reading the exact same words, renders Genesis 17:1 "walk before me, and be blameless" and keeps Matthew 5:48 as "perfect... as your heavenly Father is perfect" in the sense of whole and mature. Same Scripture, and the older English "perfect" simply meant whole. So there are two very different "perfects." The first is the flawless kind the flesh chases — a spotless performance you must produce to be acceptable. The Bible never sets that as the standard, and chasing it is a trap: it breeds anxiety, endless self-measuring, and the quiet terror of never being enough. That is fear-driven religion, and "there is no fear in love, but perfect love casts out fear... whoever fears has not been perfected in love" (1 John 4:18, ESV). The second is the Perfect Yahweh actually expects: a heart made whole and wholehearted, complete in its devotion, maturing toward the purpose it was made for, and — this is the freeing part — "perfected in love" (1 John 4:17). And crucially, this perfect is something GOD does in you. It is grace-work, not self-manufacture: you "let steadfastness have its full effect, that you may be perfect and complete, lacking in nothing" (James 1:4); you "go on to maturity" (Hebrews 6:1); Christ is at work to "present everyone mature in Christ" (Colossians 1:28). Even the apostle Paul — who wrote much of the New Testament — refused to claim flawlessness: "Not that I have already obtained this or am already perfect, but I press on to make it my own, because Christ Jesus has made me his own... forgetting what lies behind and straining forward to what lies ahead, I press on toward the goal" (Philippians 3:12-14, ESV). Already His, not yet flawless, still pressing on — that is the honest Christian posture, and Paul then says, "Let those of us who are mature [teleios] think this way" (Philippians 3:15). Now, sincere believers across the Body have long differed on HOW complete this perfecting becomes in this life. The Wesleyan and holiness streams have spoken of "Christian perfection" or entire sanctification — that God can so fill a heart with love that love, not sin, becomes its governing disposition (still maturing, never claiming sinless flawlessness). The Reformed stream emphasizes progressive sanctification — a real, lifelong growth in holiness that is never completed until glory, so "perfect" is chiefly the goal we press toward (Philippians 3:12). The Eastern Christian tradition speaks of theosis — being gradually transformed into the likeness of God by grace, a lifelong becoming. These are real differences, and we hold them with humility and do not divide the Body over them. But hear their common ground, because it is large and it is Word-first: all agree that the "perfect" of Scripture is NOT the flawless, never-stumble performance the flesh fears; all agree it is the work of God\'s grace and His Spirit, not something we manufacture by trying harder; all agree it centers on love and wholehearted devotion to God; and all agree it rests on the finished work of Christ, not on our résumé. So let the Word and the Spirit lead you here, not your shame. The standard was never flawless. The expectation is whole — and the same God who set the expectation is the One who grows it in you. That is not pressure. That is the kindest news your tired heart could hear.',
    facilitator: {
      talkingPoints: [
        'Two different "perfects": (1) flawless self-performance — the trap the flesh chases, which the Bible never sets as the standard and which breeds fear; (2) whole / complete / mature / wholehearted — the Perfect Yahweh actually expects, which God grows in you by grace.',
        'The language is verified, not vibes: Greek teleios (Matt 5:48, Strong\'s G5046) from telos ("end / goal") = complete, full-grown, mature, lacking nothing necessary. Hebrew tamim (Gen 17:1, Strong\'s H8549) = complete, whole, sound, integrity. Neither means "without any flaw."',
        'The translation clue: the KJV renders BOTH tamim and teleios as "perfect"; the ESV reads Gen 17:1 as "blameless" and Matt 5:48 as "perfect... as your Father is perfect" (whole/mature). The old English "perfect" simply meant whole.',
        'It is grace-work, received not manufactured: James 1:4 (perfect and complete), Hebrews 6:1 (go on to maturity), Colossians 1:28 (present everyone mature), 1 John 4:17-18 (perfected in love; perfect love casts out fear).',
        'Paul\'s posture is the model: "not that I am already perfect... but I press on" (Phil 3:12-14), then "let those of us who are mature think this way" (3:15). Already His, not yet flawless, still pressing.',
        'Evenhanded + Word-first: name the traditions fairly (Wesleyan entire-sanctification / Reformed progressive sanctification / Orthodox theosis) and their LARGE common ground; let the Word and the Spirit lead; do not divide the Body.',
        'Well-being bright line: this FREES from perfectionism. If anyone leaves more burdened, it was taught wrong. The standard was never flawless; the expectation is whole, and God grows it.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Matthew 5:48 and Genesis 17:1 aloud — ask, "what does \'perfect\' make you feel?" | The big idea, in your own words (10): name the two perfects — flawless (the trap) vs whole (what God expects); ask who has felt crushed by the flawless kind. | Go deeper — the two "perfects" (10): walk through teleios (from telos, "goal") and tamim (whole / sound), and the KJV-vs-ESV clue; land James 1:4, Hebrews 6:1, 1 John 4:18, and Paul\'s "I press on" (Phil 3:12). | Reflect together (10): use the discussion prompts; if it fits the room, name the traditions fairly and their common ground, then let the Word lead. | Take it with you (2): each person names one place they\'ve chased flawless, and trades it for "made whole, growing by grace" — carry that into one real moment.',
      discussionPrompts: [
        'Where in your life have you been carrying "flawless" as the standard — and how has that felt?',
        'What changes when you hear "perfect" as WHOLE and WHOLEHEARTED instead of flawless?',
        'Paul said "not that I am already perfect... but I press on." How does it free you that he is still growing too?',
        '"Perfect love casts out fear." Where is fear still driving how you try to be good — and what would love do instead?',
        'If God Himself grows this in you by grace, what can you stop white-knuckling today?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 2 — "The Energy You Were Given" — Darrell 2026-07-04, from the Dr.
  // Martin Picard (Columbia) mitochondrial-biology interview he brought in. The
  // science is the WITNESS; the Word is the source. Every quoted verse is KJV,
  // fetched VERBATIM from the sovereign in-app Bible (public/bible/kjv), not from
  // memory (DR-0076). Well-being-positive: it FREES the tired from burnout, it
  // does not add hustle.
  {
    id: 'll2-the-energy-you-were-given',
    title: 'The Energy You Were Given',
    bigIdea: 'You run on a real, finite daily energy — Yahweh gave you a body, not a bottomless tank. Modern science now says the biggest hidden drain on that energy is not hard work but STRESS: the anxious, churning response to it can burn up to 60% more of your energy, stealing from the repair and healing your body was going to do. The Word said it first. Yahweh built rest into the seventh day, told us to cast our care on Him, and promised rest to the weary — not as a reward for the strong, but as mercy for the tired. Stewarding your energy is not hustle; it is trust. Rest is not laziness; it is how He repairs you.',
    inApp: 'Name the one worry that has been burning your energy today — the loop you keep running in your head. Then pray it and hand it over out loud — "Casting all your care upon him; for he careth for you" (1 Peter 5:7) — make it personal: this worry is His now, not yours. Take ONE real rest you would normally skip: a walk, a nap, ten quiet minutes, an early night. Notice it is not wasted time — it is repair.',
    anchor: {
      ref: 'Matthew 11:28-30; 1 Peter 5:7',
      theme: 'The weary are invited to rest, and the anxious are told to hand their care to Yahweh. Rest and released worry are not weakness — they are His design for how a finite body is restored.',
    },
    benefits: [
      'Permission to REST — from the God who rested on the seventh day Himself; rest stops being guilt and becomes obedience.',
      'Freedom from carrying worry that is not yours to carry — you can cast it on Him, and get your energy back for what matters.',
      'A truer view of your body — a temple with a real budget, to be stewarded and cared for, not driven into the ground.',
      'Relief for the burned-out: burnout is often an energy problem, not a character flaw; the answer is trust and rest, not trying harder.',
      'Coherent energy — when your life aims at one thing (seek first His kingdom), your energy stops scattering and starts to focus.',
    ],
    levels: {
      child: 'God made your body like a phone with a battery — it has lots of energy, but not unlimited, and every day it needs to charge back up. Here is a secret scientists just found: worrying and being scared uses up your battery SUPER fast, even faster than running and playing! That is why God says you do not have to carry your worries by yourself. The Bible says you can give them to Him — "casting all your care upon him; for he careth for you" (1 Peter 5:7) — like handing a heavy backpack to your dad. And God is the One who invented rest: after He made the whole world, He rested on the seventh day (Genesis 2:2). So when you sleep, or rest, or stop worrying and pray instead, you are not being lazy — you are charging back up the way God made you to. Jesus said it so kindly: "Come unto me, all ye that labour and are heavy laden, and I will give you rest" (Matthew 11:28).',
      teen: 'Real science just caught up with the Bible. A Columbia researcher, Dr. Martin Picard, studies mitochondria — the roughly 5,000 trillion tiny engines inside you that turn food into energy. His research found something wild: the psychological stress response — worrying, spiraling, staying wound-up — can raise how much energy you burn by up to 60%, and it steals that energy from the repair your body was going to do. Translation: chronic stress literally ages you and drains you. Now read what Yahweh already said, thousands of years earlier: "Be careful for nothing [be anxious for nothing]; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds" (Philippians 4:6-7). And "casting all your care upon him; for he careth for you" (1 Peter 5:7). He is not just being nice — He is describing how you were built. Worry burns your battery; handing it to Him gives it back. Same with rest: "It is vain for you to rise up early, to sit up late, to eat the bread of sorrows: for so he giveth his beloved sleep" (Psalm 127:2). You do not earn your worth by running on empty. Rest, pray, hand off the worry — that is not weakness, that is wisdom, and now the science agrees.',
      senior: 'This lesson lands as both comfort and confirmation. Dr. Martin Picard, a behavioral-medicine and mitochondrial researcher at Columbia, frames the human being as an energetic process — roughly 5,000 trillion mitochondria transforming energy so that we live, grow, and heal — operating on a finite daily budget. His central, sobering finding: the psychological response to stress can increase energy expenditure by as much as 60%, and that surge is stolen from the long, quiet work of cellular repair and renewal — which is why chronic stress tracks with aging and with the "energy-resistance" diseases. He also observes that a strong sense of purpose is associated with more efficient mitochondrial function — a coherent life spends its energy like a laser rather than a scattered bulb. None of this is new to Scripture; it is Scripture confirmed under a microscope. Yahweh wrote rest into creation itself — "on the seventh day God ended his work... and he rested... And God blessed the seventh day, and sanctified it" (Genesis 2:2-3) — establishing that even His image-bearers are not machines. He addresses the anxiety-drain directly: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds" (Philippians 4:6-7), and "casting all your care upon him; for he careth for you" (1 Peter 5:7). He names the anxious over-striving Picard measures — "It is vain for you to rise up early, to sit up late, to eat the bread of sorrows: for so he giveth his beloved sleep" (Psalm 127:2). He supplies the coherence-of-purpose that focuses our energy — "seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you" (Matthew 6:33). And He grounds the stewardship: the body "is the temple of the Holy Ghost which is in you... therefore glorify God in your body" (1 Corinthians 6:19-20). For a seasoned saint who has spent a life pouring out, the pastoral word is release: you were never meant to run on empty, and rest is not a failure of faith but an act of it. "Come unto me, all ye that labour and are heavy laden, and I will give you rest... For my yoke is easy, and my burden is light" (Matthew 11:28,30).',
    },
    quiz: {
      questions: [
        {
          q: 'Modern mitochondrial research (Dr. Martin Picard) found the biggest hidden drain on our daily energy is:',
          options: [
            'Hard physical work',
            'The psychological STRESS response — which can raise energy expenditure up to ~60% and steal from repair',
            'Eating too little food',
          ],
          answer: 1,
          explain: 'His research points to the stress response — not labor — as the hidden cost, diverting energy from cellular repair. Scripture named the anxiety-drain long before: "Be careful for nothing... casting all your care upon him" (Philippians 4:6; 1 Peter 5:7).',
        },
        {
          q: 'What does Yahweh tell the weary and the anxious to do with their care?',
          options: [
            'Carry it alone and try harder',
            'Cast it on Him — "casting all your care upon him; for he careth for you" (1 Peter 5:7)',
            'Ignore it until it goes away',
          ],
          answer: 1,
          explain: 'We are told to hand the worry over, in prayer with thanksgiving (Philippians 4:6-7), and the peace of God guards our hearts and minds. That is not only kindness — it is how a finite body is protected from the stress-drain.',
        },
        {
          q: 'In this lesson, rest is best understood as:',
          options: [
            'Laziness that faithful people avoid',
            'Yahweh\'s own design for repair — He rested on the seventh day and gives His beloved sleep (Genesis 2:2-3; Psalm 127:2)',
            'A reward you earn only after you never fall short',
          ],
          answer: 1,
          explain: 'God built rest into creation and "giveth his beloved sleep." Rest is obedience and mercy, not weakness — it is how He restores the body He gave.',
        },
        {
          q: 'Why does a clear, God-first PURPOSE help your energy?',
          options: [
            'It does not; purpose is unrelated to energy',
            'A coherent life spends energy like a focused laser instead of a scattered bulb — "seek ye first the kingdom of God" (Matthew 6:33)',
            'Because busier is always better',
          ],
          answer: 1,
          explain: 'Picard links a strong sense of purpose to more efficient energy; Jesus points to the single aim that orders everything else — "seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you."',
        },
      ],
    },
    lesson: 'Begin with a fact your body already knows and your schedule keeps forgetting: your energy is real, and it is finite. Yahweh gave you a body, not a bottomless tank. A Columbia mitochondrial researcher, Dr. Martin Picard, puts it vividly — a human being is an energetic process, run by something like 5,000 trillion mitochondria, the tiny engines that turn food and breath into the power to live, grow, and heal — and all of it draws on a finite daily budget. Here is his sobering discovery, and it is the hinge of this lesson: the single largest hidden drain on that budget is not hard labor — it is STRESS. Not the event, but the psychological RESPONSE to it: the churning, the spiraling, the wound-up vigilance. His research indicates that response can raise your energy expenditure by as much as 60%, and every bit of that surge is stolen from the quiet, long-term work your body was going to spend on repair, renewal, and healing. That is why chronic stress ages us and feeds the "energy-resistance" diseases: the repair budget got spent on worry. Now hear the astonishing thing — none of this is new. It is Scripture, confirmed under a microscope. Thousands of years before anyone saw a mitochondrion, Yahweh addressed the exact drain Picard measures. He speaks straight to the anxious over-spender: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus" (Philippians 4:6-7, KJV). "Be careful for nothing" is the old English for "be anxious for nothing" — do not let care churn inside you; hand it up. Peter says the same with a picture: "Casting all your care upon him; for he careth for you" (1 Peter 5:7). The anxious care is a weight; you were not built to carry it, and carrying it burns the very energy you need to heal. Give it to the One who actually cares for you, and you get the budget back. And Yahweh does not only tell you to release worry — He built REST into the fabric of creation. "And on the seventh day God ended his work which he had made; and he rested on the seventh day from all his work which he had made. And God blessed the seventh day, and sanctified it" (Genesis 2:2-3). The God who never tires chose to rest, and blessed the rest, so that His image-bearers would know they are not machines. He is tender about it: "It is vain for you to rise up early, to sit up late, to eat the bread of sorrows: for so he giveth his beloved sleep" (Psalm 127:2) — the anxious rising-early and sitting-up-late is the very over-striving Picard describes, and Yahweh calls it vain and offers sleep instead. This is why Jesus\' invitation is such mercy for the tired: "Come unto me, all ye that labour and are heavy laden, and I will give you rest. Take my yoke upon you, and learn of me; for I am meek and lowly in heart: and ye shall find rest unto your souls. For my yoke is easy, and my burden is light" (Matthew 11:28-30). He does not shame the weary; He invites them. There is even a science-echo in Picard\'s work about PURPOSE: a strong sense of purpose is associated with more efficient mitochondrial function — a coherent life spends its energy like a focused laser rather than a scattered bulb. Jesus gave the single aim that makes a life coherent: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you" (Matthew 6:33). When everything in you points one direction — Him — your energy stops leaking in a hundred anxious directions and starts to burn clean. And all of this rests on a foundation the flesh forgets: this body is not merely yours to drive into the ground. "Know ye not that your body is the temple of the Holy Ghost which is in you, which ye have of God, and ye are not your own? For ye are bought with a price: therefore glorify God in your body, and in your spirit, which are God\'s" (1 Corinthians 6:19-20). Stewarding your energy — resting, releasing worry, sleeping, keeping one clear purpose — is not self-help; it is caring for His temple. And notice: Picard\'s own practical counsel is not "consume more energy" but "allocate it well," and his five ways line up, almost verse for verse, with the Word. FIRST, awareness: notice your stress-response before it runs away with your budget — what Scripture calls meditation and stillness, "in his law doth he meditate day and night" (Psalm 1:2), "Be still, and know that I am God" (Psalm 46:10). SECOND, move your body: the right dose of exercise is a HEALTHY resistance that signals the body to grow stronger and build more mitochondria — matched to your current capacity — which is Paul\'s "I keep under my body, and bring it into subjection" (1 Corinthians 9:27): train the temple, do not neglect it and do not crush it. THIRD, purpose: a strong aim focuses scattered energy like a magnet — "seek ye first the kingdom of God" (Matthew 6:33). FOURTH, eat mindfully: take what your body actually needs rather than piling on excess (Picard notes over-eating, especially sugar, adds friction the system must fight) — "Whether therefore ye eat, or drink, or whatsoever ye do, do all to the glory of God" (1 Corinthians 10:31). FIFTH, stay connected: Picard calls love itself an energetic resonance, essential to thriving — and the Word said it plainly, "Two are better than one; because they have a good reward for their labour. For if they fall, the one will lift up his fellow" (Ecclesiastes 4:9-10), "Bear ye one another\'s burdens, and so fulfil the law of Christ" (Galatians 6:2), and the deepest resonance of all: "We love him, because he first loved us" (1 John 4:19). Awareness, movement, purpose, mindful eating, and love — five ways to steward the temple, and every one of them was Yahweh\'s idea first. There is one more wonder worth naming, and it doubles as the lesson\'s capstone. Picard describes the mitochondria as a kind of cellular ANTENNA for light: components like cytochrome c oxidase can resonate with red and infrared light and help transform that energy, and early research on red-light exposure hints at gentler blood-sugar spikes by easing electrons through the mitochondrial chain (promising, still preliminary — Picard himself is cautious, and this is a lesson, not medical advice). Sit with the wonder first: the God who spoke "Let there be light: and there was light" (Genesis 1:3) wired His creatures to run on light and even to resonate with it — "God is light, and in him is no darkness at all" (1 John 1:5), "in thy light shall we see light" (Psalm 36:9), and Jesus said, "I am the light of the world: he that followeth me shall not walk in darkness, but shall have the light of life" (John 8:12). But here is the capstone, because it is the whole lesson in one shape: the light follows a BELL CURVE. A low-to-moderate dose stimulates energy and small, helpful bursts that trigger repair; too much overwhelms the cell\'s defenses and tips from healing into harm — even shutting mitochondria down. More is not better; MEASURE is better. That is the wisdom Yahweh wrote long ago, even about sweet, good things: "Hast thou found honey? eat so much as is sufficient for thee, lest thou be filled therewith, and vomit it" (Proverbs 25:16); "It is not good to eat much honey" (Proverbs 25:27); "Let your moderation be known unto all men. The Lord is at hand" (Philippians 4:5). Rest, food, exercise, even light — each is a gift that heals in measure and harms in excess. The whole of this lesson is that single, freeing truth: you were made not to consume more, but to STEWARD well what you were given. So take the weight off. Burnout is very often an energy problem, not a character flaw, and the answer the Word gives is not "try harder," it is "come to Me, cast it on Me, rest — I built you to be restored." Modern science is only now catching up to the mercy Yahweh wrote into your very cells: worry drains you, rest repairs you, purpose focuses you, and you were never meant to run on empty.',
    facilitator: {
      talkingPoints: [
        'The science (the WITNESS, attributed): Dr. Martin Picard (Columbia) — a human is an energetic process run by ~5,000 trillion mitochondria on a finite daily budget; the psychological STRESS response can raise energy expenditure up to ~60%, stealing from repair; a strong sense of PURPOSE tracks with more efficient mitochondria. Present as the modern witness, not the source.',
        'The Word said it first (the SOURCE): anxiety-drain — Philippians 4:6-7 ("be careful for nothing... the peace of God... shall keep your hearts and minds"), 1 Peter 5:7 ("casting all your care upon him"). All KJV, verbatim from the in-app Bible.',
        'Rest is Yahweh\'s design, not laziness: Genesis 2:2-3 (God rested + blessed the seventh day), Psalm 127:2 ("he giveth his beloved sleep"), Matthew 11:28-30 (Jesus\' invitation to the weary; the easy yoke).',
        'Purpose = coherence: Matthew 6:33 ("seek ye first the kingdom") — one aim focuses scattered energy like a laser. Stewardship ground: 1 Corinthians 6:19-20 (the body is the temple; glorify God in your body).',
        'Well-being bright line: this FREES the burned-out and the tired. Burnout is often an energy problem, not a character flaw. If anyone leaves feeling MORE pressure to hustle, it was taught wrong — the word is "come to Me and rest," not "do more."',
        'The capstone (measure, not more): Picard\'s red/infrared-light finding follows a BELL CURVE — a moderate dose helps, too much harms (promising but preliminary; a lesson, not medical advice). It is the whole lesson in one shape, and Yahweh wrote it long ago: "eat so much as is sufficient... lest thou vomit it" (Proverbs 25:16), "Let your moderation be known" (Philippians 4:5). Rest, food, exercise, even light — a gift in measure, a harm in excess. Steward well; do not consume more.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Matthew 11:28-30 aloud — ask, "when did you last feel truly rested?" | The big idea, in your own words (10): share the science (stress can burn up to ~60% of your energy, stolen from repair), then land it — the Word said it first; worry drains, rest repairs. | Go deeper (10): walk Philippians 4:6-7 and 1 Peter 5:7 (hand off the care), then Genesis 2:2-3 and Psalm 127:2 (rest is His design), then Matthew 6:33 (one purpose focuses energy) and 1 Corinthians 6:19-20 (your body is His temple). | Reflect together (10): use the prompts; be gentle with the burned-out in the room. | Take it with you (2): each person names one worry to cast on Him and one real rest to take this week.',
      discussionPrompts: [
        'Where is worry quietly burning your energy right now — a loop you keep running? What would it feel like to hand it to Him?',
        'Be honest: do you treat rest as laziness or as God\'s design? What changes when you read "he giveth his beloved sleep"?',
        'Jesus says "my yoke is easy, and my burden is light." Where have you picked up a heavier yoke than the one He offered?',
        'Picard found a strong sense of purpose makes energy more efficient. How could "seek ye first the kingdom" focus your scattered days?',
        'Your body is called "the temple of the Holy Ghost." What is one way you could steward it this week instead of driving it into the ground?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 3 — "Bodybuilding Christ" (the Body of Christ) — Darrell 2026-07-04,
  // from the same Dr. Martin Picard interview: the mitochondrial-symbiosis origin
  // story (energy surplus → cells turn from asocial to social → division of labor
  // → one body of many organs) as a WITNESS to the Body of Christ. Every quoted
  // verse is KJV, fetched VERBATIM from the sovereign in-app Bible (DR-0076).
  {
    id: 'll3-bodybuilding-christ',
    title: 'Bodybuilding Christ',
    bigIdea: 'Science tells an origin story: roughly 1.5 billion years ago a larger cell swallowed a small oxygen-using bacterium — the ancestor of the mitochondrion — and the sudden SURPLUS of energy changed everything. With energy to spare, cells no longer had to live only for their own survival. They could cooperate. They became a body — some cells specializing in energy, some in movement, some in thinking — until there were livers and hearts and brains, one body of many parts. That is a witness in your very cells to what Yahweh said from the beginning ("it is not good that the man should be alone") and to what the Word calls the Body of Christ: many members, one body, each given a gift, none able to say to another "I have no need of you," all suffering and rejoicing together. You were never made to survive alone. You were made to be a member — in particular — of a Body He is building.',
    inApp: 'Name your PART. What has Yahweh actually put in you to give — your gift, your "office" in the body (Romans 12:4-6)? Then do one thing this week that only a member does: either serve one person with your part, or let one person serve you with theirs (stop pretending you need no one). Say it out loud: "I am a member of the Body of Christ, in particular — not a lone cell surviving on my own."',
    anchor: {
      ref: '1 Corinthians 12:12,27; Romans 12:4-5',
      theme: 'The body is one and has many members, and all the members — being many — are one body: so also is Christ. You are the body of Christ, and members in particular. Made not to be alone, but joined.',
    },
    benefits: [
      'Freedom from the lie that you have to make it ALONE — you were designed for a body, and the science of your own cells agrees.',
      'A real place to belong — "members in particular"; you are not interchangeable or optional, you were set in the body on purpose.',
      'Permission to need others — even the eye cannot say to the hand "I have no need of thee"; asking for help is design, not weakness.',
      'Dignity for your specific gift — energy, mercy, teaching, building, helping; every part is needed, and the whole increases "in love."',
      'A cure for isolation and self-focus — the surplus of His grace frees you to stop merely surviving and start building the body up.',
    ],
    levels: {
      child: 'Here is an amazing true thing scientists found: a long, long time ago, tiny living things called cells used to live all alone, each one just trying to stay alive by itself. Then one cell got a special helper inside it (a little engine called a mitochondrion) that gave it LOTS of extra energy — and with energy to share, cells could finally work TOGETHER instead of alone. They made teams! Some cells became your heart, some became your hands, some became your brain — all different jobs, all ONE body. That is just like what God says about His people. The Bible says we are "the body of Christ" — Jesus is like the head, and every person is a different part, like a hand or an eye or a foot (1 Corinthians 12:27). Nobody is left out, and nobody has to do everything alone. God said way back at the very beginning, "It is not good that the man should be alone" (Genesis 2:18). So you were made to be part of a team — God\'s family. You have a special part to play that nobody else can play, and you need the others, and they need you. That is a happy thing!',
      teen: 'Wild science fact: about 1.5 billion years ago, one cell absorbed a little oxygen-using bacterium — the ancestor of the mitochondria that power you — and the huge ENERGY SURPLUS it unlocked is what let cells stop being "asocial" (every cell for itself) and become "social." With energy to spare, they could specialize and cooperate: some cells ran energy, some moved, some computed — and that division of labor is literally why you have a liver, a heart, and a brain instead of being a puddle of identical loners. Now hear the Word, written long before anyone knew what a mitochondrion was: "For as the body is one, and hath many members, and all the members of that one body, being many, are one body: so also is Christ" (1 Corinthians 12:12). "Now ye are the body of Christ, and members in particular" (12:27). And here is the part that hits: "the eye cannot say unto the hand, I have no need of thee" (12:21) — you were not built to flex "I don\'t need anybody." Even your cells know better. God said it in Eden: "It is not good that the man should be alone" (Genesis 2:18). You have a specific gift ("the manifestation of the Spirit is given to every man to profit withal," 12:7), the body needs YOUR part, and you need theirs. Surviving solo is not strength — it is a cell that never joined the body. You were made for more than that.',
      senior: 'For the seasoned believer this lesson offers a fresh apologetic and a deep comfort. Dr. Martin Picard recounts the endosymbiotic origin of the mitochondrion — roughly 1.5 billion years ago a larger anaerobic cell engulfed a smaller oxygen-using bacterium, and the resulting energy surplus is what made biological complexity possible. His striking framing: that surplus did not merely fund bigger cells; it changed how cells "computed" their existence, enabling a transition from asocial, self-preserving units to a social collective with a division of labor — cells specializing in energy, motility, or computation — which laid the foundation for organs and, ultimately, a body. Whatever one concludes about the mechanism and timeline, the SHAPE of the story preaches: abundance of energy makes cooperation possible; a body is many specialized parts made one. This is precisely Paul\'s doctrine of the Body of Christ, given by revelation long before cell biology: "For as the body is one, and hath many members, and all the members of that one body, being many, are one body: so also is Christ" (1 Corinthians 12:12); "But now hath God set the members every one of them in the body, as it hath pleased him" (12:18); "And the eye cannot say unto the hand, I have no need of thee" (12:21); "That there should be no schism in the body; but that the members should have the same care one for another. And whether one member suffer, all the members suffer with it; or one member be honoured, all the members rejoice with it" (12:25-26); "Now ye are the body of Christ, and members in particular" (12:27). Paul says the same in Romans — "For as we have many members in one body, and all members have not the same office: So we, being many, are one body in Christ, and every one members one of another" (Romans 12:4-5) — and Ephesians shows the mechanism of growth: "the whole body fitly joined together and compacted by that which every joint supplieth, according to the effectual working in the measure of every part, maketh increase of the body unto the edifying of itself in love" (Ephesians 4:16). The pastoral word for a life-long member: your specific part still matters — "As every man hath received the gift, even so minister the same one to another, as good stewards of the manifold grace of God" (1 Peter 4:10). Isolation, whether from wounding or weariness, runs against your very design; the surplus of grace in Christ is given precisely so that His people stop merely surviving and start building one another up in love. It was never good for the man to be alone (Genesis 2:18); it is not good now. You are a member, in particular, of a Body He is still building.',
    },
    quiz: {
      questions: [
        {
          q: 'In the science story, what let cells stop living alone and become a cooperative BODY?',
          options: [
            'They shrank to survive on less',
            'An energy SURPLUS (from the mitochondrial symbiosis) freed them to specialize and cooperate',
            'They stayed identical and independent',
          ],
          answer: 1,
          explain: 'Picard describes the mitochondrial surplus enabling the shift from asocial self-survival to a social body with a division of labor — a witness to the Body of Christ, "many members... one body" (1 Corinthians 12:12).',
        },
        {
          q: 'What does the Word call believers together?',
          options: [
            'Independent contractors who occasionally meet',
            '"The body of Christ, and members in particular" (1 Corinthians 12:27)',
            'Identical parts with the same job',
          ],
          answer: 1,
          explain: 'Many members, different offices, one body in Christ (Romans 12:4-5). You are set in the body on purpose — "in particular," not interchangeable.',
        },
        {
          q: 'Can one member rightly say to another, "I have no need of you"?',
          options: [
            'Yes — the strong should be self-sufficient',
            'No — "the eye cannot say unto the hand, I have no need of thee" (1 Corinthians 12:21)',
            'Only the head can',
          ],
          answer: 1,
          explain: 'By design, no part is independent. Needing others — and being needed — is how the body works, and how it grows "in love" (Ephesians 4:16).',
        },
        {
          q: 'What does God do when one member suffers or is honored?',
          options: [
            'Nothing; each member is on its own',
            'The whole body feels it — "all the members suffer with it... all the members rejoice with it" (1 Corinthians 12:26)',
            'Only the closest members notice',
          ],
          answer: 1,
          explain: 'The body shares suffering and joy together — which is why isolation runs against your design, and why He calls us to "the same care one for another" (12:25).',
        },
      ],
    },
    lesson: 'There is an origin story written into your cells, and it preaches. Dr. Martin Picard tells it this way: somewhere around 1.5 billion years ago, a larger cell engulfed a smaller, oxygen-using bacterium — and instead of digesting it, kept it. That captured bacterium became the mitochondrion, and the partnership unlocked a massive SURPLUS of usable energy. Here is the part that matters for this lesson: that surplus did not just make cells bigger. Picard suggests it changed how cells "computed" their own existence. A cell scraping by on the edge of survival has to be asocial — every cell for itself, all its energy spent staying alive. But a cell with energy to spare can afford to COOPERATE. It can specialize. And so, he explains, life crossed a threshold from asocial units to a social collective with a division of labor: some cells took on energy production, some movement, some computation — and that specialization is the foundation of complex bodies, of livers and hearts and brains, many different parts working as one. Now set that next to the Word, written by revelation long before anyone had seen a cell. Yahweh said it at the very beginning, over the first human: "It is not good that the man should be alone" (Genesis 2:18, KJV). Aloneness was the first thing God called "not good" in a world He kept calling good — because we were made for one another. And Paul, given the doctrine of the church, reaches for exactly this picture — a body: "For as the body is one, and hath many members, and all the members of that one body, being many, are one body: so also is Christ" (1 Corinthians 12:12). Look how closely the shape matches. There is specialization, a division of labor: "the manifestation of the Spirit is given to every man to profit withal" (12:7) — each member handed a real gift, a real office. There is divine placement, not accident: "now hath God set the members every one of them in the body, as it hath pleased him" (12:18); "now are they many members, yet but one body" (12:20). There is the end of self-sufficiency: "the eye cannot say unto the hand, I have no need of thee: nor again the head to the feet, I have no need of you" (12:21) — the very independence the flesh prizes is declared impossible for a body. There is shared life: "that there should be no schism in the body; but that the members should have the same care one for another. And whether one member suffer, all the members suffer with it; or one member be honoured, all the members rejoice with it" (12:25-26). And there is the naming: "Now ye are the body of Christ, and members in particular" (12:27) — in particular, meaning YOU, specifically, with your specific part, not an interchangeable spare. Paul says it again to Rome: "For as we have many members in one body, and all members have not the same office: So we, being many, are one body in Christ, and every one members one of another" (Romans 12:4-5). And Ephesians shows how such a body actually GROWS — not by any single member trying to be everything, but by every joint supplying its share: "the whole body fitly joined together and compacted by that which every joint supplieth, according to the effectual working in the measure of every part, maketh increase of the body unto the edifying of itself in love" (Ephesians 4:16). So here is the freeing truth, and it is why we could call this "bodybuilding Christ": you are not a lone cell, and you were never meant to be. The surplus that lets you stop merely surviving and start building is, for the believer, the surplus of His grace — poured out so that you can turn from self-preservation to self-giving, and take your particular place in the Body He is assembling. Do not despise your part because it is not another\'s; the body needs exactly what He set in you: "As every man hath received the gift, even so minister the same one to another, as good stewards of the manifold grace of God" (1 Peter 4:10). And do not wall yourself off in the name of strength; needing the others is not weakness, it is how a body lives. It was not good for the man to be alone in Eden, and it is not good now. You are a member — in particular — of the Body of Christ, and He is still building.',
    facilitator: {
      talkingPoints: [
        'The science (the WITNESS, attributed): Dr. Martin Picard — the endosymbiotic origin of mitochondria (~1.5 billion years ago) gave cells an energy SURPLUS, enabling a shift from ASOCIAL self-survival to a SOCIAL body with a division of labor (energy / movement / computation), the foundation of organs and complex bodies. Present the SHAPE of the story as a witness, not as a proof-text of any timeline.',
        'The Word said it first (the SOURCE): the Body of Christ — 1 Corinthians 12:12 ("the body is one, and hath many members... so also is Christ"), 12:27 ("ye are the body of Christ, and members in particular"), Romans 12:4-5 (many members, one body in Christ). All KJV, verbatim from the in-app Bible.',
        'Two design truths: (1) DIVISION OF LABOR / gifts — "the manifestation of the Spirit is given to every man to profit withal" (12:7); God SET each member "as it hath pleased him" (12:18); minister your gift as stewards (1 Peter 4:10). (2) END OF SELF-SUFFICIENCY — "the eye cannot say unto the hand, I have no need of thee" (12:21); needing others is design, not weakness.',
        'Shared life + growth: the body suffers and rejoices together (12:25-26), and it grows only as "every joint supplieth... unto the edifying of itself in love" (Ephesians 4:16). Aloneness was the first thing God called "not good" (Genesis 2:18).',
        'Well-being bright line: this lesson HEALS isolation and self-focus — it welcomes the lonely, the wounded, the "I don\'t need anybody" strong, and the one who thinks their part is too small. Everyone has a particular place; no one is optional; the surplus of grace is given to build one another up, not to perform.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read 1 Corinthians 12:12-27 aloud — ask, "which body part do you feel like, and why?" | The big idea, in your own words (10): tell the cell story (energy surplus → cells stop surviving alone and become one body with different jobs), then land it — that is the Body of Christ, and God said "not good to be alone" from the start. | Go deeper (10): walk the gifts/placement (12:7,18; 1 Peter 4:10), the end of self-sufficiency (12:21), shared suffering/joy (12:25-26), and growth "in love" (Ephesians 4:16). | Reflect together (10): use the prompts; gently invite the isolated and the self-sufficient. | Take it with you (2): each person names their part and one way to give it or receive another\'s this week.',
      discussionPrompts: [
        'Where have you been trying to "make it alone" — and what would change if you truly believed you were made to be a member of a body?',
        'What is YOUR particular part — the gift God set in you "to profit withal"? Where could the body use it this week?',
        '"The eye cannot say to the hand, I have no need of thee." Where is it hard for you to admit you need others — and why?',
        '"When one member suffers, all suffer... when one is honored, all rejoice." Who in the body is suffering right now that you could suffer-with?',
        'If the body grows only as "every joint supplieth... in love," what is one joint you could start supplying instead of holding back?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 4 — "Dying to Live" (the grain of wheat) — Darrell 2026-07-04, the
  // shadow side of the Body-of-Christ teaching from the same Picard interview:
  // the cancer cell ditches its mitochondria to EVADE the programmed death
  // (apoptosis) that serves the whole body, breaks the social contract, and lives
  // only to multiply — the inverse of the grain of wheat that falls and dies to
  // bear fruit. BRIGHT LINE (non-negotiable, John 9:1-3): this is a SPIRITUAL
  // analogy about self-will, NOT a claim that cancer is caused by personal sin or
  // that the sick are guilty. Jesus rejected that outright. Verses KJV, VERBATIM
  // from the in-app Bible (DR-0076). Well-being-positive; grace-centered.
  {
    id: 'll4-dying-to-live',
    title: 'Dying to Live',
    bigIdea: 'The science shows something sobering: your mitochondria hold a kind of veto over a cell\'s life and death — a healthy cell will undergo programmed death (apoptosis) for the good of the whole body when it should. A cancer cell does the opposite: it ditches or reprograms its mitochondria precisely to EVADE that death, breaks its social contract with the body, and lives only to multiply itself — and in refusing to die for the whole, it destroys the whole. Hear this first and clearly: this is a SPIRITUAL PICTURE about self-will, NOT a claim that anyone\'s cancer is caused by their sin — Jesus flatly rejected that idea ("Neither hath this man sinned, nor his parents," John 9:3). But the SHAPE of it preaches the deepest paradox Jesus taught: the life that clings only to itself is lost, and the life that falls like a grain of wheat and dies bears much fruit. Self-preservation at the body\'s expense is death; dying to self for the Body is how you — and it — truly live.',
    inApp: 'Name one place you have been the "cell that will not die" — quietly protecting your own comfort, reputation, or way at the cost of the people around you. Then, like a grain of wheat, let it fall: choose ONE small death-to-self today — yield an argument, serve unseen, forgive, give something up — for the good of someone else. Say it: "I am crucified with Christ: nevertheless I live; yet not I, but Christ liveth in me" (Galatians 2:20). Watch what your dying brings forth.',
    anchor: {
      ref: 'John 12:24-25; Luke 9:23-24',
      theme: 'Except a grain of wheat fall into the ground and die, it stays alone; but if it dies, it bears much fruit. Whoever would save his life loses it; whoever loses it for Christ\'s sake saves it. Dying to self is the doorway to real life.',
    },
    benefits: [
      'Freedom from the exhausting, endless work of self-protection — you can stop defending "you" at all costs.',
      'The great paradox as good news: what you yield is not lost; the grain that falls "bringeth forth much fruit."',
      'A clean, freeing NO to the selfishness that quietly harms the people around you — and a way back into the body.',
      'Deep comfort + a bright line: suffering and sickness are NOT God\'s punishment for sin (John 9:3); this lesson never shames the hurting.',
      'The pattern of Christ Himself — who "humbled himself, and became obedient unto death" for the body; you follow, you do not earn.',
    ],
    levels: {
      child: 'Here is a secret about seeds. If you keep a seed in your pocket to protect it, it just stays a lonely little seed forever. But if you put it in the ground — where it looks like it is dying — it grows into a big plant with LOTS of new seeds! Jesus said it is like that with us: "Except a corn of wheat fall into the ground and die... it bringeth forth much fruit" (John 12:24). It means the happiest way to live is NOT to only think about yourself — "me first, me first" — but to share, and help, and let others go first sometimes. That feels like a tiny "dying" (it is hard to give up your turn!), but it grows something beautiful. (One important thing: when people get sick, it is NOT because they did something bad — Jesus said that is not true, John 9:3. God loves them very much.) So today, do one kind "seed" thing: let someone go first, share your toy, or say sorry. You are planting a seed that grows.',
      teen: 'Real science, then the real point. Your mitochondria basically hold a "veto" over whether a cell lives or dies — a healthy cell will actually undergo programmed death (apoptosis) when that is what is best for the whole body. Cancer cells do the opposite: they ditch or hijack their mitochondria to DODGE that death, break their "social contract" with the body, and just multiply for themselves — and by refusing to die for the whole, they wreck the whole. (Serious note, do not skip it: this is a spiritual metaphor about SELFISHNESS, not a claim that anyone\'s cancer is their fault. Jesus shut that idea down hard — "Neither hath this man sinned, nor his parents," John 9:3. Sickness is not punishment.) Now the metaphor lands, because it is exactly the paradox Jesus taught: "Except a corn of wheat fall into the ground and die, it abideth alone: but if it die, it bringeth forth much fruit" (John 12:24). "Whosoever will save his life shall lose it: but whosoever will lose his life for my sake, the same shall save it" (Luke 9:24). The move everyone tells you to make — protect yourself, look out for number one, never let anyone win — is literally the cancer move: self at the expense of the body. The Jesus move is the opposite: "let him deny himself, and take up his cross daily, and follow me" (Luke 9:23). Dying to yourself is not losing; it is the only way anything real grows.',
      senior: 'This lesson pairs the previous one\'s wonder with its solemn shadow, and it must be handled with a pastor\'s care. Dr. Martin Picard describes the mitochondria as effectively holding a veto over cell fate — a healthy cell will undergo apoptosis, programmed death, for the greater good of the organism. Cancer, in this frame, is a cell that reverts to an ancestral, "asocial" state (the Warburg effect — abandoning oxidative mitochondrial energy even when oxygen is present), ditching or reprogramming its mitochondria precisely to evade that death, abandoning its social contract with the body to multiply for itself. FIRST, the bright line, because a lifetime of bad theology has wounded many: sickness is NOT divine punishment, and cancer is NOT evidence of personal sin. When the disciples asked, "Master, who did sin, this man, or his parents, that he was born blind?" Jesus answered, "Neither hath this man sinned, nor his parents: but that the works of God should be made manifest in him" (John 9:2-3). Hold that firmly for every suffering saint. With that guarded, the SHAPE of the biology witnesses to the central paradox of the gospel. "Verily, verily, I say unto you, Except a corn of wheat fall into the ground and die, it abideth alone: but if it die, it bringeth forth much fruit" (John 12:24). "He that loveth his life shall lose it; and he that hateth his life in this world shall keep it unto life eternal" (12:25). "If any man will come after me, let him deny himself, and take up his cross daily, and follow me. For whosoever will save his life shall lose it: but whosoever will lose his life for my sake, the same shall save it" (Luke 9:23-24). The self-preserving cell that will not die for the body is the very portrait of the flesh; the crucified life is its cure — "I am crucified with Christ: nevertheless I live; yet not I, but Christ liveth in me" (Galatians 2:20). Even the reprogramming has a redemptive echo: where cancer reprograms metabolism toward selfish multiplication, the believer is re-programmed toward God — "be not conformed to this world: but be ye transformed by the renewing of your mind" (Romans 12:2). And the pattern is Christ Himself, the anti-cancer, who did for the body the exact opposite of the tumor: He did not cling to His life or reputation — "Let nothing be done through strife or vainglory... Look not every man on his own things, but every man also on the things of others. Let this mind be in you, which was also in Christ Jesus... he humbled himself, and became obedient unto death, even the death of the cross" (Philippians 2:3-8). He fell like the grain of wheat, and behold the much fruit. For the seasoned believer, the pastoral word is neither shame nor striving but invitation: the long habit of self-protection can finally be laid down, because the One who loved you and gave Himself for you (Galatians 2:20) has already made the dying safe. What you yield to Him is never lost — it is planted.',
    },
    quiz: {
      questions: [
        {
          q: 'First and most important: is sickness (like cancer) God\'s punishment for a person\'s sin?',
          options: [
            'Yes — the sick must have done something wrong',
            'No — Jesus said plainly, "Neither hath this man sinned, nor his parents" (John 9:3); this lesson is a spiritual analogy, not a verdict on the sick',
            'Only sometimes',
          ],
          answer: 1,
          explain: 'Jesus rejected the who-sinned assumption outright (John 9:1-3). This lesson uses the biology as a picture of SELFISHNESS versus dying-to-self; it never blames the suffering.',
        },
        {
          q: 'In the metaphor, what makes a cancer cell destructive?',
          options: [
            'It works too hard for the body',
            'It evades the death that serves the whole and lives only to multiply itself — breaking its social contract with the body',
            'It shares too much energy',
          ],
          answer: 1,
          explain: 'The cell refuses the apoptosis that would serve the body, and self-preserves at the body\'s expense — the very shape of the flesh Jesus contrasts with the grain of wheat that falls and dies (John 12:24).',
        },
        {
          q: 'What did Jesus say happens to the grain of wheat that falls into the ground and dies?',
          options: [
            'It is wasted and gone',
            'It "bringeth forth much fruit" (John 12:24) — dying is the doorway to life',
            'It stays exactly the same',
          ],
          answer: 1,
          explain: 'The seed that clings to itself "abideth alone"; the one that falls and dies bears much fruit. Losing your life for His sake is how you save it (Luke 9:24).',
        },
        {
          q: 'Who is the perfect pattern of dying-to-self for the body?',
          options: [
            'No one has ever done it',
            'Christ Himself — He "humbled himself, and became obedient unto death, even the death of the cross" (Philippians 2:8)',
            'Only very strong people',
          ],
          answer: 1,
          explain: 'Jesus is the anti-cancer: He did not cling to His life or reputation but poured Himself out for the body. We follow His pattern by grace — "yet not I, but Christ liveth in me" (Galatians 2:20).',
        },
      ],
    },
    lesson: 'This lesson is the solemn shadow of the last one, and it must be held with care. In the same interview, Dr. Martin Picard describes something remarkable about the mitochondria: they hold a kind of VETO over a cell\'s fate. A healthy cell, when it is damaged or no longer serving the whole, will undergo apoptosis — programmed death — for the greater good of the body. That built-in willingness of a part to die for the whole is part of what makes a body a body. Cancer, in his frame, is the betrayal of exactly that. A tumor cell reverts to an ancestral, "asocial" state — the Warburg effect, abandoning normal mitochondrial energy production even when oxygen is available — and it ditches or reprograms its mitochondria precisely to EVADE the death signal, so that it can go on multiplying for itself. It breaks its social contract with the body. And here is the tragedy in one line: by refusing to die for the whole, the cancer cell destroys the whole — and itself with it. Now, before we draw the spiritual lesson, we must set a bright line and never cross it: this is a PICTURE of self-will, not a diagnosis of anyone\'s soul. Sickness is NOT God\'s punishment, and cancer is NOT evidence of secret sin. Jesus was asked this exact question — "Master, who did sin, this man, or his parents, that he was born blind?" — and He answered, "Neither hath this man sinned, nor his parents: but that the works of God should be made manifest in him" (John 9:2-3). Hold that tenderly over every person who is suffering. With that guarded, hear how precisely the SHAPE of the biology echoes the deepest paradox Jesus ever taught. He said: "Verily, verily, I say unto you, Except a corn of wheat fall into the ground and die, it abideth alone: but if it die, it bringeth forth much fruit" (John 12:24). A seed that protects itself — that refuses to fall and die — "abideth alone," fruitless, exactly like the self-preserving cell. But the seed that dies brings forth much fruit. He pressed it further: "He that loveth his life shall lose it; and he that hateth his life in this world shall keep it unto life eternal" (John 12:25); "If any man will come after me, let him deny himself, and take up his cross daily, and follow me. For whosoever will save his life shall lose it: but whosoever will lose his life for my sake, the same shall save it" (Luke 9:23-24). Read those with the cancer cell in mind and they land with new force: the instinct the whole world calls wisdom — protect yourself, look out for number one, never yield, multiply your own — is, spiritually, the cancer move: self at the expense of the body. And the cure is a death: "I am crucified with Christ: nevertheless I live; yet not I, but Christ liveth in me: and the life which I now live in the flesh I live by the faith of the Son of God, who loved me, and gave himself for me" (Galatians 2:20). There is even a redemptive echo in the "reprogramming": where the tumor reprograms its metabolism toward selfish multiplication, the believer is re-programmed the other way — "be not conformed to this world: but be ye transformed by the renewing of your mind" (Romans 12:2). And the whole pattern is embodied in Christ, who is the very anti-cancer of the universe: He did for the body the exact opposite of the tumor. He did not cling to His life, His rights, or His reputation. "Let nothing be done through strife or vainglory; but in lowliness of mind let each esteem other better than themselves. Look not every man on his own things, but every man also on the things of others. Let this mind be in you, which was also in Christ Jesus... [who] made himself of no reputation, and took upon him the form of a servant... he humbled himself, and became obedient unto death, even the death of the cross" (Philippians 2:3-8). He fell like the grain of wheat — and behold the much fruit: a whole Body, redeemed. So this is the invitation, and it is freeing, not crushing: you can finally stop the exhausting labor of self-protection. Dying to self is not the end of you; it is the doorway to real life and real fruit, and the One who asks it of you went first, "who loved me, and gave himself for me." What you yield to Him is never wasted. It is planted.',
    facilitator: {
      talkingPoints: [
        'BRIGHT LINE FIRST (say it out loud, every time): this lesson is a SPIRITUAL analogy about self-will, NOT a claim that cancer/sickness is caused by sin or is God\'s punishment. Jesus rejected that flatly — "Neither hath this man sinned, nor his parents" (John 9:2-3). Never let a suffering person hear condemnation here. If the room includes someone sick or grieving, lead with this and mean it.',
        'The science (the WITNESS, attributed): Dr. Martin Picard — mitochondria hold a "veto" on cell fate; a healthy cell undergoes apoptosis (programmed death) for the good of the whole. Cancer ditches/reprograms its mitochondria to EVADE that death (the Warburg effect — reverting to ancestral, asocial self-multiplication), breaking its social contract with the body.',
        'The paradox (the SOURCE): the grain of wheat — "Except a corn of wheat fall into the ground and die... if it die, it bringeth forth much fruit" (John 12:24); "whosoever will save his life shall lose it" (Luke 9:24); "deny himself, and take up his cross daily" (Luke 9:23). Self-preservation at the body\'s expense is the flesh; dying to self is the doorway to life.',
        'The cure + the pattern: "I am crucified with Christ... yet not I, but Christ liveth in me" (Galatians 2:20); re-programmed not by self but by renewal (Romans 12:2); and Christ Himself as the anti-cancer — He "humbled himself, and became obedient unto death" for the body (Philippians 2:3-8). We follow by grace, we do not earn.',
        'Well-being bright line: this FREES from the exhausting work of self-protection; it is invitation, not shame. If anyone leaves feeling condemned (for selfishness OR for being sick), it was taught wrong. The word is "the grain that falls bears much fruit," and "He loved me, and gave Himself for me."',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read John 12:24-25 aloud — and IMMEDIATELY set the bright line (John 9:3): sickness is not punishment; this is a picture of self-will. | The big idea, in your own words (10): tell the cell story (a healthy cell will die for the body; cancer evades that death to multiply for itself), then land the paradox — the seed that clings stays alone; the seed that dies bears fruit. | Go deeper (10): walk Luke 9:23-24 (deny self / save-lose your life), Galatians 2:20 (crucified with Christ), Romans 12:2 (renewed, not conformed), and Christ\'s own pattern (Philippians 2:3-8). | Reflect together (10): use the prompts; be gentle, especially with anyone hurting. | Take it with you (2): each person names one small death-to-self to plant this week.',
      discussionPrompts: [
        'Before anything else: where have you (or the church) treated suffering as punishment? What changes when you hear Jesus say "Neither hath this man sinned"?',
        'Where are you the "seed in the pocket" — protecting yourself so carefully that nothing new can grow? What would it look like to let it fall?',
        '"Whosoever will save his life shall lose it." Where has clinging to your own way, comfort, or reputation actually cost you life?',
        'Christ "made himself of no reputation" and served. What is one reputation or right you sense Him inviting you to lay down for the body?',
        'What is one small, specific death-to-self you can plant this week — and who would it bear fruit for?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 5 — "Take No Thought for Tomorrow" (fear vs faith / out of survival
  // mode) — Darrell 2026-07-04, from the Picard interview: stress hormones
  // (cortisol) signal DANGER and force the body to reallocate its finite energy
  // budget away from long-term maintenance toward immediate survival; chronic
  // fear releases GDF-15, a "sickness response" of fatigue and lost motivation.
  // The antidote is Jesus\' "take no thought" — faith that frees you from survival
  // mode. Verses KJV, VERBATIM from the in-app Bible (DR-0076). "Take no thought"
  // means do not be consumed by anxious dread — NOT be careless or refuse to plan
  // (Scripture also commends foresight); it frees, never shames.
  {
    id: 'll5-take-no-thought-for-tomorrow',
    title: 'Take No Thought for Tomorrow',
    bigIdea: 'Your body has a survival switch. When stress hormones like cortisol sense DANGER, the body reallocates its finite energy away from long-term maintenance and repair and toward immediate survival — a brilliant design for a real emergency. The problem is that chronic worry keeps that switch flipped for dangers that are mostly imagined, so you spend your future fighting a threat that never comes; science even names a "sickness response" (via a stress marker called GDF-15) that drains motivation and energy when fear runs long. Yahweh knew this survival wiring, and Jesus speaks straight to it: "Take no thought for your life... Take therefore no thought for the morrow." That is not a command to be careless — it is an invitation OUT of survival mode. Your Father feeds the birds and clothes the fields; He knows what you need. Fear reallocates your energy to a danger that is not real; faith gives it back for today, for repair, and for the Kingdom.',
    inApp: 'Name the "tomorrow" you have been living in — the what-if you keep rehearsing that has you in survival mode today. Then hand today\'s portion of it to your Father and refuse to carry the rest: "Take therefore no thought for the morrow... Sufficient unto the day is the evil thereof" (Matthew 6:34). Do ONE ordinary thing right now — a meal, a walk, a task, a rest — fully present, trusting Him for the morning. Fear spends tomorrow\'s strength today; faith lets you actually live now.',
    anchor: {
      ref: 'Matthew 6:25-34; Hebrews 11:1; 2 Timothy 1:7',
      theme: 'Take no thought for your life or the morrow — your Father knows what you need. Fear and faith both work on the unseen: faith is "the substance of things hoped for, the evidence of things not seen" (Hebrews 11:1). Give your substance to Him, not to dread — the way out of survival mode.',
    },
    benefits: [
      'A way OUT of survival mode — you can stop burning tomorrow\'s strength on dangers that never arrive.',
      'Relief for the anxious body — chronic fear is exhausting by design; trust gives your energy back for living and repair.',
      'A truer picture of God — a Father who feeds the birds and knows your needs, not a distant judge you must out-worry.',
      'Freedom from the tyranny of "tomorrow" — you get to actually live TODAY, present and unhurried.',
      'A settled mind — not the spirit of fear, but "power, and of love, and of a sound mind" (2 Timothy 1:7).',
    ],
    levels: {
      child: 'Your body has an alarm inside it. When something scary happens, the alarm goes off and gives you fast energy to run or get safe — that is a GOOD thing when there is a real lion! But here is the tricky part: if you WORRY about scary things that are not even happening (What if tomorrow goes bad? What if...?), your alarm keeps ringing and ringing and wears you out for nothing. So Jesus said something kind: "Take no thought for your life... Behold the fowls of the air: for they sow not, neither do they reap... yet your heavenly Father feedeth them. Are ye not much better than they?" (Matthew 6:25-26). Look at the birds — God feeds them, and He loves YOU even more! He knows everything you need. So you do not have to be scared about tomorrow. Jesus said, "Take therefore no thought for the morrow" (6:34) — just love God and be here today, and let Him take care of tomorrow. God even says, "Fear thou not; for I am with thee" (Isaiah 41:10). You are safe with Him.',
      teen: 'Actual science: when you\'re stressed, cortisol tells your body "DANGER," and your body reallocates its energy away from long-term repair toward instant survival — great for a real emergency, terrible as a lifestyle. If you stay in worry mode, you\'re basically running your fight-or-flight system on a threat that isn\'t even here, and researchers describe a "sickness response" that tanks your motivation and energy when stress runs chronic. Now hear Jesus, who understood this two thousand years early: "Take no thought for your life... Which of you by taking thought can add one cubit unto his stature?" (Matthew 6:25,27) — worrying literally cannot add a thing. "Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself. Sufficient unto the day is the evil thereof" (6:34). He\'s not saying don\'t plan or be lazy; He\'s saying don\'t let dread of tomorrow rob today. Why can you? Because "your heavenly Father knoweth that ye have need of all these things" (6:32). And this is huge: "God hath not given us the spirit of fear; but of power, and of love, and of a sound mind" (2 Timothy 1:7). Anxiety is not your assignment. Living in survival mode is not strength — it\'s a battery drain over a threat that isn\'t real. Faith is what lets you actually live.',
      senior: 'Dr. Martin Picard describes a mechanism the anxious heart knows well: stress hormones such as cortisol signal external danger and force the body to reallocate its finite energy budget away from long-term maintenance and repair toward immediate survival — an adaptive response for a genuine emergency, but corrosive when sustained. His research quantifies the cost (the psychological stress response can raise energy expenditure by as much as 60%), and he highlights GDF-15, an "energy stress marker" that, when mitochondrial strain runs high, travels to the brain stem and triggers a "sickness response" — fatigue, suppressed motivation, altered metabolism — with chronic stress becoming a prognostic marker for metabolic, cardiovascular, and mental illness. In other words, unrelenting fear is metabolically expensive and self-harming. This is exactly the human condition Jesus addresses in the Sermon on the Mount, and He does not scold the anxious; He reasons with them tenderly. "Take no thought for your life, what ye shall eat, or what ye shall drink; nor yet for your body, what ye shall put on... Behold the fowls of the air: for they sow not, neither do they reap, nor gather into barns; yet your heavenly Father feedeth them. Are ye not much better than they?" (Matthew 6:25-26). He exposes the futility of it: "Which of you by taking thought can add one cubit unto his stature?" (6:27) — anxiety adds nothing, though it costs everything. He locates the cure in the Father\'s knowledge and care: "your heavenly Father knoweth that ye have need of all these things" (6:32), and He gives the plain command with its gentle reason: "Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself. Sufficient unto the day is the evil thereof" (6:34). Note carefully what "take no thought" does NOT mean: Scripture elsewhere commends foresight and diligent planning (Proverbs), so this is not a call to carelessness — the Greek is the anxious, dividing worry that scatters the soul, not wise preparation. The rest of the canon supplies the same medicine: "There is no fear in love; but perfect love casteth out fear" (1 John 4:18); "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind" (2 Timothy 1:7); "Fear thou not; for I am with thee: be not dismayed; for I am thy God" (Isaiah 41:10); "Cast thy burden upon the LORD, and he shall sustain thee: he shall never suffer the righteous to be moved" (Psalm 55:22). For a saint who has carried decades of cares, the pastoral word is permission to come down off high alert. The survival switch was a mercy for real danger; it was never meant to be your permanent home. Your Father sees, your Father knows, your Father feeds even the birds — and you are much better than they. Faith is not denial of tomorrow; it is entrusting tomorrow to the One who already holds it, so your strength is freed for today.',
    },
    quiz: {
      questions: [
        {
          q: 'What does the body do under stress/fear, according to the science?',
          options: [
            'Nothing changes',
            'It reallocates its finite energy AWAY from long-term repair toward immediate survival — costly when the "danger" is only worry',
            'It permanently increases its total energy',
          ],
          answer: 1,
          explain: 'Cortisol signals danger and shifts the budget to survival mode; chronic fear keeps it flipped for threats that never come — exactly the anxious over-thought Jesus addresses in Matthew 6.',
        },
        {
          q: 'What did Jesus say worrying can accomplish?',
          options: [
            'It can fix the future if you do it hard enough',
            'Nothing — "Which of you by taking thought can add one cubit unto his stature?" (Matthew 6:27)',
            'It is required to be responsible',
          ],
          answer: 1,
          explain: 'Anxiety adds nothing though it costs everything. "Take no thought" means do not let dread rob today — not that we cannot plan wisely.',
        },
        {
          q: 'Why can we "take no thought for the morrow"?',
          options: [
            'Because nothing bad ever happens',
            'Because "your heavenly Father knoweth that ye have need of all these things" (Matthew 6:32) — He sees and provides',
            'Because tomorrow does not matter',
          ],
          answer: 1,
          explain: 'The ground of freedom from fear is the Father\'s knowledge and care — He feeds the birds and knows your needs. "Sufficient unto the day is the evil thereof" (6:34).',
        },
        {
          q: 'What spirit has God given His people?',
          options: [
            'A spirit of fear, to keep them careful',
            '"Power, and of love, and of a sound mind" — "not... the spirit of fear" (2 Timothy 1:7)',
            'No spirit at all',
          ],
          answer: 1,
          explain: 'Fear is not your assignment. "There is no fear in love; but perfect love casteth out fear" (1 John 4:18). Faith is the way out of survival mode.',
        },
      ],
    },
    lesson: 'God built you with a survival switch, and it is a mercy. When real danger appears, stress hormones like cortisol sound the alarm and the body instantly reallocates its finite energy — pulling it away from slow, long-term work like repair and maintenance and pouring it into immediate survival: sharpen the senses, tense the muscles, run or fight. For a genuine emergency, this is genius. Dr. Martin Picard\'s research shows how expensive it is — the psychological stress response can raise energy expenditure by as much as 60%, all of it borrowed from the future — and he describes a stress marker called GDF-15 that, when the strain runs high, signals the brain stem and triggers a "sickness response": fatigue, sunken motivation, an altered metabolism. Sustained, this becomes a marker for metabolic, heart, and mental illness. Here is the trap in one sentence: the survival switch cannot tell the difference between a lion and a worry. So a mind that rehearses tomorrow\'s what-ifs keeps the alarm ringing for dangers that never arrive, and spends its future strength fighting phantoms. Long before anyone measured cortisol, Jesus walked straight into this exact wiring — and notice, He does not scold the anxious; He reasons with them, gently, like a good Father. "Therefore I say unto you, Take no thought for your life, what ye shall eat, or what ye shall drink; nor yet for your body, what ye shall put on. Is not the life more than meat, and the body than raiment?" (Matthew 6:25). Then He points to the birds: "Behold the fowls of the air: for they sow not, neither do they reap, nor gather into barns; yet your heavenly Father feedeth them. Are ye not much better than they?" (6:26). He exposes how useless the worry is: "Which of you by taking thought can add one cubit unto his stature?" (6:27) — anxiety cannot add a single inch, though it drains the whole tank. He names the ground of our peace, and it is not that nothing bad ever happens, but that we are seen: "for your heavenly Father knoweth that ye have need of all these things" (6:32). And then the plain command, with its kind reason attached: "Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself. Sufficient unto the day is the evil thereof" (6:34). Hear carefully what "take no thought" does NOT mean — it is not a call to be careless or to refuse to plan, for the same Scriptures praise foresight and diligence. The thing Jesus forbids is the anxious, dividing DREAD that scatters the soul and burns tomorrow\'s energy today; He is not against wise preparation, He is against fear ruling you. And the rest of the Word hands you the same medicine. "There is no fear in love; but perfect love casteth out fear: because fear hath torment" (1 John 4:18) — fear is torment, and love is its cure. "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind" (2 Timothy 1:7) — that churning dread is not from Him; a sound mind is your inheritance. He says it as a Father to a frightened child: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee" (Isaiah 41:10). And He tells you exactly what to do with the weight: "Cast thy burden upon the LORD, and he shall sustain thee: he shall never suffer the righteous to be moved" (Psalm 55:22). So come down off high alert. The survival switch was given for the real lion, not for a lifetime of imagined ones. Every hour you spend dreading a tomorrow that is not here, you are spending strength you were meant to live on today — and your Father, who feeds the sparrows and clothes the fields and already holds your tomorrow, is asking you, kindly, to let Him carry it. Faith is not pretending there is no tomorrow; it is entrusting tomorrow to the One who is already there. And here is the key that unlocks the whole lesson — it is astonishing in this context: fear and faith BOTH operate on the unseen. Worry hands its strength to a tomorrow you cannot see, making a dreaded, imagined future feel present and real so that your body spends itself on it. Now read how the Word defines faith: "Now faith is the substance of things hoped for, the evidence of things not seen" (Hebrews 11:1). Faith works in the very same unseen realm as fear — the not-yet, the invisible, the tomorrow that has not come — but it gives its substance to what is HOPED for instead of what is dreaded. Fear is substance handed to the worst unseen thing; faith is substance handed to the best: to the Father who is there, who feeds the birds, who already holds the morning ("he that cometh to God must believe that he is, and that he is a rewarder of them that diligently seek him," Hebrews 11:6). So the question your survival switch is really asking is: which unseen thing will you give your substance to? Give it to dread, and you live in torment, spending tomorrow\'s strength today. Give it to Him, and that same energy is set free to live. Faith is not the absence of the unseen — it is the substance of the RIGHT unseen. Take no thought for the morrow. Your Father knows. You are much better than the birds.',
    facilitator: {
      talkingPoints: [
        'The science (the WITNESS, attributed): Dr. Martin Picard — cortisol/stress signals DANGER and reallocates the finite energy budget from long-term maintenance to immediate survival; the stress response can cost up to ~60% more energy; the GDF-15 "sickness response" (fatigue, lost motivation) sets in under chronic stress. The survival switch cannot tell a lion from a worry.',
        'The Word (the SOURCE): Jesus reasons tenderly with the anxious — "Take no thought for your life... Behold the fowls of the air... your heavenly Father feedeth them" (Matthew 6:25-26); worry adds nothing (6:27); the Father knows your needs (6:32); "Take therefore no thought for the morrow... Sufficient unto the day is the evil thereof" (6:34). All KJV, verbatim.',
        'What "take no thought" does NOT mean: not carelessness, not a ban on planning (Scripture praises foresight) — it forbids anxious, dividing DREAD that rules you, not wise preparation. Say this plainly so no diligent person feels condemned.',
        'The medicine: "perfect love casteth out fear... fear hath torment" (1 John 4:18); "not... the spirit of fear; but of power, and of love, and of a sound mind" (2 Timothy 1:7); "Fear thou not; for I am with thee" (Isaiah 41:10); "Cast thy burden upon the LORD, and he shall sustain thee" (Psalm 55:22).',
        'Well-being bright line: this FREES the anxious out of survival mode; it is invitation, not more pressure. If anyone leaves more afraid (or ashamed of being afraid), it was taught wrong. The word is "your Father knows," and "you are much better than the birds."',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Matthew 6:25-34 aloud — ask, "what \'tomorrow\' do you keep rehearsing?" | The big idea, in your own words (10): explain the survival switch (fear reallocates energy for a danger that may not be real), then land it — worry cannot add a cubit, but the Father feeds the birds and knows your needs. | Go deeper (10): clarify "take no thought" (not carelessness — anxious dread), then walk 2 Timothy 1:7, 1 John 4:18, Isaiah 41:10, Psalm 55:22. | Reflect together (10): use the prompts; be gentle with the fearful. | Take it with you (2): each person names one "tomorrow" to hand to the Father and one ordinary thing to do fully present today.',
      discussionPrompts: [
        'What "tomorrow" do you keep living in — the what-if you rehearse that keeps you on high alert today?',
        '"Which of you by taking thought can add one cubit?" Where has worry cost you a lot and changed nothing?',
        'Jesus points to the birds and says your Father feeds them — where is it hard for you to believe He sees and will provide for YOU?',
        '"God hath not given us the spirit of fear, but... a sound mind." What would change if you truly believed the dread is not from Him?',
        'What is one burden you could cast on the Lord this week (Psalm 55:22) — and one ordinary thing you could do fully present, trusting Him for the morning?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 6 — "Think on These Things" — Darrell 2026-07-04, the capstone of the
  // arc: the eternal, UNSEEN substances (faith, hope, love — 1 Cor 13:13) that
  // ABIDE, ours through a redemption foreordained before the foundation of the
  // world (1 Peter 1:19-20; Ephesians 1:4). Where the previous lessons showed the
  // mind reallocating the body's energy (fear → survival), here Yahweh tells us
  // exactly where to put the mind: Philippians 4:8 — the platform's "the Test" /
  // Mind of Christ, in lesson form. Verses KJV, VERBATIM from the in-app Bible
  // (DR-0076). Well-being-positive; grace-centered.
  {
    id: 'll6-think-on-these-things',
    title: 'Think on These Things',
    bigIdea: 'The lessons before this showed a startling truth: where your mind goes, your body\'s very energy follows — dread reallocates your whole being toward a temporal, unseen threat. So the most important question you can ask is not "what will happen?" but "what will I set my mind on?" And Yahweh does not leave that vague. He hands you the list: "whatsoever things are true... honest... just... pure... lovely... of good report... think on these things" (Philippians 4:8). The greatest realities are UNSEEN and eternal — faith, hope, and love, which abide (1 Corinthians 13:13) — and they are yours through a redemption He decided "before the foundation of the world." Fear gives the mind\'s substance to a passing shadow; faith gives it to the eternal. He tells you what to think about because He loves you — and because what you behold, you become.',
    inApp: 'Catch one thought that has been running you today — a fear, an offense, a lust, a dread — and hold it up to His list: Is it TRUE? honest? just? pure? lovely? of good report? (This is "the Test," Philippians 4:8.) If it fails, set it down. Then deliberately THINK ON one thing that passes — a real promise, a mercy He\'s shown you, His love, something genuinely good and lovely. "Set your affection on things above, not on things on the earth" (Colossians 3:2). What you think on today, you are becoming.',
    anchor: {
      ref: 'Philippians 4:8; 2 Corinthians 4:18',
      theme: 'God tells us what to think on — the true, honest, just, pure, lovely, of good report. And He points our gaze past the seen and temporal to the unseen and eternal. What fills the mind shapes the whole person.',
    },
    benefits: [
      'Freedom + authority over your own mind — you are not at the mercy of every thought; you get to choose the substance you dwell on.',
      'A clear, given list (not vague willpower) — the true, honest, just, pure, lovely, of good report: the Father tells you exactly where to look.',
      'Peace that guards the heart — a mind fixed on the eternal is not tossed by every temporal shadow (Isaiah 26:3; Philippians 4:7-8).',
      'Deep security — the love and redemption you rest in were decided "before the foundation of the world," not this morning and not by your performance.',
      'Real transformation — what you behold, you become; setting the mind on things above renews the whole person (Romans 12:2; Colossians 3:2).',
    ],
    levels: {
      child: 'Your mind is like a garden, and your thoughts are like seeds. Whatever you keep thinking about is what grows! So if you keep planting scary or mean thoughts, those grow big. But God gave us a wonderful gardening rule for our minds — He tells us exactly which seeds to plant: "whatsoever things are true... lovely... of good report... think on these things" (Philippians 4:8). That means think about things that are TRUE, KIND, PURE, and BEAUTIFUL — like how much God loves you, the good things He\'s done, and people you can be thankful for. And guess what? The best things of all are things you cannot even see — like faith, and hope, and LOVE (1 Corinthians 13:13). You cannot hold love in your hand, but it is the realest, strongest thing there is, and it lasts forever! God even loved YOU and made a way for you before He made the whole world. So when a yucky thought comes, you can say "no thank you" and plant a good one instead. Think on the good things — and watch your garden grow beautiful.',
      teen: 'Here\'s the through-line of everything: where your mind goes, your energy and your whole self follow. You literally become what you dwell on. That\'s why the most powerful move you can make is choosing what you think about — and the incredible thing is God does not make you guess. He gives you the exact filter: "Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things" (Philippians 4:8). Run your thoughts through that. Most of what the world feeds you — outrage, comparison, lust, dread — fails every test. And here\'s the deep part that connects to the last lesson: the BIGGEST realities are invisible. "We look not at the things which are seen, but at the things which are not seen: for the things which are seen are temporal; but the things which are not seen are eternal" (2 Corinthians 4:18). Faith, hope, love — "these three; but the greatest of these is charity [love]" (1 Corinthians 13:13) — you can\'t see them, but they outlast everything you can. And you got access to all of it through Jesus, whose rescue of you was planned "before the foundation of the world" (Ephesians 1:4; 1 Peter 1:20) — before you existed, before earth existed, you were loved. So stop letting your feed program your mind. "Set your affection on things above" (Colossians 3:2). Think on these things. You\'re becoming them.',
      senior: 'This lesson gathers the whole series into a single, practical charge, and it is the heart of the Mind of Christ. The prior lessons traced how the mind governs the body\'s energy — how fear reallocates our very substance toward a dreaded, unseen future. Here the Word turns that same power to glory: since the mind shapes the whole person, God tells us precisely what to set it on. "Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things" (Philippians 4:8). It is not vague self-help; it is a given, testable list — a filter for every thought that comes. And it rests on the deep truth Darrell named: the greatest substances are unseen and eternal. "While we look not at the things which are seen, but at the things which are not seen: for the things which are seen are temporal; but the things which are not seen are eternal" (2 Corinthians 4:18). "And now abideth faith, hope, charity, these three; but the greatest of these is charity" (1 Corinthians 13:13) — the abiding realities are precisely the ones no eye can see, and they are ours not by our striving but by a grace settled before time began: we were chosen "in him before the foundation of the world, that we should be holy and without blame before him in love" (Ephesians 1:4), redeemed "with the precious blood of Christ, as of a lamb without blemish and without spot: who verily was foreordained before the foundation of the world, but was manifest in these last times for you" (1 Peter 1:19-20). Read that last phrase slowly — "for you." Before the foundation of the world, the Lamb\'s blood was appointed, for you. That is the eternal, unseen substance faith lays hold of (Hebrews 11:1), and it is the surest ground a mind can stand on. So the instruction "set your affection on things above, not on things on the earth" (Colossians 3:2) is not escapism; it is realism — fixing the mind on what is most real and most lasting. For the seasoned saint, this is both discipline and rest: the discipline of testing each thought against Philippians 4:8 (the practiced habit — notice a thought, test it, keep or release it), and the rest of knowing the outcome was secured before the world was made. What you behold, you become; behold Him, and His peace will keep your heart and mind (Philippians 4:7). Think on these things.',
    },
    quiz: {
      questions: [
        {
          q: 'What does God tell us to think about (Philippians 4:8)?',
          options: [
            'Whatever the world puts in front of you',
            'Whatsoever things are true, honest, just, pure, lovely, of good report, virtuous, praiseworthy',
            'Mostly your problems, so you stay prepared',
          ],
          answer: 1,
          explain: 'He gives an exact, testable list — not vague willpower. This filter (often called "the Test") is how a renewed mind sorts every thought that comes.',
        },
        {
          q: 'According to 2 Corinthians 4:18, which things are eternal?',
          options: [
            'The things which are seen',
            'The things which are NOT seen — "the things which are seen are temporal; but the things which are not seen are eternal"',
            'Both equally',
          ],
          answer: 1,
          explain: 'The greatest substances — faith, hope, love (1 Corinthians 13:13) — are unseen, and they outlast everything visible. Faith is how we lay hold of them (Hebrews 11:1).',
        },
        {
          q: 'When was your redemption in Christ decided?',
          options: [
            'When you finally got your life together',
            '"Before the foundation of the world" — the Lamb was "foreordained before the foundation of the world... for you" (1 Peter 1:20; Ephesians 1:4)',
            'It is still undecided',
          ],
          answer: 1,
          explain: 'Your acceptance rests on a grace settled before time began and before you existed — not on your performance. That is the surest ground a mind can stand on.',
        },
        {
          q: 'Why does what you think about matter so much?',
          options: [
            'It does not really matter',
            'Because what you behold, you become — the mind shapes the whole person, so "set your affection on things above" (Colossians 3:2)',
            'Only actions matter, never thoughts',
          ],
          answer: 1,
          explain: 'The mind governs the person (Romans 12:2). Fixing it on the true and eternal renews you and guards your heart with God\'s peace (Philippians 4:7).',
        },
      ],
    },
    lesson: 'This lesson gathers the whole journey into one charge. We saw across these lessons how the mind rules the body — how fear reallocates our very energy toward a dreaded, unseen future, and how faith is "the substance of things hoped for, the evidence of things not seen" (Hebrews 11:1). If the mind holds that much power over the whole person, then the most consequential decision you make all day is not what you do but what you dwell on — and here is the mercy: Yahweh does not leave you to guess. He tells you exactly what to set your mind on. "Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things" (Philippians 4:8). That is not a vague suggestion to "be positive"; it is a precise, testable filter for every thought that comes knocking. Is it true? honest? just? pure? lovely? of good report? Most of what the world pours into you — outrage, comparison, lust, dread, offense — fails on the first question and never even reaches the last. You are not obligated to think it. You can hold it up to the list, and if it fails, set it down. Now hear the deep thing Darrell saw, because it is the ground under the whole command: the greatest, realest substances cannot be seen. "While we look not at the things which are seen, but at the things which are not seen: for the things which are seen are temporal; but the things which are not seen are eternal" (2 Corinthians 4:18). "And now abideth faith, hope, charity, these three; but the greatest of these is charity" (1 Corinthians 13:13). Faith, hope, love — you cannot hold one of them in your hand, and yet they are the substances that outlast the sun. And they are yours, not because you earned them this morning, but because of a grace decided before you or the world existed: God "hath chosen us in him before the foundation of the world, that we should be holy and without blame before him in love" (Ephesians 1:4), redeemed "with the precious blood of Christ, as of a lamb without blemish and without spot: who verily was foreordained before the foundation of the world, but was manifest in these last times for you" (1 Peter 1:19-20). Slow down on those two words — "for you." Before the foundation of the world, the Lamb\'s precious blood was already appointed, for you. That is the eternal, unseen substance your faith lays hold of, and it is the most solid thing a mind can rest on: your acceptance was settled outside of time, and no failing tomorrow can un-decide it. This is why the instruction "set your affection on things above, not on things on the earth" (Colossians 3:2) is not escape from reality — it is a return to it, fixing the mind on what is most real and most lasting. And it is a practice, not a one-time feeling: notice a thought, test it by Philippians 4:8, keep the true and lovely, release the rest — again and again, until the renewed mind becomes your default (Romans 12:2). Here is the promise that crowns it: what you behold, you become. Give your mind to fear, and you will be anxious; give it to offense, and you will be bitter; but give it to the true, the pure, the lovely, and to Him, and "the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus" (Philippians 4:7 — the verse just before the list). He tells you what to think on, not to burden you, but because He loves you, and because He knows that the mind fixed on Him is the mind at rest. Think on these things.',
    facilitator: {
      talkingPoints: [
        'The charge (the SOURCE): Philippians 4:8 — a given, TESTABLE list (true / honest / just / pure / lovely / of good report / virtue / praise). Not vague positivity; a filter for every thought. This is the platform\'s "the Test" and the Mind of Christ, in lesson form.',
        'The through-line (the WITNESS from the series): the mind governs the whole person\'s energy — fear reallocates it toward a temporal shadow; so the highest-leverage choice is WHAT you dwell on. What you behold, you become (Romans 12:2; Colossians 3:2).',
        'The eternal, UNSEEN substances: "the things which are not seen are eternal" (2 Corinthians 4:18); "now abideth faith, hope, charity... the greatest of these is charity" (1 Corinthians 13:13). Faith lays hold of the unseen (Hebrews 11:1). The realest things cannot be seen.',
        'The ground of security: chosen "in him before the foundation of the world" (Ephesians 1:4); the Lamb "foreordained before the foundation of the world... for you" (1 Peter 1:19-20). Acceptance was settled outside time — not by performance. Say "for you" slowly.',
        'Well-being bright line: this is FREEDOM and rest, not thought-policing pressure. He tells us what to think on because He loves us; the mind fixed on Him is guarded by peace (Philippians 4:7). If anyone leaves feeling condemned for their thoughts, it was taught wrong — it is grace, and a practice, not a performance.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Philippians 4:6-8 aloud — note that the peace-that-guards (v.7) comes right before the list (v.8). | The big idea, in your own words (10): what you dwell on, you become; God hands you the exact list of what to think on. | Go deeper (10): run real thoughts through the Test (true/honest/just/pure/lovely/good report); then the unseen-eternal (2 Corinthians 4:18; 1 Corinthians 13:13) and the before-the-foundation grace (Ephesians 1:4; 1 Peter 1:20) — land "for you." | Reflect together (10): use the prompts. | Take it with you (2): each person names one recurring thought to release and one true/lovely thing to think on instead.',
      discussionPrompts: [
        'What thought have you let run you lately? Run it through Philippians 4:8 out loud — does it pass?',
        '"The things which are not seen are eternal." Which unseen substance — faith, hope, or love — do you most need to fix your mind on right now?',
        'Sit with "foreordained... for you." How does it change your day to know your acceptance was decided before the world was made, not by today\'s performance?',
        '"What you behold, you become." Looking honestly at what you dwell on most, what are you becoming — and what would you rather?',
        'What is one practical way you could "set your affection on things above" this week when a failing thought comes knocking?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // LESSON 7 — "Let Peace Be the Umpire" — Darrell 2026-07-04, from Picard's
  // "mitoception": feeling into your own energy to discern what supports vs
  // drains you, trusting cultivated INTERNAL awareness over external data alone.
  // The witness to spiritual discernment — the peace of God ruling (umpiring) the
  // heart (Colossians 3:15), the Spirit bearing witness within (Romans 8:16),
  // knowing by fruit (Matthew 7:20; Galatians 5:22-23). GUARDRAIL: the inner
  // witness works WITH the Word, never against it (test the spirits). Verses KJV,
  // VERBATIM from the in-app Bible (DR-0076). Well-being-positive; grace-centered.
  {
    id: 'll7-let-peace-be-the-umpire',
    title: 'Let Peace Be the Umpire',
    bigIdea: 'The science offers a lovely word — "mitoception": learning to FEEL INTO your own energy, to notice from the inside whether a food, a habit, or even a relationship is supporting you or quietly draining you, instead of trusting outside data alone. That inward listening is a faint echo of a gift Yahweh already gave His people: an inner witness. He says, "let the peace of God RULE in your hearts" — the word means let peace be the UMPIRE, the one who makes the call. His Spirit "beareth witness with our spirit," and the fruit of a Spirit-led life (love, joy, peace) is a real, felt readout. So you are not left to guess or to run on rules alone: you can notice, when facing a choice, whether His peace is present or absent, whether the fruit is life or the opposite. (One guardrail: this inner witness always agrees with His Word — it never overrides Scripture; feelings alone are not the judge, His peace and His Word together are.)',
    inApp: 'Bring one real choice to God right now — a habit, a commitment, a relationship you keep saying yes to. Get quiet and "feel into" it before Him: is His peace present when you consider it, or a persistent unrest? What FRUIT does it grow in you over time — love, joy, peace... or agitation, drain, compromise (Galatians 5:22; Matthew 7:20)? Then "prove all things; hold fast that which is good" (1 Thessalonians 5:21) — keep what His peace and His Word both confirm, and prayerfully release what neither does.',
    anchor: {
      ref: 'Colossians 3:15; Romans 8:16',
      theme: 'Let the peace of God act as umpire in your heart, and know that His Spirit bears witness with your spirit. God gave you an inner witness — tested by His Word — to discern what gives life from what drains it.',
    },
    benefits: [
      'A God-given inner compass — you are not left to run on external rules and data alone; His peace can help make the call.',
      'Discernment for real life — food, habits, commitments, relationships: you can notice by fruit and by peace what supports you and what drains you.',
      'Freedom from anxious over-analysis — when peace rules as umpire, you can stop endlessly debating and rest in the call.',
      'Protection — a persistent lack of peace is often a mercy, a check before a wrong turn; you learn to honor it (tested by the Word).',
      'Intimacy — the Spirit bearing witness with your spirit is relationship, not technique; you learn His voice and His peace.',
    ],
    levels: {
      child: 'God gave you a special helper INSIDE you — like a peaceful feeling that helps you know what is good. The Bible says, "let the peace of God rule in your hearts" (Colossians 3:15). "Rule" is like being the referee in a game who makes the call! So when you are deciding something, you can get quiet and notice: do I feel God\'s peace about this, or a yucky, unsettled feeling? And you can look at the FRUIT — when you spend time with a certain friend or do a certain thing, does it grow good things in you like love and joy and kindness, or grumpy and mean things? Jesus said, "by their fruits ye shall know them" (Matthew 7:20). (Important: this peaceful feeling always agrees with what God SAYS in the Bible — it never tells you to do something the Bible says is wrong.) So talk to God, feel His peace, watch the fruit, and He will help you choose well!',
      teen: 'There\'s a cool idea in the science called "mitoception" — basically learning to feel into your own body\'s energy so you can tell whether something (a food, a habit, even a relationship) is fueling you or secretly draining you, instead of only trusting outside numbers. Here\'s the thing: God gave His people an even deeper version of that — an inner witness. "Let the peace of God rule in your hearts" (Colossians 3:15) — "rule" literally means be the UMPIRE, the one who makes the call. "The Spirit itself beareth witness with our spirit" (Romans 8:16). So when you\'re deciding something, you don\'t just weigh pros and cons on paper; you can get honest before God and notice: is His peace here, or is there a persistent unrest? And you check the FRUIT: "the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, meekness, temperance" (Galatians 5:22-23) — does this thing grow that in you, or the opposite? "By their fruits ye shall know them" (Matthew 7:20). Real talk on the guardrail, because feelings can lie: this inner witness ALWAYS lines up with God\'s Word — peace never green-lights what Scripture calls sin. So it\'s the Spirit AND the Word together, not just vibes. "Prove all things; hold fast that which is good" (1 Thessalonians 5:21). That relationship that keeps draining and unsettling you? That habit you can\'t have peace about? Pay attention. God is speaking from the inside.',
      senior: 'Dr. Martin Picard offers the term "mitoception" — a cultivated interoceptive awareness of one\'s own energy, learning to sense from within whether a diet, a practice, or a relationship supports or depletes one\'s capacity, rather than depending on external metrics alone. For the believer this rings a deep bell, because Yahweh long ago gave His people an inner witness — never to replace His Word, but to walk with it. Paul writes, "And let the peace of God rule in your hearts, to the which also ye are called in one body; and be ye thankful" (Colossians 3:15). The verb rendered "rule" (brabeuō) is drawn from the arbiter or umpire who awards the prize and settles the contest — that is, let God\'s peace ARBITRATE your decisions. This is not mysticism; it is relationship: "The Spirit itself beareth witness with our spirit, that we are the children of God" (Romans 8:16), and "The spirit of man is the candle of the LORD, searching all the inward parts" (Proverbs 20:27) — God illuminates our interior. The felt readout of a Spirit-governed life is nameable: "the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, meekness, temperance" (Galatians 5:22-23), and our Lord\'s own test for discerning any tree — a teacher, an influence, a course of life — is fruit: "by their fruits ye shall know them" (Matthew 7:20). There is even the promise of an interior teacher: "the anointing which ye have received of him abideth in you... and as the same anointing teacheth you of all things, and is truth, and is no lie" (1 John 2:27). Now the essential guardrail, held firmly, especially for the mature: this inner witness is subordinate to Scripture and confirmed by it — the Spirit never contradicts the Word He inspired, and subjective peace is not a license to bless what God has forbidden (hence "prove all things; hold fast that which is good," 1 Thessalonians 5:21, and "try the spirits," 1 John 4:1). Feelings can be swayed; God\'s peace, tested against His revealed will, is trustworthy. With that anchor, the practice is rich and freeing: bring the matter to God, get still, and notice whether His peace umpires a "yes" or withholds it; observe over time the fruit a thing produces in you; keep what His peace and His Word together confirm, and release what neither does. A seasoned saint has often felt this for decades without a name — the unrest that turned out to be protection, the settled peace that steadied a hard obedience. That was not superstition; it was the candle of the LORD. Learn to honor it, under the Word.',
    },
    quiz: {
      questions: [
        {
          q: 'What does it mean that we should "let the peace of God RULE in your hearts" (Colossians 3:15)?',
          options: [
            'Ignore peace and just follow rules',
            'Let God\'s peace act as the UMPIRE — the one who helps make the call in your decisions',
            'Only trust outside data and never your inner sense',
          ],
          answer: 1,
          explain: 'The word "rule" is the umpire/arbiter who settles the contest. God gave an inner witness — His peace, tested by His Word — to help you discern.',
        },
        {
          q: 'How can you tell whether a habit, influence, or relationship is good for you?',
          options: [
            'You cannot know until it is too late',
            'By its FRUIT — "by their fruits ye shall know them" (Matthew 7:20); does it grow love, joy, peace, or the opposite?',
            'Only by what other people say',
          ],
          answer: 1,
          explain: 'The fruit of the Spirit (Galatians 5:22-23) is a real readout. A thing that consistently drains peace and grows agitation is telling you something — pay attention.',
        },
        {
          q: 'What is the essential guardrail on this "inner witness"?',
          options: [
            'There is none — follow every feeling',
            'It always agrees with God\'s WORD and is tested by it — "prove all things; hold fast that which is good" (1 Thessalonians 5:21)',
            'Feelings always override Scripture',
          ],
          answer: 1,
          explain: 'The Spirit never contradicts the Word He inspired. Peace is not a license to bless what God forbade; it is the Spirit AND the Word together (1 John 4:1).',
        },
        {
          q: 'Who bears witness with our spirit that we belong to God?',
          options: [
            'No one; you just have to hope',
            '"The Spirit itself beareth witness with our spirit, that we are the children of God" (Romans 8:16)',
            'Only your own willpower',
          ],
          answer: 1,
          explain: 'It is relationship, not technique — the Holy Spirit within, "the candle of the LORD, searching all the inward parts" (Proverbs 20:27), leading His children.',
        },
      ],
    },
    lesson: 'The science gives us a gentle, useful word: "mitoception." Dr. Martin Picard uses it for the practice of feeling INTO your own energy — learning to sense from the inside whether a food, a rhythm, a habit, or even a relationship is truly supporting you or quietly draining you, rather than trusting only external numbers and data. It is an invitation to cultivate internal awareness. And for the believer, that faint, good instinct points to something far deeper and older: Yahweh gave His people an inner witness. Not to replace His written Word — never that — but to walk alongside it. Listen to how directly He puts it: "And let the peace of God rule in your hearts, to the which also ye are called in one body; and be ye thankful" (Colossians 3:15). That word "rule" is a striking one — it is the picture of the UMPIRE, the arbiter at the games who makes the call and awards the prize. Let God\'s peace umpire your heart. When you face a decision and bring it honestly before Him, His peace either settles on it or it does not, and that is meant to help you make the call. This is not mysticism or superstition; it is relationship: "The Spirit itself beareth witness with our spirit, that we are the children of God" (Romans 8:16). It is God lighting up your interior so you can see: "The spirit of man is the candle of the LORD, searching all the inward parts" (Proverbs 20:27). He even gives you a nameable readout of a Spirit-led life, so you are not guessing in the dark: "the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, meekness, temperance" (Galatians 5:22-23). Does a thing grow that in you over time — or does it grow agitation, compromise, and drain? Jesus made fruit the very test for discerning any tree, whether a teacher, an influence, or a whole course of life: "by their fruits ye shall know them" (Matthew 7:20). There is even the promise of an inward Teacher: "the anointing which ye have received of him abideth in you... and as the same anointing teacheth you of all things, and is truth, and is no lie" (1 John 2:27). Now, hold the guardrail firmly, because it is what keeps this holy instead of flaky: this inner witness is ALWAYS under Scripture and confirmed by it. The Spirit never contradicts the Word He inspired, and a subjective feeling of peace is not permission to bless what God has plainly forbidden. That is exactly why the Word pairs the inner sense with a sober test — "Prove all things; hold fast that which is good" (1 Thessalonians 5:21), and "try the spirits whether they are of God" (1 John 4:1). Feelings can be swayed by appetite or fear; but God\'s peace, held up against His revealed will, is a faithful guide. With that anchor set, the practice becomes rich and freeing. Bring the matter to Him. Get still. Notice whether His peace umpires a yes, or quietly withholds it. Watch, over time, the fruit a thing bears in you. Keep what His peace and His Word together confirm; prayerfully release what neither does. Many a seasoned saint has felt this for years without a name for it — the unsettled feeling that turned out to be protection before a wrong turn, the deep steadiness that carried them through a hard but right obedience. That was never superstition. It was the candle of the LORD, searching the inward parts, and the peace of God doing exactly what He said it would do: ruling the heart. Learn to listen for it — under His Word — and let His peace make the call.',
    facilitator: {
      talkingPoints: [
        'The science (the WITNESS, attributed): Dr. Martin Picard\'s "mitoception" — a cultivated internal awareness of your own energy, sensing what supports vs drains you, rather than trusting external data alone. A faint echo of the God-given inner witness.',
        'The Word (the SOURCE): "let the peace of God RULE [umpire, brabeuō] in your hearts" (Colossians 3:15); "the Spirit itself beareth witness with our spirit" (Romans 8:16); "the candle of the LORD, searching all the inward parts" (Proverbs 20:27). All KJV, verbatim.',
        'The readout is nameable: "the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, meekness, temperance" (Galatians 5:22-23), and "by their fruits ye shall know them" (Matthew 7:20). Discern a habit/influence/relationship by the fruit it grows and the peace it keeps or steals.',
        'THE GUARDRAIL (say it clearly): the inner witness is under Scripture and confirmed by it — the Spirit never contradicts the Word; peace is not a license to bless sin. "Prove all things; hold fast that which is good" (1 Thessalonians 5:21); "try the spirits" (1 John 4:1). Spirit AND Word together, never feelings alone.',
        'Well-being bright line: this is a gift and a rest, not anxious over-analysis. When peace umpires, you can stop endlessly debating. A persistent lack of peace is often a mercy, a protective check. Intimacy with the Spirit, not a technique to master.',
      ],
      howToRun: 'Open in prayer + read the Scripture (3): pray, then read Colossians 3:15 and Romans 8:16 aloud — explain "rule" = umpire. | The big idea, in your own words (10): mitoception (feel into your energy) points to the inner witness God gave — His peace as umpire, the Spirit witnessing, fruit as readout. | Go deeper (10): discern by peace + fruit (Galatians 5:22-23; Matthew 7:20), then set the GUARDRAIL firmly (1 Thessalonians 5:21; 1 John 4:1) — always under the Word. | Reflect together (10): use the prompts; invite honesty about a draining habit or relationship. | Take it with you (2): each person brings one real choice to God, feels into His peace + the fruit, and names one thing to hold fast or release.',
      discussionPrompts: [
        'Where in your life is His peace clearly present — and where is there a persistent unrest you have been ignoring?',
        'Look at the FRUIT: what habit or relationship consistently grows love/joy/peace in you, and what consistently drains it?',
        'Have you ever felt a check of peace that later proved to be protection? What happened?',
        'Why does the guardrail matter — that the inner witness always agrees with the Word? Where could "just follow your peace" go wrong without it?',
        'What is one choice you can bring to God this week — to "prove" it by His peace and His Word, and hold fast or release accordingly?',
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Course-specific helpers — thin wrappers over the GENERIC, tested helpers in
// church-classes.js, so this series behaves identically to the four courses. The
// schedule is built WITHOUT dates (self-paced): rows carry week/lesson numbers
// but no painted calendar date.
// ---------------------------------------------------------------------------
import {
  progressSummaryFor, exportCurriculumMarkdownFor, resolveCohortGeneric,
} from './church-classes.js';

export const LIVING_LESSONS_INTEREST_TAG = '[Living Lessons interest]';
export const LIVING_LESSONS_HELPER_TAG = '[Living Lessons helper]';

export function resolveLivingLessonsCohort(localCohort = null) {
  return resolveCohortGeneric(localCohort, LIVING_LESSONS_CONFIRMED_COHORT, LIVING_LESSONS_PROPOSED_COHORT_START);
}

// Self-paced: one row per lesson with its lesson number, but NO computed date.
export function buildLivingLessonsSchedule() {
  return LIVING_LESSONS_MODULES.map((m, i) => ({ ...m, week: i + 1, date: null, weekday: null }));
}

export function livingLessonsProgressSummary(progress = {}) {
  return progressSummaryFor(LIVING_LESSONS_MODULES, progress);
}

export function exportLivingLessonsCurriculumMarkdown() {
  return exportCurriculumMarkdownFor(
    { meta: LIVING_LESSONS_META, sessionFlow: LIVING_LESSONS_SESSION_FLOW, modules: LIVING_LESSONS_MODULES },
    null,
  );
}

// Tutor course-meta — the per-lesson solo guide introduces itself as a Word-first,
// grace-centered companion, age-aware, never improvising theology beyond Scripture.
export const LIVING_LESSONS_TUTOR_META = {
  title: LIVING_LESSONS_META.title,
  intro: 'You are a warm, grace-centered guide for a Word-first, non-denominational lesson series called "Living Lessons from the Word."',
  posture: 'Guide ONE reader — who may be a child, a teen, an adult, or a seasoned believer — through the lesson, matching your words and pace to their age. The throughline of Lesson 1: the "perfect" God expects means WHOLE / COMPLETE / MATURE / WHOLEHEARTED (Greek teleios, from telos = goal; Hebrew tamim = whole, sound), NOT flawless self-performance — and God grows it by grace, so it frees rather than burdens. Be relentlessly WELL-BEING-POSITIVE: lift the weight of perfectionism off them; never add pressure or shame. Be EVENHANDED and Word-first: if traditions on sanctification come up (Wesleyan, Reformed, Orthodox), present them fairly, name their common ground, and let the Word and the Spirit lead — do not divide the Body. Cite Scripture by reference (ESV primary, KJV where the wording is the point); never invent or paraphrase a verse as if quoting it, and if unsure of a text, say so rather than fabricate. Always point them back to grace and the finished work of Christ.',
};
