// =============================================================================
// games/generations.js — "Generations: Walking in the Way"
// =============================================================================
// A life-journey board game in the spirit of The Game of Life, told through an
// African American life — its real paths, crossroads, obstacles and triumphs
// (education, family, faith, community, economic empowerment, overcoming
// systemic barriers, building generational wealth) — DIGNIFIED and true, never
// caricature. The differentiator is the LENS: the journey is measured through
// Yahweh's values, not the world's. You do not win by ending with the most
// money; you finish by what you walked in and what you pass on (Matthew 6:33;
// Proverbs 13:22; the faithful-steward welcome of Matthew 25:21).
//
// This module is PURE CONTENT for the generic engine in ./engine.js. Every
// `scripture: { ref }` names a verse that lib/scripture-kjv.js carries verbatim
// (guarded by the test suite) — no verse text is typed here. The `lens` field on
// a space/card/choice is the game's own framing of Yahweh's perspective on that
// moment; it is plainly the game's voice, not quoted Scripture.
//
// DOCTRINE / FRAMING are Darrell + Bishop's to govern (GOVERNANCE-EXECUTION-
// ADVISORY): the redemption ("second chance") mechanic, the grace-forward finish
// (no condemnation tier), and the systemic-barrier spaces are flagged in the PR
// for SME review rather than asserted as settled.
// =============================================================================

// ---- the scoring axes (Yahweh's perspective, not Wealth/Happiness/Knowledge) -
// Weight tilts the legacy toward the Kingdom axes: faith, family/legacy and
// souls weigh most; provision (wealth) weighs least — held rightly, it is a tool
// for the others, never the score itself.
export const CATEGORIES = [
  { key: 'faith',     label: 'Faith',            short: 'Walking in the Way',        weight: 3 },
  { key: 'family',    label: 'Family & Legacy',  short: 'What is built and passed on',weight: 3 },
  { key: 'souls',     label: 'Souls',            short: 'People pointed to the Way',  weight: 3 },
  { key: 'wisdom',    label: 'Wisdom',           short: 'The Word, applied',          weight: 2 },
  { key: 'service',   label: 'Service',          short: 'Stewardship of the gift',    weight: 2 },
  { key: 'peace',     label: 'Peace',            short: 'Shalom — rest in Yahweh',    weight: 2 },
  { key: 'joy',       label: 'Joy',              short: 'Gladness of heart',          weight: 2 },
  { key: 'provision', label: 'Provision',        short: 'Wealth, held rightly',       weight: 1 },
];

