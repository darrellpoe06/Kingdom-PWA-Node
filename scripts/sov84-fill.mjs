// =============================================================================
// sov84-fill - build Sovereign A.I. week 84 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456). Every quoted
// verse on this page is FILLED FROM app/public/bible/kjv at build time. The
// prose below holds only a reference in double brackets, [[1 Corinthians 12:12]],
// and this script replaces it with the corpus text followed by the reference.
// No verse on the page was typed from memory. The reference list on the
// module's anchor is DERIVED from the placeholders that actually occur in the
// reader places, so anchor.ref names every verse the lesson stands on and
// nothing it does not (DR-0734).
//
// WHERE THE WORD CAME FROM. On 2026-11-03 at 14:15:52 UTC (8:15 AM CST)
// Darrell forwarded a ByteByteGo newsletter, subject line "How Nvidia's New
// Nemotron Model Works" (sent 2026-11-02 16:31 UTC), out of his university
// mailbox into the lesson lane with ONE WORD typed above the forwarded header:
// Lesson. No question, and nothing lifted above the header - the whole article
// is the occasion and his word is the ask. Gmail thread `1a19d26ba0e00ab4`.
// The scheduled intake fell behind; this build drains that backlog on
// 2026-11-13, ten days later, and the gap is kept on the record.
// scripts/lesson-already-built.mjs --thread 1a19d26ba0e00ab4 returned MAYBE on
// the source name only (other ByteByteGo lessons exist: sov1-sov4, sov17,
// sov20, sov22, sov33, sov39, sov76, sov82) and NOTHING on the thread id.
//
// WORD FIRST (DR-0127 / DR-0282). The hour opens on 1 Corinthians 12 - one
// body, many members, and the dividing to every man severally as He will -
// which already holds the whole shape the newsletter describes: a great
// capacity kept whole, and a few parts called for the work in front of them.
// Paul is laid down before one sentence of the article is spoken, and no
// figure from the article stands above that frame.
//
// TRUST BUT VERIFY (DR-0190 / DR-0100 / DR-0076 section 8). Unlike sov82 this
// email carried the COMPLETE article, conclusion and reference list included,
// so nothing here rests on a preview. The three PRIMARY hosts the article
// cites were all refused from this session:
//     developer.nvidia.com   curl: (56) CONNECT tunnel failed, response 403
//     huggingface.co         curl: (56) CONNECT tunnel failed, response 403
//     arxiv.org              curl: (56) CONNECT tunnel failed, response 403
// A road that DID open (the DR-1159 order: a public spec over raw git, not a
// hand): raw.githubusercontent.com and `gh api search/code`. Read there:
//   huggingface/transformers src/transformers/models/nemotron_h/
//     configuration_nemotron_h.py  - NVIDIA-authored, Apache-2.0, 285 lines
//   vllm-project/vllm vllm/model_executor/models/nemotron_h_mtp.py - 544 lines
//   vllm-project/vllm csrc/nvfp4_kv_cache_kernels.cu and four more NVFP4 files
//
// WHAT THE CHECK CHANGED - and it made the teaching BIGGER, not smaller:
//  1 STRONGER. The article says Nemotron "interleaves" Mamba and attention.
//    The configuration is more definite than that: layer_types is an EXPLICIT
//    per-layer list, each entry one of "mlp", "linear_attention",
//    "full_attention" or "moe" (:30). The order is declared, not emergent.
//  2 NEW - THE ARTICLE LEFT IT OUT. n_shared_experts: 1, with
//    moe_shared_expert_intermediate_size: 7688 and moe_shared_expert_overlap:
//    True (:135, :137, :139). Besides the routed experts a router chooses, a
//    SHARED expert runs for EVERY token, always. The newsletter describes only
//    the chosen ones. That one line is Movement Five of this lesson, and it is
//    why 1 Corinthians 13 follows 1 Corinthians 12.
//  3 CONFIRMED. Grouped-query attention is the real arrangement
//    (num_attention_heads 32, num_key_value_heads 8, :107-108); select-k-of-n
//    routing is real (n_routed_experts 8, num_experts_per_tok 2, :133, :140);
//    LatentMoE's projection into a smaller space is real (moe_latent_size,
//    "Latent size for MoE expert projections", :53); multi-token prediction
//    ships as its own layers (mtp_layers_block_type, :60) and as a whole vLLM
//    module; NVFP4 is implemented down to CUDA kernels.
//  4 SOFTER, AND SAID SO. Those config numbers are the CLASS DEFAULTS, not
//    Lightning's. The article's own figures - 30B total and ~3B active, 128
//    experts with 6 per token, 32 query heads and 2 key-value heads, 66 GB in
//    BF16 down to 22 GB in NVFP4, Super at ~120B/12B and Ultra at 550B/55B,
//    GRPO, quantization-aware distillation, multi-teacher on-policy
//    distillation - live in model cards and a white paper on the three refused
//    hosts. They are told AS THE NEWSLETTER'S, never as verified fact, in
//    every reader place. re-review: 2026-11-27.
//
// MEASURED ON OUR OWN HOUSE (not painted), on this tree:
//   app/public/bible/kjv  66 books, 1189 chapters, 31102 verses, 4.2 MB, all
//        shipped with the app, while a lesson quotes a few dozen
//   scripts/full-levels.mjs:29  FULL_FLOOR child 0.5, youth/teen/senior 0.6 -
//        the house REFUSES to ship a band thinner than that share of the adult
//        lesson, so the versions nobody opens are still carried in full
//   docs/decisions/  more than 1300 records, append-only (DR-0011): a new
//        directive is a NEW record and an old one is never rewritten
//   this lesson's own four bands, measured at build time and pinned in its test
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 84;
const ID = 'sov84-the-body-hath-many-members';
const TITLE =
  'The body hath many members - the many that are kept and the few that are called for one word, the running notes against the book you can open again, and the One who serves every single time';

// -----------------------------------------------------------------------------
// The corpus
// -----------------------------------------------------------------------------
const books = new Set(
  readdirSync(KJV)
    .filter((f) => f.endsWith('.json') && f !== 'index.json')
    .map((f) => f.slice(0, -5))
);
const cache = new Map();

// Psalm 119:11 is written the way a reader says it; the corpus file is
// Psalms.json. The trailing-s retry is what bridges the two, and it is the
// difference between a lesson that builds and one that throws on its anchor.
function bookFile(name) {
  const k = String(name).replace(/\s+/g, '');
  if (books.has(k)) return k;
  if (books.has(`${k}s`)) return `${k}s`;
  return null;
}

