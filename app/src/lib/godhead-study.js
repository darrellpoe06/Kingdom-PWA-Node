// =============================================================================
// godhead-study — THE GODHEAD STUDY: the Bible's deterministic algorithms,
// Torah through Revelation (Darrell 2026-07-03).
// =============================================================================
// "Can you go through the entire Bible and find the deterministic algorithms
// so we can have that as a Thorough Study Of The Living GodHead — Forever
// Eternal Beings asking us to become a bloodline family... everyone gets their
// turn to be tested by the Lord... even His Son had to come off the Throne of
// Glory... just the meek — those who have strength to fight but they are under
// control of The Holy Spirit, The General... We're expected to die daily so we
// can be ready at any time to go Home... it's all your choices."
//
// Each entry is a DETERMINISTIC pattern the Word itself states — an if/then
// the Living Godhead declared, that runs the same in the eternal (4D) and in
// this-world life (3D). CONDITION and CONSEQUENCE are stated in the verse's
// own logic; the 3D line is the practice; the OUTCOME is what you win with it.
//
// SCRIPTURE INTEGRITY (DR-0076 / SCRIPTURE-REFERENCE-STANDARD): this file
// carries REFERENCES ONLY. Verse text lives in godhead-study-verses.json,
// fetched VERBATIM from a public-domain KJV source by
// scripts/fetch-godhead-verses.mjs (hard-fails on any unresolvable ref), and
// the test suite re-verifies every ref resolves. No verse is ever produced
// from model memory. Typographic theology per CLAUDE.md throughout.
//
// PURE + dependency-light: node-testable; the church surface renders it; the
// game deals it (godheadToGameCards — "all eternal algorithms going into the
// game so they can be further aware of the Word").
// =============================================================================
import VERSES from './godhead-study-verses.json';

export const GODHEAD_SECTIONS = [
  { key: 'torah',      label: 'Torah & History',  blurb: 'The covenant patterns — blessing and curse, blood and passover, the choice set before every house.' },
  { key: 'wisdom',     label: 'Wisdom & Psalms',  blurb: 'The grain of the created order — how trust, humility, delight, and the fear of the LORD actually run.' },
  { key: 'prophets',   label: 'The Prophets',     blurb: 'Yahweh states His own conditionals — return and He returns, prove Him in the tithe, His Word never returns void.' },
  { key: 'gospels',    label: 'The Gospels',      blurb: 'The King states the Kingdom\'s mechanics — seek first, forgive to be forgiven, build on the rock, lose your life to find it.' },
  { key: 'epistles',   label: 'The Epistles',     blurb: 'The Body walking it out — die daily, renew the mind, resist and he flees, humble yourself and be exalted.' },
  { key: 'revelation', label: 'Revelation',       blurb: 'The end states — the overcomer\'s throne, the crown for the faithful, and what can never enter the City.' },
];

// =============================================================================
// EACH BOOK IS ITS OWN MASTERPIECE (Darrell 2026-07-03: "Proverbs Algorithms
// are for the kings of The Eternal King and simultaneously for the Way...
// Psalms — each book is its own masterpiece.") One identity line per book the
// catalog currently draws from; the study surfaces it and filters by book.
// =============================================================================
export const BOOK_MASTERPIECES = {
  'Genesis':       'The book of beginnings — the Word speaking worlds into being, the garden, the fall, the giants in the earth, and the seed of the woman promised against the serpent.',
  'Exodus':        'The rescue masterpiece — the Blood, the passover, and a people walked out of what owned them.',
  'Numbers':       'The wilderness-census book — a generation numbered and sifted between the promise and the land; the giants seen, and the report that believed them over God.',
  'Deuteronomy':   'The covenant restated on the doorstep — the choice set before every generation about to cross over.',
  'Joshua':        'The taking of what was promised — allegiance declared out loud, house by house.',
  '1 Samuel':      'The kingmaker\'s book — the LORD who looks on the heart, and tells His prophet in his ear a day before the man arrives; the appointment briefed before it walks in.',
  '1 Kings':       'The divided-kingdom book — fire on Carmel, the still small voice, and provision commanded ahead at a widow\'s door before the prophet ever arrives.',
  '2 Chronicles':  'The kings measured by one question — did the house seek Him? Humility heals the land.',
  'Nehemiah':      'The rebuilding book — the wall up in fifty-two days, the Word read aloud to the people, and joy as the strength of the restored.',
  'Job':           'The suffering-and-sovereignty masterpiece — the righteous man stripped to nothing, and the Voice from the whirlwind; in whose hand is the soul of every living thing and the breath of all mankind.',
  'Psalms':        'The heart\'s whole range before Yahweh — praise, ache, war, rest — each psalm its own room in the masterpiece.',
  'Proverbs':      'The kings\' algorithm book — written for the kings of The Eternal King and simultaneously for The Way; wisdom as executable one-liners.',
  'Isaiah':        'The masterpiece of majesty and the Servant — the throne room and the wounds, in one scroll.',
  'Jeremiah':      'The weeping prophet\'s book — the Word found and EATEN as the heart\'s joy, fire shut up in the bones, and a new covenant written on hearts.',
  'Ezekiel':       'The watchman\'s book — every soul answers for itself, and dead bones learn to stand.',
  'Daniel':        'The furnace-and-throne book — allegiance under empire, and the Kingdom that outlasts them all.',
  'Malachi':       'The last word before the silence — prove Me now, and the Sun of righteousness rising.',
  'Matthew':       'The King\'s gospel — the Kingdom\'s constitution preached from a mountain.',
  'Mark':          'The servant\'s gospel — the Son of man come not to be ministered unto but to minister; immediate and active, the Word done more than discussed.',
  'Luke':          'The physician\'s gospel — the meticulous mercy of God, table by table.',
  'John':          'The eternal gospel — in the beginning was the Word; belief unto life, written that ye might believe.',
  'Acts':          'The Body-in-motion book — the Spirit poured out and the Gospel walking to the ends of the earth; the God in whom we live, and move, and have our being.',
  'Romans':        'The legal masterpiece — the whole case of the Gospel argued to a verdict: no condemnation.',
  '1 Corinthians': 'The Body\'s house rules — gifts, order, love, and resurrection, written to a messy real church.',
  '2 Corinthians': 'Strength in the cracked jar — treasure in earthen vessels, grace sufficient, the cheerful sower.',
  'Galatians':     'The freedom letter — no other gospel, the Spirit\'s fruit against the flesh\'s works, and burdens carried together.',
  'Ephesians':     'The seated-in-heavenly-places letter — chosen before the foundation of the world, the Body one, the armour on.',
  'Colossians':    'The preeminence letter — all things created by Him and for Him, held together in Him; the Head of the Body, first in everything.',
  'Philippians':   'The joy-from-a-cell letter — the mind of Christ descending, and every knee bowing.',
  '1 Timothy':     'The house-conduct letter — how to behave in the house of God; godliness with contentment is great gain, and the good fight of faith is fought, not felt.',
  '2 Timothy':     'The baton letter — study approved, endure hardness, commit the Word to faithful men who teach others also; a crown laid up at the finish.',
  'Hebrews':       'The better-covenant masterpiece — a great High Priest, faith\'s hall, and the assembling not forsaken.',
  'James':         'The doing book — faith with its sleeves rolled up; hearers become doers or deceive themselves.',
  '1 Peter':       'The furnace letter — tried gold, a royal priesthood, and hope that suffering cannot repossess.',
  '2 Peter':       'The last-testament letter — the sure Word of prophecy against the scoffers, the day of the Lord as a thief, and the angels that sinned not spared.',
  '1 John':        'Inside LOVE — God is love, and the dwelling is mutual; assurance written in family language.',
  '3 John':        'The shortest letter with the widest wish — that thou mayest prosper and be in health, even as thy soul prospereth; walking in truth as the elder\'s joy.',
  'Jude':          'The contend-for-the-faith letter — the angels who left their own estate reserved in chains, and the call to keep yourselves in the love of God.',
  'Revelation':    'The unveiling — the Lamb wins, the overcomers are seated, and nothing unclean enters the City.',
};

// "1 Corinthians 15:31" -> "1 Corinthians"
export function bookOf(ref) {
  const m = String(ref || '').match(/^([1-3]?\s?[A-Za-z ]+?)\s+\d/);
  return m ? m[1].trim() : '';
}

// Books actually present in the catalog, in canon-ish encounter order.
export function booksInCatalog() {
  const seen = [];
  for (const a of GODHEAD_ALGORITHMS) {
    for (const r of a.refs) {
      const b = bookOf(r);
      if (b && !seen.includes(b)) seen.push(b);
    }
  }
  return seen;
}

export function algorithmsForBook(book) {
  return GODHEAD_ALGORITHMS.filter((a) => a.refs.some((r) => bookOf(r) === book));
}

