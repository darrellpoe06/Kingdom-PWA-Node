// =============================================================================
// games/the-way-up.js — "The Way Up: From the Wilderness to the Table"
// =============================================================================
// A journey game built on the biblical PROMOTION ALGORITHM (declared by Darrell,
// 2026-07-06): Yahweh raises the meek out of the wilderness. You start in a low
// place — the pit, the prison, the field, the ash-heap — and you rise by the Way
// Yahweh promised, not the world's: you PROGRAM YOURSELF with His Word (the
// 4th-dimensional Data — Joshua 1:8; Romans 12:2), He develops CHARACTER in you
// (meekness + a sound mind, 2 Timothy 1:7; Matthew 5:5), you RESIST the enemy
// until he flees (James 4:7), and your soul prospers first — so everything else
// that prospers rests on solid ground (3 John 1:2). The finish is not a pile of
// money: it is the TABLE Yahweh sets before your enemies, and the enemies He
// makes a footstool (Psalm 23:5; Psalm 110:1) — a testimony so plainly His that
// it inspires the very ones who wrote you off.
//
// The four starting wildernesses are biblical archetypes (Joseph's pit &
// prison, David overlooked in the field, Job's loss) and one is grounded in a
// real testimony: a child raised in the projects a system forgot, whom Yahweh
// still lifted. That is the wilderness made concrete — real, documented ground,
// not metaphor (COMMUNITY-FIRST-MISSION).
//
// PURE CONTENT for the generic engine in ./engine.js. Every `scripture: { ref }`
// names a verse that lib/scripture-kjv.js carries VERBATIM (guarded by the test
// suite + scripts/append-way-up-verses.mjs) — no verse text is typed here
// (DR-0076). `lens` is the game's own framing of Yahweh's perspective on a
// moment; it is plainly the game's voice, not quoted Scripture.
//
// DOCTRINE / FRAMING are Darrell + Bishop's to govern (GOVERNANCE-EXECUTION-
// ADVISORY): the grace-forward finish (no condemnation tier — the lowest outcome
// is an open invitation) and the systemic-wilderness framing are flagged in the
// PR for SME review rather than asserted as settled.
// =============================================================================

// ---- the scoring axes (character Yahweh develops, not the world's scoreboard) -
// Weight tilts the finish toward what Yahweh weighs: His Word in you, the
// character He forms, faith, a sound mind and a prospering soul carry the ascent;
// provision (wealth) weighs least — a tool for the others, never the score.
export const CATEGORIES = [
  { key: 'word',      label: 'The Word',          short: 'His Word programmed in',        weight: 3 },
  { key: 'character', label: 'Character',         short: 'The meekness Yahweh develops',  weight: 3 },
  { key: 'faith',     label: 'Faith',             short: 'Resisting the enemy, trusting', weight: 3 },
  { key: 'mind',      label: 'Sound Mind',        short: 'Thoughts kept, fear refused',   weight: 2 },
  { key: 'soul',      label: 'A Prospering Soul', short: 'Inner health first (3 John 2)', weight: 2 },
  { key: 'witness',   label: 'Witness',           short: 'The testimony that inspires',   weight: 2 },
  { key: 'provision', label: 'Provision',         short: 'Prosperity, held rightly',      weight: 1 },
];

