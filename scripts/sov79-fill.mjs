// =============================================================================
// sov79-fill - build Sovereign A.I. week 79 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456). Every quoted
// verse on this page is FILLED FROM app/public/bible/kjv at build time. The
// prose below holds only a reference in double brackets, [[Psalm 75:6]], and
// this script replaces it with the corpus text followed by the reference. No
// verse on the page was typed from memory, so a quotation cannot drift from the
// text and cannot be approximate. The reference list on the module's anchor is
// DERIVED from the placeholders that actually occur in the reader places, so
// anchor.ref names every verse the lesson stands on and nothing it does not
// (DR-0734).
//
// WHERE THE WORD CAME FROM. On 2026-10-28 at 14:07 UTC Darrell forwarded a
// Daily Upside daily issue, subject line "FW: Apple Bites Nvidia", out of his
// university mailbox into the lesson lane, with ONE WORD typed above the
// forwarded header: Lessons. That word is the ask; the newsletter is the
// occasion only. Gmail thread `1a182d6bb1fd6fa6`. SIXTEEN DAYS stood between
// his word and this build, and the record keeps that rather than smoothing it.
// Both DR-1414 witnesses agreed the thread was unbuilt: no Lesson-Captured in
// the thread's own labelIds, and scripts/lesson-already-built.mjs returned
// NOTHING FOUND.
//
// WORD FIRST (DR-0127 / DR-0282 / DR-1326). The hour opens on Psalm 75:6-7 -
// promotion comes neither from the east nor the west nor the south, because God
// is the judge, He puts down one and sets up another - and on Luke 22:24, where
// the men closest to Jesus fell into a strife over which of them should be
// accounted the greatest. A league table of the two most valuable houses on
// earth, trading first and second place, is that same strife with a market
// ticker attached. Not one figure from the newsletter stands above that frame.
//
// TRUST BUT VERIFY (DR-0190 / DR-0100). A newsletter is a LEAD, never the
// citation. THE PRIMARY WAS NOT READ: four primary hosts each refused this
// session's egress proxy with `CONNECT tunnel failed, response 403` -
// www.coca-colacompany.com, www.kearney.com, www.qualcomm.com and www.sec.gov -
// so no figure here rests on a primary-source read, and that is said in EVERY
// reader place with a dated re-review (DR-0076 section 8). Independent secondary
// roads were walked on each load-bearing number instead, and the checking
// CHANGED five things, each gated in
// app/src/__tests__/sovereign-ai-sov79-verses.test.js:
//   1. STRONGER, AND SAID PLAINLY (DR-0100 section 5). The reshoring pair held
//      on a second road: Kearney's own 2026 index and an independent trade
//      report both carry domestic computer and electronic output up about 2.8
//      percent while imports of the same category rose about 29 percent. And
//      checking ENLARGED the point the digest only gestured at - a supply-chain
//      report puts computer and electronics at about 453 billion dollars, about
//      44 percent of the year's imports from Asian low-cost countries, the
//      single largest category. The gap the digest called a reality check is
//      the biggest line in the ledger, not a footnote.
//   2. SOFTER THAN THE HEADLINE, AND THAT IS THE HONEST READING. Coca-Cola's
//      reported operating margin of 33.4 percent against 32.0 percent held, and
//      the checking added two things the digest left out: the comparable
//      non-GAAP margin was about 32.9 percent against 31.9 percent, and North
//      America operating income ROSE about 5 percent with volume flat. A home
//      market whose income grew is not a fizzless home market. The digest's
//      own explanation - a holiday week that fell in the prior quarter - was
//      confirmed and attributed to the company.
//   3. CORRECTED. The digest credits Friday's change of rank to the launch of
//      the foldable Duo phone. The Duo was UNVEILED on the ninth of September
//      2026 and went ON SALE on Friday the twenty-third of October. The thing
//      called a launch was a sale date for a six-week-old announcement. The
//      rank-trading itself is established - Apple and Nvidia have swapped the
//      top two places repeatedly through 2026 - and Nvidia reaching five
//      trillion dollars first of any company in October 2025 is established
//      too, so the digest's "last fall" is right from its own vantage.
//   4. NOT ESTABLISHED, NAMED RATHER THAN QUIETLY DROPPED. The claim that more
//      than 90 percent of the BlueChip prototypes' components already come from
//      the United States and allied countries did not survive as a statement of
//      present fact; the better-supported reading is that about 90 percent US
//      and allied is a TARGET for the first laptop, with a fully domestic
//      supply chain as the long-term goal. And the chips-from-Arizona detail is
//      attributed to Qualcomm's chief executive by way of a newspaper report;
//      Qualcomm's own written announcement does not name the foundry or the
//      state. Taught here as attributed, never asserted on our own authority.
//   5. ATTRIBUTED, NEVER ASSERTED: the assembly site in Ashville, Ohio, the
//      Snapdragon X Series part, the orders-in-2027 timing, and every company
//      statement of intent about rebuilding suppliers.
//   NOT CHECKED AT ALL, so silence is never mistaken for a check: the eyewear
//   heir's 1.1-billion-dollar debt figure and his podcast remarks, Boeing's
//   ten-percent drop and its 737 delivery target, the consumer-confidence
//   reading, the 19-of-26 analyst tally, Coca-Cola's 32-percent year-to-date
//   share move against 14 percent for the staples sector, the Diet Coke and
//   Coke Zero volume figures, the General Motors hybrid plan, and the sentence
//   about war-related costs.
//   re-review: 2026-11-27 - when a primary road is reachable, the figures above
//   are read at the source and this record is corrected in public if they move.
//
// PLACEMENT (DR-0061). Sovereign A.I., because the hour is about who is first,
// who makes the machines, and whether a household can hold its own tools - the
// course's own subject. Week 79, after sov78.
// =============================================================================
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 79;
const ID = 'sov79-promotion-cometh-not-from-the-east';
const TITLE =
  'Promotion cometh not from the east - the two most valuable houses trading places, the land that had no smith, and the vineyard at home nobody kept';

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
  if (!m) throw new Error(`sov79: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov79: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov79: reference does not resolve in the corpus -> "${ref}"`);
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
// still gets the blocked road, the date, the gap and his word (DR-0795).
// -----------------------------------------------------------------------------
const BLOCKED =
  'WHAT WE COULD NOT CHECK AT THE SOURCE. The primary was not read. Four primary hosts refused this build - www.coca-colacompany.com, www.kearney.com, www.qualcomm.com and www.sec.gov - each with the same refusal from our own network, a connect tunnel failure with a 403. So no number on this page rests on a primary-source read. Independent second roads were walked on every number the teaching leans on, and the roads that stayed shut are named here on purpose, because a shut road must never read like a verified fact. re-review: 2026-11-27.';

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - where are you trying to be counted first, and who is the one you want to be counted ahead of - and listen all the way to the end before you say a single corrective word; have them retell their own answer in their own words, then teach them one verse back, Psalm 75:6. Children, ask your mother, your father or a grandparent about a season when somebody else was promoted over them, what they did with it, and what they would tell a young person about waiting on Yahweh for promotion; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: what is one thing the two of us can make with our own hands this month instead of buying it. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - who do you want to be better than, and why - and listen all the way to the end before you help; have them say it back to you in their own words, then teach them one verse, Psalm 75:6. Children, ask your mom or your dad or your grandma or your grandpa about a time someone else got picked first. Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: what can we make with our own hands this week. Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what place are you trying to get to, and who gives that place out - and listen all the way to the end before you fix anything; have them retell the answer in their own words, then teach them one verse, Psalm 75:7. Children, ask your mom, your dad or a grandparent what they learned about being passed over, and hear the whole of it before you answer; then retell their answer in your own words. Then ask a friend this: what is one skill neither of us has, that we should learn so we do not have to hire it out. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what rank are you chasing, who keeps that league table, and what would it cost you to stop reading it - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, Luke 16:15. Children, ask your mom, your dad or a grandparent about a time they wanted a position and did not get it, and what Yahweh did with that year, and hear all of it before you reply; then retell their answer in your own words. Then ask a friend this: name one tool each of us depends on that we could not fix, repair or replace ourselves. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - who are you measuring yourself against, and who do you think hands out the place you want - and listen all the way to the end, without finishing a sentence for them; have them retell their own answer in their own words, then teach them one verse back, Psalm 75:7. Children, ask your parents or your grandparents what trade or repair they once knew that the house no longer knows, and what it would take to learn it again, and hear the whole of it before you reply; then retell it back to them in your own words. Then ask a friend this: what have the two of us been keeping an eye on abroad while the vineyard at home went unkept. Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson, in eight numbered movements. The Word opens every one, and
// no figure from the newsletter stands above that frame.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.

WHO SENT THIS, AND WHEN. On the twenty-eighth of October 2026, at 14:07 by universal time, Darrell forwarded a daily business newsletter out of his university mailbox into this lane. Above the forwarded header he typed ONE WORD: Lessons. That word is the ask. The newsletter is only the occasion, and no article is the foundation of an hour in this course. Sixteen days stood between his word and this build, and that gap stands on the record here rather than being smoothed away.

