// =============================================================================
// learn-crosslist — a lesson taught in one course, shelved in another department
// =============================================================================
// Darrell 2026-09-16: "Most people want Ai understanding built in their
// curriculum" — and, of the department that gathers it, "can we use
// cross-referenced lessons that get credited either way."
//
// DR-0447 fixed the COUNT: the A.I. department really does hold three courses
// and 35 lessons, not one course and eight. But a count is not what he asked
// for. The curriculum teaches about A.I. in nine more places — the tower and
// the race in Living Lessons, the church's own GPU node in Data Systems, our
// models on our own hardware in The Infrastructure — and a reader standing in
// the A.I. department could not see any of it. Those lessons are not A.I.
// courses; they are the curriculum's A.I. understanding, scattered where it
// was taught. This gathers them WITHOUT moving them.
//
// THE RULE THAT MAKES "CREDITED EITHER WAY" TRUE BY CONSTRUCTION: a
// cross-listing is a POINTER, never a copy. A lesson has exactly one home
// course, and opening it from a department opens it IN that home course — same
// lesson, same session flow, same tutor, same place record (learn-resume.js
// keys { courseKey, lessonId }). So the credit cannot fork, because there was
// never a second identity to credit. Nothing is duplicated, so the program's
// own totals are untouched (25 courses, 486 lessons, before and after).
//
// The declarations below are a DECISION — which of the curriculum's lessons
// teach A.I. understanding — so they are written down, one line each with its
// reason, rather than guessed from a title match (a regex on "machine" or
// "data" pulls in a lesson about reasoning and one about a jar of secrets).
// What is NOT hand-kept is the lesson itself: every title, reference and unit
// label is read live from the mounted course (DR-0121), and a declaration whose
// lesson no longer exists FAILS THE BUILD rather than rendering a dead row.
//
// Pure + dependency-free; unit-tested in learn-crosslist.test.js.


// =============================================================================
// AND THE SAME QUESTION, ONE LEVEL UP (DR-0516)
// =============================================================================
// Darrell 2026-09-18, reading the live picker: "Why are the business courses
// that have business content and foundational insights and strategies and
// situational analysis Word first in Business however we only show one business
// course... each one could be considered a business course as well as another
// because it is integration of it throughout how do we need to differentiate
// between the following?"
//
// He is right, and it is measurable. 31 self-paced courses sit across 9
// departments, and Business holds exactly ONE (Rent to Own) while at least
// fourteen others are business content by any honest reading: all eight Real
// Estate courses, Kingdom Economics, Legacy Provisions, Handed Forward, both
// Project Management courses, and Development.
//
// The cause is that `meta.category` is a SINGLE string, so a course lives on
// exactly one shelf, and a curriculum whose whole design is integration cannot
// be described by a single string. DR-0447 hit the identical wall for LESSONS
// and answered it with a pointer. This is that answer at course scale.
//
// HOW TO DIFFERENTIATE — the rule, so this never becomes a taste argument:
//
//   HOME is what a course FORMS. Ask one question: if a person completed only
//   this course, what could he now DO that he could not before? The answer
//   names one discipline, and that discipline is the home. Rent to Own forms an
//   operator who can run a rent-to-own business. Financing forms an owner who
//   can read a note and name his position. Kingdom Economics forms a believer
//   who understands ownership, production and circulation. All three are
//   business; none of them is either of the others.
//
//   CROSS-LISTING is what a course SERVES. Everything else it genuinely
//   contributes to, declared as a pointer with a reason.
//
// The invariant is the one that made "credited either way" true for lessons: a
// cross-listed course is a POINTER, never a copy. It keeps one home, one
// credit, one place record. The program's totals do not move — the test pins
// them before and after — because no second identity was ever created.