// ---- starting wildernesses (the low place the ascent begins from) -----------
const PATHS = [
  {
    id: 'projects',
    label: 'Out of the Projects',
    blurb: 'You are born into a place a system forgot — distressed housing, a hollowed-out economy, the odds stacked before you could walk. This is a TRUE wilderness: it is the founder’s own. Yahweh sees the low place, and the low place is where He starts.',
    lens: 'He led you into the wilderness to humble you and prove you, to know what was in your heart — not to leave you there.',
    scripture: { ref: 'Deuteronomy 8:2' },
    opening: [
      // Real-data testimony seed (Darrell, 2026-07-06). The founder's documented
      // starting ground, folded into the opening space (kept to 3 openings so
      // every wilderness shares one board length — the multiplayer invariant).
      // Facts are real, named full-real at his direction; the lens is the game's
      // voice, and Scripture stays verbatim in scripture-kjv.js.
      { id: 'prj-low', type: 'word', stage: 'The Wilderness', title: 'The Low Place — A True Wilderness', body: 'This one is real. This platform’s founder was born in Valley Homes — the Turnkey public housing at 25th & 11th in Rock Island, later declared "severely distressed" and torn down — and raised on to Horizon Homes in Davenport, inside a Quad Cities that lost 55% of its factory jobs — a ZIP where, even now, roughly four in ten Black residents live below the poverty line. The block a map skips over, the odds a report already wrote off. But the God who sees was already there — and He still raised him to a table.', lens: 'The wilderness here is not a metaphor — it is a measured place a boy was carried out of. What Yahweh did once, He does again; He raises the poor from the dust to seat them with princes.', scripture: { ref: 'Deuteronomy 8:2' }, effects: { character: 1, faith: 1 } },
      { id: 'prj-word', type: 'word', stage: 'The Wilderness', title: 'A Word Takes Root', body: 'Someone — a grandmother, a church mother, a teacher — plants one Scripture deep enough that it never leaves you.', lens: 'The Word planted in a hard place still finds soil; it is the seed of everything that comes up later.', scripture: { ref: 'Psalm 119:105' }, effects: { word: 2, faith: 1 } },
      { id: 'prj-trial', type: 'card', stage: 'The Wilderness', title: 'The Wilderness Tests', body: 'A card from the wilderness.', deck: 'trial' },
    ],
  },
  {
    id: 'setback',
    label: 'The Setback',
    blurb: "Like Joseph, you are handed a prison you did not earn — a record, a betrayal, a door slammed by someone else's lie. And even here, the LORD is with you.",
    lens: 'The LORD was with Joseph in the prison, and made all that he did to prosper — the cell did not cancel the calling.',
    scripture: { ref: 'Genesis 39:2' },
    opening: [
      { id: 'set-cell', type: 'word', stage: 'The Wilderness', title: 'A Prison Not Earned', body: 'The accusation was false; the consequence is real. You could rot in bitterness or serve where you stand.', lens: 'Yahweh promotes the faithful in the cell before He promotes them in the palace — the prison is training ground.', scripture: { ref: 'Genesis 39:2' }, effects: { character: 2, faith: 1 } },
      { id: 'set-mind', type: 'word', stage: 'The Wilderness', title: 'Keep the Mind', body: 'The nights are the hardest. You refuse the spirit of fear and choose the sound mind Yahweh gave you.', lens: 'Yahweh gave not the spirit of fear, but of power, love, and a sound mind — you guard it like a gate.', scripture: { ref: '2 Timothy 1:7' }, effects: { mind: 2, faith: 1 } },
      { id: 'set-trial', type: 'card', stage: 'The Wilderness', title: 'The Wilderness Tests', body: 'A card from the wilderness.', deck: 'trial' },
    ],
  },
  {
    id: 'overlooked',
    label: 'The Overlooked',
    blurb: 'Like David, you are the youngest, left in the field while others are considered. The room passes over you. Yahweh does not look where men look.',
    lens: 'Man looks on the outward appearance, but Yahweh looks on the heart — He humbles the proud and lifts the one no one counted.',
    scripture: { ref: '1 Peter 5:6' },
    opening: [
      { id: 'ovl-field', type: 'word', stage: 'The Wilderness', title: 'Left in the Field', body: 'You do the faithful, unseen work while others are chosen. You keep it clean anyway.', lens: 'Humble yourself under the mighty hand of Yahweh, and He will exalt you in due time — His timing, not the room’s.', scripture: { ref: '1 Peter 5:6' }, effects: { character: 2, word: 1 } },
      { id: 'ovl-faithful', type: 'word', stage: 'The Wilderness', title: 'Faithful in Little', body: 'No one is watching the small thing you tend well. Yahweh is.', lens: 'He who is faithful in the least is faithful in much; the field is the audition for the throne.', scripture: { ref: 'Luke 16:10' }, effects: { character: 1, faith: 1, provision: 1 } },
      { id: 'ovl-trial', type: 'card', stage: 'The Wilderness', title: 'The Wilderness Tests', body: 'A card from the wilderness.', deck: 'trial' },
    ],
  },
  {
    id: 'loss',
    label: 'The Ash-Heap',
    blurb: 'Like Job, you have lost what you cannot get back by trying — health, people, a whole life’s build gone in a season. You sit in the ashes, and you do not curse God.',
    lens: 'What was meant for evil, Yahweh can work for good; the ash-heap is not the last chapter for the one who holds on to Him.',
    scripture: { ref: 'Romans 8:28' },
    opening: [
      { id: 'los-ash', type: 'word', stage: 'The Wilderness', title: 'In the Ashes', body: 'Everything is gone and the comforters only make it worse. You hold your integrity and your God.', lens: 'Yahweh is nearest in the dark; the trial that strips you also reveals what cannot be taken.', scripture: { ref: 'Romans 8:28' }, effects: { faith: 2, character: 1 } },
      { id: 'los-word', type: 'word', stage: 'The Wilderness', title: 'The Word in the Dark', body: 'You go back to the only thing that held: what He said. You feed on it like bread.', lens: 'Man does not live by bread alone, but by every word that proceeds from the mouth of Yahweh.', scripture: { ref: 'Deuteronomy 8:3' }, effects: { word: 2, soul: 1 } },
      { id: 'los-trial', type: 'card', stage: 'The Wilderness', title: 'The Wilderness Tests', body: 'A card from the wilderness.', deck: 'trial' },
    ],
  },
];

