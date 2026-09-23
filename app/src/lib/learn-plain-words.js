// =============================================================================
// PLAIN WORDS — the simple word beside the title, never instead of it (DR-0519)
// =============================================================================
// Darrell 2026-09-19, in three messages that only make sense together:
//
//   "Even courses on Money... course titles pulls people into the lessons and
//    courses... so kids and adults can learn however we need to use terms they
//    already understand so words that are to big or not usually used will not
//    be understood unless we also use them in context and also use words that
//    are in the current vocabulary..."
//   "Not saying don't use the same words we are just thinking about broad
//    connections made by simple word choices..."
//   "I like the current titles they pull me in..."
//
// The first message reads like a request to rename things. The second and third
// correct that: the titles STAY. What was missing is the everyday word ALONGSIDE
// the title, so that a reader thinking the word they already own — money, debt,
// sleep, rent, sound, jobs — arrives at the course that teaches it.
//
// "Kingdom Economics: Stewardship, Ownership & the Body's Economic Witness" is
// a title that pulls him in and contains no word a child would search for. Both
// facts are true at once, and the fix is additive.
//
// TWO JOBS, ONE DECLARATION:
//   1. CONNECTION. These words are folded into the lesson search index for
//      every lesson of the course (learn-organize.js buildLessonIndex), so
//      typing "money" finds Kingdom Economics lessons even though neither the
//      lesson titles nor the course title contain the word.
//   2. VOCABULARY. They render under the open course as a plain line, which is
//      the house term meeting the everyday term in the same glance — which is
//      exactly how the bigger word gets learned in context rather than looked
//      up.
//
// THE RULE EVERY ROW OBEYS, and the gate enforces (course-plain-words.test.js):
//   - at least THREE words, each drawn from EVERYDAY_WORDS below;
//   - at least ONE of them appears nowhere in the course's own title, because a
//     row that only echoes the title adds no connection at all;
//   - lowercase, single words or two-word everyday pairs, no house vocabulary.
//
// EVERYDAY_WORDS is a DECLARED list, not a measured one, and it is kept plain
// on purpose: a word belongs here when a ten-year-old would use it without
// being taught it. Adding a word is a normal edit; adding a word that needs
// explaining is the thing this file exists to prevent.

export const EVERYDAY_WORDS = new Set([
  // money and trade
  'money', 'cash', 'debt', 'loan', 'borrow', 'lending', 'interest', 'bank', 'banking',
  'saving', 'spending', 'giving', 'budget', 'price', 'cost', 'pay', 'paying', 'income',
  'taxes', 'bills', 'fees', 'receipts', 'records', 'buying', 'selling', 'owning', 'business',
  'profit', 'wages', 'deal', 'contract', 'partners', 'inheritance', 'will',
  // added 2026-09-19 with the Stock Market department: the words a person
  // actually types when they have heard the market went up and do not know
  // what that sentence meant. 'pension' and 'retirement' are here because a
  // great many people meet shares for the first time through an account they
  // have never opened.
  'shares', 'stocks', 'investing', 'trading', 'company', 'pension', 'retirement',
  // home, land and work
  'house', 'home', 'land', 'rent', 'renting', 'landlord', 'tenant', 'repairs', 'fixing',
  'building', 'tools', 'plumbing', 'moving', 'neighbours', 'insurance', 'work', 'job',
  // added 2026-09-19 with the Insurance and Risk course: the words a person
  // actually types when something has gone wrong at their house.
  'fire', 'flood', 'storm', 'accident',
  'jobs', 'boss', 'team', 'planning', 'deadline', 'schedule', 'project',
  // body and mind
  'food', 'eating', 'sleep', 'exercise', 'health', 'sick', 'doctor', 'body', 'brain',
  'mind', 'habits', 'stress', 'worry', 'anger', 'feelings', 'memory', 'thinking',
  'attention', 'phone', 'screens',
  // learning and numbers
  'reading', 'writing', 'counting', 'numbers', 'maths', 'measuring', 'shapes', 'fractions',
  'school', 'teaching', 'learning', 'questions', 'kids', 'children', 'parents',
  // church, faith and people
  'church', 'bible', 'prayer', 'worship', 'serving', 'helping', 'family', 'marriage',
  'friends', 'forgiving', 'giving back', 'leaders', 'pastors', 'deacons', 'volunteers',
  // tech and the house's own work
  'computers', 'software', 'code', 'apps', 'data', 'internet', 'privacy', 'passwords',
  'video', 'sound', 'music', 'microphones', 'cameras', 'streaming', 'lights', 'wires',
  'storage', 'backup', 'robots', 'chatbots',
  // the world
  'news', 'truth', 'lies', 'history', 'war', 'government', 'laws', 'voting', 'drugs',
  'poverty', 'hunger', 'time', 'ages', 'death', 'endings',
]);

