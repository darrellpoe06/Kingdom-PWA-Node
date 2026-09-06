// =============================================================================
// scriptures — the curated, themed Scripture library that BACKS the Spiritual
// Module + the Learn courses (reusable by the content engine). Darrell 2026-06-24.
// =============================================================================
// Verse TEXT lives in ./scripture-kjv.js (GENERATED verbatim from a public-domain
// KJV fetch — never typed by hand). The ADAPTIVE ENGINE (depth tiers, experience
// levels, personalization, retention testing, and the GOVERNING LENS) lives in
// ./scripture-teaching.js. THIS file holds the authored CURATION: the themes, the
// lens applied per theme, the depth-tiered teaching, the soul-aim, the verses with
// their roles, the evenhanded doctrinal views, and the verified tests.
//
// THE LENS (Darrell, binding — see GOVERNING_LENS in scripture-teaching.js): every
// theme explains Yahweh's PERSPECTIVE and His LOVE — His heart toward people — held
// in GRACE AND TRUTH together (John 1:14), delivered with NO CONDEMNATION, just
// truth (John 3:17; 8:11; Romans 8:1). It teaches His PURPOSES and forms the learner
// to put His WILL and WAY first (Matthew 6:33), and it is all ordered to one end:
// SOULS reaching their eternal home with the Father (Luke 2:49; 19:10) — the
// Father's business. Truth warns, love draws; both are for the soul's sake.
//
// COPYRIGHT (binding): the KJV (public domain) is the full text reproduced. ESV,
// NIV, NKJV, AMP are linked via readOnline(), never reproduced. ACCURACY (binding):
// every reference was fetched + confirmed real; nothing is from memory. NON-
// DENOMINATIONAL / WORD-FIRST: organized by what Scripture teaches, senior to any
// one tradition; high-sensitivity doctrine (the Godhead, hell) presents the main
// biblical views fairly and lets the Word + Spirit lead — present, don't divide.
// =============================================================================
import { KJV } from './scripture-kjv.js';
import { WEB } from './scripture-web.js';

export { KJV, WEB };

// -----------------------------------------------------------------------------
// SURFACES — the app surfaces a theme/verse BACKS (self-describing; a test
// confirms every `backs` id is real, so no cross-reference dangles).
// -----------------------------------------------------------------------------
export const SURFACES = {
  'spiritual-module': { label: 'Spiritual Module', where: 'The Body — spiritual teaching across the Church surfaces.' },
  study: { label: 'Study', where: 'Darrell’s Study + Eternal Algorithms (4D source layer).' },
  pulpit: { label: 'The Word', where: 'The sermon library and corpus-grounded prep.' },
  choir: { label: 'Choir / Worship', where: 'Worship music and the song workshop.' },
  engagement: { label: 'Engagement', where: 'The daily anchor + trivia loop.' },
  financial: { label: 'Financial System', where: 'Stewardship of land, labor, time, and money.' },
  'learn:ai-the-way': { label: 'Learn — A.I. The Way', where: 'The COLG youth A.I. course.' },
  'learn:broadcast': { label: 'Learn — The Broadcast', where: 'The media-team course.' },
  'learn:infrastructure': { label: 'Learn — Infrastructure', where: 'The sovereign-build course.' },
  'learn:sovereign-ai': { label: 'Learn — Sovereign A.I.', where: 'Why we build local.' },
  'content-engine': { label: 'Content Engine', where: 'Scripture cross-referencing for generated content.' },
};

// Verse roles — so grace-and-truth is visibly held together: an `anchor` frames
// the theme; `love`/`promise`/`hope`/`invitation` draw; `truth`/`warning` tell it
// straight. Both kinds sit in the same theme on purpose.
export const VERSE_ROLES = {
  anchor: { label: 'Anchor' },
  love: { label: 'His love' },
  promise: { label: 'Promise' },
  hope: { label: 'Hope' },
  invitation: { label: 'Invitation' },
  truth: { label: 'Truth' },
  warning: { label: 'Warning (in love)' },
};

// v(ref, gloss, role, backs) — a verse entry. backs defaults to the theme's
// surfaces at read time (see allVerses); role defaults to 'truth'.
function v(ref, gloss, role = 'truth', backs = null) {
  return { ref, gloss, role, backs };
}

