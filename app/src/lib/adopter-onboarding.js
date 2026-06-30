// adopter-onboarding.js — the offering, and the guided journey that gets a new
// adopter productive in HOURS, not weeks.
//
// This is the in-app spine of "we are providing PoeTech to friends." It is pure
// data + selectors (no monolith growth, fully testable). Two halves:
//
//   THE_OFFERING       — what an adopter receives, the way in, and the
//                        governance/trust promises that are part of the product.
//   ONBOARDING_JOURNEY — the ordered setup walk, every step answering the four
//                        anxiety-clarity questions (what / when / why / how),
//                        per docs/00-foundations/_root/ANXIETY-CLARITY-PRINCIPLE.md.
//
// Grounded in real, shipped surfaces (cited inline so the journey can't drift
// from reality): the self-serve provisioning RPC, the relationships model, the
// Data Systems course, the contextual Help system, the Concerns & Solutions board.

// ---------------------------------------------------------------------------
// WHO this is for — the three adopter shapes a friend will recognize.
// ---------------------------------------------------------------------------
export const ADOPTER_TYPES = [
  { key: 'family',   label: 'A family',          who: 'Households stewarding money, time, and faith together.' },
  { key: 'church',   label: 'A church',          who: 'Congregations who want to serve their people with tools they own.' },
  { key: 'business', label: 'A small business',  who: 'Owner-operators keeping honest books and a clear pipeline.' },
];

// ---------------------------------------------------------------------------
// THE OFFERING — the product, the way in, and the trust promises.
// ---------------------------------------------------------------------------
export const THE_OFFERING = {
  headline: 'Bring PoeTech home — sovereign, served-not-surveilled, yours.',
  // The way in. Funding model per project-community-free-funded-by-aligned-brand-
  // sponsorship: free tiers are funded by vetted aligned-brand partners, NEVER by
  // selling data and NEVER by skimming a paying family. (Sponsor roster + exact
  // ratio are a Darrell/business decision — see "decisionsPending" below.)
  freePathways: [
    { key: 'foundation', label: 'Foundation — free forever',
      detail: 'The Financial System for Families and the whole Spiritual Module (Scripture, the Godhead study platform, worship surfaces) are free on every tier, no upgrade.' },
    { key: 'loved-ones', label: 'Loved Ones · Founding Family',
      detail: 'Free PoeTech+ for life — invited directly by the Poe family.' },
    { key: 'community', label: 'Community · Families in need',
      detail: 'Free access through partner churches and 501(c)(3)s — funded by aligned-brand partners, never your data.' },
    { key: 'business-partner', label: 'Mission-aligned 501(c)(3)',
      detail: 'A community-partner path for aligned nonprofits.' },
  ],
  // What you actually get — traced to shipped modules so the promise is real.
  whatYouGet: [
    'Your own isolated instance — your data is firewalled from every other adopter (RLS no-leak).',
    'Owner / admin / member roles, and a relationship model for guardian→child, family, and landlord↔tenant.',
    'A thriving aspirational starter you can keep or clear — never anyone else’s real data.',
    'A self-paced Data Systems course and a contextual “?” on every screen.',
    'In-app feedback that becomes a tracked Concern & Solution — the system keeps improving for you.',
  ],
  // Governance / trust IS the offer (it is the structural moat, not a footnote).
  trustPromises: [
    { key: 'sovereign',  label: 'Sovereign / self-hostable',
      detail: 'Runs on hardware you can own; internal surfaces live on your own network.' },
    { key: 'served',     label: 'Served, not surveilled',
      detail: 'No advertising model, no engagement optimization, no behavioral targeting.' },
    { key: 'no-sale',    label: 'No data sale, ever',
      detail: 'Your data exists to serve your family or church — never to be extracted from them.' },
    { key: 'consent',    label: 'Consent-gated',
      detail: 'Aggregation or sharing happens only with explicit, per-purpose opt-in; deletion is immediate and verifiable.' },
    { key: 'bounded-ai', label: 'Ari is bounded by the Cage',
      detail: 'The A.I. helps but cannot run away: every autonomous loop carries a budget, a single-instance lock, and a kill-switch.' },
  ],
};

