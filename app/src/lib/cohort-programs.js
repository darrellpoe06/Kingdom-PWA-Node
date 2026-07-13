// =============================================================================
// cohort-programs — the PoeTech Academy COHORT-OPERATIONS engine (pure model)
// =============================================================================
// Darrell 2026-07-12 (spoken build input; captured per SPOKEN-TEACHINGS-ARE-
// BUILD-INPUT): a repeatable business for running students through a multi-track
// "learn and improve" development operation. The shape he described:
//
//   • ~500 students a month, $1,000 tuition each, run by ~10 leaders supported
//     by volunteers — and it must work whether 10 kids show up or 500.
//   • FIVE weekday tracks, each a different industry, EVERY week:
//        Mon — Spiritual Foundations (Understanding Yahweh)
//        Tue — Wholeness & Therapy (the sound mind)
//        Wed — Building with A.I. (code / STEM / cutting edge)
//        Thu — Business & Enterprise (development and the world)  [Music alt.]
//        Fri — Real Estate & Trades (plumbing, electrical, drywall, REIT)
//   • THREE-WEEK DEEPENING: the same track theme runs three weeks straight,
//     going deeper each week for the child at their age.
//   • WEEK 4 = the retrospective ("what do we need to do better"), then the whole
//     cycle rotates the next month.
//   • ANY AGE GROUP — the curriculum diversifies by age band.
//   • CONFIGURABLE FOR DIFFERENT INDUSTRIES — this is the platform, not one class.
//
// Darrell 2026-07-12 (second pass, the parent's decision): parents pay $1,000
// when they can SEE why — cutting-edge, future-facing skills (tech / coding /
// STEM), and the EARNING POWER of those fields. So each track carries a real,
// sourced earning-potential figure, and tuition supports flexible payment
// (pay-in-full or monthly installments — "rent-to-own type thing").
//
// DOCTRINE:
//   • PURE + DETERMINISTIC (DR-0076): no localStorage, no Date.now()/Math.random()
//     in anything load-bearing — callers pass `now` (ISO). Persistence lives in
//     use-cohort-programs.js; the surface derives everything from these fns.
//   • REAL DATA, NOTHING PAINTED (DR-0061 / P15): enrolled counts, collected
//     revenue, and balances are DERIVED from real enrollment + payment records.
//     The only big-capacity number shown is explicitly labeled "potential at full
//     capacity" — a projection, never reported as collected.
//   • SPEAK ESTABLISHED FACT (DR-0100): the salary figures are real, published
//     BLS medians, stated plainly (that IS the parent's ROI). Provenance is
//     carried on every figure; regional/experience variance is flagged honestly
//     (DR-0076) rather than smeared into "who knows."
//   • TEACH THE WORD, DON'T FORCE IT (DR-0098): the Spiritual Foundations track
//     is NOT given a salary line — its value is the wisdom every field is built
//     on (Proverbs 9:10), stated as foundation, not career income.
// =============================================================================

// ---------------------------------------------------------------------------
// tolerant coercers (house style)
// ---------------------------------------------------------------------------
const asStr = (v) => (typeof v === 'string' ? v : '');
const asNum = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const asArr = (v) => (Array.isArray(v) ? v : []);
const cents = (v) => Math.max(0, Math.round(asNum(v, 0)));
const rid = (prefix, seed) => `${prefix}-${asStr(seed) || Math.random().toString(36).slice(2, 9)}`;

// ---------------------------------------------------------------------------
// Earning-potential provenance — the parent-facing "why invest" data
// ---------------------------------------------------------------------------
// Every wage figure below is the U.S. Bureau of Labor Statistics median ANNUAL
// wage, May 2024 (Occupational Outlook Handbook), stored in cents. These are the
// numbers that answer the parent's question — "why is this worth $1,000?" — with
// established fact (DR-0100), not a sales pitch. Refresh from bls.gov/ooh before
// any parent-facing publication; medians are national and vary by region and
// experience (DR-0076 honest-variance flag).
export const EARNINGS_SOURCE =
  'U.S. Bureau of Labor Statistics — Occupational Outlook Handbook, median annual wage, May 2024';
export const EARNINGS_VERIFY_NOTE =
  'U.S. national medians (BLS, May 2024). Actual pay varies by region, employer, and experience — refresh from bls.gov/ooh before publishing to families.';

// The all-occupations median is the honest comparator a parent can feel: every
// figure below is shown against "the median for ALL U.S. jobs" so the premium is
// concrete rather than abstract.
export const ALL_OCCUPATIONS_MEDIAN_CENTS = 4950000; // $49,500 — BLS, all occupations, May 2024