function verseText(ref) {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(String(ref).trim());
  if (!m) throw new Error(`sov84: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov84: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov84: reference does not resolve in the corpus -> "${ref}"`);
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
// still gets the shut road, the date and the frame (DR-0795).
// -----------------------------------------------------------------------------
const BLOCKED = {
  lesson:
    "WHAT WE COULD AND COULD NOT CHECK AT THE SOURCE. The email Darrell forwarded held the whole article this time, conclusion and references included, so nothing here rests on a preview. But the three places the article points to for its numbers - developer.nvidia.com, huggingface.co and arxiv.org - were every one of them refused from our network. So the particular figures are reported AS THE NEWSLETTER'S and never as checked fact: the thirty billion parameters with about three billion working on any one word, the hundred and twenty-eight experts with six chosen per word, the thirty-two ways of asking against two sets of stored answers, the sixty-six gigabytes falling to twenty-two, and the larger Super and Ultra models. What we COULD open was Nvidia's own published configuration code, through a public code host, and it confirmed the shape of every mechanism taught here - and told us one thing the newsletter never mentioned, which became Movement Five. A shut road must never read like a verified fact, and an open one must be named too. re-review: 2026-11-27.",
  child:
    'WHAT WE CHECKED. The email had the whole story in it. But the websites with all the big numbers would not open for our computer. So when we say a number, we are telling you what the letter said. We are not saying we checked it. We did open something else! We opened the code that Nvidia wrote and gave away. It showed us that all these parts are real. And it told us one thing the letter forgot. That part is in Movement Five. A door that will not open is not the same as a checked fact. We will try again. re-review: 2026-11-27.',
  youth:
    "WHAT WE CHECKED, AND WHAT WE COULD NOT. The email held the whole article, not just a preview. But the three websites that hold the real numbers would not open from our network. So every number you read here is the newsletter's number, told as the newsletter's, not as a fact we checked. One road did open: Nvidia publishes its own setup code in a place we could reach, and we read it. It confirmed that every part we teach is really there, and it showed us one piece the newsletter left out. That piece became Movement Five. A shut door must never sound like a checked fact. re-review: 2026-11-27.",
  teen: "WHAT WE CHECKED. Be clear on what we read and what we did not. The email carried the complete article, references and all. The three sites holding the real numbers - Nvidia's own blog, the model page and the paper site - were all refused from our network. So the figures here are reported as the newsletter's, not as verified facts. One road opened. Nvidia publishes the model's configuration as open code, and we read it from a public code host. It confirmed the hybrid layers, the grouped-query attention, the chosen experts, the smaller projection and the multi-word prediction. It also showed us a shared expert the article never mentions. re-review: 2026-11-27.",
  senior:
    "WHAT WE COULD AND COULD NOT CHECK. The forwarded email carried the complete article, conclusion and reference list included, so no part of this lesson rests on a preview. The three primary sources it points to, however - Nvidia's developer blog, the model repository and the preprint archive - were each refused from our network. Every specific figure in this lesson is therefore told as the newsletter's own claim and never as a checked fact. One road did open, and it is worth naming: Nvidia publishes the model's configuration as open source code, and that code was read from a public code host. It confirmed the shape of every mechanism taught here, and it carried one detail the article omits entirely - a shared expert that serves every word - which became Movement Five. A shut road must never read as verified, and an open one must be named. re-review: 2026-11-27.",
};

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - who in this family does something that nobody else does, and what would we lose if they stopped - and listen all the way to the end before you add a single word; have them retell their own answer in their own words, then teach them one verse back, 1 Corinthians 12:22. Children, ask your mother, your father or a grandparent about a season when they were not needed for anything, and what kept them steady; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: what is one thing you carry that nobody has called on yet. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what is something you are good at that nobody has asked you to do yet - and listen all the way to the end before you say anything; have them say their own answer back in their own words, then teach them one verse, 1 Corinthians 12:22. Children, ask your mom, your dad or a grandparent about a time they had to wait a long time before anybody needed them; hear the whole story before you talk, then tell their story back in your own words. Then ask a friend this: what is one thing you can do that I did not know about. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - who in our family gets left out of the plans, and why - and listen all the way to the end before you fix anything; have them retell the answer in their own words, then teach them one verse, 1 Corinthians 12:21. Children, ask your mom, your dad or a grandparent about a job they were never picked for, and what they did with that; hear the whole of it before you answer, then retell their answer in your own words. Then ask a friend this: what do you bring that our group would miss if you were gone. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - where do you feel like a spare part, and where do you feel needed - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, 1 Corinthians 12:18. Children, ask your mom, your dad or a grandparent about a gift of theirs that went unused for years, and whether it was ever called for; hear all of it before you reply, then retell their answer in your own words. Then ask a friend this: what is the one thing you do for people that costs you and nobody sees. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  senior: `TALK ABOUT IT TOGETHER. Parents and grandparents, sit with one younger person today and ask one open question - what do you carry that no one has asked you for yet - and listen all the way to the end before you add a word; have them retell their own answer in their own words, then teach them one verse back, 1 Corinthians 12:22. Younger ones, ask an older person about a long stretch when their gift sat unused, and what held them in it; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: who in our fellowship have we quietly stopped calling on. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
};


// -----------------------------------------------------------------------------
// THE ADULT LESSON
// -----------------------------------------------------------------------------
// The provenance paragraph stands FIRST, before the frame, on purpose: a reader
// is owed the knowledge of who sent this and when before anything is taught to
// them. The FRAME then stands before any of the article's own material. Those
// are two different claims and the test checks them separately (DR-0795).
const LESSON = [
  `WHO SENT THIS, AND WHEN. On the third of November 2026, at 8:15 in the morning, Central time, Darrell forwarded a ByteByteGo newsletter out of his university mailbox into the lesson lane. Its subject line was How Nvidia's New Nemotron Model Works, and it had been sent the day before. Above the forwarded header he typed ONE WORD: Lesson. No question after it. Nothing lifted up out of the article and set above the header. Just the word. His word is the ask; the article is only the occasion. The lane fell behind, and this was built by hand from the backlog on the thirteenth of November - ten days later. The gap belongs on the record as plainly as the teaching does.`,

  `THE WORD FIRST, BEFORE ANY ARTICLE. Paul had a problem in Corinth that had nothing to do with computers. People with one kind of gift were looking down on people with another kind, and people with no visible gift at all were quietly deciding they were not really in the church. So Paul wrote down the shape of a body. [[1 Corinthians 12:12]] [[1 Corinthians 12:14]] Then he said who does the choosing, and it is not the members. [[1 Corinthians 12:11]] [[1 Corinthians 12:18]] Hold those four sentences. Many members. One body. Not one of them is the whole. And the dividing - who is called, for what, and when - belongs to Yahweh and not to the part being called. Everything in the hour after this is a comment on that, and nothing in the article gets to stand above it.`,

  `MOVEMENT ONE: A WORD AT A TIME, LEANING ON THE ONES BEFORE IT. Start with what one of these systems is actually doing when it answers you. It does not compose a paragraph and hand it over. It produces one small piece of text, looks at everything including the piece it just produced, and produces the next one. Engineers call that autoregressive generation, and the plain English for it is: it writes the way you lay bricks. [[Isaiah 28:10]] Line upon line. Precept upon precept. The order is not decoration - each piece is chosen in the light of all the pieces already laid.\n\nThat is also why these systems have to keep track of what was said earlier. The newsletter gives a small sentence to show it: Adam puts the ice cream in the freezer because it was melting. To know what the word it refers to, something has to carry the ice cream forward across the whole sentence and attach it to that one small pronoun. The mechanism that does the carrying is called attention, and the simple picture for it is a room full of notes. A question is asked, the available notes are compared against the question, and the ones that match most strongly get the most weight. Then a second step works over what was gathered.\n\nThe Word already commends the posture. [[Proverbs 15:28]] Studies to answer. Not blurts. The righteous heart gathers what is relevant before it speaks, and so does a well-built machine - which is not a compliment to the machine so much as a reminder that the pattern was there first.`,

  `MOVEMENT TWO: WHAT IT COSTS TO CARRY EVERYTHING. Here is the hard part, and it is worth understanding because it explains every design decision that follows. If a system compares every word against every word that came before it, the work does not grow with the length of what you wrote - it grows with the SQUARE of it. The newsletter states it plainly: double the prompt and you need four times the comparison work.\n\nThere is a standard remedy. Instead of recomputing the notes for the older words every single time, you store them and reuse them. That store has a name, the key-value cache, and it turns that four-times growth back into a straightforward doubling. But nothing is free. What you stored is still sitting there, occupying memory, growing with every word of history, and it has to be hosted somewhere real that somebody pays for.\n\nSo you are standing between two costs. Recompute everything and pay in time. Keep everything and pay in weight. That is not a new problem and Scripture is not shy about the second one. [[Hebrews 12:1]] Lay aside every weight. The runner is not told to forget the race or to abandon the witnesses - he is told that carrying everything is itself a thing that slows you. [[Ecclesiastes 12:12]] Much study is a weariness of the flesh. There is a real limit to how much any vessel carries at once, and a design that pretends otherwise is lying about something.`,

  `MOVEMENT THREE: THE RUNNING NOTES AGAINST THE BOOK YOU CAN OPEN AGAIN. Nvidia's answer, according to the newsletter, is not to pick one of those costs. It is to carry both kinds of memory in the same system.\n\nThe first kind is a compact running state. As each new word arrives, a small fixed-size set of numbers is updated - the newsletter calls it a running set of notes about what has been read. The beautiful thing about it is that it does not grow. The thousandth word costs exactly what the tenth word cost. The newsletter is also honest about the price, and this is the sentence worth underlining: compressing a long history into a bounded representation can make it difficult to retrieve content in a precise manner. You keep the gist. You lose the ability to quote.\n\nThe second kind is the full stored record, which is expensive and exact. You can reach back and get the actual thing.\n\nNow hear the Word on the same trade, because it was settled long before anybody built this. Yahweh does not tell His people to rely on their running notes. [[Exodus 17:14]] Write it for a memorial in a book. [[Habakkuk 2:2]] Write the vision, make it plain, so that a man can read it and run. [[Deuteronomy 31:24]] [[Deuteronomy 31:26]] The book goes beside the ark, where it can be opened again by people who were not there. And yet He does not despise the compact state either. [[Jeremiah 31:33]] [[Psalm 119:11]] In the heart. Carried everywhere, instantly available, costing nothing to bring along.\n\nBoth, interleaved. That is the design. The heart carries the gist all day; the book holds the exact words for when the gist is not enough and somebody needs to read it and run. A household that keeps only the running notes will remember that Yahweh said something about this and be unable to say what. A household that keeps only the book, closed on a shelf, carries nothing through the afternoon. [[Proverbs 3:3]] Bind them about thy neck - and - write them upon the table of thine heart. He asked for both in one verse.\n\nOUR OWN HOUSE does this literally, and it is measurable. The entire King James text ships inside this application: sixty-six books, one thousand one hundred and eighty-nine chapters, thirty-one thousand one hundred and two verses, about four and a quarter megabytes, carried on every device that installs it. Any given lesson quotes a few dozen of those verses. The rest are not waste. They are the book beside the ark, there for the week nobody has planned yet.`,

  `MOVEMENT FOUR: MANY KEPT, FEW CALLED, NONE DISCARDED. Now the centre of the thing, and the reason Paul opened the hour.\n\nThe newsletter describes an arrangement called a mixture of experts. Inside one layer of the system there is not one processing unit but many alternatives, each called an expert. A small component called a router looks at the word being handled and picks a few of them. Only the picked ones do work. By the newsletter's account, their Lightning model holds a hundred and twenty-eight experts in such a layer and chooses six for any one word, so a system of roughly thirty billion parameters has roughly three billion of them working at any given moment. Those are the newsletter's figures, and the pages that would confirm them were shut to us.\n\nBut hold the shape, because the shape is the lesson. Great capacity, kept whole. A few parts called for the work actually in front of them. And then this, which the newsletter says out loud and which most people skim straight past: the unused experts are still part of the model. They must remain accessible for later tokens. The total parameter count still impacts the memory needed to host the model.\n\nRead that as Paul and it is 1 Corinthians 12 with the arithmetic shown. [[1 Corinthians 12:4]] [[1 Corinthians 12:7]] Diversities, and a profit for every one. [[1 Corinthians 12:15]] [[1 Corinthians 12:17]] The foot that decides it is not of the body is still of the body; its opinion of itself changed nothing. And then the two verses this whole hour exists to deliver. [[1 Corinthians 12:21]] [[1 Corinthians 12:22]] More feeble, and NECESSARY. Not tolerated. Not carried out of politeness. Necessary. [[1 Corinthians 12:23]] [[1 Corinthians 12:25]] More abundant honour to the part that lacks it, so that there be no schism.\n\nThe engineering agrees in the only way engineering can - with a bill. You pay to host every expert whether it fires this second or not. There is no configuration in which the unchosen ones cost nothing. A body that wants the capacity carries the members, all of them, all the time. [[Romans 12:4]] [[Romans 12:5]] [[Romans 12:6]] Members one of another, gifts differing, and the differing is the point.\n\nAnd set this against the way a household or a congregation actually drifts. Nobody votes to remove the quiet member. They are simply never called, and being never called looks exactly like not being there, until one day the thing only they could do is needed and they have gone. The machine is more faithful here than we usually are: it refuses to unload an expert merely because the last thousand words did not need it.\n\nOUR OWN HOUSE pays this bill on purpose and wrote the refusal into a gate. Every lesson in this course ships four versions - child, youth, teen and senior - and any one reader opens exactly one. The other three are carried anyway, in the same file, on the same device, downloaded by everyone. And the house will not let them be thin: a rule in scripts/full-levels.mjs requires the child version to carry at least half the words of the adult lesson and the other three at least three fifths, or the build is refused. That is a machine check standing guard over the principle that the members you are not reading today are still kept in full.`,

  `MOVEMENT FIVE: THE ONE WHO SERVES EVERY SINGLE TIME. Here is something the newsletter does not tell you, and we would not know it either if one road had not opened when three were shut.\n\nThe three sites holding Nvidia's own numbers refused us. But Nvidia publishes the model's configuration as open source code, and that code was reachable through a public code host. Reading it confirmed the shape of everything above. It also carried a line the article never mentions: alongside the routed experts the router chooses, there is a SHARED expert. Not selected. Not voted for. It runs for every single word, always, underneath whichever specialists were called.\n\nSit with that, because the Word put it in exactly this position. Paul finishes the list of gifts, finishes the dividing severally, finishes the eye and the hand and the feeble member - and then immediately says there is a more excellent way, and spends a whole chapter on it. [[1 Corinthians 13:1]] [[1 Corinthians 13:2]] [[1 Corinthians 13:3]] Tongues, prophecy, all knowledge, all faith, everything given away, the body burned - and without charity, nothing. Not diminished. Nothing.\n\nThat is the shared expert. Love is not one of the gifts the Spirit hands to some members and withholds from others. It is not routed. It runs under every gift, in every member, on every occasion, or the gift profits nothing at all. [[1 Corinthians 13:13]] [[Colossians 3:14]] Above all these things - put on charity, which is the bond of perfectness.\n\nAnd notice what this does to the lesson. Movement Four could be heard as a cold piece of arithmetic: capacity is kept, a few are picked, everyone else waits their turn. Movement Five is what keeps that from being true. There is a service that is never anybody's turn, because it is everybody's, every time. A household where only the called members are loving is a household that has made Love a specialty. It is not one. It is the floor.`,

  `MOVEMENT SIX: MANY WAYS OF ASKING, ONE SET OF ANSWERS KEPT. A smaller movement, but it earns its place. The newsletter reports that their model uses thirty-two separate ways of asking a question of the stored material, while keeping only two sets of stored answers. The arrangement has a name, grouped-query attention, and the open configuration confirms the arrangement even though its own default numbers are different ones. Many queries. Far fewer stores. The system keeps the richness of asking and refuses to pay for a separate copy of the answers per question.\n\nThat is how a believer is meant to come to the Word, and it is worth saying because the opposite error is common. [[James 1:5]] [[James 4:2]] Ask, and ask, and ask again - the asking is not rationed. [[Matthew 7:7]] [[Proverbs 2:3]] [[Proverbs 2:4]] [[Proverbs 2:5]] Cry after knowledge, lift up thy voice, seek her as silver. Thirty-two ways of asking is not irreverence; it is a man who will not leave the text until he has it.\n\nWhat does NOT multiply is the source. There are not thirty-two Bibles, one shaped for each question. There is one, and the many questions all come back to it. A household that generates a new authority for every new question has not become curious; it has become unanchored.`,

  `MOVEMENT SEVEN: THE TEACHER WHO DOES NOT MOVE, AND THE SMALLER STUDENT. The newsletter spends its last section on a problem of size. A large version of the system is accurate but expensive to keep. So they make a smaller one and train it, deliberately, to answer the way the big one answers. The large one is held FIXED during this - it is not updated, it is not negotiated with - and the smaller one is adjusted until its answers line up with the larger one's. In the Ultra model they go further: the student produces its own attempts, and several specialised teachers correct it in the situations it actually got into, rather than in situations somebody imagined for it. Again, their figures and their recipes are theirs; the structure is what we are after.\n\nThe structure is discipleship, and Scripture states it with no softening. [[Luke 6:40]] The disciple is not above his master, but every one that is perfect shall be as his master. The aim is not that the student becomes an equal authority. The aim is that the student answers as the Master answers. And the Master does not move while the training runs. [[Hebrews 13:8]] The same yesterday, and to day, and for ever. A teacher who is being adjusted alongside the student teaches nothing - there is no standard left to converge on. That is the whole reason the Word is not updated to match us.\n\n[[Philippians 2:5]] Let this mind be in you. That is the training objective, stated by Paul. And the smaller vessel is not an insult. [[2 Corinthians 4:7]] Earthen vessels, on purpose, that the excellency may be of Yahweh. You are not asked to hold everything the Master holds. You are asked to answer as He would in the situation you are actually in.\n\nAnd that last phrase is the whole of their best technique, and the whole of Deuteronomy. [[Deuteronomy 6:7]] Sitting in thine house, walking by the way, lying down, rising up. Four situations the child is actually in. Not a lecture hall. The correction arrives where the life is being lived, which is exactly what their multi-teacher method is reaching for and what Moses commanded three and a half thousand years earlier.`,

  `MOVEMENT EIGHT: THE DRAFT, AND THE ONE WHO CHECKS IT. One more mechanism, and it is the one with the sharpest warning in it. To avoid producing every word slowly in sequence, a lightweight component drafts several words ahead, guessing. Then the main system checks the guesses in one pass. Accepted guesses stand and everything jumps forward. Rejected ones are thrown away, and - this is the part to hold - generation continues from the last accepted word. Not from the furthest guess. From the last thing that was actually verified.\n\nThere is a draft, and there is a judge, and the draft never gets to promote itself. [[Acts 17:11]] They searched the scriptures daily, whether those things were so - and Luke calls them more noble for it, not more difficult. [[1 John 4:1]] Try the spirits, because many false prophets are gone out. Fast speech is not evidence. A thing said quickly and confidently is a proposal awaiting verification, and in this house that is not a metaphor - it is the rule that an assistant's claim is not a status until a check has passed on it.\n\n[[Proverbs 18:13]] He that answereth a matter before he heareth it, it is folly and shame unto him. The drafter that is never checked is that verse running at speed.\n\nAnd the recovery is repentance, described mechanically. [[Revelation 2:5]] Remember from whence thou art fallen, and repent, and do the first works. You do not restart from nothing and you do not press on from the furthest wrong place. You return to the last point that was true and continue from there.\n\nOUR OWN HOUSE keeps its record this way deliberately. There are more than thirteen hundred decision records in this project, and they are append-only: when a directive changes, a NEW record is written and the old one is left exactly as it was. The history of what was accepted stays readable, so the last verified point can always be found.`,

  BLOCKED.lesson,

  `AND THE WORD HIMSELF IS NOT A DRAFT. Everything above is a system of parts: things kept, things called, things guessed and checked, a teacher held still so a student can be conformed to it. Scripture ends that line of thought somewhere specific. [[John 1:1]] [[John 1:14]] Not a message carried by a part. The Word in person. He is not one expert among a hundred and twenty-eight, waiting to be routed to; He is the One in whom the whole holds together. [[Colossians 1:17]] He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne is for ever. [[Hebrews 1:8]] He is not the draft submitted for checking. He is the standard every draft is checked against.\n\nAnd then Paul's last word on the body, which is the word to take home. [[1 Corinthians 12:27]] Members in particular. Not members in general. Yahweh does not keep a crowd and call on it. He keeps persons, by name, at cost, and calls them severally as He will.`,

  TALK.lesson,
];

