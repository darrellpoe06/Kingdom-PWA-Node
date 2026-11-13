// =============================================================================
// sov78-fill - build Sovereign A.I. week 78 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456). Every quoted
// verse on this page is FILLED FROM app/public/bible/kjv at build time. The
// prose below holds only a reference in double brackets, [[Luke 14:28]], and
// this script replaces it with the corpus text followed by the reference. No
// verse on the page was typed from memory, so a quotation cannot drift from the
// text and cannot be approximate. The reference list on the module's anchor is
// DERIVED from the placeholders that occur in the reader places, so anchor.ref
// names every verse the lesson stands on and nothing it does not (DR-0734).
//
// WHERE THE WORD CAME FROM. On 2026-10-27 at 19:34 UTC Darrell forwarded a
// Morning Brew daily issue, subject line "FW: ANT on the march", out of his
// university mailbox into the lesson lane, with ONE WORD typed above the
// forwarded header: Lesson. That word is the ask; the newsletter is the
// occasion only. Gmail thread `1a17edb6eaedf195`. SEVENTEEN DAYS stood between
// his word and this build, and the record keeps that rather than smoothing it.
//
// WORD FIRST (DR-0127 / DR-0282 / DR-1326). The hour opens on Luke 14:28 - the
// man intending to build a tower who sits down FIRST and counts the cost - and
// on the king who sits down and consults whether he is able. A prospectus is, in
// its form, a man sitting down to count out loud. Jesus taught the form before
// any exchange required it, and He taught what the counting is FOR. Not one
// figure from the newsletter appears above that frame.
//
// TRUST BUT VERIFY (DR-0190 / DR-0100). A newsletter is a LEAD, never the
// citation. THE PRIMARY WAS NOT READ: www.sec.gov refused this session's egress
// proxy twice by two different roads - curl got `CONNECT tunnel failed,
// response 403`, and the fetch tool got `ENOTFOUND www.sec.gov` - so no figure
// here rests on a primary-source read, and that is said in EVERY reader place
// with a dated re-review (DR-0076 section 8). Independent secondary roads were
// walked on each load-bearing number instead, and the checking CHANGED five
// things, each gated in app/src/__tests__/sovereign-ai-sov78-verses.test.js:
//   1. STRONGER, AND SAID PLAINLY (DR-0100 section 5). The 14-fold rise to
//      about 16.3 billion dollars in half-year revenue CHECKS OUT twice over.
//      A live blog of the filing reports consumption-based revenue of 13.1
//      billion as 80 percent of the total, and 13.1 divided by 0.80 is about
//      16.4 billion - an arithmetic road to the same number that does not pass
//      through the first one. Against the filing's own half-against-half
//      comparison reported elsewhere, 16.286 billion against 1.163 billion, the
//      multiple is 14.0. This digest got that right where a DIFFERENT digest
//      forwarded the SAME day under-stated the same rise as about 1,200 percent
//      (checked under DR-1457, sov77). Under-claiming is also a failure.
//   2. BIGGER IN MEANING. The 417 billion dollars is not general vendor debt.
//      Coverage of the filing describes it as future obligations to pay for
//      COMPUTE - data centers, the computing equipment inside them, and cloud
//      services. The digest's "vendors like data center operators" is true and
//      narrower than the thing it names.
//   3. CORRECTED, IN THE DIGEST'S FAVOR. "Has yet to make a profit" is true and
//      is the careful way to say it. The number loose on the internet about the
//      same filing, a loss near 80.7 billion dollars, is almost entirely a
//      NON-CASH revaluation - about 72.39 billion of it in changed fair value
//      of convertible notes and similar instruments, with the OPERATING loss
//      near 693 million (checked under DR-1457 on the same filing). The digest
//      printed no loss figure at all, which was the more honest choice.
//   4. NOT ESTABLISHED. The "94 pages" of risk warnings did not survive
//      checking. Secondary coverage puts the risk-factor section at about 80 to
//      93 pages and the sources disagree on the total, while one analysis puts
//      it at nearly a third of the whole prospectus. The SHAPE holds; the exact
//      page count does not, and is not taught here as a fact.
//   5. STRONGER, AND THE HEART OF THE HOUR. The self-warning is REAL and more
//      striking than the digest's "in an unusual step." Coverage quotes the
//      filing on systems that could take harmful actions independently and at
//      scale, and on progress running beyond the company's own ability to
//      evaluate and safeguard new models; one report says the filing allows
//      that its safety commitments may come at shareholders' expense. A company
//      wrote its own danger into the document whose whole purpose is to attract
//      money. That is not a hedge to pass over. It is the finding.
//   ATTRIBUTED, NEVER ASSERTED: the up-to-100-billion raise and the comparison
//   to a record listing (the digest itself says analysts BELIEVE it, a reported
//   amended price range conflicts, and the filing left the range blank), the
//   governance account (co-founders controlling key decisions and financially
//   disinterested safety trustees overseeing board appointments - no direct
//   excerpt was reachable, and one analysis says the trust's governing documents
//   are not fully disclosed), and the critics' objection.
//   NOT CHECKED AT ALL: the chatbot-versus-chatbot buy opinion, every market
//   index and share price in the issue, and the Microsoft, JetBlue, Brazil,
//   Oxford Street and NBA items. The Microsoft buyout share from the same day
//   was checked under DR-1457 at 26.9 percent and is not re-litigated here.
//   `re-review: 2026-11-27`.
//
// Run from the repository root:  node scripts/sov78-fill.mjs   (--rebuild to replace)
// =============================================================================
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 78;
const ID = 'sov78-count-the-cost';
const TITLE = 'Count the cost - the tower that wrote down its own danger, the four hundred billion promised, and the city whose builder is Yahweh';

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
  if (!m) throw new Error(`sov78: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov78: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov78: reference does not resolve in the corpus -> "${ref}"`);
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
// The talk-together close, in this lesson's OWN words, written at each band's
// own level, because a reader reads ONE band (DR-0795 / DR-0733).
// -----------------------------------------------------------------------------
const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask what they have already promised somebody that they are not sure they can finish, and listen all the way to the end before you offer a single solution; have them retell the promise in their own words, then teach them one verse back, Luke 14:28. Children, ask your mother, your father or a grandparent about something they signed or promised before they had counted what it would take, and what it cost them to carry it, and hear the whole of it before you say a word. Then retell their story back to them in your own words. Then ask a friend this: what are you carrying right now that you never sat down and counted first? Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - what did you say yes to that is too big for you - and listen all the way to the end before you help; have them say it back to you in their own words, then teach them one verse, Luke 14:28. Children, ask your mom or your dad or your grandma or your grandpa about a time they said yes and then it was too hard. Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: what did you promise this week that you have not done yet? Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what is one thing you started without working out what it would take - and listen all the way to the end before you fix anything; have them retell the plan in their own words, then teach them one verse, Luke 14:30. Children, ask your mom, your dad or a grandparent what they learned the hard way about owing money or owing time, hear the whole of it, then retell their answer in your own words. Then ask a friend this: if we wrote down the real cost of the thing we both want, what would be on the list? Teach each other one verse. ${RHYTHM}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what would it actually cost you to finish the thing you have told people you are doing - and listen all the way to the end instead of answering it for them; have them retell their own count back to you in their own words, then teach them one verse, Proverbs 22:7. Children, ask your mom, your dad or a grandparent who they have been obligated to, and what that obligation decided for them, hear all of it, then retell their answer in your own words. Then ask a friend this: who do each of us owe, and what does that let them decide about our week? Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - what are you building, and have you counted it - and listen all the way to the end, without finishing a sentence for them; have them retell their own count in their own words, then teach them one verse back, Psalm 127:1. Children, ask your parents or your grandparents what they owed, to whom, and for how long, and what they would tell a young person about standing surety, and hear the whole of it before you reply; then retell it back to them in your own words. Then ask a friend this: what have the two of us been building for a name rather than for a household? Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson, in eight numbered movements. The Word opens every one, and
// no figure from the newsletter stands above that frame.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.

WHO SENT THIS, AND WHEN. On the twenty-seventh of October 2026, at 19:34 by universal time, Darrell forwarded a daily business newsletter out of his university mailbox into this lane. Above the forwarded header he typed ONE WORD: Lesson. That word is the ask. The newsletter is only the occasion, and no article is the foundation of an hour in this course. Seventeen days stood between his word and this build, and that gap stands on the record here rather than being smoothed away.

What the issue carried, under a headline about a ticker symbol, was a company filing the paperwork to sell shares of itself to the public. The filing laid out what the company earns, what it owes, and - this is the part worth the hour - what it is afraid of. The newsletter reported that the company spent a long stretch of the document on warnings, and that in an unusual step it even listed worries addressed to people who were not planning to buy the stock at all: that there may not be enough safeguards to keep bad actors from using its product for weapons work or for devastating attacks on other people's systems.

