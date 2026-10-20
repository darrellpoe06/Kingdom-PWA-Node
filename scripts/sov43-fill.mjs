// =============================================================================
// sov43-fill — build Sovereign A.I. week 43 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076). Every quoted verse on this
// page is FILLED FROM app/public/bible/kjv at build time. The prose below holds
// only a reference in double brackets, [[Deuteronomy 15:2]], and this script
// replaces it with the corpus text followed by the reference. No verse on the
// page was typed from memory, so a verse cannot drift from the text and a
// quotation cannot be approximate. The reference list on the module's anchor is
// DERIVED from the same placeholders (DR-0734 in both directions).
//
// WHERE THE WORD CAME FROM. On 2026-10-20 Darrell was reading week 42 in the
// app, at step 13 of 31, the step where Yahweh attaches His own name to a
// release of debt (Deuteronomy 15:2), and spoke a lesson into the app:
// "Work beside learning is apostolic, not experimental: Lords Release...
// Details Word first algorithms across the Word... explain apostolic etc...
// context is King..." He then said, when the agent began editing week 42:
// "This is a separate lesson... unique to what I'm asking!" So this is its own
// week, built on his five phrases, not an edit to the week he was reading.
//
// Run from the repository root:  node scripts/sov43-fill.mjs   (--rebuild to replace)
// =============================================================================
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 43;
const ID = 'sov43-work-beside-learning-is-apostolic-and-the-release-that-carries-his-name';

// -----------------------------------------------------------------------------
// The corpus
// -----------------------------------------------------------------------------
const books = new Set(readdirSync(KJV).filter((f) => f.endsWith('.json') && f !== 'index.json').map((f) => f.slice(0, -5)));
const cache = new Map();

function bookFile(name) {
  const k = String(name).replace(/\s+/g, '');
  if (books.has(k)) return k;
  if (books.has(`${k}s`)) return `${k}s`;
  return null;
}

function verseText(ref) {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(String(ref).trim());
  if (!m) throw new Error(`sov43: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov43: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov43: reference does not resolve in the corpus -> "${ref}"`);
  return text;
}

const used = [];
const seen = new Set();

function fill(text) {
  return String(text).replace(/\[\[([^\]]+)\]\]/g, (_, ref) => {
    const r = ref.trim();
    const t = verseText(r);
    if (!seen.has(r)) { seen.add(r); used.push(r); }
    return `"${t}" (${r})`;
  });
}

function fillDeep(value) {
  if (typeof value === 'string') return fill(value);
  if (Array.isArray(value)) return value.map(fillDeep);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = fillDeep(v);
    return out;
  }
  return value;
}