// -----------------------------------------------------------------------------
// CHILD - ages 6 to 10. Short lines. Concrete pictures. Grade ceiling 5.0.
// -----------------------------------------------------------------------------
const CHILD = `THE BODY HAS MANY MEMBERS. Many are kept. A few get called for one word. We keep running notes, and a book we can open again. And One serves every single time.

WHO SENT THIS. Darrell got an email about a big computer brain. He sent it to us. He typed one word on top. The word was Lesson. That is how this lesson started. We made it ten days later.

THE WORD FIRST. A man named Paul wrote a letter to a church. Some people there felt too big. Other people felt too small. So Paul told them about a body. [[1 Corinthians 12:12]] [[1 Corinthians 12:14]] Your body has lots of parts. Hands. Feet. Eyes. Ears. They are not all the same. But they are all YOU.

Then Paul said who picks the jobs. [[1 Corinthians 12:11]] [[1 Corinthians 12:18]] Yahweh picks. The hand does not pick. The foot does not pick. He does.

ONE WORD AT A TIME. Now let us talk about the computer brain. When it writes, it does not write a whole page at once. It writes one little piece. Then it looks at all of it. Then it writes the next piece. It is like building with blocks. One block. Then the next block on top. [[Isaiah 28:10]]

It also has to remember. Say I tell you this. Adam put the ice cream in the freezer because it was melting. What was melting? The ice cream! You had to hold on to those words. The computer holds on to words too. The Bible likes it when we think first and then talk. [[Proverbs 15:28]]

IT COSTS A LOT TO HOLD IT ALL. Here is the hard part. The more words you give it, the more work it has to do. Not just a little more. A LOT more. So it saves its old work in a box. Then it does not have to do that work twice.

But the box gets big. And a big box is heavy. The Bible talks about heavy things too. [[Hebrews 12:1]] If you run a race with a heavy pack, you go slow. [[Ecclesiastes 12:12]]

TWO WAYS TO REMEMBER. So what do you do? You can keep short notes in your head. Short notes are light. You can carry them all day. But short notes forget the exact words.

Or you can write it in a book. A book is heavy. But you can open it up and read the real words again.

Yahweh told His people to do BOTH. He said write it in a book. [[Exodus 17:14]] He said write it big so people can read it fast. [[Habakkuk 2:2]] He said put the book by the ark. [[Deuteronomy 31:26]]

But He also said put it in your heart. [[Jeremiah 31:33]] [[Psalm 119:11]] One verse says to do both at the same time! [[Proverbs 3:3]]

OUR APP DOES THIS. The whole Bible is inside this app. All sixty-six books. Every page. It is on your phone even when you are not reading it. A lesson only uses a few verses. The rest just wait. That is not a waste. That is the book, ready for later.

MANY ARE KEPT. A FEW GET CALLED. Now here is the best part. Inside the computer brain there are lots of little helpers. They are called experts. For one word, only a few of them wake up and work. All the others sit still.

The email said there can be more than a hundred helpers. And only six do the job each time.

But listen! The ones that sit still do NOT go away. They stay. And they cost money to keep. The computer pays to keep ALL of them. Every day. Even the quiet ones.

Think about a tool box. You might use the hammer a lot. You might not use the little screwdriver all year. But you do not throw the screwdriver away. You keep it. You carry the whole box. Because one day you will need that one small tool, and nothing else will work.

That is how the computer treats its helpers. It keeps all of them. It pays for all of them. It never says, you have not worked lately, so go.

That is what Paul said too. [[1 Corinthians 12:15]] [[1 Corinthians 12:17]] If a foot says I am not part of the body, it is still a foot. It is still part of you. Saying it does not make it true.

And then Paul says the big thing. [[1 Corinthians 12:21]] [[1 Corinthians 12:22]] The weak parts are NEEDED. Not just okay. Needed! [[1 Corinthians 12:23]] [[1 Corinthians 12:25]] We give MORE honor to the parts that look small.

Think of your family. Does someone do a job nobody sees? Do we ever forget them? The computer does not forget its quiet helpers. It keeps them all. We should too. [[Romans 12:4]] [[Romans 12:5]]

OUR APP DOES THIS TOO. Every lesson here is written four times. One for little kids. One for big kids. One for teens. One for grown-ups. You read ONE. But all four are on your phone. We keep them all. And there is a rule in our code that says the kid one cannot be too short. It has to be a real lesson, not a tiny one.

THE ONE WHO HELPS EVERY TIME. Now here is a secret. The email did not tell us this part! We found it in Nvidia's own code.

There is one helper that does NOT wait to be picked. It works every single time. For every word. Always.

The Bible has that too. Right after Paul talks about all the parts, he talks about Love. [[1 Corinthians 13:1]] [[1 Corinthians 13:2]] He says you can do big things and know big things. But with no love, it is nothing. Not small. NOTHING. [[1 Corinthians 13:13]] [[Colossians 3:14]]

Love is not a job for one person. Love is for everybody, every time. It is like that helper that never sits down.

Think about it this way. In a house, somebody cooks. Somebody takes out the trash. Somebody fixes the bike. Those are jobs. People take turns.

But being kind is not a turn. It is not one person's job on Tuesday. Everybody is kind, all the time, or the house does not work. Love is like that. It is the floor you stand on. It is not one of the jobs.

OUR APP KEEPS THE OLD NOTES. Here is one more thing we do. When we make a new rule for this app, we write it down in a new note. We do NOT erase the old note. We keep it.

So you can always look back and see what was true before. Nothing gets rubbed out. There are more than one thousand three hundred of those notes now. We keep every single one.

LOTS OF WAYS TO ASK. The computer has many ways to ask a question. But it keeps only a few sets of answers. Many questions. One place to look.

We do that with the Bible. We can ask and ask and ask. [[James 1:5]] [[James 4:2]] [[Matthew 7:7]] Keep asking! Look for it like you look for treasure. [[Proverbs 2:4]] But we do not go get a new Bible for each new question. There is one Book.

THE TEACHER WHO STAYS THE SAME. The big computer brain is smart but too big. So they make a little one. Then they teach the little one to answer like the big one.

And here is the key. The big one does NOT change while this happens. It stays still. If it moved, there would be nothing to copy.

Jesus is like that. [[Hebrews 13:8]] He is the same yesterday, today, and forever. He does not change to match us. We change to match Him. [[Luke 6:40]] [[Philippians 2:5]]

And you are small. That is okay! [[2 Corinthians 4:7]] Yahweh likes to put big treasure in small jars.

They also teach the little one right where it messes up. Not in a classroom. Right there. Moses said to teach that way. [[Deuteronomy 6:7]] At the table. On the road. At bedtime. In the morning.

GUESS, THEN CHECK. One more thing. To go fast, a small part of the computer GUESSES the next few words. Then the big part checks the guesses.

Good guesses stay. Bad guesses get thrown out. And then it goes back to the last word it KNOWS was right. It starts again from there.

The Bible says to check things. [[Acts 17:11]] Some people in a town called Berea checked the Bible every day. God called that a good thing. [[1 John 4:1]] Just because someone talks fast does not mean they are right. [[Proverbs 18:13]]

And when we are wrong? We go back to the last good place. [[Revelation 2:5]] That is what sorry means.

JESUS IS NOT A GUESS. All of this is parts and pieces. Jesus is not a part. He is the Word. [[John 1:1]] [[John 1:14]] Everything holds together in Him. [[Colossians 1:17]] He is the Lamb. [[John 1:29]] He is the Son of Yahweh. [[John 3:16]] [[Hebrews 1:8]]

He is not a guess that we check. He is the One we check everything else by.

And Paul says the last thing. [[1 Corinthians 12:27]] Yahweh does not keep a big crowd. He keeps PEOPLE. One by one. By name.

${BLOCKED.child}

${TALK.child}`;

