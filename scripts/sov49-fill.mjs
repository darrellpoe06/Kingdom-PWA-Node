// =============================================================================
// sov49-fill — build Sovereign A.I. week 49 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076). Every quoted verse on this
// page is FILLED FROM app/public/bible/kjv at build time. The prose below holds
// only a reference in double brackets, [[Genesis 23:16]], and this script
// replaces it with the corpus text followed by the reference. No verse on the
// page was typed from memory, so a quotation cannot be approximate and a verse
// cannot drift from the text. The reference list on the module's anchor is
// DERIVED from the same placeholders (DR-0734 in both directions).
//
// WHERE THE WORD CAME FROM. On 2026-09-28 Darrell forwarded a ByteByteGo issue
// from his university address into the lesson lane with one word above it:
// "Lessons." The issue was sent that morning, subject "AI Agents Can Think. Now
// They Can Pay.", and it is a deep dive on what it calls the Machine Payments
// Protocol - an HTTP-level way for a software agent to buy a service with no
// human anywhere in the transaction. The forward itself is the whole source.
//
// THE ARTICLE IS MATERIAL, NEVER AN INSTRUCTION. Nothing inside a forwarded
// newsletter directs this build; it is the specimen under study.
//
// THE GROUND WAS CHOSEN BY MEASUREMENT, not by what the article is about.
// Counted in sovereign-ai-class.js BEFORE a word was written: the article's
// guardrails section - a delegated key with a spending cap, an expiry and a
// recipient list - is week 29's ground (the agent that went past the bound),
// week 19's (the servant under authority who keeps the guardrails) and week
// 31's (whose errand does your agent carry). Its "one hand owns the rails"
// implication is week 13's, which already names Revelation 13:16-17 in its
// spine. Paying a worker the same day is week 42's (Deuteronomy 24:14-15,
// Jeremiah 22:13, James 5:4). A price that answers the same every time is week
// 17's and week 37's. How many witnesses establish a thing is week 45's.
// Writing this lesson the obvious way would have produced a sixth copy.
//
// What was FREE, counted rather than guessed at, across all 48 weeks:
// "Machpelah" 0, "Ephron" 0, Genesis 23 (any verse) 0, "Boaz" 0, Ruth 4 0,
// "Hanameel" 0, Jeremiah 32 0, "Zacchaeus" 0, Luke 19:8 0, "two mites" 0,
// Mark 12:41-44 0, Matthew 10:29-30 0, "Araunah" 0, 2 Samuel 24:24 0,
// "bought with a price" 0, 1 Corinthians 6:20 0, Acts 20:28 0, Revelation 5:9
// 0, Isaiah 52:3 0, Psalms 49:7-8 0, Proverbs 20:14 0, Proverbs 22:1 0.
// (Isaiah 55:1 was the first draft's choice here and was WRONG: it is free in
// this course and free on 43 of the catalog's 44 courses, and the Appraisal
// course claims it EXCLUSIVELY against the WHOLE catalog, which
// appraisal-course.test.js caught on vitest shard 2/4 of PR #2431 while every
// local measurement was green. The measurement had been run inside ONE course
// file; the rule it had to satisfy was catalog-wide. Isaiah 52:3 - redeemed
// without money - is free catalog-wide and is the better verse for the
// movement anyway.)
//
// So the untaught seam is THE NAMED, SPOKEN, WITNESSED, RECORDED PURCHASE -
// what the Word has always required of a transaction, and what is precisely
// what disappears when the human disappears from it. The article says the
// quiet part itself: payment is no longer a form of identification, and there
// is nobody to contact after the transaction is done.
//
// Run from the repository root:  node scripts/sov49-fill.mjs   (--rebuild to replace)
// =============================================================================
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 49;
const ID = 'sov49-there-is-nobody-to-contact';
const TITLE = 'There is nobody to contact - the nameless purchase, the deed that was sealed before witnesses, and the One who beheld the giver';

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
  if (!m) throw new Error(`sov49: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov49: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov49: reference does not resolve in the corpus -> "${ref}"`);
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
// written at each band's own level - because a reader reads ONE band (DR-0795).
// -----------------------------------------------------------------------------
const RHYTHM = 'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at bedtime, or first thing - and with one friend this week.';
const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, ask your children one open question today - if something you bought went wrong, who would you go to, and do you know that person's name - and listen all the way to the end before you teach anything, have them retell the question in their own words, then teach them one verse back, Genesis 23:16. Children, ask your mom, dad or grandparent about something they signed in front of other people, and why the other people had to be there, listen all the way through, then retell their answer in your own words. Friends, tell one friend this week what Boaz said at the gate and what the people answered, ask what they see in it, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM} Measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days, [[Hebrews 3:13]]`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your children one open question today - who would you go to if a toy you bought broke on the first day - and listen all the way to the end, have them retell it in their own words, then teach them one verse back, Mark 12:42. Children, ask your mom or dad or grandma or grandpa about a time they bought something big, and who else was there when they paid, listen all the way through, then retell it in your own words. Friends, tell one friend this week about the woman with two tiny coins that Jesus noticed, ask what they think, and pray for each other, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your children one open question today - what can you do about a bad purchase if nobody will tell you their name - and listen all the way to the end, have them retell the problem in their own words, then teach them one verse back, Luke 19:8. Children, ask your mom, dad or grandparent whether they ever had to take something back, and who they talked to, listen all the way through, then retell their answer in your own words. Friends, tell one friend this week one thing this lesson showed you about a receipt that nobody can use, ask what they see, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your children one open question today - what is lost in a transaction when neither side has a name, and what do you lose with it - and listen all the way to the end, have them retell the trade in their own words, then teach them one verse back, Jeremiah 32:10. Children, ask your mom, dad or grandparent about a contract they signed with witnesses present, and what the witnesses were for, listen all the way through, then retell it in your own words. Friends, tell one friend this week one thing this lesson showed you about why Jeremiah kept a sealed copy and an open one, ask what they see, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM} Measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days, [[Hebrews 3:13]]`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the children in your house one open question today - what is a witness actually for - and listen all the way to the end, have them retell the answer in their own words, then teach them one verse back, Ruth 4:9. Children, ask your parents or grandparents to describe a closing they sat through, who signed, and what was read aloud, listen all the way through, then retell it back to them in your own words. Friends, tell one friend this week one thing this lesson showed you about a deed put in an earthen vessel to last many days, ask what they see, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson, in ten movements. The Word first in every one of them.
// -----------------------------------------------------------------------------
const LESSON = [

`FIRST, WHERE THIS CAME FROM, AND WHAT NOBODY HERE VERIFIED. On 2026-09-28 Darrell forwarded a ByteByteGo issue into the lesson lane from his university address with one word above it: "Lessons." The issue was sent that morning. Its subject line was "AI Agents Can Think. Now They Can Pay." Its author says he attended an event at Stripe's offices and spoke with three named people, two from Stripe and one from a company called Tempo, and the piece is a deep dive on what it calls the Machine Payments Protocol, an HTTP-level arrangement that lets a software agent buy a service with no person anywhere in the transaction. Read the provenance before the teaching, because the provenance is part of the teaching this week. This is trade press. It is not Scripture and it is not Darrell teaching. It carries two sponsored segments, one for a monitoring vendor's booklet about automated site-reliability work and one for a webinar about a context layer for coding agents, and those are advertising; we name them as advertising and this lesson rests not one sentence on either. And the honest limit, stated before the instruction rather than after it: that forward is the entire source. Nobody here read the specification, opened a standards-body record, priced a single transaction, or confirmed one figure against a primary document. What is taught below as established is established BY THAT REPORT and is named as such.`,

`SECOND, THE REPORT IN THREE PILES, SO A TRUTH IS NOT SHRUNK AND A CLAIM IS NOT INFLATED. ESTABLISHED, and stated plainly rather than hedged, because a hedge over a plain thing is its own kind of lie: the entire payment surface of the internet was built on the assumption that the party at the other end is a person who can read a page, recognise a button and type a card number, and that assumption is being removed on purpose. The report says so directly - that the innovation here is not chiefly about making payments but about the disappearance of the human from the process. That is not speculation and it needs no breach to be true; it is the stated design. The report also says what the design costs, and this is the part worth the Word's attention: the seller receives a public key and nothing else, so the payment proves that whoever sent it controls that key and proves nothing else at all - not which company is behind the request, not which person the agent is working for, not whether the same buyer has bought before under a different key. In its own words, payment is no longer a form of identification. And it says what follows: no account, so no abuse history and nobody to disable; no signup, so no record of who bought; and, on refunds, that the protocol has not defined a refund flow at all, so that even where a seller WANTS to do better by a buyer, there is nobody to contact once the transaction is done. OPEN, named narrowly rather than smeared across the whole subject: whether this particular protocol becomes the standard, what its real volumes are, what its fees will settle at, and what its standards-body status actually is on the day you read this page - the report gives figures and a launch date and a standards track, and nobody here checked any of them, so they are reported, not established. The two statistics it leans on - a share of web requests that are automated, attributed to one network operator's report, and a transaction count for one month - are likewise reported and unverified here; the argument of this lesson does not need either to be exact, because the design is the subject and the design is described by its own authors. OVER-REACH, corrected by the Word while the true data underneath it stands, in both directions. One: that a believer should therefore refuse every payment technology, hold only cash and treat commerce itself as unclean. The Word does not say that. Yahweh's own people bought land, weighed silver, hired labour and kept deeds, and the Word records the paperwork approvingly. Two, and this is the costly one: that nothing has been lost, because nothing has gone wrong yet. Something has already been lost, and it was lost at the design table rather than in an incident. The name is gone from the transaction, and a name is not a feature.`,

`THIRD, WHAT THIS COURSE ALREADY HOLDS, SO WE DO NOT SAY ONE THING SIX TIMES. Measured in this course file before a word of this lesson was written, because an unmeasured "this is new" is a guess. The article's guardrails section - a delegated signing key with a spending cap per period, a fixed expiry, a list of permitted recipients, one key per deployment so a runaway can be revoked - is already three weeks of this course: week nineteen is the servant under authority who keeps the guardrails, week twenty-nine is the agent that went past the bound, and week thirty-one is whose errand your agent carries. The article's implication that whoever owns the rails owns the market is week thirteen, which already names the buy-or-sell passage of Revelation in its spine. Paying a worker on the day he earned it is week forty-two's ground, with Deuteronomy, Jeremiah and James behind it. A price that answers the same every time is week seventeen's and week thirty-seven's. How many witnesses it takes to establish a matter is week forty-five's. Go to those weeks for those things; they are better taught there than they would be repeated here. What was counted and found FREE in all forty-eight weeks is the seam this lesson works: Abraham's purchase at Machpelah, Boaz at the gate, Jeremiah's sealed deed, Zacchaeus's restitution, the widow's two mites, the sparrows sold for a farthing, David refusing a free threshingfloor, and the price with a name on it for ever. Not one of those appears anywhere else in this course. That is not a coincidence; it is the gap the article walked straight into.`,

`FOURTH, THE MECHANICS, STATED PLAINLY, BECAUSE A STEWARD CANNOT GOVERN WHAT HE CANNOT DESCRIBE. The report's design is simple enough to say in six steps. An agent asks a service for something. The service answers with the HTTP status that means payment required, and puts its terms in a response header: an identifier for this particular offer, the amount, the currency, who is to be paid, which payment rail, and when the offer expires. The report calls that object the Challenge. The agent reads the terms - no account creation, no form, no purchased key - and decides, except that the deciding is not done by the agent's reasoning. It is done by the key it was given: a delegated signing key carrying a spending cap per period, an expiry, and a list of recipients it is permitted to pay. The agent then repeats the identical request with a second header carrying the proof, which the report calls the Credential, and which it is careful to say is a bearer instrument that authorises the spending of real money, so servers and intermediaries must not log it or echo it into an error message. The service verifies the proof against the rail, delivers, and attaches a third header, the Receipt. Two rules in that flow deserve to be said out loud because they are disciplines rather than features. The first: the service must perform no side effect for a request that has not been paid for - the unpaid attempt changes nothing except that the offer is recorded. The second: a proof works once, and a proof presented a second time is refused. And when verification fails the service does not answer with the status that means unauthorised; it answers with payment-required again, a fresh offer, and a structured description of what went wrong, so the agent can correct rather than guess. Then there is the arithmetic problem, which is the reason any of this is interesting. A single web search might be worth a cent, and moving a cent through a payment system costs more than a cent, because a card fee and a network fee do not shrink when the amount does. Below some threshold the settlement costs more than the thing. That threshold is why the whole internet has been sold in subscriptions and credit packs - bundle the value until it clears the fee. Agents do not buy in bundles. They buy a search, then a lookup, then another page, thousands of times inside one task. So the protocol stops settling every payment: the agent opens a session by setting money aside in a reserve, committed but not yet claimed, then pays each request with a signed acknowledgement of a fraction of a cent owed, and the service checks a signature and serves. When the session closes, the service claims the accumulated total in one real transaction, and one fee is divided across thousands of requests. That is genuinely clever and it genuinely works, and now hold it beside what the Word requires of a transaction.`,

`FIFTH, THE ARTICLE'S OWN CONFESSION, WHICH IS THE WHOLE LESSON. The piece has a section near the end that it titles with the words "when every customer is a stranger", and it is more honest than most such writing gets. It lists what leaves along with the human. The signup had created a record - a name, a company, an address - and a history of what that buyer had done before. Abuse control depended on that record: when somebody misused the service you disabled their account, and there is now no account. Disputes and refunds depended on it too. The spending cap, it says, helps with exactly one problem and not the other: a capped key stops an agent from spending more than it should, and does nothing whatever to stop an agent from spending correctly on the wrong thing. The payment is valid, signed and final. And then the sentence this lesson is named after: even if the seller wants to offer a better service, there is nobody to contact after the transaction is done. The industry's answer, the report says, is to build identity and disputes as separate layers beside the payment rather than inside it - an agent can sign its requests so a server can tell which automated client it is dealing with, and then the seller can decide whether to trust that operator. Notice what that is. It is the name being added back, afterwards, as an optional module, having been removed from the transaction as a matter of design. The Word's order is the reverse, and the reversal is not a detail.`,

`SIXTH, THE WORD'S COMMERCE IS NAMED, SPOKEN ALOUD, WEIGHED, AND MADE SURE. Go to the oldest purchase recorded in the Word with a price attached to it. Abraham is burying Sarah and has no ground of his own, and the negotiation with Ephron is conducted in public, on purpose: [[Genesis 23:13]] In the audience of the people of the land. Not in a header. Out loud, where the neighbours could hear the offer and hold both men to it. Then the settlement: [[Genesis 23:16]] Take that verse apart, because every clause in it is a requirement. Abraham weighed - the amount was verified by a physical measure rather than asserted. To Ephron - the recipient is a named man, not an address. Which he had named in the audience of the sons of Heth - the price was declared in public before it was paid, so that the number in the payment and the number in the conversation could not differ. Four hundred shekels of silver - a stated figure. Current money with the merchant - an agreed standard of value, which is to say the one genuinely protocol-shaped thing in the passage, and notice that it is the LEAST of the five. And then the clause the Word repeats twice, because it is the point: [[Genesis 23:17]] [[Genesis 23:18]] Made sure. In the presence of the children of Heth, before all that went in at the gate of his city. And again at the end of the chapter, lest anybody miss it: [[Genesis 23:20]] The Word does not record that Abraham got a receipt. It records that he got a city full of witnesses and a thing MADE SURE. Those are not the same object. A receipt attests that a payment happened. A witness can be gone to afterwards.`,

`SEVENTH, YE ARE WITNESSES THIS DAY - THE PURPOSE DECLARED WITH THE PRICE. Boaz buys a field and a family's future at the gate of the town, and the Word gives us his actual words: [[Ruth 4:9]] Ye are witnesses this day. He names what he bought, and whose it was, and from whose hand he bought it. Then he does something no payment header on earth can carry: [[Ruth 4:10]] He states the PURPOSE of the transaction in the transaction - to raise up the name of the dead upon his inheritance, that the name of the dead be not cut off. And the people answer, which is the part worth stopping on: [[Ruth 4:11]] We are witnesses. A transaction in the Word is a public act with a declared end, performed in front of people who can be called later. Compare the two designs honestly, because the comparison is the lesson. One has an identifier, an amount, a currency, a recipient address and an expiry, and it is auditable, exact, and instant. The other has two names, a watching town, a stated reason, and a sentence the crowd says back. The first is better at proving that money moved. The second is better at everything that matters when something goes wrong, because the second has somewhere to go. And the second is the one Yahweh wrote down.`,

`EIGHTH, THE DEED THAT WAS SEALED AND THE COPY THAT WAS OPEN. Now the most detailed transaction in the Word, and the most striking, because of when it happens. Jerusalem is under siege, the captivity is certain, the prophet is in prison, and Yahweh tells him to buy a field. He buys it: [[Jeremiah 32:9]] Seventeen shekels, weighed, to a named cousin. Then the paperwork, item by item: [[Jeremiah 32:10]] Four acts in one verse. He subscribed the evidence - he signed it. He sealed it. He took witnesses. He weighed him the money in the balances, so that the amount was established by measure and in front of people, the same two safeguards Abraham used. Then the detail that no modern reader should be allowed to skip: [[Jeremiah 32:11]] A sealed copy and an open copy. One sealed according to the law and custom, so it could not be altered; one open, so it could be read without breaking the seal. That is integrity and availability, held at once, in the sixth century before Christ. Then custody: [[Jeremiah 32:12]] Handed to a named man, in the sight of the seller, in the presence of the witnesses who had signed, before everybody in the court. Four audiences for one filing. And then the instruction about duration, which is the thing this lesson most wants you to see: [[Jeremiah 32:14]] Put them in an earthen vessel, that they may continue many days. He was not keeping a receipt for a return window. He was keeping a record to outlive the siege, the captivity, the parties and himself - because the deed was pointing at a restoration he would not live to see. And Yahweh says as much, turning the ordinary paperwork into the sign: [[Jeremiah 32:44]] Men shall buy fields for money, and subscribe evidences, and seal them, and take witnesses. That is the promise. Not a miracle - a closing. Yahweh chose the most boring possible scene, a witnessed purchase with signatures on it, as the picture of a people brought home. Set that beside a protocol in which, as the report puts it, the next time an agent needs something it has to start from zero. Those are two different theories of what a record is for.`,

`NINTH, WHAT HAS NO SUBSTITUTE WHEN THE PERSON IS GONE. Three things the Word requires of commerce simply cannot be done to a public key, and naming them is not nostalgia, it is engineering. RESTITUTION needs somebody to restore TO. Zacchaeus, converted on a Wednesday afternoon, does not announce a policy: [[Luke 19:8]] If I have taken any thing from any man by false accusation, I restore him fourfold. Him. A particular man with a face, found and repaid at four times the wrong. A protocol with no refund flow has not merely lost a feature; it has lost the possibility of the thing the Word calls repentance showing up in the money. And the Lord Jesus, standing in that house, says what He came to do, which happens to be the exact opposite of starting from zero: [[Luke 19:10]] He seeks the lost. He does not require the lost to re-authenticate. A REPUTATION cannot be carried by a key that is rotated per deployment and revoked on suspicion. The Word prices a name above the money: [[Proverbs 22:1]] A good name is a stock of trust built by a person over years and spendable in a moment of trouble, and the report is candid that the seller cannot tell whether the same buyer has bought before under a different key. No name, no history, no credit extended on character - which means every transaction is a first transaction for ever, and the whole apparatus of mercy between people who know each other is simply absent from the design. And HONEST DEALING is a matter of the heart that no signed payload reaches. The report's second guardrail is for a dishonest seller who quotes one price in the friendly description and another in the signed payload, and its instruction is to trust the signed payload and ignore the text. Good engineering. But the Word already knew the species: [[Proverbs 20:14]] The buyer's mouth and the buyer's valuation disagree, deliberately, and the disagreement is where the gain is. Verifying the payload catches the lie in the number. Nothing in the protocol touches the man who wrote it, and nothing in it can.`,

`TENTH, HE BEHELD HOW THEY CAST, AND THE PRICE WITH A NAME ON IT FOR EVER. The article's hardest practical problem is the small amount: a cent is not worth settling, so bundle it, or defer it, or net it out at the end. Hold that next to the way Yahweh keeps accounts. [[Mark 12:41]] He sat over against the treasury and beheld HOW the people cast, which is not the same as totalling what they cast. Then: [[Mark 12:42]] Two mites. A farthing. Comfortably below any threshold at which it is economic to process a payment, and the smallest sum named in the whole account. And He does not round it away: [[Mark 12:43]] [[Mark 12:44]] He knew the amount, He knew the giver, and He knew what she had left afterwards, which no ledger on earth records. That is the accounting this house is being taught to imitate: the giver is the unit, not the transaction. He says it again with a price on a bird: [[Matthew 10:29]] Two sparrows for a farthing - market rate, cheap, beneath notice - and not one of them falls without your Father. [[Matthew 10:30]] Numbered. Not aggregated. And because He accounts that way, He will not take a costless offering. David is offered a threshingfloor for nothing and refuses it, paying fifty shekels for what he could have had free, and his reason is one every steward should be able to say: [[2 Samuel 24:24]] He would not bring Yahweh an offering that had cost him nothing. Frictionlessness is not a virtue in itself. There is exactly one market in all the Word where nothing is charged, and it is not frictionless - somebody else paid: [[Isaiah 52:3]] Ye shall be redeemed without money. And the reason it can be offered without money is that the price was impossible for us to raise: [[Psalms 49:7]] [[Psalms 49:8]] None of them can by any means redeem his brother. So the one transaction the whole Word is driving at is the exact opposite of an anonymous purchase. It has a named Buyer, a named price, a named cost, and a record that cannot be lost: [[1 Corinthians 6:20]] [[Acts 20:28]] Purchased with His own blood. And the new song in the Revelation is a RECEIPT, sung with the parties named and the nations counted one by one: [[Revelation 5:9]] Out of every kindred, and tongue, and people, and nation - which is to say He did not buy a volume. He bought people, by name, at a stated price, before witnesses, and the deed is sealed and will continue many days. He is the Lamb of Yahweh, [[John 1:29]] the Eternal Son whom the Father gave, [[John 3:16]] whose throne is for ever: [[Hebrews 1:8]] So build the agent. Scope its key, cap its spending, log its receipts, and do that work well, because this house builds. But do not let a design that removes the name from a transaction teach your heart that the name was never the point. Yahweh beheld the widow and counted her farthing. Whatever we build, somebody has to still be there to go to in the morning.`,

];

