// =============================================================================
// tlc-finding-peace — Christina's "Finding Peace: Biblical Wisdom for Life's
// Stressors" as a client-facing lesson track, inside the app
// =============================================================================
// Darrell, 2026-09-10: "why would you use Google?! fix it build the whole
// process workflows!" The manuscript (Christina Poe, LCSW, 2024, Drive) was a
// link; now its eleven chapters are eleven psychoeducation modules on the
// client track of the TLC Learn space — the same engine, the same reading
// support, the same not-treatment guardrail as every client lesson.
//
// HER WORDS, HER STRUCTURE: each chapter keeps her teaching and her practical
// tips, distilled for the lesson shape (a big idea, a plain-language level for
// younger or struggling readers, the standard level, a short quiz). The Word,
// VERBATIM (DR-0076): her manuscript quotes a modern rendering; the app
// hosts the KJV, so every verse below is the KJV text from
// app/public/bible/kjv, word for word, and each is pinned against the corpus
// by tlc-finding-peace.test.js. Her commentary around each verse is kept.
// validated:false like every client lesson — Christina signs off in-app.

export const FINDING_PEACE_SOURCE = Object.freeze({
  title: 'Finding Peace: Biblical Wisdom for Life’s Stressors',
  author: 'Christina Poe, LCSW',
  year: 2024,
  about: 'Christina is a counselor who specializes in Advanced Clinical Practice, the daughter of a Bishop, with over 20 years in the field. Her approach is rooted in compassion, empathy, and a belief in the transformative power of faith.',
});

export const FINDING_PEACE_VERSES = Object.freeze({
  'Psalms 46:10': 'Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.',
  'Psalms 23:2': 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.',
  'Psalms 55:22': 'Cast thy burden upon the LORD, and he shall sustain thee: he shall never suffer the righteous to be moved.',
  'Proverbs 17:22': 'A merry heart doeth good like a medicine: but a broken spirit drieth the bones.',
  'Proverbs 15:1': 'A soft answer turneth away wrath: but grievous words stir up anger.',
  'Proverbs 14:30': 'A sound heart is the life of the flesh: but envy the rottenness of the bones.',
  'Mark 5:34': 'And he said unto her, Daughter, thy faith hath made thee whole; go in peace, and be whole of thy plague.',
  'Mark 10:52': 'And Jesus said unto him, Go thy way; thy faith hath made thee whole. And immediately he received his sight, and followed Jesus in the way.',
  'Luke 5:20': 'And when he saw their faith, he said unto him, Man, thy sins are forgiven thee.',
  'Philippians 4:6': 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.',
  'Philippians 4:7': 'And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.',
  'Philippians 4:8': 'Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things.',
  'Philippians 4:13': 'I can do all things through Christ which strengtheneth me.',
  '1 Corinthians 13:4': 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up,',
  '1 Corinthians 13:5': 'Doth not behave itself unseemly, seeketh not her own, is not easily provoked, thinketh no evil;',
  '1 Corinthians 13:7': 'Beareth all things, believeth all things, hopeth all things, endureth all things.',
  '1 Corinthians 10:24': 'Let no man seek his own, but every man another’s wealth.',
  '1 John 4:8': 'He that loveth not knoweth not God; for God is love.',
  'Proverbs 3:5': 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.',
  'Proverbs 3:6': 'In all thy ways acknowledge him, and he shall direct thy paths.',
  'Matthew 6:26': 'Behold the fowls of the air: for they sow not, neither do they reap, nor gather into barns; yet your heavenly Father feedeth them. Are ye not much better than they?',
  'Matthew 6:27': 'Which of you by taking thought can add one cubit unto his stature?',
  'Matthew 6:34': 'Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself. Sufficient unto the day is the evil thereof.',
  'Romans 8:28': 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
  'Romans 12:2': 'And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.',
  'Romans 12:3': 'For I say, through the grace given unto me, to every man that is among you, not to think of himself more highly than he ought to think; but to think soberly, according as God hath dealt to every man the measure of faith.',
  'Romans 12:15': 'Rejoice with them that do rejoice, and weep with them that weep.',
  '1 Thessalonians 5:11': 'Wherefore comfort yourselves together, and edify one another, even as also ye do.',
  '1 Thessalonians 5:16': 'Rejoice evermore.',
  '1 Thessalonians 5:17': 'Pray without ceasing.',
  '1 Thessalonians 5:18': 'In every thing give thanks: for this is the will of God in Christ Jesus concerning you.',
  'Psalms 23:4': 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.',
  'Psalms 34:18': 'The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.',
  'Psalms 30:5': 'For his anger endureth but a moment; in his favour is life: weeping may endure for a night, but joy cometh in the morning.',
  'John 14:6': 'Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.',
  'Isaiah 26:3': 'Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.',
  'Ecclesiastes 3:1': 'To every thing there is a season, and a time to every purpose under the heaven:',
  'Ecclesiastes 7:10': 'Say not thou, What is the cause that the former days were better than these? for thou dost not enquire wisely concerning this.',
  'Ecclesiastes 9:10': 'Whatsoever thy hand findeth to do, do it with thy might; for there is no work, nor device, nor knowledge, nor wisdom, in the grave, whither thou goest.',
});
const V = (ref) => `${ref} (KJV): "${FINDING_PEACE_VERSES[ref]}"`;
const q = (question, options, answer, explain) => ({ q: question, options, answer, explain });