// -----------------------------------------------------------------------------
// YOUTH - the school and classroom register, with questions put to the reader.
// -----------------------------------------------------------------------------
const YOUTH = `THE BODY HAS MANY MEMBERS: lots are kept, only a few get called for any one word, and there is One who serves every single time.

HOW THIS STARTED. Darrell forwarded an email about a new Nvidia computer model. On top of it he typed a single word: Lesson. That one word is the whole assignment. We built it ten days after he sent it, because we were behind.

THE WORD COMES FIRST. Before any computer talk, read Paul. He wrote to a church where some members thought they mattered more than others, and some thought they did not matter at all. [[1 Corinthians 12:12]] [[1 Corinthians 12:14]] One body. Many members. Nobody is the whole thing.

And then the part people skip. [[1 Corinthians 12:11]] [[1 Corinthians 12:18]] The members do not assign themselves. Yahweh does the setting.

HOW IT WRITES. Think about a group project where each person adds one sentence, and before you add yours you read everything written so far. That is how these systems work. One piece at a time, each one chosen after looking at all the rest. [[Isaiah 28:10]]

It also has to track what earlier words meant. If a sentence says the ice cream was melting, then later says it was melting, something has to connect it back to the ice cream. The Bible has a word for gathering before speaking. [[Proverbs 15:28]]

THE PRICE OF REMEMBERING. Here is where it gets expensive. Compare every word to every other word and the work grows by the square. Double the text, quadruple the work.

So they store the earlier work and reuse it. Smart. But now that storage is sitting in memory, getting bigger with every word, and someone is paying for it.

Two prices. Redo the work, or carry the weight. [[Hebrews 12:1]] [[Ecclesiastes 12:12]]

Notice what the verse does not say. It does not say forget the race. It does not say the witnesses do not matter. It says that whatever you carry is a thing that slows you down. That is true of a backpack and it is true of a memory. There is a real limit to what anything holds at once, and a design that pretends there is no limit is hiding the bill somewhere.

NOTES VERSUS THE BOOK. Nvidia's answer is to carry two kinds of memory at once.

The first is a small running summary. It does not grow. Word one thousand costs the same as word ten. But the email admits the catch: squeeze a long history into a small space and you can no longer pull out the exact wording. You keep the gist. You lose the quote.

The second is the full record. Expensive, but exact.

Which does Yahweh ask for? Both, and He is not subtle about it. Write it in a book. [[Exodus 17:14]] Write it plain enough to read while running. [[Habakkuk 2:2]] Keep the book beside the ark. [[Deuteronomy 31:24]] [[Deuteronomy 31:26]] And also, put it in the heart. [[Jeremiah 31:33]] [[Psalm 119:11]] One verse asks for both in the same breath. [[Proverbs 3:3]]

Think about what happens with only one. If all you have is your summary, you remember that God said something about this and you cannot say what. If all you have is a closed book on a shelf, you carry nothing with you all day.

IN THIS APP. The whole King James text ships inside the app. Sixty-six books. Over thirty-one thousand verses. About four megabytes, on every device, all the time. A lesson quotes maybe forty of them. The others are not dead weight. They are the book, ready for a week nobody has planned yet.

MANY KEPT, FEW CALLED. Now the main idea. Inside a layer of this system there are many separate helpers called experts. A small router looks at the word and picks a few. Only those few work.

The email says their model holds a hundred and twenty-eight experts and picks six per word, so about three billion parts out of thirty billion are active at once. Those numbers are the email's. We could not open the pages that would confirm them.

But read what the email admits next, because almost everyone skims it: the unused experts are still part of the model. They must stay available. The full size still determines how much memory it takes to host.

So you pay for all of them. Every second. Whether they fire or not.

That is Paul with a receipt attached. [[1 Corinthians 12:15]] [[1 Corinthians 12:17]] A foot that announces it is not part of the body is still a foot. Its opinion changed nothing.

[[1 Corinthians 12:21]] [[1 Corinthians 12:22]] The weaker members are necessary. Read that word again. Not tolerated. Necessary. [[1 Corinthians 12:23]] [[1 Corinthians 12:25]] More honour goes to the part that seems to have less, so there is no split. [[Romans 12:4]] [[Romans 12:5]] [[Romans 12:6]]

Here is the honest question for your group. Nobody votes a quiet person out. They just stop getting asked. And never being asked looks exactly like not being there. The machine is actually better than we are at this: it will not drop an expert just because the last thousand words did not need one.

Think about how that works in a real group. There is always someone who is good at one thing that does not come up often. They can fix a bike. They know how to talk to a sad friend. They can find anything in a library. Months go by and nobody needs it. So nobody asks. And they start to think they are just taking up a seat.

They are not taking up a seat. They are capacity, kept on purpose, for a day that has not arrived yet. The system pays to hold every expert precisely because it cannot know ahead of time which word will need which one. Neither can you.

IN THIS APP. Every lesson is written four times over, for four ages. You open one. The other three download anyway and sit there. And the code has a rule: the child version has to carry at least half the words of the adult one, the rest at least three fifths, or the build gets refused. A machine guards the principle.

THE ONE WHO SERVES EVERY TIME. Now something the email never said.

Three websites with Nvidia's numbers were blocked from us. But Nvidia publishes the model's setup file as open code, and we could reach that. Reading it confirmed everything above and added one line: besides the experts the router picks, there is a SHARED expert that runs for every single word. Never chosen. Never skipped.

Look where Paul puts the same thing. He finishes the gifts, finishes the dividing, finishes the weak member - and says there is a more excellent way. [[1 Corinthians 13:1]] [[1 Corinthians 13:2]] [[1 Corinthians 13:3]] You can have every gift and give away everything you own, and without love it is nothing.

Love is not one gift handed to some and withheld from others. It runs under all of them. [[1 Corinthians 13:13]] [[Colossians 3:14]]

Which means a group where only the busy people are loving has turned Love into a specialty. It is not a specialty. It is the floor everyone stands on.

And see what that does to the movement before it. On its own, the expert idea could sound cold. Capacity is held, a few get picked, everyone else waits around for a turn. The shared member is what stops that from being the whole story. There is one service that is never anybody's turn, because it belongs to everybody, every single time.

So the quiet member is not only being kept for a day that might come. They are already working, right now, in the one thing that runs under every gift. Nobody is idle in a body where Love is the floor.

MANY QUESTIONS, ONE SOURCE. The email says the model uses thirty-two ways of asking against only two sets of stored answers. Lots of questions. One place they go.

That is how to handle Scripture. Ask constantly. [[James 1:5]] [[James 4:2]] [[Matthew 7:7]] Dig for it like silver. [[Proverbs 2:3]] [[Proverbs 2:4]] [[Proverbs 2:5]]

What does not multiply is the source. There is one Bible, not one per question. A person who finds a new authority for every new question is not curious. They are unanchored.

Watch for that in yourself. It almost never looks like rebellion. It looks like research. You have a question, the answer you find is hard, so you go looking for a different source that gives you an easier one. Thirty-two ways of asking is a good thing. Thirty-two different authorities, chosen by which one agrees with you, is a different thing entirely.

THE TEACHER WHO DOES NOT MOVE. The big model is accurate but costly, so they train a smaller one to answer the way the big one answers. The big one is held completely still while this happens. Nothing about it is adjusted.

If the teacher moved too, there would be no standard to aim at. That is exactly why the Word is not edited to match us. [[Hebrews 13:8]] [[Luke 6:40]] The student is not meant to outrank the master. The student is meant to answer like Him. [[Philippians 2:5]]

Being the smaller one is not an insult. [[2 Corinthians 4:7]]

And they correct the student in the situations it actually lands in, not made-up ones. Moses said that first. [[Deuteronomy 6:7]]

GUESS, THEN VERIFY. To move faster, a light component drafts several words ahead by guessing, and the main model checks them in one pass. Accepted guesses stand. Rejected ones are dropped, and generation restarts from the last word that was verified - not from the furthest guess.

A draft, and a judge, and the draft never promotes itself. [[Acts 17:11]] The Bereans checked daily, and Scripture calls them more noble for it. [[1 John 4:1]] Speed is not evidence. [[Proverbs 18:13]]

And the recovery is repentance described mechanically. [[Revelation 2:5]] Go back to the last true point. Continue from there.

Look at how much that one rule saves you. You do not have to throw out the whole answer because part of it was wrong. You also do not get to keep running from the place where you went wrong just because you already got there. You find the last thing that was actually true, you stand on that, and you go again. That is not starting over and it is not pretending. It is the only honest way forward.

IN THIS APP. There are more than thirteen hundred decision records here, and they are append-only. When something changes, a new record is written and the old one is left alone. The last verified point stays findable.

HE IS NOT A DRAFT. All of the above is parts: kept, called, guessed, checked. Jesus is not a part. [[John 1:1]] [[John 1:14]] He is not one expert among a hundred and twenty-eight waiting to be routed to. Everything holds together in Him. [[Colossians 1:17]] He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] [[Hebrews 1:8]]

He is not the draft being checked. He is the standard. And Paul's last word: [[1 Corinthians 12:27]] members in particular. Yahweh keeps persons, by name.

${BLOCKED.youth}

${TALK.youth}`;