WHAT THE ISSUE HELD. Four items and an opening anecdote: two companies trading the first and second places in the world by market value; a defense firm and a chipmaker announcing an American-designed laptop; a beverage house growing everywhere except at home; and an heir on a podcast announcing that he, not his late father's chosen successor, should be running the family business. Read as business news, that is four unrelated stories. Read through the Word, it is one story told four times, and Scripture settled it before any exchange on earth opened a trading day.`,

  `MOVEMENT ONE: PROMOTION COMETH NEITHER FROM THE EAST. Begin where the Word begins, because the Word is the foundation here and the authority. A psalm of Asaph takes the question of who rises and who falls out of human hands in a single stroke: [[Psalm 75:6]] Not from the east. Not from the west. Not from the south. Three directions named, and the fourth - the north, where the ancients looked for the throne - left out, because the answer is not a direction at all. The next line gives it: [[Psalm 75:7]] God is the judge. He puts down one. He sets up another. Promotion is a verdict handed down, not a prize won.

Daniel says it twice, once about the calendar and once about the chairs. On the ordering of the seasons and of rulers: [[Daniel 2:21]] He removes kings and sets up kings. And in the plainest sentence in the book about who runs the world: [[Daniel 4:17]] The most High rules in the kingdom of men, and gives it to whomsoever He will. Not to the most deserving. Not to the quickest. To whomsoever He will.

Hannah had already sung it over a cradle, and she put wealth and poverty in the same hand: [[1 Samuel 2:7]] The LORD makes poor and makes rich. He brings low and lifts up. And she put the whole social ladder inside it: [[1 Samuel 2:8]] He raises up the poor out of the dust and sets them among princes.

So before a single figure from the newsletter is spoken, the frame is fixed. A league table of the most valuable houses on earth is a record of where Yahweh currently has them standing. It is a photograph, not a judgment. Whoever is first this Friday is first because He has not yet put them down. That is the whole hour, and everything after this is detail.`,

  `MOVEMENT TWO: WHICH OF THEM SHOULD BE ACCOUNTED THE GREATEST. Now the newsletter's own words, and they are worth hearing exactly as written, because the writer saw something true. Two companies, the digest said, have been bopping back and forth between being the world's most valuable company and the world's second most valuable company, their market caps rising and falling by hundreds of billions of dollars. That is the picture: not a contest over whether to be large, but a contest over which of two enormous houses is counted FIRST.

Scripture has that exact scene, and it happens in the worst possible room. At the last supper, after the bread and the cup, with the betrayal already named: [[Luke 22:24]] A strife among them, which of them should be accounted the GREATEST. Accounted. Not which was greatest - which would be RECKONED greatest. It is a ranking dispute, and the men having it had just eaten with Jesus.

His answer does not scold the ambition out of them; it relocates it. First He names the world's pattern honestly: [[Luke 22:25]] They exercise lordship, and are called benefactors. Then He cuts it off: [[Luke 22:26]] He that is greatest among you, let him be as the younger; and he that is chief, as he that doth serve. And He points at Himself as the measure: [[Luke 22:27]] I am among you as he that serveth.

Mark records the same teaching with the same inversion, and adds the price: [[Mark 10:43]] [[Mark 10:44]] Servant of all. And the reason it is not mere humility theater: [[Mark 10:45]] The Son of man came not to be ministered unto, but to minister, and to give His life a ransom for many. The ranking is real in Yahweh's economy. It is simply measured downward. Paul states the household form of it in one clause: [[Philippians 2:3]] Let each esteem other better than themselves.

Which means the two companies are not doing anything strange. They are doing the ordinary thing, the thing the disciples did at the table, and the market is simply keeping the score out loud with nine zeros attached.`,

  `MOVEMENT THREE: THAT WHICH IS HIGHLY ESTEEMED AMONG MEN. Here is the sentence that makes a market capitalization a spiritual object and not a neutral number. Jesus said it to men who were sure of their own standing: [[Luke 16:15]] That which is highly esteemed among men is abomination in the sight of God. Esteem is the operative word. A market value is, precisely and only, aggregate esteem - a count of what people are willing to pay to be associated with a thing. Jesus did not say esteem is worthless; He said the summit of human esteem and the sight of Yahweh do not agree, and He used the strongest word available.

Isaiah takes the same truth and stretches it over a whole day: [[Isaiah 2:11]] The lofty looks of man shall be humbled, and the LORD alone shall be exalted in that day. He names the mechanism: [[Isaiah 2:12]] The day of the LORD of hosts shall be upon every one that is proud and lofty. And he repeats the conclusion because it is the point of the chapter: [[Isaiah 2:17]] The LORD alone shall be exalted. One name is going to be left standing on the list, and it is not a company.

Obadiah puts it in two lines that read like they were written for a league table. First the deception: [[Obadiah 1:3]] The pride of thine heart hath deceived thee. Then the altitude, and the drop: [[Obadiah 1:4]] Though thou exalt thyself as the eagle, and though thou set thy nest among the stars, thence will I bring thee down. Among the stars. The nest can be as high as you like. The verb at the end is still His.

And on how fast a valuation can leave the building, Solomon has the image: [[Proverbs 23:5]] They fly away as an eagle toward heaven. The same bird in both passages, flying in opposite directions - up, as the proud man's nest; away, as the money he thought was his.

THE BRIGHT LINE, and keep it: a market rank is not a verdict on worth, and it is not a verdict on righteousness either. A high valuation does not prove Yahweh's favor, and a low one does not prove His displeasure. We are not reading the stock pages as Scripture. We are refusing to read them as a scoreboard of value, which is the thing a reader is tempted to do every single day.`,

  `MOVEMENT FOUR: LET ANOTHER MAN PRAISE THEE. The issue opened with an anecdote rather than a number, and it belongs in this hour. An heir to a large eyewear company spoke on a podcast, boasted about what he owned and about his conquests, joked about his debts, and then declared in later interviews that he should be running the family empire instead of the chief executive his late father had chosen - calling that man a caretaker and accusing him of failing to plan a succession. The company replied that the statements were unfounded and damaging and that succession is handled by the board. We did not check his figures or his quotations; this is the digest's account, and it is used here as an illustration of a pattern Scripture names, not as established fact about a living man.

The pattern is named in one verse: [[Proverbs 27:2]] Let another man praise thee, and not thine own mouth. The ban is not on being praised. It is on being the one who does it. And the reason is practical, not merely polite - praise from your own mouth establishes nothing, because you are one witness about yourself.

Solomon gives the same teaching as a seating instruction, and it is kinder than it looks: [[Proverbs 25:6]] [[Proverbs 25:7]] Better it is that it be said unto thee, Come up hither, than that thou shouldest be put lower. Better to be called up than to be moved down. The man who seats himself at the top has given somebody else the job of correcting him in public.

On inheritance in particular, there is a verse that the whole anecdote sits inside: [[Proverbs 20:21]] An inheritance may be gotten hastily at the beginning; but the end thereof shall not be blessed. Hastily. The speed is the problem, not the inheriting. And on announcing tomorrow: [[Proverbs 27:1]] Boast not thyself of to morrow, for thou knowest not what a day may bring forth. James says the same thing about business planning in particular and uses a hard word for it: [[James 4:16]] All such rejoicing is evil.

THE COUNTERWEIGHT, so this does not become a rule that silences every complaint. A real grievance about a succession is not sin to raise. Scripture protects the first speaker and then checks him: [[Proverbs 18:17]] He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him. The problem with the podcast is not that an heir had a concern. It is that he was first in his own cause, loudly, in the one forum where nobody could search him.`,

  `MOVEMENT FIVE: THERE WAS NO SMITH FOUND IN ALL THE LAND. The second item in the issue is the one this course has been circling for a year. A defense firm and a chipmaker announced an American-designed and American-assembled laptop. The reason they gave is worth quoting as they gave it: decades of offshoring, in the press release's words, have left America dependent on foreign manufacturers for the computers and components that power everything from personal devices to critical government infrastructure, and they call that a national security issue.

Scripture has that exact condition on record, and it is one of the most chilling administrative details in the Old Testament: [[1 Samuel 13:19]] No smith found throughout all the land of Israel. And the reason, stated by the people who arranged it: Lest the Hebrews make them swords or spears. Not a trade policy. A disarmament strategy, carried out through metalworking.

What followed is the part nobody plans for: [[1 Samuel 13:20]] All the Israelites went down to the Philistines to sharpen every man his share, and his coulter, and his axe, and his mattock. They had to go to the people who intended to fight them to get their FARM TOOLS sharpened. And they were charged for it: [[1 Samuel 13:21]] And the result on the day it mattered: [[1 Samuel 13:22]] Neither sword nor spear found in the hand of any of the people. Two men in the whole army had a weapon.

Moses had already described the condition as a curse, and he described it in terms of borrowing rather than of weapons: [[Deuteronomy 28:43]] [[Deuteronomy 28:44]] He shall lend to thee, and thou shalt not lend to him. He shall be the head, and thou shalt be the tail. A nation that must go abroad to have its tools made is the tail of the nation that makes them, whatever its share price says.

NOW THE FIGURES, and they are the honest shape of the problem rather than its solution. Checked on two independent roads, domestic output of computer and electronic products grew about 2.8 percent across a year in which imports of the same category rose about 29 percent. And checking made the point LARGER than the digest did: computer and electronics is the single largest category of low-cost-country imports in that report, around 453 billion dollars, about 44 percent of the total. The laptop that was announced is a prototype line aimed at government, defense and first responders, with an American-and-allied component target around 90 percent and a fully domestic chain named as a long-term goal rather than a present fact; the digest stated that 90 percent as something already true of the prototypes, and that did not survive checking. The chips-from-Arizona detail is attributed to a chief executive by way of a newspaper report, and the company's own written announcement names neither the foundry nor the state. We could not read that announcement; the host refused us. One laptop against 453 billion dollars is a seed, and it should be called a seed.

THE COUNTERWEIGHT, and it matters, because the Word does not teach economic isolation. When Solomon built the house of Yahweh he hired foreign craftsmen on purpose and said plainly why: [[1 Kings 5:6]] There is not among us any that can skill to hew timber like unto the Sidonians. He asked for the man by name: [[2 Chronicles 2:7]] Send me now therefore a man cunning to work. Trading with a neighbor nation for skill you do not have is not sin; it is wisdom, and Scripture records Yahweh's own house being built that way. The curse in Deuteronomy is not about buying from a neighbor. It is about being UNABLE to make the thing yourself, so that the neighbor decides whether you may have it.`,

  `MOVEMENT SIX: BE THOU DILIGENT TO KNOW THE STATE OF THY FLOCKS. The third item is a beverage company's quarter, and it is the quietest item in the issue and the one closest to a household. Volume at home was flat while volume everywhere else grew. The company's own explanation, attributed to its leaders and not asserted by us, is that a holiday week landed in the previous quarter. Checked independently, the margin figures held - about 33.4 percent reported against 32.0 percent the year before - and the checking SOFTENED the headline rather than sharpening it, because income from the home market actually rose about 5 percent even with volume flat. A home market whose income grew is not a dying home market. Say the number the way the number reads.

But the shape is still worth the hour, because Scripture has a short, exact instruction about it: [[Proverbs 27:23]] Be thou diligent to know the state of thy flocks, and look well to thy herds. Diligent to KNOW. Not to grow - to know. And the reason is given in the next verse, which is the whole argument against assuming the near ground will hold: [[Proverbs 27:24]] Riches are not for ever.

What it looks like when a man stops looking is described in one of the most visual passages in Proverbs: [[Proverbs 24:30]] I went by the field of the slothful, and by the vineyard of the man void of understanding. And the state of it: [[Proverbs 24:31]] It was all grown over with thorns, and nettles had covered the face thereof, and the stone wall thereof was broken down. Nobody tore that wall down. It fell because nobody walked the fence.

And the household version, stated by Paul with a severity that surprises people: [[1 Timothy 5:8]] If any provide not for his own, and specially for those of his own house, he hath denied the faith, and is worse than an infidel. Growth abroad does not discharge the duty at the near end of the table. The far market is easier to be excited about and the near one is the one you are accountable for.

So the question the quarter asks a household is not about soft drinks. It is this: what has been growing in the part of your life that is far away and visible, while the part that is near and yours has been merely flat - and when did you last walk that fence on purpose.`,

  `MOVEMENT SEVEN: MY POWER AND THE MIGHT OF MINE HAND. Pull the four items together and one temptation is common to all of them: the belief that the house that is first got there by its own arm. Moses put that sentence in a man's mouth before the man could say it, and then answered it: [[Deuteronomy 8:17]] My power and the might of mine hand hath gotten me this wealth. And the correction: [[Deuteronomy 8:18]] Thou shalt remember the LORD thy God: for it is He that giveth thee power to get wealth. Note what He does not say. He does not say the power was imaginary or the work unreal. He says the capacity to produce was itself a gift, which is a far harder thing to accept than being told you failed.

Jeremiah turns it into a ranked list of the three things men actually boast in, and strikes all three: [[Jeremiah 9:23]] Let not the wise man glory in his wisdom, neither let the mighty man glory in his might, let not the rich man glory in his riches. Intelligence, strength, money - the exact three a technology league table measures. And then the one permitted boast: [[Jeremiah 9:24]] But let him that glorieth glory in this, that he understandeth and knoweth me.

Solomon then removes the last comfort, which is the belief that at least the ranking is FAIR: [[Ecclesiastes 9:11]] The race is not to the swift, nor the battle to the strong, neither yet bread to the wise. That is not cynicism and it is not an excuse to stop running. It is the removal of the idea that the outcome is a clean readout of the merit. One company spent enormously and led. Another spent comparatively little on the same race, leaned on somebody else's model, sold hardware, and traded places with the leader anyway. The digest noticed that and said so. Scripture said it first and said why.

And Jesus added the sentence that makes it personal rather than economic: [[Luke 12:15]] A man's life consisteth not in the abundance of the things which he possesseth. Consisteth. The word is about what a life is MADE OF. Not about how much is allowed.`,

  `MOVEMENT EIGHT: WHAT HAST THOU IN THE HOUSE. So what does a household do on a Wednesday morning, holding none of these companies, deciding none of these supply chains. The Word's answer is a question, and it is asked by a prophet to a widow with creditors at the door: [[2 Kings 4:2]] What hast thou in the house? And she answered that she had nothing, save a pot of oil. The nothing was wrong. The oil was the beginning. Yahweh starts with what is in the house, and the first act of sovereignty is to go and look.

The promise that direction points at is not an empire. It is a man on his own ground: [[Micah 4:4]] They shall sit every man under his vine and under his fig tree; and none shall make them afraid. That is the sovereign picture this course keeps returning to. Not owning the foundry. Having a vine.

Paul's instruction in the same register is deliberately unimpressive, and it is the practical answer to a week of enormous numbers: [[1 Thessalonians 4:11]] Study to be quiet, and to do your own business, and to work with your own hands. And the stated aim of it: [[1 Thessalonians 4:12]] That ye may walk honestly toward them that are without, and that ye may have lack of nothing. Work with your own hands. In a season when a nation has discovered it cannot make a laptop, that line stops being quaint.

Then the engine, which is not the arm: [[Zechariah 4:6]] Not by might, nor by power, but by my spirit, saith the LORD of hosts. And the division of labor Paul draws in the field: [[1 Corinthians 3:7]] Neither is he that planteth any thing, neither he that watereth; but God that giveth the increase. So we plant and water - genuinely, with real hands, on real ground - and the increase is His office, not ours.

Which is where the planning goes: [[Proverbs 16:3]] Commit thy works unto the LORD, and thy thoughts shall be established. And the final word on the league table, one line long: [[Psalm 115:3]] He hath done whatsoever He hath pleased.

AND THE ONE WHO IS ACTUALLY FIRST. All of this has a person at the end of it, not a principle. He is Jesus, the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne is for ever and ever, [[Hebrews 1:8]] and by whom all things consist. [[Colossians 1:17]] He did not compete for the first place. He had it, and He came down through every rank there is to the lowest room in the house, and was given the Name above every name. That is what being first looks like when Yahweh does the ranking.

GO BACK INTO THE TEXT. Read Psalm 75 whole this week, then Luke 22:24-27, then 1 Samuel 13:19-22. Read them in that order and watch one question travel from the throne, to the table, to the forge.

${BLOCKED}

${TALK.lesson}`,
];