// -----------------------------------------------------------------------------
// The talk-together close, in this lesson's own words, in all three directions,
// at each band's own level (DR-0795: a reader reads ONE band).
// -----------------------------------------------------------------------------
const RHYTHM = 'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at bedtime, or first thing - and with one friend this week.';
const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what does it mean that a release of debt has Yahweh's own name on it - and listen all the way to the end, have them retell it in their own words, then teach them one verse back, Deuteronomy 15:2. Children, ask your mom, dad or grandparent what they were ever released from and who released them, listen all the way through, then retell their answer in your own words. Friends, tell one friend this week one thing this lesson showed you about reading a verse inside its context, ask what they see, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM} Measure the growth the Word's way: by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days, [[Hebrews 3:13]]`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what is a release - and listen all the way to the end, have them retell it in their own words, then teach them one verse back, Matthew 6:12. Children, ask your mom or dad or grandma or grandpa about a time somebody forgave them, listen all the way through, then retell it in your own words. Friends, tell one friend this week that Jesus is the release, ask what they think, and pray for each other, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - which of the five steps do you skip when you read a verse - and listen all the way to the end, have them retell the five steps in their own words, then teach them one verse back, Nehemiah 8:8. Children, ask your mom, dad or grandparent what an apostle is and whether they have ever followed one, listen all the way through, then retell their answer in your own words. Friends, tell one friend this week one thing this lesson showed you about the word apostolic, ask what they see, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - where did you last hear a verse used without its context, and what did the context turn out to say - and listen all the way to the end, have them retell the difference in their own words, then teach them one verse back, Deuteronomy 15:3. Children, ask your mom, dad or grandparent which of the apostles' patterns they have actually walked in, listen all the way through, then retell it in your own words. Friends, tell one friend this week one thing this lesson showed you about the release that carries His name, ask what they see, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM} Measure the growth the Word's way: by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days, [[Hebrews 3:13]]`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the children in your house one open question today - what debt did Jesus release you from, and when did you first know it - and listen all the way to the end, have them retell it in their own words, then teach them one verse back, Colossians 2:14. Children, ask your parents or grandparents what trade they learned beside their schooling and who taught it, listen all the way through, then retell it back to them in your own words. Friends, tell one friend this week one thing this lesson showed you about running the Word across the Word, ask what they see, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson, in ten movements. The Word first in every one of them.
// -----------------------------------------------------------------------------
const LESSON = [

`FIRST, WHAT WAS SAID, AND WHY IT IS ITS OWN LESSON. On 2026-10-20 Darrell was reading week 42 in the app, at the step where Yahweh attaches His own name to a release of debt, and he spoke a word into the app rather than past it. Rendered for its meaning and kept in his order: work beside learning is apostolic, not experimental; the Lord's release; the details, by a Word-first algorithm run across the Word; explain what apostolic means; and context is King. Week 42 said the first two of those in a sentence each, inside a lesson about a news digest. This week is not that lesson. It takes his five phrases as the whole subject and works each one the way the Word explains it, so that a reader can run the method himself on any verse he is handed, and so that "apostolic" is never again a word this house uses without saying what it means. An A.I. agent drafted this page from his words and the Word; the gates, not its confidence, decided whether it shipped, and every verse on it was fetched from the family's own corpus rather than typed.`,

`SECOND, THE WORD-FIRST ALGORITHM, STATED SO ANYBODY CAN RUN IT. An algorithm is a fixed sequence of steps that gives the same answer to everybody who runs it honestly, and the Word had one long before the word existed. Step one: start with the verse, as written, and take it as true. [[Psalms 119:160]] Step two: read the sentence before it and the sentence after it, then the chapter, then the book, then the covenant it sits in, and give the sense. [[Nehemiah 8:8]] That is the step Ezra's Levites ran for a whole city standing in the street; reading distinctly and giving the sense is one act, not two. Step three: run the verse across the Word. Find every place the Word speaks of the same thing and let the Word explain the Word: [[Isaiah 28:10]] [[1 Corinthians 2:13]] No verse is a private island, because the same Spirit breathed all of them: [[2 Peter 1:20]] [[2 Peter 1:21]] The risen Lord Jesus ran this step Himself on the Emmaus road, [[Luke 24:27]] and again in the upper room: [[Luke 24:44]] [[Luke 24:45]] Step four: divide it rightly. A law given to Israel's covenant family, a letter to a church, a promise to a king, a proverb's general rule - each is kept in its own place, and the workman who does this has nothing to be ashamed of: [[2 Timothy 2:15]] Step five, and only now: weigh the thing in front of you - the news story, the policy, the plan, the sermon - against what the Word has already said, the Berean way: [[Acts 17:11]] [[John 5:39]] The order is the whole discipline. Most arguments among believers are two people who ran step five first.`,

`THIRD, CONTEXT IS KING - RUN IT ON THE VERY VERSE HE WAS READING. The verse: [[Deuteronomy 15:2]] Now the sentence before it, which sets the clock: [[Deuteronomy 15:1]] Now the sentence after it, which changes the reading more than any commentary could: [[Deuteronomy 15:3]] The release is a law for Yahweh's covenant family - brother to brother, neighbour to neighbour - and the foreigner outside the covenant may still be asked. So the release is not a universal cancellation of every debt in the world, and a house that reads it that way has stopped at step one. Read on. The promise, with its condition in the next breath: [[Deuteronomy 15:4]] [[Deuteronomy 15:5]] Then the sin the release tempts, named before anybody commits it - the lender who closes his hand because the seventh year is near: [[Deuteronomy 15:9]] [[Deuteronomy 15:10]] [[Deuteronomy 15:11]] And then the reason underneath the whole chapter, without which verse 2 is a bookkeeping rule and with which it is worship: [[Deuteronomy 15:15]] That is what context is King means. The release is redemption remembered on a calendar: a people who were themselves released by Yahweh's own hand release their brother on His schedule. Take verse 15 away and you have an economics proposal. Put it back and you have the gospel written into the law. Context did not soften the verse. It gave the verse its weight.`,

`FOURTH, THE RELEASE RUN ACROSS THE WORD - IT IS CALLED HIS BECAUSE HE IS THE RELEASER. Now step three, across the Word, on the same subject. It begins before Deuteronomy, in the first law code after Sinai: [[Exodus 21:2]] It widens into the fiftieth year: [[Leviticus 25:10]] It is the clock we read: [[Deuteronomy 15:1]] It was kept, by name, when the people came home from exile and bound themselves to it: [[Nehemiah 10:31]] It was broken, and Yahweh answered the breaking in His own words. Zedekiah's Jerusalem proclaimed a release, [[Jeremiah 34:8]] [[Jeremiah 34:9]] [[Jeremiah 34:10]] and then took it back: [[Jeremiah 34:11]] Yahweh reminded them whose release it was, [[Jeremiah 34:14]] and proclaimed a liberty of His own: [[Jeremiah 34:17]] A release taken back is not a broken policy; it is a broken covenant with Him, because the release carries His name. Then the prophet speaks of a release in a Person: [[Isaiah 61:1]] [[Isaiah 61:2]] And the Lord Jesus stands up in Nazareth, reads that scroll, [[Luke 4:18]] [[Luke 4:19]] and says the one thing no prophet could say: [[Luke 4:21]] The acceptable year of the Lord is the release, and He is it. He taught His disciples to pray it: [[Matthew 6:12]] He told of a king who released a debt no servant could pay and expected the release to run downstream: [[Matthew 18:27]] [[Matthew 18:32]] [[Matthew 18:33]] And Paul says what the Blood did with the handwriting that stood against us: [[Colossians 2:14]] Then Paul does it himself, in a letter about one runaway slave, with his own hand: [[Philemon 1:18]] [[Philemon 1:19]] Put the whole thread beside Deuteronomy 15:2 and the verse reads itself. It is called the LORD's release because He is the Releaser, and every release His people ever made was a copy of His. The Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne is for ever, [[Hebrews 1:8]] is the release the law was pointing at.`,

`FIFTH, "APOSTOLIC" EXPLAINED - A SENT ONE'S PATTERN, CARRIED WITH HIS AUTHORITY. The word first. An apostle is a sent one; the Lord Jesus used the plain word for it when He said: [[John 13:16]] He chose twelve and gave them that name: [[Luke 6:13]] He is Himself the first Apostle, the One the Father sent: [[Hebrews 3:1]] And He sent them as He was sent: [[John 20:21]] So apostolic does not mean old, or formal, or the name on a denomination's sign. It means the pattern the sent ones received from Him, lived in front of the churches, and taught as doctrine - the thing the first church continued steadfastly in: [[Acts 2:42]] It is the foundation the household of Yahweh is built upon, with Him as the corner stone: [[Ephesians 2:20]] Paul says where he got it: [[Galatians 1:11]] [[Galatians 1:12]] And he says what to do with it: [[1 Corinthians 11:1]] [[2 Thessalonians 3:9]] An ensample to follow. That is the test for whether a practice is apostolic: did the sent ones receive it from Him, live it, and leave it to be followed. If yes, it is not ours to experiment with. It is ours to walk in.`,

`SIXTH, WORK BESIDE LEARNING IS APOSTOLIC, NOT EXPERIMENTAL - THE THREAD ACROSS THE WORD. Run step three again, on Darrell's first phrase. Begin with the Sent One Himself. Nazareth knew Him by a trade before it knew Him by a sermon: [[Mark 6:3]] Thirty years at a bench and three years teaching, and the forming He did in the bench years is recorded: [[Luke 2:52]] The men He sent were working men, called from their nets mid-cast: [[Matthew 4:18]] [[Matthew 4:19]] Paul, the apostle to the nations, in Corinth: [[Acts 18:3]] In his farewell to the elders of Ephesus: [[Acts 20:33]] [[Acts 20:34]] [[Acts 20:35]] To Corinth, about his own hands: [[1 Corinthians 4:12]] To Thessalonica, with the hours named and the reason named: [[1 Thessalonians 2:9]] And then the word that settles whether this was a hardship he endured or a pattern he taught: [[2 Thessalonians 3:7]] [[2 Thessalonians 3:8]] [[2 Thessalonians 3:9]] [[2 Thessalonians 3:10]] He had the power to be supported and laid it down on purpose, to leave an ensample. The taught were told the same: [[1 Thessalonians 4:11]] [[1 Thessalonians 4:12]] [[Ephesians 4:28]] Now the difference between apostolic and experimental, plainly. An experiment is something tried to find out whether it works. An apostolic pattern is something received because it already did, from men who were sent to hand it on. Yahweh told us which of the two to ask for: [[Jeremiah 6:16]] and told us not to be surprised that the good way is old: [[Ecclesiastes 1:9]] So when a college in Kentucky puts ten hours of work a week beside the classroom and its students leave without debt, that is not an innovation to be studied. It is the old path with a registrar attached, and the forming it buys is the forming the Word described: [[Hebrews 5:14]]`,

`SEVENTH, CONTEXT IS KING HERE TOO - THE LIMIT PAUL HIMSELF NAMED. Step four, rightly dividing, keeps this pattern from becoming a club. The same Paul who made tents wrote, in the same letter where he laid the right down, that the right exists: [[1 Corinthians 9:14]] and that he, personally, had chosen not to use it: [[1 Corinthians 9:15]] [[1 Corinthians 9:18]] The Lord Jesus said it first when He sent the twelve, [[Matthew 10:10]] and the seventy, [[Luke 10:7]] and Paul quotes Him as Scripture: [[1 Timothy 5:18]] So "work beside learning is apostolic" does not mean a teacher may not be paid, and it does not mean a student who cannot work has failed. Context says Paul laid down a right for a reason he names: that the gospel would cost his hearers nothing, and that they would have an example to follow. A reader who takes 2 Thessalonians 3:10 out of its chapter to shame the sick, the widow, or the apprentice who is still learning has run step five before step two. The Word is not against a paid teacher. It is for a formed one.`,

`EIGHTH, THE TWO PHRASES IN ONE BREATH - WHY HE SAID THEM TOGETHER. Darrell put the release and the work in the same sentence, and the Word shows why they belong together. The release answers a debt already contracted: Yahweh's scheduled remedy, bearing His name, copied by every believer who forgives as he was forgiven. Work beside learning keeps the debt from being contracted in the first place: the forming bought with use in the same years, under the same Master, the hands and the head trained together. One is mercy after the fact; the other is Wisdom before it. Wisdom, Understanding and Knowledge are the Resources Yahweh supplies for the build, and Love is senior to all of them; a house that releases its debtors and forms its children at the bench is a house run on His Resources rather than on a lender's. Both are old, both carry His name, and neither is an experiment.`,

`NINTH, THE THREE TIERS, PLAINLY. ESTABLISHED, and stated as fact: the release is Yahweh's own law, kept in Nehemiah's day and avenged in Jeremiah's; the Lord Jesus read Isaiah's release as His own and declared it fulfilled; the apostles worked with their hands beside their teaching and taught the churches to follow; the Word explains the Word and context governs the sense. Those are not opinions about the text. They are the text. OPEN, and named narrowly: how a modern republic, a university, or a bank ought to schedule a release of debt is a matter the Word does not legislate for them, and this house does not pretend to. The Word gives the principle and the Person, not a statute for anybody's loan book, and it is not a statute book. OVER-REACH, corrected by the Word itself: reading "the LORD's release" as a mandate to cancel every debt everywhere ignores the verse after it, [[Deuteronomy 15:3]] and reading "if any would not work, neither should he eat" as a bar on paid ministry or a verdict on the weak ignores the apostle's own words about the right he laid down: [[1 Corinthians 9:14]] Context is King in both directions.`,

`TENTH, THE CLOSE - THE METHOD IS THE GIFT. What Darrell asked for was not a conclusion but a way of reading that produces conclusions, and that is what this week hands over: the verse, its context, the Word across the Word, the right dividing, and only then the thing in front of you. Run it on the next verse you are handed. Run it on the next sermon. Run it on this page. The Word that explains itself was breathed by the Holy Spirit, and the Son who opened the disciples' understanding on the road is the same today. Then go and release somebody, because you were released, and go and form somebody at the bench, because the Sent One did.`,

];