// courseKey -> the everyday words that should reach this course.
export const COURSE_PLAIN_WORDS = {
  // --- Kingdom Life & Stewardship ------------------------------------------
  'kingdom-economics': ['money', 'debt', 'giving', 'saving', 'business', 'work'],
  'legacy-provisions': ['will', 'inheritance', 'insurance', 'family', 'death', 'money'],
  'handed-forward': ['family', 'kids', 'planning', 'money', 'jobs', 'time'],
  banking: ['bank', 'money', 'saving', 'interest', 'debt', 'fees'],
  // --- Stock Market ---------------------------------------------------------
  stocks: ['shares', 'investing', 'company', 'money', 'pension', 'trading'],
  bonds: ['loan', 'lending', 'debt', 'interest', 'pension', 'government'],
  'world-market': ['trading', 'money', 'price', 'buying', 'selling', 'cost'],
  investing: ['investing', 'saving', 'money', 'pension', 'retirement', 'planning'],
  // The History department's first course (DR-0572). 'history' and 'truth'
  // echo the title; 'laws', 'land', 'wages' and 'bible' are the words a person
  // types when they want to know what the law did to whom, and what the Word
  // says about it.
  'history-truth': ['history', 'truth', 'laws', 'land', 'wages', 'bible'],
  'insurance-risk': ['insurance', 'fire', 'flood', 'accident', 'house', 'bills'],
  inspections: ['house', 'repairs', 'building', 'fixing', 'plumbing', 'buying'],
  evictions: ['rent', 'landlord', 'tenant', 'debt', 'money', 'home'],
  appraisal: ['price', 'house', 'money', 'buying', 'land', 'home'],
  // --- Real Estate ----------------------------------------------------------
  'property-principle': ['house', 'land', 'owning', 'home', 'money'],
  'buying-terms': ['buying', 'house', 'price', 'deal', 'money', 'contract'],
  'financing-debt': ['loan', 'debt', 'interest', 'borrow', 'bank', 'house'],
  'leasing-tenants': ['rent', 'tenant', 'landlord', 'house', 'contract'],
  'maintenance-trades': ['repairs', 'fixing', 'plumbing', 'tools', 'house'],
  'taxes-records': ['taxes', 'records', 'receipts', 'bills', 'money'],
  'partnerships': ['partners', 'business', 'money', 'friends', 'contract'],
  'management-stewardship': ['landlord', 'rent', 'tenant', 'repairs', 'work'],
  // --- Business / Development / Project Management --------------------------
  'rent-to-own-business': ['rent', 'business', 'selling', 'money', 'boss', 'work'],
  'development': ['code', 'software', 'computers', 'apps', 'data', 'truth'],
  'project-management': ['planning', 'deadline', 'team', 'cost', 'work', 'project'],
  'software-project-management': ['software', 'code', 'team', 'deadline', 'project'],
  // --- Mathematics ----------------------------------------------------------
  'mathematics': ['numbers', 'counting', 'measuring', 'shapes', 'fractions', 'maths'],
  // --- A.I. The Way ---------------------------------------------------------
  'ai': ['chatbots', 'computers', 'questions', 'truth', 'learning'],
  'sovereign-ai': ['computers', 'privacy', 'data', 'internet', 'chatbots'],
  'ai-legal-blueprint': ['privacy', 'chatbots', 'laws', 'passwords', 'data'],
  // --- Serve the House ------------------------------------------------------
  'broadcast': ['video', 'cameras', 'streaming', 'sound', 'church'],
  'sound-board': ['sound', 'music', 'microphones', 'church', 'volunteers'],
  'infrastructure': ['computers', 'wires', 'internet', 'storage', 'church'],
  'datasystems': ['data', 'computers', 'apps', 'storage', 'backup', 'church'],
  'word-out': ['video', 'news', 'church', 'internet', 'helping'],
  // --- The Word & The Way ---------------------------------------------------
  'living-lessons': ['bible', 'family', 'work', 'money', 'feelings', 'truth'],
  'little-learners': ['reading', 'counting', 'kids', 'school', 'parents'],
  'made-in-time': ['mind', 'attention', 'phone', 'screens', 'time', 'ages'],
  'church-offices': ['church', 'jobs', 'leaders', 'pastors', 'deacons', 'serving'],
  'healthy-living': ['food', 'sleep', 'exercise', 'health', 'body', 'eating'],
  'world-issues': ['news', 'truth', 'lies', 'government', 'war', 'questions'],
  'prophetic-voices': ['news', 'history', 'church', 'truth', 'government'],
  // --- Eternal Algorithms ---------------------------------------------------
  'eternal-torah': ['bible', 'history', 'family', 'laws', 'worship'],
  'eternal-wisdom': ['bible', 'money', 'friends', 'anger', 'worry', 'work'],
  'eternal-prophets': ['bible', 'truth', 'giving', 'history', 'church'],
  'eternal-gospels': ['bible', 'prayer', 'forgiving', 'money', 'worry'],
  'eternal-epistles': ['bible', 'church', 'mind', 'habits', 'family'],
  'eternal-revelation': ['bible', 'endings', 'church', 'truth', 'history'],
};

