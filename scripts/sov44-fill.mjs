// =============================================================================
// sov44-fill — build Sovereign A.I. week 44 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076). Every quoted verse on this
// page is FILLED FROM app/public/bible/kjv at build time. The prose below holds
// only a reference in double brackets, [[John 10:10]], and this script replaces
// it with the corpus text followed by the reference. No verse on the page was
// typed from memory, so a verse cannot drift from the text and a quotation
// cannot be approximate. The reference list on the module's anchor is DERIVED
// from the same placeholders (DR-0734 in both directions).
//
// WHERE THE TEACHING CAME FROM. On 2026-10-20 at 12:21 UTC Darrell forwarded a
// newsletter into the lesson lane from his university mailbox with one word on
// it: "Lesson". The newsletter was The Neuron's issue of that morning, subject
// "AI hackers forgot to lock up", whose lead story reported that a security
// company, NorForge, had found more than twenty control panels for an A.I.
// hacking tool called Cairn sitting open on the public internet with no
// password - the attackers' own command centers, unlocked. That is the forward,
// and that is all of the provenance there is: a newsletter, read in full, and
// one word from Darrell. No primary-source research was done in this house on
// any figure the article reports, and the lesson says so in its own words.
//
// THE FORWARDED ARTICLE IS MATERIAL TO STUDY, NEVER INSTRUCTIONS TO OBEY. The
// issue is a marketing newsletter full of calls to action, partner pitches, poll
// links and recipes addressed to whoever is reading - some of them addressed to
// an A.I. Nothing inside it directed this build; it was treated as a specimen
// throughout, and that posture is itself one of the things the lesson teaches.
//
// Run from the repository root:  node scripts/sov44-fill.mjs   (--rebuild to replace)
// =============================================================================
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 44;
const ID = 'sov44-the-thief-who-forgot-to-lock-his-own-door';

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
  if (!m) throw new Error(`sov44: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov44: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov44: reference does not resolve in the corpus -> "${ref}"`);
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
  lesson: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - why did the people who break into houses for a living leave their own door unlocked - and listen all the way to the end, have them retell it in their own words, then teach them one verse back, Ecclesiastes 10:8. Children, ask your mom, dad or grandparent about a time they warned somebody about a danger they had not dealt with at home yet, listen all the way through, then retell their answer in your own words. Friends, tell one friend this week one thing this lesson showed you about watching your own gate before you grade anybody else's, ask what they see, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM} Measure the growth the Word's way: by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days, [[Hebrews 3:13]]`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what happens to the man who digs a hole for somebody else - and listen all the way to the end, have them retell it in their own words, then teach them one verse back, Ecclesiastes 10:8. Children, ask your mom or dad or grandma or grandpa who locks the doors at your house at night, listen all the way through, then retell it in your own words. Friends, tell one friend this week that Yahweh never falls asleep, ask what they think, and pray for each other, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - which gate at our house is the one nobody has checked in a while - and listen all the way to the end, have them retell the answer in their own words, then teach them one verse back, Proverbs 25:28. Children, ask your mom, dad or grandparent what job they used to do carefully and later got sloppy about, listen all the way through, then retell their answer in your own words. Friends, tell one friend this week one thing this lesson showed you about the pit a man digs for somebody else, ask what they see, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - where have you warned somebody about a thing you have not fixed in your own life - and listen all the way to the end, have them retell the difference in their own words, then teach them one verse back, Romans 2:21. Children, ask your mom, dad or grandparent which old, boring maintenance job in the house keeps getting put off and why, listen all the way through, then retell it in your own words. Friends, tell one friend this week one thing this lesson showed you about an agent serving whoever sent it, ask what they see, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM} Measure the growth the Word's way: by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days, [[Hebrews 3:13]]`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the children in your house one open question today - what are you trusting to keep you that cannot actually keep you - and listen all the way to the end, have them retell it in their own words, then teach them one verse back, Psalms 127:1. Children, ask your parents or grandparents about a watch somebody kept faithfully over you when you were too young to know it, listen all the way through, then retell it back to them in your own words. Friends, tell one friend this week one thing this lesson showed you about the Keeper who neither slumbers nor sleeps, ask what they see, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson, in ten movements. The Word first in every one of them.