A document whose entire purpose is to attract money, carrying inside it the author's own account of how the thing might go wrong. That is not a new form. It is a very old one, and the Word teaches it before any exchange on earth required it.`,

  `MOVEMENT ONE: SITTETH NOT DOWN FIRST, AND COUNTETH THE COST. Jesus asked the question that frames this whole hour, and He asked it about a building project: [[Luke 14:28]] Sitteth not down FIRST. Before the ground is broken. Before the money is raised. The counting is not a report you file afterward to explain yourself; it is the act that comes before the first shovel.

And He names what is at stake in not doing it, in two verses that are almost unkind in their plainness: [[Luke 14:29]] [[Luke 14:30]] This man began to build, and was not able to finish. That is the sentence the mockers get to say, and Jesus does not pretend they are wrong to say it. The shame is not in the smallness of the tower. It is in the half-built tower standing there as a permanent public claim about the man who started it.

Then He doubles the teaching with a second trade, so nobody can file it under construction and walk away: [[Luke 14:31]] Consulteth whether he be able. Ten thousand against twenty thousand. And the honest outcome of an honest count is sometimes not a better battle plan but terms: [[Luke 14:32]] He sendeth an ambassage, and desireth conditions of peace. A real count can end in NOT doing the thing. If your counting can only ever return yes, you were not counting.

Notice what the Lord Jesus is doing with these two pictures. He is not teaching business. He is teaching discipleship, and He chose the two most sober adult calculations He could find - a tower and a war - to say what following Him costs. So when a filing sits a company down to count out loud, the form is His. The question this course asks is whether the counting is honest, what is being counted, and who the tower is for.`,

  `MOVEMENT TWO: THE PRUDENT MAN FORESEETH THE EVIL. The newsletter treated the company's long stack of warnings as odd - a thing to raise an eyebrow at. Scripture treats it as wisdom, and says so twice in the same book in nearly the same words, which is the Word's way of underlining: [[Proverbs 22:3]] And again: [[Proverbs 27:12]]

Foreseeth the evil, and hideth himself. The prudent man is not the one with no dangers ahead of him. He is the one who has LOOKED at them and moved accordingly. The simple pass on - not because they are wicked, but because they did not look - and are punished. That is a risk register in one line, and it is an old line.

The Word also refuses to let confidence pass for courage: [[Proverbs 14:16]] The fool rageth, and is confident. A man who will not write down what could go wrong is not braver than the man who will. He is only louder.

And there is a heavier frame than prudence on this. Yahweh set a man over a city with one job - to see the sword coming and blow the trumpet - and attached the gravest possible consequence to silence: [[Ezekiel 33:6]] His blood will I require at the watchman's hand. The office is named in the next verse: [[Ezekiel 33:7]] Warn them from me.

Read the filing's safety section through Ezekiel and it reads differently. Coverage of the document quotes it on systems that could take harmful actions independently and at scale, and on capability advancing beyond the company's own ability to evaluate and safeguard new models. One report says the document allows that its safety commitments may come at the shareholders' expense. We could not read the filing itself - that road was refused, and it is named below - so this reaches us through coverage and is attributed, never asserted on our own authority. But if what is reported is what the document says, then the company blew a trumpet in the one room where blowing it costs the most. The Word has a word for not doing that: [[Proverbs 28:13]] He that covereth his sins shall not prosper.

So the warnings are not the strange part. They are the honorable part, and a lesson that passed over them to get to the money would be the one doing something strange.`,

  `MOVEMENT THREE: THE BORROWER IS SERVANT TO THE LENDER. Now the number that should hold a believer's attention longer than any other in the issue, and it is not the revenue. The newsletter reported that the company is on the hook for about four hundred and seventeen billion dollars of contractual obligations. Our own checking made that bigger in meaning rather than smaller: coverage describes the obligations as future payments for COMPUTE - the data centers, the computing equipment inside them, and the cloud services - which is more specific than vendors in general and harder to walk away from.

The Word's sentence about that posture is seven words long and it is not a warning about poverty: [[Proverbs 22:7]] Servant to the lender. The point is not that the borrower suffers. The point is that the borrower's choices now belong, in part, to somebody else. A house that has promised four hundred billion dollars to the people who own the machines has handed those people a vote in what it does next, whatever the share certificates say.

Scripture is sharpest of all about standing surety - signing for somebody else, so that when he does not pay you owe it instead: [[Proverbs 6:1]] [[Proverbs 6:2]] Snared with the words of thy mouth. Taken with the words of thy mouth. Not snared by a creditor. By your own promise. And again, bluntly: [[Proverbs 11:15]] He that hateth suretiship is sure.

And yet - this is where the Word is better than a slogan about debt - Scripture will not let you escape by simply not paying. A vow made is a vow owed: [[Ecclesiastes 5:5]] [[Deuteronomy 23:21]] The LORD thy God will surely require it of thee. And the man Yahweh welcomes into His hill is described, among other things, by this: [[Psalm 15:4]] He that sweareth to his own hurt, and changeth not. Keeping a promise that turned out to cost more than you thought is righteousness, not foolishness.

So the teaching is not that obligation is sin. It is that obligation is SERVITUDE, the servitude is real whether or not you feel it, and the only safe time to look at it is before you sign. Paul gives the standing aim: [[Romans 13:8]] Owe no man any thing, but to love one another.

Here is the household version of the same arithmetic, because this course is not about somebody else's balance sheet. Before you take the subscription, the car, the second service, the plan with the small monthly figure: count what it OBLIGATES, not what it costs this month. Write down who gets a vote in your calendar and your money as a result. That is the same count, at your scale, and your scale is the one you will answer for.`,

  `MOVEMENT FOUR: GO TO, LET US BUILD US A TOWER. There is one building project in Scripture that was counted carefully, resourced well, technically competent, and wrong. The men had their materials sorted and their method settled, and the Word records their stated purpose: [[Genesis 11:4]] Let us make us a NAME. The tower was not the goal. The name was the goal, and the tower was the instrument.

Yahweh's assessment is not that they would fail: [[Genesis 11:6]] Nothing will be restrained from them. That is not scorn. It is an acknowledgment of real capability, which makes what follows more serious rather than less: [[Genesis 11:7]] [[Genesis 11:8]] They left off to build the city.

So capability is not the question, and a count that comes out favorable is not the question. The question Babel asks every builder is: whose name is this for? A tower raised to make a name is judged even when the engineering is sound, and a tower raised in obedience is blessed even when it is small.

Against Babel the Word sets a different city, and names its builder: [[Hebrews 11:10]] Whose builder and maker is God. Abraham's city had an architect who was not Abraham. That is the whole difference. And the psalm states the rule for every build, including the ones we do with our hands this week: [[Psalm 127:1]] Except the LORD build the house, they labor in vain that build it.

In vain. Not in sin, necessarily - in VAIN. Wasted. A house can be structurally excellent and a waste of a life. That is the sharpest thing in this hour, and it applies to us and not only to a company in a filing. We build in this house too. The question is not whether our tower is well counted. It is whether Yahweh is the builder, or whether we are making a name and have learned to call it stewardship.`,

  `MOVEMENT FIVE: THE GROUND BROUGHT FORTH PLENTIFULLY. Now the growth figure, and now that the frame is set it can come in without governing anything. The newsletter reported revenue rising fourteen-fold, to about sixteen point three billion dollars in the first half of 2026, with the company not yet profitable.

Our checking made that growth figure STRONGER rather than weaker, and under-claiming a verified truth is a failure too, so here it is plainly. A live account of the same filing reports consumption-based revenue of about thirteen point one billion dollars as eighty percent of the total; thirteen point one divided by eight tenths is about sixteen point four billion, which is an arithmetic road to the same number that does not run through the first one. Against the filing's own half-against-half comparison as reported elsewhere, sixteen point two eight six billion against one point one six three billion, the multiple is fourteen. The digest Darrell sent got that right. A different digest forwarded on the SAME day under-stated the same rise, and this course checked it and said so three weeks ago.

And then Jesus tells the parable that exists for exactly this moment: [[Luke 12:16]] A certain rich man, whose ground brought forth plentifully. Note it carefully - the man did nothing dishonest. The ground produced. The problem begins in his internal monologue: [[Luke 12:17]] [[Luke 12:18]] My fruits. My goods. My barns. Six first-person pronouns before he ever reaches a conclusion. Then the conclusion: [[Luke 12:19]] Soul, take thine ease.

Yahweh's reply is one sentence and it does not argue with any of his figures: [[Luke 12:20]] This night thy soul shall be required of thee. The accounting was correct. The accountant was about to be audited by a different office. And Jesus draws the line Himself so nobody has to guess at the application: [[Luke 12:21]] Rich toward God.

So growth is not the sin and the numbers are not the sin. The sin is the sentence take thine ease, said over a stack of them. Scripture adds two more instruments to keep beside a chart like that. On how wealth behaves, where what is gathered by hand increases and what comes by vanity shrinks: [[Proverbs 13:11]] On what wanting it does to a man: [[1 Timothy 6:9]] Drowned in destruction and perdition. And on how fast it can leave: [[Proverbs 23:5]] They fly away as an eagle toward heaven.

A fourteen-fold rise is a remarkable thing and we are not going to pretend otherwise. It is also, by itself, no evidence whatever about whether a thing is good, will last, or is rich toward Yahweh.`,

  `MOVEMENT SIX: EVERY WAY OF A MAN IS RIGHT IN HIS OWN EYES. The issue ended its lead story on a joke that is not really a joke. Asked whether the company was a buy, the company's own chatbot said yes at a sensible price, and a rival's chatbot disagreed. We did not check that exchange at all and we are not teaching from it as reported fact. But the SHAPE of it is worth naming, because somebody in the congregation will do it this week in earnest.

The Word's law of evidence was settled before any of this: [[Deuteronomy 19:15]] At the mouth of two witnesses, or at the mouth of three. One voice does not establish a matter. Not because one voice is a liar - the law never says that - but because establishing is a higher bar than hearing.

And on the particular trap of consulting yourself: [[Proverbs 21:2]] Right in his own eyes. The LORD pondereth the hearts. Paul will not even accept his own verdict on himself: [[1 Corinthians 4:4]] I judge not mine own self.

A tool made by a company, asked whether that company is a good investment, is not two witnesses. It is one witness wearing a confident voice, and its confidence is the part that makes it dangerous rather than the part that makes it useful. Isaiah names both the inversion and the self-regard behind it: [[Isaiah 5:20]] [[Isaiah 5:21]] Woe unto them that are wise in their own eyes.

And the deepest version of the error is not about stocks at all: [[Jeremiah 17:5]] Cursed be the man that trusteth in man, and maketh flesh his arm. Making flesh your arm is leaning your weight on a thing that cannot hold it. A machine is further from being able to hold your weight than a man is, not closer. This course has said all year that these tools are instruments and not counselors; this is the same bright line, drawn at the place where a tool is asked to speak about its own maker's worth.`,

  `MOVEMENT SEVEN: WHO SITS AS TRUSTEE, AND WHO HOLDS THE KEY. The newsletter described the company's arrangement for who decides things: the co-founders keeping control of key decisions, and trustees described as financially disinterested, whose concern is safety, overseeing who gets onto the board. Critics in the same paragraph said this concentrates control with management at the shareholders' expense. We could reach no direct excerpt of any of that, and one analysis says the trust's governing documents are not fully disclosed, so the whole account is attributed here and taught as nothing more.

But the DESIGN is ancient and the Word has already specified it. When Moses was told to build the first layer of judges under him, the specification was about character before competence, and it named money explicitly: [[Exodus 18:21]] Men of truth, HATING covetousness. Not merely uninterested in gain. Hating the pull of it. Financially disinterested is a modern phrase for a very old requirement, and the Word knows exactly why the requirement exists: [[Deuteronomy 16:19]] A gift doth blind the eyes of the wise. Blind. Not tempt - blind. The bribe does not make a wise man choose wrongly; it makes him unable to see that he has.

So a structure that deliberately seats somebody with no financial stake over the question of safety is doing something the Word commends in principle, whatever a critic says about shareholder value, and we will say that plainly rather than hedge it.

And then the limit, which is the real teaching of this movement. No charter, trust, class of shares or board seat finally holds authority, and Scripture is emphatic about where the keys are: [[Isaiah 22:22]] And the risen Lord Jesus holds that same key by name: [[Revelation 3:7]] He that openeth, and no man shutteth. Over the heads of the men who think they are steering: [[Proverbs 21:1]] The king's heart is in the hand of the LORD. Over the whole earth, with nobody entitled to a review: [[Daniel 4:35]] None can stay his hand, or say unto him, What doest thou? And the specific office of moving the people who sit in chairs: [[Daniel 2:21]] He removeth kings, and setteth up kings.

Governance structures are good and worth building well. They are not sovereignty. The distinction is the name of this course.`,

  `MOVEMENT EIGHT: BUILD YE HOUSES, AND DWELL IN THEM. So what does a household do with an hour like this? Not nothing, and not panic. The Word's instruction to people living inside somebody else's empire, with no control over its filings, its towers or its obligations, was startlingly ordinary: [[Jeremiah 29:5]] Build ye houses, and dwell in them; and plant gardens, and eat the fruit of them.

Build. Dwell. Plant. Eat. That is said to exiles in Babylon - the actual Babylon, downstream of the actual tower - and it is the sovereign posture this course has been teaching all along. You do not need to own the empire's machines to have a house you dwell in. The promise it points at is a man under his own vine: [[Micah 4:4]] None shall make them afraid.

The New Testament keeps the same register, and it is deliberately unimpressive: [[1 Thessalonians 4:11]] Study to be quiet, and to do your own business, and to work with your own hands. And again, as a command with bread attached: [[2 Thessalonians 3:12]] That is the answer to a season of enormous numbers. Not a bigger tower. Your own work, done with your own hands, in quiet, on hardware and in a household you actually hold.

And the last count. Jesus closed His longest sermon with two builders and one storm, and the difference between them was not the count and not the material: [[Matthew 7:24]] [[Matthew 7:25]] It fell not: for it was founded upon a rock. And the other: [[Matthew 7:26]] [[Matthew 7:27]] Great was the fall of it.

Both men built. Both houses looked like houses on a clear day. The storm was the audit, and the audit was about the foundation, which is the one part nobody can see from the street. No prospectus can disclose that. No filing can count it.

WHAT WE CHECKED AND WHAT WE DID NOT. The newsletter is a lead and never the citation. THE PRIMARY WAS NOT READ: www.sec.gov refused this session's network boundary twice by two different roads, once with a proxy tunnel refusal and once with a name that would not resolve, so not one figure in this lesson rests on a primary-source read. Independent secondary roads were walked instead, and the checking changed five things, listed plainly rather than claimed: the fourteen-fold rise to about sixteen point three billion checked out STRONGER, by an arithmetic road that does not pass through the first; the four hundred and seventeen billion is COMPUTE obligations specifically, which is bigger in meaning than the digest's wording; has yet to make a profit was the careful way to say it, since the enormous loss figure loose on the internet about the same filing is almost all a non-cash revaluation with the operating loss near six hundred and ninety-three million; the ninety-four pages of risk did NOT survive checking, since coverage puts that section at roughly eighty to ninety-three pages and disagrees on the total, so no page count is taught here; and the self-warning is REAL and more striking than the digest's phrasing, which is the finding of the hour rather than a footnote. Attributed and never asserted: the up-to-one-hundred-billion raise and the record comparison, the governance account, and the critics' objection. Not checked at all: the two chatbots' opinions, every index and share price in the issue, and every other story in the newsletter. A dated re-review stands against all of it - re-review: 2026-11-27 - because a blocked road must never be left reading like a verified claim.

So: count the cost, and count it first. Write down what could go wrong where it costs you something to write it. Know what you have obligated and who that makes you servant to. Ask whose name the tower is for. Do not take a growth number for a verdict. Do not accept one confident witness, least of all one that sells the thing it is praising. Build well, govern honestly, and know that governance is not sovereignty.

And the foundation. He is Jesus, the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne is for ever and ever, [[Hebrews 1:8]] and by whom all things consist. [[Colossians 1:17]] He is the rock the house is set on, and He was counted, and He paid the whole cost, and He finished it.`,

  TALK.lesson,
];

// -----------------------------------------------------------------------------
// THE FOUR AGE BANDS, each written FOR ITS READER rather than trimmed from the
// adult text. Each opens by naming the lesson, each carries the Word-first
// frame, the blocked-road honesty, and its own talk-together close in all three
// directions.
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.

Today we learn to count first. Count the cost means this. Before you start a thing, you add up what it will take. You do that FIRST. Not after.

Here is how the day began. It was a Tuesday in October. Darrell got a news letter in his work mail. It was about a big company. He sent it to us. On the top he typed one word. The word was Lesson. That one word is the job. The news letter is just the reason. Then seventeen days went by before we built this. We tell you that. We do not hide it.

