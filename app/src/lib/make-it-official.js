// =============================================================================
// make-it-official — the steps that turn PoeTech's work into owned assets, and
// whether each one has its paper yet (DR-1075)
// =============================================================================
// Darrell, 2026-10-16: "what should be proprietary and how to get that official
// so we can include people and companies... My wife is interested in taking care
// of this asap." Then: "How does Christina get information about the IP
// information... where is the documentation... why isn't it obvious?"
//
// WHY THIS EXISTS. The plan lived in four repository documents (the IP register,
// the attorney pack, the reinstatement runbook, the 2026-10-16 research review).
// None of them is reachable from the app, so the person asked to drive the work
// had nowhere to look. This module puts the ORDER and the OWNERS on Books ->
// Legal, beside the shelves where the paper goes.
//
// REALITY-TRACE (DR-0061 / P15), stated before the code:
//   • REAL DATA — a step's state is computed from the viewer's own
//     `legal_documents` rows (migration 0180) on the Business shelf. A step
//     reads DONE only when a document of its evidence type, dated on or after
//     PLAN_STARTED, sits there. Nobody ticks a box; the paper is the tick.
//   • NOTHING PAINTED — the steps themselves are dated PLATFORM content, like
//     ip-portfolio.js. The entity's status is NEVER written here: it lives with
//     the Secretary of State, and the IpRegisterPanel gate already refuses a
//     painted status. Step 1 is "go and read it", not "it is dissolved".
//   • WHAT IT IS NOT — the shelf is creator-only (0180's RLS). Paper Christina
//     files on her own account shows on hers, not on Darrell's. The surface
//     says so rather than implying one shared checklist.
//
// PURE: no browser APIs, no storage, no network. Node-testable.
// Not legal advice. Every step names who owns it; counsel drafts the papers.
// =============================================================================

import { normalizeDocuments } from './legal-documents.js';

// When this plan was written down. Paper older than this is history, not proof
// of a step: a 2018 annual report on the shelf must not read as "registered
// agent chosen". 2026-09-19 is the day the reinstatement runbook decided the
// filing order and the agent choice.
export const PLAN_STARTED = '2026-09-19';
// When the steps below were last revised.
export const STEPS_AS_OF = '2026-10-16';

// The full write-up a reader can ask for. Repo paths, shown as text.
export const PLAN_SOURCES = [
  'docs/99-session-notes/2026-10-16-research-review-what-is-proprietary-and-how-to-make-it-official.md',
  'docs/99-session-notes/2026-09-19-poetech-reinstatement-runbook.md',
  'docs/99-session-notes/2026-09-19-ip-assignment-attorney-pack.md',
  'docs/00-foundations/_root/IP-REGISTER.md',
];

// The Business-shelf document types that prove a step. Every one must exist in
// legal-documents.js's business docTypes, or the picker could never offer it
// and the step could never complete (pinned by the test).
export const EVIDENCE = {
  standing: 'Entity status check (Secretary of State)',
  agent: 'Annual report / registered agent',
  counsel: 'Engagement letter — counsel',
  reinstated: 'Reinstatement filing',
  assignment: 'IP assignment',
  contributor: 'Contributor agreement',
  permission: 'Content permission',
  trademark: 'IP — trademark',
  copyright: 'IP — copyright',
  terms: 'Terms of Use / Privacy Policy',
};

export const PHASES = [
  { id: 'now', label: 'This week' },
  { id: 'next', label: 'Weeks 2–3' },
  { id: 'after', label: 'After good standing returns' },
];