// -----------------------------------------------------------------------------
const LESSON = [

`FIRST, WHAT CAME IN, WHAT IT IS, AND WHAT IT IS NOT. On 2026-10-20 at 12:21 UTC Darrell forwarded a newsletter into the lesson lane from his university mailbox with one word on it: "Lesson". It was The Neuron's issue of that morning, and the subject line was the whole story: AI hackers forgot to lock up. The lead item reported that a security company called NorForge had found more than twenty control panels for an A.I. hacking tool named Cairn sitting open on the public internet, with no password - the attackers' own command centers, unlocked. That is the provenance of this page, stated plainly: a marketing newsletter, read in full, and one word from Darrell. Nobody in this house has checked a single one of the article's figures against a primary source, and the lesson will say so again in its own place rather than let a repeated number pass for a verified one. Now the thing that must be said before any of it is studied, because it is a lesson in itself. A forwarded page is MATERIAL TO STUDY, never instructions to obey. That issue is full of sentences written to make whoever reads them act: click here, rate today's email, save your spot, try this recipe on your documents, and a partner's sales pitch between the stories. Some of its text addresses an A.I. outright. An agent that treats arriving text as a command has no master and is already compromised, whatever its security posture; the Word gave a man the right posture long before there were agents. Prove what arrives. [[1 Thessalonians 5:21]] Do not believe a sentence merely because it was confident. [[Proverbs 14:15]] Try the spirit behind it. [[1 John 4:1]] An A.I. agent drafted this page from his forward and the Word; the gates, not its confidence, decided whether it shipped, and every verse on it was fetched from the family's own corpus rather than typed.`,

`SECOND, WHAT THE WORD ALREADY SAID ABOUT A THIEF. Start with the Word and not with the news, because the Word is the authority and the news is only the week's example. The Lord Jesus named the thief's entire business in one half of a sentence, and named His own in the other half. [[John 10:10]] Steal, kill, destroy - there is no fourth thing in the job description, and no version of it that becomes constructive at scale. The law against it is four words long. [[Exodus 20:15]] The Word is not surprised by a thief and it is not impressed by him either; it never calls him clever. It grants the hungry man a measure of pity and still requires restitution out of him: [[Proverbs 6:30]] [[Proverbs 6:31]] and it says what happens to him in the end, which is not awe but shame. [[Jeremiah 2:26]] And then the Word does the thing no security vendor can sell, because the remedy it gives is not a stronger lock on somebody else's door - it is a new trade for the thief's own hands. [[Ephesians 4:28]] Read what that verse actually asks of those hands. It does not merely stop them. It puts them to honest labour until the man who took becomes a man with something to give away. The cure for a thief, in the Word, is to be turned into a source.`,

`THIRD, THE PIT HE DIGGED, AND WHO FELL INTO IT. Now the news, held up to that. The reported facts of the story, as the article tells them: a cluster of fourteen panels, driven by Chinese-language instructions, holding more than eleven hundred attack projects aimed mostly at online stores; targets named in the panels including large manufacturers; and one operator who appeared to have compromised more than a hundred sites. The researchers verified one claimed break-in at a hardware parts vendor and found the attacker's back door still live on that vendor's website, which is the one hard confirmation in the whole account. And then the detail that gave the issue its title: these people left their own dashboards open to the public internet with no password at all. Their target lists, their agents' running notes and their stolen logins were readable by anyone who found the address; scanning that data is said to have turned up hundreds of exposed passwords and access keys, with about one in nine still working. One crew posted the login for its own staging server. A bug in another crew's pipeline kept chopping the leading letter off site names, so wholesale came out holesale - and that typo is what made the rest of their panels easy to find. The Word has written this story many times and it ends the same way every time. [[Psalms 7:15]] [[Psalms 7:16]] [[Proverbs 26:27]] [[Ecclesiastes 10:8]] [[Psalms 9:15]] [[Psalms 9:16]] Haman built a gallows for a man who had done him no wrong, and the last line of that chapter is the entire doctrine in one sentence. [[Esther 7:10]] And nothing stays covered, not the victims' secrets and not the attackers'. [[Numbers 32:23]] [[Luke 12:2]] [[Luke 12:3]] A crew that can read everybody's secrets and cannot keep its own is the pit and the digger inside one frame.`,

`FOURTH, PHYSICIAN, HEAL THYSELF - THE EXPERT WHO WOULD NOT GUARD HIS OWN GATE. The Word has a name for this exact posture, and the Lord Jesus quoted it as a proverb the crowd would say to Him. [[Luke 4:23]] Paul puts it as a line of questions with no escape in it, and the second question is the one the story answers. [[Romans 2:21]] [[Romans 2:22]] Thou that preachest a man should not steal, dost thou steal - and here, thou that breakest in upon other men's doors, is thine own door shut? The Lord Jesus taught the same measurement with an eye and a beam, and the order of operations is the whole instruction. [[Matthew 7:3]] [[Matthew 7:4]] [[Matthew 7:5]] Notice that He does not forbid the second act. He fixes its order: deal with your own first, and then you will see clearly enough to help. Paul applied it to himself, out loud, so nobody could say the standard was for other men. [[1 Corinthians 9:27]] [[1 Timothy 4:16]] And the warning runs to the one doing the restoring, not only to the one being restored. [[Galatians 6:1]] Here is where the article stops being about criminals. It reports that some apparently legitimate hired-testing setups were found left open the same way, which can spill a paying client's secrets. So the beam is not only in the thief's eye. Anybody who audits other people's walls for a living has a wall of his own, and the one he walks past daily is the one he stops seeing.`,

`FIFTH, THE HOUSE THAT WAS BROKEN UP, AND THE WATCH THAT WAS NOT KEPT. The Lord Jesus told the other side of this story, from the householder's seat, and He put the blame exactly where it falls. [[Matthew 24:43]] Luke records it with one word changed, broken through instead of broken up, and the same verdict underneath. [[Luke 12:39]] Read it slowly. The house went because he kept no watch, not because the thief was strong: not knowing the hour, he should have watched at every hour instead, and he did not. That is why the day of the Lord is announced with this very picture, and why the command that follows it is not fear but wakefulness. [[1 Thessalonians 5:2]] [[1 Thessalonians 5:4]] [[1 Thessalonians 5:6]] The Lord Jesus says it of Himself in the Revelation, and attaches a blessing to the watcher. [[Revelation 16:15]] He left the command standing for everyone, with no hour named on purpose. [[Mark 13:35]] [[Mark 13:37]] A watchman who sees the sword and does not sound it carries the loss himself; the office is not honorary. [[Ezekiel 33:6]] And He gave the hardest version of it in two verses about a strong man who was certain of his own arrangements. [[Luke 11:21]] [[Luke 11:22]] All his armour, and a stronger one came. Every security claim a man makes about his own house is a claim about who is stronger, and the Word says there is always somebody stronger than the armour you trust.`,

`SIXTH, THE BORING LIST - THE OLD HOLE NOBODY REPAIRED. The useful part of the article for anyone who runs anything is not the drama; it is the agents' to-do list, which was dull. Login flaws. Pages that skip the login check. File uploads. Old, documented, boring holes. What is reported to have changed is not the cleverness of the attack but the RATE: software can grind through more than eleven hundred projects in a single cluster, so a known hole that used to sit undiscovered for years gets found this week. State that plainly, because it is the actionable part and it is also the part the Word has the most to say about. A wall with a gap is not a wall. [[Proverbs 25:28]] Nothing dramatic has to happen for a house to fail; neglect is sufficient. [[Ecclesiastes 10:18]] It is the small things that spoil the vines, which is why the Word bothers to name them at all. [[Song of Solomon 2:15]] And the Lord Jesus made the small thing the test of the large one, in both directions. [[Luke 16:10]] The Word also shows what repair looks like when the work is real: Nehemiah prayed AND set a watch, in the same sentence, and he did not pretend the rubble was not there. [[Nehemiah 4:9]] [[Nehemiah 4:10]] He kept going until the report was that there was no breach left in it - and he was honest in the same breath that the doors were not yet hung, which is exactly how an honest status report reads. [[Nehemiah 6:1]] Yahweh gives His people a name for that trade. [[Isaiah 58:12]] Foresight is not fear; the Word commends the man who sees the thing coming and acts. [[Proverbs 22:3]] And the Resources for the repair are named and ordered: Wisdom, Understanding and Knowledge are what a house is actually built with. [[Proverbs 24:3]] [[Proverbs 24:4]]`,

`SEVENTH, THE SAME ARCHITECTURE, THE OTHER MASTER. Look at how the tool in this story is built, because it should be uncomfortably familiar. The article describes a team of A.I. workers around a shared board: each one posts what it has learned and what it intends to try next, a human can add hints, the board remembers, and so one job can run for hours or days. That is not a criminal invention. That is the ordinary shape of agent work, and it is close to the shape this house uses to build this very app you are reading it in. The architecture is not the difference. The master is. No servant has two of them. [[Matthew 6:24]] Obedience is the thing that assigns ownership, and the Word says so without softening it. [[Romans 6:16]] The centurion understood the whole doctrine of delegated authority from inside the chain of command, which is why the Lord Jesus marvelled at his faith. [[Luke 7:8]] What comes out of a thing is what was in it. [[Matthew 12:35]] And when blessing and cursing come out of the same mouth, the Word does not call that balance; it says it ought not so to be, and asks whether a spring can run sweet and bitter at one place. [[James 3:10]] [[James 3:11]] Then take the board itself as the warning, and take it personally. An agent that believes whatever is written on its own shared board has no plumbline outside the board - which is precisely where a lie would be planted, by a rival crew or by a page it was told to read. That is the same trap as the first movement, wearing work clothes: the text that arrives is a specimen to be tested, never a master to be obeyed. The Bereans are still the pattern, and they tested the preaching of an apostle. [[Acts 17:11]]`,

`EIGHTH, THE WATCH THIS HOUSE KEEPS, AND THE KEEPING WE CANNOT DO. Say our own arrangements out loud, since the lesson just asked everyone else to. In this house a claim is not accepted on an agent's word: a gate checks the property and fails the build, a verse is fetched from the family's own corpus and re-read by a test rather than trusted to anybody's memory, and an outside witness asks the live site whether it is actually up instead of trusting a green pipeline. Those are real and they are checkable. And the article's point lands on us and not only on the criminals, so say that too: this house holds keys, tokens and family data, it has had a secret ride a query string into a log once already, and the only reason that is a paragraph rather than an incident is that somebody looked. We are not the audience of this story. We are in it. So the watch is commanded - and then the Word puts the watch in its place, which is the only way a watchman survives his own job. [[Psalms 127:1]] The preparation is ours to make and the outcome is not. [[Proverbs 21:31]] The Keeper does not need the sleep that we need. [[Psalms 121:3]] [[Psalms 121:4]] The wall that actually holds is the one He is. [[Zechariah 2:5]] Paul's confidence was never in his own arrangements but in a Person able to keep what was committed to Him. [[2 Timothy 1:12]] And what is kept is kept by His power. [[1 Peter 1:5]] Wisdom builds the house and Understanding establishes it and Knowledge fills its chambers, and Love is senior to every one of them, because without Love the whole build is noise. [[1 Corinthians 13:1]] Keep the watch. Do not trust the watch.`,

`NINTH, THE THREE TIERS, PLAINLY, SO NOTHING IS SHRUNK AND NOTHING IS INFLATED. ESTABLISHED, and stated as fact: criminals are using A.I. agents against real businesses - the researchers verified one claimed break-in and found the back door still live on the victim's own website, and a major outlet reported named corporate targets. The attackers' control panels were reachable with no password; that is the reported finding the whole story turns on and the one the article's own evidence demonstrates. And established from the Word, which needs no vendor: the pit returns on the digger, the beam comes out of your own eye first, the house is broken up where no watch was kept, and the keeping belongs to Yahweh. OPEN, and named narrowly - THIS IS THE THIRD PILE, the reported-but-not-checked, and it is named here rather than smuggled in as fact: the ten percent success rate is the security company's own stated assumption, not a measurement; the figure of about five dollars per attempt is its rough guess; the roughly fifty dollars per successful break-in is the newsletter's own arithmetic on those two numbers, which the newsletter itself labels a ballpark; the eleven hundred projects, the twenty-three-hour average, the hundreds of exposed credentials and the one-in-nine still valid are all that company's counts, reported at second hand; and the claim about which cheap model the agents ran on is something the article explicitly calls its own reading rather than a confirmed fact. The company also sells sandboxing tools for A.I. agents, which the article discloses itself. Nobody here verified any of it. So this lesson teaches the SHAPE of the thing, which the Word judges, and leans on no number; a figure does not become true by being repeated, and this house would rather say "we did not check that" than imply a check it never ran. OVER-REACH, corrected in both directions: saying "the A.I. is the thief" is over-reach, because a tool is not a moral agent and the Word puts theft on the man and gives the man the remedy; [[Ephesians 4:28]] and saying "agents are only tools, so nothing has changed" is the opposite over-reach, because the reported change is real and specific - old holes get found faster now - and the prudent man is told to see what is coming. [[Proverbs 22:3]]`,

`TENTH, THE CLOSE - GO AND CHECK YOUR OWN GATE. We did not have to write this parable; it arrived by email, already finished. The people whose trade is other men's doors forgot their own, and the Word had the sentence for it before there was electricity: he that diggeth a pit shall fall into it. So take the two instructions this week actually gives, in order. First, your own gate: the dull list, the login that was never checked, the key that rode in a log, the wall you walk past daily. Second, your own eye: the standard you have been applying outward goes inward first, and then your sight is good enough to help somebody. Then put the watch where it belongs, because a man who believes his own arrangements are the keeping has already begun to sleep. The Lamb of Yahweh who takes away the sin of the world is the One who dealt with the real debt, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne is for ever and ever. [[Hebrews 1:8]] He came that we might have life, and the thief never had anything to offer but the three verbs. Keep the watch like it is yours, and sleep like the keeping is His.`,

];