// Every entry: refs (KJV text resolved from the verified JSON), condition (the
// IF as the verse states it), consequence (the THEN), threeD (the practice),
// outcome (what you win with it), tags.
export const GODHEAD_ALGORITHMS = [
  // ── TORAH & HISTORY ────────────────────────────────────────────────────────
  {
    id: 'gh-choose-life', section: 'torah', name: 'Choose This Day (life and death set before you)',
    refs: ['Deuteronomy 30:19'],
    condition: 'Life and death, blessing and cursing, are SET before you — the choice is real and yours.',
    consequence: 'Choosing life means you AND your seed live — the choice compounds down the bloodline.',
    threeD: 'Every day is a ballot. It is all your choices, not just one — each one either eats at His table or another. Choose like your children inherit the choice, because they do.',
    outcome: 'A life — and a family line — pointed Home on purpose instead of by drift.',
    psyche: 'Deciding once at the identity level (we serve the LORD) collapses a thousand daily willpower battles into one settled commitment — the psychology of pre-decision.',
    tags: ['choice', 'covenant', 'family', 'bloodline'],
  },
  {
    id: 'gh-obedience-blessing', section: 'torah', name: 'Hearken → Blessings Overtake You',
    refs: ['Deuteronomy 28:1-2'],
    condition: 'Hearken DILIGENTLY to the voice of the LORD and observe to do His commandments.',
    consequence: 'Blessings come on you and OVERTAKE you — you do not have to chase what is chasing you.',
    threeD: 'Obedience is the input; provision is the output that hunts you down. Stop engineering the blessing and engineer the obedience.',
    outcome: 'You stop chasing outcomes because the outcomes are assigned to chase you.',
    tags: ['obedience', 'blessing', 'provision'],
  },
  {
    id: 'gh-passover-blood', section: 'torah', name: 'The Blood on the Doorpost (when I see the blood)',
    refs: ['Exodus 12:13'],
    condition: 'The blood applied where it can be SEEN — a token on YOUR house.',
    consequence: 'Judgment passes over. Not because the house is better — because the blood is on it.',
    threeD: 'Coverage is applied, not assumed. Put yourself and your house visibly under the Blood of the Lamb — confession, communion, obedience — and stop trusting the quality of your own doorframe.',
    outcome: 'Security that rests on His mark, not your performance — the judgment that passes over your house.',
    tags: ['blood', 'covering', 'passover', 'house'],
  },
  {
    id: 'gh-house-serve', section: 'torah', name: 'As For Me and My House',
    refs: ['Joshua 24:15'],
    condition: 'Choose you THIS DAY whom ye will serve — the head of the house declares it out loud.',
    consequence: 'The house has a direction because someone took responsibility for pointing it.',
    threeD: 'The Governor of a family names the family\'s allegiance publicly and builds the systems that serve it. An undeclared house gets discipled by the culture instead.',
    outcome: 'A household with a stated King — decisions get simpler because the allegiance is already settled.',
    tags: ['family', 'leadership', 'declaration'],
  },
  {
    // Darrell 2026-07-03: "Joy Of The Lord comes and no one can take it and
    // it's our strength according to the Word Of Yahweh!!!"
    id: 'gh-joy-untakeable', section: 'torah', name: 'The Joy of the LORD (your strength — and no man taketh it)',
    refs: ['Nehemiah 8:10', 'John 16:22'],
    condition: 'Receive the joy OF THE LORD — sourced in Him, not in the day\'s conditions — the joy that comes when He comes.',
    consequence: 'It IS your strength — and "your joy no man taketh from you": the power supply is both load-bearing AND theft-proof, by the King\'s own word.',
    threeD: 'Guard the source, not the circumstances: joy drawn from Yahweh cannot be repossessed by an economy, a diagnosis, a betrayal, or a headline — no one can take what no one gave. When strength runs low, check whether you have been drawing joy from takeable things.',
    outcome: 'Strength on an unstealable supply line — joy that survives everything the 3rd dimension throws, because its source is not in the 3rd dimension.',
    psyche: 'Joy anchored to externals fluctuates with them; joy anchored to an unchanging relationship is the most durable affect a person can hold — and durable positive affect is itself measurable strength under load.',
    tags: ['joy', 'strength', 'untakeable', 'nehemiah'],
  },
  {
    id: 'gh-humble-heal', section: 'torah', name: 'If My People Humble Themselves',
    refs: ['2 Chronicles 7:14'],
    condition: 'HIS people humble themselves, pray, seek His face, and TURN from their wicked ways.',
    consequence: 'He hears from Heaven, forgives the sin, and heals the LAND — the geography changes.',
    threeD: 'Revival mechanics start with the family of God, not the culture. Repentance inside the house precedes healing outside it.',
    outcome: 'Forgiveness and healed ground — the environment itself responds to a humbled people.',
    tags: ['humility', 'repentance', 'healing', 'revival'],
  },

  // ── WISDOM & PSALMS ───────────────────────────────────────────────────────
  {
    id: 'gh-trust-paths', section: 'wisdom', name: 'Trust → Directed Paths',
    refs: ['Proverbs 3:5-6'],
    condition: 'Trust in the LORD with ALL thine heart; lean NOT unto thine own understanding; acknowledge Him in ALL thy ways.',
    consequence: 'He directs thy paths — the routing is His problem once the trust is total.',
    threeD: 'Bring every decision — money, work, family — under acknowledgment before acting. Partial trust gets partial routing.',
    outcome: 'Direction you did not have to manufacture — the path straightens under your feet.',
    psyche: 'Leaning on your own understanding under uncertainty breeds rumination; surrendered trust offloads the unknowns and measurably lowers the anxiety load of decision-making.',
    tags: ['trust', 'guidance', 'decisions'],
  },
  {
    id: 'gh-blessed-tree', section: 'wisdom', name: 'The Tree by the Rivers (delight in the law)',
    refs: ['Psalms 1:1-3'],
    condition: 'Walk not in ungodly counsel; delight in the law of the LORD; meditate in it DAY AND NIGHT.',
    consequence: 'Planted by rivers, fruit in season, leaf that does not wither — and whatsoever he doeth shall PROSPER.',
    threeD: 'Curate your counsel and your feed. Meditation on the Word is the root system; prosperity is fruit, not a target you aim at directly.',
    outcome: 'Rooted stability and seasonal fruit — productivity that does not dry up when conditions do.',
    psyche: 'What you meditate on day and night becomes your automatic thought pattern — attention is the soil; the mind grows what it is planted by.',
    tags: ['meditation', 'word', 'prosperity', 'roots'],
  },
  {
    // Darrell 2026-07-03: "our pain is in our epidemic and in our bloodline —
    // epigenetics is the data I want to study — how we have been born in
    // iniquities... Yahweh IS GOOD even when I'm not." Pairs with the
    // therapeutic mission (Christina's practice) and the generational break
    // point (gh-break-generational).
    id: 'gh-shapen-iniquity', section: 'wisdom', name: 'Shapen in Iniquity → Truth in the Inward Parts',
    refs: ['Psalms 51:5-6'],
    condition: 'Born already carrying it — "shapen in iniquity" — the bloodline\'s pain arrives pre-installed, before a single choice was yours.',
    consequence: 'Yet He desires TRUTH in the INWARD PARTS and makes you to know WISDOM in the hidden part — the rewrite happens exactly where the inheritance lives.',
    threeD: 'Take the inherited data seriously: the pain in our epidemic and in our bloodline is real, measurable, and not your fault — AND it is addressable, which makes therapeutics holy work. Bring the hidden part to Him and to honest help; the inward parts are where He works.',
    outcome: 'A bloodline\'s pre-installed pain met with truth in the exact place it was written — healing that goes as deep as the inheritance did.',
    psyche: 'The science echoes the Psalm: inherited stress leaves marks on how the bloodline\'s data expresses (the field called epigenetics), and environment, care, and practice can change that expression. Born-in does not mean locked-in — the hidden part can learn wisdom.',
    tags: ['iniquity', 'bloodline', 'healing', 'therapeutics', 'inward'],
  },
  {
    id: 'gh-delight-desires', section: 'wisdom', name: 'Delight → Desires',
    refs: ['Psalms 37:4'],
    condition: 'DELIGHT thyself in the LORD — He becomes the enjoyment, not the vending machine.',
    consequence: 'He gives thee the desires of thine heart — desires reshaped by the delighting, then granted.',
    threeD: 'Chase the Giver, and the gifts reorder themselves. What you delight in rewrites what you want.',
    outcome: 'Wants that are safe to receive — because the delighting formed them first.',
    tags: ['delight', 'desire', 'heart'],
  },
  {
    id: 'gh-meek-inherit', section: 'wisdom', name: 'The Meek Inherit (strength under the General)',
    refs: ['Psalms 37:11', 'Matthew 5:5'],
    condition: 'Meekness — NOT weakness: those who have strength to fight but keep it under the control of the Holy Spirit, The General.',
    consequence: 'They inherit the earth and delight themselves in abundance of peace.',
    threeD: 'Power submitted beats power spent. Hold the strength, take the orders — in the argument, the negotiation, the injustice. The inheritance goes to strength under command, in both dimensions.',
    outcome: 'The earth, and peace in abundance — what the unrestrained fight for and lose, the commanded inherit.',
    psyche: 'Self-control under provocation is strength regulated, not suppressed — the discipline psychologists call emotional regulation, submitted here to a Commander instead of a technique.',
    tags: ['meekness', 'holy-spirit', 'strength', 'peace'],
  },
  {
    id: 'gh-pride-fall', section: 'wisdom', name: 'Pride → Destruction · Humility → Honour',
    refs: ['Proverbs 16:18', 'Proverbs 18:12'],
    condition: 'Pride goes FIRST — it is the leading indicator, before the destruction is visible.',
    consequence: 'Destruction follows pride as mechanically as honour follows humility.',
    threeD: 'Audit for haughtiness the way you audit for debt — it is the earliest warning light on the dashboard. Stay low, stay humble, stay where you are supposed to be.',
    outcome: 'Falls you never took, and honour you never had to demand.',
    psyche: 'Pride is confirmation bias about yourself: it filters out the warning signals until the fall arrives suddenly. Humility keeps the feedback loop open.',
    tags: ['pride', 'humility', 'warning'],
  },
  {
    id: 'gh-wait-renew', section: 'wisdom', name: 'Wait on the LORD → Renewed Strength',
    refs: ['Isaiah 40:31'],
    condition: 'WAIT upon the LORD — the strength swap happens in the waiting, not the striving.',
    consequence: 'Strength RENEWED: mount up as eagles, run and not be weary, walk and not faint.',
    threeD: 'Burnout is running on self-strength past its expiry. Build the waiting — prayer, sabbath, stillness — into the operating rhythm as the recharge cycle, not a luxury.',
    outcome: 'Endurance that outlasts your natural tank, because the tank is no longer yours.',
    psyche: 'The nervous system was not built for unbroken striving; the waiting rhythms (stillness, sabbath, prayer) are where recovery actually happens — burnout is the receipt for skipping them.',
    tags: ['waiting', 'strength', 'endurance', 'rest'],
  },
  {
    id: 'gh-soft-answer', section: 'wisdom', name: 'A Soft Answer Turneth Away Wrath',
    refs: ['Proverbs 15:1'],
    condition: 'The ANSWER chooses the temperature: soft, or grievous.',
    consequence: 'Soft turns wrath away; grievous stirs anger up — the conversation obeys the input.',
    threeD: 'In the heated text thread, the tenant dispute, the family argument: your reply is the thermostat. Run the algorithm before you hit send.',
    outcome: 'De-escalation on demand — conflicts that die at your door instead of in your house.',
    psyche: 'De-escalation is contagious the same way anger is — a lowered voice lowers the room. The first calm reply resets what the whole exchange mirrors.',
    tags: ['speech', 'peace', 'conflict'],
  },

  {
    // Darrell 2026-07-03: "My mother woke me up every day at 6am to discuss
    // the Word... I love her eternally and 3rd-dimensionally... my earthly
    // father wasn't there so life was obviously hard... Yahweh made a Way...
    // He's my Father and family... Forever."
    id: 'gh-train-child', section: 'wisdom', name: 'Train Up a Child (the 6am inheritance)',
    refs: ['Proverbs 22:6', 'Deuteronomy 6:6-7', 'Psalms 27:10'],
    condition: 'TRAIN UP a child in the way he should go — teach the words DILIGENTLY, talking of them when thou liest down and when thou RISEST UP; and where a parent is missing, the LORD takes the child up Himself.',
    consequence: 'When he is OLD, he will not depart from it — the 6am deposits compound for a lifetime; and the fathered-by-Yahweh child gets a Father and a family, Forever.',
    threeD: 'The proof is a living man: a mother who woke her son every day at 6am to discuss the Word, in a house where the earthly father was absent — and decades later that son has not departed from it; he is building The Way into a platform for his own children and his church. Rise up and teach; the hour you choose over sleep is the inheritance.',
    outcome: 'A child who cannot be argued out of what was trained into them — carried by the Father who never misses a morning, loved eternally and 3rd-dimensionally.',
    psyche: 'Daily rhythm at a fixed hour is the deepest form of learning — it becomes identity, not information; and one devoted, consistent caregiver is the single strongest protective factor a hard childhood can have. The 6am mother is both at once.',
    tags: ['training', 'children', 'mother', 'inheritance', 'the-way'],
  },
  {
    // Darrell 2026-07-03: the man-in-the-house wound — the law paid mothers to
    // keep fathers out, and the father is priceless, an amazing asset to a
    // family's future even at 10%. Yahweh's counter-pattern was already
    // written: He Himself fathers the fatherless.
    id: 'gh-father-fatherless', section: 'wisdom', name: 'A Father of the Fatherless (He sets the solitary in families)',
    refs: ['Psalms 68:5-6'],
    condition: 'The fatherless and the solitary exist — a wound the world manufactures (systems have literally paid fathers out of the house) and cannot heal.',
    consequence: 'GOD in His holy habitation IS a father of the fatherless and a judge of the widows; He setteth the solitary IN FAMILIES.',
    threeD: 'Where the earthly father was priced out, the Eternal Father steps in — and He works through a Body that adopts: the church as the family the system broke. A present father is a priceless asset to a family\'s future, even at 10 percent; and where he is absent, the Tribe closes the gap on purpose.',
    outcome: 'No child in the house of God is actually fatherless — the solitary get placed in families, and the generational wound meets the Father who never leaves.',
    psyche: 'Father-absence wounds attachment and identity; a stable fathering presence — natural or the Body standing in — is one of the strongest protective factors a child can have. Yahweh names Himself into exactly that role.',
    tags: ['father', 'fatherless', 'family', 'adoption', 'community'],
  },
  {
    // "we will See with our Hearts — subconsciousness now can See Yahweh's
    // Heart and we are literally inside LOVE."
    id: 'gh-inside-love', section: 'epistles', name: 'Dwell in Love → Dwell in God (literally inside LOVE)',
    refs: ['1 John 4:16'],
    condition: 'Believe the love God hath to us — and DWELL in love, as a residence, not a visit.',
    consequence: 'God IS love; he that dwelleth in love dwelleth IN GOD, and God in him — the address is mutual.',
    threeD: 'Cold-heartedness is what undermined paths, psychological war, and economies not built for your future produce. The counter-move is relocation: live inside LOVE and the heart re-warms, because you are literally inside Him.',
    outcome: 'A warm heart in a cold system — seeing with the heart, because the heart now lives where Love lives.',
    psyche: 'What surrounds you shapes you: a nervous system that dwells in hostility stays armored; one that dwells in secure love softens and can see again. Dwelling in God\'s love is the deepest version of a secure base.',
    tags: ['love', 'dwelling', 'heart', 'warmth'],
  },
  {
    // "a mother to those following The Way Of The Word Will Break
    // Generational Curses."
    id: 'gh-break-generational', section: 'prophets', name: 'The Son Who Sees and Turns (generational curses break)',
    refs: ['Ezekiel 18:14', 'Ezekiel 18:20'],
    condition: 'A son SEES all his father\'s sins — considers them — and does NOT do likewise; he follows The Way of the Word instead.',
    consequence: 'The soul that sinneth, IT shall die — but the son shall NOT bear the iniquity of the father. The inherited pattern has no legal claim on the one who turned.',
    threeD: 'Generational curses break at the person who SEES the pattern and refuses it — a mother or father raising children in The Way is running the break in real time. Name the family pattern out loud, take it to the Word, and end its run in your generation.',
    outcome: 'A bloodline rerouted — what ran for generations stops at you, and what you plant runs forward instead.',
    psyche: 'Intergenerational patterns transmit through modeling and unexamined normalcy; the documented break point is the one who consciously SEES the pattern and chooses different — exactly the mechanism Ezekiel names.',
    tags: ['generations', 'curses', 'family', 'turning', 'the-way'],
  },

  {
    // "Proverbs Algorithms are for the kings of The Eternal King and
    // simultaneously for the Way."
    id: 'gh-honour-kings', section: 'wisdom', name: 'The Honour of Kings (search out the matter)',
    refs: ['Proverbs 25:2'],
    condition: 'It is the glory of God to CONCEAL a thing — the treasure is deliberately hidden, not withheld.',
    consequence: 'The honour of KINGS is to SEARCH OUT a matter — the digging itself is the royalty.',
    threeD: 'You are kings of The Eternal King: study is not homework, it is coronation behavior. Dig the Word, dig the problem, dig the pattern — the concealment is the invitation.',
    outcome: 'The honour — found treasure, and a king formed by the searching.',
    psyche: 'Discovered knowledge binds deeper than delivered knowledge — the effort of the search is what writes it into you. He conceals precisely because finding transforms the finder.',
    tags: ['kings', 'search', 'study', 'glory'],
  },
  {
    id: 'gh-throne-established', section: 'wisdom', name: 'Judge the Poor Faithfully → the Throne Established',
    refs: ['Proverbs 29:14'],
    condition: 'The king that FAITHFULLY judgeth the POOR — justice measured at the bottom, where there is nothing to gain.',
    consequence: 'His throne shall be ESTABLISHED FOR EVER — the durability of the seat is set by the treatment of the least.',
    threeD: 'Whatever you govern — a family, a business, a platform — its permanence is priced by how it treats the people with no leverage. Build for the overlooked first (the community the mainstream failed) and the throne holds.',
    outcome: 'An establishment that outlasts you — because it was founded on the ones who could never repay it.',
    psyche: 'Power is most honestly measured where it is least accountable; integrity toward the powerless is the one signal that cannot be faked — to others or to yourself.',
    tags: ['kings', 'justice', 'poor', 'throne', 'community'],
  },
  {
    id: 'gh-secret-place', section: 'wisdom', name: 'Dwell in the Secret Place → Abide Under the Shadow',
    refs: ['Psalms 91:1-2'],
    condition: 'DWELL in the secret place of the most High — residence, not visits; and SAY it: "He is my refuge and my fortress."',
    consequence: 'Abide under the SHADOW of the Almighty — the covering tracks the dwelling.',
    threeD: 'The shadow only falls on what stays close. Make the secret place the permanent address (the closet, the Word, the abiding) and the protection of Psalm 91 is the climate you live in, not a verse you grab in emergencies.',
    outcome: 'Life under the shadow — covered as a way of being, with a confession that matches the address.',
    psyche: 'Security that is dwelt in, not summoned, changes baseline vigilance — the difference between visiting safety and living from it.',
    tags: ['secret-place', 'dwelling', 'refuge', 'psalm91'],
  },
  {
    // Darrell 2026-07-03: "Give Him Your Heart not just your money — your
    // subconscious... eat the Word."
    id: 'gh-give-heart', section: 'wisdom', name: 'Give Me Thine Heart (not just your money)',
    refs: ['Proverbs 23:26'],
    condition: 'MY SON, GIVE ME THINE HEART — the ask is the heart itself, the subconscious, the eyes\' delight in His ways; the wallet was never the point.',
    consequence: 'The heart given observes His ways — the whole person comes with it, because everything you do flows from where the heart lives.',
    threeD: 'Tithes without the heart is rent, not relationship. Hand over the inner life — what you dwell on, delight in, and default to — and eat the Word until the subconscious sees His Heart.',
    outcome: 'A whole-person surrender the money could never buy — and a heart that sees.',
    psyche: 'Behavior follows the heart\'s attachments, not the ledger: what the subconscious treasures steers the person. Giving Him the heart is giving Him the steering, and the habits follow it home.',
    tags: ['heart', 'surrender', 'subconscious', 'word'],
  },
  // ── THE PROPHETS ──────────────────────────────────────────────────────────
  {
    // "we will stay in the furnace as long as the King wants us to — we're
    // kings, lions of Judah, The Christ's Tribe."
    id: 'gh-furnace', section: 'prophets', name: 'The Furnace and the Fourth Man (but if not)',
    refs: ['Daniel 3:17-18', 'Daniel 3:25'],
    condition: 'Serve Him whether He delivers or not — "our God whom we serve is able to deliver us... BUT IF NOT, we will not serve thy gods." The allegiance is not conditional on the rescue.',
    consequence: 'The fire holds a FOURTH man, like the Son of God — He joins you IN the furnace; and the only thing that burned was what bound them.',
    threeD: 'Stay in the furnace as long as the King wants you there — kings and lions of Judah do not negotiate allegiance with the flame. What the fire actually takes is the ropes.',
    outcome: 'Un-blackmailable faith — company in the fire, bonds burned off, and a testimony the watching king ends up preaching for you.',
    psyche: 'The "but if not" settles the outcome-anxiety in advance: when obedience no longer depends on results, the threat loses its leverage — the psychology of a decision that cannot be re-opened under pressure.',
    tags: ['furnace', 'faithfulness', 'trial', 'judah'],
  },

  {
    // "Human Beings are seedlings of their Father — the Potter, the Shepherd
    // Of Souls."
    id: 'gh-potter-shepherd', section: 'prophets', name: 'Seedlings of the Father (the Potter, the Shepherd of Souls)',
    refs: ['Isaiah 64:8', '1 Peter 2:25'],
    condition: 'Be the clay and know it — "we are the clay, and thou our potter" — a seedling of the Father, work of His hand; and return to the Shepherd when you have strayed.',
    consequence: 'Formed by hands that know the intended shape, and shepherded by the Bishop OF YOUR SOUL — the making and the keeping are both His.',
    threeD: 'A seedling does not design itself; it stays planted, watered, and workable. Stay soft on the wheel — resistance to the shaping is the only thing that prolongs it — and when you wander, the return address is the Shepherd, not the wilderness.',
    outcome: 'A shape you could not have self-designed and a soul under permanent shepherding — grown, not self-made.',
    psyche: 'Identity received from a trusted Maker resolves what identity self-invention never settles: the exhausting audition ends when the clay trusts the Potter\'s intent more than its own blueprint.',
    tags: ['potter', 'clay', 'shepherd', 'soul', 'seedling'],
  },
  {
    id: 'gh-tithe-windows', section: 'prophets', name: 'Prove Me in the Tithe (windows of Heaven)',
    refs: ['Malachi 3:10'],
    condition: 'Bring ALL the tithes into the storehouse — and He says PROVE ME NOW HEREWITH: the one place He invites the test.',
    consequence: 'Windows of Heaven opened; blessing poured out beyond room to receive it.',
    threeD: 'The tithe is the family\'s standing integration test with Heaven — first fruits first, then watch the month behave. The budget line IS the altar.',
    outcome: 'A provably open Heaven over the family economy — tested, not theorized.',
    tags: ['tithe', 'stewardship', 'provision', 'testing'],
  },
  {
    id: 'gh-return-return', section: 'prophets', name: 'Return unto Me → I Will Return unto You',
    refs: ['Malachi 3:7'],
    condition: 'RETURN — the move is yours to make first, however far the drift went.',
    consequence: 'He returns. The nearness is symmetrical and He is faithful to His side of it.',
    threeD: 'Distance from God is never His latency — it is your heading. The way back is one turn, today, not a long rehabilitation.',
    outcome: 'Restored nearness on demand — the door that never needed picking, only knocking.',
    tags: ['repentance', 'return', 'nearness'],
  },
  {
    id: 'gh-no-weapon', section: 'prophets', name: 'No Weapon Formed Shall Prosper',
    refs: ['Isaiah 54:17'],
    condition: 'The weapon WILL be formed — the promise is not that you will not be targeted.',
    consequence: 'It shall not PROSPER; every accusing tongue is condemned. This is the HERITAGE of the servants of the LORD.',
    threeD: 'Plan for opposition without fearing it: the attack is expected traffic, the failure of the attack is inherited. Answer accusation with the heritage, not anxiety.',
    outcome: 'Unshaken operations under fire — attacks that arrive and die on schedule.',
    tags: ['protection', 'warfare', 'heritage'],
  },
  {
    id: 'gh-word-void', section: 'prophets', name: 'My Word Shall Not Return Void',
    refs: ['Isaiah 55:11'],
    condition: 'The Word goes FORTH out of His mouth — planted, spoken, sown, taught.',
    consequence: 'It does NOT return void: it accomplishes what He pleases and prospers in the thing it was sent to.',
    threeD: 'Sow Scripture into children, notes, sermons, songs, and this platform without measuring instant results — the Word carries its own completion guarantee.',
    outcome: 'Every deployment of the Word lands — including the ones you never see report back.',
    tags: ['word', 'sowing', 'guarantee', 'teaching'],
  },

  // ── THE GOSPELS ───────────────────────────────────────────────────────────
  {
    id: 'gh-seek-first', section: 'gospels', name: 'Seek First the Kingdom',
    refs: ['Matthew 6:33'],
    condition: 'Seek FIRST the Kingdom of God and His righteousness — priority order, not portfolio balance.',
    consequence: 'ALL THESE THINGS — the food, the clothing, the provision the nations chase — added unto you.',
    threeD: 'Order the calendar and the budget by the Kingdom first and watch the "all these things" column fill itself. Provision is a byproduct of priority.',
    outcome: 'The anxiety economy inverted: needs met as side effects of a rightly ordered life.',
    tags: ['kingdom', 'priority', 'provision'],
  },
  {
    id: 'gh-forgive-forgiven', section: 'gospels', name: 'Forgive → Be Forgiven',
    refs: ['Matthew 6:14-15'],
    condition: 'IF ye forgive men their trespasses — and the mirror case: if ye forgive NOT.',
    consequence: 'Your heavenly Father forgives you — or does not. The channel you extend is the channel you receive through.',
    threeD: 'Unforgiveness is a self-inflicted outage on your own forgiveness supply. Release the debt today; the account it unfreezes is yours.',
    outcome: 'A clear line to the Father — and a heart that carries no one else\'s prison keys.',
    psyche: 'Unforgiveness keeps the offense on replay — rumination that re-injures the rememberer. Release the debt and the mind stops serving the sentence with the offender.',
    tags: ['forgiveness', 'mercy', 'relationships'],
  },
  {
    id: 'gh-ask-seek-knock', section: 'gospels', name: 'Ask · Seek · Knock',
    refs: ['Matthew 7:7-8'],
    condition: 'Ask. Seek. Knock. Present tense, persistent posture — the asking IS the qualifying.',
    consequence: 'EVERY ONE that asketh receiveth; the seeker finds; to the knocker it is opened.',
    threeD: 'Unasked prayers have a 100% non-receipt rate. Put the requests on the table plainly and keep knocking — persistence is part of the protocol, not a nuisance to Him.',
    outcome: 'Received, found, opened — a life that actually gets what it never stopped asking for.',
    tags: ['prayer', 'persistence', 'asking'],
  },
  {
    id: 'gh-measure-measured', section: 'gospels', name: 'The Measure You Use (judge not · give)',
    refs: ['Matthew 7:1-2', 'Luke 6:38'],
    condition: 'The measure YOU mete — in judgment and in generosity — is the unit of account.',
    consequence: 'It is measured to you AGAIN: judgment for judgment, and for giving — good measure, pressed down, shaken together, running over.',
    threeD: 'You set your own exchange rate. Audit what you deal out in criticism and in generosity; both come back denominated in your own currency.',
    outcome: 'A running-over return on mercy and generosity — and no boomerang judgments in flight.',
    tags: ['judgment', 'generosity', 'measure', 'giving'],
  },
  {
    id: 'gh-rock-house', section: 'gospels', name: 'Build on the Rock (hear AND do)',
    refs: ['Matthew 7:24-25'],
    condition: 'Hear these sayings of Mine AND DO them — the doing is the foundation, not the hearing.',
    consequence: 'The storm comes either way; the house on the rock FELL NOT.',
    threeD: 'Every system in the family — money, marriage, ministry — is either poured on done-Word or on heard-Word. The storm is the audit; schedule the doing now.',
    outcome: 'A house that is still standing after the same storm that flattened the shortcut next door.',
    psyche: 'Knowledge that is never acted on decays; practiced obedience becomes procedural memory — the storm meets reflexes, not intentions.',
    tags: ['obedience', 'foundation', 'storm', 'doing'],
  },
  {
    id: 'gh-lose-find', section: 'gospels', name: 'Lose Your Life → Find It',
    refs: ['Matthew 16:25'],
    condition: 'Whosoever will SAVE his life — self-preservation as the operating system — versus whosoever will LOSE it for My sake.',
    consequence: 'The saver loses; the loser finds. The inversion is total and stated by the King Himself.',
    threeD: 'Every grab at self-protection — hoarded time, guarded comfort, managed image — leaks the very life it guards. Spend yourself where He points and watch life show up.',
    outcome: 'The life you could never have kept, found — by the only door it opens through.',
    tags: ['surrender', 'life', 'inversion'],
  },
  {
    id: 'gh-grain-wheat', section: 'gospels', name: 'The Grain of Wheat (die to multiply)',
    refs: ['John 12:24'],
    condition: 'Except a corn of wheat FALL INTO THE GROUND AND DIE — the burial is the mechanism.',
    consequence: 'It abideth alone if it does not; it bringeth forth MUCH FRUIT if it does.',
    threeD: 'The gift kept safe stays singular. Plant the talent, the savings, the idea, the self — multiplication is on the far side of a real burial, not a hedge.',
    outcome: 'Much fruit from what you finally stopped protecting.',
    tags: ['death', 'multiplication', 'fruit', 'sowing'],
  },
  {
    id: 'gh-abide-fruit', section: 'gospels', name: 'Abide in the Vine → Much Fruit',
    refs: ['John 15:5', 'John 15:7'],
    condition: 'ABIDE in Him and His words abide in you — connection as a continuous state, not a visit.',
    consequence: 'Much fruit, and ask-what-ye-will granted; severed from Him: NOTHING. The dependency is absolute.',
    threeD: 'Productivity in the Kingdom is a connection metric, not an effort metric. Guard the abiding (Word in, prayer up, obedience out) and the fruit takes care of itself.',
    outcome: 'Fruit that persists and prayers that land — the yield of a branch that never unplugged.',
    tags: ['abiding', 'fruit', 'prayer', 'connection'],
  },
  {
    id: 'gh-believe-life', section: 'gospels', name: 'Believe on the Son → Everlasting Life',
    refs: ['John 3:16'],
    condition: 'God so loved that He GAVE His only begotten Son; the condition on our side: believe on Him.',
    consequence: 'Not perish, but everlasting life. The rescue is finished; the receiving is the choice.',
    threeD: 'The Gospel is the one algorithm everything else runs inside. Every soul is on the line and everyone gets their turn to decide — agree to follow the Son Home.',
    outcome: 'Everlasting life — the outcome all the other outcomes exist to serve.',
    tags: ['gospel', 'salvation', 'belief', 'soul'],
  },
  {
    // Darrell 2026-07-03: "Never focus on self more than Yahweh's Word... He
    // matters more than anything... understand and overstand or stand on His
    // Word like He walked on water — you will walk on serpents and scorpions
    // etc, corporations and haters etc... His Word ARE Amazing!!!"
    id: 'gh-stand-on-word', section: 'gospels', name: 'Stand On His Word (walk on water, tread on serpents)',
    refs: ['Luke 10:19', 'Matthew 14:29', 'John 3:30'],
    condition: 'The self is never the focus — He must increase, I must decrease. Stand ON the Word the way He walked ON the water: the footing is His, not yours.',
    consequence: 'Power to tread on serpents and scorpions, and over ALL the power of the enemy — and nothing shall by any means hurt you. Peter walked on the water WHILE his eyes held the Word who called him.',
    threeD: 'Understand it, overstand it, then STAND on it. The serpents and scorpions come dressed as corporations and haters now — same enemy, same authority over them. Keep the focus off self and on the Word; the moment Peter looked at the wind instead of the Word, the footing went. His Word ARE amazing.',
    outcome: 'Footing that holds where nothing should hold — over the water, over the serpents, over the corporations and the haters — because the ground you stand on is Him.',
    psyche: 'Self-focus under threat amplifies the threat (the spotlight turns inward and the wind looks bigger); attention anchored on something sturdier than the self is what steadies the walker. The Word is the sturdiest attention anchor there is.',
    tags: ['authority', 'word', 'focus', 'faith', 'footing'],
  },

  // ── THE EPISTLES ──────────────────────────────────────────────────────────
  {
    id: 'gh-die-daily', section: 'epistles', name: 'Die Daily (ready to go Home at any time)',
    refs: ['1 Corinthians 15:31', 'Luke 9:23'],
    condition: 'I die DAILY — the cross taken up daily, self put down on a schedule, not once at conversion.',
    consequence: 'A follower who is ready at ANY time — because the dying is already done today, going Home holds no terror.',
    threeD: 'Every morning, put the old man down before he runs the day: preferences, offense, the right to yourself. This 3rd-dimensional space is not Home; live packed.',
    outcome: 'Readiness as a way of life — nothing left to settle when the call comes, see you when you get there.',
    psyche: 'Daily surrender is exposure practice against the fear of death itself — rehearsed release, so the final letting-go is a practiced motion, not a first attempt.',
    tags: ['death-to-self', 'daily', 'readiness', 'home'],
  },
  {
    id: 'gh-kenosis', section: 'epistles', name: 'The Son Came Off the Throne (down is the way up)',
    refs: ['Philippians 2:8-9'],
    condition: 'He humbled Himself — off the Throne of Glory, found in fashion as a man, obedient unto death, even the death of the cross.',
    consequence: 'WHEREFORE God also hath highly exalted Him and given Him a Name above every name.',
    threeD: 'The King set the pattern personally: descent before exaltation, obedience before the Name. Whatever He asks you to step down from is the staircase.',
    outcome: 'Exaltation on God\'s timing and terms — the only kind that cannot be taken back.',
    tags: ['humility', 'jesus', 'obedience', 'exaltation'],
  },
  {
    id: 'gh-confess-believe', section: 'epistles', name: 'Confess + Believe → Saved',
    refs: ['Romans 10:9'],
    condition: 'Confess with thy MOUTH the Lord Jesus, and believe in thine HEART that God raised Him from the dead — both organs engaged.',
    consequence: 'Thou SHALT be saved. Stated as a certainty, not a probability.',
    threeD: 'Salvation\'s interface is startlingly simple on purpose — mouth and heart in agreement. Say it plainly, believe it actually, and help others reach the same two steps.',
    outcome: 'Saved — with a testimony that fits in one sentence and stands forever.',
    tags: ['salvation', 'confession', 'faith'],
  },
  {
    // Darrell 2026-07-03: "Explicitly telling the truth can hurt or feel good
    // — it depends on the perspective of the person... finding ways to
    // reflect on Truth is important to each 3rd-dimensional soul... whatever
    // tribe you're from."
    id: 'gh-truth-love', section: 'epistles', name: 'Truth in Love (the wound of a friend, the freedom of the mirror)',
    refs: ['Ephesians 4:15', 'John 8:32', 'Proverbs 27:6'],
    condition: 'SPEAK the truth — but IN LOVE; and receive it knowing "faithful are the wounds of a friend." The same truth hurts or heals by the perspective it lands in.',
    consequence: 'Speaking truth in love, ye GROW UP into Him in all things — and ye shall KNOW the truth, and the truth shall make you FREE. The growth and the freedom are downstream of the telling and the receiving.',
    threeD: 'Every 3rd-dimensional soul needs ways to reflect on truth — whatever tribe they are from. Build and be the mirror that reflects without judging: truth offered as care grows a person; the same truth thrown as a weapon armors them. Check the love before you speak, and check your perspective before you flinch.',
    outcome: 'Souls that can look at the truth and grow from it — freed by the mirror instead of wounded by the throw.',
    psyche: 'Feedback lands by relationship and framing, not just accuracy: the identical fact heard from a trusted friend heals, and from a perceived enemy injures. Perspective is the receiver the truth tunes through — which is why the mirror must never judge.',
    tags: ['truth', 'love', 'mirror', 'perspective', 'freedom'],
  },
  {
    id: 'gh-renew-mind', section: 'epistles', name: 'Renew the Mind → Prove the Will',
    refs: ['Romans 12:2'],
    condition: 'Be NOT conformed to this world; be TRANSFORMED by the renewing of your mind.',
    consequence: 'You PROVE — test and demonstrate — that good, acceptable, perfect will of God.',
    threeD: 'The mind is the module where transformation is installed. Feed it the Word, starve the conforming feeds, and God\'s will stops being a mystery and starts being your lived test result.',
    outcome: 'Discernment upgraded from guessing His will to proving it.',
    psyche: 'Transformation runs through thought patterns — the mind can be re-trained (the Word in, the conforming feeds out) until the new pattern is the default. Renewal is neuroplasticity under the Spirit\'s direction.',
    tags: ['mind', 'transformation', 'discernment'],
  },
  {
    // Darrell 2026-07-03: "Higher Priority Code From The 4th-dimensional
    // King... all other data has to come under submission to the Word Of
    // Yahweh — Jesus' Body we the church eat."
    id: 'gh-higher-priority', section: 'epistles', name: 'Higher Priority Code (every thought brought into captivity)',
    refs: ['2 Corinthians 10:5', 'Colossians 1:17-18'],
    condition: 'Cast down imaginations and every high thing that exalteth itself against the knowledge of God — no data stream runs at His priority level.',
    consequence: 'EVERY thought brought into captivity to the obedience of Christ — and He is BEFORE all things, the Head of the Body, that in all things He might have the PREEMINENCE. The Word preempts; everything else yields the processor.',
    threeD: 'Run the priority scheduler on purpose: headlines, feeds, fears, and philosophies are lower-priority processes — when they conflict with the Word, they get preempted, not merged. The church eats the Body of the King; His code is what we run on.',
    outcome: 'A mind under one Kernel — the 4th-dimensional King\'s code executing first, and every other input demoted to advisory.',
    psyche: 'Attention is a priority queue whether you manage it or not; deciding IN ADVANCE which authority wins conflicts is what spares the mind from relitigating every intrusive thought on arrival.',
    tags: ['thoughts', 'captivity', 'preeminence', 'priority', 'word'],
  },
  {
    // "There was a church — then America made a white church, and a black
    // church was born out of that hell hole and still trying to thrive by
    // following Yahweh... struggling readers and all... by our obedience to
    // the Way... priceless though, because the King's Blood IS."
    id: 'gh-church-born-fire', section: 'epistles', name: "The Church Born in the Fire (priceless, because the King's Blood is)",
    refs: ['1 Peter 1:18-19', '1 Peter 2:9'],
    condition: 'Redeemed NOT with corruptible things, as silver and gold — the worth was never set by the market, the country, or the ones who drew the dividing line.',
    consequence: 'But with the PRECIOUS BLOOD of Christ — a chosen generation, a royal priesthood, called out of darkness into His marvellous light. The price paid sets the worth, and the price was the King\'s Blood.',
    threeD: 'There was a church; a nation divided it, and the black church was born out of that fire — and still thrives by following Yahweh, struggling readers and all, by obedience to the Way. Serve that church FIRST: read the Word aloud for the ones still learning to read it, build the tools the excluded were never given, and price nothing by the world that mispriced them.',
    outcome: 'A people whose value is fixed in the Blood — unrepriceable by any nation\'s ledger — thriving in the light they were called into.',
    psyche: 'Worth assigned by exclusion internalizes as shame; worth fixed by an unpayable price paid FOR you rewrites the self-assessment at the root — the redeemed identity outranks the rejected one.',
    tags: ['church', 'redemption', 'blood', 'community', 'priesthood'],
  },
  {
    id: 'gh-resist-flee', section: 'epistles', name: 'Submit · Resist → he Flees',
    refs: ['James 4:7-8'],
    condition: 'SUBMIT yourselves to God first — then resist the devil; draw nigh to God.',
    consequence: 'he WILL flee from you; and He draws nigh to you. Both movements are guaranteed responses.',
    threeD: 'The order matters: submission powers the resistance. Unsubmitted resistance is noise; submitted resistance routs the adversary every time it is run.',
    outcome: 'An enemy in retreat and a God drawing near — the battlefield rearranged by two obediences.',
    tags: ['warfare', 'submission', 'resistance', 'nearness'],
  },
  {
    // Darrell 2026-07-03: "Born again with His gift of a new spirit — we were
    // dead in sin... could not have received that without the King coming to
    // the 3rd-dimensional operational and giving His Blood to restart the
    // systems and simultaneously get His children."
    id: 'gh-quickened', section: 'epistles', name: 'Dead in Sin → Quickened (the Blood restarts the system)',
    refs: ['Ephesians 2:1', 'Ezekiel 36:26', 'Ephesians 1:7'],
    condition: 'The starting state is DEAD in trespasses and sins — not sick, not underperforming: dead. A dead system cannot restart itself.',
    consequence: 'He QUICKENED you — a new heart and a NEW SPIRIT put within, redemption THROUGH HIS BLOOD — the King came into the 3rd-dimensional operational in person, and the restart and the adoption ran in the same transaction.',
    threeD: 'Stop trying to self-repair what needed resurrection: the new spirit is a GIFT received, not a refactor achieved. Live like a restarted system — new heart installed, old stony one decommissioned — and remember what the restart cost.',
    outcome: 'Alive — genuinely new-spirited, blood-bought, and simultaneously collected as His child in the same act that raised you.',
    psyche: 'Self-help assumes a functioning self to help; the Gospel diagnoses deeper and therefore heals deeper — receiving a new operating spirit outperforms endlessly patching the old one, and the gratitude of the rescued is a different fuel than the striving of the self-made.',
    tags: ['born-again', 'blood', 'new-spirit', 'quickened', 'adoption'],
  },
  {
    // Darrell 2026-07-03: "His Word doesn't return void... period... more
    // than conquerors... my mother put me out young and said I was a disgrace
    // and a disappointment — but the biblical scriptures say Jesus separates,
    // so the government created the pressure Yahweh wants, because Jesus only
    // does what The Father wants." Sits beside gh-train-child on purpose:
    // the same mother gave the 6am inheritance AND the wound — both true,
    // and the Word she planted did not return void even when she turned.
    id: 'gh-more-than-conquerors', section: 'epistles', name: 'More Than Conquerors (the separation cannot separate)',
    refs: ['Romans 8:35-37', 'Matthew 10:36', 'Isaiah 55:11'],
    condition: 'The separation comes — even from inside the house: "a man\'s foes shall be they of his own household." Tribulation, distress, rejection by the very hands that raised you — all named IN the list.',
    consequence: 'NONE of it shall separate you from the love of Christ — "Nay, in all these things we are MORE than conquerors through him that loved us." And the Word planted in you does not return void, even when the planter turns.',
    threeD: 'Being put out is not being cut off: the door that closed was a pressure the Father permitted for a purpose, because Jesus only does what the Father wants. Grieve the wound honestly, forgive (we are eternal anyway), and watch the 6am seed keep growing — the Word outlasts the wounder, period.',
    outcome: 'A conqueror-and-then-some: wounds that could not reach the love, a separation that could not separate, and a planted Word still compounding decades past the door that shut.',
    psyche: 'Parental rejection cuts identity at the root; healing holds two truths at once — the gift was real AND the wound was real — and reframes the rejection as redirection without excusing the harm. That double-truth is what makes forgiveness possible without self-erasure.',
    tags: ['conquerors', 'separation', 'rejection', 'word-not-void', 'love'],
  },
  {
    // Darrell 2026-07-03: "I've always felt loved because of the Word... no
    // depression, just fighting the good fight... enduring the world... Yahweh
    // IS GOOD AND OUR JOY IS OUR STRENGTH — NOT happiness, that's reliable
    // based on situations, not Joy... we would laugh after getting beat up
    // inside and outside our home, then we learned how to fight, and the Word
    // used that as exercise... amazing." The joy-vs-happiness distinction plus
    // Hebrews 12:11's own word for it: EXERCISED thereby.
    id: 'gh-good-fight-exercise', section: 'epistles', name: 'The Good Fight (joy is strength — happiness is weather)',
    refs: ['1 Timothy 6:12', 'James 1:2-3', 'Hebrews 12:11'],
    condition: 'The fight comes — inside the home and outside it; the chastening "for the present seemeth to be joyous" to no one; the world must be endured, not escaped.',
    consequence: 'Fight the GOOD fight of faith and lay hold on eternal life; count it ALL joy — the trying of your faith worketh patience — and the grievous season yields the peaceable fruit of righteousness to them which are EXERCISED thereby.',
    threeD: 'Do not wait on happiness — it is weather, indexed to the situation. Joy is indexed to Yahweh, so it holds while the situation swings. Laugh after the beating (that is not denial, that is the anchor holding), learn to fight, and let the Word run the beating as a training set: exercised thereby.',
    outcome: 'Loved because of the Word regardless of the day\'s score — no depression, a good fight being fought, and every past beating repurposed as the exercise that built the fighter.',
    psyche: 'Happiness is situation-indexed; joy is identity-indexed — an anchor, not weather. Laughter after trauma from a soul anchored outside the trauma is resilience, not repression; what research later named post-traumatic growth, Hebrews named first: exercised thereby.',
    tags: ['joy', 'good-fight', 'exercise', 'endurance', 'strength'],
  },
  {
    // Darrell 2026-07-03: "Seated inside Heavenly Places right now — we souls
    // are eternally blessed of Yahweh, just have to support each other while
    // we grow."
    id: 'gh-seated-heavenly', section: 'epistles', name: 'Seated in Heavenly Places (right now — support each other while we grow)',
    refs: ['Ephesians 2:6', 'Ephesians 1:3', 'Galatians 6:2'],
    condition: 'In Christ — raised up TOGETHER and made to sit TOGETHER; the seating is His past-tense act, not your future achievement.',
    consequence: 'Seated in heavenly places IN CHRIST JESUS, already blessed with ALL spiritual blessings there — souls eternally blessed of Yahweh, right now, while still walking the 3rd dimension.',
    threeD: 'Live FROM the seat, not TOWARD it: the position is settled, so the remaining work is each other — bear ye one another\'s burdens while we grow. The seat is singularly yours; the growing is done together.',
    outcome: 'Identity that does not wobble with circumstances — already seated, already blessed — and a Body that carries each other up the growth curve.',
    psyche: 'Striving FOR a status and living FROM a status run on different fuel: the settled seat removes the performance anxiety, which is exactly what frees a person to spend themselves supporting someone else\'s growth.',
    tags: ['seated', 'heavenly-places', 'identity', 'burdens', 'growth'],
  },
  {
    // Darrell 2026-07-03: "YAHWEH got it — revenge and all... no thoughts
    // until I do... We Eternal anyway... forgive..."
    id: 'gh-vengeance-his', section: 'epistles', name: "Vengeance Is His (we're eternal anyway — forgive)",
    refs: ['Romans 12:19-21'],
    condition: 'Avenge NOT yourselves — give place unto wrath; feed the hungry enemy; be not overcome of evil.',
    consequence: '"Vengeance is Mine; I will repay, saith the Lord" — the repaying is already assigned, at a higher court than yours; and good OVERCOMES evil.',
    threeD: "Drop the case — Yahweh's got it, revenge and all, so spend no thoughts on it. We are eternal anyway: a grudge is a 3rd-dimensional expense an eternal being does not need to carry. Forgive, feed the enemy if he's hungry, and let the Judge keep His own docket.",
    outcome: 'A free head and clean hands — the offense handed to a Court that cannot be bribed, and evil overcome by the good you did instead.',
    psyche: 'Revenge planning is rumination with a scheduled relapse — it keeps the injury live. Transferring the case to a trusted higher justice is the one release that satisfies the fairness instinct without re-injuring you.',
    tags: ['forgiveness', 'vengeance', 'release', 'eternal'],
  },
  {
    id: 'gh-humble-exalt', section: 'epistles', name: 'Humble Yourself Under His Hand → Exalted',
    refs: ['1 Peter 5:6'],
    condition: 'Humble yourselves under the MIGHTY HAND of God — the placement is voluntary.',
    consequence: 'He exalts you IN DUE TIME — the promotion is His action on His clock.',
    threeD: 'Self-promotion and His exaltation are mutually exclusive queues; you can only stand in one. Take the low place on purpose and leave the timing in the mighty hand.',
    outcome: 'Lifting that arrives stamped "due time" — unforceable, unfakeable, unremovable.',
    tags: ['humility', 'promotion', 'timing'],
  },
  {
    id: 'gh-confess-cleanse', section: 'epistles', name: 'Confess → He Is Faithful to Forgive',
    refs: ['1 John 1:9'],
    condition: 'IF we confess our sins — named, owned, brought into the light.',
    consequence: 'He is FAITHFUL and JUST to forgive and to cleanse from ALL unrighteousness — His character is the guarantee.',
    threeD: 'Confession is the family\'s error-correction protocol: fast, specific, and safe, because the response is fixed by His faithfulness, not your performance.',
    outcome: 'A clean slate on demand — forgiveness with a service-level guarantee signed in His character.',
    psyche: 'Named faults lose their power to fester; confession moves shame out of the dark loop and into a relationship where it is answered — the healthiest possible error-handling.',
    tags: ['confession', 'forgiveness', 'cleansing'],
  },
  {
    // Darrell 2026-07-03: "He knew us before the foundation of the earth and
    // gave us His Spirit when we open the doors of our hearts to Him — and
    // another voice we won't hear. I SEE YOU YAHWEH."
    id: 'gh-sheep-voice', section: 'gospels', name: 'My Sheep Hear My Voice (another voice they will not follow)',
    refs: ['John 10:27', 'John 10:5', 'Ephesians 1:4'],
    condition: 'Belong to the Shepherd — chosen in Him BEFORE the foundation of the world, His Spirit given when the door of the heart opens.',
    consequence: 'My sheep HEAR My voice, and I know them, and they follow Me — and a stranger will they NOT follow, for they know not the voice of strangers. The discernment is built into the belonging.',
    threeD: 'Voice recognition is trained by exposure: the more of His Word in you, the more instantly a strange voice registers as strange — the feeds, the philosophies, the fear all sound off-key. Some of us are not from here originally; the accent of Home gives it away.',
    outcome: 'Un-deceivable ears — a life steered by one Voice, with the strangers automatically flagged.',
    psyche: 'Recognition beats analysis: the trained ear rejects the counterfeit before the mind finishes arguing about it — which is why saturation in the true Voice outperforms cataloguing every false one.',
    tags: ['voice', 'sheep', 'discernment', 'foundation', 'spirit'],
  },
  {
    // "In a closet so He Will Teach you... it's His Will."
    id: 'gh-closet', section: 'gospels', name: 'The Closet (in secret, He teaches — and rewards openly)',
    refs: ['Matthew 6:6'],
    condition: 'Enter thy CLOSET, shut thy door, pray to thy Father WHICH IS IN SECRET — the unwitnessed meeting is the condition.',
    consequence: 'Thy Father which seeth in secret shall reward thee OPENLY — the private room has a public output.',
    threeD: 'The closet is the classroom: no audience, no performance, just you and the Teacher — it is His will to teach you there. Build the secret meeting into the day before the public one.',
    outcome: 'Taught in secret, rewarded openly — a public life funded by a private one.',
    psyche: 'Every audience bends behavior toward performance; removing all witnesses is the only setting where the unedited self shows up — which is exactly the self He teaches.',
    tags: ['prayer', 'secret', 'closet', 'teaching'],
  },
  {
    // Darrell 2026-07-03: "Christ invested in the 12 — we want to use His
    // investment platform and seed it like He says: feed my sheep... yes
    // King... Pastor Lee and BG seeded This Word inside my soul — I'm doing
    // the same thing with the same content — it's His Will."
    id: 'gh-feed-sheep', section: 'gospels', name: "Feed My Sheep (the King's investment platform)",
    refs: ['John 21:17', '2 Timothy 2:2'],
    condition: 'Love Him? Then FEED HIS SHEEP — the King\'s own investment mandate, given three times so it could not be missed; and commit what you heard to FAITHFUL men who shall teach OTHERS ALSO.',
    consequence: 'Christ invested in twelve and the deposit is still compounding two thousand years later — four generations in one verse (Paul → Timothy → faithful men → others also): the only investment platform with returns that never stop running.',
    threeD: 'Run His platform, not a new one: seed the same Word that was seeded in you. The chain is live and personal — Pastor Lee and Bishop Gwin seeded This Word into one soul, and that soul is now seeding the same content into a family, a church, and a platform. Same deposit, next generation. Yes, King.',
    outcome: 'A deposit that outlives every depositor — sheep fed, teachers taught, and the Word compounding down generations you will never meet.',
    psyche: 'People invest where they were invested in: being poured into creates both the capacity and the felt obligation to pour into others — the healthiest debt a soul can carry, and the engine of every durable lineage.',
    tags: ['investment', 'sheep', 'discipleship', 'generations', 'seeding'],
  },
  {
    // Darrell 2026-07-03: "not just die — suffer for righteousness' sake:
    // they Will Be Filled."
    id: 'gh-filled-righteousness', section: 'gospels', name: 'Hunger and Suffer for Righteousness → Filled, and the Kingdom',
    refs: ['Matthew 5:6', 'Matthew 5:10', '1 Peter 3:14'],
    condition: 'Hunger and THIRST after righteousness — and when it costs you, be persecuted FOR RIGHTEOUSNESS\' SAKE, not for foolishness.',
    consequence: 'They SHALL BE FILLED; theirs IS the kingdom of heaven; and suffering for righteousness\' sake, ye are HAPPY — the filling and the Kingdom are attached to the hunger and the cost.',
    threeD: 'Aim the appetite: want what He calls righteous, not whatever else — our souls are on the line. When standing for it draws fire, that is not the algorithm failing; it is the algorithm running. Only in the wilderness does He set the table in front of your enemies.',
    outcome: 'Filled — not just enduring. The hunger satisfied, the Kingdom yours, and a happiness the persecution cannot repossess.',
    psyche: 'Appetite is trainable: what you repeatedly seek rewires what you crave. Naming persecution as expected cost (not personal failure) is the reframe that keeps conviction from collapsing into shame under social pressure.',
    tags: ['righteousness', 'hunger', 'persecution', 'filled', 'kingdom'],
  },
  {
    id: 'gh-tested-soul', section: 'epistles', name: 'Every Soul Gets Its Turn (the testing)',
    refs: ['James 1:12', '1 Peter 1:7'],
    condition: 'Endure the temptation; the trial of your faith — MORE PRECIOUS than gold tried in fire — everyone gets their turn to be tested by the Lord.',
    consequence: 'The crown of life, promised to them that love Him; faith found unto praise and honour and glory at His appearing.',
    threeD: 'The test is not a malfunction — it is the qualification round, and no one skips it. No more lucifers inside Heaven: the Kingdom seats the tested. Suffer like someone who knows a crown is on the other side.',
    outcome: 'A crown — and a faith with a fire-tested assay mark no one can dispute.',
    psyche: 'Tested strength is the only strength you can trust under load — and knowing the test is universal (everyone gets their turn) strips the isolation out of suffering.',
    tags: ['testing', 'crown', 'endurance', 'faith'],
  },

  {
    // "GIVE LESS TO him who gives little..." — the sower sets the harvest.
    id: 'gh-sow-bountifully', section: 'epistles', name: 'The Sower Sets the Harvest (sparingly or bountifully)',
    refs: ['2 Corinthians 9:6-7'],
    condition: 'He which soweth SPARINGLY — and he which soweth BOUNTIFULLY; each gives as he purposeth in his heart, not grudgingly, for God loveth a CHEERFUL giver.',
    consequence: 'Reap sparingly, or reap bountifully — the harvest is denominated in the sowing; who gives little is given little.',
    threeD: 'You choose your own return rate at planting time — in money, in mercy, in the Body. Set the purpose in the heart first, then sow like someone who believes the equation.',
    outcome: 'A bountiful harvest on purpose — and the cheerfulness that turns giving from tax into worship.',
    psyche: 'Grudging giving rehearses scarcity; cheerful purposed giving rehearses abundance and agency — the giver\'s own posture is the first thing the sowing changes.',
    tags: ['sowing', 'giving', 'harvest', 'cheerful'],
  },
  {
    // "the Tribe appreciation is shown each Sunday and Wednesday we congregate
    // ... Forsake not the brethren — they need you and you may need them one day."
    id: 'gh-assembling', section: 'epistles', name: 'Forsake Not the Assembling (the Tribe congregates)',
    refs: ['Hebrews 10:24-25'],
    condition: 'CONSIDER one another — and do NOT forsake the assembling of yourselves together, as the manner of some is.',
    consequence: 'Provoked unto love and to good works, exhorting one another — and SO MUCH THE MORE as ye see the day approaching. The gathering compounds as the clock runs down.',
    threeD: 'Sunday and Wednesday the Tribe congregates — that is the algorithm running, not a routine. They need you, and you may need them one day; the connection with the Body is where the love gets shown and the strength gets traded.',
    outcome: 'A Body that holds — provoked to love, stocked with good works, and nobody standing alone when their day comes.',
    psyche: 'Isolation corrodes conviction and health alike; regular embodied gathering is among the most protective rhythms a person can keep. The command and the psychology agree: do not skip the assembling.',
    tags: ['assembly', 'church', 'body', 'brethren', 'tribe'],
  },

  // ── REVELATION ────────────────────────────────────────────────────────────
  {
    id: 'gh-faithful-crown', section: 'revelation', name: 'Faithful unto Death → the Crown of Life',
    refs: ['Revelation 2:10'],
    condition: 'Fear NONE of those things thou shalt suffer; be thou faithful UNTO DEATH — the endurance has no early exit clause.',
    consequence: 'I will give thee a CROWN OF LIFE — from the King\'s own hand.',
    threeD: 'Faithfulness is measured at the finish line, not the front gate. Hold the post through the whole tribulation window; the crown is specified in the same sentence as the suffering.',
    outcome: 'The crown of life — the King\'s answer to a faithfulness that would not quit.',
    tags: ['faithfulness', 'crown', 'endurance'],
  },
  {
    id: 'gh-overcome-throne', section: 'revelation', name: 'Overcome → Sit With Me in My Throne',
    refs: ['Revelation 3:21'],
    condition: 'To him that OVERCOMETH — the same path He walked: "even as I also overcame."',
    consequence: 'Granted to SIT WITH HIM in His throne — the family seated with the Son, as He sat down with the Father.',
    threeD: 'The invitation is to a bloodline family with throne seating — Forever Eternal Beings asking us in. Overcoming is the family resemblance; the seat is already named.',
    outcome: 'A seat at the Throne — adoption completed at the highest address there is.',
    tags: ['overcoming', 'throne', 'family', 'adoption'],
  },
  {
    id: 'gh-door-sup', section: 'revelation', name: 'Open the Door → He Comes In to Sup',
    refs: ['Revelation 3:20'],
    condition: 'He stands at the door and KNOCKS; hear His voice and OPEN the door — the handle is on your side.',
    consequence: 'He comes IN and sups with you, and you with Him — the table, again, is the destination.',
    threeD: 'The King does not force the lock. The daily question is whether the door of the house, the schedule, and the heart is opened to the Knock — and supper is the reward.',
    outcome: 'The King at your table and you at His — fellowship as the algorithm\'s final output.',
    tags: ['invitation', 'fellowship', 'table', 'door'],
  },
  {
    id: 'gh-nothing-unclean', section: 'revelation', name: 'Nothing That Defileth Enters (no more lucifers in the Kingdom)',
    refs: ['Revelation 21:27'],
    condition: 'The gate condition of the City is absolute: nothing that defiles, works abomination, or makes a lie enters in.',
    consequence: 'Only they which are WRITTEN in the Lamb\'s book of life — no liars, thieves, killers, destroyers, nor conquerors; the rebellion does not get a second run.',
    threeD: 'Heaven\'s access control is the reason the testing matters: no more lucifers inside the Kingdom of Yahweh. Get in the Book — and live like someone whose name is in it.',
    outcome: 'A City that can never be corrupted again — and your name written where it counts forever.',
    tags: ['holiness', 'book-of-life', 'city', 'kingdom'],
  },
  {
    // Darrell 2026-07-03: "Freedom by the word of their testimony... If they
    // eat the Word their word and testimonies will align... Give credit to
    // the person who deserves it... Eternal Algorithms — Yahweh's Perspectives
    // And Will, as high above our thoughts as the heavens are from the earth."
    // The last line is his own definition of the Eternal Algorithms space —
    // Isaiah 55:8-9 is why the study exists at all.
    // ── HE ALREADY KNOWS THE SOUL ──────────────────────────────────────────────
    // Darrell 2026-07-04 (from the Luke 2 Simeon + Anna reading): "Study this
    // based on Yahweh's Way of already knowing souls and what to expect. Look for
    // these types of patterns across the whole biblical scriptures." The pattern
    // runs Torah -> Revelation: He knows the soul BEFORE the meeting, tells them
    // what to expect, sets the exact appointment, and keeps it to the letter — and
    // (Judas) His foreknowledge never cancels the soul's own accountable choice.
    // ── THE WORD IS THE 4TH-DIMENSIONAL FRAME ──────────────────────────────────
    // Darrell 2026-07-04 (DR-0097): capitalize "the Word" because He is the
    // higher-priority, pre-temporal reality — the Programmer who framed the worlds
    // before time, the Outside Agent the sciences see in the design and will not
    // honor. Two algorithms carry the teaching (verses verbatim, DR-0076).
    id: 'gh-word-framed-worlds', section: 'gospels', name: 'The Word Framed the Worlds (the Outside Agent before time)',
    refs: ['John 1:1-3', 'Hebrews 11:3', 'Colossians 1:16-17'],
    condition: 'In the beginning was the Word, and the Word was God; the worlds were FRAMED by the word of God, and by Him all things were created and consist — He is before all things.',
    consequence: 'Reality is authored, not accidental. The One who wrote the code of the worlds stands OUTSIDE and BEFORE them — the 4th-dimensional Author, not a 3rd-dimensional part of the system He made.',
    threeD: 'Read Scripture as the Programmer\'s own word about the world He wrote, not as one more 3D data source. Order your operational life UNDER the higher frame: the Author\'s intent outranks the system\'s defaults. Give Him the Honor the design is screaming for.',
    outcome: 'A life lived inside the true frame — creature to Creator, aligned to the Author\'s purpose instead of drifting inside the machine as if it made itself.',
    psyche: 'Treating the cosmos as authored rather than accidental reorders every lesser priority under one ultimate one — the most coherent, load-bearing frame a mind can stand on.',
    tags: ['the-word', 'creation', 'logos', '4d', 'outside-agent'],
  },
  {
    id: 'gh-clearly-seen-without-excuse', section: 'epistles', name: 'Clearly Seen, Without Excuse (they knew God and glorified Him not)',
    refs: ['Romans 1:20-21'],
    condition: 'His eternal power and Godhead are CLEARLY SEEN in the things He made — the design testifies to the Designer, so every observer is without excuse.',
    consequence: 'The verdict falls not on ignorance but on WITHHELD honor: "when they knew God, they glorified Him not as God, neither were thankful" — and the heart that will not give the glory is darkened.',
    threeD: 'When you see the fingerprints of the Author — in the cell, the cosmos, the conscience — GIVE the glory out loud; do not admire the design and rob the Designer. The sciences that map His handiwork and refuse His name model the exact refusal Paul names; you do the opposite.',
    outcome: 'A mind kept from darkening because it returns the honor the evidence demands — thankful, undimmed, giving Yahweh the Glory the wise withhold.',
    tags: ['the-word', 'romans', 'without-excuse', 'honor-and-glory', 'accountability'],
  },
  {
    id: 'gh-known-before-formed', section: 'prophets', name: 'Known Before You Were Formed (the purpose predates you)',
    refs: ['Jeremiah 1:5'],
    condition: 'Before He formed you in the belly He KNEW you; before you came out of the womb He set you apart and ordained your purpose.',
    consequence: 'Your identity and calling are not invented by you under pressure — they are RECOGNIZED. You were known before you could perform.',
    threeD: 'Stop auditioning for a purpose God assigned before your first breath. Ask what you were made for, not whether you qualify — the qualification predates you.',
    outcome: 'A settled identity that circumstances cannot un-choose, because the choosing came before the circumstances.',
    psyche: 'Grounding worth in a pre-existing, unearned belovedness rather than in performance is the most stable base for identity to bear stress on.',
    tags: ['known', 'identity', 'calling', 'foreknowledge'],
  },
  {
    id: 'gh-searched-and-known', section: 'wisdom', name: 'Searched and Known (every word before it is on your tongue)',
    refs: ['Psalms 139:1-4'],
    condition: 'He has SEARCHED you and known you — your downsitting and uprising, your thought afar off, every word before it is on your tongue.',
    consequence: 'You are never unseen and never misread by Him. There is no version of you He has not already met.',
    threeD: 'Live transparent before the One who already sees. Drop the mask in prayer — He is not gathering information, He is inviting honesty. Bring Him the very thought you were hiding.',
    outcome: 'The rest of being fully known and not cast out — the end of performing for the Audience who already read the script.',
    tags: ['known', 'searched', 'transparency', 'psalm'],
  },
  {
    id: 'gh-appointment-kept', section: 'gospels', name: 'The Kept Appointment (Simeon and Anna, positioned at the very hour)',
    refs: ['Luke 2:26', 'Luke 2:36-38'],
    condition: 'To a waiting, devout soul the Holy Ghost revealed the appointment — Simeon would not see death before he saw the Lord\'s Christ — and brought him into the temple in the Spirit at the exact hour; Anna, who departed not from the temple, came in that same instant.',
    consequence: 'God primes the prepared soul and KEEPS the appointment to the letter — the promise has a kept date, and He positions His witnesses at the very moment.',
    threeD: 'Keep waiting IN the Spirit and stay where He leads — the temple, the prayer, the ready posture. Divine appointments are not luck: you show up prepared and He supplies the timing. Be a Simeon; be an Anna — positioned, and there at the instant.',
    outcome: 'You meet the very thing you were promised — on time — because you kept the posture and He kept the clock.',
    tags: ['appointment', 'simeon', 'anna', 'waiting', 'holy-ghost'],
  },
  {
    id: 'gh-told-before-he-came', section: 'torah', name: 'Told a Day Before He Came (Behold the man)',
    refs: ['1 Samuel 9:15-17'],
    condition: 'The LORD told Samuel in his ear a DAY before Saul came — "To morrow about this time I will send thee a man" — and when Samuel saw him said, "Behold the man whom I spake to thee of."',
    consequence: 'God briefs His servant ahead of the encounter and confirms it in the moment — the person in front of you may be a sent appointment you were prepared for.',
    threeD: 'Trust the nudge that goes ahead of the meeting. When someone arrives "out of nowhere," ask whether Heaven sent them; steward the encounter as briefed, not random.',
    outcome: 'You recognize the God-sent person at the door because you were told before they came.',
    tags: ['appointment', 'samuel', 'saul', 'foreknowledge', 'sent'],
  },
  {
    id: 'gh-no-guile-figtree', section: 'gospels', name: 'Seen Under the Fig Tree (He knew the man before the meeting)',
    refs: ['John 1:47-48'],
    condition: 'Before Philip called Nathanael, while he was yet under the fig tree, Jesus SAW him — and named his true heart: "an Israelite indeed, in whom is no guile."',
    consequence: 'He knows what to expect from each soul — the private moment, the real character — before the first word. Pretense has nothing to work with.',
    threeD: 'You cannot impress Him and you cannot fool Him — so stop trying. Be real; He already saw you under your fig tree. Let being fully known disarm the performance.',
    outcome: 'The freedom of the seen: worship without a mask, because the One you meet already knows the person He is meeting.',
    psyche: 'Being accurately known and still received is the exact opposite of shame — the one condition under which a person can finally stop hiding.',
    tags: ['known', 'nathanael', 'figtree', 'no-guile'],
  },
  {
    id: 'gh-provider-prepared', section: 'torah', name: 'The Provider Commanded Ahead (I have commanded a widow there)',
    refs: ['1 Kings 17:9'],
    condition: 'Before Elijah reached Zarephath, God had ALREADY commanded the provider: "behold, I have commanded a widow woman there to sustain thee."',
    consequence: 'Your provision is pre-arranged at the OTHER end of the obedience — the supply is briefed before you go.',
    threeD: 'Obey the "arise and go" before you can see the supply. God has often already spoken to the person who will sustain you; the going is your part, the commanding is His.',
    outcome: 'You walk into provision that was set up before you left — because you moved on the word, not on the sight.',
    tags: ['provision', 'elijah', 'widow', 'prepared'],
  },
  {
    id: 'gh-foreknew-betrayer', section: 'gospels', name: 'He Knew the Betrayer (foreknown is not the same as faithful)',
    refs: ['John 13:11'],
    condition: '"For He knew who should betray Him" — He knew from the beginning who believed not and who would hand Him over, and washed his feet anyway.',
    consequence: 'Being foreknown is NOT the same as being faithful: God\'s knowledge of a soul never cancels that soul\'s own choice, and each still answers for it. The pattern cuts both ways.',
    threeD: 'Do not presume on being known — Judas was known and still chose. Let "He knows me" produce reverence, not entitlement; the One who knows the betrayer knows you, and loves you toward repentance while there is still time.',
    outcome: 'A sober, grateful walk — fully known, still chosen, and warned in love that His foreknowledge never removes your accountability.',
    tags: ['foreknowledge', 'judas', 'accountability', 'choice'],
  },
  {
    // ── HE DECLARES THE END FROM THE BEGINNING ─────────────────────────────────
    // Darrell 2026-07-04: "Yahweh tells the end from the beginning because He IS
    // THE ONE no one else can do that — He is in the past, present and future at
    // the same time... our minds can't even comprehend that... look at our human
    // bodies that are dying — we can't even keep them working without Yahweh; we
    // are eternally doomed." He alone stands outside time (the 4D Author, DR-0097),
    // is past finding out, and holds our very breath in His hand. Verses verbatim.
    id: 'gh-end-from-beginning', section: 'prophets', name: 'He Declares the End From the Beginning (only Yahweh can)',
    refs: ['Isaiah 46:9-10'],
    condition: '"I am God, and there is none else; I am God, and there is none like me, Declaring the end from the beginning, and from ancient times the things that are not yet done." Only the One outside time can tell the end before the beginning arrives.',
    consequence: 'What He purposes stands: "My counsel shall stand, and I will do all my pleasure." History is not up for grabs — the One who cannot be surprised already wrote its end, and no rival can.',
    threeD: 'Anchor your peace to His declared end, not the day\'s headline. When the middle of the story is chaos, remember Who already published the last chapter — and that only He could. Live from the ending He announced, not the fear the moment sells.',
    outcome: 'Steadiness in the middle of the story, because the One outside time has already secured the end.',
    psyche: 'Certainty about the ultimate outcome is the strongest buffer a mind has against present uncertainty — and here that certainty rests on the only One who already inhabits the outcome.',
    tags: ['end-from-beginning', 'sovereignty', 'only-yahweh', 'time', 'isaiah'],
  },
  {
    id: 'gh-first-and-last', section: 'prophets', name: 'The First and the Last (past, present, and future at once)',
    refs: ['Isaiah 44:6', 'Revelation 1:8'],
    condition: '"I am the first, and I am the last; and beside me there is no God" — "I am Alpha and Omega... which is, and which was, and which is to come, the Almighty." He is in the past, the present, and the future at the same time.',
    consequence: 'He bookends all of time and stands outside it — no moment of yours is behind Him or ahead of Him; He is already there. Nothing about your timeline is news to Him.',
    threeD: 'Bring Him the thing you dread in the future AND the thing you regret in the past — He is Lord of both at once. Stop living as if your worst yesterday or scariest tomorrow is outside His reach; He is already standing in both.',
    outcome: 'Rest that spans your whole timeline, because the First and the Last already holds every part of it.',
    tags: ['first-and-last', 'alpha-omega', 'eternity', 'past-present-future'],
  },
  {
    id: 'gh-past-finding-out', section: 'epistles', name: 'His Ways Past Finding Out (our minds cannot comprehend Him)',
    refs: ['Romans 11:33', 'Isaiah 55:8-9'],
    condition: '"O the depth of the riches both of the wisdom and knowledge of God! how unsearchable are His judgments, and His ways past finding out!" — "as the heavens are higher than the earth, so are My ways higher than your ways."',
    consequence: 'His mind is not a bigger version of yours — it is categorically higher. What you cannot comprehend about Him is not a gap to be closed but the very evidence that He is God and you are not.',
    threeD: 'Let the parts of Him you cannot figure out drive worship, not doubt. Trade the demand to understand everything for trust in the One who does. When His way makes no sense to your 3D logic, bow rather than shrink Him to your size.',
    outcome: 'Humility that rests instead of frets — worshipping the unsearchable God instead of resenting a god small enough to fully explain.',
    tags: ['unsearchable', 'higher-ways', 'humility', 'incomprehensible', 'romans'],
  },
  {
    id: 'gh-breath-in-his-hand', section: 'wisdom', name: 'Your Breath Is in His Hand (we cannot keep ourselves alive)',
    refs: ['Job 12:10', 'Acts 17:28', 'Psalms 103:15-16'],
    condition: '"In whose hand is the soul of every living thing, and the breath of all mankind" — "in Him we live, and move, and have our being." Man\'s days are as grass; the wind passes over it, and it is gone.',
    consequence: 'You do not keep yourself alive. Every heartbeat is on loan; the dying body you cannot repair is held together breath by breath by Him. Apart from Him you are dust and eternally doomed; in Him is your life.',
    threeD: 'Receive each day as borrowed breath and spend it on what is eternal. Stop trusting the frail machine of the body as if it were self-sustaining; number your days, and give the Lender the life He is holding open. Depend on Him, out loud.',
    outcome: 'A rightly-sized life — grateful, dependent, spent on the eternal — because you know Who is holding your breath.',
    psyche: 'Honestly reckoning with mortality, rather than denying it, is what reorders a life toward what actually lasts — and here the reckoning ends in dependence on the One who holds the breath, not in despair.',
    tags: ['breath', 'frailty', 'dependence', 'mortality', 'in-him-we-live'],
  },
  {
    id: 'gh-wages-and-gift', section: 'epistles', name: 'The Wage and the Gift (doomed apart from Him, Life through the Son)',
    refs: ['Romans 6:23'],
    condition: '"For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord." Two ledgers: what sin PAYS, and what God GIVES.',
    consequence: 'Left to our own account we are eternally doomed — death is the earned wage. But the gift cannot be earned, only received: eternal life, through the Son, is offered to the very ones who could never pay.',
    threeD: 'Stop trying to earn what is a gift, and stop pretending the wage is not real. Receive the Son; then live as one who was doomed and got given Life instead — grateful, not entitled, and quick to hand the same gift to others.',
    outcome: 'A settled eternity received, not achieved — doom exchanged for Life through Jesus, and a heart that gives the gift away.',
    tags: ['wages-of-sin', 'gift-of-god', 'eternal-life', 'doom-and-rescue', 'romans'],
  },
  {
    // ── ONLY YAHWEH SAVES: MONEY CANNOT, THE WORLD IS OCCUPIED, DEATH IS A DOOR ─
    // Darrell 2026-07-04: "money can't help us only Yahweh, and He engineered
    // this to be The Way because we left Him and went to His sworn enemy and he
    // became the father and god of this world... we all leave time / the 3rd-
    // dimensional space for the eternal 4th-dimensional space; where you go and
    // why is what we are studying for that crown." Verses verbatim. (The Genesis 6
    // cosmology is TAUGHT below as the Word shows it — DR-0098: we teach the Word,
    // we do not stage a debate — not hedged as "contested.")
    id: 'gh-money-cannot-redeem', section: 'wisdom', name: 'Money Cannot Ransom a Soul (only Yahweh redeems)',
    refs: ['Psalms 49:6-8', 'Proverbs 11:4'],
    condition: 'Those who trust in wealth cannot ransom a soul: "None of them can by any means redeem his brother, nor give to God a ransom for him" — and "riches profit not in the day of wrath."',
    consequence: 'Money buys nothing at the one border that matters. The redemption of a soul is too costly for any human currency; only Yahweh can pay it — and "righteousness delivereth from death," not riches.',
    threeD: 'Stop asking money to do what only Yahweh can. Steward wealth for the Kingdom, but anchor your security in the Redeemer, not the balance. When the day of wrath is the question, the only sufficient answer is His righteousness applied to you.',
    outcome: 'Security relocated from a number to the Redeemer — freed from the lie that enough money can save what only He can.',
    tags: ['money', 'redemption', 'only-yahweh', 'day-of-wrath', 'psalm'],
  },
  {
    id: 'gh-god-of-this-world', section: 'epistles', name: 'The God of This World (we left Him; the world is occupied, not neutral)',
    refs: ['2 Corinthians 4:4', 'John 8:44', '1 John 5:19'],
    condition: 'We left Him, and "the whole world lieth in wickedness": "the god of this world hath blinded the minds of them which believe not," and to those who follow the lie Jesus says, "Ye are of your father the devil."',
    consequence: 'There are only two fathers and two kingdoms. Apart from the Light of the gospel, the usurper who became the god of this world keeps the mind blind — the default state is captivity, not neutrality.',
    threeD: 'Do not mistake the world-system\'s default for neutral ground — it is occupied. Come under the Light deliberately: renounce the lie and its father, and let the gospel un-blind what the god of this world darkened. Choose your Father on purpose.',
    outcome: 'Eyes opened out of the default blindness — transferred from the kingdom of the usurper into the Kingdom of the Son.',
    tags: ['god-of-this-world', 'the-fall', 'two-fathers', 'blindness', 'light'],
  },
  {
    id: 'gh-appointed-then-judgment', section: 'epistles', name: 'Appointed Once to Die (death is a doorway to the eternal, then the judgment)',
    refs: ['Hebrews 9:27', '2 Corinthians 5:8'],
    condition: '"It is appointed unto men once to die, but after this the judgment" — and to be "absent from the body" is to be "present with the Lord." Every soul leaves this life for the eternal, then gives account.',
    consequence: 'Death is a doorway, not a wall: you leave the 3rd-dimensional body once, and what waits is the judgment and His presence. Where you go, and why, is settled by how you lived here — this is the exam the crown is offered for.',
    threeD: 'Live today as one certain to stand there: study for the crown, keep short accounts, and store where moth does not corrupt. Let the fixed appointment of death make you serious about the eternal instead of numb to it.',
    outcome: 'A life aimed past the doorway — ready to be absent from the body and present with the Lord, studying now for the crown then.',
    tags: ['death', 'judgment', 'eternity', 'crown', 'appointed'],
  },
  {
    // ── THE UNSEEN WAR ON THE MIND, AND THE ONE WHO ACTUALLY KNOWS THE HEART ────
    // Darrell 2026-07-04: "evil 4th-dimensional gods can introduce thoughts and
    // watch us..." Taught as the Word shows it (DR-0098: teach the Word, do not
    // stage a debate); verses verbatim (DR-0076). The counterfeit suggests and
    // watches from OUTSIDE — but only Yahweh knows the heart. He is THE ONE.
    id: 'gh-enemy-injects-thoughts', section: 'gospels', name: 'Not Every Thought Is Yours (the enemy injects; you take captive)',
    refs: ['John 13:2', 'Acts 5:3', '2 Corinthians 10:5'],
    condition: 'The enemy injects thoughts: "the devil having now put into the heart of Judas... to betray him" (John 13:2); "why hath satan filled thine heart to lie" (Acts 5:3). A suggestion arrives that did not originate with you.',
    consequence: 'Not every thought in your head is from you — some are planted. But a planted thought is not a committed one: you can be "casting down imaginations... and bringing into captivity every thought to the obedience of Christ."',
    threeD: 'NOTICE the thought, TEST it against the Word, CAPTURE it, REDIRECT it (the Mind of Christ). Stop treating every arriving thought as self and settled; inspect the mail before you sign for it. A suggestion refused at the door never becomes an act.',
    outcome: 'A guarded mind — thoughts sorted at the gate, the enemy\'s injections refused, only the obedience of Christ let through.',
    psyche: 'The gap between a thought arriving and a thought being acted on is where all freedom lives; naming an intrusive thought as not-me instead of fusing with it is exactly what breaks its grip.',
    tags: ['thoughts', 'enemy', 'captive-thoughts', 'mind-of-christ', 'temptation'],
  },
  {
    id: 'gh-only-he-knows-the-heart', section: 'torah', name: 'He Watches — but Only Yahweh Knows the Heart (the counterfeit is not omniscient)',
    refs: ['1 Peter 5:8', '1 Kings 8:39', 'Jeremiah 17:10'],
    condition: 'The adversary "walketh about... seeking whom he may devour" (1 Peter 5:8) — he watches and prowls. But "thou, even thou only, knowest the hearts of all the children of men" (1 Kings 8:39); "I the LORD search the heart" (Jeremiah 17:10).',
    consequence: 'The counterfeit observes you from the outside and suggests — but he is NOT omniscient. Only Yahweh knows the heart. The enemy watches; God KNOWS. They are not equals, and that difference is your safety.',
    threeD: 'Do not fear the watcher as though he were God — he is not. Guard the outside he can read (your eyes, words, company) AND bring the inside to the only One who actually knows it. Live for the Audience who knows your heart, not the accuser who is only guessing at it.',
    outcome: 'Freedom from the fear of an all-seeing enemy — because the only One who truly sees the heart is the One who loves you and covers you.',
    tags: ['watching', 'only-yahweh-knows', 'counterfeit', 'the-heart', 'not-omniscient'],
  },
  {
    id: 'gh-sons-of-god-and-giants', section: 'torah', name: 'The Sons of God and the Giants (taught as the Word shows it)',
    refs: ['Genesis 6:1-4', 'Job 1:6', 'Job 38:7', 'Numbers 13:33'],
    condition: 'The Word shows it plainly: "the sons of God saw the daughters of men... and they took them wives," and "there were giants in the earth in those days; and also after that" (Genesis 6:2,4). The Word\'s own usage names the "sons of God" as heavenly beings before His throne (Job 1:6; 38:7).',
    consequence: 'A real incursion left a real mark on the human timeline — mighty men, men of renown; giants before the flood, "and also after that" (the sons of Anak, Numbers 13:33). We teach it as it reads, worked the way the Word explains — not staged as a debate.',
    threeD: 'Read the Word by the Word: let Job 1:6 and 38:7 define "sons of God" before any outside frame. Take the account seriously — the war over the human line is old and real — and stand in the line of the promised Seed who crushes the serpent.',
    outcome: 'A sober, Word-grounded view of the unseen war on humanity — neither spooked by it nor explaining it away, standing under the Seed who already won.',
    tags: ['sons-of-god', 'giants', 'genesis-6', 'the-word-explains-the-word'],
  },
  {
    id: 'gh-angels-left-their-estate', section: 'epistles', name: 'The Angels That Left Their Estate (already sentenced)',
    refs: ['Jude 1:6', '2 Peter 2:4'],
    condition: '"The angels which kept not their first estate, but left their own habitation, He hath reserved in everlasting chains under darkness unto the judgment of the great day" (Jude 6); "God spared not the angels that sinned, but cast them down... to be reserved unto judgment" (2 Peter 2:4).',
    consequence: 'Rebellion has already been judged and sentenced — the fallen are on a chain and a clock. Their end is fixed; they are not free agents but condemned prisoners awaiting the great day.',
    threeD: 'Fight FROM victory, not FOR it. The powers arrayed against you are already sentenced; resist them (James 4:7) from the standing of a King whose enemies are in chains, not from the panic of an even fight.',
    outcome: 'Courage grounded in a verdict already rendered — the enemy is a condemned prisoner, and you serve the Judge.',
    tags: ['fallen-angels', 'judgment', 'chains', 'already-sentenced'],
  },
  {
    id: 'gh-spirits-seek-a-body', section: 'gospels', name: 'Spirits Seek a House (empty is not enough — be filled)',
    refs: ['Matthew 12:43-45'],
    condition: '"When the unclean spirit is gone out of a man, he walketh through dry places, seeking rest, and findeth none. Then he saith, I will return into my house from whence I came out; and when he is come, he findeth it empty, swept, and garnished" (Matthew 12:43-44).',
    consequence: 'Unclean spirits seek a "house" — they crave a body to occupy, and an empty, un-filled life invites a return worse than the first. Cleaned-out is not enough; the house must be OCCUPIED by the right Owner.',
    threeD: 'Do not merely empty (stop a sin, quit a vice) — FILL. Be occupied by the Holy Spirit and the Word so there is no vacancy to return to. Give no place (Ephesians 4:27); a swept-but-empty house is an invitation.',
    outcome: 'A filled, occupied life — no vacancy for the return, the rightful Owner in residence.',
    tags: ['unclean-spirits', 'embodiment', 'empty-house', 'be-filled', 'give-no-place'],
  },
  {
    // ── HAVING THE WORD IS NOT OBEYING IT; THE WORLD IS ENMITY; THY WILL BE DONE ─
    // Darrell 2026-07-04: "American churches, governments, politicians, police...
    // have the Word and purposefully use it to deceive and defend their ways even
    // when the Word explains and gives the solutions... we want Truth for Yahweh's
    // perspective and will. We want to suffer if that is what the King wants —
    // however He wants our souls to prosper. His Word not mine. Those who love the
    // world have enmity with Yahweh." Taught, not debated (DR-0098); verbatim.
    id: 'gh-handling-word-deceitfully', section: 'epistles', name: 'Having the Word Is Not Obeying It (they wield it to defend their ways)',
    refs: ['2 Corinthians 4:2', 'Mark 7:13', '2 Peter 3:16', '2 Timothy 2:15'],
    condition: 'Those who hold the Word can wield it to defend themselves: "handling the word of God deceitfully" (2 Corinthians 4:2), "making the word of God of none effect through your tradition" (Mark 7:13), wresting the scriptures "unto their own destruction" (2 Peter 3:16).',
    consequence: 'Possessing the Word is not submitting to it. The same text that gives the solution can be twisted to defend the sin — and the twisting destroys the twister. The line is not who HOLDS the Word but who OBEYS it.',
    threeD: 'Do not use the Word to justify your way; let it judge your way. "Rightly dividing the word of truth" (2 Timothy 2:15) means reading it for Yahweh\'s will, not for permission — even when it corrects you, especially when it corrects you.',
    outcome: 'A conscience under the Word instead of over it — using Scripture to find His will, never to defend your own.',
    tags: ['handle-the-word', 'deceit', 'tradition', 'rightly-dividing', 'accountability'],
  },
  {
    id: 'gh-friendship-world-enmity', section: 'epistles', name: 'Friendship With the World Is Enmity With Yahweh (no neutral middle)',
    refs: ['James 4:4', '1 John 2:15-16'],
    condition: '"The friendship of the world is enmity with God: whosoever therefore will be a friend of the world is the enemy of God" (James 4:4). "Love not the world... If any man love the world, the love of the Father is not in him" (1 John 2:15).',
    consequence: 'There is no neutral middle. To love the world-system — the lust of the flesh, the lust of the eyes, and the pride of life — is to stand in enmity with Yahweh. You cannot befriend what rejected the Son and call it harmless.',
    threeD: 'Audit your affections, not only your actions. Where the world has your love, the Father does not. Choose Him over the system on the specific things you are tempted to keep — the friendship is decided in the particulars.',
    outcome: 'Undivided love — the Father\'s, not the world\'s — because you stopped trying to be a friend of both.',
    tags: ['love-not-the-world', 'enmity', 'friendship-with-the-world', 'undivided'],
  },
  {
    id: 'gh-not-my-will-but-thine', section: 'gospels', name: 'Not My Will but Thine (willing to suffer at the King\'s word)',
    refs: ['Luke 22:42', '1 Peter 4:19', '3 John 1:2'],
    condition: 'The King prayed it first: "nevertheless not my will, but thine, be done" (Luke 22:42). We commit our souls to Him even in suffering — "let them that suffer according to the will of God commit the keeping of their souls to Him" (1 Peter 4:19) — while He wills that our soul prosper (3 John 2).',
    consequence: 'His Word, not mine. We will accept suffering IF that is what the King wants — and He is a faithful Creator who wills the soul to prosper, so even the suffering is safe in His hands. Surrender is not loss; it is trust placed in the One who cannot mishandle a committed soul.',
    threeD: 'Pray the harder half of the King\'s own prayer: "not my will, but Thine." When His way costs you, commit your soul to the faithful Creator and keep doing good — His will over your comfort, His Word over your preference.',
    outcome: 'A soul kept safe in surrender — willing to suffer at the King\'s word, and prospering under His will even through the cost.',
    psyche: 'Surrendering the outcome to a trusted, faithful authority — instead of white-knuckling control — is what converts suffering from meaningless threat into bearable, even fruitful, trust.',
    tags: ['thy-will-be-done', 'suffering', 'surrender', 'soul-prosper', 'his-word-not-mine'],
  },
  {
    id: 'gh-word-of-testimony', section: 'revelation', name: 'The Word of Their Testimony (eat the Word and the testimony aligns)',
    refs: ['Revelation 12:11', 'Jeremiah 15:16', 'Isaiah 55:8-9', 'Romans 13:7'],
    condition: 'The accuser is overcome by the blood of the Lamb AND by the word of their testimony — and a testimony only carries weight when the mouth and the life run the same Word.',
    consequence: 'EAT the Word — "Thy words were found, and I did eat them" — and it becomes the joy and rejoicing of the heart: the word and the testimony ALIGN, and the aligned testimony overcomes.',
    threeD: 'Freedom comes by the word of your testimony, so feed the testimony: eat the Word daily until what you say and what you lived are the same record. And render honour to whom honour is due — credit the person who deserves it, starting with the Author whose thoughts are as high above ours as the heavens are above the earth. That gap is why these are His algorithms, not ours.',
    outcome: 'A testimony the accuser cannot cross-examine — Word eaten, word spoken, life lived, all one aligned record; and the credit flowing to the One who wrote it.',
    psyche: 'Integrity is the mind\'s load-bearing wall: when the spoken word and the lived record match, there is nothing to defend and no second story to maintain — the alignment itself is the freedom, and giving credit where it is due keeps the self honest about what was received versus achieved.',
    tags: ['testimony', 'overcoming', 'eat-the-word', 'honour', 'alignment'],
  },
];