export const CROSS_LISTINGS = [
  {
    department: 'A.I. The Way', courseKey: 'living-lessons',
    lessonId: 'll34-the-tower-the-race-and-the-sovereign',
    why: 'Discernment in the age of A.I. — the tower, the race, and who is actually sovereign over it.',
  },
  {
    department: 'A.I. The Way', courseKey: 'living-lessons',
    lessonId: 'll67-made-in-his-image-we-make-why-ai-is-not-a-soul',
    why: 'What a machine is and is not: made in His image we make, and why A.I. is not a soul.',
  },
  {
    department: 'A.I. The Way', courseKey: 'living-lessons',
    lessonId: 'll21-hidden-vs-known',
    why: 'The needs no machine can meet — belonging and being known are not fillable by a model.',
  },
  {
    department: 'A.I. The Way', courseKey: 'living-lessons',
    lessonId: 'll99-watch-and-be-ready-no-date-setting-and-a-sober-word-on-ai-and-prophecy',
    why: 'A sober word on A.I. and prophecy, and why no date is set by either.',
  },
  {
    department: 'A.I. The Way', courseKey: 'living-lessons',
    lessonId: 'll163-the-build-we-are-going-for-and-why-according-to-the-word-a-school-yahweh-first',
    why: 'Why we build technology at all, Yahweh first — the frame every A.I. lesson here sits inside.',
  },
  {
    department: 'A.I. The Way', courseKey: 'datasystems',
    lessonId: 'dsi5-meet-ari',
    why: 'Meet Ari — the sovereign A.I. this house actually runs, and what it is for.',
  },
  {
    department: 'A.I. The Way', courseKey: 'datasystems',
    lessonId: 'dsi7-the-gpu-node',
    why: 'The GPU node: local A.I. at the church, on hardware the church owns.',
  },
  {
    department: 'A.I. The Way', courseKey: 'infrastructure',
    lessonId: 'inf6-local-ai',
    why: 'Our own A.I. — Ollama and the models running on our own machines.',
  },
  {
    department: 'A.I. The Way', courseKey: 'broadcast',
    lessonId: 'bc7-llms-for-broadcast',
    why: 'A.I. that serves the broadcast — and how it really works under the hood.',
  },

  // ===========================================================================
  // THE HISTORY SHELF GATHERS WHAT THE CURRICULUM ALREADY TAUGHT (DR-0575)
  // ===========================================================================
  // Darrell 2026-09-23, the evening the department opened: "History section
  // doesn't have any of the historical events we currently have... why not?!"
  //
  // He was right. The department held its one new course and nothing else,
  // while the curriculum had been teaching dated American and world history
  // for months — the Pullman porters, Greenwood, the 1965 Act, the 1921
  // Evanston ordinance, redlining written into federal manuals, the patent law
  // that barred the enslaved — each shelved where it was first taught. Same
  // wall DR-0447 hit for A.I.: a lesson has ONE category string, so a reader
  // standing in History could not see any of it.
  //
  // FOUND BY MEASURING, NOT BY TITLE-MATCHING. Every mounted lesson was
  // scanned for distinct dated years and for a fixed history vocabulary
  // (slavery, emancipation, reconstruction, jim crow, redlining, treaty,
  // constitution, reparations, civil war, ...). 103 lessons carried three or
  // more years or four or more of those words; a keyword count alone is not a
  // shelf, so each candidate's own big idea was then READ, and only lessons
  // whose SUBJECT is a documented event or period are declared here. The
  // count beside each is what the measurement returned (history words /
  // distinct years). Lessons that merely cite a date in passing — a 2026
  // filing, a 1997 sermon quoted for its doctrine — stay off the shelf.
  //
  // Same rule as every pointer above: one home, one credit, one place record.
  { department: 'History', courseKey: 'living-lessons', lessonId: 'll135-they-called-every-one-of-them-george-the-name-they-took-the-porter-at-the-door-and-the-wage-yahweh-legislated', why: 'The Pullman porters, 1894 to 1925 — every man called by the owner’s name, the union that won the wage, and the wage Yahweh legislated first (measured: 119 history terms, 1894–1963).' },
  { department: 'History', courseKey: 'world-issues', lessonId: 'wi-evanston-reparations-and-equal-protection', why: 'A 1921 city ordinance, one ward, decades of mortgage denial — the documented wrong, the narrow legal question, and restitution in the Word (measured: 114 history terms, 1900–1989).' },
  { department: 'History', courseKey: 'world-issues', lessonId: 'wi-historical-trauma-two-aftermaths', why: 'Two aftermaths on one scale — 1865, 1921, 1938, 1947 — honoring a documented wound without carrying the false report attached to it (measured: 112 history terms).' },
  { department: 'History', courseKey: 'world-issues', lessonId: 'wi-tuition-and-the-1965-act', why: 'The land-grant acts of 1862 and 1890, the Higher Education Act of 1965, and the guaranteed-loan road that followed — the documented facts under a viral claim (measured: 80 history terms).' },
  { department: 'History', courseKey: 'world-issues', lessonId: 'wi-prison-industrial-complex', why: 'From the 1865 amendment’s exception clause to the 1994 crime bill — the documented spine of mass incarceration, and the jubilee question (measured: 57 history terms).' },
  { department: 'History', courseKey: 'living-lessons', lessonId: 'll90-no-respecter-of-persons-the-image-the-unrighteous-decree-and-the-judge', why: 'The vote traced from the Three-Fifths Compromise through Jim Crow to today, weighed under the Judge who is no respecter of persons (measured: 43 history terms).' },
  { department: 'History', courseKey: 'living-lessons', lessonId: 'll134-divers-weights-when-the-question-keeps-moving-the-record-that-stands-and-the-better-assignment', why: 'The record of Black invention, 1821 to 1919, and the moving goalpost the Word names a divers weight (measured: 13 history terms, 1821–1919).' },
  { department: 'History', courseKey: 'prophetic-voices', lessonId: 'pv-inventions', why: 'The patent law that barred the enslaved from holding their own inventions, 1793 onward, and the credit that was taken (measured: 22 history terms, 1793–1858).' },
  { department: 'History', courseKey: 'kingdom-economics', lessonId: 'econ5-the-real-barriers', why: 'The engineered barriers, measured and documented — racial covenants, the FHA’s 1938 manual, redlining — written into deeds and federal law (measured: 14 history terms, 1938–2017).' },
  { department: 'History', courseKey: 'kingdom-economics', lessonId: 'econ7-build-institutions', why: 'Greenwood, 1921 — thirty-five blocks destroyed and never repaid — as a documented witness of what the Body built and of an injustice that still stands (measured: 32 history terms).' },
  { department: 'History', courseKey: 'prophetic-voices', lessonId: 'pv-price', why: 'Dr. Frederick K.C. Price’s 1997 series naming the American Church’s complicity in slavery and racism, from the record (measured: 11 history terms, 1932–1997).' },
  { department: 'History', courseKey: 'legacy-provisions', lessonId: 'legacy7-how-we-got-here', why: 'The history of the trust itself — from the 1535 Statute of Uses to the modern spendthrift wall — the fight over how far one generation may bind the next (measured: 1535–1983).' },
  { department: 'History', courseKey: 'living-lessons', lessonId: 'll40-the-thread-did-not-snap-remnant', why: 'Assyria’s conquest of Samaria as real history — the tablets confirm it — and the remnant Yahweh kept through the scattering (measured: 26 history terms).' },
  { department: 'History', courseKey: 'living-lessons', lessonId: 'll127-the-firsts-what-yahweh-did-in-each-century-that-had-never-been-done-before', why: 'What Yahweh did in each century that had never been done before — the firsts, from 1446 BC to now, and what continues (measured: 31 history terms).' },
  { department: 'History', courseKey: 'prophetic-voices', lessonId: 'pv-diop', why: 'Dr. Cheikh Anta Diop’s scientific case, defended at Cairo in 1974, that ancient Kemet was a Black African civilization continuous with the rest of Africa (measured: 1923–1986).' },
  { department: 'History', courseKey: 'prophetic-voices', lessonId: 'pv-obenga', why: 'Dr. Théophile Obenga’s case from language — the tongue preserving the continuity the record-keepers tried to sever, presented at Cairo in 1974 (measured: 1936–1974).' },
  { department: 'History', courseKey: 'prophetic-voices', lessonId: 'pv-williams', why: 'Dr. Chancellor Williams’ sixteen years of research into the destruction of Black civilization, and the knowledge to rebuild (measured: 1893–2000).' },
];