// ---------------------------------------------------------------------------
// ACADEMY_TIERS — the three-level access ladder (Darrell 2026-07-12)
// ---------------------------------------------------------------------------
// The offering is not one price — it's a ladder, so no family is ever priced out
// of Yahweh, and the parent pays for the hands-on where the value is highest:
//
//   1. FREE, always — all Yahweh knowledge and understanding. Never gated. The
//      Spiritual Foundations track is free forever, for everyone (COMMUNITY-FIRST).
//   2. ENTRY ($39.99+/mo) — the cutting-edge DIGITAL curriculum: A.I. / STEM /
//      business / music / trades KNOWLEDGE, self-paced in the app. Included at the
//      entry paid tier (poetech-plus). Positioned against $25–35/mo online
//      homeschool tools — but faith-grounded, sovereign, and cutting-edge.
//   3. HANDS-ON ($1,000) — the in-person COHORT: see the local LLMs, build real
//      things with your hands, gain UNDERSTANDING — not theory like traditional
//      education. This is where project-based learning earns the price.
//
// The distinction is the whole pitch: knowledge can be free-to-entry; the hands-on
// build with real tools + sovereign local LLMs is what a parent pays $1,000 for.
export const ACADEMY_TIERS = [
  {
    id: 'free',
    label: 'Yahweh — always free',
    icon: 'dove',
    priceCents: 0,
    priceLabel: 'Free forever',
    requiredTier: 'foundation',
    summary: 'All Yahweh knowledge and understanding. Never gated, for every family.',
  },
  {
    id: 'digital',
    label: 'Cutting-edge — digital',
    icon: 'sparkle',
    priceCents: 3999,
    priceLabel: '$39.99+/mo',
    requiredTier: 'poetech-plus',
    summary: 'The cutting-edge curriculum — A.I., STEM, business, trades — self-paced in the app. Knowledge and theory.',
  },
  {
    id: 'hands-on',
    label: 'Hands-on — the cohort',
    icon: 'tools',
    priceCents: 100000,
    priceLabel: '$1,000 / cycle',
    requiredTier: 'business',
    summary: 'The in-person build: see the local LLMs, make real things with your hands, gain understanding — not just theory.',
  },
];
export const academyTier = (id) => ACADEMY_TIERS.find((t) => t.id === asStr(id)) || null;

// Which access tier a track sits in: faith is always free; every other track's
// KNOWLEDGE is entry-tier digital, and its HANDS-ON depth is the $1,000 cohort.
export function trackAccessTier(trackId) {
  const cat = trackCatalog(trackId);
  if (cat && cat.foundation) return academyTier('free');
  return academyTier('digital'); // knowledge at entry; hands-on cohort deepens it
}

// SUBSCRIPTION-OR-ARI (Darrell 2026-07-12): to learn beyond the always-free
// Yahweh track, a learner of ANY age either holds a subscription or goes through
// Ari. Ari (the sovereign local-LLM tutor, lib/class-tutor.js) is the teacher
// INSIDE the subscription — self-driving and age-adaptive, so no per-age staff is
// needed. That is what makes "any age" scale: the teacher is Ari, not a hire.
export const ARI_TUTOR_NOTE =
  'Taught by Ari — the sovereign A.I. tutor included with your subscription. Self-paced and age-adaptive, so a learner of any age starts the moment they want to, without waiting on a class.';

// Pure access read for a learner. `hasSubscription` is the caller's resolved
// entitlement (effectiveTier !== free — see lib/entitlements.js). Yahweh is
// always open; the cutting-edge digital learning (and Ari as its teacher) is the
// subscription; the hands-on cohort is the $1,000 in-person build.
export function learnerAccess({ hasSubscription = false } = {}) {
  return {
    yahweh: true,                    // always free, any age
    digitalWithAri: !!hasSubscription, // subscription unlocks the curriculum + Ari
    handsOnCohort: !!hasSubscription,  // enrollment is the paid cohort path
    teacher: 'Ari',
  };
}

// ---------------------------------------------------------------------------
// Homeschool positioning — sourced market context for the parent value section.
// Established fact (DR-0100), cited (DR-0076): where this offering sits vs the
// homeschool curriculum a parent is already comparing against, and the evidence
// that hands-on / project-based beats theory-only.
// ---------------------------------------------------------------------------
export const HOMESCHOOL_POSITIONING = {
  marketNote:
    'Families typically spend $500–$2,500 per child per year on homeschool curriculum; online tools run ~$25–35/mo, and live-teacher / hands-on programs run ~$700–$6,000/yr.',
  ladderFit: [
    { tier: 'free', vs: 'Free options like Khan Academy / Easy Peasy', edge: 'Faith-grounded and sovereign, not secular — Yahweh first, always free.' },
    { tier: 'digital', vs: 'Online tools ~$25–35/mo (e.g. Time4Learning)', edge: 'Cutting-edge A.I./STEM and biblical economics, in one sovereign app.' },
    { tier: 'hands-on', vs: 'Hands-on / live-teacher $700–$6,000/yr', edge: 'Build with real tools and local LLMs — understanding, not theory.' },
  ],
  evidenceNote:
    'Project-based, hands-on learning measurably outperforms traditional textbook instruction — a meta-analysis of 66 studies found the strongest gains in engineering and technology disciplines. That is why the hands-on cohort is worth the price.',
  evidenceSource: 'Meta-analyses of project-based learning outcomes (STEM), 2024–2025.',
};

