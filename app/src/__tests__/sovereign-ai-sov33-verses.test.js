// =============================================================================
// sov33 — Peace, peace; when there is no peace: the tool trained on approval,
// and the faithful witness (DR-0761)
// =============================================================================
// Week 33 of Sovereign A.I., captured 2026-10-06 by the Gmail-lesson-intake Way
// from a technology newsletter Darrell forwarded from dpoe@illinois.edu with one
// word above it, "Lesson": why these answering systems agree with a person even
// when the person is wrong. The article's own answer is the training — the reward
// blends accuracy, helpfulness and user approval, and approval can win.
//
// Word first: a true witness delivereth souls (Proverbs 14:25); the hurt healed
// slightly, peace where there is no peace (Jeremiah 6:14; 8:11); the damage named
// both ways (Ezekiel 13:22); the audience that ordered smooth things (Isaiah
// 30:10; 2 Timothy 4:3-4; Jeremiah 5:31); four hundred who agreed while one told
// the truth (1 Kings 22); flattery as a net and a ruin (Proverbs 29:5; 26:28);
// faithful wounds and iron on iron (Proverbs 27:6, 17); truth in love (Ephesians
// 4:15); and the Lamb who let the crowd walk rather than soften a word (John
// 6:66; Mark 10:21-22).
//
// Every quoted verse below was FILLED from app/public/bible/kjv by a generator
// (never typed from memory) and is re-read from the corpus at test time — two
// witnesses — and a third, independent method (quoted-verse-is-the-verse, which
// resolves the printed reference itself) scans every field. Every non-Scripture
// quote is allow-listed to the article's own words or Darrell's marker, so a
// claim cannot enter the lesson in quotation marks unattributed. Proven-to-catch:
// the last block mutates a verse, a claim and the week order and shows the gate
// fails.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { hasAllThree, ownPrompts } from '../lib/talk-together.js';
import { anchorRefs } from '../lib/search-it-out.js';
import { scanQuotedVerses, describeFault, loweredHolyNames, ourVoice } from '../../../scripts/quoted-verse-is-the-verse.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOV33_ID = "sov33-peace-peace-when-there-is-no-peace-and-the-faithful-witness";
const sov33 = SOVEREIGN_AI_MODULES.find((w) => w.id === SOV33_ID);

