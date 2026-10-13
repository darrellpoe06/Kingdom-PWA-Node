// =============================================================================
// yahweh-by-century — "The Firsts": what Yahweh did that had never been done
// before, century by century — and the same centuries read WITHOUT Him
// =============================================================================
// Darrell, 2026-09-05, across four messages:
//   "Research what Yahweh has done in each century that was new to that century
//    and how each or all of the things inside that century is was and continues
//    to be or ended in a certain century all Word based and historical accuracy"
//   "why it was needed and how it was is and will be used"
//   "if it wasn't in this century then etc... so like a puzzle look at historical
//    events without Yahweh's perspectives and with"
//   "provisions and without etc..."
//   "promises that were fulfilled etc.."
//
// WHAT THIS IS. Not another era timeline — biblical-timeline.js already carries
// the relationship arc, and scripture-chronology.js already carries the Word's
// own numbers. This module answers a different question: at each point on the
// line, WHAT HAD NEVER EXISTED BEFORE? A first is not a repetition. The bow had
// never been a sign; a nation had never been redeemed by blood; no man had ever
// been raised never to die again; the Spirit had never indwelt all flesh. Each
// entry therefore carries eight things, in Darrell's own order:
//
//   firsts            — what was NEW, that had not existed before that point
//   whyNeeded         — the CONDITION that required it (see NEEDED_MEANS below)
//   usedThen/Now/Will — how it was used, is used, and will be used
//   ended             — what closed there and did not resume
//   provision/without — what He provided, and what the record says fails without it
//   withoutHim/withHim— the SAME events read two ways (the puzzle)
//   promises          — promises made here, and the century that kept them
//   anchors/history   — KJV refs (verbatim from the corpus) + documented history
//
// THE PUZZLE (Darrell's frame). Every century is read TWICE. `withoutHim` states
// the ordinary historical account as historians actually state it — fairly, with
// no strawman, because a strawman would be a lie and DR-0076 forbids it.
// `withHim` states the Word's account of the same events. `piece` names the one
// datum that the first account has to set aside and the second account explains.
// This is COHERENCE, not a proof: the pieces make one picture when His
// perspective is in the box. We claim exactly that and not one inch more.
//
// THREE DATING TIERS, NEVER BLURRED (DR-0076 / DR-0100, and binding continuity
// with scripture-chronology.js's rule 2: NO ABSOLUTE BC DATES for the early
// record). "Century by century" is answerable honestly only in tiers:
//   word-clock   — Scripture gives sequence and internal years, and assigns NO
//                  BC century. We give the order and refuse to paint a date.
//   synchronized — from the divided monarchy on, external records (Assyrian
//                  eponym lists, the Babylonian Chronicle, the Ptolemaic canon)
//                  genuinely fix BC centuries within a year or two.
//   documented   — AD centuries, dated by ordinary historical record.
// A reader can therefore see WHERE the calendar starts being able to speak, which
// is itself part of the teaching.
//
// THE CANON FENCE. After the apostles the entries change KIND, and the module
// says so out loud (see CANON_FENCE). Nothing after the first century is offered
// as new revelation. What is offered is documented history — preservation,
// translation, spread — read under the promises already given. Confusing
// providence with revelation is exactly the drift this fence exists to stop.
//
// VERIFICATION (DR-0076). This catalog names REFERENCES only. Every verse text
// comes from app/public/bible/kjv via scripts/fetch-century-verses.mjs into
// yahweh-by-century-verses.json — no verse is ever produced from model memory.
// yahweh-by-century.test.js re-derives every quotation from the corpus, proves
// every promise's fulfilment ref resolves, and fails the build if a `word-clock`
// entry ever acquires a BC date.
// =============================================================================
import VERSES from './yahweh-by-century-verses.json';

/** Verbatim KJV text for a reference named in this catalog. Honest-empty. */
export function verseText(ref) {
  return VERSES[ref] || '';
}

// ---------------------------------------------------------------------------
// The fences, stated before the first entry.
// ---------------------------------------------------------------------------

/** "Why it was needed" never means Yahweh lacked something. Acts 17:25. */
export const NEEDED_MEANS = Object.freeze({
  rule: 'Throughout this module "why it was needed" names the CONDITION ON THE GROUND that a thing answered — never a need in Yahweh. He is not served as though He needed anything.',
  anchors: ['Acts 17:24', 'Acts 17:25', 'Psalm 50:12', 'Job 41:11'],
});

/** Revelation closed with the apostles; what follows is providence. */
export const CANON_FENCE = Object.freeze({
  rule: 'The FIRSTS of revelation end in the first century. "the faith which was once delivered unto the saints" is delivered, not still arriving. Everything catalogued after AD 100 in this module is DOCUMENTED HISTORY read under promises already given — preservation, translation, spread — and is never presented as a new word from Yahweh.',
  whatContinues: 'His speaking through the Son (Hebrews 1:1-2), the Word standing (Isaiah 40:8; Matthew 24:35), the building of the Church (Matthew 16:18), and the gospel going to every nation (Matthew 24:14) — all promised in the first century and running still.',
  anchors: ['Jude 1:3', 'Hebrews 1:1', 'Hebrews 1:2', 'Revelation 22:18', 'Galatians 1:8', 'Isaiah 40:8', 'Matthew 24:35'],
});

/** How each of the three dating tiers is established, and where it stops. */
export const DATING_TIERS = Object.freeze({
  'word-clock': {
    label: 'The Word’s own clock — sequence, not BC dates',
    basis: 'Scripture states begetting ages, lifespans and sojournings, so the ORDER and the intervals are given. It assigns creation, the flood and Abraham no BC century. Every familiar "2000 BC"-style figure for this stretch is a reconstruction that ties the internal chronology to external king-lists — useful, but not revelation.',
    stops: 'This module therefore prints no BC century for any entry in this tier, and the test fails the build if one appears.',
  },
  synchronized: {
    label: 'Synchronized centuries — BC, fixed by external record',
    basis: 'From the divided monarchy forward, Israel and Judah appear by name in dated foreign records: Ahab at Qarqar in the Kurkh Monolith (853 BC), Jehu on Shalmaneser III’s Black Obelisk (841 BC), the fall of Samaria in Sargon II’s annals (722 BC), Hezekiah in Sennacherib’s prism (701 BC), and the fall of Jerusalem and the fall of Babylon in the Babylonian Chronicle series (587/586 BC; 539 BC).',
    stops: 'Regnal totals in Kings and Chronicles include co-regencies the text does not resolve, so single years can move by a year or two. Centuries are secure; exact years sometimes are not, and the entries say which is which.',
  },
  documented: {
    label: 'Documented centuries — AD, ordinary historical record',
    basis: 'Manuscripts, imperial edicts, council acts, printers’ colophons, translators’ prefaces, society minutes, and modern statistics. These are checkable by anyone.',
    stops: 'Documented history establishes WHAT HAPPENED. It never by itself establishes WHY. The `withHim` reading is the Word’s account of the same facts, offered as such.',
  },
});

// ---------------------------------------------------------------------------
// THE BACKWARD CENTURY GRID (Darrell, 2026-09-05: "we can deduce that the 100
// years are backwards compatible for reference").
//
// He is right, and this is how it stays honest. A century is a measuring stick,
// not a revelation. Scripture states INTERVALS ("the four hundred and eightieth
// year after the children of Israel were come out of the land of Egypt"); the
// synchronized record fixes ANCHOR YEARS. Lay the stated interval against a
// fixed anchor and you get a century POSITION — deduced, reversible, and
// checkable by anyone who redoes the subtraction. That is a reference frame.
//
// What it is NOT: a claim that the Word dated the event. The distinction the
// whole module rests on is `stated` vs `computed` (scripture-chronology.js rule
// 1). The interval is stated. The century is computed. Say both, always.
// ---------------------------------------------------------------------------
export const CENTURY_GRID = Object.freeze({
  method: 'Take a year fixed by external record, subtract the interval Scripture states, and report the result as a COMPUTED century position. The subtraction is reversible: anyone can run it forward from the anchor and land back on the anchor.',
  labelRule: 'A computed century is written "≈" and tagged computed. A stated interval is quoted with its verse. The two are never merged into one confident-sounding number.',
  anchors: [
    { year: '539 BC', event: 'Cyrus takes Babylon', fixedBy: 'The Nabonidus Chronicle, and the Cyrus Cylinder’s own account of the capture and of his policy of returning deported peoples to their sanctuaries.' },
    { year: '587/586 BC', event: 'Jerusalem burned, the temple destroyed', fixedBy: 'The Babylonian Chronicle series with 2 Kings 25:8’s regnal dating ("the nineteenth year of king Nebuchadnezzar").' },
    { year: '722 BC', event: 'Samaria falls', fixedBy: 'The annals of Sargon II, against 2 Kings 17:6.' },
    { year: '853 BC / 841 BC', event: 'Ahab at Qarqar; Jehu’s tribute', fixedBy: 'Shalmaneser III’s Kurkh Monolith and Black Obelisk — the two hard pins that anchor the whole divided-monarchy count.' },
  ],
  worked: [
    {
      interval: 'The temple begun in the 480th year after the exodus, in Solomon’s fourth year',
      stated: '1 Kings 6:1',
      computed: 'Counting the regnal totals of Kings back from the 853/841 pins puts Solomon’s fourth year at ≈967/966 BC, which places the exodus ≈1446 BC — the 15th century BC as a reference position.',
      fork: 'A second reading dates the exodus to the 13th century BC (≈1270-1250), reading the 480 as a schematic twelve generations and pointing to the Rameses-era building names of Exodus 1:11. Both readings are held here; the module does not pick one, because the text does not.',
    },
    {
      interval: 'The sojourning — 430 years',
      stated: 'Exodus 12:40',
      computed: 'Measured back from the exodus, Jacob’s entry into Egypt sits ≈430 years earlier; measured as Paul measures it — promise to law, Galatians 3:17 — the same 430 reaches back past Egypt to Abraham’s call, putting the patriarchs in the range of the 21st-19th centuries BC as a reference position.',
      fork: 'These are the two clocks scripture-chronology.js already names (the 400 of Genesis 15:13 and the 430 of Exodus 12:40 measure different things). Which span the 430 covers — Egypt only, or Canaan and Egypt together — changes the patriarchal position by roughly two centuries. Named, not resolved.',
    },
    {
      interval: 'Seventy years of captivity',
      stated: 'Jeremiah 25:11',
      computed: 'From the first deportation (605 BC) to the return under the decree of Cyrus (538 BC) is 67 years; from the temple’s destruction (586 BC) to its completion (516 BC) is 70. Both windows are commonly cited; the second lands exactly.',
      fork: 'None that changes the century. The seventy is a stated figure and both measurements fall inside the 6th century BC.',
    },
  ],
  honestLimit: 'The grid runs backward only as far as an interval is stated. Before Abraham the Word gives generations and lifespans but no anchor to hang them on, and the Genesis 11:26 fork moves Abram himself by sixty years. So the grid stops, and the earliest entries in this module carry order without a century — which is what the Word itself does.',
});

// ---------------------------------------------------------------------------
// THE DEDUCTION DOCTRINE (Darrell, 2026-09-05: "We acknowledge that the lack of
// knowledge is real... however we can deduct and use that type of knowledge to
// get closer to the biblical scriptures perspectives").
//
// Both halves are binding, and dropping either one is a failure of truth.
//
//   The gap is REAL. Scripture does not date creation, the flood or Abraham.
//   Saying otherwise would be over-claiming, which is what DR-0076 forbids.
//
//   Deduction is LEGITIMATE, and refusing it is the opposite failure. Standing
//   mute in front of a stated interval and a fixed anchor because the answer is
//   not handed to us verbatim is under-claiming — the DR-0100 error, dressed up
//   as caution. Scripture itself reasons this way: Daniel worked out the seventy
//   years BY READING (Daniel 9:2) and acted on the arithmetic.
//
// So the instrument is: show the work, label the result computed, name the fork
// where one exists, and SPEAK. A labelled deduction gets the reader closer to
// the Word’s own perspective than a shrug ever does.
// ---------------------------------------------------------------------------
export const DEDUCTION_DOCTRINE = Object.freeze({
  gapIsReal: 'Where the Word gives no date, this module gives no date. The earliest entries carry order and interval, and print no BC century.',
  deductionIsValid: 'Where the Word states an interval and history fixes an anchor, subtraction is a legitimate instrument and is used — openly, reversibly, and marked computed.',
  precedent: 'Daniel 9:2 — he "understood by books the number of the years" and prayed on the strength of the count. Deduction from the text, acted on.',
  refusalIsAlsoError: 'Declining to reason from what is written, in the name of caution, is not humility. It withholds from the reader something the text actually supports (DR-0100).',
  anchors: ['Daniel 9:2', 'Daniel 9:3', 'Acts 17:11', 'Proverbs 25:2', '2 Timothy 2:15'],
});