/** The declarations shelved into one department, in their authored order. */
export function crossListingsFor(department) {
  const d = String(department || '');
  return d ? CROSS_LISTINGS.filter((c) => c.department === d) : [];
}

/** Every department that gathers cross-listed lessons, first-seen order. */
export function crossListedDepartments() {
  const seen = [];
  for (const c of CROSS_LISTINGS) if (!seen.includes(c.department)) seen.push(c.department);
  return seen;
}

/**
 * Resolve a department's cross-listings against the LIVE lesson index
 * (learn-organize.buildLessonIndex over the whole mounted catalog). Each row
 * carries what the shelf renders — read from the lesson, never retyped — plus
 * the home course to open. A declaration whose lesson is not mounted is
 * dropped here and reported by missingCrossListings(), so the reader never
 * meets a row that opens nothing.
 */
export function resolveCrossListed(department, index) {
  const rows = Array.isArray(index) ? index : [];
  const byKey = new Map(rows.map((r) => [`${r.courseKey}::${r.lessonId}`, r]));
  const out = [];
  for (const c of crossListingsFor(department)) {
    const r = byKey.get(`${c.courseKey}::${c.lessonId}`);
    if (!r) continue;
    out.push({
      department: c.department,
      courseKey: c.courseKey,
      courseTitle: r.courseTitle,
      lessonId: c.lessonId,
      title: r.title,
      ref: r.ref,
      unitLabel: r.unitLabel,
      why: c.why,
    });
  }
  return out;
}