// Two renderings per chapter (DR-0345, Darrell: "two lessons one with the Word
// and the other without it so our curriculum is capable of working for all
// clients"): `child` / `teen` / `standard` are the PLAIN rendering — her
// practical tips with no Scripture, so any client can use them; `word` is her
// chapter as she wrote it, the verses verbatim, shown on click.
export const FINDING_PEACE_CHAPTERS = [
  {
    id: 'fp1-psalms-prayer', title: 'Finding Peace: Psalms, Prayer, and the Pursuit of Serenity',
    bigIdea: 'The Psalms and prayer give a roadmap to serenity: embrace stillness, make your own quiet waters, and cast your cares on the Lord.',
    verses: ['Psalms 46:10', 'Psalms 23:2', 'Psalms 55:22'],
    child: 'When life feels loud and busy, you can be still for a few minutes and remember that God is with you. You can rest, and you can give your worries to Him.',
    teen: 'Being still is hard when your to-do list is long. Try a few quiet minutes a day. Schedule real rest like an appointment. When a worry will not let go, write it down and hand it to God in prayer.',
    standard: "In a world that glorifies busyness, stillness is a skill. Practical tip: set aside a few minutes each day to simply be still and quiet — breathing, silence, or a short reflection — and notice what settles. Rest is not a reward; it is maintenance. Practical tip: schedule regular \"me time\" into your calendar like any other appointment; self-care is not selfish, it is essential. Letting go of a worry can feel like dropping a hot potato. Practical tip: create a \"worry box\" — write each anxiety on a slip of paper, place it inside, and close the lid on it for today. Once you set it down, you are free to focus on what truly matters.",
    word: { reflection: V('Psalms 46:10') + ' In a world that glorifies busyness, this verse is a reminder to hit the pause button. Practical tip: set aside a few minutes each day to simply be still and quiet — meditation, prayer, or silence — and reconnect with the still, small voice of God. ' + V('Psalms 23:2') + ' Finding your own quiet waters starts with intentional rest. Practical tip: schedule regular "me time" into your calendar like any other appointment; self-care is not selfish, it is essential. ' + V('Psalms 55:22') + ' Surrendering worries can feel like letting go of a hot potato. Practical tip: create a "worry box" — write each anxiety on a slip of paper, place it inside, and offer a simple prayer surrendering it to God. Once you let go, you are free to focus on what truly matters.' },
    quiz: [q('The "worry box" practice is…', ['A way to avoid problems forever', 'Writing a worry down and surrendering it to God in prayer', 'A filing system'], 1, 'Name it, place it, pray it — then let it go.'), q('Scheduling rest like an appointment is…', ['Selfish', 'Essential for peace and well-being', 'Only for vacations'], 1, 'Self-care is not selfish.')],
  },
  {
    id: 'fp2-proverbs-sound-mind', title: 'Wisdom from Proverbs: Practical Nuggets for a Sound Mind',
    bigIdea: 'A cheerful heart, a gentle answer, and a heart at peace: three Proverbs that keep the mind grounded.',
    verses: ['Proverbs 17:22', 'Proverbs 15:1', 'Proverbs 14:30'],
    child: 'Laughing is good for you. Answering softly keeps fights small. Being thankful for what you have keeps your heart happy.',
    teen: 'A good laugh really does lift you — keep a "forever funny" folder. When you feel like snapping, pause and answer gently. And stop comparing your life to other people’s highlight reels; write down three things you are thankful for each day.',
    standard: "Laughter has been shown to reduce stress hormones and increase feel-good endorphins. Practical tip: keep a laughter jar or a digital folder of funny moments and dip into it when you need a lift. Gentle communication is a game-changer for mental well-being; a soft answer lowers the temperature of almost any exchange. Practical tip: practice \"pause and ponder\" — take a breath and consider how to respond in a way that honors both yourself and others. Comparison is the thief of joy; what you see online is a curated snapshot, not a whole life. Practical tip: start a gratitude journal — three things you are thankful for each day.",
    word: { reflection: V('Proverbs 17:22') + ' Laughter has been shown to reduce stress hormones and increase feel-good endorphins. Practical tip: keep a laughter jar or a digital folder of funny moments and dip into it when you need a lift. ' + V('Proverbs 15:1') + ' Gentle communication is a game-changer for mental well-being. Practical tip: practice "pause and ponder" — take a breath and consider how to respond in a way that honors both yourself and others. ' + V('Proverbs 14:30') + ' Comparison is the thief of joy; what you see online is a curated snapshot. Practical tip: start a gratitude journal — three things you are thankful for each day.' },
    quiz: [q('"Pause and ponder" is used when…', ['You feel tempted to react impulsively', 'You are already calm', 'You want to win an argument'], 0, 'A soft answer turns away wrath.'), q('Gratitude journaling counters…', ['Laughter', 'Comparison and envy', 'Rest'], 1, 'A heart at peace, not envy.')],
  },
  {
    id: 'fp3-healing-stories', title: 'Finding Hope in Adversity: Lessons from the Healing Stories of Jesus',
    bigIdea: 'Reach out in faith, speak up for yourself, and let your friends carry you: three healings that teach hope in adversity.',
    verses: ['Mark 5:34', 'Mark 10:52', 'Luke 5:20'],
    child: 'A sick woman touched Jesus’ clothes and was healed. A blind man kept calling out until Jesus healed him. Four friends carried a man to Jesus. Reach out, speak up, and let people help you.',
    teen: 'The woman with the issue of blood reached out in faith. Blind Bartimaeus would not be shushed. The paralyzed man’s friends tore a roof open to get him to Jesus. When life is hard: reach out in faith, speak up for yourself, and let your people carry you.',
    standard: "Three stories of people who got help teach three moves for hard seasons. The first reached out in the smallest way she could and was met. Practical insight: do not underestimate the power of reaching out, even in the smallest gesture — one message, one call. The second kept asking when the crowd told him to be quiet. Practical insight: in adversity, speak up and advocate for yourself; you are allowed to say what you need. The third could not get there alone, so four friends carried him. Practical insight: enlist the help of your friends and loved ones — it takes a village, and there is no shame in reaching out for support.",
    word: { reflection: 'The woman who had suffered twelve years reached out and touched the hem of Jesus’ garment. ' + V('Mark 5:34') + ' Practical insight: do not underestimate the power of reaching out to Jesus in faith, even in the smallest gesture. Blind Bartimaeus cried out, and when the crowd told him to be quiet he shouted louder. ' + V('Mark 10:52') + ' Practical insight: in adversity, speak up and advocate for yourself. Four friends tore through a roof to lower their paralyzed friend to Jesus. ' + V('Luke 5:20') + ' Practical insight: enlist the help of your friends and loved ones — it takes a village, and there is no shame in reaching out for support.' },
    quiz: [q('Bartimaeus teaches…', ['Stay quiet and wait', 'Speak up and advocate for yourself', 'Give up when people hush you'], 1, 'He cried out louder.'), q('The paralyzed man’s healing began with…', ['His own strength', 'His friends carrying him', 'A doctor'], 1, 'Let your people carry you.')],
  },
  {
    id: 'fp4-philippians-anxiety', title: 'Conquering Anxiety: Insights from Philippians',
    bigIdea: 'Turn worries into prayers, think on what is good, and draw on Christ’s strength.',
    verses: ['Philippians 4:6', 'Philippians 4:7', 'Philippians 4:8', 'Philippians 4:13'],
    child: 'When you feel worried, tell God about it and thank Him. Think about good things. Jesus gives you strength.',
    teen: 'Instead of stewing in worry, turn each concern into a prayer. Train your mind to dwell on what is true and good — a gratitude list helps. When a task feels too big, remember whose strength you are drawing on.',
    standard: "Instead of stewing in worries, flip the script and turn each concern into a concrete request or a plan. Practical tip: a worry jar — write anxieties down, set them aside for the day, and watch how many resolve on their own. Train your mind to dwell on what is true, honest, and good. Practical tip: a gratitude journal shifts focus from the negative to the positive. When faced with a daunting challenge, take a deep breath, square your shoulders, and say out loud that you can take the next step — then take it, trusting the process even when you cannot see the whole road.",
    word: { reflection: V('Philippians 4:6') + ' ' + V('Philippians 4:7') + ' Instead of stewing in worries, flip the script and turn concerns into prayers. Practical tip: a worry jar — write anxieties down and offer them to God in prayer, and watch Him replace them with His peace. ' + V('Philippians 4:8') + ' Practical tip: a gratitude journal shifts focus from the negative to the positive. ' + V('Philippians 4:13') + ' Practical tip: when faced with a daunting challenge, take a deep breath, square your shoulders, and say it aloud — then go forward, trusting His process even when you cannot see where He is taking you.' },
    quiz: [q('Philippians 4:6-7 pairs prayer with…', ['Worry', 'Thanksgiving', 'Silence'], 1, 'Prayer and supplication with thanksgiving.'), q('Philippians 4:8 asks you to think on…', ['Whatever is trending', 'Whatever is true, honest, just, pure, lovely, of good report', 'Your fears'], 1, 'Think on these things.')],
  },
  {
    id: 'fp5-corinthians-love', title: 'Rebuilding Bridges: Love and Forgiveness in Corinthians',
    bigIdea: 'Love is patient and seeks the good of the other; forgiveness keeps no record of wrongs.',
    verses: ['1 Corinthians 13:4', '1 Corinthians 13:5', '1 Corinthians 13:7', '1 Corinthians 10:24', '1 John 4:8'],
    child: 'Love is patient and kind. Love does not keep a list of the wrong things people did. Ask, "What would love do?"',
    teen: 'Love is not about being perfect; it is about growing together. Ask "How can I support you today?" and put the phone down when your partner is talking. Holding a grudge hurts you most — try writing a forgiveness letter you do not have to send.',
    standard: "Love is patient and kind; it does not keep score. Love is not about being perfect; it is about being willing to grow and change together, one imperfect step at a time. Practical tip: when you are at odds with your partner, ask \"What would love do?\" Practical tip: ask your partner, \"How can I support you today?\" — and put your cell phone down when your partner is speaking. Forgiveness is the relationship superpower; holding onto a grudge only hurts you. Practical tip: write a letter of forgiveness you do not have to send.",
    word: { reflection: V('1 Corinthians 13:4') + ' ' + V('1 Corinthians 13:5') + ' ' + V('1 Corinthians 13:7') + ' Love is not about being perfect; it is about being willing to grow and change together, one imperfect step at a time. ' + V('1 John 4:8') + ' Practical tip: when you are at odds with your partner, ask "What would love do?" ' + V('1 Corinthians 10:24') + ' Practical tip: ask your partner, "How can I support you today?" — and put your cell phone down when your partner is speaking. Forgiveness is the relationship superpower; holding onto a grudge only hurts you. Practical tip: write a letter of forgiveness you do not have to send.' },
    quiz: [q('"Keeps no record of wrongs" points to…', ['Forgiveness', 'Score-keeping', 'Silence'], 0, 'Love thinketh no evil.'), q('A daily relationship practice from this chapter is…', ['"What is wrong with you?"', '"How can I support you today?"', '"Let me finish my phone first"'], 1, 'Seek the good of the other.')],
  },
  {
    id: 'fp6-surrender', title: 'Letting Go: Trusting in God’s Plan',
    bigIdea: 'Trust, stop worrying, and believe He works all things for good: surrender is the way to peace.',
    verses: ['Proverbs 3:5', 'Proverbs 3:6', 'Matthew 6:26', 'Matthew 6:27', 'Romans 8:28'],
    child: 'You do not have to be in charge of everything. God feeds the birds and He cares for you even more. Say, "I trust You, God."',
    teen: 'Letting go of control feels like walking a tightrope without a net — until you exhale. When fear spirals, say "I trust You, God." Ask, "Is this worry helping me?" And ask, "How might God use this for my good?"',
    standard: "Letting go of control feels like walking a tightrope without a net — until you exhale. Practical tip: when uncertainty or fear grips you, repeat a simple, steadying sentence you have chosen in advance, such as \"I can handle the next step.\" Worry adds nothing to a day; it only takes. Practical tip: when you catch yourself spiraling, ask, \"Is this worry serving me?\" If not, choose to let it go. Practical tip: facing a setback, shift the question to \"What could this make possible?\" and look for the good that can still come out of the mess.",
    word: { reflection: V('Proverbs 3:5') + ' ' + V('Proverbs 3:6') + ' Practical tip: when uncertainty or fear grips you, repeat the simple truth, "I trust you, God." ' + V('Matthew 6:26') + ' ' + V('Matthew 6:27') + ' Practical tip: when you catch yourself spiraling, ask, "Is this worry serving me?" If not, choose to let it go. ' + V('Romans 8:28') + ' Practical tip: facing a setback, shift the question to "How might God be using this for my good?" Trust that He is at work, turning even the messiest situations into something beautiful.' },
    quiz: [q('The birds of the air teach…', ['God provides; worry adds nothing', 'Work harder', 'Ignore your needs'], 0, 'Are ye not much better than they?'), q('"Is this worry serving me?" is a tool for…', ['Planning', 'Letting go', 'Blame'], 1, 'Release what is not serving you.')],
  },
  {
    id: 'fp7-romans-12', title: 'Mind Makeover: Transforming Your Life with Romans 12',
    bigIdea: 'Renew your mind, stay humble, and practice empathy: Romans 12 as a garden for the mind.',
    verses: ['Romans 12:2', 'Romans 12:3', 'Romans 12:15'],
    child: 'Your mind is like a garden. Pull out the weeds of bad thoughts and plant good ones. Be humble, and be kind when your friends are happy or sad.',
    teen: 'When a negative thought spirals, ask, "Is this helping me or hindering me?" and replace it. Stay humble without shrinking yourself. Show up for friends: celebrate their wins, sit with their losses.',
    standard: "Your mind is a garden; what you let grow there shapes your life. Practical tip: hit the mental pause button and ask, \"Is this thought helping me or hindering me?\" If it is the latter, delete it and replace it with a truer, more empowering thought — spring cleaning for the brain. It works if you work it. True humility acknowledges your worth without needing validation from others. Empathy is the glue of relationships: showing up, listening, offering a shoulder. Practical tip: celebrate a friend’s success or acknowledge their struggle, then sandwich it with validation and support.",
    word: { reflection: V('Romans 12:2') + ' Practical tip: hit the mental pause button and ask, "Is this thought helping me or hindering me?" If it is the latter, delete it and replace it with a truer, more empowering thought — spring cleaning for the brain. It works if you work it. ' + V('Romans 12:3') + ' True humility acknowledges your worth without needing validation from others, affirming it quietly before God. ' + V('Romans 12:15') + ' Empathy is the glue of relationships: showing up, listening, offering a shoulder. Practical tip: celebrate a friend’s success or acknowledge their struggle, then sandwich it with validation and support.' },
    quiz: [q('Romans 12:2 calls for…', ['Conforming to the world', 'Transformation by renewing the mind', 'Thinking nothing'], 1, 'Be ye transformed.'), q('Empathy, per Romans 12:15, means…', ['Fixing everyone’s problems', 'Rejoicing and weeping with others', 'Keeping distance'], 1, 'Show up and share it.')],
  },
  {
    id: 'fp8-thessalonians-gratitude', title: 'Gratitude and Giggles: Lessons from Thessalonians',
    bigIdea: 'Rejoice, pray, give thanks, and build each other up: joy is found in everyday moments.',
    verses: ['1 Thessalonians 5:16', '1 Thessalonians 5:17', '1 Thessalonians 5:18', '1 Thessalonians 5:11'],
    child: 'Be glad, talk to God, and say thank you. Say something kind to someone every day.',
    teen: 'Joy is not only for mountaintop moments; it is in your morning coffee and a laugh with a friend. Keep a joy jar. Give one real compliment a day. Even on hard days, look for one thing to be thankful for.',
    standard: "Joy is found in the mundane, everyday moments — the morning coffee, a laugh with a friend. Practical tip: a joy jar or journal for moments of gratitude and joy as they happen. Encouragement builds people. Practical tip: offer at least one genuine compliment or word of encouragement to someone each day. Even in setbacks there is something to be thankful for — beauty in the ashes, strength in adversity, growth in pain.",
    word: { reflection: V('1 Thessalonians 5:16') + ' ' + V('1 Thessalonians 5:17') + ' ' + V('1 Thessalonians 5:18') + ' Joy is found in the mundane, everyday moments. Practical tip: a joy jar or journal for moments of gratitude and joy as they happen. ' + V('1 Thessalonians 5:11') + ' Practical tip: offer at least one genuine compliment or word of encouragement to someone each day. Even in setbacks there is something to be thankful for — beauty in the ashes, strength in adversity, growth in pain.' },
    quiz: [q('The Thessalonians trio is…', ['Rejoice, pray, give thanks', 'Work, save, rest', 'Plan, act, review'], 0, 'Rejoice evermore; pray without ceasing; in every thing give thanks.'), q('Encouragement, per this chapter, is…', ['Rare and formal', 'A daily word that builds someone up', 'Only for leaders'], 1, 'Edify one another.')],
  },
  {
    id: 'fp9-psalms-of-lament', title: 'Navigating Grief: Finding Comfort in the Psalms of Lament',
    bigIdea: 'In grief you are never alone: pour out your heart, and joy comes in the morning.',
    verses: ['Psalms 23:4', 'Psalms 34:18', 'Psalms 30:5', 'John 14:6'],
    child: 'When you are very sad, God stays close to you. You can tell Him everything you feel. Sad nights end, and morning comes.',
    teen: 'Grief is not neat or tidy. God walks the dark valley with you. Pour out the anger and the tears in a grief journal; He can take it. Surround yourself with people who will sit with you. Joy does come in the morning.',
    standard: "Grief is not neat or tidy, and it has no timeline. Practical tip: when grief overwhelms you, pause, breathe, and remind yourself that you do not have to carry it alone or all at once. Grief can make you a mess of emotions — sad, angry, confused — and that is human. Practical tip: a grief journal where you pour out raw, honest words; nothing has to be polished. Sad nights end and mornings come. Practical tip: surround yourself with a support network — friends, family, or a grief support group — who can walk alongside you.",
    word: { reflection: V('Psalms 23:4') + ' Practical tip: when grief overwhelms you, pause, breathe, and remind yourself of God’s promise never to leave you nor forsake you. ' + V('Psalms 34:18') + ' Grief can make you a mess of emotions — sad, angry, confused — and that is human. Practical tip: a grief journal where you pour out raw, honest prayers. ' + V('Psalms 30:5') + ' Grief has no neat timeline. Christina’s own comfort rests on the promise of reuniting with her mother in heaven, a promise Jesus made: ' + V('John 14:6') + ' Practical tip: surround yourself with a support network — friends, family, or a grief support group — who can walk alongside you.' },
    quiz: [q('A grief journal is for…', ['Tidy, polished prayers only', 'Raw, honest prayers — anger and tears included', 'Keeping busy'], 1, 'He draws near to the brokenhearted.'), q('Psalms 30:5 promises…', ['Grief ends by a deadline', 'Joy comes in the morning', 'Nothing changes'], 1, 'Weeping may endure for a night.')],
  },
  {
    id: 'fp10-ecclesiastes-change', title: 'Rolling with the Punches: Embracing Change with Ecclesiastes',
    bigIdea: 'There is a season for everything: lean into change, stop pining for the old days, and do your work with all your might.',
    verses: ['Ecclesiastes 3:1', 'Ecclesiastes 7:10', 'Ecclesiastes 9:10'],
    child: 'Things change, and that is okay. Instead of wishing for the old days, make a picture of what you hope for. Do your work with all your might.',
    teen: 'Change sneaks up on everyone. Try "Yes, and…" instead of "No, but…". Make a vision board for what is ahead instead of pining for the past. Whatever you do, do it with all your might.',
    standard: "Change is part of life’s rhythm; every season has its own work. Practical tip: adopt the improv mindset — \"Yes, and…\" instead of \"No, but…\" — and turn unexpected challenges into growth. The good old days were not always as good as we remember, and clinging to them keeps us stuck. Practical tip: create a vision board — images, quotes, affirmations, personal goals — and keep it where you will see it daily. Practical tip: facing a major life change, tap into your inner strength and resilience and pursue your passions with all your might.",
    word: { reflection: V('Ecclesiastes 3:1') + ' Change is part of life’s rhythm. Practical tip: adopt the improv mindset — "Yes, and…" instead of "No, but…" — and turn unexpected challenges into growth. ' + V('Ecclesiastes 7:10') + ' The good old days were not always as good as we remember, and clinging to them keeps us stuck. Practical tip: create a vision board — images, quotes, affirmations, personal goals — and keep it where you will see it daily. ' + V('Ecclesiastes 9:10') + ' Practical tip: facing a major life change, tap into your inner strength and resilience and pursue your passions with all your might.' },
    quiz: [q('Ecclesiastes 7:10 warns against…', ['Planning', 'Pining for the old days', 'Rest'], 1, 'Do not ask why the former days were better.'), q('A vision board is used to…', ['Remember the past', 'Clarify hopes for the season ahead', 'Avoid change'], 1, 'A visual reminder of what lies ahead.')],
  },
  {
    id: 'fp11-perfect-peace', title: 'Finding Zen in the Chaos: Trusting God’s Promises',
    bigIdea: 'Perfect peace is a mind stayed on Him: one day at a time, trusting that He works all things for good.',
    verses: ['Isaiah 26:3', 'Matthew 6:34', 'Romans 8:28'],
    child: 'When things feel scary, remember that God has a good plan. Take one day at a time. Keep a list of the ways you saw God help you.',
    teen: 'Perfect peace is not a mind that never wavers — it is a mind that keeps coming back to trust. Make a peace corner at home. Try the five-minute worry rule. Keep a "God sightings" journal.',
    standard: "Peace is not a mind that never wavers; it is a mind that keeps coming back to what steadies it. Practical tip: create a \"peace corner\" at home — a comfy chair, a candle, calming music — a place to center your thoughts when life is overwhelming. Tomorrow has its own troubles; today has enough. Practical tip: the \"five-minute worry rule\" — set aside five minutes to worry, then close the file and move on with your day. It is not about denying pain; it is about trusting that hard chapters can still turn toward good. Practical tip: keep a journal of moments when things worked out better than you feared.",
    word: { reflection: V('Isaiah 26:3') + ' Practical tip: create a "peace corner" at home — a comfy chair, a candle, worship music — a place to center your thoughts when life is overwhelming. ' + V('Matthew 6:34') + ' Practical tip: the "five-minute worry rule" — set aside five minutes to worry, then close the file and move on with your day. ' + V('Romans 8:28') + ' It is not about denying pain; it is about trusting that God redeems even the messiest parts of our lives. Practical tip: keep a "God sightings" journal of moments when you have seen His hand at work.' },
    quiz: [q('Isaiah 26:3 ties perfect peace to…', ['A mind stayed on Him, trusting', 'Having no problems', 'Perfect circumstances'], 0, 'Because he trusteth in thee.'), q('The "five-minute worry rule" is…', ['Worry all day', 'A bounded time to worry, then move on', 'Never worry'], 1, 'Take no thought for the morrow.')],
  },
];

// The eleven chapters as engine-shaped client modules (levels + quiz), the
// same way witnessClientModules() feeds the client track.
export function findingPeaceModules() {
  return FINDING_PEACE_CHAPTERS.map((c) => ({
    id: c.id,
    title: `Finding Peace · ${c.title}`,
    bigIdea: c.bigIdea,
    origin: 'tlc-authored',
    author: FINDING_PEACE_SOURCE.author,
    verses: c.verses,
    levels: { child: c.child, teen: c.teen, standard: c.standard, senior: c.standard },
    // The Word rendering (DR-0345): her chapter as written, every verse
    // verbatim, opened on click; the levels above are the plain rendering.
    word: { principle: c.bigIdea, verses: c.verses, reflection: c.word.reflection },
    quiz: { questions: c.quiz },
  }));
}