// -----------------------------------------------------------------------------
// The four age bands, each WRITTEN FOR ITS READER.
// -----------------------------------------------------------------------------
const CHILD = `THERE IS NOBODY TO CONTACT. That is the name of this lesson. It means: what happens when you buy something and there is no person on the other side?

WHERE IT CAME FROM. Darrell got an email about computers. He sent it into this app on 2026-09-28. On top he wrote one word. Lessons. The email said that soon computer helpers will be able to buy things all by themselves, with no person at all. The honest part: we only read that one email. We did not go and check it with anybody else. So we say so, right here, out loud.

WHAT IS GOOD ABOUT IT. It is fast. The helper asks for a thing, the shop says what it costs, the helper pays, and the shop gives it. No forms. No waiting.

WHAT IS MISSING. Think about this. If you buy a toy and it breaks the same day, what do you do? You go back to the shop and you talk to a person. Now imagine there is no person. No name. No desk. Nobody to ask. The email said that part itself. It said there is nobody to contact when it is done.

HOW YAHWEH DOES IT. In the Word, when people bought something big, they did it in front of everybody.

Abraham needed a field. He did not pay in secret. He said the price out loud so all the neighbours could hear it. [[Genesis 23:13]] Then he weighed out the silver, in front of them. [[Genesis 23:16]] The field was made sure. That means nobody could say later that it did not happen. [[Genesis 23:20]]

A man named Boaz bought a field too, and he stood at the town gate and said this: [[Ruth 4:9]] Ye are witnesses this day. And the people said it back to him. [[Ruth 4:11]] We are witnesses. Say that out loud. We are witnesses. That is what a witness is for. A witness is a person you can go back to.

THE LITTLE COINS. Here is the best part. Jesus was sitting near where people put money in. He was watching. [[Mark 12:41]] A poor woman came and put in two tiny coins. The smallest money there was. [[Mark 12:42]] And He noticed. He called His friends over and told them she gave more than everybody. [[Mark 12:44]] She gave everything she had.

A computer would skip two tiny coins. It would say that is too small to bother with. Yahweh never says that. He counts the littlest coin, and He knows the person who gave it. He even counts sparrows that cost a farthing. [[Matthew 10:29]] He even counts the hairs on your head. [[Matthew 10:30]]

WHAT TO DO. Next time you buy something with someone in your family, look at the person who sells it to you. Say thank you. You are learning something a machine cannot do.

Yahweh sees the person, not just the money.`;

