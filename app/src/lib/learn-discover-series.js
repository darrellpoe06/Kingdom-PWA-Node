// =============================================================================
// learn-discover-series — five Featured Series, each a reading order over real lessons
// =============================================================================
// Darrell 2026-11-26 named five series: Overcoming Anxiety, Building a Stronger
// Marriage, Biblical Money Management, Identity & Purpose, Walking in God's Plan.
// None is a course. Each is a CURATED, ORDERED list of lessons that already exist,
// chosen by reading them and arranged to move from recognising the need to acting
// on it. A series only points: no lesson, title, course or department changes,
// and a lesson may belong to a series and to its own course at once.
//
// STATUS: PROPOSED, awaiting Darrell's approval of each list
// (docs/design/learn-discover/SERIES-PROPOSAL.md). learn-discover.test.js fails
// if any id stops resolving to a mounted lesson.
// =============================================================================
export const SERIES_STATUS = 'proposed';

export const SERIES = Object.freeze([
  { id: 'anxiety', title: 'Overcoming Anxiety', blurb: 'From a worn-out body to a steady mind: what the Word says about worry, fear and peace.',
    lessons: [
      'll2-the-energy-you-were-given',
      'll5-take-no-thought-for-tomorrow',
      'mit12-predictive-brain-body-budget',
      'll13-a-sound-mind',
      'll22-goshen-and-the-watch',
      'mit4-the-renewed-mind',
      'll50-the-mind-of-christ-thinking-yahwehs-thoughts-proven-in-works',
      'ea-gh-higher-priority',
      'll7-let-peace-be-the-umpire',
      'll282-the-greater-work',
      'll102-bold-as-a-lion-boldness-from-righteousness-not-bravado-no-fear',
      'll336-the-lie-the-fear-and-the-last-adam',
    ] },
  { id: 'marriage', title: 'Building a Stronger Marriage', blurb: 'Covenant, love and the daily work of a husband and a wife.',
    lessons: [
      'll230-competence-before-submission-the-study-skills-and-doing-skills-of-a-wife-and-a-husband-with-the-word-answering-first',
      'll114-what-makes-having-you-better-covenant-not-contract-and-the-value-a-paycheck-cannot-cover',
      'll122-does-she-feel-like-your-favorite-person-preferring-one-another-and-the-first-works',
      'll121-know-your-own-post-her-provision-her-guard-and-the-beam-in-the-pointing-eye',
      'll115-meek-and-quiet-strength-the-ornament-of-great-price-and-why-jael-is-not-the-blueprint',
      'll231-does-yahweh-rank-a-wife-over-a-woman-covenant-the-proverbs-31-woman-and-the-order-with-the-word-answering-first',
      'll123-would-you-sign-that-contract-the-answer-the-qualification-and-the-manner-that-forfeited-it',
      'll167-be-a-g-about-it-execute-the-fourteen-love-verbs-high-or-low-because-it-is-not-about-how-you-feel',
      'll157-what-is-love-in-depth-and-in-range-action-based-word-first',
      'll151-the-tongue-death-and-life-in-a-little-member-and-the-knowledge-that-governs-it',
      'll16-rule-your-spirit-repair-the-bond',
    ] },
  { id: 'money', title: 'Biblical Money Management', blurb: 'Own, work, save, borrow wisely, give and leave a legacy, the way the Word teaches.',
    lessons: [
      'econ2-ownership-vs-consumption',
      'econ8-test-build-multiply',
      'bank5-saving-that-is-not-hoarding',
      'inv1-what-investing-actually-is',
      'fin5-what-hast-thou-in-the-house',
      'fin6-usury-and-who-your-brother-is',
      'bank2-the-one-rule-and-its-limit',
      'll322-why-should-he-take-away-thy-bed',
      'll143-yahwehs-will-be-done-on-earth-the-guaranteed-outcome-the-release-and-the-system-we-can-build',
      'll225-spiritual-knowledge-is-the-most-important-factor-the-highest-quality-of-life-in-every-season-with-money-or-without-it',
      'inv8-enough',
      'legacy4-forced-production',
      'll69-faithful-over-a-few-things-stewardship-and-increase',
    ] },
  { id: 'identity', title: 'Identity & Purpose', blurb: 'Who Yahweh made you to be, and the work He gave you to do.',
    lessons: [
      'ea-gh-thief-targets-identity',
      'ea-gh-made-in-his-image',
      'll226-the-mind-of-christ-is-our-identity-sound-minds-the-whole-armour-and-the-kingdom-ways-every-nation-is-going-into',
      'ea-gh-known-before-formed',
      'll324-filled-to-devise-cunning-works',
      'pm3-the-skill-is-given-and-named',
      'll208-the-gift-does-not-expire-the-skill-is-yahwehs-the-paper-is-a-witness',
      'll49-mastery-without-manipulation-lifes-task-envy-sober-mind',
      'll156-teach-yourself-anything-qualitative-and-quantitative-analysis-loving-yahweh-while-you-do-it',
      'ea-gh-babel-make-us-a-name',
    ] },
  { id: 'plan', title: "Walking in God's Plan", blurb: 'Waiting, timing and trust: when the plan is bigger than your season.',
    lessons: [
      'mit1-the-design-in-time',
      'mit2-the-young-he-called',
      'll248-his-ways-are-higher-so-he-gives-the-bread',
      'll255-all-things-work-together-the-integrated-system-and-which-way-it-runs',
      'ea-gh-all-things-work-together',
      'll26-how-the-king-knows-his-kings',
      'ea-gh-appointment-kept',
      'll180-he-giveth-thee-power-to-get-wealth',
      'll240-he-said-it-and-did-not-do-it-the-offer-moses-refused-the-breach-he-stood-in-and-the-nation-made-of-the-children-they-gave-up-on',
      'll301-old-men-dream-young-men-see',
      'll332-give-me-this-mountain',
    ] },
]);