// ---------------------------------------------------------------------------
// INDUSTRY_TRACKS — the configurable catalog. A program picks five of these,
// one per weekday. Each carries the parent value-prop + (where it applies) the
// real earning figure. `foundation: true` marks a track whose value is not a
// salary (the Spiritual Foundations track).
// ---------------------------------------------------------------------------
export const INDUSTRY_TRACKS = [
  {
    id: 'faith',
    label: 'Spiritual Foundations',
    short: 'Understanding Yahweh',
    icon: 'dove',
    defaultDay: 'Monday',
    foundation: true,
    parentBlurb:
      'The foundation every other day is built on: who Yahweh is, who your child is in Him, and the wisdom that orders a whole life. Always free, for every family — not a career track, the ground the career stands on.',
    outcome: 'Your child can name what they believe, why, and Who they answer to.',
    alwaysFree: true,
    anchor: {
      ref: 'Proverbs 9:10 (ESV)',
      text: 'The fear of the LORD is the beginning of wisdom, and the knowledge of the Holy One is insight.',
    },
    earning: null,
  },
  {
    id: 'wellness',
    label: 'Wholeness & Therapy',
    short: 'The sound mind',
    icon: 'heart',
    defaultDay: 'Tuesday',
    parentBlurb:
      'Emotional health, resilience, and the sound mind — how to notice a thought, test it, and steward it. The skill under every other skill; the field itself is growing and needed.',
    outcome: 'Your child can name what they feel, regulate it, and help a friend do the same.',
    earning: {
      role: 'Mental health & behavioral counselors',
      medianCents: 5919000, lowCents: 3909000, highCents: 9821000, growthPct: null,
      url: 'https://www.bls.gov/ooh/community-and-social-service/substance-abuse-behavioral-disorder-and-mental-health-counselors.htm',
    },
  },
  {
    id: 'ai',
    label: 'Building with A.I.',
    short: 'Code · STEM · cutting edge',
    icon: 'sparkle',
    defaultDay: 'Wednesday',
    parentBlurb:
      'Coding, STEM, and building real things with A.I. — the cutting edge every parent knows the future runs on. Highest earning power on the schedule, and growing fast.',
    outcome: 'Your child can build and ship a working app or A.I. tool — not just use one.',
    earning: {
      role: 'Software developers',
      medianCents: 13308000, lowCents: 7985000, highCents: 21145000, growthPct: 15,
      related: 'Data scientists median $112,590',
      url: 'https://www.bls.gov/ooh/computer-and-information-technology/software-developers.htm',
    },
  },
  {
    id: 'business',
    label: 'Business & Enterprise',
    short: 'Development & the world',
    icon: 'landmark',
    defaultDay: 'Thursday',
    parentBlurb:
      'How money, ownership, and enterprise actually work — biblical economics meeting the real world. The child who understands business is the one who builds instead of only being hired.',
    outcome: 'Your child can read a simple P&L, price a thing, and pitch an idea.',
    earning: {
      role: 'Financial & investment analysts',
      medianCents: 10135000, lowCents: 6241000, highCents: 18055000, growthPct: null,
      url: 'https://www.bls.gov/ooh/business-and-financial/financial-analysts.htm',
    },
  },
  {
    id: 'music',
    label: 'Music & Sound',
    short: 'Led by one of the brothers',
    icon: 'radio',
    defaultDay: 'Thursday',
    parentBlurb:
      'Musicianship, production, and sound — taught hands-on by one of the brothers. Discipline, ear, and craft that carries into worship, media, and a real trade.',
    outcome: 'Your child can play, record, and finish a piece of their own.',
    earning: {
      role: 'Music directors & composers',
      medianCents: 6367000, lowCents: 3499000, highCents: 15701000, growthPct: 0,
      url: 'https://www.bls.gov/ooh/entertainment-and-sports/music-directors-and-composers.htm',
    },
  },
  {
    id: 'trades',
    label: 'Real Estate & Trades',
    short: 'Plumbing · electrical · drywall · REIT',
    icon: 'tools',
    defaultDay: 'Friday',
    parentBlurb:
      'The hands-on trades that build and own real estate — plumbing, electrical, drywall — plus how a REIT and property ownership actually work. Debt-free-able skills that always have demand.',
    outcome: 'Your child can do a real repair with their hands and read a property deal.',
    earning: {
      role: 'Plumbers, pipefitters & steamfitters',
      medianCents: 6297000, lowCents: 4067000, highCents: 10515000, growthPct: null,
      related: 'Electricians median $62,350',
      url: 'https://www.bls.gov/ooh/construction-and-extraction/plumbers-pipefitters-and-steamfitters.htm',
    },
  },
  {
    id: 'custom',
    label: 'Custom Track',
    short: 'Configure any industry',
    icon: 'book',
    defaultDay: 'Monday',
    parentBlurb: 'A configurable track for any industry you run a cohort in.',
    outcome: '',
    earning: null,
  },
];

export const trackCatalog = (id) => INDUSTRY_TRACKS.find((t) => t.id === asStr(id)) || null;

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------
export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Age bands — "any age group," diversified. Ranges deliberately span the room
// the family described (children through adult), so a program is never age-locked.
export const AGE_BANDS = [
  { id: 'k-2', label: 'K–2', hint: 'Earliest learners; story-first, hands-on.' },
  { id: '3-5', label: '3rd–5th', hint: 'Concrete skills; lots of doing.' },
  { id: '6-8', label: '6th–8th', hint: 'Why-it-works; first real projects.' },
  { id: '9-12', label: '9th–12th', hint: 'Depth and portfolio; near-career.' },
  { id: 'young-adult', label: 'Young Adult (18–25)', hint: 'Launch and earn.' },
  { id: 'adult', label: 'Adult', hint: 'Re-skill and lead.' },
];
export const ageBand = (id) => AGE_BANDS.find((a) => a.id === asStr(id)) || null;

// AUDIENCES — who a cohort is FOR. "Any age group, for those who want to learn"
// (Darrell 2026-07-12). A program declares its audience so the framing, the age
// bands offered, and the on-ramp fit — a seniors tech-confidence cohort and a
// youth cohort are the same engine, different audience.
export const AUDIENCES = [
  { id: 'all-ages', label: 'All ages', ageBandIds: AGE_BANDS.map((a) => a.id),
    blurb: 'Open to every age — children through adults and elders. Intergenerational by design.' },
  { id: 'youth', label: 'Youth', ageBandIds: ['k-2', '3-5', '6-8', '9-12'],
    blurb: 'For school-age children — story-first for the youngest, portfolio-deep by high school.' },
  { id: 'adult', label: 'Adults', ageBandIds: ['young-adult', 'adult'],
    blurb: 'For adults learning or re-skilling — the cutting edge with a clear path to earning.' },
  { id: 'elders', label: 'Elders', ageBandIds: ['adult'],
    blurb: 'For seniors — everyday tech confidence and the Word, at a patient pace (COMMUNITY-FIRST).' },
];
export const audienceById = (id) => AUDIENCES.find((a) => a.id === asStr(id)) || null;

