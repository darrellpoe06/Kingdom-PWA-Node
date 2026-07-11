// =============================================================================
// church-own-door — COLG's own app at thechurchofthelivinggod.com (the plan)
// =============================================================================
// Declared by Darrell 2026-07-10: "Like or similar to Moore Divahs, The Church
// Of The Living God Pillar And Ground Of The Truth in Champaign, IL needs its
// own app — thechurchofthelivinggod.com. Opportunities and constraints?
// Strategies based on our hardware and missions." (DR-0133.)
//
// REALITY-TRACE (DR-0061 / P15):
//   - Verified hardware is READ from the device register (church-devices.js)
//     via doorHardwareReadiness() — never re-stated here.
//   - Every DR this plan stands on is RESOLVED against the live build-parsed
//     ledger (resolveDoorPlan) — a dead ref reads "not in the ledger" (DR-0076),
//     it never silently stands on nothing.
//   - Site facts about the church's current website carry provenance + an
//     observed date; the plan itself declares when it was recorded (the P30
//     freshness pattern DR-0121 §1 requires while no live source exists yet).
//   - Every opportunity carries a re-review date (DR-0075); every Tier C phase
//     names the governor gate it waits on (RELEASE-TIERS: COLG-facing = Tier C,
//     doctrine governed by Bishop Gwin per DR-0003).
//
// All three honesty rules are machine-checked by church-own-door.test.js
// (proven-to-catch). PURE (no React, no network) — ChurchInfraPlan.jsx renders it.
// =============================================================================
import { SEED_DEVICES } from './church-devices.js';

// When this plan was last reviewed against reality. A surface rendering the plan
// shows this date — unknown freshness never reads as fresh (DR-0076 / DR-0125).
export const DOOR_PLAN_RECORDED = '2026-07-10';

export const DOOR_DOMAIN = 'thechurchofthelivinggod.com';

// The church's shareable front-door on poetech.us (DR-0174): the static
// entry page (public/lovecorner/index.html) that previews as the church in a
// texted link, then meta-refreshes into ?view=church. Every share surface
// (QR, texted link) encodes THIS url. Mirrors Moore's MOORE_SHARE_URL.
export const SHARE_DOOR_URL = 'https://poetech.us/lovecorner/';
export const SHARE_DOOR_ALIASES = ['/church', '/thelovecorner'];
export const INSTALL_MANIFEST = '/manifest-lovecorner.webmanifest';

// --- What is TRUE about the church's current web presence (verified, sourced) --
export const SITE_FACTS = [
  {
    id: 'fact-domain-owned',
    fact: `The church already owns and operates ${DOOR_DOMAIN} — this is a migration, not a new purchase. DR-0003 records it as the Church entity's canonical, doctrine-gated domain.`,
    provenance: 'DR-0003 (entity model); bg@thechurchofthelivinggod.com is live in the sermon-prep ingest (migration 0067, infra/church-media-golive)',
  },
  {
    id: 'fact-site-mistitled',
    fact: 'The live site\'s HTML title reads "THE LOVE CORNER - HOME" — it does not identify as Church of the Living God, the single biggest reason the church is invisible in search.',
    provenance: 'observed 2026-05-31 (docs/99-session-notes/2026-05-31-colg-seo-and-seasonal-marketing-plan.md)',
  },
  {
    id: 'fact-seo-invisible',
    fact: 'COLG is absent from the Google local pack despite being one of the largest African American churches in Champaign-Urbana; the site has no structured data and no on-domain sermon content.',
    provenance: 'observed 2026-05-31 (SEO plan session note)',
  },
  {
    id: 'fact-platform-unreconciled',
    fact: 'The site platform is UNRECONCILED: the 2026-05-31 read said Weebly; the 2026-06-02 DNS audit found Turbify (legacy Yahoo Small Business, registrar Tucows, IP 199.34.228.72). Needs eyes-on before a migration plan is trusted.',
    provenance: 'conflict between 2026-05-31 SEO note and 2026-06-02 Hostinger audit — honestly unresolved (DR-0076)',
  },
  {
    id: 'fact-factory-proven',
    fact: 'The pattern is already proven: Moore Divahs runs as a registry row on the ONE door engine (?biz=<slug> routes any registered business), with its own manifest, entry page, and share URL on poetech.us.',
    provenance: 'DR-0114 (client business factory); business-registry.js; PR #703 (one door engine, Moore = row 1)',
  },
  {
    id: 'fact-church-plumbing-exists',
    fact: 'The church already has tenant plumbing the door can stand on: the join_church_instance resolver scopes every church surface to the one COLG instance, and the default-church home record (services, address, live worship channel, giving link) is public-by-design.',
    provenance: 'church-instance.js; default-church.js; resolve-church.js',
  },
];