// -----------------------------------------------------------------------------
// The four bands. Each is written FOR ITS OWN READER, carries the thirteen
// threads itself, and quotes the Word itself - because a reader reads ONE band.
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.

Here is our lesson for today. It is about who gets to be first.

WHO SENT IT. Darrell got an email about money and big companies. He sent it to us. On the top he typed one word. The word was Lessons. That word is the job. The email is just the reason we are here. The email came on the twenty-eighth of October. We built this sixteen days later. We say that out loud. We do not hide it.

THE VERSE FIRST. The Word of Yahweh goes first here. Not the news. A man named Asaph wrote a song. He said this. [[Psalm 75:6]] Look at it. Not the east. Not the west. Not the south. So where does it come from? The next line tells us. [[Psalm 75:7]] God is the judge. He puts one down. He lifts one up.

Promotion is a big word. It means going up. It means getting a better spot. The song says Yahweh hands it out. Not you. Not me. Not a man.

A man named Daniel said the same thing. [[Daniel 2:21]] He takes kings down. He sets kings up. And he said it again. [[Daniel 4:17]] The most High rules. He gives it to who He wants.

A mom named Hannah sang it too. [[1 Samuel 2:7]] He makes poor. He makes rich. He brings low. He lifts up. And she sang this. [[1 Samuel 2:8]] He takes a poor man out of the dust. He sets him with princes.

WHAT THE NEWS SAID. Two big companies are very big. One is first. Then the other one is first. Then they trade again. They go back and forth. The news said they move by huge amounts of money.

JESUS SAW THIS FIGHT. His friends had this fight. They had it at supper. [[Luke 22:24]] They wanted to know who was the greatest one. At supper. With Jesus right there.

Jesus did not yell. He turned it around. [[Luke 22:25]] That is how the world does it. Then He said this. [[Luke 22:26]] Be like the young one. Be the one who serves. Then He pointed at Himself. [[Luke 22:27]] I serve you.

Mark wrote it down too. [[Mark 10:43]] [[Mark 10:44]] Be the servant of all. And here is why. [[Mark 10:45]] Jesus came to serve. He gave His life for many. Paul said it short. [[Philippians 2:3]] Think more of the other one.

So the fight is not new. It is old. The companies just do it with big money.

A HARD VERSE. Jesus said one thing that is hard. [[Luke 16:15]] What men think is best is not best to Yahweh. Men count what a thing is worth. They add it up. That count is not Yahweh's count.

Isaiah said it this way. [[Isaiah 2:11]] Tall looks get brought down. The LORD alone is lifted up. He said it again. [[Isaiah 2:12]] And again. [[Isaiah 2:17]] One name is left standing. It is not a company.

A man named Obadiah said this. [[Obadiah 1:3]] Pride tricks you. And then. [[Obadiah 1:4]] You can build your nest in the stars. He can still bring you down.

Money can go fast too. [[Proverbs 23:5]] It flies off like a bird.

HOLD THIS LINE. Being first in money is not a gold star from Yahweh. Being last is not a bad mark. We do not read the money list like it is the Word. We just will not treat it like a score of who is good.

A MAN WHO BRAGGED. The email had a story. A rich man's son talked on a show. He bragged. He said he should run the family company. Not the man his dad picked. The company said he was wrong. We did not check his story. So we tell you that. It is their story, not our fact.

The Word has a verse for it. [[Proverbs 27:2]] Let someone else say you are good. Not your own mouth.

And here is a seat rule. [[Proverbs 25:6]] [[Proverbs 25:7]] It is better to be called up. It is worse to be moved down.

And about getting money fast from your family. [[Proverbs 20:21]] Fast is the problem. And about tomorrow. [[Proverbs 27:1]] You do not know what tomorrow holds. James said this. [[James 4:16]] That kind of bragging is bad.

BUT WAIT. It is not wrong to say a true thing is wrong. The Word is fair. [[Proverbs 18:17]] The first one to talk sounds right. Then the next one checks him. The son had a real worry. He just said it where no one could check him.

NO SMITH IN THE LAND. Here is the big one. A smith is a man who makes metal things. He makes a sword. He makes a tool. He fixes them too.

One day Israel had none. [[1 Samuel 13:19]] No smith in the whole land. Why? So they could not make swords.

So they had to walk to the people who hated them. [[1 Samuel 13:20]] They went to get their farm tools sharp. And they had to pay. [[1 Samuel 13:21]] Then came the day of the fight. [[1 Samuel 13:22]] Almost no one had a sword. Two men did. That is all.

Moses said this would feel like a curse. [[Deuteronomy 28:43]] [[Deuteronomy 28:44]] He lends to you. You do not lend to him. He is the head. You are the tail.

THE NEWS AGAIN. Two firms want to make a laptop here. They said we have sent the work away too long. They said we cannot make our own computers now.

We checked some numbers. Making these things here grew by about 2.8 percent in a year. Buying them from far away grew by about 29 percent. And here is more. That kind of thing is the biggest thing we buy from far away. It is about 453 billion dollars. The news said the first laptop is almost all made here, about 90 percent. We checked that. It is a goal, not a fact yet. So we say goal. And the laptop is one laptop. It is a seed. We call it a seed.

BUT HOLD THIS LINE TOO. Buying from a far land is not a sin. King Solomon hired men from Lebanon. He said why. [[1 Kings 5:6]] They were better at wood than his men. He asked for one by name. [[2 Chronicles 2:7]] So trade is fine. The bad part is when you cannot make it at all. Then they pick if you get it.

KNOW YOUR OWN FLOCK. The email had one more story. A drink company grew in far lands. At home it stayed flat. They said a holiday week moved. We checked. The money at home still went up about 5 percent. So we say it that way. Flat is not dead.

But the Word has a rule here. [[Proverbs 27:23]] Know your flock. Look at your herd. Know it. And why? [[Proverbs 27:24]] Money does not last for ever.

Here is what it looks like when you stop looking. [[Proverbs 24:30]] A man walked by a lazy man's field. And he saw this. [[Proverbs 24:31]] Weeds. Thorns. And the wall was down. No one knocked it down. It just fell. No one walked the fence.

And for a home. [[1 Timothy 5:8]] Take care of your own house first.

NOT MY OWN ARM. Moses said men would say one thing. [[Deuteronomy 8:17]] My hand got me this. Then he said the truth. [[Deuteronomy 8:18]] Yahweh gives you the power to get it.

Jeremiah named three brags. [[Jeremiah 9:23]] Smart. Strong. Rich. Do not brag in those. Brag in one thing. [[Jeremiah 9:24]] That you know Him.

And the race is not always fair. [[Ecclesiastes 9:11]] The fast one does not always win. Jesus said this too. [[Luke 12:15]] Your life is not made of your stuff.

WHAT IS IN YOUR HOUSE. A man of Yahweh met a sad woman. She owed money. He asked her one thing. [[2 Kings 4:2]] What do you have in the house? She said just a pot of oil. The oil was enough to start.

So go look. See what you have. That is step one.

And here is the picture Yahweh gives. [[Micah 4:4]] Every man sits under his own vine. No one scares him.

Paul said a quiet thing. [[1 Thessalonians 4:11]] Be quiet. Do your own work. Use your own hands. And why. [[1 Thessalonians 4:12]] So you lack nothing.

And the power is not your arm. [[Zechariah 4:6]] Not by might. By His spirit. Paul said who makes things grow. [[1 Corinthians 3:7]] God gives the increase. So plant. Water. He grows it.

Give Him your plans. [[Proverbs 16:3]] And one last line. [[Psalm 115:3]] He does what He wants.

WHY WE SAY THE HARD PART OUT LOUD. We try to check every number we tell you. We go find who said it first. Four of those places would not let us in. We tried. The door stayed shut. So we wrote the shut doors down on this page. We put a date on them too. We will go back and try again.

Here is why that matters. A shut door is not a fact. If we hid the shut door, you would think we checked. That would be a lie with no words in it. So we say it plain. Some numbers we could not check at the source. The ones we could check, we checked twice.

And one more rule. If a true thing is better than we thought, we say that too. We do not make a good thing sound small. That is also a lie. Both ways are lies. We tell it the way it is.

ONE MORE THING TO SEE. Look at all four of the stories again. A big company first. Then a man who bragged. Then a land with no smith. Then a field no one checked. They look like four stories. They are one story. Each one asks the same thing. Who is first, and who says so?

And here is a thing to try this week. Pick one tool in your home. It can be small. A zipper. A bike chain. A loose screw. Ask a grown-up to show you how to fix it. Then fix it. That is a small smith in your house. Yahweh starts small. He started with one pot of oil.

WHO IS REALLY FIRST. Jesus is first. He is the Lamb of Yahweh. [[John 1:29]] He is the Son the Father gave. [[John 3:16]] His seat lasts for ever. [[Hebrews 1:8]] All things hold together in Him. [[Colossians 1:17]] He did not fight for first. He had it. He came all the way down. Then the Father gave Him the best name. That is what first looks like.

${BLOCKED}

${TALK.child}`;

const YOUTH = `${TITLE}.

This is our lesson, and it asks one question. Who decides who is first?

WHO SENT IT. On the twenty-eighth of October Darrell forwarded a business newsletter out of his work mailbox. At the top he typed one word: Lessons. That word is the ask. The newsletter is only the reason we are here. Sixteen days went by between his word and this build, and we leave that on the record instead of tidying it up.

THE WORD GOES FIRST, NOT THE NEWS. A song writer named Asaph settled this a long time ago. [[Psalm 75:6]] Read the list. East. West. South. He leaves one out, and he leaves it out on purpose, because the answer is not a direction at all. Here it is. [[Psalm 75:7]] God is the judge. He puts one down. He sets another up.

Promotion means moving up to a better place. The song says Yahweh hands it out. Nobody else does.

Daniel said the same thing twice. Once about time and rulers. [[Daniel 2:21]] He removes kings. He sets up kings. And once as plainly as the book ever gets. [[Daniel 4:17]] The most High rules in the kingdom of men. He gives it to whoever He wants.

Hannah sang it over a baby, and she put rich and poor in the same hand. [[1 Samuel 2:7]] He makes poor. He makes rich. And then. [[1 Samuel 2:8]] He lifts a poor man out of the dust and sits him with princes.

WHAT THE NEWSLETTER SAID. Two huge companies keep swapping the first and second spots in the world by what they are worth. The writer said they go back and forth, moving hundreds of billions of dollars at a time. So the fight is not about being big. Both are enormous. The fight is about which one is counted first.

JESUS WATCHED THIS EXACT ARGUMENT. It happened at the last supper. [[Luke 22:24]] Which of them should be accounted the greatest. Not who was greatest. Who would be RECKONED greatest. It is a ranking argument, and His closest friends were having it over dinner.

He did not tell them to stop wanting something. He moved what they should want. First He described the world honestly. [[Luke 22:25]] Then He cut it off. [[Luke 22:26]] The greatest acts like the younger. The chief acts like the one who serves. Then He used Himself as the measure. [[Luke 22:27]] I am among you as he that serveth.

Mark wrote it too, and added the cost. [[Mark 10:43]] [[Mark 10:44]] Servant of all. And why it is not an act. [[Mark 10:45]] He gave His life a ransom for many. Paul put the household version in one line. [[Philippians 2:3]] Esteem the other person better than yourself.

So the companies are not doing something new. They are doing what the disciples did at the table, with a scoreboard attached.

THE HARD SENTENCE. Jesus said this to men who were confident about their standing. [[Luke 16:15]] What is highly esteemed among men is abomination in the sight of God. Esteem is the word to watch. A company's value is esteem added up - what people will pay to be attached to it. Jesus did not call esteem worthless. He said the top of the human list and His own sight do not agree.

Isaiah stretched that over a whole day. [[Isaiah 2:11]] Lofty looks get humbled, and the LORD alone is exalted. He named how. [[Isaiah 2:12]] And he said the conclusion again. [[Isaiah 2:17]] One name is left standing at the end of the list, and it is not a corporation.

Obadiah wrote two lines that read like they were made for a league table. [[Obadiah 1:3]] Pride deceived you. Then the altitude and the fall. [[Obadiah 1:4]] Build your nest among the stars. The verb at the end is still His.

And money moves fast. [[Proverbs 23:5]] It flies away like an eagle.

HOLD THE LINE. A market rank is not a verdict on worth, and it is not a verdict on righteousness. A big number does not prove Yahweh is pleased. A small one does not prove He is not. We are not reading the stock pages like Scripture. We are refusing to read them like a scoreboard of who is good.