// The age bands a program offers, narrowed to its audience.
export function audienceAgeBands(program) {
  const aud = audienceById(program && program.audience) || audienceById('all-ages');
  const allow = new Set(aud.ageBandIds);
  return AGE_BANDS.filter((b) => allow.has(b.id));
}

// Enrollment status governs whether a seat is HELD. Payment is tracked
// separately (a partially-paid enrolled student still holds their seat).
export const ENROLLMENT_STATUSES = ['invited', 'enrolled', 'waitlist', 'withdrawn'];
export const SEAT_HOLDING = new Set(['enrolled']); // holds a seat + counts toward revenue

export const TEAM_ROLES = [
  { id: 'director', label: 'Program Director', staff: true },
  { id: 'lead', label: 'Track Lead', staff: true },
  { id: 'facilitator', label: 'Facilitator', staff: true },
  { id: 'volunteer', label: 'Volunteer', staff: false },
];
export const teamRole = (id) => TEAM_ROLES.find((r) => r.id === asStr(id)) || null;
export const isStaffRole = (id) => !!(teamRole(id) && teamRole(id).staff);

export const PROGRAM_STATUSES = ['planning', 'enrolling', 'running', 'retro', 'complete'];

export const RETRO_CATEGORIES = [
  { id: 'keep', label: 'Keep', hint: 'Worked — do it again.' },
  { id: 'improve', label: 'Improve', hint: 'Fix before next cycle.' },
  { id: 'try', label: 'Try', hint: 'A new idea to test.' },
];

// ---------------------------------------------------------------------------
// Payment plans — flexible tuition (pay-in-full OR installments)
// ---------------------------------------------------------------------------
// Darrell: "$369 or $325 a month... or the full thousand — however you wanna do
// that part... rent-to-own type thing." So plans are data: an operator can set an
// installment count and an explicit total (allowing a small financed uplift or a
// pay-in-full discount). The default plans carry NO hidden fee — full is the
// tuition, and the monthly plan splits the same tuition evenly (honest default).
export function defaultPaymentPlans(tuitionCents) {
  const t = cents(tuitionCents);
  const per3 = Math.ceil(t / 3 / 100) * 100; // round each installment up to the dollar
  return [
    { id: 'full', label: 'Pay in full', installments: 1, totalCents: t },
    { id: 'mo3', label: '3 payments', installments: 3, totalCents: Math.max(t, per3 * 3) },
    // 4 even payments — at the $1,000 tuition this is the $250 increments Darrell
    // named. installmentSchedule() splits it evenly and sums back to the total.
    { id: 'mo4', label: '4 payments', installments: 4, totalCents: t },
  ];
}

// The concrete per-installment schedule for a plan, in cents, summing EXACTLY to
// totalCents (remainder rides the first payment). Deterministic — no rounding drift.
export function installmentSchedule(plan) {
  const n = Math.max(1, asNum(plan && plan.installments, 1));
  const total = cents(plan && plan.totalCents);
  const base = Math.floor(total / n / 100) * 100; // whole dollars per installment
  const out = new Array(n).fill(base);
  const remainder = total - base * n;
  out[0] += remainder; // first payment absorbs the odd cents/dollars
  return out;
}

export function planById(program, planId) {
  const plans = asArr(program && program.paymentPlans);
  return plans.find((p) => p.id === asStr(planId)) || plans[0] || null;
}

// ---------------------------------------------------------------------------
// Factories (pure)
// ---------------------------------------------------------------------------
export const DEFAULT_TUITION_CENTS = 100000; // $1,000
export const DEFAULT_CAPACITY = 500;
export const DEFAULT_WEEKS = 3;
export const RETRO_WEEK = 4;
// Darrell 2026-07-12: a cohort should not START until enough families commit —
// a minimum roster triggers it. Ten is the default floor; below it the program
// is FORMING (collecting sign-ups), not running.
export const DEFAULT_MIN_START = 10;

// SESSION_FORMATS — the same 3-week / $1,000 curriculum, delivered in different
// time shapes so a family (and thin early staffing) can pick what fits. Every
// format delivers the full five-track cycle; they differ only in how the hours
// are arranged. Darrell 2026-07-12: start with a weekend 4-hour lab, or an
// after-school 2-hour lab, or a drop-in hour weekdays 3–5pm.
export const SESSION_FORMATS = [
  { id: 'weekend-4h', label: 'Saturday lab', hours: 4, cadence: 'Saturdays', blurb: 'All five tracks in one focused 4-hour hands-on lab each Saturday — the whole week in a morning.' },
  { id: 'afterschool-2h', label: 'After-school lab', hours: 2, cadence: 'Weekdays, after school', blurb: 'A 2-hour learning lab after school — come the days that fit your family.' },
  { id: 'dropin-1h', label: 'Drop-in hour', hours: 1, cadence: 'Weekdays 3–5pm', blurb: 'A focused hour at the church, weekdays between 3 and 5pm — a lighter on-ramp.' },
];
export const sessionFormat = (id) => SESSION_FORMATS.find((f) => f.id === asStr(id)) || null;

// The five default weekday tracks Darrell named (Music is available in the
// catalog to swap onto any day).
export const DEFAULT_TRACK_IDS = ['faith', 'wellness', 'ai', 'business', 'trades'];