// ---- starting paths (the first crossroads: where the journey begins) --------
const PATHS = [
  // ---------------------------------------------------------------------------
  // Darrell's Journey — a TRUE story (added 2026-07-06, at Darrell's direction;
  // facts corrected by Darrell). Public information only, and only enough to prove
  // Yahweh's faithfulness and give Him the glory — a testimony that calls the
  // player to bow to Him now. Confirmed by Darrell: Rock Island projects (Valley
  // Homes) -> Horizon Homes (Davenport) -> Champaign (Rent-A-Center, then Parkland),
  // where he met Bishop Gwin and married his daughter Christina (20 years). His
  // children's names remain his to add. Every scripture ref is verbatim in
  // lib/scripture-kjv.js (DR-0076).
  // ---------------------------------------------------------------------------
  {
    id: 'darrell',
    label: "Darrell's Journey — a true story",
    blurb: "The real road of this platform's founder — told for one reason: to prove Yahweh's faithfulness and give Him the glory. From the Valley Homes projects to a table Yahweh set, and none of it by his own hand. If He did this, He will do it for whoever turns to Him — so bow to Him now, while it is still called today.",
    lens: 'Not by might, nor by power, but by His Spirit, says Yahweh. He raises the lowly and gives the increase; the wise bow to Him now, before the end.',
    scripture: { ref: 'Deuteronomy 8:2' },
    // Opening kept to FOUR spaces so every path shares one board length (the
    // multiplayer board-view invariant, games/match.js). His seven-beat arc is
    // told across four stations; the shared trunk (marriage, children, the
    // Father's business, generational wealth) carries the rest.
    opening: [
      { id: 'dar-valley', type: 'word', stage: 'Young Adult', title: 'Valley Homes & Horizon Homes', body: 'Born in Valley Homes — the Turnkey projects at 25th & 11th in Rock Island — and moved on to Horizon Homes in Davenport when his mother relocated the family. A place the maps skipped, in a region that lost more than half its factory jobs. But the God who sees was already there.', lens: 'Yahweh raises the poor out of the dust and lifts the needy from the ash heap, to seat them with princes — the projects were a starting line, never a sentence. To Him be the glory.', scripture: { ref: 'Deuteronomy 8:2' }, effects: { faith: 1, family: 1 } },
      { id: 'dar-champaign', type: 'word', stage: 'Young Adult', title: 'Champaign — Work, School & a Wife', body: 'He comes to Champaign: general manager at Rent-A-Center, then community college at Parkland. And there Yahweh sets the cornerstone of the whole house — he meets Bishop Gwin, and marries his daughter Christina. Twenty years now.', lens: 'A cord of faith, family and Yahweh is not quickly broken — He arranged this covenant before either of them knew, and set the whole house upon it.', scripture: { ref: 'Deuteronomy 6:4' }, effects: { family: 2, wisdom: 1, joy: 1 } },
      { id: 'dar-build', type: 'word', stage: 'Building Years', title: 'The Builder & the Books', body: 'The slow, disciplined climb of the books — an MBA in IT management, the PMP and ITIL — then PoeTech founded to build sovereign technology that serves families instead of extracting from them, and real estate stewarded. He commits the work to Yahweh before the lights come on.', lens: 'Commit your works to Yahweh and your plans are established; the builder who builds with Him does not labor in vain, and the increase is His.', scripture: { ref: 'Proverbs 16:3' }, effects: { provision: 1, wisdom: 1, faith: 1, service: 1 } },
      { id: 'dar-legacy', type: 'word', stage: 'Establishing', title: 'Before Kings, Pouring Back', body: 'A software project manager at the University of Illinois by day; landlord, founder and builder by calling. The boy from the projects now stands in rooms he was never counted to reach — and he pours it back: raising his children in the Way and running the technology for The Church of the Living God, pastored by Bishop Gwin — his father in love, not merely in law: a true father in the faith, who became family.', lens: 'See a man diligent in his business — he shall stand before kings; a good man leaves an inheritance to his children’s children. None of it by his own hand — to Yahweh be the glory.', scripture: { ref: '2 Timothy 2:2' }, effects: { provision: 1, souls: 1, family: 1, faith: 1 } },
    ],
  },
  {
    id: 'college',
    label: 'The College Road',
    blurb: 'You answer the call to learn — often the first in your line to cross that stage. The road is longer before it pays, but it widens what you can carry.',
    lens: 'Wisdom is the principal thing; Yahweh honors the one who seeks understanding for more than themselves.',
    scripture: { ref: 'Proverbs 4:7' },
    opening: [
      { id: 'col-enroll', type: 'word', stage: 'Young Adult', title: 'Enrollment', body: 'You enroll — maybe at an HBCU your family has prayed over for years. The cost is real; so is the door it opens.', lens: 'A door Yahweh opens, no one shuts. Walk through it as a steward, not an owner.', scripture: { ref: 'Proverbs 16:9' }, effects: { wisdom: 2, faith: 1, provision: -1 } },
      { id: 'col-study', type: 'card', stage: 'Young Adult', title: 'The Long Nights', body: 'Late libraries, work-study shifts, a community that studies together.', deck: 'life' },
      { id: 'col-mentor', type: 'word', stage: 'Young Adult', title: 'A Hand Back', body: 'An upperclassman who looks like you refuses to let you fail, and asks only that you do the same for the next one.', lens: 'The Way is handed down — freely you received, freely give.', scripture: { ref: '2 Timothy 2:2' }, effects: { wisdom: 1, souls: 1, family: 1 } },
      { id: 'col-grad', type: 'word', stage: 'Young Adult', title: 'Crossing the Stage', body: 'You graduate — a stage no one in your line has crossed. The whole section stands up.', lens: 'Yahweh lifts the lowly and seats them with princes; the increase is His.', scripture: { ref: 'Psalm 16:11' }, effects: { wisdom: 2, family: 2, joy: 1 } },
    ],
  },
  {
    id: 'trade',
    label: 'The Trade & Work Road',
    blurb: 'You go to work early — a trade, a craft, a steady hand. You build with what is in your hands and you build it well.',
    lens: 'Whatever your hands find to do, do it as unto Yahweh — the skilled worker stands before kings.',
    scripture: { ref: 'Colossians 3:23' },
    opening: [
      { id: 'trd-appr', type: 'word', stage: 'Young Adult', title: 'The Apprentice', body: 'You learn a trade under someone who has done it for thirty years and is glad to teach.', lens: 'Honest work is honorable before Yahweh; He sees the unseen craftsmanship.', scripture: { ref: 'Colossians 3:23' }, effects: { wisdom: 1, provision: 1, service: 1 } },
      { id: 'trd-craft', type: 'card', stage: 'Young Adult', title: 'Mastering the Craft', body: 'You get faster, surer, sought-after. Your word becomes your bond.', deck: 'life' },
      { id: 'trd-steady', type: 'word', stage: 'Young Adult', title: 'A Diligent Hand', body: 'You show up when others do not. The diligent hand gathers; the steady worker is trusted with more.', lens: 'The one diligent in their work will stand before kings, not obscure men.', scripture: { ref: 'Proverbs 22:29' }, effects: { provision: 2, wisdom: 1 } },
      { id: 'trd-save', type: 'word', stage: 'Young Adult', title: 'First Savings', body: 'You open the first account in your name and refuse to let it own you.', lens: 'Provision is a tool for the Father’s purposes, never the master of the house.', scripture: { ref: 'Proverbs 3:9-10' }, effects: { provision: 2, peace: 1 } },
    ],
  },
  {
    id: 'entrepreneur',
    label: "The Builder's Road",
    blurb: 'You start something of your own — a shop, a service, a small business on a side street that the neighborhood needs. You carry the risk and the reward.',
    lens: 'Commit your works to Yahweh and your plans are established; the builder who builds with Him does not labor in vain.',
    scripture: { ref: 'Proverbs 16:3' },
    opening: [
      { id: 'ent-start', type: 'word', stage: 'Young Adult', title: 'The First Door', body: 'You open a small business with more faith than capital. The lights come on.', lens: 'Commit it to Yahweh before the grand opening; He establishes the work of faithful hands.', scripture: { ref: 'Proverbs 16:3' }, effects: { provision: 1, faith: 1, service: 1 } },
      { id: 'ent-risk', type: 'card', stage: 'Young Adult', title: 'The Lean Months', body: 'Some weeks the register is thin. You learn what you are made of.', deck: 'life' },
      { id: 'ent-roots', type: 'word', stage: 'Young Adult', title: 'Customers Become Neighbors', body: 'You hire from your block and your customers become a community.', lens: 'The Father’s economy lifts the whole street, not one house alone — we all win, and we create.', scripture: { ref: 'Proverbs 11:30' }, effects: { service: 2, souls: 1, family: 1 } },
      { id: 'ent-reinvest', type: 'word', stage: 'Young Adult', title: 'Reinvest', body: 'Instead of cashing out, you pour it back in — and pay it forward.', lens: 'Generational wealth begins when one steward refuses to consume the whole harvest.', scripture: { ref: 'Proverbs 3:9-10' }, effects: { provision: 2, family: 1 } },
    ],
  },
  {
    id: 'ministry',
    label: "The Servant's Road",
    blurb: 'You answer a call to serve — at the church, in the community, among the young. The pay is modest; the harvest is people.',
    lens: 'Whoever would be great among you must be servant of all; the Son of Man came not to be served, but to serve.',
    scripture: { ref: 'Mark 10:43-45' },
    opening: [
      { id: 'min-call', type: 'word', stage: 'Young Adult', title: 'The Call', body: 'You sense a call you cannot shake, and you answer it.', lens: 'Yahweh equips the ones He calls; the servant’s road is never walked alone.', scripture: { ref: 'Mark 10:43-45' }, effects: { faith: 2, service: 1 } },
      { id: 'min-serve', type: 'card', stage: 'Young Adult', title: 'In the Trenches', body: 'Hospital visits, food pantries, funerals, weddings — the whole of life passes through your hands.', deck: 'life' },
      { id: 'min-disciple', type: 'word', stage: 'Young Adult', title: 'Discipling the Young', body: 'You pour into young people the church had almost given up on.', lens: 'The one who wins souls is wise; this is the Father’s business.', scripture: { ref: 'Proverbs 11:30' }, effects: { souls: 2, faith: 1 } },
      { id: 'min-bivoc', type: 'word', stage: 'Young Adult', title: 'Bivocational', body: 'You work a second job so the ministry never charges the ones who need it most.', lens: 'Freely you received; freely give — Yahweh is no man’s debtor.', scripture: { ref: '1 Peter 4:10' }, effects: { service: 2, provision: -1, faith: 1 } },
    ],
  },
];

