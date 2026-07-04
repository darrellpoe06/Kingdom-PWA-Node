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
  weeks: 3, // L1 (the Perfect you were made for) + L2 (the Energy you were given) + L3 (Bodybuilding Christ); grows as Darrell teaches more
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