// -----------------------------------------------------------------------------
// The four age bands, each WRITTEN FOR ITS READER.
// -----------------------------------------------------------------------------
const CHILD = `WORK BESIDE LEARNING IS APOSTOLIC, NOT EXPERIMENTAL - the Lord's release, the Word-first algorithm run across the Word, what apostolic means, and context is King. Those are big words. Let us make them small.

Darrell was reading a Bible lesson in the app. He stopped at one verse. It is about a release. A release means you owed something, and now you do not. Here is the verse. [[Deuteronomy 15:2]] Yahweh put His own name on it. He calls it His release.

Then Darrell said, let us learn HOW to read a verse. There is a way to do it. It is like a recipe. You do the steps in order.

Step one. Read the verse. Believe it. It is true. [[Psalms 119:160]]

Step two. Read what is around it. Read the verse before. Read the verse after. That is called context. Context is King. It is the boss. It tells you what the verse means. The verse before says WHEN the release comes. [[Deuteronomy 15:1]] Every seven years! The verse after says the release is for your brother. [[Deuteronomy 15:3]] And down the page, Yahweh says WHY. [[Deuteronomy 15:15]] You were slaves once. I set you free. So set your brother free. That is the big reason. Without it, the verse is only about money. With it, the verse is about the love of Yahweh.

Step three. Look all over the Bible for the same thing. The Bible explains the Bible. [[Isaiah 28:10]] Jesus stood up in His own town and read about a release. [[Luke 4:18]] Then He said it was about Him. [[Luke 4:21]] Jesus is the release! He forgives what we owe. He taught us to pray for it. [[Matthew 6:12]]

Now the other big word. Apostolic. An apostle is someone who is sent. Jesus sent twelve men. [[Luke 6:13]] Apostolic means the way the sent men lived and taught. It is not an experiment. An experiment is a try. Apostolic is a path that is already proven. Yahweh says to ask for the old path. [[Jeremiah 6:16]]

Here is one thing the sent men did. They worked with their hands while they taught. Paul made tents. [[Acts 18:3]] Jesus was a carpenter first. [[Mark 6:3]] Working while you learn is not new. It is the old way. It is a good way.

So what do we keep? Read the verse. Read around it. Read all over the Bible. Then you will know what it means. And remember who the release is. He is Jesus, the Lamb of Yahweh. [[John 1:29]] The Father gave His only Son. [[John 3:16]] He paid what we owed. That part is finished.`;