// ---- the shared trunk (the common life journey, all paths converge here) -----
const TRUNK = [
  { id: 'foundation', type: 'word', stage: 'Building Years', title: 'The Foundation', body: 'Whatever road you took, one decision sets the rest: what comes first.', lens: 'Seek first the Kingdom of Yahweh and His righteousness, and all these things are added to you.', scripture: { ref: 'Matthew 6:33' }, effects: { faith: 2, peace: 1 } },

  { id: 'marriage', type: 'word', stage: 'Building Years', title: 'A Covenant', body: 'You join your life to another in covenant, not just contract.', lens: 'A cord of faith, family and Yahweh is not quickly broken.', scripture: { ref: 'Deuteronomy 6:4' }, effects: { family: 2, joy: 1 } },

  { id: 'promotion', type: 'crossroads', stage: 'Building Years', title: 'The Promotion Passed Over',
    body: 'You earned it. Someone less qualified is handed it instead, and you both know why. The room watches how you carry it.',
    lens: 'Yahweh sees what the boardroom does not. Vengeance is His; your integrity is your own to keep.',
    scripture: { ref: 'Romans 8:28' },
    choices: [
      { label: 'Repay the slight in kind', body: 'You play the same game back. It costs you something you cannot name.', effects: { provision: 1, peace: -2, faith: -1 } },
      { label: 'Entrust it to Yahweh and keep your integrity', body: 'You do your work with excellence and refuse bitterness.', lens: 'All things work together for good to those who love Him — the unjust season included.', effects: { peace: 2, faith: 2, wisdom: 1 }, redemption: true },
      { label: 'Organize for fairness — lawfully, in love', body: 'You build a path so the next person is not passed over either.', lens: 'Blessed are those who hunger for righteousness; justice and mercy can share one table.', scripture: { ref: 'Matthew 5:10-12' }, effects: { service: 2, souls: 1, wisdom: 1 } },
    ] },

  { id: 'life1', type: 'card', stage: 'Building Years', title: 'Life Happens', body: 'A card from the life of the community.', deck: 'life' },

  { id: 'firsthome', type: 'crossroads', stage: 'Building Years', title: 'The First Home',
    body: 'You can buy a house. You can buy it to flip and leave, or buy it to root and build — in a neighborhood you believe in.',
    lens: 'A home is not an idol and not just an asset; it is a place to raise a generation in the Way.',
    scripture: { ref: 'Genesis 28:22' },
    choices: [
      { label: 'Buy to flip and move on', body: 'The numbers are good. The roots are shallow.', effects: { provision: 2 } },
      { label: 'Buy to root and build', body: 'You stay, you invest, you become a neighbor people count on.', lens: 'Yahweh sets the lonely in families and makes the dweller a blessing to the street.', effects: { provision: 1, family: 2, service: 1, souls: 1 }, redemption: false },
    ] },

  { id: 'fathersbusiness', type: 'invest', stage: 'Establishing', title: "The Father's Business",
    body: 'You have margin now — time, money, influence. You can pour some into Kingdom work that pays no dividend you can deposit.',
    lens: '"Wist ye not that I must be about my Father’s business?" The truest investment buys back time, people and eternity.',
    scripture: { ref: 'Luke 2:49' },
    choices: [
      { label: 'Keep building your own house', body: 'You consolidate. It is not wrong; it is just not yet Kingdom.', effects: { provision: 2 } },
      { label: "Invest in the Father's business", body: 'You fund the ministry, the after-school program, the widow down the street.', lens: 'Lay up treasure where neither rust nor robber reaches; Yahweh is no one’s debtor.', effects: { provision: -1, souls: 2, service: 2, faith: 1 }, redemption: true },
    ] },

  { id: 'tithe', type: 'crossroads', stage: 'Establishing', title: 'First-Fruits',
    body: 'The harvest came in. The first portion is a question every season asks again: do you trust the One who gave it?',
    lens: 'The tithe is not Yahweh needing your money; it is you remembering Who owns the field.',
    scripture: { ref: 'Malachi 3:8-10' },
    choices: [
      { label: 'Hold it back this year', body: 'Things are tight. You keep the first-fruits and mean to make it up later.', effects: { provision: 2, faith: -1, peace: -1 } },
      { label: 'Give the first-fruits', body: 'Off the top, before anything else, with a glad heart.', lens: 'Prove Me now, says Yahweh — give first, and watch the windows of heaven. He loves a cheerful giver.', scripture: { ref: '2 Corinthians 9:7' }, effects: { provision: -1, faith: 2, service: 1, peace: 1 }, redemption: true },
    ] },

  { id: 'life2', type: 'card', stage: 'Establishing', title: 'Life Happens', body: 'A card from the life of the community.', deck: 'life' },

  { id: 'children', type: 'word', stage: 'Establishing', title: 'The Next Generation', body: 'Children — yours, or ones you take in — look to you to show them the Way, not just tell it.', lens: 'Teach them diligently, sitting, walking, lying down, rising up; a faith caught is a faith kept.', scripture: { ref: 'Deuteronomy 6:4' }, effects: { family: 2, souls: 1, faith: 1 } },

  { id: 'hardseason', type: 'obstacle', stage: 'Mid-Life', title: 'A Hard Season',
    body: 'Layoffs, a diagnosis, a barrier you did not build but have to climb anyway. The weight is real and the night is long.',
    lens: 'The sufferings of this present time are not worthy to be compared with the glory ahead. He is nearest in the dark.',
    scripture: { ref: 'Romans 8:18' },
    choices: [
      { label: 'Carry it alone in silence', body: 'You hide it and harden. The load does not get lighter.', effects: { peace: -2, joy: -1 } },
      { label: 'Count it joy and endure with hope', body: 'You let the trial do its patient work in you.', lens: 'Count it all joy — the testing of your faith works endurance; endurance, a finished soul.', scripture: { ref: 'James 1:2-3' }, effects: { faith: 2, peace: 1, wisdom: 1 }, redemption: true },
      { label: 'Lean on the church family', body: 'You let the body of believers carry what you cannot.', lens: 'Bear one another’s burdens; this is how the family of Yahweh was designed to hold.', effects: { family: 1, peace: 2, souls: 1 } },
    ] },

  { id: 'counsel', type: 'word', stage: 'Mid-Life', title: 'Wisdom in Counsel', body: 'Your name carries weight now; the young come to you for direction.', lens: 'Many plans are in a man’s heart, but the counsel of Yahweh stands — point them there.', scripture: { ref: 'Proverbs 19:21' }, effects: { wisdom: 2, peace: 1, souls: 1 } },

  { id: 'life3', type: 'card', stage: 'Mid-Life', title: 'Life Happens', body: 'A card from the life of the community.', deck: 'life' },

  { id: 'mentor', type: 'invest', stage: 'Mid-Life', title: 'Mentoring & Community',
    body: 'There is a young person one decision away from a different life. You have the time if you choose to spend it.',
    lens: 'He who wins souls is wise; the harvest is people, and the laborers are few.',
    scripture: { ref: 'Proverbs 11:30' },
    choices: [
      { label: 'Stay focused on your own', body: 'You have done your part already. The door stays closed.', effects: { provision: 1 } },
      { label: 'Pour into the next one', body: 'You mentor, you show up, you start the program no one else would.', lens: 'A poured-out life is never empty; Yahweh refills the steward who gives himself away.', scripture: { ref: '2 Timothy 2:2' }, effects: { souls: 2, service: 2, family: 1 }, redemption: true },
    ] },

  { id: 'return', type: 'crossroads', stage: 'Mid-Life', title: 'The Crossroads of Return',
    body: 'Somewhere along the way you drifted — a habit, a hardness, a slow turning-away you told yourself was nothing. Here is the place you can turn back.',
    lens: '"As I live, says Yahweh, I have no pleasure in the death of the wicked, but that he turn and live." The road home is always open. This is grace.',
    scripture: { ref: 'Ezekiel 33:11' },
    choices: [
      { label: 'Keep drifting; it is easier', body: 'You tell yourself there is time. The distance grows.', effects: { faith: -2, peace: -1 } },
      { label: 'Turn back to the Way', body: 'You repent, you return, you are received before you finish the sentence.', lens: 'Yahweh is longsuffering, not willing that any should perish — He runs to meet the one who turns home.', scripture: { ref: '2 Peter 3:9' }, effects: { faith: 3, peace: 2, joy: 1, souls: 1 }, redemption: true },
    ] },

  { id: 'generational', type: 'word', stage: 'Elder', title: 'Generational Wealth', body: 'You build something meant to outlast you — not to be consumed, but inherited.', lens: 'A good man leaves an inheritance to his children’s children; honor Yahweh with the first of it and the rest is sanctified.', scripture: { ref: 'Proverbs 3:9-10' }, effects: { provision: 2, family: 2 } },

  { id: 'peace', type: 'word', stage: 'Elder', title: 'A Settled Peace', body: 'The striving quiets. You have learned where peace actually comes from.', lens: 'Yahweh keeps in perfect peace the mind stayed on Him — a peace the world cannot give and cannot take.', scripture: { ref: 'Isaiah 26:3' }, effects: { peace: 2, faith: 1, joy: 1 } },

  { id: 'elder', type: 'word', stage: 'Elder', title: 'Elder & Honored', body: 'Gray hair is a crown now; the family gathers around your table for the blessing.', lens: 'From everlasting to everlasting, Yahweh is God; the elder who walked with Him becomes a wellspring for many.', scripture: { ref: 'Psalm 90:2' }, effects: { family: 2, wisdom: 1, joy: 1 } },

  { id: 'life4', type: 'card', stage: 'Elder', title: 'Life Happens', body: 'A card from the life of the community.', deck: 'life' },

  { id: 'finishing', type: 'word', stage: 'Legacy', title: 'Finishing Faithful', body: 'The race nears its end. Only one question waits at the line: were you faithful?', lens: 'He who is faithful in little is faithful in much — Yahweh measures the steward, not the size of the estate.', scripture: { ref: 'Luke 16:10' }, effects: { faith: 2, service: 1 } },

  { id: 'legacy', type: 'finish', stage: 'Legacy', title: 'Legacy', body: 'The journey closes. What you walked in, and what you hand on, is now plain to see.', lens: 'The welcome of the faithful steward awaits (Matthew 25:21) — measured not by what was kept, but by what was poured out and passed on.', scripture: { ref: '1 Corinthians 4:2' } },
];