/**
 * THE GATE. Declarations that name a lesson the mounted catalog does not carry
 * — a renamed id, a removed lesson, a typo. Returned as readable
 * "course :: lesson" strings so a failing test says which line to fix.
 */
export function missingCrossListings(index) {
  const have = new Set((Array.isArray(index) ? index : []).map((r) => `${r.courseKey}::${r.lessonId}`));
  return CROSS_LISTINGS
    .filter((c) => !have.has(`${c.courseKey}::${c.lessonId}`))
    .map((c) => `${c.courseKey} :: ${c.lessonId}`);
}

/**
 * A cross-listing may never name a lesson that already lives in the department
 * it is shelved into — that would double-count the department's own course and
 * make the same lesson reachable twice under two different counts.
 */
export function selfListedCrossListings(departmentsOf) {
  const of = typeof departmentsOf === 'function' ? departmentsOf : () => '';
  return CROSS_LISTINGS
    .filter((c) => of(c.courseKey) === c.department)
    .map((c) => `${c.courseKey} :: ${c.lessonId}`);
}

/** How many lessons a department gathers from elsewhere. */
export function crossListedCount(department) {
  return crossListingsFor(department).length;
}

/**
 * COURSE-level cross-listings (DR-0516). A whole course shelved into another
 * department it genuinely serves, as a pointer: `{ department, courseKey, why }`
 * with no lessonId. Home stays whatever `meta.category` says, so the count, the
 * credit and the place record are untouched.
 *
 * Written down one line at a time WITH ITS REASON, because which discipline a
 * course serves is a judgement and a judgement belongs in the record rather
 * than in a title match. What is never hand-kept is the course itself: the
 * title and lesson count are read live from the mounted catalog, and a
 * declaration naming a course the catalog does not carry FAILS THE BUILD.
 */