const YOUTH = `WORK BESIDE LEARNING IS APOSTOLIC, NOT EXPERIMENTAL - the Lord's release, the Word-first algorithm run across the Word, what apostolic means, and context is King. On 2026-10-20 Darrell was reading week 42 in the app and stopped at one verse, the one where Yahweh puts His own name on a release of debt. Instead of reading past it he spoke a lesson into the app, in five short phrases, and this week is those five phrases worked out from the Word.

PHRASE ONE: A WORD-FIRST ALGORITHM. An algorithm is a list of steps you always do in the same order, so that everybody who runs it gets the same answer. The Word has one for reading the Word. Step one, read the verse as written and take it as true: [[Psalms 119:160]] Step two, read what is around it - the verse before, the verse after, the chapter, the book - and give the sense, the way Ezra's helpers did for a whole crowd: [[Nehemiah 8:8]] Step three, go across the whole Bible and find the other places that speak of the same thing, because the Bible explains the Bible: [[Isaiah 28:10]] Jesus did exactly this for two sad disciples on the road: [[Luke 24:27]] Step four, keep each part in its place - a law for Israel, a letter to a church, a proverb - and divide it rightly: [[2 Timothy 2:15]] Step five, and only now, hold the thing in front of you up to what the Word said, the way the Bereans did: [[Acts 17:11]] Most arguments happen because somebody did step five first.

PHRASE TWO: CONTEXT IS KING. Try the steps on Darrell's verse. The verse: [[Deuteronomy 15:2]] The verse before tells you when: [[Deuteronomy 15:1]] The verse after tells you who it is for, and it is the one people skip: [[Deuteronomy 15:3]] So the release is for Yahweh's own covenant family, brother to brother, and it is not a rule that every debt in the world must vanish. Keep reading and you find the reason under the whole chapter: [[Deuteronomy 15:15]] You were released, so you release. That is why the verse is about worship and not only about money. The context did not make the verse smaller. It made it heavier.

PHRASE THREE: THE LORD'S RELEASE, ACROSS THE WORD. Now run step three. Israel was told to let a servant go free in the seventh year: [[Exodus 21:2]] When the people came home from Babylon they promised to keep the release: [[Nehemiah 10:31]] When a king proclaimed a release and then took it back, Yahweh called it breaking covenant with Him: [[Jeremiah 34:17]] The prophet Isaiah said a release would come in a Person: [[Isaiah 61:1]] And Jesus stood up in Nazareth, read those words, [[Luke 4:18]] and said: [[Luke 4:21]] He is the release. He taught us to pray it: [[Matthew 6:12]] He told of a king who forgave a debt nobody could pay: [[Matthew 18:27]] And Paul says what the cross did to the bill against us: [[Colossians 2:14]] That is why it is called the LORD's release. He is the one who releases, and everybody else is copying Him. Jesus is the Lamb of Yahweh, [[John 1:29]] the Eternal Son the Father gave: [[John 3:16]]

PHRASE FOUR: WHAT APOSTOLIC MEANS. An apostle is a sent one; Jesus used that very word: [[John 13:16]] He chose twelve and named them apostles: [[Luke 6:13]] He Himself is the first Apostle, sent by the Father: [[Hebrews 3:1]] And He sent them the same way: [[John 20:21]] So apostolic means the pattern the sent ones got from Jesus, lived out, and taught the churches to follow: [[Acts 2:42]] Paul says to copy him as he copies Christ: [[1 Corinthians 11:1]] If the sent ones received a practice from Jesus, lived it, and left it to be followed, it is apostolic.

PHRASE FIVE: WORK BESIDE LEARNING IS APOSTOLIC, NOT EXPERIMENTAL. Jesus was known in His town as a carpenter before He was known as a teacher: [[Mark 6:3]] His disciples were fishermen called from their nets: [[Matthew 4:18]] Paul made tents in the same weeks he taught: [[Acts 18:3]] He named the hours and the reason: [[1 Thessalonians 2:9]] And he said he did it on purpose so the churches would have an example: [[2 Thessalonians 3:9]] An experiment is something you try to see if it works. An apostolic pattern is something you follow because the sent ones already lived it. Yahweh said to ask for the old paths: [[Jeremiah 6:16]] So a school where students work ten hours a week and finish with no debt is not a new idea. It is the apostles' idea with a schedule.

ONE LIMIT, SO NOBODY TURNS THIS INTO A STICK. Paul also said teachers have a right to be supported, [[1 Corinthians 9:14]] and that he chose not to use it. So this lesson does not say teachers may not be paid, and it does not say a sick person or a small child who cannot work has failed. Context is King on that verse too.

WHAT TO KEEP. Read the verse. Read around it. Read across the whole Word. Keep each part in its place. Then weigh the thing in front of you. Yahweh's release carries His name because He is the Releaser, and working beside learning is the way His sent ones lived. Fair warning, as always: a reader should check every verse on this page in the Bible itself, which is what step one is for.`;

