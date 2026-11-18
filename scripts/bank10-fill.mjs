// =============================================================================
// bank10-fill - build Banking lesson 10 and splice it into the course
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456). Every quoted
// verse on this page is FILLED FROM app/public/bible/kjv at build time. The
// prose holds only a reference in double brackets, [[Ezekiel 33:6]], and this
// script replaces it with the corpus text followed by the reference. No verse
// on the page was typed from memory. anchor.ref is DERIVED from the
// placeholders that occur in the reader places (DR-0734).
//
// WHERE THE WORD CAME FROM. Fintech Takes, a banking and consumer-finance
// newsletter, sent a recap of its podcast on 2026-11-11 under the heading The
// Blue Wave Hits Banking. Darrell forwarded it into the lesson lane with one
// word: Lesson. Gmail thread `1a1f08bfcac456b1`. Built 2026-11-18. Sponsor
// blocks, links and the event plug were removed before it reached us.
//
// WHY BANKING (INTAKE-AND-FIT; the sibling note on the thread). The material is
// about bank fees and the federal consumer-finance regulator, so it sits beside
// bank1-bank9 in Banking: What the Bank Does With Your Money, not in Sovereign
// A.I.
//
// ONE TEACHING, ONE LESSON (DR-0610). bank6 already owns fees and who pays them
// (Amos 8:5, the ephah made small). Sovereign A.I. week 54 owns cheating as an
// industry. This lesson owns ONE thing neither teaches: what happens when the
// WATCHMAN stops watching. Ezekiel 33:6 holds both halves in one verse - the
// silent watchman answers for his silence, AND the man is still "taken away in
// his iniquity". A regulator that went quiet does not erase the wrong done
// meanwhile. Fees are named only as the occasion and bank6 is pointed to.
//
// TEACH THE WORD, DO NOT DEBATE IT (DR-0098). The material is political. No
// party is staged against another, no public official is named, and the
// commentator's forecasts (hearings, ratings, who will cooperate) are reported
// opinion about the future and are not taught.
//
// TRUST BUT VERIFY (DR-0100 / DR-0076 section 8). REPORTED by the newsletter's
// guest: that the federal consumer-finance agency largely retreated from
// enforcement and rulemaking for about two years; that fees are an appealing
// target for newly elected state lawmakers; that a later regulator could
// examine conduct from the quiet years, subject to legal deadlines. ESTABLISHED,
// stated plainly: a law does not stop being the law because nobody is enforcing
// it this season, and most legal claims carry a time limit set by law. NOT
// OPENED: the podcast itself and the agency's own site (www.consumerfinance.gov
// answered 403 at the proxy from this sandbox on 2026-11-18). No figure from
// the newsletter is printed. re-review: 2026-12-16.
//
// THE BANDS WERE WRITTEN BY HAND, NEVER BY A SCRIPT ON PROSE (DR-1306).
//
// Recorded as DR-1563.
// =============================================================================
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const COURSE = join(ROOT, 'app', 'src', 'lib', 'banking-course.js');

const WEEK = 10;
const ID = 'bank10-the-watchman-who-went-quiet';
const PREV = 'bank9-the-moat-that-moves';
const TITLE = 'The watchman who went quiet — the trumpet nobody blew, and the wrong that stayed a wrong';

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
  if (!m) throw new Error(`bank10: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`bank10: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`bank10: reference does not resolve in the corpus -> "${ref}"`);
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
// still gets the tiers and the date (DR-0795).
// -----------------------------------------------------------------------------
const REVIEW = 're-review: 2026-12-16';