// ---------------------------------------------------------------------------
// THE THREADS — four teachings Darrell spoke into this lesson on 2026-09-05,
// captured as build input (CLAUDE.md, "Spoken Teachings Are Build Input").
// They are not decoration on the century list. They are what the century list
// is ABOUT, and every entry above should be read under them.
// ---------------------------------------------------------------------------
export const THREADS = Object.freeze([
  {
    id: 'the-normal',
    title: 'He wants NORMAL — no super anything, just family',
    spoken: 'Beneficial relationships that walk through regular life together through all the family times up and down... Yahweh just wants to be normal with us no super nothing... just family... no need for a miracle... just Love. He can have anything except true love unless the other soul is true too. He has Jesus and The Holy Spirit... He wants us too. His will not listen to another voice.',
    teaching: 'This reframes the entire list. Every FIRST above is a REPAIR, not the goal. The goal is the picture the record opens with — "walking in the garden in the cool of the day" (Genesis 3:8) — an ordinary evening walk, not a miracle. The miracles in this module are what it cost to get back to normal. Enoch "walked with God" (Genesis 5:24) and that is the whole obituary. Moses was spoken to "face to face, as a man speaketh unto his friend" (Exodus 33:11). Jesus said "I have called you friends" (John 15:15). The road to Emmaus was a walk and the resolution was dinner (Luke 24:15,30). The last invitation in the Book is a meal: "I will come in to him, and will sup with him, and he with me." (Revelation 3:20) The end of the story is not a spectacle; it is Revelation 21:3, He moves in.',
    whyItMatters: 'Because He can compel anything except this. Power can produce compliance, fear, worship and obedience — it cannot produce love, because love that is not freely given is not love. So He SEEKS rather than seizes: "the Father seeketh such to worship him" (John 4:23); He knocks rather than breaks the door (Revelation 3:20); He says "choose you this day" (Joshua 24:15) and asks for all the heart (Deuteronomy 6:5), which is the one thing that cannot be taken. That is why the history in this module looks the way it does — long, patient, costly, and full of waiting. He is not short of power. He is after a true other.',
    andThisToo: 'He is not lonely and He is not lacking. Within the Godhead there is perfect fellowship already — the Son loved "before the foundation of the world" (John 17:24), the Spirit searching the deep things of God (1 Corinthians 2:10). The invitation is INTO something already complete: "that they also may be one in us" (John 17:21); "truly our fellowship is with the Father, and with his Son Jesus Christ." (1 John 1:3) He has Them. He wants us as well. That is not need; it is love, which is worse for us to refuse and better for us to accept.',
    andHisWont: 'And His own will not follow a substitute: "the sheep follow him: for they know his voice" (John 10:4), "And a stranger will they not follow" (John 10:5); "My sheep hear my voice, and I know them, and they follow me." (John 10:27) Not because they are clever — because they know the voice they have been walking with.',
    anchors: ['Genesis 3:8', 'Genesis 5:24', 'Exodus 33:11', 'Deuteronomy 6:5', 'Deuteronomy 6:7', 'Joshua 24:15', 'Micah 6:8', 'John 4:23', 'John 10:4', 'John 10:5', 'John 10:27', 'John 15:15', 'John 17:21', 'John 17:24', 'Luke 24:15', 'Luke 24:30', '1 Corinthians 2:10', '1 John 1:3', '1 John 4:19', 'Revelation 3:20', 'Revelation 21:3'],
  },
  {
    id: 'integrity-cannot-be-faked',
    title: 'Integrity cannot be faked — the instrument reaches past the presentation',
    spoken: 'integrity can\'t be faked because Yahweh access the heart... The Word separates the soul from the spirit... Jesus separated the soul from the spirit... Why?',
    teaching: 'Because the instrument goes deeper than the layer a person can manage. "For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart." (Hebrews 4:12) It divides SOUL from SPIRIT — the part of a person that thinks, feels and chooses from the part that answers to Him — so a well-run soul can no longer stand in for a right spirit. And Jesus did the same division in person, constantly: He "knew their thoughts" (Luke 5:22; Matthew 9:4), He "knew what was in man" and would not commit Himself to enthusiasm (John 2:24-25), and He cut the seam out loud: "This people honoureth me with their lips, but their heart is far from me." (Mark 7:6) The lips and the heart were doing two different things, and He named both.',
    whyItMatters: 'WHY it had to be this way is the hinge of the whole century structure. The old arrangement could be kept OUTWARDLY and broken inwardly — that is exactly why Jeremiah 31:33 promised one written "in their inward parts" instead of on stone, six centuries before it arrived. A covenant on tablets can be performed. A covenant written on the heart cannot, because the medium is the very thing being examined. He searches there by right and by nature: "I the LORD search the heart, I try the reins" (Jeremiah 17:10); "man looketh on the outward appearance, but the LORD looketh on the heart" (1 Samuel 16:7); and the judgment is explicitly of the hidden layer (1 Corinthians 4:5; Romans 2:16).',
    honestNote: 'Scripture does not use the word "subconscious"; its terms are the HEART, the INWARD PARTS and the REINS. The modern word points at roughly the same territory — what runs underneath what you can present — and is used here as a pointer, not as a translation.',
    andTheGoodNews: 'This is protection, not surveillance. It means no one can counterfeit their way into what you have with Him, and it means He is not fooled by your worst day either. The right response is the one David modelled: hand Him the search rather than run it yourself — "Search me, O God, and know my heart" (Psalm 139:23-24) — because Jeremiah 17:9 has already ruled out the heart auditing itself.',
    anchors: ['Hebrews 4:12', 'Hebrews 4:13', 'Jeremiah 17:9', 'Jeremiah 17:10', '1 Samuel 16:7', 'Mark 7:6', 'Luke 5:22', 'Matthew 9:4', 'John 2:24', 'John 2:25', 'Jeremiah 31:33', '1 Corinthians 4:5', 'Romans 2:16', 'Psalm 139:23', 'Psalm 139:24', 'Psalm 7:9'],
  },
  {
    id: 'blind-until',
    title: 'Blind only UNTIL — and then they thrive',
    spoken: 'they will only be blind until they are not... then they thrive...',
    teaching: 'This is the fence on the whole with-Him / without-Him puzzle in this module, and without it the puzzle would read as contempt. The "without Him" column is not a verdict on anybody. It is a description of a TEMPORARY condition, and Scripture attaches a hinge word to it every time: UNTIL. "the vail is upon their heart" (2 Corinthians 3:15) — and then "Nevertheless when it shall turn to the Lord, the vail shall be taken away." (2 Corinthians 3:16) "blindness in part is happened to Israel, until the fulness of the Gentiles be come in." (Romans 11:25) — the hinge word is UNTIL, and it is the verse’s own word. Nothing in the without-Him column is permanent by nature.',
    andThenTheyThrive: 'And the turn is not a bare correction — it is the start of fruitfulness. The man born blind ends up out-arguing the scholars: "one thing I know, that, whereas I was blind, now I see." (John 9:25) Saul was blind for three days and then wrote a third of the New Testament (Acts 9:9,18). Elisha\'s servant saw nothing but an army until his eyes were opened, and the chariots had been there the whole time (2 Kings 6:17). The two on the Emmaus road walked the entire way with Him not knowing it, and "their eyes were opened" over bread (Luke 24:31). Sight comes, and then the life comes.',
    whyItMatters: 'So the puzzle is offered, never brandished. Every believer reading this module was in the left-hand column, and the ones still there are not opponents — they are people for whom the word is UNTIL. That posture is the difference between teaching and gloating.',
    anchors: ['2 Corinthians 3:15', '2 Corinthians 3:16', '2 Corinthians 4:4', 'Romans 11:25', 'John 9:25', 'Acts 9:9', 'Acts 9:18', '2 Kings 6:17', 'Luke 24:31', 'Isaiah 35:5', 'Isaiah 42:16'],
  },
  {
    id: 'the-wilderness',
    title: 'New creatures are made in the wilderness — and He said the family cost would come',
    spoken: 'but they became new creatures because they were put through the wilderness of life... our mothers and fathers hated us... we still love them... etc... Jesus said this would happen...',
    teaching: 'What is true of the centuries is true of a life. Israel did not become a nation at the sea; they became one in the forty years after it, and the purpose is stated outright: "to humble thee, and to prove thee, to know what was in thine heart" (Deuteronomy 8:2). The wilderness is not the absence of provision — it is where the provision happens: manna every morning, water from rock, "Thy raiment waxed not old upon thee" (Deuteronomy 8:4). He even calls it courtship: "I will allure her, and bring her into the wilderness, and speak comfortably unto her." (Hosea 2:14) The new creature (2 Corinthians 5:17) is not issued at the door; it is formed on the road.',
    heSaidItWouldCost: 'And He said in advance where the sharpest cost would land, without softening it: "a man’s foes shall be they of his own household" (Matthew 10:36, quoting Micah 7:6); "The father shall be divided against the son, and the son against the father" (Luke 12:53); "If the world hate you, ye know that it hated me before it hated you." (John 15:18) Being hated by your own is not evidence that you took a wrong turn. He named it as a feature of the road before anyone walked it.',
    andWeStillLove: 'And the response is not permitted to become bitterness. "Love your enemies, bless them that curse you... and pray for them which despitefully use you" (Matthew 5:44) has no exemption for relatives. "Honour thy father and mother" (Ephesians 6:2) is not conditional on their conduct. Meanwhile the gap is covered from above: "When my father and my mother forsake me, then the LORD will take me up." (Psalm 27:10) And the replacement family is promised explicitly, with the cost left in the sentence rather than edited out: a hundredfold "with persecutions" (Mark 10:29-30).',
    whyItMatters: 'Because Darrell\'s frame — walking through regular life together "through all the family times up and down" — includes the down. A faith that only describes the up is not describing this Book, and a reader in the down needs to know the road is the road, not a detour.',
    anchors: ['Deuteronomy 8:2', 'Deuteronomy 8:3', 'Deuteronomy 8:4', 'Hosea 2:14', '2 Corinthians 5:17', 'Matthew 10:36', 'Luke 12:53', 'John 15:18', 'Matthew 5:44', 'Ephesians 6:2', 'Psalm 27:10', 'Mark 10:29', 'Mark 10:30', 'Micah 7:6'],
  },
  {
    id: 'credit-where-due',
    title: 'Credit where credit is due — and no condemnation of anyone',
    spoken: 'We also give credit where credit is due.... so naming or not... we don\'t mean to condemn anyone we let their fruit and ways testify to our users... not narratives without data... Word first...',
    teaching: 'This governs HOW the two columns above are written, and it has four parts. FIRST, CREDIT IS GIVEN. The people whose work carried the Word through these centuries are named where naming honours them — the Masoretes who counted letters to catch a copying error, Jerome, Wycliffe, Gutenberg, Erasmus, Tyndale who died for a translation, Carey, the Bible societies, the translators still working the last languages, and the shepherd who found a jar in a cave. "Render therefore to all their dues... honour to whom honour." (Romans 13:7) Withholding earned credit is not humility; it is a small theft.',
    andNoCondemnation: 'SECOND, WE ARE NOT CONDEMNING ANYONE. Where this study records failure — a king who provoked Yahweh, a reform that did not avert judgment, a church that took state money and took on state habits, a mission movement entangled with an empire — it records the ACT and its outcome, because the Word records them. It does not pass sentence on the person. That is not ours: "Who art thou that judgest another man’s servant? to his own master he standeth or falleth." (Romans 14:4) And the Son Himself set the errand: "For God sent not his Son into the world to condemn the world; but that the world through him might be saved." (John 3:17)',
    letTheFruitTestify: 'THIRD, THE FRUIT AND THE WAYS DO THE TESTIFYING, NOT OUR ADJECTIVES. "Wherefore by their fruits ye shall know them." (Matthew 7:20) So the entries lay out what was done and what came of it and let the reader weigh it. Where a person is living, the teaching is weighed and the person is not named — the same discipline L120, L125 and L126 keep (Titus 3:2). Naming or not naming is a question of whether the naming serves the reader, never of whether we want a target.',
    notNarrativesWithoutData: 'FOURTH, NO NARRATIVES WITHOUT DATA. Every historical claim in this module carries its source — a prism, a chronicle, a stele, an annal, a codex, a colophon, an organisational record — so a reader can check it rather than take our word. A story told without its evidence is exactly the ratings-style narrative this platform exists to remove, and it is the verification doctrine\'s plainest requirement (DR-0076 §8). Where we do not know, we say so; where the record is mixed, we report both halves, as the 18th-19th century entry does with the missionary movement and empire.',
    wordFirst: 'AND WORD FIRST, over all four. The documented history establishes WHAT happened. It never by itself establishes WHY. The Word is what supplies the reading, and where the Word is silent this module stays silent with it rather than filling the gap with a story.',
    anchors: ['Romans 13:7', 'Romans 14:4', 'Romans 14:10', 'John 3:17', 'Matthew 7:20', 'Matthew 7:16', 'Titus 3:2', 'Luke 6:37', 'James 4:12', '1 Corinthians 4:5', 'Proverbs 18:13', 'Proverbs 18:17'],
  },]);