const TEEN = `WORK BESIDE LEARNING IS APOSTOLIC, NOT EXPERIMENTAL - the Lord's release, the Word-first algorithm run across the Word, what apostolic means, and context is King. Read this as the week that hands you a method, not a conclusion, and then proves the method on the very verse it came from.

(1) WHERE IT CAME FROM. On 2026-10-20 Darrell was reading week 42 in the app, at the step where Yahweh attaches His own name to a release of debt, and spoke a lesson into the app in five phrases: work beside learning is apostolic, not experimental; the Lord's release; the details, by a Word-first algorithm run across the Word; explain apostolic; context is King. When the first draft started editing week 42 he stopped it: this is a separate lesson. So it is. An A.I. agent drafted this page from his words and the Word; every verse was fetched from the family's corpus rather than typed, and the gates decided whether it shipped. Check the verses yourself anyway. That is step one.

(2) THE ALGORITHM. An algorithm is a fixed sequence of steps that returns the same answer to everybody who runs it honestly. The Word's own reading method is one. Step one, the verse as written, taken as true: [[Psalms 119:160]] Step two, the context - sentence before, sentence after, chapter, book, covenant - and the sense given, as Ezra's Levites gave it to a city: [[Nehemiah 8:8]] Step three, across the Word, the Word explaining the Word: [[Isaiah 28:10]] [[1 Corinthians 2:13]] [[2 Peter 1:20]] The Lord Jesus ran step three on the Emmaus road and in the upper room: [[Luke 24:27]] [[Luke 24:45]] Step four, rightly dividing, each part kept in its place: [[2 Timothy 2:15]] Step five, last and never first, the thing in front of you weighed against what the Word already said: [[Acts 17:11]] Most arguments among believers are two people who ran step five first.

(3) CONTEXT IS KING, ON THE VERSE HE WAS READING. The verse: [[Deuteronomy 15:2]] Before it, the clock: [[Deuteronomy 15:1]] After it, the verse that changes the reading: [[Deuteronomy 15:3]] The release is for Yahweh's covenant family, brother to brother; the foreigner may still be asked. So it is not a universal cancellation of every debt on earth, and a reading that says so stopped at step one. Further down, the sin the release tempts, named before anybody commits it: [[Deuteronomy 15:9]] [[Deuteronomy 15:10]] And the reason under the whole chapter: [[Deuteronomy 15:15]] Redemption remembered on a calendar. Take verse 15 away and you have an economics proposal; put it back and you have the gospel in the law. Context did not shrink the verse. It gave it its weight.

(4) THE RELEASE ACROSS THE WORD. Step three on the same subject. Before Deuteronomy: [[Exodus 21:2]] Widened to the fiftieth year: [[Leviticus 25:10]] Kept by name after the exile: [[Nehemiah 10:31]] Broken by Zedekiah's Jerusalem, which proclaimed a release and took it back, [[Jeremiah 34:11]] and answered by Yahweh in His own words: [[Jeremiah 34:17]] A release taken back is a covenant broken with Him, because the release carries His name. Then the release in a Person: [[Isaiah 61:1]] Read aloud by the Lord Jesus in Nazareth, [[Luke 4:18]] [[Luke 4:19]] with the sentence no prophet could say: [[Luke 4:21]] Prayed by His disciples: [[Matthew 6:12]] Told as a parable of a king and an unpayable debt: [[Matthew 18:27]] [[Matthew 18:33]] Done at the cross: [[Colossians 2:14]] Done by Paul with his own hand for one runaway slave: [[Philemon 1:18]] [[Philemon 1:19]] It is called the LORD's release because He is the Releaser, and every human release is a copy of His. He is the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne is for ever: [[Hebrews 1:8]]

(5) APOSTOLIC, EXPLAINED. An apostle is a sent one, the Lord's own word: [[John 13:16]] He chose twelve and named them so: [[Luke 6:13]] He is the first Apostle: [[Hebrews 3:1]] And He sent them as He was sent: [[John 20:21]] Apostolic therefore means the pattern the sent ones received from Him, lived before the churches, and taught as doctrine: [[Acts 2:42]] [[Ephesians 2:20]] Paul says he did not get it from men: [[Galatians 1:12]] and says what to do with it: [[1 Corinthians 11:1]] [[2 Thessalonians 3:9]] The test for whether a practice is apostolic: did the sent ones receive it from Him, live it, and leave it to be followed. If yes, it is not ours to experiment with. It is ours to walk in.

(6) WORK BESIDE LEARNING IS APOSTOLIC, NOT EXPERIMENTAL. The Sent One Himself was known by His trade before His teaching: [[Mark 6:3]] and the forming of those years is recorded: [[Luke 2:52]] His apostles were working men called from their nets: [[Matthew 4:18]] Paul in Corinth: [[Acts 18:3]] Paul to the Ephesian elders: [[Acts 20:34]] [[Acts 20:35]] Paul to Thessalonica, hours and reason named: [[1 Thessalonians 2:9]] And the word that settles whether it was hardship or pattern: [[2 Thessalonians 3:8]] [[2 Thessalonians 3:9]] [[2 Thessalonians 3:10]] The taught were told the same: [[1 Thessalonians 4:11]] [[Ephesians 4:28]] An experiment is tried to find out whether it works; an apostolic pattern is received because it already did. Yahweh told us which to ask for: [[Jeremiah 6:16]] and that the good way being old is no surprise: [[Ecclesiastes 1:9]] A work college is the old path with a registrar attached, and what it buys is the forming the Word described: [[Hebrews 5:14]]

(7) THE LIMIT PAUL NAMED, SO THE PATTERN IS NOT A CLUB. The same Paul wrote that the right to support exists, [[1 Corinthians 9:14]] and that he laid it down on purpose: [[1 Corinthians 9:15]] The Lord Jesus said the labourer is worthy of his hire, [[Luke 10:7]] and Paul quotes it as Scripture: [[1 Timothy 5:18]] So the pattern does not say teachers may not be paid, and it does not say the sick, the widow, or the apprentice still learning has failed. Shortness of work is not sin and length of work is not virtue; the Word is for a formed person, not against a paid one.

(8) THE THREE TIERS. ESTABLISHED: the release is Yahweh's law, kept in Nehemiah's day and avenged in Jeremiah's; the Lord Jesus declared Isaiah's release fulfilled in Himself; the apostles worked beside their teaching and taught the churches to follow; the Word explains the Word and context governs the sense. That is the text, not an opinion about it. OPEN, narrowly: how a republic, a university, or a bank should schedule a release of debt is not legislated by the Word, which is not a statute book, and this house does not pretend it is. OVER-REACH, corrected by the Word: "cancel every debt everywhere" ignores [[Deuteronomy 15:3]] and "no paid teachers" ignores [[1 Corinthians 9:14]] Context is King in both directions.

(9) WHY THE TWO PHRASES CAME OUT IN ONE BREATH. The release answers a debt already contracted; work beside learning keeps the debt from being contracted. Mercy after the fact and Wisdom before it. Wisdom, Understanding and Knowledge are the Resources Yahweh supplies, and Love is senior to them all. Both are old, both carry His name, and neither is an experiment. Run the method on the next verse you are handed.`;

