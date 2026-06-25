// book-flywheel.js — the four loops Darrell named (2026-06-25):
//
//   "produce books that are supported by the PoeTech app in some way or ways,
//    to keep interactions and interest, market the business, and have the
//    learning content feed the development of the app and the skills of the
//    community and the PoeTech app."
//
//   1. KEEP INTERACTION / INTEREST — the book pulls readers INTO the app; app
//      features keep them engaged.
//   2. MARKET THE BUSINESS(ES) — the book is a marketing asset / lead magnet
//      for Church + PoeTech + TLC (feeds the social / CRM engine).
//   3. FEED LEARNING — book content flows into Learn courses + curriculum and
//      back the other way.
//   4. FEED APP + COMMUNITY DEVELOPMENT — reader engagement/feedback feeds the
//      development loop AND builds community SKILLS (read -> reflect ->
//      contribute -> teach; experience over credentials, SKOS).
//
// PUBLISHING IS GATED: nothing goes out without an explicit approve-to-publish
// decision (default-deny), mirroring the orchestrator-handoff / three-brakes
// pattern. The engine produces the book; a human approves the going-out.
//
// PURE: descriptors + gates only. No I/O. The surface wires these to the real
// feedback / discussion / CRM pipes.

import { companionManifest } from './book-engine.js';

const asArr = (v) => (Array.isArray(v) ? v : []);
const asStr = (v) => (typeof v === 'string' ? v : '');

// Which business each book can market for; copy lens differs per audience.
export const BUSINESS_LENS = {
  church: {
    label: 'Church of the Living God',
    promise: 'Grow in the Word with your church family.',
    cta: 'Join us — read, then come deeper in the app.',
    funnel: 'church',
  },
  poetech: {
    label: 'PoeTech',
    promise: 'Sovereign tools that build kings, not slaves.',
    cta: 'See what the app does the page cannot.',
    funnel: 'poetech',
  },
  tlc: {
    label: 'TLC',
    promise: 'Care grounded in truth and dignity.',
    cta: 'Bring this conversation into a supported space.',
    funnel: 'tlc',
  },
};

export function businessLens(key) {
  return BUSINESS_LENS[key] || BUSINESS_LENS.church;
}

// LOOP 1 — keep interaction / interest. The companion wiring: every chapter's
// live surfaces, plus book-level engagement hooks.
export function interactionLoop(book) {
  const companion = companionManifest(book);
  return {
    loop: 'interaction',
    headline: 'The book pulls readers into the live app.',
    companion,
    hooks: [
      { kind: 'reader', label: 'Read in-app', route: companion.readerRoute },
      { kind: 'deep-links', label: 'Per-chapter jumps into lessons, the Word, Scripture, the presenter', count: companion.chapters.reduce((n, c) => n + asArr(c.deepLinks).length, 0) },
      { kind: 'updates', label: 'The app keeps the book current; the static file cannot', enrich: 'live' },
      { kind: 'qr', label: 'A QR / deep link on the printed or exported copy returns to the in-app reader', route: companion.readerRoute },
    ],
  };
}

// LOOP 2 — market the business(es). A lead-magnet descriptor per business,
// shaped to feed the social / marketing + CRM engine.
export function marketingAssetFor(book, businessKey, { nowIso } = {}) {
  const lens = businessLens(businessKey);
  return {
    loop: 'marketing',
    business: businessKey,
    asset: 'book',
    bookId: asStr(book?.id),
    title: asStr(book?.title),
    hook: lens.promise,
    cta: lens.cta,
    funnel: lens.funnel,
    leadMagnet: {
      // What a reader exchanges interest for — and where it lands.
      offer: `Free read: ${asStr(book?.title)}`,
      landingDeepLink: { view: 'library', book: asStr(book?.id) },
      captureFunnel: lens.funnel,         // -> crm-engine adapter
      consentRequired: true,              // never extractive; opt-in only
    },
    createdIso: asStr(nowIso),
  };
}

export function marketingLoop(book, { nowIso } = {}) {
  const businesses = asArr(book?.businesses).length ? book.businesses : ['church'];
  return {
    loop: 'marketing',
    headline: 'The book is a marketing asset for each business it serves.',
    assets: businesses.map((b) => marketingAssetFor(book, b, { nowIso })),
  };
}