const SOV33_FRAGMENTS = {
  "Proverbs 14:25": "A true witness delivereth souls: but a deceitful witness speaketh lies.",
  "Proverbs 14:5": "A faithful witness will not lie: but a false witness will utter lies.",
  "Proverbs 12:17": "He that speaketh truth sheweth forth righteousness: but a false witness deceit.",
  "Proverbs 12:19": "The lip of truth shall be established for ever: but a lying tongue is but for a moment.",
  "Zechariah 8:16": "These are the things that ye shall do; Speak ye every man the truth to his neighbour; execute the judgment of truth and peace in your gates:",
  "Ephesians 4:25": "Wherefore putting away lying, speak every man truth with his neighbour: for we are members one of another.",
  "Revelation 3:14": "And unto the angel of the church of the Laodiceans write; These things saith the Amen, the faithful and true witness, the beginning of the creation of God;",
  "John 18:37": "Pilate therefore said unto him, Art thou a king then? Jesus answered, Thou sayest that I am a king. To this end was I born, and for this cause came I into the world, that I should bear witness unto the truth. Every one that is of the truth heareth my voice.",
  "John 14:6": "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.",
  "1 Thessalonians 5:21": "Prove all things; hold fast that which is good.",
  "Proverbs 18:17": "He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.",
  "Deuteronomy 19:15": "One witness shall not rise up against a man for any iniquity, or for any sin, in any sin that he sinneth: at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established.",
  "Proverbs 24:26": "Every man shall kiss his lips that giveth a right answer.",
  "Jeremiah 6:14": "They have healed also the hurt of the daughter of my people slightly, saying, Peace, peace; when there is no peace.",
  "Jeremiah 8:11": "For they have healed the hurt of the daughter of my people slightly, saying, Peace, peace; when there is no peace.",
  "Jeremiah 6:13": "For from the least of them even unto the greatest of them every one is given to covetousness; and from the prophet even unto the priest every one dealeth falsely.",
  "Ezekiel 13:10": "Because, even because they have seduced my people, saying, Peace; and there was no peace; and one built up a wall, and, lo, others daubed it with untempered morter:",
  "Ezekiel 13:22": "Because with lies ye have made the heart of the righteous sad, whom I have not made sad; and strengthened the hands of the wicked, that he should not return from his wicked way, by promising him life:",
  "Jeremiah 23:16": "Thus saith the LORD of hosts, Hearken not unto the words of the prophets that prophesy unto you: they make you vain: they speak a vision of their own heart, and not out of the mouth of the LORD.",
  "Jeremiah 23:17": "They say still unto them that despise me, The LORD hath said, Ye shall have peace; and they say unto every one that walketh after the imagination of his own heart, No evil shall come upon you.",
  "Jeremiah 14:14": "Then the LORD said unto me, The prophets prophesy lies in my name: I sent them not, neither have I commanded them, neither spake unto them: they prophesy unto you a false vision and divination, and a thing of nought, and the deceit of their heart.",
  "Micah 3:5": "Thus saith the LORD concerning the prophets that make my people err, that bite with their teeth, and cry, Peace; and he that putteth not into their mouths, they even prepare war against him.",
  "Micah 2:11": "If a man walking in the spirit and falsehood do lie, saying, I will prophesy unto thee of wine and of strong drink; he shall even be the prophet of this people.",
  "Isaiah 30:9": "That this is a rebellious people, lying children, children that will not hear the law of the LORD:",
  "Isaiah 30:10": "Which say to the seers, See not; and to the prophets, Prophesy not unto us right things, speak unto us smooth things, prophesy deceits:",
  "Isaiah 30:11": "Get you out of the way, turn aside out of the path, cause the Holy One of Israel to cease from before us.",
  "2 Timothy 4:3": "For the time will come when they will not endure sound doctrine; but after their own lusts shall they heap to themselves teachers, having itching ears;",
  "2 Timothy 4:4": "And they shall turn away their ears from the truth, and shall be turned unto fables.",
  "2 Timothy 4:2": "Preach the word; be instant in season, out of season; reprove, rebuke, exhort with all longsuffering and doctrine.",
  "Jeremiah 5:31": "The prophets prophesy falsely, and the priests bear rule by their means; and my people love to have it so: and what will ye do in the end thereof?",
  "Luke 6:26": "Woe unto you, when all men shall speak well of you! for so did their fathers to the false prophets.",
  "John 3:19": "And this is the condemnation, that light is come into the world, and men loved darkness rather than light, because their deeds were evil.",
  "John 3:20": "For every one that doeth evil hateth the light, neither cometh to the light, lest his deeds should be reproved.",
  "Isaiah 5:20": "Woe unto them that call evil good, and good evil; that put darkness for light, and light for darkness; that put bitter for sweet, and sweet for bitter!",
  "1 Kings 22:6": "Then the king of Israel gathered the prophets together, about four hundred men, and said unto them, Shall I go against Ramothgilead to battle, or shall I forbear? And they said, Go up; for the Lord shall deliver it into the hand of the king.",
  "1 Kings 22:7": "And Jehoshaphat said, Is there not here a prophet of the LORD besides, that we might enquire of him?",
  "1 Kings 22:8": "And the king of Israel said unto Jehoshaphat, There is yet one man, Micaiah the son of Imlah, by whom we may enquire of the LORD: but I hate him; for he doth not prophesy good concerning me, but evil. And Jehoshaphat said, Let not the king say so.",
  "1 Kings 22:13": "And the messenger that was gone to call Micaiah spake unto him, saying, Behold now, the words of the prophets declare good unto the king with one mouth: let thy word, I pray thee, be like the word of one of them, and speak that which is good.",
  "1 Kings 22:14": "And Micaiah said, As the LORD liveth, what the LORD saith unto me, that will I speak.",
  "2 Chronicles 18:13": "And Micaiah said, As the LORD liveth, even what my God saith, that will I speak.",
  "1 Kings 22:17": "And he said, I saw all Israel scattered upon the hills, as sheep that have not a shepherd: and the LORD said, These have no master: let them return every man to his house in peace.",
  "1 Kings 22:18": "And the king of Israel said unto Jehoshaphat, Did I not tell thee that he would prophesy no good concerning me, but evil?",
  "1 Kings 22:22": "And the LORD said unto him, Wherewith? And he said, I will go forth, and I will be a lying spirit in the mouth of all his prophets. And he said, Thou shalt persuade him, and prevail also: go forth, and do so.",
  "1 Kings 22:27": "And say, Thus saith the king, Put this fellow in the prison, and feed him with bread of affliction and with water of affliction, until I come in peace.",
  "1 Kings 22:28": "And Micaiah said, If thou return at all in peace, the LORD hath not spoken by me. And he said, Hearken, O people, every one of you.",
  "1 Kings 22:34": "And a certain man drew a bow at a venture, and smote the king of Israel between the joints of the harness: wherefore he said unto the driver of his chariot, Turn thine hand, and carry me out of the host; for I am wounded.",
  "1 Kings 22:37": "So the king died, and was brought to Samaria; and they buried the king in Samaria.",
  "Proverbs 11:14": "Where no counsel is, the people fall: but in the multitude of counsellors there is safety.",
  "Proverbs 24:6": "For by wise counsel thou shalt make thy war: and in multitude of counsellors there is safety.",
  "Proverbs 29:5": "A man that flattereth his neighbour spreadeth a net for his feet.",
  "Proverbs 26:28": "A lying tongue hateth those that are afflicted by it; and a flattering mouth worketh ruin.",
  "Proverbs 28:23": "He that rebuketh a man afterwards shall find more favour than he that flattereth with the tongue.",
  "Psalms 12:2": "They speak vanity every one with his neighbour: with flattering lips and with a double heart do they speak.",
  "Psalms 12:3": "The LORD shall cut off all flattering lips, and the tongue that speaketh proud things:",
  "Romans 16:18": "For they that are such serve not our Lord Jesus Christ, but their own belly; and by good words and fair speeches deceive the hearts of the simple.",
  "Colossians 2:4": "And this I say, lest any man should beguile you with enticing words.",
  "1 Thessalonians 2:4": "But as we were allowed of God to be put in trust with the gospel, even so we speak; not as pleasing men, but God, which trieth our hearts.",
  "1 Thessalonians 2:5": "For neither at any time used we flattering words, as ye know, nor a cloke of covetousness; God is witness:",
  "Galatians 1:10": "For do I now persuade men, or God? or do I seek to please men? for if I yet pleased men, I should not be the servant of Christ.",
  "Galatians 4:16": "Am I therefore become your enemy, because I tell you the truth?",
  "Job 32:21": "Let me not, I pray you, accept any man’s person, neither let me give flattering titles unto man.",
  "Job 32:22": "For I know not to give flattering titles; in so doing my maker would soon take me away.",
  "Proverbs 16:13": "Righteous lips are the delight of kings; and they love him that speaketh right.",
  "Proverbs 25:5": "Take away the wicked from before the king, and his throne shall be established in righteousness.",
  "Proverbs 27:5": "Open rebuke is better than secret love.",
  "Proverbs 27:6": "Faithful are the wounds of a friend; but the kisses of an enemy are deceitful.",
  "Proverbs 27:17": "Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.",
  "Proverbs 9:8": "Reprove not a scorner, lest he hate thee: rebuke a wise man, and he will love thee.",
  "Proverbs 12:1": "Whoso loveth instruction loveth knowledge: but he that hateth reproof is brutish.",
  "Proverbs 13:18": "Poverty and shame shall be to him that refuseth instruction: but he that regardeth reproof shall be honoured.",
  "Proverbs 15:31": "The ear that heareth the reproof of life abideth among the wise.",
  "Proverbs 15:32": "He that refuseth instruction despiseth his own soul: but he that heareth reproof getteth understanding.",
  "Proverbs 25:12": "As an earring of gold, and an ornament of fine gold, so is a wise reprover upon an obedient ear.",
  "Psalms 141:5": "Let the righteous smite me; it shall be a kindness: and let him reprove me; it shall be an excellent oil, which shall not break my head: for yet my prayer also shall be in their calamities.",
  "Leviticus 19:17": "Thou shalt not hate thy brother in thine heart: thou shalt in any wise rebuke thy neighbour, and not suffer sin upon him.",
  "Ephesians 4:15": "But speaking the truth in love, may grow up into him in all things, which is the head, even Christ:",
  "2 Samuel 12:7": "And Nathan said to David, Thou art the man. Thus saith the LORD God of Israel, I anointed thee king over Israel, and I delivered thee out of the hand of Saul;",
  "Galatians 2:11": "But when Peter was come to Antioch, I withstood him to the face, because he was to be blamed.",
  "Proverbs 24:3": "Through wisdom is an house builded; and by understanding it is established:",
  "Proverbs 24:4": "And by knowledge shall the chambers be filled with all precious and pleasant riches.",
  "Proverbs 23:23": "Buy the truth, and sell it not; also wisdom, and instruction, and understanding.",
  "John 6:60": "Many therefore of his disciples, when they had heard this, said, This is an hard saying; who can hear it?",
  "John 6:66": "From that time many of his disciples went back, and walked no more with him.",
  "John 6:67": "Then said Jesus unto the twelve, Will ye also go away?",
  "Mark 10:21": "Then Jesus beholding him loved him, and said unto him, One thing thou lackest: go thy way, sell whatsoever thou hast, and give to the poor, and thou shalt have treasure in heaven: and come, take up the cross, and follow me.",
  "Mark 10:22": "And he was sad at that saying, and went away grieved: for he had great possessions.",
  "John 8:45": "And because I tell you the truth, ye believe me not.",
  "John 8:46": "Which of you convinceth me of sin? And if I say the truth, why do ye not believe me?",
  "John 1:29": "The next day John seeth Jesus coming unto him, and saith, Behold the Lamb of God, which taketh away the sin of the world.",
  "John 3:16": "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
  "Proverbs 18:13": "He that answereth a matter before he heareth it, it is folly and shame unto him.",
  "Acts 17:11": "These were more noble than those in Thessalonica, in that they received the word with all readiness of mind, and searched the scriptures daily, whether those things were so.",
  "1 John 4:1": "Beloved, believe not every spirit, but try the spirits whether they are of God: because many false prophets are gone out into the world.",
  "Proverbs 14:15": "The simple believeth every word: but the prudent man looketh well to his going.",
  "Deuteronomy 6:7": "And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.",
  "Malachi 4:6": "And he shall turn the heart of the fathers to the children, and the heart of the children to their fathers, lest I come and smite the earth with a curse.",
  "James 5:16": "Confess your faults one to another, and pray one for another, that ye may be healed. The effectual fervent prayer of a righteous man availeth much.",
  "James 1:19": "Wherefore, my beloved brethren, let every man be swift to hear, slow to speak, slow to wrath:",
  "Proverbs 20:5": "Counsel in the heart of man is like deep water; but a man of understanding will draw it out.",
  "Luke 2:52": "And Jesus increased in wisdom and stature, and in favour with God and man.",
  "Hebrews 5:14": "But strong meat belongeth to them that are of full age, even those who by reason of use have their senses exercised to discern both good and evil.",
};