// -----------------------------------------------------------------------------
// TEEN - direct address, the phone and the group chat, grade ceiling 6.0.
// -----------------------------------------------------------------------------
const TEEN = `THE BODY HAS MANY MEMBERS. A huge number are kept and paid for. Only a few get called for any one word. And there is One who serves every single time, never chosen, never skipped.

THE ASK. Darrell forwarded a newsletter about how Nvidia's new model works. He typed one word above it: Lesson. No question. Nothing pulled out and highlighted. His word is the assignment. The article is just the occasion. It sat ten days before we built it.

THE WORD GOES FIRST. Paul wrote to a church that had a ranking problem. Some members felt important. Others had quietly decided they were not really in. [[1 Corinthians 12:12]] [[1 Corinthians 12:14]] One body, many members, none of them the whole.

Then the line that settles it. [[1 Corinthians 12:11]] [[1 Corinthians 12:18]] The members do not hand out the roles. Yahweh sets them.

HOW IT ACTUALLY WRITES. It does not think up a paragraph and deliver it. It produces one small chunk, re-reads everything including what it just made, then produces the next. Brick by brick. [[Isaiah 28:10]]

It also has to carry meaning forward. In the sentence about ice cream melting, the word it has to reach back and grab ice cream. The method is called attention, and the picture is a room of notes: a question gets compared against the notes, and the strongest matches get the most weight. [[Proverbs 15:28]]

WHY THIS GETS EXPENSIVE. Compare every word against every previous word and the cost grows with the square of the length. Double your prompt, quadruple the work. That is the article's own number and it is standard.

The fix is to store the earlier work instead of redoing it. That store is called a key-value cache, and it turns quadruple into double. But it does not vanish. It sits in memory, grows with every word, and somebody pays the bill.

So: redo the work, or carry the weight. Pick your cost. [[Hebrews 12:1]] [[Ecclesiastes 12:12]]

TWO KINDS OF MEMORY, BOTH AT ONCE. Nvidia's move is to refuse the choice and carry both.

One kind is a compact running state. Fixed size. The thousandth word costs what the tenth cost. The article is straight about the trade, and this is the sentence worth underlining: squeeze a long history into a bounded space and you can no longer retrieve the content precisely. You keep the gist, you lose the quote.

The other kind is the full stored record. Costly, and exact.

Scripture settled this trade long before anyone built it. Write it in a book. [[Exodus 17:14]] Write it plain, so a person can read it and run. [[Habakkuk 2:2]] Put the book beside the ark, where someone who was not there can open it. [[Deuteronomy 31:24]] [[Deuteronomy 31:26]] And also, in the heart. [[Jeremiah 31:33]] [[Psalm 119:11]] One verse asks for both at once. [[Proverbs 3:3]]

Only the running state and you remember that Yahweh said something about this but cannot say what. Only the closed book and you carry nothing through the day.

OUR HOUSE. The complete King James text ships inside this app. Sixty-six books, one thousand one hundred eighty-nine chapters, thirty-one thousand one hundred two verses, about four megabytes, on every phone that installs it. A lesson quotes a few dozen. The rest are the book beside the ark, there for the week nobody planned.

THE MAIN THING: MANY KEPT, FEW CALLED. Inside one layer there are many separate units called experts. A router reads the word and picks a few. Only those work.

The article says their Lightning model keeps a hundred and twenty-eight experts and picks six per word, so roughly three billion out of thirty billion parts are active at a time. Those figures are the article's. The pages that would confirm them were blocked from us, so we report them as its claim.

Now the sentence people skim: the unused experts are still part of the model. They must remain accessible for later words. The total size still determines the memory needed to host it.

You pay for every one of them, constantly, whether it fires or not.

That is 1 Corinthians 12 with the invoice attached. [[1 Corinthians 12:15]] [[1 Corinthians 12:17]] The foot that decides it is not part of the body is still a foot. Deciding did not change it.

[[1 Corinthians 12:21]] [[1 Corinthians 12:22]] Necessary. Not tolerated, not included to be nice. Necessary. [[1 Corinthians 12:23]] [[1 Corinthians 12:25]] More honour to the part that seems to have less, so there is no split. [[Romans 12:4]] [[Romans 12:5]] [[Romans 12:6]]

Here is the uncomfortable version. Nobody gets voted out of your group chat. They just stop getting tagged. And never being tagged looks identical to not being there, right up until the day the one thing only they could do is needed and they are gone. The machine is more loyal here than we usually are. It will not unload an expert just because the last thousand words did not call for it.

And notice the direction of the cost, because it cuts against how people usually think about this. Keeping an unused expert is not the system being wasteful. It is the system being honest about what it cannot predict. Nobody can say in advance which word will need which specialist, so the only way to have the capacity available is to pay for all of it, continuously, in advance. Capacity you have not paid for is capacity you do not have. A household that wants a member's gift available on the day it is finally needed has to have been carrying that member the whole time it was not needed.

OUR HOUSE. Every lesson in this course ships four versions. You open one. The other three download anyway. And a rule in the code refuses to publish if the child version carries less than half the words of the adult one, or the others less than three fifths. The principle is guarded by a machine, not by good intentions.

THE ONE WHO SERVES EVERY TIME. Here is something the article never mentions, and we only have it because one road opened when three were shut.

Nvidia's blog, the model page and the paper archive were all refused from our network. But Nvidia publishes the model's configuration as open source, and that was reachable through a public code host. Reading it confirmed the architecture. It also carried a detail the article omits: alongside the routed experts there is a SHARED expert that runs for every single word. Never routed to. Never skipped.

Watch where Paul puts the exact same thing. He finishes the gifts, finishes the dividing, finishes the feeble member, and then says there is a more excellent way. [[1 Corinthians 13:1]] [[1 Corinthians 13:2]] [[1 Corinthians 13:3]] Every gift, all knowledge, everything given away, and without love it is nothing. Not reduced. Nothing.

Love is not one gift distributed to some members. It is not routed. It runs underneath every gift in every member on every occasion. [[1 Corinthians 13:13]] [[Colossians 3:14]]

So a group where only the active members are loving has made Love a specialty. It is not one. It is the floor.

MANY WAYS TO ASK, ONE SOURCE. The article reports thirty-two ways of asking against two sets of stored answers. Many queries, far fewer stores. The open configuration confirms the arrangement, though its own defaults are different numbers.

That is how to come at the Word. Ask relentlessly. [[James 1:5]] [[James 4:2]] [[Matthew 7:7]] Dig for it like silver. [[Proverbs 2:3]] [[Proverbs 2:4]] [[Proverbs 2:5]]

What does not multiply is the source. There are not thirty-two Bibles shaped to your thirty-two questions. Generating a new authority per question is not curiosity, it is drift.

The failure mode here is subtle enough to be worth naming precisely. It rarely presents as rejecting Scripture. It presents as sourcing. You ask something, the answer that comes back costs you something, and so you keep searching until you locate a voice that charges less. The asking was never the problem and it was never rationed. Switching the authority to suit the answer is the problem, and it is almost always done in the language of being open minded.

THE TEACHER WHO DOES NOT MOVE. The large model is accurate and expensive, so they build a smaller one and train it to answer the way the large one answers. The large one is held fixed throughout. Not updated. Not negotiated with.

If the teacher moved while the student trained, there would be no standard left to converge on. That is precisely why the Word is not revised to match us. [[Hebrews 13:8]] [[Luke 6:40]] The goal is not that you outrank the Master. The goal is that you answer as He answers. [[Philippians 2:5]]

And being the smaller vessel is deliberate, not an insult. [[2 Corinthians 4:7]]

Their strongest method corrects the student in the situations it actually got itself into, rather than imagined ones. Moses commanded that first. [[Deuteronomy 6:7]] At the table, on the road, lying down, getting up. Correction where the life is.

DRAFT, THEN VERIFY. To avoid producing every word slowly in order, a lightweight part drafts several words ahead by guessing. The main model checks them in a single pass. Accepted guesses stand and everything jumps forward. Rejected ones are thrown out, and generation continues from the last word that was verified. Not from the furthest guess. From the last thing proven true.

A draft, a judge, and the draft never promotes itself. [[Acts 17:11]] The Bereans searched daily to see whether it was so, and Scripture calls them more noble for checking. [[1 John 4:1]] Confidence and speed are not evidence. [[Proverbs 18:13]]

And the recovery is repentance, stated mechanically. [[Revelation 2:5]] Not a restart from zero. Not pressing on from the furthest wrong place. Back to the last true point, then forward.

Both of those wrong moves are familiar. One person blows up the entire thing because a piece of it was wrong, as if nothing earlier counted. Another refuses to go back at all, because they have already travelled the distance and the distance feels like progress. The mechanism rejects both. It keeps everything that was genuinely verified, discards exactly what failed, and resumes from the boundary between them. That boundary is findable only if somebody kept an honest record of what had actually been confirmed.

OUR HOUSE. More than thirteen hundred decision records live in this project, append-only. When a directive changes, a new record is written and the old one is left exactly as it stood, so the last verified point can always be found.

HE IS NOT A DRAFT. Everything above is machinery: things kept, things called, things guessed and checked, a teacher frozen so a student can be shaped to it. Scripture ends the line somewhere specific. [[John 1:1]] [[John 1:14]] Not a message carried by a part. The Word in person. He is not one expert among a hundred and twenty-eight waiting on a router. [[Colossians 1:17]] He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne is for ever. [[Hebrews 1:8]]

He is not the draft submitted for checking. He is the standard the drafts are checked against.

And Paul's last word on the body. [[1 Corinthians 12:27]] Members in particular. Not a crowd. Persons, by name, kept at cost, called severally as He wills.

${BLOCKED.teen}

${TALK.teen}`;