// ---------------------------------------------------------------------------
// THE ENTRIES. Ordered. Tier-tagged. Read each one twice — withoutHim, withHim.
// ---------------------------------------------------------------------------
export const CENTURIES = Object.freeze([

  // === TIER 1 — THE WORD’S OWN CLOCK. Order is given; no BC century is. =====
  {
    id: 'creation',
    order: 1,
    era: 'The beginning',
    when: 'No BC century is given, and none is printed here',
    tier: 'word-clock',
    firsts: [
      'Existence itself — matter, time, light and life, spoken rather than assembled.',
      'A creature made in His own image, given dominion. Nothing in the record before this bears His likeness.',
      'A seventh day set apart — the first time a unit of time is called holy.',
      'Marriage — one man, one woman, one flesh, instituted before any other human institution.',
    ],
    whyNeeded: 'Nothing existed to need anything. This is the one entry where "needed" belongs entirely to His purpose rather than to a condition: He chose the relationship before there was a world to hold it (Ephesians 1:4).',
    usedThen: 'The garden was worked and kept, the creatures named, the seventh day rested in.',
    usedNow: 'The seven-day week still runs worldwide on no astronomical basis whatever — no orbit, no tide, no season produces a seven. Human dignity is still argued from image-bearing (Genesis 9:6; James 3:9), and marriage is still defined from Genesis 2:24 by Christ Himself (Matthew 19:4-5).',
    willBeUsed: 'The same Author writes the last chapter: a new heaven and a new earth (Isaiah 65:17; Revelation 21:1), and a rest that remains for the people of God (Hebrews 4:9).',
    ended: 'Nothing yet. This is the only entry with nothing behind it to end.',
    provision: 'A finished, furnished world handed to a creature who had not worked for it — light, food, water, work, companionship and rest, all in place before the man drew breath.',
    withoutProvision: 'The text gives the counterfactual itself in the negative: the man was formed of dust and animated by breath that was not his own (Genesis 2:7). Withdraw the breath and Ecclesiastes 12:7 states the result plainly.',
    withoutHim: 'A universe from an unguided beginning; life from chemistry; consciousness from complexity. The week is a Babylonian administrative convention that spread. Human worth is a durable social agreement. Marriage is a kinship contract that varies by culture.',
    withHim: '"In the beginning God created the heaven and the earth." (Genesis 1:1) The worlds were framed by His word, so that the visible did not come from the visible (Hebrews 11:3), and all things hold together in the Son (Colossians 1:17).',
    piece: 'The seven-day week. Every other calendar unit is astronomical — a day is a rotation, a month a moon, a year an orbit. The week is not. It matches nothing in the sky, it has survived every attempt to replace it (the French ten-day décade, the Soviet five- and six-day weeks, both abandoned), and it is the one unit of time the first chapter of the Bible institutes.',
    ifNotThisEra: 'There is no downstream. Every later entry is a repair, an extension, or a fulfilment of what is established here.',
    promises: [],
    anchors: ['Genesis 1:1', 'Genesis 1:26', 'Genesis 1:27', 'Genesis 2:2', 'Genesis 2:7', 'Genesis 2:24', 'Hebrews 11:3', 'Colossians 1:16', 'Colossians 1:17', 'Ephesians 1:4', 'Revelation 21:1'],
    history: [],
  },

  {
    id: 'the-fall',
    order: 2,
    era: 'The fall, and the first promise',
    when: 'No BC century is given',
    tier: 'word-clock',
    firsts: [
      'The first death of a creature on a man’s behalf — "coats of skins" replacing the fig leaves they sewed for themselves (Genesis 3:21). The whole sacrificial system exists here in seed.',
      'The first prophecy: a promise aimed at a person not yet born, who would take the wound and break the head (Genesis 3:15).',
      'The first curse on the ground, the first pain in childbirth, the first exile.',
      'The first question ever asked of a human being by his Maker — "Where art thou?" — asked of a man in plain sight.',
    ],
    whyNeeded: 'Sin had entered, and with it shame. The covering the man made for himself was the wrong material and the wrong size; a covering that held required a death he could not supply.',
    usedThen: 'They were clothed by Him and lived. The line to the promised Seed opened.',
    usedNow: 'The animal covering is ENDED and superseded — "it is not possible that the blood of bulls and of goats should take away sins" (Hebrews 10:4). The covering is now a Person: "as many of you as have been baptized into Christ have put on Christ." (Galatians 3:27) His diagnostic question is still the first move of every honest self-examination.',
    willBeUsed: 'The bruising is finished but not yet final — "the God of peace shall bruise satan under your feet shortly" (Romans 16:20) is still future tense, and the robes washed white are worn at the end (Revelation 7:14).',
    ended: 'Unbroken access ended. The way to the tree of life was barred and kept by a flaming sword (Genesis 3:24) — and stayed barred for the whole of the record until a torn veil (Matthew 27:51) and a reopened tree (Revelation 22:14).',
    provision: 'A garment He made and put on them Himself, and a promise spoken to the serpent rather than to the couple — so the guarantee never depended on their performance.',
    withoutProvision: 'The chapter would end at Genesis 3:19, "unto dust shalt thou return," with no line forward. There is no second promise anywhere in the record that does not run through this one.',
    withoutHim: 'An origin story of the kind every ancient culture produced: an explanation for mortality, for the pain of childbirth, for the labour of farming, and for why humans wear clothes and snakes are feared.',
    withHim: '"And I will put enmity between thee and the woman, and between thy seed and her seed; it shall bruise thy head, and thou shalt bruise his heel." (Genesis 3:15) The first sentence of the gospel is spoken inside the sentence of judgment.',
    piece: 'The specificity of the wound. A head-crushing and a heel-bruising are not the same injury, and the promise assigns each to a side before there is any story to fit them to. Every later covering in Scripture — Passover, Day of Atonement, the Cross — repeats the same shape: an innocent life, a covering supplied from outside, a person who did not earn it.',
    ifNotThisEra: 'A promise given later would arrive after the pattern of sacrifice was already running, and would read as an explanation added to a practice. Given here, before any altar exists, it is the seed the practice grows from.',
    promises: [
      { promise: 'The seed of the woman will bruise the serpent’s head', made: 'Genesis 3:15', fulfilled: 'Galatians 4:4', alsoFulfilled: ['1 John 3:8', 'Colossians 2:15', 'Hebrews 2:14'], fulfilledIn: 'ad-first-century', status: 'fulfilled-not-yet-final', note: 'Struck at the Cross (Colossians 2:15; Hebrews 2:14); the final crushing is still future (Romans 16:20; Revelation 20:10). The distance from promise to fulfilment is the longest in the book.' },
    ],
    anchors: ['Genesis 3:7', 'Genesis 3:9', 'Genesis 3:15', 'Genesis 3:19', 'Genesis 3:21', 'Genesis 3:24', 'Hebrews 10:4', 'Galatians 3:27', 'Colossians 2:15', 'Hebrews 2:14', 'Romans 16:20', 'Revelation 7:14'],
    history: [],
  },

  {
    id: 'flood-noahic',
    order: 3,
    era: 'The flood, and the covenant with all flesh',
    when: 'No BC century is given. The Word dates it to the DAY on its own clock — Noah’s 600th year, second month, seventeenth day (Genesis 7:11)',
    tier: 'word-clock',
    firsts: [
      'The first covenant, and it is made with ALL flesh — not with a chosen family (Genesis 9:9-10).',
      'The first SIGN: a thing in the sky given a meaning it did not previously carry (Genesis 9:13).',
      'The first self-binding limit Yahweh places on His own future action — never again by water (Genesis 9:11).',
      'The first guarantee of natural regularity: seedtime and harvest, cold and heat, summer and winter, day and night, "While the earth remaineth" (Genesis 8:22).',
      'The first permission to eat flesh, and the first mandate for human justice against bloodshed (Genesis 9:3, 9:6).',
    ],
    whyNeeded: 'The condition is stated twice and precisely: every imagination of the thoughts of man’s heart was only evil continually (Genesis 6:5), and the earth was filled with violence (Genesis 6:11-13). The problem was not one culture; it was all flesh.',
    usedThen: 'Eight people and the creatures came through. The line to Abraham survived inside a boat.',
    usedNow: 'Genesis 8:22 is still holding, and it is the reason agriculture, insurance, navigation and climate science are possible at all — a world whose regularities failed at random could not be farmed or studied. Genesis 9:6 is still the root argument for the wrongness of murder in most legal traditions that have one. The bow still appears.',
    willBeUsed: 'The limit is exact and its boundary is stated: not water again, but fire, and by the same word that flooded it (2 Peter 3:6-7).',
    ended: 'The world before the flood ended entirely, and the recorded lifespans fall away after it — from Methuselah’s 969 to Abraham’s 175 within a few generations.',
    provision: 'A hundred-and-twenty-year warning (Genesis 6:3), exact building specifications, and a door shut by Him rather than by Noah (Genesis 7:16).',
    withoutProvision: 'Stated by Him in advance: "I will destroy man whom I have created from the face of the earth." (Genesis 6:7) The counterfactual is not speculation here — the text names the outcome the ark answered.',
    withoutHim: 'A memory of catastrophic regional flooding, preserved across many cultures because such floods happened and were survived; the rainbow is refraction through water droplets and always was; seasonal stability follows from orbital mechanics and a stabilising moon.',
    withHim: 'Same physics, different Author, and a covenant attached to it: "I do set my bow in the cloud, and it shall be for a token of a covenant between me and the earth." (Genesis 9:13) The sign is not the optics; the sign is the promise nailed to the optics.',
    piece: 'The self-limitation. Ancient flood accounts end with the gods deciding to be more careful, or quieter, or better fed. This one ends with the God who sent it binding Himself by oath never to do it again and hanging a public reminder in the sky where the injured party — not the offender — has to look at it.',
    ifNotThisEra: 'Genesis 8:22 has to precede the agricultural covenant life of Israel, the harvest festivals, and every sowing-and-reaping text in both Testaments. Guaranteed regularity is the floor those stand on.',
    promises: [
      { promise: 'Never again a flood to destroy the earth; the bow as the token', made: 'Genesis 9:11', alsoMade: ['Genesis 9:13'], fulfilled: 'Genesis 8:22', fulfilledIn: 'ongoing', status: 'kept-continuously', note: 'This is the one promise in the book whose fulfilment is verifiable every single year by anyone, believer or not: the harvests have not stopped.' },
    ],
    anchors: ['Genesis 6:3', 'Genesis 6:5', 'Genesis 6:7', 'Genesis 6:11', 'Genesis 7:11', 'Genesis 7:16', 'Genesis 8:22', 'Genesis 9:3', 'Genesis 9:6', 'Genesis 9:11', 'Genesis 9:13', '2 Peter 3:6', '2 Peter 3:7'],
    history: [],
  },

  {
    id: 'babel',
    order: 4,
    era: 'Babel — the division of tongues',
    when: 'No BC century is given',
    tier: 'word-clock',
    firsts: [
      'Languages. Before this the record says "the whole earth was of one language, and of one speech" (Genesis 11:1).',
      'The first time Yahweh acts to LIMIT human capability rather than extend it — and the reason given is capability itself: "now nothing will be restrained from them, which they have imagined to do." (Genesis 11:6)',
      'The first nations, in the sense of peoples separated by tongue and territory (Genesis 10:5, 10:32).',
    ],
    whyNeeded: 'One language plus one purpose plus rebellion is an unbounded combination. The command had been to fill the earth (Genesis 9:1); the project was explicitly the opposite — "lest we be scattered abroad upon the face of the whole earth" (Genesis 11:4).',
    usedThen: 'They were scattered, and the earth was filled as commanded — by dispersal rather than by obedience.',
    usedNow: 'Roughly seven thousand living languages still stand on this act. It is why Bible translation is a mission and not a formality, and it is why Acts 2 is legible as a deliberate reversal rather than a coincidence.',
    willBeUsed: 'Not undone — HEALED. The end shows the division intact and gathered: "a great multitude... of all nations, and kindreds, and people, and tongues" standing before the throne (Revelation 7:9). The tongues are not deleted; they are brought into one choir.',
    ended: 'Universal mutual understanding ended, and has never been restored by any human means. Every attempt since — Latin as a universal tongue, Esperanto, machine translation — mitigates the division without removing it.',
    provision: 'Boundaries. "hath determined the times before appointed, and the bounds of their habitation" — and Paul gives the purpose: "That they should seek the Lord." (Acts 17:26-27) The scattering is aimed at seeking.',
    withoutProvision: 'The text names what unlimited unified capability was heading toward, and it was not good: nothing restrained. Judgment at Babel is a mercy measured against what was being built.',
    withoutHim: 'Historical linguistics: a proto-language diversifying over millennia through isolation and drift, producing families that can be reconstructed by regular sound correspondence. The ziggurat is a well-attested Mesopotamian building type. The story is an etiology explaining diversity.',
    withHim: 'The same diversity, with a decision behind it and a date on it: "let us go down, and there confound their language, that they may not understand one another’s speech." (Genesis 11:7)',
    piece: 'Pentecost. If Babel is only an etiology, Acts 2 is a strange coincidence — the one recorded reversal of the one recorded division, performed as the opening act of the Church, in the hearing of "every nation under heaven" (Acts 2:5). With Genesis 11 in the box, the two pieces interlock: the curse gets its counter-move, and the counter-move is the gospel.',
    ifNotThisEra: 'The nations must exist before Abraham can be told that in him "shall all families of the earth be blessed" (Genesis 12:3). The blessing needs plural families to be aimed at.',
    promises: [],
    anchors: ['Genesis 9:1', 'Genesis 10:5', 'Genesis 11:1', 'Genesis 11:4', 'Genesis 11:6', 'Genesis 11:7', 'Genesis 11:9', 'Acts 17:26', 'Acts 17:27', 'Acts 2:5', 'Revelation 7:9'],
    history: [],
  },
  {
    id: 'abraham',
    order: 5,
    era: 'Abraham — one man chosen for all families',
    when: 'No BC century is stated. Computed reference position ≈ the 21st-19th centuries BC (see CENTURY_GRID; the Genesis 11:26 fork moves Abram himself by sixty years)',
    tier: 'word-clock',
    firsts: [
      'Election — one man singled out, and singled out explicitly FOR everyone else: "in thee shall all families of the earth be blessed." (Genesis 12:3)',
      'Righteousness credited for BELIEVING. "And he believed in the LORD; and he counted it to him for righteousness." (Genesis 15:6) The first statement of justification by faith, and it precedes the law by centuries.',
      'A covenant Yahweh cuts ALONE. In Genesis 15:17 the smoking furnace and burning lamp pass between the pieces while Abram sleeps — only one party walks the blood path, so only one party can break it.',
      'A covenant sign carried in the body (Genesis 17:10-11).',
      'A man arguing with Yahweh over the fate of a city, and being heard six times (Genesis 18:23-33).',
    ],
    whyNeeded: 'After Babel the nations had gone after other gods — and the record is blunt that Abraham’s own family was among them: "Your fathers dwelt on the other side of the flood in old time... and they served other gods." (Joshua 24:2) A line had to be marked out through which the promised Seed could come, and it had to be marked out of idolatry, not out of merit.',
    usedThen: 'A family, a land promise, a son given past the age of having one.',
    usedNow: 'Directly and structurally: "they which are of faith, the same are the children of Abraham" (Galatians 3:7), and he is "the father of all them that believe" (Romans 4:11). Circumcision as a covenant requirement is ENDED for the believer (Acts 15:10-11; Galatians 5:6).',
    willBeUsed: 'The "all families" clause is not finished. Revelation 7:9 is the receipt, and it is still being written.',
    ended: 'Nothing ended here. This entry only opens things.',
    provision: 'A son, when the means of having one was gone (Romans 4:19); a ram caught in a thicket at the exact moment the knife was raised (Genesis 22:13); and a promise sworn by Himself because "he could swear by no greater" (Hebrews 6:13).',
    withoutProvision: 'Isaac dies on Moriah, and with him the promise. The ram is the whole hinge, and Abraham names the place for the provision rather than for the deliverance — "Jehovahjireh" (Genesis 22:14).',
    withoutHim: 'A semi-nomadic clan migrates from Ur up the Euphrates to Haran and down into Canaan — a well-attested movement pattern for the period — and its tribal deity becomes, over centuries, a national and then a universal God. The Ur III archives and the Mari and Nuzi tablets show the legal customs the patriarchal narratives assume (adoption of a servant heir, a barren wife giving her maid), which is exactly what a genuine second-millennium setting would look like.',
    withHim: 'The same journey, begun by a word: "Get thee out of thy country... unto a land that I will shew thee." (Genesis 12:1) A man leaves without the destination, and is credited with righteousness for taking the word as sufficient.',
    piece: 'Genesis 15:17. In every other covenant ritual of the ancient Near East, both parties walk between the divided animals, invoking the same fate on themselves if they break faith. Here only Yahweh walks, and Abram is asleep. A story invented to bind a people to their god does not put all the risk on the god.',
    ifNotThisEra: 'Justification by faith has to be stated BEFORE the law is given, or the gospel becomes a concession after the law failed. Paul’s entire argument in Galatians 3:17 turns on the order: the promise came first, and "the law, which was four hundred and thirty years after, cannot disannul" it.',
    promises: [
      { promise: 'In thee shall all families of the earth be blessed', made: 'Genesis 12:3', fulfilled: 'Galatians 3:8', alsoFulfilled: ['Galatians 3:14', 'Acts 3:25'], fulfilledIn: 'ad-first-century', status: 'fulfilled-still-running', note: 'Paul calls Genesis 12:3 the gospel "preached before" to Abraham. Opened at Pentecost, still being completed nation by nation.' },
      { promise: 'A son by Sarah, when both were past age', made: 'Genesis 17:16', fulfilled: 'Genesis 21:2', fulfilledIn: 'abraham', status: 'fulfilled', note: 'Twenty-five years from the call to the birth — the promise outlasted their capacity on purpose.' },
      { promise: 'Thy seed shall be a stranger in a land not theirs, and afflicted four hundred years; afterward they shall come out with great substance', made: 'Genesis 15:13', alsoMade: ['Genesis 15:14'], fulfilled: 'Exodus 12:35', alsoFulfilled: ['Exodus 12:36', 'Exodus 12:41'], fulfilledIn: 'exodus', status: 'fulfilled', note: 'A dated prediction of a national future, given to a childless man, and kept to the letter including the "great substance".' },
    ],
    anchors: ['Genesis 12:1', 'Genesis 12:3', 'Genesis 15:6', 'Genesis 15:13', 'Genesis 15:17', 'Genesis 17:10', 'Genesis 21:2', 'Genesis 22:13', 'Genesis 22:14', 'Joshua 24:2', 'Romans 4:11', 'Galatians 3:7', 'Galatians 3:8', 'Galatians 3:17', 'Hebrews 6:13'],
    history: [
      { event: 'Legal customs the patriarchal narratives assume — a servant as heir in the absence of a son, a barren wife providing her maid — appear in second-millennium Mesopotamian family law.', date: 'second millennium BC', source: 'The Nuzi and Mari archives; the Ur III and Old Babylonian legal corpora.' },
    ],
  },

  {
    id: 'exodus',
    order: 6,
    era: 'Egypt and the exodus — the Name, and a nation redeemed by blood',
    when: 'No BC century is stated. Computed reference position ≈ 1446 BC on the 1 Kings 6:1 reading, or ≈ the 13th century BC on the alternative reading (see CENTURY_GRID — a genuine fork, not resolved here)',
    tier: 'word-clock',
    firsts: [
      'He gives His NAME. Not a title, a name: "I AM THAT I AM"; "The LORD God of your fathers... this is my name for ever" (Exodus 3:15) He had been known as the God of somebody; now He is known as Himself.',
      'A whole nation redeemed at once, by blood applied to a doorway — the first Passover (Exodus 12:13).',
      'A judgment aimed by name at the gods of a nation rather than at its army: "against all the gods of Egypt I will execute judgment." (Exodus 12:12)',
      'Law written by His own finger and given to a people rather than to a king (Exodus 31:18).',
      'A dwelling place: "let them make me a sanctuary; that I may dwell among them." (Exodus 25:8) He had visited; He had never moved in.',
      'An ordained priesthood, a mediated approach, and one day a year when one man could enter (Leviticus 16:34).',
    ],
    whyNeeded: 'A family had become a nation in bondage, and the condition is stated as work and as groaning (Exodus 1:13-14; 2:23-24). Three things were missing at once: a deliverance they could not perform, a way to live as a free people, and a way for a holy God to live in the middle of an unholy one without consuming it.',
    usedThen: 'The blood on the doorposts; the sea opened; bread from the sky for forty years; a tent at the centre of the camp with a cloud over it.',
    usedNow: 'Passover is FULFILLED, not repeated — "Christ our passover is sacrificed for us." (1 Corinthians 5:7) The sacrificial system is ENDED (Hebrews 10:9-10, 8:13). The moral standard STANDS (Romans 3:31; Matthew 5:17-18). The priesthood is TRANSFERRED (Hebrews 7:12) and is now held by every believer (1 Peter 2:9). The dwelling has moved inside: "ye are the temple of God" (1 Corinthians 3:16).',
    willBeUsed: 'The tent becomes permanent and public: "Behold, the tabernacle of God is with men, and he will dwell with them." (Revelation 21:3) The whole tabernacle was a scale model of that sentence.',
    ended: 'Egypt’s claim on Israel ended in one night. And the era in which Yahweh was known only as the God of particular men ended when He gave the Name.',
    provision: 'A lamb per household, sized to the household (Exodus 12:4); bread every morning for forty years with a double portion before the Sabbath (Exodus 16:35); clothes and shoes that did not wear out (Deuteronomy 29:5); water from rock; a pillar of cloud by day and fire by night.',
    withoutProvision: 'Moses states it himself and refuses to move without it: "If thy presence go not with me, carry us not up hence." (Exodus 33:15) The counterfactual is not a guess — the leader named it as a condition and would not travel on any other terms.',
    withoutHim: 'A Semitic labour population departs Egypt during a period of weakened central control and coalesces in the Canaanite highlands. The Merneptah Stele (≈1208 BC) is the earliest external mention of "Israel" as a people in Canaan, so a people by that name is certainly there by the late 13th century. The Decalogue’s form parallels Hittite suzerainty treaties; the case law parallels the Code of Hammurabi.',
    withHim: 'The same departure, with a Deliverer named in it, and the treaty form is the point rather than the problem: He addressed them in the legal language they would recognise, as a Great King binding a people to Himself.',
    piece: 'The direction of the atonement. Hammurabi’s code and the Hittite treaties are how a king binds subjects. No ancient code has its god providing the covering for the subjects’ failure, at the god’s own cost, on a fixed annual calendar. The Day of Atonement runs the obligation backwards, and it is the shape Hebrews says was a shadow of the real thing all along (Hebrews 10:1).',
    ifNotThisEra: 'Passover must precede the Cross by enough centuries for the vocabulary to be second nature. When John says "Behold the Lamb of God" (John 1:29), no one asks what a lamb has to do with sin — that had been taught to a whole nation, annually, for over a thousand years. Fulfilment needs a pattern already fluent in the hearers.',
    promises: [
      { promise: 'I will bring you out from under the burdens of the Egyptians, and I will take you to me for a people', made: 'Exodus 6:6', alsoMade: ['Exodus 6:7'], fulfilled: 'Exodus 12:41', fulfilledIn: 'exodus', status: 'fulfilled', note: 'Kept "the selfsame day" the four hundred and thirty years ended.' },
      { promise: 'When I see the blood, I will pass over you', made: 'Exodus 12:13', fulfilled: 'Exodus 12:29', alsoFulfilled: ['1 Corinthians 5:7'], fulfilledIn: 'exodus', status: 'fulfilled-then-fulfilled-again', note: 'Kept that night in Egypt, and kept again in substance at the Cross — the same promise operating on two levels, which is why Paul can call Christ our passover without explanation.' },
      { promise: 'A prophet like unto Moses will be raised up from among their brethren', made: 'Deuteronomy 18:15', alsoMade: ['Deuteronomy 18:18'], fulfilled: 'Acts 3:22', alsoFulfilled: ['John 6:14', 'Acts 7:37'], fulfilledIn: 'ad-first-century', status: 'fulfilled', note: 'Roughly fourteen centuries from promise to fulfilment, and the apostles cite it as the identification test.' },
    ],
    anchors: ['Exodus 1:13', 'Exodus 2:23', 'Exodus 3:14', 'Exodus 3:15', 'Exodus 12:4', 'Exodus 12:12', 'Exodus 12:13', 'Exodus 12:41', 'Exodus 16:35', 'Exodus 25:8', 'Exodus 31:18', 'Exodus 33:15', 'Deuteronomy 18:15', 'Deuteronomy 29:5', 'Leviticus 16:34', '1 Corinthians 5:7', 'Hebrews 8:13', 'Hebrews 10:1', 'Hebrews 7:12', '1 Peter 2:9', '1 Corinthians 3:16', 'Revelation 21:3', 'John 1:29'],
    history: [
      { event: 'The Merneptah Stele names "Israel" as a people in Canaan — the earliest external attestation of the name.', date: '≈1208 BC', source: 'Merneptah Stele, Cairo Museum.' },
      { event: 'The Decalogue and covenant follow the form of second-millennium suzerainty treaties (preamble, historical prologue, stipulations, witnesses, blessings and curses).', date: 'second millennium BC', source: 'Hittite treaty corpus, Boghazköy archives.' },
    ],
  },

  {
    id: 'monarchy-temple',
    order: 7,
    era: 'The 10th century BC — the throne and the house (David and Solomon)',
    when: '≈1000-901 BC. Reached by counting the regnal totals back from the 853/841 pins: Solomon’s fourth year ≈967/966 BC (1 Kings 6:1), the kingdom divides ≈931 BC. Secure to the century; single years can move by a year or two through unresolved co-regencies',
    tier: 'synchronized',
    firsts: [
      'A dynasty promised FOREVER, unconditionally, to one house: "thy throne shall be established for ever." (2 Samuel 7:16)',
      'A fixed house instead of a tent — the first permanent address for the worship of Yahweh (1 Kings 6:1).',
      'Worship as an ordered, staffed, scored institution: singers and instruments appointed as a standing office (1 Chronicles 25:1).',
      'A book of songs given for the prayers of everyone — the first time the words to pray with are written down and handed to the people.',
    ],
    whyNeeded: 'Two conditions. The people demanded a king "like all the nations" (1 Samuel 8:5) — a demand He granted while naming its cost (1 Samuel 8:11-18). And the promise needed a royal line, so that the promised seed of Genesis 3:15 could come to a throne with an heir.',
    usedThen: 'Sacrifice centralised, festivals kept, a kingdom at its largest extent, and the songs sung in the house they were written for.',
    usedNow: 'The temple is ENDED — destroyed in AD 70, and never rebuilt. The throne CONTINUES and was transferred to a descendant: "the Lord God shall give unto him the throne of his father David... and of his kingdom there shall be no end." (Luke 1:32-33) The Psalms are still the most-used prayer book on earth.',
    willBeUsed: 'The reign becomes visible and total: "The kingdoms of this world are become the kingdoms of our Lord, and of his Christ; and he shall reign for ever and ever." (Revelation 11:15)',
    ended: 'The tabernacle era ended — the tent that had travelled since Sinai was retired into a building. Israel’s life without a king ended, with everything 1 Samuel 8 warned would follow.',
    provision: 'A king "after his own heart" (1 Samuel 13:14) found among sheep; the pattern for the house given in writing (1 Chronicles 28:19); and a promise that survived the failure of nearly every king who inherited it.',
    withoutProvision: 'The promise had to be independent of the holders, and it was tested immediately — Solomon’s own heart turned (1 Kings 11:4). Had the covenant been conditional on the kings’ conduct it would have died inside two generations. It did not, because 2 Samuel 7:15 fenced it in advance.',
    withoutHim: 'A tenth-century Levantine chiefdom consolidates into a small state, builds a dynastic shrine, and produces a court literature — the ordinary trajectory of an Iron Age polity. The Tel Dan Stele (9th century BC) names the "House of David" in an Aramaic victory inscription, so the dynasty is externally attested a century after the fact.',
    withHim: 'The same consolidation, carrying a promise the state itself could not guarantee: an everlasting throne, given to a house that would lose its kingdom within four centuries and never recover it by any political means.',
    piece: 'The promise outlives its own institution. A dynastic charter invented to legitimise a ruling house becomes worthless the moment the house is deposed — and this one was deposed, in 586 BC, permanently. Yet the claim was not quietly dropped; it was intensified by the prophets DURING and AFTER the collapse (Jeremiah 23:5; Ezekiel 37:24), and the New Testament opens by tracing a genealogy to it (Matthew 1:1).',
    ifNotThisEra: 'The Davidic line must be public, documented and genealogically traceable long before the claimant arrives, or the claim is unfalsifiable. Both gospel genealogies depend on records this era created.',
    promises: [
      { promise: 'Thy house and thy kingdom shall be established for ever before thee: thy throne shall be established for ever', made: '2 Samuel 7:16', fulfilled: 'Luke 1:32', alsoFulfilled: ['Luke 1:33', 'Acts 2:30', 'Revelation 11:15'], fulfilledIn: 'ad-first-century', status: 'fulfilled-not-yet-consummated', note: 'Peter preaches this text at Pentecost as fulfilled in the resurrection; its visible form is still future.' },
      { promise: 'Thy son shall build an house for my name', made: '2 Samuel 7:13', fulfilled: '1 Kings 6:1', alsoFulfilled: ['1 Kings 8:20'], fulfilledIn: 'monarchy-temple', status: 'fulfilled', note: 'One of the shortest promise-to-fulfilment distances in the record — a single generation.' },
    ],
    anchors: ['1 Samuel 8:5', '1 Samuel 13:14', '2 Samuel 7:13', '2 Samuel 7:15', '2 Samuel 7:16', '1 Kings 6:1', '1 Kings 8:20', '1 Kings 11:4', '1 Chronicles 25:1', '1 Chronicles 28:19', 'Jeremiah 23:5', 'Ezekiel 37:24', 'Matthew 1:1', 'Luke 1:32', 'Luke 1:33', 'Acts 2:30', 'Revelation 11:15'],
    history: [
      { event: 'The Tel Dan Stele names the "House of David" — external attestation of the dynasty within about a century of David.', date: '9th century BC', source: 'Tel Dan Stele, Israel Museum.' },
      { event: 'The Mesha Stele (Moabite Stone) records Moab’s revolt against Israel and names Omri, matching 2 Kings 3.', date: '≈840 BC', source: 'Mesha Stele, Louvre.' },
    ],
  },

  // === TIER 2 — SYNCHRONIZED CENTURIES. External record fixes these. ========
  {
    id: 'bc-9th',
    order: 8,
    era: 'The 9th century BC — the prophet against the throne',
    when: '900-801 BC. Pinned by Ahab at Qarqar (853 BC) and Jehu’s tribute (841 BC)',
    tier: 'synchronized',
    firsts: [
      'The prophetic office standing OUTSIDE and AGAINST the state — one unarmed man contradicting a king, a queen and a state-sponsored priesthood in public (1 Kings 18:21).',
      'A prophetic succession with a transferred mantle and a doubled portion asked for and granted (2 Kings 2:9-15) — office passed on rather than dying with the man.',
      'A public, falsifiable test between rival gods, proposed by the prophet, on the rivals’ own terms and with the odds stacked against him (1 Kings 18:23-24).',
    ],
    whyNeeded: 'The state itself had gone over. Ahab "did more to provoke the LORD God of Israel to anger than all the kings of Israel that were before him" (1 Kings 16:33), and the official cult of baal was royally funded. A word that came only through the sanctioned institutions could no longer reach the nation, because the institutions had been bought.',
    usedThen: 'Drought announced and lifted by the word of a prophet; a national assembly at Carmel; kings rebuked to their faces; a widow’s meal barrel that did not fail.',
    usedNow: 'This is the origin of every faithful witness who has to speak when the platform belongs to the other side. James 5:17-18 offers Elijah as the ordinary believer’s pattern precisely because he was "a man subject to like passions as we are."',
    willBeUsed: 'Two witnesses with the same authority over the sky appear at the end (Revelation 11:6), and Malachi 4:5 promises an Elijah before the great day — a promise Jesus attaches to John the Baptist (Matthew 11:14).',
    ended: 'The assumption that the throne and the altar always speak together ended. From here forward the Word can be, and often is, in the mouth of the man the palace wants silenced.',
    provision: 'Ravens, then a widow’s barrel, then an angel’s cake baked on coals, then forty days of strength from one meal (1 Kings 17:6; 17:16; 19:6-8) — and, when the man asked to die, sleep and food before any correction.',
    withoutProvision: 'He asked for death under the juniper tree (1 Kings 19:4). The prophet does not survive his own success without being fed and let sleep first, which is why the passage spends four verses on a meal before it spends one on a rebuke.',
    withoutHim: 'A ninth-century power struggle between a Phoenician-allied royal house and a conservative Yahwistic faction, in a small state squeezed between Aram and Assyria. Ahab is externally attested as a serious regional power — the Kurkh Monolith credits him with two thousand chariots at Qarqar, the largest contingent in the coalition. Jehu appears bowing on the Black Obelisk twelve years later.',
    withHim: 'The same politics, with the real question underneath it stated out loud: "How long halt ye between two opinions? if the LORD be God, follow him: but if baal, then follow him." (1 Kings 18:21) The dynasty’s fall is judgment, not merely a coup.',
    piece: 'The Assyrian records and the Hebrew records agree on the political facts and disagree on nothing except cause. Qarqar, Ahab’s chariotry, Jehu’s tribute — the frame is externally confirmed. What the Assyrian scribes cannot supply is why the strongest king of the northern dynasty is remembered by his own nation as its worst.',
    ifNotThisCentury: 'The independent prophetic office must exist before the writing prophets of the next century can function. Amos and Isaiah write as men already understood to speak without state licence — a status Elijah established at cost.',
    promises: [
      { promise: 'The barrel of meal shall not waste, neither shall the cruse of oil fail, until the day that the LORD sendeth rain upon the earth', made: '1 Kings 17:14', fulfilled: '1 Kings 17:16', fulfilledIn: 'bc-9th', status: 'fulfilled', note: 'A promise made to a foreign widow in Sidon — outside Israel entirely — and Jesus later points at exactly that detail (Luke 4:25-26).' },
      { promise: 'I have left me seven thousand in Israel, all the knees which have not bowed unto baal', made: '1 Kings 19:18', fulfilled: 'Romans 11:4', alsoFulfilled: ['Romans 11:5'], fulfilledIn: 'ad-first-century', status: 'fulfilled-and-reapplied', note: 'Paul reaches back nine centuries and uses it as the standing proof that a remnant always exists.' },
    ],
    anchors: ['1 Kings 16:33', '1 Kings 17:6', '1 Kings 17:14', '1 Kings 17:16', '1 Kings 18:21', '1 Kings 19:4', '1 Kings 19:18', '2 Kings 2:9', 'James 5:17', 'Malachi 4:5', 'Matthew 11:14', 'Romans 11:4', 'Revelation 11:6'],
    history: [
      { event: 'Ahab of Israel fields 2,000 chariots and 10,000 foot at the battle of Qarqar against Shalmaneser III.', date: '853 BC', source: 'Kurkh Monolith of Shalmaneser III, British Museum.' },
      { event: 'Jehu son of Omri renders tribute to Shalmaneser III — the only near-contemporary image of an Israelite king.', date: '841 BC', source: 'Black Obelisk of Shalmaneser III, British Museum.' },
    ],
  },

  {
    id: 'bc-8th',
    order: 9,
    era: 'The 8th century BC — the Word put in a book',
    when: '800-701 BC. Pinned by the fall of Samaria (722 BC) and Sennacherib’s campaign (701 BC)',
    tier: 'synchronized',
    firsts: [
      'Prophecy WRITTEN and preserved for readers the prophet would never meet. Amos, Hosea, Isaiah and Micah are the first prophets whose words are books. The instruction is explicit: "Now go, write it before them in a table, and note it in a book, that it may be for the time to come for ever and ever." (Isaiah 30:8)',
      'A prophet sent to preach repentance to a FOREIGN capital, and that capital repenting (Jonah 3:5-10) — mercy shown to Israel’s coming executioner.',
      'The clearest pre-announcement of a suffering, substitutionary Messiah in the record (Isaiah 53), written centuries before crucifixion existed as a method.',
      'Yahweh’s standard applied to the nations, not only to Israel — Amos opens by judging six surrounding peoples by a standard they never received in writing (Amos 1:3-2:3).',
    ],
    whyNeeded: 'The institutions were about to be taken away. Within this century the northern kingdom ceases to exist, and Judah survives by a hair. A word tied to a standing temple and a functioning court would have died with them. Written prophecy is portable, copyable, and survives the state that persecuted it.',
    usedThen: 'Dated by named kings, read against events the hearers could check — including Isaiah’s promise that Sennacherib "shall not come into this city" (2 Kings 19:32-34), verified within the same reign.',
    usedNow: 'These books are still read daily worldwide. Isaiah 53 is still the passage the Ethiopian in Acts 8:32-35 was reading when Philip explained it, and it is still where that explanation begins.',
    willBeUsed: 'Large portions remain unfulfilled — the wolf and the lamb (Isaiah 11:6), swords into plowshares (Isaiah 2:4), and the government upon His shoulder in its visible form (Isaiah 9:6-7).',
    ended: 'The northern kingdom ended in 722 BC and never returned. Ten tribes go out of the record as a political entity.',
    provision: 'A hundred and eighty-five thousand Assyrians dealt with in a night without Judah drawing a sword (2 Kings 19:35), and a book that outlived the empire that came for it.',
    withoutProvision: 'Hezekiah spread the threatening letter before Yahweh and prayed rather than answered it (2 Kings 19:14). Sennacherib’s own prism records shutting Hezekiah up "like a bird in a cage" in Jerusalem — and then, remarkably, does not claim to have taken the city, which is the one thing an Assyrian royal annal would never omit if it had happened.',
    withoutHim: 'The Assyrian expansion under Tiglath-Pileser III, Shalmaneser V, Sargon II and Sennacherib restructures the Levant. Small states respond with tribute, revolt and religious reform. Prophetic literature is the crisis writing of a threatened society — a well-known genre response.',
    withHim: 'The same empire, described in advance as a tool with a handle: "O Assyrian, the rod of mine anger... Howbeit he meaneth not so" (Isaiah 10:5, 10:7) — an empire doing exactly what it intended and simultaneously exactly what it was being used for.',
    piece: 'Sennacherib’s silence. His prism inventories forty-six walled cities taken and boasts of the siege, then stops. The Assyrian record and 2 Kings agree that Jerusalem was surrounded and that Jerusalem was not taken; only one of the two accounts explains why the army left.',
    ifNotThisCentury: 'If prophecy is not committed to writing BEFORE the exile, there is no portable Word for the exiles to carry, no text for Daniel to read in Babylon (Daniel 9:2), and no pre-dated Isaiah 53 for Philip to open in Acts 8. The whole later chain depends on the writing happening while the institutions still stood.',
    promises: [
      { promise: 'Behold, a virgin shall conceive, and bear a son, and shall call his name Immanuel', made: 'Isaiah 7:14', fulfilled: 'Matthew 1:22', alsoFulfilled: ['Matthew 1:23'], fulfilledIn: 'ad-first-century', status: 'fulfilled', note: 'Roughly seven centuries from promise to fulfilment.' },
      { promise: 'He was wounded for our transgressions... and the LORD hath laid on him the iniquity of us all', made: 'Isaiah 53:5', alsoMade: ['Isaiah 53:6'], fulfilled: '1 Peter 2:24', alsoFulfilled: ['Acts 8:32', 'Acts 8:35'], fulfilledIn: 'ad-first-century', status: 'fulfilled', note: 'Written centuries before crucifixion was practised, and describing its mechanics.' },
      { promise: 'Thou, Bethlehem Ephratah... out of thee shall he come forth unto me that is to be ruler in Israel', made: 'Micah 5:2', fulfilled: 'Matthew 2:5', alsoFulfilled: ['Matthew 2:6'], fulfilledIn: 'ad-first-century', status: 'fulfilled', note: 'Quoted back by Herod’s own scholars as a settled reading before the claimant was public.' },
      { promise: 'He shall not come into this city, nor shoot an arrow there', made: '2 Kings 19:32', alsoMade: ['2 Kings 19:34'], fulfilled: '2 Kings 19:35', alsoFulfilled: ['2 Kings 19:36'], fulfilledIn: 'bc-8th', status: 'fulfilled', note: 'A falsifiable short-range promise, made publicly, verified within days — and corroborated by the besieger’s own inscription declining to claim the city.' },
    ],
    anchors: ['Isaiah 30:8', 'Isaiah 7:14', 'Isaiah 53:5', 'Isaiah 53:6', 'Isaiah 10:5', 'Isaiah 2:4', 'Isaiah 11:6', 'Isaiah 9:6', 'Micah 5:2', 'Amos 1:3', 'Jonah 3:5', '2 Kings 17:6', '2 Kings 19:14', '2 Kings 19:32', '2 Kings 19:35', 'Acts 8:32', 'Acts 8:35', '1 Peter 2:24', 'Matthew 1:23', 'Matthew 2:6'],
    history: [
      { event: 'Samaria falls; the northern kingdom is deported and resettled.', date: '722 BC', source: 'Annals of Sargon II; 2 Kings 17:6.' },
      { event: 'Sennacherib besieges Jerusalem, claims forty-six Judean cities and Hezekiah "like a bird in a cage" — and makes no claim to have taken the city.', date: '701 BC', source: 'Sennacherib Prism (Taylor Prism), British Museum.' },
      { event: 'The Siloam Tunnel inscription records the completion of Hezekiah’s water tunnel, matching 2 Kings 20:20.', date: '≈701 BC', source: 'Siloam inscription, Istanbul Archaeology Museums.' },
    ],
  },

  {
    id: 'bc-7th',
    order: 10,
    era: 'The 7th century BC — the book found, and the reformation it caused',
    when: '700-601 BC. Pinned by Josiah’s eighteenth year (622 BC) and the fall of Nineveh (612 BC)',
    tier: 'synchronized',
    firsts: [
      'A lost Scripture RECOVERED, read aloud to a king, and obeyed at national scale (2 Kings 22:8-13; 23:1-3) — the first reformation in the record driven by a rediscovered text.',
      'A king tearing his clothes over what a book said rather than over what an army did.',
      'The first announcement that the covenant itself would be replaced by a better one — Jeremiah 31:31-34, a NEW covenant written on hearts rather than on stone.',
    ],
    whyNeeded: 'The book had been physically lost inside the temple while the temple kept running. Worship continued, staff were paid, sacrifices were offered, and no one had the text. That is the precise condition a rediscovery answers, and it is not rare.',
    usedThen: 'Idols burned, the high places broken, and a Passover kept such as had not been kept "from the days of the judges" (2 Kings 23:22).',
    usedNow: 'Every genuine reformation since has had this identical shape — the text recovered, read publicly, obeyed at cost: Nehemiah 8, the vernacular translations of the 14th-16th centuries, and every personal return that begins with someone actually reading it.',
    willBeUsed: 'Jeremiah’s new-covenant promise is quoted in full in Hebrews 8:8-12 as already inaugurated, and its final clause — "they shall all know me, from the least of them unto the greatest" — is not yet visibly complete.',
    ended: 'Judah’s last window closed. The reform was real and did not avert the judgment (2 Kings 23:26) — an honest and uncomfortable detail the record keeps rather than smooths.',
    provision: 'A king who was eight years old when he began to reign, prepared for a moment thirteen years before the book surfaced.',
    withoutProvision: 'The scroll surfaces during repairs and lands in front of the one king in that stretch disposed to act on it. Under his father or his grandfather it lands in front of men who had filled the temple with other gods.',
    withoutHim: 'A centralising monarch uses a conveniently discovered law-book to justify consolidating worship in the capital and stripping rival shrines — a standard reading in critical scholarship, and a genuinely plausible political account of the same events.',
    withHim: 'The same politics, with the king’s own reaction as the datum the political account has to absorb: he tore his clothes and said "great is the wrath of the LORD that is kindled against us" (2 Kings 22:13). A document forged to empower a king does not open by condemning him.',
    piece: 'The reform fails to save the nation and is recorded anyway. A propaganda text ends with the policy working. This one ends with 2 Kings 23:26 — "Notwithstanding the LORD turned not from the fierceness of his great wrath" — which is the last thing an invented justification would say.',
    ifNotThisCentury: 'Jeremiah’s new-covenant promise has to be on record BEFORE the exile, or the New Testament’s central claim looks like an improvisation after a failure. Given here, it is a stated intention with the old covenant still standing.',
    promises: [
      { promise: 'I will make a new covenant... I will put my law in their inward parts, and write it in their hearts', made: 'Jeremiah 31:31', alsoMade: ['Jeremiah 31:33', 'Jeremiah 31:34'], fulfilled: 'Hebrews 8:8', alsoFulfilled: ['Hebrews 8:10', 'Hebrews 10:16', 'Luke 22:20'], fulfilledIn: 'ad-first-century', status: 'fulfilled-not-yet-complete', note: 'The single most important promise for the century structure of this whole module: it announces, six centuries in advance, that the arrangement then running was temporary by design.' },
      { promise: 'Nineveh — an utter end shall he make of the place thereof', made: 'Nahum 1:8', alsoMade: ['Nahum 3:7'], fulfilled: 'bc-7th', fulfilledIn: 'bc-7th', status: 'fulfilled-in-history', note: 'Nineveh fell in 612 BC to a Babylonian and Median coalition and was so completely lost that its site was disputed until the 19th century AD. Fulfilment here is documented history, not a verse — and is labelled as such.' },
    ],
    anchors: ['2 Kings 22:8', '2 Kings 22:13', '2 Kings 23:3', '2 Kings 23:22', '2 Kings 23:26', 'Jeremiah 31:31', 'Jeremiah 31:33', 'Jeremiah 31:34', 'Nahum 1:8', 'Nahum 3:7', 'Hebrews 8:8', 'Hebrews 8:10', 'Hebrews 10:16', 'Luke 22:20'],
    history: [
      { event: 'The book of the law is found in the temple in Josiah’s eighteenth year.', date: '622 BC', source: '2 Kings 22:3-8, dated by the regnal count.' },
      { event: 'Nineveh falls to the Babylonian and Median coalition.', date: '612 BC', source: 'The Fall of Nineveh Chronicle (Babylonian Chronicle series), British Museum.' },
      { event: 'The Ketef Hinnom silver amulets carry the Aaronic blessing of Numbers 6:24-26 — the oldest known Scripture text on a physical object.', date: 'late 7th century BC', source: 'Ketef Hinnom scrolls, Israel Museum.' },
    ],
  },

  {
    id: 'bc-6th',
    order: 11,
    era: 'The 6th century BC — worship with no temple, no land, no sacrifice',
    when: '600-501 BC. Pinned by the fall of Jerusalem (587/586 BC), the fall of Babylon (539 BC), the decree of Cyrus (538 BC) and the second temple’s completion (516 BC)',
    tier: 'synchronized',
    firsts: [
      'Covenant life sustained with NO temple, NO land and NO sacrifice — and Yahweh Himself saying He would be the sanctuary in the meantime: "yet will I be to them as a little sanctuary in the countries where they shall come." (Ezekiel 11:16) A portable faith is invented here, by necessity and by promise.',
      'World history mapped in advance as a sequence of named empires (Daniel 2:36-45) — not a single oracle but a chain.',
      'Yahweh naming a pagan king, by name, as His instrument: "Cyrus, He is my shepherd" (Isaiah 44:28) and "his anointed" (Isaiah 45:1).',
      'A promise of a NEW HEART and a new spirit put inside people — the interior equipment to match the interior covenant Jeremiah had announced (Ezekiel 36:26-27).',
    ],
    whyNeeded: 'In 586 BC the temple burned. The unspoken theology that Yahweh was tied to a building and a plot of land had to die, or the faith would have died with the building. The exile is where that surgery happened.',
    usedThen: 'Daniel prayed toward a ruined city three times a day; the exiles gathered around the text; a remnant returned under Cyrus; the second temple was finished in 516 BC.',
    usedNow: 'This is the direct ancestor of every congregation that needs no address. Jesus states its full consequence: "the hour cometh, when ye shall neither in this mountain, nor yet at Jerusalem, worship the Father... they that worship him must worship him in spirit and in truth." (John 4:21,24)',
    willBeUsed: 'It ends where it was heading: "And I saw no temple therein: for the Lord God Almighty and the Lamb are the temple of it." (Revelation 21:22) The building was always the temporary arrangement.',
    ended: 'The first temple ended, the Davidic monarchy as a governing institution ended and has never been restored, and Judah’s independence ended for the rest of the biblical period.',
    provision: 'Seventy years named in advance with an end attached (Jeremiah 29:10-11); a letter telling the exiles to build houses, plant gardens and seek the peace of the city they were dragged to (Jeremiah 29:5-7); and four young men placed inside the administration of the empire that took them.',
    withoutProvision: 'Psalm 137:4 asks the question the century had to answer — "How shall we sing the LORD’s song in a strange land?" Without Ezekiel 11:16 the honest answer is that they could not, and the faith ends as one more deported cult.',
    withoutHim: 'A small state is destroyed by Babylon; its elite is deported; deprived of temple and sacrifice, the community reorganises around text, prayer and assembly — a documented and entirely explicable adaptation. Cyrus’s repatriation decree fits a known imperial policy: the Cyrus Cylinder describes returning displaced peoples and restoring their sanctuaries across the empire, and Judah was one case among many.',
    withHim: 'The same policy, with a name attached to it a century and a half early (Isaiah 44:28; 45:1) and a purpose stated: "that thou mayest know that I, the LORD, which call thee by thy name, am the God of Israel." (Isaiah 45:3)',
    piece: 'The theology that survives its own disproof. When a national god’s temple burns and his people are deported, the ancient world’s verdict is that the god lost. Israel’s prophets say the opposite before it happens and again afterwards: He was not defeated, He did it, and He named the term. That is not how a losing religion talks, and there is no parallel to it.',
    ifNotThisCentury: 'Without the exile there is no non-territorial worship, and therefore no framework for a Church that spreads across empires without a holy city. The 6th century BC is what makes the 1st century AD structurally possible.',
    promises: [
      { promise: 'After seventy years be accomplished at Babylon I will visit you, and perform my good word toward you, in causing you to return', made: 'Jeremiah 29:10', fulfilled: 'Ezra 1:1', alsoFulfilled: ['Daniel 9:2', '2 Chronicles 36:22'], fulfilledIn: 'bc-6th', status: 'fulfilled', note: 'A dated promise, kept inside the same century, and Ezra opens by saying so explicitly.' },
      { promise: 'A new heart also will I give you, and a new spirit will I put within you... and I will put my spirit within you', made: 'Ezekiel 36:26', alsoMade: ['Ezekiel 36:27'], fulfilled: 'Acts 2:4', alsoFulfilled: ['2 Corinthians 5:17', 'Romans 8:9'], fulfilledIn: 'ad-first-century', status: 'fulfilled', note: 'The interior equipment promised here is what arrives at Pentecost. Six centuries between the specification and the delivery.' },
      { promise: 'The God of heaven shall set up a kingdom, which shall never be destroyed', made: 'Daniel 2:44', fulfilled: 'Luke 1:33', alsoFulfilled: ['Hebrews 12:28'], fulfilledIn: 'ad-first-century', status: 'fulfilled-not-yet-consummated', note: 'Inaugurated in the first century; its visible form is still ahead.' },
    ],
    anchors: ['Ezekiel 11:16', 'Ezekiel 36:26', 'Ezekiel 36:27', 'Daniel 2:44', 'Daniel 9:2', 'Isaiah 44:28', 'Isaiah 45:1', 'Isaiah 45:3', 'Jeremiah 29:5', 'Jeremiah 29:7', 'Jeremiah 29:10', 'Jeremiah 29:11', 'Psalm 137:4', 'Ezra 1:1', '2 Chronicles 36:22', 'John 4:21', 'John 4:24', 'Revelation 21:22'],
    history: [
      { event: 'Jerusalem falls; the temple is burned and the population deported.', date: '587/586 BC', source: 'Babylonian Chronicle series; 2 Kings 25.' },
      { event: 'Babylon falls to Cyrus; his cylinder records the policy of returning deported peoples and restoring their sanctuaries.', date: '539 BC', source: 'Nabonidus Chronicle and the Cyrus Cylinder, British Museum.' },
      { event: 'Jehoiachin of Judah appears by name in Babylonian palace ration tablets, matching 2 Kings 25:27-30.', date: '≈592 BC', source: 'Jehoiachin ration tablets, Pergamon Museum.' },
      { event: 'The second temple is completed in the sixth year of Darius.', date: '516 BC', source: 'Ezra 6:15.' },
    ],
    possibilities: {
      question: 'When was the book of Daniel written?',
      plumbLine: 'The book presents itself as the work of a 6th-century exile serving under Babylonian and Persian rule, and Jesus refers to "Daniel the prophet" (Matthew 24:15).',
      views: [
        { view: 'Sixth century, as the book states', ties: 'Takes the book’s own claim, the Aramaic and Persian administrative vocabulary, and Christ’s reference at face value.' },
        { view: 'Second century, written during the Maccabean crisis', ties: 'Rests chiefly on the premise that detailed predictive prophecy does not occur, so precise foreknowledge of Hellenistic events must be after the fact.' },
      ],
      open: 'The two views differ less about evidence than about whether predictive prophecy is possible. That is a prior commitment, not a finding.',
      confidence: 'The house takes the book as it presents itself. Contested detail defers to the SME.',
    },
  },

  {
    id: 'bc-5th',
    order: 12,
    era: 'The 5th century BC — the Word read publicly and EXPLAINED',
    when: '500-401 BC. Pinned by Nehemiah’s commission in the twentieth year of Artaxerxes (445 BC)',
    tier: 'synchronized',
    firsts: [
      'Public exposition. Not reading only — reading with the sense given: "So they read in the book in the law of God distinctly, and gave the sense, and caused them to understand the reading." (Nehemiah 8:8) Every sermon, class and study since is running this pattern.',
      'A congregation of men, women, and "all that could hear with understanding" standing from morning until midday for the text (Nehemiah 8:2-3) — the first recorded all-age assembly around Scripture.',
      'Scripture applied by a governor to economic practice: debts cancelled, fields and houses restored, usury on brothers stopped (Nehemiah 5:1-12).',
    ],
    whyNeeded: 'A returned remnant that had grown up in exile could no longer follow the text unaided — the language and the customs had drifted. Reading it at them would have been a ceremony. It had to be made plain.',
    usedThen: 'The wall finished in fifty-two days; the feast of tabernacles kept as it had not been "since the days of Jeshua the son of Nun" (Nehemiah 8:17); the covenant renewed in writing.',
    usedNow: 'Nehemiah 8:8 is the job description of teaching: read distinctly, give the sense, cause the hearers to understand. A talk that skips any of the three is doing something else.',
    willBeUsed: 'The end state of this practice is Jeremiah 31:34’s clause — "they shall all know me" — where exposition finally becomes unnecessary.',
    ended: 'Prophecy ceased. Malachi closes the Hebrew canon and there is no acknowledged prophetic voice for roughly four hundred years — and the last words before the silence are a promise that Elijah would come before the great and dreadful day (Malachi 4:5-6).',
    provision: 'A Persian king’s letters, timber from the royal forest, and an escort (Nehemiah 2:7-9) — the empire underwriting the rebuilding of a city it had a strategic interest in keeping small.',
    withoutProvision: 'Nehemiah names the mechanism twice: "the good hand of my God upon me" (Nehemiah 2:8) and "The God of heaven, he will prosper us" (Nehemiah 2:20). Without the letters the work is illegal; with them the same opposition becomes noise.',
    withoutHim: 'A Persian imperial administrator is authorised to refortify a provincial centre, standardise its law code, and stabilise a border region toward Egypt — sound imperial policy, well attested elsewhere in the empire.',
    withHim: 'The same administration, with the prayer before the request (Nehemiah 1:4-11) and the four months between the news and the opening. The policy was Persian; the timing was asked for.',
    piece: 'The economic reversal in Nehemiah 5. A governor forgoing his own entitlement, cancelling debts owed to his own class, and restoring seized fields — because a text told him to — is not standard provincial administration in any empire, then or since.',
    ifNotThisCentury: 'The silence has to be a real silence, and it has to be recognised as one, or the voice that breaks it in Luke 1 carries no weight. Four centuries of nothing is what makes "There was a man sent from God, whose name was John." (John 1:6) land.',
    promises: [
      { promise: 'Behold, I will send you Elijah the prophet before the coming of the great and dreadful day of the LORD', made: 'Malachi 4:5', fulfilled: 'Matthew 11:14', alsoFulfilled: ['Luke 1:17', 'Matthew 17:12'], fulfilledIn: 'ad-first-century', status: 'fulfilled-in-part', note: 'Jesus identifies John the Baptist as this Elijah "if ye will receive it" — a fulfilment stated with a condition attached, and Revelation 11 keeps a further expectation open.' },
      { promise: 'The Lord, whom ye seek, shall suddenly come to his temple', made: 'Malachi 3:1', fulfilled: 'Mark 11:15', alsoFulfilled: ['Luke 2:27', 'Luke 2:46'], fulfilledIn: 'ad-first-century', status: 'fulfilled', note: 'The last book before the silence ends by promising the arrival that opens the next era.' },
    ],
    anchors: ['Nehemiah 1:4', 'Nehemiah 2:8', 'Nehemiah 2:20', 'Nehemiah 5:11', 'Nehemiah 8:2', 'Nehemiah 8:3', 'Nehemiah 8:8', 'Nehemiah 8:17', 'Malachi 3:1', 'Malachi 4:5', 'Malachi 4:6', 'John 1:6', 'Luke 1:17', 'Matthew 11:14'],
    history: [
      { event: 'Nehemiah is commissioned in the twentieth year of Artaxerxes I.', date: '445 BC', source: 'Nehemiah 2:1, dated against the Persian regnal record.' },
      { event: 'The Elephantine papyri show a Judean community in Egypt corresponding with Jerusalem authorities, naming officials known from Nehemiah.', date: '5th century BC', source: 'Elephantine Aramaic papyri.' },
    ],
  },

  {
    id: 'bc-4th-2nd',
    order: 13,
    era: 'The 4th to 2nd centuries BC — the silence, and the road being built',
    when: '400-101 BC. Documented by Greek and Hellenistic sources',
    tier: 'synchronized',
    firsts: [
      'The first TRANSLATION of Scripture into another language — the Septuagint, begun in Alexandria in the 3rd century BC. Until this, the Word existed in one tongue only.',
      'A four-hundred-year silence: no acknowledged prophetic word. New in the record, and it is itself an act — Amos had already named silence as a judgment, "a famine... of hearing the words of the LORD." (Amos 8:11)',
    ],
    whyNeeded: 'Nothing new was needed doctrinally; the deposit was complete for that stage. What was needed was infrastructure — a common language, a connected world, and a text portable into it.',
    usedThen: 'Greek-speaking Jews across the Mediterranean read Moses and the prophets in Greek. The Maccabean revolt (167-164 BC) preserved temple worship and the line.',
    usedNow: 'The apostles quote the Septuagint constantly, which is why some New Testament quotations differ slightly from the Hebrew — a textual fact best stated plainly rather than smoothed over. The vocabulary the New Testament writes in was forged here.',
    willBeUsed: 'Translation as an act continues directly out of this — every version since stands on the precedent that the Word can be carried into another tongue without ceasing to be itself.',
    ended: 'The prophetic voice was already ended and stayed ended for the whole period.',
    provision: 'A common tongue from Alexander’s conquests (332 BC onward), a Mediterranean world tied together, and then Roman roads and Roman peace laid over the top of it.',
    withoutProvision: 'Paul’s letters travel on those roads and are read in that language. Remove either and the first-century mission has no vehicle and no shared vocabulary.',
    withoutHim: 'Hellenisation follows conquest; a Ptolemaic library project commissions a Greek version of Jewish law for the Alexandrian collection and for a Greek-speaking Jewish population that needed it. Rome then absorbs the region. Ordinary imperial history.',
    withHim: 'The same three centuries, described afterwards in one clause: "when the fulness of the time was come, God sent forth his Son." (Galatians 4:4) A fulness is a preparation that has finished.',
    piece: 'The sequence, and the fact that no one was arranging it for this purpose. A Macedonian conquest supplies the language; a Ptolemaic library supplies the translation; a Roman empire supplies the roads, the peace and the citizenship that gets Paul to Rome. Three unrelated agendas, none of them Jewish, none of them Christian, converge into precisely the conditions a worldwide message required — and then the message arrives.',
    ifNotThisCentury: 'If the Septuagint comes AFTER the apostles instead of before them, the first generation has no Scripture in the empire’s language and the mission to the Greek-speaking world starts from nothing. The translation had to be finished before it was needed by people who did not commission it.',
    promises: [
      { promise: 'I will send a famine in the land, not a famine of bread... but of hearing the words of the LORD', made: 'Amos 8:11', fulfilled: 'bc-4th-2nd', fulfilledIn: 'bc-4th-2nd', status: 'fulfilled-in-history', note: 'Fulfilment here is the documented four-century absence of an acknowledged prophetic voice, not a verse — labelled as history, per the module’s own rule.' },
    ],
    anchors: ['Amos 8:11', 'Amos 8:12', 'Galatians 4:4', 'Galatians 4:5'],
    history: [
      { event: 'Alexander’s conquests establish Greek as the common language of the eastern Mediterranean.', date: 'from 332 BC', source: 'Hellenistic historical record.' },
      { event: 'The Septuagint translation of the Hebrew Scriptures into Greek is begun in Alexandria.', date: '3rd century BC', source: 'Letter of Aristeas; the manuscript tradition.' },
      { event: 'The Maccabean revolt restores temple worship after its desecration under Antiochus IV.', date: '167-164 BC', source: '1 and 2 Maccabees; Josephus, Antiquities XII.' },
      { event: 'Pompey brings Judea under Roman control.', date: '63 BC', source: 'Josephus, Antiquities XIV; Roman historical record.' },
    ],
  },

  // === TIER 3 — DOCUMENTED CENTURIES, AD. =================================
  {
    id: 'ad-first-century',
    order: 14,
    era: 'The 1st century AD — every remaining first, in one lifetime and one generation',
    when: 'AD 1-100. The crucifixion falls in AD 30 or AD 33 (both readings are held); the temple is destroyed in AD 70',
    tier: 'documented',
    firsts: [
      'Yahweh in a body. "And the Word was made flesh, and dwelt among us." (John 1:14) Not an appearance, not a visit — a birth, a childhood, a trade, a death certificate.',
      'One sacrifice, offered once, that does not need repeating: "this man, after he had offered one sacrifice for sins for ever, sat down." (Hebrews 10:12) The sitting is the point; no priest ever sat down.',
      'The veil torn from the top downward (Matthew 27:51) — the barrier opened from His side, at His initiative, in the direction no human hand tears.',
      'A man raised never to die again — "the firstfruits of them that slept" (1 Corinthians 15:20). Others had been raised and died later; this was new in kind.',
      'The Spirit poured out on ALL who believe, permanently, rather than resting on selected individuals for particular tasks: "he dwelleth with you, and shall be in you." (John 14:17)',
      'Gentiles brought in WITHOUT becoming Jews first — the middle wall of partition broken down (Ephesians 2:14) and settled publicly in council (Acts 15:8-11).',
      'A people of Yahweh with no geography, no capital and no shrine — the Church (Matthew 16:18; Ephesians 1:22-23).',
      'The finished deposit: "the faith which was once delivered unto the saints." (Jude 1:3) After this century the FIRSTS of revelation stop.',
    ],
    whyNeeded: 'Every prior arrangement had done its work and hit its limit. The blood of bulls and goats could not take away sins (Hebrews 10:4). The law could expose the fault and not fix it (Romans 3:20; 8:3). The priesthood died one man at a time (Hebrews 7:23). The covenant written on stone could be kept outwardly and broken inwardly — which is exactly why Jeremiah 31:33 had promised one written on hearts instead.',
    usedThen: 'Three years of public teaching, a public execution under a named governor, a resurrection with named witnesses, and a movement that reached Rome within thirty years.',
    usedNow: 'All of it, unchanged: the sacrifice is not repeated, the Spirit still indwells, the wall is still down, the Church still has no capital, and the canon is still closed.',
    willBeUsed: 'The return, the resurrection of the body, the judgment, and the dwelling made permanent (Acts 1:11; 1 Thessalonians 4:16-17; Revelation 21:3).',
    ended: 'A great deal ended, and stayed ended. The sacrificial system ceased with the temple in AD 70 and has not resumed in more than nineteen centuries. The Aaronic priesthood ceased to function. The genealogical records that could prove a priestly or Davidic claim were destroyed with the city — which means that if the claimant had not already come and been documented, the identification could never be made again.',
    provision: 'A Person, given before anyone asked: "God commendeth his love toward us, in that, while we were yet sinners, Christ died for us." (Romans 5:8) And then the Comforter, so the provision would not depend on His physical presence in one place (John 16:7).',
    withoutProvision: 'He states it flatly and without qualification: "without me ye can do nothing." (John 15:5) And Paul states the counterfactual on the resurrection with equal bluntness — "if Christ be not raised, your faith is vain; ye are yet in your sins." (1 Corinthians 15:17) The New Testament argues its own falsifiability.',
    withoutHim: 'A Galilean teacher gathers followers, is executed by Rome under Pontius Prefect of Judea, and his movement continues and spreads. Tacitus records the execution under Pilate in the reign of Tiberius and the movement’s spread to Rome; Josephus records the execution and the movement, and the death of James "the brother of Jesus who was called Christ"; Pliny the Younger describes Christians by AD 112 meeting before dawn and singing to Christ "as to a god"; Suetonius notes disturbances at Rome. The existence, execution and rapid spread are not in serious historical dispute.',
    withHim: 'The same execution, with the reason given in advance and the outcome announced in advance: "I lay down my life, that I might take it again" (John 10:17); "No man taketh it from me, but I lay it down of myself." (John 10:18)',
    piece: 'AD 70, and what it makes impossible. Within forty years of the Cross the temple burned, sacrifice stopped, and the genealogical archive was destroyed. The credentials Messiah had to have — the tribe, the house of David, the town — became permanently unverifiable for anyone arriving afterwards. Whatever a person concludes about the claim, the WINDOW is a documented historical fact: it opened, it was filled, and it closed, in one generation, and it has never reopened.',
    ifNotThisCentury: 'It could not have been any other century, and the record says so twice. Daniel 9:26 places the cutting off of Messiah the Prince BEFORE the destruction of the city and the sanctuary. Genesis 49:10 ties the sceptre to Judah "until Shiloh come" — Judea lost capital jurisdiction under direct Roman administration in this same window. The identification depended on institutions that were destroyed in AD 70.',
    promises: [
      { promise: 'I will pour out of my Spirit upon all flesh', made: 'Joel 2:28', fulfilled: 'Acts 2:16', alsoFulfilled: ['Acts 2:17', 'Acts 2:4'], fulfilledIn: 'ad-first-century', status: 'fulfilled', note: 'Peter identifies the fulfilment on the day itself: "this is that which was spoken by the prophet Joel."' },
      { promise: 'Upon this rock I will build my church; and the gates of hell shall not prevail against it', made: 'Matthew 16:18', fulfilled: 'ongoing', fulfilledIn: 'ongoing', status: 'kept-continuously', note: 'The only promise in this module whose fulfilment is measured in centuries rather than events — see the post-canon entries.' },
      { promise: 'There shall not be left here one stone upon another, that shall not be thrown down', made: 'Matthew 24:2', alsoMade: ['Luke 21:6'], fulfilled: 'ad-first-century', fulfilledIn: 'ad-first-century', status: 'fulfilled-in-history', note: 'Fulfilled in AD 70 and documented by Josephus, an eyewitness on the Roman side. Labelled as history, not as a verse.' },
      { promise: 'This same Jesus... shall so come in like manner as ye have seen him go', made: 'Acts 1:11', fulfilled: '', fulfilledIn: '', status: 'outstanding', note: 'The largest promise still open. Its date is deliberately withheld (Acts 1:7; Matthew 24:36), which is why no entry in this module carries an end-date.' },
    ],
    anchors: ['John 1:14', 'John 10:17', 'John 10:18', 'John 14:17', 'John 15:5', 'John 16:7', 'Hebrews 10:4', 'Hebrews 10:12', 'Hebrews 7:23', 'Matthew 27:51', 'Matthew 16:18', 'Matthew 24:2', 'Matthew 24:36', '1 Corinthians 15:17', '1 Corinthians 15:20', 'Ephesians 2:14', 'Acts 2:4', 'Acts 2:16', 'Acts 2:17', 'Acts 1:7', 'Acts 1:11', 'Jude 1:3', 'Romans 5:8', 'Romans 8:3', 'Joel 2:28', 'Daniel 9:26', 'Genesis 49:10', '1 Thessalonians 4:16', '1 Thessalonians 4:17'],
    history: [
      { event: 'Tacitus records that "Christus" was executed under Pontius Pilate during the reign of Tiberius, and that the movement reached Rome.', date: 'written ≈AD 116, of events in AD 30s-60s', source: 'Tacitus, Annals XV.44.' },
      { event: 'Josephus records the execution of Jesus and, separately, the death of James "the brother of Jesus who was called Christ".', date: 'written ≈AD 93', source: 'Josephus, Antiquities XVIII.63-64 and XX.200.' },
      { event: 'Pliny the Younger describes Christians in Bithynia meeting before dawn and singing to Christ "as to a god", and asks Trajan how to prosecute them.', date: '≈AD 112', source: 'Pliny, Letters X.96.' },
      { event: 'The temple is destroyed and sacrifice ceases; the genealogical archives are lost.', date: 'AD 70', source: 'Josephus, The Jewish War VI; the Arch of Titus.' },
    ],
    possibilities: {
      question: 'Was the crucifixion in AD 30 or AD 33?',
      plumbLine: 'Luke 3:1 dates the beginning of the ministry to the fifteenth year of Tiberius, and the gospels place the crucifixion at a Passover under Pilate, who governed AD 26-36. The century is certain; the year is not.',
      views: [
        { view: 'AD 30', ties: 'Fits an earlier reading of Tiberius’s fifteenth year and a shorter ministry reckoning.' },
        { view: 'AD 33', ties: 'Fits the Friday-Passover astronomy of that year and a later reading of the same regnal count.' },
      ],
      open: 'Nothing doctrinal turns on it. It is carried here because printing one year as settled would misstate the evidence.',
      confidence: 'High on the decade, unresolved on the year. Both are held.',
    },
  },

  // ---- After the canon: PROVIDENCE, never revelation (see CANON_FENCE) ----
  {
    id: 'ad-2nd-3rd',
    order: 15,
    era: 'The 2nd-3rd centuries AD — a faith that spread with nothing to spread it',
    when: 'AD 101-300',
    tier: 'documented',
    afterCanon: true,
    firsts: [
      'New in HISTORY, not in revelation: a religion spreading across an empire with no army, no state funding, no temple, no priestly caste and no homeland — and spreading fastest under active prosecution.',
      'The apostolic writings circulating as collections and being translated almost immediately into Old Latin, Syriac and Coptic — the Word going into other tongues within a generation of being written.',
      'The beginnings of textual scholarship: Origen’s Hexapla set six versions in parallel columns, the ancestor of every critical edition since.',
    ],
    whyNeeded: 'The eyewitnesses were dying and the message was outrunning them. What was needed was not new revelation but reliable transmission — accurate copies, honest translations, and a settled sense of which books were apostolic.',
    usedThen: 'Copied by hand, carried by ordinary travellers and traders, read aloud in houses.',
    usedNow: 'The manuscript base built in these centuries is why the New Testament text is recoverable at all. Papyrus 52, a fragment of John dated to the first half of the 2nd century, sits within a few decades of composition — a proximity no other ancient text approaches.',
    willBeUsed: 'Every future translation still works from this manuscript tradition.',
    ended: 'The living apostolic voice ended. From here the question is never "what is newly revealed" but "what was delivered, and is it copied faithfully".',
    provision: 'Preservation under conditions designed to destroy it: the Decian persecution of AD 250 and the Diocletianic persecution from AD 303 both specifically targeted Scriptures for burning, and the text survived both.',
    withoutProvision: 'The promise was already on record and is what these centuries test: "Heaven and earth shall pass away, but my words shall not pass away." (Matthew 24:35) A burned-books policy backed by an empire is the strongest available test of that sentence.',
    withoutHim: 'A minority movement with strong internal cohesion, care for its poor and sick, an attractive ethic, and a portable message spreads through the empire’s urban networks and trade routes. Sociologically explicable, and historians have explained it well.',
    withHim: 'The same spread, doing what was announced in advance: "ye shall be witnesses unto me... unto the uttermost part of the earth." (Acts 1:8) The sociology describes the mechanism; it does not account for the instruction preceding it.',
    piece: 'The direction of the incentive. Movements normally grow where belonging is rewarded. Here belonging cost property, standing and sometimes life for two and a half centuries, and the movement grew anyway — including among the people best placed to check the claims.',
    ifNotThisCentury: 'Had the text not been copied and translated widely BEFORE the empire turned friendly, a state-sponsored church would have inherited a small, controllable manuscript base. It inherited an uncontrollably wide one instead.',
    promises: [
      { promise: 'Heaven and earth shall pass away, but my words shall not pass away', made: 'Matthew 24:35', fulfilled: 'ongoing', fulfilledIn: 'ongoing', status: 'kept-continuously', note: 'Measured, not asserted: the New Testament survives in more than 5,800 Greek manuscripts, the earliest within decades of composition.' },
    ],
    anchors: ['Matthew 24:35', 'Acts 1:8', 'Isaiah 40:8', '1 Peter 1:25'],
    history: [
      { event: 'Papyrus 52, a fragment of John 18, is dated to the first half of the 2nd century.', date: '≈AD 125-175', source: 'Rylands Library Papyrus P52, Manchester.' },
      { event: 'The Decian persecution requires universal sacrifice with certificates; Christians who refuse are prosecuted.', date: 'AD 250', source: 'Roman libelli papyri; Cyprian, Letters.' },
      { event: 'The Diocletianic persecution orders the surrender and burning of Scriptures.', date: 'from AD 303', source: 'Eusebius, Ecclesiastical History VIII; Lactantius.' },
    ],
  },

  {
    id: 'ad-4th',
    order: 16,
    era: 'The 4th century AD — the canon listed, the creed confessed, the Word in the common tongue',
    when: 'AD 301-400',
    tier: 'documented',
    afterCanon: true,
    firsts: [
      'The twenty-seven books of the New Testament listed exactly as we have them, in Athanasius’s festal letter of AD 367 — a recognition of what the churches already used, not a committee creating a canon.',
      'A universal council settling how the Church would confess the Son’s full Deity, at Nicaea in AD 325.',
      'The Word translated into the working language of the whole western empire — Jerome’s Vulgate, from AD 382, translated from Hebrew rather than only from Greek.',
      'Complete Bibles as single bound volumes — Codex Sinaiticus and Codex Vaticanus.',
    ],
    whyNeeded: 'Two pressures at once. Circulating writings needed a public boundary between apostolic and merely ancient. And the Deity of the Son was being denied in a form articulate enough to require an articulate answer.',
    usedThen: 'Read publicly in a language ordinary people in the west actually spoke, copied at scale for the first time with imperial resources behind it, preached without fear of prosecution, and confessed in a form a congregation could say together.',
    usedNow: 'The canon list has not changed. The Nicene confession is still recited weekly by more people than any other Christian text except the Lord’s prayer.',
    willBeUsed: 'Both stand until sight replaces confession.',
    ended: 'Persecution by the Roman state ended with the Edict of Milan in AD 313 — and something else ended with it: the era in which no one joined for advantage. The record of these centuries is honest about the cost of that.',
    provision: 'A settled empire, imperial funding for copying, and freedom to assemble — after two and a half centuries of the opposite.',
    withoutProvision: 'The mixture that followed is a documented warning, not a slander: state alliance brought nominal adherence, coercion of dissenters, and wealth into a movement whose founder had none. Both the provision and its cost are stated here, because reporting only the first would be dishonest.',
    withoutHim: 'An emperor consolidates a fractured empire around a rising religion, funds it, and convenes its bishops to settle a dispute that threatened public order. Standard late-Roman statecraft.',
    withHim: 'The same politics, with the doctrinal outcome running AGAINST the politically convenient one. Constantine’s interest was unity, and the position that unity would have favoured — the vaguer, more accommodating formula — is the one the council rejected.',
    piece: 'The canon was not decided at Nicaea, and the popular story that it was is simply false. Nicaea addressed the Deity of the Son. The book lists come separately, from Athanasius in 367 and regional councils afterwards, and they ratify what congregations were already reading. The order of events is documented and runs opposite to the legend.',
    ifNotThisCentury: 'The Vulgate had to exist before the western empire collapsed. It became the text that carried Scripture through the next seven hundred years, in the one language that outlived the state that spoke it.',
    promises: [],
    anchors: ['Jude 1:3', 'John 1:1', 'John 20:28', 'Hebrews 1:8', 'Colossians 2:9', 'Isaiah 40:8'],
    history: [
      { event: 'The Edict of Milan grants toleration.', date: 'AD 313', source: 'Lactantius, On the Deaths of the Persecutors; Eusebius.' },
      { event: 'The Council of Nicaea confesses the Son as of one substance with the Father.', date: 'AD 325', source: 'Acts of the Council; Eusebius, Life of Constantine.' },
      { event: 'Athanasius’s 39th festal letter lists the twenty-seven New Testament books.', date: 'AD 367', source: 'Athanasius, Festal Letter 39.' },
      { event: 'Jerome begins the Vulgate, translating the Old Testament from the Hebrew.', date: 'from AD 382', source: 'Jerome, prefaces; Vulgate manuscript tradition.' },
    ],
  },

  {
    id: 'ad-5th-10th',
    order: 17,
    era: 'The 5th-10th centuries AD — the Word outlives the empire that carried it',
    when: 'AD 401-1000',
    tier: 'documented',
    afterCanon: true,
    firsts: [
      'New in history: the text survived the collapse of the civilisation that transmitted it. Rome fell; the copying did not stop.',
      'Mission INTO the collapse rather than away from it — Patrick to Ireland in the 5th century, and Irish monasteries copying and then re-exporting texts back into a Europe that had lost them.',
      'The Masoretic tradition fixing the Hebrew consonantal text with vowel points and a counting apparatus — scribes who literally counted letters to catch a copying error.',
    ],
    whyNeeded: 'Literacy, law, roads and cities were failing across the west. Without deliberate institutional copying the text would have been lost by ordinary attrition, the way most classical literature was.',
    usedThen: 'Copied in monastic scriptoria, read in Latin, preached in the vernacular where anyone could.',
    usedNow: 'The Leningrad Codex (AD 1008), the end product of the Masoretic discipline, is still the base text of most modern Old Testament translations.',
    willBeUsed: 'The same consonantal text these scribes fixed is still the base of the Old Testament in every serious modern translation, and will be for as long as translation continues — a copying discipline from the 7th to 10th centuries still underwriting a Bible printed this year.',
    ended: 'Widespread lay access ended for centuries. Scripture existed in a language most people could not read — a real loss, honestly named, and the pressure that produced the next entry.',
    provision: 'An institution — the monastery — that valued copying enough to spend a life on it, in centuries that valued little else that was not defensible.',
    withoutProvision: 'The comparison is measurable and it is stark. Most classical literature did not survive; we have perhaps a fraction of what Greece and Rome wrote, and much of that only because monastic copyists preserved it alongside the Scriptures they were actually there for.',
    withoutHim: 'A literate institution with a strong copying discipline preserves its own foundational texts through a period of collapse, as literate institutions tend to. Islam’s expansion and Europe’s fragmentation reshape the map.',
    withHim: 'The same institutions, fulfilling a sentence written twelve centuries earlier: "The grass withereth, the flower fadeth: but the word of our God shall stand for ever." (Isaiah 40:8) The empire is the grass in that image.',
    piece: 'The Dead Sea Scrolls settled this one in the 20th century. The great Isaiah scroll from Qumran is roughly a thousand years older than the previous oldest Hebrew manuscript, and it is substantially the same text. The copying discipline of these centuries was verified — after the fact, by an accident in a cave — and it held.',
    ifNotThisCentury: 'Had transmission failed here, the Reformation would have had nothing to reform back to. Every later recovery of Scripture is drawing on a chain that ran through these centuries.',
    promises: [
      { promise: 'The grass withereth, the flower fadeth: but the word of our God shall stand for ever', made: 'Isaiah 40:8', fulfilled: 'ongoing', fulfilledIn: 'ongoing', status: 'kept-continuously', note: 'Verified by the Qumran evidence: a thousand-year copying gap, substantially the same text.' },
    ],
    anchors: ['Isaiah 40:8', 'Psalm 119:89', 'Psalm 12:6', 'Psalm 12:7', '1 Peter 1:25'],
    history: [
      { event: 'Patrick’s mission to Ireland; Irish monasticism becomes a copying and missionary centre for western Europe.', date: '5th-7th centuries', source: 'Patrick, Confessio; the Irish manuscript tradition.' },
      { event: 'The Masoretes fix the Hebrew text with vocalisation and a statistical apparatus for catching scribal error.', date: '7th-10th centuries', source: 'Masoretic manuscript tradition; the Aleppo and Leningrad codices.' },
      { event: 'The Leningrad Codex is completed — still the base text of most modern Old Testament translations.', date: 'AD 1008', source: 'Codex Leningradensis B19A.' },
    ],
  },

  {
    id: 'ad-11th-15th',
    order: 18,
    era: 'The 11th-15th centuries AD — the vernacular demanded, and the press',
    when: 'AD 1001-1500',
    tier: 'documented',
    afterCanon: true,
    firsts: [
      'A complete English Bible — Wycliffe’s, from 1382, hand-copied from the Latin, and copied illegally for a century afterwards.',
      'Mass production of a text. Gutenberg’s press, and the first major book off it, in 1455, was the Bible. A book that had cost a scribe a year became a purchasable object.',
      'A printed Greek New Testament — Erasmus, 1516 — putting the original language back in front of scholars who had worked only from Latin for a thousand years.',
    ],
    whyNeeded: 'Access had failed. The text existed in a language ordinary people did not read, mediated entirely by a professional class. That is the same condition as the lost scroll of the 7th century BC, arrived at by a different road, and it produced the same reaction.',
    usedThen: 'Read aloud in kitchens and fields, at real risk. Wycliffe’s followers were prosecuted; Tyndale was strangled and burned in 1536.',
    usedNow: 'Everything downstream. Cheap printed Scripture is the ordinary condition of the modern world and it is roughly five hundred years old, not two thousand.',
    willBeUsed: 'Printing’s successor is the entry after next; the pattern of falling access cost has continued in every century since.',
    ended: 'The era in which Scripture could be effectively restricted ended. Once a text is set in movable type and dispersed in thousands of copies, it cannot be recalled.',
    provision: 'A technology invented for one purpose and immediately turned to another. Gutenberg was a goldsmith solving a metallurgical and mechanical problem; the Bible was simply the most valuable thing to print.',
    withoutProvision: 'Without the press, 1517 is a local academic dispute. The theses spread across Europe in weeks because printers copied them without asking. The message needed a medium that did not require permission.',
    withoutHim: 'A technological advance in metallurgy and mechanics enables cheap reproduction, which enables mass literacy, which enables religious and political upheaval. Standard media history, and it is correct as far as it goes.',
    withHim: 'The same technology, arriving sixty years before the moment it would matter most, in the one region where the coming dispute would ignite.',
    piece: 'The sequence and its tightness. The press in 1455, the Greek New Testament in 1516, the theses in 1517, the German New Testament in 1522, the English in 1526. Each of those requires the one before it, none of the inventors were working toward the last one, and the whole chain fits inside seventy years after a thousand years of nothing.',
    ifNotThisCentury: 'A press arriving after the Reformation instead of before it leaves a movement with no way to reach past the institutions it was contesting. Order is the entire point.',
    promises: [],
    anchors: ['Isaiah 55:11', 'Psalm 119:130', 'Romans 10:14', 'Romans 10:17', '2 Timothy 2:9'],
    history: [
      { event: 'The Wycliffe Bible — the first complete English Bible — is produced from the Latin Vulgate.', date: '1382', source: 'Wycliffite manuscript tradition.' },
      { event: 'Gutenberg prints the Bible with movable type.', date: '1455', source: 'The Gutenberg Bible; Mainz printing records.' },
      { event: 'Erasmus publishes a printed Greek New Testament with a Latin translation.', date: '1516', source: 'Novum Instrumentum omne, Basel.' },
    ],
  },

  {
    id: 'ad-16th-17th',
    order: 19,
    era: 'The 16th-17th centuries AD — the text in the plough-boy’s hands',
    when: 'AD 1501-1700',
    tier: 'documented',
    afterCanon: true,
    firsts: [
      'Scripture translated into the common tongue FROM THE ORIGINAL LANGUAGES rather than from Latin — Luther’s German New Testament in 1522 from Erasmus’s Greek, Tyndale’s English in 1526.',
      'Mass lay literacy driven by a religious text: people learning to read specifically in order to read the Bible themselves.',
      'A standard English Bible — the King James Version of 1611 — which then shaped the language it was written in for four centuries.',
    ],
    whyNeeded: 'The same condition as Josiah’s century and the same answer. The text was inaccessible; making it accessible was the whole of the work, and everything else followed from it.',
    usedThen: 'Read in homes, argued in universities, printed faster than it could be suppressed, and paid for in lives — Tyndale executed in 1536 for the translation, whose wording the KJV then carried forward substantially unchanged.',
    usedNow: 'The KJV remains the most widely distributed English book ever printed, and this repository quotes it as its verbatim standard.',
    willBeUsed: 'The principle established here — everyone gets the text in their own tongue — is the engine of the entire modern translation movement.',
    ended: 'The assumption that Scripture requires a professional intermediary ended, permanently, in the cultures the vernacular Bibles reached.',
    provision: 'A convergence: a printing industry already at scale, a recovered Greek text, translators willing to die, and — for the KJV — a king willing to fund fifty-four scholars for seven years.',
    withoutProvision: 'Tyndale’s recorded intention names the target precisely: that a boy driving a plough should know more of the Scripture than the learned clergy did. The counterfactual is simply the condition before him, which is documented and was the ordinary state of Europe for a thousand years.',
    withoutHim: 'Renaissance humanism recovers classical languages; the press distributes; political rivalries let reformers survive under sympathetic princes; nationalism favours vernacular religion. A complete and competent historical explanation.',
    withHim: 'The same forces, doing what Isaiah 55:11 says the Word does when it goes out — it does not return void. The historical mechanism and the stated intention are not competing accounts.',
    piece: 'What the translators were willing to trade. Tyndale had the training and the connections for a comfortable academic life, and he spent it in exile and died for putting a book into a language. Political and economic accounts of the Reformation are strong on the movement and weak on the individual bargain, which was uniformly terrible by every worldly measure.',
    ifNotThisCentury: 'The missionary movement of the next two centuries assumed as obvious that Scripture goes into every language. That assumption was manufactured here, at cost, and it did not exist before.',
    promises: [
      { promise: 'So shall my word be that goeth forth out of my mouth: it shall not return unto me void', made: 'Isaiah 55:11', fulfilled: 'ongoing', fulfilledIn: 'ongoing', status: 'kept-continuously', note: 'These two centuries are the clearest historical demonstration of the clause available.' },
    ],
    anchors: ['Isaiah 55:11', 'Romans 1:16', '2 Timothy 3:16', '2 Timothy 3:17', 'Psalm 119:105'],
    history: [
      { event: 'Luther posts the Ninety-Five Theses; printers copy and distribute them across Europe within weeks.', date: '1517', source: 'Contemporary printed editions; Wittenberg records.' },
      { event: 'Tyndale’s English New Testament, translated from Greek, is printed and smuggled into England.', date: '1526', source: 'Worms octavo edition, British Library.' },
      { event: 'Tyndale is executed; much of his wording passes into the King James Version.', date: '1536', source: 'Foxe, Acts and Monuments; comparative textual analysis.' },
      { event: 'The King James Version is published.', date: '1611', source: 'Robert Barker, London.' },
    ],
  },

  {
    id: 'ad-18th-19th',
    order: 20,
    era: 'The 18th-19th centuries AD — the gospel sent on purpose, everywhere',
    when: 'AD 1701-1900',
    tier: 'documented',
    afterCanon: true,
    firsts: [
      'Organised, sustained, cross-cultural mission as a standing enterprise rather than an occasional journey — William Carey to India in 1793 and the societies that followed.',
      'Bible translation as a global industrial undertaking. The British and Foreign Bible Society, founded in 1804, exists to put Scripture into every language it can reach, at cost or free.',
      'Scripture-driven abolition: a documented movement, explicitly argued from the text, ending the legal slave trade of the largest maritime empire of its day.',
    ],
    whyNeeded: 'Two thirds of the world had never heard, and the reason was structural — nobody was going, and the question Romans 10:14 asks ("how shall they hear without a preacher?") had no organisational answer.',
    usedThen: 'Carey translated or oversaw translation into dozens of Indian languages; Bible societies printed in hundreds; hospitals, schools and literacy programmes followed the missionaries as a matter of course.',
    usedNow: 'The literacy and written form of many languages date from this work — in numerous cases the first written form of a language was created by translators in order to render Scripture into it.',
    willBeUsed: 'The remaining languages are the direct continuation of this and are counted annually.',
    ended: 'The assumption that the gospel travels only where empire or trade happens to carry it ended. Going became deliberate.',
    provision: 'Ships, printing at scale, a common trade language, and — honestly stated — imperial infrastructure that missionaries used and frequently opposed.',
    withoutProvision: 'The record is mixed and must be reported as mixed. Missionaries went where empire had opened the road, and some carried its assumptions; others documented and fought its abuses, and the abolition campaign came out of the same movement. Reporting only one half would fail DR-0100 in either direction.',
    withoutHim: 'European expansion carries European religion along its trade and colonial routes; missionary societies are part of the cultural apparatus of empire. This reading is well documented and partly true.',
    withHim: 'The same routes, with a commission that predates every empire that used them by seventeen centuries: "Go ye therefore, and teach all nations." (Matthew 28:19)',
    piece: 'The people who kept going where empire had no interest. Carey’s own society was told there was no call; the East India Company obstructed missionaries as bad for business. The movement’s hardest-worked fields were frequently the least commercially useful ones, which the empire-apparatus reading has to work around.',
    ifNotThisCentury: 'Without the translation infrastructure built here, the 20th century’s acceleration has nothing to accelerate. The societies, the linguistic method and the training all date from this stretch.',
    promises: [
      { promise: 'Go ye therefore, and teach all nations... and, lo, I am with you alway, even unto the end of the world', made: 'Matthew 28:19', alsoMade: ['Matthew 28:20'], fulfilled: 'ongoing', fulfilledIn: 'ongoing', status: 'kept-continuously', note: 'The commission is first-century; these two centuries are when it was finally organised for.' },
    ],
    anchors: ['Matthew 28:19', 'Matthew 28:20', 'Romans 10:14', 'Romans 10:15', 'Acts 1:8', 'Galatians 3:28'],
    history: [
      { event: 'William Carey sails for India; the modern Protestant missionary movement begins in organised form.', date: '1793', source: 'Baptist Missionary Society records.' },
      { event: 'The British and Foreign Bible Society is founded to distribute Scripture without note or comment.', date: '1804', source: 'BFBS founding minutes.' },
      { event: 'The Slave Trade Act; the Slavery Abolition Act follows in 1833.', date: '1807', source: 'UK statute; parliamentary record of the abolition campaign.' },
    ],
  },

  {
    id: 'ad-20th',
    order: 21,
    era: 'The 20th century AD — the copying verified, and the map redrawn',
    when: 'AD 1901-2000',
    tier: 'documented',
    afterCanon: true,
    firsts: [
      'The transmission of the Hebrew text externally VERIFIED. The Dead Sea Scrolls, found from 1947, pushed the oldest Hebrew manuscripts back roughly a thousand years — and the great Isaiah scroll proved substantially identical to the text that had been copied forward.',
      'A Jewish state in the land, and Hebrew revived from a liturgical language into a spoken national one — the only documented case of a language returning from that condition.',
      'Translation on an industrial scale with linguistic method: Wycliffe Bible Translators from 1942, working systematically through unwritten languages.',
      'The centre of gravity of the faith moving to Africa, Asia and Latin America — and growing fastest where it was most costly, including under regimes that outlawed it.',
    ],
    whyNeeded: 'The 19th century had left two open questions: whether the text we hold matches the ancient text, and whether the remaining languages could be reached in any reasonable time. Both got answers in this century.',
    usedThen: 'Scrolls photographed and published; translation accelerated by air travel, recording and linguistics; radio crossing closed borders.',
    usedNow: 'The Qumran evidence sits under every serious claim about textual reliability. The translation pipeline built here is the one still running.',
    willBeUsed: 'The unreached remainder is the explicit target of the current work, and it is counted.',
    ended: 'The claim that the Old Testament text is a late medieval reconstruction ended as a serious position, on evidence rather than on assertion.',
    provision: 'A goat, a cave and a shepherd. The most significant manuscript find in the history of the Book was made by accident, by someone not looking for it, in the same decade the state was founded a few miles away.',
    withoutProvision: 'Before 1947 the oldest complete Hebrew manuscripts were medieval, and the transmission gap could only be argued. After 1947 it could be measured. The difference is the difference between a claim and a check.',
    withoutHim: 'Bedouin shepherds find jars in a cave; scholarship advances. Post-war geopolitics and the Holocaust produce a UN partition and a state. Decolonisation lets indigenous churches grow without foreign leadership. All correct, all sufficient as history.',
    withHim: 'The same events, and the Word’s own posture: He is not embarrassed by verification. "Prove all things; hold fast that which is good." (1 Thessalonians 5:21) A text afraid of an older manuscript would not survive one being found.',
    piece: 'The Isaiah scroll. A thousand extra years of copying, and the text a Christian reads in Isaiah 53 today is the text that was already sitting in a jar before the Cross. Whatever a person concludes about the passage, the accusation that it was retrofitted after the events cannot survive the physical evidence.',
    ifNotThisCentury: 'Verification had to arrive AFTER the copying was long finished, not during it — evidence produced by the party being examined proves nothing. It came from outside, by accident, at the end.',
    promises: [
      { promise: 'The words of the LORD are pure words... thou shalt preserve them from this generation for ever', made: 'Psalm 12:6', alsoMade: ['Psalm 12:7'], fulfilled: 'ongoing', fulfilledIn: 'ongoing', status: 'kept-continuously', note: 'The one promise in this module for which a physical, datable, external check exists.' },
    ],
    anchors: ['Psalm 12:6', 'Psalm 12:7', '1 Thessalonians 5:21', 'Isaiah 40:8', 'Matthew 24:14'],
    history: [
      { event: 'The Dead Sea Scrolls are discovered at Qumran; the great Isaiah scroll dates to roughly the 2nd century BC.', date: 'from 1947', source: 'Israel Antiquities Authority; the Shrine of the Book, Israel Museum.' },
      { event: 'The modern State of Israel is established; Hebrew functions as a spoken national language.', date: '1948', source: 'UN Resolution 181; Israeli state record.' },
      { event: 'Wycliffe Bible Translators is founded to work systematically through unwritten languages.', date: '1942', source: 'Wycliffe/SIL organisational record.' },
    ],
    possibilities: {
      question: 'What is the prophetic significance of 1948?',
      plumbLine: 'The historical facts are not in dispute: a state was established in 1948, and Hebrew was revived as a spoken language. That much is documented and is stated here as fact.',
      views: [
        { view: 'A direct fulfilment of restoration prophecy', ties: 'Reads Ezekiel 36-37 and Isaiah 11:11-12 as describing a literal, national regathering still future to their own time.' },
        { view: 'A significant historical event without direct prophetic identification', ties: 'Reads the restoration texts as fulfilled in the return from Babylon and/or in the Church, and declines to identify a modern political event as their fulfilment.' },
      ],
      open: 'Where believers genuinely differ, this module reports the documented history and does not assign the prophetic identification.',
      confidence: 'High on the history. Deferred to the SME on the prophecy — this is doctrine the house owns, not the model.',
    },
  },

  {
    id: 'ad-21st',
    order: 22,
    era: 'The 21st century AD — the last languages, and the oldest question',
    when: 'AD 2001-present',
    tier: 'documented',
    afterCanon: true,
    firsts: [
      'Scripture instantly available, free, in most major languages, to anyone with a phone — the lowest access cost in the whole history of the Book.',
      'Translation projects running concurrently in the majority of remaining languages, with a countable and shrinking remainder for the first time.',
      'A new form of the oldest problem: an information environment optimised for engagement rather than truth, in which the pressure is not scarcity of the Word but noise around it.',
    ],
    whyNeeded: 'The remaining languages are the hardest and smallest, and the modern condition is not lack of access but lack of attention. Both are addressed by the same thing: the text itself, read.',
    usedThen: 'This century is the one being lived, so "then" and "now" are the same column — which is itself the honest answer rather than a manufactured one. What can be said is what is documented: Scripture is being read, translated and distributed at the highest volume and lowest cost in its history, while the projects reaching the last languages are the hardest and slowest ones left.',
    usedNow: 'Read on screens, in prisons, in translation, in places where possession is still illegal.',
    willBeUsed: 'The stated terminus is explicit and is a completion condition, not a date: "this gospel of the kingdom shall be preached in all the world for a witness unto all nations; and then shall the end come." (Matthew 24:14) The end state is a picture: "of all nations, and kindreds, and people, and tongues" (Revelation 7:9) — the Babel division, healed.',
    ended: 'Nothing has ended in this century yet, which is the honest answer and the one this module gives rather than inventing one.',
    provision: 'The cheapest distribution in history, and a Church already indigenous in most of the world rather than dependent on senders.',
    withoutProvision: 'The current constraint is not distribution, and pretending otherwise would misdiagnose it. The Word is available to most of the people alive; the question is whether it is opened.',
    withoutHim: 'Digital distribution collapses the cost of publishing everything, Scripture included. Religion persists, grows in some regions, declines in others. Ordinary sociology of media and belief.',
    withHim: 'The same distribution, aimed at a stated completion. And the same invitation, unchanged since the garden: "Behold, I stand at the door, and knock: if any man hear my voice, and open the door, I will come in to him, and will sup with him, and he with me." (Revelation 3:20)',
    piece: 'The most quoted, most attacked, most distributed and most examined book in human history is also the cheapest and easiest to obtain that it has ever been — and it has survived every century in this list, including the ones spent trying to destroy it.',
    ifNotThisCentury: 'This is the century we are standing in, so the counterfactual is not historical but personal: the promises that remain open are open TO the reader, and the door in Revelation 3:20 opens from the inside.',
    promises: [
      { promise: 'This gospel of the kingdom shall be preached in all the world for a witness unto all nations; and then shall the end come', made: 'Matthew 24:14', fulfilled: '', fulfilledIn: '', status: 'in-progress', note: 'The only promise in this module whose progress is measurable in real time — and it is a condition, never a date.' },
      { promise: 'I will come again, and receive you unto myself', made: 'John 14:3', fulfilled: '', fulfilledIn: '', status: 'outstanding', note: 'Still open. Deliberately undated (Matthew 24:36; Acts 1:7).' },
      { promise: 'Behold, the tabernacle of God is with men, and he will dwell with them', made: 'Revelation 21:3', fulfilled: '', fulfilledIn: '', status: 'outstanding', note: 'The last promise in the Book is the first picture in it — Genesis 3:8, walking with them in the cool of the day. The whole list of centuries is the distance between those two verses.' },
    ],
    anchors: ['Matthew 24:14', 'Revelation 7:9', 'Revelation 3:20', 'John 14:3', 'Revelation 21:3', 'Genesis 3:8', 'Acts 1:7'],
    history: [
      { event: 'Scripture is available in whole or in part in the large majority of the world’s living languages, with active projects in most of the remainder.', date: '2001-present', source: 'Annual Scripture-access reporting by the United Bible Societies and Wycliffe Global Alliance.' },
    ],
  },
]);