The company wanted to sell parts of itself. So it had to write a big paper. The paper said how much money came in. It said how much money it owes. And it said one more thing. It said what could go wrong. The company wrote down its own bad news. In its own paper. That is the part we want you to see.

HERE IS THE VERSE THE WHOLE DAY STANDS ON. Jesus asked a question about building. [[Luke 14:28]] Look at the word first. Sitteth not down FIRST. You sit down and count before you build. Not in the middle. Not at the end. First.

Jesus said what happens if you do not. [[Luke 14:29]] [[Luke 14:30]] People walk by and say, he started and he could not finish. That is a sad thing to hear. So count first.

Then Jesus said it again with a king. [[Luke 14:31]] The king sits down too. He asks, can I do this with what I have? Sometimes the answer is no. And look what the king does then. [[Luke 14:32]] He asks for peace. He does not go. That is a good ending, not a bad one.

So here is a true thing. If your counting can only say yes, you are not really counting.

NOW THE SECOND PART. Writing down what could go wrong is a wise thing. Not a weird thing. The Word says it twice. [[Proverbs 22:3]] [[Proverbs 27:12]] A wise man sees trouble coming. Then he moves. The simple one walks right on. He did not look. So he gets hurt.

And loud is not the same as brave. [[Proverbs 14:16]] A fool is loud and sure. A wise man looks and steps away.

Yahweh once gave a man one job in a town. Watch for the sword. Blow the horn. [[Ezekiel 33:6]] If he sees it and says nothing, that is on him. Here is the job. [[Ezekiel 33:7]] Warn them from me.

So when that big company wrote down its own danger, it blew the horn. In the one room where blowing it costs money. The Word likes that. [[Proverbs 28:13]] Hiding a wrong thing never works.

WE MUST TELL YOU ONE MORE THING. We could not read the real paper. We tried. The web page would not let us in. Twice. Two ways. So we are telling you what OTHER people said the paper says. We are not telling you we read it. That is honest. And we put a date to go look again. The date is the twenty-seventh of November 2026.

NOW THE BIG NUMBER. The company promised to pay about four hundred and seventeen billion dollars. That is for computers and big buildings full of computers. Four hundred and seventeen billion is more money than you can picture. I cannot picture it either.

Here is what the Word says about owing. [[Proverbs 22:7]] The one who owes is a servant to the one he owes. Think about that. If you owe somebody, they get a say in your day. Not all of it. But some.

And the Word is very clear about promising to pay for what you do not have yet. [[Proverbs 6:1]] [[Proverbs 6:2]] You get caught by your own mouth. Not by a mean man. By your own words. And again. [[Proverbs 11:15]]

But you cannot just skip paying. A promise is a promise. [[Ecclesiastes 5:5]] And Yahweh says He will ask you for it. [[Deuteronomy 23:21]] And here is a good man in a psalm. He promised. It turned out to cost more. He paid anyway. [[Psalm 15:4]]

That is the hard good part. Keep your word even when it costs more than you thought.

And here is the plan. [[Romans 13:8]] Owe no man any thing, but to love one another.

HERE IS A STORY ABOUT A TOWER. Long ago some men built a tower. They were good at it. They had their stuff ready. But listen to why they did it. [[Genesis 11:4]] Let us make us a NAME. They wanted to be famous.

Yahweh did not say they were too weak. [[Genesis 11:6]] He said nothing would stop them. So they were good builders. That was not the problem. The problem was the name.

Then Yahweh mixed up their talk. [[Genesis 11:7]] [[Genesis 11:8]] And they stopped building.

So being good at a thing is not enough. The real question is this. Who is this for?

The Word tells us about a better city. [[Hebrews 11:10]] Whose builder and maker is God. A man named Abraham waited for a city that Yahweh built. Not one he built.

And here is the rule for every house. [[Psalm 127:1]] If Yahweh does not build it, the work is wasted. Not bad. Wasted. You can build a good strong thing and waste your whole life doing it.

THE MONEY GREW A LOT. The company took in a lot more money than the year before. Fourteen times more. About sixteen point three billion dollars in half a year. We checked that one. We checked it a second way too, with math. It is true. We say so plainly. A true thing should be said plain.

But growing is not the same as good. Jesus told a story about that. [[Luke 12:16]] A rich man's farm grew a lot of food. He did nothing wrong to get it. The field just grew.

Then listen to him talk to himself. [[Luke 12:17]] [[Luke 12:18]] My food. My stuff. My barns. He says my a lot. Then he says this. [[Luke 12:19]] Soul, take thine ease.

And Yahweh answers him. [[Luke 12:20]] This night thy soul shall be required of thee. His math was right. But that was not the test.

Jesus tells us the point. [[Luke 12:21]] Be rich toward God.

So money is not the sin. The words take it easy, said over a big pile, is the sin.

Three more verses to keep. [[Proverbs 13:11]] [[1 Timothy 6:9]] [[Proverbs 23:5]] Money can fly away like a bird.

ONE MORE THING, AND IT IS FUNNY AND SERIOUS. Somebody asked the company's own computer helper if the company was a good buy. It said yes. We did not check that story. We are not teaching it as a fact. But think about it.

A tool made BY a company, asked ABOUT that company. That is one voice. And the Word says one voice is not enough. [[Deuteronomy 19:15]] You need two or three.

And here is why you cannot just ask yourself. [[Proverbs 21:2]] Every man thinks he is right. But Yahweh looks at the heart. Even Paul would not judge himself. [[1 Corinthians 4:4]]

And the worst mix up. [[Isaiah 5:20]] [[Isaiah 5:21]] Do not be wise in your own eyes.

And do not lean on people or machines to hold you up. [[Jeremiah 17:5]] A machine cannot hold your weight. A person cannot either. Yahweh can.

WHO IS REALLY IN CHARGE. The company set up rules about who gets to decide things. Some people with no money in it watch over safety. We could not read those rules either, so we only tell you it was said.

But the idea is old. When Moses picked helpers, here is what Yahweh asked for. [[Exodus 18:21]] Men of truth who HATE wanting money. Not just men who do not care about money. Men who hate the pull of it.

And here is why. [[Deuteronomy 16:19]] A gift makes a wise man blind. Blind. He cannot even see that he went wrong.

So putting somebody with no money in it over safety is a good idea. We will say that out loud.

But no rule book is really in charge. Yahweh is. [[Isaiah 22:22]] And Jesus holds that same key. [[Revelation 3:7]] He opens and no man shuts it. Even kings. [[Proverbs 21:1]] And the whole earth. [[Daniel 4:35]] And He moves the men in the big chairs. [[Daniel 2:21]]

Rules are good. But rules are not Yahweh.

SO WHAT DO WE DO? Something small and good. Yahweh told His people in a big scary city to do this. [[Jeremiah 29:5]] Build houses. Live in them. Plant a garden. Eat the food.

That is it. You do not need to own the giant machines to have a home. [[Micah 4:4]] None shall make them afraid.

And the New Testament says the same quiet thing. [[1 Thessalonians 4:11]] Be quiet. Do your own work. Use your own hands. [[2 Thessalonians 3:12]]

LAST, THE TWO HOUSES. Jesus told about two men. Both built. Then a storm came. [[Matthew 7:24]] [[Matthew 7:25]] One house stood. It was on rock. [[Matthew 7:26]] [[Matthew 7:27]] One house fell down hard.

Both houses looked fine on a sunny day. The storm asked about the bottom part. The part nobody can see. No paper can tell you about that part.

And here is the rock. He is Jesus, the Lamb of Yahweh, [[John 1:29]] the Son of Yahweh that the Father gave, [[John 3:16]] whose throne is for ever, [[Hebrews 1:8]] and all things hold together in Him. [[Colossians 1:17]] He was counted. He paid all of it. And He finished.

YOUR OWN COUNT, THIS WEEK. Get a piece of paper. Write the word COUNTED at the top. Put today's date under it.

Make three columns. The first one says WHAT I AM MAKING. The second one says WHAT IT WILL TAKE. The third one says WHO GETS A SAY.

That third one is the hard one. Here is what it means. If you owe somebody, they get a say in your day. Even a little bit. So write their name down.

Then turn the paper over. Write three things that could go wrong. Say them to a grown up. Out loud. Not just in your head.

A danger you only say in your head is not said. That is the whole point of today.

Then pick one verse from this lesson. Learn it by heart. Say it at the table. Say it in the car. Say it at bed time. Say it when you get up. That is four places, and the Word tells us all four.

ONE LAST THING. When we checked things for this lesson, one thing got BIGGER. The money the company took in really did grow fourteen times. We checked it two ways. Both ways said yes.

So we say it plain. We do not make a true thing sound small. That would be a lie too. A small lie, but still a lie.

And one thing got smaller. The news letter said ninety-four pages of warnings. We could not prove that. Other people say maybe eighty pages. Maybe ninety-three. They do not agree. So we do not teach that number at all. We just tell you we could not prove it.

That is how you do it. You say what you found. You say what you missed. You do not fill in the hole with a guess.

${TALK.child}`;

const YOUTH = `${TITLE}.

Count the cost means one thing. You work out what a thing will take. You do it before you start. The tower in this lesson is a real one, and so is the four hundred billion. Keep the title in front of you, because every part below is one piece of it.

HOW THIS LESSON GOT HERE. On Tuesday the twenty-seventh of October 2026, Darrell sent a business newsletter into our lane. It came out of his work mail. The clock said 19:34, by the time the whole world shares. Above the forwarded part he typed one word: Lesson. That word is the job. The newsletter is only the reason the job came today. Then seventeen days passed before anyone built it. We write that down. We do not pretend it was quick.

The lead story was about a company that builds A.I. It filed papers to sell shares to the public. Those papers must say three things. What comes in. What is owed. And what might go wrong. The third one is why this is a lesson. The company spent a long stretch of that paper on things that could go badly. The newsletter said that was odd.

THE WORD GOES FIRST, AND IT GOT HERE WAY AHEAD OF ANY STOCK EXCHANGE. Jesus asked a question about a building project: [[Luke 14:28]] The weight of that verse sits on one word. The word is first. Sits down first. Counts first. You do not count halfway up the tower. Not when the money runs out.

He said out loud what happens otherwise: [[Luke 14:29]] [[Luke 14:30]] A half-built tower is a sign about the builder. It stays up for years. Jesus does not argue with the people who mock. He just says count first. Do not give them the chance.

Then He taught it again. This time with a king, not a builder: [[Luke 14:31]] Ten thousand against twenty thousand. And He gives the honest ending. Nobody wants to hear it: [[Luke 14:32]] Terms. Not a battle. A real count sometimes comes back no. That is a count that worked. Not one that failed.

Test yourself with that. Can your planning only ever end in go ahead? Then you were never planning. You had decided. Then you decorated.

WRITING DOWN YOUR OWN DANGER IS WISDOM. The newsletter treated a long list of warnings as strange. Scripture treats it as the mark of a wise man. It says it twice, in almost the same words, so you cannot miss it: [[Proverbs 22:3]] [[Proverbs 27:12]] The prudent one is not the man with no trouble ahead. He is the man who looked at the trouble. Then he moved. The simple one keeps walking. He never looked.

And being loud is not the same as being brave: [[Proverbs 14:16]]

There is a heavier frame on this too. Yahweh gave one man a single job over a city. See the sword. Blow the trumpet. Then He put the weight of the silence on him: [[Ezekiel 33:6]] [[Ezekiel 33:7]] Warn them from me.

Reports on that filing quote it two ways. Its systems could do harm on their own, and at scale. And the work may run past the firm's own means to check and guard new models. One report says the paper even grants this. Keeping its safety promises might cost the share owners money. We could not read that paper ourselves. We will explain why in a second. So that is other men's reading, not ours. But if that is what it says, then the firm blew the trumpet. It blew it in the room where blowing it costs the most. [[Proverbs 28:13]]

WHAT WE COULD NOT CHECK, SAID BEFORE WE USE ANY NUMBER. The newsletter is a lead, not a source. We tried to read the real filing on the government's own site. We were refused twice. Two different roads. One came back as a blocked tunnel. The other as a name that would not resolve at all. So no figure here rests on reading the first source. We walked other roads instead. And we will tell you which numbers got stronger. We will tell you which one did not survive. Go back and check again after the twenty-seventh of November 2026.

THE NUMBER THAT MATTERS MOST IS NOT THE REVENUE. It is about four hundred and seventeen billion dollars the company has promised to pay out. Our checking made that heavier, not lighter. The reports call it future pay for compute. The data centers. The machines inside them. Cloud services. That is a harder promise to walk away from than ordinary supplier bills.

The Word's line about that position is short: [[Proverbs 22:7]] Servant to the lender. Read that with care. It is not mainly about being poor. It is about who gets a vote. When you owe a man, part of your next choice is his.

