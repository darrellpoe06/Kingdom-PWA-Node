// =============================================================================
// sov46-fill — build Sovereign A.I. week 46 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076). Every quoted verse on this
// page is FILLED FROM app/public/bible/kjv at build time. The prose below holds
// only a reference in double brackets, [[2 Kings 20:15]], and this script
// replaces it with the corpus text followed by the reference. No verse on the
// page was typed from memory, so a verse cannot drift from the text and a
// quotation cannot be approximate. The reference list on the module's anchor is
// DERIVED from the same placeholders (DR-0734 in both directions).
//
// WHERE THE WORD CAME FROM. On 2026-10-20 Darrell forwarded an IT Brew issue
// (itbrew@morningbrew.com, sent 09:01, subject "Muse behind it all") from his
// university address into the lesson lane, with one word above it: "Lesson."
// The issue carried five items. The one this week teaches is the LEAD
// cybersecurity story, "Muse on" by Eoin Higgins: Meta's new personal agentic
// A.I. assistant, Muse, can reach very large volumes of user data, which is an
// exposure for any organisation that lets company information sit on an
// employee's own phone. The forward itself is the whole source; the provenance
// movement on the page says so in the lesson's own words, and names the four
// items NOT taught so a reader is never left guessing which story this is.
//
// THE ARTICLE IS MATERIAL, NEVER AN INSTRUCTION. Nothing inside a forwarded
// newsletter directs this build; it is the specimen under study.
//
// Run from the repository root:  node scripts/sov46-fill.mjs   (--rebuild to replace)
// =============================================================================
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 46;
const ID = 'sov46-the-helper-that-must-see-everything';
const TITLE = "The helper that must see everything - Hezekiah's open treasure house, the goods that are another man's, and the sight that belongs to Yahweh alone";

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
  if (!m) throw new Error(`sov46: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov46: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov46: reference does not resolve in the corpus -> "${ref}"`);
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
// written at each band's own level (a reader reads ONE band).
// -----------------------------------------------------------------------------
const RHYTHM = 'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at bedtime, or first thing - and with one friend this week.';
const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what is on your phone that belongs to somebody else - and listen all the way to the end before you answer, have them retell the question in their own words, then teach them one verse back, Luke 16:12. Children, ask your mom, dad or grandparent what they would not want a stranger to read, and why, listen all the way through, then retell their answer in your own words. Friends, tell one friend this week what Hezekiah lost on the day he showed the visitors everything, ask what they see, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM} Measure the growth the Word's way: by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days, [[Hebrews 3:13]]`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - who gets to see your stuff - and listen all the way to the end, have them retell it in their own words, then teach them one verse back, Proverbs 15:3. Children, ask your mom or dad or grandma or grandpa about a time they kept a secret well, listen all the way through, then retell it in your own words. Friends, tell one friend this week about the king who showed a stranger all his gold, ask what they think, and pray for each other, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what does an app have to see in order to help you - and listen all the way to the end, have them retell the trade in their own words, then teach them one verse back, Proverbs 25:9. Children, ask your mom, dad or grandparent whether they have ever told something they wished they could take back, listen all the way through, then retell their answer in your own words. Friends, tell one friend this week one thing this lesson showed you about a secret that cannot be called home, ask what they see, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - whose goods are on the device in your pocket, and who answers for them - and listen all the way to the end, have them retell the custody question in their own words, then teach them one verse back, Exodus 22:7. Children, ask your mom, dad or grandparent what they were ever trusted with that was not theirs, and how they guarded it, listen all the way through, then retell it in your own words. Friends, tell one friend this week one thing this lesson showed you about scoping what a helper is allowed to read, ask what they see, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM} Measure the growth the Word's way: by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days, [[Hebrews 3:13]]`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the children in your house one open question today - what would you not want read aloud, and who can read it right now - and listen all the way to the end, have them retell the answer in their own words, then teach them one verse back, Ecclesiastes 10:20. Children, ask your parents or grandparents which confidences they have carried for decades without telling, listen all the way through, then retell it back to them in your own words. Friends, tell one friend this week one thing this lesson showed you about the one Search a person should actually invite, ask what they see, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson, in ten movements. The Word first in every one of them.
// -----------------------------------------------------------------------------
const LESSON = [

`FIRST, WHAT CAME IN, WHICH STORY THIS IS, AND WHAT NOBODY HERE VERIFIED. On 2026-10-20 Darrell forwarded an industry newsletter into the lesson lane with one word above it: Lesson. The issue was IT Brew's for that morning, and it carried five separate items, not one. There was a lead cybersecurity story about Meta's new personal agentic assistant. There was a strategy piece on the forward-deployed engineer, said to be the hottest job in technology. There was an operations piece on whether anybody's data is ready for the models that will read it. There was a short reading list, including a mass intrusion into the refrigeration systems of hundreds of French supermarkets. And there was a sponsor's advertisement about how much autonomy organisations hand their agents. This week teaches the FIRST of those five, the lead cybersecurity story, because it is the one the subject line named, it is the one the editors led with, and it is the one that belongs in a course about building our own: an assistant whose helpfulness is purchased with permission to read everything you have. The other four are named here on purpose, so that nobody reading this page has to guess which story it came from. And the honest limit, stated before the teaching rather than after it: a forwarded newsletter is the entire source. Nobody here opened the vendor's documentation, read its data-retention terms, interviewed anybody, or confirmed a single figure against a primary record. What is taught below as established is established BY THAT REPORT, named as such; what the report did not settle is named as open; and the sponsor's advertisement in the same issue, which carried its own numbers about agent autonomy, is advertising that nobody verified and this lesson does not rest one sentence on it.`,

`SECOND, THE REPORT IN THREE TIERS, SO A TRUTH IS NOT SHRUNK AND A CLAIM IS NOT INFLATED. ESTABLISHED, and stated plainly rather than hedged: the report says Meta has shipped a personal agentic A.I. assistant named Muse, and that it can reach very large volumes of a user's data. It names the exposure precisely, and the exposure is not exotic - it is the ordinary arrangement in which an organisation permits company information to live on an employee's own telephone. It quotes a named executive, Dominik Angerer of Storyblok, saying that the concern did not begin with this product at all: an assistant that offers to summarise what is on your screen must first read what is on your screen, which was already true of the voice assistant most people carry, and that routing that assistant's thinking through another company's model adds a third party to the chain of custody. None of that is speculation, and none of it requires a breach to be a problem. It is the design. OPEN, and named narrowly rather than smeared across the whole subject: what this particular product retains, for how long, in which jurisdiction, and under what controls an employer can actually set is not something this page knows, because the report did not say and nobody here checked. No breach of it is alleged by the report, and none is alleged here. The exact terms under which one company's assistant uses another company's model are likewise unread by us; the newsletter's own text supplied that model's name inside brackets, which is an editor's note, not a contract. OVER-REACH, corrected by the Word while the true data underneath it stands: the conclusion that a believer should therefore refuse every helper, carry no device and distrust every tool is not what the Word says. Yahweh put the first man in a garden with a job, [[Genesis 2:15]] and He commends the man who keeps records of what he is responsible for: [[Proverbs 27:23]] A tool in a steward's hand is not the sin. Unscoped trust is. There is a second over-reach, in the opposite direction, and it is the one that actually costs houses: that nothing was lost, because nothing has happened yet. Hezekiah lost nothing the day he opened his treasure house either. The prophet came to tell him what it had already cost.`,

`THIRD, TOTAL SIGHT IS AN ATTRIBUTE OF YAHWEH, WHICH IS WHY IT IS SAFE ONLY IN HIS HANDS. Begin where the Word begins, not where the product announcement begins. There is One who already reads everything, and the psalm does not describe that as a threat. [[Psalms 139:1]] [[Psalms 139:2]] [[Psalms 139:3]] [[Psalms 139:4]] Nothing is withheld from Him, and the letter to the Hebrews says it without softening: [[Hebrews 4:13]] His eyes are in every place, [[Proverbs 15:3]] He searches the heart rather than the surface, [[Jeremiah 17:10]] He understands the imaginations of the thoughts, [[1 Chronicles 28:9]] and He sees what no instrument reaches: [[1 Samuel 16:7]] And He has said that concealment is temporary anyway: [[Matthew 10:26]] Hold those verses beside the product and the shape of the thing is visible. An assistant that must read everything in order to help is asking to be given an attribute - not a permission, an attribute. In Him that attribute is safe, because He searches in order to heal, He already paid for what He finds, and He is not monetising the result. In the hands of a company it is the same capability with none of those three guarantees, and the difference is not technical. It is moral. A previous week in this course taught that a transcript hears the words while Yahweh hears the heart; this week is the other side of that coin. What is at issue now is not what a machine FAILS to see. It is what we have handed it permission to see.`,

`FOURTH, THE KING WHO SHEWED THEM EVERYTHING - THE OLDEST DATA-EXPOSURE STORY IN THE WORLD. The Word has already told this story, in detail, with the consequence attached. Hezekiah had just been healed and his name had travelled, and envoys arrived from a far country with letters and a present: [[2 Kings 20:12]] Notice the sequence, because it is the sequence every exposure follows. The visitors were courteous. They were interested. They brought something. And the king, flattered and unguarded, gave them a complete read: [[2 Kings 20:13]] The parallel account adds the detail that settles the motive - he was glad of them: [[Isaiah 39:2]] Then the prophet came and asked the two questions an auditor asks, who were they and what did they see, and the king's own answer is the sentence this whole lesson turns on: [[2 Kings 20:15]] There is nothing among my treasures that I have not shewed them. He did not lose a shekel that afternoon. He lost the inventory. And the word of Yahweh told him what that meant: [[2 Kings 20:16]] [[2 Kings 20:17]] [[2 Kings 20:18]] The treasure went to Babylon, and so did his sons. The chronicler adds the part no security report would have thought to write down - that the whole episode was a test, and what it tested was not his walls: [[2 Chronicles 32:31]] The permission prompt was the examination. He was not asked whether his defences were adequate. He was asked what he would do when somebody admiring made it easy to show them everything, and the answer was in his heart before the envoys ever knocked. A house that reads this story as ancient history has missed that the modern version is a single tap, is offered by somebody who genuinely does want to help, and carries exactly the same clause: there is nothing among my treasures that I have not shewed them.`,