const SENIOR = `WORK BESIDE LEARNING IS APOSTOLIC, NOT EXPERIMENTAL - the Lord's release, the Word-first algorithm run across the Word, what apostolic means, and context is King. Teach this as the week that hands a method over rather than a conclusion, and then runs the method in front of the room on the very verse it came from, so that nobody leaves with a verdict they could not reproduce.

OPEN WITH WHERE THE WORD CAME FROM. On 2026-10-20 Darrell was reading week 42 in the app, at the step where Yahweh attaches His own name to a release of debt, and spoke a lesson into it in five phrases: work beside learning is apostolic, not experimental; the Lord's release; the details, by a Word-first algorithm run across the Word; explain apostolic; context is King. He stopped the first draft from folding it into week 42: this is a separate lesson. Say that out loud, because the method matters more than the occasion, and the occasion was a man refusing to read past a verse. An A.I. agent drafted the page from his words; the verses were fetched from the family's corpus, never typed; the gates decided whether it shipped.

TEACH THE ALGORITHM AS FIVE STEPS AND WRITE THEM ON THE BOARD. One, the verse as written, taken as true: [[Psalms 119:160]] Two, the context, sentence before and after, chapter, book, covenant, and the sense given, which is one act in Ezra's day and not two: [[Nehemiah 8:8]] Three, across the Word, the Word explaining the Word: [[Isaiah 28:10]] [[1 Corinthians 2:13]] and the Lord's own demonstration of it: [[Luke 24:27]] Four, rightly dividing: [[2 Timothy 2:15]] Five, only now, the thing in front of you weighed against what the Word said: [[Acts 17:11]] Then tell the room the diagnosis you will use all year: most arguments among believers are two people who ran step five first.

RUN THE METHOD ON DEUTERONOMY 15:2 IN FRONT OF THEM. The verse: [[Deuteronomy 15:2]] The clock before it: [[Deuteronomy 15:1]] The verse after it, the one that governs the reading: [[Deuteronomy 15:3]] Make them say what it does: the release is for the covenant family, brother to brother, and the foreigner may still be asked, so it is not a universal cancellation and a house that says so stopped at step one. Then the sin the release tempts: [[Deuteronomy 15:9]] And the reason beneath the chapter: [[Deuteronomy 15:15]] Have them put it in one sentence: redemption remembered on a calendar. Then run step three aloud: [[Exodus 21:2]] [[Nehemiah 10:31]] [[Jeremiah 34:17]] [[Isaiah 61:1]] [[Luke 4:21]] [[Matthew 6:12]] [[Colossians 2:14]] [[Philemon 1:18]] Close the thread with why it is called the LORD's release: He is the Releaser, and every release His people make is a copy of His. Name Him: the Lamb of Yahweh, [[John 1:29]] the Eternal Son the Father gave, [[John 3:16]] whose throne is for ever: [[Hebrews 1:8]]

EXPLAIN APOSTOLIC BEFORE YOU USE IT AGAIN. A sent one: [[John 13:16]] [[Luke 6:13]] [[Hebrews 3:1]] [[John 20:21]] The pattern the sent ones received, lived, and taught: [[Acts 2:42]] [[Ephesians 2:20]] [[1 Corinthians 11:1]] [[2 Thessalonians 3:9]] Give the room the test and make them apply it: did the sent ones receive it from Him, live it, and leave it to be followed. Then apply it yourself to work beside learning: [[Mark 6:3]] [[Matthew 4:18]] [[Acts 18:3]] [[Acts 20:34]] [[1 Thessalonians 2:9]] [[2 Thessalonians 3:8]] [[2 Thessalonians 3:10]] An experiment is tried to see whether it works; an apostolic pattern is received because it already did: [[Jeremiah 6:16]] A grandparent in the room may well have been apprenticed; let them say what it formed in them, and tie it to the forming the Word describes: [[Hebrews 5:14]]

NAME THE LIMIT, SO THE OLD DO NOT WOUND THE YOUNG WITH IT. The same Paul: [[1 Corinthians 9:14]] [[1 Corinthians 9:15]] The Lord's own word on the labourer: [[Luke 10:7]] The pattern does not forbid a paid teacher and does not condemn the sick, the widow, or the child still learning; context is King on 2 Thessalonians 3:10 as much as on Deuteronomy 15:2. Say plainly that the Word is not a statute book for anybody's loan book or payroll, and that this house legislates nothing; it teaches the principle and the Person.

CLOSE ON THE TWO PHRASES TOGETHER. The release answers a debt already contracted; work beside learning keeps the debt from being contracted. Mercy after the fact and Wisdom before it, and Love senior to both. Then send them to run the five steps on the next verse they are handed, and to come back next week with what it showed.`;

// -----------------------------------------------------------------------------
// The module, before the verses are filled in.
// -----------------------------------------------------------------------------
const TITLE = 'Work beside learning is apostolic, not experimental - the Lord\'s release, the Word-first algorithm run across the Word, what apostolic means, and context is King';