const FACTS = {
  lesson: `WHERE WE STAND ON THE FACTS. REPORTED: that the federal agency set up to protect people in their dealings with banks and lenders largely stepped back from enforcing and writing rules for about two years; that bank fees look like an easy target to lawmakers newly sent in by angry voters; and that a later regulator could look back at what was done in the quiet years, within the deadlines the law sets. All three come to us through one newsletter retelling one podcast conversation, and we take them on trust as one guest's account. We could not open the podcast or the agency's own site from our network, so we print none of the newsletter's numbers. ESTABLISHED, said plainly: a law does not stop being the law because nobody enforced it this season, and most claims under the law carry a time limit the law itself sets. OPINION, AND LEFT THERE: the newsletter's forecasts about hearings, about who will work with whom, and about how likely any bill is. Those are guesses about the future, and this lesson does not teach guesses. This is teaching, not legal advice. ${REVIEW}.`,
  child: `WHAT IS SURE AND WHAT IS NOT. A letter about banks told us that the helpers whose job is to watch the banks went quiet for a while. That came from one man talking on a show, so we take it as his story. We could not open the show or the helpers' own web page, so we print no numbers. Here is what is sure: a rule is still a rule, even when nobody is checking. The letter also guessed about what will happen next. A guess is not a fact, so we leave the guesses out. We will look again. ${REVIEW}.`,
  youth: `WHAT IS SURE AND WHAT IS NOT. One newsletter told us, from one podcast guest, three things: the national office meant to watch banks for ordinary people mostly stopped enforcing for about two years; fees look like an easy target to new lawmakers; and a later watchman could look back at the quiet years, inside the time limits the law sets. That is reported, so we hold it as one person's account. We could not open the podcast or the office's own site, so we print no numbers. What is plainly true: a law is still a law while nobody enforces it. The newsletter's guesses about the future are guesses, and we leave them out. This is teaching, not legal advice. ${REVIEW}.`,
  teen: `WHAT IS SURE AND WHAT IS NOT. Sort every claim. Reported, by one newsletter quoting one podcast guest: the national consumer-finance agency largely pulled back from enforcement and rule-writing for about two years; fees are a likely target for newly elected lawmakers; and a later regulator could examine the quiet years, subject to legal deadlines. We could not reach the podcast or the agency's own site, so no figure from the newsletter is printed here. Established: a law stays in force whether or not anyone enforces it, and most claims carry a time limit the law sets. Opinion, left out: every forecast about hearings, cooperation and votes. This is teaching, not legal advice. ${REVIEW}.`,
  senior: `WHERE WE STAND ON THE FACTS. Three things here are reported, and only reported: that the federal agency charged with protecting consumers in their dealings with banks and lenders largely withdrew from enforcement and rulemaking for about two years; that fees present an inviting target to lawmakers newly elected on the cost of living; and that a later regulator could examine conduct from that period, within the limits the law allows. They reach us through one newsletter summarising one podcast guest, and neither the recording nor the agency's own site could be opened from our network, so none of the newsletter's figures is printed. What is established, and stated plainly, is that a statute does not lapse because its enforcer is idle, and that most claims carry a deadline set by law. The newsletter's forecasts about the coming year are opinion, and this hour does not teach them. This is teaching, not legal advice. ${REVIEW}.`,
};

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - if you saw something going wrong and nobody had asked you to say anything, would you speak up, and why - and listen all the way to the end before you add a word; have them retell their own answer in their own words, then teach them one verse back, Ezekiel 33:6. Children, ask your mother, your father or a grandparent about a time they warned somebody and were not thanked for it, or a time they wished somebody had warned them; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: which account in our lives have we stopped watching because nobody else is watching it either. Teach each other one verse, and pray one for another. ${RHYTHM}`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - if you saw your little brother about to touch a hot stove, would you shout - and listen all the way to the end before you talk; have them say it back in their own words, then teach them one verse, Numbers 32:23. Children, ask your mom or your dad or your grandma or your grandpa about a time somebody warned them and saved them from getting hurt. Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: is it still wrong if nobody sees. Pray for each other. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what would you do if your friends were doing something wrong and no adult was around - and listen all the way to the end before you fix anything; have them retell the answer in their own words, then teach them one verse, Ecclesiastes 8:11. Children, ask your mom, your dad or a grandparent about a time a rule was not being checked and they kept it anyway; hear the whole of it before you answer, then retell their answer in your own words. Then ask a friend this: who in our lives has been a good watchman for us. Pray one for another. ${RHYTHM}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - where do you see people doing something only because nobody is checking right now - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, Ezekiel 33:3. Children, ask your mom, your dad or a grandparent whether they ever paid a fee they did not understand, and what they did about it; hear the whole of it before you reply, then retell their answer in your own words. Then ask a friend this: where are we supposed to be watchmen for each other, and are we. Pray one for another. ${RHYTHM}`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - who do you trust to tell you the truth when you are about to make a mistake with money - and listen all the way to the end, without finishing a sentence for them; have them retell their own answer in their own words, then teach them one verse back, Ezekiel 33:11. Children, ask your parents or your grandparents about a season when nobody was enforcing a rule and what they saw people do with it; hear the whole of it before you reply, then retell it back to them in your own words. Then tell a friend about one person you could warn and have not, ask who that is for them, and pray one for another. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson. The Word opens it, and no detail from the newsletter
// stands above that frame.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.

Start with the Word, because it said this first and said it better. Yahweh gave Ezekiel a picture every walled town in the world understood. A town picks a man, sets him on the wall, and gives him one job. [[Ezekiel 33:3]] That is all a watchman is: a pair of eyes that sees the trouble before the town does, and a trumpet loud enough to wake the people who are asleep.`,

  `If the watchman blows and the man does not listen, the man answers for himself. [[Ezekiel 33:4]] [[Ezekiel 33:5]] Then comes the verse this whole lesson stands on, and it has two halves that almost everybody reads as one. [[Ezekiel 33:6]]`,

  `Read it again, slowly. The watchman who saw and said nothing is held to account: his blood will I require at the watchman's hand. That is the first half, and it is the one people remember. But look at the man. He is taken away in his iniquity. His own wrong is still his own wrong. The watchman's silence did not make it right, and it did not make it disappear. It only meant that two people now had something to answer for instead of one.`,

  `THE QUIET SEASON. That is the shape of what a banking newsletter described this month. Its guest, a long-time reporter on banks and government, said that the national agency set up to protect ordinary people in their dealings with banks and lenders largely stepped back from enforcing and from writing rules for about two years, and that many bankers were not even glad of it. Then, after an election, he said the pendulum could swing back hard, and that a later regulator could look at what was done in those quiet years, within the deadlines the law sets. In his words, as the newsletter carried them in plain terms: the absence of an active watchman does not necessarily erase the liability for what was done meanwhile.