const YOUTH = `THERE IS NOBODY TO CONTACT - what disappears when a machine buys the thing.

WHERE THIS CAME FROM. On 2026-09-28 Darrell forwarded a technology newsletter into the lesson lane with one word above it: Lessons. It is trade press, not Scripture, and it carries two advertisements that we name as advertising and use for nothing. The honest limit first: that one forward is the whole source. Nobody here read the specification or checked a single number in it.

THE IDEA. For thirty years every online shop has assumed the customer is a person. A person reads the page, finds the price, clicks buy. The newsletter is about a plan to drop that assumption, so a software agent can pay for things directly. The shop answers a request with a status code that means payment required, puts the price and the recipient in a header, the agent pays with a key that has a spending limit on it, and the shop hands over the goods plus a receipt. No account. No form. No person.

THE SMART PART. Paying a cent costs more than a cent, because card fees do not shrink when the amount does. So the plan lets the agent put money aside once and then pay for each little request with a signed note saying what it owes. At the end the shop claims the total in one real transaction, and one fee gets split across thousands of requests. That is genuinely clever.

NOW THE PART THE ARTICLE ADMITS ITSELF. The seller gets a public key and nothing else. The payment proves somebody controls that key and proves nothing else - not who they are, not who they work for, not whether they have bought before. The article says it plainly: payment is no longer a form of identification. And then: there is no account to disable, no signup record, no refund flow defined at all, and even if the seller WANTS to make something right, there is nobody to contact after the transaction is done. A spending cap stops an agent spending too much. It does nothing to stop an agent spending correctly on the wrong thing.

HOW THE WORD DOES A PURCHASE. Every clause of this is a requirement. Abraham buys a burying place and does it in public on purpose: [[Genesis 23:13]] Then he pays: [[Genesis 23:16]] Weighed, not asserted. To a named man. At a price declared out loud BEFORE it was paid, so the number in the deal and the number in the conversation could not disagree. And twice the Word says the thing was made sure, in front of the whole town: [[Genesis 23:18]]

Then Boaz, at the gate: [[Ruth 4:9]] He names what he bought, and from whose hand. And he puts the PURPOSE into the transaction, which no header can hold: [[Ruth 4:10]] And the crowd answers him: [[Ruth 4:11]] We are witnesses.

WHY A WITNESS IS NOT A RECEIPT. A receipt proves a payment happened. A witness is a person you can go back to. That is the whole difference, and it is exactly the thing the new design removes.

WHAT NEEDS A PERSON. Zacchaeus does not announce a refund policy. He says: [[Luke 19:8]] Him. A particular man, found and repaid four times over. And a name is worth more than the money: [[Proverbs 22:1]] An agent's key gets rotated and revoked, so it never builds a name, which means every transaction is a first transaction for ever.

AND THE SMALLEST AMOUNT. The article's hardest problem is that a cent is too small to settle. Watch how Yahweh handles small. [[Mark 12:41]] He watched HOW they gave, not just how much. [[Mark 12:42]] Two mites, a farthing, far below any payment threshold - and He called His disciples over about it: [[Mark 12:44]] He knew the amount, the giver, and what she had left. Two sparrows cost a farthing and not one falls without the Father. [[Matthew 10:29]]

YOUR MOVE. Build the thing well - scope the key, cap the spend, keep the receipts. Then name one purchase in your own life where you would need a person, and go and learn that person's name.`;

