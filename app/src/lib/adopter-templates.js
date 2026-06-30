// adopter-templates.js — aspirational starter data for a NEW adopter's instance.
//
// WHY THIS EXISTS. When a friend adopts PoeTech for their family, church, or
// business, their brand-new isolated instance (provisioned by join_default_instance
// -> an own `u-<uid>` instance, fully RLS-firewalled) should NOT open empty, and
// must NEVER open with the Poe family's real data. It should open on a *thriving
// stewardship picture they would want to reach* — the SEED-DATA-AS-ASPIRATION
// contract applied to onboarding. Today a non-family sign-in lands in EMPTY_WORLD;
// these templates are the aspirational alternative, chooseable per adopter type.
//
// BINDING RULES (docs/00-foundations/_root/SEED-DATA-AS-ASPIRATION.md):
//   1. Privacy      — contains NO real Poe-family personal information.
//   2. Aspiration   — looks like what the adopter would WANT for their house.
//   3. Relatability — income/life-stage is achievable for the audience.
//   4. Active guide — at least one "the system tells you something useful" moment.
// Every template carries its own answers to those four as `contract`, and the
// proven-to-catch guard `scripts/adopter-template-guard.mjs` FAILS the build if a
// real Poe identifier ever appears here.
//
// These names are deliberately generic and fictional, and deliberately DISTINCT
// from both the Poe family and the existing demo personas (Reeves / Maya / Jordan
// / Sam / Reynolds) so nothing collides with seed-provenance or entity-pollution
// detection. They are a picture, not a person.

// ---------------------------------------------------------------------------
// FAMILY — a two-earner household ~2 years into stewardship discipline.
// ---------------------------------------------------------------------------
const FAMILY = {
  type: 'family',
  label: 'A family',
  tagline: 'Your whole financial and spiritual life, on one honest screen.',
  // The people an owner would add — owner + spouse + a teen, with real roles.
  members: [
    { role: 'owner',  displayName: 'Caleb',  title: 'Head of household' },
    { role: 'admin',  displayName: 'Hannah', title: 'Co-steward' },
    { role: 'member', displayName: 'Eli',    title: 'Teen (allowance + chores)' },
  ],
  starter: {
    entities: [
      { name: 'Personal (Caleb + Hannah)', kind: 'personal', note: 'Joint household' },
    ],
    accounts: [
      { name: 'Household checking', kind: 'checking', balance: 3120 },
      { name: 'Buffer fund (savings)', kind: 'savings', balance: 3600 },
    ],
    monthlyIncomeGross: 8200,      // moderate, sustainable, two-earner
    netCashFlowMonthly: 720,       // positive but modest — feels possible
    bufferTarget: 5000,
    bufferCurrent: 3600,           // ~72% of target, growing month over month
    monthlyGiving: 200,            // consistent first-fruits (THE-WAY foundation)
    debts: [
      { name: 'Card A (near payoff)', balance: 1850, descending: true },
      { name: 'Auto loan', balance: 9400, descending: true },
    ],
    // ONE active-guidance moment — the system as partner, not ledger.
    activeGuidance: {
      kind: 'budget-watch',
      message: 'Groceries are trending about 8% over budget this month — nothing broken yet, just worth a glance.',
    },
  },
  contract: {
    privacy: 'Fictional household (Caleb + Hannah + Eli). No Poe-family data.',
    aspiration: 'A growing buffer, two debts both descending, giving held steady, modest positive cash flow.',
    relatability: '$8.2K/mo gross, two earners — an ordinary, reachable picture.',
    activeGuidance: 'A gentle category-trending nudge, so the system reads as a guide on day one.',
  },
};