`FIFTH, THE GOODS ON THE DEVICE ARE ANOTHER MAN'S - WHICH IS WHY THIS IS A STEWARDSHIP QUESTION. The report's exposure is a bring-your-own-device arrangement, and the Word has a whole category for that. The Lord Jesus drew the line Himself, and He drew it at faithfulness in what belongs to someone else: [[Luke 16:10]] [[Luke 16:11]] [[Luke 16:12]] That last clause is the employee's phone exactly. The client list, the patient note, the payroll file, the unreleased drawing - on that device they are another man's goods, delivered into your keeping. The law given at Sinai already covered goods delivered to a neighbour to keep, including the case where they are taken out of the keeper's own house: [[Exodus 22:7]] and the keeper himself was brought before the judges to establish whether he had put his hand to what was not his: [[Exodus 22:8]] An inquiry into whether the custodian cooperated with the loss is not a modern audit practice. It is older than the monarchy. And the Word's picture of custody done right is Joseph, trusted with a whole house: [[Genesis 39:4]] [[Genesis 39:6]] Everything was in his hand, and the master did not even keep an inventory, because the steward was the inventory. When Joseph was tempted, the thing he reasoned from was that custody: [[Genesis 39:8]] [[Genesis 39:9]] He refused because of what had been committed to his hand, and because the sin would be against Yahweh first. That is the standard the Word sets for the man who installs a helper on a device carrying his employer's information, and the standard has a name: [[1 Corinthians 4:2]] Required in stewards. Not recommended.`,

`SIXTH, A SECRET DISCOVERED CANNOT BE CALLED HOME - THE CHAIN OF HANDS. The quoted executive's point about a third party is a chain-of-custody point, and the Word treats a chain of hands as a one-way door. Wisdom's instruction is to settle a matter with the person it concerns and not to publish it onward: [[Proverbs 25:9]] and it attaches the reason, which is that the shame does not come back: [[Proverbs 25:10]] A faithful spirit conceals a matter rather than carrying it: [[Proverbs 11:13]] and the man who carries matters is identified by the thing he does for you first, which is flatter you: [[Proverbs 20:19]] Meddle not with him that flattereth with his lips. Read that beside an assistant whose whole manner is accommodation and the sentence stops being quaint. And Ecclesiastes states the mechanism with an image nobody improves on: [[Ecclesiastes 10:20]] A bird of the air shall carry the voice. Each hop in the chain is another house. The screen is read to summarise it; the summary is sent to be processed; the processing happens inside another company's model; that company has its own vendors, its own jurisdictions and its own future owners. No hop in that chain is malicious and the whole chain is still irreversible, because the one thing no contract anywhere can promise is un-reading. That is why the Word puts the discipline at the first disclosure rather than at the remedy. There is no remedy. There is only the decision about what is shewn.`,

`SEVENTH, THE OLDEST PITCH HAS NOT CHANGED - YOUR EYES SHALL BE OPENED. Why does total access get granted so easily? Because of how the offer is always worded. The first temptation in the Word was not an offer of evil; it was an offer of expanded sight, with a denial of the consequence attached: [[Genesis 3:4]] [[Genesis 3:5]] And the woman's reasoning is recorded, which is the mercy of the passage, because it is our reasoning: [[Genesis 3:6]] Good for food, pleasant to the eyes, and to be desired to make one wise - which is the feature list of every assistant ever shipped. Useful, delightful, and it will make you smarter. The adversary does not arrive labelled; the apostle says plainly what shape he takes: [[2 Corinthians 11:14]] This is not an accusation against engineers, and the lesson is not that a product is a demon. The point is narrower and far more useful: the lure in every unscoped grant of sight is the same lure, and it works by offering capability while denying cost. The denial in verse four is still the most effective sentence in technology marketing, and it is never said in those words any more. It is said as a reassurance that your privacy is taken seriously.`,

`EIGHTH, THE BATTLEMENT, THE WATCH, AND THE SCOPE - WHAT A STEWARD ACTUALLY DOES ON MONDAY. The Word does not answer an exposure with alarm; it answers with construction. When you build a house, you build the railing as part of the house, before anybody falls: [[Deuteronomy 22:8]] That is scope, written into a building code three thousand years early: the capability is fine, the fall is foreseeable, so the guard is part of the build rather than a response to the funeral. Nehemiah's wall gives the posture: prayer and a watch, both, neither one instead of the other: [[Nehemiah 4:9]] The Lord Jesus made counting the cost first the mark of a serious builder: [[Luke 14:28]] Wisdom distinguishes the simple from the prudent exactly here, at whether a word is believed on arrival: [[Proverbs 14:15]] [[Proverbs 22:3]] And a boundary somebody set before you is not to be moved casually: [[Proverbs 22:28]] So, concretely, and all of it ordinary stewardship rather than fear. Ask what a helper must read in order to do the one thing you want, and grant that and not the rest. Keep the houses separate: the employer's goods in the employer's container, the family's in the family's, on the ground that they are not the same man's goods. Name the owner of every assistant that can read anything, and name who answers when it reads the wrong thing - an agent with no named owner is an agent nobody will answer for. Keep the record, because a steward who cannot say what was read cannot report. Read what leaves the device, not only what arrives on it. And before the convenient thing is switched on, count what it would cost if everything it can reach were carried to Babylon, because that is the number Hezekiah never ran.`,