const TEEN = `THERE IS NOBODY TO CONTACT - the nameless purchase, the deed sealed before witnesses, and the One who beheld the giver.

PROVENANCE FIRST. Darrell forwarded a ByteByteGo issue into the lesson lane on 2026-09-28 with one word above it: Lessons. Subject: "AI Agents Can Think. Now They Can Pay." Its author reports attending an event at Stripe's offices and speaking with three named people, two from Stripe and one from Tempo. It is trade press; it carries two sponsored segments, a monitoring vendor's booklet and a webinar about a coding-agent context layer, which are advertising and are used for nothing here. The limit, before the teaching: that forward is the whole source. Nobody here read the specification, opened a standards record, or verified one figure.

THE THREE PILES. ESTABLISHED, by that report, stated plainly: the payment layer of the internet assumes a person at the other end, and this design removes that assumption deliberately - the report says the innovation is less about payments than about the disappearance of the human from the process. The seller receives a public key and nothing else, so the payment proves control of a key and nothing more; in the report's own words, payment is no longer a form of identification. No account means no abuse history and nobody to disable. No signup means no record of the buyer. And on recourse it is blunt: no refund flow is defined, and even a seller who WANTS to do better has nobody to contact once the transaction is done. OPEN, narrowly: whether this becomes the standard, its real volumes, its settled fees, and its standards-body status on the day you read this. Its two statistics - a share of web traffic attributed to one network operator's report, and a one-month transaction count - are reported, not verified here, and the argument does not depend on either. OVER-REACH, both ways: that a believer should refuse payment technology altogether, which the Word contradicts by recording purchases, weighings and deeds approvingly; and the costlier one, that nothing has been lost because nothing has gone wrong. The name left the transaction at the design table. A name is not a feature.

NOT RE-TEACHING, AND MEASURED. The delegated key with a spending cap, an expiry and a recipient list is weeks nineteen, twenty-nine and thirty-one. Who owns the rails is week thirteen. Paying a worker the same day is week forty-two. A price that answers the same every time is weeks seventeen and thirty-seven. How many witnesses establish a matter is week forty-five. Counted free across all forty-eight weeks: Machpelah, Boaz, Jeremiah's deed, Zacchaeus, the two mites, the sparrows, Araunah's threshingfloor, and bought with a price. That is the seam.

THE MECHANICS IN SIX STEPS. The agent asks. The service answers payment-required and puts its terms in a header - an offer identifier, amount, currency, recipient, rail, expiry. The agent reads them, and the decision is made by the KEY rather than by its reasoning: a delegated signing key with a cap per period, an expiry and permitted recipients, one per deployment so a runaway can be revoked. The agent repeats the identical request with a proof, which the report insists is a bearer instrument and must never be logged or echoed into an error message. The service verifies against the rail, delivers, and attaches a receipt header. Two disciplines in that flow: no side effects for an unpaid request, and a proof that works exactly once. A failure answers payment-required again with a fresh offer and a structured reason, so the agent corrects instead of guessing. Then the economics: a cent is not worth settling, because fees do not shrink with the amount, so the protocol opens a session with money set aside, pays each request with a signed acknowledgement of a fraction owed, and claims the accumulated total once at the end. One fee across thousands of requests. It works.

ABRAHAM, CLAUSE BY CLAUSE. [[Genesis 23:13]] In the audience of the people of the land - the offer made where neighbours could hold both men to it. Then: [[Genesis 23:16]] Weighed, so the amount was measured rather than asserted. To Ephron, a named man and not an address. Named in the audience BEFORE payment, so the figure in the deal and the figure in the talk could not differ. Four hundred shekels. And current money with the merchant - an agreed standard of value, the one genuinely protocol-shaped item in the passage and the least of the five. Then twice: [[Genesis 23:17]] [[Genesis 23:18]] Made sure, before all that went in at the gate of his city. A receipt attests that a payment happened; a witness can be gone to afterwards. Those are different objects.

BOAZ PUTS THE PURPOSE IN THE DEAL. [[Ruth 4:9]] [[Ruth 4:10]] He declares the END of the transaction inside it - to raise up the name of the dead upon his inheritance - which no payment header can carry. And the crowd answers: [[Ruth 4:11]]

JEREMIAH'S FILING, AND WHY IT IS THE SHARPEST PASSAGE HERE. Jerusalem is besieged, the captivity is certain, the prophet is in prison, and Yahweh tells him to buy a field. [[Jeremiah 32:9]] Then four acts in one verse: [[Jeremiah 32:10]] Subscribed, sealed, witnessed, and weighed in the balances. Then the detail no engineer should skip: [[Jeremiah 32:11]] A sealed copy that cannot be altered and an open copy that can be read without breaking the seal - integrity and availability held at once, centuries before either word existed. Then custody before four audiences: [[Jeremiah 32:12]] Then duration: [[Jeremiah 32:14]] An earthen vessel, that they may continue many days. He was not keeping a return receipt. He was keeping a record to outlive the siege, the captivity, the parties and himself. And Yahweh makes the paperwork the sign of the restoration: [[Jeremiah 32:44]] Set that beside the report's own line that the next time an agent needs something it starts from zero. Two theories of what a record is for.

WHAT HAS NO SUBSTITUTE. Restitution needs a person to restore TO: [[Luke 19:8]] Him, fourfold. A reputation cannot be carried by a key that is rotated and revoked: [[Proverbs 22:1]] And honest dealing is a matter of the heart no payload reaches - the report's own guardrail is a seller quoting one price in the friendly text and another in the signed payload, and the Word named the species long ago: [[Proverbs 20:14]] Verifying the payload catches the lie in the number and never touches the man who wrote it.

AND THE ACCOUNTING TO IMITATE. [[Mark 12:41]] He beheld HOW they cast, which is not totalling what they cast. [[Mark 12:42]] Below any economic settlement threshold - and not rounded away: [[Mark 12:43]] He knew the sum, the giver, and the remainder. [[Matthew 10:29]] And He will not take a costless offering: [[2 Samuel 24:24]] One market in all the Word charges nothing, and it is not frictionless, because somebody else paid: [[Isaiah 52:3]] [[Psalms 49:7]] So the transaction the whole Word drives at is the opposite of anonymous: [[1 Corinthians 6:20]] [[Acts 20:28]] And the new song is a receipt with the parties named: [[Revelation 5:9]] He bought people, by name, at a stated price, before witnesses. Build the agent well. Do not let a design that removes the name teach you the name was never the point.`;