// --- The mission rails the door must run on (binding, not preferences) ---------
export const MISSION_RAILS = [
  {
    id: 'rail-doctrine',
    rail: 'Doctrine-gated, Word-first: nothing publishes on the church\'s domain without human/doctrine approval. Bishop Gwin governs — not the Poe family, never the agent.',
    source: 'DR-0003; The Source of Answers (CLAUDE.md)',
  },
  {
    id: 'rail-accessibility',
    rail: 'Accessibility is the default, non-negotiable: WCAG AA minimum, large text standard, voice input, read-aloud, big tap targets, no required password typing. The staff are called to ministry, not system administration — nobody has to understand it for it to work on Sunday.',
    source: 'COMMUNITY-FIRST-MISSION commitment 2',
  },
  {
    id: 'rail-serve-not-extract',
    rail: 'Serve-not-extract: no pricing that prices the named first community out; the church\'s data and footage stay sovereign (on-prem, exportable, no advertising model).',
    source: 'COMMUNITY-FIRST-MISSION; DATA-AS-EMPOWERMENT-NOT-EXTRACTION; DR-0070',
  },
  {
    id: 'rail-generalize',
    rail: 'COLG-first, then generalize: the Church Module grows from COLG\'s real needs to other churches in similar situations — the church door built here becomes the church-door factory, the sibling of the client-business factory.',
    source: 'COMMUNITY-FIRST-MISSION; DR-0114 (the factory precedent)',
  },
];

// --- Phase model ----------------------------------------------------------------
// Statuses mirror church-infra-plan's milestone statuses so the two plans read as
// one discipline on the same surface.
export const DOOR_PHASE_STATUSES = ['planned', 'in-progress', 'verified', 'blocked'];

export function makeDoorPhase(p = {}) {
  return {
    id: p.id || 'phase',
    title: (p.title && String(p.title).trim()) || 'Untitled phase',
    status: DOOR_PHASE_STATUSES.includes(p.status) ? p.status : 'planned',
    tier: p.tier || 'B',                 // RELEASE-TIERS tier of the SHIP step
    gate: p.gate ?? null,                // required (named governor gate) when tier is C
    detail: p.detail || '',
    evidence: p.evidence ?? null,        // required to claim 'verified' (DR-0076)
    drRefs: Array.isArray(p.drRefs) ? p.drRefs : [],
    sortOrder: Number.isFinite(p.sortOrder) ? p.sortOrder : 0,
  };
}

