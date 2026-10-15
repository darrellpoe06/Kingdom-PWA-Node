// =============================================================================
// nav-items — the one list of top-level sections, in the order Darrell set
// =============================================================================
// Until 2026-10-15 this array lived inline in the shell's <TopNavRow>
// (poe-financial-mvp-v28.jsx), and the shell was frozen at its line budget. The
// Heritage redesign (DR-1046) draws the same sections in three places — the top
// tab strip on a phone or tablet, the sidebar at laptop width, and the five-tab
// bottom bar's More menu on a phone — so the list moved here, UNCHANGED: every
// id, every gate, every comment and the order are the shell's, byte for byte,
// and feedback-area-guard scans THIS array now (the top-level-nav comment
// marker is what it walks back from). The ids are the contract: FEEDBACK_AREAS,
// lib/nav-history's VALID_VIEWS and the deep-link parser all key on them, and
// the redesign may regroup or restyle them and may not rename, merge or drop one.
//
// A 6-area CLUSTER nav was tried in #381 and reverted 2026-06-26 ("lost the
// tabs"): the familiar flat row stays the phone and tablet nav. The sidebar
// groups the same tabs with every one of them visible, and the groups are
// presentation only (NAV_GROUPS) — nothing is behind a click that was not
// before.
import React from 'react';
import UiIcon from '../components/UiIcon.jsx';
import { DmUnreadBadge } from '../components/shared.jsx';
import { tierMeets } from './tiers.js';
import { canSeeHealthTab } from './health-actions.js';
import { isPublicHost } from './access-gate.js';

/**
 * The top-level tabs as [id, label] pairs, gated exactly as the shell gated
 * them. `label` is the tab's JSX (icon + words). The separator pair
 * ['__sep__', null] marks where the first group ends.
 */
