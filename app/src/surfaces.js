// app/src/surfaces.js — the surface-mount REGISTRY (the modular spine).
//
// This is the core file named by DR-0078 / MODULE-ARCHITECTURE-ADR.md §4.3 and
// the HYBRID-MODULAR-IMPLEMENTATION-PLAN (the surface-mount registry contract).
// It is the single place a feature surface declares HOW it loads and WHERE it
// mounts, so that adding/owning a surface stops being a churned edit to the
// monolith's import block (choke-point C1).
//
// Stage 1 (this file) absorbs C1: every lazy `() => import(...)` loader lives
// here exactly once, and the shell imports the resulting lazy components from
// here instead of declaring 23 `const X = lazy(...)` lines inline. The metadata
// (nav group, view/sub id, gate) is grounded in the REAL render switch as it
// exists on main (verified read, not painted) so Stage 2 can derive the nav
// (C3), the route allow-list (C5), and the feedback-area map (C6) from this same
// array instead of the four hand-kept lists it derives from today.
//
// BOUNDARY LAW (DR-0076, enforced by scripts/module-boundary-guard.mjs): this
// registry is core. It may name feature modules ONLY through a lazy `load`
// thunk (a dynamic import is a mount, not a static coupling); it must never
// statically `import` a feature component at the top of the file. Feature
// modules never import each other — they talk via core sync + the Events spine.

import { lazy } from 'react';
import { withSurfaceBoundary } from './lib/surface-boundary.jsx';

// Adapt a module whose component is a NAMED export to the default-shaped module
// React.lazy expects. `name` omitted ⇒ the module's default export is used.
const pick = (loader, name) =>
  name ? () => loader().then((m) => ({ default: m[name] })) : loader;