export const COURSE_CROSS_LISTINGS = [
  // The eight Real Estate courses. Every one is an operating discipline of a
  // property business, which is why a reader standing in Business could not see
  // the department that teaches most of what a property business actually does.
  { department: 'Business', courseKey: 'property-principle', why: 'Why owned property is a principle at all — the footing under every business that holds an asset.' },
  { department: 'Business', courseKey: 'buying-terms', why: 'Price, terms and the count to finish: the acquisition side of any business that buys.' },
  { department: 'Business', courseKey: 'leasing-tenants', why: 'Leasing and tenant selection — choosing who your revenue comes from, judged righteously.' },
  { department: 'Business', courseKey: 'maintenance-trades', why: 'Maintenance, repairs and the trades: operating cost, vendor selection and the work itself.' },
  { department: 'Business', courseKey: 'partnerships', why: 'Who you build with — the agreement, the yoke, the counterparty and the exit.' },
  { department: 'Business', courseKey: 'financing-debt', why: 'The debt you sign and the lender you face: position, timing, and what the head may require.' },
  { department: 'Business', courseKey: 'taxes-records', why: 'What the authorities take and what you can prove — assessments, filings and the register.' },
  { department: 'Business', courseKey: 'management-stewardship', why: 'Management is stewardship: the capstone on operating an asset for somebody other than yourself.' },
  // Kingdom Life & Stewardship, where the economics and the structures live.
  { department: 'Business', courseKey: 'kingdom-economics', why: 'Ownership against consumption, circulation against extraction — the economics under every venture here.' },
  { department: 'Business', courseKey: 'legacy-provisions', why: 'The constitution, the spendthrift wall and forced production: how a holding is structured to outlast its builder.' },
  { department: 'Business', courseKey: 'handed-forward', why: 'Succession — handing a venture to someone who will face problems the founder never met.' },
  // Delivery disciplines, which a business needs and a ministry needs equally.
  { department: 'Business', courseKey: 'project-management', why: 'Scope, schedule and the count before the build — delivery as a discipline.' },
  { department: 'Business', courseKey: 'software-project-management', why: 'The same discipline where the product is software and the estimate is hardest.' },
  { department: 'Business', courseKey: 'development', why: 'Building systems that tell the truth: the make-side of a business that runs on its own tools.' },
  // ADDED 2026-09-19, after Darrell opened the Business picker and asked:
  // "Why isn't Banking in this list already?!!!!!" It was not, and neither
  // were four more Real Estate courses that shipped after the original eight.
  // The list was hand-kept, so every course added after it was written simply
  // never appeared. See HOME_ONLY below for the structural fix.
  { department: 'Business', courseKey: 'banking', why: 'What the bank does with your money — the counterparty every business banks with, and what it owes you.' },
  // CROSS-LISTED WITH THE STOCK MARKET DEPARTMENT, 2026-09-19. The Stocks
  // course lives in Stock Market and is genuinely discussed in two other
  // places: a business raising capital by selling ownership is a Business
  // question (its lesson two IS that decision), and a household pension is a
  // Kingdom Life & Stewardship question, which is how most people first meet
  // shares at all.
  { department: 'Business', courseKey: 'stocks', why: 'Selling a piece of the ownership to fund the tower — the third road out of Luke 14:28, and the only one that is never repaid and never recovered.' },
  { department: 'Kingdom Life & Stewardship', courseKey: 'stocks', why: 'Most households meet shares through a pension statement they have never opened. What a share is, who gets your money, and the question the screen never asks.' },
  { department: 'Business', courseKey: 'bonds', why: 'Borrowing rather than selling ownership — the road that must be repaid, what a lender will ask about your income and what it already owes.' },
  { department: 'Kingdom Life & Stewardship', courseKey: 'bonds', why: 'The other side of a debt, taught from 2 Kings 4 and Deuteronomy 23 whole — including what the usury passage does and does not settle.' },
  // COURSE THREE OF THE STOCK MARKET DEPARTMENT, 2026-09-20. World trade is
  // discussed in two other places for reasons a reader would recognise: any
  // business that buys or sells something that crossed a border is exposed to
  // the exchange rate and the shipping cost whether or not it ever looks at
  // them, and the household question — what a deficit is, what a currency is,
  // what a just weight is across a border — is stewardship, not economics.
  { department: 'Business', courseKey: 'world-market', why: 'What an exchange rate and a shipping lane do to a price you quoted in your own currency — the exposure every importer and exporter carries whether or not they look at it.' },
  { department: 'Kingdom Life & Stewardship', courseKey: 'world-market', why: 'The just weight that does not stop being required at a border (Leviticus 19:36), and the plain answer to the headline word that moves people who were never taught it.' },
  // COURSE FOUR OF THE STOCK MARKET DEPARTMENT, 2026-09-20. The only course in
  // the department about a DECISION rather than a piece of machinery, which is
  // why it belongs on the stewardship shelf as much as the market one: its last
  // three lessons are whose money is it, what is it for, and how much is enough.
  { department: 'Kingdom Life & Stewardship', courseKey: 'investing', why: 'The steward’s three questions before any product is named — whose is it, what is it for, by when — and the one the industry cannot answer: how much is enough (Proverbs 30:8).' },
  { department: 'Business', courseKey: 'investing', why: 'The four different things the word RISK gets used for, and the only number in the whole business that is knowable before anything happens.' },
  { department: 'Business', courseKey: 'appraisal', why: 'What a thing is actually worth — valuation, which every business that holds or sells an asset must do honestly.' },
  { department: 'Business', courseKey: 'evictions', why: 'Ending a tenancy righteously — the hardest enforcement any operator does, and the one most easily done cruelly.' },
  { department: 'Business', courseKey: 'inspections', why: 'What you look at before you sign — diligence on the asset, which is diligence on the deal.' },
  { department: 'Business', courseKey: 'insurance-risk', why: 'What you cannot afford to lose — risk transfer, which every business either buys deliberately or carries by accident.' },
  // CROSS-LISTED FROM MEASURED OVERLAP, 2026-09-19. Darrell: "All courses need
  // to be listed in their respective courses and also cross the other spaces it
  // is discussed..." So the remaining shelves were found by MEASURING each
  // course's own lesson text against the distinctive vocabulary of every other
  // department, rather than by guessing. Only overlaps a reader would recognise
  // are declared; the count beside each is what the measurement returned.
  { department: 'Development', courseKey: 'sovereign-ai', why: 'Running your own models on your own hardware is a build discipline before it is anything else (measured: 126 development terms in its own lessons).' },
  { department: 'Business', courseKey: 'sovereign-ai', why: 'What it costs to own the stack instead of renting it — a procurement and margin question (measured: 94 business terms).' },
  { department: 'Business', courseKey: 'ai-legal-blueprint', why: 'The agreements and liabilities around using these tools in a real operation (measured: 31 business terms).' },
  { department: 'Development', courseKey: 'datasystems', why: 'The house data systems are built and maintained like any other software (measured: 26 development terms).' },
  { department: 'Kingdom Life & Stewardship', courseKey: 'world-issues', why: 'What is happening in the world, read against the Word\u2019s own economics and stewardship (measured: 62 stewardship terms).' },
  { department: 'Kingdom Life & Stewardship', courseKey: 'financing-debt', why: 'The debt you sign is a stewardship question before it is a finance question (measured: 37 stewardship terms).' },
  { department: 'Kingdom Life & Stewardship', courseKey: 'evictions', why: 'Ending a tenancy righteously is stewardship of people, not only of an asset (measured: 37 stewardship terms).' },
  { department: 'Mathematics', courseKey: 'appraisal', why: 'Valuation is applied arithmetic — comparables, adjustments and the measure behind a number (measured: 49 mathematics terms).' },
  // The History department's first course is taught Word-first at every step
  // -- His measure of a nation, His law on land, wages, weights and persons,
  // and the two-or-three-witness rule -- so it belongs on the Word's own shelf
  // as well as its home (measured: 39 distinct Scripture anchors across eight
  // lessons; the course test walks every quoted span against the KJV).
  { department: 'The Word & The Way', courseKey: 'history-truth', why: 'American history read under the Word’s own measure of a nation — the fatherless, the widow and the stranger — and established at the mouth of two or three witnesses (measured: 41 Scripture anchors across eight lessons).' },
  // The department's second course teaches the researcher's craft as the
  // Word commands it — prove all things, the eyewitness, two or three
  // witnesses, a just weight, reproof regarded, written in order — so it sits
  // on the Word's shelf as well as at home (measured: 32 distinct Scripture
  // anchors across eight lessons; the course test walks every quoted span).
  { department: 'The Word & The Way', courseKey: 'historical-research-1619', why: 'The historian’s craft taught as the Word commands it — prove all things, go to the record, hear the witnesses in their own words, two or three witnesses, fact against interpretation, the open correction and the quiet edit, the city read as a record, written in order for the children — worked on the 1619 Project as the case (measured: 31 Scripture anchors across eight lessons).' },
  // The Business department's second course (DR-0594) teaches the researcher's
  // craft as the Word commands it — count the cost, hear before you answer, two
  // or three witnesses, a just weight, reproof regarded, written plain upon
  // tables — so it sits on the Word's shelf as well as at home (measured: 27
  // distinct Scripture anchors across eight lessons; the course test walks
  // every quoted span).
  { department: 'The Word & The Way', courseKey: 'business-research-wars', why: 'The business researcher’s craft taught as the Word commands it — count the cost, hear the matter before answering, two or three witnesses, a just weight, reproof regarded, written plain upon tables — worked on the rivalries Business Wars tells as drama (measured: 27 Scripture anchors across eight lessons).' },
];