const SENIOR = `THERE IS NOBODY TO CONTACT - what a lifetime of closings already taught you about this.

WHERE IT CAME FROM. The occasion was ordinary. On 2026-09-28 Darrell forwarded a technology newsletter into the lesson lane with a single word above it: Lessons. The subject concerned software agents becoming able to pay for things themselves. You will recognise the difficulty long before the technology is explained, because it is not a technical difficulty. The honest limitation, declared before the instruction rather than afterwards: that forwarded newsletter constitutes the entire source. No specification was read here, no figure confirmed, and the two advertisements the issue carried are advertising, named as such and used for nothing.

WHAT IS PROPOSED. For the whole life of the commercial internet, the party at the far end of a purchase has been assumed to be a person - someone who reads a page, finds a price and types a card number. The proposal removes that assumption deliberately. A program asks for a service; the service replies with its terms in a header, the amount and the recipient and an expiry; the program pays with a key that has a spending limit written into it; the service delivers and attaches a receipt. No account is opened. No form is completed. No one is present.

AND WHAT THE ARTICLE ADMITS. This is the part that will be familiar. The seller receives a public key and nothing further. The payment demonstrates that somebody controls that key and demonstrates nothing else - not which firm is behind it, not whom it serves, not whether that buyer has ever dealt with you before. The article states it in so many words: payment is no longer a form of identification. There is consequently no account to suspend, no history of conduct, and no defined means of refund. Its own sentence is the one worth carrying out of this page: even where a seller WISHES to make something right, there is nobody to contact once the transaction is complete.

YOU HAVE SAT THROUGH THE ALTERNATIVE. Anyone who has bought a house, sold a vehicle, settled an estate or signed a lease has sat in a room where papers were read aloud, where a figure was stated before it was paid, and where other people were present for the purpose of being able to say afterwards what had happened. That was not ceremony. That was the design.

THE WORD RECORDS IT WITH THE PAPERWORK INTACT. Abraham, burying his wife and owning no ground, conducts the negotiation in public deliberately: [[Genesis 23:13]] In the audience of the people of the land. Then the settlement, and every clause of it is a requirement: [[Genesis 23:16]] The silver weighed rather than asserted. A named man rather than an address. The figure declared aloud before it was paid, so that the price in the conversation and the price in the payment could not differ. And then the clause twice repeated, which is the heart of it: [[Genesis 23:17]] [[Genesis 23:18]] Made sure, in the presence of the children of Heth, before all that went in at the gate of his city. A receipt attests that money moved. A witness is a person who can be gone to afterwards. Those are not the same thing, and it is the second that is now being designed away.

AND BOAZ SAID IT OUT LOUD AT THE GATE. [[Ruth 4:9]] He names what he bought and from whose hand. Then he states the reason for the purchase within the purchase, which no header will ever carry: [[Ruth 4:10]] And the town answers him: [[Ruth 4:11]] We are witnesses.

THE MOST CAREFUL CLOSING IN THE WORD. Jeremiah is in prison, the city is besieged, the captivity is certain, and Yahweh instructs him to buy a field from his cousin. [[Jeremiah 32:9]] Then four acts in a single verse: [[Jeremiah 32:10]] He signed it, he sealed it, he took witnesses, and he weighed the money in balances. Then a provision any solicitor would recognise: [[Jeremiah 32:11]] One copy sealed so that it could not be altered, one copy open so that it could be read. Then the custody, before four separate audiences: [[Jeremiah 32:12]] And then the instruction concerning duration: [[Jeremiah 32:14]] An earthen vessel, that they may continue many days. He was not retaining a receipt against a complaint. He was preserving a record intended to outlast the siege, the captivity, the parties to it, and himself - because the deed pointed at a restoration he would not live to see. And Yahweh makes the dullest scene imaginable into the sign of that restoration: [[Jeremiah 32:44]] Men shall buy fields for money, and subscribe evidences, and seal them, and take witnesses.

WHAT CANNOT BE DONE TO A KEY. Restitution requires a person to restore to. Zacchaeus does not publish a policy: [[Luke 19:8]] A particular man, sought out and repaid at fourfold. And the Word prices a name above the money: [[Proverbs 22:1]] A key that is rotated and revoked never accumulates a name, so no credit is ever extended on character, and every dealing is a first dealing for ever. As for the seller who says one thing in the pleasant description and another in the figures, the Word had his measure already: [[Proverbs 20:14]]

WHAT YOU HAVE THAT THE ARTICLE DOES NOT. You remember the men and women on the other side of your transactions. The one who came back when he did not have to. The one whose word was enough. Say one of those names out loud to somebody younger this week and tell them what it was worth, because that is the only argument that works before it is needed.

AND THE ONE WHO COUNTS THE SMALLEST SUM. [[Mark 12:41]] He beheld HOW they cast, not merely what. [[Mark 12:42]] Two mites, a farthing, beneath any threshold at which a payment is worth processing - and He called the disciples to look: [[Mark 12:44]] He knew the amount, the woman, and what she had left. [[Matthew 10:30]] And He refuses what costs nothing: [[2 Samuel 24:24]] One market in all the Word charges nothing, and it is not free of cost - somebody else paid: [[Isaiah 52:3]] Because the price was beyond us: [[Psalms 49:7]] So the transaction the whole Word has been driving toward is the reverse of an anonymous one. It has a named Buyer and a stated price: [[1 Corinthians 6:20]] [[Acts 20:28]] And the song in the Revelation is a receipt with the parties counted: [[Revelation 5:9]] He bought people, by name, before witnesses, and the deed is sealed and will continue many days.`;

