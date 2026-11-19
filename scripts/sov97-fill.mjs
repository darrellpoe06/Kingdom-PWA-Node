// =============================================================================
// sov97-fill - build Sovereign A.I. week 97 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456). Every quoted
// verse on this page is FILLED FROM app/public/bible/kjv at build time. The
// prose holds only a reference in double brackets, [[Isaiah 36:6]], and this
// script replaces it with the corpus text followed by the reference. No verse
// on the page was typed from memory. anchor.ref is DERIVED from the
// placeholders that occur in the reader places (DR-0734).
//
// WHERE THE WORD CAME FROM. Darrell forwarded a daily business newsletter
// (the issue of 2026-11-14) into the lesson lane with ONE WORD above it:
// Lesson. Gmail thread `1a1f08f5aa0b9f68`. Built 2026-11-19. The teachable
// thread is two outages in one week: a national ground stop of departing
// flights after an air traffic control communications failure, and a cloud
// outage of a large provider's mail, meeting and office services. The
// newsletter's partisan political items stay out (DR-0098); no official is
// named, only the office.
//
// THE NUMBER. reserve/sov96 was already held on origin by another session
// (2026-11-19 00:35Z) when this build tried it, so this build claimed
// reserve/sov97 with an empty-value lease and took 97.
//
// ONE TEACHING, ONE LESSON (DR-0610). lesson-already-built.mjs --thread
// returned NOTHING FOUND. Week 1 (the generator in the garage) owns
// local-first as a whole; week 66 (they dwelt careless) owns the risk ranked
// low; week 85 (and it fell not) owns testing the storm before it comes. The
// Nvidia stories are L321's. This week owns LEANING: the few the world leans
// on, the reed that pierces the hand, and the new cloth on the old garment.
// Isaiah 36:6 appears in week 66 only as a side verse, never as an anchor;
// Ezekiel 29:6-7 appears in no lesson at all (counted before writing).
//
// TRUST BUT VERIFY (DR-0100 / DR-0076 section 8). The newsletter is a
// forwarded source. DOCUMENTED by several independent reports (read through a
// web search 2026-11-19; the article pages themselves were refused by this
// session's network): the ground stop on 2026-11-13, more than four hours,
// after a communications failure in air traffic control; officials pointed to
// decades-old equipment; reports citing unnamed sources said an update to the
// network made the system reboot; the cause was still under investigation the
// next day. The provider outage of 2026-11-12/13 across mail, meetings and
// office services, the provider saying many servers became unavailable and
// that there was no sign of an attack, restored late on the 13th. REPORTED
// by the newsletter only: more than 70 countries, a think tank's estimate of
// at least $7 billion in lost work, workers falling back to fax machines,
// 1.5 million stranded travelers, and the phrase about upgrades overwhelming
// the old system. NOT VERIFIED: the root cause of the ground stop, and whether
// an attack was ruled out (the newsletter says it was; another report says an
// official declined to rule it out). MEASURED in our house: the records of
// 2026-11-06 and 2026-11-18 and the workflow folder on this tree.
// re-review: 2026-12-03.
//
// THE BANDS WERE WRITTEN BY HAND, NEVER BY A SCRIPT ON PROSE (DR-1306).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 97;
const ID = 'sov97-the-staff-of-this-broken-reed';
const TITLE = 'The staff of this broken reed - two outages in one week, and the second road';

// -----------------------------------------------------------------------------
// The corpus
// -----------------------------------------------------------------------------
const books = new Set(
  readdirSync(KJV)
    .filter((f) => f.endsWith('.json') && f !== 'index.json')
    .map((f) => f.slice(0, -5))
);
const cache = new Map();

function bookFile(name) {
  const k = String(name).replace(/\s+/g, '');
  if (books.has(k)) return k;
  if (books.has(`${k}s`)) return `${k}s`;
  return null;
}

function verseText(ref) {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(String(ref).trim());
  if (!m) throw new Error(`sov97: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov97: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov97: reference does not resolve in the corpus -> "${ref}"`);
  return text;
}

const readerRefs = [];
const seenReader = new Set();