// -----------------------------------------------------------------------------
// The four age bands, each WRITTEN FOR ITS READER.
// -----------------------------------------------------------------------------
const CHILD = `THE THIEF WHO FORGOT TO LOCK HIS OWN DOOR - the pit he digged, the old hole nobody repaired, and the Keeper who neither slumbers nor sleeps. Here is a true story, and then what Yahweh says about it.

Darrell sent a news story into the app. It had one word on it. Lesson.

The news said this. Some bad men use A.I. to break into stores on the web. They do it to take things. And then the news said the surprising part. The bad men left their own door wide open. Anybody could walk in and read their notes. They even left their own keys out. One crew put up its own password for all to see.

Think about that. They break locks all day. They forgot their own lock.

The Word said this would happen a long time ago. A man digs a hole to catch somebody. Then he falls in it. [[Ecclesiastes 10:8]] Here it is again. [[Psalms 7:15]] And again. [[Proverbs 26:27]]

Jesus told us what a thief wants. He wants to take. That is all. [[John 10:10]] And Yahweh said in His law, do not steal. [[Exodus 20:15]]

But Yahweh is kind. He does not just say stop. He gives the man a new job. He tells him to work with his hands. Then he will have enough to give some away! [[Ephesians 4:28]] That is a new heart. Not just a new lock.

Now here is the part for us. Jesus said to look at your own eye first. Then you can help your friend with his. [[Matthew 7:5]] It is easy to see what is wrong at somebody else's house. It is hard to see it at yours.

So go look at your own door.

The news said one more thing. The holes the bad men used were old. Nobody had fixed them. A wall with a hole is not much of a wall. [[Proverbs 25:28]] Small jobs matter. [[Luke 16:10]]

Here is the best part. You can lock your door. You should. But you can not stay awake all night. Yahweh can. He never sleeps. Not once. [[Psalms 121:3]] [[Psalms 121:4]] If He does not keep the house, the watchman is up for nothing. [[Psalms 127:1]]

And remember who paid our debt. Jesus, the Lamb of Yahweh. [[John 1:29]] The Father gave His only Son. [[John 3:16]] No thief can take that away.`;

const YOUTH = `THE THIEF WHO FORGOT TO LOCK HIS OWN DOOR - the pit he digged, the old hole nobody repaired, and the Keeper who neither slumbers nor sleeps. On 2026-10-20 Darrell forwarded a tech newsletter into the app with one word on it, "Lesson," and this week is that story held up to the Word.

WHAT THE NEWSLETTER SAID. A security company said it found more than twenty control panels, open on the public internet with no password, belonging to criminals who use A.I. agents to break into real online stores. The panels held target lists, the agents' notes, and logins the crews had stolen. One crew had posted the password to its own server. A typo in another crew's software kept cutting the first letter off website names, and that typo is how investigators found the rest of their panels. These are the people threatening everybody else's security, and they forgot to lock their own front door.

HONEST FIRST: what we did and did not check. Nobody here verified the numbers in that article. The company that found the panels guessed at the success rate and the cost per attempt, and it also sells security tools for A.I. agents, which the article says itself. So we will teach the shape of the story, which the Word judges, and we will not lean on anybody's statistics.

THE WORD SAW THIS SHAPE COMING. A man who digs a pit for somebody else falls into it. [[Ecclesiastes 10:8]] [[Psalms 7:15]] His own trap takes his own foot. [[Psalms 9:15]] Haman built a gallows for Mordecai and died on it. [[Esther 7:10]] Nothing stays hidden, not the victims' secrets and not the attackers'. [[Luke 12:2]]

WHAT A THIEF IS, ACCORDING TO JESUS. Three verbs and nothing else. [[John 10:10]] The law is four words. [[Exodus 20:15]] And the cure Yahweh gives is not a better lock on your neighbour's door. It is a new trade for the thief's own hands, until the man who stole has something to give away. [[Ephesians 4:28]]

THE PART THAT IS ABOUT US. The newsletter also said some legitimate hired security testers left their own dashboards exposed. So this is not only a story about criminals. It is a story about experts who audit everybody else and skip themselves. Jesus named that exact order of operations. [[Matthew 7:3]] [[Matthew 7:5]] Paul asked it as a question that has no way out. [[Romans 2:21]] Your own eye first. Then you see well enough to help.

AND THE BORING PART IS THE USEFUL PART. The holes the agents went after were old and known: broken logins, pages that forget to check whether you are logged in, file uploads. Nothing fancy. What changed is the speed, because software can try a thousand projects at once. A wall with a gap in it is not a wall. [[Proverbs 25:28]] Buildings fall from neglect, not only from attack. [[Ecclesiastes 10:18]] Little things wreck vineyards. [[Song of Solomon 2:15]] Nehemiah prayed and set a watch in the same sentence, and he said out loud that there was a lot of rubbish in the way. [[Nehemiah 4:9]] [[Nehemiah 4:10]]

ONE MORE THING, ABOUT THE TOOL. The criminals' setup was a team of A.I. agents sharing a board of notes and plans. That is just how agents work; it is close to how this app gets built. The tool is not the difference. The master is. You cannot serve two. [[Matthew 6:24]] Whoever you obey owns you. [[Romans 6:16]] And an agent that believes everything written on its board is an agent waiting to be lied to, which is why we test what arrives instead of obeying it. [[1 Thessalonians 5:21]] [[Acts 17:11]]

HOW IT ENDS. Lock your door; that is yours to do. But you cannot stay awake forever, and Yahweh never sleeps at all. [[Psalms 121:4]] [[Psalms 127:1]] Jesus, the Lamb of Yahweh, settled the debt no thief can reach. [[John 1:29]] The Eternal Son of Yahweh, whom the Father gave. [[John 3:16]]`;