/** The course declarations shelved into one department, in authored order. */
// COURSES THAT LIVE IN ONE PLACE ONLY, DECLARED RATHER THAN ASSUMED.
//
// Darrell, 2026-09-19, opening the Business picker: "We need to review the Ways
// we update our systems and don't when we have features added!!!!!!!!! Why
// isn't Banking in this list already?!!!!!"
//
// Banking was missing because COURSE_CROSS_LISTINGS is hand-kept: a course
// added after the list was written never appears in it, and nothing notices.
// Measured the day he asked: 22 of 36 mounted courses had no entry at all.
//
// Adding the five that belonged is half a fix. The other half is that a course
// must not be able to mount with NOTHING said about its shelves. So every
// course is now in exactly one of two places -- it declares a cross-listing,
// or it declares here that its home is the only shelf it belongs on. A new
// course in neither list FAILS the build (learn-crosslist.test.js), which puts
// the decision at the moment the course is added rather than leaving a silent
// gap for somebody to find in a dropdown months later.
//
// WHAT THIS LIST MEANS, STATED HONESTLY. It is NOT a finding that these could
// not serve elsewhere. It is that no second shelf has been declared for them
// YET. Darrell's standing instruction is the wider one -- "All courses need to
// be listed in their respective courses and also cross the other spaces it is
// discussed" -- and the eight cross-listings above were found by measuring
// each course's lesson text against every other department's vocabulary. The
// courses below either measured no real overlap or measured one that is an
// artefact of volume rather than subject: living-lessons scores high against
// every department simply because it is 181 lessons, which is not evidence of
// anything. Those need a read, not a keyword count.
//
// re-review: 2026-10-19 -- read the remaining courses and declare the shelves
// a reader would actually expect, rather than leaving them here by default.
export const HOME_ONLY = Object.freeze([
  // The Word and the Way -- the Word's own subject. Its home IS the shelf.
  // (world-issues left this list when it measured real stewardship overlap.)
  'living-lessons', 'little-learners', 'made-in-time', 'church-offices',
  'healthy-living', 'prophetic-voices',
  // Serve the House -- serving your own congregation, taught where it is served.
  // (datasystems left this list when it measured real Development overlap.)
  'broadcast', 'infrastructure', 'sound-board', 'word-out',
  // A.I. The Way -- discernment for believers rather than a transferable trade.
  // (sovereign-ai and ai-legal-blueprint left when they measured real overlap.)
  'ai',
  // A child's schooling.
  'mathematics',
  // Business's OWN course. It is the department a cross-listing would point at,
  // so it has no cross-listing to make; it is the destination, not a pointer.
  'rent-to-own-business',
]);