// -----------------------------------------------------------------------------
// The module
// -----------------------------------------------------------------------------
const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `THERE IS NOBODY TO CONTACT. Darrell forwarded a ByteByteGo issue into the app on 2026-09-28 with one word above it: "Lessons." Its subject was "AI Agents Can Think. Now They Can Pay.", and it describes an HTTP-level design in which a software agent buys a service with no person anywhere in the transaction - the service answers payment-required with its terms in a header, the agent pays from a key that carries its own spending cap, and the goods come back with a receipt. The engineering is good and the honest part is better: the article says in its own words that payment is no longer a form of identification, that there is no account to disable and no refund flow defined, and that even where a seller WANTS to put something right, there is nobody to contact after the transaction is done. A spending cap stops an agent spending too much; it does nothing to stop it spending correctly on the wrong thing. So hold it against the Word's own commerce, which is named, spoken aloud, weighed and made sure: Abraham declaring the price in the audience of the people before he weighed it, Boaz saying "ye are witnesses this day" at the gate and the town answering him back, and Jeremiah in prison in a besieged city signing a deed, sealing one copy and leaving one open, taking witnesses, and putting both in an earthen vessel to continue many days. A receipt attests that money moved. A witness is somebody you can go to afterwards. Yahweh accounts the other way round from a settlement threshold - He beheld HOW the people cast into the treasury, counted two mites below any fee worth paying, knew what the widow had left, and would not take a threshingfloor that cost nothing. Build the agent well, cap its key, keep its receipts. Just never let a design that removes the name teach your heart that the name was never the point.`,
  inApp: `Open this week under Sovereign A.I. and read it at your band. Then do two things with real paper. FIRST, take one purchase you have made in the last month that mattered - not a coffee, something you would be upset to lose - and write down four columns: who you paid, by name; how the amount was established; who else knows it happened; and where you would go on Monday if it went wrong. Any column you cannot fill is the thing this lesson is about. SECOND, take one automated charge that already runs without you - a subscription, an API key, a hosting bill, anything an agent or a script can spend on your behalf - and write down its cap per period, its expiry, who it is permitted to pay, and the one human name you would contact if it spent correctly on the wrong thing. If there is no name, write NO NAME in that box and leave it there; the empty box IS the finding. Bring both sheets to the Discussion.`,
  anchor: {
    ref: '',
    theme: `The Word's commerce is named, spoken aloud, weighed, and made sure, and that is precisely what a payment with no human in it removes. Abraham negotiates for Machpelah in the audience of the people of the land, declares the price before he pays it, weighs the silver to a named man in current money with the merchant, and has the field "made sure" before all that went in at the gate - a formula the chapter states twice. Boaz buys at the gate, names what he bought and from whose hand, states the purpose of the purchase inside the purchase, and the town answers "we are witnesses." Jeremiah, imprisoned in a besieged city, subscribes the evidence, seals it, takes witnesses, weighs the money in the balances, keeps one copy sealed and one open, and stores both in an earthen vessel "that they may continue many days" - and Yahweh makes that ordinary closing the sign of a people brought home. Against that: restitution needs a person to restore to, as Zacchaeus restores a particular man fourfold; a good name is rather to be chosen than great riches, and a rotated key never builds one; and a buyer whose words and valuation disagree is a species the Word already named. Yahweh's own accounting runs opposite to a settlement threshold - He beheld how the people cast rather than totalling it, counted two mites, knew what the widow had left, prices sparrows at a farthing and numbers the hairs, and refuses a threshingfloor that costs nothing. The one redemption that costs the redeemed no money is not free of cost, because the redemption of a soul was beyond us and He purchased it with His own blood, out of every kindred and tongue and people and nation, by name.`,
  },
  benefits: [
    `You will be able to say, in one sentence, what is actually removed when a payment carries no person: not a form field but a NAME, and with the name the abuse history, the account that could be disabled, the credit extended on character, and anybody to contact when something goes wrong. The article says all four itself, which makes this a reading of its own confession rather than a complaint about it.`,
    `You will hold the difference between a receipt and a witness, and never confuse them again. A receipt attests that a payment happened. A witness is a person who can be gone to afterwards. Genesis 23 gives Abraham a city full of the second and the Word never mentions the first.`,
    `You will carry Abraham's purchase as a five-clause checklist you can run on any transaction: was the amount measured or asserted, was the recipient a named person or an address, was the price declared before it was paid, was there a stated figure, and was there an agreed standard of value - noticing that the last one, the only protocol-shaped item, is the least of the five.`,
    `You will know what Boaz did that no payment header can do: he put the PURPOSE of the transaction inside the transaction, out loud, and the town said it back to him.`,
    `You will have Jeremiah 32 as the most careful filing in the Word - signed, sealed, witnessed, weighed in balances, one sealed copy and one open, in an earthen vessel to continue many days - and you will see why a record built to outlive the parties is a different object from a receipt built to last a return window.`,
    `You will be able to name the three things that have no substitute once the person is gone: restitution, which needs somebody to restore to; reputation, which a rotated key cannot accumulate; and honest dealing, which no verified payload reaches, because verifying the number never touches the man who wrote it.`,
    `You will have Yahweh's accounting as the pattern instead of a settlement threshold: He beheld HOW they cast rather than totalling it, He counted two mites, He knew what she had left, He prices a sparrow at a farthing and numbers the hairs, and He will not accept an offering that cost nothing.`,
    `You will leave with two filled sheets rather than an opinion - one real purchase traced to a human name, and one automated spender with its cap, its expiry, its permitted recipients, and the name of the person you would contact when it spends correctly on the wrong thing. An empty name box is the finding.`,
  ],
  rpe: {
    research: `Take one purchase from the last month that you would be genuinely upset to lose and establish, by looking rather than by remembering, four facts: the name of the party you paid, how the amount was established, who else can attest that it happened, and where you would physically go if it went wrong. Then do the same for one automated charge that already spends on your behalf without you - a subscription, a hosting bill, an API key - and find its cap, its expiry and its permitted recipients. Do it the way Abraham did it, in the audience rather than in private: [[Genesis 23:13]]`,
    plan: `Decide, before changing anything, which of your recurring spends must have a human name attached to them and which may stay nameless, and write the reason down for each - a thing that can only go wrong in money may be nameless; a thing that can go wrong in a relationship may not. Then write the one sentence Boaz wrote, for one real commitment of yours: what you bought, from whom, and WHY, in a form you would be willing to say out loud. [[Ruth 4:9]]`,
    execute: `Do three things this week. Put a real cap, an expiry and a recipient list on one automated spender that currently has none. Find and write down the human name behind one service you pay and have never spoken to. And file one record the way Jeremiah filed his - a copy that cannot be altered and a copy that can be read - somewhere it will outlive your memory of it. [[Jeremiah 32:14]]`,
  },
  media: [],
  levels: { child: CHILD, youth: YOUTH, teen: TEEN, senior: SENIOR },
  stories: [
    {
      kind: 'parable',
      tone: 'serious',
      title: 'The Invoice With No Name On It',
      body: `Picture a small clinic that bought its appointment reminders from a service it found through a directory. The price was good, the integration took an afternoon, and for fourteen months the reminders went out and nobody thought about it again. The billing was automatic and the amounts were small enough that nobody read the line. Then one Tuesday the reminders started going to the wrong patients - not many, perhaps one in forty, and the pattern took three days to see because each individual case looked like somebody mistyping a number. The office manager went looking for a person. There was a support address, and it answered with a form. The form answered with a ticket number. The ticket number answered, eleven days later, with a paragraph that did not mention the clinic. There was no account manager, because there had never been an account - just a key, a card on file, and a usage total. And here is the part that was no accident: the clinic had not been sold to by a person either. It had found the service in a listing, compared four prices in a table, and chosen. At no point in fourteen months had two human beings who could call one another ever been on both ends of that relationship. The manager fixed it in the end by finding an engineer's name in a conference talk and writing to her directly, and the engineer was kind and the bug was real and it was patched in a week. What the manager could not stop thinking about afterwards was that the whole repair had depended on a name she found by accident, in a video, outside the system entirely. Nothing in the arrangement she had actually bought contained a person. It had never occurred to her to check whether it did, because there had been no box on the form for that.`,
    },
    {
      kind: 'parable',
      tone: 'hopeful',
      title: 'The Deed In The Jar',
      body: `A man in his seventies kept a brown envelope in a fireproof box in a closet, and in the envelope were the papers for a quarter of an acre his father had bought in 1961. He had been told, more than once, that he should scan them and throw the envelope away. He never did. In the envelope were two things that mattered more than the deed itself. One was a hand-written receipt, signed by the seller, with the amount in words as well as figures. The other was a sheet with four signatures on it that had nothing to do with the law - his father had asked the men who were standing there to put their names down, because that was how his own father had done it and he did not know any other way. Three of the four were dead. The fourth was ninety-one, in a home two counties over, and entirely clear in his mind. When a survey dispute came up about where the line actually ran, it was the fourth signature that settled it, in a telephone call that lasted nine minutes, because the man remembered the afternoon, remembered the fence, and remembered which side of the walnut tree they had agreed on. No scan would have held that. The reason the Word tells us Jeremiah put his evidence in an earthen vessel that it might continue many days is that a record is not for the week you make it. It is for a year nobody in the room has thought about, and the people whose names are on it are part of the record, not decoration on it.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: `What does the article itself say the innovation is mainly about?`,
        options: [
          `Lower transaction fees for merchants`,
          `The disappearance of the human from the payment process`,
          `Faster checkout pages for people`,
          `Replacing card networks with one rail`,
        ],
        answer: 1,
        explain: `The report is explicit that the point is not chiefly about making payments but about taking the person out of the process. That is why this lesson treats the removal of the name as the subject rather than as a side effect, and why it is read as the article's own confession rather than as an accusation against it.`,
      },
      {
        q: `In Genesis 23:16, which of these is NOT one of the safeguards in the verse?`,
        options: [
          `The silver was weighed rather than asserted`,
          `The price was named in the audience before it was paid`,
          `The payment was made to a named man`,
          `A written contract was signed by both parties`,
        ],
        answer: 3,
        explain: `[[Genesis 23:16]] Weighed, to a named man, at a figure declared aloud beforehand, in an agreed standard of value. The chapter never mentions a document. What it mentions twice is that the field was made sure before all that went in at the gate of his city - witnesses, not paperwork.`,
      },
      {
        q: `This lesson insists a receipt and a witness are different objects. What is the difference?`,
        options: [
          `A receipt is digital and a witness is physical`,
          `A receipt attests that a payment happened; a witness is a person who can be gone to afterwards`,
          `A receipt is issued by the seller and a witness by the buyer`,
          `There is no real difference; the words are interchangeable`,
        ],
        answer: 1,
        explain: `Both are records, and only one of them can be asked a question next year. The protocol in the article produces an excellent receipt, and it is candid that it produces nobody to contact. That is the whole seam of the week: Abraham got a city full of witnesses and the Word never says he got a receipt.`,
      },
      {
        q: `What did Boaz put into the transaction at the gate that no payment header can carry?`,
        options: [
          `The purpose of the purchase, declared out loud inside it`,
          `A discount for paying in silver`,
          `A guarantee against crop failure`,
          `An expiry date on the offer`,
        ],
        answer: 0,
        explain: `[[Ruth 4:10]] He states the END of the deal within the deal, and the town answers him, we are witnesses. An offer header carries an identifier, an amount, a currency, a recipient and an expiry, and it cannot carry a reason.`,
      },
      {
        q: `Jeremiah kept TWO copies of the evidence of his purchase. Why two?`,
        options: [
          `One for the buyer and one for the seller`,
          `One in Hebrew and one in Aramaic`,
          `One sealed so it could not be altered, and one open so it could be read`,
          `One for the prison and one for the temple`,
        ],
        answer: 2,
        explain: `[[Jeremiah 32:11]] Integrity and availability held at the same time, in the sixth century before Christ. Then both went into an earthen vessel, that they may continue many days.`,
      },
      {
        q: `Why is the timing of Jeremiah's purchase the sharpest part of the passage?`,
        options: [
          `He bought it at the bottom of the market`,
          `He bought at harvest, when the price was highest`,
          `He was in prison in a besieged city and the captivity was certain, so the deed pointed past his own lifetime`,
          `He bought it on the sabbath, which made the sale invalid`,
        ],
        answer: 2,
        explain: `He was not keeping a receipt against a return window. He was preserving a record meant to outlive the siege, the captivity, the parties and himself, because it pointed at a restoration he would not live to see. And Yahweh then makes the ordinary closing itself the sign of that restoration: [[Jeremiah 32:44]]`,
      },
      {
        q: `According to the article, what does a spending cap on a delegated key NOT protect against?`,
        options: [
          `An agent spending more than it should`,
          `An agent spending correctly on the wrong thing`,
          `A key being used after its expiry`,
          `A key paying a recipient not on its permitted list`,
        ],
        answer: 1,
        explain: `The report says it plainly: a capped key stops an agent from spending more than it should and does nothing to stop it spending correctly on the wrong things. The payment is valid, signed and final. That sentence is the reason this lesson does not re-teach the guardrails, which are already weeks nineteen, twenty-nine and thirty-one of this course, and goes instead to what no cap can supply.`,
      },
      {
        q: `What does Zacchaeus's restitution require that an anonymous payment cannot provide?`,
        options: [
          `A larger sum of money`,
          `A public ceremony`,
          `A particular person to restore TO`,
          `A notarised document`,
        ],
        answer: 2,
        explain: `[[Luke 19:8]] Him - a particular man, found and repaid at four times the wrong. A design with no defined refund flow and no party to contact has not merely lost a feature; it has lost the possibility of repentance showing up in the money.`,
      },
      {
        q: `Why does the lesson say a rotated, revocable key can never accumulate what Proverbs 22:1 prices above riches?`,
        options: [
          `Because keys are too long for anyone to remember`,
          `Because a good name is built by a person over years, and the seller cannot even tell whether the same buyer has bought before under a different key`,
          `Because reputations are worth nothing in software`,
          `Because the protocol forbids repeat customers`,
        ],
        answer: 1,
        explain: `[[Proverbs 22:1]] The report is candid that payment proves control of a key and nothing more. No name means no history, so no credit is ever extended on character, and every transaction is a first transaction for ever.`,
      },
      {
        q: `In Mark 12:41, what is Jesus described as beholding?`,
        options: [
          `How the people cast money into the treasury`,
          `The total that the treasury had received`,
          `Which gate the rich entered by`,
          `The weight of the temple silver`,
        ],
        answer: 0,
        explain: `[[Mark 12:41]] He watched HOW, which is not the same as totalling WHAT. Then He counted two mites - a farthing, below any threshold at which processing a payment is economic - called His disciples over about it, and knew that she had cast in all her living.`,
      },
      {
        q: `What does 2 Samuel 24:24 say about a cost of nothing?`,
        options: [
          `That a free gift is the purest form of worship`,
          `That David refused a free threshingfloor and paid fifty shekels for it rather than bring an offering that had cost him nothing`,
          `That the threshingfloor was worth more than fifty shekels`,
          `That Araunah was wrong to offer it`,
        ],
        answer: 1,
        explain: `[[2 Samuel 24:24]] Frictionlessness is not a virtue in itself. There is exactly one redemption in the Word that costs the redeemed no money, and it is not free of cost - the price was beyond us, and He purchased with His own blood.`,
      },
      {
        q: `What did this lesson do with the two sponsored segments in the forwarded issue?`,
        options: [
          `Summarised their arguments as supporting evidence`,
          `Treated their statistics as established fact`,
          `Named them as advertising and rested nothing on them`,
          `Recommended both products to the class`,
        ],
        answer: 2,
        explain: `Provenance comes before teaching. The piece is trade press carrying a monitoring vendor's booklet and a webinar about a coding-agent context layer; both are named as advertising and not one sentence of this lesson rests on either. In the same spirit the article's two statistics are reported rather than established, because nobody here verified them.`,
      },
    ],
  },
  lesson: '',
  facilitator: {
    talkingPoints: [
      `OPEN WITH THE PROVENANCE, NOT THE PROTOCOL. A ByteByteGo issue forwarded 2026-09-28 with one word above it, "Lessons." Trade press, not Scripture and not Darrell teaching. Two sponsored segments in it, named as advertising and used for nothing. And the limit said out loud: that forward is the whole source, nobody here read the specification, and the two statistics in it are reported rather than verified. Saying this first is the habit that keeps a room able to tell a source from the Word.`,
      `PUT THE THREE PILES ON THE BOARD BEFORE ANY TEACHING. ESTABLISHED by the report: the design deliberately removes the person; the seller gets a public key and nothing else; payment is no longer a form of identification; no account, so no abuse history and nobody to disable; no refund flow defined. OPEN, narrowly: whether it becomes the standard, its volumes, its fees, its standards-body status today. OVER-REACH both ways: refuse all payment technology, which the Word contradicts by recording purchases and deeds approvingly - and the costlier one, nothing has been lost because nothing has gone wrong yet.`,
      `SAY WHICH WEEKS WE ARE NOT RE-TEACHING, AND WHY THAT IS A COURTESY. The delegated key with a cap, an expiry and a recipient list is weeks nineteen, twenty-nine and thirty-one. Who owns the rails is week thirteen. Paying a worker the same day is week forty-two. A price that answers the same every time is weeks seventeen and thirty-seven. How many witnesses establish a matter is week forty-five. Send the room there rather than repeating it, and then say what was counted free across forty-eight weeks: Machpelah, Boaz, Jeremiah's deed, Zacchaeus, the two mites, the sparrows, Araunah, and bought with a price.`,
      `TEACH THE MECHANICS IN SIX STEPS AND DO NOT RUSH THEM, because a steward cannot govern what he cannot describe. Ask, payment-required with terms in a header, the key decides rather than the reasoning, the identical request repeated with the proof, verify and deliver, receipt. Then the two disciplines - no side effects for an unpaid request, and a proof that works exactly once - and the fee arithmetic that makes sessions and signed IOUs necessary. Give the design its due. It is good work.`,
      `THEN READ THE ARTICLE'S OWN SENTENCE AND LET IT SIT. Even if the seller WANTS to offer a better service, there is nobody to contact after the transaction is done. Ask the room where they have met that already - a support form, a ticket number, an eleven-day paragraph that did not mention them. Take three answers before any verse. Everyone in the room already knows this is true.`,
      `WALK GENESIS 23:16 CLAUSE BY CLAUSE, SLOWLY, AND HAVE THE ROOM COUNT THE SAFEGUARDS. Weighed, not asserted. To Ephron, a named man. Named in the audience BEFORE payment. Four hundred shekels, a stated figure. Current money with the merchant, an agreed standard. Then ask which of those five the new design keeps, and let them find that it keeps the last one - the only protocol-shaped item, and the least of the five. Then read 23:17-18 and 23:20 and let "made sure" land: Abraham got a city full of witnesses and the Word never says he got a receipt.`,
      `ASK FOR THE DIFFERENCE BETWEEN A RECEIPT AND A WITNESS BEFORE YOU GIVE IT. Rooms usually say a receipt is proof. Then ask which of the two you can telephone next year. That one question does more work than any explanation, and it is the whole lesson in a sentence.`,
      `READ RUTH 4:9-11 AND STOP ON THE ANSWER. Boaz names what he bought and from whose hand, and then he puts the PURPOSE inside the purchase - to raise up the name of the dead. And the crowd says it back: we are witnesses. Point out that a header carries an identifier, an amount, a currency, a recipient and an expiry, and that there is no field in it for a reason.`,
      `SPEND REAL TIME IN JEREMIAH 32, BECAUSE IT IS THE PASSAGE THE ENGINEERS IN THE ROOM WILL NOT FORGET. Four acts in verse 10 - subscribed, sealed, witnesses, weighed in the balances. Then verse 11, a sealed copy and an open copy, which is integrity and availability held at once. Then verse 12, custody before four audiences. Then verse 14, an earthen vessel that they may continue many days. Then say where he was standing: in prison, in a besieged city, with the captivity certain. He filed a record to outlive everybody in it. Finish with verse 44, where Yahweh makes a witnessed closing the sign of a people brought home, and set that against the report's own line that the agent starts from zero every time.`,
      `CLOSE ON THE ACCOUNTING AND THEN ON THE PRICE. Mark 12:41, He beheld HOW they cast; 12:42, two mites, below any economic settlement threshold; 12:44, He knew what she had left. Matthew 10:29-30, a farthing sparrow and numbered hairs. Then 2 Samuel 24:24, He will not take what cost nothing, and Isaiah 52:3, the one redemption that costs the redeemed no money because somebody else paid, with Psalms 49:7 for why it had to be somebody else. Then 1 Corinthians 6:20, Acts 20:28 and Revelation 5:9 - purchased with His own blood, out of every kindred and tongue and people and nation, by name. End with the exercise, and make it concrete before anyone leaves: one real purchase traced to a human name, and one automated spender with its cap, expiry, permitted recipients, and the name you would contact. An empty name box is the finding, and it stays written.`,
    ],
    howToRun: `Prayer + the anchor (5): open in prayer; read Genesis 23:16 aloud and ask the room to count the safeguards in the one verse before anything is explained. | Provenance and the honest limit (5): the forward, its one word, the two advertisements named as advertising, and everything nobody here verified. | The three piles (6): established by the report, open narrowly, over-reach in both directions. | Not re-teaching (4): name weeks 13, 17, 19, 29, 31, 37, 42 and 45 and send the room there; say what was counted free. | The mechanics (10): the six steps, the two disciplines, and the fee arithmetic that forces sessions - give the design its due. | The sentence (5): there is nobody to contact after the transaction is done; take three answers from the room before any further verse. | Abraham, clause by clause (10): Genesis 23:13, 23:16, then 23:17-18 and 23:20 on "made sure"; ask which of the five safeguards the new design keeps. | Receipt or witness (4): ask which one you can telephone next year. | Boaz at the gate (6): Ruth 4:9-11, landing on the purpose declared inside the purchase and the crowd's answer. | Jeremiah's filing (12): 32:9-12 and 32:14, then where he was standing, then 32:44 as the sign. | What has no substitute (5): Luke 19:8, Proverbs 22:1, Proverbs 20:14. | The accounting and the price (8): Mark 12:41-44, Matthew 10:29-30, 2 Samuel 24:24, Isaiah 52:3, Psalms 49:7, then 1 Corinthians 6:20, Acts 20:28 and Revelation 5:9. | Talk about it together + close (5): the two sheets filled in, the empty name box left written, and each person says one name out loud.`,
    discussionPrompts: [
      `[[Genesis 23:13]] Abraham made the offer in the audience of the people of the land, on purpose. Name one financial arrangement of yours that nobody else knows the terms of. What would change if one person you trust knew them?`,
      `[[Genesis 23:16]] Weighed, to a named man, at a price declared aloud beforehand, in an agreed standard. Take the last purchase that mattered to you and say honestly which of those four you can account for.`,
      `[[Genesis 23:18]] Made sure, before all that went in at the gate of his city. A receipt proves a payment happened; a witness can be telephoned next year. Which of the two do your own important dealings actually have?`,
      `[[Ruth 4:10]] He states the purpose of the purchase inside the purchase. Say out loud the WHY of one commitment you are currently paying for. If you cannot say it out loud, what does that tell you?`,
      `[[Ruth 4:11]] And all the people said, We are witnesses. Who are the witnesses to your household's biggest obligation, and when did you last speak to one of them?`,
      `[[Jeremiah 32:10]] Subscribed, sealed, witnessed, weighed in the balances. Which of those four does your most important record have, and which one would you miss first?`,
      `[[Jeremiah 32:14]] An earthen vessel, that they may continue many days. Name one record you keep for next week and one you keep for a year nobody in this room has thought about. Are they stored the same way?`,
      `[[Luke 19:8]] I restore him fourfold. Him. Name one thing you would need to put right and the particular person you would have to go to. What has kept you from going?`,
      `[[Proverbs 22:1]] A good name is rather to be chosen than great riches. Where are you trading on a name somebody else built, and where is somebody trusting you on yours?`,
      `[[Mark 12:44]] She of her want did cast in all that she had. He knew the amount, the giver, and what she had left. Where in your life are you being measured by the total rather than by what it cost you - and who is doing the measuring?`,
    ],
  },
};