// ---------------------------------------------------------------------------
// CHURCH — a small congregation finding its feet with sovereign tools.
// ---------------------------------------------------------------------------
const CHURCH = {
  type: 'church',
  label: 'A church',
  tagline: 'Serve the congregation with tools you own — Word-first, no surveillance.',
  members: [
    { role: 'owner',  displayName: 'Pastor', title: 'Senior pastor' },
    { role: 'admin',  displayName: 'Ministry Admin', title: 'Office administrator' },
    { role: 'member', displayName: 'AV Volunteer', title: 'Media / broadcast team' },
  ],
  starter: {
    entities: [
      { name: 'Cornerstone Fellowship', kind: 'church', note: 'A small congregation' },
    ],
    // Church-shaped aspirational picture: a few wired ministries, a learning path.
    ministries: [
      { name: 'Sunday worship', note: 'Order of service + song list flowing' },
      { name: 'Media / broadcast', note: 'One program feed, lyrics + Scripture on screen' },
      { name: 'Discipleship', note: 'A self-paced course the staff is working through' },
    ],
    weeklyGiving: 4200,            // a small congregation, healthy and honest
    activeGuidance: {
      kind: 'service-prep',
      message: 'This Sunday’s song list has 3 of 5 songs confirmed — two still need a key and an arrangement.',
    },
    // The first lessons a church staff would walk: grounded in the real course.
    learningStart: 'Data Systems & Infrastructure (self-paced, in Church > Learn)',
  },
  contract: {
    privacy: 'Fictional congregation (Cornerstone Fellowship). No real church data.',
    aspiration: 'Ministries wired, a media feed live, staff already learning the system.',
    relatability: 'A small congregation’s real weekly rhythm, not a megachurch fantasy.',
    activeGuidance: 'A service-prep nudge that shows the system helping plan Sunday.',
  },
};

// ---------------------------------------------------------------------------
// BUSINESS — a small owner-operated shop keeping honest books.
// ---------------------------------------------------------------------------
const BUSINESS = {
  type: 'business',
  label: 'A small business',
  tagline: 'Honest books, a clear pipeline, and stewardship over your trade.',
  members: [
    { role: 'owner',  displayName: 'Owner',     title: 'Owner-operator' },
    { role: 'admin',  displayName: 'Bookkeeper', title: 'Books + invoices' },
  ],
  starter: {
    entities: [
      { name: 'Trailhead Goods LLC', kind: 'business', note: 'Owner-operated shop' },
    ],
    accounts: [
      { name: 'Operating account', kind: 'checking', balance: 8600 },
      { name: 'Tax set-aside', kind: 'savings', balance: 4100 },
    ],
    monthlyRevenue: 14500,
    netCashFlowMonthly: 2100,
    pipeline: [
      { name: 'Repeat client — quarterly order', stage: 'won', value: 4500 },
      { name: 'New lead — first consult booked', stage: 'qualifying', value: 8000 },
    ],
    activeGuidance: {
      kind: 'tax-runway',
      message: 'Quarterly estimated taxes are due in 3 weeks — your set-aside already covers it.',
    },
  },
  contract: {
    privacy: 'Fictional shop (Trailhead Goods LLC). No Poe-business data.',
    aspiration: 'Positive cash flow, a tax set-aside that already covers the bill, a live pipeline.',
    relatability: '$14.5K/mo revenue, owner-operated — a reachable small-business picture.',
    activeGuidance: 'A tax-runway heads-up that reassures rather than alarms.',
  },
};

export const ADOPTER_TEMPLATES = [FAMILY, CHURCH, BUSINESS];

/** All supported adopter-type keys, stable order. */
export function templateTypes() {
  return ADOPTER_TEMPLATES.map((t) => t.type);
}

/** The template for an adopter type, or null if unknown (no-leak: never guess). */
export function templateFor(type) {
  return ADOPTER_TEMPLATES.find((t) => t.type === type) || null;
}

/** A compact, display-safe summary of a template's aspirational picture. */
export function templateSummary(t) {
  if (!t) return null;
  const s = t.starter || {};
  return {
    type: t.type,
    label: t.label,
    tagline: t.tagline,
    memberCount: (t.members || []).length,
    roles: (t.members || []).map((m) => m.role),
    activeGuidance: s.activeGuidance?.message || null,
    contract: t.contract,
  };
}