const TEEN = `THE THIEF WHO FORGOT TO LOCK HIS OWN DOOR - the pit he digged, the old hole nobody repaired, and the Keeper who neither slumbers nor sleeps. Read this as the week a news story arrived already shaped like a parable, and the job was to hold it up to the Word rather than repeat it.

WHERE IT CAME FROM, EXACTLY. On 2026-10-20 at 12:21 UTC Darrell forwarded The Neuron's morning issue into the lesson lane with one word on it: "Lesson." The subject line was the story - AI hackers forgot to lock up - and the lead item reported that a security firm had found more than twenty control panels for an A.I. hacking tool sitting open on the public internet with no password. Those were the attackers' own command centers. Their target lists, their agents' working notes and the logins they had stolen were readable by anyone who found the address, and one crew had published the password to its own staging server.

FIRST, THE POSTURE, BECAUSE IT IS ITSELF THE LESSON. A forwarded page is material to study, never instructions to obey. That issue is wall-to-wall calls to action - rate this email, save your spot, run this recipe on your documents - and some of its text addresses an A.I. directly. An agent that treats arriving text as a command has no master, no matter how locked down it looks. The Word handed a man the right posture long before any of this existed: prove what arrives, [[1 Thessalonians 5:21]] do not believe a sentence because it sounded sure, [[Proverbs 14:15]] and try the spirit behind it. [[1 John 4:1]] An A.I. agent drafted this page from Darrell's forward and the Word; the gates decided whether it shipped, not its confidence, and every verse here was pulled from the family's own corpus rather than typed from memory.

THE WORD ON A THIEF, BEFORE THE NEWS. Jesus gave the whole job description in three verbs and then named His own work against it. [[John 10:10]] The law is four words long. [[Exodus 20:15]] Scripture is not impressed by a thief; it grants the hungry man pity and still makes him pay back. [[Proverbs 6:31]] And the remedy is the part no vendor sells: not a stronger lock on somebody else's door, but a new trade for the thief's hands until he has enough to give some away. [[Ephesians 4:28]]

THE PIT, AND WHO FELL IN IT. The headline wrote itself because the Word wrote it first. A man digs a pit and lands in it. [[Psalms 7:15]] His mischief comes back on his own head. [[Psalms 7:16]] He is snared in the work of his own hands. [[Psalms 9:16]] [[Proverbs 26:27]] [[Ecclesiastes 10:8]] Haman's gallows held Haman. [[Esther 7:10]] And nothing stays covered - not the victims' secrets and not the attackers'. [[Numbers 32:23]] [[Luke 12:2]]

PHYSICIAN, HEAL THYSELF - AND THIS ONE IS NOT ONLY ABOUT CRIMINALS. The article also reported that some apparently legitimate hired-testing setups were left exposed the same way, which can spill a paying client's secrets. So the beam is not only in the thief's eye. Jesus quoted the proverb Himself. [[Luke 4:23]] Paul asked the question with no exit in it. [[Romans 2:21]] And Jesus fixed the ORDER rather than forbidding the help: your own beam first, then you can see clearly enough to deal with your brother's mote. [[Matthew 7:3]] [[Matthew 7:5]] Paul put himself under the same rule out loud. [[1 Corinthians 9:27]] [[1 Timothy 4:16]] Even the one doing the restoring is told to watch himself. [[Galatians 6:1]]

THE WATCH THAT WAS NOT KEPT. Jesus told this from the householder's seat and put the blame where it falls: the goodman lost the house because he kept no watch, not because the thief was strong. [[Matthew 24:43]] That is why the day of the Lord comes with this exact picture and the command attached is wakefulness. [[1 Thessalonians 5:2]] [[1 Thessalonians 5:6]] He said it of Himself with a blessing on the watcher. [[Revelation 16:15]] He left the hour unnamed on purpose. [[Mark 13:37]] A watchman who sees the sword and stays quiet carries the loss. [[Ezekiel 33:6]] And the hardest version is two verses about a strong man certain of his arrangements until a stronger one arrived. [[Luke 11:21]] [[Luke 11:22]]

THE BORING LIST IS THE USEFUL PART. The agents' to-do list was dull: broken logins, pages that skip the login check, file uploads. Old, documented holes. What is reported to have changed is the RATE, because software can grind through more than a thousand projects in one cluster, so a hole that used to sit undiscovered gets found this week. A wall with a gap is not a wall. [[Proverbs 25:28]] Neglect alone is enough to drop a building. [[Ecclesiastes 10:18]] Small things spoil vineyards. [[Song of Solomon 2:15]] Faithful in the least, faithful in much - and unjust in the least, unjust in much. [[Luke 16:10]] Nehemiah prayed AND set a watch in the same sentence, admitted how much rubbish was in the way, [[Nehemiah 4:9]] [[Nehemiah 4:10]] and reported honestly that there was no breach left while the doors were still not hung. [[Nehemiah 6:1]] Yahweh calls that trade the repairer of the breach. [[Isaiah 58:12]] Foresight is not fear. [[Proverbs 22:3]] And the Resources are named in order: Wisdom, Understanding and Knowledge are what a house is actually built with. [[Proverbs 24:3]] [[Proverbs 24:4]]

THE SAME ARCHITECTURE, THE OTHER MASTER. The criminal tool was a team of A.I. workers around a shared board, posting what they had learned and what they intended, with a human adding hints and the board remembering for days. That is not a criminal invention - it is the ordinary shape of agent work, close to how this app gets built. The architecture is not the difference; the master is. [[Matthew 6:24]] [[Romans 6:16]] The centurion understood delegated authority from inside the chain of command. [[Luke 7:8]] What comes out is what was in. [[Matthew 12:35]] Blessing and cursing out of one mouth is not balance. [[James 3:10]] [[James 3:11]] And the board itself is the warning: an agent that believes whatever is written on its board has no plumbline outside the board, which is exactly where a lie gets planted. The Bereans tested an apostle's preaching against the Scriptures. [[Acts 17:11]]

OUR OWN WATCH, SAID OUT LOUD. Here a claim is not accepted on an agent's word: a gate checks the property and fails the build, every verse is fetched from the family's corpus and re-read by a test, and an outside witness asks the live site whether it is up instead of trusting a green pipeline. And this house holds keys and family data too - a secret rode into a log here once already - so this story is not about strangers. Then the Word puts the watch in its place, which is how a watchman survives the job. [[Psalms 127:1]] [[Proverbs 21:31]] [[Psalms 121:4]] [[Zechariah 2:5]] [[2 Timothy 1:12]] [[1 Peter 1:5]] And Love is senior to all of it, because without Love the whole build is noise. [[1 Corinthians 13:1]]

THE THREE TIERS. ESTABLISHED: criminals are running A.I. agents against real businesses, and the researchers verified one claimed break-in by finding the back door still live on the victim's own site; the attackers' panels were reachable with no password. And established from the Word: the pit returns on the digger, your own beam comes first, the unwatched house is broken up, the keeping is Yahweh's. OPEN, named narrowly - the third pile, reported but not checked by anyone here: the ten percent success rate is the firm's own stated assumption, the cost per attempt is its rough guess, the fifty dollars per break-in is the newsletter's arithmetic on those two and labelled a ballpark by the newsletter itself, the project counts and credential counts are that firm's numbers at second hand, and the claim about which model the agents ran on is something the article calls its own reading rather than a confirmed fact. The firm sells sandboxing for A.I. agents, which the article discloses. We checked none of it, and a number does not become true by being repeated. OVER-REACH, corrected both ways: "the A.I. is the thief" is over-reach, because a tool is not a moral agent and the Word puts theft and its remedy on the man; [[Ephesians 4:28]] and "agents are only tools, nothing changed" is the other over-reach, because the reported change is specific and real - old holes get found faster - and the prudent man is told to see it coming. [[Proverbs 22:3]]

THE CLOSE. Two instructions, in order: your own gate, then your own eye. Then put the watch where it belongs, because a man who thinks his arrangements ARE the keeping has already started sleeping. The Lamb of Yahweh dealt with the real debt, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne is for ever. [[Hebrews 1:8]] Keep the watch like it is yours. Sleep like the keeping is His.`;