That is one man's reading of the law, carried by one newsletter, and we hold it at that tier. But the principle under it is not new and it is not his. It is Ezekiel 33:6. The silent watchman answers for his silence, and the man is still taken away in his iniquity.`,

  `WHY SILENCE IS SO DANGEROUS. Solomon saw the same pattern three thousand years ago and named exactly what a quiet season does to the human heart. [[Ecclesiastes 8:11]] When nobody is checking, people do not usually stay as careful as they were. They lean in. The fee that was cautious gets bolder. The practice that would have drawn a letter from a regulator now draws nothing, and nothing feels like permission.

But Solomon did not stop at the pattern. He told us how it ends. [[Ecclesiastes 8:12]] [[Ecclesiastes 8:13]] A long quiet season is not a verdict. It is only a delay. Moses said the same to two tribes who were tempted to take their land and skip their part of the work: [[Numbers 32:23]] Not might. Will.`,

  `THE WATCHMAN WHO SLEEPS. Isaiah describes what it looks like when the people set on the wall stop doing their one job. [[Isaiah 56:10]] And he names the reason more often than not: [[Isaiah 56:11]] A watchman can go quiet because he is told to, because he is tired, or because quiet pays. Whatever the reason, the town is left without a trumpet.

And it is worth saying what the watchman is for, because the Word does say it. The charge laid on those who judge and rule among the people is not to protect the strong. [[Psalms 82:3]] [[Psalms 82:4]] The people a fee falls hardest on are the people with the least room in their account. Lesson six of this course already teaches who actually pays the fees, from Amos 8, and we do not teach it twice here. This lesson adds only this: the fee was still the fee while nobody was watching, and the person who paid it still paid it.`,

  `WHAT WE WILL NOT DO. We will not tell you which party is right, and we name no official. The newsletter makes guesses about hearings, about who will cooperate with whom, and about which bills will pass. Those are forecasts, and a forecast is not a fact. The Word does not need any party to win for Ezekiel 33:6 to be true. It was true before any of them, and it will be true after.`,

  `YOU ARE A WATCHMAN TOO. Here the blade turns toward us, because it must. Jesus told a story about a man who went on a long journey and left his servants in charge, and He closed it with one word for everyone listening. [[Mark 13:37]] Nobody gets to sit this one out.

You are the watchman over your own account. Nobody in any office will read your statement as carefully as you can. If the people paid to watch the banks go quiet for a season, the household that reads its own statement every month loses nothing at all. So read it. Find every fee. Ask what each one is for. Ask for the ones you do not understand to be explained, and for the ones that should not be there to be returned.

And if you run anything that charges other people - a business, a rental, a ministry with a fee for a class - the quiet season is not permission. A rule that is not being enforced is still the rule, and Numbers 32:23 is not suspended because a regulator is short-staffed.

And if you are the one who sees, at work or at church or at home, and you are the one who knows a charge is wrong, you are the watchman in Ezekiel 33:6. Blow the trumpet. Say it to the person who can fix it. You cannot make them listen, and you do not answer for that. You answer for whether you spoke.`,

  `THE ONLY THING THAT ERASES A WRONG. A regulator's silence cannot erase a wrong. Time cannot erase it, though the law may stop pursuing it. Only one thing ever has. Yahweh says it Himself through the same watchman, in the same chapter, and this is the heart of it. [[Ezekiel 33:11]] He does not want the man taken away in his iniquity. He wants him to turn.

That is why the watchman blows at all. The trumpet is not a threat; it is a mercy. And the turning has a door, and the door has a name. John the Baptist saw Him coming and said it out loud: [[John 1:29]] Jesus is the Lamb of Yahweh, the Eternal Son, and He is the one place where a wrong is truly taken away, not hidden, not forgotten, not timed out. For a bank, a business or a household that knows it took what it should not have, the way back is the same as it was in Nehemiah 5 in lesson three of this course: stop, and give it back.`,

  `THIS WEEK, THREE THINGS. One, read your own statement for one full month and write down every fee. Two, if you see a wrong you have stayed quiet about, say it once, plainly, to the person who can fix it. Three, if you have charged anyone what you should not have, turn, and give it back.`,
];

// -----------------------------------------------------------------------------
// The four bands, written by hand for each age.
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.

This is a story from the Bible about a watchman. Long ago, towns had big walls around them. A town would pick one man to stand up on the wall. His job was to look far away. If he saw an army coming, he blew a loud horn called a trumpet. Then all the people would wake up and get safe. Here is what the Bible says about him. [[Ezekiel 33:3]]

So that was his whole job. Look. See. Blow the trumpet.

If he blew it and a man did not listen, that was the man's own fault. But what if the watchman saw the army and did not blow at all? The Bible tells us. [[Ezekiel 33:6]]

That verse has two parts. Let us look at both.

Part one is about the watchman. He saw the danger and stayed quiet. Yahweh says the watchman is in trouble for that. Staying quiet when you should speak up is wrong.

Part two is about the man. He did a wrong thing. Nobody warned him. But his wrong thing was still wrong. The watchman being quiet did not make it okay.

So now two people did wrong, not one.

Here is why that matters today. Our country has helpers whose job is to watch the banks. They make sure banks are fair to people. A letter about banks said those helpers went quiet for a while. They stopped checking very much. The man in the letter said that later on, new helpers might look back at what the banks did in the quiet time.

That is just like the watchman. When the watchman is quiet, wrong things are still wrong.

A wise king named Solomon saw this a long time ago. He saw that when nobody checks, people get bolder about doing wrong. [[Ecclesiastes 8:11]] That means when nobody stops a bad thing right away, people start to think it is fine.

But it is not fine. Moses told some people this. [[Numbers 32:23]] A wrong thing you do will come out one day, even if nobody sees it now.

Some banks charge fees. A fee is money the bank takes for something, like when your account goes too low. Fees hurt poor people the most. Lesson six of this course talks about fees. Here we only say this: a fee is still a fee even when nobody is watching.

We will not say which leaders are good or bad. That is not what this lesson is for. The letter also made guesses about what will happen next. We leave the guesses out, because a guess is not the truth.