export function makeProgramTracks(trackIds = DEFAULT_TRACK_IDS) {
  const ids = asArr(trackIds).length ? asArr(trackIds) : DEFAULT_TRACK_IDS;
  return ids.slice(0, 5).map((id, i) => ({
    day: WEEKDAYS[i] || WEEKDAYS[WEEKDAYS.length - 1],
    industryId: trackCatalog(id) ? id : 'custom',
  }));
}

export function makeProgram(partial = {}, { now = '' } = {}) {
  const p = partial || {};
  const tuitionCents = p.tuitionCents == null ? DEFAULT_TUITION_CENTS : cents(p.tuitionCents);
  return {
    id: asStr(p.id) || rid('prog'),
    name: asStr(p.name) || 'PoeTech Academy Cohort',
    tagline: asStr(p.tagline) || 'Learn and improve — one industry a day, deeper every week.',
    tuitionCents,
    capacity: Math.max(1, asNum(p.capacity, DEFAULT_CAPACITY)),
    cohortTarget: Math.max(0, asNum(p.cohortTarget, DEFAULT_CAPACITY)),
    staffTarget: Math.max(0, asNum(p.staffTarget, 10)),
    weeksPerCycle: Math.max(1, asNum(p.weeksPerCycle, DEFAULT_WEEKS)),
    retroWeek: RETRO_WEEK,
    minStart: Math.max(1, asNum(p.minStart, DEFAULT_MIN_START)),
    audience: audienceById(p.audience) ? p.audience : 'all-ages',
    formatIds: (asArr(p.formatIds).filter((id) => sessionFormat(id)).length
      ? asArr(p.formatIds).filter((id) => sessionFormat(id))
      : SESSION_FORMATS.map((f) => f.id)),
    cycleMonth: asStr(p.cycleMonth) || asStr(now).slice(0, 7), // 'YYYY-MM'
    status: PROGRAM_STATUSES.includes(p.status) ? p.status : 'enrolling',
    tracks: asArr(p.tracks).length ? asArr(p.tracks) : makeProgramTracks(p.trackIds),
    paymentPlans: asArr(p.paymentPlans).length ? asArr(p.paymentPlans) : defaultPaymentPlans(tuitionCents),
    monthlyCostCents: cents(p.monthlyCostCents), // optional; 0 => break-even not shown
    startIso: asStr(p.startIso) || null,
    createdIso: asStr(p.createdIso) || asStr(now) || null,
  };
}

export function makeEnrollment(partial = {}, { now = '' } = {}) {
  const p = partial || {};
  return {
    id: asStr(p.id) || rid('enr'),
    programId: asStr(p.programId),
    studentName: asStr(p.studentName),
    guardianName: asStr(p.guardianName),
    ageBandId: ageBand(p.ageBandId) ? p.ageBandId : 'k-2',
    status: ENROLLMENT_STATUSES.includes(p.status) ? p.status : 'enrolled',
    planId: asStr(p.planId) || 'full',
    payments: asArr(p.payments).map((pay) => ({
      amountCents: cents(pay && pay.amountCents),
      iso: asStr(pay && pay.iso),
      note: asStr(pay && pay.note),
    })),
    enrolledIso: asStr(p.enrolledIso) || asStr(now) || null,
  };
}

export function makeTeamMember(partial = {}, { now = '' } = {}) {
  const p = partial || {};
  return {
    id: asStr(p.id) || rid('team'),
    programId: asStr(p.programId),
    name: asStr(p.name),
    roleId: teamRole(p.roleId) ? p.roleId : 'volunteer',
    trackDay: WEEKDAYS.includes(p.trackDay) ? p.trackDay : null,
    createdIso: asStr(p.createdIso) || asStr(now) || null,
  };
}

// A prospective family's interest — the parent-facing invite's pipeline end
// (BUSINESS-PROCESS-CONNECTIONS: a surface that invites must have somewhere the
// invitation lands). Captured from the public value page; operators see the
// count + list in the console and convert it to an enrollment.
export function makeInterest(partial = {}, { now = '' } = {}) {
  const p = partial || {};
  return {
    id: asStr(p.id) || rid('int'),
    programId: asStr(p.programId),
    parentName: asStr(p.parentName),
    email: asStr(p.email),
    childAgeBandId: ageBand(p.childAgeBandId) ? p.childAgeBandId : 'k-2',
    planInterest: asStr(p.planInterest) || 'full',
    note: asStr(p.note),
    createdIso: asStr(p.createdIso) || asStr(now) || null,
  };
}

