// =============================================================================
// ip-portfolio — the PoeTech IP register, as platform content
// =============================================================================
// The rows behind the IP register surface on Books -> Legal. This is PLATFORM
// content, not user data — the same shape as scriptures.js: it describes what
// PoeTech itself owns, so it is instance-agnostic and identical for every
// viewer. A tenant's own IP would be user data and does not belong here.
//
// THE SOURCE OF TRUTH IS docs/00-foundations/_root/IP-REGISTER.md. This module
// is that register transcribed so the app can COMPUTE from it rather than
// depict it. Per the reality-trace rule (P15), nothing on the surface is
// painted: every score, count and bottleneck is derived by ip-register.js from
// these rows, so a row that changes moves the number on the screen.
//
// Usage counts on the marks were measured across docs/00-foundations/_root/*.md
// on 2026-09-06 — evidence of consistent use, which is what trademark rights
// arise from.
//
// EVERY ROW HERE IS HONEST ABOUT WHAT IT IS NOT. Every asset currently
// bottlenecks on "Owned" because no entity holds title and no written
// assignment exists. That is the real position, and the surface says so.
// =============================================================================

import { assetShape } from './ip-register.js';

// Recorded so the surface can date itself rather than implying "now".
export const REGISTER_AS_OF = '2026-09-06';

const mark = (name, uses, note = '') => assetShape({
  name,
  lane: 'trademark',
  authorship: 'human',
  publiclyDisclosed: true,
  protection: 'none',
  fixedOn: REGISTER_AS_OF,
  provenance: [`${uses} uses across docs/00-foundations/_root`],
  notes: note,
});

const work = (name, authorship, provenance, note = '') => assetShape({
  name,
  lane: 'copyright',
  authorship,
  publiclyDisclosed: true,
  protection: 'none',
  fixedOn: REGISTER_AS_OF,
  provenance,
  notes: note,
});

// A method published in a public repo. Trade secret is not available for it,
// and the register says none rather than pretending otherwise.
const method = (name, provenance) => assetShape({
  name,
  lane: 'trade-secret',
  authorship: 'mixed',
  publiclyDisclosed: true,
  protection: 'none',
  fixedOn: REGISTER_AS_OF,
  provenance,
  notes: 'Published in the public repository, so trade-secret protection is not available. Disclosure is not recoverable.',
});

export const IP_PORTFOLIO = [
  // ---- Marks. Unaffected by authorship AND by disclosure, which is why this
  // lane leads for a portfolio built the way this one was.
  mark('PoeTech', 203, 'The house mark. Cleanest and most defensible — file first.'),
  mark('SKOS', 196, 'Clearance risk: collides with the W3C Simple Knowledge Organization System. Screen before spending; a rename now costs far less than a rebrand after launch.'),
  mark('Ari', 75, 'Short mark in a crowded class. Screen carefully.'),
  mark('Council Chamber', 58),
  mark('Quality Gatekeeper', 40, 'Distinctive, and names a real mechanism (DR-0020).'),
  mark('Behavioral Mirror', 19),
  mark('Love Corner', 13, 'Already has a standalone branded door (DR-0174).'),
  mark('OpsBoard', 5),

  // ---- Works. Sorted by authorship, because that is what decides
  // registrability. The human-authored rows are the strongest position here.
  work('Doctrinal corpus — binding rules, Typographic Theology, Color Theology', 'human',
    ['CLAUDE.md', 'DR-0097', 'DR-0099'],
    "Darrell's own declarations. The strongest copyright position in the portfolio."),
  work('The Holy Spirit Integration Worldview', 'human',
    ['docs/00-foundations/_root/THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md'],
    'The source-of-answers spine.'),
  work('Decision-record ledger — 298 records, selection and arrangement', 'human',
    ['docs/decisions/INDEX.md', 'DR-0011'],
    'Dated, attributed provenance most companies cannot produce.'),
  work('Captured spoken teachings', 'human',
    ['CLAUDE.md — Spoken Teachings Are Build Input'],
    "Darrell's words, distilled from his own framing."),
  work('Study Edition clarification layer', 'mixed',
    ['docs/99-session-notes/2026-06-25-poetech-study-edition-base-text-license-research-review.md'],
    'The ownable part. The base texts are public domain and are not ours to own.'),
  work('Living Lessons corpus', 'mixed',
    ['app/src/lib/living-lessons-class.js', 'DR-0168'],
    'Register with the generated portions disclosed.'),
  work('Foundation document set', 'mixed',
    ['docs/00-foundations/_root/'],
    'Human-directed, AI-expressed. Registrable with disclosure.'),
  work('Application source', 'mixed',
    ['app/'],
    'Sort before filing; bulk generated expression is the weakest slice.'),

  // ---- Methods. The lane the public repo already closed.
  method('Deterministic gate suite', ['DR-0076', '.github/workflows/ci.yml']),
  method('Ari orchestration / escalation ladder', ['DR-0056', 'DR-0062']),
  method('Composable Spine contracts', ['DR-0039']),
  method('Workforce Layer QA-gate design', ['DR-0017', 'DR-0020']),
  method('Industry/Role module template', ['DR-0030']),
  method('Council Chamber mechanism', ['docs/00-foundations/_root/COUNCIL-CHAMBER.md']),
];

// Still protectable BECAUSE not yet published — what a posture change would
// actually preserve. Listed separately because these are not register rows
// yet; naming them stops the surface implying everything is already lost.
export const STILL_PROTECTABLE = [
  'Tenant configurations',
  'Prompt libraries',
  'Tuned model weights',
  'Operational runbooks',
  'Customer data',
  'Any future module built private from the outset',
];

// Excluded on purpose, recorded so no later pass "helpfully" adds it.
export const EXCLUDED_MARKS = [
  {
    name: 'The Way',
    why: "Scriptural language (Acts), not a coined mark. Claiming private title over the Word's own language is not ours to do.",
  },
];