Now here is the part about you. Jesus told a story about a man who went on a long trip. Before he left, he gave each helper a job. Jesus ended the story with one word for all of us. [[Mark 13:37]]

You can be a watchman too. If you see a friend about to get hurt, you speak up. If you see something unfair, you tell a grown-up. You cannot make people listen. But you can always speak.

Here is the best part. Yahweh does not want anyone to stay in their wrong. He wants them to come back to Him. [[Ezekiel 33:11]] That is why the watchman blows the horn. The horn is not mean. It is kind. It gives people a chance to turn around.

And when we turn, Jesus is there. John saw Jesus coming and said this. [[John 1:29]] Jesus is the Lamb of Yahweh. He is the only One who can take a wrong away for real. Being quiet cannot take it away. Waiting a long time cannot take it away. Only Jesus can.

THIS WEEK. Look at one thing your family pays for, and ask a grown-up what it is for. If you see something wrong, say so. If you did something wrong, say sorry and make it right.

${FACTS.child}

${TALK.child}`;

const YOUTH = `${TITLE}.

Start with the Bible, because it said this first. In the old days every town had a wall, and every wall had a watchman. Yahweh told the prophet Ezekiel what that watchman was for. [[Ezekiel 33:3]] He had one job. He had to see the trouble coming before anyone else. Then he had to blow the trumpet loud enough to wake the town.

If he did his job and somebody ignored him, that person answered for himself. But Ezekiel goes on to the harder case. This verse is the center of the whole lesson. [[Ezekiel 33:6]]

Most people read that verse as if it only has one point. It has two.

The first point is about the watchman. He saw the danger and stayed silent, and Yahweh holds him to account for it. When you are the one who sees, silence is a choice.

The second point is about the man who was taken. The verse says he is taken away in his iniquity. That means his own wrong was still his own wrong. Nobody warned him, but that did not make it right. So the silence did not cancel anything. It just added a second person who had something to answer for.

Now here is why a banking newsletter made us think of Ezekiel this month. Our country has a national office whose job is to watch banks and lenders for ordinary people. A guest on a banking podcast said that office mostly stopped checking and making rules for about two years. He also said a later watchman could look back at the quiet years. That can happen within the time limits the law sets. His point was simple. A missing watchman does not wipe out the blame for what was done while he was gone.

That is one man's view, carried by one newsletter. But underneath it is Ezekiel 33:6, and that is not one man's view.

King Solomon said why quiet times are dangerous. [[Ecclesiastes 8:11]] When nothing happens fast, people get bolder. A fee gets a little bigger. A habit that used to get a warning now gets nothing. And nothing starts to feel like a yes.

But Moses told two tribes of Israel the rule that never takes a season off. [[Numbers 32:23]] Not maybe. Be sure.

What is a watchman meant to protect? Not the strong. The Bible tells the people in charge to defend the ones with the least. Fees fall hardest on people whose accounts are nearly empty. Lesson six of this course already teaches who pays them. Here we add one thing. The fee was still charged while nobody was watching, and the person still paid it.

We will not tell you which party is right, and we will not name any leader. The newsletter makes guesses about hearings and votes. Guesses are not facts. The Bible does not need anyone to win an election for Ezekiel 33:6 to be true.

Now turn it around. Jesus told a story about a master who went away and left his servants in charge. He ended with one word for everybody. [[Mark 13:37]]

You are a watchman too. When you have your own bank account, read it every month. Ask about every fee you do not understand. And right now, if you see a friend heading for trouble, say something. If you see something unfair, tell the person who can help. You cannot make anyone listen. You only answer for whether you spoke.

Last, and most important: the trumpet is a kindness. Yahweh says so in the same chapter. [[Ezekiel 33:11]] He does not want anyone stuck in their wrong. He wants them to turn. When John the Baptist saw Jesus coming, he said who makes the turning possible. [[John 1:29]] Jesus is the Lamb of Yahweh, the Eternal Son. Silence cannot erase a wrong. Time cannot erase it. But He takes it away for real.

THIS WEEK. Ask a parent to show you one bank statement and find every fee on it. If you have stayed quiet about something wrong, say it once to the right person. If you took something that was not yours, give it back.

${FACTS.youth}

${TALK.youth}`;

const TEEN = `${TITLE}.

Start with the Word, because it got here first. Old towns had walls, and walls had watchmen. Yahweh used that job to teach Ezekiel something every age needs. [[Ezekiel 33:3]] The watchman's whole value is that he sees first and speaks loud.

If he warns and people ignore him, that is on them. Then Ezekiel turns to the harder case, and this verse carries the whole lesson. [[Ezekiel 33:6]]

There are two claims in that verse, and you need both.

Claim one: the watchman who sees and stays silent is accountable for his silence. Seeing and saying nothing is a choice, and Yahweh treats it as one.

Claim two: the man who was taken is taken away in his iniquity. His wrong was still his. The missing warning did not make it okay. The silence did not cancel his guilt. It just meant two people had something to answer for.

Here is why that verse came up this month. A newsletter about banks and money recapped a podcast after the election. The guest has covered banks and government for a long time. He said the federal agency set up to protect people from unfair banks and lenders mostly stopped enforcing and writing rules for about two years. He expects the pendulum to swing back. And he made a point that matters far beyond politics. A later regulator could look at what was done in the quiet years, within the deadlines the law sets. A missing regulator does not wipe out the blame for what was done while he was gone.

That is a reported opinion, one guest through one newsletter. But the principle under it is Ezekiel 33:6, and that is not opinion.