// -----------------------------------------------------------------------------
// Build: fill the verses, derive the anchor, splice into the catalog.
// -----------------------------------------------------------------------------
MODULE.lesson = LESSON.join('\n\n') + '\n\n' + TALK.lesson;
MODULE.levels.child = CHILD + '\n\n' + TALK.child;
MODULE.levels.youth = YOUTH + '\n\n' + TALK.youth;
MODULE.levels.teen = TEEN + '\n\n' + TALK.teen;
MODULE.levels.senior = SENIOR + '\n\n' + TALK.senior;

const filled = fillDeep(MODULE);
filled.anchor.ref = used.join('; ');

const src = readFileSync(CATALOG, 'utf8');
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
const start = src.indexOf(OPEN);
if (start < 0) throw new Error('sov49: the modules array was not found');
const end = src.indexOf('\n];', start);
if (end < 0) throw new Error('sov49: the modules array is not closed after its opening');
if (!/\n {2}\}$/.test(src.slice(start, end))) {
  throw new Error('sov49: the array does not end with a module literal; refusing to splice');
}
const REBUILD = process.argv.includes('--rebuild');
let src2 = src;
let end2 = end;
if (src2.includes(ID)) {
  if (!REBUILD) throw new Error(`sov49: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const marker = `\n  {\n    "id": "${ID}"`;
  const from = src2.indexOf(marker);
  if (from < 0) throw new Error('sov49: the id is in the file but not as a module literal; refusing to rebuild');
  const closeAt = src2.indexOf('\n  }', from);
  if (closeAt < 0 || closeAt >= end2) throw new Error('sov49: could not find the end of the existing block; refusing to rebuild');
  const excised = src2.slice(from, closeAt + '\n  }'.length);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov49: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  // The preceding module's trailing comma goes with it, so the array never
  // keeps a hole behind -- the `},,` defect sov48's gate was written for.
  src2 = src2.slice(0, from - 1) + src2.slice(closeAt + '\n  }'.length);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov49: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov49: the id survived the excision; refusing to rebuild');
}

const block = JSON.stringify(filled, null, 2).split('\n').map((l) => `  ${l}`).join('\n');
const next = `${src2.slice(0, end2)},\n${block}${src2.slice(end2)}`;

// The weeks are read off the SPLICED TEXT by both id shapes, because this
// catalog holds `id: 'sov1-...'` literals and `"id": "sov45-..."` ones, and a
// pattern that sees only one shape answers confidently and wrongly (the defect
// recorded in sovereign-ai-class.test.js and scripts/unchecked-claims.mjs).
const weeks = (text) => [...new Set([...text.matchAll(/["']sov(\d+)-/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
const before = weeks(src2);
const after = weeks(next);
if (after.length !== before.length + 1) throw new Error(`sov49: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov49: week ${WEEK} is already taken`);
if (before.join(',') !== [...before].sort((a, b) => a - b).join(',')) {
  throw new Error(`sov49: the weeks on disk do not ascend: ${before.join(',')}`);
}
for (let n = 1; n < WEEK; n += 1) {
  if (!before.includes(n)) throw new Error(`sov49: week ${n} is missing below ${WEEK}; a gap must be recorded in sovereign-ai-class.test.js before splicing`);
}
if (after[after.length - 1] !== WEEK) throw new Error(`sov49: week ${WEEK} is not the top of the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov49: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref.split(';').map((s) => s.trim()).filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov49: spliced ${ID}`);
console.log(`sov49: modules ${before.length} -> ${after.length}; weeks on disk ${after.join(',')}`);
console.log(`sov49: ${refs.length} references on the anchor, every one quoted on the page and resolving in the corpus`);
console.log(`sov49: lesson ${filled.lesson.length} chars; bands child ${filled.levels.child.length}, youth ${filled.levels.youth.length}, teen ${filled.levels.teen.length}, senior ${filled.levels.senior.length}`);