// ---- the shared ascent (all wildernesses converge and climb the same way) ----
const TRUNK = [
  { id: 'manna', type: 'word', stage: 'The Wilderness', title: 'Manna & the Word', body: 'The wilderness feeds you just enough, and teaches you the lesson bread cannot: where life actually comes from.', lens: 'He fed you manna to teach you that man lives by every word from Yahweh’s mouth — the wilderness is a school, not a grave.', scripture: { ref: 'Deuteronomy 8:3' }, effects: { word: 2, faith: 1, mind: 1 } },

  { id: 'bread', type: 'crossroads', stage: 'The Testing', title: 'The Shortcut Offer',
    body: 'The enemy meets you weakest and hungriest with the oldest offer: turn the stone to bread now, take the shortcut, skip the wilderness. The Way up is slower.',
    lens: 'The first temptation is always to feed the flesh outside the Word — to win the wrong way and call it wisdom.',
    scripture: { ref: 'Matthew 4:4' },
    choices: [
      { label: 'Take the shortcut — win now', body: 'You grab the quick win outside the Way. It feeds today and starves the soul.', effects: { provision: 2, faith: -2, mind: -1 } },
      { label: 'Stand on every word of Yahweh', body: 'You answer the way the Lord answered in His own wilderness: by the Word.', lens: 'Man shall not live by bread alone, but by every word that proceeds out of the mouth of God — the Word wins the wilderness.', effects: { word: 2, faith: 2, character: 1 }, redemption: true },
    ] },

  { id: 'resist', type: 'crossroads', stage: 'The Testing', title: 'Resist the devil',
    body: 'The adversary shows you all the kingdoms of a shortcut and says, bow once and it is yours. The whole ascent hangs on this bow.',
    lens: 'Submit to Yahweh; resist the adversary and he flees. The throne he offers for a bow, Yahweh gives for a life laid down.',
    scripture: { ref: 'James 4:7' },
    choices: [
      { label: 'Bow once for the quick kingdom', body: 'You take his terms. The kingdom you get owns you, not the other way around.', effects: { provision: 3, faith: -3, character: -2 } },
      { label: 'Resist — and watch him flee', body: 'You refuse the bow and stand. The pressure breaks; he leaves.', lens: 'Resist the devil, and he will flee from you; draw near to Yahweh, and He draws near to you.', scripture: { ref: '1 Peter 5:8' }, effects: { faith: 3, character: 2, word: 1 }, redemption: true },
    ] },

  { id: 'trial1', type: 'card', stage: 'The Testing', title: 'The Enemy Tests', body: 'A card from the wilderness.', deck: 'trial' },

  { id: 'humble', type: 'crossroads', stage: 'The Turning', title: 'Humble, Then Lifted',
    body: 'A door cracks open. You can grasp it and exalt yourself, or humble yourself under His hand and let Him do the lifting.',
    lens: 'The one who exalts himself is brought low; the one who humbles himself, Yahweh lifts — meekness is the elevator.',
    scripture: { ref: 'James 4:10' },
    choices: [
      { label: 'Grasp it — exalt yourself', body: 'You promote yourself, loudly. What you seize this way never quite settles.', effects: { character: -2, faith: -1, provision: 1 } },
      { label: 'Humble yourself; let Him lift you', body: 'You take the low seat and trust His timing.', lens: 'Humble yourselves under the mighty hand of Yahweh, that He may exalt you in due time — He lifts higher than you could grab.', scripture: { ref: '1 Peter 5:6' }, effects: { character: 3, faith: 2, mind: 1 }, redemption: true },
    ] },

  { id: 'program', type: 'word', stage: 'The Turning', title: 'Program Yourself With His Word', body: 'This is the engine of the whole ascent: you stop letting the world write your mind and you write it with His Word — day and night, until it becomes how you think.', lens: 'Meditate on the Word day and night and your way is made prosperous; be transformed by the renewing of your mind. This is programming yourself with His 4th-dimensional Data.', scripture: { ref: 'Joshua 1:8' }, effects: { word: 3, mind: 2 } },

  { id: 'captive', type: 'crossroads', stage: 'The Turning', title: 'Every Thought Captive',
    body: 'The old thoughts come back — fear, lust, the bitterness that feels like justice. You either let them run the house or take them captive.',
    lens: 'The renewed mind is not passive; it arrests every thought and marches it to obey Christ. A sound mind is a guarded gate.',
    scripture: { ref: '2 Corinthians 10:4-5' },
    choices: [
      { label: 'Let the mind run wild', body: 'You entertain every thought that knocks. The peace leaks out.', effects: { mind: -2, soul: -1 } },
      { label: 'Bring every thought captive to Christ', body: 'You test each thought by the Word and refuse the ones that fail.', lens: 'Casting down imaginations, bringing every thought into captivity to the obedience of Christ — the mind becomes a fortress, not a highway.', effects: { mind: 3, word: 1, character: 1 }, redemption: true },
    ] },

  { id: 'diligent', type: 'word', stage: 'The Rising', title: 'The Diligent Hand', body: 'The character formed in the dark starts to show in the light: you work faithfully, and Yahweh prospers the work of a diligent hand.', lens: 'The one diligent in his work will stand before kings; the LORD was with Joseph, and He made him to prosper — the rising is His doing through your faithfulness.', scripture: { ref: 'Proverbs 22:29' }, effects: { provision: 1, character: 1, witness: 1 } },

  { id: 'joseph', type: 'crossroads', stage: 'The Rising', title: 'Integrity at the Rise',
    body: 'Success brings the test Joseph knew: the secret sin no one would see, the offer to compromise now that you have something to lose. This is where most falls happen.',
    lens: 'The higher the rise, the quieter the temptation. Joseph’s answer guards the whole climb: how can I do this and sin against God?',
    scripture: { ref: 'Genesis 39:9' },
    choices: [
      { label: 'Take the secret sin — no one sees', body: 'You reason it away. It quietly rots the thing you climbed for.', effects: { provision: 2, character: -3, faith: -2 } },
      { label: 'Flee — keep your integrity', body: 'You do what Joseph did: you run rather than fall.', lens: 'How can I do this great wickedness, and sin against God? Integrity kept in secret is the foundation the table stands on.', effects: { character: 3, faith: 2, soul: 1 }, redemption: true },
    ] },

  { id: 'debt', type: 'crossroads', stage: 'The Rising', title: 'The Debt That Wants to Own You',
    body: 'You can borrow to look the part, or store like Joseph in the years of plenty. One rents an image; the other builds a storehouse.',
    lens: 'The borrower is servant to the lender; the wise store up against the lean years. Freedom is built by the disciplined choice, one season at a time.',
    scripture: { ref: 'Proverbs 22:7' },
    choices: [
      { label: 'Borrow to keep up appearances', body: 'You buy the image and rent the peace. The bondage is quiet but real.', effects: { provision: 1, mind: -2, soul: -1 } },
      { label: 'Store wisely — refuse the bondage', body: 'You live below the line and build a storehouse like Joseph before the famine.', lens: 'There is treasure to be desired in the dwelling of the wise; the steward who stores is free to obey when Yahweh calls.', scripture: { ref: 'Proverbs 21:20' }, effects: { provision: 1, character: 1, mind: 1 }, redemption: true },
    ] },

  { id: 'tithe', type: 'crossroads', stage: 'The Prospering', title: 'First-Fruits',
    body: 'The harvest comes in. The first portion asks the oldest question again: do you trust the One who gave it enough to give first?',
    lens: 'The tithe is not Yahweh needing your money; it is you remembering Whose field it was all along.',
    scripture: { ref: 'Malachi 3:8-10' },
    choices: [
      { label: 'Hold it back this year', body: 'Things feel tight. You keep the first-fruits and mean to make it up later.', effects: { provision: 2, faith: -1, soul: -1 } },
      { label: 'Give the first-fruits, off the top', body: 'Before anything else, with a glad heart, you honor Yahweh first.', lens: 'Prove Me now, says Yahweh — give first, and see if He will not open the windows of heaven. He loves a cheerful giver.', scripture: { ref: 'Proverbs 3:9-10' }, effects: { faith: 2, soul: 1, witness: 1 }, redemption: true },
    ] },

  { id: 'soul', type: 'word', stage: 'The Prospering', title: 'Even As Your Soul Prospers', body: 'Now the promise turns: prosperity comes, but it comes on the foundation of a soul that prospered first — like a tree planted by rivers of water, everything it does prospers because the root is right.', lens: 'Beloved, that you may prosper and be in health, even as your soul prospers — the soul first, so the increase rests on solid ground and never owns you.', scripture: { ref: '3 John 1:2' }, effects: { soul: 3, provision: 1, word: 1 } },

  { id: 'trial2', type: 'card', stage: 'The Prospering', title: 'A Card From the Journey', body: 'A card from the wilderness.', deck: 'trial' },

  { id: 'head', type: 'word', stage: 'The Head', title: 'The Head, Not the Tail', body: 'Yahweh lifts you to the top — the head and not the tail, above only. And He reminds you Who gave the power to get wealth, so it never becomes an idol.', lens: 'The LORD makes you the head and not the tail; remember it is He who gives you power to get wealth, to establish His covenant — increase is a trust, not a trophy.', scripture: { ref: 'Deuteronomy 28:13' }, effects: { provision: 2, witness: 1, character: 1 } },

  { id: 'name', type: 'word', stage: 'The Head', title: 'His Name Upon You', body: 'The people who watched you climb see something they cannot explain by talent or luck: the name of Yahweh is on your life.', lens: 'All the peoples of the earth shall see that you are called by the name of the LORD — the testimony preaches before you say a word.', scripture: { ref: 'Deuteronomy 28:10' }, effects: { witness: 2, faith: 1 } },

  { id: 'bless', type: 'crossroads', stage: 'The Table', title: 'The Ones Who Wronged You',
    body: 'The people who put you in the pit now stand before you, and you hold their outcome in your hand. Repay them, or do what Joseph did.',
    lens: 'This is the summit test: the meek do not avenge. What they meant for evil, Yahweh meant for good — and mercy at the top preaches louder than the climb.',
    scripture: { ref: 'Genesis 50:20' },
    choices: [
      { label: 'Repay them — you have the power now', body: 'You settle the score. It is legal, and it costs you the very thing the ascent was for.', effects: { character: -3, faith: -2, witness: -2 } },
      { label: 'Bless them — you meant evil, God meant good', body: 'You forgive and provide for the ones who wronged you. Heaven leans in.', lens: 'You thought evil against me, but God meant it unto good, to save much people alive. The footstool becomes a place of mercy.', effects: { character: 3, witness: 3, soul: 1 }, redemption: true },
    ] },

  { id: 'table', type: 'word', stage: 'The Table', title: 'A Table Before Your Enemies', body: 'And here is the promise Yahweh spoke: a table set for you in the presence of the very ones who wrote you off — and your enemies made a footstool under His hand, not yours.', lens: 'You prepare a table before me in the presence of my enemies; the LORD said, sit at My right hand until I make your enemies your footstool. The vindication is His, and it is complete.', scripture: { ref: 'Psalm 23:5' }, effects: { witness: 2, faith: 1, soul: 1 } },

  { id: 'finish', type: 'finish', stage: 'The Table', title: 'The Meek Inherit', body: 'The ascent closes where Yahweh promised it would: the one the wilderness made meek and sound-minded, whom He raised and whom His Word rebuilt, inherits — and the watching world is inspired, because it was plainly His hand.', lens: 'Blessed are the meek, for they shall inherit the earth. What the wilderness humbled, Yahweh exalted — soul first, then everything.', scripture: { ref: 'Matthew 5:5' } },
];