Solomon saw what a quiet season does. [[Ecclesiastes 8:11]] Slow results train people to push further. A fee creeps up. A habit that used to get a warning letter gets nothing. Then silence starts to feel like a yes. But Solomon also tells you how it ends: a delay is not a verdict. Moses said it in one line to two tribes who wanted to skip their share of the work. [[Numbers 32:23]]

So what is the watchman for? The Word is clear. Those who rule are meant to defend the poor and the needy, not shield the strong. Fees hit hardest on people with the least money, and lesson six of this course covers who pays them. This lesson adds one small point. The fee was still charged in the quiet season, and the person still paid it.

We are not going to tell you which party is right, and we name no official. The newsletter guesses about hearings and how much the two sides will work together. Those are guesses, and guesses are not facts. Ezekiel 33:6 does not depend on who wins.

Now the part that is about you. Jesus told about a master who left on a long trip and put his servants in charge, and He closed with one word for every listener. [[Mark 13:37]]

You are a watchman over your own money. When you open an account, read the statement every month and ask about every fee. Nobody in an office will read it as closely as you. If you ever run something that charges people, a season of weak rules is not permission. And when you see something wrong, at school, at work or online, you are the watchman in Ezekiel 33:6. Say it to the person who can fix it. You cannot make them listen. You answer for whether you spoke.

Last: the trumpet is there because of mercy. [[Ezekiel 33:11]] Yahweh wants people to turn, not to be caught. And John the Baptist named the One who makes turning real. [[John 1:29]] Jesus is the Lamb of Yahweh, the Eternal Son. A quiet regulator cannot remove a wrong, and time cannot remove it. He can, and He is the only One who ever has. If you took what was not yours, the way back is the one Nehemiah 5 showed in lesson three: stop, and give it back.

THIS WEEK. Read one month of a real statement with a parent and list every fee. Speak up once about something you have stayed quiet about. Make right one thing you have gotten away with.

${FACTS.teen}

${TALK.teen}`;

const SENIOR = `${TITLE}.

We begin with the Word, which set out this principle long before any agency existed to enforce it. Yahweh gave Ezekiel the image of a walled town and the man it sets upon the wall, and He defined that man's office in a single sentence. [[Ezekiel 33:3]] A watchman is valuable for exactly one reason: he sees the danger first, and he sounds the alarm loudly enough to rouse those who are asleep.

If he sounds it and a man ignores it, the man bears his own responsibility. Then the prophet turns to the case that concerns us, and the whole of this hour rests upon it. [[Ezekiel 33:6]]

Most of us have read that verse as making one point. It makes two, and it is the second that is usually missed.

The first concerns the watchman. Having seen, he kept silent, and Yahweh holds him to account for it. Silence in the one who sees is not neutrality; it is a decision.

The second concerns the man who was taken. He is taken away in his iniquity. His wrong remained his own. The absence of a warning did not convert it into something lawful or right. The watchman's silence cancelled no one's responsibility; it merely added a second party who must answer.

This came to mind through a banking newsletter that recapped a podcast in the days after the election. Its guest, a man who has reported on banking and government for a quarter of a century, said that the federal agency established to protect consumers in their dealings with banks and lenders had largely withdrawn from enforcement and rulemaking for about two years, and that a good many bankers had not welcomed the change. He expects the pendulum to swing back. And he observed that a later regulator could examine practices from those quiet years, within the deadlines the law permits, because the absence of an active regulator does not necessarily extinguish liability for conduct that occurred in the meantime.

That is one commentator's reading, conveyed by one newsletter, and we hold it at that weight. The principle beneath it, however, is Ezekiel 33:6, and it carries far more weight than any commentator.

Solomon described precisely what a quiet season does to the human heart. [[Ecclesiastes 8:11]] Where consequences are slow, conduct grows bolder. A fee is raised a little. A practice that once drew a letter of warning now draws nothing, and nothing is soon taken for consent. Yet Solomon also told us how such seasons end, and Moses put it in a single line to two tribes tempted to settle their own land and leave their brothers to fight alone. [[Numbers 32:23]]

What, then, is a watchman for? The Word charges those who judge and rule to defend the poor and the fatherless, not to shelter the powerful. Fees fall hardest upon those with the least margin in their accounts; lesson six of this course treats that subject from Amos 8, and we do not repeat it. This lesson adds only one observation: the fee was still levied during the quiet season, and the person who paid it still paid it.

We will not tell you which party is right, and we name no official. The newsletter forecasts hearings, investigations and the prospects for cooperation between branches of government. Those are predictions about the future, and they are not taught here. Ezekiel 33:6 required no election to be true, and no election will undo it.

Now the matter turns toward each of us. Jesus told of a man who went on a far journey and left his servants in charge of his house, and He ended with a single word addressed to every listener. [[Mark 13:37]]

You are the watchman over your own household's accounts. No official anywhere will read your statement as carefully as you can, and a household that reads its own statement every month loses nothing when the regulators go quiet. If you have managed any enterprise that charges others, you know that a season of lax enforcement is not a licence. And if in your church, your family or your old place of work you are the one who sees that a charge is wrong, you are the watchman of Ezekiel 33:6. Sound the trumpet to the person who can correct it. You cannot compel anyone to listen, and you will not answer for their refusal. You will answer for whether you spoke.

