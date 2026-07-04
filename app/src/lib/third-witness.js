// =============================================================================
// third-witness — high-quality 3rd-dimensional data cross-referenced with the
// 4th-dimensional Word (Darrell 2026-07-03: "I want a lot of these types of
// data or information to cross reference the scriptures so we can see this
// trauma from the 3rd-dimension better as a Body Of Christ. All experts cited
// however Yahweh's Perspectives are 4th dimensional so we mix with high
// quality 3rd-dimensional data and information intertwined for Yahweh's Way
// to make even more sense.")
// =============================================================================
// The rules of this space:
// - EVERY source is cited: expert, credential, work. No anonymous "studies
//   show." The 3rd dimension gets credit where credit is due (Romans 13:7).
// - EVERY verse is verbatim from the verified fetch (godhead-study-verses.json
//   via godheadVerse) — never from model memory (DR-0076).
// - The science is a WITNESS, not the authority: cited experts describe the
//   frame Yahweh made; His Word governs. Pastoral, not clinical — this space
//   helps the Body see, it does not diagnose or treat (the TLC bright line).
//
// Shape: one WITNESS_SOURCE per expert work; each `pairs[]` row binds one
// 3rd-dimensional claim (with its in-work cite) to the Scripture that said it
// first, plus the bridge that intertwines them.
import { godheadVerse } from './godhead-study';

export const WITNESS_TAGLINE = 'All experts cited — and Yahweh\'s Perspectives are 4th-dimensional: as high above the data as the heavens are above the earth. High-quality 3rd-dimensional witness, intertwined so His Way makes even more sense.';