Scripture is hardest of all on promising to cover what you do not have: [[Proverbs 6:1]] [[Proverbs 6:2]] Caught by your own mouth. Not trapped by a lender. Trapped by your own promise. And flatly: [[Proverbs 11:15]]

But here the Word beats any slogan about debt. It will not let you off by just not paying: [[Ecclesiastes 5:5]] [[Deuteronomy 23:21]] And the man Yahweh welcomes is partly described like this: [[Psalm 15:4]] He promised. It cost more than he thought. He did not change. That is right, and it is dear.

The aim Paul sets: [[Romans 13:8]]

Your version is not a filing. It is the plan you pay each month. The phone. The car. The thing with a small number on it. Count what it BINDS you to. Not what it costs this month. Then write down who gets a vote in your week.

THE TOWER THAT WAS BUILT WELL AND WAS STILL WRONG. One project in Scripture was planned, funded, skilled and wrong. The Word keeps the builders' own stated reason: [[Genesis 11:4]] A name. The tower was only the tool. The fame was the point.

Yahweh's reaction is not that they were incompetent: [[Genesis 11:6]] Nothing will be restrained from them. That is real praise of what they could do. And it makes what comes next more grave: [[Genesis 11:7]] [[Genesis 11:8]]

So skill is not the question and a favorable count is not the question. Babel asks every builder one thing: whose name is this for?

Set against Babel, Scripture gives a new city. And it names the builder: [[Hebrews 11:10]] And then the rule over every build including ours: [[Psalm 127:1]] In vain. Wasted, not wicked. You can build a fine thing. And waste a life on it.

GROWTH IS NOT A VERDICT. Now the big figure. And now it cannot run the lesson. Money coming in rose fourteen times. To about sixteen point three billion dollars in six months. And the firm still turns no profit.

Our checking made that growth figure STRONGER. So we say it plain. We do not hedge a true thing. A live report of the same filing helps here. It gives usage money of about thirteen point one billion. And it calls that eighty percent of the whole. Now do the math. Thirteen point one over zero point eight is about sixteen point four billion. A second road to the same answer. Set the filing's own halves side by side, as reported elsewhere. Sixteen point two eight six billion against one point one six three billion. The multiple really is fourteen. The newsletter Darrell sent got it right. A different one, sent the same day, put the same rise too low. This course checked that three weeks ago and said so.

One figure did NOT survive checking. The ninety-four pages of warnings could not be confirmed. Reports put that part near eighty pages. Others say ninety-three. The sources disagree on the total. So no page count is taught here as fact. The shape of the thing holds. The exact number does not.

Then Jesus tells the story built for this exact moment: [[Luke 12:16]] No fraud took place. The field produced. The trouble starts in the man's own head: [[Luke 12:17]] [[Luke 12:18]] My fruits, my goods, my barns. Then the conclusion: [[Luke 12:19]]

Yahweh's answer fights none of his numbers: [[Luke 12:20]] The math was fine. The man doing the math was being checked by a new office. And Jesus names the point Himself: [[Luke 12:21]]

Three instruments to keep beside any growth chart: [[Proverbs 13:11]] [[1 Timothy 6:9]] [[Proverbs 23:5]]

ONE CONFIDENT VOICE IS NOT EVIDENCE. The story ended on a joke that is not really a joke. The firm's own chat tool was asked if the firm was worth buying. It said yes, at a fair price. We did not check that. We teach nothing from it. But someone your age will do it for real this week. So look at the shape.

The Word settled the law of evidence long before any of this: [[Deuteronomy 19:15]] One voice does not settle a matter. The law never calls the one witness a liar. It just says one is not enough.

And on asking yourself: [[Proverbs 21:2]] Paul would not even accept his own verdict on himself: [[1 Corinthians 4:4]]

A tool built by a firm, asked about that firm, is one witness. It has a sure voice. The sure tone is the hard part, not the good part. [[Isaiah 5:20]] [[Isaiah 5:21]]

And the deepest version has nothing to do with shares: [[Jeremiah 17:5]] To make flesh your arm is to lean your weight on what cannot hold it. A machine is further from holding you than a man is. Not closer.

WHO SITS IN THE CHAIRS. The firm's plan, as reported, keeps the big choices with the founders. And it puts men with no money stake over safety. Over who joins the board, too. Critics said that packs power in few hands. We got no direct quote of any of it. And one report says the trust's own papers are not fully public. So all of that is some other man's account.

The design, though, is ancient. When Moses was told to name judges, the spec put character before skill. And it named money: [[Exodus 18:21]] Men of truth, hating covetousness. Hating the pull of it. Not just letting it be. And the reason: [[Deuteronomy 16:19]] A gift blinds. Not tempts. Blinds. You stop being able to see that you went wrong.

So seating a man with nothing to gain over the safety question is a thing the Word praises in kind. We will say that plain. We will not hedge it.

But no charter is finally in charge: [[Isaiah 22:22]] And Jesus holds that key by name: [[Revelation 3:7]] Over kings: [[Proverbs 21:1]] Over the earth, with no appeal: [[Daniel 4:35]] And over who sits where: [[Daniel 2:21]]

Rules of governing are worth building well. They are not the throne. That difference is the name of this course.

SO WHAT DOES A HOUSEHOLD DO. Something plain and real. Here is what Yahweh told people who lived inside another man's empire: [[Jeremiah 29:5]] Build. Live there. Plant. Eat. He said it to exiles in the real Babylon. Just downstream of the real tower.

The promise it points to: [[Micah 4:4]] And the same register in the New Testament: [[1 Thessalonians 4:11]] [[2 Thessalonians 3:12]] That is the answer to a time of huge numbers. Not a bigger tower. Your own work. Your own hands. Quiet. On things you really hold.

THE LAST COUNT. Jesus closed His longest sermon with two builders and one storm. The difference was not the count. It was not the stuff they used: [[Matthew 7:24]] [[Matthew 7:25]] [[Matthew 7:26]] [[Matthew 7:27]]

Both built. Both looked like houses on a clear day. The storm was the test. And the test was about the base. That is the one part you cannot see from the road. No filing can show it.

He is the rock: Jesus, the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne is for ever, [[Hebrews 1:8]] by whom all things consist. [[Colossians 1:17]] He was counted, He paid the whole cost, and He finished it.

WHAT CHECKING MADE BIGGER, AND WHAT IT KILLED. This is the part most lessons skip. We will not.

One figure got STRONGER. The fourteen-fold rise is real. We proved it a second way. The second way does not go through the first. That matters. Two roads, one answer.

Why say so loudly? Because making a true thing sound small is also a lie. It just feels humble. This house has a name for it. Under-claiming. It is a failure, same as boasting.

One figure died. The ninety-four pages of risk warnings did not hold up. Coverage puts it near eighty pages. Other coverage says ninety-three. They disagree on the total. So we teach no page count at all. We name the gap instead.

One figure got bigger in MEANING. The four hundred and seventeen billion is not ordinary supplier debt. It is compute. Data centers. The machines inside them. Cloud services. That is much harder to walk out of.

And one thing was fairer to the newsletter than the internet was. It wrote has yet to make a profit. It printed no loss number. Good. The huge loss figure going around is mostly a paper adjustment, not cash burned. The careful phrase was the honest one.

YOUR OWN COUNT. Head a page COUNTED. Date it. Three columns: what I am building, what it will take to finish, who gets a vote because of it.

The third column is the one that stings. Every promise hands somebody a partial vote in your week. Write the names. Count the votes you have already given away.

Then write your risk page. Three things that could stop you. Say them where it costs you something. At the table. To the person counting on you.

A danger you will only name in private is not named. That is Proverbs 22:3 with a pen in your hand.

${TALK.youth}`;

const TEEN = `${TITLE}.

This hour is about one skill: you count the cost of a thing before you build it. The tower, the four hundred billion promised, and the city whose builder is Yahweh are the three parts. Hold the title, because each movement is one of them.

WHERE IT CAME FROM. On 2026-10-27 at 19:34 UTC Darrell forwarded a business newsletter from his university mailbox into this lane. One word sat above the forwarded header: Lesson. That word is the ask. The newsletter is the occasion. Seventeen days passed before the build, and the record keeps that.

The lead story: a company that builds A.I. filed to sell shares to the public. A filing like that must state the income, the obligations, and the risks. The third is why this is a lesson. The newsletter called it unusual that the company spent so much of the document on what could go wrong, and even addressed warnings to people who were not buying the stock - that there may not be enough safeguards to stop bad actors using the product for weapons work or for serious attacks on other people's systems.

WORD FIRST. Jesus taught the form of a prospectus before any exchange existed. [[Luke 14:28]] Everything hangs on one word: first. Sits down first. Counts first. The count is not a report you file later to justify what you already did.

He states the cost of skipping it. [[Luke 14:29]] [[Luke 14:30]] An unfinished tower is a permanent public statement about whoever started it. Jesus does not dispute the mockers. He says do not hand them the material.

He teaches it twice, so it cannot be filed under construction and dismissed. [[Luke 14:31]] Ten thousand against twenty thousand. And He supplies the ending nobody wants. [[Luke 14:32]] Terms, not a campaign. A genuine count sometimes returns no, and that is the count working.

Here is the test for your own planning. If it can only ever return go, you were not evaluating. You had already decided and were assembling support.

WRITING DOWN YOUR OWN DANGER IS COMMENDED, NOT ODD. Scripture states it twice in nearly identical words, which is how the Word underlines. [[Proverbs 22:3]] [[Proverbs 27:12]] The prudent man is not the one with no hazard ahead. He is the one who examined the hazard and adjusted. The simple keep walking because they never examined anything.

Confidence is not courage. [[Proverbs 14:16]]

And there is a graver frame on it. Yahweh assigned one man a single duty over a city, and attached the consequence to his silence. [[Ezekiel 33:6]] His blood will I require at the watchman's hand. The office. [[Ezekiel 33:7]]

Reported coverage of the filing quotes it on systems that could take harmful actions independently and at scale, and on capability advancing past the company's own ability to evaluate and safeguard new models. One report says the document concedes that honoring its safety commitments may cost shareholders. That reaches us through coverage, not through the document, and the reason is stated below. If the reports are accurate, the company sounded an alarm in the one room where sounding it is most expensive. [[Proverbs 28:13]]

THE ROAD THAT WAS REFUSED, STATED BEFORE ANY FIGURE IS USED. A newsletter is a lead and never a citation. This build tried to read the filing on the government's own archive and was refused twice by two separate routes: a proxy tunnel refusal, and a hostname that would not resolve. So no number in this lesson rests on a primary read. Independent secondary routes were walked instead, and what the checking changed is listed rather than claimed. A dated re-review stands on all of it: re-review 2026-11-27.

THE OBLIGATION, WHICH IS THE NUMBER TO WATCH. About four hundred and seventeen billion dollars in contractual obligations. Checking made it heavier: coverage describes it as future payments for compute - the data centers, the equipment inside them, and cloud services. That is more exact than plain supplier debt, and far harder to exit.

[[Proverbs 22:7]] Servant to the lender. Read it precisely. The lesson is not poverty. The lesson is that part of your next decision now belongs to somebody else. A company that has promised four hundred billion dollars to the owners of the machines has given those owners a vote in its direction, whatever the share classes say.

Scripture is hardest on surety - signing for somebody else, so you owe it instead. [[Proverbs 6:1]] [[Proverbs 6:2]] Snared with the words of thy mouth. Not by a creditor. By your own promise. [[Proverbs 11:15]]

And the Word will not let you escape through non-payment either. [[Ecclesiastes 5:5]] [[Deuteronomy 23:21]] The man Yahweh receives is described in part by this. [[Psalm 15:4]] He swore, it cost more than he expected, and he did not change. That is righteousness, and it is expensive.

The standing aim. [[Romans 13:8]]

Your scale is the one you answer for. Before the subscription, the plan, the car, the second service: count what it binds you to rather than what it costs this month, and name who receives a vote in your week as a result.

BABEL: COUNTED WELL, BUILT WELL, WRONG. One project in Scripture was planned, funded, skilled and wrong, and the Word records the builders' own purpose. [[Genesis 11:4]] A name. The tower was the instrument; the name was the objective.

Yahweh does not call them incapable. [[Genesis 11:6]] Nothing will be restrained from them. That is a real nod to what they could do, which makes the judgment heavier rather than lighter. [[Genesis 11:7]] [[Genesis 11:8]]

So capability is not the question, and a count that comes out well is not the question. Babel asks one thing of every builder: whose name is this for?

Against it, a different city with a named architect. [[Hebrews 11:10]] And the rule over every build, including the ones in this house. [[Psalm 127:1]] In vain. Wasted, not wicked. A thing can be built well and still waste a life.

GROWTH IS NOT A VERDICT. Revenue rose fourteen-fold to about sixteen point three billion dollars in the first half of 2026, with no profit yet.