A MAN WHO PRAISED HIMSELF. The issue opened with a story instead of a number. An heir to an eyewear company went on a podcast, bragged about what he owned, joked about his debt, and then said in interviews that he should be running the company instead of the chief executive his late father had picked. He called that man a caretaker. The company said the claims were unfounded and damaging. We did not check his figures or his quotes, so we tell you that plainly. It is the newsletter's account and we use it as an illustration, not as a fact about a living man.

The Word names the pattern in one verse. [[Proverbs 27:2]] Let another man praise you, not your own mouth. The rule is not against being praised. It is against being the one who does it, and the reason is practical. You are one witness about yourself, and one witness establishes nothing.

Solomon turned it into a seating rule, and it is kinder than it sounds. [[Proverbs 25:6]] [[Proverbs 25:7]] Better to be told come up here than to be moved lower. If you seat yourself at the top, you have handed somebody else the job of correcting you in public.

On inheritance in particular. [[Proverbs 20:21]] Getting it hastily is the problem. On announcing tomorrow. [[Proverbs 27:1]] You do not know what a day will bring. James used a hard word for the business version. [[James 4:16]] All such rejoicing is evil.

THE COUNTERWEIGHT. A real complaint about a succession is not a sin to raise. Scripture protects the first speaker and then checks him. [[Proverbs 18:17]] The first in his own cause seems right, until his neighbor searches him. The problem was not that the heir had a concern. It was that he was first in his own cause, loudly, where nobody could search him.

THERE WAS NO SMITH IN THE LAND. Here is the item this course has circled all year. A defense company and a chipmaker announced an American-designed and American-assembled laptop. Their stated reason is worth hearing as they said it: decades of sending the work overseas left the country depending on foreign makers for the computers and parts that run everything from phones to government systems, and they call that a security problem.

Scripture has that exact condition on file, and it is chilling. [[1 Samuel 13:19]] No smith found in all the land of Israel. And the reason, given by the people who arranged it: so the Hebrews could not make swords or spears. That is not a trade policy. That is disarmament through metalwork.

Then came the part nobody plans for. [[1 Samuel 13:20]] They had to walk down to the people who meant to fight them just to get their farm tools sharpened. And they paid for it. [[1 Samuel 13:21]] And on the day it mattered. [[1 Samuel 13:22]] Neither sword nor spear in the hand of any of the people. Two men in the whole army had one.

Moses had already described the condition, and he described it as borrowing rather than as weapons. [[Deuteronomy 28:43]] [[Deuteronomy 28:44]] He lends to you and you do not lend to him. He is the head. You are the tail.

THE FIGURES, CHECKED. On two independent roads, domestic output of computer and electronic products grew about 2.8 percent in a year when imports of the same category rose about 29 percent. And checking made the point bigger than the newsletter made it: that category is the single largest group of low-cost-country imports in the report, about 453 billion dollars, around 44 percent of the total. The laptop is a prototype line aimed at government, defense and first responders, with a target near 90 percent American and allied parts and a fully domestic chain named as a long-term goal, not a fact today. One laptop against 453 billion dollars is a seed. Call it a seed.

THE SECOND COUNTERWEIGHT. The Word does not teach cutting yourself off from your neighbors. When Solomon built the house of Yahweh he hired foreign craftsmen on purpose and said why. [[1 Kings 5:6]] Nobody among us can work timber like the Sidonians. He asked for a man by name. [[2 Chronicles 2:7]] Trading for skill you do not have is wisdom, and Yahweh's own house was built that way. The curse in Deuteronomy is not about buying from a neighbor. It is about not being able to make it yourself, so the neighbor decides whether you get it.

KNOW THE STATE OF YOUR FLOCKS. The quietest item was a beverage company's quarter. Volume at home was flat while it grew everywhere else. The company said a holiday week landed in the prior quarter, and that is their explanation, not our claim. We checked the margins and they held - about 33.4 percent against 32.0 percent the year before - and the checking actually softened the headline, because income from the home market still rose about 5 percent even with volume flat. Say it the way it reads. Flat is not dying.

The Word has a short instruction for this. [[Proverbs 27:23]] Be diligent to KNOW the state of your flocks. Not to grow them. To know them. And the reason comes next. [[Proverbs 27:24]] Riches are not for ever.

What it looks like when a man stops looking is one of the most visual passages in Proverbs. [[Proverbs 24:30]] He walked by the field of the slothful. And here is the state of it. [[Proverbs 24:31]] Thorns, nettles, and the stone wall broken down. Nobody knocked that wall over. It fell because nobody walked the fence.

And the household version, which Paul states harder than people expect. [[1 Timothy 5:8]] Provide for your own, especially your own house.

NOT THE MIGHT OF MY OWN HAND. One temptation runs through all four stories: the belief that whoever is first got there by his own arm. Moses put the sentence in a man's mouth before he could say it. [[Deuteronomy 8:17]] My power and the might of my hand got me this. Then the correction. [[Deuteronomy 8:18]] He gives you the power to get wealth. Notice He does not say the work was fake. He says the ability to produce was itself a gift.

Jeremiah listed the three things men actually boast in and struck all three. [[Jeremiah 9:23]] Wise, mighty, rich. Those are the exact three a technology ranking measures. Then the one boast allowed. [[Jeremiah 9:24]] That you understand and know Him.

And Solomon removed the last comfort, which is the idea that the ranking is at least fair. [[Ecclesiastes 9:11]] The race is not to the swift. One company spent enormously and led. Another spent far less on the same race, used somebody else's model, sold hardware, and traded places with the leader anyway. The newsletter noticed that. Scripture said it first and said why. Jesus made it personal. [[Luke 12:15]] A man's life does not consist in what he owns.

WHAT IS IN YOUR HOUSE. A prophet met a widow with creditors at the door and asked her one question. [[2 Kings 4:2]] What do you have in the house? She said nothing, except a pot of oil. The nothing was wrong. The oil was the start. Yahweh begins with what is already in the house, and the first act of sovereignty is going to look.

The promise that points at is not an empire. [[Micah 4:4]] Every man under his own vine and his own fig tree, and nobody making him afraid.

Paul's instruction is deliberately unimpressive. [[1 Thessalonians 4:11]] Be quiet, mind your own business, work with your own hands. And the aim. [[1 Thessalonians 4:12]] That you lack nothing. In a year when a country found out it cannot make a laptop, that line stops sounding old-fashioned.

Then the engine, which is not your arm. [[Zechariah 4:6]] Not by might, nor by power, but by My spirit. And the division of labor. [[1 Corinthians 3:7]] God gives the increase. So we plant and water with real hands, and the growing is His job.

Which is where planning goes. [[Proverbs 16:3]] Commit your works to Him. And the last word on the league table, one line long. [[Psalm 115:3]] He has done whatever He pleased.

WHO IS ACTUALLY FIRST. There is a person at the end of this, not a principle. He is Jesus, the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne is for ever and ever, [[Hebrews 1:8]] and by whom all things consist. [[Colossians 1:17]] He never competed for first place. He held it, came down through every rank there is, and was given the Name above every name. That is what first looks like when Yahweh does the ranking.

GO BACK INTO THE TEXT. Read Psalm 75 whole this week. Then Luke 22:24-27. Then 1 Samuel 13:19-22. In that order, and watch one question travel from the throne, to the table, to the forge.

${BLOCKED}

${TALK.youth}`;

const TEEN = `${TITLE}.

Start with one question and hold it the whole hour. Who hands out first place?

WHO SENT THIS. Darrell got a business newsletter at work. He forwarded it here on the twenty-eighth of October 2026, at 14:07 universal time. Over the top of it he typed one word: Lessons. That one word is the job. The newsletter is just the reason we met today. No article is the base of an hour in this course. Sixteen days passed between his word and this build. We leave that on the record. We do not tidy it up.

QUESTION ONE: WHO GIVES OUT RANK? Go to the Word before you go to the news. A man named Asaph wrote a song about it. [[Psalm 75:6]] Count the directions. East. West. South. He skips one on purpose. The north is missing because the answer is not a place on a map. Here is the answer. [[Psalm 75:7]] God is the judge. He puts one down. He sets one up.

Promotion means moving up a level. This song hands that job to Yahweh alone rather than to any committee, any market, or any person who happens to be holding the clipboard.

Daniel says the same thing about rulers. He says it twice. [[Daniel 2:21]] Kings are removed and kings are established. Both verbs belong to Yahweh. Then he states it without any decoration at all. [[Daniel 4:17]] The most High rules over the kingdom of men and gives it to whoever He wants. It is not always the person who earned it most and not necessarily the fastest competitor in the field.

Hannah sang the same doctrine over her baby boy generations earlier, and she on purpose put poverty and wealth inside the same hand. [[1 Samuel 2:7]] Then she stretched it across the entire social arrangement. [[1 Samuel 2:8]] A poor man gets pulled out of the dust and seated next to princes. That is unsettling if you have assumed that position always follows performance.

So the frame is established before a single figure gets spoken aloud. A published list of the biggest companies is a photograph showing where Yahweh now has them standing. It is not a grade on anybody's character.

WHAT THE NEWSLETTER SAID. Two giant companies keep swapping first and second place in the world, and the writer described them bouncing back and forth while hundreds of billions of dollars moved each time. Read that again carefully, because neither participant is small. The entire fight is about which one gets counted first.

QUESTION TWO: IS THAT FIGHT NEW? No, it is ancient, and it broke out in the least appropriate room imaginable. [[Luke 22:24]] They wanted to know which of them would be counted the greatest. They wanted to know it at the last supper, after the bread and after the cup, with the betrayal already named at that very table.

Jesus did not destroy their ambition; He moved it. He first described how the world arranges these things, without pretending otherwise. [[Luke 22:25]] Then He severed it. [[Luke 22:26]] Whoever is greatest acts like the youngest. And whoever is chief acts like the one serving at the table. Then He identified Himself as the measure. [[Luke 22:27]]

Mark wrote it too and attaches the price to it. [[Mark 10:43]] [[Mark 10:44]] Servant of all, which is not a figure of speech. And here is the reason it is not merely attractive humility. [[Mark 10:45]] He gave His life as a ransom for many. Paul put the home version in one line. [[Philippians 2:3]]

So ranking is entirely real inside Yahweh's economy; it simply runs in the opposite direction, downward instead of upward.

Think about the places you feel this already: a class rank, a follower count, a spot on a team, a published list of everybody who got picked. The scoreboard keeps changing. The argument underneath it is the same one.

QUESTION THREE: WHAT IS A COMPANY WORTH? Jesus said one sentence that converts a dollar figure into a spiritual object. [[Luke 16:15]] Watch the word esteem, which means whatever people now think a thing is worth. A company's market value is exactly that, added up - a count of what buyers will pay in order to be associated with it.

Jesus did not announce that esteem means nothing. He announced that the summit of the human list and His own assessment do not agree, and He selected the heaviest available vocabulary to announce it.

Isaiah widens that same truth across an entire appointed day. [[Isaiah 2:11]] Proud looks get lowered while the LORD alone gets raised. He identifies the way it happens. [[Isaiah 2:12]] Then he says again the conclusion. The conclusion carries the burden of the chapter. [[Isaiah 2:17]] Exactly one name remains standing on the final list, and it will not be a brand.

Obadiah packs it into two lines that could have been written for a published ranking page. [[Obadiah 1:3]] The deception arrives first, then the altitude, then immediately the descent. [[Obadiah 1:4]] Put the nest among the stars if you want to; the last verb still belongs to Him.

Money leaves fast too, and Solomon uses the same bird travelling the opposite direction. [[Proverbs 23:5]]

HOLD THIS LINE, AND DO NOT LET IT GO. A market rank is not a ruling on worth, and it is not a ruling on who is righteous either. An impressive number does not show that Yahweh is pleased, and a disappointing number does not show that He is displeased. We are not treating the financial pages as Scripture; we are simply refusing to treat them as a scoreboard of who is good.

QUESTION FOUR: WHO SHOULD SAY YOU ARE GOOD? The issue opened with a story instead of a statistic. An heir to a big eyewear company went on a podcast, boasted about his things he owned, and made jokes about his debts. Then he informed interviewers that he, rather than the chief executive his late father had picked himself, ought to be running the family firm, and he called that man as a caretaker. The company said the claims were untrue and damaging. We did not check his numbers or his quotes, so we say that plainly: this is the newsletter's account, used as an illustration of a pattern, and not as a fact about a living man.

The Word identifies the pattern in a single verse. [[Proverbs 27:2]] Somebody else supplies the praise, and not your own mouth. The ban is not against being praised; it is against being the source of the praise. The reason is practical, not polite. You are one witness regarding yourself and one witness establishes nothing.

