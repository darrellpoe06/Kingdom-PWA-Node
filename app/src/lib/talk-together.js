// =============================================================================
// talk-together — every lesson sends you to someone: parents to children,
// children to parents, friend to friend, until we all see Yahweh has been right
// =============================================================================
// Darrell, 2026-10-01, in order:
//   "Always prompt the parents to have the kids discuss this and vice versa
//    have the kids prompt the parents to have conversation about Yahweh... This
//    will help our families understand Truth better and make our ways
//    prosperous... also a lesson... why not... Word first!"
//   "Build that as a workflow so lessons follow that algorithm... I have seen
//    lessons do this, are all of them doing this to some degree?"
//   "Friends to each other just relationships to relationships so we can all
//    get healthy together... why not! We should be able to see Yahweh has been
//    right!!!!!"
//
// MEASURED FIRST (DR-0076), on the whole catalog, 2026-10-01: 593 lessons;
// 12 prompted parents toward their children, 18 prompted children toward
// their parents, 0 did both, 36 carried any family-talk language at all. So
// no: almost none did it, and none did it both ways. This module is the fix.
//
// THE RULE. Every lesson carries three prompts, in three directions:
//   parents  -> children   ask, then listen before you teach
//   children -> parents    ask what it means to them; tell one thing you saw
//   friend   -> friend     relationship to relationship, iron sharpening iron
// with the aim named: so we all get healthy together, until we see that
// Yahweh has been right. The Word says the Word is for talking about
// (Deuteronomy 6:7), turns the hearts of fathers and children toward each
// other (Malachi 4:6), sharpens friends on each other (Proverbs 27:17), and
// heals the ones who confess and pray one for another (James 5:16).
//
// A lesson's OWN prompts are used where it wrote them; where it did not, the
// standing prompts stand, built from the lesson's title and never claiming to
// be the lesson's words. The gate (talk-together-every-new-lesson.test.js and
// the NAS builder's band_gates.mjs) requires every NEW lesson to carry its own
// three, and the catalog's count of lessons that do never goes down.
// Pure: no DOM, no fetch.

export const TALK_TOGETHER_SINCE = '2026-10-01';

export const TALK_TOGETHER_AIM = 'So we all get healthy together, until we see that Yahweh has been right.';

/** Verses the surface quotes; a test pins each against the KJV corpus. */
export const TALK_TOGETHER_VERSES = [
  { ref: 'Deuteronomy 6:7', text: 'And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.' },
  { ref: 'Malachi 4:6', text: 'And he shall turn the heart of the fathers to the children, and the heart of the children to their fathers, lest I come and smite the earth with a curse.' },
  { ref: 'Proverbs 27:17', text: 'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.' },
  { ref: 'James 5:16', text: 'Confess your faults one to another, and pray one for another, that ye may be healed. The effectual fervent prayer of a righteous man availeth much.' },
  { ref: 'James 1:19', text: 'Wherefore, my beloved brethren, let every man be swift to hear, slow to speak, slow to wrath:' },
  { ref: 'Proverbs 20:5', text: 'Counsel in the heart of man is like deep water; but a man of understanding will draw it out.' },
  { ref: 'Luke 2:52', text: 'And Jesus increased in wisdom and stature, and in favour with God and man.' },
  { ref: 'Hebrews 5:14', text: 'But strong meat belongeth to them that are of full age, even those who by reason of use have their senses exercised to discern both good and evil.' },
];

// THE METHOD (Darrell 2026-10-01: "Make sure the context of each lesson is done
// well considered as qualitative and effective quantitative methods and
// strategies and skills to enhance their development... Our human development
// based on the Word's perspectives"). The Word's own frame of a person growing
// is Luke 2:52, wisdom, stature, favour with Yahweh and with people, and its
// own method is daily, repeated talk (Deuteronomy 6:7: sitting, walking, lying
// down, rising up), swift hearing before speaking (James 1:19), drawing out
// what is in the other heart (Proverbs 20:5), and senses exercised by use
// (Hebrews 5:14). So every prompt carries the skill and the rhythm:
//   the skill    ASK one open question -> LISTEN to the end -> have them RETELL
//                it in their own words -> TEACH one verse back
//   the rhythm   once today, in one of the four places of Deuteronomy 6:7;
//                one friend this week
export const TALK_TOGETHER_METHOD = {
  skill: 'Ask one open question, listen to the end, have them retell it in their own words, then teach one verse back.',
  rhythm: 'Once today, in one of the four places of Deuteronomy 6:7: at the table, on the way, at bedtime, or first thing. One friend this week.',
  growth: 'The Word\'s measure of growing is Luke 2:52: wisdom, stature, and favour with Yahweh and with people.',
};

