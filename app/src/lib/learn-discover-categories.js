// =============================================================================
// learn-discover-categories — the everyday needs people come to Learn with,
// shelved over the curriculum WITHOUT moving anything in it
// =============================================================================
// A discovery category is a lens, never a home. A lesson keeps its one course,
// its one department, its title and its place; a category only points at it,
// the way learn-crosslist.js does for the A.I. department. One lesson may sit
// under several categories because one lesson often answers several needs.
//
// Membership is DERIVED from the same index the search reads, by three
// declared rules, and a category is only shown if the curriculum actually fills
// it (MIN_SHOWN). Nothing here is a hand-kept list of lesson ids, so a lesson
// added tomorrow is found by the same rules:
//   courses — every lesson of a course whose subject IS the need;
//   ids     — lessons a person hand-picked for the need (the Relationships shelf);
//   terms   — a lesson whose title, theme, big idea or promotional text carries
//             at least `minHits` of the category's words (or `bodyHits` of them
//             among its most distinctive body words);
//   core    — the words that ARE the subject: one in a title or theme, or three different ones in the body, qualifies;
//   not     — courses that merely share a word and are not about the need.
// Pure data + one pure function; unit-tested on the real catalog.
// =============================================================================
import { stems } from './learn-discover-text.js';
import { RELATIONSHIP_LESSONS } from './learn-presentation/presentation.js';

export const MIN_SHOWN = 12;
// A lesson is STRONGLY in a category when its course is the category's own, or its title/theme/description
// carry at least two of the category's words (a body-only match is membership, but not strong).
export const STRONG = 6;

const T = (s) => [...new Set(stems(s))];

export const CATEGORIES = [
  { id: 'faith', label: 'Faith & Spiritual Growth', blurb: 'Draw near to Yahweh and walk it out daily.',
    courses: ['who-he-is'],
    terms: T('faith pray prayer worship spirit holy trust obey obedience walk devotion presence hear voice abide seek fellowship fast praise grace salvation repent'), minHits: 2, bodyHits: 12 },
  { id: 'marriage', label: 'Marriage & Relationships', blurb: 'Covenant, love and the people closest to you.',
    // The shelf Darrell and his wife hand-picked as "relationships in one place" is the strongest evidence there is.
    ids: RELATIONSHIP_LESSONS,
    courses: [], core: T('marriage husband wife spouse wedding bride bridegroom divorce'), terms: T('marriage husband wife spouse wedding couple dating bride bridegroom divorce covenant romance friend friendship relationship neighbour forgive forgiveness reconcile'), minHits: 2, bodyHits: 12 },
  { id: 'parenting', label: 'Parenting & Family', blurb: 'Raise children in the way they should go.',
    courses: ['little-learners'], terms: T('child children parent mother family household daughter teen youth train discipline grandchildren heir inheritance legacy nurture'), minHits: 2, bodyHits: 12 },
  { id: 'wellness', label: 'Mental & Emotional Wellness', blurb: 'Peace for your mind, rest for your body.',
    courses: ['healthy-living', 'made-in-time'], terms: T('stress anxiety anxious worry fear peace rest sleep tired burnout mind thought emotion feeling grief comfort anger patience heal health body depress lonely hope'), minHits: 2, bodyHits: 12 },
  { id: 'purpose', label: 'Purpose & Personal Growth', blurb: 'Find your calling and grow into it.',
    courses: [], terms: T('purpose calling called gift talent vision mission goal habit discipline character wisdom growth diligent excellence potential destiny identity'), minHits: 2, bodyHits: 12 },
  { id: 'money', label: 'Money & Financial Stewardship', blurb: 'Debt, saving, giving and building to last.',
    courses: ['banking', 'stocks', 'bonds', 'investing', 'kingdom-economics', 'legacy-provisions', 'handed-forward', 'world-market', 'financing-debt', 'taxes-records'],
    terms: T('money debt loan credit save saving budget tithe giving wealth riches steward stewardship invest income interest wage poor poverty price cost'), minHits: 2, bodyHits: 12 },
  { id: 'business', label: 'Business & Entrepreneurship', blurb: 'Build work and enterprise that honours Yahweh.',
    courses: ['rent-to-own-business', 'business-research-wars', 'project-management', 'partnerships'],
    terms: T('business entrepreneur customer profit market employer employee career company enterprise product sell negotiate contract partner wage work labour'), minHits: 2, bodyHits: 12 },
  { id: 'realestate', label: 'Real Estate & Homeownership', blurb: 'Buy, rent, repair and keep a home.',
    courses: ['buying-terms', 'leasing-tenants', 'maintenance-trades', 'appraisal', 'inspections', 'evictions', 'insurance-risk', 'property-principle', 'management-stewardship', 'financing-debt', 'taxes-records', 'partnerships'],
    terms: T('home house property mortgage landlord tenant rent lease land field deed title buy purchase appraisal inspection'), minHits: 3, bodyHits: 14 },
  { id: 'leadership', label: 'Leadership & Ministry', blurb: 'Lead, serve and shepherd well.',
    courses: ['church-offices', 'word-out', 'sound-board', 'broadcast'],
    terms: T('lead leader leadership shepherd serve servant pastor elder overseer deacon minister ministry team authority office church flock example humble'), minHits: 2, bodyHits: 12 },
  { id: 'bible', label: 'Bible Study & Scripture', blurb: 'Read the Word book by book.',
    courses: ['eternal-torah', 'eternal-wisdom', 'eternal-prophets', 'eternal-gospels', 'eternal-epistles', 'eternal-revelation', 'prophetic-voices'],
    terms: T('scripture verse genesis exodus psalm proverbs isaiah gospel epistle revelation prophet covenant parable commandment torah study meditate memorize'), minHits: 3, bodyHits: 12 },
  { id: 'history', label: 'History & Understanding Our World', blurb: 'The truth of the past, and the world as it is.',
    courses: ['history-truth', 'historical-research-1619', 'car-research-who-invented-the-car', 'world-issues', 'prophetic-voices', 'world-market'],
    terms: T('history historical america american slavery heritage ancestor nation empire civil rights culture news world government election war truth record'), minHits: 2, bodyHits: 12 },
  { id: 'tech', label: 'Technology, AI & Innovation', blurb: 'Use the tools wisely, build what lasts.',
    courses: ['ai', 'sovereign-ai', 'ai-legal-blueprint', 'datasystems', 'development', 'software-project-management', 'infrastructure', 'mathematics'],
    terms: T('technology artificial intelligence chatbot model algorithm software code data digital computer network app internet innovation privacy security machine'), minHits: 2, bodyHits: 12 },
];