Solomon delivers it as a seating arrangement, and it is much kinder than it initially sounds. [[Proverbs 25:6]] [[Proverbs 25:7]] Preferable to be waved toward the front than to be publicly walked backward. Seat yourself at the head of the table and you have just hired somebody else to correct you in front of witnesses.

On money arriving quickly through a family. [[Proverbs 20:21]] The speed is the flaw, not the inheriting. On announcements about tomorrow. [[Proverbs 27:1]] You genuinely do not know what a single day will produce. James applied an uncomfortably strong word to the commercial version. [[James 4:16]]

NOW THE COUNTERWEIGHT. A genuine complaint about who leads is not sinful to raise. The Word guards the first speaker and then checks him. [[Proverbs 18:17]] Whoever speaks first appears justified until the other side gets searched. The heir's difficulty was never that he harbored a worry; the difficulty was that he aired it in the single venue where nobody was able to search him.

QUESTION FIVE: WHO MAKES YOUR TOOLS? Here is the item this course keeps coming back to. A defense firm and a chip firm announced a laptop designed and put together in America. Their stated reason is worth hearing as they said it. Decades of sending the work overseas left the country leaning on foreign makers for the computers and parts that run everything from phones to government systems. They call that a security problem.

The Word has that exact setup on file, and it is cold reading. [[1 Samuel 13:19]] No smith was found anywhere in Israel, and a smith is the man who works the metal, forges the blade, and fixes the blade. The motive is stated in the verse by the people who set it up, so that the Hebrews could not make swords or spears. That is not a tariff plan; that is disarming a nation through the forge.

Then came the part nobody expects. [[1 Samuel 13:20]] They walked down to the people intending to fight them, simply to get farm tools sharpened - a plow blade, a plow point, an axe, a hoe - and they were billed for the service. [[1 Samuel 13:21]] On the day of the actual battle, here is the count. [[1 Samuel 13:22]] Two men in the entire army had a weapon.

Moses had already called that a curse, and he framed it as borrowing rather than as warfare. [[Deuteronomy 28:43]] [[Deuteronomy 28:44]] He lends to you while you do not lend to him, and he becomes the head while you become the tail. A country forced to go abroad in order to get its instruments made is the tail of the country making them. Its share price does not change that.

THE FIGURES, AND WHAT CHECKING DID. Two separate roads carried the same pair. Output of computers and electronics expanded about 2.8 percent during a year in which imports of that same category advanced about 29 percent. And the checking widened the observation beyond where the newsletter left it, because that category is the single largest group of low-cost-country imports in the report, about 453 billion dollars, or about 44 percent of the total.

The laptop is a prototype line for government, defense and first responders, carrying a target near 90 percent American and allied components, with a completely domestic chain identified as a long-range goal rather than a present fact. The newsletter presented that 90 percent as something already true of the prototypes, and checking did not hold up that reading. The detail about chips from Arizona reaches us from a chief executive by way of a newspaper report, and the company's own written notice does not name the plant or the state. One laptop against 453 billion dollars is a seed. Call it a seed.

THE SECOND COUNTERWEIGHT. The Word does not tell a nation to cut itself off from its neighbors. Solomon on purpose hired foreign craftsmen to build the house of Yahweh, and he said why. [[1 Kings 5:6]] Nobody in Israel could work timber like the men of Sidon. He asked for one by name. [[2 Chronicles 2:7]] Buying skill you really lack is wisdom, and Yahweh's own house was built exactly that way. The curse in Deuteronomy concerns neither trading nor neighbors; it concerns being not able to make the article at all, such that the neighbor determines whether you get one.

QUESTION SIX: WHEN DID YOU LAST LOOK? The quietest item in the issue was a drink company's quarter, where volume at home went flat while volume everywhere else expanded. The company said a holiday week landed in the quarter before, and that is their explanation rather than our claim. We checked the margins and they held, about 33.4 percent against 32.0 percent a year earlier, and the verification actually softened the headline instead of sharpening it, because income from the home market still rose about 5 percent even with volume flat. State the number the way the number reads, because flat is not dying, and under-claiming a true thing is a failure same in kind to over-claiming an unverified thing.

Still, the shape earns the hour, because the Word has a short order about it. [[Proverbs 27:23]] Be diligent to KNOW the state of the flocks. Not to grow them. To know them. The reason is in the next verse. [[Proverbs 27:24]] Riches do not last for ever.

Here is the picture of a man who stopped looking. [[Proverbs 24:30]] He walked past the field of a slothful man and the vineyard of a man void of understanding. This is the state he found. [[Proverbs 24:31]] Thorns throughout, nettles covering the surface, and the stone wall knocked flat. Nobody pushed that wall over; it collapsed because nobody walked the fence.

And the home version, which Paul says harder than people expect. [[1 Timothy 5:8]] Growth far away does not cover the duty close up.

QUESTION SEVEN: WHOSE ARM GOT YOU HERE? One pull runs through all four stories, and it is the belief that whichever house is in first place arrived there on its own strength. Moses put the line in a man's mouth before the man could say it himself. [[Deuteronomy 8:17]] Then he answered it. [[Deuteronomy 8:18]] It is He that gives you power to get wealth. Notice carefully what that does not say, because it does not call the work fake. It calls the ability to work a gift, which is much harder to accept than being told that you failed.

Jeremiah lists the three things men actually brag about and strikes all three. [[Jeremiah 9:23]] Wise. Strong. Rich. Those are the exact three a tech ranking measures. Then he leaves one brag standing. [[Jeremiah 9:24]] That you know Him.

Solomon takes the last comfort away. The last comfort is the idea that the ranking is at least fair. [[Ecclesiastes 9:11]] That is not an excuse to quit running. It just removes the idea that the result is a clean readout of who deserved it. One company spent huge and led. The other spent far less on the same race, borrowed somebody else's model, sold hardware, and traded places with the leader anyway. The newsletter noticed. The Word said it first, and said why.

Jesus made it personal. [[Luke 12:15]] Your life is not made out of your stuff.

QUESTION EIGHT: WHAT IS IN YOUR HOUSE? So what does a household do on a Wednesday morning? You own none of these firms. You decide none of these supply chains? The Word answers with a question, asked by a prophet to a widow with creditors at her door. [[2 Kings 4:2]] She said she had nothing, except a pot of oil. The nothing was wrong and the oil was the start, because Yahweh starts with whatever is already inside the house, and the first act of sovereignty is going to look.

The promise that points at is not an empire. [[Micah 4:4]] Every man under his own vine. Nobody scaring him. Not owning the factory. Having a vine.

Paul's instruction is on purpose unimpressive. [[1 Thessalonians 4:11]] Be quiet. Mind your own work. Use your own hands. And here is the stated objective. [[1 Thessalonians 4:12]] That you walk straight with outsiders and lack nothing. During a year when a country learned it cannot build a laptop computer, that instruction stops sounding old-fashioned.

Then the engine, which is emphatically not your arm. [[Zechariah 4:6]] Not by might, nor by power, but by His spirit. And the division of the labor. [[1 Corinthians 3:7]] God gives the increase. Therefore we plant and water with real hands on real ground. The growing is His job.

That is where plans go. [[Proverbs 16:3]] And here is the last word on the whole ranking, one line long. [[Psalm 115:3]]

QUESTION NINE: WHO IS ACTUALLY FIRST? A person, not a principle. He is Jesus, the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne lasts for ever, [[Hebrews 1:8]] and by whom all things hold together. [[Colossians 1:17]] He never raced for first place, because He already had it, and He came down through every rank in existence to the lowest seat in the house before being given the Name above every name. That is the appearance of being first when Yahweh does the ranking.

GO BACK INTO THE TEXT. Read Psalm 75 whole this week, then Luke 22:24-27, then 1 Samuel 13:19-22, in that order. Watch one question travel from the throne, to the table, to the forge.

${BLOCKED}

${TALK.teen}`;

const SENIOR = `${TITLE}.

You have lived long enough to have watched the answer to this hour's question several times already. So it is worth asking plainly. Who decides who is first?

WHO SENT THIS, AND WHEN. On the twenty-eighth of October 2026, at 14:07 by universal time, Darrell forwarded a daily business newsletter out of his university mailbox into this lane, and above the forwarded header he typed a single word: Lessons. That word is the ask, the newsletter is only the occasion, and no article is ever the foundation of an hour in this course. Sixteen days stood between his word and this build. This house does not smooth inconvenient intervals. The gap is recorded here rather than quietly rounded away. Both of the lane's witnesses agreed beforehand that the thread had not already been built: the thread itself carried no captured label, and the ledger sweep returned nothing found.

FOUR THINGS YOU HAVE ALREADY SEEN. The issue carried four items and an opening anecdote - two enormous companies exchanging the first and second places in the world by market value, a defense manufacturer and a chipmaker announcing an American-designed computer, a beverage corporation expanding abroad while its home market stood still, and an heir informing a podcast audience that he rather than his late father's appointed successor ought to be running the family business. Considered as commercial news, that is four unrelated stories. Considered through the Word, it is a single story told four different ways, and Scripture had already settled it generations before any exchange on earth rang a bell.

THE FIRST THING: PROMOTION IS NOT HANDED OUT BY MEN. Begin where the Word begins, because in this course the Word is both the foundation and the authority, and a psalm of Asaph lifts the whole question of who rises and who falls entirely out of human hands in a single stroke. [[Psalm 75:6]] Three compass directions are named deliberately, and the fourth is deliberately omitted, because the answer is not a direction at all. The following line supplies what the omission implies. [[Psalm 75:7]] God is the judge, and the judging consists in putting one down while setting another up, which means promotion arrives as a verdict rather than as a trophy. Those of you who have buried friends who were once considered indispensable have watched both halves of that verse execute on people whose names you still remember.

Daniel states the same government twice, once concerning the calendar and once concerning the chairs. [[Daniel 2:21]] Kings are removed and kings are established. The verbs belong to Yahweh in both directions. Then, in what may be the least decorated sentence in the whole book about who actually administers the world. [[Daniel 4:17]] The most High rules in the kingdom of men and gives it to whomsoever He will - not necessarily to the most deserving, nor to the quickest, nor to the best organized.

Hannah had sung the identical doctrine over a cradle long before Daniel wrote it down, and she deliberately placed poverty and wealth inside one hand. [[1 Samuel 2:7]] And having said that, she extended it across the entire social arrangement. [[1 Samuel 2:8]] A poor man is raised out of the dust and seated among princes. That is an unsettling sentence if you have spent a lifetime assuming that position follows performance.

So the frame is established before any figure is spoken aloud. A published league table of the most valuable houses on earth records nothing more than where Yahweh presently has them standing. It is a photograph rather than a judgment, and whoever occupies first position this particular Friday occupies it because He has not yet elected to put them down.

THE SECOND THING: THE RANKING QUARREL IS ANCIENT, AND IT HAPPENED AMONG FRIENDS. Hear the digest in its own words, because the writer genuinely observed something true: two companies have been moving back and forth between being the world's most valuable corporation and the world's second most valuable corporation, their valuations rising and collapsing by hundreds of billions of dollars at a stroke. Notice carefully what the contest is not about. Neither participant is small. The entire dispute concerns which of two enormous houses will be counted first.

Scripture preserves that precise scene, and it occurs in the least appropriate room imaginable. [[Luke 22:24]] A strife arose among them concerning which of them should be accounted the greatest. It arose at the last supper, after the bread and after the cup, with the betrayal already identified at the table. The operative word is accounted. The argument was never about which man possessed the most greatness but about which man would be reckoned to possess it, which is exactly the accounting a market capitalization performs continuously and in public.

His response does not scold the ambition out of them; it relocates the ambition entirely. He first describes the world's arrangement without pretending it is other than it is. [[Luke 22:25]] Then He severs it. [[Luke 22:26]] Whoever is greatest conducts himself as the younger, and whoever is chief conducts himself as the one who serves at the table. Then He identifies Himself as the measuring instrument. [[Luke 22:27]]

Mark preserves the same instruction with the same inversion and attaches the price to it. [[Mark 10:43]] [[Mark 10:44]] Servant of all, which is not a figure of speech. And here is the reason the inversion is not merely attractive humility. [[Mark 10:45]] The Son of man arrived not to be ministered unto but to minister and to surrender His life as a ransom for many. Ranking is therefore entirely real inside Yahweh's economy; it is simply measured in the opposite direction. Paul condenses the household application into a single clause. [[Philippians 2:3]]

Which means those two corporations are doing nothing peculiar whatsoever. They are doing the ordinary human thing that the disciples did at the supper table, and the market is simply keeping the score audibly, with nine zeros appended.