// ---- the trial deck (temptations, provisions, and tests of the wilderness) ---
// Some cards apply automatically; some present a choice. Every scripture ref is
// verbatim-carried by lib/scripture-kjv.js (guarded by the test).
const TRIAL_DECK = [
  { title: 'The Bitterness Bait', body: 'Someone wrongs you — at the counter, the traffic stop, the boardroom. You can bank the bitterness or hand the wrong to Yahweh.',
    lens: 'Yahweh keeps the accounts the world refuses to. Bitterness is a debt you pay to a creditor who never releases you.',
    scripture: { ref: 'Romans 8:28' },
    choices: [
      { label: 'Bank the bitterness', body: 'You keep the offense on file. It hardens you and helps no one.', effects: { mind: -2, faith: -1 } },
      { label: 'Entrust the wrong to Yahweh', body: 'You refuse to become what hurt you, and hand Him the scale.', lens: 'All things work together for good to those who love Yahweh — the injustice included, when He holds the account.', effects: { faith: 2, mind: 1, character: 1 }, redemption: true },
    ] },
  { title: 'The Fear at Night', body: 'The dread comes when the lights go out — the what-ifs, the old failures, the future you cannot control.',
    lens: 'Fear is a spirit, and Yahweh did not give it. He handed you power, love, and a sound mind instead — you choose which to hold.',
    scripture: { ref: '2 Timothy 1:7' },
    choices: [
      { label: 'Let the fear run the night', body: 'You lie awake rehearsing the worst. It steals the strength you need for the climb.', effects: { mind: -2, soul: -1 } },
      { label: 'Refuse fear; take the sound mind', body: 'You answer the dread with the Word and the peace it carries.', lens: 'Yahweh gave not the spirit of fear, but of power, and of love, and of a sound mind — you were built to stand.', effects: { mind: 2, faith: 1 }, redemption: true },
    ] },
  { title: 'The Generous Hand', body: 'You are still low, and someone lower than you needs what little you have. You can hold it tight or open your hand.',
    lens: 'The Father’s economy runs backward to the world’s: the open hand is the one that stays full.',
    scripture: { ref: 'Luke 6:38' },
    choices: [
      { label: 'Hold it — you barely have enough', body: 'You keep the little back. It stays little.', effects: { provision: 1, soul: -1 } },
      { label: 'Give — even from your lack', body: 'You share out of your own need, the way the widow did.', lens: 'Give, and it shall be given unto you; good measure, pressed down and running over. Yahweh is no man’s debtor.', effects: { soul: 2, witness: 1, faith: 1 }, redemption: true },
    ] },
  { title: 'Manna in the Morning', body: 'Yahweh provides exactly enough for the day — not a storehouse yet, just today’s bread. And it is enough.', lens: 'Daily provision teaches daily dependence; the God who fed you yesterday is not gone this morning.', scripture: { ref: 'Philippians 4:8' }, effects: { soul: 1, word: 1, mind: 1 } },
  { title: 'A Word Fitly Spoken', body: 'An elder, a mother in the faith, a stranger even — says one sentence that re-routes a decade.', lens: 'Yahweh sends His Word through people; the humble enough to receive it are spared years of wandering.', scripture: { ref: 'Psalm 119:105' }, effects: { word: 2, mind: 1 } },
  { title: 'Greater Is He In You', body: 'The opposition looks bigger than you. Then you remember Who lives inside you.', lens: 'The One in you is greater than the one in the world; the math of the wilderness always leaves God out.', scripture: { ref: '1 John 4:4' }, effects: { faith: 2, mind: 1 } },
  { title: 'More Than Conquerors', body: 'You survive a season that should have ended you — not merely intact, but strengthened.', lens: 'Not barely through, but more than conquerors — the trial that aimed to bury you becomes the soil you grow in.', scripture: { ref: 'Romans 8:37' }, effects: { faith: 2, character: 1 } },
  { title: 'The Overcomer’s Seat', body: 'You keep resisting, and a promise settles over you: the one who overcomes is given a seat that cannot be voted away.', lens: 'To the one who overcomes, Yahweh grants to sit with Him — the seat is earned in the wilderness, given at the top.', scripture: { ref: 'Revelation 3:21' }, effects: { faith: 1, witness: 1, character: 1 } },
  { title: 'The Restored Portion', body: 'Like Job, what the enemy took is not the last word; Yahweh turns the captivity and restores — sometimes double.', lens: 'The LORD gave Job twice as much as he had before; restoration is Yahweh’s signature at the end of a faithful trial.', scripture: { ref: 'Job 42:10' }, effects: { provision: 1, soul: 1, witness: 1 } },
  { title: 'Seek First the Kingdom', body: 'A choice between chasing the thing and seeking the King. You put first things first.', lens: 'Seek first the Kingdom of Yahweh and His righteousness, and all these things are added — the order is the whole secret.', scripture: { ref: 'Matthew 6:33' }, effects: { faith: 1, word: 1, soul: 1 } },
];