// ---- the life deck (authentic, dignified African American life events) -------
// Some cards apply automatically; some present a choice. Scripture is attached
// only where lib/scripture-kjv.js verifiably carries the verse.
const LIFE_DECK = [
  { title: 'Sunday at the Table', body: 'Three generations around one table; a grandmother’s prayer over the food goes long, and no one minds.', lens: 'Yahweh sets the lonely in families; the table is where the Way is handed down.', scripture: { ref: 'Psalm 16:11' }, effects: { family: 2, faith: 1, joy: 1 } },
  { title: 'The Church Family Rallies', body: 'A hard week, and the congregation simply shows up — food, money, presence, no questions.', lens: 'This is the body of Yahweh doing what it was built to do: bear one another up.', effects: { peace: 2, family: 1, faith: 1 } },
  { title: 'Homecoming', body: 'You go back — to the block, the campus, the home church — and the welcome nearly knocks you over.', lens: 'Joy is not denial; it is remembering Whose hand carried you this far.', scripture: { ref: 'Nehemiah 8:10' }, effects: { joy: 2, family: 1 } },
  { title: 'A Word From a Mentor', body: 'An elder says one sentence that re-routes a decade.', lens: 'Yahweh sends wisdom through people; the humble enough to receive it are spared years.', scripture: { ref: 'Proverbs 19:21' }, effects: { wisdom: 2, faith: 1 } },
  { title: 'First-Generation Graduate', body: 'You cross a stage no one in your line crossed. The whole section is on its feet.', lens: 'What looked impossible to men was always possible with Yahweh.', effects: { wisdom: 2, family: 2, joy: 1 } },
  { title: 'The Co-op', body: 'Neighbors pool what little each has and build together what none could alone.', lens: 'The Father’s economy multiplies the shared loaf; we all win, and we create.', effects: { service: 2, provision: 1, souls: 1 } },
  { title: 'Plant Where There Was None', body: 'You turn a vacant lot into a garden, and the whole block starts to breathe again.', lens: 'Yahweh makes the desert bloom through ordinary, faithful hands.', effects: { service: 1, joy: 1, provision: 1, family: 1 } },
  { title: 'Lead the Youth Ministry', body: 'You take on the young people the world had already written off.', lens: 'The harvest is people; the one who labors for souls labors for what lasts forever.', scripture: { ref: '2 Timothy 2:2' }, effects: { souls: 2, service: 1, faith: 1 } },
  // --- choice cards ---
  { title: 'Unequal Treatment', body: 'You are treated as less than you are — at the counter, the traffic stop, the interview. How you carry it shapes you.',
    lens: 'Yahweh keeps the accounts the world refuses to. Your dignity is His gift; no one can vote it away.',
    scripture: { ref: 'Romans 12:1' },
    choices: [
      { label: 'Let it harden you', body: 'You bank the bitterness. It costs more than it pays.', effects: { provision: 1, peace: -2, faith: -1 } },
      { label: 'Keep your integrity; entrust the wrong to Yahweh', body: 'You answer evil without becoming it.', lens: 'Be not overcome of evil, but overcome evil with good — present your body a living sacrifice.', effects: { faith: 2, peace: 2, wisdom: 1 }, redemption: true },
      { label: 'Stand for justice — lawfully, in love', body: 'You make a way so the next person meets less of it.', lens: 'Blessed are those who hunger and thirst for righteousness, for they shall be filled.', scripture: { ref: 'Matthew 5:10-12' }, effects: { service: 2, souls: 1, wisdom: 1 } },
    ] },
  { title: 'Caring for an Aging Parent', body: 'The ones who raised you need raising now. The honor is heavy.',
    lens: 'Honor is not convenient; Yahweh ties long life to the children who carry their parents well.',
    scripture: { ref: 'Mark 10:43-45' },
    choices: [
      { label: 'Carry it yourself, with grace', body: 'You become servant in your own home, and it sanctifies you.', effects: { family: 2, service: 2, peace: 1 } },
      { label: 'Share the load with the church family', body: 'You let the body help carry what is too much for one.', effects: { family: 1, service: 1, souls: 1, peace: 1 } },
    ] },
  { title: 'A Debt That Wants to Own You', body: 'Credit is easy; the bondage is quiet. There is a way out and a way deeper in.',
    lens: 'The borrower is servant to the lender; Yahweh’s wisdom sets the captive free, one disciplined choice at a time.',
    scripture: { ref: 'Proverbs 19:21' },
    choices: [
      { label: 'Borrow more to keep up appearances', body: 'You buy the image and rent the peace.', effects: { provision: 1, peace: -2, wisdom: -1 } },
      { label: 'Discipline and counsel — break free', body: 'You face the numbers, get help, and walk out of the trap.', lens: 'Yahweh gives wisdom to the one who asks; freedom is a kind of worship.', effects: { wisdom: 2, peace: 1, provision: 1 }, redemption: true },
    ] },
  { title: 'The Prodigal’s Return', body: 'Someone you love comes home worn and ashamed. You see them while they are still a long way off.',
    lens: 'This is the Father’s own heart: He runs to the one who turns home and throws a feast — Yahweh seeks the lost.',
    scripture: { ref: 'Luke 19:10' },
    choices: [
      { label: 'Make them earn their way back', body: 'You keep the distance a while. It helps no one.', effects: { family: -1, peace: -1 } },
      { label: 'Run to meet them; welcome them home', body: 'You forgive before they finish, and a soul comes back to life.', lens: 'There is joy in heaven over one who turns home; love covers a multitude.', scripture: { ref: '2 Peter 3:9' }, effects: { family: 2, souls: 2, joy: 1, faith: 1 }, redemption: true },
    ] },
];