// ---------------------------------------------------------------------------
// THE GUIDED JOURNEY — ordered steps, each answering what / when / why / how.
// `owner` names who does the step: 'adopter' (self-serve) or 'operator' (the
// person provisioning on their behalf). Most are self-serve by design.
// ---------------------------------------------------------------------------
export const ONBOARDING_JOURNEY = [
  {
    id: 'create-profile',
    title: 'Create your profile',
    owner: 'adopter',
    what: 'Install the app and make a profile — your name, email, and a password.',
    when: 'First thing, before anything else. No profile, no access (that is the security model).',
    why: 'Your profile is your identity and the key to your own private instance. Nobody shares yours.',
    how: [
      'Open the app and choose “Create a profile.”',
      'Enter your name, email, and a password.',
      'You are now the owner of your own isolated instance — automatically, the moment you sign in.',
    ],
  },
  {
    id: 'choose-starter',
    title: 'Choose your starter picture',
    owner: 'adopter',
    what: 'Pick the starter that fits you — a family, a church, or a small business.',
    when: 'Right after your profile is created, on the welcome screen.',
    why: 'You start on a thriving, aspirational example so the app makes sense immediately — never on someone else’s real data, and never blank.',
    how: [
      'Pick family, church, or business.',
      'Look around — every number is an example you can keep, edit, or clear.',
      'When you enter your own real data, the example quietly steps aside.',
    ],
  },
  {
    id: 'add-people',
    title: 'Add your people',
    owner: 'adopter',
    what: 'Invite the people who belong in your house — a spouse, staff, a tenant, a child.',
    when: 'Once you can see the app and know who needs in.',
    why: 'Access is the relationship between two people. Children are protected structurally; tenants never see your money.',
    how: [
      'Open Relationships.',
      'Add a family member, a guardian→child link, or a landlord↔tenant relationship.',
      'Each person gets exactly the access their role allows — nothing more.',
    ],
  },
  {
    id: 'learn-the-system',
    title: 'Learn the system (at your pace)',
    owner: 'adopter',
    what: 'Walk the self-paced Data Systems & Infrastructure course and use the “?” on any screen.',
    when: 'Whenever you have a few minutes — it waits for you, no cohort clock.',
    why: 'A confident steward is a productive one. The course and the help answer what, when, why, and how, everywhere.',
    how: [
      'Open Church > Learn for the course, or tap the “?” in the header on any screen.',
      'Take one module at a time; your progress is saved.',
      'First-run? The walkthrough offers a quick tour you can dismiss.',
    ],
  },
  {
    id: 'enter-real-data',
    title: 'Enter your first real thing',
    owner: 'adopter',
    what: 'Add one real account, one real giving record, or one real ministry — whatever is closest.',
    when: 'When you are ready to make it yours. There is no rush and no wrong order.',
    why: 'The moment your real data lands, the system starts working for you specifically — and the example bows out.',
    how: [
      'Pick the surface closest to your life (Books, Church, or your business pipeline).',
      'Add one real record.',
      'Watch the example data step aside as your real picture takes over.',
    ],
  },
  {
    id: 'tell-us',
    title: 'Tell us what is rough',
    owner: 'adopter',
    what: 'Use in-app feedback the moment something confuses or frustrates you.',
    when: 'Anytime, from anywhere in the app.',
    why: 'Your feedback becomes a tracked Concern & Solution. The system is built to get better for you, perpetually.',
    how: [
      'Open feedback (the rating/area form).',
      'Say what is working, what is not, and what is missing.',
      'It lands on the Concerns & Solutions board and is worked — not lost.',
    ],
  },
];

/** The journey, optionally tailored by adopter type (today the same spine for all). */
export function journeyFor(type) {
  const known = ADOPTER_TYPES.some((a) => a.key === type);
  // The spine is universal; the "choose-starter" step is what specializes per type.
  return ONBOARDING_JOURNEY.map((step) =>
    step.id === 'choose-starter' && known
      ? { ...step, what: step.what + ` (you picked: ${type}).` }
      : step,
  );
}

/** Just the steps an adopter does themselves (self-serve), in order. */
export function adopterSteps() {
  return ONBOARDING_JOURNEY.filter((s) => s.owner === 'adopter');
}

// Honest flags — the parts of the offer that are Darrell's calls, not the
// system's. Surfaced so onboarding never implies these are settled.
export const DECISIONS_PENDING = [
  'The aligned-brand sponsor roster and the sponsor-to-family ratio (business/financial decision).',
  'Final paid-tier pricing confirmation.',
  'Which Tier-C isolation phases (granular consent, minor accounts, multi-tenant office product) get Darrell’s go to build.',
];