// ---- the finish (measured by the character formed + the testimony left) ------
const LEGACY_VERSE_BY_KEY = {
  word:      { ref: 'Joshua 1:8' },
  character: { ref: 'Matthew 5:5' },
  faith:     { ref: 'James 4:7' },
  mind:      { ref: '2 Timothy 1:7' },
  soul:      { ref: '3 John 1:2' },
  witness:   { ref: 'Psalm 110:1' },
  provision: { ref: 'Deuteronomy 8:18' },
};

const PASSED_ON_BY_KEY = {
  word:      'The Word written so deep it became the way you think, decide, and rise — His Data, running in you.',
  character: 'A meekness the wilderness taught — the kind of soul Yahweh can trust with a throne.',
  faith:     'A faith that resisted the enemy until he fled, and kept trusting all the way through the dark.',
  mind:      'A sound mind — thoughts kept captive, fear refused, a peace the world could neither give nor take.',
  soul:      'A soul that prospered first, so everything that prospered after it rested on solid ground.',
  witness:   'A testimony the watchers could not explain away — plainly Yahweh raised you, and it inspired them.',
  provision: 'Wealth held with open hands — the power to get it received as a trust for His covenant, never an idol.',
};

// Order categories by score (desc), stable by definition order on ties.
function rankedKeys(def, state) {
  return def.categories
    .map((c) => ({ key: c.key, v: state.scores[c.key] || 0, w: c.weight || 1 }))
    .sort((a, b) => b.v - a.v || (b.w - a.w));
}