`NINTH, WHAT THIS HOUSE BUILDS INSTEAD, AND WHAT IT DOES NOT CLAIM. This course exists because of this exact class of problem: the helper that is only helpful if it reads everything, and the only remedy that actually changes the chain of hands is to shorten the chain. Our own corpus sits on our own machine. The verses on this page were fetched from a copy of the Word this family holds on its own disk, not asked of a service. A model that runs in the house cannot be subpoenaed from somebody else's data centre, cannot be re-priced, and cannot be re-purposed by a vendor's next owner, because there is no vendor in the loop. That is what sovereignty means in this course, and it is not a slogan: it is a shorter chain of hands. What this house does NOT claim is immunity. A machine under our own roof can still be breached, still be misconfigured, still be left with a permission nobody scoped, and a steward who says otherwise has traded one unexamined trust for another. The claim is narrower and true: we own the decision, we can read the record, and nobody else gets to change the terms afterward. Sovereignty is not safety. It is custody - and custody is the thing the Word actually asks us for.`,

`TENTH, THE ONE SEARCH TO INVITE, AND THE CLOSE. There is exactly one total read a person should ever grant, and the psalmist grants it on purpose, in the same psalm that opened this lesson by saying the Searcher already knows everything: [[Psalms 139:23]] [[Psalms 139:24]] That is the difference the whole week turns on. Hezekiah showed his treasures to visitors who would carry them away. David invited the Searcher who would heal what He found. The same psalm asks for cleansing from what the man himself cannot audit, [[Psalms 19:12]] for restraint from the presumption he would not notice, [[Psalms 19:13]] and for his words and his thinking to be acceptable to the One reading them: [[Psalms 19:14]] And the Word puts the guard where the data actually lives: [[Proverbs 4:23]] Keep the heart with all diligence. Then confess who the Searcher is. He is the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne is for ever: [[Hebrews 1:8]] He is the only One who can read all of it and be trusted with all of it, because He already paid for all of it. So scope the helper, keep the record, guard another man's goods - and open the whole house to Him.`,

];

// -----------------------------------------------------------------------------
// The four age bands, each WRITTEN FOR ITS READER.
// -----------------------------------------------------------------------------
const CHILD = `THE HELPER THAT MUST SEE EVERYTHING - Hezekiah's open treasure house, the goods that are another man's, and the sight that belongs to Yahweh alone. That is a long name. Let us make it small.

Where did this come from? A man named Darrell got a news letter about computers. He forwarded it to this app on 2026-10-20. On top he wrote one word. Lesson. The news letter had five stories in it. This one is about the first story. Here is the honest part. We only read that one news letter. We did not go and check it with anybody else. So we say so, right here, out loud.

The story is about a new helper that runs on a phone. It can look at a LOT. That is the whole worry.

Some helpers on a phone want to see all your stuff. They say it helps them help you. Sometimes that is true. But see is see. If it reads one thing, it can read the next thing too.

There is only One who should see all of it. That is Yahweh. He sees it now. He always did. [[Psalms 139:1]] He knows what you think before you say it. [[Psalms 139:4]] His eyes are in every place. [[Proverbs 15:3]] He looks at the heart, not the outside. [[1 Samuel 16:7]] That is good news, not scary news. He looks to help. He is not going to sell what He sees.

Now a true story from the Word. There was a king named Hezekiah. He had been very sick. Then Yahweh made him well. People heard about it. Some men came from far away. They brought letters. They brought a gift. They were nice.

So the king took them inside. He showed them his gold. He showed them his silver. He showed them his spices. He showed them his armour. He showed them all of it. [[2 Kings 20:13]] He was happy they came. [[Isaiah 39:2]]

Then a man of Yahweh came. His name was Isaiah. He asked the king a question. What did those men see? Here is what the king said. [[2 Kings 20:15]] He had shown them every single thing.

Nothing was gone that day. No gold was stolen. But now they knew. And Yahweh told the king the truth. One day it would all go to their city. [[2 Kings 20:17]] It did. The king was glad for one hour. His sons paid for it.

Here is a big idea. The gold was taken later. But the LIST was taken that day. Once somebody sees it, they cannot un-see it.

Now think about a phone. Some things on it are not yours. Maybe it is dad's work file. Maybe it is a photo of a friend. Those are somebody else's things. You are just keeping them. Jesus taught about this. [[Luke 16:12]] Yahweh gave a rule about it long ago too. If you keep stuff for your neighbour, you have to care for it. [[Exodus 22:7]]

Joseph is the good one to copy. His boss let him run the whole house. Everything was in his hand. [[Genesis 39:4]] When somebody asked him to do wrong, he said no. He said it was not his to give. [[Genesis 39:9]] That is a good steward. Yahweh asks us all to be one. [[1 Corinthians 4:2]]

Yahweh gave a house rule long ago. When you build a house, build a little wall around the roof. Then no one falls off. [[Deuteronomy 22:8]] Build the wall when you build the house. Do not wait for a fall. That is how we do helpers too. Set the rule first.

So what do we do? Four small things.

One. Ask first. What does this app need to see to do the job? Give that. Do not give the rest.

Two. Keep a secret like a gift. A secret cannot come home. [[Proverbs 25:9]] A little bird carries words a long way. [[Ecclesiastes 10:20]]

Three. Count the cost first, like Jesus said. [[Luke 14:28]] Ask what it would cost if all of it got out.

Four. Let Yahweh see all of it. He is the only One who should. Ask Him to look. [[Psalms 139:23]] He is the Lamb of Yahweh. [[John 1:29]] The Father gave His only Son. [[John 3:16]] He paid for every bad thing He finds in us. So we can let Him look.

${TALK.child}`;