// -----------------------------------------------------------------------------
// SENIOR - the long view, the congregation, the household across decades.
// -----------------------------------------------------------------------------
const SENIOR = `THE BODY HATH MANY MEMBERS: a great capacity kept entire and paid for, a few members called for the work immediately at hand, a running remembrance set beside a book that can be opened again, and One who serves on every occasion without ever being selected.

THE PROVENANCE. On the third of November 2026, at a quarter past eight in the morning, Central time, Darrell forwarded a ByteByteGo newsletter describing Nvidia's new Nemotron model out of his university mailbox and into the lesson lane, having typed a single word above the forwarded header: Lesson. There was no question attached, and nothing had been lifted out of the article and set above it. The word is the commission; the article supplies only the occasion. The intake lane had fallen behind, and the lesson was built by hand on the thirteenth, ten days afterward, which is recorded here rather than quietly smoothed over.

THE WORD STANDS FIRST. The difficulty Paul addressed in Corinth was not technical. Certain members, conscious of a visible gift, had begun to regard themselves as the substance of the assembly, while others, possessing nothing conspicuous, had privately concluded they were not truly part of it at all. Against both errors he set the figure of a body. [[1 Corinthians 12:12]] [[1 Corinthians 12:14]] Many members, a single body, and not one member sufficient to constitute the whole.

He then identified the authority behind the arrangement, which is the sentence that disarms both the proud member and the discouraged one. [[1 Corinthians 12:11]] [[1 Corinthians 12:18]] The distribution is Yahweh's, exercised according to His own will, and the member under consideration is not consulted about his own placement. Everything that follows in this hour is commentary upon that, and no figure drawn from the newsletter is permitted to stand above it.

THE MANNER OF ITS SPEECH. Consider first what such a system is actually doing when it replies to you. It does not compose a finished paragraph and present it. It produces one small portion of text, surveys the whole of what now exists including the portion just produced, and produces the next. Engineers name this autoregressive generation; the plainer description is that it builds in courses, as a wall is built. [[Isaiah 28:10]]

It must therefore retain what was said earlier. The newsletter illustrates the necessity with an ordinary sentence in which a pronoun must reach backward to recover its referent. The mechanism accomplishing this is termed attention, and the serviceable image is a room of notes: an enquiry is weighed against the available notes, and those corresponding most strongly receive the greatest weight. The disposition is commended in Scripture long before it was mechanised. [[Proverbs 15:28]] The righteous heart studies before it answers.

THE EXPENSE OF COMPREHENSIVE RECOLLECTION. Here lies the difficulty that governs every subsequent decision. Where every word is weighed against every preceding word, the labour increases not with the length of the passage but with its square; double the material and the comparison work is quadrupled.

The customary remedy is to retain the earlier computation rather than repeat it, in a store called the key-value cache, which restores the growth to something merely proportional. Yet the store itself persists, enlarging with every additional word, occupying memory that some party is obliged to furnish.

Two expenses, then, and no third option: recompute and pay in time, or retain and pay in weight. Scripture does not flinch from the second. [[Hebrews 12:1]] The runner is not instructed to forget the race nor to dismiss the witnesses, but is warned that whatever is carried is itself a thing that slows him. [[Ecclesiastes 12:12]] There is a genuine limit to what any vessel bears at once, and a design pretending otherwise is concealing a cost somewhere.

THE RUNNING REMEMBRANCE AND THE BOOK. Nvidia's answer, as the newsletter describes it, declines to choose between the two and carries both within one system.

The first is a compact running state, a small fixed quantity of numbers revised as each word arrives. Its virtue is that it does not enlarge: the thousandth word costs precisely what the tenth cost. The newsletter is candid about the corresponding loss, and the admission deserves to be underlined, since compressing an extended history into a bounded representation renders precise retrieval difficult. The substance is kept; the capacity to quote is forfeited.

The second is the full retained record, which is costly and exact, and from which the actual thing may be recovered.

Yahweh, however, resolved this question long before it was posed in silicon, and He resolved it by requiring both. The book is commanded. [[Exodus 17:14]] It is to be written plainly enough that a man may read it while running. [[Habakkuk 2:2]] It is deposited beside the ark, accessible to generations who were not present at the giving. [[Deuteronomy 31:24]] [[Deuteronomy 31:26]] And yet the interior, carried remembrance is equally required. [[Jeremiah 31:33]] [[Psalm 119:11]] Indeed a single verse requires both in one breath. [[Proverbs 3:3]]

The consequence of possessing only one is worth stating. A household retaining only its running summary will recall that Yahweh has spoken concerning the matter and prove unable to say what He spoke. A household retaining only a closed volume upon a shelf carries nothing whatever through the afternoon.

IN THIS HOUSE. The entire King James text is shipped within the application itself: sixty-six books, one thousand one hundred and eighty-nine chapters, thirty-one thousand one hundred and two verses, approximately four and a quarter megabytes, resident upon every device that installs it. Any particular lesson quotes a few dozen. The remainder are not surplus; they are the book beside the ark, awaiting the week for which no one has yet made provision.

THE MEMBERS KEPT AND THE MEMBERS CALLED. We arrive now at the centre, which is why Paul opened the hour.

The newsletter describes an arrangement termed a mixture of experts. Within a single layer there reside not one processing unit but many alternatives, and a small component called a router examines the word presently under consideration and selects a few. Only the selected perform work. By the newsletter's account their Lightning configuration maintains one hundred and twenty-eight such experts and selects six for any given word, so that a system of approximately thirty billion parameters has roughly three billion engaged at any instant. These figures are the newsletter's own; the pages which would corroborate them were closed to us, and they are accordingly reported as its claim rather than as verified fact.

The shape, however, is the lesson, and the newsletter states the decisive part explicitly while most readers pass over it: the unused experts remain part of the model, must remain accessible for subsequent words, and the total parameter count continues to determine the memory required to host the whole. One pays, continuously, for every member, whether or not it is engaged in this instant.

Rendered into Paul, this is 1 Corinthians 12 with the accounting appended. [[1 Corinthians 12:15]] [[1 Corinthians 12:17]] The foot which concludes that it is not of the body remains a foot, its conclusion having altered nothing whatever.

And then the two verses for which this entire hour exists. [[1 Corinthians 12:21]] [[1 Corinthians 12:22]] Necessary. Not endured, not retained from courtesy, but necessary. [[1 Corinthians 12:23]] [[1 Corinthians 12:25]] More abundant honour is directed toward the member that appears to lack it, precisely so that there shall be no schism. [[Romans 12:4]] [[Romans 12:5]] [[Romans 12:6]]

Set this beside the manner in which a congregation actually deteriorates, for the deterioration is never announced. No assembly votes to remove its quiet member. He is simply never called upon, and never being called upon is indistinguishable, from the outside, from not being present, until the day arrives when the one thing he alone could do is required and he has gone. The machine in this respect is more faithful than we commonly are: it declines to unload an expert merely because the preceding thousand words had no occasion for it.

IN THIS HOUSE. Each lesson in this course is published in four versions, and any single reader opens exactly one; the remaining three are carried regardless, within the same file, upon the same device. Nor are they permitted to be perfunctory. A rule in the code requires the child version to carry at least half the words of the adult lesson and the other three at least three fifths, failing which the build is refused outright. A deterministic check stands guard over the principle, which is the only form of guardianship that survives a change of personnel.

THE MEMBER WHO IS NEVER SELECTED. There is something here the newsletter does not report, and we possess it only because a single road opened when three were shut.

The three sites holding Nvidia's own figures refused our network entirely. Nvidia, however, publishes the model's configuration as open source, and that configuration proved reachable through a public code host. Reading it corroborated the shape of everything above, and carried in addition a line the article omits altogether: alongside the routed experts which the router selects, there exists a shared expert which executes for every word without exception. It is never selected, because it is never not required.

Observe that Paul places precisely this consideration in precisely this position. Having concluded the gifts, the dividing severally, the eye and the hand and the feebler member, he announces a more excellent way and devotes an entire chapter to it. [[1 Corinthians 13:1]] [[1 Corinthians 13:2]] [[1 Corinthians 13:3]] Tongues, prophecy, all knowledge, all faith, the whole estate distributed, the body surrendered to burning, and absent charity the sum is nothing. Not diminished. Nothing.

Charity is therefore not among the gifts apportioned to some members and withheld from others. It is not routed. It operates beneath every gift, within every member, upon every occasion, or the gift profits nothing at all. [[1 Corinthians 13:13]] [[Colossians 3:14]]

This governs how the preceding movement must be heard. Taken alone it might sound like cold arithmetic, in which capacity is retained, a few are selected, and the remainder await their turn. The shared member is what forbids that reading. There exists a service which is never anyone's turn, because it is everyone's, invariably. A household in which only the currently employed members are loving has made Love a specialty, which it is not. It is the floor beneath all the rest.

MANY ENQUIRIES, ONE SOURCE RETAINED. A briefer movement, which nonetheless earns its place. The newsletter reports thirty-two distinct means of interrogating the stored material against only two sets of stored answers, an arrangement named grouped-query attention, and the open configuration confirms the arrangement notwithstanding that its own defaults differ. Many enquiries; far fewer stores. The richness of asking is preserved while a separate copy of the answers per question is refused.

This is the manner in which a believer is to approach the Word, and it bears saying because the contrary error is widespread. [[James 1:5]] [[James 4:2]] The asking is not rationed. [[Matthew 7:7]] [[Proverbs 2:3]] [[Proverbs 2:4]] [[Proverbs 2:5]] To cry after knowledge and seek her as silver is not irreverence; it is a man who will not depart from the text until he has understood it.

What does not multiply is the source. There are not thirty-two Scriptures, each shaped to a particular enquiry. There is one, and every enquiry returns to it. A household which generates a fresh authority for each fresh question has not become inquisitive; it has become unmoored.

THE FIXED MASTER AND THE LESSER VESSEL. The newsletter devotes its closing section to a difficulty of magnitude. A large version is accurate but expensive to maintain, so a smaller is constructed and deliberately trained to answer as the larger answers. The larger is held fixed throughout the procedure: it is not revised, and it is not negotiated with. In the largest model they proceed further, the student producing its own attempts while several specialised teachers correct it within the situations it has actually entered rather than situations devised for it. Their particular figures and recipes remain theirs; the structure is what concerns us.

The structure is discipleship, which Scripture states without mitigation. [[Luke 6:40]] The aim is not that the student should become a competing authority, but that he should answer as his Master answers. And the Master does not move while the training proceeds. [[Hebrews 13:8]] A teacher revised alongside his student teaches nothing whatever, there remaining no standard upon which to converge; which is the entire reason the Word is not amended to accommodate us. [[Philippians 2:5]]

Nor is the lesser vessel an insult. [[2 Corinthians 4:7]] One is not required to contain everything the Master contains. One is required to answer as He would answer in the circumstance one is actually standing in.

That final phrase is the whole of their most advanced technique and the whole of Deuteronomy together. [[Deuteronomy 6:7]] Four circumstances in which the child actually stands. Correction arrives where the life is being conducted, which is what the multi-teacher method reaches toward and what Moses commanded some three and a half thousand years before it.

THE PROPOSAL AND THE ONE WHO EXAMINES IT. One further mechanism, carrying the sharpest admonition of the hour. To avoid producing every word slowly and in sequence, a lightweight component drafts several words in advance by conjecture, whereupon the principal system examines the conjectures in a single pass. Those accepted stand, and the whole advances. Those rejected are discarded, and generation resumes from the last word actually verified, not from the furthest conjecture.

A proposal, an examiner, and the proposal never promotes itself. [[Acts 17:11]] They searched the scriptures daily to determine whether these things were so, and Luke accounts them more noble for the searching. [[1 John 4:1]] Rapidity of utterance is not evidence; a thing said quickly and confidently remains a proposal awaiting verification, which in this house is not a figure of speech but a governing rule. [[Proverbs 18:13]]

And the recovery is repentance described mechanically. [[Revelation 2:5]] One does not recommence from nothing, nor press onward from the furthest erroneous position. One returns to the last point which was true and proceeds from there.

IN THIS HOUSE. More than thirteen hundred decision records exist within this project, maintained append-only: when a directive changes, a new record is written and the former left precisely as it stood. The history of what was accepted remains legible, so that the last verified point may always be located.

AND THE WORD HIMSELF IS NO PROPOSAL. All the foregoing describes a system of parts: things retained, things summoned, things conjectured and examined, a master held still that a student might be conformed to him. Scripture terminates that line of reasoning at a definite place. [[John 1:1]] [[John 1:14]] Not a message conveyed by a member. The Word in person. He is not one expert among a hundred and twenty-eight awaiting a router's selection; He is the One in whom the whole subsists. [[Colossians 1:17]] He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne endures for ever. [[Hebrews 1:8]] He is not the proposal submitted for examination. He is the standard against which every proposal is examined.

And Paul's concluding word upon the body is the word to carry home. [[1 Corinthians 12:27]] Members in particular. Not members in general. Yahweh does not maintain a crowd and draw upon it. He keeps persons, by name, at cost, and calls them severally as He will.

${BLOCKED.senior}

${TALK.senior}`;