export const DOOR_PHASES = [
  makeDoorPhase({
    id: 'phase-strategy', status: 'verified', tier: 'A',
    title: 'Strategy recorded — opportunities, constraints, and the decision on the ledger',
    detail: 'The full opportunities-and-constraints strategy is a Layer 4 session note; the decision is DR-0133, so Ari\'s notes, the Build tab, and the Perpetual Report derive it from the same ledger this plan resolves against.',
    evidence: 'DR-0133 resolves in the live ledger on this very surface (see the resolution strip); docs/99-session-notes/2026-07-10-colg-own-app-opportunities-and-constraints.md.',
    drRefs: ['DR-0133'],
    sortOrder: 10,
  }),
  makeDoorPhase({
    id: 'phase-door-build', status: 'planned', tier: 'C',
    title: 'The church\'s door on the ONE door engine — a registry row, not a new app',
    detail: 'A church row in the door registry (brand, tabs, instance, manifest, share URL) rendered by the same engine that serves Moore Divahs: public faces first (services, live worship, giving, sermon library), steward faces for church staff behind their real roles. One engine, one CRM, one tenancy wall — never a fork.',
    gate: 'Tier C: COLG-facing identity — Bishop Gwin doctrine sign-off + Governor review before the public door opens (RELEASE-TIERS; DR-0003).',
    drRefs: ['DR-0114', 'DR-0133'],
    sortOrder: 20,
  }),
  makeDoorPhase({
    id: 'phase-install-identity', status: 'verified', tier: 'C',
    title: 'Installable under the church\'s own name — entry page, manifest, share QR',
    detail: 'The Moore pattern applied and SHIPPED (DR-0174): public/lovecorner/index.html is the church-tagged entry page (a texted link previews as THE CHURCH, then meta-refreshes into ?view=church); manifest-lovecorner.webmanifest carries the church\'s own name so Add-to-Home-Screen installs "The Love Corner"; /church + /thelovecorner are the share aliases. Icons reuse the platform art until COLG supplies its own (routed). Cleared to open — approved by the church, going live for the congregation ahead of the National Assembly.',
    gate: 'CLEARED 2026-07-11: approved by the Governor — Darrell, COLG Director of Technology — and Bishop Gwin, for release ahead of the Assembly (DR-0003 / DR-0133 gate satisfied).',
    evidence: 'Approved by Darrell (COLG Director of Technology) + Bishop Gwin, 2026-07-11; shipped via PR #787.',
    drRefs: ['DR-0114', 'DR-0174'],
    sortOrder: 30,
  }),
  makeDoorPhase({
    id: 'phase-content-flywheel', status: 'in-progress', tier: 'B',
    title: 'The content flywheel points at the church\'s own domain',
    detail: 'One service recording fans out to sermon pages, songs, lessons, and Scripture — hosted where they compound the CHURCH\'s domain authority, not a platform\'s. The sermon-prep ingest on the church\'s own email is already live; structured data and the Google Business Profile ride this phase.',
    evidence: 'bg@thechurchofthelivinggod.com sermon-prep ingest is live (gmail_ingest.py; migration 0067). The rest is planned.',
    drRefs: ['DR-0133'],
    sortOrder: 40,
  }),
  makeDoorPhase({
    id: 'phase-domain-cutover', status: 'planned', tier: 'C',
    title: `${DOOR_DOMAIN} points at the door — the mis-title dies`,
    detail: 'DNS cutover from the aging Turbify/Weebly site to the church\'s door. Kills the "THE LOVE CORNER" title, puts the church\'s true name, address, services, and structured data on its own domain. DNS is the governor\'s hand — never automated; the deploy is PROVEN, not assumed (a real probe on the new address before the old site is released).',
    gate: 'Tier C: Bishop Gwin decides the cutover; Darrell drives DNS at the registrar; DR-0107 prove-the-deploy applies to the church\'s domain exactly as to poetech.us.',
    drRefs: ['DR-0107', 'DR-0114'],
    sortOrder: 50,
  }),
  makeDoorPhase({
    id: 'phase-sovereign-services', status: 'planned', tier: 'C',
    title: 'The church\'s hardware serves the church\'s door',
    detail: 'The verified sanctuary rigs (read live from the register below) grow into the door\'s sovereign backend: on-prem sermon transcription feeding the sermon library, the live-worship embed, and — when the infra plan\'s rig lands — local AI that never ships the church\'s data out of the building. Never on the livestream box during services (DR-0012).',
    gate: 'Rides the Church Infrastructure Plan\'s own gates (fairness gate on any recognition work; three brakes on any autonomous lane).',
    drRefs: ['DR-0132', 'DR-0133'],
    sortOrder: 60,
  }),
];