const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `On 2026-10-20 Darrell was reading week 42 in the app, at the step where Yahweh attaches His own name to a release of debt, and spoke a lesson into the app in five phrases: work beside learning is apostolic, not experimental; the Lord's release; the details, by a Word-first algorithm run across the Word; explain what apostolic means; context is King. This week works each phrase the way the Word explains it. The method first: the verse as written, then its context, then the Word across the Word, then the right dividing, and only then the thing in front of you. Then the method run on Deuteronomy 15:2 itself - the verse after it limits the release to the covenant family, the verse at the chapter's floor grounds it in redemption remembered, and the thread across the Word ends in Nazareth with the Lord Jesus saying the release is fulfilled in Him. Then "apostolic" explained as a sent one's pattern, received from Him and left to be followed, and work beside learning shown to be exactly that, with the limit Paul himself named so the pattern never becomes a club. Yahweh's release carries His name because He is the Releaser; the apostles worked beside their teaching because the Sent One did.`,
  inApp: `Open the Bible in the app at Deuteronomy 15, read verse 2, then read verses 1, 3, 9 to 11 and 15 around it before you read anybody's opinion about it - that is step two. Then use Search it out on this lesson's references: the lesson hands you a reference, the text is fetched from the family's own corpus on request, and the thread from Exodus 21 to Philemon is step three run for you, verse by verse. The five steps are the same whether you run them on a verse, a sermon, or this page.`,
  anchor: {
    ref: '',
    theme: `KJV: [[Deuteronomy 15:2]] Yahweh attaches His own name to the release, and the method this week hands over is how to find out why. Read the verse as written. Read the verse after it, which limits the release to the covenant family, and the verse at the floor of the chapter, which grounds it in a people who were themselves released. Then run it across the Word: a servant freed in the seventh year, a release kept after the exile, a release taken back and avenged, a release promised in a Person and read aloud in Nazareth by the One who said it was fulfilled in Him. It is called the LORD's release because He is the Releaser. And the same method shows that work beside learning is the pattern the sent ones received, lived, and taught - not a hardship model, not an experiment - with the limit Paul himself named.`,
  },
  benefits: [
    `You can run the Word-first algorithm on any verse you are handed: as written, [[Psalms 119:160]] then its context with the sense given, [[Nehemiah 8:8]] then across the Word, [[Isaiah 28:10]] then rightly divided, [[2 Timothy 2:15]] and only then weighed against the thing in front of you, [[Acts 17:11]]`,
    `You can show from the next verse why "the LORD's release" is not a mandate to cancel every debt on earth, [[Deuteronomy 15:3]] and from the chapter's floor why it is worship and not bookkeeping: [[Deuteronomy 15:15]]`,
    `You can trace the release from Sinai to Nazareth and say in one sentence why it carries His name: the Lord Jesus read it and said [[Luke 4:21]] and the cross did it: [[Colossians 2:14]]`,
    `You can say what apostolic means before you use the word: a sent one, [[John 13:16]] whose pattern the first church continued steadfastly in, [[Acts 2:42]] and was told to follow: [[2 Thessalonians 3:9]]`,
    `You know that work beside learning is that pattern and not an experiment: the Sent One at His bench, [[Mark 6:3]] Paul at his, [[Acts 18:3]] with the reason named, [[1 Thessalonians 2:9]] and the old path asked for: [[Jeremiah 6:16]]`,
    `You can hold the pattern without turning it into a club, because Paul named the right he laid down: [[1 Corinthians 9:14]] and the Lord said the labourer is worthy of his hire: [[Luke 10:7]]`,
  ],
  rpe: {
    research: `Take one verse you have heard used in an argument this year. Run the five steps on it in writing: copy it as written; copy the sentence before and after and write the sense in one line; list every other place the Word speaks of the same thing, with the references; write which kind of text it is and to whom it was given; and only then write what the argument was and whether the verse supports it. Keep the page.`,
    plan: `Decide where the release and the work go in your own house this season. Name one debt somebody owes you that you will release because you were released, and the day you will tell them. Name one skill you will learn with your hands beside your study, the hours in the week, and the person who will check your work. Write both down with dates.`,
    execute: `Release the debt this week, out loud, to the person's face or in your own handwriting, and do not take it back. Do the first hours of the work beside the learning at the time you wrote down, and have the person you named look at what you made. Then run the five steps on this Sunday's sermon text before Sunday, and bring what step two showed to the table.`,
  },
  media: [],
  levels: {
    child: CHILD + '\n\n' + TALK.child,
    youth: YOUTH + '\n\n' + TALK.youth,
    teen: TEEN + '\n\n' + TALK.teen,
    senior: SENIOR + '\n\n' + TALK.senior,
  },
  quiz: {
    questions: [
      {
        q: 'What are the first two steps of the Word-first algorithm this lesson teaches?',
        options: [
          'Decide what you think, then find a verse that agrees',
          'Read the verse as written and take it as true, [[Psalms 119:160]] then read what is around it and give the sense: [[Nehemiah 8:8]]',
          'Ask a commentary, then ask a second commentary',
        ],
        answer: 1,
        explain: `The order is the whole discipline. The thing in front of you - the argument, the policy, the sermon - is step five and never step one. Ezra's Levites read distinctly and gave the sense as one act, and the Lord Jesus ran the across-the-Word step Himself on the Emmaus road: [[Luke 24:27]]`,
      },
      {
        q: 'Somebody reads Deuteronomy 15:2 and says the Word commands that every debt everywhere be cancelled. What does the very next verse do to that reading?',
        options: [
          'Confirms it, since the release is for everyone',
          'Limits it: the release is for the covenant brother, and the foreigner may still be asked, [[Deuteronomy 15:3]] so the reader stopped at step one',
          'Nothing, because context is only for scholars',
        ],
        answer: 1,
        explain: `Context is King. The verse before sets the clock, the verse after sets the circle, and the floor of the chapter gives the reason that turns a bookkeeping rule into worship: [[Deuteronomy 15:15]] A people released by Yahweh's own hand release their brother on His schedule.`,
      },
      {
        q: 'Why is it called the LORD\'s release?',
        options: [
          'Because the priests collected the debts',
          'Because He is the Releaser: the Lord Jesus read Isaiah\'s release in Nazareth and said [[Luke 4:21]] and the cross blotted out the handwriting against us: [[Colossians 2:14]]',
          'Because the name was chosen by the elders',
        ],
        answer: 1,
        explain: `Run across the Word, the release runs from a servant freed in the seventh year, [[Exodus 21:2]] through a release kept after the exile and one taken back and avenged, to a release promised in a Person: [[Isaiah 61:1]] Every release His people ever made was a copy of His.`,
      },
      {
        q: 'What does "apostolic" mean in this lesson?',
        options: [
          'Old-fashioned, or the name on a church sign',
          'A sent one\'s pattern: what the men the Lord Jesus sent received from Him, lived before the churches, and taught to be followed - [[Acts 2:42]] [[2 Thessalonians 3:9]]',
          'Anything a pastor says with authority',
        ],
        answer: 1,
        explain: `The word is the Lord's own: [[John 13:16]] He named the twelve apostles, [[Luke 6:13]] He is Himself the first Apostle, [[Hebrews 3:1]] and He sent them as He was sent: [[John 20:21]] If the sent ones received a practice from Him, lived it, and left it to be followed, it is not ours to experiment with but to walk in.`,
      },
      {
        q: 'Is work beside learning an experiment or an apostolic pattern?',
        options: [
          'An experiment some colleges are trying',
          'An apostolic pattern: the Sent One was a carpenter, [[Mark 6:3]] Paul made tents in the weeks he taught, [[Acts 18:3]] and said he did it to leave an ensample: [[2 Thessalonians 3:9]]',
          'A hardship the poor should avoid',
        ],
        answer: 1,
        explain: `An experiment is tried to find out whether it works; an apostolic pattern is received because it already did. Yahweh said to ask for the old paths, [[Jeremiah 6:16]] and the forming the work buys is the forming the Word described: [[Hebrews 5:14]]`,
      },
      {
        q: 'Does "if any would not work, neither should he eat" forbid paying a teacher, or condemn the sick and the apprentice?',
        options: [
          'Yes - every believer must earn every meal with his hands',
          'No - the same Paul says the right to support exists [[1 Corinthians 9:14]] and that he laid it down on purpose; context is King on that verse too',
          'The Word does not say',
        ],
        answer: 1,
        explain: `The Lord Jesus said the labourer is worthy of his hire, [[Luke 10:7]] and Paul quotes Him as Scripture: [[1 Timothy 5:18]] A reader who uses 2 Thessalonians 3:10 to shame the weak has run step five before step two. The Word is not against a paid teacher; it is for a formed one.`,
      },
    ],
  },
  lesson: '',
  facilitator: {
    talkingPoints: [
      `WHERE THE WORD CAME FROM: 2026-10-20, Darrell reading week 42 in the app at the release (Deuteronomy 15:2), speaking five phrases into it: work beside learning is apostolic, not experimental; the Lord's release; a Word-first algorithm across the Word; explain apostolic; context is King. He stopped the first draft from folding it into week 42. This is its own week.`,
      `THE ALGORITHM, ON THE BOARD: [[Psalms 119:160]] then Nehemiah 8:8, Isaiah 28:10, 1 Corinthians 2:13, 2 Peter 1:20-21, Luke 24:27 and 24:44-45, 2 Timothy 2:15, Acts 17:11. Five steps, in order. The diagnosis for the year: most arguments among believers are two people who ran step five first.`,
      `CONTEXT IS KING, LIVE ON DEUTERONOMY 15: [[Deuteronomy 15:3]] is the verse that governs the reading; then 15:1, 15:4-5, 15:9-11 and 15:15. Make the room say it in one sentence: redemption remembered on a calendar.`,
      `THE RELEASE ACROSS THE WORD: Exodus 21:2; Leviticus 25:10; Nehemiah 10:31; Jeremiah 34:8-17; Isaiah 61:1-2; Luke 4:18-21; Matthew 6:12; Matthew 18:27-33; Colossians 2:14; Philemon 18-19. End on why it carries His name: [[Luke 4:21]]`,
      `APOSTOLIC, EXPLAINED BEFORE IT IS USED: [[John 13:16]] then Luke 6:13, Hebrews 3:1, John 20:21, Acts 2:42, Ephesians 2:20, Galatians 1:11-12, 1 Corinthians 11:1, 2 Thessalonians 3:9. The test: received from Him, lived, left to be followed.`,
      `WORK BESIDE LEARNING IS THAT PATTERN: Mark 6:3; Luke 2:52; Matthew 4:18-19; Acts 18:3; Acts 20:33-35; 1 Corinthians 4:12; 1 Thessalonians 2:9; 2 Thessalonians 3:7-10; 1 Thessalonians 4:11-12; Ephesians 4:28; then [[Jeremiah 6:16]] and Ecclesiastes 1:9 on old paths, and Hebrews 5:14 on what the work buys.`,
      `THE LIMIT, SO THE PATTERN IS NOT A CLUB: [[1 Corinthians 9:14]] then 9:15, 9:18, Matthew 10:10, Luke 10:7, 1 Timothy 5:18. Not "no paid teachers," not a verdict on the sick, the widow, or the apprentice.`,
      `THE THREE TIERS AND THE CLOSE: ESTABLISHED (the text), OPEN (no statute for anybody's loan book or payroll), OVER-REACH (both directions, corrected by 15:3 and 9:14). Then the two phrases together: mercy after the fact, Wisdom before it, Love senior to both. Confess the Lamb of Yahweh, the Eternal Son: John 1:29, John 3:16, Hebrews 1:8. Send them to run the five steps on the next verse.`,
    ],
    howToRun: `Prayer + the anchor (5): open in prayer; read Deuteronomy 15:1-3 and 15:15 aloud (KJV). | Recap last week (5): the three-year degree, the work that teaches, and the release named in a sentence. | Where the word came from (5): Darrell's five phrases, spoken into the app at the release; this is its own week. | The algorithm (12): five steps on the board, one verse each; the diagnosis. | Context is King (12): run it live on Deuteronomy 15:2 with 15:3 and 15:15. | The release across the Word (15): read the thread aloud, Exodus 21 to Philemon, and stop at Nazareth. | Apostolic, explained (10): the word, the test. | Work beside learning (12): the thread, the old paths, the limit Paul named. | The three tiers (5). | Talk about it together + close (9): the two phrases in one breath, the Lamb and the Eternal Son, the five steps assigned for next week's text.`,
    discussionPrompts: [
      `[[Nehemiah 8:8]] Reading distinctly and giving the sense were one act in that street. Where in your own reading do you do the first and skip the second?`,
      `[[Deuteronomy 15:3]] The verse after the release draws its circle. Name one verse you have heard used this year without the verse after it, and say what the verse after it does.`,
      `[[Deuteronomy 15:15]] Redemption remembered on a calendar. What were you released from, and what debt owed to you are you still exacting?`,
      `[[Luke 4:21]] He read the release and said it was fulfilled in Him. If He is the release, what does it mean that He taught you to pray "forgive us our debts, as we forgive our debtors"?`,
      `[[2 Thessalonians 3:9]] Paul laid down a right to leave an ensample. Which apostolic pattern have you been treating as optional because it was inconvenient, and which have you been using as a club because it was convenient?`,
      `[[Jeremiah 6:16]] Ask for the old paths. What is one thing in your house or your work that you have been running as an experiment when the Word already handed you the pattern?`,
    ],
  },
};