// The registry. One entry per lazy-loaded surface. `load` is the single source
// of the chunk boundary; `component` is derived from it once, below.
//   nav : 'top' | 'church' | 'books'  — which nav group mounts it
//   view: the top-level `view ===` id  (for nav:'top' this IS the route id)
//   sub : the sub-view id within church/books (churchView/booksView), else null
//   gate: human-readable note on the gate the render switch applies today
//         (declarative `requires` is migrated onto the registry in Stage 2 —
//          left descriptive here rather than fabricated; DR-0076)
export const SURFACES = [
  // ── top-level surfaces ──────────────────────────────────────────────────
  { id: 'about',        label: 'About',            nav: 'top', view: 'about',        sub: null,          load: () => import('./components/About.jsx') },
  { id: 'rentals',      label: 'Rentals',          nav: 'top', view: 'rentals',      sub: null,          load: pick(() => import('./components/Rentals.jsx'), 'Rentals') },
  { id: 'markets',      label: 'Markets',          nav: 'top', view: 'markets',      sub: null,          load: pick(() => import('./components/Markets.jsx'), 'Markets') },
  { id: 'practice',     label: 'Practice',         nav: 'top', view: 'practice',     sub: null,          gate: 'tier: VIEW_TIER_REQUIREMENTS.practice',     load: pick(() => import('./components/Practice.jsx'), 'Practice') },
  { id: 'opportunities',label: 'Opportunities',    nav: 'top', view: 'opportunities',sub: null,          gate: 'tier: VIEW_TIER_REQUIREMENTS.opportunities', load: pick(() => import('./components/DevOps.jsx'), 'Opportunities') },
  { id: 'notes',        label: 'Notes',            nav: 'top', view: 'notes',        sub: null,          load: pick(() => import('./components/ThinkingSpace.jsx'), 'ThinkingSpace') },
  { id: 'create',       label: 'Create',           nav: 'top', view: 'create',       sub: null,          load: () => import('./components/CreationWorkspace.jsx') },
  { id: 'voice',        label: 'Voice',            nav: 'top', view: 'voice',        sub: null,          load: () => import('./components/VoiceStudio.jsx') },
  { id: 'library',      label: 'Library',          nav: 'top', view: 'library',      sub: null,          gate: 'reader: any signed-in; Studio (build): family/governor', load: () => import('./components/Library.jsx') },
  { id: 'study',        label: 'Study',            nav: 'top', view: 'study',        sub: null,          gate: 'isStudyCircle',                              load: () => import('./components/Study.jsx') },
  { id: 'center',       label: 'Command & Serve',  nav: 'top', view: 'center',       sub: null,          gate: 'family/governor',                            load: () => import('./components/CommandServeCenter.jsx') },
  { id: 'crm',          label: 'CRM',              nav: 'top', view: 'crm',          sub: null,          gate: 'family/governor',                            load: pick(() => import('./components/CRM.jsx'), 'CRM') },
  { id: 'relationships',label: 'Relationships',    nav: 'top', view: 'relationships',sub: null,          gate: 'family/governor OR business tier (DR-0128)', load: pick(() => import('./components/Relationships.jsx'), 'Relationships') },
  { id: 'inventory',    label: 'Inventory',        nav: 'top', view: 'inventory',    sub: null,          gate: 'family/governor',                            load: () => import('./components/Inventory.jsx') },
  { id: 'forecast',     label: 'Forecast',         nav: 'top', view: 'forecast',     sub: null,          gate: 'family/governor',                            load: () => import('./components/Forecast.jsx') },
  // Admin absorbed the users/usage report (the former 'access' surface) into ONE
  // report and retired the separate Access tab (Darrell 2026-07-04). AdminConsole
  // now renders AccessUsageMetrics directly; there is no standalone 'access' route.
  { id: 'admin',        label: 'Admin',            nav: 'top', view: 'admin',        sub: null,          gate: 'family/governor',                            load: () => import('./components/AdminConsole.jsx') },
  { id: 'moore',        label: 'Moore Divahs',     nav: 'top', view: 'moore',        sub: null,          gate: 'family/governor',                            load: () => import('./components/MooreDivahs.jsx') },
  { id: 'cohorts',      label: 'Academy',          nav: 'top', view: 'cohorts',      sub: null,          gate: 'family/governor OR business tier',           load: () => import('./components/CohortPrograms.jsx') },
  { id: 'tlc-assistant',label: 'Assistant',        nav: 'top', view: 'tlc-assistant',sub: null,          gate: 'family/governor OR business tier',           load: () => import('./components/TlcAssistant.jsx') },
  { id: 'recipes',      label: "Chef's Corner",    nav: 'top', view: 'recipes',      sub: null,          load: () => import('./components/ChefCorner.jsx') },
  { id: 'games',        label: 'Games',            nav: 'top', view: 'games',        sub: null,          load: () => import('./components/Games.jsx') },
  { id: 'tvtime',       label: 'TV Time',          nav: 'top', view: 'tvtime',       sub: null,          load: () => import('./components/TVTime.jsx') },

  // ── church sub-surfaces (view === 'church', churchView === sub) ──────────
  { id: 'church-home',      label: 'Church Home',   nav: 'church', view: 'church', sub: 'home',       load: pick(() => import('./components/ChurchHome.jsx'), 'ChurchHome') },
  { id: 'engagement',       label: 'Engagement',    nav: 'church', view: 'church', sub: 'engagement', load: () => import('./components/Engagement.jsx') },
  { id: 'choir',            label: 'Choir',         nav: 'church', view: 'church', sub: 'choir',      load: () => import('./components/Choir.jsx') },
  { id: 'program',          label: 'Service Program', nav: 'church', view: 'church', sub: 'program',  load: () => import('./components/ServiceProgram.jsx') },
  { id: 'pulpit',           label: 'Pulpit',        nav: 'church', view: 'church', sub: 'pulpit',     load: () => import('./components/Pulpit.jsx') },
  { id: 'scripture',        label: 'Scripture',     nav: 'church', view: 'church', sub: 'scripture',  load: () => import('./components/ScriptureLibrary.jsx') },
  { id: 'videowall',        label: 'Video Wall',    nav: 'church', view: 'church', sub: 'videowall',  gate: 'isChurchStaff', load: () => import('./components/ChurchVideoWall.jsx') },
  { id: 'devices',          label: 'Devices',       nav: 'church', view: 'church', sub: 'devices',    gate: 'isChurchStaff', load: () => import('./components/DeviceInventory.jsx') },
  { id: 'infra-plan',       label: 'Infra Plan',    nav: 'church', view: 'church', sub: 'infra-plan', gate: 'isChurchStaff', load: () => import('./components/ChurchInfraPlan.jsx') },
  { id: 'harvest',          label: 'Harvest',       nav: 'church', view: 'church', sub: 'harvest',    gate: 'isChurchStaff', load: () => import('./components/HarvestLedger.jsx') },
  { id: 'observe',          label: 'Observation',   nav: 'church', view: 'church', sub: 'observe',    gate: 'isChurchStaff', load: pick(() => import('./components/ChurchObservation.jsx'), 'ChurchObservation') },
  { id: 'learn',            label: 'Learn',         nav: 'church', view: 'church', sub: 'learn',      load: () => import('./components/ChurchLearn.jsx') },
  { id: 'eternal-algorithms', label: 'Eternal Algorithms', nav: 'church', view: 'church', sub: 'eternal-algorithms', load: () => import('./components/EternalAlgorithmsStudy.jsx') },
  { id: 'conference',       label: 'Conference',    nav: 'church', view: 'church', sub: 'conference', load: pick(() => import('./components/ConferenceModule.jsx'), 'ConferenceModule') },
  { id: 'conference-var',   label: 'Conference Variance', nav: 'church', view: 'church', sub: 'conference', load: pick(() => import('./components/ConferenceVariance.jsx'), 'ConferenceVariance') },
  { id: 'event-center',     label: 'Event Center',  nav: 'church', view: 'church', sub: 'conference', load: pick(() => import('./components/EventCenterModule.jsx'), 'EventCenterModule') },
  { id: 'events',           label: 'Events',        nav: 'church', view: 'church', sub: 'events',     load: () => import('./components/EventManagement.jsx') },
  { id: 'bus',              label: 'Bus Ministry',  nav: 'church', view: 'church', sub: 'bus',        gate: 'bus-ministry member (owner/admin OR bus_drivers row)', load: () => import('./components/BusMinistry.jsx') },

  // ── books sub-surfaces (view === 'books', booksView === sub) ────────────
  { id: 'transactions', label: 'Transactions', nav: 'books', view: 'books', sub: 'transactions', load: () => import('./components/BooksTransactions.jsx') },
  { id: 'cart',  label: 'Subscriptions', nav: 'books', view: 'books', sub: 'cart',  load: pick(() => import('./components/Cart.jsx'), 'Cart') },
  { id: 'k1099', label: '1099',          nav: 'books', view: 'books', sub: 'k1099', load: pick(() => import('./components/Contractors1099.jsx'), 'Contractors1099') },
];