Finally, the trumpet is an act of mercy, and Yahweh says so in the same chapter. [[Ezekiel 33:11]] He takes no pleasure in a man being carried off in his wrong; He desires that he turn. And John the Baptist named the One through whom turning becomes real. [[John 1:29]] Jesus is the Lamb of Yahweh, the Eternal Son. Neither a regulator's silence nor the passing of years can take away a wrong; He alone ever has. For any household or institution that knows it took what it should not have, the way back is the one Nehemiah showed in lesson three of this course: cease, and restore.

THIS WEEK. Read one full month of your own statements and write down every fee. Speak once, plainly, about a wrong you have kept quiet about. And if you have charged anyone what you should not have, return it.

${FACTS.senior}

${TALK.senior}`;

// -----------------------------------------------------------------------------
// The module
// -----------------------------------------------------------------------------
const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `A watchman has one job: see the trouble first and blow the trumpet. [[Ezekiel 33:6]] That verse holds two truths at once. The watchman who stays silent answers for his silence, AND the man is still taken away in his iniquity - the silence never made his wrong right. A banking newsletter this month reported one guest's view that the federal consumer-finance agency largely went quiet for about two years, and that a later regulator could look back at the quiet years within the law's deadlines. That is reported, one man's account; the principle under it is the Word's. A quiet season is a delay, not a verdict, and the only thing that ever truly takes a wrong away is the Lamb of Yahweh. ${REVIEW}.`,
  inApp: `One month, one page, about forty minutes. Take the most recent full month of every account you hold - checking, savings, card. FIRST, THE FEES. Write down every fee, by name and amount, and beside each one write in plain words what it was for. If you cannot say what one was for, that is the first trumpet to blow: ask the bank to explain it, and to return it if it should not have been charged. SECOND, THE QUIET. Write down one thing you have kept quiet about because nobody was checking - at home, at work, in a business you run. THIRD, THE TURN. If anything on that list is a charge you made that you should not have, write the name of the person and what you will give back, and when.`,
  anchor: {
    ref: '',
    theme: `THE WATCHMAN'S SILENCE NEVER MADE THE WRONG RIGHT.

Ezekiel 33:6 is usually read as a warning to watchmen, and it is one. But it says something just as important about everyone else: the man who was never warned is still taken away in his iniquity. Silence on the wall does not change what was done below it. Solomon names what a quiet season does to the heart - because sentence is not executed speedily, the heart is fully set to do evil - and Moses names how it ends: be sure your sin will find you out. So the posture of a believer in a quiet season is the same as in a loud one. Read your own account. Speak when you are the one who sees. Do not mistake the absence of a regulator for the presence of permission. And remember why the trumpet is blown at all: Yahweh has no pleasure in the death of the wicked, but that the wicked turn from his way and live. The turning has a door, and it is the Lamb of Yahweh, who takes away the sin of the world.`,
  },
  levels: {},
  benefits: [
    'You get the half of Ezekiel 33:6 most readers skip. The silent watchman answers for his silence, AND the man is still taken away in his iniquity. A missing warning never turned a wrong into a right; it only added a second party who must answer.',
    'You get Solomon on what a quiet season does to people: because sentence against an evil work is not executed speedily, the heart is fully set to do evil (Ecclesiastes 8:11). And you get how it ends: be sure your sin will find you out (Numbers 32:23).',
    'You get a clean way to hold a political news item without being pulled into a fight. What one guest reported is held as reported; what the law plainly is gets said plainly; the forecasts are left as forecasts. No party is staged against another.',
    'You get the watchman turned toward yourself: Jesus closed His story of the absent master with one word for all, Watch (Mark 13:37). You are the watchman over your own statement, and a household that reads its own statement loses nothing when the regulators go quiet.',
    'You get the trumpet understood as mercy. Yahweh has no pleasure in the death of the wicked, but that he turn and live (Ezekiel 33:11), and Jesus, the Lamb of Yahweh, is the one place a wrong is truly taken away, not hidden and not timed out.',
    'Carry it out this week: list every fee on one month of your accounts, ask about the ones you cannot explain, speak once about a wrong you have kept quiet about, and give back anything you charged that you should not have.',
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'light',
      verse: 'Mark 13:37',
      title: 'The Tuesday Statement',
      body: `Picture a woman named Rosa who keeps the books for her household the way her grandmother taught her: every month, on the first Tuesday, with a pencil, a cup of coffee and the paper statement spread out on the kitchen table. Her son teases her about it. Nobody reads statements anymore, he says. The bank does all that.

One Tuesday Rosa finds a small charge she does not recognise. It has a long name and a short amount, and it has been there, she discovers when she pulls the older statements out of the drawer, for seven months. Nobody had flagged it. Nobody had written to her. It was the kind of thing, her son admitted later, that he would never have seen in a hundred years.

So Rosa called. She waited on hold through two songs she did not like. She asked the young man who finally answered what the charge was for. He did not know. He went and asked somebody. It turned out to be a service she had never signed up for, attached to her account by mistake during a branch change the year before.

The bank returned all seven months. Rosa wrote the amount in the margin, underlined it twice, and put the kettle back on.

Her son reads his own statements now. Not every day. The first Tuesday.`,
    },
    {
      kind: 'parable',
      tone: 'solemn',
      verse: 'Ezekiel 33:6',
      title: 'The Clerk Who Saw the Fee',
      body: `Picture a young man named Daniel, two years into his first office job at a company that collected payments for landlords. One afternoon, reconciling an account, he noticed that a late fee had been charged to a family that had paid on time. The payment had landed on a holiday, when the office was closed, and the system had marked it late the next morning.