export function navItems({
  isAssistantAcct = false, isFamilyMember = false, authSession = null, isStudyCircle = false,
  healthPrograms = null, userTier = null, reviewerMode = false, churchDoorOnly = false,
} = {}) {
  return [
    ['overview','Big Picture'],
    ['books','Books'],
    ['inbound', <><UiIcon name="phone" /> Inbound</>],
    ['rentals','Real Estate'],
    ['properties','Properties'],
    ['projects','Projects'],
    // TLC — the unified TLC Therapy Solutions office. Operators
    // (family/Governor or a business-tier account) get ONE entry that
    // holds all three TLC surfaces (Practice, Intake, Assistant) as
    // sub-tabs; a plain premium user still reaches standalone Practice.
    // The individual routes stay valid for deep-links either way.
    // A granted ASSISTANT (DR-0271) gets the standalone Assistant
    // entry instead — its whole reach.
    ...(isAssistantAcct ? [['tlc-assistant', <><UiIcon name="heart" /> Assistant</>]]
      : (isFamilyMember || tierMeets(userTier, 'business')) ? [['tlc', <><UiIcon name="heart" /> TLC</>]]
      : [['practice','Practice']]),
    ['opportunities','Dev/Ops'],
    ['about','About'],
    ['__sep__', null],
    // Messages — encrypted 1:1 + roster group threads, app-wide
    // (Darrell 2026-07-25: "how can he message me whenever
    // encrypted?"). Open to every signed-in user.
    ['messages', <><UiIcon name="chat" /> Messages<DmUnreadBadge /></>],
    ['notes', <><UiIcon name="dove" /> Notes</>],
    // Create — the document / image creation workspace (Notes group:
    // capture (Notes) -> reflect (Study) -> compose/produce (Create)).
    // Available to every signed-in user; persistence is instance-scoped.
    ['create', <><UiIcon name="palette" /> Create</>],
    // Voice — "listen to anything" in a chosen voice; consent-gated
    // personal (cloned) voices as a subscriber feature. Notes group
    // sibling (capture -> reflect -> compose -> hear).
    ['voice', <><UiIcon name="volume" /> Voice</>],
    // Scribe — record workflows on screen + meetings (2026-07-27 review); steward-only Phase 1, no-leak spread.
    ...(isFamilyMember ? [['scribe', <><UiIcon name="monitor" /> Scribe</>]] : []),
    // Library — books assembled from the house's own corpus, with an
    // in-app reader whose chapters deep-link back into the live app
    // (the books<->app flywheel). Reading is open to every signed-in
    // user; the build Studio is family/Governor-gated inside.
    ['library', <><UiIcon name="bookOpen" /> Library</>],
    // Chef's Corner — the recipe surface (starts with the Poe Family
    // Vegan Recipes by Chef Mario). Open to every signed-in user;
    // persistence is instance-scoped (family-private).
    ['recipes', <><UiIcon name="chefHat" /> Chef's Corner</>],
    ...(canSeeHealthTab(isFamilyMember, healthPrograms) ? [['health', <><UiIcon name="chart" /> Road to 150</>]] : []),
    // Games — the family games hub ("our games"). Open to everyone
    // (the children most of all); the first game walks an African
    // American life journey, measured by Yahweh. Persistence is
    // instance-scoped and local-first.
    ['games', <><UiIcon name="dice" /> Games</>],
    // TV Time — the friend-group show tracker + discussion (Darrell
    // 2026-07-04). Open to everyone; a PWA-native home for the circle
    // when their old app shut down. Local-first, private to the device.
    ['tvtime', <><UiIcon name="monitor" /> TV Time</>],
    // Advocacy — the Case File: dated documentation of a student's
    // (or anyone's) situations with an institution, so the family
    // asks for help with the data already in hand (2026-08-04).
    ['advocacy', <><UiIcon name="landmark" /> Advocacy</>],
    ['databack', <><UiIcon name="landmark" /> Your Data</>],
    ...(isFamilyMember ? [['cameras', <><UiIcon name="eye" /> Cameras</>]] : []),
    ...(authSession?.user ? [['vault', <><UiIcon name="lock" /> Vault</>]] : []),
    // Darrell's Study — private to the circle (Darrell/Christina/BG).
    // Spread so the entry is absent from the DOM entirely for everyone
    // else (no-leak); the feedback-area-guard still sees the literal
    // pair below and requires its 'study' feedback area.
    ...(isStudyCircle ? [['study', <><UiIcon name="book" /> Study</>]] : []),
    ['church','Church'],
    ['markets','Markets'],
    // Command, Control & Serve Center — the steward's seat (the
    // cockpit from which the app is built + observed). Family/Governor
    // only; spread so the entry is absent from the DOM entirely for
    // everyone else (no-leak), like Study. The component carries a
    // defense-in-depth locked fallback for any deep-link.
    ...(isFamilyMember ? [['center', <><UiIcon name="sliders" /> Center</>]] : []),
    // CRM — the one shared acquisition backbone every funnel rides.
    // Family/Governor only (steward tooling across all businesses);
    // spread so the entry is absent from the DOM for everyone else.
    ...(isFamilyMember ? [['crm', <><UiIcon name="users" /> CRM</>]] : []),
    // Relationships — the relationship permission model (guardian<->
    // child, family, landlord<->tenant/manager). Family/Governor AND
    // the Business tier (Darrell 2026-07-08, DR-0128: the delegation
    // matrix IS a business feature; RLS keeps the boundary). No-leak.
    ...((isFamilyMember || tierMeets(userTier, 'business')) ? [['relationships', <><UiIcon name="users" /> Relationships</>]] : []),
    // Inventory — a real inventory-control system of record (derived
    // on-hand over an immutable movement ledger). Family/Governor only
    // (operations tooling); spread so the entry is absent from the DOM
    // for everyone else, like Center / CRM.
    ...(isFamilyMember ? [['inventory', <><UiIcon name="tools" /> Inventory</>]] : []),
    // Moore Divahs — Shay's fashion business system (DR-0113 board;
    // discovery 2026-07-07). The steward door: orders + the 3-week
    // clock + change-order ladder. Family/Governor only for now (the
    // customer-facing door ships separately as the branded /moore
    // boot); spread so the entry is absent from the DOM for everyone
    // else (no-leak), like Center / CRM.
    ...(isFamilyMember ? [['moore', <><UiIcon name="palette" /> Moore Divahs</>]] : []),
    // Forecast — the financial-engineering / forward-projection layer.
    // Family/Governor only (it models the family's real money); spread
    // so the entry is absent from the DOM for everyone else (no-leak),
    // and the component carries a locked fallback for any deep-link.
    ...(isFamilyMember ? [['forecast', <><UiIcon name="chart" /> Forecast</>]] : []),
    // Academy — the PoeTech Academy. Open to everyone as a parent-facing
    // INVITE (the value/ROI pitch + register-interest): prospective
    // families must be able to see it to decide. The operations CONSOLE
    // inside (enroll, tuition, team, week-4 retro) stays operator-gated —
    // the component renders the invite for non-operators and the console
    // only for family/Governor or a business-tier operator.
    ['cohorts', <><UiIcon name="bookOpen" /> Academy</>],
    // Assistant is folded into the unified TLC workspace (above) as a
    // sub-tab — no standalone top-nav entry. The 'tlc-assistant' route
    // stays valid for deep-links; the render block below still serves it.
    // Admin — same gate as the render below (tab and surface never
    // disagree): family stewards anywhere; home host only in the
    // OPEN no-session state — a signed-in guest on the house WiFi
    // gets no Admin (DR-0241: the network trusts devices, not sessions).
    ...((!reviewerMode && (isFamilyMember || (!isPublicHost() && !authSession))) ? [['admin', <><UiIcon name="lock" /> Admin</>]] : []),
  ].filter(([id]) => (!churchDoorOnly || id === 'church')
     && (!isAssistantAcct || ['tlc-assistant', 'messages', 'about'].includes(id)))
   .map(([id, label]) => [id, label] /* top-level-nav */);
}

/** The plain words of a tab, for places that cannot render its JSX (aria, More). */
export const NAV_WORDS = {
  overview: 'Big Picture', books: 'Books', inbound: 'Inbound', rentals: 'Real Estate', properties: 'Properties',
  projects: 'Projects', 'tlc-assistant': 'Assistant', tlc: 'TLC', practice: 'Practice', opportunities: 'Dev/Ops',
  about: 'About', messages: 'Messages', notes: 'Notes', create: 'Create', voice: 'Voice', scribe: 'Scribe',
  library: 'Library', recipes: "Chef's Corner", health: 'Road to 150', games: 'Games', tvtime: 'TV Time',
  advocacy: 'Advocacy', databack: 'Your Data', cameras: 'Cameras', vault: 'Vault', study: 'Study', church: 'Church',
  markets: 'Markets', center: 'Center', crm: 'CRM', relationships: 'Relationships', inventory: 'Inventory',
  moore: 'Moore Divahs', forecast: 'Forecast', cohorts: 'Academy', admin: 'Admin',
};

/** One UiIcon per tab, for the sidebar and the bottom bar (DR-0198: never a raw emoji in chrome). */
export const NAV_ICONS = {
  overview: 'chart', books: 'coins', inbound: 'phone', rentals: 'home', properties: 'home', projects: 'folder',
  'tlc-assistant': 'heart', tlc: 'heart', practice: 'heart', opportunities: 'tools', about: 'globe',
  messages: 'chat', notes: 'dove', create: 'palette', voice: 'volume', scribe: 'monitor', library: 'bookOpen',
  recipes: 'chefHat', health: 'chart', games: 'dice', tvtime: 'monitor', advocacy: 'landmark', databack: 'landmark',
  cameras: 'eye', vault: 'lock', study: 'book', church: 'cross', markets: 'chart', center: 'sliders', crm: 'users',
  relationships: 'users', inventory: 'tools', moore: 'palette', forecast: 'chart', cohorts: 'bookOpen', admin: 'lock',
};

/**
 * The sidebar's groups: presentation only. Every id in navItems() lands in
 * exactly one group; an id this map does not know lands in the first group,
 * so a tab added later is never dropped from the sidebar (navGroups proves it).
 */
export const NAV_GROUPS = [
  { key: 'family',   label: '',         ids: ['overview', 'books', 'messages', 'rentals', 'properties', 'projects', 'tlc', 'practice', 'tlc-assistant'] },
  { key: 'soul',     label: 'Soul',     ids: ['church', 'study', 'library', 'cohorts'] },
  { key: 'create',   label: 'Create',   ids: ['notes', 'create', 'voice', 'scribe'] },
  { key: 'life',     label: 'Life',     ids: ['recipes', 'health', 'games', 'tvtime', 'advocacy', 'databack', 'vault', 'cameras'] },
  { key: 'business', label: 'Business', ids: ['inbound', 'crm', 'relationships', 'inventory', 'moore', 'forecast', 'markets', 'opportunities'] },
  { key: 'system',   label: 'System',   ids: ['center', 'admin', 'about'] },
];

/**
 * Group the gated pairs for the sidebar / More: [{ key, label, items: [[id, label], ...] }],
 * groups with no items omitted, every input pair (except the separator) present exactly once.
 */
export function navGroups(items = []) {
  const pairs = items.filter(([id]) => id !== '__sep__');
  const seen = new Set();
  const out = NAV_GROUPS.map((g) => {
    const got = [];
    for (const id of g.ids) {
      const p = pairs.find(([pid]) => pid === id);
      if (p && !seen.has(id)) { got.push(p); seen.add(id); }
    }
    return { key: g.key, label: g.label, items: got };
  });
  const strays = pairs.filter(([id]) => !seen.has(id));
  if (strays.length) out[0].items.push(...strays);
  return out.filter((g) => g.items.length > 0);
}

/** The five the phone's bottom bar shows outside the reader (DR-1046); the rest ride More. */
export const BOTTOM_NAV = [
  { key: 'home',       view: 'overview', home: 'lifehub', icon: 'home',  words: 'Home' },
  { key: 'bigpicture', view: 'overview', home: 'current', icon: 'chart', words: 'Big Picture' },
  { key: 'books',      view: 'books',    home: null,      icon: 'coins', words: 'Books' },
  { key: 'messages',   view: 'messages', home: null,      icon: 'chat',  words: 'Messages' },
];
