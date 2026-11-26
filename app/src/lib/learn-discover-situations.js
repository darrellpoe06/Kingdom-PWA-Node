// =============================================================================
// learn-discover-situations — the Life Situations Guide
// =============================================================================
// A person facing a real problem types it as they live it ("my kids won't listen", "I lost my job"), not in the
// words of a course. This file is the bridge, written by hand and read lesson by lesson (2026-11-26): for each
// situation, the phrasings people use and the lessons of the curriculum that truly speak to it, strongest first.
//
// HOW IT GROWS (to 100-150 situations, with no recurring cost). Add one entry to SITUATIONS: an `id`, a plain
// `title`, a few `say` phrasings, the real lesson ids in order, and (honestly) a `flag`:
//     ''      the curriculum speaks to this well
//     'thin'  a few lessons speak to it; there is no course on it. The page says so.
//     'gap'   no lesson speaks to it yet. The page says so, and the entry is the list of lessons still to write.
// learn-discover.test.js fails if an id is unknown, repeated, or a phrasing is empty, and docs/design/learn-discover/
// LIFE-SITUATIONS.md is regenerated from this file so the list can be read on a phone.
// Plain data. No model, no service, no per-question cost. It never edits a lesson; it only points at lessons.
// =============================================================================
export const SITUATIONS = [
  {
    id: 'anxious',
    group: 'Mind & heart',
    title: 'Feeling anxious or worried',
    say: ['anxious', 'anxiety', 'worry', 'worried', 'worrying', 'constant worry', 'nervous', 'panic'],
    lessons: [
      'mit12-predictive-brain-body-budget', // Tired, Anxious, or Just Unfed? What Elijah's Angel Teaches About Your
      'll5-take-no-thought-for-tomorrow', // Is Worry Keeping Your Body on High Alert for Dangers That Never Come?
      'll7-let-peace-be-the-umpire', // Can Your Peace Make the Call? Learning to Feel What Supports You and W
      'll2-the-energy-you-were-given', // Is Your Stress Quietly Draining Your Energy Tank? What Scripture and M
      'mit18-think-about-your-thinking', // Who Is Driving Your Mind? Noticing a Thought Before It Runs Your Day,
    ],
  },
  {
    id: 'overwhelmed',
    group: 'Mind & heart',
    title: 'Overwhelmed, stressed or burned out',
    say: ['overwhelmed', 'stressed', 'stress', 'burnout', 'burned out', 'exhausted', 'pressure', 'too much pressure'],
    lessons: [
      'll2-the-energy-you-were-given', // Is Your Stress Quietly Draining Your Energy Tank? What Scripture and M
      'll7-let-peace-be-the-umpire', // Can Your Peace Make the Call? Learning to Feel What Supports You and W
      'll5-take-no-thought-for-tomorrow', // Is Worry Keeping Your Body on High Alert for Dangers That Never Come?
      'll53-the-emotional-cycles-of-brain-and-body-stewarding-feeling-by-the-renewed-mind', // Tired, Hungry, Hurting: Why Your Feelings Ride Your Body's Clock, and
      'mit12-predictive-brain-body-budget', // Tired, Anxious, or Just Unfed? What Elijah's Angel Teaches About Your
    ],
  },
  {
    id: 'sleep',
    group: 'Mind & heart',
    title: "Can't sleep",
    say: ['sleep', 'insomnia', 'sleepless', "can't sleep", 'cannot sleep'],
    flag: 'thin',
    note: 'The curriculum touches rest and sleep inside its lessons on stress and the body, but has no lesson written only about sleeplessness.',
    lessons: [
      'hl-w3-sleep-memory', // Why Does a Good Night's Sleep Make Your Study Stick? What Psalm 127:2
      'mit12-predictive-brain-body-budget', // Tired, Anxious, or Just Unfed? What Elijah's Angel Teaches About Your
      'll2-the-energy-you-were-given', // Is Your Stress Quietly Draining Your Energy Tank? What Scripture and M
    ],
  },
  {
    id: 'fear-future',
    group: 'Mind & heart',
    title: 'Afraid of the future',
    say: ['afraid', 'scared', 'fear', 'afraid of the future'],
    flag: 'thin',
    note: 'Three lessons speak to fear of what is ahead; none is a full study of it.',
    lessons: [
      'ea-gh-first-and-last', // Your Worst Yesterday and Scariest Tomorrow: Is Either One Outside Yahw
      'll5-take-no-thought-for-tomorrow', // Is Worry Keeping Your Body on High Alert for Dangers That Never Come?
      'll102-bold-as-a-lion-boldness-from-righteousness-not-bravado-no-fear', // Why Do the Wicked Run From Shadows? Standing Lion-Bold Because Yahweh
    ],
  },
  {
    id: 'hopeless',
    group: 'Mind & heart',
    title: 'Hopeless, discouraged or depressed',
    say: ['hopeless', 'depressed', 'depression', 'discouraged', 'sad', 'despair', 'no hope'],
    note: 'These speak to a heavy heart from Scripture. They are teaching, not counseling: please also talk with a pastor or a trusted friend.',
    lessons: [
      'll330-he-healeth-the-broken-in-heart', // Can a Broken Heart Be Made Whole? What Yahweh's Word Says About the Wo
      'll152-crying-because-of-all-the-dying-slow-and-vicious-but-yahweh', // Why Does Grief Over Slow Loss Feel Like Failure? What Scripture Says A
      'll27-the-god-who-documents-his-grief', // Does Yahweh Grieve? What His Tears Teach You About Your Own Story
      'll162-do-not-take-a-death-so-personal-that-you-undermine-your-way-home-let-him-be-him', // Your Grief Is Real, but Is Your Anger Steering You Off the Road Home?
      'll176-faith-is-the-substance-and-the-evidence-and-he-made-me-then-died-for-me', // Faith Isn't a Feeling? What Hebrews 11 Says Faith Is Made Of, and Why
    ],
  },
  {
    id: 'lonely',
    group: 'Mind & heart',
    title: 'Lonely or alone',
    say: ['lonely', 'loneliness', 'alone', 'no friends', 'isolated'],
    flag: 'thin',
    note: 'Four lessons speak to belonging and being alone; the curriculum has no course on loneliness itself.',
    lessons: [
      'ea-gh-father-fatherless', // Who Fills the Empty Seat at the Table? Psalm 68:5-6 and the Family Yah
      'll21-hidden-vs-known', // Why Does Every Heart Hide the Same Thing? What Yahweh Says About Belon
      'ea-gh-assembling', // Does Your Absence Make a Difference? How Hebrews 10:24-25 Shows Why th
      'll136-touched-with-the-feeling-the-high-priest-who-felt-the-whole-weight-and-why-his-judgment-never-needed-your-experience-to-be-true', // Does Our High Priest Need to Sin to Understand Us? The Weight He Carri
    ],
  },
  {
    id: 'grief',
    group: 'Mind & heart',
    title: 'Grieving a loss',
    say: ['grief', 'grieving', 'grieve', 'loss', 'lost someone', 'mourning', 'death', 'died'],
    lessons: [
      'll162-do-not-take-a-death-so-personal-that-you-undermine-your-way-home-let-him-be-him', // Your Grief Is Real, but Is Your Anger Steering You Off the Road Home?
      'll152-crying-because-of-all-the-dying-slow-and-vicious-but-yahweh', // Why Does Grief Over Slow Loss Feel Like Failure? What Scripture Says A
      'll27-the-god-who-documents-his-grief', // Does Yahweh Grieve? What His Tears Teach You About Your Own Story
      'll124-equipped-to-win-the-hour-you-are-losing-the-word-again-and-the-man-who-did-not-want-the-job', // Losing Right Now? The Hour You Most Need to Remember Who You Are, and
      'll146-he-said-it-first-what-it-sounds-like-when-yahweh-tells-you-how-he-feels', // If Someone Said All This to You, Would You Believe Them? Testing Yahwe
    ],
  },
  {
    id: 'anger',
    group: 'Mind & heart',
    title: 'Anger and a short temper',
    say: ['anger', 'angry', 'temper', 'rage', 'short temper', 'lose my temper'],
    flag: 'thin',
    note: 'Four lessons speak to anger; none is a full study of it.',
    lessons: [
      'ea-gh-soft-answer', // Your Reply Is the Thermostat: How One Calm Sentence Can Cool a Heated
      'll16-rule-your-spirit-repair-the-bond', // Who Holds the Room When Tempers Flare? A Trial Lawyer's Lessons on Sta
      'll18-the-flinch-comes-first', // Your Body Fires Before Your Mind Catches Up: Is That a Sin, or a Desig
      'll115-meek-and-quiet-strength-the-ornament-of-great-price-and-why-jael-is-not-the-blueprint', // Is Meek and Quiet Weakness? What the Word Says About Strength Under Ya
    ],
  },
  {
    id: 'healing',
    group: 'Mind & heart',
    title: 'Healing from past hurt',
    say: ['healing', 'heal', 'trauma', 'wounded', 'past hurt', 'broken heart', 'hurting'],
    lessons: [
      'mit10-wired-to-survive', // Is Your Brain Broken, or Just Built to Protect You? What Yahweh's Word
      'll330-he-healeth-the-broken-in-heart', // Can a Broken Heart Be Made Whole? What Yahweh's Word Says About the Wo
      'll74-church-hurt-the-counterfeit-comfort-and-the-blood', // Your Family Performed, But Was That What Yahweh Is Like? Why the Wound
      'ea-gh-peace-peace', // Is "It's Fine" Really Healing? How Jeremiah 6:14 Exposes the Comfortab
      'll53-the-emotional-cycles-of-brain-and-body-stewarding-feeling-by-the-renewed-mind', // Tired, Hungry, Hurting: Why Your Feelings Ride Your Body's Clock, and
    ],
  },
  {
    id: 'worth',
    group: 'Mind & heart',
    title: 'Feeling worthless or not good enough',
    say: ['worthless', 'worth', 'not good enough', 'identity', 'who am i', 'self esteem'],
    flag: 'thin',
    note: 'The lessons on identity and being known come closest; there is no lesson written only about self-worth.',
    lessons: [
      'buy3-it-is-naught-it-is-naught-saith-the-buyer', // Worthless, Worthless, Says the Buyer? How a Discount Lie Gets Caught b
      'll146-he-said-it-first-what-it-sounds-like-when-yahweh-tells-you-how-he-feels', // If Someone Said All This to You, Would You Believe Them? Testing Yahwe
      'll124-equipped-to-win-the-hour-you-are-losing-the-word-again-and-the-man-who-did-not-want-the-job', // Losing Right Now? The Hour You Most Need to Remember Who You Are, and
      'ea-gh-god-not-colorblind', // Does Yahweh See Your Background or Erase It? What Revelation 5:9 Shows
    ],
  },
  {
    id: 'guilt',
    group: 'Mind & heart',
    title: 'Guilt and shame',
    say: ['guilt', 'guilty', 'shame', 'ashamed', 'condemned', 'condemnation', 'forgive myself'],
    lessons: [
      'ea-gh-confess-cleanse', // What If Your Mess Could Be Cleaned Up Today? 1 John 1:9 and Why Confes
      'ea-gh-conviction-vs-condemnation', // Where Guilt Comes From (conviction walks you home; accusation walks yo
      'll80-the-four-warnings-of-a-hardening-heart', // Same Failure Night, Two Endings: What Separates Remorse That Destroys
      'll292-the-word-is-our-mirror', // Your Own Heart Is Not Your Judge: How Yahweh's Word Lets You See Yours
      'ea-gh-hear-believe-no-condemnation', // Already Passed Over? What John 5:24 Says About Living Before the Verdi
    ],
  },
  {
    id: 'forgive',
    group: 'Forgiveness & peace',
    title: 'Forgiving someone who hurt me',
    say: ['forgive', 'forgiveness', 'forgiving', 'bitter', 'bitterness', 'resentment', 'grudge', 'hurt me'],
    lessons: [
      'ea-gh-forgive-forgiven', // Your Forgiveness Has a Pipeline: What Matthew 6:14-15 Says About the D
      'ea-gh-vengeance-his', // Who Holds the Score When You've Been Wronged? Romans 12:19-21 and Why
      'll291-fruits-meet-for-repentance', // Can You Say "I Was Wrong" and Mean It? What Real Apology, Healthy Gate
      'ea-gh-confess-cleanse', // What If Your Mess Could Be Cleaned Up Today? 1 John 1:9 and Why Confes
    ],
  },
  {
    id: 'reconcile',
    group: 'Forgiveness & peace',
    title: 'Making peace with someone',
    say: ['reconcile', 'reconciliation', 'make peace', 'estranged', 'broken relationship', 'restore relationship'],
    flag: 'thin',
    note: 'Four lessons touch on repairing a relationship; none is a full study of reconciliation.',
    lessons: [
      'll291-fruits-meet-for-repentance', // Can You Say "I Was Wrong" and Mean It? What Real Apology, Healthy Gate
      'll141-separate-and-connect-working-through-issues-studying-to-be-approved-tempted-versus-tried-and-how-we-handle-each-other-and-enemies', // The Word That Cuts Is the Word That Joins: How Do We Stay Connected Wh
      'part5-let-there-be-no-strife-separate-thyself', // Before the Split Gets Bitter: Why Abram Named the Exit Terms Early, an
      'ea-gh-vengeance-his', // Who Holds the Score When You've Been Wronged? Romans 12:19-21 and Why
    ],
  },
  {
    id: 'church-hurt',
    group: 'Forgiveness & peace',
    title: 'Hurt by people at church',
    say: ['church hurt', 'hurt at church', 'offended', 'church conflict', 'church member', 'church people'],
    flag: 'thin',
    note: 'The curriculum has no lesson written about being hurt in church; these speak to offense, apology and forgiveness more broadly.',
    lessons: [
      'll74-church-hurt-the-counterfeit-comfort-and-the-blood', // Your Family Performed, But Was That What Yahweh Is Like? Why the Wound
      'll141-separate-and-connect-working-through-issues-studying-to-be-approved-tempted-versus-tried-and-how-we-handle-each-other-and-enemies', // The Word That Cuts Is the Word That Joins: How Do We Stay Connected Wh
      'll291-fruits-meet-for-repentance', // Can You Say "I Was Wrong" and Mean It? What Real Apology, Healthy Gate
      'ea-gh-vengeance-his', // Who Holds the Score When You've Been Wronged? Romans 12:19-21 and Why
    ],
  },
  {
    id: 'marriage-struggle',
    group: 'Marriage',
    title: 'My marriage is struggling',
    say: ['marriage', 'married', 'husband', 'wife', 'spouse', 'struggling marriage', 'strengthen marriage', 'argue', 'arguing', 'fighting'],
    lessons: [
      'll122-does-she-feel-like-your-favorite-person-preferring-one-another-and-the-first-works', // Does Your Spouse Feel Like Your Favorite Person? Three Word-Based Step
      'll114-what-makes-having-you-better-covenant-not-contract-and-the-value-a-paycheck-cannot-cover', // What Does a Husband Really Bring? Why Yahweh Measures a Marriage by Co
      'll157-what-is-love-in-depth-and-in-range-action-based-word-first', // Can Love Be Measured by Verbs Instead of Feelings? Fifteen Actions, On
      'll253-benefiters-or-underminers-of-the-eternal-kingdom', // Are You Building Someone Up or Pulling Them Down? What Your Daily Word
      'll151-the-tongue-death-and-life-in-a-little-member-and-the-knowledge-that-governs-it', // Nine Words Can End a Friendship: What Does Yahweh Say the Tongue Reall
      'll291-fruits-meet-for-repentance', // Can You Say "I Was Wrong" and Mean It? What Real Apology, Healthy Gate
      'll123-would-you-sign-that-contract-the-answer-the-qualification-and-the-manner-that-forfeited-it', // Would You Sign a Contract Built to Reward Its Own Breaking? What Yahwe
      'll16-rule-your-spirit-repair-the-bond', // Who Holds the Room When Tempers Flare? A Trial Lawyer's Lessons on Sta
    ],
  },
  {
    id: 'marriage-talk',
    group: 'Marriage',
    title: "My spouse and I can't communicate",
    say: ['communicate', 'communication', 'spouse listen'],
    lessons: [
      'll151-the-tongue-death-and-life-in-a-little-member-and-the-knowledge-that-governs-it', // Nine Words Can End a Friendship: What Does Yahweh Say the Tongue Reall
      'ea-gh-truth-love', // Why the Same Honest Words Can Heal or Hurt: Finding the Mirror in a Ha
      'll253-benefiters-or-underminers-of-the-eternal-kingdom', // Are You Building Someone Up or Pulling Them Down? What Your Daily Word
      'll122-does-she-feel-like-your-favorite-person-preferring-one-another-and-the-first-works', // Does Your Spouse Feel Like Your Favorite Person? Three Word-Based Step
      'll294-a-prophet-in-his-own-house', // When Family Will Not Hear the One Thing: What Jesus Faced, What Gottma
      'll157-what-is-love-in-depth-and-in-range-action-based-word-first', // Can Love Be Measured by Verbs Instead of Feelings? Fifteen Actions, On
    ],
  },
  {
    id: 'dating',
    group: 'Marriage',
    title: 'Dating, singleness and preparing for marriage',
    say: ['dating', 'single', 'singleness', 'engaged', 'wedding', 'find a spouse', 'get married', 'future spouse', 'boyfriend', 'girlfriend'],
    lessons: [
      'll230-competence-before-submission-the-study-skills-and-doing-skills-of-a-wife-and-a-husband-with-the-word-answering-first', // Can a Wife or Husband Be Ready Before the Wedding? What Ephesians 5, P
      'll231-does-yahweh-rank-a-wife-over-a-woman-covenant-the-proverbs-31-woman-and-the-order-with-the-word-answering-first', // Does a Ring Change Your Rank Before Yahweh? What the Proverbs 31 Woman
      'll181-run-it-through-the-word-the-two-minds-and-the-song-she-could-not-sing', // She Stopped Mid-Song: Can You Promise Yahweh What Your Flesh Might Not
      'll183-realign-my-eyes-your-type-was-trained', // Your Eyes Were Trained by a Feed, but Yahweh Can Retrain Them: What Ja
      'll119-abstention-if-i-am-an-option-do-not-pick-me-and-the-choosing-settled-before-there-was-a-list', // Am I Just an Option to Them? What Scripture Says About Being Weighed,
    ],
  },
  {
    id: 'betrayal',
    group: 'Marriage',
    title: 'Betrayal and broken trust',
    say: ['betrayal', 'betrayed', 'unfaithful', 'affair', 'adultery', 'cheating', 'broken trust', 'infidelity'],
    flag: 'thin',
    note: 'The curriculum has no lesson written about infidelity. These speak to apology, forgiveness and being wronged.',
    lessons: [
      'll291-fruits-meet-for-repentance', // Can You Say "I Was Wrong" and Mean It? What Real Apology, Healthy Gate
      'ea-gh-vengeance-his', // Who Holds the Score When You've Been Wronged? Romans 12:19-21 and Why
      'ea-gh-forgive-forgiven', // Your Forgiveness Has a Pipeline: What Matthew 6:14-15 Says About the D
      'll119-abstention-if-i-am-an-option-do-not-pick-me-and-the-choosing-settled-before-there-was-a-list', // Am I Just an Option to Them? What Scripture Says About Being Weighed,
      'ea-gh-truth-love', // Why the Same Honest Words Can Heal or Hurt: Finding the Mirror in a Ha
    ],
  },
  {
    id: 'divorce',
    group: 'Marriage',
    title: 'Thinking about divorce',
    say: ['divorce', 'separation', 'separated', 'leave my husband', 'leave my wife', 'end my marriage'],
    flag: 'thin',
    note: 'There is no lesson on divorce itself yet. These speak to covenant, apology and ending terms honestly. Please also talk with a pastor.',
    lessons: [
      'll123-would-you-sign-that-contract-the-answer-the-qualification-and-the-manner-that-forfeited-it', // Would You Sign a Contract Built to Reward Its Own Breaking? What Yahwe
      'part5-let-there-be-no-strife-separate-thyself', // Before the Split Gets Bitter: Why Abram Named the Exit Terms Early, an
      'll291-fruits-meet-for-repentance', // Can You Say "I Was Wrong" and Mean It? What Real Apology, Healthy Gate
      'll114-what-makes-having-you-better-covenant-not-contract-and-the-value-a-paycheck-cannot-cover', // What Does a Husband Really Bring? Why Yahweh Measures a Marriage by Co
    ],
  },
  {
    id: 'kids-listen',
    group: 'Parenting & family',
    title: "My kids won't listen",
    say: ['kids listen', 'child disobey', 'disobedient', 'discipline', 'obey', 'misbehave', 'stubborn child', 'children listen'],
    lessons: [
      'll46-ye-fathers-provoke-to-good-works', // Are You Stirring Your Child Toward Wrath or Toward Good? What Scriptur
      'll117-no-two-children-grow-up-in-the-same-house-why-siblings-differ-and-the-one-parent-who-is-the-same', // Same House, Different Childhood? What Research Admits, What Yahweh Sho
      'ea-gh-train-child', // Before the Day Gets Loud: What a 6am Conversation Can Plant for a Life
      'll205-talk-about-it-together-parents-children-friends-until-we-see-yahweh-has-been-right', // Who Are You Really Talking To About Yahweh? Why Your Kitchen Table, Yo
      'll100-guard-the-little-ones-children-the-millstone-and-mastery-over-the-tools', // Who Is Really Setting the Hook for Your Child? Guarding Little Ones Un
      'll120-it-is-written-keep-the-policy-in-your-pocket-advocacy-from-the-written-word-and-a-just-weight', // A Lost Book, a Refund Denied, and a Policy in a Ten-Year-Old's Pocket:
    ],
  },
  {
    id: 'teen',
    group: 'Parenting & family',
    title: 'My teenager is pulling away',
    say: ['teenager', 'teen', 'teens', 'adolescent', 'rebellious', 'rebelling', 'drifting'],
    flag: 'thin',
    note: 'The curriculum has no course on teenagers yet; these are the lessons that speak to young people and to parents guarding them.',
    lessons: [
      'mit2-the-young-he-called', // Seventeen, Eight, Thirteen Years: Why Yahweh Calls the Young and Train
      'mit1-the-design-in-time', // Why Your Brain Is Still Under Construction, and What Yahweh Says About
      'll100-guard-the-little-ones-children-the-millstone-and-mastery-over-the-tools', // Who Is Really Setting the Hook for Your Child? Guarding Little Ones Un
      'll46-ye-fathers-provoke-to-good-works', // Are You Stirring Your Child Toward Wrath or Toward Good? What Scriptur
      'll117-no-two-children-grow-up-in-the-same-house-why-siblings-differ-and-the-one-parent-who-is-the-same', // Same House, Different Childhood? What Research Admits, What Yahweh Sho
    ],
  },
  {
    id: 'godly-kids',
    group: 'Parenting & family',
    title: 'Raising godly children',
    say: ['godly children', 'raise children', 'raising children', 'parenting', 'parent', 'train up a child', 'godly kids', 'raise godly'],
    lessons: [
      'ea-gh-train-child', // Before the Day Gets Loud: What a 6am Conversation Can Plant for a Life
      'll205-talk-about-it-together-parents-children-friends-until-we-see-yahweh-has-been-right', // Who Are You Really Talking To About Yahweh? Why Your Kitchen Table, Yo
      'll46-ye-fathers-provoke-to-good-works', // Are You Stirring Your Child Toward Wrath or Toward Good? What Scriptur
      'll117-no-two-children-grow-up-in-the-same-house-why-siblings-differ-and-the-one-parent-who-is-the-same', // Same House, Different Childhood? What Research Admits, What Yahweh Sho
      'legacy6-hand-it-forward', // Your Grandchildren Are Already in the Plan: How Psalm 78 Turns a Famil
      'll313-children-are-a-heritage-when-the-school-closes-the-house', // Schools Are Closing, But Who Is Still Teaching Your Children? What Yah
      'll100-guard-the-little-ones-children-the-millstone-and-mastery-over-the-tools', // Who Is Really Setting the Hook for Your Child? Guarding Little Ones Un
      'mit2-the-young-he-called', // Seventeen, Eight, Thirteen Years: Why Yahweh Calls the Young and Train
    ],
  },
  {
    id: 'kids-learn',
    group: 'Parenting & family',
    title: 'Teaching my young child to read and count',
    say: ['teach child read', 'toddler', 'preschool', 'kindergarten', 'teach letters', 'teach numbers', 'little learner', 'learn to read'],
    note: 'These are lessons for the child to read or hear with a parent.',
    lessons: [
      'lil5-first-words-from-the-word', // Can Little Eyes Read Yahweh's Word? Six First Words, Light to Love, Th
      'lil1-a-is-for-adam-who-named-the-animals', // Before You Can Read a Book, Do You Know Its First Letters? Meet A, B,
      'lil2-count-the-days-one-to-seven', // Can a Preschooler Count to Seven With Creation?
      'lil4-sort-by-kind-two-by-two', // Can Little Hands Sort Like Yahweh Does? Two-by-Two Counting Starts in
      'lil6-how-many-loaves-how-many-baskets', // Seven Pieces for a Crowd, Twelve Baskets Left Over: Can a Little Count
      'lil9-abraham-the-promise-the-stars-and-the-lamb-yahweh-provided', // Nobody Can Count the Stars, So Why Did Abraham Believe? A Little Learn
    ],
  },
  {
    id: 'aging-parents',
    group: 'Parenting & family',
    title: 'Caring for aging parents',
    say: ['aging parents', 'elderly parents', 'honor your father and mother', 'honor parents', 'caring for parents', 'old parents'],
    flag: 'gap',
    note: 'There is no lesson on caring for aging parents yet. This is on the list of lessons to write.',
    lessons: [],
  },
  {
    id: 'no-father',
    group: 'Parenting & family',
    title: 'Growing up without a father',
    say: ['fatherless', 'without a father', 'absent father', 'no father', 'orphan', 'single mother', 'single parent'],
    flag: 'thin',
    note: 'Three lessons speak to the fatherless and the family Yahweh builds; there is no course on this yet.',
    lessons: [
      'ea-gh-father-fatherless', // Who Fills the Empty Seat at the Table? Psalm 68:5-6 and the Family Yah
      'hist6-the-fields-of-the-fatherless', // Who Gleans the Fields When the Fathers Are Gone? The American Record o
      'evic1-they-turn-the-needy-out-of-the-way', // Before the Rules: Why Job Refuses to Look Away From a Family Put Out i
    ],
  },
  {
    id: 'family-conflict',
    group: 'Parenting & family',
    title: 'Conflict in my family',
    say: ['family conflict', 'family fight', 'family fighting', 'in-laws', 'family division', 'family drama', 'siblings', 'family argue'],
    lessons: [
      'll141-separate-and-connect-working-through-issues-studying-to-be-approved-tempted-versus-tried-and-how-we-handle-each-other-and-enemies', // The Word That Cuts Is the Word That Joins: How Do We Stay Connected Wh
      'll63-the-family-in-the-field-offense-defense-why-yahweh-allows', // Under Attack in Yahweh's Family? Why He Allows the Fight, and the Weap
      'll294-a-prophet-in-his-own-house', // When Family Will Not Hear the One Thing: What Jesus Faced, What Gottma
      'pv-williams', // Destruction From Without and Within: What One Historian Learned About
      'ea-gh-vengeance-his', // Who Holds the Score When You've Been Wronged? Romans 12:19-21 and Why
      'll291-fruits-meet-for-repentance', // Can You Say "I Was Wrong" and Mean It? What Real Apology, Healthy Gate
    ],
  },
  {
    id: 'debt',
    group: 'Money',
    title: 'Getting out of debt',
    say: ['debt', 'debts', 'owe', 'loan', 'loans', 'mortgage', 'credit card', 'borrow', 'borrowing', 'out of debt'],
    lessons: [
      'fin4-the-wicked-borroweth-and-payeth-not-again', // Is Your Debt Really the Sin? Where Psalm 37:21 Puts the Fault, and the
      'fin8-he-frankly-forgave-them-both', // Owed Nothing, Forgiven Fully: Why a Cancelled Debt Should Change How Y
      'fin1-the-head-and-the-tail', // Who Holds the Pen on Your Mortgage? Reading Deuteronomy 28 as a Questi
      'll82-love-fulfils-the-law-wake-up-and-get-dressed', // Can a Debt Stay Open Forever? What Romans 13 Says About Love, the Cloc
      'bank2-the-one-rule-and-its-limit', // Is Your Loan Quietly Hurting Someone Close to You? What Exodus 22:25-2
      'buy6-what-borrowing-makes-you-and-what-it-does-not', // How Many Months Could Your Reserves Really Hold? Borrowing as a Positi
      'fin5-what-hast-thou-in-the-house', // What's Already in Your House? The Overlooked Asset That Can Pay a Debt
    ],
  },
  {
    id: 'bills',
    group: 'Money',
    title: "I can't pay my bills",
    say: ['bills', 'broke', 'cannot pay', 'pay my bills', 'struggling financially', 'poor', 'poverty', 'paycheck'],
    flag: 'thin',
    note: 'No lesson is written for a family in a cash crisis; these are the closest, on provision, reserves and debt.',
    lessons: [
      'fin5-what-hast-thou-in-the-house', // What's Already in Your House? The Overlooked Asset That Can Pay a Debt
      'buy6-what-borrowing-makes-you-and-what-it-does-not', // How Many Months Could Your Reserves Really Hold? Borrowing as a Positi
      'bank5-saving-that-is-not-hoarding', // Is Your Savings Plan a Store or a Stockpile? Why Proverbs 21:20 Asks W
      'econ1-soul-first', // Money Under the Master: Why Your Soul Comes Before Your Savings, and W
      'fin4-the-wicked-borroweth-and-payeth-not-again', // Is Your Debt Really the Sin? Where Psalm 37:21 Puts the Fault, and the
    ],
  },
  {
    id: 'budget',
    group: 'Money',
    title: 'Budgeting and saving',
    say: ['budget', 'budgeting', 'save money', 'saving', 'savings', 'spending', 'manage money', 'household finances'],
    lessons: [
      'bank5-saving-that-is-not-hoarding', // Is Your Savings Plan a Store or a Stockpile? Why Proverbs 21:20 Asks W
      'econ1-soul-first', // Money Under the Master: Why Your Soul Comes Before Your Savings, and W
      'econ2-ownership-vs-consumption', // Do You Own the Harvest or Only Spend It? Genesis 2:15, the Talents, an
      'ea-gh-tithe-windows', // Can You Test Heaven With Your Own Budget? Malachi 3:10 and the Tithe Y
      'buy6-what-borrowing-makes-you-and-what-it-does-not', // How Many Months Could Your Reserves Really Hold? Borrowing as a Positi
    ],
  },
  {
    id: 'giving',
    group: 'Money',
    title: 'Tithing and giving',
    say: ['tithe', 'tithing', 'giving', 'generous', 'generosity', 'offering', 'how much give'],
    flag: 'thin',
    note: 'Four lessons speak to the tithe and to giving.',
    lessons: [
      'ea-gh-tithe-windows', // Can You Test Heaven With Your Own Budget? Malachi 3:10 and the Tithe Y
      'ea-gh-give-heart', // Is Your Giving Only Your Wallet? What Proverbs 23:26 Asks for Before t
      'ea-gh-el-elyon-possessor', // Whose Land Is It, Really? How Abram's Tithe Reveals Yahweh as the One
      'ea-gh-measure-measured', // The Measure You Use (judge not · give)
    ],
  },
  {
    id: 'invest',
    group: 'Money',
    title: 'Investing and retirement',
    say: ['invest', 'investing', 'investment', 'retire', 'retirement', 'stock', 'stocks'],
    lessons: [
      'inv1-what-investing-actually-is', // Is Your Savings Really Investing? The One Question That Separates Wait
      'inv7-the-stewards-question', // Before You Invest a Dollar: Three Questions That Decide Whether a Prop
      'inv4-spreading-it-out-and-what-that-cannot-do', // Spreading Your Money Protects You From One Mistake, But Not From a Sto
      'inv8-enough', // Is There a Finish Line for Your Money? The One Number No Investing Cou
      'inv2-risk-is-four-things-wearing-one-word', // Four Dangers Hiding Under One Word: Which Risk Is Your Money Really Fa
      'stk8-the-question-the-screen-never-asks', // Whose Money Is It Really? The Question No Stock Screen Can Ask, and Wh
      'inv5-cost-is-the-one-number-known-in-advance', // The Only Number You Can Read Before the Market Moves: What a 1% Annual
      'legacy4-forced-production', // An Heir Who Only Draws Is Being Trained to Consume: What the Talents T
    ],
  },
  {
    id: 'first-home',
    group: 'Money',
    title: 'Buying my first home',
    say: ['first home', 'buy a house', 'buying a home', 'homebuyer', 'home buying', 'buy house', 'down payment', 'mortgage home'],
    lessons: [
      'prop6-the-field-before-the-house', // Build the Field Before the House: Why Yahweh Puts the Income First, an
      'buy6-what-borrowing-makes-you-and-what-it-does-not', // How Many Months Could Your Reserves Really Hold? Borrowing as a Positi
      'insp1-the-plague-in-the-walls', // Before You Sign, Who Looks First? The Seven-Step Home Inspection Hidde
      'bnd7-inflation-is-the-quiet-default', // Paid in Full, Still Poorer: The Silent Loss Hiding Inside a Fixed Paym
      'insp3-see-the-land-what-it-is', // Six Questions, One Sample: How Twelve Scouts Show Why a Home Inspectio
      'buy2-two-sets-of-weights-in-one-bag', // Is Your Property Math Honest in Both Directions?
      'appr3-according-to-the-years-that-remain', // Why Are You Really Paying for a Property? Discover What Your Price Kee
      'evic5-the-year-to-redeem', // The Clock on a Home Sale: Why Yahweh Set Both Ends of the Window in Ad
    ],
  },
  {
    id: 'legacy',
    group: 'Money',
    title: 'Leaving a legacy for my children',
    say: ['inheritance', 'legacy', 'estate', 'will and trust', 'generational wealth', 'leave children', 'grandchildren'],
    lessons: [
      'legacy6-hand-it-forward', // Your Grandchildren Are Already in the Plan: How Psalm 78 Turns a Famil
      'prop8-handed-forward-or-handed-to-a-fool', // Will Your Grandchildren Inherit Wisdom Along With the Property? What S
      'legacy1-why-it-vanishes', // The Money Stayed, the Heart Didn't Move: Why Inheritances Empty Out Be
      'legacy2-constitution', // The Trust Can Move the Money, But Who Carries the Values? Why Yahweh S
      'econ7-build-institutions', // Could Your Business Still Bless a Grandchild You Never Meet? Greenwood
    ],
  },
  {
    id: 'lost-job',
    group: 'Work & calling',
    title: 'I lost my job',
    say: ['lost job', 'laid off', 'fired', 'unemployed', 'unemployment', 'out of work', 'need a job', 'job search'],
    flag: 'thin',
    note: 'There is no course on job loss; these speak to identity, proven work and what a worker does without waiting for a boss.',
    lessons: [
      'll124-equipped-to-win-the-hour-you-are-losing-the-word-again-and-the-man-who-did-not-want-the-job', // Losing Right Now? The Hour You Most Need to Remember Who You Are, and
      'pm19-let-these-also-first-be-proved', // Your Résumé Says Yes, but Who Has Watched You Work? What Daniel, Apoll
      'mgmt9-nobody-is-coming-to-define-your-work', // Who Writes the Standard When No Boss Has? Ants, Locusts, and the Worke
      'pm12-titles-and-fruits-capability-shown-in-outcomes', // Is Your Title Your Ceiling? How David's Lion-and-Bear Record Shows Wha
    ],
  },
  {
    id: 'career',
    group: 'Work & calling',
    title: 'Unhappy at work or choosing a career',
    say: ['career', 'hate my job', 'change careers', 'career change'],
    lessons: [
      'pm19-let-these-also-first-be-proved', // Your Résumé Says Yes, but Who Has Watched You Work? What Daniel, Apoll
      'wi-the-trades-are-hiring-2026', // The Trades Are Hiring, but Is a Degree Still Worth the Price? What Yah
      'econ1-soul-first', // Money Under the Master: Why Your Soul Comes Before Your Savings, and W
      'mgmt9-nobody-is-coming-to-define-your-work', // Who Writes the Standard When No Boss Has? Ants, Locusts, and the Worke
      'pm12-titles-and-fruits-capability-shown-in-outcomes', // Is Your Title Your Ceiling? How David's Lion-and-Bear Record Shows Wha
    ],
  },
  {
    id: 'workplace',
    group: 'Work & calling',
    title: 'Difficult boss or coworkers',
    say: ['boss', 'coworker', 'coworkers', 'workplace', 'supervisor', 'difficult boss', 'bad boss'],
    lessons: [
      'll277-look-at-the-record', // Your Boss Is Losing Their Clock: What Do You Do When Bad Leadership Su
      'll207-the-worker-is-worthy-the-broken-deal-the-cry-yahweh-hears', // Your Boss Broke the Deal? What Yahweh's Word Says About Fair Wages, Em
      'mgmt9-nobody-is-coming-to-define-your-work', // Who Writes the Standard When No Boss Has? Ants, Locusts, and the Worke
      'll306-the-path-of-the-just-shineth', // Hard Bosses, Small Foxes, and a Ram in the Thicket: How Yahweh Keeps Y
      'll16-rule-your-spirit-repair-the-bond', // Who Holds the Room When Tempers Flare? A Trial Lawyer's Lessons on Sta
    ],
  },
  {
    id: 'start-biz',
    group: 'Work & calling',
    title: 'Starting a business',
    say: ['start a business', 'start business', 'entrepreneur', 'entrepreneurship', 'startup', 'own business', 'small business', 'business owner'],
    lessons: [
      'pm1-count-the-cost', // Can You Finish What You Start? The One Question Yahweh Asks Before You
      'rto8-marketing-vision-and-going-to-get-the-information', // Your Customers Are Your Marketing: What Vision, Wealth, and Getting Wi
      'rto6-customer-service-white-glove-in-someones-home', // Would Your Customer Feel Honoured in Their Own Living Room? What Yahwe
      'br5-just-weights', // Is Your Scale Honest? How a 412-Finding Court Case Teaches You to Weig
      'pm2-who-should-work', // Your Team Is Stalling Because You're Doing Everyone's Job: What Jethro
      'pm3-the-skill-is-given-and-named', // Who Gets Named for the Hard Build? Bezaleel, a Skills List, and the Gi
    ],
  },
  {
    id: 'purpose',
    group: 'Work & calling',
    title: 'Finding my purpose and calling',
    say: ['purpose', 'calling', 'destiny', 'why am i here', 'meaning', 'life purpose'],
    lessons: [
      'ea-gh-known-before-formed', // Did You Have to Earn Your Purpose? What Jeremiah 1:5 Reveals About Bei
      'll324-filled-to-devise-cunning-works', // Could Your Craft Be a Calling? What a Tabernacle Builder, a Grant Call
      'ea-gh-thief-targets-identity', // Is Someone Trying to Rob Your Identity? What John 10:10 and Genesis 1:
      'll216-a-life-full-of-everything-yahweh-is-always-good-consistency-is-the-key-and-his-will-is-that-you-prosper-as-your-soul-prospers', // A Full Life, a Faithful Yahweh: Can You Prosper When Your Soul Leads t
      'll332-give-me-this-mountain', // Is Your Strongest Season Still Ahead of You?
      'll301-old-men-dream-young-men-see', // Can Your Dreams Reach Past Your Own Lifetime? What Joel, Peter, and th
      'll197-think-soberly-overlooked-promoted-by-him-and-the-hands-that-build-the-house', // Overlooked at Work, Promoted by Whom? What Joseph, a Forgetful Butler,
      'll169-pour-it-out-every-seat-worked-feed-my-sheep-and-be-the-best-in-this-too', // Every Seat Counts: Why Yahweh Promotes the Faithful Worker, Feeds the
    ],
  },
  {
    id: 'gifts',
    group: 'Work & calling',
    title: 'Discovering my gifts and talents',
    say: ['gifts', 'gift', 'talents', 'talent', 'skills', 'good at', 'spiritual gifts'],
    lessons: [
      'co6-fivefold-and-body', // Who Are the Gifts For? The Five Equipping Roles Yahweh Gave, and the S
      'll69-faithful-over-a-few-things-stewardship-and-increase', // Does Having More Mean Using What You Have? The Talents Parable and the
      'll324-filled-to-devise-cunning-works', // Could Your Craft Be a Calling? What a Tabernacle Builder, a Grant Call
      'maint2-called-by-name-and-filled-for-the-work', // Skilled Hands, Sacred Gift: What Yahweh's Choice of a Builder Says Abo
      'pm3-the-skill-is-given-and-named', // Who Gets Named for the Hard Build? Bezaleel, a Skills List, and the Gi
    ],
  },
  {
    id: 'guidance',
    group: 'Work & calling',
    title: "Knowing God's will for a decision",
    say: ['gods will', 'god will', 'yahweh will', 'guidance', 'guide me', 'which way', 'decision', 'decisions', 'crossroads'],
    flag: 'thin',
    note: 'Three lessons speak to deciding well before Yahweh; there is no course on discerning His will.',
    lessons: [
      'ea-gh-trust-paths', // Stuck at the Crossroads? Why Trusting Yahweh Before You Decide Changes
      'll31-the-best-way-preferred-accepted-natural-against', // Allowed Isn't Always Best: How to Find Yahweh's Preferred Way in Every
      'sov70-every-one-over-against-his-house', // Must Every Decision Wait in Line? What Nehemiah's Wall Teaches About B
    ],
  },
  {
    id: 'leader',
    group: 'Work & calling',
    title: 'Becoming a better leader',
    say: ['leader', 'leaders', 'leadership', 'leading', 'manager', 'manage team'],
    lessons: [
      'pm2-who-should-work', // Your Team Is Stalling Because You're Doing Everyone's Job: What Jethro
      'ea-gh-throne-established', // Where Does a Throne Really Stand? Why Yahweh Measures Lasting Authorit
      'co3-elder', // Is Age Enough to Lead? What the Bible's Most Common Leadership Word Te
      'll61-the-audit-fruit-not-photographs-accountable-shepherds', // Is Your Leader Feeding the Flock or Feeding Himself? A Scripture Audit
      'll277-look-at-the-record', // Your Boss Is Losing Their Clock: What Do You Do When Bad Leadership Su
      'll296-willing-and-obedient', // Do You Really Want to Follow? How Yahweh Works the Heart to Follow Wel
    ],
  },
  {
    id: 'ministry',
    group: 'Work & calling',
    title: 'Serving or leading in ministry',
    say: ['ministry', 'pastor', 'elder', 'deacon', 'church leader', 'church office', 'church volunteer', 'serve church', 'worship team'],
    lessons: [
      'co2-deacon', // Who Really Carries the Tables? Meet the Quiet Work That Keeps a Church
      'co5-pastor-shepherd', // The Word Says "Pastor" Only Nine Times. So Why Does the Shepherd Show
      'co7-our-house-now', // Your Church Org Chart Starts With Verbs, Not Titles: What Yahweh's Wor
      'co6-fivefold-and-body', // Who Are the Gifts For? The Five Equipping Roles Yahweh Gave, and the S
      'co1-names-and-numbers', // Before the Job Title, the Word: How Can You Study a Church Office Like
      'll42-keep-the-adversary-out-of-the-music', // Who Is Really Conducting Your Choir? The Hidden Door Pride Uses Into W
      'll61-the-audit-fruit-not-photographs-accountable-shepherds', // Is Your Leader Feeding the Flock or Feeding Himself? A Scripture Audit
    ],
  },
  {
    id: 'closer',
    group: 'Faith',
    title: 'Growing closer to Yahweh',
    say: ['closer', 'closer to god', 'closer to yahweh', 'draw near', 'intimacy', 'deeper relationship', 'closeness', 'near to god'],
    lessons: [
      'll17-taste-and-see', // Can You Really Know Yahweh Without Running the Test? A Psalm 34 Lab fo
      'ea-gh-closet', // Your Hidden Prayer Room Shapes Your Public Life: What Matthew 6:6 Teac
      'll127-the-firsts-what-yahweh-did-in-each-century-that-had-never-been-done-before', // Did Yahweh Ever Stop Wanting to Walk With Us? Tracing the Firsts Back
      'll109-how-we-know-yahwehs-love-taste-see-hear-touch-experienced-at-every-age', // Can You Taste, See, Hear, and Touch Yahweh's Love? Five Senses, Every
      'll36-fruit-root-and-the-empty-house', // Strange Fruit, Hidden Roots: Why Cutting Off the Bad Fruit Often Fails
      'll59-not-by-measure-all-of-him-from-day-one', // Do You Get a Slice of the Holy Spirit, or All of Him From the Start? W
      'll56-the-person-of-the-holy-spirit-seek-the-deliverer-not-deliverance', // Are You Chasing Demons or Hosting the King? What Yahweh's Word Says Ab
      'ea-gh-fruit-no-law', // No Law Can Forbid This Life: How Yahweh's Spirit Grows Fruit Instead o
      'ea-gh-keep-yourself-by-the-word', // Not One Big Decision, But One Small Step: How Daily Obedience to Yahwe
      'll96-doers-of-the-word-competence-by-doing-and-the-minds-tactics-daily', // Can You Know the Word Without Doing It? Why James Says Doing Is the Do
      'll184-he-sings-yahweh-over-you-jesus-in-the-midst-of-you', // Did You Know Yahweh Sings? The Part of His Heart Most of Us Were Never
      'll26-how-the-king-knows-his-kings', // Does the King Write His Plans Down, and Can You Really Know Him Throug
      'll83-keep-thy-heart-the-conditions-of-growth', // Your Heart Is a Spring Under Watch: Who Stands Guard, What You Let In,
    ],
  },
  {
    id: 'pray',
    group: 'Faith',
    title: 'Learning to pray',
    say: ['pray', 'prayer', 'prayers', 'praying', 'how to pray', 'teach me to pray'],
    flag: 'thin',
    note: 'Four lessons are about prayer itself; more of the curriculum touches it in passing.',
    lessons: [
      'ea-gh-closet', // Your Hidden Prayer Room Shapes Your Public Life: What Matthew 6:6 Teac
      'ea-gh-ask-seek-knock', // Stuck Waiting on an Answer? What Matthew 7:7-8 Teaches About Asking, S
      'ea-gh-not-my-will-but-thine', // Can You Pray "Not My Will" and Still Feel Safe? What Luke 22:42 and 1
      'ea-gh-pray-for-protection', // Is Temptation Ever Yahweh's Doing? What Matthew 6:13 and 1 Peter 5:8 T
    ],
  },
  {
    id: 'doubt',
    group: 'Faith',
    title: 'Doubting whether God is real',
    say: ['doubt', 'doubts', 'doubting', 'is god real', 'faith weak', 'skeptic', 'skeptical', 'does god exist'],
    lessons: [
      'll41-truth-with-a-capital-t', // Is Faith Just a Comfort Blanket? Testing the Claim That Yahweh Is Actu
      'll24-yahweh-is-the-only-way', // Which Way Is True? Three Clues That Point to Yahweh Alone
      'ea-gh-clearly-seen-without-excuse', // The Fingerprints Are Everywhere: Why Ignoring the Designer Is the Real
      'll335-not-done-in-a-corner', // Was the Resurrection Ever Hidden? Who Saw It, What Was Passed On First
      'll176-faith-is-the-substance-and-the-evidence-and-he-made-me-then-died-for-me', // Faith Isn't a Feeling? What Hebrews 11 Says Faith Is Made Of, and Why
    ],
  },
  {
    id: 'suffering',
    group: 'Faith',
    title: 'Why does God allow suffering?',
    say: ['suffering', 'suffer', 'why bad things', 'pain', 'hardship', 'trials', 'why does god allow', 'life so hard'],
    flag: 'thin',
    note: 'The curriculum answers this in pieces across lessons on testing, grief and trust; there is no single course on suffering.',
    lessons: [
      'ea-gh-not-my-will-but-thine', // Can You Pray "Not My Will" and Still Feel Safe? What Luke 22:42 and 1
      'ea-gh-tested-soul', // Why Does Yahweh Let Every Believer Be Tested? What James 1:12 and 1 Pe
      'll131-joy-is-not-happiness-three-days-one-strength-and-the-word-as-the-code-that-runs-each-of-them', // Happiness Is Weather, Joy Is the Power Line: Why Strength Can Hold on
      'll27-the-god-who-documents-his-grief', // Does Yahweh Grieve? What His Tears Teach You About Your Own Story
      'll162-do-not-take-a-death-so-personal-that-you-undermine-your-way-home-let-him-be-him', // Your Grief Is Real, but Is Your Anger Steering You Off the Road Home?
    ],
  },
  {
    id: 'waiting',
    group: 'Faith',
    title: 'Waiting on God, or unanswered prayer',
    say: ['waiting', 'wait', 'unanswered prayer', 'god silent', 'god is silent', 'no answer', 'delay'],
    flag: 'thin',
    note: 'Four lessons speak to waiting and asking.',
    lessons: [
      'ea-gh-wait-renew', // Running on Empty? Why the Strength You Need Is Found in Waiting, Not S
      'ea-gh-ask-seek-knock', // Stuck Waiting on an Answer? What Matthew 7:7-8 Teaches About Asking, S
      'll129-you-have-a-destiny-the-giver-the-window-covenant-authority-the-heart-of-flesh-and-the-me-that-has-to-die', // Who Is Blessing You Before You Ask? Giver, Window, Authority, and the
      'll180-he-giveth-thee-power-to-get-wealth', // Handed the Power, Still Waiting? What Deuteronomy 8:18 Gives You Now,
    ],
  },
  {
    id: 'study',
    group: 'Faith',
    title: 'Studying the Bible',
    say: ['study bible', 'read bible', 'reading the bible', 'understand scripture', 'bible study', 'where to start', 'understand the bible'],
    lessons: [
      'll229-the-word-is-spirit-and-life-what-it-means-in-his-own-words', // Bread, Seed, Fire, and Sword: What Does It Mean That the Word Gives Li
      'll227-read-the-word-for-the-spirit-do-the-word-for-the-skill-not-to-say-i-got-you-but-to-become-better-his-way-and-then-do-his-way', // Are You Reading to Win an Argument or to Be Changed? Why Yahweh's Word
      'll133-how-to-see-the-whole-torah-at-once-the-twelve-patterns-and-the-two-questions-that-opened-them', // Read the Torah Like a Map: Can You Spot the Patterns Before the Plot?
      'll246-doing-the-word-comes-first-and-our-live-situations-are-bread', // Do You Need to Understand It First? How Yahweh Makes Knowledge in the
      'll105-doing-the-word-rewires-you-daily-intake-the-deep-heart-and-experiential-over-theoretical', // Read It Every Day, but Are You Doing It? How Daily Attention and Obedi
      'lil5-first-words-from-the-word', // Can Little Eyes Read Yahweh's Word? Six First Words, Light to Love, Th
    ],
  },
  {
    id: 'spirit',
    group: 'Faith',
    title: 'Knowing the Holy Spirit',
    say: ['holy spirit', 'hear the spirit', 'led by the spirit', 'walk in the spirit'],
    lessons: [
      'll58-the-wind-you-can-hear-perceiving-the-holy-spirit', // Can You Really Sense the Holy Spirit? Learning to Read Yahweh's Wind W
      'll56-the-person-of-the-holy-spirit-seek-the-deliverer-not-deliverance', // Are You Chasing Demons or Hosting the King? What Yahweh's Word Says Ab
      'll59-not-by-measure-all-of-him-from-day-one', // Do You Get a Slice of the Holy Spirit, or All of Him From the Start? W
      'ea-gh-fruit-no-law', // No Law Can Forbid This Life: How Yahweh's Spirit Grows Fruit Instead o
      'll217-the-holy-spirit-brings-a-sound-mind-not-confusion-his-clarity-the-eyes-of-the-heart-and-the-word-as-the-only-source', // Is Your Mind Running on Noise? How the Holy Spirit Brings Clarity, Ope
      'll233-yahweh-speaking-with-yahweh-every-place-the-word-lets-us-overhear-the-father-the-son-and-the-holy-spirit', // Have You Ever Overheard the Conversation Inside the Godhead? Tracing W
    ],
  },
  {
    id: 'new-believer',
    group: 'Faith',
    title: 'New to faith, where do I start?',
    say: ['new believer', 'new christian', 'new to faith', 'salvation', 'saved', 'begin following jesus', 'become a christian', 'born again'],
    lessons: [
      'ea-gh-confess-believe', // Your Mouth and Your Heart Are On the Same Team: How Romans 10:9 Makes
      'll203-the-whole-line-of-promise-every-promise-from-eden-to-malachi-and-the-years-to-jesus', // Why Does the Promise of Jesus Begin in Eden, Not With David? Tracing 4
      'whohe9-he-is-risen-and-he-goes-up', // Did the Tomb Stay Closed? Following Jesus From the Empty Grave to the
      'll189-follow-the-leader-the-shepherd-of-our-souls', // Who Are You Already Following? The Shepherd Who Walked Into Rejection,
      'll132-the-whole-salvation-plan-inside-genesis-alone-and-the-godhead-at-war-with-the-enemies-from-the-first-pages', // The Rescue Was Never a Late Idea: Find the Whole Plan on Page One of G
    ],
  },
  {
    id: 'return',
    group: 'Faith',
    title: 'I walked away from Yahweh',
    say: ['walked away', 'backslidden', 'backslide', 'far from god', 'come back', 'return to god', 'prodigal', 'left the church'],
    flag: 'thin',
    note: 'Three lessons speak to coming back after failure; there is no course on returning to faith.',
    lessons: [
      'ea-gh-confess-cleanse', // What If Your Mess Could Be Cleaned Up Today? 1 John 1:9 and Why Confes
      'll80-the-four-warnings-of-a-hardening-heart', // Same Failure Night, Two Endings: What Separates Remorse That Destroys
      'ea-gh-stand-on-word', // Why Does Peter Sink the Moment He Looks Away? Matthew 14:29, Luke 10:1
    ],
  },
  {
    id: 'temptation',
    group: 'Faith',
    title: 'Struggling with temptation or a habit',
    say: ['temptation', 'tempted', 'addiction', 'addicted', 'habit', 'habits', 'porn', 'cannot stop'],
    lessons: [
      'ea-gh-testing-not-temptation', // Is Temptation Ever Yahweh's Doing? Telling Bait from a Test and Findin
      'ea-gh-pray-for-protection', // Is Temptation Ever Yahweh's Doing? What Matthew 6:13 and 1 Peter 5:8 T
      'ea-gh-tested-soul', // Why Does Yahweh Let Every Believer Be Tested? What James 1:12 and 1 Pe
      'll36-fruit-root-and-the-empty-house', // Strange Fruit, Hidden Roots: Why Cutting Off the Bad Fruit Often Fails
      'll154-why-do-we-have-to-pay-for-our-fathers-sins-we-dont-and-it-needs-what-we-do-here', // Is Your Family Destiny Locked In? Guilt Doesn't Pass Down, but Pattern
      'ea-gh-fruit-no-law', // No Law Can Forbid This Life: How Yahweh's Spirit Grows Fruit Instead o
    ],
  },
  {
    id: 'ai',
    group: 'Faith & the world',
    title: 'Artificial intelligence and faith',
    say: ['ai', 'artificial intelligence', 'chatgpt', 'chatbot', 'technology', 'tech'],
    lessons: [
      'll67-made-in-his-image-we-make-why-ai-is-not-a-soul', // Can a Machine Have a Soul? Why the Maker's Gift Stops at the Tool, and
      'll62-the-age-of-counterfeits-meekness-over-manipulation', // Is Your Influence Really Yours to Wield? Spotting Control Dressed as F
      'wk3-the-test', // Why Does an AI Answer That Sounds Right Deserve the Most Doubt?
      'sov77-prove-all-things', // Your AI Got Faster, So Who Tastes the Results? Testing Machines the Wa
      'sov56-oversight-is-a-charge-not-a-ceremony', // Who Can Stop the Machine, and Have They Ever Actually Stopped It?
    ],
  },
  {
    id: 'health',
    group: 'Faith & the world',
    title: 'Caring for my body',
    say: ['health', 'healthy', 'fasting', 'diet', 'exercise', 'weight', 'fitness'],
    lessons: [
      'hl-w3-therapeutic-fasting', // Does Fasting Honor the Body Yahweh Made? What Isaiah 58, Daniel 1, and
      'hl-w3-water-fasting-supervised', // Is Rest Your Missing Remedy? What Mark 6:31 and Proverbs 23 Reveal Abo
      'll2-the-energy-you-were-given', // Is Your Stress Quietly Draining Your Energy Tank? What Scripture and M
      'hl-w3-women-midlife-strength', // Strong, Not Skinny: What Proverbs 31 and Midlife Women's Health Resear
      'll9-the-lord-looks-on-the-heart', // Looks Can Deceive: What the "Skinny Fat" Puzzle Reveals About the Hear
      'hl-w3-fasting-as-discipline', // Can a 24-Hour Fast Train More Than Your Body? Discipline, Appetite, an
      'hl-w3-tre-circadian', // When Should You Eat? Ecclesiastes 10:17 Meets Modern Fasting Science,
      'hl-w3-fasting-timeline', // Does the Body Pay Off on a Schedule? What a Fasting Timeline Shows, Ga
    ],
  },
  {
    id: 'history',
    group: 'Faith & the world',
    title: 'Black history and the Bible',
    say: ['black history', 'african american', 'african american history', 'slavery', 'civil rights', 'racism', 'heritage', 'ancestors'],
    lessons: [
      'hist4-the-wage-that-could-not-wait', // Did Yahweh's Law Already Name Slavery as Theft? One Documented Life Te
      'pv-inventions', // Who Got Credit for Black Genius? The Patent Law That Erased Inventors,
      'hist5-two-weights-in-one-bag', // Two Weights in One Law: How a Nation Can Hide a Second Standard in Pla
      'hist3-the-landmark-and-the-vineyard', // The Paperwork Was Lawful, But Was the Land Taken Justly? Tracing Nabot
      'll135-they-called-every-one-of-them-george-the-name-they-took-the-porter-at-the-door-and-the-wage-yahweh-legislated', // Called by the Wrong Name? What the Porter at the Gate Reveals About Be
      'pv-williams', // Destruction From Without and Within: What One Historian Learned About
      'hist6-the-fields-of-the-fatherless', // Who Gleans the Fields When the Fathers Are Gone? The American Record o
    ],
  },
  {
    id: 'truth',
    group: 'Faith & the world',
    title: 'Knowing what is true',
    say: ['what is true', 'truth', 'deception', 'lies', 'misinformation', 'fake news', 'test what i hear', 'discern', 'discernment'],
    flag: 'thin',
    note: 'Four lessons speak to testing what you hear.',
    lessons: [
      'll52-how-a-lie-gets-wired-in-neuroplasticity-memory-and-the-mind-of-christ', // Why Does a Lie Start Sounding Like Truth? How Repetition Works on the
      'll19-not-ignorant-of-his-devices', // Are Your Yeses Being Steered? Five Hidden Persuasion Tactics the Bible
      'insp8-prove-all-things', // Is Checking Everything Really Disloyal? What Acts 17:11 and 2 Kings 22
      'wk3-the-test', // Why Does an AI Answer That Sounds Right Deserve the Most Doubt?
    ],
  },
  {
    id: 'rest',
    group: 'Faith & the world',
    title: 'Needing rest',
    say: ['rest', 'sabbath', 'tired', 'weary', 'never stop working', 'overworked', 'burned'],
    flag: 'thin',
    note: 'Five lessons speak to rest and the Sabbath.',
    lessons: [
      'hl-w3-water-fasting-supervised', // Is Rest Your Missing Remedy? What Mark 6:31 and Proverbs 23 Reveal Abo
      'ea-gh-wait-renew', // Running on Empty? Why the Strength You Need Is Found in Waiting, Not S
      'll2-the-energy-you-were-given', // Is Your Stress Quietly Draining Your Energy Tank? What Scripture and M
      'll243-the-stork-knows-her-appointed-times', // Farmers Are Flooding Fields on Purpose, and Birds Are Returning. Why D
      'mat7-time-and-cycles-sevens-forty-days-and-the-fiftieth-year', // Why Does a Week Have Seven Days, and How Could Daniel Count Seventy Ye
    ],
  },
];