const SOV33_CORPUS = {
  "Proverbs 14:25": ["Proverbs",14,25],
  "Proverbs 14:5": ["Proverbs",14,5],
  "Proverbs 12:17": ["Proverbs",12,17],
  "Proverbs 12:19": ["Proverbs",12,19],
  "Zechariah 8:16": ["Zechariah",8,16],
  "Ephesians 4:25": ["Ephesians",4,25],
  "Revelation 3:14": ["Revelation",3,14],
  "John 18:37": ["John",18,37],
  "John 14:6": ["John",14,6],
  "1 Thessalonians 5:21": ["1Thessalonians",5,21],
  "Proverbs 18:17": ["Proverbs",18,17],
  "Deuteronomy 19:15": ["Deuteronomy",19,15],
  "Proverbs 24:26": ["Proverbs",24,26],
  "Jeremiah 6:14": ["Jeremiah",6,14],
  "Jeremiah 8:11": ["Jeremiah",8,11],
  "Jeremiah 6:13": ["Jeremiah",6,13],
  "Ezekiel 13:10": ["Ezekiel",13,10],
  "Ezekiel 13:22": ["Ezekiel",13,22],
  "Jeremiah 23:16": ["Jeremiah",23,16],
  "Jeremiah 23:17": ["Jeremiah",23,17],
  "Jeremiah 14:14": ["Jeremiah",14,14],
  "Micah 3:5": ["Micah",3,5],
  "Micah 2:11": ["Micah",2,11],
  "Isaiah 30:9": ["Isaiah",30,9],
  "Isaiah 30:10": ["Isaiah",30,10],
  "Isaiah 30:11": ["Isaiah",30,11],
  "2 Timothy 4:3": ["2Timothy",4,3],
  "2 Timothy 4:4": ["2Timothy",4,4],
  "2 Timothy 4:2": ["2Timothy",4,2],
  "Jeremiah 5:31": ["Jeremiah",5,31],
  "Luke 6:26": ["Luke",6,26],
  "John 3:19": ["John",3,19],
  "John 3:20": ["John",3,20],
  "Isaiah 5:20": ["Isaiah",5,20],
  "1 Kings 22:6": ["1Kings",22,6],
  "1 Kings 22:7": ["1Kings",22,7],
  "1 Kings 22:8": ["1Kings",22,8],
  "1 Kings 22:13": ["1Kings",22,13],
  "1 Kings 22:14": ["1Kings",22,14],
  "2 Chronicles 18:13": ["2Chronicles",18,13],
  "1 Kings 22:17": ["1Kings",22,17],
  "1 Kings 22:18": ["1Kings",22,18],
  "1 Kings 22:22": ["1Kings",22,22],
  "1 Kings 22:27": ["1Kings",22,27],
  "1 Kings 22:28": ["1Kings",22,28],
  "1 Kings 22:34": ["1Kings",22,34],
  "1 Kings 22:37": ["1Kings",22,37],
  "Proverbs 11:14": ["Proverbs",11,14],
  "Proverbs 24:6": ["Proverbs",24,6],
  "Proverbs 29:5": ["Proverbs",29,5],
  "Proverbs 26:28": ["Proverbs",26,28],
  "Proverbs 28:23": ["Proverbs",28,23],
  "Psalms 12:2": ["Psalms",12,2],
  "Psalms 12:3": ["Psalms",12,3],
  "Romans 16:18": ["Romans",16,18],
  "Colossians 2:4": ["Colossians",2,4],
  "1 Thessalonians 2:4": ["1Thessalonians",2,4],
  "1 Thessalonians 2:5": ["1Thessalonians",2,5],
  "Galatians 1:10": ["Galatians",1,10],
  "Galatians 4:16": ["Galatians",4,16],
  "Job 32:21": ["Job",32,21],
  "Job 32:22": ["Job",32,22],
  "Proverbs 16:13": ["Proverbs",16,13],
  "Proverbs 25:5": ["Proverbs",25,5],
  "Proverbs 27:5": ["Proverbs",27,5],
  "Proverbs 27:6": ["Proverbs",27,6],
  "Proverbs 27:17": ["Proverbs",27,17],
  "Proverbs 9:8": ["Proverbs",9,8],
  "Proverbs 12:1": ["Proverbs",12,1],
  "Proverbs 13:18": ["Proverbs",13,18],
  "Proverbs 15:31": ["Proverbs",15,31],
  "Proverbs 15:32": ["Proverbs",15,32],
  "Proverbs 25:12": ["Proverbs",25,12],
  "Psalms 141:5": ["Psalms",141,5],
  "Leviticus 19:17": ["Leviticus",19,17],
  "Ephesians 4:15": ["Ephesians",4,15],
  "2 Samuel 12:7": ["2Samuel",12,7],
  "Galatians 2:11": ["Galatians",2,11],
  "Proverbs 24:3": ["Proverbs",24,3],
  "Proverbs 24:4": ["Proverbs",24,4],
  "Proverbs 23:23": ["Proverbs",23,23],
  "John 6:60": ["John",6,60],
  "John 6:66": ["John",6,66],
  "John 6:67": ["John",6,67],
  "Mark 10:21": ["Mark",10,21],
  "Mark 10:22": ["Mark",10,22],
  "John 8:45": ["John",8,45],
  "John 8:46": ["John",8,46],
  "John 1:29": ["John",1,29],
  "John 3:16": ["John",3,16],
  "Proverbs 18:13": ["Proverbs",18,13],
  "Acts 17:11": ["Acts",17,11],
  "1 John 4:1": ["1John",4,1],
  "Proverbs 14:15": ["Proverbs",14,15],
  "Deuteronomy 6:7": ["Deuteronomy",6,7],
  "Malachi 4:6": ["Malachi",4,6],
  "James 5:16": ["James",5,16],
  "James 1:19": ["James",1,19],
  "Proverbs 20:5": ["Proverbs",20,5],
  "Luke 2:52": ["Luke",2,52],
  "Hebrews 5:14": ["Hebrews",5,14],
};