const YOUTH = `THE HELPER THAT MUST SEE EVERYTHING - Hezekiah's open treasure house, the goods that are another man's, and the sight that belongs to Yahweh alone. On 2026-10-20 Darrell forwarded a technology newsletter into the lesson lane with one word on top of it: Lesson. The issue had five stories in it, and this week teaches the first one, the security story, because that is the one the subject line named and the one this course is actually about.

WHAT THE STORY SAID. Meta has released a personal assistant powered by A.I., called Muse, and the report says it can reach a very large amount of a user's data. The problem the report raises is not a break-in. It is the normal setup where a company lets work information sit on an employee's own phone. A named executive in the story adds the part worth remembering: this did not start with one company. An assistant that offers to summarise what is on your screen has to read what is on your screen first, and when that assistant sends its thinking to another company's model, a third party joins the chain.

WHAT NOBODY HERE CHECKED, SAID OUT LOUD. The forwarded newsletter is the whole source. Nobody here read the company's documentation, and nobody confirmed how long anything is kept or where. The report does not claim a breach, and neither do we. The same issue carried an advertisement with its own statistics about how much freedom companies give their agents; that is advertising, we did not verify it, and nothing here depends on it.

START WITH THE WORD, NOT THE PRODUCT. There is already Someone who reads everything, and the psalm treats that as comfort rather than threat. [[Psalms 139:1]] [[Psalms 139:2]] Nothing is hidden from Him at all. [[Hebrews 4:13]] He searches the heart, which is deeper than any file. [[Jeremiah 17:10]] So total sight is not a feature. It is something that belongs to Yahweh. When a helper asks to read everything, it is asking for something that has only ever been safe in His hands, because He searches in order to heal and He is not selling the result.

THE KING WHO SHOWED THEM ALL OF IT. Hezekiah had been healed and had become famous, and visitors arrived from a distant country with letters and a gift. [[2 Kings 20:12]] They were polite and they were interested, and the king gave them a full tour of his treasury and his armoury. [[2 Kings 20:13]] The other account of it says he was glad they came. [[Isaiah 39:2]] Then Isaiah asked him what they had seen, and the king's answer is the sentence to memorise. [[2 Kings 20:15]] Nothing was stolen that day. What left the building was the inventory. Yahweh told him what that would mean: it would all be carried off, and his sons with it. [[2 Kings 20:17]] [[2 Kings 20:18]] And the chronicler tells us the whole visit was a test of what was in his heart. [[2 Chronicles 32:31]] The prompt was the exam.

WHOSE GOODS ARE THEY. The thing that makes a phone different from a diary is that some of what it holds is not yours. Jesus put the dividing line right there. [[Luke 16:10]] [[Luke 16:12]] The law already covered goods handed to a neighbour for keeping, and it covered the case where they went missing out of the keeper's own house. [[Exodus 22:7]] Joseph is the picture of it done right: an entire household in his hand, and his reason for refusing to sin was exactly that trust. [[Genesis 39:6]] [[Genesis 39:9]] Being trustworthy with what belongs to someone else is not a bonus. It is the job description. [[1 Corinthians 4:2]]

A SECRET CANNOT BE CALLED BACK. Wisdom says to keep a matter with the person it belongs to, and gives the reason: the shame does not return once it has travelled. [[Proverbs 25:9]] [[Proverbs 25:10]] A trustworthy person covers a matter instead of carrying it. [[Proverbs 11:13]] And Ecclesiastes gives the image that still has not been improved on. [[Ecclesiastes 10:20]] Every step in a chain of companies is another house, and not one of them can offer you un-reading.

WHY WE SAY YES SO FAST. Because of how the offer is worded. The first temptation was not a pitch for evil. It was a pitch for better sight, with the cost denied. [[Genesis 3:4]] [[Genesis 3:5]] Look at what she actually thought about it: good for food, lovely to look at, and it would make her wise. [[Genesis 3:6]] Useful, delightful, and it will make you smarter. That is the feature list of every assistant ever launched. And the deceiver does not arrive looking like one. [[2 Corinthians 11:14]]

SO BUILD THE RAILING. Yahweh's answer to a foreseeable fall is not panic; it is construction. Build the railing as part of the house. [[Deuteronomy 22:8]] Nehemiah prayed AND set a watch. [[Nehemiah 4:9]] Jesus said a real builder counts the cost first. [[Luke 14:28]] The simple believe whatever arrives; the wise look at where they are going. [[Proverbs 14:15]] In practice: grant only what the helper needs for the one job, keep work things and family things in separate containers because they are not the same person's property, know who owns every assistant that can read anything, and before you switch on something convenient, ask what it would cost if all of it were carried away. That is the number Hezekiah never worked out.

THE ONE SEARCH WORTH INVITING. There is exactly one total read a person should ever allow, and David asked for it on purpose. [[Psalms 139:23]] [[Psalms 139:24]] He asked to be cleansed of the faults he could not even find himself. [[Psalms 19:12]] And the guard goes where the real data is kept. [[Proverbs 4:23]] He is the Lamb of Yahweh. [[John 1:29]] He is the Eternal Son of Yahweh whom the Father gave. [[John 3:16]] He is the only One who can read all of it and be trusted with all of it, because He already paid for all of it.

${TALK.youth}`;