He checked a few more accounts. It had happened to dozens of families, every holiday, for as long as the records went back.

Daniel mentioned it to the man at the next desk, who shrugged. Nobody audits that anymore, he said. The office that used to check on us has not sent anybody in two years. It is not your problem.

Daniel let it go. He had rent to pay himself, and he did not want to be the new person who made trouble.

Three years later a new examiner came, and the first thing she pulled was the holiday late fees. The company paid them all back, with a penalty on top. And in the meeting where it was explained to the staff, the manager asked a question nobody wanted to answer: did anyone here know about this?

Daniel knew. He had known for three years. The fees had been wrong the whole time nobody was checking, and so had his silence. Both had been waiting for the day somebody looked.`,
    },
  ],
  lesson: [...LESSON, FACTS.lesson, TALK.lesson].join('\n\n'),
  quiz: {
    questions: [
      {
        q: 'What is the one job of the watchman in Ezekiel 33:3?',
        options: [
          'To fight the army himself',
          'To see the sword coming and blow the trumpet to warn the people',
          'To collect taxes at the gate',
          'To decide who may enter the town',
        ],
        answer: 1,
        explain:
          'If when he seeth the sword come upon the land, he blow the trumpet, and warn the people. He sees first and speaks loud; that is the whole office.',
      },
      {
        q: 'In Ezekiel 33:6, what happens to the man who was never warned?',
        options: [
          'He is excused because nobody warned him',
          'He is taken away in his iniquity - his own wrong is still his own',
          'The watchman takes his place',
          'Nothing happens to him at all',
        ],
        answer: 1,
        explain:
          'The verse has two halves. The silent watchman answers for his silence, AND the man is still taken away in his iniquity. The missing warning never made his wrong right.',
      },
      {
        q: 'What does Ecclesiastes 8:11 say a slow consequence does to people?',
        options: [
          'It makes them more careful',
          'It makes no difference',
          'Because sentence is not executed speedily, the heart is fully set to do evil',
          'It makes them forget the law exists',
        ],
        answer: 2,
        explain:
          'A quiet season trains people to push further. Solomon names the pattern, and in verses 12 and 13 he names how it ends: it shall not be well with the wicked.',
      },
      {
        q: 'Which statement in this lesson is ESTABLISHED, not merely reported?',
        options: [
          'That the agency stepped back for about two years',
          'That fees are an easy target for new lawmakers',
          'That a law does not stop being the law because nobody enforced it this season, and most claims carry a time limit the law sets',
          'That hearings will be held next year',
        ],
        answer: 2,
        explain:
          'The first two come from one podcast guest through one newsletter and are held as reported. The last is a forecast and is not taught. The general principle about law and its time limits is stated plainly.',
      },
      {
        q: 'How does this lesson treat the newsletter forecasts about hearings and cooperation?',
        options: [
          'As facts to be taught',
          'As opinion about the future, left out of the teaching',
          'As proof that one party is right',
          'As the reason to vote a certain way',
        ],
        answer: 1,
        explain:
          'Teach the Word, do not debate it. A forecast is not a fact, no party is staged against another, and Ezekiel 33:6 does not need anyone to win for it to be true.',
      },
      {
        q: 'Why does this lesson not teach in depth who pays bank fees?',
        options: [
          'Because fees do not matter',
          'Because lesson six of this course already teaches it from Amos 8, and one teaching gets one lesson',
          'Because the newsletter did not mention fees',
          'Because fees are always fair',
        ],
        answer: 1,
        explain:
          'Lesson six owns who actually pays the fees. This lesson adds only that the fee was still the fee while nobody was watching, and the person who paid it still paid it.',
      },
      {
        q: 'What word did Jesus close His story of the absent master with, for everyone?',
        options: ['Rest', 'Watch', 'Wait', 'Count'],
        answer: 1,
        explain:
          'And what I say unto you I say unto all, Watch (Mark 13:37). Each of us is the watchman over our own account, and a household that reads its own statement loses nothing when the regulators go quiet.',
      },
      {
        q: 'If you are the one who sees a charge is wrong, what do you answer for, according to Ezekiel 33?',
        options: ['Whether the other person listened', 'Whether you spoke', 'Whether the regulator acted', 'Nothing at all'],
        answer: 1,
        explain:
          'If the watchman warns and the man does not take warning, his blood is upon his own head; the watchman has delivered his soul. You cannot make anyone listen. You answer for whether you blew the trumpet.',
      },
      {
        q: 'Why does Yahweh have the trumpet blown at all, according to Ezekiel 33:11?',
        options: [
          'To frighten people',
          'Because He has no pleasure in the death of the wicked, but that the wicked turn from his way and live',
          'To catch people out',
          'To give the watchman something to do',
        ],
        answer: 1,
        explain: 'The trumpet is mercy. It exists so people can turn before the sword arrives.',
      },
      {
        q: 'What is the one thing that truly takes a wrong away?',
        options: ['A regulator going quiet', 'Enough years passing', 'The Lamb of Yahweh, who taketh away the sin of the world', 'Nobody finding out'],
        answer: 2,
        explain:
          'Silence cannot erase a wrong and time cannot erase it. Jesus, the Lamb of Yahweh and the Eternal Son, takes it away for real (John 1:29), and the way back for anyone who took what was not theirs is to stop and give it back.',
      },
    ],
  },
  facilitator: {
    talkingPoints: [
      'Read Ezekiel 33:6 twice and have the room find the second half themselves: he is taken away in his iniquity. Most people only hear the watchman part.',
      'Give the news item at its tier before any interpretation: one guest, one newsletter, reported. Then say what is established plainly: a law does not stop being the law because nobody enforced it this season.',
      'Do not let the hour become a debate about parties or officials. If the room goes there, bring it back to the verse: Ezekiel 33:6 needed no election to be true.',
      'Ecclesiastes 8:11 is the diagnosis and Numbers 32:23 is the ending. A quiet season is a delay, not a verdict.',
      'Turn the blade inward with Mark 13:37. Everyone in the room is a watchman over their own statement, and some are watchmen at work.',
      'Land on Ezekiel 33:11 and John 1:29. The trumpet is mercy, and the Lamb of Yahweh is the only One who takes a wrong away. Point back to Nehemiah 5 in lesson three for the shape of giving it back.',
    ],
    howToRun: `Open by asking the room what a watchman is for, and collect three answers before any Scripture. Read Ezekiel 33:3 through 6 aloud, slowly. Ask what happened to the man who was not warned, and let the room find the phrase in his iniquity. Then give the news item, clearly marked as one guest's account through one newsletter. Read Ecclesiastes 8:11 to 13 and Numbers 32:23. Spend the hands-on time on the one-month fee list. Close on Ezekiel 33:11 and John 1:29, and send everyone home with the three things for the week.`,
    discussionPrompts: [
      'When have you been the one who saw something wrong and stayed quiet? What made it hard to speak?',
      'Have you ever treated the fact that nobody was checking as if it meant something was allowed?',
      'Who has been a good watchman in your life, someone who warned you when it was not easy to?',
      'If you looked at one month of your own statements tonight, what do you think you would find?',
    ],
  },
};