export const OFFICIAL_STEPS = [
  {
    id: 'standing',
    phase: 'now',
    title: 'Read the LLC’s standing, and get the exact amount owed',
    who: 'Christina searches the state’s site. Darrell makes the call, unless Christina is named on the state record or the operating agreement.',
    why: 'Nothing downstream can be signed into an entity that is not in good standing. The state discusses an entity only with people on its record.',
    how: 'Search the Illinois business entity search for POE TECH. Then call Business Services at 217-524-8008, write down the exact total, and ask whether reinstatement relates back. Shelve the result as a pointer or a screenshot.',
    evidence: EVIDENCE.standing,
    requires: [],
  },
  {
    id: 'agent',
    phase: 'now',
    title: 'Choose a commercial registered agent',
    who: 'Christina chooses. Darrell’s card pays.',
    why: 'A missed annual-report notice is how the LLC lapsed. An agent with scan-to-email and reminders closes that gap for good.',
    how: 'Pick a service with an Illinois address, scan-and-forward to email, and annual-report reminders. Shelve the confirmation.',
    evidence: EVIDENCE.agent,
    requires: [],
  },
  {
    id: 'counsel',
    phase: 'now',
    title: 'Book one business attorney, for one engagement',
    who: 'Christina.',
    why: 'One engagement covers the reinstatement question, the IP assignment, and the agreements that let people and companies join. Five separate engagements cost more and drift.',
    how: 'Hand over the attorney pack, the 2026-10-16 research review, and the 2018 operating agreement. Shelve the engagement letter.',
    evidence: EVIDENCE.counsel,
    requires: [],
  },
  {
    id: 'reinstated',
    phase: 'next',
    title: 'File the reinstatement, with the agent change inside it',
    who: 'Christina assembles. Darrell signs and pays the state’s number.',
    why: 'This is the step that returns the LLC to good standing, which every later step waits on.',
    how: 'Use the form and total the state named in step 1. Shelve the filed copy and the state’s acknowledgement.',
    evidence: EVIDENCE.reinstated,
    requires: ['standing', 'agent'],
  },
  {
    id: 'assignment',
    phase: 'after',
    title: 'Sign the IP assignment into the LLC',
    who: 'Darrell signs. The attorney drafts.',
    why: 'Every row on the IP register fails its first test, Owned, until this exists. One document moves the whole register.',
    how: 'Attach a dated printout of the IP register as Schedule A. Names that belong to others stay off it.',
    evidence: EVIDENCE.assignment,
    requires: ['reinstated', 'counsel'],
  },
  {
    id: 'contributor',
    phase: 'after',
    title: 'Put the contributor agreement in place before anyone else builds',
    who: 'The attorney drafts. Every contributor signs.',
    why: 'Paying someone does not transfer what they make. Only a signed, present assignment does, and it is what lets people join with their share written down.',
    how: 'Present assignment, a carve-out for what they bring, credit and pay written down, confidentiality with the federal whistleblower notice, and no non-compete.',
    evidence: EVIDENCE.contributor,
    requires: ['reinstated', 'counsel'],
  },
  {
    id: 'permission',
    phase: 'after',
    title: 'Get the church’s written content permission',
    who: 'The church office and Bishop Gwin sign.',
    why: 'It covers the recordings, transcripts, the sermon library and lessons taught from his messages, and says the church keeps its own rights.',
    how: 'A short letter the attorney drafts. Shelve the signed copy.',
    evidence: EVIDENCE.permission,
    requires: ['reinstated', 'counsel'],
  },
  {
    id: 'trademark',
    phase: 'after',
    title: 'Clear and file “PoeTech” as a trademark',
    who: 'The attorney.',
    why: 'A registered name is what customers recognise and a copycat cannot take.',
    how: 'Clearance search first. Choose the platform’s public name before anything is filed for it.',
    evidence: EVIDENCE.trademark,
    requires: ['assignment'],
  },
  {
    id: 'copyright',
    phase: 'after',
    title: 'Register the human-authored works',
    who: 'The attorney.',
    why: 'Registration is what makes the copyright enforceable in court, and only the owner can register it.',
    how: 'Disclose the AI-assisted portions. The doctrinal corpus and the Worldview are the strongest positions.',
    evidence: EVIDENCE.copyright,
    requires: ['assignment'],
  },
  {
    id: 'terms',
    phase: 'after',
    title: 'Publish Terms of Use and a Privacy Policy in the app',
    who: 'The attorney drafts. We build the acceptance into sign-in.',
    why: 'Needed before strangers sign up through a second church’s door.',
    how: 'Shelve the final text. The in-app acceptance is a separate build once the text exists.',
    evidence: EVIDENCE.terms,
    requires: ['counsel'],
  },
];

const BY_ID = Object.fromEntries(OFFICIAL_STEPS.map((s) => [s.id, s]));
export function stepById(id) { return BY_ID[id] || null; }

// The date a document speaks for: the date written on it, else when it was
// shelved. A document with neither is undated and proves nothing.
function dateOfDoc(d) {
  const raw = d.dateOf || d.createdAt || '';
  return String(raw).slice(0, 10);
}

// The newest Business-shelf document of this type, dated on or after `since`.
export function proofFor(evidence, docs, since = PLAN_STARTED) {
  const hits = normalizeDocuments(docs)
    .filter((d) => d.category === 'business' && d.docType === evidence)
    .filter((d) => { const day = dateOfDoc(d); return day && day >= since; })
    .sort((a, b) => dateOfDoc(b).localeCompare(dateOfDoc(a)));
  return hits[0] || null;
}

// Every step with its derived state:
//   done    — its paper is on the shelf
//   ready   — every step it requires is done, so it can be worked now
//   waiting — named steps must be done first
export function officialSteps(docs = [], steps = OFFICIAL_STEPS) {
  const proofs = Object.fromEntries(steps.map((s) => [s.id, proofFor(s.evidence, docs)]));
  return steps.map((s, i) => {
    const proof = proofs[s.id];
    const waitingOn = s.requires.filter((r) => !proofs[r]);
    const state = proof ? 'done' : waitingOn.length === 0 ? 'ready' : 'waiting';
    return {
      ...s,
      n: i + 1,
      state,
      proof,
      waitingOn: waitingOn.map((r) => ({ id: r, n: steps.findIndex((x) => x.id === r) + 1 })),
    };
  });
}

export function officialProgress(docs = [], steps = OFFICIAL_STEPS) {
  const rows = officialSteps(docs, steps);
  return {
    total: rows.length,
    done: rows.filter((r) => r.state === 'done').length,
    ready: rows.filter((r) => r.state === 'ready'),
    rows,
  };
}