THE THIRD THING: A VALUATION IS AN ACCUMULATION OF ESTEEM. Here is the sentence that converts a market capitalization from a neutral figure into a spiritual object, and Jesus addressed it to men entirely confident about their standing. [[Luke 16:15]] Whatever is highly esteemed among men is abomination in the sight of God. Esteem is the operative term, and a corporate valuation is precisely and exclusively accumulated esteem - a running tabulation of what people will presently pay in order to be associated with a thing. He did not pronounce esteem worthless. He announced that the summit of human esteem and His own assessment do not agree, and He selected the strongest available vocabulary to announce it.

Isaiah takes that identical truth and extends it across an entire appointed day. [[Isaiah 2:11]] Elevated human expressions are humbled and the LORD alone is exalted. He identifies the mechanism responsible. [[Isaiah 2:12]] And he restates the conclusion, because the conclusion is the burden of the whole chapter. [[Isaiah 2:17]] Exactly one name remains standing on the final list, and it will not be a corporation.

Obadiah compresses it into two lines that could have been composed for a published ranking. The deception comes first. [[Obadiah 1:3]] Then the altitude, and immediately afterward the descent. [[Obadiah 1:4]] Though you position your nest among the stars, the concluding verb remains His. And concerning the velocity with which a valuation departs the premises, Solomon supplies the identical bird travelling the opposite direction. [[Proverbs 23:5]]

THE BRIGHT LINE, and preserve it carefully. A market rank is not a verdict on worth, and it is not a verdict on righteousness either. An impressive valuation does not demonstrate Yahweh's approval, and a disappointing one does not demonstrate His displeasure. We are not treating the financial pages as Scripture. We are declining to treat them as a scoreboard of value, which is precisely the temptation a reader encounters every morning of his life.

THE FOURTH THING: THE MAN WHO PRAISED HIMSELF WHERE NOBODY COULD EXAMINE HIM. The issue opened with an anecdote rather than a statistic, and it belongs in this hour. An heir to a substantial eyewear corporation spoke on a podcast, boasted about his possessions and his conquests, made jokes concerning his debts, and subsequently declared in radio interviews that he, rather than the chief executive his late father had personally selected, ought to be directing the family enterprise - characterizing that man as a caretaker and accusing him of neglecting succession. The corporation responded that the statements were unfounded and damaging and that succession is supervised by the board. We did not verify his figures or his quotations, which is why we say so here: this is the digest's account, employed as an illustration of a pattern Scripture identifies, and not as established fact concerning a living man.

The pattern occupies one verse. [[Proverbs 27:2]] Another man should supply the praise, and not your own mouth. The prohibition does not concern being praised; it concerns being the source of the praise, and the reasoning is practical rather than decorative, since commendation issuing from your own mouth establishes nothing whatever because you constitute one witness regarding yourself.

Solomon delivers the identical instruction as a seating arrangement, and it is considerably kinder than it initially appears. [[Proverbs 25:6]] [[Proverbs 25:7]] Preferable that somebody say come up hither than that you be publicly relocated downward. A man who seats himself at the head of the table has effectively commissioned somebody else to correct him in front of witnesses. Most of you have attended the dinner where that correction was administered.

Concerning inheritance specifically, there is a proverb the entire anecdote inhabits. [[Proverbs 20:21]] An inheritance obtained hastily at the beginning concludes without blessing, and the operative word is hastily rather than inherited. Concerning announcements about tomorrow. [[Proverbs 27:1]] And James applies identical reasoning to commercial planning, employing an uncomfortably strong word. [[James 4:16]]

THE COUNTERWEIGHT, so that this does not degenerate into a rule which silences every legitimate objection. A genuine grievance concerning a succession is not sinful to raise. Scripture protects the first speaker and then examines him. [[Proverbs 18:17]] Whoever is first in his own cause appears justified until his neighbor arrives and searches him. The difficulty with the podcast was never that an heir harbored a concern. The difficulty was that he was first in his own cause, at volume, in the single venue where nobody was positioned to search him.

THE FIFTH THING: A COUNTRY CAN FORGET HOW TO MAKE WHAT IT USES. The second item is the one this course has circled all year, and it is the item you can personally remember the other side of. A defense manufacturer and a chipmaker announced an American-designed and American-assembled laptop computer, and their stated justification deserves quoting as they supplied it: decades of offshoring have rendered America dependent upon foreign manufacturers for the computers and components that operate everything from personal devices to critical government infrastructure, which they characterize as a national security matter.

Scripture documents that exact condition, and it survives as one of the most chilling administrative notes in the Old Testament. [[1 Samuel 13:19]] No smith was discoverable throughout the entire land of Israel, and the motive is supplied by the people who engineered the arrangement, inside the verse, so that the Hebrews should not manufacture swords or spears. That is not commercial policy. That is disarmament administered through metalworking.

What followed is invariably the portion nobody anticipates. [[1 Samuel 13:20]] The Israelites descended to the Philistines in order to sharpen every man his share, his coulter, his axe and his mattock. They were obliged to approach the people intending to fight them simply to maintain their agricultural implements, and they were billed for the service. [[1 Samuel 13:21]] And here is the consequence on the single day when it mattered. [[1 Samuel 13:22]] Neither sword nor spear was discoverable in the hand of any of the people. Two men in the entire army possessed a weapon.

Moses had already classified that condition as a curse, and significantly, he classified it in terms of borrowing rather than of armament. [[Deuteronomy 28:43]] [[Deuteronomy 28:44]] He lends to you while you do not lend to him, and he becomes the head while you become the tail. A nation compelled to travel abroad in order to have its instruments manufactured is the tail of the nation manufacturing them, irrespective of its share price.

NOW THE FIGURES, which describe the honest dimensions of the problem rather than its remedy. Verified along two independent roads, domestic production of computer and electronic products expanded approximately 2.8 percent during a year in which imports of that identical category advanced approximately 29 percent. And the verification enlarged the observation considerably beyond where the digest left it: computers and electronics constitute the single largest category of low-cost-country imports in the underlying report, approximately 453 billion dollars, representing roughly 44 percent of the total. The announced computer is a prototype line intended for government, defense and first responders, carrying an American-and-allied component target in the neighborhood of 90 percent, with a completely domestic chain identified as a long-term ambition rather than a present accomplishment; the digest presented that 90 percent as something already accomplished in the prototypes, and verification did not sustain that reading. The detail concerning chips originating in Arizona is attributed to a chief executive by way of a newspaper report, and the company's own written announcement identifies neither the foundry nor the state. One laptop measured against 453 billion dollars is a seed, and honesty requires calling it a seed.

THE COUNTERWEIGHT, and it matters considerably, because the Word nowhere prescribes economic isolation. When Solomon constructed the house of Yahweh he deliberately engaged foreign craftsmen and explained precisely why. [[1 Kings 5:6]] Nobody among the Israelites possessed the skill to hew timber comparably to the Sidonians. He requested the individual by description. [[2 Chronicles 2:7]] Transacting with a neighboring nation for competence you genuinely lack is not sinful; it is wisdom, and Scripture documents Yahweh's own house being constructed on exactly that arrangement. The curse pronounced in Deuteronomy concerns neither purchasing nor neighbors. It concerns being incapable of manufacturing the article yourself, such that the neighbor determines whether you may possess one.

THE SIXTH THING: THE WALL NOBODY WATCHED. The third item is a beverage corporation's quarter, and it is simultaneously the quietest item in the issue and the one situated nearest to a household. Volume at home remained flat while volume everywhere else advanced. The corporation's own explanation, attributed to its leadership and not asserted by us, concerns a holiday week landing inside the preceding quarter. Verified independently, the margin figures held - approximately 33.4 percent reported against 32.0 percent the previous year - and the verification actually softened the headline rather than sharpening it, because income from the home market nevertheless rose about 5 percent despite flat volume. A home market whose income increased is not a dying home market. State the number the way the number reads, which is the discipline this course requires in both directions, since understating a verified truth constitutes a failure identical in kind to overstating an unverified one.

Nevertheless the shape earns the hour, because Scripture supplies a brief and exact instruction concerning it. [[Proverbs 27:23]] Be diligent to know the state of your flocks and look well to your herds. Diligent to KNOW, notice, rather than diligent to grow. And the reasoning follows immediately in the next verse, which constitutes the entire argument against assuming the nearby ground will simply hold. [[Proverbs 27:24]] Riches are not for ever.

What it resembles when a man discontinues looking is described in one of the most visual passages in the whole collection. [[Proverbs 24:30]] He passed by the field of the slothful and the vineyard of the man void of understanding. And here is its condition. [[Proverbs 24:31]] Thorns throughout, nettles covering the surface, and the stone wall broken down. Nobody demolished that wall. It collapsed because nobody walked the fence.

And the household application, which Paul states with a severity that regularly surprises people. [[1 Timothy 5:8]] Whoever fails to provide for his own, and especially for those of his own house, has denied the faith and is worse than an unbeliever. Expansion abroad discharges nothing whatever at the near end of your own table. The distant market is considerably easier to feel enthusiasm about; the nearby one is the market you will answer for.

THE SEVENTH THING: THE ARM THAT CLAIMS CREDIT. Assemble the four items and one temptation proves common to all of them - the conviction that whichever house occupies first position arrived there by its own arm. Moses inserted that sentence into a man's mouth before the man could produce it himself, and then answered it. [[Deuteronomy 8:17]] My power and the might of mine hand have obtained me this wealth. And the correction. [[Deuteronomy 8:18]] It is He that gives you power to get wealth. Observe carefully what is not being said. The power is not pronounced imaginary and the labor is not pronounced unreal. The capacity to produce is pronounced a gift, which is considerably harder to accept than being informed that you failed.

Jeremiah converts it into a ranked inventory of the three things men genuinely boast about, and eliminates all three. [[Jeremiah 9:23]] Wisdom, might, riches - precisely the three quantities a technology league table measures. And then the single permitted boast remains. [[Jeremiah 9:24]] That he understands and knows Me.

Solomon subsequently removes the final consolation, which is the conviction that the ranking is at minimum FAIR. [[Ecclesiastes 9:11]] The race is not to the swift nor the battle to the strong. That is neither cynicism nor permission to stop running. It eliminates the assumption that the outcome constitutes a clean readout of the merit. One corporation invested enormously and led. Another invested comparatively modestly in the identical race, leaned upon somebody else's model, sold hardware, and exchanged positions with the leader regardless. The digest observed that and reported it. Scripture reported it first and explained why.

And Jesus supplied the sentence that renders it personal rather than economic. [[Luke 12:15]] A man's life consists not in the abundance of the things which he possesses. Consists. The vocabulary concerns what a life is constituted of, rather than how much a life is permitted.

THE EIGHTH THING: THE QUESTION THAT STARTS EVERYTHING. So what does a household undertake on a Wednesday morning, owning none of these corporations and determining none of these supply chains? The Word's answer arrives as a question, posed by a prophet to a widow with creditors at her door. [[2 Kings 4:2]] What hast thou in the house? She answered that she possessed nothing, except a pot of oil. The nothing was mistaken. The oil was the beginning. Yahweh commences with whatever is already inside the house. The initial act of sovereignty consists simply in going to look.

The promise that direction indicates is not an empire. It is a man upon his own ground. [[Micah 4:4]] Every man seated beneath his vine and beneath his fig tree, with nobody making him afraid. That is the sovereign photograph this course continually returns to. Not proprietorship of the foundry. Possession of a vine.

Paul's instruction occupying the identical register is deliberately unimpressive, and it constitutes the practical answer to a week of enormous numbers. [[1 Thessalonians 4:11]] Study to be quiet, attend to your own business, and labor with your own hands. And its stated objective. [[1 Thessalonians 4:12]] That you walk honestly toward those outside and lack nothing. Labor with your own hands. During a season when a nation has discovered it cannot manufacture a laptop computer, that instruction ceases to sound quaint - and a good many of you learned a trade the household no longer remembers.

Then the engine, which is emphatically not the arm. [[Zechariah 4:6]] Not by might, nor by power, but by My spirit, says the LORD of hosts. And the division of labor Paul draws in the field. [[1 Corinthians 3:7]] Neither the planter nor the waterer accomplishes anything; God gives the increase. Therefore we plant and water, genuinely, with actual hands upon actual ground, and the increase remains His office rather than ours.

Which is precisely where the planning belongs. [[Proverbs 16:3]] Commit your works unto the LORD and your thoughts shall be established. And the concluding word concerning the entire league table occupies one line. [[Psalm 115:3]]

AND THE ONE WHO IS GENUINELY FIRST. The whole of this terminates in a person rather than a principle. He is Jesus, the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne endures for ever and ever, [[Hebrews 1:8]] and by whom all things consist. [[Colossians 1:17]] He never competed for the first position. He occupied it, and He descended through every rank in existence to the lowest seat in the house, and was subsequently given the Name above every name. That is the appearance of being first when Yahweh performs the ranking.