// -----------------------------------------------------------------------------
// Fill, derive the anchor
// -----------------------------------------------------------------------------
const filled = fillDeep({ ...MODULE, anchor: { ...MODULE.anchor, ref: '' }, levels: {} });
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
// Key order as the course's other lessons carry it.
const ordered = {
  id: filled.id,
  title: filled.title,
  bigIdea: filled.bigIdea,
  inApp: filled.inApp,
  anchor: filled.anchor,
  levels: filled.levels,
  benefits: filled.benefits,
  stories: filled.stories,
  lesson: filled.lesson,
  quiz: filled.quiz,
  facilitator: filled.facilitator,
};

for (const place of ['lesson', 'child', 'youth', 'teen', 'senior']) {
  const text = place === 'lesson' ? ordered.lesson : ordered.levels[place];
  if (!/TALK ABOUT IT TOGETHER/.test(text)) throw new Error(`bank10: ${place} has no TALK ABOUT IT TOGETHER`);
  if (!text.includes(REVIEW)) throw new Error(`bank10: ${place} has no dated note`);
}

// -----------------------------------------------------------------------------
// Refuse to splice a lesson that fails its own measures
// -----------------------------------------------------------------------------
const { fourBandFaults, fk, words, overlapOf, FOUR_BANDS } = await import('../app/src/__tests__/fixtures/four-band-ladder.js');
const adultWords = words(ordered.lesson);
console.log(`bank10: adult prose words ${adultWords} fk ${fk(ordered.lesson).toFixed(2)}`);
for (const b of FOUR_BANDS) {
  console.log(
    `bank10: ${b} words ${words(ordered.levels[b])} share ${(words(ordered.levels[b]) / adultWords).toFixed(3)} fk ${fk(ordered.levels[b]).toFixed(2)} overlap-adult ${overlapOf(ordered.levels[b], ordered.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`bank10: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(ordered.levels[FOUR_BANDS[i]], ordered.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(ordered);
if (process.argv.includes('--dry')) {
  console.log(faults.length ? faults.join('\n') : 'bank10: no four-band faults');
  process.exit(0);
}
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('bank10: refusing to splice a lesson that fails the four-band ladder');
}

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const src = readFileSync(COURSE, 'utf8');
if (src.includes(ID)) throw new Error('bank10: the id is already in the course; refusing to rebuild');
if (!src.includes(PREV)) throw new Error(`bank10: ${PREV} is not in the course; bank10 follows it`);

const OPEN = 'export const BANKING_MODULES = [';
const open = src.indexOf(OPEN);
if (open < 0) throw new Error('bank10: the modules array was not found');
const end = src.indexOf('\n];', open);
if (end < 0) throw new Error('bank10: the modules array is not closed');

const block = JSON.stringify(ordered, null, 2)
  .split('\n')
  .map((l) => `  ${l}`)
  .join('\n');
const tailHasComma = /\}\s*,\s*$/.test(src.slice(0, end));
const next = tailHasComma ? `${src.slice(0, end)}\n${block},${src.slice(end)}` : `${src.slice(0, end)},\n${block}${src.slice(end)}`;

const weeks = (text) => [...new Set([...text.matchAll(/["']bank(\d+)-/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
const before = weeks(src);
if (before.includes(WEEK)) throw new Error(`bank10: week ${WEEK} is already taken`);
const after = weeks(next);
if (after[after.length - 1] !== WEEK) throw new Error(`bank10: week ${WEEK} is not the top of the course after splicing`);
if (next.split(`"${ID}"`).length - 1 !== 1) throw new Error('bank10: the new id did not land exactly once');

writeFileSync(COURSE, next);
for (const r of readerRefs) verseText(r);
console.log(`bank10: spliced ${ID}`);
console.log(`bank10: modules ${before.length} -> ${after.length}; top week ${WEEK}`);
console.log(`bank10: ${readerRefs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
