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
  'Exodus':        'The rescue masterpiece — the Blood, the passover, and a people walked out of what owned them.',
  'Deuteronomy':   'The covenant restated on the doorstep — the choice set before every generation about to cross over.',
  'Joshua':        'The taking of what was promised — allegiance declared out loud, house by house.',
  '2 Chronicles':  'The kings measured by one question — did the house seek Him? Humility heals the land.',
  'Psalms':        'The heart\'s whole range before Yahweh — praise, ache, war, rest — each psalm its own room in the masterpiece.',
  'Proverbs':      'The kings\' algorithm book — written for the kings of The Eternal King and simultaneously for The Way; wisdom as executable one-liners.',
  'Isaiah':        'The masterpiece of majesty and the Servant — the throne room and the wounds, in one scroll.',
  'Ezekiel':       'The watchman\'s book — every soul answers for itself, and dead bones learn to stand.',
  'Daniel':        'The furnace-and-throne book — allegiance under empire, and the Kingdom that outlasts them all.',
  'Malachi':       'The last word before the silence — prove Me now, and the Sun of righteousness rising.',
  'Matthew':       'The King\'s gospel — the Kingdom\'s constitution preached from a mountain.',
  'Luke':          'The physician\'s gospel — the meticulous mercy of God, table by table.',
  'John':          'The eternal gospel — in the beginning was the Word; belief unto life, written that ye might believe.',
  'Romans':        'The legal masterpiece — the whole case of the Gospel argued to a verdict: no condemnation.',
  '1 Corinthians': 'The Body\'s house rules — gifts, order, love, and resurrection, written to a messy real church.',
  '2 Corinthians': 'Strength in the cracked jar — treasure in earthen vessels, grace sufficient, the cheerful sower.',
  'Philippians':   'The joy-from-a-cell letter — the mind of Christ descending, and every knee bowing.',
  'Hebrews':       'The better-covenant masterpiece — a great High Priest, faith\'s hall, and the assembling not forsaken.',
  'James':         'The doing book — faith with its sleeves rolled up; hearers become doers or deceive themselves.',
  '1 Peter':       'The furnace letter — tried gold, a royal priesthood, and hope that suffering cannot repossess.',
  '1 John':        'Inside LOVE — God is love, and the dwelling is mutual; assurance written in family language.',
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
    id: 'gh-resist-flee', section: 'epistles', name: 'Submit · Resist → he Flees',
    refs: ['James 4:7-8'],
    condition: 'SUBMIT yourselves to God first — then resist the devil; draw nigh to God.',
    consequence: 'he WILL flee from you; and He draws nigh to you. Both movements are guaranteed responses.',
    threeD: 'The order matters: submission powers the resistance. Unsubmitted resistance is noise; submitted resistance routs the adversary every time it is run.',
    outcome: 'An enemy in retreat and a God drawing near — the battlefield rearranged by two obediences.',
    tags: ['warfare', 'submission', 'resistance', 'nearness'],
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
