// =============================================================================
// Talk about it together — every Prophetic Voices message lesson sends the
// reader to someone (DR-0733 / DR-0795): parents to children, children to
// parents, friend to friend, in EVERY band a reader meets.
// =============================================================================
// One question and one shared step per lesson, drawn from that teacher's own
// message, so the prompt is the lesson's and not a stock line. The wording of
// each direction is fitted to the band (a child asks a mom or dad; a senior
// sits with grandchildren). Applied in prophetic-voices.js to the lessons
// listed here; a lesson not listed is left exactly as written.
// =============================================================================

const TALK = {
  'pv-unseen-realm-seen': [
    'where they have seen something called justice that kept justice and righteousness apart, and how the Word shows the truth',
    'read one verse aloud to each other that someone once tried to keep quiet',
  ],
  'pv-munroe': ['what Dr. Munroe meant by the Kingdom, not a religion', 'name one thing in your week that belongs to the King'],
  'pv-munroe-kingdom-not-religion': [
    'what the difference is between going to church and living under the King',
    'tell each other one habit that is only religion and one that is the Kingdom',
  ],
  'pv-munroe-how-a-kingdom-works': [
    'who the King is in your home, and what His laws ask of you this week',
    'share one law of the King you will keep this week',
  ],
  'pv-munroe-colony-of-heaven': [
    'what it means that the earth is a colony of Heaven, and what a governor once took from the Bahamas',
    'name one way your street could look more like Heaven',
  ],
  'pv-munroe-the-governor': ['how the Holy Spirit leads you the way a governor leads a colony', 'pray together for His leading in one decision this week'],
  'pv-munroe-forest-in-a-seed': [
    'what forest Yahweh may have put in their seed',
    'tell each other one gift you see in the other that the graveyard must not get',
  ],
  'pv-munroe-the-source': ['what it means to stay attached to the Source, like a branch to the vine', 'share one way you will stay close to Yahweh this week'],
  'pv-munroe-die-empty': ['what work Yahweh gave them that they have not started yet', 'tell each other one gift you will use up for Him this month'],
  'pv-munroe-purpose': ['why they think Yahweh made them, and what that means for today', 'tell each other one priority you will put first this week'],
  'pv-munroe-burden-of-freedom': ['what it means to be delivered but not yet free', 'share one old chain you are ready to lay down'],
  'pv-munroe-authority': ['who gave them their authority, and how to use it to serve', 'tell each other one place you will serve rather than rule'],
  'pv-munroe-overcoming-crisis': [
    'how Joseph managed in the crisis, and what that teaches for theirs',
    'share one thing in your care you will manage better this week',
  ],
  'pv-munroe-praise-and-worship': ['what Yahweh has done that is worth bragging about', 'praise Him together for one thing He did this week'],
  'pv-diop-african-origin': [
    'what Dr. Diop showed about where Egypt’s civilization came from, and why the record was hidden',
    'tell each other one true thing about our history you learned here',
  ],
  'pv-diop-unesco-chapter': [
    'what evidence Dr. Diop laid before the world, and what the editor’s own note admitted',
    'share one piece of evidence that stayed with you',
  ],
  'pv-diop-cairo-1974': [
    'what the Cairo report itself said, and why a record that tells on itself matters',
    'tell each other one place you will check the record for yourselves',
  ],
  'pv-diop-two-cradles': [
    'what Dr. Diop said about the two cradles, and what the Word says about honouring father and mother',
    'share one way your family honours both mothers and fathers',
  ],
  'pv-diop-precolonial-africa': [
    'what Africa was like before the colonizers came, and how it was organized',
    'tell each other one kingdom or city you want to learn more about',
  ],
  'pv-obenga-sound-laws': [
    'how a family of languages can be proved by rules, not by look-alike words',
    'share one word your family says that carries its history',
  ],
  'pv-obenga-large-measure': [
    'what the Cairo record agreed on, and why an honest record helps everyone',
    'tell each other one thing you will say carefully and truthfully',
  ],
  'pv-obenga-negro-egyptian': [
    'what Dr. Obenga built after Cairo, and how to weigh a claim that is still argued',
    'share one question you want to keep studying together',
  ],
  'pv-williams-lost-their-history': [
    'what Dr. Williams meant when he asked how a people lost their history',
    'tell each other one story from your family that must not be lost',
  ],
  'pv-williams-ethiopias-oldest-daughter': [
    'what Dr. Williams taught about Egypt and Ethiopia, and what the Word says of Ethiopia',
    'share one verse about Ethiopia you found in the Word',
  ],
  'pv-williams-the-enemy-within': [
    'why Dr. Williams named disunity the principal enemy within',
    'tell each other one way you will keep unity in your home or church',
  ],
  'pv-williams-master-plan': [
    'what Dr. Williams’ Master Plan asked of a scattered people, and how the Word answers bitterness with love',
    'share one way you will work together for the good of others this month',
  ],
};

const strip = (s) => s.replace(/[.!?]$/, '');

/** The closing paragraph for one band, in that reader's own register. */
export function talkParagraph(band, q, act) {
  const Q = strip(q);
  const A = strip(act);
  if (band === 'child') {
    return `TALK ABOUT IT TOGETHER. Ask your mom or dad ${Q}. Parents, ask your children to tell you the lesson in their own words, and listen to the end. Friends, talk it over and ${A}.`;
  }
  if (band === 'senior') {
    return `TALK ABOUT IT TOGETHER. Sit with your grandchildren and ask your grandchildren ${Q}; listen before you teach. Tell your family what it stirred in you. Friends, talk it over and ${A}.`;
  }
  if (band === 'youth' || band === 'teen') {
    return `TALK ABOUT IT TOGETHER. Ask your parents or a grandparent ${Q}. Parents, ask your children what they heard, and listen to the end before you teach. Friends, talk it over and ${A}.`;
  }
  return `TALK ABOUT IT TOGETHER. Parents, ask your children ${Q}, and listen to the end before you teach. Children, ask your parents or a grandparent what they remember. Friends, talk it over and ${A}.`;
}

/** The module with its talk-together close in the lesson and every band (unchanged when not listed). */
export function withTalkTogether(m) {
  const t = TALK[m.id];
  if (!t) return m;
  const [q, act] = t;
  const levels = Object.fromEntries(Object.entries(m.levels || {}).map(([b, text]) => [b, `${text}\n\n${talkParagraph(b, q, act)}`]));
  return { ...m, lesson: `${m.lesson}\n\n${talkParagraph('adult', q, act)}`, levels };
}

export const PV_TALK_TOGETHER_IDS = Object.keys(TALK);