// =============================================================================
// THEMES — the curated, organized set. Each carries the LENS applied (perspective
// / heart / love), the SOUL aim, depth-tiered teaching (essential → standard →
// deep/book-capable), optional experience-level framings, personalization
// `interests`, verses with roles, and verified `tests`. High-sensitivity themes
// add evenhanded `views` and an honesty `textNote`.
// =============================================================================
export const THEMES = [
  // ---------------------------------------------------------------------------
  {
    id: 'salvation',
    title: 'Salvation & the Soul',
    subtitle: 'The Father’s business',
    blurb: 'The new birth, the only Name, the new creation — the one needful thing. The soul is the Father’s business (Luke 2:49), and the whole platform orbits it.',
    surfaces: ['spiritual-module', 'pulpit', 'engagement'],
    interests: ['salvation', 'evangelism'],
    lens: {
      perspective: 'Yahweh sees one lost soul as worth the whole search (Luke 19:10) — not a case to judge but a child to bring home.',
      heart: 'His heart is that none perish but all come to repentance (2 Peter 3:9); He takes no pleasure in the death of the wicked (Ezekiel 33:11).',
      love: 'He so loved the world that He gave His only Son (John 3:16) — love that moved first, while we were still sinners (Romans 5:8).',
    },
    soul: 'This is the soul itself — its rescue and its eternal home with the Father. Everything else in the library serves this door.',
    depths: {
      essential: 'You must be born again (John 3:3). There is one Name that saves — Jesus (Acts 4:12); confess Him and believe He rose, and you are saved (Romans 10:9). In Him you become a new creation (2 Corinthians 5:17). This is the Father’s business (Luke 2:49).',
      standard: 'Salvation is not self-improvement; it is a new birth (John 3:3) and a new creation (2 Corinthians 5:17). It comes through one Name — there is salvation in no other (Acts 4:12), for Jesus is the way, the truth, and the life (John 14:6). The door is plain and open to whosoever: confess Him as Lord, believe in your heart God raised Him, and call on His name (Romans 10:9,13). God’s posture is not condemnation but rescue — He sent the Son not to condemn the world but that the world might be saved through Him (John 3:17). The boy Jesus named this as the Father’s business (Luke 2:49); it is still the one needful thing.',
      deep: 'When the twelve-year-old Jesus told His parents He must be about His Father’s business (Luke 2:49), He named the center of everything: the rescue of souls. Salvation is not a moral upgrade you achieve; it is a birth you receive — "Except a man be born again, he cannot see the kingdom of God" (John 3:3). The old self does not get repaired; in Christ a person becomes a new creature, old things passed away, all things new (2 Corinthians 5:17).\n\nIt comes through one Name. This is not narrowness for its own sake but the simple truth that the One who is "the way, the truth, and the life" (John 14:6) is the only bridge across a gap we could not cross ourselves; "neither is there salvation in any other" (Acts 4:12). And the door, though singular, is wide open: "whosoever shall call upon the name of the Lord shall be saved" (Romans 10:13) — confess with your mouth, believe in your heart (Romans 10:9).\n\nHear Yahweh’s heart in it. He did not send the Son to condemn the world "but that the world through him might be saved" (John 3:17). The wages of sin is real — death — but the verse does not stop there: "the gift of God is eternal life through Jesus Christ our Lord" (Romans 6:23). Truth tells you the cliff is real; love carries you back from it. That is the grace-and-truth shape of the whole gospel, and it is all for the soul’s sake.',
    },
    levels: {
      child: 'God loves you so much He sent Jesus to bring you home to Him (John 3:16). When you say yes to Jesus, you start brand new on the inside — like being born again into God’s family. He is not mad at you; He is glad to have you.',
      'new-believer': 'You don’t clean yourself up first — you come as you are. Believe Jesus died and rose for you, tell Him He’s your Lord, and you are saved (Romans 10:9). You become a new creation (2 Corinthians 5:17). This is the beginning of everything.',
      scholar: 'Note the Johannine new-birth (γεννηθῇ ἄνωθεν, born "again/from above," John 3:3), the exclusivity of the Name (Acts 4:12) held with the universal "whosoever" (Romans 10:13), and the deliberate non-condemnation framing of John 3:17 against 3:18 — judgment is real, but the Son’s mission is rescue.',
    },
    verses: [
      v('Luke 2:49', 'The boy Jesus names His priority — the Father’s business. The frame for everything.', 'anchor', ['spiritual-module']),
      v('John 3:3', 'The new birth is the doorway; without it the kingdom is unseen.', 'truth', ['spiritual-module', 'pulpit']),
      v('John 3:16', 'The gospel in one verse — love given, belief, everlasting life.', 'love', ['spiritual-module', 'engagement', 'pulpit']),
      v('John 14:6', 'The Way, the Truth, the Life — the one bridge to the Father.', 'truth'),
      v('Acts 4:12', 'No other name — salvation is in Christ alone.', 'truth'),
      v('Romans 10:9', 'Confess and believe — the plain doorway of salvation.', 'invitation', ['spiritual-module', 'pulpit']),
      v('Romans 10:13', 'Whosoever — the door is open to all who call.', 'invitation'),
      v('John 3:17', 'Sent NOT to condemn but to save — His posture stated plainly.', 'hope'),
      v('Romans 6:23', 'The wages of sin is death; the GIFT of God is eternal life — truth and grace in one breath.', 'truth'),
      v('2 Corinthians 5:17', 'New creature — old things passed, all things new.', 'promise', ['spiritual-module', 'study']),
    ],
    tests: {
      questions: [
        { q: 'According to John 3:3, what must happen to see the kingdom of God?', options: ['Be a good person', 'Be born again', 'Attend church'], answer: 1, explain: 'Jesus said one must be born again (John 3:3) — a new birth, not self-improvement.', ref: 'John 3:3' },
        { q: 'Why did God send His Son into the world (John 3:17)?', options: ['To condemn the world', 'That the world through Him might be saved', 'To start a religion'], answer: 1, explain: 'Not to condemn but to save (John 3:17) — His posture is rescue.', ref: 'John 3:17' },
        { q: 'Romans 6:23 — what is the gift of God?', options: ['Health and wealth', 'Eternal life through Jesus Christ', 'A long life'], answer: 1, explain: 'The wages of sin is death, but the gift of God is eternal life through Jesus Christ our Lord.', ref: 'Romans 6:23' },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'the-word',
    title: 'The Word',
    subtitle: 'Living, breathed-out, a lamp',
    blurb: 'The Word is a Person (John 1:1) and a living, discerning power (Hebrews 4:12) — breathed out by God, a lamp to the path, the bread we live by.',
    surfaces: ['spiritual-module', 'pulpit', 'study'],
    interests: ['word', 'wisdom'],
    lens: {
      perspective: 'Yahweh reveals Himself in His Word — the Word was God and became flesh (John 1:1,14); to see how He sees, we go to what He has said.',
      heart: 'He speaks so we will live, not merely know; His Word goes out to accomplish, never returning void (Isaiah 55:11).',
      love: 'The living Word reads our hearts to heal them (Hebrews 4:12) — a Person who speaks to us, not a rulebook over us.',
    },
    soul: 'Faith comes by the Word; it is the seed by which a soul is born again and then fed unto eternal life.',
    depths: {
      essential: 'In the beginning was the Word, and the Word was God (John 1:1) — and the Word became flesh (John 1:14). All Scripture is breathed out by God (2 Timothy 3:16). It is living and discerns the heart (Hebrews 4:12), a lamp to your path (Psalm 119:105).',
      standard: 'Scripture is not merely about God; the Word is a Person — "the Word was God," who "was made flesh, and dwelt among us… full of grace and truth" (John 1:1,14). That is why it is alive: "the word of God is quick, and powerful… a discerner of the thoughts and intents of the heart" (Hebrews 4:12). It is God-breathed and profitable to make a person complete (2 Timothy 3:16-17). It does not fail — "it shall not return unto me void" (Isaiah 55:11) — and it lights the next step like a lamp (Psalm 119:105). So we live by it: "man shall not live by bread alone, but by every word that proceedeth out of the mouth of God" (Matthew 4:4).',
      deep: 'The whole Spiritual Module is Word-first because of John 1:1 — "In the beginning was the Word, and the Word was with God, and the Word was God." Scripture is not a set of religious facts; it is the self-revelation of a Person who "was made flesh, and dwelt among us… full of grace and truth" (John 1:14). When you meet the Word, you are meeting Him.\n\nThat is why it behaves like nothing else you read. It is "quick, and powerful, and sharper than any twoedged sword… a discerner of the thoughts and intents of the heart" (Hebrews 4:12) — you do not so much read it as it reads you. It is "given by inspiration of God" — God-breathed — "and is profitable for doctrine, for reproof, for correction, for instruction in righteousness: that the man of God may be perfect, throughly furnished unto all good works" (2 Timothy 3:16-17).\n\nAnd it is reliable in a way our own thoughts are not. Yahweh stakes His own faithfulness on it: "so shall my word be… it shall not return unto me void, but it shall accomplish that which I please" (Isaiah 55:11). So it is given as light for the road — "thy word is a lamp unto my feet, and a light unto my path" (Psalm 119:105) — and as daily food: man lives "by every word that proceedeth out of the mouth of God" (Matthew 4:4). To know His perspective on anything, this is where we go first.',
    },
    verses: [
      v('John 1:1', 'The Word was God — Scripture is not merely about God; the Word is a Person.', 'anchor', ['spiritual-module', 'pulpit']),
      v('John 1:14', 'The Word made flesh — full of grace and truth.', 'truth'),
      v('2 Timothy 3:16-17', 'All Scripture is God-breathed and profitable — the warrant for a Word-first corpus.', 'truth', ['spiritual-module', 'pulpit']),
      v('Hebrews 4:12', 'Quick and powerful — the Word discerns the thoughts; it reads us.', 'truth', ['spiritual-module', 'study']),
      v('Psalm 119:105', 'A lamp and a light — the Word lights the next step.', 'promise'),
      v('Isaiah 55:11', 'It does not return void — the Word accomplishes what it is sent to do.', 'promise', ['spiritual-module', 'pulpit']),
      v('Matthew 4:4', 'Man lives by every word — the Word as daily bread.', 'truth', ['spiritual-module', 'engagement']),
    ],
    tests: {
      questions: [
        { q: 'John 1:1 — who/what was the Word?', options: ['A prophet', 'God', 'An angel'], answer: 1, explain: 'In the beginning was the Word, and the Word was God (John 1:1).', ref: 'John 1:1' },
        { q: 'Hebrews 4:12 says the Word of God is…', options: ['Quiet and gentle only', 'Quick, powerful, a discerner of the heart', 'Hard to understand'], answer: 1, explain: 'It is living and active, discerning the thoughts and intents of the heart.', ref: 'Hebrews 4:12' },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'prayer',
    title: 'Prayer',
    subtitle: 'Asking, and receiving as fruit',
    blurb: 'Pray without ceasing; make your requests known with thanksgiving; ask with confidence according to His will. Asking-and-receiving is fruit of the relationship, not the goal of it.',
    surfaces: ['spiritual-module', 'engagement', 'pulpit'],
    interests: ['prayer'],
    lens: {
      perspective: 'Yahweh sees prayer as a child coming to a Father, not a subject petitioning a distant king — He invites the asking (Matthew 7:7).',
      heart: 'He wants to carry what we carry: "casting all your care upon Him." Anxiety is met with a peace that guards the mind (Philippians 4:6-7).',
      love: 'He hears us — "if we ask any thing according to His will, He heareth us" (1 John 5:14); the open ear is itself His love.',
    },
    soul: 'Prayer keeps the soul tethered to its Source; it is where the relationship that saves is lived day by day.',
    depths: {
      essential: 'Pray without ceasing (1 Thessalonians 5:17). Don’t be anxious — bring everything to God with thanksgiving, and His peace will guard your mind (Philippians 4:6-7). Ask, seek, knock (Matthew 7:7); He hears prayer that lines up with His will (1 John 5:14).',
      standard: 'Prayer is less an event than a state: "pray without ceasing" (1 Thessalonians 5:17), a running conversation with a Father who is near. The remedy for anxiety is named here — "be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds" (Philippians 4:6-7). Jesus invites persistence: "ask… seek… knock" (Matthew 7:7). And the confidence is not that we get whatever we want, but that "if we ask any thing according to his will, he heareth us" (1 John 5:14) — and the body prays for one another, for "the effectual fervent prayer of a righteous man availeth much" (James 5:16).',
      deep: 'The instruction "pray without ceasing" (1 Thessalonians 5:17) sounds impossible until you see prayer as a posture rather than a task — an open line kept open, the heart turned Godward through an ordinary day. Into that line goes everything, especially the fear: "be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God" (Philippians 4:6-7). Notice the order — thanksgiving travels with the request — and the result: not necessarily the thing asked for, but "the peace of God, which passeth all understanding," set as a guard over heart and mind.\n\nJesus frames asking as a child’s confidence: "Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you" (Matthew 7:7) — present-tense, keep asking. The boundary that makes this safe and not magical is His will: "if we ask any thing according to his will, he heareth us" (1 John 5:14). So mature prayer increasingly wants what He wants. And it is not solitary — "pray one for another, that ye may be healed. The effectual fervent prayer of a righteous man availeth much" (James 5:16). Receiving is real, but it is fruit of the relationship, never the point of it.',
    },
    verses: [
      v('Philippians 4:6-7', 'Be anxious for nothing — prayer with thanksgiving, and a peace that guards the mind.', 'promise', ['spiritual-module', 'engagement']),
      v('Matthew 7:7', 'Ask, seek, knock — the posture of persistent prayer.', 'invitation'),
      v('1 Thessalonians 5:17', 'Pray without ceasing — prayer as a continuous state, not an event.', 'truth'),
      v('James 5:16', 'Confess and pray for one another — the body’s shared, effectual prayer.', 'truth', ['spiritual-module', 'pulpit']),
      v('1 John 5:14', 'Confidence to ask according to His will — His will is the channel.', 'promise'),
    ],
    tests: {
      questions: [
        { q: 'Philippians 4:6-7 — what guards your heart and mind when you pray with thanksgiving?', options: ['Your own effort', 'The peace of God', 'Good circumstances'], answer: 1, explain: 'The peace of God, which passes understanding, guards heart and mind (Philippians 4:6-7).', ref: 'Philippians 4:6-7' },
        { q: '1 John 5:14 — what is the confidence in prayer?', options: ['We always get what we want', 'If we ask according to His will, He hears us', 'Longer prayers work better'], answer: 1, explain: 'Confidence is that He hears requests aligned with His will (1 John 5:14).', ref: '1 John 5:14' },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'worship',
    title: 'Worship',
    subtitle: 'In spirit and in truth',
    blurb: 'Worship in spirit and truth (John 4:24), heartily as unto the Lord (Colossians 3:23), a living sacrifice, a joyful noise — the Word that grounds the Choir and every act of service-as-worship.',
    surfaces: ['spiritual-module', 'choir', 'pulpit'],
    interests: ['worship'],
    lens: {
      perspective: 'Yahweh seeks worshippers — He is looking for hearts that worship in spirit and truth (John 4:24), not performances.',
      heart: 'He is worthy and He is near; worship is the creature gladly magnifying the Maker (Psalm 95:6; 34:3).',
      love: 'His love makes worship a homecoming, not a duty — "serve the LORD with gladness" (Psalm 100:2).',
    },
    soul: 'Worship reorders the soul around God instead of self; a worshipping soul is a soul being healed of its idols.',
    depths: {
      essential: 'God is Spirit; worship Him in spirit and in truth (John 4:24). Whatever you do, do it heartily as to the Lord (Colossians 3:23). Come, bow down (Psalm 95:6); make a joyful noise and serve Him with gladness (Psalm 100:1-2).',
      standard: 'Jesus settled what worship is when He told the woman at the well, "God is a Spirit: and they that worship him must worship him in spirit and in truth" (John 4:24) — not a location or a style, but the honest engagement of the whole person. That widens worship past music into all of life: "whatsoever ye do, do it heartily, as to the Lord" (Colossians 3:23) — your work itself becomes worship (the Excellence Standard). Scripture keeps both reverence and gladness: "O come, let us worship and bow down" (Psalm 95:6) alongside "make a joyful noise unto the LORD… serve the LORD with gladness… come before his presence with singing" (Psalm 100:1-2). And it is corporate — "O magnify the LORD with me, and let us exalt his name together" (Psalm 34:3).',
      deep: 'At a Samaritan well, in a conversation about the right mountain to worship on, Jesus moved worship off the map entirely: "God is a Spirit: and they that worship him must worship him in spirit and in truth" (John 4:24). Spirit means the inner person truly engaged, not going through motions; truth means worship aligned with who God actually is, not a god of our preference. The Father, He says, is actively "seeking such to worship him" — worship is not God’s ego; it is the relationship He desires.\n\nBecause it is the heart and not the venue, worship cannot be confined to a service. "And whatsoever ye do, do it heartily, as to the Lord, and not unto men" (Colossians 3:23) — the changing of a tire, the writing of code, the raising of a child, all become offered worship, and "ye present your bodies a living sacrifice, holy, acceptable unto God, which is your reasonable service" (Romans 12:1). Scripture refuses to split reverence from joy: it bows low — "let us worship and bow down: let us kneel before the LORD our maker" (Psalm 95:6) — and it shouts — "make a joyful noise unto the LORD, all ye lands. Serve the LORD with gladness… come before his presence with singing" (Psalm 100:1-2). And it is never merely private: "O magnify the LORD with me, and let us exalt his name together" (Psalm 34:3) — the Choir’s charter, and the Body’s.',
    },
    verses: [
      v('John 4:24', 'God is Spirit — worship must be in spirit and in truth; the definition.', 'anchor', ['spiritual-module', 'choir']),
      v('Psalm 95:6', 'Come, worship and bow down — the posture of reverence.', 'invitation', ['spiritual-module', 'choir']),
      v('Psalm 100:1-2', 'A joyful noise, gladness, singing — worship the Choir embodies.', 'invitation', ['choir']),
      v('Romans 12:1', 'Present your bodies a living sacrifice — your reasonable worship.', 'truth'),
      v('Colossians 3:23', 'Do it heartily as to the Lord — work itself as worship (the Excellence Standard).', 'truth', ['spiritual-module', 'learn:broadcast', 'learn:infrastructure']),
      v('Psalm 34:3', 'Magnify the Lord together — worship as a shared, corporate act (COLG’s verse).', 'invitation', ['choir']),
    ],
    tests: {
      questions: [
        { q: 'John 4:24 — how must we worship God?', options: ['On the right mountain', 'In spirit and in truth', 'With the best music'], answer: 1, explain: 'God is Spirit; worship must be in spirit and in truth (John 4:24).', ref: 'John 4:24' },
        { q: 'Colossians 3:23 turns ordinary work into worship by doing it…', options: ['For applause', 'Heartily, as to the Lord', 'As fast as possible'], answer: 1, explain: 'Whatever you do, do it heartily as to the Lord (Colossians 3:23).', ref: 'Colossians 3:23' },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'the-perfect',
    title: 'The Perfect',
    subtitle: 'What the Father expects — completed in love',
    blurb: 'Be perfect, as your Father is perfect (Matthew 5:48). Perfect love casts out fear (1 John 4:17-18). Yet Paul presses toward it, not yet attained (Philippians 3:12) — perfection is a calling pressed toward, completed in love, not anxious self-effort.',
    surfaces: ['spiritual-module', 'study', 'learn:ai-the-way'],
    interests: ['holiness', 'growth'],
    lens: {
      perspective: 'Yahweh’s "be perfect" is a Father calling a child up into His own likeness (Matthew 5:48), not a master setting a trap.',
      heart: 'He means to finish what He starts in you (Philippians 1:6); the call to perfection is His confidence, not His scorn.',
      love: 'The perfecting is love’s work — "perfect love casteth out fear" (1 John 4:17-18); you are matured by being loved, not by being afraid.',
    },
    soul: 'The soul is being conformed to Christ; "the Perfect" is the soul’s destiny in Him, not a cliff it must scale alone.',
    depths: {
      essential: 'Be perfect, as your Father is perfect (Matthew 5:48) — walk before Him whole-hearted (Genesis 17:1). This is completed by love, not fear (1 John 4:17-18). And it’s a pressing-toward, not an arriving: Paul says he isn’t there yet but presses on (Philippians 3:12-14).',
      standard: 'Two truths must be held together. First, the standard is real: "Be ye therefore perfect, even as your Father which is in heaven is perfect" (Matthew 5:48); to Abram, "walk before me, and be thou perfect" (Genesis 17:1). Second, the way it is reached is not anxious striving but love: "perfect love casteth out fear… he that feareth is not made perfect in love" (1 John 4:17-18). And it is a direction, not a finished arrival — Paul, of all people, says, "Not as though I had already attained, either were already perfect: but I follow after" (Philippians 3:12), "forgetting those things which are behind… I press toward the mark" (Philippians 3:13-14). Maturity comes as patience finishes its work (James 1:4), so we "go on unto perfection" (Hebrews 6:1).',
      deep: 'Few words are more misheard than "Be ye therefore perfect, even as your Father which is in heaven is perfect" (Matthew 5:48). Heard as cold demand, it crushes; heard in context, it is a Father saying, become like Me — and the Me in question has just been described loving enemies and sending rain on the just and unjust. The Hebrew echo is Genesis 17:1, "walk before me, and be thou perfect" — wholeness, integrity, a life lived openly before God, not flawless performance.\n\nCrucially, Scripture tells us the mechanism. We are not perfected by fear or willpower: "There is no fear in love; but perfect love casteth out fear… He that feareth is not made perfect in love" (1 John 4:17-18). The thing that matures us is being loved by God and learning to love — fear actually blocks the very perfection it scrambles to earn. So the posture is honest pursuit, not pretended arrival. Paul writes, "Not as though I had already attained, either were already perfect: but I follow after" (Philippians 3:12), "forgetting those things which are behind, and reaching forth unto those things which are before, I press toward the mark for the prize of the high calling of God" (Philippians 3:13-14).\n\nThat reframes everything for the anxious heart: perfection is a road you are kept on, not a bar you clear once. "Let patience have her perfect work, that ye may be perfect and entire, wanting nothing" (James 1:4); therefore "let us go on unto perfection" (Hebrews 6:1). And the confidence under it is His, not yours — see Philippians 1:6: He who began the good work will finish it. The Father expects perfection the way a good father expects his child to grow up — certain it will happen because he is committed to it.',
    },
    levels: {
      child: 'God says, "Be like Me" (Matthew 5:48) — and He is kind and full of love. You don’t have to be perfect today by being scared. His love makes you grow, a little at a time, and He never gives up on you (Philippians 1:6).',
      'new-believer': 'Don’t read "be perfect" as "never mess up or you’re out." It means: grow up into God’s likeness, on a road He keeps you on. Even Paul said he hadn’t arrived but kept pressing on (Philippians 3:12-14). Fear doesn’t perfect you — His love does (1 John 4:18).',
    },
    verses: [
      v('Matthew 5:48', 'Be perfect as the Father is perfect — the standard, stated plainly.', 'anchor', ['spiritual-module', 'study']),
      v('Genesis 17:1', 'Walk before Me and be perfect — perfection as walking openly before God.', 'truth', ['spiritual-module', 'study']),
      v('1 John 4:17-18', 'Perfect love casts out fear — the perfecting is love’s work, the answer to anxiety.', 'love'),
      v('Philippians 3:12', 'Not as though already perfect — Paul presses toward it; honesty about the not-yet.', 'truth', ['spiritual-module', 'study']),
      v('Philippians 3:13-14', 'Forgetting what is behind, pressing toward the mark — perfection as direction.', 'truth', ['study']),
      v('James 1:4', 'Let patience finish its work — perfection by endurance.', 'truth'),
      v('Hebrews 6:1', 'Go on unto perfection — the call to maturity past the foundations.', 'invitation', ['spiritual-module', 'study']),
    ],
    tests: {
      questions: [
        { q: '1 John 4:18 — what casts out fear and perfects us?', options: ['Trying harder', 'Perfect love', 'Avoiding mistakes'], answer: 1, explain: 'Perfect love casts out fear; fear has to do with torment (1 John 4:18).', ref: '1 John 4:17-18' },
        { q: 'Philippians 3:12 — had Paul already reached perfection?', options: ['Yes, he was done', 'No — he pressed on toward it', 'He never tried'], answer: 1, explain: 'Paul said he had not attained but pressed on (Philippians 3:12-14) — direction, not arrival.', ref: 'Philippians 3:12' },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'reprogramming',
    title: 'Take the Reprogramming from Yahweh',
    subtitle: 'Metanoia — the renewed mind, the Mind of Christ',
    blurb: 'Let Yahweh rewire the old thought-patterns with His truth. Transformed by the renewing of the mind (Romans 12:2); every thought brought captive to Christ (2 Corinthians 10:4-5); the old self put off, the new put on (Ephesians 4:22-24). The learner RECEIVES His reprogramming.',
    surfaces: ['spiritual-module', 'study', 'learn:ai-the-way'],
    interests: ['mind', 'growth'],
    lens: {
      perspective: 'Yahweh sees the mind as the battlefield and the workshop — change the thinking and the life follows (Proverbs 23:7 sense); He offers a new heart, not just new behavior (Ezekiel 36:26).',
      heart: 'He is not asking you to muster up a better you; He is offering to do the rewiring — "I will give you a new heart… a new spirit" (Ezekiel 36:26).',
      love: 'Reprogramming is gentle surgery by a loving hand: He replaces the lie that wounded you with the truth that heals you (Philippians 4:8).',
    },
    soul: 'A renewed mind is how a saved soul is daily freed from the old programming that kept it bound; the Mind of Christ is the soul thinking God’s thoughts after Him.',
    depths: {
      essential: 'Don’t be conformed to the world — be transformed by the renewing of your mind (Romans 12:2). Catch the old thought, hold it to His truth, and bring it captive to Christ (2 Corinthians 10:4-5). Put off the old self, put on the new (Ephesians 4:22-24). He even gives a new heart (Ezekiel 36:26).',
      standard: 'The Christian life is not behavior management; it is a re-wiring of the mind that changes the behavior from the inside. "Be not conformed to this world: but be ye transformed by the renewing of your mind" (Romans 12:2). The active discipline is to catch and re-route thoughts: "casting down imaginations, and every high thing that exalteth itself against the knowledge of God, and bringing into captivity every thought to the obedience of Christ" (2 Corinthians 10:4-5). Practically, this is put-off / be-renewed / put-on: "put off… the old man… and be renewed in the spirit of your mind; and… put on the new man" (Ephesians 4:22-24; Colossians 3:9-10). The new content is named: "whatsoever things are true… honest… just… pure… lovely… think on these things" (Philippians 4:8). And it is ultimately His gift — "a new heart also will I give you, and a new spirit will I put within you" (Ezekiel 36:26) — until "we have the mind of Christ" (1 Corinthians 2:16).',
      deep: 'Every person arrives carrying programming — patterns of thought laid down by fear, by old wounds, by a world that lied to them. The gospel does not just forgive that person; it offers to rewrite the code. "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God" (Romans 12:2). Transformation (the word is metamorphosis) happens at the level of the mind, and from there the life is proved.\n\nScripture gives the actual loop. First, notice and re-route the thought: the weapons of our warfare "pull down strong holds; casting down imaginations, and every high thing that exalteth itself against the knowledge of God, and bringing into captivity every thought to the obedience of Christ" (2 Corinthians 10:4-5). Catch the old thought, hold it up to His truth, and hand it over to Christ. Then there is a deliberate exchange — "put off… the old man, which is corrupt according to the deceitful lusts; and be renewed in the spirit of your mind; and… put on the new man" (Ephesians 4:22-24), the new self "renewed in knowledge after the image of him that created him" (Colossians 3:9-10). And there is new material to install: "whatsoever things are true, whatsoever things are honest… think on these things" (Philippians 4:8).\n\nThe relief is that you are not the only one working. Yahweh does the deepest part Himself: "A new heart also will I give you, and a new spirit will I put within you: and I will take away the stony heart out of your flesh, and I will give you an heart of flesh" (Ezekiel 36:26). Your part is to keep bringing the old thought into the light and receiving the replacement; His part is the heart transplant. The destination is staggering: "we have the mind of Christ" (1 Corinthians 2:16) — to actually think His thoughts after Him.',
    },
    levels: {
      child: 'Your mind is like a garden. Old, scary, or mean thoughts are weeds. When you notice one, you can hand it to Jesus and plant a true thought instead (Philippians 4:8). God even gives you a brand-new heart to help (Ezekiel 36:26).',
      'new-believer': 'You don’t have to white-knuckle your way to a better you. Notice the old thought, hold it up to God’s truth, and give it to Christ (2 Corinthians 10:5). Feed your mind true and good things (Philippians 4:8). God is doing the deep work — He gives a new heart (Ezekiel 36:26).',
    },
    verses: [
      v('Romans 12:2', 'Transformed by the renewing of the mind — the Renewed Mind facet.', 'anchor', ['spiritual-module', 'study', 'learn:ai-the-way']),
      v('2 Corinthians 10:4-5', 'Casting down imaginations, every thought captive — the active discipline.', 'truth', ['spiritual-module', 'study']),
      v('Ephesians 4:22-24', 'Put off the old man, be renewed in the spirit of the mind, put on the new.', 'truth'),
      v('Colossians 3:9-10', 'The new man renewed in knowledge after the image of his Creator.', 'truth'),
      v('Philippians 4:8', 'Think on these things — the new material the mind is filled with (the Test).', 'invitation', ['spiritual-module', 'study', 'learn:ai-the-way']),
      v('Ezekiel 36:26', 'A new heart and a new spirit — the reprogramming is ultimately His gift.', 'promise'),
      v('1 Corinthians 2:16', 'We have the mind of Christ — the destination of the renewal.', 'promise'),
      v('Isaiah 26:3', 'Perfect peace to the mind stayed on Him — the fruit of a fixed mind.', 'promise', ['spiritual-module', 'study']),
    ],
    tests: {
      questions: [
        { q: 'Romans 12:2 — how are we transformed?', options: ['By trying to fit in', 'By the renewing of the mind', 'By changing our circumstances'], answer: 1, explain: 'Transformed by the renewing of the mind, to prove God’s will (Romans 12:2).', ref: 'Romans 12:2' },
        { q: '2 Corinthians 10:5 — what do we do with thoughts?', options: ['Ignore them', 'Bring every thought captive to the obedience of Christ', 'Trust them all'], answer: 1, explain: 'Cast down imaginations and bring every thought captive to Christ (2 Corinthians 10:4-5).', ref: '2 Corinthians 10:4-5' },
        { q: 'Ezekiel 36:26 — what does God promise to give?', options: ['A new job', 'A new heart and a new spirit', 'New rules'], answer: 1, explain: 'A new heart and a new spirit, removing the heart of stone (Ezekiel 36:26).', ref: 'Ezekiel 36:26' },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'joy',
    title: 'Joy',
    subtitle: 'The joy of the Lord is strength',
    blurb: 'The joy of the Lord is your strength (Nehemiah 8:10); joy unspeakable (1 Peter 1:8); His joy made full in you (John 15:11). Joy is a fruit and a strength, not a mood to manufacture.',
    surfaces: ['spiritual-module', 'study', 'engagement'],
    interests: ['joy', 'growth'],
    lens: {
      perspective: 'Yahweh does not see joy as optional decoration — He gives it as strength for the work and the warfare (Nehemiah 8:10).',
      heart: 'His desire is "that my joy might remain in you, and that your joy might be full" (John 15:11) — He wants you full, not merely functional.',
      love: 'Joy is love overflowing: in His presence is fullness of joy (Psalm 16:11); nearness to the One who loves you is where it comes from.',
    },
    soul: 'Joy anchors the soul above circumstance, giving it strength to endure the road home; it is a foretaste of the soul’s eternal gladness in His presence.',
    depths: {
      essential: 'The joy of the Lord is your strength (Nehemiah 8:10). Jesus gives His own joy so yours is full (John 15:11). Joy is a fruit of the Spirit (Galatians 5:22-23), found in His presence (Psalm 16:11) — even in trials (James 1:2-3).',
      standard: 'Biblical joy is not forced cheerfulness; it is a God-given strength. When the people wept, Nehemiah said, "neither be ye sorry; for the joy of the LORD is your strength" (Nehemiah 8:10). Jesus gives His own joy as the source: "that my joy might remain in you, and that your joy might be full" (John 15:11), and Peter describes it as "joy unspeakable and full of glory" toward an unseen Christ (1 Peter 1:8). It is located in God’s presence — "in thy presence is fulness of joy" (Psalm 16:11) — and it is fruit grown by the Spirit, not manufactured (Galatians 5:22-23). It is even possible inside hardship: "count it all joy when ye fall into divers temptations; knowing this, that the trying of your faith worketh patience" (James 1:2-3). Hence the command can stand even in a hard season: "Rejoice in the Lord alway: and again I say, Rejoice" (Philippians 4:4).',
      deep: 'When Israel heard the rediscovered Law and wept under conviction, they were not told to stay in their grief. "Neither be ye sorry; for the joy of the LORD is your strength" (Nehemiah 8:10) — joy here is named as a source of strength, the thing that holds you up when sorrow would sink you. This is not denial of hard things; it is a deeper foundation than them.\n\nIts source is Christ Himself: "These things have I spoken unto you, that my joy might remain in you, and that your joy might be full" (John 15:11). It is His joy, on loan to you, which is why it can be "joy unspeakable and full of glory" toward a Savior you have never seen with your eyes (1 Peter 1:8). And its address is His presence: "in thy presence is fulness of joy; at thy right hand there are pleasures for evermore" (Psalm 16:11). That is why it is listed as fruit of the Spirit, not a work of willpower — "the fruit of the Spirit is love, joy, peace…" (Galatians 5:22-23).\n\nThe startling claim is that joy survives suffering: "count it all joy when ye fall into divers temptations; knowing this, that the trying of your faith worketh patience" (James 1:2-3). Not joy ABOUT the trial, but joy that the trial is doing something — and joy in the One who is with you in it. That is how "Rejoice in the Lord alway: and again I say, Rejoice" (Philippians 4:4) can be a command and not a cruelty.',
    },
    verses: [
      v('Nehemiah 8:10', 'The joy of the Lord is your strength — joy as a source of strength.', 'anchor', ['spiritual-module', 'engagement']),
      v('1 Peter 1:8', 'Joy unspeakable and full of glory — joy in the unseen Christ.', 'promise'),
      v('John 15:11', 'That My joy might remain in you — His joy, made full.', 'promise', ['spiritual-module', 'study']),
      v('Psalm 16:11', 'Fullness of joy in His presence — joy is located in nearness to God.', 'promise'),
      v('Galatians 5:22-23', 'Joy as fruit of the Spirit — grown, not manufactured.', 'truth', ['spiritual-module', 'study']),
      v('Philippians 4:4', 'Rejoice always — the command repeated for emphasis.', 'invitation', ['spiritual-module', 'engagement']),
      v('James 1:2-3', 'Count it all joy in trials — joy that reframes hardship as faith-work.', 'truth'),
    ],
    tests: {
      questions: [
        { q: 'Nehemiah 8:10 — the joy of the Lord is your…', options: ['Reward', 'Strength', 'Feeling'], answer: 1, explain: 'The joy of the LORD is your strength (Nehemiah 8:10).', ref: 'Nehemiah 8:10' },
        { q: 'Galatians 5:22 lists joy as…', options: ['A personality trait', 'Fruit of the Spirit', 'A reward for good behavior'], answer: 1, explain: 'Joy is fruit of the Spirit — grown, not manufactured (Galatians 5:22-23).', ref: 'Galatians 5:22-23' },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'love-unity',
    title: 'Love & Unity',
    subtitle: 'God is love; the Body undivided',
    blurb: 'God is love (1 John 4:8); we love because He first loved us (1 John 4:19). Love one another — the mark of a disciple (John 13:34-35). That they may be one (John 17:20-21). The Word that grounds the Body-undivided commitment.',
    surfaces: ['spiritual-module', 'pulpit', 'choir'],
    interests: ['love'],
    lens: {
      perspective: 'Yahweh defines Himself by it — "God is love" (1 John 4:8) — so love is not one of His traits; it is His nature, and the lens He sees all people through.',
      heart: 'His heart moved first: "we love him, because he first loved us" (1 John 4:19); the initiative is always His.',
      love: 'He proved it at cost — "while we were yet sinners, Christ died for us" (Romans 5:8) — and asks us to love as He loved (John 13:34).',
    },
    soul: 'Love is how souls are drawn and kept; "by this shall all men know that ye are my disciples" (John 13:35) — a united, loving Body is the most persuasive case for the soul.',
    depths: {
      essential: 'God IS love (1 John 4:8); we love because He first loved us (1 John 4:19). Love one another — that’s how the world knows you’re His (John 13:34-35). Jesus prayed that we’d be one (John 17:20-21). The greatest is love (1 Corinthians 13).',
      standard: 'Scripture makes love the center of God’s very nature: "he that loveth not knoweth not God; for God is love" (1 John 4:8), and our love is always a response — "we love him, because he first loved us" (1 John 4:19), love He proved "while we were yet sinners" (Romans 5:8). From that flows the disciple’s mark: "A new commandment I give unto you, That ye love one another… By this shall all men know that ye are my disciples" (John 13:34-35). Love’s anatomy is spelled out — "charity suffereth long, and is kind… seeketh not her own… beareth all things" (1 Corinthians 13:4-7) — and it is "the bond of perfectness" (Colossians 3:14). And Jesus prayed specifically for unity: "that they all may be one… that the world may believe" (John 17:20-21), grounded in the sevenfold oneness of "one body… one Spirit… one Lord, one faith, one baptism, one God" (Ephesians 4:4-6).',
      deep: 'The Bible’s boldest sentence about God is three words: "God is love" (1 John 4:8). Not God is loving among other things, but love is the very nature out of which everything He does proceeds — so much so that "he that loveth not knoweth not God." And our love is never the first move; it is always an echo: "We love him, because he first loved us" (1 John 4:19). The proof of that initiative is the cross at its most unflattering moment for us — "God commendeth his love toward us, in that, while we were yet sinners, Christ died for us" (Romans 5:8).\n\nThat love becomes the commanded shape of the church: "A new commandment I give unto you, That ye love one another; as I have loved you" (John 13:34) — and the evangelistic strategy is startlingly simple: "By this shall all men know that ye are my disciples, if ye have love one to another" (John 13:35). Paul then refuses to leave love as a sentiment and gives its working anatomy: "Charity suffereth long, and is kind; charity envieth not… seeketh not her own, is not easily provoked, thinketh no evil… beareth all things, believeth all things, hopeth all things, endureth all things" (1 Corinthians 13:4-7). It is "the bond of perfectness" (Colossians 3:14) and covers "the multitude of sins" (1 Peter 4:8).\n\nThis is why the Body must not divide. On the night before He died, Jesus did not pray that we would all agree on everything; He prayed "that they all may be one; as thou, Father, art in me, and I in thee… that the world may believe that thou hast sent me" (John 17:20-21). The unity is grounded in a fact, not a feeling: "one body, and one Spirit… one Lord, one faith, one baptism, one God and Father of all" (Ephesians 4:4-6). To hold the Word without dividing the Body is to take this prayer seriously.',
    },
    verses: [
      v('1 John 4:7-8', 'God is love — love’s source and the test of knowing Him.', 'anchor'),
      v('1 John 4:16', 'We have known and believed the love God has for us — God is love.', 'love'),
      v('1 John 4:19', 'We love because He first loved us — the initiative is His.', 'love'),
      v('Romans 5:8', 'While we were yet sinners, Christ died for us — love proved at cost.', 'love'),
      v('John 13:34-35', 'Love one another — the new commandment and the disciple’s mark.', 'truth', ['spiritual-module', 'pulpit']),
      v('John 17:20-21', 'That they all may be one — Christ’s own prayer for unity; the Body undivided.', 'truth', ['spiritual-module', 'pulpit']),
      v('Ephesians 4:4-6', 'One body, one Spirit, one Lord, one faith — the sevenfold oneness.', 'truth'),
      v('1 Corinthians 13:4-7', 'Charity suffereth long — the anatomy of love itself.', 'truth', ['spiritual-module', 'choir']),
      v('Colossians 3:14', 'Charity, the bond of perfectness — love binds maturity together.', 'truth'),
      v('1 Peter 4:8', 'Fervent charity covers a multitude of sins — love’s covering power.', 'truth'),
    ],
    tests: {
      questions: [
        { q: '1 John 4:8 says God…', options: ['has love', 'is love', 'wants love'], answer: 1, explain: 'God IS love — His very nature (1 John 4:8).', ref: '1 John 4:7-8' },
        { q: 'John 13:35 — how will all people know we are His disciples?', options: ['By our knowledge', 'By our love for one another', 'By our buildings'], answer: 1, explain: 'By love one to another (John 13:34-35).', ref: 'John 13:34-35' },
        { q: '1 John 4:19 — why do we love?', options: ['To earn God’s love', 'Because He first loved us', 'To look good'], answer: 1, explain: 'We love because He first loved us (1 John 4:19).', ref: '1 John 4:19' },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'stewardship-tithing',
    title: 'Stewardship & Tithing',
    subtitle: 'Original business systems',
    blurb: 'Bring the whole tithe (Malachi 3:8-10); give cheerfully (2 Corinthians 9:7); honor the Lord with firstfruits (Proverbs 3:9-10). Stewards must be found faithful (1 Corinthians 4:2). The Word beneath biblical economics and the Financial System.',
    surfaces: ['spiritual-module', 'financial', 'pulpit'],
    interests: ['stewardship'],
    lens: {
      perspective: 'Yahweh sees everything as already His — "the earth is the LORD’s" — so stewardship is managing His, not parting with ours.',
      heart: 'He invites us to prove Him in giving — "prove me now herewith… if I will not open you the windows of heaven" (Malachi 3:10); His heart is to bless, not to take.',
      love: 'He loves a cheerful giver (2 Corinthians 9:7) — the giving He wants is the kind that frees the giver, never extracts from him.',
    },
    soul: 'How we hold money reveals and shapes the soul: "faithful in that which is least" trains a soul for "much" (Luke 16:10); the heart follows the treasure.',
    depths: {
      essential: 'It’s all His already (Leviticus 27:30). Honor Him with the firstfruits (Proverbs 3:9-10); give cheerfully, not grudgingly (2 Corinthians 9:7). In tithes He invites you to test His faithfulness (Malachi 3:10). Be faithful in little (Luke 16:10).',
      standard: 'Biblical stewardship begins with ownership: "all the tithe of the land… is the LORD’s: it is holy unto the LORD" (Leviticus 27:30) — we manage what is already His. The pattern predates the Law (Abram gave tithes to Melchizedek, Genesis 14:20; Jacob vowed a tenth, Genesis 28:22) and runs through it. Malachi frames withholding as robbing God, then issues a rare invitation to test Him: "bring ye all the tithes into the storehouse… and prove me now herewith… if I will not open you the windows of heaven" (Malachi 3:8-10). The New Testament centers the heart: "God loveth a cheerful giver" (2 Corinthians 9:7), and giving is ordered first — "honour the LORD with thy substance, and with the firstfruits of all thine increase" (Proverbs 3:9-10). Underneath it all is the standing test: "it is required in stewards, that a man be found faithful" (1 Corinthians 4:2), proven in the small things — "he that is faithful in that which is least is faithful also in much" (Luke 16:10).',
      deep: 'The platform’s entire approach to money rests on a worldview the world rejects: it is not ours to begin with. "All the tithe of the land, whether of the seed of the land, or of the fruit of the tree, is the LORD’s: it is holy unto the LORD" (Leviticus 27:30). Stewardship, then, is not generosity with our property; it is faithfulness with His. That is why the tithe shows up long before the Law as a spontaneous response of worship — Abram "gave him tithes of all" (Genesis 14:20), Jacob vowed "of all that thou shalt give me I will surely give the tenth unto thee" (Genesis 28:22).\n\nMalachi puts the matter bluntly and then does something God almost never does — He invites a test: "Will a man rob God?… Bring ye all the tithes into the storehouse… and prove me now herewith, saith the LORD of hosts, if I will not open you the windows of heaven, and pour you out a blessing, that there shall not be room enough to receive it" (Malachi 3:8-10). The tone is not a shakedown; it is a Father daring His children to discover His faithfulness.\n\nThe New Testament guards the heart of it against legalism and against extraction alike: "Every man according as he purposeth in his heart, so let him give; not grudgingly, or of necessity: for God loveth a cheerful giver" (2 Corinthians 9:7). Order matters — "honour the LORD with thy substance, and with the firstfruits" (Proverbs 3:9-10), Him first, not the leftovers. And money is treated as a training ground for the soul: "He that is faithful in that which is least is faithful also in much" (Luke 16:10), for "it is required in stewards, that a man be found faithful" (1 Corinthians 4:2). How you handle a little reveals — and forms — what you will be trusted with for eternity.',
    },
    verses: [
      v('Malachi 3:8-10', 'Bring the whole tithe — the storehouse principle and the test God invites.', 'invitation', ['spiritual-module', 'financial', 'pulpit']),
      v('2 Corinthians 9:7', 'God loves a cheerful giver — the heart of New-Testament giving.', 'truth', ['spiritual-module', 'financial']),
      v('Genesis 14:20', 'Abram gave tithes of all — the tithe predates the Law (to Melchizedek).', 'truth', ['spiritual-module', 'financial']),
      v('Genesis 28:22', 'Jacob’s vow of the tenth — the tithe as covenant response.', 'truth', ['financial']),
      v('Leviticus 27:30', 'The tithe is the Lord’s, holy unto Him — the tithe defined under the Law.', 'truth', ['financial']),
      v('Proverbs 3:9-10', 'Honor the Lord with firstfruits — order of priority, with promise.', 'promise', ['spiritual-module', 'financial']),
      v('1 Corinthians 4:2', 'Stewards must be found faithful — the standing test of stewardship.', 'truth', ['spiritual-module', 'financial', 'learn:infrastructure']),
      v('Luke 16:10', 'Faithful in little, faithful in much — stewardship scales from the small.', 'truth', ['financial', 'learn:infrastructure']),
    ],
    tests: {
      questions: [
        { q: 'Malachi 3:10 — what does God invite regarding the tithe?', options: ['To keep it private', 'To prove/test Him and see Him open heaven’s blessing', 'To pay a fine'], answer: 1, explain: 'Bring the tithes and prove Him — He will open the windows of heaven (Malachi 3:10).', ref: 'Malachi 3:8-10' },
        { q: '2 Corinthians 9:7 — what kind of giver does God love?', options: ['A reluctant one', 'A cheerful one', 'A wealthy one'], answer: 1, explain: 'Not grudgingly or of necessity — God loves a cheerful giver (2 Corinthians 9:7).', ref: '2 Corinthians 9:7' },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'spiritual-warfare',
    title: 'Spiritual Warfare',
    subtitle: 'Not against flesh and blood',
    blurb: 'Put on the whole armor (Ephesians 6:11). We wrestle not against flesh and blood (Ephesians 6:12). Resist the adversary and he flees (James 4:7). Greater is He that is in you (1 John 4:4). The real battlefield is unseen.',
    surfaces: ['spiritual-module', 'study'],
    interests: ['warfare', 'mind'],
    lens: {
      perspective: 'Yahweh sees the true enemy clearly — not the people around you, but unseen powers (Ephesians 6:12); He reframes your fight so you stop swinging at flesh and blood.',
      heart: 'He has already secured the outcome — "greater is he that is in you, than he that is in the world" (1 John 4:4); He fights for you, not merely alongside you.',
      love: 'His armor is protective love: He does not send you out bare, but covers you head to foot (Ephesians 6:11).',
    },
    soul: 'The warfare is over souls — the adversary "seeking whom he may devour" (1 Peter 5:8); standing firm guards your soul and frees you to guard others’.',
    depths: {
      essential: 'Your real fight isn’t against people — it’s against unseen powers (Ephesians 6:12). So put on God’s armor (Ephesians 6:11). Submit to God, resist the adversary, and he flees (James 4:7). Greater is He in you than he that is in the world (1 John 4:4).',
      standard: 'Scripture relocates the battle. "We wrestle not against flesh and blood, but against principalities, against powers… against spiritual wickedness in high places" (Ephesians 6:12) — which means the person across from you is not the enemy. The response is to "put on the whole armour of God, that ye may be able to stand against the wiles of the devil" (Ephesians 6:11). The strategy is order and resistance: "Submit yourselves therefore to God. Resist the devil, and he will flee from you" (James 4:7) — submission first, then resistance. Vigilance is required, because "your adversary the devil, as a roaring lion, walketh about, seeking whom he may devour" (1 Peter 5:8). But the outcome is never in doubt for the believer: "greater is he that is in you, than he that is in the world" (1 John 4:4).',
      deep: 'One of the most freeing reframes in Scripture is the discovery of who the enemy actually is. "For we wrestle not against flesh and blood, but against principalities, against powers, against the rulers of the darkness of this world, against spiritual wickedness in high places" (Ephesians 6:12). The spouse, the coworker, the stranger online — none of them is the real adversary. This both lowers our weapons against people and raises our seriousness about the unseen.\n\nThe equipment is defensive-to-stand, not anxious: "Put on the whole armour of God, that ye may be able to stand against the wiles of the devil" (Ephesians 6:11) — note "wiles," schemes; the fight is often deception, which is why the renewed mind (the previous theme) is itself warfare. The tactic is sequenced: "Submit yourselves therefore to God. Resist the devil, and he will flee from you" (James 4:7). Submission to God comes first; resistance flows from being under His authority, not from our own bravado.\n\nVigilance is sober, not fearful: "Be sober, be vigilant; because your adversary the devil, as a roaring lion, walketh about, seeking whom he may devour" (1 Peter 5:8) — he is real and predatory, aiming at souls. Yet the believer fights from victory, not for it: "Ye are of God, little children, and have overcome them: because greater is he that is in you, than he that is in the world" (1 John 4:4). The One indwelling you is greater than the one opposing you. That is the ground we stand on.',
    },
    verses: [
      v('Ephesians 6:11', 'Put on the whole armor — to stand against the schemes of the adversary.', 'truth'),
      v('Ephesians 6:12', 'Not against flesh and blood — the enemy is unseen; the real war named.', 'anchor', ['spiritual-module', 'study']),
      v('James 4:7', 'Submit to God, resist the adversary, and he flees — the order matters.', 'truth'),
      v('1 Peter 5:8', 'Be sober and vigilant — the adversary prowls; watchfulness is required.', 'warning'),
      v('1 John 4:4', 'Greater is He that is in you — the decisive advantage of the believer.', 'promise', ['spiritual-module', 'study']),
      v('2 Corinthians 10:4-5', 'Mighty weapons that bring thoughts captive — warfare is fought in the mind.', 'truth'),
    ],
    tests: {
      questions: [
        { q: 'Ephesians 6:12 — who do we ultimately wrestle against?', options: ['Other people', 'Unseen spiritual powers', 'Ourselves only'], answer: 1, explain: 'Not flesh and blood, but principalities and powers (Ephesians 6:12).', ref: 'Ephesians 6:12' },
        { q: 'James 4:7 — what is the order?', options: ['Resist, then submit', 'Submit to God, then resist the devil', 'Just ignore it'], answer: 1, explain: 'Submit to God; resist the devil and he flees (James 4:7).', ref: 'James 4:7' },
        { q: '1 John 4:4 — why can the believer stand?', options: ['We are strong', 'Greater is He that is in you', 'The enemy is weak on his own'], answer: 1, explain: 'Greater is He that is in you than he that is in the world (1 John 4:4).', ref: '1 John 4:4' },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'discernment-testing',
    title: 'Discernment & Testing',
    subtitle: 'Prove all things — the Verification Doctrine',
    blurb: 'Prove all things; hold fast the good (1 Thessalonians 5:21). Try the spirits (1 John 4:1). The Bereans searched daily whether it was so (Acts 17:11). The Word beneath the platform’s own Verification Doctrine — verify, then trust.',
    surfaces: ['spiritual-module', 'learn:ai-the-way', 'study', 'content-engine'],
    interests: ['discernment', 'wisdom'],
    lens: {
      perspective: 'Yahweh honors the mind that examines — He commends the Bereans as "more noble" for testing the message against Scripture (Acts 17:11).',
      heart: 'He is not threatened by honest questions; He invites the test because truth has nothing to fear from examination.',
      love: 'Discernment is love protecting you — it keeps deception from devouring a soul He paid for; "believe not every spirit" is a Father guarding His child (1 John 4:1).',
    },
    soul: 'Souls are lost to plausible lies; teaching a person to test is teaching them to guard their own soul and not be carried off by "every wind of doctrine."',
    depths: {
      essential: 'Prove all things; hold fast what is good (1 Thessalonians 5:21). Don’t believe every spirit — test them (1 John 4:1). Like the Bereans, check it against Scripture (Acts 17:11). Verify, then trust.',
      standard: 'Faith is not credulity. "Prove all things; hold fast that which is good" (1 Thessalonians 5:21) is a command to examine before embracing. John applies it to teaching and spirits: "believe not every spirit, but try the spirits whether they are of God: because many false prophets are gone out into the world" (1 John 4:1). The model is the Bereans, praised precisely for fact-checking even an apostle: they "received the word with all readiness of mind, and searched the scriptures daily, whether those things were so" (Acts 17:11). Proverbs adds the contrast: "The simple believeth every word: but the prudent man looketh well to his going" (Proverbs 14:15), and discernment is trained "by reason of use" (Hebrews 5:14). This is the spiritual root of the platform’s Verification Doctrine — verify, then trust.',
      deep: 'The platform’s rule that nothing is trusted on the strength of sounding right is not a tech value borrowed and baptized; it is straight Scripture. "Prove all things; hold fast that which is good" (1 Thessalonians 5:21) — examine everything, keep what survives. The opposite posture is named a fault: "The simple believeth every word: but the prudent man looketh well to his going" (Proverbs 14:15).\n\nThis applies even — especially — to spiritual claims: "Beloved, believe not every spirit, but try the spirits whether they are of God: because many false prophets are gone out into the world" (1 John 4:1). Sincerity is not a credential; sources must be tested. The gold-standard example is the Berean church, who tested the preaching of Paul himself: they "received the word with all readiness of mind, and searched the scriptures daily, whether those things were so" (Acts 17:11) — and Luke calls them "more noble" for it. Notice the balance: readiness of mind (not cynicism) plus daily searching of Scripture (not gullibility).\n\nDiscernment is a trained faculty, not a personality: "strong meat belongeth to them that are of full age, even those who by reason of use have their senses exercised to discern both good and evil" (Hebrews 5:14). You get it by practicing it. This is exactly why the Learn courses teach the young to verify AI output rather than swallow it — the same muscle that protects a soul from a false prophet protects a student from a confident, wrong machine. Verify, then trust.',
    },
    verses: [
      v('1 Thessalonians 5:21', 'Prove all things, hold fast the good — the Verification Doctrine in one line.', 'anchor', ['spiritual-module', 'learn:ai-the-way']),
      v('Proverbs 18:13', 'Answering before hearing is folly — think before you speak (Learn wk2).', 'truth', ['learn:ai-the-way']),
      v('1 John 4:1', 'Try the spirits — do not believe every spirit; test the source.', 'truth', ['spiritual-module', 'content-engine']),
      v('Acts 17:11', 'The Bereans searched the Scriptures daily — verify the teaching against the Word.', 'truth', ['spiritual-module', 'content-engine']),
      v('Proverbs 14:15', 'The simple believe every word; the prudent look well — discernment vs credulity.', 'truth', ['learn:ai-the-way']),
      v('Hebrews 5:14', 'Senses exercised to discern good and evil — discernment is trained by use.', 'truth', ['spiritual-module', 'study']),
    ],
    tests: {
      questions: [
        { q: '1 Thessalonians 5:21 — what should we do with all things?', options: ['Accept them', 'Prove (test) them and hold fast the good', 'Reject them'], answer: 1, explain: 'Prove all things; hold fast that which is good (1 Thessalonians 5:21).', ref: '1 Thessalonians 5:21' },
        { q: 'Why were the Bereans called more noble (Acts 17:11)?', options: ['They believed instantly', 'They searched the Scriptures daily to verify', 'They were wealthy'], answer: 1, explain: 'They received the word readily AND searched the Scriptures daily (Acts 17:11).', ref: 'Acts 17:11' },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'wisdom-skill',
    title: 'Wisdom & Skilled Work',
    subtitle: 'Excellence — builders before kings',
    blurb: 'Get wisdom and understanding (Proverbs 4:7). The diligent stand before kings (Proverbs 22:29). God gave Daniel skill in all learning (Daniel 1:17). Guard your heart (Proverbs 4:23). The Word beneath the Excellence Standard and the builder courses.',
    surfaces: ['spiritual-module', 'study', 'learn:ai-the-way', 'learn:infrastructure'],
    interests: ['wisdom', 'word'],
    lens: {
      perspective: 'Yahweh values skill and diligence — He Himself gave Daniel "knowledge and skill in all learning" (Daniel 1:17); excellence is His gift and His delight, not vanity.',
      heart: 'He wants His people competent and free, standing "before kings, not before mean men" (Proverbs 22:29) — a Father raising builders, not dependents.',
      love: 'His wisdom is offered, not hoarded — "get wisdom… with all thy getting get understanding" (Proverbs 4:7); He gives it generously to those who ask.',
    },
    soul: 'Skilled, excellent work makes a soul a credible witness and a blessing to others; "the skilled stand before kings" opens doors that the gospel walks through.',
    depths: {
      essential: 'Wisdom is the main thing — get understanding (Proverbs 4:7). The diligent and skilled stand before kings (Proverbs 22:29); God gave Daniel skill in all learning (Daniel 1:17). Guard your heart, for life flows from it (Proverbs 4:23).',
      standard: 'Scripture prizes wisdom and skilled work as expressions of godliness, not distractions from it. "Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding" (Proverbs 4:7). Diligence and skill are honored with access: "Seest thou a man diligent in his business? he shall stand before kings; he shall not stand before mean men" (Proverbs 22:29). Skill itself is named a gift of God — "God gave them knowledge and skill in all learning and wisdom: and Daniel had understanding" (Daniel 1:17) — Daniel mastering Babylon’s curriculum without losing his identity. With it comes a guardrail: "Keep thy heart with all diligence; for out of it are the issues of life" (Proverbs 4:23), and the freedom-with-limits of "all things are lawful… but I will not be brought under the power of any" (1 Corinthians 6:12). And excellence is ultimately worship — "whatsoever ye do, do it heartily, as to the Lord" (Colossians 3:23).',
      deep: 'The Excellence Standard — that the work be the best version, not the lazy one — is rooted in a Bible that treats skill and wisdom as sacred. "Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding" (Proverbs 4:7). Knowledge is good; wisdom (knowing what to do with it) and understanding (knowing why) are better, and worth the whole pursuit.\n\nSkilled, diligent work is dignified with promotion: "Seest thou a man diligent in his business? he shall stand before kings; he shall not stand before mean men" (Proverbs 22:29) — the maker’s competence opens doors. And the source of real skill is named: "God gave them knowledge and skill in all learning and wisdom: and Daniel had understanding in all visions and dreams" (Daniel 1:17). Daniel out-learned Babylon’s academy without being assimilated by it — the model for using a powerful system without being owned by it, which is exactly how the Learn courses teach the young to use AI.\n\nTwo guardrails keep skill from becoming a snare. The heart must be protected: "Keep thy heart with all diligence; for out of it are the issues of life" (Proverbs 4:23) — guard the source and the streams stay clean. And freedom must stay free: "All things are lawful unto me, but all things are not expedient… but I will not be brought under the power of any" (1 Corinthians 6:12) — capable, but mastered by nothing. Finally, all of it is aimed Godward: "whatsoever ye do, do it heartily, as to the Lord, and not unto men" (Colossians 3:23). The skilled hand becomes an act of worship, and "kings raise kings."',
    },
    verses: [
      v('Proverbs 4:7', 'Wisdom is the principal thing — get understanding (the Scripture Standard’s header verse).', 'anchor', ['spiritual-module', 'study']),
      v('Proverbs 22:29', 'The diligent stand before kings — skilled work has weight (Learn wk6).', 'truth', ['learn:ai-the-way', 'learn:infrastructure']),
      v('Daniel 1:17', 'God gave Daniel skill in all learning — mastery without losing identity (Learn wk4).', 'truth', ['learn:ai-the-way']),
      v('Proverbs 4:23', 'Keep your heart with all diligence — guard the source (Learn wk7).', 'truth', ['spiritual-module', 'learn:ai-the-way']),
      v('1 Corinthians 6:12', 'All lawful, but not mastered by any — freedom with self-governance (Learn wk7).', 'truth', ['learn:ai-the-way']),
      v('Colossians 3:23', 'Do it heartily as to the Lord — excellence as worship.', 'truth', ['learn:broadcast', 'learn:infrastructure']),
    ],
    tests: {
      questions: [
        { q: 'Proverbs 4:7 — what is the principal thing?', options: ['Money', 'Wisdom (and understanding)', 'Fame'], answer: 1, explain: 'Wisdom is the principal thing; get understanding (Proverbs 4:7).', ref: 'Proverbs 4:7' },
        { q: 'Daniel 1:17 — where did Daniel’s skill in learning come from?', options: ['Hard work alone', 'God gave it', 'Babylon’s schools'], answer: 1, explain: 'God gave them knowledge and skill in all learning (Daniel 1:17).', ref: 'Daniel 1:17' },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'service-calling',
    title: 'Service & Calling',
    subtitle: 'Greatness is service; kings raise kings',
    blurb: 'Whoever would be great must serve (Mark 10:43-45). Use freedom to serve in love (Galatians 5:13). Make disciples (Matthew 28:19-20). Entrust it to faithful people who will teach others (2 Timothy 2:2). The Word beneath serve-not-extract and the multiplication path.',
    surfaces: ['spiritual-module', 'learn:ai-the-way', 'learn:broadcast'],
    interests: ['service', 'evangelism'],
    lens: {
      perspective: 'Yahweh inverts the world’s ladder — in His Kingdom the great one is the servant (Mark 10:43-45); He measures by who you lift, not who you rule.',
      heart: 'He modeled it Himself: the Son "came not to be ministered unto, but to minister, and to give his life a ransom for many" (Mark 10:45).',
      love: 'Calling is love given a direction — "by love serve one another" (Galatians 5:13); your gifts are His love reaching someone through you.',
    },
    soul: 'Service is how souls are reached and discipled — the Great Commission is soul-work (Matthew 28:19-20), and "kings raise kings" multiplies the harvest.',
    depths: {
      essential: 'Greatness in the Kingdom is service (Mark 10:43-45). Use your freedom to serve one another in love (Galatians 5:13). Go make disciples (Matthew 28:19-20), and entrust what you learn to faithful people who will teach others (2 Timothy 2:2).',
      standard: 'Jesus overturned the meaning of greatness: "whosoever will be great among you, shall be your minister… For even the Son of man came not to be ministered unto, but to minister, and to give his life a ransom for many" (Mark 10:43-45). Freedom is given for this purpose — "use not liberty for an occasion to the flesh, but by love serve one another" (Galatians 5:13) — and gifts are stewarded for others: "minister the same one to another, as good stewards of the manifold grace of God" (1 Peter 4:10), in "lowliness of mind" that esteems others (Philippians 2:3-4). The calling culminates in multiplication — the Great Commission, "Go ye therefore, and teach all nations" (Matthew 28:19-20), carried forward by "the same commit thou to faithful men, who shall be able to teach others also" (2 Timothy 2:2). Kings raise kings.',
      deep: 'In a single moment recorded in Mark, Jesus dismantled the world’s entire status game. His disciples were jockeying for position; He answered, "whosoever will be great among you, shall be your minister: And whosoever of you will be the chiefest, shall be servant of all. For even the Son of man came not to be ministered unto, but to minister, and to give his life a ransom for many" (Mark 10:43-45). Greatness is not abolished — it is redefined as service, and the proof is His own self-giving death.\n\nThis is why freedom in the gospel is never freedom for self alone: "ye have been called unto liberty; only use not liberty for an occasion to the flesh, but by love serve one another" (Galatians 5:13). Your gifts are not yours to display but to deploy: "As every man hath received the gift, even so minister the same one to another, as good stewards of the manifold grace of God" (1 Peter 4:10), with the mindset of "lowliness of mind let each esteem other better than themselves" (Philippians 2:3-4).\n\nAnd calling always reaches past the individual to multiplication. The last command before the ascension was a commission: "Go ye therefore, and teach all nations, baptizing them… Teaching them to observe all things whatsoever I have commanded you" (Matthew 28:19-20). And the method is generational hand-off: "the things that thou hast heard of me among many witnesses, the same commit thou to faithful men, who shall be able to teach others also" (2 Timothy 2:2). That is the "kings raise kings" engine of the Learn courses — the graduate becomes the next cohort’s teacher, and the service keeps reaching new souls.',
    },
    verses: [
      v('Mark 10:43-45', 'Whoever would be great must serve — the kingdom inversion (Learn wk5).', 'anchor', ['spiritual-module', 'learn:ai-the-way']),
      v('Galatians 5:13', 'Use freedom to serve one another in love — freedom is for love (Learn wk5).', 'truth', ['spiritual-module', 'learn:ai-the-way']),
      v('Matthew 28:19-20', 'Go and make disciples — the Great Commission (Learn wk8).', 'invitation', ['spiritual-module', 'learn:ai-the-way']),
      v('2 Timothy 2:2', 'Entrust it to faithful people who will teach others — the multiplication path.', 'truth', ['spiritual-module', 'learn:ai-the-way']),
      v('Philippians 2:3-4', 'Esteem others better; look to others’ interests — the generous-collective posture.', 'truth'),
      v('1 Peter 4:10', 'Minister your gift as good stewards of grace — serving as stewardship.', 'truth', ['spiritual-module', 'learn:broadcast']),
    ],
    tests: {
      questions: [
        { q: 'Mark 10:43-45 — how is greatness defined in the Kingdom?', options: ['By ruling others', 'By serving others', 'By wealth'], answer: 1, explain: 'Whoever would be great must be a servant (Mark 10:43-45).', ref: 'Mark 10:43-45' },
        { q: '2 Timothy 2:2 — entrust what you learned to whom?', options: ['Anyone', 'Faithful people who can teach others', 'Only experts'], answer: 1, explain: 'Commit it to faithful people able to teach others — multiplication (2 Timothy 2:2).', ref: '2 Timothy 2:2' },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'his-will-and-way',
    title: 'His Will & His Way',
    subtitle: 'His purposes; seek first the Kingdom',
    blurb: 'He works with intent and design (Jeremiah 29:11; Romans 8:28; Ephesians 1:9-11). Seek first the Kingdom (Matthew 6:33); lean not on your own understanding (Proverbs 3:5-6); "not my will but Thine" (Luke 22:42). Order life around His will and way first.',
    surfaces: ['spiritual-module', 'study'],
    interests: ['growth', 'wisdom'],
    lens: {
      perspective: 'Yahweh’s ways are higher than ours (Isaiah 55:8-9); He sees the end from the beginning (Isaiah 46:9-10), so His will is not a restriction but the best possible path.',
      heart: 'His thoughts toward you are "thoughts of peace, and not of evil, to give you an expected end" (Jeremiah 29:11) — His purposes are FOR you.',
      love: 'Surrender is safe because the One you surrender to is love — "not my will, but thine" was prayed to a Father who would not waste a tear (Luke 22:42).',
    },
    soul: 'A soul ordered around His will arrives home; "not every one that saith Lord, Lord… but he that doeth the will of my Father" (Matthew 7:21) — doing His will is the soul’s safety.',
    willAndWay: 'Practically: seek first the Kingdom (Matthew 6:33), commit your way and works to Him (Psalm 37:5; Proverbs 16:3), trust over your own understanding (Proverbs 3:5-6), and let Him direct your steps (Proverbs 16:9).',
    depths: {
      essential: 'God’s ways are higher than ours (Isaiah 55:8-9), and His purposes for you are good (Jeremiah 29:11; Romans 8:28). So seek first His Kingdom (Matthew 6:33), trust Him over your own understanding (Proverbs 3:5-6), and pray "not my will, but Thine" (Luke 22:42).',
      standard: 'God is not improvising; He "worketh all things after the counsel of his own will" (Ephesians 1:9-11), declaring "the end from the beginning… My counsel shall stand" (Isaiah 46:9-10). His ways are higher than ours (Isaiah 55:8-9), and His intentions are kind — "thoughts of peace, and not of evil, to give you an expected end" (Jeremiah 29:11) — so that "all things work together for good to them that love God" (Romans 8:28). The right response is to prioritize His will and way: "seek ye first the kingdom of God" (Matthew 6:33); "Trust in the LORD with all thine heart; and lean not unto thine own understanding… and he shall direct thy paths" (Proverbs 3:5-6); "Commit thy way unto the LORD" (Psalm 37:5; Proverbs 16:3,9). The model prayer is Gethsemane: "not my will, but thine, be done" (Luke 22:42) — and the warning is plain: "Not every one that saith unto me, Lord, Lord… but he that doeth the will of my Father" (Matthew 7:21).',
      deep: 'Behind the visible world is a purposeful God, not random fate. "There are many devices in a man’s heart; nevertheless the counsel of the LORD, that shall stand" (Proverbs 19:21). He "worketh all things after the counsel of his own will" (Ephesians 1:11), "declaring the end from the beginning… saying, My counsel shall stand, and I will do all my pleasure" (Isaiah 46:9-10). And those purposes are not cold: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end" (Jeremiah 29:11). This is the foundation of Romans 8:28 — "all things work together for good to them that love God, to them who are the called according to his purpose."\n\nBut His ways genuinely differ from ours: "For my thoughts are not your thoughts, neither are your ways my ways… For as the heavens are higher than the earth, so are my ways higher than your ways" (Isaiah 55:8-9). That gap is the reason for trust over self-reliance: "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths" (Proverbs 3:5-6). Practically, this becomes an ordering of life: "seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you" (Matthew 6:33); "Commit thy way unto the LORD; trust also in him; and he shall bring it to pass" (Psalm 37:5); "Commit thy works unto the LORD, and thy thoughts shall be established" (Proverbs 16:3); "A man’s heart deviseth his way: but the LORD directeth his steps" (Proverbs 16:9).\n\nThe whole posture crystallizes in one Gethsemane sentence the Son prayed under the worst pressure imaginable: "Father, if thou be willing, remove this cup from me: nevertheless not my will, but thine, be done" (Luke 22:42). And Jesus warns that lip-service is not the same as alignment: "Not every one that saith unto me, Lord, Lord, shall enter into the kingdom of heaven; but he that doeth the will of my Father which is in heaven" (Matthew 7:21). To put His will and way first is not to lose your life — it is the only way to actually find it, and it ties straight back to the Father’s business: ordering everything around what He is doing.',
    },
    verses: [
      v('Jeremiah 29:11', 'Thoughts of peace, not of evil, to give an expected end — His purposes are FOR you.', 'promise'),
      v('Romans 8:28', 'All things work together for good to those who love God — purpose under providence.', 'promise'),
      v('Ephesians 1:9-11', 'He works all things after the counsel of His will — the mystery of His purpose.', 'truth'),
      v('Proverbs 19:21', 'Many plans in a heart, but the LORD’s counsel stands — His purpose prevails.', 'truth'),
      v('Isaiah 46:9-10', 'Declaring the end from the beginning — His counsel shall stand.', 'truth'),
      v('Isaiah 55:8-9', 'His thoughts and ways higher than ours — why we trust beyond our understanding.', 'anchor'),
      v('Matthew 6:33', 'Seek first the Kingdom — the ordering priority.', 'invitation', ['spiritual-module']),
      v('Proverbs 3:5-6', 'Trust the Lord, lean not on your own understanding — He directs your paths.', 'invitation'),
      v('Luke 22:42', 'Not my will, but Thine — the Gethsemane surrender.', 'anchor'),
      v('Matthew 7:21', 'Not the one who says Lord, Lord, but he who does the Father’s will.', 'warning'),
      v('Psalm 37:5', 'Commit your way to the Lord and He will bring it to pass.', 'promise'),
      v('Proverbs 16:3', 'Commit your works to the Lord and your thoughts will be established.', 'promise'),
      v('Proverbs 16:9', 'A man plans his way, but the Lord directs his steps.', 'truth'),
    ],
    tests: {
      questions: [
        { q: 'Matthew 6:33 — what do we seek first?', options: ['Provision', 'The Kingdom of God and His righteousness', 'Success'], answer: 1, explain: 'Seek first the Kingdom and His righteousness; the rest is added (Matthew 6:33).', ref: 'Matthew 6:33' },
        { q: 'Proverbs 3:5-6 — what are we told NOT to lean on?', options: ['God’s Word', 'Our own understanding', 'Wise counsel'], answer: 1, explain: 'Trust the Lord, lean not on your own understanding (Proverbs 3:5-6).', ref: 'Proverbs 3:5-6' },
        { q: 'Matthew 7:21 — who enters the kingdom?', options: ['Whoever says "Lord, Lord"', 'He who does the will of the Father', 'The most religious'], answer: 1, explain: 'Not words only, but doing the Father’s will (Matthew 7:21).', ref: 'Matthew 7:21' },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'grace-and-truth',
    title: 'Grace & Truth',
    subtitle: 'The narrow way, judgment, and the hope held out',
    blurb: 'Full of grace AND truth (John 1:14). Jesus — who is Love — spoke plainly of sin, judgment, hell, and the narrow way, always as warning that flows from love, with salvation held out. Truth warns, love draws; both for the soul’s sake. No condemnation, just truth.',
    surfaces: ['spiritual-module', 'pulpit'],
    interests: ['grace-truth', 'salvation', 'evangelism'],
    lens: {
      perspective: 'Yahweh sees the real stakes — He will not flatter us about a danger that is eternal; but He looks on the lost with longing, "no pleasure in the death of the wicked" (Ezekiel 33:11).',
      heart: 'His heart is rescue, not ruin — "not willing that any should perish, but that all should come to repentance" (2 Peter 3:9); the warning IS the love.',
      love: 'The same Jesus who warned of hell wept over the city and died to keep us from it — "God sent not his Son… to condemn the world; but that the world through him might be saved" (John 3:17).',
    },
    soul: 'This theme is the soul’s rescue stated bluntly: the cliff is real and the Bridge is real. Truth names the danger so love can carry the soul across to safety.',
    depths: {
      essential: 'Jesus came full of grace AND truth (John 1:14). He spoke honestly about sin, judgment, and hell — and about the narrow way that leads to life (Matthew 7:13-14). But the warning is love: He came not to condemn but to save (John 3:17); God is "not willing that any should perish" (2 Peter 3:9). Truth tells you the danger; love carries you to safety.',
      standard: 'A love that hides a real danger is not love. So the same Jesus the Bible calls love spoke plainly about judgment, sin, and hell — more than anyone — precisely because He loved. He is "full of grace and truth" (John 1:14), and the two never cancel. He named the narrow way: "wide is the gate, and broad is the way, that leadeth to destruction… because strait is the gate, and narrow is the way, which leadeth unto life" (Matthew 7:13-14). He warned of judgment in the Sheep and the Goats (Matthew 25:41-46), of a place to fear more than death (Matthew 10:28), of the rich man and Lazarus (Luke 16:19-31). He called for repentance: "except ye repent, ye shall all likewise perish" (Luke 13:3); "the wages of sin is death; but the gift of God is eternal life" (Romans 6:23). Yet every warning is fenced by hope: "God sent not his Son into the world to condemn the world; but that the world through him might be saved" (John 3:17), and "the Lord is… not willing that any should perish" (2 Peter 3:9). And the governing tone for the hardest truths is no-condemnation: "Neither do I condemn thee: go, and sin no more" (John 8:10-11); "There is therefore now no condemnation to them which are in Christ Jesus" (Romans 8:1).',
      deep: 'It is sometimes said that focusing on God’s love means going soft on hard truths. But the One who is Love spoke about hell, judgment, and sin more directly than anyone in Scripture — and He did it because He loved. "The Word was made flesh… full of grace and truth" (John 1:14): not grace at truth’s expense, nor truth at grace’s. To preach only comfort to someone walking toward a cliff is not kindness; it is the opposite.\n\nSo Jesus told the truth about the stakes. There are two ways: "Enter ye in at the strait gate: for wide is the gate, and broad is the way, that leadeth to destruction, and many there be which go in thereat: Because strait is the gate, and narrow is the way, which leadeth unto life, and few there be that find it" (Matthew 7:13-14). He spoke of final judgment — "Depart from me, ye cursed, into everlasting fire… these shall go away into everlasting punishment: but the righteous into life eternal" (Matthew 25:41-46) — and of a loss worse than bodily death: "fear him which is able to destroy both soul and body in hell" (Matthew 10:28). He told of the rich man "in hell… in torments" who could not cross back (Luke 16:19-31), and Revelation names the second death — "the lake which burneth with fire and brimstone" (Revelation 21:8; 20:15). The call is repentance: "except ye repent, ye shall all likewise perish" (Luke 13:3), for "the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord" (Romans 6:23).\n\nBut notice that the warnings are never the last word — they are guardrails on a road to a held-out hope. "He that believeth on him is not condemned" (John 3:18); "God sent not his Son into the world to condemn the world; but that the world through him might be saved" (John 3:17); the Lord is "longsuffering to us-ward, not willing that any should perish, but that all should come to repentance" (2 Peter 3:9); and He says with His own oath, "I have no pleasure in the death of the wicked; but that the wicked turn from his way and live: turn ye, turn ye" (Ezekiel 33:11). This sets the governing tone for every hard truth in this whole library — no condemnation, just truth: "Neither do I condemn thee: go, and sin no more" (John 8:10-11); "There is therefore now no condemnation to them which are in Christ Jesus" (Romans 8:1). Conviction is the Spirit’s gift that leads to life; condemnation crushes. We tell the truth plainly, in love, with the way of escape always open — and we are especially gentle with the wounded and the children: honest about the danger, never weaponizing fear, always pointing to the cross.',
    },
    levels: {
      child: 'God is so good and so honest that He warns us about things that can hurt us forever — like a parent who says "don’t touch the hot stove" because they love you. There is a way that leads to life with Him, and Jesus is that way (John 14:6). He came to rescue you, not to scare you (John 3:17). You are safe with Him — just hold His hand and follow.',
      'new-believer': 'Grace and truth go together. Yes, the Bible speaks honestly about sin, judgment, and hell — because the danger is real and God won’t lie to you about it. But every warning comes with an open door: He came to save, not condemn (John 3:17), and He’s "not willing that any should perish" (2 Peter 3:9). Run to Jesus; the warning is the measure of how much He wants you safe.',
      scholar: 'Hold John 1:14 as the hermeneutic — grace and truth are co-original, not in tension. Note the dominical density of judgment language (Matthew, Mark, Luke all preserve it) against the soteriological frame of John 3:17-18. On the nature of final judgment, see the evenhanded views below; the material commits to the reality of judgment and the held-out hope while leaving the disputed mechanism Word-first and humble.',
    },
    views: [
      {
        name: 'Eternal conscious torment',
        summary: 'The historic majority view: the lost experience unending conscious punishment.',
        scriptures: ['Matthew 25:41-46', 'Mark 9:43-48', 'Luke 16:19-31', 'Revelation 20:15'],
      },
      {
        name: 'Conditional immortality / annihilation',
        summary: 'A minority view across history: the lost finally perish — destroyed rather than tormented forever — taking "perish," "death," and "destroy soul and body" (Matthew 10:28; John 3:16) at full weight.',
        scriptures: ['Matthew 10:28', 'John 3:16', 'Romans 6:23'],
      },
      {
        name: 'A wider hope (held by some)',
        summary: 'Some Christians have hoped for a broader final mercy. Scripture’s warnings are too serious to presume upon, so the material does not teach this as settled — it notes it honestly and urges everyone to the certain refuge: Christ.',
        scriptures: ['2 Peter 3:9', 'Ezekiel 33:11'],
      },
    ],
    textNote: 'On the SHAPE of final judgment, faithful believers differ. The material teaches what Scripture clearly holds — judgment is real, Christ is the certain refuge, and the call is to repent and believe — and presents the main views fairly rather than imposing one, letting the Word and the Spirit lead. A local church can plug in its own teaching here.',
    verses: [
      v('John 1:14', 'Full of grace and truth — the hermeneutic for holding both together.', 'anchor', ['spiritual-module', 'pulpit']),
      v('Matthew 7:13-14', 'The narrow way that leads to life vs the broad way to destruction.', 'truth'),
      v('Luke 13:3', 'Except ye repent, ye shall all likewise perish — the call to repentance.', 'warning'),
      v('Romans 6:23', 'The wages of sin is death; the gift of God is eternal life — truth and grace in one verse.', 'truth'),
      v('John 3:36', 'He that believes has life; he that believes not — the wrath abides. Warning and hope.', 'warning'),
      v('Matthew 25:41-46', 'The Sheep and the Goats — everlasting punishment and life eternal.', 'warning'),
      v('Matthew 10:28', 'Fear Him able to destroy soul and body — the soul’s true stakes.', 'warning'),
      v('Mark 9:43-48', 'Better to enter life maimed than to be cast into hell — Jesus’ own stark warning.', 'warning'),
      v('Luke 16:19-31', 'The rich man and Lazarus — a fixed gulf, a sober warning to the living.', 'warning'),
      v('Revelation 20:15', 'Not found in the book of life — cast into the lake of fire.', 'warning'),
      v('Revelation 21:8', 'The second death — named plainly.', 'warning'),
      v('John 3:17', 'Sent NOT to condemn but to save — the warning’s loving frame.', 'hope'),
      v('John 3:18', 'He that believes is not condemned — the way out is belief.', 'hope'),
      v('2 Peter 3:9', 'Not willing that any should perish — His patient heart.', 'hope'),
      v('Ezekiel 33:11', 'No pleasure in the death of the wicked — "turn ye, turn ye." His oath of mercy.', 'hope'),
      v('John 8:10-11', 'Neither do I condemn thee; go and sin no more — truth and grace, no condemnation.', 'hope'),
      v('Romans 8:1', 'No condemnation to those in Christ — the governing tone for every hard truth.', 'promise'),
    ],
    tests: {
      questions: [
        { q: 'John 1:14 — Jesus came full of…', options: ['Grace only', 'Truth only', 'Grace AND truth'], answer: 2, explain: 'The Word was made flesh, full of grace AND truth (John 1:14) — never one at the other’s expense.', ref: 'John 1:14' },
        { q: 'John 3:17 — why did God send the Son?', options: ['To condemn the world', 'That the world might be saved through Him', 'To judge immediately'], answer: 1, explain: 'Not to condemn but to save (John 3:17) — the loving frame around every warning.', ref: 'John 3:17' },
        { q: 'Ezekiel 33:11 — what does God say about the death of the wicked?', options: ['He delights in it', 'He has no pleasure in it; turn and live', 'It does not matter'], answer: 1, explain: 'No pleasure in their death — "turn ye, turn ye… for why will ye die?" (Ezekiel 33:11).', ref: 'Ezekiel 33:11' },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'eternal-peace',
    title: 'Eternal Peace',
    subtitle: 'The peace the world cannot give',
    blurb: 'My peace I give you, not as the world gives (John 14:27). Peace that passes understanding guards heart and mind (Philippians 4:6-7). Peace with God through Christ (Romans 5:1). A rest that remains (Hebrews 4:9-11), and a day with no more tears (Revelation 21:4).',
    surfaces: ['spiritual-module', 'study', 'engagement'],
    interests: ['peace', 'growth'],
    lens: {
      perspective: 'Yahweh offers a peace that does not depend on circumstances — "not as the world giveth" (John 14:27); He sees rest where we see only storm.',
      heart: 'He means to settle your heart: "let not your heart be troubled, neither let it be afraid" (John 14:27) — His peace is a gift, freely given.',
      love: 'His love is the source of the peace: reconciled by the cross, "we have peace with God" (Romans 5:1) — the war is over because He ended it.',
    },
    soul: 'This peace is the soul’s anchor now and its eternal home forever — a rest that remains (Hebrews 4:9) and a city where He wipes away every tear (Revelation 21:4).',
    depths: {
      essential: 'Jesus gives a peace the world can’t give (John 14:27). Bring your worries to God and His peace guards your heart and mind (Philippians 4:6-7). In Him you have peace even in trouble (John 16:33), and forever there will be no more tears (Revelation 21:4).',
      standard: 'The peace Scripture offers is not the absence of trouble but a gift that holds in the middle of it. "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid" (John 14:27). It comes through prayer and guards the inner person: "the peace of God, which passeth all understanding, shall keep your hearts and minds" (Philippians 4:6-7), and rests on a mind fixed on Him: "Thou wilt keep him in perfect peace, whose mind is stayed on thee" (Isaiah 26:3). At root it is reconciliation: "being justified by faith, we have peace with God through our Lord Jesus Christ" (Romans 5:1). Jesus is honest that trouble will come and still says peace is possible: "In the world ye shall have tribulation: but be of good cheer; I have overcome the world" (John 16:33). And it points to an eternal rest — "there remaineth therefore a rest to the people of God" (Hebrews 4:9-11) — culminating where "God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither… pain" (Revelation 21:4).',
      deep: 'On the night before His crucifixion — about as un-peaceful a moment as a life can hold — Jesus gave His friends peace: "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid" (John 14:27). The qualifier is everything: not as the world gives. The world’s peace is the temporary absence of problems; His peace is a settledness underneath the problems, available while they rage.\n\nThe doorway to it is prayer, and its work is to guard: "be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus" (Philippians 4:6-7). It rests on where the mind is fixed: "Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee" (Isaiah 26:3). But its deepest root is not a technique — it is a relationship made right: "Therefore being justified by faith, we have peace with God through our Lord Jesus Christ" (Romans 5:1). The war is over; that is why the heart can rest.\n\nJesus never pretends the road is smooth: "In the world ye shall have tribulation" — and in the same breath, "but be of good cheer; I have overcome the world" (John 16:33). The peace holds in the hard place because the One who gives it has already won. And it is finally eternal: "There remaineth therefore a rest to the people of God" (Hebrews 4:9-11), a Sabbath rest we labor to enter by faith — opening at last onto the scene where "God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away" (Revelation 21:4). His peace begins now and never ends.',
    },
    levels: {
      child: 'Jesus gives a special peace that helps your heart feel calm and safe, even when things are hard (John 14:27). And one day, with Him, there will be no more crying or hurt at all — He will wipe every tear away (Revelation 21:4).',
      'new-believer': 'You can have real peace even when life is stressful — not because the problems vanish, but because Jesus is with you and has already overcome the world (John 16:33). Pray instead of panicking, and His peace guards your heart (Philippians 4:6-7). It starts now and lasts forever.',
    },
    verses: [
      v('John 14:27', 'My peace I give you, not as the world gives — let not your heart be troubled.', 'anchor', ['spiritual-module', 'engagement']),
      v('Philippians 4:6-7', 'Peace that passes understanding guards heart and mind.', 'promise', ['spiritual-module']),
      v('Isaiah 26:3', 'Perfect peace to the mind stayed on Him.', 'promise'),
      v('Romans 5:1', 'Justified by faith, we have peace with God — the root is reconciliation.', 'promise'),
      v('John 16:33', 'In Me, peace; in the world, tribulation — but be of good cheer, I have overcome.', 'promise'),
      v('Hebrews 4:9-11', 'There remains a rest for the people of God — the eternal Sabbath rest.', 'hope'),
      v('Revelation 21:4', 'No more tears, death, or pain — eternal peace, the former things passed away.', 'hope'),
    ],
    tests: {
      questions: [
        { q: 'John 14:27 — how does Jesus give peace?', options: ['As the world gives', 'Not as the world gives', 'Only when life is easy'], answer: 1, explain: 'My peace I give you — not as the world gives (John 14:27).', ref: 'John 14:27' },
        { q: 'Revelation 21:4 — what will be no more?', options: ['Work', 'Tears, death, sorrow, and pain', 'Worship'], answer: 1, explain: 'God wipes away all tears; no more death, sorrow, crying, or pain (Revelation 21:4).', ref: 'Revelation 21:4' },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'suffering-for-him',
    title: 'Suffering for Him',
    subtitle: 'He first suffered because of us',
    blurb: 'Called to follow His steps in suffering (1 Peter 2:21); blessed when persecuted for righteousness (Matthew 5:10-12); suffer with Him, glorified together (Romans 8:17-18). And the ground of it all: He suffered BECAUSE OF US — wounded for our transgressions (Isaiah 53:5), dying while we were yet sinners (Romans 5:8).',
    surfaces: ['spiritual-module', 'study'],
    interests: ['suffering', 'growth'],
    lens: {
      perspective: 'Yahweh does not see righteous suffering as meaningless or as His absence — He counts it fellowship with His Son and a seed of coming glory (Romans 8:17-18).',
      heart: 'His heart is proven first toward us: He let His Son be "wounded for our transgressions" (Isaiah 53:5) — our suffering-for-Him only ever answers His suffering-for-us.',
      love: '"Greater love hath no man than this, that a man lay down his life for his friends" (John 15:13) — He did exactly that, "while we were yet sinners" (Romans 5:8).',
    },
    soul: 'Suffering for righteousness keeps a soul faithful to the end and witnesses to other souls; and the cross that grounds it — "by whose stripes ye were healed" (1 Peter 2:24) — is the soul’s salvation itself.',
    depths: {
      essential: 'Christ suffered for us, leaving us an example (1 Peter 2:21). Don’t be surprised by hard trials — you’re sharing in His sufferings (1 Peter 4:12-13), and present pain isn’t worth comparing to coming glory (Romans 8:18). Why is it bearable? Because He suffered first BECAUSE OF US — wounded for our transgressions (Isaiah 53:5), dying for us while we were still sinners (Romans 5:8).',
      standard: 'Scripture does not promise the godly an easy road — "all that will live godly in Christ Jesus shall suffer persecution" (2 Timothy 3:12) — but it gives that suffering meaning. We are "called" to it, "because Christ also suffered for us, leaving us an example, that ye should follow his steps" (1 Peter 2:21); we are not to "think it strange concerning the fiery trial," but to "rejoice, inasmuch as ye are partakers of Christ’s sufferings" (1 Peter 4:12-13). Jesus calls the persecuted blessed (Matthew 5:10-12); the apostles "rejoiced that they were counted worthy to suffer shame for his name" (Acts 5:41). And it is purposeful: "if so be that we suffer with him, that we may be also glorified together. For… the sufferings of this present time are not worthy to be compared with the glory which shall be revealed" (Romans 8:17-18). All of this rests on the prior, deeper truth — He suffered first, and for us: "he was wounded for our transgressions… and with his stripes we are healed" (Isaiah 53:5); "while we were yet sinners, Christ died for us" (Romans 5:8); "who his own self bare our sins in his own body on the tree" (1 Peter 2:24); "made him to be sin for us, who knew no sin" (2 Corinthians 5:21). Our cross only ever follows His.',
      deep: 'Suffering for Christ is never glorified for its own sake in Scripture, and it is never treated as proof that God has left. It is given a place and a purpose. First, it is expected — Jesus did not hide it: "all that will live godly in Christ Jesus shall suffer persecution" (2 Timothy 3:12), and the persecuted are pronounced "blessed… for great is your reward in heaven" (Matthew 5:10-12). Second, it is fellowship with Him: "Christ also suffered for us, leaving us an example, that ye should follow his steps" (1 Peter 2:21); so when the fiery trial comes, "think it not strange… but rejoice, inasmuch as ye are partakers of Christ’s sufferings" (1 Peter 4:12-13), even committing "the keeping of their souls to him… as unto a faithful Creator" (1 Peter 4:19). Paul’s ambition was startling: "That I may know him, and the power of his resurrection, and the fellowship of his sufferings" (Philippians 3:10), counting it a gift — "unto you it is given… not only to believe on him, but also to suffer for his sake" (Philippians 1:29). The apostles literally left a beating "rejoicing that they were counted worthy to suffer shame for his name" (Acts 5:41).\n\nThird, and decisively, it is seed, not waste: "if so be that we suffer with him, that we may be also glorified together. For I reckon that the sufferings of this present time are not worthy to be compared with the glory which shall be revealed in us" (Romans 8:17-18). The third-dimensional suffering of the present is the doorway to a weight of glory that will dwarf it.\n\nBut none of this stands on its own. It all answers something He did first. The reason a believer can suffer for Him is that He already suffered — because of us, for us. "He was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed" (Isaiah 53:5). "But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us" (Romans 5:8). "Who his own self bare our sins in his own body on the tree, that we, being dead to sins, should live unto righteousness: by whose stripes ye were healed" (1 Peter 2:24). "For he hath made him to be sin for us, who knew no sin; that we might be made the righteousness of God in him" (2 Corinthians 5:21). "Greater love hath no man than this, that a man lay down his life for his friends" (John 15:13). His suffering was on our account, out of love — so our walking through suffering for righteousness is never meaningless; it is the answering love of a friend following the One who first laid down His life. We walk through the third-dimensional cost and are healed and, one day, glorified together with Him.',
    },
    levels: {
      child: 'Sometimes doing the right thing and loving Jesus can be hard, and people might be unkind about it. Jesus understands — He was hurt for us first, because He loves us so much (Isaiah 53:5). He is always with you, and He turns hard things into something beautiful one day.',
      'new-believer': 'Following Jesus can cost something, and the Bible is honest about that (2 Timothy 3:12). But your hard times aren’t meaningless — they connect you to Him, and the glory ahead is far greater than the pain now (Romans 8:18). And remember: He suffered for YOU first, while you were still far off (Romans 5:8). His love came first.',
    },
    verses: [
      v('Isaiah 53:5', 'Wounded for OUR transgressions; by His stripes we are healed — He suffered because of us.', 'anchor'),
      v('Romans 5:8', 'While we were yet sinners, Christ died for us — love that came first.', 'love'),
      v('1 Peter 2:24', 'He bore our sins in His own body on the tree — by His stripes ye were healed.', 'love'),
      v('2 Corinthians 5:21', 'Made Him to be sin for us, that we might be made the righteousness of God.', 'truth'),
      v('John 15:13', 'Greater love — to lay down one’s life for friends; He did.', 'love'),
      v('1 Peter 2:21', 'Christ suffered for us, leaving an example to follow His steps.', 'truth'),
      v('1 Peter 3:14', 'Suffer for righteousness’ sake — happy are ye; do not fear their terror.', 'promise'),
      v('1 Peter 4:12-13', 'Don’t think the fiery trial strange — rejoice to partake of Christ’s sufferings.', 'truth'),
      v('1 Peter 4:19', 'Commit the keeping of your souls to Him, a faithful Creator, in well-doing.', 'hope'),
      v('Romans 8:17', 'Heirs with Christ — if we suffer with Him, we are glorified together.', 'promise'),
      v('Romans 8:18', 'Present sufferings not worthy to be compared with the coming glory.', 'promise'),
      v('Philippians 1:29', 'Given to you not only to believe but to suffer for His sake — a gift.', 'truth'),
      v('Philippians 3:10', 'That I may know Him… and the fellowship of His sufferings.', 'truth'),
      v('2 Timothy 3:12', 'All who live godly in Christ Jesus shall suffer persecution — expected, not strange.', 'truth'),
      v('Matthew 5:10-12', 'Blessed are the persecuted for righteousness — great is your reward.', 'promise'),
      v('Acts 5:41', 'They rejoiced to be counted worthy to suffer shame for His name.', 'truth'),
      v('James 1:2-3', 'Count it all joy in trials — the testing of faith works patience.', 'truth'),
    ],
    tests: {
      questions: [
        { q: 'Isaiah 53:5 — for whose transgressions was He wounded?', options: ['His own', 'Ours', 'No one’s'], answer: 1, explain: 'Wounded for OUR transgressions; by His stripes we are healed (Isaiah 53:5).', ref: 'Isaiah 53:5' },
        { q: 'Romans 8:18 — how do present sufferings compare to coming glory?', options: ['They are equal', 'Not worthy to be compared', 'They are worse'], answer: 1, explain: 'Present sufferings are not worthy to be compared with the glory to be revealed (Romans 8:18).', ref: 'Romans 8:18' },
        { q: 'Romans 5:8 — when did Christ die for us?', options: ['After we earned it', 'While we were yet sinners', 'Only for the righteous'], answer: 1, explain: 'While we were yet sinners, Christ died for us (Romans 5:8) — His love came first.', ref: 'Romans 5:8' },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'the-godhead',
    title: 'The Godhead',
    subtitle: 'I AM THAT I AM — the eternal, self-existent One',
    blurb: 'Yahweh, the self-existent I AM (Exodus 3:14) — the same yesterday, today, and forever (Hebrews 13:8); Alpha and Omega, which is and was and is to come (Revelation 1:8). All-knowing, everywhere-present, all-powerful. Jesus said, "Before Abraham was, I AM" (John 8:58). The fullness of the Godhead dwells in Him bodily (Colossians 2:9). Handled with care and evenhandedness — present, don’t divide.',
    surfaces: ['spiritual-module', 'pulpit', 'study'],
    interests: ['godhead', 'word'],
    lens: {
      perspective: 'Yahweh sees from outside time — "declaring the end from the beginning" (Isaiah 46:10), the One "which is, and which was, and which is to come" (Revelation 1:8); His view is total because He is eternal.',
      heart: 'The infinite, all-knowing God is not distant — "in him we live, and move, and have our being" (Acts 17:27-28); the great I AM draws near.',
      love: 'The unchanging One is unchanging in love: "I am the LORD, I change not; therefore ye sons of Jacob are not consumed" (Malachi 3:6) — His immutability is our mercy.',
    },
    soul: 'To know the eternal I AM is the soul’s anchor and its eternal life — "this is life eternal, that they might know thee, the only true God." The One who never changes is the One the soul can rest in forever.',
    depths: {
      essential: 'God revealed His name as "I AM THAT I AM" (Exodus 3:14) — self-existent, eternal, unchanging (Malachi 3:6; Hebrews 13:8). He is all-knowing (Psalm 139:1-4), everywhere (Psalm 139:7-10), all-powerful (Jeremiah 32:17; Matthew 19:26). Jesus claimed this very name: "Before Abraham was, I AM" (John 8:58), and the fullness of the Godhead dwells in Him (Colossians 2:9).',
      standard: 'At the burning bush, God gave His name: "I AM THAT I AM" (Exodus 3:14) — the self-existent One who simply IS, dependent on nothing, "from everlasting to everlasting… God" (Psalm 90:2). He does not change — "I am the LORD, I change not" (Malachi 3:6) — and so He is "the same yesterday, and to day, and for ever" (Hebrews 13:8), "Alpha and Omega… which is, and which was, and which is to come, the Almighty" (Revelation 1:8; 22:13). This eternal One is omniscient — "thou hast searched me, and known me… thou understandest my thought afar off" (Psalm 139:1-4) — omnipresent — "whither shall I flee from thy presence?" (Psalm 139:7-10; Jeremiah 23:23-24) — and omnipotent — "there is nothing too hard for thee" (Jeremiah 32:17,27; Matthew 19:26; Revelation 19:6). Astonishingly, Jesus applied the I AM to Himself: "Before Abraham was, I am" (John 8:58); "I and my Father are one" (John 10:30); "he that hath seen me hath seen the Father" (John 14:9-11); and "in him dwelleth all the fulness of the Godhead bodily" (Colossians 2:9). On HOW the one God is Father, Son, and Holy Spirit (Matthew 28:19; 2 Corinthians 13:14), faithful believers describe it differently — see the views below — but the eternal, self-existent, almighty nature of the I AM is shared ground.',
      deep: 'When Moses asked God His name, the answer was not a label but a revelation of being: "I AM THAT I AM" (Exodus 3:14). God is the self-existent One — un-caused, un-derived, depending on nothing, the ground of all that exists. He is "from everlasting to everlasting" (Psalm 90:2), "before all things, and by him all things consist" (Colossians 1:17). And He does not change: "For I am the LORD, I change not; therefore ye sons of Jacob are not consumed" (Malachi 3:6) — His constancy is precisely why we are not destroyed. So He is the same across all time: "Jesus Christ the same yesterday, and to day, and for ever" (Hebrews 13:8); "I am Alpha and Omega, the beginning and the ending, saith the Lord, which is, and which was, and which is to come, the Almighty" (Revelation 1:8; cf. 1:4; 4:8; 22:13; Isaiah 44:6). Past, present, and future, He simply IS.\n\nThis eternal I AM has the attributes only an infinite God can have. He is omniscient — all-knowing: "O LORD, thou hast searched me, and known me… thou understandest my thought afar off… there is not a word in my tongue, but, lo, O LORD, thou knowest it altogether" (Psalm 139:1-4); "God… knoweth all things" (1 John 3:20); "all things are naked and opened unto the eyes of him" (Hebrews 4:13); He declares "the end from the beginning" (Isaiah 46:9-10). He is omnipresent — everywhere at once: "Whither shall I go from thy spirit? or whither shall I flee from thy presence?" (Psalm 139:7-10); "Do not I fill heaven and earth? saith the LORD" (Jeremiah 23:23-24); "in him we live, and move, and have our being" (Acts 17:27-28). He is omnipotent — all-powerful: "I am the Almighty God" (Genesis 17:1, El Shaddai); "there is nothing too hard for thee… is there any thing too hard for me?" (Jeremiah 32:17,27); "with God all things are possible" (Matthew 19:26); "the Lord God omnipotent reigneth" (Revelation 19:6).\n\nThe stunning New Testament claim is that Jesus stepped into the I AM. "Before Abraham was, I am" (John 8:58) — His hearers picked up stones, understanding exactly the name He had taken. "I and my Father are one" (John 10:30); "he that hath seen me hath seen the Father… I am in the Father, and the Father in me" (John 14:9-11); "in him dwelleth all the fulness of the Godhead bodily" (Colossians 2:9). Isaiah had foreseen a child who is also "The mighty God, The everlasting Father" (Isaiah 9:6).\n\nHere we must walk carefully and humbly, because this is a place the Body has too often divided. Scripture is emphatic that God is ONE — "Hear, O Israel: The LORD our God is one LORD" (Deuteronomy 6:4); "I am the first, and I am the last; and beside me there is no God" (Isaiah 44:6). And it speaks of Father, Son, and Holy Spirit together — "baptizing them in the name of the Father, and of the Son, and of the Holy Ghost" (Matthew 28:19); "The grace of the Lord Jesus Christ, and the love of God, and the communion of the Holy Ghost" (2 Corinthians 13:14); even "Let us make man in our image" (Genesis 1:26). HOW the one God is Father, Son, and Spirit is described differently by faithful, Bible-loving believers (see the views below). This material presents the main views fairly and does not impose one; it holds firmly to what Scripture clearly teaches — God is one, eternal, self-existent, almighty, and fully revealed in the Son — and lets the Word and the Spirit lead.',
    },
    levels: {
      child: 'God’s special name means "I AM" — He has always been alive and always will be, and He never changes (Hebrews 13:8). He knows everything, He is everywhere, and He can do anything — and He loves you. When we see Jesus, we see what God is like (John 14:9).',
      'new-believer': 'God told Moses His name is "I AM" — the One who always exists and never changes (Exodus 3:14; Malachi 3:6). He knows all, is everywhere, and can do anything. Amazingly, Jesus took that same name — "Before Abraham was, I AM" (John 8:58) — and shows us the Father (John 14:9). Christians describe HOW God is Father, Son, and Spirit a little differently; hold the clear parts firmly and stay humble and kind about the rest.',
      scholar: 'Note ehyeh asher ehyeh (Exodus 3:14) and the LXX ἐγώ εἰμι echoed in John’s seven "I am" sayings and absolutely in John 8:58. Hold Deuteronomy 6:4 (the Shema, echad) with the triadic texts (Matthew 28:19; 2 Corinthians 13:14). The shared confession is the one, eternal, self-existent, almighty God revealed in the Son; the disputed locus is the immanent relations — see the views and the textual note on 1 John 5:7.',
    },
    views: [
      {
        name: 'Trinitarian',
        summary: 'One God who eternally exists as three co-equal, co-eternal Persons — Father, Son, and Holy Spirit — one in essence, distinct in person. Grounds the threeness in the baptismal name and the apostolic benediction.',
        scriptures: ['Matthew 28:19-20', '2 Corinthians 13:14', 'John 1:1', 'Genesis 1:26'],
      },
      {
        name: 'Oneness / Apostolic',
        summary: 'One God who is absolutely one, revealed and manifest as Father (in creation), Son (in redemption), and Holy Spirit (in regeneration) — emphasizing the indivisible oneness and the fullness of God in Jesus.',
        scriptures: ['Deuteronomy 6:4', 'John 10:30', 'Colossians 2:9', 'Isaiah 9:6'],
      },
    ],
    textNote: 'HONESTY ON THE TEXT: 1 John 5:7 in its longer "three that bear record in heaven" form (the Comma Johanneum) is absent from the earliest Greek manuscripts and is regarded by textual scholars as a later addition. The doctrine of God’s triune/one nature does NOT rest on this verse — it is taught across many clear passages — so the material flags 1 John 5:7 honestly rather than leaning on a disputed reading. On the SHAPE of the Godhead (Trinitarian vs Oneness/Apostolic), faithful believers differ; this material presents the main views fairly, holds the shared ground (one eternal almighty God revealed in the Son), and lets the Word and Spirit lead. A local church can plug in its own teaching here.',
    verses: [
      v('Exodus 3:14', 'I AM THAT I AM — the self-existent Name; the heart of the theme.', 'anchor', ['spiritual-module', 'pulpit']),
      v('John 8:58', 'Before Abraham was, I AM — Jesus takes the eternal Name.', 'anchor', ['spiritual-module', 'pulpit']),
      v('Deuteronomy 6:4', 'The LORD our God is one LORD — the Shema; God is one (shared ground).', 'truth'),
      v('Isaiah 44:6', 'I am the first and the last; beside Me there is no God.', 'truth'),
      v('Revelation 1:8', 'Alpha and Omega — which is, and was, and is to come, the Almighty.', 'truth'),
      v('Revelation 1:4', 'From Him which is, and which was, and which is to come — eternity in worship.', 'truth'),
      v('Revelation 4:8', 'Holy, holy, holy — which was, and is, and is to come.', 'truth'),
      v('Revelation 22:13', 'Alpha and Omega, the first and the last, the beginning and the end.', 'truth'),
      v('Hebrews 13:8', 'The same yesterday, today, and forever — past, present, future.', 'truth'),
      v('Malachi 3:6', 'I am the LORD, I change not — immutability as mercy.', 'promise'),
      v('Psalm 90:2', 'From everlasting to everlasting, Thou art God — self-existent eternity.', 'truth'),
      v('Colossians 1:17', 'Before all things; in Him all things consist.', 'truth'),
      v('John 1:1', 'In the beginning was the Word, and the Word was God.', 'truth'),
      v('John 10:30', 'I and My Father are one.', 'truth'),
      v('John 14:9-11', 'He that hath seen Me hath seen the Father — the Son reveals the Father.', 'truth'),
      v('Colossians 2:9', 'In Him dwells all the fullness of the Godhead bodily.', 'truth'),
      v('Genesis 1:26', 'Let US make man in our image — the plural of the divine counsel.', 'truth'),
      v('2 Corinthians 13:14', 'Grace of the Son, love of God, communion of the Holy Ghost — the triadic blessing.', 'truth'),
      v('Isaiah 9:6', 'A child born, a Son given — the mighty God, the everlasting Father.', 'truth'),
      v('Matthew 28:19-20', 'Baptizing in the name of the Father, and of the Son, and of the Holy Ghost.', 'truth'),
      v('Psalm 139:1-4', 'Omniscient — He has searched and known us; knows our thought afar off.', 'truth'),
      v('1 John 3:20', 'God is greater than our heart and knows all things — omniscience as comfort.', 'truth'),
      v('Isaiah 46:9-10', 'Declaring the end from the beginning — He knows and ordains the future.', 'truth'),
      v('Hebrews 4:13', 'All things naked and open before Him — nothing hidden from His sight.', 'truth'),
      v('Psalm 139:7-10', 'Omnipresent — nowhere is beyond His presence.', 'truth'),
      v('Jeremiah 23:23-24', 'Do I not fill heaven and earth? — God near and far, omnipresent.', 'truth'),
      v('Acts 17:27-28', 'In Him we live and move and have our being — He is not far from any of us.', 'truth'),
      v('Genesis 17:1', 'I am the Almighty God — El Shaddai; omnipotence named.', 'truth'),
      v('Jeremiah 32:17', 'Nothing is too hard for Him who made heaven and earth.', 'truth'),
      v('Jeremiah 32:27', 'Is there anything too hard for Me? — the rhetorical force of omnipotence.', 'truth'),
      v('Matthew 19:26', 'With God all things are possible.', 'promise'),
      v('Revelation 19:6', 'The Lord God omnipotent reigneth.', 'truth'),
      v('1 John 5:7', 'The “three that bear record” — flagged honestly as a later textual variant (see note).', 'truth'),
    ],
    tests: {
      questions: [
        { q: 'Exodus 3:14 — what name did God give Moses?', options: ['The Almighty', 'I AM THAT I AM', 'The Eternal Judge'], answer: 1, explain: 'God said, "I AM THAT I AM" — the self-existent One (Exodus 3:14).', ref: 'Exodus 3:14' },
        { q: 'John 8:58 — what did Jesus say about Himself?', options: ['I will be', 'Before Abraham was, I AM', 'I am a prophet'], answer: 1, explain: 'Before Abraham was, I AM — taking the eternal Name (John 8:58).', ref: 'John 8:58' },
        { q: 'Malachi 3:6 — what does God say about changing?', options: ['I change with the times', 'I am the LORD, I change not', 'I sometimes change'], answer: 1, explain: 'I am the LORD, I change not (Malachi 3:6) — His immutability.', ref: 'Malachi 3:6' },
        { q: 'How does this material handle Trinitarian vs Oneness views?', options: ['Imposes one as correct', 'Presents the main views fairly, holding the shared ground, Word-first', 'Avoids the topic'], answer: 1, explain: 'Evenhanded: present the main biblical views fairly, hold what is shared (one eternal God revealed in the Son), let the Word + Spirit lead.', ref: 'Deuteronomy 6:4' },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'souls',
    title: 'Souls — the Father’s Business',
    subtitle: 'The telos: souls home with the Father',
    blurb: 'The aim of everything: souls reaching their eternal home with the Father (Luke 2:49). The Son came to seek and save the lost (Luke 19:10); God is not willing any should perish (2 Peter 3:9). He that winneth souls is wise (Proverbs 11:30). Every theme finally points here.',
    surfaces: ['spiritual-module', 'pulpit', 'engagement', 'content-engine'],
    interests: ['evangelism', 'salvation'],
    lens: {
      perspective: 'Yahweh sees one soul the way a shepherd sees one lost sheep — worth leaving the ninety-nine to seek (Luke 19:10); every person is an eternal soul to Him, never a statistic.',
      heart: 'His heart is named with an oath: "I have no pleasure in the death of the wicked… turn ye, turn ye" (Ezekiel 33:11); "not willing that any should perish" (2 Peter 3:9).',
      love: 'Love is the whole engine: "God so loved the world, that he gave his only begotten Son" (John 3:16) — and that love sends us to one another (James 5:19-20).',
    },
    soul: 'This IS the soul — its rescue is the point of the platform, the Module, and every lesson. Truth warns and love draws, and both exist so that souls come home.',
    depths: {
      essential: 'Everything aims at this: souls coming home to the Father (Luke 2:49). Jesus came to seek and save the lost (Luke 19:10); God wants none to perish (2 Peter 3:9). Turning one person back saves a soul (James 5:19-20); winning souls is wisdom (Proverbs 11:30).',
      standard: 'The whole library has one final aim, and Jesus named it at twelve years old: "I must be about my Father’s business" (Luke 2:49) — the rescue of souls. He defined His mission the same way: "the Son of man is come to seek and to save that which was lost" (Luke 19:10). God’s posture toward the lost is longing, not indifference: He is "not willing that any should perish, but that all should come to repentance" (2 Peter 3:9), and swears, "I have no pleasure in the death of the wicked… turn ye, turn ye" (Ezekiel 33:11; 18:23). The value of a single soul outweighs the world’s gain and even bodily death (Matthew 10:28). So we are sent to one another: "he which converteth the sinner from the error of his way shall save a soul from death" (James 5:19-20); "he that winneth souls is wise" (Proverbs 11:30). And the method is flexible while the substance is fixed: "I am made all things to all men, that I might by all means save some" (1 Corinthians 9:19-22) — staging adapts; the gospel does not. This is why both truth and love run through every theme: truth warns the soul, love draws it, and both are for the soul’s sake.',
      deep: 'Trace any theme in this library far enough and it arrives here: the soul, and its eternal home with the Father. The aim was set at the beginning, in the first recorded words of Jesus — a twelve-year-old in the temple: "wist ye not that I must be about my Father’s business?" (Luke 2:49). And He never wandered from it: "For the Son of man is come to seek and to save that which was lost" (Luke 19:10). The seeking is the point.\n\nGod’s own heart toward the lost is not cool tolerance but ache. He puts it under oath: "As I live, saith the Lord GOD, I have no pleasure in the death of the wicked; but that the wicked turn from his way and live: turn ye, turn ye from your evil ways; for why will ye die?" (Ezekiel 33:11; cf. 18:23). Peter explains the apparent delay of judgment by the same heart: "The Lord is… longsuffering to us-ward, not willing that any should perish, but that all should come to repentance" (2 Peter 3:9). The reason a single soul matters this much is its eternal weight: better to lose everything than to "destroy both soul and body in hell" (Matthew 10:28) — the soul outlasts the world.\n\nThat is why this material holds grace and truth together so insistently. Truth tells a soul the truth about its danger; love runs to carry it to safety; both serve the one end. And the work is handed to us: "he which converteth the sinner from the error of his way shall save a soul from death, and shall hide a multitude of sins" (James 5:19-20), for "he that winneth souls is wise" (Proverbs 11:30). The method may bend to reach anyone — "I am made all things to all men, that I might by all means save some" (1 Corinthians 9:19-22) — but the substance never bends. Staging is flexible; the gospel is not. So order your own life, and this whole library, around the Father’s business — because in the end, it is all about souls coming home.',
    },
    levels: {
      child: 'The most important thing of all is that people come home to God and live with Him forever. Jesus came to find people who were lost — like a shepherd looking for one little lost sheep (Luke 19:10). God loves every single person and wants them all to come home. You get to help by sharing His love.',
      'new-believer': 'Everything in the faith points to one thing: souls coming home to God. Jesus came "to seek and to save that which was lost" (Luke 19:10), and God wants no one to perish (2 Peter 3:9). Your own soul is safe in Him — and now you get to help others find Him too. That’s the Father’s business, and it’s the point of it all.',
    },
    verses: [
      v('Luke 2:49', 'The Father’s business — the first words of Jesus name the aim: souls.', 'anchor', ['spiritual-module', 'pulpit']),
      v('Luke 19:10', 'Come to seek and to save the lost — the mission, stated.', 'anchor', ['spiritual-module', 'engagement']),
      v('John 3:16', 'God so loved the world that He gave His Son — the love that drives the rescue.', 'love', ['spiritual-module', 'pulpit']),
      v('John 3:17', 'Sent to save, not condemn — the posture toward the soul.', 'hope'),
      v('2 Peter 3:9', 'Not willing that any should perish — His patient, seeking heart.', 'hope'),
      v('Ezekiel 18:23', 'No pleasure in the death of the wicked — turn and live.', 'hope'),
      v('Ezekiel 33:11', 'Turn ye, turn ye — His oath of mercy over the lost.', 'hope'),
      v('Matthew 10:28', 'The soul outweighs the body — the eternal stakes that order everything.', 'truth'),
      v('James 5:19-20', 'Turn a sinner back and save a soul from death — the work handed to us.', 'invitation'),
      v('Proverbs 11:30', 'He that winneth souls is wise — soul-winning as the highest wisdom.', 'truth'),
      v('1 Corinthians 9:19-22', 'All things to all men to save some — flexible staging, fixed substance.', 'truth', ['spiritual-module', 'content-engine']),
      v('Matthew 6:33', 'Seek first the Kingdom — order life around the Father’s business.', 'invitation'),
    ],
    tests: {
      questions: [
        { q: 'Luke 19:10 — why did the Son of man come?', options: ['To condemn', 'To seek and to save the lost', 'To rule nations'], answer: 1, explain: 'To seek and to save that which was lost (Luke 19:10) — the mission.', ref: 'Luke 19:10' },
        { q: '2 Peter 3:9 — what is God not willing should happen?', options: ['That anyone be blessed', 'That any should perish', 'That we wait'], answer: 1, explain: 'Not willing that any should perish, but all come to repentance (2 Peter 3:9).', ref: '2 Peter 3:9' },
        { q: '1 Corinthians 9:22 — Paul became all things to all men in order to…', options: ['Win arguments', 'By all means save some', 'Avoid conflict'], answer: 1, explain: 'All things to all men, that by all means he might save some (1 Corinthians 9:19-22) — staging flexes, the gospel does not.', ref: '1 Corinthians 9:19-22' },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'spiritual-growth',
    title: 'Spiritual Growth',
    subtitle: 'The arc — abide, add, grow, finish',
    blurb: 'Add to your faith (2 Peter 1:5-7). Grow in grace (2 Peter 3:18). Abide in the Vine (John 15:5). He who began a good work will finish it (Philippians 1:6) — until we all reach the fullness of Christ (Ephesians 4:13).',
    surfaces: ['spiritual-module', 'study'],
    interests: ['growth'],
    lens: {
      perspective: 'Yahweh sees growth as relationship, not performance — fruit comes from abiding in the Vine, not striving apart from Him (John 15:5).',
      heart: 'He commits to finishing you: "he which hath begun a good work in you will perform it" (Philippians 1:6) — your growth is His project.',
      love: 'His love is patient with the process — He grows fruit in seasons, never abandoning the half-grown; "grow in grace" is an invitation, not a demand (2 Peter 3:18).',
    },
    soul: 'Growth is a saved soul becoming whole — maturing "unto the measure of the stature of the fulness of Christ" (Ephesians 4:13) on its way home.',
    depths: {
      essential: 'Stay connected to Jesus, the Vine — apart from Him you can do nothing (John 15:5). Keep adding to your faith (2 Peter 1:5-7) and growing in grace (2 Peter 3:18). He who started the work in you will finish it (Philippians 1:6).',
      standard: 'Growth in the faith is both a command and a promise. The command: "add to your faith virtue; and to virtue knowledge… patience… godliness… brotherly kindness… charity" (2 Peter 1:5-7), and "grow in grace, and in the knowledge of our Lord and Saviour Jesus Christ" (2 Peter 3:18). The means is not striving but abiding: "I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing" (John 15:5). And the promise underwrites the whole process: "he which hath begun a good work in you will perform it until the day of Jesus Christ" (Philippians 1:6), with the destination set as full maturity — "till we all come… unto a perfect man, unto the measure of the stature of the fulness of Christ" (Ephesians 4:13). Even the fruit itself is grown, not forced — "the fruit of the Spirit is love, joy, peace…" (Galatians 5:22-23).',
      deep: 'The Christian life has a shape: it grows. It is not static decision but a living arc, and Scripture maps it. There is real effort to be made — "giving all diligence, add to your faith virtue; and to virtue knowledge; and to knowledge temperance; and to temperance patience; and to patience godliness; and to godliness brotherly kindness; and to brotherly kindness charity" (2 Peter 1:5-7) — a ladder of character climbed on purpose, summed up in "grow in grace, and in the knowledge of our Lord and Saviour Jesus Christ" (2 Peter 3:18).\n\nBut the engine of that growth is not willpower; it is union. "I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing" (John 15:5). Branches do not strain to produce fruit; they stay attached, and fruit comes. That is why the character listed in Galatians is called fruit — "the fruit of the Spirit is love, joy, peace, longsuffering…" (Galatians 5:22-23) — grown by the Spirit through abiding.\n\nAnd the whole process rests on a promise that takes the pressure off: "Being confident of this very thing, that he which hath begun a good work in you will perform it until the day of Jesus Christ" (Philippians 1:6). The God who started will finish. The destination is nothing less than Christlikeness in full: "till we all come in the unity of the faith, and of the knowledge of the Son of God, unto a perfect man, unto the measure of the stature of the fulness of Christ" (Ephesians 4:13). Abide, keep adding, and trust the One who is committed to completing you.',
    },
    verses: [
      v('2 Peter 1:5-7', 'Add to your faith virtue, knowledge… charity — the ladder of growth.', 'truth', ['spiritual-module', 'study']),
      v('2 Peter 3:18', 'Grow in grace and knowledge — growth as the standing command.', 'invitation'),
      v('John 15:5', 'Abide in the Vine — apart from Him, nothing; fruit comes from union.', 'anchor', ['spiritual-module', 'study']),
      v('Philippians 1:6', 'He who began a good work will finish it — confidence for the unfinished.', 'promise'),
      v('Ephesians 4:13', 'Until we reach the fullness of Christ — the destination of the whole arc.', 'promise'),
      v('Galatians 5:22-23', 'The fruit of the Spirit — grown by the Spirit through abiding.', 'truth', ['spiritual-module', 'study']),
    ],
    tests: {
      questions: [
        { q: 'John 15:5 — apart from the Vine we can do…', options: ['A little', 'Nothing', 'Most things'], answer: 1, explain: 'Without Me ye can do nothing (John 15:5) — growth is by abiding.', ref: 'John 15:5' },
        { q: 'Philippians 1:6 — who finishes the good work in you?', options: ['You do', 'God who began it', 'Your church'], answer: 1, explain: 'He who began a good work will perform it until the day of Christ (Philippians 1:6).', ref: 'Philippians 1:6' },
      ],
    },
  },
];

// =============================================================================
// Helpers — the reusable surface the Spiritual Module, Learn, and the content
// engine read from. All pure (no Date/Math.random), so they are tested directly.
// =============================================================================

// Normalize a reference for matching: trim, collapse spaces, fold "Psalms"→"Psalm".
export function normalizeRef(ref) {
  if (typeof ref !== 'string') return '';
  return ref.trim().replace(/\s+/g, ' ').replace(/^Psalms\b/i, 'Psalm');
}

// The verified KJV text for a reference, or null if not in the library. The key
// capability the rest of the app gains: a bare `scriptureRef` resolves to its
// real, public-domain verse text.
export function kjvText(ref) {
  const key = normalizeRef(ref);
  return Object.prototype.hasOwnProperty.call(KJV, key) ? KJV[key] : null;
}

export function hasVerse(ref) {
  return kjvText(ref) !== null;
}

// The verified World English Bible (modern English, public domain) text for a
// reference, or null. The modern-English companion to kjvText — same contract,
// same verbatim/never-reworded discipline (text fetched, see scripture-web.js).
export function webText(ref) {
  const key = normalizeRef(ref);
  return Object.prototype.hasOwnProperty.call(WEB, key) ? WEB[key] : null;
}

// Generic resolver across the editions we reproduce in full. One place every
// surface resolves base text from, so a new PD edition is added once, here.
// Unknown version → KJV (the always-present base). null if the ref isn't carried.
export function editionText(versionId, ref) {
  if (versionId === 'WEB') return webText(ref);
  return kjvText(ref);
}

export function allThemes() {
  return THEMES;
}

export function getTheme(themeId) {
  return THEMES.find((t) => t.id === themeId) || null;
}

// A flat list of every curated verse with text + theme + role + backs.
export function allVerses() {
  const out = [];
  for (const theme of THEMES) {
    for (const vv of theme.verses) {
      out.push({
        ref: vv.ref,
        kjv: kjvText(vv.ref),
        gloss: vv.gloss,
        role: vv.role || 'truth',
        backs: vv.backs || theme.surfaces,
        themeId: theme.id,
        themeTitle: theme.title,
      });
    }
  }
  return out;
}

// Every curated entry for a reference (a ref may live in more than one theme —
// that overlap is the cross-reference). [] if not curated.
export function findByRef(ref) {
  const key = normalizeRef(ref);
  return allVerses().filter((v2) => normalizeRef(v2.ref) === key);
}

export function versesForSurface(surfaceId) {
  return allVerses().filter((v2) => (v2.backs || []).includes(surfaceId));
}

// `edition` (2026-09-06): the reader's chosen public-domain edition. `kjv`
// stays on every verse (the study edition and the gates are built on it);
// `text` is what the page SHOWS and the reader SPEAKS — the WEB when chosen
// and carried for that verse, otherwise the KJV — and `edition` says which.
// The two are never mixed on one verse: a WEB miss falls back to the KJV and
// says so.
export function versesForTheme(themeId, edition = 'kjv') {
  const theme = getTheme(themeId);
  if (!theme) return [];
  const wantWeb = String(edition || '').toLowerCase() === 'web';
  return theme.verses.map((vv) => {
    const kjv = kjvText(vv.ref);
    const web = wantWeb ? webText(vv.ref) : null;
    return {
      ...vv, kjv, web, themeId, themeTitle: theme.title,
      text: web || kjv,
      edition: web ? 'web' : 'kjv',
    };
  });
}

// Cross-references for a reference: the OTHER verses that share a theme with it
// (excludes the verse itself). What the content engine calls to surface "related
// Scripture" beside a generated passage. Capped by `limit`.
export function crossRefsFor(ref, limit = 6) {
  const key = normalizeRef(ref);
  const themeIds = new Set(findByRef(ref).map((v2) => v2.themeId));
  if (!themeIds.size) return [];
  const seen = new Set([key]);
  const out = [];
  for (const v2 of allVerses()) {
    if (!themeIds.has(v2.themeId)) continue;
    const k = normalizeRef(v2.ref);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v2);
    if (out.length >= limit) break;
  }
  return out;
}

// Plain-text search across reference, theme, gloss, and the KJV text.
export function searchVerses(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  return allVerses().filter((v2) =>
    v2.ref.toLowerCase().includes(q)
    || v2.themeTitle.toLowerCase().includes(q)
    || (v2.gloss || '').toLowerCase().includes(q)
    || (v2.kjv || '').toLowerCase().includes(q),
  );
}

// -----------------------------------------------------------------------------
// Other translations — REFERENCE only (copyright). readOnline() links to where a
// reader opens a copyrighted translation; the text is never copied here.
// -----------------------------------------------------------------------------
export const OTHER_VERSIONS = [
  { id: 'ESV', label: 'ESV', note: 'Primary reading translation (SCRIPTURE-REFERENCE-STANDARD).' },
  { id: 'NIV', label: 'NIV', note: 'Modern accessibility.' },
  { id: 'NKJV', label: 'NKJV', note: 'KJV continuity in modern English.' },
  { id: 'AMP', label: 'AMP', note: 'Amplified — bracketed word expansion for study.' },
];

export function readOnline(ref, version = 'ESV') {
  const r = normalizeRef(ref);
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(r)}&version=${encodeURIComponent(version)}`;
}

export const COPYRIGHT_NOTE =
  'Full verse text shown here is the King James Version (KJV, 1611) — public domain. '
  + 'Copyrighted translations (ESV, NIV, NKJV, AMP) are linked, not reproduced; '
  + 'tap “read other translations” to open one.';

// -----------------------------------------------------------------------------
// Markdown export — generates the companion reference doc from this same data, so
// the doc and the in-app library can never drift (the curriculum-export pattern).
// -----------------------------------------------------------------------------
export function exportLibraryMarkdown() {
  const lines = [];
  lines.push('# Scripture Library — themed, depth-adaptive, soul-aimed teaching resource');
  lines.push('');
  lines.push('> Generated from `app/src/lib/scriptures.js` (`exportLibraryMarkdown()`). Do not hand-edit — edit the library and regenerate. Verse text is the verified public-domain KJV from `app/src/lib/scripture-kjv.js`.');
  lines.push('');
  lines.push(COPYRIGHT_NOTE);
  lines.push('');
  lines.push(`**Themes:** ${THEMES.length} · **References:** ${Object.keys(KJV).length} (all fetched verbatim from a public-domain KJV source; 0 unresolved).`);
  lines.push('');
  lines.push('**The governing lens:** every theme explains Yahweh’s perspective and His love, held in grace AND truth, delivered with no condemnation — His purposes and His will/way taught — all ordered to one aim: SOULS home with the Father.');
  lines.push('');
  lines.push('---');
  lines.push('');
  for (const theme of THEMES) {
    lines.push(`## ${theme.title}${theme.subtitle ? ` — ${theme.subtitle}` : ''}`);
    lines.push('');
    lines.push(`_${theme.blurb}_`);
    lines.push('');
    lines.push(`**Backs:** ${theme.surfaces.map((s) => SURFACES[s]?.label || s).join(' · ')}`);
    lines.push('');
    if (theme.lens) {
      lines.push(`**His perspective.** ${theme.lens.perspective}`);
      lines.push(`**His heart.** ${theme.lens.heart}`);
      lines.push(`**His love.** ${theme.lens.love}`);
      lines.push('');
    }
    if (theme.soul) { lines.push(`**For the soul.** ${theme.soul}`); lines.push(''); }
    if (theme.depths) {
      lines.push('### Read at your depth');
      if (theme.depths.essential) { lines.push(`**Essential.** ${theme.depths.essential}`); lines.push(''); }
      if (theme.depths.standard) { lines.push(`**Standard.** ${theme.depths.standard}`); lines.push(''); }
      if (theme.depths.deep) { lines.push(`**Deep.** ${theme.depths.deep}`); lines.push(''); }
    }
    if (theme.views && theme.views.length) {
      lines.push('### The main biblical views (presented fairly, Word-first)');
      for (const view of theme.views) {
        lines.push(`- **${view.name}.** ${view.summary} (${(view.scriptures || []).join('; ')})`);
      }
      lines.push('');
    }
    if (theme.textNote) { lines.push(`> _${theme.textNote}_`); lines.push(''); }
    lines.push('### The verses');
    lines.push('');
    for (const vv of theme.verses) {
      lines.push(`**KJV — ${vv.ref}:** *"${kjvText(vv.ref)}"*`);
      lines.push('');
      lines.push(`> ${vv.gloss} _(${(VERSE_ROLES[vv.role] || {}).label || vv.role})_`);
      lines.push(`> Read other translations: ${readOnline(vv.ref)}`);
      lines.push('');
    }
    if (theme.tests && theme.tests.questions) {
      lines.push(`_Retention check: ${theme.tests.questions.length} verified question(s)._`);
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  }
  lines.push('_King James Version — Public Domain. Other translations referenced, not reproduced (copyright). Truth in love, no condemnation — for the soul’s sake._');
  lines.push('');
  return lines.join('\n');
}