// --- Opportunities (ranked; every one carries a re-review date — DR-0075) -------
export const DOOR_OPPORTUNITIES = [
  {
    id: 'opp-door-row', rank: 1,
    title: 'Church row on the one door engine',
    detail: 'The registry-row pattern means the church\'s app is mostly configuration over proven machinery — door, tenancy, roles, messages, and capture already exist and are RLS-tested. The build cost is the church\'s faces (services, live worship, giving, sermons), not new infrastructure.',
    pairsWith: 'DR-0114; PR #703 (one door engine)',
    reReview: '2026-07-24',
  },
  {
    id: 'opp-domain-reconcile', rank: 2,
    title: 'Reconcile the platform discrepancy, then write the cutover runbook',
    detail: 'Weebly-observed vs Turbify-audited must be resolved with eyes on the actual hosting account before any migration step is trusted. The output is a paste-ready runbook for the registrar/DNS steps that are Darrell\'s and Bishop Gwin\'s hands.',
    pairsWith: 'DR-0076 (verify before trusting); WAYS-REVIEW (the team\'s hands, not only the agent\'s)',
    reReview: '2026-07-24',
  },
  {
    id: 'opp-seo-flywheel', rank: 3,
    title: 'On-domain sermon pages + structured data + Google Business Profile',
    detail: 'The 2026-05-31 SEO plan\'s highest-leverage moves become real the day the door serves the domain: the church\'s true name in the title, Schema.org Church markup, service times, and a sermon page per recording. Search visibility for the largest African American congregation in C-U is a mission outcome, not marketing polish.',
    pairsWith: '2026-05-31 SEO plan; phase-content-flywheel',
    reReview: '2026-08-07',
  },
  {
    id: 'opp-giving', rank: 4,
    title: 'Online giving through a church-purpose platform',
    detail: 'The Hostinger audit\'s highest community-impact recommendation: giving on the church\'s own domain via a church-purpose processor (Givelify/Tithe.ly class) — explicitly Bishop Gwin\'s decision, real money, Tier C.',
    pairsWith: '2026-06-02 audit rec #5; ChurchGiving surface',
    reReview: '2026-08-07',
  },
  {
    id: 'opp-church-factory', rank: 5,
    title: 'Generalize: the church-door factory',
    detail: 'Everything COLG\'s door proves (registry row, doctrine gate, accessibility rails, sovereign backend) becomes the repeatable offer for other churches in similar situations — the Church Module\'s COMMUNITY-FIRST commitment made shippable.',
    pairsWith: 'COMMUNITY-FIRST-MISSION; CLIENT-BUSINESS-FACTORY',
    reReview: '2026-08-21',
  },
];

// --- Constraints (verified, carried — each a durable fact, not a mood) ----------
export const DOOR_CONSTRAINTS = [
  {
    id: 'con-doctrine-gate',
    constraint: 'Every public face on the church\'s domain is doctrine-gated: Bishop Gwin\'s approval precedes publish. The agent builds and stages; it never publishes church-facing content on its own authority.',
    source: 'DR-0003; GOVERNANCE-EXECUTION-ADVISORY',
  },
  {
    id: 'con-tier-c',
    constraint: 'COLG-facing surfaces are Tier C by definition — structured family review + Quality Gatekeeper sign-off, never the fast lane. The strategy and staff-internal plan surfaces (this one) ride the normal lane; the public door does not.',
    source: 'RELEASE-TIERS',
  },
  {
    id: 'con-governor-hands',
    constraint: 'DNS, commercial terms, brand assets, and access grants are the governor\'s hand — named manual steps with paste-ready runbooks, never automated.',
    source: 'DR-0114 §3 (the factory\'s non-automated steps)',
  },
  {
    id: 'con-livestream-box',
    constraint: 'No AI inference on the livestream box during live services. Sunday is load-bearing; the broadcast chain outranks every batch job.',
    source: 'DR-0012; church-infra-plan notes',
  },
  {
    id: 'con-vram-ceiling',
    constraint: 'The verified towers cap at 12 GB VRAM each — sovereign services size to that reality (14B-class LLM, schnell-class image) until the planned rig is purchased and verified. The 5x3090 rig remains UNVERIFIED for purchase.',
    source: 'device register (nvidia-smi 2026-07-08); PLANNED_RIG caveat',
  },
  {
    id: 'con-no-sandbox-route',
    constraint: 'The cloud build sandbox has no route to poetech.us, the church LAN, or the church\'s domain — live verification is the family\'s reviewer pass (DR-0104) and the outside-in site-health probe (DR-0125), which must extend to the church\'s domain at cutover.',
    source: 'DR-0104; DR-0125; verified sandbox egress limits',
  },
];