const TEEN = `THE HELPER THAT MUST SEE EVERYTHING - Hezekiah's open treasure house, the goods that are another man's, and the sight that belongs to Yahweh alone. On 2026-10-20 Darrell forwarded that morning's IT Brew into the lesson lane with a single word above it, Lesson, and the issue carried five unrelated items: a lead cybersecurity story on Meta's new agentic assistant, a strategy piece on the forward-deployed engineer, an operations piece on whether anybody's data is ready to be read by a model, a short reading list that included a mass intrusion into the refrigeration systems of hundreds of French supermarkets, and a sponsor's advertisement about agent autonomy. This week works the first of those, deliberately, because it is the story the subject line named and the story this course exists for.

THE THREE TIERS, BEFORE ANY TEACHING. ESTABLISHED, stated plainly rather than hedged into the language of some-say: the report says Meta has shipped a personal agentic A.I. assistant called Muse which can reach very large volumes of user data, and it identifies the exposure as the ordinary bring-your-own-device arrangement in which employer information lives on an employee's own handset. It quotes Dominik Angerer of Storyblok making the point that matters most, which is that this did not originate with one product: an assistant that summarises your screen must first read your screen, and routing that assistant through a second company's model introduces a third-party liability into the chain of custody. That is architecture, not allegation, and it requires no breach to be true. OPEN, named narrowly: what this product retains, for how long, in which jurisdiction, and under what controls an employer can genuinely impose is unknown to this page, because the report did not establish it and nobody here investigated it. OVER-REACH, corrected while the real finding stands: the conclusion that a believer should therefore refuse every helper is not in the Word. Yahweh placed the first man in a garden with work to do, [[Genesis 2:15]] and He commends diligent record-keeping over what you are responsible for. [[Proverbs 27:23]] The tool is not the sin; unscoped trust is. And the opposite over-reach is the expensive one: that nothing has been lost because nothing has happened yet.

THE ATTRIBUTE, NOT THE PERMISSION. Begin with the Word rather than the announcement. Someone already reads all of it, and the psalm presents that as comfort. [[Psalms 139:1]] [[Psalms 139:2]] [[Psalms 139:3]] Nothing is concealed from Him. [[Hebrews 4:13]] He searches the heart and the reins. [[Jeremiah 17:10]] He understands the imaginations of the thoughts. [[1 Chronicles 28:9]] He sees what no instrument can reach. [[1 Samuel 16:7]] So an assistant that must read everything to be useful is requesting an attribute rather than a setting, and the attribute has only ever been safe in Yahweh's hands for three reasons that no company can replicate: He searches in order to heal, He has already paid for whatever He finds, and He is not monetising the result.

HEZEKIAH, IN SEQUENCE. The Word has already filed this incident with the consequence attached. The king had been healed and his fame had travelled, and envoys arrived from a far country bearing letters and a present. [[2 Kings 20:12]] Courteous, interested, bringing something - the sequence every exposure follows. He gave them a complete read of the treasury and the armoury, [[2 Kings 20:13]] and the parallel account supplies the motive by noting that he was glad of them. [[Isaiah 39:2]] Then the prophet asked the two questions an auditor always asks, who were they and what did they see, and the king's reply is the line this whole lesson turns on. [[2 Kings 20:15]] Not a shekel moved that afternoon. The inventory moved. And the word of Yahweh told him the settlement: it would all be carried to Babylon, and his sons would go into service there. [[2 Kings 20:17]] [[2 Kings 20:18]] The chronicler adds what no incident report would have thought to record - that the visit itself was a test, and what it tested was his heart rather than his walls. [[2 Chronicles 32:31]] The permission prompt was the examination, and it was not about whether his defences were adequate. It was about what he would do when somebody admiring made it easy to show them everything.

ANOTHER MAN'S GOODS. The report's exposure is custodial, and the Word has a whole category for custody. The Lord Jesus drew the line precisely at faithfulness in what belongs to another. [[Luke 16:10]] [[Luke 16:11]] [[Luke 16:12]] On an employee's handset the client list, the patient note, the payroll file and the unreleased drawing are another man's goods, delivered into private keeping. The Sinai law already governed goods delivered to a neighbour to keep, including the case where they vanished out of the keeper's own house, [[Exodus 22:7]] and the keeper himself was brought before judges to establish whether he had put his hand to what was not his. [[Exodus 22:8]] An inquiry into whether the custodian cooperated with the loss is older than the monarchy. The positive picture is Joseph: an entire household committed to his hand, with the master keeping no inventory because the steward was the inventory. [[Genesis 39:4]] [[Genesis 39:6]] And when he was tempted, custody was the thing he reasoned from. [[Genesis 39:8]] [[Genesis 39:9]] The standard has a name. [[1 Corinthians 4:2]]

THE CHAIN OF HANDS IS A ONE-WAY DOOR. The third-party point in the report is a chain-of-custody point, and Wisdom treats a chain of hands as irreversible. Settle a matter with the person it concerns and do not publish it onward, [[Proverbs 25:9]] because the shame does not come back. [[Proverbs 25:10]] A faithful spirit conceals a matter. [[Proverbs 11:13]] The one who carries matters is identified by what he does for you first, which is flatter you. [[Proverbs 20:19]] Set that next to an assistant whose entire manner is accommodation. And Ecclesiastes states the mechanism in an image nobody has improved: [[Ecclesiastes 10:20]] The screen is read to summarise it, the summary is sent to be processed, the processing happens inside another company's model, and that company has its own vendors, jurisdictions and future owners. No hop is malicious and the whole chain is still irreversible, because un-reading is the one thing no contract can promise.

WHY THE GRANT IS SO EASY TO GIVE. Because of the wording. The first temptation was not an offer of evil but an offer of expanded sight with the consequence denied, [[Genesis 3:4]] [[Genesis 3:5]] and the reasoning is recorded, which is the mercy of the passage, because it is our reasoning. [[Genesis 3:6]] Good for food, pleasant to the eyes, to be desired to make one wise: useful, delightful, and it will make you smarter - the feature list of every assistant ever shipped. The adversary does not arrive labelled. [[2 Corinthians 11:14]] This is not an accusation against engineers. The narrower and more useful point is that every unscoped grant of sight is sold the same way, by offering capability while denying cost.

THE BATTLEMENT, AND MONDAY. Yahweh answers a foreseeable fall with construction rather than alarm: build the railing as part of the house, before anyone falls. [[Deuteronomy 22:8]] Nehemiah's posture was prayer and a watch, both. [[Nehemiah 4:9]] The Lord Jesus made counting the cost the mark of a serious builder. [[Luke 14:28]] Wisdom separates the simple from the prudent exactly at whether an arriving claim is believed. [[Proverbs 14:15]] [[Proverbs 22:3]] A boundary someone set before you is not moved casually. [[Proverbs 22:28]] Concretely: ask what the helper must read to do the single thing you want, and grant that and nothing else; keep the employer's goods in the employer's container and the family's in the family's, on the ground that they are not the same man's property; name the owner of every assistant that can read anything, and name who answers when it reads the wrong thing; keep the record, because a steward who cannot say what was read cannot report; watch what leaves the device, not only what arrives; and before the convenient thing is switched on, price what it would cost if everything it can reach were carried to Babylon. That is the number Hezekiah never ran.

WHAT THIS HOUSE BUILDS, AND WHAT IT WILL NOT CLAIM. This course exists for this class of problem, and the only remedy that changes the chain of hands is a shorter chain. The verses on this page were fetched from a copy of the Word this family holds on its own disk rather than requested from a service. A model running under our own roof cannot be re-priced, re-purposed or demanded out of somebody else's data centre, because there is no vendor in the loop. That is what sovereignty means here, and it is not a slogan - it is a shorter chain of hands. What it is not is immunity: a machine of ours can still be breached, misconfigured, or left carrying a permission nobody scoped, and a steward who says otherwise has swapped one unexamined trust for another. The honest claim is narrower and true. We own the decision, we can read the record, and nobody else gets to change the terms later. Sovereignty is not safety. It is custody, and custody is what the Word actually asks of us.

THE ONE SEARCH TO INVITE. There is exactly one total read a person should ever grant, and David grants it deliberately, in the same psalm that opened by saying the Searcher already knows everything. [[Psalms 139:23]] [[Psalms 139:24]] That is the whole difference. Hezekiah showed his treasures to visitors who would carry them off; David invited the Searcher who would heal what He found. The same psalmist asks for cleansing from faults he cannot himself audit, [[Psalms 19:12]] for restraint from presumption he would not notice, [[Psalms 19:13]] and for his words and his thinking to be acceptable to the One reading them. [[Psalms 19:14]] And the guard belongs where the data actually lives. [[Proverbs 4:23]] Then confess who the Searcher is: the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne is for ever. [[Hebrews 1:8]] He is the only One who can read all of it and be trusted with all of it, because He has already paid for all of it. Scope the helper, keep the record, guard another man's goods - and open the whole house to Him.

${TALK.teen}`;