// ---- the legacy reducer (the finish: faithfulness + what is passed on) -------
// Maps a top scoring axis to a verified legacy verse and a passed-on sentence.
const LEGACY_VERSE_BY_KEY = {
  faith:     { ref: 'Proverbs 3:5-6' },
  family:    { ref: 'Deuteronomy 6:4' },
  souls:     { ref: 'Proverbs 11:30' },
  wisdom:    { ref: 'Proverbs 4:7' },
  service:   { ref: 'Mark 10:43-45' },
  peace:     { ref: 'Isaiah 26:3' },
  joy:       { ref: 'Nehemiah 8:10' },
  provision: { ref: 'Proverbs 3:9-10' },
};

const PASSED_ON_BY_KEY = {
  faith:     'A living faith your children saw walked out, not just talked about.',
  family:    'A family rooted, named and blessed — a covenant that outlives you.',
  souls:     'People who found the Way because you pointed to it, and will point others.',
  wisdom:    'Wisdom poured into the young, so they skip the ditches you climbed out of.',
  service:   'A community lifted — gifts spent on others, the Father’s business done.',
  peace:     'A settled peace your household learned to live inside of.',
  joy:       'A gladness that taught a hard world how to laugh at the days to come.',
  provision: 'An inheritance stewarded for your children’s children, held with open hands.',
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
  if (weighted >= 60) {
    tier = 'A Faithful Legacy';
    headline = 'You finished faithful — and the welcome of the faithful steward awaits (Matthew 25:21).';
    verse = LEGACY_VERSE_BY_KEY[topKey];
  } else if (weighted >= 38) {
    tier = 'A Life Well-Walked';
    headline = 'You walked the Way with a whole heart, and it shows in what you leave behind.';
    verse = LEGACY_VERSE_BY_KEY[topKey];
  } else if (weighted >= 18) {
    tier = 'A Journey of Grace';
    headline = 'The road had hard miles, but grace ran the length of it — and grace gets the last word.';
    verse = { ref: 'Romans 8:28' };
  } else {
    tier = 'Grace for the Road Ahead';
    headline = 'However the journey went, the road home is still open — Yahweh has no pleasure in any being lost, only in the turning back.';
    verse = { ref: 'Jeremiah 29:11' };
  }

  // Gentle truth-in-love: a life weighted heavily toward provision alone is
  // named, not scolded (Matthew 6:33) — wealth is good, but it was never the
  // score.
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
      ? 'You ended with much — and Yahweh gives wealth to enjoy. Seek first the Kingdom, and these things are added; sought first, they cannot satisfy.'
      : null,
  };
}