GO BACK INTO THE TEXT. Read Psalm 75 entire this week, then Luke 22:24-27, then 1 Samuel 13:19-22. Read them in that sequence and observe one question travelling from the throne, to the table, to the forge.

${BLOCKED}

${TALK.senior}`;

// -----------------------------------------------------------------------------
// The module
// -----------------------------------------------------------------------------
const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `${TITLE.toUpperCase()}.

WHO SENT THIS. On the twenty-eighth of October 2026 at 14:07 UTC Darrell forwarded a Daily Upside daily issue out of his university mailbox, with ONE WORD typed above the forwarded header: Lessons. Gmail thread 1a182d6bb1fd6fa6. His word is the ask; the newsletter is the occasion, and no article is the foundation of an hour in this course. Sixteen days stood between his word and this build, and the gap is kept rather than smoothed.

THE WORD FIRST. Psalm 75:6-7 opens the hour - promotion comes neither from the east nor the west nor the south, because God is the judge, He puts down one and sets up another - and Luke 22:24 supplies the scene, where the men closest to Jesus fell into a strife over which of them should be accounted the greatest. A league table of the two most valuable houses on earth trading first and second place is that same strife with a market ticker attached. Then eight movements: promotion handed down and not won, the ranking argument at the supper table and its downward measure, the esteem of men that Jesus called abomination, the heir who was first in his own cause, the land where no smith was found and every farm tool had to be sharpened by the enemy, the flock whose state a man is told to KNOW and the wall that fell because nobody walked the fence, the arm that says my own might got me this, and the prophet's question - what hast thou in the house.

TRUST BUT VERIFY. The primary was not read: www.coca-colacompany.com, www.kearney.com, www.qualcomm.com and www.sec.gov each refused this build with a connect tunnel failure and a 403, so no figure here rests on a primary-source read, said in every reader place with re-review: 2026-11-27. Checking made the reshoring gap LARGER than the digest did - computer and electronics is the largest low-cost-country import category at about 453 billion dollars, about 44 percent of the total - SOFTENED the beverage headline, because home-market income rose about 5 percent with volume flat, CORRECTED the digest's launch attribution, since the foldable phone was unveiled on the ninth of September and went on sale on Friday the twenty-third of October, and REFUSED one claim as present fact: the 90 percent American-and-allied component figure is a target for the first laptop, not a measured property of the prototypes. Attributed and never asserted: the assembly site, the processor part, the 2027 timing, every company statement of intent. Not checked at all: the heir's debt figure and remarks, the aircraft maker's share move and delivery target, the confidence reading, the analyst tally, the year-to-date share moves, the two drink-brand volume figures, the hybrid plan, and the sentence about war-related costs.

PLACEMENT. Sovereign A.I., week 79, because the hour is about who is counted first, who can make the machines, and whether a household can hold its own tools.`,
  inApp: `No new screens this week. One page in your Study, and one walk around your own fence.

In the app: open Sovereign A.I. week 79 and read the band that fits the reader in front of you - the lesson carries all four, child, youth, teen and senior, and each one holds the whole teaching rather than a summary of it. Use Search it out on Psalm 75, Luke 22 and 1 Samuel 13 so the three passages sit side by side; the links come from the lesson's own references and not from a typed list.

Away from the app, two things. First, the walk: take fifteen minutes and look at one part of your household you have not inspected in a month - the tools, the pantry, the accounts, the state of a skill somebody used to have. Write down what you SAW, not what you assume. That is Proverbs 27:23 done with your feet. Second, the question: ask what is in the house. List three things you already hold that could be put to work. Elisha's widow thought she had nothing; she had a pot of oil, and the looking was the first act.

Nothing here needs a purchase and nothing here needs a new tool. If you want the one technical exercise that matches the teaching, pick a single thing on your own machine that you currently depend on somebody else to fix, and learn the first step of fixing it yourself. One step. That is the smith coming back into the land, at household scale.`,
  anchor: {
    ref: 'FILLED FROM THE PLACEHOLDERS',
    theme: `[[Psalm 75:6]] [[Psalm 75:7]] [[Luke 22:24]] [[Luke 22:26]] [[Luke 16:15]] [[1 Samuel 13:19]] [[1 Samuel 13:22]] [[Proverbs 27:23]] [[Deuteronomy 8:18]] [[2 Kings 4:2]]`,
  },
  rpe: {
    research: `RESEARCH. Three readings, and every one of them lands on your own house rather than on a company.

First, read Psalm 75 whole - not the two verses, the psalm. Notice that the promotion verse sits inside a psalm about Yahweh judging, and that the cup in His hand is the context for the putting down and the setting up. Write one sentence on what that does to your reading of any ranking.

Second, read 1 Samuel 13:19-22 and then look up from the page. Make an honest list of the things your household uses daily that nobody in it can make, repair or replace. Not to feel bad - to SEE it. The list is the research. Count the items.

Third, read Proverbs 24:30-34 and Proverbs 27:23-24 together. One is a picture of a wall that fell; the other is an instruction to know your flock. Then go and look at one thing you have not looked at in thirty days and write down its actual state in one line.

And one verification reading, because this course works this way: the figures in this lesson were checked on second roads because four primary hosts refused us, and that refusal is named on the page with a re-review date. Read that paragraph and notice what it does NOT claim. Practice telling the difference between a number that was verified, a number that was attributed to somebody, and a number nobody checked.`,
    plan: `PLAN. Decide the two measures before the week starts, and decide who hears them.

One: the fence. Name the single part of your household you will inspect this week - tools, pantry, accounts, documents, or a skill. Put a day and a time on it. Fifteen minutes is enough; an unscheduled inspection does not happen.

Two: the hands. Name ONE thing you depend on somebody else to make or fix, and the first step toward being able to do it yourself. One step, not the whole skill. Write the step as a verb.

Then name the person who will ask you about both on the same day next week. Write the name down. A measure nobody asks about is a wish.

And write one sentence you will say out loud if the ranking question comes back at you this week - about a job, a position, a comparison with somebody in your own family. One sentence from Psalm 75:7, in your own words. Decide it now, while nothing is at stake.`,
    execute: `EXECUTE. Keep it for one week, out loud, with one other person.

Do the fifteen-minute inspection on the day you named, and write down what you actually saw in one line. If the wall is down somewhere, write that it is down. The honest line is the whole value.

Take the one step on the one skill. Then tell the person who agreed to ask you, in a sentence: here is what I looked at, here is what I found, here is the step I took.

Run the talk-together close before the week ends - all three directions, parent to child, child to parent, and one friend. Ask what is in the house, and listen all the way to the end.

And keep the honest-count habit from the verification paragraph: this week, when you repeat a number you heard, say which kind it is. Verified, attributed, or unchecked. Say it once at the table and watch how quickly the rest of the house starts doing it too.`,
  },
  media: [],
  benefits: [
    `Darrell's one word, Lessons, over a business newsletter, answered from the Word rather than from the article - and the sixteen-day gap between his word and the build kept on the record rather than smoothed.`,
    `The hour opened by Psalm 75:6-7, so a reader meets Yahweh's frame on promotion before a single market figure appears on the page.`,
    `A league table read correctly: a photograph of where Yahweh currently has them standing, not a judgment on anybody's worth.`,
    `The fourth direction noticed - east, west and south are named and the north is left out, because the answer is not a direction at all.`,
    `The ranking argument found in the worst possible room, at the supper table, among the men closest to Jesus, so nobody can file it under corporate behavior.`,
    `Accounted taught as the exact word: the dispute was over who would be RECKONED greatest, which is what a market capitalization keeps score of.`,
    `The inversion kept whole rather than quoted halfway - greatest as the younger, chief as the one who serves, and the Son of man giving His life a ransom for many.`,
    `Luke 16:15 given its real weight: a market value is aggregate esteem, and the summit of human esteem does not agree with the sight of Yahweh.`,
    `Obadiah's nest among the stars set beside Proverbs 23:5, the same eagle flying up in one passage and away in the other.`,
    `The bright line stated in every band: a high valuation does not prove Yahweh's favor and a low one does not prove His displeasure.`,
    `1 Samuel 13:19 taught as the Word's own account of an offshored supply chain - no smith found in all the land, and the reason stated by the people who arranged it.`,
    `The farm tools, not only the weapons: Israel walked down to its enemies to sharpen a share, a coulter, an axe and a mattock, and paid for the privilege.`,
    `Deuteronomy 28:43-44 read precisely - the curse is the head-and-tail relation of dependence, not the act of buying from a neighbor.`,
    `The counterweight kept so movement five is not a slogan about globalization: Solomon hired Sidonian craftsmen on purpose because nobody in Israel could skill to hew timber like them.`,
    `A verified figure stated plainly and then made STRONGER by checking: computer and electronics is the largest low-cost-country import category at about 453 billion dollars, about 44 percent of the total - a point the digest never reached.`,
    `A claim refused as present fact rather than quietly dropped: the 90 percent American-and-allied component figure is a target for the first laptop, not a measured property of the prototypes.`,
    `A correction stated in the digest's favor and against it at once: the rank change was credited to a launch that was a sale date for a phone unveiled six weeks earlier.`,
    `An honest softening: the beverage quarter's home market was flat in volume and its income still rose about 5 percent, so the headline was sharper than the number.`,
    `Proverbs 27:23 read as written - diligent to KNOW the state of the flocks, not to grow them, with riches are not for ever as the reason.`,
    `The wall in Proverbs 24:31 taught as the thing nobody pushed over: it fell because nobody walked the fence.`,
    `1 Timothy 5:8 placed where it stings: growth abroad does not discharge the duty at the near end of your own table.`,
    `Deuteronomy 8:17-18 handled without flattery or insult - the work was real, and the capacity to do it was itself a gift.`,
    `Jeremiah 9:23-24 matched to the exact three things a technology ranking measures, wisdom, might and riches, with the one permitted boast left standing.`,
    `Ecclesiastes 9:11 used to remove the last comfort, that the ranking is at least a clean readout of merit, without turning into an excuse to stop running.`,
    `The household answer deliberately unimpressive: study to be quiet, do your own business, work with your own hands, and sit under your own vine.`,
    `Elisha's question made the first act of sovereignty - what hast thou in the house, answered by going to look, because the nothing was wrong and the oil was the beginning.`,
    `A trust-but-verify note that names all four refused hosts, the identical refusal each gave, and a dated re-review, in every reader place.`,
    `All four age bands written for their own readers from the first commit, each carrying the Word-first frame, the counterweights, the bright line and the blocked road itself.`,
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The two brothers and the sharpening stone',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. Two brothers ran small shops on the same street. The older one was quicker and better known, and for most of ten years his sign was the one people mentioned first. Then the younger one took a contract the older had turned down, and for a season it was the younger brother's name on everybody's lips. The older brother found that he could not stop counting. He knew the other man's rough numbers, he knew what day the trucks came, and he had opinions about all of it.

What he had stopped doing, in that same season, was sharpening his own tools. He used to do it himself on a stone his father had given him. Now he sent them out, because it was faster, and because the man who did it was cheap, and because he was busy keeping score. One winter the sharpener closed and moved away, and the older brother stood in his own shop holding a blade he could no longer bring to an edge.

His wife asked him a question that ended the season. She did not ask about his brother. She asked when he had last walked the back of the shop and looked at what was there. He walked it that evening and wrote down what he saw, and the list was short and honest, and the stone was still on the shelf where his father had left it.