// The three directions, found in a lesson's own words. A sentence counts for a
// direction when it addresses the one side toward the other.
const PARENTS_TO_CHILDREN = /\b(parents?|mom|dad|mother|father|grown-?ups?|guardians?)\b[^.!?]{0,90}\b(ask|talk|discuss|read|share|sit|teach|listen)\b[^.!?]{0,80}\b(child|children|kids?|son|daughter|young|family)\b/i;
const CHILDREN_TO_PARENTS = /\b(ask|tell|talk (?:to|with)|share with|read (?:this |it )?(?:to|with)|discuss (?:this |it )?with|show)\b[^.!?]{0,50}\b(?:your|a) (?:parents?|mom|dad|mother|father|grown-?up|grandparents?|grandma|grandpa|family)\b/i;
const FRIEND_TO_FRIEND = /\b(friends?|one another|each other|a brother or sister|someone you trust|relationship to relationship)\b[^.!?]{0,90}\b(ask|tell|talk|discuss|share|sharpen|pray|listen|read)\b|\b(ask|tell|talk (?:to|with)|share with|pray with|read (?:this |it )?with)\b[^.!?]{0,40}\b(?:a|your) (?:friend|brother or sister in Christ|neighbou?r)\b/i;

const sentencesOf = (text) => String(text || '').split(/(?<=[.!?])\s+/);

function firstSentence(texts, re) {
  for (const t of texts) {
    for (const s of sentencesOf(t)) if (re.test(s)) return s.trim();
  }
  return '';
}

/** The lesson's own words in each direction (empty where it has none). */
export function ownPrompts(module) {
  const m = module || {};
  const adult = [m.lesson, m.bigIdea, m.inApp, ...((m.facilitator && m.facilitator.talkingPoints) || []), ...(m.benefits || [])].filter((x) => typeof x === 'string');
  const levels = m.levels || {};
  const young = ['child', 'youth', 'teen'].map((b) => levels[b]).filter((x) => typeof x === 'string');
  const all = [...adult, ...young, levels.senior].filter((x) => typeof x === 'string');
  return {
    parents: firstSentence([...adult, levels.senior].filter(Boolean), PARENTS_TO_CHILDREN),
    children: firstSentence(young.length ? young : all, CHILDREN_TO_PARENTS),
    friends: firstSentence(all, FRIEND_TO_FRIEND),
  };
}

export function hasAllThree(module) {
  const o = ownPrompts(module);
  return !!(o.parents && o.children && o.friends);
}

/** The three prompts a lesson card shows. `own` marks the lesson's own words. */
export function talkTogetherFor(module) {
  const m = module || {};
  const title = String(m.title || 'this lesson').replace(/\s+—.*$/, '').trim();
  const own = ownPrompts(m);
  return {
    aim: TALK_TOGETHER_AIM,
    prompts: [
      { to: 'Parents', text: own.parents || `Ask your child one open question about what ${title} shows about Yahweh. Listen to the end before you teach, then teach one verse back. Once today: at the table, on the way, at bedtime, or first thing.`, own: !!own.parents },
      { to: 'Children', text: own.children || `Ask your mom, dad or grandparent what ${title} means to them, and listen all the way through. Then tell them one thing you saw, in your own words.`, own: !!own.children },
      { to: 'Friends', text: own.friends || `Tell one friend this week one thing ${title} showed you, ask what they see, and pray one for another. Iron sharpens iron.`, own: !!own.friends },
    ],
    method: TALK_TOGETHER_METHOD,
    verse: TALK_TOGETHER_VERSES[0],
    allOwn: !!(own.parents && own.children && own.friends),
  };
}

/** Coverage across a catalog: how many lessons carry their own prompts. */
export function talkTogetherCoverage(modules = []) {
  let parents = 0; let children = 0; let friends = 0; let all = 0; let any = 0;
  for (const m of modules) {
    const o = ownPrompts(m);
    if (o.parents) parents += 1;
    if (o.children) children += 1;
    if (o.friends) friends += 1;
    if (o.parents && o.children && o.friends) all += 1;
    if (o.parents || o.children || o.friends) any += 1;
  }
  return { lessons: modules.length, parents, children, friends, all, any };
}

/** A lesson added on or after the rule's day must carry its own three. */
export function mustCarryOwn(added, since = TALK_TOGETHER_SINCE) {
  return typeof added === 'string' && added >= since;
}