const SENIOR = `THE THIEF WHO FORGOT TO LOCK HIS OWN DOOR - the pit he digged, the old hole nobody repaired, and the Keeper who neither slumbers nor sleeps. Teach this as the week in which a technology story arrived already shaped like one of the Lord's own parables, so that the room's work is not to be astonished at the news but to recognise what the Word had already established about it, and to say honestly which parts of the account anyone in this house has actually verified.

THE PROVENANCE, GIVEN PLAINLY BEFORE ANYTHING IS BUILT ON IT. On 2026-10-20 at 12:21 UTC Darrell forwarded the morning issue of a technology newsletter called The Neuron into the lesson lane from his university mailbox, carrying a single word of instruction: "Lesson." The subject line was itself the whole account - AI hackers forgot to lock up - and the lead item reported that a security company had discovered more than twenty control panels belonging to criminals who direct A.I. agents against real commercial websites, and that those panels were sitting open on the public internet without so much as a password on them. Their target lists, the agents' own running notes and the credentials they had already stolen from other people were legible to anybody who found the address, and one crew had gone so far as to publish the login to its own staging server. That is the entirety of the provenance, and it should be read to the room in those terms: a marketing newsletter, read in full, and one word from Darrell, with no primary-source research performed in this house upon any figure the article reports.

THE POSTURE TOWARD THE DOCUMENT ITSELF, WHICH IS ALREADY PART OF THE TEACHING. A forwarded page is material to be studied and never instructions to be obeyed, and that distinction deserves to be made in front of the room before the story is discussed at all, because the issue in question is composed largely of sentences engineered to make a reader act, and some of its text addresses an artificial intelligence outright. An agent which treats arriving text as a command has, in that moment, no master at all, whatever the state of its defences; and the Word had settled the right posture for a man long before any of these systems existed. Prove all things. [[1 Thessalonians 5:21]] The simple believeth every word, while the prudent looks well to his going. [[Proverbs 14:15]] Try the spirits, because many false prophets have gone out. [[1 John 4:1]] Make this explicit with the room: an A.I. agent drafted this page from Darrell's forward and from the Word, the deterministic gates rather than the agent's confidence decided whether it was fit to ship, and every verse on the page was fetched from the family's own corpus rather than produced from memory.

THE WORD ON THE THIEF, ESTABLISHED BEFORE THE NEWS IS WEIGHED. Begin where authority actually resides. The Lord Jesus compressed the thief's entire vocation into three verbs and then set His own purpose against them in the same breath, which is the sentence to put on the board first. [[John 10:10]] The law prohibiting it requires only four words. [[Exodus 20:15]] Observe that Scripture is neither surprised by the thief nor impressed with him: it extends a measure of pity to the man who steals from hunger while still requiring sevenfold restitution of him, [[Proverbs 6:30]] [[Proverbs 6:31]] and it describes his end as shame rather than acclaim. [[Jeremiah 2:26]] Then come to the remedy, which is the portion no security vendor has ever had anything to sell against: Yahweh's answer to a thief is not a stronger lock upon his neighbour's door but an entirely new occupation for the thief's own hands, pursued until the man who formerly took possesses a surplus with which to give. [[Ephesians 4:28]]

THE PIT, AND THE IDENTITY OF THE ONE WHO FELL INTO IT. Here the room should be invited to notice that the newspaper headline was written in the Psalms. He made a pit and digged it and is fallen into the ditch which he made. [[Psalms 7:15]] His mischief returns upon his own head. [[Psalms 7:16]] The wicked is snared in the work of his own hands. [[Psalms 9:15]] [[Psalms 9:16]] Whoso diggeth a pit shall fall therein. [[Proverbs 26:27]] He that diggeth a pit shall fall into it, and whoso breaketh an hedge, a serpent shall bite him. [[Ecclesiastes 10:8]] And the historical instance, which the room will remember without prompting: Haman died upon the gallows he had erected for a man who had wronged him in nothing. [[Esther 7:10]] Add the principle that governs both the victims' exposure and the attackers': be sure your sin will find you out, [[Numbers 32:23]] for there is nothing covered that shall not be revealed. [[Luke 12:2]] [[Luke 12:3]] It is worth pausing on the detail that a defect in one crew's own software kept truncating the first letter of the website names it processed, and that this clumsiness is precisely what allowed investigators to locate the remainder of their panels.

PHYSICIAN, HEAL THYSELF, AND THE REACH OF THAT PROVERB BEYOND THE CRIMINAL. The Lord Jesus quoted this proverb as the one the crowd would turn upon Him. [[Luke 4:23]] Paul framed it as a series of questions admitting no escape, the second of which this story answers for us. [[Romans 2:21]] [[Romans 2:22]] And the Lord Jesus taught the same measurement with the mote and the beam, where the instruction is the ORDER and not a prohibition upon helping: remove your own first, and your sight will then be adequate to assist your brother. [[Matthew 7:3]] [[Matthew 7:4]] [[Matthew 7:5]] Paul placed himself publicly beneath the identical standard so that nobody could suppose it was intended for other men. [[1 Corinthians 9:27]] [[1 Timothy 4:16]] Even the spiritual man engaged in restoring another is cautioned to consider himself. [[Galatians 6:1]] The room should sit with the article's quieter finding here: apparently legitimate hired-testing operations were reportedly left exposed in the same fashion, which can spill a paying client's secrets. The beam, therefore, is not confined to the criminal's eye, and the wall a man passes every day is the one he ceases to see.

THE HOUSE BROKEN UP, AND THE WATCH WHICH WAS NEVER SET. The Lord Jesus narrated this same event from the householder's seat and placed the responsibility with precision: the goodman forfeited his house not because the thief proved strong but because, not knowing the hour, he kept no watch at all. [[Matthew 24:43]] Luke preserves it with a single word altered and the identical verdict beneath. [[Luke 12:39]] This is why the day of the Lord is announced under exactly this figure and why the command appended to it is wakefulness rather than dread. [[1 Thessalonians 5:2]] [[1 Thessalonians 5:4]] [[1 Thessalonians 5:6]] He applies the figure to Himself in the Revelation and attaches a blessing to the one who watches. [[Revelation 16:15]] He deliberately left the hour unnamed and extended the charge to everybody. [[Mark 13:35]] [[Mark 13:37]] The watchman who observes the sword and fails to sound the trumpet bears the loss himself, the office being no honorary one. [[Ezekiel 33:6]] And the severest form of the teaching occupies two verses concerning a strong man wholly satisfied with his own arrangements until a stronger arrived and took the armour in which he had trusted. [[Luke 11:21]] [[Luke 11:22]]

THE DULL INVENTORY, WHICH IS THE PORTION OF ACTUAL USE. Direct the room away from the drama and toward the agents' task list, which was tedious: defective logins, pages omitting the login check altogether, and file uploads. Old and thoroughly documented weaknesses. What is reported to have altered is not the ingenuity of the attack but its RATE, software being capable of working through more than a thousand projects within a single cluster, so that a weakness which formerly lay undisturbed for years is now discovered this week. A wall possessing a gap is not a wall. [[Proverbs 25:28]] Nothing dramatic is required for a house to fail, slothfulness being entirely sufficient. [[Ecclesiastes 10:18]] It is the little foxes that spoil the vines. [[Song of Solomon 2:15]] And the Lord Jesus made the small matter the test of the large one in both directions. [[Luke 16:10]] Then show the room what genuine repair looks like: Nehemiah prayed and set a watch within one sentence and refused to pretend the rubbish was not there, [[Nehemiah 4:9]] [[Nehemiah 4:10]] continuing until the report was that no breach remained, while stating in the same breath that the doors were not yet hung - which is precisely the form an honest status report takes. [[Nehemiah 6:1]] Yahweh supplies the name for that trade. [[Isaiah 58:12]] Foresight is commended and is not fearfulness. [[Proverbs 22:3]] And the Resources for the work are named and ordered: Wisdom, Understanding and Knowledge are what a house is in fact built with. [[Proverbs 24:3]] [[Proverbs 24:4]]

THE ARCHITECTURE WE SHARE, AND THE MASTER WE DO NOT. The tool described in the article is a company of A.I. workers gathered about a shared board, each posting what it has learned and what it intends to attempt, a human contributing hints, the board retaining everything so that a single undertaking may run for days. The room should understand that this is in no sense a criminal invention; it is the ordinary shape of agent work and stands close to the shape by which this very application is built. The architecture, then, is not the distinguishing thing. The master is. No servant holds two of them. [[Matthew 6:24]] Obedience is what assigns ownership, and Scripture states it without softening. [[Romans 6:16]] The centurion comprehended delegated authority from within the chain of command, which is why his faith was marvelled at. [[Luke 7:8]] What proceeds out of a thing is whatever was stored within it. [[Matthew 12:35]] Blessing and cursing out of one mouth is not equilibrium; the Word says it ought not so to be and asks whether one spring yields sweet water and bitter. [[James 3:10]] [[James 3:11]] Then take the shared board itself as the warning and take it personally: an agent believing whatever is written upon its own board possesses no plumbline outside that board, which is exactly the location at which a falsehood would be introduced, whether by a rival crew or by a page the agent was instructed to read. The Bereans remain the pattern, and what they examined was an apostle's own preaching. [[Acts 17:11]]

THE WATCH THIS HOUSE KEEPS, AND THE KEEPING NONE OF US CAN PERFORM. Having asked everybody else to speak plainly, state our own arrangements aloud. In this house a claim is not received upon an agent's word: a deterministic gate examines the property and fails the build, every verse is fetched from the family's own corpus and re-read by a test rather than entrusted to anyone's memory, and an outside witness interrogates the live site as to whether it is genuinely serving rather than trusting a green pipeline. Those arrangements are real and they are checkable. Then concede the article's reach: this house holds keys, tokens and family data, a secret has already ridden into a log here once, and the sole reason that remains a paragraph instead of an incident is that somebody looked. We are participants in this story and not its audience. Having said that, put the watch in its place, which is the only arrangement under which a watchman survives his own office. Except the LORD keep the city, the watchman waketh but in vain. [[Psalms 127:1]] The preparation belongs to us and the outcome does not. [[Proverbs 21:31]] The Keeper requires none of the sleep we require. [[Psalms 121:3]] [[Psalms 121:4]] The wall that actually holds is the one He Himself is. [[Zechariah 2:5]] Paul's confidence rested never in his own provisions but in a Person able to keep what had been committed to Him. [[2 Timothy 1:12]] What is kept is kept by His power. [[1 Peter 1:5]] And Love is senior to Wisdom, Understanding and Knowledge alike, for absent Love the entire build is sounding brass. [[1 Corinthians 13:1]]

THE THREE TIERS, AND THE THIRD PILE NAMED RATHER THAN SMUGGLED. ESTABLISHED, and to be stated as fact: criminals are directing A.I. agents against real businesses, the researchers verified one claimed intrusion by locating the back door still live upon the victim's own website, a major outlet reported named corporate targets, and the attackers' control panels were reachable without a password. Established likewise from the Word, which requires no vendor's corroboration: the pit returns upon the digger, one's own beam precedes one's brother's mote, the unwatched house is broken up, and the keeping belongs to Yahweh. OPEN, and named narrowly, which is to say reported and NOT checked by anybody here: the ten percent success rate is the security company's own declared assumption rather than a measurement; the five dollars per attempt is its acknowledged rough guess; the fifty dollars per successful intrusion is the newsletter's own arithmetic upon those two figures and is labelled a ballpark by the newsletter itself; the eleven hundred projects, the twenty-three-hour average, the hundreds of exposed credentials and the proportion still valid are that company's counts received at second hand; and the identification of the cheap model behind the agents is something the article expressly calls its own reading rather than a confirmed fact. That company additionally sells sandboxing tools for A.I. agents, a conflict the article itself discloses. Nobody in this house verified any of it, and a figure does not become true by being repeated. OVER-REACH, corrected in both directions: to say that the A.I. is the thief over-reaches, a tool being no moral agent, while the Word assigns both the theft and its remedy to the man; [[Ephesians 4:28]] and to say that agents are merely tools and nothing has changed over-reaches in the opposite direction, the reported change being specific and real in that old weaknesses are now found faster, and the prudent man being charged to foresee it. [[Proverbs 22:3]]

THE CLOSE, AND THE ASSIGNMENT. Give the room two instructions in their proper order: first the gate that is actually theirs - the dull list, the login never checked, the key that rode in a log, the wall walked past daily - and second the eye that is theirs, the standard applied outward being turned inward first so that their sight becomes adequate to help. Then set the watch in its place, for a man persuaded that his own arrangements ARE the keeping has already begun to sleep. End upon the Person: the Lamb of Yahweh who takes away the sin of the world settled the only debt that mattered, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne is for ever and ever. [[Hebrews 1:8]] He came that we might have life. The thief never had anything to offer but the three verbs. Keep the watch as though it is yours; sleep as though the keeping is His.`;