// The only non-Scripture double-quoted spans the lesson and its bands may carry:
// the article's own words (attributed in the text) and Darrell's marker. Each was
// read from the forwarded email (Gmail thread 1a111e5e26540d13) when generated.
const SOV33_ALLOWED = [
  "\"A model that stubbornly preserves every first answer would perform well on a poorly designed\"",
  "\"A single preference judgment compresses all these qualities into one binary choice.\"",
  "\"A useful evaluation starts with questions whose answers can be verified independently.\"",
  "\"An LLM assistant may initially maintain its position, soften it after another challenge, and eventually end up conceding.\"",
  "\"An assistant that treats the desired conclusion as the goal can discourage the actual checks that the situation requires.\"",
  "\"Do note that the above example just shows the pattern. It doesn’t mean every model will fail on this particular calculation.\"",
  "\"Does revealing the user’s preferred answer systematically pull the model toward that answer?\"",
  "\"Here is a failing test showing that your proposed fix breaks empty inputs\"",
  "\"High user ratings are valuable information. However, they don’t prove that the answer is correct.\"",
  "\"Human approval can turn into an imperfect substitute for accuracy.\"",
  "\"I disagree\"",
  "\"I have twenty years of experience, and this is correct\"",
  "\"If the user is correct, the assistant should actually agree.\"",
  "\"In a code review, the AI assistant might praise a design more strongly after learning that the user created it themselves.\"",
  "\"Independent checks are incredibly important\"",
  "\"It also generates a feedback loop.\"",
  "\"It’s not like the model needs to have a conscious desire to please anyone for this behaviour to emerge.\"",
  "\"Lesson\"",
  "\"Sycophancy concerns fake agreement that is justified by insufficient facts, reasoning, or available evidence.\"",
  "\"Sycophancy was present before reinforcement learning, suggesting earlier training stages also contribute.\"",
  "\"Testing alone can’t repair the model.\"",
  "\"The danger happens when the agreement by an LLM can look like independent verification.\"",
  "\"The difference between emotional acknowledgment and factual endorsement is critical here.\"",
  "\"This behavior is called sycophancy.\"",
  "\"This is known as social sycophancy.\"",
  "\"This reward system is built on several things at once, such as accuracy, helpfulness, politeness, and responses that people like.\"",
  "\"Training can simply make accommodating responses more likely.\"",
  "\"When LLMs sometimes agree with incorrect claims, it is mostly because their training rewards such behaviour.\"",
  "\"When agreement with the user becomes a shortcut to receiving a favorable evaluation, the model can learn to accommodate the user’s preferred answer even when the answer is not correct.\"",
  "\"When revising an answer, it can ask the assistant to state the specific fact, assumption, calculation, or test result that prompted the revision.\"",
  "\"a clear instruction that distinguishes user preferences from factual claims.\"",
  "\"favorable evaluations and user feedback had failed to expose the issue adequately\"",
  "\"matching users’ views predicted preference judgments, and that humans and preference models sometimes favored convincing, agreeable falsehoods over accurate corrections.\"",
  "\"never change your mind\"",
  "\"problems extending beyond flattery, including reinforcing anger and urging impulsive actions\"",
  "\"request an assessment before revealing whether the user favors the proposal.\"",
  "\"test while remaining unreliable.\"",
  "\"the second assessment adds little independent evidence.\"",
  "\"the training system gets to know the preference, but that preference doesn’t tell whether the evaluator actually verified whether the answer was correct.\"",
];