export function plainWordsFor(courseKey) {
  const w = COURSE_PLAIN_WORDS[String(courseKey || '')];
  return Array.isArray(w) ? w : [];
}

// One line, ready to render: "money · debt · giving · saving".
export function plainWordLine(courseKey) {
  return plainWordsFor(courseKey).join(' · ');
}

// Courses the registry has not reached yet — the gate's list, not a guess.
export function coursesMissingPlainWords(courses) {
  return (Array.isArray(courses) ? courses : [])
    .filter(Boolean)
    .filter((c) => plainWordsFor(c.key).length < 3)
    .map((c) => c.key);
}

// Declared words that are not everyday words. A row here means the registry has
// started smuggling house vocabulary back in, which is the whole thing it exists
// to prevent.
export function nonEverydayPlainWords() {
  const out = [];
  for (const [key, words] of Object.entries(COURSE_PLAIN_WORDS)) {
    for (const w of words) if (!EVERYDAY_WORDS.has(w)) out.push(`${key}: ${w}`);
  }
  return out;
}

// Rows that only echo their own title add no connection. Every row must carry at
// least one word the title does not already contain.
export function echoOnlyPlainWords(courses) {
  const out = [];
  for (const c of (Array.isArray(courses) ? courses : []).filter(Boolean)) {
    const words = plainWordsFor(c.key);
    if (!words.length) continue;
    const title = String(c.meta?.title || '').toLowerCase();
    if (!words.some((w) => !title.includes(w))) out.push(c.key);
  }
  return out;
}

// Keys in the registry that no mounted course claims — a rename or a removal,
// caught here rather than rendering a line under nothing.
export function orphanPlainWordRows(courses) {
  const live = new Set((Array.isArray(courses) ? courses : []).filter(Boolean).map((c) => c.key));
  return Object.keys(COURSE_PLAIN_WORDS).filter((k) => !live.has(k));
}