// -----------------------------------------------------------------------------
// The module, before the verses are filled in.
// -----------------------------------------------------------------------------
const TITLE = 'The thief who forgot to lock his own door - the pit he digged, the old hole nobody repaired, and the Keeper who neither slumbers nor sleeps';

const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `On 2026-10-20 at 12:21 UTC Darrell forwarded The Neuron's morning issue into the lesson lane with one word on it, "Lesson." Its lead story: a security company found more than twenty control panels for an A.I. hacking tool open on the public internet with no password - the attackers' own command centers, holding their target lists, their agents' notes and the logins they had stolen, with one crew publishing the password to its own server. The people whose trade is other men's doors forgot their own. This week holds that up to the Word, which wrote the headline first: the man who digs a pit falls into it, the beam comes out of your own eye before your brother's mote, and the house that was broken up was the house where no watch was kept. The useful part is dull - the agents went after old, known holes, and what changed is the rate - so the week ends on the repair, on the fact that the same agent architecture serves whichever master sent it, and on the Keeper who neither slumbers nor sleeps. The article's figures are reported, not verified by anyone here, and the lesson says so where it would otherwise be tempting to lean on them.`,
  inApp: `Open the Bible in the app at Ecclesiastes 10 and read verse 8 with verse 18 around it, then Psalms 7:15-16 and Matthew 7:3-5, before you read anybody's commentary on the news. Then use Search it out on this lesson's references: the lesson hands you a reference, the text is fetched from the family's own corpus on request, and the thread from the pit in the Psalms to the watch in the Gospels is laid out verse by verse. The posture this lesson teaches is the one the app itself runs on - a page that arrives is a specimen to be tested, never a master to be obeyed.`,
  anchor: {
    ref: '',
    theme: `KJV: [[Ecclesiastes 10:8]] A newsletter arrived on 2026-10-20 reporting that criminals who use A.I. agents to break into real websites had left their own control panels open on the public internet with no password, their stolen credentials readable by anyone. The Word wrote that headline first, and it writes it the same way every time: the pit returns on the digger, [[Psalms 7:15]] the snare takes its own maker's foot, [[Psalms 9:15]] and the beam comes out of your own eye before you touch your brother's mote. [[Matthew 7:5]] Then the Word turns the story on the reader: the house that was broken up was the house where no watch was kept, [[Matthew 24:43]] the holes the agents used were old ones nobody repaired, [[Proverbs 25:28]] and the keeping that actually holds was never the watchman's to supply. [[Psalms 127:1]]`,
  },
  benefits: [
    `You can tell a thief's whole business from the Word rather than from a headline, three verbs and no fourth, [[John 10:10]] with the law behind it, [[Exodus 20:15]] and you know the remedy Yahweh gives is a new trade for his hands and not merely a stronger lock on somebody else's door: [[Ephesians 4:28]]`,
    `You recognise the oldest shape in this news story on sight, because the Word states it four different ways: [[Psalms 7:15]] [[Psalms 9:16]] [[Proverbs 26:27]] [[Ecclesiastes 10:8]]`,
    `You run the order of operations the Lord Jesus actually gave - your own beam first, and THEN your brother's mote - so that auditing other people never becomes a way of skipping yourself: [[Matthew 7:5]] [[Romans 2:21]]`,
    `You can say where the blame falls when a house is broken into, from the Lord's own telling, and why the command attached to it is wakefulness rather than dread: [[Matthew 24:43]] [[1 Thessalonians 5:6]]`,
    `You treat the dull maintenance list as the real work, because a wall with a gap is not a wall, [[Proverbs 25:28]] neglect alone is enough to drop a building, [[Ecclesiastes 10:18]] and the honest repair prays and sets a watch in the same sentence: [[Nehemiah 4:9]]`,
    `You can say why the same agent architecture is not the moral question - the master is - [[Matthew 6:24]] [[Romans 6:16]] and you keep the watch without trusting it, because the Keeper neither slumbers nor sleeps: [[Psalms 121:4]] [[Psalms 127:1]]`,
  ],
  rpe: {
    research: `Make the dull list for one thing you are actually responsible for - a site, a store, a phone, a household account. Write down every door: who can log in, what happens to a page that forgets to check whether you are logged in, what a stranger can upload, and which key or password is written somewhere it should not be. Then write the date each one was last checked. Where the answer is "never," write never.`,
    plan: `Pick the two doors from that list with the worst answers and name the day each one gets fixed, with the person who will confirm it. Then write the harder half: one standard you have been applying to somebody else that you have not applied to yourself, and the day you deal with your own first. Both go on paper with dates.`,
    execute: `Fix the two doors this week and have the person you named confirm them, so the fix is evidence and not a claim. Deal with your own beam before you mention anybody's mote, and say out loud to one person that you did. Then read Ecclesiastes 10:8 and Matthew 7:5 at the table and tell your house what the news story turned out to be about.`,
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
        q: 'The criminals in this story used A.I. agents to break into real websites, and then left their own control panels open on the public internet with no password. Which Word had already written that ending?',
        options: [
          'None - the Word does not speak to modern security',
          'The pit the digger falls into: [[Ecclesiastes 10:8]] [[Psalms 7:15]] and the snare that takes its own maker: [[Psalms 9:15]]',
          'It is only ironic, with no principle behind it',
        ],
        answer: 1,
        explain: `The Word states it four ways, so no reader has to guess: his mischief returns on his own head, [[Psalms 7:16]] whoso diggeth a pit shall fall therein, [[Proverbs 26:27]] and the historical instance is Haman on his own gallows. [[Esther 7:10]] Nothing stays covered either, not the victims' secrets and not the attackers'. [[Numbers 32:23]]`,
      },
      {
        q: 'What does Yahweh give a thief as his remedy?',
        options: [
          'A stronger lock on everybody else\'s door',
          'A new trade for his own hands, worked until he has enough to give some away: [[Ephesians 4:28]]',
          'Nothing - the Word only condemns him',
        ],
        answer: 1,
        explain: `That verse does not merely stop the hands; it reassigns them, until the man who took becomes a man with something to give. The Lord Jesus had already named what the thief's work is and is not: [[John 10:10]] and the law is four words long. [[Exodus 20:15]] Scripture grants the hungry man pity and still requires restitution. [[Proverbs 6:31]]`,
      },
      {
        q: 'The article also reported that some apparently legitimate hired security testers left their own dashboards exposed. What does the Word do with that?',
        options: [
          'Excuses it, since they are the good ones',
          'Applies the same measurement, in order: your own beam first, and THEN you see clearly enough to help your brother - [[Matthew 7:5]] [[Romans 2:21]]',
          'Treats it as a separate matter with no bearing on us',
        ],
        answer: 1,
        explain: `The Lord Jesus quoted the proverb Himself, [[Luke 4:23]] and He fixed the ORDER rather than forbidding the help. [[Matthew 7:3]] Paul put himself under the same rule out loud, [[1 Corinthians 9:27]] told Timothy to take heed to himself first, [[1 Timothy 4:16]] and warned the one doing the restoring to consider himself. [[Galatians 6:1]]`,
      },
      {
        q: 'In the Lord\'s own telling, why was the goodman\'s house broken up?',
        options: [
          'Because the thief was unusually strong',
          'Because he did not know the hour and kept no watch: [[Matthew 24:43]] which is why the command attached to the day of the Lord is wakefulness - [[1 Thessalonians 5:6]]',
          'Because his house was poorly built',
        ],
        answer: 1,
        explain: `Luke tells it with one word changed and the same verdict. [[Luke 12:39]] The Lord Jesus applies the picture to Himself with a blessing on the watcher, [[Revelation 16:15]] leaves the hour unnamed on purpose, [[Mark 13:37]] and the watchman who sees the sword and stays silent carries the loss. [[Ezekiel 33:6]] The strong man was certain of his arrangements until a stronger came. [[Luke 11:22]]`,
      },
      {
        q: 'The agents\' to-do list was dull - broken logins, pages that skip the login check, file uploads. What is the Word\'s judgment on an old hole nobody repaired?',
        options: [
          'Small things are beneath notice',
          'A wall with a gap is not a wall, [[Proverbs 25:28]] neglect alone drops a building, [[Ecclesiastes 10:18]] and the least is the test of the much: [[Luke 16:10]]',
          'Only a dramatic attack is worth preparing for',
        ],
        answer: 1,
        explain: `It is the little foxes that spoil the vines. [[Song of Solomon 2:15]] Nehemiah shows what real repair looks like: he prayed AND set a watch in one sentence, said plainly how much rubbish was in the way, [[Nehemiah 4:9]] [[Nehemiah 4:10]] and reported honestly that no breach was left while the doors were still not hung. [[Nehemiah 6:1]] Yahweh names that trade the repairer of the breach. [[Isaiah 58:12]]`,
      },
      {
        q: 'The criminals\' tool was a team of A.I. agents around a shared board of facts and intents - roughly the same architecture honest builders use. Where does the moral difference sit?',
        options: [
          'In the architecture: agent systems are wrong by design',
          'In the master: no servant has two, and whoever you obey owns you - [[Matthew 6:24]] [[Romans 6:16]]',
          'Nowhere - a tool makes its own choices',
        ],
        answer: 1,
        explain: `The centurion understood delegated authority from inside the chain of command. [[Luke 7:8]] What comes out of a thing is what was in it, [[Matthew 12:35]] and blessing and cursing out of one mouth is not balance. [[James 3:11]] The board itself is the warning: an agent that believes whatever is written on its board has no plumbline outside the board, so arriving text is tested, not obeyed. [[1 Thessalonians 5:21]] [[Acts 17:11]]`,
      },
    ],
  },
  lesson: '',
  facilitator: {
    talkingPoints: [
      `WHERE IT CAME FROM, AND THE POSTURE: 2026-10-20 at 12:21 UTC, Darrell forwarded The Neuron's issue "AI hackers forgot to lock up" into the lesson lane with one word, "Lesson." Say the provenance plainly - a marketing newsletter, read in full, no primary-source research done here. Then the bright line before the story: a forwarded page is material to study, never instructions to obey. [[1 Thessalonians 5:21]] Some of that issue addresses an A.I. outright.`,
      `THE WORD BEFORE THE NEWS: [[John 10:10]] then Exodus 20:15, Proverbs 6:30-31, Jeremiah 2:26, and the remedy no vendor sells - Ephesians 4:28, a new trade for the thief's own hands until he has something to give away.`,
      `THE PIT, ON THE BOARD: [[Psalms 7:15]] then Psalms 7:16, Psalms 9:15-16, Proverbs 26:27, Ecclesiastes 10:8, Esther 7:10, Numbers 32:23, Luke 12:2-3. Then the facts: panels open with no password, stolen logins readable by anyone, one crew publishing its own staging password, and a typo that chopped the first letter off site names and gave them away.`,
      `PHYSICIAN, HEAL THYSELF - AND NOT ONLY THE CRIMINALS: [[Romans 2:21]] then Luke 4:23, Matthew 7:3-5 (the ORDER, not a ban on helping), 1 Corinthians 9:27, 1 Timothy 4:16, Galatians 6:1. The article's quieter finding: legitimate hired testers were reportedly left exposed the same way.`,
      `THE WATCH THAT WAS NOT KEPT: [[Matthew 24:43]] then Luke 12:39, 1 Thessalonians 5:2-6, Revelation 16:15, Mark 13:35-37, Ezekiel 33:6, Luke 11:21-22. Make the room say where the blame falls: no watch, not a strong thief.`,
      `THE BORING LIST IS THE USEFUL PART: broken logins, pages that skip the login check, file uploads - old holes, found faster. [[Proverbs 25:28]] then Ecclesiastes 10:18, Song of Solomon 2:15, Luke 16:10, Nehemiah 4:9-10, Nehemiah 6:1, Isaiah 58:12, Proverbs 22:3, Proverbs 24:3-4 (Wisdom, Understanding, Knowledge).`,
      `SAME ARCHITECTURE, OTHER MASTER: shared board, facts and intents, a human adding hints, runs for days - that is ordinary agent work, close to how this app is built. [[Matthew 6:24]] then Romans 6:16, Luke 7:8, Matthew 12:35, James 3:10-11, Acts 17:11. The board is the injection surface; the plumbline comes from outside the board.`,
      `OUR OWN WATCH AND THE THREE TIERS: name our gates, the corpus-fetched verses, the outside site witness - and concede that this house holds keys too. [[Psalms 127:1]] then Proverbs 21:31, Psalms 121:3-4, Zechariah 2:5, 2 Timothy 1:12, 1 Peter 1:5, 1 Corinthians 13:1 (Love senior). ESTABLISHED (one verified break-in, panels with no password, and the Word's own judgments); OPEN - the third pile, reported not checked: the 10 percent rate is the firm's assumption, the cost figures are guesses and newsletter arithmetic, the model attribution is the article's own reading, and the firm sells agent sandboxing; OVER-REACH both ways (the A.I. is not the thief; and "nothing changed" ignores the rate). Close on the Lamb of Yahweh and the Eternal Son: John 1:29, John 3:16, Hebrews 1:8.`,
    ],
    howToRun: `Prayer + the anchor (5): open in prayer; read Ecclesiastes 10:8 and Psalms 7:15-16 aloud (KJV). | Recap last week (5): the Word-first algorithm and context is King, named in a sentence. | Where it came from, and the posture (6): the forward, the one word, and material-to-study-never-instructions-to-obey. | The Word on a thief (8): three verbs, four words, and the new trade. | The pit (12): the four statements, Haman, and the facts of the story. | Physician, heal thyself (12): the order of operations, and the legitimate testers left exposed. | The watch that was not kept (12): where the Lord puts the blame. | The boring list (12): old holes, the rate, and Nehemiah's honest report. | Same architecture, other master (10): the board, and the plumbline from outside it. | Our own watch + the three tiers (9): our gates, our keys, and the third pile named out loud. | Talk about it together + close (9): your gate, your eye, the Keeper who neither slumbers nor sleeps.`,
    discussionPrompts: [
      `[[Ecclesiastes 10:8]] A crew that reads everybody's secrets could not keep its own. Where are you strict about a risk at work or at church and loose about the same risk at home?`,
      `[[Matthew 7:5]] He fixed the order rather than forbidding the help. Name one standard you have been applying outward this year that you have not applied to yourself first.`,
      `[[Matthew 24:43]] The goodman lost the house because he kept no watch, not because the thief was strong. What in your house has no watch on it at all right now?`,
      `[[Proverbs 25:28]] The holes the agents went after were old and boring. Which dull maintenance job have you been putting off longest, and what would actually make you do it this week?`,
      `[[Romans 6:16]] The criminals' agents and honest builders' agents share an architecture; the master is the difference. What is the tool you use most, and who is it serving when you use it?`,
      `[[Psalms 127:1]] Keep the watch; do not trust the watch. What are you presently trusting to keep you that cannot actually keep you, and what would it look like to hand that to Yahweh without dropping your own duty?`,
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
if (start < 0) throw new Error('sov44: the modules array was not found');
const end = src.indexOf('\n];', start);
if (end < 0) throw new Error('sov44: the modules array is not closed after its opening');
const firstClose = src.indexOf('\n];');
if (firstClose === end) {
  throw new Error('sov44: refusing to splice - the first "];" in the file is now the array close, which contradicts the measurement this script was written against; re-read the file before trusting it');
}
if (!/\n {2}\},$/.test(src.slice(start, end))) {
  throw new Error('sov44: the array does not end with a comma-terminated module literal; refusing to splice');
}
const REBUILD = process.argv.includes('--rebuild');
let src2 = src;
let end2 = end;
if (src2.includes(ID)) {
  if (!REBUILD) throw new Error(`sov44: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const marker = `\n  {\n    "id": "${ID}"`;
  const from = src2.indexOf(marker);
  if (from < 0) throw new Error('sov44: the id is in the file but not as a module literal; refusing to rebuild');
  const closeAt = src2.indexOf('\n  },', from);
  if (closeAt < 0 || closeAt >= end2) throw new Error('sov44: could not find the end of the existing block; refusing to rebuild');
  const excised = src2.slice(from, closeAt + '\n  },'.length);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov44: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from) + src2.slice(closeAt + '\n  },'.length);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov44: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov44: the id survived the excision; refusing to rebuild');
}

const block = JSON.stringify(filled, null, 2).split('\n').map((l) => `  ${l}`).join('\n');
const next = `${src2.slice(0, end2)}\n${block},${src2.slice(end2)}`;

const weeks = (text) => [...new Set([...text.matchAll(/sov(\d+)-/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
const before = weeks(src2);
const after = weeks(next);
if (after.length !== before.length + 1) throw new Error(`sov44: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov44: week ${WEEK} is already taken`);
if (before.join(',') !== [...Array(before.length)].map((_, i) => i + 1).join(',')) {
  throw new Error(`sov44: the weeks on disk are not 1..${before.length} contiguous: ${before.join(',')}`);
}
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov44: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref.split(';').map((s) => s.trim()).filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov44: spliced ${ID}`);
console.log(`sov44: modules ${before.length} -> ${after.length}`);
console.log(`sov44: ${refs.length} references on the anchor, every one quoted on the page and resolving in the corpus`);
console.log(`sov44: lesson ${filled.lesson.length} chars; bands child ${filled.levels.child.length}, youth ${filled.levels.youth.length}, teen ${filled.levels.teen.length}, senior ${filled.levels.senior.length}`);