// ---- the assembled game definition ------------------------------------------
export const GENERATIONS = {
  id: 'generations',
  title: 'Generations',
  subtitle: 'Walking in the Way',
  tagline: 'An African American life journey, measured by Yahweh.',
  about: 'A life-journey game in the spirit of The Game of Life — the real paths, crossroads and triumphs of African American life, scored not by Wealth, Happiness and Knowledge but by Faith, Family, Souls and the things that last. Crossroads are second chances; the finish is your legacy.',
  categories: CATEGORIES,
  paths: PATHS,
  trunk: TRUNK,
  decks: { life: LIFE_DECK },
  legacy,
};

export default GENERATIONS;

// Return a Generations definition variant that also carries a `study` deck — the
// belief-vs-action cards an "Eternal Algorithms" study produces (see
// lib/eternal-algorithms-studies.js studyToGameCards). Pure: the base GENERATIONS
// is untouched; the engine treats a deck as just a keyed card array, so injected
// study cards draw and score exactly like life cards. This is the seam that lets
// a study's self-examination continue in a full Generations Game Night. An empty
// or missing card list returns the base def unchanged.
export function withStudyDeck(def, studyCards) {
  const base = def || GENERATIONS;
  if (!Array.isArray(studyCards) || studyCards.length === 0) return base;
  return { ...base, decks: { ...base.decks, study: studyCards } };
}