export function legacy(def, state) {
  const ranked = rankedKeys(def, state);
  const top = ranked.filter((r) => r.v > 0).slice(0, 3);
  const topKey = top[0]?.key || 'faith';

  // Kingdom-weighted total → an always-hopeful tier (no condemnation tier; the
  // lowest outcome is an open invitation, by design — flagged for SME review).
  let weighted = 0;
  for (const c of def.categories) weighted += (state.scores[c.key] || 0) * (c.weight || 1);

  let tier, headline, verse;
  if (weighted >= 78) {
    tier = 'A Table Before Your Enemies';
    headline = 'You came up out of the wilderness, and Yahweh set a table for you in front of the ones who wrote you off — and made your enemies a footstool. The meek inherited.';
    verse = LEGACY_VERSE_BY_KEY[topKey];
  } else if (weighted >= 48) {
    tier = 'Raised From the Wilderness';
    headline = 'Yahweh lifted you out of the low place. The climb was real; so is the higher ground you now stand on — and the watchers saw Whose hand did it.';
    verse = LEGACY_VERSE_BY_KEY[topKey];
  } else if (weighted >= 24) {
    tier = 'Still Climbing, Kept by Grace';
    headline = 'The mountain is not fully behind you, but grace ran every mile of it — and grace gets the last word.';
    verse = { ref: 'Romans 8:28' };
  } else {
    tier = 'The Road Up Is Still Open';
    headline = 'However this journey went, the wilderness is not the end of your story. Yahweh raises the humble, and the road up is still open — start again.';
    verse = { ref: 'Jeremiah 29:11' };
  }

  // Truth-in-love: an ascent weighted heavily toward provision alone is named,
  // not scolded (3 John 1:2 — the soul was always supposed to prosper first).
  const provisionDominant = topKey === 'provision' && (top[1]?.v || 0) < (top[0]?.v || 0) - 3;

  const passedOn = top.map((r) => PASSED_ON_BY_KEY[r.key]).filter(Boolean);

  return {
    score: weighted,
    tier,
    headline,
    verse,
    topKeys: top.map((r) => r.key),
    passedOn,
    provisionDominant,
    note: provisionDominant
      ? 'You reached the top with much — and Yahweh gives wealth to enjoy. But the promise was that your SOUL would prosper first (3 John 1:2); sought in that order, the increase is a table, not a trap.'
      : null,
  };
}

// ---- the assembled game definition ------------------------------------------
export const THE_WAY_UP = {
  id: 'the-way-up',
  title: 'The Way Up',
  subtitle: 'From the Wilderness to the Table',
  tagline: 'Yahweh raises the meek — from the wilderness to a table set before your enemies.',
  about: 'A journey built on the biblical promotion algorithm: Yahweh lifts the humble out of the wilderness. You start in a low place — the pit, the prison, the field, the ash-heap — and rise the Way He promised: programming yourself with His Word, letting Him develop character and a sound mind, resisting the enemy until he flees, and prospering as your soul prospers first. The finish is not a pile of money; it is the table Yahweh sets before your enemies, and the enemies He makes your footstool.',
  categories: CATEGORIES,
  paths: PATHS,
  trunk: TRUNK,
  decks: { trial: TRIAL_DECK },
  legacy,
};

export default THE_WAY_UP;