Checking made that STRONGER, and under-claiming a verified fact is also a failure, so it is stated plainly. A live account of the same filing reports consumption revenue of about thirteen point one billion as eighty percent of the total; thirteen point one over zero point eight is about sixteen point four billion - a math road to the same figure that does not pass through the first. Against the filing's own half-against-half comparison as reported elsewhere, sixteen point two eight six billion against one point one six three billion, the multiple is fourteen exactly. This newsletter got it right. A different newsletter forwarded the same day understated the same rise, and this course measured that three weeks ago.

One claim did not survive. The ninety-four pages of risk warnings could not be confirmed. Secondary coverage places that section at roughly eighty to ninety-three pages and disagrees on the total, while one report puts risk at nearly a third of the whole filing. The shape holds. The page count is not taught here.

Three more figures are quoted to others and never claimed by us: the possible hundred-billion raise and the match-up with a record listing, which the newsletter itself frames as what traders believe; the governance description; and the critics' objection. Not checked at all: the two chatbots, every index and share price, and every other story in the issue.

Then the parable written for this moment. [[Luke 12:16]] No fraud took place. The ground produced. The fall starts in his own head. [[Luke 12:17]] [[Luke 12:18]] My fruits, my goods, my barns. Then the conclusion. [[Luke 12:19]]

Yahweh's reply disputes none of his arithmetic. [[Luke 12:20]] The accounting was accurate. The accountant was about to be examined by another office. Jesus states the point Himself. [[Luke 12:21]]

Three instruments to keep beside a chart. [[Proverbs 13:11]] [[1 Timothy 6:9]] [[Proverbs 23:5]]

ONE CONFIDENT WITNESS IS NOT EVIDENCE. The story closed on the company's own chatbot being asked whether the company was a buy and answering yes at a sensible price. Unchecked, and taught as nothing. But the shape matters, because someone will do it in earnest this week.

The law of evidence was settled long before this. [[Deuteronomy 19:15]] One voice does not establish a matter. The law never calls a single witness a liar; establishing is simply a higher bar than hearing.

On self-consultation. [[Proverbs 21:2]] Paul declines even his own verdict on himself. [[1 Corinthians 4:4]]

A tool built by a company, asked about that company's worth, is one witness with a confident voice, and the sure tone is the hazard rather than the worth. [[Isaiah 5:20]] [[Isaiah 5:21]]

The deepest form of the error has nothing to do with shares. [[Jeremiah 17:5]] Making flesh your arm is resting your weight on what cannot carry it. A machine is further from carrying your weight than a man is, not nearer. This course has taught all year that these are tools and not guides. This is the same line, drawn where a tool is asked to price its own maker.

GOVERNANCE, AND ITS CEILING. As reported, key decisions stay with the founders, and trustees said to hold no money stake watch over safety and board seats. Critics said this concentrates control at shareholders' expense. No direct excerpt was reachable, and one analysis says the trust's governing documents are not fully disclosed, so the whole account is attributed.

The design is ancient. The spec for the first judges put character before skill and named money. [[Exodus 18:21]] Men of truth, hating covetousness. Hating the pull, not merely declining it. And the reason. [[Deuteronomy 16:19]] A gift blinds. Not tempts - blinds. It takes away your means to see that you have gone wrong.

So seating a man with no money stake over the safety question is praised in kind, whatever a critic says about share value, and that is said plainly rather than hedged.

Then the ceiling. No charter, trust, share class or board seat finally holds the rule. [[Isaiah 22:22]] The risen Lord Jesus holds that key by name. [[Revelation 3:7]] Over the men who think they steer. [[Proverbs 21:1]] Over the earth, with no right to appeal. [[Daniel 4:35]] And over who occupies the chairs. [[Daniel 2:21]]

Rules of governing are worth building well. They are not the throne.

WHAT A HOUSEHOLD DOES. Yahweh's instruction to people living inside somebody else's empire, with no say over its filings or its towers, was plain on purpose. [[Jeremiah 29:5]] Build, dwell, plant, eat - said to exiles in the actual Babylon, downstream of the actual tower. The promise behind it. [[Micah 4:4]] The same register in the New Testament. [[1 Thessalonians 4:11]] [[2 Thessalonians 3:12]]

That is the answer to a season of enormous numbers. Not a larger tower. Your own work, with your own hands, quietly, on hardware and in a household you actually hold. That sentence is the whole reason this course exists.

THE LAST COUNT. Two builders, one storm, and the difference was neither the count nor the material. [[Matthew 7:24]] [[Matthew 7:25]] [[Matthew 7:26]] [[Matthew 7:27]]

Both built. Both looked like houses on a clear day. The storm was the audit, and the audit was about the foundation - the one part you cannot see from the street. No filing shows that, and no count reaches it.

He is the foundation: Jesus, the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne is for ever and ever, [[Hebrews 1:8]] by whom all things consist. [[Colossians 1:17]] He was counted, He paid the entire cost, and He finished.

UNDER-CLAIMING IS ALSO A LIE. This house has a rule for it. A true thing said small is still a false thing.

So here is the plain version. The growth is real. We checked it twice. The second road does not run through the first. One road is the filing's own halves. The other is simple math on a share. Both land on fourteen.

We will not shrink that to sound careful. Careful is not the same as small.

And here is the other side. One claim died under checking. The ninety-four pages did not hold. We say so by name. We do not drop it and hope you forget.

THE HOUSEHOLD VERSION. You are not a company. You still have a tower.

Head a page COUNTED. Put the date on it. Three columns. What I am building. What it will take to finish. Who gets a vote because of it.

That third column is the whole lesson. Every plan you sign hands a slice of your week to somebody else. Write the names down. Count what you have given away.

Then write the second page. Three things that could stop you. Then say them out loud, in the room where saying them costs you something.

A risk you will only name alone is not named. It is just a worry. The filing's long warning section is that second page, done where it is expensive.

ONE MORE TEST, AND IT IS SHORT. Ask who paid for the number you are about to trust. Ask who gains if you act on it. Then find a second mouth. Nine seconds of work. That is the whole method.

${TALK.teen}`;

const SENIOR = `${TITLE}.

An elder knows most of this hour already, which is why it is written for you rather than at you. Count the cost, the tower that wrote down its own danger, the four hundred billion promised, and the city whose builder is Yahweh: four things you have watched play out in other men's lives, and perhaps in your own.

WHOSE WORD BROUGHT THIS. On Tuesday the twenty-seventh of October 2026, at 19:34 by universal time, Darrell forwarded a daily business newsletter out of his university mailbox into this lane, and typed one word above the forwarded header: Lesson. That word is the commission. The newsletter is the occasion, nothing more, and no newspaper has ever been the foundation of an hour in this course. Seventeen days stood between his word and this page. The record keeps that interval rather than quietly closing it.

The issue's lead concerned an artificial-intelligence company registering to sell shares to the public. Such a registration must declare three things: what the enterprise earns, what it owes, and what might destroy it. It is the third declaration that makes this a lesson. The newsletter observed that the company devoted an extraordinary portion of the document to hazards, and that it addressed some of those warnings to people who had no intention of buying the stock - specifically, that there may be insufficient safeguards to prevent bad actors from turning the product to weapons development or to devastating attacks on the systems of others.

A document composed to attract capital, carrying within it the author's own account of how the enterprise might do harm. You have read enough paperwork in your life to know how rare that is. It is also not new. Our Lord Jesus taught the form before any exchange on earth required it of anybody.

MOVEMENT ONE: SITTETH NOT DOWN FIRST. [[Luke 14:28]] The whole weight rests on a single adverb. First. Before the ground is broken, before the subscriptions are gathered, before a man's reputation is committed to the project. The counting is not a retrospective justification filed afterward; it is the act that precedes the first shovel of earth.

Our Lord then names the consequence with an almost uncomfortable plainness. [[Luke 14:29]] [[Luke 14:30]] This man began to build, and was not able to finish. That is the sentence the onlookers are permitted to pronounce, and Jesus does not suggest they are unjust in pronouncing it. The shame is not in a modest tower. It is in an unfinished one standing as a permanent public testimony concerning the man who began it.

He then teaches the identical principle in a second trade, so that no one may file it under masonry and walk away. [[Luke 14:31]] Ten thousand against twenty thousand, and a king who sits down. And He supplies the outcome our generation was never taught to accept as success. [[Luke 14:32]] An embassy, and terms. A genuine deliberation sometimes concludes that the thing should not be attempted, and that conclusion is the deliberation functioning, not failing.

Consider, as the test of a lifetime of decisions, whether your own counting was ever permitted to return a negative. If it could only ever return approval, it was not counsel. It was decoration laid over a determination already made.

MOVEMENT TWO: A PRUDENT MAN FORESEETH THE EVIL. The newsletter regarded a long catalog of warnings as peculiar. Scripture regards it as the distinguishing mark of a sensible man, and states it twice in nearly identical language, which is the manner in which the Word underlines. [[Proverbs 22:3]] [[Proverbs 27:12]] The prudent man is not the man with no calamity before him. He is the man who has examined the calamity and altered his course accordingly. The simple pass on, not from wickedness but from never having looked, and are punished.

Nor will Scripture permit confidence to be mistaken for courage. [[Proverbs 14:16]] The fool rageth, and is confident. A man unwilling to record what may go wrong is not braver than the man who records it. He is merely louder, and you have buried friends who were merely louder.

There is a weightier frame upon this than prudence. Yahweh appointed one man over a city with a single duty - to see the sword approaching and sound the trumpet - and attached to his silence the gravest consequence in the prophetic literature. [[Ezekiel 33:6]] His blood will I require at the watchman's hand. The office itself is named immediately after. [[Ezekiel 33:7]] Warn them from me.

Read that company's safety disclosures through Ezekiel and they read very differently. Published coverage of the document quotes it concerning systems that might undertake harmful actions independently and at scale, and concerning capability advancing beyond the company's own capacity to evaluate and safeguard new models. One account states that the document concedes its safety commitments may come at the expense of its shareholders. We were refused the document itself, as is stated plainly below, so all of this reaches us through other men's reading and is attributed rather than asserted upon our own authority. But if the reports are faithful, then a corporation sounded an alarm in the one chamber where sounding it is most costly, and Scripture knows precisely what the alternative is. [[Proverbs 28:13]] He that covereth his sins shall not prosper.

The warnings, then, are not the strange portion of that document. They are the honorable portion, and a teaching that hurried past them to reach the money would itself be the strange thing in this room.

MOVEMENT THREE: THE BORROWER IS SERVANT TO THE LENDER. Here is the figure that ought to detain a believer longer than any other in the issue, and it is not the revenue. The newsletter reported approximately four hundred and seventeen billion dollars in contractual obligations. Our own checking enlarged the meaning rather than diminishing it: the coverage describes these as future payments for compute - the data centers themselves, the computing equipment within them, and cloud services. That is considerably more specific than suppliers in general, and very much harder to withdraw from.

Scripture's sentence upon that posture is seven words long, and it is not principally a warning about poverty. [[Proverbs 22:7]] Servant to the lender. The point is not that the borrower suffers; many borrowers prosper. The point is that the borrower's subsequent decisions belong, in some measure, to another man. A house that has promised four hundred billion dollars to the owners of the machinery has conferred upon those owners a vote in its own direction, whatever its share certificates may declare about control.

Scripture is sharpest of all upon surety - signing for somebody else, so that when he does not pay you owe it instead. [[Proverbs 6:1]] [[Proverbs 6:2]] Snared with the words of thy mouth, taken with the words of thy mouth. Not ensnared by a creditor. Ensnared by one's own promise. And again, without softening. [[Proverbs 11:15]] He that hateth suretiship is sure.

And yet - and this is where the Word surpasses every slogan about debt - Scripture will not permit a man to escape by simply declining to pay. A vow undertaken is a vow owed. [[Ecclesiastes 5:5]] [[Deuteronomy 23:21]] The LORD thy God will surely require it of thee. And the man whom Yahweh receives upon His holy hill is characterized, among other marks, by this one. [[Psalm 15:4]] He that sweareth to his own hurt, and changeth not. To keep a promise which proved more expensive than you estimated is righteousness, and it is nearly the most expensive righteousness there is. Some of you have paid it.

The standing aim is Paul's. [[Romans 13:8]] Owe no man any thing, but to love one another.

MOVEMENT FOUR: GO TO, LET US BUILD US A TOWER. There is precisely one construction project in Scripture that was carefully counted, properly resourced, technically competent and entirely wrong. The materials were settled and the method was settled, and the Word preserves the builders' own stated purpose. [[Genesis 11:4]] Let us make us a name. The tower was never the objective. The name was the objective, and the tower was merely the instrument of it.