function fill(text, isReaderPlace = false) {
  return String(text).replace(/\[\[([^\]]+)\]\]/g, (_, ref) => {
    const r = ref.trim();
    const t = verseText(r);
    if (isReaderPlace && !seenReader.has(r)) {
      seenReader.add(r);
      readerRefs.push(r);
    }
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
// The sentences every reader place must carry, so a reader who reads ONE band
// still gets the tiers, the house finding and the date (DR-0795).
// -----------------------------------------------------------------------------
const REVIEW = 're-review: 2026-12-03';

const FACTS = {
  lesson: `WHERE WE STAND ON THE FACTS. DOCUMENTED by several independent news reports, read on 2026-11-19 through a search because the article pages themselves would not open from our build: on 2026-11-13 departing flights across the United States were halted for more than four hours after a communications failure in air traffic control, with thousands of flights delayed or canceled; officials pointed to decades-old equipment, reports citing unnamed sources said an update to the network made the system reboot, and the cause was still under investigation the next day. And on 2026-11-12 and 13, a large provider's mail, meeting and office services went down for very many users, the provider said a large number of its servers became unavailable and that there was no sign of an attack, and service was restored late on the 13th. REPORTED by the forwarded newsletter only, so we hold it loosely: more than seventy countries, a think tank's estimate of at least seven billion dollars of lost work, workers falling back to fax machines, a million and a half travelers stranded, and the line that new upgrades overwhelmed the old system. NOT VERIFIED: what finally caused the ground stop, and whether an attack has been ruled out, because the reports do not agree. ESTABLISHED, and stated plainly: when very many people lean on one supplier with no second road, one failure stops all of them at once. MEASURED in our own house, from our own records and our own workflow folder, as told above. ${REVIEW}.`,
  child: `WHAT IS SURE AND WHAT IS NOT. News reporters told the story of the planes. Many of them told it the same way, so we know it happened. They also told the story of the work computers going dark. That happened too. The letter Darrell sent said some more things that we could not check, like how many countries. Nobody knows yet for sure what broke the plane radios. That is not verified. We will look again. ${REVIEW}.`,
  youth: `WHAT IS SURE AND WHAT IS NOT. Several news reports agree that the flights stopped for more than four hours on November 13 and that the work programs went down on November 12 and 13, so those are documented. Some numbers came only from the newsletter Darrell forwarded, like seventy countries and seven billion dollars, so we call them reported. The real cause of the radio failure is not verified yet, and the reports do not agree on whether an attack is ruled out. Our own house was checked from our own records. ${REVIEW}.`,
  teen: `WHAT IS SURE AND WHAT IS NOT. Sort every claim. Documented by several independent reports: the ground stop of November 13, more than four hours, after a communications failure, and the provider outage of November 12 and 13, which the provider blamed on servers becoming unavailable, with no sign of an attack. Reported by the newsletter only: seventy countries, seven billion dollars, fax machines, and upgrades overwhelming an old system. Not verified: the ground stop's root cause, and whether an attack is ruled out. Measured: our own records and our own workflow folder. ${REVIEW}.`,
  senior: `WHERE WE STAND ON THE FACTS. That departing flights across the country were halted for more than four hours on November 13 after a failure of air traffic communications, and that the provider's mail and office services failed on November 12 and 13, are documented by several independent reports, read through a search because the articles themselves could not be opened from this build. The figures of seventy countries and seven billion dollars, the fax machines, and the description of upgrades overwhelming an aging system rest on the forwarded newsletter alone and are held as reported. The root cause of the ground stop is not verified, and the accounts differ on whether an attack has been excluded; no conclusion is drawn on either. Every statement about this house is taken from its own records and its own code. ${REVIEW}.`,
};

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const GROWTH =
  'And measure the growth the Word’s way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - if every screen in our house went dark tomorrow, what would we still be able to do - and listen all the way to the end before you add a single word; have them retell their own answer in their own words, then teach them one verse back, Isaiah 36:6. Children, ask your mother, your father or a grandparent about a day when the power, the phone or the money machine stopped, and what the family did instead; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: what is the one thing our church leans on that has no second road. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - what would we do if the lights went out all day - and listen all the way to the end before you talk; have them say it back to you in their own words, then teach them one verse, Isaiah 36:6. Children, ask your mom or your dad or your grandma or your grandpa about a time the power went out. What did they do? Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: who do we call if the phone does not work. Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - which app would hurt most if it stopped working for a day, and what would you do instead - and listen all the way to the end before you fix anything; have them retell the answer in their own words, then teach them one verse, Ezekiel 29:7. Children, ask your mom, your dad or a grandparent how they did homework, kept phone numbers and paid for things before any of it was on a phone; hear the whole of it before you answer, then retell their answer in your own words. Then ask a friend this: what would our class do if the school's computers went down on test day. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - where do your photos, your schoolwork and your contacts actually live, and is there a second copy - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, Matthew 9:17. Children, ask your mom, your dad or a grandparent about a time a system they trusted at work went down, and how the work still got done; hear the whole of it before you reply, then retell their answer in your own words. Then ask a friend this: what do we lean on so hard that it would pierce our hand if it broke. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - if the internet were gone for a week, how would you reach the people you love - and listen all the way to the end, without finishing a sentence for them; have them retell their own answer in their own words, then teach them one verse back, Isaiah 30:15. Children, ask your parents or your grandparents how a household kept going when the telephone, the bank or the road was closed; hear the whole of it before you reply, then retell it back to them in your own words. Then ask a friend this: what written list, what paper copy, what second road should our house keep. Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson. The Word opens it, and no word about a cloud or a radio
// stands above that frame.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.
WHO SENT THIS. Darrell forwarded a daily business newsletter into this lane with ONE WORD typed above it: Lesson. That word is the ask; the newsletter is only the occasion. Two of its stories belong together, because they are one story told twice in the same week. In the first, every departing flight in the country was held on the ground for an evening when the radios that tie the planes to the controllers failed. In the second, one large company's mail, meetings and office programs went dark for a day, and offices around the world stopped with them. The newsletter's own closing line on the second story named the lesson for us: the modern economy leans on a few giant cloud companies, and when one of them stumbles, the whole planet's work can stumble with it.
One teaching, one lesson. Week one of this course is the generator in the garage, local-first as a whole. Week sixty-six is the risk ranked low because nobody had bothered. Week eighty-five is testing the storm before it comes. This week is about something narrower and older than all three: what it means to lean.`,
  `THE WORD FIRST, BEFORE ANY CLOUD. When the king of Assyria came against Jerusalem, he sent his chief officer to stand outside the wall and shout up at Hezekiah's men. The officer's first question was the right question: [[Isaiah 36:4]] Then he named the thing Judah had been leaning on: [[Isaiah 36:6]]
Notice who said it. It was the enemy's mouthpiece, and he was right about Egypt. That is worth sitting with: sometimes the person who sees your weak point most clearly is the one who means you harm. But do not take it from him alone. Yahweh had already said the same thing through His own prophet, in His own words: [[Ezekiel 29:6]] [[Ezekiel 29:7]]
A reed by the river looks like a staff. It is tall and straight, and on an ordinary day it will hold a little weight. The trouble is the day you lean on it with everything. Then it does not merely fail to hold you. It splits, and the split end goes into the hand that trusted it.`,
  `LEANING IS NOT TRADING. Read carefully what the Word rebukes, because it is not what a frightened reader expects. Judah was not rebuked for knowing Egypt, buying from Egypt, or speaking with Egypt. It was rebuked for running there for its strength without asking Yahweh first: [[Isaiah 30:2]] [[Isaiah 30:3]] And again: [[Isaiah 31:1]]
The sin was not the horses. It was the leaning, and the not looking. Isaiah gives the plain reason the leaning always ends badly: [[Isaiah 31:3]] The biggest helper in the world is still a helper made of men. When it falls, everyone holding it falls together.
That is exactly what the newsletter described. Using a large cloud company for mail and meetings is not a sin and not foolish. It is often the wise and cheaper choice. Leaning on it with no second road, so that when it stops your whole office stops, is the reed.`,
  `NEW CLOTH ON AN OLD GARMENT. The first story has its own lesson inside it. The newsletter reported that officials said new upgrades overwhelmed an aging communication system. Other reports said the equipment is decades old, and that an update to the network made the system restart. The final cause is still being investigated, and we will not claim more than that. But if those reports hold, Jesus described the failure long ago: [[Matthew 9:16]] [[Matthew 9:17]]
New wine is good. Upgrades are good. The trouble is pouring the new into a container that can no longer stretch, on a system the whole country leans on, with no second channel ready if the old skin bursts. Then the wine runs out and the bottle is lost too. Both are preserved only when the new goes into something that can hold it.
That is a word for every family and every church that keeps patching the one old computer, the one old phone list, the one old account that everything runs through. Each patch takes from the garment. Each update is a little more weight on a reed.`,
  `WHERE THE TRUST BELONGS. If the answer to a broken reed were simply a stronger reed, the Word would have told Judah to find a better ally. It did not. Listen to what it said instead: [[Isaiah 30:15]] Returning and rest, quietness and confidence. The strength was never going to come from a bigger helper.
Then watch Hezekiah. When the threatening letter came, he did not run to a second Egypt. [[Isaiah 37:14]] [[Isaiah 37:15]] And he prayed for the right reason: [[Isaiah 37:20]] He spread the whole problem out before Yahweh first. Only then did he act.
So the order for us is the same. First, the trust is placed in Yahweh, not in any company, and not in our own servers either. Second, inside that trust, we build wisely: every outside helper is support, never the only way. A system you do not control can carry you on an ordinary day. It must never be the one thing between your house and a stop.`,
  `THE SECOND ROAD, IN PLAIN PRACTICE. Here is what that looks like for a family or a church. Make a list of what you lean on: email, calendar, files, photos, the church's giving page, the group chat, the bank app, the one phone that holds every number. For each one ask three questions. If this were gone for a whole day, what would stop? Is there a second road? And who knows how to take it?
A second road is usually simple. A printed list of the phone numbers that matter. A copy of the important papers and photos on a drive you hold in your own hand. A phone tree, so one call becomes ten. A little cash for a day when the card readers are down. A meeting place everyone knows, if the group chat goes quiet. The newsletter said some offices fell back to fax machines. That made people laugh, but it is the point: the offices that had any second road at all kept working.
And do not wait for the outage to find out. Walk the list once a season, the way you would check the batteries in a flashlight before the storm, not during it.`,
  `OUR OWN HOUSE, MEASURED, NOT PAINTED. This house learned this lesson on itself, two weeks before the newsletter came. Our own records show it. Ninety-six of our automated workflows were counted then, and sixty-four of them reached our home server through one outside key. On November 4 that one key expired, and every one of the sixty-four went red at once, unseen for two days, because the alarms that should have told us ran on the same key. Our home server itself was fine the whole time. It was simply waiting for work that could only reach it down one road.
What we decided is the same thing Isaiah said. A proposal came to swap the dead key for a different outside service, and it was turned down, because it only changed which reed we leaned on, not whether we leaned. Instead the rule was written down: the home server starts every road itself, pulls its own work, writes its own heartbeat, and anything outside the house is support, never the only way.
Then it was applied. On November 18, when the reading voice could not reach the big computer in the office, a second engine was added on the home server itself, so a listener's own voice can still be made when the office is dark. We have not yet heard the first live reading from it, and we say so.
And we will not paint it finished. On the day this lesson was built, sixty-four of the one hundred and three workflow files in our folder still named that same outside key. The app itself is served by an outside host, and this lesson was built with a rented A.I. in the cloud. Those are support we are still turning into second roads. The rule is written; the work is not done.`,
  `IT IS KEPT. Every helper made of men will fail somewhere, our own included. There is one Rock that does not. Jesus is the Lamb of Yahweh, [[John 1:29]] the Son the Father gave, [[John 3:16]] the Eternal Son whose throne stands for ever, [[Hebrews 1:8]] and the One by whom all things consist. [[Colossians 1:17]] We build second roads because we are not Him. We lean our whole weight only on Him, because He does not split.`,
  `FOUR THINGS FOR THE HOUSE. One: name what you lean on, and ask of each one, if this stopped for a day, what would stop with it. Two: use outside helpers gladly, but keep every one of them as support, never the only way; build a second road you hold yourself. Three: do not keep pouring new wine into the one old bottle; when you upgrade the thing everything runs through, have the second road ready first. Four: put your whole weight on Yahweh, not on any company and not on your own servers, and walk your list once a season.`,
];

// -----------------------------------------------------------------------------
// The four age bands. Each is an independent composition for its reader.
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.
WHO SENT THIS. In one week, two big things broke. First, the radios at the airports stopped working. So no planes could take off for hours. Then lots of work computers all over the world stopped too. People could not send mail. Darrell sent us the story with one word on top. The word was Lesson. So here it is.
THE WORD FIRST. Long ago, a king named Hezekiah ruled in Jerusalem. A big army came. The enemy sent a man to shout at the wall. He said Judah was leaning on Egypt for help. And he said this about Egypt. [[Isaiah 36:6]] A reed is a tall skinny plant by the river. It looks like a walking stick. But if you lean on it hard, it snaps. Then the sharp end pokes your hand!
The enemy was right about that. And Yahweh said it too, in His own words. [[Ezekiel 29:6]] [[Ezekiel 29:7]] So Egypt was a reed. It looked strong. But when people leaned on it, it broke.
WHAT LEANING MEANS. It is fine to use help. We use a car. We use a phone. We buy food at a store. Yahweh did not say never use anything. He said do not put all your weight on one thing that can break. Here is what He told the people. [[Isaiah 31:1]] They looked at the horses. They did not look at Yahweh. That was the problem.
TWO REEDS THIS WEEK. The airport radios were very old. People tried to make them better with new parts. Some news said that is when they stopped. We do not know for sure yet. Jesus told a story about this. [[Matthew 9:17]] Old bottles can break when you pour in new wine. Old things can break when you push new things into them.
The work computers were the second reed. Lots and lots of people all used one big company. When it stopped, they all stopped. Some people had to use old fax machines!
A SECOND ROAD. What if your way to school was closed? You would take another road. That is a second road. A family can have second roads too. A paper list of phone numbers. A grown up who knows the plan. A place to meet if phones do not work. A flashlight in the drawer. Then if one thing breaks, the family keeps going.
OUR OWN FAMILY APP. Our family app had a reed too. Lots of its jobs used one key to get to the computer at home. One day the key stopped working. All those jobs stopped at once! The computer at home was fine. It was just stuck behind one door. So now the computer at home opens its own doors. It does its own work. Help from outside is extra, not the only way. We are still fixing some of the jobs. It is not all done yet.
THE ENEMY LOOKED FOR IT. The man who said Egypt was a reed was not a friend. He was the enemy. He looked hard for the weak spot. Bad guys still do that. They look for the one thing everyone uses. So it is smart to know your weak spots before they do.
A COPY IS NOT ALWAYS A COPY. If you have two toys in the same box, and the box gets lost, you lose both. A real second road is in a different place. Paper on the fridge is in a different place than the phone. That is why it works.
HEZEKIAH'S WAY. When the enemy sent a scary letter, Hezekiah did not run to a new helper. He took the letter to Yahweh's house. [[Isaiah 37:14]] Then he prayed. [[Isaiah 37:15]] He told Yahweh all about it first. That is the best first step.
A STORY TO TRY. Pretend the lights go out tonight. Where is the flashlight? Who knows? Can you find it in the dark? If not, put it in a spot everyone knows. Now you have a second road for light. It is a small thing. Small things help a lot.
YOUR JOB. Can you help your family make a list? Write down the phone numbers that matter most. Put the list on the fridge. Ask, if the phone stops, who do we call and how? That is a second road. You helped!
YAHWEH DOES NOT SNAP. People and companies can break. Yahweh never does. Jesus is the Lamb of Yahweh. [[John 1:29]] [[John 3:16]] He holds everything together. [[Colossians 1:17]] So we lean all our weight on Him. Not on a reed.
FOUR THINGS TO DO. Know what your family leans on. Keep a second road. Do not push too much on one old thing. Lean on Yahweh most of all.
${FACTS.child}
${TALK.child}`;

const YOUTH = `${TITLE}.
WHO SENT THIS. In the same week, two huge systems failed. It was a Friday afternoon. Every flight leaving an airport in the United States had to stay on the ground. It lasted more than four hours. The radios between pilots and air traffic control had gone down. The day before, a giant software company had a crash. Its email, video calls and office programs stopped. Offices and schools around the world had to stop too. Darrell forwarded a newsletter about both with one word: Lesson. Week one of this course already teaches the generator in the garage, and week eighty-five teaches testing for the storm. This week is about leaning.
THE WORD FIRST. When the Assyrian army surrounded Jerusalem, their commander yelled up at the wall. He asked Hezekiah's people what they were trusting in. [[Isaiah 36:4]] Then he answered his own question. [[Isaiah 36:6]] It is strange but true that the enemy got this part right. Yahweh had said the same thing through Ezekiel. [[Ezekiel 29:6]] [[Ezekiel 29:7]] A reed looks like a walking stick, and it holds you up until you really need it. Then it splits, and the sharp end goes into your hand.
WHAT THE WORD ACTUALLY WARNS ABOUT. This is not a lesson that says never use big companies. Judah was not in trouble for knowing Egypt. They were in trouble for running to Egypt for strength without asking Yahweh at all. [[Isaiah 30:2]] [[Isaiah 30:3]] Isaiah gives the reason it always ends badly. [[Isaiah 31:3]] A big helper is still made of people, and when it falls, everybody holding onto it falls too.
WHY THE PLANES STOPPED. The newsletter said new upgrades overwhelmed an old system. Other reports said the equipment is decades old and an update made the network restart. Investigators had not finished when this was written, so we are not claiming the final cause. But Jesus described this kind of failure. [[Matthew 9:16]] [[Matthew 9:17]] Say you keep forcing new stuff into something that cannot stretch. Say the whole country needs it. Say nothing is ready to take over. Then the old bottle bursts, and you lose both.
WHY THE OFFICES STOPPED. Millions of people used one company for email, chat and files. When that one company had a bad day, they all had a bad day together. Some offices went back to fax machines. People joked about it, but the offices that had any backup at all kept working.
THE ENEMY SAW IT. Here is something to notice. The person who saw Judah's weak spot most clearly was the enemy. People who want to break into something study what it depends on. That is still true. Hackers and scammers look for the one thing everybody leans on, because that is where one push does the most damage.
A FAKE BACKUP. Watch out for a backup that is really the same thing. A second account with the same company is not a second road. Saving your photos to the same cloud that might go down is not a second copy. If your backup code goes to the same phone you might lose, that is the same reed twice. A real second road keeps working when the first one breaks.
YOUR OWN REEDS. Think about what you lean on. Your phone holds your contacts, your photos, your homework, maybe your bus pass. Your school might run everything through one website. Ask about each one: if it stopped for a day, what would stop with it? Is there a second road? Write your most important phone numbers on paper. Back up the photos you could never replace. Know what you would do on test day if the school system crashed.
OUR OWN HOUSE. The family app learned this on itself. Most of its automatic jobs reached the home server through one outside key. On November 4 that key ran out, and dozens of jobs all failed at the same moment. Nobody noticed for two days, because the warning system used the same key. The home server was fine the whole time. So the house made a rule. The home server opens its own roads. Anything outside is extra help, never the only way. Then it was used. The reading voice could not reach the big office computer. So a second voice engine was put right on the home server. We have not heard its first live reading yet. And many jobs still use that old key, so the work is not finished.
WHERE THE TRUST GOES. The answer to a broken reed is not just a stronger reed. Yahweh told His people this. [[Isaiah 30:15]] When Hezekiah got a threatening letter, he did not run to another ally. [[Isaiah 37:14]] [[Isaiah 37:15]] He brought it to Yahweh first, and then he acted.
WHAT A GOOD ONE LOOKS LIKE. A second road does not have to be fancy. It can be your mom's number written inside your backpack. It can be a printed copy of your class schedule. It can be a family plan for where to meet if phones stop. It can be knowing how to do your math with a pencil when the website is down. Small things like that are what kept some offices running while others sat still.
KEPT. Every company, every server and every person will fail sometime. Jesus does not. He is the Lamb of Yahweh, [[John 1:29]] [[John 3:16]] the Eternal Son, [[Hebrews 1:8]] who holds everything together. [[Colossians 1:17]] We build backups because we are not Him. We put our full weight on Him because He never splits.
FOUR HABITS. Know what you lean on. Keep a second road. Do not overload one old thing. Trust Yahweh first.
${FACTS.youth}
${TALK.youth}`;

const TEEN = `${TITLE}.
WHO SENT THIS. Darrell forwarded a business newsletter with one word above it: Lesson. It covered two failures in a single week: first, a radio failure in air traffic control grounded every departing flight in the country for more than four hours. A day earlier, a big cloud company's mail, meetings and office tools went down, and offices all over the world stopped with it. The newsletter's own takeaway was blunt. The economy leans on a handful of giant cloud companies, and one bad day at one of them can stall the planet. This course already covers the generator in the garage in week one, the risk ranked low in week sixty-six, and the stress test in week eighty-five. This week is about the leaning itself.
THE FRAME. The Assyrian army surrounded Jerusalem. Its field commander stood outside the wall and went after Judah's confidence. [[Isaiah 36:4]] Then he named the weak spot. [[Isaiah 36:6]] An enemy said it, but he was not wrong, because Yahweh had already said the same thing in His own voice, through Ezekiel. [[Ezekiel 29:6]] [[Ezekiel 29:7]] The picture is close to engineering. A reed holds a light load fine, but put your full weight on it and it does not just fail; it fails into you.
THE ENEMY SAW IT FIRST. Notice that the man who spotted the weak point was the one who wanted to break in. That is still how it works. People who want to hurt a system study what it leans on. If they can find the one thing everything depends on, they know where to push. So the weak point you ignore is the one someone else is mapping.
THE DISTINCTION THAT MATTERS. The Word does not blame Judah for dealing with Egypt. It blames them for going there for strength without asking Yahweh. [[Isaiah 30:2]] [[Isaiah 30:3]] [[Isaiah 31:1]] Then it gives the root reason. [[Isaiah 31:3]] Using a cloud company is like trading with Egypt. It is often smart. But if its outage is your outage, with no fallback, you are leaning on the reed.
ONE POINT OF FAILURE. Engineers have a name for this. A single point of failure is the one part that takes everything down with it. When a few companies host most of the world's mail and files, they become one point of failure for millions of people at once. That arrangement is cheap and smooth on good days, and a simultaneous disaster for everyone on bad days.
THE UPGRADE PROBLEM. The newsletter quoted officials who said upgrades overwhelmed an old system. Other reports said the gear is decades old and an update forced a reboot. The investigation was still open the next day, so treat the cause as unconfirmed. But the pattern is real, and Jesus named it. [[Matthew 9:16]] [[Matthew 9:17]] If you pile new load onto a system that cannot flex, with no backup channel ready, that is new wine in an old skin. The fix is a new container. Or at least a second one standing by before you pour.
A BACKUP THAT IS NOT A BACKUP. Here is a trap. You make a second account, but with the same company. Or you save a copy, but to the same cloud. Or your backup sign-in code goes to the same phone you might lose. That is not a second road. It is the same reed in a different spot. A real fallback has to keep working when the first one breaks.
AUDIT YOUR OWN STACK. List what you depend on: your sign-in account, your cloud storage, your school portal, your messaging app, and the phone itself. For each one, ask three things. What breaks if it is down for a day? Is there a fallback? Do you know how to use it? A fallback can be simple. Keep a local copy of files you could never replace. Write key numbers on paper. Have a second way to reach your family.
OUR OWN CODE. The family app ran straight into this. Our records from early November tell it. Sixty-four of ninety-six workflows reached the home server through one outside key. When that key expired on November 4, all sixty-four failed together, and the alarms failed quietly with them because they used the same key, so nobody saw it for two days. The server itself never went down. Someone proposed swapping the key for a different outside service. That was turned down, because it only traded one reed for another. The rule adopted instead was this: the home server opens every road itself, and outside systems are support, never a must. On November 18 that rule gave the reading voice a second engine on the home server, for when the main voice machine is off. Its first live reading is not confirmed yet. And on the day this lesson was built, sixty-four of one hundred and three workflow files still used the old key. The rule is set. The move is not finished.
TRUST BEFORE ARCHITECTURE. Backups are wise, but they are not where your confidence goes. [[Isaiah 30:15]] When Hezekiah got the threat, his first move was to take it to Yahweh. [[Isaiah 37:14]] [[Isaiah 37:15]] [[Isaiah 37:20]] Build second roads because you are responsible. Do not build them because you trust them more than Him.
KEPT. Every system fails at some point. Jesus is the Lamb of Yahweh, [[John 1:29]] the Eternal Son, [[Hebrews 1:8]] by whom all things consist. [[Colossians 1:17]] Your full weight goes on Him alone.
FOUR MOVES. Map what you depend on. Keep a fallback you control. Do not overload old systems without a backup channel. Trust Yahweh before any provider.
${FACTS.teen}
${TALK.teen}`;

const SENIOR = `${TITLE}.
WHO SENT THIS. Darrell forwarded a daily business newsletter, with a single word typed above it: Lesson. Two of its reports belong together. In the first, every departing flight in the nation was held on the ground for an evening after the communications linking aircraft to their controllers failed. In the second, a large company's mail, meeting and office services stopped for a day, and offices throughout the world stopped with them. The newsletter itself observed that the modern economy relies on a small number of very large cloud companies, so that the difficulties of one can disturb the work of the whole planet. The broader case for keeping one's own generator belongs to week one of this course, the neglected risk to week sixty-six, and the trial of the storm to week eighty-five. This week considers the act of leaning itself.
THE FRAME. When Sennacherib's army stood before Jerusalem, his chief officer called up to the men on the wall and questioned the ground of their confidence. [[Isaiah 36:4]] [[Isaiah 36:5]] He then named it with uncomfortable accuracy. [[Isaiah 36:6]] The observation came from an adversary, yet it was true, and Yahweh had already pronounced the same judgment through His prophet. [[Ezekiel 29:6]] [[Ezekiel 29:7]] The figure repays attention. A reed resembles a staff and bears a modest load well enough; it is under the full weight of a man that it splits, and the broken end wounds the hand that relied upon it.
WHAT IS REBUKED. The prophets did not condemn Judah for commerce or correspondence with Egypt. They condemned the habit of seeking strength there without first seeking Yahweh. [[Isaiah 30:1]] [[Isaiah 30:2]] [[Isaiah 30:3]] [[Isaiah 31:1]] And they gave the reason such reliance must end in disappointment. [[Isaiah 31:3]] However great the helper, it remains a helper made of men, and when it falls, all who depend upon it fall together. To employ a large provider is often prudent. To arrange one's affairs so that its failure becomes one's own failure, with no other recourse, is to lean upon the reed.
NEW CLOTH UPON AN OLD GARMENT. The newsletter attributed the grounding to new technology overwhelming an aging communication system; other accounts described equipment some decades old and an update that forced the network to restart. The investigation was not concluded when these words were written, and no final cause is asserted here. Yet our Lord described the pattern plainly. [[Matthew 9:16]] [[Matthew 9:17]] Many households and congregations will recognize it: the one old computer that has been patched for years, the one ledger through which everything passes, the one telephone that holds every number.
A SECOND ROAD. The practical remedy is modest. Make a written list of what the household or the church relies upon: correspondence, calendars, records, photographs, the giving page, the bank. Of each, ask what would cease if it were unavailable for a day, whether another way exists, and who knows how to use it. Keep a printed list of essential telephone numbers, copies of important papers and photographs on a drive held in your own hand, a telephone tree, a small reserve of cash, and an agreed place to meet. The newsletter remarked that some offices resorted to fax machines. Those who smiled at it missed the point: any office that had another way at all continued its work. Review the list each season, as one tests the lamp before the storm rather than during it.
THIS HOUSE, EXAMINED. The family application met this very difficulty a fortnight before the newsletter arrived, and its own records describe it. Of ninety-six automated workflows then counted, sixty-four reached the household's own server through a single outside key. When that key expired on November 4, all sixty-four failed at once, and the failure went unnoticed for two days because the monitors depended upon the same key. The server itself remained sound throughout. A proposal to substitute a different outside service was declined, since it would merely exchange one reed for another, and a rule was adopted in its place: the household's server initiates every road itself, and every outside system is support, never the sole means. On November 18 that rule was applied to the reading voice, which now has a second engine on the household's own server for days when the principal machine is unavailable; its first live reading has not yet been observed. On the day this lesson was prepared, sixty-four of one hundred and three workflow files still referred to the old key, the application itself is served by an outside host, and this lesson was composed with the help of a rented artificial intelligence. The rule is recorded; the work is not complete.
WHERE CONFIDENCE BELONGS. A stronger reed is not the remedy the Word prescribes. [[Isaiah 30:15]] When the Assyrian letter arrived, Hezekiah sought no new ally. [[Isaiah 37:14]] [[Isaiah 37:15]] He laid the whole matter before Yahweh, and asked for deliverance so that all might know who He is. [[Isaiah 37:20]] Prudence builds the second road; faith rests upon Yahweh alone.
KEPT. Every helper composed of men will fail at some hour, our own included. Jesus is the Lamb of Yahweh, [[John 1:29]] the Son given by the Father, [[John 3:16]] the Eternal Son whose throne endures, [[Hebrews 1:8]] by whom all things consist. [[Colossians 1:17]] Upon Him alone may the whole weight be laid.
FOUR PRACTICES. Know what you rely upon. Keep another way that you hold yourself. Do not burden an aging system without a second channel prepared. Place your confidence in Yahweh before any provider, and review your list each season.
${FACTS.senior}
${TALK.senior}`;

const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `${TITLE.toUpperCase()}.
WHO SENT THIS. Darrell forwarded a daily business newsletter with ONE WORD typed above it: Lesson. Two outages in one week: every departing flight held on the ground for an evening when the air traffic radios failed, and one cloud company's mail and office programs going dark for offices around the world.
THE WORD FIRST. Isaiah 36:6 opens the hour - the staff of a broken reed that pierces the hand that leans on it - with Ezekiel 29:7 beside it, Yahweh's own word on the same reed. [[Isaiah 36:6]] [[Ezekiel 29:7]]
THE TEACHING. Leaning is not trading. Use outside helpers gladly, but never as the only way; keep a second road you hold yourself. Do not pour new wine into the one old bottle everything runs through. And lean your whole weight only on Yahweh.
OUR OWN HOUSE. One outside key carried most of the app's work to its home server; when it expired, all of it stopped at once. The house now starts its own roads, and it says plainly the work is not finished.
THE TIERS. DOCUMENTED: both outages, by several reports. REPORTED: the newsletter's country count and dollar figure. NOT VERIFIED: the ground stop's root cause. MEASURED: our own records and workflow folder. ${REVIEW}.
PLACEMENT. Sovereign A.I., week 97, because a household that builds on other people's systems must know where its own second road is.
CLOSE. [[Isaiah 30:15]] Jesus, the Lamb of Yahweh and the Eternal Son, is the One who does not split.`,
  inApp: `One screen to read in this app, and one page in your Study.
In the app: open Sovereign A.I. week 97 and read the band that fits the reader in front of you - the lesson carries all four, child, youth, teen and senior, and each one is whole on its own. Then write down what your house leans on, and for each one ask: if this stopped for a day, what would stop, and what is our second road.
In your Study, write three lines. One thing you lean on with no second road. The second road you will build this week. The person who will know how to take it. [[Isaiah 31:1]]`,
  anchor: {
    ref: 'FILLED FROM THE PLACEHOLDERS',
    theme: `[[Isaiah 36:6]] [[Ezekiel 29:7]] [[Isaiah 31:3]] [[Matthew 9:17]] [[Isaiah 30:15]] [[Isaiah 37:14]]`,
  },
  rpe: {
    research: `RESEARCH. Three readings, each landing on your own house.
First, read Isaiah 36:1-10 and Ezekiel 29:6-7. Mark who called Egypt a reed, and Who said it first. Write one sentence on something you lean on with your full weight.
Second, read Isaiah 30:1-3, 30:15 and 31:1-3. Mark what was rebuked: not the trading, but the going down for strength without asking. Write down one helper you went to before you prayed.
Third, read Matthew 9:16-17. Write down the one old thing in your house or church that keeps getting patched.
And one verification reading, because this course works this way. Both outages are documented by several reports; the country count and the dollar figure are only reported; the cause of the ground stop is not verified. Our house was read from its own records.`,
    plan: `PLAN. Decide four steps before the week starts, and decide who hears them.
One: the list. Write down what your house leans on: mail, files, photos, phone numbers, the bank, the group chat.
Two: the question. For each, what stops if it is gone for a day?
Three: the second road. Pick one item with no second road and build one: a printed list, a copy on a drive you hold, a phone tree, a meeting place.
Four: the trust. Pray over the list before you act on it, the way Hezekiah spread the letter out.
Then name the person who will ask you about all four on the same day next week.`,
    execute: `EXECUTE. Keep it for one week, out loud, with one other person.
Build the one second road you chose. Show one other person in your house how to take it.
Teach the verse at a meal: lean on a broken reed and it will go into your hand. Ask a child what they would do if the phones stopped.
At the end of the week, answer three questions to the person who is asking. What did we lean on? What second road did we build? Who knows how to take it?
Measure the growth the Word's way - by the fruit, by the occasions, and by the days.`,
  },
  media: [],
  benefits: [
    `Darrell's one word, Lesson, over a business newsletter, answered from the Word: two outages in one week, read as one story.`,
    `The hour opened by Isaiah 36:6, so a dependency is seen as a reed that pierces the hand that leans on it.`,
    `Ezekiel 29:6-7 laid beside it, so the reed is named in Yahweh's own word and not only in an enemy's mouth.`,
    `Leaning told apart from trading (Isaiah 30:2-3; 31:1, 3): outside helpers are support, never the only way.`,
    `The aging system and the new load taught through new wine and old bottles (Matthew 9:16-17), without claiming a cause still under investigation.`,
    `A practical second-road list for a family or a church: printed numbers, a copy you hold, a phone tree, cash for a day, a meeting place.`,
    `Our own house measured, not painted: one outside key that carried most of the app's work, what failed, what was decided, and what is still not done.`,
    `Hezekiah's order kept: the letter spread before Yahweh first, then wise action (Isaiah 37:14-15, 20).`,
    `Isaiah 30:15 keeping the trust where it belongs: in returning and rest, not in a stronger reed.`,
    `Jesus confessed as the Lamb of Yahweh and the Eternal Son, by whom all things consist (Colossians 1:17).`,
    `The documented, the reported, the unverified and the measured told apart in every reader place, with a dated re-review.`,
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'light',
      verse: 'Isaiah 31:1',
      title: 'The church that met on the lawn',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A small church kept everything on one service: the song slides, the sign-up sheets, the giving page, the prayer list, and the group chat where every announcement went out. It worked so well that nobody thought about it.
One Sunday morning the service was down. The slides would not load. The chat was silent. The deacon who usually ran the screen stood at the back looking at his phone as if staring would help.
Then an older woman in the third row reached into her purse and pulled out a folded paper. It was the phone tree she had kept up to date by hand for twelve years, mostly because nobody had told her to stop. Two teenagers took the list and started calling. The pastor led the songs from memory. The children's teacher wrote the prayer list on the back of a bulletin.
By the time the service came back that afternoon, the church had already had one of its best mornings in a year. The next week the deacons made copies of her phone tree, and someone asked her to teach the young people how she kept it.`,
    },
    {
      kind: 'parable',
      tone: 'solemn',
      verse: 'Isaiah 36:6',
      title: 'The one account',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A man ran a small delivery business out of his truck. Every order, every customer address, every invoice and every payment ran through one online account. He had thought about keeping a copy somewhere else once, and decided it would be a waste of an afternoon.
One Monday the account was locked while the company behind it worked through an outage of its own. He could not see his orders. He could not reach his customers, because their numbers lived in the same place. He drove to the places he could remember and waited by the phone for the rest.
The account came back on Wednesday. By then two of his biggest customers had found someone else, and a week of payments had been missed. Nothing he had done was wrong on its own. The service was good, and he had chosen it for good reasons. He had simply leaned his whole weight on it. When he finally made a paper list of his customers that night, he wrote one line across the top: support, never the only way.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'In Isaiah 36:6, what did the enemy officer call Egypt, the help Judah was trusting in?',
        options: ['A wall of stone', 'The staff of a broken reed that pierces the hand of the one who leans on it', 'A strong tower'],
        answer: 1,
        explain:
          'A reed looks like a staff and holds a little weight, but under a full lean it splits and goes into the hand. The enemy was right about Egypt.',
      },
      {
        q: 'Where else does the Word call Egypt a staff of reed, in Yahweh’s own words?',
        options: ['Genesis 12', 'Ezekiel 29:6-7', 'Psalms 23'],
        answer: 1,
        explain: 'Through Ezekiel, Yahweh said Egypt had been a staff of reed to Israel: when they leaned on it, it broke and rent their shoulder.',
      },
      {
        q: 'What was Judah actually rebuked for in Isaiah 30:2 and 31:1?',
        options: [
          'For ever speaking to Egypt',
          'For going down to Egypt for strength and trusting its horses without asking Yahweh or looking to the Holy One',
          'For building houses',
        ],
        answer: 1,
        explain: 'Leaning is not trading. The sin was running to Egypt for strength without asking Yahweh first.',
      },
      {
        q: 'What reason does Isaiah 31:3 give for why the leaning always ends badly?',
        options: [
          'Egypt was too far away',
          'The Egyptians are men, and their horses flesh, and when Yahweh stretches out His hand both the helper and the helped fall together',
          'The horses were too slow',
        ],
        answer: 1,
        explain:
          'The biggest helper is still made of men. When it falls, everyone holding on to it falls with it, exactly as one cloud outage stopped offices worldwide.',
      },
      {
        q: 'Which saying of Jesus fits a system overloaded with new parts on old equipment?',
        options: [
          'Love your neighbor',
          'No one puts new wine into old bottles, or the bottles break and the wine runs out (Matthew 9:17)',
          'Let the children come',
        ],
        answer: 1,
        explain:
          'If the reports hold, new load on an old system with no second channel ready is new wine in an old bottle. The final cause of the ground stop is still not verified.',
      },
      {
        q: 'Is using a large cloud company for mail and files a sin, according to this lesson?',
        options: ['Yes, always', 'No; it is often wise, but it must be support, never the only way', 'Only on Sundays'],
        answer: 1,
        explain: 'Trading with Egypt was not the problem; leaning on it with no other way was. Use the helper, and keep a second road.',
      },
      {
        q: 'What is a second road, in plain practice?',
        options: [
          'A second account with the same company',
          'A way you hold yourself that keeps working when the main one stops: a printed list, a copy you hold, a phone tree, a little cash, a meeting place',
          'A faster internet plan',
        ],
        answer: 1,
        explain: 'A second account with the same company is the same reed. A second road is one that does not break when the first one does.',
      },
      {
        q: 'What happened in our own house when one outside key expired?',
        options: [
          'Nothing at all',
          'Most of the app’s automated work that reached the home server stopped at once, unseen for two days, though the server itself was fine',
          'The home server broke',
        ],
        answer: 1,
        explain:
          'The work could only reach the server down one road. So the house decided the home server starts its own roads, and outside systems are support, never the only way.',
      },
      {
        q: 'What did Hezekiah do first when the threatening letter came (Isaiah 37:14-15)?',
        options: ['He looked for a stronger ally', 'He went up to the house of Yahweh, spread the letter before Him, and prayed', 'He hid the letter'],
        answer: 1,
        explain: 'He laid the whole problem before Yahweh first, and only then acted. Prudence builds the second road; faith rests on Yahweh.',
      },
      {
        q: 'According to Isaiah 30:15, where does the strength of Yahweh’s people come from?',
        options: ['From a bigger ally', 'In returning and rest, in quietness and in confidence', 'From more horses'],
        answer: 1,
        explain:
          'The answer to a broken reed is not a stronger reed. It is trust in Yahweh, and Jesus, the Eternal Son by whom all things consist, does not split.',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read Isaiah 36:4-6 aloud before you say one word about any outage. Then read Ezekiel 29:6-7 aloud and write one word on the board: lean. Then ask the room: what do you lean on with your whole weight?
MINUTES 0 TO 12 - THE REED. Isaiah 36:4-6 and Ezekiel 29:6-7. Ask: who called Egypt a reed, and Who had already said it?
MINUTES 12 TO 24 - LEANING IS NOT TRADING. Isaiah 30:1-3 and 31:1-3. Ask: what exactly was rebuked? Make sure the room hears that using a helper is not the sin.
MINUTES 24 TO 36 - THE TWO OUTAGES. Tell the ground stop and the cloud outage plainly, with the tiers: documented, reported, not verified. Read Matthew 9:16-17 for the old system and the new load, and do not claim a cause still under investigation.
MINUTES 36 TO 48 - THE SECOND ROAD. Have each family list what it leans on and pick one second road to build. Tell our own house's story: the one key, the decision, and the work not yet finished.
MINUTES 48 TO 60 - WHERE THE TRUST GOES. Isaiah 30:15 and Isaiah 37:14-15, 20. Close with John 1:29, John 3:16, Hebrews 1:8 and Colossians 1:17, and give the four household habits and the week's assignment.
WHAT NOT TO DO. Do not teach that every cloud company is evil or that technology is a sin. Do not claim a cause for the ground stop that the investigators have not given. Do not bring in the newsletter's political items; this hour is about leaning, not about any party. Do not read the newsletter in a voice of authority over the Word; the Word frames the hour.`,
    talkingPoints: [
      `The staff of a broken reed pierces the hand that leans on it (Isaiah 36:6).`,
      `Yahweh named the same reed through Ezekiel (Ezekiel 29:6-7).`,
      `Leaning is not trading (Isaiah 30:2-3).`,
      `They look not unto the Holy One (Isaiah 31:1).`,
      `The helper and the helped fall together (Isaiah 31:3).`,
      `New wine in old bottles (Matthew 9:16-17).`,
      `Support, never the only way.`,
      `A second road you hold yourself.`,
      `Our house: one key, one stop, and a rule written down.`,
      `The work is not finished, and we say so.`,
      `Hezekiah spread the letter before Yahweh (Isaiah 37:14).`,
      `In quietness and in confidence shall be your strength (Isaiah 30:15).`,
    ],
    discussionPrompts: [
      `What does our house lean on with no second road?`,
      `What would stop first if the internet were gone for a day?`,
      `What old thing in our church keeps getting patched?`,
      `Who in our family knows the second road?`,
      `When did you go to a helper before you went to Yahweh?`,
      `What one second road will we build this week?`,
    ],
  },
  lesson: [...LESSON, FACTS.lesson, TALK.lesson].join('\n\n'),
  levels: { child: CHILD, youth: YOUTH, teen: TEEN, senior: SENIOR },
};
const filled = fillDeep({ ...MODULE, anchor: { ...MODULE.anchor, ref: '' } });
readerRefs.length = 0;
seenReader.clear();
filled.bigIdea = fill(MODULE.bigIdea, true);
filled.inApp = fill(MODULE.inApp, true);
filled.lesson = fill(MODULE.lesson, true);
filled.levels = {
  child: fill(CHILD, true),
  youth: fill(YOUTH, true),
  teen: fill(TEEN, true),
  senior: fill(SENIOR, true),
};
filled.anchor.theme = fill(MODULE.anchor.theme);
filled.anchor.ref = readerRefs.join('; ');
// -----------------------------------------------------------------------------
// Refuse to splice a lesson that fails its own measures
// -----------------------------------------------------------------------------
const { fourBandFaults, fk, words, overlapOf, FOUR_BANDS } = await import('../app/src/__tests__/fixtures/four-band-ladder.js');
const adultWords = words(filled.lesson);
console.log(`sov97: adult prose words ${adultWords} fk ${fk(filled.lesson).toFixed(2)}`);
for (const b of FOUR_BANDS) {
  console.log(
    `sov97: ${b} words ${words(filled.levels[b])} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} fk ${fk(filled.levels[b]).toFixed(2)} overlap-adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`sov97: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(filled.levels[FOUR_BANDS[i]], filled.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(filled);
// --dry measures and reports, and writes nothing.
if (process.argv.includes('--dry')) {
  console.log(faults.length ? faults.join('\n') : 'sov97: no four-band faults');
  process.exit(0);
}
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('sov97: refusing to splice a lesson that fails the four-band ladder');
}

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov97: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov97: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov97: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov97: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov97: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov97: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov97: the id survived the excision; refusing to rebuild');
}

const block = JSON.stringify(filled, null, 2)
  .split('\n')
  .map((l) => `  ${l}`)
  .join('\n');
const tailHasComma = /\}\s*,\s*$/.test(src2.slice(0, end2));
const next = tailHasComma ? `${src2.slice(0, end2)}\n${block},${src2.slice(end2)}` : `${src2.slice(0, end2)},\n${block}${src2.slice(end2)}`;

const weeks = (text) => [...new Set([...text.matchAll(/sov(\d+)-/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
const before = weeks(src2);
const after = weeks(next);
if (after.length !== before.length + 1) throw new Error(`sov97: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov97: week ${WEEK} is already taken`);
if (after[after.length - 1] !== WEEK) throw new Error(`sov97: week ${WEEK} is not the top of the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov97: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov97: spliced ${ID}`);
console.log(`sov97: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov97: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