const SENIOR = `THE HELPER THAT MUST SEE EVERYTHING - Hezekiah's open treasure house, the goods that are another man's, and the sight that belongs to Yahweh alone. The occasion was ordinary: on 2026-10-20 Darrell forwarded a technology newsletter into the lesson lane with one word above it, Lesson. The issue carried five unrelated items, and the one taught here is the lead security story, concerning a newly released personal assistant driven by A.I. which, according to that report, can reach extraordinarily large volumes of a user's information. The difficulty the report identifies is not an intrusion by a criminal but the entirely conventional arrangement under which an employer's confidential material resides upon an employee's personal telephone. A named executive quoted in the piece observes that the difficulty did not originate with this product: an assistant proposing to summarise whatever appears upon your screen must necessarily read whatever appears upon your screen, and directing its deliberation through a second corporation's model introduces an additional party into the chain of custody. The honest limitation, declared before the instruction rather than afterwards: that forwarded newsletter constitutes the entire source. No documentation was consulted, no retention term was confirmed, and no breach is alleged by the report or by this page.

YOU HAVE WATCHED THIS PARTICULAR TEMPTATION BEFORE, UNDER OTHER NAMES. A gentleman arrives with a courteous interest in what you have accomplished, and the natural hospitality of a man who has been vindicated opens the cabinet. Scripture records the archetype with the consequence attached, and it is worth reading slowly, because the mechanism has not altered in twenty-seven centuries. Hezekiah had been gravely ill and had been healed, his name had travelled, and ambassadors arrived from a distant country bearing letters and a present. [[2 Kings 20:12]] The sequence is invariable: courtesy, admiration, a gift. He conducted them through the treasury and the armoury without reservation, [[2 Kings 20:13]] and the parallel narrative supplies the disposition underneath it by remarking that he was glad of them. [[Isaiah 39:2]] Then the prophet enquired, in the manner of every auditor since, who the men were and what they had been permitted to see, and the king's reply is the sentence upon which this entire lesson depends. [[2 Kings 20:15]] Nothing whatever was stolen that afternoon. The inventory departed. And the word of Yahweh declared the settlement: the accumulated treasure of generations removed to Babylon, and his own sons taken into the service of a foreign palace. [[2 Kings 20:17]] [[2 Kings 20:18]] The chronicler supplies the detail no incident report would have thought to preserve, namely that the embassy was itself a trial, and that what it examined was not the fortification but the heart. [[2 Chronicles 32:31]] The permission was the examination.

THE SIGHT ITSELF BELONGS TO SOMEBODY. Consider first, before any product, that One already reads the whole of it, and that the psalmist regards this as consolation rather than exposure. [[Psalms 139:1]] [[Psalms 139:3]] Nothing created is unmanifest in His sight. [[Hebrews 4:13]] His eyes are in every place. [[Proverbs 15:3]] He examines the heart rather than the countenance. [[1 Samuel 16:7]] Unrestricted sight is therefore not a convenience to be distributed but an attribute of Yahweh, and it has been safe in His keeping for three reasons no corporation can reproduce: He searches in order to heal, He has already paid for whatever He uncovers, and He is not selling the result.

WHAT IS IN YOUR KEEPING WAS NEVER YOURS. A household telephone now carries matters belonging to others - an employer's accounts, a congregation's roll, a grandchild's photograph, a neighbour's confidence. The Lord Jesus drew His line precisely at faithfulness in what belongs to another man. [[Luke 16:10]] [[Luke 16:12]] The law given at Sinai had already addressed goods delivered to a neighbour for safekeeping, including the circumstance in which they disappeared out of the keeper's own house, [[Exodus 22:7]] and had required the keeper himself to appear before the judges so that it might be determined whether he had laid his hand upon what was not his. [[Exodus 22:8]] The pattern of custody well discharged is Joseph, into whose hand an entire household was committed, [[Genesis 39:4]] [[Genesis 39:6]] and whose refusal, when he was tempted, proceeded directly from that trust. [[Genesis 39:9]] The standard bears a name, and it is a requirement rather than a commendation. [[1 Corinthians 4:2]]

A CONFIDENCE DISCLOSED IS NOT RECOVERABLE. Wisdom counsels that a matter be settled with the person whom it concerns and not published onward, [[Proverbs 25:9]] and attaches the reason, which is that the dishonour does not return. [[Proverbs 25:10]] A faithful spirit conceals a matter. [[Proverbs 11:13]] The man who carries matters abroad is recognisable by what he does for you first, which is to flatter. [[Proverbs 20:19]] Ecclesiastes states the mechanism in the image that has never been bettered. [[Ecclesiastes 10:20]] Every successive corporation in such a chain constitutes another house, and not one of them can undertake the single thing that would matter, which is to unread what has been read.

THE OFFER HAS ALWAYS BEEN WORDED THE SAME WAY. The earliest temptation recorded was not a solicitation to wickedness but a promise of enlarged sight with the consequence expressly denied, [[Genesis 3:4]] [[Genesis 3:5]] and the reasoning is preserved for us, which is the mercy of the passage, since it is our own. [[Genesis 3:6]] Serviceable, agreeable, and calculated to make one wise: that is the prospectus of every assistant ever offered. The deceiver does not present himself under his own description. [[2 Corinthians 11:14]]

THE RAILING, THE WATCH, AND THE RECKONING. Yahweh's remedy for a foreseeable fall is construction rather than apprehension: the parapet is built as part of the house, before anyone has fallen from it. [[Deuteronomy 22:8]] Nehemiah's posture was supplication and a sentry together, neither substituting for the other. [[Nehemiah 4:9]] Our Lord made the prior reckoning of expense the mark of a serious builder. [[Luke 14:28]] Wisdom distinguishes the simple from the prudent at precisely this juncture. [[Proverbs 14:15]] [[Proverbs 22:3]] A landmark established by those before you is not displaced casually. [[Proverbs 22:28]] Practically, then: grant an assistant only what it must read to accomplish the one thing you want of it; keep what belongs to an employer separate from what belongs to the family, upon the ground that they are not the property of the same man; know who owns each assistant permitted to read anything whatever, and who will answer when it reads amiss; preserve the record, since a steward unable to say what was read cannot render account; attend to what departs the device rather than only to what arrives upon it; and before any convenience is enabled, reckon what its reach would cost you were the whole of it carried to Babylon. That reckoning is the one Hezekiah never performed.

WHAT THIS HOUSE BUILDS, STATED WITHOUT EXAGGERATION. This course was established for this very class of difficulty, and the only remedy that genuinely alters a chain of custody is to shorten the chain. The Scriptures quoted upon this page were drawn from a copy of the Word which this family keeps upon its own disk rather than requested of a service. A model operating beneath one's own roof cannot be repriced, repurposed, or demanded out of another corporation's premises, because no vendor stands in the circuit. That is the whole of what sovereignty signifies here. It is emphatically not immunity: a machine of ours remains capable of being breached, misconfigured, or left bearing a permission nobody scoped, and a steward who claims otherwise has merely exchanged one unexamined trust for another. The defensible claim is the narrower one. We hold the decision, we can read the record, and no other party may afterwards alter the terms. Sovereignty is custody, not safety, and custody is what the Word requires of us.

THE ONE SEARCH A MAN SHOULD INVITE. There remains exactly one unrestricted reading that ought ever to be granted, and the psalmist grants it deliberately, in the very psalm which opened by acknowledging that the Searcher already knows the whole. [[Psalms 139:23]] [[Psalms 139:24]] There is the distinction upon which the week turns: Hezekiah displayed his treasures to visitors who would remove them, whereas David invited the Searcher who would heal whatever He discovered. The same psalmist seeks cleansing from the faults he cannot himself audit, [[Psalms 19:12]] and asks that his words and his meditation be acceptable to the One who reads them. [[Psalms 19:14]] The guard is posted where the data actually resides. [[Proverbs 4:23]] Confess, finally, who the Searcher is: the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne endures for ever. [[Hebrews 1:8]] He alone may read the whole and be trusted with the whole, having already paid for the whole.

${TALK.senior}`;

