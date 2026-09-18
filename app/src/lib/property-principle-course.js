// =============================================================================
// property-principle-course — "Why Owned Property Is a Principle"
// =============================================================================
// Darrell asked for a REAL ESTATE department: twenty-two courses, from why owned
// property is a principle through management as stewardship. This is course one,
// and it is deliberately the footing rather than a technique: every course after
// it stands on what Yahweh said about ground, boundaries, price, records, wages
// and inheritance. A department that opened with cash-flow arithmetic would teach
// the trade without the frame, and the frame is the reason this house teaches the
// trade at all.
//
// THE ARC, and it is one argument in eight moves:
//   1. The land is His, and it was given by name (Leviticus 25:23; Numbers 26:55)
//   2. The landmark is a moral object (Deuteronomy 19:14; Proverbs 23:10-11)
//   3. Naboth's vineyard: the process was lawful, the act was murder (1 Kings 21)
//   4. A sale was a lease of years (Leviticus 25:10, 15-16, 25)
//   5. The deed, the witnesses, and the earthen vessel (Jeremiah 32; Ruth 4)
//   6. The field before the house (Proverbs 24:27; Luke 14:28-29; Proverbs 27:23)
//   7. The tenant is a neighbour, and the wage cannot wait (Leviticus 19:13; James 5:4)
//   8. Handed forward, or handed to a fool (Proverbs 13:22; 1 Chronicles 28)
//
// Given → bounded → protected from power → time-limited → documented → costed →
// just → handed forward. Lesson 3 is the procedural centre: Ahab took a vineyard
// through a proclaimed fast, a public assembly and the two witnesses the law
// requires to PROTECT an accused man, and Yahweh charged him with murder anyway.
// That is the test the whole department keeps — not "is this legal?" but "is a
// lawful step here doing the work a threat would otherwise do?"
//
// AGE BANDS FROM THE FIRST COMMIT (DR-0497 / DR-0498). Every lesson carries
// levels.teen and levels.senior, authored rather than re-registered: the teen
// band is written for a young reader who will one day hold the ground, the
// senior band for whoever teaches or operates it. No lesson here is bandless,
// so nothing in this course arrives in the course-band-coverage debt.
//
// VERIFICATION (DR-0076 / SCRIPTURE-REFERENCE-STANDARD). All 105 quoted spans
// were fetched VERBATIM from the repository's own public-domain KJV
// (app/public/bible/kjv/*.json) and are re-pinned by
// property-principle-course.test.js, so a later edit cannot drift the text and
// still ship. Our own prose says Yahweh; the quotations are left exactly as the
// KJV has them, "the LORD" included (DR-0210's bright line).
//
// TEACHING, NOT LEGAL OR FINANCIAL ADVICE — carried on the meta so every surface
// renders the limit with the course. Property law, landlord-tenant law and tax
// treatment are jurisdiction-specific and change; this course teaches the
// principles and what to ask, and a licensed professional in your own state
// handles the instrument, the filing and the return.
// =============================================================================

import {
  buildScheduleFor, progressSummaryFor, exportCurriculumMarkdownFor,
} from './church-classes.js';

export const PROPERTY_PRINCIPLE_CARE_NOTE =
  'Teaching, not legal or financial advice. Property, landlord-tenant and tax rules are specific to your state and they change. Use this course to know the principles and what to ask for; have a licensed attorney, agent or accountant in your own jurisdiction handle the instrument, the filing and the return.';

export const PROPERTY_PRINCIPLE_META = {
  key: 'property-principle',
  title: 'Why Owned Property Is a Principle',
  audience: 'owners, renters, managers, heirs, and the young people who will hold the ground after us \u2014 taught at every age',
  tagline: 'He kept the title and handed out the use. Everything else in this department follows from that.',
  // WORD-FIRST, DECLARED (DR-0127 / DR-0282). Property is charged material, so
  // the course opens under His frame rather than under a market frame. Both
  // spans are VERBATIM from the repo's KJV and pinned in the course test.
  wordFirst: {
    ref: 'Leviticus 25:23; Proverbs 13:22',
    frame: 'Yahweh set the footing before any market did: "The land shall not be sold for ever: for the land is mine; for ye are strangers and sojourners with me." He kept the title and handed out the use, which makes every property rule a moral rule and not merely a commercial one. And He set the AIM three generations out \u2014 "A good man leaveth an inheritance to his children\u2019s children" \u2014 so a holding that dies with the children never reached His target at all.',
  },
  format: 'Self-paced \u00b7 8 lessons \u00b7 read one a week or all in a morning \u00b7 paced to your age',
  cadenceDays: 7,
  weeks: 8,
  handsOnLabel: 'Work it on real property',
  unit: {
    noun: 'lesson',
    nounPlural: 'lessons',
    cap: 'Lesson',
    selfPaced: true,
    sessionLabel: 'How to run it (family table, class, or one-on-one)',
    countNoun: 'lesson',
  },
  blurb: 'The footing under the whole Real Estate department. Yahweh kept the title to the ground and handed out its use, which makes a boundary a moral object, a price a function of remaining years, a tenant a neighbour, and an inheritance a three-generation target. Lesson three is the one that changes how a person operates: Ahab took Naboth\u2019s vineyard through a religious fast, a public assembly and the two witnesses the law requires to protect an accused man \u2014 and heard "Hast thou killed, and also taken possession?" The paperwork was in order and it was still murder. Free, in full, every lesson at two reading levels.',
  care: PROPERTY_PRINCIPLE_CARE_NOTE,
  footer: '_Taught by Darrell Poe \u00b7 the Poe family + The Church of the Living God \u00b7 built on PoeTech. Course one of the Real Estate department. He kept the title; we hold the use, know where the line is, count the cost to finish, pay the worker before sundown, keep the records in the earthen vessel, and hand it to the grandchildren. Teaching, not legal or financial advice._',
};

export const PROPERTY_PRINCIPLE_SESSION_FLOW = [
  { minutes: 5, name: 'Prayer + the anchor' },
  { minutes: 10, name: 'The principle in one sentence' },
  { minutes: 15, name: 'Teach it \u2014 what the Word actually says' },
  { minutes: 20, name: 'Work it on real property' },
  { minutes: 10, name: 'Discussion' },
  { minutes: 5, name: 'Send-off + solo task' },
];
export const PROPERTY_PRINCIPLE_SESSION_MINUTES =
  PROPERTY_PRINCIPLE_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0); // 65