He did not get the contract back. He got his hands back, which turned out to be the thing he had actually lost. And the next time somebody told him who was first on the street, he found he could hear it without doing anything about it.`,
    },
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The announcement nobody could check',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A family business had a plan for who would lead it next, and a son in that family did not agree with the plan. His objection was not foolish. He had seen something in the books that worried him, and he had raised it twice in rooms where it went nowhere.

So he said it somewhere else. He said it at a gathering, in front of people who liked him, and he said it well, and the room agreed with him because the room only had his half of it. By the time the week was out, his half was the version everybody in the family had heard.

The uncle he had named asked for one meeting with both of them in it and the books open. The son went. Inside an hour the worry turned out to be partly right and partly a misread of one column, and the partly-right part was something the uncle had already written a plan for. If the son had said it in that room first, he would have been the man who caught a real thing. Because he said it in the other room first, he was the man who had to be answered.

He told his own children one sentence about it afterward, and it is the sentence worth keeping: being right early is not the same as being right in the right room, and the room where nobody can search you is the most expensive room in the house.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'In Psalm 75:6-7, where does promotion come from?',
        options: [
          'From the east, where the sun rises',
          'From none of the directions - God is the judge, who puts down one and sets up another',
          'From whoever works hardest',
        ],
        answer: 1,
        explain:
          'Three directions are named and the fourth is left out, because the answer is not a direction at all. The next verse supplies it: God is the judge; He putteth down one, and setteth up another. Promotion is a verdict handed down, not a prize won.',
      },
      {
        q: 'In Luke 22:24, what were the disciples arguing about, and where?',
        options: [
          'Which of them should be accounted the greatest - at the last supper',
          'Who would be arrested first - in the garden',
          'How to divide the money - at the treasury',
        ],
        answer: 0,
        explain:
          'A strife among them, which of them should be accounted the greatest, after the bread and the cup, with the betrayal already named. The word is accounted - who would be RECKONED greatest. It is a ranking dispute, and it happened in the worst possible room.',
      },
      {
        q: 'How does Jesus relocate the ambition in Luke 22:26?',
        options: [
          'He forbids greatness entirely',
          'He measures it downward - the greatest as the younger, the chief as he that doth serve',
          'He tells them to wait for a later ranking',
        ],
        answer: 1,
        explain:
          'He does not scold the ambition out of them; He turns the measure upside down. And He points at Himself as the standard: I am among you as he that serveth. Mark adds the price - the Son of man came to give His life a ransom for many.',
      },
      {
        q: 'What does Luke 16:15 say about what men esteem most highly?',
        options: ['That it is usually correct', 'That it is abomination in the sight of God', 'That it should be ignored completely'],
        answer: 1,
        explain:
          'Jesus used the strongest word available. A market capitalization is precisely and only aggregate esteem - what people will pay to be associated with a thing. He did not call esteem worthless; He said the summit of human esteem and the sight of Yahweh do not agree.',
      },
      {
        q: 'According to Proverbs 27:2, what is the problem with self-praise?',
        options: ['It is impolite', 'The praise should come from another man and not from your own mouth', 'It is always factually wrong'],
        answer: 1,
        explain:
          'The ban is not on being praised; it is on being the one who does it. And the reason is practical rather than merely polite: praise from your own mouth establishes nothing, because you are one witness about yourself.',
      },
      {
        q: 'Why was there no smith in all the land of Israel in 1 Samuel 13:19?',
        options: [
          'The smiths had all died in a plague',
          'Because the Philistines arranged it, lest the Hebrews make swords or spears',
          'Iron had not yet been discovered there',
        ],
        answer: 1,
        explain:
          'The verse states the reason in the enemy’s own words. It is not a trade policy; it is a disarmament strategy carried out through metalworking. And the consequence reached the farm as well as the army: Israel went down to the Philistines to sharpen a share, a coulter, an axe and a mattock.',
      },
      {
        q: 'What is the counterweight that keeps movement five from becoming a slogan about globalization?',
        options: [
          'That trade is always wrong',
          'That Solomon hired Sidonian craftsmen on purpose, because no one in Israel could skill to hew timber like them',
          'That Israel should have paid less for sharpening',
        ],
        answer: 1,
        explain:
          'Yahweh’s own house was built with hired foreign skill, and Solomon said plainly why. Trading with a neighbor for skill you do not have is wisdom. The curse in Deuteronomy 28:43-44 is about being UNABLE to make the thing, so the neighbor decides whether you may have it.',
      },
      {
        q: 'In Proverbs 27:23, what exactly is the instruction about the flocks?',
        options: ['To grow them as fast as possible', 'To be diligent to KNOW their state, and look well to the herds', 'To sell them before riches fail'],
        answer: 1,
        explain:
          'Diligent to know, not to grow. And the reason follows in the next verse: riches are not for ever. The matching picture is Proverbs 24:31 - the stone wall was broken down, and nobody pushed it over. It fell because nobody walked the fence.',
      },
      {
        q: 'How does Deuteronomy 8:17-18 handle the man who says his own hand got him his wealth?',
        options: ['It says his work was imaginary', 'It says the capacity to produce was itself a gift from Yahweh', 'It says wealth is always sin'],
        answer: 1,
        explain:
          'Note what it does not say. It does not call the power imaginary or the work unreal. It says it is He that giveth thee power to get wealth - which is a harder thing to accept than being told you failed.',
      },
      {
        q: 'What is the first act of sovereignty in 2 Kings 4:2?',
        options: ['Borrowing from a wealthier neighbor', 'Going to look at what is already in the house', 'Waiting for the creditors to relent'],
        answer: 1,
        explain:
          'Elisha asked what hast thou in the house, and the widow answered that she had nothing, save a pot of oil. The nothing was wrong and the oil was the beginning. Yahweh starts with what is in the house, and the looking is the first act.',
      },
      {
        q: 'What does this lesson say about the figures it reports?',
        options: [
          'That every one was read at its primary source',
          'That the primary was not read - four hosts refused the build - so each number was checked on second roads, with a dated re-review',
          'That the newsletter is citation enough',
        ],
        answer: 1,
        explain:
          'www.coca-colacompany.com, www.kearney.com, www.qualcomm.com and www.sec.gov each refused with a connect tunnel failure and a 403. A shut road must never read like a verified fact, so the hosts are named in every reader place with re-review: 2026-11-27.',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read Psalm 75:6-7 aloud before you say one word about any company. Then read Luke 22:24-27 aloud. Then ask the room one question and wait: who decides who is first? Do not answer it for them. The two passages have already answered it, and the room will get there.

MINUTES 0 TO 10 - THE FRAME. Psalm 75:6-7, Daniel 4:17, 1 Samuel 2:7-8. Make the point about the fourth direction: three are named, the north is not, because the answer is not a direction. Promotion is a verdict handed down.

MINUTES 10 TO 20 - THE TABLE. Luke 22:24-27 and Mark 10:43-45. Land the word accounted. Then say where it happened - at the supper, after the cup. Nobody gets to treat the ranking fight as a corporate disease.

MINUTES 20 TO 30 - THE ESTEEM. Luke 16:15, Isaiah 2:11-17, Obadiah 1:3-4. Here is where you say the bright line out loud, twice: a market rank is not a verdict on worth, and it is not a verdict on righteousness. Then the heir anecdote and Proverbs 27:2, 25:6-7, 18:17 - including the counterweight, that a real grievance is not sin to raise.

MINUTES 30 TO 42 - THE FORGE. 1 Samuel 13:19-22 slowly, all four verses. Let the farm tools land before the swords. Then Deuteronomy 28:43-44. Then the figures, and say the refused hosts BEFORE any number: the primary was not read, four hosts refused us, re-review 2026-11-27. Then the counterweight from 1 Kings 5:6 and 2 Chronicles 2:7, so nobody leaves thinking Scripture teaches economic isolation.

MINUTES 42 TO 52 - THE FENCE AND THE ARM. Proverbs 27:23-24, Proverbs 24:30-31, 1 Timothy 5:8. Then Deuteronomy 8:17-18, Jeremiah 9:23-24, Ecclesiastes 9:11, Luke 12:15. Say the honest softening on the beverage quarter here: the home market was flat in volume and its income still rose about 5 percent, so the headline was sharper than the number. Under-claiming a verified truth is also a failure.

MINUTES 52 TO 60 - THE HOUSE, AND THE CLOSE. 2 Kings 4:2, Micah 4:4, 1 Thessalonians 4:11-12, Zechariah 4:6, 1 Corinthians 3:7, Proverbs 16:3, Psalm 115:3. Then John 1:29, John 3:16, Hebrews 1:8, Colossians 1:17 - the One who did not compete for first place because He had it. Close with the talk-together directions and send them back into Psalm 75, Luke 22:24-27 and 1 Samuel 13:19-22 in that order.

WHAT NOT TO DO. Do not stage two schools of economic opinion and let the room pick a side; teach the Word and work it (DR-0098). Do not hedge the verified figures into nobody-knows; state them plainly and name exactly what was not checked (DR-0100). And do not let a single number out of your mouth before the refused hosts and the re-review date have been said.`,
    talkingPoints: [
      `Three directions are named in Psalm 75:6 and the fourth is left out, because the answer is not a direction at all.`,
      `Promotion is a verdict handed down, not a prize won - He putteth down one, and setteth up another.`,
      `Daniel 4:17 gives it without decoration: the most High ruleth in the kingdom of men, and giveth it to whomsoever He will.`,
      `Hannah put rich and poor in the same hand, and set the poor man among princes, so nobody treats the ladder as fixed.`,
      `Accounted is the operative word in Luke 22:24 - the strife was over who would be RECKONED greatest.`,
      `It happened at the supper table, after the cup. The ranking fight is not a corporate disease; it is a human one.`,
      `Jesus does not remove the ambition, He inverts the measure - greatest as the younger, chief as the one who serves.`,
      `Mark adds the price so it is not humility theater: His life a ransom for many.`,
      `A market capitalization is aggregate esteem, and Luke 16:15 says the summit of human esteem is abomination in His sight.`,
      `Obadiah's nest among the stars and Proverbs 23:5 are the same eagle flying in opposite directions.`,
      `Say the bright line twice: a market rank is not a verdict on worth, and it is not a verdict on righteousness.`,
      `Self-praise is barred because it establishes nothing - you are one witness about yourself.`,
      `Proverbs 18:17 is the counterweight: a real grievance is not sin to raise, but the first in his own cause has not been searched yet.`,
      `1 Samuel 13:19 is the Word's own account of an offshored supply chain, and the enemy states the motive himself.`,
      `Teach the farm tools before the swords - a share, a coulter, an axe and a mattock, sharpened by the enemy, for a price.`,
      `Deuteronomy 28:43-44 names dependence as head and tail. It does not forbid buying from a neighbor.`,
      `Solomon hired Sidonian craftsmen for Yahweh's own house, and said plainly that nobody in Israel could do that work.`,
      `Say the refused hosts out loud before any figure: the primary was not read, four hosts refused us, re-review 2026-11-27.`,
      `Say what checking made STRONGER too: computer and electronics is the largest low-cost-country import category, about 453 billion dollars, about 44 percent of the total.`,
      `And say what checking SOFTENED: home-market income rose about 5 percent even with volume flat, so the headline was sharper than the number.`,
      `Proverbs 27:23 says diligent to KNOW, not to grow, and gives the reason next - riches are not for ever.`,
      `Nobody pushed over the wall in Proverbs 24:31. It fell because nobody walked the fence.`,
      `Deuteronomy 8:18 does not call the work unreal; it calls the capacity to work a gift, which is harder to receive.`,
      `Jeremiah strikes the exact three a technology ranking measures - wisdom, might, riches - and leaves one boast standing.`,
      `Elisha's question is the first act of sovereignty: what hast thou in the house. The widow's nothing was wrong.`,
      `The household answer is deliberately unimpressive - be quiet, do your own business, work with your own hands, sit under your vine.`,
      `He did not compete for the first place. He had it, came down through every rank, and was given the Name above every name.`,
    ],
    discussionPrompts: [
      `Who are you currently measuring yourself against, and who do you believe hands out the place you want? Say both names out loud.`,
      `Name one thing your household uses every day that nobody in it can make, repair or replace. What would the first step toward that skill be?`,
      `What part of your life is growing where it is visible, while the near part has gone merely flat - and when did you last walk that fence?`,
      `Where have you been first in your own cause, in a room where nobody could search you? What would it cost to say it again with the books open?`,
      `What have you caught yourself reading as a scoreboard of worth - a number, a title, a comparison inside your own family?`,
      `What is in the house? List three things you already hold that could be put to work this month.`,
    ],
  },
  lesson: LESSON.join('\n\n'),
  levels: { child: CHILD, youth: YOUTH, teen: TEEN, senior: SENIOR },
};

// -----------------------------------------------------------------------------
// Fill, then DERIVE the anchor from the placeholders that occur in reader places
// -----------------------------------------------------------------------------
const filled = fillDeep({ ...MODULE, anchor: { ...MODULE.anchor, ref: '' } });
// Reader places only, and in the order the adult lesson meets them.
readerRefs.length = 0;
seenReader.clear();
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
console.log(`sov79: adult prose words ${adultWords}`);
for (const b of FOUR_BANDS) {
  console.log(
    `sov79: ${b} words ${words(filled.levels[b])} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} fk ${fk(filled.levels[b]).toFixed(2)} overlap-adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`sov79: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(filled.levels[FOUR_BANDS[i]], filled.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(filled);
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('sov79: refusing to splice a lesson that fails the four-band ladder');
}

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov79: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov79: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov79: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov79: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov79: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov79: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov79: the id survived the excision; refusing to rebuild');
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
if (after.length !== before.length + 1) throw new Error(`sov79: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov79: week ${WEEK} is already taken`);
if (after[after.length - 1] !== WEEK) throw new Error(`sov79: week ${WEEK} is not the top of the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov79: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov79: spliced ${ID}`);
console.log(`sov79: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov79: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