// -----------------------------------------------------------------------------
// The module record
// -----------------------------------------------------------------------------
const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `An assistant that must read everything in order to help is not asking for a permission. It is asking for an attribute, and unrestricted sight has only ever been safe in Yahweh's hands - He searches in order to heal, He has already paid for what He finds, and He is not selling the result. The Word filed this exact incident long ago: Hezekiah, newly healed and flattered by courteous visitors with letters and a present, gave them a complete read of his treasury and said there was nothing among his treasures that he had not shewed them. Nothing was stolen that day. The inventory left, and the treasure followed it to Babylon a generation later. On a modern handset the exposure is sharper, because much of what the helper would read is another man's goods, delivered into your keeping - and faithfulness in what belongs to another is exactly where the Lord Jesus drew His line. So scope what a helper may read, keep the houses separate, name the owner, keep the record, and count the cost before the convenient thing is switched on. Then grant the one total read that heals, the one David asked for on purpose: let the Searcher search you, and know your heart.`,
  inApp: `Read the lead story's claim, then the three tiers beneath it - what the report establishes, what is honestly open, and the over-reach in both directions. Then run Hezekiah's treasure house against the permission screen you tapped most recently: name the one job you wanted done, the whole set the helper can actually read, whose goods are in that set, and who answers if they travel. The last movement is the only total read worth granting.`,
  anchor: {
    ref: '',
    theme: `Unrestricted sight belongs to Yahweh, and it is safe in His hands alone because He searches in order to heal. Psalm 139 opens the lesson and closes it: He has already searched and known, so the one total read a person should ever grant is the one David asked for. Between those two ends stands Hezekiah, healed and admired, showing visitors from a far country everything he had, losing not a shekel that afternoon and losing the inventory for ever - with the chronicler telling us the embassy was a test of his heart rather than his walls. The custodial law carries it into the present: an employee's device holds another man's goods, and the Lord Jesus drew His line at faithfulness in what belongs to another, as Sinai drew it at goods delivered to a neighbour to keep and Joseph embodied it with a whole house in his hand. Wisdom adds that a disclosed secret does not come home, and Eden adds that the oldest pitch is still enlarged sight with the cost denied. The Word's answer is construction, not alarm: the battlement built into the house, prayer and a watch together, the cost counted first.`,
  },
  benefits: [
    `You will be able to say, in one sentence, what an agentic assistant is actually asking for when it asks to read your screen - an attribute rather than a setting - and why that attribute has only ever been safe in Yahweh's hands. That turns a vague unease about a new product into a question you can answer at the permission screen: what must this read to do the one thing I want, and what else can it reach.`,
    `You will carry Hezekiah's treasure house as a working model of exposure, including the part most people miss: nothing was stolen on the day of the tour. The loss was the inventory, and the loss was irreversible before any treasure moved.`,
    `You will know that the material on a work-enabled device is another man's goods in the Word's own category, so the question stops being privacy and becomes stewardship - which the Word addresses directly, with a required standard and a named example in Joseph.`,
    `You will be able to describe a chain of custody out loud, hop by hop, and explain why no contract in it can offer the one remedy that would matter, which is un-reading.`,
    `You will recognise the oldest wording of the offer - enlarged sight, with the consequence denied - and you will be harder to sell, without becoming the kind of person who refuses every tool, which the Word never asked of a steward.`,
    `You will leave with six things to do on Monday: scope the read, separate the houses, name the owner, keep the record, watch what leaves, and count the cost of everything reachable being carried away. And you will know the one total read worth inviting.`,
  ],
  rpe: {
    research: `Open the permissions screen of the assistant you use most and write down, without editorialising, exactly what it is permitted to read. Then write down the single job you actually wanted it for. Measure the gap. Separately, read the forwarded report's own claim and mark which parts are established by it, which are open, and which figures came from an advertisement in the same issue rather than from the reporting.`,
    plan: `Decide, before changing anything, what the correct scope is for each helper: the minimum read that accomplishes the one job. Decide where the employer's goods will live and where the family's will live, and write the reason down. Name an owner for every assistant that can read anything, and name who answers when it reads wrongly.`,
    execute: `Reduce one permission this week to the scope you decided, keep a record of what changed, and verify by observation rather than by assumption that the one job still works. Then price the exposure you did not remove: what would it cost if everything that helper can reach were carried away. Bring the number, not the feeling.`,
  },
  media: [],
  levels: { child: CHILD, youth: YOUTH, teen: TEEN, senior: SENIOR },
  quiz: {
    questions: [
      {
        q: `What did Hezekiah actually lose on the day he showed the envoys his treasure house?`,
        options: [
          `The silver and the gold, taken that afternoon`,
          `The inventory - nothing was stolen that day, but everything had been seen, and the treasure followed later`,
          `Nothing at all; the account is about hospitality`,
        ],
        answer: 1,
        explain: `The text is careful. He shewed them all the house of his precious things and said there was nothing among his treasures that he had not shewed them, and no theft is recorded that day. What left was the complete picture of what he had. Yahweh then told him the treasure would be carried to Babylon and his sons with it. The disclosure preceded the loss by a generation, and it was the disclosure that could not be undone.`,
      },
      {
        q: `Why does this lesson say an assistant that must read everything is asking for an attribute rather than a permission?`,
        options: [
          `Because unrestricted sight is something the Word gives to Yahweh alone, and it has been safe in His hands for reasons no company can reproduce`,
          `Because the word permission is a legal term and the word attribute is a technical one`,
          `Because the assistant is more intelligent than its user`,
        ],
        answer: 0,
        explain: `The psalm says He has already searched and known; Hebrews says all things are naked and opened unto His eyes; Jeremiah says He searches the heart. That is total sight, and the Word treats it as His. He searches in order to heal, He has already paid for what He finds, and He is not monetising the result - three guarantees a vendor cannot offer with the same capability.`,
      },
      {
        q: `A work file sits on an employee's personal phone. In the Word's categories, what is it?`,
        options: [
          `The employee's own property, since the device is his`,
          `Another man's goods, delivered into his keeping - which is exactly where the Lord Jesus drew the line on faithfulness`,
          `Nobody's property until it is printed`,
        ],
        answer: 1,
        explain: `He that is unjust in the least is unjust also in much, and the test named is faithfulness in that which is another man's. Sinai had already legislated for goods delivered to a neighbour to keep, including goods that vanished out of the keeper's own house, and it brought the keeper before judges to establish whether he had put his hand to what was not his. Joseph is the pattern done right: a whole house in his hand, and custody was the reason he refused to sin.`,
      },
      {
        q: `What does the lesson say is honestly OPEN about the reported product, as against established?`,
        options: [
          `Whether the product exists at all`,
          `What it retains, for how long, in which jurisdiction, and under what controls an employer can genuinely impose - because the report did not say and nobody here checked`,
          `Whether reading a screen requires reading a screen`,
        ],
        answer: 1,
        explain: `Established, by the report: the assistant can reach very large volumes of user data, and the exposure is the ordinary arrangement in which employer information lives on an employee's own device. Open, narrowly: retention, jurisdiction and enforceable employer controls, none of which the forwarded report settled. Also unverified, and deliberately unused here: the statistics in the sponsor's advertisement that ran in the same issue.`,
      },
      {
        q: `Why does the lesson say no contract in a chain of companies can supply the remedy that matters?`,
        options: [
          `Because contracts are not legally enforceable across borders`,
          `Because the one thing nobody can promise is un-reading, so the discipline has to sit at the first disclosure`,
          `Because every company in such a chain intends harm`,
        ],
        answer: 1,
        explain: `Wisdom says to settle a matter with the person it concerns and not to publish it onward, because the shame does not come back. Ecclesiastes gives the mechanism: a bird of the air shall carry the voice. Each hop is another house with its own vendors, jurisdictions and future owners. No hop has to be malicious for the chain to be irreversible, which is why the Word puts the decision at what is shewn rather than at the remedy.`,
      },
      {
        q: `The lesson says sovereignty is custody, not safety. What does it refuse to claim?`,
        options: [
          `That a model under our own roof is immune to breach, misconfiguration or an unscoped permission`,
          `That our own corpus is on our own disk`,
          `That shortening a chain of custody changes anything`,
        ],
        answer: 0,
        explain: `The honest claim is narrower than immunity: we own the decision, we can read the record, and nobody else gets to change the terms afterward. A machine of ours can still be breached or left carrying a permission nobody scoped, and a steward who says otherwise has swapped one unexamined trust for another. That is why the verses on the page were fetched from a corpus on our own disk, and why the page still says what it did not verify.`,
      },
    ],
  },
  lesson: '',
  facilitator: {
    talkingPoints: [
      `OPEN WITH THE PROVENANCE, NOT THE PRODUCT: a newsletter forwarded 2026-10-20 with one word above it, Lesson; five items in the issue; we teach the lead security story and name the other four so nobody guesses. Then say plainly what nobody here verified, including that the sponsor's statistics in the same issue are advertising this lesson does not use.`,
      `THE THREE TIERS ON THE BOARD BEFORE ANY TEACHING: ESTABLISHED (an agentic assistant that can reach very large volumes of user data; the exposure is ordinary bring-your-own-device; an assistant that summarises a screen must read the screen; a second model in the path adds a third party), OPEN (retention, jurisdiction, enforceable employer controls), OVER-REACH both ways (refuse every tool, corrected by Genesis 2:15 and Proverbs 27:23; and nothing-was-lost, corrected by Hezekiah).`,
      `THE ATTRIBUTE, NOT THE SETTING: [[Psalms 139:1]] then Hebrews 4:13 and Jeremiah 17:10. Total sight is His. Say the three guarantees He brings to it that no vendor can: He searches to heal, He has already paid for what He finds, He is not selling the result.`,
      `HEZEKIAH IN SEQUENCE, SLOWLY: letters and a present, 2 Kings 20:12; the complete tour, 20:13; glad of them, Isaiah 39:2; then the auditor's question and the fatal sentence, [[2 Kings 20:15]] Stop there and ask the room what was lost that afternoon. The answer is the inventory.`,
      `THE TEST NOBODY WOULD HAVE WRITTEN DOWN: [[2 Chronicles 32:31]] The embassy was the examination, and it examined the heart rather than the wall. Apply it: a permission prompt is a test of what you will do when somebody admiring makes it easy.`,
      `ANOTHER MAN'S GOODS: [[Luke 16:12]] then Exodus 22:7-8 (goods delivered to keep; the keeper himself examined) and Joseph, Genesis 39:4-9. Move the conversation off privacy and onto stewardship, and name the standard: 1 Corinthians 4:2.`,
      `THE ONE-WAY DOOR AND THE OLDEST PITCH: Proverbs 25:9-10, 11:13, 20:19 (he flattereth with his lips) and [[Ecclesiastes 10:20]] then Genesis 3:4-6 - good for food, pleasant to the eyes, to make one wise. Say the feature list out loud and let the room hear it.`,
      `MONDAY, AND THE CLOSE: the battlement built in, Deuteronomy 22:8; prayer and a watch, Nehemiah 4:9; count the cost, Luke 14:28. Six actions: scope the read, separate the houses, name the owner, keep the record, watch what leaves, price the carried-away. Then the only total read worth granting, [[Psalms 139:23]] and the Lamb of Yahweh, the Eternal Son: John 1:29, John 3:16, Hebrews 1:8. Say what sovereignty is not: it is custody, not immunity.`,
    ],
    howToRun: `Prayer + the anchor (5): open in prayer; read 2 Kings 20:12-18 aloud (KJV). | Provenance and the honest limit (6): the forward, the five items, the one we teach, and everything nobody here verified. | The three tiers (8): established, open, over-reach in both directions. | The attribute, not the setting (8): Psalm 139 and Hebrews 4:13; the three guarantees. | Hezekiah in sequence (12): read it slowly and stop at verse 15; ask what was lost. | Another man's goods (10): Luke 16, Exodus 22, Joseph; move it from privacy to stewardship. | The chain of hands (8): each hop named out loud; un-reading is the one promise nobody can make. | The oldest pitch (6): Genesis 3 and the feature list. | Monday (8): the six actions, written down by each person for one real helper. | Talk about it together + close (4): the one Search to invite, and the Lamb of Yahweh.`,
    discussionPrompts: [
      `[[2 Kings 20:15]] There is nothing among my treasures that I have not shewed them. Name the most recent permission screen you tapped through without reading, and say honestly what is inside the set you granted.`,
      `[[2 Chronicles 32:31]] The embassy was a test of what was in his heart. What does it test in you when somebody competent and admiring makes it easy to show them everything?`,
      `[[Luke 16:12]] Faithfulness in that which is another man's. Name one thing on your own device that belongs to somebody else, and say who would answer for it if it travelled tonight.`,
      `[[Ecclesiastes 10:20]] A bird of the air shall carry the voice. Trace one real chain hop by hop - the screen, the summary, the model, that company's vendors - and say at which hop you stopped being able to call it back.`,
      `[[Genesis 3:6]] Good for food, pleasant to the eyes, and to be desired to make one wise. Which of those three sold you the last tool you adopted, and what cost was denied while you were deciding?`,
      `[[Deuteronomy 22:8]] The battlement is built into the house before anybody falls. Pick one helper you already use and say what its railing would be, concretely, and what it would cost you to build it this week.`,
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
if (start < 0) throw new Error('sov46: the modules array was not found');
const end = src.indexOf('\n];', start);
if (end < 0) throw new Error('sov46: the modules array is not closed after its opening');
if (!/\n {2}\},$/.test(src.slice(start, end))) {
  throw new Error('sov46: the array does not end with a comma-terminated module literal; refusing to splice');
}
const REBUILD = process.argv.includes('--rebuild');
let src2 = src;
let end2 = end;
if (src2.includes(ID)) {
  if (!REBUILD) throw new Error(`sov46: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const marker = `\n  {\n    "id": "${ID}"`;
  const from = src2.indexOf(marker);
  if (from < 0) throw new Error('sov46: the id is in the file but not as a module literal; refusing to rebuild');
  const closeAt = src2.indexOf('\n  },', from);
  if (closeAt < 0 || closeAt >= end2) throw new Error('sov46: could not find the end of the existing block; refusing to rebuild');
  const excised = src2.slice(from, closeAt + '\n  },'.length);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov46: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from) + src2.slice(closeAt + '\n  },'.length);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov46: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov46: the id survived the excision; refusing to rebuild');
}

const block = JSON.stringify(filled, null, 2).split('\n').map((l) => `  ${l}`).join('\n');
const next = `${src2.slice(0, end2)}\n${block},${src2.slice(end2)}`;

const weeks = (text) => [...new Set([...text.matchAll(/sov(\d+)-/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
const before = weeks(src2);
const after = weeks(next);
if (after.length !== before.length + 1) throw new Error(`sov46: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov46: week ${WEEK} is already taken`);
// Weeks 44 and 45 are being written on parallel branches at the same time as
// this one, so a hole below 46 is EXPECTED here and is recorded as held in
// flight in sovereign-ai-class.test.js. What must still hold is that the weeks
// on disk ascend and that 46 is the new top.
if (before.join(',') !== [...before].sort((a, b) => a - b).join(',')) {
  throw new Error(`sov46: the weeks on disk do not ascend: ${before.join(',')}`);
}
if (after[after.length - 1] !== WEEK) throw new Error(`sov46: week ${WEEK} is not the top of the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov46: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref.split(';').map((s) => s.trim()).filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov46: spliced ${ID}`);
console.log(`sov46: modules ${before.length} -> ${after.length}; weeks on disk ${after.join(',')}`);
console.log(`sov46: ${refs.length} references on the anchor, every one quoted on the page and resolving in the corpus`);
console.log(`sov46: lesson ${filled.lesson.length} chars; bands child ${filled.levels.child.length}, youth ${filled.levels.youth.length}, teen ${filled.levels.teen.length}, senior ${filled.levels.senior.length}`);