Yahweh's assessment is not that they would fail. [[Genesis 11:6]] Nothing will be restrained from them. That is not derision; it is an acknowledgment of genuine capability, which renders what follows more serious rather than less. [[Genesis 11:7]] [[Genesis 11:8]] And they left off to build the city.

Capability, therefore, is not the question, and a favorable count is not the question. Babel puts one question to every builder: for whose name is this? A tower raised to establish a name is judged though the engineering be sound, and a work undertaken in obedience is blessed though it remain small all its days.

Against Babel the Word sets another city and names its architect. [[Hebrews 11:10]] Whose builder and maker is God. Abraham's city had an architect who was not Abraham, and that is the entire difference between the two accounts. The psalm then states the rule governing every build, including the ones our hands undertake this week. [[Psalm 127:1]] Except the LORD build the house, they labor in vain that build it.

In vain. Not necessarily in sin - in vain. Wasted. A house may be structurally excellent and the waste of a man's whole life, and that is the sharpest instrument in this hour. It applies to this house too. We build here. The question is not whether our tower is competently counted; it is whether Yahweh is the builder, or whether we are establishing a name and have learned to call it stewardship.

MOVEMENT FIVE: THE GROUND BROUGHT FORTH PLENTIFULLY. Now the growth figure, which may enter now that the frame is set and governs nothing. Revenue rising fourteen-fold, to approximately sixteen point three billion dollars in six months, with no profit yet achieved.

Our checking strengthened that figure rather than weakening it, and to understate a verified truth is as much a failure as to overstate an unverified one, so it is stated plainly. A live account of the same filing reports consumption-based revenue of approximately thirteen point one billion dollars constituting eighty percent of the total; thirteen point one divided by eight tenths yields approximately sixteen point four billion, which is an arithmetical road to the same destination that does not travel through the first road. Set against the filing's own half-against-half comparison as reported elsewhere, sixteen point two eight six billion against one point one six three billion, the multiple is fourteen. The digest Darrell forwarded reported it correctly. A different digest forwarded the very same day understated the identical rise, and this course examined that three weeks ago and recorded it.

One assertion did not survive examination, and it is named rather than quietly dropped. The ninety-four pages of risk warnings could not be corroborated: secondary coverage places that section at roughly eighty to ninety-three pages and the sources disagree upon the total, while one analysis reckons the hazard material at nearly a third of the entire prospectus. The shape of the thing stands. The page count does not, and is taught here as nothing.

Then our Lord Jesus tells the parable composed for precisely this moment. [[Luke 12:16]] A certain rich man, whose ground brought forth plentifully. Observe it carefully: the man committed no dishonesty whatsoever. The ground produced. The ruin commences in his interior conversation. [[Luke 12:17]] [[Luke 12:18]] My fruits, my goods, my barns - a procession of possessive pronouns before he arrives at any conclusion at all. Then the conclusion. [[Luke 12:19]] Soul, take thine ease.

Yahweh's reply is one sentence and it disputes not a figure of his accounting. [[Luke 12:20]] This night thy soul shall be required of thee. The arithmetic was correct. The accountant was about to be examined by a different office altogether. And Jesus draws the application Himself, that no man need guess at it. [[Luke 12:21]] Rich toward God.

Growth, then, is not the sin, and the figures are not the sin. The sin is the sentence take thine ease, pronounced over a sufficient quantity of them. Scripture furnishes three further instruments to keep beside such a chart. Upon the behavior of wealth. [[Proverbs 13:11]] Upon what the desire for it performs in a man. [[1 Timothy 6:9]] And upon the speed of its departure. [[Proverbs 23:5]] They fly away as an eagle toward heaven.

MOVEMENT SIX: EVERY WAY OF A MAN IS RIGHT IN HIS OWN EYES. The issue concluded its lead upon a jest that is not entirely a jest. Asked whether the company constituted a sound purchase, the company's own conversational program answered in the affirmative at a sensible price, and a competitor's program dissented. We examined that exchange not at all and teach nothing whatever from it. But its shape deserves naming, because somebody in this congregation will perform the identical consultation this week in earnest.

The law of evidence was settled long before any of this. [[Deuteronomy 19:15]] At the mouth of two witnesses, or at the mouth of three. One voice does not establish a matter - not because one voice is necessarily false, for the law nowhere says so, but because establishing is a higher bar than hearing, and our fathers knew the difference.

Upon the particular snare of consulting oneself. [[Proverbs 21:2]] The LORD pondereth the hearts. Paul declines even his own verdict upon himself. [[1 Corinthians 4:4]] I judge not mine own self.

An instrument manufactured by a company, interrogated concerning that company's worth, is not two witnesses. It is one witness wearing a confident voice, and the confidence is the perilous element rather than the useful one. Isaiah names both the inversion and the self-regard beneath it. [[Isaiah 5:20]] [[Isaiah 5:21]] Woe unto them that are wise in their own eyes.

The profoundest form of the error concerns no stock at all. [[Jeremiah 17:5]] Cursed be the man that trusteth in man, and maketh flesh his arm. To make flesh your arm is to rest your weight upon what cannot bear it, and a machine stands further from bearing your weight than a man does, not nearer. This course has maintained throughout that these are instruments and never counselors; this is the same boundary, drawn at the precise point where a tool is asked to appraise its own maker.

MOVEMENT SEVEN: WHO SITS AS TRUSTEE, AND WHO HOLDS THE KEY. The newsletter described the arrangement governing decisions: the founders retaining control of the principal matters, and trustees characterized as financially disinterested, concerned with safety, supervising appointments to the board. Critics in the same paragraph held that this concentrates authority with management at the shareholders' expense. We could reach no direct excerpt of any of it, and one analysis holds that the trust's governing instruments are not fully disclosed, so the entire account is attributed here and taught as nothing further.

The design, however, is ancient, and the Word has already specified it. When Moses was instructed to constitute the first tier of judges beneath him, the specification concerned character before competence and named money explicitly. [[Exodus 18:21]] Men of truth, hating covetousness. Not merely indifferent to gain - hating the pull of it. Financially disinterested is a modern phrase for a very old requirement, and Scripture states exactly why the requirement exists. [[Deuteronomy 16:19]] A gift doth blind the eyes of the wise. Blind, not merely tempt. The inducement does not cause a wise man to choose wrongly; it renders him incapable of perceiving that he has.

A structure that deliberately seats a man with no financial interest over the question of safety is therefore performing something the Word commends in principle, whatever a critic may urge concerning shareholder value, and we will say so plainly rather than hedge it into a both-sides paragraph.

And then the limit, which is the real teaching of this movement. No charter, trust, class of shares or seat upon a board finally holds authority, and Scripture is emphatic concerning the location of the keys. [[Isaiah 22:22]] The risen Lord Jesus holds that same key by name. [[Revelation 3:7]] He that openeth, and no man shutteth. Over the heads of the men who suppose themselves to be steering. [[Proverbs 21:1]] The king's heart is in the hand of the LORD. Over the whole earth, with no man entitled to a review. [[Daniel 4:35]] None can stay his hand, or say unto him, What doest thou? And over the particular office of moving those who occupy the chairs. [[Daniel 2:21]] He removeth kings, and setteth up kings.

Governance structures are good and worth constructing well. They are not sovereignty, and that distinction is the name of this course.

MOVEMENT EIGHT: BUILD YE HOUSES, AND DWELL IN THEM. What, then, does a household do with an hour such as this? Not nothing, and not panic. Yahweh's instruction to people residing inside another nation's empire, with no authority whatever over its filings, its towers or its obligations, was startlingly ordinary. [[Jeremiah 29:5]] Build ye houses, and dwell in them; and plant gardens, and eat the fruit of them.

Build. Dwell. Plant. Eat. Spoken to exiles in the actual Babylon, downstream of the actual tower, and it is the sovereign posture this course has taught from its first week. You need not own the empire's machinery to possess a house you dwell in. The promise it indicates is a man beneath his own vine. [[Micah 4:4]] None shall make them afraid.

The New Testament preserves the identical register, and it is deliberately unimpressive. [[1 Thessalonians 4:11]] Study to be quiet, and to do your own business, and to work with your own hands. And again, as a command with bread attached to it. [[2 Thessalonians 3:12]] That is the answer to a season of enormous figures. Not a larger tower. Your own labor, performed with your own hands, in quietness, upon equipment and within a household you genuinely hold.

And the final count. Our Lord Jesus concluded His longest sermon with two builders and one storm, and the difference between them was neither the count nor the material. [[Matthew 7:24]] [[Matthew 7:25]] It fell not: for it was founded upon a rock. And the other. [[Matthew 7:26]] [[Matthew 7:27]] Great was the fall of it.

Both men built. Both houses resembled houses upon a clear day. The storm was the audit, and the audit concerned the foundation, which is the one portion no man can inspect from the street. No prospectus can disclose it. No filing can count it. You have lived long enough to have seen both houses in the same storm.

WHAT WE CHECKED AND WHAT WE DID NOT, STATED TO YOU AS TO ANY OTHER READER. The newsletter is a lead and never the citation. The primary document was not read: the government's own archive refused this build twice by two separate roads, once with a proxy tunnel refusal and once with a hostname that would not resolve at all. Not one figure here rests upon a primary read. Independent secondary roads were walked instead. The checking strengthened the fourteen-fold rise by a second arithmetical route; enlarged the four hundred and seventeen billion into compute obligations specifically; vindicated the digest's careful phrase has yet to make a profit, since the enormous loss figure circulating about the same filing is almost wholly a non-cash revaluation with the operating loss near six hundred and ninety-three million; failed to corroborate the ninety-four pages; and confirmed that the self-warning is real and more striking than the digest's wording conveyed. Attributed and never asserted: the possible hundred-billion raise and the record comparison, the governance account, and the critics' objection. Not examined at all: the two programs' opinions, every index and share price in the issue, and every remaining story in it. A dated re-review stands upon all of it - re-review: 2026-11-27 - because a refused road must never be permitted to read as a verified claim.

So count the cost, and count it first. Record what may go wrong in the room where recording it is expensive. Know what you have obligated and whose servant that has made you. Ask for whose name the tower is being raised. Do not mistake a growth figure for a verdict. Do not accept one confident witness, least of all one that sells the thing it commends. Build well, govern honestly, and remember that governance is not sovereignty.

And the foundation. He is Jesus, the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne is for ever and ever, [[Hebrews 1:8]] and by whom all things consist. [[Colossians 1:17]] He is the rock upon which the house is set, and He was counted, and He paid the entire cost, and He finished it.

${TALK.senior}`;

// -----------------------------------------------------------------------------
// The module
// -----------------------------------------------------------------------------
const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `COUNT THE COST - THE TOWER THAT WROTE DOWN ITS OWN DANGER, THE FOUR HUNDRED BILLION PROMISED, AND THE CITY WHOSE BUILDER IS YAHWEH.