/**
 * Courses the catalog mounts that say NOTHING about their shelves -- neither a
 * cross-listing nor a home-only declaration. This must stay empty: a course
 * with no declaration is not a course somebody decided about, it is one that
 * slipped through. Pure: takes the mounted keys, returns the undeclared ones.
 */
export function coursesWithNoShelfDeclaration(mountedKeys = []) {
  const declared = new Set([...COURSE_CROSS_LISTINGS.map((c) => c.courseKey), ...HOME_ONLY]);
  return [...new Set(mountedKeys)].filter((k) => !declared.has(k)).sort();
}

export function courseCrossListingsFor(department) {
  const d = String(department || '');
  return d ? COURSE_CROSS_LISTINGS.filter((c) => c.department === d) : [];
}

/** Every department that gathers cross-listed COURSES, first-seen order. */
export function courseCrossListedDepartments() {
  const seen = [];
  for (const c of COURSE_CROSS_LISTINGS) if (!seen.includes(c.department)) seen.push(c.department);
  return seen;
}

/**
 * Resolve a department's course cross-listings against the LIVE catalog rows
 * (each `{ key, meta, schedule }` as the picker already has them). Every field
 * a shelf renders is read from the course, never retyped. A declaration whose
 * course is not mounted is dropped here and reported by
 * missingCourseCrossListings(), so a reader never meets a row opening nothing.
 */