// -----------------------------------------------------------------------------
// Build: fill the verses, derive the anchor, splice into the catalog.
// -----------------------------------------------------------------------------
MODULE.lesson = LESSON.join('\n\n') + '\n\n' + TALK.lesson;

const filled = fillDeep(MODULE);
filled.anchor.ref = used.join('; ');

const src = readFileSync(CATALOG, 'utf8');
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
const start = src.indexOf(OPEN);
if (start < 0) throw new Error('sov43: the modules array was not found');
const end = src.indexOf('\n];', start);
if (end < 0) throw new Error('sov43: the modules array is not closed after its opening');
const firstClose = src.indexOf('\n];');
if (firstClose === end) {
  throw new Error('sov43: refusing to splice - the first "];" in the file is now the array close, which contradicts the measurement this script was written against; re-read the file before trusting it');
}
if (!/\n {2}\},$/.test(src.slice(start, end))) {
  throw new Error('sov43: the array does not end with a comma-terminated module literal; refusing to splice');
}
const REBUILD = process.argv.includes('--rebuild');
let src2 = src;
let end2 = end;
if (src2.includes(ID)) {
  if (!REBUILD) throw new Error(`sov43: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const marker = `\n  {\n    "id": "${ID}"`;
  const from = src2.indexOf(marker);
  if (from < 0) throw new Error('sov43: the id is in the file but not as a module literal; refusing to rebuild');
  const closeAt = src2.indexOf('\n  },', from);
  if (closeAt < 0 || closeAt >= end2) throw new Error('sov43: could not find the end of the existing block; refusing to rebuild');
  const excised = src2.slice(from, closeAt + '\n  },'.length);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov43: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from) + src2.slice(closeAt + '\n  },'.length);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov43: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov43: the id survived the excision; refusing to rebuild');
}

const block = JSON.stringify(filled, null, 2).split('\n').map((l) => `  ${l}`).join('\n');
const next = `${src2.slice(0, end2)}\n${block},${src2.slice(end2)}`;

const weeks = (text) => [...new Set([...text.matchAll(/sov(\d+)-/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
const before = weeks(src2);
const after = weeks(next);
if (after.length !== before.length + 1) throw new Error(`sov43: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov43: week ${WEEK} is already taken`);
if (before.join(',') !== [...Array(before.length)].map((_, i) => i + 1).join(',')) {
  throw new Error(`sov43: the weeks on disk are not 1..${before.length} contiguous: ${before.join(',')}`);
}
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov43: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref.split(';').map((s) => s.trim()).filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov43: spliced ${ID}`);
console.log(`sov43: modules ${before.length} -> ${after.length}`);
console.log(`sov43: ${refs.length} references on the anchor, every one quoted on the page and resolving in the corpus`);
console.log(`sov43: lesson ${filled.lesson.length} chars; bands child ${filled.levels.child.length}, youth ${filled.levels.youth.length}, teen ${filled.levels.teen.length}, senior ${filled.levels.senior.length}`);