export const PROPERTY_PRINCIPLE_MODULES = [
  {
    id: 'prop1-the-land-is-his-and-it-was-given-by-name',
    title: 'The land is His, and it was given by name',
    bigIdea: 'Owned property is a principle before it is a business, because Yahweh made ownership part of how a family stands. But He did not hand over the deed to the universe. He kept the title and gave the USE: "The land shall not be sold for ever: for the land is mine; for ye are strangers and sojourners with me" (Leviticus 25:23). That single verse is the whole footing of this department. You can own, you can buy, you can build, you can pass it on — and you are a steward of something that is His, which is why every rule that follows is a moral rule and not merely a market one.',
    inApp: 'Name one piece of property you touch — owned, rented, or managed — and write two sentences: what it is FOR, and who it is for. Then say plainly whose it is. If you hold it as an owner, say the sentence out loud: I am a steward of something He kept the title to.',
    anchor: { ref: 'Leviticus 25:23; Numbers 26:55; Joshua 14:9', theme: 'Yahweh keeps the title and hands out the use: "The land shall not be sold for ever: for the land is mine; for ye are strangers and sojourners with me." It was divided by lot, by the names of the tribes, and Caleb was told the ground his feet had trodden would be his inheritance and his children’s.' },
    stories: [
      {
        kind: 'parable', tone: 'light',
        title: 'The Man Who Bought the Sky',
        body: 'Wendell Purdy bought forty acres and immediately had a sign made. PURDY LAND, it said, in letters visible from the county road, and under that, in smaller letters he had argued with the sign man about for twenty minutes: PRIVATE. He walked the fence line every Saturday morning counting what was his. His posts. His pond. His forty acres of sky, which he was fairly sure came with it. One August a hailstorm came through and flattened the corn he had not planted yet, which is to say it flattened the field he had been planning the corn in. Wendell stood in the wreck of it with his hat in his hands and discovered something inconvenient about ownership: the storm had not read his sign. The next spring a surveyor came out to settle a question about the eastern boundary and mentioned, conversationally, that the creek had moved eleven feet since 1974. Wendell said that was impossible, he owned that creek. The surveyor, who had heard this before, said the creek seemed not to have been informed. Wendell sold the sign for scrap that autumn. He kept the forty acres, kept the pond, kept working it better than he ever had. A neighbour asked him once what had changed and Wendell said he had stopped being the owner and started being the man in charge, and honestly, it was a considerable relief. Owners, he said, have to hold the sky up. Stewards just have to show up.',
      },
      {
        kind: 'parable', tone: 'solemn',
        title: 'The Name on the Stone',
        body: 'There is a hill in the county where the old families buried their people, and at the top of it is a flat stone with a name worn nearly off it. The Hadleys owned the bottom land for a hundred and forty years. When the last Hadley sold out, the buyer asked what the stone was and was told it marked the corner of the original grant, and also the grave of the man who received it. Both. The same stone. The buyer thought that was morbid until it was explained to him: the man\'s name was on the deed and on the grave and it was the same name, and that was rather the point. Ground given to a person is not ground given to a market. The buyer put a new fence up and left the stone where it was, though it cost him a survey to work around. His son asked him why, some years later, and he found himself explaining that a parcel with a name on it is a different kind of thing than a parcel with a price on it, and that you can own both but you cannot treat them the same way. The son did not entirely understand. Then the son inherited it, and walked the line himself one cold morning, and found that he did.',
      },
    ],
    benefits: [
      'A settled answer to the question underneath every property decision: the ground is not ultimately yours. That is a relief rather than a demotion, because an owner carries a weight a steward was never asked to carry.',
      'Freedom from the anxiety of absolute ownership. What you hold, you hold on trust and for a term, so a loss is not the end of you and a gain is not the measure of you.',
      'A standard that outranks the market. When the question is what you MAY do with a thing, the answer stops being whatever is legal and profitable and becomes what the Owner intends.',
      'Ground given BY NAME is ground with a person attached to it. That single fact is what makes the rest of this department possible, and it is why a parcel is never merely an asset class.',
      'A reason to steward well that survives a bad year, because faithfulness is measured against the Owner\'s intent rather than against the return.',
    ],
    levels: {
      teen: 'Owning property is not just business. It is one of the ways Yahweh set a family up to stand. But look at what He said about it. "The land shall not be sold for ever: for the land is mine; for ye are strangers and sojourners with me" (Leviticus 25:23). Read that again. The land is HIS. He kept the title. What He handed out was the USE of it. So you can own a house. You can buy it, fix it, rent it out, and leave it to your children. All of that is honest work, and He set it up. You are just not the final owner. You are a steward. A steward takes care of something for someone else. And it was not handed out at random. It was divided by lot, tribe by tribe, "according to the names of the tribes of their fathers" (Numbers 26:55). Real families. Real names. Caleb got a promise in his own name too. Moses told him the ground his feet had walked on would be his, and his children’s. Here is why that matters for you. If the land is His and He handed you the use of it, then every rule about property is a right-and-wrong rule, not just a money rule. That is the whole reason this course exists.',
      senior: 'Start the department here, because the footing decides every later lesson. Yahweh did not transfer the deed of the earth; He retained the title and allotted the USE. "The land shall not be sold for ever: for the land is mine; for ye are strangers and sojourners with me" (Leviticus 25:23). Hold the two halves together rather than choosing one. Private holding is REAL — allotted by lot, recorded by family name (Numbers 26:55), defended by law, inherited by children, and Caleb was given ground in his own name because he "wholly followed the LORD my God" (Joshua 14:9). And it is DERIVATIVE. The owner is described as a stranger and a sojourner with Him, which is a tenancy word applied to the landholder himself. That is not a demotion; it is the source of the owner’s authority and the limit on it in the same sentence. Notice what the frame rules out in both directions. It rules out the absolute dominion that treats a holding as a thing to do exactly as one pleases with, because the title is elsewhere. And it rules out the pious refusal to own anything, because He allotted holdings deliberately, by name, as the footing under a family. So the working question for an owner is never only what the market will bear. It is what the Owner intends this to be for. Every principle in the lessons after this one — the boundary, the jubilee, the just wage, the inheritance — is that question applied to one piece of ground.',
    },
    lesson: 'This department opens on a footing, not a tactic. Owned property is a PRINCIPLE in Scripture: Yahweh built land into how a family stands, eats, works and hands something forward. He allotted it deliberately — "the land shall be divided by lot: according to the names of the tribes of their fathers they shall inherit" (Numbers 26:55) — and He made personal promises about specific ground, as when Moses told Caleb that "the land whereon thy feet have trodden shall be thine inheritance, and thy children’s for ever, because thou hast wholly followed the LORD my God" (Joshua 14:9). Private holding, by name, on purpose. BUT HE KEPT THE TITLE. "The land shall not be sold for ever: for the land is mine; for ye are strangers and sojourners with me" (Leviticus 25:23). The owner is called a stranger and a sojourner — tenancy language, applied to the landholder. That is the sentence this whole department is built on, and it cuts in two directions at once. It cuts against absolute dominion: a holding is not a thing to do purely as one pleases with, because the title is held elsewhere and an account is owed. And it cuts against the false piety that treats ownership itself as worldly: He handed out land on purpose, to families, by name, as the footing under their children. Stewardship is not a smaller kind of ownership; it is ownership with an Owner. Which is why nothing in this department will read like a seminar on extraction. A boundary will turn out to be a moral object. A price will turn out to have a time limit. A tenant will turn out to be a neighbour. A building will turn out to need its cost counted before the first shovel. Those are not soft additions to hard business. They are what property IS, when the One who made the ground is the One who handed you the use of it.',
    quiz: {
      questions: [
        { q: 'Leviticus 25:23 says the land is Yahweh’s. What does that make an owner?', options: ['Not a real owner at all', 'A steward — a real holder of something whose title is His', 'The final owner, free of any account'], answer: 1, explain: 'The holding is real and allotted by name, and the title is His. He calls the landholder a stranger and a sojourner with Him, which is both the source of the owner’s authority and its limit.' },
        { q: 'Why does the footing cut in two directions?', options: ['It only limits owners', 'It only encourages owning', 'It limits absolute dominion AND refuses the idea that owning is worldly'], answer: 2, explain: 'He allotted land to families by name, so owning is His design; He kept the title, so an account is owed. Both halves are in the same passage.' },
      ],
    },
    facilitator: {
      talkingPoints: [
        'Open the department on the footing: Leviticus 25:23 keeps the title with Yahweh and hands out the use.',
        'Private holding is real and deliberate — by lot, by family name (Numbers 26:55), and by personal promise (Joshua 14:9 to Caleb).',
        'The owner is called a stranger and a sojourner: tenancy language applied to the landholder. Authority and limit in one sentence.',
        'The frame cuts both ways — against absolute dominion, and against treating ownership itself as unspiritual.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Leviticus 25:23 slowly, twice. | The footing in a sentence (10): He kept the title and handed out the use. | Teach it (15): the two directions the frame cuts, with Numbers 26:55 and Joshua 14:9 as the evidence that holding is real. | Work it (20): each person names one property they touch, what it is for, and whose it is. | Discussion (10): where have we seen ownership treated as absolute, and where have we seen it treated as unspiritual? | Send-off (5): solo task — write the steward sentence for one property and keep it where you will see it.',
      discussionPrompts: [
        'If the title is His, what changes on Monday about a property you hold?',
        'Where does the church get the idea that owning is worldly, and what does Numbers 26:55 do to it?',
        'What is the piece of ground you would want promised to your children by name?',
      ],
    },
  },
  {
    id: 'prop2-the-landmark-is-a-moral-object',
    title: 'The landmark is a moral object',
    bigIdea: 'A property line is not a surveying detail. It is a moral object, protected by commandment: "Thou shalt not remove thy neighbour’s landmark, which they of old time have set in thine inheritance" (Deuteronomy 19:14). Moving a stone a few feet in the night is theft that leaves no broken lock and no missing item — which is exactly why it needed its own law. And the Word names the likeliest victim out loud: "Remove not the old landmark; and enter not into the fields of the fatherless" (Proverbs 23:10), with the answer in the next breath — "For their redeemer is mighty; he shall plead their cause with thee" (Proverbs 23:11).',
    inApp: 'Find the real boundary of one property you touch — the plat, the survey, the fence line, the lease’s description of what is rented. Write down where the documented line is and where the ASSUMED line is. If they differ, that gap is the work, and it gets a date.',
    anchor: { ref: 'Deuteronomy 19:14; Proverbs 22:28; Proverbs 23:10, 11; Hosea 5:10', theme: '"Thou shalt not remove thy neighbour’s landmark, which they of old time have set in thine inheritance." The boundary is protected by commandment, the fatherless field is named specifically, and the princes who removed the bound drew wrath.' },
    stories: [
      {
        kind: 'parable', tone: 'light',
        title: 'Six Inches a Year',
        body: 'Harold mowed right up to the fence, and then a little past it, because the grass on the other side was untidy and it bothered him. Mr Achebe next door never said a word. The following spring Harold replaced a leaning post and set it, by pure coincidence, four inches into the untidy side. Still nothing. The year after, a shed. A small one. Then a row of arbor vitae, which everyone agreed looked much better than what had been there. Eleven years later Harold\'s grandson sold the house, and the survey came back showing the property line running directly through the middle of the shed and out the far side of the third arbor vitae. The closing was delayed nine weeks. Lawyers were involved. The grandson, who had never moved anything in his life, paid for all of it and spent those nine weeks explaining to a stranger that he had not stolen anything, which was entirely true and entirely useless. At no point in eleven years had Harold done a wrong thing. He had done forty small reasonable things, each one defensible on its own, each one four inches. Mr Achebe\'s daughter, who by then owned the untidy side, was perfectly nice about it. She said her father had noticed every single time and had decided each one was too small to make a fuss over. That, she said, had been his mistake, and she had learned from it.',
      },
      {
        kind: 'parable', tone: 'sober',
        title: 'The Surveyor Who Would Not Round',
        body: 'Priya had a reputation among the builders for being difficult, which she had earned by refusing to write down numbers she had not measured. A developer asked her once to call a line straight that bowed by a foot and a half over three hundred yards. Nobody will ever know, he said, and he was probably right. She said the fence would know, and the next surveyor would know, and in about forty years somebody\'s grandchildren would know, at considerable expense, and she would rather they knew now for free. She lost that contract. She lost two more the same year for the same reason and there was a winter where she seriously considered doing something else. Then a title company started sending her every disputed boundary in three counties, because her drawings were the only ones the courts stopped arguing about. She was not vindicated all at once. It took about six years, and there was no moment where anybody apologised. But she noticed, eventually, that she had built a business on the single fact that her lines were where she said they were. Her nephew asked her what the trick was. She said there was no trick. She said a boundary is not a number, it is a promise about where a thing ends, and a person who will shade a promise by a foot and a half will shade other things too, and everyone finds that out sooner or later.',
      },
    ],
    benefits: [
      'A name for the small, deniable theft: a boundary moved an inch at a time, where no single move looks like a crime and the pattern is one.',
      'Protection for your own conscience. A man who will not move a landmark never has to remember which version of the boundary he told to whom.',
      'A test you can apply to survey lines, fence placements, shared drives and easements, which are the modern landmarks and the ones most often quietly adjusted.',
      'Standing to refuse a profitable ambiguity, because the Word treats the marker itself as a moral object rather than as a technicality to be lawyered.',
      'A cleaner inheritance: boundaries you never touched are boundaries your children never have to defend.',
    ],
    levels: {
      teen: 'A property line has its own commandment. That should tell you something. "Thou shalt not remove thy neighbour’s landmark, which they of old time have set in thine inheritance" (Deuteronomy 19:14). Back then a boundary was a stone in the ground. Move it a few feet at night and you just stole part of a farm. No broken door. No missing thing anyone can point at. The field simply got smaller and the thief looks like a neighbour. That is why it needed a law of its own. Some theft does not look like theft. Now look at who the Word warns about most. "Remove not the old landmark; and enter not into the fields of the fatherless" (Proverbs 23:10). The fatherless. The kid with no dad to walk the fence line and argue. The one who cannot fight back. And then the very next line: "For their redeemer is mighty; he shall plead their cause with thee" (Proverbs 23:11). They have no one, so Yahweh takes the case Himself. The leaders of Judah did it anyway, and Hosea says the wrath came out on them like water. For you, today, the stone is a lease, a fence, a survey, a promise you made. Know where the real line is, and leave it alone.',
      senior: 'Teach this lesson as a class of theft, because that is what makes it useful. Boundary theft is the crime that leaves no evidence of a crime: nothing is broken, nothing is carried away, and the offender is standing on his own land when he does it. Yahweh gave it a commandment of its own precisely because ordinary prohibitions on stealing would not reach it: "Thou shalt not remove thy neighbour’s landmark, which they of old time have set in thine inheritance" (Deuteronomy 19:14). Note the phrase "of old time have set". The line carries authority because it was established and inherited, not because the current holder likes where it falls. Then note who Proverbs names. "Remove not the old landmark; and enter not into the fields of the fatherless" (Proverbs 23:10). The exposure is not random; encroachment travels toward whoever cannot litigate. And the enforcement named is not a court: "For their redeemer is mighty; he shall plead their cause with thee" (Proverbs 23:11). The counterparty changes when the victim is defenceless. Hosea 5:10 proves the principle reaches upward: the princes of Judah were "like them that remove the bound", and wrath followed the office rather than excusing it. The operator’s application is exact. Modern landmarks are recorded: the plat, the legal description, the lease’s statement of what is rented, the fee schedule, the notice period. Quietly restating any of those in your own favour, against a party who will not read closely, is this sin in current dress — and the redeemer of the unlettered party is still mighty.',
    },
    lesson: 'Property lines have their own commandment, and it is worth asking why. "Thou shalt not remove thy neighbour’s landmark, which they of old time have set in thine inheritance, which thou shalt inherit in the land that the LORD thy God giveth thee to possess it" (Deuteronomy 19:14). Proverbs repeats it as a standing rule: "Remove not the ancient landmark, which thy fathers have set" (Proverbs 22:28). THE REASON IS THE SHAPE OF THE CRIME. Boundary theft leaves no evidence that a theft occurred. Nothing is forced, nothing is carried off, and the man doing it is standing on land that really is his while he does it. The field simply becomes smaller, the record still looks orderly, and the loss is discovered years later by someone with no way to prove what used to be true. A commandment against stealing in general does not reach that. This one does. THEN THE WORD NAMES THE LIKELIEST VICTIM. "Remove not the old landmark; and enter not into the fields of the fatherless" (Proverbs 23:10). Encroachment is not distributed evenly; it travels toward whoever cannot afford to fight. And the answer arrives in the same breath, which changes who the offender is actually dealing with: "For their redeemer is mighty; he shall plead their cause with thee" (Proverbs 23:11). AND IT REACHES UPWARD. Hosea says the princes of Judah "were like them that remove the bound: therefore I will pour out my wrath upon them like water" (Hosea 5:10) — authority did not excuse it; the office made it worse. NOW BRING IT FORWARD, because this is the most portable principle in the department. Today the landmark is written rather than buried: the plat and legal description, the survey, the lease’s statement of exactly what is rented, the fee schedule, the notice period, the line in an agreement everyone signed. Restating any of those quietly, in your own favour, against a party who will not read closely, is the same sin in current dress. Know where the real line is. Then leave it where the fathers set it.',
    quiz: {
      questions: [
        { q: 'Why did boundary theft need a commandment of its own?', options: ['Because land was the only valuable thing', 'Because it leaves no evidence a theft occurred — nothing broken, nothing carried away', 'Because surveyors were dishonest'], answer: 1, explain: 'The offender stands on his own land, nothing is forced, and the record still looks orderly. A general rule against stealing does not reach it, so it got its own law.' },
        { q: 'Proverbs 23:10 names the fields of the fatherless. What does verse 11 add?', options: ['That the courts will handle it', 'That their redeemer is mighty and will plead their cause', 'That the fatherless should move away'], answer: 1, explain: 'When the victim cannot litigate, the counterparty changes: He takes the case Himself.' },
      ],
    },
    facilitator: {
      talkingPoints: [
        'A property line carries its own commandment (Deuteronomy 19:14) because the crime leaves no trace of a crime.',
        '"Of old time have set" — the line has authority because it was established and inherited, not because the holder likes it.',
        'Proverbs 23:10-11 names the fatherless and then names the redeemer: encroachment travels toward whoever cannot fight.',
        'Hosea 5:10 — the princes did it too, and the office made it worse rather than excusing it.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Deuteronomy 19:14. | The crime in a sentence (10): theft that leaves no evidence of theft. | Teach it (15): why it needed its own law, then Proverbs 23:10-11 and Hosea 5:10. | Work it (20): pull the real boundary of one property — plat, survey, lease description — and compare documented to assumed. | Discussion (10): which of our written landmarks could be restated in our favour without anyone noticing? | Send-off (5): solo task — read one agreement you are party to and find its boundary sentence.',
      discussionPrompts: [
        'What are the written landmarks in a lease, and which one is easiest to move quietly?',
        'Who is the fatherless party in our dealings — the one who will not read closely?',
        'Hosea says the princes did it. Why is authority an aggravation rather than a defence?',
      ],
    },
  },
  {
    id: 'prop3-naboths-vineyard-when-the-process-is-lawful-and-the-act-is-murder',
    title: 'Naboth’s vineyard: the process was lawful, the act was murder',
    bigIdea: 'A king offered a fair price for a vineyard and was refused, because the ground was not merely an asset: "The LORD forbid it me, that I should give the inheritance of my fathers unto thee" (1 Kings 21:3). What followed is the most important procedural lesson in this department. Ahab did not seize it. A fast was proclaimed, an assembly convened, Naboth seated in a place of honour, two witnesses produced, a verdict reached, a sentence carried out — every step with a form to it. Then Yahweh’s sentence on the whole procedure: "Hast thou killed, and also taken possession?" (1 Kings 21:19). The paperwork was in order and it was still murder.',
    inApp: 'Take one deal or one action you could take legally right now against a weaker party. Write the steps out. Then ask the Naboth question about each: is any step here doing the work that a threat would do? If yes, the form is carrying the violence, and the form is not a defence.',
    anchor: { ref: '1 Kings 21:3, 4, 19; Micah 2:1, 2; Isaiah 5:8', theme: '"The LORD forbid it me, that I should give the inheritance of my fathers unto thee." A king wanted a garden, used a fast, a public assembly and two witnesses to get it, and heard: "Hast thou killed, and also taken possession?"' },
    stories: [
      {
        kind: 'parable', tone: 'solemn',
        title: 'Everything in Order',
        body: 'The file was immaculate. That was what the young lawyer kept coming back to, months afterward, when she could not sleep. Notice had been served, correctly, at the correct address, with proof of mailing. The hearing had been scheduled with statutory margin. Two witnesses had testified, and neither of them had said anything untrue in the narrow sense. The commissioners had voted in open session with the minutes recorded. Every box had been ticked and every date had been met and the old man had lost the house his father built, and there was not one single page in that file she could point to and say: here, this is where it went wrong. She went through it again in December looking for the flaw, because there had to be a flaw, and what she found instead was worse. There was no flaw. The procedure had worked exactly as designed. It was simply that somebody had decided at the beginning what the outcome would be, and then had used a perfectly good process to arrive there, the way you might use a perfectly good hammer. She left that office in the spring. Her supervisor said she was being naive, that nothing improper had occurred, and he was right about that, and she told him so. She said that was the part that frightened her. A thing can be done entirely by the book and still be a taking, and the book will not tell you, because the book is not what is wrong.',
      },
      {
        kind: 'parable', tone: 'solemn',
        title: 'The One Who Would Not Sell',
        body: 'Everyone in the family had an opinion about Aunt Teodora, and most of the opinions were that she was being unreasonable. The offer was generous. It was, by any measure anybody could produce, more than the land was worth. Her nephews came out one at a time with figures on paper, and she made each of them coffee and listened to the whole presentation and then said no, and would not say why in terms any of them found satisfying. She said it had been given. Given by whom, they asked, and she said by the One who gives land, and to whom, and she said to her grandfather, by name, in 1911, and that seemed to her to settle it. The nephews found this maddening. One of them said the land did not know it had been given. She agreed that it did not. She said that she knew, and that somebody in the family had to, or in two generations nobody would. She died at ninety-one and left it to the grandniece who had never once asked her to sell. At the funeral the nephews were gracious and a little embarrassed, and one of them admitted quietly, standing at the edge of that field, that he was not sure any more whether she had been stubborn or whether she had simply been the only one of them still holding on to the end of a rope the rest had let go of.',
      },
    ],
    benefits: [
      'The sharpest warning in the department: every step that took Naboth\'s vineyard wore a lawful form, and the whole of it was still murder and theft.',
      'An eye for the defect no single step reveals. The assembly, the witnesses, the verdict were each procedurally correct, and the sum was a killing.',
      'Freedom from the excuse that legality settles a question. A process can be followed exactly and still arrive somewhere Yahweh calls blood.',
      'Courage to be Naboth. Refusing to sell an inheritance is not stubbornness when the ground was given by name.',
      'A caution for anyone with the power to convene a process, because the ability to run the procedure is precisely what makes abusing it possible.',
    ],
    levels: {
      teen: 'A king wanted a vineyard next to his palace. He offered to buy it, and he offered a fair price. The owner said no. And listen to his reason: "The LORD forbid it me, that I should give the inheritance of my fathers unto thee" (1 Kings 21:3). It was not about the money. It was his family’s land. So the king went home and sulked on his bed. Then his wife handled it — and here is the part you have to see. They did not send soldiers. They called a religious fast. They held a public meeting. They sat Naboth up front where important people sit. They brought two witnesses to lie about him. A court heard it. A sentence was given. Naboth was killed. Every single step had a proper form. It looked like law the whole way through. Then Yahweh sent a prophet with one question: "Hast thou killed, and also taken possession?" (1 Kings 21:19). He did not ask whether the trial was correct. He named what actually happened. So here is the test you keep for life. Legal is not the same as right. If you can do it legally, and it still crushes somebody who could not stop you, it is Naboth’s vineyard with new paperwork.',
      senior: 'This is the procedural centre of the department, and it must be taught as procedure rather than as a story about a wicked king. Begin with the refusal, because it establishes what was at stake: "The LORD forbid it me, that I should give the inheritance of my fathers unto thee" (1 Kings 21:3). Naboth is not holding out for a better number; he is declining to convert an inheritance into cash, which the Leviticus 25 frame makes an entirely defensible position. The offer itself was not wicked. The response to refusal was. Now teach the mechanism, step by step, because every step had a FORM: a proclaimed fast, a public assembly, the accused seated in the high place, two witnesses as the law required, a charge, a verdict, an execution. Consider what that means. The requirement of two witnesses, which exists to PROTECT the accused, was the instrument of his death. A procedural safeguard, satisfied exactly, produced murder. Then hear the charge Yahweh actually files: "Hast thou killed, and also taken possession?" (1 Kings 21:19). He does not litigate the trial. He names the substance and ignores the wrapper. Micah generalises it for operators: they "covet fields, and take them by violence; and houses, and take them away: so they oppress a man and his house, even a man and his heritage" (Micah 2:2). Isaiah adds the accumulation version — "Woe unto them that join house to house, that lay field to field, till there be no place" (Isaiah 5:8). The standing test: when a lawful step is doing the work a threat would otherwise do, the form is carrying the violence, and the form is no defence.',
    },
    lesson: 'A king wanted the vineyard beside his palace and offered to buy it. The owner refused, and the reason is the hinge of the whole account: "The LORD forbid it me, that I should give the inheritance of my fathers unto thee" (1 Kings 21:3). That is not a negotiating posture. Under the frame this department opened with, an inheritance is not simply an asset to be converted at the right number, and Naboth’s refusal was defensible. Ahab went home "heavy and displeased" and "laid him down upon his bed, and turned away his face, and would eat no bread" (1 Kings 21:4) — a king sulking over a garden. NOW WATCH THE METHOD, because this is why the account is in the department at all. Nobody sent soldiers. A fast was proclaimed. A public assembly was convened. Naboth was seated in the high place, among the honoured. Two witnesses were produced — satisfying the legal requirement that exists to PROTECT an accused man. A charge was heard, a verdict reached, a sentence executed. Every step had a recognizable form, and a bystander reading the minutes would have found a religious observance and a lawful proceeding. Then the word arrives, and it does not litigate the trial: "Hast thou killed, and also taken possession?" (1 Kings 21:19). Yahweh names the substance and ignores the wrapper entirely. The paperwork was in order and it was still murder. MICAH GENERALISES IT for anyone who deals in property: "they covet fields, and take them by violence; and houses, and take them away: so they oppress a man and his house, even a man and his heritage" (Micah 2:2) — and notice the sequence in the verse before, where the scheme is devised "upon their beds" and practised in the morning "because it is in the power of their hand" (Micah 2:1). Capability becomes permission overnight. Isaiah names the quieter version, where nothing is stolen at all and everything is bought: "Woe unto them that join house to house, that lay field to field, till there be no place" (Isaiah 5:8). SO HERE IS THE TEST THIS DEPARTMENT KEEPS. Not "is this legal?" but: is a lawful step here doing the work that a threat would otherwise do? A fee timed to catch someone who cannot pay it. A notice served on the one day it cannot be answered. A clause written to be misread. When the form is carrying the violence, the form is not a defence — it is the evidence.',
    quiz: {
      questions: [
        { q: 'What is procedurally startling about how Naboth’s vineyard was taken?', options: ['It was seized by force with no pretence', 'Every step had a lawful form — including the two witnesses that exist to protect the accused', 'No one was ever told about it'], answer: 1, explain: 'A fast, an assembly, the high place, two witnesses, a verdict. The safeguard itself became the instrument, which is why "it was legal" cannot be a defence.' },
        { q: 'Yahweh’s question was "Hast thou killed, and also taken possession?" What does that show?', options: ['He reviewed the trial and found an error', 'He names the substance and ignores the wrapper', 'He was concerned only with the property'], answer: 1, explain: 'He does not litigate the procedure at all. The charge is what actually happened, which is the test an operator keeps.' },
      ],
    },
    facilitator: {
      talkingPoints: [
        'Naboth’s refusal was defensible: an inheritance is not merely an asset to convert (1 Kings 21:3, read with Leviticus 25:23).',
        'Teach the METHOD step by step — fast, assembly, high place, two witnesses, verdict. Every step had a form.',
        'The two-witness safeguard, satisfied exactly, produced a murder. A satisfied procedure is not a clean conscience.',
        'Yahweh files the charge on substance: "Hast thou killed, and also taken possession?" Micah 2:1-2 and Isaiah 5:8 generalise it.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read 1 Kings 21:1-4. | The refusal (10): why Naboth could say no. | Teach the method (20): walk the steps and name the form each one wore; then read 1 Kings 21:19. | Work it (20): each person writes one legal action they could take against a weaker party, and applies the Naboth question to every step. | Discussion (10): where does capability quietly become permission for us? | Send-off (5): solo task — find one clause in our own documents written to be misread, and flag it.',
      discussionPrompts: [
        'Micah says they practise it in the morning "because it is in the power of their hand." Where does our power become our permission?',
        'Isaiah 5:8 condemns joining house to house with nothing stolen. Where is the line between building and engrossing?',
        'Which of our own steps would survive the question Yahweh actually asked?',
      ],
    },
  },
  {
    id: 'prop4-a-sale-was-a-lease-of-years',
    title: 'A sale was a lease of years',
    bigIdea: 'In Israel a land sale was not permanent. The fiftieth year returned every family to its holding — "ye shall return every man unto his possession, and ye shall return every man unto his family" (Leviticus 25:10) — so what changed hands was never the ground itself but the HARVESTS until the jubilee. And the pricing rule says so out loud: "According to the multitude of years thou shalt increase the price thereof, and according to the fewness of years thou shalt diminish the price of it" (Leviticus 25:16). That is a lease, priced by remaining term. It is also the oldest valuation formula in the world, and it is still how an income property is actually worth anything.',
    inApp: 'Take one property you touch and write its term honestly: how many years of income are you actually buying or selling here, and what happens at the end of them? If you cannot say the number, you do not yet know the price — and that is the work.',
    anchor: { ref: 'Leviticus 25:10, 15, 16, 25', theme: '"Ye shall return every man unto his possession." The price was set by the number of harvests left before the jubilee — more years, more price; fewer years, less — and a poor brother’s land could be redeemed by his kin.' },
    stories: [
      {
        kind: 'parable', tone: 'light',
        title: 'Forever, More or Less',
        body: 'The brochure said FOREVER HOME in a font that cost somebody money. Dele read it twice on the drive out, mostly because his wife kept reading it aloud in the voice she used for advertising. The agent showed them the kitchen, the light in the afternoon, the tree, and then said the word forever four more times, and Dele found himself doing arithmetic instead of feeling anything. The roof had eleven years in it. The boiler had six, optimistically. The neighbourhood had maybe fifteen before the bypass came through, which the county had published and nobody at the open house had mentioned. Forever, it turned out, was a stack of numbers of wildly different sizes, and the smallest one governed. They bought it anyway, and lived there eighteen happy years, and the tree was as good as advertised. But Dele had priced it as eighteen years and change rather than as forever, and when they sold it the sale was boring, which he considered a tremendous compliment to his younger self. His son asked him once what the secret was to buying a house. Dele said there was no secret, there was only a question, and the question was never what is this worth. The question was how many years are actually left in it, and the answer was always a number, and the brochure would never be the one to tell you.',
      },
      {
        kind: 'parable', tone: 'sober',
        title: 'The Man Who Sold the Harvests',
        body: 'When Mr Ferreira sold the orchard, the buyer kept saying he was buying the orchard, and Mr Ferreira kept correcting him, which the buyer found tiresome. You are buying the apples, he said. Twenty-two years of apples, less the four bad years in there somewhere, and I cannot tell you which four. The buyer said he understood perfectly and clearly did not. The trees were thirty-one years old. Everyone knew what that meant and only one of them had priced it. Nine years later the buyer telephoned, angry, to say the yield had fallen off a cliff and he had been misled. Mr Ferreira, who was very old by then, said he had not been misled, he had been told, and there was a difference. He said the trouble was that the buyer had bought a thing and he had sold a period of time, and they had shaken hands on completely different transactions in the same afternoon. He was not unkind about it. He offered to come out and walk the rows and show the man which blocks had another decade in them and which were finished, and he did, and they replanted the north end together that autumn. But he never stopped saying it. Land does not sell itself to you. It rents you its remaining years, and the only question that ever mattered was how many of them were left.',
      },
    ],
    benefits: [
      'A correction that reframes every transaction: what changed hands in Scripture was a count of harvests, not a permanent title.',
      'A sharper sense of what you are actually buying, which is a stream of years priced by how many remain. That is how a sound valuation still works.',
      'Protection from overpaying for permanence you will not get, and from selling cheaply what had more years in it than you counted.',
      'A frame that makes term, timing and remaining life the honest questions in a deal rather than an afterthought.',
      'Less romance and more arithmetic, in a market that sells permanence it cannot deliver.',
    ],
    levels: {
      teen: 'In Israel you could sell your land. You just could not sell it for ever. Every fiftieth year was the jubilee, and here is what happened: "ye shall return every man unto his possession, and ye shall return every man unto his family" (Leviticus 25:10). Families went home. The land went back. So think about what you were actually buying when you bought a field. Not the dirt. The HARVESTS between now and the jubilee. And the price rule says exactly that. More years left, higher price. Fewer years left, lower price. "According to the multitude of years thou shalt increase the price thereof, and according to the fewness of years thou shalt diminish the price of it" (Leviticus 25:16). That is a lease. Yahweh wrote lease math into the law thousands of years ago. There was also a rescue built in. If your brother got poor and had to sell, a relative could buy it back for him. Here is what it teaches you. Money from property is TIME. Count the years and you know the price. And nobody in that system could be permanently locked out. The clock always ran toward them getting their family land back. Now use it on something real. Say a house rents for a certain amount each month. Ask how many months are actually left on that lease. Ask what happens when it ends. Those two answers are most of what the place is worth right now. People skip that. They pay a price because someone told them the price. Then the years run out and the money stops, and they are surprised by arithmetic they never did. Do the arithmetic. Count the years first, then talk about the price.',
      senior: 'Teach this lesson as valuation, because that is what it is, and the class will remember the principle long after it forgets the chapter. The jubilee returns every family to its holding: "ye shall return every man unto his possession, and ye shall return every man unto his family" (Leviticus 25:10). Therefore permanent alienation of land was impossible, and what a buyer acquired was a defined stream of harvests. Then read the instruction on price. "According to the number of years after the jubile thou shalt buy of thy neighbour, and according unto the number of years of the fruits he shall sell unto thee" (Leviticus 25:15). And the symmetry: "According to the multitude of years thou shalt increase the price thereof, and according to the fewness of years thou shalt diminish the price of it" (Leviticus 25:16). That is a term-limited income instrument priced by its remaining term, written into law long before anyone spoke of a capitalisation rate. The modern operator is doing the same arithmetic with worse language. Two consequences worth stating precisely. First, a price detached from the remaining income term is not a price, it is a wager — and the law forbade the wager by fixing the method. Second, the buyer and seller were held to the SAME formula, which removes the information advantage that most bad property deals actually run on. Then the redemption provision: "If thy brother be waxen poor, and hath sold away some of his possession, and if any of his kin come to redeem it, then shall he redeem that which his brother sold" (Leviticus 25:25). A family’s loss was reversible by a relative with means, which is the next lesson’s subject. The pastoral edge: this system made no one permanently landless. Whatever a modern house can do within its own means, it should aim at that.',
    },
    lesson: 'Israel had a property market, and it had a clock. Every fiftieth year was declared: "ye shall hallow the fiftieth year, and proclaim liberty throughout all the land unto all the inhabitants thereof: it shall be a jubile unto you; and ye shall return every man unto his possession, and ye shall return every man unto his family" (Leviticus 25:10). Families went back to their holdings. Which means permanent sale of land was not merely discouraged — it was impossible. So what did a buyer actually buy? THE HARVESTS. Not the ground; the crops between the purchase and the jubilee. And Yahweh did not leave that implied, He wrote the pricing method: "According to the number of years after the jubile thou shalt buy of thy neighbour, and according unto the number of years of the fruits he shall sell unto thee" (Leviticus 25:15), with the symmetry stated plainly — "According to the multitude of years thou shalt increase the price thereof, and according to the fewness of years thou shalt diminish the price of it: for according to the number of the years of the fruits doth he sell unto thee" (Leviticus 25:16). Read that as an operator and it is startling. It is a term-limited income instrument, priced by remaining term, thousands of years before anyone said "cap rate". An income property today is worth what its remaining years of net income are worth, and a price that floats free of that number is not a valuation, it is a wager on the next buyer. The law simply closed that door by fixing the method — and, critically, by fixing it for BOTH sides. Buyer and seller counted the same years by the same rule, which removes the information asymmetry that most bad property deals actually live on. THEN THE RESCUE CLAUSE. "If thy brother be waxen poor, and hath sold away some of his possession, and if any of his kin come to redeem it, then shall he redeem that which his brother sold" (Leviticus 25:25). A family that lost ground to hard years had a path back that did not depend on the buyer’s goodwill. Put the two together and you have the shape of the whole thing: prices honest because they are time-bound, and losses reversible because a kinsman may step in. No one in that system was permanently landless. A house that operates property today cannot legislate a jubilee, but it can refuse to price a wager, tell both sides the same number of years, and keep a door open for the brother who fell behind.',
    quiz: {
      questions: [
        { q: 'Under the jubilee frame, what did a buyer of land actually acquire?', options: ['The ground for ever', 'The harvests between the purchase and the jubilee', 'A right to evict the family'], answer: 1, explain: 'The fiftieth year returned every family to its possession, so what changed hands was a defined stream of years — a lease priced by remaining term.' },
        { q: 'Leviticus 25:16 sets price by the number of years. What does that make a price with no term behind it?', options: ['A valuation', 'A wager on the next buyer', 'A blessing'], answer: 1, explain: 'The law fixed the method for both sides, which is exactly what removes the information advantage bad deals run on.' },
      ],
    },
    facilitator: {
      talkingPoints: [
        'The jubilee made permanent alienation impossible, so every sale was a term of harvests (Leviticus 25:10).',
        'Leviticus 25:15-16 is a pricing formula: more years, more price; fewer years, less. A cap rate with older words.',
        'The formula binds BOTH sides — which removes the information advantage most bad property deals live on.',
        'Leviticus 25:25 keeps loss reversible: a kinsman may redeem what a poor brother sold.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Leviticus 25:10. | The idea in a sentence (10): a sale was a lease of years. | Teach it (15): walk verses 15-16 as a pricing rule, then name the modern equivalent. | Work it (20): write the honest term of one property — how many years of income, and what happens after. | Discussion (10): where do we price a wager instead of a term? | Send-off (5): solo task — find the remaining term on one real agreement and write the number down.',
      discussionPrompts: [
        'What is the remaining income term of the property you know best, and how do you know?',
        'The formula bound buyer and seller alike. What would it cost us to tell the other side the same number?',
        'We cannot legislate a jubilee. What door can we actually keep open for a brother who fell behind?',
      ],
    },
  },
  {
    id: 'prop5-the-deed-the-witnesses-and-the-earthen-vessel',
    title: 'The deed, the witnesses, and the earthen vessel',
    bigIdea: 'Jeremiah bought a field while the Babylonian army was camped outside the city, and Scripture records the closing in procedural detail: "And I subscribed the evidence, and sealed it, and took witnesses, and weighed him the money in the balances" (Jeremiah 32:10). Two copies were made, one sealed and one open, and both were put "in an earthen vessel, that they may continue many days" (Jeremiah 32:14). The reason was not caution but faith: "Houses and fields and vineyards shall be possessed again in this land" (Jeremiah 32:15). Careful records are how hope is made legible to the next generation.',
    inApp: 'Pick one property interest you hold and find its documents. Where is the deed, the lease, the title work, the survey, the payment record? Name the place. If the answer is "somewhere", that is the finding — build the earthen vessel: one location, two copies, a name on who keeps it.',
    anchor: { ref: 'Jeremiah 32:10, 14, 15; Ruth 4:7, 9', theme: '"And I subscribed the evidence, and sealed it, and took witnesses, and weighed him the money in the balances." A prophet bought a field during a siege, kept a sealed copy and an open copy, and was told: "Houses and fields and vineyards shall be possessed again in this land."' },
    stories: [
      {
        kind: 'parable', tone: 'light',
        title: 'Everybody Knew',
        body: 'The arrangement was perfectly clear. Uncle Sam farmed the bottom forty and Aunt Ruthie\'s side got the timber, and in exchange Sam kept the equipment shed and paid the taxes on the whole parcel, and everybody knew this. That phrase did a great deal of work for about thirty years. Everybody knew. It was said at Thanksgiving with total confidence by people who, it later emerged, knew four subtly different versions of it. The trouble surfaced at a funeral, as these things do, when a cousin mentioned the equipment shed in a tone that a different cousin found surprising. Within a month there were three accounts of the original agreement, all sincere, all remembered clearly, and all incompatible in the specific place where money lived. A lawyer was retained. Then two. The bottom forty was eventually sold to pay for the disagreement about the bottom forty, which everyone agreed afterward was a shame and nobody had been able to stop. At the very end of it a great-nephew found a shoebox in a closet containing a receipt, a hand-drawn map, and a note in pencil signed by both of them in 1961. It settled everything in about forty seconds. It had been in the closet the entire time and nobody had thought to look, because everybody knew.',
      },
      {
        kind: 'parable', tone: 'hopeful',
        title: 'The Jar in the Wall',
        body: 'Marisol bought a field in a year when nobody was buying fields. The town was losing people. The school had gone from three buildings to one and there was open talk of closing that. Her brother told her plainly that she was buying a hole to put money in, and he was not being cruel, he was reading the same newspaper everyone else was reading. She bought it anyway. Then she did the part he really did not understand: she had the deed recorded, and the survey filed, and she paid a notary she did not need to pay, and she put the whole packet in a sealed tin and set it in the block wall of the barn behind a loose stone, and told exactly two people where it was. Her brother asked who on earth she thought was going to want any of this. She said she had no idea, and that this was precisely why she was writing it down. Twenty-six years later the town did not close. It did not boom either, it simply held, the way places sometimes do for no reason anyone can put in a report. Her granddaughter pulled the tin out of the wall on a Tuesday, and every line of it was legible, and the boundary was exactly where the paper said it was. There was no dispute. There was nothing to dispute. That was the whole inheritance, and it had cost a notary fee and one loose stone.',
      },
    ],
    benefits: [
      'A model for record-keeping that has outlasted every filing system since: signed, sealed, witnessed, and put somewhere it would survive.',
      'Confidence that your arrangements can be proved after you, by an heir, a court or a neighbour, without depending on anybody\'s memory.',
      'Protection against the most common failure in family property, which is that everyone knew the arrangement and nobody wrote it down.',
      'A reason to spend the small effort now: Jeremiah bought and recorded a field in a country about to fall, on the strength of a promise.',
      'Peace about the long horizon. Records kept well are an act of faith that there will be someone to read them.',
    ],
    levels: {
      teen: 'An enemy army was camped outside the city. The city was about to fall. Everyone knew it. And Yahweh told Jeremiah to buy a field. So he did. And look at how carefully the Bible writes down what he did next: "And I subscribed the evidence, and sealed it, and took witnesses, and weighed him the money in the balances" (Jeremiah 32:10). He signed it. He sealed it. He brought witnesses. He weighed the silver in front of them. Then he made two copies. One sealed shut, one left open to read. And he put them in a clay jar, "that they may continue many days" (Jeremiah 32:14). A clay jar was the safe-deposit box of the ancient world. Documents in a sealed jar last a very long time. Why go to all that trouble for a field he might never farm? Because of the promise: "Houses and fields and vineyards shall be possessed again in this land" (Jeremiah 32:15). The paperwork WAS the faith. He was keeping a record for a grandchild who would come home. Boaz did the same kind of thing at the town gate: he bought the family land in front of the elders and said out loud, "Ye are witnesses this day" (Ruth 4:9). So keep your papers. Know where they are. That is not boring. That is how you hand something forward.',
      senior: 'This lesson is where documentation stops being administration and becomes a spiritual act, and the class will not forget it if the setting is taught properly. The siege is the setting. Jerusalem was surrounded, the outcome was known, and land in Judah was the worst asset on earth that week. Yahweh instructed a purchase anyway. Then observe how much space Scripture gives the CLOSING: "And I subscribed the evidence, and sealed it, and took witnesses, and weighed him the money in the balances" (Jeremiah 32:10). Signature, seal, witnesses, and consideration weighed publicly. Four elements, and a modern conveyance still has all four under different names. The two-copy practice deserves its own minute. One instrument sealed for preservation, one left open for reading — an archival copy and a working copy — both stored "in an earthen vessel, that they may continue many days" (Jeremiah 32:14). That is records retention with a stated horizon: many days, not this quarter. And the motive is explicitly hope: "Houses and fields and vineyards shall be possessed again in this land" (Jeremiah 32:15), later expanded to men buying fields and subscribing evidences again throughout the land (Jeremiah 32:44). The record exists for people not yet born. Ruth 4 supplies the public half of the same discipline: the transaction at the gate, before elders, with the old custom of the shoe as "a testimony in Israel" (Ruth 4:7), and Boaz’s twice-repeated declaration, "Ye are witnesses this day" (Ruth 4:9). So the operator’s standard is not "we have the file somewhere". It is: named custodian, archival and working copies, witnessed execution, consideration documented, retention measured in generations.',
    },
    lesson: 'The Babylonian army was outside the walls and the city was going to fall. That is the week Yahweh told Jeremiah to buy a field from his cousin. And Scripture spends its words not on the prophecy but on the CLOSING: "And I subscribed the evidence, and sealed it, and took witnesses, and weighed him the money in the balances" (Jeremiah 32:10). Signed, sealed, witnessed, and the silver weighed in public. Four elements, and every one of them survives in a modern conveyance under a newer name. Then the archival instruction: two instruments were made, one sealed and one open, and the word came — "Take these evidences, this evidence of the purchase, both which is sealed, and this evidence which is open; and put them in an earthen vessel, that they may continue many days" (Jeremiah 32:14). A sealed copy for preservation and an open copy for reading, stored in fired clay, which is how documents in that world lasted centuries. Records retention with a stated horizon: many days. WHY THIS MUCH CARE FOR A FIELD HE WOULD NEVER PLOUGH? The answer is in the next verse and it is not caution, it is hope: "For thus saith the LORD of hosts, the God of Israel; Houses and fields and vineyards shall be possessed again in this land" (Jeremiah 32:15). Later the promise is spelled out in the language of a working land office — "Men shall buy fields for money, and subscribe evidences, and seal them, and take witnesses" (Jeremiah 32:44). The paperwork WAS the faith. He was leaving a legible claim for a grandchild who would come home to a country that did not exist yet. RUTH 4 GIVES THE PUBLIC HALF of the same discipline. Boaz redeemed the family land at the gate, before the elders and all the people, under the old custom where "a man plucked off his shoe, and gave it to his neighbour: and this was a testimony in Israel" (Ruth 4:7), and he said it twice for the record: "Ye are witnesses this day" (Ruth 4:9). Nothing hidden, nothing informal, nothing resting on one man’s memory. SO THE STANDARD FOR THIS HOUSE IS NOT "the file is around here somewhere." It is a named custodian, a working copy and an archival copy, execution actually witnessed, consideration documented, and a retention horizon measured in generations rather than quarters. A family that cannot find its deed has already begun to lose the ground.',
    quiz: {
      questions: [
        { q: 'Why did Jeremiah document a purchase so carefully during a siege?', options: ['To satisfy Babylonian law', 'Because the record was an act of hope — fields would be possessed again', 'To prove he had money'], answer: 1, explain: 'The promise in verse 15 is the motive. He was leaving a legible claim for people who would come home later.' },
        { q: 'What were the two copies for?', options: ['One for each witness', 'A sealed copy for preservation and an open copy for reading', 'One to destroy if the city fell'], answer: 1, explain: 'Archival and working copies, stored in an earthen vessel so they would continue many days — records retention with a stated horizon.' },
      ],
    },
    facilitator: {
      talkingPoints: [
        'Set the scene first: a siege, a doomed city, and an instruction to buy. The setting is what makes the paperwork remarkable.',
        'Jeremiah 32:10 has four elements — signature, seal, witnesses, consideration weighed publicly — all four survive in a modern closing.',
        'Two copies, sealed and open, in an earthen vessel "that they may continue many days": archival plus working, with a retention horizon.',
        'Ruth 4:7-9 adds the public half: witnessed at the gate, declared out loud, nothing resting on memory.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Jeremiah 32:6-10. | The scene in a sentence (10): the worst week in history to buy land, and He said buy it. | Teach it (15): the four closing elements, then the two copies and the vessel. | Work it (20): locate the real documents for one property and name a custodian. | Discussion (10): what would our family lose today if a deed could not be found? | Send-off (5): solo task — put one document where it belongs and tell someone where that is.',
      discussionPrompts: [
        'Where is the deed to the property your family cares most about, and who else knows?',
        'What is our earthen vessel — the place a record survives a move, a flood, and a death?',
        'Boaz said "Ye are witnesses this day" out loud. What do we still do in private that should be witnessed?',
      ],
    },
  },
  {
    id: 'prop6-the-field-before-the-house',
    title: 'The field before the house',
    bigIdea: 'Scripture puts the income before the building: "Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house" (Proverbs 24:27). Get the field producing, THEN build. Jesus made the same point as arithmetic — "which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?" (Luke 14:28) — and named the cost of skipping it: the half-built foundation that everyone who passes it mocks (Luke 14:29). And the standing discipline underneath both: "Be thou diligent to know the state of thy flocks" (Proverbs 27:23).',
    inApp: 'Take one property decision you are weighing. Write down the field first: what actually produces income here, and is it producing now? Then write the full cost to finish — not to start. If the second number is larger than what you have, you have found the lesson before it found you.',
    anchor: { ref: 'Proverbs 24:27; Luke 14:28, 29; Proverbs 27:23, 24', theme: '"Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house." Count the cost before the foundation, and be diligent to know the state of your flocks — because riches are not for ever.' },
    stories: [
      {
        kind: 'parable', tone: 'light',
        title: 'The Kitchen That Came First',
        body: 'They both agreed the kitchen was the important thing, and they were not wrong, exactly. It was a beautiful kitchen. The island alone took eleven weeks and a man came from two states away to set the stone. Chidi photographed it from four angles and the photographs were genuinely lovely. What had not been done, at that point, was the roof, which had been assessed and quoted and moved to next year, and the drainage on the uphill side, which had been assessed and quoted and moved to the year after that. The first storm of the following March did not consult the photographs. Water came in under the eave, crossed the joists, and arrived in the beautiful kitchen through the beautiful ceiling with a sound Chidi described afterward as very expensive. The stone was fine. Stone is always fine. Everything under it was not. They rebuilt, in the wrong order again at first, and then his wife said something at the kitchen table that reorganised the next decade of their lives. She said they kept buying the part people could see. After that they did the roof, then the drains, then the boiler, then the windows, and the kitchen waited four years and was, when it finally came, a slightly less beautiful kitchen with nothing at all above it that anyone had to worry about. Chidi says he likes it better. He may even be telling the truth.',
      },
      {
        kind: 'parable', tone: 'sober',
        title: 'Two Brothers and a Barn',
        body: 'Their father left them the same amount, on the same day, with the same advice, which neither of them entirely took. Tomás put nearly all of it into forty acres of poor ground that nobody wanted, and lived for six years in a trailer he was embarrassed to have people see. Rafa bought a good house in a good street and furnished it properly, and was, by every visible measure, doing considerably better. At family gatherings this was noted. Not unkindly, but it was noted. The forty acres took four years to make anything and the sixth year it made real money, and the eighth year Tomás bought the next eighty with it, and somewhere around year eleven the arithmetic became difficult to argue with. He built the house in year fourteen. It is not as nice as Rafa\'s. Rafa still has his, and has carried it, and has worked a job he does not like for nineteen years partly in order to keep carrying it. Neither brother thinks the other was a fool. That is the part people get wrong when they tell this story. Rafa simply bought the house first, and the house does not produce anything, and so the house had to be fed every month by something else for the rest of his life. Tomás bought the field first, and the field fed him, and then the field bought the house.',
      },
    ],
    benefits: [
      'An order of operations that saves more money than any negotiation: the field before the house, the income before the comfort.',
      'Freedom from the pressure to show the house first. The Word puts the productive thing ahead of the impressive thing and says so plainly.',
      'A simple test for any purchase. Does this produce, or does it only display? Both are permitted; only one of them may go first.',
      'Protection from the most ordinary way capable people get into trouble, which is buying the life before the thing that pays for it exists.',
      'Patience with a reason attached, rather than patience as a personality trait.',
    ],
    levels: {
      teen: 'The Bible has an order for building, and most people get it backwards. "Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house" (Proverbs 24:27). The field first. The house after. That means: get the thing that makes money working BEFORE you build the nice thing that costs money. People do the opposite. They buy the house they want and then hope the income shows up. Jesus put it as plain math. "Which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?" (Luke 14:28). Notice the word FINISH. Not enough to start. Enough to finish. And He tells you what happens if you skip it. You lay the foundation, you run out, and everyone who walks past mocks it. A half-built thing is a sign on your own land telling the whole street you did not count. Then one more rule, for after you own it: "Be thou diligent to know the state of thy flocks, and look well to thy herds" (Proverbs 27:23). Know what you actually have. Not what you think you have. Go look. Field first. Count to finish. Then keep looking. Here is how that looks in real life. You want to fix up a rental. Write down every cost. Materials. Labour. Permits. The weeks it sits empty while you work. Then add some extra for the thing you did not think of, because there is always one. That total is the real number. Compare it to the money you actually have, not the money you hope for. And after you own it, go see it. Walk the rooms. Look at the roof. Talk to the person living there. Do not manage a building from a spreadsheet you last opened in the spring.',
      senior: 'Three passages, one sequence, and the sequence is the lesson: income before improvement, cost to FINISH before commitment, and continuous inspection after acquisition. Proverbs 24:27 sets the order: "Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house." The field is the producing asset; the house is the consuming one. Reversing them is the single most common way a family with real income ends up house-poor with nothing working. Luke 14:28 supplies the arithmetic and the operative word: sufficient to FINISH. A budget adequate to begin is not a budget. Verse 29 names the penalty precisely. The foundation is laid, the work is abandoned, and "all that behold it begin to mock him". The loss is reputational as much as financial. In a small community a stalled project is a standing advertisement, and the next lender reads it. Proverbs 27:23 then governs the years after the close: "Be thou diligent to know the state of thy flocks, and look well to thy herds." The verb is diligence and the object is STATE — actual condition, not remembered condition. Verse 24 supplies the reason: "riches are not for ever: and doth the crown endure to every generation?" The translation into this trade is exact and unglamorous. The field is the rent roll and the trade that funds it. The house is the renovation, the office, the truck, the second property bought on optimism. Counting to finish means a full-cost estimate with the contingency named as a number rather than hoped for. And knowing the state of the flocks means an actual walk of the actual units on a schedule. A property, like a herd, changes condition quietly while the paperwork stays the same.',
    },
    lesson: 'There is an order to building in Scripture, and most people invert it: "Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house" (Proverbs 24:27). The field first — the thing that PRODUCES — and the house after. That one verse would have saved half the property failures anyone in this room has watched. The pattern of failure is always the same: the consuming asset is acquired first, on the strength of expected income, and the income arrives late or smaller or not at all. JESUS MADE IT ARITHMETIC. "For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?" (Luke 14:28). Read the operative word: sufficient to FINISH. Money enough to begin is not a budget, it is an appetite. And He states the penalty with unusual social precision: "Lest haply, after he hath laid the foundation, and is not able to finish it, all that behold it begin to mock him" (Luke 14:29). The loss is not only the capital. A stalled foundation is a permanent public sign on your own ground, and in a small community the next lender, the next seller and the next partner all read it before they read your numbers. THEN THE DISCIPLINE FOR THE YEARS AFTER THE CLOSE: "Be thou diligent to know the state of thy flocks, and look well to thy herds" (Proverbs 27:23). Notice the noun — the STATE, the actual present condition, not the condition you remember or the condition the ledger implies. Livestock changes overnight while the tally stays the same, and so does a building: the roof, the water heater, the tenant’s situation, the street. The reason follows immediately and removes any complacency: "For riches are not for ever: and doth the crown endure to every generation?" (Proverbs 27:24). NOW TRANSLATE IT ALL INTO THIS TRADE. The field is the rent roll and the work that funds it. The house is the renovation, the equipment, the second property bought on optimism. Counting to finish means a full-cost estimate with the contingency written down as a number, not carried as a feeling. And knowing the state of the flocks means walking the actual units on an actual schedule and writing what you saw. The order is not a preference; it is the difference between a holding that feeds a family and a foundation the street laughs at.',
    quiz: {
      questions: [
        { q: 'What order does Proverbs 24:27 set?', options: ['Build the house, then find income', 'Prepare the field first, and afterwards build the house', 'Do both at once'], answer: 1, explain: 'The producing asset comes before the consuming one. Reversing it is how a family with real income ends up house-poor with nothing working.' },
        { q: 'Luke 14:28 asks whether he has sufficient to do what?', options: ['Begin', 'Finish', 'Impress the neighbours'], answer: 1, explain: 'Enough to start is an appetite, not a budget — and verse 29 names the penalty: a foundation everyone who passes mocks.' },
      ],
    },
    facilitator: {
      talkingPoints: [
        'Proverbs 24:27 sets the order: the producing field before the consuming house.',
        'Luke 14:28 — sufficient to FINISH. A budget adequate to begin is not a budget.',
        'Luke 14:29 makes the penalty social: a stalled foundation is a standing advertisement the next lender reads.',
        'Proverbs 27:23-24 governs the years after the close — know the STATE, because riches are not for ever.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Proverbs 24:27. | The order in a sentence (10): field first, house after. | Teach it (15): Luke 14:28-29 as arithmetic plus reputation; then Proverbs 27:23-24. | Work it (20): one real decision — name the field, then write the cost to FINISH with the contingency as a number. | Discussion (10): whose stalled foundation have we all driven past, and what did it cost them beyond money? | Send-off (5): solo task — walk one property you have not physically seen this quarter and write what you saw.',
      discussionPrompts: [
        'What is the field in your situation, and is it producing right now or only expected to?',
        'Where have we budgeted to start rather than to finish?',
        'When did you last see — with your eyes — the state of the thing you own?',
      ],
    },
  },
  {
    id: 'prop7-the-tenant-is-a-neighbour-and-the-wage-cannot-wait',
    title: 'The tenant is a neighbour, and the wage cannot wait',
    bigIdea: 'Yahweh put a clock on money owed to a working person: "the wages of him that is hired shall not abide with thee all night until the morning" (Leviticus 19:13). Not within thirty days — before sunrise. The reason given is the tenderest in the law: "for he is poor, and setteth his heart upon it" (Deuteronomy 24:15). And James tells an owner exactly where the withheld money goes: the hire "kept back by fraud, crieth: and the cries of them which have reaped are entered into the ears of the Lord of sabaoth" (James 5:4). This department therefore has a moral ceiling on profit, and it is not the market’s to set.',
    inApp: 'List everyone your property work owes money to: the crew, the handyman, the cleaner, the contractor, the deposit you are holding. Write when each one was last paid, honestly. Anything sitting longer than agreed gets paid or scheduled today, in writing.',
    anchor: { ref: 'Leviticus 19:13; Deuteronomy 24:14, 15; James 5:4', theme: '"The wages of him that is hired shall not abide with thee all night until the morning." Pay the poor worker the same day, because he sets his heart upon it — and the cries of the defrauded reach the ears of the Lord of sabaoth.' },
    stories: [
      {
        kind: 'parable', tone: 'sober',
        title: 'Net Thirty',
        body: 'It was a policy, not a personal decision, and Gareth said so every time it came up. All trades paid net thirty. It applied to everyone equally, which he considered the fairest possible arrangement, and in a certain narrow sense he was right. What the policy did not capture was that Ewan the plasterer bought his materials on a card, on Tuesday, out of a bank account with four hundred pounds in it, and that thirty days was therefore not a payment term for Ewan, it was a loan from Ewan, at a rate nobody had negotiated, from the person in the arrangement least able to make it. Ewan never said any of this. He said yes to every job for two years, and then one spring he stopped answering, and Gareth complained to a colleague that good trades were impossible to find any more. The colleague, who paid on the day, said he had never had that problem. Gareth asked him how he managed it and the man said he paid on the day. Gareth said that was not a business practice, that was a cash-flow decision, and his colleague agreed it was exactly that, and said it was the cheapest one he made all year. It took Gareth another eighteen months to change the policy. By then Ewan was working for the other man, and had been for a while, and was not coming back.',
      },
      {
        kind: 'parable', tone: 'hopeful',
        title: 'The Friday Envelope',
        body: 'Old Mrs Kowalczyk paid in cash on Friday and it drove her accountant to distraction. There were forms. There were better ways. She listened to all of them, every year, and then went to the bank on Friday morning like she had since 1978. The men who worked her buildings were not sentimental people and would not have described themselves as loyal. What they said, when asked, was that you knew. That was the whole of it. You knew what Friday looked like, and you could tell your wife what Friday looked like, and there was never a conversation in which you had to ask. When the boiler went in the middle of a February night in the block on Cromwell Street, four of them were there before six in the morning, and two of them had not been called. Her nephew, who inherited the buildings and moved everything to a proper payment system within a year, could not work out for a long time why the same emergency in a later February took eleven hours and two thousand pounds more. He asked one of the men eventually. The man was not rude about it. He said the money always came now, and that was fine, it always came before too. He said what was gone was the part where you never had to wonder.',
      },
    ],
    benefits: [
      'A person restored to the centre of the trade. The one in the building is a neighbour, and the Word attaches a clock to what you owe him.',
      'Freedom from the float. Holding a worker\'s wage overnight is named, and refusing to do it removes a whole category of quiet compromise.',
      'A standard that is measurable on a calendar rather than felt in the conscience, which means you can actually tell whether you kept it.',
      'Protection for the relationship. Paid on the day is the cheapest reputation you will ever buy, and the hardest to rebuild once spent.',
      'A frame that survives scale. Ten doors or a hundred, the person at the other end is still a neighbour and the wage still cannot wait.',
    ],
    levels: {
      teen: 'Yahweh put a deadline on paying people. A real one. "The wages of him that is hired shall not abide with thee all night until the morning" (Leviticus 19:13). That is not thirty days. That is before the sun comes up. And He said why, and the reason is gentle: "for he is poor, and setteth his heart upon it" (Deuteronomy 24:15). He is counting on that money. He already spent it in his head on food. So holding it overnight is not a paperwork delay to him. It is a hungry night. Then James says something an owner should never forget. When you keep back pay by fraud, the money CRIES. And the cry goes somewhere: "the cries of them which have reaped are entered into the ears of the Lord of sabaoth" (James 5:4). Sabaoth means armies. The unpaid worker’s complaint is filed with the commander of heaven’s armies. Here is what this means in property work. The people who fix the roof, clean the unit, cut the grass, and the person whose deposit you are holding — they are all neighbours, not line items. Pay fast. Pay first. Pay when you said. Money you owe is not your money. A deposit is the clearest test of that. Someone hands you their money to hold. It is not yours to spend while you hold it, and it goes back on time with a clear list of anything you kept and why. Late fees are the other test. A fee can cover a real cost. The moment it becomes a way to make money, you are making money off the person who has the least. And one more thing. Do not make the person who can least afford to wait do the waiting. That is the rule almost everyone gets backwards.',
      senior: 'This is the lesson that sets a ceiling on profit, and it should be taught as a hard limit rather than as a virtue. The law is specific about timing: "the wages of him that is hired shall not abide with thee all night until the morning" (Leviticus 19:13), repeated with its rationale — "At his day thou shalt give him his hire, neither shall the sun go down upon it; for he is poor, and setteth his heart upon it" (Deuteronomy 24:15). Two things are established. First, a same-day obligation, which is far tighter than any commercial norm. Second, the ground of it: dependence. The duty scales with the counterparty’s exposure, not with the size of the invoice. That is the opposite of how payment priority is usually set in practice, where the party who can least afford to wait is the one made to wait. Deuteronomy 24:14 closes the loophole of category: "whether he be of thy brethren, or of thy strangers that are in thy land within thy gates." No distinction between the insider and the outsider. And the enforcement is not a small-claims court. James 5:4 personifies the withheld money — the hire "kept back by fraud, crieth" — and files the cry with the Lord of sabaoth, the commander of armies. An unpaid worker who has no leverage has the highest possible leverage. Apply it precisely in this trade. Trades and crews are paid to terms without a float taken at their expense. A tenant’s deposit is a held trust, not working capital, and it is returned on the clock with the deductions itemised. Late fees are a cost recovery, never a profit centre. The governing sentence for the whole department: the tenant and the tradesman are neighbours before they are counterparties, and the Word already fixed what a neighbour is owed.',
    },
    lesson: 'Yahweh attached a clock to money owed to a working person, and the clock is startling: "Thou shalt not defraud thy neighbour, neither rob him: the wages of him that is hired shall not abide with thee all night until the morning" (Leviticus 19:13). Not net thirty. Not on the first of the month. Before sunrise. Deuteronomy says it again and adds the reason, which is the tenderest line in the whole law of property: "At his day thou shalt give him his hire, neither shall the sun go down upon it; for he is poor, and setteth his heart upon it: lest he cry against thee unto the LORD, and it be sin unto thee" (Deuteronomy 24:15). HE SETTETH HIS HEART UPON IT. The money is already spent in his mind on bread, and a delay that is an accounting convenience to the payer is a hungry night to him. So the duty scales with the OTHER party’s exposure rather than with the size of the bill — which is the exact inverse of how payment order usually works in practice, where the party least able to wait is the party made to wait longest. The law also refuses the category dodge: the protection covers the hired servant "whether he be of thy brethren, or of thy strangers that are in thy land within thy gates" (Deuteronomy 24:14). Insider or outsider, same clock. AND THE ENFORCEMENT IS NOT A COURT. James addresses owners directly and personifies the money: "Behold, the hire of the labourers who have reaped down your fields, which is of you kept back by fraud, crieth: and the cries of them which have reaped are entered into the ears of the Lord of sabaoth" (James 5:4). Sabaoth means armies. The worker with no leverage turns out to hold the only leverage that finally matters, and his complaint is already filed. NOW MAKE IT OPERATIONAL, because this is where a property business either obeys or invents reasons. The crew, the handyman, the cleaner, the contractor are paid to terms with no float taken at their expense. A tenant’s security deposit is a trust you are holding, not working capital, and it goes back on the clock with every deduction itemised and evidenced. A late fee recovers a real cost; the moment it becomes a profit line, the business has begun to feed on the person least able to feed it. This is the ceiling the department will not go above: the tenant and the tradesman are neighbours before they are counterparties, and the Word has already fixed what a neighbour is owed.',
    quiz: {
      questions: [
        { q: 'What deadline does Leviticus 19:13 set for a hired worker’s wages?', options: ['Thirty days', 'Before morning — they shall not abide with you all night', 'Whenever the work is inspected'], answer: 1, explain: 'Same-day payment, far tighter than any commercial norm, and Deuteronomy 24:15 gives the reason: he is poor and setteth his heart upon it.' },
        { q: 'According to James 5:4, what happens to wages kept back by fraud?', options: ['They are forfeited', 'They cry, and the cries enter the ears of the Lord of sabaoth', 'They become a loan'], answer: 1, explain: 'Sabaoth means armies. The worker with no leverage holds the only leverage that finally matters.' },
      ],
    },
    facilitator: {
      talkingPoints: [
        'The clock is same-day (Leviticus 19:13) — far tighter than commercial terms, and it is a command rather than a courtesy.',
        'The reason is dependence: "he is poor, and setteth his heart upon it" (Deuteronomy 24:15). Duty scales with the other side’s exposure.',
        'Deuteronomy 24:14 refuses the category dodge — brethren or strangers, same clock.',
        'James 5:4 files the cry with the Lord of sabaoth. Then make it concrete: deposits are a held trust; late fees recover cost, never profit.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Deuteronomy 24:14-15. | The clock in a sentence (10): before sunrise, because he set his heart on it. | Teach it (15): duty scales with exposure, the category loophole closed, then James 5:4. | Work it (20): list everyone we owe — crew, trades, deposits — with the date each was last paid; schedule anything late today. | Discussion (10): where does our float come at someone else’s expense? | Send-off (5): solo task — pay or schedule one thing that is late, in writing.',
      discussionPrompts: [
        'Who in our chain is made to wait longest, and how well can they afford it?',
        'Is a security deposit on our books as a trust or as cash we can use?',
        'Where has a late fee quietly become income rather than a recovered cost?',
      ],
    },
  },
  {
    id: 'prop8-handed-forward-or-handed-to-a-fool',
    title: 'Handed forward, or handed to a fool',
    bigIdea: 'The aim is set three generations out: "A good man leaveth an inheritance to his children’s children" (Proverbs 13:22). So an estate that dies with the children never reached the target. But Solomon names the honest fear in the same breath as the labour — "I hated all my labour which I had taken under the sun: because I should leave it unto the man that shall be after me. And who knoweth whether he shall be a wise man or a fool?" (Ecclesiastes 2:18, 19). Property alone does not solve that. David’s answer was to prepare the materials AND charge the successor: "Be strong and of good courage, and do it" (1 Chronicles 28:20).',
    inApp: 'Write two lists for one property. First: what a successor would need to OPERATE it — documents, contacts, accounts, the real numbers. Second: what a successor would need to BELIEVE to operate it rightly. Then name the person, and name the date you will start teaching them.',
    anchor: { ref: 'Proverbs 13:22; Ecclesiastes 2:18, 19; 1 Chronicles 28:2, 20', theme: '"A good man leaveth an inheritance to his children’s children." And the fear that goes with it: leaving labour to a man who may be wise or a fool. David answered it by preparing the materials AND charging his son: "Be strong and of good courage, and do it."' },
    stories: [
      {
        kind: 'parable', tone: 'sober',
        title: 'The Inventory and the Apprentice',
        body: 'Bernard spent forty-one years building something worth having and eleven months trying to explain it, and the second number is the one that decided everything. He had meant to bring his daughter in earlier. There had always been a reason not to: a bad quarter, a difficult tenant, a year where it seemed kinder to let her get on with her own life. So the knowledge stayed where it had always been, which was in Bernard, along with the relationships, the history of every roof, and the reason the lease on the corner unit was worded so strangely. When he got his diagnosis he began writing it down and discovered that forty-one years does not go into eleven months. She got the assets. She got every one of them, cleanly, with the tax handled and the title clear, because he had been meticulous about that part. What she did not get was the forty-one years, and so she made, in her first three, most of the mistakes he had made in his first fifteen, and some of them were expensive. She is good at it now. She got there on her own, the long way, and she says without bitterness that her father left her a business and not a trade. She has two apprentices. She started them in their first year. She says it is the only part of the inheritance she is certain about.',
      },
      {
        kind: 'parable', tone: 'hopeful',
        title: 'The Long Handover',
        body: 'The handover took nine years, which everyone involved agreed was ridiculous, and which turned out to be roughly correct. Fatima started her son on the worst building she owned when he was twenty-two. Not the flagship. The one with the parking dispute and the difficult freeholder and the drains. He was furious for about four months. She let him be furious and did not rescue him, and answered questions when he asked them and not before, which was the hardest part of the whole nine years for her. By twenty-six he had the drains solved and had negotiated the parking dispute into something durable, and had learned in the process how her mind worked on a problem, which was the actual curriculum. At thirty-one he told her she was wrong about a refinancing and he was right, and she said afterward that this was the day it was finished, not the day the papers were signed two years later. What she handed him in the end was not a portfolio. He could have inherited that in an afternoon. What took nine years was handing him the way of seeing it, and there is no document for that, and she knew of no way to do it faster than a difficult building and a great deal of patience.',
      },
    ],
    benefits: [
      'An honest look at the end of the road. What you build will be handed to somebody, and the handing is part of the stewardship rather than after it.',
      'Freedom from the fantasy that accumulation settles anything. Scripture asks who will hold it next and does not pretend the answer is guaranteed.',
      'A reason to teach as well as to acquire, because an heir formed is worth more than an asset transferred.',
      'Realism about what you cannot control, which is most of it, and clarity about what you can: the preparing, the teaching, the recording.',
      'A quieter relationship with the work, because the point was never the pile.',
    ],
    levels: {
      teen: 'Here is the target Yahweh set: "A good man leaveth an inheritance to his children’s children" (Proverbs 13:22). Children’s children. Grandchildren. That is three generations, not one. So if everything you built is gone by the time your kids are done with it, the aim was missed. Now the honest part. Solomon, the richest man alive, said he HATED his work sometimes. Why? "Because I should leave it unto the man that shall be after me. And who knoweth whether he shall be a wise man or a fool?" (Ecclesiastes 2:18, 19). You cannot control who gets it. That is real, and pretending otherwise is a lie. Property by itself does not fix it. Handing a building to someone who was never taught is handing them a bill. Watch what David did instead. He wanted to build the temple and was told he would not be the one. So he got the materials ready for his son — "had made ready for the building" (1 Chronicles 28:2) — and then he charged him out loud: "Be strong and of good courage, and do it" (1 Chronicles 28:20). Materials AND a charge. Stuff and courage. That is the whole department in one move. Get the thing ready, and get the person ready. If you only do one, you have not handed anything forward. So ask two questions about anything your family owns. First: could somebody take this over tomorrow? Do they know where the papers are, who to call, what it costs, what it earns? Second: would they run it right? Do they know whose it really is, and what a tenant is owed? If the answer to the first one is no, you left a puzzle. If the answer to the second one is no, you left a weapon. Start teaching the person now, while you are still here to answer questions.',
      senior: 'Close the course where the Word aims: three generations out. "A good man leaveth an inheritance to his children’s children" (Proverbs 13:22). A plan that terminates with the children is short by one, however impressive its balance sheet. Then let the class sit in the honest objection rather than skipping it. Solomon, with more built than anyone, records revulsion at his own labour "because I should leave it unto the man that shall be after me. And who knoweth whether he shall be a wise man or a fool?" (Ecclesiastes 2:18, 19). Successor risk is a real risk, named in Scripture, and it is not answered by better structuring. So what DOES answer it? Not the asset. The asset transfers either way; competence and conviction do not. David supplies the pattern and it has two halves. He had intended to build the house himself and was refused the privilege, and he did not sulk — he "had made ready for the building" (1 Chronicles 28:2), assembling materials for a work he would never see finished. That is the operational half: a successor inherits a prepared position rather than a puzzle. The second half is a charge, spoken directly and in public: "Be strong and of good courage, and do it: fear not, nor be dismayed: for the LORD God, even my God, will be with thee; he will not fail thee, nor forsake thee, until thou hast finished all the work" (1 Chronicles 28:20). Note "even my God" — the father hands over a tested relationship, not only a ledger. The practical standard for this house is therefore double-entry. A successor receives an operable position: documents located, custodians named, numbers real, the field producing, the boundaries known, the trades paid. And a successor receives formation: the principles of this course taught deliberately, early, and before the transfer. Name the failure of each half plainly, because both are common. Prepare the position without forming the person and you have handed a stranger a bill he cannot read. Form the person without preparing the position and you have handed a believer a mess to untangle while grieving. The transfer is not a document date. It is the years of teaching before it, which is why this course is written for a teenager as well as for an executor.',
    },
    lesson: 'The department closes where Yahweh aims: "A good man leaveth an inheritance to his children’s children" (Proverbs 13:22). Three generations. Which means an estate that dies with the children never actually hit the target, no matter how large it was at its peak. And the standard is not sentimental — it is a measurement, and most plans fail it. NOW THE HONEST OBJECTION, and it is in Scripture rather than in the objector’s mouth. Solomon, who built more than anyone in the account, writes: "Yea, I hated all my labour which I had taken under the sun: because I should leave it unto the man that shall be after me. And who knoweth whether he shall be a wise man or a fool? yet shall he have rule over all my labour wherein I have laboured" (Ecclesiastes 2:18, 19). That is successor risk, stated by the richest man in the story, and it cannot be answered by better structuring. The asset transfers either way. Competence and conviction do not transfer at all unless they are handed over on purpose. DAVID’S ANSWER HAS TWO HALVES, and both are required. First, he prepared the position. He had wanted to build the house of rest for the ark himself, and was told plainly it would not be him; and instead of sulking about a work he would not live to see, he "had made ready for the building" (1 Chronicles 28:2) — materials, plans, gold, iron, craftsmen, the whole assembly handed over ready. A successor should inherit a prepared position, not a puzzle. Second, he gave a CHARGE, out loud, in front of the assembly: "Be strong and of good courage, and do it: fear not, nor be dismayed: for the LORD God, even my God, will be with thee; he will not fail thee, nor forsake thee, until thou hast finished all the work for the service of the house of the LORD" (1 Chronicles 28:20). Read the three words that carry the most weight: "even my God." He is not handing his son a portfolio and a hope. He is handing him a tested relationship with the One who holds the title to everything the son is about to manage. SO THE STANDARD FOR THIS HOUSE IS DOUBLE-ENTRY. On one side, an operable position: the documents located and in one place, a custodian named, numbers that are real, the field producing before the house is built, the boundaries known, the tradesmen paid, the records in the earthen vessel. On the other side, a formed successor: these principles taught deliberately, early, and BEFORE the transfer, so that the ground arrives in hands that already know whose it is. Do the first without the second and you have handed a stranger a bill. Do the second without the first and you have handed a believer a mess. Yahweh kept the title, handed out the use, and expects both halves to reach the grandchildren.',
    quiz: {
      questions: [
        { q: 'Proverbs 13:22 aims an inheritance at whom?', options: ['The children', 'The children’s children', 'The church'], answer: 1, explain: 'Three generations out. A plan that terminates with the children is short by one, however large it was at its peak.' },
        { q: 'What were the two halves of David’s answer to successor risk?', options: ['A bigger estate and a stricter will', 'Prepared materials AND a spoken charge', 'A trust and a lawyer'], answer: 1, explain: 'He made ready for the building he would never see, and he charged Solomon publicly — handing over a tested relationship, not only a ledger.' },
      ],
    },
    facilitator: {
      talkingPoints: [
        'Proverbs 13:22 sets the aim three generations out, which makes most plans measurably short.',
        'Sit in Ecclesiastes 2:18-19 rather than skipping it: successor risk is named by the richest man in the account.',
        'David prepared the position for a work he would not see (1 Chronicles 28:2) — a successor inherits a prepared position, not a puzzle.',
        'Then the charge, in public, with "even my God" — a tested relationship handed over alongside the materials.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Proverbs 13:22 and then Ecclesiastes 2:18-19. | The aim in a sentence (10): three generations, or the target was missed. | Teach it (20): successor risk honestly, then David’s two halves from 1 Chronicles 28. | Work it (20): write the two lists — what a successor must OPERATE and what a successor must BELIEVE — then name the person and the date. | Discussion (10): who is our successor, and what have we actually taught them? | Send-off (5): solo task — tell that person one thing from this course this week.',
      discussionPrompts: [
        'Is our plan aimed at the children or at the grandchildren, and how would we prove it?',
        'What would a successor find missing if they took over our property tomorrow?',
        'David said "even my God." What have we handed forward besides assets?',
      ],
    },
  },
];

// --- Shared-framework wrappers ----------------------------------------------
// Self-paced: no cohort start, so every row's date is null by design and the UI
// shows a lesson number rather than a fabricated calendar date (DR-0076).

export function buildPropertyPrincipleSchedule(startISO = null) {
  return buildScheduleFor(PROPERTY_PRINCIPLE_MODULES, startISO, PROPERTY_PRINCIPLE_META.cadenceDays);
}

export function propertyPrincipleProgressSummary(progress = {}) {
  return progressSummaryFor(PROPERTY_PRINCIPLE_MODULES, progress);
}

export function exportPropertyPrincipleCurriculumMarkdown(startISO = null) {
  return exportCurriculumMarkdownFor({
    meta: PROPERTY_PRINCIPLE_META,
    modules: buildPropertyPrincipleSchedule(startISO),
    sessionFlow: PROPERTY_PRINCIPLE_SESSION_FLOW,
  }, startISO);
}

/** Every Scripture reference this course cites, deduped — what the verse gate walks. */
export function propertyPrincipleRefs() {
  const seen = new Set();
  for (const m of PROPERTY_PRINCIPLE_MODULES) {
    for (const part of String((m.anchor && m.anchor.ref) || '').split(';')) {
      const ref = part.trim();
      if (ref) seen.add(ref);
    }
  }
  for (const part of String((PROPERTY_PRINCIPLE_META.wordFirst && PROPERTY_PRINCIPLE_META.wordFirst.ref) || '').split(';')) {
    const ref = part.trim();
    if (ref) seen.add(ref);
  }
  return [...seen];
}

export const PROPERTY_PRINCIPLE_INTEREST_TAG = '[Property Principle]';
export const PROPERTY_PRINCIPLE_HELPER_TAG = '[Property Principle helper]';

export const PROPERTY_PRINCIPLE_TUTOR_META = {
  key: 'property-principle',
  name: PROPERTY_PRINCIPLE_META.title,
  title: PROPERTY_PRINCIPLE_META.title,
  posture: 'Teach the footing Word-first: Yahweh kept the title and handed out the use, so a boundary is a moral object, a price is a function of remaining years, a tenant is a neighbour, and the aim is the grandchildren. Keep the Naboth test in front of the learner \u2014 a lawful step that does the work of a threat is not defended by being lawful. Never give legal, tax or investment advice: name what to ask a licensed professional in the learner\u2019s own state.',
  blurb: 'Ask anything about the eight principles \u2014 the title Yahweh kept, the landmark, Naboth\u2019s vineyard, the jubilee price, the deed and the witnesses, the field before the house, the wage that cannot wait, and the three-generation aim. Teaching only; your own attorney or accountant handles the instrument.',
};