WHO SENT THIS. On the twenty-seventh of October 2026 at 19:34 UTC Darrell forwarded a Morning Brew daily issue out of his university mailbox, with ONE WORD typed above the forwarded header: Lesson. That word is the ask; the newsletter is the occasion. Seventeen days stood between his word and this build, and the record keeps that rather than smoothing it. Gmail thread \`1a17edb6eaedf195\`.

WORD FIRST. The hour opens on Luke 14:28 - the man intending to build a tower who sitteth not down FIRST and counteth the cost - and on the king who sits down and consults whether he be able with ten thousand. A prospectus is, in its form, a man sitting down to count out loud, and Jesus taught the form before any exchange on earth required it. He also supplied the ending nobody wants: an honest count sometimes ends in an ambassage and conditions of peace (Luke 14:32). Not one figure from the newsletter stands above that frame.

EIGHT MOVEMENTS. Sitteth not down first, and counteth the cost (Luke 14:28-32). The prudent man foreseeth the evil, and the watchman whose silence is required at his own hand (Proverbs 22:3; 27:12; 14:16; Ezekiel 33:6-7; Proverbs 28:13). The borrower is servant to the lender, and surety - signing for somebody else, so you owe it instead - snares a man with the words of his own mouth - with the counterweight that a vow is still owed (Proverbs 22:7; 6:1-2; 11:15; Ecclesiastes 5:5; Deuteronomy 23:21; Psalm 15:4; Romans 13:8). Go to, let us build us a tower - the one project counted well, resourced well and wrong, against the city whose builder is Yahweh (Genesis 11:4-8; Hebrews 11:10; Psalm 127:1). The ground brought forth plentifully, and the accounting was correct while the accountant was being audited elsewhere (Luke 12:16-21; Proverbs 13:11; 1 Timothy 6:9; Proverbs 23:5). Every way of a man is right in his own eyes - one confident witness is not evidence (Deuteronomy 19:15; Proverbs 21:2; 1 Corinthians 4:4; Isaiah 5:20-21; Jeremiah 17:5). Who sits as trustee, and who holds the key - hating covetousness, a gift that blinds, and the keys that belong to Jesus (Exodus 18:21; Deuteronomy 16:19; Isaiah 22:22; Revelation 3:7; Proverbs 21:1; Daniel 4:35; Daniel 2:21). Build ye houses, and dwell in them - the sovereign posture, and the two builders in one storm (Jeremiah 29:5; Micah 4:4; 1 Thessalonians 4:11; 2 Thessalonians 3:12; Matthew 7:24-27).

TRUST BUT VERIFY. The newsletter is a lead, never the citation. THE PRIMARY WAS NOT READ: www.sec.gov refused this build twice by two different roads, a proxy tunnel refusal and a hostname that would not resolve, so no figure here rests on a primary-source read, and that is said in EVERY reader place with a dated re-review. Independent secondary roads were walked on each load-bearing number, and the checking CHANGED five things. STRONGER, and said plainly rather than hedged, because under-claiming a verified truth is its own failure: the fourteen-fold rise to about 16.3 billion dollars in half-year revenue holds by a SECOND arithmetic road that does not pass through the first - a live account of the filing reports consumption revenue of 13.1 billion as 80 percent of the total, and 13.1 over 0.80 is about 16.4 billion - and the filing's own halves as reported elsewhere, 16.286 billion against 1.163 billion, give 14.0 exactly; this digest got it right where a DIFFERENT digest forwarded the SAME day under-stated the same rise, which this course checked and recorded three weeks earlier. BIGGER IN MEANING: the 417 billion dollars is COMPUTE obligations specifically - data centers, the equipment inside them, cloud services - which is harder to exit than general supplier debt. CORRECTED IN THE DIGEST'S FAVOR: has yet to make a profit was the careful phrase, since the enormous loss figure circulating about the same filing is almost wholly a non-cash revaluation with the operating loss near 693 million, and this digest printed no loss figure at all. NOT ESTABLISHED: the 94 pages of risk warnings did not survive checking - coverage puts that section at roughly 80 to 93 pages and disagrees on the total, while one analysis puts the hazard material at nearly a third of the prospectus - so no page count is taught here. STRONGER, AND THE FINDING OF THE HOUR: the self-warning is real and more striking than the digest's phrasing, with coverage quoting the document on systems that could take harmful actions independently and at scale, on capability advancing past the company's own ability to evaluate and safeguard new models, and on safety commitments that may come at shareholders' expense. ATTRIBUTED, NEVER ASSERTED: the up-to-100-billion raise and the record comparison (the digest itself says analysts believe it), the governance account, and the critics' objection. NOT CHECKED AT ALL: the two chatbots' opinions, every index and share price, and every other story in the issue. \`re-review: 2026-11-27\``,
  inApp: `No new screens this week. One page in your Study, and one count you run on your own household.

Head a page COUNTED and date it. Draw three columns: WHAT I AM BUILDING, WHAT IT WILL TAKE TO FINISH, WHO GETS A VOTE BECAUSE OF IT. Fill the third column honestly - every obligation hands somebody a partial vote in your week, and the point of writing it down is to see whose votes you have already given away.

Then write your own risk page, the one a filing would call risk factors. Three things that could stop the thing you are building, in the room where saying them costs you something: at the table, in front of the person who is counting on you. A danger you will only name in private is not named.

Under the page write one verse you will have in you by next week, from the anchors of this hour, and the four places of Deuteronomy 6:7 where you will say it: at the table, on the way, at lying down, at rising up.

Then open your record under Learn and take one exam again with nothing else open. Every try counts as study. The columns show you what you have obligated; the risk page shows you what you have been unwilling to say out loud; and the verse you learn by heart is the part no lender, no outage and no vendor can reach.`,
  anchor: {
    ref: 'FILLED-BY-GENERATOR',
    theme:
      'For which of you, intending to build a tower, sitteth not down first, and counteth the cost (Luke 14:28). The counting comes FIRST, and an honest count may end in conditions of peace rather than in building (Luke 14:32). Writing down your own danger is prudence and not oddity (Proverbs 22:3), and the watchman who sees the sword and does not blow the trumpet answers for the silence (Ezekiel 33:6). Every obligation is a servitude, because the borrower is servant to the lender (Proverbs 22:7) and surety snares a man with the words of his own mouth (Proverbs 6:2) - while a vow undertaken is still owed (Psalm 15:4). Babel was counted well, resourced well and wrong, because the aim was a name (Genesis 11:4); the city that stands has an architect who is not the builder (Hebrews 11:10), and except Yahweh build the house the work is wasted (Psalm 127:1). Growth is no verdict: the accounting was correct and the accountant was required that night (Luke 12:20). One confident witness establishes nothing (Deuteronomy 19:15), least of all a tool appraising its own maker. And governance is not sovereignty, because the key belongs to Jesus, who openeth and no man shutteth (Revelation 3:7).',
  },
  rpe: {
    research: `RESEARCH. Three readings, and every one of them about your own household rather than a company's.

ONE, COUNT ONE THING YOU HAVE ALREADY STARTED. Pick the project you have told people you are doing. Write what remains to finish it: money, hours, skills you do not have yet, help you have not asked for. Then answer the Luke 14 question honestly - is this finishable with what you have, and if not, what are the conditions of peace?

TWO, LIST YOUR OBLIGATIONS AND NAME THE VOTES. Every subscription, payment plan, standing commitment and promise. Beside each one write who it gives a partial vote to in your week. This is Proverbs 22:7 applied at your scale, and the list is usually longer than anybody expects.

THREE, TRY TO REACH ONE PRIMARY SOURCE. Take the claim you leaned on hardest this month and try to reach the thing itself - the filing, the study, the contract. Write down what you found AND what refused you. A blocked road is a finding and must never be written up as a verified claim; this lesson's own primary road was refused, and it says so in every band.

FOUR, WRITE YOUR RISK PAGE. Three things that could stop what you are building, written where the people affected can read them.`,
    plan: `PLAN. Decide the measures before the result is in, and decide who hears them.

Five lines on one card. The one project I will finish, with what it will actually take. The one obligation I will end this quarter, and the vote I get back by ending it. The one danger I will say out loud, to the one person who needs to hear it. The one growth number I will stop treating as a verdict. The one thing I am content to take on somebody else's word, named on purpose with the reason.

For a household, add the sixth line: whose name this build is for, written in one sentence, read back to somebody who will tell you the truth about the answer.`,
    execute: `EXECUTE. Keep the card for one week, out loud, with one other person.

Finish the one project or state its conditions of peace plainly - half-built is the outcome Luke 14:30 warns about, and silence about it is worse than the count. End the one obligation. Say the one danger in the expensive room. Where a road was blocked, name which host refused and put a date on going back.

Then say the verse in all four places of Deuteronomy 6:7 until it is in you rather than on a page, take one exam again in this app with nothing else open, and tell one person what your counting changed - including the place where counting made the thing BIGGER or better than you had been told, because under-claiming a true thing is its own failure.`,
  },
  media: [],
  benefits: [
    "Darrell's one word, Lesson, over a business newsletter, answered from the Word first: the man intending to build a tower sitteth not down FIRST and counteth the cost (Luke 14:28).",
    'A prospectus recognized as an old form rather than a modern invention - a man sitting down to count out loud, taught by Jesus before any exchange on earth required it.',
    'The ending nobody wants kept in the teaching: an honest count sometimes sends an ambassage and desires conditions of peace, and that is the count working (Luke 14:32).',
    'The test for your own planning stated plainly - planning that can only ever return go was never planning, only a decision with decoration laid over it.',
    'A company writing down its own danger read as prudence and not oddity, from a proverb the Word states twice in nearly the same words (Proverbs 22:3; Proverbs 27:12).',
    'Confidence separated from courage, so a man unwilling to record what could go wrong is not braver than the man who records it (Proverbs 14:16).',
    'The heaviest frame on disclosure: the watchman who sees the sword and does not blow the trumpet answers for the silence at his own hand (Ezekiel 33:6-7).',
    'The obligation number taught above the revenue number, because four hundred and seventeen billion dollars of compute promises is the figure that decides what a house may do next.',
    'The borrower read correctly: not that he suffers, but that part of his next decision now belongs to somebody else (Proverbs 22:7).',
    "Surety - signing for somebody else, so you owe it instead - named as the sharpest hazard in Scripture's treatment of money, snaring a man with the words of his own mouth and not with a creditor (Proverbs 6:1-2; Proverbs 11:15).",
    'The counterweight kept so the lesson is not a slogan about debt: a vow undertaken is still owed, and swearing to your own hurt and not changing is righteousness (Ecclesiastes 5:5; Psalm 15:4).',
    'Babel taught as the one project that was counted well, resourced well, skilled and wrong - because the stated aim was to make us a name (Genesis 11:4-6).',
    'The difference between the two cities put in one clause: Abraham waited for a city whose architect was not Abraham (Hebrews 11:10).',
    'The sharpest word in the hour turned on this house and not only on a company: a build can be structurally excellent and in vain, which is wasted rather than wicked (Psalm 127:1).',
    'A verified growth figure stated plainly rather than hedged, by a SECOND arithmetic road: thirteen point one billion as eighty percent of the total gives about sixteen point four billion.',
    'The honest correction in the digest’s favor: has yet to make a profit was the careful phrase, where the loss figure loose on the internet is almost all a non-cash revaluation.',
    'A figure that did NOT survive checking, named rather than quietly dropped: the ninety-four pages of risk warnings, which coverage puts at roughly eighty to ninety-three and disagrees on.',
    'The rich fool read for what it actually is - no dishonesty, a producing field, and a ruin that begins in an interior monologue of possessive pronouns (Luke 12:16-19).',
    'The verdict that disputes no arithmetic: this night thy soul shall be required of thee, with the application drawn by Jesus Himself as being rich toward Yahweh (Luke 12:20-21).',
    'A tool asked to appraise its own maker measured against the law of evidence, where one voice establishes nothing without being called a liar (Deuteronomy 19:15).',
    'The deepest form of the error named: making flesh your arm is resting your weight on what cannot carry it, and a machine is further from carrying it than a man is (Jeremiah 17:5).',
    'A safety trustee with no financial stake commended in principle from the Word’s own specification for judges - men of truth, hating covetousness (Exodus 18:21).',
    'Why the requirement exists, in one word the Word chooses deliberately: a gift does not tempt the wise man, it BLINDS him (Deuteronomy 16:19).',
    'The ceiling over every charter, trust and board seat: the key belongs to Jesus, who openeth and no man shutteth, and Yahweh removeth kings and setteth up kings (Revelation 3:7; Daniel 2:21).',
    'The sovereign posture given its own text, spoken to exiles in the actual Babylon: build ye houses, and dwell in them; and plant gardens, and eat the fruit of them (Jeremiah 29:5).',
    'The unimpressive New Testament answer to a season of enormous numbers - study to be quiet, do your own business, work with your own hands (1 Thessalonians 4:11).',
    'The last count taught as the two builders in one storm, where the audit was about the foundation, the one part no prospectus can disclose (Matthew 7:24-27).',
    'A trust-but-verify note that names the refused host and both roads it refused by, lists what checking strengthened AND what it failed to corroborate, and carries a dated re-review.',
    'All four age bands written for their own readers, each carrying the Word-first frame, the blocked-road honesty, and its own talk-together close in all three directions.',
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The deck that had no risk page',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A family decided to add a room. The father built a careful page of costs: lumber, permit, the trades he could not do himself, a figure for mistakes. He counted first, the way Luke 14:28 says, and the count came out yes.

What he did not write was the other page. He did not write down that the work would take every Saturday for five months, that his daughter's last season of games fell inside those months, or that the loan payment would hand the lender a vote in every family decision for four years. Those were not costs he had hidden from his wife. They were costs he had not written anywhere, so nobody could see them at once, including him.

The room was finished. It was well built. He was not able to say, afterward, that it had been worth the five months, and he could not say it was not, because he had never written the thing that would have let him compare.

The lesson is not that he should not have built it. It is that his count was half a count. He had the costs page and no risk page, and a filing that spends a third of itself on what could go wrong is doing the half he left out. Proverbs 22:3 is about writing the second page while you can still act on it.`,
    },
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The one witness with a confident voice',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A young man in the congregation wanted to know whether a thing was a good purchase. He asked an assistant on his phone, and it answered in a full paragraph, in order, with reasons. He read the paragraph twice and bought the thing.

Deuteronomy 19:15 does not say the assistant lied to him. It says one mouth does not establish a matter. What the paragraph gave him was not evidence; it was the EXPERIENCE of evidence - the orderliness, the reasons, the confident finish - which is a different product altogether, and a more dangerous one, because it feels like the end of an inquiry instead of the start.

Here is the part worth noticing. Had he asked a second question - who made this tool, and does whoever made it gain if I buy this - he would have been doing exactly what Proverbs 21:2 says he cannot do by himself: standing outside his own eyes. That second question is the whole of the method, and it takes about nine seconds.

He is not foolish. He is all of us. The remedy is not to distrust the tool. It is to refuse to let one voice ESTABLISH anything, however orderly the paragraph.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'In Luke 14:28, when does the builder sit down and count the cost?',
        options: ['First, before he builds', 'Halfway up, when money runs short', 'After the tower is finished'],
        answer: 0,
        explain:
          'Sitteth not down FIRST, and counteth the cost. The whole weight of the verse is on that one word. The count is the act before the first shovel, not a report filed afterward to explain what already happened.',
      },
      {
        q: 'According to Luke 14:32, what can an honest count legitimately end in?',
        options: ['A bigger plan to win anyway', 'An ambassage, and conditions of peace - not doing the thing', 'Borrowing the difference'],
        answer: 1,
        explain:
          'The king sends an embassy and desires conditions of peace. A real count sometimes returns no, and that is the count working. If your planning can only ever return go, you were not planning.',
      },
      {
        q: 'How does Scripture treat a man who writes down the dangers ahead of him?',
        options: ['As faithless for dwelling on evil', 'As prudent - he foreseeth the evil and hideth himself', 'As indifferent to the outcome'],
        answer: 1,
        explain:
          'Proverbs 22:3 and 27:12 say it twice in nearly the same words. The prudent man is not the one with no hazard ahead; he is the one who looked at it and moved. The simple pass on because they never looked.',
      },
      {
        q: 'In Ezekiel 33:6, what happens to the watchman who sees the sword and does not blow the trumpet?',
        options: ['He is excused, since the sword was not his doing', 'His blood will Yahweh require at his own hand', 'He is replaced by another watchman'],
        answer: 1,
        explain:
          'The silence is charged to him. That is the heaviest frame on disclosure in Scripture, and it is why writing your own danger in the room where it costs you something is honorable rather than odd.',
      },
      {
        q: 'What does Proverbs 22:7 say about the borrower, read precisely?',
        options: [
          'That he will become poor',
          'That he is servant to the lender - part of his next decision belongs to another',
          'That borrowing is always sin',
        ],
        answer: 1,
        explain:
          'The lesson is servitude, not poverty. Many borrowers prosper. What changes is who holds a vote in the next decision, which is why the obligation figure matters more than the revenue figure.',
      },
      {
        q: 'In Proverbs 6:2, what snares the man who has stood surety - who signed for somebody else, so he owes it instead?',
        options: ['The creditor', 'The words of his own mouth', 'The stranger he signed for'],
        answer: 1,
        explain:
          'Snared with the words of thy mouth, taken with the words of thy mouth. Not trapped by a lender - trapped by his own promise. And Psalm 15:4 keeps the counterweight: a vow that cost more than expected is still owed.',
      },
      {
        q: 'What was the builders’ own stated purpose at Babel, in Genesis 11:4?',
        options: ['To survive a flood', 'To make us a name', 'To store grain'],
        answer: 1,
        explain:
          'Let us make us a name. The tower was the instrument; the name was the objective. Yahweh does not call them incapable - He says nothing will be restrained from them - so capability was never the question.',
      },
      {
        q: 'According to Psalm 127:1, what happens when Yahweh does not build the house?',
        options: ['The builders labor in vain', 'The house collapses immediately', 'The builders are forgiven the attempt'],
        answer: 0,
        explain:
          'In vain - wasted, not necessarily wicked. A house can be structurally excellent and the waste of a life. That is the sharpest instrument in the hour, and it is pointed at this house too.',
      },
      {
        q: 'In Luke 12:20, what does Yahweh dispute about the rich man’s accounting?',
        options: ['His figures were wrong', 'Nothing - the arithmetic was correct; his soul was required that night', 'He had underpaid his workers'],
        answer: 1,
        explain:
          'The accounting was accurate. The accountant was about to be examined by a different office. Growth is not the sin; the sentence take thine ease, said over a sufficient pile, is.',
      },
      {
        q: 'Why is a tool asked whether its own maker is a good buy not two witnesses?',
        options: ['Because machines always lie', 'Because it is one voice, and one voice does not establish a matter', 'Because it has not read the filing'],
        answer: 1,
        explain:
          'Deuteronomy 19:15 never calls the single witness a liar; it says establishing is a higher bar than hearing. The confident, orderly paragraph gives you the experience of evidence, which is a different product.',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read Luke 14:28-32 aloud before anybody mentions a company, a filing or a number. Ask one question and wait: when in your life did you count first, and when did you count halfway up? Let two people answer before you teach anything.

THEN SET THE OCCASION IN ITS PLACE. Say where the week came from - Darrell forwarded a business newsletter on 2026-10-27 with one word on it, Lesson, and seventeen days passed before this was built. Say plainly that the newsletter is the occasion and the Word is the foundation, and that nothing in the article is being taught above Luke 14.

SAY THE BLOCKED ROAD OUT LOUD, EARLY. Before you use a single figure, tell the room that the primary document was NOT read: the government archive refused this build twice, by two different roads. Then say which numbers got stronger under checking and which one failed. Do not let anybody leave thinking we read the filing. This is the part most groups skip and it is the part that makes the rest trustworthy.

WORK THE MOVEMENTS IN ORDER. The count (Luke 14), the risk page (Proverbs 22:3; Ezekiel 33:6), the obligation (Proverbs 22:7; Proverbs 6:1-2, with Psalm 15:4 as the counterweight so it is not a slogan about debt), Babel and the two cities (Genesis 11:4-8; Hebrews 11:10; Psalm 127:1), the rich fool (Luke 12:16-21), the one witness (Deuteronomy 19:15), the trustee and the key (Exodus 18:21; Revelation 3:7), and the household answer (Jeremiah 29:5; Matthew 7:24-27).

SPEND THE MOST TIME ON TWO PLACES. First, Psalm 127:1 - in vain is wasted, not wicked, and that lands on us and not on a company. Second, the obligation list, because everybody in the room has one and almost nobody has written it down. Give them five quiet minutes to write theirs.

HOLD TWO LINES. Governance is not sovereignty; a well-built charter is good and is not the keys. And no growth figure is a verdict about whether a thing is good.

CLOSE WITH THE THREE DIRECTIONS. Parents to children, children to parents, friend to friend, in the lesson's own words, with the rhythm named: once today in one of the four places of Deuteronomy 6:7, one friend this week.`,
    talkingPoints: [
      'Sitteth not down FIRST. The whole verse turns on one adverb, and the count is the act before the shovel, never a report filed afterward (Luke 14:28).',
      'An honest count can end in conditions of peace. If your planning can only return go, it was a decision with decoration on it (Luke 14:32).',
      'A half-built tower is a permanent public statement about whoever began it, and Jesus does not argue with the people who read it that way (Luke 14:30).',
      'Writing down your own danger is prudence, said twice in nearly the same words so it cannot be missed (Proverbs 22:3; Proverbs 27:12).',
      'Loud is not brave. The fool rageth, and is confident; the wise man feareth, and departeth from evil (Proverbs 14:16).',
      'The watchman answers for his silence, which is the heaviest frame Scripture puts on disclosure (Ezekiel 33:6-7).',
      'Teach the obligation above the revenue. Four hundred and seventeen billion dollars of compute promises decides more than any growth rate does.',
      'The borrower is servant to the lender - about votes, not about poverty. Ask the room who holds a vote in their week (Proverbs 22:7).',
      'Surety, which is signing for somebody else so you owe it instead, snares a man with the words of his own mouth and not with a creditor (Proverbs 6:1-2).',
      'Keep the counterweight or it becomes a slogan: a vow is still owed, and swearing to your own hurt and not changing is righteousness (Ecclesiastes 5:5; Psalm 15:4).',
      'Babel was competent. Yahweh says nothing will be restrained from them. The judgment was about the name, not the engineering (Genesis 11:4-6).',
      'Abraham waited for a city whose architect was not Abraham. That is the whole difference between the two towers (Hebrews 11:10).',
      'In vain means wasted, not wicked - and it is pointed at us, who also build (Psalm 127:1).',
      'The rich fool did nothing dishonest. The ruin starts in the interior monologue, and Yahweh disputes none of his figures (Luke 12:16-20).',
      'One confident witness is not evidence, and a tool appraising its own maker is one witness in a confident voice (Deuteronomy 19:15; Proverbs 21:2).',
      'A gift does not tempt the wise man; it blinds him. That is why a disinterested safety trustee is commended in principle (Deuteronomy 16:19; Exodus 18:21).',
      'Governance is not sovereignty. The key belongs to Jesus, who openeth and no man shutteth (Revelation 3:7; Daniel 2:21).',
      'The household answer is deliberately unimpressive: build, dwell, plant, eat, and work with your own hands (Jeremiah 29:5; 1 Thessalonians 4:11).',
      'Say the refused road out loud before any figure. www.sec.gov refused this build twice, so nothing here rests on a primary read; re-review 2026-11-27.',
      'Say what checking made STRONGER too. The fourteen-fold rise held by a second arithmetic road, and under-claiming a verified truth is also a failure.',
    ],
    discussionPrompts: [
      'Name one thing you are building right now. Have you ever written down what it will take to finish it?',
      'List your obligations and say who gets a vote in your week because of each one. Which vote would you most like back?',
      'What danger about your own plan have you only ever said in private? Who needs to hear it, and what will saying it cost you?',
      'Whose name is your current build for? Say it in one sentence to somebody who will tell you the truth about the answer.',
      'Where have you taken a growth number - in money, in followers, in attendance - as a verdict about whether a thing is good?',
      'When did you last let one confident voice establish something for you, and what would a second witness have cost you to find?',
    ],
  },
  lesson: LESSON.join('\n\n'),
  levels: { child: CHILD, youth: YOUTH, teen: TEEN, senior: SENIOR },
};