// LOOP 3 — feed learning. Reciprocal: a book can become a course/curriculum,
// and course content already became this book. We surface both directions.
export function learningLoop(book) {
  const chapters = asArr(book?.chapters);
  return {
    loop: 'learning',
    headline: 'Book content and Learn courses feed each other.',
    bookToCourse: {
      label: 'Turn this book into a paced course',
      suggestedModules: chapters.map((c) => ({ id: c.id, title: c.title, kind: c.sourceRef?.kind })),
      target: { view: 'church', churchView: 'learn' },
      note: 'Each chapter maps to a lesson in the 5-stage arc (Open -> Teach -> Engage -> Apply -> Send-off).',
    },
    courseToBook: {
      label: 'This book was assembled from existing teaching',
      sources: chapters.map((c) => c.sourceRef?.kind).filter(Boolean),
    },
  };
}

// LOOP 4 — feed app + community development. Reader engagement returns as (a)
// development signal (execution-outcome observability) and (b) community skill
// growth (the reader levels up: read -> reflect -> contribute -> teach).
export const SKILL_LADDER = [
  { rung: 'read',       signal: 'started',   builds: 'exposure',     experience: 'encountered the teaching' },
  { rung: 'reflect',    signal: 'completed', builds: 'understanding', experience: 'worked the material' },
  { rung: 'contribute', signal: 'discussed', builds: 'voice',        experience: 'added to the body' },
  { rung: 'teach',      signal: 'presented', builds: 'mastery',      experience: 'led others (experience over credentials)' },
];

export function communityLoop(book) {
  return {
    loop: 'community',
    headline: 'Reader engagement feeds development AND builds community skills.',
    developmentSignal: {
      label: 'Reactions + feedback feed the development loop',
      feedbackTag: `[Book feedback] ${asStr(book?.title)}`,
      observability: 'execution-outcome-observability',
    },
    skillLadder: SKILL_LADDER,
    contribution: {
      label: 'Readers can discuss, contribute, and graduate to leading',
      discussionKind: 'reflection',
      gradPath: 'reader -> contributor -> facilitator',
    },
  };
}

// The whole flywheel, assembled.
export function flywheel(book, { nowIso } = {}) {
  return {
    bookId: asStr(book?.id),
    interaction: interactionLoop(book),
    marketing: marketingLoop(book, { nowIso }),
    learning: learningLoop(book),
    community: communityLoop(book),
  };
}

// ---------------------------------------------------------------------------
// APPROVE-TO-PUBLISH GATE (default-deny; preview -> approve -> execute)
// ---------------------------------------------------------------------------

// What must be true before a book may go out. Reads the engine's integrity
// report; a book that fails integrity can NEVER be approved.
export function publishRequirements(book) {
  const integ = book?.integrity || {};
  return [
    { id: 'integrity', label: 'Passes integrity (sourced, no fabrication, Scripture verbatim)', met: !!integ.ok },
    { id: 'title', label: 'Has a title', met: !!asStr(book?.title).trim() },
    { id: 'attribution', label: 'Carries attribution + Scripture rights note', met: !!asStr(book?.attribution?.scripture).trim() },
  ];
}

// Evaluate the gate. DEFAULT-DENY: a book is publishable only when every
// requirement is met AND a human has approved. `approval` is the explicit human
// decision ({ approvedBy, approvedIso }); absent it, allowed is false.
export function evaluatePublishGate(book, { approval, channel } = {}) {
  const reqs = publishRequirements(book);
  const unmet = reqs.filter((r) => !r.met);
  const approved = !!(approval && approval.approvedBy);
  const reasons = [];
  unmet.forEach((r) => reasons.push(`Requirement not met: ${r.label}`));
  if (!approved) reasons.push('Awaiting explicit approve-to-publish (human decision).');
  return {
    allowed: unmet.length === 0 && approved,
    approved,
    requirements: reqs,
    unmet: unmet.map((r) => r.id),
    channel: asStr(channel) || 'in-app',
    reasons,
  };
}

// Build the publish hand-off (staged, never auto-dispatched) — shape compatible
// with orchestrator-handoff so it can ride the existing braked lane.
export function buildPublishHandoff(book, { persona, channel, nowIso } = {}) {
  const gate = evaluatePublishGate(book, { channel });
  return {
    kind: 'handoff',
    title: `Publish: ${asStr(book?.title)}`,
    body: `Approve-to-publish for "${asStr(book?.title)}" via ${asStr(channel) || 'in-app'}.`,
    authorPersona: asStr(persona) || null,
    createdAt: asStr(nowIso),
    meta: {
      lane: 'publish',
      action: 'publish-book',
      bookId: asStr(book?.id),
      channel: asStr(channel) || 'in-app',
      gateAllowed: gate.allowed,         // false until approved — preview-only
      gateReasons: gate.reasons,
      dispatchState: 'staged',
    },
  };
}
