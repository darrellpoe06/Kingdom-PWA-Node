// =============================================================================
// learn-discover-concepts — the everyday ideas people type, and the words the
// curriculum uses for them
// =============================================================================
// A person asks "Why am I always stressed?" The curriculum says anxiety, peace,
// cast your care, be anxious for nothing. This is the bridge, written as data:
// each concept lists what a reader might type (`say`) and the words the
// lessons use (`find`). A query that touches `say` also searches `find`, at a
// lower weight than the words the person actually typed, so a literal match
// always outranks an inferred one.
//
// Every word here is stemmed with the same function the index uses
// (learn-discover-text.js), at load. A concept is a DECISION about meaning, so
// it is written down, not guessed by a model: no vendor, no per-query cost.
// Pure data; unit-tested against the real catalog in learn-discover-search.test.js.
// =============================================================================
import { stems } from './learn-discover-text.js';

// `seeds` are lessons read by hand as true answers; they are boosted only when the reader typed one of `seedOn`
// (a concept can be triggered by many words, but only some of them ask what the seeds answer).
const C = (id, say, find, cat = null, seeds = [], seedOn = '') => ({ id, say, find, cat, seeds, seedOn });

export const CONCEPTS = [
  C('stress', 'stress stressed stressful overwhelmed pressure burnout tired exhausted anxious anxiety worry worried worrying nervous panic restless',
    'peace worry anxious anxiety fear rest burden care trust cast calm quiet comfort trouble weary sabbath mind thought', 'wellness'),
  C('marriage', 'marriage married husband wife spouse couple dating wedding divorce engaged romance relationship relationships',
    'marriage husband wife covenant love one flesh submit honour faithful household home unity couple bride bridegroom', 'marriage'),
  C('parenting', 'parenting parent parents child children kids kid raise raising teenager teen son daughter family families discipline',
    'children child train up mother parent parents teenager teen instruct discipline inheritance little ones nurture rearing', 'parenting'),
  C('debt', 'debt debts mortgage mortgages owe loan loans credit borrow borrowing broke bills payoff paycheck poor poverty',
    'debt borrow lender lend surety servant creditor owe pay interest usury loan credit bondage save wealth stewardship', 'money'),
  C('home', 'home house buy buying buyer mortgage homeowner homeownership property landlord rent renting rental real estate down payment',
    'house home land property mortgage buy purchase inspect appraisal lease tenant landlord rent estate title closing inheritance', 'realestate'),
  C('forgive', 'forgive forgiveness forgiving grudge bitter bitterness resentment hurt offended apologize reconcile mercy',
    'forgive forgiven forgiveness bitterness offence reconcile pardon trespass repent repentance confess apology apologise remorse wronged avenge'),
  C('purpose', 'purpose calling calling destiny meaning vision direction goal goals gifts talent gift passion',
    'purpose calling called gift talent work vision plan appoint steward serve mission fruit direction path', 'purpose'),
  C('leader', 'leader leaders leadership lead leading manager manage influence boss team serve pastor',
    'lead leader leadership shepherd serve servant steward elder overseer example humble wisdom guide govern authority office', 'leadership'),
  C('closer', 'closer closeness intimacy devotion devotional spiritual',
    'prayer pray worship draw near abide spirit holy seek fellowship devotion walk obey voice listen presence closet secret taste sing senses seek communion quiet delight', 'faith',
    // Read and chosen by hand (2026-11-26): the lessons that are truly about drawing near to Yahweh. The curriculum
    // teaches this in parables and word studies whose titles do not say "closer", so words alone cannot find them.
    ['ll17-taste-and-see', 'ea-gh-closet', 'll127-the-firsts-what-yahweh-did-in-each-century-that-had-never-been-done-before', 'll109-how-we-know-yahwehs-love-taste-see-hear-touch-experienced-at-every-age', 'll36-fruit-root-and-the-empty-house', 'll59-not-by-measure-all-of-him-from-day-one', 'll56-the-person-of-the-holy-spirit-seek-the-deliverer-not-deliverance', 'ea-gh-fruit-no-law', 'ea-gh-keep-yourself-by-the-word', 'll96-doers-of-the-word-competence-by-doing-and-the-minds-tactics-daily', 'll184-he-sings-yahweh-over-you-jesus-in-the-midst-of-you', 'll26-how-the-king-knows-his-kings', 'll83-keep-thy-heart-the-conditions-of-growth'],
    'closer closeness intimacy devotion spiritual'),
  C('prayer', 'prayer prayers pray praying worship',
    'prayer pray ask seek knock closet petition intercession name amen worship kneel', 'faith'),
  C('money', 'money finance finances financial wealth income budget saving savings invest investing investment retire retirement tithe giving generous',
    'money wealth riches treasure steward tithe give save invest increase poor rich provision talent labour wage', 'money'),
  C('business', 'business entrepreneur entrepreneurship startup company employee career work job boss customer sell selling market marketing profit',
    'business work labour diligent merchant trade buy sell profit market employer employee wage wise plan company enterprise', 'business'),
  C('history', 'history historical past ancestor ancestors heritage slavery black african america american civil rights culture',
    'history historical nation people empire ancestor heritage tribe covenant truth record slavery america world kingdom', 'history'),
  C('tech', 'technology tech computer ai artificial intelligence chatbot chatgpt llm gpt software coding code data digital app phone internet innovation',
    'technology machine model data algorithm tool computer software network build design system digital intelligence', 'tech'),
  C('health', 'health healthy diet exercise sleep weight body healing sick sickness disease fitness',
    'health body temple heal healing sick strength food eat rest fast wellness medicine', 'wellness'),
  C('fear', 'fear afraid scared courage brave doubt',
    'fear afraid courage strong strength fear not trust confidence doubt faith tomorrow', 'wellness'),
  C('grief', 'grief grieve loss death mourning lonely loneliness sad sorrow depressed depression hopeless hope',
    'comfort mourn sorrow grief hope tears loss death comforter joy heal heart broken', 'wellness'),
  C('anger', 'anger angry temper rage patience patient',
    'anger wrath patience temper slow self control meek peace soft answer', 'wellness'),
  C('truth', 'truth lie lies honest honesty integrity deceive deception',
    'truth honest integrity lie deceit true witness speak just upright righteous'),
  C('lonely', 'lonely loneliness alone isolated friend friends friendship belong abandoned rejected forgotten',
    'alone friend fellowship comfort forsake companion presence body belong neighbour father fatherless stranger welcome together', 'wellness'),
  C('conflict', 'conflict argue arguing argument fight fighting quarrel division strife disagree tension hostile',
    'strife quarrel contention peace reconcile forgive brother offend division anger tongue answer gentle patience agree unity', 'marriage'),
  C('church', 'church congregation pastor sermon sunday member membership ministry fellowship worship',
    'church body assembly congregation pastor elder shepherd fellowship office teach flock member gather', 'leadership'),
  C('suffering', 'suffering suffer pain hardship trial trials tragedy struggle struggling evil unfair persecution',
    'suffer trial affliction refine tribulation comfort sorrow trouble endure patience test hope hard', 'wellness'),
  C('saving', 'saving save savings spend spending afford affordable cheap expensive cost rent price',
    'save budget provision store thrift wise spend steward price afford wage income cost rent pay', 'money'),
  C('job', 'job jobs employed employment unemployed fired laid career coworker workplace work boss paycheck',
    'work labour wage provision employ boss master servant diligent income trust provision career', 'business'),
  C('children-learn', 'read reading letters count counting school homework toddler preschool',
    'read count number letter learn teach little child train measure', 'parenting'),
  C('steward', 'steward stewards stewardship manage manager management accountable account responsibility',
    'steward stewardship talent faithful servant account manage trust own harvest ownership provision resource', 'money'),
  C('sleep', 'sleep sleepless sleeping insomnia nightmare',
    'sleep rest night bed tired peace worry anxious calm quiet', 'wellness'),
  C('ai', 'ai chatgpt gpt llm chatbot chatbots',
    'machine model algorithm data truth verify test prove source claim trust privacy honest answer', 'tech'),
];