// Verbatim KJV text for a catalog ref — from the verified fetch ONLY.
export function godheadVerse(ref) {
  return VERSES[ref] || '';
}

export function godheadBySection() {
  return GODHEAD_SECTIONS.map((s) => ({
    ...s,
    entries: GODHEAD_ALGORITHMS.filter((a) => a.section === s.key),
  }));
}

// The game hand-off (Darrell: "All eternal algorithms going into the game so
// they can be further aware of the Word") — same triple, same eight axes.
export function godheadToGameCards() {
  return GODHEAD_ALGORITHMS.map((a) => ({
    id: `ghstudy-${a.id}`,
    type: 'card',
    title: a.name,
    body: `IF: ${a.condition} THEN: ${a.consequence}`,
    lens: a.threeD,
    scripture: { ref: a.refs[0] },
    choices: [
      { label: 'Run the algorithm this week', body: 'Pick one real place it applies and do it — the Word done, not admired.', effects: { faith: 2, wisdom: 1, provision: 1 }, redemption: true },
      { label: 'Admire it and change nothing', body: 'A hearer only — the pattern stays on the page (James 1:22).', effects: { faith: -1, wisdom: -1 } },
      { label: 'Teach it to someone this week', body: 'The Word multiplied — walk someone through the pattern and its Scripture.', effects: { family: 1, souls: 2, service: 1 } },
    ],
  }));
}