// Derive each lazy component ONCE from its loader and hang it on the entry.
// `lazy(s.load)` is referentially stable across renders because SURFACES is a
// module-level constant (same identity every render — no remount thrash).
// Every surface is wrapped in a per-surface error boundary at the mount layer
// (lib/surface-boundary.jsx): one broken surface degrades to one inline card
// and records to the error journal — it can never white-screen the app
// (DR-0092; the 2026-06-25 Books>Tx class, contained structurally).
for (const s of SURFACES) s.component = withSurfaceBoundary(lazy(s.load), s.label);

// Lookup by id (for the shell + future data-driven render).
export const surfaceById = Object.fromEntries(SURFACES.map((s) => [s.id, s]));

// Named exports — the shell's render switch references these bare identifiers
// today, so exporting them keeps that switch byte-for-byte unchanged while the
// loaders move out of the monolith. (Stage 2 replaces the switch with a
// registry-driven mount and these named exports retire.)
export const About            = surfaceById['about'].component;
export const Rentals          = surfaceById['rentals'].component;
export const Markets          = surfaceById['markets'].component;
export const Practice         = surfaceById['practice'].component;
export const Opportunities    = surfaceById['opportunities'].component;
export const ThinkingSpace    = surfaceById['notes'].component;
export const CreationWorkspace = surfaceById['create'].component;
export const VoiceStudio      = surfaceById['voice'].component;
export const Library          = surfaceById['library'].component;
export const Study            = surfaceById['study'].component;
export const CommandServeCenter = surfaceById['center'].component;
export const CRM              = surfaceById['crm'].component;
export const Relationships    = surfaceById['relationships'].component;
export const Inventory        = surfaceById['inventory'].component;
export const Forecast         = surfaceById['forecast'].component;
export const AdminConsole     = surfaceById['admin'].component;
export const MooreDivahs      = surfaceById['moore'].component;
export const CohortPrograms   = surfaceById['cohorts'].component;
export const TlcAssistant     = surfaceById['tlc-assistant'].component;
export const ChefCorner       = surfaceById['recipes'].component;
export const Games            = surfaceById['games'].component;
export const TVTime           = surfaceById['tvtime'].component;
export const ChurchHome       = surfaceById['church-home'].component;
export const Engagement       = surfaceById['engagement'].component;
export const Choir            = surfaceById['choir'].component;
export const ServiceProgram   = surfaceById['program'].component;
export const Pulpit           = surfaceById['pulpit'].component;
export const ScriptureLibrary = surfaceById['scripture'].component;
export const ChurchVideoWall  = surfaceById['videowall'].component;
export const DeviceInventory  = surfaceById['devices'].component;
export const ChurchInfraPlan  = surfaceById['infra-plan'].component;
export const HarvestLedger    = surfaceById['harvest'].component;
export const ChurchObservation = surfaceById['observe'].component;
export const ChurchLearn      = surfaceById['learn'].component;
export const EternalAlgorithmsStudy = surfaceById['eternal-algorithms'].component;
export const ConferenceModule = surfaceById['conference'].component;
export const ConferenceVariance = surfaceById['conference-var'].component;
export const EventCenterModule = surfaceById['event-center'].component;
export const EventManagement  = surfaceById['events'].component;
export const BusMinistry      = surfaceById['bus'].component;
export const BooksTransactions = surfaceById['transactions'].component;
export const Cart             = surfaceById['cart'].component;
export const Contractors1099  = surfaceById['k1099'].component;