export function validateInterest(partial) {
  const p = partial || {};
  if (!asStr(p.parentName).trim()) return { ok: false, error: 'Please add your name.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(asStr(p.email).trim())) return { ok: false, error: 'A valid email is required so the team can reach you.' };
  return { ok: true };
}

export function makeRetroNote(partial = {}, { now = '' } = {}) {
  const p = partial || {};
  return {
    id: asStr(p.id) || rid('retro'),
    programId: asStr(p.programId),
    cycleMonth: asStr(p.cycleMonth),
    category: RETRO_CATEGORIES.some((c) => c.id === p.category) ? p.category : 'improve',
    note: asStr(p.note),
    createdIso: asStr(p.createdIso) || asStr(now) || null,
  };
}

// ---------------------------------------------------------------------------
// Validation gates ({ ok, error })
// ---------------------------------------------------------------------------
export function validateEnrollment(partial, program) {
  const p = partial || {};
  if (!asStr(p.studentName).trim()) return { ok: false, error: 'A student name is required.' };
  if (!ageBand(p.ageBandId)) return { ok: false, error: 'Pick an age band.' };
  if (program && !planById(program, p.planId)) return { ok: false, error: 'Pick a payment plan.' };
  return { ok: true };
}

export function validatePayment(amountCents, enrollment, program) {
  const amt = cents(amountCents);
  if (amt <= 0) return { ok: false, error: 'Enter a payment amount greater than zero.' };
  const state = enrollmentPaymentState(enrollment, program);
  if (amt > state.balanceCents) {
    return { ok: false, error: `That is more than the $${(state.balanceCents / 100).toFixed(2)} balance owed.` };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Derivations — every displayed number comes from here (real records only)
// ---------------------------------------------------------------------------

// The program's enriched weekday schedule: each track joined to its catalog
// entry and given three week-focus lines (the deepening). The focuses are
// generated from the theme so a bare program still renders a real 3-week arc.
export function programSchedule(program) {
  const tracks = asArr(program && program.tracks);
  const weeks = Math.max(1, asNum(program && program.weeksPerCycle, DEFAULT_WEEKS));
  return tracks.map((t) => {
    const cat = trackCatalog(t.industryId) || trackCatalog('custom');
    const focuses = [];
    for (let w = 1; w <= weeks; w += 1) focuses.push(weekFocus(cat, w, weeks));
    return { day: t.day, industryId: cat.id, label: cat.label, short: cat.short, icon: cat.icon, foundation: !!cat.foundation, weekFocuses: focuses };
  });
}

// The deepening line for a given week — same theme, deeper each week.
export function weekFocus(catalog, week, totalWeeks) {
  const depth = ['Meet it', 'Work it', 'Own it', 'Teach it', 'Ship it'];
  const label = depth[Math.min(week - 1, depth.length - 1)] || `Week ${week}`;
  const name = (catalog && catalog.label) || 'Track';
  if (week === 1) return `Week 1 · ${label}: first exposure to ${name.toLowerCase()} — the big idea, hands-on.`;
  if (week === totalWeeks) return `Week ${week} · ${label}: go deep — a real piece of work the child can show.`;
  return `Week ${week} · ${label}: build on last week — harder, more independent.`;
}

export function enrollmentPaymentState(enrollment, program) {
  const plan = planById(program, enrollment && enrollment.planId);
  const totalCents = plan ? cents(plan.totalCents) : cents(program && program.tuitionCents);
  const paidCents = asArr(enrollment && enrollment.payments).reduce((s, p) => s + cents(p.amountCents), 0);
  const balanceCents = Math.max(0, totalCents - paidCents);
  const installmentsTotal = plan ? Math.max(1, asNum(plan.installments, 1)) : 1;
  return {
    plan,
    totalCents,
    paidCents,
    balanceCents,
    paidInFull: paidCents >= totalCents && totalCents > 0,
    installmentsTotal,
    installmentsPaid: asArr(enrollment && enrollment.payments).length,
  };
}

// Enrollments that hold a seat for this program (status 'enrolled').
export function seatHolders(enrollments, programId) {
  return asArr(enrollments).filter((e) => e && e.programId === programId && SEAT_HOLDING.has(e.status));
}

export function programStats(program, enrollments) {
  const all = asArr(enrollments).filter((e) => e && e.programId === (program && program.id));
  const held = all.filter((e) => SEAT_HOLDING.has(e.status));
  const capacity = Math.max(1, asNum(program && program.capacity, DEFAULT_CAPACITY));
  const enrolledCount = held.length;

  let committedCents = 0;
  let collectedCents = 0;
  for (const e of held) {
    const st = enrollmentPaymentState(e, program);
    committedCents += st.totalCents;
    collectedCents += st.paidCents;
  }
  const outstandingCents = Math.max(0, committedCents - collectedCents);
  const potentialCents = capacity * cents(program && program.tuitionCents);

  // age-band breakdown over seat holders (real records)
  const byAge = {};
  for (const e of held) byAge[e.ageBandId] = (byAge[e.ageBandId] || 0) + 1;

  return {
    capacity,
    enrolledCount,
    waitlistCount: all.filter((e) => e.status === 'waitlist').length,
    invitedCount: all.filter((e) => e.status === 'invited').length,
    withdrawnCount: all.filter((e) => e.status === 'withdrawn').length,
    seatsLeft: Math.max(0, capacity - enrolledCount),
    fillPct: capacity > 0 ? Math.min(100, Math.round((enrolledCount / capacity) * 100)) : 0,
    committedCents,
    collectedCents,
    outstandingCents,
    potentialCents, // labeled "potential at full capacity" in the UI — a projection
    byAge,
  };
}

export function teamStats(program, team, enrolledCount = 0) {
  const roster = asArr(team).filter((m) => m && m.programId === (program && program.id));
  const staff = roster.filter((m) => isStaffRole(m.roleId));
  const volunteers = roster.filter((m) => !isStaffRole(m.roleId));
  const coverage = WEEKDAYS.map((day) => ({
    day,
    covered: staff.some((m) => m.trackDay === day),
    who: staff.filter((m) => m.trackDay === day).map((m) => m.name).filter(Boolean),
  }));
  return {
    total: roster.length,
    staffCount: staff.length,
    volunteerCount: volunteers.length,
    directors: roster.filter((m) => m.roleId === 'director').length,
    leads: roster.filter((m) => m.roleId === 'lead').length,
    facilitators: roster.filter((m) => m.roleId === 'facilitator').length,
    studentsPerStaff: staff.length > 0 ? Math.round((enrolledCount / staff.length) * 10) / 10 : null,
    coverage,
    daysCovered: coverage.filter((c) => c.covered).length,
  };
}

// The delivery formats this program offers, enriched from the catalog.
export function programFormats(program) {
  return asArr(program && program.formatIds).map(sessionFormat).filter(Boolean);
}

// Start-readiness: a cohort triggers only once the roster reaches the minimum.
// Below it the program is FORMING; at/above it, it is ready to start. Counts
// only seat-holding (enrolled) students — real commitments, not invites.
export function startReadiness(program, enrollments) {
  const minStart = Math.max(1, asNum(program && program.minStart, DEFAULT_MIN_START));
  const enrolledCount = seatHolders(enrollments, program && program.id).length;
  return {
    minStart,
    enrolledCount,
    ready: enrolledCount >= minStart,
    needed: Math.max(0, minStart - enrolledCount),
    pct: minStart > 0 ? Math.min(100, Math.round((enrolledCount / minStart) * 100)) : 100,
  };
}

// Break-even: how many paid students cover the program's stated monthly cost.
// Null when no cost is set (honest — we don't invent a cost).
export function breakEvenStudents(program) {
  const cost = cents(program && program.monthlyCostCents);
  const tuition = cents(program && program.tuitionCents);
  if (cost <= 0 || tuition <= 0) return null;
  return Math.ceil(cost / tuition);
}

// Where in the monthly cycle are we? 3 weeks of class then the week-4 retro,
// derived from startIso + now. No start date => phase 'scheduled'.
export function cycleProgress(program, now) {
  const startMs = Date.parse(asStr(program && program.startIso));
  const nowMs = Date.parse(asStr(now));
  const weeks = Math.max(1, asNum(program && program.weeksPerCycle, DEFAULT_WEEKS));
  if (!Number.isFinite(startMs) || !Number.isFinite(nowMs)) {
    return { phase: 'scheduled', week: 0, totalWeeks: weeks, retroWeek: RETRO_WEEK, daysIn: 0, message: 'Not yet started.' };
  }
  const daysIn = Math.floor((nowMs - startMs) / 86400000);
  if (daysIn < 0) return { phase: 'scheduled', week: 0, totalWeeks: weeks, retroWeek: RETRO_WEEK, daysIn, message: 'Starts soon.' };
  const week = Math.floor(daysIn / 7) + 1;
  if (week > weeks + 1) return { phase: 'complete', week, totalWeeks: weeks, retroWeek: RETRO_WEEK, daysIn, message: 'Cycle complete — rotate to next month.' };
  if (week === RETRO_WEEK) return { phase: 'retro', week, totalWeeks: weeks, retroWeek: RETRO_WEEK, daysIn, message: 'Retrospective week — review and improve.' };
  return { phase: 'running', week, totalWeeks: weeks, retroWeek: RETRO_WEEK, daysIn, message: `Week ${week} of ${weeks} — deepening.` };
}

// The parent-facing ROI framing for a track's earning figure. Pure math over
// real BLS medians + the program tuition. Foundation tracks return null.
export function trackROI(catalog, tuitionCents) {
  const cat = catalog && catalog.earning ? catalog : (trackCatalog(catalog) || null);
  if (!cat || !cat.earning) return null;
  const tuition = Math.max(1, cents(tuitionCents));
  const median = cents(cat.earning.medianCents);
  return {
    role: cat.earning.role,
    medianCents: median,
    lowCents: cents(cat.earning.lowCents),
    highCents: cents(cat.earning.highCents),
    growthPct: cat.earning.growthPct == null ? null : asNum(cat.earning.growthPct),
    related: asStr(cat.earning.related) || null,
    url: asStr(cat.earning.url) || null,
    // "one year in this field is worth ~N times a year of tuition"
    yearsOfTuition: Math.round((median / tuition) * 10) / 10,
    // dollars above the all-jobs median — the concrete premium
    premiumOverAllJobsCents: median - ALL_OCCUPATIONS_MEDIAN_CENTS,
  };
}

// ---------------------------------------------------------------------------
// Seed (SEED-DATA-AS-ASPIRATION) — one flagship program + a small, clearly
// LABELED sample cohort so the surface renders real derived numbers. Sample
// students are named "Sample Student NN" on purpose: honest that they are
// demonstration rows, not real enrollees. The aspiration (500 seats, $500k/mo
// potential) shows through the CAPACITY + potential readout, never as collected.
// All ids are `seed-` prefixed so the shell filters them from any cloud upload.
// ---------------------------------------------------------------------------
export const SEED_PROGRAMS = [
  makeProgram({
    id: 'seed-prog-flagship',
    name: 'PoeTech Academy — Cutting-Edge Cohort',
    tagline: 'Five industries, one a day. Same lesson three weeks, deeper each week. Any age.',
    tuitionCents: DEFAULT_TUITION_CENTS,
    capacity: 500,
    cohortTarget: 500,
    staffTarget: 10,
    weeksPerCycle: 3,
    cycleMonth: '2026-07',
    status: 'enrolling',
    trackIds: DEFAULT_TRACK_IDS,
    monthlyCostCents: 4200000, // $42,000 illustrative monthly run cost (break-even demo)
    startIso: '2026-07-06T00:00:00.000Z',
    createdIso: '2026-07-12T00:00:00.000Z',
  }),
];

function seedEnrollment(n, ageId, status, planId, payments) {
  return makeEnrollment({
    id: `seed-enr-${String(n).padStart(2, '0')}`,
    programId: 'seed-prog-flagship',
    studentName: `Sample Student ${String(n).padStart(2, '0')}`,
    guardianName: `Sample Parent ${String(n).padStart(2, '0')}`,
    ageBandId: ageId,
    status,
    planId,
    payments,
    enrolledIso: '2026-07-01T00:00:00.000Z',
  });
}
export const SEED_ENROLLMENTS = [
  seedEnrollment(1, 'k-2', 'enrolled', 'full', [{ amountCents: 100000, iso: '2026-07-01T00:00:00.000Z', note: 'Paid in full' }]),
  seedEnrollment(2, '3-5', 'enrolled', 'full', [{ amountCents: 100000, iso: '2026-07-01T00:00:00.000Z', note: 'Paid in full' }]),
  seedEnrollment(3, '6-8', 'enrolled', 'mo3', [{ amountCents: 34000, iso: '2026-07-01T00:00:00.000Z', note: 'Installment 1 of 3' }]),
  seedEnrollment(4, '9-12', 'enrolled', 'mo3', [{ amountCents: 34000, iso: '2026-07-01T00:00:00.000Z', note: 'Installment 1 of 3' }, { amountCents: 33000, iso: '2026-08-01T00:00:00.000Z', note: 'Installment 2 of 3' }]),
  seedEnrollment(5, 'young-adult', 'enrolled', 'full', [{ amountCents: 100000, iso: '2026-07-02T00:00:00.000Z', note: 'Paid in full' }]),
  seedEnrollment(6, 'adult', 'enrolled', 'mo3', [{ amountCents: 34000, iso: '2026-07-02T00:00:00.000Z', note: 'Installment 1 of 3' }]),
  seedEnrollment(7, '6-8', 'enrolled', 'full', [{ amountCents: 100000, iso: '2026-07-02T00:00:00.000Z', note: 'Paid in full' }]),
  seedEnrollment(8, '9-12', 'enrolled', 'mo3', []),
  seedEnrollment(9, '3-5', 'waitlist', 'full', []),
  seedEnrollment(10, 'k-2', 'invited', 'full', []),
];

export const SEED_TEAM = [
  makeTeamMember({ id: 'seed-team-01', programId: 'seed-prog-flagship', name: 'Program Director (lead)', roleId: 'director', trackDay: null, createdIso: '2026-07-12T00:00:00.000Z' }),
  makeTeamMember({ id: 'seed-team-02', programId: 'seed-prog-flagship', name: 'Spiritual Foundations Lead', roleId: 'lead', trackDay: 'Monday', createdIso: '2026-07-12T00:00:00.000Z' }),
  makeTeamMember({ id: 'seed-team-03', programId: 'seed-prog-flagship', name: 'Wholeness & Therapy Lead', roleId: 'lead', trackDay: 'Tuesday', createdIso: '2026-07-12T00:00:00.000Z' }),
  makeTeamMember({ id: 'seed-team-04', programId: 'seed-prog-flagship', name: 'Building with A.I. Lead', roleId: 'lead', trackDay: 'Wednesday', createdIso: '2026-07-12T00:00:00.000Z' }),
  makeTeamMember({ id: 'seed-team-05', programId: 'seed-prog-flagship', name: 'Business & Enterprise Lead', roleId: 'lead', trackDay: 'Thursday', createdIso: '2026-07-12T00:00:00.000Z' }),
  makeTeamMember({ id: 'seed-team-06', programId: 'seed-prog-flagship', name: 'Real Estate & Trades Lead', roleId: 'lead', trackDay: 'Friday', createdIso: '2026-07-12T00:00:00.000Z' }),
  makeTeamMember({ id: 'seed-team-07', programId: 'seed-prog-flagship', name: 'Facilitator (floating)', roleId: 'facilitator', trackDay: null, createdIso: '2026-07-12T00:00:00.000Z' }),
  makeTeamMember({ id: 'seed-team-08', programId: 'seed-prog-flagship', name: 'Facilitator (age K–5)', roleId: 'facilitator', trackDay: null, createdIso: '2026-07-12T00:00:00.000Z' }),
  makeTeamMember({ id: 'seed-team-09', programId: 'seed-prog-flagship', name: 'Volunteer — check-in', roleId: 'volunteer', trackDay: null, createdIso: '2026-07-12T00:00:00.000Z' }),
  makeTeamMember({ id: 'seed-team-10', programId: 'seed-prog-flagship', name: 'Volunteer — hospitality', roleId: 'volunteer', trackDay: null, createdIso: '2026-07-12T00:00:00.000Z' }),
];

export const SEED_RETROS = [
  makeRetroNote({ id: 'seed-retro-01', programId: 'seed-prog-flagship', cycleMonth: '2026-07', category: 'keep', note: 'The one-industry-a-day rhythm held attention all three weeks — keep it.', createdIso: '2026-07-12T00:00:00.000Z' }),
  makeRetroNote({ id: 'seed-retro-02', programId: 'seed-prog-flagship', cycleMonth: '2026-07', category: 'improve', note: 'Week-3 A.I. track needed a second facilitator for the 9–12 group — add one next cycle.', createdIso: '2026-07-12T00:00:00.000Z' }),
  makeRetroNote({ id: 'seed-retro-03', programId: 'seed-prog-flagship', cycleMonth: '2026-07', category: 'try', note: 'Offer the 3-payment plan up front on the sign-up page — several parents asked for it.', createdIso: '2026-07-12T00:00:00.000Z' }),
];

// ---------------------------------------------------------------------------
// Seed merge — user/DB rows win by id; seeds are the permanent baseline. Used by
// the store on load. Pure (no persistence here).
// ---------------------------------------------------------------------------
export function mergeSeed(userRows, seeds) {
  const byId = new Map();
  for (const s of asArr(seeds)) if (s && s.id) byId.set(s.id, s);
  for (const u of asArr(userRows)) if (u && u.id) byId.set(u.id, u); // user wins
  return Array.from(byId.values());
}

export const isSeedId = (id) => typeof id === 'string' && id.startsWith('seed-');