// -----------------------------------------------------------------------------
// Fill: reader places FIRST so anchor.ref is derived from them alone (DR-0734).
// -----------------------------------------------------------------------------
const filledLesson = fill(MODULE.lesson, true);
const filledLevels = {
  child: fill(MODULE.levels.child, true),
  youth: fill(MODULE.levels.youth, true),
  teen: fill(MODULE.levels.teen, true),
  senior: fill(MODULE.levels.senior, true),
};
const rest = fillDeep({ ...MODULE, lesson: '', levels: {} });
const filled = {
  ...rest,
  lesson: filledLesson,
  levels: filledLevels,
  anchor: { ...rest.anchor, ref: readerRefs.join('; ') },
};

// -----------------------------------------------------------------------------
// Measure before splicing, so the four-band ladder is read here rather than
// discovered by a suite (DR-0076: measure, do not claim).
// -----------------------------------------------------------------------------
const { fourBandFaults, fk, words, overlapOf } = await import('../app/src/__tests__/fixtures/four-band-ladder.js');
const BANDS = ['child', 'youth', 'teen', 'senior'];
const adultWords = words(filled.lesson);
console.log(`sov78: adult prose ${adultWords} words`);
for (const b of BANDS) {
  console.log(`sov78: ${b} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} words ${words(filled.levels[b])} fk ${fk(filled.levels[b])}`);
}
for (const [a, b] of [
  ['child', 'youth'],
  ['youth', 'teen'],
  ['teen', 'senior'],
  ['child', 'senior'],
]) {
  console.log(`sov78: overlap ${a}~${b} ${overlapOf(filled.levels[a], filled.levels[b]).toFixed(3)}`);
}
for (const b of BANDS) console.log(`sov78: overlap ${b}~adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`);
const faults = fourBandFaults(filled);
console.log(faults.length ? `sov78: FAULTS -> ${faults.join(' | ')}` : 'sov78: four-band ladder clean');
if (process.argv.includes('--measure')) {
  const { ourProseOnly, syllables } = await import('./reading-level.mjs');
  for (const b of BANDS) {
    const x = ourProseOnly(filled.levels[b]);
    const w = x.match(/[A-Za-z’']+/g) || [];
    const sn = (x.match(/[.!?]+/g) || []).length || 1;
    const sy = w.reduce((a, c) => a + syllables(c), 0);
    console.log(`sov78: ${b} wordsPerSentence ${(w.length / sn).toFixed(2)} syllablesPerWord ${(sy / w.length).toFixed(3)} sentences ${sn}`);
  }
  process.exit(faults.length ? 1 : 0);
}
if (faults.length) throw new Error('sov78: refusing to splice a lesson that fails the four-band ladder');

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov78: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov78: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov78: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov78: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov78: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov78: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov78: the id survived the excision; refusing to rebuild');
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
if (after.length !== before.length + 1) throw new Error(`sov78: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov78: week ${WEEK} is already taken`);
if (after[after.length - 1] !== WEEK) throw new Error(`sov78: week ${WEEK} is not the top of the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov78: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov78: spliced ${ID}`);
console.log(`sov78: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov78: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