// ---------------------------------------------------------------------------
// Helpers. Pure, so the tests can re-derive everything the surface shows.
// ---------------------------------------------------------------------------

/** Every distinct reference this module names — the verbatim gate reads this. */
export function allCenturyRefs() {
  const out = new Set();
  const add = (r) => { if (r && /\d/.test(r) && r.includes(':')) out.add(r); };
  NEEDED_MEANS.anchors.forEach(add);
  CANON_FENCE.anchors.forEach(add);
  DEDUCTION_DOCTRINE.anchors.forEach(add);
  THREADS.forEach((t) => t.anchors.forEach(add));
  for (const c of CENTURIES) {
    (c.anchors || []).forEach(add);
    for (const p of c.promises || []) {
      add(p.made); add(p.fulfilled);
      (p.alsoMade || []).forEach(add);
      (p.alsoFulfilled || []).forEach(add);
    }
  }
  return [...out];
}

/** Entries grouped by dating tier, order preserved. */
export function centuriesByTier() {
  const by = { 'word-clock': [], synchronized: [], documented: [] };
  for (const c of CENTURIES) if (by[c.tier]) by[c.tier].push(c);
  return by;
}

/** The promise ledger: every promise in the module, flattened, with the era it
 *  was made in and the era that kept it — so the DISTANCE is visible. */
export function promiseLedger() {
  const eraOf = (id) => (CENTURIES.find((c) => c.id === id) || {}).era || '';
  const rows = [];
  for (const c of CENTURIES) {
    for (const p of c.promises || []) {
      rows.push({
        ...p,
        madeIn: c.id,
        madeInEra: c.era,
        fulfilledInEra: p.fulfilledIn === 'ongoing' ? 'Running still' : eraOf(p.fulfilledIn),
        open: p.status === 'outstanding' || p.status === 'in-progress',
      });
    }
  }
  return rows;
}

/** Promises still open — what has NOT happened yet, stated as plainly as what has. */
export function openPromises() {
  return promiseLedger().filter((p) => p.open);
}

/** Entries that fall after the canon closed — providence, never revelation. */
export function afterCanonEntries() {
  return CENTURIES.filter((c) => c.afterCanon === true);
}

/** What ENDED, in order — the closing ledger beside the opening one. */
export function endedLedger() {
  return CENTURIES
    .filter((c) => c.ended && !/^Nothing/.test(c.ended))
    .map((c) => ({ id: c.id, era: c.era, when: c.when, ended: c.ended }));
}