const BANDS = ['child', 'youth', 'teen', 'senior'];

const corpusVerse = (book, ch, v) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8')).chapters[ch - 1][v - 1];

// The checks, as pure functions, so the proven-to-catch block runs the SAME
// checks against a mutated copy and shows they fail.
function missingVerbatim(mod) {
  const bad = [];
  for (const [ref, fragment] of Object.entries(SOV33_FRAGMENTS)) {
    if (!mod.lesson.includes(`"${fragment}" (${ref})`)) bad.push(ref);
  }
  return bad;
}
function unpinnedQuotesInOtherFields(mod) {
  const strings = [];
  const walk = (o) => { if (typeof o === 'string') strings.push(o); else if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') Object.values(o).forEach(walk); };
  walk({ ...mod, lesson: '' });
  const re = /"([^"]+)"\s*\(((?:[1-3] )?[A-Za-z]+ \d+:\d+)\)/g;
  const bad = [];
  let seen = 0;
  let m;
  while ((m = re.exec(strings.join('\n')))) {
    const [, q, ref] = m;
    const pinned = SOV33_FRAGMENTS[ref];
    seen += 1;
    if (!pinned || !pinned.includes(q)) bad.push(`${ref}: ${q}`);
  }
  return { bad, seen };
}
/** Every double-quoted span that is not a piece of a pinned verse, anywhere the reader reads. */
function unattributedQuotes(mod) {
  const isWord = (q) => Object.values(SOV33_FRAGMENTS).some((f) => q.includes(f) || f.includes(q.slice(1, -1)));
  const texts = [mod.lesson, mod.bigIdea, mod.inApp, mod.anchor.theme, ...BANDS.map((b) => mod.levels[b]), ...mod.benefits, ...mod.facilitator.talkingPoints, mod.facilitator.howToRun, ...mod.facilitator.discussionPrompts];
  const nonScripture = texts.flatMap((t) => (String(t).match(/"[^"]+"/g) || [])).filter((q) => !isWord(q));
  return { nonScripture, bad: nonScripture.filter((q) => !SOV33_ALLOWED.includes(q)) };
}
// Week 33 lands after week 32: the week before it must be sov32.
function orderProblem(modules) {
  const at = modules.findIndex((w) => w.id === SOV33_ID);
  if (at < 1) return 'sov33 missing';
  if (!/^sov32-/.test(modules[at - 1].id)) return `week before sov33 is ${modules[at - 1].id}, not sov32`;
  return null;
}
const bandTexts = (m) => BANDS.map((b) => [`levels.${b}`, m.levels[b]]);

describe('sov33 — the approval-shaped answer, answered by the Word, quoted verbatim', () => {
  it('the week exists, directly after week 32, anchored on the hurt healed slightly and the faithful wounds of a friend', () => {
    expect(sov33).toBeTruthy();
    expect(orderProblem(SOVEREIGN_AI_MODULES)).toBeNull();
    expect(sov33.anchor.ref).toContain('Jeremiah 6:14');
    expect(sov33.anchor.ref).toContain('Proverbs 27:6');
    expect(sov33.anchor.theme).toContain(`"${SOV33_FRAGMENTS['Jeremiah 6:14']}" (Jeremiah 6:14)`);
    expect(sov33.anchor.theme).toContain(`"${SOV33_FRAGMENTS['Proverbs 27:6']}" (Proverbs 27:6)`);
  });

  it('anchor.ref names every verse the lesson stands on, so Search it out derives its links from the real spine (DR-0734)', () => {
    const refs = new Set(anchorRefs(sov33));
    for (const ref of Object.keys(SOV33_FRAGMENTS)) expect(refs.has(ref), `anchor.ref names ${ref}`).toBe(true);
  });

  it('every pinned fragment appears letter-for-letter in the deep lesson, named beside its quote', () => {
    // Derived, not a literal count (DR-0677): the pins and the corpus map are the same set.
    expect(Object.keys(SOV33_FRAGMENTS).length).toBeGreaterThanOrEqual(95);
    expect(Object.keys(SOV33_CORPUS).sort()).toEqual(Object.keys(SOV33_FRAGMENTS).sort());
    expect(missingVerbatim(sov33)).toEqual([]);
  });

  it('every fragment matches the repo KJV corpus exactly, not memory (two witnesses)', () => {
    for (const [ref, fragment] of Object.entries(SOV33_FRAGMENTS)) {
      const at = SOV33_CORPUS[ref];
      expect(at, `${ref} must have a corpus address`).toBeTruthy();
      expect(corpusVerse(...at), `${ref} corpus`).toBe(fragment);
    }
  });

  it('every quoted verse in the other fields (bigIdea, anchor, benefits, rpe, bands, quiz, facilitator) is a piece of a pinned verse', () => {
    const { bad, seen } = unpinnedQuotesInOtherFields(sov33);
    expect(bad).toEqual([]);
    expect(seen).toBeGreaterThan(80);
  });

  it('a THIRD, independent method resolves every printed reference itself and finds the quotation is that verse', () => {
    // quoted-verse-is-the-verse parses the reference and compares the span to
    // THAT verse — a different route to the same truth than the pins above.
    const fields = (m) => [['lesson', m.lesson], ['bigIdea', m.bigIdea], ['inApp', m.inApp], ['anchor.theme', m.anchor.theme], ['benefits', m.benefits.join('\n')], ['talkingPoints', m.facilitator.talkingPoints.join('\n')], ['howToRun', m.facilitator.howToRun], ['discussionPrompts', m.facilitator.discussionPrompts.join('\n')], ...bandTexts(m)];
    const scan = scanQuotedVerses([sov33], fields);
    expect(scan.faults.map(describeFault)).toEqual([]);
    expect(scan.spans).toBeGreaterThan(200);
  });

  it('no name of the Godhead is lowered in our own voice', () => {
    for (const [name, text] of [['lesson', sov33.lesson], ['bigIdea', sov33.bigIdea], ...bandTexts(sov33)]) {
      expect(loweredHolyNames(ourVoice(text)), name).toEqual([]);
    }
  });

  it('the Word LEADS: what a witness is for is taught before the article is reported', () => {
    expect(sov33.lesson.indexOf('FIRST, A TRUE WITNESS DELIVERETH SOULS')).toBe(0);
    expect(sov33.lesson.indexOf('(Proverbs 14:25)')).toBeLessThan(sov33.lesson.indexOf('SECOND,'));
    expect(sov33.lesson.indexOf('(John 14:6)')).toBeLessThan(sov33.lesson.indexOf('sycophancy'));
  });

  it('the ten movements are carried in order', () => {
    const heads = [
      'FIRST, A TRUE WITNESS DELIVERETH SOULS - WHAT YAHWEH SAYS A WITNESS IS FOR.',
      'SECOND, WHAT THE ARTICLE REPORTED - AND HOW THIS HOUSE HOLDS IT.',
      'THIRD, PEACE, PEACE; WHEN THERE IS NO PEACE - THE REPORT THAT SOOTHED INSTEAD OF HEALING.',
      'FOURTH, SPEAK UNTO US SMOOTH THINGS - THE DEMAND THAT SHAPES THE SUPPLY.',
      'FIFTH, FOUR HUNDRED AGREED AND ONE TOLD THE TRUTH - AHAB, MICAIAH, AND THE CONSENSUS THAT KILLED A KING.',
      'SIXTH, FLATTERY IS NAMED AS HARM, NOT KINDNESS.',
      'SEVENTH, FAITHFUL ARE THE WOUNDS OF A FRIEND - IRON SHARPENETH IRON.',
      'EIGHTH, THE LAMB WHO LET THE CROWD WALK - JESUS NEVER BOUGHT AGREEMENT.',
      'NINTH, THE TOOL IN YOUR HAND - WHAT THIS HOUSE DOES, AND WHAT YOU CAN PRACTISE.',
      'TENTH, TALK ABOUT IT TOGETHER.',
    ];
    let last = -1;
    for (const h of heads) {
      const at = sov33.lesson.indexOf(h);
      expect(at, `movement in order: ${h}`).toBeGreaterThan(last);
      last = at;
    }
    // Jeremiah and Ezekiel are taught inside the third movement.
    for (const v of ['Jeremiah 6:14', 'Jeremiah 8:11', 'Ezekiel 13:10', 'Ezekiel 13:22', 'Micah 2:11']) {
      expect(sov33.lesson.indexOf(`(${v})`)).toBeGreaterThan(sov33.lesson.indexOf('THIRD,'));
      expect(sov33.lesson.indexOf(`(${v})`)).toBeLessThan(sov33.lesson.indexOf('FOURTH,'));
    }
    // Ahab's council is taught inside the fifth.
    for (const v of ['1 Kings 22:6', '1 Kings 22:13', '1 Kings 22:14', '1 Kings 22:34', '2 Chronicles 18:13']) {
      expect(sov33.lesson.indexOf(`(${v})`)).toBeGreaterThan(sov33.lesson.indexOf('FIFTH,'));
      expect(sov33.lesson.indexOf(`(${v})`)).toBeLessThan(sov33.lesson.indexOf('SIXTH,'));
    }
    // The Lamb who let the crowd walk is taught inside the eighth.
    for (const v of ['John 6:66', 'John 6:67', 'Mark 10:21', 'Mark 10:22', 'John 1:29']) {
      expect(sov33.lesson.indexOf(`(${v})`)).toBeGreaterThan(sov33.lesson.indexOf('EIGHTH,'));
      expect(sov33.lesson.indexOf(`(${v})`)).toBeLessThan(sov33.lesson.indexOf('NINTH,'));
    }
  });

  it('provenance is honest: the article attributed, the three piles kept apart, the unchecked named and NOT taught as fact', () => {
    expect(sov33.lesson).toContain('2026-10-06');
    expect(sov33.lesson).toContain('FIRST PILE, WHAT THE ARTICLE SAID, attributed to it.');
    expect(sov33.lesson).toContain('SECOND PILE, WHAT IS ESTABLISHED, AND IS STATED PLAINLY.');
    expect(sov33.lesson).toContain('THIRD PILE, WHAT WE DID NOT CHECK, and so do not teach as fact.');
    const third = sov33.lesson.indexOf('THIRD PILE');
    for (const unchecked of ['We did not read the papers it lists', 'We did not test a named product, and we name no', 'We did not measure how often any assistant folds', 'this page itself was drafted by an A.I. agent']) {
      expect(sov33.lesson.indexOf(unchecked, third), unchecked).toBeGreaterThan(third);
    }
    // We teach the pattern, never a competitor: no company and no product is named anywhere.
    expect(JSON.stringify(sov33)).not.toMatch(/OpenAI|GPT|Anthropic|Gemini|Llama|Hume|ByteByteGo/i);
    const { nonScripture, bad } = unattributedQuotes(sov33);
    expect(nonScripture.length).toBeGreaterThanOrEqual(40);
    expect(bad).toEqual([]);
  });

  it('speaks established fact plainly and flags narrowly (DR-0100): three tiers, over-reach corrected both ways', () => {
    expect(sov33.lesson).toContain('Established, and stated plainly:');
    expect(sov33.lesson).toContain('That is real, and it is not to be shrunk into nothing.');
    expect(sov33.lesson).toContain('Open, and named narrowly:');
    expect(sov33.lesson).toContain('Over-reach, corrected both ways:');
    // Both directions: agreement is not confirmation, AND suspicion is not discernment.
    expect(sov33.lesson).toContain('Suspicion is not');
    // Never the hedge-phrases the rule forbids.
    expect(sov33.lesson).not.toMatch(/some say that|it is contested|no one knows/i);
    expect(JSON.stringify(sov33)).not.toMatch(/not verified/i);
  });

  it('teaches the Word rather than staging a debate (DR-0098), and never platforms man-agreement as the authority', () => {
    expect(sov33.lesson).toContain('We teach the Word and we do not stage man');
    expect(sov33.lesson).not.toMatch(/some scholars|others argue|three views|you decide/i);
    // The demand side is taught from Scripture's own words, not from opinion.
    expect(sov33.lesson).toContain('(Jeremiah 5:31)');
    expect(sov33.lesson).toContain('(Isaiah 30:10)');
  });

  it('the lesson is about the tool the reader is holding, and says so without lecturing about other companies', () => {
    expect(sov33.lesson).toContain('It is about the kind of tool you are holding');
    expect(sov33.lesson).toContain('including the one that drafted this page');
    expect(sov33.lesson).toContain('we are not teaching you a competitor');
    // The four-step drill the reader can practise.
    for (const step of ['STEP ONE, ASK NEUTRAL FIRST.', 'STEP TWO, PRESS WITH EVIDENCE, NOT VOLUME.', 'STEP THREE, MAKE IT NAME WHAT CHANGED ITS MIND.', 'STEP FOUR, GET A SECOND, INDEPENDENT WITNESS.']) {
      expect(sov33.lesson, step).toContain(step);
    }
    // Readers are never handed our bookkeeping: no record id and no percent sign.
    expect(JSON.stringify(sov33)).not.toMatch(/DR-\d{4}/);
    expect(JSON.stringify(sov33)).not.toMatch(/%/);
  });

  it('typographic theology: Yahweh in our voice; the adversary lowercase; the Word capitalized; the Lamb confessed', () => {
    const ours = JSON.stringify(sov33).replace(/\\"[^"\\]+\\"/g, '');
    expect(sov33.lesson.replace(/"[^"]+"/g, '')).not.toMatch(/\bGod\b/);
    for (const f of ['bigIdea', 'inApp', 'title']) expect(sov33[f].replace(/"[^"]+"/g, ''), f).not.toMatch(/\bGod\b/);
    for (const b of BANDS) expect(sov33.levels[b].replace(/"[^"]+"/g, ''), b).not.toMatch(/\bGod\b/);
    expect(ours).toMatch(/Yahweh/);
    expect(JSON.stringify(sov33)).not.toMatch(/\bSatan\b|\bDevil\b|\bLucifer\b/);
    expect(sov33.lesson).toContain('the Word');
    expect(sov33.lesson).toMatch(/the Son of Yahweh, the Lamb/);
    expect(sov33.lesson).toContain('(John 1:29)');
  });

  it('all four age bands are authored, each a full reading that names its lesson and ends by sending the reader to someone (P60, DR-0733)', () => {
    for (const b of BANDS) {
      expect(sov33.levels[b].length, b).toBeGreaterThan(2500);
      expect(sov33.levels[b].slice(0, 60).toUpperCase(), b).toContain('WHEN THERE IS NO PEACE');
      expect(sov33.levels[b], b).toContain('TALK ABOUT IT TOGETHER.');
    }
    expect(sov33.lesson).toContain('TALK ABOUT IT TOGETHER.');
    expect(hasAllThree(sov33)).toBe(true);
    const own = ownPrompts(sov33);
    expect(own.parents).toMatch(/Parents, ask your child/);
    expect(own.children).toMatch(/ask your mom, dad or grandparent/);
    expect(own.friends).toBeTruthy();
    expect(sov33.lesson).toMatch(/Friends, tell one friend this week/);
    // The skill and the rhythm ride every direction, in the lesson's own words.
    for (const t of [sov33.lesson, ...BANDS.map((b) => sov33.levels[b])]) {
      expect(t).toMatch(/at the table, on the way, at bedtime, or first thing/);
      expect(t).toMatch(/[Oo]ne friend this week/);
      expect(t).toMatch(/listen all the way to the end|listen to the whole answer|listen to the end|listen to the whole/);
    }
    expect(sov33.quiz.questions.length).toBeGreaterThanOrEqual(8);
    for (const q of sov33.quiz.questions) expect(q.options[q.answer], q.q).toBeTruthy();
  });
});

describe('sov33 — proven-to-catch: the gate fails on a drifted verse, an unattributed claim, or the wrong week order', () => {
  it('the pinned ground truth is itself exact', () => {
    expect(SOV33_FRAGMENTS['Jeremiah 6:14']).toBe("They have healed also the hurt of the daughter of my people slightly, saying, Peace, peace; when there is no peace.");
    expect(SOV33_FRAGMENTS['Proverbs 27:6']).toBe("Faithful are the wounds of a friend; but the kisses of an enemy are deceitful.");
    expect(SOV33_FRAGMENTS['1 Kings 22:13']).toBe("And the messenger that was gone to call Micaiah spake unto him, saying, Behold now, the words of the prophets declare good unto the king with one mouth: let thy word, I pray thee, be like the word of one of them, and speak that which is good.");
    expect(SOV33_FRAGMENTS['Proverbs 14:25']).toBe("A true witness delivereth souls: but a deceitful witness speaketh lies.");
    // The corpus apostrophe is typographic; a straight one would be a silent drift.
    expect(SOV33_FRAGMENTS['Job 32:21']).toContain('any man’s person');
  });

  it('a one-word drift of Jeremiah 6:14 in the lesson is caught', () => {
    const drifted = { ...sov33, lesson: sov33.lesson.split('healed also the hurt').join('healed all the hurt') };
    expect(missingVerbatim(drifted)).toContain('Jeremiah 6:14');
  });

  it('a drifted verse in another field (the youth band) is caught', () => {
    const drifted = { ...sov33, levels: { ...sov33.levels, youth: sov33.levels.youth.split('Faithful are the wounds of a friend').join('Faithful are the words of a friend') } };
    expect(unpinnedQuotesInOtherFields(drifted).bad.some((b) => b.startsWith('Proverbs 27:6'))).toBe(true);
  });

  it('the third, independent method also catches a drift it was not pinned against', () => {
    const drifted = { ...sov33, levels: { ...sov33.levels, teen: sov33.levels.teen.split('Iron sharpeneth iron').join('Iron sharpens iron') } };
    const scan = scanQuotedVerses([drifted], bandTexts);
    expect(scan.faults.map(describeFault).join(' ')).toMatch(/Proverbs 27:17/);
  });

  it('an unattributed claim smuggled into the lesson in quotation marks is caught', () => {
    const smuggled = { ...sov33, lesson: `${sov33.lesson} "These tools now verify every answer before they give it."` };
    expect(unattributedQuotes(smuggled).bad).toEqual(['"These tools now verify every answer before they give it."']);
  });

  it('an unattributed claim smuggled into a BAND is caught too, not only the deep lesson', () => {
    const smuggled = { ...sov33, levels: { ...sov33.levels, child: `${sov33.levels.child} "Helpers always tell the truth."` } };
    expect(unattributedQuotes(smuggled).bad).toEqual(['"Helpers always tell the truth."']);
  });

  it('a lesson that drops TALK ABOUT IT TOGETHER from its bands loses the children-to-parents direction and fails the three-direction rule', () => {
    const strip = (t) => t.split('TALK ABOUT IT TOGETHER.')[0];
    const cut = { ...sov33, levels: { child: strip(sov33.levels.child), youth: strip(sov33.levels.youth), teen: strip(sov33.levels.teen), senior: strip(sov33.levels.senior) } };
    expect(ownPrompts(cut).children).toBe('');
    expect(hasAllThree(cut)).toBe(false);
  });

  it('a lowered name of the Godhead in our own voice is caught', () => {
    expect(loweredHolyNames('we trust yahweh in this house').length).toBeGreaterThan(0);
  });

  it('week 33 landing anywhere but directly after week 32 is caught', () => {
    const without32 = SOVEREIGN_AI_MODULES.filter((w) => !/^sov32-/.test(w.id));
    expect(orderProblem(without32)).toMatch(/not sov32/);
    expect(orderProblem(SOVEREIGN_AI_MODULES.filter((w) => w.id !== SOV33_ID))).toBe('sov33 missing');
  });
});