// The states of heart and mind where the lesson's own title rarely says the word a reader types ("anxiety", "lonely",
// "peace"): there the concept's words count nearly as much as the typed ones. Topical nouns (debt, marriage, investing) do not need it.
const FOCUSED = new Set(['stress', 'sleep', 'lonely', 'grief', 'anger', 'fear', 'suffering', 'conflict', 'forgive']);

const compiled = CONCEPTS.map((c) => ({ id: c.id, cat: c.cat, seeds: c.seeds || [], seedOn: new Set(stems(c.seedOn || '')), say: new Set(stems(c.say)), find: [...new Set(stems(c.find))] }));

/**
 * The words the curriculum uses for what was typed. `typed` is the stemmed
 * subject words of the query; the result never repeats a typed word.
 * @returns {{ words: string[], ids: string[] }}
 */
export function conceptsFor(typed) {
  const have = new Set(typed);
  const words = new Set();
  const ids = [];
  const cats = new Set();
  const seeds = new Set();
  for (const c of compiled) {
    let hit = false;
    for (const t of typed) if (c.say.has(t)) { hit = true; break; }
    if (!hit) continue;
    ids.push(c.id);
    if (c.cat) cats.add(c.cat);
    if (c.seeds.length && typed.some((t) => c.seedOn.has(t))) for (const id of c.seeds) seeds.add(id);
    for (const w of c.find) if (!have.has(w)) words.add(w);
  }
  // PURE: every typed word is one a concept answers ("anxiety", "prayer", "peace"), so the concept IS the question.
  const pure = typed.length > 0 && typed.every((t) => compiled.some((c) => FOCUSED.has(c.id) && c.say.has(t)));
  return { words: [...words], ids, cats: [...cats], seeds, pure };
}

/** Every plain word the concept map knows, unstemmed, so a mistyped one can be put right. */
export function conceptWords() {
  const out = new Set();
  for (const c of CONCEPTS) for (const w of `${c.say} ${c.find}`.split(/\s+/)) if (w.length >= 4) out.add(w);
  return out;
}

/** Is this stemmed word one a concept answers? Such a word is the subject even when it is common ("ai"). */
export function isConceptWord(stemmed) {
  return compiled.some((c) => c.say.has(stemmed));
}