export function resolveCourseCrossListed(department, courses) {
  const rows = Array.isArray(courses) ? courses : [];
  const byKey = new Map(rows.map((c) => [c.key, c]));
  const out = [];
  for (const c of courseCrossListingsFor(department)) {
    const r = byKey.get(c.courseKey);
    if (!r) continue;
    out.push({
      department: c.department,
      courseKey: c.courseKey,
      courseTitle: (r.meta && r.meta.title) || r.key,
      homeDepartment: (r.meta && r.meta.category) || 'General Studies',
      lessons: (r.schedule && r.schedule.length) || 0,
      unitCap: r.unitCap || 'Lesson',
      why: c.why,
    });
  }
  return out;
}

/** THE GATE. Course declarations the mounted catalog does not carry. */
export function missingCourseCrossListings(courses) {
  const have = new Set((Array.isArray(courses) ? courses : []).map((c) => c.key));
  return COURSE_CROSS_LISTINGS.filter((c) => !have.has(c.courseKey)).map((c) => c.courseKey);
}

/**
 * A course may never be cross-listed into the department that is already its
 * HOME — that would show it twice on one shelf under two different counts, and
 * it is the one mistake this file exists to prevent.
 */
export function selfListedCourseCrossListings(departmentOf) {
  const of = typeof departmentOf === 'function' ? departmentOf : () => '';
  return COURSE_CROSS_LISTINGS.filter((c) => of(c.courseKey) === c.department).map((c) => c.courseKey);
}

/** How many whole courses a department gathers from elsewhere. */
export function courseCrossListedCount(department) {
  return courseCrossListingsFor(department).length;
}