// --- Hardware readiness, READ from the device register (single source of truth) --
// The door's sovereign-backend story is only as real as the register says. This
// derives — it never re-states a spec.
const READINESS_TYPES = ['gpu-node', 'led-wall', 'led-processor', 'switcher', 'camera', 'nas', 'network', 'audio-console'];
export function doorHardwareReadiness(devices = SEED_DEVICES) {
  const rows = (devices || []).filter((d) => READINESS_TYPES.includes(d.deviceType));
  const byType = {};
  for (const t of READINESS_TYPES) byType[t] = [];
  for (const d of rows) byType[d.deviceType].push(d);
  return {
    total: rows.length,
    gpuNodes: byType['gpu-node'],
    broadcast: [...byType['led-wall'], ...byType['led-processor'], ...byType.switcher, ...byType.camera, ...byType['audio-console']],
    storage: byType.nas,
    network: byType.network,
  };
}

// --- Resolution against the live ledger (nothing stands on a dead ref) ----------
export function resolveDoorPlan(ledger, phases = DOOR_PHASES) {
  const byId = new Map(((ledger && ledger.items) || []).map((d) => [d.id, d]));
  const refs = new Map();
  for (const p of phases) for (const r of p.drRefs) if (!refs.has(r)) refs.set(r, byId.get(r) || null);
  return Array.from(refs.entries()).map(([drRef, hit]) => ({
    drRef,
    found: !!hit,
    drTitle: hit ? (hit.title || '') : '',
    drDate: hit ? (hit.date || '') : '',
  }));
}

// --- The honesty gate (proven-to-catch in church-own-door.test.js) --------------
export function validateDoorPlan({
  phases = DOOR_PHASES, opportunities = DOOR_OPPORTUNITIES,
  facts = SITE_FACTS, constraints = DOOR_CONSTRAINTS,
} = {}) {
  const errors = [];
  for (const p of phases) {
    if (!DOOR_PHASE_STATUSES.includes(p.status)) errors.push(`${p.id}: unknown status "${p.status}"`);
    if (p.status === 'verified' && !p.evidence) errors.push(`${p.id}: "verified" needs evidence (DR-0076)`);
    if (p.tier === 'C' && !p.gate) errors.push(`${p.id}: a Tier C phase must NAME its governor gate`);
    if (!p.drRefs.length) errors.push(`${p.id}: a phase must cite the decision(s) it stands on`);
    for (const r of p.drRefs) if (!/^DR-\d{4}$/.test(r)) errors.push(`${p.id}: bad DR ref "${r}"`);
  }
  for (const o of opportunities) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(o.reReview || ''))) errors.push(`${o.id}: opportunity missing its re-review date (DR-0075)`);
  }
  for (const f of facts) {
    if (!f.provenance || !String(f.provenance).trim()) errors.push(`${f.id}: fact missing provenance (DR-0076)`);
  }
  for (const c of constraints) {
    if (!c.source || !String(c.source).trim()) errors.push(`${c.id}: constraint missing its source`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(DOOR_PLAN_RECORDED)) errors.push('DOOR_PLAN_RECORDED must be a real date (P30 freshness)');
  return { ok: errors.length === 0, errors };
}