/**
 * Which lessons sit under each category.
 * @param P  the prepared index from learn-discover-search.js prepareIndex()
 * @returns {Map<string, { lessonIds: string[], viaCourse: number, viaWords: number }>}
 */
export function categoryMembers(P) {
  const out = new Map();
  for (const cat of CATEGORIES) {
    const home = new Set(cat.courses);
    const picked = new Set(cat.ids || []);
    const terms = new Set(cat.terms);
    const rows = [];
    let viaCourse = 0;
    let viaWords = 0;
    for (const L of P.lessons) {
      if (picked.has(L.raw.i)) { rows.push([L.raw.i, 100, L.order]); viaCourse += 1; continue; }
      if (home.has(L.course.k)) { rows.push([L.raw.i, 100, L.order]); viaCourse += 1; continue; }
      let head = 0;
      for (const t of terms) if (L.titleSet.has(t) || L.metaSet.has(t)) head += 1;
      let body = 0;
      for (const t of terms) if (L.bodySet.has(t)) body += 1;
      let core = false;
      if (cat.core) {
        let coreBody = 0;
        for (const t of cat.core) { if (L.titleSet.has(t) || L.metaSet.has(t)) core = true; if (L.bodySet.has(t)) coreBody += 1; }
        if (coreBody >= 3) core = true;
      }
      if (core || head >= cat.minHits || body >= cat.bodyHits) { rows.push([L.raw.i, head * 3 + body + (core ? 5 : 0), L.order]); viaWords += 1; }
    }
    // Strongest first (a course's own lessons count as the strongest), catalog order breaks ties.
    rows.sort((a, b) => (b[1] - a[1]) || (a[2] - b[2]));
    out.set(cat.id, { lessonIds: rows.map((r) => r[0]), viaCourse, viaWords, strong: new Set(rows.filter((r) => r[1] >= STRONG).map((r) => r[0])) });
  }
  return out;
}