export const WITNESS_SOURCES = [
  {
    id: 'w3-setback-neuroscience',
    topic: 'Setbacks, dopamine, and the ruminating mind',
    source: {
      expert: 'Dr. Tracey Marks',
      credential: 'Psychiatrist',
      work: 'The Neuroscience of Setbacks (video)',
      kind: 'video',
    },
    summary: 'How the brain responds to a setback — the dopamine crash, the stressed prefrontal cortex, the rumination loop — and the brain-based recovery moves: act before motivation, shrink the step, feed dopamine sustainably, anchor in routine, and treat yourself with compassion instead of threat.',
    pairs: [
      {
        id: 'w3p-dopamine-crash',
        claim: 'When reality fails to meet expectations, dopamine — the motivation chemical — drops, producing apathy and "mental whiplash."',
        cite: '1:12-2:04',
        refs: ['Proverbs 13:12'],
        bridge: 'The Word named the dopamine crash three thousand years early: hope deferred maketh the heart SICK — a physiological word, not a poetic one. And it names the recovery in the same verse: when the desire cometh, it is a tree of life.',
      },
      {
        id: 'w3p-executive-shutdown',
        claim: 'Setback stress inhibits the prefrontal cortex (planning, decisions) while activating the amygdala (the alarm), so simple tasks feel overwhelming.',
        cite: '2:06-3:06',
        refs: ['Isaiah 26:3', 'Philippians 4:6-7'],
        bridge: 'The mind STAYED on Yahweh is kept in perfect peace — the stayed mind is the regulated mind. Philippians gives the mechanism: requests handed to God in prayer, and the peace that passeth understanding GARRISONS the heart and mind — the alarm relieved of duty by a Guard that outranks it.',
      },
      {
        id: 'w3p-narrative-trap',
        claim: 'Labeling an external setback as a personal failure triggers the default mode network into a loop of negative rumination that reinforces inadequacy.',
        cite: '3:32-5:25',
        refs: ['2 Corinthians 10:5'],
        bridge: 'The rumination loop is the exact target of the oldest cognitive discipline on record: casting down imaginations, and bringing into captivity EVERY THOUGHT to the obedience of Christ. NOTICE → TEST → CAPTURE → REDIRECT is the Body\'s name for breaking the default-mode loop.',
      },
      {
        id: 'w3p-behavioral-activation',
        claim: 'Behavioral activation: do not wait for motivation — small structured actions (one email, a cleaned desk) jump-start the dopamine system.',
        cite: '5:38',
        refs: ['Ecclesiastes 9:10'],
        bridge: 'Whatsoever thy hand FINDETH to do — the hand moves first and the heart follows. The Word never waits on the feeling; faith is expressed in works, and the doing is itself the medicine.',
      },
      {
        id: 'w3p-micro-goals',
        claim: 'Micro-goals: breaking overwhelming tasks into tiny achievable steps avoids the stress response and rebuilds trust in your own capability.',
        cite: '6:31',
        refs: ['Zechariah 4:10'],
        bridge: 'For who hath despised the day of SMALL THINGS? The Kingdom pattern is seed-sized starts that Yahweh grows — the micro-goal is not a coping trick, it is how He builds temples: one course of stones, with rejoicing at the plumbline.',
      },
      {
        id: 'w3p-sustainable-dopamine',
        claim: 'Reset dopamine sustainably: move from quick-fix hits (scrolling, snacking) to durable sources — novelty, movement, connection, completed tasks.',
        cite: '7:05',
        refs: ['Jeremiah 2:13'],
        bridge: 'Two evils, one diagnosis: forsaking the FOUNTAIN of living waters, and hewing broken cisterns that can hold no water. The scroll and the snack are broken cisterns — the leak is in the container, not the thirst. The thirst is legitimate; take it to the Fountain.',
      },
      {
        id: 'w3p-routine-anchor',
        claim: 'Rebuild structure: routines act as anchors that reduce decision fatigue — but do not weaponize them with harsh self-talk.',
        cite: '7:53-8:37',
        refs: ['Daniel 6:10'],
        bridge: 'Daniel kneeled three times a day and prayed, AS HE DID AFORETIME — the routine was already anchored before the crisis, which is why the crisis could not move him. The anchor is set in calm water, and it held under a den of lions.',
      },
      {
        id: 'w3p-self-compassion',
        claim: 'Self-criticism activates the brain\'s threat systems; self-compassion engages the caregiving system, restoring balance and re-engaging the prefrontal cortex.',
        cite: '8:37-9:08',
        refs: ['Psalms 103:13-14'],
        bridge: 'Like as a father pitieth his children — the caregiving system is the Father\'s own posture toward you: He knoweth our frame; He remembereth that we are dust. Speaking to yourself the way He speaks to you is not softness, it is accuracy.',
      },
      {
        id: 'w3p-recalibration',
        claim: 'Setbacks are signals for recalibration, not verdicts of failure — worked with biologically, you recover and often emerge stronger.',
        cite: '9:08-9:47',
        refs: ['Proverbs 24:16'],
        bridge: 'For a just man falleth SEVEN TIMES, and riseth up again — the falling is in the verse about the just man. The setback was never the verdict; the rising is the identity. The Word used the beating as exercise.',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // THE FASTING CLUSTER (Darrell 2026-07-04: five cited experts on fasting /
  // time-restricted eating, intertwined with the Word). Fasting is one of the
  // few places the 3rd dimension has circled all the way back to what Scripture
  // named first: a body built with seasons of feeding and repair. The cluster
  // is deliberately balanced — Sims is the COUNTER-witness (for some, the godly
  // move is to EAT, not fast), so the mixture never becomes a one-size law. Any
  // clinical / medical claim is a witness to Yahweh's design, never a
  // prescription; the separated Practice rendering carries the physician-consult
  // and the disordered-eating safe-side (see witnessClientModules).
  // ---------------------------------------------------------------------------
  {
    id: 'w3-tre-circadian',
    topic: 'Time-restricted eating and eating in due season',
    source: {
      expert: 'Dr. Andrew Huberman',
      credential: 'Neuroscientist, Stanford School of Medicine',
      work: 'The Science of Intermittent Fasting & Time-Restricted Feeding (Huberman Lab)',
      kind: 'video',
    },
    summary: 'Consistent daily fasting windows align circadian rhythms and organ health, alternating a fed state of growth (mTOR) with a fasted state of repair (autophagy). An ~8-hour window, food stopped 2-3 hours before bed and delayed ~60 minutes after waking, narrowed gradually over days — and tuned to the individual\'s exercise and social life.',
    pairs: [
      {
        id: 'w3p-due-season',
        claim: 'Aligning eating to consistent daily windows tracks the body\'s circadian rhythm and optimizes organ health — WHEN you eat, not only what.',
        cite: '12:00-15:20',
        refs: ['Ecclesiastes 10:17'],
        bridge: 'Princes that eat IN DUE SEASON, for strength, and not for drunkenness — the Word already tied the TIMING of the meal to strength. Due season is circadian language three thousand years early: food set to its right hour is fuel; food out of season is excess.',
      },
      {
        id: 'w3p-growth-repair',
        claim: 'Fed = a growth state (mTOR); fasted = a repair state (autophagy). Health depends on consistency in when each state runs.',
        cite: '25:56-27:25',
        refs: ['Ecclesiastes 3:1'],
        bridge: 'To every thing there is a SEASON, and a time to every purpose under the heaven — a time to eat and a time to abstain is written into the design. The body was never meant to be always feeding; the alternation of build and repair is the seasoned pattern the Preacher named.',
      },
      {
        id: 'w3p-individualize-tre',
        claim: 'Protocols are backed by science, but individual needs vary — the window must fit the person\'s training and schedule, not a fixed rule.',
        cite: '34:08-38:23',
        refs: ['Mark 2:19'],
        bridge: 'Can the children of the bridechamber fast, while the bridegroom is with them? Jesus Himself named that fasting has a season AND an exception — the practice bends to the moment and the person. The tool serves the life; the life does not serve the tool.',
      },
    ],
  },
  {
    id: 'w3-therapeutic-fasting',
    topic: 'Fasting to reset the body, and the whole-foods witness',
    source: {
      expert: 'Dr. Pradip Jamnadas',
      credential: 'Cardiologist (FACC), Cardiovascular Interventions',
      work: 'Fasting for Survival / therapeutic fasting lecture',
      kind: 'video',
    },
    summary: 'Fasting as a tool to lower insulin and restore metabolic flexibility — 18/6 as a baseline, OMAD and supervised water fasts for harder cases — while addressing root causes in gut health and choosing whole foods over emulsifiers, processed items, and high-heat AGEs. Individualized, physician-guided.',
    pairs: [
      {
        id: 'w3p-health-springs',
        claim: 'Fasting resets hormonal health — lowering insulin, restoring metabolic flexibility — and can move blood pressure, diabetes, heart, and fatty-liver disease.',
        cite: '11:07-33:13',
        refs: ['Isaiah 58:6-8'],
        bridge: 'This is the fast Yahweh CHOSE — and the promise attached to it is physiological: then shall thy light break forth as the morning, and thine HEALTH shall spring forth speedily. Health is literally in the fasting chapter. The cardiologist is a witness to a verse that put health and the chosen fast in the same breath.',
      },
      {
        id: 'w3p-whole-foods',
        claim: 'Root causes trace to gut health (leaky gut, SIBO); the fix is whole foods and the avoidance of emulsifiers and processed items.',
        cite: '13:22-27:15',
        refs: ['Daniel 1:12-15'],
        bridge: 'Daniel asked for pulse to eat and water to drink for ten days — a whole-foods trial with a control group and a measurable endpoint. And the result: their countenances appeared FAIRER and fatter in flesh than all the children which did eat the portion of the king\'s meat. The whole-food witness ran its experiment in Babylon and published the finding.',
      },
      {
        id: 'w3p-sufficient',
        claim: 'When you do eat, favor real food and avoid the excess — high-heat AGEs and overconsumption drive the damage.',
        cite: '1:02:00-1:06:37',
        refs: ['Proverbs 25:16'],
        bridge: 'Hast thou found honey? eat so much as is SUFFICIENT for thee, lest thou be filled therewith, and vomit it. Sufficiency, not excess, is the Word\'s measure at the table — even for the good thing, even for the sweet thing.',
      },
      {
        id: 'w3p-body-temple',
        claim: 'The specific protocol depends entirely on the person\'s health, goals, and history — always consult a physician before significant change.',
        cite: 'passim',
        refs: ['1 Corinthians 6:19-20'],
        bridge: 'Your body is the TEMPLE of the Holy Ghost — ye are not your own, ye are bought with a price: therefore glorify God in your body. The why beneath every protocol: stewardship of a temple that is not merely yours. And stewardship of a temple is done with counsel, not alone.',
      },
    ],
  },
  {
    id: 'w3-fasting-brain',
    topic: 'Fasting, BDNF, and the renewed mind',
    source: {
      expert: 'Dr. Jason Fung',
      credential: 'Nephrologist; author on fasting and metabolic health',
      work: 'Intermittent Fasting and Brain Health (lecture)',
      kind: 'video',
    },
    summary: 'The fasted, ketone-producing state stimulates BDNF in the hippocampus (nerve growth, learning, memory), triggers autophagy/mitophagy that clears damaged proteins ("cleaning the brain"), raises focus hormones like noradrenaline, and may increase neuron resistance while clearing toxic Tau and Amyloid — short-term sharpening and long-term neuro-protection.',
    pairs: [
      {
        id: 'w3p-bdnf-renewal',
        claim: 'Fasting stimulates BDNF (brain-derived neurotrophic factor) — critical for nerve-cell growth, learning, and memory.',
        cite: '3:41-5:17',
        refs: ['Romans 12:2'],
        bridge: 'Be ye transformed by the RENEWING of your mind — the neuroscientist just named a mechanism of it. BDNF grows new nerve cells; the Word commanded the renewed mind before anyone could measure the factor that grows it. The command came first; the microscope caught up.',
      },
      {
        id: 'w3p-autophagy-clean',
        claim: 'Fasting triggers autophagy and mitophagy — a cellular recycling that clears old, damaged proteins, effectively cleaning the brain.',
        cite: '5:17-6:13',
        refs: ['Psalms 51:10'],
        bridge: 'Create in me a CLEAN heart, O God; and RENEW a right spirit within me — cleansing and renewal in one breath, which is exactly the two things autophagy does: clear the damaged, renew the whole. David prayed the cellular process before there was a word for it.',
      },
      {
        id: 'w3p-fasting-focus',
        claim: 'Fasting increases focus hormones (noradrenaline); historically great thinkers fasted for mental clarity, and large meals induce lethargy.',
        cite: '2:03-4:20',
        refs: ['Matthew 6:16-18'],
        bridge: 'When thou fastest, anoint thine head, and wash thy face — Jesus did not argue for fasting, He ASSUMED it: "when," not "if." The practice great minds reached for was already the ordinary discipline of The Way, done quietly, not for show.',
      },
    ],
  },
  {
    id: 'w3-water-fasting-supervised',
    topic: 'Supervised water-only fasting and the pleasure trap',
    source: {
      expert: 'Dr. Alan Goldhamer',
      credential: 'Physician; founder, TrueNorth Health Center',
      work: 'Medically supervised water-only fasting (interview)',
      kind: 'video',
    },
    summary: 'Health as the result of healthful living, not "pills, potions, and powders" — water-only fasting (5-40 days, medically supervised, careful refeeding) mobilizes harmful visceral fat, normalizes blood pressure, reduces insulin resistance, induces autophagy, and protects the brain. The "pleasure trap": salt, oil, and sugar override satiety; the sustainable path is a whole-plant, SOS-free diet. Long fasts require professional oversight.',
    pairs: [
      {
        id: 'w3p-rest-to-heal',
        claim: 'Health results from healthful living, not from "pills, potions, and powders" — fasting gives the body the rest it needs to heal itself.',
        cite: '1:11:43',
        refs: ['Mark 6:31'],
        bridge: 'Come ye yourselves apart into a desert place, and REST a while — Jesus prescribed rest to a body worn by demand. Fasting is a rest FROM the table, and the rest is where the healing runs. The remedy was never mainly in the potion; it was in the ceasing.',
      },
      {
        id: 'w3p-pleasure-trap',
        claim: 'Processed salt, oil, and sugar override the body\'s natural satiety, holding people in chronic overeating — the "pleasure trap."',
        cite: '13:23-28:20',
        refs: ['Proverbs 23:1-3'],
        bridge: 'When thou sittest to eat... be not desirous of his dainties: for they are DECEITFUL MEAT. The Word named the pleasure trap in two words: deceitful meat — food engineered to promise what it will not give and to defeat the body\'s own "enough." Put a knife to thy throat, if thou be a man given to appetite.',
      },
      {
        id: 'w3p-whole-plant',
        claim: 'The sustainable path is a whole plant-food, SOS-free (salt/oil/sugar-free) diet that lets satiety work again.',
        cite: '28:20',
        refs: ['Genesis 1:29'],
        bridge: 'Behold, I have given you every HERB bearing seed... and every tree, in the which is the fruit of a tree yielding seed; to you it shall be for meat — the first diet named in Scripture is the whole-plant one. Not a modern fad; the original provision, given in the garden before anything was processed.',
      },
      {
        id: 'w3p-supervision',
        claim: 'Extended fasting must be done safely with professional guidance — monitoring electrolytes and heart, and careful refeeding to avoid refeeding syndrome.',
        cite: '21:08-1:10:26',
        refs: ['Proverbs 11:14'],
        bridge: 'Where no counsel is, the people fall: but in the multitude of COUNSELLORS there is safety. The physician\'s oversight is not a lack of faith; it is the Word\'s own safety pattern. A long fast at home without counsel is the fall the proverb warned of.',
      },
    ],
  },
  {
    id: 'w3-fasting-timeline',
    topic: 'The hour-by-hour fast, and reaping in due season',
    source: {
      expert: 'Kait Malthaner',
      credential: 'Health coach',
      work: 'What Happens In Your Body When You Fast (hour-by-hour)',
      kind: 'video',
    },
    summary: 'An hour-by-hour map of the fast: insulin drops by 4-8 hours, HGH rises by 12, ketones and mental clarity by 16, autophagy ramping 18-20 and up ~300% by 36 hours, insulin sensitivity and stem-cell/immune regeneration in the longer windows. Benefits are not linear; a 12-18h daily window is sustainable, with 24+ hour fasts only quarterly or biannually.',
    pairs: [
      {
        id: 'w3p-reap-in-season',
        claim: 'Fasting benefits are not linear — they unfold in stages over hours and days (HGH, ketones, autophagy, stem-cell activity), rewarding patience.',
        cite: '02:00-09:42',
        refs: ['Galatians 6:9'],
        bridge: 'Let us not be weary in well doing: for in DUE SEASON we shall reap, if we faint not. The staged, non-linear payoff is the harvest pattern the Word already gave — the reward is real but it is not instant, and fainting forfeits it. The clock in the body keeps the same law the field keeps.',
      },
      {
        id: 'w3p-moderation-window',
        claim: 'A 12-18 hour daily window is sustainable for most; longer 24+ hour fasts are best kept occasional (quarterly or biannual), tailored to the goal.',
        cite: '07:14',
        refs: ['Philippians 4:5'],
        bridge: 'Let your MODERATION be known unto all men. The Lord is at hand. The sustainable window is the moderate one; the extreme fast has its rare place, but the daily practice the Word commends is measured, not severe. Moderation is the setting that lasts.',
      },
    ],
  },
  {
    id: 'w3-fasting-as-discipline',
    topic: 'The 24-hour fast as spiritual exercise',
    source: {
      expert: 'Fit Father Project',
      credential: 'Men\'s health coaching program',
      work: 'The 1-Meal-Per-Week 24-Hour Fast',
      kind: 'video',
    },
    summary: 'A once-weekly dinner-to-dinner (24-hour) fast on water, coffee, or green tea: improved insulin sensitivity, autophagy, an HGH boost, and mental clarity for busy days — and, named explicitly, spiritual growth, since resisting cravings and making conscious choices is itself a form of exercised willpower. Flexible to any day; adaptable to fat-loss or muscle goals.',
    pairs: [
      {
        id: 'w3p-subjection',
        claim: 'Resisting cravings and making conscious dietary choices trains willpower — the coach names it a form of spiritual exercise.',
        cite: '1:47-2:24',
        refs: ['1 Corinthians 9:27'],
        bridge: 'I keep under my body, and bring it into SUBJECTION — Paul made the body the servant and not the master, and called it training, like an athlete. The secular coach reached the same floor: the fast is a gym for the will. The Word named it discipline; discipline is worship in work clothes.',
      },
      {
        id: 'w3p-not-under-power',
        claim: 'The practice is mastery over appetite — a conscious choice to not be ruled by the craving.',
        cite: '1:16-2:24',
        refs: ['1 Corinthians 6:12'],
        bridge: 'All things are lawful for me, but I will not be brought under the POWER of any. The freedom is real and the food is lawful — but the believer refuses to be governed by appetite. The fast is where that refusal is practiced until it is true.',
      },
    ],
  },
  {
    id: 'w3-women-fueling-counter',
    topic: 'The counter-witness: when the body\'s answer is "arise and eat"',
    source: {
      expert: 'Dr. Stacy Sims',
      credential: 'Exercise physiologist & nutrition scientist, PhD',
      work: 'Intermittent Fasting and Women\'s Physiology (interview)',
      kind: 'video',
    },
    summary: 'The deliberate counter-witness: for most active women — especially in perimenopause — standard fasting protocols can harm metabolism and endocrine function. Fasting plus morning exercise raises cortisol; the kisspeptin/hypothalamic response can dysregulate the thyroid. Better to eat with the circadian rhythm, start the day fueled to blunt the cortisol peak, and not train fasted. Fueling, not fasting, is often the wiser move.',
    pairs: [
      {
        id: 'w3p-arise-and-eat',
        claim: 'Standard fasting can be detrimental to active women\'s metabolism and hormones; the better move is often to fuel appropriately, not to fast harder.',
        cite: '1:24-3:37',
        refs: ['1 Kings 19:5-8'],
        bridge: 'When Elijah was emptied out under the juniper tree, Yahweh\'s remedy was not a longer fast — it was food, twice: Arise and EAT; because the journey is too great for thee. Sometimes the godly, obedient move is to eat. The counter-witness is in the Word too: the depleted body is told to be fed for the journey ahead.',
      },
      {
        id: 'w3p-fully-persuaded',
        claim: 'Women are more metabolically flexible and do not need prolonged fasting for its benefits — one protocol does not fit every body.',
        cite: '1:24-1:53',
        refs: ['Romans 14:5-6'],
        bridge: 'Let every man be fully persuaded in his own mind... he that eateth, eateth to the Lord, for he giveth God thanks. The Word refuses to make eating a single law binding every body the same — freedom, conscience, and thanksgiving govern the table. The one-size fasting rule is exactly what Romans 14 declines to impose.',
      },
      {
        id: 'w3p-eat-for-strength',
        claim: 'Starting the day with nutrition blunts the post-waking cortisol peak; fasted training misses the intensity and load needed for results.',
        cite: '3:40-8:59',
        refs: ['Ecclesiastes 10:17'],
        bridge: 'Princes eat in due season, FOR STRENGTH — the purpose of the well-timed meal is strength for the work. When the work is heavy (the training, the load), the meal is not indulgence; it is provision. Eating for strength is the Word\'s own frame, and it is the counter-witness\'s point exactly.',
      },
    ],
  },
  {
    id: 'w3-sleep-memory',
    topic: 'Sleep, memory, and the beloved\'s rest',
    source: {
      expert: 'Shai Marcu',
      credential: 'Educator (TED-Ed lesson author)',
      work: 'The Benefits of a Good Night\'s Sleep (TED-Ed)',
      kind: 'video',
    },
    summary: 'Sleep is active, not lost time: the brain restructures, moving information from short-term to durable long-term memory. The hippocampus and cortex consolidate declarative memory (facts) during slow-wave sleep; REM consolidates procedural memory (skills). Neuroplasticity forms new synaptic buds overnight — so sleeping after studying beats cramming an all-nighter.',
    pairs: [
      {
        id: 'w3p-beloved-sleep',
        claim: 'Sleep is active and restorative, not wasted time — pulling an all-nighter to cram is worse for memory than resting.',
        cite: '0:06-1:28',
        refs: ['Psalms 127:2'],
        bridge: 'It is vain for you to rise up early, to sit up late, to eat the bread of sorrows: for so He giveth His beloved SLEEP. The all-nighter is named and rebuked three thousand years early — rising early and sitting up late is called vain — and sleep is called a GIFT, not lost time. The educator caught up to the psalm.',
      },
      {
        id: 'w3p-night-consolidation',
        claim: 'Sleep moves information from temporary short-term memory into durable long-term memory — the brain consolidates overnight.',
        cite: '1:46-3:26',
        refs: ['Psalms 63:6'],
        bridge: 'When I remember Thee upon my bed, and meditate on Thee in the NIGHT WATCHES — the psalmist knew the night is when what is held gets settled deep. Consolidation is the mechanism; meditation upon the bed is the practice. What you carry into sleep is what the night writes into you.',
      },
      {
        id: 'w3p-sweet-sleep',
        claim: 'Prioritizing sleep after learning lets the brain solidify it — rest is part of the design, not a failure of discipline.',
        cite: '4:48-5:27',
        refs: ['Proverbs 3:24'],
        bridge: 'When thou liest down, thou shalt not be afraid: yea, thou shalt lie down, and thy SLEEP shall be SWEET. Rest is written into the design as a good thing, not a concession — the same wisdom that says work also says lie down. The one who sleeps after the study is obeying the design, not neglecting it.',
      },
    ],
  },
  {
    id: 'w3-learning-mastery',
    topic: 'The neurobiology of learning, and the diligently-taught word',
    source: {
      expert: 'Dr. Andrew Huberman',
      credential: 'Neuroscientist, Stanford School of Medicine',
      work: 'The Science of Learning & Memory (Huberman Lab)',
      kind: 'video',
    },
    summary: 'Learning strengthens or weakens synaptic connections between existing neurons; it is not intuitive and requires alert, active engagement to flag new information as important. Self-testing shortly after exposure is the single best defense against forgetting; brief gap-effect pauses let the hippocampus replay at speed; interleaving folds new material into existing structures; sleep (especially REM) does the actual consolidation; and consistent, distraction-free time blocks separate the successful.',
    pairs: [
      {
        id: 'w3p-active-engagement',
        claim: 'Learning requires active, alert engagement and repetition to counter the brain\'s natural tendency to forget — passive exposure does not embed.',
        cite: '16:09-19:44',
        refs: ['Deuteronomy 6:6-7'],
        bridge: 'These words... shall be in thine heart: and thou shalt teach them DILIGENTLY unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way. The Word\'s learning method was never passive: diligent, repeated, talked-about, woven through the whole day — active engagement across contexts, exactly what embeds a memory.',
      },
      {
        id: 'w3p-self-testing',
        claim: 'Testing is not only for evaluation — self-testing shortly after exposure is the single best way to inoculate against forgetting and find the gaps.',
        cite: '42:54-55:29',
        refs: ['2 Corinthians 13:5'],
        bridge: 'Examine YOURSELVES, whether ye be in the faith; PROVE your own selves. The Word made self-examination the discipline — testing yourself, not only being tested — long before the neuroscience named it the strongest guard against forgetting. The gap you find in the test is the gap you close.',
      },
      {
        id: 'w3p-give-wholly',
        claim: 'The most successful learners are consistent — dedicated time blocks, minimized distraction, deep uninterrupted focus.',
        cite: '28:29-36:21',
        refs: ['1 Timothy 4:15'],
        bridge: 'Meditate upon these things; give thyself WHOLLY to them; that thy profiting may appear to all. Undivided, consistent devotion is the Word\'s prescription for mastery, and it names the payoff the science measures: profiting that becomes visible. Distraction is the opposite of "wholly."',
      },
      {
        id: 'w3p-interleave-build',
        claim: 'Interleaving — folding new material into related examples and existing knowledge — helps the brain incorporate it into existing structures.',
        cite: '1:33:28-1:36:00',
        refs: ['2 Peter 1:5-8'],
        bridge: 'Add to your faith virtue; and to virtue KNOWLEDGE; and to knowledge temperance... The Word builds by ADDING each new thing onto what is already set — a deliberate, layered interleave, never a single boring stream. Knowledge is stacked onto virtue onto faith; that is how it becomes neither barren nor unfruitful.',
      },
    ],
  },
  {
    id: 'w-haver-midlife-fasting',
    topic: 'The counter-witness, refined: for midlife women, fuel and rhythm over the long fast',
    source: {
      expert: 'Dr. Mary Claire Haver',
      credential: 'OB-GYN & menopause specialist; author of The New Menopause',
      work: 'Women\'s health roundtable (interview)',
      kind: 'video',
    },
    summary: 'A second, named counter-witness on fasting for women in midlife. Men and women differ in how the hypothalamus reads energy: men often tolerate longer fasts, but for perimenopausal / menopausal women a long fast (water or multi-day) can be read as STARVATION — driving visceral fat storage, inflammation, hypothalamic / hormonal disruption toward a low-estrogen state, and (because women use more amino acids for fuel) breakdown of lean muscle, worsened by fasted exercise. Haver names her OWN reversal: she believed fasting helped until she realized she could not meet her protein goals for muscle and health-span within a restricted window, so she changed. The recommended pattern is a gentle, circadian ~12-hour eating window: eat within ~30 minutes of waking, stop 2-3 hours before bed, with protein + fiber at every meal — not fasting through breakfast, not training fasted.',
    pairs: [
      {
        id: 'w3p-haver-due-season',
        claim: 'For midlife women, a long fast can be read as starvation (visceral fat, inflammation, muscle breakdown, a low-estrogen state); fueling for strength is often the wiser move.',
        cite: '1:45:34-1:49:09',
        refs: ['Ecclesiastes 10:17'],
        bridge: 'Thy princes eat IN DUE SEASON, FOR STRENGTH, and not for drunkenness. The Word tied eating to strength and to its right hour — not to extremity. For the midlife woman the strengthening move is to be fueled in due season, not to fast into a famine the body reads as danger.',
      },
      {
        id: 'w3p-haver-circadian-window',
        claim: 'Rather than long fasts, keep a gentle ~12-hour circadian window — eat within ~30 minutes of waking, stop 2-3 hours before bed — with protein and fiber at every meal.',
        cite: '1:45:57-1:47:45',
        refs: ['Psalms 104:23'],
        bridge: 'Man goeth forth unto his work and to his labour UNTIL THE EVENING. The daily rhythm is written into creation: labor and eating by the light, rest through the night. The ~12/12 window keeps that ancient circadian order — fed for the day, at rest by evening.',
      },
      {
        id: 'w3p-haver-prove-all',
        claim: 'Haver changed her own practice when the evidence (protein needs for muscle and health-span) showed prolonged fasting was not serving her — following the data over the trend.',
        cite: '1:44:11-1:45:13',
        refs: ['1 Thessalonians 5:21'],
        bridge: 'PROVE all things; hold fast that which is good. She held the practice up to the evidence and let go of what did not serve — the very posture the Word commends. A claim that fails the proving is released; only the good is held fast. Honest correction is not weakness; it is wisdom.',
      },
      {
        id: 'w3p-haver-renewal',
        claim: 'The cellular "cleaning" (autophagy) and the longer telomeres often credited to extreme fasting can, for midlife women, be reached through exercise as a beneficial stressor plus an anti-inflammatory life — without the hormonal cost of a prolonged fast.',
        cite: '2:32:33-2:33:18',
        refs: ['Psalms 103:5'],
        bridge: 'Who satisfieth thy mouth with good things; so that THY YOUTH IS RENEWED LIKE THE EAGLE’S. The body cleaning and renewing its own worn parts is not a hack found in famine — it is a God-given renewal the Word already sang, and it answers to being SATISFIED with good things and to movement, not to being starved. (And the Word keeps the ordering: bodily exercise "profiteth little" — a real but lesser profit — under godliness, which "is profitable unto all things," 1 Timothy 4:8. Tend the body; do not worship it.)',
      },
      {
        id: 'w3p-haver-inward-renewed',
        claim: 'Worn-out "senescent" cells that stop working yet linger and release harmful signals are lowered by lifestyle (and by helpers such as fisetin) — the body clears what is dead so the living can thrive.',
        cite: '3:27:37-3:28:11',
        refs: ['2 Corinthians 4:16'],
        bridge: 'Though our outward man perish, yet the INWARD MAN IS RENEWED DAY BY DAY. The body does wear — senescent cells are that outward perishing made visible at the cell — and clearing them is good stewardship of the tent we live in. But the Word sets the true hope where no supplement reaches: a renewal DAY BY DAY that outlasts the flesh. Clear the dead cells; keep the deeper renewal first.',
      },
    ],
  },
  {
    id: 'w3-women-midlife-strength',
    topic: 'Midlife women: muscle as survival, the right kind of stress, and a clean environment',
    source: {
      expert: 'Women\'s health roundtable (Sims, Wright, Haver, Crawford)',
      credential: 'Exercise physiology, orthopedic sports medicine, OB-GYN & menopause medicine, reproductive endocrinology',
      work: 'Women\'s health roundtable (interview)',
      kind: 'video',
    },
    summary: 'Beyond fasting, the roundtable names three things standard (often male-derived) advice misses for perimenopausal / menopausal women. (1) MUSCLE is a survival organ, not an aesthetic: it drives glucose metabolism and brain health and defends against osteoporosis, inflammation, and cognitive decline — so building strength is stewardship, not vanity ("strong, not skinny"). (2) The RIGHT KIND of stress matters: high-volume moderate-intensity grinding raises cortisol and inflammation as estrogen\'s buffering falls; POLARIZED training — short high-intensity sprints or heavy resistance to signal positive adaptation, balanced with lots of low-intensity movement — is the better signal. (3) ENVIRONMENT counts: endocrine-disrupting chemicals (e.g. BPA in plastics) harm ovarian health and hormonal regulation, so reducing toxin exposure belongs in the plan. (4) WOMEN ARE NOT SMALL MEN (Dr. Stacy Sims): because most sports/nutrition science ran on MALE data, women were handed protocols built for a body they do not have — and the differences are concrete and documented: the wider Q-angle (hip-to-knee) contributes to a roughly threefold (3-to-1) higher ACL-injury rate in women; women need MORE fuel per kg of lean mass (~30 vs ~15 cal), so fasted training and hard calorie restriction read to the hypothalamus as a stressor and cost muscle and hormones; nutrition/training gains from being adapted across the ~28-day cycle (glucose sensitivity and heat tolerance shift by phase); and creatine (~3-5 g/day), vitamin D3, and omega-3s are specifically useful for women. Perimenopause is a "backwards puberty" (puberty running in the other direction) — the answer is shorter high-intensity work and resistance training, not endless steady-state cardio. (5) THE SPECIFICS, stated plainly: creatine ~3-5 g/day with NO loading phase; vitamin D3 and omega-3s (omega-3s help inflammation into perimenopause); IRON matters — active women often feel better with ferritin around 50-100 ng/mL, not merely inside the broad low-population range; PROTEIN needs rise with age ("anabolic resistance") so higher, evenly-spread intake protects muscle and bone; cold and heat protocols differ (cold plunge warmer, around 15 C; more heat time for the same cardiovascular adaptation); perimenopause can begin as early as age 35 and its symptoms are often dismissed, so women should ASK questions and push for real investigation rather than accept a birth-control-only answer, with lifestyle/nutrition/exercise the first tools and HRT a real option for quality of life. The hopeful truth: the "other side" of the transition can be healthy and vital when bone and muscle are stewarded through it. This is not a "both-sides" question; it is established, sex-specific physiology, and being handed the men\'s manual was a real gap.',
    pairs: [
      {
        id: 'w3p-women-strength-organ',
        claim: 'Muscle is a metabolic survival organ (glucose control, brain health, defense against osteoporosis and decline); building strength in midlife is stewardship, not vanity — "strong, not skinny."',
        cite: '0:00:09-0:00:28, 0:32:00-0:32:38',
        refs: ['Proverbs 31:17'],
        bridge: 'She GIRDETH HER LOINS WITH STRENGTH, and STRENGTHENETH HER ARMS. The Word\'s portrait of the excellent woman is a strong one — arms made strong for the work set before her. Strength here is not vanity; it is capacity to serve and to endure. The science that names muscle a survival organ only underlines a strength the Word already honored in her.',
      },
      {
        id: 'w3p-women-adaptive-stress',
        claim: 'The right kind of stress builds; the wrong kind wears down. Short, hard efforts (sprints, heavy resistance) plus ample easy movement signal adaptation, while chronic moderate grinding raises cortisol and inflammation.',
        cite: '0:12:06-0:14:31, 1:47:50-1:48:40',
        refs: ['Hebrews 12:11'],
        bridge: 'No chastening for the present seemeth to be joyous, but grievous: nevertheless afterward it yieldeth the PEACEABLE FRUIT of righteousness unto them which are EXERCISED thereby. The Word already knew that a rightly-borne, bounded stress yields fruit afterward — and its word is "exercised." The lesson is the same in the body: a short, honest hard effort that then RESTS produces growth; an unremitting grind with no rest only wears the temple down.',
      },
      {
        id: 'w3p-women-clean-temple',
        claim: 'Endocrine-disrupting chemicals (like BPA in plastics) harm ovarian and hormonal health; reducing toxin exposure is part of caring for the body.',
        cite: '3:31:11-3:32:30',
        refs: ['1 Corinthians 3:16-17', '2 Corinthians 7:1'],
        bridge: 'Know ye not that ye are the TEMPLE of God... If any man DEFILE the temple of God, him shall God destroy; for the temple of God is HOLY. If the body is a temple, then what we let into it and around it is not a small thing. Guarding it from needless defilement — the toxins we can reasonably keep out — is honoring the One whose Spirit dwells in it. (Compare 2 Corinthians 7:1: "let us cleanse ourselves from all filthiness of the flesh and spirit.")',
      },
      {
        id: 'w3p-women-faithful-least',
        claim: 'You cannot avoid every toxin, and trying to is paralyzing — but small, consistent choices compound (swap plastic for glass, decline the thermal receipt, read a label). The cumulative effect of daily choices, over time, is the real lever; agency is an investment, not perfection.',
        cite: '2:12:36-2:15:58',
        refs: ['Luke 16:10', 'Zechariah 4:10'],
        bridge: 'He that is FAITHFUL in that which is LEAST is faithful also in much. The Word does not ask for a toxin-free life it never promised; it honors faithfulness in the small, repeated thing — the one swap, the one label read today. And it forbids the despair that says a small step is pointless: "who hath DESPISED the day of small things?" (Zechariah 4:10). Little faithfulnesses, compounded, are how a temple is tended — never anxiety, never a law that condemns; a steady, hopeful stewardship.',
      },
    ],
  },
];

// Verbatim verse text for a witness ref — same verified rail as the Godhead
// Study, no second source of truth.
export function witnessVerse(ref) {
  return godheadVerse(ref);
}

// THE SEPARATION, rendered generally (Darrell 2026-07-03: "separates for the
// practice only, stays mixed for those of us who need that"). This strips the
// bridge and the verses, leaving the cited claim + where-in-the-work + full
// expert credit (honour to whom honour, Romans 13:7). No Scripture rides along
// — that is the point of the separation — but the science is never anonymous.
//
// INFORM, DON'T GUARD (Darrell 2026-07-04: "knowledgeable is the goal... being
// informed is the best so we want to be informed and offer Architect quality
// information... we only let people choose what they want but why guard anything
// except training videos explicitly for the msw workers"). The separation is a
// CHOICE the reader makes (mixed vs science-only), not a wall that withholds.
// The one true access gate is the clinician CE / MSW-worker TRAINING track; the
// wellness information itself is offered to everyone, with a plain consult-your-
// physician note and the counter-witness so it is never a one-size directive.
export function witnessScienceOnly(source) {
  return {
    id: `sci-${source.id}`,
    topic: source.topic,
    source: source.source,
    summary: source.summary,
    points: source.pairs.map((p) => ({ id: p.id, claim: p.claim, cite: p.cite })),
  };
}

// -----------------------------------------------------------------------------
// THE SEPARATION (Darrell 2026-07-03: "the separation is the same content for
// Practice for those who don't want the mixture so differentiate the lessons
// and also the level of the brain so all learners can learn" — refined:
// "separates for the practice only, stays mixed for those of us who need
// that"). Two renderings of the same content, one per house:
//   * the study room — ALWAYS intertwined: science + Word together, for those
//     of us who need the mixture;
//   * the Practice — this builder: client-track psychoeducation, expert cited,
//     NO Scripture in the clinical space, differentiated child through senior.
//
// INFORM, DON'T GUARD (Darrell 2026-07-04: "knowledgeable is the goal... being
// informed is the best... we only let people choose what they want but why
// guard anything except training videos explicitly for the msw workers"). The
// wellness information is OFFERED to clients, not withheld — the safety is in
// informing (a plain consult-your-physician note + the counter-witness that it
// is never one-size), not in hiding. The only access gate is the clinician CE /
// MSW-worker TRAINING track. Every module still rides the track's publish-
// validation gate (a quality gate applied equally to all lessons, not a wall).
// -----------------------------------------------------------------------------
// Engine-shaped module (learn-framework levels + quiz) for the TLC client
// track: psychoeducation, not treatment; rides the track's LCSW validation
// gate like every other client lesson.
export function witnessClientModule() {
  return {
    id: 'cl4-bouncing-back-setbacks',
    title: 'Bouncing back from a setback (brain-based)',
    bigIdea: 'Setbacks cause a real dopamine dip and stress response — recovery is biological as well as emotional: act small before motivation arrives, shrink the step, feed dopamine sustainably, anchor in routine, and practice self-compassion. Source: Dr. Tracey Marks (psychiatrist), The Neuroscience of Setbacks.',
    source: 'Dr. Tracey Marks, psychiatrist — The Neuroscience of Setbacks (video)',
    levels: {
      child: 'When something goes wrong, your brain\'s happy fuel dips and everything feels heavy for a while. That is normal! Try one tiny job — like tidying one shelf — and your engine starts again. And be kind to yourself, the way you would be to a friend.',
      teen: 'A setback makes your brain\'s motivation chemical (dopamine) drop — so feeling flat is not laziness, it is biology. Do not wait to feel motivated: do one small thing (send one message, clear one corner). Break big tasks into tiny steps, skip the endless scroll (a quick fix that fades), move your body, see a friend — and talk to yourself kindly. Your brain works better with a coach than a bully.',
      standard: 'When reality misses expectations, dopamine drops (apathy, "mental whiplash"), stress dampens the prefrontal cortex while the amygdala over-fires, and rumination can relabel an external setback as personal failure. Brain-based recovery: behavioral activation (small structured action before motivation), micro-goals (steps small enough not to trip the stress response), sustainable dopamine (movement, connection, novelty, completed tasks — not scrolling or snacking), routine as an anchor without harsh self-talk, and self-compassion, which engages the caregiving system and re-engages the prefrontal cortex.',
      senior: 'Setbacks framed as recalibration, not verdict: expectation-violation lowers dopaminergic tone; stress shifts control from prefrontal to limbic systems; default-mode rumination consolidates a failure narrative. Evidence-informed countermeasures — behavioral activation, graded micro-goals, sustainable reward scheduling, routine to reduce decision fatigue, and self-compassion as threat-system down-regulation — offered as psychoeducation with a clear invitation to professional support where needed.',
    },
    quiz: { questions: [
      { q: 'Feeling flat after a setback is best understood as…', options: ['Laziness or weak character', 'A real dopamine dip — biology, not a verdict', 'A sign you should give up'], answer: 1, explain: 'The motivation dip is physiological. Understanding it removes the shame and opens the recovery moves.' },
      { q: 'The most effective first move when motivation is gone is to…', options: ['Wait until motivation returns', 'Take one small structured action', 'Push through the biggest task on the list'], answer: 1, explain: 'Behavioral activation: small action jump-starts the dopamine system — motivation follows action, not the other way around.' },
    ] },
  };
}

// Metabolic-wellness INFORMATION for the client track — OFFERED, not withheld
// (Darrell 2026-07-04: inform, don't guard). A plain-language digest of the
// cited fasting/fueling/sleep experts, science-only (no Scripture in the
// clinical space), age-differentiated, and safe by INFORMING: every level
// carries the consult-your-physician frame and the Sims counter-witness so it
// reads as an informed choice, never a directive to fast. The child/teen levels
// teach the general body-rhythm concept and explicitly leave fasting to adults-
// with-a-doctor; the deeper levels carry the actual science with the caveats.
export function witnessWellnessModule() {
  return {
    id: 'cl5-metabolic-wellness-informed',
    title: 'Metabolic wellness: fasting, fueling, and sleep (informed choice)',
    bigIdea: 'A plain-language digest of what cited experts say about meal timing, fasting, whole foods, and sleep — offered as information so you can make an informed choice with your physician. Not a prescription: for many people (especially active women, anyone in perimenopause, and anyone with a history of disordered eating) fueling well matters more than fasting. Always consult your physician before changing how you eat. Sources: Huberman, Jamnadas, Fung, Goldhamer, Malthaner, Sims, Marcu.',
    source: 'Cited experts (Huberman, Jamnadas, Fung, Goldhamer, Malthaner, Sims, Marcu) — full citations in the 3rd-Dimension Witness',
    levels: {
      child: 'Your body has two modes: eating time (build) and resting time (repair) — and sleep is when your brain saves what you learned that day. Whole foods and good sleep help your body do its jobs. Choices like skipping meals are for grown-ups to decide with a doctor, not for kids.',
      teen: 'Experts describe the body running a build state when you eat and a repair state when you rest, with sleep locking in memory. Whole foods, regular meals, and real sleep support all of it. Fasting is an adults-with-a-doctor topic, and it is not right for everyone — so this is information to think about, not advice to act on.',
      standard: 'Cited clinicians describe meal-timing and fasting acting on insulin, metabolic flexibility, autophagy (cellular cleanup), and brain factors like BDNF — while a deliberate counter-view (Dr. Stacy Sims) notes standard fasting can harm many active women and those in perimenopause, where fueling appropriately is wiser. Whole foods over processed, and sleep for memory consolidation, are broadly agreed. Offered as information to discuss with your physician — not a protocol, and not something to attempt with a history of disordered eating without medical guidance.',
      senior: 'A synthesis offered as psychoeducation, not prescription: time-restricted eating and fasting appear in the cited literature as levers on insulin sensitivity, metabolic flexibility, autophagy, and neurotrophic factors, with strong individual variation — alongside an explicit counter-witness that prolonged fasting is often suboptimal or harmful for active and perimenopausal women. Whole-food quality and sleep-based memory consolidation are the low-controversy anchors. Any change is a decision to make with a physician, and the material is unsuitable as guidance for a disordered-eating history absent clinical oversight.',
    },
    quiz: { questions: [
      { q: 'This wellness lesson is best understood as…', options: ['A fasting protocol to start now', 'Cited information to weigh with your physician', 'Medical treatment'], answer: 1, explain: 'It is cited information for an informed choice — not a prescription. Medical topics belong with your physician.' },
      { q: 'The counter-view included here says prolonged fasting is…', options: ['Ideal for everyone', 'Often suboptimal or harmful for many active and perimenopausal women', 'Required for good health'], answer: 1, explain: 'Dr. Stacy Sims\' counter-witness: for many active women, fueling appropriately beats prolonged fasting. It is never one-size.' },
    ] },
  };
}

// Both client-track witness modules, in order. The TLC client track spreads
// this — informing the client with the wellness digest too, not only the
// setback lesson (inform, don't guard).
export function witnessClientModules() {
  return [witnessClientModule(), witnessWellnessModule()];
}