// -----------------------------------------------------------------------------
// The module
// -----------------------------------------------------------------------------
const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `THE BODY HATH MANY MEMBERS - THE MANY THAT ARE KEPT AND THE FEW THAT ARE CALLED FOR ONE WORD, THE RUNNING NOTES AGAINST THE BOOK YOU CAN OPEN AGAIN, AND THE ONE WHO SERVES EVERY SINGLE TIME.

WHO SENT THIS. On the third of November 2026 at 14:15 UTC (8:15 in the morning, Central) Darrell forwarded a ByteByteGo newsletter, How Nvidia's New Nemotron Model Works, out of his university mailbox with ONE WORD typed above the forwarded header: Lesson. No question, and nothing lifted above the header. Gmail thread 1a19d26ba0e00ab4. His word is the ask; the newsletter is the occasion. The lane fell behind, and it was built by hand from the backlog ten days later.

THE WORD FIRST. 1 Corinthians 12 opens the hour - one body and many members, and the dividing to every man severally as He will - before one sentence of the article is spoken. Then eight movements: a word at a time, leaning on the ones before it; what it costs to carry everything; the running notes against the book you can open again; many kept, few called, none discarded; the One who serves every single time; many ways of asking against one source; the teacher who does not move and the smaller student; and the draft that never promotes itself. The hour closes on the Word who is not a draft at all.

OUR OWN HOUSE. The whole King James text ships inside the app - sixty-six books, 1,189 chapters, 31,102 verses - and a lesson quotes a few dozen. Every lesson carries four age versions and a reader opens one; a rule in the code refuses to publish a thin band. More than thirteen hundred decision records are kept append-only, so the last verified point can always be found.

TRUST BUT VERIFY. The email held the COMPLETE article this time, references and all. But developer.nvidia.com, huggingface.co and arxiv.org were every one refused from our network, so the particular figures are reported as the newsletter's and never as checked fact. One road opened: Nvidia's own configuration code, read from a public code host. It confirmed the hybrid layers, the grouped-query attention, the chosen experts, the smaller projection and the multi-word prediction - and it carried one thing the article never mentions, a SHARED expert that runs for every word, which became Movement Five. re-review: 2026-11-27.

LEFT OUT ON PURPOSE. The subscription offer and the restack buttons are not taught.

PLACEMENT. Sovereign A.I., week 84, because a household running its own systems has to understand what it is paying to keep, what it is calling on, and what never gets switched off.`,
  inApp: `No new screens this week. One page in your Study, one honest look at who gets called in your own house, and one walk through what this app carries for you whether you open it or not.

In the app: open Sovereign A.I. week 84 and read the band that fits the reader in front of you - the lesson carries all four, child, youth, teen and senior, and each one holds the whole teaching. Use Search it out on 1 Corinthians 12 and 13 together, in that order, so the members and the more excellent way sit on one screen; the links come from the lesson's own references.

Then see Movement Four on your own device. Open any lesson in this course and switch the reading level. Four versions were already on your phone before you touched it - you only ever read one, and the other three were carried anyway. That is the whole teaching, running on your own screen.

Away from the app, two exercises. Write down every person in your household or small group, and beside each name write the last occasion you actually called on them for something only they do. Then look at the names with the longest gap. And this week, call on one of them.`,
  anchor: {
    ref: '',
    theme: `[[1 Corinthians 12:14]] [[1 Corinthians 12:11]] [[1 Corinthians 12:22]] [[1 Corinthians 13:2]] [[Proverbs 3:3]] [[Luke 6:40]] [[Acts 17:11]] [[1 Corinthians 12:27]]`,
  },
  rpe: {
    research: `RESEARCH. Three readings, and every one of them lands on your own house.

First, read 1 Corinthians 12 whole, in one sitting, and do not stop at verse 27 - run straight on into chapter 13 without a break, the way it was written. Mark the exact point where Paul stops describing the members and starts describing what runs through all of them. Write one sentence on what changes when you read the two chapters as one argument instead of two.

Second, read Deuteronomy 31:24-26 beside Jeremiah 31:33, and Proverbs 3:3 last. Write one sentence on why Yahweh requires both the written book and the carried heart, and what is lost when a household keeps only one of them.

Third, read Acts 17:11 with Revelation 2:5. Write one sentence on the difference between starting over and returning to the last thing that was verified.`,
    plan: `PLAN. Name three things before you touch anything.

Name the members of your household or group who have not been called on for something only they do in the last three months. Not the ones who are gone - the ones who are present and unasked. Write the names.

Name the one thing your household keeps only as a running summary, where it needs a written record it can open again. A medical history. A set of passwords. What Yahweh has actually said to you about a decision in front of you.

Name the thing you are currently believing on somebody's confident say-so, which you have not verified. Decide how you would check it.`,
    execute: `EXECUTE. Three actions, this week, small enough to actually finish.

Call on one unasked member. Not a general invitation - a specific request for the specific thing they do. Then tell them why you asked them and not someone else.

Write one thing down that currently lives only in somebody's head, and put it where another person could open it. One page. Plain enough to read while running.

Check one claim. Take the thing you named in the plan, find the actual source, and read it yourself. If it turns out stronger than you were told, say so plainly. If it turns out weaker, say that too. Then go back to the last point you were sure of and continue from there.`,
  },
  media: [],
  benefits: [
    "Darrell's one word, Lesson, over a newsletter about a new language model, answered from the Word rather than from the article, and built by hand when the intake lane fell ten days behind.",
    '1 Corinthians 12 is laid down before a single sentence of the article is spoken, so the frame is Paul’s and not Nvidia’s.',
    'The hour reads 1 Corinthians 12 and 13 as one argument, which is how a reader meets the shared member rather than only the selected ones.',
    'A reader learns what a language model is actually doing when it answers - one piece at a time, each chosen after looking at all the rest.',
    'The real cost of remembering everything is stated plainly: the work grows with the square of the length, and the fix moves the cost into memory rather than removing it.',
    'The trade between a compact running state and a full stored record is taught as Scripture already settled it - the book beside the ark AND the word hid in the heart.',
    'Proverbs 3:3 is shown asking for both at once, which keeps the lesson from recommending one kind of memory over the other.',
    'The mixture-of-experts arrangement is taught as 1 Corinthians 12 with the accounting attached: many kept, few called, and every one of them paid for.',
    'The sentence most readers skim - that unused experts remain part of the model and still determine the memory required - is the sentence the lesson builds the movement on.',
    'A household is shown the way a quiet member actually disappears: never removed, only never called, until the day the thing only they do is needed.',
    'The shared expert, which the newsletter never mentions, was found in Nvidia’s own published configuration and became the movement on Love as the floor rather than a specialty.',
    'Checking the article made the teaching bigger rather than smaller, and the lesson says so plainly in every band.',
    'Every specific figure is reported as the newsletter’s claim, because the three primary hosts were refused, and the shut roads are named in all five reader places.',
    'The one road that opened is named too, so a reader can tell the difference between what was verified and what was merely read.',
    'Grouped-query attention becomes a lesson on asking the Word relentlessly while refusing to multiply the source.',
    'Distillation becomes discipleship stated exactly: the disciple is not above his master, and the master does not move while the student is trained.',
    'The smaller student is honoured rather than pitied, through the earthen vessel, so a reader with less capacity is not written out of the lesson.',
    'Multi-teacher on-policy training is set beside Deuteronomy 6:7, showing correction arriving where the life is actually conducted.',
    'Speculative decoding becomes the Berean habit, and the rejected draft becomes repentance described mechanically - back to the last verified point, then forward.',
    'The app’s own four-band rule is shown as a machine guarding the principle that unread members are still carried in full.',
    'The whole King James text shipping inside the app is measured, not asserted: 66 books, 1,189 chapters, 31,102 verses.',
    'The append-only decision record is taught as the practical form of keeping the last verified point findable.',
    'All four age bands carry the shut roads, the date and the frame, so a reader who opens one band is not short-changed on any of them.',
    'The hour ends where Scripture ends it - the Word in person, who is not a draft to be checked but the standard every draft is checked against.',
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The man who was never asked',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A congregation of about ninety people had a retired electrician in the fourth row. He had wired half the county in his working life, and when the fellowship hall was built in the eighties he had done the whole of it himself, on Saturdays, for nothing.

The building aged. A new team took over the upkeep, none of them knowing who had wired it. When a circuit in the kitchen began tripping, they called a contractor, who quoted a figure that meant the mid-week supper had to be cut to twice a month.

The electrician was in the fourth row the Sunday that decision was announced. He did not raise his hand. He had not been asked about the building in eleven years, and a man who has not been asked in eleven years does not assume he is wanted. He assumed, as quiet members do, that the matter was in better hands than his.

He died the following spring. At the meal afterward his daughter mentioned, in passing, that her father had kept the original wiring diagrams for the hall in a drawer, labelled, because he thought someone might need them one day.

The circuit was still tripping. The diagrams were still in the drawer. Nobody had ever opened it.

Nothing had been decided against him. No vote was taken. He was simply never called on, and never being called on had looked exactly like not being there - right up until the one thing only he could do was needed, and he was gone.

A machine would not have made that mistake. It pays to keep every expert loaded precisely because it cannot know which word will need which one. The congregation paid to keep him too - a seat, a name on the roll, a place at the suppers - and then never routed a single thing to him.`,
    },
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The summary and the sealed envelope',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. Two brothers inherited the same instructions from their father, who had spent an evening before his surgery explaining what he wanted done with the farm.

The older brother listened hard and kept it in his head. He could tell you the shape of it any time you asked, for years - the land stays whole, the youngest sister is looked after, nobody borrows against it. He was not lying and he was not careless. He simply carried a summary, and a summary is what he had.

The younger brother listened to the same evening and then, at the kitchen table afterward, wrote it down, read it back to his father, and had him sign the bottom of the page. Then he put it in an envelope in the file box.

Nine years later the brothers disagreed about whether the youngest sister's husband counted as family for the purposes of the land. The older brother was certain. He had carried the thing faithfully for nine years and it had never once felt vague to him.

The younger brother opened the envelope.

Their father had addressed it directly, in one sentence, and it was not what either of them remembered. The older brother's summary had the shape right and the particular wrong - which is exactly what a compressed memory does, and exactly what it cannot tell you it has done.

The reading took four minutes. The argument it ended had been running for three months, and would have run for thirty years, because neither man had anything to check himself against except the other man's certainty.

The older brother had the word in his heart. The younger brother had it bound about his neck. Proverbs asks for both in one verse, and the evening at the kitchen table is the whole difference between remembering what your father wanted and being able to read it and run.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'What does 1 Corinthians 12:11 and 12:18 say about who assigns the members their places?',
        options: [
          'The members choose their own roles by gift and preference',
          'Yahweh divides to every man severally as He will, and sets the members as it pleased Him',
          'The strongest members assign roles to the weaker ones',
        ],
        answer: 1,
        explain: 'The dividing belongs to Yahweh and not to the part being called. That disarms the proud member and the discouraged one in the same stroke.',
      },
      {
        q: 'In a mixture-of-experts layer, what happens to the experts the router does NOT select for a given word?',
        options: [
          'They are unloaded from memory until they are needed again',
          'They remain part of the model, must stay accessible, and still determine the memory needed to host it',
          'They are retrained on the words they missed',
        ],
        answer: 1,
        explain: "The newsletter says it plainly and most readers skim it. You pay to keep every member whether it fires this second or not - which is 1 Corinthians 12:22 with the invoice attached.",
      },
      {
        q: 'What did reading Nvidia’s own published configuration add that the newsletter never mentioned?',
        options: [
          'A shared expert that runs for every single word, never selected and never skipped',
          'The exact price of renting the model per hour',
          'That the model refuses certain questions',
        ],
        answer: 0,
        explain: 'Besides the routed experts there is one that serves every word always. That is Movement Five, and it is why 1 Corinthians 13 follows 1 Corinthians 12.',
      },
      {
        q: 'According to 1 Corinthians 13:2, what is a member with prophecy, all knowledge and all faith, but without charity?',
        options: ['Slightly less effective', 'Nothing', 'Still profitable to the body'],
        answer: 1,
        explain: 'Not diminished. Nothing. Love is not one gift among many handed to some members; it runs underneath every gift in every member.',
      },
      {
        q: 'What is the honest weakness of a compact running state, in the newsletter’s own words?',
        options: [
          'It grows too large to store',
          'Compressing a long history into a bounded representation makes precise retrieval difficult',
          'It cannot be updated once written',
        ],
        answer: 1,
        explain: 'You keep the gist and lose the ability to quote. That is why Yahweh commanded the written book as well as the word hid in the heart.',
      },
      {
        q: 'Which verse asks for BOTH the carried remembrance and the written record in one breath?',
        options: ['Proverbs 3:3', 'Hebrews 12:1', 'Isaiah 28:10'],
        answer: 0,
        explain: 'Bind them about thy neck, and write them upon the table of thine heart. He asked for both in a single verse.',
      },
      {
        q: 'Why must the teacher model be held completely fixed while the smaller student is trained?',
        options: [
          'To save electricity during training',
          'Because a teacher revised alongside the student leaves no standard left to converge on',
          'Because the student would otherwise outperform it',
        ],
        answer: 1,
        explain: 'Luke 6:40 and Hebrews 13:8 together. The aim is that the student answers as the Master answers, and that requires a Master who does not move.',
      },
      {
        q: 'In speculative decoding, where does generation continue after a drafted guess is rejected?',
        options: [
          'From the very beginning of the answer',
          'From the furthest word that was guessed',
          'From the last word that was actually verified',
        ],
        answer: 2,
        explain: 'Not a restart from nothing, and not pressing on from the furthest wrong place. Revelation 2:5 describes the same recovery: return to the last true point and do the first works.',
      },
      {
        q: 'Which three primary sources were refused from our network while building this lesson?',
        options: [
          'developer.nvidia.com, huggingface.co and arxiv.org',
          'The Gmail API, GitHub and the KJV corpus',
          'No sources were refused',
        ],
        answer: 0,
        explain: 'So every specific figure is reported as the newsletter’s claim. The one road that did open was a public code host carrying Nvidia’s own configuration.',
      },
      {
        q: 'What does this app carry on your device that you will almost certainly never read in full?',
        options: [
          'The entire King James text - 66 books, 1,189 chapters, 31,102 verses',
          'A copy of every newsletter Darrell has forwarded',
          'Nothing; everything is downloaded only on demand',
        ],
        answer: 0,
        explain: 'A lesson quotes a few dozen verses. The rest are the book beside the ark, carried for the week nobody has planned yet - the same principle as the expert that has not been called.',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read 1 Corinthians 12:12-14 aloud before you say one word about any computer. Then read 12:18 aloud. Then ask the room one question and wait for a real answer: who in this room does something that nobody else here does?

MINUTES 0 TO 8 - THE BODY AND THE DIVIDING. 1 Corinthians 12:12, 12:14, 12:11 and 12:18. Establish two things before moving: many members in one body, and the dividing belongs to Yahweh. Do not let the room jump ahead to the machine.

MINUTES 8 TO 16 - HOW IT SPEAKS, AND WHAT IT COSTS. Isaiah 28:10 for one piece at a time. Then the cost: every word weighed against every previous word grows with the square, and storing the earlier work moves the cost into memory rather than removing it. Hebrews 12:1 and Ecclesiastes 12:12. Ask: what does this household carry that is slowing it down?

MINUTES 16 TO 26 - THE NOTES AND THE BOOK. The compact running state against the full stored record, and the newsletter's own admission that compression costs you the exact wording. Then Exodus 17:14, Habakkuk 2:2, Deuteronomy 31:24 and 31:26 for the book; Jeremiah 31:33 and Psalm 119:11 for the heart; Proverbs 3:3 for both at once. Tell the second parable here, The summary and the sealed envelope.

MINUTES 26 TO 38 - MANY KEPT, FEW CALLED. This is the centre; give it the time. The router picks a few experts and the rest still cost money to keep. Then 1 Corinthians 12:15, 12:17, 12:21, 12:22, 12:23 and 12:25, and Romans 12:4-6. Tell the first parable here, The man who was never asked. Then stop talking and ask the room the hard question: who here has not been asked for anything in a year?

MINUTES 38 TO 46 - THE ONE WHO SERVES EVERY TIME. Name the shut roads and the open one before you teach this, so the room knows where it came from. Then the shared expert, and 1 Corinthians 13:1-3, 13:13 and Colossians 3:14. Make the point land: Love is not a specialty, it is the floor.

MINUTES 46 TO 54 - ASKING, THE FIXED TEACHER, AND THE DRAFT. Move briskly. James 1:5, Matthew 7:7 and Proverbs 2:3-5 for many questions and one source. Luke 6:40, Hebrews 13:8, Philippians 2:5 and 2 Corinthians 4:7 for the fixed Master and the lesser vessel, with Deuteronomy 6:7 for correction arriving where the life is. Acts 17:11, 1 John 4:1, Proverbs 18:13 and Revelation 2:5 for the draft that never promotes itself.

MINUTES 54 TO 60 - THE WORD WHO IS NOT A DRAFT. John 1:1 and 1:14, Colossians 1:17, John 1:29, John 3:16 and Hebrews 1:8. Close on 1 Corinthians 12:27 - members in particular - and send them out with the one assignment: call on one unasked member this week, by name, for the specific thing they do.`,
    talkingPoints: [
      '1 Corinthians 12 is laid down before one sentence of the article, and nothing from the article is allowed to stand above it.',
      'Many members, one body, and not one of them is the whole - which corrects the proud member and the discouraged member at once.',
      'The dividing belongs to Yahweh, exercised according to His own will, and the member is not consulted about his own placement.',
      'A language model answers one piece at a time, each piece chosen after looking at everything already laid down.',
      'Weighing every word against every previous word grows with the square of the length - double the text, quadruple the work.',
      'Storing the earlier work turns that growth back into doubling, but the store still sits in memory and somebody pays for it.',
      'A compact running state does not grow, and the price is that you keep the gist and lose the ability to quote.',
      'Yahweh commanded the written book AND the carried heart, and Proverbs 3:3 asks for both in a single verse.',
      'The whole King James text ships inside this app - 66 books, 1,189 chapters, 31,102 verses - and a lesson quotes a few dozen.',
      'A router selects a few experts per word; the newsletter reports 6 of 128, with about 3 billion parts of 30 billion active.',
      'Those figures are the newsletter’s claim - three primary hosts were refused from our network and could not confirm them.',
      'The unused experts remain part of the model, must stay accessible, and still determine the memory required to host it.',
      '1 Corinthians 12:22 says the feebler members are NECESSARY - not tolerated, not kept out of courtesy.',
      'Nobody votes the quiet member out; he is simply never called, and never being called looks exactly like not being there.',
      'This app ships four age versions of every lesson and a reader opens one - a code rule refuses to publish a thin band.',
      'Nvidia’s own published configuration carried a shared expert the newsletter never mentions, running for every single word.',
      '1 Corinthians 13 follows 1 Corinthians 12 for exactly that reason: charity is not routed, it runs under every gift.',
      'Without charity the sum is not diminished but nothing - so Love is the floor beneath the gifts, never a specialty.',
      'Many ways of asking against one retained source: ask relentlessly, and refuse to multiply the authority.',
      'A smaller student is trained to answer as a larger teacher answers, with the teacher held completely fixed throughout.',
      'A teacher revised alongside the student leaves no standard to converge on - which is why the Word is not amended for us.',
      'The best training corrects the student in the situations it actually entered, which is Deuteronomy 6:7 exactly.',
      'A rejected draft does not restart from nothing and does not press on from the furthest guess - it returns to the last verified word.',
      'The hour ends where Scripture ends it: the Word in person, who is not a draft to be checked but the standard for every draft.',
    ],
    discussionPrompts: [
      'Who in this household or fellowship has not been called on for something only they do in the last year? Say the name out loud.',
      'What does your family keep only as a running summary, where it badly needs a written record someone else could open?',
      'Where have you quietly decided you are not really part of the body, the way the foot does in 1 Corinthians 12:15?',
      'If Love is the floor and not a specialty, where in your week is it currently being treated as somebody else’s assignment?',
      'What are you believing right now on somebody’s confident say-so that you have never actually checked for yourself?',
      'When you have gone wrong, do you restart from nothing, press on from the furthest wrong place, or return to the last thing that was true?',
    ],
  },
  lesson: LESSON.join('\n\n'),
  levels: { child: CHILD, youth: YOUTH, teen: TEEN, senior: SENIOR },
};

// -----------------------------------------------------------------------------
// Fill, then DERIVE the anchor from the placeholders that occur in reader places
// -----------------------------------------------------------------------------
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
console.log(`sov84: adult prose words ${adultWords} fk ${fk(filled.lesson).toFixed(2)}`);
for (const b of FOUR_BANDS) {
  console.log(
    `sov84: ${b} words ${words(filled.levels[b])} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} fk ${fk(filled.levels[b]).toFixed(2)} overlap-adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`sov84: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(filled.levels[FOUR_BANDS[i]], filled.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(filled);
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('sov84: refusing to splice a lesson that fails the four-band ladder');
}
if (process.argv.includes('--measure')) process.exit(0);

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov84: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov84: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov84: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov84: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov84: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from - 1 - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov84: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov84: the id survived the excision; refusing to rebuild');
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
if (after.length !== before.length + 1) throw new Error(`sov84: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov84: week ${WEEK} is already taken`);
if (!after.includes(WEEK)) throw new Error(`sov84: week ${WEEK} is not in the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov84: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov84: spliced ${ID}`);
console.log(`sov84: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov84: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
